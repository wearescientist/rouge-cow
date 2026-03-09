/**
 * BloodStainSystem - 血迹系统
 * 4种喷溅模式，永久保留，可互动
 */

class BloodStainSystem {
    constructor(world) {
        this.world = world;
        this.priority = 15; // 在实体渲染之前
        this.enabled = true;
        
        // 血迹存储：roomId -> stains[]
        this.roomStains = new Map();
        
        // 当前房间
        this.currentRoomId = null;
        
        // 配置
        this.config = {
            maxStainsPerRoom: 100,
            fadeTime: 300, // 5分钟后开始淡出
            fadeDuration: 60, // 淡出持续1分钟
            poolSize: 200 // 对象池大小
        };
        
        // 对象池
        this.stainPool = [];
        this.activeStains = [];
        
        this.initPool();
    }
    
    init() {
        // 监听房间切换
        this.world.on('roomEntered', (roomId) => {
            this.switchRoom(roomId);
        });
        
        // 监听敌人死亡
        this.world.on('entityDestroyed', (entity) => {
            if (entity.hasTag('enemy')) {
                this.onEnemyKilled(entity);
            }
        });
        
        // 监听玩家受伤
        this.world.on('playerDamaged', (data) => {
            if (data.player) {
                this.onPlayerHurt(data.player);
            }
        });
        
        // 监听爆炸
        this.world.on('explosion', (data) => {
            this.createExplosionStains(data.x, data.y, data.radius || 100);
        });
    }
    
    /**
     * 初始化对象池
     */
    initPool() {
        for (let i = 0; i < this.config.poolSize; i++) {
            this.stainPool.push({
                active: false,
                x: 0,
                y: 0,
                type: 'directional',
                rotation: 0,
                size: 10,
                color: '#8B0000',
                alpha: 1,
                creationTime: 0,
                roomId: null,
                onFire: false,
                fireDuration: 0
            });
        }
    }
    
    /**
     * 切换房间
     */
    switchRoom(roomId) {
        // 保存当前房间血迹
        if (this.currentRoomId) {
            const roomStains = this.activeStains.filter(s => s.active && s.roomId === this.currentRoomId);
            this.roomStains.set(this.currentRoomId, roomStains.map(s => ({...s})));
        }
        
        // 清除活跃血迹
        this.activeStains.forEach(s => {
            s.active = false;
            this.stainPool.push(s);
        });
        this.activeStains = [];
        
        // 加载新房间血迹
        this.currentRoomId = roomId;
        const savedStains = this.roomStains.get(roomId);
        if (savedStains) {
            savedStains.forEach(data => {
                const stain = this.getStainFromPool();
                if (stain) {
                    Object.assign(stain, data);
                    stain.active = true;
                    this.activeStains.push(stain);
                }
            });
        }
    }
    
    /**
     * 从对象池获取血迹
     */
    getStainFromPool() {
        // 先找未激活的
        let stain = this.stainPool.find(s => !s.active);
        if (stain) return stain;
        
        // 对象池满了，找最旧的血迹
        if (this.activeStains.length > 0) {
            const oldest = this.activeStains.reduce((a, b) => a.creationTime < b.creationTime ? a : b);
            return oldest;
        }
        
        return null;
    }
    
    /**
     * 敌人被杀
     */
    onEnemyKilled(enemy) {
        const transform = enemy.get(TransformComponent);
        const health = enemy.get(HealthComponent);
        if (!transform) return;
        
        // 根据伤害类型决定血迹类型
        const deathType = this.getDeathType(enemy);
        
        // 创建血迹
        this.createStain(transform.x, transform.y, deathType, {
            damage: health ? health.maxHealth : 50,
            enemyType: enemy.get(EnemyComponent)?.enemyType || 'normal'
        });
    }
    
    /**
     * 玩家受伤
     */
    onPlayerHurt(player) {
        const transform = player.get(TransformComponent);
        if (!transform) return;
        
        // 玩家滴血效果（移动时）
        this.createStain(transform.x, transform.y, 'drip', {
            color: '#DC143C',
            size: 5
        });
    }
    
