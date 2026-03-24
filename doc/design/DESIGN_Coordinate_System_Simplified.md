# 坐标转换逻辑详解 & 960x960 简化方案

## 标准坐标转换公式

```javascript
// 世界坐标 → 屏幕坐标
screenX = (worldX - camera.x) * camera.zoom + canvas.width / 2
screenY = (worldY - camera.y) * camera.zoom + canvas.height / 2
```

### 分步理解

1. **(worldX - camera.x)** - 计算相对于相机中心的世界偏移
   - 如果玩家在相机右边 100px，结果是 +100
   - 如果玩家在相机左边 100px，结果是 -100

2. ** * camera.zoom** - 缩放到屏幕像素
   - zoom = 1: 100世界像素 = 100屏幕像素
   - zoom = 2: 100世界像素 = 200屏幕像素（放大）

3. ** + canvas.width / 2** - 从中心偏移到屏幕坐标
   - 屏幕中心是 canvas.width/2
   - 相对偏移 + 中心偏移 = 最终屏幕位置

---

## 锚点问题详解

### 为什么锚点必须是 center？

**错误做法（脚底锚点）：**
```javascript
// 假设玩家在世界 (1000, 1000)，脚底在 1000
// 贴图高度 48，中心应该在 1000 - 24 = 976
screenY = (1000 - camera.y) * zoom + canvas.height/2  // ❌ 脚底位置
// 然后 drawY = screenY - 48  // 向上偏移贴图高度
// 结果：贴图绘制位置偏移了！
```

**正确做法（center 锚点）：**
```javascript
// 玩家中心在世界 (1000, 976)
screenY = (976 - camera.y) * zoom + canvas.height/2  // ✅ 中心位置
// 然后 drawY = screenY - 24  // 向上偏移一半高度
// 结果：贴图完美对齐！
```

### 关键区别

| 锚点类型 | worldY 含义 | drawY 计算 | 适用场景 |
|---------|------------|-----------|---------|
| feet | 脚底位置 | y - height | 阴影、地面特效 |
| center | 中心位置 | y - height/2 | 渲染、碰撞箱、边缘光 |

**铁律：除了阴影和地面特效，全部用 center！**

---

## 960x960 简化方案

### 假设条件
- 房间大小：960x960
- 画布大小：960x960（全屏房间）
- 相机固定在房间中心：(480, 480)
- 缩放固定为 1（不缩放）

### 简化后的转换
```javascript
// 标准公式
screenX = (worldX - 480) * 1 + 960 / 2
        = worldX - 480 + 480
        = worldX  // 😮 结果就是 worldX！

screenY = (worldY - 480) * 1 + 960 / 2
        = worldY - 480 + 480
        = worldY  // 😮 结果就是 worldY！
```

### 简化方案代码
```javascript
class SimpleCoordinateSystem {
    constructor(roomWidth, roomHeight) {
        // 相机固定在房间中心
        this.cameraX = roomWidth / 2;
        this.cameraY = roomHeight / 2;
        this.offsetX = roomWidth / 2;
        this.offsetY = roomHeight / 2;
    }
    
    // 世界 → 屏幕（超简单！）
    worldToScreen(worldX, worldY) {
        return {
            x: worldX - this.cameraX + this.offsetX,
            y: worldY - this.cameraY + this.offsetY
        };
        // 如果 room = canvas = 960x960，结果就是 {x: worldX, y: worldY}
    }
    
    // 屏幕 → 世界（用于鼠标点击）
    screenToWorld(screenX, screenY) {
        return {
            x: screenX + this.cameraX - this.offsetX,
            y: screenY + this.cameraY - this.offsetY
        };
    }
}

// 使用
const coord = new SimpleCoordinateSystem(960, 960);
const screenPos = coord.worldToScreen(player.x, player.y);
// screenPos.x === player.x (如果画布也是960x960)
```

### 为什么可以这么简化？

当 `roomSize === canvasSize` 且 `camera` 固定在中心时：
- 世界坐标原点在房间左上角
- 屏幕坐标原点也在画布左上角
- 相机偏移抵消了中心偏移
- 结果就是：**世界坐标 = 屏幕坐标**

### 简化后的渲染代码
```javascript
// 之前（复杂）
const screenPos = camera.worldToScreen(player.x, player.y);
ctx.drawImage(sprite, screenPos.x - 24, screenPos.y - 48);

// 简化后（直接绘制！）
ctx.drawImage(sprite, player.x - 24, player.y - 48);
// 前提是：房间=画布=960x960，相机固定在中心
```

---

## 当前项目的情况

我们的项目：
- 房间大小：960x960 ✅
- 画布大小：约 900x600（浏览器窗口）❌
- 相机跟随玩家移动 ❌
- 缩放：1.0 ✅

所以不能直接用简化方案，但理解这个逻辑有助于 debug。

**核心记住：**
1. 世界坐标原点在房间左上角
2. 屏幕坐标原点在画布左上角  
3. 相机位置是视野中心的世界坐标
4. 转换就是：相对偏移 + 中心偏移
