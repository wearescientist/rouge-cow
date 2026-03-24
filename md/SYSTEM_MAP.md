# 🗺️ 肉鸽牛牛 - 系统映射文档

> 本文档用于帮助AI定位代码位置，避免混淆index内部逻辑和外部文件
> **版本**: v2.0 | **最后更新**: 2026-03-05

---

## ⚠️ 重要声明（必读）

### 代码位置优先级规则
1. **index.html内部定义** = 当前运行的主逻辑（以这个为准）
2. **index.html引用的外部脚本** = 已迁移并正在使用的模块
3. **src/下未被引用的文件** = 备用/历史版本（修改前需确认）

### AI开发守则
- ❌ **禁止假设**: 不要以为某个系统在外部文件就修改外部文件
- ✅ **先查本文档**: 确认系统实际位置后再修改
- ✅ **修改后更新**: 如果有迁移，同步更新本文档

---

## 📊 系统分布总览

```
rougelike-cow/
├── index.html (15,000+ lines)
│   ├── 内部定义: 21个核心类 ← 实际运行
│   └── 引用外部: 18个.js文件 ← 已模块化
│
├── src/
│   ├── systems/           # 游戏系统
│   │   ├── PetSystem.js         ✅ 已迁移并使用
│   │   ├── weaponUpgrade.js     ✅ 已迁移并使用
│   │   ├── AudioSystem.js       ✅ 已迁移并使用
│   │   ├── AudioController.js   ✅ 已迁移并使用
│   │   ├── Sprite* (8个)        ✅ 已迁移并使用
│   │   ├── weaponSystem.js      ⚠️ 已加载但未使用(ECS备用)
│   │   ├── shopNPC.js           ⚠️ 已加载但未使用
│   │   └── ...其他备用系统
│   ├── data/              # 数据定义
│   │   ├── enemyCodex.js        ✅ 已使用
│   │   └── totemData.js         ✅ 已使用
│   └── utils/             # 工具函数
│       ├── helpers.js           ✅ 已使用
│       └── SpriteData.js        ✅ 已使用
│
└── archive/               # 历史备份（不使用）
    └── ecs_systems/       # 旧ECS架构
```

---

## ✅ 已迁移并使用的系统（18个）

### Sprite系统（8个）- 全部位于 `src/systems/`
| 文件名 | 作用 | 大小 | 状态 |
|--------|------|------|------|
| SpriteDataRegistry.js | 精灵注册管理 | 15KB | ✅ |
| SpriteScaleManager.js | 缩放管理 | 5KB | ✅ |
| SpriteBatchRenderer.js | 批量渲染 | 6KB | ✅ |
| WeaponSpriteData.js | 武器精灵数据 | 9KB | ✅ |
| ItemSpriteData.js | 道具精灵数据 | 8KB | ✅ |
| EffectSpriteData.js | 特效精灵数据 | 10KB | ✅ |
| SpritePerfMonitor.js | 性能监控 | 9KB | ✅ |
| SpriteAutoAdapter.js | 自动适配 | 10KB | ✅ |

### 游戏系统（6个）
| 文件名 | 路径 | 作用 | 状态 |
|--------|------|------|------|
| AudioSystem.js | `src/systems/` | BGM管理 | ✅ 使用中 |
| AudioController.js | `src/systems/` | 音效播放 | ✅ 使用中 |
| PetSystem.js | `src/systems/` | 宠物/伙伴 | ✅ 使用中 |
| weaponUpgrade.js | `src/systems/` | 武器升级表 | ✅ 使用中 |
| prologue.js | `src/systems/` | 序章系统 | ✅ 使用中 |
| shopNPC.js | `src/systems/` | 商店NPC | ⚠️ 可能冲突 |

### 工具与数据（4个）
| 文件名 | 路径 | 作用 | 状态 |
|--------|------|------|------|
| helpers.js | `src/utils/` | 工具函数 | ✅ |
| SpriteData.js | `src/utils/` | 精灵数据基类 | ✅ |
| enemyCodex.js | `src/data/` | 敌人图鉴 | ✅ |
| totemData.js | `src/data/` | 图腾数据 | ✅ |

