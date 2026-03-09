// ============================================================
// v0.23-r18 - 材质系统 (Material System)
// HD-2D风格：金属、石头、木头、皮肤等不同材质的物理属性
// ============================================================

export class MaterialSystem {
    constructor() {
        // 材质定义
        this.materials = {
            metal: {
                roughness: 0.1,
                metallic: 1.0,
                reflectivity: 0.8,
                specularColor: '#ffffff',
                rimLight: 0.8,
                envMapStrength: 0.5
            },
            stone: {
                roughness: 0.9,
                metallic: 0.0,
                reflectivity: 0.1,
                specularColor: '#aaaaaa',
                rimLight: 0.2,
                envMapStrength: 0.1
            },
            wood: {
                roughness: 0.7,
                metallic: 0.0,
                reflectivity: 0.15,
                specularColor: '#ccaa88',
                rimLight: 0.3,
                envMapStrength: 0.1
            },
            skin: {
                roughness: 0.5,
                metallic: 0.0,
                reflectivity: 0.2,
                specularColor: '#ffdddd',
                rimLight: 0.4,
                envMapStrength: 0.15,
                subsurface: 0.3  // 次表面散射
            },
            slime: {
                roughness: 0.05,
                metallic: 0.0,
                reflectivity: 0.4,
                specularColor: '#88ff88',
                rimLight: 0.9,
                envMapStrength: 0.6,
                translucency: 0.5
            },
            crystal: {
                roughness: 0.0,
                metallic: 0.0,
                reflectivity: 0.9,
                specularColor: '#ffffff',
                rimLight: 1.0,
                envMapStrength: 0.8,
                iridescence: true  // 彩虹色
            },
            fabric: {
                roughness: 0.8,
                metallic: 0.0,
                reflectivity: 0.05,
                specularColor: '#dddddd',
                rimLight: 0.25,
                envMapStrength: 0.05
            },
            lava: {
                roughness: 0.4,
                metallic: 0.0,
                reflectivity: 0.3,
                specularColor: '#ff4400',
                rimLight: 0.7,
                envMapStrength: 0.3,
                emissive: 0.6  // 自发光
            }
        };
        
        this.time = 0;
    }
    
    update(dt) {
        this.time += dt;
    }
    
    /**
     * 获取材质属性
     */
    getMaterial(materialName) {
        return this.materials[materialName] || this.materials.stone;
    }
    
