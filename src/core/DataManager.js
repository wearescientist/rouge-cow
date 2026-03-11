/**
 * DataManager - 数据管理器
 * 统一管理游戏资源的加载、缓存和热更新
 * v0.23 - 数据驱动架构核心
 */

class DataManager {
    constructor() {
        this.cache = new Map();
        this.schemas = new Map();
        this.listeners = new Map();
        this.baseUrl = './data/static';
        this.loadingPromises = new Map();
    }

    /**
     * 注册数据验证模式
     */
    registerSchema(category, schema) {
        this.schemas.set(category, schema);
    }

    /**
     * 获取数据（同步）
     */
    get(category, id) {
        const key = `${category}/${id}`;
        return this.cache.get(key) || null;
    }

    /**
     * 加载数据（异步）
     */
    async load(category, id, options = {}) {
        const key = `${category}/${id}`;
        
        // 检查缓存
        if (!options.forceReload && this.cache.has(key)) {
            return this.cache.get(key);
        }
        
        // 检查是否正在加载
        if (this.loadingPromises.has(key)) {
            return this.loadingPromises.get(key);
        }
        
        const promise = this._doLoad(category, id, key);
        this.loadingPromises.set(key, promise);
        
        try {
            const result = await promise;
            return result;
        } finally {
            this.loadingPromises.delete(key);
        }
    }

    async _doLoad(category, id, key) {
        try {
            const url = `${this.baseUrl}/${category}/${id}.json`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`Failed to load ${key}: ${response.status}`);
            }
            
            let data = await response.json();
            
            // 处理继承
            if (data.extends) {
                data = await this.resolveInheritance(category, data);
            }
            
            // 验证数据
            const schema = this.schemas.get(category);
            if (schema) {
                const result = this.validateAgainstSchema(data, schema);
                if (!result.valid) {
                    console.error(`[DataManager] Validation failed for ${key}:`, result.errors);
                }
            }
            
            // 缓存
            this.cache.set(key, data);
            
            // 通知监听器
            this.notify(key, data);
            
            return data;
            
        } catch (error) {
            console.error(`[DataManager] Error loading ${key}:`, error);
            throw error;
        }
    }

    /**
     * 批量加载
     */
    async loadBatch(category, ids) {
        return Promise.all(ids.map(id => this.load(category, id)));
    }

    /**
     * 加载分类下所有数据
     */
    async loadAll(category) {
        // 这里假设有一个索引文件
        try {
            const index = await fetch(`${this.baseUrl}/${category}/_index.json`).then(r => r.json());
            return this.loadBatch(category, index.items);
        } catch (e) {
            console.warn(`[DataManager] No index found for ${category}`);
            return [];
        }
    }

    /**
     * 条件查询
     */
    query(category, filter) {
        const results = [];
        const prefix = `${category}/`;
        
        for (const [key, data] of this.cache) {
            if (key.startsWith(prefix) && filter(data)) {
                results.push(data);
            }
        }
        
        return results;
    }

    /**
     * 按标签查询
     */
    findByTag(category, tag) {
        return this.query(category, data => 
            data.tags && data.tags.includes(tag)
        );
    }

    /**
     * 按稀有度查询
     */
    findByRarity(category, rarity) {
        return this.query(category, data => 
            data.rarity === rarity
        );
    }

    /**
     * 解析继承
     */
    async resolveInheritance(category, data) {
        const parent = await this.load(category, data.extends);
        return this.deepMerge(parent, data);
    }

    /**
     * 深度合并
     */
    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (key === 'extends') continue;
            
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }

    /**
     * 订阅数据变化
     */
    subscribe(key, callback) {
        if (!this.listeners.has(key)) {
            this.listeners.set(key, new Set());
        }
        this.listeners.get(key).add(callback);
        
        return () => {
            this.listeners.get(key).delete(callback);
        };
    }

    /**
     * 通知监听器
     */
    notify(key, data) {
        if (this.listeners.has(key)) {
            this.listeners.get(key).forEach(cb => {
                try {
                    cb(data);
                } catch (e) {
                    console.error('[DataManager] Listener error:', e);
                }
            });
        }
    }

    /**
     * 验证数据
     */
    validateAgainstSchema(data, schema) {
        const errors = [];
        
        for (const [key, rule] of Object.entries(schema)) {
            if (rule.required && !(key in data)) {
                errors.push(`Missing required field: ${key}`);
            }
            
            if (key in data && rule.type) {
                const actualType = Array.isArray(data[key]) ? 'array' : typeof data[key];
                if (actualType !== rule.type) {
                    errors.push(`Type mismatch for ${key}: expected ${rule.type}, got ${actualType}`);
                }
            }
        }
        
        return { valid: errors.length === 0, errors };
    }

    /**
     * 预加载分类数据
     */
    async preload(category, ids) {
        console.log(`[DataManager] Preloading ${category}: ${ids.length} items`);
        return this.loadBatch(category, ids);
    }

    /**
     * 清空缓存
     */
    clear() {
        this.cache.clear();
    }

    /**
     * 获取缓存统计
     */
    getStats() {
        return {
            cached: this.cache.size,
            loading: this.loadingPromises.size,
            listeners: Array.from(this.listeners.values()).reduce((sum, set) => sum + set.size, 0)
        };
    }
}

// 全局单例
window.DataManager = DataManager;
window.dataManager = new DataManager();
