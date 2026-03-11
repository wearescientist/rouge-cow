/**
 * DeferredRenderer.js - 延迟渲染器
 * HD-2D光照系统的核心
 */

class DeferredRenderer {
    constructor(canvas, gl = null) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gl = gl; // WebGL上下文（可选）
        
        this.width = canvas.width;
        this.height = canvas.height;
        
        // G-Buffer (简化版，使用Canvas)
        this.gBuffer = {
            color: document.createElement('canvas'),
            normal: document.createElement('canvas'),
            depth: document.createElement('canvas')
        };
        
        // 初始化G-Buffer尺寸
        Object.values(this.gBuffer).forEach(buf => {
            buf.width = this.width;
            buf.height = this.height;
        });
        
        this.lights = [];
        this.enabled = true;
    }

    /**
     * 渲染G-Buffer
     * @param {Array} entities - 实体列表
     */
    renderGBuffer(entities) {
        const colorCtx = this.gBuffer.color.getContext('2d');
        const normalCtx = this.gBuffer.normal.getContext('2d');
        const depthCtx = this.gBuffer.depth.getContext('2d');
        
        // 清空
        colorCtx.clearRect(0, 0, this.width, this.height);
        normalCtx.clearRect(0, 0, this.width, this.height);
        depthCtx.fillStyle = '#000000';
        depthCtx.fillRect(0, 0, this.width, this.height);
        
        // 渲染每个实体
        for (const entity of entities) {
            if (!entity.sprite || !entity.visible) continue;
            
            const x = entity.x;
            const y = entity.y;
            const w = entity.width || entity.sprite.width;
            const h = entity.height || entity.sprite.height;
            
            // Color通道
            colorCtx.drawImage(entity.sprite, x - w/2, y - h/2, w, h);
            
            // Normal通道 (如果有法线贴图)
            if (entity.normalMap) {
                normalCtx.drawImage(entity.normalMap, x - w/2, y - h/2, w, h);
            }
            
            // Depth通道 (简单深度值)
            const depth = entity.z || 0.5;
            const depthColor = Math.floor(depth * 255);
            depthCtx.fillStyle = `rgb(${depthColor},${depthColor},${depthColor})`;
            depthCtx.fillRect(x - w/2, y - h/2, w, h);
        }
    }

    /**
     * 计算光照
     */
    renderLighting() {
        // 获取normal数据
        const normalCtx = this.gBuffer.normal.getContext('2d');
        const normalData = normalCtx.getImageData(0, 0, this.width, this.height);
        
        // 创建光照结果
        const lightCanvas = document.createElement('canvas');
        lightCanvas.width = this.width;
        lightCanvas.height = this.height;
        const lightCtx = lightCanvas.getContext('2d');
        
        // 基础暗色
        lightCtx.fillStyle = '#222222';
        lightCtx.fillRect(0, 0, this.width, this.height);
        
        // 每个光源
        for (const light of this.lights) {
            this.applyLight(lightCtx, light, normalData);
        }
        
        return lightCanvas;
    }

    /**
     * 应用单个光源
     */
    applyLight(ctx, light, normalData) {
        const gradient = ctx.createRadialGradient(
            light.x, light.y, 0,
            light.x, light.y, light.range
        );
        
        const alpha = light.intensity;
        gradient.addColorStop(0, `rgba(${light.color.r}, ${light.color.g}, ${light.color.b}, ${alpha})`);
        gradient.addColorStop(1, `rgba(${light.color.r}, ${light.color.g}, ${light.color.b}, 0)`);
        
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(light.x, light.y, light.range, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';
    }

    /**
     * 合成最终图像
     */
    composite(outputCtx) {
        // 1. 绘制基础颜色
        outputCtx.drawImage(this.gBuffer.color, 0, 0);
        
        // 2. 叠加光照 (使用multiply或overlay混合)
        const lightLayer = this.renderLighting();
        outputCtx.globalCompositeOperation = 'multiply';
        outputCtx.drawImage(lightLayer, 0, 0);
        outputCtx.globalCompositeOperation = 'source-over';
    }

    /**
     * 添加光源
     */
    addLight(config) {
        this.lights.push({
            x: config.x || 0,
            y: config.y || 0,
            range: config.range || 100,
            intensity: config.intensity || 0.8,
            color: config.color || {r: 255, g: 220, b: 180}
        });
    }

    /**
     * 清除所有光源
     */
    clearLights() {
        this.lights = [];
    }
}

window.DeferredRenderer = DeferredRenderer;
