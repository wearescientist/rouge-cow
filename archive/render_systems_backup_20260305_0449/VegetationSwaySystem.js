// ============================================================
// v0.23-r28 - 植被摆动系统 (Vegetation Sway System)
// HD-2D风格：风吹草动、植物摆动、树叶飘落
// ============================================================

export class VegetationSwaySystem {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        // 风场参数
        this.wind = {
            direction: 0,  // 风向角度
            strength: 1.0,
            turbulence: 0.3,
            gusts: true,
            baseSpeed: 2.0
        };
        
        // 植被实例
        this.vegetation = [];
        this.maxInstances = 100;
        
        // 飘落物
        this.fallingLeaves = [];
        this.maxLeaves = 50;
        
        // 草地波浪
        this.grassWaves = [];
        
        this.time = 0;
        this.initLeaves();
    }
    
    initLeaves() {
        for (let i = 0; i < this.maxLeaves; i++) {
            this.fallingLeaves.push({
                x: 0, y: 0,
                vx: 0, vy: 0,
                rotation: 0,
                rotSpeed: 0,
                type: 'leaf',
                color: '#88aa44',
                life: 0,
                active: false
            });
        }
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
    }
    
    update(dt, floor, camera) {
        this.time += dt;
        
        // 更新风场
        this.updateWind(dt, floor);
        
        // 更新植被摆动
        this.updateVegetation(dt);
        
        // 更新飘落物
        this.updateFallingLeaves(dt, camera);
        
        // 生成环境落叶
        this.spawnAmbientLeaves(floor, camera);
    }
    
    updateWind(dt, floor) {
        // 基础风向变化
        this.wind.direction += Math.sin(this.time * 0.1) * 0.01 * dt;
        
        // 阵风
        if (this.wind.gusts) {
            const gustPhase = this.time * 0.5;
            this.wind.currentStrength = this.wind.strength * 
                (0.7 + Math.sin(gustPhase) * 0.3 + Math.sin(gustPhase * 2.3) * 0.1);
        } else {
            this.wind.currentStrength = this.wind.strength;
        }
        
        // 楼层特定风力
        switch(floor) {
            case 1: // 菌丝 - 微风
                this.wind.strength = 0.5;
                break;
            case 2: // 温室 - 轻风
                this.wind.strength = 0.8;
                break;
            case 3: // 神经 - 诡异风向
                this.wind.strength = 0.6;
                this.wind.turbulence = 0.8;
                break;
            case 4: // 熔炉 - 热浪
                this.wind.strength = 1.2;
                this.wind.direction = Math.PI / 2;  // 向上
                break;
            case 5: // 庭院 - 秋风
                this.wind.strength = 1.5;
                break;
            case 6: // 千根 - 阴风
                this.wind.strength = 0.4;
                break;
        }
    }
    
    updateVegetation(dt) {
        this.vegetation.forEach(plant => {
            // 计算风的影响
            const windForce = this.wind.currentStrength * 
                Math.cos(this.wind.direction - plant.angle) * 
                (0.5 + Math.random() * this.wind.turbulence);
            
            // 弹性摆动
            const stiffness = plant.stiffness || 0.5;
            const targetSway = windForce * 0.3;
            
            plant.sway += (targetSway - plant.sway) * stiffness * dt * 5;
            
            // 添加随机扰动
            plant.sway += Math.sin(this.time * 3 + plant.x * 0.1) * 0.01 * this.wind.turbulence;
        });
    }
    
    updateFallingLeaves(dt, camera) {
        const bounds = camera.getViewportBounds ? camera.getViewportBounds() : 
                      { minX: 0, maxX: this.width, minY: 0, maxY: this.height };
        
        this.fallingLeaves.forEach(leaf => {
            if (!leaf.active) return;
            
            // 风力影响
            const windX = Math.cos(this.wind.direction) * this.wind.currentStrength * 20;
            const windY = Math.sin(this.wind.direction) * this.wind.currentStrength * 10;
            
            leaf.vx += windX * dt;
            leaf.vy += (20 + windY) * dt;  // 重力+风力
            
            // 湍流
            leaf.vx += Math.sin(this.time * 2 + leaf.y * 0.05) * 5 * dt;
            
            // 旋转
            leaf.rotation += leaf.rotSpeed * dt;
            leaf.rotSpeed += (Math.sin(this.time + leaf.x) * 2 - leaf.rotSpeed) * dt;
            
            // 更新位置
            leaf.x += leaf.vx * dt;
            leaf.y += leaf.vy * dt;
            
            // 生命周期
            leaf.life -= dt;
            if (leaf.life <= 0 || leaf.y > bounds.maxY + 50) {
                leaf.active = false;
            }
        });
    }
    
    spawnAmbientLeaves(floor, camera) {
        if (!camera) return;
        
        const bounds = camera.getViewportBounds ? camera.getViewportBounds() : 
                      { minX: 0, maxX: this.width, minY: 0, maxY: this.height };
        
        // 根据楼层生成落叶
        let spawnRate = 0;
        let leafColors = [];
        
        switch(floor) {
            case 2: // 温室 - 偶尔掉落花瓣
                spawnRate = 0.3;
                leafColors = ['#ffcccc', '#ffddcc', '#ffeeee'];
                break;
            case 5: // 庭院 - 落叶纷飞
                spawnRate = 2.0;
                leafColors = ['#d4a574', '#c49464', '#e4b584', '#8b4513'];
                break;
            case 6: // 千根 - 飘落血滴
                spawnRate = 0.5;
                leafColors = ['#8b0000', '#660000', '#aa0000'];
                break;
        }
        
        if (Math.random() < spawnRate * 0.016) {
            const leaf = this.fallingLeaves.find(l => !l.active);
            if (leaf) {
                leaf.x = bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
                leaf.y = bounds.minY - 20;
                leaf.vx = 0;
                leaf.vy = 0;
                leaf.rotation = Math.random() * Math.PI * 2;
                leaf.rotSpeed = (Math.random() - 0.5) * 4;
                leaf.color = leafColors[Math.floor(Math.random() * leafColors.length)];
                leaf.life = 5 + Math.random() * 3;
                leaf.active = true;
            }
        }
    }
    
    addVegetation(x, y, type, height, stiffness = 0.5) {
        if (this.vegetation.length >= this.maxInstances) return;
        
        this.vegetation.push({
            x, y, type, height, stiffness,
            angle: 0,
            sway: 0,
            phase: Math.random() * Math.PI * 2
        });
    }
    
    draw(ctx, camera) {
        // 绘制植被
        this.drawVegetation(ctx, camera);
        
        // 绘制飘落物
        this.drawFallingLeaves(ctx, camera);
        
        // 绘制风的效果
        this.drawWindEffect(ctx);
    }
    
    drawVegetation(ctx, camera) {
        ctx.save();
        
        this.vegetation.forEach(plant => {
            const pos = camera.worldToScreen(plant.x, plant.y);
            const screenHeight = plant.height * camera.zoom;
            
            // 保存上下文用于旋转
            ctx.save();
            ctx.translate(pos.x, pos.y);
            ctx.rotate(plant.sway);
            
            switch(plant.type) {
                case 'grass':
                    this.drawGrass(ctx, 0, 0, screenHeight, plant.phase);
                    break;
                case 'flower':
                    this.drawFlower(ctx, 0, 0, screenHeight);
                    break;
                case 'reed':
                    this.drawReed(ctx, 0, 0, screenHeight);
                    break;
                case 'vine':
                    this.drawVine(ctx, 0, 0, screenHeight);
                    break;
            }
            
            ctx.restore();
        });
        
        ctx.restore();
    }
    
    drawGrass(ctx, x, y, height, phase) {
        const sway = Math.sin(this.time * 2 + phase) * 0.1;
        
        ctx.strokeStyle = '#5c8a6b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(
            x + sway * height * 0.5, y - height * 0.5,
            x + sway * height, y - height
        );
        ctx.stroke();
    }
    
    drawFlower(ctx, x, y, height) {
        // 茎
        ctx.strokeStyle = '#6b8e6b';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y - height);
        ctx.stroke();
        
        // 花朵
        ctx.fillStyle = '#ff69b4';
        ctx.beginPath();
        ctx.arc(x, y - height, 5, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawReed(ctx, x, y, height) {
        ctx.strokeStyle = '#8b7355';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y - height);
        ctx.stroke();
        
        // 芦苇头
        ctx.fillStyle = '#d4c4a4';
        ctx.fillRect(x - 2, y - height - 10, 4, 15);
    }
    
    drawVine(ctx, x, y, height) {
        ctx.strokeStyle = '#4a7c59';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y);
        
        for (let i = 0; i < 5; i++) {
            const py = y - (i / 4) * height;
            const px = x + Math.sin(this.time + i) * 5;
            ctx.lineTo(px, py);
        }
        ctx.stroke();
    }
    
    drawFallingLeaves(ctx, camera) {
        ctx.save();
        
        this.fallingLeaves.forEach(leaf => {
            if (!leaf.active) return;
            
            const pos = camera.worldToScreen(leaf.x, leaf.y);
            
            ctx.save();
            ctx.translate(pos.x, pos.y);
            ctx.rotate(leaf.rotation);
            
            ctx.fillStyle = leaf.color;
            ctx.globalAlpha = Math.min(1, leaf.life / 2);
            
            // 绘制叶子形状
            ctx.beginPath();
            ctx.ellipse(0, 0, 4, 8, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.restore();
        });
        
        ctx.restore();
    }
    
    drawWindEffect(ctx) {
        if (this.wind.currentStrength < 0.8) return;
        
        ctx.save();
        ctx.globalAlpha = 0.1 * this.wind.currentStrength;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        
        // 绘制风的流动线
        for (let i = 0; i < 10; i++) {
            const y = (i / 10) * this.height;
            const offset = (this.time * 50 + i * 100) % (this.width + 200) - 100;
            
            ctx.beginPath();
            ctx.moveTo(offset, y);
            ctx.lineTo(offset + 50, y);
            ctx.stroke();
        }
        
        ctx.restore();
    }
}
