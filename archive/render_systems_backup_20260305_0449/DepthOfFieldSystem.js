// ============================================================
// v0.23-r2 - 景深系统 (Depth of Field System)
// HD-2D风格：背景模糊，前景清晰，增强立体感
// ============================================================

export class DepthOfFieldSystem {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        // 离屏canvas用于景深处理
        this.bgCanvas = document.createElement('canvas');
        this.bgCanvas.width = Math.floor(width / 2);
        this.bgCanvas.height = Math.floor(height / 2);
        this.bgCtx = this.bgCanvas.getContext('2d');
        
        // 模糊程度配置
        this.blurAmount = 4;  // 背景模糊像素
        this.focusRange = 0.3; // 清晰区域范围（屏幕中心）
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.bgCanvas.width = Math.floor(width / 2);
        this.bgCanvas.height = Math.floor(height / 2);
    }
    
    /**
     * 开始背景层绘制（会被模糊）
     */
    beginBackground(ctx) {
        this.bgCtx.clearRect(0, 0, this.bgCanvas.width, this.bgCanvas.height);
        this.bgCtx.save();
        this.bgCtx.scale(0.5, 0.5);
        return this.bgCtx;
    }
    
    /**
     * 结束背景层并应用模糊
     */
    endBackground(ctx) {
        this.bgCtx.restore();
        
        // 应用模糊
        ctx.save();
        ctx.filter = `blur(${this.blurAmount}px)`;
        ctx.globalAlpha = 0.9;
        ctx.drawImage(
            this.bgCanvas, 
            0, 0, this.bgCanvas.width, this.bgCanvas.height,
            0, 0, this.width, this.height
        );
        ctx.filter = 'none';
        ctx.restore();
    }
    
    /**
     * 直接绘制模糊背景（简化版）
     */
    applyBlurToRegion(ctx, x, y, width, height, blurRadius = 4) {
        ctx.save();
        ctx.filter = `blur(${blurRadius}px)`;
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(ctx.canvas, x, y, width, height, x, y, width, height);
        ctx.filter = 'none';
        ctx.restore();
    }
    
    /**
     * 基于距离的焦点模糊（高级版）
     * distance: 0-1 (0=最近，1=最远)
     */
    getBlurForDistance(distance) {
        // 距离焦点越远越模糊
        const focusCenter = 0.5;
        const distFromFocus = Math.abs(distance - focusCenter);
        return Math.min(8, distFromFocus * 20);
    }
}
