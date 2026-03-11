/**
 * SpriteData.js - 贴图元数据核心类 v2.0
 * 
 * 设计原则:
 * 1. 精确像素边界: 基于非透明像素计算实际模型边界
 * 2. 统一锚点: center(几何中心), feet(脚底中心)
 * 3. 分层碰撞: AABB快速剔除 → 精确碰撞箱 → 像素级(可选)
 * 4. 坐标清晰: 世界坐标(feet) → 渲染坐标(canvas) → 本地坐标(model)
 */

class SpriteData {
    /**
     * @param {Object} config - 配置对象
     * @param {number} config.canvasWidth - 原始画布宽度
     * @param {number} config.canvasHeight - 原始画布高度
     * @param {Object} config.bounds - 非透明像素边界 {x, y, width, height}
     * @param {Object} config.anchor - 锚点配置 {center: {x,y}, feet: {x,y}}
     * @param {Object} config.hitboxRatio - 碰撞箱占模型比例 (0-1)
     * @param {Uint8Array} config.collisionMask - 碰撞遮罩(可选)
     */
    constructor(config = {}) {
        // 原始画布尺寸
        this.canvasWidth = config.canvasWidth || 64;
        this.canvasHeight = config.canvasHeight || 64;
        
        // 非透明像素边界 (相对于画布左上角)
        this.bounds = config.bounds || {
            x: 0, y: 0,
            width: this.canvasWidth,
            height: this.canvasHeight
        };
        
        // 锚点 (相对于画布左上角)
        // 如果未提供，根据bounds自动计算
        this.anchor = config.anchor || this._calculateDefaultAnchors();
        
        // 碰撞箱比例 (相对于bounds)
        this.hitboxRatio = config.hitboxRatio || { w: 0.95, h: 0.95 };
        
        // 碰撞遮罩 (可选，用于像素级碰撞)
        this.collisionMask = config.collisionMask || null;
        
        // 动画配置
        this.animation = config.animation || null;
        
        // 缓存比例值，供渲染使用
        this._aspectRatio = this.bounds.width / this.bounds.height;
    }
    
    /**
     * 根据bounds计算默认锚点
     */
    _calculateDefaultAnchors() {
        const { x, y, width, height } = this.bounds;
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        const feetY = y + height; // 底部
        
        return {
            center: { x: Math.round(centerX), y: Math.round(centerY) },
            feet: { x: Math.round(centerX), y: Math.round(feetY) }
        };
    }
    
    // ==========================================
    // 核心属性
    // ==========================================
    
    /** 模型实际宽度 */
    get modelWidth() { return this.bounds.width; }
    
    /** 模型实际高度 */
    get modelHeight() { return this.bounds.height; }
    
    /** 宽高比 (width / height) */
    get aspectRatio() { return this._aspectRatio; }
    
    // ==========================================
    // 坐标转换 API
    // ==========================================
    
    /**
     * 世界坐标 → Canvas渲染坐标
     * @param {number} worldX - 世界X (基于anchorType锚点)
     * @param {number} worldY - 世界Y
     * @param {number} scale - 缩放
     * @param {string} anchorType - 'feet' | 'center'
     * @returns {Object} {x, y} Canvas左上角坐标
     */
    worldToCanvas(worldX, worldY, scale = 1, anchorType = 'feet') {
        const anchor = this.anchor[anchorType];
        // Canvas绘制位置 = 世界位置 - 锚点偏移 * 缩放
        return {
            x: worldX - anchor.x * scale,
            y: worldY - anchor.y * scale
        };
    }
    
    /**
     * 世界坐标 → 模型本地坐标 (相对于bounds左上角)
     * @returns {Object} {x, y} 模型本地坐标
     */
    worldToLocal(worldX, worldY, anchorType = 'feet') {
        const anchor = this.anchor[anchorType];
        return {
            x: worldX - anchor.x + this.bounds.x,
            y: worldY - anchor.y + this.bounds.y
        };
    }
    
