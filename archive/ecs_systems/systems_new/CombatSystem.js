/**
 * CombatSystem - 战斗系统
 * 处理伤害计算、死亡判定、生命恢复
 */

class CombatSystem {
    constructor(world) {
        this.world = world;
        this.priority = 30;
        this.enabled = true;
        
        // 伤害事件
        this.onDamage = null;
        this.onKill = null;
        this.onDeath = null;
        this.onLevelUp = null;
    }
    
    init() {}
    
    update(dt) {
        // 更新所有生命组件
        const entities = this.world.getEntitiesWithComponents(HealthComponent);
        
        for (const entity of entities) {
            this.processEntity(entity, dt);
        }
        
        // 更新投射物
        this.updateProjectiles(dt);
    }
    
    processEntity(entity, dt) {
        const health = entity.get(HealthComponent);
        if (!health) return;
        
        // 更新无敌时间
        if (health.invincibleTime > 0) {
            health.invincibleTime -= dt;
            if (health.invincibleTime <= 0) {
                health.invincible = false;
            }
        }
        
        // 更新受伤闪烁
        if (health.damageFlash > 0) {
            health.damageFlash -= dt * 5;
            if (health.damageFlash < 0) health.damageFlash = 0;
        }
        
        // 生命恢复
        if (health.regenRate > 0 && health.currentHealth < health.maxHealth) {
            const timeSinceDamage = performance.now() / 1000 - health.lastDamageTime;
            if (timeSinceDamage > health.regenDelay) {
                this.heal(entity, health.regenRate * dt);
            }
        }
        
        // 检查死亡
        if (health.currentHealth <= 0) {
            this.handleDeath(entity);
        }
    }
    
    updateProjectiles(dt) {
        const projectiles = this.world.getEntitiesWithTag('projectile');
        
        for (const projectile of projectiles) {
            const projComp = projectile.get(ProjectileComponent);
            if (!projComp) continue;
            
            // 更新生命周期
            projComp.lifetime -= dt;
            if (projComp.lifetime <= 0) {
                projectile.destroy();
                continue;
            }
            
            // 检查碰撞
            const collider = projectile.get(ColliderComponent);
            if (collider && collider.collisions.length > 0) {
                for (const target of collider.collisions) {
                    if (target.id === projComp.owner) continue;
                    if (target.hasTag('projectile')) continue;
                    
                    // 造成伤害
                    if (target.has(HealthComponent)) {
                        this.dealDamage(projectile, target, projComp.damage);
                        projComp.hitEntities.add(target.id);
                        
                        // 应用减速效果
                        if (projComp.slow > 0 && projComp.slowDuration > 0) {
                            this.applyStatusEffect(target, {
                                type: 'slow',
                                duration: projComp.slowDuration,
                                strength: projComp.slow,
                                source: projComp.owner
                            });
                        }
                        
                        // 处理穿透
                        projComp.pierce--;
                        if (projComp.pierce < 0) {
                            projectile.destroy();
                            break;
                        }
                    }
                }
            }
        }
    }
    
    /**
     * 造成伤害
     */
    dealDamage(attacker, target, damage, options = {}) {
        const targetHealth = target.get(HealthComponent);
        if (!targetHealth || targetHealth.invincible) return false;
        
        const targetMove = target.get(MovementComponent);
        if (targetMove && targetMove.dashInvincible) return false;
        
        // 计算实际伤害
        let actualDamage = damage;
        
        // 护甲减伤
        if (targetHealth.armor > 0) {
            const reduction = targetHealth.armor / (targetHealth.armor + 100);
            actualDamage *= (1 - reduction);
        }
        
        // 暴击
        let isCritical = false;
        if (attacker && attacker.has(WeaponComponent) && options.canCrit !== false) {
            const weapon = attacker.get(WeaponComponent);
            if (Math.random() < weapon.criticalChance) {
                actualDamage *= weapon.criticalDamage;
                isCritical = true;
            }
        }
        
        actualDamage = Math.max(1, Math.floor(actualDamage));
        
        // 应用伤害
        targetHealth.currentHealth -= actualDamage;
        targetHealth.lastDamageTime = performance.now() / 1000;
        targetHealth.damageFlash = 1;
        
        // 触发无敌帧
        targetHealth.invincible = true;
        targetHealth.invincibleTime = options.invincibleTime || 0.1;
        
        // 触发事件
        if (this.onDamage) {
            this.onDamage(attacker, target, actualDamage, isCritical);
        }
        
        // 生命偷取
        if (attacker && attacker.has(WeaponComponent)) {
            const weapon = attacker.get(WeaponComponent);
            if (weapon.lifeSteal > 0) {
                const healAmount = actualDamage * weapon.lifeSteal;
                this.heal(attacker, healAmount);
            }
        }
        
        // 更新玩家统计
        if (attacker && attacker.has(PlayerComponent)) {
            const player = attacker.get(PlayerComponent);
            player.damageDealt += actualDamage;
        }
        if (target.has(PlayerComponent)) {
            const player = target.get(PlayerComponent);
            player.damageTaken += actualDamage;
        }
        
        return true;
    }
    
    /**
     * 治疗
     */
    heal(entity, amount) {
        const health = entity.get(HealthComponent);
        if (!health) return false;
        
        health.currentHealth = Math.min(health.maxHealth, health.currentHealth + amount);
        return true;
    }
    
