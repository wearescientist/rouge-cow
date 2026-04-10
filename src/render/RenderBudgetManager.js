(function attachRenderBudgetManager(global) {
    'use strict';

    if (global.RenderBudgetManager) return;

    function getFrameStamp() {
        const now = (global.performance && typeof global.performance.now === 'function')
            ? global.performance.now()
            : Date.now();
        return Math.floor(now / 16.67);
    }

    function getCanvasSize(canvasOrWidth, height) {
        if (canvasOrWidth && typeof canvasOrWidth === 'object') {
            return {
                width: Number.isFinite(canvasOrWidth.width) ? canvasOrWidth.width : 960,
                height: Number.isFinite(canvasOrWidth.height) ? canvasOrWidth.height : 540
            };
        }
        return {
            width: Number.isFinite(canvasOrWidth) ? canvasOrWidth : 960,
            height: Number.isFinite(height) ? height : 540
        };
    }

    function clamp(v, min, max) {
        return Math.max(min, Math.min(max, v));
    }

    const manager = {
        _lastStamp: -1,
        _cache: new Map(),

        getBudget(game, room = null, canvasOrWidth = null, height = null) {
            const curRoom = room || game?.curRoom || null;
            const roomKey = curRoom?.id || curRoom?.type || 'default';
            const stamp = getFrameStamp();
            if (stamp !== this._lastStamp) {
                this._lastStamp = stamp;
                this._cache.clear();
            }
            if (this._cache.has(roomKey)) {
                return this._cache.get(roomKey);
            }

            const size = getCanvasSize(canvasOrWidth || game?.ctx?.canvas, height);
            const particles = game?.particles?.active?.length || 0;
            const roomEnemies = Array.isArray(curRoom?.enemies) ? curRoom.enemies.length : 0;
            const globalEnemies = Array.isArray(game?.enemies) ? game.enemies.length : 0;
            const enemies = Math.max(roomEnemies, globalEnemies);
            const bullets = (Array.isArray(game?.bullets) ? game.bullets.length : 0)
                + (Array.isArray(curRoom?.enemyBullets) ? curRoom.enemyBullets.length : 0);
            const blood = game?.bloodStains && typeof game.bloodStains.getRoomStains === 'function'
                ? game.bloodStains.getRoomStains(curRoom).length
                : 0;
            const hidden = curRoom?.type === 'hidden';
            const boss = curRoom?.type === 'boss';
            const calmRoom = curRoom?.type === 'shop' || curRoom?.type === 'treasure';
            const pixelPenalty = (size.width * size.height) / (960 * 540);
            const pressure = (particles / 220)
                + (blood / (hidden ? 76 : 56))
                + (enemies / (boss ? 14 : 18))
                + (bullets / (boss ? 30 : 42))
                + Math.max(0, pixelPenalty - 1) * 0.6
                + (hidden ? 0.15 : 0)
                + (calmRoom ? -0.2 : 0);

            let tier = 'full';
            if (pressure >= 4.4) tier = 'low';
            else if (pressure >= 3.0) tier = 'medium';

            const budget = {
                frameStamp: stamp,
                roomKey,
                pressure,
                tier,
                particleStride: tier === 'low' ? 3 : (tier === 'medium' ? 2 : 1),
                particleCullMargin: tier === 'low' ? 28 : (tier === 'medium' ? 40 : 64),
                disableMinorGlow: tier !== 'full',
                minParticleAlpha: tier === 'low' ? 0.08 : (tier === 'medium' ? 0.05 : 0.02),
                bloodStride: tier === 'low' ? 3 : (tier === 'medium' ? 2 : 1),
                bloodCullMargin: tier === 'low' ? 6 : 10,
                maxBloodStainsPerFrame: tier === 'low' ? 16 : (tier === 'medium' ? 26 : 48),
                blurProfile: calmRoom
                    ? { tier: 'calm', bloomEvery: 4, colorEvery: 3, lightBudgetScale: 0.58, bloomAlphaScale: 0.52, colorAlphaScale: 0.62, compositeThrottleMs: 140, lightCacheMs: 220, focusThreshold: 28 }
                    : (tier === 'low'
                        ? { tier: 'low', bloomEvery: hidden ? 2 : 3, colorEvery: 2, lightBudgetScale: hidden ? 0.72 : 0.55, bloomAlphaScale: 0.72, colorAlphaScale: 0.78, compositeThrottleMs: 0, lightCacheMs: 0, focusThreshold: 0 }
                        : (tier === 'medium'
                            ? { tier: 'medium', bloomEvery: 2, colorEvery: 1, lightBudgetScale: hidden ? 0.82 : 0.72, bloomAlphaScale: 0.86, colorAlphaScale: 0.9, compositeThrottleMs: 0, lightCacheMs: 0, focusThreshold: 0 }
                            : { tier: 'full', bloomEvery: 1, colorEvery: 1, lightBudgetScale: 1, bloomAlphaScale: 1, colorAlphaScale: 1, compositeThrottleMs: 0, lightCacheMs: 0, focusThreshold: 0 }))
            };

            budget.focusAvoidanceScale = clamp(1 + (pressure - 2.2) * 0.08, 1, 1.24);
            this._cache.set(roomKey, budget);
            return budget;
        }
    };

    global.RenderBudgetManager = manager;
})(window);
