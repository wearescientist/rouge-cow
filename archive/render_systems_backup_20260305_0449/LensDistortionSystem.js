// ============================================================
// v0.23-r24 - 镜头畸变系统 (Lens Distortion System)
// HD-2D风格：桶形/枕形畸变、色散、镜头呼吸、炫光
// ============================================================

export class LensDistortionSystem {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        // 畸变参数
        this.barrelDistortion = 0.0;  // 桶形畸变 (-1到1)
        this.chromaticAberration = 1.5;  // 色差强度
        this.vignetteFalloff = 2.0;   // 暗角衰减
        
        // 镜头呼吸（缩放动画）- 已禁用
        this.breathing = {
            enabled: false,
            amplitude: 0,
            speed: 0,
            baseScale: 1.0
        };
        
        // 镜头炫光
        this.lensFlare = {
            ghosts: [],
            halo: true,
            starburst: true
        };
        
        this.time = 0;
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
    }
    
    update(dt, camera) {
        this.time += dt;
        
        // 更新镜头呼吸
        if (this.breathing.enabled) {
            this.currentScale = this.breathing.baseScale + 
                Math.sin(this.time * this.breathing.speed) * this.breathing.amplitude;
        }
    }
    
    /**
     * 应用桶形/枕形畸变
     */
    applyDistortion(ctx, width, height, strength = this.barrelDistortion) {
        if (Math.abs(strength) < 0.01) return;
        
        ctx.save();
        
        // 创建畸变网格（简化版使用径向渐变模拟）
        const centerX = width / 2;
        const centerY = height / 2;
        const maxDist = Math.sqrt(centerX ** 2 + centerY ** 2);
        
        // 畸变会影响边缘的拉伸/压缩
        const distortionGradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, maxDist
        );
        
        // 根据畸变类型设置
        if (strength > 0) {
            // 桶形畸变 - 边缘向外凸
            distortionGradient.addColorStop(0, 'rgba(128, 128, 128, 0)');
            distortionGradient.addColorStop(0.7, 'rgba(128, 128, 128, 0.1)');
            distortionGradient.addColorStop(1, 'rgba(128, 128, 128, 0.2)');
        } else {
            // 枕形畸变 - 边缘向内凹
            distortionGradient.addColorStop(0, 'rgba(128, 128, 128, 0.2)');
            distortionGradient.addColorStop(0.3, 'rgba(128, 128, 128, 0.1)');
            distortionGradient.addColorStop(1, 'rgba(128, 128, 128, 0)');
        }
        
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = distortionGradient;
        ctx.fillRect(0, 0, width, height);
        
        ctx.restore();
    }
    
    /**
     * 应用色差（RGB分离）
     */
    applyChromaticAberration(ctx, width, height, strength = this.chromaticAberration) {
        ctx.save();
        
        // 红通道偏移
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = 0.5;
        
        // 保存当前画面
        const snapshot = document.createElement('canvas');
        snapshot.width = width;
        snapshot.height = height;
        const snapCtx = snapshot.getContext('2d');
        snapCtx.drawImage(ctx.canvas, 0, 0);
        
        // 红色偏移
        ctx.fillStyle = '#ff0000';
        ctx.filter = `blur(${strength}px)`;
        ctx.drawImage(snapshot, -strength, 0);
        
        // 蓝色偏移
        ctx.fillStyle = '#0000ff';
        ctx.drawImage(snapshot, strength, 0);
        
        ctx.filter = 'none';
        ctx.restore();
    }
    
    /**
     * 应用镜头呼吸效果（轻微缩放）
     */
    applyBreathing(ctx, width, height) {
        if (!this.breathing.enabled) return;
        
        const scale = this.currentScale || 1.0;
        if (Math.abs(scale - 1.0) < 0.001) return;
        
        ctx.save();
        
        // 绘制缩放后的画面
        const scaledWidth = width * scale;
        const scaledHeight = height * scale;
        const offsetX = (width - scaledWidth) / 2;
        const offsetY = (height - scaledHeight) / 2;
        
        // 创建临时画布存储当前画面
        const temp = document.createElement('canvas');
        temp.width = width;
        temp.height = height;
        temp.getContext('2d').drawImage(ctx.canvas, 0, 0);
        
        // 清空并重新绘制（带缩放）
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(temp, offsetX, offsetY, scaledWidth, scaledHeight);
        
        ctx.restore();
    }
    
    /**
     * 绘制镜头炫光
     */
    drawLensFlare(ctx, lightX, lightY, intensity = 1) {
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        
        // 计算与屏幕中心的对称点
        const dx = lightX - centerX;
        const dy = lightY - centerY;
        
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        
        // 1. 光晕（Halo）
        if (this.lensFlare.halo) {
            const haloX = centerX - dx * 0.5;
            const haloY = centerY - dy * 0.5;
            
            const gradient = ctx.createRadialGradient(
                haloX, haloY, 0,
                haloX, haloY, 100
            );
            gradient.addColorStop(0, `rgba(255, 255, 200, ${intensity * 0.3})`);
            gradient.addColorStop(0.5, `rgba(255, 200, 100, ${intensity * 0.1})`);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(haloX, haloY, 100, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 2. 鬼影（Ghosts）
        const ghostPositions = [0.3, 0.5, 0.7];
        ghostPositions.forEach((t, i) => {
            const ghostX = centerX - dx * t;
            const ghostY = centerY - dy * t;
            const size = 20 - i * 5;
            
            ctx.globalAlpha = intensity * (0.2 - i * 0.05);
            ctx.fillStyle = i % 2 === 0 ? '#ffaa55' : '#55aaff';
            ctx.beginPath();
            ctx.arc(ghostX, ghostY, size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // 3. 星芒（Starburst）
        if (this.lensFlare.starburst) {
            ctx.globalAlpha = intensity * 0.4;
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            
            const rays = 8;
            for (let i = 0; i < rays; i++) {
                const angle = (i / rays) * Math.PI * 2;
                const length = 80 + Math.random() * 20;
                
                ctx.beginPath();
                ctx.moveTo(lightX, lightY);
                ctx.lineTo(
                    lightX + Math.cos(angle) * length,
                    lightY + Math.sin(angle) * length
                );
                ctx.stroke();
            }
        }
        
        ctx.restore();
    }
    
    /**
     * 绘制镜头灰尘/划痕
     */
    drawLensDust(ctx, width, height) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = '#ffffff';
        
        // 随机灰尘点
        for (let i = 0; i < 10; i++) {
            const x = (Math.sin(i * 137.5) * 0.5 + 0.5) * width;
            const y = (Math.cos(i * 73.3) * 0.5 + 0.5) * height;
            const size = 2 + Math.sin(i) * 1;
            
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    /**
     * 应用径向模糊（用于快速移动）
     */
    applyRadialBlur(ctx, width, height, centerX, centerY, strength) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = strength * 0.3;
        
        // 绘制径向线条模拟运动模糊
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < 36; i++) {
            const angle = (i / 36) * Math.PI * 2;
            const length = 100 + Math.random() * 50;
            
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.lineTo(
                centerX + Math.cos(angle) * length,
                centerY + Math.sin(angle) * length
            );
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    /**
     * 综合镜头效果
     */
    applyLensEffects(ctx, width, height, lightSource = null) {
        // 1. 色差
        this.applyChromaticAberration(ctx, width, height);
        
        // 2. 畸变
        this.applyDistortion(ctx, width, height);
        
        // 3. 镜头呼吸
        this.applyBreathing(ctx, width, height);
        
        // 4. 炫光（如果有强光源）
        if (lightSource) {
            this.drawLensFlare(ctx, lightSource.x, lightSource.y, lightSource.intensity);
        }
        
        // 5. 灰尘
        this.drawLensDust(ctx, width, height);
    }
}
