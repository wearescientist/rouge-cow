/**
 * 武器升级系统 v0.16.2 - 升级性价比优化版
 * 
 * 核心原则：
 * - 每个武器都有数量成长
 * - 升级性价比 > 选新武器
 * - 升级伤害提升幅度大
 */

// 武器升级表 - v0.16.2: 大幅提升升级收益
const WEAPON_UPGRADE_TABLE = {
    // ========== 近战类 ==========
    whip: {
        name: '鞭子',
        upgrades: [
            { level: 2, dmg: 1.3, range: 1.15, desc: '伤害+30%，范围+15%' },
            { level: 3, dmg: 1.2, arcAngle: 130, desc: '伤害+20%，角度130°' },
            { level: 4, count: 2, dmg: 1.25, angleOffset: 25, desc: '双鞭+伤害+25%（质变）' },
            { level: 5, dmg: 1.35, range: 1.2, desc: '伤害+35%，范围+20%' },
            { level: 6, dmg: 1.3, knockback: 40, lifeSteal: 0.08, desc: '伤害+30%，击退40，吸血8%' },
            { level: 7, dmg: 1.4, crit: 0.15, critDmg: 1.8, desc: '伤害+40%，暴击15%，暴伤1.8x' },
            { level: 8, count: 3, dmg: 1.5, arcAngle: 160, lifeSteal: 0.15, desc: '三鞭+伤害+50%+吸血15%（完全体）' }
        ]
    },
    scythe: {
        name: '镰刀',
        upgrades: [
            { level: 2, dmg: 1.35, range: 1.15, desc: '伤害+35%，范围+15%' },
            { level: 3, dmg: 1.25, execute: 0.15, executeThreshold: 0.15, desc: '伤害+25%，即死15%(<15%HP)' },
            { level: 4, count: 2, dmg: 1.3, doubleStrike: true, delay: 0.12, desc: '双重斩击+伤害+30%（质变）' },
            { level: 5, dmg: 1.4, range: 1.25, desc: '伤害+40%，范围+25%' },
            { level: 6, dmg: 1.35, execute: 0.2, executeThreshold: 0.2, desc: '伤害+35%，即死20%(<20%HP)' },
            { level: 7, dmg: 1.45, knockback: 60, lifeSteal: 0.12, desc: '伤害+45%，击退60，吸血12%' },
            { level: 8, count: 3, dmg: 1.6, tripleStrike: true, execute: 0.3, executeThreshold: 0.3, desc: '三重斩击+即死30%（完全体）' }
        ]
    },
    
    // ========== 投射类 ==========
    wand: {
        name: '魔杖',
        upgrades: [
            { level: 2, count: 2, dmg: 1.25, homingStrength: 0.8, desc: '双重弹+伤害+25%，追踪+0.8' },
            { level: 3, dmg: 1.3, pierce: 3, desc: '伤害+30%，穿透3个' },
            { level: 4, count: 3, dmg: 1.35, angleOffset: 10, desc: '三重弹+伤害+35%（质变）' },
            { level: 5, dmg: 1.4, speed: 1.2, desc: '伤害+40%，速度+20%' },
            { level: 6, count: 4, dmg: 1.35, chain: 3, chainRange: 120, desc: '四重弹+连锁3次' },
            { level: 7, dmg: 1.5, pierce: 99, homingStrength: 1.2, desc: '伤害+50%，无限穿透，完美追踪' },
            { level: 8, count: 5, dmg: 1.8, chain: 6, desc: '五重弹+伤害+80%+连锁6次（完全体）' }
        ]
    },
    knife: {
        name: '飞刀',
        upgrades: [
            { level: 2, count: 2, burst: 4, dmg: 1.2, desc: '双重连射+4枚+伤害+20%' },
            { level: 3, count: 2, burst: 5, pierce: 5, dmg: 1.15, desc: '5连发+穿透+伤害+15%' },
            { level: 4, count: 3, burst: 6, dmg: 1.3, desc: '三重连射6枚+伤害+30%（质变）' },
            { level: 5, count: 3, burst: 8, dmg: 1.35, speed: 1.25, desc: '8连发+伤害+35%，速度+25%' },
            { level: 6, count: 4, burst: 8, dmg: 1.25, bounce: 2, desc: '四重8枚+弹跳2次+伤害+25%' },
            { level: 7, count: 4, burst: 10, dmg: 1.4, pierce: 99, desc: '10连发+无限穿透+伤害+40%' },
            { level: 8, count: 5, burst: 12, dmg: 1.6, ricochet: true, desc: '五重12枚+伤害+60%+分裂（完全体）' }
        ]
    },
    axe: {
        name: '斧头',
        upgrades: [
            { level: 2, count: 2, dmg: 1.3, range: 1.15, desc: '双斧+伤害+30%，距离+15%' },
            { level: 3, dmg: 1.25, pierce: 5, speed: 1.15, desc: '伤害+25%，穿透5个，速度+15%' },
            { level: 4, count: 3, dmg: 1.35, angleOffset: 35, desc: '三斧齐飞+伤害+35%（质变）' },
            { level: 5, count: 3, dmg: 1.4, range: 1.25, desc: '三斧+伤害+40%，距离+25%' },
            { level: 6, count: 4, dmg: 1.3, returnDamage: true, desc: '四斧+伤害+30%，返回双伤' },
            { level: 7, count: 4, dmg: 1.45, speed: 1.3, pierce: 99, desc: '四斧+伤害+45%，速度+30%，无限穿透' },
            { level: 8, count: 5, dmg: 1.7, axeSize: 1.5, desc: '五斧+伤害+70%+巨斧（完全体）' }
        ]
    },
    cross: {
        name: '十字架',
        upgrades: [
            { level: 2, count: 2, dmg: 1.3, bounce: 4, desc: '双重+伤害+30%，弹跳4次' },
            { level: 3, count: 2, dmg: 1.25, crit: 0.2, desc: '双重+伤害+25%，暴击20%' },
            { level: 4, count: 3, dmg: 1.35, divine: true, explodeOnBounce: true, desc: '三重+弹跳爆炸+伤害+35%（质变）' },
            { level: 5, count: 3, dmg: 1.4, bounce: 6, desc: '三重+伤害+40%，弹跳6次' },
            { level: 6, count: 4, dmg: 1.3, holyDamage: 1.5, desc: '四重+伤害+30%，对亡灵1.5倍' },
            { level: 7, count: 4, dmg: 1.5, crit: 0.35, critDmg: 2.5, desc: '四重+伤害+50%，暴击35%，暴伤2.5x' },
            { level: 8, count: 5, dmg: 1.8, infiniteBounce: true, holyNova: true, desc: '五重+伤害+80%+无限弹跳+神圣新星（完全体）' }
        ]
    },
    fireball: {
        name: '火球',
        upgrades: [
            { level: 2, count: 2, dmg: 1.3, explodeRadius: 1.25, desc: '双发+伤害+30%，范围+25%' },
            { level: 3, count: 2, dmg: 1.25, burn: { duration: 4, dmg: 10 }, desc: '双发+伤害+25%，燃烧4秒' },
            { level: 4, count: 3, dmg: 1.4, split: true, miniFireballs: 3, desc: '三发+伤害+40%+分裂3个（质变）' },
            { level: 5, count: 3, dmg: 1.5, explodeRadius: 1.5, desc: '三发+伤害+50%，范围+50%' },
            { level: 6, count: 4, dmg: 1.35, nova: true, secondaryExplosion: true, desc: '四发+二段大爆炸+伤害+35%' },
            { level: 7, count: 4, dmg: 1.45, burnSpread: true, desc: '四发+伤害+45%，燃烧蔓延' },
            { level: 8, count: 5, dmg: 2.0, meteor: true, damageBoost: 3, explodeRadius: 2.5, desc: '五发+伤害+100%+陨石+大范围（完全体）' }
        ]
    },
    shuriken: {
        name: '手里剑',
        upgrades: [
            { level: 2, count: 5, dmg: 1.25, spread: 40, desc: '5枚+伤害+25%，散射40°' },
            { level: 3, count: 6, dmg: 1.2, pierce: 4, desc: '6枚+伤害+20%，穿透4个' },
            { level: 4, count: 8, dmg: 1.35, returnToPlayer: true, desc: '8枚+伤害+35%+回旋（质变）' },
            { level: 5, count: 10, dmg: 1.4, spread: 60, desc: '10枚+伤害+40%，散射60°' },
            { level: 6, count: 12, dmg: 1.3, speed: 1.3, desc: '12枚+伤害+30%，速度+30%' },
            { level: 7, count: 14, dmg: 1.5, pierce: 99, desc: '14枚+伤害+50%，无限穿透' },
            { level: 8, count: 16, dmg: 1.8, spread: 90, desc: '16枚+伤害+80%+手里剑风暴（完全体）' }
        ]
    },
    icicle: {
        name: '冰锥',
        upgrades: [
            { level: 2, count: 2, dmg: 1.3, slow: 0.5, desc: '双重+伤害+30%，减速50%' },
            { level: 3, count: 2, dmg: 1.25, freezeChance: 0.15, freezeDuration: 1.2, desc: '双重+伤害+25%，冻结15%/1.2秒' },
            { level: 4, count: 3, dmg: 1.35, shatter: true, aoeOnHit: true, desc: '三重+伤害+35%+范围冰冻（质变）' },
            { level: 5, count: 3, dmg: 1.45, slow: 0.6, desc: '三重+伤害+45%，减速60%' },
            { level: 6, count: 4, dmg: 1.3, freezeChance: 0.25, freezeDuration: 1.8, desc: '四重+伤害+30%，冻结25%/1.8秒' },
            { level: 7, count: 4, dmg: 1.55, pierce: 99, desc: '四重+伤害+55%，无限穿透' },
            { level: 8, count: 5, dmg: 1.9, blizzard: true, aoeRadius: 200, desc: '五重+伤害+90%+暴风雪（完全体）' }
        ]
    },
    chakram: {
        name: '环刃',
        upgrades: [
            { level: 2, count: 3, dmg: 1.3, orbitDuration: 3, desc: '三环+伤害+30%，持续3秒' },
            { level: 3, count: 3, dmg: 1.25, orbitRadius: 140, desc: '三环+伤害+25%，半径140' },
            { level: 4, count: 4, dmg: 1.4, doubleRing: true, desc: '四环+伤害+40%（质变）' },
            { level: 5, count: 4, dmg: 1.5, orbitSpeed: 1.4, desc: '四环+伤害+50%，速度+40%' },
            { level: 6, count: 5, dmg: 1.35, orbitDuration: 4.5, desc: '五环+伤害+35%，持续4.5秒' },
            { level: 7, count: 5, dmg: 1.6, pierce: 99, desc: '五环+伤害+60%，无限穿透' },
            { level: 8, count: 6, dmg: 2.0, blenderMode: true, damageTick: 0.06, desc: '六环+伤害+100%+极速切割（完全体）' }
        ]
    },
    poison_dart: {
        name: '毒镖',
        upgrades: [
            { level: 2, count: 2, dmg: 1.35, poisonDmg: 10, desc: '双重+伤害+35%，中毒+10' },
            { level: 3, count: 2, dmg: 1.25, spreadChance: 0.4, spreadRange: 150, desc: '双重+伤害+25%，40%传播' },
            { level: 4, count: 3, dmg: 1.4, burstOnDeath: true, burstRadius: 100, desc: '三重+伤害+40%+死亡毒爆（质变）' },
            { level: 5, count: 3, dmg: 1.5, poisonDmg: 15, desc: '三重+伤害+50%，中毒+15' },
            { level: 6, count: 4, dmg: 1.3, weaken: 0.35, desc: '四重+伤害+30%，敌人伤害-35%' },
            { level: 7, count: 4, dmg: 1.55, lingeringPoison: true, groundDuration: 4, desc: '四重+伤害+55%，毒雾4秒' },
            { level: 8, count: 5, dmg: 1.9, plague: true, spreadRange: 300, desc: '五重+伤害+90%+大范围瘟疫（完全体）' }
        ]
    },
    
    // ========== 特殊类 ==========
    bible: {
        name: '圣经',
        upgrades: [
            { level: 2, count: 4, dmg: 1.3, desc: '4本+伤害+30%' },
            { level: 3, count: 4, dmg: 1.25, range: 1.3, desc: '4本+伤害+25%，范围+30%' },
            { level: 4, count: 5, dmg: 1.4, duration: 8, rotationSpeed: 1.3, desc: '5本+伤害+40%，持续8秒（质变）' },
            { level: 5, count: 5, dmg: 1.5, range: 1.5, desc: '5本+伤害+50%，范围+50%' },
            { level: 6, count: 6, dmg: 1.35, duration: 12, desc: '6本+伤害+35%，持续12秒' },
            { level: 7, count: 6, dmg: 1.65, range: 1.7, desc: '6本+伤害+65%，范围+70%' },
            { level: 8, count: 8, dmg: 2.0, eternal: true, range: 2.0, desc: '8本+伤害+100%+永久环绕（完全体）' }
        ]
    },
    lightning: {
        name: '闪电',
        upgrades: [
            { level: 2, count: 2, dmg: 1.3, chain: 6, desc: '双发+伤害+30%，连锁6次' },
            { level: 3, count: 2, dmg: 1.25, chainRange: 200, desc: '双发+伤害+25%，范围200' },
            { level: 4, count: 3, dmg: 1.4, fork: true, branches: 3, desc: '三重+伤害+40%+分叉（质变）' },
            { level: 5, count: 3, dmg: 1.5, chain: 8, stun: 0.4, desc: '三重+伤害+50%，连锁8次，麻痹0.4秒' },
            { level: 6, count: 4, dmg: 1.35, randomStrikes: true, strikeInterval: 1.5, desc: '四重+伤害+35%，随机落雷' },
            { level: 7, count: 4, dmg: 1.7, chain: 12, desc: '四重+伤害+70%，连锁12次' },
            { level: 8, count: 5, dmg: 2.2, thunderStorm: true, chain: 15, desc: '五重+伤害+120%+雷暴15连（完全体）' }
        ]
    },
    holy_water: {
        name: '圣水',
        upgrades: [
            { level: 2, dmg: 1.3, cd: 0.9, desc: '伤害+30%，CD-10%' },
            { level: 3, count: 2, dmg: 1.25, desc: '质变：双瓶+伤害+25%' },
            { level: 4, dmg: 1.35, range: 1.1, cd: 0.85, desc: '伤害+35%，范围+10%，CD-15%' },
            { level: 5, count: 3, dmg: 1.3, desc: '质变：三瓶+伤害+30%' },
            { level: 6, dmg: 1.4, cd: 0.8, desc: '伤害+40%，CD-20%' },
            { level: 7, count: 4, dmg: 1.35, desc: '质变：四瓶+伤害+35%' },
            { level: 8, dmg: 1.5, range: 1.21, cd: 0.75, sanctuary: true, desc: '完全体：伤害+50%，范围+21%(400)，CD-25%，庇护所' }
        ]
    },
    // v0.16.3: 大蒜每级+100范围
    garlic: {
        name: '大蒜',
        upgrades: [
            { level: 2, count: 2, dmg: 1.35, rangeAdd: 100, desc: '双重+伤害+35%，范围+100(250)' },
            { level: 3, count: 2, dmg: 1.3, rangeAdd: 100, repel: 25, desc: '范围+100(350)，击退25' },
            { level: 4, count: 3, dmg: 1.45, rangeAdd: 100, lifeSteal: 0.08, fearChance: 0.15, desc: '三重+范围+100(450)+吸血8%（质变）' },
            { level: 5, count: 3, dmg: 1.6, rangeAdd: 100, desc: '范围+100(550)，伤害+60%' },
            { level: 6, count: 4, dmg: 1.5, rangeAdd: 100, repel: 40, desc: '四重+范围+100(650)，击退40' },
            { level: 7, count: 4, dmg: 1.75, rangeAdd: 100, fearChance: 0.3, desc: '范围+100(750)，恐惧30%' },
            { level: 8, count: 5, dmg: 2.2, rangeAdd: 100, immortal: true, invincibleFrames: 20, desc: '五重+范围+100(850)+无敌帧（完全体）' }
        ]
    }
};

