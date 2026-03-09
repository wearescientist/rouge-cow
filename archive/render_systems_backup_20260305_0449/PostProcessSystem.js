// ============================================================
// v0.23-r15 - 后处理合成系统 (Post Process System)
// HD-2D风格：最终合成、色调映射、锐化、抗锯齿
// ============================================================

export class PostProcessSystem {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        // 后处理链
        this.effects = {
            sharpen: true,       // 锐化
            toneMapping: true,   // 色调映射
            vibrance: true,      // 鲜艳度
            vignette: true,      // 暗角
            grain: true,         // 颗粒
            scanlines: false     // 扫描线（复古效果）
        };
        
        // 效果参数
        this.params = {
            sharpenAmount: 0.3,
            exposure: 1.0,
            contrast: 1.1,
            saturation: 1.15,
            vibrance: 0.2,
            vignetteIntensity: 0.4,
            grainIntensity: 0.03,
            scanlineIntensity: 0.1
        };
        
        this.time = 0;
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
    }
    
    update(dt) {
        this.time += dt;
    }
    
    /**
     * 应用完整后处理链
     */
    apply(ctx, width, height) {
        // 保存当前帧
        const sourceCanvas = document.createElement('canvas');
        sourceCanvas.width = width;
        sourceCanvas.height = height;
        const sourceCtx = sourceCanvas.getContext('2d');
        sourceCtx.drawImage(ctx.canvas, 0, 0);
        
        // 1. 锐化
        if (this.effects.sharpen) {
            this.applySharpen(ctx, width, height, sourceCanvas);
        }
        
        // 2. 色调映射
        if (this.effects.toneMapping) {
            this.applyToneMapping(ctx, width, height);
        }
        
        // 3. 鲜艳度/饱和度
        if (this.effects.vibrance) {
            this.applyVibrance(ctx, width, height);
        }
        
        // 4. 暗角
        if (this.effects.vignette) {
            this.applyVignette(ctx, width, height);
        }
        
        // 5. 颗粒
        if (this.effects.grain) {
            this.applyGrain(ctx, width, height);
        }
        
        // 6. 扫描线（可选）
        if (this.effects.scanlines) {
            this.applyScanlines(ctx, width, height);
        }
    }
    
    applySharpen(ctx, width, height, sourceCanvas) {
        ctx.save();
        ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = this.params.sharpenAmount;
        
        // 使用轻微模糊后再叠加实现锐化效果
        ctx.filter = 'blur(0.5px)';
        ctx.drawImage(sourceCanvas, -1, -1, width + 2, height + 2);
        ctx.filter = 'none';
        
        ctx.restore();
    }
    
    applyToneMapping(ctx, width, height) {
        ctx.save();
        
        // 曝光调整
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = Math.max(0, this.params.exposure - 1);
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        
        // 对比度增强（S曲线近似）
        ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = '#808080';
        ctx.fillRect(0, 0, width, height);
        
        ctx.restore();
    }
    
    applyVibrance(ctx, width, height) {
        // 使用CSS filter实现饱和度调整
        ctx.save();
        ctx.filter = `saturate(${Math.round(this.params.saturation * 100)}%)`;
        ctx.drawImage(ctx.canvas, 0, 0);
        ctx.filter = 'none';
        ctx.restore();
    }
    
    applyVignette(ctx, width, height) {
        ctx.save();
        
        const gradient = ctx.createRadialGradient(
            width / 2, height / 2, height * 0.3,
            width / 2, height / 2, height * 0.85
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(0.7, `rgba(0, 0, 0, ${this.params.vignetteIntensity * 0.3})`);
        gradient.addColorStop(1, `rgba(0, 0, 0, ${this.params.vignetteIntensity})`);
        
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        ctx.restore();
    }
    
    applyGrain(ctx, width, height) {
        ctx.save();
        ctx.globalAlpha = this.params.grainIntensity;
        ctx.fillStyle = '#ffffff';
        
        // 生成噪点
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * 2;
            
            if (Math.random() > 0.5) {
                ctx.fillStyle = '#ffffff';
            } else {
                ctx.fillStyle = '#000000';
            }
            
            ctx.fillRect(x, y, size, size);
        }
        
        ctx.restore();
    }
    
    applyScanlines(ctx, width, height) {
        ctx.save();
        ctx.globalAlpha = this.params.scanlineIntensity;
        ctx.fillStyle = '#000000';
        
        const lineHeight = 4;
        for (let y = 0; y < height; y += lineHeight * 2) {
            ctx.fillRect(0, y, width, lineHeight);
        }
        
        ctx.restore();
    }
    
    /**
     * 设置楼层特定参数
     */
    setFloorParams(floor) {
        switch(floor) {
            case 1: // 菌丝 - 冷色调，稍暗
                this.params.saturation = 0.95;
                this.params.exposure = 0.95;
                this.params.vignetteIntensity = 0.35;
                break;
            case 2: // 温室 - 明亮鲜艳
                this.params.saturation = 1.25;
                this.params.exposure = 1.05;
                this.params.vignetteIntensity = 0.25;
                break;
            case 3: // 神经 - 高对比，紫色调
                this.params.saturation = 1.3;
                this.params.contrast = 1.2;
                this.params.vignetteIntensity = 0.5;
                break;
            case 4: // 熔炉 - 暖色调
                this.params.saturation = 1.2;
                this.params.vignetteIntensity = 0.3;
                break;
            case 5: // 庭院 - 低饱和，复古
                this.params.saturation = 0.85;
                this.params.vignetteIntensity = 0.45;
                break;
            case 6: // 千根 - 高对比，血红
                this.params.saturation = 1.4;
                this.params.contrast = 1.25;
                this.params.vignetteIntensity = 0.6;
                this.params.exposure = 0.9;
                break;
        }
    }
    
    /**
     * 快速后处理（性能模式）
     */
    applyFast(ctx, width, height) {
        // 仅应用最重要的效果
        ctx.save();
        
        // 暗角
        const gradient = ctx.createRadialGradient(
            width / 2, height / 2, height * 0.4,
            width / 2, height / 2, height * 0.9
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, `rgba(0, 0, 0, ${this.params.vignetteIntensity})`);
        
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        ctx.restore();
    }
}
