/**
 * 游戏核心架构 - v0.14.0
 * 第8轮迭代：代码重构
 * 
 * 重构内容：
 * 1. 模块化架构
 * 2. 事件驱动系统
 * 3. 依赖注入
 * 4. 类型安全（JSDoc）
 */

// ==================== 事件总线 ====================
class EventBus {
    constructor() {
        /** @type {Map<string, Function[]>} */
        this.listeners = new Map();
    }
    
    /**
     * 订阅事件
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     * @returns {Function} 取消订阅函数
     */
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        
        this.listeners.get(event).push(callback);
        
        // 返回取消订阅函数
        return () => this.off(event, callback);
    }
    
    /**
     * 取消订阅
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     */
    off(event, callback) {
        const listeners = this.listeners.get(event);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }
    
    /**
     * 触发事件
     * @param {string} event - 事件名称
     * @param {*} data - 事件数据
     */
    emit(event, data) {
        const listeners = this.listeners.get(event);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(data);
                } catch (e) {
                    console.error(`事件处理错误 (${event}):`, e);
                }
            });
        }
    }
    
    /**
     * 一次性订阅
     * @param {string} event - 事件名称
     * @param {Function} callback - 回调函数
     */
    once(event, callback) {
        const unsubscribe = this.on(event, (data) => {
            unsubscribe();
            callback(data);
        });
    }
}

// ==================== 服务容器（依赖注入） ====================
class ServiceContainer {
    constructor() {
        /** @type {Map<string, any>} */
        this.services = new Map();
        /** @type {Map<string, Function>} */
        this.factories = new Map();
    }
    
    /**
     * 注册单例服务
     * @param {string} name - 服务名称
     * @param {any} instance - 服务实例
     */
    register(name, instance) {
        this.services.set(name, instance);
    }
    
    /**
     * 注册工厂函数
     * @param {string} name - 服务名称
     * @param {Function} factory - 工厂函数
     */
    factory(name, factory) {
        this.factories.set(name, factory);
    }
    
    /**
     * 获取服务
     * @param {string} name - 服务名称
     * @returns {any} 服务实例
     */
    get(name) {
        // 直接返回已注册的服务
        if (this.services.has(name)) {
            return this.services.get(name);
        }
        
        // 通过工厂创建
        if (this.factories.has(name)) {
            const factory = this.factories.get(name);
            const instance = factory(this);
            this.services.set(name, instance);
            return instance;
        }
        
        throw new Error(`服务未找到: ${name}`);
    }
    
    /**
     * 检查服务是否存在
     * @param {string} name - 服务名称
     * @returns {boolean}
     */
    has(name) {
        return this.services.has(name) || this.factories.has(name);
    }
}

// ==================== 游戏状态机 ====================
class GameStateMachine {
    constructor() {
        /** @type {string} */
        this.currentState = 'none';
        /** @type {Map<string, {enter: Function, exit: Function, update: Function}>} */
        this.states = new Map();
        /** @type {EventBus} */
        this.events = new EventBus();
    }
    
    /**
     * 注册状态
     * @param {string} name - 状态名称
     * @param {Object} handlers - 状态处理器
     */
    register(name, handlers) {
        this.states.set(name, {
            enter: handlers.enter || (() => {}),
            exit: handlers.exit || (() => {}),
            update: handlers.update || (() => {})
        });
    }
    
    /**
     * 切换状态
     * @param {string} newState - 新状态
     * @param {*} data - 切换数据
     */
    transition(newState, data = null) {
        if (!this.states.has(newState)) {
            throw new Error(`未知状态: ${newState}`);
        }
        
        const oldState = this.currentState;
        const oldHandlers = this.states.get(oldState);
        const newHandlers = this.states.get(newState);
        
        // 退出旧状态
        if (oldHandlers) {
            oldHandlers.exit();
        }
        
        // 状态变更
        this.currentState = newState;
        
        // 进入新状态
        newHandlers.enter(data);
        
        // 触发事件
        this.events.emit('stateChange', { from: oldState, to: newState, data });
    }
    
    /**
     * 更新当前状态
     * @param {number} dt - 时间增量
     */
    update(dt) {
        const handlers = this.states.get(this.currentState);
        if (handlers) {
            handlers.update(dt);
        }
    }
    
    /**
     * 获取当前状态
     * @returns {string}
     */
    getState() {
        return this.currentState;
    }
    
    /**
     * 检查当前状态
     * @param {string} state - 状态名称
     * @returns {boolean}
     */
    is(state) {
        return this.currentState === state;
    }
}

// ==================== 组件系统 ====================
class Component {
    constructor(entity) {
        /** @type {Entity} */
        this.entity = entity;
        /** @type {boolean} */
        this.enabled = true;
    }
    
    init() {}
    update(dt) {}
    destroy() {}
}

class Entity {
    constructor(id) {
        /** @type {string} */
        this.id = id;
        /** @type {Map<string, Component>} */
        this.components = new Map();
        /** @type {boolean} */
        this.active = true;
    }
    
