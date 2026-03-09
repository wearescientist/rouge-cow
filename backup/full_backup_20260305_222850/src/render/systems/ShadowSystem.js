/**
 * 阴影系统 - Shadow System
 * 为角色添加脚下投影
 */
class ShadowSystem {
    constructor(ctx) {
        this.ctx = ctx;
        this.enabled = true;
        this.params = {
            radiusX: 12,
            radiusY: 5,
            alpha: 0.35,
            offsetY: 10,
            blur: 2
        };
    }

    render(x, y, scale = 1) {
        if (!this.enabled) return;

        const { radiusX, radiusY, alpha, offsetY, blur } = this.params;
        const scaledRadiusX = radiusX * scale;
        const scaledRadiusY = radiusY * scale;
        const scaledAlpha = alpha * (0.7 + 0.3 * scale);

        this.ctx.save();
        
        const shadowY = y + offsetY;

        const gradient = this.ctx.createRadialGradient(
            x, shadowY, 0,
            x, shadowY, scaledRadiusX
        );

        gradient.addColorStop(0, `rgba(0, 0, 0, ${scaledAlpha})`);
        gradient.addColorStop(0.6, `rgba(0, 0, 0, ${scaledAlpha * 0.6})`);
        gradient.addColorStop(1, `rgba(0, 0, 0, 0)`);

        this.ctx.fillStyle = gradient;
        
        if (blur > 0) {
            this.ctx.filter = `blur(${blur}px)`;
        }

        this.ctx.beginPath();
        this.ctx.ellipse(x, shadowY, scaledRadiusX, scaledRadiusY, 0, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }

    renderBatch(entities) {
        if (!this.enabled || !entities.length) return;

        for (const entity of entities) {
            this.render(entity.x, entity.y, entity.scale || 1);
        }
    }

    setParams(params) {
        Object.assign(this.params, params);
    }
}

if (typeof module !== 'undefined') module.exports = ShadowSystem;
