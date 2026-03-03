# 开发日志

## 2026-03-03 12:00 - v0.22 宠物系统实装（含阵型系统）

### 新增内容
- **Pet 类**: 单个宠物实例
  - 使用 player_cow 贴图，40%缩放（约26px大小）
  - 带行走动画和眨眼效果
  - 支持颜色叠加（不同宠物显示不同色调）
  - 三种AI状态：跟随(Follow) → 瞄准(Aim) → 攻击(Attack)
  - **阵型系统**: 3只宠物呈倒三角形分布，不会重叠
  - **碰撞避免**: 宠物间有15px半径碰撞体积，靠近时自动推开
  
- **PetManager 类**: 宠物管理器
  - 管理出战宠物列表（最大2只，可扩展至3只）
  - 维护已解锁宠物池（与出战列表分离）
  - 统一更新和渲染所有宠物
  - **为什么需要？**
    - 解耦：宠物逻辑不散落在Game类里
    - 扩展：未来支持宠物升级/进化/合成
    - 控制：限制出战数量，管理解锁池

- **15种宠物攻击类型**:
  - laser: 贯穿激光（硫磺火牛）
  - orbit: 环绕激光（科技牛）
  - bounce: 弹跳眼泪（眼泪牛）
  - bomb: 爆炸炸弹（炸弹牛）
  - boomerang: 回旋飞刀（飞刀牛）
  - blackhole: 吸引黑洞（黑洞牛）
  - aura: 范围光环（光环牛）
  - homing: 追踪导弹（导弹牛）
  - proj: 默认投射物

- **调试面板功能**:
  - 宠物下拉选择框
  - 添加/随机/清空宠物按钮
  - 实时显示当前宠物数量 (x/3)

### 阵型分布（3只宠物）
```
       [0]  ← 第一只（玩家正后方）
     ↙   ↘
   [1]   [2]  ← 第二、三只（左右侧后方）
   
间距: 35px
碰撞半径: 15px（靠近时自动推开）
```

### 修改内容
- Game构造函数: 初始化 `this.petManager`
- Game.update(): 添加宠物AI更新
- Game.draw(): 添加宠物渲染（在玩家之后）
- Game.unlockPet(): 使用PetManager管理

### 技术细节
- 宠物无敌（不受伤，不参与敌人碰撞检测）
- 自动索敌并攻击（无需玩家操作）
- 攻击使用与武器相同的子弹系统
- 宠物子弹标记 `isFromPet: true`
- 宠物移动速度150px/s（略快于玩家，确保能跟上）

---

## 2026-03-03 12:10 - v0.22 宠物系统：全上模式

### 修改内容
- **maxPets = 10**: 上场宠物上限提到10个
- **全上机制**: 解锁的宠物自动全部出战，无需选择
- **阵型系统扩展**: 支持最多10只宠物的分布
  - 内圈(0-2): 倒三角，紧贴玩家
  - 外圈(3-9): 234度弧形均匀分布

### 阵型图
```
            [0]          ← 第1只（正后方）
          ↙   ↘
        [1]   [2]        ← 第2、3只（内圈）
       
    [3] [4] [5] [6]      ← 第4-7只（外圈弧形）
   [7]           [8]
      [9] ...
```

### 行为变更
- 解锁宠物道具 → 自动添加该宠物出战
- 无需选择谁上场（出战池=解锁池）
- 调试面板显示 x/10

---

## 2026-03-03 12:30 - v0.22 宠物系统修复

### 修复内容

1. **初始位置修复**
   - 之前：和玩家重叠在一起
   - 现在：根据阵型偏移直接计算初始位置，进入房间就在玩家后面

2. **移速修复**
   - 之前：150px/s，会从远处跑过来

---

## 2026-03-03 23:00 - v0.22.1 全面优化 (Phase 1-3)

### Phase 1: 紧急修复

#### 内存泄漏防护 (EventManager)
- **文件**: `src/utils/EventManager.js`
- **功能**: 统一管理事件监听、定时器，支持批量清理
- **解决**: addEventListener/removeEventListener 比例失衡问题

#### 日志管理 (Logger)
- **文件**: `src/utils/Logger.js`
- **功能**: 生产环境自动禁用 debug 日志
- **解决**: 94处 console.log 污染问题

#### UI 交互修复
- **修复**: 武器选择防重复点击
- **修复**: 暂停菜单按钮交互（继续/设置/重启/主菜单）
- **文件**: `index.html`

### Phase 2: 代码重构

#### 核心模块创建
| 模块 | 文件 | 功能 |
|------|------|------|
| AssetManager | `src/core/AssetManager.js` | 资源加载、缓存管理 |
| PerformanceMonitor | `src/core/PerformanceMonitor.js` | FPS/内存/帧时间监控 |
| StateManager | `src/core/StateManager.js` | 状态管理、订阅模式 |
| Entity | `src/core/Entity.js` | 游戏实体基类 |
| ModuleLoader | `src/core/ModuleLoader.js` | 模块加载、依赖管理 |
| main.js | `src/main.js` | 入口文件、分阶段初始化 |

### Phase 3: 质量保障

#### 代码审计工具
- **文件**: `tools/code_audit.py`
- **结果**: 79文件/49419行代码，问题率14.43‰

#### 性能测试工具
- **文件**: `tools/perf_test.js`
- **功能**: 基准测试、压力测试、性能评级

#### 文档
- **文件**: `doc/report/REPORT_Optimization_v0.22.1.md`
- **内容**: 完整优化报告

### 新增文件清单
```
src/
├── core/
│   ├── AssetManager.js
│   ├── Entity.js
│   ├── ModuleLoader.js
│   ├── PerformanceMonitor.js
│   └── StateManager.js
├── utils/
│   ├── EventManager.js
│   └── Logger.js
├── main.js
tools/
├── code_audit.py
└── perf_test.js
doc/report/
└── REPORT_Optimization_v0.22.1.md
.gitignore
audit_report.json
```

### Git 提交
```
c21a14f chore: 添加 .gitignore 文件
e36f968 fix: Phase 1 紧急修复 - 内存泄漏、UI交互、日志管理
207a6e3 refactor: Phase 2 核心模块创建
6f299eb refactor: Phase 2 完成 - 实体基类、模块加载器、入口文件
e4bbf8a chore: Phase 3 质量保障 - 代码审计工具
ef65b6c chore: Phase 3 完成 - 性能测试工具
```

### 后续计划
1. 迁移 index.html 核心逻辑到新模块
2. 清理历史版本文件
3. 引入构建工具 (Vite)
4. TypeScript 迁移
