// ============================================================
// v0.23-r11 - 粒子特效系统 (Particle Effect System)
// HD-2D风格：风向、湍流、轨迹拖尾
// ============================================================

export class ParticleEffectSystem {
    constructor() {
        this.time = 0;
        
        // 风向配置
        this.wind = {
            direction: { x: 0.3, y: 0.1 },  // 风向向量
            strength: 0.5,                   // 风力强度
            turbulence: 0.2,                 // 湍流强度
            gusts: true                      // 阵风效果
        };
        
        // 特效粒子（独立于环境粒子）
        this.fxParticles = [];
        this.maxFxParticles = 100;
        
        // 轨迹系统
        this.trails = [];
        
        this.initFxPool();
    }
    
    initFxPool() {
        for (let i = 0; i < this.maxFxParticles; i++) {
            this.fxParticles.push({
                x: 0, y: 0, vx: 0, vy: 0,
                life: 0, maxLife: 1,
                type: 'sparkle',
                color: '#fff',
                size: 2,
                active: false,
                trail: []
            });
        }
    }
    
    update(dt, floor, camera) {
        this.time += dt;
        
        // 动态风向
        if (this.wind.gusts) {
            this.wind.strength = 0.3 + Math.sin(this.time * 0.5) * 0.2 + 
                                Math.sin(this.time * 2.3) * 0.1;
        }
        
        // 更新特效粒子
        this.fxParticles.forEach(p => {
            if (!p.active) return;
            
            // 应用风力
            p.vx += this.wind.direction.x * this.wind.strength * dt * 10;
            p.vy += this.wind.direction.y * this.wind.strength * dt * 10;
            
            // 湍流噪声
            p.vx += Math.sin(this.time * 5 + p.y * 0.1) * this.wind.turbulence * dt;
            p.vy += Math.cos(this.time * 3 + p.x * 0.1) * this.wind.turbulence * dt;
            
            // 更新位置
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            
            // 记录轨迹
            if (p.trail) {
                p.trail.push({ x: p.x, y: p.y, life: 0.3 });
                if (p.trail.length > 10) p.trail.shift();
                
                // 更新轨迹点生命周期
                p.trail.forEach(t => t.life -= dt);
                p.trail = p.trail.filter(t => t.life > 0);
            }
            
            if (p.life <= 0) {
                p.active = false;
                p.trail = [];
            }
        });
        
        // 根据楼层生成环境特效
        this.spawnAmbientFx(dt, floor, camera);
    }
    
    spawnAmbientFx(dt, floor, camera) {
        if (!camera) return;
        
        const bounds = camera.getViewportBounds ? camera.getViewportBounds() : 
                      { minX: 0, maxX: 800, minY: 0, maxY: 600 };
        
        // 楼层特定特效
        const fxConfig = this.getFloorFxConfig(floor);
        if (!fxConfig) return;
        
        fxConfig.forEach(config => {
            if (Math.random() > config.spawnRate * dt) return;
            
            const p = this.fxParticles.find(p => !p.active);
            if (!p) return;
            
            // 在视野内随机位置生成
            p.x = bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
            p.y = bounds.minY + Math.random() * (bounds.maxY - bounds.minY);
            p.vx = config.vx + (Math.random() - 0.5) * config.vxVar;
            p.vy = config.vy + (Math.random() - 0.5) * config.vyVar;
            p.life = config.life;
            p.maxLife = config.life;
            p.type = config.type;
            p.color = config.color;
            p.size = config.size;
            p.active = true;
            p.trail = config.trail ? [] : null;
        });
    }
    
