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
        name: '圣剑',
        upgrades: [
            { level: 2, dmg: 1.3, range: 1.15, desc: '伤害+30%，斩程+15%' },
            { level: 3, dmg: 1.2, arcAngle: 130, desc: '伤害+20%，剑弧扩大到130°' },
            { level: 4, count: 2, dmg: 1.25, angleOffset: 25, desc: '双圣剑斩+伤害+25%（质变）' },
            { level: 5, dmg: 1.35, range: 1.2, desc: '伤害+35%，斩程+20%' },
            { level: 6, dmg: 1.3, knockback: 40, lifeSteal: 0.08, desc: '伤害+30%，圣击退40，吸血8%' },
            { level: 7, dmg: 1.4, crit: 0.15, critDmg: 1.8, desc: '伤害+40%，暴击15%，暴伤1.8x' },
            { level: 8, count: 3, dmg: 1.5, arcAngle: 160, lifeSteal: 0.15, desc: '三重圣剑扇斩+吸血15%（完全体）' }
        ]
    },
    scythe: {
        name: '镰刀',
        upgrades: [
            { level: 2, dmg: 1.4, range: 1.2, desc: '伤害+40%，范围+20%' },
            { level: 3, dmg: 1.3, execute: 0.18, executeThreshold: 0.18, desc: '伤害+30%，即死18%(<18%HP)' },
            { level: 4, count: 3, dmg: 1.35, doubleStrike: true, delay: 0.1, desc: '三重斩击+伤害+35%（质变）' },
            { level: 5, dmg: 1.48, range: 1.3, desc: '伤害+48%，范围+30%' },
            { level: 6, dmg: 1.4, execute: 0.24, executeThreshold: 0.24, desc: '伤害+40%，即死24%(<24%HP)' },
            { level: 7, dmg: 1.55, knockback: 72, lifeSteal: 0.15, desc: '伤害+55%，击退72，吸血15%' },
            { level: 8, count: 5, dmg: 1.85, tripleStrike: true, execute: 0.4, executeThreshold: 0.4, desc: '五重斩击+即死40%（完全体）' }
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
            { level: 2, dmg: 1.24, speed: 1.32, desc: '伤害+24%，飞行速度+32%' },
            { level: 3, dmg: 1.18, speed: 1.24, searchRadius: 1.14, desc: '伤害+18%，速度+24%，索敌更远' },
            { level: 4, count: 2, dmg: 1.28, desc: '双刃常驻+伤害+28%（质变）' },
            { level: 5, dmg: 1.34, speed: 1.28, returnSpeed: 1.24, desc: '伤害+34%，穿刺与回收更快' },
            { level: 6, dmg: 1.46, searchRadius: 1.2, passThroughDistance: 1.24, desc: '伤害+46%，穿透更深，索敌更稳' },
            { level: 7, dmg: 1.58, speed: 1.32, hitCooldown: 0.82, desc: '伤害+58%，往返节奏更紧凑' },
            { level: 8, dmg: 1.76, searchRadius: 1.28, returnSpeed: 1.28, desc: '伤害+76%，追猎范围扩大，准备进化' }
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
            { level: 2, count: 2, dmg: 1.35, explodeRadius: 1.45, desc: '双发+伤害+35%，范围+45%' },
            { level: 3, count: 2, dmg: 1.3, burn: { duration: 4, dmg: 12 }, desc: '双发+伤害+30%，燃烧4秒' },
            { level: 4, count: 3, dmg: 1.45, split: true, miniFireballs: 5, desc: '三发+伤害+45%+分裂5个（质变）' },
            { level: 5, count: 4, dmg: 1.6, explodeRadius: 1.85, desc: '四发+伤害+60%，范围+85%' },
            { level: 6, count: 4, dmg: 1.45, nova: true, secondaryExplosion: true, desc: '四发+二段大爆炸+伤害+45%' },
            { level: 7, count: 4, dmg: 1.6, burnSpread: true, desc: '四发+伤害+60%，燃烧蔓延' },
            { level: 8, count: 6, dmg: 2.2, meteor: true, damageBoost: 3.4, explodeRadius: 3.2, desc: '六发+伤害+120%+陨石火雨（完全体）' }
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
            { level: 2, count: 2, dmg: 1.35, slow: 0.55, desc: '双重+伤害+35%，减速55%' },
            { level: 3, count: 2, dmg: 1.3, freezeChance: 0.18, freezeDuration: 1.4, desc: '双重+伤害+30%，冻结18%/1.4秒' },
            { level: 4, count: 3, dmg: 1.4, shatter: true, aoeOnHit: true, desc: '三重+伤害+40%+范围冰冻（质变）' },
            { level: 5, count: 3, dmg: 1.55, slow: 0.65, desc: '三重+伤害+55%，减速65%' },
            { level: 6, count: 4, dmg: 1.4, freezeChance: 0.3, freezeDuration: 2.1, desc: '四重+伤害+40%，冻结30%/2.1秒' },
            { level: 7, count: 5, dmg: 1.65, pierce: 99, desc: '五重+伤害+65%，无限穿透' },
            { level: 8, count: 6, dmg: 2.0, blizzard: true, aoeRadius: 240, desc: '六重+伤害+100%+暴风雪（完全体）' }
        ]
    },
    laser: {
        name: '激光',
        upgrades: [
            { level: 2, dmg: 1.3, width: 14, beamLife: 0.26, desc: '伤害+30%，束宽14，持续0.26秒' },
            { level: 3, dmg: 1.45, width: 17, beamLife: 0.3, desc: '伤害+45%，束宽17，持续0.30秒' },
            { level: 4, dmg: 1.3, width: 20, tickCooldown: 0.11, desc: '束宽20，命中频率提升（质变）' },
            { level: 5, dmg: 1.5, width: 23, beamLife: 0.36, desc: '伤害+50%，束宽23，持续0.36秒' },
            { level: 6, dmg: 1.6, tickCooldown: 0.09, desc: '伤害+60%，持续伤害更密集' },
            { level: 7, dmg: 1.75, width: 27, beamLife: 0.42, desc: '束宽27，持续0.42秒，压制更强' },
            { level: 8, dmg: 2.0, width: 32, beamLife: 0.5, tickCooldown: 0.08, desc: '超宽圣焰束+高频灼烧（完全体）' }
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
            { level: 2, count: 4, dmg: 1.32, duration: 10.2, desc: '4本+伤害+32%+续航提升' },
            { level: 3, count: 4, dmg: 1.48, range: 1.16, rotationSpeed: 1.72, desc: '4本+伤害+48%，半径+16%，转速小幅提升' },
            { level: 4, count: 5, dmg: 1.66, duration: 11.6, rotationSpeed: 1.86, desc: '5本+伤害+66%+更稳定覆盖' },
            { level: 5, count: 5, dmg: 1.84, range: 1.28, desc: '5本+伤害+84%，范围+28%' },
            { level: 6, count: 6, dmg: 2.02, duration: 13.6, rotationSpeed: 2.02, desc: '6本+伤害+102%+续航强化' },
            { level: 7, count: 6, dmg: 2.22, range: 1.42, desc: '6本+伤害+122%，范围+42%' },
            { level: 8, count: 6, dmg: 2.46, eternal: true, range: 1.58, rotationSpeed: 2.14, desc: '6本+伤害+146%+永久圣环（完全体）' }
        ]
    },
    lightning: {
        name: '闪电',
        upgrades: [
            { level: 2, count: 2, dmg: 1.35, chain: 7, desc: '双发+伤害+35%，连锁7次' },
            { level: 3, count: 2, dmg: 1.3, chainRange: 230, desc: '双发+伤害+30%，范围230' },
            { level: 4, count: 3, dmg: 1.45, fork: true, branches: 4, desc: '三重+伤害+45%+四向分叉（质变）' },
            { level: 5, count: 3, dmg: 1.6, chain: 10, stun: 0.45, desc: '三重+伤害+60%，连锁10次，麻痹0.45秒' },
            { level: 6, count: 4, dmg: 1.45, randomStrikes: true, strikeInterval: 1.2, desc: '四重+伤害+45%，随机落雷强化' },
            { level: 7, count: 5, dmg: 1.8, chain: 14, desc: '五重+伤害+80%，连锁14次' },
            { level: 8, count: 6, dmg: 2.35, thunderStorm: true, chain: 18, branches: 5, desc: '六重+伤害+135%+雷暴18连（完全体）' }
        ]
    },
    holy_water: {
        name: '圣水',
        upgrades: [
            { level: 2, dmg: 1.45, cd: 0.8, duration: 8.1, desc: '伤害+45%，CD-20%，持续更久' },
            { level: 3, count: 4, dmg: 1.38, range: 1.36, desc: '四瓶+伤害+38%+范围提升' },
            { level: 4, count: 5, dmg: 1.58, range: 1.45, cd: 0.68, tickRate: 0.2, desc: '五瓶+伤害+58%，范围+45%，滴落更密（质变）' },
            { level: 5, count: 6, dmg: 1.54, duration: 10.8, desc: '六瓶+伤害+54%+持续10.8秒' },
            { level: 6, dmg: 1.72, cd: 0.58, tickRate: 0.16, desc: '伤害+72%，CD-42%，高频腐蚀' },
            { level: 7, count: 7, dmg: 1.62, range: 1.76, desc: '七瓶+伤害+62%+大范围圣池' },
            { level: 8, count: 8, dmg: 2.0, range: 1.95, cd: 0.5, duration: 13, tickRate: 0.12, sanctuary: true, desc: '八瓶+伤害+100%+广域圣池（完全体）' }
        ]
    },
    radiance: {
        name: '辉耀',
        upgrades: [
            { level: 2, dmg: 1.25, range: 1.14, desc: '伤害+25%，领域+14%' },
            { level: 3, dmg: 1.3, tickRate: 0.18, desc: '伤害+30%，灼烧更频繁' },
            { level: 4, dmg: 1.45, range: 1.22, desc: '伤害+45%，领域+22%（质变）' },
            { level: 5, dmg: 1.55, tickRate: 0.16, desc: '伤害+55%，灼烧节奏提升' },
            { level: 6, dmg: 1.65, range: 1.3, desc: '伤害+65%，领域+30%' },
            { level: 7, dmg: 1.8, tickRate: 0.14, desc: '伤害+80%，持续压制更强' },
            { level: 8, dmg: 2.1, range: 1.42, tickRate: 0.12, desc: '伤害+110%+超广域高频灼烧（完全体）' }
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
    
    // 伤害改为 Weapon.getDamage 统一按攻击力系数结算，这里不再直接改 cfg.dmg
    if (!weapon.baseAttackCoeff && Number.isFinite(weapon.cfg.attackCoeff)) {
        weapon.baseAttackCoeff = weapon.cfg.attackCoeff;
    }
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
    if (upgrade.poisonDmg !== undefined) {
        const attackBase = window.WEAPON_DAMAGE_MODEL?.baseAttackPower || 24;
        weapon.cfg.poisonDmgCoeff = Math.round((upgrade.poisonDmg / attackBase) * 1000) / 1000;
        weapon.cfg.poisonDmg = upgrade.poisonDmg;
    }
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
    if (upgrade.width !== undefined) weapon.cfg.width = upgrade.width;
    if (upgrade.beamLife !== undefined) weapon.cfg.beamLife = upgrade.beamLife;
    if (upgrade.tickCooldown !== undefined) weapon.cfg.tickCooldown = upgrade.tickCooldown;
    if (upgrade.rotationSpeed !== undefined) weapon.cfg.rotationSpeed = upgrade.rotationSpeed;
    if (upgrade.searchRadius !== undefined) weapon.cfg.searchRadius = Math.round((weapon.cfg.searchRadius || weapon.cfg.range || 0) * upgrade.searchRadius);
    if (upgrade.returnSpeed !== undefined) weapon.cfg.returnSpeed = Math.round((weapon.cfg.returnSpeed || weapon.cfg.speed || 0) * upgrade.returnSpeed);
    if (upgrade.passThroughDistance !== undefined) weapon.cfg.passThroughDistance = Math.round((weapon.cfg.passThroughDistance || 72) * upgrade.passThroughDistance);
    if (upgrade.hitCooldown !== undefined) weapon.cfg.hitCooldown = Math.max(0.08, (weapon.cfg.hitCooldown || 0.26) * upgrade.hitCooldown);
    if (upgrade.branches !== undefined) weapon.cfg.branches = upgrade.branches;
    if (upgrade.burstRadius !== undefined) weapon.cfg.burstRadius = upgrade.burstRadius;
    
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
