# REPORT_Boss_Frame_Editor_And_Cutout_20260319

## 目标
- 让 Boss 新贴图在游戏内可自动扣背景（无需手工离线抠图）
- 将 `tools/monster_animation_debug.html` 升级为可编辑帧工具（非纯展示）

## 代码变更
- `index.html`
  - 引入 `src/data/boss-animation-config.js`
- `src/systems/enemies/NewEnemy.js`
  - NewBoss 接入 move/skill 双轨帧集
  - 技能释放时切换技能帧播放并自动回退
  - 增加 Boss 贴图边缘泛洪抠底 `_cutoutBossBackground`
- `tools/monster_animation_debug.html`
  - 重构为 Boss 帧编辑器
  - 支持：导入图片、删除帧、拖拽排序、单帧鼠标位移/缩放/旋转
  - 支持：单帧/全帧扣背景
  - 支持：导出 JSON（复制与下载）

## 编辑器鼠标交互
- 左键拖动：位移
- 滚轮：等比例缩放
- 右键横向拖动：旋转

## 导出结构
```json
{
  "floor": 1,
  "move": [{ "src": "...", "x": 0, "y": 0, "scale": 1, "rot": 0 }],
  "skill": [{ "src": "...", "x": 0, "y": 0, "scale": 1, "rot": 0 }]
}
```

## 验证
- `node --check src/systems/enemies/NewEnemy.js`
- 手动打开 `tools/monster_animation_debug.html` 验证编辑流程
