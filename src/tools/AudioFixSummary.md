# 音效修复总结

## 修复的问题

### 1. 武器音效全都变成鞭子 ❌ -> ✅
**问题**：所有武器攻击调用 `play('shoot')`，而它固定映射到 `playWeapon('whip')`

**修复**：在 `updateWeapons()` 中改为根据武器类型直接调用 `playWeapon(weaponType)`

**映射关系**：
- whip -> whip
- scythe -> scythe
- knife -> knife
- axe -> axe
- cross -> cross
- wand -> wand
- fireball -> fireball
- shuriken -> shuriken
- icicle -> icicle
- poison_dart -> dart
- lightning -> lightning
- laser_sword -> laser
- chakram -> axe（借用）
- holy_water -> wand（借用）
- la_borra -> wand（借用）
- bible -> null（无音效）
- unholy_vespers -> null（无音效）
- radiance -> null（无音效）
- solar_radiance -> null（无音效）

### 2. 命中/击杀音效全都变成 flesh ❌ -> ✅
**问题**：`applyDamage()` 中调用 `play('hit')` 和 `play('kill')`，固定映射到 flesh 材质

**修复**：改为直接调用 `playHit(material, isCrit)`，根据敌人类型选择材质：
- chick, pigeon, duck3, bat, bee, goose, tiezhua -> bird（鸟类）
- mouse, rabbit2, panther, bear, fox, tiaotiao, yinya, wolf_king -> fur（毛皮）
- snail, crab, nibei, turtle -> shell（硬壳）
- snake, ghost, mother -> slime（史莱姆）
- mimic -> bone（骨骼）
- 默认 -> flesh（肉体）

### 3. Boss 攻击音效 ❌ -> ✅
**问题**：Boss 的 bullet_hell 和 homing 攻击也调用 `play('shoot')`，变成鞭子音效

**修复**：改为 `playWeapon('lightning')`，使用闪电音效

## 现在的音效对应关系

| 场景 | 调用方法 | 音效 |
|------|---------|------|
| 武器攻击 | playWeapon(type) | 根据武器类型 |
| 命中敌人 | playHit(material, false) | 根据敌人材质（轻击） |
| 击杀敌人 | playHit(material, true) | 根据敌人材质（重击） |
| 暴击 | playCrit() | flesh 重击 |
| 玩家受伤 | playHurt() | flesh 轻击 |
| Boss攻击 | playWeapon('lightning') | 闪电音效 |

## 建议的后续优化

1. ** footsteps 音效**：目前未实装，可以根据玩家移动播放不同地面的脚步声
2. **UI 音效**：已经实装，包括点击、升级、金币等
3. **BGM**：已经根据房间类型切换（menu/normal/elite/boss/victory）
