/**
 * WeaponSystem - 武器系统
 * 管理所有武器逻辑：攻击、弹道、特效
 */

class WeaponSystem {
    constructor(world) {
        this.world = world;
        this.priority = 25;
        this.enabled = true;
        
        // 武器数据库
        this.weaponDatabase = new Map();
        
        // 投射物管理
        this.projectiles = [];
    }
    
    init() {
        this.loadWeaponData();
    }
    
    loadWeaponData() {
        // 内置武器数据 - 近战武器
        this.weaponDatabase.set('sword', {
            name: '铁剑',
            type: 'melee',
            damage: 15,
            cooldown: 0.5,
            range: 60,
            attackSpeed: 1,
            description: '基础近战武器',
            icon: '⚔️'
        });
        
        this.weaponDatabase.set('greatsword', {
            name: '巨剑',
            type: 'melee',
            damage: 35,
            cooldown: 0.9,
            range: 80,
            attackSpeed: 0.8,
            knockback: 100,
            description: '高伤害但攻速慢',
            icon: '🗡️'
        });
        
        this.weaponDatabase.set('dagger', {
            name: '匕首',
            type: 'melee',
            damage: 8,
            cooldown: 0.25,
            range: 40,
            attackSpeed: 1.5,
            critChance: 0.2,
            critDamage: 2,
            description: '超快攻速，高暴击',
            icon: '🗡️'
        });
        
        this.weaponDatabase.set('spear', {
            name: '长矛',
            type: 'melee',
            damage: 20,
            cooldown: 0.6,
            range: 100,
            attackSpeed: 1,
            pierce: 3,
            description: '长距离，可穿透敌人',
            icon: '🔱'
        });
        
        this.weaponDatabase.set('whip', {
            name: '鞭子',
            type: 'melee',
            damage: 28,
            cooldown: 0.75,
            range: 180,
            attackSpeed: 1,
            arcAngle: 140,
            knockback: 30,
            description: '弧形范围攻击，可同时命中多个敌人',
            icon: '🪄'
        });
        
        this.weaponDatabase.set('scythe', {
            name: '镰刀',
            type: 'melee',
            damage: 45,
            cooldown: 1.0,
            range: 170,
            attackSpeed: 0.8,
            circleAttack: true,
            knockback: 40,
            description: '周身圆形攻击，范围大',
            icon: '⚰️'
        });
        
        // 远程武器
        this.weaponDatabase.set('bow', {
            name: '木弓',
            type: 'ranged',
            damage: 12,
            cooldown: 0.7,
            range: 300,
            attackSpeed: 1.2,
            projectileSpeed: 400,
            description: '基础远程武器',
            icon: '🏹'
        });
        
        this.weaponDatabase.set('crossbow', {
            name: '十字弩',
            type: 'ranged',
            damage: 25,
            cooldown: 1.0,
            range: 350,
            attackSpeed: 0.9,
            projectileSpeed: 500,
            pierce: 1,
            description: '高伤害，可穿透',
            icon: '🏹'
        });
        
        this.weaponDatabase.set('magicWand', {
            name: '法杖',
            type: 'ranged',
            damage: 20,
            cooldown: 0.8,
            range: 250,
            attackSpeed: 1,
            projectileSpeed: 350,
            homing: true,
            homingRange: 150,
            description: '自动追踪敌人的魔法弹',
            icon: '🪄'
        });
        
        this.weaponDatabase.set('fireStaff', {
            name: '火焰法杖',
            type: 'ranged',
            damage: 15,
            cooldown: 0.4,
            range: 200,
            attackSpeed: 1.3,
            projectileSpeed: 300,
            areaDamage: true,
            areaRadius: 50,
            burnDamage: 5,
            burnDuration: 3,
            description: '范围伤害，附带灼烧',
            icon: '🔥'
        });
        
        this.weaponDatabase.set('lightningRod', {
            name: '雷电权杖',
            type: 'ranged',
            damage: 30,
            cooldown: 1.2,
            range: 400,
            attackSpeed: 0.8,
            projectileSpeed: 450,
            chainCount: 3,
            chainRange: 100,
            chainDamageReduction: 0.3,
            description: '弹射到附近敌人',
            icon: '⚡'
        });
        
        this.weaponDatabase.set('boomerang', {
            name: '回旋镖',
            type: 'ranged',
            damage: 12,
            cooldown: 0.9,
            range: 250,
            attackSpeed: 1,
            projectileSpeed: 300,
            returning: true,
            pierce: 999,
            description: '飞出后返回，可多次命中',
            icon: '🪃'
        });
        
        this.weaponDatabase.set('throwingKnife', {
            name: '飞刀',
            type: 'ranged',
            damage: 12,
            cooldown: 0.35,
            range: 400,
            attackSpeed: 1.5,
            projectileSpeed: 520,
            pierce: 3,
            burst: 3,
            description: '超快攻速，三连发',
            icon: '🗡️'
        });
        
        this.weaponDatabase.set('shuriken', {
            name: '手里剑',
            type: 'ranged',
            damage: 15,
            cooldown: 0.6,
            range: 400,
            attackSpeed: 1,
            projectileSpeed: 480,
            count: 3,
            spread: 25,
            description: '扇形发射三枚手里剑',
            icon: '🎯'
        });
        
        this.weaponDatabase.set('iceStaff', {
            name: '冰霜法杖',
            type: 'ranged',
            damage: 24,
            cooldown: 0.85,
            range: 500,
            attackSpeed: 1,
            projectileSpeed: 400,
            pierce: 99,
            slow: 0.4,
            slowDuration: 2,
            description: '穿透敌人并减速',
            icon: '❄️'
        });
    }
    
