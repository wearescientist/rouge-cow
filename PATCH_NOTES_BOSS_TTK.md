Boss TTK Pass

目标：
- 常规构筑 Boss 战平均至少 30 秒
- 解决 Boss 被高爆发/多段命中瞬秒的问题

本次改动：
1. 重做 Boss HP 曲线
   floor1-7: 7600 / 12800 / 20800 / 32400 / 47600 / 67600 / 94000

2. 重做 Boss 护甲曲线
   floor1-7: 0.08 / 0.11 / 0.14 / 0.17 / 0.21 / 0.25 / 0.29

3. 新增 Boss 抗爆发限流
   - 单次命中上限按 Boss 最大生命百分比限制
   - 每秒可承受伤害有楼层上限
   - 低血阶段略微放宽，避免最后残血拖太久

4. 保留之前已接入的 Boss 技能压力强化
   - 弹幕、追踪弹、召唤、冲锋仍按楼层强化

实际修改文件：
- src/data/enemy-types-new.js
- src/systems/enemies/NewEnemy.js
- src/config/AppVersion.js
