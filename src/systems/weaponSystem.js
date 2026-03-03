/**
 * 武器系统 v0.16.0 - 支持新升级机制的投射物系统
 * 
 * 攻击子类型:
 * - arc: 扇形范围（鞭子、镰刀）
 * - circle: 圆形范围（战斧）
 * - homing: 追踪（魔杖、毒镖）
 * - rapid: 快速连发（飞刀、机关枪）
 * - boomerang: 回旋镖（斧头）
 * - bounce: 弹跳（十字架）
 * - explode: 爆炸（火球）
 * - fan: 扇形投射（手里剑）
 * - penetrate: 穿透（冰锥、激光）
 * - orbit_proj: 环绕投射（环刃）
 * - poison_homing: 追踪+中毒
 * - chain: 连锁（闪电）
 * - burn: 持续伤害
 * - aura: 光环（大蒜）
 */

class WeaponSystem {
    constructor(game) {
        this.game = game;
    }

    /**
     * 创建投射物 - 主分发函数
     */
    createProjectile(player, target, dmg, cfg) {
        const bullets = [];
        const subtype = cfg.subtype;
        const count = cfg.count || 1;
        const baseAngle = this.getBaseAngle(player, target);
        
        // 根据子类型分发到不同的创建函数
        switch (subtype) {
            case 'arc':
                bullets.push(...this.createArcAttack(player, dmg, cfg, baseAngle));
                break;
            case 'circle':
                bullets.push(...this.createCircleAttack(player, dmg, cfg));
                break;
            case 'homing':
                bullets.push(...this.createHomingProjectiles(player, dmg, cfg, baseAngle, count));
                break;
            case 'rapid':
                bullets.push(...this.createRapidFire(player, dmg, cfg, baseAngle, count));
                break;
            case 'boomerang':
                bullets.push(...this.createBoomerangs(player, dmg, cfg, baseAngle, count));
                break;
            case 'bounce':
                bullets.push(...this.createBouncingProjectiles(player, dmg, cfg, baseAngle, count));
                break;
            case 'explode':
                bullets.push(...this.createExplosiveProjectiles(player, dmg, cfg, baseAngle, count));
                break;
            case 'fan':
                bullets.push(...this.createFanProjectiles(player, dmg, cfg, baseAngle, count));
                break;
            case 'penetrate':
                bullets.push(...this.createPenetratingProjectiles(player, dmg, cfg, baseAngle, count));
                break;
            case 'orbit_proj':
                bullets.push(...this.createOrbitProjectiles(player, dmg, cfg, baseAngle, count));
                break;
            case 'poison_homing':
                bullets.push(...this.createPoisonHoming(player, dmg, cfg, baseAngle, count));
                break;
            case 'chain':
                bullets.push(...this.createChainLightning(player, dmg, cfg, target, count));
                break;
            default:
                // 默认创建普通投射物
                bullets.push(...this.createBasicProjectiles(player, dmg, cfg, baseAngle, count));
        }
        
        return bullets;
    }

    getBaseAngle(player, target) {
        if (target) {
            return Math.atan2(target.y - player.y, target.x - player.x);
        }
        return player.facingRight ? 0 : Math.PI;
    }

    // ========== 各类攻击创建函数 ==========

