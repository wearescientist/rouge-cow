/**
 * 视觉效果系统 - v0.14.0
 * 第9轮迭代：视觉效果优化
 * 
 * 包含：
 * 1. 着色器效果
 * 2. 后期处理
 * 3. 动态光照
 * 4. 天气系统
 * 5. 屏幕特效
 */

// ==================== 着色器基类 ====================
class ShaderEffect {
    constructor(canvas, options = {}) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.active = false;
        this.uniforms = {};
        this.options = options;
    }
    
    setUniform(name, value) {
        this.uniforms[name] = value;
    }
    
    apply(sourceCanvas) {
        // 子类实现
    }
    
    destroy() {}
}

// ==================== 后期处理管理器 ====================
class PostProcessManager {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        // 创建离屏画布
        this.canvas = document.createElement('canvas');
        this.canvas.width = width;
        this.canvas.height = height;
        this.ctx = this.canvas.getContext('2d');
        
        /** @type {ShaderEffect[]} */
        this.effects = [];
        this.enabled = true;
    }
    
    addEffect(effect) {
        this.effects.push(effect);
        return effect;
    }
    
    removeEffect(effect) {
        const index = this.effects.indexOf(effect);
        if (index > -1) {
            effect.destroy();
            this.effects.splice(index, 1);
        }
    }
    
    render(sourceCanvas) {
        if (!this.enabled || this.effects.length === 0) {
            return sourceCanvas;
        }
        
        // 清空画布
        this.ctx.clearRect(0, 0, this.width, this.height);
        
        // 应用效果链
        let currentCanvas = sourceCanvas;
        
        for (const effect of this.effects) {
            if (effect.active) {
                currentCanvas = effect.apply(currentCanvas);
            }
        }
        
        return this.canvas;
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
    }
}

// ==================== 动态光照系统 ====================
class DynamicLighting {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        /** @type {Array<{x: number, y: number, radius: number, color: string, intensity: number}>} */
        this.lights = [];
        this.ambientLight = 0.3;
        this.shadowMap = null;
    }
    
    addLight(x, y, radius, color = '#fff', intensity = 1) {
        const light = { x, y, radius, color, intensity, id: Date.now() + Math.random() };
        this.lights.push(light);
        return light.id;
    }
    
    removeLight(id) {
        const index = this.lights.findIndex(l => l.id === id);
        if (index > -1) {
            this.lights.splice(index, 1);
        }
    }
    
    updateLight(id, updates) {
        const light = this.lights.find(l => l.id === id);
        if (light) {
            Object.assign(light, updates);
        }
    }
    
    render(camera) {
        const ctx = this.ctx;
        const cw = this.canvas.width;
        const ch = this.canvas.height;
        
        // 创建光照层
        const lightCanvas = document.createElement('canvas');
        lightCanvas.width = cw;
        lightCanvas.height = ch;
        const lightCtx = lightCanvas.getContext('2d');
        
        // 填充环境光
        lightCtx.fillStyle = `rgba(0, 0, 0, ${1 - this.ambientLight})`;
        lightCtx.fillRect(0, 0, cw, ch);
        
        // 绘制每个光源
        for (const light of this.lights) {
            const screenPos = camera.worldToScreen(light.x, light.y);
            const screenRadius = light.radius * camera.scale;
            
            // 创建径向渐变
            const gradient = lightCtx.createRadialGradient(
                screenPos.x, screenPos.y, 0,
                screenPos.x, screenPos.y, screenRadius
            );
            
            const color = this.hexToRgb(light.color);
            gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${light.intensity})`);
            gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            // 使用 lighter 混合模式添加光照
            lightCtx.globalCompositeOperation = 'lighter';
            lightCtx.fillStyle = gradient;
            lightCtx.beginPath();
            lightCtx.arc(screenPos.x, screenPos.y, screenRadius, 0, Math.PI * 2);
            lightCtx.fill();
        }
        
        lightCtx.globalCompositeOperation = 'source-over';
        
        return lightCanvas;
    }
    
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 255, g: 255, b: 255 };
    }
}

// ==================== 粒子特效系统 ====================
class VisualEffects {
    constructor() {
        this.effects = [];
    }
    
    // 爆炸特效
    explosion(ctx, x, y, color = '#ff6600', size = 50) {
        const particles = [];
        const particleCount = Math.floor(size / 2);
        
        for (let i = 0; i < particleCount; i++) {
            const angle = (Math.PI * 2 * i) / particleCount;
            const speed = 50 + Math.random() * 100;
            particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                decay: 0.02 + Math.random() * 0.02,
                size: 3 + Math.random() * 5,
                color: color
            });
        }
        
        this.effects.push({
            type: 'particles',
            particles,
            duration: 50
        });
    }
    
    // 冲击波
    shockwave(ctx, x, y, color = '#fff', maxRadius = 100) {
        this.effects.push({
            type: 'shockwave',
            x, y, color, maxRadius,
            radius: 0,
            alpha: 1,
            duration: 30
        });
    }
    
    // 文字浮动
    floatingText(ctx, text, x, y, options = {}) {
        const {
            color = '#fff',
            size = 20,
            duration = 60
        } = options;
        
        this.effects.push({
            type: 'text',
            text, x, y, color, size,
            vy: -2,
            alpha: 1,
            duration
        });
    }
    
    // 屏幕闪光
    flash(ctx, color = '#fff', duration = 10) {
        this.effects.push({
            type: 'flash',
            color,
            alpha: 0.8,
            duration,
            maxDuration: duration
        });
    }
    
    // 更新和绘制
    updateAndDraw(ctx) {
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const effect = this.effects[i];
            
            switch(effect.type) {
                case 'particles':
                    this.drawParticles(ctx, effect);
                    break;
                case 'shockwave':
                    this.drawShockwave(ctx, effect);
                    break;
                case 'text':
                    this.drawFloatingText(ctx, effect);
                    break;
                case 'flash':
                    this.drawFlash(ctx, effect);
                    break;
            }
            
            effect.duration--;
            if (effect.duration <= 0) {
                this.effects.splice(i, 1);
            }
        }
    }
    
    drawParticles(ctx, effect) {
        for (const p of effect.particles) {
            p.x += p.vx * 0.016;
            p.y += p.vy * 0.016;
            p.life -= p.decay;
            
            ctx.globalAlpha = Math.max(0, p.life);
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
    
    drawShockwave(ctx, effect) {
        effect.radius += effect.maxRadius / 30;
        effect.alpha -= 1 / 30;
        
        ctx.strokeStyle = effect.color;
        ctx.lineWidth = 3;
        ctx.globalAlpha = Math.max(0, effect.alpha);
        ctx.beginPath();
        ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;
    }
    
    drawFloatingText(ctx, effect) {
        effect.y += effect.vy;
        effect.alpha -= 1 / effect.duration;
        
        ctx.fillStyle = effect.color;
        ctx.globalAlpha = Math.max(0, effect.alpha);
        ctx.font = `bold ${effect.size}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText(effect.text, effect.x, effect.y);
        ctx.globalAlpha = 1;
    }
    
    drawFlash(ctx, effect) {
        effect.alpha = (effect.duration / effect.maxDuration) * 0.8;
        
        ctx.fillStyle = effect.color;
        ctx.globalAlpha = effect.alpha;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.globalAlpha = 1;
    }
}

