// ============================================================
// v0.23-r23 - 风格化系统 (Stylization System)
// HD-2D风格：色调分离、卡通渲染、边缘检测、水彩效果
// ============================================================

export class StylizationSystem {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        // 风格化参数
        this.posterizationLevels = 6;  // 色调分离等级
        this.edgeThreshold = 0.1;      // 边缘检测阈值
        this.celShadingBands = 4;      // 卡通着色色带数
        
        // 水彩参数
        this.watercolorBleed = 0.3;
        
        // 半调网点
        this.halftoneSize = 4;
        
        this.time = 0;
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
    }
    
    update(dt) {
        this.time += dt;
    }
    
    /**
     * 应用色调分离（Posterization）
     */
    applyPosterization(ctx, width, height, levels = this.posterizationLevels) {
        // 获取图像数据
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        const step = 255 / (levels - 1);
        
        for (let i = 0; i < data.length; i += 4) {
            // 对每个颜色通道应用色调分离
            data[i] = Math.round(data[i] / step) * step;     // R
            data[i + 1] = Math.round(data[i + 1] / step) * step; // G
            data[i + 2] = Math.round(data[i + 2] / step) * step; // B
        }
        
        ctx.putImageData(imageData, 0, 0);
    }
    
    /**
     * 卡通着色（Cel Shading）
     */
    applyCelShading(ctx, width, height) {
        ctx.save();
        
        // 创建色带查找表
        const bands = this.celShadingBands;
        
        // 使用更简单的渐变映射方法
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        
        for (let i = 0; i < bands; i++) {
            const t = i / (bands - 1);
            const brightness = Math.round(t * 255);
            gradient.addColorStop(t, `rgb(${brightness}, ${brightness}, ${brightness})`);
        }
        
        ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        
        ctx.restore();
    }
    
    /**
     * 绘制描边边缘
     */
    drawOutlineEdge(ctx, entity, camera, color = '#000000', thickness = 2) {
        const pos = camera.worldToScreen(entity.x, entity.y);
        const size = (entity.size || 24) * camera.zoom;
        
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = thickness;
        ctx.lineJoin = 'round';
        
        // 绘制粗轮廓
        ctx.beginPath();
        ctx.arc(pos.x, pos.y - size * 0.3, size * 0.7, 0, Math.PI * 2);
        ctx.stroke();
        
        // 内部细节线
        ctx.lineWidth = thickness * 0.5;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y - size * 0.3, size * 0.5, 0, Math.PI * 2);
        ctx.stroke();
        
        ctx.restore();
    }
    
    /**
     * 应用半调网点效果
     */
    applyHalftone(ctx, width, height, dotSize = this.halftoneSize) {
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        
        // 绘制网点图案
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        
        for (let y = 0; y < height; y += dotSize * 2) {
            for (let x = 0; x < width; x += dotSize * 2) {
                // 根据位置变化网点大小
                const size = dotSize * (0.5 + Math.sin(x * 0.01 + this.time) * 0.2);
                
                ctx.beginPath();
                ctx.arc(x, y, size, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        ctx.restore();
    }
    
    /**
     * 应用交叉阴影线（Hatching）
     */
    applyHatching(ctx, width, height, angle = 45) {
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = 0.1;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        
        const spacing = 10;
        const rad = (angle * Math.PI) / 180;
        
        // 计算线的起点和终点
        const diagonal = Math.sqrt(width * width + height * height);
        
        for (let i = -diagonal; i < diagonal; i += spacing) {
            const x1 = i * Math.cos(rad);
            const y1 = i * Math.sin(rad);
            const x2 = x1 + height * Math.sin(rad);
            const y2 = y1 - height * Math.cos(rad);
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    /**
     * 绘制速度线（漫画风格）
     */
    drawSpeedLines(ctx, centerX, centerY, intensity = 1) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = intensity * 0.3;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        
        const lineCount = 20;
        const maxRadius = Math.max(this.width, this.height);
        
        for (let i = 0; i < lineCount; i++) {
            const angle = (i / lineCount) * Math.PI * 2 + this.time * 0.5;
            const innerRadius = 50 + Math.random() * 50;
            
            const x1 = centerX + Math.cos(angle) * innerRadius;
            const y1 = centerY + Math.sin(angle) * innerRadius;
            const x2 = centerX + Math.cos(angle) * maxRadius;
            const y2 = centerY + Math.sin(angle) * maxRadius;
            
            const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
            gradient.addColorStop(0.3, `rgba(255, 255, 255, ${intensity})`);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.strokeStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    /**
     * 应用色块风格（类似八方旅人）
     */
    applyColorBlockStyle(ctx, width, height) {
        ctx.save();
        
        // 增强饱和度
        ctx.filter = 'saturate(1.3) contrast(1.1)';
        ctx.drawImage(ctx.canvas, 0, 0);
        ctx.filter = 'none';
        
        // 添加细微的纹理
        ctx.globalCompositeOperation = 'overlay';
        ctx.globalAlpha = 0.05;
        ctx.fillStyle = '#808080';
        
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const size = 20 + Math.random() * 30;
            
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    /**
     * 绘制集中线（漫画焦点效果）
     */
    drawFocusLines(ctx, focusX, focusY, intensity = 1) {
        ctx.save();
        ctx.globalCompositeOperation = 'multiply';
        ctx.globalAlpha = intensity * 0.2;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1;
        
        const lineCount = 40;
        const maxDist = Math.sqrt(this.width ** 2 + this.height ** 2);
        
        for (let i = 0; i < lineCount; i++) {
            const angle = (i / lineCount) * Math.PI * 2;
            const x1 = focusX + Math.cos(angle) * 100;
            const y1 = focusY + Math.sin(angle) * 100;
            const x2 = focusX + Math.cos(angle) * maxDist;
            const y2 = focusY + Math.sin(angle) * maxDist;
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    /**
     * 应用水彩边缘效果
     */
    applyWatercolorEdge(ctx, width, height) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = 0.1;
        
        // 模拟颜料扩散
        for (let i = 0; i < 20; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            const radius = 30 + Math.random() * 50;
            
            const hue = Math.random() * 360;
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, `hsla(${hue}, 70%, 80%, 0.3)`);
            gradient.addColorStop(1, 'hsla(0, 0%, 0%, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    /**
     * 综合风格化处理（一键应用HD-2D风格）
     */
    applyHD2DStyle(ctx, width, height, options = {}) {
        // v0.23-fix: 禁用所有可能让画面脏的风格化效果
        const {
            posterization = false,  // 禁用
            celShading = false,     // 禁用
            halftone = false,       // 禁用
            hatching = false,       // 禁用
            colorBlock = false      // 禁用
        } = options;
        
        // 所有效果默认禁用，保持画面干净
        // 如需启用可手动设置options
        
        if (colorBlock) {
            this.applyColorBlockStyle(ctx, width, height);
        }
        
        if (posterization) {
            // this.applyPosterization(ctx, width, height, 8);
        }
        
        if (celShading) {
            this.applyCelShading(ctx, width, height);
        }
        
        if (halftone) {
            this.applyHalftone(ctx, width, height);
        }
        if (hatching) {
            this.applyHatching(ctx, width, height);
        }
    }
}
