// ============================================================
// v0.23-r3 - 屏幕特效系统 (Screen Effects System)
// HD-2D风格：强烈的上帝光、体积光、色差效果
// ============================================================

export class ScreenEffectsSystem {
    constructor() {
        this.time = 0;
        
        // 上帝光配置（大幅增强）
        this.godRays = {
            enabled: false,
            origin: { x: 0.5, y: 0 },
            angle: Math.PI / 2,
            spread: 0.5,
            intensity: 0.35,  // 从0.15提升
            color: '#ffffe0',
            rays: 7,  // 光束数量
            shafts: true  // 体积光柱
        };
        
        // 热浪扭曲
        this.heatWave = {
            enabled: false,
            intensity: 0,
            speed: 3
        };
        
        // v0.23-fix: 减轻暗角
        this.vignette = {
            enabled: true,
            intensity: 0.25,  // 降低，让画面更清晰
            color: '#000',
            feather: 0.8
        };
        
        // 色差效果（模拟镜头）
        this.chromaticAberration = {
            enabled: true,
            amount: 1.5  // RGB分离像素数
        };
        
        // v0.23-fix: 减轻胶片颗粒
        this.filmGrain = {
            enabled: true,
            intensity: 0.015  // 更轻微
        };
    }
    
    update(dt, floor) {
        this.time += dt;
        
        // 根据楼层配置特效
        switch(floor) {
            case 1: // 菌丝 - 柔和体积光
                this.godRays.enabled = false; // v0.23-fix: 禁用丑陋上帝光
                this.heatWave.enabled = false;
                this.vignette.intensity = 0.2;  // v0.23-fix: 减轻
                break;
            case 2: // 温室 - 明亮阳光
                this.godRays.enabled = false; // v0.23-fix: 禁用丑陋上帝光
                this.heatWave.enabled = false;
                this.vignette.intensity = 0.15;  // v0.23-fix: 减轻
                break;
            case 3: // 神经 - 诡异脉动光
                this.godRays.enabled = false; // v0.23-fix: 禁用丑陋上帝光
                this.heatWave.enabled = false;
                this.vignette.intensity = 0.3;  // v0.23-fix: 减轻
                break;
            case 4: // 熔炉 - 热浪+橙光
                this.godRays.enabled = false; // v0.23-fix: 禁用丑陋上帝光
                this.heatWave.enabled = true;
                this.heatWave.intensity = 0.05;
                this.vignette.intensity = 0.2;  // v0.23-fix: 减轻
                break;
            case 5: // 庭院 - 昏暗
                this.godRays.enabled = false;
                this.heatWave.enabled = false;
                this.vignette.intensity = 0.35;  // v0.23-fix: 减轻
                break;
            case 6: // 千根 - 血红光芒
                this.godRays.enabled = false; // v0.23-fix: 禁用丑陋上帝光
                this.heatWave.enabled = false;
                this.vignette.intensity = 0.4;  // v0.23-fix: 减轻
                break;
        }
    }
    
    /**
     * v0.23-r3: 增强的上帝光
     */
    drawGodRays(ctx, width, height) {
        if (!this.godRays.enabled) return;
        
        const originX = width * this.godRays.origin.x;
        const originY = height * this.godRays.origin.y;
        
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        
        // 主光束
        for (let i = 0; i < this.godRays.rays; i++) {
            const t = i / (this.godRays.rays - 1);
            const angle = this.godRays.angle + (t - 0.5) * this.godRays.spread;
            
            // 每条光束有轻微动画
            const wave = Math.sin(this.time * 0.5 + i) * 0.02;
            
            const gradient = ctx.createLinearGradient(
                originX, originY,
                originX + Math.cos(angle + wave) * height * 1.2,
                originY + Math.sin(angle + wave) * height * 1.2
            );
            
            const alpha = this.godRays.intensity * (0.6 + Math.sin(this.time + i * 0.5) * 0.15);
            gradient.addColorStop(0, this.hexToRgba(this.godRays.color, alpha));
            gradient.addColorStop(0.4, this.hexToRgba(this.godRays.color, alpha * 0.4));
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            
            // 更宽的光束
            const beamWidth = 40 + i * 15;
            ctx.moveTo(originX, originY);
            ctx.lineTo(
                originX + Math.cos(angle - 0.08 + wave) * height * 1.3,
                originY + Math.sin(angle - 0.08 + wave) * height * 1.3
            );
            ctx.lineTo(
                originX + Math.cos(angle + 0.08 + wave) * height * 1.3,
                originY + Math.sin(angle + 0.08 + wave) * height * 1.3
            );
            ctx.closePath();
            ctx.fill();
        }
        
        // 体积光柱（中心强光）
        if (this.godRays.shafts) {
            const shaftGradient = ctx.createRadialGradient(
                originX, originY, 0,
                originX, originY, height * 0.8
            );
            shaftGradient.addColorStop(0, this.hexToRgba(this.godRays.color, this.godRays.intensity * 0.3));
            shaftGradient.addColorStop(0.5, this.hexToRgba(this.godRays.color, this.godRays.intensity * 0.1));
            shaftGradient.addColorStop(1, 'rgba(0,0,0,0)');
            
            ctx.fillStyle = shaftGradient;
            ctx.fillRect(0, 0, width, height);
        }
        
        ctx.restore();
    }
    
    /**
     * v0.23-r3: 增强暗角
     */
    drawVignette(ctx, width, height) {
        if (!this.vignette.enabled) return;
        
        const gradient = ctx.createRadialGradient(
            width / 2, height / 2, height * 0.2,
            width / 2, height / 2, height * this.vignette.feather
        );
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(0.5, `rgba(0,0,0,${this.vignette.intensity * 0.5})`);
        gradient.addColorStop(1, `rgba(0,0,0,${this.vignette.intensity})`);
        
        ctx.save();
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
    }
    
    /**
     * 色差效果（边缘RGB分离）
     */
    drawChromaticAberration(ctx, width, height) {
        if (!this.chromaticAberration.enabled) return;
        
        const amount = this.chromaticAberration.amount;
        
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        
        // 红色通道偏移
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = '#ff0000';
        ctx.filter = `blur(${amount}px)`;
        ctx.drawImage(ctx.canvas, -amount, 0);
        
        // 蓝色通道偏移
        ctx.fillStyle = '#0000ff';
        ctx.drawImage(ctx.canvas, amount, 0);
        
        ctx.filter = 'none';
        ctx.restore();
    }
    
    /**
     * 胶片颗粒
     */
    drawFilmGrain(ctx, width, height) {
        if (!this.filmGrain.enabled) return;
        
        ctx.save();
        ctx.globalAlpha = this.filmGrain.intensity;
        ctx.fillStyle = '#fff';
        
        // 随机噪点
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = Math.random() * 2;
            ctx.fillRect(x, y, size, size);
        }
        
        ctx.restore();
    }
    
    hexToRgba(hex, alpha) {
        if (!hex || typeof hex !== 'string') return `rgba(0, 0, 0, ${alpha})`;
        if (hex.length === 4) {
            const r = parseInt(hex[1] + hex[1], 16);
            const g = parseInt(hex[2] + hex[2], 16);
            const b = parseInt(hex[3] + hex[3], 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
        const r = parseInt(hex.slice(1, 3), 16) || 0;
        const g = parseInt(hex.slice(3, 5), 16) || 0;
        const b = parseInt(hex.slice(5, 7), 16) || 0;
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}
