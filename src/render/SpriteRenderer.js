/**
 * SpriteRenderer - 统一贴图渲染器
 * 一劳永逸解决所有坐标问题
 * 
 * 核心原则：
 * 1. 所有渲染函数的入参必须是屏幕坐标
 * 2. 转换在调用点之前完成
 * 3. 谁调用谁负责转换
 */

class SpriteRenderer {
    constructor() {
        // 调试模式
        this.debug = false;
    }

    /**
     * 世界坐标 → 屏幕坐标（唯一转换函数）
     * @param {number} worldX - 世界X（脚底）
     * @param {number} worldY - 世界Y（脚底）
     * @param {Camera} camera - 相机
     * @param {HTMLCanvasElement} canvas - 画布
     */
    static worldToScreen(worldX, worldY, camera, canvas) {
        return {
            x: (worldX - camera.x) * camera.zoom + (canvas.width / 2),
            y: (worldY - camera.y) * camera.zoom + (canvas.height / 2)
        };
    }

    /**
     * 绘制贴图（统一入口）
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     * @param {HTMLImageElement} sprite - 贴图
     * @param {Object} options - 配置
     *   - screenX, screenY: 屏幕坐标（脚底位置）
     *   - scale: 缩放比例
     *   - flip: 是否水平翻转
     *   - anchor: 'feet' | 'center'（锚点类型）
     *   - spriteData: SpriteData 实例（用于精确锚点）
     */
    static draw(ctx, sprite, options = {}) {
        const {
            screenX = 0,
            screenY = 0,
            scale = 1,
            flip = false,
            anchor = 'feet',
            spriteData = null
        } = options;

        if (!sprite) return;

        const w = sprite.width || 32;
        const h = sprite.height || 32;
        const drawW = w * scale;
        const drawH = h * scale;

        // 计算绘制位置（基于锚点）
        let drawX, drawY;

        if (anchor === 'feet') {
            // 脚底锚点：水平居中，垂直在底部
            drawX = screenX - drawW / 2;
            drawY = screenY - drawH;
        } else if (anchor === 'center') {
            // 中心锚点
            drawX = screenX - drawW / 2;
            drawY = screenY - drawH / 2;
        } else if (anchor === 'topleft') {
            // 左上角锚点
            drawX = screenX;
            drawY = screenY;
        }

        // 翻转处理
        ctx.save();
        if (flip) {
            ctx.translate(drawX + drawW / 2, 0);
            ctx.scale(-1, 1);
            ctx.translate(-(drawX + drawW / 2), 0);
        }

        // 绘制贴图
        ctx.drawImage(sprite, drawX, drawY, drawW, drawH);

        ctx.restore();

        // 调试：绘制锚点
        if (this.debug) {
            ctx.save();
            ctx.fillStyle = 'yellow';
            ctx.beginPath();
            ctx.arc(screenX, screenY, 3, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.strokeStyle = 'cyan';
            ctx.lineWidth = 1;
            ctx.strokeRect(drawX, drawY, drawW, drawH);
            ctx.restore();
        }

        return { x: drawX, y: drawY, width: drawW, height: drawH };
    }

    /**
     * 绘制碰撞箱调试
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     * @param {Object} box - 碰撞箱 {x, y, width, height}（世界坐标）
     * @param {Camera} camera - 相机
     * @param {HTMLCanvasElement} canvas - 画布
     * @param {string} color - 颜色
     */
    static drawHitboxDebug(ctx, box, camera, canvas, color = '#0f0') {
        const tl = SpriteRenderer.worldToScreen(box.x, box.y, camera, canvas);
        const br = SpriteRenderer.worldToScreen(box.x + box.width, box.y + box.height, camera, canvas);

        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
        ctx.restore();
    }
}

// 导出
if (typeof module !== 'undefined') module.exports = SpriteRenderer;
