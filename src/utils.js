/**
 * 肉鸽牛牛 - 工具函数
 */

// 防止重复定义的装饰器
function singleton(ClassDef) {
    if (window[ClassDef.name]) return window[ClassDef.name];
    window[ClassDef.name] = ClassDef;
    return ClassDef;
}

// 性能监控
class PerformanceMonitor {
    constructor() {
        this.frames = [];
        this.lastTime = performance.now();
    }

    tick() {
        const now = performance.now();
        const dt = now - this.lastTime;
        this.lastTime = now;
        
        this.frames.push(dt);
        if (this.frames.length > 60) this.frames.shift();
    }

    getFPS() {
        const avg = this.frames.reduce((a, b) => a + b, 0) / this.frames.length;
        return Math.round(1000 / avg);
    }
}

// 对象池
class ObjectPool {
    constructor(factory, reset, size = 100) {
        this.factory = factory;
        this.reset = reset;
        this.pool = [];
        this.active = [];
        
        for (let i = 0; i < size; i++) {
            this.pool.push(factory());
        }
    }

    acquire() {
        let obj = this.pool.pop() || this.factory();
        this.active.push(obj);
        return obj;
    }

    release(obj) {
        const idx = this.active.indexOf(obj);
        if (idx >= 0) {
            this.active.splice(idx, 1);
            this.reset(obj);
            this.pool.push(obj);
        }
    }

    releaseAll() {
        while (this.active.length > 0) {
            this.release(this.active[0]);
        }
    }
}

// 空间哈希优化碰撞检测
class SpatialHash {
    constructor(cellSize = 100) {
        this.cellSize = cellSize;
        this.grid = new Map();
    }

    clear() {
        this.grid.clear();
    }

    insert(entity) {
        const cx = Math.floor(entity.x / this.cellSize);
        const cy = Math.floor(entity.y / this.cellSize);
        const key = `${cx},${cy}`;
        
        if (!this.grid.has(key)) this.grid.set(key, []);
        this.grid.get(key).push(entity);
    }

    query(x, y, radius) {
        const results = [];
        const rCell = Math.ceil(radius / this.cellSize);
        const cx = Math.floor(x / this.cellSize);
        const cy = Math.floor(y / this.cellSize);
        
        for (let dx = -rCell; dx <= rCell; dx++) {
            for (let dy = -rCell; dy <= rCell; dy++) {
                const key = `${cx+dx},${cy+dy}`;
                const cell = this.grid.get(key);
                if (cell) results.push(...cell);
            }
        }
        return results;
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { singleton, PerformanceMonitor, ObjectPool, SpatialHash };
}
