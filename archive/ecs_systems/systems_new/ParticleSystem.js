/**
 * ParticleSystem - 粒子系统
 * 管理爆炸、血迹、魔法效果等视觉特效
 */

class ParticleSystem {
    constructor(world) {
        this.world = world;
        this.priority = 90;
        this.enabled = true;
        
        // 粒子池
        this.particles = [];
        this.maxParticles = 1000;
        
        // 特效池
        this.effects = [];
        
        // 粒子纹理缓存
        this.textures = new Map();
        
        // 配置
        this.config = {
            gravity: 200,
            drag: 0.98
        };
    }
    
    init() {
        // 监听事件
        this.setupEventListeners();
        
        // 创建基础纹理
        this.createBaseTextures();
    }
    
    setupEventListeners() {
        // 监听伤害事件
        this.world.on('damageDealt', (data) => {
            this.spawnBloodEffect(data.target, data.damage);
        });
        
        // 监听死亡事件
        this.world.on('entityDestroyed', (entity) => {
            if (entity.hasTag('enemy')) {
                this.spawnDeathEffect(entity);
            }
        });
        
        // 监听射击
        this.world.on('projectileFired', (data) => {
            this.spawnMuzzleFlash(data.position, data.direction);
        });
        
        // 监听碰撞
        this.world.on('projectileHit', (data) => {
            this.spawnImpactEffect(data.position, data.normal);
        });
        
        // 监听升级
        this.world.on('levelUp', (data) => {
            this.spawnLevelUpEffect(data.entity);
        });
        
        // 监听房间清理
        this.world.on('roomCleared', () => {
            this.spawnRoomClearEffect();
        });
    }
    
    createBaseTextures() {
        // 创建圆形粒子纹理
        this.createCircleTexture('circle', '#fff', 16);
        this.createCircleTexture('circle_red', '#f44', 16);
        this.createCircleTexture('circle_green', '#4f4', 16);
        this.createCircleTexture('circle_blue', '#48f', 16);
        this.createCircleTexture('circle_yellow', '#ffd700', 16);
        
        // 创建星形纹理
        this.createStarTexture('star', '#fff', 16);
        this.createStarTexture('star_gold', '#ffd700', 16);
    }
    
    createCircleTexture(name, color, size) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        // 转换颜色为RGBA格式以支持透明度
        const rgbaColor = this.hexToRgba(color, 1);
        const rgbaColor50 = this.hexToRgba(color, 0.5);
        
        const gradient = ctx.createRadialGradient(
            size/2, size/2, 0,
            size/2, size/2, size/2
        );
        gradient.addColorStop(0, rgbaColor);
        gradient.addColorStop(0.5, rgbaColor50);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(size/2, size/2, size/2, 0, Math.PI * 2);
        ctx.fill();
        
