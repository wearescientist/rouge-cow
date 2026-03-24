/**
 * HD2DRenderer - HD-2D effect coordinator
 */
class HD2DRenderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.width = canvas.width || 960;
        this.height = canvas.height || 600;

        this.ambience = new AmbienceSystem(ctx, this.width, this.height);
        this.lighting = new CaveLightingSystem(ctx, this.width, this.height);
        this.shadow = new ShadowSystem(ctx);
        this.tiltShift = new TiltShiftSystem(ctx, this.width, this.height);
        this.roomBlur = new RoomBlurSystem(ctx);
        this.colorGrading = new ColorGradingSystem(ctx);
        this.activePreset = 'cinematic';
        this.applyPreset(this.activePreset);
        this.roomBlur.setRoomSize(this.width, this.height);
        this.tiltShift.enabled = false;
        this.roomBlur.useFullScreenBlur = false;
        this.postProcessFocus = {
            x: this.width / 2,
            y: this.height / 2
        };
    }

    update(dt, player, camera) {
        this.lighting.update(dt, player, camera);
        this.ambience.update(dt, this.width, this.height);
    }

    render(ctx, player, camera) {
        if (camera) {
            this.ambience.render(ctx, camera);
        }

        if (player && camera) {
            this.lighting.render(ctx, player, camera);
        }
    }

    renderPlayerBacklight(player, screenX, screenY, zoom = 1) {
        const canvas = this.ctx.canvas;
        this.shadow.render(screenX, screenY, zoom, {
            fixedShadow: true,
            sizeMultiplier: 1.08,
            alphaMultiplier: 0.94,
            offsetY: 2
        });
    }

    renderFinalPostProcess(playerScreenX, playerScreenY) {
        const useRoomBlur = !!(this.roomBlur && this.roomBlur.enabled);
        const centerX = (this.ctx.canvas.width || 960) / 2;
        const centerY = (this.ctx.canvas.height || 960) / 2;
        const focusX = Number.isFinite(playerScreenX) ? playerScreenX : centerX;
        const focusY = Number.isFinite(playerScreenY) ? playerScreenY : centerY;

        this.postProcessFocus.x = focusX;
        this.postProcessFocus.y = focusY;

        if (useRoomBlur) {
            this.roomBlur.render(this.postProcessFocus.x, this.postProcessFocus.y);
        }

        if (!useRoomBlur) {
            this.renderPlayerVignette(focusX, focusY);
        }
        this.colorGrading.render();
    }

    renderPostProcess(playerScreenX, playerScreenY) {
        this.renderFinalPostProcess(playerScreenX, playerScreenY);
    }

    renderPlayerVignette(x, y) {
        const canvas = this.ctx.canvas;
        const w = canvas.width || 900;
        const h = canvas.height || 600;
        const hiddenRoom = window.game?.curRoom?.type === 'hidden';
        const focusX = Number.isFinite(x) ? x : this.postProcessFocus.x || w / 2;
        const focusY = Number.isFinite(y) ? y : this.postProcessFocus.y || h / 2;
        const canvasScale = Math.min(w, h) / 960;
        const currentFloor = window.game?.currentFloor || 1;
        const darknessBoost = currentFloor >= 6 ? 1.14 : 1;
        const lightRadius = 42 * canvasScale;
        const vignetteInner = 58 * canvasScale;
        const vignetteOuter = 340 * canvasScale;

        this.ctx.save();
        if (typeof this.ctx.resetTransform === 'function') {
            this.ctx.resetTransform();
        } else {
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        }

        if (!hiddenRoom) {
            const lightGradient = this.ctx.createRadialGradient(focusX, focusY, 0, focusX, focusY, lightRadius);
            lightGradient.addColorStop(0, 'rgba(255, 224, 170, 0.007)');
            lightGradient.addColorStop(0.32, 'rgba(255, 206, 138, 0.002)');
            lightGradient.addColorStop(1, 'rgba(255, 200, 120, 0)');
            this.ctx.globalCompositeOperation = 'screen';
            this.ctx.fillStyle = lightGradient;
            this.ctx.fillRect(0, 0, w, h);
        }

        this.ctx.restore();
        this.ctx.save();
        if (typeof this.ctx.resetTransform === 'function') {
            this.ctx.resetTransform();
        } else {
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        }

        if (hiddenRoom) {
            this.ctx.fillStyle = 'rgba(2, 4, 8, 0.56)';
            this.ctx.fillRect(0, 0, w, h);
        } else {
            const grad = this.ctx.createRadialGradient(focusX, focusY, vignetteInner, focusX, focusY, vignetteOuter);
            grad.addColorStop(0, 'rgba(5, 8, 12, 0)');
            grad.addColorStop(0.18, 'rgba(5, 8, 12, 0)');
            grad.addColorStop(0.34, `rgba(5, 7, 10, ${0.12 * darknessBoost})`);
            grad.addColorStop(0.56, `rgba(4, 5, 8, ${0.28 * darknessBoost})`);
            grad.addColorStop(0.76, `rgba(3, 4, 7, ${0.54 * darknessBoost})`);
            grad.addColorStop(0.9, `rgba(2, 3, 5, ${0.76 * darknessBoost})`);
            grad.addColorStop(1, `rgba(1, 2, 4, ${Math.min(0.94, 0.88 * darknessBoost)})`);
            this.ctx.fillStyle = grad;
            this.ctx.fillRect(0, 0, w, h);
        }

        this.ctx.restore();
    }

    generateRoom(roomWidth, roomHeight, wallThickness) {
        this.lighting.generateCaveLights(roomWidth, roomHeight, wallThickness);
    }

    resize(w, h) {
        this.width = w;
        this.height = h;
        this.ambience.resize(w, h);
        this.lighting.resize(w, h);
        if (this.tiltShift) {
            this.tiltShift.resize(w, h);
        }
        if (this.roomBlur) {
            this.roomBlur.setRoomSize(w, h);
        }
        this.postProcessFocus.x = w / 2;
        this.postProcessFocus.y = h / 2;
    }

    applyPreset(name = 'light') {
        const presetSource = typeof HD2DEffects !== 'undefined' ? HD2DEffects : null;
        const preset = presetSource?.presets?.[name];
        if (!preset) return;

        this.activePreset = name;
        if (this.tiltShift && preset.tiltShift) {
            this.tiltShift.setParams(preset.tiltShift);
        }
        if (this.shadow && preset.shadow) {
            this.shadow.setParams(preset.shadow);
        }
        if (this.colorGrading && preset.colorGrading) {
            this.colorGrading.setParams(preset.colorGrading);
        }
        if (this.roomBlur) {
            this.roomBlur.blurLight = name === 'cinematic' ? 2.2 : 1.5;
            this.roomBlur.blurHeavy = name === 'cinematic' ? 4.6 : 3;
            this.roomBlur.rClear = name === 'cinematic' ? 190 : 280;
            this.roomBlur.rHeavy = name === 'cinematic' ? 345 : 430;
            this.roomBlur.outerDimStrength = name === 'cinematic' ? 0.34 : 0.22;
            this.roomBlur.outerTintStrength = name === 'cinematic' ? 0.12 : 0.06;
            this.roomBlur.useFullScreenBlur = false;
        }
    }
}

if (typeof module !== 'undefined') module.exports = HD2DRenderer;
