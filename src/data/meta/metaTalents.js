(function attachMetaTalents(global) {
    'use strict';

    const defs = [
        {
            key: 'hp',
            tier: 1,
            title: '坚骨',
            name: '生命强化',
            icon: '❤️',
            type: '基础属性',
            effectDesc: '开局生命上限增加',
            effectKey: 'max_hp_flat',
            values: [1, 1, 1],
            displayValues: ['+1', '+1', '+1'],
            costs: [1, 2, 3],
            maxLevel: 3,
            unlockCondition: '第1层默认开启',
            unlockRequirement: { tiers: [], investments: 0 },
            desc: '生命上限提高。'
        },
        {
            key: 'final_dmg',
            tier: 1,
            title: '锋芒',
            name: '伤害强化',
            icon: '⚔️',
            type: '基础属性',
            effectDesc: '最终伤害提升',
            effectKey: 'final_damage_percent',
            values: [4, 4, 4],
            displayValues: ['+4%', '+4%', '+4%'],
            costs: [1, 2, 3],
            maxLevel: 3,
            unlockCondition: '第1层默认开启',
            unlockRequirement: { tiers: [], investments: 0 },
            desc: '最终伤害提高。'
        },
        {
            key: 'move_speed',
            tier: 1,
            title: '逐风',
            name: '移速强化',
            icon: '💨',
            type: '基础属性',
            effectDesc: '移速提升',
            effectKey: 'move_speed_percent',
            values: [3, 3, 4],
            displayValues: ['+3%', '+3%', '+4%'],
            costs: [1, 2, 3],
            maxLevel: 3,
            unlockCondition: '第1层默认开启',
            unlockRequirement: { tiers: [], investments: 0 },
            desc: '移动速度提高。'
        },
        {
            key: 'exp_gain',
            tier: 1,
            title: '博闻',
            name: '成长强化',
            icon: '📘',
            type: '基础属性',
            effectDesc: '经验获取提升',
            effectKey: 'exp_gain_percent',
            values: [6, 6, 8],
            displayValues: ['+6%', '+6%', '+8%'],
            costs: [1, 2, 3],
            maxLevel: 3,
            unlockCondition: '第1层默认开启',
            unlockRequirement: { tiers: [], investments: 0 },
            desc: '经验获取提高。'
        },
        {
            key: 'start_gold',
            tier: 1,
            title: '盘缠',
            name: '开局金币',
            icon: '🪙',
            type: '基础属性',
            effectDesc: '新局初始金币增加',
            effectKey: 'start_gold_flat',
            values: [30, 30, 40],
            displayValues: ['+30', '+30', '+40'],
            costs: [1, 2, 3],
            maxLevel: 3,
            unlockCondition: '第1层默认开启',
            unlockRequirement: { tiers: [], investments: 0 },
            desc: '开局金币增加。'
        },
        {
            key: 'shop_discount',
            tier: 2,
            title: '市契',
            name: '商道',
            icon: '🎫',
            type: '经济/掉落',
            effectDesc: '商店升级',
            effectKey: 'shop_discount_mode',
            values: ['half_first_item', 'free_first_item', 'free_first_item_plus_one_refresh'],
            displayValues: ['首件商品半价', '首件商品免费', '首件商品免费 + 1 次免费刷新'],
            costs: [3, 4, 5],
            maxLevel: 3,
            unlockCondition: '第1层累计投入 5 次',
            unlockRequirement: { tiers: [1], investments: 5 },
            desc: '强化商店经济收益。'
        },
        {
            key: 'weapon_extra_pick',
            tier: 2,
            title: '识武',
            name: '武器偏爱',
            icon: '🗡️',
            type: '经济/掉落',
            effectDesc: '升级/武器箱免费刷新',
            effectKey: 'weapon_refresh_bonus',
            values: [1, 1, 1],
            displayValues: ['免费刷新 1 次', '免费刷新 1 次', '免费刷新 1 次'],
            costs: [4, 6, 8],
            maxLevel: 3,
            unlockCondition: '第1层累计投入 5 次',
            unlockRequirement: { tiers: [1], investments: 5 },
            desc: '每局获得免费刷新次数，可用于升级面板与武器箱。'
        },
        {
            key: 'start_weapon_lv1',
            tier: 2,
            title: '先手',
            name: '先手',
            icon: '🔧',
            type: '经济/掉落',
            effectDesc: '开局主武器直接 +1 级',
            effectKey: 'start_weapon_level_bonus',
            values: [1],
            displayValues: ['开局主武器 +1 级'],
            costs: [4],
            maxLevel: 1,
            unlockCondition: '第1层累计投入 5 次',
            unlockRequirement: { tiers: [1], investments: 5 },
            desc: '开局武器等级+1。'
        },
        {
            key: 'luck_up',
            tier: 2,
            title: '鸿运',
            name: '幸运天平',
            icon: '🍀',
            type: '经济/掉落',
            effectDesc: '高品质候选权重提升',
            effectKey: 'luck_flat',
            values: [1, 1, 1],
            displayValues: ['幸运 +1', '幸运 +1', '幸运 +1'],
            costs: [4, 6, 8],
            maxLevel: 3,
            unlockCondition: '第1层累计投入 5 次',
            unlockRequirement: { tiers: [1], investments: 5 },
            desc: '高品质候选权重提升。'
        },
        {
            key: 'boss_core_plus',
            tier: 2,
            title: '碎核',
            name: '晶核增幅',
            icon: '💎',
            type: '经济/掉落',
            effectDesc: 'Boss 晶核掉落增加',
            effectKey: 'boss_core_bonus',
            values: [1, 1],
            displayValues: ['Boss 晶核掉落 +1', 'Boss 晶核掉落 +1'],
            costs: [5, 8],
            maxLevel: 2,
            unlockCondition: '第1层累计投入 5 次',
            unlockRequirement: { tiers: [1], investments: 5 },
            desc: 'Boss 核心收益增加。'
        },
        {
            key: 'survive_once',
            tier: 3,
            title: '余烬',
            name: '保险',
            icon: '🕯️',
            type: '特权',
            effectDesc: '每局首次致命伤保留 1 点生命',
            effectKey: 'revive_once_at_1hp',
            values: [1],
            displayValues: ['每局 1 次'],
            costs: [10],
            maxLevel: 1,
            unlockCondition: '第1 + 2 层累计投入 12 次',
            unlockRequirement: { tiers: [1, 2], investments: 12 },
            desc: '每局一次濒死复苏。'
        },
        {
            key: 'elite_start_bonus',
            tier: 3,
            title: '先发补给',
            name: '开局资源包',
            icon: '🎁',
            type: '特权',
            effectDesc: '新局额外获得 1 个随机普通道具',
            effectKey: 'start_random_normal_item_pack',
            values: [1],
            displayValues: ['额外 1 包'],
            costs: [8],
            maxLevel: 1,
            unlockCondition: '第1 + 2 层累计投入 12 次',
            unlockRequirement: { tiers: [1, 2], investments: 12 },
            desc: '开局额外获得一组普通道具。当前仍建议谨慎启用。',
            disabled: true
        }
    ];

    function getTalentCost(def, level) {
        if (!def) return 0;
        const index = Math.max(0, Number(level) || 0);
        return Math.max(0, Number(def.costs?.[index]) || 0);
    }

    function formatTalentValue(def, index) {
        if (!def || index < 0 || index >= def.maxLevel) return '无';
        if (Array.isArray(def.displayValues) && def.displayValues[index]) {
            return String(def.displayValues[index]);
        }
        const value = def.values[index];
        switch (def.effectKey) {
            case 'final_damage_percent':
            case 'move_speed_percent':
            case 'exp_gain_percent':
                return `+${value}%`;
            case 'max_hp_flat':
            case 'start_gold_flat':
            case 'luck_flat':
            case 'boss_core_bonus':
            case 'weapon_refresh_bonus':
            case 'start_weapon_level_bonus':
                return `+${value}`;
            case 'revive_once_at_1hp':
                return '每局 1 次';
            case 'shop_discount_mode':
                return String(def.displayValues?.[index] || value);
            default:
                return String(value);
        }
    }

    function getTalentTotalValue(def, level) {
        if (!def || !Number.isFinite(level) || level <= 0) return 0;
        const capped = Math.min(def.maxLevel, Math.max(0, Number(level) || 0));
        switch (def.effectKey) {
            case 'shop_discount_mode':
                return def.values?.[capped - 1] || '';
            case 'revive_once_at_1hp':
                return capped > 0 ? 1 : 0;
            default:
                return (def.values || []).slice(0, capped).reduce((sum, value) => sum + (Number(value) || 0), 0);
        }
    }

    function formatTalentProgress(def, level) {
        if (!def) return '无';
        const capped = Math.min(def.maxLevel, Math.max(0, Number(level) || 0));
        if (capped <= 0) return '尚未投入';
        const total = getTalentTotalValue(def, capped);
        switch (def.effectKey) {
            case 'final_damage_percent':
            case 'move_speed_percent':
            case 'exp_gain_percent':
                return `+${total}%`;
            case 'max_hp_flat':
            case 'start_gold_flat':
            case 'luck_flat':
            case 'boss_core_bonus':
            case 'start_weapon_level_bonus':
                return `+${total}`;
            case 'weapon_refresh_bonus':
                return `免费刷新 ${total} 次`;
            case 'revive_once_at_1hp':
                return '每局 1 次';
            case 'shop_discount_mode':
                return String(def.displayValues?.[capped - 1] || total || '无');
            default:
                return String(total);
        }
    }

    function formatTalentNextValue(def, level) {
        if (!def) return '无';
        const capped = Math.max(0, Number(level) || 0);
        if (capped >= def.maxLevel) return '已满级';
        return formatTalentProgress(def, capped + 1);
    }

    global.MetaTalentData = {
        defs,
        getTalentCost,
        formatTalentValue,
        getTalentTotalValue,
        formatTalentProgress,
        formatTalentNextValue,
        byKey: Object.freeze(defs.reduce((map, def) => {
            map[def.key] = Object.freeze({ ...def });
            return map;
        }, {}))
    };
})(window);
