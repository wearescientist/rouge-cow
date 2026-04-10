/**
 * LightManager.js - 光源管理器
 * 管理场景中的所有光源
 */

class LightManager {
    constructor() {
        this.lights = [];
        this.maxLights = 16; // 最大光源数量
        
        // 环境光
        this.ambientLight = {
            color: { r: 40, g: 40, b: 60 },
            intensity: 0.3
        };
    }

    /**
     * 添加点光源
     */
    addPointLight(x, y, config = {}) {
        const light = {
            type: 'point',
            x: x,
            y: y,
            z: config.z || 0,
            range: config.range || 150,
            intensity: config.intensity || 1.0,
            color: config.color || { r: 255, g: 220, b: 180 },
            flicker: config.flicker || false,
            flickerSpeed: config.flickerSpeed || 0.1,
            flickerRange: config.flickerRange || 0.1,
            time: 0
        };
        
        if (this.lights.length >= this.maxLights) {
            // 移除最远的光源
            this.cullDistantLights(x, y);
        }
        
        this.lights.push(light);
        return light;
    }

    /**
     * 添加方向光 (模拟太阳/月亮)
     */
    addDirectionalLight(direction, config = {}) {
        const light = {
            type: 'directional',
            direction: direction, // {x, y, z} 单位向量
            intensity: config.intensity || 0.5,
            color: config.color || { r: 255, g: 255, b: 240 }
        };
        
        this.lights.push(light);
        return light;
    }

    /**
     * 移除远处的光源
     */
    cullDistantLights(playerX, playerY) {
        // 按距离排序，移除最远的
        this.lights.sort((a, b) => {
            const distA = Math.hypot(a.x - playerX, a.y - playerY);
            const distB = Math.hypot(b.x - playerX, b.y - playerY);
            return distB - distA;
        });
        
        // 移除最远的一个
        this.lights.pop();
    }

    /**
     * 更新光源 (闪烁等效果)
     */
    update(deltaTime) {
        for (const light of this.lights) {
            if (light.flicker) {
                light.time += deltaTime;
                const flicker = Math.sin(light.time * light.flickerSpeed) * light.flickerRange;
                light.currentIntensity = light.intensity + flicker;
            } else {
                light.currentIntensity = light.intensity;
            }
        }
    }

    /**
     * 获取所有光源
     */
    getLights() {
        return this.lights;
    }

    /**
     * 设置环境光
     */
    setAmbientLight(color, intensity) {
        this.ambientLight = {
            color: color,
            intensity: intensity
        };
    }

    /**
     * 清除所有光源
     */
    clear() {
        this.lights = [];
    }

    /**
     * 创建火把光源 (带闪烁)
     */
    createTorch(x, y) {
        return this.addPointLight(x, y, {
            range: 120,
            intensity: 1.2,
            color: { r: 255, g: 180, b: 100 },
            flicker: true,
            flickerSpeed: 10,
            flickerRange: 0.2
        });
    }

    /**
     * 创建技能光源 (爆炸等)
     */
    createExplosion(x, y) {
        return this.addPointLight(x, y, {
            range: 200,
            intensity: 2.0,
            color: { r: 255, g: 200, b: 150 },
            flicker: true,
            flickerSpeed: 20,
            flickerRange: 0.3
        });
    }

    /**
     * 移除指定光源
     */
    removeLight(light) {
        const index = this.lights.indexOf(light);
        if (index > -1) {
            this.lights.splice(index, 1);
        }
    }
}

window.LightManager = LightManager;
