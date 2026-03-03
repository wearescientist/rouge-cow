/**
 * Entity - 游戏实体基类
 * 所有游戏对象的基类，提供位置、更新、渲染等基本功能
 * v0.22.1 - Phase 2 重构
 */

class Entity {
    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
        this.vx = 0;
        this.vy = 0;
        this.width = 0;
        this.height = 0;
        this.radius = 0;
        this.active = true;
        this.visible = true;
        this.zIndex = 0;
        this.id = Entity.generateId();
        this.tags = new Set();
    }

    /**
     * 获取中心点X坐标
     */
    get cx() {
        return this.x + this.width / 2;
    }

    /**
     * 获取中心点Y坐标
     */
    get cy() {
        return this.y + this.height / 2;
    }

    /**
     * 设置中心点位置
     */
    setCenter(cx, cy) {
        this.x = cx - this.width / 2;
        this.y = cy - this.height / 2;
    }

    /**
     * 更新实体
     * @param {number} dt - 时间增量
     */
    update(dt) {
        // 基础物理更新
        this.x += this.vx * dt;
        this.y += this.vy * dt;
    }

    /**
     * 渲染实体
     * @param {CanvasRenderingContext2D} ctx - 画布上下文
     */
    draw(ctx) {
        // 子类实现
    }

    /**
     * 获取碰撞边界
     * @returns {Object}
     */
    getBounds() {
        return {
            left: this.x,
            right: this.x + this.width,
            top: this.y,
            bottom: this.y + this.height
        };
    }

    /**
     * 检测点是否在实体范围内
     * @param {number} x - 点X坐标
     * @param {number} y - 点Y坐标
     * @returns {boolean}
     */
    containsPoint(x, y) {
        const bounds = this.getBounds();
        return x >= bounds.left && x <= bounds.right && 
               y >= bounds.top && y <= bounds.bottom;
    }

    /**
     * 检测与另一个实体的碰撞
     * @param {Entity} other - 另一个实体
     * @returns {boolean}
     */
    intersects(other) {
        const a = this.getBounds();
        const b = other.getBounds();
        return a.left < b.right && a.right > b.left && 
               a.top < b.bottom && a.bottom > b.top;
    }

    /**
     * 计算与另一个实体的距离
     * @param {Entity} other - 另一个实体
     * @returns {number}
     */
    distanceTo(other) {
        const dx = this.cx - other.cx;
        const dy = this.cy - other.cy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * 计算与点的距离
     * @param {number} x - 点X坐标
     * @param {number} y - 点Y坐标
     * @returns {number}
     */
    distanceToPoint(x, y) {
        const dx = this.cx - x;
        const dy = this.cy - y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * 朝向目标移动
     * @param {number} tx - 目标X
     * @param {number} ty - 目标Y
     * @param {number} speed - 速度
     */
    moveTowards(tx, ty, speed) {
        const dx = tx - this.cx;
        const dy = ty - this.cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
            this.vx = (dx / dist) * speed;
            this.vy = (dy / dist) * speed;
        }
    }

    /**
     * 远离目标移动
     * @param {number} tx - 目标X
     * @param {number} ty - 目标Y
     * @param {number} speed - 速度
     */
    moveAway(tx, ty, speed) {
        const dx = this.cx - tx;
        const dy = this.cy - ty;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist > 0) {
            this.vx = (dx / dist) * speed;
            this.vy = (dy / dist) * speed;
        }
    }

    /**
     * 添加标签
     * @param {string} tag - 标签
     */
    addTag(tag) {
        this.tags.add(tag);
    }

    /**
     * 移除标签
     * @param {string} tag - 标签
     */
    removeTag(tag) {
        this.tags.delete(tag);
    }

    /**
     * 检查是否有标签
     * @param {string} tag - 标签
     * @returns {boolean}
     */
    hasTag(tag) {
        return this.tags.has(tag);
    }

    /**
     * 激活实体
     */
    activate() {
        this.active = true;
        this.visible = true;
    }

    /**
     * 禁用实体
     */
    deactivate() {
        this.active = false;
        this.visible = false;
    }

    /**
     * 销毁实体
     */
    destroy() {
        this.active = false;
        this.visible = false;
        this.tags.clear();
    }

    /**
     * 克隆实体
     * @returns {Entity}
     */
    clone() {
        const cloned = new this.constructor();
        cloned.x = this.x;
        cloned.y = this.y;
        cloned.vx = this.vx;
        cloned.vy = this.vy;
        cloned.width = this.width;
        cloned.height = this.height;
        cloned.radius = this.radius;
        cloned.zIndex = this.zIndex;
        this.tags.forEach(tag => cloned.addTag(tag));
        return cloned;
    }

    /**
     * 序列化
     * @returns {Object}
     */
    serialize() {
        return {
            x: this.x,
            y: this.y,
            vx: this.vx,
            vy: this.vy,
            width: this.width,
            height: this.height,
            radius: this.radius,
            active: this.active,
            visible: this.visible,
            zIndex: this.zIndex,
            tags: Array.from(this.tags)
        };
    }

    /**
     * 反序列化
     * @param {Object} data - 序列化数据
     */
    deserialize(data) {
        Object.assign(this, data);
        this.tags = new Set(data.tags || []);
    }

    /**
     * 生成唯一ID
     * @returns {string}
     */
    static generateId() {
        return `entity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
}

// 全局导出
window.Entity = Entity;
