# 全系统迁移计划 v1.0
## Plan: Index.html 模块化重构

**版本**: v1.0  
**日期**: 2026-03-05  
**状态**: 计划阶段 (Role A - Project Lead)  
**计划人**: Kimi Code CLI  

---

## 一、现状诊断报告

### 1.1 代码规模分析

| 指标 | 数值 | 评估 |
|------|------|------|
| index.html 总行数 | ~22,037 行 | ⚠️ 严重超标 |
| 内嵌JavaScript | ~18,000 行 | 🔴 危险 |
| CSS样式 | ~1,800 行 | ⚠️ 需分离 |
| 定义类数量 | 22 个主要类 | ⚠️ 需模块化 |
| 全局常量 | 8+ 大型对象 | 🔴 需数据分离 |
| src/ 现有文件 | 103 个 | ⚠️ 需清理冗余 |

### 1.2 核心问题清单

#### 🔴 严重问题 (P0)
1. **单一文件过大** - index.html 22k+ 行，维护成本极高
2. **代码重复定义** - 武器系统、道具数据等既在 src/ 又在 index.html
3. **全局命名空间污染** - 所有类/函数都在 window 对象
4. **没有模块系统** - 无法使用 ES6 imports/exports
5. **依赖关系混乱** - 加载顺序敏感，循环依赖风险

#### 🟠 中等问题 (P1)
6. **CSS内联** - 样式与结构耦合，主题切换困难
7. **常量数据混杂** - ITEMS (200+道具)、ENEMY_TYPES (22敌人) 内嵌
8. **版本管理困难** - 无法有效追踪代码变更
9. **测试困难** - 无法单元测试内联代码
10. **类型安全缺失** - 无 TypeScript 类型检查

#### 🟡 轻微问题 (P2)
11. 代码风格不统一
12. 注释/文档缺失
13. 性能监控点分散

### 1.3 类依赖拓扑图

```
Game (主控制器)
├── SpriteLoader (资源加载)
├── ParticleSystem (粒子)
│   ├── BloodStainSystem
│   └── DamageNumberSystem
├── WeaponVisualSystem
├── PetManager
│   └── Pet
├── ItemManager
├── SynergyManager
├── PassiveManager
├── Weapon
├── Enemy
├── ShopNPC
├── TotemManager
├── Room
│   └── HordeManager
├── MapGenerator
├── SurvivorCamera
├── SpatialGrid (碰撞优化)
├── ObjectPool
├── PerformanceMonitor
├── FullscreenAdapter
└── ScoreManager
```

### 1.4 数据常量清单

| 常量名 | 行数 | 类型 | 优先级 |
|--------|------|------|--------|
| ITEMS | ~1000 行 | 200道具数据 | P0 |
| PETS | ~200 行 | 宠物配置 | P0 |
| ENEMY_TYPES | ~500 行 | 22敌人定义 | P0 |
| WEAPON_BASE | ~100 行 | 武器基础 | P1 |
| RARITY_COLORS | ~20 行 | 颜色配置 | P2 |
| ROOM_TEMPLATES | ~30 行 | 房间模板 | P2 |
| FLOOR_THEMES | ~30 行 | 楼层主题 | P2 |
| MAP_EVENTS | ~20 行 | 地图事件 | P2 |
| SURVIVOR_CONFIG | ~50 行 | 游戏配置 | P1 |

---

## 二、目标架构设计

### 2.1 目标架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      index.html (入口)                       │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  <script type="module" src="src/main.js"></script>   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       src/main.js                          │
│  - 应用启动器                                                │
│  - 依赖注入容器                                              │
│  - 全局事件总线                                              │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        ▼                   ▼                   ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Core 核心   │  │ Systems 系统  │  │  Data 数据   │
├──────────────┤  ├──────────────┤  ├──────────────┤
│ Engine.js    │  │ Weapon/      │  │ items/       │
│ GameLoop.js  │  │ Enemy/       │  │ enemies/     │
│ Renderer.js  │  │ Room/        │  │ weapons/     │
│ EventBus.js  │  │ Pet/         │  │ pets/        │
│ Utils/       │  │ Shop/        │  │ configs/     │
└──────────────┘  └──────────────┘  └──────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      assets/ 资源                            │
│  - sprites/ (贴图)                                           │
│  - audio/ (音效)                                             │
│  - styles/ (CSS)                                             │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 模块划分方案

#### Phase 1: 基础设施 (Foundation)
```
src/
├── core/
│   ├── engine/           # 游戏引擎核心
│   │   ├── Entity.js     # 实体基类
│   │   ├── Vec2.js       # 向量数学
│   │   └── Component.js  # ECS组件基类
│   ├── utils/
│   │   ├── math.js       # 数学工具
│   │   ├── helpers.js    # 通用工具 (已存在)
│   │   └── Logger.js     # 日志系统 (已存在)
│   └── events/
│       └── EventBus.js   # 事件总线
```

