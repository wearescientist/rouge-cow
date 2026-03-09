/**
 * 移轴景深系统 - Tilt-Shift Depth of Field
 * 真正的"越远越模糊"渐变效果
 * 
 * 实现步骤：
 * 1. 截图保存清晰画面
 * 2. 主画布应用全局模糊
 * 3. 中心区域覆盖清晰画面（带渐变遮罩实现平滑过渡）
 */
class TiltShiftSystem {
    constructor(ctx, width, height) {
        this.ctx = ctx;
        this.width = width;
        this.height = height;
        this.enabled = true;
        
        // 离屏canvas存储清晰画面
        this.clearCanvas = document.createElement('canvas');
        this.clearCtx = this.clearCanvas.getContext('2d');
        
        this.params = {
            focusRadius: 180,      // 完全清晰的半径
            blurStartRadius: 260,  // 开始模糊的半径
            blurEndRadius: 480,    // 完全模糊的半径
            maxBlur: 2,            // 最大模糊强度（像素）
            vignetteStrength: 0.22 // 暗角强度
        };
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
    }

    /**
     * 渲染移轴景深效果
     * 必须在所有场景内容渲染完成后调用！
     */
    render(focusX, focusY) {
        if (!this.enabled) return;

        const canvas = this.ctx.canvas;
        const width = (canvas.clientWidth || canvas.width || 900);
        const height = (canvas.clientHeight || canvas.height || 600);
        
        // 确保离屏canvas尺寸正确
        if (this.clearCanvas.width !== width || this.clearCanvas.height !== height) {
            this.clearCanvas.width = width;
            this.clearCanvas.height = height;
        }
        
        const { focusRadius, blurStartRadius, blurEndRadius, maxBlur, vignetteStrength } = this.params;

        // 步骤1：保存当前清晰画面
        this.clearCtx.drawImage(canvas, 0, 0);

        // 步骤2：对主画布应用全局模糊（边缘会变模糊）
        // 注意：这里我们不能用filter直接模糊canvas内容，因为会糊掉所有内容
        // 替代方案：创建一个半分辨率的模糊版本
        
        this.ctx.save();
        
        // 创建临时canvas存储模糊版本
        const blurCanvas = document.createElement('canvas');
        blurCanvas.width = Math.floor(width * 0.5);
        blurCanvas.height = Math.floor(height * 0.5);
        const blurCtx = blurCanvas.getContext('2d');
        
        // 渲染模糊版本（缩小+模糊滤镜）
        blurCtx.filter = `blur(${maxBlur * 2}px)`;
        blurCtx.drawImage(canvas, 0, 0, blurCanvas.width, blurCanvas.height);
        blurCtx.filter = 'none';

        // 步骤3：用渐变遮罩混合清晰和模糊
        // 先在clearCanvas上应用遮罩（中心不透明，边缘透明）
        const maskGradient = this.clearCtx.createRadialGradient(
            focusX, focusY, focusRadius,
            focusX, focusY, blurEndRadius
        );
        
        // 过渡比例
        const t1 = (blurStartRadius - focusRadius) / (blurEndRadius - focusRadius);
        
        maskGradient.addColorStop(0, 'rgba(255,255,255,1)');      // 中心完全清晰
        maskGradient.addColorStop(Math.max(0, t1-0.15), 'rgba(255,255,255,1)');
        maskGradient.addColorStop(t1, 'rgba(255,255,255,0.7)');   // 开始过渡
        maskGradient.addColorStop(0.8, 'rgba(255,255,255,0.2)');  // 大部分模糊
        maskGradient.addColorStop(1, 'rgba(255,255,255,0)');      // 边缘完全模糊

        // 应用遮罩到清晰层
        this.clearCtx.globalCompositeOperation = 'destination-in';
        this.clearCtx.fillStyle = maskGradient;
        this.clearCtx.fillRect(0, 0, width, height);

        // 步骤4：绘制到主画布
        // 先画模糊层（全屏）
        this.ctx.drawImage(blurCanvas, 0, 0, width, height);
        
        // 再画清晰层（只有中心区域）
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.drawImage(this.clearCanvas, 0, 0);
        
        this.ctx.restore();

        // 步骤5：添加暗角
        this.renderVignette(focusX, focusY, width, height, blurEndRadius, vignetteStrength);
    }
    
    renderVignette(focusX, focusY, width, height, blurEndRadius, vignetteStrength) {
        const grad = this.ctx.createRadialGradient(
            focusX, focusY, blurEndRadius * 0.4,
            focusX, focusY, blurEndRadius * 1.2
        );

        grad.addColorStop(0, 'rgba(5, 8, 12, 0)');
        grad.addColorStop(0.7, 'rgba(5, 8, 12, 0)');
        grad.addColorStop(0.9, `rgba(4, 7, 10, ${vignetteStrength * 0.6})`);
        grad.addColorStop(1, `rgba(3, 6, 9, ${vignetteStrength})`);

        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, width, height);
    }

    setParams(params) {
        Object.assign(this.params, params);
    }
}

if (typeof module !== 'undefined') module.exports = TiltShiftSystem;
