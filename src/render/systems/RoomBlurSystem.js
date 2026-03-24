/**
 * 房间光场 / 景深模糊统一系统
 *
 * 目标：
 * 1. 不再只围绕玩家做单焦点模糊；
 * 2. 玩家 / 商人 / 宝箱 / 房间环境光 / 隐藏房目标统一走同一套光场；
 * 3. 亮度、清晰度、环境揭示统一由同一批 light sources 驱动。
 */
class RoomBlurSystem {
    constructor(ctx) {
        this.ctx = ctx;
        this.enabled = true;

        this.centerX = 480;
        this.centerY = 480;
        this.focusLerp = 0.24;
        this.focusBias = 0.92;

        this.rClear = 300;
        this.rHeavy = 450;

        this.blurLight = 1.5;
        this.blurHeavy = 3;
        this.blurScale = 0.5;
        this.outerDimStrength = 0.24;
        this.outerTintStrength = 0.07;
        this.playerGlowAlpha = 0.06;
        this.bloomScale = 1.18;
        this.useFullScreenBlur = false;

        this.clearCanvas = document.createElement('canvas');
        this.clearCtx = this.clearCanvas.getContext('2d');
        this.blurCanvas = document.createElement('canvas');
        this.blurCtx = this.blurCanvas.getContext('2d');
        this.overlayCanvas = document.createElement('canvas');
        this.overlayCtx = this.overlayCanvas.getContext('2d');
        this.dimCanvas = document.createElement('canvas');
        this.dimCtx = this.dimCanvas.getContext('2d');
        this.colorCanvas = document.createElement('canvas');
        this.colorCtx = this.colorCanvas.getContext('2d');
        this.bloomCanvas = document.createElement('canvas');
        this.bloomCtx = this.bloomCanvas.getContext('2d');
        this.presentationMaskCanvas = document.createElement('canvas');
        this.presentationMaskCtx = this.presentationMaskCanvas.getContext('2d');

        this.maxUnifiedLights = 20;
        this.maxHiddenLights = 14;
        this.maxHiddenBloomLights = 8;
        this.maxHiddenColorLights = 8;
        this.maxNormalBloomLights = 12;
        this.maxNormalColorLights = 10;

        this.adaptiveQuality = true;
        this.adaptiveFrame = 0;
        this.currentQualityTier = 'full';
        this.currentBloomEvery = 1;
        this.currentColorEvery = 1;
        this.lightBudgetScale = 1;
        this.bloomAlphaScale = 1;
        this.colorAlphaScale = 1;
    }

    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    setRoomSize(width, height) {
        const prevWidth = this.clearCanvas.width || width;
        const prevHeight = this.clearCanvas.height || height;
        const scaleX = prevWidth > 0 ? width / prevWidth : 1;
        const scaleY = prevHeight > 0 ? height / prevHeight : 1;

        if (this.clearCanvas.width > 0 && this.clearCanvas.height > 0) {
            this.centerX *= scaleX;
            this.centerY *= scaleY;
        } else {
            this.centerX = width / 2;
            this.centerY = height / 2;
        }
        this.ensureBuffers(width, height);
    }

    ensureBuffers(width, height) {
        if (this.clearCanvas.width !== width || this.clearCanvas.height !== height) {
            this.clearCanvas.width = width;
            this.clearCanvas.height = height;
        }
        const blurWidth = Math.max(1, Math.floor(width * this.blurScale));
        const blurHeight = Math.max(1, Math.floor(height * this.blurScale));
        if (this.blurCanvas.width !== blurWidth || this.blurCanvas.height !== blurHeight) {
            this.blurCanvas.width = blurWidth;
            this.blurCanvas.height = blurHeight;
        }
        if (this.overlayCanvas.width !== width || this.overlayCanvas.height !== height) {
            this.overlayCanvas.width = width;
            this.overlayCanvas.height = height;
        }
        if (this.dimCanvas.width !== width || this.dimCanvas.height !== height) {
            this.dimCanvas.width = width;
            this.dimCanvas.height = height;
        }
        if (this.colorCanvas.width !== width || this.colorCanvas.height !== height) {
            this.colorCanvas.width = width;
            this.colorCanvas.height = height;
        }
        if (this.bloomCanvas.width !== width || this.bloomCanvas.height !== height) {
            this.bloomCanvas.width = width;
            this.bloomCanvas.height = height;
        }
        if (this.presentationMaskCanvas.width !== width || this.presentationMaskCanvas.height !== height) {
            this.presentationMaskCanvas.width = width;
            this.presentationMaskCanvas.height = height;
        }
    }

