// 肉鸽牛牛 - 核心游戏逻辑
// Rougelike Cow - Core Game Logic

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// 游戏配置
const GAME_CONFIG = {
    width: 800,
    height: 600,
    playerSpeed: 4,
    bulletSpeed: 8,
    bulletCooldown: 30, // 帧
    enemySpawnRate: 60, // 帧
    maxEnemies: 30,
    expToLevel: [100, 150, 200, 250, 300, 350, 400, 500, 600, 800],
};

// 资源加载
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
    },
    get(name) {
        return this.images[name];
    }
};

// 向量工具
const Vector = {
    distance(a, b) {
        return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    },
    normalize(x, y) {
        const len = Math.sqrt(x * x + y * y);
        return len > 0 ? { x: x / len, y: y / len } : { x: 0, y: 0 };
    }
};

// 玩家类
class Player {
    constructor() {
        this.x = GAME_CONFIG.width / 2;
        this.y = GAME_CONFIG.height / 2;
        this.width = 60;
        this.height = 60;
        this.speed = GAME_CONFIG.playerSpeed;
        this.hp = 3;
        this.maxHp = 3;
        this.level = 1;
        this.exp = 0;
        this.bulletCooldown = 0;
        this.bulletDamage = 1;
        this.bulletCount = 1;
        this.bulletSize = 1;
        this.attackSpeed = 1;
    }

    update(input, enemies, bullets) {
        // 移动
        let dx = 0, dy = 0;
        if (input.keys['w'] || input.keys['arrowup']) dy = -1;
        if (input.keys['s'] || input.keys['arrowdown']) dy = 1;
        if (input.keys['a'] || input.keys['arrowleft']) dx = -1;
        if (input.keys['d'] || input.keys['arrowright']) dx = 1;

        if (dx !== 0 || dy !== 0) {
            const norm = Vector.normalize(dx, dy);
            this.x += norm.x * this.speed;
            this.y += norm.y * this.speed;
        }

        // 边界限制
        this.x = Math.max(this.width/2, Math.min(GAME_CONFIG.width - this.width/2, this.x));
        this.y = Math.max(this.height/2, Math.min(GAME_CONFIG.height - this.height/2, this.y));

        // 自动攻击
        if (this.bulletCooldown > 0) this.bulletCooldown--;
        if (this.bulletCooldown <= 0 && enemies.length > 0) {
            this.attack(enemies, bullets);
        }
    }

    attack(enemies, bullets) {
        // 找到最近的敌人
        let nearest = null;
        let minDist = Infinity;
        
        for (const enemy of enemies) {
            const dist = Vector.distance(this, enemy);
            if (dist < minDist) {
                minDist = dist;
                nearest = enemy;
            }
        }

        if (nearest) {
            const dir = Vector.normalize(nearest.x - this.x, nearest.y - this.y);
            
            // 根据bulletCount发射多个子弹
            for (let i = 0; i < this.bulletCount; i++) {
                const angle = (i - (this.bulletCount - 1) / 2) * 0.3;
                const cos = Math.cos(angle);
                const sin = Math.sin(angle);
                const rotatedDir = {
                    x: dir.x * cos - dir.y * sin,
                    y: dir.x * sin + dir.y * cos
                };
                
                bullets.push(new Bullet(
                    this.x, this.y,
                    rotatedDir.x * GAME_CONFIG.bulletSpeed,
                    rotatedDir.y * GAME_CONFIG.bulletSpeed,
                    this.bulletDamage,
                    this.bulletSize
                ));
            }
            
            this.bulletCooldown = GAME_CONFIG.bulletCooldown / this.attackSpeed;
        }
    }

    gainExp(amount) {
        this.exp += amount;
        const needed = GAME_CONFIG.expToLevel[Math.min(this.level - 1, GAME_CONFIG.expToLevel.length - 1)];
        if (this.exp >= needed) {
            this.exp -= needed;
            this.level++;
            return true; // 升级了
        }
        return false;
    }

    heal(amount) {
        this.hp = Math.min(this.maxHp, this.hp + amount);
    }

    draw(ctx) {
        const img = Assets.get('player');
        if (img) {
            ctx.drawImage(img, this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        } else {
            // 备用绘制
            ctx.fillStyle = '#fff';
            ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        }
    }
}

// 子弹类
class Bullet {
    constructor(x, y, vx, vy, damage, size) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.damage = damage;
        this.size = size;
        this.radius = 8 * size;
        this.active = true;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        // 出界检查
        if (this.x < 0 || this.x > GAME_CONFIG.width ||
            this.y < 0 || this.y > GAME_CONFIG.height) {
            this.active = false;
        }
    }

