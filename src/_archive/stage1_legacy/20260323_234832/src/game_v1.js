// 肉鸽牛牛 v1.0 - 核心循环版
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// 自适应画布
let GAME_WIDTH = window.innerWidth;
let GAME_HEIGHT = window.innerHeight;
canvas.width = GAME_WIDTH;
canvas.height = GAME_HEIGHT;
window.addEventListener('resize', () => {
    GAME_WIDTH = window.innerWidth;
    GAME_HEIGHT = window.innerHeight;
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
});

// 游戏状态机
const GameState = {
    MENU: 'menu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    GAMEOVER: 'gameover',
    VICTORY: 'victory'
};

let currentState = GameState.PLAYING; // 直接开始
let gameFrame = 0;
let gameTime = 0;

// 资源管理
const Assets = {
    images: {},
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
};

// ========== 核心类 ==========

class Bullet {
    constructor(x, y, tx, ty, damage = 1) {
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.speed = 10;
        this.radius = 6;
        this.active = true;
        
        const dx = tx - x;
        const dy = ty - y;
        const dist = Math.hypot(dx, dy);
        this.vx = (dx / dist) * this.speed;
        this.vy = (dy / dist) * this.speed;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        if (this.x < -50 || this.x > GAME_WIDTH + 50 || 
            this.y < -50 || this.y > GAME_HEIGHT + 50) {
            this.active = false;
        }
    }
    
    draw(ctx) {
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
    }
}

class ExpGem {
    constructor(x, y, value) {
        this.x = x;
        this.y = y;
        this.value = value;
        this.radius = 10;
        this.active = true;
        this.magnetRange = 150;
        this.speed = 0;
    }
    
    update(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist < this.magnetRange) {
            this.speed = Math.min(this.speed + 0.8, 12);
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }
        
        if (dist < this.radius + 20) {
            this.active = false;
            return true;
        }
        return false;
    }
    
    draw(ctx) {
        ctx.fillStyle = '#3498DB';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 8);
        ctx.lineTo(this.x + 8, this.y);
        ctx.lineTo(this.x, this.y + 8);
        ctx.lineTo(this.x - 8, this.y);
        ctx.closePath();
        ctx.fill();
    }
}

class Enemy {
    constructor(x, y, type = 'pig') {
        this.x = x;
        this.y = y;
        this.type = type;
        this.size = type === 'boss' ? 100 : 56;
        this.radius = type === 'boss' ? 45 : 24;
        this.speed = type === 'chick' ? 2.5 : type === 'boss' ? 1 : 1.5;
        this.hp = type === 'boss' ? 20 : type === 'chick' ? 1 : 3;
        this.maxHp = this.hp;
        this.active = true;
        this.facing = -1;
        this.attackCooldown = 0;
    }
    
    update(player, enemies) {
        // 追踪玩家
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist > 0) {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }
        
        // 朝向
        if (dx < 0) this.facing = -1;
        if (dx > 0) this.facing = 1;
        
        // 敌人互相推开
        for (let other of enemies) {
            if (other === this || !other.active) continue;
            const ox = other.x - this.x;
            const oy = other.y - this.y;
            const oDist = Math.hypot(ox, oy);
            const minDist = this.radius + other.radius;
            
            if (oDist < minDist && oDist > 0) {
                const push = (minDist - oDist) * 0.5;
                this.x -= (ox / oDist) * push;
                this.y -= (oy / oDist) * push;
            }
        }
        
        // Boss攻击
        if (this.type === 'boss' && this.attackCooldown > 0) {
            this.attackCooldown--;
        }
    }
    
    takeDamage(dmg) {
        this.hp -= dmg;
        if (this.hp <= 0) {
            this.active = false;
            return true;
        }
        return false;
    }
    
    draw(ctx) {
        const imgName = this.type === 'boss' ? 'boss_dog' : 
                       this.type === 'chick' ? 'enemy_chick' : 'enemy_pig';
        const img = Assets.images[imgName];
        
        if (img) {
            ctx.save();
            ctx.translate(this.x, this.y);
            if (this.facing === 1) ctx.scale(-1, 1);
            ctx.drawImage(img, -this.size/2, -this.size/2, this.size, this.size);
            ctx.restore();
        } else {
            // 备用色块
            ctx.fillStyle = this.type === 'boss' ? '#8B4513' : 
                           this.type === 'chick' ? '#FFD700' : '#FF69B4';
            ctx.fillRect(this.x - this.size/2, this.y - this.size/2, this.size, this.size);
        }
        
        // 血条
        if (this.hp < this.maxHp) {
            ctx.fillStyle = '#000';
            ctx.fillRect(this.x - 25, this.y - this.size/2 - 10, 50, 6);
            ctx.fillStyle = '#E74C3C';
            ctx.fillRect(this.x - 25, this.y - this.size/2 - 10, 50 * (this.hp / this.maxHp), 6);
        }
    }
}

