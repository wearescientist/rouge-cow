// ============================================================
// v0.23-fix - 简化轮廓系统 (Simple Outline System)
// 替代多边形轮廓：只用圆形发光，不用多边形
// ============================================================

export class SimpleOutlineSystem {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        // 简化配置 - 只用发光，不用多边形
        this.styles = {
            player: { color: '#4488ff', glow: 15, alpha: 0.6 },
            enemy: { color: '#ff4444', glow: 10, alpha: 0.4 },
            pet: { color: '#44ff44', glow: 12, alpha: 0.5 },
            item: { color: '#ffaa00', glow: 8, alpha: 0.7, pulse: true }
        };
        
        this.time = 0;
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
    }
    
    update(dt) {
        this.time += dt;
    }
    
    /**
     * 绘制简化发光轮廓 - 只用圆形
     */
    drawGlowOutline(ctx, entity, type, camera) {
        const style = this.styles[type];
        if (!style) return;
        
        const pos = camera.worldToScreen(entity.x, entity.y);
        const size = (entity.size || 24) * camera.zoom;
        
        ctx.save();
        
        // 脉动效果（仅物品）
        let glowSize = style.glow;
        let alpha = style.alpha;
        
        if (style.pulse) {
            const pulse = 0.7 + Math.sin(this.time * 3) * 0.3;
            glowSize *= pulse;
            alpha *= pulse;
        }
        
        // 外层发光
        ctx.globalAlpha = alpha * 0.5;
        ctx.fillStyle = style.color;
        ctx.shadowBlur = glowSize;
        ctx.shadowColor = style.color;
        
        ctx.beginPath();
        ctx.arc(pos.x, pos.y - size * 0.3, size * 0.7, 0, Math.PI * 2);
        ctx.fill();
        
        // 内层实心
        ctx.globalAlpha = alpha * 0.3;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y - size * 0.3, size * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    /**
     * 绘制遮挡高亮（当实体被遮挡时）
     */
    drawOcclusionHighlight(ctx, entity, camera) {
        const pos = camera.worldToScreen(entity.x, entity.y);
        const size = (entity.size || 24) * camera.zoom;
        
        ctx.save();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.8;
        ctx.setLineDash([4, 4]);
        
        ctx.beginPath();
        ctx.arc(pos.x, pos.y - size * 0.3, size * 0.75, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }
}
