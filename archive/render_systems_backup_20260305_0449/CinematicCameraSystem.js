// ============================================================
// v0.24 - 电影化相机系统 (Cinematic Camera System)
// 八方旅人风格：戏剧性的镜头移动和构图
// ============================================================

export class CinematicCameraSystem {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        // 相机状态
        this.x = 0;
        this.y = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.zoom = 1;
        this.targetZoom = 1;
        
        // 平滑系数
        this.smoothness = 0.08;
        this.zoomSmoothness = 0.05;
        
        // 屏幕震动
        this.shakeIntensity = 0;
        this.shakeDecay = 0.9;
        
        // 倾斜效果（2.5D）
        this.tilt = 0; // 相机倾斜角度
        this.targetTilt = 0;
        
        // 视口边界
        this.bounds = { minX: 0, minY: 0, maxX: 2000, maxY: 1500 };
        
        this.time = 0;
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
    }
    
    setBounds(minX, minY, maxX, maxY) {
        this.bounds = { minX, minY, maxX, maxY };
    }
    
    /**
     * 相机震动
     */
    shake(intensity, duration = 0.5) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
    }
    
    /**
     * 聚焦到目标
     */
    focus(target, zoom = 1) {
        this.targetX = target.x;
        this.targetY = target.y;
        this.targetZoom = zoom;
    }
    
    /**
     * 平滑跟随目标
     */
    follow(target, deltaTime) {
        // 预测性跟随 - 看向玩家移动方向
        const lookAheadX = (target.vx || 0) * 0.3;
        const lookAheadY = (target.vy || 0) * 0.2;
        
        this.targetX = target.x + lookAheadX;
        this.targetY = target.y + lookAheadY;
        
        // 动态缩放 - 战斗时拉近，探索时拉远
        const isInCombat = target.inCombat || false;
        this.targetZoom = isInCombat ? 1.1 : 0.95;
    }
    
    update(dt, target) {
        this.time += dt;
        
        if (target) {
            this.follow(target, dt);
        }
        
        // 平滑移动
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        
        this.x += dx * this.smoothness;
        this.y += dy * this.smoothness;
        
        // 平滑缩放
        const dz = this.targetZoom - this.zoom;
        this.zoom += dz * this.zoomSmoothness;
        
        // 应用边界
        this.x = Math.max(this.bounds.minX + this.width / 2 / this.zoom,
                         Math.min(this.bounds.maxX - this.width / 2 / this.zoom, this.x));
        this.y = Math.max(this.bounds.minY + this.height / 2 / this.zoom,
                         Math.min(this.bounds.maxY - this.height / 2 / this.zoom, this.y));
        
        // 震动衰减
        this.shakeIntensity *= this.shakeDecay;
        if (this.shakeIntensity < 0.5) this.shakeIntensity = 0;
    }
    
    /**
     * 应用相机变换
     */
    apply(ctx) {
        ctx.save();
        
        // 中心点
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        
        // 震动偏移
        let shakeX = 0, shakeY = 0;
        if (this.shakeIntensity > 0) {
            shakeX = (Math.random() - 0.5) * this.shakeIntensity;
            shakeY = (Math.random() - 0.5) * this.shakeIntensity;
        }
        
        // 应用变换
        ctx.translate(centerX + shakeX, centerY + shakeY);
        ctx.scale(this.zoom, this.zoom);
        ctx.translate(-this.x, -this.y);
    }
    
    restore(ctx) {
        ctx.restore();
    }
    
    /**
     * 世界坐标转屏幕坐标
     */
    worldToScreen(worldX, worldY) {
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        
        return {
            x: centerX + (worldX - this.x) * this.zoom,
            y: centerY + (worldY - this.y) * this.zoom
        };
    }
    
    /**
     * 屏幕坐标转世界坐标
     */
    screenToWorld(screenX, screenY) {
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        
        return {
            x: this.x + (screenX - centerX) / this.zoom,
            y: this.y + (screenY - centerY) / this.zoom
        };
    }
    
    /**
     * 检查是否在视野内
     */
    isVisible(x, y, radius = 0) {
        const screen = this.worldToScreen(x, y);
        return screen.x + radius >= 0 &&
               screen.x - radius <= this.width &&
               screen.y + radius >= 0 &&
               screen.y - radius <= this.height;
    }
    
    /**
     * 获取视野边界
     */
    getViewportBounds() {
        const halfWidth = this.width / 2 / this.zoom;
        const halfHeight = this.height / 2 / this.zoom;
        
        return {
            minX: this.x - halfWidth,
            maxX: this.x + halfWidth,
            minY: this.y - halfHeight,
            maxY: this.y + halfHeight
        };
    }
}
