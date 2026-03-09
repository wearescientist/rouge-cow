怪物贴图楼层重制 v2

内容：
1. generated_assets/monster_walk_curated_by_floor_reworked_v2
   - 按 floor1~floor6 分层的 walk 全帧重制版
   - 保留 baseId/version/walk 结构
   - 每个版本仍带 _floor_assignment.json

2. sheets_before / sheets_after
   - 每层首帧对照索引图，方便快速扫风格

3. generated_assets/metadata_monster_rework_v2.json
   - 处理参数和楼层统计

处理原则：
- floor1：轻感染、稍暖、相对柔和
- floor2：更潮湿寄生、偏霉绿腐黄
- floor3：神经污染、偏冷紫蓝
- floor4：高温熔蚀、对比更强
- floor5：母虫亲卫、偏暗红紫
- floor6：核心异化、深紫冷光

说明：
- 这版以“全帧统一 + 楼层收口”为主，不是逐张重绘
- boss 与 final_boss 在同层色调上额外加强了一点轮廓和高光
