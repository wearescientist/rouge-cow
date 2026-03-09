/**
 * World - 世界管理器
 * ECS架构核心，管理所有实体和系统
 * v0.23 - 完整版
 */

class World {
    constructor() {
        this.entities = new Map();
        this.systems = [];
        this.systemManager = new SystemManager(this);
        this.componentRegistry = new Map(); // componentType -> Set<entityId>
        this.nextEntityId = 1;
        this.isRunning = false;
        
        // 实体池（优化高频创建销毁）
        this.entityPool = [];
        this.maxPoolSize = 100;
        
        // 事件系统
        this.eventListeners = new Map();
        
        // 性能统计
        this.stats = {
            entityCount: 0,
            systemCount: 0,
            updateTime: 0,
            lastUpdateTime: 0
        };
    }
    
    /**
     * 创建实体
     */
    createEntity() {
        // 尝试从池中获取
        let entity = this.entityPool.pop();
        if (entity) {
            entity.id = this.nextEntityId++;
            entity.components.clear();
            entity.tags.clear();
            entity.active = true;
        } else {
            entity = new Entity(this.nextEntityId++, this);
        }
        
        this.entities.set(entity.id, entity);
        this.stats.entityCount = this.entities.size;
        
        // 触发事件
        this.emit('entityCreated', entity);
        
        return entity;
    }
    
    /**
     * 销毁实体
     */
    destroyEntity(entityId) {
        const entity = this.entities.get(entityId);
        if (!entity || !entity.active) return;
        
        // 触发事件
        this.emit('entityDestroyed', entity);
        
        // 清理组件索引
        for (const [type, set] of this.componentRegistry) {
            set.delete(entityId);
        }
        
        // 清理实体
        entity.active = false;
        entity.components.clear();
        entity.tags.clear();
        
        // 从主列表移除
        this.entities.delete(entityId);
        
        // 回收到池
        if (this.entityPool.length < this.maxPoolSize) {
            this.entityPool.push(entity);
        }
        
        this.stats.entityCount = this.entities.size;
    }
    
    /**
     * 获取实体
     */
    getEntity(id) {
        return this.entities.get(id);
    }
    
    /**
     * 获取所有实体
     */
    getAllEntities() {
        return Array.from(this.entities.values()).filter(e => e.active);
    }
    
    /**
     * 获取具有指定组件的实体
     */
    getEntitiesWithComponents(...componentClasses) {
        if (componentClasses.length === 0) {
            return this.getAllEntities();
        }
        
        // 从第一个组件的集合开始
        let result = this.componentRegistry.get(componentClasses[0]);
        if (!result) return [];
        
        // 取交集
        for (let i = 1; i < componentClasses.length; i++) {
            const set = this.componentRegistry.get(componentClasses[i]);
            if (!set) return [];
            result = new Set([...result].filter(id => set.has(id)));
        }
        
        return [...result]
            .map(id => this.entities.get(id))
            .filter(e => e && e.active);
    }
    
    /**
     * 获取带有特定标签的实体
     */
    getEntitiesWithTag(tag) {
        return this.getAllEntities().filter(e => e.tags.has(tag));
    }
    
    /**
     * 注册组件到索引
     */
    _registerComponent(entityId, componentClass) {
        if (!this.componentRegistry.has(componentClass)) {
            this.componentRegistry.set(componentClass, new Set());
        }
        this.componentRegistry.get(componentClass).add(entityId);
    }
    
    /**
     * 注销组件索引
     */
    _unregisterComponent(entityId, componentClass) {
        const set = this.componentRegistry.get(componentClass);
        if (set) {
            set.delete(entityId);
        }
    }
    
    /**
     * 添加系统
     */
    addSystem(system) {
        this.systemManager.addSystem(system);
        this.stats.systemCount = this.systems.length;
        return system;
    }
    
    /**
     * 移除系统
     */
    removeSystem(system) {
        this.systemManager.removeSystem(system);
        this.stats.systemCount = this.systems.length;
    }
    
    /**
     * 获取系统
     */
    getSystem(systemClass) {
        return this.systemManager.getSystem(systemClass);
    }
    
    /**
     * 更新所有系统
     */
    update(dt) {
        const startTime = performance.now();
        
        if (!this.isRunning) return;
        
        // 更新系统
        this.systemManager.update(dt);
        
        this.stats.updateTime = performance.now() - startTime;
        this.stats.lastUpdateTime = startTime;
    }
    
