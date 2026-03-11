/**
 * 运行期开关统一入口
 * 先集中最容易散落的布尔开关，避免到处硬编码
 */
(function attachRuntimeFlags(global) {
    'use strict';

    const search = new URLSearchParams(global.location.search);

    const RuntimeFlags = Object.freeze({
        useNewEnemySystem: search.get('enemySystem') === 'new',
        diagnostics: search.get('diag') === '1' || search.get('debug') === '1',
        logServiceRegistration: search.get('services') === '1'
    });

    global.RuntimeFlags = RuntimeFlags;
})(window);
