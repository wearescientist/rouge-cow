// ============================================================
// v0.24 - HD-2D合成器 (HD-2D Compositor)
// 八方旅人风格渲染管线：将2D像素与3D效果完美融合
// ============================================================

export class HD2DCompositor {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        // 渲染目标
        this.sceneCanvas = document.createElement('canvas');
        this.sceneCanvas.width = width;
        this.sceneCanvas.height = height;
        this.sceneCtx = this.sceneCanvas.getContext('2d');
        
        // 光照贴图
        this.lightCanvas = document.createElement('canvas');
        this.lightCanvas.width = Math.floor(width / 2);
        this.lightCanvas.height = Math.floor(height / 2);
        this.lightCtx = this.lightCanvas.getContext('2d');
        
        // v0.24-r5: 优化后处理效果强度
        this.effects = {
            pixelSnap: true,          // 像素对齐
            depthOfField: 0.2,        // 轻微景深
            chromaticAberration: 0.3, // 轻微色差
            vignette: 0.2,            // 轻微暗角
            filmGrain: 0.01,          // 轻微胶片颗粒
            bloom: 0.4                // 辉光强度
        };
        
        // 性能优化
        this.frameSkip = 0;
        this.maxFrameSkip = 2;  // 每3帧更新一次昂贵效果
        