    draw(ctx) {
        const img = Assets.get('bullet');
        const size = this.radius * 2;
        if (img) {
            ctx.drawImage(img, this.x - size/2, this.y - size/2, size, size);
        } else {
            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// 敌人类
class Enemy {
    constructor(type) {
        this.type = type;
        this.active = true;
        
        // 随机生成在屏幕边缘
        const edge = Math.floor(Math.random() * 4);
        switch(edge) {
            case 0: this.x = Math.random() * GAME_CONFIG.width; this.y = -30; break;
            case 1: this.x = GAME_CONFIG.width + 30; this.y = Math.random() * GAME_CONFIG.height; break;
            case 2: this.x = Math.random() * GAME_CONFIG.width; this.y = GAME_CONFIG.height + 30; break;
            case 3: this.x = -30; this.y = Math.random() * GAME_CONFIG.height; break;
        }

        if (type === 'chicken') {
            this.hp = 2;
            this.speed = 1.5;
            this.expValue = 10;
            this.width = 54;
            this.height = 54;
        } else if (type === 'pig') {
            this.hp = 4;
            this.speed = 1;
            this.expValue = 20;
            this.width = 60;
            this.height = 48;
        }
    }

    update(player) {
        // 向玩家移动
        const dir = Vector.normalize(player.x - this.x, player.y - this.y);
        this.x += dir.x * this.speed;
        this.y += dir.y * this.speed;
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
        const img = Assets.get(`enemy_${this.type}`);
        if (img) {
            ctx.drawImage(img, this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        } else {
            ctx.fillStyle = this.type === 'chicken' ? '#F4D03F' : '#F5B7B1';
            ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        }
    }
}

// 经验宝石类
class ExpGem {
    constructor(x, y, value) {
        this.x = x;
        this.y = y;
        this.value = value;
        this.radius = 12;
        this.active = true;
        this.magnetRange = 100;
        this.speed = 0;
        this.maxSpeed = 8;
    }

    update(player) {
        const dist = Vector.distance(this, player);
        
        // 磁力吸引
        if (dist < this.magnetRange) {
            this.speed = Math.min(this.speed + 0.5, this.maxSpeed);
            const dir = Vector.normalize(player.x - this.x, player.y - this.y);
            this.x += dir.x * this.speed;
            this.y += dir.y * this.speed;
        }

        // 拾取检测
        if (dist < this.radius + player.width/4) {
            this.active = false;
            return true;
        }
        return false;
    }

    draw(ctx) {
        const img = Assets.get('exp_gem');
        if (img) {
            ctx.drawImage(img, this.x - this.radius, this.y - this.radius, this.radius * 2, this.radius * 2);
        } else {
            ctx.fillStyle = '#3498DB';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// 输入处理
class Input {
    constructor() {
        this.keys = {};
        window.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
        });
        window.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
    }
}

// 升级选项
const UPGRADES = [
    {
        id: 'damage_up',
        name: '浓缩牛奶',
        desc: '子弹伤害 +1',
        apply(player) { player.bulletDamage += 1; }
    },
    {
        id: 'speed_up',
        name: '加速草料',
        desc: '移动速度 +20%',
        apply(player) { player.speed *= 1.2; }
    },
    {
        id: 'attack_speed',
        name: '双发奶嘴',
        desc: '攻击速度 +25%',
        apply(player) { player.attackSpeed *= 1.25; }
    },
    {
        id: 'multi_shot',
        name: '多重挤奶',
        desc: '子弹数量 +1',
        apply(player) { player.bulletCount += 1; }
    },
    {
        id: 'max_hp',
        name: '活力牧场',
        desc: '最大生命值 +1，回复满血',
        apply(player) { player.maxHp += 1; player.hp = player.maxHp; }
    },
    {
        id: 'bullet_size',
        name: '大奶瓶',
        desc: '子弹尺寸 +50%，伤害 +20%',
        apply(player) { player.bulletSize *= 1.5; player.bulletDamage *= 1.2; }
    }
];

// 游戏主类
class Game {
    constructor() {
        this.player = new Player();
        this.input = new Input();
        this.bullets = [];
        this.enemies = [];
        this.expGems = [];
        this.particles = [];
        
        this.frame = 0;
        this.spawnTimer = 0;
        this.gameTime = 0;
        this.paused = false;
        this.levelUpPending = false;
        
        this.ui = {
            hp: document.getElementById('hpDisplay'),
            level: document.getElementById('levelDisplay'),
            exp: document.getElementById('expDisplay'),
            time: document.getElementById('timeDisplay'),
            levelUpMenu: document.getElementById('levelUpMenu'),
            upgradeOptions: document.getElementById('upgradeOptions')
        };
    }

    async init() {
        // 加载资源
        await Promise.all([
            Assets.load('player', 'assets/player.png'),
            Assets.load('enemy_chicken', 'assets/enemy_chicken.png'),
            Assets.load('enemy_pig', 'assets/enemy_pig.png'),
            Assets.load('bullet', 'assets/bullet.png'),
            Assets.load('exp_gem', 'assets/exp_gem.png'),
        ]);
        
        this.loop();
    }

    spawnEnemy() {
        if (this.enemies.length >= GAME_CONFIG.maxEnemies) return;
        
        // 根据游戏时间决定敌人类型
        const type = Math.random() < 0.7 ? 'chicken' : 'pig';
        this.enemies.push(new Enemy(type));
    }

    update() {
        if (this.paused || this.levelUpPending) return;

        this.frame++;
        this.gameTime += 1/60;

        // 生成敌人
        this.spawnTimer++;
        if (this.spawnTimer >= GAME_CONFIG.enemySpawnRate) {
            this.spawnEnemy();
            this.spawnTimer = 0;
        }

        // 更新玩家
        this.player.update(this.input, this.enemies, this.bullets);

        // 更新子弹
        this.bullets = this.bullets.filter(b => b.active);
        for (const bullet of this.bullets) {
            bullet.update();
        }

        // 更新敌人
        this.enemies = this.enemies.filter(e => e.active);
        for (const enemy of this.enemies) {
            enemy.update(this.player);

            // 碰撞检测 - 敌人撞玩家
            if (Vector.distance(enemy, this.player) < enemy.width/2 + this.player.width/4) {
                this.player.hp -= 1;
                enemy.active = false; // 敌人死亡
                
                if (this.player.hp <= 0) {
                    this.gameOver();
                }
            }

            // 子弹击中敌人
            for (const bullet of this.bullets) {
                if (Vector.distance(bullet, enemy) < bullet.radius + enemy.width/3) {
                    bullet.active = false;
                    if (enemy.takeDamage(bullet.damage)) {
                        // 敌人死亡，掉落经验
                        this.expGems.push(new ExpGem(enemy.x, enemy.y, enemy.expValue));
                    }
                    break;
                }
            }
        }

        // 更新经验宝石
        this.expGems = this.expGems.filter(g => g.active);
        for (const gem of this.expGems) {
            if (gem.update(this.player)) {
                // 拾取了经验
                if (this.player.gainExp(gem.value)) {
                    this.showLevelUp();
                }
            }
        }

        this.updateUI();
    }

    showLevelUp() {
        this.levelUpPending = true;
        this.ui.levelUpMenu.style.display = 'block';
        
        // 随机选3个升级
        const options = UPGRADES.sort(() => Math.random() - 0.5).slice(0, 3);
        
        this.ui.upgradeOptions.innerHTML = options.map((upgrade, idx) => `
            <div class="upgradeOption" data-idx="${idx}">
                <div class="name">${upgrade.name}</div>
                <div class="desc">${upgrade.desc}</div>
            </div>
        `).join('');

        // 绑定点击事件
        this.ui.upgradeOptions.querySelectorAll('.upgradeOption').forEach((el, idx) => {
            el.addEventListener('click', () => {
                options[idx].apply(this.player);
                this.levelUpPending = false;
                this.ui.levelUpMenu.style.display = 'none';
            });
        });
    }

    updateUI() {
        // 生命值显示
        this.ui.hp.textContent = '❤️'.repeat(this.player.hp) + '🖤'.repeat(this.player.maxHp - this.player.hp);
        
        // 等级
        this.ui.level.textContent = this.player.level;
        
        // 经验
        const needed = GAME_CONFIG.expToLevel[Math.min(this.player.level - 1, GAME_CONFIG.expToLevel.length - 1)];
        this.ui.exp.textContent = `${Math.floor(this.player.exp)}/${needed}`;
        
        // 时间
        const mins = Math.floor(this.gameTime / 60);
        const secs = Math.floor(this.gameTime % 60);
        this.ui.time.textContent = `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    draw() {
        // 清空画布
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

        // 绘制地板格子（装饰）
        ctx.fillStyle = '#16213e';
        for (let x = 0; x < GAME_CONFIG.width; x += 64) {
            for (let y = 0; y < GAME_CONFIG.height; y += 64) {
                if ((x + y) % 128 === 0) {
                    ctx.fillRect(x, y, 64, 64);
                }
            }
        }

        // 绘制经验宝石
        for (const gem of this.expGems) {
            gem.draw(ctx);
        }

        // 绘制子弹
        for (const bullet of this.bullets) {
            bullet.draw(ctx);
        }

        // 绘制敌人
        for (const enemy of this.enemies) {
            enemy.draw(ctx);
        }

        // 绘制玩家
        this.player.draw(ctx);
    }

    gameOver() {
        this.paused = true;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
        ctx.fillStyle = '#e74c3c';
        ctx.font = 'bold 48px Courier';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', GAME_CONFIG.width/2, GAME_CONFIG.height/2 - 30);
        ctx.fillStyle = '#fff';
        ctx.font = '24px Courier';
        ctx.fillText(`存活时间: ${this.ui.time.textContent}`, GAME_CONFIG.width/2, GAME_CONFIG.height/2 + 20);
        ctx.fillText('刷新页面重新开始', GAME_CONFIG.width/2, GAME_CONFIG.height/2 + 60);
    }

    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }
}

// 启动游戏
const game = new Game();
game.init();
