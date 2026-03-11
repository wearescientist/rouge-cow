/**
 * NormalMapGenerator.js - 法线贴图生成器
 * 从精灵图生成法线贴图，用于HD-2D光照
 */

class NormalMapGenerator {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
    }

    /**
     * 从图像生成法线贴图
     * @param {HTMLImageElement|HTMLCanvasElement} image - 输入图像
     * @returns {HTMLCanvasElement} 法线贴图
     */
    generate(image) {
        const width = image.width || image.naturalWidth;
        const height = image.height || image.naturalHeight;
        
        this.canvas.width = width;
        this.canvas.height = height;
        
        // 绘制原图
        this.ctx.drawImage(image, 0, 0);
        
        // 获取像素数据
        const imageData = this.ctx.getImageData(0, 0, width, height);
        const pixels = imageData.data;
        
        // 创建法线图数据
        const normalData = new Uint8ClampedArray(width * height * 4);
        
        // Sobel算子计算边缘/深度
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                
                // 计算亮度梯度 (Sobel)
                const gx = this.sobelX(pixels, x, y, width);
                const gy = this.sobelY(pixels, x, y, width);
                
                // 梯度转法线
                const len = Math.sqrt(gx * gx + gy * gy + 1);
                const nx = -gx / len;
                const ny = -gy / len;
                const nz = 1 / len;
                
                // 法线 [-1,1] 映射到 [0,255]
                normalData[idx] = (nx * 0.5 + 0.5) * 255;     // R
                normalData[idx + 1] = (ny * 0.5 + 0.5) * 255; // G
                normalData[idx + 2] = (nz * 0.5 + 0.5) * 255; // B
                normalData[idx + 3] = 255;                     // A
            }
        }
        
        // 创建输出图像
        const outputCanvas = document.createElement('canvas');
        outputCanvas.width = width;
        outputCanvas.height = height;
        const outputCtx = outputCanvas.getContext('2d');
        
        const outputImageData = new ImageData(normalData, width, height);
        outputCtx.putImageData(outputImageData, 0, 0);
        
        return outputCanvas;
    }

    sobelX(pixels, x, y, width) {
        const getLuma = (dx, dy) => {
            const i = ((y + dy) * width + (x + dx)) * 4;
            return (pixels[i] + pixels[i+1] + pixels[i+2]) / 3;
        };
        
        return (
            -1 * getLuma(-1, -1) + 1 * getLuma(1, -1) +
            -2 * getLuma(-1,  0) + 2 * getLuma(1,  0) +
            -1 * getLuma(-1,  1) + 1 * getLuma(1,  1)
        ) / 4;
    }

    sobelY(pixels, x, y, width) {
        const getLuma = (dx, dy) => {
            const i = ((y + dy) * width + (x + dx)) * 4;
            return (pixels[i] + pixels[i+1] + pixels[i+2]) / 3;
        };
        
        return (
            -1 * getLuma(-1, -1) - 2 * getLuma(0, -1) - 1 * getLuma(1, -1) +
             1 * getLuma(-1,  1) + 2 * getLuma(0,  1) + 1 * getLuma(1,  1)
        ) / 4;
    }
}

window.NormalMapGenerator = NormalMapGenerator;
