# REPORT_Runtime_Inventory_2026-03-09

## 本轮完成
- 新增统一版本源 `AppVersion`
- 新增运行期开关 `RuntimeFlags`
- 新增资源目录 `AssetCatalog`
- 新增现役链路清单 `RuntimeManifest`
- 新增全局服务注册表 `GameServices`
- 新增运行期控制台诊断 `RuntimeDiagnostics`
- `index.html` 接入统一开关与服务注册
- `save_manager.js` 改为读取统一存档版本，并在读档/迁移后补齐默认字段
- 新增 `scripts/verify-runtime-syntax.js` 用于检查 `index.html` 的内联脚本是否有语法问题

## 当前判断
### 现役主链
- 启动入口仍为 `index.html`
- `window.onload -> new Game() -> game.start()` 仍为唯一主链
- `src/main.js` 目前更像历史阶段产物，不是当前页面的真实启动入口

### 重复/并存实现
- `src/systems/Room.js` 与 `src/systems/rooms/Room.js`
- `src/systems/collision.js` 与 `src/systems/CollisionSystem.js`
- `src/debug/DebugPanel.js` 与 `src/systems/DebugPanel.js`
- `AudioSystem / AudioController` 为并存协作，不建议误判为互斥替换关系

## 风险控制
- 本轮没有删除旧文件
- 本轮没有重排脚本顺序
- 本轮没有直接拆分主 `Game` 类
- 本轮没有强制切换新敌人系统

## 下一轮建议
1. 梳理 `Room` 现役职责边界
2. 把 `Weapon` 的数值、发射、特效逻辑继续拆层
3. 继续把常见 `window.xxx` 访问收拢到 `GameServices`


## 2026-03-09 结构收口追加

- 已将 `Room` 的生命周期/刷怪逻辑与绘制逻辑拆到 `src/systems/rooms/RoomLifecycle.js` 与 `src/systems/rooms/RoomRendering.js`。
- 已将 `Weapon` 的发射/投射物逻辑拆到 `src/systems/weapons/WeaponFiring.js`。
- 已将 `Enemy` 的 Boss 行为与表现/碰撞逻辑拆到 `src/systems/enemies/EnemyBossBehavior.js` 与 `src/systems/enemies/EnemyPresentation.js`。
- `src/systems/rooms/Room.js` 已改为兼容入口，避免双份 `Room` 实现继续漂移。
- 新增 `scripts/verify-runtime-structure.js`，用于校验拆分后的运行时结构是否齐全。