class Player {
    constructor() {
        this.x = GAME_WIDTH / 2;
        this.y = GAME_HEIGHT / 2;
        this.size = 64;
        this.radius = 24;
        this.speed = 5;
        this.hp = 3;
        this.maxHp = 3;
        this.level = 1;
        this.exp = 0;
        this.expToLevel = 100;
        this.facing = 1;
        this.invincible = 0;
        
        // 战斗
        this.attackSpeed = 25;
        this.cooldown = 0;
        this.damage = 1;
        
        // 动画
        this.animFrame = 0;
        this.isMoving = false;
    }
    
    update(input, enemies, bullets) {
        // 移动
        let dx = 0, dy = 0;
        if (input.keys['w'] || input.keys['arrowup']) dy = -1;
        if (input.keys['s'] || input.keys['arrowdown']) dy = 1;
        if (input.keys['a'] || input.keys['arrowleft']) dx = -1;
        if (input.keys['d'] || input.keys['arrowright']) dx = 1;
        
        this.isMoving = dx !== 0 || dy !== 0;
        
        if (this.isMoving) {
            const len = Math.hypot(dx, dy);
            dx /= len;
            dy /= len;
            this.x += dx * this.speed;
            this.y += dy * this.speed;
            this.animFrame += 0.15;
        } else {
            this.animFrame = 0;
        }
        
        // 朝向
        if (dx < 0) this.facing = -1;
        if (dx > 0) this.facing = 1;
        
        // 边界
        this.x = Math.max(this.radius, Math.min(GAME_WIDTH - this.radius, this.x));
        this.y = Math.max(this.radius, Math.min(GAME_HEIGHT - this.radius, this.y));
        
        // 无敌
        if (this.invincible > 0) this.invincible--;
        
        // 自动攻击
        if (this.cooldown > 0) this.cooldown--;
        if (this.cooldown <= 0) {
            this.autoAttack(enemies, bullets);
        }
    }
    
    autoAttack(enemies, bullets) {
        let nearest = null;
        let minDist = 350; // 射程
        
        for (let e of enemies) {
            const dist = Math.hypot(e.x - this.x, e.y - this.y);
            if (dist < minDist) {
                minDist = dist;
                nearest = e;
            }
        }
        
        if (nearest) {
            bullets.push(new Bullet(this.x, this.y, nearest.x, nearest.y, this.damage));
            this.cooldown = this.attackSpeed;
        }
    }
    
    gainExp(val) {
        this.exp += val;
        if (this.exp >= this.expToLevel) {
            this.exp -= this.expToLevel;
            this.level++;
            this.expToLevel = Math.floor(this.expToLevel * 1.3);
            this.hp = Math.min(this.maxHp, this.hp + 1); // 升级回血
            return true;
        }
        return false;
    }
    
    takeDamage(dmg) {
        if (this.invincible > 0) return false;
        this.hp -= dmg;
        this.invincible = 60;
        return this.hp <= 0;
    }
    
    draw(ctx) {
        // 简单色块表示（等美术资源）
        ctx.save();
        ctx.translate(this.x, this.y);
        
        if (this.invincible > 0 && Math.floor(Date.now() / 50) % 2) {
            ctx.globalAlpha = 0.5;
        }
        
        if (this.facing === -1) ctx.scale(-1, 1);
        
        // 身体
        ctx.fillStyle = '#FFE4C4';
        ctx.fillRect(-20, -30, 40, 60);
        
        // 头
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(0, -25, 22, 0, Math.PI * 2);
        ctx.fill();
        
        // 眼睛
        ctx.fillStyle = '#000';
        ctx.fillRect(-8, -28, 4, 4);
        ctx.fillRect(4, -28, 4, 4);
        
        // 走路摆动
        if (this.isMoving) {
            const swing = Math.sin(this.animFrame) * 5;
            ctx.fillStyle = '#FFE4C4';
            ctx.fillRect(-18 + swing, 25, 8, 15);
            ctx.fillRect(10 - swing, 25, 8, 15);
        }
        
        ctx.restore();
    }
}

// 输入
const Input = {
    keys: {},
    init() {
        window.addEventListener('keydown', e => this.keys[e.key.toLowerCase()] = true);
        window.addEventListener('keyup', e => this.keys[e.key.toLowerCase()] = false);
    }
};

// ========== 游戏主控 ==========

class Game {
    constructor() {
        this.player = new Player();
        this.enemies = [];
        this.bullets = [];
        this.expGems = [];
        this.particles = [];
        
        this.wave = 1;
        this.waveTimer = 0;
        this.enemiesKilled = 0;
        
        this.ui = {
            hp: document.getElementById('hpDisplay'),
            level: document.getElementById('levelDisplay'),
            exp: document.getElementById('expDisplay'),
            enemyCount: document.getElementById('enemyCount'),
            time: document.getElementById('timeDisplay'),
            gameOver: document.getElementById('gameOver'),
            finalScore: document.getElementById('finalScore')
        };
    }
    