    /**
     * 渲染
     */
    render(ctx) {
        for (const system of this.systems) {
            if (system.enabled && system.render) {
                system.render(ctx);
            }
        }
    }
    
    /**
     * 启动世界
     */
    start() {
        this.isRunning = true;
        this.emit('worldStarted', this);
    }
    
    /**
     * 暂停世界
     */
    pause() {
        this.isRunning = false;
        this.emit('worldPaused', this);
    }
    
    /**
     * 清空世界
     */
    clear() {
        // 销毁所有实体
        for (const entity of this.entities.values()) {
            entity.components.clear();
        }
        this.entities.clear();
        this.componentRegistry.clear();
        
        // 清理系统
        this.systemManager.cleanup();
        this.systems = [];
        
        // 清理池
        this.entityPool = [];
        
        this.nextEntityId = 1;
        this.isRunning = false;
        
        this.emit('worldCleared', this);
    }
    
    /**
     * 事件监听
     */
    on(event, callback) {
        if (!this.eventListeners.has(event)) {
            this.eventListeners.set(event, []);
        }
        this.eventListeners.get(event).push(callback);
    }
    
    /**
     * 移除事件监听
     */
    off(event, callback) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        }
    }
    
    /**
     * 触发事件
     */
    emit(event, data) {
        const listeners = this.eventListeners.get(event);
        if (listeners) {
            for (const callback of listeners) {
                callback(data);
            }
        }
    }
    
    /**
     * 获取统计信息
     */
    getStats() {
        return {
            ...this.stats,
            componentTypes: this.componentRegistry.size,
            pooledEntities: this.entityPool.length
        };
    }
    
    // ========== 便捷方法 ==========
    
    /**
     * 创建玩家实体
     */
    createPlayer(x, y, options = {}) {
        const player = this.createEntity()
            .add(new TransformComponent(x, y))
            .add(new SpriteComponent({ width: 32, height: 32 }))
            .add(new MovementComponent(options.movement))
            .add(new HealthComponent(options.health))
            .add(new PlayerComponent(options.player))
            .add(new ColliderComponent({ radius: 16, layer: 'player' }))
            .add(new InventoryComponent());
        
        player.addTag('player');
        
        // 设置玩家纹理
        const sprite = player.get(SpriteComponent);
        if (sprite) {
            sprite.texture = 'player_0';
        }
        
        return player;
    }
    
    /**
     * 创建敌人实体
     */
    createEnemy(x, y, enemyType, options = {}) {
        const enemy = this.createEntity()
            .add(new TransformComponent(x, y))
            .add(new SpriteComponent({ width: 32, height: 32 }))
            .add(new MovementComponent(options.movement))
            .add(new HealthComponent(options.health))
            .add(new EnemyComponent({ enemyType, ...options.enemy }))
            .add(new CombatComponent(options.combat))
            .add(new ColliderComponent({ radius: 16, layer: 'enemy' }))
            .add(new AIComponent(options.ai));
        
        enemy.addTag('enemy');
        return enemy;
    }
    
    /**
     * 创建道具实体
     */
    createItem(x, y, itemId, options = {}) {
        const item = this.createEntity()
            .add(new TransformComponent(x, y))
            .add(new SpriteComponent({ width: 24, height: 24 }))
            .add(new ItemComponent({ itemId, ...options }))
            .add(new ColliderComponent({ radius: 12, layer: 'item', isTrigger: true }));
        
        item.addTag('item');
        return item;
    }
    
    /**
     * 创建投射物
     */
    createProjectile(x, y, direction, owner, options = {}) {
        const projectile = this.createEntity()
            .add(new TransformComponent(x, y, Math.atan2(direction.y, direction.x)))
            .add(new SpriteComponent({ width: 16, height: 16 }))
            .add(new MovementComponent({ speed: options.speed || 300 }))
            .add(new ProjectileComponent({ owner, ...options }))
            .add(new ColliderComponent({ radius: 8, layer: 'projectile', isTrigger: true }));
        
        const move = projectile.get(MovementComponent);
        move.vx = direction.x * move.speed;
        move.vy = direction.y * move.speed;
        
        projectile.addTag('projectile');
        return projectile;
    }
}

// 导出
window.World = World;
