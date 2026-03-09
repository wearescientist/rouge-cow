/**
 * ScreenEffectSystem - 屏幕特效系统
 * 处理屏幕震动、闪光、模糊、慢动作等效果
 */

class ScreenEffectSystem {
    constructor(world, canvas) {
        this.world = world;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.priority = 95;
        this.enabled = true;
        
        // 震动状态
        this.shake = {
            active: false,
            intensity: 0,
            duration: 0,
            timer: 0,
            offsetX: 0,
            offsetY: 0
        };
        
        // 闪光状态
        this.flash = {
            active: false,
            color: '#fff',
            alpha: 0,
            fadeSpeed: 2
        };
        
        // 慢动作状态
        this.slowMotion = {
            active: false,
            targetTimeScale: 1,
            currentTimeScale: 1,
            transitionSpeed: 2
        };
        
        // 模糊状态
        this.blur = {
            active: false,
            amount: 0,
            targetAmount: 0
        };
        
        // 暗角状态
        this.vignette = {
            active: false,
            intensity: 0,
            color: '#000'
        };
        
        // 扭曲效果
        this.distortion = {
            active: false,
            amount: 0,
            centerX: 0,
            centerY: 0
        };
    }
    
    init() {
        // 监听事件
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // 监听伤害事件
        this.world.on('damageDealt', (data) => {
            if (data.isCritical) {
                this.shakeLight();
            }
        });
        
        // 监听玩家受伤
        this.world.on('playerDamaged', () => {
            this.shakeMedium();
            this.flashRed();
        });
        
        // 监听爆炸
        this.world.on('explosion', (data) => {
            if (data.intensity > 0.5) {
                this.shakeHeavy();
            } else {
                this.shakeLight();
            }
        });
        
        // 监听房间清理
        this.world.on('roomCleared', () => {
            this.flashWhite();
        });
        
        // 监听升级
        this.world.on('levelUp', () => {
            this.flashGold();
            this.slowMotionBurst(0.3, 0.5);
        });
    }
    
    update(dt) {
        // 更新震动
        this.updateShake(dt);
        
        // 更新闪光
        this.updateFlash(dt);
        
        // 更新慢动作
        this.updateSlowMotion(dt);
        
        // 更新模糊
        this.updateBlur(dt);
        
        // 更新暗角
        this.updateVignette(dt);
    }
    
    /**
     * 更新震动
     */
    updateShake(dt) {
        if (!this.shake.active) return;
        
        this.shake.timer -= dt;
        
        if (this.shake.timer <= 0) {
            this.shake.active = false;
            this.shake.offsetX = 0;
            this.shake.offsetY = 0;
            return;
        }
        
        // 计算当前强度（随时间衰减）
        const progress = this.shake.timer / this.shake.duration;
        const currentIntensity = this.shake.intensity * progress;
        
        // 随机偏移
        this.shake.offsetX = (Math.random() - 0.5) * 2 * currentIntensity;
        this.shake.offsetY = (Math.random() - 0.5) * 2 * currentIntensity;
    }
    
    /**
     * 更新闪光
     */
    updateFlash(dt) {
        if (!this.flash.active) return;
        
        this.flash.alpha -= this.flash.fadeSpeed * dt;
        
        if (this.flash.alpha <= 0) {
            this.flash.active = false;
            this.flash.alpha = 0;
        }
    }
    
    /**
     * 更新慢动作
     */
    updateSlowMotion(dt) {
        const diff = this.slowMotion.targetTimeScale - this.slowMotion.currentTimeScale;
        
        if (Math.abs(diff) > 0.01) {
            this.slowMotion.currentTimeScale += diff * this.slowMotion.transitionSpeed * dt;
        } else {
            this.slowMotion.currentTimeScale = this.slowMotion.targetTimeScale;
        }
    }
    
    /**
     * 更新模糊
     */
    updateBlur(dt) {
        const diff = this.blur.targetAmount - this.blur.amount;
        
        if (Math.abs(diff) > 0.1) {
            this.blur.amount += diff * 5 * dt;
        } else {
            this.blur.amount = this.blur.targetAmount;
        }
        
        if (this.blur.amount < 0.1) {
            this.blur.active = false;
            this.blur.amount = 0;
        } else {
            this.blur.active = true;
        }
    }
    
