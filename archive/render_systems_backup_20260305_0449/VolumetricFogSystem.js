// ============================================================
// v0.23-r14 - 体积雾系统 (Volumetric Fog System)
// HD-2D风格：体积光散射、高度雾、区域雾
// ============================================================

export class VolumetricFogSystem {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        // v0.23-fix: 简化为单层雾效
        this.fogLayers = [];
        this.layerCount = 1;
        
        const canvas = document.createElement('canvas');
        canvas.width = Math.floor(width / 2);
        canvas.height = Math.floor(height / 2);
        this.fogLayers.push({
            canvas: canvas,
            ctx: canvas.getContext('2d'),
            offset: { x: 0, y: 0 },
            speed: 3
        });
        
        this.time = 0;
        this.noiseOffset = { x: 0, y: 0 };
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.fogLayers.forEach((layer, i) => {
            layer.canvas.width = Math.floor(width / (1 + i * 0.5));
            layer.canvas.height = Math.floor(height / (1 + i * 0.5));
        });
    }
    
    update(dt, camera, floor) {
        this.time += dt;
        
        // 根据相机移动更新雾效偏移
        if (camera) {
            this.noiseOffset.x += camera.dx * 0.01 || 0;
            this.noiseOffset.y += camera.dy * 0.01 || 0;
        }
        
        // 更新各层雾效
        this.fogLayers.forEach((layer, i) => {
            layer.offset.x += layer.speed * dt * (0.5 + i * 0.3);
            layer.offset.y += Math.sin(this.time * 0.5 + i) * layer.speed * 0.3 * dt;
        });
    }
    
    /**
     * 绘制体积雾
     */
    drawVolumetricFog(ctx, width, height, floor, camera) {
        const config = this.getFloorFogConfig(floor);
        if (!config) return;
        
        ctx.save();
        
        // 绘制高度雾（底部更浓）
        if (config.heightFog) {
            this.drawHeightFog(ctx, width, height, config);
        }
        
        // 绘制体积光射线
        if (config.lightRays) {
            this.drawLightRays(ctx, width, height, config, camera);
        }
        
        // 绘制多层雾
        this.fogLayers.forEach((layer, i) => {
            if (i >= config.layers) return;
            
            this.drawFogLayer(layer, i, ctx, width, height, config);
        });
        
        ctx.restore();
    }
    
    drawHeightFog(ctx, width, height, config) {
        const gradient = ctx.createLinearGradient(0, height * 0.6, 0, height);
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(0.5, this.hexToRgba(config.color, config.density * 0.5));
        gradient.addColorStop(1, this.hexToRgba(config.color, config.density));
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }
    
    drawLightRays(ctx, width, height, config, camera) {
        if (!config.lightRayOrigin) return;
        
        const origin = config.lightRayOrigin;
        const rayCount = 5;
        
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        
        for (let i = 0; i < rayCount; i++) {
            const t = i / (rayCount - 1);
            const angle = Math.PI / 2 + (t - 0.5) * 0.5;
            
            const gradient = ctx.createLinearGradient(
                origin.x * width, origin.y * height,
                origin.x * width + Math.cos(angle) * height,
                origin.y * height + Math.sin(angle) * height
            );
            
            const alpha = config.lightRayIntensity * (0.5 + Math.sin(this.time + i) * 0.2);
            gradient.addColorStop(0, this.hexToRgba(config.lightRayColor, alpha));
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(origin.x * width, origin.y * height);
            ctx.lineTo(
                origin.x * width + Math.cos(angle - 0.1) * height * 1.2,
                origin.y * height + Math.sin(angle - 0.1) * height * 1.2
            );
            ctx.lineTo(
                origin.x * width + Math.cos(angle + 0.1) * height * 1.2,
                origin.y * height + Math.sin(angle + 0.1) * height * 1.2
            );
            ctx.closePath();
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    drawFogLayer(layer, index, ctx, width, height, config) {
        const layerCanvas = layer.canvas;
        const layerCtx = layer.ctx;
        
        // 生成噪声纹理（简化版）
        layerCtx.clearRect(0, 0, layerCanvas.width, layerCanvas.height);
        
        const density = config.density * (1 - index * 0.2);
        const color = config.color;
        
        // 绘制云块状雾
        layerCtx.fillStyle = this.hexToRgba(color, density * 0.3);
        
        for (let i = 0; i < 20; i++) {
            const x = ((i * 137.5 + layer.offset.x * 10) % (layerCanvas.width + 100)) - 50;
            const y = ((i * 73.3 + layer.offset.y * 5) % (layerCanvas.height + 100)) - 50;
            const size = 30 + Math.sin(i + this.time * 0.5) * 10;
            
            layerCtx.beginPath();
            layerCtx.arc(x, y, size, 0, Math.PI * 2);
            layerCtx.fill();
        }
        
        // 叠加到主画面
        ctx.save();
        ctx.globalAlpha = config.layerAlpha || 0.5;
        ctx.drawImage(
            layerCanvas,
            0, 0, layerCanvas.width, layerCanvas.height,
            0, 0, width, height
        );
        ctx.restore();
    }
    
    getFloorFogConfig(floor) {
        // v0.23-fix: 简化雾效配置，降低密度
        switch(floor) {
            case 1: // 菌丝 - 轻微低空雾
                return {
                    color: '#4a6b5c',
                    density: 0.1,
                    layers: 1,
                    heightFog: false,  // 禁用高度雾
                    lightRays: false,  // 禁用光射线
                    layerAlpha: 0.2
                };
            case 2: // 温室 - 极薄雾
                return {
                    color: '#8fbc8f',
                    density: 0.06,
                    layers: 1,
                    heightFog: false,
                    lightRays: false,
                    layerAlpha: 0.15
                };
            case 3: // 神经 - 中等雾
                return {
                    color: '#6b4a6b',
                    density: 0.12,
                    layers: 1,
                    heightFog: false,
                    lightRays: false,
                    layerAlpha: 0.25
                };
            case 4: // 熔炉 - 轻烟
                return {
                    color: '#5c3d2d',
                    density: 0.1,
                    layers: 1,
                    heightFog: false,
                    lightRays: false,
                    layerAlpha: 0.2
                };
            case 5: // 庭院 - 薄雾
                return {
                    color: '#5c5c3d',
                    density: 0.08,
                    layers: 1,
                    heightFog: false,
                    lightRays: false,
                    layerAlpha: 0.18
                };
            case 6: // 千根 - 血雾
                return {
                    color: '#4a1a1a',
                    density: 0.15,
                    layers: 1,
                    heightFog: false,
                    lightRays: false,
                    layerAlpha: 0.25
                };
            default:
                return null;
        }
    }
    
    hexToRgba(hex, alpha) {
        if (!hex || typeof hex !== 'string') return `rgba(128, 128, 128, ${alpha})`;
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
