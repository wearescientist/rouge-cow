# PLAN_MonsterPreviewPipeline

## 目标
- 扫描 `E:\AI\game\Kimi_Agent_多帧怪物精灵图 (1)` 全部怪物素材。
- 筛出完成度可用的怪物动画来源。
- 将筛中素材切割为统一帧序列并分类归档。
- 生成可直接打开的网页预览，展示动态多帧动画。

## 执行原则
- 原始素材目录只读，不覆盖、不回写。
- 优先使用可直接形成动画的来源：
  - `monsters_v1/<monster>/frame_*.png`
  - `monsters_sprites_v2/<monster>.png`
  - `monsters_sprites/<monster>.png`
- 切帧遵循统一裁框，保证同一怪物所有帧共享同一裁切区域。
- 分类优先按“是否适合项目现有怪物体系”划分。

## 输出结构
- `generated_assets/monster_preview/frames/game_fit/<monster>/`
- `generated_assets/monster_preview/frames/other_fit/<monster>/`
- `generated_assets/monster_preview/metadata/catalog.json`
- `generated_assets/monster_preview/metadata/preview-data.js`
- `generated_assets/monster_preview/reports/selection-summary.json`
- `monster-preview.html`

## 处理流程
1. 盘点怪物名、来源目录、帧数和可动画来源。
2. 为每个怪物选择最佳动画来源。
3. 对来源做切帧：
   - 拆帧目录直接读取。
   - 2x2 sheet 按网格切出 4 帧。
4. 基于帧内容能量估计主体区域，计算全帧联合裁框。
5. 导出统一裁切后的帧序列和元数据。
6. 生成网页预览所需数据文件。
7. 输出报告与 memory 记录。

## 风险
- 素材非透明底，精细切割属于“主体裁框标准化”，不等同于自动抠透明。
- 同名怪物多版本质量不同，本轮以可动画和完整度优先，不追求美术风格统一。
- “其他怪物”分类可能为空，因为当前 22 个怪物名均已能映射到项目怪物体系。
