/**
 * AssetManager - 资源管理器
 * 统一管理游戏资源的加载、缓存和释放
 * v0.22.1 - Phase 2 重构
 */

class AssetManager {
    constructor() {
        // 资源缓存
        this.cache = new Map();
        // 正在加载的资源
        this.loading = new Map();
        // 加载队列
        this.queue = [];
        // 加载统计
        this.stats = {
            loaded: 0,
            failed: 0,
            total: 0
        };
        // 监听回调
        this.onProgress = null;
        this.onComplete = null;
        this.onError = null;
    }

    /**
     * 加载单个图片资源
     * @param {string} key - 资源键名
     * @param {string} src - 图片路径
     * @returns {Promise<HTMLImageElement>}
     */
    loadImage(key, src) {
        // 检查缓存
        if (this.cache.has(key)) {
            return Promise.resolve(this.cache.get(key));
        }
        
        // 检查是否正在加载
        if (this.loading.has(key)) {
            return this.loading.get(key);
        }
        
        // 创建加载Promise
        const promise = new Promise((resolve, reject) => {
            const img = new Image();
            const resolvedSrc = window.RuntimeAssetBase?.resolve?.(src) || src;
            
            img.onload = () => {
                this.cache.set(key, img);
                this.loading.delete(key);
                this.stats.loaded++;
                this._triggerProgress();
                resolve(img);
            };
            
            img.onerror = () => {
                this.loading.delete(key);
                this.stats.failed++;
                this._triggerError(key, resolvedSrc);
                reject(new Error(`Failed to load image: ${resolvedSrc}`));
            };
            
            img.src = resolvedSrc;
        });
        
        this.loading.set(key, promise);
        this.stats.total++;
        return promise;
    }

    /**
     * 批量加载资源
     * @param {Array<{key: string, src: string}>} assets - 资源列表
     * @returns {Promise<void>}
     */
    async loadBatch(assets) {
        const promises = assets.map(({ key, src }) => 
            this.loadImage(key, src).catch(err => {
                // 单个资源失败不中断整体加载
                console.warn(`[AssetManager] Failed to load: ${key}`, err);
                return null;
            })
        );
        
        await Promise.all(promises);
        this._triggerComplete();
    }

    /**
     * 获取已缓存的资源
     * @param {string} key - 资源键名
     * @returns {HTMLImageElement|null}
     */
    get(key) {
        return this.cache.get(key) || null;
    }

    /**
     * 检查资源是否已加载
     * @param {string} key - 资源键名
     * @returns {boolean}
     */
    has(key) {
        return this.cache.has(key);
    }

    /**
     * 释放指定资源
     * @param {string} key - 资源键名
     */
    release(key) {
        this.cache.delete(key);
    }

    /**
     * 释放所有资源
     */
    releaseAll() {
        this.cache.clear();
        this.loading.clear();
    }

    /**
     * 获取加载进度 (0-1)
     * @returns {number}
     */
    getProgress() {
        if (this.stats.total === 0) return 1;
        return (this.stats.loaded + this.stats.failed) / this.stats.total;
    }

    /**
     * 获取加载统计
     * @returns {Object}
     */
    getStats() {
        return { ...this.stats };
    }

    /**
     * 重置统计
     */
    resetStats() {
        this.stats = { loaded: 0, failed: 0, total: 0 };
    }

    /**
     * 设置进度回调
     * @param {Function} callback - (progress, stats) => void
     */
    setOnProgress(callback) {
        this.onProgress = callback;
    }

    /**
     * 设置完成回调
     * @param {Function} callback - () => void
     */
    setOnComplete(callback) {
        this.onComplete = callback;
    }

    /**
     * 设置错误回调
     * @param {Function} callback - (key, src) => void
     */
    setOnError(callback) {
        this.onError = callback;
    }

    _triggerProgress() {
        if (this.onProgress) {
            this.onProgress(this.getProgress(), this.getStats());
        }
    }

    _triggerComplete() {
        if (this.onComplete) {
            this.onComplete();
        }
    }

    _triggerError(key, src) {
        if (this.onError) {
            this.onError(key, src);
        }
    }
}

// 全局单例
window.AssetManager = AssetManager;
window.assetManager = new AssetManager();
