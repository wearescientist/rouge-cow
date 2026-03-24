# 深根之疫 - 代码导航索引
## Code Navigation Index for AI Development

**生成时间**: 2026-03-05  
**适用文件**: index.html  
**目的**: 快速定位类和方法，提升开发效率  

> 2026-03-14 更新：旧 `Enemy.js / ENEMY_TYPES / BOSS_TYPES` 已移除。现役敌人主链为 `floor-data.js` → `src/data/enemy-types-new.js` → `src/systems/enemies/NewEnemy.js` → `index.html` 的 `createEnemy/createBoss` → `src/systems/Room.js` / `src/systems/HordeManager.js`

---

## 📍 快速定位表

### 核心类位置总览

| 类名 | 起始行 | 结束行 | 行数 | 常用方法 | 修改频率 |
|------|--------|--------|------|----------|----------|
| SpriteLoader | 1910 | 2113 | 203 | load, get | 低 |
| ParticleSystem | 2114 | 2571 | 457 | spawn, update, burst | 中 |
| WeaponVisualSystem | 2572 | 2701 | 129 | drawMelee, drawProjectile | 中 |
| Pet | 3566 | 4269 | 703 | update, attack | **高** |
| PetManager | 4270 | 4394 | 124 | add, remove, update | **高** |
| ItemManager | 4395 | 4999 | 604 | add, getEffect | **高** |
| SynergyManager | 5000 | 5147 | 147 | check, getBonus | 中 |
| PassiveManager | 5148 | 5774 | 626 | add, getLevel | **高** |
| **Weapon** | **5775** | **6669** | **894** | **fire, upgrade, getDamage** | **🔥极高** |
| **Enemy** | **6670** | **8229** | **1559** | **update, takeDamage, ai** | **🔥极高** |
| ShopNPC | 8230 | 8348 | 118 | interact, getDialogue | 中 |
| TotemManager | 8349 | 8428 | 79 | collect, getBonus | 低 |
| **Room** | **8429** | **9279** | **850** | **update, spawnEnemy** | **🔥极高** |
| HordeManager | 9280 | 9690 | 410 | startWave, update | **高** |
| MapGenerator | 9691 | 10058 | 367 | generate | 低 |
| SurvivorCamera | 10059 | 10292 | 233 | update, shake | 中 |
| SpatialGrid | 10293 | 10354 | 61 | insert, query | 低 |
| ObjectPool | 10355 | 10444 | 89 | get, release | 低 |
| PerformanceMonitor | 10445 | 10630 | 185 | update, draw | 低 |
| FullscreenAdapter | 10631 | 10706 | 75 | setup, resize | 低 |
| ScoreManager | 10707 | 11246 | 539 | addScore, onKill | 中 |
| **Game** | **11247** | **21815** | **10568** | **update, draw, loop** | **🔥极高** |

---

## 🔥 高频修改类详情

### Weapon 类 (L5775-L6669)
```
文件: index.html
行号: 5775 - 6669 (894行)
```

**关键方法位置**:
| 方法 | 行号范围 | 说明 |
|------|----------|------|
| constructor | ~5780 | 武器初始化 |
| fire | ~5890 | 发射逻辑 |
| fireMelee | ~5950 | 近战攻击 |
| fireProjectile | ~6050 | 弹道攻击 |
| getDamage | ~6120 | 伤害计算 |
| upgrade | ~6200 | 升级逻辑 |
| getSuperEffectDesc | ~6400 | 超武描述 |

**修改建议**: 
- 武器平衡调整 → 找 `getDamage()` 或 `fire()`
- 新武器类型 → 在 `fire()` 中添加分支
- 升级数值 → 找 `upgrade()` 和伤害曲线计算

---

### Enemy 类 (L6670-L8229)
```
文件: index.html
行号: 6670 - 8229 (1559行)
```

**关键方法位置**:
| 方法 | 行号范围 | 说明 |
|------|----------|------|
| constructor | ~6675 | 敌人初始化 |
| update | ~6750 | 更新逻辑 (包含AI) |
| takeDamage | ~6850 | 受伤处理 |
| die | ~6950 | 死亡处理 |
| fireProjectile | ~7100 | 敌人射击 |
| spawnMinions | ~7200 | 召唤小怪 |

**敌人类型判断**:
```javascript
// Enemy构造函数附近 (~6675行)
this.tier = tier;        // 1-4 等级
this.isBoss = isBoss;    // 是否Boss
this.special = special;  // 特殊技能
```

**修改建议**:
- 调整敌人属性 → 找 `src/data/enemy-types-new.js`
- 修改AI行为 → 找 `src/systems/enemies/NewEnemy.js` 的 `update()` / `updateBossAI()`
- 新增敌人类型 → 找 `floor-data.js` 并同步检查 `src/data/enemy-types-new.js`

---

### Room 类 (L8429-L9279)
```
文件: index.html
行号: 8429 - 9279 (850行)
```

**关键方法位置**:
| 方法 | 行号范围 | 说明 |
|------|----------|------|
| constructor | ~8435 | 房间初始化 |
| update | ~8500 | 房间更新 |
| spawnEnemy | ~8600 | 生成敌人 |
| spawnBoss | ~8650 | 生成Boss |
| onClear | ~8700 | 清理完成 |
| render | ~8800 | 渲染 |

**运行时补充**:
- 当前房间主实现已迁移到 `src/systems/Room.js`
- Floor1 场景分层入口：`syncStageShellBackdrop()`、`drawLayer1UnifiedRoom()`、`drawLayer1MidgroundEdges()`、`drawLayer1FullSceneEnvelope()`

---

