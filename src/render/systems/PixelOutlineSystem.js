/**
 * 像素边缘光系统 - Pixel Outline System
 * HD-2D 标志性效果：让像素贴图边缘发光，从背景中"浮"出来
 * 
 * 实现原理：
 * 1. 检测贴图的不透明像素边缘
 * 2. 在边缘外扩绘制发光描边
 * 3. 使用像素级精度，不是简单的矩形框
 */

class PixelOutlineSystem {
    constructor(ctx) {
        this.ctx = ctx;
        this.enabled = true;
        
        // 边缘光参数
        this.params = {
            color: '#ffeecc',      // 暖白边缘光
            alpha: 0.6,            // 透明度
            blur: 0,               // 不使用模糊，保持像素锐利
            thickness: 1,          // 边缘厚度（像素）
            intensity: 1.2         // 亮度强度
        };
        
        // 缓存边缘检测数据
        this.edgeCache = new Map();
        this.cacheSize = 50;     // 最多缓存50个贴图的边缘数据
    }

    /**
     * 为贴图绘制像素级边缘光
     * @param {HTMLImageElement} sprite - 贴图对象
     * @param {number} x - 屏幕X坐标（中心点）
     * @param {number} y - 屏幕Y坐标（中心点）
     * @param {number} scale - 缩放比例
     * @param {Object} options - 可选参数覆盖
     */
    render(sprite, x, y, scale = 1, options = {}) {
        if (!this.enabled || !sprite) return;
        
        const { color, alpha, intensity } = { ...this.params, ...options };
        
        // 获取贴图尺寸
        const w = sprite.width || 32;
        const h = sprite.height || 32;
        
        this.ctx.save();
        
        // v0.32: HD-2D 像素边缘光实现
        // 🚨 ANCHOR RULE: CENTER 是唯一锚点！
        // x,y 是 center 坐标，贴图居中绘制
        
        const drawW = w * scale;
        const drawH = h * scale;
        // CENTER 锚点：水平和垂直都居中
        const drawX = x - drawW / 2;
        const drawY = y - drawH / 2;
        
        // 设置混合模式为添加发光
        this.ctx.globalAlpha = alpha * intensity;
        
        // 在8个方向偏移1像素绘制，形成像素级边缘
        const offsets = [
            [-1, -1], [0, -1], [1, -1],
            [-1,  0],          [1,  0],
            [-1,  1], [0,  1], [1,  1]
        ];
        
        // 设置发光滤镜
        this.ctx.filter = `brightness(${intensity * 2}) sepia(0.3) saturate(0.5)`;
        this.ctx.globalCompositeOperation = 'screen';
        
        // 在8个方向绘制形成像素边缘
        for (const [ox, oy] of offsets) {
            this.ctx.drawImage(sprite, drawX + ox, drawY + oy, drawW, drawH);
        }
        
        this.ctx.restore();
    }

    /**
     * 高精度像素边缘检测渲染
     * 分析贴图的每个像素，只在不透明边缘绘制光
     * 性能消耗较大，适合重要角色
     */
    renderPrecise(sprite, x, y, scale = 1, options = {}) {
        if (!this.enabled || !sprite) return;
        
        const cacheKey = `${sprite.src}_${scale}`;
        let edgeData = this.edgeCache.get(cacheKey);
        
        // 如果没有缓存，计算边缘数据
        if (!edgeData) {
            edgeData = this.calculateEdgeData(sprite, scale);
            this.maintainCache();
            this.edgeCache.set(cacheKey, edgeData);
        }
        
        const { color, alpha } = { ...this.params, ...options };
        
        this.ctx.save();
        this.ctx.fillStyle = color;
        this.ctx.globalAlpha = alpha;
        this.ctx.globalCompositeOperation = 'screen';
        
        // 绘制边缘像素
        const pixelSize = scale;
        for (const pixel of edgeData) {
            this.ctx.fillRect(
                x + pixel.x * pixelSize - (sprite.width * scale) / 2,
                y + pixel.y * pixelSize - (sprite.height * scale) / 2,
                pixelSize,
                pixelSize
            );
        }
        
        this.ctx.restore();
    }

    /**
     * 计算贴图的边缘像素数据
     */
    calculateEdgeData(sprite, scale) {
        const w = sprite.width || 32;
        const h = sprite.height || 32;
        
        // 创建离屏 canvas 读取像素数据
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(sprite, 0, 0);
        
        let imageData;
        try {
            imageData = ctx.getImageData(0, 0, w, h);
        } catch (e) {
            // 跨域问题，返回空数据
            return [];
        }
        
        const pixels = imageData.data;
        const edges = [];
        
        // 检测边缘像素
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const idx = (y * w + x) * 4;
                const alpha = pixels[idx + 3];
                
                // 只处理不透明像素
                if (alpha > 128) {
                    // 检查是否是边缘（相邻像素有透明的）
                    if (this.isEdgePixel(x, y, w, h, pixels)) {
                        edges.push({ x, y });
                    }
                }
            }
        }
        
        return edges;
    }

    /**
     * 检查像素是否在边缘
     */
    isEdgePixel(x, y, w, h, pixels) {
        const directions = [
            [-1, 0], [1, 0], [0, -1], [0, 1]  // 上下左右
        ];
        
        for (const [dx, dy] of directions) {
            const nx = x + dx;
            const ny = y + dy;
            
            // 边界外视为透明
            if (nx < 0 || nx >= w || ny < 0 || ny >= h) {
                return true;
            }
            
            const nIdx = (ny * w + nx) * 4;
            if (pixels[nIdx + 3] < 128) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * 维护缓存大小
     */
    maintainCache() {
        if (this.edgeCache.size > this.cacheSize) {
            const firstKey = this.edgeCache.keys().next().value;
            this.edgeCache.delete(firstKey);
        }
    }

    /**
     * 设置参数
     */
    setParams(params) {
        Object.assign(this.params, params);
    }

    /**
     * 清除缓存
     */
    clearCache() {
        this.edgeCache.clear();
    }
}

if (typeof module !== 'undefined') module.exports = PixelOutlineSystem;
