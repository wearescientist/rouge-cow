# Stage 2 Performance Pass

## 本轮内容
- Hidden Room / HD2D focus 光源限流
- HiddenRoom 常用 glow 改为缓存贴图，不再频繁 createRadialGradient
- 粒子系统加每帧预算、负载缩放、命中特效节流、离屏裁剪

## 核心修改文件
- index.html
- src/render/systems/RoomBlurSystem.js
- src/systems/HiddenRoomSystem.js
- src/config/AppVersion.js

## 目的
- 降低隐藏房、HD2D 焦点、粒子爆发场景的帧耗波动
- 保留现有视觉风格，不做激进降质
