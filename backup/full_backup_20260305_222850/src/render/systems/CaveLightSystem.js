/**
 * 洞穴光线系统 - Cave Light System
 * 动态遮罩透明度，模拟洞穴内光线明暗变化
 */
class CaveLightSystem {
    constructor(ctx) {
        this.ctx = ctx;
        this.enabled = true;
        
        this.params = {
            baseAlpha: 0.4,      // 基础暗度（40%）
            waveAmplitude: 0.15,  // 波动幅度（透明度变化范围）
            waveSpeed: 0.0008,    // 波动速度
            minAlpha: 0.25,       // 最亮时透明度（最亮）
            maxAlpha: 0.55        // 最暗时透明度（最暗）
        };
        
        this.time = 0;
        // 随机相位，让每个房间的光线变化不同步
        this.phase = Math.random() * Math.PI * 2;
    }

    update(deltaTime) {
        this.time += deltaTime;
    }

    render() {
        if (!this.enabled) return;

        const canvas = this.ctx.canvas;
        const width = (canvas.clientWidth || canvas.width || 900);
        const height = (canvas.clientHeight || canvas.height || 600);
        
        const { baseAlpha, waveAmplitude, waveSpeed, minAlpha, maxAlpha } = this.params;
        
        // 计算动态透明度（正弦波 + 噪声模拟自然波动）
        const wave1 = Math.sin(this.time * waveSpeed + this.phase);
        const wave2 = Math.sin(this.time * waveSpeed * 1.3 + this.phase * 0.7) * 0.5;
        const combinedWave = (wave1 + wave2) / 1.5; // -1 到 1
        
        // 映射到透明度范围
        const currentAlpha = baseAlpha + combinedWave * waveAmplitude;
        const clampedAlpha = Math.max(minAlpha, Math.min(maxAlpha, currentAlpha));
        
        // 绘制暗色遮罩
        this.ctx.fillStyle = `rgba(5, 8, 12, ${clampedAlpha})`;
        this.ctx.fillRect(0, 0, width, height);
    }

    setParams(params) {
        Object.assign(this.params, params);
    }
}

if (typeof module !== 'undefined') module.exports = CaveLightSystem;
