# 道具系统重构设计 v3.0 - 价格平衡与概率

## 1. 详细价格表

### 普通（白色）- 30个
```javascript
const COMMON_PRICES = {
    // 基础属性类
    'whetstone': 50,      // 磨刀石 - 伤害+10%
    'light_gloves': 60,   // 轻手套 - 攻速+15%
    'telescope': 70,      // 望远镜 - 射程+20%
    'apple': 40,          // 红苹果 - 生命+1
    'bread': 70,          // 面包 - 生命+2
    'leather_armor': 60,  // 皮甲 - 护甲+1
    'running_shoes': 50,  // 跑鞋 - 移速+10%
    'bandage': 55,        // 绷带 - 回复+0.5/s
    'lucky_coin': 80,     // 幸运币 - 金币+15%
    'notebook': 75,       // 笔记本 - 经验+15%
    
    // 武器类
    'extra_arrow': 80,    // 额外箭矢 - 多重+1
    'sharp_tip': 70,      // 锋利箭头 - 穿透+1
    'rubber_coating': 65, // 橡胶涂层 - 弹射+1
    'heavy_head': 60,     // 重型弹头 - 子弹大小+20%
    'quick_reload': 75,   // 快速装填 - 冷却-10%
    'extended_mag': 70,   // 扩容弹夹
    'stabilizer': 65,     // 稳定器
    'magnifying_lens': 80,// 放大镜 - 暴击+5%
    'gunpowder': 70,      // 火药粉 - 爆炸+15%
    'wind_enchant': 60,   // 风之附魔 - 子弹速度+20%
    
    // 防御类
    'small_shield': 75,   // 小圆盾 - 格挡
    'first_aid': 50,      // 急救包（一次性治疗）
    'dodge_boots': 70,    // 闪避靴 - 闪避+5%
    'hp_potion': 45,      // 生命药水 - 拾取回血
    'iron_ring': 65,      // 铁指环 - 减伤
    'repel_ring': 60,     // 排斥指环
    'timer': 55,          // 定时器 - 冲刺CD
    'energy_drink': 60,   // 能量饮料
    'magnet': 70,         // 小磁铁
    'safety_ring': 85     // 安全护符
};
```

### 优秀（绿色）- 20个
```javascript
const UNCOMMON_PRICES = {
    'iron_sword': 120,        // 铁剑 - 伤害+20%
    'chain_mail': 130,        // 锁子甲
    'steak': 150,             // 牛排 - 生命+3
    'green_herb': 110,        // 草药 - 回复+1/s
    'roller_skates': 140,     // 轮滑鞋
    
    'double_shot': 180,       // 双重射击
    'drill_tip': 160,         // 钻头箭头
    'super_ball': 170,        // 超级弹球
    'laser_sight': 175,       // 激光瞄准
    'homing_module': 185,     // 追踪模块
    
    'medkit': 190,            // 医疗箱
    'barrier_device': 175,    // 屏障装置
    'evasion_cape': 180,      // 闪避斗篷
    'thorn_bush': 160,        // 荆棘丛
    'vampire_fang': 195,      // 吸血獠牙
    
    'piggy_bank': 170,        // 存钱罐
    'wise_book': 165,         // 智慧书
    'clover': 185,            // 四叶草
    'alarm_clock': 175,       // 闹钟
    'safety_helmet': 155      // 安全帽
};
```

### 稀有（蓝色）- 18个
```javascript
const RARE_PRICES = {
    'magic_sword': 250,       // 魔法剑
    'plate_armor': 300,       // 板甲
    'titan_blood': 350,       // 泰坦之血
    
    'triple_shot': 380,       // 三重射击
    'plasma_tip': 320,        // 等离子箭头
    'time_bullet': 290,       // 时停子弹
    
    'auto_heal': 400,         // 自动治疗
    'resurrection_stone': 450,// 复活石
    'force_field': 380,       // 力场发生器
    
    'weapon_fusion': 420,     // 武器融合器
    'skill_book': 350,        // 技能书
    'explosive_shot': 320,    // 爆炸射击
    'chain_lightning': 340,   // 连锁闪电
    'execute_blade': 310,     // 处决之刃
    'blood_sword': 360,       // 血之剑
    'gold_midas': 330,        // 点金手
    'exp_magnet': 300,        // 经验磁铁
    'summon_scroll': 340      // 召唤卷轴
};
```

