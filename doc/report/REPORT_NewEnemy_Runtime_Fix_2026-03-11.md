# 新敌人系统运行时修复报告

## 日期
- 2026-03-11

## 本次修复范围
- 统一 `ENEMY_TYPES_NEW` 运行时伤害字段为 `dmg`
- 新怪运行时 key 统一为 `{id}_t{tier}_f{floor}`
- `NewBoss` 改为直接从 `floor-data.js` 读取当前楼层 `tier >= 4` 配置
- 接入怪物翻转/颠簸视觉配置
- 统一新敌人系统默认开关为设置存储优先，默认启用
- 修复 `HordeManager` 旧 key 协议和字符串误用问题

## 关键问题
- 生成器输出 `damage`，运行时读取 `cfg.dmg`，导致新怪伤害可能为 `undefined`
- `NewBoss` 依赖缺失的 `BOSS_TYPES_NEW`
- `HordeManager` 使用 `@f` key，但生成器使用 `_f`
- floor6 存在重复怪物 ID，旧 key 会互相覆盖
- 页面初始值与设置默认值冲突
- 生成器未提供 `spritePaths.ready`，新怪贴图帧加载链不完整

## 修复结果
- 新怪和 Boss 基础伤害统一保守收口到 `1-2`
- Boss 技能最终承伤链也加了夹值，避免冲撞/弹幕再次放大
- floor6 的 `mother_v*` T2/T3 通过 tier+floor key 正确并存
- 贴图帧路径补齐 `ready` 字段，`NewEnemy` 可正常按多帧路径加载
- 首次进入与设置页显示保持一致，设置仍可手动切换新旧敌人系统

## Shadow Review
- 防止 `undefined` 伤害传入 `player.takeDamage`
- 防止 Boss 房读取空配置直接抛错
- 防止普通房/精英房因错误 key 返回 `undefined` 类型
- 防止 floor6 同 ID 怪物被后写覆盖
- 防止首次进入时新旧系统开关表现不一致
