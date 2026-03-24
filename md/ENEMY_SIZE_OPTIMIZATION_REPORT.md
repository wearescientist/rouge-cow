# 🎯 怪物大小优化报告

## 数据来源分析

基于 `ENEMY_TYPES` 中的 size 字段分析：

| 等级 | 怪物 | Size | 分类 |
|------|------|------|------|
| **T1 普通** | snail, duck3, pigeon | 22-28 | 小型 |
| | bat | 40 | 中型(飞行) |
| | chick, mouse | 48-50 | 中型(地面) |
| **T2 精英** | goose, yinya | 22-24 | 小型 |
| | rabbit2, tiaotiao, panther | 30-36 | 中型 |
| | bear | 42 | 中大型 |
| | snake, fox, crab | 48 | 大型 |
| | nibei | 50 | 大型(肉盾) |
| **T3 小Boss** | ghost | 30 | 中型 |
| | mimic | 42 | 中大型 |
| | turtle | 50 | 大型 |
| **T4 Boss** | mother | 72 | 超大型 |

---

## 优化策略

### 1. 画布尺寸标准化
- **标准敌人**: 64x64 (绝大多数)
- **Boss**: 96x96 (mother)

### 2. 模型尺寸分级

| 分级 | modelWidth x modelHeight | 代表怪物 |
|------|-------------------------|----------|
| **超小型** | 20x22 | bee (飞行) |
| **小型** | 24x24~28 | mouse, yinya, snail |
| **中小型** | 28x30~32 | chick, rabbit, cat |
| **中型** | 32x32~36 | dog, pig, sheep, panther |
| **中大型** | 36x36~40 | bear, nibei, wolf_king |
| **大型** | 40x42 | turtle, mimic, crab |
| **超大型** | 72x72 | mother (Boss) |

### 3. 碰撞箱比例按类型调整

| 类型 | hitboxRatio | 说明 |
|------|-------------|------|
| 飞行单位 | 0.65~0.75 x 0.75~0.8 | bee, bat, bird, ghost, pigeon |
| 普通地面 | 0.75~0.8 x 0.85~0.9 | 大多数怪物 |
| 肉盾型 | 0.85~0.9 x 0.9~0.95 | crab, nibei, turtle, bear |
| 刺客型 | 0.7 x 0.85 | yinya (小型快速) |

---

## 关键优化点

### 填充率优化
```
旧问题: 所有怪物使用统一 size，导致：
- 小型怪物(snail)画布太大，浪费渲染
- 大型怪物(bear)画布太小，被压缩

新方案: 根据实际模型尺寸计算
- snail: model=28x24 / canvas=64x64 (填充率 16%)
- bear: model=40x40 / canvas=64x64 (填充率 39%)
```

### 锚点精确化
```javascript
// 飞行怪物 - 脚底更高（视觉悬浮）
feet: { y: 40 }  // 正常地面是 48-52

// 肉盾怪物 - 脚底更低（显得笨重）
feet: { y: 52 }  // 比标准高

// Boss - 特大画布特殊处理
canvas: 96x96, feet: { y: 84 }
```

### 阴影偏移
| 类型 | shadowOffsetY | 说明 |
|------|---------------|------|
| 飞行/小型 | 1 | 紧贴地面 |
| 标准 | 2 | 正常偏移 |
| 重型 | 3-4 | 阴影更深 |

---

## 配置文件

### metadata_optimized.json
- 包含所有 22 种怪物的精确配置
- 包含玩家 8 帧动画配置
- 每个配置包含 meta 字段便于调试

### SpriteDataRegistry 默认配置
- 内置 31 种怪物的回退配置
- 自动生成 12 种描边颜色变体
- 支持离线/加载失败时使用

---

## 使用方式

### 1. 精确配置（推荐）
```javascript
// 加载 metadata_optimized.json
await spriteDataRegistry.load('assets/sprites/metadata_optimized.json');
const spriteData = spriteDataRegistry.get('bear');
```

### 2. 回退配置
```javascript
// 当精确配置不可用时自动使用
const spriteData = spriteDataRegistry.get('unknown_enemy');
// 返回基于 size 估算的默认配置
```

### 3. 动态调整
```javascript
// 根据游戏需求微调
spriteData.setHitboxRatio(0.9, 0.95); // 肉盾型更大碰撞箱
```

---

## 验证清单

- [x] 所有 T1 怪物大小符合 size 22-50 分布
- [x] 所有 T2 怪物大小符合 size 22-50 分布
- [x] T3 Boss 使用更大的 model 尺寸
- [x] T4 Boss 使用 96x96 画布
- [x] 飞行单位 hitbox 更小
- [x] 肉盾单位 hitbox 更大
- [x] 锚点位置符合视觉预期
- [x] 阴影偏移与体型匹配

---

## 性能影响

| 优化项 | 影响 |
|--------|------|
| 精确 model 尺寸 | 碰撞检测更准确 |
| 分级 hitbox | 游戏平衡性更好 |
| 标准化画布 | 渲染批处理更高效 |
| 锚点优化 | 阴影位置更准确 |

---

*优化完成日期: 2026-03-04*
*版本: v2.2*
