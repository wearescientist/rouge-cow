/**
 * PassiveManager - 被动道具管理器
 * 从 index.html 迁移的独立模块
 */

function getPassiveStepValue(passive, stepIndex) {
    if (Array.isArray(passive?.perLevel)) {
        return passive.perLevel[stepIndex] ?? 0;
    }
    return passive?.value ?? 0;
}

function getPassiveTotalValue(passive, level) {
    let total = 0;
    for (let i = 0; i < level; i++) {
        total += getPassiveStepValue(passive, i);
    }
    return total;
}

const PASSIVE_MERGES = {
    wings: 'candelabrador',
    spellbinder: 'spinach'
};

function normalizePassiveKey(key) {
    return PASSIVE_MERGES[key] || key;
}

function migratePassiveLevels(passives) {
    const next = { ...(passives || {}) };
    for (const [legacyKey, targetKey] of Object.entries(PASSIVE_MERGES)) {
        const legacyLevel = Number(next[legacyKey] || 0);
        if (legacyLevel <= 0) continue;
        const targetMax = PASSIVES[targetKey]?.maxLevel || 5;
        const currentTargetLevel = Number(next[targetKey] || 0);
        next[targetKey] = Math.min(targetMax, Math.max(currentTargetLevel, legacyLevel));
        delete next[legacyKey];
    }
    return next;
}

window.WEAPON_DAMAGE_MODEL = Object.freeze({
    baseAttackPower: 24,
    superCoeffCarryPerLevel: 0.04,
    levelGrowthByType: Object.freeze({
        melee: 1.27,
        proj: 1.17,
        orbit: 1.1,
        instant: 1.14,
        area: 1.09,
        aura: 1.08,
        laser: 1.14
    }),
    levelGrowthByKey: Object.freeze({
        whip: 1.2,
        scythe: 1.16,
        wand: 1.22,
        knife: 1.14,
        axe: 1.18,
        cross: 1.18,
        fireball: 1.21,
        shuriken: 1.19,
        icicle: 1.18,
        laser: 1.1,
        poison_dart: 1.22,
        bible: 1.1,
        lightning: 1.15,
        holy_water: 1.09,
        radiance: 1.08
    })
});

function roundWeaponCoeff(value) {
    return Math.round(value * 1000) / 1000;
}

function attachWeaponDamageCoefficients(configMap) {
    const attackBase = window.WEAPON_DAMAGE_MODEL?.baseAttackPower || 24;
    for (const cfg of Object.values(configMap || {})) {
        if (!cfg) continue;
        if (!Number.isFinite(cfg.attackCoeff) && Number.isFinite(cfg.dmg)) {
            cfg.attackCoeff = roundWeaponCoeff(cfg.dmg / attackBase);
        }
        if (!Number.isFinite(cfg.poisonCoeff) && Number.isFinite(cfg.poison)) {
            cfg.poisonCoeff = roundWeaponCoeff(cfg.poison / attackBase);
        }
        if (!Number.isFinite(cfg.poisonDmgCoeff) && Number.isFinite(cfg.poisonDmg)) {
            cfg.poisonDmgCoeff = roundWeaponCoeff(cfg.poisonDmg / attackBase);
        }
    }
}

class PassiveManager {

    constructor(player) {

        this.player = player;

        this.passives = {}; // { key: level }

    }

    

    // 添加或升级被动

    add(key) {

        key = normalizePassiveKey(key);

        const passive = PASSIVES[key];

        if (!passive) return false;

        

        const currentLevel = this.passives[key] || 0;

        if (currentLevel >= passive.maxLevel) return false; // 已满级

        

        this.passives[key] = currentLevel + 1;
        if (currentLevel === 0) {
            window.collectionCodex?.unlockPassive?.(key);
        }

        // 立即应用被动效果

        this.applyEffect(passive);

        

        return true;

    }

    

    // 应用被动效果

    applyEffect(passive) {

        switch(passive.effect) {

            case 'maxHpPct':

                // 空心之心：增加最大生命值百分比

                const hpBonus = Math.floor(this.player.maxHp * passive.value);

                this.player.maxHp += hpBonus;

                this.player.hp += hpBonus;

                break;

        }

    }

    

    // 获取被动效果统计

