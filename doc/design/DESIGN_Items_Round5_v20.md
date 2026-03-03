# v0.20 第5轮 - 环境互动与特殊机制

## 设计理念
道具不仅改变玩家，还改变整个世界

---

## 🌍 环境互动道具 (206-220)

### 206. 地图改造锤 🔨 [史诗]
**效果**: 可以破坏或创建墙壁
- 3次充能/层
- 创建墙壁阻挡敌人
- 破坏墙壁创造捷径

```javascript
mapHammer: {
    charges: 3,
    perFloor: true,
    canDestroyWall: true,
    canCreateWall: true,
    wallHp: 200
}
```

### 207. 陷阱大师 🕸️ [稀有]
**效果**: 经过的地格留下陷阱
- 陷阱持续30秒
- 敌人踩中受到50伤害+减速
- 队友不会触发

```javascript
trapMaster: {
    leaveTrap: true,
    duration: 30,
    damage: 50,
    slow: 0.5,
    friendlyFire: false
}
```

### 208. 环境适应 🌿 [稀有]
**效果**: 根据当前房间类型获得不同加成
- 普通房间: 移速+20%
- 精英房间: 伤害+30%
- Boss房间: 防御+50%
- 商店: 金币获取+50%

```javascript
envAdapt: {
    normal: { speed: 1.2 },
    elite: { atk: 1.3 },
    boss: { def: 1.5 },
    shop: { gold: 1.5 }
}
```

### 209. 维度行者 🚪 [传说]
**效果**: 可以创建临时门传送到已探索房间
- 门持续10秒
- 可以带队友一起
- 每层3次

```javascript
dimensionWalker: {
    createPortal: true,
    toExplored: true,
    duration: 10,
    charges: 3,
    bringAllies: true
}
```

### 210. 资源枯竭 ⛏️ [诅咒]
**效果**: 本层所有敌人掉落×2，但...
- 下一层敌人血量×2
- 再下一层×3
- 效果可叠加

```javascript
resourceDepletion: {
    thisFloor: { drops: 2.0 },
    nextFloors: { enemyHpMult: 1.0 },
    stacking: true
}
```

### 211. 生态破坏 🌪️ [诅咒]
**效果**: 你可以破坏任何地形，但...
- 破坏越多，敌人越强
- 每破坏一个墙，敌人+2%属性
- 最终Boss获得"复仇"能力

```javascript
ecoDestruction: {
    canBreakAnything: true,
    enemyScalePerBreak: 0.02,
    bossRevenge: true
}
```

### 212. 天气控制 🌧️ [史诗]
**效果**: 改变当前层天气
- 雨天: 雷电伤害+50%
- 雾天: 闪避+30%
- 雷暴: 随机雷击敌人
- 可选，进入层时选择

```javascript
weatherControl: {
    chooseOnEnter: true,
    rain: { thunderDmg: 1.5 },
    fog: { dodge: 0.3 },
    storm: { randomLightning: true }
}
```

### 213. 植物学家 🌱 [稀有]
**效果**: 可以种植各种植物
- 治疗花: 站在附近回血
- 攻击藤蔓: 攻击附近敌人
- 障碍树: 阻挡敌人
- 每层种子有限

```javascript
botanist: {
    seedsPerFloor: 5,
    plants: ['healFlower', 'attackVine', 'barrierTree'],
    healFlower: { hpps: 1, range: 100 },
    attackVine: { dps: 20, range: 150 },
    barrierTree: { hp: 500 }
}
```

### 214. 重力操控 🌍 [传说]
**效果**: 可以改变重力方向
- 上下左右四向可选
- 持续30秒
- 冷却60秒
- 敌人和投射物也受影响

```javascript
gravityCtrl: {
    directions: ['up', 'down', 'left', 'right'],
    duration: 30,
    cd: 60,
    affectsAll: true
}
```

### 215. 光学迷彩 👻 [史诗]
**效果**: 站在特定地形隐形
- 草丛/阴影中隐形
- 隐形时第一击暴击×3
- 移动会短暂显形

```javascript
opticalCamo: {
    invisIn: ['grass', 'shadow'],
    firstStrike: { critDmg: 3.0 },
    fadeOnMove: true,
    fadeTime: 0.5
}
```

### 216. 地震发生器 📳 [史诗]
**效果**: 主动触发地震
- 全屏敌人眩晕3秒
- 墙壁出现裂缝可穿过
- 每层1次

```javascript
earthquake: {
    stunAll: 3,
    crackWalls: true,
    perFloor: 1
}
```

