/**
 * 现役运行链清单
 * 作为“当前主链正在使用什么”的单一索引，方便后续梳理重复系统
 */
(function attachRuntimeManifest(global) {
    'use strict';

    const RuntimeManifest = Object.freeze({
        version: global.AppVersion?.number || '0.33.x',
        bootstrap: Object.freeze({
            entry: 'index.html',
            bootMode: 'window.onload -> new Game() -> game.start()'
        }),
        activeCore: Object.freeze([
            'index.html::Game',
            'src/systems/Room.js',
            'src/systems/rooms/RoomLifecycle.js',
            'src/systems/rooms/RoomRendering.js',
            'src/systems/CollisionSystem.js',
            'src/systems/AudioSystem.js',
            'src/systems/AudioController.js',
            'src/systems/SoundEffectSystem.js',
            'src/ui/ScreenFlowController.js',
            'src/ui/MenuController.js',
            'src/ui/SettingsController.js',
            'src/systems/SpriteDataRegistry.js'
        ]),
        extensionModules: Object.freeze([
            ['src/systems/Room.js', 'src/systems/rooms/RoomLifecycle.js'],
            ['src/systems/Room.js', 'src/systems/rooms/RoomRendering.js'],
            ['src/systems/weapons/Weapon.js', 'src/systems/weapons/WeaponFiring.js'],
            ['src/systems/enemies/Enemy.js', 'src/systems/enemies/EnemyBossBehavior.js'],
            ['src/systems/enemies/Enemy.js', 'src/systems/enemies/EnemyPresentation.js']
        ]),
        duplicateCandidates: Object.freeze([
            ['src/systems/Room.js', 'src/systems/rooms/Room.js'],
            ['src/systems/collision.js', 'src/systems/CollisionSystem.js'],
            ['src/debug/DebugPanel.js', 'src/systems/DebugPanel.js'],
            ['src/systems/AudioSystem.js', 'src/systems/AudioController.js']
        ])
    });

    global.RuntimeManifest = RuntimeManifest;
})(window);
