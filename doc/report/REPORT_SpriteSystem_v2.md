# Sprite & Hitbox System v2.0 实现报告

## 迭代总结

### Iter 1: SpriteData 核心类重构
- **重写** `src/utils/SpriteData.js` 
- 新增 `bounds` 属性存储精确非透明像素边界
- 新增 `aspectRatio` 属性供渲染保持比例
- 新增 `getRenderSize()` 方法计算保持面积的显示尺寸
- 新增 `fromImageData()` 静态工厂方法从图片分析创建

### Iter 2: 像素精确裁剪
- **生成** `assets/sprites/metadata_v2.json` 新格式
- 所有 25 个贴图都提取了精确 bounds
- 蜗牛示例: Canvas 42x64 → Bounds 29x21 (填充率 22.7%)
- 更新 Enemy 和 Player 渲染代码使用精确裁剪

### Iter 3&4: 碰撞检测优化和锚点统一
- **重写** `src/systems/CollisionSystem.js`
- 所有实体统一使用 **feet(脚底)** 作为世界坐标原点
- 碰撞检测使用 `SpriteData.getHitbox()` 获取精确AABB
- 添加统计信息追踪 (aabbChecks, hitboxChecks, collisions)
- 添加空间分区支持 (buildSpatialGrid, checkCollisionsSpatial)

## 关键改进

### 1. 蜗牛压缩问题修复
**问题原因**: 渲染时未裁剪透明边距，导致贴图被拉伸填充整个目标区域

**解决方案**: 
```javascript
// 使用 bounds 精确裁剪
ctx.drawImage(
    sprite,
    bounds.x, bounds.y, bounds.width, bounds.height,  // 源裁剪
    -drawW/2, -drawH, drawW, drawH                   // 目标位置
);
```

### 2. 玩家碰撞伤害修复
**问题原因**: 
- Enemy 默认 spriteData 格式不兼容 v2.0 API
- `getCenterY()` 使用错误属性名 `this.type` 而非 `this.typeKey`

**解决方案**:
- 更新默认 spriteData 使用 v2.0 API 格式
- 修复 `getCenterY()` 使用 `this.spriteData`
- 碰撞系统统一使用 `getHitbox()` 方法

### 3. 坐标系统一
所有实体现在使用一致的坐标系统:
- **世界坐标**: 以 `feet(脚底)` 为原点
- **渲染坐标**: 使用 `worldToCanvas()` 转换
- **碰撞坐标**: 使用 `getHitbox()` 获取AABB

## 数据结构对比

### v1.0 (旧)
```javascript
{
    modelOffsetX: 18, modelOffsetY: 24,
    modelWidth: 28, modelHeight: 24,
    anchor: { center: {x:32, y:32}, feet: {x:32, y:48} }
}
```

### v2.0 (新)
```javascript
{
    bounds: { x: 6, y: 21, width: 29, height: 21 },
    anchor: { center: {x:20, y:31}, feet: {x:20, y:42} },
    aspectRatio: 1.38
}
```

## 性能优化

### 分层碰撞检测
1. **AABB快速剔除** - O(1), 排除大部分不碰撞情况
2. **精确碰撞箱** - O(1), 处理边界情况
3. **像素级检测** - O(n²), 仅在需要时使用 (预留接口)

### 空间分区
- 构建网格索引减少检测对数
- 100x100像素格子适合当前游戏密度

## 测试验证

### 关键数据 (蜗牛)
| 属性 | 值 | 说明 |
|------|-----|------|
| Canvas | 42x64 | 原始贴图尺寸 |
| Bounds | 29x21 | 非透明区域 |
| Fill | 22.7% | 填充率 |
| Ratio | 1.38 | 宽:高 |

### 渲染结果
- 蜗牛不再被压缩，保持 29:21 原始比例
- 所有贴图都使用精确裁剪，无拉伸变形

## 文件变更

### 新增文件
- `tools/regenerate_metadata_v2.py` - v2.0 元数据生成器
- `test_collision.html` - 碰撞系统测试页面
- `doc/design/DESIGN_SpriteSystem_v2.md` - 设计方案
- `doc/report/REPORT_SpriteSystem_v2.md` - 本报告

### 修改文件
- `src/utils/SpriteData.js` - 完全重写 v2.0
- `src/systems/CollisionSystem.js` - 完全重写 v2.0
- `src/systems/enemies/Enemy.js` - 更新渲染和默认数据
- `index.html` - 更新 Player 渲染
- `assets/sprites/metadata.json` - 更新为 v2.0 格式

## 后续建议

1. **性能监控**: 使用 `collisionSystem.stats` 监控碰撞检测性能
2. **空间分区**: 在实体数量 >50 时启用空间分区
3. **像素级碰撞**: 如需更精确，可实现 `pixelPerfectCollision()`
4. **缓存优化**: 考虑缓存碰撞箱结果减少重复计算

## 总结

5轮迭代完成了:
1. ✅ 研究最佳实践
2. ✅ 设计新架构
3. ✅ 重构核心类
4. ✅ 实现精确裁剪
5. ✅ 优化碰撞系统

蜗牛等贴图现在保持原始比例渲染，玩家碰撞伤害系统正常工作。
