/**
 * generate-metadata.js - 预生成贴图元数据
 * 遍历 assets/sprites/ 目录，为所有图片生成 metadata.json
 * 
 * 运行: node tools/generate-metadata.js
 */

const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

// 如果没有 canvas 模块，提供替代方案
let hasCanvas = false;
try {
    require('canvas');
    hasCanvas = true;
} catch (e) {
    console.warn('[WARN] canvas 模块未安装，将使用简化模式');
    console.warn('安装: npm install canvas');
}

const SpriteDataGenerator = require('./SpriteDataGenerator.js');

// 配置
const SPRITES_DIR = path.join(__dirname, '..', 'assets', 'sprites');
const OUTPUT_FILE = path.join(__dirname, '..', 'assets', 'sprites', 'metadata.json');

// 支持的图片格式
const IMAGE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

// 特殊类型配置覆盖（可选）
const TYPE_OVERRIDES = {
    // 示例: 特定怪物的碰撞箱调整
    'enemy_boss': { hitboxRatio: { w: 0.9, h: 0.95 } },
    'player': { hitboxRatio: { w: 0.7, h: 0.85 } },
};

/**
 * 递归扫描目录获取所有图片文件
 */
function scanDirectory(dir, baseDir = dir) {
    const results = [];
    
    if (!fs.existsSync(dir)) {
        console.warn(`[WARN] 目录不存在: ${dir}`);
        return results;
    }
    
    const items = fs.readdirSync(dir);
    
    for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory()) {
            // 递归扫描子目录
            results.push(...scanDirectory(fullPath, baseDir));
        } else if (stat.isFile()) {
            const ext = path.extname(item).toLowerCase();
            if (IMAGE_EXTENSIONS.includes(ext)) {
                // 计算相对路径作为 key
                const relativePath = path.relative(baseDir, fullPath);
                const key = relativePath.replace(/\\/g, '/').replace(ext, '');
                results.push({ key, fullPath, relativePath });
            }
        }
    }
    
    return results;
}

/**
 * 使用 canvas 分析图片
 */
async function analyzeImageWithCanvas(imagePath) {
    const img = await loadImage(imagePath);
    const canvas = createCanvas(img.width, img.height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, img.width, img.height);
    
    const generator = new SpriteDataGenerator();
    return generator.calculateBounds(imageData);
}

/**
 * 简化模式：基于文件尺寸生成元数据
 */
function analyzeImageSimplified(imagePath) {
    // 这里可以读取文件头获取尺寸，或假设正方形
    // 简化实现：返回默认配置，实际使用时由浏览器计算
    return {
        canvasWidth: 64,
        canvasHeight: 64,
        modelOffsetX: 0,
        modelOffsetY: 0,
        modelWidth: 64,
        modelHeight: 64,
        centerX: 32,
        centerY: 32,
        feetX: 32,
        feetY: 64
    };
}

/**
 * 生成单个图片的元数据
 */
async function generateMetadata(imageInfo) {
    try {
        let bounds;
        
        if (hasCanvas) {
            bounds = await analyzeImageWithCanvas(imageInfo.fullPath);
        } else {
            bounds = analyzeImageSimplified(imageInfo.fullPath);
        }
        
        // 查找类型覆盖配置
        let override = {};
        for (const [pattern, config] of Object.entries(TYPE_OVERRIDES)) {
            if (imageInfo.key.includes(pattern)) {
                override = config;
                break;
            }
        }
        
        const metadata = {
            src: 'assets/sprites/' + imageInfo.relativePath.replace(/\\/g, '/'),
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
            hitboxRatio: override.hitboxRatio || { w: 0.8, h: 0.9 },
            shadowOffsetY: 2
        };
        
        console.log(`[OK] ${imageInfo.key}: ${metadata.modelWidth}x${metadata.modelHeight} (canvas: ${metadata.canvasWidth}x${metadata.canvasHeight})`);
        return { key: imageInfo.key, metadata };
        
    } catch (err) {
        console.error(`[ERR] ${imageInfo.key}: ${err.message}`);
        return null;
    }
}

/**
 * 主函数
 */
async function main() {
    console.log('=== Sprite Metadata Generator ===\n');
    console.log(`Scanning: ${SPRITES_DIR}`);
    
    // 扫描图片
    const images = scanDirectory(SPRITES_DIR);
    console.log(`Found ${images.length} images\n`);
    
    if (images.length === 0) {
        console.log('No images found, creating empty metadata.json');
        fs.writeFileSync(OUTPUT_FILE, '{}', 'utf-8');
        return;
    }
    
    // 生成元数据
    console.log('Generating metadata...\n');
    const results = {};
    
    for (const imageInfo of images) {
        const result = await generateMetadata(imageInfo);
        if (result) {
            results[result.key] = result.metadata;
        }
    }
    
    // 写入文件
    const json = JSON.stringify(results, null, 2);
    fs.writeFileSync(OUTPUT_FILE, json, 'utf-8');
    
    console.log(`\n=== Done ===`);
    console.log(`Output: ${OUTPUT_FILE}`);
    console.log(`Total: ${Object.keys(results).length} sprites`);
    
    // 统计信息
    const total = Object.values(results).length;
    const withModel = Object.values(results).filter(m => 
        m.modelWidth < m.canvasWidth || m.modelHeight < m.canvasHeight
    ).length;
    console.log(`Sprites with padding: ${withModel}/${total}`);
}

// 运行
main().catch(console.error);
