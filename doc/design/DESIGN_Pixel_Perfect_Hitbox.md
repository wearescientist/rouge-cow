# 贴图精确碰撞箱系统设计方案

## 当前问题分析

### 1. 碰撞箱现状
- 使用**圆形碰撞箱**，半径硬编码 (`physics: 20` 等)
- 基于敌人的 `tier` 和 `typeKey` 决定半径
- **完全没有使用 SpriteData 的 hitbox 数据**

### 2. 光环位置问题
- `BacklightSystem.render(x, y)` 接收的是**脚底世界坐标**
- 光环绘制在 `(x, y)`，即脚底位置
- **正确做法**: 应该绘制在贴图中心位置

---

## 解决方案

### 方案一：矩形碰撞箱（推荐）

使用 SpriteData 的 `getHitbox()` 返回的精确矩形：

```javascript
// SpriteData.getHitbox() 返回:
{
    x: hitboxX,      // 碰撞箱左上角世界坐标
    y: hitboxY, 
    width: hitboxW,  // 精确宽度
    height: hitboxH  // 精确高度
}
```

**优点**:
- 与贴图形状最接近
- 计算简单高效
- 易于调试可视化

### 方案二：椭圆碰撞箱（更精确）

对于不规则形状，使用椭圆近似：

```javascript
{
    cx: centerX,     // 椭圆中心
    cy: centerY,
    rx: radiusX,     // X轴半径
    ry: radiusY      // Y轴半径
}
```

---

## 实施步骤

### Step 1: 修改玩家对象

```javascript
// 在 Game.initPlayer() 中
this.player = {
    x, y, hp, maxHp, ...
    
    // 添加 spriteData
    spriteData: window.spriteDataRegistry.get('player'),
    
    // 添加获取碰撞箱方法
    getHitbox() {
        return this.spriteData.getHitbox(this.x, this.y, 1);
    },
    
    // 获取贴图中心（用于光环）
    getSpriteCenter() {
        return this.spriteData.getCenterPosition(this.x, this.y, 1, 'feet');
    }
};
```

### Step 2: 修改敌人系统

```javascript
// Enemy 类构造函数
constructor(typeKey, x, y) {
    this.typeKey = typeKey;
    this.x = x;
    this.y = y;
    
    // 获取 SpriteData
    this.spriteData = window.spriteDataRegistry.get(typeKey);
    
    // 如果没有，使用默认
    if (!this.spriteData) {
        this.spriteData = window.spriteDataRegistry._createDefault(typeKey);
    }
}

getHitbox() {
    return this.spriteData.getHitbox(this.x, this.y, 1);
}
```

### Step 3: 修改碰撞检测

```javascript
// 新的矩形碰撞检测
rectCollision(rect1, rect2) {
    return rect1.x < rect2.x + rect2.width &&
           rect1.x + rect1.width > rect2.x &&
           rect1.y < rect2.y + rect2.height &&
           rect1.y + rect1.height > rect2.y;
}

// 或者椭圆碰撞检测
ellipseCollision(e1, e2) {
    // 使用椭圆间距离计算
    const dx = e1.cx - e2.cx;
    const dy = e1.cy - e2.cy;
    const dist = Math.sqrt(dx*dx + dy*dy);
    return dist < (e1.rx + e2.rx) * 0.8; // 稍微宽松
}
```

### Step 4: 修复光环位置

```javascript
// BacklightSystem.render()
render(entity) {
    // 获取贴图中心，而不是脚底
    const center = entity.getSpriteCenter();
    const size = entity.spriteData.getModelSize(1);
    
    // 绘制围绕贴图的光环
    const radius = Math.max(size.width, size.height) * 0.6;
    
    this.ctx.strokeStyle = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
    this.ctx.lineWidth = 3;
    this.ctx.beginPath();
    this.ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
    this.ctx.stroke();
}
```

---

## 调试支持

### 1. 碰撞箱可视化

```javascript
// 在 render 中绘制碰撞箱
const hitbox = entity.getHitbox();
ctx.strokeStyle = '#0f0';
ctx.strokeRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
```

### 2. 贴图边界可视化

```javascript
// 绘制贴图画布边界
entity.spriteData.drawDebug(ctx, entity.x, entity.y, 1);
```

---

## 风险与回退

### 风险
1. 性能：矩形碰撞比圆形稍慢（但可忽略）
2. 平衡性：精确碰撞箱可能改变游戏难度

### 回退方案
保留旧的 `getRadius()` 方法作为 fallback：

```javascript
getHitbox() {
    if (!this.spriteData) {
        // 回退到圆形
        const r = this.getRadiusOld();
        return { x: this.x - r, y: this.y - r, width: r*2, height: r*2 };
    }
    return this.spriteData.getHitbox(this.x, this.y, 1);
}
```

---

## 实施顺序

1. **先修复光环位置**（最简单，立即可见效果）
2. **添加调试可视化**（验证碰撞箱正确性）
3. **修改碰撞系统**（核心功能）
4. **测试平衡性**（调整 hitboxRatio 如果必要）
