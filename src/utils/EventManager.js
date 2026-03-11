/**
 * EventManager - 统一事件管理器
 * 防止内存泄漏，统一管理 addEventListener/removeEventListener
 * v0.22.1 - Phase 1 修复
 */

class EventManager {
    constructor() {
        this.listeners = new Map();
        this.timers = new Set();
    }

    /**
     * 添加事件监听
     * @param {EventTarget} target - 目标元素
     * @param {string} event - 事件类型
     * @param {Function} handler - 处理函数
     * @param {Object|boolean} options - 选项
     */
    add(target, event, handler, options = false) {
        if (!target || typeof target.addEventListener !== 'function') {
            console.warn('[EventManager] Invalid target:', target);
            return;
        }
        
        target.addEventListener(event, handler, options);
        
        const key = this._getKey(target, event, handler);
        this.listeners.set(key, { target, event, handler, options });
    }

    /**
     * 移除单个事件监听
     */
    remove(target, event, handler, options = false) {
        if (!target || typeof target.removeEventListener !== 'function') {
            return;
        }
        
        target.removeEventListener(event, handler, options);
        const key = this._getKey(target, event, handler);
        this.listeners.delete(key);
    }

    /**
     * 创建一次性事件监听
     */
    once(target, event, handler, options = false) {
        const wrapper = (e) => {
            handler(e);
            this.remove(target, event, wrapper, options);
        };
        this.add(target, event, wrapper, options);
    }

    /**
     * 添加定时器（统一管理）
     * @param {Function} callback - 回调函数
     * @param {number} delay - 延迟时间
     * @returns {number} timerId
     */
    setTimeout(callback, delay) {
        const id = setTimeout(() => {
            this.timers.delete(id);
            callback();
        }, delay);
        this.timers.add(id);
        return id;
    }

    /**
     * 添加轮询定时器
     */
    setInterval(callback, delay) {
        const id = setInterval(callback, delay);
        this.timers.add(id);
        return id;
    }

    /**
     * 清除指定定时器
     */
    clearTimer(id) {
        clearTimeout(id);
        clearInterval(id);
        this.timers.delete(id);
    }

    /**
     * 清除所有定时器
     */
    clearAllTimers() {
        this.timers.forEach(id => {
            clearTimeout(id);
            clearInterval(id);
        });
        this.timers.clear();
    }

    /**
     * 销毁所有事件监听（用于游戏退出/场景切换）
     */
    destroy() {
        // 移除所有事件监听
        this.listeners.forEach(({ target, event, handler, options }) => {
            try {
                target.removeEventListener(event, handler, options);
            } catch (e) {
                // 忽略已失效的目标
            }
        });
        this.listeners.clear();
        
        // 清除所有定时器
        this.clearAllTimers();
    }

    /**
     * 生成唯一键
     */
    _getKey(target, event, handler) {
        // 使用弱引用无法直接获取标识，这里使用计数器
        if (!this._counter) this._counter = 0;
        return `${event}_${++this._counter}`;
    }

    /**
     * 获取当前监听数量（调试用）
     */
    getStats() {
        return {
            listeners: this.listeners.size,
            timers: this.timers.size
        };
    }
}

// 全局单例（方便各处使用）
window.EventManager = EventManager;
window.eventManager = new EventManager();
