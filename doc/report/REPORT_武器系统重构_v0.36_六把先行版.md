# REPORT_武器系统重构_v0.36_六把先行版

## 完成内容
- 6 把武器（毒镖、魔杖、火球、冰锥、十字架、手里剑）按 v0.36 方案整体重做。
- 升级路线改为“形态/节奏/范围/机制”强化，避免堆数量与无限弹跳/穿透。
- 新增叠毒裂变、冻结积累、悬停召回、分拍补投、爆后残焰等机制。

## 关键机制落地
- 毒镖：叠毒上限、死亡传播（代数限制）、短命毒雾只补毒层。
- 魔杖：短散开后精准追踪，短寿命高速度。
- 火球：大体积单发爆炸 + 残焰 + 二段火环（不分裂小火球）。
- 冰锥：有限穿透 + 冻结积累 + 冻结死亡霜爆。
- 十字架：投出 → 停场切割 → 召回二段伤害。
- 手里剑：主波扇形 + 分拍补投 + 命中残影切线。

## 影响文件
- `src/systems/passives/WeaponAndPassiveManager.js`
- `src/systems/weaponUpgrade.js`
- `src/systems/weapons/Weapon.js`
- `index.html`
- `src/systems/enemies/NewEnemy.js`

## 约束确认
- 未修改 `Room.js` / `HiddenRoomSystem.js`。

## 测试
- 未运行自动化测试（未提供测试指令）。
