/**
 * SpriteAutoAdapter.js - 自动适配系统
 * 根据设备性能和游戏场景动态调整渲染质量
 */

class SpriteAutoAdapter {
    constructor() {
        this.qualityLevels = {
            ultra: { scale: 1.5, particleLimit: 500, effectQuality: 'high', shadowQuality: 'high' },
            high: { scale: 1.25, particleLimit: 300, effectQuality: 'high', shadowQuality: 'medium' },
            medium: { scale: 1.0, particleLimit: 200, effectQuality: 'medium', shadowQuality: 'medium' },
            low: { scale: 0.75, particleLimit: 100, effectQuality: 'low', shadowQuality: 'low' },
            minimal: { scale: 0.5, particleLimit: 50, effectQuality: 'minimal', shadowQuality: 'none' }
        };
        
        this.currentQuality = 'medium';
        this.targetFPS = 60;
        this.adaptationInterval = 2000; // 每2秒评估一次
        this.lastAdaptation = 0;
        
        // 性能历史
        this.fpsHistory = [];
        this.maxHistory = 30;
        
        // 场景复杂度检测
        this.sceneComplexity = 'normal';
        this.complexityThresholds = {
            simple: 20,    // <20 entities
            normal: 50,    // 20-50 entities
            complex: 100,  // 50-100 entities
            extreme: 101   // >100 entities
        };
    }

    /**
     * 初始化适配系统
     */
    init() {
        // 检测设备性能
        this.detectDeviceCapabilities();
        
        // 设置初始质量
        this.setInitialQuality();
        
        // 启动自适应循环
        this.startAdaptationLoop();
        
        console.log(`[SpriteAutoAdapter] Initialized with quality: ${this.currentQuality}`);
    }

    /**
     * 检测设备能力
     */
    detectDeviceCapabilities() {
        // 检测是否为移动设备
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // 检测设备内存（如果可用）
        this.deviceMemory = navigator.deviceMemory || 4;
        
        // 检测硬件并发
        this.hardwareConcurrency = navigator.hardwareConcurrency || 2;
        
        // 检测屏幕分辨率
        this.screenPixels = window.screen.width * window.screen.height;
        
        console.log(`[SpriteAutoAdapter] Device: ${this.isMobile ? 'Mobile' : 'Desktop'}, ` +
                    `Memory: ${this.deviceMemory}GB, Cores: ${this.hardwareConcurrency}`);
    }

    /**
     * 设置初始质量
     */
    setInitialQuality() {
        if (this.isMobile) {
            // 移动设备保守设置
            if (this.deviceMemory >= 6 && this.hardwareConcurrency >= 6) {
                this.currentQuality = 'high';
            } else if (this.deviceMemory >= 4) {
                this.currentQuality = 'medium';
            } else {
                this.currentQuality = 'low';
            }
        } else {
            // PC 根据配置设置
            if (this.deviceMemory >= 8 && this.hardwareConcurrency >= 6) {
                this.currentQuality = 'ultra';
            } else if (this.deviceMemory >= 6) {
                this.currentQuality = 'high';
            } else {
                this.currentQuality = 'medium';
            }
        }
        
        this.applyQuality(this.currentQuality);
    }

    /**
     * 启动自适应循环
     */
    startAdaptationLoop() {
        setInterval(() => {
            this.evaluateAndAdapt();
        }, this.adaptationInterval);
    }

    /**
     * 评估性能并调整
     */
    evaluateAndAdapt() {
        if (!window.spritePerfMonitor || !window.spritePerfMonitor.isEnabled) {
            return;
        }
        
        const fps = window.spritePerfMonitor.getAverageFPS();
        this.fpsHistory.push(fps);
        
        if (this.fpsHistory.length > this.maxHistory) {
            this.fpsHistory.shift();
        }
        
        // 计算平均FPS
        const avgFPS = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
        
        // 根据FPS调整质量
        if (avgFPS < 30 && this.currentQuality !== 'minimal') {
            this.decreaseQuality();
        } else if (avgFPS > 55 && this.canIncreaseQuality()) {
            this.increaseQuality();
        }
        
        // 根据场景复杂度调整
        this.adaptToSceneComplexity();
    }

    /**
     * 根据场景复杂度调整
     */
    adaptToSceneComplexity() {
        if (!window.spritePerfMonitor) return;
        
        const entities = window.spritePerfMonitor.stats.memory.totalEntities;
        let newComplexity = 'normal';
        
        if (entities < this.complexityThresholds.simple) {
            newComplexity = 'simple';
        } else if (entities < this.complexityThresholds.normal) {
            newComplexity = 'normal';
        } else if (entities < this.complexityThresholds.complex) {
            newComplexity = 'complex';
        } else {
            newComplexity = 'extreme';
        }
        
        if (newComplexity !== this.sceneComplexity) {
            this.sceneComplexity = newComplexity;
            this.onComplexityChange(newComplexity);
        }
    }

