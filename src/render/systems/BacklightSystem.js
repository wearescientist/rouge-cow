/**
 * 背后轮廓光系统 - Backlight System
 * 贴在角色贴图后层的发光效果
 * 
 * v0.32-fix: 修复光环位置 - 现在围绕贴图中心而非脚底
 */
class BacklightSystem {
    constructor(ctx) {
        this.ctx = ctx;
        this.enabled = true; // v0.32-fix: 环状绘制已移除
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

    /**
     * v0.32-fix: 围绕实体贴图绘制光环
     * @param {Object} entity - 实体对象，必须有 spriteData 和 x, y
     * @param {Object} camera - 相机对象，用于坐标转换
     */
    render(entity, camera) {
        if (!this.enabled || !entity) return;
        
        // 获取 SpriteData
        let spriteData = entity.spriteData;
        if (!spriteData && entity.typeKey) {
            spriteData = window.spriteDataRegistry?.get(entity.typeKey);
        }
        if (!spriteData) return; // 没有贴图数据，不绘制

        const { color, alpha } = this.params;
        const rgb = this.hexToRgb(color);
        
        // v0.32-fix: 需要将世界坐标转换为屏幕坐标
        let screenX, screenY;
        if (camera && camera.worldToScreen) {
            const screenPos = camera.worldToScreen(entity.x, entity.y);
            // 计算中心点偏移
            const center = spriteData.getCenterPosition(entity.x, entity.y, 1, 'feet');
            screenX = screenPos.x - (entity.x - center.x) * camera.zoom;
            screenY = screenPos.y - (entity.y - center.y) * camera.zoom;
        } else {
            // 如果没有相机，假设已经是屏幕坐标
            const center = spriteData.getCenterPosition(entity.x, entity.y, 1, 'feet');
            screenX = center.x;
            screenY = center.y;
        }
        
        // 获取模型尺寸
        const modelSize = spriteData.getModelSize(1);
        
        // v0.32-fix: 环状轮廓光已完全移除（过于违和）
        // 如需添加贴图描边效果，建议直接在贴图素材上处理
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
