/**
 * EffectSpriteData.js - 特效和粒子系统管理
 * 统一伤害数字、状态效果、环境特效的渲染
 */

class EffectSpriteData {
    constructor() {
        // 伤害数字配置
        this.damageNumberConfigs = {
            'normal': {
                font: 'bold 16px Arial',
                color: '#fff',
                strokeColor: '#000',
                strokeWidth: 2,
                life: 0.8,
                velocityY: -60,
                velocityX: 0,
                fadeStart: 0.5
            },
            'crit': {
                font: 'bold 24px Arial',
                color: '#ff4',
                strokeColor: '#c80',
                strokeWidth: 3,
                life: 1.0,
                velocityY: -80,
                velocityX: 0,
                fadeStart: 0.4,
                scale: 1.5
            },
            'heal': {
                font: 'bold 18px Arial',
                color: '#4f4',
                strokeColor: '#080',
                strokeWidth: 2,
                life: 1.0,
                velocityY: -50,
                velocityX: 0,
                fadeStart: 0.5
            },
            'poison': {
                font: 'bold 14px Arial',
                color: '#4a4',
                strokeColor: '#040',
                strokeWidth: 2,
                life: 0.6,
                velocityY: -40,
                velocityX: 0,
                fadeStart: 0.4
            },
            'burn': {
                font: 'bold 14px Arial',
                color: '#f84',
                strokeColor: '#c40',
                strokeWidth: 2,
                life: 0.6,
                velocityY: -40,
                velocityX: 0,
                fadeStart: 0.4
            }
        };

        // 状态效果图标配置
        this.statusEffectConfigs = {
            'slow': {
                icon: '❄️',
                color: '#48f',
                size: 12,
                offsetY: -30
            },
            'poison': {
                icon: '☠️',
                color: '#4a4',
                size: 12,
                offsetY: -45
            },
            'burn': {
                icon: '🔥',
                color: '#f84',
                size: 12,
                offsetY: -60
            },
            'stun': {
                icon: '💫',
                color: '#ff8',
                size: 14,
                offsetY: -35
            },
            'buff': {
                icon: '⬆️',
                color: '#8f8',
                size: 12,
                offsetY: -30
            }
        };

        // 粒子效果配置
        this.particleConfigs = {
            'blood': {
                colors: ['#800', '#a00', '#600'],
                sizes: [2, 4, 3],
                life: 0.5,
                gravity: 300,
                spread: 50
            },
            'spark': {
                colors: ['#ff0', '#fc0', '#fff'],
                sizes: [1, 2, 1],
                life: 0.3,
                gravity: 100,
                spread: 30
            },
            'magic': {
                colors: ['#8cf', '#48f', '#c8f'],
                sizes: [2, 3, 2],
                life: 0.8,
                gravity: -50,
                spread: 40
            },
            'fire': {
                colors: ['#f80', '#f40', '#fc0'],
                sizes: [3, 5, 4],
                life: 0.6,
                gravity: -80,
                spread: 35
            },
            'ice': {
                colors: ['#8cf', '#ccf', '#fff'],
                sizes: [2, 3, 2],
                life: 0.7,
                gravity: 50,
                spread: 30
            }
        };

        // 环境特效配置
        this.ambientConfigs = {
            'fog': {
                color: 'rgba(200, 200, 255, 0.1)',
                speed: 10,
                density: 0.3
            },
            'rain': {
                color: 'rgba(150, 150, 200, 0.6)',
                speed: 400,
                density: 0.5,
                angle: 0.2
            },
            'snow': {
                color: 'rgba(255, 255, 255, 0.8)',
                speed: 50,
                density: 0.4,
                sway: 0.5
            },
            'ash': {
                color: 'rgba(100, 80, 60, 0.4)',
                speed: 30,
                density: 0.3,
                sway: 0.3
            }
        };
    }

    /**
     * 获取伤害数字配置
     * @param {string} type 
     * @returns {Object}
     */
    getDamageNumberConfig(type) {
        return this.damageNumberConfigs[type] || this.damageNumberConfigs['normal'];
    }

