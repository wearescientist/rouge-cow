/**
 * SpriteData.js - 贴图元数据核心类
 * 管理贴图的实际模型边界、锚点、碰撞箱
 * 
 * 设计原则:
 * - 世界坐标: 游戏逻辑使用的坐标（脚底位置）
 * - 渲染坐标: Canvas 绘制使用的坐标（根据锚点调整）
 * - 本地坐标: 相对于模型左上角的坐标
 */

class SpriteData {
    /**
     * @param {Object} config - 配置对象
     * @param {number} config.canvasWidth - 画布宽度
     * @param {number} config.canvasHeight - 画布高度
     * @param {number} config.modelOffsetX - 模型相对画布左上角的 X 偏移
     * @param {number} config.modelOffsetY - 模型相对画布左上角的 Y 偏移
     * @param {number} config.modelWidth - 模型实际宽度
     * @param {number} config.modelHeight - 模型实际高度
     * @param {Object} config.anchor - 锚点配置
     * @param {Object} config.anchor.center - 几何中心 {x, y}
     * @param {Object} config.anchor.feet - 脚底中心 {x, y}
     * @param {Object} config.hitboxRatio - 碰撞箱比例 {w, h} (0-1)
     * @param {number} config.shadowOffsetY - 阴影 Y 偏移
     * @param {Object} config.animation - 动画配置（可选）
     */
    constructor(config = {}) {
        this.canvasWidth = config.canvasWidth || 64;
        this.canvasHeight = config.canvasHeight || 64;
        
        this.modelOffsetX = config.modelOffsetX || 0;
        this.modelOffsetY = config.modelOffsetY || 0;
        this.modelWidth = config.modelWidth || this.canvasWidth;
        this.modelHeight = config.modelHeight || this.canvasHeight;
        
        // 锚点（相对于画布左上角）
        this.anchor = config.anchor || {
            center: { 
                x: Math.floor(this.canvasWidth / 2), 
                y: Math.floor(this.canvasHeight / 2) 
            },
            feet: { 
                x: Math.floor(this.canvasWidth / 2), 
                y: this.canvasHeight 
            }
        };
        
        // 碰撞箱比例（默认 80% × 90%）
        this.hitboxRatio = config.hitboxRatio || { w: 0.8, h: 0.9 };
        
        // 阴影偏移
        this.shadowOffsetY = config.shadowOffsetY || 2;
        
        // 动画配置（v2.1 新增）
        this.animation = config.animation || null;
    }
    
    // ==========================================
    // 动画系统 API (v2.1)
    // ==========================================
    
    /**
     * 是否为动画精灵图
     * @returns {boolean}
     */
    isAnimated() {
        return this.animation !== null;
    }
    
    /**
     * 获取指定帧的绘制参数
     * @param {number} frameIndex - 帧索引
     * @param {number} worldX - 世界 X 坐标
     * @param {number} worldY - 世界 Y 坐标
     * @param {number} scale - 缩放比例
     * @param {string} anchorType - 锚点类型
     * @returns {Object} {x, y, frameX, frameY, frameW, frameH}
     */
    getFrameDrawParams(frameIndex, worldX, worldY, scale = 1, anchorType = 'feet') {
        if (!this.isAnimated()) {
            // 非动画，返回完整贴图
            const pos = this.worldToRender(worldX, worldY, scale, anchorType);
            return {
                x: pos.x,
                y: pos.y,
                frameX: 0,
                frameY: 0,
                frameW: this.canvasWidth,
                frameH: this.canvasHeight
            };
        }
        
        const anim = this.animation;
        const totalFrames = anim.frames || 1;
        const frame = Math.floor(frameIndex) % totalFrames;
        
        // 计算帧在精灵图中的位置
        let frameX, frameY, frameW, frameH;
        
        if (anim.type === 'horizontal') {
            // 水平排列
            frameW = this.canvasWidth / totalFrames;
            frameH = this.canvasHeight;
            frameX = frame * frameW;
            frameY = 0;
        } else if (anim.type === 'vertical') {
            // 垂直排列
            frameW = this.canvasWidth;
            frameH = this.canvasHeight / totalFrames;
            frameX = 0;
            frameY = frame * frameH;
        } else if (anim.type === 'grid') {
            // 网格排列
            const cols = anim.cols || 1;
            const rows = anim.rows || 1;
            frameW = this.canvasWidth / cols;
            frameH = this.canvasHeight / rows;
            frameX = (frame % cols) * frameW;
            frameY = Math.floor(frame / cols) * frameH;
        } else {
            // 默认水平
            frameW = this.canvasWidth / totalFrames;
            frameH = this.canvasHeight;
            frameX = frame * frameW;
            frameY = 0;
        }
        
        // 计算绘制位置（考虑帧偏移）
        const pos = this.worldToRender(worldX, worldY, scale, anchorType);
        
        // 如果有每帧的偏移数据，应用它
        let offsetX = 0, offsetY = 0;
        if (anim.frameOffsets && anim.frameOffsets[frame]) {
            offsetX = anim.frameOffsets[frame].x || 0;
            offsetY = anim.frameOffsets[frame].y || 0;
        }
        
        return {
            x: pos.x + offsetX * scale,
            y: pos.y + offsetY * scale,
            frameX: frameX,
            frameY: frameY,
            frameW: frameW,
            frameH: frameH,
            frameIndex: frame
        };
    }
    
