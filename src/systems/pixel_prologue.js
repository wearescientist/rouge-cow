/**
 * 像素风格开场动画系统 - v0.14.0
 * 纯代码绘制，无需外部图片资源
 * 
 * 包含：
 * 1. 像素精灵绘制
 * 2. 逐帧动画
 * 3. 场景切换
 * 4. CRT老电影效果
 * 5. 打字机字幕
 */

class PixelPrologue {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        // 像素缩放
        this.pixelSize = 4;
        
        // 调色板
        this.colors = {
            bg: '#0a0a14',
            bgLight: '#1a1a2e',
            cowWhite: '#f5f5f5',
            cowBlack: '#2a2a2a',
            cowPink: '#ffb6c1',
            horn: '#8b7355',
            grass: '#2d5a27',
            grassLight: '#4a7c40',
            sky: '#1e3a5f',
            cave: '#1a0f2e',
            caveLight: '#2d1b4e',
            fire: '#ff6b35',
            fireLight: '#ffaa5e',
            text: '#e0e0e0',
            textShadow: '#000000'
        };
        
        // 场景
        this.scenes = [
            { name: '牧场', duration: 4000 },
            { name: '入侵', duration: 5000 },
            { name: '洞穴', duration: 6000 },
            { name: '标题', duration: 4000 }
        ];
        this.currentScene = 0;
        this.sceneTimer = 0;
        
        // 动画帧
        this.frame = 0;
        this.frameTimer = 0;
        this.frameInterval = 100; // 每100ms一帧
        
        // 打字机效果
        this.textBuffer = '';
        this.textTarget = '';
        this.textIndex = 0;
        this.textTimer = 0;
        this.textInterval = 50;
        
        // CRT效果
        this.crtEnabled = true;
        this.scanlineOffset = 0;
        
        // 状态
        this.running = false;
        this.finished = false;
        this.onComplete = null;
        
        // 绑定update
        this._boundUpdate = this.update.bind(this);
        this.lastTime = 0;
        
