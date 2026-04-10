/**
 * SpriteDataRegistry.js - SpriteData 管理器
 * 加载 metadata.json 并提供 SpriteData 实例
 */

class SpriteDataRegistry {
    constructor() {
        this.metadata = new Map();
        this.spriteDataCache = new Map();
        this.loaded = false;
    }

    /**
     * 从 JSON 文件加载元数据
     * @param {string} url - metadata.json 路径
     */
    async load(url = window.RuntimeAssetBase?.resolveSprite?.('metadata.json') || 'assets/runtime/sprites/metadata.json') {
        const isFileProtocol = typeof window !== 'undefined' && window.location?.protocol === 'file:';
        if (isFileProtocol) {
            console.warn('[SpriteDataRegistry] file:// mode detected, using default sprite data');
            this._setupDefaults();
            this.loaded = true;
            return;
        }
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const json = await response.json();
            
            // 解析所有条目
            for (const [key, data] of Object.entries(json)) {
                if (key.startsWith('_')) continue; // 跳过注释和 schema
                
                this.metadata.set(key, data);
                
                // 同时按 src 路径索引
                if (data.src) {
                    const srcKey = this._extractKeyFromSrc(data.src);
                    this.metadata.set(srcKey, data);
                }
            }
            
            this.loaded = true;
            console.log(`[SpriteDataRegistry] Loaded ${this.metadata.size} sprite metadata entries`);
            
        } catch (err) {
            console.warn(`[SpriteDataRegistry] Failed to load metadata: ${err.message}`);
            console.warn('Falling back to default sprite data');
            this._setupDefaults();
            this.loaded = true; // 标记为已加载（使用默认值）
        }
    }

    /**
     * 获取 SpriteData 实例
     * @param {string} key - 精灵键名或路径
     * @returns {SpriteData|null}
     */
    get(key) {
        // 尝试直接获取
        let data = this.metadata.get(key);
        
        // v0.25-fix: 处理玩家动画帧 (player_0 到 player_7) -> player
        // 支持 player/player_0 或 assets/runtime/sprites/player/player_0 格式
        if (!data && /player[\/_]player_\d+/.test(key)) {
            data = this.metadata.get('player');
        }
        
        // v0.25-fix: 处理描边精灵 (outlined_by_color/xxx/yyy -> yyy)
        if (!data && key.includes('outlined_by_color')) {
            const parts = key.split('/');
            const baseKey = parts.pop();
            data = this.metadata.get(baseKey);
        }
        
        // 如果没找到，尝试提取 key
        if (!data && key.includes('/')) {
            const normalizedKey = this._normalizeKey(key);
            data = this.metadata.get(normalizedKey);
        }
        
        if (!data) {
            // 返回默认配置
            return this._createDefault(key);
        }
        
        // 从缓存获取或创建新实例
        if (!this.spriteDataCache.has(key)) {
            this.spriteDataCache.set(key, SpriteData.fromJSON(data));
        }
        
        return this.spriteDataCache.get(key);
    }

    /**
     * 从 Image 对象获取 SpriteData
     * @param {HTMLImageElement} img 
     * @returns {SpriteData}
     */
    getFromImage(img) {
        const key = this._extractKeyFromSrc(img.src);
        return this.get(key);
    }

    /**
     * 预加载常用精灵数据到缓存
     * @param {Array<string>} keys 
     */
    preload(keys) {
        for (const key of keys) {
            this.get(key);
        }
    }

    /**
     * 清空缓存
     */
    clearCache() {
        this.spriteDataCache.clear();
    }
    
    /**
     * 智能缓存清理 - 移除不常用的 SpriteData
     * @param {Array<string>} activeKeys - 当前活跃的键列表
     * @param {number} maxCacheSize - 最大缓存数量，默认 200
     */
    pruneCache(activeKeys = [], maxCacheSize = 200) {
        const activeSet = new Set(activeKeys);
        let removed = 0;
        
        // 如果缓存不大，不需要清理
        if (this.spriteDataCache.size <= maxCacheSize) return 0;
        
        for (const [key, value] of this.spriteDataCache) {
            // 保留活跃的
            if (activeSet.has(key)) continue;
            
            // 移除不常用的
            this.spriteDataCache.delete(key);
            removed++;
            
            // 清理到目标大小
            if (this.spriteDataCache.size <= maxCacheSize * 0.8) break;
        }
        
        if (removed > 0) {
            console.log(`[SpriteDataRegistry] Pruned ${removed} cached entries, remaining: ${this.spriteDataCache.size}`);
        }
        return removed;
    }
    
    /**
     * 获取缓存统计
     * @returns {Object} { size, memoryEstimate }
     */
    getCacheStats() {
        const size = this.spriteDataCache.size;
        // 估算内存：每个 SpriteData 约 1KB
        const memoryEstimate = size * 1024;
        return {
            size,
            memoryEstimate,
            memoryEstimateKB: Math.round(memoryEstimate / 1024)
        };
    }

    // ==========================================
    // 内部方法
    // ==========================================

    _normalizeKey(key) {
        // 移除扩展名，统一路径分隔符
        return key
            .replace(/\\/g, '/')
            .replace(/\.[^.]+$/, '')
            .replace(/^assets\/runtime\/sprites\//, '')
            .replace(/^assets\/sprites\//, '');
    }

    _extractKeyFromSrc(src) {
        // 从完整 URL 提取 key
        const match = src.match(/sprites[\\/](.+?)\.(png|jpg|gif|webp)/i);
        return match ? match[1].replace(/\\/g, '/') : src.split('/').pop().replace(/\.[^.]+$/, '');
    }

    _createDefault(key) {
        // 创建默认 SpriteData（假设正方形 64x64）
        const defaultData = {
            canvasWidth: 64, canvasHeight: 64,
            modelOffsetX: 0, modelOffsetY: 0,
            modelWidth: 64, modelHeight: 64,
            anchor: {
                center: { x: 32, y: 32 },
                feet: { x: 32, y: 64 }
            },
            hitboxRatio: { w: 0.8, h: 0.9 },
            shadowOffsetY: 2
        };
        
        const spriteData = new SpriteData(defaultData);
        this.spriteDataCache.set(key, spriteData);
        return spriteData;
    }

    _setupDefaults() {
        // 设置默认配置（当 metadata.json 加载失败时使用）
        // 基于敌人运行时尺寸分析优化
        const defaults = {
            // ==================== 玩家 ====================
            'player': { canvasWidth: 64, canvasHeight: 64, modelOffsetX: 16, modelOffsetY: 12, modelWidth: 32, modelHeight: 40, anchor: { center: { x: 32, y: 32 }, feet: { x: 32, y: 52 } }, hitboxRatio: { w: 0.85, h: 0.9 }, shadowOffsetY: 2 },
            'player/cow_idle': { canvasWidth: 64, canvasHeight: 64, modelOffsetX: 16, modelOffsetY: 12, modelWidth: 32, modelHeight: 40, anchor: { center: { x: 32, y: 32 }, feet: { x: 32, y: 52 } }, hitboxRatio: { w: 0.7, h: 0.85 }, shadowOffsetY: 2 },
            
            // ==================== T1: 普通怪 (白色) ====================
            // 中型 (size 40-50)
            'chick': { canvasWidth: 64, canvasHeight: 64, modelOffsetX: 18, modelOffsetY: 16, modelWidth: 28, modelHeight: 32, anchor: { center: { x: 32, y: 32 }, feet: { x: 32, y: 48 } }, hitboxRatio: { w: 0.75, h: 0.85 }, shadowOffsetY: 2 },
            // 小型 (size 22-28)
            'snail': { canvasWidth: 64, canvasHeight: 64, modelOffsetX: 18, modelOffsetY: 24, modelWidth: 28, modelHeight: 24, anchor: { center: { x: 32, y: 36 }, feet: { x: 32, y: 48 } }, hitboxRatio: { w: 0.85, h: 0.9 }, shadowOffsetY: 1 },
            'pigeon': { canvasWidth: 64, canvasHeight: 64, modelOffsetX: 20, modelOffsetY: 18, modelWidth: 24, modelHeight: 28, anchor: { center: { x: 32, y: 32 }, feet: { x: 32, y: 46 } }, hitboxRatio: { w: 0.7, h: 0.8 }, shadowOffsetY: 2 },
            'duck3': { canvasWidth: 64, canvasHeight: 64, modelOffsetX: 20, modelOffsetY: 20, modelWidth: 24, modelHeight: 26, anchor: { center: { x: 32, y: 33 }, feet: { x: 32, y: 46 } }, hitboxRatio: { w: 0.75, h: 0.85 }, shadowOffsetY: 2 },
            'bat': { canvasWidth: 64, canvasHeight: 64, modelOffsetX: 22, modelOffsetY: 16, modelWidth: 20, modelHeight: 24, anchor: { center: { x: 32, y: 28 }, feet: { x: 32, y: 40 } }, hitboxRatio: { w: 0.7, h: 0.75 }, shadowOffsetY: 1 },
            
            // ==================== T2: 精英怪 - 速度型 (蓝色) ====================
            'rabbit2': { canvasWidth: 64, canvasHeight: 64, modelOffsetX: 18, modelOffsetY: 18, modelWidth: 28, modelHeight: 32, anchor: { center: { x: 32, y: 34 }, feet: { x: 32, y: 50 } }, hitboxRatio: { w: 0.7, h: 0.85 }, shadowOffsetY: 2 },
            'bee': { canvasWidth: 64, canvasHeight: 64, modelOffsetX: 22, modelOffsetY: 16, modelWidth: 20, modelHeight: 22, anchor: { center: { x: 32, y: 27 }, feet: { x: 32, y: 38 } }, hitboxRatio: { w: 0.65, h: 0.75 }, shadowOffsetY: 1 },
            'panther': { canvasWidth: 64, canvasHeight: 64, modelOffsetX: 16, modelOffsetY: 18, modelWidth: 32, modelHeight: 30, anchor: { center: { x: 32, y: 33 }, feet: { x: 32, y: 48 } }, hitboxRatio: { w: 0.75, h: 0.85 }, shadowOffsetY: 2 },
            'tiaotiao': { canvasWidth: 64, canvasHeight: 64, modelOffsetX: 18, modelOffsetY: 18, modelWidth: 28, modelHeight: 32, anchor: { center: { x: 32, y: 34 }, feet: { x: 32, y: 50 } }, hitboxRatio: { w: 0.7, h: 0.85 }, shadowOffsetY: 2 },
            'tiezhua': { canvasWidth: 64, canvasHeight: 64, modelOffsetX: 20, modelOffsetY: 14, modelWidth: 24, modelHeight: 28, anchor: { center: { x: 32, y: 28 }, feet: { x: 32, y: 42 } }, hitboxRatio: { w: 0.7, h: 0.8 }, shadowOffsetY: 2 },
            
            // ==================== T2: 精英怪 - 肉盾型 (绿色) ====================
            'crab': { canvasWidth: 64, canvasHeight: 64, modelOffsetX: 16, modelOffsetY: 22, modelWidth: 32, modelHeight: 26, anchor: { center: { x: 32, y: 35 }, feet: { x: 32, y: 48 } }, hitboxRatio: { w: 0.85, h: 0.9 }, shadowOffsetY: 2 },
            'nibei': { canvasWidth: 64, canvasHeight: 64, modelOffsetX: 14, modelOffsetY: 16, modelWidth: 36, modelHeight: 36, anchor: { center: { x: 32, y: 34 }, feet: { x: 32, y: 52 } }, hitboxRatio: { w: 0.9, h: 0.95 }, shadowOffsetY: 2 },
            'bear': { canvasWidth: 64, canvasHeight: 64, modelOffsetX: 12, modelOffsetY: 12, modelWidth: 40, modelHeight: 40, anchor: { center: { x: 32, y: 32 }, feet: { x: 32, y: 52 } }, hitboxRatio: { w: 0.85, h: 0.9 }, shadowOffsetY: 3 },
            
            // ==================== T2: 精英怪 - 射手型 (红色) ====================
            'snake': { canvasWidth: 64, canvasHeight: 64, modelOffsetX: 18, modelOffsetY: 24, modelWidth: 28, modelHeight: 24, anchor: { center: { x: 32, y: 36 }, feet: { x: 32, y: 48 } }, hitboxRatio: { w: 0.8, h: 0.85 }, shadowOffsetY: 2 },
            'goose': { canvasWidth: 64, canvasHeight: 64, modelOffsetX: 18, modelOffsetY: 18, modelWidth: 28, modelHeight: 30, anchor: { center: { x: 32, y: 33 }, feet: { x: 32, y: 48 } }, hitboxRatio: { w: 0.75, h: 0.85 }, shadowOffsetY: 2 },
            'fox': { canvasWidth: 64, canvasHeight: 64, modelOffsetX: 16, modelOffsetY: 18, modelWidth: 32, modelHeight: 30, anchor: { center: { x: 32, y: 33 }, feet: { x: 32, y: 48 } }, hitboxRatio: { w: 0.75, h: 0.85 }, shadowOffsetY: 2 },
            
            // ==================== T2: 精英怪 - 刺客型 (紫色) ====================
            'yinya': { canvasWidth: 64, canvasHeight: 64, modelOffsetX: 20, modelOffsetY: 22, modelWidth: 24, modelHeight: 24, anchor: { center: { x: 32, y: 34 }, feet: { x: 32, y: 46 } }, hitboxRatio: { w: 0.7, h: 0.85 }, shadowOffsetY: 2 },
            
            // ==================== T3: 小Boss (金色) ====================
            'wolf_king': { canvasWidth: 64, canvasHeight: 64, modelOffsetX: 14, modelOffsetY: 16, modelWidth: 36, modelHeight: 36, anchor: { center: { x: 32, y: 34 }, feet: { x: 32, y: 52 } }, hitboxRatio: { w: 0.8, h: 0.88 }, shadowOffsetY: 2 },
            'turtle': { canvasWidth: 64, canvasHeight: 64, modelOffsetX: 12, modelOffsetY: 14, modelWidth: 40, modelHeight: 38, anchor: { center: { x: 32, y: 33 }, feet: { x: 32, y: 52 } }, hitboxRatio: { w: 0.9, h: 0.95 }, shadowOffsetY: 2 },
            'mimic': { canvasWidth: 64, canvasHeight: 64, modelOffsetX: 12, modelOffsetY: 14, modelWidth: 40, modelHeight: 38, anchor: { center: { x: 32, y: 33 }, feet: { x: 32, y: 52 } }, hitboxRatio: { w: 0.85, h: 0.9 }, shadowOffsetY: 2 },
            'ghost': { canvasWidth: 64, canvasHeight: 64, modelOffsetX: 20, modelOffsetY: 16, modelWidth: 24, modelHeight: 28, anchor: { center: { x: 32, y: 30 }, feet: { x: 32, y: 44 } }, hitboxRatio: { w: 0.65, h: 0.75 }, shadowOffsetY: 1 },
            
            // ==================== T4: Boss (深红) ====================
            'mother': { canvasWidth: 96, canvasHeight: 96, modelOffsetX: 12, modelOffsetY: 12, modelWidth: 72, modelHeight: 72, anchor: { center: { x: 48, y: 48 }, feet: { x: 48, y: 84 } }, hitboxRatio: { w: 0.85, h: 0.88 }, shadowOffsetY: 4 },
            
            // ==================== 其他常用 ====================
            'pig': { canvasWidth: 64, canvasHeight: 64, modelOffsetX: 16, modelOffsetY: 20, modelWidth: 32, modelHeight: 32, anchor: { center: { x: 32, y: 36 }, feet: { x: 32, y: 52 } }, hitboxRatio: { w: 0.85, h: 0.9 }, shadowOffsetY: 2 },
            'sheep': { canvasWidth: 64, canvasHeight: 64, modelOffsetX: 14, modelOffsetY: 16, modelWidth: 36, modelHeight: 36, anchor: { center: { x: 32, y: 34 }, feet: { x: 32, y: 52 } }, hitboxRatio: { w: 0.8, h: 0.85 }, shadowOffsetY: 2 },
            'cat': { canvasWidth: 64, canvasHeight: 64, modelOffsetX: 18, modelOffsetY: 18, modelWidth: 28, modelHeight: 30, anchor: { center: { x: 32, y: 33 }, feet: { x: 32, y: 48 } }, hitboxRatio: { w: 0.75, h: 0.9 }, shadowOffsetY: 2 },
            'dog': { canvasWidth: 64, canvasHeight: 64, modelOffsetX: 16, modelOffsetY: 16, modelWidth: 32, modelHeight: 36, anchor: { center: { x: 32, y: 34 }, feet: { x: 32, y: 52 } }, hitboxRatio: { w: 0.8, h: 0.9 }, shadowOffsetY: 2 },
            'rabbit': { canvasWidth: 64, canvasHeight: 64, modelOffsetX: 18, modelOffsetY: 16, modelWidth: 28, modelHeight: 36, anchor: { center: { x: 32, y: 34 }, feet: { x: 32, y: 52 } }, hitboxRatio: { w: 0.7, h: 0.85 }, shadowOffsetY: 2 },
            'bird': { canvasWidth: 64, canvasHeight: 64, modelOffsetX: 22, modelOffsetY: 16, modelWidth: 20, modelHeight: 24, anchor: { center: { x: 32, y: 28 }, feet: { x: 32, y: 40 } }, hitboxRatio: { w: 0.7, h: 0.75 }, shadowOffsetY: 1 }
        };
        
        for (const [key, data] of Object.entries(defaults)) {
            this.metadata.set(key, data);
            // 同时设置描边版本
            const outlineColors = ['white', 'red', 'pink', 'orange', 'purple', 'gold', 'blue', 'cyan', 'green', 'lime', 'magenta', 'yellow'];
            for (const color of outlineColors) {
                this.metadata.set(`${key}_${color}`, data);
            }
        }
        
        console.log(`[SpriteDataRegistry] Setup ${Object.keys(defaults).length} default sprite configs`);
    }
}

// 创建全局实例
if (typeof window !== 'undefined') {
    window.spriteDataRegistry = new SpriteDataRegistry();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpriteDataRegistry;
}