    getStats() {

        const stats = {
            dmg: 1,           // 菠菜
            armor: 0,         // 护甲
            maxHpPct: 0,      // 空心之心
            cooldown: 1,      // 空白之书（冷却倍率，越小越好）
            range: 1,         // 烛台
            projSpeed: 1,     // 护腕
            duration: 1,      // 魔法拼写器
            projCount: 0,     // 复制器
            speed: 1,         // 翅膀
            magnet: 0,        // 吸引器
            luck: 0,          // 四叶草
            expBonus: 0,      // 王冠
            lifeSteal: 0,     // 红石榴
            focusPower: 0,
            luckyNovaChance: 0,
            luckyNovaRadius: 0,
            alchemyChance: 0,
            alchemyRadius: 0,
            alchemyDot: 0,
            retributionPulse: 0,
            retributionRadius: 0,
            moveConduction: 0,
            moveConductionWidth: 0,
            moveConductionChain: 0,
            lingeringFieldScale: 0,
            lingeringFieldDuration: 0,
            lingeringTickRateMul: 1,
            pickupMomentum: 0,
            pickupMomentumCap: 0,
            activeSynergies: []
        };

        

        for (const [key, level] of Object.entries(this.passives)) {

            const passive = PASSIVES[key];

            if (!passive || level <= 0) continue;

            

            switch(passive.effect) {

                case 'dmg':

                    stats.dmg += getPassiveTotalValue(passive, level);

                    break;

                case 'armor':

                    stats.armor += getPassiveTotalValue(passive, level);

                    break;

                case 'maxHpPct':

                    stats.maxHpPct += getPassiveTotalValue(passive, level);

                    break;

                case 'cooldown':

                    for (let i = 0; i < level; i++) {
                        stats.cooldown *= (1 - getPassiveStepValue(passive, i));
                    }

                    break;

                case 'range':

                    stats.range += getPassiveTotalValue(passive, level);

                    break;

                case 'projSpeed':

                    stats.projSpeed += getPassiveTotalValue(passive, level);

                    break;

                case 'duration':

                    stats.duration += getPassiveTotalValue(passive, level);

                    break;

                case 'projCount':

                    stats.projCount += getPassiveTotalValue(passive, level);

                    break;

                case 'speed':

                    stats.speed += getPassiveTotalValue(passive, level);

                    break;

                case 'magnet':

                    stats.magnet += getPassiveTotalValue(passive, level);

                    break;

                case 'luck':

                    stats.luck += getPassiveTotalValue(passive, level);

                    break;

                case 'expBonus':

                    stats.expBonus += getPassiveTotalValue(passive, level);

                    break;

                case 'lifeSteal':

                    stats.lifeSteal += getPassiveTotalValue(passive, level);

                    break;

            }

        }

        

        const focusLevel = this.getLevel('focus_lens');
        const cloverLevel = this.getLevel('clover');
        const flaskLevel = this.getLevel('alchemist_flask');
        const spinachLevel = this.getLevel('spinach');
        const pummarolaLevel = this.getLevel('pummarola');
        const armorLevel = this.getLevel('armor');
        const wingsLevel = this.getLevel('wings');
        const crownLevel = this.getLevel('crown');
        const attractorbLevel = this.getLevel('attractorb');
        const spellbinderLevel = this.getLevel('spellbinder');

        if (focusLevel > 0 && cloverLevel > 0) {
            stats.focusPower = 0.05 + focusLevel * 0.012;
            stats.luckyNovaChance = Math.min(0.5, 0.12 + cloverLevel * 0.03);
            stats.luckyNovaRadius = 88 + focusLevel * 10 + cloverLevel * 6;
            stats.activeSynergies.push('focus_refraction');
        }

        if (flaskLevel > 0 && spinachLevel > 0) {
            stats.alchemyChance = Math.min(0.55, 0.16 + flaskLevel * 0.035);
            stats.alchemyRadius = 92 + flaskLevel * 10 + spinachLevel * 6;
            stats.alchemyDot = 6 + flaskLevel * 2 + spinachLevel;
            stats.activeSynergies.push('alchemy_reaction');
        }

        if (pummarolaLevel > 0 && armorLevel > 0) {
            stats.retributionPulse = 0.12 + pummarolaLevel * 0.025 + armorLevel * 0.015;
            stats.retributionRadius = 96 + armorLevel * 12 + pummarolaLevel * 8;
            stats.activeSynergies.push('blood_armor_pulse');
        }

        if (wingsLevel > 0 && focusLevel > 0) {
            stats.moveConduction = 0.08 + wingsLevel * 0.015 + focusLevel * 0.01;
            stats.moveConductionWidth = 2 + focusLevel + Math.floor(wingsLevel * 0.5);
            stats.moveConductionChain = 26 + wingsLevel * 12 + focusLevel * 8;
            stats.activeSynergies.push('storm_guidance');
        }

        if (spellbinderLevel > 0 && flaskLevel > 0) {
            stats.lingeringFieldScale = 0.42 + spellbinderLevel * 0.03;
            stats.lingeringFieldDuration = 1.2 + spellbinderLevel * 0.22 + flaskLevel * 0.16;
            stats.lingeringTickRateMul = Math.max(0.55, 0.9 - spellbinderLevel * 0.035 - flaskLevel * 0.025);
            stats.activeSynergies.push('lingering_field');
        }

        if (crownLevel > 0 && attractorbLevel > 0) {
            stats.pickupMomentum = 0.018 + crownLevel * 0.006 + attractorbLevel * 0.004;
            stats.pickupMomentumCap = 0.18 + crownLevel * 0.03 + attractorbLevel * 0.02;
            stats.activeSynergies.push('royal_magnetism');
        }

        return stats;

    }

    

