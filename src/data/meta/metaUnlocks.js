(function attachMetaUnlocks(global) {
    'use strict';

    function createDef(partial) {
        return {
            unlockType: 'system',
            triggerTiming: 'runtime',
            scope: 'account',
            uiVisible: true,
            toastType: 'unlock',
            toastTitle: partial.title,
            toastBody: partial.description,
            priority: 'P1',
            enabled: true,
            ...partial
        };
    }

    const defs = [
        createDef({
            key: 'hidden_room_system',
            unlockType: 'system',
            title: '隐藏房系统已开放',
            description: '后续局内将开放隐藏房',
            triggerTiming: 'first_time',
            type: 'meta_flag',
            conditionKey: 'falseEndingCleared',
            conditionValue: true,
            flagKey: 'falseEndingCleared',
            effectKey: 'hidden_room_system_enabled',
            effectValue: true,
            priority: 'P0'
        }),
        createDef({
            key: 'bible_unlock',
            unlockType: 'weapon',
            title: '武装法典已入池',
            description: '武装法典已加入武器池',
            triggerTiming: 'first_time',
            type: 'meta_flag',
            conditionKey: 'falseEndingCleared',
            conditionValue: true,
            flagKey: 'falseEndingCleared',
            effectKey: 'weapon_bible_unlocked',
            effectValue: true,
            priority: 'P0'
        }),
        createDef({
            key: 'true_route_runtime',
            unlockType: 'route',
            title: '本局真路线可进入',
            description: '当前局已满足真路线条件',
            type: 'run_flag',
            conditionKey: 'runTrueRouteEnabled',
            conditionValue: true,
            flagKey: 'runTrueRouteEnabled',
            scope: 'run',
            uiVisible: false,
            toastType: 'none',
            effectKey: 'run_true_route_enabled',
            effectValue: true,
            priority: 'P0'
        }),
        createDef({
            key: 'scythe_unlock',
            unlockType: 'weapon',
            title: '镰刀已入池',
            description: '镰刀已加入武器池',
            triggerTiming: 'first_time',
            type: 'meta_flag',
            conditionKey: 'trueEndingCleared',
            conditionValue: true,
            flagKey: 'trueEndingCleared',
            effectKey: 'weapon_scythe_unlocked',
            effectValue: true,
            priority: 'P0'
        }),
        createDef({
            key: 'storm_axe_unlock',
            unlockType: 'weapon',
            title: '雷神战斧已入池',
            description: '雷神战斧已加入武器池',
            type: 'run_stat',
            conditionKey: 'superWeaponCount',
            conditionValue: 3,
            statKey: 'superWeaponCount',
            threshold: 3,
            effectKey: 'weapon_storm_axe_unlocked',
            effectValue: true,
            priority: 'P0'
        }),
        createDef({
            key: 'legendary_atk',
            unlockType: 'legendary',
            title: '传奇攻击条目已入池',
            description: '传说圣剑已加入掉落池',
            type: 'legendary_chain',
            conditionKey: 'atk',
            conditionValue: 'common+rare+epic',
            chainKey: 'atk',
            effectKey: 'legendary_atk_unlocked',
            effectValue: true,
            priority: 'P0'
        }),
        createDef({
            key: 'legendary_speed',
            unlockType: 'legendary',
            title: '传奇移速条目已入池',
            description: '赫尔墨斯之靴已加入掉落池',
            type: 'legendary_chain',
            conditionKey: 'speed',
            conditionValue: 'common+rare+epic',
            chainKey: 'speed',
            effectKey: 'legendary_speed_unlocked',
            effectValue: true,
            priority: 'P0'
        }),
        createDef({
            key: 'legendary_crit',
            unlockType: 'legendary',
            title: '传奇暴击条目已入池',
            description: '命运之眼已加入掉落池',
            type: 'legendary_chain',
            conditionKey: 'crit',
            conditionValue: 'common+rare+epic',
            chainKey: 'crit',
            effectKey: 'legendary_crit_unlocked',
            effectValue: true,
            priority: 'P0'
        }),
        createDef({
            key: 'legendary_gold',
            unlockType: 'legendary',
            title: '传奇金币条目已入池',
            description: '金库契约已加入掉落池',
            type: 'legendary_chain',
            conditionKey: 'gold',
            conditionValue: 'common+rare+epic',
            chainKey: 'gold',
            effectKey: 'legendary_gold_unlocked',
            effectValue: true,
            priority: 'P0'
        }),
        createDef({
            key: 'legendary_exp',
            unlockType: 'legendary',
            title: '传奇经验条目已入池',
            description: '启示圣典已加入掉落池',
            type: 'legendary_chain',
            conditionKey: 'exp',
            conditionValue: 'common+rare+epic',
            chainKey: 'exp',
            effectKey: 'legendary_exp_unlocked',
            effectValue: true,
            priority: 'P0'
        })
    ];

    global.MetaUnlockData = {
        defs,
        byKey: Object.freeze(defs.reduce((map, def) => {
            map[def.key] = Object.freeze({ ...def });
            return map;
        }, {}))
    };
})(window);