    /**
     * 计算伤害数字动画
     * @param {Object} config 
     * @param {number} life - 剩余生命 (0-1)
     * @returns {Object} {x, y, alpha, scale}
     */
    calculateDamageAnimation(config, life) {
        const progress = 1 - life;
        
        // 位置
        const x = config.velocityX * progress;
        const y = config.velocityY * progress;
        
        // 透明度
        let alpha = 1;
        if (progress > config.fadeStart) {
            alpha = 1 - (progress - config.fadeStart) / (1 - config.fadeStart);
        }
        
        // 缩放（暴击效果）
        const scale = config.scale ? 
            (progress < 0.2 ? 1 + progress * 2 : config.scale) : 1;
        
        return { x, y, alpha, scale };
    }

    /**
     * 获取状态效果配置
     * @param {string} status 
     * @returns {Object}
     */
    getStatusEffectConfig(status) {
        return this.statusEffectConfigs[status] || null;
    }

    /**
     * 获取粒子配置
     * @param {string} type 
     * @returns {Object}
     */
    getParticleConfig(type) {
        return this.particleConfigs[type] || this.particleConfigs['spark'];
    }

    /**
     * 生成粒子
     * @param {string} type 
     * @param {number} x 
     * @param {number} y 
     * @param {number} count 
     * @returns {Array}
     */
    spawnParticles(type, x, y, count = 5) {
        const config = this.getParticleConfig(type);
        const particles = [];
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * config.spread + 20;
            
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 50, // 初始向上
                size: config.sizes[Math.floor(Math.random() * config.sizes.length)],
                color: config.colors[Math.floor(Math.random() * config.colors.length)],
                life: config.life * (0.8 + Math.random() * 0.4),
                gravity: config.gravity
            });
        }
        
        return particles;
    }

    /**
     * 更新粒子
     * @param {Array} particles 
     * @param {number} dt 
     * @returns {Array} 存活的粒子
     */
    updateParticles(particles, dt) {
        const alive = [];
        
        for (const p of particles) {
            p.life -= dt;
            if (p.life <= 0) continue;
            
            // 物理更新
            p.vy += p.gravity * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            
            alive.push(p);
        }
        
        return alive;
    }

    /**
     * 获取环境特效配置
     * @param {string} type 
     * @returns {Object}
     */
    getAmbientConfig(type) {
        return this.ambientConfigs[type] || null;
    }

    /**
     * 渲染粒子批次
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Array} particles 
     * @param {Camera} camera 
     */
    renderParticles(ctx, particles, camera) {
        ctx.save();
        
        for (const p of particles) {
            const pos = camera.worldToScreen(p.x, p.y);
            const alpha = p.life > 0.3 ? 1 : p.life / 0.3;
            
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, p.size * camera.zoom, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }

    /**
     * 渲染伤害数字批次
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Array} numbers 
     * @param {Camera} camera 
     */
    renderDamageNumbers(ctx, numbers, camera) {
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        for (const num of numbers) {
            const config = this.getDamageNumberConfig(num.type);
            const anim = this.calculateDamageAnimation(config, num.life);
            
            const pos = camera.worldToScreen(num.x, num.y);
            const x = pos.x + anim.x;
            const y = pos.y + anim.y;
            
            ctx.globalAlpha = anim.alpha;
            ctx.font = config.font;
            ctx.scale(anim.scale, anim.scale);
            
            // 描边
            if (config.strokeWidth > 0) {
                ctx.strokeStyle = config.strokeColor;
                ctx.lineWidth = config.strokeWidth;
                ctx.strokeText(num.value, x / anim.scale, y / anim.scale);
            }
            
            // 填充
            ctx.fillStyle = config.color;
            ctx.fillText(num.value, x / anim.scale, y / anim.scale);
            
            ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
        
        ctx.restore();
    }

    /**
     * 清理过期特效
     * @param {Array} effects 
     * @returns {Array}
     */
    cleanupEffects(effects) {
        return effects.filter(e => e.life > 0);
    }
}

// 创建全局实例
if (typeof window !== 'undefined') {
    window.effectSpriteData = new EffectSpriteData();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EffectSpriteData;
}
