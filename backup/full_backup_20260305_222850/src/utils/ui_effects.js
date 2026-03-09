/**
 * UI效果与动画库 - v0.14.0
 * 第3轮迭代：UI/UX优化
 * 
 * 包含：
 * 1. 平滑过渡动画
 * 2. 浮动提示
 * 3. 进度条动画
 * 4. 按钮交互效果
 * 5. 屏幕震动效果
 */

// ==================== 动画缓动函数 ====================
const Easing = {
    linear: t => t,
    easeIn: t => t * t,
    easeOut: t => 1 - (1 - t) * (1 - t),
    easeInOut: t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
    bounce: t => {
        const n1 = 7.5625;
        const d1 = 2.75;
        if (t < 1 / d1) return n1 * t * t;
        if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
        if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
        return n1 * (t -= 2.625 / d1) * t + 0.984375;
    },
    elastic: t => {
        const c4 = (2 * Math.PI) / 3;
        if (t === 0) return 0;
        if (t === 1) return 1;
        return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    }
};

// ==================== 动画管理器 ====================
class AnimationManager {
    constructor() {
        this.animations = new Map();
        this.id = 0;
    }
    
    animate({ duration = 300, easing = 'easeOut', onUpdate, onComplete }) {
        const id = ++this.id;
        const startTime = performance.now();
        const easeFn = Easing[easing] || Easing.easeOut;
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easeFn(progress);
            
            onUpdate(easedProgress);
            
            if (progress < 1) {
                this.animations.set(id, requestAnimationFrame(animate));
            } else {
                this.animations.delete(id);
                if (onComplete) onComplete();
            }
        };
        
        this.animations.set(id, requestAnimationFrame(animate));
        return id;
    }
    
    cancel(id) {
        const frameId = this.animations.get(id);
        if (frameId) {
            cancelAnimationFrame(frameId);
            this.animations.delete(id);
        }
    }
    
    cancelAll() {
        this.animations.forEach(frameId => cancelAnimationFrame(frameId));
        this.animations.clear();
    }
}

// ==================== 浮动文字管理器 ====================
class FloatingTextManager {
    constructor() {
        this.container = null;
        this.init();
    }
    
    init() {
        this.container = document.createElement('div');
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 10000;
            overflow: hidden;
        `;
        document.body.appendChild(this.container);
    }
    
    show({
        text,
        x,
        y,
        color = '#fff',
        size = 16,
        duration = 1000,
        direction = 'up',
        distance = 50
    }) {
        const el = document.createElement('div');
        el.textContent = text;
        el.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            color: ${color};
            font-size: ${size}px;
            font-weight: bold;
            text-shadow: 0 0 4px rgba(0,0,0,0.8);
            pointer-events: none;
            white-space: nowrap;
            transform: translate(-50%, -50%);
        `;
        
        this.container.appendChild(el);
        
        // 动画
        const startY = y;
        const endY = direction === 'up' ? y - distance : y + distance;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const currentY = startY + (endY - startY) * Easing.easeOut(progress);
            const opacity = 1 - Easing.easeIn(progress);
            
            el.style.top = `${currentY}px`;
            el.style.opacity = opacity;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                el.remove();
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    // 快捷方法：显示伤害数字
    showDamage(x, y, damage, isCrit = false) {
        this.show({
            text: isCrit ? `暴击! ${damage}` : damage,
            x,
            y,
            color: isCrit ? '#ff0' : '#f44',
            size: isCrit ? 24 : 18,
            duration: 800,
            direction: 'up',
            distance: 40
        });
    }
    
    // 快捷方法：显示获得
    showGain(x, y, text, color = '#4f4') {
        this.show({
            text,
            x,
            y,
            color,
            size: 16,
            duration: 1200,
            direction: 'up',
            distance: 30
        });
    }
}

// ==================== 屏幕震动效果 ====================
class ScreenShake {
    constructor() {
        this.intensity = 0;
        this.decay = 0.9;
        this.active = false;
    }
    