    update(dt) {
        // 更新所有武器冷却
        const weapons = this.world.getEntitiesWithComponents(WeaponComponent);
        
        for (const entity of weapons) {
            const weapon = entity.get(WeaponComponent);
            if (weapon.cooldownTimer > 0) {
                weapon.cooldownTimer -= dt;
            }
            
            if (weapon.isAttacking) {
                weapon.attackTimer -= dt;
                if (weapon.attackTimer <= 0) {
                    weapon.isAttacking = false;
                }
            }
        }
        
        // 更新投射物
        this.updateProjectiles(dt);
    }
    
    updateProjectiles(dt) {
        const projectiles = this.world.getEntitiesWithTag('projectile');
        
        for (const projectile of projectiles) {
            const proj = projectile.get(ProjectileComponent);
            const transform = projectile.get(TransformComponent);
            const movement = projectile.get(MovementComponent);
            
            if (!proj || !transform) continue;
            
            // 更新生命周期
            proj.lifetime -= dt;
            if (proj.lifetime <= 0) {
                projectile.destroy();
                continue;
            }
            
            // 追踪逻辑
            if (proj.isHoming && !proj.target) {
                proj.target = this.findNearestEnemy(transform);
            }
            
            if (proj.isHoming && proj.target && proj.target.active) {
                const targetTransform = proj.target.get(TransformComponent);
                if (targetTransform) {
                    const dx = targetTransform.x - transform.x;
                    const dy = targetTransform.y - transform.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    
                    if (dist > 0) {
                        // 调整速度方向
                        const turnRate = 5 * dt;
                        const targetVx = (dx / dist) * proj.speed;
                        const targetVy = (dy / dist) * proj.speed;
                        
                        movement.vx += (targetVx - movement.vx) * turnRate;
                        movement.vy += (targetVy - movement.vy) * turnRate;
                    }
                }
            }
        }
    }
    
    findNearestEnemy(fromTransform) {
        const enemies = this.world.getEntitiesWithTag('enemy');
        let nearest = null;
        let nearestDist = Infinity;
        
        for (const enemy of enemies) {
            const transform = enemy.get(TransformComponent);
            if (!transform) continue;
            
            const dx = transform.x - fromTransform.x;
            const dy = transform.y - fromTransform.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = enemy;
            }
        }
        
