/**
 * Camera - 相机系统
 * 视口管理、平滑跟随、剔除优化
 * v0.23
 */

class Camera {
    constructor(x = 0, y = 0, width = 900, height = 600) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.zoom = 1;
        
        // 平滑跟随参数
        this.followTarget = null;
        this.smoothness = 0.1;
        
        // 边界限制
        this.bounds = null; // { minX, maxX, minY, maxY }
        
        // 视口边界（带缓冲）
        this.viewBuffer = 100;
        this.viewBounds = {
            x: 0, y: 0,
            width: width + this.viewBuffer * 2,
            height: height + this.viewBuffer * 2
        };
        
        // 震动
        this.shakeIntensity = 0;
        this.shakeDecay = 0;
    }

    /**
     * 设置跟随目标
     */
    follow(target) {
        this.followTarget = target;
    }

    /**
     * 更新相机位置
     */
    update(dt) {
        // 平滑跟随
        if (this.followTarget) {
            const targetX = this.followTarget.x;
            const targetY = this.followTarget.y;
            
            this.x += (targetX - this.x) * this.smoothness;
            this.y += (targetY - this.y) * this.smoothness;
        }
        
        // 边界限制
        if (this.bounds) {
            const halfWidth = this.width / 2 / this.zoom;
            const halfHeight = this.height / 2 / this.zoom;
            
            this.x = Math.max(this.bounds.minX + halfWidth, 
                     Math.min(this.x, this.bounds.maxX - halfWidth));
            this.y = Math.max(this.bounds.minY + halfHeight, 
                     Math.min(this.y, this.bounds.maxY - halfHeight));
        }
        
        // 更新视口边界
        this.viewBounds.x = this.x - this.width / 2 / this.zoom - this.viewBuffer;
        this.viewBounds.y = this.y - this.height / 2 / this.zoom - this.viewBuffer;
        
        // 震动衰减
        if (this.shakeIntensity > 0) {
            this.shakeIntensity *= this.shakeDecay;
            if (this.shakeIntensity < 0.5) {
                this.shakeIntensity = 0;
            }
        }
    }

    /**
     * 检查实体是否在视野内
     */
    isVisible(entity) {
        const bounds = entity.getBounds ? entity.getBounds() : {
            left: entity.x - (entity.radius || 0),
            right: entity.x + (entity.radius || 0),
            top: entity.y - (entity.radius || 0),
            bottom: entity.y + (entity.radius || 0)
        };
        
        return bounds.right > this.viewBounds.x &&
               bounds.left < this.viewBounds.x + this.viewBounds.width &&
               bounds.bottom > this.viewBounds.y &&
               bounds.top < this.viewBounds.y + this.viewBounds.height;
    }

    /**
     * 世界坐标转屏幕坐标
     */
    worldToScreen(worldX, worldY) {
        // 添加震动偏移
        let shakeX = 0;
        let shakeY = 0;
        if (this.shakeIntensity > 0) {
            shakeX = (Math.random() - 0.5) * this.shakeIntensity;
            shakeY = (Math.random() - 0.5) * this.shakeIntensity;
        }
        
        return {
            x: (worldX - this.x) * this.zoom + this.width / 2 + shakeX,
            y: (worldY - this.y) * this.zoom + this.height / 2 + shakeY
        };
    }

    /**
     * 屏幕坐标转世界坐标
     */
    screenToWorld(screenX, screenY) {
        return {
            x: (screenX - this.width / 2) / this.zoom + this.x,
            y: (screenY - this.height / 2) / this.zoom + this.y
        };
    }

    /**
     * 屏幕坐标转世界坐标（考虑Canvas缩放）
     */
    screenToWorldWithScale(screenX, screenY, canvasRect) {
        const scaleX = this.width / canvasRect.width;
        const scaleY = this.height / canvasRect.height;
        
        return this.screenToWorld(
            screenX * scaleX,
            screenY * scaleY
        );
    }

    /**
     * 震动效果
     */
    shake(intensity, duration = 0.3) {
        this.shakeIntensity = intensity;
        this.shakeDecay = Math.pow(0.01, 1 / (duration * 60)); // 假设60fps
    }

    /**
     * 设置边界
     */
    setBounds(minX, maxX, minY, maxY) {
        this.bounds = { minX, maxX, minY, maxY };
    }

    /**
     * 设置缩放
     */
    setZoom(zoom) {
        this.zoom = Math.max(0.5, Math.min(2, zoom));
    }

    /**
     * 立即移动到目标位置
     */
    snapTo(x, y) {
        this.x = x;
        this.y = y;
    }

    /**
     * 获取视口边界
     */
    getViewBounds() {
        return {
            left: this.viewBounds.x,
            right: this.viewBounds.x + this.viewBounds.width,
            top: this.viewBounds.y,
            bottom: this.viewBounds.y + this.viewBounds.height
        };
    }
}

window.Camera = Camera;
