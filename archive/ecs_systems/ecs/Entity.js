/**
 * ECS Entity
 * 实体的唯一标识和组件容器
 */

class Entity {
    constructor(id, world) {
        this.id = id;
        this.world = world;
        this.components = new Map();
        this.tags = new Set();
        this.active = true;
    }
    
    /**
     * 添加组件（链式调用）
     */
    add(component) {
        const type = component.constructor;
        this.components.set(type, component);
        
        // 通知世界注册组件
        if (this.world) {
            this.world._registerComponent(this.id, type);
        }
        
        return this;
    }
    
    /**
     * 获取组件
     */
    get(ComponentClass) {
        return this.components.get(ComponentClass);
    }
    
    /**
     * 检查是否有组件
     */
    has(ComponentClass) {
        return this.components.has(ComponentClass);
    }
    
    /**
     * 检查是否有所有指定组件
     */
    hasAll(...ComponentClasses) {
        return ComponentClasses.every(c => this.components.has(c));
    }
    
    /**
     * 移除组件
     */
    remove(ComponentClass) {
        if (this.components.has(ComponentClass)) {
            this.components.delete(ComponentClass);
            
            if (this.world) {
                this.world._unregisterComponent(this.id, ComponentClass);
            }
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
     * 检查标签
     */
    hasTag(tag) {
        return this.tags.has(tag);
    }
    
    /**
     * 销毁实体
     */
    destroy() {
        if (this.world) {
            this.world.destroyEntity(this.id);
        }
    }
    
    /**
     * 序列化
     */
    serialize() {
        const data = {
            id: this.id,
            tags: Array.from(this.tags),
            components: {}
        };
        
        for (const [type, component] of this.components) {
            data.components[type.name] = { ...component };
        }
        
        return data;
    }
}

// 导出
window.Entity = Entity;
