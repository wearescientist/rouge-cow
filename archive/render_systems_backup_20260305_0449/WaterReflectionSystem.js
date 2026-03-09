// ============================================================
// v0.24 - 水面反射系统 (Water Reflection System)
// 八方旅人风格：像素级反射 + 水波纹效果
// ============================================================

export class WaterReflectionSystem {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        // 反射表面canvas
        this.reflectCanvas = document.createElement('canvas');
        this.reflectCanvas.width = Math.floor(width / 2);
        this.reflectCanvas.height = Math.floor(height / 2);
        this.reflectCtx = this.reflectCanvas.getContext('2d');
        
        // v0.24-r3: 增强水波纹
        this.ripples = [];
        this.maxRipples = 30;  // 增加波纹数量
        
        // 水面动画
        this.waveOffset = 0;
        this.waveSpeed = 0.5;
        
        // 水面区域
        this.waterAreas = [];
        
        this.time = 0;
        
        // v0.24-r7: 添加水面扭曲效果
        this.waveLines = [];
        this.maxWaveLines = 50;
        this.distortionIntensity = 0.02;
        
        // 水下物体
        this.underwaterObjects = [];
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.reflectCanvas.width = Math.floor(width / 2);
        this.reflectCanvas.height = Math.floor(height / 2);
    }
    
    /**
     * 添加水面区域
     */
    addWaterArea(x, y, width, height, floor) {
        const colors = this.getWaterColors(floor);
        this.waterAreas.push({
            x, y, width, height,
            color: colors.surface,
            deepColor: colors.deep,
            reflectivity: colors.reflectivity
        });
    }
    
    /**
     * 添加水波纹
     */
    addRipple(x, y, intensity = 1) {
        if (this.ripples.length >= this.maxRipples) {
            this.ripples.shift();
        }
        this.ripples.push({
            x, y,
            radius: 5,
            maxRadius: 30 + Math.random() * 20,
            intensity: intensity,
            life: 1.0,
            speed: 20 + Math.random() * 10
        });
    }
    
    update(dt, player, enemies) {
        this.time += dt;
        this.waveOffset += this.waveSpeed * dt;
        
        // 更新水波纹
        this.ripples.forEach((ripple, index) => {
            ripple.radius += ripple.speed * dt;
            ripple.life -= dt * 0.4;  // 减慢衰减
            
            if (ripple.life <= 0) {
                this.ripples.splice(index, 1);
            }
        });
        
        // 玩家和敌人移动产生波纹
        if (player && Math.random() < 0.15) {
            this.checkEntityInWater(player, dt);
        }
        
        enemies.forEach(enemy => {
            if (enemy.hp > 0 && Math.random() < 0.08) {
                this.checkEntityInWater(enemy, dt);
            }
        });
        
        // 自动生成随机波纹
        if (Math.random() < 0.05 && this.waterAreas.length > 0) {
            const area = this.waterAreas[Math.floor(Math.random() * this.waterAreas.length)];
            this.addRipple(
                area.x + Math.random() * area.width,
                area.y + Math.random() * area.height,
                0.3
            );
        }
    }
    
    checkEntityInWater(entity, dt) {
        this.waterAreas.forEach(area => {
            if (entity.x >= area.x && entity.x <= area.x + area.width &&
                entity.y >= area.y && entity.y <= area.y + area.height) {
                if (Math.random() < 0.3) {
                    this.addRipple(entity.x, entity.y, 0.5);
                }
            }
        });
    }
    
    /**
     * 绘制水面和反射
     */
    drawWater(ctx, camera, sprites, entities) {
        this.waterAreas.forEach(area => {
            this.drawWaterArea(ctx, area, camera, sprites, entities);
        });
    }
    
    drawWaterArea(ctx, area, camera, sprites, entities) {
        const pos = camera.worldToScreen(area.x, area.y);
        // 安全检查
        if (!isFinite(pos.x) || !isFinite(pos.y)) return;
        
        const w = (area.width || 0) * (camera.zoom || 1);
        const h = (area.height || 0) * (camera.zoom || 1);
        if (!isFinite(w) || !isFinite(h) || w <= 0 || h <= 0) return;
        
        // 1. 绘制水底渐变
        const bottomGrad = ctx.createLinearGradient(pos.x, pos.y, pos.x, pos.y + h);
        bottomGrad.addColorStop(0, area.deepColor);
        bottomGrad.addColorStop(1, this.darkenColor(area.deepColor, 0.7));
        ctx.fillStyle = bottomGrad;
        ctx.fillRect(pos.x, pos.y, w, h);
        
        // 2. 绘制水下的石头/装饰
        this.drawUnderwaterDecor(ctx, area, camera);
        
        // 3. 绘制反射（带扭曲）
        this.drawReflection(ctx, area, camera, sprites, entities);
        
        // 4. 绘制波动线条
        this.drawWaveLines(ctx, pos.x, pos.y, w, h);
        
        // 5. 绘制水面半透明层
        const surfaceGrad = ctx.createLinearGradient(pos.x, pos.y, pos.x, pos.y + h * 0.5);
        surfaceGrad.addColorStop(0, area.color);
        surfaceGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = surfaceGrad;
        ctx.globalAlpha = 0.3;
        ctx.fillRect(pos.x, pos.y, w, h);
        ctx.globalAlpha = 1;
        
        // 6. 绘制水波纹
        this.drawRipples(ctx, area, camera);
        
        // 7. 绘制水面高光
        this.drawWaterHighlights(ctx, pos.x, pos.y, w, h);
    }
    
    /**
     * 绘制水下装饰
     */
    drawUnderwaterDecor(ctx, area, camera) {
        ctx.save();
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        
        // 简化的水下石头
        for (let i = 0; i < 5; i++) {
            const sx = area.x + (i * 0.2 + 0.1) * area.width;
            const sy = area.y + area.height * 0.7;
            const pos = camera.worldToScreen(sx, sy);
            const size = 8 * camera.zoom;
            
            ctx.beginPath();
            ctx.ellipse(pos.x, pos.y, size, size * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    /**
     * 绘制波动线条
     */
    drawWaveLines(ctx, x, y, w, h) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = 1;
        
        const waveCount = Math.floor(h / 8);
        for (let i = 0; i < waveCount; i++) {
            const wy = y + i * 8 + (this.waveOffset * 4) % 8;
            if (wy > y + h) continue;
            
            ctx.beginPath();
            for (let px = x; px < x + w; px += 10) {
                const waveY = wy + Math.sin((px + this.time * 20) * 0.05) * 2;
                if (px === x) {
                    ctx.moveTo(px, waveY);
                } else {
                    ctx.lineTo(px, waveY);
                }
            }
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    /**
     * 绘制反射（简化的像素反射）
     */
    drawReflection(ctx, area, camera, sprites, entities) {
        const pos = camera.worldToScreen(area.x, area.y);
        const w = area.width * camera.zoom;
        const h = area.height * camera.zoom;
        
        ctx.save();
        
        // 裁剪到水面区域
        ctx.beginPath();
        ctx.rect(pos.x, pos.y, w, h);
        ctx.clip();
        
        // 绘制简单的实体反射
        entities.forEach(entity => {
            if (entity.hp <= 0) return;
            if (entity.x < area.x || entity.x > area.x + area.width ||
                entity.y < area.y || entity.y > area.y + area.height) return;
            
            const ePos = camera.worldToScreen(entity.x, entity.y);
            const size = (entity.size || 24) * camera.zoom;
            
            // 反射位置（垂直翻转）
            const reflectY = pos.y + h - (ePos.y - pos.y);
            
            // 绘制简化的反射
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.scale(1, -0.6); // 垂直翻转并压缩
            ctx.translate(0, -reflectY * 2);
            
            // 简化的反射形状
            ctx.fillStyle = entity === entities[0] ? '#4488ff' : '#ff4444';
            ctx.globalAlpha = 0.2;
            ctx.beginPath();
            ctx.ellipse(ePos.x, ePos.y, size * 0.6, size * 0.3, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
        
        ctx.restore();
    }
    
    /**
     * 绘制水波纹
     */
    drawRipples(ctx, area, camera) {
        const pos = camera.worldToScreen(area.x, area.y);
        
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 1.5;
        
        this.ripples.forEach(ripple => {
            // 检查波纹是否在水面区域内
            if (ripple.x < area.x || ripple.x > area.x + area.width ||
                ripple.y < area.y || ripple.y > area.y + area.height) return;
            
            const rPos = camera.worldToScreen(ripple.x, ripple.y);
            const radius = ripple.radius * camera.zoom;
            
            ctx.globalAlpha = ripple.life * ripple.intensity;
            
            // 绘制椭圆波纹（考虑透视）
            ctx.beginPath();
            ctx.ellipse(rPos.x, rPos.y, radius, radius * 0.4, 0, 0, Math.PI * 2);
            ctx.stroke();
            
            // 内部小波纹
            if (ripple.radius > 10) {
                ctx.beginPath();
                ctx.ellipse(rPos.x, rPos.y, radius * 0.6, radius * 0.24, 0, 0, Math.PI * 2);
                ctx.stroke();
            }
        });
        
        ctx.restore();
    }
    
    /**
     * 绘制水面高光
     */
    drawWaterHighlights(ctx, x, y, w, h) {
        ctx.save();
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = '#ffffff';
        
        // 随机的高光点
        for (let i = 0; i < 5; i++) {
            const hx = x + Math.random() * w;
            const hy = y + Math.random() * h;
            const size = 2 + Math.random() * 4;
            
            ctx.beginPath();
            ctx.ellipse(hx, hy, size, size * 0.5, 0, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    getWaterColors(floor) {
        const palettes = {
            1: { surface: '#5c8a7c', deep: '#2d4a42', reflectivity: 0.4 },
            2: { surface: '#7cba8c', deep: '#3d5c4a', reflectivity: 0.5 },
            3: { surface: '#8c5a8c', deep: '#4a2a4a', reflectivity: 0.35 },
            4: { surface: '#b85c3d', deep: '#5c2d1a', reflectivity: 0.3 },
            5: { surface: '#8c8c4a', deep: '#3d3d1a', reflectivity: 0.4 },
            6: { surface: '#a52a2a', deep: '#4a0a0a', reflectivity: 0.25 }
        };
        return palettes[floor] || palettes[1];
    }
    
    darkenColor(hex, factor) {
        const r = Math.floor(parseInt(hex.slice(1, 3), 16) * factor);
        const g = Math.floor(parseInt(hex.slice(3, 5), 16) * factor);
        const b = Math.floor(parseInt(hex.slice(5, 7), 16) * factor);
        return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
    }
}