    // 检查是否有某个被动

    has(key) {

        key = normalizePassiveKey(key);

        return (this.passives[key] || 0) > 0;

    }

    

    // 获取被动等级

    getLevel(key) {

        key = normalizePassiveKey(key);

        return this.passives[key] || 0;

    }

    

    // 获取所有被动列表（用于UI显示）

    getOwnedPassives() {

        const list = [];

        for (const [key, level] of Object.entries(this.passives)) {

            const passive = PASSIVES[key];

            if (passive && level > 0) {

                list.push({

                    key: key,

                    name: passive.name,

                    icon: passive.icon,

                    level: level,

                    maxLevel: passive.maxLevel,

                    desc: passive.desc

                });

            }

        }

        return list;

    }

    

    // 检查是否可以合成超武 - v0.18.2 fix: 需要被动满级

    // v0.22: 检查进化条件（只需1级被动，不需要满级）
    checkEvolution(weaponKey) {
        const evo = WEAPON_EVOLUTIONS[weaponKey];
        if (!evo) return null;
        
        // v0.22: 只需有对应被动即可（1级就行）
        if (!this.has(evo.requires)) return null;
        
        return evo;
    }

    

    // 序列化（用于存档）

    serialize() {

        return migratePassiveLevels(this.passives);

    }

    

    // 反序列化（用于读档）

    deserialize(data) {

        this.passives = migratePassiveLevels(data);

    }

}



// 武器系统 - 支持进化


