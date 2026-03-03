# 道具系统重构设计 v1.0 - 基础框架

## 1. 核心架构

```javascript
// ==================== 道具系统核心 ====================
class ItemSystem {
    constructor() {
        // 每层独立的道具池
        this.floorPools = new Map(); // floor -> {rarity: [itemIds]}
        
        // 已获得的道具（不叠加，每件都独立生效）
        this.acquiredItems = [];
        
        // 道具效果管理器
        this.effectManager = new ItemEffectManager();
    }
    
    // 初始化某层道具池
    initFloorPool(floor) {
        const pool = {
            common: [...COMMON_ITEMS],
            uncommon: [...UNCOMMON_ITEMS],
            rare: [...RARE_ITEMS],
            epic: [...EPIC_ITEMS],
            legendary: [...LEGENDARY_ITEMS],
            cursed: [...CURSED_ITEMS],
            mythic: [...MYTHIC_ITEMS]
        };
        
        // 根据层数调整池子大小
        const sizes = FLOOR_POOL_SIZES[floor];
        for (const [rarity, size] of Object.entries(sizes)) {
            pool[rarity] = this.shuffle(pool[rarity]).slice(0, size);
        }
        
        this.floorPools.set(floor, pool);
    }
    
    // 从当前层道具池抽取
    drawItem(rarity = null) {
        const floor = window.game.currentFloor;
        const pool = this.floorPools.get(floor);
        
        if (!rarity) {
            rarity = this.rollRarity();
        }
        
        if (pool[rarity].length === 0) {
            // 该稀有度池子空了，降级抽取
            const lower = getLowerRarity(rarity);
            if (lower) return this.drawItem(lower);
            return null;
        }
        
        // 从池子中移除并返回
        const itemId = pool[rarity].shift();
        return ITEMS_DATABASE[itemId];
    }
}
```

## 2. 稀有度定义

```javascript
const RARITY = {
    common:    { id: 'common',    name: '普通', color: '#ffffff', weight: 5000, priceMin: 50, priceMax: 100 },
    uncommon:  { id: 'uncommon',  name: '优秀', color: '#44ff44', weight: 2500, priceMin: 100, priceMax: 200 },
    rare:      { id: 'rare',      name: '稀有', color: '#4488ff', weight: 1500, priceMin: 200, priceMax: 400 },
    epic:      { id: 'epic',      name: '史诗', color: '#aa44ff', weight: 700,  priceMin: 400, priceMax: 800 },
    legendary: { id: 'legendary', name: '传说', color: '#ff8800', weight: 250,  priceMin: 800, priceMax: 1500 },
    cursed:    { id: 'cursed',    name: '诅咒', color: '#ff4444', weight: 40,   priceMin: 200, priceMax: 600 },
    mythic:    { id: 'mythic',    name: '神话', color: '#ffcc00', weight: 10,   priceMin: 2000, priceMax: 5000 }
};

// 权重总和 = 10000，便于计算概率
```

## 3. 各层道具池大小

```javascript
const FLOOR_POOL_SIZES = {
    1: { common: 15, uncommon: 8,  rare: 4,  epic: 2,  legendary: 0, cursed: 0,  mythic: 0 },
    2: { common: 12, uncommon: 10, rare: 6,  epic: 3,  legendary: 1, cursed: 0,  mythic: 0 },
    3: { common: 10, uncommon: 10, rare: 8,  epic: 4,  legendary: 2, cursed: 1,  mythic: 0 },
    4: { common: 8,  uncommon: 8,  rare: 8,  epic: 6,  legendary: 3, cursed: 1,  mythic: 0 },
    5: { common: 5,  uncommon: 6,  rare: 8,  epic: 8,  legendary: 5, cursed: 2,  mythic: 0 },
    6: { common: 0,  uncommon: 2,  rare: 6,  epic: 10, legendary: 8, cursed: 3,  mythic: 1 }
};
```

## 4. 道具效果类型定义

```javascript
const EFFECT_TYPES = {
    // 基础属性
    DAMAGE_UP: 'damage_up',           // 伤害+%
    ATTACK_SPEED: 'attack_speed',     // 攻速+%
    RANGE_UP: 'range_up',             // 射程+%
    CRIT_CHANCE: 'crit_chance',       // 暴击率+%
    CRIT_DAMAGE: 'crit_damage',       // 暴击伤害+%
    
    // 防御生存
    MAX_HP: 'max_hp',                 // 最大生命+固定值
    ARMOR: 'armor',                   // 护甲+固定值
    REGEN: 'regen',                   // 生命回复/秒
    DODGE: 'dodge',                   // 闪避率+%
    SHIELD: 'shield',                 // 护盾层数
    
    // 移动机动
    MOVE_SPEED: 'move_speed',         // 移速+%
    DASH_CD: 'dash_cd',               // 冲刺CD-%
    DASH_COUNT: 'dash_count',         // 冲刺次数+1
    
    // 武器改造
    MULTISHOT: 'multishot',           // 多重射击
    PIERCE: 'pierce',                 // 穿透+
    BOUNCE: 'bounce',                 // 弹射+
    HOMING: 'homing',                 // 追踪
    EXPLOSIVE: 'explosive',           // 爆炸范围+%
    
    // 特殊机制
    LIFE_STEAL: 'life_steal',         // 生命偷取+%
    EXECUTE: 'execute',               // 处决阈值-%
    COOLDOWN: 'cooldown',             // 冷却-%
    AOE_RADIUS: 'aoe_radius',         // AOE范围+%
    
    // 资源经济
    GOLD_BONUS: 'gold_bonus',         // 金币获取+%
    EXP_BONUS: 'exp_bonus',           // 经验获取+%
    DROP_RATE: 'drop_rate',           // 掉落率+%
    
    // 诅咒效果（双刃剑）
    CURSED_DAMAGE: 'cursed_damage',   // 伤害+30%，受伤+20%
    CURSED_SPEED: 'cursed_speed',     // 攻速+40%，移速-20%
    BLOOD_PRICE: 'blood_price',       // 伤害+50%，持续掉血
    GLASS_CANNON: 'glass_cannon'      // 伤害+100%，生命-50%
};
```

## 5. 本轮迭代目标

- [x] 确定七级稀有度系统
- [x] 设计道具池机制
- [x] 定义效果类型
- [ ] 具体道具设计（第二轮）
- [ ] 价格平衡（第三轮）
- [ ] 效果实装（第四轮）
- [ ] 集成测试（第五轮）

---
*第一轮完成 - 2026-03-02*
