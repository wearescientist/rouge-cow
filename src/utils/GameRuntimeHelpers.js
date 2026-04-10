(function attachGameRuntimeHelpers(global) {
    'use strict';

    function createEnemy(x, y, typeKey, tier = 1) {
        if (typeof global.NewEnemy !== 'undefined') {
            return new global.NewEnemy(x, y, typeKey, tier);
        }
        throw new Error('NewEnemy runtime is not available');
    }

    function createBoss(x, y, floorNum) {
        if (typeof global.NewBoss !== 'undefined') {
            return new global.NewBoss(x, y, floorNum);
        }
        throw new Error('NewBoss runtime is not available');
    }

    function rand(min, max) {
        return Math.random() * (max - min) + min;
    }

    function randChoice(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    function getItemPrice(itemId) {
        const item = global.ITEMS?.[itemId];
        if (!item) return 300;
        const basePrice = (item.price || 50) * 3;
        const variance = basePrice * 0.2;
        return Math.floor(basePrice + rand(-variance, variance));
    }

    function getRarityColor(rarity) {
        return global.RARITY_COLORS?.[rarity] || '#ffffff';
    }

    function getRarityName(rarity) {
        const names = {
            common: '普通',
            uncommon: '优秀',
            rare: '稀有',
            epic: '史诗',
            legendary: '传说',
            cursed: '诅咒',
            mythic: '神话'
        };
        return names[rarity] || '未知';
    }

    global.createEnemy = createEnemy;
    global.createBoss = createBoss;
    global.rand = rand;
    global.randChoice = randChoice;
    global.getItemPrice = getItemPrice;
    global.getRarityColor = getRarityColor;
    global.getRarityName = getRarityName;
})(typeof window !== 'undefined' ? window : globalThis);
