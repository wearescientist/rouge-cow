/**
 * 安全防护与Bug修复 - v0.14.0
 * 第6轮迭代：Bug修复与稳定性改进
 * 
 * 包含：
 * 1. 边界检查防护
 * 2. 内存泄漏防护
 * 3. 异常处理包装器
 * 4. 状态恢复机制
 * 5. 调试工具
 */

// ==================== 边界检查工具 ====================
const Guards = {
    // 数字范围检查
    clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    },
    
    // 非空检查
    require(value, name = 'value') {
        if (value === null || value === undefined) {
            throw new Error(`${name} 不能为空`);
        }
        return value;
    },
    
    // 数组边界检查
    safeArrayAccess(arr, index, defaultValue = null) {
        if (!Array.isArray(arr) || index < 0 || index >= arr.length) {
            return defaultValue;
        }
        return arr[index];
    },
    
    // 对象属性安全获取
    safeGet(obj, path, defaultValue = null) {
        if (!obj || typeof obj !== 'object') return defaultValue;
        
        const keys = path.split('.');
        let current = obj;
        
        for (const key of keys) {
            if (current === null || current === undefined) {
                return defaultValue;
            }
            current = current[key];
        }
        
        return current !== undefined ? current : defaultValue;
    },
    
    // 函数参数检查
    validateArgs(args, validators) {
        for (let i = 0; i < validators.length; i++) {
            const validator = validators[i];
            const arg = args[i];
            
            if (validator.required && (arg === null || arg === undefined)) {
                throw new Error(`参数 ${i} 是必需的`);
            }
            
            if (arg !== undefined && validator.type && typeof arg !== validator.type) {
                throw new Error(`参数 ${i} 类型错误，期望 ${validator.type}，得到 ${typeof arg}`);
            }
        }
    }
};

// ==================== 内存泄漏防护 ====================
class MemoryGuard {
    constructor() {
        this.trackedObjects = new Map();
        this.cleanupCallbacks = [];
    }
    
    track(id, obj, cleanup) {
        this.trackedObjects.set(id, {
            obj,
            cleanup,
            createdAt: Date.now()
        });
    }
    
    release(id) {
        const tracked = this.trackedObjects.get(id);
        if (tracked) {
            if (tracked.cleanup) {
                try {
                    tracked.cleanup(tracked.obj);
                } catch (e) {
                    console.warn(`清理 ${id} 时出错:`, e);
                }
            }
            this.trackedObjects.delete(id);
        }
    }
    
    // 自动清理超时对象
    cleanupExpired(maxAge = 300000) { // 默认5分钟
        const now = Date.now();
        for (const [id, tracked] of this.trackedObjects) {
            if (now - tracked.createdAt > maxAge) {
                console.warn(`自动清理过期对象: ${id}`);
                this.release(id);
            }
        }
    }
    
    // 清理所有
    cleanupAll() {
        for (const [id] of this.trackedObjects) {
            this.release(id);
        }
    }
    
    getStats() {
        return {
            tracked: this.trackedObjects.size,
            ids: Array.from(this.trackedObjects.keys())
        };
    }
}

// ==================== 异常处理包装器 ====================
function safeWrapper(fn, options = {}) {
    const {
        retries = 0,
        onError = null,
        onSuccess = null,
        defaultValue = null
    } = options;
    
    return async function(...args) {
        let attempts = 0;
        
        while (attempts <= retries) {
            try {
                const result = await fn.apply(this, args);
                if (onSuccess) onSuccess(result);
                return result;
            } catch (e) {
                attempts++;
                console.error(`执行失败 (尝试 ${attempts}/${retries + 1}):`, e);
                
                if (attempts > retries) {
                    if (onError) onError(e);
                    return defaultValue;
                }
            }
        }
    };
}

// ==================== 状态恢复机制 ====================
class StateRecovery {
    constructor(checkpointInterval = 30000) {
        this.checkpoints = [];
        this.maxCheckpoints = 5;
        this.checkpointInterval = checkpointInterval;
        this.lastCheckpoint = 0;
    }
    
    save(state, metadata = {}) {
        const now = Date.now();
        
        // 限制检查点频率
        if (now - this.lastCheckpoint < this.checkpointInterval) {
            return false;
        }
        
        const checkpoint = {
            timestamp: now,
            state: JSON.parse(JSON.stringify(state)), // 深拷贝
            metadata
        };
        
        this.checkpoints.push(checkpoint);
        
        // 限制检查点数量
        if (this.checkpoints.length > this.maxCheckpoints) {
            this.checkpoints.shift();
        }
        
        this.lastCheckpoint = now;
        return true;
    }
    
    restore(index = -1) {
        if (this.checkpoints.length === 0) return null;
        
        const checkpoint = index === -1 
            ? this.checkpoints[this.checkpoints.length - 1]
            : this.checkpoints[index];
            
        return checkpoint ? checkpoint.state : null;
    }
    
    getCheckpoints() {
        return this.checkpoints.map((cp, i) => ({
            index: i,
            timestamp: cp.timestamp,
            time: new Date(cp.timestamp).toLocaleTimeString(),
            metadata: cp.metadata
        }));
    }
    