const WEAPONS = {
    whip: { key: 'whip', name: '圣剑', icon: '⚔️', iconSprite: 'weapon_whip', dmg: 24, cd: 0.85, range: 300, arcAngle: 100, type: 'melee', subtype: 'arc', color: '#ffd36b', knockback: 30, maxLevel: 8 },
    scythe: { key: 'scythe', name: '镰刀', icon: '⚰️', iconSprite: 'weapon_scythe', dmg: 22, cd: 0.95, range: 120, arcAngle: 90, type: 'melee', subtype: 'circle', color: '#884488', knockback: 42, outerRingBonus: 0, maxLevel: 8 },
    wand: { key: 'wand', name: '魔杖', icon: '🔮', dmg: 18, cd: 0.7, speed: 520, range: 470, type: 'proj', subtype: 'homing', color: '#5b8cff', homingStrength: 1.0, homingDelay: 0.08, homingRange: 420, scatterAngle: 0.9, projectileLife: 1.7, count: 5, maxLevel: 8 },
    knife: { key: 'knife', name: '飞刀', icon: '🗡️', dmg: 32, attackCoeff: 2.151, cd: 0.3, speed: 860, range: 560, type: 'proj', subtype: 'guardian_knife', color: '#ff5252', count: 1, searchRadius: 620, returnSpeed: 1180, idleRadius: 42, passThroughDistance: 128, curveRadius: 118, hitCooldown: 0.26, maxLevel: 8 },
    axe: { key: 'axe', name: '雷神战斧', icon: '🪓', dmg: 28, cd: 0.18, speed: 560, range: 420, type: 'proj', subtype: 'boomerang', color: '#8b4513', count: 1, returnSpeed: 980, hoverDuration: 0.08, impactLightning: true, impactRadius: 92, impactShockwaveRadius: 140, impactCenterDamageScale: 1.22, impactShockwaveDamageScale: 0.82, impactLightningChain: 3, impactLightningRange: 260, impactLightningDmgScale: 0.66, impactStorm: false, impactStormDelay: 0.18, impactStormDamageScale: 0.50, impactField: false, impactFieldRadius: 104, impactFieldDuration: 1.0, impactFieldTick: 0.22, maxLevel: 8 },
    cross: { key: 'cross', name: '十字架', icon: '✝️', dmg: 20, cd: 0.95, speed: 420, range: 480, type: 'proj', subtype: 'cross_return', color: '#e8e8e8', count: 1, splitCount: 2, splitTimes: 1, splitRadius: 220, splitDamageScale: 0.75, hoverDuration: 0.2, hoverTick: 0.32, hoverRadius: 0, hoverDamageScale: 0, returnSpeed: 720, returnDamageScale: 1, maxLevel: 8 },
    fireball: { key: 'fireball', name: '双头龙吐息', icon: '🐉', dmg: 10, cd: 0.92, speed: 560, range: 360, type: 'proj', subtype: 'dragon_breath', color: '#ff7a40', count: 1, projectileLife: 0.92, explodeRadius: 78, staggerDelay: 0.06, burnFieldDuration: 1.2, burnFieldRange: 68, burnFieldDmg: 5, burnFieldTick: 0.24, slow: 0.22, slowDuration: 0.9, pierce: 2, freezeMeterGain: 0.34, freezeDuration: 1.0, elementBurst: false, elementBurstRadius: 64, maxLevel: 8 },
    shuriken: { key: 'shuriken', name: '手里剑', icon: '🎯', dmg: 15, cd: 0.6, speed: 620, range: 420, type: 'proj', subtype: 'fan', color: '#9aa0a6', count: 3, spread: 28, supplementaryWaves: [{ delay: 0.09, count: 2, spread: 16, damageScale: 0.85 }], maxLevel: 8 },
    icicle: { key: 'icicle', name: '冰锥', icon: '❄️', dmg: 26, cd: 0.82, speed: 520, range: 560, pierce: 2, type: 'proj', subtype: 'penetrate', color: '#b6f1ff', slow: 0.45, slowDuration: 1.2, freezeMeterGain: 0.38, freezeDuration: 1.25, count: 1, maxLevel: 8, hiddenFromPool: true },
    laser: { key: 'laser', name: '激光', icon: '🔦', dmg: 22, cd: 0.68, range: 3000, type: 'laser', color: '#ff0044', width: 14, beamLife: 0.22, tickCooldown: 0.15, maxLevel: 8 },
    poison_dart: { key: 'poison_dart', name: '毒镖', icon: '📍', dmg: 16, cd: 0.55, speed: 640, range: 440, type: 'proj', subtype: 'poison_dart', color: '#49b85b', poisonStacksOnHit: 1, poisonMaxStacks: 5, poisonStackDmg: 5, poisonDuration: 4, poisonSpreadTargets: 2, poisonSpreadRange: 220, poisonSpreadMaxGen: 1, poisonCloudOnDeath: false, count: 1, maxLevel: 8 },
    bible: { key: 'bible', name: '武装法典', icon: '📖', dmg: 14, cd: 5.2, range: 180, count: 2, duration: 10.5, orbitRadius: 180, orbitSpeed: 1.7, orbitalDrawSize: 60, orbitHitPadding: 42, orbitVisualSpinSpeed: 2.1, type: 'orbit', color: '#ffd700', codexWeaponized: true, codexShotInterval: 1.04, codexShotDmgScale: 0.7, codexExtraShots: 0, codexBurstChance: 0, codexVolleyBudget: 2, codexArsenal: ['wand','poison_dart','knife','laser','cross','fireball'], maxLevel: 8 },
    lightning: { key: 'lightning', name: '闪电', icon: '⚡', dmg: 18, cd: 0.54, range: 680, chain: 5, chainRange: 420, type: 'instant', subtype: 'chain', color: '#ffff00', count: 1, maxLevel: 8, hiddenFromPool: true },
    holy_water: { key: 'holy_water', name: '圣水', icon: '💧', dmg: 7, cd: 1.5, range: 560, duration: 3.2, tickRate: 0.22, slow: 0.18, type: 'area', color: '#00bfff', count: 1, growFrom: 60, growTo: 150, growthDelay: 0.75, maxBurstDmgScale: 0, exposeMultiplier: 0, exposeDuration: 0, maxLevel: 8 },
    radiance: { key: 'radiance', name: '辉耀', icon: '🔥', dmg: 5, cd: 0.35, range: 280, tickRate: 0.35, type: 'aura', color: '#ff6600', burn: true, maxLevel: 8 }
};