        this.textures.set(name, canvas);
    }
    
    /**
     * 将十六进制颜色转换为RGBA
     */
    hexToRgba(hex, alpha) {
        // 移除 # 前缀
        hex = hex.replace('#', '');
        
        // 处理简写格式 (#fff)
        if (hex.length === 3) {
            hex = hex.split('').map(c => c + c).join('');
        }
        
        // 解析RGB值
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    createStarTexture(name, color, size) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = color;
        ctx.beginPath();
        
        const centerX = size / 2;
        const centerY = size / 2;
        const outerRadius = size / 2;
        const innerRadius = size / 4;
        const points = 5;
        
        for (let i = 0; i < points * 2; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = (i * Math.PI) / points - Math.PI / 2;
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.closePath();
        ctx.fill();
        
        this.textures.set(name, canvas);
    }
    
    update(dt) {
        // 更新粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            // 更新位置
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            
            // 应用重力
            p.vy += this.config.gravity * dt * p.gravityScale;
            
            // 应用阻力
            p.vx *= this.config.drag;
            p.vy *= this.config.drag;
            
            // 更新旋转
            p.rotation += p.rotationSpeed * dt;
            
            // 更新生命周期
            p.life -= dt;
            p.age += dt;
            
            // 计算透明度
            const lifeRatio = p.life / p.maxLife;
            if (lifeRatio > 0.8) {
                // 淡入
                p.alpha = (1 - lifeRatio) * 5;
            } else if (lifeRatio < 0.2) {
                // 淡出
                p.alpha = lifeRatio * 5;
            } else {
                p.alpha = 1;
            }
            
            // 更新缩放
            p.scale = p.startScale + (p.endScale - p.startScale) * (1 - lifeRatio);
            
            // 移除死亡粒子
            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    render(ctx) {
        ctx.save();
        
        for (const p of this.particles) {
            ctx.save();
            
            ctx.globalAlpha = p.alpha * p.baseAlpha;
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            ctx.scale(p.scale, p.scale);
            
            // 获取纹理
            const texture = this.textures.get(p.texture);
            if (texture) {
                const w = texture.width;
                const h = texture.height;
                ctx.drawImage(texture, -w/2, -h/2, w, h);
            } else {
                // 默认绘制
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(0, 0, p.size, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.restore();
        }
        
        ctx.restore();
    }
    
    /**
     * 创建粒子
     */
    createParticle(options) {
        if (this.particles.length >= this.maxParticles) {
            // 移除最旧的粒子
            this.particles.shift();
        }
        
        const particle = {
            x: options.x || 0,
            y: options.y || 0,
            vx: options.vx || 0,
            vy: options.vy || 0,
            size: options.size || 10,
            color: options.color || '#fff',
            texture: options.texture || 'circle',
            life: options.life || 1,
            maxLife: options.life || 1,
            age: 0,
            alpha: 0,
            baseAlpha: options.alpha || 1,
            scale: 1,
            startScale: options.startScale || 1,
            endScale: options.endScale || 0,
            rotation: options.rotation || 0,
            rotationSpeed: options.rotationSpeed || 0,
            gravityScale: options.gravityScale || 1
        };
        
        this.particles.push(particle);
        return particle;
    }
    
    /**
     * 爆炸效果
     */
    spawnExplosion(x, y, options = {}) {
        const count = options.count || 20;
        const color = options.color || '#f80';
        const size = options.size || 15;
        const speed = options.speed || 100;
        
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
            const velocity = speed * (0.5 + Math.random() * 0.5);
            
            this.createParticle({
                x: x + (Math.random() - 0.5) * 20,
                y: y + (Math.random() - 0.5) * 20,
                vx: Math.cos(angle) * velocity,
                vy: Math.sin(angle) * velocity,
                color: color,
                size: size * (0.5 + Math.random()),
                life: 0.5 + Math.random() * 0.5,
                startScale: 1,
                endScale: 0,
                rotationSpeed: (Math.random() - 0.5) * 10,
                gravityScale: 0.5
            });
        }
    }
    
    /**
     * 血迹效果
     */
    spawnBloodEffect(entity, damage) {
        const transform = entity.get(TransformComponent);
        if (!transform) return;
        
        const count = Math.min(10, Math.floor(damage / 5) + 3);
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 30 + Math.random() * 50;
            
            this.createParticle({
                x: transform.x + (Math.random() - 0.5) * 30,
                y: transform.y + (Math.random() - 0.5) * 30,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 20,
                color: '#a33',
                size: 8 + Math.random() * 8,
                life: 1 + Math.random(),
                startScale: 1,
                endScale: 0.3,
                gravityScale: 1.5
            });
        }
    }
    
    /**
     * 死亡效果
     */
    spawnDeathEffect(entity) {
        const transform = entity.get(TransformComponent);
        if (!transform) return;
        
        // 大爆诈
        this.spawnExplosion(transform.x, transform.y, {
            count: 30,
            color: '#f44',
            size: 20,
            speed: 150
        });
        
        // 经验球飞散
        for (let i = 0; i < 5; i++) {
            this.createParticle({
                x: transform.x,
                y: transform.y,
                vx: (Math.random() - 0.5) * 100,
                vy: (Math.random() - 0.5) * 100 - 50,
                color: '#48f',
                texture: 'circle_blue',
                size: 10,
                life: 0.8,
                startScale: 1,
                endScale: 0,
                gravityScale: -0.5 // 向上飘
            });
        }
    }
    
    /**
     * 枪口闪光
     */
    spawnMuzzleFlash(position, direction) {
        const angle = Math.atan2(direction.y, direction.x);
        
        for (let i = 0; i < 5; i++) {
            const spreadAngle = angle + (Math.random() - 0.5) * 0.5;
            const speed = 50 + Math.random() * 50;
            
            this.createParticle({
                x: position.x + direction.x * 10,
                y: position.y + direction.y * 10,
                vx: Math.cos(spreadAngle) * speed,
                vy: Math.sin(spreadAngle) * speed,
                color: '#ff0',
                size: 5 + Math.random() * 5,
                life: 0.1 + Math.random() * 0.1,
                startScale: 1,
                endScale: 0.5,
                gravityScale: 0
            });
        }
    }
    
    /**
     * 撞击效果
     */
    spawnImpactEffect(position, normal) {
        const count = 8;
        
        for (let i = 0; i < count; i++) {
            const angle = Math.atan2(normal.y, normal.x) + (Math.random() - 0.5) * 1;
            const speed = 40 + Math.random() * 40;
            
            this.createParticle({
                x: position.x,
                y: position.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: '#ccc',
                size: 4 + Math.random() * 4,
                life: 0.3 + Math.random() * 0.3,
                startScale: 1,
                endScale: 0,
                gravityScale: 0.5
            });
        }
    }
    
    /**
     * 升级效果
     */
    spawnLevelUpEffect(entity) {
        const transform = entity.get(TransformComponent);
        if (!transform) return;
        
        // 金色光环
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            const radius = 50;
            
            this.createParticle({
                x: transform.x + Math.cos(angle) * radius,
                y: transform.y + Math.sin(angle) * radius,
                vx: -Math.cos(angle) * 30,
                vy: -Math.sin(angle) * 30,
                color: '#ffd700',
                texture: 'star_gold',
                size: 15,
                life: 1,
                startScale: 1,
                endScale: 0,
                rotationSpeed: 5,
                gravityScale: -0.2
            });
        }
        
        // 向上飘散的光芒
        for (let i = 0; i < 15; i++) {
            this.createParticle({
                x: transform.x + (Math.random() - 0.5) * 60,
                y: transform.y + (Math.random() - 0.5) * 60,
                vx: (Math.random() - 0.5) * 20,
                vy: -50 - Math.random() * 50,
                color: '#48f',
                texture: 'circle_blue',
                size: 10,
                life: 1.2,
                startScale: 1,
                endScale: 0,
                gravityScale: -0.3
            });
        }
    }
    
    /**
     * 房间清理效果
     */
    spawnRoomClearEffect() {
        const players = this.world.getEntitiesWithTag('player');
        if (players.length === 0) return;
        
        const player = players[0];
        const transform = player.get(TransformComponent);
        if (!transform) return;
        
        // 庆祝彩带效果
        const colors = ['#f44', '#4f4', '#48f', '#ffd700', '#f0f'];
        
        for (let i = 0; i < 50; i++) {
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            this.createParticle({
                x: transform.x,
                y: transform.y - 30,
                vx: (Math.random() - 0.5) * 300,
                vy: -100 - Math.random() * 100,
                color: color,
                size: 8,
                life: 2,
                startScale: 1,
                endScale: 0,
                gravityScale: 0.8
            });
        }
    }
    
    /**
     * 清除所有粒子
     */
    clear() {
        this.particles = [];
    }
    
    destroy() {}
}

window.ParticleSystem = ParticleSystem;
