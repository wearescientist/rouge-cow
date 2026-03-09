/**
 * SpriteScaleManager.js - 精灵缩放管理器
 * 根据屏幕分辨率和设备像素比动态调整渲染缩放
 */

class SpriteScaleManager {
    constructor() {
        this.baseResolution = { width: 1920, height: 1080 };
        this.baseScale = 1.0;
        this.minScale = 0.5;
        this.maxScale = 2.0;
        this.devicePixelRatio = window.devicePixelRatio || 1;
        
        // 质量等级设置
        this.qualitySettings = {
            low: { scale: 0.75, shadowQuality: 'low', useMipmaps: false },
            medium: { scale: 1.0, shadowQuality: 'medium', useMipmaps: true },
            high: { scale: 1.25, shadowQuality: 'high', useMipmaps: true },
            ultra: { scale: 1.5, shadowQuality: 'high', useMipmaps: true }
        };
        
        this.currentQuality = 'medium';
        this.currentScale = 1.0;
    }

    /**
     * 初始化并计算最佳缩放
     * @param {number} screenWidth 
     * @param {number} screenHeight 
     * @param {string} qualityPreference - 'auto' | 'low' | 'medium' | 'high' | 'ultra'
     */
    init(screenWidth, screenHeight, qualityPreference = 'auto') {
        if (qualityPreference !== 'auto') {
            this.setQuality(qualityPreference);
            return;
        }
        
        // 自动检测最佳质量
        const pixelCount = screenWidth * screenHeight;
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        if (isMobile) {
            // 移动设备保守设置
            if (pixelCount > 2073600) { // > 1080p
                this.setQuality('medium');
            } else {
                this.setQuality('low');
            }
        } else {
            // PC 根据分辨率设置
            if (pixelCount > 8294400) { // > 4K
                this.setQuality('ultra');
            } else if (pixelCount > 2073600) { // > 1080p
                this.setQuality('high');
            } else {
                this.setQuality('medium');
            }
        }
        
        // 根据设备性能调整
        this.adjustForPerformance();
    }

    /**
     * 设置质量等级
     * @param {string} quality 
     */
    setQuality(quality) {
        if (!this.qualitySettings[quality]) {
            console.warn(`[SpriteScaleManager] Unknown quality: ${quality}`);
            return;
        }
        
        this.currentQuality = quality;
        const settings = this.qualitySettings[quality];
        
        // 计算最终缩放
        this.currentScale = settings.scale * this.devicePixelRatio;
        this.currentScale = Math.max(this.minScale, Math.min(this.maxScale, this.currentScale));
        
        console.log(`[SpriteScaleManager] Quality set to ${quality}, scale: ${this.currentScale.toFixed(2)}`);
    }

    /**
     * 根据性能自动调整
     */
    adjustForPerformance() {
        // 检测帧率并动态调整
        if (window.game && window.game.perfMonitor) {
            const fps = window.game.perfMonitor.fps;
            
            if (fps < 30 && this.currentQuality !== 'low') {
                console.log('[SpriteScaleManager] Low FPS detected, reducing quality');
                this.setQuality('low');
            } else if (fps > 55 && this.currentQuality === 'low') {
                console.log('[SpriteScaleManager] Good FPS, increasing quality');
                this.setQuality('medium');
            }
        }
    }

    /**
     * 获取实体的渲染缩放
     * @param {Object} entity - 实体对象
     * @param {SpriteData} spriteData 
     * @returns {number}
     */
    getEntityScale(entity, spriteData = null) {
        // 基础缩放
        let baseScale = entity.baseScale || 1.0;
        
        // Boss 特殊处理
        if (entity.isBoss) {
            baseScale *= 1.5;
        }
        
        // 如果有 SpriteData，根据模型高度调整
        if (spriteData) {
            const targetHeight = entity.targetHeight || 32;
            const modelScale = targetHeight / spriteData.modelHeight;
            baseScale *= modelScale;
        }
        
        // 应用全局质量缩放
        return baseScale * this.currentScale;
    }

    /**
     * 获取当前缩放
     * @returns {number}
     */
    getScale() {
        return this.currentScale;
    }

    /**
     * 获取当前质量设置
     * @returns {Object}
     */
    getCurrentSettings() {
        return this.qualitySettings[this.currentQuality];
    }

    /**
     * 监听窗口大小变化
     */
    setupResizeListener() {
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                this.init(window.innerWidth, window.innerHeight, 'auto');
            }, 250);
        });
    }

    /**
     * 获取推荐的目标高度
     * @param {string} entityType - 'player' | 'enemy' | 'boss' | 'pet'
     * @returns {number}
     */
    getTargetHeight(entityType) {
        const heights = {
            player: 48,
            enemy: 32,
            boss: 54,
            pet: 28,
            item: 16
        };
        return heights[entityType] || 32;
    }
}

// 创建全局实例
if (typeof window !== 'undefined') {
    window.spriteScaleManager = new SpriteScaleManager();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpriteScaleManager;
}
