# REPORT 隐藏房光源母版收口 2026-03-21

## 目标
- 把 1 层蜡烛的主光开关收回到统一 HD2D 光场链路，避免“火焰一套、主光一套、关掉仍残光”。
- 让 1/3/4 层蘑菇共用同一套光源母版与同一套本体荧光母版。
- 把 5 层封印房改成明确的冷色状态化表现：未完成弱符文，完成后仪式感增强，并同步石像状态。

## 本次改动
- `src/render/systems/RoomBlurSystem.js`
  - 移除 1 层隐藏房在 `collectFocusSources()` 里的模板蘑菇 / 蜡烛特判补光。
  - 隐藏房现在只保留极弱 `player_presence`，谜题光源统一来自 `Room.getPresentationLightSources()`。
- `src/systems/Room.js`
  - 新增统一蘑菇光源母版：`preview_static / preview / active / hover`。
  - 1 层模板蘑菇、3 层顺序蘑菇、4 层记忆蘑菇全部改走同一套光源配置。
  - 1 层蜡烛改回统一 `getHiddenCandleLightState()`，主光只受单独 `candleStates[index]` 控制。
  - 5 层封印点改成冷色弱符文 -> 冷色强化封印；新增 `hidden_seal_room` 作为封印完成后的局部房间冷光。
  - 6 层日记默认不再向房间注入主光，只在已阅读后才点亮。
- `src/systems/HiddenRoomSystem.js`
  - 新增共享蘑菇本体母版，统一 1/3/4 层蘑菇的 sprite glow、halo、floor glow 和稳定度。
  - 1 层模板板直接复用 `preview_static` 蘑菇母版。
  - 3/4 层 active 蘑菇改为稳定常亮，不再用明显脉冲冒充“持续亮”。
  - 蜡烛 lit 状态补一个极小近场暖 halo，仅贴着火焰，不画地面 ring。
  - 5 层封印点 / 泄漏线改为冷色；修复 `seal_blocker` 绘制层的 `sealed` 状态不同步。

## 预期效果
- 1 层：左板蘑菇稳定冷光；右板每根蜡烛都能独立控制主光开关，熄灭后不会再留下主光残影。
- 3 层：preview 亮当前蘑菇，active 比 preview 更亮且稳定；失败后全部清空回到 off。
- 4 层：提示态和点亮态沿用 3 层同母版，只换素材与状态来源，不再单独分叉一套。
- 5 层：未完成封印点只剩弱冷符文；石像归位后封印点、仪式圈、局部房间冷光一起抬升。

## 验证
- `node --check src/systems/HiddenRoomSystem.js`
- `node --check src/systems/Room.js`
- `node --check src/render/systems/RoomBlurSystem.js`

以上 3 项均通过。

## 第二轮根因补记
- 1 层蜡烛和 3 层蘑菇“火焰/本体状态正确，但 HD2D 主光不跟”的根因，不是多一套暗角，而是状态对象分裂。
- `HiddenRoomSystem.getFloorProgress()` 每次都会经过 `normalizePuzzleState()`，返回新的 `puzzleState` 对象。
- `HiddenRoomSystem` 的本体绘制读取的是新的 `progress.puzzleState`，而 `Room.js` 的 `getPresentationLightSources()` 之前读取的是旧的 `room.hiddenPuzzleState`。
- 结果就是：蜡烛火焰、蘑菇本体已经按交互更新，但 HD2D 主光仍然按旧状态发光或不发光。
- 已通过 `Room.getCurrentHiddenPuzzleState()` 改为直接读取运行时权威状态，并在 `getFloorProgress()` / `saveState()` 时同步 `room.hiddenPuzzleState`，把两条状态链重新对齐。

## 未完成验证
- 尝试按技能要求补做 Playwright 页面级校验，但本机当前缺少 `playwright` 依赖，客户端脚本无法启动浏览器链路。
- 因此这次仍是“代码逻辑 + 语法”验证，不是隐藏房实机验收。
- ׷�ӣ�4 �����Ƴ� search �׶γ���Ŀ��Ģ�����Զ� preview�����⵹��ʱ������ֱ�ӱ�¶�𰸡�
