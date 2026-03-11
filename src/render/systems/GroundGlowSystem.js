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
        // 脚下的光已禁用 - 陛下要求移除大椭圆
        return;
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
