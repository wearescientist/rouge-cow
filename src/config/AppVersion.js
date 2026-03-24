/**
 * 统一版本入口
 * 让页面标题、存档版本和运行时展示尽量共享同一来源
 */
(function attachAppVersion(global) {
    'use strict';

    const AppVersion = Object.freeze({
        number: '0.35.12',
        codename: 'AutoPlay Perf Harness Pass',
        display: 'v0.35.12 AutoPlay Perf Harness Pass',
        saveVersion: '0.35.12',
        buildDate: '2026-03-24'
    });

    global.AppVersion = AppVersion;
})(window);
