/**
 * 房间景深模糊系统
 * 
 * 房间中心：(480, 480)
 * 内圈（清晰）：半径 0-300
 * 中圈（轻度模糊）：半径 300-450 的圆环
 * 外圈（重度模糊）：半径 450 以外的区域
 */
class RoomBlurSystem {
    constructor(ctx) {
        this.ctx = ctx;
        this.enabled = true;
        
        // 房间中心
        this.centerX = 480;
        this.centerY = 480;
        
        // 三层边界
        this.rClear = 300;   // 清晰层边界
        this.rHeavy = 450;   // 重度模糊层边界（内圈是轻度模糊）
        
        // 模糊强度
        this.blurLight = 1.5;  // 中圈轻度模糊
        this.blurHeavy = 3;    // 外圈重度模糊
    }

    setRoomSize(width, height) {
        this.centerX = width / 2;
        this.centerY = height / 2;
    }

    render() {
        if (!this.enabled) return;

        const canvas = this.ctx.canvas;
        const w = canvas.width / (window.devicePixelRatio || 1);
        const h = canvas.height / (window.devicePixelRatio || 1);
        const cx = this.centerX;
        const cy = this.centerY;

        // 保存当前清晰画面
        const clearCanvas = document.createElement('canvas');
        clearCanvas.width = w;
        clearCanvas.height = h;
        clearCanvas.getContext('2d').drawImage(canvas, 0, 0);

        this.ctx.save();

        // ========== 第1层：外圈重度模糊（>450的区域）==========
        const heavyCanvas = document.createElement('canvas');
        heavyCanvas.width = w;
        heavyCanvas.height = h;
        const heavyCtx = heavyCanvas.getContext('2d');
        heavyCtx.filter = `blur(${this.blurHeavy}px)`;
        heavyCtx.drawImage(clearCanvas, 0, 0);
        
        // 只在大圆外显示：全屏矩形减去rHeavy圆
        this.ctx.beginPath();
        this.ctx.rect(0, 0, w, h);  // 全屏
        this.ctx.arc(cx, cy, this.rHeavy, 0, Math.PI * 2, true);  // 挖洞（反向）
        this.ctx.closePath();
        this.ctx.clip();
        this.ctx.drawImage(heavyCanvas, 0, 0);

        // ========== 第2层：中圈轻度模糊（300-450的圆环）==========
        this.ctx.restore();
        this.ctx.save();
        
        const lightCanvas = document.createElement('canvas');
        lightCanvas.width = w;
        lightCanvas.height = h;
        const lightCtx = lightCanvas.getContext('2d');
        lightCtx.filter = `blur(${this.blurLight}px)`;
        lightCtx.drawImage(clearCanvas, 0, 0);
        
        // 只在圆环显示：外圆rHeavy减去内圆rClear
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, this.rHeavy, 0, Math.PI * 2);  // 外圆
        this.ctx.arc(cx, cy, this.rClear, 0, Math.PI * 2, true);  // 内圆（挖洞）
        this.ctx.closePath();
        this.ctx.clip();
        this.ctx.drawImage(lightCanvas, 0, 0);

        // ========== 第3层：内圈清晰（<300的圆内）==========
        this.ctx.restore();
        this.ctx.save();
        
        // 只在rClear圆内显示清晰
        this.ctx.beginPath();
        this.ctx.arc(cx, cy, this.rClear, 0, Math.PI * 2);
        this.ctx.closePath();
        this.ctx.clip();
        this.ctx.drawImage(clearCanvas, 0, 0);

        this.ctx.restore();
    }
}

if (typeof module !== 'undefined') module.exports = RoomBlurSystem;
