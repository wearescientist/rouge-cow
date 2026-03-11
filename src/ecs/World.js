/**
 * World - 世界管理器
 * ECS架构核心，管理所有实体和系统
 * v0.23
 */

class World {
    constructor() {
        this.entities = new Map();
        this.systems = [];
        this.components = new Map(); // componentType -> Set<entityId>
        this.nextEntityId = 1;
    }

    /**
     * 创建实体
     */
    createEntity() {
        const id = this.nextEntityId++;
        const entity = new Entity(id, this);
        this.entities.set(id, entity);
        return entity;
    }

    /**
     * 销毁实体
     */
    destroyEntity(entityId) {
        const entity = this.entities.get(entityId);
        if (entity) {
            entity.destroy();
            this.entities.delete(entityId);
            
            // 从组件索引中移除
            for (const set of this.components.values()) {
                set.delete(entityId);
            }
        }
    }

    /**
     * 注册组件
     */
    registerComponent(entityId, component) {
        const type = component.constructor.name;
        if (!this.components.has(type)) {
            this.components.set(type, new Set());
        }
        this.components.get(type).add(entityId);
    }

    /**
     * 注销组件
     */
    unregisterComponent(entityId, componentType) {
        const set = this.components.get(componentType);
        if (set) {
            set.delete(entityId);
        }
    }

    /**
     * 查询具有指定组件的实体
     */
    query(componentTypes) {
        if (componentTypes.length === 0) return [];
        
        // 从第一个组件的实体集合开始
        let result = new Set(this.components.get(componentTypes[0].name));
        
        // 与其他组件取交集
        for (let i = 1; i < componentTypes.length; i++) {
            const set = this.components.get(componentTypes[i].name);
            if (!set) return [];
            
            result = new Set([...result].filter(id => set.has(id)));
        }
        
        return [...result].map(id => this.entities.get(id)).filter(e => e && e.active);
    }

    /**
     * 添加系统
     */
    addSystem(system) {
        this.systems.push(system);
        this.systems.sort((a, b) => a.priority - b.priority);
        system.init();
    }

    /**
     * 移除系统
     */
    removeSystem(system) {
        const index = this.systems.indexOf(system);
        if (index >= 0) {
            system.destroy();
            this.systems.splice(index, 1);
        }
    }

    /**
     * 更新所有系统
     */
    update(dt) {
        for (const system of this.systems) {
            if (system.enabled) {
                system.update(dt);
            }
        }
        
        // 更新所有实体
        for (const entity of this.entities.values()) {
            if (entity.active) {
                entity.update(dt);
            }
        }
    }

    /**
     * 渲染所有系统
     */
    render(ctx) {
        for (const system of this.systems) {
            if (system.enabled) {
                system.render(ctx);
            }
        }
    }

    /**
     * 清空世界
     */
    clear() {
        for (const entity of this.entities.values()) {
            entity.destroy();
        }
        this.entities.clear();
        this.components.clear();
        
        for (const system of this.systems) {
            system.destroy();
        }
        this.systems = [];
    }

    /**
     * 获取统计信息
     */
    getStats() {
        return {
            entities: this.entities.size,
            systems: this.systems.length,
            components: this.components.size
        };
    }
}

/**
 * Entity - 实体
 */
class Entity {
    constructor(id, world) {
        this.id = id;
        this.world = world;
        this.components = new Map();
        this.active = true;
        this.tags = new Set();
    }

    /**
     * 添加组件
     */
    add(component) {
        const type = component.constructor.name;
        this.components.set(type, component);
        component.onAttach(this);
        component.init();
        this.world.registerComponent(this.id, component);
        return this;
    }

    /**
     * 获取组件
     */
    get(ComponentClass) {
        return this.components.get(ComponentClass.name);
    }

    /**
     * 是否有组件
     */
    has(ComponentClass) {
        return this.components.has(ComponentClass.name);
    }

    /**
     * 移除组件
     */
    remove(ComponentClass) {
        const type = ComponentClass.name;
        const component = this.components.get(type);
        if (component) {
            component.onDetach();
            component.destroy();
            this.components.delete(type);
            this.world.unregisterComponent(this.id, type);
        }
        return this;
    }

    /**
     * 添加标签
     */
    addTag(tag) {
        this.tags.add(tag);
        return this;
    }

    /**
     * 移除标签
     */
    removeTag(tag) {
        this.tags.delete(tag);
        return this;
    }

    /**
     * 是否有标签
     */
    hasTag(tag) {
        return this.tags.has(tag);
    }

    /**
     * 更新
     */
    update(dt) {
        for (const component of this.components.values()) {
            if (component.enabled) {
                component.update(dt);
            }
        }
    }

    /**
     * 销毁
     */
    destroy() {
        for (const component of this.components.values()) {
            component.onDetach();
            component.destroy();
        }
        this.components.clear();
        this.active = false;
    }

    /**
     * 序列化
     */
    serialize() {
        const data = {
            id: this.id,
            active: this.active,
            tags: [...this.tags],
            components: {}
        };
        
        for (const [type, component] of this.components) {
            data.components[type] = component.serialize();
        }
        
        return data;
    }
}

window.World = World;
window.Entity = Entity;
