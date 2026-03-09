/**
 * 肉鸽牛牛 - 武器系统
 * 8种基础武器 + 进化 + 道具影响
 */

// ==================== 子弹类 ====================
class Bullet extends Entity {
    constructor(x, y, options = {}) {
        super(x, y, options.size || 8, options.size || 8);
        this.vel = new Vec2(
            Math.cos(options.angle) * options.speed,
            Math.sin(options.angle) * options.speed
        );
        this.damage = options.damage || 10;
        this.life = options.life || 3.0;
        this.pierce = options.pierce || 0;
        this.bounce = options.bounce || 0;
        this.homing = options.homing || false;
        this.homingRange = options.homingRange || 150;
        this.homingStrength = options.homingStrength || 2;
        this.split = options.split || 0;
        this.chain = options.chain || 0;
        this.explosion = options.explosion || 0;
        this.slow = options.slow || false;
        this.freeze = options.freeze || false;
        this.burn = options.burn || 0;
        this.poison = options.poison || 0;
        this.color = options.color || '#fff';
        this.trail = options.trail || false;
        this.returning = options.returning || false;
        this.owner = options.owner;
        this.hitEnemies = new Set();
        this.origPos = new Vec2(x, y);
        this.returnSpeed = 0;
    }

    update(dt, enemies) {
        // 追踪效果
        if (this.homing && enemies.length > 0) {
            let nearest = null;
            let nearestDist = this.homingRange;
            
            for (const enemy of enemies) {
                const dist = this.distanceTo(enemy);
                if (dist < nearestDist && !this.hitEnemies.has(enemy)) {
                    nearest = enemy;
                    nearestDist = dist;
                }
            }

            if (nearest) {
                const desired = nearest.pos.sub(this.pos).normalize();
                const current = this.vel.normalize();
                const angle = Math.atan2(desired.y, desired.x) - Math.atan2(current.y, current.x);
                const turn = Math.atan2(Math.sin(angle), Math.cos(angle)) * this.homingStrength * dt;
                const newAngle = Math.atan2(this.vel.y, this.vel.x) + turn;
                const speed = this.vel.length();
                this.vel = Vec2.fromAngle(newAngle).mul(speed);
            }
        }

        // 回旋效果
        if (this.returning) {
            const dist = this.pos.distance(this.origPos);
            const maxDist = 200;
            
            if (dist > maxDist || this.vel.length() < 50) {
                // 返回
                const returnDir = this.owner.pos.sub(this.pos).normalize();
                this.vel = returnDir.mul(300);
                
                // 检查是否回到玩家
                if (this.distanceTo(this.owner) < 20) {
                    this.destroy();
                }
            }
        }

        super.update(dt);
        this.life -= dt;

        if (this.life <= 0) {
            if (this.explosion > 0) {
                // 爆炸由外部处理
                this.shouldExplode = true;
            }
            this.destroy();
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.atan2(this.vel.y, this.vel.x));

        // 子弹主体
        ctx.fillStyle = this.color;
        if (this.explosion > 0) {
            ctx.beginPath();
            ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        }

        // 光效
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    hit(enemy) {
        if (this.hitEnemies.has(enemy)) return false;
        this.hitEnemies.add(enemy);
        
        this.pierce--;
        if (this.pierce < 0) {
            if (this.bounce > 0) {
                this.bounce--;
                this.vel.x *= -1;
                this.hitEnemies.clear();
                return false; // 没真正击中
            }
            
            if (this.split > 0) {
                this.shouldSplit = true;
            }
            
            this.destroy();
            return true;
        }
        
        return true;
    }
}

// ==================== 武器配置 ====================
const WEAPONS = {
    // 1. 鞭子 - 近战，范围广
    whip: {
        id: 'whip',
        name: '鞭子',
        icon: '🪄',
        description: '近战范围攻击',
        damage: 15,
        cooldown: 1.5,
        range: 80,
        arc: Math.PI * 0.8,
        color: '#ff6600',
        type: 'melee',
        evolution: {
            requires: ['hollowHeart'],
            result: 'bloodyTear',
            name: '血泪',
            bonus: { damage: 1.5, lifesteal: 0.1 }
        }
    },

    // 2. 魔杖 - 自动追踪
    wand: {
        id: 'wand',
        name: '魔杖',
        icon: '🔮',
        description: '自动追踪敌人',
        damage: 10,
        cooldown: 1.2,
        speed: 200,
        homing: true,
        color: '#4488ff',
        type: 'projectile',
        evolution: {
            requires: ['emptyTome'],
            result: 'holyWand',
            name: '神圣魔杖',
            bonus: { cooldown: 0.5, pierce: 3 }
        }
    },

    // 3. 飞刀 - 穿透
    knife: {
        id: 'knife',
        name: '飞刀',
        icon: '🗡️',
        description: '快速穿透',
        damage: 8,
        cooldown: 0.8,
        speed: 350,
        pierce: 3,
        color: '#cccccc',
        type: 'projectile',
        evolution: {
            requires: ['bracer'],
            result: 'thousandEdge',
            name: '千刃',
            bonus: { pierce: 999, damage: 2 }
        }
    },

    // 4. 斧头 - 回旋
    axe: {
        id: 'axe',
        name: '斧头',
        icon: '🪓',
        description: '回旋攻击',
        damage: 20,
        cooldown: 2.0,
        speed: 180,
        returning: true,
        color: '#8b4513',
        type: 'projectile',
        evolution: {
            requires: ['candelabrador'],
            result: 'deathSpiral',
            name: '死亡螺旋',
            bonus: { projectileCount: 3 }
        }
    },

    // 5. 圣经 - 环绕
    bible: {
        id: 'bible',
        name: '圣经',
        icon: '📖',
        description: '环绕保护',
        damage: 12,
        cooldown: 3.0,
        orbitRadius: 60,
        orbitSpeed: 3,
        duration: 3,
        color: '#ffd700',
        type: 'orbit',
        evolution: {
            requires: ['spellbinder'],
            result: 'unholyVespers',
            name: '不洁晚祷',
            bonus: { duration: 2, orbitRadius: 1.5 }
        }
    },

    // 6. 火球 - 爆炸
    fireball: {
        id: 'fireball',
        name: '火球',
        icon: '🔥',
        description: '爆炸范围伤害',
        damage: 25,
        cooldown: 2.5,
        speed: 150,
        explosion: 60,
        color: '#ff4400',
        type: 'projectile',
        evolution: {
            requires: ['spinach'],
            result: 'hellfire',
            name: '地狱火',
            bonus: { explosion: 2, damage: 1.5 }
        }
    },

    // 7. 闪电 - 连锁
    lightning: {
        id: 'lightning',
        name: '闪电',
        icon: '⚡',
        description: '连锁攻击',
        damage: 15,
        cooldown: 2.0,
        chain: 4,
        chainRange: 120,
        color: '#ffff00',
        type: 'instant',
        evolution: {
            requires: ['duplicator'],
            result: 'thunderLoop',
            name: '雷霆循环',
            bonus: { chain: 3, cooldown: 0.7 }
        }
    },

    // 8. 圣水 - 区域
    holyWater: {
        id: 'holyWater',
        name: '圣水',
        icon: '💧',
        description: '地面持续伤害',
        damage: 8,
        cooldown: 3.0,
        duration: 4,
        radius: 50,
        color: '#00ffff',
        type: 'area',
        evolution: {
            requires: ['attractorb'],
            result: 'saracenWater',
            name: '撒拉逊之水',
            bonus: { duration: 2, radius: 1.5 }
        }
    }
};

// ==================== 武器实例 ====================
class Weapon {
    constructor(weaponId, level = 1) {
        this.config = WEAPONS[weaponId];
        this.id = weaponId;
        this.level = level;
        this.cooldown = 0;
        this.orbitAngle = 0;
        this.isEvolved = false;
    }

