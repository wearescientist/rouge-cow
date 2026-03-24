# 🎨 Sprite System v2.0 重构报告

## 概述

将贴图系统从**画布尺寸计算**重构为**实际模型边界计算**，解决以下问题：
- ✅ 模型被拉伸变形
- ✅ 碰撞体积与模型不匹配
- ✅ 阴影位置不适配

---

## 🏗️ 架构变更

### 核心概念
```
旧系统:                    新系统:
┌───────────┐             ┌───────────────────┐
│  Canvas   │             │      Canvas       │
│  200x200  │             │     200x200       │
│           │             │  ┌───────────┐    │
│ ┌───────┐ │             │  │   Model   │    │
│ │ 实际  │ │             │  │  60x80    │    │
│ │ 60x80 │ │  →→→→→→→   │  │ ┌─────┐   │    │
│ │ 模型  │ │             │  │ │👾   │   │    │
│ └───────┘ │             │  │ └─────┘   │    │
│           │             │  └───────────┘    │
└───────────┘             └───────────────────┘
```

### 锚点系统
- **移动/阴影**: 使用脚底锚点 (`feet`)
- **其他/攻击判定**: 使用几何中心 (`center`)

---

## 📁 新增文件

| 文件 | 说明 |
|------|------|
| `src/utils/SpriteData.js` | 核心类，管理模型边界、锚点、碰撞箱 |
| `src/systems/SpriteDataRegistry.js` | 全局注册表，加载 metadata.json |
| `assets/sprites/metadata.json` | 预计算的贴图元数据 |
| `tools/SpriteDataGenerator.js` | 浏览器端元数据生成工具 |
| `tools/generate-sprite-metadata.js` | Node.js 批量生成脚本 |
| `audio_preview_v2.html` | 音效对比工具 |

---

## ✏️ 修改的文件

### index.html
1. **引入新模块** (line ~22238)
   ```html
   <script src="src/utils/SpriteData.js"></script>
   <script src="src/systems/SpriteDataRegistry.js"></script>
   ```

2. **Enemy.draw()** - 使用 SpriteData 计算精确绘制位置
   - 获取 `_spriteData` 缓存
   - 使用 `worldToRender()` 计算绘制坐标
   - 描边和精灵都使用精确位置

3. **Enemy 碰撞检测** - 精确碰撞箱
   - `containsPoint()`: 使用 hitbox 矩形检测
   - `intersectsCircle()`: 矩形-圆碰撞
   - `intersectsBullet()`: 复用 circle 检测
   - `getHitbox()`: 返回精确碰撞箱

4. **Player 绘制** - 同样使用 SpriteData

5. **loadSprites()** - 加载 metadata.json

### src/systems/ShadowSystem.js
- `drawShadow()`: 使用 SpriteData 获取模型宽度和脚底位置
- `drawShadowsBatch()`: 批量绘制同样支持
- 阴影尺寸基于实际模型宽度而非画布尺寸

---

## 🎯 数据格式

### metadata.json
```json
{
  "enemies/chick": {
    "src": "assets/sprites/enemies/chick.png",
    "canvasWidth": 64,
    "canvasHeight": 64,
    "modelOffsetX": 20,      // 模型相对画布左上角的偏移
    "modelOffsetY": 20,
    "modelWidth": 24,        // 实际可见内容尺寸
    "modelHeight": 28,
    "anchor": {
      "center": { "x": 32, "y": 34 },   // 几何中心
      "feet": { "x": 32, "y": 48 }      // 脚底中心
    },
    "hitboxRatio": { "w": 0.8, "h": 0.9 },  // 碰撞箱占模型的比例
    "shadowOffsetY": 2
  }
}
```

---

## 🔧 API 使用

### 获取 SpriteData
```javascript
// 从注册表获取
const spriteData = window.spriteDataRegistry.get('enemies/chick');

// 从 Image 对象获取
const spriteData = window.spriteDataRegistry.getFromImage(img);
```

### 坐标转换
```javascript
// 世界坐标 → 渲染坐标
const renderPos = spriteData.worldToRender(worldX, worldY, scale, 'feet');

// 获取脚底位置
const feet = spriteData.getFeetPosition(worldX, worldY);

// 获取中心位置
const center = spriteData.getCenterPosition(worldX, worldY);
```

### 碰撞箱
```javascript
// 获取精确碰撞箱（世界坐标）
const hitbox = spriteData.getHitbox(entity.x, entity.y, scale);
// 返回: { x, y, width, height }
```

### 阴影位置
```javascript
// 获取阴影绘制位置和尺寸
const shadow = spriteData.getShadowPosition(entity.x, entity.y, scale);
// 返回: { x, y, width }
```

---

## 🐛 调试功能

在 `SpriteData` 类中内置调试绘制：
```javascript
// 绘制画布边界(红)、模型边界(绿)、碰撞箱(蓝)、锚点(黄/紫)
spriteData.drawDebug(ctx, worldX, worldY, scale);
```

---

## ⚠️ 注意事项

1. **metadata.json 需要更新**: 当添加新贴图时，需要运行生成工具更新元数据

2. **向后兼容**: 如果 SpriteData 加载失败，系统会回退到旧逻辑（基于 size 的估算）

3. **性能**: SpriteData 实例会被缓存到 `_spriteData` 属性，避免重复计算

---

## 🔄 生成工具使用

### 浏览器端（推荐）
1. 游戏加载完成后，在控制台运行：
   ```javascript
   generateSpriteMetadata();
   ```
2. 自动下载 metadata.json
3. 替换 assets/sprites/metadata.json

### Node.js
```bash
npm install canvas
node tools/generate-sprite-metadata.js
```

---

## ✅ 测试检查清单

- [ ] 所有敌人渲染正常，无拉伸变形
- [ ] 阴影位置在脚底，不浮空不埋地
- [ ] 碰撞检测精确（可用调试模式验证）
- [ ] 玩家渲染和阴影正常
- [ ] 不同尺寸怪物比例正确
- [ ] Boss 尺寸和碰撞箱正确

---

*重构日期: 2026-03-04*  
*版本: v2.0*