    updateFocus(targetX, targetY, width, height) {
        const playerX = Number.isFinite(targetX) ? targetX : width / 2;
        const playerY = Number.isFinite(targetY) ? targetY : height / 2;
        const desiredX = width / 2 + (playerX - width / 2) * this.focusBias;
        const desiredY = height / 2 + (playerY - height / 2) * this.focusBias;
        const margin = Math.min(width, height) * 0.18;
        const minX = margin;
        const maxX = width - margin;
        const minY = margin;
        const maxY = height - margin;
        const nextX = Math.min(maxX, Math.max(minX, desiredX));
        const nextY = Math.min(maxY, Math.max(minY, desiredY));

        this.centerX += (nextX - this.centerX) * this.focusLerp;
        this.centerY += (nextY - this.centerY) * this.focusLerp;
    }

    normalizeColor(color) {
        if (!color) return { r: 255, g: 220, b: 160 };
        if (typeof color === 'string') {
            const hex = color.replace('#', '').trim();
            if (hex.length === 3) {
                return {
                    r: parseInt(hex[0] + hex[0], 16),
                    g: parseInt(hex[1] + hex[1], 16),
                    b: parseInt(hex[2] + hex[2], 16)
                };
            }
            if (hex.length >= 6) {
                return {
                    r: parseInt(hex.slice(0, 2), 16),
                    g: parseInt(hex.slice(2, 4), 16),
                    b: parseInt(hex.slice(4, 6), 16)
                };
            }
        }
        if (typeof color.r === 'number' && typeof color.g === 'number' && typeof color.b === 'number') {
            return { r: color.r, g: color.g, b: color.b };
        }
        return { r: 255, g: 220, b: 160 };
    }

