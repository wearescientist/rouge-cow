# PLAN_Index_Decomposition_Roadmap_v0.33

## 1. 背景与结论

当前项目已经完成了部分模块迁移，但 [index.html](E:\AI\game\rougelike-cow\index.html) 仍然承担过多职责。  
截至 2026-03-08，`index.html` 约 12367 行，仍混合了以下内容：

- HTML 结构
- 全局 CSS
- 主菜单与弹窗 UI 控制
- 输入绑定
- 加载流程
- 大量 `Game` 内部流程控制
- UI/HUD 更新
- 存档与本地设置
- 一部分渲染/特效/工具类

结论不是“立刻一次性彻底迁移”，而是：

1. **必须继续迁移**
2. **不能做一次性大爆破**
3. **迁移目标应从“搬类”升级为“切职责边界”**

也就是说，目标不是简单把代码从 `index.html` 复制到 `src/`，而是让 `index.html` 最终只保留：

- 页面骨架
- 样式入口
- 脚本加载
- 启动入口

---

## 2. 当前架构判断

### 2.1 已经迁出的部分

`src/` 目录已经具备一定模块基础，尤其是：

- `src/render/*` 与 `src/render/systems/*`
- `src/systems/AudioSystem.js`
- `src/systems/AudioController.js`
- `src/systems/SoundEffectSystem.js`
- `src/systems/CollisionSystem.js`
- `src/systems/Room.js`
- `src/systems/weapons/Weapon.js`
- `src/systems/enemies/Enemy.js`
- `src/systems/items/ItemManager.js`
- `src/utils/SpriteData.js`

这说明项目已经不是“纯大文件”，而是进入了一个更危险的阶段：

- **外部模块存在**
- **但最终调度中心仍然在 `index.html` 的 `Game` 中**
- **很多逻辑是“外部模块 + 内联 glue code”混合运行**

### 2.2 真正的问题不在“类还没搬完”

当前核心问题不是“还有几个类没迁”，而是下面这三个：

1. **入口职责失控**  
   `index.html` 仍然在直接处理 DOM、状态切换、输入事件、存档、加载、菜单动画、HUD 更新。

2. **Game 类持续吞并边界**  
   即使一部分系统迁到 `src/`，`Game` 仍然通过大量 `document.getElementById()`、`localStorage`、`addEventListener()` 和 UI 刷新代码把外部模块重新绑死在入口文件里。

3. **迁移单位选错了**  
   过去偏向“按类迁移”，但很多真正应该先迁出的并不是战斗类，而是：
   - 菜单控制器
   - 设置控制器
   - HUD 同步器
   - 输入绑定器
   - 加载/启动编排器

---

## 3. 迁移原则

### 3.1 迁移原则

1. **先拆边界，再拆核心**
2. **先迁编排层，再迁算法层**
3. **先让 `index.html` 变薄，再让 `Game` 变小**
4. **不允许新增核心逻辑回流到 `index.html`**

### 3.2 反目标

以下做法不建议直接执行：

1. 直接对 `Game` 做大规模切块重写
2. 一次性把 `Weapon/Enemy/Room/Game` 全部改成 ES Module
3. 先做 CSS 全分离再做逻辑迁移
4. 在没有统一启动层之前继续随手往 `index.html` 追加 UI 逻辑

原因很简单：

- 这些做法会把风险集中到初始化顺序和全局依赖
- 当前项目依然大量依赖 `window`、DOM id、脚本加载顺序
- 一次性重排容易造成“看似模块化，实则全面回归调试地狱”

---

## 4. 新迁移路线图

### Phase A: 入口瘦身，不碰战斗核心

目标：把 `index.html` 从“总控中心”降级为“页面壳层 + 启动入口”。

优先迁移：

1. **MenuController**
   - 主菜单显示/隐藏
   - 继续游戏按钮状态
   - 菜单背景与装饰动画
   - 标题/按钮交互

2. **SettingsController**
   - 设置弹窗打开关闭
   - 音量滑杆同步
   - 本地设置读写

3. **Boot/LoadingController**
   - 加载条
   - loading 文案
   - 首屏切换

4. **ScreenFlowController**
   - 主菜单
   - 开场剧情
   - 武器选择
   - 进入主游戏

交付标准：

- `index.html` 不再直接写这几个控制器的实现
- `Game` 只调用控制器，不再直接展开 DOM 操作细节

### Phase B: 把 DOM/UI 与 Game 主循环脱钩

目标：让 `Game` 不再直接操作大批 DOM。

优先迁移：

1. **HUDRenderer / HUDSync**
   - 侧栏数值
   - 顶部条
   - 经验条
   - 当前层/波次显示

2. **DebugPanelController**
   - 调试按钮
   - 调试下拉框
   - 调试状态展示

3. **MobileControlsController**
   - 摇杆
   - Dash / Interact / Pause
   - 移动端启停判断

交付标准：

- `Game.update()` 和 `Game.drawUI()` 不再充满 `getElementById`
- UI 刷新转成“状态输入 -> 控制器更新”

### Phase C: 再处理残余系统类

目标：把仍内联但相对独立的系统迁出。

推荐顺序：

1. `ParticleSystem`
2. `DamageNumberSystem`
3. `BloodStainSystem`
4. `SpriteLoader`
5. `SurvivorCamera`
6. `PerformanceMonitor`

原因：

- 这些类依赖相对收敛
- 迁出后对 `index.html` 的瘦身效果明显
- 风险比直接拆 `Game` 小

### Phase D: 最后处理 Game 内核

目标：把 `Game` 从“上帝对象”拆成主循环编排器。

这一阶段才适合做：

1. `InputBinder`
2. `SaveCoordinator`
3. `SceneStateMachine`
4. `GameLoopController`
5. `RuntimeFacade`

最终形态：

- `Game` 保留主循环和高层编排
- 输入、场景流转、存档、UI、加载、菜单全部外包
- `Game` 不再直接持有几十个 DOM 引用

---

## 5. 执行优先级建议

### 推荐近期顺序

#### Round 1

- 提取 `MenuController`
- 提取 `SettingsController`
- 提取 `updateContinueButtonState` 相关逻辑

原因：

- 风险低
- 与最近菜单改动连续
- 能立刻减少 `Game` 中的 DOM 操作

#### Round 2

- 提取 `Boot/LoadingController`
- 提取 `ScreenFlowController`

原因：

- 能切开“首屏 -> 菜单 -> 剧情 -> 选武器 -> 开始游戏”的流程耦合

#### Round 3

- 提取 `HUDSync`
- 提取 `MobileControlsController`

原因：

- 这是 `Game` 内 `getElementById()` 最密集的区域之一

#### Round 4+

- 迁移剩余独立系统
- 最后才重构 `Game`

---

## 6. 迁移完成判定标准

只有满足以下条件，才算这轮迁移是成功的：

1. `index.html` 不再新增业务逻辑
2. 菜单/设置/加载/UI 的 DOM 控制代码被独立文件接管
3. `Game` 内直接操作 DOM 的数量显著下降
4. `Game` 不再直接负责每个界面状态的切换细节
5. 迁移后功能可运行，且不引入初始化顺序错误

---

## 7. 最终建议

这次不建议启动“彻底迁移全部核心系统”的大工程。  
更合适的路径是：

1. 先把入口编排层抽出来
2. 再把 DOM/UI 层和主循环剥离
3. 最后再决定是否继续深拆 `Game`

换句话说：

- **是，应该继续迁移**
- **但不是现在就全面总攻**
- **下一阶段最值得做的是“入口去业务化”**

这是目前风险最低、收益最高、也最符合项目现状的迁移方向。~Meow
