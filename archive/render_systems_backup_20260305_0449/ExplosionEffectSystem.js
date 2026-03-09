// ============================================================
// v0.23-r29 - 爆炸特效系统 (Explosion Effect System)
// HD-2D风格：粒子爆炸、冲击波、屏幕震动、光照闪烁
// ============================================================

export class ExplosionEffectSystem {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        // 爆炸效果池
        this.explosions = [];
        this.maxExplosions = 20;
        
        // 屏幕震动
        this.screenShake = {
            active: false,
            intensity: 0,
            decay: 0.9,
            offsetX: 0,
            offsetY: 0
        };
        
        // 闪光效果
        this.flash = {
            active: false,
            color: '#ffffff',
            intensity: 0,
            decay: 0.95
        };
        
        // 粒子池
        this.particles = [];
        this.maxParticles = 500;
        
        this.initParticles();
    }
    
    initParticles() {
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push({
                x: 0, y: 0,
                vx: 0, vy: 0,
                life: 0,
                maxLife: 1,
                size: 1,
                color: '#ff8800',
                type: 'spark',
                active: false,
                trail: []
            });
        }
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
    }
    
    update(dt, camera) {
        // 更新爆炸
        this.updateExplosions(dt, camera);
        
        // 更新屏幕震动
        this.updateScreenShake();
        
        // 更新闪光
        this.updateFlash();
        
        // 更新粒子
        this.updateParticles(dt, camera);
    }
    
    updateExplosions(dt, camera) {
        this.explosions = this.explosions.filter(exp => {
            exp.time += dt;
            exp.phase = exp.time / exp.duration;
            
            // 生成新粒子
            if (exp.phase < 0.3) {
                this.spawnExplosionParticles(exp, dt);
            }
            
            return exp.phase < 1;
        });
    }
    
    spawnExplosionParticles(exp, dt) {
        const particlesToSpawn = Math.floor(exp.intensity * 10 * dt);
        
        for (let i = 0; i < particlesToSpawn; i++) {
            const p = this.particles.find(p => !p.active);
            if (!p) break;
            
            const angle = Math.random() * Math.PI * 2;
            const speed = exp.intensity * (50 + Math.random() * 100);
            
            p.x = exp.x + (Math.random() - 0.5) * exp.radius;
            p.y = exp.y + (Math.random() - 0.5) * exp.radius;
            p.vx = Math.cos(angle) * speed;
            p.vy = Math.sin(angle) * speed;
            p.life = 0.5 + Math.random() * 0.5;
            p.maxLife = p.life;
            p.size = 2 + Math.random() * 4;
            p.color = exp.colors[Math.floor(Math.random() * exp.colors.length)];
            p.type = exp.type === 'magic' ? 'sparkle' : 'spark';
            p.active = true;
            p.trail = [];
        }
    }
    
    updateParticles(dt, camera) {
        this.particles.forEach(p => {
            if (!p.active) return;
            
            // 物理
            p.vx *= 0.98;  // 阻力
            p.vy *= 0.98;
            p.vy += 20 * dt;  // 重力
            
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            
            // 记录轨迹
            if (p.trail) {
                p.trail.push({ x: p.x, y: p.y });
                if (p.trail.length > 5) p.trail.shift();
            }
            
            p.life -= dt;
            if (p.life <= 0) {
                p.active = false;
                p.trail = [];
            }
        });
    }
    
    updateScreenShake() {
        if (!this.screenShake.active) return;
        
        // 随机偏移
        this.screenShake.offsetX = (Math.random() - 0.5) * this.screenShake.intensity;
        this.screenShake.offsetY = (Math.random() - 0.5) * this.screenShake.intensity;
        
        // 衰减
        this.screenShake.intensity *= this.screenShake.decay;
        
        if (this.screenShake.intensity < 0.5) {
            this.screenShake.active = false;
            this.screenShake.offsetX = 0;
            this.screenShake.offsetY = 0;
        }
    }
    
    updateFlash() {
        if (!this.flash.active) return;
        
        this.flash.intensity *= this.flash.decay;
        
        if (this.flash.intensity < 0.01) {
            this.flash.active = false;
            this.flash.intensity = 0;
        }
    }
    
    /**
     * 创建爆炸
     */
    createExplosion(x, y, type = 'fire', intensity = 1, camera) {
        // 添加到爆炸列表
        const explosion = {
            x, y,
            type,
            intensity,
            radius: 20 * intensity,
            duration: 0.5 + intensity * 0.3,
            time: 0,
            phase: 0,
            colors: this.getExplosionColors(type)
        };
        
        this.explosions.push(explosion);
        
        // 屏幕震动
        if (camera && intensity > 0.5) {
            this.screenShake.active = true;
            this.screenShake.intensity = intensity * 10;
        }
        
        // 闪光
        if (intensity > 0.7) {
            this.flash.active = true;
            this.flash.intensity = intensity;
            this.flash.color = explosion.colors[0];
        }
    }
    
    getExplosionColors(type) {
        switch(type) {
            case 'fire':
                return ['#ff4400', '#ff8800', '#ffcc00', '#ffffff'];
            case 'ice':
                return ['#88ccff', '#aaddff', '#ffffff', '#4488cc'];
            case 'lightning':
                return ['#ffffff', '#ffff88', '#88ccff', '#4488ff'];
            case 'poison':
                return ['#44aa22', '#66cc44', '#88ee66', '#228822'];
            case 'blood':
                return ['#880000', '#aa0000', '#cc0000', '#660000'];
            case 'magic':
                return ['#ff88ff', '#aa88ff', '#ffffff', '#ff44ff'];
            default:
                return ['#ff8800', '#ffcc00', '#ffffff'];
        }
    }
    
    draw(ctx, camera) {
        // 绘制粒子
        this.drawParticles(ctx, camera);
        
        // 绘制冲击波
        this.drawShockwaves(ctx, camera);
        
        // 绘制闪光
        this.drawFlash(ctx);
        
        // 绘制屏幕震动（通过变换）
        this.applyScreenShake(ctx);
    }
    
    drawParticles(ctx, camera) {
        ctx.save();
        
        this.particles.forEach(p => {
            if (!p.active) return;
            
            const pos = camera.worldToScreen(p.x, p.y);
            const alpha = p.life / p.maxLife;
            
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            
            // 绘制轨迹
            if (p.trail && p.trail.length > 1) {
                ctx.strokeStyle = p.color;
                ctx.lineWidth = p.size * 0.5;
                ctx.beginPath();
                
                p.trail.forEach((t, i) => {
                    const tPos = camera.worldToScreen(t.x, t.y);
                    if (i === 0) ctx.moveTo(tPos.x, tPos.y);
                    else ctx.lineTo(tPos.x, tPos.y);
                });
                
                ctx.lineTo(pos.x, pos.y);
                ctx.stroke();
            }
            
            // 绘制粒子
            ctx.shadowBlur = p.size * 2;
            ctx.shadowColor = p.color;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        });
        
        ctx.restore();
    }
    
    drawShockwaves(ctx, camera) {
        ctx.save();
        
        this.explosions.forEach(exp => {
            const pos = camera.worldToScreen(exp.x, exp.y);
            const screenRadius = exp.radius * camera.zoom;
            
            // 冲击波
            const waveRadius = screenRadius * (1 + exp.phase * 3);
            const waveAlpha = 1 - exp.phase;
            
            ctx.strokeStyle = exp.colors[0];
            ctx.lineWidth = 3 * (1 - exp.phase);
            ctx.globalAlpha = waveAlpha * 0.5;
            
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, waveRadius, 0, Math.PI * 2);
            ctx.stroke();
            
            // 内核
            const coreRadius = screenRadius * (1 - exp.phase);
            ctx.fillStyle = exp.colors[1];
            ctx.globalAlpha = waveAlpha;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, coreRadius, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.restore();
    }
    
    drawFlash(ctx) {
        if (!this.flash.active) return;
        
        ctx.save();
        ctx.fillStyle = this.flash.color;
        ctx.globalAlpha = this.flash.intensity * 0.3;
        ctx.fillRect(0, 0, this.width, this.height);
        ctx.restore();
    }
    
    applyScreenShake(ctx) {
        if (!this.screenShake.active) return;
        
        ctx.translate(this.screenShake.offsetX, this.screenShake.offsetY);
    }
    
    /**
     * 获取当前屏幕偏移（用于相机）
     */
    getScreenOffset() {
        return {
            x: this.screenShake.offsetX,
            y: this.screenShake.offsetY
        };
    }
}