    /**
     * 创建血迹
     */
    createStain(x, y, type, options = {}) {
        if (!this.currentRoomId) return;
        
        const stain = this.getStainFromPool();
        if (!stain) return;
        
        stain.active = true;
        stain.x = x + (Math.random() - 0.5) * 20;
        stain.y = y + (Math.random() - 0.5) * 20;
        stain.type = type;
        stain.roomId = this.currentRoomId;
        stain.creationTime = Date.now();
        stain.onFire = false;
        stain.fireDuration = 0;
        
        // 根据类型设置属性
        switch (type) {
            case 'directional': // 方向性喷溅
                stain.rotation = options.direction || Math.random() * Math.PI * 2;
                stain.size = options.size || (20 + Math.random() * 30);
                stain.color = options.color || '#8B0000';
                break;
                
            case 'explosion': // 爆炸式
                stain.size = options.size || (40 + Math.random() * 40);
                stain.color = options.color || '#8B0000';
                stain.alpha = 0.7 + Math.random() * 0.3;
                break;
                
            case 'drip': // 滴落
                stain.size = options.size || (5 + Math.random() * 10);
                stain.color = options.color || '#8B0000';
                break;
                
            case 'fan': // 扇形
                stain.rotation = options.direction || Math.random() * Math.PI * 2;
                stain.size = options.size || (30 + Math.random() * 20);
                stain.color = options.color || '#8B0000';
                break;
        }
        
        // 根据敌人类型调整颜色
        if (options.enemyType) {
            const enemyColors = {
                'slime': '#00FF00',
                'ghost': '#E0E0E0',
                'turtle': '#8B4513',
                'boss_dragon': '#FF4500'
            };
            if (enemyColors[options.enemyType]) {
                stain.color = enemyColors[options.enemyType];
            }
        }
        
        this.activeStains.push(stain);
        
        // 限制数量
        this.trimStains();
    }
    
