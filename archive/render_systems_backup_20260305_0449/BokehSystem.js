// ============================================================
// v0.23-r22 - 散景系统 (Bokeh System)
// HD-2D风格：背景光斑虚化、镜头焦外成像、六边形散景
// ============================================================

export class BokehSystem {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        // 散景形状
        this.bladeCount = 6;  // 光圈叶片数（六边形）
        this.bokehSize = 20;  // 散景大小
        
        // 散景点列表
        this.bokehPoints = [];
        this.maxBokehPoints = 50;
        
        // 焦点距离
        this.focusDistance = 200;
        this.focusRange = 100;
        
        // 散景缓存
        this.bokehCache = new Map();
        
        this.time = 0;
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
    }
    
    update(dt, camera) {
        this.time += dt;
        
        // 更新散景点的动画
        this.bokehPoints.forEach(point => {
            point.phase += dt * point.speed;
            point.currentSize = point.size * (0.8 + Math.sin(point.phase) * 0.2);
        });
    }
    
    /**
     * 添加散景点
     */
    addBokehPoint(x, y, color, size, brightness = 1) {
        if (this.bokehPoints.length >= this.maxBokehPoints) {
            this.bokehPoints.shift();
        }
        
        this.bokehPoints.push({
            x, y,
            color,
            size,
            currentSize: size,
            brightness,
            phase: Math.random() * Math.PI * 2,
            speed: 0.5 + Math.random() * 1.5
        });
    }
    
    /**
     * 生成背景散景点
     */
    generateBackgroundBokeh(floor, camera) {
        // 根据楼层生成不同的散景
        const config = this.getFloorBokehConfig(floor);
        if (!config) return;
        
        // 随机生成散景点
        if (Math.random() < 0.1) {
            const bounds = camera.getViewportBounds ? camera.getViewportBounds() : 
                          { minX: 0, maxX: this.width, minY: 0, maxY: this.height };
            
            this.addBokehPoint(
                bounds.minX + Math.random() * (bounds.maxX - bounds.minX),
                bounds.minY + Math.random() * (bounds.maxY - bounds.minY),
                config.colors[Math.floor(Math.random() * config.colors.length)],
                config.sizeMin + Math.random() * (config.sizeMax - config.sizeMin),
                config.brightness
            );
        }
        
        // 移除离屏的散景点
        this.bokehPoints = this.bokehPoints.filter(p => {
            const age = this.time - (p.phase / p.speed);
            return age < 10;  // 10秒后移除
        });
    }
    
    getFloorBokehConfig(floor) {
        switch(floor) {
            case 1: // 菌丝 - 绿色光点
                return {
                    colors: ['#7fbc8f', '#a8e6cf', '#5c8a6b'],
                    sizeMin: 10,
                    sizeMax: 30,
                    brightness: 0.6
                };
            case 2: // 温室 - 阳光光斑
                return {
                    colors: ['#ffffcc', '#ffff99', '#fff9c4'],
                    sizeMin: 20,
                    sizeMax: 50,
                    brightness: 0.8
                };
            case 3: // 神经 - 粉紫光点
                return {
                    colors: ['#ff79c6', '#ff99cc', '#dda0dd'],
                    sizeMin: 8,
                    sizeMax: 25,
                    brightness: 0.7
                };
            case 4: // 熔炉 - 火星光点
                return {
                    colors: ['#ff6b35', '#ffaa00', '#ff4400'],
                    sizeMin: 5,
                    sizeMax: 20,
                    brightness: 0.9
                };
            case 5: // 庭院 - 金色光斑
                return {
                    colors: ['#d4a574', '#daa520', '#ffd700'],
                    sizeMin: 15,
                    sizeMax: 40,
                    brightness: 0.6
                };
            case 6: // 千根 - 血红光点
                return {
                    colors: ['#ff4444', '#8b0000', '#dc143c'],
                    sizeMin: 12,
                    sizeMax: 35,
                    brightness: 0.7
                };
            default:
                return null;
        }
    }
    
    /**
     * 绘制散景
     */
    drawBokeh(ctx, width, height, camera, focusY) {
        if (this.bokehPoints.length === 0) return;
        
        ctx.save();
        
        // 按距离焦点排序（远的先画）
        const sortedPoints = [...this.bokehPoints].sort((a, b) => {
            const distA = Math.abs(a.y - focusY);
            const distB = Math.abs(b.y - focusY);
            return distB - distA;
        });
        
        sortedPoints.forEach(point => {
            const screenPos = camera.worldToScreen(point.x, point.y);
            
            // 根据距离焦点的远近调整模糊程度
            const distFromFocus = Math.abs(point.y - focusY);
            const blurAmount = Math.min(1, distFromFocus / 300);
            
            this.drawBokehShape(ctx, screenPos.x, screenPos.y, 
                              point.currentSize * (0.5 + blurAmount), 
                              point.color, point.brightness * blurAmount);
        });
        
        ctx.restore();
    }
    
    drawBokehShape(ctx, x, y, size, color, brightness) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = brightness * 0.5;
        
        // 外层光晕
        const outerGradient = ctx.createRadialGradient(x, y, 0, x, y, size * 1.5);
        outerGradient.addColorStop(0, this.hexToRgba(color, 0));
        outerGradient.addColorStop(0.5, this.hexToRgba(color, 0.3));
        outerGradient.addColorStop(1, this.hexToRgba(color, 0));
        
        ctx.fillStyle = outerGradient;
        ctx.beginPath();
        ctx.arc(x, y, size * 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // 六边形散景
        ctx.globalAlpha = brightness;
        ctx.fillStyle = color;
        
        this.drawHexagon(ctx, x, y, size);
        
        // 中心高光
        ctx.globalAlpha = brightness * 0.8;
        const innerGradient = ctx.createRadialGradient(x, y, 0, x, y, size * 0.5);
        innerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        innerGradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
        
        ctx.fillStyle = innerGradient;
        ctx.beginPath();
        ctx.arc(x, y, size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    drawHexagon(ctx, x, y, radius) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const px = x + Math.cos(angle) * radius;
            const py = y + Math.sin(angle) * radius;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
    }
    
    /**
     * 基于深度的散景模糊
     */
    applyDepthBokeh(ctx, sourceCanvas, depthMap, focusDepth) {
        // 简化的深度散景效果
        ctx.save();
        ctx.filter = 'blur(8px)';
        ctx.globalAlpha = 0.3;
        ctx.drawImage(sourceCanvas, 0, 0);
        ctx.filter = 'none';
        ctx.restore();
    }
    
    /**
     * 绘制镜头光斑（用于强光源）
     */
    drawLensArtifact(ctx, x, y, color, intensity) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        
        // 光圈形状
        ctx.globalAlpha = intensity * 0.3;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        
        for (let i = 0; i < 3; i++) {
            const size = 30 + i * 20;
            ctx.globalAlpha = intensity * (0.2 - i * 0.05);
            
            ctx.beginPath();
            for (let j = 0; j < this.bladeCount; j++) {
                const angle = (j / this.bladeCount) * Math.PI * 2 + this.time * 0.5;
                const px = x + Math.cos(angle) * size;
                const py = y + Math.sin(angle) * size;
                if (j === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.closePath();
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}
