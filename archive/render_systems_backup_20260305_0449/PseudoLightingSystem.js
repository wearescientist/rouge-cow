// ============================================================
// v0.23 - 伪法线光照系统 (Pseudo Normal Lighting)
// HD-2D风格：强对比度 + 戏剧性光照
// ============================================================

export class PseudoLightingSystem {
    constructor() {
        // 光源位置（左上方45度，模拟日光）
        this.lightDir = { x: -0.7, y: -0.7 };
        
        // v0.23-fix: 简化光照，降低对比度，让画面更清晰
        this.floorLighting = {
            1: { 
                lightColor: '#a8e6cf', 
                lightIntensity: 0.25,  // 降低
                ambient: 0.85,  // 提高环境光
                shadowStrength: 0.2 
            },
            2: { 
                lightColor: '#d4f1d4', 
                lightIntensity: 0.3,
                ambient: 0.9,
                shadowStrength: 0.15
            },
            3: { 
                lightColor: '#ff79c6', 
                lightIntensity: 0.35,
                ambient: 0.8,
                shadowStrength: 0.25
            },
            4: { 
                lightColor: '#ff6b35', 
                lightIntensity: 0.4,
                ambient: 0.75,
                shadowStrength: 0.2
            },
            5: { 
                lightColor: '#ffd93d', 
                lightIntensity: 0.22,
                ambient: 0.85,
                shadowStrength: 0.2
            },
            6: { 
                lightColor: '#ff1744', 
                lightIntensity: 0.45,
                ambient: 0.7,
                shadowStrength: 0.3
            }
        };
        
        this.currentFloor = 1;
        this.time = 0;
    }
    
    setFloor(floor) {
        this.currentFloor = floor;
    }
    
    update(dt) {
        this.time += dt;
        
        const config = this.floorLighting[this.currentFloor];
        if (!config) return;
        
        // 动态光源效果
        if (config.pulseSpeed) {
            const pulse = Math.sin(this.time * config.pulseSpeed) * 0.15 + 0.85;
            config.currentIntensity = config.lightIntensity * pulse;
        } else if (config.flicker) {
            const flicker = Math.random() * 0.2 + 0.8;
            config.currentIntensity = config.lightIntensity * flicker;
        } else {
            config.currentIntensity = config.lightIntensity;
        }
    }
    
    /**
     * v0.23-r1: HD-2D风格光照 - 强对比度
     */
    applyLightingToEntity(ctx, x, y, width, height, entityType = 'entity') {
        const config = this.floorLighting[this.currentFloor];
        if (!config) return;
        
        const intensity = config.currentIntensity || config.lightIntensity;
        ctx.save();
        
        // 1. 主光源高光（左上）- 更集中的高光
        const mainLight = ctx.createRadialGradient(
            x - width * 0.35, y - height * 0.4, 0,
            x - width * 0.2, y - height * 0.2, width * 0.7
        );
        mainLight.addColorStop(0, this.hexToRgba('#ffffff', intensity * 0.7));
        mainLight.addColorStop(0.3, this.hexToRgba(config.lightColor, intensity * 0.5));
        mainLight.addColorStop(1, 'rgba(255,255,255,0)');
        
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = mainLight;
        ctx.fillRect(x - width/2, y - height/2, width, height);
        
        // 2. 法线模拟 - 右侧边缘强光（Rim Lighting）
        ctx.globalCompositeOperation = 'screen';
        const rimLight = ctx.createLinearGradient(
            x + width * 0.2, y - height * 0.5,
            x + width * 0.6, y + height * 0.3
        );
        rimLight.addColorStop(0, this.hexToRgba(config.lightColor, intensity * 0.6));
        rimLight.addColorStop(0.5, this.hexToRgba('#ffffff', intensity * 0.4));
        rimLight.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = rimLight;
        ctx.fillRect(x - width/2, y - height/2, width, height);
        
        // 3. 环境光遮蔽（AO）- 底部和左侧暗角
        ctx.globalCompositeOperation = 'multiply';
        const aoGradient = ctx.createRadialGradient(
            x, y + height * 0.3, 0,
            x, y, width * 0.9
        );
        aoGradient.addColorStop(0, `rgba(0,0,0,${config.shadowStrength || 0.4})`);
        aoGradient.addColorStop(0.6, `rgba(0,0,0,${(config.shadowStrength || 0.4) * 0.5})`);
        aoGradient.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = aoGradient;
        ctx.fillRect(x - width/2, y - height/2, width, height);
        
        // 4. 轮廓强化 - 细微描边
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = this.hexToRgba(config.lightColor, intensity * 0.15);
        ctx.lineWidth = 1.5;
        ctx.strokeRect(x - width/2, y - height/2, width, height);
        
        ctx.restore();
    }
    
    /**
     * 精灵图光照版本
     */
    drawWithLighting(ctx, sprite, x, y, width, height, entityType = 'entity') {
        const config = this.floorLighting[this.currentFloor];
        if (!config || !sprite) {
            if (sprite) ctx.drawImage(sprite, x - width/2, y - height/2, width, height);
            return;
        }
        
        ctx.save();
        ctx.drawImage(sprite, x - width/2, y - height/2, width, height);
        ctx.restore();
        
        // 应用相同的光照效果
        this.applyLightingToEntity(ctx, x, y, width, height, entityType);
    }
    
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}
