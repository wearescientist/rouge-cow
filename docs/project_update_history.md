# 牛牛 v0.36 隐藏房 / 光效更新历史

## 当前主线
- 主线版本：v0.36
- 当前整合包基底：`牛牛_v0.36_hiddenrooms_merged_candidate_20260319_refreshed.zip`
- 当前整理版输出：`牛牛_v0.36_hiddenrooms_lightfield_unified_20260319.zip`

## 已确认的今日包链路
1. `hiddenrooms_hotfix_20260318`：结构较干净，但内容不全。
2. `correctbase_layeronly_fix_20260318`：修层级基底。
3. `correctbase_mergefix_20260318`：合并蠕虫发光 / Room 修正。
4. `hotfix2_layerfix`：后续主修基底之一。
5. `floors1to6_impl / artpass_fullupdate / fixpass2 / fixpass2_hotfix_runtime`：内容较多，但包含互相覆盖和历史残留。
6. `merged_candidate_20260319_refreshed`：上一轮可运行整合候选包。
7. `lightfield_unified_20260319`：本轮统一光场、隐藏房美术与文档整理版。

## 本轮改动摘要（2026-03-19）

### 1. 统一光场系统
文件：`src/render/systems/RoomBlurSystem.js`
- 将原本“以玩家为中心的单焦点模糊”升级为“多光源驱动的统一光场”。
- 玩家、商人、宝箱、房间环境灯、隐藏房节点统一进入同一光场。
- 清晰区 / 模糊区 / 环境压暗 / bloom 统一由同一批 light sources 驱动。
- 旧的 `index.html` 里商人 / 宝箱 / 环境光展示函数改为薄壳，不再各自重复渲染一遍。

### 2. 蠕虫光效加强
文件：`src/systems/Room.js`、`src/systems/rooms/Room.js`
- 蠕虫本体 glow 加强。
- 环境光锚点从 3 点提升到 5 点，避免只剩头亮、身体发光不连贯。
- 隐藏房节点光源、静态房间 glow 也接入房间级 presentation lights。

### 3. 隐藏房可交互提示改法
文件：`src/systems/HiddenRoomSystem.js`
- 去掉原先空实现的交互圈逻辑。
- 改为目标本体背后柔光 + 微粒子提示，不再使用地面圆圈式 UI 标记。

### 4. 开关状态表现方向调整
文件：`src/systems/HiddenRoomSystem.js`
- 蜡烛 / 蘑菇 / 记忆蘑菇 / 遗物的“开/关/提示”表现从透明度优先改为：
  - 本体保持可见
  - 关闭时主要靠 tint / 压暗
  - 激活时靠 glow / reveal / pulse

### 5. 1-6 层隐藏房画面整理
文件：`src/systems/HiddenRoomSystem.js`
- 为 1~6 层加入基础场景装饰与边缘氛围物件。
- 1 层模板板与蜡烛阵改为更有舞台感的双装置布局。
- 1 层模板板改为整体石板/祭台感表现，不再只是两个死板表格。

### 6. 商店光源分层修正
文件：`index.html`
- 商人蜡烛/光晕从“前后都画一遍”改为“背后大光晕 + 前景小火焰”。
- 解决商店圆形光源压在商人前面的视觉问题。

### 7. 宝箱背光补齐
文件：`src/systems/Room.js`、`src/systems/rooms/Room.js`
- 为宝箱房的每个宝箱补了前置背光，按品质区分半径与颜色。
- 让宝箱光源落在宝箱后面，不再只依赖统一光场后处理。

### 8. 商人火焰与 halo 回退
文件：`index.html`、`src/render/systems/RoomBlurSystem.js`
- 从旧备份恢复商人蜡烛的紫焰、桌面光池和 presentation halo。
- 抬高商人/宝箱统一光源强度，避免场景看起来“像没开灯”。

### 9. 宝箱并入统一光源链
文件：`src/systems/Room.js`、`src/systems/rooms/Room.js`、`src/render/systems/RoomBlurSystem.js`
- 将宝箱光源从单独 collector 并回房间统一 light source 列表。
- 关闭重复的宝箱专用 collector，避免光源链分裂导致亮度偏弱。

