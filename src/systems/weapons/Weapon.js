class Weapon {

    constructor(key, level = 1, isSuper = false) {

        this.baseKey = key;

        this.isSuper = isSuper; // 是否为超武

        

        // 根据是否是超武选择配置

        if (isSuper && SUPER_WEAPONS[key]) {

            this.cfg = { ...SUPER_WEAPONS[key] };

            this.level = 1; // 超武固定1级

            this.maxLevel = 1;

        } else {

            this.cfg = { ...WEAPONS[key] };

            this.level = level;

            this.maxLevel = WEAPONS[key]?.maxLevel || 8;

        }

        

        this.cd = 0;

        this.xp = 0;

        this.xpToNext = 100;

    }

    

    // 进化成超武

    evolveToSuper(evoKey) {

        if (!SUPER_WEAPONS[evoKey]) return false;

        
        // 保存原武器key，用于武器池过滤
        this.originKey = this.baseKey;
        
        // v0.16.1 fix: 保存升级历史和属性
        const upgradeHistory = this.upgradeHistory || [];
        const oldRange = this.cfg.range;
        const oldSpeed = this.cfg.speed;
        
        this.isSuper = true;
        this.baseKey = evoKey;
        this.cfg = { ...SUPER_WEAPONS[evoKey] };
        
        // v0.16.1 fix: 继承原武器属性
        if (!this.cfg.range && oldRange) this.cfg.range = oldRange * 1.2;
        if (!this.cfg.speed && oldSpeed) this.cfg.speed = oldSpeed;
        
        // v0.18.0: 超武额外强化 - 基于原武器等级继承属性
        // v0.30: 保存原始等级供激光等武器使用
        this.originalLevel = this.level;
        if (this.originalLevel >= 4) {
            // 4级以上进化获得额外增强
            this.cfg.dmg = Math.floor(this.cfg.dmg * (1 + (this.originalLevel - 4) * 0.1));
            if (this.cfg.range) {
                this.cfg.range = Math.floor(this.cfg.range * (1 + (this.originalLevel - 4) * 0.05));
            }
        }
        
        this.level = 1;
        this.maxLevel = 1;
        this.levelDisplay = 'MAX';
        
        // 保留升级历史
        this.upgradeHistory = upgradeHistory;
        this.upgradeHistory.push({ level: 'MAX', desc: '进化成' + this.cfg.name, type: '进化' });
        
        // v0.18.3: 环绕类超武立即生成永久环绕物
        if (window.game && (this.cfg.type === 'orbit' || this.cfg.subtype === 'orbit_proj')) {
            window.game.spawnPermanentOrbitals(this.applyCombatStats({ ...this.cfg }));
        }

        return true;

    }

    

    // v0.18.0: 获取超武特殊效果描述
    getSuperEffectDesc() {
        if (!this.isSuper) return '';
        const effects = [];
        if (this.cfg.lifeSteal) effects.push(`吸血${Math.round(this.cfg.lifeSteal * 100)}%`);
        if (this.cfg.crit) effects.push(`暴击${Math.round(this.cfg.crit * 100)}%`);
        if (this.cfg.pierce >= 99) effects.push('无限穿透');
        else if (this.cfg.pierce > 5) effects.push(`穿透${this.cfg.pierce}`);
        if (this.cfg.execute) effects.push('即死');
        return effects.join(' ');
    }
    
    // 检查是否可以升级

    canLevelUp() {
        if (this.isSuper) return false; // 超武不能升级
        return this.level < this.maxLevel;
    }
    
    // v0.21: 直接升级一级（用于调试）
    levelUp() {
        if (this.isSuper) return false;
        if (this.level >= this.maxLevel) return false;
        
        this.level++;
        if (typeof applyUpgrade === 'function') {
            applyUpgrade(this, this.level);
        }
        
        // 记录升级历史
        if (!this.upgradeHistory) this.upgradeHistory = [];
        this.upgradeHistory.push({
            level: this.level,
            desc: this.getUpgradeDescription(),
            type: '升级'
        });
        
        return true;
    }

    

    // v0.18.0: 完整的武器升级系统 - 每级都有明显提升
    getDamage(stats) { 
        // v0.16.1 fix: 使用 baseDmg 避免重复计算
        if (this.isSuper) {
            const superDmg = this.cfg.dmg * (stats?.dmg || 1);
            return Math.floor(superDmg);
        }
        
        const baseDmg = this.baseDmg || this.cfg.dmg;
        // v0.18.0: 增强升级曲线 - 1级:100%, 2级:120%, 3级:145%, 4级:175%, 5级:210%...
        const levelMultiplier = 1 + (this.level - 1) * 0.20 + Math.pow(this.level - 1, 2) * 0.015;
        let dmg = baseDmg * levelMultiplier;
        dmg *= this.getBalanceDamageMultiplier();
        dmg *= stats?.dmg || 1;

        return Math.floor(dmg);
    }
    
    // v0.33: 武器平衡修正（对明显过强/过弱类型做轻量校准）
    getBalanceDamageMultiplier() {
        const key = this.baseKey;
        const map = {
            whip: 1.0,
            scythe: 0.95,
            wand: 1.1,
            knife: 0.62,
            axe: 1.1,
            cross: 1.05,
            fireball: 1.35,
            shuriken: 0.72,
            icicle: 1.0,
            laser: 1.2,
            poison_dart: 1.05,
            bible: 1.2,
            lightning: 0.95,
            holy_water: 1.35,
            radiance: 1.15
        };
        return map[key] || 1.0;
    }
    
    // v0.18.0: 获取当前级别的攻击范围（每级+8%）
    getRange() {
        if (this.isSuper) return this.cfg.range;
        const baseRange = this.cfg.range || 100;
        const growthMap = {
            whip: 0.05,
            scythe: 0.06,
            wand: 0.04,
            knife: 0.03,
            axe: 0.1,
            cross: 0.08,
            fireball: 0.1,
            shuriken: 0.05,
            icicle: 0.08,
            laser: 0,
            poison_dart: 0.05,
            bible: 0.08,
            lightning: 0.08,
            holy_water: 0.12,
            radiance: 0.1
        };
        const growth = growthMap[this.baseKey] ?? 0.08;
        return baseRange * (1 + (this.level - 1) * growth);
    }
    
    // v0.18.0: 获取当前级别的投射物数量
    getProjectileCount() {
        let count = this.cfg.count || 1;
        if (this.isSuper) return count;
        switch (this.baseKey) {
            case 'wand':
            case 'fireball':
            case 'poison_dart':
                return count + Math.floor((this.level - 1) / 3);
            case 'knife':
            case 'cross':
            case 'bible':
                return count + Math.floor((this.level - 1) / 2);
            case 'shuriken':
                return count + Math.floor((this.level - 1) / 3);
            case 'holy_water':
            case 'laser':
            case 'lightning':
            case 'radiance':
            case 'whip':
            case 'scythe':
                return count;
            default:
                return count + Math.floor((this.level - 1) / 2);
        }
    }
    
    // v0.18.0: 获取当前级别的穿透数
    getPierce() {
        let pierce = this.cfg.pierce || 0;
        if (this.isSuper) return pierce;
        // 每2级增加1点穿透
        return pierce + Math.floor((this.level - 1) / 2);
    }

    getArcAngle() {
        const baseArc = this.cfg.arcAngle || 90;
        if (this.isSuper) return baseArc;
        if (this.baseKey === 'whip') return baseArc + (this.level - 1) * 8;
        if (this.baseKey === 'scythe') return baseArc + (this.level - 1) * 4;
        return baseArc;
    }

    getChainCount() {
        const baseChain = this.cfg.chain || 0;
        if (this.isSuper) return baseChain;
        if (this.baseKey !== 'lightning') return baseChain;
        return baseChain + Math.floor((this.level - 1) / 2);
    }

    getChainRange() {
        const baseChainRange = this.cfg.chainRange || 120;
        if (this.isSuper) return baseChainRange;
        if (this.baseKey !== 'lightning') return baseChainRange;
        return baseChainRange * (1 + (this.level - 1) * 0.1);
    }

    getInstantCount() {
        const baseCount = this.cfg.count || 1;
        if (this.isSuper) return baseCount;
        if (this.baseKey !== 'lightning') return baseCount;
        return baseCount;
    }

    getAreaDuration(stats) {
        const baseDuration = this.cfg.duration || 4;
        const levelBonus = this.baseKey === 'holy_water' ? (this.level - 1) * 0.35 : 0;
        return (baseDuration + levelBonus) * (1 + (stats.duration || 0));
    }

    getOrbitDuration(stats) {
        const baseDuration = this.cfg.duration || 5;
        const levelBonus = this.baseKey === 'bible' ? (this.level - 1) * 0.45 : 0;
        return (baseDuration + levelBonus) * (1 + (stats.duration || 0));
    }

    getLaserWidth(stats) {
        let width = this.cfg.width || 12;
        if (!this.isSuper) {
            width += (this.level - 1) * 2.4;
        } else {
            width += (this.originalLevel || this.level) * 1.8;
        }
        if (stats?.projSize) width *= 1 + stats.projSize * 0.35;
        return width;
    }

    getLaserLife(stats) {
        const baseLife = this.cfg.beamLife || 0.22;
        const level = this.isSuper ? (this.originalLevel || this.level) : this.level;
        const life = baseLife + (level - 1) * (this.isSuper ? 0.08 : 0.045);
        return life * (1 + (stats?.duration || 0));
    }

    getLaserTickCooldown() {
        const baseCooldown = this.cfg.tickCooldown || 0.15;
        const level = this.isSuper ? (this.originalLevel || this.level) : this.level;
        return Math.max(this.isSuper ? 0.04 : 0.07, baseCooldown - (level - 1) * 0.01);
    }
    
    // v0.18.0: 获取升级描述 - Bug fix: 与getProjectileCount逻辑保持一致
    getUpgradeDescription() {
        const nextLevel = this.level + 1;
        if (nextLevel > this.maxLevel) return '已满级';
        const dmgIncrease = Math.round((0.20 + (nextLevel - 2) * 0.03) * 100);
        const descriptions = {
            whip: [`伤害+${dmgIncrease}%`, '剑弧更宽', '斩程提升'],
            scythe: [`伤害+${dmgIncrease}%`, '斩环扩大', nextLevel >= 4 ? '处决线提高' : '击退增强'],
            wand: [`伤害+${dmgIncrease}%`, '追踪更强', nextLevel % 3 === 0 ? '数量+1' : '飞行更稳'],
            knife: [`伤害+${dmgIncrease}%`, '射速提升', nextLevel % 2 === 1 ? '穿透/刀雨增强' : '弹速提升'],
            axe: [`伤害+${dmgIncrease}%`, '回旋更远', nextLevel % 2 === 1 ? '数量+1' : '回返重击增强'],
            cross: [`伤害+${dmgIncrease}%`, '弹跳更强', nextLevel % 2 === 1 ? '数量+1' : '回返更稳'],
            fireball: [`伤害+${dmgIncrease}%`, '爆炸范围扩大', nextLevel % 3 === 0 ? '火球+1' : '燃烧增强'],
            shuriken: [`伤害+${dmgIncrease}%`, '散射切割增强', nextLevel % 3 === 0 ? '手里剑+1' : '回收更快'],
            icicle: [`伤害+${dmgIncrease}%`, '冻结更强', nextLevel % 2 === 1 ? '穿透压制增强' : '射程提升'],
            laser: [`伤害+${dmgIncrease}%`, '激光更粗', '持续时间提升'],
            poison_dart: [`伤害+${dmgIncrease}%`, '毒性增强', nextLevel % 3 === 0 ? '毒镖+1' : '追踪更强'],
            bible: [`伤害+${dmgIncrease}%`, '圣环持续更久', nextLevel % 2 === 1 ? '圣环+1' : '旋转更快'],
            lightning: [`伤害+${dmgIncrease}%`, '连锁数提升', '链距扩大'],
            holy_water: [`伤害+${dmgIncrease}%`, '圣池更大', '残留更久'],
            radiance: [`伤害+${dmgIncrease}%`, '领域扩大', '灼烧更强']
        };
        const effects = descriptions[this.baseKey] || [`伤害+${dmgIncrease}%`, '范围提升'];
        if (nextLevel === 8) effects.push('★ 满级');
        return effects.join(' ');
    }

    getCombatStats() {
        const cfg = this.cfg || {};
        const executeChance = typeof cfg.execute === 'object' ? (cfg.execute.chance || 0) : (cfg.execute || 0);
        const executeThreshold = typeof cfg.execute === 'object'
            ? (cfg.execute.threshold || cfg.executeThreshold || 0)
            : (cfg.executeThreshold || 0);
        return {
            crit: cfg.crit || 0,
            critDmg: cfg.critDmg || 1,
            lifeSteal: cfg.lifeSteal || 0,
            execute: executeChance,
            executeThreshold: executeThreshold,
            freezeChance: cfg.freezeChance || 0,
            freezeDuration: cfg.freezeDuration || 0,
            poisonDmg: cfg.poisonDmg || 0,
            blind: !!cfg.blind,
            knockback: cfg.knockback || 0,
            burnSpread: !!cfg.burnSpread,
            divineNova: !!cfg.divineNova,
            plagueBurst: !!cfg.plagueBurst,
            blizzardAOE: !!cfg.blizzardAOE,
            nova: !!cfg.nova,
            secondaryExplosion: !!cfg.secondaryExplosion,
            burstOnDeath: !!cfg.burstOnDeath,
            returnDamage: !!cfg.returnDamage,
            returnToPlayer: !!cfg.returnToPlayer,
            spreadRange: cfg.spreadRange || 220
        };
    }

    applyCombatStats(target) {
        target.combat = { ...this.getCombatStats() };
        return target;
    }

    

    update(dt) { 
        // v0.16.3 fix: CD逻辑改为"不攻击时为0，攻击后进入CD"
        if (this.cd > 0) {
            this.cd -= dt;
            if (this.cd < 0) this.cd = 0;  // CD归零，不再继续减少
        }
    }

    canFire() { return this.cd <= 0; }

    

    addXp(amount) {
        if (this.isSuper) return false; // 超武不能升级
        if (this.level >= this.maxLevel) return false; // 满级
        
        this.xp += amount;

        if (this.xp >= this.xpToNext) {
            this.xp -= this.xpToNext;
            this.level++;
            this.xpToNext = Math.floor(this.xpToNext * 1.5);
            
            // v0.15.5 - 应用新的升级效果
            if (typeof applyUpgrade === 'function') {
                applyUpgrade(this, this.level);
            }
            
            return true;
        }

        return false;
    }

    

    getLevelColor() {

        if (this.isSuper) return '#f0f'; // 超武紫色

        if (this.level >= this.maxLevel) return '#fa0'; // 满级金色

        if (this.level >= 5) return '#0ff';

        if (this.level >= 3) return '#4f4';

        if (this.level >= 2) return '#fff';

        return '#aaa';

    }

    

    fire(player, target, stats) {
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
    
    // 近战攻击 - v0.18.0: 使用升级后的范围
    fireMelee(player, target, dmg, subtype, stats) {
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
    
    // 投射攻击 - v0.18.0: 使用升级后的数量和范围
    fireProjectile(player, target, dmg, subtype, stats) {
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
    
    // 辅助方法：创建单个投射物
    createProjectile(player, baseAngle, speed, dmg, subtype, stats, count = 1, target = null) {
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
    
    getWeaponSpriteKey() {
        const spriteMap = {
            whip: 'weapon_whip',
            scythe: 'weapon_scythe',
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
    
    applyProjectileVisualConfig(b) {
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
            orbit_proj: { sprite: 'bullet_lightning', size: 16, hitRadius: 8, renderStyle: 'orbit_bible' }
        };
        const cfg = { ...(configMap[subtype] || { sprite: 'bullet_arrow', size: 10, hitRadius: 6 }) };
        const scale = b.scale || 1;
        
        // 武器优先级修正：按武器逻辑使用对应贴图
        if (b.weaponKey === 'knife' && subtype === 'rapid') {
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
    
    // 环绕攻击（圣经）
    fireOrbit(player, dmg, stats) {
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
            hits: new Set(),
            weaponKey: this.baseKey,
            weaponSprite: this.getWeaponSpriteKey()
        })];
    }
    
    // 即时攻击（闪电）
    // v0.18.0: 使用升级后的范围
    fireInstant(player, target, dmg, subtype, stats) {
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
    
    // 区域攻击（圣水）- v0.22: 随机在玩家身边释放
    fireArea(player, target, dmg, stats) {
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
    
    // v0.30: 激光攻击 - 贯穿全屏的粗光束
    fireLaser(player, target, dmg, stats) {
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
            segmentLength: this.cfg.segmentLength || 60,
            statsSnapshot: { ...(stats || {}) },
            weaponKey: this.baseKey,
            weaponSprite: this.getWeaponSpriteKey(),
            sprite: 'bullet_lightning'
        })];
    }
    
    // 光环攻击（大蒜/魔法屏障）- v0.18.0: 使用升级后的范围
    fireAura(player, dmg, stats) {
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

}