        this.time = 0;
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.sceneCanvas.width = width;
        this.sceneCanvas.height = height;
        this.lightCanvas.width = Math.floor(width / 2);
        this.lightCanvas.height = Math.floor(height / 2);
    }
    
    /**
     * 开始场景渲染
     */
    beginScene(ctx) {
        // 清空场景画布
        this.sceneCtx.clearRect(0, 0, this.width, this.height);
        
        // 返回场景上下文供绘制使用
        return this.sceneCtx;
    }
    
    /**
     * 结束场景渲染，应用后处理
     */
    endScene(ctx) {
        this.frameSkip = (this.frameSkip + 1) % (this.maxFrameSkip + 1);
        const isFullFrame = this.frameSkip === 0;
        
        // 1. 像素化效果（确保像素清晰）- 每帧执行
        if (this.effects.pixelSnap) {
            this.applyPixelSnap();
        }
        
        // 2. 应用光照 - 每帧执行
        this.applyLighting();
        
        // 3-5. 昂贵效果每3帧执行一次
        if (isFullFrame) {
            // 3. 色差效果
            if (this.effects.chromaticAberration > 0) {
                this.applyChromaticAberration();
            }
            
            // 4. 暗角
            if (this.effects.vignette > 0) {
                this.applyVignette();
            }
            
            // 5. 胶片颗粒
            if (this.effects.filmGrain > 0) {
                this.applyFilmGrain();
            }
        }
        
        // 最终输出到主画布
        ctx.drawImage(this.sceneCanvas, 0, 0);
    }
    
    /**
     * 像素对齐 - 确保像素清晰不模糊
     */
    applyPixelSnap() {
        // 获取图像数据
        const imageData = this.sceneCtx.getImageData(0, 0, this.width, this.height);
        const data = imageData.data;
        
        // 简单的色调分离，增强像素感
        const levels = 32; // 色阶数
        const step = 255 / levels;
        
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.round(data[i] / step) * step;     // R
            data[i + 1] = Math.round(data[i + 1] / step) * step; // G
            data[i + 2] = Math.round(data[i + 2] / step) * step; // B
        }
        
        this.sceneCtx.putImageData(imageData, 0, 0);
    }
    
    /**
     * 应用光照合成
     */
    applyLighting() {
        // 这里假设光照已经绘制到lightCanvas
        // 使用multiply混合模式叠加
        this.sceneCtx.save();
        this.sceneCtx.globalCompositeOperation = 'multiply';
        this.sceneCtx.drawImage(
            this.lightCanvas, 
            0, 0, this.lightCanvas.width, this.lightCanvas.height,
            0, 0, this.width, this.height
        );
        this.sceneCtx.restore();
    }
    
    /**
     * 色差效果
     */
    applyChromaticAberration() {
        const amount = this.effects.chromaticAberration;
        
        // 分离RGB通道
        const imageData = this.sceneCtx.getImageData(0, 0, this.width, this.height);
        const data = imageData.data;
        const tempData = new Uint8ClampedArray(data);
        
        const offset = Math.floor(amount);
        
        for (let y = 0; y < this.height; y++) {
            for (let x = 0; x < this.width; x++) {
                const i = (y * this.width + x) * 4;
                
                // 红色通道向左偏移
                const rX = Math.max(0, x - offset);
                const rI = (y * this.width + rX) * 4;
                data[i] = tempData[rI];
                
                // 绿色通道不变
                
                // 蓝色通道向右偏移
                const bX = Math.min(this.width - 1, x + offset);
                const bI = (y * this.width + bX) * 4;
                data[i + 2] = tempData[bI + 2];
            }
        }
        
        this.sceneCtx.putImageData(imageData, 0, 0);
    }
    
    /**
     * 暗角效果
     */
    applyVignette() {
        // 安全检查
        if (!isFinite(this.width) || !isFinite(this.height) || this.width <= 0 || this.height <= 0) return;
        
        const gradient = this.sceneCtx.createRadialGradient(
            this.width / 2, this.height / 2, this.width * 0.3,
            this.width / 2, this.height / 2, this.width * 0.8
        );
        
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, `rgba(0,0,0,${this.effects.vignette})`);
        
        this.sceneCtx.save();
        this.sceneCtx.fillStyle = gradient;
        this.sceneCtx.globalCompositeOperation = 'multiply';
        this.sceneCtx.fillRect(0, 0, this.width, this.height);
        this.sceneCtx.restore();
    }
    
    /**
     * 胶片颗粒
     */
    applyFilmGrain() {
        const imageData = this.sceneCtx.getImageData(0, 0, this.width, this.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * this.effects.filmGrain * 255;
            data[i] = Math.max(0, Math.min(255, data[i] + noise));
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
        }
        
        this.sceneCtx.putImageData(imageData, 0, 0);
    }
    
    /**
     * 绘制深度雾效
     */
    drawDepthFog(ctx, camera, entities, floor) {
        const colors = this.getFogColors(floor);
        
        // 根据Y坐标（深度）绘制渐变雾
        entities.forEach(entity => {
            if (entity.hp <= 0) return;
            
            const depth = (entity.y / 1500); // 归一化深度
            if (depth < 0.3) return; // 前景不清
            
            const pos = camera.worldToScreen(entity.x, entity.y);
            const size = (entity.size || 24) * camera.zoom;
            
            const alpha = (depth - 0.3) * colors.density;
            
            ctx.save();
            ctx.fillStyle = colors.color;
            ctx.globalAlpha = alpha;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y - size * 0.3, size * 1.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
    }
    
    /**
     * 绘制像素完美的线条
     */
    drawPixelLine(ctx, x1, y1, x2, y2, color, width = 1) {
        // 确保线条对齐到像素网格
        const px1 = Math.floor(x1) + 0.5;
        const py1 = Math.floor(y1) + 0.5;
        const px2 = Math.floor(x2) + 0.5;
        const py2 = Math.floor(y2) + 0.5;
        
        ctx.strokeStyle = color;
        ctx.lineWidth = width;
        ctx.lineCap = 'butt'; // 像素风格
        ctx.beginPath();
        ctx.moveTo(px1, py1);
        ctx.lineTo(px2, py2);
        ctx.stroke();
    }
    
    getFogColors(floor) {
        const palettes = {
            1: { color: '#2d4a3e', density: 0.4 },
            2: { color: '#3d5c3d', density: 0.35 },
            3: { color: '#4a304a', density: 0.5 },
            4: { color: '#5c2d1a', density: 0.45 },
            5: { color: '#3d3d1a', density: 0.4 },
            6: { color: '#3d0a0a', density: 0.55 }
        };
        return palettes[floor] || palettes[1];
    }
}