    /**
     * 处理死亡
     */
    handleDeath(entity) {
        // 触发死亡事件
        if (this.onDeath) {
            this.onDeath(entity);
        }
        
        // 敌人死亡处理
        if (entity.has(EnemyComponent)) {
            this.handleEnemyDeath(entity);
        }
        
        // 玩家死亡处理
        if (entity.has(PlayerComponent)) {
            this.handlePlayerDeath(entity);
        }
        
        // 销毁实体
        entity.destroy();
    }
    
    handleEnemyDeath(entity) {
        const enemy = entity.get(EnemyComponent);
        const health = entity.get(HealthComponent);
        const transform = entity.get(TransformComponent);
        
        // 给予经验值
        const killers = [];
        // 找到造成伤害的玩家
        // TODO: 实现伤害来源追踪
        
        // 给予所有玩家经验
        const players = this.world.getEntitiesWithTag('player');
        for (const player of players) {
            const playerComp = player.get(PlayerComponent);
            if (playerComp) {
                const expGain = enemy.expValue * (1 + (enemy.level - 1) * 0.1);
                this.giveExp(player, expGain);
                playerComp.kills++;
            }
        }
        
        // 掉落道具
        this.spawnDrops(entity);
        
        // 触发击杀事件
        if (this.onKill) {
            this.onKill(entity);
        }
    }
    
    handlePlayerDeath(entity) {
        // TODO: 游戏结束处理
        console.log('Player died!');
    }
    
    /**
     * 给予经验值
     */
    giveExp(entity, amount) {
        const player = entity.get(PlayerComponent);
        const health = entity.get(HealthComponent);
        
        if (!player) return;
        
        player.experience += amount;
        
        // 检查升级
        while (player.experience >= player.nextLevelExp) {
            player.experience -= player.nextLevelExp;
            player.level++;
            player.skillPoints++;
            player.nextLevelExp = Math.floor(player.nextLevelExp * 1.2);
            
            // 提升属性
            player.strength += 1;
            player.agility += 1;
            player.vitality += 1;
            
            // 恢复生命
            if (health) {
                health.maxHealth += 10;
                health.currentHealth = health.maxHealth;
            }
            
            if (this.onLevelUp) {
                this.onLevelUp(entity, player.level);
            }
        }
    }
    
    /**
     * 生成掉落
     */
    spawnDrops(entity) {
        const enemy = entity.get(EnemyComponent);
        const transform = entity.get(TransformComponent);
        
        if (!enemy || !transform) return;
        
        // 金币掉落
        const goldAmount = Math.floor(Math.random() * 10) + 5;
        // TODO: 创建金币实体
        
        // 道具掉落
        if (Math.random() < enemy.dropChance && enemy.dropTable.length > 0) {
            const dropId = enemy.dropTable[Math.floor(Math.random() * enemy.dropTable.length)];
            this.world.createItem(transform.x, transform.y, dropId);
        }
    }
    
    /**
     * 执行攻击
     */
    performAttack(entity, targetPos) {
        const weapon = entity.get(WeaponComponent);
        const transform = entity.get(TransformComponent);
        
        if (!weapon || !transform) return false;
        
        // 检查冷却
        if (weapon.cooldownTimer > 0) return false;
        
        // 设置冷却
        weapon.cooldownTimer = weapon.cooldown / weapon.attackSpeed;
        weapon.isAttacking = true;
        weapon.attackTimer = weapon.attackDuration;
        
        // 计算方向
        const dx = targetPos.x - transform.x;
        const dy = targetPos.y - transform.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
            const dirX = dx / dist;
            const dirY = dy / dist;
            
            // 创建投射物
            if (weapon.range > 50) {
                this.world.createProjectile(
                    transform.x,
                    transform.y,
                    { x: dirX, y: dirY },
                    entity.id,
                    {
                        damage: weapon.damage,
                        speed: weapon.projectileSpeed,
                        pierce: weapon.pierce,
                        bounce: weapon.bounce
                    }
                );
            } else {
                // 近战攻击
                this.performMeleeAttack(entity, { x: dirX, y: dirY });
            }
        }
        
        return true;
    }
    
    /**
     * 近战攻击
     */
    performMeleeAttack(entity, direction) {
        const weapon = entity.get(WeaponComponent);
        const transform = entity.get(TransformComponent);
        
        // 在攻击范围内查找敌人
        const enemies = this.world.getEntitiesWithTag('enemy');
        for (const enemy of enemies) {
            const enemyTransform = enemy.get(TransformComponent);
            if (!enemyTransform) continue;
            
            const dx = enemyTransform.x - transform.x;
            const dy = enemyTransform.y - transform.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist <= weapon.range) {
                // 检查角度（扇形攻击范围）
                const angle = Math.acos((dx * direction.x + dy * direction.y) / dist);
                if (angle < Math.PI / 4) { // 90度扇形
                    this.dealDamage(entity, enemy, weapon.damage);
                }
            }
        }
    }
    
    /**
     * 应用状态效果
     */
    applyStatusEffect(target, effect) {
        const statusEffectSystem = this.world.getSystem(StatusEffectSystem);
        if (!statusEffectSystem) return false;
        
        return statusEffectSystem.addEffect(
            target,
            effect.type,
            effect.duration,
            effect.source,
            effect.strength || 1
        );
    }
    
    destroy() {}
}

window.CombatSystem = CombatSystem;
