# REPORT_MonsterSpriteCutting

## 输出位置
- `generated_assets/monster_preview/frames/game_fit/<sourceKey>/<monster>/`
- `generated_assets/monster_preview/metadata/catalog.json`
- `generated_assets/monster_preview/metadata/preview-data.js`
- `generated_assets/monster_preview/reports/selection-summary.json`
- `monster-preview.html`
- `generated_assets/monster_review_export/<category>/<monster>/<version>/f01.png`
- `generated_assets/monster_review_export/manifest.json`
- `generated_assets/monster_behavior_preview/assets/<category>/<monster>/<version>/<behavior>/f01.png`
- `generated_assets/monster_behavior_preview/metadata/behavior-catalog.json`
- `generated_assets/monster_behavior_preview/metadata/behavior-data.js`
- `generated_assets/monster_behavior_preview/reports/behavior-summary.json`
- `monster-behavior-editor.html`

## 当前切割策略
- 顶层 png：优先读取 alpha 通道，基于透明区域连通块识别真实帧块。
- 识别到的主要帧块会按行列聚类排序，允许 `3x3`、`3x4`、`3/3/3/2` 等不规则排布。
- 每个帧块直接从原图裁出，不再先做平均分格。
- 保存前再次按 alpha 做单帧精裁，再贴到统一画布上做网页播放。
- 仅在透明信息不足时，才回退到旧的视觉差分检测。

## 当前结果规模
- 总条目：150
- 总导出帧：1312
- 当前版本源：11 组

## 人工分类导出
- 基于网页导出的分类 JSON，可将 `ready`、`needs_work`、`pending` 三类重新整理成成品目录。
- 导出脚本：`tools/export_monster_review_sets.ps1`
- 当前一次导出结果：118 个版本条目、1027 张帧图。
- 目录结构固定为：`大类 / 怪物名 / 版本短名 / f01.png...`
- 版本短名示例：`v2`、`v9`、`spr`

## 行为动画重组
- 行为重组脚本：`tools/generate_monster_behavior_preview.ps1`
- 处理范围：仅 `ready` 和 `needs_work` 两类。
- 当前结果：94 个版本条目、210 组行为动画、1684 张导出帧。
- 默认每个版本至少导出 `idle` 和 `walk`，检测到明显后段动作增强时再拆出 `attack`。
- `walk` 会重新做平滑排序并用 ping-pong 循环减小回跳，`attack` 会按强度递进重组后再回摆，`idle` 使用最稳定帧慢速播放。
- 所有行为帧都会再次按 alpha 精裁，并按主体中心重新对齐，进一步清理主体外多余透明像素。
- `monster-preview.html` 已切换为行为浏览页；旧分类工作台保留为 `monster-review-workbench.html`。

## 行为编辑工作台
- `monster-behavior-editor.html` 提供逐帧人工修整界面，可展开全部帧并直接预览当前行为。
- 支持对单帧做左移、右移、删除/恢复、水平翻转；修改结果会自动写入浏览器本地存储。
- 支持导出行为编辑 JSON，也支持导入先前导出的 JSON 继续编辑。
- 编辑页按 `category / version / behavior / change state` 提供筛选，并统计已修改行为、已删帧数、已翻转帧数。
- 当前编辑页不会直接改写原始 png；它输出的是可回放、可持久化的编辑描述，便于后续批量落盘。

## Walk First 调整
- 当前 `monster-preview.html` 已切到 `walk only` 预览，默认只展示 `ready / needs_work` 内的 Walk 动画。
- 项目级编辑覆盖文件位于 `generated_assets/monster_behavior_preview/metadata/behavior-edits.json` 与 `behavior-edits.js`。
- 编辑页现在会在展开时同时显示“当前 Walk 序列”和“该版本全部源帧”，支持把任意源帧追加到 Walk 或插入到开头。
- 新增 `tools/sync_monster_behavior_editor_data.ps1`，用于同步 `behavior-editor-data.js` 并把外部编辑 JSON 导入成项目内覆盖层。

## 已知边界
- 这批素材虽然带透明底，但个别版本会混入零散特效碎块或角落噪点。
- 当前逻辑已经把主要误切来源从“平均分格”改成“真实帧块识别”，但极少数复杂版本仍可能需要手工覆写。
- 当前网页预览已经可用；若后续要正式接入游戏，建议再对最终入选版本做一次人工定稿。
