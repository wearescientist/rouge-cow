// ============================================================
// v0.23-r4 - 阴影系统 (Shadow System)
// HD-2D风格：软阴影、接触阴影、环境光遮蔽
// ============================================================

export class ShadowSystem {
    constructor() {
        this.shadowOffset = { x: 8, y: 6 };
        this.shadowAlpha = 0.45;
        this.shadowBlur = 6;
        
        // v0.23-fix: 简化阴影配置 - 只保留一层柔和阴影
        this.floorShadows = {
            1: { offsetX: 4, offsetY: 3, alpha: 0.2, blur: 6, color: '#1a2a23' },
            2: { offsetX: 5, offsetY: 4, alpha: 0.18, blur: 7, color: '#1a2a1a' },
            3: { offsetX: 3, offsetY: 5, alpha: 0.25, blur: 8, color: '#2a1a2a' },
            4: { offsetX: 2, offsetY: 6, alpha: 0.3, blur: 10, color: '#3d1a0a' },
            5: { offsetX: 4, offsetY: 3, alpha: 0.22, blur: 7, color: '#2a2a0a' },
            6: { offsetX: 0, offsetY: 2, alpha: 0.35, blur: 10, color: '#2a0505' }
        };
        
        this.currentFloor = 1;
        
        // v0.24-r13: 增强阴影系统
        this.shadowLayers = 3; // 多层阴影
        this.contactShadowIntensity = 0.6; // 接触阴影强度
        this.ambientOcclusionRadius = 20; // 环境光遮蔽半径
    }
    
    setFloor(floor) {
        this.currentFloor = floor;
        const config = this.floorShadows[floor];
        if (config) {
            this.shadowOffset.x = config.offsetX;
            this.shadowOffset.y = config.offsetY;
            this.shadowAlpha = config.alpha;
            this.shadowBlur = config.blur;
        }
    }
    
    /**
     * v0.23-r4: HD-2D风格软阴影
     * v2.0: 支持 SpriteData 的精确模型边界
     */
    drawShadow(ctx, entity, camera, type = 'entity') {
        // 计算脚底屏幕位置
        let feetX = entity.x, feetY = entity.y;
        let modelWidth = entity.size || 24;
        
        // 使用 SpriteData 获取精确模型宽度
        if (entity._spriteData) {
            const scale = entity._renderScale || (entity.isBoss ? 1.5 : 0.67);
            const modelSize = entity._spriteData.getModelSize(scale);
            modelWidth = modelSize.width;
            
            // 获取精确的脚底位置
            const feetPos = entity._spriteData.getFeetPosition(entity.x, entity.y, scale);
            feetX = feetPos.x;
            feetY = feetPos.y;
        }
        
        const pos = camera.worldToScreen(feetX, feetY);
        const config = this.floorShadows[this.currentFloor];
        
        ctx.save();
        
        // 计算阴影大小（基于模型实际宽度）
        let width, height;
        
        switch(type) {
            case 'player':
            case 'pet':
                width = (modelWidth * 0.8) * camera.zoom;
                height = (modelWidth * 0.25) * camera.zoom;
                break;
            case 'enemy':
                width = (modelWidth * 0.7) * camera.zoom;
                height = (modelWidth * 0.22) * camera.zoom;
                break;
            case 'obstacle':
                width = 24 * camera.zoom;
                height = 10 * camera.zoom;
                break;
            default:
                width = (modelWidth * 0.6) * camera.zoom;
                height = (modelWidth * 0.2) * camera.zoom;
        }
        
        // v0.24-r13: 多层阴影系统
        
        // 1. 最外层模糊阴影（环境阴影）
        ctx.globalAlpha = this.shadowAlpha * 0.5;
        ctx.fillStyle = config?.color || '#000';
        ctx.filter = `blur(${this.shadowBlur * 1.5}px)`;
        ctx.beginPath();
        ctx.ellipse(
            pos.x + this.shadowOffset.x * camera.zoom * 1.2,
            pos.y + this.shadowOffset.y * camera.zoom * 1.2,
            width * 1.3,
            height * 1.4,
            0, 0, Math.PI * 2
        );
        ctx.fill();
        
        // 2. 中层阴影（主阴影）
        ctx.globalAlpha = this.shadowAlpha * 0.8;
        ctx.filter = `blur(${this.shadowBlur}px)`;
        ctx.beginPath();
        ctx.ellipse(
            pos.x + this.shadowOffset.x * camera.zoom,
            pos.y + this.shadowOffset.y * camera.zoom,
            width * 1.1,
            height * 1.2,
            0, 0, Math.PI * 2
        );
        ctx.fill();
        
        // 3. 接触阴影（紧贴实体底部）
        ctx.globalAlpha = this.contactShadowIntensity;
        ctx.filter = 'blur(2px)';
        ctx.beginPath();
        ctx.ellipse(
            pos.x,
            pos.y + 2 * camera.zoom,
            width * 0.8,
            height * 0.8,
            0, 0, Math.PI * 2
        );
        ctx.fill();
        
        ctx.restore();
    }
    
    /**
     * 批量绘制阴影（优化）
     * v0.23-fix: 简化为单层阴影
     */
    drawShadowsBatch(ctx, entities, camera) {
        const config = this.floorShadows[this.currentFloor];
        
        ctx.save();
        ctx.globalAlpha = this.shadowAlpha;
        ctx.fillStyle = config?.color || '#000';
        ctx.filter = `blur(${this.shadowBlur}px)`;
        
        entities.forEach(entity => {
            if (!entity || entity.hp <= 0) return;
            
            let feetX = entity.x, feetY = entity.y;
            let modelWidth = entity.size || 24;
            
            // v0.25-fix: 支持宠物的 _renderScale 和 renderScale
            if (entity._spriteData) {
                const scale = entity.renderScale || entity._renderScale || (entity.isBoss ? 1.5 : 0.67);
                const modelSize = entity._spriteData.getModelSize(scale);
                modelWidth = modelSize.width;
                const feetPos = entity._spriteData.getFeetPosition(entity.x, entity.y, scale);
                feetX = feetPos.x;
                feetY = feetPos.y;
            }
            
            const pos = camera.worldToScreen(feetX, feetY);
            const size = modelWidth * 0.55 * camera.zoom;
            
            ctx.beginPath();
            ctx.ellipse(
                pos.x + this.shadowOffset.x * camera.zoom,
                pos.y + this.shadowOffset.y * camera.zoom,
                size * 1.1,
                size * 0.4,
                0, 0, Math.PI * 2
            );
            ctx.fill();
        });
        
        ctx.restore();
    }
}
