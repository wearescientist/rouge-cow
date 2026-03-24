# REPORT_DebugPanel_RoomJump_2026-03-09

## 本次修正

- 修复调试面板“下一层”未走正式 `goToNextFloor()` 流程的问题
- 新增“跳转商店”“跳转 Boss”两个调试按钮
- 新增 `debugFindRoomByType()` 与 `debugTeleportToRoom()`，统一调试传送逻辑

## 影响范围

- 调试面板按钮行为
- 游戏内调试传送逻辑
- 当前层 HUD / 主题刷新

## 规避的问题

- 避免只改 `currentFloor` 数值但未同步地图、房间、玩家位置
- 避免后续继续为不同调试跳转复制散乱逻辑
