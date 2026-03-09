// ============================================================
// v0.23-fix - 动态地板系统 (Animated Floor System)
// 让地板贴图产生流动/脉动效果，不替换贴图而是叠加效果
// ============================================================

export class AnimatedFloorSystem {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        this.time = 0;
        
        // 地板效果配置
        this.floorEffects = {
            water: {    // 菌丝区湿润地面
                speed: 0.5,
                scale: 50,
                opacity: 0.1,
                color: '#4488aa'
            },
            lava: {     // 熔炉岩浆裂纹
                speed: 1.0,
                scale: 30,
                opacity: 0.2,
                color: '#ff4400',
                pulse: true
            },
            pulse: {    // 千根之心脉动
                speed: 2.0,
                scale: 100,
                opacity: 0.15,
                color: '#8b0000',
                heartbeat: true
            }
        };
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
    }
    
    update(dt) {
        this.time += dt;
    }
    
    /**
     * 绘制地板效果（叠加在现有地板上）
     */
    drawFloorEffect(ctx, width, height, floor) {
        const config = this.getFloorConfig(floor);
        if (!config) return;
        
        ctx.save();
        ctx.globalAlpha = config.opacity;
        
        if (floor === 1) {
            // 菌丝区 - 湿润反光
            this.drawWaterEffect(ctx, width, height, config);
        } else if (floor === 4) {
            // 熔炉 - 岩浆裂纹发光
            this.drawLavaEffect(ctx, width, height, config);
        } else if (floor === 6) {
            // 千根之心 - 脉动
            this.drawPulseEffect(ctx, width, height, config);
        }
        
        ctx.restore();
    }
    
    drawWaterEffect(ctx, width, height, config) {
        // 简单的波纹网格
        const gridSize = config.scale;
        const offsetX = Math.sin(this.time * config.speed) * 10;
        const offsetY = Math.cos(this.time * config.speed * 0.7) * 10;
        
        ctx.strokeStyle = config.color;
        ctx.lineWidth = 1;
        
        // 绘制流动线条
        for (let x = offsetX % gridSize; x < width; x += gridSize) {
            ctx.beginPath();
            for (let y = 0; y < height; y += 10) {
                const wave = Math.sin((y + this.time * 20) * 0.02) * 5;
                if (y === 0) ctx.moveTo(x + wave, y);
                else ctx.lineTo(x + wave, y);
            }
            ctx.stroke();
        }
    }
    
    drawLavaEffect(ctx, width, height, config) {
        // 岩浆裂纹 - 随机亮线
        ctx.strokeStyle = config.color;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 10;
        ctx.shadowColor = config.color;
        
        const cracks = 5;
        for (let i = 0; i < cracks; i++) {
            const baseX = (i / cracks) * width + Math.sin(this.time + i) * 50;
            const brightness = 0.5 + Math.sin(this.time * 2 + i) * 0.5;
            ctx.globalAlpha = config.opacity * brightness;
            
            ctx.beginPath();
            let x = baseX;
            let y = 0;
            ctx.moveTo(x, y);
            
            while (y < height) {
                y += 20 + Math.random() * 30;
                x = baseX + Math.sin(y * 0.01 + this.time) * 30;
                ctx.lineTo(x, y);
            }
            ctx.stroke();
        }
        
        ctx.shadowBlur = 0;
    }
    
    drawPulseEffect(ctx, width, height, config) {
        // 心跳脉动 - 中心向外扩散的圆
        const centerX = width / 2;
        const centerY = height / 2;
        
        // 心跳节奏
        const heartbeat = Math.pow(Math.sin(this.time * 3), 4);
        
        // 多层扩散圆
        for (let i = 0; i < 3; i++) {
            const radius = (this.time * 30 + i * 100) % 300;
            const alpha = (1 - radius / 300) * heartbeat * config.opacity;
            
            ctx.strokeStyle = config.color;
            ctx.lineWidth = 3;
            ctx.globalAlpha = alpha;
            
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // 屏幕边缘暗角随心跳
        const gradient = ctx.createRadialGradient(
            centerX, centerY, height * 0.3,
            centerX, centerY, height * 0.8
        );
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, `rgba(139, 0, 0, ${heartbeat * 0.3})`);
        
        ctx.fillStyle = gradient;
        ctx.globalAlpha = 1;
        ctx.fillRect(0, 0, width, height);
    }
    
    getFloorConfig(floor) {
        switch(floor) {
            case 1: return this.floorEffects.water;
            case 4: return this.floorEffects.lava;
            case 6: return this.floorEffects.pulse;
            default: return null;
        }
    }
    
    /**
     * 绘制地板反光（角色脚下）
     */
    drawFloorReflection(ctx, x, y, radius, floor) {
        if (floor !== 1 && floor !== 4) return; // 只有湿润/光滑地板有反射
        
        ctx.save();
        ctx.globalAlpha = 0.1;
        ctx.fillStyle = floor === 4 ? '#ff4400' : '#4488aa';
        
        // 简单的椭圆倒影
        ctx.beginPath();
        ctx.ellipse(x, y + radius * 0.8, radius * 0.8, radius * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}
