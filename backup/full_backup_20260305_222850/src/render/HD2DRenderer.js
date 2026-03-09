/**
 * HD2DRenderer - HD-2D效果渲染器
 * 整合：氛围、光源、移轴景深、脚底柔光、轮廓光、阴影、色调映射
 */
class HD2DRenderer {
    constructor(canvas, ctx) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.width = canvas.clientWidth || canvas.width || 960;
        this.height = canvas.clientHeight || canvas.height || 600;
        
        // 原有系统
        this.ambience = new AmbienceSystem(ctx, this.width, this.height);
        this.lighting = new CaveLightingSystem(ctx, this.width, this.height);
        
        // 新增HD-2D系统
        this.tiltShift = new TiltShiftSystem(ctx, this.width, this.height);
        this.roomBlur = new RoomBlurSystem(ctx);  // 房间景深模糊（固定位置）
        this.groundGlow = new GroundGlowSystem(ctx);
        this.backlight = new BacklightSystem(ctx);
        this.shadow = new ShadowSystem(ctx);
        this.colorGrading = new ColorGradingSystem(ctx);
    }
    
    update(dt, player, camera) {
        this.lighting.update(dt, player, camera);
        this.backlight.update(dt);
        this.ambience.update(dt, this.width, this.height);
    }
    
    render(ctx, player, camera) {
        // 1. 氛围（遮罩+孢子）
        this.ambience.render(ctx);
        
        // 2. 光源（水晶）
        if (player && camera) {
            this.lighting.render(ctx, player, camera);
        }
    }
    
    /**
     * 渲染玩家HD-2D效果（在玩家贴图之前调用）
     * @param {number} screenX - 玩家屏幕X坐标
     * @param {number} screenY - 玩家屏幕Y坐标
     */
    renderPlayerBacklight(screenX, screenY) {
        // 1. 阴影（最底层）
        this.shadow.render(screenX, screenY);
        
        // 2. 脚底柔光
        this.groundGlow.render(screenX, screenY);
        
        // 3. 背后轮廓光（在贴图后面）
        this.backlight.render(screenX, screenY, 32, 32);
    }
    
    /**
     * 渲染后处理效果（在所有实体渲染之后调用）
     */
    renderPostProcess(playerScreenX, playerScreenY) {
        // 1. 房间景深模糊（固定位置，三层同心圆）
        if (this.roomBlur) {
            this.roomBlur.render();
        }
        
        // 2. 玩家跟随暗角（移轴效果，中心清晰四周渐暗）
        this.renderPlayerVignette(playerScreenX, playerScreenY);
        
        // 3. 暖色调映射
        this.colorGrading.render();
    }
    
    /**
     * 玩家跟随效果：暗角 + 局部提亮
     */
    renderPlayerVignette(x, y) {
        const canvas = this.ctx.canvas;
        const w = (canvas.clientWidth || canvas.width || 900);
        const h = (canvas.clientHeight || canvas.height || 600);
        
        // 1. 角色周围局部提亮（减弱，避免冲淡贴图）
        const lightGradient = this.ctx.createRadialGradient(x, y, 0, x, y, 120);
        lightGradient.addColorStop(0, 'rgba(255, 240, 200, 0.12)');   // 中心暖白提亮（减弱）
        lightGradient.addColorStop(0.5, 'rgba(255, 220, 160, 0.06)'); // 中间过渡
        lightGradient.addColorStop(1, 'rgba(255, 200, 120, 0)');      // 边缘淡出
        
        this.ctx.save();
        this.ctx.globalCompositeOperation = 'screen';
        this.ctx.fillStyle = lightGradient;
        this.ctx.fillRect(0, 0, w, h);
        this.ctx.restore();
        
        // 2. 柔和暗角渐变（外圈变暗）
        const grad = this.ctx.createRadialGradient(x, y, 140, x, y, 350);
        grad.addColorStop(0, 'rgba(5, 8, 12, 0)');
        grad.addColorStop(0.5, 'rgba(5, 8, 12, 0)');
        grad.addColorStop(0.8, 'rgba(4, 7, 10, 0.15)');
        grad.addColorStop(1, 'rgba(3, 6, 9, 0.35)');
        
        this.ctx.fillStyle = grad;
        this.ctx.fillRect(0, 0, w, h);
    }

    /**
     * 设置房间尺寸（用于房间景深模糊）
     */
    setRoomSize(width, height) {
        if (this.roomBlur) {
            this.roomBlur.setRoomSize(width, height);
        }
    }
    
    /**
     * 渲染玩家HD2D效果（在玩家绘制前后调用）
     */
    renderPlayerEffects(x, y, drawCallback) {
        // 1. 阴影
        this.shadow.render(x, y);
        
        // 2. 脚底柔光
        this.groundGlow.render(x, y);
        
        // 3. 背后轮廓光
        this.backlight.render(x, y, 32, 32);
        
        // 4. 绘制玩家本体
        drawCallback();
    }
    
    /**
     * 批量渲染敌人阴影
     */
    renderEnemyShadows(enemies) {
        const entities = enemies.map(e => ({ x: e.x, y: e.y }));
        this.shadow.renderBatch(entities);
    }
    
    generateRoom(roomWidth, roomHeight, wallThickness) {
        this.lighting.generateCaveLights(roomWidth, roomHeight, wallThickness);
    }
    
    resize(w, h) {
        this.width = w;
        this.height = h;
        this.ambience.resize(w, h);
        this.lighting.resize(w, h);
        this.tiltShift.resize(w, h);
    }
    
    /**
     * 设置所有系统参数
     */
    setParams(params) {
        if (params.tiltShift) this.tiltShift.setParams(params.tiltShift);
        if (params.groundGlow) this.groundGlow.setParams(params.groundGlow);
        if (params.backlight) this.backlight.setParams(params.backlight);
        if (params.shadow) this.shadow.setParams(params.shadow);
        if (params.colorGrading) this.colorGrading.setParams(params.colorGrading);
    }
}

if (typeof module !== 'undefined') module.exports = HD2DRenderer;
