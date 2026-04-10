(function attachWeaponOrbitRuntime(global) {
    'use strict';

    if (!global.Weapon) return;

    const methods = {

buildGuardianKnifeSpawnConfig(player = null, dmg = null, stats = null) {
    const owner = player || window.game?.player || null;
    if (!owner) return null;
    const combatStats = stats || window.game?.currentCombatStats || window.game?.passiveManager?.getStats?.() || {};
    const projSpeedMul = 1 + (combatStats?.projSpeed || 0);
    const rangeBonus = Math.max(0, combatStats?.range || 0);
    const speed = (this.cfg.speed || 240) * projSpeedMul;
    const returnSpeed = (this.cfg.returnSpeed || speed * 1.25) * (1 + (combatStats?.projSpeed || 0) * 0.5);
    const finalDmg = dmg ?? this.getDamage(combatStats);
    return this.applyCombatStats({
        x: owner.cx, y: owner.cy,
        type: 'guardian_knife_spawn',
        dmg: finalDmg,
        color: this.cfg.color,
        icon: this.cfg.icon,
        count: this.getProjectileCount(),
        speed,
        returnSpeed,
        searchRadius: (this.cfg.searchRadius || this.getRange()) * (1 + rangeBonus),
        range: this.getRange() * (1 + rangeBonus),
        idleRadius: this.cfg.idleRadius || 42,
        passThroughDistance: this.cfg.passThroughDistance || 72,
        curveRadius: this.cfg.curveRadius || 108,
        hitCooldown: this.cfg.hitCooldown || 0.26,
        weaponKey: this.baseKey,
        weaponSprite: this.getWeaponSpriteKey(),
        isSuper: !!this.isSuper,
        hits: new Set()
    }, combatStats);
},



evolveToSuper(evoKey, stats = null) {

    if (!SUPER_WEAPONS[evoKey]) return false;

    
    // 保存原武器key，用于武器池过滤
    this.originKey = this.baseKey;
    
    // v0.16.1 fix: 保存升级历史和属性
    const upgradeHistory = this.upgradeHistory || [];
    const oldRange = this.cfg.range;
    const oldSpeed = this.cfg.speed;
    
    const previousKey = this.baseKey;
    this.isSuper = true;
    this.baseKey = evoKey;
    this.cfg = { ...SUPER_WEAPONS[evoKey] };
    this.baseAttackCoeff = Number.isFinite(this.cfg.attackCoeff) ? this.cfg.attackCoeff : this.baseAttackCoeff;
    this.superAttackCoeffBonus = 1;
    
    // v0.16.1 fix: 继承原武器属性
    if (!this.cfg.range && oldRange) this.cfg.range = oldRange * 1.2;
    if (!this.cfg.speed && oldSpeed) this.cfg.speed = oldSpeed;
    
    // v0.18.0: 超武额外强化 - 基于原武器等级继承属性
    // v0.30: 保存原始等级供激光等武器使用
    this.originalLevel = this.level;
    if (this.originalLevel >= 4) {
        // 4级以上进化保留一部分等级成长，让超武手感不断档
        const carryPerLevel = window.WEAPON_DAMAGE_MODEL?.superCoeffCarryPerLevel || 0.05;
        this.superAttackCoeffBonus = 1 + (this.originalLevel - 4) * carryPerLevel;
        if (this.cfg.range) {
            this.cfg.range = Math.floor(this.cfg.range * (1 + (this.originalLevel - 4) * 0.05));
        }
    }
    if (evoKey === 'blood_whip') {
        // 圣裁月轮直接锁定成品口径，避免 8 级继承把超武范围再偷偷放大一层
        this.cfg.range = 320;
        this.cfg.orbitRadius = 320;
        this.cfg.orbitalDrawSize = 74.69;
        this.cfg.rotationSpeed = 3.491;
    } else if (evoKey === 'death_scythe') {
        // 终焉收割锁定隐藏武器专属成品口径，避免等级继承继续把范围抬到 400 以上
        this.cfg.range = 400;
        this.cfg.arcAngle = 360;
    }
    
    this.level = 1;
    this.maxLevel = 1;
    this.levelDisplay = 'MAX';
    
    // 保留升级历史
    this.upgradeHistory = upgradeHistory;
    this.upgradeHistory.push({ level: 'MAX', desc: '进化成' + this.cfg.name, type: '进化' });
    
    // v0.18.3: 环绕类超武立即生成永久环绕物
    let inheritedCodexTypes = [];
    if (window.game && Array.isArray(window.game.orbitals) && previousKey) {
        inheritedCodexTypes = window.game.orbitals
            .filter((orb) => (orb?.groupKey || '').startsWith(`orbit:${previousKey}:`))
            .sort((a, b) => (a?.slotIndex || 0) - (b?.slotIndex || 0))
            .map((orb) => orb?.codexType || null)
            .filter(Boolean);
        window.game.orbitals = window.game.orbitals.filter(orb => !(orb?.groupKey || '').startsWith(`orbit:${previousKey}:`));
    }
    if (window.game && typeof window.game.removeGuardianKnifeFamily === 'function' && previousKey) {
        const staleFamilies = (window.game.guardianKnives || [])
            .map((knife) => knife?.familyKey || '')
            .filter((familyKey) => familyKey.startsWith(`codex:knife:orbit:${previousKey}:`));
        for (const familyKey of new Set(staleFamilies)) {
            window.game.removeGuardianKnifeFamily(familyKey);
        }
    }
    if (window.game && (this.cfg.type === 'orbit' || this.cfg.subtype === 'orbit_proj')) {
        const evolvedStats = stats || window.game.currentCombatStats || null;
        const orbitCfg = this.applyCombatStats({
            ...this.cfg,
            dmg: this.getDamage(evolvedStats),
            weaponKey: this.baseKey,
            weaponSprite: this.getWeaponSpriteKey(),
            inheritedCodexTypes
        }, evolvedStats);
        window.game.spawnPermanentOrbitals(orbitCfg);
    } else if (window.game && this.cfg.subtype === 'guardian_knife') {
        const evolvedStats = stats || window.game.currentCombatStats || null;
        const knifeCfg = this.applyCombatStats({
            ...this.cfg,
            dmg: this.getDamage(evolvedStats),
            type: 'guardian_knife_spawn',
            count: this.getProjectileCount(),
            searchRadius: this.cfg.searchRadius || this.getRange(),
            returnSpeed: this.cfg.returnSpeed || this.cfg.speed || 360,
            idleRadius: this.cfg.idleRadius || 50,
            passThroughDistance: this.cfg.passThroughDistance || 92,
            curveRadius: this.cfg.curveRadius || 124,
            hitCooldown: this.cfg.hitCooldown || 0.2,
            weaponKey: this.baseKey,
            weaponSprite: this.getWeaponSpriteKey(),
            isSuper: true
        }, evolvedStats);
        window.game.spawnGuardianKnives(knifeCfg);
    }

    return true;

},



getWeaponSpriteKey() {
    const fallbackMap = {
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
    const spriteMap = (typeof window !== 'undefined' && window.WEAPON_WEAPONKEY_TO_SPRITEKEY)
        ? window.WEAPON_WEAPONKEY_TO_SPRITEKEY
        : fallbackMap;
    return spriteMap[this.baseKey] || fallbackMap[this.baseKey] || null;
},



applyProjectileVisualConfig(b) {
    const subtype = b.subtype || 'standard';
    const configMap = {
        homing: { sprite: 'bullet_lightning', size: 9, hitRadius: 6, renderStyle: 'magic_orb' },
        poison_homing: { sprite: 'bullet_lightning', size: 8.5, hitRadius: 5, renderStyle: 'poison_dart' },
        poison_dart: { sprite: 'bullet_lightning', size: 8.5, hitRadius: 5, renderStyle: 'poison_dart' },
        rapid: { sprite: 'bullet_arrow', size: 7.2, hitRadius: 4.4, renderStyle: 'knife_throw' },
        guardian_knife: { sprite: 'weapon_knife', size: 22, hitRadius: 10, renderStyle: 'knife_guardian' },
        boomerang: { sprite: 'bullet_arrow', size: 12, hitRadius: 7.8, renderStyle: 'axe_spin' },
        bounce: { sprite: 'bullet_lightning', size: 10, hitRadius: 6, renderStyle: 'cross_bounce' },
        cross_split_homing: { sprite: 'bullet_lightning', size: 10.5, hitRadius: 6.4, renderStyle: 'cross_bounce' },
        explode: { sprite: 'weapon_fireball', size: 12, hitRadius: 6.5, renderStyle: 'fireball' },
        dragon_breath: { sprite: 'weapon_fireball', size: 11.5, hitRadius: 6.5, renderStyle: 'fireball_tail' },
        fan: { sprite: 'bullet_arrow', size: 9, hitRadius: 5.2, renderStyle: 'shuriken' },
        penetrate: { sprite: 'bullet_ice', size: 12, hitRadius: 7, renderStyle: 'icicle' },
        orbit_proj: { sprite: 'bullet_lightning', size: 52, hitRadius: 14, renderStyle: 'orbit_bible' }
    };
    const cfg = { ...(configMap[subtype] || { sprite: 'bullet_arrow', size: 10, hitRadius: 6 }) };
    const scale = b.scale || 1;
    if (b.weaponKey === 'knife' && (subtype === 'rapid' || subtype === 'guardian_knife')) cfg.sprite = 'weapon_knife';
    else if (b.weaponKey === 'axe' && subtype === 'boomerang') cfg.sprite = 'weapon_axe';
    else if ((b.weaponKey === 'cross' || b.weaponKey === 'heaven_sword') && (subtype === 'bounce' || subtype === 'cross_split_homing')) cfg.sprite = b.weaponKey === 'heaven_sword' ? 'weapon_heaven_sword' : 'weapon_cross';
    else if (b.weaponKey === 'bible' && subtype === 'orbit_proj') cfg.sprite = 'weapon_bible';
    else if (b.weaponKey === 'poison_dart' && (subtype === 'poison_dart' || subtype === 'poison_homing')) cfg.sprite = 'weapon_poison_dart';
    else if (b.weaponKey === 'fireball' && subtype === 'explode') cfg.sprite = 'weapon_fireball';
    else if ((b.weaponKey === 'whip' || b.weaponKey === 'blood_whip') && subtype === 'penetrate' && b.waveShot) { cfg.sprite = b.weaponKey === 'blood_whip' ? 'weapon_blood_whip' : 'weapon_whip'; cfg.renderStyle = 'holy_sword_wave'; cfg.size = b.weaponKey === 'blood_whip' ? 128.63 : 75; cfg.hitRadius = b.weaponKey === 'blood_whip' ? 24 : 14; cfg.spinSpeedDeg = 500; }
    else if (b.weaponKey === 'fireball' && subtype === 'penetrate' && b.elementalType === 'ice') { cfg.sprite = 'weapon_icicle'; cfg.renderStyle = 'icicle'; cfg.size = 13.5; cfg.hitRadius = 7; }
    else if (b.weaponKey === 'hellfire' && subtype === 'explode') { cfg.sprite = 'weapon_hellfire'; cfg.renderStyle = 'fireball'; cfg.size = 46.02; cfg.hitRadius = 8; }
    else if (b.weaponKey === 'fireball' && subtype === 'dragon_breath' && b.elementalType === 'ice') { cfg.sprite = 'weapon_icicle'; cfg.renderStyle = 'icicle'; cfg.size = 13.5; cfg.hitRadius = 7; }
    b.sprite = cfg.sprite;
    b.size = (cfg.size || 16) * scale;
    b.hitRadius = (cfg.hitRadius || 8) * scale;
    b.renderStyle = cfg.renderStyle || 'default';
    b.spinSpeedDeg = cfg.spinSpeedDeg || b.spinSpeedDeg || 0;
},


fireOrbit(player, dmg, stats) {
    const spawnConfig = this.applyCombatStats({
        x: player.cx, y: player.cy,
        type: 'orbit_spawn',
        dmg: dmg, color: this.cfg.color, icon: this.cfg.icon,
        range: this.getRange() * (1 + (stats.range || 0)) * (1 + (stats.lingeringFieldScale || 0) * 0.18),
        orbitRadius: (this.cfg.orbitRadius || this.getRange()) * (1 + (stats.range || 0)),
        count: this.getProjectileCount(),
        duration: this.getOrbitDuration(stats) + (stats.lingeringFieldDuration || 0) * 0.6,
        eternal: true,
        doubleRing: !!this.cfg.doubleRing,
        rotationSpeed: (this.cfg.rotationSpeed || this.cfg.orbitSpeed || 2) * (1 + (stats.lingeringFieldScale || 0) * 0.12),
        orbitalDrawSize: this.cfg.orbitalDrawSize || 30,
        orbitHitPadding: this.cfg.orbitHitPadding || 44,
        orbitVisualSpinSpeed: this.cfg.orbitVisualSpinSpeed || 2,
        codexArsenal: Array.isArray(this.cfg.codexArsenal) ? [...this.cfg.codexArsenal] : [],
        codexVolleyBudget: this.cfg.codexVolleyBudget || 1,
        hits: new Set(),
        weaponKey: this.baseKey,
        weaponSprite: this.getWeaponSpriteKey()
    }, stats);

    if (window.game && Array.isArray(window.game.orbitals)) {
        const expectedCount = Math.max(1, spawnConfig.doubleRing ? spawnConfig.count * 2 : spawnConfig.count || 1);
        const familyKey = `orbit:${spawnConfig.weaponKey || this.baseKey}:perm`;
        const existing = window.game.orbitals.filter(orb => (orb.groupKey || '') === familyKey);
        if (existing.length === expectedCount) {
            existing.forEach((orb, index) => {
                orb.radius = spawnConfig.orbitRadius || spawnConfig.range;
                orb.attackRadius = spawnConfig.range;
                orb.dmg = spawnConfig.dmg;
                orb.life = Infinity;
                orb.permanent = true;
                orb.speed = spawnConfig.rotationSpeed || orb.speed;
                orb.drawSize = spawnConfig.orbitalDrawSize || orb.drawSize;
                orb.hitPadding = spawnConfig.orbitHitPadding || orb.hitPadding;
                orb.visualSpinSpeed = spawnConfig.orbitVisualSpinSpeed || orb.visualSpinSpeed;
                orb.weaponKey = spawnConfig.weaponKey || orb.weaponKey || this.baseKey;
                orb.weaponSprite = spawnConfig.weaponSprite || orb.weaponSprite;
                const fallbackCodexArsenal = Array.isArray(spawnConfig.codexArsenal) ? [...spawnConfig.codexArsenal] : [];
                const codexPool = typeof window.game?.getOwnedCodexArsenal === 'function'
                    ? window.game.getOwnedCodexArsenal(fallbackCodexArsenal)
                    : fallbackCodexArsenal;
                orb.codexFallbackArsenal = fallbackCodexArsenal;
                orb.codexArsenal = [...codexPool];
                orb.codexType = typeof window.game?.resolveCodexWeaponType === 'function'
                    ? window.game.resolveCodexWeaponType(orb.codexType || null, fallbackCodexArsenal, index)
                    : (orb.codexType || (orb.codexArsenal.length > 0 ? orb.codexArsenal[index % orb.codexArsenal.length] : null));
                orb.combat = spawnConfig.combat ? { ...spawnConfig.combat } : orb.combat;
            });
            return [];
        }
    }

    return [spawnConfig];
}
    };

    global.WeaponOrbitRuntime = methods;
    Object.assign(global.Weapon.prototype, methods);
})(window);
