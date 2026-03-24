# PLAN_UI_Migration_After_Cinematic_Polish_v0.33

## 目标
- 在不扰动战斗核心逻辑的前提下，逐步把 `index.html` 中已经相对稳定的 UI/HUD/Overlay 逻辑抽离到独立模块。
- 迁移顺序遵循“视觉先定稿，结构后抽离；演出层先迁，战斗层后迁”的原则。
- 本轮只处理 `UI / HUD / Overlay / 外部流程页`，不迁移房间、敌人、武器、主循环。

## 迁移边界

### 本轮纳入
- Overlay Canvas 绘制层
  - `drawOverlayBackdrop`
  - `getOverlayThemeTones`
  - `drawOverlayPanel`
  - `drawOverlayCard`
  - `drawOverlayButton`
  - `drawPauseScreen`
  - `drawShopUI`
  - `drawChestSelectUI`
  - `drawWeaponBoxUI`
  - `drawLevelUpUI`
  - `drawResultScreen`
- 外部流程页控制器的进一步分层准备
  - 主菜单
  - 设置
  - 故事页
  - 开局武器选择

### 暂不纳入
- `Game` 主循环
- 房间生成/切换
- 武器/敌人/碰撞/掉落
- 移动端触控逻辑
- 迷你地图绘制本体

## 原则
- 保留 `Game` 原调用接口，迁移初期只改内部实现，不改调用方。
- 新模块优先采用“Renderer/Controller 挂到 Game 上”的方式，避免一次性改动调用链。
- 任何迁移都要先抽“稳定层”，不碰仍在高频视觉迭代的区域。
- 若发现并行开发冲突，只回退到薄封装，不强推大拆分。

## Phase A：Overlay Canvas Renderer

### 目标
- 将统一后的 Overlay 绘制逻辑从 `index.html` 抽到 `src/ui/OverlayCanvasRenderer.js`。
- `Game` 中保留同名方法作为薄封装，降低外部调用风险。

### 收益
- 降低 `Game` 类视觉演出职责。
- 为后续暂停/商店/升级/武器箱/结算的独立维护提供边界。
- 让楼层主题与 Overlay 主题的关系集中到一处管理。

### 风险控制
- 不改事件入口，只改绘制实现。
- 所有原方法名继续可用。
- 若局部调用仍依赖 `Game` 上下文，统一通过 `renderer.game` 访问。

## Phase B：Sidebar HUD Presenter

### 目标
- 抽离 `updateSidePanels()` 的数据组织与 DOM 写入逻辑。
- 建立 `SidebarHudPresenter`，负责角色状态、地图头部、装备槽、道具栏、战斗记录更新。

### 前提
- 先等本轮 HUD 视觉关系稳定，不再高频调整 DOM 结构。

## Phase C：Theme Layer

### 目标
- 把 HUD / Overlay / 外部 UI 共用的主题取值规则集中化。
- 避免继续在 `index.html` 中分散写 `getComputedStyle(document.documentElement)` 与重复 fallback。

### 形式
- 可选 `ThemeToneResolver` 或轻量主题工具模块。
- 只处理读取，不负责修改楼层状态。

## Phase D：External Flow Pages

### 目标
- 继续把主菜单、故事页、设置页、开局武器页的控制逻辑从 `Game`/`index.html` 中剥离。
- 与现有 `MenuController`、`ScreenFlowController`、`SettingsController` 保持一致分工。

## 本轮执行顺序
1. 建立 `OverlayCanvasRenderer` 模块。
2. 将 Overlay 绘制方法迁移到该模块。
3. 在 `Game` 构造中接入 renderer。
4. 将 `Game` 原有 Overlay 方法改为薄封装。
5. 更新 REPORT 与 memory。

## 验收标准
- 暂停、商店、宝箱、武器箱、升级、结算仍可正常绘制。
- `Game` 外部调用接口不变。
- 楼层主题颜色仍能正确传递到 Overlay。
- 不影响 `updateSidePanels()`、小地图、主战斗渲染顺序。