// 被动道具系统（吸血鬼幸存者风格）

const PASSIVES = {


    spinach: { key: 'spinach', name: '菠菜', icon: '🥬', desc: '伤害+9%', effect: 'dmg', value: 0.09, maxLevel: 5 },

    armor: { key: 'armor', name: '护甲', icon: '🛡️', desc: '护甲+1，提升格挡概率', effect: 'armor', value: 1, maxLevel: 5 },

    hollow_heart: { key: 'hollow_heart', name: '空心之心', icon: '💝', desc: '最大生命+20%', effect: 'maxHpPct', value: 0.2, maxLevel: 5 },

    empty_tome: { key: 'empty_tome', name: '空白之书', icon: '📚', desc: '冷却-7%', effect: 'cooldown', value: 0.07, maxLevel: 5 },

    candelabrador: { key: 'candelabrador', name: '烛台', icon: '🕯️', desc: '攻击范围+9%', effect: 'range', value: 0.09, maxLevel: 5 },

    bracer: { key: 'bracer', name: '护腕', icon: '💪', desc: '弹射速度+10%', effect: 'projSpeed', value: 0.1, maxLevel: 5 },

    spellbinder: { key: 'spellbinder', name: '魔法拼写器', icon: '✨', desc: '持续时间+10%', effect: 'duration', value: 0.1, maxLevel: 5, hiddenFromPool: true, mergedInto: 'spinach' },

    duplicator: { key: 'duplicator', name: '复制器', icon: '🔄', desc: '投射物阶段性增幅', effect: 'projCount', value: 1, perLevel: [1, 1, 1, 0, 1], maxLevel: 5 },

    wings: { key: 'wings', name: '翅膀', icon: '🪶', desc: '移速+10%，移动构筑更顺手', effect: 'speed', value: 0.1, maxLevel: 5, hiddenFromPool: true, mergedInto: 'candelabrador' },

    attractorb: { key: 'attractorb', name: '吸引器', icon: '🧲', desc: '拾取范围+20%，拾取联动更强', effect: 'magnet', value: 20, maxLevel: 5 },

    clover: { key: 'clover', name: '四叶草', icon: '🍀', desc: '幸运+10%', effect: 'luck', value: 0.1, maxLevel: 5 },

    crown: { key: 'crown', name: '王冠', icon: '👑', desc: '经验获取+6%，拾取势能更强', effect: 'expBonus', value: 0.06, maxLevel: 5 },

    focus_lens: { key: 'focus_lens', name: '聚焦晶镜', icon: '🔎', desc: '攻击范围+10%，聚焦武器更稳定', effect: 'range', value: 0.1, maxLevel: 5 },

    alchemist_flask: { key: 'alchemist_flask', name: '炼金瓶', icon: '⚗️', desc: '持续时间+10%，残留与反应更持久', effect: 'duration', value: 0.1, maxLevel: 5 },

    pummarola: { key: 'pummarola', name: '红石榴', icon: '🍎', desc: '吸血+5%', effect: 'lifeSteal', value: 0.05, maxLevel: 5 }

};



// 超武合成配方（武器满级+对应被动=超武）

