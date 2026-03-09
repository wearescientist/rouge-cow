// ============================================================
// v0.23-r7 - 反射系统 (Reflection System)
// HD-2D风格：水面反射、镜面反射、扭曲效果
// ============================================================

export class ReflectionSystem {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        // 反射表面配置
        this.waterLevel = 0;
        this.reflectivity = 0.4;
        
        // 反射canvas
        this.reflectCanvas = document.createElement('canvas');
        this.reflectCanvas.width = width;
        this.reflectCanvas.height = Math.floor(height * 0.4);
        this.reflectCtx = this.reflectCanvas.getContext('2d');
        
        this.time = 0;
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.reflectCanvas.width = width;
        this.reflectCanvas.height = Math.floor(height * 0.4);
    }
    
    /**
     * 绘制水面反射
     */
    drawWaterReflection(ctx, sourceCanvas, waterY, camera) {
        if (waterY > ctx.canvas.height) return;
        
        this.time += 0.016;
        
        const reflectHeight = ctx.canvas.height - waterY;
        
        ctx.save();
        
        // 创建反射区域
        ctx.beginPath();
        ctx.rect(0, waterY, ctx.canvas.width, reflectHeight);
        ctx.clip();
        
        // 绘制翻转的图像
        ctx.save();
        ctx.translate(0, waterY * 2);
        ctx.scale(1, -1);
        ctx.globalAlpha = this.reflectivity;
        
        // 水波纹扭曲
        ctx.filter = 'blur(2px)';
        ctx.drawImage(
            sourceCanvas,
            0, waterY, ctx.canvas.width, reflectHeight,
            0, 0, ctx.canvas.width, reflectHeight
        );
        ctx.filter = 'none';
        ctx.restore();
        
        // 水面渐变
        const waterGradient = ctx.createLinearGradient(0, waterY, 0, ctx.canvas.height);
        waterGradient.addColorStop(0, 'rgba(100, 150, 200, 0.3)');
        waterGradient.addColorStop(0.5, 'rgba(80, 120, 180, 0.5)');
        waterGradient.addColorStop(1, 'rgba(60, 100, 160, 0.7)');
        ctx.fillStyle = waterGradient;
        ctx.fillRect(0, waterY, ctx.canvas.width, reflectHeight);
        
        // 水波纹线
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 2;
        for (let i = 0; i < 5; i++) {
            const waveY = waterY + 10 + i * 20 + Math.sin(this.time * 2 + i) * 5;
            if (waveY > ctx.canvas.height) break;
            
            ctx.beginPath();
            for (let x = 0; x < ctx.canvas.width; x += 20) {
                const offset = Math.sin(x * 0.02 + this.time * 3 + i) * 3;
                if (x === 0) ctx.moveTo(x, waveY + offset);
                else ctx.lineTo(x, waveY + offset);
            }
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    /**
     * 简单的地面反射（潮湿地面）
     */
    drawGroundReflection(ctx, entity, camera, alpha = 0.2) {
        const pos = camera.worldToScreen(entity.x, entity.y);
        const size = (entity.size || 24) * camera.zoom;
        
        ctx.save();
        ctx.translate(pos.x, pos.y + size * 0.8);
        ctx.scale(1, -0.6);
        ctx.globalAlpha = alpha;
        
        // 绘制简化的倒影
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.ellipse(0, 0, size * 0.8, size, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    /**
     * 镜面高光（用于光滑表面）
     */
    drawSpecularHighlight(ctx, x, y, width, height, intensity = 0.5) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = intensity;
        
        const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.7, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, width, height);
        ctx.restore();
    }
}
