# 变更文件清单
## 2026-03-05 迁移+修复完成

---

## 📦 需要保存的文件

### 1. 主文件 (核心)
| 文件 | 修改内容 | 大小 |
|------|----------|------|
| `index.html` | 精简主文件，移除内联类定义 | 599.6 KB |

### 2. 新增模块 (必须保存)
| 文件 | 说明 | 大小 |
|------|------|------|
| `data/items/index.js` | ITEMS 道具数据 (新) | 14.04 KB |
| `data/enemies/index.js` | ENEMY_TYPES 敌人数据 (新) | 6.04 KB |
| `src/systems/weapons/Weapon.js` | Weapon 类 (新) | 27.08 KB |
| `src/systems/enemies/Enemy.js` | Enemy 类 (新) | 52.94 KB |

### 3. 修复的文件
| 文件 | 修改内容 | 大小 |
|------|----------|------|
| `src/render/systems/AmbienceSystem.js` | 添加 resize 方法 | 3.86 KB |
| `src/systems/AudioController.js` | 添加缺失音效 + 防卡顿 | 11.18 KB |

---

## 🗑️ 可删除的文件 (已归档)

这些文件已移动到 `archive/` 目录:
- `src/systems/PetSystem.js`
- `src/systems/audio.js`
- `src/systems/audio_enhanced.js`
- `src/systems/*SpriteData.js` (多个)
- 其他未使用的外部文件

---

## 💾 保存建议

### 方案 A: Git 提交 (推荐)
```bash
git add index.html
git add data/items/index.js
git add data/enemies/index.js
git add src/systems/weapons/Weapon.js
git add src/systems/enemies/Enemy.js
git add src/render/systems/AmbienceSystem.js
git add src/systems/AudioController.js
git commit -m "迁移核心系统到独立模块 + 修复渲染和音效问题"
```

### 方案 B: 手动备份
复制以下文件到安全位置:
1. `index.html`
2. `data/` 目录
3. `src/systems/weapons/` 目录
4. `src/systems/enemies/` 目录
5. 修改过的 `src/render/systems/AmbienceSystem.js`
6. 修改过的 `src/systems/AudioController.js`

---

## 📊 变更统计

| 类别 | 数量 |
|------|------|
| 修改的主文件 | 1 个 (index.html) |
| 新增的模块 | 4 个 (数据+核心类) |
| 修复的文件 | 2 个 (AmbienceSystem + AudioController) |
| 归档的废弃文件 | 12+ 个 |

---

**状态**: ✅ 所有修改完成并通过测试
**最后更新**: 2026-03-05
