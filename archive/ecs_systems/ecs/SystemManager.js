/**
 * SystemManager - 系统管理器
 * 管理所有系统的添加、移除和更新
 */

class SystemManager {
    constructor(world) {
        this.world = world;
        this.systems = [];
    }
    
    /**
     * 添加系统
     */
    addSystem(system) {
        this.systems.push(system);
        // 按优先级排序
        this.systems.sort((a, b) => (a.priority || 0) - (b.priority || 0));
        
        // 初始化
        if (system.init) {
            system.init();
        }
        
        return system;
    }
    
    /**
     * 移除系统
     */
    removeSystem(system) {
        const index = this.systems.indexOf(system);
        if (index !== -1) {
            // 清理
            if (system.destroy) {
                system.destroy();
            }
            this.systems.splice(index, 1);
        }
    }
    
    /**
     * 获取特定类型的系统
     */
    getSystem(SystemClass) {
        return this.systems.find(s => s instanceof SystemClass);
    }
    
    /**
     * 更新所有系统
     */
    update(dt) {
        for (const system of this.systems) {
            if (system.enabled !== false) {
                system.update(dt);
            }
        }
    }
    
    /**
     * 清理所有系统
     */
    cleanup() {
        for (const system of this.systems) {
            if (system.destroy) {
                system.destroy();
            }
        }
        this.systems = [];
    }
}

// 导出
window.SystemManager = SystemManager;
