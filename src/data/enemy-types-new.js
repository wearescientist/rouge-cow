// enemy-types-new.js - 从 FLOOR_DATA 生成运行时怪物配置
// v0.36 - 严格使用 FLOOR_DATA 中的 tier，不自动强制

(function() {
    'use strict';

    const VISUAL_CONFIG = {
        bat_v2: { needsFlip: true, hasBounce: true },
        bat_v3: { needsFlip: true, hasBounce: true },
        bat_v8: { needsFlip: true, hasBounce: true },
        bat_v9: { needsFlip: false, hasBounce: true },
        bee_v6: { needsFlip: true, hasBounce: true },
        chick_spr: { needsFlip: false, hasBounce: false },
        crab_spr: { needsFlip: false, hasBounce: false },
        crab_v2: { needsFlip: false, hasBounce: false },
        crab_v4: { needsFlip: false, hasBounce: false },
        crab_v6: { needsFlip: false, hasBounce: false },
        crab_v8: { needsFlip: false, hasBounce: false },
        fox_v1: { needsFlip: false, hasBounce: false },
        fox_v10: { needsFlip: false, hasBounce: false },
        fox_v3: { needsFlip: false, hasBounce: false },
        fox_v6: { needsFlip: false, hasBounce: false },
        fox_v7: { needsFlip: false, hasBounce: false },
        fox_v8: { needsFlip: false, hasBounce: false },
        ghost_spr: { needsFlip: true, hasBounce: true },
        ghost_v10: { needsFlip: true, hasBounce: true },
        ghost_v2: { needsFlip: true, hasBounce: true },
        ghost_v3: { needsFlip: true, hasBounce: true },
        ghost_v4: { needsFlip: true, hasBounce: true },
        ghost_v6: { needsFlip: true, hasBounce: true },
        ghost_v8: { needsFlip: true, hasBounce: true },
        goose_v6: { needsFlip: false, hasBounce: false },
        mimic_spr: { needsFlip: true, hasBounce: false },
        mimic_v1: { needsFlip: true, hasBounce: false },
        mimic_v5: { needsFlip: true, hasBounce: false },
        mimic_v6: { needsFlip: true, hasBounce: false },
        mimic_v7: { needsFlip: true, hasBounce: false },
        mimic_v8: { needsFlip: true, hasBounce: false },
        mother_v10: { needsFlip: false, hasBounce: false },
        mother_v2: { needsFlip: false, hasBounce: false },
        mother_v3: { needsFlip: false, hasBounce: false },
        mother_v6: { needsFlip: false, hasBounce: false },
        mother_v7: { needsFlip: false, hasBounce: false },
        mother_v8: { needsFlip: false, hasBounce: false },
        nibei_v6: { needsFlip: true, hasBounce: false },
        nibei_v8: { needsFlip: false, hasBounce: false },
        panther_v1: { needsFlip: true, hasBounce: false },
        panther_v10: { needsFlip: true, hasBounce: false },
        pigeon_v1: { needsFlip: true, hasBounce: true },
        pigeon_v10: { needsFlip: false, hasBounce: true },
        pigeon_v2: { needsFlip: true, hasBounce: true },
        pigeon_v4: { needsFlip: true, hasBounce: true },
        pigeon_v6: { needsFlip: true, hasBounce: true },
        pigeon_v7: { needsFlip: false, hasBounce: true },
        pigeon_v8: { needsFlip: true, hasBounce: true },
        rabbit2_v2: { needsFlip: true, hasBounce: true },
        rabbit2_v4: { needsFlip: false, hasBounce: true },
        snail_v1: { needsFlip: false, hasBounce: false },
        snail_v10: { needsFlip: false, hasBounce: false },
        snail_v2: { needsFlip: true, hasBounce: false },
        snail_v4: { needsFlip: false, hasBounce: false },
        snail_v6: { needsFlip: false, hasBounce: false },
        snail_v7: { needsFlip: true, hasBounce: false },
        snail_v8: { needsFlip: true, hasBounce: false },
        snake_v10: { needsFlip: true, hasBounce: false },
        snake_v4: { needsFlip: true, hasBounce: false },
        snake_v7: { needsFlip: true, hasBounce: false },
        snake_v8: { needsFlip: true, hasBounce: false },
        yinya_v7: { needsFlip: false, hasBounce: false }
    };

    // 基础参考值
    const REF_T1 = { hp: 10, speed: 130, dmg: 1, exp: 3, gold: 2, size: 32 };
    const REF_T4 = { hp: 1000, speed: 40, dmg: 5, exp: 150, gold: 80, size: 100 };
    // T3 / T4 只锁基础血量锚点，不锁最终血量。
    // 之前直接把 T3 锁成 220、Boss 锁成固定低血量，后期会导致小Boss和Boss一起融化。
    const FORCED_BASE_HP_BY_TIER = { 3: 220 };
    // Boss 目标：常规构筑平均击杀时间至少 30 秒；早层不再白给，后层抗高爆发。
    const BOSS_HP_BY_FLOOR = [0, 7600, 12800, 20800, 32400, 47600, 67600, 94000];
    const BOSS_ARMOR_BY_FLOOR = [0, 0.04, 0.07, 0.10, 0.14, 0.18, 0.22, 0.26];

    // 楼层生命倍率
    // 这条曲线是给 T1/T2/T3 共用的地基曲线，T3 现在会先被锁成基础 220 再吃楼层倍率。
    const FLOOR_MULT = [1, 1.55, 3.6, 6.8, 10.8, 15.8, 22.0, 30.0];

    // Tier倍率
    // T3 不再额外乘 5 倍，避免和 220 基础血量叠乘失控；Boss 单独走 BOSS_HP_BY_FLOOR。
    const TIER_MULT = { 1: 1, 2: 2.6, 3: 1.0, 4: 1, 5: 2.0 };
    const TIER_ARMOR = { 1: 0, 2: 0.05, 3: 0.10, 4: 0.18, 5: 0.24 };

    // 基础尺寸 (根据怪物类型)
    const BASE_SIZE = {
        'bat': 28, 'chick': 28, 'snail': 28, 'pigeon': 28, 'snake': 28,
        'ghost': 44, 'rabbit2': 36, 'mimic': 36, 'fox': 44, 'crab': 28,
        'panther': 44, 'bee': 28, 'goose': 36, 'yinya': 44, 'nibei': 44,
        'mother': 64
    };

    // 旧 Boss 系统里仍在使用的实战数值，迁移到新系统后继续沿用
    const BOSS_RUNTIME_TUNING = {
        1: { baseHp: 7600, speed: 200, dmg: 5, exp: 100, gold: 50, color: '#aa44ff' },
        2: { baseHp: 12800, speed: 185, dmg: 7, exp: 120, gold: 60, color: '#4488ff' },
        3: { baseHp: 20800, speed: 70, dmg: 10, exp: 140, gold: 70, color: '#44aa44' },
        4: { baseHp: 32400, speed: 210, dmg: 13, exp: 150, gold: 75, color: '#aa44ff' },
        5: { baseHp: 47600, speed: 110, dmg: 19, exp: 180, gold: 90, color: '#ffaa00' },
        6: { baseHp: 67600, speed: 0, dmg: 26, exp: 320, gold: 170, color: '#880000', isStatic: true },
        7: { baseHp: 94000, speed: 120, dmg: 30, exp: 460, gold: 240, color: '#6fcfff', isStatic: false }
    };

    // 尺寸修正
    const SIZE_MOD = { 1: 0, 2: 12, 3: 20, 4: 36, 5: 50 };

    // 生成sprite路径
    function getSpritePaths(baseId, version, floor, tier) {
        const id = `${baseId}_${version}`;
        const basePath = `./assets/runtime/sprites/enemies/monster_walk_preserve_features/floor${floor}`;
        const layout = `T${tier}/${id}`;
        return {
            ready: `${basePath}/${layout}/walk/f01.png`,
            walk: `${basePath}/${layout}/walk/f01.png`,
            attack: `${basePath}/${layout}/attack/f01.png`,
            hurt: `${basePath}/${layout}/hurt/f01.png`,
            die: `${basePath}/${layout}/die/f01.png`
        };
    }

    function getUniqueId(monster, floorNum) {
        return `${monster.id}_t${monster.tier || 1}_f${floorNum}`;
    }

    function normalizeFloorNumber(floor) {
        const numericFloor = Number(floor);
        if (!Number.isFinite(numericFloor)) return 1;
        return Math.min(7, Math.max(1, Math.floor(numericFloor)));
    }

    function getFloorMonsters(floor) {
        const floorNum = normalizeFloorNumber(floor);
        return window.FLOOR_DATA?.floors?.[`floor${floorNum}`]?.monsters || [];
    }

    function getEnemyTypesNew() {
        return window.ENEMY_TYPES_NEW || generateEnemyTypes();
    }

    function getMonstersForFloorByTier(floor, tiers = null) {
        const floorNum = normalizeFloorNumber(floor);
        const tierList = tiers == null
            ? null
            : (Array.isArray(tiers) ? tiers : [tiers]).map(Number);
        return Object.values(getEnemyTypesNew()).filter(monster => {
            if (monster.floor !== floorNum) return false;
            if (!tierList) return true;
            return tierList.includes(monster.tier);
        });
    }

    function clampDamage(rawDamage, tier) {
        const fallback = Number.isFinite(rawDamage) ? rawDamage : REF_T1.dmg;
        const numericTier = tier || 1;
        if (numericTier >= 3) {
            return Math.max(2, Math.min(4, fallback));
        }
        if (numericTier >= 2) {
            return Math.max(1, Math.min(3, fallback));
        }
        return Math.max(1, Math.min(2, fallback));
    }

    function getVisualConfig(monster) {
        const key = `${monster.baseId}_${monster.version}`;
        if (VISUAL_CONFIG[key]) {
            return VISUAL_CONFIG[key];
        }
        return {
            needsFlip: ['bat', 'ghost', 'snake'].includes(monster.baseId),
            hasBounce: ['bat', 'ghost', 'bee', 'pigeon', 'rabbit2'].includes(monster.baseId)
        };
    }

    // 从 FLOOR_DATA 生成 ENEMY_TYPES_NEW
    function generateEnemyTypes() {
        const result = {};
        const duplicateKeys = new Set();
        
        if (!window.FLOOR_DATA || !window.FLOOR_DATA.floors) {
            console.error('[EnemyTypes] FLOOR_DATA not found!');
            return result;
        }

        // 遍历每个楼层
        for (let floorNum = 1; floorNum <= 7; floorNum++) {
            const floorKey = `floor${floorNum}`;
            const floorData = window.FLOOR_DATA.floors[floorKey];
            
            if (!floorData || !floorData.monsters) continue;

            const floorMult = FLOOR_MULT[floorNum] || 1;

            // 处理该楼层每个怪物
            floorData.monsters.forEach(m => {
                if (!m.id || !m.baseId || !m.version) return;

                // 使用 FLOOR_DATA 中定义的 tier（不强制修改）
                const tier = m.tier || 1;
                const isBoss = tier >= 4;
                const dmg = clampDamage(m.stats?.dmg, tier);
                const visualConfig = getVisualConfig(m);
                
                // 生成唯一ID: {id}_t{tier}_f{floor}
                const uniqueId = getUniqueId(m, floorNum);
                if (result[uniqueId]) {
                    duplicateKeys.add(uniqueId);
                }
                
                // 计算最终属性
                const tierMult = TIER_MULT[tier] || 1;
                const rawBaseHp = m.stats?.hp || REF_T1.hp;
                const baseHp = Number.isFinite(FORCED_BASE_HP_BY_TIER[tier]) ? FORCED_BASE_HP_BY_TIER[tier] : rawBaseHp;
                const baseSize = m.size || (BASE_SIZE[m.baseId] || 32) + (SIZE_MOD[tier] || 0);
                
                // Boss用固定值，其他按倍率计算
                let finalHp;
                if (isBoss) {
                    finalHp = BOSS_HP_BY_FLOOR[floorNum] || REF_T4.hp;
                } else {
                    finalHp = Math.round(baseHp * floorMult * tierMult);
                }

                // 确定 type 标签
                const finalType = isBoss ? 'boss' : (tier >= 2 ? 'elite' : 'common');

                const floorAggroMult = isBoss ? 1 : (1 + Math.max(0, floorNum - 1) * 0.035 + (tier >= 2 ? 0.04 : 0));
                const armor = isBoss
                    ? (BOSS_ARMOR_BY_FLOOR[floorNum] || TIER_ARMOR[tier] || 0)
                    : Math.min(0.24, Math.max(0, (TIER_ARMOR[tier] || 0) + Math.max(0, floorNum - 2) * 0.008 + (tier >= 3 ? 0.012 : 0)));
                result[uniqueId] = {
                    id: uniqueId,
                    baseId: m.baseId,
                    version: m.version,
                    name: m.name,
                    floor: floorNum,
                    tier: tier,
                    type: finalType,
                    hp: finalHp,
                    speed: Math.round((m.stats?.speed || REF_T1.speed) * floorAggroMult),
                    dmg: dmg,
                    damage: dmg,
                    armor: armor,
                    size: isBoss ? REF_T4.size : baseSize,
                    exp: isBoss ? REF_T4.exp : Math.round(REF_T1.exp * tierMult),
                    gold: isBoss ? REF_T4.gold : Math.round(REF_T1.gold * tierMult),
                    needsFlip: visualConfig.needsFlip,
                    hasBounce: visualConfig.hasBounce,
                    spritePaths: getSpritePaths(m.baseId, m.version, floorNum, tier),
                    animations: { frameCount: 4, frameDuration: 150 }
                };
            });
        }

        if (duplicateKeys.size > 0) {
            console.warn('[EnemyTypes] Duplicate runtime keys detected:', Array.from(duplicateKeys));
        }

        return result;
    }

    // 获取指定楼层和tier的怪物列表
    function getMonstersByTierAndFloor(floor, tier) {
        return getMonstersForFloorByTier(floor, tier).map(monster => monster.id);
    }

    function getRandomNewMonsterForFloor(floor, tiers = null) {
        const pool = getMonstersForFloorByTier(floor, tiers);
        if (!pool.length) {
            return null;
        }
        const selected = pool[Math.floor(Math.random() * pool.length)];
        return selected?.id || null;
    }

    function getFloorBossRuntimeConfig(floor) {
        const floorNum = normalizeFloorNumber(floor);
        const floorBoss = getFloorMonsters(floorNum).find(monster => (monster.tier || 1) >= 4);
        if (!floorBoss) {
            return null;
        }

        const typeKey = getUniqueId(floorBoss, floorNum);
        const runtimeCfg = getEnemyTypesNew()[typeKey];
        const tuning = BOSS_RUNTIME_TUNING[floorNum] || BOSS_RUNTIME_TUNING[1];

        return {
            floor: floorNum,
            typeKey: typeKey,
            name: floorBoss.name,
            tier: floorBoss.tier || 4,
            hp: BOSS_HP_BY_FLOOR[floorNum] || tuning.baseHp || REF_T4.hp,
            armor: BOSS_ARMOR_BY_FLOOR[floorNum] || 0,
            speed: tuning.speed,
            dmg: tuning.dmg,
            exp: tuning.exp,
            gold: tuning.gold,
            color: tuning.color,
            isStatic: tuning.isStatic === true || floorNum === 6,
            runtimeCfg: runtimeCfg || null
        };
    }

    // 导出到全局
    window.ENEMY_TYPES_NEW_GENERATOR = {
        generate: generateEnemyTypes,
        getByTierAndFloor: getMonstersByTierAndFloor,
        getRandomForFloor: getRandomNewMonsterForFloor,
        getBossConfigForFloor: getFloorBossRuntimeConfig
    };
    window.getRandomNewMonsterForFloor = getRandomNewMonsterForFloor;
    window.getNewBossConfigForFloor = getFloorBossRuntimeConfig;

    // 页面加载后自动生成
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.ENEMY_TYPES_NEW = generateEnemyTypes();
            console.log('[EnemyTypes] Generated', Object.keys(window.ENEMY_TYPES_NEW).length, 'monster types');
        });
    } else {
        window.ENEMY_TYPES_NEW = generateEnemyTypes();
        console.log('[EnemyTypes] Generated', Object.keys(window.ENEMY_TYPES_NEW).length, 'monster types');
    }

})();
