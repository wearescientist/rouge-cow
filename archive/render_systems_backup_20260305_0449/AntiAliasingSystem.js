// ============================================================
// v0.23-r26 - 抗锯齿与降噪系统 (Anti-Aliasing & Denoising System)
// HD-2D风格：FXAA快速近似抗锯齿、智能降噪、边缘平滑
// ============================================================

export class AntiAliasingSystem {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        // 抗锯齿配置
        this.config = {
            enableFXAA: true,
            enableMSAA: false,  // Canvas 2D不支持真正的MSAA
            subpixelQuality: 0.75,  // 子像素质量
            edgeThreshold: 0.166,   // 边缘检测阈值
            edgeThresholdMin: 0.083 // 最小边缘阈值
        };
        
        // 降噪配置
        this.denoising = {
            enabled: true,
            strength: 0.5,
            preserveDetails: true
        };
        
        // 历史帧混合（时间抗锯齿）
        this.historyBuffer = [];
        this.maxHistoryFrames = 2;
        
        // 边缘检测缓冲区
        this.edgeBuffer = document.createElement('canvas');
        this.edgeBuffer.width = width;
        this.edgeBuffer.height = height;
        this.edgeCtx = this.edgeBuffer.getContext('2d');
        
        this.time = 0;
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.edgeBuffer.width = width;
        this.edgeBuffer.height = height;
    }
    
    update(dt) {
        this.time += dt;
    }
    
    /**
     * FXAA快速近似抗锯齿
     */
    applyFXAA(ctx, width, height) {
        if (!this.config.enableFXAA) return;
        
        // 由于Canvas 2D无法直接操作像素着色器
        // 这里使用多重采样+模糊来近似FXAA效果
        ctx.save();
        
        // 1. 轻微的高斯模糊减少锯齿
        ctx.filter = 'blur(0.5px)';
        ctx.globalAlpha = 0.5;
        ctx.drawImage(ctx.canvas, 0, 0);
        
        // 2. 叠加原图保持锐度
        ctx.filter = 'none';
        ctx.globalAlpha = 0.5;
        ctx.drawImage(ctx.canvas, 0, 0);
        
        ctx.restore();
    }
    
    /**
     * 时间抗锯齿（TAA）
     */
    applyTAA(ctx, width, height) {
        // 保存当前帧到历史
        const currentFrame = document.createElement('canvas');
        currentFrame.width = width;
        currentFrame.height = height;
        currentFrame.getContext('2d').drawImage(ctx.canvas, 0, 0);
        
        this.historyBuffer.push(currentFrame);
        if (this.historyBuffer.length > this.maxHistoryFrames) {
            this.historyBuffer.shift();
        }
        
        if (this.historyBuffer.length < 2) return;
        
        // 混合历史帧
        ctx.save();
        ctx.globalAlpha = 0.1;
        
        this.historyBuffer.slice(0, -1).forEach((frame, index) => {
            const weight = 0.1 / (index + 1);
            ctx.globalAlpha = weight;
            ctx.drawImage(frame, 0, 0);
        });
        
        ctx.restore();
    }
    
    /**
     * 智能降噪
     */
    applyDenoising(ctx, width, height) {
        if (!this.denoising.enabled) return;
        
        ctx.save();
        
        // 使用双边滤波的概念（简化版）
        // 先进行轻微模糊去除噪点
        ctx.filter = `blur(${this.denoising.strength}px)`;
        ctx.globalAlpha = 0.3;
        ctx.globalCompositeOperation = 'screen';
        ctx.drawImage(ctx.canvas, 0, 0);
        
        // 恢复细节
        if (this.denoising.preserveDetails) {
            ctx.filter = 'none';
            ctx.globalAlpha = 0.7;
            ctx.globalCompositeOperation = 'overlay';
            ctx.drawImage(ctx.canvas, 0, 0);
        }
        
        ctx.restore();
    }
    
    /**
     * 边缘平滑
     */
    smoothEdges(ctx, width, height, entities, camera) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = 0.2;
        
        // 对实体边缘进行平滑
        entities.forEach(entity => {
            if (!entity || entity.hp <= 0) return;
            
            const pos = camera.worldToScreen(entity.x, entity.y);
            const size = (entity.size || 24) * camera.zoom;
            
            // 边缘光晕
            const gradient = ctx.createRadialGradient(
                pos.x, pos.y - size * 0.3, size * 0.5,
                pos.x, pos.y - size * 0.3, size * 0.8
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0.3)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y - size * 0.3, size * 0.8, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.restore();
    }
    
    /**
     * 子像素渲染优化
     */
    applySubpixelRendering(ctx, width, height) {
        // 模拟子像素抗锯齿
        ctx.save();
        
        // 水平方向轻微偏移（R通道）
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = 0.33;
        ctx.filter = 'blur(0.3px)';
        
        // 红色通道左偏
        ctx.fillStyle = '#ff0000';
        ctx.drawImage(ctx.canvas, -0.3, 0);
        
        // 蓝色通道右偏
        ctx.fillStyle = '#0000ff';
        ctx.drawImage(ctx.canvas, 0.3, 0);
        
        ctx.filter = 'none';
        ctx.restore();
    }
    
    /**
     * 综合抗锯齿处理
     */
    applyAntiAliasing(ctx, width, height, entities, camera) {
        // 1. FXAA
        this.applyFXAA(ctx, width, height);
        
        // 2. 边缘平滑
        if (entities && camera) {
            this.smoothEdges(ctx, width, height, entities, camera);
        }
        
        // 3. 降噪
        this.applyDenoising(ctx, width, height);
        
        // 4. 时间抗锯齿（可选）
        // this.applyTAA(ctx, width, height);
    }
    
    /**
     * 检测并标记锯齿边缘
     */
    detectEdges(sourceCanvas) {
        const w = this.edgeBuffer.width;
        const h = this.edgeBuffer.height;
        
        // 清空边缘缓冲区
        this.edgeCtx.fillStyle = '#000000';
        this.edgeCtx.fillRect(0, 0, w, h);
        
        // 绘制 Sobel 边缘检测（简化版）
        this.edgeCtx.drawImage(sourceCanvas, 0, 0, w, h);
        
        return this.edgeBuffer;
    }
    
    /**
     * 清理历史缓冲区
     */
    clearHistory() {
        this.historyBuffer = [];
    }
}
