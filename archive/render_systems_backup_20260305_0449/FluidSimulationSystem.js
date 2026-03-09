// ============================================================
// v0.23-r27 - 流体模拟系统 (Fluid Simulation System)
// HD-2D风格：水面波动、岩浆流动、流体粒子
// ============================================================

export class FluidSimulationSystem {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        // 流体网格
        this.gridSize = 20;
        this.gridWidth = Math.ceil(width / this.gridSize);
        this.gridHeight = Math.ceil(height / this.gridSize);
        
        // 速度场
        this.velocityField = new Float32Array(this.gridWidth * this.gridHeight * 2);
        
        // 密度场
        this.densityField = new Float32Array(this.gridWidth * this.gridHeight);
        
        // 流体源
        this.fluidSources = [];
        
        // 流体粒子
        this.particles = [];
        this.maxParticles = 200;
        
        // 流体类型配置
        this.fluidTypes = {
            water: {
                color: '#4488aa',
                viscosity: 0.1,
                density: 1.0,
                waveSpeed: 2.0,
                reflection: 0.5
            },
            lava: {
                color: '#aa2200',
                viscosity: 0.8,
                density: 2.0,
                waveSpeed: 0.5,
                reflection: 0.2,
                glow: true
            },
            poison: {
                color: '#44aa22',
                viscosity: 0.3,
                density: 1.2,
                waveSpeed: 1.5,
                reflection: 0.3,
                bubbles: true
            },
            oil: {
                color: '#221100',
                viscosity: 0.9,
                density: 0.8,
                waveSpeed: 0.3,
                reflection: 0.7
            }
        };
        
