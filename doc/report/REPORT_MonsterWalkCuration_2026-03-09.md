# REPORT_MonsterWalkCuration_2026-03-09

## 目标
- 将怪物 `walk` 帧整理为最终可用版本。
- 已经是 2 到 4 帧且连续性可接受的版本，直接保留。
- 超过 4 帧的版本逐个写死保留帧，不再使用统一节奏抽样。

## 最终输出
- 最终目录：`generated_assets/monster_walk_curated/<category>/<monster>/<version>/walk/f01.png`
- 页面 metadata：`generated_assets/monster_behavior_preview/metadata/behavior-editor-data.{json,js}`
- 页面 edits：`generated_assets/monster_behavior_preview/metadata/behavior-edits.{json,js}`
- 复核摘要：`reports/walk_review/walk_curation_summary.json`

## 本次筛选口径
- 只保留 `walk`。
- 保留当前人工排序结果中的连续姿态，不打乱原有顺序。
- 对超过 4 帧的版本，逐版本写死保留列表。
- 明显偏离 `walk` 的特效帧、碎裂帧、收束帧不保留。
- 页面源帧池也同步切到最终保留帧，避免再引用旧大目录。

## 结果概况
- 最终版本数：94
- 最终总帧数：340
- 单版本帧数范围：2 到 4
- 超过 4 帧后被压缩的版本数：47

## 特殊人工处理
- `goose v6`：保留前四帧，去掉后段偏离步行动作的帧。
- `snail v10`：保留主体完整的前四帧，去掉后段碎散效果帧。
- `mimic v5`：改为保留更能体现开合变化的四帧，不按等距抽取。
- `wolf_king v2`、`tiaotiao v2/v6/v8`：按姿态成对保留，避免压缩后左右脚相位断裂。
- `crab v2`、`snake v7`：保留跨度更大的四个关键姿态，避免高重复帧占位。

## 清理结果
- `generated_assets` 现只保留：
  - `monster_walk_curated`
  - `monster_behavior_preview/metadata`
- 旧的 `monster_review_export`、`monster_preview`、`sprites`、旧行为帧目录已清理。

## 验证
- 已校验 metadata 中全部引用文件存在。
- 当前无缺失引用。
- `behavior-editor-data` 与 `behavior-edits` 都只指向精简后的最终 `walk` 帧。