    clear() {
        this.checkpoints = [];
    }
}

// ==================== 游戏循环防护 ====================
class GameLoopGuard {
    constructor() {
        this.frameCount = 0;
        this.lastTime = 0;
        this.deltaTime = 0;
        this.maxDeltaTime = 0.1; // 最大100ms，防止卡顿导致的问题
        this.isRunning = false;
    }
    
    start() {
        this.isRunning = true;
        this.lastTime = performance.now();
    }
    
    stop() {
        this.isRunning = false;
    }
    
    getDeltaTime() {
        const now = performance.now();
        let dt = (now - this.lastTime) / 1000;
        
        // 限制最大时间步长
        if (dt > this.maxDeltaTime) {
            console.warn(`时间步长过大: ${dt.toFixed(3)}s，限制为 ${this.maxDeltaTime}s`);
            dt = this.maxDeltaTime;
        }
        
        this.deltaTime = dt;
        this.lastTime = now;
        this.frameCount++;
        
        return dt;
    }
    
    // 检查帧率
    checkFPS() {
        if (this.deltaTime > 0) {
            const fps = 1 / this.deltaTime;
            if (fps < 30) {
                console.warn(`帧率低: ${fps.toFixed(1)} FPS`);
            }
            return fps;
        }
        return 60;
    }
}

// ==================== 实体管理防护 ====================
class EntityGuard {
    constructor() {
        this.entities = new Set();
        this.toRemove = new Set();
        this.toAdd = new Set();
    }
    
    add(entity) {
        this.toAdd.add(entity);
    }
    
    remove(entity) {
        this.toRemove.add(entity);
    }
    
    flush() {
        // 先处理删除
        for (const entity of this.toRemove) {
            this.entities.delete(entity);
        }
        this.toRemove.clear();
        
        // 再处理添加
        for (const entity of this.toAdd) {
            this.entities.add(entity);
        }
        this.toAdd.clear();
    }
    
    getAll() {
        return Array.from(this.entities);
    }
    
    clear() {
        this.entities.clear();
        this.toRemove.clear();
        this.toAdd.clear();
    }
    
    count() {
        return this.entities.size;
    }
}

// ==================== 调试工具 ====================
class DebugTools {
    static init() {
        window.guards = Guards;
        window.memoryGuard = new MemoryGuard();
        window.stateRecovery = new StateRecovery();
        window.gameLoopGuard = new GameLoopGuard();
        
        console.log('🔧 调试工具已加载');
        console.log('可用: guards, memoryGuard, stateRecovery, gameLoopGuard');
    }
    
    // 性能分析
    static profile(fn, name = 'Function') {
        const start = performance.now();
        const result = fn();
        const end = performance.now();
        console.log(`${name} 执行时间: ${(end - start).toFixed(2)}ms`);
        return result;
    }
    
    // 内存使用
    static getMemoryUsage() {
        if (performance.memory) {
            return {
                used: (performance.memory.usedJSHeapSize / 1048576).toFixed(2) + ' MB',
                total: (performance.memory.totalJSHeapSize / 1048576).toFixed(2) + ' MB',
                limit: (performance.memory.jsHeapSizeLimit / 1048576).toFixed(2) + ' MB'
            };
        }
        return null;
    }
    
    // 检查循环引用
    static findCircularReferences(obj, seen = new WeakSet(), path = '') {
        if (obj === null || typeof obj !== 'object') return [];
        
        if (seen.has(obj)) {
            return [path];
        }
        
        seen.add(obj);
        const circles = [];
        
        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                circles.push(...this.findCircularReferences(
                    obj[key], 
                    seen, 
                    path ? `${path}.${key}` : key
                ));
            }
        }
        
        seen.delete(obj);
        return circles;
    }
}

// ==================== 错误报告 ====================
class ErrorReporter {
    constructor() {
        this.errors = [];
        this.maxErrors = 50;
        
        // 捕获全局错误
        window.addEventListener('error', (e) => {
            this.report(e.error || e.message, 'global');
        });
        
        window.addEventListener('unhandledrejection', (e) => {
            this.report(e.reason, 'unhandledrejection');
        });
    }
    
    report(error, context = 'unknown') {
        const errorInfo = {
            timestamp: Date.now(),
            message: error.message || String(error),
            stack: error.stack,
            context,
            url: window.location.href,
            userAgent: navigator.userAgent
        };
        
        this.errors.push(errorInfo);
        
        if (this.errors.length > this.maxErrors) {
            this.errors.shift();
        }
        
        console.error(`[ErrorReporter] ${context}:`, error);
    }
    
    getErrors() {
        return this.errors;
    }
    
    clear() {
        this.errors = [];
    }
    
    export() {
        return JSON.stringify(this.errors, null, 2);
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Guards,
        MemoryGuard,
        safeWrapper,
        StateRecovery,
        GameLoopGuard,
        EntityGuard,
        DebugTools,
        ErrorReporter
    };
}
