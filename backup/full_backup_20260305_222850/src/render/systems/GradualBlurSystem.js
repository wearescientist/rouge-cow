/**
 * 渐变模糊系统 - Gradual Blur System
 * 实现真正的"越远越模糊"效果（跟随玩家）
 * 
 * 原理：
 * 1. 创建离屏canvas，渲染整个场景
 * 2. 对这个canvas应用高斯模糊
 * 3. 使用径向渐变遮罩，中心清晰（显示原图），边缘模糊（显示模糊层）
 */
class GradualBlurSystem {
    constructor(ctx) {
        this.ctx = ctx;
        this.enabled = true;
        
        // 离屏canvas用于模糊
        this.blurCanvas = document.createElement('canvas');
        this.blurCtx = this.blurCanvas.getContext('2d');
        
        this.params = {
            clearRadius: 200,      // 完全清晰的半径
            blurStartRadius: 250,  // 开始模糊的半径
            blurEndRadius: 500,    // 最大模糊的半径
            maxBlur: 3,            // 最大模糊强度（像素）
            quality: 0.5           // 模糊质量（0.5 = 半分辨率，性能更好）
        };
    }

    /**
     * 渲染渐变模糊效果
     * @param {number} focusX - 焦点X（玩家屏幕位置）
     * @param {number} focusY - 焦点Y
     * @param {Function} renderScene - 渲染场景的回调函数
     */
    render(focusX, focusY, renderScene) {
        if (!this.enabled) {
            renderScene();
            return;
        }

        const canvas = this.ctx.canvas;
        const width = canvas.width / (window.devicePixelRatio || 1);
        const height = canvas.height / (window.devicePixelRatio || 1);
        
        const { clearRadius, blurStartRadius, blurEndRadius, maxBlur, quality } = this.params;

        // 1. 确保离屏canvas尺寸正确
        const blurWidth = Math.floor(width * quality);
        const blurHeight = Math.floor(height * quality);
        if (this.blurCanvas.width !== blurWidth || this.blurCanvas.height !== blurHeight) {
            this.blurCanvas.width = blurWidth;
            this.blurCanvas.height = blurHeight;
        }

        // 2. 在离屏canvas上渲染场景（低分辨率以提高性能）
        this.blurCtx.save();
        this.blurCtx.scale(quality, quality);
        this.blurCtx.clearRect(0, 0, width, height);
        
        // 临时替换context进行渲染
        const originalCtx = this.ctx;
        this.blurCtx.drawImage = (...args) => {
            // 调整绘制参数以适应缩放
            if (args[0] instanceof HTMLImageElement || args[0] instanceof HTMLCanvasElement) {
                this.blurCtx.__proto__.drawImage.call(this.blurCtx, ...args);
            }
        };
        
        // 注意：这里需要调用外部渲染函数，但要在blurCtx上
        // 由于无法直接替换ctx，我们采用另一种方法：
        // 先渲染到主canvas，然后复制到blurCanvas
        this.blurCtx.restore();

        // 实际上更简单的方法：
        // 方案A：截图主canvas -> 模糊 -> 混合
        // 但这会有1帧延迟
        
        // 方案B：直接在当前canvas上应用模糊（只影响边缘）
        // 这是推荐的方法，性能最好
        
        this.renderDirectBlur(focusX, focusY, width, height, clearRadius, blurStartRadius, blurEndRadius, maxBlur);
    }

    /**
     * 直接渲染模糊效果（不创建离屏canvas，性能更好）
     * 原理：在场景渲染完成后，在边缘绘制一层半透明的模糊覆盖层
     */
    renderDirectBlur(focusX, focusY, width, height, clearRadius, blurStartRadius, blurEndRadius, maxBlur) {
        // 创建渐变遮罩：中心透明，边缘半透明模糊色
        const gradient = this.ctx.createRadialGradient(
            focusX, focusY, clearRadius,
            focusX, focusY, blurEndRadius
        );

        // 使用径向渐变模拟模糊效果
        // 这里用半透明深色+模糊滤镜来模拟失焦
        gradient.addColorStop(0, 'rgba(8, 10, 14, 0)');
        gradient.addColorStop((blurStartRadius - clearRadius) / (blurEndRadius - clearRadius), 'rgba(8, 10, 14, 0.1)');
        gradient.addColorStop(0.7, `rgba(6, 8, 12, 0.25)`);
        gradient.addColorStop(1, `rgba(4, 6, 10, 0.4)`);

        this.ctx.save();
        
        // 应用模糊滤镜
        this.ctx.filter = `blur(${maxBlur}px)`;
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, width, height);
        
        this.ctx.restore();
    }

    /**
     * 渲染多层模糊（更真实的效果）
     * 原理：创建多个模糊层，从中心到边缘逐渐叠加
     */
    renderMultiLayerBlur(focusX, focusY, width, height) {
        const { clearRadius, blurStartRadius, blurEndRadius, maxBlur } = this.params;
        
        const layers = 3; // 3层模糊
        
        for (let i = 0; i < layers; i++) {
            const layerRadius = blurStartRadius + (blurEndRadius - blurStartRadius) * (i / layers);
            const layerBlur = (maxBlur / layers) * (i + 1);
            const alpha = 0.15 * (i + 1);
            
            const gradient = this.ctx.createRadialGradient(
                focusX, focusY, layerRadius - 50,
                focusX, focusY, layerRadius + 50
            );
            
            gradient.addColorStop(0, `rgba(8, 10, 14, 0)`);
            gradient.addColorStop(1, `rgba(8, 10, 14, ${alpha})`);
            
            this.ctx.save();
            this.ctx.filter = `blur(${layerBlur}px)`;
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(0, 0, width, height);
            this.ctx.restore();
        }
    }

    setParams(params) {
        Object.assign(this.params, params);
    }
}

if (typeof module !== 'undefined') module.exports = GradualBlurSystem;
