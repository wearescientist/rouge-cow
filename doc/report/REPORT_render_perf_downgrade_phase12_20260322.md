# REPORT_render_perf_downgrade_phase12_20260322

## 目标
- 按“先存档，再分两阶段降级”的方案执行本轮节能版渲染收口。
- 尽量保住主角、Boss、关键交互目标的电影感，同时拆掉最重的全屏后期链和隐藏房大面积动态光源参与。

## 本轮改动

## 2026-03-22 追加修正
- 撤回隐藏房与统一光场的“数量裁剪”策略。
- 恢复隐藏房 1/2/3/4/5/6 层之前已有的环境光入口，改回“全亮但低成本后期”。
- 新增设置项 `gameBrightness`，用于调节实际游戏舞台整体亮度。

### 1. 版本与缓存标记
- `src/config/AppVersion.js` 升到 `v0.35.1 Render Perf Downgrade Phase 1+2`。
- `src/main.js` 同步入口 fallback 版本。
- `src/bootstrap/RuntimeSpriteLoader.js` 远端运行时资源版本升级到 `?v=097`。
- `src/systems/Room.js`
- `src/systems/rooms/Room.js`
  同步壳层/地板资源版本标签到 `v0.35.1_perf_phase12`，避免旧缓存误读。

### 2. 第一阶段：全局后期降级
- `src/render/HD2DRenderer.js`
  - 默认停用 `TiltShiftSystem`。
  - `RoomBlurSystem` 保留低成本暗角/压暗/局部 bloom，关闭全屏 blur 主链。
  - 玩家背光阴影切成固定地面阴影，不再按房间中心方向拉长联动。
- `src/render/systems/RoomBlurSystem.js`
  - 新增 `useFullScreenBlur = false`，直接短路最重的全屏 blur buffer 流程。
  - 统一光源进入后先按强度排序再截断，默认最多保留 8 到 10 个关键光源。
  - 保留 vignette、压暗、少量 color/bloom 叠层，作为低成本氛围替代。
- `src/render/systems/ShadowSystem.js`
  - 新增 `fixedShadow` 分支，直接绘制固定椭圆地影，避免方向计算和拖尾阴影。

### 3. 第二阶段：动态光源收缩为伪光
- `src/systems/Room.js`
- `src/systems/rooms/Room.js`
  - 取消之前新增的优先级裁剪，恢复所有隐藏房光源都能进入低成本光场。
- `src/systems/HiddenRoomSystem.js`
  - 恢复 1/3/4/5 层中心环境补光与既有隐藏房环境光入口。
- `src/render/WeaponVisuals.js`
  - 为 `area/aura` 武器增加小型 `radialGradient` 伪光，不依赖房间光场也能保留关键技能亮区。

### 4. 新增整体亮度设置
- `src/ui/GameSettingsStore.js`
  - 新增 `gameBrightness` 持久化设置，范围 `0.5` 到 `1.5`。
  - 默认亮度 `1.0` 时不再保留 CSS `filter`，避免整舞台常驻合成开销。
- `src/ui/SettingsController.js`
  - 设置面板新增“画面亮度”滑杆，实时写回并立即生效。
- `src/ui/SidebarHudPresenter.js`
  - 停止在 80ms 快速刷新循环里反复触发 sidebar fit，减少纯移动时的布局测量抖动。

## 预期收益
- 普通房与隐藏房应明显减少全屏 blur 带来的 fill-rate 压力。
- 隐藏房动态光源数量从“装饰普遍参与”收缩到“关键节点少量参与”。
- 画面保留暗角、压暗和局部光晕，不会直接掉成纯平白片。

## Shadow Review
- 避免直接禁用全部后期导致画面完全失去层次，保留低成本 vignette/dim/color/bloom。
- 避免隐藏房所有提示光一起消失，对水晶球、封印目标、关键谜题节点保留优先级白名单。
- 避免阴影改造影响其他调用路径，仅在 `fixedShadow` 选项下切到简化模式。

## 待你验收
- 普通房、Boss 房、隐藏房帧率是否明显更稳。
- 主角、Boss、关键交互目标是否仍然足够亮。
- 隐藏房装饰是否已经从真实灯场退成低成本伪光，但观感还能接受。