---

## 🏠 index.html内部定义的类（21个 - 实际运行）

### 核心游戏类
| 类名 | 行号 | 职责 | 复杂度 | 迁移优先级 |
|------|------|------|--------|-----------|
| `Game` | ~10191 | 游戏主循环/状态管理 | 🔴 极高 | Phase 3 |
| `Weapon` | ~4882 | 武器逻辑/攻击/升级 | 🔴 高 | Phase 1 |
| `Enemy` | ~5771 | 敌人AI/行为 | 🟡 中 | Phase 1 |
| `Room` | ~7456 | 房间系统 | 🟡 中 | Phase 2 |
| `MapGenerator` | ~8633 | 地图生成 | 🟡 中 | Phase 2 |

### 管理器类
| 类名 | 行号 | 职责 | 迁移优先级 |
|------|------|------|-----------|
| `ItemManager` | ~3455 | 道具管理 | Phase 1 |
| `SynergyManager` | ~4113 | 协同效果 | Phase 1 |
| `PassiveManager` | ~4261 | 被动道具 | Phase 1 |
| `TotemManager` | ~7376 | 图腾管理 | Phase 2 |
| `ShopNPC` | ~7257 | 商店NPC | Phase 2 |
| `HordeManager` | ~8227 | 敌群管理 | Phase 2 |
| `ScoreManager` | ~9648 | 分数管理 | Phase 2 |

### 视觉效果类
| 类名 | 行号 | 职责 | 迁移优先级 |
|------|------|------|-----------|
| `ParticleSystem` | ~2120 | 粒子效果 | Phase 2 |
| `WeaponVisualSystem` | ~2578 | 武器视觉效果 | Phase 2 |
| `DamageNumberSystem` | ~3060 | 伤害数字 | Phase 2 |
| `BloodStainSystem` | ~3023 | 血迹系统 | Phase 2 |

### 基础设施类
| 类名 | 行号 | 职责 | 迁移优先级 |
|------|------|------|-----------|
| `SpriteLoader` | ~1916 | 精灵加载 | 低 |
| `SurvivorCamera` | ~9000 | 相机控制 | Phase 3 |
| `SpatialGrid` | ~9234 | 空间网格 | Phase 3 |
| `ObjectPool` | ~9296 | 对象池 | Phase 2 |
| `PerformanceMonitor` | ~9386 | 性能监控 | Phase 3 |
| `FullscreenAdapter` | ~9572 | 全屏适配 | 低 |

### 辅助类
| 类名 | 行号 | 说明 |
|------|------|------|
| `BloodStainParticle` | ~2708 | 血迹粒子（内部使用） |
| `BloodStain` | ~2723 | 血迹对象（内部使用） |

---

## ⚠️ 已知问题与注意事项

### 问题1: 可能的功能重叠

| 外部文件 | index.html内 | 状态 | 说明 |
|----------|-------------|------|------|
| `weaponSystem.js` | `Weapon` class | ⚠️ 不同架构 | 外部是ECS系统，index内是OOP类 |
| `shopNPC.js` | `ShopNPC` class | ⚠️ 待确认 | 检查是否重复定义 |
| `collision.js` | 内置碰撞函数 | ⚠️ 待确认 | 检查函数名冲突 |

**注意**: `weaponSystem.js`虽然被加载，但使用的是index.html内的`Weapon`类。

### 问题2: 历史版本文件

`src/`目录下有大量历史版本文件，**修改前请确认不是这些文件**：
- `game_v1.js` 到 `game_v19.js`
- `game_v2.1.js` 到 `game_v2.8.js`
- `game_complete.js`, `game_final.js`, `game_stable.js`
- `weapon_system.js` (与`systems/weaponSystem.js`不同)
- `enemy_system.js`
- `items_system.js`

---

## 🔍 快速查找指南

### 武器相关
```bash
# 实际使用的Weapon类
index.html Line ~4882

# 武器升级表（外部）
src/systems/weaponUpgrade.js

# 武器精灵数据（外部）
src/systems/WeaponSpriteData.js

# 武器配置常量
index.html Line ~4540 (WEAPONS)
index.html Line ~4780 (SUPER_WEAPONS)
```

