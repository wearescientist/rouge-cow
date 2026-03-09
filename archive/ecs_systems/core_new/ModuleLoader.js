/**
 * ModuleLoader - 模块加载器
 * 简单的脚本动态加载器，支持依赖管理和加载队列
 * v0.22.1 - Phase 2 重构
 */

class ModuleLoader {
    constructor() {
        this.loaded = new Set();
        this.loading = new Map();
        this.failed = new Set();
        this.basePath = 'src/';
    }

    /**
     * 加载单个脚本
     * @param {string} path - 脚本路径（相对于 basePath）
     * @returns {Promise<void>}
     */
    load(path) {
        // 已加载
        if (this.loaded.has(path)) {
            return Promise.resolve();
        }
        
        // 正在加载
        if (this.loading.has(path)) {
            return this.loading.get(path);
        }
        
        // 失败过
        if (this.failed.has(path)) {
            return Promise.reject(new Error(`Module previously failed to load: ${path}`));
        }
        
        const promise = new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = this.basePath + path;
            script.async = false; // 保持加载顺序
            
            script.onload = () => {
                this.loaded.add(path);
                this.loading.delete(path);
                resolve();
            };
            
            script.onerror = () => {
                this.failed.add(path);
                this.loading.delete(path);
                reject(new Error(`Failed to load: ${path}`));
            };
            
            document.head.appendChild(script);
        });
        
        this.loading.set(path, promise);
        return promise;
    }

    /**
     * 批量加载脚本
     * @param {Array<string>} paths - 脚本路径数组
     * @param {Function} onProgress - 进度回调 (loaded, total, path) => void
     * @returns {Promise<void>}
     */
    async loadBatch(paths, onProgress = null) {
        let loaded = 0;
        const total = paths.length;
        
        for (const path of paths) {
            try {
                await this.load(path);
                loaded++;
                if (onProgress) {
                    onProgress(loaded, total, path);
                }
            } catch (e) {
                console.warn(`[ModuleLoader] Failed to load ${path}:`, e);
                loaded++;
                if (onProgress) {
                    onProgress(loaded, total, path);
                }
            }
        }
    }

    /**
     * 按顺序加载脚本（依赖加载）
     * @param {Array<string>} paths - 脚本路径数组
     * @returns {Promise<void>}
     */
    async loadSequential(paths) {
        for (const path of paths) {
            await this.load(path);
        }
    }

    /**
     * 设置基础路径
     * @param {string} path - 基础路径
     */
    setBasePath(path) {
        this.basePath = path.endsWith('/') ? path : path + '/';
    }

    /**
     * 检查模块是否已加载
     * @param {string} path - 脚本路径
     * @returns {boolean}
     */
    isLoaded(path) {
        return this.loaded.has(path);
    }

    /**
     * 获取已加载模块列表
     * @returns {Array<string>}
     */
    getLoaded() {
        return Array.from(this.loaded);
    }

    /**
     * 重置加载器
     */
    reset() {
        this.loaded.clear();
        this.loading.clear();
        this.failed.clear();
    }
}

// 全局单例
window.ModuleLoader = ModuleLoader;
window.moduleLoader = new ModuleLoader();

/**
 * 预定义的模块加载配置
 */
window.ModuleConfig = {
    // 核心模块（必须先加载）
    core: [
        'utils/EventManager.js',
        'utils/Logger.js',
        'core/Entity.js',
        'core/StateManager.js',
        'core/AssetManager.js',
        'core/PerformanceMonitor.js',
        'core/ModuleLoader.js'
    ],
    
    // 数据模块
    data: [
        'data/balance_config.js',
        'data/enemyCodex.js',
        'data/totemData.js'
    ],
    
    // 系统模块
    systems: [
        'systems/audio_enhanced.js',
        'systems/save_manager.js',
        'systems/shopNPC.js',
        'systems/stats_achievements.js',
        'systems/storyEvents.js'
    ],
    
    // 工具模块
    utils: [
        'utils/performance.js',
        'utils/safeguards.js',
        'utils/ui_effects.js',
        'utils/helpers.js'
    ],
    
    // 核心游戏模块
    game: [
        'core/game_core.js',
        'core/visual_effects.js'
    ]
};
