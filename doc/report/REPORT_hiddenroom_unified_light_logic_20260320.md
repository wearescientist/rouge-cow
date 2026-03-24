# REPORT 隐藏房统一光源逻辑修复 2026-03-20

## 范围
- 统一隐藏房实体光源判定入口，覆盖 1 层模板蘑菇/蜡烛、3 层顺序蘑菇、4 层记忆蘑菇、5 层封印点/石像、6 层提灯与桌面遗物。
- 修复 `HiddenRoomSystem.js` 本体绘制与 `Room.js` 后处理光场的状态分叉，避免同一物件出现“本体不亮、旁边有小光点”或“关掉后仍残光”的表现。
- 清理临时 Playwright/静态服务验证产物，按用户要求停止主菜单与实机路径测试。

## 关键修复
- 新增 `Room.createHiddenFeatureLight()` 及一组 `getHidden*LightState()`，把隐藏房的后处理光源统一收口到 `Room.getPresentationLightSources()`。
- floor1 左板模板蘑菇不再依赖旧 `pushGlow` 小光点，改为通过 `hiddenTemplateCells` 生成统一蘑菇光场；右板蜡烛继续走同一入口。
- floor3 顺序蘑菇的点亮判定从错误的 `node.index < inputIndex` 改为 `sequence.slice(0, inputIndex).includes(node.index)`，并让 preview / input / hover 三种状态共用同一判定。
- floor3 场景蘑菇切换到 floor4 的蘑菇资源族，关闭态保留弱荧光本体，但不再向房间光场注入残留小灯泡。
- floor4 场景蘑菇补齐 `index / spriteKey / drawW / drawH / offsetY / glowColor` 元数据，保证提示图、实体绘制、房间光场使用同一套配置。
- floor5 运行时 blocker 恢复为 `dec_statue`；石像被推到正确封印点后，同时更新实体位置、`sealed` 状态和房间发光。
- floor5 封印点、石像本体与 floor6 提灯/书/面包/钱袋统一接入隐藏房后处理光场，不再各自走零散的手写 light blob。

## 风险控制
- 未改动隐藏房谜题完成条件、通关结构和存档字段语义，仅收口光源状态与表现层。
- 未继续进行浏览器/主菜单实机验证；本次仅完成代码逻辑核对、临时验证脚本清理与 `node --check` 语法检查。
- `HiddenRoomSystem.js` 内仍存在历史重复函数块，但本次修改已落在运行时生效的后置定义上，避免修到失效分支。

## 后续回归重点
- 1 层：左板模板蘑菇亮度是否已经足够接近 4 层提示展示，右板蜡烛与模板图案是否仍一一对应。
- 3 层：输入阶段、预览阶段、错误重置阶段的蘑菇本体与房间光场是否完全同步。
- 4 层：不同蘑菇变体在场景内的亮度、尺寸、脉冲节奏是否和提示 overlay 一致。
- 5 层：石像被推到封印点后的实体位置、地面封印圈和房间荧光是否同时到位。