    /**
     * 获取动画总帧数
     * @returns {number}
     */
    getFrameCount() {
        if (!this.isAnimated()) return 1;
        return this.animation.frames || 1;
    }

    /**
     * 从 JSON 数据创建实例
     * @param {Object} json 
     * @returns {SpriteData}
     */
    static fromJSON(json) {
        return new SpriteData(json);
    }

    // ==========================================
    // 坐标转换 API
    // ==========================================

    /**
     * 世界坐标 → 渲染坐标
     * 将实体的世界坐标（脚底/中心）转换为 Canvas 绘制坐标
     * 
     * @param {number} worldX - 世界 X 坐标（通常是锚点位置）
     * @param {number} worldY - 世界 Y 坐标
     * @param {number} scale - 缩放比例
     * @param {string} anchorType - 锚点类型: 'feet' | 'center'
     * @returns {Object} {x, y} Canvas 绘制坐标
     */
    worldToRender(worldX, worldY, scale = 1, anchorType = 'feet') {
        const anchor = this.anchor[anchorType];
        
        return {
            x: worldX - anchor.x * scale,
            y: worldY - anchor.y * scale
        };
    }

    /**
     * 渲染坐标 → 世界坐标
     * 从 Canvas 绘制坐标反推世界坐标
     * 
     * @param {number} renderX - Canvas X 坐标
     * @param {number} renderY - Canvas Y 坐标
     * @param {number} scale - 缩放比例
     * @param {string} anchorType - 锚点类型
     * @returns {Object} {x, y} 世界坐标
     */
    renderToWorld(renderX, renderY, scale = 1, anchorType = 'feet') {
        const anchor = this.anchor[anchorType];
        
        return {
            x: renderX + anchor.x * scale,
            y: renderY + anchor.y * scale
        };
    }

    /**
     * 获取脚底世界坐标
     * 用于阴影绘制、地面碰撞检测
     * 
     * @param {number} worldX - 实体世界 X（中心或脚底）
     * @param {number} worldY - 实体世界 Y
     * @param {number} scale - 缩放比例
     * @param {string} fromAnchor - 当前世界坐标基于的锚点
     * @returns {Object} {x, y} 脚底世界坐标
     */
    getFeetPosition(worldX, worldY, scale = 1, fromAnchor = 'feet') {
        if (fromAnchor === 'feet') {
            return { x: worldX, y: worldY };
        }
        
        // 从中心锚点计算脚底（考虑缩放）
        const deltaY = (this.anchor.feet.y - this.anchor.center.y) * scale;
        return {
            x: worldX,
            y: worldY + deltaY
        };
    }

    /**
     * 获取中心世界坐标
     * @param {number} worldX 
     * @param {number} worldY 
     * @param {number} scale 
     * @param {string} fromAnchor 
     * @returns {Object}
     */
    getCenterPosition(worldX, worldY, scale = 1, fromAnchor = 'feet') {
        if (fromAnchor === 'center') {
            return { x: worldX, y: worldY };
        }
        
        const deltaY = (this.anchor.center.y - this.anchor.feet.y) * scale;
        return {
            x: worldX,
            y: worldY + deltaY
        };
    }

    // ==========================================
    // 碰撞箱 API
    // ==========================================

    /**
     * 获取碰撞箱（世界坐标）
     * 
     * @param {number} worldX - 实体世界 X
     * @param {number} worldY - 实体世界 Y（脚底）
     * @param {number} scale - 缩放比例
     * @returns {Object} {x, y, width, height}
     */
    getHitbox(worldX, worldY, scale = 1) {
        // 模型实际尺寸
        const scaledModelW = this.modelWidth * scale;
        const scaledModelH = this.modelHeight * scale;
        
        // 碰撞箱尺寸
        const hitboxW = scaledModelW * this.hitboxRatio.w;
        const hitboxH = scaledModelH * this.hitboxRatio.h;
        
        // 计算模型左上角世界坐标
        const modelLeft = worldX - (this.anchor.feet.x - this.modelOffsetX) * scale;
        const modelTop = worldY - (this.anchor.feet.y - this.modelOffsetY) * scale;
        
        // 碰撞箱居中于模型
        const hitboxX = modelLeft + (scaledModelW - hitboxW) / 2;
        const hitboxY = modelTop + (scaledModelH - hitboxH) / 2;
        
        return {
            x: hitboxX,
            y: hitboxY,
            width: hitboxW,
            height: hitboxH
        };
    }

    /**
     * 设置碰撞箱比例
     * @param {number} w - 宽度比例 (0-1)
     * @param {number} h - 高度比例 (0-1)
     */
    setHitboxRatio(w, h) {
        this.hitboxRatio = { w, h };
    }