### 史诗（紫色）- 14个
```javascript
const EPIC_PRICES = {
    'dragon_sword': 650,      // 龙鳞剑
    'diamond_armor': 700,     // 钻石甲
    'phoenix_feather': 800,   // 凤凰羽毛
    
    'quintuple_shot': 750,    // 五重射击
    'black_hole_gun': 780,    // 黑洞发生器
    'laser_beam': 720,        // 激光束
    
    'immortal_body': 850,     // 不朽之身
    'mirror_shield': 680,     // 镜盾
    
    'weapon_mastery': 820,    // 武器精通
    'crit_master': 700,       // 暴击大师
    'time_stop': 900,         // 时间停止器
    'necronomicon': 750,      // 死灵书
    'rainbow_gem': 720,       // 彩虹宝石
    'divine_blessing': 680    // 神圣祝福
};
```

### 传说（橙色）- 10个
```javascript
const LEGENDARY_PRICES = {
    'excalibur': 1200,        // 王者之剑
    'aegis': 1400,            // 宙斯盾
    'phoenix_heart': 1500,    // 凤凰之心
    'octuple_shot': 1300,     // 八重齐射
    'black_hole_core': 1450,  // 黑洞核心
    'god_mode': 1350,         // 神模式
    'vampire_lord': 1480,     // 吸血鬼领主
    'master_of_arms': 1380,   // 武器大师
    'eternal_gold': 1250,     // 永恒黄金
    'reality_anchor': 1420    // 现实锚点
};
```

### 诅咒（红色）- 6个
```javascript
const CURSED_PRICES = {
    'demon_pact': 200,        // 恶魔契约 - 便宜但有代价
    'glass_body': 250,        // 玻璃身躯
    'blood_rage': 350,        // 血怒 - 中等价格
    'soul_trade': 500,        // 灵魂交易 - 贵但值
    'doom_clock': 300,        // 末日时钟
    'chaos_orb': 400          // 混沌之球
};
```

### 神话（金色）- 2个
```javascript
const MYTHIC_PRICES = {
    'omnipotence': 5000,      // 全能之石
    'world_breaker': 3500     // 世界破坏者
};
```

---

## 2. 完整概率系统

### 基础权重表
```javascript
const RARITY_WEIGHTS = {
    common: 5000,      // 50.00%
    uncommon: 2500,    // 25.00%
    rare: 1500,        // 15.00%
    epic: 700,         // 7.00%
    legendary: 250,    // 2.50%
    cursed: 40,        // 0.40%
    mythic: 10         // 0.10%
};
// 总计: 10000
```

### 各层概率调整
```javascript
const FLOOR_RARITY_MODIFIERS = {
    // 格式: {rarity: 倍率}
    1: {
        common: 1.0, uncommon: 0.8, rare: 0.5, epic: 0.3, legendary: 0, cursed: 0, mythic: 0
    },
    2: {
        common: 0.9, uncommon: 1.0, rare: 0.7, epic: 0.5, legendary: 0.5, cursed: 0, mythic: 0
    },
    3: {
        common: 0.8, uncommon: 1.0, rare: 0.9, epic: 0.7, legendary: 1.0, cursed: 0.5, mythic: 0
    },
    4: {
        common: 0.7, uncommon: 0.9, rare: 1.0, epic: 1.0, legendary: 1.5, cursed: 0.8, mythic: 0
    },
    5: {
        common: 0.5, uncommon: 0.7, rare: 1.1, epic: 1.3, legendary: 2.0, cursed: 1.2, mythic: 0.5
    },
    6: {
        common: 0, uncommon: 0.3, rare: 1.0, epic: 1.5, legendary: 3.0, cursed: 2.0, mythic: 1.0
    }
};
```

