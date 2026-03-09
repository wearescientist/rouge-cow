// ============================================================
// v0.23-r5 - 氛围系统 (Ambience System)
// HD-2D风格：体积粒子、天气效果、景深粒子
// ============================================================

export class AmbienceSystem {
    constructor() {
        this.particles = [];
        this.maxParticles = 50;  // v0.23-fix: 大幅减少粒子数量
        this.currentFloor = 1;
        this.time = 0;
        
        // 雾效canvas
        this.fogCanvas = document.createElement('canvas');
        this.fogCanvas.width = 800;
        this.fogCanvas.height = 600;
        this.fogCtx = this.fogCanvas.getContext('2d');
        
        // 粒子池
        this.initParticlePool();
    }
    
    initParticlePool() {
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push({
                x: 0, y: 0, vx: 0, vy: 0, vz: 0,
                size: 2, color: '#fff',
                life: 0, maxLife: 1,
                active: false, type: 'spore',
                glow: 0, pulse: 0,
                depth: 0.5,  // 深度值（0=前景，1=背景）
                rotation: 0, rotSpeed: 0
            });
        }
    }
    
    setFloor(floor) {
        this.currentFloor = floor;
        this.particles.forEach(p => p.active = false);
    }
    
    update(dt, camera) {
        this.time += dt;
        const config = window.FLOOR_AMBIENCE?.[this.currentFloor];
        if (!config) return;
        
        this.spawnParticles(dt, camera, config);
        
        this.particles.forEach(p => {
            if (!p.active) return;
            
            // 3D位置更新
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.z = (p.z || 0) + (p.vz || 0) * dt;
            p.life -= dt;
            p.rotation += (p.rotSpeed || 0) * dt;
            
            // 根据深度调整速度（视差效果）
            const depthFactor = 1 - (p.depth || 0.5);
            p.x += p.vx * dt * depthFactor * 0.2;
            
            // 脉冲效果
            if (p.pulse > 0) {
                p.glow = p.pulse * (0.5 + Math.sin(this.time * 3 + p.x * 0.01) * 0.5);
            }
            
            if (p.life <= 0) {
                p.active = false;
            }
            
            // 视野回收
            if (camera) {
                const bounds = camera.getViewportBounds ? camera.getViewportBounds() : 
                              { minX: 0, maxX: 2000, minY: 0, maxY: 1500 };
                const margin = 150 * (1 + (p.depth || 0.5));
                if (p.x < bounds.minX - margin || p.x > bounds.maxX + margin ||
                    p.y < bounds.minY - margin || p.y > bounds.maxY + margin) {
                    p.active = false;
                }
            }
        });
    }
    
    spawnParticles(dt, camera, config) {
        if (!camera) return;
        
        const bounds = camera.getViewportBounds ? camera.getViewportBounds() : 
                      { minX: 0, maxX: 800, minY: 0, maxY: 600 };
        
        config.particles.forEach(pConfig => {
            // v0.23-fix: 降低粒子生成密度
            const spawnChance = pConfig.density * dt * 0.5;
            if (Math.random() > spawnChance) return;
            
            const p = this.particles.find(p => !p.active);
            if (!p) return;
            
            // 在视野边缘生成，带深度
            const side = Math.floor(Math.random() * 4);
            const depth = Math.random(); // 0=前景，1=背景
            const margin = 100 * (1 + depth);
            
            switch(side) {
                case 0: p.x = bounds.minX - margin; p.y = this.rand(bounds.minY, bounds.maxY); break;
                case 1: p.x = bounds.maxX + margin; p.y = this.rand(bounds.minY, bounds.maxY); break;
                case 2: p.x = this.rand(bounds.minX, bounds.maxX); p.y = bounds.minY - margin; break;
                case 3: p.x = this.rand(bounds.minX, bounds.maxX); p.y = bounds.maxY + margin; break;
            }
            
            p.active = true;
            p.type = pConfig.type;
            p.color = pConfig.color;
            p.size = this.rand(pConfig.size[0], pConfig.size[1]) * (0.8 + depth * 0.4);
            p.glow = pConfig.glow || 0;
            p.pulse = (pConfig.type === 'nerve_pulse' || pConfig.type === 'organ_pulse') ? pConfig.glow : 0;
            p.life = this.rand(8, 15);
            p.maxLife = p.life;
            p.depth = depth;
            p.rotation = Math.random() * Math.PI * 2;
            p.rotSpeed = this.rand(-1, 1);
            
            // 向中心漂浮 + 视差
            const centerX = (bounds.minX + bounds.maxX) / 2;
            const centerY = (bounds.minY + bounds.maxY) / 2;
            const angle = Math.atan2(centerY - p.y, centerX - p.x) + this.rand(-0.5, 0.5);
            const speed = pConfig.speed * (0.5 + depth * 0.5);
            p.vx = Math.cos(angle) * speed * this.rand(0.5, 1);
            p.vy = Math.sin(angle) * speed * this.rand(0.5, 1);
            p.vz = this.rand(-0.5, 0.5);
        });
    }
    
    draw(ctx, camera) {
        const config = window.FLOOR_AMBIENCE?.[this.currentFloor];
        if (!config) return;
        
        // 按深度排序（先画背景，再画前景）
        const sortedParticles = this.particles
            .filter(p => p.active)
            .sort((a, b) => (b.depth || 0.5) - (a.depth || 0.5));
        
        ctx.save();
        
        sortedParticles.forEach(p => {
            const pos = camera.worldToScreen(p.x, p.y);
            
            // 深度影响透明度
            const depthAlpha = 1 - (p.depth || 0.5) * 0.5;
            const alpha = Math.min(1, p.life / p.maxLife * 0.9 + 0.1) * depthAlpha;
            
            // 深度影响大小（近大远小）
            const depthScale = 1 - (p.depth || 0.5) * 0.3;
            const drawSize = Math.max(2, p.size * camera.zoom * depthScale);
            
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            
            // 发光效果
            if (p.glow > 0) {
                ctx.shadowBlur = p.glow * depthScale;
                ctx.shadowColor = p.color;
            } else {
                ctx.shadowBlur = 0;
            }
            
            ctx.save();
            ctx.translate(pos.x, pos.y);
            ctx.rotate(p.rotation || 0);
            
            // 根据类型绘制不同形状
            switch(p.type) {
                case 'spore':
                case 'pollen':
                    // 圆形带光晕
                    ctx.beginPath();
                    ctx.arc(0, 0, drawSize, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                case 'dust':
                case 'ember':
                    // 十字形
                    ctx.fillRect(-drawSize * 0.2, -drawSize, drawSize * 0.4, drawSize * 2);
                    ctx.fillRect(-drawSize, -drawSize * 0.2, drawSize * 2, drawSize * 0.4);
                    break;
                case 'leaf':
                    // 叶片形
                    ctx.beginPath();
                    ctx.ellipse(0, 0, drawSize, drawSize * 0.6, p.rotation, 0, Math.PI * 2);
                    ctx.fill();
                    break;
                default:
                    ctx.beginPath();
                    ctx.arc(0, 0, drawSize, 0, Math.PI * 2);
                    ctx.fill();
            }
            
            ctx.restore();
            ctx.shadowBlur = 0;
        });
        
        ctx.restore();
    }
    
    drawFog(ctx, width, height) {
        const config = window.FLOOR_AMBIENCE?.[this.currentFloor];
        if (!config || !config.fog) return;
        
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = config.fog.density;
        ctx.fillStyle = config.fog.color;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
    }
    
    getColorGrade() {
        const config = window.FLOOR_AMBIENCE?.[this.currentFloor];
        if (!config) return { contrast: 1, saturation: 1, tint: null };
        
        return {
            contrast: config.contrast || 1,
            saturation: config.saturation || 1,
            tint: config.lightTint || null,
            tintStrength: config.fog ? config.fog.density * 0.5 : 0
        };
    }
    
    rand(min, max) {
        return Math.random() * (max - min) + min;
    }
}
