// ============================================================
// v0.23-r6 - 辉光系统 (Bloom System)
// HD-2D风格：HDR辉光、光晕、镜头光斑
// ============================================================

export class BloomSystem {
    constructor(width, height) {
        // 降采样canvas提高性能
        this.canvas = document.createElement('canvas');
        this.canvas.width = Math.floor(width / 2);
        this.canvas.height = Math.floor(height / 2);
        this.ctx = this.canvas.getContext('2d');
        
        // v0.23-fix: 降低辉光强度
        this.intensity = 0.4;
        this.threshold = 180;
        this.blurRadius = 8;
        
        this.glowObjects = [];
        
        // v0.23-fix: 禁用镜头光斑
        this.lensFlare = {
            enabled: false,
            ghosts: 0,
            intensity: 0
        };
    }
    
    resize(width, height) {
        this.canvas.width = Math.floor(width / 2);
        this.canvas.height = Math.floor(height / 2);
    }
    
    addGlow(x, y, radius, color, intensity = 1) {
        this.glowObjects.push({
            x, y, radius, color, intensity,
            life: 1.0, maxLife: 1.0
        });
    }
    
    clear() {
        this.glowObjects = [];
    }
    
    /**
     * v0.23-r6: HDR辉光渲染
     */
    render(targetCtx, camera, drawCallback) {
        if (this.glowObjects.length === 0) return;
        
        const w = this.canvas.width;
        const h = this.canvas.height;
        
        // 清空
        this.ctx.clearRect(0, 0, w, h);
        
        // 绘制发光物体（降采样）
        this.ctx.save();
        this.ctx.scale(0.5, 0.5);
        
        this.glowObjects.forEach(obj => {
            if (obj.life <= 0) return;
            
            const pos = camera.worldToScreen(obj.x, obj.y);
            const screenX = pos.x * 2;
            const screenY = pos.y * 2;
            
            // 多遍绘制增强亮度
            for (let i = 0; i < 3; i++) {
                this.ctx.globalAlpha = obj.life * obj.intensity * (0.3 + i * 0.2);
                this.ctx.fillStyle = obj.color;
                this.ctx.shadowBlur = obj.radius * (1 + i * 0.5);
                this.ctx.shadowColor = obj.color;
                
                this.ctx.beginPath();
                this.ctx.arc(screenX, screenY, obj.radius * (1 - i * 0.2), 0, Math.PI * 2);
                this.ctx.fill();
            }
        });
        
        this.ctx.restore();
        
        // 高斯模糊
        this.applyBlur(this.ctx, w, h, this.blurRadius);
        
        // 叠加到主画面
        targetCtx.save();
        targetCtx.globalCompositeOperation = 'screen';
        targetCtx.globalAlpha = this.intensity;
        targetCtx.drawImage(this.canvas, 0, 0, targetCtx.canvas.width, targetCtx.canvas.height);
        targetCtx.restore();
    }
    
    /**
     * 双遍高斯模糊
     */
    applyBlur(ctx, w, h, radius) {
        // 水平模糊
        ctx.filter = `blur(${radius}px, 0px)`;
        const temp = ctx.getImageData(0, 0, w, h);
        ctx.putImageData(temp, 0, 0);
        
        // 垂直模糊
        ctx.filter = `blur(0px, ${radius}px)`;
        const temp2 = ctx.getImageData(0, 0, w, h);
        ctx.putImageData(temp2, 0, 0);
        ctx.filter = 'none';
    }
    
    /**
     * 快速辉光
     */
    drawFastGlow(ctx, x, y, radius, color, intensity = 1) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        
        // 外圈光晕
        ctx.globalAlpha = intensity * 0.3;
        ctx.shadowBlur = radius * 3;
        ctx.shadowColor = color;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, radius * 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // 内圈强光
        ctx.globalAlpha = intensity * 0.6;
        ctx.shadowBlur = radius;
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.7, 0, Math.PI * 2);
        ctx.fill();
        
        // 核心
        ctx.globalAlpha = intensity;
        ctx.shadowBlur = radius * 0.5;
        ctx.beginPath();
        ctx.arc(x, y, radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    /**
     * 批量辉光（优化版）
     */
    drawBatchGlow(ctx, glowList, camera) {
        if (!glowList || glowList.length === 0) return;
        
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        
        // 按颜色分组
        const colorGroups = {};
        glowList.forEach(g => {
            if (!colorGroups[g.color]) colorGroups[g.color] = [];
            colorGroups[g.color].push(g);
        });
        
        Object.keys(colorGroups).forEach(color => {
            const items = colorGroups[color];
            
            // 外圈
            ctx.shadowColor = color;
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.3;
            ctx.shadowBlur = 30;
            
            items.forEach(g => {
                const pos = camera.worldToScreen(g.x, g.y);
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, (g.radius || 10) * 1.5, 0, Math.PI * 2);
                ctx.fill();
            });
            
            // 内圈
            ctx.globalAlpha = 0.6;
            ctx.shadowBlur = 10;
            
            items.forEach(g => {
                const pos = camera.worldToScreen(g.x, g.y);
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, g.radius || 10, 0, Math.PI * 2);
                ctx.fill();
            });
        });
        
        ctx.restore();
    }
    
    /**
     * 镜头光斑效果（用于强光）
     */
    drawLensFlare(ctx, x, y, color, intensity) {
        if (!this.lensFlare.enabled || intensity < 0.5) return;
        
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        
        const centerX = ctx.canvas.width / 2;
        const centerY = ctx.canvas.height / 2;
        
        // 计算与屏幕中心的对称点
        const dx = x - centerX;
        const dy = y - centerY;
        
        // 绘制鬼影
        for (let i = 1; i <= this.lensFlare.ghosts; i++) {
            const ghostX = centerX - dx * (i * 0.3);
            const ghostY = centerY - dy * (i * 0.3);
            const size = 20 / i;
            const alpha = intensity * 0.1 / i;
            
            ctx.globalAlpha = alpha;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(ghostX, ghostY, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}
