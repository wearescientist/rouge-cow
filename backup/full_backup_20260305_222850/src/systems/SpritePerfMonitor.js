/**
 * SpritePerfMonitor.js - 贴图系统性能监控器
 * 实时监控渲染性能、内存使用、批次效率
 */

class SpritePerfMonitor {
    constructor() {
        this.stats = {
            // 渲染统计
            render: {
                drawCalls: 0,
                spritesRendered: 0,
                batchesUsed: 0,
                cullRate: 0
            },
            // 内存统计
            memory: {
                spriteDataCacheSize: 0,
                textureMemory: 0,
                totalEntities: 0
            },
            // 性能计时
            timing: {
                renderTime: 0,
                collisionTime: 0,
                cullTime: 0,
                lastFrameTime: 0
            },
            // 实体统计
            entities: {
                enemies: 0,
                bullets: 0,
                items: 0,
                particles: 0
            }
        };

        this.history = [];
        this.maxHistory = 60; // 保留60帧历史
        this.isEnabled = false;
        
        // 阈值警告
        this.thresholds = {
            drawCalls: { warn: 500, critical: 1000 },
            renderTime: { warn: 16, critical: 33 }, // ms
            memoryMB: { warn: 100, critical: 200 }
        };
    }

    /**
     * 启用/禁用监控
     */
    toggle() {
        this.isEnabled = !this.isEnabled;
        return this.isEnabled;
    }

    /**
     * 开始帧计时
     */
    beginFrame() {
        if (!this.isEnabled) return;
        this.stats.timing.lastFrameTime = performance.now();
        
        // 重置帧统计
        this.stats.render.drawCalls = 0;
        this.stats.render.spritesRendered = 0;
        this.stats.render.batchesUsed = 0;
    }

    /**
     * 结束帧计时
     */
    endFrame() {
        if (!this.isEnabled) return;
        
        const now = performance.now();
        const frameTime = now - this.stats.timing.lastFrameTime;
        
        // 记录历史
        this.history.push({
            time: now,
            frameTime: frameTime,
            drawCalls: this.stats.render.drawCalls,
            spritesRendered: this.stats.render.spritesRendered
        });
        
        // 限制历史长度
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
        
        return frameTime;
    }

    /**
     * 记录绘制调用
     * @param {string} type - 'sprite' | 'batch' | 'particle'
     * @param {number} count 
     */
    recordDrawCall(type, count = 1) {
        if (!this.isEnabled) return;
        
        this.stats.render.drawCalls += count;
        
        if (type === 'sprite' || type === 'batch') {
            this.stats.render.spritesRendered += count;
        }
    }

    /**
     * 记录批次使用
     * @param {number} batchCount 
     */
    recordBatches(batchCount) {
        if (!this.isEnabled) return;
        this.stats.render.batchesUsed = batchCount;
    }

    /**
     * 记录裁剪率
     * @param {number} visible 
     * @param {number} total 
     */
    recordCullRate(visible, total) {
        if (!this.isEnabled || total === 0) return;
        this.stats.render.cullRate = (1 - visible / total) * 100;
    }

    /**
     * 更新内存统计
     */
    updateMemoryStats() {
        if (!this.isEnabled) return;
        
        // SpriteData 缓存大小
        if (window.spriteDataRegistry) {
            const cacheStats = window.spriteDataRegistry.getCacheStats();
            this.stats.memory.spriteDataCacheSize = cacheStats.size;
            this.stats.memory.textureMemory = cacheStats.memoryEstimateKB;
        }
    }

    /**
     * 更新实体统计
     * @param {Object} counts 
     */
    updateEntityCounts(counts) {
        if (!this.isEnabled) return;
        
        this.stats.entities = {
            enemies: counts.enemies || 0,
            bullets: counts.bullets || 0,
            items: counts.items || 0,
            particles: counts.particles || 0
        };
        
        this.stats.memory.totalEntities = 
            this.stats.entities.enemies + 
            this.stats.entities.bullets + 
            this.stats.entities.items + 
            this.stats.entities.particles;
    }

