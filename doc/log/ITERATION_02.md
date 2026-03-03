# 迭代 02 - 敌人描边颜色系统

## 设计方案

### 目标
根据敌人类型（普通/精英/BOSS）使用不同颜色的描边贴图，增强视觉辨识度和层次感。

### 颜色映射（按用户新贴图）
- **white**: 普通怪物（默认）
- **red/pink/orange**: 精英怪（高威胁）
- **gold**: BOSS（终极敌人）
- **其他颜色**: 可用于特殊状态或变异怪

### 实现方式
1. 加载所有颜色变体贴图
2. 根据 enemy.isBoss / enemy.isElite 选择对应颜色
3. 普通怪使用 white，精英怪使用 red，BOSS 使用 gold

## 执行

### 修改 1: 贴图加载
- 加载 12 种颜色描边贴图（white, red, pink, orange, purple, gold, blue, cyan, green, lime, magenta, yellow）
- 每种颜色包含 22 个敌人贴图

### 修改 2: Enemy 类添加方法
- `getOutlinedSpriteName()`: 根据敌人类型返回对应颜色贴图名
  - BOSS -> gold
  - 精英 -> red
  - 普通 -> white

### 修改 3: 绘制代码更新
- `draw()` 和 `drawWithOffset()` 优先使用描边贴图
- 描边贴图不存在时回退到基础贴图

## 检查结果

### 状态
✅ 大括号匹配，语法检查通过
✅ 描边贴图系统实装完成

### 待测试
- [ ] 普通怪显示 white 描边
- [ ] 精英怪显示 red 描边
- [ ] BOSS 显示 gold 描边

## 状态
✅ 已完成，等待测试验证
