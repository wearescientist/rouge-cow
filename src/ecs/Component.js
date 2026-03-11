/**
 * Component - 组件基类
 * ECS架构基础组件
 * v0.23
 */

class Component {
    constructor() {
        this.entity = null;
        this.enabled = true;
    }

    /**
     * 组件被添加到实体时调用
     */
    onAttach(entity) {
        this.entity = entity;
    }

    /**
     * 组件被移除时调用
     */
    onDetach() {
        this.entity = null;
    }

    /**
     * 初始化
     */
    init() {}

    /**
     * 更新
     */
    update(dt) {}

    /**
     * 销毁
     */
    destroy() {}

    /**
     * 序列化
     */
    serialize() {
        return {};
    }

    /**
     * 反序列化
     */
    deserialize(data) {}
}

// 全局导出
window.Component = Component;
