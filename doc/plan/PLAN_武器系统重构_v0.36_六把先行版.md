# PLAN_武器系统重构_v0.36_六把先行版

## 目标
- 按《武器系统重构设计文档 v0.36》一次性重做 6 把武器：毒镖、魔杖、火球、冰锥、十字架、手里剑。
- 只改武器系统相关代码，禁止改 `Room.js` / `HiddenRoomSystem.js`。

## 范围
- 基础武器参数、升级路线、超武定义与进化说明。
- 投射物行为与命中逻辑（散射→追踪、停场召回、分拍补投、爆炸/残焰、冻结积累、叠毒裂变）。
- 敌人中毒/冻结状态字段与结算（仅新增必要字段）。

## 主要改动点
- `src/systems/passives/WeaponAndPassiveManager.js`：6 把武器与超武配置。
- `src/systems/weaponUpgrade.js`：6 把升级表重写。
- `src/systems/weapons/Weapon.js`：新投射物子类型与参数注入。
- `index.html`：投射物更新逻辑与二段效果、扩散与霜爆处理。
- `src/systems/enemies/NewEnemy.js`：毒/冻状态结算与传播。

## 风险控制
- 限制投射物数量与寿命，避免性能回退。
- 叠毒传播加入代数与目标数上限，防止无限裂变。
- 冻结积累与霜爆仅在有限半径内触发。