    /**
     * 扇形范围攻击（鞭子、镰刀）
     */
    createArcAttack(player, dmg, cfg, baseAngle) {
        const bullets = [];
        const arcAngle = cfg.arcAngle || 90;
        const range = cfg.range || 120;
        const count = cfg.count || 1;
        
        // 计算扇形起始角度
        const startAngle = baseAngle - (arcAngle * Math.PI / 180) / 2;
        
        for (let i = 0; i < count; i++) {
            const angleOffset = cfg.angleOffset || 0;
            const angle = count > 1 
                ? startAngle + (arcAngle * Math.PI / 180) * i / (count - 1)
                : baseAngle;
            
            // 多重攻击的额外投射物
            if (cfg.doubleStrike && i === 0) {
                bullets.push(this.createDelayedStrike(player, dmg, cfg, baseAngle, 0.15));
            }
            if (cfg.tripleStrike && i === 0) {
                bullets.push(this.createDelayedStrike(player, dmg, cfg, baseAngle, 0.1));
                bullets.push(this.createDelayedStrike(player, dmg, cfg, baseAngle, 0.2));
            }
            
            bullets.push({
                x: player.x, y: player.y,
                vx: 0, vy: 0,
                range: range,
                life: cfg.duration || 0.25,
                dmg: dmg,
                type: 'melee',
                subtype: 'arc',
                color: cfg.color,
                knockback: cfg.knockback || 20,
                lifeSteal: cfg.lifeSteal || 0,
                crit: cfg.crit || 0,
                critDmg: cfg.critDmg || 1.5,
                execute: cfg.execute,
                executeThreshold: cfg.executeThreshold,
                arcAngle: arcAngle,
                arcDirection: angle,
                weapon: cfg,
                // 多重攻击的ID用于区分
                multiId: count > 1 ? i : 0
            });
        }
        
        return bullets;
    }

    createDelayedStrike(player, dmg, cfg, angle, delay) {
        return {
            x: player.x, y: player.y,
            vx: 0, vy: 0,
            range: cfg.range,
            life: cfg.duration || 0.25,
            delay: delay,  // 延迟激活
            dmg: dmg * 0.8,
            type: 'melee',
            subtype: 'arc',
            color: cfg.color,
            isDelayed: true,
            arcDirection: angle,
            weapon: cfg,
            hits: new Set()  // v0.16.1 fix: 添加 hits
        };
    }

    /**
     * 圆形范围攻击（战斧旋风）
     */
    createCircleAttack(player, dmg, cfg) {
        const bullets = [];
        const radius = cfg.range || 100;
        
        bullets.push({
            x: player.x, y: player.y,
            vx: 0, vy: 0,
            range: radius,
            life: cfg.duration || 0.3,
            dmg: dmg,
            type: 'melee',
            subtype: 'circle',
            color: cfg.color,
            knockback: cfg.knockback || 30,
            lifeSteal: cfg.lifeSteal || 0,
            execute: cfg.execute,
            executeThreshold: cfg.executeThreshold,
            weapon: cfg
        });
        
        return bullets;
    }

    /**
     * 追踪投射物
     */
    createHomingProjectiles(player, dmg, cfg, baseAngle, count) {
        const bullets = [];
        const angleStep = count > 1 ? 0.15 : 0;
        
        for (let i = 0; i < count; i++) {
            const angle = baseAngle + (i - (count - 1) / 2) * angleStep;
            const vx = Math.cos(angle) * cfg.speed;
            const vy = Math.sin(angle) * cfg.speed;
            
            bullets.push({
                x: player.x + Math.cos(angle) * 30,
                y: player.y + Math.sin(angle) * 30,
                vx, vy,
                range: cfg.range || 400,
                life: cfg.life || 2,
                dmg: dmg,
                type: 'proj',
                subtype: 'homing',
                color: cfg.color,
                speed: cfg.speed,
                homingStrength: cfg.homingStrength || 0.5,
                pierce: cfg.pierce || 0,
                chain: cfg.chain || 0,
                chainRange: cfg.chainRange || 100,
                crit: cfg.crit || 0,
                critDmg: cfg.critDmg || 1.5,
                weapon: cfg,
                hits: new Set(),  // v0.16.1 fix: 统一使用 hits
                targetsHit: new Set()
            });
        }
        
        return bullets;
    }

