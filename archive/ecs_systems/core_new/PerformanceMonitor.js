/**
 * PerformanceMonitor - 性能监控器
 * 实时监控游戏性能指标：FPS、内存、帧时间
 * v0.22.1 - Phase 2 重构
 */

class PerformanceMonitor {
    constructor() {
        // FPS 计算
        this.frameCount = 0;
        this.lastTime = performance.now();
        this.fps = 60;
        this.fpsHistory = [];
        this.maxHistory = 60;
        
        // 帧时间
        this.frameTime = 0;
        this.frameTimeHistory = [];
        
        // 内存监控（如果浏览器支持）
        this.memorySupported = 'memory' in performance;
        this.memoryHistory = [];
        
        // 是否显示调试面板
        this.visible = false;
        this.canvas = null;
        this.ctx = null;
        
        // 性能警告阈值
        this.thresholds = {
            fps: { warning: 30, critical: 20 },
            frameTime: { warning: 33, critical: 50 }, // ms
            memory: { warning: 150, critical: 200 } // MB
        };
        
        // 警告回调
        this.onWarning = null;
    }

    /**
     * 初始化调试面板
     */
    initDisplay(canvasId = 'perfCanvas') {
        let canvas = document.getElementById(canvasId);
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = canvasId;
            canvas.style.cssText = 'position:fixed;top:10px;right:10px;width:200px;height:100px;background:rgba(0,0,0,0.8);z-index:9999;border:1px solid #444;';
            document.body.appendChild(canvas);
        }
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.canvas.width = 200;
        this.canvas.height = 100;
        return this;
    }

    /**
     * 每帧调用，更新性能数据
     * @param {number} deltaTime - 上一帧时间 (ms)
     */
    tick(deltaTime) {
        const now = performance.now();
        this.frameCount++;
        this.frameTime = deltaTime;
        
        // 每秒计算一次 FPS
        if (now - this.lastTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastTime = now;
            
            // 保存历史
            this.fpsHistory.push(this.fps);
            if (this.fpsHistory.length > this.maxHistory) {
                this.fpsHistory.shift();
            }
            
            // 检查性能警告
            this._checkWarnings();
        }
        
        // 保存帧时间历史
        this.frameTimeHistory.push(deltaTime);
        if (this.frameTimeHistory.length > this.maxHistory) {
            this.frameTimeHistory.shift();
        }
        
        // 内存监控
        if (this.memorySupported && this.frameCount % 30 === 0) {
            const mem = performance.memory;
            const usedMB = mem.usedJSHeapSize / 1048576;
            this.memoryHistory.push(usedMB);
            if (this.memoryHistory.length > 30) {
                this.memoryHistory.shift();
            }
        }
        
        // 绘制调试面板
        if (this.visible && this.ctx) {
            this._draw();
        }
    }

    /**
     * 显示/隐藏调试面板
     */
    toggle() {
        this.visible = !this.visible;
        if (this.canvas) {
            this.canvas.style.display = this.visible ? 'block' : 'none';
        }
        return this.visible;
    }

    /**
     * 设置警告回调
     * @param {Function} callback - (type, value, threshold) => void
     */
    setOnWarning(callback) {
        this.onWarning = callback;
    }

    /**
     * 获取性能摘要
     * @returns {Object}
     */
    getSummary() {
        const avgFrameTime = this.frameTimeHistory.length > 0 
            ? this.frameTimeHistory.reduce((a, b) => a + b, 0) / this.frameTimeHistory.length 
            : 0;
        
        const avgFps = this.fpsHistory.length > 0
            ? this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length
            : 60;
        
        return {
            fps: this.fps,
            avgFps: Math.round(avgFps),
            frameTime: Math.round(this.frameTime * 10) / 10,
            avgFrameTime: Math.round(avgFrameTime * 10) / 10,
            memory: this.memorySupported ? Math.round(this.memoryHistory[this.memoryHistory.length - 1] || 0) : null,
            memorySupported: this.memorySupported
        };
    }

    /**
     * 检查性能警告
     */
    _checkWarnings() {
        if (!this.onWarning) return;
        
        if (this.fps < this.thresholds.fps.critical) {
            this.onWarning('fps', this.fps, this.thresholds.fps.critical);
        } else if (this.fps < this.thresholds.fps.warning) {
            this.onWarning('fps_warning', this.fps, this.thresholds.fps.warning);
        }
    }

    /**
     * 绘制调试面板
     */
    _draw() {
        const ctx = this.ctx;
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        // 清空
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, w, h);
        
        // FPS 文本
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'left';
        
        const fpsColor = this.fps >= 50 ? '#4f4' : this.fps >= 30 ? '#fa0' : '#f44';
        ctx.fillStyle = fpsColor;
        ctx.fillText(`FPS: ${this.fps}`, 5, 15);
        
        // 帧时间
        ctx.fillStyle = '#fff';
        ctx.fillText(`Frame: ${this.frameTime.toFixed(1)}ms`, 70, 15);
        
        // FPS 历史图表
        if (this.fpsHistory.length > 1) {
            ctx.strokeStyle = fpsColor;
            ctx.lineWidth = 1;
            ctx.beginPath();
            
            const chartH = 40;
            const chartY = 25;
            const step = (w - 10) / (this.maxHistory - 1);
            
            for (let i = 0; i < this.fpsHistory.length; i++) {
                const fps = this.fpsHistory[i];
                const x = 5 + i * step;
                const y = chartY + chartH - (fps / 60) * chartH;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            ctx.stroke();
        }
        
        // 内存信息
        if (this.memorySupported && this.memoryHistory.length > 0) {
            const mem = this.memoryHistory[this.memoryHistory.length - 1];
            ctx.fillStyle = mem > 100 ? '#fa0' : '#fff';
            ctx.fillText(`Memory: ${mem.toFixed(1)}MB`, 5, 85);
        }
        
        // 边框
        ctx.strokeStyle = '#444';
        ctx.strokeRect(0, 0, w, h);
    }
}

// 全局单例
window.PerformanceMonitor = PerformanceMonitor;
window.perfMonitor = new PerformanceMonitor();
