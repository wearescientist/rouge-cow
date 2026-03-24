# REPORT_RoomBlur_Perf_2026-03-09

## 本次调整

- 将 `RoomBlurSystem` 从“双 blur 三层回贴”改成“半分辨率单 blur + 渐变叠加”
- 保留 `clearCanvas`，确保商店紫域清晰回填链路不受影响
- 新增 `blurScale = 0.5`，把模糊缓冲降到半分辨率
- 用 `overlayCanvas` 承载模糊叠层，通过径向渐变 alpha 控制清晰区到模糊区的过渡

## 目的

- 降低移轴模糊的固定每帧成本
- 维持玩家焦点跟随和电影化景深语义
- 给后续商店表现层和光照表现留出性能余量

## 风险控制

- 没有修改 `HD2DRenderer` 对 `RoomBlurSystem` 的调用接口
- 没有修改 `clearCanvas` 的对外语义
- 没有碰 `TiltShiftSystem`、商店紫域逻辑和主角绘制链