### 217. 液体行走 💧 [稀有]
**效果**: 将液体转化为可行走表面
- 血泊/毒液/火焰变成你的"领域"
- 站在上面获得加成
- 敌人站在上面受到伤害

```javascript
liquidWalk: {
    liquids: ['blood', 'poison', 'fire'],
    selfBonus: { atk: 1.2, speed: 1.1 },
    enemyDamage: 10
}
```

### 218. 建筑师 🏗️ [传说]
**效果**: 可以建造防御工事
- 炮塔: 自动攻击
- 墙: 阻挡敌人
- 治疗站: 范围回血
- 资源: 每层有限材料

```javascript
architect: {
    materials: 10,
    turret: { cost: 3, dps: 30, range: 200 },
    wall: { cost: 2, hp: 500 },
    healStation: { cost: 5, hpps: 2, range: 150 }
}
```

### 219. 回声定位 🔊 [稀有]
**效果**: 发出声波显示周围地形
- 显示隐藏房间
- 显示敌人轮廓
- 可以穿墙"看到"敌人

```javascript
echolocation: {
    revealRange: 400,
    revealHidden: true,
    seeThroughWalls: true,
    pingInterval: 5
}
```

### 220. 世界吞噬者 🌑 [神话]
**效果**: 缓慢吞噬整个世界
- 每过1分钟，当前层缩小10%
- 你获得吞噬的属性加成
- 最后只剩你和Boss在狭小的空间

```javascript
worldEater: {
    shrinkPerMin: 0.1,
    gainStatsByShrink: true,
    finalBossArena: { size: 0.3 }
}
```

---

## 🎲 特殊机制道具 (221-235)

### 221. 交易师 💱 [稀有]
**效果**: 可以用道具交换
- 2个白道具 → 1个绿道具
- 2个绿道具 → 1个蓝道具
- 以此类推

```javascript
trader: {
    recipes: [
        { from: ['common', 'common'], to: 'uncommon' },
        { from: ['uncommon', 'uncommon'], to: 'rare' },
        { from: ['rare', 'rare'], to: 'epic' }
    ]
}
```

### 222. 赌徒牌组 🃏 [史诗]
**效果**: 抽牌系统
- 每层抽3张牌
- 牌有各种效果(攻击/防御/特殊)
- 打光后重新抽

```javascript
gamblerDeck: {
    drawPerFloor: 3,
    cardTypes: ['attack', 'defense', 'special'],
    reshuffle: true
}
```

### 223. 符文雕刻 🔮 [传说]
**效果**: 可以雕刻符文获得永久加成
- 每层可以刻1个符文
- 符文叠加但越来越难
- 失败会诅咒你

```javascript
runeCarving: {
    perFloor: 1,
    successRate: 0.7,  // 递减
    bonuses: ['atk', 'def', 'speed'],
    failCurse: true
}
```

### 224. 契约系统 📜 [史诗]
**效果**: 与"某人"签订契约
- 立即获得强力道具
- 但每层要完成一个任务
- 失败会受到惩罚

```javascript
contract: {
    instantReward: 'legendary',
    taskPerFloor: true,
    failPenalty: 'random'
}
```

### 225. 进化树 🧬 [神话]
**效果**: 道具可以进化
- 相同道具3个 → 进化版
- 进化版保留原效果+新效果
- 有进化路线

```javascript
evolutionTree: {
    need: 3,
    keepOriginal: true,
    addNewEffect: true,
    evolutionPaths: {
        'atkItem': ['critPath', 'speedPath', 'aoePath']
    }
}
```

### 226. 灵魂绑定 👥 [诅咒]
**效果**: 与随机敌人灵魂绑定
- 它受伤你回血
- 你受伤它回血
- 它死亡你获得大量奖励

```javascript
soulBind: {
    randomEnemy: true,
    dmgExchange: true,
    deathReward: { gold: 1000, exp: 500 }
}
```

### 227. 记忆碎片 🧩 [稀有]
**效果**: 收集碎片解锁能力
- 每层随机掉落碎片
- 5个碎片解锁一个强力被动
- 已收集的碎片本局保留

```javascript
memoryShard: {
    dropChance: 0.1,
    need: 5,
    unlockPassives: ['superCrit', 'regenAura', 'goldTouch'],
    permanent: true
}
```

### 228. 命运分叉 🔀 [史诗]
**效果**: 关键选择点可以"试"两次
- 选择后不满意可以回溯
- 每层3次回溯机会
- 可以比较不同结果

```javascript
fateFork: {
    tryTwice: true,
    perFloor: 3,
    compare: true
}
```

