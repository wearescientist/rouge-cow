# REPORT_MonsterSpriteSelection

## 本轮规则
- 不再按怪物名聚合“最佳来源”。
- 同名怪物的每个版本源都单独保留。
- 一个预览条目只能来自一个版本源，不允许跨版本拼接。
- 顶层 png 不再固定按平均网格切，统一按透明区域识别真实帧块。

## 当前结果
- 已按当前保留素材重新生成 150 个独立条目。
- 当前总导出帧数为 1312。
- 覆盖当前外部素材里仍存在的全部怪物版本源。
- 当前全部归入 `game_fit`，因为这些怪物名都能映射到项目现有敌人体系。

## 版本源拆分
- `monsters_sprites_sheet`
- `monsters_v1_sheet`
- `monsters_v2_sheet`
- `monsters_v3_sheet`
- `monsters_v4_sheet`
- `monsters_v5_sheet`
- `monsters_v6_sheet`
- `monsters_v7_sheet`
- `monsters_v8_sheet`
- `monsters_v9_sheet`
- `monsters_v10_sheet`

## 说明
- 当前源目录已经被删减，报告只反映仍存在的版本源。
- 顶层 png 统一先做 alpha 连通块检测，再按行列聚类排序。
- 页面展示以版本源分组，同名怪物不同版本不会混在一个动画条目里。
- 真实布局不再预设为 `3x3`；当前已识别出 `3x3`、`3x4` 和 `3/3/3/2` 等实际帧排布。

## 当前人工筛选工作台
- `monster-preview.html` 已升级为可交互分类页。
- 每个怪物版本条目都支持四类人工标记：`直接使用`、`后续处理`、`遗弃`、`待定`。
- 页面支持按审核状态筛选，并显示全局与版本源内的分类计数。
- 分类结果默认保存在浏览器本地存储，同时支持导出和导入 JSON，便于后续接力整理。
- 该工作台现已另存为 `monster-review-workbench.html`，主入口 `monster-preview.html` 改为行为动画预览页。
