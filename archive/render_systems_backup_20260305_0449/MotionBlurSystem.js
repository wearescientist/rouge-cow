// ============================================================
// v0.23-r21 - 运动模糊系统 (Motion Blur System)
// HD-2D风格：快速移动时的速度线、拖影、动态模糊
// ============================================================

export class MotionBlurSystem {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        // 运动历史缓冲区
        this.historyBuffer = [];
        this.maxHistoryFrames = 4;
        
        // 速度贴图
        this.velocityMap = document.createElement('canvas');
        this.velocityMap.width = Math.floor(width / 4);
        this.velocityMap.height = Math.floor(height / 4);
        this.vmCtx = this.velocityMap.getContext('2d');
        
        // 运动模糊强度
        this.blurStrength = 0.5;
        this.minVelocity = 50;  // 最小触发模糊的速度
        
        // 速度追踪
        this.trackedObjects = new Map();
        
        this.time = 0;
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.velocityMap.width = Math.floor(width / 4);
        this.velocityMap.height = Math.floor(height / 4);
    }
    
    update(dt, camera, player) {
        this.time += dt;
        
        // 追踪高速移动的对象
        if (player) {
            const velocity = Math.sqrt(player.vx ** 2 + player.vy ** 2);
            
            if (velocity > this.minVelocity) {
                this.trackedObjects.set('player', {
                    x: player.x,
                    y: player.y,
                    vx: player.vx,
                    vy: player.vy,
                    speed: velocity
                });
            } else {
                this.trackedObjects.delete('player');
            }
        }
        
        // 更新历史缓冲区
        this.updateHistory();
    }
    
    updateHistory() {
        // 移除旧帧
        while (this.historyBuffer.length >= this.maxHistoryFrames) {
            this.historyBuffer.shift();
        }
    }
    
    /**
     * 添加当前帧到历史
     */
    addFrame(canvas) {
        const frame = document.createElement('canvas');
        frame.width = this.velocityMap.width;
        frame.height = this.velocityMap.height;
        const ctx = frame.getContext('2d');
        ctx.drawImage(canvas, 0, 0, frame.width, frame.height);
        
        this.historyBuffer.push({
            canvas: frame,
            time: this.time
        });
    }
    
    /**
     * 应用运动模糊
     */
    applyMotionBlur(ctx, width, height, camera) {
        if (this.trackedObjects.size === 0 || this.historyBuffer.length < 2) {
            return;
        }
        
        ctx.save();
        
        // 对每个高速对象应用方向模糊
        this.trackedObjects.forEach((obj, id) => {
            this.drawDirectionalBlur(ctx, obj, camera, width, height);
        });
        
        ctx.restore();
    }
    
    drawDirectionalBlur(ctx, obj, camera, width, height) {
        const pos = camera.worldToScreen(obj.x, obj.y);
        const speed = Math.min(obj.speed / 500, 1);  // 归一化速度
        
        // 计算模糊方向
        const angle = Math.atan2(obj.vy, obj.vx);
        const blurLength = speed * 30 * this.blurStrength;
        
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = speed * 0.3;
        
        // 绘制速度线
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        
        const numLines = 5;
        for (let i = 0; i < numLines; i++) {
            const offset = (i - numLines / 2) * 10;
            const startX = pos.x - Math.cos(angle) * blurLength + Math.cos(angle + Math.PI / 2) * offset;
            const startY = pos.y - Math.sin(angle) * blurLength + Math.sin(angle + Math.PI / 2) * offset;
            const endX = pos.x + Math.cos(angle) * blurLength * 0.5 + Math.cos(angle + Math.PI / 2) * offset;
            const endY = pos.y + Math.sin(angle) * blurLength * 0.5 + Math.sin(angle + Math.PI / 2) * offset;
            
            const gradient = ctx.createLinearGradient(startX, startY, endX, endY);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
            gradient.addColorStop(0.5, `rgba(255, 255, 255, ${speed * 0.5})`);
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.strokeStyle = gradient;
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    /**
     * 绘制速度模糊拖影
     */
    drawSpeedStreaks(ctx, entity, camera, color = '#ffffff') {
        const velocity = Math.sqrt(entity.vx ** 2 + entity.vy ** 2);
        if (velocity < this.minVelocity) return;
        
        const pos = camera.worldToScreen(entity.x, entity.y);
        const speed = velocity / 500;
        const angle = Math.atan2(entity.vy, entity.vx);
        
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        
        // 绘制拖影
        const streakCount = 3;
        for (let i = 0; i < streakCount; i++) {
            const alpha = speed * (0.3 - i * 0.1);
            const offset = (i + 1) * 15;
            
            const x = pos.x - Math.cos(angle) * offset;
            const y = pos.y - Math.sin(angle) * offset;
            
            ctx.globalAlpha = alpha;
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, 5 - i, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    /**
     * 应用相机运动模糊
     */
    applyCameraMotionBlur(ctx, camera, width, height) {
        if (!camera.lastX || !camera.lastY) {
            camera.lastX = camera.x;
            camera.lastY = camera.y;
            return;
        }
        
        const dx = camera.x - camera.lastX;
        const dy = camera.y - camera.lastY;
        const cameraSpeed = Math.sqrt(dx * dx + dy * dy);
        
        if (cameraSpeed < 1) {
            camera.lastX = camera.x;
            camera.lastY = camera.y;
            return;
        }
        
        // 相机移动时的径向模糊
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = Math.min(cameraSpeed * 0.01, 0.3);
        
        const centerX = width / 2;
        const centerY = height / 2;
        
        // 径向速度线
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const length = 50 + Math.random() * 50;
            
            const x1 = centerX + Math.cos(angle) * 100;
            const y1 = centerY + Math.sin(angle) * 100;
            const x2 = centerX + Math.cos(angle) * (100 + length);
            const y2 = centerY + Math.sin(angle) * (100 + length);
            
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.stroke();
        }
        
        ctx.restore();
        
        camera.lastX = camera.x;
        camera.lastY = camera.y;
    }
    
    /**
     * 绘制冲击波效果（用于冲刺/撞击）
     */
    drawShockwave(ctx, x, y, radius, intensity = 1) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        
        const rings = 3;
        for (let i = 0; i < rings; i++) {
            const r = radius * (0.5 + i * 0.3);
            const alpha = intensity * (0.5 - i * 0.15);
            
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = 3 - i;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    /**
     * 绘制残影（多重残像）
     */
    drawAfterImages(ctx, entity, camera, count = 3) {
        if (!entity.afterImageHistory) {
            entity.afterImageHistory = [];
        }
        
        // 添加当前位置到历史
        entity.afterImageHistory.push({
            x: entity.x,
            y: entity.y,
            time: this.time
        });
        
        // 只保留最近的记录
        while (entity.afterImageHistory.length > count) {
            entity.afterImageHistory.shift();
        }
        
        // 绘制残影
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        
        entity.afterImageHistory.forEach((pos, index) => {
            const alpha = (index / count) * 0.3;
            const screenPos = camera.worldToScreen(pos.x, pos.y);
            
            ctx.globalAlpha = alpha;
            ctx.fillStyle = entity.color || '#ffffff';
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, 10 * (index / count), 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.restore();
    }
}
