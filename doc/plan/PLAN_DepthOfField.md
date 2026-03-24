# 俯视角游戏景深模拟方案

## 当前布局分析

```
俯视角（Top-Down）+ 固定房间
屏幕Y轴对应游戏世界Y轴
上方 = 远处（背景）
下方 = 近处（前景）
```

## 方案一：Y轴渐变模糊（推荐）

### 原理
屏幕越靠上（Y值越小）= 越远 = 越模糊

```
屏幕Y坐标:
0      -> 最模糊 (远景)
960/2  -> 正常   (中景)
960    -> 清晰   (近景)
```

### 实现方式

```javascript
// 渲染每个物体前，根据Y坐标决定模糊度
renderEntity(entity, camera) {
    const screenY = camera.worldToScreen(entity.x, entity.y).y;
    const blurAmount = calculateBlur(screenY);
    
    if (blurAmount > 0) {
        // 应用模糊滤镜（或降低透明度模拟）
        ctx.filter = `blur(${blurAmount}px)`;
    }
    
    // 绘制实体
    drawEntity(entity);
    
    ctx.filter = 'none'; // 重置
}

// 计算模糊量
function calculateBlur(screenY) {
    const maxBlur = 3; // 最大模糊像素
    const horizonY = canvas.height * 0.4; // 地平线位置
    
    if (screenY > horizonY) return 0; // 近处不模糊
    
    // 越往上越模糊
    const t = 1 - (screenY / horizonY);
    return t * maxBlur;
}
```

### 效果
- 远处的墙壁/敌人模糊
- 近处的玩家清晰
- 有立体感

---

## 方案二：分层景深（性能好）

### 原理
把场景分成3层，每层不同模糊度

```
Layer 0 (远景): 墙壁外 + 迷雾，高斯模糊 4px
Layer 1 (中景): 敌人/道具，正常
Layer 2 (近景): 玩家 + 前景，清晰 + 细节
```

### 实现

```javascript
class DepthRenderer {
    constructor() {
        // 创建离屏canvas用于模糊
        this.farCanvas = document.createElement('canvas');
        this.farCtx = this.farCanvas.getContext('2d');
    }
    
    render(game) {
        const w = canvas.width;
        const h = canvas.height;
        
        // 1. 渲染远景到离屏canvas
        this.farCtx.clearRect(0, 0, w, h);
        this.renderFarLayer(this.farCtx, game);
        
        // 2. 应用模糊并绘制到主canvas
        ctx.filter = 'blur(4px)';
        ctx.drawImage(this.farCanvas, 0, 0);
        ctx.filter = 'none';
        
        // 3. 渲染中景（正常）
        this.renderMidLayer(ctx, game);
        
        // 4. 渲染近景（玩家）
        this.renderNearLayer(ctx, game);
    }
}
```

---

## 方案三：迷雾深度（最简单）

### 原理
用半透明雾层遮挡远处，类似现在的孢子但更系统

```
远景: 浓雾 (opacity 0.6)
中景: 薄雾 (opacity 0.3)
近景: 无雾
```

### 代码

```javascript
renderDepthFog(ctx, camera) {
    const h = canvas.height;
    
    // 从上到下的渐变雾
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(10, 10, 20, 0.7)');   // 顶部浓雾
    grad.addColorStop(0.4, 'rgba(10, 10, 20, 0.3)'); // 中间薄雾
    grad.addColorStop(0.6, 'rgba(10, 10, 20, 0)');   // 底部无雾
    
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, canvas.width, h);
}
```

---

## 陛下选择

| 方案 | 效果 | 性能 | 实现难度 |
|-----|------|------|---------|
| Y轴渐变模糊 | 最真实 | 中等（逐物体模糊） | 中 |
| 分层景深 | 立体感强 | 好（分层渲染） | 中高 |
| 迷雾深度 | 氛围好 | 最好（单层叠加） | 低 |

**建议**: 先实现方案三（迷雾），效果立竿见影，再考虑方案一或二。

陛下想先试哪个？
