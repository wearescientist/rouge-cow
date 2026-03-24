# Phased Optimization Plan

## Phase 1 - Runtime 收口
- 移除未接主链脚本加载
- 锁定当前 runtime 基线
- 建立审计脚本与模块盘点文档

## Phase 2 - Hidden Room 拆分
- 将 profile / 题库数据从 `HiddenRoomSystem.js` 外置
- 保留系统逻辑不变，先把配置和逻辑边界拉开

## Phase 3 - Render Budget
- 增加 `RenderBudgetManager`
- 统一给 blur / particles / blood 提供压力分档
- 高压场景下降低无关发光和低价值 draw

## Phase 4 - Audio 收口
- 增加 `AudioRuntimeBridge`
- 隐藏房 / 对话 typing / inline 对话统一走共享 AudioContext

## Phase 5 - 后续建议
- 继续拆 `HiddenRoomSystem.js`
- 继续收口 `Room.js` 与 `systems/rooms/*`
- 将 `index.html` inline runtime 逐步搬到 bootstrap / runtime 脚本