#### Phase 2: 数据层 (Data Layer)
```
src/
├── data/
│   ├── items/
│   │   ├── index.js      # 统一导出
│   │   ├── common.js     # 普通道具 (1-50)
│   │   ├── advanced.js   # 高级道具 (51-100)
│   │   └── cursed.js     # 诅咒道具
│   ├── enemies/
│   │   ├── index.js
│   │   ├── tier1.js      # T1敌人
│   │   ├── tier2.js      # T2精英
│   │   ├── tier3.js      # T3稀有
│   │   ├── tier4.js      # T4强敌
│   │   └── bosses.js     # Boss配置
│   ├── weapons/
│   │   ├── index.js
│   │   ├── melee.js      # 近战武器
│   │   ├── ranged.js     # 远程武器
│   │   └── super.js      # 超武进化
│   └── configs/
│       ├── game.js       # 游戏配置
│       ├── floors.js     # 楼层主题
│       └── rarities.js   # 稀有度配置
```

#### Phase 3: 系统层 (Systems)
```
src/
├── systems/
│   ├── weapons/
│   │   ├── Weapon.js           # 武器类
│   │   ├── WeaponManager.js    # 武器管理器
│   │   ├── Projectile.js       # 投射物
│   │   └── upgrades.js         # 升级逻辑
│   ├── enemies/
│   │   ├── Enemy.js            # 敌人类
│   │   ├── EnemyManager.js     # 敌人管理
│   │   ├── EnemyAI.js          # AI行为树
│   │   └── Spawner.js          # 生成器
│   ├── rooms/
│   │   ├── Room.js             # 房间类
│   │   ├── MapGenerator.js     # 地图生成
│   │   └── RoomManager.js      # 房间管理
│   ├── items/
│   │   ├── ItemManager.js      # 道具管理
│   │   └── SynergyManager.js   # 协同系统
│   ├── pets/
│   │   ├── Pet.js              # 宠物类
│   │   └── PetManager.js       # 宠物管理
│   ├── effects/
│   │   ├── ParticleSystem.js   # 粒子系统
│   │   ├── DamageNumbers.js    # 伤害数字
│   │   └── BloodStains.js      # 血迹系统
│   ├── render/
│   │   ├── Camera.js           # 相机系统
│   │   ├── Renderer.js         # 渲染器
│   │   └── HD2D/               # HD-2D效果 (已存在)
│   └── ui/
│       ├── ShopNPC.js          # 商店NPC
│       ├── DialogSystem.js     # 对话系统
│       └── HUD.js              # 界面HUD
```

#### Phase 4: 游戏主控 (Game Core)
```
src/
├── game/
│   ├── Game.js           # 主游戏类 (精简版)
│   ├── StateMachine.js   # 状态机
│   ├── SaveManager.js    # 存档管理 (已存在)
│   └── Config.js         # 运行时配置
└── main.js               # 入口文件
```

---

## 三、迁移路线图

### 3.1 阶段规划

```
Phase 1 (Week 1-2): 基础设施 + 数据迁移
├─ 目标: 将常量数据迁移到独立模块
├─ 产出: data/ 目录，index.html 减少 ~2000 行
└─ 风险: 低 (纯数据移动)

Phase 2 (Week 3-4): 工具类 + 效果系统
├─ 目标: 迁移独立工具类和视觉效果
├─ 产出: systems/effects/, utils/ 完善
└─ 风险: 低 (独立系统)

Phase 3 (Week 5-6): 核心系统重构
├─ 目标: Weapon, Enemy, Room 类
├─ 产出: systems/weapons/, systems/enemies/
└─ 风险: 中 (核心逻辑)

Phase 4 (Week 7-8): 游戏主控重构
├─ 目标: Game 类瘦身，依赖注入
├─ 产出: game/Game.js (精简到 <1000 行)
└─ 风险: 高 (需要大量测试)

Phase 5 (Week 9): 整合测试 + 清理
├─ 目标: 端到端测试，清理冗余
├─ 产出: 稳定的模块化架构
└─ 风险: 中 (集成测试)
```

### 3.2 详细任务分解

#### Phase 1: 数据迁移 (优先级: P0)

| 任务 | 描述 | 文件 | 预估行数 |
|------|------|------|----------|
| 1.1 | 提取 ITEMS 数据 | data/items/index.js | ~1000 |
| 1.2 | 提取 PETS 数据 | data/pets/index.js | ~200 |
| 1.3 | 提取 ENEMY_TYPES | data/enemies/index.js | ~500 |
| 1.4 | 提取配置常量 | data/configs/ | ~200 |
| 1.5 | 创建数据导出入口 | data/index.js | ~50 |
| 1.6 | index.html 移除数据，改为 import | index.html | -2000 |