const WEAPON_EVOLUTIONS = {
    whip: { requires: 'hollow_heart', result: 'blood_whip', name: '圣裁月轮', icon: '🗡️', desc: '斩击附带强化半月波', bonus: { dmg: 1.5, lifeSteal: 0.1, crit: 0.15, waveShot: true, waveShotCount: 2, waveShotDamageScale: 0.72, waveShotLife: 1.1 } },

    wand: { 
        requires: 'empty_tome', 
        result: 'holy_wand',
        name: '圣魔星雨',
        icon: '🔯',
        desc: '高频星弹群',
        bonus: { cd: 0.2, homingStrength: 2.0, speed: 1.2 }
    },

    knife: { 
        requires: 'bracer', 
        result: 'thousand_blade',
        name: '御刃',
        icon: '💠',
        desc: '三刃永久追猎',
        bonus: { speed: 1.22, dmg: 1.4, searchRadius: 1.2 }
    },
    axe: { requires: 'candelabrador', result: 'death_spiral', name: '诸神黄昏战斧', icon: '🌀', desc: '单把神斧往返，落地雷暴并留下雷区', bonus: { dmg: 1.55, count: 1, speed: 1.28, returnSpeed: 1.35, range: 1.18, impactRadius: 126, impactShockwaveRadius: 198, impactCenterDamageScale: 1.46, impactShockwaveDamageScale: 1.02, impactLightning: true, impactLightningChain: 9, impactLightningRange: 460, impactLightningDmgScale: 0.96, impactStorm: true, impactStormDelay: 0.12, impactStormDamageScale: 0.82, impactField: true, impactFieldRadius: 148, impactFieldDuration: 1.9, impactFieldTick: 0.16 } },
    cross: { requires: 'clover', result: 'heaven_sword', name: '审判圣印', icon: '✝️', desc: '分裂数和分裂次数提升，圣印爆点范围增大', bonus: { dmg: 1.7, splitCount: 4, splitTimes: 2, splitRadius: 340, splitDamageScale: 0.86 } },
    bible: { requires: 'crown', result: 'unholy_vespers', name: '终末武装法典', icon: '📿', desc: '全书齐射概率提高，同调收益更强', bonus: { duration: 1.35, count: 6, range: 1.18, codexWeaponized: true, codexShotInterval: 0.64, codexShotDmgScale: 0.86, codexExtraShots: 2, codexBurstChance: 0.3, codexVolleyBudget: 3 } },
    fireball: { requires: 'spinach', result: 'hellfire', name: '极寒烈焰', icon: '🔥', desc: '冰火融合成蓝焰陨弹：命中爆炸、留火场并叠加冻结', bonus: { dmg: 1.58, count: 1, speed: 1.1, range: 1.2, projectileLife: 1.12, explodeRadius: 132, burnFieldDuration: 1.5, burnFieldRange: 1.24, burnFieldDmg: 1.42, slow: 0.42, slowDuration: 1.2, freezeMeterGain: 1.45, freezeDuration: 1.32 } },
    holy_water: { requires: 'alchemist_flask', result: 'la_borra', name: '圣泉扩散', icon: '💦', desc: '蔓延更快更广，区域内敌人易伤', bonus: { dmg: 1.35, count: 2, growFrom: 95, growTo: 235, growthDelay: 0.58, maxBurstDmgScale: 1.2, exposeMultiplier: 1.18, exposeDuration: 1.1 } },

    shuriken: { 

        requires: 'duplicator', 

        result: 'ninja_storm',

        name: '忍具齐射',

        icon: '🌀',

        desc: '三段高速扇切',

        bonus: { projCount: 3, cd: 0.5 }

    },
    icicle: { requires: 'spinach', result: 'blizzard', name: '霜灾冰暴', icon: '🌨️', desc: '保留兼容的隐藏进化', bonus: { range: 1.4, slow: true } },
    scythe: { requires: 'armor', result: 'death_scythe', name: '终焉收割', icon: '💀', desc: '近乎整圈斩击，外圈高额伤害', bonus: { dmg: 1.8, range: 1.4, arcAngle: 330, outerRingBonus: 0.95 } },

    laser: { 

        requires: 'focus_lens', 

        result: 'prism_beam',

        name: '炽天使硫磺',

        icon: '🔴',

        desc: '曲线追踪贯穿',

        bonus: { cd: 0.5, width: 1.8, duration: 2.2 }

    },

    poison_dart: { 

        requires: 'attractorb', 

        result: 'toxic_strike',

        name: '瘟疫花绽',

        icon: '☠️',

        desc: '高层叠毒 + 稳定裂变',

        bonus: { poison: true, poisonDmg: 5 }

    },
    radiance: { requires: 'pummarola', result: 'solar_radiance', name: '日轮真焰', icon: '☀️', desc: '维持大范围并强化燃烧联动', bonus: { range: 1.0, dmg: 1.7, blind: false, burnSpread: true } },
    lightning: { requires: 'candelabrador', result: 'storm_arc', name: '风暴弧光', icon: '⛈️', desc: '保留兼容的隐藏进化', bonus: { chain: 8, chainRange: 1.5, randomStrikes: true } }
};



