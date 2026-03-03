# v0.20 第2轮 - 神话级"改变游戏规则"道具

## 设计理念
神话级道具应该让玩家惊呼"这游戏还能这么玩？！"

---

## 🏆 核心神话道具 (151-165)

### 151. 修改器 🔧 [神话]
**效果**: 每层可以选择修改一个游戏规则
- 选项A: 敌人不会移动，但血量×5
- 选项B: 你只有1血，但伤害×10
- 选项C: 时间流速×2，但经验×3
- 选项D: 无法攻击，但每秒自动发射8方向子弹

```javascript
modifier: {
    chooseRule: true,
    rules: ['staticEnemies', 'glassCannon', 'fastTime', 'autoFire']
}
```

### 152. 开发者模式 💻 [神话]
**效果**: 开启"作弊菜单"(有限次数)
- 按F1: 恢复满血
- 按F2: 重置本层
- 按F3: 获得随机道具
- 限制: 每层只能用3次

```javascript
devMode: {
    hotkeys: true,
    usesPerFloor: 3
}
```

### 153. 第四面墙 🎭 [神话]
**效果**: 打破游戏与现实的界限
- 敌人可以看到你的鼠标位置并躲避
- 但你可以按"暂停"键真正暂停游戏思考
- 每30秒可以"读档"一次

```javascript
fourthWall: {
    enemiesAvoidMouse: true,
    realPause: true,
    saveScum: 30
}
```

### 154. 元游戏 🎲 [神话]
**效果**: 游戏开始玩你
- 随机触发"成就": 5秒不移动=奖励
- "挑战": 只使用近战武器通关本层=传说道具
- "惩罚": 连续受伤3次=属性-10%

```javascript
metaGame: {
    achievements: true,
    challenges: true,
    punishments: true
}
```

### 155. 无限手套 ✋ [神话]
**效果**: 每层可以"打响指"一次
- 随机消灭一半敌人(向下取整)
- 但你有50%概率失去当前10%金币

```javascript
infinityGauntlet: {
    snap: true,
    killHalf: true,
    cost: { gold: 0.1, chance: 0.5 }
}
```

### 156. 存档编辑器 💾 [神话]
**效果**: 可以修改自己的一个属性(有代价)
- 选择: +50%伤害 → 但-30%移速
- 选择: +100%血量 → 但伤害-50%
- 每层可以修改一次

```javascript
saveEditor: {
    tradeOffs: [
        { atk: 1.5, speed: 0.7 },
        { hp: 2.0, atk: 0.5 }
    ]
}
```

### 157. 平行宇宙 🌌 [神话]
**效果**: 同时存在3个"你"
- 每个你承受1/3伤害
- 但每个你只造成40%伤害
- 可以切换控制哪个你(其他自动攻击)

```javascript
parallel: {
    copies: 3,
    damageTaken: 0.33,
    damageDealt: 0.4,
    switchable: true
}
```

### 158. 速通计时器 ⏱️ [神话]
**效果**: 激活竞速模式
- 通关越快奖励越好
- 但超过15分钟/层会开始扣血
- 最终Boss根据总时间改变形态

```javascript
speedrun: {
    timer: true,
    rewards: 'timeBased',
    penalty: { after: 900, dps: 1 }
}
```

### 159. Roguelike之心 ❤️ [神话]
**效果**: 死亡是真正的开始
- 死亡后重新开始，但保留1个随机道具
- 第2条命: 保留2个
- 第3条命: 保留3个...
- 直到通关

```javascript
rogueHeart: {
    deathIsBeginning: true,
    keepItems: (deaths) => deaths
}
```

### 160. 游戏设计师 🎨 [神话]
**效果**: 每3层可以"设计"一个道具
- 选择图标、名字、两个效果
- 系统生成对应道具
- 只能使用一次

```javascript
gameDesigner: {
    customItem: true,
    every: 3,
    options: 2
}
```

### 161. 难度滑块 📊 [神话]
**效果**: 实时调整难度
- 可以主动降低难度(血量-50%)
- 难度越低分数越低
- 也可以主动提高难度获得加成

```javascript
difficultySlider: {
    adjustable: true,
    range: [0.5, 3.0],
    multiplier: 'score'
}
```

### 162. 观众投票 📺 [神话]
**效果**: 模拟"直播互动"
- 每5分钟随机"观众"给你加buff/debuff
- "打赏": 恢复血量
- "弹幕": 随机建议(有时有用)

```javascript
streaming: {
    audience: true,
    votes: true,
    donations: { hp: 1 }
}
```

### 163. 彩蛋猎人 🥚 [神话]
**效果**: 激活隐藏内容
- 每层有一个隐藏房间
- 里面有特殊道具或挑战
- 收集所有彩蛋解锁真结局

```javascript
eggHunter: {
    secretRooms: true,
    hiddenItems: true,
    trueEnding: true
}
```

### 164. 死亡轮回 ♾️ [神话]
**效果**: 本层无限循环，但每次变强
- 每层可以重复挑战
- 每次敌人+10%属性
- 但你获得额外金币
- 可以选择"毕业"进入下一层

```javascript
deathLoop: {
    repeatable: true,
    enemyScaling: 1.1,
    goldBonus: 0.5,
    graduate: true
}
```

### 165. 游戏结束画面 👾 [神话]
**效果**: 真正的游戏结束
- 当死亡时，进入"继续游戏？"画面
- 可以花费收集的所有金币继续
- 金币越多，继续时属性保留越多
- 最多使用3次

```javascript
gameOver: {
    continueScreen: true,
    cost: 'allGold',
    retainStats: 'goldBased',
    maxUses: 3
}
```

---

## 新机制实现

### 修改器系统
```javascript
class RuleModifier {
    static MODIFIERS = {
        staticEnemies: {
            enemyMove: false,
            enemyHp: 5.0
        },
        glassCannon: {
            playerHp: 1,
            playerAtk: 10.0
        },
        fastTime: {
            timeScale: 2.0,
            expBonus: 3.0
        },
        autoFire: {
            canAttack: false,
            autoFire: true,
            firePattern: '8direction'
        }
    };
    
    apply(modifierId) {
        const mod = MODIFIERS[modifierId];
        // 应用到游戏逻辑
    }
}
```

### 平行宇宙系统
```javascript
class ParallelUniverse {
    constructor() {
        this.copies = [];
        this.activeIndex = 0;
    }
    
    createCopies(player, count = 3) {
        for (let i = 0; i < count; i++) {
            this.copies.push({
                x: player.x + rand(-50, 50),
                y: player.y + rand(-50, 50),
                hp: player.maxHp,
                autoFire: true
            });
        }
    }
    
    switchTo(index) {
        // 保存当前状态
        // 切换到新复制体
        this.activeIndex = index;
    }
}
```

### 死亡轮回系统
```javascript
class DeathLoop {
    constructor() {
        this.loopCount = 0;
        this.canGraduate = true;
    }
    
    onClear() {
        if (this.canGraduate) {
            showChoice(['再次挑战(难度+10%)', '进入下一层']);
        }
    }
    
    repeat() {
        this.loopCount++;
        enemyScaling *= 1.1;
        goldBonus += 0.5;
        restartCurrentFloor();
    }
}
```

---

## 平衡性考虑

1. **神话道具稀有度**: 0.1%基础掉率，60层以上0.2%
2. **使用限制**: 大多数有次数或条件限制
3. **副作用**: 强大能力伴随代价
4. **唯一性**: 一局游戏只能获得1个神话道具
5. **互斥**: 某些神话道具不能同时存在