    get damage() {
        let base = this.config.damage;
        // 等级加成
        base *= (1 + (this.level - 1) * 0.2);
        return base;
    }

    get cooldownTime() {
        return this.config.cooldown;
    }

    canEvolve(items) {
        if (this.isEvolved || !this.config.evolution) return false;
        return this.config.evolution.requires.every(item => items.hasItem(item));
    }

    evolve() {
        if (!this.canEvolve) return;
        this.isEvolved = true;
        this.level = Math.max(this.level, 8);
        console.log(`武器进化: ${this.config.name} → ${this.config.evolution.name}`);
    }

    update(dt) {
        if (this.cooldown > 0) this.cooldown -= dt;
        this.orbitAngle += (this.config.orbitSpeed || 0) * dt;
    }

    canFire() {
        return this.cooldown <= 0;
    }

    fire(source, target, itemStats) {
        this.cooldown = this.cooldownTime * itemStats.fireRate;
        
        const bullets = [];
        const count = itemStats.projectileCount;
        
        // 计算基础角度
        let baseAngle = 0;
        if (target) {
            baseAngle = Math.atan2(target.y - source.y, target.x - source.x);
        }

        for (let i = 0; i < count; i++) {
            let angle = baseAngle;
            
            // 散射
            if (count > 1) {
                const spread = Math.PI / 6; // 30度散射
                angle += spread * (i - (count - 1) / 2) / (count - 1);
            }

            bullets.push(...this.createBullet(source, angle, itemStats));
        }

        return bullets;
    }

