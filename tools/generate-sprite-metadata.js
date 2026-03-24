/**
 * generate-sprite-metadata.js - 浏览器端运行的元数据生成器
 * 将此文件在浏览器控制台运行，生成 assets/sprites/metadata.json
 * 
 * 使用方法:
 * 1. 在 index.html 引入 <script src="tools/generate-sprite-metadata.js"></script>
 * 2. 浏览器控制台执行: generateSpriteMetadata()
 * 3. 复制输出的 JSON 保存到 assets/sprites/metadata.json
 */

// 内嵌 SpriteDataGenerator 实现（无需外部依赖）
const SpriteDataGeneratorInline = {
    THRESHOLD: 10,

    calculateBounds(imageData) {
        const { width, height, data } = imageData;
        let minX = width, minY = height;
        let maxX = 0, maxY = 0;
        let hasVisiblePixel = false;

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
            return {
                canvasWidth: width, canvasHeight: height,
                modelOffsetX: Math.floor(width / 2), modelOffsetY: Math.floor(height / 2),
                modelWidth: 1, modelHeight: 1,
                centerX: Math.floor(width / 2), centerY: Math.floor(height / 2),
                feetX: Math.floor(width / 2), feetY: height
            };
        }

        const modelWidth = maxX - minX + 1;
        const modelHeight = maxY - minY + 1;

        return {
            canvasWidth: width, canvasHeight: height,
            modelOffsetX: minX, modelOffsetY: minY,
            modelWidth, modelHeight,
            centerX: minX + Math.floor(modelWidth / 2),
            centerY: minY + Math.floor(modelHeight / 2),
            feetX: minX + Math.floor(modelWidth / 2),
            feetY: maxY + 1
        };
    },

    generateFromImage(img) {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const bounds = this.calculateBounds(imageData);

        return {
            src: img.src,
            canvasWidth: bounds.canvasWidth,
            canvasHeight: bounds.canvasHeight,
            modelOffsetX: bounds.modelOffsetX,
            modelOffsetY: bounds.modelOffsetY,
            modelWidth: bounds.modelWidth,
            modelHeight: bounds.modelHeight,
            anchor: {
                center: { x: bounds.centerX, y: bounds.centerY },
                feet: { x: bounds.feetX, y: bounds.feetY }
            },
            hitboxRatio: { w: 0.8, h: 0.9 },
            shadowOffsetY: 2
        };
    }
};

// 主函数
async function generateSpriteMetadata() {
    console.log('=== Sprite Metadata Generator ===\n');
    
    // 获取所有已加载的图片资源
    const images = [];
    const seen = new Set();
    
    // 从 document.images 收集
    for (const img of document.images) {
        if (img.src && img.src.includes('/sprites/') && !seen.has(img.src)) {
            seen.add(img.src);
            images.push(img);
        }
    }
    
    // 从游戏 spriteManager 收集（如果存在）
    if (window.game && window.game.sprites) {
        const spriteMgr = window.game.sprites;
        if (spriteMgr.cache) {
            for (const [key, img] of spriteMgr.cache) {
                if (typeof img === 'object' && img.src && !seen.has(img.src)) {
                    seen.add(img.src);
                    images.push(img);
                }
            }
        }
    }
    
    console.log(`Found ${images.length} sprite images\n`);
    
    const results = {};
    
    for (const img of images) {
        try {
            const key = extractSpriteKey(img.src);
            const metadata = SpriteDataGeneratorInline.generateFromImage(img);
            results[key] = metadata;
            
            const efficiency = ((metadata.modelWidth * metadata.modelHeight) / 
                               (metadata.canvasWidth * metadata.canvasHeight) * 100).toFixed(1);
            console.log(`[OK] ${key}: ${metadata.modelWidth}x${metadata.modelHeight} / ${metadata.canvasWidth}x${metadata.canvasHeight} (${efficiency}%)`);
        } catch (err) {
            console.error(`[ERR] ${img.src}:`, err.message);
        }
    }
    
    const json = JSON.stringify(results, null, 2);
    
    console.log('\n=== Generation Complete ===');
    console.log(`Total sprites: ${Object.keys(results).length}`);
    console.log('\n--- Copy the JSON below to assets/sprites/metadata.json ---\n');
    console.log(json);
    
    // 尝试自动下载
    try {
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'metadata.json';
        a.click();
        URL.revokeObjectURL(url);
        console.log('\n[Auto-download triggered: metadata.json]');
    } catch (e) {
        console.log('\n[Auto-download failed, please copy manually]');
    }
    
    return results;
}

function extractSpriteKey(src) {
    // 从 URL 提取 key，例如: assets/sprites/enemies/chick.png -> enemies/chick
    const match = src.match(/sprites[\\/](.+?)\.(png|jpg|gif|webp)/i);
    return match ? match[1].replace(/\\/g, '/') : src.split('/').pop().replace(/\.[^.]+$/, '');
}

// 导出到全局
window.generateSpriteMetadata = generateSpriteMetadata;
window.SpriteDataGeneratorInline = SpriteDataGeneratorInline;

console.log('[SpriteDataGenerator] Loaded. Run generateSpriteMetadata() to generate metadata.');
