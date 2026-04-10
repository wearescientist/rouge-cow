(function attachMetaAchievements(global) {
    'use strict';

    function createDef(partial) {
        return {
            category: '战斗统计',
            displayMode: 'visible',
            triggerTiming: 'runtime',
            rewardType: 'talent_point',
            rewardKey: 'talent_point',
            linkedUnlockId: '',
            toastTitle: partial.title,
            toastBody: partial.description,
            priority: 'P1',
            enabled: true,
            hint: partial.description,
            ...partial
        };
    }

    function bossFloor(key, floor, title, icon, priority = 'P1') {
        return createDef({
            key,
            title,
            icon,
            category: '主线',
            description: `击败第 ${floor} 层 Boss`,
            hint: `击败第 ${floor} 层 Boss`,
            triggerSummary: `击败第 ${floor} 层 Boss`,
            triggerTiming: 'runtime',
            type: 'boss_floor',
            counterKey: 'best_boss_floor',
            targetValue: floor,
            targetLabel: `第 ${floor} 层 Boss`,
            threshold: floor,
            priority
        });
    }

    function metaStat(key, statKey, value, title, icon, description, category = '战斗统计', priority = 'P1') {
        return createDef({
            key,
            title,
            icon,
            category,
            description,
            triggerSummary: description,
            type: 'meta_stat',
            statKey,
            counterKey: statKey,
            targetValue: value,
            targetLabel: String(value),
            threshold: value,
            priority
        });
    }

    function runStat(key, statKey, value, title, icon, description, category = '战斗统计', priority = 'P1') {
        return createDef({
            key,
            title,
            icon,
            category,
            description,
            triggerSummary: description,
            type: 'run_stat',
            statKey,
            counterKey: statKey,
            targetValue: value,
            targetLabel: String(value),
            threshold: value,
            priority
        });
    }

    function runFlag(key, flagKey, title, icon, description, category = 'Build / 武器', priority = 'P1') {
        return createDef({
            key,
            title,
            icon,
            category,
            description,
            triggerSummary: description,
            type: 'run_flag',
            flagKey,
            counterKey: flagKey,
            targetValue: 1,
            targetLabel: description,
            priority
        });
    }

    function metaFlag(key, flagKey, title, icon, description, linkedUnlockId = '', priority = 'P0') {
        return createDef({
            key,
            title,
            icon,
            category: '主线',
            description,
            triggerSummary: description,
            triggerTiming: 'first_time',
            type: 'flag',
            flagKey,
            scope: 'meta',
            counterKey: flagKey,
            targetValue: 1,
            targetLabel: description,
            linkedUnlockId,
            priority
        });
    }

    function unlockEffect(key, effectKey, title, icon, description, linkedUnlockId, priority = 'P0') {
        return createDef({
            key,
            title,
            icon,
            category: '解锁',
            description,
            triggerSummary: description,
            triggerTiming: 'first_time',
            type: 'unlock_effect',
            effectKey,
            rewardType: 'content_unlock',
            rewardKey: effectKey,
            linkedUnlockId,
            counterKey: effectKey,
            targetValue: 1,
            targetLabel: description,
            priority
        });
    }

    function hiddenFloorComplete(key, floor, title, icon, description, priority = 'P1') {
        return createDef({
            key,
            title,
            icon,
            category: '主线',
            description,
            triggerSummary: description,
            triggerTiming: 'first_time',
            type: 'hidden_floor_completed',
            floor,
            counterKey: `hidden_floor_${floor}_completed`,
            targetValue: 1,
            targetLabel: `第 ${floor} 层未知碑文`,
            priority,
            displayMode: 'mystery',
            mysteryTitle: '？？？',
            mysteryIcon: '❓',
            mysteryDescription: '一段尚未显形的碑文，完成某个未知节点后才会揭晓。',
            mysteryLabel: '未知节点'
        });
    }

    function storyUnlock(key, storyKey, title, icon, description, priority = 'P1') {
        return createDef({
            key,
            title,
            icon,
            category: '主线',
            description,
            triggerSummary: description,
            triggerTiming: 'first_time',
            type: 'story_unlock',
            storyKey,
            counterKey: storyKey,
            targetValue: 1,
            targetLabel: storyKey,
            priority
        });
    }

    const defs = [
        bossFloor('story_floor1_boss', 1, '第一道门', '🐇', 'P0'),
        bossFloor('story_floor2_boss', 2, '暗潮初起', '🦉'),
        bossFloor('story_floor3_boss', 3, '愈发沉重', '🐢', 'P0'),
        bossFloor('story_floor4_boss', 4, '骨火回声', '🦂'),
        bossFloor('story_floor5_boss', 5, '下不去的刀', '🦬', 'P0'),
        bossFloor('story_floor6_boss', 6, '母巢回响', '🕸️', 'P0'),

        metaFlag('fake_ending_clear', 'falseEndingCleared', '假结局', '🌑', '完成假结局', 'bible_unlock', 'P0'),
        metaFlag('true_ending_clear', 'trueEndingCleared', '真结局', '🕯️', '完成真结局', 'scythe_unlock', 'P0'),
        metaFlag('true_route_ever', 'trueRouteEverUnlocked', '裂隙已开', '🫧', '累计开启过真路线', '', 'P0'),
        hiddenFloorComplete('hidden_floor1_complete', 1, '碎石破局', '🧩', '首次完成第 1 层隐藏谜题'),
        hiddenFloorComplete('hidden_floor2_complete', 2, '林间破局', '🧩', '首次完成第 2 层隐藏谜题'),
        hiddenFloorComplete('hidden_floor3_complete', 3, '蘑域破局', '🧩', '首次完成第 3 层隐藏谜题'),
        hiddenFloorComplete('hidden_floor4_complete', 4, '书页破局', '🧩', '首次完成第 4 层隐藏谜题'),
        hiddenFloorComplete('hidden_floor5_complete', 5, '火盏破局', '🧩', '首次完成第 5 层隐藏谜题'),
        hiddenFloorComplete('hidden_floor6_complete', 6, '母巢破局', '🧩', '首次完成第 6 层隐藏谜题', 'P0'),
        storyUnlock('story_father_words', 'father_words', '父亲遗言', '📜', '首次归档父亲残页'),
        storyUnlock('story_mother_words', 'mother_words', '母亲遗言', '📜', '首次归档母亲残页'),
        storyUnlock('story_false_ending_page', 'false_ending', '假结局残页', '🌑', '首次归档假结局碎页', 'P0'),
        storyUnlock('story_dream_gap_page', 'dream_gap', '梦隙残页', '🫧', '首次归档真路线残页', 'P0'),
        storyUnlock('story_truth_corridor_page', 'truth_corridor', '真相回廊', '🕯️', '首次归档真结局残页', 'P0'),

        metaStat('kill_total_1000', 'totalKills', 1000, '初见血潮', '⚔️', '累计击杀达到 1000'),
        metaStat('kill_total_5000', 'totalKills', 5000, '尸山初成', '⚔️', '累计击杀达到 5000'),
        metaStat('kill_total_20000', 'totalKills', 20000, '屠戮成性', '⚔️', '累计击杀达到 20000'),
        metaStat('kill_total_50000', 'totalKills', 50000, '地底天灾', '⚔️', '累计击杀达到 50000', '战斗统计', 'P0'),
        metaStat('kill_total_100000', 'totalKills', 100000, '血雾永昼', '⚔️', '累计击杀达到 100000', '战斗统计', 'P0'),

        runStat('gold_run_1000', 'runPeakGold', 1000, '手头宽裕', '💰', '单局金币达到 1000'),
        runStat('gold_run_2000', 'runPeakGold', 2000, '满仓而归', '💰', '单局金币达到 2000'),
        runStat('gold_run_5000', 'runPeakGold', 5000, '金潮漫洞', '💰', '单局金币达到 5000', '战斗统计', 'P0'),
        runStat('gold_run_8000', 'runPeakGold', 8000, '金库倾覆', '💰', '单局金币达到 8000', '战斗统计', 'P0'),

        runStat('level_run_20', 'runPeakLevel', 20, '一路暴走', '📈', '单局等级达到 20'),
        runStat('level_run_25', 'runPeakLevel', 25, '过载成长', '📈', '单局等级达到 25'),
        runStat('level_run_30', 'runPeakLevel', 30, '碾压构筑', '📈', '单局等级达到 30', '战斗统计', 'P0'),
        runStat('level_run_35', 'runPeakLevel', 35, '满屏溢出', '📈', '单局等级达到 35', '战斗统计', 'P0'),

        runStat('damage_hit_100', 'peakHitDamage', 100, '第一记重击', '💥', '单次命中伤害达到 100'),
        runStat('damage_hit_300', 'peakHitDamage', 300, '撕裂防线', '💥', '单次命中伤害达到 300'),
        runStat('damage_hit_800', 'peakHitDamage', 800, '一刀断相', '💥', '单次命中伤害达到 800', '战斗统计', 'P0'),
        runStat('damage_hit_1500', 'peakHitDamage', 1500, '万雷一线', '💥', '单次命中伤害达到 1500', '战斗统计', 'P0'),

        runFlag('weapon_max_level', 'hasMaxLevelWeapon', '满配就绪', '🛠️', '任意武器首次升到满级'),
        runFlag('first_super_weapon', 'hasSuperWeapon', '第一次超武', '💠', '首次合成超武'),
        runStat('super_weapon_2', 'superWeaponCount', 2, '双超武', '💠', '单局同时拥有 2 把超武', 'Build / 武器'),
        runStat('super_weapon_3', 'superWeaponCount', 3, '三超武', '💠', '单局同时拥有 3 把超武', 'Build / 武器', 'P0'),
        runStat('super_weapon_4', 'superWeaponCount', 4, '军火库失控', '💠', '单局同时拥有 4 把超武', 'Build / 武器', 'P0'),
        runStat('super_weapon_5', 'superWeaponCount', 5, '神兵过载', '💠', '单局同时拥有 5 把超武', 'Build / 武器', 'P0'),
        runStat('super_weapon_6', 'superWeaponCount', 6, '六芒军械库', '💠', '单局同时拥有 6 把超武', 'Build / 武器', 'P0'),

        unlockEffect('unlock_bible', 'weapon_bible_unlocked', '新武器: 武装法典', '📖', '武装法典已加入武器池', 'bible_unlock', 'P0'),
        unlockEffect('unlock_scythe', 'weapon_scythe_unlocked', '新武器: 镰刀', '⚰️', '镰刀已加入武器池', 'scythe_unlock', 'P0'),
        unlockEffect('unlock_storm_axe', 'weapon_storm_axe_unlocked', '新武器: 雷神战斧', '🪓', '雷神战斧已加入武器池', 'storm_axe_unlock', 'P0'),

        metaStat('legendary_first', 'legendaryUnlockCount', 1, '传奇初现', '🌟', '首次解锁任意传奇条目', '图鉴 / 收集', 'P0'),
        metaStat('legendary_three', 'legendaryUnlockCount', 3, '传奇收藏家', '🌟', '累计解锁 3 个传奇条目', '图鉴 / 收集', 'P0'),
        metaStat('legendary_all', 'legendaryUnlockCount', 5, '传奇满谱', '🌟', '累计解锁全部 5 个传奇条目', '图鉴 / 收集', 'P0'),

        metaStat('codex_10', 'codexSeenCount', 10, '图鉴开卷', '📚', '图鉴收集达到 10 项', '图鉴 / 收集'),
        metaStat('codex_30', 'codexSeenCount', 30, '图鉴成册', '📚', '图鉴收集达到 30 项', '图鉴 / 收集'),
        metaStat('codex_60', 'codexSeenCount', 60, '档案扩编', '📚', '图鉴收集达到 60 项', '图鉴 / 收集', 'P0'),

        metaStat('boss_total_10', 'totalBossKills', 10, '猎首学徒', '👑', '累计击败 Boss 达到 10 次', '主线'),
        metaStat('boss_total_30', 'totalBossKills', 30, '猎首常客', '👑', '累计击败 Boss 达到 30 次', '主线', 'P0'),
        metaStat('boss_total_60', 'totalBossKills', 60, '王冠粉碎者', '👑', '累计击败 Boss 达到 60 次', '主线', 'P0'),

        metaStat('runs_total_5', 'totalRuns', 5, '再来一局', '🎲', '累计完成 5 局冒险', '战斗统计'),
        metaStat('runs_total_20', 'totalRuns', 20, '熟门熟路', '🎲', '累计完成 20 局冒险', '战斗统计'),
        metaStat('runs_total_50', 'totalRuns', 50, '把洞窟当家', '🎲', '累计完成 50 局冒险', '战斗统计', 'P0')
    ];

    global.MetaAchievementData = {
        defs,
        byKey: Object.freeze(defs.reduce((map, def) => {
            map[def.key] = Object.freeze({ ...def });
            return map;
        }, {}))
    };
})(window);
