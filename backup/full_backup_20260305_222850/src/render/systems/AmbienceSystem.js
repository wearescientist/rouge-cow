class AmbienceSystem {
    constructor(ctx, width, height) {
        this.ctx = ctx;
        this.width = width;
        this.height = height;
        
        // 孢子参数
        this.spores = [];
        this.sporeCount = 200;
        this.sporeSize = 1.2;
        this.sporeColor = [0.7, 0.85, 0.3];
        
        // 洞穴光线波动参数
        this.time = 0;
        this.lightPhase = Math.random() * Math.PI * 2;
        this.baseAlpha = 0.40;      // 基础暗度40%
        this.waveAlpha = 0.12;      // 波动幅度
        this.waveSpeed = 0.001;     // 波动速度
        
        this.initSpores();
    }
    
    initSpores() {
        this.spores = [];
        for (let i = 0; i < this.sporeCount; i++) {
            this.spores.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                vx: (Math.random() - 0.5) * 0.25,
                vy: (Math.random() - 0.5) * 0.12,
                size: 1.2 + Math.random() * 0.8, // 1.2 - 2.0 随机
                phase: Math.random() * Math.PI * 2,
                opacity: 0.25 + Math.random() * 0.25
            });
        }
    }
    
    update(dt, width, height) {
        // 更新时间用于光线波动
        this.time += dt;
        
        for (const s of this.spores) {
            s.x += s.vx;
            s.y += s.vy + Math.sin(s.phase) * 0.05;
            s.phase += 0.015;
            
            // 使用传入的当前尺寸做边界
            if (s.x < -10) s.x = width + 10;
            if (s.x > width + 10) s.x = -10;
            if (s.y < -10) s.y = height + 10;
            if (s.y > height + 10) s.y = -10;
        }
    }
    
    render(ctx) {
        // 动态获取当前canvas尺寸（解决初始大小问题）
        const w = ctx.canvas.width / (window.devicePixelRatio || 1);
        const h = ctx.canvas.height / (window.devicePixelRatio || 1);
        
        this.update(0.016, w, h);
        
        // 1. 孢子 - 小粒子
        ctx.save();
        const c = this.sporeColor;
        
        for (const s of this.spores) {
            const pulse = Math.sin(s.phase) * 0.3 + 0.7;
            const alpha = s.opacity * pulse;
            
            ctx.shadowBlur = s.size * 2;
            ctx.shadowColor = `rgba(${c[0]*255}, ${c[1]*255}, ${c[2]*255}, ${alpha * 0.5})`;
            ctx.fillStyle = `rgba(${c[0]*255}, ${c[1]*255}, ${c[2]*255}, ${alpha})`;
            
            ctx.beginPath();
            ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
        
        // 2. 遮罩 - 动态透明度模拟洞穴光线变化
        ctx.save();
        // 计算动态暗度（正弦波波动）
        const wave1 = Math.sin(this.time * this.waveSpeed + this.lightPhase);
        const wave2 = Math.sin(this.time * this.waveSpeed * 0.7 + this.lightPhase * 1.3) * 0.5;
        const combinedWave = (wave1 + wave2) / 1.5;
        const currentAlpha = this.baseAlpha + combinedWave * this.waveAlpha;
        const clampedAlpha = Math.max(0.25, Math.min(0.55, currentAlpha));
        
        ctx.fillStyle = `rgba(8, 8, 15, ${clampedAlpha})`;
        ctx.fillRect(0, 0, w, h);
        
        // 暗角
        const grad = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, Math.max(w, h) * 0.7);
        grad.addColorStop(0, 'rgba(0,0,0,0)');
        grad.addColorStop(0.5, 'rgba(0,0,0,0.15)');
        grad.addColorStop(1, 'rgba(0,0,0,0.4)');
        
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
    }
}

if (typeof module !== 'undefined') module.exports = AmbienceSystem;
