# 道具池系统设计

## 七级稀有度完整定义

| 稀有度 | 颜色 | 掉落概率 | 价格区间 | 特点 |
|--------|------|----------|----------|------|
| 普通 Common | 白色 | 50% | 30-60 | 基础属性加成 |
| 优秀 Uncommon | 绿色 | 25% | 60-100 | 实用功能道具 |
| 稀有 Rare | 蓝色 | 15% | 100-180 | 改变攻击方式 |
| 史诗 Epic | 紫色 | 7% | 180-300 | 强力被动效果 |
| 传说 Legendary | 橙色 | 2.5% | 300-500 | 改变游戏机制 |
| 诅咒 Cursed | 红色 | 0.4% | 100-200 | 高风险高回报 |
| 神话 Mythic | 金色 | 0.1% | 500-800 | 一局游戏只能获得1-2个 |

## 道具池分层设计

### 普通池 (1-30级)
- 只掉落白色、绿色、蓝色道具
- 诅咒道具概率降低50%
- 神话道具不掉落

### 高级池 (30-60级)
- 解锁紫色、橙色道具
- 诅咒道具正常概率
- 神话道具0.05%概率

### 地狱池 (60级以上)
- 所有道具可掉落
- 诅咒道具概率翻倍
- 神话道具0.1%概率
- 每10层必出1个橙色道具

## 以撒风格特殊机制

### 1. 道具房间 (Item Room)
每个关卡生成1个道具房间，内含：
- 免费道具1个（无需战斗）
- 必定不低于蓝色品质
- 玩家可选择拿或不拿

### 2. 诅咒房间 (Curse Room)
- 门口有尖刺，进入需扣半颗心
- 内含诅咒道具或高价值道具
- 赌博性质：可能是神装也可能是垃圾

### 3. 天使/恶魔房
- 满足条件后随机出现
- 天使房：防御向强力道具
- 恶魔房：攻击向诅咒道具，需用血量购买

### 4. 商店刷新机制
- 每层商店固定2-4个道具
- 可以用金币刷新（价格递增）
- 传说道具极低概率出现在商店

## 代码结构

```javascript
// 道具池管理器
class ItemPoolManager {
    constructor() {
        this.pools = {
            common: [],    // 白色
            uncommon: [],  // 绿色
            rare: [],      // 蓝色
            epic: [],      // 紫色
            legendary: [], // 橙色
            cursed: [],    // 红色
            mythic: []     // 金色
        };
        this.initializePools();
    }
    
    initializePools() {
        // 根据稀有度自动分类
        for (const [id, item] of Object.entries(ITEMS)) {
            const pool = this.pools[item.rarity];
            if (pool) pool.push(parseInt(id));
        }
    }
    
    // 根据玩家等级和当前层数获取随机道具
    getRandomItem(playerLevel, floor, luck = 0) {
        // 运气值影响稀有度概率
        const adjustedRarity = this.adjustRarityByLuck(luck);
        
        // 根据层级限制可用池子
        const availablePools = this.getAvailablePools(floor);
        
        // 加权随机选择
        const rarity = this.weightedRandom(adjustedRarity);
        const pool = availablePools[rarity];
        
        return pool[Math.floor(Math.random() * pool.length)];
    }
    
    // 从道具池移除（已获取）
    removeFromPool(itemId) {
        const item = ITEMS[itemId];
        const pool = this.pools[item.rarity];
        const idx = pool.indexOf(itemId);
        if (idx > -1) pool.splice(idx, 1);
    }
}
```