    /**
     * 快速连发（飞刀）
     */
    createRapidFire(player, dmg, cfg, baseAngle, count) {
        const bullets = [];
        const burst = cfg.burst || 1;
        
        for (let i = 0; i < count; i++) {
            const angleOffset = count > 1 ? (i - (count - 1) / 2) * (cfg.angleOffset || 0) * Math.PI / 180 : 0;
            const angle = baseAngle + angleOffset;
            
            for (let j = 0; j < burst; j++) {
                const burstDelay = j * 0.05;
                const spread = (Math.random() - 0.5) * (cfg.spread || 0.1);
                const finalAngle = angle + spread;
                
                bullets.push({
                    x: player.x + Math.cos(finalAngle) * 30,
                    y: player.y + Math.sin(finalAngle) * 30,
                    vx: Math.cos(finalAngle) * cfg.speed,
                    vy: Math.sin(finalAngle) * cfg.speed,
                    range: cfg.range || 350,
                    life: cfg.life || 1.5,
                    delay: burstDelay,
                    dmg: dmg,
                    type: 'proj',
                    subtype: 'rapid',
                    color: cfg.color,
                    pierce: cfg.pierce || 0, maxPierce: cfg.pierce || 0,
                    bounce: cfg.bounce || 0,
                    crit: cfg.crit || 0,
                    critDmg: cfg.critDmg || 1.5,
                    weapon: cfg,
                    hits: new Set()  // v0.16.1 fix: 添加 hits
                });
            }
        }
        
        return bullets;
    }

    /**
     * 回旋镖
     */
    createBoomerangs(player, dmg, cfg, baseAngle, count) {
        const bullets = [];
        const angleOffset = cfg.angleOffset || 40;
        
        for (let i = 0; i < count; i++) {
            const angle = baseAngle + (count > 1 ? (i - (count - 1) / 2) * angleOffset * Math.PI / 180 : 0);
            const speed = cfg.speed;
            
            bullets.push({
                x: player.x + Math.cos(angle) * 30,
                y: player.y + Math.sin(angle) * 30,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                range: cfg.range || 300,
                life: cfg.life || 3,
                dmg: dmg,
                type: 'proj',
                subtype: 'boomerang',
                color: cfg.color,
                pierce: cfg.pierce || 99,
                returnDamage: cfg.returnDamage || false,
                state: 'outbound',  // outbound | returning
                originX: player.x,
                originY: player.y,
                size: cfg.axeSize || 1,
                weapon: cfg
            });
        }
        
        return bullets;
    }

    /**
     * 弹跳投射物
     */
    createBouncingProjectiles(player, dmg, cfg, baseAngle, count) {
        const bullets = [];
        
        for (let i = 0; i < count; i++) {
            const angle = baseAngle + (count > 1 ? (i - (count - 1) / 2) * 0.3 : 0);
            
            bullets.push({
                x: player.x + Math.cos(angle) * 30,
                y: player.y + Math.sin(angle) * 30,
                vx: Math.cos(angle) * cfg.speed,
                vy: Math.sin(angle) * cfg.speed,
                range: cfg.range || 500,
                life: cfg.life || 5,
                dmg: dmg,
                type: 'proj',
                subtype: 'bounce',
                color: cfg.color,
                bounce: cfg.bounce || 3,
                pierce: 99,
                explodeOnBounce: cfg.explodeOnBounce || false,
                divineNova: cfg.divineNova || false,
                crit: cfg.crit || 0,
                critDmg: cfg.critDmg || 1.5,
                holyDamage: cfg.holyDamage || 1,
                weapon: cfg,
                bounceCount: 0
            });
        }
        
        return bullets;
    }

