/**
 * StateManager - 状态管理器
 * 集中管理游戏状态，支持订阅监听和状态持久化
 * v0.22.1 - Phase 2 重构
 */

class StateManager {
    constructor() {
        // 状态存储
        this.state = new Map();
        // 订阅者
        this.subscribers = new Map();
        // 历史记录（用于撤销）
        this.history = [];
        this.maxHistory = 50;
        // 调试模式
        this.debug = false;
    }

    /**
     * 获取状态值
     * @param {string} key - 状态键名
     * @param {*} defaultValue - 默认值
     * @returns {*}
     */
    get(key, defaultValue = null) {
        return this.state.has(key) ? this.state.get(key) : defaultValue;
    }

    /**
     * 设置状态值
     * @param {string} key - 状态键名
     * @param {*} value - 新值
     * @param {boolean} silent - 是否静默更新（不触发订阅）
     */
    set(key, value, silent = false) {
        const oldValue = this.state.get(key);
        
        // 保存历史
        if (oldValue !== undefined) {
            this._pushHistory(key, oldValue);
        }
        
        this.state.set(key, value);
        
        if (this.debug) {
            console.log(`[StateManager] ${key}:`, oldValue, '->', value);
        }
        
        // 触发订阅
        if (!silent) {
            this._notify(key, value, oldValue);
        }
        
        return this;
    }

    /**
     * 批量设置状态
     * @param {Object} updates - 键值对对象
     * @param {boolean} silent - 是否静默更新
     */
    setBatch(updates, silent = false) {
        Object.entries(updates).forEach(([key, value]) => {
            this.set(key, value, silent);
        });
        return this;
    }

    /**
     * 订阅状态变化
     * @param {string} key - 状态键名
     * @param {Function} callback - (newValue, oldValue, key) => void
     * @returns {Function} 取消订阅函数
     */
    subscribe(key, callback) {
        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, new Set());
        }
        
        this.subscribers.get(key).add(callback);
        
        // 返回取消订阅函数
        return () => {
            this.subscribers.get(key).delete(callback);
        };
    }

    /**
     * 订阅多个状态变化
     * @param {Array<string>} keys - 状态键名数组
     * @param {Function} callback - (changedKey, newValue, oldValue) => void
     * @returns {Function} 取消订阅函数
     */
    subscribeMany(keys, callback) {
        const unsubscribes = keys.map(key => 
            this.subscribe(key, (newVal, oldVal) => callback(key, newVal, oldVal))
        );
        
        return () => unsubscribes.forEach(fn => fn());
    }

    /**
     * 取消订阅
     * @param {string} key - 状态键名
     * @param {Function} callback - 原回调函数
     */
    unsubscribe(key, callback) {
        if (this.subscribers.has(key)) {
            this.subscribers.get(key).delete(callback);
        }
    }

    /**
     * 删除状态
     * @param {string} key - 状态键名
     */
    delete(key) {
        this.state.delete(key);
        this.subscribers.delete(key);
    }

    /**
     * 检查状态是否存在
     * @param {string} key - 状态键名
     * @returns {boolean}
     */
    has(key) {
        return this.state.has(key);
    }

    /**
     * 撤销上一次状态变更
     * @param {string} key - 状态键名
     * @returns {boolean} 是否成功撤销
     */
    undo(key) {
        const history = this.history.filter(h => h.key === key);
        if (history.length === 0) return false;
        
        const last = history[history.length - 1];
        this.history = this.history.filter(h => h !== last);
        
        this.set(key, last.value);
        return true;
    }

    /**
     * 保存状态到 localStorage
     * @param {string} namespace - 命名空间
     */
    save(namespace = 'game') {
        const data = {};
        this.state.forEach((value, key) => {
            data[key] = value;
        });
        
        try {
            localStorage.setItem(`${namespace}_state`, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('[StateManager] Save failed:', e);
            return false;
        }
    }

    /**
     * 从 localStorage 加载状态
     * @param {string} namespace - 命名空间
     * @param {boolean} merge - 是否合并而非替换
     */
    load(namespace = 'game', merge = false) {
        try {
            const data = JSON.parse(localStorage.getItem(`${namespace}_state`));
            if (!data) return false;
            
            if (!merge) {
                this.state.clear();
            }
            
            Object.entries(data).forEach(([key, value]) => {
                this.set(key, value);
            });
            
            return true;
        } catch (e) {
            console.error('[StateManager] Load failed:', e);
            return false;
        }
    }

    /**
     * 清空所有状态
     */
    clear() {
        this.state.clear();
        this.subscribers.clear();
        this.history = [];
    }

    /**
     * 获取所有状态
     * @returns {Object}
     */
    getAll() {
        const data = {};
        this.state.forEach((value, key) => {
            data[key] = value;
        });
        return data;
    }

    /**
     * 设置调试模式
     * @param {boolean} enabled
     */
    setDebug(enabled) {
        this.debug = enabled;
    }

    /**
     * 推入历史记录
     */
    _pushHistory(key, value) {
        this.history.push({ key, value, time: Date.now() });
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
    }

    /**
     * 通知订阅者
     */
    _notify(key, newValue, oldValue) {
        if (!this.subscribers.has(key)) return;
        
        this.subscribers.get(key).forEach(callback => {
            try {
                callback(newValue, oldValue, key);
            } catch (e) {
                console.error('[StateManager] Subscriber error:', e);
            }
        });
    }
}

// 全局单例
window.StateManager = StateManager;
window.stateManager = new StateManager();
