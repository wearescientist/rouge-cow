# PLAN: 模块化架构优化方案

## 问题背景

当前`index.html`存在严重的架构问题：
- 15000+行代码，40+个类定义
- 内部定义和外部引用混合，AI无法确定代码位置
- 重复劳动风险：可能在index和外部文件同时修改同一功能

---

## 已完成的迁移 ✅

| 系统 | 原位置 | 新位置 | 状态 |
|------|--------|--------|------|
| 宠物系统 | index.html内 | `src/systems/PetSystem.js` | ✅ 已完成 |
| 武器升级表 | index.html内 | `src/systems/weaponUpgrade.js` | ✅ 已完成 |

---

## 目录结构规范（已确定）

```
rougelike-cow/
├── index.html              # 主入口（只保留最核心逻辑）
├── src/
│   ├── systems/            # 游戏系统
│   │   ├── PetSystem.js         ✅ 已迁移
│   │   ├── weaponUpgrade.js     ✅ 已迁移
│   │   ├── enemySystem.js       📋 待迁移
│   │   ├── itemSystem.js        📋 待迁移
│   │   ├── visualSystem.js      📋 待迁移
│   │   └── audioManager.js      📋 待迁移
│   ├── core/               # 核心引擎
│   │   └── core_engine.js       # 备用ECS系统
│   ├── data/               # 数据定义
│   │   ├── enemyCodex.js        # 敌人数据
│   │   └── totemData.js         # 图腾数据
│   └── utils/              # 工具函数
│       ├── helpers.js           ✅ 已迁移
│       └── SpriteData.js        ✅ 已迁移
├── doc/                    # 文档
│   ├── log/memory.md            ✅ 已创建
│   ├── plan/                    # 规划文档
│   └── report/                  # 执行报告
└── SYSTEM_MAP.md           # 代码位置映射表 ✅ 已创建
```

---

## 迁移优先级

### Phase 1: 高优先级（建议下一批）
1. **Enemy系统** (~2000 lines)
   - ENEMY_TYPES, BOSS_TYPES 配置
   - Enemy 类定义
   - 原因：相对独立，更新频繁

2. **Item系统** (~1500 lines)
   - ITEMS 配置
   - ItemManager 类
   - 原因：与武器系统解耦

### Phase 2: 中优先级
3. **视觉效果系统** (~1500 lines)
   - ParticleSystem
   - DamageNumberSystem
   - BloodStainSystem

4. **音频系统** (~800 lines)
   - SoundManager
   - 原因：外部已有AudioSystem.js，需整合

### Phase 3: 低优先级（可选）
5. **Room/Map生成** (~2000 lines)
   - Room类, MapGenerator
   - 原因：与Game类耦合紧密

6. **核心Game类** (~5000 lines)
   - 最大最复杂，最后迁移
   - 需要其他系统先稳定

---

## 迁移规范

### 1. 文件创建规范
```javascript
/**
 * [SystemName] - [功能描述]
 * 
 * 迁移状态: 从index.html迁移
 * 原位置: Line ~[原行号]
 * 迁移日期: YYYY-MM-DD
 * 
 * 依赖: [列出依赖的其他系统]
 * 被依赖: [列出依赖此系统的其他模块]
 */
```

### 2. index.html引用规范
```html
<!-- 外部系统 - 按加载顺序排列 -->
<script src="src/utils/helpers.js"></script>
<script src="src/data/enemyCodex.js"></script>
<script src="src/systems/PetSystem.js"></script>
<script src="src/systems/weaponUpgrade.js"></script>
<!-- ... -->

<!-- 主游戏逻辑 -->
<script>
// index.html内部只保留: Game主循环、初始化代码
</script>
```

### 3. 全局变量约定
- 配置数据：`const UPPER_SNAKE_CASE`（如`ENEMY_TYPES`）
- 类定义：`class PascalCase`（如`class Enemy`）
- 管理器实例：`lowerCamelCase`（如`const itemManager = new ItemManager()`）

---

## 风险提示

### ⚠️ 迁移中的注意事项

1. **全局变量依赖**
   - index.html中很多类直接访问`game`全局变量
   - 迁移时需检查`game.xxx`调用

2. **canvas上下文**
   - 渲染系统依赖`ctx`全局变量
   - 需通过参数传递或保持全局

3. **事件监听**
   - 键盘/鼠标事件在Game类中处理
   - 迁移子系统时可能需要事件代理

4. **循环引用风险**
   - Game持有所有系统引用
   - 系统可能反向引用Game
   - 需小心避免循环依赖

---

## 执行建议

### 短期（当前会话）
- [x] 创建SYSTEM_MAP.md代码映射表
- [x] 创建doc/目录结构
- [x] 创建记忆日志

### 中期（未来几次迭代）
- [ ] 迁移Enemy系统
- [ ] 迁移Item系统
- [ ] 更新SYSTEM_MAP.md

### 长期（大版本更新）
- [ ] 引入模块系统(ESM或构建工具)
- [ ] 完整拆分index.html
- [ ] 单元测试覆盖

---

## 决策记录

**为何不完全立即拆分？**
- 当前架构已稳定运行，大规模重构风险高
- 逐步迁移可以在保持功能的同时优化结构
- 测试覆盖不足，全面重构容易引入regression

**为何不使用构建工具？**
- 项目当前无构建依赖，保持零配置
- 浏览器直接加载适合快速迭代
- 未来可考虑Vite等轻量工具

---

*文档版本: v1.0*
*规划日期: 2026-03-05*
