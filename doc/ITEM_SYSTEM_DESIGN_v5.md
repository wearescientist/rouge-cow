# 道具系统重构设计 v5.0 - 最终整合方案

## 1. 完整文件结构

```
rougelike-cow/
├── src/
│   ├── items/
│   │   ├── index.js           # 主入口，导出所有道具相关
│   │   ├── database.js        # 100个道具数据定义
│   │   ├── system.js          # ItemSystem核心类
│   │   ├── effectManager.js   # ItemEffectManager效果管理
│   │   ├── shop.js            # 商店系统
│   │   ├── drops.js           # 掉落系统
│   │   └── visuals.js         # 视觉效果（粒子/动画）
│   └── ...
└── doc/
    └── ITEM_SYSTEM_DESIGN.md  # 完整设计文档
```

## 2. 完整数据库定义

```javascript
// src/items/database.js

// 稀有度定义
export const RARITY = {
    common:    { id: 'common',    name: '普通', color: '#ffffff', weight: 5000, priceMin: 50,  priceMax: 100 },
    uncommon:  { id: 'uncommon',  name: '优秀', color: '#44ff44', weight: 2500, priceMin: 100, priceMax: 200 },
    rare:      { id: 'rare',      name: '稀有', color: '#4488ff', weight: 1500, priceMin: 200, priceMax: 400 },
    epic:      { id: 'epic',      name: '史诗', color: '#aa44ff', weight: 700,  priceMin: 400, priceMax: 800 },
    legendary: { id: 'legendary', name: '传说', color: '#ff8800', weight: 250,  priceMin: 800, priceMax: 1500 },
    cursed:    { id: 'cursed',    name: '诅咒', color: '#ff4444', weight: 40,   priceMin: 200, priceMax: 600 },
    mythic:    { id: 'mythic',    name: '神话', color: '#ffcc00', weight: 10,   priceMin: 2000, priceMax: 5000 }
};

// 道具池大小
export const FLOOR_POOL_SIZES = {
    1: { common: 15, uncommon: 8,  rare: 4,  epic: 2,  legendary: 0, cursed: 0,  mythic: 0 },
    2: { common: 12, uncommon: 10, rare: 6,  epic: 3,  legendary: 1, cursed: 0,  mythic: 0 },
    3: { common: 10, uncommon: 10, rare: 8,  epic: 4,  legendary: 2, cursed: 1,  mythic: 0 },
    4: { common: 8,  uncommon: 8,  rare: 8,  epic: 6,  legendary: 3, cursed: 1,  mythic: 0 },
    5: { common: 5,  uncommon: 6,  rare: 8,  epic: 8,  legendary: 5, cursed: 2,  mythic: 0 },
    6: { common: 0,  uncommon: 2,  rare: 6,  epic: 10, legendary: 8, cursed: 3,  mythic: 1 }
};

// 完整道具列表（100个）
export const ITEM_DATABASE = {
    // ========== 普通（30个）==========
    common: [
        { id: 'whetstone', name: '磨刀石', icon: '🗡️', price: 50, effect: { type: 'damage_up', value: 0.10 }, description: '武器伤害+10%' },
        { id: 'light_gloves', name: '轻手套', icon: '🧤', price: 60, effect: { type: 'attack_speed', value: 0.15 }, description: '攻击速度+15%' },
        { id: 'telescope', name: '望远镜', icon: '🔭', price: 70, effect: { type: 'range_up', value: 0.20 }, description: '攻击范围+20%' },
        { id: 'apple', name: '红苹果', icon: '🍎', price: 40, effect: { type: 'max_hp', value: 1 }, description: '最大生命值+1' },
        { id: 'bread', name: '面包', icon: '🍞', price: 70, effect: { type: 'max_hp', value: 2 }, description: '最大生命值+2' },
        { id: 'leather_armor', name: '皮甲', icon: '🦺', price: 60, effect: { type: 'armor', value: 1 }, description: '护甲+1' },
        { id: 'running_shoes', name: '跑鞋', icon: '👟', price: 50, effect: { type: 'move_speed', value: 0.10 }, description: '移动速度+10%' },
        { id: 'bandage', name: '绷带', icon: '🩹', price: 55, effect: { type: 'regen', value: 0.5 }, description: '生命回复+0.5/秒' },
        { id: 'lucky_coin', name: '幸运币', icon: '🪙', price: 80, effect: { type: 'gold_bonus', value: 0.15 }, description: '金币获取+15%' },
        { id: 'notebook', name: '笔记本', icon: '📓', price: 75, effect: { type: 'exp_bonus', value: 0.15 }, description: '经验获取+15%' },
        // ... 继续20个
    ],
    
    // ========== 优秀（20个）==========
    uncommon: [
        { id: 'iron_sword', name: '铁剑', icon: '⚔️', price: 120, effect: { type: 'damage_up', value: 0.20 }, description: '武器伤害+20%' },
        { id: 'chain_mail', name: '锁子甲', icon: '🦺', price: 130, effect: { type: 'armor', value: 2, penalty: { move_speed: -0.05 } }, description: '护甲+2，移速-5%' },
        { id: 'steak', name: '牛排', icon: '🥩', price: 150, effect: { type: 'max_hp', value: 3, heal_full: true }, description: '最大生命值+3，回复满血' },
        { id: 'double_shot', name: '双重射击', icon: '📏', price: 180, effect: { type: 'multishot', value: 2 }, description: '投射物数量+2' },
        { id: 'vampire_fang', name: '吸血獠牙', icon: '🦷', price: 195, effect: { type: 'life_steal', value: 0.05 }, description: '造成伤害的5%转为生命' },
        // ... 继续15个
    ],
    
    // ========== 稀有（18个）==========
    rare: [
        { id: 'magic_sword', name: '魔法剑', icon: '⚔️', price: 250, effect: { type: 'damage_up', value: 0.35, crit_chance: 0.10 }, description: '武器伤害+35%，暴击率+10%' },
        { id: 'triple_shot', name: '三重射击', icon: '📐', price: 380, effect: { type: 'multishot', value: 3, spread_reduce: 0.20 }, description: '投射物数量+3，散射角度-20%' },
        { id: 'resurrection_stone', name: '复活石', icon: '💎', price: 450, effect: { type: 'revive', heal: 0.50, consumable: true }, description: '死亡时复活，恢复50%生命（一次性）' },
        { id: 'weapon_fusion', name: '武器融合器', icon: '🔀', price: 420, effect: { type: 'weapon_slot', value: 1 }, description: '可以同时激活的武器数+1' },
        // ... 继续14个
    ],
    
    // ========== 史诗（14个）==========
    epic: [
        { id: 'dragon_sword', name: '龙鳞剑', icon: '🐉', price: 650, effect: { type: 'damage_up', value: 0.60, burn: 2 }, description: '武器伤害+60%，攻击附带燃烧（2秒）' },
        { id: 'phoenix_feather', name: '凤凰羽毛', icon: '🪶', price: 800, effect: { type: 'revive_full', speed_bonus: 0.30, duration: 10 }, description: '死亡时满血复活，移速+30%（持续10秒）' },
        { id: 'time_stop', name: '时间停止器', icon: '⏱️', price: 900, effect: { type: 'time_stop', interval: 45, duration: 3 }, description: '每45秒触发时间停止3秒（敌人静止）' },
        // ... 继续11个
    ],
    
    // ========== 传说（10个）==========
    legendary: [
        { id: 'excalibur', name: '王者之剑', icon: '⚔️', price: 1200, effect: { type: 'damage_up', value: 1.0, sword_beam: { pierce: 999, range: 9999 } }, description: '武器伤害+100%，攻击发射剑气（穿透+无限距离）' },
        { id: 'phoenix_heart', name: '凤凰之心', icon: '❤️', price: 1500, effect: { type: 'infinite_revive', invincible_on_revive: 5, damage_bonus: 0.30 }, description: '无限复活（每次复活后5秒无敌），伤害+30%' },
        { id: 'octuple_shot', name: '八重齐射', icon: '🎆', price: 1300, effect: { type: 'multishot', value: 8, infinite_ammo: true }, description: '投射物数量+8，弹药无限' },
        // ... 继续7个
    ],
    
    // ========== 诅咒（6个）==========
    cursed: [
        { id: 'demon_pact', name: '恶魔契约', icon: '📜', price: 200, effect: { type: 'damage_up', value: 1.0, hp_drain: 0.01 }, description: '伤害+100%，但每秒失去1%生命' },
        { id: 'glass_body', name: '玻璃身躯', icon: '🪞', price: 250, effect: { type: 'damage_up', value: 1.50, damage_taken: 1.0 }, description: '伤害+150%，受到伤害+100%' },
        { id: 'soul_trade', name: '灵魂交易', icon: '💀', price: 500, effect: { type: 'give_legendary', count: 3, max_hp_penalty: 0.50 }, description: '立即获得3个随机传说道具，最大生命-50%' },
        // ... 继续3个
    ],
    
    // ========== 神话（2个）==========
    mythic: [
        { id: 'omnipotence', name: '全能之石', icon: '💎', price: 5000, effect: { type: 'omnipotence', damage: 2.0, attack_speed: 1.0, move_speed: 0.50, max_hp: 1.0, infinite_revive: true, screen_damage: { interval: 1, damage_mult: 0.5 } }, description: '伤害+200%，攻速+100%，移速+50%，生命+100%，无限复活，全屏伤害' },
        { id: 'world_breaker', name: '世界破坏者', icon: '🔨', price: 3500, effect: { type: 'one_shot', works_on_boss: true, charges_per_floor: 1 }, description: '一击必杀（对Boss也有效），但每层只能使用1次' }
    ]
};

// 道具ID到稀有度的映射
export const ITEM_RARITY_MAP = {};
for (const [rarity, items] of Object.entries(ITEM_DATABASE)) {
    for (const item of items) {
        ITEM_RARITY_MAP[item.id] = rarity;
    }
}
```

