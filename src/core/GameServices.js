/**
 * 轻量级全局服务注册表
 * 目标：减少到处直接读 window.xxx 的散乱依赖
 */
(function attachGameServices(global) {
    'use strict';

    const registry = new Map();

    function sanitizeName(name) {
        return typeof name === 'string' ? name.trim() : '';
    }

    const GameServices = {
        register(name, value) {
            const key = sanitizeName(name);
            if (!key) return value;
            registry.set(key, value);
            if (global.RuntimeFlags?.logServiceRegistration) {
                console.info(`[GameServices] register: ${key}`);
            }
            return value;
        },

        get(name) {
            return registry.get(sanitizeName(name));
        },

        has(name) {
            return registry.has(sanitizeName(name));
        },

        remove(name) {
            return registry.delete(sanitizeName(name));
        },

        snapshot() {
            return Array.from(registry.keys()).sort();
        }
    };

    global.GameServices = GameServices;
})(window);
