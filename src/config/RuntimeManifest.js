/**
 * 现役运行链清单
 * 作为“当前主链正在使用什么”的单一索引，方便后续梳理重复系统
 */
(function attachRuntimeManifest(global) {
    'use strict';

    const RuntimeManifest = Object.freeze({
        version: global.AppVersion?.number || '0.35.x',
        bootstrap: Object.freeze({
            entry: 'index.html',
            bootMode: 'window.onload -> new Game() -> game.start()',
            assetPolicy: 'strict-local assets/runtime only; legacy remote fallback disabled'
        }),
        activeCore: Object.freeze([
            'index.html::Game',
            'src/data/enemy-types-new.js',
            'src/data/StoryDialogueData.js',
            'src/systems/enemies/NewEnemy.js',
            'src/systems/Room.js',
            'src/systems/rooms/RoomLifecycle.js',
            'src/systems/rooms/RoomRendering.js',
            'src/systems/CollisionSystem.js',
            'src/systems/AudioSystem.js',
            'src/systems/AudioController.js',
            'src/systems/SoundEffectSystem.js',
            'src/config/RuntimeAssetManifest.js',
            'src/bootstrap/RuntimeAssetBase.js',
            'src/bootstrap/RuntimeSpriteLoader.js',
            'src/config/RuntimeDependencyGuard.js',
            'src/systems/GameFlowCoordinator.js',
            'src/systems/HiddenRoomProgress.js',
            'src/data/meta/metaSchemas.js',
            'src/data/meta/metaAchievements.js',
            'src/data/meta/metaUnlocks.js',
            'src/data/meta/metaTalents.js',
            'src/systems/meta/MetaProgressMigration.js',
            'src/systems/meta/MetaProgressStore.js',
            'src/systems/meta/RunProgressTracker.js',
            'src/systems/meta/AchievementRuntime.js',
            'src/systems/meta/UnlockRuntime.js',
            'src/systems/meta/MetaProgressController.js',
            'src/systems/meta/MetaGameBridge.js',
            'src/systems/meta/MetaAchievementTestSuite.js',
            'src/systems/storyEvents.js',
            'src/systems/trueEnding.js',
            'src/systems/SaveStateAdapter.js',
            'src/systems/AutoPlayHarness.js',
            'src/systems/AutoPlayDirector.js',
            'src/ui/ScreenFlowController.js',
            'src/ui/MenuController.js',
            'src/ui/SettingsController.js',
            'src/ui/MetaToastController.js',
            'src/ui/AchievementArchivePresenter.js',
            'src/ui/InheritancePanel.js',
            'src/ui/CodexExperiencePatch.js',
            'src/systems/SpriteDataRegistry.js'
        ]),
        extensionModules: Object.freeze([
            ['src/systems/Room.js', 'src/systems/rooms/RoomLifecycle.js'],
            ['src/systems/Room.js', 'src/systems/rooms/RoomRendering.js'],
            ['src/systems/weapons/Weapon.js', 'src/systems/weapons/WeaponFiring.js']
        ]),
        legacyBridges: Object.freeze([
            ['src/systems/trueEnding.js', '当前仍挂全局 trueEndingSystem，但真路线主判定已切到 hiddenRooms.trueEndingUnlocked'],
            ['src/systems/storyEvents.js', '当前仅保留对话框/序列播放桥接，不再承载正式剧情数据'],
            ['src/systems/SaveStateAdapter.js', '当前正式存档入口，后续若切换需保留兼容迁移职责']
        ]),
        inactiveEntrypoints: Object.freeze([
            ['archive/legacy_systems/2026-03-26/src/main.js', '历史模块化入口，已迁档'],
            ['archive/legacy_systems/2026-03-26/src/core/ModuleLoader.js', '配套历史入口的旧加载器，已迁档']
        ]),
        archiveRoots: Object.freeze([
            'src/_archive/',
            'archive/',
            'package/minimal-game/',
            'archive/repo_cleanup_2026-03-26/'
        ]),
        duplicateCandidates: Object.freeze([
            ['src/systems/Room.js', 'archive/legacy_systems/2026-03-26/src/systems/rooms/Room.js'],
            ['src/systems/enemies/NewEnemy.js', 'archive/legacy_systems/2026-03-26/src/systems/enemies/Enemy.js'],
            ['src/systems/collision.js', 'src/systems/CollisionSystem.js'],
            ['src/debug/DebugPanel.js', 'src/systems/DebugPanel.js'],
            ['archive/legacy_systems/2026-03-26/src/systems/save_manager.js', 'src/systems/SaveStateAdapter.js'],
            ['src/systems/storyEvents.js', 'src/data/StoryDialogueData.js'],
            ['archive/legacy_systems/2026-03-26/src/systems/audio.js', 'src/systems/AudioSystem.js'],
            ['archive/legacy_systems/2026-03-26/src/systems/audio_enhanced.js', 'src/systems/AudioSystem.js'],
            ['archive/legacy_systems/2026-03-26/src/systems/AudioRuntimeBridge.js', 'src/systems/AudioSystem.js'],
            ['src/systems/AudioSystem.js', 'src/systems/AudioController.js']
        ])
    });

    global.RuntimeManifest = RuntimeManifest;
})(window);