    /**
     * 模型本地坐标 → 世界坐标
     */
    localToWorld(localX, localY, anchorType = 'feet') {
        const anchor = this.anchor[anchorType];
        return {
            x: localX - this.bounds.x + anchor.x,
            y: localY - this.bounds.y + anchor.y
        };
    }
    
    /**
     * 获取指定锚点的世界坐标
     * @param {number} feetX, feetY - 脚底世界坐标
     * @param {string} targetAnchor - 目标锚点类型
     * @returns {Object} 目标锚点的世界坐标
     */
    getAnchorWorldPosition(feetX, feetY, targetAnchor = 'center') {
        if (targetAnchor === 'feet') return { x: feetX, y: feetY };
        
        // 计算从feet到target的偏移
        const feetAnchor = this.anchor.feet;
        const target = this.anchor[targetAnchor];
        
        return {
            x: feetX + (target.x - feetAnchor.x),
            y: feetY + (target.y - feetAnchor.y)
        };
    }
    
    // ==========================================
    // 渲染 API
    // ==========================================
    
    /**
     * 获取保持比例的绘制尺寸
     * @param {number} targetSize - 目标尺寸(高度优先)
     * @returns {Object} {width, height} 保持比例后的尺寸
     */
    getRenderSize(targetSize) {
        // 以保持面积为基准计算
        const baseArea = targetSize * targetSize;
        const aspectRatio = this.aspectRatio;
        
        let width, height;
        if (aspectRatio >= 1) {
            // 宽胖型: 高度较小，宽度较大
            height = Math.sqrt(baseArea / aspectRatio);
            width = height * aspectRatio;
        } else {
            // 高瘦型: 宽度较小，高度较大
            width = Math.sqrt(baseArea * aspectRatio);
            height = width / aspectRatio;
        }
        
        return { width, height };
    }
    
    /**
     * 获取绘制参数 (供渲染循环使用)
     * @param {number} worldX, worldY - 世界坐标(脚底位置)
     * @param {number} targetSize - 目标显示尺寸
     * @returns {Object} 完整的绘制参数
     */
    getDrawParams(worldX, worldY, targetSize) {
        const size = this.getRenderSize(targetSize);
        const pos = this.worldToCanvas(worldX, worldY, 1, 'feet');
        
        return {
            // Canvas绘制位置 (左上角)
            x: pos.x,
            y: pos.y,
            // 绘制尺寸 (保持比例)
            width: size.width,
            height: size.height,
            // 源贴图裁剪区域 (使用bounds精确裁剪)
            srcX: this.bounds.x,
            srcY: this.bounds.y,
            srcW: this.bounds.width,
            srcH: this.bounds.height
        };
    }
    
    // ==========================================
    // 碰撞箱 API
    // ==========================================
    
    /**
     * 获取AABB碰撞箱 (世界坐标)
     * @param {number} feetX, feetY - 脚底世界坐标
     * @param {number} scale - 缩放
     * @returns {Object} {x, y, width, height, cx, cy}
     */
    getHitbox(feetX, feetY, scale = 1) {
        // 1. 获取中心点世界坐标
        const center = this.getAnchorWorldPosition(feetX, feetY, 'center');
        
        // 2. 计算模型尺寸 (缩放后)
        const modelW = this.bounds.width * scale;
        const modelH = this.bounds.height * scale;
        
        // 3. 计算碰撞箱尺寸 (应用hitboxRatio)
        const hitboxW = modelW * this.hitboxRatio.w;
        const hitboxH = modelH * this.hitboxRatio.h;
        
        // 4. 碰撞箱居中于模型
        const x = center.x - hitboxW / 2;
        const y = center.y - hitboxH / 2;
        
        return {
            x, y,
            width: hitboxW,
            height: hitboxH,
            cx: center.x,
            cy: center.y
        };
    }
    