### 实际概率计算
```javascript
function calculateRarityWeights(floor) {
    const base = { ...RARITY_WEIGHTS };
    const mod = FLOOR_RARITY_MODIFIERS[floor];
    
    const adjusted = {};
    for (const [rarity, weight] of Object.entries(base)) {
        adjusted[rarity] = Math.floor(weight * (mod[rarity] || 1));
    }
    
    return adjusted;
}

// 各层实际概率示例:
const FLOOR_PROBABILITIES = {
    1: { common: 62.5, uncommon: 20.0, rare: 9.4, epic: 4.7, legendary: 0, cursed: 0, mythic: 0 },
    2: { common: 52.9, uncommon: 24.7, rare: 13.0, epic: 6.5, legendary: 1.3, cursed: 0, cursed: 0 },
    3: { common: 44.4, uncommon: 22.2, rare: 15.0, epic: 8.3, legendary: 2.2, cursed: 0.3, mythic: 0 },
    4: { common: 38.9, uncommon: 20.0, rare: 16.7, epic: 10.0, legendary: 3.3, cursed: 0.6, mythic: 0 },
    5: { common: 28.6, uncommon: 16.7, rare: 17.6, epic: 13.2, legendary: 5.5, cursed: 1.1, mythic: 0.1 },
    6: { common: 0, uncommon: 6.7, rare: 16.7, epic: 17.9, legendary: 10.7, cursed: 2.4, mythic: 0.6 }
};
```

---

## 3. 商店系统

### 商店刷新价格
```javascript
const SHOP_REFRESH_PRICES = {
    1: 50,
    2: 75,
    3: 100,
    4: 150,
    5: 200,
    6: 300
};
```

### 商店商品数量
```javascript
const SHOP_ITEM_COUNTS = {
    1: 3,  // 第1层: 3个道具
    2: 3,
    3: 4,  // 第3层起: 4个道具
    4: 4,
    5: 5,  // 第5层起: 5个道具
    6: 5
};
```

### 商店稀有度保底
```javascript
const SHOP_GUARANTEES = {
    1: { minRarity: 'common',    maxRarity: 'rare' },
    2: { minRarity: 'common',    maxRarity: 'rare' },
    3: { minRarity: 'uncommon',  maxRarity: 'epic' },
    4: { minRarity: 'uncommon',  maxRarity: 'epic' },
    5: { minRarity: 'rare',      maxRarity: 'legendary' },
    6: { minRarity: 'epic',      maxRarity: 'mythic' }
};
```

---

## 4. 掉落系统

### 敌人掉落概率
```javascript
const ENEMY_DROP_CHANCES = {
    tier1: {        // 普通怪
        base: 0.05,  // 5%基础掉率
        goldBonus: 0.001 // 每金币+0.1%
    },
    tier2: {        // 精英怪
        base: 0.15,  // 15%
        guaranteedRarity: 'uncommon' // 至少绿色
    },
    tier3: {        // 小Boss
        base: 0.50,  // 50%
        guaranteedRarity: 'rare' // 至少蓝色
    },
    tier4: {        // Boss
        base: 1.0,   // 100%
        guaranteedRarity: 'epic', // 至少紫色
        extraRolls: 2 // 额外2次抽取机会，选最好的
    }
};
```

### 宝箱掉落
```javascript
const CHEST_REWARDS = {
    normal: {
        itemCount: 1,
        rarityBoost: 0 // 无加成
    },
    golden: {
        itemCount: 2,
        rarityBoost: 1 // 稀有度+1级
    },
    boss: {
        itemCount: 3,
        rarityBoost: 2, // 稀有度+2级
        guaranteeOne: 'epic' // 至少1个史诗
    }
};
```

---

## 5. 本轮完成

- [x] 100个道具详细定价
- [x] 7级稀有度概率系统
- [x] 各层概率调整
- [x] 商店系统参数
- [x] 敌人掉落系统

---
*第三轮完成 - 2026-03-02*