    // ==========================================
    // 渲染辅助 API
    // ==========================================

    /**
     * 获取阴影绘制位置
     * @param {number} worldX 
     * @param {number} worldY 
     * @param {number} scale 
     * @param {string} fromAnchor
     * @returns {Object} {x, y, width}
     */
    getShadowPosition(worldX, worldY, scale = 1, fromAnchor = 'feet') {
        const feet = this.getFeetPosition(worldX, worldY, scale, fromAnchor);
        
        return {
            x: feet.x,
            y: feet.y + this.shadowOffsetY * scale,
            width: this.modelWidth * scale * 0.8 // 阴影宽度为模型的80%
        };
    }

    /**
     * 获取绘制尺寸
     * @param {number} scale 
     * @returns {Object} {width, height}
     */
    getDrawSize(scale = 1) {
        return {
            width: this.canvasWidth * scale,
            height: this.canvasHeight * scale
        };
    }

    /**
     * 获取模型实际尺寸（缩放后）
     * @param {number} scale 
     * @returns {Object}
     */
    getModelSize(scale = 1) {
        return {
            width: this.modelWidth * scale,
            height: this.modelHeight * scale
        };
    }

    // ==========================================
    // 调试用 API
    // ==========================================

    /**
     * 绘制调试信息
     * @param {CanvasRenderingContext2D} ctx 
     * @param {number} worldX 
     * @param {number} worldY 
     * @param {number} scale 
     */
    drawDebug(ctx, worldX, worldY, scale = 1) {
        const renderPos = this.worldToRender(worldX, worldY, scale, 'feet');
        const drawSize = this.getDrawSize(scale);
        
        // 绘制画布边界（红色）
        ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(renderPos.x, renderPos.y, drawSize.width, drawSize.height);
        
        // 绘制模型边界（绿色）
        const modelLeft = renderPos.x + this.modelOffsetX * scale;
        const modelTop = renderPos.y + this.modelOffsetY * scale;
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.7)';
        ctx.strokeRect(
            modelLeft, 
            modelTop, 
            this.modelWidth * scale, 
            this.modelHeight * scale
        );
        
        // 绘制碰撞箱（蓝色）
        const hitbox = this.getHitbox(worldX, worldY, scale);
        ctx.strokeStyle = 'rgba(0, 100, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(hitbox.x, hitbox.y, hitbox.width, hitbox.height);
        
        // 绘制锚点（传递 scale 确保正确位置）
        const feet = this.getFeetPosition(worldX, worldY, scale, 'feet');
        const center = this.getCenterPosition(worldX, worldY, scale, 'feet');
        
        // 脚底（黄色）
        ctx.fillStyle = 'yellow';
        ctx.beginPath();
        ctx.arc(feet.x, feet.y, 3 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // 中心（紫色）
        ctx.fillStyle = 'magenta';
        ctx.beginPath();
        ctx.arc(center.x, center.y, 3 * scale, 0, Math.PI * 2);
        ctx.fill();
        
        // 绘制尺寸信息
        ctx.fillStyle = '#0ff';
        ctx.font = `${Math.max(10, 10 * scale)}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(this.modelWidth * scale)}x${Math.round(this.modelHeight * scale)}`, 
                     renderPos.x + drawSize.width / 2, renderPos.y - 5);
    }

    /**
     * v0.30: 获取绘制参数 - 根据目标尺寸计算保持比例的绘制参数
     * 
     * @param {HTMLImageElement} sprite - 贴图对象
     * @param {number} targetSize - 目标尺寸（像素）
     * @returns {Object} 绘制参数 {srcX, srcY, srcW, srcH, drawX, drawY, drawW, drawH}
     */
    getRenderParams(sprite, targetSize) {
        const spriteW = sprite.width || this.canvasWidth;
        const spriteH = sprite.height || this.canvasHeight;
        
        // 计算保持比例的缩放
        const modelRatio = this.modelWidth / this.modelHeight;
        const spriteRatio = spriteW / spriteH;
        
        let srcX, srcY, srcW, srcH;
        let drawW, drawH;
        
        // 使用模型尺寸计算绘制尺寸，保持比例
        if (modelRatio > 1) {
            // 模型比较宽，以宽度为准
            drawW = targetSize;
            drawH = targetSize / modelRatio;
        } else {
            // 模型比较高，以高度为准
            drawH = targetSize;
            drawW = targetSize * modelRatio;
        }
        
        // 计算源剪切区域（完整贴图）
        srcX = 0;
        srcY = 0;
        srcW = spriteW;
        srcH = spriteH;
        
        // 计算绘制位置（居中）
        const drawX = -drawW / 2;
        const drawY = -drawH / 2;
        
        return {
            srcX, srcY, srcW, srcH,
            drawX, drawY, drawW, drawH
        };
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpriteData;
}
if (typeof window !== 'undefined') {
    window.SpriteData = SpriteData;
}
