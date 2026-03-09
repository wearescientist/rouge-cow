// ============================================================
// v0.24-r9 - 风吹草动系统 (Wind Sway System)
// 八方旅人风格：植被、旗帜、装饰物的风动效果
// ============================================================

export class WindSwaySystem {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        // 风参数
        this.wind = {
            direction: 1, // 1 = 向右, -1 = 向左
            strength: 0.5,
            gustiness: 0.3,
            turbulence: 0.2
        };
        
        // 可摇摆物体
        this.swayObjects = [];
        this.maxObjects = 50;
        
        // 植被图案
        this.vegetationTypes = {
            grass: { height: 12, width: 4, color: '#5c8a6b', segments: 3 },
            tallGrass: { height: 20, width: 6, color: '#4a7c59', segments: 4 },
            reed: { height: 30, width: 3, color: '#7b9c6b', segments: 5 },
            fern: { height: 18, width: 8, color: '#3d6b4d', segments: 4 },
            mushroom: { height: 10, width: 8, color: '#8b4513', capColor: '#d2691e' }
        };
        
        this.time = 0;
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
    }
    
    /**
     * 为房间生成植被
     */
    generateRoomVegetation(room, floor) {
        this.swayObjects = [];
        
        const types = this.getFloorVegetation(floor);
        const count = 20 + Math.floor(Math.random() * 30);
        
        for (let i = 0; i < count; i++) {
            const typeKey = types[Math.floor(Math.random() * types.length)];
            const type = this.vegetationTypes[typeKey];
            
            // 在房间边缘生成
            const edge = Math.floor(Math.random() * 4);
            let x, y;
            const margin = 60;
            
            switch(edge) {
                case 0: // 上边缘
                    x = room.x + margin + Math.random() * (room.width - margin * 2);
                    y = room.y + margin + Math.random() * 40;
                    break;
                case 1: // 右边缘
                    x = room.x + room.width - margin - Math.random() * 40;
                    y = room.y + margin + Math.random() * (room.height - margin * 2);
                    break;
                case 2: // 下边缘
                    x = room.x + margin + Math.random() * (room.width - margin * 2);
                    y = room.y + room.height - margin - Math.random() * 40;
                    break;
                case 3: // 左边缘
                    x = room.x + margin + Math.random() * 40;
                    y = room.y + margin + Math.random() * (room.height - margin * 2);
                    break;
            }
            
            this.swayObjects.push({
                x, y,
                type: typeKey,
                height: type.height * (0.8 + Math.random() * 0.4),
                width: type.width,
                color: type.color,
                capColor: type.capColor,
                segments: type.segments,
                phase: Math.random() * Math.PI * 2,
                swaySpeed: 1 + Math.random() * 2,
                swayAmount: 0.3 + Math.random() * 0.4
            });
        }
    }
    
    getFloorVegetation(floor) {
        switch(floor) {
            case 1: return ['grass', 'tallGrass', 'mushroom'];
            case 2: return ['grass', 'tallGrass', 'reed', 'fern'];
            case 3: return ['fern', 'tallGrass'];
            case 4: return ['reed'];
            case 5: return ['grass', 'fern'];
            case 6: return ['tallGrass'];
            default: return ['grass'];
        }
    }
    
    update(dt) {
        this.time += dt;
        
        // 更新风参数
        this.wind.strength = 0.3 + Math.sin(this.time * 0.5) * 0.2 + Math.sin(this.time * 1.5) * 0.1;
        this.wind.direction = Math.sin(this.time * 0.3) > 0 ? 1 : -1;
    }
    
    /**
     * 绘制所有摇摆物体
     */
    drawSwayObjects(ctx, camera) {
        ctx.save();
        
        this.swayObjects.forEach(obj => {
            // 根据距离相机的距离排序（远的先画）
            const type = this.vegetationTypes[obj.type];
            
            if (obj.type === 'mushroom') {
                this.drawMushroom(ctx, obj, camera);
            } else {
                this.drawSwayingPlant(ctx, obj, camera, type);
            }
        });
        
        ctx.restore();
    }
    
    drawSwayingPlant(ctx, obj, camera, type) {
        const pos = camera.worldToScreen(obj.x, obj.y);
        if (!isFinite(pos.x) || !isFinite(pos.y)) return;
        
        const h = (obj.height || 10) * (camera.zoom || 1);
        const w = (obj.width || 5) * (camera.zoom || 1);
        if (!isFinite(h) || !isFinite(w) || h <= 0 || w <= 0) return;
        const segmentH = h / (obj.segments || 3);
        
        // 计算风的影响
        const windForce = this.wind.strength * this.wind.direction * obj.swayAmount;
        const time = this.time * obj.swaySpeed + obj.phase;
        
        ctx.strokeStyle = obj.color;
        ctx.lineWidth = Math.max(1, w * 0.5);
        ctx.lineCap = 'round';
        
        // 绘制分段摇摆的茎
        let currentX = pos.x;
        let currentY = pos.y;
        
        ctx.beginPath();
        ctx.moveTo(currentX, currentY);
        
        for (let i = 0; i < obj.segments; i++) {
            // 每段受风影响递增
            const sway = Math.sin(time + i * 0.5) * windForce * (i + 1) * 2 * camera.zoom;
            currentX += sway;
            currentY -= segmentH;
            ctx.lineTo(currentX, currentY);
        }
        
        ctx.stroke();
        
        // 绘制叶子/顶部
        ctx.fillStyle = obj.color;
        const leafSize = w * 1.5;
        
        // 左叶子
        ctx.beginPath();
        ctx.ellipse(currentX - leafSize, currentY, leafSize, leafSize * 0.6, 
                    -0.3 + Math.sin(time) * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // 右叶子
        ctx.beginPath();
        ctx.ellipse(currentX + leafSize, currentY, leafSize, leafSize * 0.6, 
                    0.3 - Math.sin(time) * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // 顶部
        ctx.beginPath();
        ctx.ellipse(currentX, currentY - leafSize * 0.5, leafSize * 0.8, leafSize, 
                    0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawMushroom(ctx, obj, camera) {
        const pos = camera.worldToScreen(obj.x, obj.y);
        if (!isFinite(pos.x) || !isFinite(pos.y)) return;
        
        const h = (obj.height || 10) * (camera.zoom || 1);
        const w = (obj.width || 8) * (camera.zoom || 1);
        if (!isFinite(h) || !isFinite(w) || h <= 0 || w <= 0) return;
        
        // 轻微摇摆
        const sway = Math.sin(this.time * obj.swaySpeed + obj.phase) * 2 * camera.zoom;
        
        // 茎
        ctx.fillStyle = obj.color;
        ctx.fillRect(pos.x - w * 0.3 + sway * 0.3, pos.y - h, w * 0.6, h);
        
        // 帽子
        ctx.fillStyle = obj.capColor;
        ctx.beginPath();
        ctx.arc(pos.x + sway, pos.y - h, w, Math.PI, 0);
        ctx.fill();
        
        // 帽子高光
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.beginPath();
        ctx.ellipse(pos.x + sway - w * 0.3, pos.y - h - w * 0.3, w * 0.3, w * 0.2, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // 斑点
        ctx.fillStyle = 'rgba(255,255,255,0.6)';
        ctx.beginPath();
        ctx.arc(pos.x + sway + w * 0.4, pos.y - h + w * 0.2, w * 0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(pos.x + sway - w * 0.5, pos.y - h + w * 0.4, w * 0.15, 0, Math.PI * 2);
        ctx.fill();
    }
    
    /**
     * 绘制风中飘落的叶子/花瓣
     */
    drawFallingParticles(ctx, camera, floor) {
        const colors = this.getFallingColors(floor);
        const count = 5;
        
        ctx.save();
        
        for (let i = 0; i < count; i++) {
            const t = (this.time * 0.5 + i / count) % 1;
            const startX = this.width * 0.2 + i * this.width * 0.15;
            const x = startX + Math.sin(this.time + i) * 30 + this.wind.direction * t * 50;
            const y = -20 + t * (this.height + 40);
            
            const rotation = this.time * 2 + i;
            const size = 3 + Math.sin(i) * 2;
            
            ctx.save();
            ctx.translate(x, y);
            ctx.rotate(rotation);
            ctx.fillStyle = colors[i % colors.length];
            ctx.globalAlpha = 0.6;
            
            // 绘制叶子形状
            ctx.beginPath();
            ctx.ellipse(0, 0, size, size * 0.6, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        }
        
        ctx.restore();
    }
    
    getFallingColors(floor) {
        switch(floor) {
            case 1: return ['#5c8a6b', '#7fbc8f', '#4a6b59'];
            case 2: return ['#8fbc8f', '#6b8e6b', '#aaddaa'];
            case 3: return ['#ff79c6', '#ffb6c1', '#ff99cc'];
            case 4: return ['#ff6b35', '#ffaa66', '#ff8855'];
            case 5: return ['#ffd93d', '#ffee88', '#ddcc55'];
            case 6: return ['#dc143c', '#8b0000', '#ff4444'];
            default: return ['#ffffff'];
        }
    }
}
