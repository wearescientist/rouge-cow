/**
 * 开场剧情系统 - PrologueController (深根之疫版)
 * v0.14.0 - 像素动画增强版
 */

class PrologueController {
    constructor() {
        this.overlay = document.getElementById('prologueOverlay');
        this.canvas = document.getElementById('prologueCanvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
        this.textEl = document.getElementById('prologueText');
        
        // 像素精灵数据
        this.sprites = this.createPixelSprites();
        this.pixelSize = 3;
        this.frame = 0;
        
        this.scenes = [
            {
                text: '青穗大草原的夜晚，月光洒在空荡的营地上...',
                duration: 4000,
                draw: (ctx, t, w, h) => {
                    this.drawPixelPasture(ctx, t, w, h);
                }
            },
            {
                text: '牛牛发现了部落的异常——所有人都消失了。',
                duration: 4000,
                draw: (ctx, t, w, h) => {
                    const gradient = ctx.createLinearGradient(0, 0, 0, h);
                    gradient.addColorStop(0, '#0a0a14');
                    gradient.addColorStop(1, '#1a1a2e');
                    ctx.fillStyle = gradient;
                    ctx.fillRect(0, 0, w, h);
                    ctx.strokeStyle = '#333';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(w * 0.3, h * 0.6);
                    ctx.lineTo(w * 0.5, h * 0.3);
                    ctx.lineTo(w * 0.7, h * 0.6);
                    ctx.stroke();
                    ctx.fillStyle = 'rgba(80, 60, 40, 0.4)';
                    ctx.beginPath();
                    ctx.moveTo(w * 0.3, h * 0.6);
                    ctx.lineTo(w * 0.7, h * 0.6);
                    ctx.lineTo(w * 0.8, h * 0.8);
                    ctx.lineTo(w * 0.2, h * 0.8);
                    ctx.fill();
                    const fireAlpha = Math.max(0, 0.3 - (t % 2000) / 5000);
                    ctx.fillStyle = `rgba(255, 100, 50, ${fireAlpha})`;
                    ctx.beginPath();
                    ctx.arc(w * 0.5, h * 0.75, 20, 0, Math.PI * 2);
                    ctx.fill();
                }
            },
            {
                text: '他找到了父亲留下的骨片："别下来。活下去。"',
                duration: 4000,
                draw: (ctx, t, w, h) => {
                    this.drawPixelBone(ctx, t, w, h);
                }
            },
            {
                text: '但他听见了母亲的歌声——那首安抚他入睡的歌谣。',
                duration: 4000,
                draw: (ctx, t, w, h) => {
                    ctx.fillStyle = '#0a0a14';
                    ctx.fillRect(0, 0, w, h);
                    for (let i = 0; i < 5; i++) {
                        const radius = ((t * 0.05 + i * 60) % 300);
                        const alpha = 1 - radius / 300;
                        ctx.strokeStyle = `rgba(200, 150, 255, ${alpha * 0.5})`;
                        ctx.lineWidth = 3;
                        ctx.beginPath();
                        ctx.arc(w * 0.5, h * 0.5, radius, 0, Math.PI * 2);
                        ctx.stroke();
                    }
                    ctx.fillStyle = '#e8dcc8';
                    ctx.beginPath();
                    ctx.ellipse(w * 0.5, h * 0.5, 30, 15, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
            },
            {
                text: '从地底传来的脉动，像心跳一样吸引着他。',
                duration: 4000,
                draw: (ctx, t, w, h) => {
                    const gradient = ctx.createLinearGradient(0, 0, 0, h);
                    gradient.addColorStop(0, '#1a0a0a');
                    gradient.addColorStop(1, '#0a0000');
                    ctx.fillStyle = gradient;
                    ctx.fillRect(0, 0, w, h);
                    const pulse = 0.5 + Math.sin(t * 0.005) * 0.5;
                    const bioGradient = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, 200);
                    bioGradient.addColorStop(0, `rgba(100, 255, 150, ${0.3 * pulse})`);
                    bioGradient.addColorStop(1, 'transparent');
                    ctx.fillStyle = bioGradient;
                    ctx.beginPath();
                    ctx.arc(w * 0.5, h * 0.5, 200, 0, Math.PI * 2);
                    ctx.fill();
                    for (let i = 0; i < 20; i++) {
                        const angle = (i / 20) * Math.PI + Math.PI;
                        const len = 100 + Math.sin(t * 0.003 + i) * 20;
                        const x1 = w * 0.5;
                        const y1 = h * 0.6;
                        const x2 = x1 + Math.cos(angle) * len;
                        const y2 = y1 + Math.sin(angle) * len * 0.5;
                        ctx.strokeStyle = `rgba(80, 150, 80, ${0.3 + pulse * 0.3})`;
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(x1, y1);
                        ctx.quadraticCurveTo(x1 + (x2 - x1) * 0.5, y1 + 50, x2, y2);
                        ctx.stroke();
                    }
                }
            },
            {
                text: '等我，阿妈。牛牛深吸一口气，踏入了洞穴...',
                duration: 3500,
                draw: (ctx, t, w, h) => {
                    this.drawPixelCave(ctx, t, w, h);
                }
            }
        ];
        this.currentScene = 0;
        this.startTime = 0;
        this.animationId = null;
        this.onComplete = null;
        this._boundKeyHandler = null;
        this._boundClickHandler = null;
        this.setupInput();
    }
    
    setupInput() {
        // 绑定并存储事件处理器以便后续移除
        this._boundKeyHandler = (e) => {
            if (this.overlay && this.overlay.style.display === 'block') {
                this.skip();
            }
        };
        this._boundClickHandler = () => this.skip();
        
        document.addEventListener('keydown', this._boundKeyHandler);
        if (this.overlay) {
            this.overlay.addEventListener('click', this._boundClickHandler);
        }
    }
    
    resize() {
        if (this.canvas) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight;
        }
    }
    
    start(onComplete) {
        if (!this.overlay || !this.canvas || !this.ctx) {
            // 如果DOM元素不存在，直接回调
            if (onComplete) onComplete();
            return;
        }
        
        // 重置结束标志，允许再次播放
        this._ended = false;
        this.onComplete = onComplete;
        this.currentScene = 0;
        this.startTime = performance.now();
        this.resize();
        this.overlay.style.display = 'block';
        this.animate();
    }
    
    animate() {
        const now = performance.now();
        const elapsed = now - this.startTime;
        const scene = this.scenes[this.currentScene];
        
        if (!scene) {
            this.end();
            return;
        }
        
        const sceneElapsed = elapsed - this.scenes.slice(0, this.currentScene).reduce((a, s) => a + s.duration, 0);
        
        if (this.ctx && this.canvas) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            scene.draw(this.ctx, now, this.canvas.width, this.canvas.height);
        }
        
        if (this.textEl) {
            if (sceneElapsed > 500 && sceneElapsed < scene.duration - 500) {
                this.textEl.textContent = scene.text;
                this.textEl.style.opacity = Math.min((sceneElapsed - 500) / 500, 1);
            } else if (sceneElapsed >= scene.duration - 500) {
                this.textEl.style.opacity = Math.max((scene.duration - sceneElapsed) / 500, 0);
            }
        }
        
        if (sceneElapsed >= scene.duration) {
            this.currentScene++;
            if (this.currentScene >= this.scenes.length) {
                this.end();
                return;
            }
        }
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    skip() {
        this.end();
    }
    
    end() {
        // 防止重复调用
        if (this._ended) return;
        this._ended = true;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        if (this.overlay) this.overlay.style.display = 'none';
        if (this.textEl) this.textEl.style.opacity = 0;
        if (this.onComplete) {
            this.onComplete();
        }
    }
    
    // ========== 像素精灵系统 ==========
    createPixelSprites() {
        return {
            // 牛牛 - 站立
            cow: [
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
            // 树
            tree: [
                [0,0,0,5,5,0,0,0],
                [0,0,5,5,5,5,0,0],
                [0,5,5,5,5,5,5,0],
                [0,5,5,5,5,5,5,0],
                [5,5,5,5,5,5,5,5],
                [0,0,0,6,6,0,0,0],
                [0,0,0,6,6,0,0,0],
                [0,0,6,6,6,6,0,0]
            ],
            // 草
            grass: [
                [0,7,0],
                [7,7,7],
                [7,8,7]
            ],
            // 骨片
            bone: [
                [0,0,9,9,0,0],
                [0,9,9,9,9,0],
                [9,9,10,10,9,9],
                [9,9,10,10,9,9],
                [0,9,9,9,9,0],
                [0,0,9,9,0,0]
            ],
            // 洞穴
            cave: [
                [0,11,11,11,11,11,11,0],
                [11,12,12,12,12,12,12,11],
                [11,12,0,0,0,0,12,11],
                [11,12,0,0,0,0,12,11],
                [11,12,0,0,0,0,12,11],
                [11,12,12,12,12,12,12,11],
                [0,11,11,11,11,11,11,0]
            ]
        };
    }
    
    // 获取颜色
    getPixelColor(index) {
        const colors = {
            0: null,
            1: '#f5f5f5', // 牛白
            2: '#2a2a2a', // 牛黑
            3: '#ffb6c1', // 牛粉
            4: '#8b7355', // 角
            5: '#229954', // 树叶
            6: '#6e2c00', // 树干
            7: '#2d5a27', // 草
            8: '#4a7c40', // 草亮
            9: '#e8dcc8', // 骨
            10: '#cba',   // 骨纹
            11: '#1a0f2e', // 洞穴
            12: '#2d1b4e'  // 洞穴亮
        };
        return colors[index] || null;
    }
    
    // 绘制像素精灵
    drawPixelSprite(sprite, x, y, scale = 1) {
        if (!this.ctx) return;
        const ctx = this.ctx;
        const pixelSize = this.pixelSize * scale;
        
        for (let row = 0; row < sprite.length; row++) {
            for (let col = 0; col < sprite[row].length; col++) {
                const colorIndex = sprite[row][col];
                const color = this.getPixelColor(colorIndex);
                
                if (color) {
                    ctx.fillStyle = color;
                    ctx.fillRect(
                        x + col * pixelSize,
                        y + row * pixelSize,
                        pixelSize,
                        pixelSize
                    );
                }
            }
        }
    }
    
    // 绘制像素场景 - 牧场
    drawPixelPasture(ctx, t, w, h) {
        // 天空渐变
        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, '#0a1a2e');
        gradient.addColorStop(1, '#1a3a4e');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
        
        // 月亮
        const moonY = h * 0.15 + Math.sin(t * 0.0005) * 10;
        ctx.fillStyle = '#fffc';
        ctx.beginPath();
        ctx.arc(w * 0.8, moonY, 40, 0, Math.PI * 2);
        ctx.fill();
        
        // 地面
        ctx.fillStyle = '#1a3a1a';
        ctx.fillRect(0, h * 0.6, w, h * 0.4);
        
        // 像素树
        this.drawPixelSprite(this.sprites.tree, w * 0.1, h * 0.35, 3);
        this.drawPixelSprite(this.sprites.tree, w * 0.75, h * 0.3, 2.5);
        
        // 像素草
        for (let i = 0; i < 15; i++) {
            const gx = (i * 67) % w;
            const gy = h * 0.6 + (i * 23) % (h * 0.3);
            this.drawPixelSprite(this.sprites.grass, gx, gy, 0.8);
        }
        
        // 像素牛牛（带呼吸动画）
        const breathe = Math.sin(t * 0.003) * 0.1 + 1;
        const cowX = w * 0.45;
        const cowY = h * 0.52;
        this.drawPixelSprite(this.sprites.cow, cowX, cowY, 3 * breathe);
        
        // CRT扫描线效果
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        for (let y = 0; y < h; y += 4) {
            ctx.fillRect(0, y, w, 2);
        }
    }
    
    // 绘制像素场景 - 骨片
    drawPixelBone(ctx, t, w, h) {
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, w, h);
        
        // 发光效果
        const pulse = 0.7 + Math.sin(t * 0.003) * 0.3;
        const glowGradient = ctx.createRadialGradient(w * 0.5, h * 0.45, 0, w * 0.5, h * 0.45, 150);
        glowGradient.addColorStop(0, `rgba(250, 200, 100, ${0.4 * pulse})`);
        glowGradient.addColorStop(1, 'transparent');
        ctx.fillStyle = glowGradient;
        ctx.fillRect(0, 0, w, h);
        
        // 像素骨片
        const floatY = Math.sin(t * 0.002) * 10;
        this.drawPixelSprite(this.sprites.bone, w * 0.45, h * 0.4 + floatY, 4);
        
        // 扫描线
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        for (let y = 0; y < h; y += 4) {
            ctx.fillRect(0, y, w, 2);
        }
    }
    
