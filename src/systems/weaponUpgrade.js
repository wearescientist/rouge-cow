/**
 * 武器升级系统 - 武器全面更新版
 */

const WEAPON_UPGRADE_TABLE = {
    whip: {
        name: '圣剑',
        upgrades: [
            { level: 2, desc: '圣剑伤害与斩程提升', dmg: 1.08, range: 1.08, orbitRadius: 216, orbitHitPadding: 216 },
            { level: 3, desc: '圣剑数量 1→2', count: 2 },
            { level: 4, desc: '圣剑伤害继续提升，斩程外扩', dmg: 1.08, range: 1.18, orbitRadius: 236, orbitHitPadding: 236 },
            { level: 5, desc: '圣剑伤害再次提升', dmg: 1.1 },
            { level: 6, desc: '圣剑数量 2→3', count: 3 },
            { level: 7, desc: '圣剑伤害继续提升，斩程再次外扩', dmg: 1.12, range: 1.32, orbitRadius: 264, orbitHitPadding: 264 },
            { level: 8, desc: '圣剑最终伤害提升，外圈成型', dmg: 1.14, range: 1.42, orbitRadius: 284, orbitHitPadding: 284 }
        ]
    },
    scythe: {
        name: '镰刀',
        upgrades: [
            { level: 2, desc: '伤害与外圈切割同步加强', dmg: 1.16, outerRingBonus: 0.28 },
            { level: 3, desc: '挥砍角度扩到 120°，节奏更顺手', arcAngle: 120, cd: 0.92 },
            { level: 4, desc: '攻击距离扩到 270', range: 1.35 },
            { level: 5, desc: '挥砍频率明显提升', cd: 0.84, dmg: 1.1 },
            { level: 6, desc: '挥砍角度扩到 165°，外圈斩杀更痛', arcAngle: 165, outerRingBonus: 0.46 },
            { level: 7, desc: '攻击距离扩到 340', range: 1.7 },
            { level: 8, desc: '外圈增伤与节奏拉满', outerRingBonus: 0.82, cd: 0.74 }
        ]
    },
    wand: {
        name: '魔杖',
        upgrades: [
            { level: 2, dmg: 1.1, cd: 0.96, desc: '冷却降低，发射更频繁' },
            { level: 3, homingRange: 1.28, homingStrength: 1.24, desc: '追踪范围提升，收束更稳定' },
            { level: 4, dmg: 1.08, speed: 1.12, desc: '飞弹速度提升，命中更利落' },
            { level: 5, count: 4, desc: '飞弹数量 4→5' },
            { level: 6, dmg: 1.06, cd: 0.94, desc: '冷却再次下降' },
            { level: 7, homingRange: 1.2, homingStrength: 1.35, scatterAngle: 0.85, desc: '追踪更远，收束更快' },
            { level: 8, dmg: 1.08, speed: 1.06, projectileLife: 0.94, desc: '飞弹更硬朗，命中更集中' }
        ]
    },
    knife: {
        name: '飞刀',
        upgrades: [
            { level: 2, dmg: 1.16, speed: 1.16, searchRadius: 1.08, desc: '伤害提升，飞行速度更顺手' },
            { level: 3, count: 2, dmg: 1.08, speed: 1.12, searchRadius: 1.08, desc: '双刀常驻，索敌更远' },
            { level: 4, dmg: 1.06, speed: 1.06, returnSpeed: 1.06, desc: '伤害提升，回收更快' },
            { level: 5, dmg: 1.06, searchRadius: 1.04, passThroughDistance: 1.06, desc: '伤害与追猎半径同步提升' },
            { level: 6, count: 3, dmg: 1.03, speed: 1.06, hitCooldown: 0.98, desc: '三刀成型，往返节奏更紧凑' },
            { level: 7, dmg: 1.06, returnSpeed: 1.08, passThroughDistance: 1.04, desc: '穿透更深，回收更快' },
            { level: 8, dmg: 1.08, searchRadius: 1.06, hitCooldown: 0.96, desc: '最终成型：追猎范围扩大，准备进化' }
        ]
    },
    axe: {
        name: '雷神战斧',
        upgrades: [
            { level: 2, desc: '飞行与回收更快，感电范围扩大', speed: 1.08, returnSpeed: 1.12, range: 1.02, impactLightningRange: 300, impactLightningAuraRange: 170 },
            { level: 3, desc: '雷链数量 4，单次链击更痛', impactLightningChain: 4, impactLightningRange: 330, impactLightningDmgScale: 0.68 },
            { level: 4, desc: '落地震波更强，冲击不缩水', impactCenterDamageScale: 0.94, impactShockwaveDamageScale: 0.62, impactShockwaveRadius: 132 },
            { level: 5, desc: '飞行速度再提，链电覆盖扩大', speed: 1.12, returnSpeed: 1.16, impactLightningRange: 360, impactLightningChain: 5, impactLightningAuraRange: 185 },
            { level: 6, desc: '雷链数量 6，雷击伤害提升', impactLightningChain: 6, impactLightningRange: 430, impactLightningDmgScale: 0.92 },
            { level: 7, desc: '感电场和爆点范围扩大', impactLightningDmgScale: 1.0, impactRadius: 114, impactShockwaveRadius: 172, impactLightningAuraRange: 216, impactLightningAuraDmgScale: 0.28 },
            { level: 8, desc: '落地后追加雷暴并留下雷区', impactStorm: true, impactStormDelay: 0.14, impactStormDamageScale: 0.86, impactField: true, impactFieldRadius: 148, impactFieldDuration: 2.1, impactFieldTick: 0.14, impactLightningChain: 9, impactLightningRange: 560 }
        ]
    },
    cross: {
        name: '十字架',
        upgrades: [
            { level: 2, desc: '基础伤害提升', dmg: 1.16, speed: 1.1 },
            { level: 3, desc: '分裂数量 3', splitCount: 3, splitDamageScale: 1.06 },
            { level: 4, desc: '分裂次数 2', splitTimes: 2, splitRadius: 300, splitHomingStrength: 1.28, splitHomingRange: 380 },
            { level: 5, desc: '基础伤害再提', dmg: 1.2 },
            { level: 6, desc: '分裂半径 320', splitRadius: 340, splitHomingStrength: 1.42, splitHomingRange: 460 },
            { level: 7, desc: '数量 2', count: 2 },
            { level: 8, desc: '子十字命中触发小圣光爆点', returnNova: true, returnNovaRadius: 134, splitDamageScale: 1.08 }
        ]
    },
    fireball: {
        name: '双头龙吐息',
        upgrades: [
            { level: 2, desc: '轮替更快，弹道更远', dmg: 1.18, speed: 1.08, range: 1.08 },
            { level: 3, desc: '火球残留更久', dmg: 1.12, burnFieldDuration: 1.25, burnFieldRange: 1.12 },
            { level: 4, desc: '冰锥减速与冻结增强', dmg: 1.1, slow: 0.28, freezeMeterGain: 1.18 },
            { level: 5, desc: '一轮追加一发，冰火交替连吐', count: 2 },
            { level: 6, desc: '火爆更大，冰锥贯穿更强', explodeRadius: 96, pierce: 3 },
            { level: 7, desc: '火场更痛，冰控更稳', burnFieldDmg: 1.35, slowDuration: 1.12, freezeDuration: 1.18 },
            { level: 8, desc: '成型：更快的冰火轮替', speed: 1.12, projectileLife: 1.12, explodeRadius: 112, burnFieldDuration: 1.3, burnFieldRange: 1.12, slow: 0.34 }
        ]
    },
    shuriken: {
        name: '手里剑',
        upgrades: [
            { level: 2, dmg: 1.2, speed: 1.18, desc: '伤害提升，飞行更快' },
            { level: 3, dmg: 1.16, range: 1.12, spread: 32, desc: '射程提升，扇形更顺手' },
            { level: 4, dmg: 1.12, supplementaryWaves: [{ delay: 0.09, count: 2, spread: 16, damageScale: 0.9 }], desc: '解锁二段补投（2枚）' },
            { level: 5, count: 4, dmg: 1.1, desc: '主波数量 3→4' },
            { level: 6, supplementaryWaves: [{ delay: 0.08, count: 3, spread: 16, damageScale: 0.9 }], desc: '补投数量 2→3' },
            { level: 7, afterImageDamageScale: 0.35, desc: '命中触发短残影切线' },
            { level: 8, cd: 0.85, speed: 1.2, desc: '最终形态：更快更短冷却' }
        ]
    },
    icicle: {
        name: '冰锥',
        upgrades: [
            { level: 2, desc: '兼容隐藏升级', freezeMeterGain: 1.12 },
            { level: 3, desc: '贯穿 3', pierce: 3 },
            { level: 4, desc: '冻结爆裂', freezeBurst: true, freezeBurstRadius: 100 },
            { level: 5, desc: '爆裂范围更大', freezeBurstRadius: 1.2 },
            { level: 6, desc: '冻结更稳', freezeDuration: 1.2 },
            { level: 7, desc: '贯穿 4', pierce: 4 },
            { level: 8, desc: '爆裂附带冻结积累', freezeBurstMeterGain: 0.35 }
        ]
    },
    laser: {
        name: '激光',
        upgrades: [
            { level: 2, dmg: 1.12, width: 14, beamLife: 0.2, desc: '伤害+18%，束宽14，持续0.22秒' },
            { level: 3, dmg: 1.16, width: 16, beamLife: 0.22, desc: '伤害+24%，束宽16，持续0.24秒' },
            { level: 4, dmg: 1.1, width: 18, tickCooldown: 0.135, desc: '束宽18，命中频率提升' },
            { level: 5, dmg: 1.16, width: 20, beamLife: 0.24, desc: '伤害+26%，束宽20，持续0.28秒' },
            { level: 6, dmg: 1.22, tickCooldown: 0.125, desc: '伤害+32%，持续伤害更密集' },
            { level: 7, dmg: 1.28, width: 22, beamLife: 0.28, desc: '束宽23，持续0.32秒，压制更强' },
            { level: 8, dmg: 1.4, width: 24, beamLife: 0.32, tickCooldown: 0.115, desc: '最终束宽26，压制力保留但不再离谱' }
        ]
    },
    poison_dart: {
        name: '毒镖',
        upgrades: [
            { level: 2, dmg: 1.22, poisonDuration: 1.2, poisonStackDmg: 1.18, desc: '毒持续更久，单层更痛' },
            { level: 3, dmg: 1.18, poisonStacksOnHit: 2, desc: '命中改为 2 层毒' },
            { level: 4, dmg: 1.16, poisonSpreadTargets: 3, desc: '传播目标 2→3' },
            { level: 5, dmg: 1.14, poisonMaxStacks: 7, desc: '毒层上限 5→7' },
            { level: 6, poisonCloudOnDeath: true, poisonCloudDuration: 1.8, poisonCloudStacks: 1, desc: '死亡留下短命毒雾' },
            { level: 7, poisonSpreadMaxGen: 2, poisonStackDmg: 1.14, desc: '允许二代传播一次' },
            { level: 8, poisonStackDmg: 1.28, poisonDuration: 1.16, desc: '高层毒目标额外压制' }
        ]
    },
    bible: {
        name: '武装法典',
        upgrades: [
            { level: 2, desc: '所有书伤害提升', dmg: 1.12, codexShotDmgScale: 1.24 },
            { level: 3, desc: '+1 本书', count: 3 },
            { level: 4, desc: '书页齐射更频繁，索敌接近全屏', codexShotInterval: 0.62, codexTargetRange: 3200, range: 1.12 },
            { level: 5, desc: '+1 本书并提升单书伤害', count: 4, dmg: 1.6 },
            { level: 6, desc: '同调效果增强', codexExtraShots: 4, codexBurstChance: 0.38, codexVolleyBudget: 7, codexShotDmgScale: 2.08, codexTargetRange: 3400 },
            { level: 7, desc: '+1 本书并强化齐射伤害', count: 5, dmg: 1.78 },
            { level: 8, desc: '所有书获得额外副词条', count: 6, dmg: 2.16, codexExtraShots: 5, codexBurstChance: 0.58, codexShotInterval: 0.3, codexShotDmgScale: 2.34, codexVolleyBudget: 9, codexTargetRange: 3600, duration: 16.4 }
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
            { level: 2, desc: '初始半径 78', dmg: 1.12, growFrom: 78 },
            { level: 3, desc: '持续时间 4.1s', dmg: 1.12, duration: 4.1 },
            { level: 4, desc: '最终半径 184', dmg: 1.12, growTo: 184 },
            { level: 5, desc: '伤害继续提升', dmg: 1.14 },
            { level: 6, desc: '蔓延速度提升', dmg: 1.22, growthDelay: 0.54 },
            { level: 7, desc: '初始半径 98', dmg: 1.24, growFrom: 98 },
            { level: 8, desc: '最大时净化爆发', dmg: 1.3, maxBurstDmgScale: 1.18, exposeMultiplier: 1.22, exposeDuration: 1.1 }
        ]
    },
    radiance: {
        name: '辉耀',
        upgrades: [
            { level: 2, desc: 'tick 伤害提升', dmg: 1.12 },
            { level: 3, desc: 'tick 间隔 0.30s', dmg: 1.12, tickRate: 0.3 },
            { level: 4, desc: '对燃烧目标增伤', dmg: 1.12, burnSpread: true },
            { level: 5, desc: 'tick 伤害继续提升', dmg: 1.24 },
            { level: 6, desc: '持续灼烧时间提升', dmg: 1.24 },
            { level: 7, desc: '对精英额外伤害', dmg: 1.28, execute: 0.1, executeThreshold: 0.22 },
            { level: 8, desc: '燃烧中的敌人死亡时小范围引燃', dmg: 1.34, burstOnDeath: true }
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
    const upgrade = table.upgrades.find((u) => u.level === newLevel);
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
    if (upgrade.projectileLife !== undefined) {
        weapon.cfg.projectileLife = Math.max(0.2, (weapon.cfg.baseProjectileLife || weapon.cfg.projectileLife || 1) * upgrade.projectileLife);
    }
    if (upgrade.dmg !== undefined) {
        weapon.cfg.dmg = Math.round((weapon.cfg.dmg || 0) * upgrade.dmg * 100) / 100;
    }

    const copyKeys = [
        'count', 'angleOffset', 'arcAngle', 'pierce', 'bounce', 'burst', 'spread', 'knockback', 'lifeSteal', 'crit', 'critDmg', 'execute', 'executeThreshold',
        'scatterAngle', 'poisonStacksOnHit', 'poisonMaxStacks', 'poisonSpreadTargets', 'poisonSpreadMaxGen', 'poisonCloudOnDeath', 'poisonCloudDuration', 'poisonCloudStacks',
        'freezeChance', 'freezeDuration', 'slow', 'slowDuration', 'freezeBurst', 'freezeBurstMeterGain', 'chain', 'chainRange', 'orbitDuration', 'orbitRadius', 'orbitSpeed', 'duration', 'tickRate',
        'width', 'beamLife', 'tickCooldown', 'rotationSpeed', 'orbitalDrawSize', 'orbitHitPadding', 'orbitVisualSpinSpeed', 'branches', 'burstRadius', 'hoverDamageScale', 'hoverPull', 'hoverNova', 'hoverNovaRadius', 'hoverNovaDmgScale', 'returnNova', 'returnNovaRadius',
        'centerDamageScale', 'centerDamageRadius', 'supplementaryWaves', 'afterImageDamageScale', 'returnDamage', 'explodeOnBounce', 'returnToPlayer', 'shatter', 'doubleRing', 'burstOnDeath', 'eternal', 'fork', 'randomStrikes', 'blenderMode',
        'waveShot', 'waveShotCount', 'waveShotDamageScale', 'waveShotSpeed', 'waveShotLife', 'waveShotPierce', 'splitCount', 'splitTimes', 'splitDamageScale',
        'impactLightning', 'impactLightningChain', 'impactLightningDmgScale', 'impactLightningAuraRange', 'impactLightningAuraDmgScale',
        'impactStorm', 'impactStormDelay', 'impactStormDamageScale', 'impactField', 'impactFieldRadius', 'impactFieldDuration', 'impactFieldTick',
        'impactShockwaveRadius', 'impactCenterDamageScale', 'impactShockwaveDamageScale',
        'growFrom', 'growTo', 'growthDelay', 'maxBurstDmgScale', 'exposeMultiplier', 'exposeDuration',
        'codexWeaponized', 'codexShotInterval', 'codexShotDmgScale', 'codexExtraShots', 'codexBurstChance', 'codexVolleyBudget', 'codexTargetRange',
        'outerRingBonus', 'elementBurst', 'elementBurstRadius', 'breathDuration', 'breathTick', 'coneAngle', 'coneSplitOffset', 'explodeRadius', 'staggerDelay', 'dualAngleOffset', 'supplementaryWeakMissile', 'burnSpread'
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