    /**
     * 创建爆炸血迹
     */
    createExplosionStains(x, y, radius) {
        const count = Math.floor(radius / 10);
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * radius;
            this.createStain(
                x + Math.cos(angle) * dist,
                y + Math.sin(angle) * dist,
                'explosion'
            );
        }
    }
    
    /**
     * 创建方向性喷溅
     */
    createDirectionalStain(x, y, direction, damage) {
        const size = Math.min(50, 20 + damage / 2);
        this.createStain(x, y, 'directional', { direction, size });
    }
    
    /**
     * 创建扇形血迹（近战）
     */
    createFanStain(x, y, direction) {
        this.createStain(x, y, 'fan', { direction, size: 40 });
    }
    
    /**
     * 获取死亡类型
     */
    getDeathType(enemy) {
        // 可以根据伤害来源判断，简化处理
        const types = ['directional', 'explosion', 'fan'];
        return types[Math.floor(Math.random() * types.length)];
    }
    
    /**
     * 限制血迹数量
     */
    trimStains() {
        const roomStains = this.activeStains.filter(s => s.roomId === this.currentRoomId);
        if (roomStains.length > this.config.maxStainsPerRoom) {
            // 移除最旧的
            const toRemove = roomStains
                .sort((a, b) => a.creationTime - b.creationTime)
                .slice(0, roomStains.length - this.config.maxStainsPerRoom);
            
            toRemove.forEach(s => {
                s.active = false;
            });
        }
    }
    
    /**
     * 点燃血迹
     */
    igniteStain(stain) {
        if (stain.onFire) return;
        
        stain.onFire = true;
        stain.fireDuration = 10; // 燃烧10秒
        stain.originalColor = stain.color;
    }
    
    /**
     * 渲染血迹
     */
    render(ctx) {
        const now = Date.now();
        
        this.activeStains.forEach(stain => {
            if (!stain.active || stain.roomId !== this.currentRoomId) return;
            
            // 计算淡出
            const age = (now - stain.creationTime) / 1000;
            let alpha = stain.alpha || 1;
            
            if (age > this.config.fadeTime) {
                const fadeProgress = (age - this.config.fadeTime) / this.config.fadeDuration;
                alpha *= (1 - fadeProgress);
            }
            
            if (alpha <= 0) {
                stain.active = false;
                return;
            }
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.translate(stain.x, stain.y);
            ctx.rotate(stain.rotation || 0);
            
            // 燃烧效果
            if (stain.onFire) {
                ctx.shadowColor = '#FF4500';
                ctx.shadowBlur = 20;
            }
            
            // 绘制血迹
            ctx.fillStyle = stain.color;
            
            switch (stain.type) {
                case 'directional':
                    this.drawDirectionalStain(ctx, stain);
                    break;
                case 'explosion':
                    this.drawExplosionStain(ctx, stain);
                    break;
                case 'drip':
                    this.drawDripStain(ctx, stain);
                    break;
                case 'fan':
                    this.drawFanStain(ctx, stain);
                    break;
            }
            
            ctx.restore();
        });
    }
    
    drawDirectionalStain(ctx, stain) {
        const size = stain.size;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(size, -size / 3);
        ctx.lineTo(size * 0.8, 0);
        ctx.lineTo(size, size / 3);
        ctx.closePath();
        ctx.fill();
        
        // 飞溅点
        for (let i = 0; i < 3; i++) {
            const sx = size * (0.5 + Math.random() * 0.5);
            const sy = (Math.random() - 0.5) * size;
            ctx.beginPath();
            ctx.arc(sx, sy, size / 10, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    drawExplosionStain(ctx, stain) {
        const size = stain.size;
        
        // 中心
        ctx.beginPath();
        ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // 辐射状
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const len = size * (0.5 + Math.random() * 0.5);
            ctx.beginPath();
            ctx.ellipse(
                Math.cos(angle) * len * 0.5,
                Math.sin(angle) * len * 0.5,
                len * 0.3,
                len * 0.1,
                angle,
                0,
                Math.PI * 2
            );
            ctx.fill();
        }
    }
    
    drawDripStain(ctx, stain) {
        const size = stain.size;
        
        // 主体
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();
        
        // 滴落痕迹
        ctx.beginPath();
        ctx.moveTo(-size * 0.3, size * 0.5);
        ctx.quadraticCurveTo(0, size * 2, size * 0.3, size * 0.5);
        ctx.fill();
    }
    
    drawFanStain(ctx, stain) {
        const size = stain.size;
        
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.arc(0, 0, size, -Math.PI / 4, Math.PI / 4);
        ctx.closePath();
        ctx.fill();
        
        // 内部纹理
        for (let i = 0; i < 5; i++) {
            const r = size * (0.3 + i * 0.15);
            ctx.beginPath();
            ctx.arc(0, 0, r, -Math.PI / 6, Math.PI / 6);
            ctx.strokeStyle = 'rgba(0,0,0,0.3)';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
    
    update(dt) {
        const now = Date.now();
        
        this.activeStains.forEach(stain => {
            if (!stain.active) return;
            
            // 更新燃烧
            if (stain.onFire) {
                stain.fireDuration -= dt;
                if (stain.fireDuration <= 0) {
                    stain.onFire = false;
                }
                
                // 燃烧时对附近敌人造成伤害
                if (Math.random() < 0.1) {
                    this.dealFireDamage(stain);
                }
            }
            
            // 清理过期血迹
            const age = (now - stain.creationTime) / 1000;
            if (age > this.config.fadeTime + this.config.fadeDuration) {
                stain.active = false;
            }
        });
        
        // 清理不活跃的血迹
        this.activeStains = this.activeStains.filter(s => s.active);
    }
    
    /**
     * 燃烧伤害
     */
    dealFireDamage(stain) {
        const enemies = this.world.getEntitiesWithTag('enemy');
        enemies.forEach(enemy => {
            const transform = enemy.get(TransformComponent);
            if (!transform) return;
            
            const dx = transform.x - stain.x;
            const dy = transform.y - stain.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 50) {
                const combat = this.world.getSystem(CombatSystem);
                if (combat) {
                    combat.dealDamage(null, enemy, 5, { isFire: true });
                }
            }
        });
    }
    
    /**
     * 玩家踩在血迹上
     */
    checkPlayerOnStain(player) {
        const transform = player.get(TransformComponent);
        if (!transform) return;
        
        this.activeStains.forEach(stain => {
            if (!stain.active || stain.roomId !== this.currentRoomId) return;
            
            const dx = transform.x - stain.x;
            const dy = transform.y - stain.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < stain.size) {
                // 留下血脚印
                this.createFootprint(transform.x, transform.y, stain.color);
                
                // 燃烧的血迹伤害玩家
                if (stain.onFire) {
                    const health = player.get(HealthComponent);
                    if (health) {
                        health.currentHealth -= 1;
                    }
                }
            }
        });
    }
    
    createFootprint(x, y, color) {
        // 简化的脚印效果
    }
}

window.BloodStainSystem = BloodStainSystem;
