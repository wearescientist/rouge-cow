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

    // 楼层倍率 (floor^1.5)
    const FLOOR_MULT = [1, 1, 2.83, 5.2, 8, 11.18, 15]; 

    // Tier倍率
    const TIER_MULT = { 1: 1, 2: 2, 3: 4, 4: 1, 5: 1.5 };

    // 基础尺寸 (根据怪物类型)
    const BASE_SIZE = {
        'bat': 28, 'chick': 28, 'snail': 28, 'pigeon': 28, 'snake': 28,
        'ghost': 44, 'rabbit2': 36, 'mimic': 36, 'fox': 44, 'crab': 28,
        'panther': 44, 'bee': 28, 'goose': 36, 'yinya': 44, 'nibei': 44,
        'mother': 64
    };

    // 尺寸修正
    const SIZE_MOD = { 1: 0, 2: 12, 3: 20, 4: 36, 5: 50 };

    // 生成sprite路径
    function getSpritePaths(baseId, version, floor, tier) {
        const id = `${baseId}_${version}`;
        const basePath = `./generated_assets/monster_walk_preserve_features/floor${floor}`;
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

    function clampDamage(rawDamage, tier) {
        const fallback = Number.isFinite(rawDamage) ? rawDamage : REF_T1.dmg;
        if ((tier || 1) >= 2) {
            return Math.max(1, Math.min(2, fallback));
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
        for (let floorNum = 1; floorNum <= 6; floorNum++) {
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
                const baseHp = m.stats?.hp || REF_T1.hp;
                const baseSize = m.size || (BASE_SIZE[m.baseId] || 32) + (SIZE_MOD[tier] || 0);
                
                // Boss用固定值，其他按倍率计算
                let finalHp;
                if (isBoss) {
                    finalHp = m.stats?.hp || REF_T4.hp;
                } else {
                    finalHp = Math.round(baseHp * floorMult * tierMult);
                }

                // 确定 type 标签
                const finalType = isBoss ? 'boss' : (tier >= 2 ? 'elite' : 'common');

                result[uniqueId] = {
                    id: uniqueId,
                    baseId: m.baseId,
                    version: m.version,
                    name: m.name,
                    floor: floorNum,
                    tier: tier,
                    type: finalType,
                    hp: finalHp,
                    speed: m.stats?.speed || REF_T1.speed,
                    dmg: dmg,
                    damage: dmg,
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
        const types = window.ENEMY_TYPES_NEW || generateEnemyTypes();
        return Object.values(types).filter(m => m.floor === floor && m.tier === tier).map(m => m.id);
    }

    // 导出到全局
    window.ENEMY_TYPES_NEW_GENERATOR = {
        generate: generateEnemyTypes,
        getByTierAndFloor: getMonstersByTierAndFloor
    };

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