    createBullet(source, angle, itemStats) {
        const bullets = [];
        const cfg = this.config;

        switch (cfg.type) {
            case 'melee':
                // 近战武器创建扇形攻击区域
                bullets.push({
                    type: 'melee',
                    x: source.x,
                    y: source.y,
                    angle: angle,
                    arc: cfg.arc * (1 + itemStats.projectileSize),
                    range: cfg.range,
                    damage: this.damage * itemStats.damage,
                    color: cfg.color,
                    life: 0.3,
                    pierce: 999,
                    knockback: 50
                });
                break;

            case 'projectile':
                const size = 8 * itemStats.projectileSize;
                bullets.push(new Bullet(source.x, source.y, {
                    angle: angle,
                    speed: cfg.speed * (1 + (itemStats.projectileSpeed - 1) * 0.5),
                    damage: this.damage * itemStats.damage,
                    size: size,
                    color: cfg.color,
                    pierce: (cfg.pierce || 0) + itemStats.pierceCount,
                    bounce: itemStats.bounceCount,
                    homing: cfg.homing || itemStats.homingAngle > 0,
                    homingStrength: itemStats.homingAngle / 30,
                    returning: cfg.returning,
                    owner: source,
                    split: itemStats.splitCount,
                    explosion: cfg.explosion ? cfg.explosion * (1 + itemStats.explosionRadius) : 0
                }));
                break;

            case 'orbit':
                // 环绕武器创建多个环绕点
                const orbitCount = this.isEvolved ? 6 : 3;
                for (let i = 0; i < orbitCount; i++) {
                    const orbitAngle = this.orbitAngle + (Math.PI * 2 * i / orbitCount);
                    bullets.push({
                        type: 'orbit',
                        x: source.x + Math.cos(orbitAngle) * cfg.orbitRadius,
                        y: source.y + Math.sin(orbitAngle) * cfg.orbitRadius,
                        orbitCenter: source,
                        orbitAngle: orbitAngle,
                        orbitRadius: cfg.orbitRadius * (this.isEvolved ? 1.5 : 1),
                        damage: this.damage * itemStats.damage,
                        color: cfg.color,
                        size: 12 * itemStats.projectileSize,
                        life: cfg.duration * (this.isEvolved ? 2 : 1),
                        pierce: 999
                    });
                }
                break;

            case 'area':
                bullets.push({
                    type: 'area',
                    x: source.x + Math.cos(angle) * 100,
                    y: source.y + Math.sin(angle) * 100,
                    radius: cfg.radius * itemStats.projectileSize,
                    damage: this.damage * itemStats.damage,
                    color: cfg.color,
                    duration: cfg.duration * (this.isEvolved ? 2 : 1),
                    tickRate: 0.5
                });
                break;

            case 'instant':
                // 闪电立即命中
                bullets.push({
                    type: 'lightning',
                    source: source,
                    target: target,
                    chain: cfg.chain + (this.isEvolved ? 3 : 0),
                    chainRange: cfg.chainRange,
                    damage: this.damage * itemStats.damage,
                    color: cfg.color
                });
                break;
        }

        return bullets;
    }
}

// ==================== 武器管理器 ====================
class WeaponManager {
    constructor(player) {
        this.player = player;
        this.weapons = [];
        this.maxSlots = 6;
        this.bullets = [];
        this.areas = []; // 持续区域效果
    }

