// ============================================================
// v0.23-r17 - 动态天气系统 (Weather System)
// HD-2D风格：雨、雪、雷暴、沙尘暴等动态天气效果
// ============================================================

export class WeatherSystem {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        this.time = 0;
        this.currentWeather = 'clear';  // clear, rain, snow, storm, sandstorm
        this.intensity = 0.5;
        
        // 天气粒子
        this.particles = [];
        this.maxParticles = 300;
        
        // 闪电效果
        this.lightning = {
            active: false,
            timer: 0,
            duration: 0.2,
            interval: 5
        };
        
        // 天气配置
        this.weatherConfig = {
            rain: {
                particleCount: 200,
                fallSpeed: 400,
                wind: -50,
                color: '#88aacc',
                opacity: 0.6,
                sound: true
            },
            snow: {
                particleCount: 150,
                fallSpeed: 80,
                wind: -20,
                color: '#ffffff',
                opacity: 0.8,
                sway: true
            },
            storm: {
                particleCount: 300,
                fallSpeed: 600,
                wind: -100,
                color: '#6688aa',
                opacity: 0.7,
                lightning: true
            },
            sandstorm: {
                particleCount: 250,
                fallSpeed: 200,
                wind: 300,
                color: '#d4a574',
                opacity: 0.5,
                horizontal: true
            }
        };
        
