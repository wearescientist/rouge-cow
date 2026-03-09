## 2026-03-07 03:00 - Bug Fixes

### 问题修复

**1. restrictEnemyMovement 报错** ✅
- 原因: 新 CollisionSystem 缺少该方法
- 修复: 添加 `restrictEnemyMovement()` 方法到 CollisionSystem.js

**2. 玩家贴图渲染不完整** ✅  
- 原因: 新渲染代码使用 `-drawH` 直接偏移，未考虑 anchor
- 修复: 参考备份代码，使用 `anchor.feet` 计算偏移:
```javascript
const anchor = playerSpriteData.anchor.feet;
const drawX = -drawW * (anchor.x / playerSpriteData.canvasWidth);
const drawY = -drawH * (anchor.y / playerSpriteData.canvasHeight);
```

**3. 敌人渲染简化**
- 移除复杂的 9 参数 drawImage 裁剪
- 参考备份代码直接绘制: `ctx.drawImage(sprite, -drawWidth, -drawHeight * 2, ...)`

## 2026-03-07 02:45 - Sprite System v2.0 Complete

### 5轮迭代自主完成

[... 之前的内容 ...]

## 2026-03-08 02:25
- 抽离主菜单控制到 `src/ui/MenuController.js`，接管菜单按钮绑定、继续游戏状态、菜单背景与装饰动画
- 抽离设置弹窗控制到 `src/ui/SettingsController.js`，并新增主音量、自动暂停、屏幕震动、伤害数字等设置项
- 新增 `src/ui/MenuOverlayController.js`，替代浏览器 `confirm/window.close`，统一处理菜单确认框与 toast 提示
- 新增 `src/systems/SaveStateAdapter.js`，统一 `rougecow_save` 存档读写并兼容旧 `rogueCow_save` 键名
- 新增 `src/ui/GameSettingsStore.js`，统一运行时设置持久化并同步到主题、音频、震动、伤害数字
- 新增 `src/ui/LoadingController.js` 与 `src/ui/ScreenFlowController.js`，开始拆分加载页和首屏界面显隐逻辑

## 2026-03-08 03:05
- 新增 `src/ui/SeamlessPrologueController.js`，接入四张 story 分镜、气泡对白、跳过、过桥文案
- 主菜单按钮文案改为“开始新游戏”，点击后不再直接进 loading，而是先播放无缝开场
- `MenuController` 新增菜单文字层渐隐能力，保留主菜单背景实现“无缝开场”
- 开场结束后通过 `ScreenFlowController` 进入武器选择，不把剧情实现回填到 `index.html`

## 2026-03-08 03:35
- 无缝开场改为“主菜单背景首幕 + `start2/start3/start4` 分镜”结构，新增黑场淡入淡出过渡
- 开场对白重写为当前剧本版本，并将悬浮气泡改为底部字幕卡以避免构图错位
- 字幕改为慢速逐字机效果，并补上像素风说话音的音频解锁与更清晰的发声包络
- 点击“开始新游戏”时立即拉起 `menu` BGM，让开场动画不再静音