    /**
     * 更新暗角
     */
    updateVignette(dt) {
        // 暗角通常是即时应用的，不需要复杂更新
    }
    
    /**
     * 应用屏幕特效
     */
    apply(ctx) {
        // 保存原始变换
        ctx.save();
        
        // 应用震动偏移
        if (this.shake.active) {
            ctx.translate(this.shake.offsetX, this.shake.offsetY);
        }
        
        // 应用模糊
        if (this.blur.active) {
            // Canvas 模糊需要通过 filter 实现
            ctx.filter = `blur(${this.blur.amount}px)`;
        }
    }
    
    /**
     * 恢复屏幕状态
     */
    restore(ctx) {
        ctx.restore();
    }
    
    /**
     * 渲染覆盖层效果
     */
    renderOverlay(ctx) {
        // 闪光效果
        if (this.flash.active && this.flash.alpha > 0) {
            ctx.fillStyle = this.hexToRgba(this.flash.color, this.flash.alpha);
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }
        
        // 暗角效果
        if (this.vignette.active && this.vignette.intensity > 0) {
            this.renderVignette(ctx);
        }
        
        // 扭曲效果
        if (this.distortion.active) {
            // 扭曲效果需要复杂的着色器，这里简化处理
        }
    }
    
    /**
     * 渲染暗角
     */
    renderVignette(ctx) {
        const w = this.canvas.width;
        const h = this.canvas.height;
        const maxDist = Math.sqrt(w * w + h * h) / 2;
        
        const gradient = ctx.createRadialGradient(
            w / 2, h / 2, maxDist * 0.3,
            w / 2, h / 2, maxDist
        );
        
        const alpha = this.vignette.intensity;
        gradient.addColorStop(0, 'transparent');
        gradient.addColorStop(0.7, `rgba(0,0,0,${alpha * 0.3})`);
        gradient.addColorStop(1, `rgba(0,0,0,${alpha})`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
    }
    
    // ==================== 触发方法 ====================
    
    /**
     * 触发震动
     */
    startShake(intensity, duration) {
        this.shake.active = true;
        this.shake.intensity = intensity;
        this.shake.duration = duration;
        this.shake.timer = duration;
    }
    
    shakeLight() {
        this.startShake(5, 0.1);
    }
    
    shakeMedium() {
        this.startShake(10, 0.2);
    }
    
    shakeHeavy() {
        this.startShake(20, 0.4);
    }
    
    /**
     * 触发闪光
     */
    flashScreen(color, duration = 0.2, fadeSpeed = 5) {
        this.flash.active = true;
        this.flash.color = color;
        this.flash.alpha = 1;
        this.flash.fadeSpeed = fadeSpeed;
    }
    
    flashWhite() {
        this.flashScreen('#fff', 0.15, 10);
    }
    
    flashRed() {
        this.flashScreen('#f44', 0.3, 3);
    }
    
    flashGold() {
        this.flashScreen('#ffd700', 0.5, 2);
    }
    
    /**
     * 慢动作效果
     */
    setSlowMotion(timeScale, transitionTime = 0.5) {
        this.slowMotion.targetTimeScale = timeScale;
        this.slowMotion.transitionSpeed = 1 / transitionTime;
    }
    
    slowMotionBurst(slowScale = 0.3, duration = 0.5) {
        this.setSlowMotion(slowScale, 0.2);
        
        // 一段时间后恢复
        setTimeout(() => {
            this.setSlowMotion(1, 0.5);
        }, duration * 1000);
    }
    
    getTimeScale() {
        return this.slowMotion.currentTimeScale;
    }
    
    /**
     * 模糊效果
     */
    setBlur(amount, duration = 0) {
        if (duration > 0) {
            // 动画过渡
            this.blur.targetAmount = amount;
        } else {
            this.blur.amount = amount;
            this.blur.targetAmount = amount;
            this.blur.active = amount > 0;
        }
    }
    
    /**
     * 暗角效果
     */
    setVignette(intensity, color = '#000') {
        this.vignette.active = intensity > 0;
        this.vignette.intensity = intensity;
        this.vignette.color = color;
    }
    
    /**
     * 工具函数：HEX 转 RGBA
     */
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    destroy() {}
}

window.ScreenEffectSystem = ScreenEffectSystem;
