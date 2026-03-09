// ============================================================
// v0.23-r30 - UI渲染系统 (UI Render System)
// HD-2D风格：玻璃态UI、发光边框、粒子背景、动态效果
// ============================================================

export class UIRenderSystem {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        // UI样式配置
        this.style = {
            glassOpacity: 0.15,
            blurAmount: 10,
            borderGlow: true,
            borderColor: '#4488ff',
            accentColor: '#ffaa00'
        };
        
        // UI动画
        this.animations = new Map();
        
        // 粒子背景
        this.bgParticles = [];
        this.maxBgParticles = 30;
        
        // 扫描线效果
        this.scanLineY = 0;
        
        this.time = 0;
        this.initBgParticles();
    }
    
    initBgParticles() {
        for (let i = 0; i < this.maxBgParticles; i++) {
            this.bgParticles.push({
                x: Math.random(),
                y: Math.random(),
                size: 2 + Math.random() * 3,
                speed: 0.1 + Math.random() * 0.2,
                alpha: 0.1 + Math.random() * 0.3
            });
        }
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
    }
    
    update(dt) {
        this.time += dt;
        
        // 更新背景粒子
        this.bgParticles.forEach(p => {
            p.y += p.speed * dt;
            if (p.y > 1) p.y = 0;
        });
        
        // 更新扫描线
        this.scanLineY = (this.scanLineY + 50 * dt) % this.height;
        
        // 更新动画
        this.animations.forEach((anim, id) => {
            anim.progress += dt / anim.duration;
            if (anim.progress >= 1) {
                this.animations.delete(id);
            }
        });
    }
    
    /**
     * 绘制玻璃态面板
     */
    drawGlassPanel(ctx, x, y, width, height, options = {}) {
        const {
            opacity = this.style.glassOpacity,
            blur = this.style.blurAmount,
            glow = this.style.borderGlow,
            glowColor = this.style.borderColor
        } = options;
        
        ctx.save();
        
        // 背景模糊效果（模拟）
        ctx.fillStyle = `rgba(20, 25, 40, ${opacity})`;
        ctx.fillRect(x, y, width, height);
        
        // 边框
        ctx.strokeStyle = `rgba(100, 150, 255, 0.3)`;
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
        
        // 发光效果
        if (glow) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = glowColor;
            ctx.strokeStyle = glowColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);
            ctx.shadowBlur = 0;
        }
        
        // 内发光
        const gradient = ctx.createLinearGradient(x, y, x, y + height);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity * 0.5})`);
        gradient.addColorStop(0.1, 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(0.9, 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(1, `rgba(255, 255, 255, ${opacity * 0.3})`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x + 2, y + 2, width - 4, height - 4);
        
        ctx.restore();
    }
    
    /**
     * 绘制发光按钮
     */
    drawGlowButton(ctx, x, y, width, height, text, isHovered = false, isPressed = false) {
        ctx.save();
        
        const glowIntensity = isHovered ? 20 : 10;
        const scale = isPressed ? 0.95 : 1;
        
        const cx = x + width / 2;
        const cy = y + height / 2;
        const w = width * scale;
        const h = height * scale;
        const bx = cx - w / 2;
        const by = cy - h / 2;
        
        // 发光
        ctx.shadowBlur = glowIntensity;
        ctx.shadowColor = this.style.accentColor;
        
        // 背景
        ctx.fillStyle = isHovered ? 'rgba(255, 170, 0, 0.3)' : 'rgba(255, 170, 0, 0.1)';
        ctx.fillRect(bx, by, w, h);
        
        // 边框
        ctx.strokeStyle = this.style.accentColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(bx, by, w, h);
        
        ctx.shadowBlur = 0;
        
        // 文字
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, cx, cy);
        
        ctx.restore();
    }
    
    /**
     * 绘制进度条（带发光）
     */
    drawGlowProgress(ctx, x, y, width, height, progress, color = '#4488ff') {
        ctx.save();
        
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, width, height);
        
        // 进度
        const filled = width * progress;
        
        ctx.fillStyle = color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = color;
        ctx.fillRect(x, y, filled, height);
        ctx.shadowBlur = 0;
        
        // 边框
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
        
        ctx.restore();
    }
    
    /**
     * 绘制UI背景粒子
     */
    drawUIBackground(ctx) {
        ctx.save();
        
        this.bgParticles.forEach(p => {
            const x = p.x * this.width;
            const y = p.y * this.height;
            
            ctx.globalAlpha = p.alpha * (0.5 + Math.sin(this.time + p.x * 10) * 0.3);
            ctx.fillStyle = '#4488ff';
            ctx.beginPath();
            ctx.arc(x, y, p.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.restore();
    }
    
    /**
     * 绘制扫描线效果
     */
    drawScanlines(ctx) {
        ctx.save();
        ctx.strokeStyle = 'rgba(100, 200, 255, 0.1)';
        ctx.lineWidth = 1;
        
        // 移动的水平线
        ctx.beginPath();
        ctx.moveTo(0, this.scanLineY);
        ctx.lineTo(this.width, this.scanLineY);
        ctx.stroke();
        
        // 静态网格
        for (let i = 0; i < this.height; i += 4) {
            ctx.globalAlpha = 0.05;
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, i, this.width, 2);
        }
        
        ctx.restore();
    }
    
    /**
     * 绘制文字（带发光）
     */
    drawGlowText(ctx, text, x, y, options = {}) {
        const {
            size = 16,
            color = '#ffffff',
            glow = true,
            glowColor = '#4488ff',
            align = 'center'
        } = options;
        
        ctx.save();
        ctx.font = `bold ${size}px Arial`;
        ctx.textAlign = align;
        ctx.textBaseline = 'middle';
        
        if (glow) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = glowColor;
        }
        
        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
        
        ctx.restore();
    }
    
    /**
     * 绘制粒子图标
     */
    drawParticleIcon(ctx, x, y, size, type) {
        ctx.save();
        ctx.translate(x, y);
        
        switch(type) {
            case 'health':
                // 心跳动画
                const scale = 1 + Math.sin(this.time * 5) * 0.1;
                ctx.scale(scale, scale);
                ctx.fillStyle = '#ff4444';
                ctx.beginPath();
                ctx.moveTo(0, -size * 0.3);
                ctx.bezierCurveTo(-size * 0.5, -size * 0.8, -size, -size * 0.2, 0, size * 0.5);
                ctx.bezierCurveTo(size, -size * 0.2, size * 0.5, -size * 0.8, 0, -size * 0.3);
                ctx.fill();
                break;
                
            case 'mana':
                // 旋转的魔法符号
                ctx.rotate(this.time);
                ctx.strokeStyle = '#4488ff';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(0, -size * 0.6);
                ctx.lineTo(0, size * 0.6);
                ctx.moveTo(-size * 0.6, 0);
                ctx.lineTo(size * 0.6, 0);
                ctx.stroke();
                break;
                
            case 'coin':
                // 闪烁的金币
                const shine = Math.sin(this.time * 3) * 0.3 + 0.7;
                ctx.fillStyle = `rgba(255, 200, 50, ${shine})`;
                ctx.beginPath();
                ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
                ctx.fill();
                ctx.strokeStyle = '#ffaa00';
                ctx.lineWidth = 2;
                ctx.stroke();
                break;
        }
        
        ctx.restore();
    }
    
    /**
     * 播放UI动画
     */
    playAnimation(id, type, duration = 0.3) {
        this.animations.set(id, {
            type,
            duration,
            progress: 0
        });
    }
    
    /**
     * 绘制动画面板
     */
    drawAnimatedPanel(ctx, x, y, width, height, animId) {
        const anim = this.animations.get(animId);
        
        if (anim && anim.type === 'slideIn') {
            const eased = 1 - Math.pow(1 - anim.progress, 3);
            const offsetX = (1 - eased) * -50;
            
            ctx.save();
            ctx.translate(offsetX, 0);
            this.drawGlassPanel(ctx, x, y, width, height);
            ctx.restore();
        } else {
            this.drawGlassPanel(ctx, x, y, width, height);
        }
    }
    
    /**
     * 绘制角标装饰
     */
    drawCornerDecorations(ctx, x, y, width, height) {
        ctx.save();
        ctx.strokeStyle = 'rgba(100, 150, 255, 0.5)';
        ctx.lineWidth = 2;
        
        const cornerSize = 10;
        
        // 左上
        ctx.beginPath();
        ctx.moveTo(x, y + cornerSize);
        ctx.lineTo(x, y);
        ctx.lineTo(x + cornerSize, y);
        ctx.stroke();
        
        // 右上
        ctx.beginPath();
        ctx.moveTo(x + width - cornerSize, y);
        ctx.lineTo(x + width, y);
        ctx.lineTo(x + width, y + cornerSize);
        ctx.stroke();
        
        // 左下
        ctx.beginPath();
        ctx.moveTo(x, y + height - cornerSize);
        ctx.lineTo(x, y + height);
        ctx.lineTo(x + cornerSize, y + height);
        ctx.stroke();
        
        // 右下
        ctx.beginPath();
        ctx.moveTo(x + width - cornerSize, y + height);
        ctx.lineTo(x + width, y + height);
        ctx.lineTo(x + width, y + height - cornerSize);
        ctx.stroke();
        
        ctx.restore();
    }
}
