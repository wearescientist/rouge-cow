/**
 * Shadow System
 * 先固定脚底接触影，再叠加一层朝远离房间中心方向偏移的柔影。
 */
class ShadowSystem {
    constructor(ctx) {
        this.ctx = ctx;
        this.enabled = true;
        this.params = {
            radiusX: 17.2,
            radiusY: 7.5,
            alpha: 0.56,
            offsetY: 0,
            blur: 3.0
        };
    }

    render(x, y, scale = 1, options = {}) {
        if (!this.enabled) return;

        const { radiusX, radiusY, alpha, offsetY, blur } = this.params;
        const sizeMultiplier = options.sizeMultiplier ?? 1;
        const alphaMultiplier = options.alphaMultiplier ?? 1;
        const roomCenterX = options.roomCenterX ?? ((this.ctx.canvas.width || 960) / 2);
        const roomCenterY = options.roomCenterY ?? ((this.ctx.canvas.height || 960) / 2);
        const dx = x - roomCenterX;
        const dy = y - roomCenterY;
        const dist = Math.hypot(dx, dy);
        const dirX = dist > 0.001 ? dx / dist : 0;
        const dirY = dist > 0.001 ? dy / dist : 1;
        const maxRadius = Math.max(1, Math.min(this.ctx.canvas.width || 960, this.ctx.canvas.height || 960) * 0.5);
        const normalizedDist = Math.min(1, dist / maxRadius);

        const footX = x;
        const footY = y + offsetY;

        const cast = (1 + normalizedDist * 4.5) * scale;
        const tailX = footX + dirX * cast;
        const tailY = footY + dirY * cast * 0.18;
        const tailAngle = Math.atan2(dirY, dirX) * 0.08;

        const tailRadiusX = radiusX * scale * sizeMultiplier * (1 + normalizedDist * 0.4);
        const tailRadiusY = radiusY * scale * sizeMultiplier * Math.max(0.9, 1 - normalizedDist * 0.05);
        const tailAlpha = alpha * alphaMultiplier * (0.92 + normalizedDist * 0.26) * (0.78 + 0.32 * scale);
        const blurPx = Math.max(1, blur * (0.85 + normalizedDist * 0.45));

        const coreRadiusX = tailRadiusX * 0.62;
        const coreRadiusY = tailRadiusY * 0.94;
        const coreAlpha = Math.min(0.72, tailAlpha * 1.22);

        this.ctx.save();

        const gradient = this.ctx.createRadialGradient(
            tailX, tailY, 0,
            tailX, tailY, tailRadiusX
        );
        gradient.addColorStop(0, `rgba(0, 0, 0, ${tailAlpha})`);
        gradient.addColorStop(0.6, `rgba(0, 0, 0, ${tailAlpha * 0.72})`);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        this.ctx.fillStyle = gradient;
        this.ctx.filter = `blur(${blurPx}px)`;
        this.ctx.beginPath();
        this.ctx.ellipse(tailX, tailY, tailRadiusX, tailRadiusY, tailAngle, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.filter = 'none';
        this.ctx.fillStyle = `rgba(0, 0, 0, ${coreAlpha})`;
        this.ctx.beginPath();
        this.ctx.ellipse(footX, footY, coreRadiusX, coreRadiusY, 0, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }

    renderBatch(entities) {
        if (!this.enabled || !entities.length) return;

        for (const entity of entities) {
            this.render(entity.x, entity.y, entity.scale || 1, entity.options || {});
        }
    }

    setParams(params) {
        Object.assign(this.params, params);
    }
}

if (typeof module !== 'undefined') module.exports = ShadowSystem;
