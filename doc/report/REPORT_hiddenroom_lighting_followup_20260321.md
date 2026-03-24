# REPORT 隐藏房发光补充收口 2026-03-21

## 目标
- 在不破坏现有统一光场链路的前提下，补完确认稿里剩余的 5 个点。
- 保持 HiddenRoomSystem 本体发光与 Room.js 房间主光同步，不回退到旧的直绘 glow 分支。

## 本次改动
- `src/systems/HiddenRoomSystem.js`
  - 新增 2/3/4/5 层装饰蘑菇节点。
  - 3/4 层完成后，谜题蘑菇与装饰蘑菇统一进入 `active` 常亮。
  - 5 层按封印点局部提亮，三处全封印后全场装饰蘑菇常亮。
  - 水晶球完成态改为蓝紫常亮。
  - `legacy_bag` 奖励从 `80` 调整为 `1000`，并同步底部文案。
  - `showBottomCaption()` 统一降速，并为短文案补足至少 4 秒节奏。
- `src/systems/Room.js`
  - 装饰蘑菇节点接入 `getPresentationLightSources()`。
  - 3/4 层完成态的蘑菇主光改为持续常亮。
  - 水晶球主光改为完成后持续蓝紫常亮，而不是只在 pulse / flash 期间亮。

## 验证
- `node --check src/systems/HiddenRoomSystem.js`
- `node --check src/systems/Room.js`

## 风险控制
- 没有新增第二套隐藏房灯光入口，仍然由 `Room.getPresentationLightSources()` 统一出光。
- 没有回退到旧的场景直绘光团，避免再次出现“本体亮了、HD2D 主光没跟上”或“双重叠光”的问题。
- 这次只做代码和语法校验；未做 Playwright 实机验证，因为当前环境仍缺少 `playwright` 依赖。
