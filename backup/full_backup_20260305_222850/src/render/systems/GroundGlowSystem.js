/**
 * 脚底柔光系统 - Ground Glow System
 * 玩家脚下椭圆光晕，模拟地面反光
 */
class GroundGlowSystem {
    constructor(ctx) {
        this.ctx = ctx;
        this.enabled = true;
        this.params = {
            radiusX: 45,         // 更大
            radiusY: 22,         // 更扁
            color: '#ffdd66',    // 更亮的暖黄
            coreAlpha: 0.6,      // 更强
            edgeAlpha: 0.15,
            offsetY: 12
        };
    }

    render(x, y) {
        if (!this.enabled) return;

        const { radiusX, radiusY, color, coreAlpha, edgeAlpha, offsetY } = this.params;
        const rgb = this.hexToRgb(color);
        
        const gradient = this.ctx.createRadialGradient(
            x, y + offsetY, 0,
            x, y + offsetY, radiusX
        );

        gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${coreAlpha})`);
        gradient.addColorStop(0.4, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${coreAlpha * 0.5})`);
        gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${edgeAlpha})`);

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.ellipse(x, y + offsetY, radiusX, radiusY, 0, 0, Math.PI * 2);
        this.ctx.fill();
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 170, b: 68 };
    }

    setParams(params) {
        Object.assign(this.params, params);
    }
}

if (typeof module !== 'undefined') module.exports = GroundGlowSystem;
