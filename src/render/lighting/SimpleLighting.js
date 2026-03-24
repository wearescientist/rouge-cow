/**
 * SimpleLighting.js - 简化版光照系统
 * 在现有渲染上叠加法线光照，不改动核心渲染流程
 */

class SimpleLighting {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        
        // 光源列表
        this.lights = [];
        
        // 法线贴图缓存
        this.normalMaps = new Map();
        
        // 是否启用
        this.enabled = true;
        
        // 环境光基础亮度 - v0.32-fix: 提高到 0.75，multiply 混合会压暗画面
        this.ambientLight = 0.74;
    }

    /**
     * 为精灵生成/获取法线贴图
     */
    getNormalMap(sprite) {
        const key = sprite.src || sprite;
        
        if (this.normalMaps.has(key)) {
            return this.normalMaps.get(key);
        }
        
        // 生成法线贴图
        const normalMap = this.generateNormalMap(sprite);
        this.normalMaps.set(key, normalMap);
        return normalMap;
    }

    /**
     * 生成法线贴图 (简化版)
     */
    generateNormalMap(sprite) {
        const canvas = document.createElement('canvas');
        const w = sprite.width || 32;
        const h = sprite.height || 32;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        
        // 绘制原图
        ctx.drawImage(sprite, 0, 0);
        
        // 获取像素
        const imageData = ctx.getImageData(0, 0, w, h);
        const pixels = imageData.data;
        
        // 创建法线数据
        const normalData = new Uint8ClampedArray(w * h * 4);
        
        for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                const idx = (y * w + x) * 4;
                
                // 简单的边缘检测
                const left = pixels[idx - 4 + 3]; // alpha
                const right = pixels[idx + 4 + 3];
                const up = pixels[idx - w * 4 + 3];
                const down = pixels[idx + w * 4 + 3];
                
                // 计算法线 (简化)
                const nx = (right - left) / 255;
                const ny = (down - up) / 255;
                const nz = 0.5;
                
                // 归一化
                const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
                
                // 映射到 [0,255]
                normalData[idx] = ((nx / len) * 0.5 + 0.5) * 255;
                normalData[idx + 1] = ((ny / len) * 0.5 + 0.5) * 255;
                normalData[idx + 2] = ((nz / len) * 0.5 + 0.5) * 255;
                normalData[idx + 3] = pixels[idx + 3]; // 保持alpha
            }
        }
        
        // 输出
        const output = document.createElement('canvas');
        output.width = w;
        output.height = h;
        output.getContext('2d').putImageData(new ImageData(normalData, w, h), 0, 0);
        
        return output;
    }

    /**
     * 添加光源
     */
    addLight(x, y, config = {}) {
        this.lights.push({
            x, y,
            range: config.range || 100,
            intensity: config.intensity || 1.0,
            color: config.color || { r: 255, g: 220, b: 180 },
            flicker: config.flicker || false
        });
    }

    /**
     * 计算某点的光照
     */
    calculateLighting(x, y, normal) {
        let totalLight = this.ambientLight;
        
        for (const light of this.lights) {
            const dx = light.x - x;
            const dy = light.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > light.range) continue;
            
            // 距离衰减
            const attenuation = 1 - (dist / light.range);
            
            // 法线影响 (简化)
            const lightDir = { x: dx / dist, y: dy / dist };
            const normalDot = Math.max(0, normal.x * lightDir.x + normal.y * lightDir.y);
            
            totalLight += light.intensity * attenuation * normalDot;
        }
        
        return Math.min(totalLight, 1.0);
    }

    /**
     * 渲染光照效果
     */
    render() {
        if (!this.enabled || this.lights.length === 0) return;
        if (this.game?.curRoom?.type === 'hidden') return;
        
        // 创建光照层
        const lightCanvas = document.createElement('canvas');
        lightCanvas.width = this.game.canvas.width;
        lightCanvas.height = this.game.canvas.height;
        const lightCtx = lightCanvas.getContext('2d');
        
        // 填充环境光
        const ambient = Math.floor(this.ambientLight * 255);
        lightCtx.fillStyle = `rgb(${ambient},${ambient},${ambient})`;
        lightCtx.fillRect(0, 0, lightCanvas.width, lightCanvas.height);
        
        // 绘制每个光源
        for (const light of this.lights) {
            const screenPos = this.game.camera.worldToScreen(light.x, light.y);
            
            const gradient = lightCtx.createRadialGradient(
                screenPos.x, screenPos.y, 0,
                screenPos.x, screenPos.y, light.range * this.game.camera.zoom
            );
            
            const flicker = light.flicker ? (Math.random() * 0.1 - 0.05) : 0;
            const intensity = Math.max(0, light.intensity + flicker);
            
            gradient.addColorStop(0, `rgba(${light.color.r}, ${light.color.g}, ${light.color.b}, ${intensity})`);
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            
            lightCtx.globalCompositeOperation = 'lighter';
            lightCtx.fillStyle = gradient;
            lightCtx.beginPath();
            lightCtx.arc(screenPos.x, screenPos.y, light.range * this.game.camera.zoom, 0, Math.PI * 2);
            lightCtx.fill();
        }
        
        // 叠加到主画布
        this.ctx.globalCompositeOperation = 'multiply';
        this.ctx.drawImage(lightCanvas, 0, 0);
        this.ctx.globalCompositeOperation = 'source-over';
    }

    /**
     * 更新光源 (闪烁等)
     */
    update(dt) {
        // 可以在这里更新光源动画
    }

    /**
     * 清除所有光源
     */
    clear() {
        this.lights = [];
    }
}

window.SimpleLighting = SimpleLighting;
