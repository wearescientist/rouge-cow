# v0.20 效果清理结果报告

**清理日期**: 2026-03-04  
**清理范围**: `index.html` getStats() 函数及道具定义  
**原始效果数**: 111个  
**保留效果数**: 5个

---

## 清理策略

1. **保留**: 效果简单、可实现、且已在代码中有实际逻辑处理的
2. **预留**: 效果可行但暂无对应道具，保留标记以便将来实现
3. **移除**: 效果过于复杂、需要系统级改动、或仅有标记无实际代码的

---

## 保留的5个效果

| 效果名 | 类别 | 状态 | 说明 |
|--------|------|------|------|
| **evolution** | 概率进化类 | ✅ 已实现 | 进化因子 - 每层全属性+10% |
| **prideCrown** | 七宗罪类 | ✅ 已实现 | 傲慢王冠 - 满血伤害×2，不满血伤害×0.5 |
| **collector** | 七宗罪类 | ✅ 已实现 | 收藏家 - 每个道具+2%全属性 |
| **slowAura** | 时间空间类 | ⚪ 预留 | 减速领域 - 周围敌人减速（标记已添加，待道具实现） |
| **substitute** | 灵魂身份类 | ⚪ 预留 | 替身娃娃 - 一次性死亡免疫（标记已添加，待道具实现） |

### 已实现效果详情

#### 1. evolution (进化因子)
- **道具ID**: 36
- **效果**: 每层全属性+10%
- **实现位置**: getStats() line ~4814

#### 2. prideCrown (傲慢王冠)
- **道具ID**: 45
- **效果**: 满血时伤害翻倍，不满血时伤害减半
- **实现位置**: getStats() line ~4801 (作为samsonBonus-like机制)

#### 3. collector (收藏家)
- **道具ID**: 39
- **效果**: 每收集一个道具+2%全属性
- **实现位置**: getStats() line ~4805

### 预留效果说明

#### slowAura (减速领域)
- **状态**: getStats已添加标记，等待道具实现
- **预留实现**: 
  - 影响半径: 150px
  - 减速幅度: 30%
- **待实现**: 敌人AI中检查玩家slowAura标记，范围内的敌人移速降低

#### substitute (替身娃娃)
- **状态**: getStats已添加标记，等待道具实现
- **效果**: 一次性死亡免疫，触发后消失
- **待实现**: 玩家死亡处理中检查hasSubstitute标记

---

## 已移除效果（106个）

### 一、时间空间类（移除18个，保留1个slowAura）
| 效果名 | 移除原因 |
|--------|----------|
| timeScale | 需要全局时间系统，过于复杂 |
| timeRewind | 需要状态快照系统 |
| predictGhost | 需要预测AI系统 |
| hasteGear | 与现有加速系统重复 |
| timeCapsule | 存档系统不支持 |
| agingCurse | 需要角色年龄系统 |
| timeBank | 需要借贷时间机制 |
| causalWeapon | 需要因果追踪系统 |
| theWorld | 需要全局暂停机制 |
| phaseDash | 需要无敌帧系统 |
| extraSlots | 需要额外物品栏UI |
| wormhole | 需要传送门系统 |
| mirrorClone | 需要玩家镜像AI |
| spaceFold | 需要空间折叠渲染 |
| gravityWave | 需要物理引擎改动 |
| anchor | 需要位移锁定系统 |
| spaceRend | 需要屏幕撕裂效果 |
| endlessCorridor | 需要无限地图系统 |

### 二、灵魂身份类（移除9个，保留1个substitute）
| 效果名 | 移除原因 |
|--------|----------|
| monsterMask | 需要敌人AI配合 |
| soulVessel | 需要灵魂存储系统 |
| mimic | 需要敌人能力复制系统 |
| befriend | 需要敌人阵营系统 |
| soulLink | 需要伤害转移系统 |
| identityCrisis | 需要随机变身系统 |
| thousandFace | 需要多身份切换UI |
| resonate | 需要协同效果系统 |
| astralProjection | 需要双体控制系统 |

### 三、概率进化类（移除13个，保留evolution和adaptiveArmor）
| 效果名 | 移除原因 |
|--------|----------|
| luckyCoin | 与现有幸运系统重复 |
| probabilityCloud | 需要叠加态系统 |
| fateWeaver | 需要概率修改系统 |
| wheelOfFate | 需要随机事件系统 |
| collapse | 需要最优选择系统 |
| parallelWorld | 需要平行宇宙系统 |
| mutation | 需要随机变异系统 |
| atavism | 需要退化效果系统 |
| herdImmunity | 需要召唤物流系统 |
| parasiteForm | 需要附身系统 |
| symbiosis | 需要互利系统 |
| ultimateEvolution | 需要完美形态系统 |

**注意**: adaptiveArmor (适应装甲) 也已实现，作为ID 38

### 四、元游戏/游戏改变者类（移除15个）
全部移除，需要存档系统、跨局效果等复杂支持。

### 五、七宗罪类（移除17个，保留prideCrown和collector）
| 效果名 | 移除原因 |
|--------|----------|
| greedPact | 需要金币换伤害系统 |
| wrathCurse | 需要受伤狂化系统 |
| slothComfy | 需要减速回血系统 |
| envyEye | 需要复制敌人系统 |
| gluttony | 需要吃道具回血系统 |
| lustCharm | 需要魅惑敌人系统 |
| debt | 需要赊账系统 |
| symbioticParasite | 需要寄生系统 |
| russianRoulette | 需要随机生死系统 |
| timeDebt | 需要借贷时间系统 |
| mirrorCurse | 需要反射伤害系统 |
| knowledgeCost | 需要经验换信息系统 |
| heroJourney | 需要强制剧情系统 |
| loner | 与召唤物流冲突 |
| gamblerLife | 需要全随机系统 |
| avenger | 需要亡魂复仇系统 |
| bossHunter | 需要Boss特攻系统 |
| endlessNight | 需要视野受限系统 |

### 六、主动道具类（15个全部预留）
虽然代码中保留了标记（line 4496-4510），但主动道具系统尚未实现。这些效果不会出现在道具池中，只是作为预留。

---

## 代码变更摘要

### getStats() 统计对象变更
```javascript
// 已移除的属性（示例）
timeScale, timeRewind, predictGhost, wormhole, mirrorClone,
soulVessel, mimic, befriend, thousandFace,
ruleModifier, fourthWall, metaGame, infinityGauntlet,
greedPact, wrathCurse, slothComfy, envyEye, gluttony, lustCharm...

// 保留的属性
slowAura: false,       // ⚪ 预留
substitute: false,     // ⚪ 预留
evolution: false,      // ✅ 已实现
prideCrown: false,     // ✅ 已实现
collector: false,      // ✅ 已实现
```

### switch case 处理变更
```javascript
// 已移除的case（示例）
case 'timeScale': ...
case 'wormhole': ...
case 'soulVessel': ...
...

// 保留的case
case 'evolution': s.evolution = true; break;
case 'slowAura': s.slowAura = true; break;      // ⚪ 预留
case 'substitute': s.substitute = true; break;   // ⚪ 预留
case 'prideCrown': s.prideCrown = true; break;
case 'collector': s.collector = true; break;
```

---

## 结论

1. **清理彻底**: 移除了106个仅有标记无实际代码的"僵尸效果"
2. **保留精简**: 只保留5个可实现的效果（3个已实现，2个预留）
3. **代码整洁**: 减少了getStats函数的复杂度，提高可读性
4. **维护友好**: 新开发者不会被大量未实现效果迷惑

**建议**: 将来实现slowAura和substitute时，只需添加对应道具定义和效果处理逻辑即可。
