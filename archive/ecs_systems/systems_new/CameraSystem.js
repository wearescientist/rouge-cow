/**
 * CameraSystem - 相机系统
 * 处理相机跟随、边界限制、平滑移动
 */

class CameraSystem {
    constructor(world, canvas) {
        this.world = world;
        this.canvas = canvas;
        this.priority = 70;
        this.enabled = true;
        
        // 相机状态
        this.x = 0;
        this.y = 0;
        this.zoom = 1;
        this.targetZoom = 1;
        this.rotation = 0;
        
        // 跟随目标
        this.target = null;
        this.smoothSpeed = 0.1;
        
        // 边界限制
        this.bounds = null; // { minX, maxX, minY, maxY }
        this.clampToBounds = true;
        
        // 震动效果
        this.shakeIntensity = 0;
        this.shakeDuration = 0;
        this.shakeTimer = 0;
        
        // 视口
        this.viewport = {
            width: canvas.width,
            height: canvas.height
        };
    }
    
    init() {
        // 监听事件
        this.world.on('roomEntered', (roomId) => {
            this.onRoomChange(roomId);
        });
    }
    
    update(dt) {
        // 更新目标位置
        if (this.target && this.target.active) {
            const transform = this.target.get(TransformComponent);
            if (transform) {
                this.updatePosition(transform.x, transform.y);
            }
        }
        
        // 更新震动
        if (this.shakeTimer > 0) {
            this.shakeTimer -= dt;
            this.updateShake();
        }
        
        // 更新缩放
        if (this.zoom !== this.targetZoom) {
            this.zoom += (this.targetZoom - this.zoom) * 0.1;
            if (Math.abs(this.zoom - this.targetZoom) < 0.001) {
                this.zoom = this.targetZoom;
            }
        }
    }
    
    /**
     * 更新相机位置
     */
    updatePosition(targetX, targetY) {
        // 平滑跟随
        const targetCameraX = targetX;
        const targetCameraY = targetY;
        
        this.x += (targetCameraX - this.x) * this.smoothSpeed;
        this.y += (targetCameraY - this.y) * this.smoothSpeed;
        
        // 应用边界限制
        if (this.clampToBounds && this.bounds) {
            const halfWidth = (this.viewport.width / 2) / this.zoom;
            const halfHeight = (this.viewport.height / 2) / this.zoom;
            
            this.x = Math.max(this.bounds.minX + halfWidth,
                    Math.min(this.bounds.maxX - halfWidth, this.x));
            this.y = Math.max(this.bounds.minY + halfHeight,
                    Math.min(this.bounds.maxY - halfHeight, this.y));
        }
    }
    
    /**
     * 更新震动效果
     */
    updateShake() {
        if (this.shakeTimer <= 0) {
            this.shakeIntensity = 0;
            return;
        }
        
        // 震动强度随时间衰减
        const progress = this.shakeTimer / this.shakeDuration;
        const currentIntensity = this.shakeIntensity * progress;
        
        const shakeX = (Math.random() - 0.5) * currentIntensity;
        const shakeY = (Math.random() - 0.5) * currentIntensity;
        
        this.x += shakeX;
        this.y += shakeY;
    }
    
    /**
     * 设置跟随目标
     */
    setTarget(entity) {
        this.target = entity;
    }
    
    /**
     * 设置位置
     */
    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }
    
    /**
     * 设置缩放
     */
    setZoom(zoom, smooth = true) {
        if (smooth) {
            this.targetZoom = zoom;
        } else {
            this.zoom = zoom;
            this.targetZoom = zoom;
        }
    }
    
    /**
     * 设置边界
     */
    setBounds(minX, minY, maxX, maxY) {
        this.bounds = { minX, minY, maxX, maxY };
    }
    
    /**
     * 清除边界
     */
    clearBounds() {
        this.bounds = null;
    }
    
    /**
     * 屏幕震动
     */
    shake(intensity, duration) {
        this.shakeIntensity = intensity;
        this.shakeDuration = duration;
        this.shakeTimer = duration;
    }
    
    /**
     * 轻微震动（攻击命中）
     */
    shakeLight() {
        this.shake(5, 0.1);
    }
    
    /**
     * 中等震动（受到伤害）
     */
    shakeMedium() {
        this.shake(10, 0.2);
    }
    
    /**
     * 强烈震动（爆炸、Boss战）
     */
    shakeHeavy() {
        this.shake(20, 0.5);
    }
    
    /**
     * 房间切换处理
     */
    onRoomChange(roomId) {
        // 获取房间系统
        const roomSystem = this.world.getSystem(RoomSystem);
        if (!roomSystem) return;
        
        const room = roomSystem.rooms.get(roomId);
        if (!room) return;
        
        // 设置相机边界为房间边界
        const cellSize = roomSystem.currentMap.config.cellSize;
        const padding = 100;
        
        this.setBounds(
            room.x - padding,
            room.y - padding,
            room.x + room.width * cellSize + padding,
            room.y + room.height * cellSize + padding
        );
    }
    
    /**
     * 世界坐标转屏幕坐标
     */
    worldToScreen(worldX, worldY) {
        return {
            x: (worldX - this.x) * this.zoom + this.viewport.width / 2,
            y: (worldY - this.y) * this.zoom + this.viewport.height / 2
        };
    }
    
    /**
     * 屏幕坐标转世界坐标
     */
    screenToWorld(screenX, screenY) {
        return {
            x: (screenX - this.viewport.width / 2) / this.zoom + this.x,
            y: (screenY - this.viewport.height / 2) / this.zoom + this.y
        };
    }
    
    /**
     * 获取视口边界（世界坐标）
     */
    getViewportBounds() {
        const halfWidth = (this.viewport.width / 2) / this.zoom;
        const halfHeight = (this.viewport.height / 2) / this.zoom;
        
        return {
            minX: this.x - halfWidth,
            maxX: this.x + halfWidth,
            minY: this.y - halfHeight,
            maxY: this.y + halfHeight
        };
    }
    
    /**
     * 检查点是否在视口内
     */
    isInViewport(worldX, worldY, padding = 0) {
        const bounds = this.getViewportBounds();
        return worldX >= bounds.minX - padding &&
               worldX <= bounds.maxX + padding &&
               worldY >= bounds.minY - padding &&
               worldY <= bounds.maxY + padding;
    }
    
    /**
     * 应用相机变换到 Canvas 上下文
     */
    applyTransform(ctx) {
        ctx.translate(this.viewport.width / 2, this.viewport.height / 2);
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-this.x, -this.y);
    }
    
    /**
     * 恢复 Canvas 上下文
     */
    restoreTransform(ctx) {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
    }
    
    destroy() {}
}

window.CameraSystem = CameraSystem;
