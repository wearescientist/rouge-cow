/**
 * 房间景深模糊系统
 *
 * 以 960x960 画布为基准定义模糊半径，运行时按实际画布等比例缩放。
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
        this.outerDimStrength = 0.28;
        this.outerTintStrength = 0.1;

        this.clearCanvas = document.createElement('canvas');
        this.clearCtx = this.clearCanvas.getContext('2d');
        this.blurCanvas = document.createElement('canvas');
        this.blurCtx = this.blurCanvas.getContext('2d');
        this.overlayCanvas = document.createElement('canvas');
        this.overlayCtx = this.overlayCanvas.getContext('2d');
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

    render(focusX, focusY) {
        if (!this.enabled) return;

        const canvas = this.ctx.canvas;
        const w = canvas.width || 960;
        const h = canvas.height || 960;
        const canvasScale = Math.min(w, h) / 960;
        this.ensureBuffers(w, h);
        this.updateFocus(focusX, focusY, w, h);
        const cx = this.centerX;
        const cy = this.centerY;
        const rClear = this.rClear * canvasScale;
        const rHeavy = this.rHeavy * canvasScale;
        const blurStrength = Math.max(
            0.8,
            ((this.blurLight + this.blurHeavy) * 0.5) * canvasScale
        );
        const innerFadeRadius = rClear * 0.92;
        const outerFadeRadius = rHeavy * 1.08;

        this.clearCtx.clearRect(0, 0, w, h);
        this.clearCtx.drawImage(canvas, 0, 0);

        this.blurCtx.clearRect(0, 0, this.blurCanvas.width, this.blurCanvas.height);
        this.blurCtx.filter = `blur(${blurStrength}px)`;
        this.blurCtx.drawImage(this.clearCanvas, 0, 0, this.blurCanvas.width, this.blurCanvas.height);
        this.blurCtx.filter = 'none';

        this.overlayCtx.clearRect(0, 0, w, h);
        this.overlayCtx.drawImage(this.blurCanvas, 0, 0, w, h);
        this.overlayCtx.globalCompositeOperation = 'destination-in';

        const blurMask = this.overlayCtx.createRadialGradient(
            cx, cy, innerFadeRadius,
            cx, cy, outerFadeRadius
        );
        blurMask.addColorStop(0, 'rgba(255,255,255,0)');
        blurMask.addColorStop(0.22, 'rgba(255,255,255,0.04)');
        blurMask.addColorStop(0.48, 'rgba(255,255,255,0.18)');
        blurMask.addColorStop(0.72, 'rgba(255,255,255,0.46)');
        blurMask.addColorStop(0.9, 'rgba(255,255,255,0.82)');
        blurMask.addColorStop(1, 'rgba(255,255,255,1)');
        this.overlayCtx.fillStyle = blurMask;
        this.overlayCtx.fillRect(0, 0, w, h);
        this.overlayCtx.globalCompositeOperation = 'source-over';

        this.ctx.save();
        if (typeof this.ctx.resetTransform === 'function') {
            this.ctx.resetTransform();
        } else {
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
        this.ctx.drawImage(this.overlayCanvas, 0, 0);

        const dimGradient = this.ctx.createRadialGradient(
            cx, cy, rClear * 0.58,
            cx, cy, outerFadeRadius * 1.14
        );
        dimGradient.addColorStop(0, 'rgba(6, 8, 12, 0)');
        dimGradient.addColorStop(0.42, `rgba(6, 8, 12, ${this.outerDimStrength * 0.08})`);
        dimGradient.addColorStop(0.7, `rgba(6, 8, 12, ${this.outerDimStrength * 0.42})`);
        dimGradient.addColorStop(0.9, `rgba(5, 7, 10, ${this.outerDimStrength * 0.78})`);
        dimGradient.addColorStop(1, `rgba(4, 6, 9, ${this.outerDimStrength})`);
        this.ctx.fillStyle = dimGradient;
        this.ctx.fillRect(0, 0, w, h);

        const tintGradient = this.ctx.createRadialGradient(
            cx, cy, rClear * 0.72,
            cx, cy, outerFadeRadius * 1.08
        );
        tintGradient.addColorStop(0, 'rgba(22, 24, 34, 0)');
        tintGradient.addColorStop(0.68, `rgba(18, 20, 30, ${this.outerTintStrength * 0.26})`);
        tintGradient.addColorStop(1, `rgba(14, 16, 25, ${this.outerTintStrength})`);
        this.ctx.fillStyle = tintGradient;
        this.ctx.fillRect(0, 0, w, h);
        this.ctx.restore();
    }
}

if (typeof window !== 'undefined') window.RoomBlurSystem = RoomBlurSystem;

if (typeof module !== 'undefined') module.exports = RoomBlurSystem;
