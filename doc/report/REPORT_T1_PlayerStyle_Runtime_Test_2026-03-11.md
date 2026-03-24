# REPORT_T1_PlayerStyle_Runtime_Test_2026-03-11

## 目标

- 将 `floor1` 的 `Tier1` 通用小怪切换到第二版低像素样张目录进行实机验证。
- 不覆盖现有 `assets/sprites/` 老资源。
- 保持回退成本低，只通过运行时路径映射切换。

## 本次接入范围

- `bat_v2`
- `chick_spr`
- `crab_v4`
- `fox_v1`
- `ghost_v3`
- `rabbit2_v2`
- `snail_v1`
- `snake_v4`

## 实现方式

- 修改 [src/data/enemy-types-new.js](/e:/AI/game/rougelike-cow/src/data/enemy-types-new.js)
- 在 `getSpritePaths()` 中增加 `floor === 1 && tier === 1` 的白名单 override
- 将上述怪物路径重定向到：
  `generated_assets/monster_walk_player_style_t1_v2/floor1/{baseId}/{version}/walk/f01.png`

## 风险控制

- 仅影响新怪系统 `NewEnemy`
- 仅影响 `floor1` 的 `Tier1` 白名单怪物
- 旧版 `monster_walk_preserve_features` 路径保留不动
- 若样张效果不佳，删除 override 即可回退

## 当前验证重点

- 同屏识别度是否提升
- 与玩家轮廓和体量是否更统一
- 多帧步行动画是否正常加载
- 飞行类与爬行类是否存在过小/过暗问题
