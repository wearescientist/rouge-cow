// 肉鸽牛牛 v15.0 - 更多地图变体
// 不同环境主题，陷阱，环境效果

// ========== 环境主题定义 ==========
const BIOMES = {
    cave: {
        name: '寄生洞穴',
        floorColor: '#2d1b2e',
        wallColor: '#4a2c4b',
        gridColor: '#3d2b3e',
        enemyMultiplier: 1.0,
        specialFeature: 'none',
        bgm: 'cave',
        hazards: ['spike_pit']
    },
    
    grassland: {
        name: '感染草原',
        floorColor: '#2d4a1b',
        wallColor: '#1e3312',
        gridColor: '#3d5a2b',
        enemyMultiplier: 0.8,
        specialFeature: 'tall_grass',
        bgm: 'grass',
        hazards: ['quicksand']
    },
    
    desert: {
        name: '荒漠废墟',
        floorColor: '#8b7355',
        wallColor: '#6b5344',
        gridColor: '#9b8365',
        enemyMultiplier: 1.1,
        specialFeature: 'sandstorm',
        bgm: 'desert',
        hazards: ['cactus', 'quicksand']
    },
    
    snow: {
        name: '冰封牧场',
        floorColor: '#d4e6f1',
        wallColor: '#a9cce3',
        gridColor: '#c4d6e1',
        enemyMultiplier: 1.2,
        specialFeature: 'ice_floor',
        bgm: 'snow',
        hazards: ['ice_patch']
    },
    
    volcano: {
        name: '熔岩地底',
        floorColor: '#4a1b1b',
        wallColor: '#7b2c2c',
        gridColor: '#5a3b3b',
        enemyMultiplier: 1.3,
        specialFeature: 'lava_pools',
        bgm: 'volcano',
        hazards: ['lava', 'eruption']
    },
    
    void: {
        name: '虚空深渊',
        floorColor: '#1a1a2e',
        wallColor: '#0f0f1a',
        gridColor: '#2a2a3e',
        enemyMultiplier: 1.5,
        specialFeature: 'gravity_wells',
        bgm: 'void',
        hazards: ['void_rift', 'gravity_shift']
    }
};

// ========== 环境效果 ==========
class EnvironmentEffects {
    constructor(biome) {
        this.biome = biome;
        this.effects = [];
        this.particles = [];
        
        // 根据环境初始化
        if (biome === 'sandstorm') {
            this.initSandstorm();
        } else if (biome === 'ice_floor') {
            this.friction = 0.95; // 滑行
        }
    }
    
    initSandstorm() {
        // 沙尘暴粒子
        for (let i = 0; i < 50; i++) {
            this.particles.push({
                x: Math.random() * GAME_WIDTH,
                y: Math.random() * GAME_HEIGHT,
                vx: 5 + Math.random() * 5,
                vy: (Math.random() - 0.5) * 2,
                life: 100 + Math.random() * 100
            });
        }
    }
    
    update(player) {
        // 环境对玩家的影响
        if (this.biome === 'ice_floor') {
            // 冰面滑行
            if (player.vx !== 0 || player.vy !== 0) {
                player.vx *= this.friction;
                player.vy *= this.friction;
            }
        }
        
        if (this.biome === 'sandstorm') {
            // 沙尘暴视野降低 + 持续伤害
            player.visionRange = 200;
            // 每5秒受到1点伤害
            if (Math.floor(Date.now() / 1000) % 5 === 0) {
                // 伤害逻辑
            }
        }
        
        // 更新粒子
        for (let p of this.particles) {
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            
            if (p.x > GAME_WIDTH) p.x = 0;
            if (p.life <= 0) {
                p.x = 0;
                p.y = Math.random() * GAME_HEIGHT;
                p.life = 100 + Math.random() * 100;
            }
        }
    }
    
