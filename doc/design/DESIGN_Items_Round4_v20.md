# v0.20 第4轮 - 主动道具与效果联动

## 设计理念
从被动属性加成 → 主动技能释放

---

## 🎮 主动道具系统 (186-205)

### 基础机制
```javascript
activeItem: {
    effect: Function,
    cooldown: Number,      // 冷却时间(秒)
    charges: Number,       // 可使用次数(-1=无限)
    autoCharge: Boolean,   // 是否自动恢复充能
    key: 'Q'               // 默认按键
}
```

---

## 主动道具列表

### 186. 瞬移卷轴 📜 [稀有]
**效果**: 瞬移到鼠标位置
- 冷却: 5秒
- 充能: 3次
- 可以穿墙

```javascript
blinkScroll: {
    effect: 'teleportToMouse',
    cd: 5,
    charges: 3,
    autoCharge: true,
    throughWalls: true
}
```

### 187. 时间沙漏 ⏳ [史诗]
**效果**: 暂停时间3秒，只有你能动
- 冷却: 30秒
- 充能: 1次
- 攻击会提前结束暂停

```javascript
timeHourglass: {
    effect: 'stopTime',
    duration: 3,
    cd: 30,
    charges: 1,
    breakOnAttack: true
}
```

### 188. 召唤号角 📯 [稀有]
**效果**: 召唤3个临时友军
- 持续: 20秒
- 冷却: 45秒
- 友军继承你的50%属性

```javascript
summonHorn: {
    effect: 'spawnAllies',
    count: 3,
    duration: 20,
    cd: 45,
    inheritStats: 0.5
}
```

### 189. 治疗药水 🧪 [普通]
**效果**: 恢复5点生命
- 冷却: 10秒
- 充能: 5次
- 危急时自动使用

```javascript
healPotion: {
    effect: 'heal',
    amount: 5,
    cd: 10,
    charges: 5,
    autoUse: { hpBelow: 20 }
}
```

### 190. 炸弹袋 💣 [稀有]
**效果**: 在鼠标位置放置炸弹
- 伤害: 50
- 范围: 100像素
- 冷却: 3秒
- 充能: 10次

```javascript
bombBag: {
    effect: 'placeBomb',
    damage: 50,
    radius: 100,
    cd: 3,
    charges: 10,
    remoteDetonate: false
}
```

### 191. 诱饵人偶 🎎 [稀有]
**效果**: 放置一个吸引敌人的假人
- 持续: 15秒
- 冷却: 20秒
- 假人血量: 50

```javascript
decoyDoll: {
    effect: 'placeDecoy',
    duration: 15,
    cd: 20,
    hp: 50,
    aggroRange: 300
}
```

### 192. 护盾发生器 🛡️ [史诗]
**效果**: 5秒内无敌
- 冷却: 60秒
- 充能: 1次
- 启动有1秒延迟

```javascript
shieldGen: {
    effect: 'invincible',
    duration: 5,
    cd: 60,
    charges: 1,
    windup: 1
}
```

### 193. 黑洞手雷 🕳️ [传说]
**效果**: 投掷一个吸引所有敌人的黑洞
- 持续: 8秒
- 冷却: 40秒
- 结束时爆炸造成范围伤害

```javascript
blackHoleGrenade: {
    effect: 'throwBlackHole',
    duration: 8,
    cd: 40,
    pullForce: 200,
    explodeDmg: 100
}
```

### 194. 复制魔镜 🪞 [史诗]
**效果**: 复制你接下来发射的3发子弹
- 冷却: 15秒
- 复制的子弹造成50%伤害

```javascript
copyMirror: {
    effect: 'copyNextShots',
    count: 3,
    cd: 15,
    copyDmgMult: 0.5
}
```

### 195. 狂暴药剂 🩸 [稀有]
**效果**: 10秒内攻速+100%，之后眩晕2秒
- 冷却: 25秒

```javascript
berserkPotion: {
    effect: 'berserk',
    duration: 10,
    bonus: { fireRate: 2.0 },
    afterEffect: { stun: 2 },
    cd: 25
}
```

### 196. 置换器 ↔️ [史诗]
**效果**: 与最近敌人交换位置
- 冷却: 12秒
- 对Boss有效

```javascript
swapper: {
    effect: 'swapWithEnemy',
    target: 'nearest',
    cd: 12,
    worksOnBoss: true
}
```

### 197. 冰封宝珠 ❄️ [传说]
**效果**: 冻结全屏敌人5秒
- 冷却: 50秒
- 充能: 2次
- 冻结敌人受击会提前解冻

```javascript
iceOrb: {
    effect: 'freezeAll',
    duration: 5,
    cd: 50,
    charges: 2,
    breakOnHit: true
}
```

### 198. 全图扫描 📡 [稀有]
**效果**: 显示全图敌人位置10秒
- 冷却: 20秒
- 显示敌人血量条

```javascript
mapScan: {
    effect: 'revealEnemies',
    duration: 10,
    cd: 20,
    showHpBar: true
}
```

### 199. 生命献祭 🗡️ [诅咒]
**效果**: 牺牲50%当前生命，伤害×3持续10秒
- 冷却: 30秒
- 可以自杀

```javascript
lifeSacrifice: {
    effect: 'sacrifice',
    cost: { hpPercent: 0.5 },
    bonus: { atk: 3.0 },
    duration: 10,
    cd: 30,
    canSuicide: true
}
```

