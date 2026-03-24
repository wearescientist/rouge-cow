# REPORT_Boss_Animation_Integration_20260319

## 目标
- 接入 `assets/runtime/sprites/enemies/boss/1~6` 的 Boss 移动帧与技能释放帧
- 让游戏内 Boss 使用同一套显式帧序列，避免哈希文件名导致的随机顺序
- 更新 `tools/monster_animation_debug.html`，支持 Boss 帧调试与技能帧预览

## 本次变更
- 新增 `src/data/boss-animation-config.js`
- 在 `index.html` 注入 `boss-animation-config.js`，确保 `NewEnemy.js` 可读取
- 修改 `src/systems/enemies/NewEnemy.js` 的 `NewBoss`：
  - 新增 move/skill 双帧集加载
  - 新增技能动画触发锁（skill animation lock）
  - 在 charge/shockwave/bullet_hell/homing/summon 触发时播放技能帧
- 修改 `tools/monster_animation_debug.html`：
  - 新增 Boss 入口（每层一个 Boss）
  - 新增技能按钮 `btnSkill`
  - 调试页面读取同一份 `BOSS_ANIMATION_CONFIG`
  - 帧数展示升级为 `移动+技能` 格式

## 帧序说明
- 每层 Boss 按视觉连贯性手动划分 `move` 和 `skill`
- 第七层真结局 Boss 与 `trans` 变形贴图暂未接入（按需求暂缓）

## 风险与防护
- 风险：Boss 贴图缺失时可能出现空帧
- 防护：`NewBoss` 保留原有帧回退逻辑；技能帧缺失时自动回退到移动帧

## 验证
- `node --check src/data/boss-animation-config.js`
- `node --check src/systems/enemies/NewEnemy.js`
- 调试页手动验证：Boss 1~6 可在「行走/技能」状态切换并播放
