# 系统全面盘点与迁移规划 (修正版)
## System Inventory & Migration Plan - CORRECTED v1.1

**文档版本**: v1.1 (修正版)  
**生成时间**: 2026-03-05  
**修正说明**: 重新检查src/目录，区分"真正使用"vs"被引用但未使用"vs"完全未使用"  

---

## 一、重大发现

### 1.1 系统定义位置真相

经过仔细比对，发现以下事实：

| 领域 | index.html内联 | src/systems/外部 | 实际情况 |
|------|----------------|------------------|----------|
| **宠物** | Pet, PetManager | PetSystem.js | **index.html在用**，PetSystem.js可能是旧版/备用 |
| **武器** | Weapon | weaponSystem.js | **index.html在用**，WeaponSystem.js被引用但Game未实例化 |
| **道具** | ItemManager, SynergyManager, PassiveManager | 无 | **全部内联** |
| **敌人** | Enemy | 无 | **全部内联** |
| **房间** | Room, HordeManager | 无 | **全部内联** |
| **音效** | 部分内联 | AudioSystem.js, SoundEffectSystem.js | **混合使用** |
| **渲染** | SpriteLoader, ParticleSystem | HD2DRenderer.js等 | **混合使用** |

### 1.2 外部文件使用状态

**被引用且实际使用的文件** (✅ 真正在用):
```
src/systems/collision.js        - 碰撞检测
src/systems/weaponUpgrade.js    - 武器升级
src/systems/prologue.js         - 开场剧情
src/systems/shopNPC.js          - 商店NPC
src/systems/storyEvents.js      - 剧情事件
src/systems/trueEnding.js       - 真结局
src/systems/AudioSystem.js      - 音效系统
src/systems/AudioController.js  - 音频控制
src/systems/SoundEffectSystem.js - 音效效果
src/systems/SpriteDataRegistry.js - 贴图数据
src/render/HD2DEffects.js       - HD2D效果
src/render/HD2DRenderer.js      - HD2D渲染
src/render/systems/*            - 各种渲染系统
src/data/enemyCodex.js          - 敌人图鉴
src/data/totemData.js           - 图腾数据
```

**被引用但可能未使用的文件** (⚠️ 需要验证):
```
src/systems/weaponSystem.js     - 定义WeaponSystem类，但Game类未实例化
src/systems/PetSystem.js        - 定义宠物系统，但index.html使用内联版本
src/systems/WeaponBalanceTester.js - 平衡测试工具
```

**完全未使用的文件** (❌ 可清理):
```
src/systems/audio.js            - 被audio_enhanced.js取代
src/systems/audio_enhanced.js   - 可能已整合
src/systems/EffectSpriteData.js - 可能未使用
src/systems/ItemSpriteData.js   - 可能未使用
src/systems/HD2DCompositor.js   - 可能未使用
src/systems/pixel_prologue.js   - 被prologue.js取代
src/systems/SpriteAutoAdapter.js - 可能未使用
src/systems/SpriteBatchRenderer.js - 可能未使用
src/systems/SpritePerfMonitor.js - 可能未使用
src/systems/SpriteScaleManager.js - 可能未使用
src/systems/WeaponSpriteData.js - 可能未使用
```

---

## 二、系统清单总表 (修正后)

### 2.1 核心游戏系统 (index.html内联，高频修改)

| # | 类名 | 起始行 | 行数 | 职责 | 外部文件 | 状态 | 优先级 |
|---|------|--------|------|------|----------|------|--------|
| 1 | **Weapon** | 5803 | ~900 | 武器攻击逻辑 | ❌ 无 | 🟡 内联在用 | 🔥 P0 |
| 2 | **Enemy** | 6704 | ~1560 | 敌人AI行为 | ❌ 无 | 🟡 内联在用 | 🔥 P0 |
| 3 | **Room** | 8468 | ~859 | 房间管理 | ❌ 无 | 🟡 内联在用 | 🔥 P1 |
| 4 | **Game** | 11301 | ~10514 | 游戏主控 | ❌ 无 | 🟡 内联在用 | 🔥 P0 |
| 5 | Pet | 3570 | ~710 | 宠物实体 | ⚠️ PetSystem.js(备用) | 🟡 内联在用 | P2 |
| 6 | PetManager | 4280 | ~131 | 宠物管理 | ⚠️ PetSystem.js(备用) | 🟡 内联在用 | P2 |
| 7 | ItemManager | 4411 | ~605 | 道具管理 | ❌ 无 | 🟡 内联在用 | P2 |
| 8 | SynergyManager | 5016 | ~154 | 协同系统 | ❌ 无 | 🟡 内联在用 | P3 |
| 9 | PassiveManager | 5170 | ~633 | 被动道具 | ❌ 无 | 🟡 内联在用 | P2 |
| 10 | HordeManager | 9327 | ~411 | 波次管理 | ❌ 无 | 🟡 内联在用 | P2 |
| 11 | MapGenerator | 9738 | ~368 | 地图生成 | ❌ 无 | 🟡 内联在用 | P2 |
| 12 | ShopNPC | 8264 | ~119 | 商店NPC | ✅ shopNPC.js | 🟠 混合 | P2 |

### 2.2 渲染系统 (混合状态)

| # | 类名 | 位置 | 外部文件 | 状态 |
|---|------|------|----------|------|
| 1 | SpriteLoader | index.html:1910 | ❌ 无 | 🟡 内联在用 |
| 2 | ParticleSystem | index.html:2114 | ❌ 无 | 🟡 内联在用 |
| 3 | WeaponVisualSystem | index.html:2572 | ❌ 无 | 🟡 内联在用 |
| 4 | HD2DRenderer | - | ✅ HD2DRenderer.js | 🔵 已模块化 |
| 5 | HD2DEffects | - | ✅ HD2DEffects.js | 🔵 已模块化 |
| 6 | AmbienceSystem | - | ✅ render/systems/ | 🔵 已模块化 |
| 7 | 其他渲染系统 | - | ✅ render/systems/ | 🔵 已模块化 |

