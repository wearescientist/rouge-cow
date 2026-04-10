/**
 * 运行期诊断
 * 不阻止启动，只在控制台输出缺失信息，方便快速回归检查
 */
(function attachRuntimeDiagnostics(global) {
    'use strict';

    function collectGameState() {
        const game = global.GameServices?.get('game') || global.game;
        return {
            hasGame: !!game,
            hasMenu: !!(game?.menuController || global.GameServices?.get('menuController')),
            hasScreenFlow: !!(game?.screenFlow || global.GameServices?.get('screenFlow')),
            hasAudio: !!(game?.audio || global.GameServices?.get('audio')),
            hasCollisionSystem: !!global.collisionSystem,
            hasSpriteRegistry: !!(global.spriteDataRegistry || global.GameServices?.get('spriteDataRegistry')),
            activeServices: global.GameServices?.snapshot?.() || []
        };
    }

    function run() {
        const snapshot = collectGameState();
        const missing = Object.entries(snapshot)
            .filter(([key, value]) => key !== 'activeServices' && value === false)
            .map(([key]) => key);

        console.groupCollapsed('[RuntimeDiagnostics] bootstrap snapshot');
        console.table(snapshot);
        if (missing.length > 0) {
            console.warn('[RuntimeDiagnostics] missing:', missing.join(', '));
        } else {
            console.info('[RuntimeDiagnostics] all critical services detected');
        }
        console.groupEnd();
        return { snapshot, missing };
    }

    global.RuntimeDiagnostics = { run };
})(window);