### 229. 成就猎人 🏆 [稀有]
**效果**: 挑战系统
- 每层随机生成3个挑战
- 完成获得奖励
- 挑战可主动刷新

```javascript
achievementHunter: {
    perFloor: 3,
    rewards: ['gold', 'exp', 'item'],
    canReroll: true
}
```

### 230. 隐藏boss钥匙 🗝️ [传说]
**效果**: 每层出现一个隐藏Boss
- 击败获得独特道具
- Boss极其强大
- 可以选择不打

```javascript
hiddenBossKey: {
    spawnPerFloor: true,
    uniqueRewards: true,
    optional: true
}
```

### 231. 宠物系统 🐾 [史诗]
**效果**: 获得一个可培养的宠物
- 宠物可以升级
- 不同宠物不同能力
- 可以喂食道具强化

```javascript
petSystem: {
    startPet: 1,
    levelUp: true,
    feedItems: true,
    petTypes: ['atk', 'def', 'support']
}
```

### 232. 血脉觉醒 🩸 [神话]
**效果**: 根据你的"族裔"获得能力
- 游戏开始时随机选择
- 吸血鬼: 吸血+恐惧
- 狼人: 满月变强
- 法师: 技能增强

```javascript
bloodline: {
    chooseAtStart: true,
    types: {
        vampire: { lifeSteal: 0.2, fearAura: true },
        werewolf: { nightBonus: 2.0 },
        mage: { skillEnhance: 0.5 }
    }
}
```

### 233. 羁绊系统 🤝 [史诗]
**效果**: 与特定道具建立羁绊
- 携带时间越长越强
- 10分钟: +20%
- 20分钟: +50%
- 30分钟: +100%

```javascript
bondSystem: {
    scalingByTime: true,
    milestones: {
        600: 0.2,
        1200: 0.5,
        1800: 1.0
    }
}
```

### 234. 收集图鉴 📖 [稀有]
**效果**: 收集道具获得全局加成
- 每收集一个新道具+1%全属性
- 鼓励多样性
- 已收集的跨局保留

```javascript
collection: {
    bonusPerUnique: 0.01,
    globalStat: true,
    crossRun: true
}
```

### 235. 真结局之钥 🚪 [神话]
**效果**: 解锁真结局路线
- 需要特定道具组合
- 改变最终Boss战
- 额外剧情和奖励

```javascript
trueEnding: {
    requireCombination: [91, 92, 93],  // 圣杯+圣心+神性
    changeFinalBoss: true,
    extraStory: true,
    bonusReward: 'ultimateItem'
}
```

---

## 📊 200个道具完整分类

| 类别 | 数量 | ID范围 | 特点 |
|------|------|--------|------|
| 基础攻击 | 15 | 1-15 | 投射物+伤害 |
| 基础防御 | 10 | 16-25 | 护甲+生命 |
| 基础功能 | 10 | 26-35 | 移速+资源 |
| 进阶攻击 | 15 | 36-50 | 特殊投射物 |
| 进阶防御 | 10 | 51-60 | 闪避+护盾 |
| 进阶功能 | 10 | 61-70 | 特殊能力 |
| 召唤类 | 5 | 71-75 | 跟班+宠物 |
| 诅咒基础 | 15 | 76-90 | 双刃剑 |
| 神话基础 | 10 | 91-100 | 改变规则 |
| 时间操控 | 10 | 101-110 | 时间机制 |
| 空间扭曲 | 10 | 111-120 | 传送+相位 |
| 身份转换 | 10 | 121-130 | 模仿+变身 |
| 因果概率 | 10 | 131-140 | 运气+命运 |
| 进化变异 | 10 | 141-150 | 成长型 |
| 游戏改变 | 15 | 151-165 | 元游戏 |
| 高级诅咒 | 20 | 166-185 | 高风险 |
| 主动道具 | 20 | 186-205 | 按键使用 |
| 环境互动 | 15 | 206-220 | 改变世界 |
| 特殊机制 | 15 | 221-235 | 系统级 |

**总计: 235个道具**

---

## 完成总结

经过5轮迭代，道具系统实现了：

1. **数量**: 50 → 235个道具
2. **稀有度**: 7级完整支持
3. **协同**: 10种基础协同
4. **主动**: 20个主动使用道具
5. **机制**: 时间、空间、因果、进化等创新机制
6. **环境**: 地形互动、天气、建造
7. **系统**: 交易、契约、进化树、羁绊

道具系统现在足以支撑数百小时的深度游戏体验！
