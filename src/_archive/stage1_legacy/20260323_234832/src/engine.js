// 肉鸽牛牛 - 游戏引擎核心
// 纯代码，不涉及美术

class GameEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false;
        
        this.width = canvas.width;
        this.height = canvas.height;
        
        // 游戏状态
        this.state = 'menu'; // menu, playing, paused, gameover
        this.frame = 0;
        this.lastTime = 0;
        
        // 实体管理
        this.entities = [];
        this.particles = [];
        this.uiElements = [];
        
        // 摄像机
        this.camera = { x: 0, y: 0 };
        
        // 输入
        this.input = new InputHandler();
        
        // 资源管理
        this.assets = new AssetManager();
    }
    
    start() {
        this.state = 'playing';
        this.loop(0);
    }
    
    loop(timestamp) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        if (this.state === 'playing') {
            this.update(deltaTime);
            this.render();
        }
        
        requestAnimationFrame((t) => this.loop(t));
    }
    
    update(deltaTime) {
        this.frame++;
        
        // 更新所有实体
        for (let entity of this.entities) {
            if (entity.active) {
                entity.update(deltaTime, this.input);
            }
        }
        
        // 更新粒子
        this.particles = this.particles.filter(p => p.active);
        for (let particle of this.particles) {
            particle.update(deltaTime);
        }
        
        // 清理无效实体
        this.entities = this.entities.filter(e => e.active);
    }
    
    render() {
        // 清空画布
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        // 保存上下文
        this.ctx.save();
        
        // 应用摄像机偏移
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // 渲染地图
        this.renderMap();
        
        // 渲染实体（按Y排序）
        const sortedEntities = [...this.entities].sort((a, b) => a.y - b.y);
        for (let entity of sortedEntities) {
            entity.render(this.ctx);
        }
        
        // 渲染粒子
        for (let particle of this.particles) {
            particle.render(this.ctx);
        }
        
        this.ctx.restore();
        
        // 渲染UI（不受摄像机影响）
        this.renderUI();
    }
    
    renderMap() {
        // 基础网格背景
        this.ctx.strokeStyle = '#2a2a3e';
        this.ctx.lineWidth = 1;
        
        const gridSize = 64;
        const startX = Math.floor(this.camera.x / gridSize) * gridSize;
        const startY = Math.floor(this.camera.y / gridSize) * gridSize;
        
        for (let x = startX; x < this.camera.x + this.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, this.camera.y);
            this.ctx.lineTo(x, this.camera.y + this.height);
            this.ctx.stroke();
        }
        
        for (let y = startY; y < this.camera.y + this.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(this.camera.x, y);
            this.ctx.lineTo(this.camera.x + this.width, y);
            this.ctx.stroke();
        }
    }
    
    renderUI() {
        // 基础UI框架（占位）
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(10, 10, 200, 80);
        
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px monospace';
        this.ctx.fillText('HP: ████████░░', 20, 35);
        this.ctx.fillText('EXP: ██████░░░░', 20, 55);
        this.ctx.fillText('Level: 1', 20, 75);
    }
    
    addEntity(entity) {
        this.entities.push(entity);
    }
    
    addParticle(particle) {
        this.particles.push(particle);
    }
}

// 输入处理
class InputHandler {
    constructor() {
        this.keys = {};
        this.mouse = { x: 0, y: 0, down: false };
        
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        window.addEventListener('mousemove', (e) => {
            const rect = e.target.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        
        window.addEventListener('mousedown', () => {
            this.mouse.down = true;
        });
        
        window.addEventListener('mouseup', () => {
            this.mouse.down = false;
        });
    }
    
    isKeyPressed(key) {
        return !!this.keys[key.toLowerCase()];
    }
}

// 资源管理
class AssetManager {
    constructor() {
        this.images = {};
        this.loaded = false;
    }
    
    async load(name, src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.images[name] = img;
                resolve(img);
            };
            img.onerror = reject;
            img.src = src;
        });
    }
    
    get(name) {
        return this.images[name];
    }
}

// 基础实体类
class Entity {
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.vx = 0;
        this.vy = 0;
        this.active = true;
        this.color = '#fff';
    }
    
    update(deltaTime, input) {
        this.x += this.vx * deltaTime;
        this.y += this.vy * deltaTime;
    }
    
    render(ctx) {
        // 默认用色块表示
        ctx.fillStyle = this.color;
        ctx.fillRect(
            this.x - this.width / 2,
            this.y - this.height / 2,
            this.width,
            this.height
        );
    }
    
    distanceTo(other) {
        const dx = this.x - other.x;
        const dy = this.y - other.y;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

// 玩家类
class Player extends Entity {
    constructor(x, y) {
        super(x, y, 48, 48);
        this.color = '#3498db';
        this.speed = 200; // 像素/秒
        this.hp = 3;
        this.maxHp = 3;
        this.level = 1;
        this.exp = 0;
        this.expToLevel = 100;
    }
    
    update(deltaTime, input) {
        // 移动
        let dx = 0;
        let dy = 0;
        
        if (input.isKeyPressed('w') || input.isKeyPressed('arrowup')) dy -= 1;
        if (input.isKeyPressed('s') || input.isKeyPressed('arrowdown')) dy += 1;
        if (input.isKeyPressed('a') || input.isKeyPressed('arrowleft')) dx -= 1;
        if (input.isKeyPressed('d') || input.isKeyPressed('arrowright')) dx += 1;
        
        // 归一化
        if (dx !== 0 || dy !== 0) {
            const len = Math.sqrt(dx * dx + dy * dy);
            dx /= len;
            dy /= len;
        }
        
        this.vx = dx * this.speed;
        this.vy = dy * this.speed;
        
        super.update(deltaTime, input);
        
        // 边界限制
        this.x = Math.max(this.width/2, Math.min(800 - this.width/2, this.x));
        this.y = Math.max(this.height/2, Math.min(600 - this.height/2, this.y));
    }
    
    gainExp(amount) {
        this.exp += amount;
        if (this.exp >= this.expToLevel) {
            this.exp -= this.expToLevel;
            this.level++;
            this.expToLevel = Math.floor(this.expToLevel * 1.2);
            return true; // 升级了
        }
        return false;
    }
}

// 简单的测试代码
// 在浏览器控制台运行：
// const engine = new GameEngine(document.getElementById('gameCanvas'));
// engine.addEntity(new Player(400, 300));
// engine.start();
