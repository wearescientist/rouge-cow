/**
 * ObjectPool - 对象池
 * 减少GC压力，复用对象
 * v0.23
 */

class ObjectPool {
    constructor(factory, resetFn, initialSize = 10) {
        this.factory = factory;      // 创建对象的工厂函数
        this.resetFn = resetFn;      // 重置对象的函数
        this.available = [];         // 可用对象数组
        this.inUse = new Set();      // 正在使用的对象
        this.maxSize = 1000;         // 最大容量
        
        // 预创建对象
        for (let i = 0; i < initialSize; i++) {
            this.available.push(this.factory());
        }
    }

    /**
     * 获取对象
     */
    acquire() {
        let obj = this.available.pop();
        
        if (!obj) {
            // 池子空了，创建新对象
            if (this.inUse.size >= this.maxSize) {
                console.warn('[ObjectPool] Max size reached');
                return null;
            }
            obj = this.factory();
        }
        
        this.inUse.add(obj);
        return obj;
    }

    /**
     * 释放对象
     */
    release(obj) {
        if (!this.inUse.has(obj)) return;
        
        this.inUse.delete(obj);
        
        // 重置对象
        if (this.resetFn) {
            this.resetFn(obj);
        }
        
        this.available.push(obj);
    }

    /**
     * 批量释放
     */
    releaseAll(objs) {
        for (const obj of objs) {
            this.release(obj);
        }
    }

    /**
     * 清空池子
     */
    clear() {
        this.available = [];
        this.inUse.clear();
    }

    /**
     * 获取统计
     */
    getStats() {
        return {
            available: this.available.length,
            inUse: this.inUse.size,
            total: this.available.length + this.inUse.size
        };
    }
}

// 粒子池
class ParticlePool extends ObjectPool {
    constructor(maxParticles = 1000) {
        super(
            () => ({ x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, size: 0, color: '#fff', active: false }),
            (p) => { p.active = false; p.x = 0; p.y = 0; p.vx = 0; p.vy = 0; p.life = 0; },
            maxParticles / 2
        );
        this.maxSize = maxParticles;
    }

    spawn(x, y, config) {
        const p = this.acquire();
        if (!p) return null;
        
        p.x = x;
        p.y = y;
        p.vx = config.vx || 0;
        p.vy = config.vy || 0;
        p.life = config.life || 60;
        p.maxLife = p.life;
        p.size = config.size || 5;
        p.color = config.color || '#fff';
        p.active = true;
        
        return p;
    }
}

// 子弹池
class BulletPool extends ObjectPool {
    constructor(maxBullets = 500) {
        super(
            () => ({ x: 0, y: 0, vx: 0, vy: 0, damage: 0, owner: null, active: false, pierce: 0 }),
            (b) => { b.active = false; b.owner = null; b.pierce = 0; },
            maxBullets / 2
        );
        this.maxSize = maxBullets;
    }
}

window.ObjectPool = ObjectPool;
window.ParticlePool = ParticlePool;
window.BulletPool = BulletPool;
