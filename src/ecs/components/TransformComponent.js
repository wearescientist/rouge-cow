/**
 * TransformComponent - 变换组件
 * 管理实体的位置、旋转、缩放
 * v0.23
 */

class TransformComponent extends Component {
    constructor(x = 0, y = 0, rotation = 0) {
        super();
        this.x = x;
        this.y = y;
        this.rotation = rotation;
        this.scaleX = 1;
        this.scaleY = 1;
        
        // 缓存值
        this._width = 0;
        this._height = 0;
    }

    get cx() {
        return this.x + this._width / 2;
    }

    get cy() {
        return this.y + this._height / 2;
    }

    setSize(width, height) {
        this._width = width;
        this._height = height;
    }

    setCenter(cx, cy) {
        this.x = cx - this._width / 2;
        this.y = cy - this._height / 2;
    }

    translate(dx, dy) {
        this.x += dx;
        this.y += dy;
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    distanceTo(other) {
        const dx = this.cx - other.cx;
        const dy = this.cy - other.cy;
        return Math.sqrt(dx * dx + dy * dy);
    }

    distanceToPoint(x, y) {
        const dx = this.cx - x;
        const dy = this.cy - y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    getBounds() {
        return {
            left: this.x,
            right: this.x + this._width,
            top: this.y,
            bottom: this.y + this._height
        };
    }

    serialize() {
        return {
            x: this.x,
            y: this.y,
            rotation: this.rotation,
            scaleX: this.scaleX,
            scaleY: this.scaleY
        };
    }

    deserialize(data) {
        this.x = data.x || 0;
        this.y = data.y || 0;
        this.rotation = data.rotation || 0;
        this.scaleX = data.scaleX || 1;
        this.scaleY = data.scaleY || 1;
    }
}

window.TransformComponent = TransformComponent;