    toTransparent(color) {
        if (typeof color !== 'string') return 'rgba(0,0,0,0)';
        const rgba = color.match(/^rgba?\(([^)]+)\)$/i);
        if (rgba) {
            const parts = rgba[1].split(',').map((p) => p.trim());
            if (parts.length >= 3) return `rgba(${parts[0]}, ${parts[1]}, ${parts[2]}, 0)`;
        }
        if (color.startsWith('#')) {
            const c = this.normalizeColor(color);
            return `rgba(${c.r}, ${c.g}, ${c.b}, 0)`;
        }
        return 'rgba(0,0,0,0)';
    }

    resolveScreenPosition(light, camera) {
        if (Number.isFinite(light.screenX) && Number.isFinite(light.screenY)) {
            return { x: light.screenX, y: light.screenY };
        }
        if (Number.isFinite(light.x) && Number.isFinite(light.y) && camera && typeof camera.worldToScreen === 'function') {
            return camera.worldToScreen(light.x, light.y);
        }
        if (Number.isFinite(light.x) && Number.isFinite(light.y)) {
            return { x: light.x, y: light.y };
        }
        return null;
    }


    isPinnedHiddenLight(light) {
        const kind = String(light?.kind || '');
        return /^(hidden_template_mushroom|hidden_mushroom|hidden_memory_mushroom|hidden_placed_decor_mushroom|hidden_decor_mushroom|hidden_candle|hidden_seal_target|hidden_seal_blocker|hidden_orb|legacy_|floor2_worm_red)/.test(kind);
    }

    getLightPriority(light, focusX, focusY, hiddenRoom = false) {
        if (!light) return -Infinity;
        const kind = String(light.kind || '');
        let priority = (light.reveal || 0) * 2.6 + (light.alpha || 0) * 1.8 + (light.clarity || 0) * 0.9;
        if (light.preferColor) priority += 0.25;
        if (light.preserveSharpness) priority += Math.min(0.5, light.preserveSharpness * 0.4);
        if (/player_presence|player_focus/.test(kind)) priority += 5.0;
        if (/hidden_orb|legacy_/.test(kind)) priority += 4.0;
        if (/hidden_focus|hidden_template|hidden_memory|hidden_mushroom|hidden_placed_decor|hidden_decor|hidden_candle|hidden_seal|floor2_worm_red/.test(kind)) priority += 2.2;
        if (/ambient_|room_/.test(kind)) priority -= 0.35;
        if (/worm_/.test(kind) && hiddenRoom) priority += 0.4;
        if (hiddenRoom && this.isPinnedHiddenLight(light)) priority += 6.0;
        if (Number.isFinite(focusX) && Number.isFinite(focusY)) {
            const dx = (light.x || 0) - focusX;
            const dy = (light.y || 0) - focusY;
            const dist = Math.hypot(dx, dy);
            priority -= Math.min(2.0, dist / (hiddenRoom ? 260 : 360));
        }
        return priority;
    }

    prioritizeLightSources(lightSources, focusX, focusY, hiddenRoom = false) {
        if (!Array.isArray(lightSources) || lightSources.length <= 1) return Array.isArray(lightSources) ? lightSources : [];
        const scored = lightSources.map((light, index) => ({
            light,
            index,
            priority: this.getLightPriority(light, focusX, focusY, hiddenRoom)
        }));
        scored.sort((a, b) => {
            if (b.priority !== a.priority) return b.priority - a.priority;
            return a.index - b.index;
        });

        const maxLights = hiddenRoom ? this.maxHiddenLights : this.maxUnifiedLights;
        const result = [];
        const kindCounts = new Map();
        const pinned = hiddenRoom ? scored.filter((entry) => this.isPinnedHiddenLight(entry.light)) : [];
        const rest = hiddenRoom ? scored.filter((entry) => !this.isPinnedHiddenLight(entry.light)) : scored;

        for (const entry of pinned) {
            result.push(entry.light);
            if (result.length >= maxLights) return result;
        }
        for (const entry of rest) {
            const light = entry.light;
            const kind = String(light.kind || 'generic');
            const family = kind.split('_').slice(0, 2).join('_') || kind;
            const familyLimit = hiddenRoom
                ? (/^(ambient_|room_)/.test(kind) ? 2 : (/worm_/.test(kind) ? 2 : 4))
                : 5;
            const current = kindCounts.get(family) || 0;
            if (current >= familyLimit) continue;
            result.push(light);
            kindCounts.set(family, current + 1);
            if (result.length >= maxLights) break;
        }
        return result;
    }

    trimLightSourcesForPass(lightSources, hiddenRoom, pass = 'bloom') {
        if (!Array.isArray(lightSources) || lightSources.length <= 1) return Array.isArray(lightSources) ? lightSources : [];
        const maxCount = pass === 'bloom'
            ? (hiddenRoom ? this.maxHiddenBloomLights : this.maxNormalBloomLights)
            : (hiddenRoom ? this.maxHiddenColorLights : this.maxNormalColorLights);
        const scaled = Math.max(1, Math.floor(maxCount * (this.lightBudgetScale || 1)));
        return lightSources.slice(0, scaled);
    }

    getAdaptiveProfile(game, width, height) {
        if (!this.adaptiveQuality) {
            return { tier: 'full', bloomEvery: 1, colorEvery: 1, lightBudgetScale: 1, bloomAlphaScale: 1, colorAlphaScale: 1 };
        }
        const budgetProfile = window.RenderBudgetManager?.getBudget(game, game?.curRoom || null, width, height)?.blurProfile;
        if (budgetProfile) {
            return { ...budgetProfile };
        }
        const room = game?.curRoom || null;
        const particles = game?.particles?.active?.length || 0;
        const enemies = room?.enemies?.length || game?.enemies?.length || 0;
        const bullets = Array.isArray(game?.bullets) ? game.bullets.length : 0;
        const blood = game?.bloodStains && typeof game.bloodStains.getRoomStains === 'function'
            ? game.bloodStains.getRoomStains(room).length
            : 0;
        const scalePenalty = (width * height) > (960 * 960) ? 0.5 : 0;
        const pressure = (particles / 220) + (blood / 54) + (enemies / 18) + (bullets / 42) + scalePenalty;

        if (pressure >= 4.4) {
            return { tier: 'low', bloomEvery: 3, colorEvery: 2, lightBudgetScale: 0.55, bloomAlphaScale: 0.72, colorAlphaScale: 0.76 };
        }
        if (pressure >= 3.0) {
            return { tier: 'medium', bloomEvery: 2, colorEvery: 1, lightBudgetScale: 0.72, bloomAlphaScale: 0.84, colorAlphaScale: 0.88 };
        }
        return { tier: 'full', bloomEvery: 1, colorEvery: 1, lightBudgetScale: 1, bloomAlphaScale: 1, colorAlphaScale: 1 };
    }

    normalizeLightSource(light, camera, index, time) {
        if (!light || light.disabled) return null;
        const pos = this.resolveScreenPosition(light, camera);
        if (!pos || !Number.isFinite(pos.x) || !Number.isFinite(pos.y)) return null;

        const pulseSpeed = Number.isFinite(light.pulseSpeed) ? light.pulseSpeed : 0;
        const pulseAmount = Number.isFinite(light.pulseAmount) ? light.pulseAmount : 0;
        const phase = Number.isFinite(light.phase) ? light.phase : (index * 0.73);
        const pulse = pulseSpeed > 0 ? (1 + Math.sin(time * pulseSpeed + phase) * pulseAmount) : 1;
        const flicker = Number.isFinite(light.flicker)
            ? Math.max(0.2, light.flicker)
            : (Number.isFinite(light.flickerAmount) ? (1 + Math.sin(time * 9 + phase) * light.flickerAmount) : 1);

        const radiusX = Math.max(10, (light.radiusX ?? light.radius ?? 72) * pulse);
        const radiusY = Math.max(10, (light.radiusY ?? light.radius ?? 58) * pulse);
        const bloomRadius = Math.max(6, (light.bloomRadius ?? (Math.max(radiusX, radiusY) * 0.52)) * pulse);
        const baseAlpha = this.clamp(light.alpha ?? light.intensity ?? 0.45, 0, 1.45);
        const baseReveal = this.clamp(light.reveal ?? baseAlpha ?? 0.8, 0, 1.45);
        const baseClarity = this.clamp(light.clarity ?? light.reveal ?? baseAlpha ?? 0.9, 0, 1.5);
        const color = this.normalizeColor(light.color);
        const kind = light.kind || 'generic';
        const hiddenRoom = window.game?.curRoom?.type === 'hidden';
        const isPlayerFocus = kind === 'player_focus' || kind === 'player_presence' || kind === 'hidden_focus_candle' || kind === 'hidden_focus_mushroom';
        const isHiddenFeature = hiddenRoom && /^(hidden_|legacy_|floor2_worm|hidden_orb|room_|worm_|ambient_worm|secret_worm|rabbit_|player_presence)/.test(kind);
        const isSelfLitBody = !!light.noBloom;
        const alphaBoost = isPlayerFocus ? 1 : (isHiddenFeature ? 1.26 : (isSelfLitBody ? 0.96 : 1.0));
        const revealBoost = isHiddenFeature ? 1.22 : 1;
        const clarityBoost = isHiddenFeature ? 1.12 : 1;
        const alpha = this.clamp(baseAlpha * alphaBoost, 0, 1.45);
        const reveal = this.clamp(baseReveal * revealBoost, 0, 1.45);
        const clarity = this.clamp(baseClarity * clarityBoost, 0, 1.5);
        const baseBloomAlpha = this.clamp(light.bloomAlpha ?? (baseAlpha * 0.14 + baseReveal * 0.04), 0, 1);
        const bloomAlpha = this.clamp(baseBloomAlpha * (isPlayerFocus || isSelfLitBody ? 1 : (isHiddenFeature ? 1.34 : 0.94)), 0, 1);
        const baseHaloAlpha = light.haloAlpha ?? (baseAlpha * 0.08 + baseReveal * 0.03);
        const haloAlpha = this.clamp(baseHaloAlpha * (isPlayerFocus || isSelfLitBody ? 1 : (isHiddenFeature ? 1.22 : 0.92)), 0, 0.72);
        const inferredColorize = hiddenRoom && (light.preferColor || isHiddenFeature)
            ? Math.min(0.18, (baseAlpha * 0.16) + (baseReveal * 0.06))
            : 0;
        const colorizeAlpha = this.clamp(light.colorizeAlpha ?? inferredColorize, 0, 0.9);
        const colorizeRadiusMul = this.clamp(light.colorizeRadiusMul ?? (isHiddenFeature ? 1.26 : 1.12), 1, 2.8);
        const preserveSharpness = this.clamp(light.preserveSharpness ?? (isHiddenFeature ? 0.22 : 0), 0, 1.4);

        return {
            kind,
            x: pos.x,
            y: pos.y,
            radiusX,
            radiusY,
            bloomRadius,
            color,
            alpha: alpha * flicker,
            reveal: reveal * flicker,
            clarity: clarity,
            bloomAlpha,
            haloAlpha,
            haloRadiusMul: this.clamp(light.haloRadiusMul ?? 1.36, 1, 2.8),
            colorizeAlpha,
            colorizeRadiusMul,
            preserveSharpness,
            preferColor: !!light.preferColor,
            screenSpace: true,
            noBloom: !!light.noBloom,
            selfVisibleOnly: !!light.selfVisibleOnly
        };
    }

    collectRoomSources(game, time) {
        const room = game?.curRoom;
        if (!room || typeof room.getPresentationLightSources !== 'function') return [];
        const sources = room.getPresentationLightSources(time);
        return Array.isArray(sources) ? sources : [];
    }

    collectTreasureSources(game) {
        return [];
    }

    collectShopkeeperSources(game) {
        const renderData = game?.shopkeeperPresentationData;
        const candleLight = renderData?.candleLight;
        if (!candleLight) return [];
        return [{
            kind: 'shopkeeper',
            screenX: candleLight.flameX,
            screenY: candleLight.flameY - 12 * candleLight.scale,
            radiusX: 178 * candleLight.scale,
            radiusY: 132 * candleLight.scale,
            bloomRadius: 58 * candleLight.scale,
            color: { r: 154, g: 86, b: 220 },
            alpha: 0.32,
            reveal: 0.52,
            clarity: 1.1,
            bloomAlpha: 0.08,
            haloAlpha: 0.05,
            haloRadiusMul: 1.16,
            colorizeAlpha: 0.3,
            colorizeRadiusMul: 1.24,
            preserveSharpness: 0.92,
            preferColor: true,
            pulseSpeed: 1.8,
            pulseAmount: 0.02
        }];
    }

    collectFocusSources(focusX, focusY, canvasScale) {
        const centerX = Number.isFinite(focusX) ? focusX : this.centerX;
        const centerY = Number.isFinite(focusY) ? focusY : this.centerY;
        const game = window.game || null;
        const room = game?.curRoom || null;
        const hiddenRoom = room?.type === 'hidden';
        if (hiddenRoom) {
            return [{
                kind: 'player_presence',
                screenX: centerX,
                screenY: centerY + 10 * canvasScale,
                radiusX: 42 * canvasScale,
                radiusY: 32 * canvasScale,
                bloomRadius: 8 * canvasScale,
                color: { r: 180, g: 196, b: 214 },
                alpha: 0.012,
                reveal: 0.04,
                clarity: 0.08,
                bloomAlpha: 0,
                haloAlpha: 0,
                noBloom: true,
                preserveSharpness: 0.18
            }];
        }
        const playerGlowAlpha = this.playerGlowAlpha;
        return [{
            kind: 'player_focus',
            screenX: centerX,
            screenY: centerY,
            radiusX: this.rClear * canvasScale,
            radiusY: this.rClear * 0.92 * canvasScale,
            bloomRadius: 52 * canvasScale,
            color: { r: 255, g: 220, b: 164 },
            alpha: playerGlowAlpha,
            reveal: 1.0,
            clarity: 0.92,
            bloomAlpha: 0.03,
            haloAlpha: 0,
            noBloom: false
        }];
    }

    collectUnifiedLightSources(game, focusX, focusY, canvasScale, time) {
        const raw = [
            ...this.collectFocusSources(focusX, focusY, canvasScale),
            ...this.collectRoomSources(game, time),
            ...this.collectTreasureSources(game),
            ...this.collectShopkeeperSources(game)
        ];

        const camera = game?.camera || null;
        const sources = [];
        raw.forEach((light, index) => {
            const normalized = this.normalizeLightSource(light, camera, index, time);
            if (normalized) sources.push(normalized);
        });
        return this.prioritizeLightSources(sources, focusX, focusY, game?.curRoom?.type === 'hidden');
    }

    renderPresentationMask(game, time, width, height) {
        const ctx = this.presentationMaskCtx;
        ctx.clearRect(0, 0, width, height);
        const room = game?.curRoom;
        const camera = game?.camera;
        if (!room || !camera || typeof room.drawPresentationCritters !== 'function') return;
        room.drawPresentationCritters(ctx, camera, time, { renderMode: 'mask' });
    }

    drawEllipticalGradient(ctx, light, innerRadiusMul, outerRadiusMul, colorAtCenter, colorAtMid, colorAtOuter) {
        const outerX = Math.max(8, light.radiusX * outerRadiusMul);
        const outerY = Math.max(8, light.radiusY * outerRadiusMul);
        ctx.save();
        ctx.translate(light.x, light.y);
        ctx.scale(1, outerY / outerX);
        const gradient = ctx.createRadialGradient(0, 0, outerX * innerRadiusMul, 0, 0, outerX);
        gradient.addColorStop(0, colorAtCenter);
        gradient.addColorStop(0.38, colorAtMid);
        gradient.addColorStop(0.8, colorAtOuter);
        gradient.addColorStop(1, this.toTransparent(colorAtOuter));
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, outerX, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    renderBlurLayer(lightSources, width, height) {
        const ctx = this.overlayCtx;
        ctx.clearRect(0, 0, width, height);
        if (!this.useFullScreenBlur) return;
        ctx.drawImage(this.blurCanvas, 0, 0, width, height);
        ctx.globalCompositeOperation = 'destination-out';
        lightSources.forEach((light) => {
            if (light.selfVisibleOnly) return;
            const clarity = this.clamp(light.clarity, 0, 1.2);
            const playerLikeFocus = light.kind === 'player_focus' || light.kind === 'player_presence' || light.kind === 'hidden_focus_candle' || light.kind === 'hidden_focus_mushroom';
            const inner = playerLikeFocus ? 0.06 : 0.08;
            const outer = playerLikeFocus ? 1.06 : 1.14;
            const carve = playerLikeFocus ? clarity * 0.88 : clarity * 0.72;
            this.drawEllipticalGradient(
                ctx,
                light,
                inner,
                outer,
                `rgba(0,0,0,${Math.min(1, carve)})`,
                `rgba(0,0,0,${Math.min(1, carve * 0.46)})`,
                `rgba(0,0,0,${carve * 0.04})`
            );
            if (light.preserveSharpness > 0.01) {
                const sharpness = this.clamp(light.preserveSharpness, 0, 1.2) * 0.42;
                this.drawEllipticalGradient(
                    ctx,
                    light,
                    0.03,
                    0.72,
                    `rgba(0,0,0,${Math.min(1, 0.52 * sharpness)})`,
                    `rgba(0,0,0,${Math.min(1, 0.22 * sharpness)})`,
                    `rgba(0,0,0,${0.01 * sharpness})`
                );
            }
        });
        ctx.globalCompositeOperation = 'source-over';
    }

    renderDarknessLayer(lightSources, width, height) {
        const ctx = this.dimCtx;
        ctx.clearRect(0, 0, width, height);
        const hiddenRoom = window.game?.curRoom?.type === 'hidden';
        ctx.fillStyle = `rgba(2, 3, 5, ${hiddenRoom ? 0.82 : this.outerDimStrength})`;
        ctx.fillRect(0, 0, width, height);

        if (!hiddenRoom) {
            const canvasScale = Math.min(width, height) / 960;
            const currentFloor = window.game?.currentFloor || 1;
            const darknessBoost = currentFloor >= 6 ? 1.14 : 1;
            const vignetteInner = 58 * canvasScale;
            const vignetteOuter = 340 * canvasScale;
            const ambientGrad = ctx.createRadialGradient(
                this.centerX,
                this.centerY,
                vignetteInner,
                this.centerX,
                this.centerY,
                vignetteOuter
            );
            ambientGrad.addColorStop(0, 'rgba(5, 8, 12, 0)');
            ambientGrad.addColorStop(0.18, 'rgba(5, 8, 12, 0)');
            ambientGrad.addColorStop(0.34, `rgba(5, 7, 10, ${0.10 * darknessBoost})`);
            ambientGrad.addColorStop(0.56, `rgba(4, 5, 8, ${0.24 * darknessBoost})`);
            ambientGrad.addColorStop(0.76, `rgba(3, 4, 7, ${0.46 * darknessBoost})`);
            ambientGrad.addColorStop(0.9, `rgba(2, 3, 5, ${0.68 * darknessBoost})`);
            ambientGrad.addColorStop(1, `rgba(1, 2, 4, ${Math.min(0.88, 0.82 * darknessBoost)})`);
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = ambientGrad;
            ctx.fillRect(0, 0, width, height);
        }

        ctx.globalCompositeOperation = 'destination-out';
        lightSources.forEach((light) => {
            if (light.selfVisibleOnly) return;
            const hiddenRevealMul = /^(hidden_|legacy_|floor2_worm|hidden_orb|room_|worm_|ambient_worm|secret_worm|rabbit_|player_presence)/.test(light.kind) ? 0.96 : 0.82;
            const reveal = this.clamp(light.reveal * (hiddenRoom ? hiddenRevealMul : (light.kind === 'player_focus' ? 0.86 : 0.94)), 0, 1.18);
            this.drawEllipticalGradient(
                ctx,
                light,
                light.kind === 'player_focus' ? 0.06 : 0.04,
                light.kind === 'player_focus' ? 1.18 : 1.28,
                `rgba(0,0,0,${Math.min(1, 0.86 * reveal)})`,
                `rgba(0,0,0,${Math.min(1, 0.42 * reveal)})`,
                `rgba(0,0,0,${0.03 * reveal})`
            );
        });
        ctx.globalAlpha = hiddenRoom ? 1 : 0.92;
        ctx.drawImage(this.presentationMaskCanvas, 0, 0, width, height);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
    }

    renderBloomLayer(lightSources, width, height) {
        const ctx = this.bloomCtx;
        ctx.clearRect(0, 0, width, height);
        const hiddenRoom = window.game?.curRoom?.type === 'hidden';
        const bloomSources = this.trimLightSourcesForPass(lightSources, hiddenRoom, 'bloom');
        ctx.globalCompositeOperation = 'screen';
        bloomSources.forEach((light) => {
            if (light.noBloom || light.selfVisibleOnly) return;
            const color = light.color;
            const haloAlpha = this.clamp((light.haloAlpha ?? 0) * (this.bloomAlphaScale || 1), 0, 0.72);
            const glowAlpha = this.clamp(light.bloomAlpha * (this.bloomAlphaScale || 1), 0, 0.92);
            const bloomX = Math.max(12, light.bloomRadius * this.bloomScale);
            const bloomY = Math.max(10, bloomX * (light.radiusY / Math.max(8, light.radiusX)));
            if (haloAlpha > 0.01) {
                const haloRadiusMul = this.clamp(light.haloRadiusMul ?? 1.36, 1, 2.8);
                this.drawEllipticalGradient(
                    ctx,
                    { ...light, radiusX: light.radiusX * haloRadiusMul, radiusY: light.radiusY * haloRadiusMul },
                    0.06,
                    1,
                    `rgba(${color.r}, ${color.g}, ${color.b}, ${haloAlpha})`,
                    `rgba(${color.r}, ${color.g}, ${color.b}, ${haloAlpha * 0.46})`,
                    `rgba(${color.r}, ${color.g}, ${color.b}, ${haloAlpha * 0.06})`
                );
            }
            this.drawEllipticalGradient(
                ctx,
                { ...light, radiusX: bloomX, radiusY: bloomY },
                0.02,
                1,
                `rgba(${color.r}, ${color.g}, ${color.b}, ${glowAlpha})`,
                `rgba(${color.r}, ${color.g}, ${color.b}, ${glowAlpha * 0.46})`,
                `rgba(${color.r}, ${color.g}, ${color.b}, ${glowAlpha * 0.06})`
            );
        });
        ctx.globalCompositeOperation = 'source-over';
    }

    renderColorLayer(lightSources, width, height) {
        const ctx = this.colorCtx;
        ctx.clearRect(0, 0, width, height);
        const hiddenRoom = window.game?.curRoom?.type === 'hidden';
        const colorSources = this.trimLightSourcesForPass(lightSources, hiddenRoom, 'color');
        ctx.globalCompositeOperation = 'screen';
        colorSources.forEach((light) => {
            if (light.selfVisibleOnly) return;
            const colorizeAlpha = this.clamp((light.colorizeAlpha ?? 0) * (this.colorAlphaScale || 1), 0, 0.9);
            if (colorizeAlpha <= 0.001) return;
            const color = light.color;
            const radiusMul = this.clamp(light.colorizeRadiusMul ?? 1.12, 1, 2.8);
            this.drawEllipticalGradient(
                ctx,
                { ...light, radiusX: light.radiusX * radiusMul, radiusY: light.radiusY * radiusMul },
                0.04,
                1,
                `rgba(${color.r}, ${color.g}, ${color.b}, ${colorizeAlpha})`,
                `rgba(${color.r}, ${color.g}, ${color.b}, ${colorizeAlpha * 0.44})`,
                `rgba(${color.r}, ${color.g}, ${color.b}, ${colorizeAlpha * 0.04})`
            );
        });
        ctx.globalCompositeOperation = 'source-over';
    }

    render(focusX, focusY) {
        if (!this.enabled) return;

        const canvas = this.ctx.canvas;
        const w = canvas.width || 960;
        const h = canvas.height || 960;
        const canvasScale = Math.min(w, h) / 960;
        const time = Date.now() / 1000;
        const game = typeof window !== 'undefined' ? window.game : null;
        const hiddenRoom = game?.curRoom?.type === 'hidden';
        this.ensureBuffers(w, h);
        this.adaptiveFrame = (this.adaptiveFrame + 1) % 4096;
        const adaptive = this.getAdaptiveProfile(game, w, h);
        this.currentQualityTier = adaptive.tier;
        this.currentBloomEvery = adaptive.bloomEvery;
        this.currentColorEvery = adaptive.colorEvery;
        this.lightBudgetScale = adaptive.lightBudgetScale;
        this.bloomAlphaScale = adaptive.bloomAlphaScale;
        this.colorAlphaScale = adaptive.colorAlphaScale;
        if (hiddenRoom) {
            this.centerX = w * 0.5;
            this.centerY = h * 0.5;
        } else {
            this.updateFocus(focusX, focusY, w, h);
        }

        const lightSources = this.collectUnifiedLightSources(game, focusX, focusY, canvasScale, time);
        if (!hiddenRoom && this.useFullScreenBlur) {
            this.clearCtx.clearRect(0, 0, w, h);
            this.clearCtx.drawImage(canvas, 0, 0);
            const blurStrength = Math.max(
                0.8,
                ((this.blurLight + this.blurHeavy) * 0.5) * canvasScale
            );
            this.blurCtx.clearRect(0, 0, this.blurCanvas.width, this.blurCanvas.height);
            this.blurCtx.filter = `blur(${blurStrength}px)`;
            this.blurCtx.drawImage(this.clearCanvas, 0, 0, this.blurCanvas.width, this.blurCanvas.height);
            this.blurCtx.filter = 'none';
            this.renderPresentationMask(game, time, w, h);
            this.blurCtx.globalCompositeOperation = 'destination-out';
            this.blurCtx.drawImage(this.presentationMaskCanvas, 0, 0, this.blurCanvas.width, this.blurCanvas.height);
            this.blurCtx.globalCompositeOperation = 'source-over';
            this.renderBlurLayer(lightSources, w, h);
        } else {
            this.overlayCtx.clearRect(0, 0, w, h);
        }
        this.renderDarknessLayer(lightSources, w, h);
        if ((this.adaptiveFrame % this.currentColorEvery) === 0) {
            this.renderColorLayer(lightSources, w, h);
        }
        if ((this.adaptiveFrame % this.currentBloomEvery) === 0) {
            this.renderBloomLayer(lightSources, w, h);
        }

        this.ctx.save();
        if (typeof this.ctx.resetTransform === 'function') {
            this.ctx.resetTransform();
        } else {
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
        this.ctx.drawImage(this.overlayCanvas, 0, 0);
        this.ctx.drawImage(this.dimCanvas, 0, 0);
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'screen';
        this.ctx.globalAlpha = hiddenRoom ? 0.42 : 1;
        this.ctx.drawImage(this.colorCanvas, 0, 0);
        this.ctx.globalAlpha = hiddenRoom ? 0.66 : 1;
        this.ctx.drawImage(this.bloomCanvas, 0, 0);
        this.ctx.restore();
        this.ctx.restore();
    }
}

if (typeof window !== 'undefined') window.RoomBlurSystem = RoomBlurSystem;
if (typeof module !== 'undefined') module.exports = RoomBlurSystem;
