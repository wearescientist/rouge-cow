/**
 * 肉鸽牛牛 - 带对象池的粒子系统
 */

class PooledParticle {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.life = 0;
        this.maxLife = 0;
        this.color = '#fff';
        this.size = 4;
        this.decay = 0.02;
        this.gravity = 0;
        this.alive = false;
    }

    reset() {
        this.x = 0;
        this.y = 0;
        this.vx = 0;
        this.vy = 0;
        this.life = 0;
        this.alive = false;
    }

    init(x, y, options) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * (options.speed || 100);
        this.vy = (Math.random() - 0.5) * (options.speed || 100);
        this.life = options.life || 1.0;
        this.maxLife = this.life;
        this.color = options.color || '#fff';
        this.size = options.size || 4;
        this.decay = options.decay || 0.02;
        this.gravity = options.gravity || 0;
        this.alive = true;
    }

    update(dt) {
        if (!this.alive) return;
        
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.vy += this.gravity * dt;
        this.life -= this.decay;
        
        if (this.life <= 0) {
            this.alive = false;
        }
    }

    draw(ctx) {
        if (!this.alive) return;
        
        const alpha = this.life / this.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        ctx.globalAlpha = 1;
    }
}

class PooledParticleSystem {
    constructor(maxParticles = 500) {
        this.particles = [];
        this.maxParticles = maxParticles;
        
        // 预创建粒子
        for (let i = 0; i < maxParticles; i++) {
            this.particles.push(new PooledParticle());
        }
    }

    emit(x, y, count, options) {
        let emitted = 0;
        
        for (const p of this.particles) {
            if (!p.alive && emitted < count) {
                p.init(x, y, options);
                emitted++;
            }
        }
        
        // 如果池满了，强制复活最老的粒子
        if (emitted < count) {
            for (let i = 0; i < count - emitted && i < this.particles.length; i++) {
                this.particles[i].init(x, y, options);
            }
        }
    }

    emitExplosion(x, y, color = '#ff6600') {
        this.emit(x, y, 15, { color, speed: 150, life: 0.8, size: 6 });
        this.emit(x, y, 8, { color: '#ffff00', speed: 100, life: 0.5, size: 4 });
    }

    emitHit(x, y, color = '#fff') {
        this.emit(x, y, 5, { color, speed: 80, life: 0.3, size: 3 });
    }

    emitItemBurst(x, y, rarity) {
        const colors = {
            common: ['#fff', '#ccc'],
            rare: ['#4488ff', '#66aaff'],
            epic: ['#aa44ff', '#cc66ff'],
            legendary: ['#ffcc00', '#ffdd44'],
            cursed: ['#ff4444', '#ff6666']
        };
        const colorSet = colors[rarity] || colors.common;
        const count = rarity === 'legendary' ? 40 : rarity === 'epic' ? 25 : 15;
        
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = 100 + Math.random() * 100;
            this.emit(x, y, 1, {
                color: colorSet[Math.floor(Math.random() * colorSet.length)],
                speed: speed,
                life: 1.0,
                size: 3 + Math.random() * 4,
                decay: 0.02,
                gravity: 50
            });
            const p = this.particles.find(p => p.alive && p.life === 1.0);
            if (p) {
                p.vx = Math.cos(angle) * speed;
                p.vy = Math.sin(angle) * speed;
            }
        }
    }

    update(dt) {
        let activeCount = 0;
        for (const p of this.particles) {
            if (p.alive) {
                p.update(dt);
                activeCount++;
            }
        }
        return activeCount;
    }

    draw(ctx) {
        for (const p of this.particles) {
            if (p.alive) p.draw(ctx);
        }
    }

    clear() {
        for (const p of this.particles) {
            p.alive = false;
        }
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PooledParticle, PooledParticleSystem };
}
