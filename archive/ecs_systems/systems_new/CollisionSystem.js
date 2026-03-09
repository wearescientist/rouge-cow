/**
 * CollisionSystem - 碰撞系统
 * 使用 QuadTree 优化碰撞检测
 */

class CollisionSystem {
    constructor(world) {
        this.world = world;
        this.priority = 20;
        this.enabled = true;
        
        // 碰撞层级关系
        this.collisionLayers = {
            'player': ['enemy', 'item', 'obstacle'],
            'enemy': ['player', 'projectile', 'obstacle'],
            'projectile': ['enemy', 'obstacle'],
            'item': ['player'],
            'obstacle': ['player', 'enemy', 'projectile']
        };
        
        // 碰撞事件回调
        this.onCollision = null;
        this.onTrigger = null;
    }
    
    init() {
        // 初始化 QuadTree
        const bounds = { x: -2000, y: -2000, width: 4000, height: 4000 };
        this.quadTree = new QuadTree(bounds, 10, 5);
    }
    
    update(dt) {
        // 重建 QuadTree
        this.quadTree.clear();
        
        const entities = this.world.getEntitiesWithComponents(
            TransformComponent,
            ColliderComponent
        );
        
        // 插入所有碰撞体
        for (const entity of entities) {
            const transform = entity.get(TransformComponent);
            const collider = entity.get(ColliderComponent);
            
            if (collider.isStatic && collider.lastTransform) {
                continue;
            }
            
            const bounds = this.getBounds(transform, collider);
            this.quadTree.insert({
                entity,
                bounds,
                layer: collider.layer
            });
            
            collider.collisions = [];
        }
        
        // 检测碰撞
        this.checkCollisions(entities);
    }
    
    getBounds(transform, collider) {
        const x = transform.x + collider.offsetX;
        const y = transform.y + collider.offsetY;
        
        if (collider.type === 'circle') {
            return {
                x: x - collider.radius,
                y: y - collider.radius,
                width: collider.radius * 2,
                height: collider.radius * 2
            };
        } else {
            return {
                x: x - collider.width / 2,
                y: y - collider.height / 2,
                width: collider.width,
                height: collider.height
            };
        }
    }
    
    checkCollisions(entities) {
        for (const entityA of entities) {
            const transformA = entityA.get(TransformComponent);
            const colliderA = entityA.get(ColliderComponent);
            
            const queryBounds = this.getBounds(transformA, colliderA);
            const potentials = this.quadTree.query(queryBounds);
            
            for (const potential of potentials) {
                const entityB = potential.entity;
                if (entityA === entityB) continue;
                
                const colliderB = entityB.get(ColliderComponent);
                
                if (!this.canCollide(colliderA.layer, colliderB.layer)) continue;
                
                if (this.intersect(entityA, entityB)) {
                    this.resolveCollision(entityA, entityB);
                }
            }
        }
    }
    
    canCollide(layerA, layerB) {
        const canCollideA = this.collisionLayers[layerA]?.includes(layerB);
        const canCollideB = this.collisionLayers[layerB]?.includes(layerA);
        return canCollideA || canCollideB;
    }
    
    intersect(entityA, entityB) {
        const transformA = entityA.get(TransformComponent);
        const colliderA = entityA.get(ColliderComponent);
        const transformB = entityB.get(TransformComponent);
        const colliderB = entityB.get(ColliderComponent);
        
        const posA = {
            x: transformA.x + colliderA.offsetX,
            y: transformA.y + colliderA.offsetY
        };
        const posB = {
            x: transformB.x + colliderB.offsetX,
            y: transformB.y + colliderB.offsetY
        };
        
        // 圆形 vs 圆形
        if (colliderA.type === 'circle' && colliderB.type === 'circle') {
            const dx = posA.x - posB.x;
            const dy = posA.y - posB.y;
            const distSq = dx * dx + dy * dy;
            const radiusSum = colliderA.radius + colliderB.radius;
            return distSq <= radiusSum * radiusSum;
        }
        
        // 矩形 vs 矩形
        if (colliderA.type === 'rectangle' && colliderB.type === 'rectangle') {
            return !(posA.x + colliderA.width / 2 < posB.x - colliderB.width / 2 ||
                     posA.x - colliderA.width / 2 > posB.x + colliderB.width / 2 ||
                     posA.y + colliderA.height / 2 < posB.y - colliderB.height / 2 ||
                     posA.y - colliderA.height / 2 > posB.y + colliderB.height / 2);
        }
        
        // 圆形 vs 矩形简化检测
        const circle = colliderA.type === 'circle' ? { pos: posA, r: colliderA.radius } : { pos: posB, r: colliderB.radius };
        const rect = colliderA.type === 'rectangle' ? { pos: posA, w: colliderA.width, h: colliderA.height } : { pos: posB, w: colliderB.width, h: colliderB.height };
        
        const closestX = Math.max(rect.pos.x - rect.w / 2, Math.min(circle.pos.x, rect.pos.x + rect.w / 2));
        const closestY = Math.max(rect.pos.y - rect.h / 2, Math.min(circle.pos.y, rect.pos.y + rect.h / 2));
        
        const dx = circle.pos.x - closestX;
        const dy = circle.pos.y - closestY;
        
        return (dx * dx + dy * dy) <= (circle.r * circle.r);
    }
    
    resolveCollision(entityA, entityB) {
        const colliderA = entityA.get(ColliderComponent);
        const colliderB = entityB.get(ColliderComponent);
        
        colliderA.collisions.push(entityB);
        colliderB.collisions.push(entityA);
        
        if (colliderA.isTrigger || colliderB.isTrigger) {
            if (this.onTrigger) {
                this.onTrigger(entityA, entityB);
            }
        } else {
            this.separateEntities(entityA, entityB);
            if (this.onCollision) {
                this.onCollision(entityA, entityB);
            }
        }
    }
    
    separateEntities(entityA, entityB) {
        const transformA = entityA.get(TransformComponent);
        const colliderA = entityA.get(ColliderComponent);
        const transformB = entityB.get(TransformComponent);
        const colliderB = entityB.get(ColliderComponent);
        
        const dx = (transformB.x + colliderB.offsetX) - (transformA.x + colliderA.offsetX);
        const dy = (transformB.y + colliderB.offsetY) - (transformA.y + colliderA.offsetY);
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist === 0) return;
        
        const minDist = (colliderA.radius || colliderA.width / 2) + (colliderB.radius || colliderB.width / 2);
        const overlap = minDist - dist;
        const nx = dx / dist;
        const ny = dy / dist;
        
        // 简单分离
        transformA.x -= nx * overlap * 0.5;
        transformA.y -= ny * overlap * 0.5;
        transformB.x += nx * overlap * 0.5;
        transformB.y += ny * overlap * 0.5;
    }
    
    destroy() {}
}

window.CollisionSystem = CollisionSystem;
