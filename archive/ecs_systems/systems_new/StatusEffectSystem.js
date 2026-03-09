/**
 * StatusEffectSystem - 状态效果系统
 * 管理中毒、冰冻、燃烧、减速等状态效果
 */

class StatusEffectSystem {
    constructor(world) {
        this.world = world;
        this.priority = 35;
        this.enabled = true;
        
        // 状态效果定义
        this.effectTypes = {
            poison: {
                name: '中毒',
                color: '#4a4',
                icon: '☠️',
                damagePerTick: 5,
                tickInterval: 1,
                canStack: true,
                maxStacks: 5
            },
            burn: {
                name: '燃烧',
                color: '#f44',
                icon: '🔥',
                damagePerTick: 8,
                tickInterval: 0.5,
                canStack: false,
                spreadRadius: 50
            },
            freeze: {
                name: '冰冻',
                color: '#48f',
                icon: '❄️',
                slowPercent: 0.5,
                canStack: false
            },
            slow: {
                name: '减速',
                color: '#88f',
                icon: '🐌',
                slowPercent: 0.3,
                canStack: false
            },
            stun: {
                name: '眩晕',
                color: '#ff0',
                icon: '💫',
                canStack: false
            },
            bleed: {
                name: '流血',
                color: '#f00',
                icon: '🩸',
                damagePerTick: 3,
                tickInterval: 0.5,
                canStack: true,
                maxStacks: 3
            },
            regeneration: {
                name: '再生',
                color: '#4f4',
                icon: '✨',
                healPerTick: 5,
                tickInterval: 1,
                canStack: false
            },
            haste: {
                name: '加速',
                color: '#fa0',
                icon: '⚡',
                speedPercent: 0.3,
                canStack: false
            },
            shield: {
                name: '护盾',
                color: '#48f',
                icon: '🛡️',
                damageReduction: 0.5,
                canStack: false
            }
        };
    }
    
    init() {}
    
    update(dt) {
        const entities = this.world.getEntitiesWithComponents(EffectComponent);
        
        for (const entity of entities) {
            this.processEntity(entity, dt);
        }
    }
    
    processEntity(entity, dt) {
        const effectComp = entity.get(EffectComponent);
        if (!effectComp || !effectComp.effects.length) return;
        
        for (let i = effectComp.effects.length - 1; i >= 0; i--) {
            const effect = effectComp.effects[i];
            
            // 更新时间
            effect.duration -= dt;
            effect.tickTimer -= dt;
            
            // 处理 tick 效果
            if (effect.tickTimer <= 0 && effect.type !== 'freeze' && effect.type !== 'slow' && effect.type !== 'stun' && effect.type !== 'haste' && effect.type !== 'shield') {
                this.applyTickEffect(entity, effect);
                effect.tickTimer = effect.tickInterval;
            }
            
            // 效果结束
            if (effect.duration <= 0) {
                this.removeEffect(entity, effect, i);
            }
        }
        
        // 应用持续性效果
        this.applyPersistentEffects(entity);
    }
    
    applyTickEffect(entity, effect) {
        const health = entity.get(HealthComponent);
        const combat = this.world.getSystem(CombatSystem);
        
        switch (effect.type) {
            case 'poison':
            case 'burn':
            case 'bleed':
                if (health && combat) {
                    const damage = effect.damagePerTick * effect.stackCount;
                    health.currentHealth -= damage;
                    
                    // 显示伤害数字
                    const damageNumberSystem = this.world.getSystem(DamageNumberSystem);
                    if (damageNumberSystem) {
                        const transform = entity.get(TransformComponent);
                        damageNumberSystem.spawnText(
                            transform.x, transform.y - 30,
                            Math.floor(damage).toString(),
                            { color: this.effectTypes[effect.type].color, size: 12, life: 0.5 }
                        );
                    }
                    
                    // 触发受伤效果
                    health.damageFlash = 0.5;
                }
                break;
                
            case 'regeneration':
                if (health) {
                    const heal = effect.healPerTick;
                    health.currentHealth = Math.min(health.maxHealth, health.currentHealth + heal);
                }
                break;
        }
    }
    