    /**
     * 检测点是否在碰撞箱内
     */
    hitboxContainsPoint(feetX, feetY, pointX, pointY, scale = 1) {
        const box = this.getHitbox(feetX, feetY, scale);
        return pointX >= box.x && 
               pointX <= box.x + box.width &&
               pointY >= box.y && 
               pointY <= box.y + box.height;
    }
    
    /**
     * 检测两个SpriteData的碰撞箱是否相交
     */
    static hitboxesIntersect(dataA, feetAX, feetAY, dataB, feetBX, feetBY, scaleA = 1, scaleB = 1) {
        const boxA = dataA.getHitbox(feetAX, feetAY, scaleA);
        const boxB = dataB.getHitbox(feetBX, feetBY, scaleB);
        
        return boxA.x < boxB.x + boxB.width &&
               boxA.x + boxA.width > boxB.x &&
               boxA.y < boxB.y + boxB.height &&
               boxA.y + boxA.height > boxB.y;
    }
    
    // ==========================================
    // 像素级碰撞 (可选)
    // ==========================================
    
    /**
     * 创建碰撞遮罩 (从ImageData)
     * @param {ImageData} imageData - 贴图数据
     * @param {number} threshold - 透明度阈值 (0-255)
     * @returns {Uint8Array} 1=非透明, 0=透明
     */
    static createCollisionMask(imageData, threshold = 10) {
        const { width, height, data } = imageData;
        const mask = new Uint8Array(width * height);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4 + 3; // Alpha通道
                mask[y * width + x] = data[idx] > threshold ? 1 : 0;
            }
        }
        
        return mask;
    }
    
    /**
     * 像素级碰撞检测 (精确但慢)
     * @param {Object} other - 另一个SpriteData
     * @param {Object} transformA, transformB - 变换参数 {x, y, scale}
     * @returns {boolean}
     */
    pixelPerfectCollision(other, transformA, transformB) {
        if (!this.collisionMask || !other.collisionMask) {
            // 没有遮罩，回退到AABB
            return SpriteData.hitboxesIntersect(
                this, transformA.x, transformA.y,
                other, transformB.x, transformB.y,
                transformA.scale, transformB.scale
            );
        }

        const scaleA = transformA.scale || 1;
        const scaleB = transformB.scale || 1;
        if (scaleA <= 0 || scaleB <= 0) return false;

        const expectedSizeA = this.canvasWidth * this.canvasHeight;
        const expectedSizeB = other.canvasWidth * other.canvasHeight;
        if (this.collisionMask.length < expectedSizeA || other.collisionMask.length < expectedSizeB) {
            return SpriteData.hitboxesIntersect(
                this, transformA.x, transformA.y,
                other, transformB.x, transformB.y,
                scaleA, scaleB
            );
        }

        const canvasA = this.worldToCanvas(transformA.x, transformA.y, scaleA, 'feet');
        const canvasB = other.worldToCanvas(transformB.x, transformB.y, scaleB, 'feet');

        const aLeft = canvasA.x + this.bounds.x * scaleA;
        const aTop = canvasA.y + this.bounds.y * scaleA;
        const aRight = aLeft + this.bounds.width * scaleA;
        const aBottom = aTop + this.bounds.height * scaleA;

        const bLeft = canvasB.x + other.bounds.x * scaleB;
        const bTop = canvasB.y + other.bounds.y * scaleB;
        const bRight = bLeft + other.bounds.width * scaleB;
        const bBottom = bTop + other.bounds.height * scaleB;

        const overlapLeft = Math.max(aLeft, bLeft);
        const overlapTop = Math.max(aTop, bTop);
        const overlapRight = Math.min(aRight, bRight);
        const overlapBottom = Math.min(aBottom, bBottom);

        if (overlapLeft >= overlapRight || overlapTop >= overlapBottom) {
            return false;
        }

        const startX = Math.floor(overlapLeft);
        const endX = Math.ceil(overlapRight);
        const startY = Math.floor(overlapTop);
        const endY = Math.ceil(overlapBottom);

        for (let y = startY; y < endY; y++) {
            for (let x = startX; x < endX; x++) {
                const ax = Math.floor((x - canvasA.x) / scaleA);
                const ay = Math.floor((y - canvasA.y) / scaleA);
                const bx = Math.floor((x - canvasB.x) / scaleB);
                const by = Math.floor((y - canvasB.y) / scaleB);

                if (ax < 0 || ay < 0 || bx < 0 || by < 0) continue;
                if (ax >= this.canvasWidth || ay >= this.canvasHeight) continue;
                if (bx >= other.canvasWidth || by >= other.canvasHeight) continue;

                const aOpaque = this.collisionMask[ay * this.canvasWidth + ax] === 1;
                if (!aOpaque) continue;

                const bOpaque = other.collisionMask[by * other.canvasWidth + bx] === 1;
                if (bOpaque) return true;
            }
        }

        return false;
    }
    
    // ==========================================
    // 工厂方法
    // ==========================================
    
    /**
     * 从JSON创建实例 (兼容旧格式)
     */
    static fromJSON(json) {
        // 处理旧格式到新格式的转换
        const config = {
            canvasWidth: json.canvasWidth || 64,
            canvasHeight: json.canvasHeight || 64,
            bounds: {
                x: json.modelOffsetX ?? json.bounds?.x ?? 0,
                y: json.modelOffsetY ?? json.bounds?.y ?? 0,
                width: json.modelWidth ?? json.bounds?.width ?? 64,
                height: json.modelHeight ?? json.bounds?.height ?? 64
            },
            anchor: json.anchor,
            hitboxRatio: json.hitboxRatio || { w: 0.95, h: 0.95 },
            animation: json.animation
        };
        
        return new SpriteData(config);
    }
    
    /**
     * 从ImageData分析创建 (精确边界提取)
     */
    static fromImageData(imageData, threshold = 10) {
        const { width, height, data } = imageData;
        
        let minX = width, minY = height;
        let maxX = 0, maxY = 0;
        let hasVisible = false;
        
        // 扫描所有像素，找到非透明边界
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4 + 3;
                if (data[idx] > threshold) {
                    hasVisible = true;
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                }
            }
        }
        
        if (!hasVisible) {
            // 完全透明的贴图
            return new SpriteData({
                canvasWidth: width,
                canvasHeight: height,
                bounds: { x: 0, y: 0, width: 1, height: 1 }
            });
        }
        
        const bounds = {
            x: minX,
            y: minY,
            width: maxX - minX + 1,
            height: maxY - minY + 1
        };
        
        return new SpriteData({
            canvasWidth: width,
            canvasHeight: height,
            bounds: bounds
        });
    }
    
    // ==========================================
    // 调试 API
    // ==========================================
    
    /**
     * 绘制调试信息
     */
    drawDebug(ctx, feetX, feetY, scale = 1) {
        const center = this.getAnchorWorldPosition(feetX, feetY, 'center');
        const box = this.getHitbox(feetX, feetY, scale);
        
        // 绘制bounds (绿色)
        const canvasPos = this.worldToCanvas(feetX, feetY, scale, 'feet');
        ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)';
        ctx.lineWidth = 1;
        ctx.strokeRect(
            canvasPos.x + this.bounds.x * scale,
            canvasPos.y + this.bounds.y * scale,
            this.bounds.width * scale,
            this.bounds.height * scale
        );
        
        // 绘制碰撞箱 (蓝色)
        ctx.strokeStyle = 'rgba(0, 100, 255, 0.8)';
        ctx.lineWidth = 2;
        ctx.strokeRect(box.x, box.y, box.width, box.height);
        
        // 绘制锚点
        ctx.fillStyle = 'yellow';
        ctx.beginPath();
        ctx.arc(feetX, feetY, 3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'magenta';
        ctx.beginPath();
        ctx.arc(center.x, center.y, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // 标注尺寸
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(this.bounds.width)}x${Math.round(this.bounds.height)}`, 
                     center.x, box.y - 5);
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpriteData;
}
if (typeof window !== 'undefined') {
    window.SpriteData = SpriteData;
}