## 3. 快速实现检查清单

### 阶段1：基础框架（1-2小时）
- [ ] 创建 `src/items/database.js` - 复制上面的数据库
- [ ] 创建 `src/items/system.js` - ItemSystem基础类
- [ ] 修改 `index.html` 引入新系统

### 阶段2：核心功能（2-3小时）
- [ ] 实现道具池初始化
- [ ] 实现抽取逻辑
- [ ] 实现获取道具流程
- [ ] 实现基础效果应用

### 阶段3：系统集成（2-3小时）
- [ ] 修改玩家类，添加 `bonuses` 属性
- [ ] 修改武器系统，读取道具加成
- [ ] 修改伤害计算
- [ ] 修改商店系统，使用新道具

### 阶段4：效果实装（3-4小时）
- [ ] 实现所有被动效果
- [ ] 实现触发效果系统
- [ ] 实现视觉效果
- [ ] 添加UI展示

### 阶段5：测试优化（2-3小时）
- [ ] 平衡测试
- [ ] 价格调整
- [ ] Bug修复

## 4. 关键代码片段

### 在Game类中初始化
```javascript
class Game {
    constructor() {
        // ... 原有初始化
        
        // 初始化道具系统
        this.itemSystem = new ItemSystem();
        this.itemEffectManager = new ItemEffectManager();
        
        // 每层开始时初始化道具池
        this.initItemSystemForFloor(1);
    }
    
    initItemSystemForFloor(floor) {
        this.itemSystem.initFloorPool(floor);
    }
    
    // 进入下一层
    nextFloor() {
        this.currentFloor++;
        this.itemSystem.initFloorPool(this.currentFloor);
    }
}
```

