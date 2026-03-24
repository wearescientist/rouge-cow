# 怪物总控台接入报告

## 本次实现

- 新增 `tools/monster_control_center.html`
- 新增 `tools/monster_control_center.js`
- 将以下网页工具聚合到单页工作区：
  - `monster_facing_tool.html`
  - `monster_animation_debug.html`
  - `monster_size_classifier.html`
  - `monster_floor_configurator.html`

## 新增能力

- 怪物档案：显示名称、ID、楼层、tier、size、基础属性
- 跨楼层分布：快速看到当前怪物出现在哪些楼层
- 资源选择视图：显示当前贴图路径与资源预览
- 新增怪物草案：本地记录新怪想法，不直接写运行时数据

## 结构边界

- 当前版本以“统一操作流”为主，不重写旧工具内部逻辑
- 工作区使用 iframe 嵌入现有成熟工具，降低回归风险
- 草案只写本地 `localStorage`，不直接改 `floor-data.js`

## 后续建议

- 第二版可继续接入真正的“属性编辑表单 + 导出配置”
- 若需要自动写回源码，建议单独设计保存协议，避免工具页各写各的
