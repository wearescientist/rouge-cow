# 数据常量迁移方案

## 当前状态

| 数据 | 位置 | 状态 | 大小(估算) |
|------|------|------|-----------|
| ITEMS | data/items/index.js | ✅ 已迁移 | ~200行 |
| ENEMY_TYPES | index.html | ⚠️ 待迁移 | ~300行 |
| BOSS_TYPES | data/enemies/bosses.js | ✅ 已迁移 | ~150行 |
| WEAPONS | index.html | ⚠️ 待迁移 | ~400行 |
| SUPER_WEAPONS | index.html | ⚠️ 待迁移 | ~200行 |
| PASSIVES | index.html | ⚠️ 待迁移 | ~150行 |
| PETS | index.html | ⚠️ 待迁移 | ~300行 |

## 迁移目标

将 index.html 中的 1,700+ 行数据常量迁移到 data/ 目录，实现：
1. **数据与逻辑分离** - 改平衡数值不用翻游戏代码
2. **热更新能力** - 理论上可运行时重载数据
3. **AI训练友好** - 数据文件独立，LLM更容易理解

## 目录结构

```
data/
├── items/
│   └── index.js          # ITEMS (已存在)
├── enemies/
│   ├── index.js          # ENEMY_TYPES (迁移)
│   └── bosses.js         # BOSS_TYPES (已存在)
├── weapons/
│   ├── index.js          # WEAPONS (迁移)
│   ├── super.js          # SUPER_WEAPONS (迁移)
│   └── evolution.js      # 武器进化关系 (新增)
├── passives/
│   └── index.js          # PASSIVES (迁移)
└── pets/
    └── index.js          # PETS (迁移)
```

## 加载顺序

```html
<!-- 1. 数据层 (必须先加载) -->
<script src="data/items/index.js"></script>
<script src="data/enemies/index.js"></script>
<script src="data/enemies/bosses.js"></script>
<script src="data/weapons/index.js"></script>
<script src="data/weapons/super.js"></script>
<script src="data/passives/index.js"></script>
<script src="data/pets/index.js"></script>

<!-- 2. 系统层 (依赖数据) -->
<script src="src/systems/weapons/Weapon.js"></script>
<script src="src/systems/enemies/Enemy.js"></script>
...

<!-- 3. 游戏逻辑 -->
<script>
  // Game 类使用全局数据
</script>
```

## 迁移步骤

### Step 1: 创建目录结构
```bash
mkdir -p data/weapons data/passives data/pets
```

### Step 2: 提取 WEAPONS
- 从 index.html 复制 WEAPONS 常量到 data/weapons/index.js
- 添加导出: `window.WEAPONS = WEAPONS;`

### Step 3: 提取 SUPER_WEAPONS
- 从 index.html 复制 SUPER_WEAPONS 到 data/weapons/super.js
- 添加导出

### Step 4: 提取 PASSIVES
- 从 index.html 复制 PASSIVES 到 data/passives/index.js
- 添加导出

### Step 5: 提取 PETS
- 从 index.html 复制 PETS 到 data/pets/index.js
- 添加导出

### Step 6: 提取 ENEMY_TYPES
- 从 index.html 复制 ENEMY_TYPES 到 data/enemies/index.js
- 注意: 与现有 index.js 合并

### Step 7: 更新 index.html
- 删除内联数据常量
- 添加 script 标签引用

### Step 8: 测试验证
- 检查所有全局变量存在
- 游戏正常运行

## 风险与回滚

- **风险**: 数据加载顺序错误导致 `WEAPONS is not defined`
- **回滚**: 从备份恢复 index.html，删除新文件即可

## 预期收益

- index.html 减少 ~1,700 行
- 最终目标: 15,484 → 13,700 行
- 数据修改无需触碰游戏逻辑
