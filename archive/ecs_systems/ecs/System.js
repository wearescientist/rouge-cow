/**
 * ECS System Base Class
 * 所有系统的基类
 */

class System {
    constructor(world) {
        this.world = world;
        this.enabled = true;
        this.priority = 0; // 执行优先级，数字越小越先执行
    }
    
    // 返回系统感兴趣的组件类型数组
    getRequiredComponents() {
        return [];
    }
    
    // 检查实体是否匹配系统要求
    matches(entity) {
        const required = this.getRequiredComponents();
        return required.every(compType => entity.hasComponent(compType));
    }
    
    // 每帧更新
    update(dt) {
        if (!this.enabled) return;
        
        const entities = this.world.getEntitiesWithComponents(...this.getRequiredComponents());
        for (const entity of entities) {
            this.processEntity(entity, dt);
        }
    }
    
    // 处理单个实体，子类必须实现
    processEntity(entity, dt) {
        throw new Error('Subclasses must implement processEntity');
    }
    
    // 系统初始化
    init() {}
    
    // 系统清理
    cleanup() {}
}

// 系统管理器
class SystemManager {
    constructor(world) {
        this.world = world;
        this.systems = [];
    }
    
    addSystem(system) {
        this.systems.push(system);
        this.systems.sort((a, b) => a.priority - b.priority);
        system.init();
        return system;
    }
    
    removeSystem(system) {
        const index = this.systems.indexOf(system);
        if (index !== -1) {
            system.cleanup();
            this.systems.splice(index, 1);
        }
    }
    
    update(dt) {
        for (const system of this.systems) {
            system.update(dt);
        }
    }
    
    getSystem(systemClass) {
        return this.systems.find(s => s instanceof systemClass);
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { System, SystemManager };
}
