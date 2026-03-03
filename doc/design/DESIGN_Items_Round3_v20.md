# v0.20 第3轮 - 诅咒道具与双刃剑设计

## 设计哲学
"没有代价的力量，只是数值；有代价的力量，才是选择。"

---

## 🔥 高级诅咒道具 (166-185)

### 166. 贪婪契约 📜 [诅咒]
**效果**: 金币获取×3，但...
- 每100金币失去1点最大生命
- 商店价格上涨200%
- 金币超过500时，移速-30%

```javascript
greedPact: {
    goldMult: 3.0,
    hpCost: { per: 100, loss: 1 },
    shopPrice: 3.0,
    speedPenalty: { threshold: 500, mult: 0.7 }
}
```

### 167. 暴怒诅咒 😤 [诅咒]
**效果**: 伤害+150%，但...
- 无法控制攻击，自动攻击最近敌人
- 无法停止移动
- 每10秒必须杀死一个敌人否则扣血

```javascript
wrathCurse: {
    atkMult: 2.5,
    autoAttack: true,
    autoMove: true,
    bloodthirst: { interval: 10, damage: 2 }
}
```

### 168. 懒惰舒适 🛋️ [诅咒]
**效果**: 生命回复+200%，但...
- 移速-50%
- 攻速-50%
- 冲刺距离-80%
- "站桩流"核心

```javascript
slothComfy: {
    regenMult: 3.0,
    speedMult: 0.5,
    fireRateMult: 0.5,
    dashDistMult: 0.2
}
```

### 169. 嫉妒之眼 👁️ [诅咒]
**效果**: 可以看到敌人的弱点(3倍伤害点)，但...
- 敌人也能看到你的弱点
- 弱点被击中时伤害×3
- 弱点每10秒随机变换位置

```javascript
envyEye: {
    seeWeakness: true,
    weakMult: 3.0,
    selfWeakness: true,
    changeInterval: 10
}
```

### 170. 暴食之胃 🍔 [诅咒]
**效果**: 拾取道具时额外获得50%效果，但...
- 必须每层至少吃3个道具
- 否则会饿死(每秒扣血)
- 道具变成"食物"，有过期时间

```javascript
gluttony: {
    itemBonus: 0.5,
    mustEat: 3,  // 每层最少道具
    foodDecay: 60,  // 秒
    starveDps: 1
}
```

### 171. 傲慢王冠 👑 [诅咒]
**效果**: 满血时伤害+200%，但...
- 非满血时伤害-50%
- 无法自然回血
- 必须杀死敌人才能回血

```javascript
prideCrown: {
    fullHpBonus: 3.0,
    nonFullPenalty: 0.5,
    noNaturalRegen: true,
    healOnKill: true
}
```

### 172. 色欲魅影 💋 [诅咒]
**效果**: 敌人会"迷恋"你(靠近但不攻击)，但...
- 敌人速度+100%
- 敌人血量+50%
- 你必须保持距离，否则伤害-50%

```javascript
lustCharm: {
    attractEnemies: true,
    enemySpeedMult: 2.0,
    enemyHpMult: 1.5,
    closePenalty: 0.5
}
```

### 173. 债务缠身 💸 [诅咒]
**效果**: 可以"贷款"获得道具，但...
- 每贷款100，每层开始时扣2血
- 债务可以还清，但有利息
- 死亡时债务清零但本局金币获取-50%

```javascript
debt: {
    canLoan: true,
    interest: 0.1,
    hpCost: { per: 100, perFloor: 2 },
    deathPenalty: 0.5
}
```

### 174. 共生寄生虫 🦠 [诅咒]
**效果**: 一个敌人成为你的"宿主"，你变强，但...
- 如果宿主死亡，你也死亡
- 宿主血量×10
- 你获得宿主10%的属性
- 必须保护宿主

```javascript
parasite: {
    hostEnemy: true,
    hostHpMult: 10,
    gainStats: 0.1,
    dieWithHost: true
}
```

### 175. 俄罗斯轮盘 🔫 [诅咒]
**效果**: 伤害+300%，但...
- 每次攻击有20%概率自杀
- 可以"跳过"一回合不攻击

```javascript
russianRoulette: {
    atkMult: 4.0,
    selfKillChance: 0.2,
    canSkip: true
}
```

### 176. 时间债务 ⏰ [诅咒]
**效果**: 可以"借时间"暂停10秒，但...
- 之后时间流速×2持续20秒
- 可以连续借用，但加速时间累加

```javascript
timeDebt: {
    canBorrow: 10,  // 秒
    repayment: { speed: 2.0, duration: 20 }
}
```

### 177. 镜子诅咒 🪞 [诅咒]
**效果**: 创建一个镜像复制你的一切，但...
- 镜像承受的伤害50%转移给你
- 镜像死亡时你失去50%血量
- 镜像会帮你战斗

