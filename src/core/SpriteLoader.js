(function attachSpriteLoader(global) {
class SpriteLoader {

    constructor() {

        this.sprites = {};

        this.loaded = 0;

        this.total = 0;

        this.errors = [];

    }

    

    load(name, src) {

        this.total++;

        return new Promise((resolve) => {

            // WebP 优先：当资源声明为 png 时，先尝试同名 webp，失败再回退 png。
            const candidates = [];
            const hasQuery = src.includes('?');
            const baseSrc = hasQuery ? src.split('?')[0] : src;
            const query = hasQuery ? (`?${src.split('?').slice(1).join('?')}`) : '';
            if (/\.png$/i.test(baseSrc) && global.WebpAssetManifest?.has?.(baseSrc)) {
                candidates.push(baseSrc.replace(/\.png$/i, '.webp') + query);
            }
            candidates.push(src);

            let done = false;
            let candidateIndex = 0;
            let timeoutId = null;

            const img = new Image();
            const isFileProtocol = location.protocol === 'file:';
            if (!isFileProtocol) {
                img.crossOrigin = 'anonymous';
            }

            const finalize = (imageOrNull, errMeta = null) => {
                if (done) return;
                done = true;
                if (timeoutId) clearTimeout(timeoutId);
                if (imageOrNull) {
                    this.sprites[name] = imageOrNull;
                } else if (errMeta) {
                    this.errors.push(errMeta);
                }
                this.loaded++;
                resolve(imageOrNull);
            };

            const tryNext = () => {
                if (candidateIndex >= candidates.length) {
                    console.warn(`✗ Failed to load: ${src}`);
                    finalize(null, { name, src, candidates });
                    return;
                }
                img.src = candidates[candidateIndex++];
            };

            img.onload = () => {
                finalize(img);
            };

            img.onerror = () => {
                tryNext();
            };

            timeoutId = setTimeout(() => {
                if (done) return;
                console.warn(`⏱ Timeout: ${src}`);
                finalize(null, { name, src, candidates, timeout: true });
            }, 5000);

            tryNext();

        });

    }

    // UPGRADE 10: 从 Data URL 加载程序化生成的贴图
    loadFromDataUrl(name, dataUrl) {
        this.total++;
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                this.sprites[name] = img;
                this.loaded++;
                // v0.17.2: 移除调试日志
                // console.log(`[UPGRADE 10] Generated: ${name}`);
                resolve(img);
            };
            img.onerror = () => {
                console.warn(`[UPGRADE 10] Failed to generate: ${name}`);
                this.errors.push({ name, dataUrl });
                this.loaded++;
                resolve(null);
            };
            img.src = dataUrl;
        });
    }

    // 加载精灵表并切分为动画帧
    loadSpriteSheet(name, src, frameWidth, frameHeight, frameCount) {
        this.total++;
        return new Promise((resolve) => {
            const img = new Image();
            // v0.17.3: 检测本地文件系统，避免 CORS 问题
            const isFileProtocol2 = location.protocol === 'file:';
            if (!isFileProtocol2) {
                img.crossOrigin = 'anonymous';
            }
            
            img.onload = () => {
                // 切分精灵表为单独帧
                const frames = [];
                for (let i = 0; i < frameCount; i++) {
                    const canvas = document.createElement('canvas');
                    canvas.width = frameWidth;
                    canvas.height = frameHeight;
                    const ctx = canvas.getContext('2d');
                    
                    // 从精灵表切出单帧（横向排列）
                    ctx.drawImage(
                        img,
                        i * frameWidth, 0, frameWidth, frameHeight,  // 源
                        0, 0, frameWidth, frameHeight               // 目标
                    );
                    
                    frames.push(canvas);
                }
                
                // 存储为动画对象
                this.sprites[name] = {
                    type: 'animation',
                    frames: frames,
                    frameCount: frameCount,
                    frameWidth: frameWidth,
                    frameHeight: frameHeight,
                    original: img
                };
                
                this.loaded++;
                // v0.17.2: 移除调试日志
                // console.log(`✓ Loaded sprite sheet: ${name} (${frameCount} frames)`);
                resolve(this.sprites[name]);
            };
            
            img.onerror = () => {
                console.warn(`✗ Failed to load sprite sheet: ${src}`);
                this.errors.push({ name, src });
                this.loaded++;
                resolve(null);
            };
            
            setTimeout(() => {
                if (!img.complete) {
                    console.warn(`⏱ Timeout: ${src}`);
                    this.errors.push({ name, src, timeout: true });
                    this.loaded++; // v0.18.0 fix: 超时也要增加计数
                    resolve(null);
                }
            }, 5000);
            
            img.src = src;
        });
    }

    // 获取动画帧（用于渲染）
    getFrame(name, frameIndex) {
        const sprite = this.sprites[name];
        if (sprite && sprite.type === 'animation') {
            return sprite.frames[frameIndex % sprite.frameCount];
        }
        return null;
    }

    

    get(name) { return this.sprites[name]; }

    has(name) { return name in this.sprites; }

    isReady() { return this.loaded >= this.total; }

    getProgress() { return this.total > 0 ? this.loaded / this.total : 1; }

    getErrorCount() { return this.errors.length; }

}
    global.SpriteLoader = SpriteLoader;
})(window);