// ==================== 屏幕过渡效果 ====================
class ScreenTransition {
    constructor() {
        this.active = false;
        this.progress = 0;
        this.duration = 30;
        this.type = 'fade';
        this.callback = null;
    }
    
    start(type = 'fade', duration = 30, callback = null) {
        this.active = true;
        this.type = type;
        this.duration = duration;
        this.progress = 0;
        this.callback = callback;
    }
    
    update() {
        if (!this.active) return false;
        
        this.progress++;
        
        if (this.progress >= this.duration) {
            this.active = false;
            if (this.callback) this.callback();
            return true;
        }
        
        return false;
    }
    
    draw(ctx) {
        if (!this.active) return;
        
        const progress = this.progress / this.duration;
        
        switch(this.type) {
            case 'fade':
                ctx.fillStyle = `rgba(0, 0, 0, ${Math.sin(progress * Math.PI)})`;
                ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                break;
                
            case 'circle':
                const radius = Math.max(ctx.canvas.width, ctx.canvas.height) * progress;
                ctx.fillStyle = '#000';
                ctx.beginPath();
                ctx.arc(ctx.canvas.width/2, ctx.canvas.height/2, radius, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'wipe':
                ctx.fillStyle = '#000';
                ctx.fillRect(0, 0, ctx.canvas.width * progress, ctx.canvas.height);
                break;
        }
    }
}

// ==================== 动画精灵系统 ====================
class AnimatedSprite {
    constructor(image, frameWidth, frameHeight, frameCount) {
        this.image = image;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.frameCount = frameCount;
        
        this.currentFrame = 0;
        this.animationSpeed = 0.2;
        this.animationTimer = 0;
        this.looping = true;
        this.finished = false;
    }
    
    update(dt) {
        if (this.finished && !this.looping) return;
        
        this.animationTimer += dt;
        
        if (this.animationTimer >= this.animationSpeed) {
            this.animationTimer = 0;
            this.currentFrame++;
            
            if (this.currentFrame >= this.frameCount) {
                if (this.looping) {
                    this.currentFrame = 0;
                } else {
                    this.currentFrame = this.frameCount - 1;
                    this.finished = true;
                }
            }
        }
    }
    
    draw(ctx, x, y, width, height) {
        const frameX = (this.currentFrame % (this.image.width / this.frameWidth)) * this.frameWidth;
        const frameY = Math.floor(this.currentFrame / (this.image.width / this.frameWidth)) * this.frameHeight;
        
        ctx.drawImage(
            this.image,
            frameX, frameY, this.frameWidth, this.frameHeight,
            x, y, width, height
        );
    }
    
    reset() {
        this.currentFrame = 0;
        this.animationTimer = 0;
        this.finished = false;
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ShaderEffect,
        PostProcessManager,
        DynamicLighting,
        VisualEffects,
        ScreenTransition,
        AnimatedSprite
    };
}