### 商店UI集成
```javascript
// 显示商店
showShop() {
    const shop = this.shopSystem;
    shop.generateItems(this.currentFloor);
    
    // 渲染UI
    const shopUI = document.getElementById('shopUI');
    shopUI.innerHTML = '';
    
    for (let i = 0; i < shop.items.length; i++) {
        const item = shop.items[i];
        const itemEl = document.createElement('div');
        itemEl.className = `shop-item rarity-${item.rarity}`;
        itemEl.innerHTML = `
            <div class="item-icon">${item.icon}</div>
            <div class="item-name">${item.name}</div>
            <div class="item-desc">${item.description}</div>
            <div class="item-price">${item.price}💰</div>
        `;
        itemEl.onclick = () => this.buyShopItem(i);
        shopUI.appendChild(itemEl);
    }
}
```

## 5. 设计总结

### 系统特点
1. **道具池机制** - 每层独立池子，不重复获得
2. **7级稀有度** - 白绿蓝紫橙红金，层次丰富
3. **100个道具** - 数量充足，搭配多样
4. **完整经济** - 掉落/商店/宝箱多渠道获取
5. **效果实装** - 所有道具都有实际效果

### 平衡考虑
- 低层以白绿蓝为主，逐步解锁高级道具
- 诅咒道具双刃剑，高风险高回报
- 神话道具极稀有，改变游戏体验
- 价格随层数递增，保持挑战性

### 扩展性
- 易于添加新道具
- 效果类型可扩展
- 支持新稀有度
- 支持新效果类型

---

**五轮设计迭代完成！**

## 最终交付物

| 文件 | 内容 |
|------|------|
| `ITEM_SYSTEM_DESIGN_v1.md` | 基础框架 |
| `ITEM_SYSTEM_DESIGN_v2.md` | 100个道具清单 |
| `ITEM_SYSTEM_DESIGN_v3.md` | 价格与概率 |
| `ITEM_SYSTEM_DESIGN_v4.md` | 效果实装方案 |
| `ITEM_SYSTEM_DESIGN_v5.md` | 最终整合 |

**等待用户确认后开始实装！**~Meow