    /**
     * 检查性能警告
     * @returns {Array} 警告列表
     */
    checkWarnings() {
        const warnings = [];
        
        if (this.stats.render.drawCalls > this.thresholds.drawCalls.critical) {
            warnings.push({ level: 'critical', msg: `Draw calls too high: ${this.stats.render.drawCalls}` });
        } else if (this.stats.render.drawCalls > this.thresholds.drawCalls.warn) {
            warnings.push({ level: 'warn', msg: `Draw calls high: ${this.stats.render.drawCalls}` });
        }
        
        const avgFrameTime = this.getAverageFrameTime();
        if (avgFrameTime > this.thresholds.renderTime.critical) {
            warnings.push({ level: 'critical', msg: `Frame time too high: ${avgFrameTime.toFixed(2)}ms` });
        } else if (avgFrameTime > this.thresholds.renderTime.warn) {
            warnings.push({ level: 'warn', msg: `Frame time high: ${avgFrameTime.toFixed(2)}ms` });
        }
        
        return warnings;
    }

    /**
     * 获取平均帧时间
     * @returns {number}
     */
    getAverageFrameTime() {
        if (this.history.length === 0) return 0;
        const sum = this.history.reduce((a, b) => a + b.frameTime, 0);
        return sum / this.history.length;
    }

    /**
     * 获取平均FPS
     * @returns {number}
     */
    getAverageFPS() {
        const avgFrameTime = this.getAverageFrameTime();
        return avgFrameTime > 0 ? 1000 / avgFrameTime : 0;
    }

    /**
     * 渲染调试面板
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} x 
     * @param {number} y 
     */
    renderDebugPanel(ctx, x = 10, y = 10) {
        if (!this.isEnabled) return;
        
        const lineHeight = 18;
        const padding = 10;
        const lines = [
            `=== Sprite System Perf ===`,
            `FPS: ${this.getAverageFPS().toFixed(1)}`,
            `Frame: ${this.getAverageFrameTime().toFixed(2)}ms`,
            `Draw Calls: ${this.stats.render.drawCalls}`,
            `Sprites: ${this.stats.render.spritesRendered}`,
            `Batches: ${this.stats.render.batchesUsed}`,
            `Cull Rate: ${this.stats.render.cullRate.toFixed(1)}%`,
            ``,
            `Entities:`,
            `  Enemies: ${this.stats.entities.enemies}`,
            `  Bullets: ${this.stats.entities.bullets}`,
            `  Items: ${this.stats.entities.items}`,
            `  Particles: ${this.stats.entities.particles}`,
            ``,
            `Memory:`,
            `  Cache: ${this.stats.memory.spriteDataCacheSize}`,
            `  Est: ${this.stats.memory.textureMemory}KB`
        ];
        
        // 背景
        const width = 200;
        const height = lines.length * lineHeight + padding * 2;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(x, y, width, height);
        
        // 文字
        ctx.font = '12px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        lines.forEach((line, i) => {
            // 标题高亮
            if (line.startsWith('=')) {
                ctx.fillStyle = '#4a9';
            } else if (line.includes('critical')) {
                ctx.fillStyle = '#f44';
            } else if (line.includes('warn')) {
                ctx.fillStyle = '#fa4';
            } else {
                ctx.fillStyle = '#ccc';
            }
            
            ctx.fillText(line, x + padding, y + padding + i * lineHeight);
        });
        
        // 渲染警告
        const warnings = this.checkWarnings();
        if (warnings.length > 0) {
            const warnY = y + height + 10;
            warnings.forEach((warn, i) => {
                ctx.fillStyle = warn.level === 'critical' ? '#f44' : '#fa4';
                ctx.fillText(`⚠ ${warn.msg}`, x, warnY + i * lineHeight);
            });
        }
    }

    /**
     * 获取性能报告
     * @returns {Object}
     */
    getReport() {
        return {
            current: this.stats,
            average: {
                frameTime: this.getAverageFrameTime(),
                fps: this.getAverageFPS(),
                drawCalls: this.history.length > 0 ? 
                    this.history.reduce((a, b) => a + b.drawCalls, 0) / this.history.length : 0
            },
            warnings: this.checkWarnings()
        };
    }

    /**
     * 重置统计
     */
    reset() {
        this.history = [];
        this.stats = {
            render: { drawCalls: 0, spritesRendered: 0, batchesUsed: 0, cullRate: 0 },
            memory: { spriteDataCacheSize: 0, textureMemory: 0, totalEntities: 0 },
            timing: { renderTime: 0, collisionTime: 0, cullTime: 0, lastFrameTime: 0 },
            entities: { enemies: 0, bullets: 0, items: 0, particles: 0 }
        };
    }
}

// 创建全局实例
if (typeof window !== 'undefined') {
    window.spritePerfMonitor = new SpritePerfMonitor();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpritePerfMonitor;
}