    // 绘制像素场景 - 洞穴入口
    drawPixelCave(ctx, t, w, h) {
        ctx.fillStyle = '#050508';
        ctx.fillRect(0, 0, w, h);
        
        // 像素洞穴
        const caveScale = 8;
        const caveW = this.sprites.cave[0].length * this.pixelSize * caveScale;
        const caveH = this.sprites.cave.length * this.pixelSize * caveScale;
        this.drawPixelSprite(this.sprites.cave, (w - caveW) / 2, h * 0.2, caveScale);
        
        // 发光
        const glow = ctx.createRadialGradient(w * 0.5, h * 0.45, 0, w * 0.5, h * 0.45, 200);
        glow.addColorStop(0, 'rgba(100, 200, 100, 0.3)');
        glow.addColorStop(1, 'transparent');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, w, h);
        
        // 像素牛牛走向洞穴
        const walkProgress = Math.min(1, t / 3000);
        const cowX = w * 0.2 + (w * 0.3 - w * 0.2) * walkProgress;
        const cowY = h * 0.65;
        this.drawPixelSprite(this.sprites.cow, cowX, cowY, 2.5);
        
        // 扫描线
        ctx.fillStyle = 'rgba(0,0,0,0.1)';
        for (let y = 0; y < h; y += 4) {
            ctx.fillRect(0, y, w, 2);
        }
    }
    
    // 清理方法 - 用于游戏重置时调用
    destroy() {
        this.end();
        if (this._boundKeyHandler) {
            document.removeEventListener('keydown', this._boundKeyHandler);
        }
        if (this.overlay && this._boundClickHandler) {
            this.overlay.removeEventListener('click', this._boundClickHandler);
        }
    }
}

// 创建全局实例
window.prologueController = new PrologueController();
