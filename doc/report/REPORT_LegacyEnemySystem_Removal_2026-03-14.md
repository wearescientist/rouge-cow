# 旧敌人系统清理报告

## 日期
- 2026-03-14

## 本次目标
- 备份旧敌人系统两个核心文件
- 删除旧敌人系统运行链与设置切换
- 保留并补齐新敌人系统继续需要的运行时能力

## 备份结果
- 备份目录：`backup/legacy_enemy_system_20260314_160420`
- 已备份：
  - `src/systems/enemies/Enemy.js`
  - `data/enemies/index.js`

## 运行时收口
- `index.html` 只保留 `NewEnemy/NewBoss` 工厂，不再存在新旧系统切换
- `src/data/enemy-types-new.js` 新增按楼层/tier取怪、随机新怪、Boss 运行时配置 helper
- `src/systems/enemies/NewEnemy.js` 直接承接 Boss 名称与实战数值
- `src/systems/Room.js` / `src/systems/rooms/RoomLifecycle.js` 的隐藏房、Boss 房、后备刷怪全部改为新怪链路
- 设置页与存档层移除 `useNewEnemySystem`

## 删除文件
- `data/enemies/index.js`
- `data/enemies/bosses.js`
- `src/systems/enemies/Enemy.js`
- `src/systems/enemies/EnemyBossBehavior.js`
- `src/systems/enemies/EnemyPresentation.js`
- `src/ai/BehaviorTree.js`
- `src/ai/EnemyAI.js`
- `src/enemy_system.js`

## Shadow Review
- 避免 Boss 房继续依赖被删除的 `BOSS_TYPES`
- 避免隐藏房/后备刷怪回退到旧怪物 key
- 避免设置页残留切换项导致存档结构继续写入旧字段
- 保留旧 Boss 实战数值为新系统内置调参，避免删除旧表后 Boss 强度断崖下降