        this.time = 0;
        this.initParticles();
    }
    
    initParticles() {
        for (let i = 0; i < this.maxParticles; i++) {
            this.particles.push({
                x: 0, y: 0,
                vx: 0, vy: 0,
                life: 0,
                type: 'water',
                active: false
            });
        }
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
        this.gridWidth = Math.ceil(width / this.gridSize);
        this.gridHeight = Math.ceil(height / this.gridSize);
        this.velocityField = new Float32Array(this.gridWidth * this.gridHeight * 2);
        this.densityField = new Float32Array(this.gridWidth * this.gridHeight);
    }
    
    update(dt, floor) {
        this.time += dt;
        
        // 更新流体源
        this.updateFluidSources(dt);
        
        // 更新速度场（简化版Navier-Stokes）
        this.updateVelocityField(dt);
        
        // 更新密度场
        this.updateDensityField(dt);
        
        // 更新粒子
        this.updateParticles(dt);
        
        // 根据楼层生成环境流体效果
        this.updateFloorFluid(floor);
    }
    
    updateFluidSources(dt) {
        this.fluidSources.forEach(source => {
            // 在源位置添加速度
            const gx = Math.floor(source.x / this.gridSize);
            const gy = Math.floor(source.y / this.gridSize);
            const idx = (gy * this.gridWidth + gx) * 2;
            
            if (idx >= 0 && idx < this.velocityField.length - 1) {
                this.velocityField[idx] += source.vx * dt;
                this.velocityField[idx + 1] += source.vy * dt;
            }
            
            // 生成粒子
            if (Math.random() < source.emissionRate * dt) {
                this.spawnParticle(source.x, source.y, source.type);
            }
        });
    }
    
    updateVelocityField(dt) {
        const newField = new Float32Array(this.velocityField.length);
        
        for (let y = 1; y < this.gridHeight - 1; y++) {
            for (let x = 1; x < this.gridWidth - 1; x++) {
                const idx = (y * this.gridWidth + x) * 2;
                
                // 扩散
                const viscosity = 0.1;
                for (let i = 0; i < 2; i++) {
                    const val = this.velocityField[idx + i];
                    const neighbors = [
                        this.velocityField[idx - this.gridWidth * 2 + i],
                        this.velocityField[idx + this.gridWidth * 2 + i],
                        this.velocityField[idx - 2 + i],
                        this.velocityField[idx + 2 + i]
                    ];
                    
                    const avg = neighbors.reduce((a, b) => a + b, 0) / 4;
                    newField[idx + i] = val + (avg - val) * viscosity;
                    
                    // 衰减
                    newField[idx + i] *= 0.99;
                }
            }
        }
        
        this.velocityField = newField;
    }
    
    updateDensityField(dt) {
        // 密度跟随速度场平流
        const newDensity = new Float32Array(this.densityField.length);
        
        for (let y = 1; y < this.gridHeight - 1; y++) {
            for (let x = 1; x < this.gridWidth - 1; x++) {
                const idx = y * this.gridWidth + x;
                const vIdx = idx * 2;
                
                const vx = this.velocityField[vIdx];
                const vy = this.velocityField[vIdx + 1];
                
                // 平流
                const srcX = x - vx * dt * 0.1;
                const srcY = y - vy * dt * 0.1;
                
                const srcIdx = Math.floor(srcY) * this.gridWidth + Math.floor(srcX);
                if (srcIdx >= 0 && srcIdx < this.densityField.length) {
                    newDensity[idx] = this.densityField[srcIdx];
                }
                
                // 衰减
                newDensity[idx] *= 0.995;
            }
        }
        
        this.densityField = newDensity;
    }
    
    updateParticles(dt) {
        this.particles.forEach(p => {
            if (!p.active) return;
            
            // 应用速度场
            const gx = Math.floor(p.x / this.gridSize);
            const gy = Math.floor(p.y / this.gridSize);
            const idx = (gy * this.gridWidth + gx) * 2;
            
            if (idx >= 0 && idx < this.velocityField.length - 1) {
                p.vx += this.velocityField[idx] * dt;
                p.vy += this.velocityField[idx + 1] * dt;
            }
            
            // 重力
            p.vy += 50 * dt;
            
            // 更新位置
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            
            // 生命周期
            p.life -= dt;
            if (p.life <= 0) {
                p.active = false;
            }
        });
    }
    
    spawnParticle(x, y, type) {
        const p = this.particles.find(p => !p.active);
        if (!p) return;
        
        p.x = x;
        p.y = y;
        p.vx = (Math.random() - 0.5) * 20;
        p.vy = (Math.random() - 0.5) * 20;
        p.life = 2 + Math.random() * 2;
        p.type = type;
        p.active = true;
    }
    
    updateFloorFluid(floor) {
        // 根据楼层自动生成流体效果
        switch(floor) {
            case 1: // 菌丝 - 水滴
                if (Math.random() < 0.01) {
                    this.spawnParticle(
                        Math.random() * this.width,
                        0,
                        'water'
                    );
                }
                break;
            case 4: // 熔炉 - 岩浆气泡
                if (Math.random() < 0.02) {
                    this.spawnParticle(
                        Math.random() * this.width,
                        this.height,
                        'lava'
                    );
                }
                break;
        }
    }
    
    addFluidSource(x, y, vx, vy, type, emissionRate = 10) {
        this.fluidSources.push({
            x, y, vx, vy, type, emissionRate,
            id: Math.random()
        });
    }
    
    removeFluidSource(id) {
        this.fluidSources = this.fluidSources.filter(s => s.id !== id);
    }
    
    draw(ctx, width, height, camera) {
        // 绘制流体表面
        this.drawFluidSurface(ctx, width, height, camera);
        
        // 绘制粒子
        this.drawParticles(ctx, camera);
    }
    
    drawFluidSurface(ctx, width, height, camera) {
        ctx.save();
        
        // 绘制波纹效果
        const waveCount = 5;
        for (let i = 0; i < waveCount; i++) {
            const y = height * (0.6 + i * 0.1);
            const amplitude = 5 + i * 2;
            const frequency = 0.01 + i * 0.002;
            const phase = this.time * (1 + i * 0.3);
            
            ctx.strokeStyle = `rgba(100, 150, 200, ${0.3 - i * 0.05})`;
            ctx.lineWidth = 2;
            ctx.beginPath();
            
            for (let x = 0; x < width; x += 10) {
                const waveY = y + Math.sin(x * frequency + phase) * amplitude;
                if (x === 0) ctx.moveTo(x, waveY);
                else ctx.lineTo(x, waveY);
            }
            
            ctx.stroke();
        }
        
        ctx.restore();
    }
    
    drawParticles(ctx, camera) {
        ctx.save();
        
        this.particles.forEach(p => {
            if (!p.active) return;
            
            const pos = camera.worldToScreen(p.x, p.y);
            const config = this.fluidTypes[p.type];
            
            ctx.globalAlpha = p.life / 4;
            ctx.fillStyle = config.color;
            
            if (config.glow) {
                ctx.shadowBlur = 10;
                ctx.shadowColor = config.color;
            }
            
            const size = 3 * (p.life / 4);
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.shadowBlur = 0;
        });
        
        ctx.restore();
    }
}
