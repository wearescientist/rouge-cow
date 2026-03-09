/**
 * 背后轮廓光系统 - Backlight System
 * 贴在角色贴图后层的发光效果
 */
class BacklightSystem {
    constructor(ctx) {
        this.ctx = ctx;
        this.enabled = true;
        this.params = {
            radius: 80,          // 更大范围
            color: '#ffeeaa',    // 更亮的暖白
            alpha: 0.9,          // 接近最强亮度
            pulseSpeed: 0.002,
            pulseRange: 0.1,
            offsetY: -10         // 稍微偏上，更像逆光
        };
        this.time = 0;
    }

    update(deltaTime) {
        this.time += deltaTime;
    }

    render(x, y, width = 32, height = 32) {
        if (!this.enabled) return;

        const { radius, color, alpha, pulseSpeed, pulseRange, offsetY } = this.params;
        const pulse = Math.sin(this.time * pulseSpeed) * pulseRange;
        const currentAlpha = alpha + pulse;
        const currentRadius = radius * (1 + pulse * 0.5);
        const rgb = this.hexToRgb(color);

        // 第1层：暗色描边（紧贴角色，提升对比度）
        const outlineRadius = Math.max(width, height) * 0.7;  // 更厚
        const outlineGradient = this.ctx.createRadialGradient(
            x, y, outlineRadius * 0.2,  // 内圈更小
            x, y, outlineRadius
        );
        outlineGradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        outlineGradient.addColorStop(0.5, 'rgba(30, 20, 15, 0.6)');  // 更深、更浓
        outlineGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        this.ctx.fillStyle = outlineGradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y, outlineRadius, 0, Math.PI * 2);
        this.ctx.fill();

        // 第2层：暖色轮廓光（在描边外面）
        const innerRadius = Math.max(width, height) * 0.7;
        const innerGradient = this.ctx.createRadialGradient(
            x, y + offsetY, innerRadius * 0.4,
            x, y + offsetY, innerRadius
        );

        innerGradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);
        innerGradient.addColorStop(0.5, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${currentAlpha * 0.9})`);
        innerGradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

        this.ctx.fillStyle = innerGradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y + offsetY, innerRadius, 0, Math.PI * 2);
        this.ctx.fill();

        // 第3层：外圈光晕（大范围）
        const outerGradient = this.ctx.createRadialGradient(
            x, y + offsetY, 0,
            x, y + offsetY, currentRadius
        );

        outerGradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${currentAlpha * 0.6})`);
        outerGradient.addColorStop(0.3, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${currentAlpha * 0.3})`);
        outerGradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0)`);

        this.ctx.fillStyle = outerGradient;
        this.ctx.beginPath();
        this.ctx.arc(x, y + offsetY, currentRadius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 204, b: 102 };
    }

    setParams(params) {
        Object.assign(this.params, params);
    }
}

if (typeof module !== 'undefined') module.exports = BacklightSystem;
