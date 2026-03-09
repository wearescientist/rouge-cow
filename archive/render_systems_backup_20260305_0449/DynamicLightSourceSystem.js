// ============================================================
// v0.24-r14 - 动态光源系统 (Dynamic Light Source System)
// 八方旅人风格：火把、发光植物、技能光效
// ============================================================

export class DynamicLightSourceSystem {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        // 光源列表
        this.lightSources = [];
        this.maxSources = 20;
        
        // 光晕效果
        this.glowIntensity = 0.8;
        
        // 光源类型
        this.sourceTypes = {
            torch: { color: '#ff8844', flicker: true, radius: 80 },
            lantern: { color: '#ffaa66', flicker: false, radius: 60 },
            magic: { color: '#88ccff', flicker: true, radius: 70, pulse: true },
            crystal: { color: '#ff79c6', flicker: false, radius: 50, pulse: true },
            lava: { color: '#ff4422', flicker: true, radius: 100 }
        };
        
        this.time = 0;
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
    }
    
    /**
     * 为房间生成光源
     */
    generateRoomLights(room, floor) {
        this.lightSources = [];
        
        const types = this.getFloorLightTypes(floor);
        const count = 3 + Math.floor(Math.random() * 5);
        
        for (let i = 0; i < count; i++) {
            const typeKey = types[Math.floor(Math.random() * types.length)];
            const type = this.sourceTypes[typeKey];
            
            // 在房间边缘或随机位置生成
            const x = room.x + 60 + Math.random() * (room.width - 120);
            const y = room.y + 60 + Math.random() * (room.height - 120);
            
            this.lightSources.push({
                x, y,
                type: typeKey,
                color: type.color,
                baseRadius: type.radius,
                radius: type.radius,
                flicker: type.flicker,
                pulse: type.pulse || false,
                intensity: 0.8 + Math.random() * 0.4,
                phase: Math.random() * Math.PI * 2
            });
        }
    }
    
    getFloorLightTypes(floor) {
        switch(floor) {
            case 1: return ['torch', 'lantern', 'crystal'];
            case 2: return ['lantern', 'magic', 'crystal'];
            case 3: return ['crystal', 'magic'];
            case 4: return ['lava', 'torch'];
            case 5: return ['torch', 'lantern'];
            case 6: return ['crystal', 'magic', 'lava'];
            default: return ['torch'];
        }
    }
    
    /**
     * 添加临时光源（技能效果等）
     */
    addTemporaryLight(x, y, color, radius, duration, type = 'magic') {
        if (this.lightSources.length >= this.maxSources) {
            // 移除最旧的光源
            const idx = this.lightSources.findIndex(l => !l.temporary);
            if (idx >= 0) this.lightSources.splice(idx, 1);
        }
        
        this.lightSources.push({
            x, y,
            type: type,
            color: color,
            baseRadius: radius,
            radius: radius,
            intensity: 1,
            temporary: true,
            life: duration,
            maxLife: duration,
            flicker: true,
            phase: 0
        });
    }
    
    update(dt) {
        this.time += dt;
        
        this.lightSources.forEach(source => {
            // 更新临时光源生命
            if (source.temporary) {
                source.life -= dt;
                source.intensity = source.life / source.maxLife;
                if (source.life <= 0) {
                    source.dead = true;
                }
            }
            
            // 闪烁效果
            if (source.flicker) {
                source.intensity *= 0.9 + Math.random() * 0.2;
            }
            
            // 脉动效果
            if (source.pulse) {
                const pulse = 0.8 + Math.sin(this.time * 2 + source.phase) * 0.2;
                source.radius = source.baseRadius * pulse;
            }
        });
        
        // 移除死亡光源
        this.lightSources = this.lightSources.filter(s => !s.dead);
    }
    
    /**
     * 绘制所有光源
     */
    drawLights(ctx, camera) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        
        this.lightSources.forEach(source => {
            this.drawLightSource(ctx, source, camera);
        });
        
        ctx.restore();
    }
    
    drawLightSource(ctx, source, camera) {
        const pos = camera.worldToScreen(source.x, source.y);
        // 安全检查
        if (!isFinite(pos.x) || !isFinite(pos.y)) return;
        
        const radius = (source.radius || 50) * (camera.zoom || 1);
        if (!isFinite(radius) || radius <= 0) return;
        
        // 外层光晕
        const outerGrad = ctx.createRadialGradient(
            pos.x, pos.y, 0,
            pos.x, pos.y, radius * 1.5
        );
        outerGrad.addColorStop(0, this.hexToRgba(source.color, source.intensity * 0.3));
        outerGrad.addColorStop(0.5, this.hexToRgba(source.color, source.intensity * 0.1));
        outerGrad.addColorStop(1, 'rgba(0,0,0,0)');
        
        ctx.fillStyle = outerGrad;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius * 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // 内层强光
        const innerGrad = ctx.createRadialGradient(
            pos.x, pos.y, 0,
            pos.x, pos.y, radius * 0.5
        );
        innerGrad.addColorStop(0, this.hexToRgba('#ffffff', source.intensity * 0.8));
        innerGrad.addColorStop(0.5, this.hexToRgba(source.color, source.intensity * 0.6));
        innerGrad.addColorStop(1, 'rgba(0,0,0,0)');
        
        ctx.fillStyle = innerGrad;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制光源本体
        this.drawSourceBody(ctx, source, pos, camera);
    }
    
    drawSourceBody(ctx, source, pos, camera) {
        const size = 8 * camera.zoom;
        
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        
        switch(source.type) {
            case 'torch':
                // 火把柄
                ctx.fillStyle = '#4a3d2d';
                ctx.fillRect(pos.x - size * 0.2, pos.y - size, size * 0.4, size * 2);
                // 火焰
                const flameH = size * (1 + Math.sin(this.time * 10) * 0.3);
                ctx.fillStyle = '#ff4422';
                ctx.beginPath();
                ctx.moveTo(pos.x, pos.y - size * 1.5);
                ctx.lineTo(pos.x - size * 0.5, pos.y - size * 0.5);
                ctx.lineTo(pos.x + size * 0.5, pos.y - size * 0.5);
                ctx.closePath();
                ctx.fill();
                break;
                
            case 'lantern':
                // 灯笼架
                ctx.strokeStyle = '#2d2d2d';
                ctx.lineWidth = 2;
                ctx.strokeRect(pos.x - size, pos.y - size, size * 2, size * 2);
                // 光
                ctx.fillStyle = source.color;
                ctx.fillRect(pos.x - size * 0.7, pos.y - size * 0.7, size * 1.4, size * 1.4);
                break;
                
            case 'crystal':
                // 水晶
                ctx.fillStyle = source.color;
                ctx.beginPath();
                ctx.moveTo(pos.x, pos.y - size);
                ctx.lineTo(pos.x + size * 0.6, pos.y);
                ctx.lineTo(pos.x, pos.y + size);
                ctx.lineTo(pos.x - size * 0.6, pos.y);
                ctx.closePath();
                ctx.fill();
                // 高光
                ctx.fillStyle = 'rgba(255,255,255,0.5)';
                ctx.beginPath();
                ctx.moveTo(pos.x, pos.y - size * 0.5);
                ctx.lineTo(pos.x + size * 0.3, pos.y - size * 0.2);
                ctx.lineTo(pos.x, pos.y + size * 0.1);
                ctx.lineTo(pos.x - size * 0.3, pos.y - size * 0.2);
                ctx.closePath();
                ctx.fill();
                break;
                
            default:
                // 默认光球
                ctx.fillStyle = source.color;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, size * 0.6, 0, Math.PI * 2);
                ctx.fill();
        }
        
        ctx.restore();
    }
    
    hexToRgba(hex, alpha) {
        // 安全检查：确保 hex 是有效的颜色字符串
        if (!hex || typeof hex !== 'string') {
            return `rgba(255, 255, 255, ${alpha})`;
        }
        // 支持简写形式 #fff
        if (hex.length === 4) {
            const r = parseInt(hex[1] + hex[1], 16);
            const g = parseInt(hex[2] + hex[2], 16);
            const b = parseInt(hex[3] + hex[3], 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        // 标准形式 #ffffff
        const r = parseInt(hex.slice(1, 3), 16) || 0;
        const g = parseInt(hex.slice(3, 5), 16) || 0;
        const b = parseInt(hex.slice(5, 7), 16) || 0;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}