### 10. 统一 halo 叠层收口
文件：`src/render/systems/RoomBlurSystem.js`、`index.html`
- 将商人/宝箱的可见 halo 叠层收回 `RoomBlurSystem`，不再在 `index.html` 里单独做 presentation 光效。
- 保留 `index.html` 的角色绘制，仅去掉重复的光源渲染路径，降低后续维护和性能开销。

### 11. 光场单路径修正
文件：`src/render/systems/RoomBlurSystem.js`、`src/systems/Room.js`、`src/systems/rooms/Room.js`
- 移除 `RoomBlurSystem` 中会把所有非玩家光源统一二次糊化的 presentation 画布。
- 将大 halo 合并进 bloom 计算，继续保持单一光源渲染路径。
- 蠕虫改为本体优先清晰、环境微光从属，默认不再叠额外 bloom。

### 12. HD2D 压暗前置
文件：`src/render/HD2DRenderer.js`、`src/render/systems/RoomBlurSystem.js`
- 将基础压暗前置到统一光场之前，避免后处理只围绕玩家中心压黑。
- 回退商人紫焰统一 source 的亮度与半径，保留暗黑地牢的整体氛围。

### 13. 玩家跟随 fallback 恢复
文件：`src/render/HD2DRenderer.js`
- 恢复未启用房间光场时的玩家 vignette 跟随逻辑，避免光斑固定在场景中心。
- fallback 改为统一使用归一化焦点坐标，降低空值输入造成的静态光源风险。

### 14. HD2D 暗角焦点修正
文件：`src/render/HD2DRenderer.js`
- 将启用统一光场时的基础暗角从房间中心改为当前焦点，避免固定中心亮斑误导玩家。
- 统一光源仍由 `RoomBlurSystem` 管，HD2D 只负责压暗顺序与兜底显示。

### 15. 取消 HD2D 二次压暗
文件：`src/render/HD2DRenderer.js`
- 在启用统一光场时移除额外的 HD2D 暗角叠层，避免再次压灭商人、宝箱、蠕虫等非玩家光源。
- 后续只保留 `RoomBlurSystem` 的单一路径负责黑场、挖光、bloom 与 halo。

### 16. 暗角参数迁入统一系统
文件：`src/render/systems/RoomBlurSystem.js`、`src/render/HD2DRenderer.js`
- 将旧 HD2D 的暗角渐变参数迁入 `RoomBlurSystem` 的统一暗场。
- 删除 `HD2DRenderer` 侧的独立暗角函数，避免出现双重压暗或参数漂移。

### 17. 三类光源参数收口
文件：`src/render/systems/RoomBlurSystem.js`、`src/systems/Room.js`、`src/systems/rooms/Room.js`
- 商人统一光源回到暗紫蜡烛色，并微调强度避免过白。
- 宝箱房三宝箱改为三角阵型，并按稀有度区分光色。
- 蠕虫环境光权重下调，回到只靠自身微弱荧光可见。

### 18. 商店旧环境光移除与蠕虫自发光隔离
文件：`src/render/systems/RoomBlurSystem.js`、`src/systems/Room.js`、`src/systems/rooms/Room.js`
- 删除商店房旧的蓝色中心环境 glow，避免覆盖商人蜡烛色。
- 为蠕虫增加 `selfVisibleOnly`，使其完全退出统一光场的挖黑场与 bloom 路径，只保留自身发光。

### 19. 彩色光层与蠕虫主体收口
文件：`src/render/systems/RoomBlurSystem.js`、`src/systems/Room.js`、`src/systems/rooms/Room.js`
- 为统一光场增加独立 color layer，修正商人与宝箱颜色被白色挖光冲淡的问题。
- 蠕虫本体去掉荧光边，只保留主体像素，避免继续呈现“小灯泡”观感。