    shake(intensity = 10, duration = 300) {
        this.intensity = intensity;
        this.active = true;
        
        const startTime = performance.now();
        const gameCanvas = document.getElementById('gameCanvas');
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            
            if (elapsed < duration && this.intensity > 0.5) {
                const dx = (Math.random() - 0.5) * this.intensity;
                const dy = (Math.random() - 0.5) * this.intensity;
                
                if (gameCanvas) {
                    gameCanvas.style.transform = `translate(${dx}px, ${dy}px)`;
                }
                
                this.intensity *= this.decay;
                requestAnimationFrame(animate);
            } else {
                this.active = false;
                if (gameCanvas) {
                    gameCanvas.style.transform = '';
                }
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    // 轻微震动
    light() { this.shake(5, 200); }
    
    // 中等震动
    medium() { this.shake(10, 300); }
    
    // 强烈震动
    heavy() { this.shake(20, 500); }
}

// ==================== 进度条动画 ====================
class AnimatedProgressBar {
    constructor(element, options = {}) {
        this.element = element;
        this.currentValue = options.initial || 0;
        this.maxValue = options.max || 100;
        this.animationId = null;
        
        this.init();
    }
    
    init() {
        this.element.style.cssText = `
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.3);
            border-radius: 4px;
            overflow: hidden;
            position: relative;
        `;
        
        this.fill = document.createElement('div');
        this.fill.style.cssText = `
            height: 100%;
            background: linear-gradient(90deg, #4f4, #0f0);
            transition: width 0.3s ease-out;
            border-radius: 4px;
        `;
        
        this.element.appendChild(this.fill);
        this.update(0);
    }
    
    update(value, animate = true) {
        this.currentValue = Math.max(0, Math.min(value, this.maxValue));
        const percentage = (this.currentValue / this.maxValue) * 100;
        
        if (animate) {
            this.fill.style.transition = 'width 0.3s ease-out';
        } else {
            this.fill.style.transition = 'none';
        }
        
        this.fill.style.width = `${percentage}%`;
        
        // 颜色变化
        if (percentage < 20) {
            this.fill.style.background = 'linear-gradient(90deg, #f44, #f00)';
        } else if (percentage < 50) {
            this.fill.style.background = 'linear-gradient(90deg, #fa0, #f80)';
        } else {
            this.fill.style.background = 'linear-gradient(90deg, #4f4, #0f0)';
        }
    }
    
    setColor(color) {
        this.fill.style.background = color;
    }
}

// ==================== 按钮交互效果 ====================
class ButtonEffects {
    static apply(element, options = {}) {
        const {
            scaleOnHover = 1.05,
            scaleOnClick = 0.95,
            glowColor = 'rgba(79, 255, 79, 0.5)'
        } = options;
        
        element.style.transition = 'transform 0.15s ease, box-shadow 0.15s ease';
        element.style.cursor = 'pointer';
        
        element.addEventListener('mouseenter', () => {
            element.style.transform = `scale(${scaleOnHover})`;
            element.style.boxShadow = `0 0 15px ${glowColor}`;
        });
        
        element.addEventListener('mouseleave', () => {
            element.style.transform = '';
            element.style.boxShadow = '';
        });
        
        element.addEventListener('mousedown', () => {
            element.style.transform = `scale(${scaleOnClick})`;
        });
        
        element.addEventListener('mouseup', () => {
            element.style.transform = `scale(${scaleOnHover})`;
        });
    }
    
    // 应用到所有按钮
    static applyToAll(selector = 'button') {
        document.querySelectorAll(selector).forEach(btn => this.apply(btn));
    }
}

// ==================== 过渡效果 ====================
class Transitions {
    static fadeIn(element, duration = 300) {
        element.style.opacity = '0';
        element.style.transition = `opacity ${duration}ms ease`;
        element.style.display = '';
        
        requestAnimationFrame(() => {
            element.style.opacity = '1';
        });
    }
    
    static fadeOut(element, duration = 300, onComplete) {
        element.style.transition = `opacity ${duration}ms ease`;
        element.style.opacity = '0';
        
        setTimeout(() => {
            element.style.display = 'none';
            if (onComplete) onComplete();
        }, duration);
    }
    
    static slideIn(element, direction = 'up', duration = 300) {
        const transforms = {
            up: 'translateY(20px)',
            down: 'translateY(-20px)',
            left: 'translateX(20px)',
            right: 'translateX(-20px)'
        };
        
        element.style.opacity = '0';
        element.style.transform = transforms[direction];
        element.style.transition = `opacity ${duration}ms ease, transform ${duration}ms ease`;
        
        requestAnimationFrame(() => {
            element.style.opacity = '1';
            element.style.transform = '';
        });
    }
    
    static slideOut(element, direction = 'down', duration = 300, onComplete) {
        const transforms = {
            up: 'translateY(-20px)',
            down: 'translateY(20px)',
            left: 'translateX(-20px)',
            right: 'translateX(20px)'
        };
        
        element.style.transition = `opacity ${duration}ms ease, transform ${duration}ms ease`;
        element.style.opacity = '0';
        element.style.transform = transforms[direction];
        
        setTimeout(() => {
            if (onComplete) onComplete();
        }, duration);
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Easing,
        AnimationManager,
        FloatingTextManager,
        ScreenShake,
        AnimatedProgressBar,
        ButtonEffects,
        Transitions
    };
}