        this.initParticles();
    }
    
    initParticles() {
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push({
                x: 0, y: 0,
                vx: 0, vy: 0,
                life: 0,
                active: false,
                size: 2,
                type: 'rain'
            });
        }
    }
    
    setWeather(type, intensity = 0.5) {
        this.currentWeather = type;
        this.intensity = intensity;
        
        // 清除旧粒子
        if (type === 'clear') {
            this.particles.forEach(p => p.active = false);
        }
    }
    
    update(dt, camera, floor) {
        this.time += dt;
        
        if (this.currentWeather === 'clear') return;
        
        const config = this.weatherConfig[this.currentWeather];
        if (!config) return;
        
        // 闪电逻辑
        if (config.lightning && this.currentWeather === 'storm') {
            if (!this.lightning.active) {
                this.lightning.timer += dt;
                if (this.lightning.timer > this.lightning.interval + Math.random() * 3) {
                    this.lightning.active = true;
                    this.lightning.timer = 0;
                    this.lightning.duration = 0.1 + Math.random() * 0.15;
                }
            } else {
                this.lightning.timer += dt;
                if (this.lightning.timer > this.lightning.duration) {
                    this.lightning.active = false;
                    this.lightning.timer = 0;
                    this.lightning.interval = 2 + Math.random() * 4;
                }
            }
        }
        
        // 更新粒子
        this.particles.forEach(p => {
            if (p.active) {
                // 物理更新
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                
                // 雪的摆动
                if (config.sway && p.type === 'snow') {
                    p.x += Math.sin(this.time * 2 + p.y * 0.01) * 20 * dt;
                }
                
                // 检查是否出界
                const bounds = camera.getViewportBounds ? camera.getViewportBounds() : 
                              { minX: 0, maxX: this.width, minY: 0, maxY: this.height };
                
                if (p.y > bounds.maxY + 50 || p.x < bounds.minX - 100 || p.x > bounds.maxX + 100) {
                    p.active = false;
                }
            } else {
                // 生成新粒子
                if (Math.random() < config.particleCount / this.maxParticles * dt * 2) {
                    this.spawnParticle(p, camera, config);
                }
            }
        });
    }
    
    spawnParticle(p, camera, config) {
        const bounds = camera.getViewportBounds ? camera.getViewportBounds() : 
                      { minX: 0, maxX: this.width, minY: 0, maxY: this.height };
        
        // 在视野上方或侧面生成
        if (config.horizontal) {
            // 沙尘暴：从右侧生成
            p.x = bounds.maxX + Math.random() * 100;
            p.y = bounds.minY + Math.random() * (bounds.maxY - bounds.minY);
        } else {
            // 雨雪：从上方生成
            p.x = bounds.minX + Math.random() * (bounds.maxX - bounds.minX) - config.wind * 2;
            p.y = bounds.minY - Math.random() * 50;
        }
        
        p.vx = config.wind * (0.8 + Math.random() * 0.4);
        p.vy = config.fallSpeed * (0.9 + Math.random() * 0.2);
        p.active = true;
        p.type = this.currentWeather;
        p.size = this.currentWeather === 'snow' ? 2 + Math.random() * 4 : 1 + Math.random();
        p.life = 3;
    }
    
    draw(ctx, width, height) {
        if (this.currentWeather === 'clear') return;
        
        const config = this.weatherConfig[this.currentWeather];
        if (!config) return;
        
        ctx.save();
        
        // 绘制天气粒子
        ctx.strokeStyle = config.color;
        ctx.fillStyle = config.color;
        ctx.lineWidth = this.currentWeather === 'rain' || this.currentWeather === 'storm' ? 2 : 1;
        ctx.globalAlpha = config.opacity;
        
        this.particles.forEach(p => {
            if (!p.active) return;
            
            if (p.type === 'rain' || p.type === 'storm') {
                // 雨滴 - 短线条
                ctx.beginPath();
                ctx.moveTo(p.x, p.y);
                ctx.lineTo(p.x + p.vx * 0.02, p.y + p.vy * 0.02);
                ctx.stroke();
            } else if (p.type === 'snow') {
                // 雪花 - 圆形带光晕
                ctx.shadowBlur = p.size;
                ctx.shadowColor = config.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            } else if (p.type === 'sandstorm') {
                // 沙尘 - 细长线条
                ctx.globalAlpha = config.opacity * (0.3 + Math.random() * 0.4);
                ctx.fillRect(p.x, p.y, 15 * p.size, 1);
            }
        });
        
        // 绘制闪电
        if (this.lightning.active && this.currentWeather === 'storm') {
            this.drawLightning(ctx, width, height);
        }
        
        // 天气覆盖层（氛围）
        this.drawWeatherOverlay(ctx, width, height);
        
        ctx.restore();
    }
    
    drawLightning(ctx, width, height) {
        const flashAlpha = 1 - (this.lightning.timer / this.lightning.duration);
        
        ctx.save();
        ctx.globalAlpha = flashAlpha * 0.6;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        
        // 闪电束
        ctx.globalAlpha = flashAlpha;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#aaccff';
        
        let x = width / 2 + (Math.random() - 0.5) * width * 0.5;
        let y = 0;
        
        ctx.beginPath();
        ctx.moveTo(x, y);
        
        while (y < height) {
            x += (Math.random() - 0.5) * 60;
            y += 20 + Math.random() * 30;
            ctx.lineTo(x, y);
        }
        
        ctx.stroke();
        ctx.restore();
    }
    
    drawWeatherOverlay(ctx, width, height) {
        let overlayColor = null;
        let alpha = 0;
        
        switch(this.currentWeather) {
            case 'rain':
                overlayColor = '#334455';
                alpha = 0.15;
                break;
            case 'storm':
                overlayColor = '#1a2233';
                alpha = 0.25;
                break;
            case 'sandstorm':
                overlayColor = '#c4a574';
                alpha = 0.2;
                break;
        }
        
        if (overlayColor) {
            ctx.globalAlpha = alpha;
            ctx.fillStyle = overlayColor;
            ctx.fillRect(0, 0, width, height);
        }
    }
    
    /**
     * 根据楼层自动设置天气
     */
    autoSetWeatherByFloor(floor) {
        switch(floor) {
            case 1: // 菌丝 - 细雨
                this.setWeather('rain', 0.3);
                break;
            case 2: // 温室 - 晴朗
                this.setWeather('clear');
                break;
            case 3: // 神经 - 随机雷暴
                this.setWeather(Math.random() > 0.5 ? 'storm' : 'rain', 0.6);
                break;
            case 4: // 熔炉 - 沙尘暴
                this.setWeather('sandstorm', 0.5);
                break;
            case 5: // 庭院 - 雪
                this.setWeather('snow', 0.4);
                break;
            case 6: // 千根 - 血雨/雷暴
                this.setWeather('storm', 0.8);
                break;
            default:
                this.setWeather('clear');
        }
    }
}
