// ============================================================
// v0.23-fix - 简化装饰系统 (Simple Decor System)
// 替代复杂植被：使用简单圆形/方形装饰，不画多边形
// ============================================================

export class SimpleDecorSystem {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        // 装饰配置（简单几何形状）
        this.decors = [];
        
        // 装饰类型（只用简单形状）
        this.decorTypes = {
            rock: { shape: 'circle', color: '#666', size: [10, 20] },
            grass: { shape: 'rect', color: '#5c8a6b', size: [3, 8] },
            flower: { shape: 'circle', color: '#ff69b4', size: [4, 6] },
            mushroom: { shape: 'circle', color: '#8b4513', size: [5, 10] },
            crystal: { shape: 'diamond', color: '#88ccff', size: [6, 12] }
        };
        
        this.time = 0;
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
    }
    
    generateRoomDecor(roomBounds, floor) {
        // 清除旧装饰
        this.decors = [];
        
        // 根据楼层生成装饰
        const types = this.getFloorDecorTypes(floor);
        const count = 5 + Math.floor(Math.random() * 10);
        
        for (let i = 0; i < count; i++) {
            const type = types[Math.floor(Math.random() * types.length)];
            const config = this.decorTypes[type];
            
            this.decors.push({
                x: roomBounds.x + Math.random() * roomBounds.width,
                y: roomBounds.y + Math.random() * roomBounds.height,
                type: type,
                color: config.color,
                size: config.size[0] + Math.random() * (config.size[1] - config.size[0]),
                shape: config.shape,
                phase: Math.random() * Math.PI * 2
            });
        }
    }
    
    getFloorDecorTypes(floor) {
        switch(floor) {
            case 1: return ['grass', 'mushroom', 'rock'];
            case 2: return ['grass', 'flower', 'rock'];
            case 3: return ['crystal', 'rock'];
            case 4: return ['rock', 'crystal'];
            case 5: return ['rock', 'grass'];
            case 6: return ['crystal', 'rock'];
            default: return ['rock'];
        }
    }
    
    update(dt, floor) {
        this.time += dt;
    }
    
    draw(ctx, camera) {
        ctx.save();
        
        this.decors.forEach(d => {
            const pos = camera.worldToScreen(d.x, d.y);
            const size = d.size * camera.zoom;
            
            ctx.fillStyle = d.color;
            ctx.globalAlpha = 0.8;
            
            switch(d.shape) {
                case 'circle':
                    // 石头/蘑菇 - 简单圆形
                    ctx.beginPath();
                    ctx.arc(pos.x, pos.y - size/2, size/2, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                    
                case 'rect':
                    // 草 - 简单竖线
                    const sway = Math.sin(this.time * 2 + d.phase) * 3;
                    ctx.fillRect(pos.x - 1, pos.y - size, 2, size);
                    // 稍微摇摆
                    ctx.fillRect(pos.x + sway - 1, pos.y - size * 0.8, 2, size * 0.8);
                    break;
                    
                case 'diamond':
                    // 水晶 - 简单菱形（四边形）
                    ctx.beginPath();
                    ctx.moveTo(pos.x, pos.y - size);
                    ctx.lineTo(pos.x + size/2, pos.y - size/2);
                    ctx.lineTo(pos.x, pos.y);
                    ctx.lineTo(pos.x - size/2, pos.y - size/2);
                    ctx.closePath();
                    ctx.fill();
                    break;
            }
        });
        
        ctx.restore();
    }
}
