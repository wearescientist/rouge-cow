# 道具协同系统 (Item Synergy)

## 设计理念
参考以撒的结合，当特定道具组合在一起时，产生1+1>2的效果

## 协同组合设计

### 🔥 火焰系协同
| 组合 | 效果名称 | 触发效果 |
|------|----------|----------|
| 火焰之石 + 汽油 | 燃烧地狱 | 火焰伤害+50%，燃烧扩散到周围敌人 |
| 火焰之石 + 龙息 | 末日烈焰 | 攻击有20%概率召唤陨石 |
| 打火机 + 煤气罐 | 自爆步兵 | 死亡时对全屏敌人造成最大生命值50%伤害 |

### ⚡ 雷电系协同
| 组合 | 效果名称 | 触发效果 |
|------|----------|----------|
| 电池 + 铁钉 | 特斯拉线圈 | 周围敌人持续受到雷电伤害 |
| 雷电宝石 + 金属护甲 | 雷电法王 | 受击时50%概率反弹雷电链 |
| 充电宝 + 加速齿轮 | 过载模式 | 攻速+100%持续5秒，每30秒触发一次 |

### 💀 诅咒系协同
| 组合 | 效果名称 | 触发效果 |
|------|----------|----------|
| 玻璃大炮 + 血之契约 | 疯狂输出 | 伤害+200%，但每秒掉1%血 |
| 黑暗圣经 + 恶魔角 | 恶魔交易 | 商店物品免费，但永久-1红心上限 |
| 冥币 + 血钱 | 死亡商人 | 击杀敌人有10%概率直接秒杀精英怪 |

### 🛡️ 防御系协同
| 组合 | 效果名称 | 触发效果 |
|------|----------|----------|
| 刺盾 + 荆棘甲 | 刺猬形态 | 反弹伤害+200%，近战敌人攻击你时受到等量伤害 |
| 护身符 + 四叶草 | 幸运儿 | 闪避率上限提升至75% |
| 不死鸟羽毛 + 复活十字架 | 不死鸟 | 复活时满血+3秒无敌+伤害翻倍 |

## 代码实现方案

```javascript
// 协同系统检测
class SynergyManager {
    constructor(itemManager) {
        this.itemManager = itemManager;
        this.activeSynergies = new Set();
    }
    
    // 定义协同规则
    SYNERGY_RULES = [
        {
            id: 'fire_hell',
            name: '燃烧地狱',
            items: [31, 32], // 火焰之石, 汽油
            effect: (stats) => { stats.fireDmg = (stats.fireDmg || 0) + 0.5; }
        },
        {
            id: 'tesla_coil',
            name: '特斯拉线圈',
            items: [45, 67], // 电池, 铁钉
            effect: (stats) => { stats.auraDamage = (stats.auraDamage || 0) + 10; }
        },
        // ... 更多协同
    ];
    
    checkSynergies() {
        const owned = Object.keys(this.itemManager.owned).map(Number);
        this.activeSynergies.clear();
        
        for (const rule of this.SYNERGY_RULES) {
            if (rule.items.every(id => owned.includes(id))) {
                this.activeSynergies.add(rule);
            }
        }
        
        return this.activeSynergies;
    }
}
```
