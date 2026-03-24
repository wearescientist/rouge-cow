# Sprite & Hitbox System v2 Design

## 核心问题
1. 蜗牛等贴图被压缩 - 渲染时未保持原始比例
2. 碰撞箱不精准 - 使用估算而非实际像素边界
3. 坐标系混乱 - 脚底/中心锚点混用

## 设计方案

### 1. 精确像素边界提取
```
贴图文件 → 扫描非透明像素 → 提取边界框 → 存储 {offsetX, offsetY, width, height}
```

### 2. 分层碰撞检测
```
Layer 1: AABB 包围盒快速剔除 (O(1))
Layer 2: 精确碰撞箱检测 (O(1))  
Layer 3: 像素级检测 (仅在必要时 O(n²))
```

### 3. 统一坐标系
- 所有世界坐标使用 **脚底 (feet)** 作为原点
- 渲染时使用 SpriteData 转换为屏幕坐标
- 碰撞检测统一转换为中心坐标

### 4. 渲染流程
```
World Position (feet)
    ↓
SpriteData.worldToRender() → Canvas Position
    ↓
drawImage(sprite, -anchor.x, -anchor.y)
```

### 5. 碰撞流程
```
Entity A (feet pos) ─┐
                     ├──→ SpriteData.getHitbox() → AABB检测
Entity B (feet pos) ─┘
```

## 数据结构

### SpriteData v2
```javascript
{
    // 原始画布尺寸
    canvasWidth, canvasHeight,
    
    // 非透明像素边界（相对于画布左上角）
    bounds: { x, y, width, height },
    
    // 锚点（相对于画布左上角）
    anchor: {
        center: { x, y },      // 几何中心
        feet: { x, y }         // 脚底中心
    },
    
    // 碰撞遮罩（可选，用于像素级检测）
    collisionMask: Uint8Array,
    
    // 碰撞箱比例（默认0.95）
    hitboxRatio: { w, h }
}
```

## 迭代计划

### Iter 1: 重构 SpriteData 核心类
- 添加精确边界计算
- 统一锚点系统
- 优化坐标转换方法

### Iter 2: 实现像素精确裁剪  
- 更新 metadata.json 格式
- 添加碰撞遮罩生成
- 修复渲染比例问题

### Iter 3: 优化碰撞检测性能
- 实现空间分区
- 添加分层检测
- 性能测试

### Iter 4: 统一渲染和碰撞锚点
- 修复所有实体渲染
- 修复碰撞箱计算
- 添加调试可视化

### Iter 5: 最终验证和文档
- 全面测试
- 文档更新
- 性能基准
