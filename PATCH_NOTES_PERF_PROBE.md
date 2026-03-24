# Performance Probe Pass

## 基线
- 以 `rougelike-cow_hiddenroom_logic_hotfix_full.zip` 为基线
- 不包含 stage3 的视觉/blur/glow 大改

## 新增
- DEV 工具链加入 `PerformanceProfiler.js`
- F9 测试面板新增“帧耗分析器”区块
- 可查看：采样帧数、平均帧、P95、最差帧、Top 热点段
- 可切换采样、重置、导出 JSON

## 当前会统计的段
- frame.total
- game.update / game.draw
- room.update / room.draw
- horde.update
- particles.update / particles.draw
- damageNumbers.update / damageNumbers.draw
- blood.update / blood.draw
- weaponFx.update / weaponFx.draw
- hd2d.update / hd2d.post
- roomBlur.render
- hud.draw
- perfOverlay.update / perfOverlay.draw
- hud.score

## 说明
- 父段和子段会重叠，不要直接相加
- 这版的目标是先定位瓶颈，不先改视觉链
