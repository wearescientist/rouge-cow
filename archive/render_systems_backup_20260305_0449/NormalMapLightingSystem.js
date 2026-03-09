// ============================================================
// v0.24 - 法线贴图光照系统 (Normal Map Lighting System)
// 八方旅人风格：2D像素 + 3D动态光照
// ============================================================

export class NormalMapLightingSystem {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        // 光照贴图canvas
        this.lightCanvas = document.createElement('canvas');
        this.lightCanvas.width = Math.floor(width / 2);
        this.lightCanvas.height = Math.floor(height / 2);
        this.lightCtx = this.lightCanvas.getContext('2d');
        
        // v0.24-r2: 增强光源效果
        this.lightDir = { x: -0.6, y: -0.7, z: 0.4 };
        this.normalize(this.lightDir);
        
        // 动态光源
        this.dynamicLights = [];
        this.maxLights = 12;  // 增加最大光源数
        
        // 环境光强度
        this.ambientIntensity = 0.4;
        
        // 光照颜色调色板
        this.lightColors = {
            warm: '#ffeebb',
            cool: '#bbddff',
            magic: '#ff99cc',
            fire: '#ffaa66'
        };
        
        this.time = 0;
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.lightCanvas.width = Math.floor(width / 2);
        this.lightCanvas.height = Math.floor(height / 2);
    }
    
    normalize(v) {
        const len = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
        v.x /= len; v.y /= len; v.z /= len;
    }
    
    /**
     * 添加动态光源
     */
    addLight(x, y, radius, color, intensity = 1, flicker = false) {
        if (this.dynamicLights.length >= this.maxLights) {
            this.dynamicLights.shift();
        }
        this.dynamicLights.push({
            x, y, radius, color, intensity, flicker,
            currentIntensity: intensity
        });
    }
    
    update(dt, player, enemies) {
        this.time += dt;
        
        // 更新动态光源
        this.dynamicLights.forEach(light => {
            if (light.flicker) {
                light.currentIntensity = light.intensity * 
                    (0.85 + Math.sin(this.time * 10) * 0.1 + Math.random() * 0.1);
            }
        });
        
        // 火把/技能光源跟随实体
        this.dynamicLights = this.dynamicLights.filter(light => {
            // 检查是否还有效
            return light.currentIntensity > 0.01;
        });
    }
    
    /**
     * 绘制法线光照效果
     */
    drawNormalLighting(ctx, camera, entities, floor) {
        // 清空光照贴图
        this.lightCtx.clearRect(0, 0, this.lightCanvas.width, this.lightCanvas.height);
        
        // 绘制环境光
        this.drawAmbientLight(floor);
        
        // 绘制动态光源
        this.dynamicLights.forEach(light => {
            this.drawDynamicLight(light, camera);
        });
        
        // 绘制实体上的光照
        entities.forEach(entity => {
            if (entity.hp <= 0) return;
            this.drawEntityLighting(entity, camera, floor);
        });
        
        // 将光照叠加到主画布
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.drawImage(this.lightCanvas, 0, 0, this.width, this.height);
        ctx.restore();
    }
    
    drawAmbientLight(floor) {
        const colors = this.getAmbientColors(floor);
        
        // 基础环境光渐变
        const gradient = this.lightCtx.createLinearGradient(0, 0, 0, this.lightCanvas.height);
        gradient.addColorStop(0, colors.top);
        gradient.addColorStop(0.5, colors.mid);
        gradient.addColorStop(1, colors.bottom);
        
        this.lightCtx.fillStyle = gradient;
        this.lightCtx.fillRect(0, 0, this.lightCanvas.width, this.lightCanvas.height);
    }
    
    drawDynamicLight(light, camera) {
        const pos = camera.worldToScreen(light.x, light.y);
        if (!isFinite(pos.x) || !isFinite(pos.y)) return;
        
        const screenX = pos.x * 0.5; // 缩放到光照贴图尺寸
        const screenY = pos.y * 0.5;
        const radius = (light.radius || 50) * (camera.zoom || 1) * 0.5;
        if (!isFinite(radius) || radius <= 0) return;
        
        const gradient = this.lightCtx.createRadialGradient(
            screenX, screenY, 0,
            screenX, screenY, radius
        );
        
        gradient.addColorStop(0, this.hexToRgba(light.color, light.currentIntensity));
        gradient.addColorStop(0.5, this.hexToRgba(light.color, light.currentIntensity * 0.3));
        gradient.addColorStop(1, 'rgba(0,0,0,0)');
        
        this.lightCtx.globalCompositeOperation = 'screen';
        this.lightCtx.fillStyle = gradient;
        this.lightCtx.beginPath();
        this.lightCtx.arc(screenX, screenY, radius, 0, Math.PI * 2);
        this.lightCtx.fill();
        this.lightCtx.globalCompositeOperation = 'source-over';
    }
    
    drawEntityLighting(entity, camera, floor) {
        const pos = camera.worldToScreen(entity.x, entity.y);
        if (!isFinite(pos.x) || !isFinite(pos.y)) return;
        
        const screenX = pos.x * 0.5;
        const screenY = (pos.y - 10) * 0.5; // 稍微偏上
        const size = (entity.size || 24) * camera.zoom * 0.5;
        
        // 模拟法线贴图效果 - 根据光源方向计算明暗
        const lightDot = -this.lightDir.z; // 简化计算
        const brightness = 0.5 + lightDot * 0.5;
        
        // 主体光照
        const gradient = this.lightCtx.createRadialGradient(
            screenX, screenY - size * 0.3, size * 0.2,
            screenX, screenY - size * 0.3, size
        );
        
        const highlightColor = this.getHighlightColor(floor);
        gradient.addColorStop(0, `rgba(255, 255, 255, ${brightness * 0.8})`);
        gradient.addColorStop(0.4, this.hexToRgba(highlightColor, brightness * 0.3));
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        this.lightCtx.globalCompositeOperation = 'screen';
        this.lightCtx.fillStyle = gradient;
        this.lightCtx.beginPath();
        this.lightCtx.ellipse(screenX, screenY - size * 0.3, size, size * 0.7, 0, 0, Math.PI * 2);
        this.lightCtx.fill();
        
        // 边缘光（Rim Light）- 增强
        this.lightCtx.globalCompositeOperation = 'screen';
        this.lightCtx.strokeStyle = `rgba(255, 255, 255, ${brightness * 0.6})`;
        this.lightCtx.lineWidth = 3;
        this.lightCtx.beginPath();
        this.lightCtx.ellipse(screenX, screenY - size * 0.3, size * 0.9, size * 0.65, 0, 0, Math.PI * 2);
        this.lightCtx.stroke();
        
        // 内发光
        const innerGlow = this.lightCtx.createRadialGradient(
            screenX, screenY - size * 0.4, 0,
            screenX, screenY - size * 0.4, size * 0.5
        );
        innerGlow.addColorStop(0, `rgba(255, 255, 255, ${brightness * 0.5})`);
        innerGlow.addColorStop(1, 'rgba(255, 255, 255, 0)');
        this.lightCtx.fillStyle = innerGlow;
        this.lightCtx.beginPath();
        this.lightCtx.ellipse(screenX, screenY - size * 0.4, size * 0.5, size * 0.35, 0, 0, Math.PI * 2);
        this.lightCtx.fill();
        
        this.lightCtx.globalCompositeOperation = 'source-over';
    }
    
    /**
     * 绘制地面光照贴图效果
     */
    drawGroundLighting(ctx, room, camera, floor) {
        const pos = camera.worldToScreen(room.x, room.y);
        if (!isFinite(pos.x) || !isFinite(pos.y)) return;
        
        const w = (room.width || 0) * (camera.zoom || 1);
        const h = (room.height || 0) * (camera.zoom || 1);
        if (!isFinite(w) || !isFinite(h) || w <= 0 || h <= 0) return;
        
        // 根据光源方向绘制地面渐变
        const colors = this.getAmbientColors(floor);
        
        ctx.save();
        
        // 对角线光照渐变
        const gradient = ctx.createLinearGradient(pos.x, pos.y, pos.x + w, pos.y + h);
        gradient.addColorStop(0, this.hexToRgba(colors.highlight, 0.2));
        gradient.addColorStop(0.5, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, this.hexToRgba(colors.shadow, 0.3));
        
        ctx.fillStyle = gradient;
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillRect(pos.x, pos.y, w, h);
        
        ctx.restore();
    }
    
    getAmbientColors(floor) {
        // v0.24-r10: 增强光照对比度
        const palettes = {
            1: { top: '#c8f6d8', mid: '#6c9a7b', bottom: '#2d4a3e', highlight: '#d8ffe8', shadow: '#0f1a15' },
            2: { top: '#d8ffd8', mid: '#8cda8c', bottom: '#3d5c3d', highlight: '#e8ffe8', shadow: '#0f2f0f' },
            3: { top: '#ffb8e0', mid: '#ac7a9c', bottom: '#4a304a', highlight: '#ffc6e6', shadow: '#1f0f2f' },
            4: { top: '#ffccaa', mid: '#c86c4d', bottom: '#5c2d1a', highlight: '#ffe0b0', shadow: '#2f0f00' },
            5: { top: '#ffe688', mid: '#9c9c5a', bottom: '#3d3d1a', highlight: '#fff8c8', shadow: '#1f1f0a' },
            6: { top: '#ee5566', mid: '#9c2a3d', bottom: '#3d0a0a', highlight: '#ffb0c0', shadow: '#1f0505' }
        };
        return palettes[floor] || palettes[1];
    }
    
    getHighlightColor(floor) {
        const colors = {
            1: '#c8e6cf',
            2: '#d4f1d4',
            3: '#ff99cc',
            4: '#ffab91',
            5: '#ffd93d',
            6: '#ff6b7d'
        };
        return colors[floor] || colors[1];
    }
    
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}
