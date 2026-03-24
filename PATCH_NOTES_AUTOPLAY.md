# AutoPlay + Auto Benchmark Pass

## 新增
- DEV 模式下新增 `AutoPlayHarness`
- F9 测试面板新增 `AI 自动游玩 / 自动压测` 区块
- 支持：
  - AI辅助开关
  - 当前房压测
  - Boss 房压测
  - 隐藏房压测
  - 三场景套跑
  - 导出最近 AI 报告

## 性能分析器增强
- `PerformanceProfiler` 新增完整快照导出能力
- Benchmark 报告会附带：
  - summary
  - samples
  - floor / roomType / mode

## 自动游玩逻辑
- 有敌人时：自动接近 / 保持距离 / 绕圈 / 近身危险时 dash
- 房间清空后：自动捡经验 / 金币 / 心 / 道具，并寻找开门房间
- 处理 UI：自动过对话、自动选升级、自动开箱

## 说明
- 隐藏房解谜本身暂未自动求解；隐藏房压测主要用于测该场景渲染与房间负载
- 基于上一版工程，不包含 stage3 的 blur/glow 视觉缓存改动
