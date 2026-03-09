// ============================================================
// v0.23-r19 - 次表面散射系统 (Subsurface Scattering System)
// HD-2D风格：皮肤、植物、蜡质等半透明材质的光线穿透效果
// ============================================================

export class SubsurfaceScatterSystem {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        // 散射参数
        this.scatterConfig = {
            skin: {
                scatterColor: '#ffccaa',
                scatterDistance: 20,
                scatterStrength: 0.4,
                opacity: 0.6,
                blurRadius: 8
            },
            plant: {
                scatterColor: '#88ff88',
                scatterDistance: 15,
                scatterStrength: 0.5,
                opacity: 0.7,
                blurRadius: 6
            },
            wax: {
                scatterColor: '#ffeebb',
                scatterDistance: 25,
                scatterStrength: 0.6,
                opacity: 0.8,
                blurRadius: 10
            },
            jelly: {
                scatterColor: '#ff88ff',
                scatterDistance: 30,
                scatterStrength: 0.7,
                opacity: 0.9,
                blurRadius: 12
            },
            marble: {
                scatterColor: '#ffffff',
                scatterDistance: 10,
                scatterStrength: 0.3,
                opacity: 0.5,
                blurRadius: 4
            }
        };
        
        // 离屏canvas用于模糊处理
        this.blurCanvas = document.createElement('canvas');
        this.blurCanvas.width = Math.floor(width / 4);
        this.blurCanvas.height = Math.floor(height / 4);
        this.blurCtx = this.blurCanvas.getContext('2d');
        
        this.time = 0;
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.blurCanvas.width = Math.floor(width / 4);
        this.blurCanvas.height = Math.floor(height / 4);
    }
    
    update(dt) {
        this.time += dt;
    }
    
    /**
     * 应用次表面散射效果
     */
    applySSS(ctx, entity, camera, type = 'skin', lightPos) {
        const config = this.scatterConfig[type];
        if (!config) return;
        
        const pos = camera.worldToScreen(entity.x, entity.y);
        const size = (entity.size || 24) * camera.zoom;
        
        ctx.save();
        
        // 1. 绘制散射光晕（背光效果）
        if (lightPos) {
            this.drawBacklightScatter(ctx, pos.x, pos.y, size, config, lightPos);
        }
        
        // 2. 绘制边缘透光
        this.drawEdgeScatter(ctx, pos.x, pos.y, size, config);
        
        // 3. 绘制体积散射
        this.drawVolumeScatter(ctx, pos.x, pos.y, size, config);
        
        ctx.restore();
    }
    
    drawBacklightScatter(ctx, x, y, size, config, lightPos) {
        // 计算背光方向
        const dx = x - lightPos.x;
        const dy = y - lightPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist === 0) return;
        
        // 背光散射位置（与光源相反的一侧）
        const scatterX = x + (dx / dist) * size * 0.5;
        const scatterY = y + (dy / dist) * size * 0.5;
        
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        
        // 散射渐变
        const gradient = ctx.createRadialGradient(
            scatterX, scatterY, 0,
            scatterX, scatterY, size * 1.2
        );
        
        const alpha = config.scatterStrength * (1 - Math.min(1, dist / 300));
        gradient.addColorStop(0, this.hexToRgba(config.scatterColor, alpha));
        gradient.addColorStop(0.5, this.hexToRgba(config.scatterColor, alpha * 0.5));
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(scatterX, scatterY, size * 1.2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    drawEdgeScatter(ctx, x, y, size, config) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        
        // 边缘透光 - 让边缘看起来更柔软
        const gradient = ctx.createRadialGradient(
            x, y, size * 0.4,
            x, y, size * 0.9
        );
        
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(0.7, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, this.hexToRgba(config.scatterColor, config.opacity * 0.5));
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.9, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    drawVolumeScatter(ctx, x, y, size, config) {
        ctx.save();
        ctx.globalCompositeOperation = 'overlay';
        
        // 体积散射内部发光
        const gradient = ctx.createRadialGradient(
            x, y - size * 0.1, 0,
            x, y, size * 0.7
        );
        
        gradient.addColorStop(0, this.hexToRgba(config.scatterColor, config.scatterStrength * 0.6));
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.7, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    /**
     * 批量SSS渲染（优化）
     */
    applyBatchSSS(ctx, entities, camera, type, lightPos) {
        const config = this.scatterConfig[type];
        if (!config) return;
        
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        
        entities.forEach(entity => {
            if (!entity || entity.hp <= 0) return;
            
            const pos = camera.worldToScreen(entity.x, entity.y);
            const size = (entity.size || 24) * camera.zoom;
            
            // 简化的散射效果
            const gradient = ctx.createRadialGradient(
                pos.x, pos.y, size * 0.5,
                pos.x, pos.y, size
            );
            
            gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
            gradient.addColorStop(1, this.hexToRgba(config.scatterColor, config.opacity * 0.3));
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.restore();
    }
    
    /**
     * 绘制植物叶子的透光效果
     */
    drawLeafScatter(ctx, x, y, width, height, rotation, lightDir) {
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(rotation);
        
        // 计算透光方向
        const lightX = -lightDir.x * width * 0.3;
        const lightY = -lightDir.y * height * 0.3;
        
        ctx.globalCompositeOperation = 'screen';
        
        // 叶脉透光
        const gradient = ctx.createLinearGradient(
            -width/2, 0,
            width/2, 0
        );
        
        gradient.addColorStop(0, 'rgba(100, 200, 100, 0)');
        gradient.addColorStop(0.5, 'rgba(150, 255, 150, 0.3)');
        gradient.addColorStop(1, 'rgba(100, 200, 100, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(-width/2, -height/2, width, height);
        
        // 边缘光
        ctx.strokeStyle = 'rgba(200, 255, 200, 0.4)';
        ctx.lineWidth = 2;
        ctx.strokeRect(-width/2, -height/2, width, height);
        
        ctx.restore();
    }
    
    /**
     * 绘制皮肤散射（需要光源位置）
     */
    drawSkinScatter(ctx, x, y, size, lightPos, intensity = 1) {
        const config = this.scatterConfig.skin;
        
        // 计算散射方向
        const dx = x - lightPos.x;
        const dy = y - lightPos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist === 0) return;
        
        const dirX = dx / dist;
        const dirY = dy / dist;
        
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        
        // 多层散射
        for (let i = 0; i < 3; i++) {
            const offset = (i + 1) * size * 0.3;
            const scatterX = x + dirX * offset;
            const scatterY = y + dirY * offset;
            const scatterSize = size * (1 + i * 0.4);
            
            const gradient = ctx.createRadialGradient(
                scatterX, scatterY, 0,
                scatterX, scatterY, scatterSize
            );
            
            const alpha = config.scatterStrength * intensity * (0.5 - i * 0.15);
            gradient.addColorStop(0, this.hexToRgba(config.scatterColor, alpha));
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(scatterX, scatterY, scatterSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}