        // 预渲染的像素精灵
        this.sprites = this.createSprites();
    }
    
    // ========== 创建像素精灵 ==========
    createSprites() {
        return {
            // 牛牛 - 站立
            cowIdle: [
                [0,0,0,1,1,1,1,0,0,0],
                [0,0,1,1,1,1,1,1,0,0],
                [0,1,1,2,2,1,1,2,1,0],
                [0,1,1,2,2,1,1,2,1,0],
                [0,1,1,1,1,1,1,1,1,0],
                [0,1,1,3,3,3,3,1,1,0],
                [0,0,1,1,1,1,1,1,0,0],
                [0,0,1,0,1,1,0,1,0,0],
                [0,0,1,0,1,1,0,1,0,0],
                [0,0,0,0,4,4,0,0,0,0]
            ],
            // 牛牛 - 走路帧1
            cowWalk1: [
                [0,0,0,1,1,1,1,0,0,0],
                [0,0,1,1,1,1,1,1,0,0],
                [0,1,1,2,2,1,1,2,1,0],
                [0,1,1,2,2,1,1,2,1,0],
                [0,1,1,1,1,1,1,1,1,0],
                [0,1,1,3,3,3,3,1,1,0],
                [0,0,1,1,1,1,1,1,0,0],
                [0,0,1,0,1,1,0,4,0,0],
                [0,0,1,0,1,0,0,0,0,0],
                [0,0,0,0,4,0,0,0,0,0]
            ],
            // 牛牛 - 走路帧2
            cowWalk2: [
                [0,0,0,1,1,1,1,0,0,0],
                [0,0,1,1,1,1,1,1,0,0],
                [0,1,1,2,2,1,1,2,1,0],
                [0,1,1,2,2,1,1,2,1,0],
                [0,1,1,1,1,1,1,1,1,0],
                [0,1,1,3,3,3,3,1,1,0],
                [0,0,1,1,1,1,1,1,0,0],
                [0,0,4,0,1,1,0,1,0,0],
                [0,0,0,0,0,1,0,1,0,0],
                [0,0,0,0,0,4,0,0,0,0]
            ],
            // 怪物 - 小鸡
            chick: [
                [0,0,0,5,5,0,0,0],
                [0,0,5,5,5,5,0,0],
                [0,5,5,6,6,5,5,0],
                [0,5,5,6,6,5,5,0],
                [0,0,5,5,5,5,0,0],
                [0,0,5,0,0,5,0,0],
                [0,0,5,0,0,5,0,0]
            ],
            // 怪物 - 蜗牛
            snail: [
                [0,0,0,7,7,7,0,0],
                [0,0,7,7,7,7,7,0],
                [0,7,7,8,8,7,7,0],
                [8,8,8,8,8,8,8,8],
                [0,8,8,6,6,8,8,0],
                [0,0,8,6,6,8,0,0],
                [0,0,0,8,8,0,0,0]
            ],
            // 树
            tree: [
                [0,0,0,9,9,0,0,0],
                [0,0,9,9,9,9,0,0],
                [0,9,9,9,9,9,9,0],
                [0,9,9,9,9,9,9,0],
                [9,9,9,9,9,9,9,9],
                [0,0,0,10,10,0,0,0],
                [0,0,0,10,10,0,0,0],
                [0,0,10,10,10,10,0,0]
            ],
            // 草
            grass: [
                [0,11,0],
                [11,11,11],
                [11,12,11]
            ],
            // 洞穴入口
            cave: [
                [0,13,13,13,13,13,13,0],
                [13,14,14,14,14,14,14,13],
                [13,14,0,0,0,0,14,13],
                [13,14,0,0,0,0,14,13],
                [13,14,0,0,0,0,14,13],
                [13,14,14,14,14,14,14,13],
                [0,13,13,13,13,13,13,0]
            ],
            // 火把
            torch1: [
                [0,15,0],
                [15,16,15],
                [0,10,0]
            ],
            torch2: [
                [0,16,0],
                [15,15,15],
                [0,10,0]
            ]
        };
    }
    
    // 颜色映射
    getColor(index) {
        const colorMap = {
            0: null, // 透明
            1: this.colors.cowWhite,
            2: this.colors.cowBlack,
            3: this.colors.cowPink,
            4: this.colors.horn,
            5: '#f4d03f', // 小鸡黄
            6: '#2c3e50', // 眼睛
            7: '#8e44ad', // 蜗牛壳
            8: '#d5dbdb', // 蜗牛身体
            9: '#229954', // 树叶
            10: '#6e2c00', // 树干
            11: this.colors.grass,
            12: this.colors.grassLight,
            13: this.colors.cave,
            14: this.colors.caveLight,
            15: this.colors.fire,
            16: this.colors.fireLight
        };
        return colorMap[index] || null;
    }
    
    // ========== 绘制像素精灵 ==========
    drawSprite(sprite, x, y, scale = 1, flip = false) {
        const ctx = this.ctx;
        const pixelSize = this.pixelSize * scale;
        
        for (let row = 0; row < sprite.length; row++) {
            for (let col = 0; col < sprite[row].length; col++) {
                const colorIndex = sprite[row][col];
                const color = this.getColor(colorIndex);
                
                if (color) {
                    ctx.fillStyle = color;
                    const drawX = flip 
                        ? x + (sprite[row].length - 1 - col) * pixelSize
                        : x + col * pixelSize;
                    const drawY = y + row * pixelSize;
                    ctx.fillRect(drawX, drawY, pixelSize, pixelSize);
                }
            }
        }
    }
    
    // ========== 场景绘制 ==========
    drawScene1_Pasture(progress) {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        
        // 天空渐变
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, this.colors.sky);
        gradient.addColorStop(1, this.colors.bg);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
        
        // 草地
        ctx.fillStyle = this.colors.grass;
        ctx.fillRect(0, h * 0.6, w, h * 0.4);
        
        // 绘制草丛
        for (let i = 0; i < 20; i++) {
            const gx = (i * 73) % w;
            const gy = h * 0.6 + (i * 17) % (h * 0.3);
            this.drawSprite(this.sprites.grass, gx, gy, 0.8);
        }
        
        // 绘制树
        this.drawSprite(this.sprites.tree, w * 0.1, h * 0.4, 3);
        this.drawSprite(this.sprites.tree, w * 0.7, h * 0.35, 2.5);
        this.drawSprite(this.sprites.tree, w * 0.85, h * 0.45, 2);
        
        // 牛牛动画 - 走路
        const walkCycle = Math.floor(progress * 0.01) % 2;
        const cowX = w * 0.4 + progress * 0.05;
        const cowY = h * 0.55;
        const cowSprite = walkCycle === 0 ? this.sprites.cowWalk1 : this.sprites.cowWalk2;
        
        // 循环走动
        const loopedX = cowX % (w + 100) - 50;
        this.drawSprite(cowSprite, loopedX, cowY, 3);
        
        // 字幕
        this.drawSubtitle('哞哞的牧场...', w / 2, h * 0.85);
    }
    
    drawScene2_Invasion(progress) {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        
        // 暗红色天空
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, '#2d1b1b');
        gradient.addColorStop(1, '#1a0f0f');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
        
        // 草地（枯萎）
        ctx.fillStyle = '#3d2817';
        ctx.fillRect(0, h * 0.6, w, h * 0.4);
        
        // 牛牛 - 惊讶表情
        const cowX = w * 0.5;
        const cowY = h * 0.5;
        this.drawSprite(this.sprites.cowIdle, cowX, cowY, 3);
        
        // 怪物出现动画
        const monsterCount = Math.min(5, Math.floor(progress * 0.002));
        for (let i = 0; i < monsterCount; i++) {
            const mx = w * 0.1 + (i * 150) + Math.sin(progress * 0.01 + i) * 20;
            const my = h * 0.55 + (i % 2) * 30;
            const monster = i % 2 === 0 ? this.sprites.chick : this.sprites.snail;
            this.drawSprite(monster, mx, my, 2);
        }
        
        // 警告红闪效果
        if (Math.floor(progress * 0.02) % 2 === 0) {
            ctx.fillStyle = 'rgba(255, 0, 0, 0.1)';
            ctx.fillRect(0, 0, w, h);
        }
        
        this.drawSubtitle('它们来了...', w / 2, h * 0.85);
    }
    
    drawScene3_Cave(progress) {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        
        // 洞穴背景
        ctx.fillStyle = this.colors.cave;
        ctx.fillRect(0, 0, w, h);
        
        // 洞穴墙壁纹理
        for (let i = 0; i < 50; i++) {
            ctx.fillStyle = Math.random() > 0.5 ? this.colors.cave : this.colors.caveLight;
            const rx = Math.random() * w;
            const ry = Math.random() * h;
            const rs = 20 + Math.random() * 40;
            ctx.fillRect(rx, ry, rs, rs);
        }
        
        // 洞穴入口
        this.drawSprite(this.sprites.cave, w * 0.4, h * 0.3, 8);
        
        // 火把动画
        const torchFrame = Math.floor(progress * 0.02) % 2 === 0 
            ? this.sprites.torch1 
            : this.sprites.torch2;
        this.drawSprite(torchFrame, w * 0.35, h * 0.5, 4);
        this.drawSprite(torchFrame, w * 0.58, h * 0.5, 4);
        
        // 牛牛走向洞穴
        const walkCycle = Math.floor(progress * 0.01) % 2;
        const cowX = w * 0.1 + progress * 0.03;
        const cowY = h * 0.55;
        const cowSprite = walkCycle === 0 ? this.sprites.cowWalk1 : this.sprites.cowWalk2;
        
        if (cowX < w * 0.45) {
            this.drawSprite(cowSprite, cowX, cowY, 3);
        }
        
        // 光照效果
        const lightGradient = ctx.createRadialGradient(
            w * 0.5, h * 0.5, 0,
            w * 0.5, h * 0.5, 300
        );
        lightGradient.addColorStop(0, 'rgba(255, 200, 100, 0.3)');
        lightGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = lightGradient;
        ctx.fillRect(0, 0, w, h);
        
        this.drawSubtitle('必须下去...找到答案', w / 2, h * 0.85);
    }
    
    drawScene4_Title(progress) {
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        
        // 深色背景
        ctx.fillStyle = this.colors.bg;
        ctx.fillRect(0, 0, w, h);
        
        // 绘制大牛牛
        const cowY = h * 0.3 + Math.sin(progress * 0.005) * 10;
        this.drawSprite(this.sprites.cowIdle, w * 0.4, cowY, 6);
        
        // 标题文字
        ctx.save();
        ctx.textAlign = 'center';
        
        // 标题阴影
        ctx.fillStyle = '#000';
        ctx.font = 'bold 72px monospace';
        ctx.fillText('深根之疫', w / 2 + 4, h * 0.65 + 4);
        
        // 标题主色
        const titleGradient = ctx.createLinearGradient(0, h * 0.55, 0, h * 0.7);
        titleGradient.addColorStop(0, '#fff');
        titleGradient.addColorStop(0.5, '#aaa');
        titleGradient.addColorStop(1, '#666');
        ctx.fillStyle = titleGradient;
        ctx.fillText('深根之疫', w / 2, h * 0.65);
        
        // 副标题
        ctx.font = '24px monospace';
        ctx.fillStyle = '#888';
        ctx.fillText('THE DEEP ROOT', w / 2, h * 0.72);
        
        // 版本号
        ctx.font = '16px monospace';
        ctx.fillStyle = '#666';
        ctx.fillText('v0.14.0', w / 2, h * 0.78);
        
        // 提示文字闪烁
        if (Math.floor(progress * 0.01) % 2 === 0) {
            ctx.fillStyle = '#aaa';
            ctx.font = '18px monospace';
            ctx.fillText('按任意键开始', w / 2, h * 0.9);
        }
        
        ctx.restore();
    }
    
    // ========== 打字机字幕 ==========
    drawSubtitle(text, x, y) {
        // 更新打字机效果
        if (this.textTarget !== text) {
            this.textTarget = text;
            this.textIndex = 0;
            this.textBuffer = '';
        }
        
        if (this.textIndex < this.textTarget.length) {
            this.textBuffer += this.textTarget[this.textIndex];
            this.textIndex++;
        }
        
        const ctx = this.ctx;
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = '20px monospace';
        
        // 文字背景
        const textWidth = ctx.measureText(this.textBuffer).width;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x - textWidth / 2 - 10, y - 25, textWidth + 20, 35);
        
        // 文字阴影
        ctx.fillStyle = '#000';
        ctx.fillText(this.textBuffer, x + 2, y + 2);
        
        // 文字主色
        ctx.fillStyle = this.colors.text;
        ctx.fillText(this.textBuffer, x, y);
        
        ctx.restore();
    }
    
    // ========== CRT效果 ==========
    applyCRTEffect() {
        if (!this.crtEnabled) return;
        
        const ctx = this.ctx;
        const w = this.width;
        const h = this.height;
        
        // 扫描线
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        for (let y = this.scanlineOffset; y < h; y += 4) {
            ctx.fillRect(0, y, w, 2);
        }
        this.scanlineOffset = (this.scanlineOffset + 1) % 4;
        
        // 屏幕曲率模拟（边缘变暗）
        const gradient = ctx.createRadialGradient(
            w / 2, h / 2, h * 0.3,
            w / 2, h / 2, h * 0.7
        );
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
        
        // 噪点
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        for (let i = 0; i < 100; i++) {
            const x = Math.random() * w;
            const y = Math.random() * h;
            ctx.fillRect(x, y, 2, 2);
        }
    }
    
    // ========== 主循环 ==========
    update(timestamp) {
        if (!this.running) return;
        
        const dt = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        // 更新场景
        this.sceneTimer += dt;
        
        // 检查场景切换
        const currentSceneData = this.scenes[this.currentScene];
        if (this.sceneTimer >= currentSceneData.duration) {
            this.currentScene++;
            this.sceneTimer = 0;
            
            if (this.currentScene >= this.scenes.length) {
                this.finish();
                return;
            }
        }
        
        // 清屏
        this.ctx.fillStyle = this.colors.bg;
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // 绘制当前场景
        switch(this.currentScene) {
            case 0:
                this.drawScene1_Pasture(this.sceneTimer);
                break;
            case 1:
                this.drawScene2_Invasion(this.sceneTimer);
                break;
            case 2:
                this.drawScene3_Cave(this.sceneTimer);
                break;
            case 3:
                this.drawScene4_Title(this.sceneTimer);
                break;
        }
        
        // 应用CRT效果
        this.applyCRTEffect();
        
        // 继续循环
        requestAnimationFrame(this._boundUpdate);
    }
    
    // ========== 控制方法 ==========
    start(onComplete) {
        this.running = true;
        this.finished = false;
        this.currentScene = 0;
        this.sceneTimer = 0;
        this.onComplete = onComplete;
        this.lastTime = performance.now();
        
        requestAnimationFrame(this._boundUpdate);
        console.log('🎬 像素开场动画开始');
    }
    
    skip() {
        this.finish();
    }
    
    finish() {
        this.running = false;
        this.finished = true;
        
        if (this.onComplete) {
            this.onComplete();
        }
        
        console.log('🎬 像素开场动画结束');
    }
    
    destroy() {
        this.running = false;
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PixelPrologue };
}