### Game 类 (L11247-L21815)
```
文件: index.html
行号: 11247 - 21815 (10568行)
```

⚠️ **注意**: Game类非常庞大，谨慎修改

**关键方法位置**:
| 方法 | 行号范围 | 说明 |
|------|----------|------|
| constructor | ~11250 | 游戏初始化 |
| init | ~11350 | 初始化系统 |
| update | ~11500 | 主更新循环 |
| draw | ~12000 | 主渲染循环 |
| loop | ~21717 | 游戏循环 |
| start | ~11400 | 开始游戏 |
| endGame | ~11600 | 结束游戏 |

**子系统引用位置**:
| 系统 | 成员变量 | 初始化位置 |
|------|----------|------------|
| 玩家 | this.player | ~11300 |
| 武器 | this.weapons | ~11350 |
| 敌人 | this.curRoom.enemies | ~8500 (Room中) |
| 道具 | this.items | ~11400 |
| 粒子 | this.particles | ~11280 |
| 相机 | this.camera | ~11270 |

---

## 📦 数据常量位置

| 常量名 | 起始行 | 说明 |
|--------|--------|------|
| ITEMS | 3196 | 200个道具数据 |
| PETS | 3324 | 宠物配置 |
| ENEMY_TYPES_NEW | src/data/enemy-types-new.js | 由 `floor-data.js` 生成的新怪物运行时表 |
| SURVIVOR_CONFIG | 10571 | 游戏配置 |
| ROOM_TEMPLATES | 10571 | 房间模板 |
| FLOOR_THEMES | 10595 | 楼层主题 |

---

## 🔍 常用搜索关键词

### 按功能搜索

| 功能 | 搜索关键词 | 位置提示 |
|------|------------|----------|
| 武器伤害 | `getDamage`, `damage`, `baseDamage` | Weapon类 |
| 敌人血量 | `hp`, `maxHp`, `takeDamage` | Enemy类 |
| 升级数值 | `upgrade`, `level`, `damageMult` | Weapon/PassiveManager |
| 碰撞检测 | `checkCollision`, `hits`, `dist` | Game.update() |
| 粒子效果 | `spawnParticle`, `burst`, `effects` | ParticleSystem |
| 存档加载 | `saveGame`, `loadGame`, `localStorage` | Game类末尾 |
| 调试功能 | `debug`, `godMode`, `toggle` | Game类后部 |

### 按Bug类型搜索

| Bug类型 | 搜索关键词 | 常见位置 |
|---------|------------|----------|
| 敌人不动 | `vx`, `vy`, `speed`, `chase` | Enemy.update() |
| 武器不发射 | `cd`, `cooldown`, `fire` | Weapon.fire() |
| 不扣血 | `takeDamage`, `hp`, `armor` | Enemy/Player |
| 不生成 | `spawn`, `hordeManager`, `wave` | Room/HordeManager |
| 卡顿 | `particle`, `enemy`, `loop` | Game.loop() |

---

## 🛠️ 开发快捷命令

### 定位到指定行 (VS Code)
```
Ctrl+G 然后输入行号
```

### 搜索类定义
```regex
^class (Weapon|Enemy|Game)
```

### 搜索方法定义
```regex
(methodName)\([^)]*\)\s*\{
```

---

## 🧰 工具入口

### 调试工作台
```
文件: tools/debug_workbench.html
脚本: tools/debug_workbench.js
```

**用途**:
- 汇总现有网页类调试工具
- 支持拖拽排序、隐藏、删除、恢复、自定义临时入口
- 作为后续“怪物总控台”统一挂载入口

**当前接入范围**:
- 武器弹道与贴图调试
- 怪物朝向/动画/颠簸/体型/楼层/分层工具
- Sprite 预览与对比工具
- `tools/editor/index.html` 独立编辑器入口

### 怪物总控台
```
文件: tools/monster_control_center.html
脚本: tools/monster_control_center.js
```

**用途**:
- 聚合怪物朝向/动画/体型/楼层配置四个现有工具
- 提供怪物档案、跨楼层分布、资源路径和新增怪物草案区
- 将“怪物总控台 / 房间分布编辑器 / 资源选择器”三块统一到一个入口

### 场景美术工作台
```
文件: tools/scene_art_workbench.html
脚本: tools/scene_art_workbench.js
```

**用途**:
- 统一处理外壳、地板、门、墙体、装饰、前景的场景搭建
- 支持资源拖入、拖拽移动、拉伸缩放、旋转、基础调色
- 支持多选、框选、吸附对齐线、图层显隐/锁定、层级调整、本地图片导入
- 支持 Alt 拖拽复制、已用素材复插、图层透明度、对象混合模式和聚焦选中
- 当前已按真实运行时切到 `960x960` 正方形主画布，并区分房间外框/墙厚区/地板有效区/门逻辑区/门贴图区
- 支持实际区域 / 门区域 / 墙边界 / 构图框可视化与 JSON 导出

---

## 📝 修改检查清单

修改任何代码前，请确认：

- [ ] 已查看本索引确认正确位置
- [ ] 已理解该类/方法的职责范围
- [ ] 已检查是否有相关联的代码
- [ ] 已考虑对AI训练系统的影响 (如修改Game类)
- [ ] 已备份 (如有重大改动)

---

## 🔄 索引更新记录

| 日期 | 更新内容 | 版本 |
|------|----------|------|
| 2026-03-05 | 初始创建 | v1.0 |

---

**使用提示**: 
- 使用浏览器的页面搜索 (Ctrl+F) 快速查找关键词
- 高频率修改的类用 🔥 标记
- 修改前先在对应位置附近阅读上下文

*此索引专为AI开发效率优化而创建*