```javascript
mirrorCurse: {
    clone: true,
    damageTransfer: 0.5,
    deathPenalty: 0.5,
    assists: true
}
```

### 178. 知识代价 📚 [诅咒]
**效果**: 可以看到所有隐藏信息(敌人血量、掉落等)，但...
- 知道的越多，恐惧越多
- 每知道一个秘密，最大生命-1
- 无法恢复这部分生命

```javascript
knowledgeCost: {
    revealAll: true,
    hpCostPerSecret: 1,
    permanent: true
}
```

### 179. 英雄之旅 🦸 [诅咒]
**效果**: Boss战伤害+200%，但...
- 小怪战伤害-50%
- 必须击败所有小怪才能打Boss
- Boss血量+50%

```javascript
heroJourney: {
    bossBonus: 3.0,
    mobPenalty: 0.5,
    mustClear: true,
    bossHpMult: 1.5
}
```

### 180. 孤独患者 🚶 [诅咒]
**效果**: 没有召唤物/跟班时伤害+200%，但...
- 召唤物伤害-90%
- 必须独行侠
- 靠近友方单位时伤害-50%

```javascript
loner: {
    soloBonus: 3.0,
    summonPenalty: 0.1,
    proximityPenalty: 0.5
}
```

### 181. 赌狗人生 🎲 [诅咒]
**效果**: 所有属性±50%随机波动，但...
- 波动范围可以随时间扩大(±50%→±100%)
- 杀死Boss可以"固定"当前波动值
- 每层重置波动

```javascript
gamblerLife: {
    statVariance: 0.5,
    canIncrease: true,
    bossFix: true,
    resetPerFloor: true
}
```

### 182. 复仇者 ⚔️ [诅咒]
**效果**: 受到伤害后10秒内伤害+100%，但...
- 必须在此期间复仇(杀死攻击者)
- 否则受到等量伤害
- 可以同时追踪多个仇人

```javascript
avenger: {
    revengeBonus: 2.0,
    duration: 10,
    mustKill: true,
    failDamage: true
}
```

### 183. 收藏家 🏺 [诅咒]
**效果**: 持有道具越多越强(每个+5%全属性)，但...
- 失去道具时扣除双倍血量
- 必须保留至少10个道具
- 道具栏-2

```javascript
collector: {
    perItemBonus: 0.05,
    lossPenalty: { hp: 2, mult: 2 },
    minItems: 10,
    slotPenalty: 2
}
```

### 184. 复仇者联盟 🦸‍♂️ [诅咒]
**效果**: Boss被强化但掉落更好，但...
- 所有Boss血量×2
- Boss获得随机额外能力
- 击杀后必掉传说道具

```javascript
bossHunter: {
    bossHpMult: 2.0,
    bossExtraSkill: true,
    legendaryDrop: true
}
```

### 185. 永夜 🌑 [诅咒]
**效果**: 视野受限但暴击+50%，但...
- 只能看到周围150像素
- 超出范围全黑
- 但暴击伤害×3

```javascript
endlessNight: {
    visionRange: 150,
    critBonus: 0.5,
    critDmgMult: 3.0
}
```

---

## 双刃剑道具设计原则

### 1. 明确的风险收益比
```
收益: 伤害+100%
风险: 移速-30%
→ 合理，需要走位技巧弥补
```

### 2. 可操作的副作用
```
❌ 不好: 随机失去道具(不可控)
✅ 好: 必须在10秒内杀敌(可操作)
```

### 3. 策略深度
```
❌ 不好: 直接扣血(无脑惩罚)
✅ 好: 知道越多生命越少(选择是否探索)
```

### 4. 流派构建
- 贪婪契约 → 金币流
- 懒惰舒适 → 站桩流
- 孤独患者 → 纯输出流
- 暴食之胃 → 道具吞噬流

---

## 代码实现模式

### 诅咒效果基类
```javascript
class CurseEffect {
    constructor(options) {
        this.bonus = options.bonus;
        this.penalty = options.penalty;
        this.mitigation = options.mitigation || null;
    }
    
    applyBonus(stats) {
        // 应用正面效果
    }
    
    applyPenalty(stats) {
        // 应用负面效果
    }
    
    canMitigate(condition) {
        // 某些条件下可以减轻诅咒
        return this.mitigation && condition;
    }
}

// 示例: 贪婪契约
const greedCurse = new CurseEffect({
    bonus: { goldMult: 3.0 },
    penalty: { 
        hpPerGold: 100,
        shopPrice: 3.0,
        speedAt500: 0.7
    },
    mitigation: { spendGold: true }  // 花掉金币可减轻
});
```
