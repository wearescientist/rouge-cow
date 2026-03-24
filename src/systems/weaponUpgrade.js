/**
 * 武器升级系统 - 武器全面更新版
 */

const WEAPON_UPGRADE_TABLE = {
    whip: {
        name: '圣剑',
        upgrades: [
            { level: 2, desc: '伤害 24→30', range: 1.08 },
            { level: 3, desc: '斩击次数+1', count: 2, angleOffset: 12 },
            { level: 4, desc: '解锁半月波剑气', waveShot: true, waveShotCount: 1, waveShotDamageScale: 0.5, waveShotSpeed: 760, waveShotLife: 0.8, waveShotPierce: 1 },
            { level: 5, desc: '剑气距离提升', waveShotLife: 1.15 },
            { level: 6, desc: '斩击次数再+1', count: 3, angleOffset: 16 },
            { level: 7, desc: '剑气数量+1', waveShotCount: 2 },
            { level: 8, desc: '剑气伤害和宽度提升', waveShotDamageScale: 0.72, waveShotPierce: 2, arcAngle: 120 }
        ]
    },
    scythe: {
        name: '镰刀',
        upgrades: [
            { level: 2, desc: '伤害 22→27' },
            { level: 3, desc: '角度 120°', arcAngle: 120 },
            { level: 4, desc: '半径 150', range: 1.25 },
            { level: 5, desc: '攻击频率提升', cd: 0.88 },
            { level: 6, desc: '角度 150°', arcAngle: 150 },
            { level: 7, desc: '半径 185', range: 1.54 },
            { level: 8, desc: '外圈增伤明显提高', outerRingBonus: 0.55 }
        ]
    },
    wand: {
        name: '魔杖',
        upgrades: [
            { level: 2, cd: 0.9, desc: '冷却降低，发射更频繁' },
            { level: 3, homingRange: 1.25, homingStrength: 1.2, desc: '追踪范围提升，收束更稳' },
            { level: 4, speed: 1.1, desc: '飞弹速度提升，命中更利落' },
            { level: 5, count: 6, desc: '飞弹数量 5→6' },
            { level: 6, cd: 0.85, desc: '冷却再降低' },
            { level: 7, homingRange: 1.2, homingStrength: 1.35, scatterAngle: 0.85, desc: '追踪更远，收束更快' },
            { level: 8, speed: 1.12, projectileLife: 0.9, desc: '飞弹更硬朗，命中更集中' }
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
        name: '雷神战斧',
        upgrades: [
            { level: 2, desc: '飞行与回收更快', speed: 1.22, returnSpeed: 1.28, range: 1.08 },
            { level: 3, desc: '雷链数量 4，半径 280', impactLightningChain: 4, impactLightningRange: 280 },
            { level: 4, desc: '落地震波更强', impactCenterDamageScale: 1.34, impactShockwaveDamageScale: 0.90, impactShockwaveRadius: 150 },
            { level: 5, desc: '飞行速度再提升，雷链更远', speed: 1.28, returnSpeed: 1.36, impactLightningRange: 340 },
            { level: 6, desc: '雷链数量 6，范围 410', impactLightningChain: 6, impactLightningRange: 410 },
            { level: 7, desc: '雷击伤害与爆点扩大', impactLightningDmgScale: 0.86, impactRadius: 112, impactShockwaveRadius: 176 },
            { level: 8, desc: '落地后追加雷暴并留下雷区', impactStorm: true, impactStormDelay: 0.16, impactStormDamageScale: 0.60, impactField: true, impactFieldRadius: 116, impactFieldDuration: 1.4, impactFieldTick: 0.18 }
        ]
    },
    cross: {
        name: '十字架',
        upgrades: [
            { level: 2, desc: '伤害 25' },
            { level: 3, desc: '分裂数 3', splitCount: 3 },
            { level: 4, desc: '分裂次数 2', splitTimes: 2 },
            { level: 5, desc: '伤害 31' },
            { level: 6, desc: '分裂半径 300', splitRadius: 300 },
            { level: 7, desc: '数量 2', count: 2 },
            { level: 8, desc: '子十字命中触发小圣光爆点', returnNova: true, returnNovaRadius: 110, splitDamageScale: 0.86 }
        ]
    },
    fireball: {
        name: '双头龙吐息',
        upgrades: [
            { level: 2, desc: '轮替更快，弹道更远', speed: 1.08, range: 1.08 },
            { level: 3, desc: '火球残留更久', burnFieldDuration: 1.25, burnFieldRange: 1.12 },
            { level: 4, desc: '冰锥减速与冻结增强', slow: 0.28, freezeMeterGain: 1.18 },
            { level: 5, desc: '一轮追加一发，冰火交替连吐', count: 2 },
            { level: 6, desc: '火爆更大，冰锥贯穿更强', explodeRadius: 96, pierce: 3 },
            { level: 7, desc: '火场更痛，冰控更稳', burnFieldDmg: 1.35, slowDuration: 1.12, freezeDuration: 1.18 },
            { level: 8, desc: '成型：更快的冰火轮替', speed: 1.12, projectileLife: 1.12, explodeRadius: 112, burnFieldDuration: 1.3, burnFieldRange: 1.12, slow: 0.34 }
        ]
    },
    shuriken: {
        name: '手里剑',
        upgrades: [
            { level: 2, speed: 1.18, desc: '伤害提升，飞行更快' },
            { level: 3, range: 1.12, spread: 32, desc: '射程提升，扇形更顺手' },
            { level: 4, supplementaryWaves: [{ delay: 0.09, count: 2, spread: 16, damageScale: 0.85 }], desc: '解锁二段补投（2枚）' },
            { level: 5, count: 4, desc: '主波数量 3→4' },
            { level: 6, supplementaryWaves: [{ delay: 0.08, count: 3, spread: 16, damageScale: 0.9 }], desc: '补投数量 2→3' },
            { level: 7, afterImageDamageScale: 0.35, desc: '命中触发短残影切线' },
            { level: 8, cd: 0.85, speed: 1.2, desc: '最终形态：更快更短冷却' }
        ]
    },
    icicle: {
        name: '冰锥',
        upgrades: [
            { level: 2, desc: '兼容隐藏升级', freezeMeterGain: 1.12 },
            { level: 3, desc: '穿透 3', pierce: 3 },
            { level: 4, desc: '冻结爆裂', freezeBurst: true, freezeBurstRadius: 100 },
            { level: 5, desc: '爆裂范围更大', freezeBurstRadius: 1.2 },
            { level: 6, desc: '冻结更稳', freezeDuration: 1.2 },
            { level: 7, desc: '穿透 4', pierce: 4 },
            { level: 8, desc: '爆裂附带冻结积累', freezeBurstMeterGain: 0.35 }
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
            { level: 2, poisonDuration: 1.2, poisonStackDmg: 1.15, desc: '毒持续更久，单层更痛' },
            { level: 3, poisonStacksOnHit: 2, desc: '命中改为 2 层毒' },
            { level: 4, poisonSpreadTargets: 3, desc: '传播目标 2→3' },
            { level: 5, poisonMaxStacks: 7, desc: '毒层上限 5→7' },
            { level: 6, poisonCloudOnDeath: true, poisonCloudDuration: 1.6, poisonCloudStacks: 1, desc: '死亡留下短命毒雾' },
            { level: 7, poisonSpreadMaxGen: 2, desc: '允许二代传播一次' },
            { level: 8, poisonStackDmg: 1.2, poisonDuration: 1.1, desc: '高层毒目标额外压制' }
        ]
    },
    bible: {
        name: '武装法典',
        upgrades: [
            { level: 2, desc: '所有书伤害提升', codexShotDmgScale: 0.78 },
            { level: 3, desc: '+1 本书', count: 3 },
            { level: 4, desc: '所有书化武器等级+1', codexShotInterval: 0.9 },
            { level: 5, desc: '+1 本书', count: 4 },
            { level: 6, desc: '同调效果增强', codexExtraShots: 1, codexBurstChance: 0.12, codexVolleyBudget: 2 },
            { level: 7, desc: '+1 本书', count: 5 },
            { level: 8, desc: '所有书获得额外副词条', count: 6, codexExtraShots: 2, codexBurstChance: 0.22, codexShotInterval: 0.76, codexVolleyBudget: 3 }
        ]
    },
    lightning: {
        name: '闪电',
        upgrades: [
            { level: 2, desc: '兼容隐藏升级', count: 2, chain: 7 },
            { level: 3, desc: '链距提升', chainRange: 230 },
            { level: 4, desc: '分叉', fork: true, branches: 4 },
            { level: 5, desc: '更强链击', chain: 10 },
            { level: 6, desc: '随机落雷', randomStrikes: true },
            { level: 7, desc: '连锁 14', chain: 14 },
            { level: 8, desc: '雷暴', thunderStorm: true, chain: 18, branches: 5 }
        ]
    },
    holy_water: {
        name: '圣水',
        upgrades: [
            { level: 2, desc: '初始半径 75', growFrom: 75 },
            { level: 3, desc: '持续时间 4.0s', duration: 4.0 },
            { level: 4, desc: '最终半径 180', growTo: 180 },
            { level: 5, desc: 'tick 伤害 9' },
            { level: 6, desc: '蔓延速度提升', growthDelay: 0.6 },
            { level: 7, desc: '初始半径 95', growFrom: 95 },
            { level: 8, desc: '最大时净化爆发', maxBurstDmgScale: 1.0, exposeMultiplier: 1.12, exposeDuration: 0.9 }
        ]
    },
    radiance: {
        name: '辉耀',
        upgrades: [
            { level: 2, desc: 'tick 伤害 6' },
            { level: 3, desc: 'tick 间隔 0.30s', tickRate: 0.3 },
            { level: 4, desc: '对燃烧目标增伤', burnSpread: true },
            { level: 5, desc: 'tick 伤害 7' },
            { level: 6, desc: '持续灼烧时间提升' },
            { level: 7, desc: '对精英额外伤害', execute: 0.08, executeThreshold: 0.2 },
            { level: 8, desc: '灼烧中的敌人死亡时小范围引燃', burstOnDeath: true }
        ]
    },
    garlic: {
        name: '大蒜',
        upgrades: [
            { level: 2, desc: '兼容旧逻辑', count: 2, rangeAdd: 100 },
            { level: 3, desc: '兼容旧逻辑', rangeAdd: 100 },
            { level: 4, desc: '兼容旧逻辑', count: 3, rangeAdd: 100 },
            { level: 5, desc: '兼容旧逻辑', rangeAdd: 100 },
            { level: 6, desc: '兼容旧逻辑', count: 4, rangeAdd: 100 },
            { level: 7, desc: '兼容旧逻辑', rangeAdd: 100 },
            { level: 8, desc: '兼容旧逻辑', count: 5, rangeAdd: 100 }
        ]
    }
};

function applyUpgrade(weapon, newLevel) {
    const table = WEAPON_UPGRADE_TABLE[weapon.baseKey];
    if (!table || !table.upgrades) return;
    const upgrade = table.upgrades.find(u => u.level === newLevel);
    if (!upgrade) return;

    if (!weapon.baseAttackCoeff && Number.isFinite(weapon.cfg.attackCoeff)) {
        weapon.baseAttackCoeff = weapon.cfg.attackCoeff;
    }
    if (!weapon.cfg.baseRange && Number.isFinite(weapon.cfg.range)) weapon.cfg.baseRange = weapon.cfg.range;
    if (!weapon.cfg.baseSpeed && Number.isFinite(weapon.cfg.speed)) weapon.cfg.baseSpeed = weapon.cfg.speed;
    if (!weapon.cfg.baseCd && Number.isFinite(weapon.cfg.cd)) weapon.cfg.baseCd = weapon.cfg.cd;
    if (!weapon.cfg.baseProjectileLife && Number.isFinite(weapon.cfg.projectileLife)) weapon.cfg.baseProjectileLife = weapon.cfg.projectileLife;
    if (!weapon.cfg.baseGrowFrom && Number.isFinite(weapon.cfg.growFrom)) weapon.cfg.baseGrowFrom = weapon.cfg.growFrom;
    if (!weapon.cfg.baseGrowTo && Number.isFinite(weapon.cfg.growTo)) weapon.cfg.baseGrowTo = weapon.cfg.growTo;

    if (upgrade.range !== undefined) weapon.cfg.range = (weapon.cfg.baseRange || weapon.cfg.range || 0) * upgrade.range;
    if (upgrade.rangeAdd !== undefined) weapon.cfg.range = (weapon.cfg.baseRange || weapon.cfg.range || 0) + upgrade.rangeAdd * (newLevel - 1);
    if (upgrade.speed !== undefined) weapon.cfg.speed = (weapon.cfg.baseSpeed || weapon.cfg.speed || 0) * upgrade.speed;
    if (upgrade.cd !== undefined) weapon.cfg.cd = (weapon.cfg.baseCd || weapon.cfg.cd || 0) * upgrade.cd;
    if (upgrade.projectileLife !== undefined) weapon.cfg.projectileLife = Math.max(0.2, (weapon.cfg.baseProjectileLife || weapon.cfg.projectileLife || 1) * upgrade.projectileLife);

    const copyKeys = [
        'count','angleOffset','arcAngle','pierce','bounce','burst','spread','knockback','lifeSteal','crit','critDmg','execute','executeThreshold',
        'scatterAngle','poisonStacksOnHit','poisonMaxStacks','poisonSpreadTargets','poisonSpreadMaxGen','poisonCloudOnDeath','poisonCloudDuration','poisonCloudStacks',
        'freezeChance','freezeDuration','slow','slowDuration','freezeBurst','freezeBurstMeterGain','chain','chainRange','orbitDuration','orbitRadius','orbitSpeed','duration','tickRate',
        'width','beamLife','tickCooldown','rotationSpeed','branches','burstRadius','hoverDamageScale','hoverPull','hoverNova','hoverNovaRadius','hoverNovaDmgScale','returnNova','returnNovaRadius',
        'centerDamageScale','centerDamageRadius','supplementaryWaves','afterImageDamageScale','returnDamage','explodeOnBounce','returnToPlayer','shatter','doubleRing','burstOnDeath','eternal','fork','randomStrikes','blenderMode',
        'waveShot','waveShotCount','waveShotDamageScale','waveShotSpeed','waveShotLife','waveShotPierce','splitCount','splitTimes','splitDamageScale','impactLightning','impactLightningChain','impactLightningDmgScale','impactStorm','impactStormDelay','impactStormDamageScale','impactField','impactFieldDuration','impactFieldTick','impactShockwaveRadius','impactCenterDamageScale','impactShockwaveDamageScale','growFrom','growTo','growthDelay','maxBurstDmgScale','exposeMultiplier','exposeDuration','codexWeaponized','codexShotInterval','codexShotDmgScale','codexExtraShots','codexBurstChance','codexVolleyBudget','outerRingBonus','elementBurst','elementBurstRadius','breathDuration','breathTick','coneAngle','coneSplitOffset','explodeRadius','staggerDelay','dualAngleOffset','supplementaryWeakMissile','burnSpread'
    ];
    for (const key of copyKeys) {
        if (upgrade[key] !== undefined) weapon.cfg[key] = upgrade[key];
    }

    if (upgrade.homingStrength !== undefined) weapon.cfg.homingStrength = upgrade.homingStrength;
    if (upgrade.homingDelay !== undefined) weapon.cfg.homingDelay = upgrade.homingDelay;
    if (upgrade.homingRange !== undefined) weapon.cfg.homingRange = Math.round((weapon.cfg.homingRange || weapon.cfg.range || 0) * upgrade.homingRange);
    if (upgrade.poisonDmg !== undefined) {
        const attackBase = window.WEAPON_DAMAGE_MODEL?.baseAttackPower || 24;
        weapon.cfg.poisonDmgCoeff = Math.round((upgrade.poisonDmg / attackBase) * 1000) / 1000;
        weapon.cfg.poisonDmg = upgrade.poisonDmg;
    }
    if (upgrade.poisonStackDmg !== undefined) weapon.cfg.poisonStackDmg = Math.round((weapon.cfg.poisonStackDmg || 0) * upgrade.poisonStackDmg * 100) / 100;
    if (upgrade.poisonDuration !== undefined) weapon.cfg.poisonDuration = Math.max(1, Math.round((weapon.cfg.poisonDuration || 3) * upgrade.poisonDuration * 10) / 10);
    if (upgrade.poisonSpreadRange !== undefined) weapon.cfg.poisonSpreadRange = Math.round((weapon.cfg.poisonSpreadRange || 200) * upgrade.poisonSpreadRange);
    if (upgrade.freezeMeterGain !== undefined) weapon.cfg.freezeMeterGain = Math.round((weapon.cfg.freezeMeterGain || 0.35) * upgrade.freezeMeterGain * 100) / 100;
    if (upgrade.freezeBurstRadius !== undefined) weapon.cfg.freezeBurstRadius = Math.round((weapon.cfg.freezeBurstRadius || 100) * upgrade.freezeBurstRadius);
    if (upgrade.searchRadius !== undefined) weapon.cfg.searchRadius = Math.round((weapon.cfg.searchRadius || weapon.cfg.range || 0) * upgrade.searchRadius);
    if (upgrade.returnSpeed !== undefined) weapon.cfg.returnSpeed = Math.round((weapon.cfg.returnSpeed || weapon.cfg.speed || 0) * upgrade.returnSpeed);
    if (upgrade.passThroughDistance !== undefined) weapon.cfg.passThroughDistance = Math.round((weapon.cfg.passThroughDistance || 72) * upgrade.passThroughDistance);
    if (upgrade.hitCooldown !== undefined) weapon.cfg.hitCooldown = Math.max(0.08, (weapon.cfg.hitCooldown || 0.26) * upgrade.hitCooldown);
    if (upgrade.hoverDuration !== undefined) weapon.cfg.hoverDuration = Math.max(0.08, (weapon.cfg.hoverDuration || 0.3) * upgrade.hoverDuration);
    if (upgrade.hoverTick !== undefined) weapon.cfg.hoverTick = Math.max(0.08, (weapon.cfg.hoverTick || 0.3) * upgrade.hoverTick);
    if (upgrade.hoverRadius !== undefined) weapon.cfg.hoverRadius = Math.round((weapon.cfg.hoverRadius || 120) * upgrade.hoverRadius);
    if (upgrade.burnFieldDuration !== undefined) weapon.cfg.burnFieldDuration = Math.max(0.2, (weapon.cfg.burnFieldDuration || 1) * upgrade.burnFieldDuration);
    if (upgrade.burnFieldRange !== undefined) weapon.cfg.burnFieldRange = Math.round((weapon.cfg.burnFieldRange || 90) * upgrade.burnFieldRange);
    if (upgrade.burnFieldDmg !== undefined) weapon.cfg.burnFieldDmg = Math.round((weapon.cfg.burnFieldDmg || 4) * upgrade.burnFieldDmg * 100) / 100;
    if (upgrade.impactRadius !== undefined) weapon.cfg.impactRadius = upgrade.impactRadius;
    if (upgrade.impactLightningRange !== undefined) weapon.cfg.impactLightningRange = upgrade.impactLightningRange;
    if (upgrade.splitRadius !== undefined) weapon.cfg.splitRadius = upgrade.splitRadius;
    if (upgrade.growFrom !== undefined) weapon.cfg.growFrom = upgrade.growFrom;
    if (upgrade.growTo !== undefined) weapon.cfg.growTo = upgrade.growTo;

    if (!weapon.upgradeHistory) weapon.upgradeHistory = [];
    weapon.upgradeHistory.push({ level: newLevel, desc: upgrade.desc, type: getUpgradeType(upgrade) });
}

function getUpgradeType(upgrade) {
    if (upgrade.count) return '数量';
    if (upgrade.cd || upgrade.tickRate) return '节奏';
    if (upgrade.waveShot || upgrade.splitCount || upgrade.impactLightning || upgrade.codexWeaponized || upgrade.elementBurst) return '机制';
    return '数值';
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WEAPON_UPGRADE_TABLE, applyUpgrade };
}