    /**
     * 应用材质光照
     */
    applyMaterial(ctx, x, y, width, height, materialName, lightDir, lightColor, lightIntensity) {
        const mat = this.getMaterial(materialName);
        if (!mat) return;
        
        ctx.save();
        
        // 1. 漫反射基础
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = `rgba(0, 0, 0, ${mat.roughness * 0.3})`;
        ctx.fillRect(x - width/2, y - height/2, width, height);
        
        // 2. 镜面反射（高光）
        if (mat.reflectivity > 0) {
            ctx.globalCompositeOperation = 'screen';
            
            // 计算高光位置（基于光源方向）
            const specularX = x - lightDir.x * width * 0.3;
            const specularY = y - height * 0.2 - lightDir.y * height * 0.3;
            
            // 高光大小基于粗糙度
            const specularSize = width * (1 - mat.roughness) * 0.5;
            
            const gradient = ctx.createRadialGradient(
                specularX, specularY, 0,
                specularX, specularY, specularSize
            );
            
            const specAlpha = mat.reflectivity * lightIntensity;
            gradient.addColorStop(0, this.hexToRgba(mat.specularColor, specAlpha));
            gradient.addColorStop(0.5, this.hexToRgba(mat.specularColor, specAlpha * 0.5));
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(specularX, specularY, specularSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 3. 金属反射环境
        if (mat.metallic > 0) {
            ctx.globalCompositeOperation = 'overlay';
            ctx.globalAlpha = mat.metallic * 0.3;
            ctx.fillStyle = '#888888';
            ctx.fillRect(x - width/2, y - height/2, width, height);
        }
        
        // 4. 边缘光（菲涅尔效应）
        if (mat.rimLight > 0) {
            ctx.globalCompositeOperation = 'screen';
            ctx.globalAlpha = mat.rimLight * 0.4;
            
            const rimGradient = ctx.createRadialGradient(
                x, y, width * 0.3,
                x, y, width * 0.8
            );
            rimGradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
            rimGradient.addColorStop(1, this.hexToRgba(lightColor, 0.5));
            
            ctx.fillStyle = rimGradient;
            ctx.fillRect(x - width/2, y - height/2, width, height);
        }
        
        // 5. 次表面散射（皮肤/蜡质）
        if (mat.subsurface > 0) {
            ctx.globalCompositeOperation = 'screen';
            ctx.globalAlpha = mat.subsurface * 0.3;
            
            const sssGradient = ctx.createRadialGradient(
                x, y + height * 0.2, 0,
                x, y, width
            );
            sssGradient.addColorStop(0, 'rgba(255, 200, 150, 0.5)');
            sssGradient.addColorStop(1, 'rgba(255, 200, 150, 0)');
            
            ctx.fillStyle = sssGradient;
            ctx.fillRect(x - width/2, y - height/2, width, height);
        }
        
        // 6. 自发光
        if (mat.emissive > 0) {
            ctx.globalCompositeOperation = 'screen';
            ctx.globalAlpha = mat.emissive;
            ctx.shadowBlur = 30;
            ctx.shadowColor = mat.specularColor;
            ctx.fillStyle = mat.specularColor;
            ctx.fillRect(x - width/2, y - height/2, width, height);
            ctx.shadowBlur = 0;
        }
        
        // 7. 彩虹色（水晶）
        if (mat.iridescence) {
            this.applyIridescence(ctx, x, y, width, height);
        }
        
        // 8. 半透明（粘液）
        if (mat.translucency > 0) {
            ctx.globalCompositeOperation = 'screen';
            ctx.globalAlpha = mat.translucency * 0.2;
            ctx.fillStyle = mat.specularColor;
            ctx.fillRect(x - width/2, y - height/2, width, height);
        }
        
        ctx.restore();
    }
    
    applyIridescence(ctx, x, y, width, height) {
        ctx.save();
        ctx.globalCompositeOperation = 'overlay';
        
        // 彩虹渐变
        const colors = ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#0088ff', '#8800ff'];
        const hue = (this.time * 50) % 360;
        
        const gradient = ctx.createLinearGradient(
            x - width/2, y - height/2,
            x + width/2, y + height/2
        );
        
        gradient.addColorStop(0, `hsla(${hue}, 100%, 70%, 0.3)`);
        gradient.addColorStop(0.5, `hsla(${(hue + 60) % 360}, 100%, 70%, 0.2)`);
        gradient.addColorStop(1, `hsla(${(hue + 120) % 360}, 100%, 70%, 0.3)`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x - width/2, y - height/2, width, height);
        ctx.restore();
    }
    
    /**
     * 绘制材质纹理细节
     */
    drawMaterialDetail(ctx, x, y, width, height, materialName) {
        switch(materialName) {
            case 'wood':
                this.drawWoodGrain(ctx, x, y, width, height);
                break;
            case 'stone':
                this.drawStoneTexture(ctx, x, y, width, height);
                break;
            case 'fabric':
                this.drawFabricWeave(ctx, x, y, width, height);
                break;
        }
    }
    
    drawWoodGrain(ctx, x, y, width, height) {
        ctx.save();
        ctx.strokeStyle = 'rgba(100, 70, 40, 0.2)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < 5; i++) {
            const grainY = y - height/2 + (i / 4) * height;
            ctx.beginPath();
            ctx.moveTo(x - width/2, grainY);
            
            for (let j = 0; j <= width; j += 10) {
                const offset = Math.sin(j * 0.1 + i) * 3;
                ctx.lineTo(x - width/2 + j, grainY + offset);
            }
            
            ctx.stroke();
        }
        ctx.restore();
    }
    
    drawStoneTexture(ctx, x, y, width, height) {
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        
        for (let i = 0; i < 10; i++) {
            const px = x - width/2 + Math.random() * width;
            const py = y - height/2 + Math.random() * height;
            const size = 2 + Math.random() * 4;
            
            ctx.beginPath();
            ctx.arc(px, py, size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
    
    drawFabricWeave(ctx, x, y, width, height) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 0.5;
        
        const gridSize = 8;
        
        for (let i = 0; i < width; i += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x - width/2 + i, y - height/2);
            ctx.lineTo(x - width/2 + i, y + height/2);
            ctx.stroke();
        }
        
        for (let i = 0; i < height; i += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x - width/2, y - height/2 + i);
            ctx.lineTo(x + width/2, y - height/2 + i);
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