        return nearest;
    }
    
    /**
     * 创建武器组件
     */
    createWeapon(weaponId, level = 1) {
        const data = this.weaponDatabase.get(weaponId);
        if (!data) return null;
        
        const weapon = new WeaponComponent({
            weaponId: weaponId,
            damage: data.damage * Math.pow(1.2, level - 1),
            cooldown: data.cooldown * Math.pow(0.95, level - 1),
            range: data.range,
            attackSpeed: data.attackSpeed,
            projectileSpeed: data.projectileSpeed || 300,
            pierce: data.pierce || 0,
            level: level
        });
        
        return weapon;
    }
    
    /**
     * 获取武器数据
     */
    getWeaponData(weaponId) {
        return this.weaponDatabase.get(weaponId);
    }
    
    /**
     * 执行武器攻击
     */
    performAttack(entity, targetPos) {
        const weapon = entity.get(WeaponComponent);
        const transform = entity.get(TransformComponent);
        
        if (!weapon || !transform) return false;
        if (weapon.cooldownTimer > 0) return false;
        
        const data = this.weaponDatabase.get(weapon.weaponId);
        if (!data) return false;
        
        // 设置冷却
        weapon.cooldownTimer = weapon.cooldown / weapon.attackSpeed;
        weapon.isAttacking = true;
        weapon.attackTimer = 0.3;
        
        // 计算方向
        const dx = targetPos.x - transform.x;
        const dy = targetPos.y - transform.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist === 0) return false;
        
        const dirX = dx / dist;
        const dirY = dy / dist;
        const direction = { x: dirX, y: dirY };
        
        // 根据武器ID执行特殊攻击逻辑
        switch (weapon.weaponId) {
            case 'whip':
                this.performWhipAttack(entity, weapon, transform, direction, data);
                break;
            case 'scythe':
                this.performScytheAttack(entity, weapon, transform, data);
                break;
            case 'throwingKnife':
                this.performThrowingKnifeAttack(entity, weapon, transform, direction, data);
                break;
            case 'shuriken':
                this.performShurikenAttack(entity, weapon, transform, direction, data);
                break;
            case 'iceStaff':
                this.performIceStaffAttack(entity, weapon, transform, direction, data);
                break;
            default:
                // 根据武器类型执行标准攻击
                if (data.type === 'melee') {
                    this.performMeleeAttack(entity, weapon, transform, direction, data);
                } else {
                    this.performRangedAttack(entity, weapon, transform, direction, data);
                }
        }
        
        return true;
    }
    
    performMeleeAttack(entity, weapon, transform, direction, data) {
        // 近战攻击：在扇形范围内造成伤害
        const attackAngle = Math.PI / 3; // 60度扇形
        const enemies = this.world.getEntitiesWithTag('enemy');
        
        for (const enemy of enemies) {
            const enemyTransform = enemy.get(TransformComponent);
            if (!enemyTransform) continue;
            
            const dx = enemyTransform.x - transform.x;
            const dy = enemyTransform.y - transform.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > weapon.range) continue;
            
            // 检查角度
            const angle = Math.atan2(dy, dx);
            const attackDirAngle = Math.atan2(direction.y, direction.x);
            const angleDiff = Math.abs(this.normalizeAngle(angle - attackDirAngle));
            
            if (angleDiff <= attackAngle / 2) {
                // 造成伤害
                const combatSystem = this.world.getSystem(CombatSystem);
                if (combatSystem) {
                    combatSystem.dealDamage(entity, enemy, weapon.damage);
                }
            }
        }
    }
    
    performRangedAttack(entity, weapon, transform, direction, data) {
        // 创建投射物
        const startX = transform.x + direction.x * 20;
        const startY = transform.y + direction.y * 20;
        
        const projectile = this.world.createProjectile(
            startX,
            startY,
            direction,
            entity.id,
            {
                damage: weapon.damage,
                speed: weapon.projectileSpeed,
                pierce: weapon.pierce,
                lifetime: 3,
                isHoming: data.homing || false
            }
        );
    }
    
    normalizeAngle(angle) {
        while (angle > Math.PI) angle -= Math.PI * 2;
        while (angle < -Math.PI) angle += Math.PI * 2;
        return angle;
    }
    
    /**
     * 鞭子攻击 - 弧形大范围
     */
    performWhipAttack(entity, weapon, transform, direction, data) {
        const arcAngle = (data.arcAngle || 140) * Math.PI / 180;
        const enemies = this.world.getEntitiesWithTag('enemy');
        
        for (const enemy of enemies) {
            const enemyTransform = enemy.get(TransformComponent);
            if (!enemyTransform) continue;
            
            const dx = enemyTransform.x - transform.x;
            const dy = enemyTransform.y - transform.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > weapon.range) continue;
            
            const angle = Math.atan2(dy, dx);
            const attackDirAngle = Math.atan2(direction.y, direction.x);
            const angleDiff = Math.abs(this.normalizeAngle(angle - attackDirAngle));
            
            if (angleDiff <= arcAngle / 2) {
                const combatSystem = this.world.getSystem(CombatSystem);
                if (combatSystem) {
                    combatSystem.dealDamage(entity, enemy, weapon.damage);
                }
            }
        }
        
        // 创建鞭子视觉效果
        this.createWhipEffect(transform, direction, arcAngle, weapon.range);
    }
    
    /**
     * 镰刀攻击 - 周身圆形
     */
    performScytheAttack(entity, weapon, transform, data) {
        const enemies = this.world.getEntitiesWithTag('enemy');
        
        for (const enemy of enemies) {
            const enemyTransform = enemy.get(TransformComponent);
            if (!enemyTransform) continue;
            
            const dx = enemyTransform.x - transform.x;
            const dy = enemyTransform.y - transform.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist <= weapon.range) {
                const combatSystem = this.world.getSystem(CombatSystem);
                if (combatSystem) {
                    combatSystem.dealDamage(entity, enemy, weapon.damage);
                }
            }
        }
        
        // 创建圆形攻击效果
        this.createCircleEffect(transform, weapon.range);
    }
    
    /**
     * 飞刀攻击 - 三连发burst
     */
    performThrowingKnifeAttack(entity, weapon, transform, direction, data) {
        const burstCount = data.burst || 3;
        const burstDelay = 0.08; // 每发间隔
        
        for (let i = 0; i < burstCount; i++) {
            setTimeout(() => {
                if (!entity.active) return;
                const startX = transform.x + direction.x * 20;
                const startY = transform.y + direction.y * 20;
                
                this.world.createProjectile(
                    startX,
                    startY,
                    direction,
                    entity.id,
                    {
                        damage: weapon.damage,
                        speed: weapon.projectileSpeed,
                        pierce: data.pierce || 3,
                        lifetime: 2.5,
                        isHoming: false,
                        size: 6
                    }
                );
            }, i * burstDelay * 1000);
        }
    }
    
    /**
     * 手里剑攻击 - 扇形多发
     */
    performShurikenAttack(entity, weapon, transform, direction, data) {
        const count = data.count || 3;
        const spreadAngle = (data.spread || 25) * Math.PI / 180;
        const baseAngle = Math.atan2(direction.y, direction.x);
        
        for (let i = 0; i < count; i++) {
            const angleOffset = (i - (count - 1) / 2) * spreadAngle / (count - 1 || 1);
            const angle = baseAngle + angleOffset;
            const dir = {
                x: Math.cos(angle),
                y: Math.sin(angle)
            };
            
            const startX = transform.x + dir.x * 20;
            const startY = transform.y + dir.y * 20;
            
            this.world.createProjectile(
                startX,
                startY,
                dir,
                entity.id,
                {
                    damage: weapon.damage,
                    speed: weapon.projectileSpeed,
                    pierce: 0,
                    lifetime: 2,
                    isHoming: false,
                    size: 8
                }
            );
        }
    }
    
    /**
     * 冰杖攻击 - 穿透+减速
     */
    performIceStaffAttack(entity, weapon, transform, direction, data) {
        const startX = transform.x + direction.x * 20;
        const startY = transform.y + direction.y * 20;
        
        const projectile = this.world.createProjectile(
            startX,
            startY,
            direction,
            entity.id,
            {
                damage: weapon.damage,
                speed: weapon.projectileSpeed,
                pierce: data.pierce || 99,
                lifetime: 3,
                isHoming: false,
                size: 10,
                color: '#00ffff'
            }
        );
        
        // 添加减速效果标记
        const projComp = projectile.get(ProjectileComponent);
        if (projComp) {
            projComp.slow = data.slow || 0.4;
            projComp.slowDuration = data.slowDuration || 2;
        }
    }
    
    /**
     * 创建鞭子视觉效果
     */
    createWhipEffect(transform, direction, arcAngle, range) {
        const particleSystem = this.world.getSystem(ParticleSystem);
        if (!particleSystem) return;
        
        const baseAngle = Math.atan2(direction.y, direction.x);
        const steps = 10;
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const angleOffset = (t - 0.5) * arcAngle;
            const angle = baseAngle + angleOffset;
            const dist = range * (0.5 + t * 0.5);
            
            const px = transform.x + Math.cos(angle) * dist;
            const py = transform.y + Math.sin(angle) * dist;
            
            particleSystem.createParticle({
                x: px,
                y: py,
                vx: 0,
                vy: 0,
                life: 0.2,
                color: '#ff6b6b',
                size: 3
            });
        }
    }
    
    /**
     * 创建圆形攻击效果
     */
    createCircleEffect(transform, range) {
        const particleSystem = this.world.getSystem(ParticleSystem);
        if (!particleSystem) return;
        
        const count = 16;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const px = transform.x + Math.cos(angle) * range;
            const py = transform.y + Math.sin(angle) * range;
            
            particleSystem.createParticle({
                x: px,
                y: py,
                vx: -Math.cos(angle) * 50,
                vy: -Math.sin(angle) * 50,
                life: 0.3,
                color: '#9c27b0',
                size: 4
            });
        }
    }
    
    destroy() {}
}

window.WeaponSystem = WeaponSystem;
