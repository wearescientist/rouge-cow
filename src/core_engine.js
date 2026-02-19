/**
 * 肉鸽牛牛 - 核心引擎
 * 实体系统、碰撞检测、相机、粒子
 */

// ==================== 向量工具 ====================
class Vec2 {
    constructor(x = 0, y = 0) { this.x = x; this.y = y; }
    add(v) { return new Vec2(this.x + v.x, this.y + v.y); }
    sub(v) { return new Vec2(this.x - v.x, this.y - v.y); }
    mul(s) { return new Vec2(this.x * s, this.y * s); }
    length() { return Math.sqrt(this.x * this.x + this.y * this.y); }
    normalize() {
        const len = this.length();
        return len > 0 ? new Vec2(this.x / len, this.y / len) : new Vec2(0, 0);
    }
    distance(v) { return this.sub(v).length(); }
    static fromAngle(angle) { return new Vec2(Math.cos(angle), Math.sin(angle)); }
}

// ==================== 实体基类 ====================
class Entity {
    constructor(x, y, width, height) {
        this.pos = new Vec2(x, y);
        this.vel = new Vec2(0, 0);
        this.width = width;
        this.height = height;
        this.rotation = 0;
        this.alive = true;
        this.z = 0; // 渲染层级
    }

    get x() { return this.pos.x; }
    get y() { return this.pos.y; }
    set x(v) { this.pos.x = v; }
    set y(v) { this.pos.y = v; }

    get bounds() {
        return {
            left: this.x - this.width / 2,
            right: this.x + this.width / 2,
            top: this.y - this.height / 2,
            bottom: this.y + this.height / 2
        };
    }

    update(dt) {
        this.pos = this.pos.add(this.vel.mul(dt));
    }

    draw(ctx) {
        // 子类实现
    }

    collidesWith(other) {
        const a = this.bounds;
        const b = other.bounds;
        return a.left < b.right && a.right > b.left &&
               a.top < b.bottom && a.bottom > b.top;
    }

    distanceTo(other) {
        return this.pos.distance(other.pos);
    }

    destroy() {
        this.alive = false;
    }
}

// ==================== 相机系统 ====================
class Camera {
    constructor(width, height) {
        this.pos = new Vec2(0, 0);
        this.width = width;
        this.height = height;
        this.shakeAmount = 0;
        this.shakeDecay = 0.9;
    }

    follow(target, smoothing = 0.1) {
        const targetX = target.x - this.width / 2;
        const targetY = target.y - this.height / 2;
        
        this.pos.x += (targetX - this.pos.x) * smoothing;
        this.pos.y += (targetY - this.pos.y) * smoothing;

        // 震动衰减
        if (this.shakeAmount > 0.1) {
            this.pos.x += (Math.random() - 0.5) * this.shakeAmount;
            this.pos.y += (Math.random() - 0.5) * this.shakeAmount;
            this.shakeAmount *= this.shakeDecay;
        } else {
            this.shakeAmount = 0;
        }
    }

    shake(amount) {
        this.shakeAmount = Math.max(this.shakeAmount, amount);
    }

    apply(ctx) {
        ctx.translate(-this.pos.x, -this.pos.y);
    }

    reset(ctx) {
        ctx.translate(this.pos.x, this.pos.y);
    }

    toWorld(screenX, screenY) {
        return new Vec2(screenX + this.pos.x, screenY + this.pos.y);
    }

    toScreen(worldX, worldY) {
        return new Vec2(worldX - this.pos.x, worldY - this.pos.y);
    }
}

// ==================== 碰撞检测管理器 ====================
class CollisionManager {
    constructor() {
        this.entities = new Set();
    }

    add(entity) {
        this.entities.add(entity);
    }

    remove(entity) {
        this.entities.delete(entity);
    }

    checkCollisions(groupA, groupB, callback) {
        for (const a of groupA) {
            for (const b of groupB) {
                if (a.alive && b.alive && a.collidesWith(b)) {
                    callback(a, b);
                }
            }
        }
    }

    checkRadius(source, targets, radius, callback) {
        for (const target of targets) {
            if (target.alive && source.distanceTo(target) <= radius) {
                callback(source, target);
            }
        }
    }
}

// ==================== 游戏时间管理器 ====================
class GameTime {
    constructor() {
        this.now = 0;
        this.delta = 0;
        this.scale = 1.0;
        this.slowMotion = 1.0;
    }

    update(timestamp) {
        const dt = (timestamp - this.now) / 1000;
        this.now = timestamp;
        this.delta = Math.min(dt, 0.1) * this.scale * this.slowMotion;
        return this.delta;
    }

    setTimeScale(scale, duration = 0) {
        this.scale = scale;
        if (duration > 0) {
            setTimeout(() => { this.scale = 1.0; }, duration * 1000);
        }
    }

    setSlowMotion(factor, duration = 0) {
        this.slowMotion = factor;
        if (duration > 0) {
            setTimeout(() => { this.slowMotion = 1.0; }, duration * 1000);
        }
    }
}

// ==================== 导出 ====================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Vec2, Entity, Camera, Particle, ParticleSystem, CollisionManager, GameTime };
}
