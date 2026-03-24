# 统一坐标系统设计方案 v1.0

## 问题诊断

当前系统的坐标混乱根源：
1. **4种坐标系混用**：世界、屏幕、本地、画布
2. **3种锚点混用**：脚底、中心、左上角  
3. **2套转换逻辑**：SpriteData.worldToScreen 和 Camera.worldToScreen
4. **0个强制规范**：每个开发者各自实现转换

---

## 核心原则：WYSIWYG (所见即所得)

**唯一真理：屏幕坐标**
- 所有渲染函数的入参必须是屏幕坐标
- 转换在调用点之前完成，不在渲染函数内转换
- 谁调用谁负责转换

---

## 坐标系定义

### 1. 世界坐标 (World Space)
- **原点**：房间左上角 (0,0)
- **单位**：像素
- **锚点**：脚底中心 (x, y)
- **用途**：游戏逻辑、碰撞检测、AI

### 2. 屏幕坐标 (Screen Space)  
- **原点**：Canvas 左上角 (0,0)
- **单位**：像素
- **锚点**：左上角 (x, y)
- **用途**：唯一渲染坐标系

### 3. 本地坐标 (Local Space)
- **原点**：贴图左上角 (0,0)
- **单位**：像素
- **用途**：贴图内部定位（如武器挂载点）

---

## 转换中心：CoordinateTransformer

```javascript
class CoordinateTransformer {
    constructor(camera) {
        this.camera = camera;
    }

    // 世界 → 屏幕（最常用）
    worldToScreen(worldX, worldY) {
        return {
            x: (worldX - this.camera.x) * this.camera.zoom + this.canvas.width / 2,
            y: (worldY - this.camera.y) * this.camera.zoom + this.canvas.height / 2
        };
    }

    // 世界尺寸 → 屏幕尺寸
    sizeWorldToScreen(worldSize) {
        return worldSize * this.camera.zoom;
    }

    // 带锚点的世界坐标 → 屏幕坐标
    entityWorldToScreen(entity, anchor = 'feet') {
        const screen = this.worldToScreen(entity.x, entity.y);
        
        if (entity.spriteData && anchor === 'center') {
            const center = entity.spriteData.getCenterPosition(entity.x, entity.y, 1, 'feet');
            const centerScreen = this.worldToScreen(center.x, center.y);
            return centerScreen;
        }
        
        return screen;
    }
}
```

---

## 渲染规范

### 规范 1：渲染函数只认屏幕坐标
```javascript
// ✅ 正确
renderPlayer(screenX, screenY) {
    ctx.drawImage(sprite, screenX - w/2, screenY - h, w, h);
}

// ❌ 错误
renderPlayer(worldX, worldY) {
    const screen = camera.worldToScreen(worldX, worldY); // 不要在内部转换
    ctx.drawImage(sprite, screen.x, screen.y);
}
```

### 规范 2：转换在调用链最外层完成
```javascript
// ✅ 正确 - Game.render()
render() {
    const screenPos = transformer.worldToScreen(player.x, player.y);
    hd2dRenderer.renderPlayerEffects(screenPos.x, screenPos.y);
}
```

### 规范 3：贴图绘制统一使用工具函数
```javascript
// ✅ 正确
SpriteRenderer.draw(ctx, sprite, {
    x: screenX,
    y: screenY,
    anchor: 'feet',  // 自动处理锚点偏移
    scale: zoom,
    flip: player.facingRight
});
```

---

## 实施步骤

### Phase 1：创建 CoordinateTransformer（30分钟）
- 整合所有坐标转换逻辑
- 替换所有散落的世界→屏幕转换

### Phase 2：创建 SpriteRenderer（1小时）
- 统一的贴图绘制函数
- 自动处理锚点、翻转、缩放
- 内部使用屏幕坐标

### Phase 3：重构所有渲染代码（2小时）
- 逐个替换 render 函数
- 确保所有入参都是屏幕坐标
- 删除 SpriteData 中的 worldToRender 等混乱方法

### Phase 4：调试验证（30分钟）
- 开启坐标调试模式
- 验证碰撞箱、贴图、特效对齐

---

## 预期收益

1. **Bug 归零**：坐标问题彻底解决
2. **开发加速**：新功能无需考虑坐标转换
3. **维护简化**：只需理解屏幕坐标
4. **性能提升**：避免重复转换

---

## 实施建议

**方案 A：彻底重构**（推荐）
- 实施完整方案，一次性解决
- 耗时约4小时，但永久解决

**方案 B：逐步修复**
- 先修复当前最严重的几个偏移
- 后续再实施完整方案
- 风险：可能还有其他隐藏问题

**请陛下选择方案，或先实施 Phase 1 验证效果？**