    draw(ctx) {
        if (this.biome === 'sandstorm') {
            ctx.fillStyle = 'rgba(139, 115, 85, 0.3)';
            for (let p of this.particles) {
                ctx.fillRect(p.x, p.y, 4, 2);
            }
            
            // 视野限制
            const grad = ctx.createRadialGradient(
                player.x, player.y, 100,
                player.x, player.y, 400
            );
            grad.addColorStop(0, 'rgba(0,0,0,0)');
            grad.addColorStop(1, 'rgba(139, 115, 85, 0.7)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        }
    }
}

// ========== 陷阱和危险物 ==========
class Hazard {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.active = true;
        this.cooldown = 0;
        
        // 根据类型设置属性
        const defs = {
            spike_pit: { damage: 2, radius: 40, activationTime: 60 },
            quicksand: { slow: 0.5, damage: 0.1, radius: 60 },
            cactus: { damage: 1, radius: 30 },
            ice_patch: { slip: true, radius: 80 },
            lava: { damage: 3, radius: 50 },
            eruption: { damage: 5, radius: 100, warning: 120 },
            void_rift: { pull: true, damage: 2, radius: 100 }
        };
        
        Object.assign(this, defs[type] || {});
        
        if (type === 'eruption') {
            this.warningTimer = this.warning;
            this.erupting = false;
        }
    }
    
    update(player) {
        const dist = Math.hypot(player.x - this.x, player.y - this.y);
        
        if (this.type === 'spike_pit') {
            // 尖刺陷阱：玩家靠近后激活
            if (dist < this.radius && this.cooldown <= 0) {
                this.cooldown = this.activationTime;
            }
            if (this.cooldown > 0) {
                this.cooldown--;
                // 激活时造成伤害
                if (this.cooldown === Math.floor(this.activationTime / 2) && dist < this.radius) {
                    player.takeDamage(this.damage);
                }
            }
        }
        
        else if (this.type === 'quicksand') {
            // 流沙：减速+持续伤害
            if (dist < this.radius) {
                player.speed *= this.slow;
                if (Math.random() < 0.1) {
                    player.takeDamage(this.damage);
                }
            }
        }
        
        else if (this.type === 'eruption') {
            // 火山喷发：预警后爆发
            this.warningTimer--;
            if (this.warningTimer <= 0) {
                this.erupting = true;
                setTimeout(() => {
                    this.erupting = false;
                    this.warningTimer = this.warning;
                }, 60);
            }
            
            if (this.erupting && dist < this.radius) {
                player.takeDamage(this.damage);
            }
        }
        
        else if (this.type === 'void_rift') {
            // 虚空裂隙：吸引玩家
            if (dist < this.radius && dist > 20) {
                const dx = this.x - player.x;
                const dy = this.y - player.y;
                player.x += (dx / dist) * 2; // 拉力
                player.y += (dy / dist) * 2;
                
                if (dist < 30) {
                    player.takeDamage(this.damage);
                }
            }
        }
    }
    
    draw(ctx) {
        const alpha = 0.7;
        
        switch(this.type) {
            case 'spike_pit':
                if (this.cooldown > Math.floor(this.activationTime * 0.3)) {
                    ctx.fillStyle = `rgba(100, 100, 100, ${alpha})`;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                    ctx.fill();
                    
                    // 尖刺
                    if (this.cooldown < this.activationTime * 0.5) {
                        ctx.fillStyle = '#888';
                        for (let i = 0; i < 8; i++) {
                            const angle = (i / 8) * Math.PI * 2;
                            const spikeHeight = 20 * (1 - this.cooldown / this.activationTime);
                            ctx.beginPath();
                            ctx.moveTo(this.x + Math.cos(angle) * 10, this.y + Math.sin(angle) * 10);
                            ctx.lineTo(this.x + Math.cos(angle) * 25, this.y + Math.sin(angle) * 25 - spikeHeight);
                            ctx.lineTo(this.x + Math.cos(angle) * 40, this.y + Math.sin(angle) * 40);
                            ctx.fill();
                        }
                    }
                }
                break;
                
            case 'lava':
            case 'eruption':
                const pulse = Math.sin(Date.now() / 200) * 0.3 + 0.7;
                ctx.fillStyle = `rgba(231, 76, 60, ${alpha * pulse})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
                
                // 警告圈
                if (this.type === 'eruption' && this.warningTimer < 60) {
                    ctx.strokeStyle = `rgba(231, 76, 60, ${this.warningTimer / 60})`;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(this.x, this.y, this.radius + 20, 0, Math.PI * 2);
                    ctx.stroke();
                }
                break;
                
            case 'void_rift':
                ctx.fillStyle = `rgba(44, 62, 80, ${alpha})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
                
                // 旋转漩涡
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(Date.now() / 500);
                ctx.strokeStyle = '#5d6d7e';
                ctx.lineWidth = 2;
                ctx.beginPath();
                for (let i = 0; i < 4; i++) {
                    ctx.moveTo(0, 0);
                    ctx.lineTo(Math.cos(i * Math.PI / 2) * this.radius, Math.sin(i * Math.PI / 2) * this.radius);
                }
                ctx.stroke();
                ctx.restore();
                break;
        }
    }
}

// ========== 房间装饰物 ==========
class RoomDecoration {
    constructor(x, y, type, biome) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.biome = biome;
    }
    
