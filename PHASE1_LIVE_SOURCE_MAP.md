# Phase 1 Live Source Map

这份表只标 **当前 index.html 直接加载、或 DEV 模式按需加载** 的主链文件。后续改代码先看这份，不要再改到历史残留。

## Runtime 主链

### 武器 / 被动 / 超武
- `src/systems/weapons/Weapon.js`
- `src/systems/passives/WeaponAndPassiveManager.js`
- `src/systems/weaponSystem.js`
- `src/systems/weaponUpgrade.js`
- `src/data/weapon_visual_data.js`

### 敌人 / Boss / 刷怪
- `floor-data.js`
- `src/data/enemy-types-new.js`
- `src/systems/enemies/NewEnemy.js`
- `src/systems/HordeManager.js`
- `src/systems/MapGenerator.js`

### 道具 / 宠物 / 协同
- `data/items/index.js`
- `data/pets/index.js`
- `src/systems/items/ItemManager.js`
- `src/systems/PetManager.js`
- `src/systems/SynergyManager.js`
- `src/systems/TotemManager.js`

### 房间 / 隐藏房 / 叙事
- `src/systems/Room.js`
- `src/systems/HiddenRoomSystem.js`
- `src/data/HiddenRoomNarrativeData.js`
- `src/systems/ShopNPCDialogue.js`
- `src/systems/storyEvents.js`
- `src/systems/trueEnding.js`

### UI / HUD / 收藏 / 菜单
- `src/ui/SidebarHudPresenter.js`
- `src/ui/CollectionCodexSystem.js`
- `src/ui/OverlayCanvasRenderer.js`
- `src/ui/MenuController.js`
- `src/ui/MenuOverlayController.js`
- `src/ui/SettingsController.js`
- `src/ui/LoadingController.js`
- `src/ui/ScreenFlowController.js`
- `src/ui/GameSettingsStore.js`

### 渲染 / HD2D / 光照
- `src/render/HD2DRenderer.js`
- `src/render/HD2DEffects.js`
- `src/render/WeaponVisuals.js`
- `src/render/systems/RoomBlurSystem.js`
- `src/render/systems/AmbienceSystem.js`
- `src/render/systems/TiltShiftSystem.js`
- `src/render/systems/GroundGlowSystem.js`
- `src/render/systems/BacklightSystem.js`
- `src/render/systems/ShadowSystem.js`
- `src/render/systems/ColorGradingSystem.js`
- `src/render/systems/CaveLightingSystem.js`
- `src/render/lighting/SimpleLighting.js`

### 存档 / 计分 / 音频 / 基础运行
- `src/systems/SaveStateAdapter.js`
- `src/systems/ScoreManager.js`
- `src/systems/AudioSystem.js`
- `src/systems/AudioController.js`
- `src/systems/SoundEffectSystem.js`
- `src/systems/CollisionSystem.js`
- `src/systems/GameRenderer.js`
- `src/systems/GameUtils.js`
- `src/systems/SpriteDataRegistry.js`
- `src/utils/SpriteData.js`

## DEV 模式按需加载
- `src/systems/DebugPanel.js`
- `src/systems/WeaponBalanceTester.js`

## 当前不要动的历史残留（交给归档脚本）
详见：
- `archive_stage1_manifest.json`
- `ARCHIVE_STAGE1_CANDIDATES.txt`
- `archive_stage1_legacy.py`

## Phase 1 已做的事
- F9 变成轻量 DEV 入口壳
- DEV 模式改成真正的开 / 关（切换后刷新）
- `DebugPanel` 与 `WeaponBalanceTester` 改为懒加载 / 按需实例化
- 给出旧文件归档脚本与候选清单
