#!/usr/bin/env node
/**
 * AI Weapon Strength Test
 * 基于当前武器模块、升级表和进化表进行自动强度评估。
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { applyUpgrade } = require('../src/systems/weaponUpgrade.js');

const ITEM_BUILD_PRESETS = [
    { key: 'none', name: '裸装', items: [] },
    { key: 'soy_milk', name: '豆浆', items: [{ id: 'soy_milk', effect: 'soyMilk', value: 1 }] },
    { key: 'soy_godhead', name: '豆浆+神性', items: [{ id: 'soy_milk', effect: 'soyMilk', value: 1 }, { id: 'godhead', effect: 'godhead', value: 1 }] },
    { key: 'soy_tech2', name: '豆浆+科技2', items: [{ id: 'soy_milk', effect: 'soyMilk', value: 1 }, { id: 'tech2', effect: 'tech2', value: 1 }] },
    { key: 'sacred_heart', name: '圣心', items: [{ id: 'sacred_heart', effect: 'sacredHeart', value: 1 }] },
    { key: 'quad_soy', name: '四向+豆浆', items: [{ id: 'quad', effect: 'quad', value: 1 }, { id: 'soy_milk', effect: 'soyMilk', value: 1 }] },
    { key: 'collector_stack', name: '收藏家套组', items: [{ id: 'collector', effect: 'collector', value: 1 }, { id: 'crit_add', effect: 'critAdd', value: 0.12 }] }
];

const WEAPON_IDENTITY_PROFILES = {
    whip: {
        role: '近战续航扇斩',
        mustWin: { bossScore: 0.55, superRatio: 0.7, growthRatio: 0.45 },
        allowedWeak: ['crowdScore'],
        summary: '近身扇斩和吸血续战应当突出，远程覆盖可以弱'
    },
    scythe: {
        role: '处决收割',
        mustWin: { bossScore: 0.5, growthRatio: 0.55, superRatio: 0.65 },
        allowedWeak: ['crowdScore'],
        summary: '残血处决和中后期收割要强，清散怪可以不是最优'
    },
    wand: {
        role: '追踪单体',
        mustWin: { bossScore: 0.7, growthRatio: 0.7, superRatio: 0.6 },
        allowedWeak: ['crowdScore'],
        summary: '自动追踪和稳定点杀要强，群爆可以普通'
    },
    knife: {
        role: '高速单点压制',
        mustWin: { bossScore: 0.65, growthRatio: 0.65, superRatio: 0.6 },
        allowedWeak: ['crowdScore'],
        summary: '高速连射和单体压制要明显强于大范围武器'
    },
    axe: {
        role: '双段重击穿线',
        mustWin: { growthRatio: 0.6, superRatio: 0.55, crowdScore: 0.45 },
        allowedWeak: ['bossScore'],
        summary: '穿线和往返双段命中要强，纯站桩打王可以稍弱'
    },
    cross: {
        role: '神圣弹跳爆发',
        mustWin: { crowdScore: 0.75, superRatio: 0.8, growthRatio: 0.55 },
        allowedWeak: ['baseScore'],
        summary: '中后期弹跳清屏和超武爆发要非常强'
    },
    fireball: {
        role: '爆炸清群',
        mustWin: { crowdScore: 0.65, growthRatio: 0.55, superRatio: 0.65 },
        allowedWeak: ['bossScore'],
        summary: '大爆炸和群怪清场必须强，单点弱一点合理'
    },
    shuriken: {
        role: '散射弹幕',
        mustWin: { crowdScore: 0.75, growthRatio: 0.7, superRatio: 0.6 },
        allowedWeak: ['bossScore'],
        summary: '大范围散射清群应是主胜场'
    },
    icicle: {
        role: '控制压制',
        mustWin: { crowdScore: 0.55, growthRatio: 0.55, baseScore: 0.55 },
        allowedWeak: ['superRatio'],
        summary: '基础控场和稳定压制要强，超武爆发不必最夸张'
    },
    laser: {
        role: '持续贯穿压制',
        mustWin: { crowdScore: 0.8, bossScore: 0.5, growthRatio: 0.55 },
        allowedWeak: ['baseScore'],
        summary: '持续穿线和正面压制必须强，转火弱一点合理'
    },
    poison_dart: {
        role: '毒伤传播',
        mustWin: { superRatio: 0.7, growthRatio: 0.55, crowdScore: 0.5 },
        allowedWeak: ['baseScore'],
        summary: '中后期毒爆和传播蔓延要强，前期低爆发合理'
    },
    bible: {
        role: '贴身压场圣环',
        mustWin: { crowdScore: 0.5, superRatio: 0.75, growthRatio: 0.55 },
        allowedWeak: ['bossScore'],
        summary: '贴身压场和超武圣环压制必须强，Boss 点杀弱是合理代价'
    },
    lightning: {
        role: '链雷打散',
        mustWin: { crowdScore: 0.6, bossScore: 0.6, growthRatio: 0.65 },
        allowedWeak: ['superRatio'],
        summary: '链雷打散和多目标处理必须强'
    },
    holy_water: {
        role: '区域封锁',
        mustWin: { crowdScore: 0.55, growthRatio: 0.6, superRatio: 0.65 },
        allowedWeak: ['bossScore'],
        summary: '区域覆盖和地形封锁必须强，追移动 Boss 弱一点合理'
    },
    radiance: {
        role: '贴脸灼烧领域',
        mustWin: { baseScore: 0.6, crowdScore: 0.55, growthRatio: 0.45 },
        allowedWeak: ['bossScore'],
        summary: '近身灼烧和推进压制要强，远程弱合理'
    }
};

function loadWeaponData() {
    const filePath = path.join(__dirname, '..', 'src', 'systems', 'passives', 'WeaponAndPassiveManager.js');
    const source = fs.readFileSync(filePath, 'utf8');
    const wrapped = `${source}\nmodule.exports = { WEAPONS, PASSIVES, WEAPON_EVOLUTIONS, SUPER_WEAPONS };`;
    const sandbox = {
        module: { exports: {} },
        exports: {},
        console,
        require,
        Math
    };
    vm.runInNewContext(wrapped, sandbox, { filename: filePath });
    return sandbox.module.exports;
}

function loadItemManagerBundle() {
    const filePath = path.join(__dirname, '..', 'src', 'systems', 'items', 'ItemManager.js');
    const source = fs.readFileSync(filePath, 'utf8');
    const wrapped = `${source}\nmodule.exports = { ItemManager };`;
    const sandbox = {
        module: { exports: {} },
        exports: {},
        console,
        require,
        Math,
        ITEMS: {},
        RARITY_COLORS: {},
        window: { game: { currentFloor: 5 } }
    };
    vm.runInNewContext(wrapped, sandbox, { filename: filePath });
    return { ItemManager: sandbox.module.exports.ItemManager, sandbox };
}

function parseArgs(argv) {
    const options = {
        runs: 80,
        duration: 45,
        outputDir: path.join(__dirname, '..', 'reports')
    };
    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        if (arg === '--runs') options.runs = Math.max(10, Number(argv[++i]) || options.runs);
        if (arg === '--duration') options.duration = Math.max(10, Number(argv[++i]) || options.duration);
    }
    return options;
}

function clone(value) {
    return JSON.parse(JSON.stringify(value));
}

function buildItemStats(bundle, preset) {
    const itemMap = {};
    for (const item of preset.items) {
        itemMap[item.id] = {
            id: item.id,
            name: item.id,
            icon: '•',
            effect: item.effect,
            value: item.value,
            desc: item.effect
        };
    }
    bundle.sandbox.ITEMS = itemMap;
    bundle.sandbox.window = { game: { currentFloor: 5 } };
    const player = { maxHp: 6, hp: 6, samsonCount: 0 };
    const manager = new bundle.ItemManager(player);
    for (const id of Object.keys(itemMap)) {
        manager.add(id);
    }
    return manager.getStats();
}

function buildWeaponConfig(baseKey, level, tables) {
    const base = clone(tables.WEAPONS[baseKey]);
    const weapon = {
        baseKey,
        level: 1,
        cfg: base
    };
    for (let currentLevel = 2; currentLevel <= level; currentLevel++) {
        applyUpgrade(weapon, currentLevel);
        weapon.level = currentLevel;
    }
    return weapon.cfg;
}

function buildSuperConfig(baseKey, tables) {
    const evo = tables.WEAPON_EVOLUTIONS[baseKey];
    if (!evo) return null;
    return clone(tables.SUPER_WEAPONS[evo.result] || null);
}

function applyBuildToConfig(cfg, itemStats, weaponKey) {
    const next = clone(cfg);
    let fireRate = Math.max(0.25, itemStats.fireRate || 1);
    if (next.type === 'aura') {
        fireRate = 1;
    } else if (next.type === 'area') {
        fireRate = 1 + (fireRate - 1) * 0.28;
        if (weaponKey === 'holy_water') fireRate = Math.min(fireRate, 1.5);
    } else if (next.type === 'orbit') {
        fireRate = 1 + (fireRate - 1) * 0.45;
    }
    next.cd = Math.max(0.04, (next.cd || 1) / fireRate);
    next.dmg = Math.max(1, Math.floor((next.dmg || 1) * (itemStats.dmg || 1)));
    if (next.type === 'proj') {
        next.count = Math.max(1, Math.floor((next.count || 1) * (itemStats.projCount || 1)));
    }
    next.pierce = (next.pierce || 0) + (itemStats.pierce || 0);
    next.crit = Math.min(1, (next.crit || 0) + (itemStats.crit || 0));
    next.critDmg = Math.max(next.critDmg || 1.5, itemStats.critDmg || 1.5);
    next.lifeSteal = (next.lifeSteal || 0) + (itemStats.lifeSteal || 0);
    if (itemStats.homing) next.homingStrength = Math.max(next.homingStrength || 0, itemStats.homing);
    if (itemStats.bounce) next.bounce = (next.bounce || 0) + itemStats.bounce;
    if (itemStats.projSize) next.width = Math.max(next.width || 0, Math.round((next.width || 12) * itemStats.projSize));
    if (itemStats.fireDmg) next.fireDmg = (next.fireDmg || 0) + itemStats.fireDmg;
    if (itemStats.thunderDmg) next.thunderDmg = (next.thunderDmg || 0) + itemStats.thunderDmg;
    if (itemStats.poisonDmg) next.poisonDmg = (next.poisonDmg || 0) + itemStats.poisonDmg;
    if (itemStats.quad && (next.type === 'proj' || next.type === 'instant')) {
        next.count = Math.max(next.count || 1, Math.floor((next.count || 1) * 1.8));
    }
    if (weaponKey === 'radiance' && itemStats.soyMilk) {
        next.cd = Math.max(0.18, next.cd || 0.2);
    }
    if (weaponKey === 'holy_water' && itemStats.soyMilk) {
        next.cd = Math.max(0.4, next.cd || 0.5);
    }
    return next;
}

function makeScenarios(duration) {
    return [
        {
            key: 'crowd',
            label: '群怪',
            duration,
            enemyCount: 70,
            enemyHp: 70,
            radius: 300,
            weight: 0.45
        },
        {
            key: 'elite',
            label: '精英',
            duration,
            enemyCount: 10,
            enemyHp: 260,
            radius: 380,
            weight: 0.3
        },
        {
            key: 'boss',
            label: 'Boss',
            duration,
            enemyCount: 1,
            enemyHp: 5200,
            radius: 420,
            weight: 0.25
        }
    ];
}

function getBaseTargets(cfg, scenario) {
    const range = cfg.range || 180;
    const radiusRatio = Math.max(0.18, Math.min(1.85, range / Math.max(120, scenario.radius)));
    let targets = 1;
    switch (cfg.type) {
        case 'melee':
            targets = 1.6 + radiusRatio * 2.4 + ((cfg.arcAngle || 90) / 180);
            break;
        case 'proj':
            targets = 1.1 + radiusRatio * 1.6;
            break;
        case 'orbit':
            targets = 2.2 + radiusRatio * 2.3;
            break;
        case 'instant':
            targets = 1.3 + radiusRatio * 1.8;
            break;
        case 'area':
            targets = 2.4 + radiusRatio * 3.4;
            break;
        case 'aura':
            targets = 2.8 + radiusRatio * 3.8;
            break;
        case 'laser':
            targets = 1.4 + radiusRatio * 4.8;
            break;
        default:
            targets = 1;
            break;
    }
    return Math.min(scenario.enemyCount, targets);
}

function calculateHitRate(cfg, scenario) {
    let hitRate = 0.9;
    if (cfg.type === 'laser') hitRate = scenario.key === 'boss' ? 0.98 : 0.95;
    if (cfg.subtype === 'homing' || cfg.subtype === 'poison_homing') hitRate += 0.05;
    if (cfg.subtype === 'rapid') hitRate -= 0.04;
    if (cfg.subtype === 'fan') hitRate += scenario.key === 'crowd' ? 0.05 : -0.03;
    if (cfg.homingStrength) hitRate += Math.min(0.06, cfg.homingStrength * 0.02);
    return Math.max(0.45, Math.min(0.99, hitRate));
}

function calculateAttackImpact(cfg, scenario) {
    const count = Math.max(1, cfg.count || 1);
    const baseTargets = getBaseTargets(cfg, scenario);
    const hitRate = calculateHitRate(cfg, scenario);
    let damagePerHit = cfg.dmg || 1;
    let targetCount = Math.max(1, baseTargets * count);

    if (cfg.crit) damagePerHit *= 1 + (cfg.crit * ((cfg.critDmg || 1.5) - 1));
    if (cfg.execute) damagePerHit *= 1 + 0.25;
    if (cfg.lifeSteal) damagePerHit *= 1 + Math.min(0.08, cfg.lifeSteal * 0.15);
    if (cfg.poisonDmg) damagePerHit += cfg.poisonDmg * 0.55;
    if (cfg.freezeChance) damagePerHit *= 1 + cfg.freezeChance * 0.12;
    if (cfg.divineNova) damagePerHit *= 1.18;
    if (cfg.plagueBurst) damagePerHit *= 1.2;
    if (cfg.burnSpread) damagePerHit *= 1.15;
    if (cfg.nova) damagePerHit *= 1.12;
    if (cfg.secondaryExplosion) damagePerHit *= 1.18;
    if (cfg.returnDamage) damagePerHit *= 1.1;
    if (cfg.returnToPlayer) damagePerHit *= 1.07;
    if (cfg.blizzardAOE) damagePerHit *= 1.14;
    if (cfg.burstOnDeath) damagePerHit *= scenario.key === 'crowd' ? 1.2 : 1.05;
    if (cfg.randomStrikes) damagePerHit *= 1.14;
    if (cfg.fork) damagePerHit *= 1 + ((cfg.branches || 2) * 0.08);

    if (cfg.type === 'proj') {
        targetCount += Math.min(scenario.enemyCount - 1, cfg.pierce || 0) * 0.42;
        targetCount += Math.min(scenario.enemyCount - 1, cfg.bounce || 0) * 0.28;
        if (cfg.split) targetCount += (cfg.splitConfig?.count || cfg.split || 2) * 0.5;
        if (cfg.subtype === 'explode') targetCount += scenario.key === 'crowd' ? 2.2 : 0.8;
        if (cfg.subtype === 'boomerang') targetCount += 0.9;
    }

    if (cfg.type === 'instant') {
        targetCount += Math.min(scenario.enemyCount - 1, cfg.chain || 0) * 0.7;
    }

    if (cfg.type === 'orbit' || cfg.type === 'aura' || cfg.type === 'area') {
        const duration = cfg.duration || 5;
        const tickRate = cfg.tickRate || 0.3;
        const ticks = Math.max(1, duration / tickRate);
        targetCount *= Math.min(3.6, 1 + ticks * 0.08);
    }

    if (cfg.type === 'laser') {
        const beamLife = cfg.beamLife || 0.22;
        const tickCooldown = cfg.tickCooldown || 0.15;
        const beamTicks = Math.max(1, beamLife / tickCooldown);
        const widthFactor = Math.max(1, (cfg.width || 12) / 14);
        targetCount *= Math.min(5.5, 0.65 + beamTicks * 0.7 + widthFactor * 0.35);
        if (cfg.homingCurve) targetCount *= scenario.key === 'crowd' ? 1.15 : 1.05;
    }

    targetCount = Math.max(1, Math.min(scenario.enemyCount, targetCount));
    return {
        damagePerAttack: damagePerHit * targetCount * hitRate,
        targetCount,
        hitRate
    };
}

function simulateScenario(cfg, scenario) {
    let time = 0;
    let cooldown = 0;
    let totalDamage = 0;
    let totalHits = 0;
    const hpPool = scenario.enemyCount * scenario.enemyHp;

    while (time < scenario.duration) {
        const dt = 0.05;
        time += dt;
        cooldown -= dt;
        if (cooldown > 0) continue;

        const attack = calculateAttackImpact(cfg, scenario);
        const damageJitter = 0.92 + Math.random() * 0.16;
        const hitJitter = 0.94 + Math.random() * 0.12;
        totalDamage += attack.damagePerAttack * damageJitter;
        totalHits += attack.targetCount * attack.hitRate * hitJitter;
        cooldown = Math.max(0.04, cfg.cd || 1);
    }

    const dps = totalDamage / scenario.duration;
    const killEquivalent = Math.min(scenario.enemyCount, totalDamage / scenario.enemyHp);
    return {
        key: scenario.key,
        label: scenario.label,
        dps,
        totalDamage,
        hits: totalHits,
        killEquivalent,
        clearRatio: Math.min(1, totalDamage / hpPool)
    };
}

function evaluateConfig(name, cfg, scenarios) {
    const scenarioResults = scenarios.map((scenario) => simulateScenario(cfg, scenario));
    const weightedScore = scenarioResults.reduce((sum, result, index) => {
        return sum + result.dps * scenarios[index].weight;
    }, 0);
    return {
        name,
        cfg,
        scenarios: scenarioResults,
        weightedScore
    };
}

function estimateOverflowRisk(cfg, weaponKey) {
    if (cfg.type === 'aura') {
        return {
            activeInstances: 1,
            tickDensity: 1 / Math.max(0.08, cfg.tickRate || 0.2),
            risk: (cfg.tickRate || 0.2) <= 0.08 ? 'high' : ((cfg.tickRate || 0.2) <= 0.12 ? 'medium' : 'low')
        };
    }
    if (cfg.type === 'area') {
        const rawActive = Math.max(1, ((cfg.duration || 5) / Math.max(0.04, cfg.cd || 1)) * Math.max(1, cfg.count || 1));
        const activeCap = weaponKey === 'holy_water' ? 6 : rawActive;
        const activeInstances = Math.min(rawActive, activeCap);
        const tickDensity = activeInstances / Math.max(0.08, cfg.tickRate || 0.25);
        const risk = activeInstances >= 9 || tickDensity >= 55 ? 'high' : activeInstances >= 6 || tickDensity >= 32 ? 'medium' : 'low';
        return { activeInstances, tickDensity, risk };
    }
    return { activeInstances: Math.max(1, cfg.count || 1), tickDensity: 0, risk: 'low' };
}

function evaluateWeapon(baseKey, tables, scenarios) {
    const base = evaluateConfig('lv1', clone(tables.WEAPONS[baseKey]), scenarios);
    const max = evaluateConfig('lv8', buildWeaponConfig(baseKey, 8, tables), scenarios);
    const superCfg = buildSuperConfig(baseKey, tables);
    const evolved = superCfg ? evaluateConfig('super', superCfg, scenarios) : null;
    return {
        weaponKey: baseKey,
        weaponName: tables.WEAPONS[baseKey].name,
        icon: tables.WEAPONS[baseKey].icon,
        type: tables.WEAPONS[baseKey].type,
        phases: { base, max, evolved }
    };
}

function evaluateWeaponBuilds(baseKey, tables, scenarios, itemBundle) {
    const maxBaseCfg = buildWeaponConfig(baseKey, 8, tables);
    const superBaseCfg = buildSuperConfig(baseKey, tables);
    const builds = [];

    for (const preset of ITEM_BUILD_PRESETS) {
        const itemStats = buildItemStats(itemBundle, preset);
        const maxCfg = applyBuildToConfig(maxBaseCfg, itemStats, baseKey);
        const maxEval = evaluateConfig(preset.key, maxCfg, scenarios);
        const superCfg = superBaseCfg ? applyBuildToConfig(superBaseCfg, itemStats, baseKey) : null;
        const superEval = superCfg ? evaluateConfig(`${preset.key}_super`, superCfg, scenarios) : null;
        builds.push({
            buildKey: preset.key,
            buildName: preset.name,
            itemStats,
            max: maxEval,
            super: superEval,
            overflow: estimateOverflowRisk(maxCfg, baseKey)
        });
    }
    return builds;
}

function average(values) {
    return values.reduce((sum, value) => sum + value, 0) / Math.max(1, values.length);
}

function stddev(values, mean = average(values)) {
    const variance = values.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / Math.max(1, values.length);
    return Math.sqrt(variance);
}

function rankWeapons(results) {
    const ranking = results.map((result) => {
        const baseScore = result.phases.base.weightedScore;
        const maxScore = result.phases.max.weightedScore;
        const superScore = result.phases.evolved ? result.phases.evolved.weightedScore : maxScore;
        const maxCrowd = result.phases.max?.scenarioMap?.crowd?.dps || 0;
        const maxElite = result.phases.max?.scenarioMap?.elite?.dps || 0;
        const maxBoss = result.phases.max?.scenarioMap?.boss?.dps || 0;
        const superCrowd = result.phases.evolved?.scenarioMap?.crowd?.dps || maxCrowd;
        const superBoss = result.phases.evolved?.scenarioMap?.boss?.dps || maxBoss;
        const growthRatio = maxScore / Math.max(1, baseScore);
        const superRatio = superScore / Math.max(1, maxScore);
        const stability = 1 - Math.min(0.95, (result.phases.max?.weightedCv || 0) * 1.8);
        return {
            weaponKey: result.weaponKey,
            weaponName: result.weaponName,
            icon: result.icon,
            type: result.type,
            baseScore,
            maxScore,
            superScore,
            crowdScore: maxCrowd * 0.45 + superCrowd * 0.55,
            eliteScore: maxElite,
            bossScore: maxBoss * 0.45 + superBoss * 0.55,
            growthRatio,
            superRatio,
            stability,
            overallScore: baseScore * 0.18 + maxScore * 0.34 + superScore * 0.48
        };
    }).sort((a, b) => b.overallScore - a.overallScore);

    const average = ranking.reduce((sum, item) => sum + item.overallScore, 0) / Math.max(1, ranking.length);
    ranking.forEach((item) => {
        item.ratio = item.overallScore / average;
        item.tier = item.ratio >= 1.35 ? 'S' : item.ratio >= 1.15 ? 'A' : item.ratio >= 0.85 ? 'B' : item.ratio >= 0.65 ? 'C' : 'D';
    });
    return { ranking, average };
}

function buildMetricPercentiles(ranking) {
    const metrics = ['baseScore', 'crowdScore', 'bossScore', 'growthRatio', 'superRatio'];
    const maps = {};
    for (const metric of metrics) {
        const ordered = [...ranking].sort((a, b) => b[metric] - a[metric]);
        maps[metric] = {};
        ordered.forEach((item, index) => {
            const percentile = ranking.length <= 1 ? 1 : 1 - (index / (ranking.length - 1));
            maps[metric][item.weaponKey] = percentile;
        });
    }
    return maps;
}

function evaluateIdentity(ranking) {
    const percentiles = buildMetricPercentiles(ranking);
    return ranking.map((item) => {
        const profile = WEAPON_IDENTITY_PROFILES[item.weaponKey];
        if (!profile) {
            return {
                weaponKey: item.weaponKey,
                weaponName: item.weaponName,
                icon: item.icon,
                role: '未定义',
                summary: '暂无定位定义',
                score: 1,
                holds: [],
                misses: [],
                allowedWeak: []
            };
        }

        const holds = [];
        const misses = [];
        for (const [metric, minPercentile] of Object.entries(profile.mustWin)) {
            const actual = percentiles[metric]?.[item.weaponKey] ?? 0;
            const entry = {
                metric,
                actual,
                target: minPercentile
            };
            if (actual >= minPercentile) holds.push(entry);
            else misses.push(entry);
        }

        const score = holds.length + Math.max(0, 1 - misses.length * 0.35);
        return {
            weaponKey: item.weaponKey,
            weaponName: item.weaponName,
            icon: item.icon,
            role: profile.role,
            summary: profile.summary,
            score,
            holds,
            misses,
            allowedWeak: profile.allowedWeak || []
        };
    });
}

function buildRecommendations(results, identityResults) {
    const recommendations = [];
    const avgCrowd = average(results.map((item) => item.crowdScore));
    const avgBoss = average(results.map((item) => item.bossScore));
    const avgGrowth = average(results.map((item) => item.growthRatio));
    const avgSuper = average(results.map((item) => item.superRatio));
    const identityMap = Object.fromEntries(identityResults.map((entry) => [entry.weaponKey, entry]));

    for (const item of results) {
        const identity = identityMap[item.weaponKey];
        const issues = [];
        if (item.crowdScore < avgCrowd * 0.7) issues.push('crowd');
        if (item.bossScore < avgBoss * 0.7) issues.push('boss');
        if (item.growthRatio < avgGrowth * 0.75) issues.push('growth');
        if (item.superRatio < avgSuper * 0.75) issues.push('super');
        const identityMisses = identity?.misses || [];
        if ((item.ratio >= 0.9 && identityMisses.length === 0) || (issues.length === 0 && identityMisses.length === 0)) continue;

        const allowedWeak = new Set(identity?.allowedWeak || []);
        const filteredIssues = issues.filter((issue) => {
            const metricMap = {
                crowd: 'crowdScore',
                boss: 'bossScore',
                growth: 'growthRatio',
                super: 'superRatio'
            };
            return !allowedWeak.has(metricMap[issue]);
        });
        const criticalMisses = identityMisses.map((entry) => entry.metric);

        let suggestion = '补基础伤害和中后期倍率';
        if (criticalMisses.includes('crowdScore')) {
            suggestion = '优先强化主清场手段，让它在自己的清群场景里重新站稳';
        } else if (criticalMisses.includes('bossScore')) {
            suggestion = '优先强化主单体手段，让它在自己的点杀场景里重新站稳';
        } else if (criticalMisses.includes('growthRatio')) {
            suggestion = '优先强化 4-8 级成长，保留前期弱点但让中后期形成自己的峰值';
        } else if (criticalMisses.includes('superRatio')) {
            suggestion = '优先强化超武机制和视觉爆发，让进化成为真正的高潮';
        } else if (filteredIssues.includes('crowd') && filteredIssues.includes('boss')) {
            suggestion = '同时补基础伤害、命中频率和范围，做全向补强';
        } else if (filteredIssues.includes('crowd')) {
            suggestion = '优先补范围、数量、爆炸半径或连锁目标数';
        } else if (filteredIssues.includes('boss')) {
            suggestion = '优先补单体倍率、暴击、持续命中频率或处决强度';
        } else if (filteredIssues.includes('growth')) {
            suggestion = '优先补 4-8 级成长，把强度后移而不是抬初始';
        } else if (filteredIssues.includes('super')) {
            suggestion = '优先补超武特效和视觉爆发，不动前期';
        }

        if (item.type === 'orbit') suggestion = '优先补环绕半径、转速、持续命中频率和超武压场强度';
        if (item.type === 'area') suggestion = criticalMisses.includes('crowdScore')
            ? '优先补区域覆盖和控场密度，不需要强行补 Boss 点杀'
            : '优先补区域半径、持续时间、tick频率和追踪速度';
        if (item.type === 'instant') suggestion = '优先补链数、分叉数和超武雷暴密度';
        if (item.type === 'melee' && filteredIssues.includes('boss')) suggestion = '优先补近战单次倍率、暴击和超武斩击覆盖';

        recommendations.push({
            weaponKey: item.weaponKey,
            weaponName: item.weaponName,
            icon: item.icon,
            tier: item.tier,
            ratio: item.ratio,
            issues: filteredIssues,
            identityMisses: criticalMisses,
            role: identity?.role || '',
            suggestion
        });
    }

    return {
        mode: 'identity-first-buff',
        note: '当前建议优先修复武器的主胜场，不主动填平被允许存在的弱点',
        entries: recommendations
    };
}

function buildReport(results, scenarios, options) {
    const { ranking, average: averageOverall } = rankWeapons(results);
    const identity = evaluateIdentity(ranking);
    const recommendations = buildRecommendations(ranking, identity);
    const summary = {
        testedWeapons: ranking.length,
        averageScore: Number(averageOverall.toFixed(1)),
        highestScore: Number(ranking[0].overallScore.toFixed(1)),
        lowestScore: Number(ranking[ranking.length - 1].overallScore.toFixed(1)),
        minMaxRatio: Number((ranking[ranking.length - 1].overallScore / ranking[0].overallScore).toFixed(3)),
        averageCrowdScore: Number(average(results.map((item) => item.phases.max?.scenarioMap?.crowd?.dps || 0)).toFixed(1)),
        averageBossScore: Number(average(results.map((item) => item.phases.max?.scenarioMap?.boss?.dps || 0)).toFixed(1)),
        runsPerScenario: options.runs,
        duration: options.duration,
        scenarios: scenarios.map((s) => s.label)
    };
    return {
        timestamp: new Date().toISOString(),
        summary,
        ranking,
        identity,
        recommendations,
        details: results,
        buildAnalysis: buildBuildAnalysis(results)
    };
}

function buildBuildAnalysis(results) {
    const combos = [];
    const anomalies = [];

    for (const result of results) {
        if (!result.builds || !result.builds.length) continue;
        const baseline = result.builds.find((entry) => entry.buildKey === 'none') || result.builds[0];
        const baselineScore = baseline.max.weightedScore;
        for (const build of result.builds) {
            if (build.buildKey === 'none') continue;
            const maxScore = build.max.weightedScore;
            const ratio = maxScore / Math.max(1, baselineScore);
            combos.push({
                weaponKey: result.weaponKey,
                weaponName: result.weaponName,
                icon: result.icon,
                buildKey: build.buildKey,
                buildName: build.buildName,
                maxScore,
                baselineScore,
                ratio,
                overflow: build.overflow
            });
            if (ratio >= 2.2 || build.overflow.risk === 'high') {
                anomalies.push({
                    weaponKey: result.weaponKey,
                    weaponName: result.weaponName,
                    icon: result.icon,
                    buildName: build.buildName,
                    ratio,
                    overflow: build.overflow,
                    reason: build.overflow.risk === 'high'
                        ? `活动实例 ${build.overflow.activeInstances.toFixed(1)} / tick密度 ${build.overflow.tickDensity.toFixed(1)}`
                        : `构筑倍率 ${ratio.toFixed(2)}x`
                });
            }
        }
    }

    combos.sort((a, b) => b.ratio - a.ratio);
    anomalies.sort((a, b) => {
        const riskWeight = { high: 2, medium: 1, low: 0 };
        return (riskWeight[b.overflow.risk] - riskWeight[a.overflow.risk]) || (b.ratio - a.ratio);
    });
    return {
        presets: ITEM_BUILD_PRESETS.map((preset) => ({ key: preset.key, name: preset.name })),
        topCombos: combos.slice(0, 20),
        anomalies
    };
}

function writeReport(report, outputDir) {
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }
    const jsonPath = path.join(outputDir, 'ai-weapon-strength-latest.json');
    const mdPath = path.join(outputDir, 'ai-weapon-strength-latest.md');
    fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2), 'utf8');

    const lines = [];
    lines.push('# AI武器强度报告');
    lines.push('');
    lines.push(`- 生成时间: ${report.timestamp}`);
    lines.push(`- 武器数量: ${report.summary.testedWeapons}`);
    lines.push(`- 平均强度分: ${report.summary.averageScore}`);
    lines.push(`- 最低/最高比: ${report.summary.minMaxRatio}`);
    lines.push(`- 平均群怪压制: ${report.summary.averageCrowdScore}`);
    lines.push(`- 平均 Boss 压制: ${report.summary.averageBossScore}`);
    lines.push('');
    lines.push('## 道具构筑压测');
    lines.push('');
    lines.push(`- 构筑数量: ${report.buildAnalysis.presets.length}`);
    lines.push(`- 异常组合: ${report.buildAnalysis.anomalies.length}`);
    lines.push('');
    lines.push('| 武器 | 构筑 | Lv8构筑分 | 裸装Lv8 | 倍率 | 溢出风险 |');
    lines.push('|:--|:--|--:|--:|--:|:--|');
    report.buildAnalysis.topCombos.forEach((entry) => {
        lines.push(`| ${entry.icon} ${entry.weaponName} | ${entry.buildName} | ${entry.maxScore.toFixed(1)} | ${entry.baselineScore.toFixed(1)} | ${entry.ratio.toFixed(2)}x | ${entry.overflow.risk} |`);
    });
    lines.push('');
    lines.push('## 异常组合');
    lines.push('');
    if (report.buildAnalysis.anomalies.length === 0) {
        lines.push('- 未发现明显失控构筑');
    } else {
        report.buildAnalysis.anomalies.forEach((entry) => {
            lines.push(`- ${entry.icon} **${entry.weaponName} + ${entry.buildName}**: ${entry.reason}`);
        });
    }
    lines.push('');
    lines.push('## 排名');
    lines.push('');
    lines.push('| 排名 | 武器 | 类型 | Lv1 | Lv8 | 超武 | 群怪 | Boss | 成长 | 超武增幅 | 综合 | 比例 | 分级 |');
    lines.push('|:--|:--|:--|--:|--:|--:|--:|--:|--:|--:|--:|--:|:--|');
    report.ranking.forEach((item, index) => {
        lines.push(`| ${index + 1} | ${item.icon} ${item.weaponName} | ${item.type} | ${item.baseScore.toFixed(1)} | ${item.maxScore.toFixed(1)} | ${item.superScore.toFixed(1)} | ${item.crowdScore.toFixed(1)} | ${item.bossScore.toFixed(1)} | ${item.growthRatio.toFixed(1)}x | ${item.superRatio.toFixed(1)}x | ${item.overallScore.toFixed(1)} | ${(item.ratio * 100).toFixed(0)}% | ${item.tier} |`);
    });
    lines.push('');
    lines.push('## 定位校验');
    lines.push('');
    report.identity.forEach((entry) => {
        lines.push(`- ${entry.icon} **${entry.weaponName}**: ${entry.role}`);
        lines.push(`  - 定位说明: ${entry.summary}`);
        lines.push(`  - 守住的强场景: ${entry.holds.map((item) => item.metric).join(', ') || '无'}`);
        lines.push(`  - 未守住的强场景: ${entry.misses.map((item) => item.metric).join(', ') || '无'}`);
        lines.push(`  - 允许弱点: ${entry.allowedWeak.join(', ') || '无'}`);
    });
    lines.push('');
    lines.push('## 补强建议');
    lines.push('');
    lines.push(`- 模式: ${report.recommendations.mode}`);
    lines.push(`- 说明: ${report.recommendations.note}`);
    lines.push('');
    report.recommendations.entries.forEach((entry) => {
        lines.push(`- ${entry.icon} **${entry.weaponName}** [${entry.tier}] ${entry.role ? `- ${entry.role}` : ''}`);
        lines.push(`  - 问题维度: ${entry.issues.join(', ')}`);
        lines.push(`  - 定位缺口: ${entry.identityMisses.join(', ') || '无'}`);
        lines.push(`  - 建议: ${entry.suggestion}`);
    });
    lines.push('');
    lines.push('## 场景');
    lines.push('');
    report.details.forEach((detail) => {
        lines.push(`### ${detail.icon} ${detail.weaponName}`);
        ['base', 'max', 'evolved'].forEach((phaseKey) => {
            const phase = detail.phases[phaseKey];
            if (!phase) return;
            lines.push(`- ${phase.name}: ${phase.weightedScore.toFixed(1)} (波动 ${(phase.weightedCv * 100).toFixed(1)}%)`);
            phase.scenarios.forEach((scenario) => {
                lines.push(`  - ${scenario.label}: DPS ${scenario.dps.toFixed(1)}, 清场比 ${(scenario.clearRatio * 100).toFixed(0)}%, 波动 ${(scenario.dpsCv * 100).toFixed(1)}%`);
            });
        });
        lines.push('');
    });
    fs.writeFileSync(mdPath, lines.join('\n'), 'utf8');
    return { jsonPath, mdPath };
}

function printTop(report) {
    console.log('═'.repeat(72));
    console.log('AI武器强度测试');
    console.log('═'.repeat(72));
    console.log(`武器数: ${report.summary.testedWeapons} | 平均分: ${report.summary.averageScore} | 最低/最高比: ${report.summary.minMaxRatio}`);
    console.log(`群怪均值: ${report.summary.averageCrowdScore} | Boss均值: ${report.summary.averageBossScore} | 建议模式: 补强优先`);
    console.log('');
    report.ranking.forEach((item, index) => {
        console.log(
            `${String(index + 1).padStart(2, '0')}. ${item.icon} ${item.weaponName.padEnd(8)} ` +
            `Lv1 ${item.baseScore.toFixed(1).padStart(6)} | Lv8 ${item.maxScore.toFixed(1).padStart(6)} | ` +
            `超武 ${item.superScore.toFixed(1).padStart(6)} | 群 ${item.crowdScore.toFixed(0).padStart(5)} | ` +
            `Boss ${item.bossScore.toFixed(0).padStart(5)} | 综合 ${item.overallScore.toFixed(1).padStart(7)} | ${item.tier}`
        );
    });
    if (report.recommendations.entries.length > 0) {
        console.log('');
        console.log('补强建议');
        report.recommendations.entries.slice(0, 8).forEach((entry) => {
            console.log(`- ${entry.icon} ${entry.weaponName}: ${entry.suggestion}`);
        });
    }
    if (report.buildAnalysis?.anomalies?.length) {
        console.log('');
        console.log('异常构筑');
        report.buildAnalysis.anomalies.slice(0, 8).forEach((entry) => {
            console.log(`- ${entry.icon} ${entry.weaponName} + ${entry.buildName}: ${entry.reason}`);
        });
    }
}

function main() {
    const options = parseArgs(process.argv.slice(2));
    const tables = loadWeaponData();
    const itemBundle = loadItemManagerBundle();
    const scenarios = makeScenarios(options.duration);
    const keys = Object.keys(tables.WEAPONS);
    const results = [];

    for (let run = 0; run < options.runs; run++) {
        for (const key of keys) {
            if (!results[run]) results[run] = {};
            results[run][key] = evaluateWeapon(key, tables, scenarios);
        }
    }

    const merged = keys.map((key) => {
        const sample = results[0][key];
        const phases = {};
        ['base', 'max', 'evolved'].forEach((phaseKey) => {
            const phaseRuns = results.map((entry) => entry[key].phases[phaseKey]).filter(Boolean);
            if (!phaseRuns.length) {
                phases[phaseKey] = null;
                return;
            }
            const avgWeighted = phaseRuns.reduce((sum, phase) => sum + phase.weightedScore, 0) / phaseRuns.length;
            const weightedValues = phaseRuns.map((phase) => phase.weightedScore);
            const scenariosAvg = phaseRuns[0].scenarios.map((scenario, index) => {
                const dpsValues = phaseRuns.map((phase) => phase.scenarios[index].dps);
                const clearValues = phaseRuns.map((phase) => phase.scenarios[index].clearRatio);
                const dps = average(dpsValues);
                const clearRatio = average(clearValues);
                return {
                    key: phaseRuns[0].scenarios[index].key,
                    label: scenario.label,
                    dps,
                    clearRatio,
                    dpsStd: stddev(dpsValues, dps),
                    dpsCv: dps > 0 ? stddev(dpsValues, dps) / dps : 0
                };
            });
            const scenarioMap = {};
            scenariosAvg.forEach((scenario) => {
                scenarioMap[scenario.key] = scenario;
            });
            phases[phaseKey] = {
                name: phaseRuns[0].name,
                weightedScore: avgWeighted,
                weightedStd: stddev(weightedValues, avgWeighted),
                weightedCv: avgWeighted > 0 ? stddev(weightedValues, avgWeighted) / avgWeighted : 0,
                scenarios: scenariosAvg,
                scenarioMap
            };
        });
        return {
            weaponKey: key,
            weaponName: sample.weaponName,
            icon: sample.icon,
            type: sample.type,
            phases,
            builds: evaluateWeaponBuilds(key, tables, scenarios, itemBundle)
        };
    });

    const report = buildReport(merged, scenarios, options);
    const saved = writeReport(report, options.outputDir);
    printTop(report);
    console.log('');
    console.log(`JSON: ${saved.jsonPath}`);
    console.log(`Markdown: ${saved.mdPath}`);
}

main();
