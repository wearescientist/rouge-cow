/**
 * SpriteDataGenerator.js - 贴图元数据提取工具
 * 分析图片透明像素，计算实际模型边界
 * 
 * 使用方法:
 * 1. Node.js: node tools/SpriteDataGenerator.js
 * 2. 浏览器: 加载后调用 SpriteDataGenerator.generate()
 */

class SpriteDataGenerator {
    constructor() {
        this.THRESHOLD = 10; // 透明度阈值 (<10视为透明)
    }

    /**
     * 从 ImageData 计算非透明边界框
     * @param {ImageData} imageData 
     * @returns {Object} 模型边界信息
     */
    calculateBounds(imageData) {
        const { width, height, data } = imageData;
        
        let minX = width, minY = height;
        let maxX = 0, maxY = 0;
        let hasVisiblePixel = false;

        // 扫描所有像素
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const alpha = data[idx + 3];
                
                if (alpha > this.THRESHOLD) {
                    hasVisiblePixel = true;
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                }
            }
        }

        if (!hasVisiblePixel) {
            // 完全透明的图片，返回画布中心点
            return {
                canvasWidth: width,
                canvasHeight: height,
                modelOffsetX: Math.floor(width / 2),
                modelOffsetY: Math.floor(height / 2),
                modelWidth: 1,
                modelHeight: 1,
                centerX: Math.floor(width / 2),
                centerY: Math.floor(height / 2),
                feetX: Math.floor(width / 2),
                feetY: height
            };
        }

        // 模型尺寸（+1因为坐标是0-based）
        const modelWidth = maxX - minX + 1;
        const modelHeight = maxY - minY + 1;

        // 锚点计算
        const centerX = minX + Math.floor(modelWidth / 2);
        const centerY = minY + Math.floor(modelHeight / 2);
        const feetX = minX + Math.floor(modelWidth / 2);
        const feetY = maxY + 1; // 脚底在模型底部

        return {
            canvasWidth: width,
            canvasHeight: height,
            modelOffsetX: minX,
            modelOffsetY: minY,
            modelWidth,
            modelHeight,
            centerX,
            centerY,
            feetX,
            feetY
        };
    }

    /**
     * 从 HTMLImageElement 生成 SpriteData
     * @param {HTMLImageElement} img 
     * @returns {Object} 完整的 SpriteData
     */
    generateFromImage(img) {
        // 创建临时 canvas
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const bounds = this.calculateBounds(imageData);

        // 碰撞箱比例（默认 80% × 90%）
        const hitboxRatio = { w: 0.8, h: 0.9 };

        return {
            // 基础信息
            src: img.src || '',
            
            // 画布尺寸
            canvasWidth: bounds.canvasWidth,
            canvasHeight: bounds.canvasHeight,
            
            // 模型边界（相对于画布左上角）
            modelOffsetX: bounds.modelOffsetX,
            modelOffsetY: bounds.modelOffsetY,
            modelWidth: bounds.modelWidth,
            modelHeight: bounds.modelHeight,
            
            // 锚点（相对于画布左上角）
            anchor: {
                center: { x: bounds.centerX, y: bounds.centerY },
                feet: { x: bounds.feetX, y: bounds.feetY }
            },
            
            // 碰撞箱比例（可覆盖）
            hitboxRatio: hitboxRatio,
            
            // 计算得到的碰撞箱尺寸（相对于模型）
            hitboxWidth: Math.round(bounds.modelWidth * hitboxRatio.w),
            hitboxHeight: Math.round(bounds.modelHeight * hitboxRatio.h),
            
            // 阴影偏移（从 feet 点向下的像素）
            shadowOffsetY: 2
        };
    }

    /**
     * 批量生成 SpriteData
     * @param {Array<HTMLImageElement>} images 
     * @returns {Object} key -> SpriteData 映射
     */
    generateBatch(images) {
        const result = {};
        
        images.forEach(img => {
            const key = this.extractKey(img.src);
            result[key] = this.generateFromImage(img);
        });
        
        return result;
    }

    /**
     * 从 URL 提取资源 key
     * @param {string} src 
     * @returns {string}
     */
    extractKey(src) {
        // 移除路径和扩展名
        const filename = src.split('/').pop().split('\\').pop();
        return filename.replace(/\.[^.]+$/, '');
    }

    /**
     * 导出为 JSON
     * @param {Object} spriteDataMap 
     * @returns {string} JSON字符串
     */
    exportToJSON(spriteDataMap, indent = 2) {
        return JSON.stringify(spriteDataMap, null, indent);
    }

    /**
     * 验证 SpriteData 有效性
     * @param {Object} data 
     * @returns {boolean}
     */
    validate(data) {
        const required = [
            'canvasWidth', 'canvasHeight',
            'modelOffsetX', 'modelOffsetY',
            'modelWidth', 'modelHeight',
            'anchor', 'hitboxRatio'
        ];
        
        return required.every(key => key in data);
    }
}

// Node.js 环境导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpriteDataGenerator;
}

// 浏览器环境
if (typeof window !== 'undefined') {
    window.SpriteDataGenerator = SpriteDataGenerator;
}
