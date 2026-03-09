// ============================================================
// v0.23-r25 - 最终合成系统 (Final Composite System)
// HD-2D风格：渲染管线整合、性能优化、自适应质量
// ============================================================

export class FinalCompositeSystem {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        // 渲染管线配置
        this.pipeline = {
            enableBloom: true,
            enableSSAO: true,
            enableDOF: false,  // 性能消耗大，默认关闭
            enableSSR: false,  // 性能消耗大，默认关闭
            enableWeather: true,
            enablePostProcess: true
        };
        
        // 质量设置
        this.quality = 'high';  // low, medium, high, ultra
        this.targetFPS = 60;
        this.currentFPS = 60;
        
        // 性能监控
        this.performance = {
            frameTime: 0,
            lastFrame: 0,
            fpsHistory: [],
            avgFPS: 60
        };
        
        // 渲染统计
        this.stats = {
            drawCalls: 0,
            triangles: 0,
            effectsApplied: 0
        };
        
        // 后处理链
        this.effectChain = [];
        
        this.time = 0;
        this.frameCount = 0;
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
    }
    
    update(dt) {
        this.time += dt;
        this.frameCount++;
        
        // 更新FPS统计
        this.updatePerformance(dt);
        
        // 自适应质量调整
        this.adaptiveQuality();
    }
    
    updatePerformance(dt) {
        const now = performance.now();
        const frameTime = now - this.performance.lastFrame;
        this.performance.lastFrame = now;
        
        this.performance.frameTime = frameTime;
        this.currentFPS = 1000 / frameTime;
        
        this.performance.fpsHistory.push(this.currentFPS);
        if (this.performance.fpsHistory.length > 30) {
            this.performance.fpsHistory.shift();
        }
        
        // 计算平均FPS
        const sum = this.performance.fpsHistory.reduce((a, b) => a + b, 0);
        this.performance.avgFPS = sum / this.performance.fpsHistory.length;
    }
    
    /**
     * 自适应质量调整
     */
    adaptiveQuality() {
        // 每60帧检查一次性能
        if (this.frameCount % 60 !== 0) return;
        
        const avgFPS = this.performance.avgFPS;
        
        if (avgFPS < 30 && this.quality !== 'low') {
            // 性能不足，降低质量
            this.setQuality('medium');
        } else if (avgFPS < 45 && this.quality === 'high') {
            this.setQuality('medium');
        } else if (avgFPS > 55 && this.quality === 'medium') {
            // 性能良好，提升质量
            this.setQuality('high');
        }
    }
    
    setQuality(level) {
        this.quality = level;
        
        switch(level) {
            case 'low':
                this.pipeline.enableBloom = false;
                this.pipeline.enableDOF = false;
                this.pipeline.enableSSR = false;
                this.pipeline.enableWeather = true;
                break;
            case 'medium':
                this.pipeline.enableBloom = true;
                this.pipeline.enableDOF = false;
                this.pipeline.enableSSR = false;
                this.pipeline.enableWeather = true;
                break;
            case 'high':
                this.pipeline.enableBloom = true;
                this.pipeline.enableDOF = false;
                this.pipeline.enableSSR = false;
                this.pipeline.enableWeather = true;
                break;
            case 'ultra':
                this.pipeline.enableBloom = true;
                this.pipeline.enableDOF = true;
                this.pipeline.enableSSR = true;
                this.pipeline.enableWeather = true;
                break;
        }
    }
    
    /**
     * 渲染管线主入口
     */
    render(ctx, width, height, renderCallback, systems) {
        this.stats.drawCalls = 0;
        this.stats.effectsApplied = 0;
        
        // 1. 基础渲染
        renderCallback();
        this.stats.drawCalls++;
        
        // 2. 应用效果链
        this.applyEffectChain(ctx, width, height, systems);
        
        // 3. 绘制性能统计（调试用）
        if (window.SHOW_PERF_STATS) {
            this.drawPerfStats(ctx, width, height);
        }
    }
    
    applyEffectChain(ctx, width, height, systems) {
        const { 
            bloomSystem, 
            ssaoSystem, 
            dofSystem, 
            ssrSystem,
            weatherSystem,
            postProcessSystem 
        } = systems;
        
        // 按质量级别应用效果
        switch(this.quality) {
            case 'ultra':
                if (this.pipeline.enableSSR && ssrSystem) {
                    ssrSystem.applyReflection(ctx, ctx.canvas, { worldToScreen: (x, y) => ({x, y}) });
                    this.stats.effectsApplied++;
                }
                // fallthrough
            case 'high':
                if (this.pipeline.enableDOF && dofSystem) {
                    // DOF实现
                    this.stats.effectsApplied++;
                }
                if (this.pipeline.enableBloom && bloomSystem) {
                    // 高画质bloom
                    this.stats.effectsApplied++;
                }
                break;
            case 'medium':
                if (this.pipeline.enableBloom && bloomSystem) {
                    // 简化bloom
                    this.stats.effectsApplied++;
                }
                break;
            case 'low':
                // 仅基础效果
                break;
        }
        
        // 天气效果（所有级别）
        if (this.pipeline.enableWeather && weatherSystem) {
            weatherSystem.draw(ctx, width, height);
            this.stats.effectsApplied++;
        }
        
        // 最终后处理
        if (this.pipeline.enablePostProcess && postProcessSystem) {
            postProcessSystem.apply(ctx, width, height);
            this.stats.effectsApplied++;
        }
    }
    
    /**
     * 批量渲染优化
     */
    batchRender(ctx, renderList, camera) {
        // 按材质/深度排序
        const sorted = renderList.sort((a, b) => {
            if (a.material !== b.material) {
                return a.material.localeCompare(b.material);
            }
            return b.depth - a.depth;
        });
        
        let lastMaterial = null;
        
        sorted.forEach(item => {
            // 材质状态切换最小化
            if (item.material !== lastMaterial) {
                ctx.save();
                lastMaterial = item.material;
            }
            
            // 渲染
            item.render(ctx, camera);
            this.stats.drawCalls++;
        });
        
        ctx.restore();
    }
    
    /**
     * 视锥体剔除
     */
    frustumCull(entities, camera) {
        const bounds = camera.getViewportBounds ? camera.getViewportBounds() : {
            minX: camera.x - this.width / 2,
            maxX: camera.x + this.width / 2,
            minY: camera.y - this.height / 2,
            maxY: camera.y + this.height / 2
        };
        
        const margin = 100;
        
        return entities.filter(e => {
            return e.x >= bounds.minX - margin &&
                   e.x <= bounds.maxX + margin &&
                   e.y >= bounds.minY - margin &&
                   e.y <= bounds.maxY + margin;
        });
    }
    
    /**
     * LOD（细节层次）管理
     */
    getLODLevel(distance) {
        switch(this.quality) {
            case 'ultra':
                return distance < 500 ? 0 : (distance < 1000 ? 1 : 2);
            case 'high':
                return distance < 400 ? 0 : (distance < 800 ? 1 : 2);
            case 'medium':
                return distance < 300 ? 0 : 2;
            case 'low':
                return 2;
            default:
                return 0;
        }
    }
    
    /**
     * 绘制性能统计
     */
    drawPerfStats(ctx, width, height) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, 10, 200, 100);
        
        ctx.fillStyle = '#00ff00';
        ctx.font = '12px monospace';
        ctx.fillText(`FPS: ${Math.round(this.currentFPS)}`, 20, 30);
        ctx.fillText(`Avg: ${Math.round(this.performance.avgFPS)}`, 20, 50);
        ctx.fillText(`Quality: ${this.quality}`, 20, 70);
        ctx.fillText(`Effects: ${this.stats.effectsApplied}`, 20, 90);
        
        ctx.restore();
    }
    
    /**
     * 转场效果
     */
    drawTransition(ctx, width, height, progress, type = 'fade') {
        ctx.save();
        
        switch(type) {
            case 'fade':
                ctx.fillStyle = `rgba(0, 0, 0, ${progress})`;
                ctx.fillRect(0, 0, width, height);
                break;
            case 'wipe':
                ctx.fillStyle = '#000000';
                ctx.fillRect(0, 0, width * progress, height);
                break;
            case 'circle':
                const radius = Math.max(width, height) * progress;
                ctx.fillStyle = '#000000';
                ctx.beginPath();
                ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'pixelate':
                // 像素化转场
                const pixelSize = Math.floor(1 + progress * 20);
                ctx.imageSmoothingEnabled = false;
                ctx.drawImage(ctx.canvas, 
                    0, 0, width / pixelSize, height / pixelSize,
                    0, 0, width, height
                );
                ctx.imageSmoothingEnabled = true;
                break;
        }
        
        ctx.restore();
    }
    
    /**
     * 暂停/恢复渲染
     */
    pause() {
        this.paused = true;
    }
    
    resume() {
        this.paused = false;
        this.performance.lastFrame = performance.now();
    }
    
    /**
     * 清理资源
     */
    dispose() {
        this.effectChain = [];
        this.performance.fpsHistory = [];
    }
}
