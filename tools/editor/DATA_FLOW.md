# 🔄 数据覆盖链与写入方式文档

## 1. 数据覆盖链 (Data Override Chain)

### 1.1 敌人尺寸数据流

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         数据覆盖链 (Data Override Chain)                   │
└─────────────────────────────────────────────────────────────────────────┘

    贴图文件 (PNG)              元数据 (JSON)              配置 (JS)              运行时
         │                          │                       │                    │
         ▼                          ▼                       ▼                    ▼
┌─────────────────┐      ┌─────────────────┐     ┌─────────────────┐    ┌─────────────────┐
│                 │      │                 │     │                 │    │                 │
│  snail.png      │─────▶│  metadata.json  │────▶│  ENEMY_TYPES    │───▶│  Enemy实例       │
│  64x64 px       │      │  bounds: {      │     │  size: 20       │    │  getTargetHeight│
│                 │      │    w: 64,       │     │  tier: 1        │    │  tierMultiplier │
│                 │      │    h: 64        │     │                 │    │                 │
└─────────────────┘      └─────────────────┘     └─────────────────┘    └─────────────────┘
        │                                                        │
        │      覆盖优先级: metadata.bounds ──▶ ENEMY_TYPES.size   │
        │                                                        ▼
        │                                               ┌─────────────────┐
        │                                               │  最终渲染尺寸     │
        │                                               │  = size × tier   │
        │                                               │  = 20 × 1.0      │
        │                                               │  = 20px          │
        │                                               └─────────────────┘
        │
        └─▶ 如果 bounds 与 size 不一致，以 ENEMY_TYPES.size 为准
```

### 1.2 覆盖优先级规则

| 优先级 | 来源 | 说明 |
|--------|------|------|
| 1 (最高) | 运行时计算 | `Enemy.getTargetHeight()` × `tierMultiplier` |
| 2 | ENEMY_TYPES.size | 游戏配置中的目标尺寸 |
| 3 | metadata.json bounds | 贴图元数据的实际边界 |
| 4 (最低) | PNG 实际尺寸 | 原始贴图文件尺寸 |

**规则**: 高优先级配置覆盖低优先级配置。

## 2. 写入方式 (Write Methods)

### 2.1 保存数据 API

| 数据类型 | API 端点 | Store 方法 | 文件位置 |
|----------|----------|-----------|----------|
| 敌人 | `POST /api/save/enemies` | `saveEnemyTypes()` | `data/enemies/index.js` |
| 武器 | `POST /api/save/weapons` | `saveWeapons()` | 内存 (模拟数据) |
| 贴图元数据 | `POST /api/save/sprites` | `saveSpriteMetadata()` | `assets/sprites/metadata.json` |
| 物品 | `POST /api/save/items` | `saveItems()` | `data/items/index.js` |
| HD-2D | `POST /api/save/hd2d` | `saveHD2DConfig()` | 内存 (模拟数据) |

### 2.2 自动备份机制

每次保存操作会自动创建备份：

```
backup/
└── editor/
    ├── index.js.1234567890.backup
    ├── metadata.json.1234567891.backup
    └── ...
```

备份命名格式: `{filename}.{timestamp}.backup`

### 2.3 同步 API

| 同步方向 | API 端点 | 说明 |
|----------|----------|------|
| 贴图 → 敌人 | `POST /api/sync/sprite-to-enemy` | 将 metadata.bounds 同步到 ENEMY_TYPES.size |
| 敌人 → 贴图 | `POST /api/sync/enemy-to-sprite` | 将 ENEMY_TYPES.size 同步到 metadata.bounds |

## 3. 数据一致性检查

### 3.1 检查规则

```javascript
// 检查项
const checks = {
  // 错误级别
  error: [
    'Enemy 缺少 size 属性',
    'Player 缺少 size 属性',
    'Enemy.sprite 引用的贴图不存在'
  ],
  
  // 警告级别
  warning: [
    'Enemy 缺少 tier 属性',
    '贴图元数据缺少 bounds',
    'size 与 bounds 不一致'
  ]
}
```

### 3.2 自动修复

| 问题 | 修复方式 | API |
|------|----------|-----|
| Player.size 缺失 | 添加 `size: 48` | `POST /api/fix { type: 'addPlayerSize' }` |
| Enemy.size 缺失 | 从 bounds 同步或设置默认值 | `POST /api/fix { type: 'addEnemySize' }` |
| Enemy.tier 缺失 | 设置 `tier: 1` | `POST /api/fix { type: 'addEnemyTier' }` |

## 4. 代码位置映射

### 4.1 敌人系统

| 功能 | 代码位置 |
|------|----------|
| 类型定义 | `data/enemies/index.js` - `ENEMY_TYPES` |
| 渲染逻辑 | `src/systems/enemies/Enemy.js` - `draw()` / `drawWithOffset()` |
| 尺寸计算 | `src/systems/enemies/Enemy.js` - `getTargetHeight()` |
| 碰撞检测 | `src/systems/CollisionSystem.js` - `getHitbox()` |
| 生成逻辑 | `src/systems/room/Room.js` - `spawnEnemy()` |

### 4.2 渲染系统

| 功能 | 代码位置 |
|------|----------|
| 边缘光 | `src/render/systems/BacklightSystem.js` |
| 阴影 | `src/render/systems/ShadowSystem.js` |
| 描边 | `src/render/systems/OutlineSystem.js` |
| 泛光 | `src/render/systems/BloomSystem.js` |

## 5. 锚点规则 (Anchor Rules)

### 5.1 默认规则

```
所有设计的锚点默认是人物 CENTER，而不是脚底

渲染位置基于 center
碰撞箱基于 center
边缘光基于 center
特效发射点基于 center
```

### 5.2 例外情况

```
仅当明确需要"脚底"位置时，才使用 feet 锚点：
- 阴影
- 地面特效
```

### 5.3 渲染公式

```javascript
// 统一缩放公式
const scale = targetHeight / sprite.height
const drawWidth = sprite.width * scale
const drawHeight = sprite.height * scale

// 绘制位置（以 center 为锚点）
ctx.drawImage(
  sprite, 
  x - drawWidth / 2,   // center x
  y - drawHeight / 2,  // center y
  drawWidth, 
  drawHeight
)
```

## 6. 体型等级系统

### 6.1 等级定义

| 等级 | 名称 | 基础尺寸 | 倍率 | 最终尺寸 | 描边颜色 |
|------|------|----------|------|----------|----------|
| T1 | 普通 | 20-32px | 1.0x | 20-32px | #909399 |
| T2 | 精英 | 32-42px | 1.3x | ~42-55px | #67C23A |
| T3 | 稀有/Boss | 42-55px | 1.6x | ~67-88px | #E6A23C |
| T4 | 最终Boss | 55-72px | 2.0x | 110-144px | #F56C6C |

### 6.2 计算公式

```javascript
// Enemy.getTargetHeight()
getTargetHeight() {
  const baseSize = this.size || 32
  const tierMultipliers = { 1: 1.0, 2: 1.3, 3: 1.6, 4: 2.0 }
  return Math.round(baseSize * (tierMultipliers[this.tier] || 1.0))
}
```

## 7. 使用示例

### 7.1 修改敌人尺寸

```javascript
// 1. 在编辑器中修改
const enemy = {
  name: '蜗牛',
  size: 20,      // 修改这个值
  tier: 1,       // 体型等级
  sprite: 'snail'
}

// 2. 保存到 ENEMY_TYPES
await dataStore.saveEnemyTypes(enemyTypes)

// 3. 自动备份创建
// backup/editor/index.js.1234567890.backup

// 4. 游戏中生效
// Enemy.getTargetHeight() = 20 * 1.0 = 20px
```

### 7.2 同步贴图尺寸

```javascript
// 将 metadata.bounds 同步到 ENEMY_TYPES.size
await dataStore.syncSpriteToEnemy('snail')

// 或反向同步
await dataStore.syncEnemyToSprite('snail')
```

## 8. 注意事项

1. **保存前检查**: 编辑器会自动检查数据一致性，发现问题会提示
2. **自动备份**: 每次保存都会创建备份，可随时回滚
3. **增量更新**: 只修改需要更改的字段，保留其他配置
4. **刷新生效**: 修改保存后需要刷新游戏页面才能看到效果
5. **编码问题**: 所有文件使用 UTF-8 编码，Windows 系统特别注意
