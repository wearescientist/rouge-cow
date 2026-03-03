/**
 * System - 系统基类
 * ECS架构基础系统
 * v0.23
 */

class System {
    constructor(world) {
        this.world = world;
        this.enabled = true;
        this.priority = 0;
    }

    /**
     * 系统初始化
     */
    init() {}

    /**
     * 更新
     */
    update(dt) {}

    /**
     * 渲染
     */
    render(ctx) {}

    /**
     * 销毁
     */
    destroy() {}

    /**
     * 获取具有指定组件的实体
     */
    query(componentTypes) {
        return this.world.query(componentTypes);
    }
}

window.System = System;