### 200. 复活十字架 ✝️ [传说]
**效果**: 死亡时自动复活
- 被动触发
- 复活时满血+5秒无敌
- 只能使用1次

```javascript
resurrectCross: {
    effect: 'autoRevive',
    trigger: 'onDeath',
    healPercent: 1.0,
    invincible: 5,
    charges: 1,
    consumed: true
}
```

### 201. 贪婪之手 🖐️ [史诗]
**效果**: 吸取全屏金币和经验
- 冷却: 15秒
- 同时造成等于金币数的伤害

```javascript
greedyHand: {
    effect: 'vacuumAll',
    cd: 15,
    damageByGold: true
}
```

### 202. 变形术 🐸 [稀有]
**效果**: 将最近敌人变成青蛙5秒
- 青蛙血量=原敌人10%
- 冷却: 20秒

```javascript
polymorph: {
    effect: 'transform',
    target: 'nearest',
    transformTo: 'frog',
    duration: 5,
    hpPercent: 0.1,
    cd: 20
}
```

### 203. 连锁闪电 ⚡ [史诗]
**效果**: 对最近敌人释放连锁闪电，跳跃5次
- 每次伤害递减20%
- 冷却: 8秒

```javascript
chainLightning: {
    effect: 'lightningChain',
    jumps: 5,
    decay: 0.8,
    cd: 8
}
```

### 204. 背包扩容 🎒 [普通]
**效果**: 临时+2道具栏，持续本层
- 被动
- 永久生效

```javascript
backpack: {
    effect: 'extraSlots',
    slots: 2,
    passive: true
}
```

### 205. 记忆清除 🧼 [神话]
**效果**: 重置本层，保留道具但敌人重新生成
- 冷却: 单层只能使用1次
- 用于"刷"更好的掉落

```javascript
memoryErase: {
    effect: 'resetFloor',
    keepItems: true,
    respawnEnemies: true,
    cd: 'perFloor'
}
```

---

## 🔗 效果联动设计

### 联动类型1: 道具协同
```javascript
// 时间沙漏 + 加速齿轮 = 时停期间自己加速
if (has('timeHourglass') && has('speedGear')) {
    duringTimeStop: { selfSpeedMult: 2.0 }
}

// 炸弹袋 + 黑洞手雷 = 黑洞里的炸弹伤害×2
if (has('bombBag') && has('blackHoleGrenade')) {
    bombInBlackHole: { dmgMult: 2.0 }
}
```

### 联动类型2: 主动+被动
```javascript
// 狂暴药剂 + 吸血 = 狂暴期间吸血效率翻倍
if (active === 'berserkPotion' && has('lifeSteal')) {
    berserkLifeStealMult: 2.0
}

// 护盾发生器 + 荆棘 = 无敌期间反弹伤害翻倍
if (active === 'shieldGen' && has('thorn')) {
    invincibleThornMult: 2.0
}
```

### 联动类型3: 连续使用
```javascript
// 连续使用3次炸弹 = 第3次大爆炸
consecutiveBombs: {
    count: 3,
    bonus: { explosionRadius: 2.0, damage: 2.0 }
}

// 时间沙漏 → 瞬移 = 时停中瞬移后保留1秒加速
combo: {
    sequence: ['timeHourglass', 'blinkScroll'],
    afterEffect: { speedBoost: 1.5, duration: 1 }
}
```

### 联动类型4: 元素反应
```javascript
// 冰冻 → 雷电 = 超导(范围扩散)
elemental: {
    iceThenThunder: { spread: true, radius: 200 }
}

// 火焰 → 炸弹 = 爆炸范围+50%
fireThenBomb: { explosionBonus: 0.5 }
```

---

## 主动道具UI设计

```
┌─────────────────────────────┐
│  [Q] 时间沙漏  ████░░  12s  │
│      ⏳ 暂停3秒              │
│      充能: 1/1               │
└─────────────────────────────┘
```

- 按键提示
- 图标+名称
- 冷却进度条
- 充能次数
- 简要效果说明

---

## 实现代码

```javascript
class ActiveItemManager {
    constructor() {
        this.activeItem = null;
        this.cooldowns = new Map();
        this.charges = new Map();
    }
    
    equip(itemId) {
        this.activeItem = ITEMS[itemId];
        if (!this.charges.has(itemId)) {
            this.charges.set(itemId, this.activeItem.charges);
        }
    }
    
    use() {
        if (!this.canUse()) return false;
        
        const item = this.activeItem;
        const charges = this.charges.get(item.id);
        
        // 执行效果
        item.effect();
        
        // 消耗充能
        if (charges > 0) {
            this.charges.set(item.id, charges - 1);
        }
        
        // 设置冷却
        this.cooldowns.set(item.id, item.cooldown);
        
        return true;
    }
    
    canUse() {
        const item = this.activeItem;
        if (!item) return false;
        
        const charges = this.charges.get(item.id) || 0;
        const cd = this.cooldowns.get(item.id) || 0;
        
        return charges !== 0 && cd <= 0;
    }
    
    update(dt) {
        // 更新冷却
        for (const [id, cd] of this.cooldowns) {
            if (cd > 0) {
                this.cooldowns.set(id, Math.max(0, cd - dt));
            }
        }
        
        // 自动充能
        for (const item of Object.values(ITEMS)) {
            if (item.autoCharge && item.active) {
                this.recharge(item.id, dt);
            }
        }
    }
}
```