    applyPersistentEffects(entity) {
        const effectComp = entity.get(EffectComponent);
        const movement = entity.get(MovementComponent);
        
        if (!effectComp || !movement) return;
        
        // 计算总减速
        let totalSlow = 0;
        let totalSpeed = 0;
        
        for (const effect of effectComp.effects) {
            switch (effect.type) {
                case 'freeze':
                    totalSlow = Math.max(totalSlow, effect.slowPercent);
                    break;
                case 'slow':
                    totalSlow = Math.max(totalSlow, effect.slowPercent);
                    break;
                case 'haste':
                    totalSpeed = Math.max(totalSpeed, effect.speedPercent);
                    break;
                case 'stun':
                    movement.vx = 0;
                    movement.vy = 0;
                    movement.isDashing = false;
                    break;
            }
        }
        
        // 应用速度修改
        movement.speed = movement.baseSpeed * (1 - totalSlow) * (1 + totalSpeed);
    }
    
    removeEffect(entity, effect, index) {
        const effectComp = entity.get(EffectComponent);
        if (!effectComp) return;
        
        // 恢复原始属性
        if (effect.type === 'slow' || effect.type === 'freeze' || effect.type === 'haste') {
            const movement = entity.get(HealthComponent);
            if (movement && movement.baseSpeed) {
                movement.speed = movement.baseSpeed;
            }
        }
        
        // 移除效果
        effectComp.effects.splice(index, 1);
        
        // 触发事件
        this.world.emit('effectRemoved', { entity, effect });
    }
    
    /**
     * 添加状态效果
     */
    addEffect(entity, type, duration, source = null, power = 1) {
        const effectDef = this.effectTypes[type];
        if (!effectDef) return false;
        
        let effectComp = entity.get(EffectComponent);
        if (!effectComp) {
            effectComp = new EffectComponent();
            entity.add(effectComp);
        }
        
        // 检查是否已有同类型效果
        const existing = effectComp.effects.find(e => e.type === type);
        
        if (existing) {
            if (effectDef.canStack) {
                // 可叠加：增加层数
                existing.stackCount = Math.min(effectDef.maxStacks || 5, existing.stackCount + power);
                existing.duration = Math.max(existing.duration, duration);
            } else {
                // 不可叠加：刷新持续时间
                existing.duration = Math.max(existing.duration, duration);
            }
        } else {
            // 新效果
            const newEffect = {
                type: type,
                name: effectDef.name,
                duration: duration,
                maxDuration: duration,
                source: source,
                stackCount: power,
                tickTimer: effectDef.tickInterval || 1,
                tickInterval: effectDef.tickInterval || 1,
                damagePerTick: effectDef.damagePerTick || 0,
                healPerTick: effectDef.healPerTick || 0,
                slowPercent: effectDef.slowPercent || 0,
                speedPercent: effectDef.speedPercent || 0
            };
            
            effectComp.effects.push(newEffect);
            
            // 保存基础速度
            if (type === 'slow' || type === 'freeze' || type === 'haste') {
                const movement = entity.get(MovementComponent);
                if (movement && !movement.baseSpeed) {
                    movement.baseSpeed = movement.speed;
                }
            }
        }
        
        // 触发事件
        this.world.emit('effectApplied', { entity, type, duration, source });
        
        // 显示效果图标
        const damageNumberSystem = this.world.getSystem(DamageNumberSystem);
        if (damageNumberSystem) {
            const transform = entity.get(TransformComponent);
            damageNumberSystem.spawnText(
                transform.x, transform.y - 40,
                effectDef.icon,
                { color: effectDef.color, size: 20, life: 1 }
            );
        }
        
        return true;
    }
    
    /**
     * 检查是否有某效果
     */
    hasEffect(entity, type) {
        const effectComp = entity.get(EffectComponent);
        return effectComp && effectComp.effects.some(e => e.type === type);
    }
    
    /**
     * 清除所有效果
     */
    clearEffects(entity) {
        const effectComp = entity.get(EffectComponent);
        if (!effectComp) return;
        
        effectComp.effects = [];
        
        // 恢复速度
        const movement = entity.get(MovementComponent);
        if (movement && movement.baseSpeed) {
            movement.speed = movement.baseSpeed;
        }
    }
    
    destroy() {}
}

window.StatusEffectSystem = StatusEffectSystem;