    spawnEnemy(type = null) {
        // 随机边缘位置
        let x, y;
        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? -60 : GAME_WIDTH + 60;
            y = Math.random() * GAME_HEIGHT;
        } else {
            x = Math.random() * GAME_WIDTH;
            y = Math.random() < 0.5 ? -60 : GAME_HEIGHT + 60;
        }
        
        // 根据波数决定类型
        if (!type) {
            const rand = Math.random();
            if (this.wave % 5 === 0 && rand < 0.1) type = 'boss';
            else if (rand < 0.3) type = 'chick';
            else type = 'pig';
        }
        
        this.enemies.push(new Enemy(x, y, type));
    }
    
    update() {
        if (currentState !== GameState.PLAYING) return;
        
        gameTime += 1/60;
        this.waveTimer++;
        
        // 每波生成敌人
        const spawnRate = Math.max(30, 120 - this.wave * 5);
        if (this.waveTimer % spawnRate === 0) {
            this.spawnEnemy();
        }
        
        // 每30秒一波
        if (this.waveTimer % 1800 === 0) {
            this.wave++;
            // 波数提升提示
            console.log(`Wave ${this.wave}!`);
        }
        
        // 更新子弹
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.update();
            if (!b.active) {
                this.bullets.splice(i, 1);
                continue;
            }
            
            // 碰撞敌人
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const e = this.enemies[j];
                if (Math.hypot(b.x - e.x, b.y - e.y) < e.radius + b.radius) {
                    b.active = false;
                    if (e.takeDamage(b.damage)) {
                        // 死亡
                        this.expGems.push(new ExpGem(e.x, e.y, e.type === 'boss' ? 50 : 10));
                        this.enemies.splice(j, 1);
                        this.enemiesKilled++;
                    }
                    break;
                }
            }
        }
        
        // 更新经验
        for (let i = this.expGems.length - 1; i >= 0; i--) {
            if (this.expGems[i].update(this.player)) {
                if (this.player.gainExp(this.expGems[i].value)) {
                    // 升级了！
                }
                this.expGems.splice(i, 1);
            }
        }
        
        // 更新敌人
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            e.update(this.player, this.enemies);
            
            // 碰玩家
            if (Math.hypot(e.x - this.player.x, e.y - this.player.y) < e.radius + this.player.radius) {
                if (this.player.takeDamage(1)) {
                    this.gameOver();
                }
            }
        }
        
        // 更新玩家
        this.player.update(Input, this.enemies, this.bullets);
        
        // 更新UI
        this.updateUI();
    }
    
    draw() {
        // 清空
        ctx.fillStyle = '#2d1b2e';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        // 网格
        ctx.strokeStyle = '#3d2b3e';
        ctx.lineWidth = 2;
        for (let x = 0; x < GAME_WIDTH; x += 80) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, GAME_HEIGHT);
            ctx.stroke();
        }
        for (let y = 0; y < GAME_HEIGHT; y += 80) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(GAME_WIDTH, y);
            ctx.stroke();
        }
        
        // 绘制
        for (let gem of this.expGems) gem.draw(ctx);
        for (let b of this.bullets) b.draw(ctx);
        for (let e of this.enemies) e.draw(ctx);
        this.player.draw(ctx);
    }
    
    updateUI() {
        this.ui.hp.textContent = '❤️'.repeat(this.player.hp) + '🖤'.repeat(this.player.maxHp - this.player.hp);
        this.ui.level.textContent = this.player.level;
        this.ui.exp.textContent = `${Math.floor(this.player.exp)}/${this.player.expToLevel}`;
        this.ui.enemyCount.textContent = this.enemies.length;
        const mins = Math.floor(gameTime / 60);
        const secs = Math.floor(gameTime % 60);
        this.ui.time.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    gameOver() {
        currentState = GameState.GAMEOVER;
        this.ui.gameOver.style.display = 'block';
        const mins = Math.floor(gameTime / 60);
        const secs = Math.floor(gameTime % 60);
        this.ui.finalScore.innerHTML = `
            <div>存活时间: ${mins}:${secs.toString().padStart(2, '0')}</div>
            <div>等级: ${this.player.level}</div>
            <div>击败敌人: ${this.enemiesKilled}</div>
            <div>波数: ${this.wave}</div>
        `;
    }
}

// ========== 启动 ==========

async function init() {
    Input.init();
    
    // 尝试加载图片（失败也没关系，有色块备用）
    try {
        await Assets.load('enemy_pig', 'assets/enemies/enemy_pig.png');
        await Assets.load('enemy_chick', 'assets/enemies/enemy_chick.png');
        await Assets.load('boss_dog', 'assets/enemies/boss_dog.png');
    } catch(e) {
        console.log('Some images failed to load, using fallback colors');
    }
    
    const game = new Game();
    
    function loop() {
        game.update();
        game.draw();
        requestAnimationFrame(loop);
    }
    
    loop();
}

init();
