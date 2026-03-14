/**
 * Weapon 发射与投射物逻辑
 * 从主类中拆分出来的原型扩展，保持运行行为不变。
 */
(function(global) {
    'use strict';

    const Weapon = global.Weapon;
    if (!Weapon) {
        console.warn('[RogueCow] Weapon 尚未加载，跳过扩展。');
        return;
    }

    Weapon.prototype.fire = function(player, target, stats) {
        // v0.15.0优化：更平滑的CD计算，支持长CD武器
        // v0.16.1 fix: 修复 cooldown 计算逻辑
        let finalCd = this.cfg.cd;
        let effectiveFireRate = stats?.fireRate || 1;
        
        // fireRate 是攻速倍率，越高攻速越快，CD越短
        if (effectiveFireRate > 0) {
            if (this.cfg.type === 'area') {
                effectiveFireRate = 1 + (effectiveFireRate - 1) * 0.28;
                if (this.baseKey === 'holy_water') effectiveFireRate = Math.min(effectiveFireRate, 1.5);
            } else if (this.cfg.type === 'orbit') {
                effectiveFireRate = 1 + (effectiveFireRate - 1) * 0.45;
            }
            finalCd = finalCd / effectiveFireRate;
        }
        
        // cooldown 是冷却倍率（默认1.0），越小冷却越短
        // 例如：cooldown=0.92 表示 8% CD缩减，finalCd = cfg.cd * 0.92
        if (stats && stats.cooldown > 0) {
            finalCd = finalCd * stats.cooldown;  // 改为乘法，不是除法
        }
        
        // v0.16.1 fix: 使用 cd 而不是 timer
        this.cd = Math.max(0.08, finalCd);
        
        // v0.22-fix: 只有aura类型使用tickRate作为CD，area类型保持正常CD
        if (this.cfg.type === 'aura') {
            this.cd = this.cfg.tickRate || 0.3;
        }
        
        // debug: 输出CD计算详情（首次发射或CD异常时）
        if (this.cfg.cd > 0.5 && finalCd < 0.1) {
            console.warn(`[武器CD警告] ${this.cfg.name}: 基础CD=${this.cfg.cd.toFixed(2)}, 最终CD=${finalCd.toFixed(2)}, fireRate=${stats?.fireRate}, effectiveFireRate=${effectiveFireRate}, cooldown=${stats?.cooldown}`);
        }
        
        const subtype = this.cfg.subtype || 'standard';
        const dmg = this.getDamage(stats);
        
        // 根据子类型分发到不同发射逻辑
        switch (this.cfg.type) {
            case 'melee': return this.fireMelee(player, target, dmg, subtype, stats);
            case 'proj': return this.fireProjectile(player, target, dmg, subtype, stats);
            case 'orbit': return this.fireOrbit(player, dmg, stats);
            case 'instant': return this.fireInstant(player, target, dmg, subtype, stats);
            case 'area': return this.fireArea(player, target, dmg, stats);
            case 'aura': return this.fireAura(player, dmg, stats);
            case 'laser': return this.fireLaser(player, target, dmg, stats);
            default: return [];
        }
    }

    Weapon.prototype.fireMelee = function(player, target, dmg, subtype, stats) {
        // v0.18.0: 使用getRange()获取升级后的范围
        const range = this.getRange() * (1 + (stats.range || 0));
        // v0.18.0: 使用敌人中心点(cx,cy)而不是脚底(x,y)计算角度
        const angle = target ? Math.atan2(target.cy - player.cy, target.cx - player.cx) : 
                         (player.facingRight ? 0 : Math.PI);
        
        // 添加打击感：屏幕震动
        if (window.game && window.game.camera) {
            window.game.camera.addShake(2);
        }
        
        return [this.applyCombatStats({
            x: player.cx, y: player.cy,  // v0.16.3: 使用中心点
            type: 'melee', subtype: subtype,
            angle: angle, arcAngle: this.getArcAngle(),
            range: range, dmg: dmg,
            color: this.cfg.color, icon: this.cfg.icon,
            life: 0.25, hits: new Set(),
            knockback: this.cfg.knockback || 0,
            playerX: player.cx, playerY: player.cy,  // v0.16.3: 使用中心点
            followSource: true,
            sourceOwner: player,
            sourceType: 'playerCenter',
            sourceOffsetX: 0,
            sourceOffsetY: 0,
            weaponKey: this.baseKey,
            weaponSprite: this.getWeaponSpriteKey()
        })];
    }

    Weapon.prototype.fireProjectile = function(player, target, dmg, subtype, stats) {
        if (subtype === 'guardian_knife') {
            return this.fireGuardianKnife(player, dmg, stats);
        }
        let bullets = [];
        const speed = (this.cfg.speed || 300) * (1 + (stats.projSpeed || 0));
        // 如果没有目标，根据玩家朝向发射
        // v0.18.0: 使用敌人中心点(cx,cy)而不是脚底(x,y)计算角度
        const baseAngle = target ? Math.atan2(target.cy - player.cy, target.cx - player.cx) : 
                          (player.facingRight ? 0 : Math.PI);
        const projCount = Math.max(1, Math.floor(stats.projCount || 1));
        // v0.18.0: 使用getProjectileCount()获取升级后的数量
        const count = this.getProjectileCount() * projCount;
        
        // v0.16.1 fix: 检查是否有分裂效果（使用 splitConfig）
        if (this.cfg.split && this.cfg.splitConfig && this.cfg.splitConfig.count > 1) {
            const splitCount = this.cfg.splitConfig.count;
            const offset = this.cfg.splitConfig.angleOffset || 15;
            for (let s = 0; s < splitCount; s++) {
                const splitAngle = baseAngle + (s - (splitCount - 1) / 2) * offset * Math.PI / 180;
                bullets.push(...this.createProjectile(player, splitAngle, speed, dmg, subtype, stats));
            }
        } 
        // 检查是否有双重攻击
        else if (this.cfg.doubleAttack) {
            const angleOffset = this.cfg.doubleAttack.angleOffset || 30;
            bullets.push(...this.createProjectile(player, baseAngle - angleOffset * Math.PI / 180, speed, dmg, subtype, stats));
            if (this.cfg.doubleAttack.delay) {
                // 延迟发射第二发
                setTimeout(() => {
                    if (window.game) {
                        window.game.bullets.push(...this.createProjectile(player, baseAngle + angleOffset * Math.PI / 180, speed, dmg, subtype, stats));
                    }
                }, this.cfg.doubleAttack.delay * 1000);
            } else {
                bullets.push(...this.createProjectile(player, baseAngle + angleOffset * Math.PI / 180, speed, dmg, subtype, stats));
            }
        }
        // 检查是否有三重攻击
        else if (this.cfg.tripleAttack) {
            const angleOffset = 20 * Math.PI / 180;
            bullets.push(...this.createProjectile(player, baseAngle, speed, dmg, subtype, stats));
            bullets.push(...this.createProjectile(player, baseAngle - angleOffset, speed, dmg, subtype, stats));
            bullets.push(...this.createProjectile(player, baseAngle + angleOffset, speed, dmg, subtype, stats));
        }
        // 普通发射
        else {
            bullets = this.createProjectile(player, baseAngle, speed, dmg, subtype, stats, count);
        }
        
        return bullets;
    }

    Weapon.prototype.fireGuardianKnife = function(player, dmg, stats) {
        const spawnCfg = typeof this.buildGuardianKnifeSpawnConfig === 'function'
            ? this.buildGuardianKnifeSpawnConfig(player, dmg, stats)
            : null;
        return spawnCfg ? [spawnCfg] : [];
    }

    Weapon.prototype.createProjectile = function(player, baseAngle, speed, dmg, subtype, stats, count = 1, target = null) {
        const bullets = [];
        const weaponSprite = this.getWeaponSpriteKey();
        
        switch (subtype) {
            case 'homing':
            case 'poison_homing':
                for (let i = 0; i < count; i++) {
                    const angle = baseAngle + (Math.random() - 0.5) * 0.2;
                    bullets.push(this.applyCombatStats({
                        x: player.cx, y: player.cy,  // v0.16.3: 使用中心点
                        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                        type: 'proj', subtype: subtype,
                        dmg: dmg, color: this.cfg.color, icon: this.cfg.icon,
                        // v0.18.0: 使用getPierce()获取升级后的穿透
                        life: 3, pierce: this.getPierce(), maxPierce: this.getPierce(),
                        homing: true, homingStrength: this.cfg.homingStrength || 0.5,
                        target: target, hits: new Set(),
                        poison: this.cfg.poison || 0
                    }));
                }
                break;
                
            case 'rapid':
                const burst = this.cfg.burst || 3;
                for (let i = 0; i < burst; i++) {
                    const spreadAngle = (i - (burst - 1) / 2) * 0.1;
                    const fireAngle = baseAngle + spreadAngle;
                    bullets.push(this.applyCombatStats({
                        x: player.cx, y: player.cy,  // v0.16.3: 使用中心点
                        vx: Math.cos(fireAngle) * speed, vy: Math.sin(fireAngle) * speed,
                        type: 'proj', subtype: subtype,
                        dmg: dmg, color: this.cfg.color, icon: this.cfg.icon,
                        // v0.18.0: 使用getPierce()获取升级后的穿透
                        life: 3, pierce: this.getPierce(), maxPierce: this.getPierce(),
                        hits: new Set(), delay: i * 0.03
                    }));
                }
                break;
                
            case 'boomerang':
                for (let i = 0; i < count; i++) {
                    const angleOffset = count > 1 ? (i - (count - 1) / 2) * 0.3 : 0;
                    const angle = baseAngle + angleOffset;
                    bullets.push(this.applyCombatStats({
                        x: player.cx, y: player.cy,  // v0.16.3: 使用中心点
                        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                        type: 'proj', subtype: subtype,
                        dmg: dmg, color: this.cfg.color, icon: this.cfg.icon,
                        life: 4, pierce: 99,
                        // v0.18.0: 使用getRange()获取升级后的范围
                        range: this.getRange(),
                        originX: player.x, originY: player.y,
                        state: 'out', hits: new Set()
                    }));
                }
                break;
                
            case 'bounce':
                for (let i = 0; i < count; i++) {
                    const angleOffset = count > 1 ? (i - (count - 1) / 2) * 0.2 : 0;
                    const angle = baseAngle + angleOffset;
                    bullets.push(this.applyCombatStats({
                        x: player.cx, y: player.cy,  // v0.16.3: 使用中心点
                        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                        type: 'proj', subtype: subtype,
                        dmg: dmg, color: this.cfg.color, icon: this.cfg.icon,
                        life: 5, pierce: 99,
                        bounce: this.cfg.bounce || 3,
                        bouncesLeft: this.cfg.bounce || 3,
                        hits: new Set()
                    }));
                }
                break;
                
            case 'explode':
                for (let i = 0; i < count; i++) {
                    const angleOffset = count > 1 ? (i - (count - 1) / 2) * 0.15 : 0;
                    const angle = baseAngle + angleOffset;
                    bullets.push(this.applyCombatStats({
                        x: player.cx, y: player.cy,  // v0.16.3: 使用中心点
                        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                        type: 'proj', subtype: subtype,
                        dmg: dmg, color: this.cfg.color, icon: this.cfg.icon,
                        life: 3, pierce: 0,
                        explodeRadius: this.cfg.explodeRadius || 80,
                        hits: new Set()
                    }));
                }
                break;
                
            case 'fan':
                // v0.18.0 fix: 优化扇形射击角度计算，确保命中目标
                const spread = (this.cfg.spread || 25) * Math.PI / 180;
                for (let i = 0; i < count; i++) {
                    // 当count=1时朝向正前方，count>1时均匀分布
                    const angle = count === 1 ? baseAngle : baseAngle - spread / 2 + (spread / (count - 1)) * i;
                    bullets.push(this.applyCombatStats({
                        x: player.cx, y: player.cy,  // v0.16.3: 使用中心点
                        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                        type: 'proj', subtype: subtype,
                        dmg: dmg, color: this.cfg.color, icon: this.cfg.icon,
                        // v0.18.0: 使用getPierce()获取升级后的穿透
                        life: 2.5, pierce: this.getPierce(), maxPierce: this.getPierce(),
                        hits: new Set()
                    }));
                }
                break;
                
            case 'penetrate':
                for (let i = 0; i < count; i++) {
                    const angle = baseAngle + (Math.random() - 0.5) * 0.1;
                    // v0.18.0: 使用getPierce()获取升级后的穿透
                    const pierce = this.getPierce();
                    bullets.push(this.applyCombatStats({
                        x: player.cx, y: player.cy,
                        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
                        type: 'proj', subtype: subtype,
                        dmg: dmg, color: this.cfg.color, icon: this.cfg.icon,
                        life: 4, pierce: pierce || 99, maxPierce: pierce || 99,
                        slow: this.cfg.slow || 0,
                        hits: new Set()
                    }));
                }
                break;
                
            case 'orbit_proj':
                // v0.18.3: 超武环绕物是永久的，不需要重新生成
                if (this.isSuper) return [];
                
                for (let i = 0; i < count; i++) {
                    const startAngle = (Math.PI * 2 / count) * i;
                    // v0.18.0: 使用getPierce()获取升级后的穿透
                    const pierce = this.getPierce();
                    bullets.push(this.applyCombatStats({
                        x: player.cx, y: player.cy,
                        type: 'proj', subtype: subtype,
                        dmg: dmg, color: this.cfg.color, icon: this.cfg.icon,
                        life: this.cfg.orbitDuration || 2,
                        orbitRadius: this.cfg.orbitRadius || 100,
                        orbitAngle: startAngle,
                        orbitSpeed: 3,
                        state: 'orbit',
                        target: target, speed: speed,
                        pierce: pierce, maxPierce: pierce,
                        hits: new Set()
                    }));
                }
                break;
        }
        
        // v0.18.3: 为超武投射物添加标记
        if (this.isSuper) {
            for (const b of bullets) b.isSuper = true;
        }
        
        // v0.18.4 fix: 应用道具效果到所有子弹
        for (const b of bullets) {
            b.weaponKey = b.weaponKey || this.baseKey;
            b.weaponSprite = b.weaponSprite || weaponSprite;
            if (b.visualSeed === undefined) b.visualSeed = Math.random() * 1000;
            // homing效果：给子弹添加追踪能力
            if (stats.homing && !b.homing) {
                b.homing = true;
                b.homingStrength = stats.homing;
                b.target = target;
                b.hits = b.hits || new Set();
            }
            // bounce效果：给子弹添加弹跳能力
            if (stats.bounce && !b.bounce) {
                b.bounce = stats.bounce;
                b.bouncesLeft = stats.bounce;
            }
            // projSize效果：子弹大小
            if (stats.projSize) {
                b.scale = 1 + stats.projSize;
            }
            this.applyProjectileVisualConfig(b);
        }
        
        return bullets;
    }

    Weapon.prototype.getWeaponSpriteKey = function() {
        const spriteMap = {
            whip: 'weapon_knife',
            wand: 'weapon_wand',
            knife: 'weapon_knife',
            axe: 'weapon_axe',
            bible: 'weapon_bible',
            fireball: 'weapon_fireball',
            lightning: 'weapon_lightning',
            holy_water: 'weapon_holywater'
        };
        return spriteMap[this.baseKey] || null;
    }

    Weapon.prototype.applyProjectileVisualConfig = function(b) {
        const subtype = b.subtype || 'standard';
        const configMap = {
            homing: { sprite: 'bullet_lightning', size: 9, hitRadius: 6, renderStyle: 'magic_orb' },
            poison_homing: { sprite: 'bullet_lightning', size: 8.5, hitRadius: 5, renderStyle: 'poison_dart' },
            rapid: { sprite: 'bullet_arrow', size: 7.2, hitRadius: 4.4, renderStyle: 'knife_throw' },
            boomerang: { sprite: 'bullet_arrow', size: 12, hitRadius: 7.8, renderStyle: 'axe_spin' },
            bounce: { sprite: 'bullet_lightning', size: 10, hitRadius: 6, renderStyle: 'cross_bounce' },
            explode: { sprite: 'weapon_fireball', size: 12, hitRadius: 6.5, renderStyle: 'fireball' },
            fan: { sprite: 'bullet_arrow', size: 9, hitRadius: 5.2, renderStyle: 'shuriken' },
            penetrate: { sprite: 'bullet_ice', size: 12, hitRadius: 7, renderStyle: 'icicle' },
            guardian_knife: { sprite: 'weapon_knife', size: 22, hitRadius: 10, renderStyle: 'knife_guardian' },
            orbit_proj: { sprite: 'bullet_lightning', size: 40, hitRadius: 11, renderStyle: 'orbit_bible' }
        };
        const cfg = { ...(configMap[subtype] || { sprite: 'bullet_arrow', size: 10, hitRadius: 6 }) };
        const scale = b.scale || 1;
        
        // 武器优先级修正：按武器逻辑使用对应贴图
        if (b.weaponKey === 'knife' && (subtype === 'rapid' || subtype === 'guardian_knife')) {
            cfg.sprite = 'weapon_knife';
        } else if (b.weaponKey === 'axe' && subtype === 'boomerang') {
            cfg.sprite = 'weapon_axe';
        } else if (b.weaponKey === 'bible' && subtype === 'orbit_proj') {
            cfg.sprite = 'weapon_bible';
        } else if (b.weaponKey === 'fireball' && subtype === 'explode') {
            cfg.sprite = 'weapon_fireball';
        }
        
        b.sprite = cfg.sprite;
        b.size = (cfg.size || 16) * scale;
        b.hitRadius = (cfg.hitRadius || 8) * scale;
        b.renderStyle = cfg.renderStyle || 'default';
    }

    Weapon.prototype.fireOrbit = function(player, dmg, stats) {
        // v0.18.3: 超武环绕物是永久的，不需要重新生成
        if (this.isSuper) return [];
        
        // 返回特殊标记，由游戏循环持续处理
        // v0.18.0 fix: 使用升级后的范围和数量
        return [this.applyCombatStats({
            x: player.cx, y: player.cy,
            type: 'orbit_spawn',
            dmg: dmg, color: this.cfg.color, icon: this.cfg.icon,
            range: this.getRange() * (1 + (stats.range || 0)) * (1 + (stats.lingeringFieldScale || 0) * 0.18),
            count: this.getProjectileCount(),
            duration: this.getOrbitDuration(stats) + (stats.lingeringFieldDuration || 0) * 0.6,
            eternal: !!this.cfg.eternal,
            doubleRing: !!this.cfg.doubleRing,
            rotationSpeed: (this.cfg.rotationSpeed || this.cfg.orbitSpeed || 2) * (1 + (stats.lingeringFieldScale || 0) * 0.12),
            orbitalDrawSize: this.cfg.orbitalDrawSize || 30,
            orbitHitPadding: this.cfg.orbitHitPadding || 44,
            orbitVisualSpinSpeed: this.cfg.orbitVisualSpinSpeed || 2,
            hits: new Set(),
            weaponKey: this.baseKey,
            weaponSprite: this.getWeaponSpriteKey()
        })];
    }

    Weapon.prototype.fireInstant = function(player, target, dmg, subtype, stats) {
        const range = this.getRange() * (1 + (stats.range || 0));
        const isMoving = !!(player?.moveDirection && (Math.abs(player.moveDirection.x) > 0.05 || Math.abs(player.moveDirection.y) > 0.05));
        const chainBonus = isMoving ? (stats.moveConductionChain || 0) : 0;
        
        if (subtype === 'chain') {
            const count = this.getInstantCount();
            const bullets = [];
            for (let i = 0; i < count; i++) {
                bullets.push(this.applyCombatStats({
                    x: player.cx, y: player.cy,  // v0.16.3: 使用中心点
                    type: 'instant', subtype: subtype,
                    dmg: dmg, color: this.cfg.color, icon: this.cfg.icon,
                    range: range, chain: this.getChainCount() + (chainBonus > 0 ? 1 : 0),
                    chainRange: this.getChainRange() + chainBonus,
                    firstTarget: target,
                    randomStrikes: this.cfg.randomStrikes || false,
                    fork: !!this.cfg.fork,
                    branches: this.cfg.branches || 0,
                    hits: new Set(),
                    weaponKey: this.baseKey,
                    weaponSprite: this.getWeaponSpriteKey(),
                    sprite: 'bullet_lightning'
                }));
            }
            return bullets;
        }
        
        return [];
    }

    Weapon.prototype.fireArea = function(player, target, dmg, stats) {
        const range = this.getRange() * (1 + (stats.range || 0));
        const bullets = [];
        const count = Math.max(1, this.getProjectileCount());
        const areaDuration = this.getAreaDuration(stats);
        const lingerScale = stats.lingeringFieldScale || 0;
        const lingerDuration = stats.lingeringFieldDuration || 0;
        const lingerTickRateMul = stats.lingeringTickRateMul || 1;
        const poolRadius = Math.max(85, Math.min(260, range * 0.24));
        const spawnRadius = Math.max(120, Math.min(range * 0.58, 360));
        const maxActivePools = this.baseKey === 'holy_water'
            ? (this.isSuper ? 8 : 6)
            : (count + (this.isSuper ? 3 : 2));

        if (window.game && Array.isArray(window.game.bullets)) {
            const activePools = window.game.bullets
                .filter(b => b.type === 'area' && b.weaponKey === this.baseKey && !b.isLingeringField)
                .sort((a, b) => (a.spawnAt || 0) - (b.spawnAt || 0));
            while (activePools.length + count > maxActivePools) {
                const stale = activePools.shift();
                const staleIdx = window.game.bullets.indexOf(stale);
                if (staleIdx >= 0) window.game.bullets.splice(staleIdx, 1);
            }
        }
        
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.35;
            const distance = spawnRadius * (0.35 + Math.random() * 0.65);
            const tx = player.cx + Math.cos(angle) * distance;
            const ty = player.cy + Math.sin(angle) * distance;
            bullets.push(this.applyCombatStats({
                x: tx, y: ty,
                type: 'area', subtype: this.cfg.subtype || 'burn',
                dmg: dmg, color: this.cfg.color, icon: this.cfg.icon,
                range: poolRadius, spawnRadius: spawnRadius, duration: areaDuration,
                tickRate: (this.cfg.tickRate || 0.5) * lingerTickRateMul,
                slow: this.cfg.slow || 0,
                life: areaDuration,
                homing: !!this.cfg.homing,
                lingeringScale: lingerScale,
                lingeringDuration: lingerDuration,
                hits: new Set(), lastTick: 0,
                weaponKey: this.baseKey,
                weaponSprite: this.getWeaponSpriteKey(),
                sprite: 'effect_particle_glow',
                renderStyle: 'holy_water_pool',
                sourceX: player.cx,
                sourceY: player.cy,
                spawnAt: Date.now() / 1000,
                bottleFlight: 0.28,
                visualSeed: Math.random() * 1000
            }));
        }
        
        return bullets;
    }

    Weapon.prototype.fireLaser = function(player, target, dmg, stats) {
        // v0.30: 使用武器配置中的全屏射程
        const range = this.cfg.range || 3000;
        const isMoving = !!(player?.moveDirection && (Math.abs(player.moveDirection.x) > 0.05 || Math.abs(player.moveDirection.y) > 0.05));
        let baseAngle;
        if (this.cfg.preferMoveDirection && player.moveDirection) {
            const moveDir = player.moveDirection;
            const hasMoveDir = Math.abs(moveDir.x) > 0.001 || Math.abs(moveDir.y) > 0.001;
            baseAngle = hasMoveDir
                ? Math.atan2(moveDir.y, moveDir.x)
                : (player.facingRight ? 0 : Math.PI);
        } else {
            // v0.18.0: 使用敌人中心点(cx,cy)而不是脚底(x,y)计算角度
            baseAngle = target ? Math.atan2(target.cy - player.cy, target.cx - player.cx) : 
                             (player.facingRight ? 0 : Math.PI);
        }
        const width = this.getLaserWidth(stats) + (isMoving ? (stats.moveConductionWidth || 0) : 0);
        const life = this.getLaserLife(stats);
        const tickCooldown = this.getLaserTickCooldown();
        
        // 添加打击感：屏幕震动（比近战轻微）
        if (window.game && window.game.camera) {
            window.game.camera.addShake(this.isSuper ? 2 : 1);
        }

        if (this.cfg.uniqueBeam && window.game && Array.isArray(window.game.bullets)) {
            const existing = window.game.bullets.find(b =>
                b &&
                (b.type === 'laser_beam' || b.isLaser) &&
                b.weaponKey === this.baseKey &&
                b.sourceOwner === player &&
                (b.life || 0) > 0
            );
            if (existing) {
                existing.x = player.cx;
                existing.y = player.cy;
                existing.angle = baseAngle;
                existing.width = width;
                existing.range = range;
                existing.dmg = dmg;
                existing.color = this.cfg.color || existing.color || '#ff0044';
                existing.life = Math.max(existing.life || 0, life);
                existing.maxLife = Math.max(existing.maxLife || 0, life);
                existing.tickCooldown = tickCooldown;
                existing.curved = !!this.cfg.homingCurve;
                existing.turnRate = (this.cfg.turnRate || 0) + (isMoving ? (stats.moveConduction || 0) : 0);
                existing.maxTrackAngle = (this.cfg.maxTrackAngle || 0) + (isMoving ? (stats.moveConduction || 0) * 0.4 : 0);
                existing.trackReferenceAngle = baseAngle;
                existing.lockTrackToFireAngle = !!this.cfg.lockTrackToFireAngle;
                existing.segmentLength = this.cfg.segmentLength || 60;
                return [];
            }
        }
        
        return [this.applyCombatStats({
            x: player.cx, y: player.cy,
            type: 'laser_beam',
            isLaser: true,
            isStatic: true,
            followSource: true,
            sourceOwner: player,
            sourceType: 'playerCenter',
            sourceOffsetX: 0,
            sourceOffsetY: 0,
            angle: baseAngle,
            width: width,
            range: range,
            dmg: dmg,
            color: this.cfg.color || '#ff0044',
            life: life,
            maxLife: life,
            tickCooldown: tickCooldown,
            hits: new Set(),
            hitCooldowns: new Map(),
            pierce: 99,
            curved: !!this.cfg.homingCurve,
            preferMoveDirection: !!this.cfg.preferMoveDirection,
            turnRate: (this.cfg.turnRate || 0) + (isMoving ? (stats.moveConduction || 0) : 0),
            maxTrackAngle: (this.cfg.maxTrackAngle || 0) + (isMoving ? (stats.moveConduction || 0) * 0.4 : 0),
            trackReferenceAngle: baseAngle,
            lockTrackToFireAngle: !!this.cfg.lockTrackToFireAngle,
            segmentLength: this.cfg.segmentLength || 60,
            statsSnapshot: { ...(stats || {}) },
            weaponKey: this.baseKey,
            weaponSprite: this.getWeaponSpriteKey(),
            sprite: 'bullet_lightning'
        })];
    }

    Weapon.prototype.fireAura = function(player, dmg, stats) {
        const range = this.getRange() * (1 + (stats.range || 0));
        if (window.game && Array.isArray(window.game.bullets)) {
            const existing = window.game.bullets.find(b => b.type === 'aura' && b.weaponKey === this.baseKey);
            if (existing) {
                existing.x = player.cx;
                existing.y = player.cy;
                existing.dmg = dmg;
                existing.range = range * (1 + (stats.lingeringFieldScale || 0) * 0.2);
                existing.tickRate = (this.cfg.tickRate || 0.3) * (stats.lingeringTickRateMul || 1);
                existing.life = Math.max(existing.life || 0, 0.5);
                existing.lastTick = Math.min(existing.lastTick || 0, existing.tickRate * 0.5);
                existing.combat = { ...this.getCombatStats(), ...existing.combat };
                return [];
            }
        }
        
        return [this.applyCombatStats({
            x: player.cx, y: player.cy,  // v0.17.2: 使用中心点而非脚底
            type: 'aura', subtype: 'standard',
            dmg: dmg, color: this.cfg.color, icon: this.cfg.icon,
            range: range * (1 + (stats.lingeringFieldScale || 0) * 0.2), tickRate: (this.cfg.tickRate || 0.3) * (stats.lingeringTickRateMul || 1),
            life: 0.5, hits: new Set(), lastTick: 0,
            weaponKey: this.baseKey,
            weaponSprite: this.getWeaponSpriteKey(),
            sprite: 'effect_particle_glow',
            renderStyle: 'radiance',
            visualSeed: Math.random() * 1000
        })];
    }

    global.Weapon = Weapon;
})(window);
