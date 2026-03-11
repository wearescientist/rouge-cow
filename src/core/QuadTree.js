/**
 * QuadTree - 四叉树空间分割
 * 用于高效的碰撞检测和视口剔除
 * v0.23
 */

class QuadTree {
    constructor(boundary, capacity = 10, maxDepth = 5) {
        this.boundary = boundary;  // {x, y, width, height}
        this.capacity = capacity;  // 节点容量
        this.maxDepth = maxDepth;  // 最大深度
        this.depth = 0;
        
        this.entities = [];
        this.divided = false;
        
        // 子节点
        this.northeast = null;
        this.northwest = null;
        this.southeast = null;
        this.southwest = null;
    }

    /**
     * 清空四叉树
     */
    clear() {
        this.entities = [];
        
        if (this.divided) {
            this.northeast.clear();
            this.northwest.clear();
            this.southeast.clear();
            this.southwest.clear();
            
            this.northeast = null;
            this.northwest = null;
            this.southeast = null;
            this.southwest = null;
            this.divided = false;
        }
    }

    /**
     * 插入实体
     */
    insert(entity) {
        // 检查边界
        if (!this.contains(this.boundary, entity)) {
            return false;
        }
        
        // 未达到容量或未超过深度
        if (this.entities.length < this.capacity || this.depth >= this.maxDepth) {
            this.entities.push(entity);
            return true;
        }
        
        // 需要分割
        if (!this.divided) {
            this.subdivide();
        }
        
        // 插入子节点
        return this.northeast.insert(entity) ||
               this.northwest.insert(entity) ||
               this.southeast.insert(entity) ||
               this.southwest.insert(entity);
    }

    /**
     * 查询范围内的实体
     */
    query(range, found = []) {
        if (!this.intersects(this.boundary, range)) {
            return found;
        }
        
        // 检查当前节点的实体
        for (const entity of this.entities) {
            if (this.contains(range, entity)) {
                found.push(entity);
            }
        }
        
        // 递归查询子节点
        if (this.divided) {
            this.northeast.query(range, found);
            this.northwest.query(range, found);
            this.southeast.query(range, found);
            this.southwest.query(range, found);
        }
        
        return found;
    }

    /**
     * 查询与指定实体碰撞的所有实体
     */
    queryCollisions(entity, found = []) {
        const range = {
            x: entity.x - entity.radius,
            y: entity.y - entity.radius,
            width: entity.radius * 2,
            height: entity.radius * 2
        };
        
        const candidates = this.query(range);
        
        for (const other of candidates) {
            if (other !== entity && this.checkCollision(entity, other)) {
                found.push(other);
            }
        }
        
        return found;
    }

    /**
     * 分割节点
     */
    subdivide() {
        const { x, y, width, height } = this.boundary;
        const hw = width / 2;
        const hh = height / 2;
        
        const nextDepth = this.depth + 1;
        
        this.northeast = new QuadTree(
            { x: x + hw, y: y, width: hw, height: hh },
            this.capacity,
            this.maxDepth
        );
        this.northeast.depth = nextDepth;
        
        this.northwest = new QuadTree(
            { x: x, y: y, width: hw, height: hh },
            this.capacity,
            this.maxDepth
        );
        this.northwest.depth = nextDepth;
        
        this.southeast = new QuadTree(
            { x: x + hw, y: y + hh, width: hw, height: hh },
            this.capacity,
            this.maxDepth
        );
        this.southeast.depth = nextDepth;
        
        this.southwest = new QuadTree(
            { x: x, y: y + hh, width: hw, height: hh },
            this.capacity,
            this.maxDepth
        );
        this.southwest.depth = nextDepth;
        
        this.divided = true;
        
        // 将当前实体重分配到子节点
        for (const entity of this.entities) {
            this.northeast.insert(entity) ||
            this.northwest.insert(entity) ||
            this.southeast.insert(entity) ||
            this.southwest.insert(entity);
        }
        this.entities = [];
    }

    /**
     * 检查边界是否包含实体
     */
    contains(boundary, entity) {
        return entity.x >= boundary.x &&
               entity.x < boundary.x + boundary.width &&
               entity.y >= boundary.y &&
               entity.y < boundary.y + boundary.height;
    }

    /**
     * 检查两个边界是否相交
     */
    intersects(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }

    /**
     * 检查两个实体是否碰撞
     */
    checkCollision(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance < (a.radius || 0) + (b.radius || 0);
    }

    /**
     * 获取统计信息
     */
    getStats() {
        let count = this.entities.length;
        let depth = this.depth;
        
        if (this.divided) {
            const ne = this.northeast.getStats();
            const nw = this.northwest.getStats();
            const se = this.southeast.getStats();
            const sw = this.southwest.getStats();
            
            count += ne.count + nw.count + se.count + sw.count;
            depth = Math.max(depth, ne.depth, nw.depth, se.depth, sw.depth);
        }
        
        return { count, depth };
    }
}

window.QuadTree = QuadTree;