    /**
     * 添加组件
     * @param {string} name - 组件名称
     * @param {Component} component - 组件实例
     * @returns {Entity}
     */
    addComponent(name, component) {
        this.components.set(name, component);
        component.init();
        return this;
    }
    
    /**
     * 获取组件
     * @param {string} name - 组件名称
     * @returns {Component|null}
     */
    getComponent(name) {
        return this.components.get(name) || null;
    }
    
    /**
     * 检查是否有组件
     * @param {string} name - 组件名称
     * @returns {boolean}
     */
    hasComponent(name) {
        return this.components.has(name);
    }
    
    /**
     * 移除组件
     * @param {string} name - 组件名称
     */
    removeComponent(name) {
        const component = this.components.get(name);
        if (component) {
            component.destroy();
            this.components.delete(name);
        }
    }
    
    update(dt) {
        if (!this.active) return;
        
        for (const component of this.components.values()) {
            if (component.enabled) {
                component.update(dt);
            }
        }
    }
    
    destroy() {
        for (const component of this.components.values()) {
            component.destroy();
        }
        this.components.clear();
    }
}

// ==================== 场景管理 ====================
class Scene {
    constructor(name) {
        /** @type {string} */
        this.name = name;
        /** @type {Entity[]} */
        this.entities = [];
        /** @type {boolean} */
        this.paused = false;
    }
    
    addEntity(entity) {
        this.entities.push(entity);
        return entity;
    }
    
    removeEntity(entity) {
        const index = this.entities.indexOf(entity);
        if (index > -1) {
            entity.destroy();
            this.entities.splice(index, 1);
        }
    }
    
    findById(id) {
        return this.entities.find(e => e.id === id);
    }
    
    findByComponent(componentName) {
        return this.entities.filter(e => e.hasComponent(componentName));
    }
    
    update(dt) {
        if (this.paused) return;
        
        for (const entity of this.entities) {
            entity.update(dt);
        }
    }
    
    clear() {
        for (const entity of this.entities) {
            entity.destroy();
        }
        this.entities = [];
    }
}

class SceneManager {
    constructor() {
        /** @type {Map<string, Scene>} */
        this.scenes = new Map();
        /** @type {Scene|null} */
        this.currentScene = null;
    }
    
    register(name, scene) {
        this.scenes.set(name, scene);
    }
    
    switchTo(name) {
        const scene = this.scenes.get(name);
        if (!scene) {
            throw new Error(`场景未找到: ${name}`);
        }
        
        this.currentScene = scene;
    }
    
    update(dt) {
        if (this.currentScene) {
            this.currentScene.update(dt);
        }
    }
}

// ==================== 资源管理 ====================
class AssetManager {
    constructor() {
        /** @type {Map<string, any>} */
        this.assets = new Map();
        /** @type {Map<string, Promise>} */
        this.loading = new Map();
    }
    
    /**
     * 加载图片
     * @param {string} key - 资源键
     * @param {string} src - 图片路径
     * @returns {Promise<HTMLImageElement>}
     */
    loadImage(key, src) {
        if (this.assets.has(key)) {
            return Promise.resolve(this.assets.get(key));
        }
        
        if (this.loading.has(key)) {
            return this.loading.get(key);
        }
        
        const promise = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.assets.set(key, img);
                this.loading.delete(key);
                resolve(img);
            };
            img.onerror = reject;
            img.src = src;
        });
        
        this.loading.set(key, promise);
        return promise;
    }
    
    /**
     * 获取资源
     * @param {string} key - 资源键
     * @returns {any}
     */
    get(key) {
        return this.assets.get(key);
    }
    
    /**
     * 批量加载
     * @param {Array<{key: string, src: string}>} assets - 资源列表
     * @param {Function} onProgress - 进度回调
     * @returns {Promise}
     */
    async loadBatch(assets, onProgress) {
        const total = assets.length;
        let loaded = 0;
        
        const promises = assets.map(async ({ key, src }) => {
            await this.loadImage(key, src);
            loaded++;
            if (onProgress) {
                onProgress(loaded / total);
            }
        });
        
        await Promise.all(promises);
    }
}

// ==================== 配置管理 ====================
class ConfigManager {
    constructor() {
        /** @type {Object} */
        this.configs = {};
    }
    
    load(name, config) {
        this.configs[name] = config;
    }
    
    get(name, path = null) {
        const config = this.configs[name];
        if (!config) return null;
        
        if (!path) return config;
        
        // 支持路径如 "player.hp"
        const keys = path.split('.');
        let current = config;
        
        for (const key of keys) {
            if (current === null || current === undefined) {
                return null;
            }
            current = current[key];
        }
        
        return current;
    }
    
    set(name, path, value) {
        const keys = path.split('.');
        let current = this.configs[name];
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (!current[keys[i]]) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        EventBus,
        ServiceContainer,
        GameStateMachine,
        Component,
        Entity,
        Scene,
        SceneManager,
        AssetManager,
        ConfigManager
    };
}