    /**
     * 爆炸投射物
     */
    createExplosiveProjectiles(player, dmg, cfg, baseAngle, count) {
        const bullets = [];
        const miniCount = cfg.miniFireballs || 0;
        
        for (let i = 0; i < count; i++) {
            const angle = baseAngle + (count > 1 ? (i - (count - 1) / 2) * 0.2 : 0);
            
            bullets.push({
                x: player.x + Math.cos(angle) * 30,
                y: player.y + Math.sin(angle) * 30,
                vx: Math.cos(angle) * cfg.speed,
                vy: Math.sin(angle) * cfg.speed,
                range: cfg.range || 300,
                life: cfg.life || 2,
                dmg: dmg,
                type: 'proj',
                subtype: 'explode',
                color: cfg.color,
                explodeRadius: (cfg.explodeRadius || 80) * (cfg.damageBoost || 1),
                split: cfg.split || false,
                miniCount: miniCount,
                nova: cfg.nova || false,
                burnSpread: cfg.burnSpread || false,
                meteor: cfg.meteor || false,
                weapon: cfg,
                exploded: false
            });
        }
        
        return bullets;
    }

    /**
     * 扇形散射（手里剑）
     */
    createFanProjectiles(player, dmg, cfg, baseAngle, count) {
        const bullets = [];
        const spreadAngle = (cfg.spread || 30) * Math.PI / 180;
        const startAngle = baseAngle - spreadAngle / 2;
        
        for (let i = 0; i < count; i++) {
            const angle = startAngle + spreadAngle * i / (count - 1 || 1);
            
            bullets.push({
                x: player.x + Math.cos(angle) * 30,
                y: player.y + Math.sin(angle) * 30,
                vx: Math.cos(angle) * cfg.speed,
                vy: Math.sin(angle) * cfg.speed,
                range: cfg.range || 400,
                life: cfg.life || 3,
                dmg: dmg,
                type: 'proj',
                subtype: 'fan',
                color: cfg.color,
                pierce: cfg.pierce || 0,
                returnToPlayer: cfg.returnToPlayer || false,
                weapon: cfg
            });
        }
        
        return bullets;
    }

    /**
     * 穿透投射物
     */
    createPenetratingProjectiles(player, dmg, cfg, baseAngle, count) {
        const bullets = [];
        
        for (let i = 0; i < count; i++) {
            const angle = baseAngle + (count > 1 ? (i - (count - 1) / 2) * 0.1 : 0);
            
            bullets.push({
                x: player.x + Math.cos(angle) * 30,
                y: player.y + Math.sin(angle) * 30,
                vx: Math.cos(angle) * cfg.speed,
                vy: Math.sin(angle) * cfg.speed,
                range: cfg.range || 500,
                life: cfg.life || 4,
                dmg: dmg,
                type: 'proj',
                subtype: 'penetrate',
                color: cfg.color,
                pierce: cfg.pierce || 99,
                slow: cfg.slow || 0,
                freezeChance: cfg.freezeChance || 0,
                freezeDuration: cfg.freezeDuration || 0,
                shatter: cfg.shatter || false,
                aoeOnHit: cfg.aoeOnHit || false,
                aoeRadius: cfg.aoeRadius || 0,
                blizzardAOE: cfg.blizzardAOE || false,
                weapon: cfg
            });
        }
        
        return bullets;
    }

    /**
     * 环绕投射物
     */
    createOrbitProjectiles(player, dmg, cfg, baseAngle, count) {
        const bullets = [];
        const radius = cfg.orbitRadius || 100;
        
        // 检查是否使用双环或三环
        const rings = cfg.doubleRing ? 2 : (cfg.tripleRing ? 3 : 1);
        const ringSpacing = 30;
        
        for (let r = 0; r < rings; r++) {
            for (let i = 0; i < count; i++) {
                const angleOffset = (i / count) * Math.PI * 2;
                const currentRadius = radius + r * ringSpacing;
                
                bullets.push({
                    x: player.x + Math.cos(angleOffset) * currentRadius,
                    y: player.y + Math.sin(angleOffset) * currentRadius,
                    vx: 0, vy: 0,
                    orbitCenter: { x: player.x, y: player.y },
                    orbitAngle: angleOffset,
                    orbitRadius: currentRadius,
                    orbitSpeed: (cfg.orbitSpeed || 1) * (r % 2 === 0 ? 1 : -1), // 交替方向
                    orbitDuration: cfg.orbitDuration || 2,
                    dmg: dmg,
                    type: 'proj',
                    subtype: 'orbit_proj',
                    color: cfg.color,
                    pierce: cfg.pierce || 99, maxPierce: 99,
                    blenderMode: cfg.blenderMode || false,
                    damageTick: cfg.damageTick || 0.1,
                    weapon: cfg,
                    lastDamageTime: 0,
                    hits: new Set()  // v0.16.1 fix: 添加 hits
                });
            }
        }
        
        return bullets;
    }

