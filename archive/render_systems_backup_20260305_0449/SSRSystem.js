// ============================================================
// v0.23-r16 - 屏幕空间反射系统 (Screen Space Reflection)
// HD-2D风格：实时水面/光滑表面反射，基于像素的精确反射
// ============================================================

export class SSRSystem {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        // 反射参数
        this.reflectionStrength = 0.4;
        this.roughness = 0.3;  // 表面粗糙度
        this.maxDistance = 200; // 最大反射距离
        
        // 反射表面列表
        this.reflectiveSurfaces = [];
        
        // 帧缓冲
        this.frameBuffer = document.createElement('canvas');
        this.frameBuffer.width = width;
        this.frameBuffer.height = height;
        this.fbCtx = this.frameBuffer.getContext('2d');
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.frameBuffer.width = width;
        this.frameBuffer.height = height;
    }
    
    /**
     * 注册反射表面
     */
    addReflectiveSurface(x, y, width, height, type = 'water', options = {}) {
        this.reflectiveSurfaces.push({
            x, y, width, height,
            type,  // 'water', 'metal', 'ice', 'mirror'
            strength: options.strength || this.reflectionStrength,
            roughness: options.roughness || this.roughness,
            distortion: options.distortion || 0,
            waveSpeed: options.waveSpeed || 1
        });
    }
    
    clearSurfaces() {
        this.reflectiveSurfaces = [];
    }
    
    update(dt, camera) {
        // 更新波动效果
        this.time += dt;
        
        this.reflectiveSurfaces.forEach(surface => {
            if (surface.type === 'water') {
                surface.wavePhase = (surface.wavePhase || 0) + dt * surface.waveSpeed;
            }
        });
    }
    
    /**
     * 应用屏幕空间反射
     */
    applyReflection(ctx, sourceCanvas, camera) {
        if (this.reflectiveSurfaces.length === 0) return;
        
        // 捕获当前帧
        this.fbCtx.clearRect(0, 0, this.width, this.height);
        this.fbCtx.drawImage(sourceCanvas, 0, 0);
        
        ctx.save();
        
        this.reflectiveSurfaces.forEach(surface => {
            const screenPos = camera.worldToScreen(surface.x, surface.y);
            const screenW = surface.width * camera.zoom;
            const screenH = surface.height * camera.zoom;
            
            ctx.save();
            
            // 创建裁剪区域
            ctx.beginPath();
            ctx.rect(screenPos.x - screenW/2, screenPos.y, screenW, screenH);
            ctx.clip();
            
            // 根据类型绘制不同反射效果
            switch(surface.type) {
                case 'water':
                    this.drawWaterReflection(ctx, surface, screenPos, screenW, screenH);
                    break;
                case 'metal':
                    this.drawMetalReflection(ctx, surface, screenPos, screenW, screenH);
                    break;
                case 'ice':
                    this.drawIceReflection(ctx, surface, screenPos, screenW, screenH);
                    break;
                case 'mirror':
                    this.drawMirrorReflection(ctx, surface, screenPos, screenW, screenH);
                    break;
            }
            
            ctx.restore();
        });
        
        ctx.restore();
    }
    
    drawWaterReflection(ctx, surface, pos, w, h) {
        const waveHeight = 5;
        const waveFreq = 0.02;
        
        ctx.save();
        ctx.translate(pos.x, pos.y + h);
        ctx.scale(1, -1);  // 垂直翻转
        
        // 绘制带波纹的反射
        for (let y = 0; y < h; y += 2) {
            const waveOffset = Math.sin(y * waveFreq + surface.wavePhase) * waveHeight;
            const alpha = (1 - y / h) * surface.strength;
            
            ctx.globalAlpha = alpha;
            ctx.drawImage(
                this.frameBuffer,
                pos.x - w/2 + waveOffset, pos.y - y, w, 2,
                -w/2 + waveOffset, -y, w, 2
            );
        }
        
        ctx.restore();
        
        // 添加水面颜色和透明度
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = '#4a7c8c';
        ctx.fillRect(pos.x - w/2, pos.y, w, h);
    }
    
    drawMetalReflection(ctx, surface, pos, w, h) {
        ctx.save();
        
        // 金属反射 - 锐利的镜像
        ctx.globalAlpha = surface.strength;
        ctx.translate(pos.x, pos.y + h/2);
        ctx.scale(1, -0.8);  // 轻微压缩的反射
        
        ctx.drawImage(
            this.frameBuffer,
            pos.x - w/2, pos.y - h/2, w, h,
            -w/2, -h/2, w, h
        );
        
        ctx.restore();
        
        // 金属光泽
        const gradient = ctx.createLinearGradient(pos.x, pos.y, pos.x, pos.y + h);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)');
        gradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.1)');
        gradient.addColorStop(1, 'rgba(100, 100, 100, 0.2)');
        ctx.fillStyle = gradient;
        ctx.fillRect(pos.x - w/2, pos.y, w, h);
    }
    
    drawIceReflection(ctx, surface, pos, w, h) {
        ctx.save();
        
        // 冰面反射 - 带模糊和折射
        ctx.filter = 'blur(2px)';
        ctx.globalAlpha = surface.strength * 0.8;
        ctx.translate(pos.x, pos.y + h);
        ctx.scale(1, -0.9);
        
        ctx.drawImage(
            this.frameBuffer,
            pos.x - w/2, pos.y - h, w, h,
            -w/2, -h, w, h
        );
        
        ctx.restore();
        
        // 冰层效果
        ctx.globalAlpha = 0.4;
        ctx.fillStyle = '#aaddff';
        ctx.fillRect(pos.x - w/2, pos.y, w, h);
    }
    
    drawMirrorReflection(ctx, surface, pos, w, h) {
        ctx.save();
        
        // 完美镜像
        ctx.globalAlpha = surface.strength;
        ctx.translate(pos.x, pos.y + h);
        ctx.scale(1, -1);
        
        ctx.drawImage(
            this.frameBuffer,
            pos.x - w/2, pos.y - h, w, h,
            -w/2, -h, w, h
        );
        
        ctx.restore();
    }
}