// v0.16.0: SUPER_WEAPONS 已在 index.html 中定义，此处不再重复

// 应用升级
function applyUpgrade(weapon, newLevel) {
    const table = WEAPON_UPGRADE_TABLE[weapon.baseKey];
    if (!table || !table.upgrades) return;
    
    // 找到对应等级的升级
    const upgrade = table.upgrades.find(u => u.level === newLevel);
    if (!upgrade) return;
    
    // v0.16.1 fix: 保存基础伤害值，避免重复计算
    if (!weapon.baseDmg) {
        weapon.baseDmg = weapon.cfg.dmg;
    }
    
    // 应用数值提升（基于基础值）
    if (upgrade.dmg) weapon.cfg.dmg = Math.floor(weapon.baseDmg * upgrade.dmg * (1 + (newLevel - 1) * 0.15));
    if (upgrade.range) weapon.cfg.range = (weapon.cfg.baseRange || weapon.cfg.range) * upgrade.range;
    // v0.16.3: 支持固定范围增加值（大蒜专用）
    if (upgrade.rangeAdd) {
        const baseR = weapon.cfg.baseRange || weapon.cfg.range;
        weapon.cfg.range = baseR + upgrade.rangeAdd * (newLevel - 1);
    }
    if (upgrade.speed) weapon.cfg.speed = (weapon.cfg.baseSpeed || weapon.cfg.speed) * upgrade.speed;
    if (upgrade.cd) weapon.cfg.cd = (weapon.cfg.baseCd || weapon.cfg.cd) * upgrade.cd;
    
    // v0.16.1 fix: 保存基础值用于后续升级
    if (!weapon.cfg.baseRange) weapon.cfg.baseRange = weapon.cfg.range;
    if (!weapon.cfg.baseSpeed) weapon.cfg.baseSpeed = weapon.cfg.speed;
    if (!weapon.cfg.baseCd) weapon.cfg.baseCd = weapon.cfg.cd;
    
    // 应用机制改变
    if (upgrade.count !== undefined) weapon.cfg.count = upgrade.count;
    if (upgrade.angleOffset !== undefined) weapon.cfg.angleOffset = upgrade.angleOffset;
    if (upgrade.arcAngle !== undefined) weapon.cfg.arcAngle = upgrade.arcAngle;
    if (upgrade.pierce !== undefined) weapon.cfg.pierce = upgrade.pierce;
    if (upgrade.bounce !== undefined) weapon.cfg.bounce = upgrade.bounce;
    // v0.16.1 fix: burst 升级需要特殊处理
    if (upgrade.burst !== undefined) {
        weapon.cfg.burst = upgrade.burst;
        weapon.cfg.baseBurst = upgrade.burst;
    }
    if (upgrade.spread !== undefined) weapon.cfg.spread = upgrade.spread;
    if (upgrade.knockback !== undefined) weapon.cfg.knockback = upgrade.knockback;
    if (upgrade.lifeSteal !== undefined) weapon.cfg.lifeSteal = upgrade.lifeSteal;
    if (upgrade.crit !== undefined) weapon.cfg.crit = upgrade.crit;
    if (upgrade.critDmg !== undefined) weapon.cfg.critDmg = upgrade.critDmg;
    if (upgrade.execute !== undefined) weapon.cfg.execute = upgrade.execute;
    if (upgrade.executeThreshold !== undefined) weapon.cfg.executeThreshold = upgrade.executeThreshold;
    if (upgrade.homingStrength !== undefined) weapon.cfg.homingStrength = upgrade.homingStrength;
    if (upgrade.poisonDmg !== undefined) weapon.cfg.poisonDmg = upgrade.poisonDmg;
    if (upgrade.freezeChance !== undefined) weapon.cfg.freezeChance = upgrade.freezeChance;
    if (upgrade.freezeDuration !== undefined) weapon.cfg.freezeDuration = upgrade.freezeDuration;
    if (upgrade.slow !== undefined) weapon.cfg.slow = upgrade.slow;
    if (upgrade.chain !== undefined) weapon.cfg.chain = upgrade.chain;
    if (upgrade.chainRange !== undefined) weapon.cfg.chainRange = upgrade.chainRange;
    if (upgrade.orbitDuration !== undefined) weapon.cfg.orbitDuration = upgrade.orbitDuration;
    if (upgrade.orbitRadius !== undefined) weapon.cfg.orbitRadius = upgrade.orbitRadius;
    if (upgrade.orbitSpeed !== undefined) weapon.cfg.orbitSpeed = upgrade.orbitSpeed;
    if (upgrade.duration !== undefined) weapon.cfg.duration = upgrade.duration;
    if (upgrade.tickRate !== undefined) weapon.cfg.tickRate = upgrade.tickRate;
    
    // 应用布尔标志
    // v0.16.1 fix: 统一属性名，将Strike/Throw映射到Attack
    if (upgrade.doubleStrike !== undefined) {
        weapon.cfg.doubleAttack = upgrade.doubleStrike;
        weapon.cfg.doubleStrike = upgrade.doubleStrike;
    }
    if (upgrade.doubleThrow !== undefined) {
        weapon.cfg.doubleAttack = upgrade.doubleThrow;
        weapon.cfg.doubleThrow = upgrade.doubleThrow;
    }
    if (upgrade.tripleStrike !== undefined) {
        weapon.cfg.tripleAttack = upgrade.tripleStrike;
        weapon.cfg.tripleStrike = upgrade.tripleStrike;
    }
    if (upgrade.tripleThrow !== undefined) {
        weapon.cfg.tripleAttack = upgrade.tripleThrow;
        weapon.cfg.tripleThrow = upgrade.tripleThrow;
    }
    // v0.16.1 fix: 分裂效果需要特殊处理
    if (upgrade.split !== undefined) {
        weapon.cfg.split = upgrade.split;
        if (upgrade.miniFireballs) {
            weapon.cfg.splitConfig = { count: upgrade.miniFireballs, angleOffset: 15 };
        }
    }
    if (upgrade.returnDamage !== undefined) weapon.cfg.returnDamage = upgrade.returnDamage;
    if (upgrade.explodeOnBounce !== undefined) weapon.cfg.explodeOnBounce = upgrade.explodeOnBounce;
    if (upgrade.returnToPlayer !== undefined) weapon.cfg.returnToPlayer = upgrade.returnToPlayer;
    if (upgrade.shatter !== undefined) weapon.cfg.shatter = upgrade.shatter;
    if (upgrade.doubleRing !== undefined) weapon.cfg.doubleRing = upgrade.doubleRing;
    if (upgrade.burstOnDeath !== undefined) weapon.cfg.burstOnDeath = upgrade.burstOnDeath;
    if (upgrade.eternal !== undefined) weapon.cfg.eternal = upgrade.eternal;
    if (upgrade.fork !== undefined) weapon.cfg.fork = upgrade.fork;
    if (upgrade.randomStrikes !== undefined) weapon.cfg.randomStrikes = upgrade.randomStrikes;
    if (upgrade.blenderMode !== undefined) weapon.cfg.blenderMode = upgrade.blenderMode;
    
    // 记录升级描述
    if (!weapon.upgradeHistory) weapon.upgradeHistory = [];
    weapon.upgradeHistory.push({
        level: newLevel,
        desc: upgrade.desc,
        type: getUpgradeType(upgrade)
    });
}

function getUpgradeType(upgrade) {
    // v0.16.1 fix: 更准确的升级类型判断
    if (upgrade.dmg && !upgrade.count && !upgrade.doubleStrike && !upgrade.doubleThrow) return '数值';
    if (upgrade.count || upgrade.burst) return '数量';
    if (upgrade.pierce || upgrade.bounce) return '穿透/弹跳';
    if (upgrade.crit || upgrade.lifeSteal) return '暴击/吸血';
    if (upgrade.execute) return '即死';
    if (upgrade.homingStrength || upgrade.chain) return '机制';
    return '机制';
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WEAPON_UPGRADE_TABLE, applyUpgrade };
}
