/**
 * Room 兼容入口
 * 旧路径: src/systems/rooms/Room.js
 * 现已委托到 src/systems/Room.js，避免双份实现继续漂移。
 */
(function(global) {
    'use strict';

    if (global.Room) {
        if (typeof module !== 'undefined' && module.exports) {
            module.exports = { Room: global.Room };
        }
        return;
    }

    console.warn('[RogueCow] src/systems/rooms/Room.js 被单独加载，但主 Room 尚未加载。');

    if (typeof module !== 'undefined' && module.exports) {
        module.exports = {};
    }
})(typeof window !== 'undefined' ? window : globalThis);
