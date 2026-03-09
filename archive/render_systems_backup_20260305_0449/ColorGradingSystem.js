// ============================================================
// v0.23-r8 - 色彩分级系统 (Color Grading System)
// HD-2D风格：LUT模拟、色调映射、胶片质感
// ============================================================

export class ColorGradingSystem {
    constructor() {
        // v0.23-fix: 简化色彩配置，降低对比度和饱和度
        this.floorColors = {
            1: {
                shadows: '#2d4a3e',
                midtones: '#5c8a6b',
                highlights: '#a8e6cf',
                contrast: 1.05,      // 降低
                saturation: 1.0,     // 降低
                temperature: -0.05
            },
            2: {
                shadows: '#3d5c3d',
                midtones: '#7cba7c',
                highlights: '#d4f1d4',
                contrast: 1.02,
                saturation: 1.05,
                temperature: 0.05
            },
            3: {
                shadows: '#4a304a',
                midtones: '#9c6b8c',
                highlights: '#ff79c6',
                contrast: 1.08,
                saturation: 1.1,
                temperature: 0.1
            },
            4: {
                shadows: '#5c2d1a',
                midtones: '#b85c3d',
                highlights: '#ffab91',
                contrast: 1.1,
                saturation: 1.08,
                temperature: 0.2
            },
            5: {
                shadows: '#3d3d1a',
                midtones: '#8c8c4a',
                highlights: '#dcdc9c',
                contrast: 1.05,
                saturation: 0.95,
                temperature: 0.08
            },
            6: {
                shadows: '#3d0a0a',
                midtones: '#8c1a2d',
                highlights: '#ff6b7d',
                contrast: 1.12,
                saturation: 1.15,
                temperature: 0.15
            }
        };
        
        this.currentFloor = 1;
    }
    
    setFloor(floor) {
        this.currentFloor = floor;
    }
    
    /**
     * v0.23-r8: 应用色彩分级
     */
    applyColorGrading(ctx, width, height) {
        const config = this.floorColors[this.currentFloor];
        if (!config) return;
        
        ctx.save();
        
        // 1. 阴影着色
        const shadowGradient = ctx.createRadialGradient(
            width / 2, height / 2, 0,
            width / 2, height / 2, Math.max(width, height)
        );
        shadowGradient.addColorStop(0, this.hexToRgba(config.shadows, 0));
        shadowGradient.addColorStop(1, this.hexToRgba(config.shadows, 0.3));
        
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = shadowGradient;
        ctx.fillRect(0, 0, width, height);
        
        // 2. 高光着色
        const highlightGradient = ctx.createRadialGradient(
            width * 0.3, height * 0.2, 0,
            width * 0.5, height * 0.5, width * 0.8
        );
        highlightGradient.addColorStop(0, this.hexToRgba(config.highlights, 0.2));
        highlightGradient.addColorStop(1, 'rgba(255,255,255,0)');
        
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = highlightGradient;
        ctx.fillRect(0, 0, width, height);
        
        // 3. 色温调整
        if (config.temperature !== 0) {
            ctx.globalCompositeOperation = 'overlay';
            const tempColor = config.temperature > 0 ? '#ffaa55' : '#55aaff';
            ctx.fillStyle = this.hexToRgba(tempColor, Math.abs(config.temperature) * 0.15);
            ctx.fillRect(0, 0, width, height);
        }
        
        ctx.restore();
    }
    
    /**
     * 对比度和饱和度调整
     */
    applyContrastSaturation(ctx, width, height) {
        const config = this.floorColors[this.currentFloor];
        if (!config) return;
        
        // 使用CSS filter（性能优化）
        const contrast = Math.round((config.contrast - 1) * 100);
        const saturate = Math.round(config.saturation * 100);
        
        if (contrast !== 0 || saturate !== 100) {
            ctx.save();
            ctx.filter = `contrast(${100 + contrast}%) saturate(${saturate}%)`;
            ctx.drawImage(ctx.canvas, 0, 0);
            ctx.filter = 'none';
            ctx.restore();
        }
    }
    
    /**
     * 添加胶片质感
     */
    applyFilmLook(ctx, width, height) {
        ctx.save();
        
        // 1. 轻微对比度提升（S曲线模拟）
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = 'rgba(128, 128, 128, 0.1)';
        ctx.fillRect(0, 0, width, height);
        
        // 2. 暗角增强
        const vignette = ctx.createRadialGradient(
            width / 2, height / 2, height * 0.25,
            width / 2, height / 2, height * 0.85
        );
        vignette.addColorStop(0, 'rgba(0,0,0,0)');
        vignette.addColorStop(0.7, 'rgba(0,0,0,0.1)');
        vignette.addColorStop(1, 'rgba(0,0,0,0.35)');
        
        ctx.globalCompositeOperation = 'multiply';
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, width, height);
        
        ctx.restore();
    }
    
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}