#### Phase 2: 工具类迁移 (优先级: P1)

| 任务 | 描述 | 文件 | 依赖 |
|------|------|------|------|
| 2.1 | 迁移 SpriteLoader | core/engine/SpriteLoader.js | 无 |
| 2.2 | 迁移 ParticleSystem | systems/effects/ParticleSystem.js | 无 |
| 2.3 | 迁移 DamageNumberSystem | systems/effects/DamageNumbers.js | 无 |
| 2.4 | 迁移 BloodStainSystem | systems/effects/BloodStains.js | 无 |
| 2.5 | 迁移性能监控 | core/PerformanceMonitor.js | 无 |
| 2.6 | 统一工具函数 | utils/index.js | 无 |

#### Phase 3: 核心系统重构 (优先级: P0)

| 任务 | 描述 | 文件 | 复杂度 |
|------|------|------|--------|
| 3.1 | Weapon 类模块化 | systems/weapons/Weapon.js | 高 |
| 3.2 | WeaponManager | systems/weapons/Manager.js | 高 |
| 3.3 | Enemy 类模块化 | systems/enemies/Enemy.js | 高 |
| 3.4 | EnemyAI 提取 | systems/enemies/AI.js | 中 |
| 3.5 | Room 类模块化 | systems/rooms/Room.js | 中 |
| 3.6 | MapGenerator 重构 | systems/rooms/MapGenerator.js | 中 |
| 3.7 | Pet/PetManager | systems/pets/ | 低 |
| 3.8 | ShopNPC 重构 | systems/ui/ShopNPC.js | 中 |

#### Phase 4: 游戏主控 (优先级: P0)

| 任务 | 描述 | 文件 | 风险 |
|------|------|------|------|
| 4.1 | Game 类解耦 | game/Game.js | 高 |
| 4.2 | 依赖注入容器 | core/DIContainer.js | 中 |
| 4.3 | 状态机重构 | game/StateMachine.js | 中 |
| 4.4 | 事件总线 | core/EventBus.js | 低 |
| 4.5 | 主入口重构 | main.js | 高 |

#### Phase 5: 整合与优化 (优先级: P1)

| 任务 | 描述 | 验收标准 |
|------|------|----------|
| 5.1 | 端到端测试 | 游戏可正常开始、战斗、通关 |
| 5.2 | 性能基准测试 | FPS >= 迁移前 |
| 5.3 | 清理 src/ 冗余 | 删除旧版本/备份文件 |
| 5.4 | 文档更新 | README, AGENTS.md 更新 |
| 5.5 | CI/CD 配置 | GitHub Actions 自动化测试 |

---

## 四、技术方案

### 4.1 模块规范

```javascript
// 使用 ES6 模块标准
// data/items/index.js
export const ITEMS = { /* ... */ };
export const getItemById = (id) => ITEMS[id];
export const getItemsByRarity = (rarity) => /* ... */;

// systems/weapons/Weapon.js
import { ITEMS } from '../../data/items/index.js';
import { Logger } from '../../core/utils/Logger.js';

export class Weapon {
    constructor(config) {
        // ...
    }
}

// main.js
import { Game } from './game/Game.js';
import { DIContainer } from './core/DIContainer.js';

const container = new DIContainer();
const game = container.resolve(Game);
game.start();
```

### 4.2 依赖注入设计

```javascript
// core/DIContainer.js
export class DIContainer {
    constructor() {
        this.services = new Map();
        this.singletons = new Map();
    }
    
    register(token, factory, singleton = false) {
        this.services.set(token, { factory, singleton });
    }
    
    resolve(token) {
        const service = this.services.get(token);
        if (!service) throw new Error(`Service ${token} not found`);
        
        if (service.singleton) {
            if (!this.singletons.has(token)) {
                this.singletons.set(token, service.factory(this));
            }
            return this.singletons.get(token);
        }
        
        return service.factory(this);
    }
}

// 使用
container.register('SpriteLoader', (c) => new SpriteLoader(), true);
container.register('Game', (c) => new Game({
    spriteLoader: c.resolve('SpriteLoader'),
    // ...
}));
```

### 4.3 渐进式迁移策略

为了避免"大爆炸式"重构风险，采用**双轨制**迁移：

```javascript
// 阶段1-2: 并行存在
// index.html 中同时保留旧代码和引入新模块

// 新代码通过全局变量临时兼容
import { Weapon as NewWeapon } from './systems/weapons/Weapon.js';
window.WeaponNew = NewWeapon;

// 逐步替换引用
// 旧: const w = new Weapon(...)
// 新: const w = new window.WeaponNew(...)

// 阶段3-4: 完全替换
// 删除 index.html 中的旧类定义
// 所有引用改为 ES6 import
```

