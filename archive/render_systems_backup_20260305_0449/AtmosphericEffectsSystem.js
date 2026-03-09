// ============================================================
// v0.24-r15-20 - 大气效果系统 (Atmospheric Effects System)
// 八方旅人风格：雾气、景深、粒子氛围
// ============================================================

export class AtmosphericEffectsSystem {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        // 雾气
        this.fogLayers = [];
        this.fogCount = 3;
        
        // 粒子
        this.particles = [];
        this.maxParticles = 100;
        
        // 景深
        this.depthOfFieldStrength = 0.5;
        
        // 风
        this.windDirection = 1;
        this.windStrength = 0.3;
        
        this.time = 0;
        this.initParticles();
    }
    
    initParticles() {
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: 1 + Math.random() * 3,
                alpha: 0.1 + Math.random() * 0.3,
                depth: Math.random()
            });
        }
    }
    
    update(dt) {
        this.time += dt;
        
        // 更新粒子
        this.particles.forEach(p => {
            p.x += p.vx + this.windStrength * this.windDirection * p.depth;
            p.y += p.vy;
            
            // 循环
            if (p.x > this.width) p.x = 0;
            if (p.x < 0) p.x = this.width;
            if (p.y > this.height) p.y = 0;
            if (p.y < 0) p.y = this.height;
        });
    }
    
    drawAtmosphere(ctx, camera, floor) {
        const colors = this.getAtmosphericColors(floor);
        
        // 绘制雾气层
        this.drawFogLayers(ctx, colors);
        
        // 绘制粒子
        this.drawParticles(ctx, camera);
        
        // 绘制远景模糊（景深）
        this.drawDepthBlur(ctx);
    }
    
    drawFogLayers(ctx, colors) {
        ctx.save();
        
        // 安全检查
        if (!isFinite(this.width) || !isFinite(this.height) || this.width <= 0 || this.height <= 0) {
            ctx.restore();
            return;
        }
        
        for (let i = 0; i < this.fogCount; i++) {
            const y = this.height * (0.3 + i * 0.2);
            const alpha = 0.05 + i * 0.02;
            if (!isFinite(y)) continue;
            
            const gradient = ctx.createLinearGradient(0, y - 50, 0, y + 50);
            gradient.addColorStop(0, 'rgba(0,0,0,0)');
            gradient.addColorStop(0.5, this.hexToRgba(colors.fog, alpha));
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, y - 50, this.width, 100);
        }
        
        ctx.restore();
    }
    
    drawParticles(ctx, camera) {
        ctx.save();
        
        // 安全检查
        const cameraX = camera && isFinite(camera.x) ? camera.x : 0;
        
        this.particles.forEach(p => {
            const parallaxX = (p.x - cameraX * p.depth * 0.1) % this.width;
            const screenX = parallaxX < 0 ? parallaxX + this.width : parallaxX;
            const screenY = p.y;
            
            ctx.fillStyle = `rgba(255,255,255,${p.alpha})`;
            ctx.beginPath();
            ctx.arc(screenX, screenY, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.restore();
    }
    
    drawDepthBlur(ctx) {
        // 简单的远景模糊效果
        ctx.save();
        const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, 'rgba(0,0,0,0.1)');
        gradient.addColorStop(0.5, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.2)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.restore();
    }
    
    getAtmosphericColors(floor) {
        const palettes = {
            1: { fog: '#2d4a3e', particle: '#ffffff' },
            2: { fog: '#3d5c3d', particle: '#ffffcc' },
            3: { fog: '#4a2a4a', particle: '#ffccff' },
            4: { fog: '#5c2d1a', particle: '#ffcc88' },
            5: { fog: '#3d3d1a', particle: '#ffffaa' },
            6: { fog: '#3d0a0a', particle: '#ffaaaa' }
        };
        return palettes[floor] || palettes[1];
    }
    
    hexToRgba(hex, alpha) {
        if (!hex || typeof hex !== 'string') return `rgba(128, 128, 128, ${alpha})`;
        if (hex.length === 4) {
            const r = parseInt(hex[1] + hex[1], 16);
            const g = parseInt(hex[2] + hex[2], 16);
            const b = parseInt(hex[3] + hex[3], 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        const r = parseInt(hex.slice(1, 3), 16) || 0;
        const g = parseInt(hex.slice(3, 5), 16) || 0;
        const b = parseInt(hex.slice(5, 7), 16) || 0;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}