    draw(ctx) {
        // 根据生物群系和类型绘制装饰
        const decorations = {
            cave: { rock: '#5d4037', crystal: '#9b59b6' },
            grassland: { tree: '#2ecc71', flower: '#e74c3c' },
            desert: { cactus: '#27ae60', bones: '#ecf0f1' },
            snow: { icicle: '#aed6f1', snowman: '#fff' },
            volcano: { rock: '#2c3e50', lava_crust: '#c0392b' }
        };
        
        const color = decorations[this.biome]?.[this.type] || '#888';
        ctx.fillStyle = color;
        
        if (this.type === 'rock') {
            ctx.beginPath();
            ctx.arc(this.x, this.y, 15 + Math.random() * 10, 0, Math.PI * 2);
            ctx.fill();
        } else if (this.type === 'tree') {
            ctx.fillRect(this.x - 5, this.y, 10, 30);
            ctx.beginPath();
            ctx.arc(this.x, this.y - 10, 20, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// ========== 生物群系管理器 ==========
class BiomeManager {
    constructor() {
        this.currentBiome = 'cave';
        this.floor = 1;
        this.environment = null;
        this.hazards = [];
        this.decorations = [];
    }
    
    setBiome(biomeKey) {
        if (BIOMES[biomeKey]) {
            this.currentBiome = biomeKey;
            this.environment = new EnvironmentEffects(BIOMES[biomeKey].specialFeature);
            this.generateHazards();
            this.generateDecorations();
        }
    }
    
    generateHazards() {
        this.hazards = [];
        const biome = BIOMES[this.currentBiome];
        const availableHazards = biome.hazards || [];
        
        if (availableHazards.length > 0) {
            // 随机放置3-5个陷阱
            const count = 3 + Math.floor(Math.random() * 3);
            for (let i = 0; i < count; i++) {
                this.hazards.push(new Hazard(
                    100 + Math.random() * (GAME_WIDTH - 200),
                    100 + Math.random() * (GAME_HEIGHT - 200),
                    availableHazards[Math.floor(Math.random() * availableHazards.length)]
                ));
            }
        }
    }
    
    generateDecorations() {
        this.decorations = [];
        const types = ['rock', 'tree', 'cactus', 'icicle'];
        for (let i = 0; i < 10; i++) {
            this.decorations.push(new RoomDecoration(
                Math.random() * GAME_WIDTH,
                Math.random() * GAME_HEIGHT,
                types[Math.floor(Math.random() * types.length)],
                this.currentBiome
            ));
        }
    }
    
    nextFloor() {
        this.floor++;
        // 每5层切换环境
        const biomes = Object.keys(BIOMES);
        const biomeIndex = Math.floor((this.floor - 1) / 5) % biomes.length;
        this.setBiome(biomes[biomeIndex]);
    }
    
    update(player) {
        if (this.environment) {
            this.environment.update(player);
        }
        
        for (let hazard of this.hazards) {
            hazard.update(player);
        }
    }
    
    draw(ctx) {
        // 绘制装饰（在地板和实体之间）
        for (let dec of this.decorations) {
            dec.draw(ctx);
        }
        
        // 绘制陷阱
        for (let hazard of this.hazards) {
            hazard.draw(ctx);
        }
        
        // 绘制环境效果
        if (this.environment) {
            this.environment.draw(ctx);
        }
    }
}

console.log('Biome system loaded');
console.log('6 biomes: Cave, Grassland, Desert, Snow, Volcano, Void');
console.log('Hazards: Spikes, Quicksand, Lava, Eruptions, Void Rifts');