    /**
     * 追踪毒镖
     */
    createPoisonHoming(player, dmg, cfg, baseAngle, count) {
        const bullets = [];
        
        for (let i = 0; i < count; i++) {
            const angle = baseAngle + (count > 1 ? (i - (count - 1) / 2) * 0.2 : 0);
            
            bullets.push({
                x: player.x + Math.cos(angle) * 30,
                y: player.y + Math.sin(angle) * 30,
                vx: Math.cos(angle) * cfg.speed,
                vy: Math.sin(angle) * cfg.speed,
                range: cfg.range || 400,
                life: cfg.life || 3,
                dmg: dmg,
                type: 'proj',
                subtype: 'poison_homing',
                color: cfg.color,
                homingStrength: cfg.homingStrength || 0.6,
                poisonDmg: cfg.poisonDmg || 5,
                spreadChance: cfg.spreadChance || 0,
                spreadRange: cfg.spreadRange || 0,
                burstOnDeath: cfg.burstOnDeath || false,
                burstRadius: cfg.burstRadius || 0,
                lingeringPoison: cfg.lingeringPoison || false,
                groundDuration: cfg.groundDuration || 0,
                plagueBurst: cfg.plagueBurst || false,
                weapon: cfg,
                hits: new Set()  // v0.16.1 fix: 添加 hits
            });
        }
        
        return bullets;
    }

    /**
     * 连锁闪电
     */
    createChainLightning(player, dmg, cfg, target, count) {
        const bullets = [];
        
        // 闪电不跟随鼠标，直接对目标或随机敌人施放
        const firstTarget = target || this.findNearestEnemy(player);
        
        if (firstTarget) {
            bullets.push({
                x: player.x, y: player.y,
                targetId: firstTarget.id,
                dmg: dmg,
                type: 'instant',
                subtype: 'chain',
                color: cfg.color,
                chain: cfg.chain || 3,
                chainRange: cfg.chainRange || 150,
                stun: cfg.stun || 0,
                fork: cfg.fork || false,
                branches: cfg.branches || 0,
                weapon: cfg,
                chainCount: 0,
                targetsHit: new Set([firstTarget.id]),
                hits: new Set([firstTarget]),  // v0.16.1 fix: 添加 hits
                lastTargetX: firstTarget.x,
                lastTargetY: firstTarget.y
            });
        }
        
        return bullets;
    }

    createBasicProjectiles(player, dmg, cfg, baseAngle, count) {
        const bullets = [];
        
        for (let i = 0; i < count; i++) {
            const angle = baseAngle + (count > 1 ? (i - (count - 1) / 2) * 0.2 : 0);
            
            bullets.push({
                x: player.x + Math.cos(angle) * 30,
                y: player.y + Math.sin(angle) * 30,
                vx: Math.cos(angle) * (cfg.speed || 200),
                vy: Math.sin(angle) * (cfg.speed || 200),
                range: cfg.range || 300,
                life: cfg.life || 2,
                dmg: dmg,
                type: 'proj',
                subtype: 'basic',
                color: cfg.color,
                pierce: cfg.pierce || 0, maxPierce: cfg.pierce || 0,
                weapon: cfg,
                hits: new Set()  // v0.16.1 fix: 添加 hits
            });
        }
        
        return bullets;
    }

    findNearestEnemy(player) {
        // 简化版，实际应该从game.enemies中获取
        return null;
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WeaponSystem };
}