## 2026-03-23 追加调整：蠕虫降光与分布重做
- `src/systems/Room.js`
- `src/systems/rooms/Room.js`
  - 所有氛围蠕虫、指路蠕虫从房间级 `presentation light sources` 里移出，只保留本体自发光描边与小范围底光。
  - 普通房氛围蠕虫改为每房随机 `3-5` 条，并在可行走区域内随机散布，不再沿固定环形站位生成。
  - 本体 glow 强度下调，压低过亮荧光感，避免“虫子像灯泡”。
- `src/systems/HiddenRoomSystem.js`
  - 隐藏房 floor2 蠕虫脚下荧光池半径和 alpha 下调，保留可见性但避免过曝。

## 本轮判断
- 蠕虫的主要成本不在移动逻辑，而在“本体多层 glow + 额外房间伪光源”叠加。
- 把蠕虫从统一光场剥离后，仍能靠本体 glow 看清位置，但可以明显减少隐藏房外荧光虫群对光照链的压力。

## 2026-03-23 追加调整：可调发光与隐藏房蘑菇伪光化
- `src/systems/DebugPanel.js`
  - 调试边栏新增 3 个实时滑杆：`蠕虫亮度`、`蘑菇亮度`、`蜡烛/提灯亮度`，用于现场找观感甜点。
- `src/systems/Room.js`
  - 蠕虫本体 glow 接入调试倍率。
  - 隐藏房蘑菇相关 light state 统一返回空，普通/记忆/装饰蘑菇不再进入房间级统一光场。
- `src/systems/HiddenRoomSystem.js`
  - 隐藏房蘑菇继续保留 `off / hover / preview / active` 亮暗状态机，但改为贴图提亮 + 柔光 halo + 小地面 glow 的低成本伪光实现。
  - floor2 蠕虫脚底 glow、蜡烛火苗、提灯/遗物 glow 全部接入调试倍率。

## Shadow Review
- 避免把隐藏房蘑菇一刀切成常亮，原有“未完成偏暗，解题后点亮”的反馈逻辑仍保留在绘制层。
- 避免为了提亮蠕虫又把统一动态光照链重新打开，蠕虫依旧只走本体 glow。
- 避免把关键目标完全做平，蜡烛/提灯仍保留局部 warm glow，只是改成可调而非硬编码。

## 2026-03-23 追加调整：外围蘑菇带替代散蘑菇
- `src/systems/HiddenRoomSystem.js`
  - 隐藏房外围原本按几十个小蘑菇对象铺边的做法，改成少量随机样式的横条/竖条“蘑菇带”。
  - 每个隐藏房默认生成上下左右 4 条主蘑菇带，并按随机种子补 0 到 2 条短带，显著减少对象数量与逐个 glow 绘制次数。
  - 蘑菇带使用离屏缓存一次拼贴，多次复用；绘制时只做整条 emission + 整条底图，不再逐朵发光。
  - 蘑菇带状态改为“完成前近暗态，完成后整体点亮”，不再默认常亮。
- `src/systems/DebugPanel.js`
  - 发光滑杆范围扩大到 `20% - 320%`，便于直接观察是否被后处理压住。

## 本轮判断
- 之前“滑杆有 halo 变化但本体不亮”说明真正变化集中在外圈 glow，本体仍受压暗链限制。
- 隐藏房任务完成后仍卡，根因之一是外围墙边/边框蘑菇仍以大量独立对象参与亮态绘制；改成蘑菇带后可把几十个对象压到少量缓存对象。

## 2026-03-23 回撤：暂停隐藏房装饰蘑菇
- `src/systems/HiddenRoomSystem.js`
  - 隐藏房外围装饰蘑菇、伴生装饰蘑菇和蘑菇带方案全部暂停，不再生成、不再绘制。
  - 与这批装饰蘑菇相关的发光表现一并停掉，当前隐藏房只保留谜题本体和必要目标。

## 本轮判断
- 现阶段继续打磨隐藏房装饰蘑菇性价比太低，先彻底撤掉能直接排除一整条渲染噪音。