    addWeapon(weaponId) {
        if (this.weapons.length >= this.maxSlots) {
            // 可以升级现有武器
            const existing = this.weapons.find(w => w.id === weaponId);
            if (existing) {
                existing.level++;
                return true;
            }
            return false;
        }

        // 检查是否是新武器
        const existing = this.weapons.find(w => w.id === weaponId);
        if (existing) {
            existing.level++;
        } else {
            this.weapons.push(new Weapon(weaponId, 1));
        }
        return true;
    }

    update(dt, enemies, itemManager) {
        const itemStats = itemManager.recalculateStats();
        
        // 更新武器冷却
        for (const weapon of this.weapons) {
            weapon.update(dt);

            // 检查进化
            if (weapon.canEvolve && weapon.canEvolve(itemManager)) {
                weapon.evolve();
            }

            // 自动攻击
            if (weapon.canFire()) {
                const target = this.findNearestEnemy(enemies);
                const newBullets = weapon.fire(this.player, target, itemStats);
                this.bullets.push(...newBullets);
            }
        }

        // 更新子弹
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            
            if (b instanceof Bullet) {
                b.update(dt, enemies);
                if (!b.alive) {
                    // 处理爆炸
                    if (b.shouldExplode && b.explosion > 0) {
                        this.createExplosion(b.x, b.y, b.explosion, b.damage, b.color);
                    }
                    // 处理分裂
                    if (b.shouldSplit && b.split > 0) {
                        for (let j = 0; j < b.split; j++) {
                            const angle = (Math.PI * 2 * j) / b.split;
                            this.bullets.push(new Bullet(b.x, b.y, {
                                angle: angle,
                                speed: b.vel.length() * 0.7,
                                damage: b.damage * 0.5,
                                size: b.width * 0.6,
                                color: b.color,
                                life: b.life * 0.5
                            }));
                        }
                    }
                    this.bullets.splice(i, 1);
                }
            } else {
                // 特殊子弹类型
                b.life -= dt;
                if (b.life <= 0) this.bullets.splice(i, 1);

                // 更新环绕位置
                if (b.type === 'orbit') {
                    b.x = b.orbitCenter.x + Math.cos(b.orbitAngle) * b.orbitRadius;
                    b.y = b.orbitCenter.y + Math.sin(b.orbitAngle) * b.orbitRadius;
                    b.orbitAngle += 3 * dt;
                }
            }
        }

        // 更新区域效果
        for (let i = this.areas.length - 1; i >= 0; i--) {
            const area = this.areas[i];
            area.duration -= dt;
            if (area.duration <= 0) {
                this.areas.splice(i, 1);
            }
        }
    }

    findNearestEnemy(enemies) {
        let nearest = null;
        let nearestDist = Infinity;
        
        for (const enemy of enemies) {
            const dist = this.player.distanceTo(enemy);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = enemy;
            }
        }
        
        return nearest;
    }

    createExplosion(x, y, radius, damage, color) {
        this.areas.push({
            type: 'explosion',
            x, y, radius, damage, color,
            duration: 0.3,
            hitEnemies: new Set()
        });
    }

    draw(ctx) {
        // 绘制子弹
        for (const b of this.bullets) {
            if (b instanceof Bullet) {
                b.draw(ctx);
            } else if (b.type === 'melee') {
                // 绘制近战扇形
                ctx.save();
                ctx.translate(b.x, b.y);
                ctx.rotate(b.angle);
                ctx.fillStyle = b.color + '60';
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.arc(0, 0, b.range, -b.arc / 2, b.arc / 2);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            } else if (b.type === 'orbit') {
                // 绘制环绕物
                ctx.save();
                ctx.fillStyle = b.color;
                ctx.shadowBlur = 10;
                ctx.shadowColor = b.color;
                ctx.beginPath();
                ctx.arc(b.x, b.y, b.size / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            } else if (b.type === 'area') {
                // 绘制区域
                ctx.save();
                ctx.fillStyle = b.color + '40';
                ctx.strokeStyle = b.color;
                ctx.beginPath();
                ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            }
        }

        // 绘制区域效果
        for (const area of this.areas) {
            ctx.save();
            ctx.fillStyle = area.color + '60';
            ctx.beginPath();
            ctx.arc(area.x, area.y, area.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
}

// ==================== 导出 ====================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Bullet, Weapon, WeaponManager, WEAPONS };
}