// 超武定义 - v0.16.3: 恢复超武高伤害，只削弱初始武器
const SUPER_WEAPONS = {
    blood_whip: { name: '圣裁月轮', icon: '🗡️', dmg: 78, cd: 0.52, range: 420, arcAngle: 150, type: 'melee', subtype: 'arc', color: '#ffe08a', knockback: 84, lifeSteal: 0.2, count: 3, crit: 0.28, critDmg: 2.4, waveShot: true, waveShotCount: 2, waveShotDamageScale: 0.72, waveShotSpeed: 860, waveShotLife: 1.2, waveShotPierce: 2, special: '斩击附带强化半月波' },
    death_scythe: { name: '终焉收割', icon: '💀', iconSprite: 'weapon_death_scythe', dmg: 128, cd: 0.7, range: 210, arcAngle: 330, type: 'melee', subtype: 'circle', color: '#440044', knockback: 96, count: 2, outerRingBonus: 1.1, special: '接近整圈收割，外圈高伤' },
    holy_wand: { 
        name: '圣魔星雨', icon: '🔯', dmg: 62, cd: 0.24, speed: 640, range: 520,
        type: 'proj', subtype: 'homing', color: '#9ab6ff', homingStrength: 3.2,
        homingDelay: 0.05, homingRange: 520, scatterAngle: 0.7, projectileLife: 1.25,
        count: 6, pierce: 2, special: '高频星弹群+短寿命强追踪'
    },
    thousand_blade: { 
        name: '御刃', icon: '💠', dmg: 58, cd: 0.24, speed: 980, range: 660,
        type: 'proj', subtype: 'guardian_knife', color: '#ff7a5c',
        count: 3, searchRadius: 760, returnSpeed: 1320, idleRadius: 50, passThroughDistance: 138, curveRadius: 132, hitCooldown: 0.18, special: '三刃永久追猎穿刺'
    },
    death_spiral: { name: '诸神黄昏战斧', icon: '🌀', dmg: 86, cd: 0.16, speed: 700, range: 560, type: 'proj', subtype: 'boomerang', color: '#880000', count: 1, returnSpeed: 1320, hoverDuration: 0.06, impactLightning: true, impactRadius: 126, impactShockwaveRadius: 198, impactCenterDamageScale: 1.46, impactShockwaveDamageScale: 1.02, impactLightningChain: 9, impactLightningRange: 460, impactLightningDmgScale: 0.96, impactStorm: true, impactStormDelay: 0.12, impactStormDamageScale: 0.82, impactField: true, impactFieldRadius: 148, impactFieldDuration: 1.9, impactFieldTick: 0.16, special: '单把神斧往返，落点雷暴+雷区' },
    heaven_sword: { name: '审判圣印', icon: '✝️', iconSprite: 'weapon_heaven_sword', dmg: 66, cd: 0.72, speed: 560, range: 620, type: 'proj', subtype: 'cross_return', color: '#fff1a6', count: 2, splitCount: 4, splitTimes: 2, splitRadius: 340, splitDamageScale: 0.86, hoverDuration: 0.2, hoverTick: 0.28, hoverRadius: 0, hoverDamageScale: 0, returnSpeed: 900, returnDamageScale: 1.08, special: '分裂弹射圣印' },
    hellfire: { name: '极寒烈焰', icon: '🔥', dmg: 82, cd: 0.72, speed: 660, range: 460, type: 'proj', subtype: 'explode', color: '#74dbff', count: 1, projectileLife: 1.12, explodeRadius: 132, burnFieldDuration: 1.9, burnFieldRange: 118, burnFieldDmg: 11, burnFieldTick: 0.18, slow: 0.42, slowDuration: 1.2, freezeMeterGain: 0.72, freezeDuration: 1.4, elementBurst: false, elementBurstRadius: 88, special: '融合蓝焰弹：大范围爆炸、燃烧与冻结积累' },
    ninja_storm: { 
        name: '忍具齐射', icon: '🌀', dmg: 58, cd: 0.34, speed: 700, range: 560,
        type: 'proj', subtype: 'fan', color: '#aab0b8', count: 4, spread: 38,
        supplementaryWaves: [{ delay: 0.08, count: 3, spread: 20, damageScale: 0.9 }, { delay: 0.16, count: 3, spread: 18, damageScale: 0.85 }],
        special: '三段高速扇切'
    },
    blizzard: { name: '霜灾冰暴', icon: '🌨️', dmg: 66, cd: 0.7, speed: 560, range: 680, type: 'proj', subtype: 'penetrate', color: '#c9f7ff', pierce: 4, slow: 0.6, slowDuration: 1.6, count: 1, freezeMeterGain: 0.65, freezeDuration: 1.8, freezeBurst: true, freezeBurstRadius: 140, freezeBurstMeterGain: 0.35, special: '兼容隐藏进化' },
    prism_beam: { 
        name: '炽天使硫磺', icon: '🔴', dmg: 96, cd: 1.02, range: 3000,
        type: 'laser', color: '#ff2f6d', width: 34, beamLife: 0.96, tickCooldown: 0.04,
        homingCurve: true, turnRate: 2.35, maxTrackAngle: 0.48, segmentLength: 52, lockTrackToFireAngle: true, uniqueBeam: true,
        special: '单条重型圣焰束，沿发射方向锥体内曲线索敌贯穿'
    },
    toxic_strike: { 
        name: '瘟疫花绽', icon: '☠️', dmg: 44, cd: 0.26, speed: 680, range: 620,
        type: 'proj', subtype: 'poison_dart', color: '#1bb25a',
        count: 1, poisonStacksOnHit: 2, poisonMaxStacks: 7, poisonStackDmg: 8, poisonDuration: 4.5,
        poisonSpreadTargets: 3, poisonSpreadRange: 260, poisonSpreadMaxGen: 2, poisonCloudOnDeath: true, poisonCloudDuration: 1.8, poisonCloudStacks: 1,
        special: '高层叠毒+稳定裂变'
    },
    unholy_vespers: { name: '终末武装法典', icon: '📿', dmg: 88, cd: 0.82, range: 220, type: 'orbit', color: '#ff6600', count: 6, duration: 24, rotationSpeed: 1.95, orbitalDrawSize: 76, orbitHitPadding: 58, codexWeaponized: true, codexShotInterval: 0.64, codexShotDmgScale: 0.86, codexExtraShots: 2, codexBurstChance: 0.3, codexVolleyBudget: 3, codexArsenal: ['wand','poison_dart','knife','laser','cross','fireball'], special: '环绕书随机齐射' },
    la_borra: { name: '圣泉扩散', icon: '💦', dmg: 58, cd: 0.9, range: 1080, duration: 5.5, type: 'area', color: '#4488ff', count: 2, tickRate: 0.14, slow: 0.28, growFrom: 95, growTo: 235, growthDelay: 0.58, maxBurstDmgScale: 1.2, exposeMultiplier: 1.18, exposeDuration: 1.1, special: '大范围蔓延圣池+易伤' },
    solar_radiance: { name: '日轮真焰', icon: '☀️', dmg: 24, cd: 0.22, range: 280, tickRate: 0.24, type: 'aura', color: '#ffaa00', burn: true, blind: false, burnSpread: true, special: '范围不降，强化灼烧联动' },
    storm_arc: { name: '风暴弧光', icon: '⛈️', dmg: 68, cd: 0.2, range: 920, type: 'instant', subtype: 'chain', color: '#aef6ff', chain: 14, chainRange: 560, fork: true, branches: 4, randomStrikes: true, special: '兼容隐藏进化' }
};

attachWeaponDamageCoefficients(WEAPONS);
attachWeaponDamageCoefficients(SUPER_WEAPONS);
