// ============================================================
// v0.23-r12 - 动态光源系统 (Dynamic Light System)
// HD-2D风格：手电筒、光源跟随、闪烁效果
// ============================================================

export class DynamicLightSystem {
    constructor() {
        this.time = 0;
        
        // 光源列表
        this.lights = [];
        this.maxLights = 8;  // 同时存在的最大光源数
        
        // v0.23-fix: 降低玩家光源强度，禁用闪烁
        this.playerLight = {
            enabled: true,
            x: 0, y: 0,
            angle: 0,
            spread: Math.PI / 4,  // 减小到45度
            range: 150,           // 减小范围
            color: '#ffeebb',
            intensity: 0.15,      // 进一步降低强度
            flicker: 0            // 禁用闪烁
        };
        
        // 环境光源（火把、灯笼等）
        this.ambientLights = [];
    }
    
    update(dt, player, floor) {
        this.time += dt;
        
        // 更新玩家光源位置
        if (player && this.playerLight.enabled) {
            this.playerLight.x = player.x;
            this.playerLight.y = player.y - 20;  // 稍微偏上
            
            // 根据玩家朝向设置角度
            if (player.facingRight !== undefined) {
                this.playerLight.angle = player.facingRight ? 0 : Math.PI;
            }
            
            // 闪烁效果
            if (this.playerLight.flicker > 0) {
                this.playerLight.currentIntensity = this.playerLight.intensity * 
                    (1 + (Math.random() - 0.5) * this.playerLight.flicker);
            } else {
                this.playerLight.currentIntensity = this.playerLight.intensity;
            }
        }
        
        // 根据楼层调整光源
        this.updateFloorLighting(floor);
        
        // 更新环境光源
        this.ambientLights.forEach(light => {
            if (light.pulse) {
                light.currentIntensity = light.intensity * 
                    (0.8 + Math.sin(this.time * light.pulseSpeed) * 0.2);
            }
            if (light.flicker) {
                light.currentIntensity *= (1 + (Math.random() - 0.5) * 0.1);
            }
        });
    }
    
    updateFloorLighting(floor) {
        // v0.24-fix: 大幅降低亮度，洞穴应该暗
        switch(floor) {
            case 1: // 菌丝 - 微弱生物光
                this.playerLight.color = '#ccffcc';
                this.playerLight.intensity = 0.12;
                this.playerLight.spread = Math.PI / 2.5;
                break;
            case 2: // 温室 - 稍微明亮
                this.playerLight.color = '#ffffee';
                this.playerLight.intensity = 0.15;
                this.playerLight.spread = Math.PI / 3;
                break;
            case 3: // 神经 - 诡异紫光
                this.playerLight.color = '#eebbff';
                this.playerLight.intensity = 0.12;
                this.playerLight.spread = Math.PI / 2;
                this.playerLight.flicker = 0;
                break;
            case 4: // 熔炉 - 火红光
                this.playerLight.color = '#ffccaa';
                this.playerLight.intensity = 0.18;
                this.playerLight.spread = Math.PI / 2.5;
                this.playerLight.flicker = 0;
                break;
            case 5: // 庭院 - 昏暗
                this.playerLight.color = '#ffddaa';
                this.playerLight.intensity = 0.10;
                this.playerLight.spread = Math.PI / 2;
                break;
            case 6: // 千根 - 血红微光
                this.playerLight.color = '#ff6666';
                this.playerLight.intensity = 0.12;
                this.playerLight.spread = Math.PI / 2.2;
                this.playerLight.flicker = 0;
                break;
        }
    }
    
    /**
     * 添加环境光源
     */
    addLight(x, y, color, range, intensity, options = {}) {
        if (this.ambientLights.length >= this.maxLights) {
            // 移除最旧的光源
            this.ambientLights.shift();
        }
        
        this.ambientLights.push({
            x, y,
            color,
            range,
            intensity,
            currentIntensity: intensity,
            pulse: options.pulse || false,
            pulseSpeed: options.pulseSpeed || 2,
            flicker: options.flicker || false,
            life: options.life || Infinity,
            maxLife: options.life || Infinity
        });
    }
    
