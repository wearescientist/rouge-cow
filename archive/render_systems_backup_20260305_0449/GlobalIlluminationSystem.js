// ============================================================
// v0.23-r20 - 全局光照系统 (Global Illumination System)
// HD-2D风格：间接光反射、颜色渗透、环境光遮蔽
// ============================================================

export class GlobalIlluminationSystem {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        // GI参数
        this.bounceIntensity = 0.3;  // 间接光强度
        this.colorBleed = 0.4;       // 颜色渗透强度
        this.aoStrength = 0.5;       // 环境光遮蔽强度
        
        // 光源列表
        this.lightProbes = [];
        this.maxProbes = 16;
        
        // 反射探针
        this.reflectionProbes = [];
        
        // 光照贴图（简化版）
        this.lightmap = document.createElement('canvas');
        this.lightmap.width = Math.floor(width / 8);
        this.lightmap.height = Math.floor(height / 8);
        this.lmCtx = this.lightmap.getContext('2d');
        
        this.time = 0;
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.lightmap.width = Math.floor(width / 8);
        this.lightmap.height = Math.floor(height / 8);
    }
    
    update(dt, camera, entities) {
        this.time += dt;
        
        // 更新光源探针位置
        this.updateLightProbes(entities, camera);
        
        // 更新光照贴图
        this.updateLightmap(camera);
    }
    
    /**
     * 添加光源探针
     */
    addLightProbe(x, y, color, intensity, range) {
        if (this.lightProbes.length >= this.maxProbes) {
            this.lightProbes.shift();
        }
        
        this.lightProbes.push({
            x, y,
            color,
            intensity,
            range,
            id: Math.random()
        });
    }
    
    clearLightProbes() {
        this.lightProbes = [];
    }
    
    updateLightProbes(entities, camera) {
        // 从实体自动生成探针
        this.lightProbes = [];
        
        entities.forEach(entity => {
            if (entity.emissive || (entity.lightColor && entity.lightIntensity > 0.5)) {
                this.addLightProbe(
                    entity.x,
                    entity.y,
                    entity.lightColor || '#ffffff',
                    entity.lightIntensity || 0.5,
                    entity.lightRange || 100
                );
            }
        });
    }
    
    updateLightmap(camera) {
        // 清空光照贴图
        this.lmCtx.fillStyle = '#000000';
        this.lmCtx.fillRect(0, 0, this.lightmap.width, this.lightmap.height);
        
        const scaleX = this.lightmap.width / this.width;
        const scaleY = this.lightmap.height / this.height;
        
        // 在光照贴图上绘制光源
        this.lmCtx.globalCompositeOperation = 'screen';
        
        this.lightProbes.forEach(probe => {
            const screenX = probe.x * scaleX;
            const screenY = probe.y * scaleY;
            const radius = probe.range * scaleX;
            
            const gradient = this.lmCtx.createRadialGradient(
                screenX, screenY, 0,
                screenX, screenY, radius
            );
            
            gradient.addColorStop(0, this.hexToRgba(probe.color, probe.intensity));
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            this.lmCtx.fillStyle = gradient;
            this.lmCtx.beginPath();
            this.lmCtx.arc(screenX, screenY, radius, 0, Math.PI * 2);
            this.lmCtx.fill();
        });
    }
    
    /**
     * 应用全局光照
     */
    applyGI(ctx, width, height) {
        // 1. 应用间接光照
        this.applyIndirectLight(ctx, width, height);
        
        // 2. 应用颜色渗透
        this.applyColorBleed(ctx, width, height);
        
        // 3. 应用环境光遮蔽
        this.applyAmbientOcclusion(ctx, width, height);
    }
    
    applyIndirectLight(ctx, width, height) {
        if (this.lightProbes.length === 0) return;
        
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = this.bounceIntensity;
        
        // 使用光照贴图
        ctx.drawImage(
            this.lightmap,
            0, 0, this.lightmap.width, this.lightmap.height,
            0, 0, width, height
        );
        
        ctx.restore();
    }
    
    applyColorBleed(ctx, width, height) {
        // 颜色渗透 - 相邻表面互相影响颜色
        ctx.save();
        ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = this.colorBleed * 0.2;
        
        // 基于楼层的主要色调
        const floorTint = this.getFloorTint();
        if (floorTint) {
            ctx.fillStyle = floorTint;
            ctx.fillRect(0, 0, width, height);
        }
        
        ctx.restore();
    }
    
    applyAmbientOcclusion(ctx, width, height) {
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        
        // 角落和缝隙的暗化
        const gradient = ctx.createRadialGradient(
            width / 2, height / 2, height * 0.2,
            width / 2, height / 2, height * 0.9
        );
        
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.6, `rgba(255, 255, 255, ${1 - this.aoStrength * 0.3})`);
        gradient.addColorStop(1, `rgba(255, 255, 255, ${1 - this.aoStrength})`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        ctx.restore();
    }
    
    /**
     * 计算某点的间接光照
     */
    sampleIndirectLight(x, y) {
        let r = 0, g = 0, b = 0;
        
        this.lightProbes.forEach(probe => {
            const dx = probe.x - x;
            const dy = probe.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > probe.range) return;
            
            const falloff = 1 - (dist / probe.range);
            const intensity = probe.intensity * falloff * this.bounceIntensity;
            
            const color = this.hexToRgb(probe.color);
            r += color.r * intensity;
            g += color.g * intensity;
            b += color.b * intensity;
        });
        
        return { r: Math.min(255, r), g: Math.min(255, g), b: Math.min(255, b) };
    }
    
    /**
     * 绘制接触阴影（物体接触处的暗化）
     */
    drawContactShadow(ctx, x, y, size, camera) {
        const pos = camera.worldToScreen(x, y);
        const screenSize = size * camera.zoom;
        
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        
        // 接触点暗化
        const gradient = ctx.createRadialGradient(
            pos.x, pos.y + screenSize * 0.4, 0,
            pos.x, pos.y + screenSize * 0.4, screenSize * 0.8
        );
        
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0.6)');
        gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.3)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.ellipse(pos.x, pos.y + screenSize * 0.4, screenSize, screenSize * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    /**
     * 绘制天空光（环境填充光）
     */
    drawSkylight(ctx, width, height, floor) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = 0.2;
        
        const skyColor = this.getSkylightColor(floor);
        
        // 从上方的柔和光照
        const gradient = ctx.createLinearGradient(0, 0, 0, height * 0.5);
        gradient.addColorStop(0, skyColor);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height * 0.5);
        
        ctx.restore();
    }
    
    getSkylightColor(floor) {
        switch(floor) {
            case 1: return 'rgba(180, 220, 200, 0.3)';
            case 2: return 'rgba(220, 255, 220, 0.4)';
            case 3: return 'rgba(200, 150, 200, 0.25)';
            case 4: return 'rgba(255, 180, 150, 0.3)';
            case 5: return 'rgba(180, 180, 150, 0.2)';
            case 6: return 'rgba(150, 100, 100, 0.2)';
            default: return 'rgba(200, 200, 200, 0.3)';
        }
    }
    
    getFloorTint() {
        // 返回当前楼层的主色调用于颜色渗透
        return null; // 由外部设置
    }
    
    hexToRgb(hex) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return { r, g, b };
    }
    
    hexToRgba(hex, alpha) {
        const rgb = this.hexToRgb(hex);
        return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
    }
}
