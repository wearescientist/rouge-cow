# 游戏运行时布局真值校准报告

## 结论摘要

- 当前主游戏并不是“16:9 画布里展示一个正方形房间”。
- 实际运行时主画布是 `#centerGame` 内的正方形 `#gameCanvas`。
- 相机默认 `showFullRoom = true`，因此整个 `2000 x 2000` 房间会被完整等比缩放进这个正方形 canvas。
- 玩家默认出生在房间中心，镜头也固定围绕房间中心，因此“玩家在画面中央”是运行时事实，不是设计参考。
- 外部壳层不是房间内部世界坐标的一部分，而是 `#centerGame` 周围额外的 DOM / shell 视觉层。

## 运行时链路

### 1. 房间世界尺寸

来自 `src/systems/MapGenerator.js`:

- `ROOM_WIDTH = 2000`
- `ROOM_HEIGHT = 2000`
- `WALL_THICKNESS = 120`
- 地板有效区域:
  - `floorLeft = 120`
  - `floorTop = 120`
  - `floorRight = 1880`
  - `floorBottom = 1880`

所以房间内真正的地板区是:

- `1760 x 1760`

### 2. 主画布不是 16:9

来自 `index.html` 中 `SurvivorCamera.updateViewport()`:

- `centerGame` 取可用区域的较小边
- `canvasW = canvasH = maxSize`
- 最终 `#gameCanvas` 总是正方形
- 默认最大值是 `960`

所以运行时主游戏区不是固定 `1920 x 1080`，而是:

- 一个自适应的正方形 canvas
- 常见目标尺寸是 `960 x 960`

### 3. 相机默认完整显示全房间

来自 `index.html` 中 `SurvivorCamera`:

- `showFullRoom = true`
- `viewWidth = roomW`
- `viewHeight = roomH`
- `x = roomW / 2`
- `y = roomH / 2`

并且 `worldToScreen()` 在 `showFullRoom` 下使用:

- `scale = min(canvasW / roomW, canvasH / roomH)`
- `offsetX = (canvasW - roomW * scale) / 2`
- `offsetY = (canvasH - roomH * scale) / 2`

由于 canvas 本身是正方形，房间也是正方形，所以通常:

- `scale = canvasSize / 2000`
- `offsetX = 0`
- `offsetY = 0`

即:

- 整个房间完整铺满正方形主画布

### 4. 玩家站位真值

来自 `index.html` / `Room.js`:

- 进入房间时玩家默认在 `room.centerX / room.centerY`
- 即 `(1000, 1000)`
- 房间切换后按门方向重新落位，但仍然基于房间内部有效区

因此场景设计参考人物应该放在:

- 房间中心
- 正方形主画布中心

### 5. 门的视觉尺寸和可玩尺寸不是一回事

视觉绘制来自 `Room.js / RoomRendering.js`:

- 门贴图绘制尺寸: `180 x 180`
- 因为要覆盖 `120` 厚墙，所以向外延伸 `30`

但玩家可通行逻辑来自 `MapGenerator.js`:

- `DOOR_WIDTH_HALF = 40`
- `DOOR_HEIGHT_HALF = 30`

这说明:

- 门的“视觉贴图区域”比“可通行门洞区域”更大
- 工作台必须把这两层分开显示

### 6. 可玩区域真值

玩家活动范围不是整个 `2000 x 2000` 房间，也不是整个门贴图。

真实可玩区是:

- 常态: 地板区 `120..1880`
- 开门时: 地板区 + 四侧狭窄门洞逻辑区

所以工作台至少需要 3 套边界:

- 房间外框 `2000 x 2000`
- 地板有效区 `1760 x 1760`
- 门通行逻辑区

### 7. 外壳层与房间层是两套系统

来自 `index.html` 的结构和 `Room.js` 的 Layer1 壳层绘制:

- 房间内部资源基于世界坐标，再通过相机投影到 canvas
- 屏幕周围还有 `scene-shell` 等前后景 DOM 包装层
- 第一层还有额外 envelope / 壳层绘制，它依赖 `roomRect / floorRect` 的屏幕投影结果再做包裹

因此不能把“外部壳体”简单视为房间里的另一张贴图。

更准确的分法应是:

- 房间世界层
- 依附房间投影结果的屏幕壳层
- `centerGame` 外围 DOM 壳层

## 对工作台的直接修正结论

当前场景美术工作台后续必须改成:

1. 以正方形主画布为核心，而不是 16:9 画布
2. 房间 `2000 x 2000` 完整映射到正方形画布
3. 单独显示:
   - 房间边界
   - 地板有效区
   - 门逻辑区
   - 门视觉区
4. 玩家参考默认放在房间中心 `(1000, 1000)`
5. 外壳层拆成:
   - 房间内世界层
   - 屏幕投影壳层
   - 额外舞台 DOM 壳层

## 下一步建议

- 下一轮先改 `scene_art_workbench` 的画布模型，切换为“正方形运行时主画布”
- 再补“门逻辑区 / 门贴图区 / 地板有效区”三层独立开关
- 最后再处理壳层分类，否则还会继续混