    /**
     * 绘制光照贴图（遮罩方式）
     */
    drawLighting(ctx, width, height, camera) {
        // 创建光照层
        const lightCanvas = document.createElement('canvas');
        lightCanvas.width = width;
        lightCanvas.height = height;
        const lightCtx = lightCanvas.getContext('2d');
        
        // 填充基础黑暗
        const floorDarkness = this.getFloorDarkness();
        lightCtx.fillStyle = `rgba(0, 0, 0, ${floorDarkness})`;
        lightCtx.fillRect(0, 0, width, height);
        
        // 使用destination-out模式绘制光照区域
        lightCtx.globalCompositeOperation = 'destination-out';
        
        // 绘制玩家光源
        if (this.playerLight.enabled) {
            this.drawConeLight(lightCtx, this.playerLight, camera);
        }
        
        // 绘制环境光源
        this.ambientLights.forEach(light => {
            this.drawPointLight(lightCtx, light, camera);
        });
        
        // 将光照层叠加到主画面
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.drawImage(lightCanvas, 0, 0);
        ctx.restore();
        
        // 绘制光源本身（辉光效果）
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        
        if (this.playerLight.enabled) {
            this.drawLightGlow(ctx, this.playerLight, camera);
        }
        
        this.ambientLights.forEach(light => {
            this.drawLightGlow(ctx, light, camera);
        });
        
        ctx.restore();
    }
    
    drawConeLight(ctx, light, camera) {
        const pos = camera.worldToScreen(light.x, light.y);
        const range = light.range * camera.zoom;
        
        // 修复：确保 currentIntensity 有值
        const intensity = light.currentIntensity !== undefined ? light.currentIntensity : (light.intensity || 0.5);
        
        const gradient = ctx.createRadialGradient(
            pos.x, pos.y, 0,
            pos.x, pos.y, range
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${intensity})`);
        gradient.addColorStop(0.5, `rgba(255, 255, 255, ${intensity * 0.5})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        
        // 锥形光照
        const angle1 = light.angle - light.spread / 2;
        const angle2 = light.angle + light.spread / 2;
        
        ctx.moveTo(pos.x, pos.y);
        ctx.arc(pos.x, pos.y, range, angle1, angle2);
        ctx.closePath();
        ctx.fill();
    }
    
    drawPointLight(ctx, light, camera) {
        const pos = camera.worldToScreen(light.x, light.y);
        const range = light.range * camera.zoom;
        
        // 修复：确保 currentIntensity 有值
        const intensity = light.currentIntensity !== undefined ? light.currentIntensity : (light.intensity || 0.5);
        
        const gradient = ctx.createRadialGradient(
            pos.x, pos.y, 0,
            pos.x, pos.y, range
        );
        gradient.addColorStop(0, `rgba(255, 255, 255, ${intensity})`);
        gradient.addColorStop(0.7, `rgba(255, 255, 255, ${intensity * 0.3})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, range, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawLightGlow(ctx, light, camera) {
        const pos = camera.worldToScreen(light.x, light.y);
        
        // 修复：确保 currentIntensity 有值
        const intensity = light.currentIntensity !== undefined ? light.currentIntensity : (light.intensity || 0.5);
        const size = 20 * intensity;
        
        ctx.globalAlpha = intensity * 0.5;
        ctx.fillStyle = light.color;
        ctx.shadowBlur = size * 2;
        ctx.shadowColor = light.color;
        
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
    }
    
    getFloorDarkness() {
        // 返回每层的黑暗程度
        switch(Math.floor(this.time / 10) % 6 + 1) {
            case 1: return 0.3;
            case 2: return 0.2;
            case 3: return 0.4;
            case 4: return 0.35;
            case 5: return 0.5;
            case 6: return 0.6;
            default: return 0.3;
        }
    }
}