### 20. 宝箱运行时覆盖与蠕虫模糊残影修正
文件：`src/systems/rooms/RoomLifecycle.js`、`src/render/systems/RoomBlurSystem.js`
- 修复 `RoomLifecycle.js` 对宝箱房生成逻辑的旧覆盖，使三角阵型布局真正进入运行时。
- 为 `selfVisibleOnly` 光源补上 blur punch-out 清理，避免蠕虫继续在模糊层里留下发散外圈。

### 21. 彩色光优先级修正
文件：`src/render/systems/RoomBlurSystem.js`、`src/systems/Room.js`、`src/systems/rooms/Room.js`
- 为商人与宝箱增加 `preferColor`，降低白色 reveal 对彩色光的冲洗。
- 移除 `selfVisibleOnly` 的白色 blur punch-out，避免蠕虫继续出现白圈。

### 22. 蠕虫主体与环境光完全解耦
文件：`index.html`、`src/systems/Room.js`、`src/systems/rooms/Room.js`
- 将蠕虫从 `getPresentationLightSources()` 完全移除，不再作为环境光源参与统一光场。
- 将蠕虫本体改到后处理之后再绘制，避免再次被房间模糊和压暗系统糊开。

### 23. 商人与宝箱旧补光层清理
文件：`index.html`、`src/systems/Room.js`、`src/systems/rooms/Room.js`
- 删除商人场景级 back halo，避免与统一光场重复叠加。
- 删除宝箱房房间绘制内的旧 `screen` 地面 glow，避免白光洗色和二次发糊。

### 24. 统一光场保锐参数
文件：`src/render/systems/RoomBlurSystem.js`、`src/systems/Room.js`、`src/systems/rooms/Room.js`
- 为统一光源增加 `preserveSharpness`，专门减轻商人与宝箱在压暗中的发糊问题。
- 蠕虫本体继续降线宽、降 alpha、降核心点，只保留微弱主体观感。

### 25. 蠕虫主体与普通宝箱再平衡
文件：`src/render/systems/RoomBlurSystem.js`、`src/systems/Room.js`、`src/systems/rooms/Room.js`
- 蠕虫本体加粗并提亮，修复“太细太暗”的观感。
- 普通宝箱统一光改为冷白，同时压低白色 reveal，避免贴图被照虚。

### 26. 蠕虫绘制层级回收
文件：`index.html`
- 蠕虫从 overlay UI 层回到主场景实体层，避免再次压到玩家上层。
- 删除失效的 overlay 蠕虫辅助入口，避免双路径维护。

### 27. 蠕虫恢复自发荧光
文件：`src/systems/Room.js`、`src/systems/rooms/Room.js`
- 蠕虫恢复 5 点发光骨架与更清晰的主体发光线。
- 蠕虫只保留自发荧光，不重新并回环境光源链。

### 28. 蠕虫后处理保护遮罩
文件：`src/render/systems/RoomBlurSystem.js`、`src/systems/Room.js`、`src/systems/rooms/Room.js`
- `RoomBlurSystem` 增加蠕虫 presentation mask，避免蠕虫被整屏模糊和压暗吃掉。
- `Room.drawPresentationCritters()` 增加 `mask` 模式，统一服务显示层与后处理保护层。

## 本轮重点文件
- `src/render/systems/RoomBlurSystem.js`：统一光场主控文件。
- `src/systems/Room.js`：房间级光源采集、蠕虫 glow / hidden room lights。
- `src/systems/rooms/Room.js`：与上文件同步。
- `src/systems/HiddenRoomSystem.js`：隐藏房视觉、节点、交互高亮、装饰。
- `index.html`：旧的重复展示型光效入口降级。

## 已知原则
- 后续光效改动，优先改 `RoomBlurSystem.js`，不要再在 `index.html` 单独补一套。
- 后续隐藏房节点发光，优先走房间 light source，不要再靠 alpha 表示开关。
- 后续如要继续精修，优先顺序：
  1. 1 层美术再细化
  2. 4 / 5 / 6 层叙事感布景继续拉高
  3. 清理 `HiddenRoomSystem.js` 历史重复定义

## 说明
- 此文档记录的是当前能从包和代码中确认的更新历史。
- 更早且未沉淀进当前包的临时口头修改，不保证完整恢复。
