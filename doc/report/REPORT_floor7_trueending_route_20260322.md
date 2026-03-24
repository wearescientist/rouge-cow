# REPORT_7层真结局路线接入_20260322

## 目标
- 先把 7 层真结局层的最小可玩闭环接通
- 让玩家在满足真结局条件时，6 层 boss 后可以继续下到 7 层
- 接入 7 Boss 资源，并补上“吸收房间中间图腾 -> 变身二阶段”的运行时链路

## 本次实现

### 1. 6 层后双出口
- `index.html` 新增 `ending_gate` 道具类型
- 6 层 boss 清后固定生成 `大结局入口`
- 若隐藏房真结局条件已满足，则额外生成 `下行阶梯`
- 不再依赖 `maxFloors` 粗暴判断，避免 6 层入口被 7 层上限覆盖

### 2. 7 层固定地图
- `src/systems/MapGenerator.js` 对 `floor=7` 特判
- 地图固定为三连房：
  - `0,0` 初始房
  - `0,-1` 觉醒房
  - `0,-2` boss房
- 觉醒房强制清空刷怪逻辑，作为过场承接房

### 3. 7 层视觉资源
- `src/systems/Room.js` 接入：
  - `tiles/floors/layer7_floor_final.png`
  - `rooms/shells/floor7_shell_greenhouse_far7.png`
  - `rooms/shells/floor7_shell_greenhouse_mid7.png`
  - `rooms/shells/floor7_shell_greenhouse_primary7.png`
- floor7 boss 房新增中央图腾绘制与吸收中光束表现

### 4. 7 Boss 运行时
- `floor-data.js` 新增 floor7 boss 数据 `盲眼师傅`
- `src/data/enemy-types-new.js` 扩到 7 层，并补 floor7 boss tuning
- `src/data/boss-animation-config.js` 新增 floor7：
  - `move`
  - `skill`
  - `transform`
  - `phase2Move`
  - `phase2Skill`
- `src/systems/enemies/NewEnemy.js` 的 `NewBoss` 新增 floor7 状态机：
  - 一阶段低血触发
  - 拉向房间中央图腾
  - 变身期间无敌
  - 变身完成后切换二阶段贴图、体型和数值

### 5. UI/预载补齐
- `index.html` 与 `OverlayCanvasRenderer.js` 的楼层显示改到 7 层
- `index.html` 与 `src/bootstrap/RuntimeSpriteLoader.js` 补了 `layer7_floor_final` 预载

## 关键设计决策
- 真结局准入不另起新存档字段，直接复用隐藏房系统里的 `hiddenRooms.trueEndingUnlocked`
- 7 层中间房先做“无怪承接房”，不在这一轮强塞完整剧情交互，避免把下楼与 boss 闭环拖挂
- 7 Boss 直接扩展现有 `NewBoss`，不新开一套 boss 基类，降低回归面

## 验证
- 已通过 `node --check`
  - `src/systems/MapGenerator.js`
  - `src/systems/Room.js`
  - `src/systems/enemies/NewEnemy.js`
  - `src/data/boss-animation-config.js`
  - `src/data/enemy-types-new.js`
  - `floor-data.js`
  - `src/ui/OverlayCanvasRenderer.js`
  - `src/bootstrap/RuntimeSpriteLoader.js`

## 当前残留风险
- 未做浏览器实机验收，`index.html` 的 6 层双入口与 7 层切层体验仍需手测
- 7 Boss 二阶段的技能节奏仍沿用旧 Boss AI，只是换了资源和状态机，后续应再单独精调
- 觉醒房目前只完成结构承接，完整觉醒叙事、演出字幕与房间交互可后续继续补
