# 贴图精确碰撞箱系统 - 实施计划

## 当前状态

### 已完成的修复
1. ✅ **光照系统覆盖问题** - 修复了渲染顺序，暗角和移轴模糊现在正确渲染在光照之后
2. ✅ **光环位置问题** - `BacklightSystem` 现在接收玩家实体，光环围绕贴图中心而非脚底
3. ✅ **玩家 spriteData** - 玩家对象添加了 `spriteData` 属性

### 待完成的核心功能
- 使用 SpriteData 的精确碰撞箱替代圆形碰撞箱
- 添加碰撞箱调试可视化
- 更新敌人系统支持 SpriteData

---

## 实施步骤

### Phase 1: 碰撞箱可视化调试（下一步）

添加调试模式，可视化显示：
- 贴图画布边界（红色）
- 模型边界（绿色）
- 碰撞箱（蓝色）
- 锚点位置（黄色=脚底，紫色=中心）

```javascript
// 在 Game.render 中添加
if (this.showHitboxDebug) {
    this.renderHitboxDebug();
}
```

### Phase 2: 更新碰撞系统

修改 `CollisionSystem`：

```javascript
class CollisionSystem {
    // 新的矩形碰撞检测
    rectCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    // 获取实体碰撞箱（优先使用 SpriteData）
    getHitbox(entity) {
        if (entity.spriteData) {
            return entity.spriteData.getHitbox(entity.x, entity.y, 1);
        }
        // 回退到旧的圆形逻辑
        const r = this.getRadius(entity);
        return {
            x: entity.x - r,
            y: entity.y - r,
            width: r * 2,
            height: r * 2
        };
    }
}
```

### Phase 3: 更新敌人系统

修改敌人创建：

```javascript
class Enemy {
    constructor(typeKey, x, y) {
        this.typeKey = typeKey;
        this.x = x;
        this.y = y;
        
        // 加载 SpriteData
        this.spriteData = window.spriteDataRegistry?.get(typeKey);
        
        // 从 SpriteData 获取尺寸（如果可用）
        if (this.spriteData) {
            const size = this.spriteData.getModelSize(1);
            this.width = size.width;
            this.height = size.height;
        } else {
            // 回退到 ENEMY_TYPES
            this.width = ENEMY_TYPES[typeKey]?.size || 40;
            this.height = this.width;
        }
    }
}
```

---

## 技术细节

### SpriteData 碰撞箱计算

```javascript
// SpriteData.getHitbox() 已经实现：
getHitbox(worldX, worldY, scale = 1) {
    const scaledModelW = this.modelWidth * scale;
    const scaledModelH = this.modelHeight * scale;
    
    const hitboxW = scaledModelW * this.hitboxRatio.w;
    const hitboxH = scaledModelH * this.hitboxRatio.h;
    
    const modelLeft = worldX - (this.anchor.feet.x - this.modelOffsetX) * scale;
    const modelTop = worldY - (this.anchor.feet.y - this.modelOffsetY) * scale;
    
    const hitboxX = modelLeft + (scaledModelW - hitboxW) / 2;
    const hitboxY = modelTop + (scaledModelH - hitboxH) / 2;
    
    return { x: hitboxX, y: hitboxY, width: hitboxW, height: hitboxH };
}
```

### 碰撞响应

从圆形碰撞的"推开"改为矩形碰撞的"阻挡"：

```javascript
limitMovement(mover, newX, newY, obstacle) {
    const moverBox = this.getHitbox({...mover, x: newX, y: newY});
    const obstacleBox = this.getHitbox(obstacle);
    
    if (!this.rectCollision(moverBox, obstacleBox)) {
        return { x: newX, y: newY, collided: false };
    }
    
    // 计算最小分离向量
    const overlapX = Math.min(
        moverBox.x + moverBox.width - obstacleBox.x,
        obstacleBox.x + obstacleBox.width - moverBox.x
    );
    const overlapY = Math.min(
        moverBox.y + moverBox.height - obstacleBox.y,
        obstacleBox.y + obstacleBox.height - moverBox.y
    );
    
    // 沿最小重叠方向分离
    if (overlapX < overlapY) {
        const dir = mover.x < obstacle.x ? -1 : 1;
        return { x: newX + overlapX * dir, y: newY, collided: true };
    } else {
        const dir = mover.y < obstacle.y ? -1 : 1;
        return { x: newX, y: newY + overlapY * dir, collided: true };
    }
}
```

---

## 测试计划

1. **调试可视化** - 确保碰撞箱与贴图对齐
2. **玩家移动** - 测试与墙壁/敌人的碰撞
3. **敌人移动** - 测试敌人之间的碰撞避免
4. **伤害判定** - 测试攻击范围判定
5. **性能测试** - 大量敌人时的碰撞检测性能

---

## 回退方案

如果精确碰撞箱导致问题：

```javascript
// 在 CollisionSystem 中添加开关
constructor() {
    this.usePreciseHitbox = true; // 可以设置为 false 回退
}

getHitbox(entity) {
    if (!this.usePreciseHitbox || !entity.spriteData) {
        return this.getHitboxLegacy(entity); // 旧逻辑
    }
    return entity.spriteData.getHitbox(entity.x, entity.y, 1);
}
```