### 宠物相关
```bash
# 全部在外部文件
src/systems/PetSystem.js

# index.html内只有引用
<script src="src/systems/PetSystem.js">
```

### 敌人相关
```bash
# 实际使用的Enemy类
index.html Line ~5771

# 敌人类型配置
index.html Line ~5548 (ENEMY_TYPES)
index.html Line ~5600 (BOSS_TYPES)

# 敌人图鉴数据（外部）
src/data/enemyCodex.js
```

### 音频相关
```bash
# 实际使用的是外部系统
src/systems/AudioSystem.js      # BGM
src/systems/AudioController.js  # 音效

# 在Game类中初始化 (Line ~10191)
this.audio = new AudioSystem();
this.audioCtrl = new AudioController(this);
```

### 道具相关
```bash
# ItemManager类
index.html Line ~3455

# 道具配置
index.html Line ~3317 (ITEMS常量)

# 道具精灵数据（外部）
src/systems/ItemSpriteData.js
```

### 圣水（Holy Water）相关
```bash
# 武器配置
WEAPONS.holy_water: index.html Line ~4905

# 超武配置
SUPER_WEAPONS.la_borra: index.html Line ~5194

# 攻击逻辑
fireArea(): index.html Line ~5824

# 升级表
src/systems/weaponUpgrade.js -> holy_water
```

---

## 📁 目录结构参考

```
rougelike-cow/
├── index.html                  # 主入口（15,000+ lines）
│   └── 包含21个类定义 ← 这是核心
│
├── src/
│   ├── systems/                # 系统模块（18个已引用）
│   │   ├── PetSystem.js        ✅ 宠物系统
│   │   ├── weaponUpgrade.js    ✅ 武器升级
│   │   ├── AudioSystem.js      ✅ BGM系统
│   │   ├── AudioController.js  ✅ 音效系统
│   │   ├── Sprite*.js (8个)    ✅ Sprite系统
│   │   ├── prologue.js         ✅ 序章
│   │   ├── shopNPC.js          ⚠️ 可能未使用
│   │   ├── weaponSystem.js     ⚠️ ECS备用
│   │   ├── collision.js        ⚠️ 可能未使用
│   │   ├── save_manager.js     ❌ 未引用
│   │   ├── stats_achievements.js ❌ 未引用
│   │   └── ...其他备用
│   │
│   ├── data/                   # 数据定义
│   │   ├── enemyCodex.js       ✅ 敌人图鉴
│   │   └── totemData.js        ✅ 图腾数据
│   │
│   ├── utils/                  # 工具函数
│   │   ├── helpers.js          ✅ 工具函数
│   │   ├── SpriteData.js       ✅ 精灵数据
│   │   └── ...其他
│   │
│   └── [历史版本文件35+]       # game_v*.js等，不使用
│
├── archive/                    # 备份目录
│   └── ecs_systems/            # 旧ECS架构备份
│       ├── core_new/           # 核心系统备份
│       ├── ecs/                # ECS基础
│       ├── systems_new/        # 系统备份
│       └── render_systems_backup*/ # 渲染系统备份
│
└── SYSTEM_MAP.md               # 本文档
```

---

## 📝 修改前检查清单

当需要修改某个功能时：

1. **查看本文档** - 确认系统位置
2. **如果在外部文件** - 修改 `src/systems/` 或 `src/utils/` 下的对应文件
3. **如果在index.html** - 在对应行号附近修改
4. **如果不确定** - 在index.html中搜索类名/函数名确认
5. **修改后** - 测试功能是否正常

---

## 🚧 迁移路线图

### Phase 1（建议近期）
- [ ] Enemy系统 → `src/systems/enemySystem.js`
- [ ] Item/Synergy/Passive管理器
- [ ] 解决shopNPC重复定义

### Phase 2（中期）
- [ ] 视觉效果系统（Particle/DamageNumber/BloodStain）
- [ ] ObjectPool, HordeManager

### Phase 3（长期）
- [ ] Room/Map/Camera系统
- [ ] Game主类（最后迁移）

---

*本文档是AI开发的核心参考资料，请保持更新。*
