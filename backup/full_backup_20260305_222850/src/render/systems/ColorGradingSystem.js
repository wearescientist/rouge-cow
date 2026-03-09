/**
 * 暖色调映射系统 - Color Grading System
 * 全局后处理，添加暖色调
 */
class ColorGradingSystem {
    constructor(ctx) {
        this.ctx = ctx;
        this.enabled = true;
        this.params = {
            warmth: 0.15,
            saturation: 1.05,
            contrast: 1.02,
            tintColor: '#ffaa66',
            tintAlpha: 0.08
        };
    }

    render() {
        if (!this.enabled) return;

        const { tintColor, tintAlpha } = this.params;
        const rgb = this.hexToRgb(tintColor);
        
        // 使用 canvas 实际尺寸（带安全默认值）
        const canvas = this.ctx.canvas;
        const width = (canvas.clientWidth || canvas.width || 900);
        const height = (canvas.clientHeight || canvas.height || 600);

        // 径向渐变暖色叠加
        const gradient = this.ctx.createRadialGradient(
            width / 2, height / 2, 0,
            width / 2, height / 2, Math.max(width, height) * 0.7
        );

        gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${tintAlpha * 1.5})`);
        gradient.addColorStop(0.6, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${tintAlpha})`);
        gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${tintAlpha * 0.5})`);

        this.ctx.save();
        this.ctx.globalCompositeOperation = 'overlay';
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, width, height);
        this.ctx.restore();
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 170, b: 102 };
    }

    setParams(params) {
        Object.assign(this.params, params);
    }
}

if (typeof module !== 'undefined') module.exports = ColorGradingSystem;
