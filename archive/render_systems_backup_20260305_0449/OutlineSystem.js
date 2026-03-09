// ============================================================
// v0.23-r13 - 轮廓描边系统 (Outline System)
// HD-2D风格：角色边缘高亮、卡通描边、深度边缘
// ============================================================

export class OutlineSystem {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        // 描边配置
        this.config = {
            playerOutline: {
                enabled: true,
                color: '#ffffff',
                thickness: 2,
                glow: 4,
                alpha: 0.8
            },
            enemyOutline: {
                enabled: true,
                color: '#ff4444',
                thickness: 1.5,
                glow: 0,
                alpha: 0.6
            },
            petOutline: {
                enabled: true,
                color: '#44ff44',
                thickness: 1.5,
                glow: 2,
                alpha: 0.7
            },
            itemOutline: {
                enabled: true,
                color: '#ffaa00',
                thickness: 1,
                glow: 3,
                alpha: 0.9,
                pulse: true
            }
        };
        
        this.time = 0;
    }
    
    update(dt) {
        this.time += dt;
    }
    
    /**
     * 绘制实体轮廓
     */
    drawOutline(ctx, entity, type, camera) {
        const config = this.config[type + 'Outline'];
        if (!config || !config.enabled) return;
        
        const pos = camera.worldToScreen(entity.x, entity.y);
        const size = (entity.size || 24) * camera.zoom;
        
        ctx.save();
        
        // 脉动效果（用于物品）
        let alpha = config.alpha;
        if (config.pulse) {
            alpha *= (0.7 + Math.sin(this.time * 3) * 0.3);
        }
        
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = config.color;
        ctx.lineWidth = config.thickness;
        
        // 发光效果
        if (config.glow > 0) {
            ctx.shadowBlur = config.glow;
            ctx.shadowColor = config.color;
        }
        
        // 绘制轮廓形状
        ctx.beginPath();
        
        switch(type) {
            case 'player':
                // 玩家使用八角形轮廓
                this.drawOctagon(ctx, pos.x, pos.y - size * 0.3, size * 0.8);
                break;
            case 'enemy':
                // 敌人使用圆形轮廓
                ctx.arc(pos.x, pos.y - size * 0.3, size * 0.6, 0, Math.PI * 2);
                break;
            case 'pet':
                // 宠物使用方形轮廓
                ctx.rect(pos.x - size * 0.5, pos.y - size * 0.8, size, size * 0.8);
                break;
            case 'item':
                // 物品使用菱形轮廓
                this.drawDiamond(ctx, pos.x, pos.y - size * 0.3, size * 0.5);
                break;
        }
        
        ctx.stroke();
        
        // 内部细线
        ctx.globalAlpha = alpha * 0.3;
        ctx.lineWidth = config.thickness * 2;
        ctx.stroke();
        
        ctx.restore();
    }
    
    drawOctagon(ctx, x, y, radius) {
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
    }
    
    drawDiamond(ctx, x, y, size) {
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size, y);
        ctx.lineTo(x, y + size);
        ctx.lineTo(x - size, y);
        ctx.closePath();
    }
    
    /**
     * 批量绘制轮廓（优化）
     */
    drawOutlinesBatch(ctx, entities, type, camera) {
        const config = this.config[type + 'Outline'];
        if (!config || !config.enabled) return;
        
        ctx.save();
        ctx.strokeStyle = config.color;
        ctx.lineWidth = config.thickness;
        ctx.globalAlpha = config.alpha;
        
        if (config.glow > 0) {
            ctx.shadowBlur = config.glow;
            ctx.shadowColor = config.color;
        }
        
        entities.forEach(entity => {
            if (!entity || entity.hp <= 0) return;
            
            const pos = camera.worldToScreen(entity.x, entity.y);
            const size = (entity.size || 24) * camera.zoom;
            
            ctx.beginPath();
            
            if (type === 'enemy') {
                ctx.arc(pos.x, pos.y - size * 0.3, size * 0.6, 0, Math.PI * 2);
            } else if (type === 'pet') {
                ctx.rect(pos.x - size * 0.5, pos.y - size * 0.8, size, size * 0.8);
            }
            
            ctx.stroke();
        });
        
        ctx.restore();
    }
    
    /**
     * 绘制选择性轮廓（基于深度）
     */
    drawSelectiveOutline(ctx, entity, camera, isBehindObject = false) {
        if (isBehindObject) {
            // 被遮挡时显示更强轮廓
            ctx.save();
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.9;
            ctx.setLineDash([5, 3]);
            
            const pos = camera.worldToScreen(entity.x, entity.y);
            const size = (entity.size || 24) * camera.zoom;
            
            ctx.beginPath();
            ctx.arc(pos.x, pos.y - size * 0.3, size * 0.7, 0, Math.PI * 2);
            ctx.stroke();
            
            ctx.restore();
        }
    }
    
    /**
     * 绘制环境边缘光（Rim Light）
     */
    drawRimLight(ctx, entity, camera, lightDir) {
        const pos = camera.worldToScreen(entity.x, entity.y);
        const size = (entity.size || 24) * camera.zoom;
        
        // 计算边缘光方向（与光源相反的一侧）
        const rimX = pos.x + lightDir.x * size * 0.5;
        const rimY = pos.y - size * 0.3 + lightDir.y * size * 0.5;
        
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = 0.5;
        
        const gradient = ctx.createRadialGradient(
            rimX, rimY, 0,
            rimX, rimY, size * 0.8
        );
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(rimX, rimY, size * 0.8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}
