# REPORT_Layer1_Backdrop_Depth_2026-03-11

## 目标
- 去掉 floor1 可玩区外圈的“墙圈感”
- 将背景拆为后腔远景、中景咬边、镜头近景三层
- 为后续镜头错落移动预留轻微视差挂点

## 本次实现
- `src/systems/Room.js`：关闭旧的 fullscene trial 背景短路，改为程序化远景后腔
- `src/systems/Room.js`：新增不规则像素边缘生成，使用分层 band polygon 覆盖矩形边界
- `src/systems/Room.js`：floor1 地板绘制后追加中景咬边，专门消除地板/墙交界直线感
- `src/styles/floor-scene-shell.css`：启用 floor1 前景壳层，改为不规则 clip-path，并接入轻微视差位移

## 影响范围
- 当前只作用于 floor1
- 房间碰撞和可玩地板矩形未改，仍保持稳定
- 其他楼层渲染路径未改

## 风险与后续
- 近景壳层目前是屏幕前景型遮挡，已接入轻微位移，但还不是完整镜头系统
- 若后续要做更强的分层镜头，建议把 far/mid/near 参数抽成楼层配置
