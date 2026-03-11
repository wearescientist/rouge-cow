/**
 * 统一版本入口
 * 让页面标题、存档版本和运行时展示尽量共享同一来源
 */
(function attachAppVersion(global) {
    'use strict';

    const AppVersion = Object.freeze({
        number: '0.33.1',
        codename: 'Runtime Consolidation',
        display: 'v0.33.1 Runtime Consolidation',
        saveVersion: '0.33.1',
        buildDate: '2026-03-09'
    });

    global.AppVersion = AppVersion;
})(window);