    /**
     * 场景复杂度变化处理
     * @param {string} complexity 
     */
    onComplexityChange(complexity) {
        console.log(`[SpriteAutoAdapter] Scene complexity changed to: ${complexity}`);
        
        switch (complexity) {
            case 'extreme':
                // 极端场景：强制降低质量
                if (this.qualityLevels[this.currentQuality].scale > 1.0) {
                    this.applyQuality('medium');
                }
                // 减少粒子数量
                if (window.effectSpriteData) {
                    window.effectSpriteData.particleLimit = 50;
                }
                break;
            case 'complex':
                // 复杂场景：稍微降低效果
                if (window.effectSpriteData) {
                    window.effectSpriteData.particleLimit = 100;
                }
                break;
            case 'simple':
                // 简单场景：可以提升效果
                if (window.effectSpriteData) {
                    window.effectSpriteData.particleLimit = this.qualityLevels[this.currentQuality].particleLimit;
                }
                break;
        }
    }

    /**
     * 降低质量
     */
    decreaseQuality() {
        const levels = ['ultra', 'high', 'medium', 'low', 'minimal'];
        const currentIndex = levels.indexOf(this.currentQuality);
        
        if (currentIndex < levels.length - 1) {
            const newQuality = levels[currentIndex + 1];
            this.applyQuality(newQuality);
            console.log(`[SpriteAutoAdapter] Quality decreased to: ${newQuality}`);
        }
    }

    /**
     * 提升质量
     */
    increaseQuality() {
        const levels = ['ultra', 'high', 'medium', 'low', 'minimal'];
        const currentIndex = levels.indexOf(this.currentQuality);
        
        if (currentIndex > 0) {
            const newQuality = levels[currentIndex - 1];
            this.applyQuality(newQuality);
            console.log(`[SpriteAutoAdapter] Quality increased to: ${newQuality}`);
        }
    }

    /**
     * 是否可以提升质量
     */
    canIncreaseQuality() {
        // 基于设备能力检查
        if (this.isMobile && this.currentQuality === 'high') {
            return false;
        }
        return true;
    }

    /**
     * 应用质量设置
     * @param {string} quality 
     */
    applyQuality(quality) {
        this.currentQuality = quality;
        const settings = this.qualityLevels[quality];
        
        // 应用到 SpriteScaleManager
        if (window.spriteScaleManager) {
            window.spriteScaleManager.currentScale = settings.scale;
        }
        
        // 应用到 EffectSpriteData
        if (window.effectSpriteData) {
            window.effectSpriteData.particleLimit = settings.particleLimit;
        }
        
        // 应用到 ShadowSystem
        if (window.game && window.game.shadowSystem) {
            window.game.shadowSystem.enabled = settings.shadowQuality !== 'none';
        }
    }

    /**
     * 手动设置质量
     * @param {string} quality 
     */
    setQuality(quality) {
        if (this.qualityLevels[quality]) {
            this.applyQuality(quality);
            // 禁用自动适配
            this.fpsHistory = [];
        }
    }

    /**
     * 获取当前设置
     * @returns {Object}
     */
    getCurrentSettings() {
        return {
            quality: this.currentQuality,
            ...this.qualityLevels[this.currentQuality],
            sceneComplexity: this.sceneComplexity
        };
    }

    /**
     * 快速适配模式（用于战斗激烈时）
     */
    enableCombatMode() {
        // 临时降低质量以保持稳定帧率
        this.tempQuality = this.currentQuality;
        if (this.currentQuality === 'ultra' || this.currentQuality === 'high') {
            this.applyQuality('medium');
        }
    }

    /**
     * 恢复常规模式
     */
    disableCombatMode() {
        if (this.tempQuality) {
            this.applyQuality(this.tempQuality);
            this.tempQuality = null;
        }
    }

    /**
     * 渲染质量指示器
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} x 
     * @param {number} y 
     */
    renderQualityIndicator(ctx, x = 10, y = 100) {
        const settings = this.qualityLevels[this.currentQuality];
        
        // 颜色根据质量变化
        const colors = {
            ultra: '#f0f',
            high: '#4f4',
            medium: '#ff4',
            low: '#fa4',
            minimal: '#f44'
        };
        
        ctx.fillStyle = colors[this.currentQuality] || '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`Quality: ${this.currentQuality.toUpperCase()}`, x, y);
        ctx.font = '10px Arial';
        ctx.fillText(`Scale: ${settings.scale}x | Particles: ${settings.particleLimit}`, x, y + 14);
        ctx.fillText(`Scene: ${this.sceneComplexity}`, x, y + 28);
    }
}

// 创建全局实例
if (typeof window !== 'undefined') {
    window.spriteAutoAdapter = new SpriteAutoAdapter();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpriteAutoAdapter;
}