### 4.4 向后兼容性保障

```javascript
// 创建兼容层
// core/compat.js

// 检测运行环境
const isModuleMode = typeof import !== 'undefined';

// 导出兼容API
export const compat = {
    // 确保全局对象存在
    ensureGlobal(name, value) {
        if (!window[name]) {
            window[name] = value;
        }
        return window[name];
    },
    
    // 版本检测
    checkVersion() {
        return 'v1.0.0-module';
    }
};
```

---

## 五、风险评估与应对

### 5.1 风险矩阵

| 风险 | 概率 | 影响 | 应对策略 |
|------|------|------|----------|
| 迁移过程引入Bug | 高 | 高 | 双轨制 + 完整测试 |
| 模块循环依赖 | 中 | 高 | 依赖注入 + 接口抽象 |
| 性能下降 | 低 | 中 | 基准测试 + 持续监控 |
| 浏览器兼容性 | 低 | 高 | 保持 ES6 模块标准 |
| 数据不一致 | 中 | 高 | 自动化数据验证 |
| 开发进度延迟 | 中 | 中 | 分阶段交付 |

### 5.2 应急预案

#### 预案 A: 迁移中出现严重Bug
1. 立即回滚到上一稳定版本 (使用 backup/)
2. 使用 git bisect 定位问题提交
3. 隔离问题模块，其他模块继续迁移

#### 预案 B: 性能不达预期
1. 启用 webpack/rollup 进行代码分割
2. 按需加载 (dynamic import)
3. 优化渲染管线

#### 预案 C: 迁移周期过长
1. 优先保证核心系统 (Weapon, Enemy, Game)
2. 边缘系统可以延后
3. 接受"混合架构"长期存在

---

## 六、验收标准

### 6.1 技术指标

| 指标 | 当前 | 目标 | 验收方式 |
|------|------|------|----------|
| index.html 行数 | 22,037 | < 5,000 | wc -l |
| 类定义分散度 | 1 文件 | 20+ 文件 | 文件计数 |
| 代码重复率 | ~15% | < 5% | jscpd |
| 单元测试覆盖率 | 0% | > 30% | jest |
| 启动加载时间 | ~3s | < 4s | Chrome DevTools |
| 运行时FPS | 55 | >= 55 | 游戏内监控 |

### 6.2 功能指标

- [ ] 游戏可以正常启动
- [ ] 所有武器类型正常工作
- [ ] 所有敌人类型正常生成和战斗
- [ ] 房间系统正常运作
- [ ] 道具系统正常收集和生效
- [ ] 存档/读档功能正常
- [ ] 音效系统正常
- [ ] HD-2D 渲染正常
- [ ] AI训练系统兼容

---

## 七、下一步行动

### 7.1 需要用户确认的事项

1. **是否同意此迁移计划？**
2. **优先级调整**：是否有特定系统需要优先/延后迁移？
3. **时间约束**：是否有明确的deadline？
4. **风险承受度**：是否可以接受迁移期间功能暂时不稳定？
5. **团队资源**：是否有其他开发者可以协助？

### 7.2 等待确认后开始

一旦获得确认，将：
1. 创建 `migration/` 分支进行开发
2. 执行 Phase 1: 数据迁移
3. 每完成一个Phase提交报告

---

## 八、附录

### A. 现有 src/ 文件清单 (需要清理)

```
src/
├── ai/                    # AI系统 (保留)
├── collision_optimized.js # 已废弃?
├── core_engine.js         # 早期版本?
├── data/                  # 数据文件 (保留扩展)
├── debug/                 # 调试工具 (保留)
├── engine.js              # 早期版本?
├── game*.js               # 19个历史版本! 需要清理
├── GameECS.js             # ECS实验?
├── isaac_room_system.js   # 早期版本?
├── items*.js              # 道具系统文件
├── main.js                # 入口 (需要更新)
├── particle_pool.js       # 粒子池
├── render/                # 渲染系统 (保留)
├── room_rewards.js        # 奖励系统
├── sprites_manager.js     # 精灵管理
├── systems/               # 系统模块 (保留扩展)
├── utils/                 # 工具函数 (保留)
└── vampire_engine.js      # 早期版本?
```

**建议**: 将 game_v*.js 等历史版本移动到 `archive/old_src/` 或删除。

### B. 工具推荐

| 用途 | 工具 | 优先级 |
|------|------|--------|
| 打包 | Rollup / Vite | P1 |
| 测试 | Jest + Playwright | P1 |
| 类型检查 | TypeScript (渐进式) | P2 |
| 代码质量 | ESLint + Prettier | P2 |
| CI/CD | GitHub Actions | P3 |

---

*文档版本: v1.0*  
*最后更新: 2026-03-05*  
*状态: 等待确认*  

~Meow (Role A: Project Lead)