### 2.3 音效系统 (已模块化)

| # | 类名 | 外部文件 | 状态 |
|---|------|----------|------|
| 1 | AudioSystem | ✅ AudioSystem.js | 🔵 已模块化 |
| 2 | AudioController | ✅ AudioController.js | 🔵 已模块化 |
| 3 | SoundEffectSystem | ✅ SoundEffectSystem.js | 🔵 已模块化 |

### 2.4 数据常量 (index.html内联)

| 常量名 | 起始行 | 大小 | 外部文件 | 状态 | 优先级 |
|--------|--------|------|----------|------|--------|
| **ITEMS** | 3196 | ~1100行 | ❌ 无 | 🟡 内联 | 🔥 P0 |
| **PETS** | 3324 | ~200行 | ⚠️ PetSystem.js中有重复 | 🟡 内联 | P1 |
| **ENEMY_TYPES** | 6461 | ~500行 | ❌ 无 | 🟡 内联 | 🔥 P0 |
| SURVIVOR_CONFIG | 10571 | ~50行 | ❌ 无 | 🟡 内联 | P1 |
| ROOM_TEMPLATES | 10725 | ~30行 | ❌ 无 | 🟡 内联 | P2 |
| FLOOR_THEMES | 10753 | ~30行 | ❌ 无 | 🟡 内联 | P2 |

---

## 三、迁移策略修正

### 3.1 删除/清理阶段 (先做减法)

**Round 0.1: 清理未使用的外部文件**

待验证后删除的文件:
```
src/systems/weaponSystem.js     # 被引用但未使用，使用内联Weapon类
src/systems/PetSystem.js        # 与内联版本重复
src/systems/audio.js            # 被取代
src/systems/audio_enhanced.js   # 可能已整合
src/systems/EffectSpriteData.js # 未使用
src/systems/ItemSpriteData.js   # 未使用
src/systems/HD2DCompositor.js   # 未使用
src/systems/pixel_prologue.js   # 被取代
src/systems/SpriteAutoAdapter.js
src/systems/SpriteBatchRenderer.js
src/systems/SpritePerfMonitor.js
src/systems/SpriteScaleManager.js
src/systems/WeaponSpriteData.js
```

**自查清单**:
- [ ] 删除前在index.html中搜索确认无引用
- [ ] 删除后游戏能正常启动
- [ ] 删除后功能正常

### 3.2 数据迁移阶段

**优先级调整**:
1. **ITEMS** (200道具) - 🔥 P0 - 最高优先级
2. **ENEMY_TYPES** (22敌人) - 🔥 P0 - 最高优先级
3. PETS - P1 - 与PetSystem.js合并考虑

### 3.3 核心系统迁移

**实际迁移目标** (真正需要从内联提取的):
```
index.html内联 → 外部文件
├── Weapon → src/systems/weapons/Weapon.js
├── Enemy → src/systems/enemies/Enemy.js
├── Room → src/systems/rooms/Room.js
├── SpriteLoader → src/core/SpriteLoader.js
├── ParticleSystem → src/systems/effects/ParticleSystem.js
├── ItemManager → src/systems/items/ItemManager.js
└── Game → 保留在index.html，但瘦身
```

---

## 四、修正后的迭代路线

```
迭代 0: 清理未使用的外部文件 (先做减法)
├── Round 0.1: 验证并删除未使用的src/systems/文件
└── Round 0.2: 更新index.html引用

迭代 1: 数据层迁移
├── Round 1.1: ITEMS → data/items/index.js
├── Round 1.2: ENEMY_TYPES → data/enemies/index.js
└── Round 1.3: PETS (考虑与PetSystem.js合并)

迭代 2: 独立系统迁移 (低风险)
├── Round 2.1: SpriteLoader → 外部
├── Round 2.2: ParticleSystem → 外部
└── Round 2.3: DamageNumberSystem → 外部

迭代 3: 核心系统迁移 (高风险)
├── Round 3.1: ItemManager → 外部
├── Round 3.2: Weapon → 外部
└── Round 3.3: Enemy → 外部

迭代 4: Game类瘦身
└── Round 4.1: 分多轮提取Room/HordeManager等
```

---

## 五、立即行动建议

### 第一步: 验证未使用文件 (今天)

对每个可疑的外部文件:
1. 在index.html中搜索类名是否被实例化
2. 确认Game类是否引用
3. 确认删除后游戏正常

### 第二步: 开始迭代0 (清理)

确认无使用后，删除冗余文件，让src/目录更清晰。

---

## 六、关键区别说明

### v1.0 vs v1.1 主要修正

| 方面 | v1.0 (错误) | v1.1 (修正) |
|------|-------------|-------------|
| 外部文件状态 | 认为都是备用的 | 区分使用/未使用/重复 |
| Pet系统 | 认为需要新建 | PetSystem.js可能已存在但未使用 |
| Weapon系统 | 认为需要新建 | weaponSystem.js被引用但未使用 |
| 迁移优先级 | 从独立系统开始 | 先从清理未使用文件开始 |
| 核心目标 | 26个类全部迁移 | 先清理，再迁移真正需要的 |

---

**修正时间**: 2026-03-05  
**状态**: 等待开始迭代0 (清理未使用的外部文件)  

~Meow (Role A: Project Lead)