    getFloorFxConfig(floor) {
        switch(floor) {
            case 1: // 菌丝 - 飘落的孢子
                return [{
                    type: 'spore_fall',
                    spawnRate: 3,
                    vx: -5, vy: 15,
                    vxVar: 10, vyVar: 5,
                    life: 3,
                    color: '#8fbc8f',
                    size: 3,
                    trail: false
                }];
            case 2: // 温室 - 花粉爆发
                return [{
                    type: 'pollen_burst',
                    spawnRate: 2,
                    vx: -20, vy: -10,
                    vxVar: 20, vyVar: 20,
                    life: 2,
                    color: '#ffffcc',
                    size: 4,
                    trail: true
                }];
            case 3: // 神经 - 电火花
                return [{
                    type: 'spark',
                    spawnRate: 5,
                    vx: 0, vy: 0,
                    vxVar: 50, vyVar: 50,
                    life: 0.3,
                    color: '#ff79c6',
                    size: 2,
                    trail: true
                }];
            case 4: // 熔炉 - 火星
                return [{
                    type: 'ember',
                    spawnRate: 4,
                    vx: -10, vy: -30,
                    vxVar: 20, vyVar: 10,
                    life: 1.5,
                    color: '#ff6b35',
                    size: 3,
                    trail: true
                }];
            case 5: // 庭院 - 落叶
                return [{
                    type: 'leaf',
                    spawnRate: 1.5,
                    vx: -25, vy: 20,
                    vxVar: 15, vyVar: 10,
                    life: 4,
                    color: '#d4a574',
                    size: 6,
                    trail: false
                }];
            case 6: // 千根 - 血滴
                return [{
                    type: 'blood_drop',
                    spawnRate: 2,
                    vx: 0, vy: 40,
                    vxVar: 5, vyVar: 10,
                    life: 2,
                    color: '#8b0000',
                    size: 4,
                    trail: true
                }];
            default:
                return null;
        }
    }
    
    draw(ctx, camera) {
        ctx.save();
        
        this.fxParticles.forEach(p => {
            if (!p.active) return;
            
            const pos = camera.worldToScreen(p.x, p.y);
            const alpha = p.life / p.maxLife;
            
            // 绘制轨迹
            if (p.trail && p.trail.length > 1) {
                ctx.strokeStyle = p.color;
                ctx.lineWidth = p.size * 0.5;
                ctx.lineCap = 'round';
                
                for (let i = 0; i < p.trail.length - 1; i++) {
                    const t1 = p.trail[i];
                    const t2 = p.trail[i + 1];
                    const tPos1 = camera.worldToScreen(t1.x, t1.y);
                    const tPos2 = camera.worldToScreen(t2.x, t2.y);
                    
                    ctx.globalAlpha = t1.life * alpha * 0.5;
                    ctx.beginPath();
                    ctx.moveTo(tPos1.x, tPos1.y);
                    ctx.lineTo(tPos2.x, tPos2.y);
                    ctx.stroke();
                }
            }
            
            // 绘制粒子本体
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.shadowBlur = p.size;
            ctx.shadowColor = p.color;
            
            const drawSize = p.size * camera.zoom;
            
            switch(p.type) {
                case 'leaf':
                    // 叶片形状
                    ctx.save();
                    ctx.translate(pos.x, pos.y);
                    ctx.rotate(this.time + p.x * 0.1);
                    ctx.beginPath();
                    ctx.ellipse(0, 0, drawSize, drawSize * 0.6, 0, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.restore();
                    break;
                case 'spark':
                    // 十字星
                    ctx.fillRect(pos.x - drawSize * 0.2, pos.y - drawSize, drawSize * 0.4, drawSize * 2);
                    ctx.fillRect(pos.x - drawSize, pos.y - drawSize * 0.2, drawSize * 2, drawSize * 0.4);
                    break;
                default:
                    // 圆形
                    ctx.beginPath();
                    ctx.arc(pos.x, pos.y, drawSize, 0, Math.PI * 2);
                    ctx.fill();
            }
            
            ctx.shadowBlur = 0;
        });
        
        ctx.restore();
    }
    
    /**
     * 在指定位置生成爆发特效
     */
    spawnBurst(x, y, color, count = 10, type = 'circle') {
        for (let i = 0; i < count; i++) {
            const p = this.fxParticles.find(p => !p.active);
            if (!p) break;
            
            const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
            const speed = 50 + Math.random() * 100;
            
            p.x = x;
            p.y = y;
            p.vx = Math.cos(angle) * speed;
            p.vy = Math.sin(angle) * speed;
            p.life = 0.5 + Math.random() * 0.5;
            p.maxLife = p.life;
            p.type = type;
            p.color = color;
            p.size = 2 + Math.random() * 3;
            p.active = true;
            p.trail = [];
        }
    }
}
