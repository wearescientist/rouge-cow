// 肉鸽牛牛 - 完整版（全屏自适应 + 攻击 + 碰撞）
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// 游戏配置（自适应大小）
let GAME_WIDTH = window.innerWidth;
let GAME_HEIGHT = window.innerHeight;

// 设置canvas实际分辨率
function resizeCanvas() {
    GAME_WIDTH = window.innerWidth;
    GAME_HEIGHT = window.innerHeight;
    canvas.width = GAME_WIDTH;
    canvas.height = GAME_HEIGHT;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// 资源
const Assets = {
    images: {},
    load(name, src) {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                this.images[name] = img;
                resolve(img);
            };
            img.src = src;
        });
    }
};

// ========== 子弹类 ==========
class Bullet {
    constructor(x, y, targetX, targetY, damage = 1) {
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.speed = 8;
        this.radius = 6;
        this.active = true;
        
        // 计算方向
        const dx = targetX - x;
        const dy = targetY - y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        this.vx = (dx / dist) * this.speed;
        this.vy = (dy / dist) * this.speed;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        // 出界销毁
        if (this.x < 0 || this.x > GAME_WIDTH || 
            this.y < 0 || this.y > GAME_HEIGHT) {
            this.active = false;
        }
    }
    
    draw(ctx) {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 牛奶光泽
        ctx.fillStyle = '#FFF8DC';
        ctx.beginPath();
        ctx.arc(this.x - 2, this.y - 2, 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ========== 经验宝石类 ==========
class ExpGem {
    constructor(x, y, value) {
        this.x = x;
        this.y = y;
        this.value = value;
        this.radius = 10;
        this.active = true;
        this.magnetRange = 120;
        this.speed = 0;
        this.maxSpeed = 10;
    }
    
    update(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        // 磁力吸引
        if (dist < this.magnetRange) {
            this.speed = Math.min(this.speed + 0.5, this.maxSpeed);
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }
        
        // 拾取检测
        if (dist < this.radius + player.size/3) {
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
        
        // 高光
        ctx.fillStyle = '#85C1E9';
        ctx.beginPath();
        ctx.arc(this.x - 3, this.y - 3, 3, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ========== 敌人类 ==========
class Enemy {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.size = 64;
        this.radius = 28; // 碰撞半径
        this.speed = 1.5;
        this.hp = 3;
        this.active = true;
        this.facing = -1;
        this.pushX = 0;
        this.pushY = 0;
    }
    
    update(player, enemies) {
        // 向玩家移动
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist > 0) {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }
        
        // 更新朝向
        if (dx < 0) this.facing = -1;
        if (dx > 0) this.facing = 1;
        
        // ===== 敌人碰撞检测（互相推开） =====
        for (let other of enemies) {
            if (other === this || !other.active) continue;
            
            const ox = other.x - this.x;
            const oy = other.y - this.y;
            const oDist = Math.sqrt(ox*ox + oy*oy);
            const minDist = this.radius + other.radius;
            
            if (oDist < minDist && oDist > 0) {
                // 计算推开力
                const pushForce = (minDist - oDist) * 0.5;
                const pushX = (ox / oDist) * pushForce;
                const pushY = (oy / oDist) * pushForce;
                
                this.x -= pushX;
                this.y -= pushY;
            }
        }
        
        // 应用推开速度（带衰减）
        this.x += this.pushX;
        this.y += this.pushY;
        this.pushX *= 0.8;
        this.pushY *= 0.8;
    }
    
    takeDamage(damage) {
        this.hp -= damage;
        if (this.hp <= 0) {
            this.active = false;
            return true; // 死亡
        }
        return false;
    }
    
    draw(ctx) {
        const img = Assets.images['enemy_pig'];
        if (!img) {
            // 备用绘制
            ctx.fillStyle = '#E91E63';
            ctx.fillRect(this.x - 20, this.y - 30, 40, 60);
            return;
        }
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        if (this.facing === 1) {
            ctx.scale(-1, 1);
        }
        
        ctx.drawImage(img, -this.size/2, -this.size/2, this.size, this.size);
        ctx.restore();
        
        // 血条（受伤时显示）
        if (this.hp < 3) {
            ctx.fillStyle = '#000';
            ctx.fillRect(this.x - 20, this.y - 40, 40, 6);
            ctx.fillStyle = '#E74C3C';
            ctx.fillRect(this.x - 20, this.y - 40, 40 * (this.hp / 3), 6);
        }
    }
}

// ========== 玩家类 ==========
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
        
        // 攻击
        this.attackCooldown = 0;
        this.attackSpeed = 30; // 帧
        this.bulletDamage = 1;
    }
    
    update(input, enemies, bullets) {
        // 移动
        let dx = 0, dy = 0;
        if (input.keys['w'] || input.keys['arrowup']) dy = -1;
        if (input.keys['s'] || input.keys['arrowdown']) dy = 1;
        if (input.keys['a'] || input.keys['arrowleft']) dx = -1;
        if (input.keys['d'] || input.keys['arrowright']) dx = 1;
        
        if (dx !== 0 || dy !== 0) {
            const len = Math.sqrt(dx*dx + dy*dy);
            dx /= len;
            dy /= len;
        }
        
        this.x += dx * this.speed;
        this.y += dy * this.speed;
        
        if (dx < 0) this.facing = -1;
        if (dx > 0) this.facing = 1;
        
        // 边界
        this.x = Math.max(this.size/2, Math.min(GAME_WIDTH - this.size/2, this.x));
        this.y = Math.max(this.size/2, Math.min(GAME_HEIGHT - this.size/2, this.y));
        
        // 无敌时间递减
        if (this.invincible > 0) this.invincible--;
        
        // 自动攻击
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.attackCooldown <= 0 && enemies.length > 0) {
            this.attack(enemies, bullets);
        }
    }
    
    attack(enemies, bullets) {
        // 找最近敌人
        let nearest = null;
        let minDist = Infinity;
        
        for (let enemy of enemies) {
            const dist = Math.sqrt((enemy.x - this.x)**2 + (enemy.y - this.y)**2);
            if (dist < minDist) {
                minDist = dist;
                nearest = enemy;
            }
        }
        
        if (nearest && minDist < 400) { // 射程限制
            bullets.push(new Bullet(this.x, this.y, nearest.x, nearest.y, this.bulletDamage));
            this.attackCooldown = this.attackSpeed;
        }
    }
    
    gainExp(amount) {
        this.exp += amount;
        if (this.exp >= this.expToLevel) {
            this.exp -= this.expToLevel;
            this.level++;
            this.expToLevel = Math.floor(this.expToLevel * 1.2);
            return true;
        }
        return false;
    }
    
    takeDamage(damage) {
        if (this.invincible > 0) return false;
        this.hp -= damage;
        this.invincible = 60; // 1秒无敌
        return this.hp <= 0;
    }
    
    draw(ctx) {
        const img = Assets.images['player'] || Assets.images['cow'];
        if (!img) {
            ctx.fillStyle = this.invincible > 0 && Math.floor(Date.now() / 100) % 2 ? '#FFF' : '#FFE4C4';
            ctx.fillRect(this.x - 20, this.y - 30, 40, 60);
            return;
        }
        
        ctx.save();
        ctx.translate(this.x, this.y);
        
        // 无敌闪烁
        if (this.invincible > 0 && Math.floor(Date.now() / 50) % 2) {
            ctx.globalAlpha = 0.5;
        }
        
        if (this.facing === -1) {
            ctx.scale(-1, 1);
        }
        
        ctx.drawImage(img, -this.size/2, -this.size/2, this.size, this.size);
        ctx.restore();
    }
}

// 输入
const Input = {
    keys: {},
    init() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }
};

// ========== 游戏主循环 ==========
async function initGame() {
    // 加载图片（player.png或cow.png）
    try {
        await Assets.load('player', 'assets/bodies/player.png');
    } catch(e) {
        console.log('player.png not found, trying cow.png');
        await Assets.load('cow', 'assets/bodies/cow.png');
    }
    await Assets.load('enemy_pig', 'assets/enemy_pig.png');
    
    Input.init();
    const player = new Player();
    const enemies = [];
    const bullets = [];
    const expGems = [];
    
    // 游戏状态
    let gameTime = 0;
    let spawnTimer = 0;
    let isGameOver = false;
    
    // UI元素
    const ui = {
        hp: document.getElementById('hpDisplay'),
        level: document.getElementById('levelDisplay'),
        exp: document.getElementById('expDisplay'),
        enemyCount: document.getElementById('enemyCount'),
        time: document.getElementById('timeDisplay'),
        gameOver: document.getElementById('gameOver'),
        finalScore: document.getElementById('finalScore')
    };
    
    function spawnEnemy() {
        let ex, ey;
        const edge = Math.floor(Math.random() * 4);
        switch(edge) {
            case 0: ex = Math.random() * GAME_WIDTH; ey = -50; break;
            case 1: ex = GAME_WIDTH + 50; ey = Math.random() * GAME_HEIGHT; break;
            case 2: ex = Math.random() * GAME_WIDTH; ey = GAME_HEIGHT + 50; break;
            case 3: ex = -50; ey = Math.random() * GAME_HEIGHT; break;
        }
        enemies.push(new Enemy(ex, ey));
    }
    
    // 初始生成一些敌人
    for (let i = 0; i < 3; i++) spawnEnemy();
    
    let lastTime = 0;
    function loop(timestamp) {
        if (isGameOver) return;
        
        const deltaTime = timestamp - lastTime;
        lastTime = timestamp;
        
        gameTime += 1/60;
        
        // 清空画布
        ctx.fillStyle = '#2d1b2e';
        ctx.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
        
        // 绘制网格地板
        ctx.strokeStyle = '#3d2b3e';
        ctx.lineWidth = 2;
        const gridSize = 80;
        for (let x = 0; x < GAME_WIDTH; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, GAME_HEIGHT);
            ctx.stroke();
        }
        for (let y = 0; y < GAME_HEIGHT; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(GAME_WIDTH, y);
            ctx.stroke();
        }
        
        // 更新子弹
        for (let i = bullets.length - 1; i >= 0; i--) {
            const b = bullets[i];
            b.update();
            if (!b.active) {
                bullets.splice(i, 1);
                continue;
            }
            
            // 子弹击中敌人
            for (let j = enemies.length - 1; j >= 0; j--) {
                const e = enemies[j];
                const dist = Math.sqrt((b.x - e.x)**2 + (b.y - e.y)**2);
                if (dist < e.radius + b.radius) {
                    b.active = false;
                    if (e.takeDamage(b.damage)) {
                        // 敌人死亡，掉落经验
                        expGems.push(new ExpGem(e.x, e.y, 10 + player.level * 2));
                        enemies.splice(j, 1);
                    }
                    break;
                }
            }
        }
        
        // 更新经验宝石
        for (let i = expGems.length - 1; i >= 0; i--) {
            const gem = expGems[i];
            if (gem.update(player)) {
                if (player.gainExp(gem.value)) {
                    // 升级了
                    console.log('Level Up!');
                }
                expGems.splice(i, 1);
            }
        }
        
        // 生成新敌人
        spawnTimer++;
        if (spawnTimer > 120) { // 每2秒生成
            spawnEnemy();
            spawnTimer = 0;
        }
        
        // 更新敌人
        for (let i = enemies.length - 1; i >= 0; i--) {
            const e = enemies[i];
            e.update(player, enemies);
            
            // 碰撞玩家
            const dist = Math.sqrt((e.x - player.x)**2 + (e.y - player.y)**2);
            if (dist < e.radius + player.radius) {
                if (player.takeDamage(1)) {
                    isGameOver = true;
                    ui.gameOver.style.display = 'block';
                    const mins = Math.floor(gameTime / 60);
                    const secs = Math.floor(gameTime % 60);
                    ui.finalScore.innerHTML = `
                        <div>存活时间: ${mins}:${secs.toString().padStart(2, '0')}</div>
                        <div>等级: ${player.level}</div>
                        <div>击败敌人: ${Math.floor(gameTime * 10)}</div>
                    `;
                }
            }
        }
        
        // 绘制经验宝石
        for (let gem of expGems) gem.draw(ctx);
        
        // 绘制子弹
        for (let b of bullets) b.draw(ctx);
        
        // 绘制敌人
        for (let e of enemies) e.draw(ctx);
        
        // 更新和绘制玩家
        player.update(Input, enemies, bullets);
        player.draw(ctx);
        
        // 更新UI
        ui.hp.textContent = '❤️'.repeat(player.hp) + '🖤'.repeat(player.maxHp - player.hp);
        ui.level.textContent = player.level;
        ui.exp.textContent = `${Math.floor(player.exp)}/${player.expToLevel}`;
        ui.enemyCount.textContent = enemies.length;
        const mins = Math.floor(gameTime / 60);
        const secs = Math.floor(gameTime % 60);
        ui.time.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
        
        requestAnimationFrame(loop);
    }
    
    requestAnimationFrame(loop);
}

// 启动
initGame();
