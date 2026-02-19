/**
 * 肉鸽牛牛 - 优化的碰撞检测系统
 * 使用空间哈希将 O(n²) 降到 O(n)
 */

class OptimizedCollisionManager {
    constructor(cellSize = 80) {
        this.spatialHash = new SpatialHash(cellSize);
        this.cellSize = cellSize;
    }

    // 每帧开始前清空
    clear() {
        this.spatialHash.clear();
    }

    // 注册实体到空间哈希
    register(entity) {
        if (entity.alive) {
            this.spatialHash.insert(entity);
        }
    }

    // 查找碰撞（只检测附近的实体）
    checkCollisions(entitiesA, entitiesB, callback) {
        for (const a of entitiesA) {
            if (!a.alive) continue;
            
            // 只查询 a 附近的实体
            const nearby = this.spatialHash.query(a.x, a.y, this.cellSize * 2);
            
            for (const b of nearby) {
                if (!entitiesB.includes(b) || !b.alive) continue;
                if (a === b) continue;
                
                if (this.aabbCheck(a, b)) {
                    callback(a, b);
                }
            }
        }
    }

    // 快速 AABB 检测
    aabbCheck(a, b) {
        const aBounds = a.bounds || {
            left: a.x - a.width/2,
            right: a.x + a.width/2,
            top: a.y - a.height/2,
            bottom: a.y + a.height/2
        };
        const bBounds = b.bounds || {
            left: b.x - b.width/2,
            right: b.x + b.width/2,
            top: b.y - b.height/2,
            bottom: b.y + b.height/2
        };
        
        return aBounds.left < bBounds.right &&
               aBounds.right > bBounds.left &&
               aBounds.top < bBounds.bottom &&
               aBounds.bottom > bBounds.top;
    }

    // 圆形检测（用于子弹爆炸等）
    checkRadius(source, targets, radius, callback) {
        const nearby = this.spatialHash.query(source.x, source.y, radius);
        
        for (const target of nearby) {
            if (!targets.includes(target) || !target.alive) continue;
            
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            if (dx*dx + dy*dy <= radius*radius) {
                callback(source, target);
            }
        }
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { OptimizedCollisionManager };
}
