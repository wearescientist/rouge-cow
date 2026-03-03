/**
 * 性能优化工具集 - v0.14.0
 * 第1轮迭代：性能优化
 */

// ==================== 对象池管理器 ====================
class ObjectPool {
    constructor(createFn, resetFn, initialSize = 100) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.available = [];
        this.inUse = new Set();
        
        // 预创建对象
        for (let i = 0; i < initialSize; i++) {
            this.available.push(this.createFn());
        }
    }
    
    acquire() {
        let obj = this.available.pop();
        if (!obj) {
            obj = this.createFn();
        }
        this.resetFn(obj);
        this.inUse.add(obj);
        return obj;
    }
    
    release(obj) {
        if (this.inUse.has(obj)) {
            this.inUse.delete(obj);
            this.available.push(obj);
        }
    }
    
    releaseAll() {
        this.inUse.forEach(obj => {
            this.resetFn(obj);
            this.available.push(obj);
        });
        this.inUse.clear();
    }
    
    getStats() {
        return {
            available: this.available.length,
            inUse: this.inUse.size,
            total: this.available.length + this.inUse.size
        };
    }
}

// ==================== 视口剔除系统 ====================
class ViewportCulling {
    constructor(camera) {
        this.camera = camera;
        this.margin = 100; // 额外边距
    }
    
    // 检查对象是否在视口内
    isVisible(x, y, width = 0, height = 0) {
        const viewLeft = this.camera.x - this.camera.viewWidth / 2 - this.margin;
        const viewTop = this.camera.y - this.camera.viewHeight / 2 - this.margin;
        const viewRight = this.camera.x + this.camera.viewWidth / 2 + this.margin;
        const viewBottom = this.camera.y + this.camera.viewHeight / 2 + this.margin;
        
        return x + width / 2 > viewLeft &&
               x - width / 2 < viewRight &&
               y + height / 2 > viewTop &&
               y - height / 2 < viewBottom;
    }
    
    // 过滤可见对象
    filterVisible(objects, getX, getY, getWidth, getHeight) {
        return objects.filter(obj => {
            const x = getX ? getX(obj) : obj.x;
            const y = getY ? getY(obj) : obj.y;
            const w = getWidth ? getWidth(obj) : (obj.width || 0);
            const h = getHeight ? getHeight(obj) : (obj.height || 0);
            return this.isVisible(x, y, w, h);
        });
    }
}

// ==================== 节流与防抖 ====================
function throttle(fn, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            fn.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

function debounce(fn, delay) {
    let timer;
    return function(...args) {
        clearTimeout(timer);
        timer = setTimeout(() => fn.apply(this, args), delay);
    };
}

// ==================== 缓存计算结果 ====================
class Memoize {
    constructor(maxSize = 1000) {
        this.cache = new Map();
        this.maxSize = maxSize;
    }
    
    get(key) {
        const value = this.cache.get(key);
        if (value !== undefined) {
            // 更新访问顺序
            this.cache.delete(key);
            this.cache.set(key, value);
        }
        return value;
    }
    
    set(key, value) {
        if (this.cache.size >= this.maxSize) {
            // 删除最旧的
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        this.cache.set(key, value);
    }
    
    clear() {
        this.cache.clear();
    }
}

// ==================== 性能监控 ====================
class PerformanceProfiler {
    constructor() {
        this.metrics = {};
        this.activeTimers = new Map();
    }
    
    start(label) {
        this.activeTimers.set(label, performance.now());
    }
    
    end(label) {
        const start = this.activeTimers.get(label);
        if (start === undefined) return;
        
        const duration = performance.now() - start;
        if (!this.metrics[label]) {
            this.metrics[label] = { count: 0, total: 0, max: 0, min: Infinity };
        }
        
        const m = this.metrics[label];
        m.count++;
        m.total += duration;
        m.max = Math.max(m.max, duration);
        m.min = Math.min(m.min, duration);
        m.avg = m.total / m.count;
        
        this.activeTimers.delete(label);
    }
    
    getReport() {
        return Object.entries(this.metrics).map(([label, m]) => ({
            label,
            avg: m.avg.toFixed(2),
            max: m.max.toFixed(2),
            min: m.min.toFixed(2),
            count: m.count
        }));
    }
    
    reset() {
        this.metrics = {};
        this.activeTimers.clear();
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ObjectPool, ViewportCulling, throttle, debounce, Memoize, PerformanceProfiler };
}
