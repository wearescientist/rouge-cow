/**
 * 肉鸽牛牛 - 带精灵的完整游戏演示
 * 使用真实像素模型
 */

// ==================== 增强版玩家 ====================
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 32;
        this.maxHealth = 6;
        this.health = 6;
        this.gold = 0;
        this.keys = 0;
        this.maxWeaponSlots = 6;
        
        // 移动
        this.vx = 0;
        this.vy = 0;
        this.speed = 150;
        
        // 状态
        this.canFly = false;
        this.canPhaseWall = false;
        this.invincible = 0;
        
        // 动画
        this.facingRight = true;
        this.walkTimer = 0;
        this.isMoving = false;
    }

    update(dt, itemManager, input) {
        // 移动速度受道具影响
        const speedMultiplier = itemManager.getEffectValue("moveSpeed");
        const finalSpeed = this.speed * speedMultiplier;

        // 输入处理
        this.vx = 0;
        this.vy = 0;
        
        if (input.keys['w'] || input.keys['ArrowUp']) this.vy = -finalSpeed;
        if (input.keys['s'] || input.keys['ArrowDown']) this.vy = finalSpeed;
        if (input.keys['a'] || input.keys['ArrowLeft']) { this.vx = -finalSpeed; this.facingRight = false; }
        if (input.keys['d'] || input.keys['ArrowRight']) { this.vx = finalSpeed; this.facingRight = true; }

        // 应用移动
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // 动画状态
        this.isMoving = this.vx !== 0 || this.vy !== 0;
        if (this.isMoving) {
            this.walkTimer += dt * 10;
        }

        // 无敌时间递减
        if (this.invincible > 0) this.invincible -= dt;

        // 更新飞行状态
        this.canFly = itemManager.getEffectValue("canFly");

        // 边界限制
        this.x = Math.max(16, Math.min(900 - 16, this.x));
        this.y = Math.max(16, Math.min(600 - 16, this.y));
    }

    draw(ctx, spriteManager, itemManager) {
        // 飞行时绘制阴影（如果在地面上）
        if (!this.canFly) {
            ctx.fillStyle = "rgba(0,0,0,0.2)";
            ctx.beginPath();
            ctx.ellipse(this.x, this.y + 12, 10, 4, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // 飞行时有翅膀效果（上下浮动）
            const floatY = Math.sin(Date.now() / 200) * 3;
            ctx.save();
            ctx.globalAlpha = 0.3;
            ctx.fillStyle = "rgba(0,0,0,0.2)";
            ctx.beginPath();
            ctx.ellipse(this.x, this.y + 15, 8, 3, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
            
            // 绘制玩家（带浮动）
            spriteManager.draw(ctx, 'player_cow', this.x - 16, this.y - 16 + floatY, {
                width: 32,
                height: 32,
                flipX: !this.facingRight
            });
            return;
        }

        // 普通状态绘制
        spriteManager.draw(ctx, 'player_cow', this.x - 16, this.y - 16, {
            width: 32,
            height: 32,
            flipX: !this.facingRight
        });

        // 受伤闪烁
        if (this.invincible > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.fillStyle = "rgba(255,0,0,0.3)";
            ctx.fillRect(this.x - 16, this.y - 16, 32, 32);
        }
    }

    takeDamage(amount) {
        if (this.invincible > 0) return false;
        this.health -= amount;
        this.invincible = 1.0; // 1秒无敌
        return true;
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }
}

// ==================== 敌人类 ====================
class Enemy {
    constructor(x, y, config) {
        this.x = x;
        this.y = y;
        this.config = config;
        this.width = 32;
        this.height = 32;
        
        this.hp = config.hp;
        this.maxHp = config.hp;
        this.speed = config.speed;
        this.damage = config.damage;
        this.exp = config.exp;
        
        this.vx = 0;
        this.vy = 0;
        this.facingRight = true;
        
        // 动画
        this.animOffset = Math.random() * 1000;
        this.hitFlash = 0;
    }

    update(dt, player) {
        // 简单的追踪AI
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            this.vx = (dx / dist) * this.speed;
            this.vy = (dy / dist) * this.speed;
            this.facingRight = this.vx > 0;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // 受伤闪烁递减
        if (this.hitFlash > 0) this.hitFlash -= dt;
    }

    draw(ctx, spriteManager) {
        // 绘制阴影
        ctx.fillStyle = "rgba(0,0,0,0.15)";
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 12, 10, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // 绘制敌人（带轻微浮动动画）
        const floatY = Math.sin((Date.now() + this.animOffset) / 300) * 1;
        
        spriteManager.draw(ctx, this.config.id, this.x - 16, this.y - 16 + floatY, {
            width: 32,
            height: 32,
            flipX: !this.facingRight,
            tint: this.hitFlash > 0 ? 'rgba(255,0,0,0.5)' : null
        });

        // 血条（精英和Boss显示）
        if (this.config.hp >= 30 || this.hp < this.maxHp) {
            const barWidth = 24;
            const hpPercent = this.hp / this.maxHp;
            
            ctx.fillStyle = "#333";
            ctx.fillRect(this.x - barWidth / 2, this.y - 22, barWidth, 4);
            
            ctx.fillStyle = hpPercent > 0.5 ? "#0f0" : hpPercent > 0.25 ? "#ff0" : "#f00";
            ctx.fillRect(this.x - barWidth / 2, this.y - 22, barWidth * hpPercent, 4);
        }
    }

    takeDamage(amount) {
        this.hp -= amount;
        this.hitFlash = 0.2;
        return this.hp <= 0;
    }
}

// ==================== 增强版房间 ====================
class GameRoom {
    constructor(id, type, wave) {
        this.id = id;
        this.type = type;
        this.wave = wave;
        this.isCleared = false;
        this.enemies = [];
        this.spawnTimer = 0;
        this.spawnInterval = 2; // 每2秒刷一波
        this.totalSpawned = 0;
        this.maxEnemies = 5 + wave * 2;
    }

    start(spriteManager) {
        // 根据房间类型生成敌人
        const enemyCount = this.type === 'boss' ? 1 : 
                          this.type === 'treasure' ? 0 : 
                          Math.min(3 + Math.floor(this.wave / 2), 8);

        for (let i = 0; i < enemyCount; i++) {
            this.spawnEnemy(spriteManager);
        }
    }

    spawnEnemy(spriteManager) {
        if (this.totalSpawned >= this.maxEnemies) return;

        // 随机位置（在屏幕边缘）
        const side = Math.floor(Math.random() * 4);
        let x, y;
        switch (side) {
            case 0: x = Math.random() * 900; y = -20; break;
            case 1: x = 920; y = Math.random() * 600; break;
            case 2: x = Math.random() * 900; y = 620; break;
            case 3: x = -20; y = Math.random() * 600; break;
        }

        const config = this.type === 'boss' ? 
            spriteManager.getBossForWave(this.wave) :
            spriteManager.getRandomEnemy(this.wave);

        this.enemies.push(new Enemy(x, y, config));
        this.totalSpawned++;
    }

    update(dt, player, spriteManager) {
        // 更新敌人
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(dt, player);

            // 碰撞检测
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 20) {
                player.takeDamage(enemy.damage);
            }
        }

        // 持续刷怪
        if (!this.isCleared && this.type !== 'boss' && this.type !== 'treasure') {
            this.spawnTimer += dt;
            if (this.spawnTimer >= this.spawnInterval) {
                this.spawnTimer = 0;
                if (this.enemies.length < 5) {
                    this.spawnEnemy(spriteManager);
                }
            }
        }

        // 检查清理
        if (!this.isCleared && this.enemies.length === 0 && this.totalSpawned >= this.maxEnemies) {
            this.isCleared = true;
            return true; // 返回true表示房间刚刚被清理
        }

        return false;
    }

    draw(ctx, spriteManager) {
        // 绘制所有敌人
        for (const enemy of this.enemies) {
            enemy.draw(ctx, spriteManager);
        }
    }

    removeEnemy(index) {
        this.enemies.splice(index, 1);
    }
}

// ==================== 完整游戏类 ====================
class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.width = canvas.width;
        this.height = canvas.height;

        // 系统初始化
        this.spriteManager = new SpriteManager();
        this.itemManager = null;
        this.rewardManager = null;
        this.itemSelectionUI = null;

        // 游戏对象
        this.player = null;
        this.rooms = [];
        this.currentRoom = null;
        this.roomIndex = 0;

        // 输入
        this.keys = {};
        this.mouse = { x: 0, y: 0, clicked: false };

        // 游戏状态
        this.gameTime = 0;
        this.lastTime = 0;
        this.running = false;
        this.loaded = false;

        this.setupInput();
    }

    async init() {
        // 加载精灵
        await this.spriteManager.loadAll();
        
        // 初始化系统
        this.player = new Player(450, 300);
        this.itemManager = new ItemManager(this.player);
        this.rewardManager = new RoomRewardManager(this.itemManager);
        this.itemSelectionUI = new ItemSelectionUI(this.itemManager);

        // 生成房间
        this.generateRooms();

        this.loaded = true;
        this.running = true;
        requestAnimationFrame(t => this.loop(t));

        console.log("%c🐮 游戏加载完成！", "font-size:20px;color:#4488ff");
        this.showHelp();
    }

    generateRooms() {
        const roomTypes = ['normal', 'normal', 'boss', 'treasure', 'normal', 'boss'];
        this.rooms = roomTypes.map((type, i) => new GameRoom(i + 1, type, i + 1));
        this.currentRoom = this.rooms[0];
        this.currentRoom.start(this.spriteManager);
    }

    setupInput() {
        window.addEventListener("keydown", e => {
            this.keys[e.key] = true;
            this.handleDebugKeys(e.key);
        });
        window.addEventListener("keyup", e => this.keys[e.key] = false);

        const rect = this.canvas.getBoundingClientRect();
        this.canvas.addEventListener("mousemove", e => {
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        this.canvas.addEventListener("mousedown", () => this.mouse.clicked = true);
        this.canvas.addEventListener("mouseup", () => this.mouse.clicked = false);
    }

    handleDebugKeys(key) {
        if (key >= "1" && key <= "9") {
            this.giveItem(parseInt(key));
        }
        if (key === "0") {
            this.giveItem(Math.floor(Math.random() * 100) + 1);
        }
        if (key === "r" || key === "R") {
            this.nextRoom();
        }
        if (key === "s" || key === "S") {
            this.showStats();
        }
        if (key === "h" || key === "H") {
            this.showHelp();
        }
    }

    giveItem(itemId) {
        const success = this.itemManager.acquireItem(itemId);
        if (success) {
            const item = ITEMS_DATABASE[itemId];
            // 这里可以添加粒子效果
            console.log(`获得: ${item.icon} ${item.name}`);
        }
    }

    nextRoom() {
        // 强制清理当前房间
        this.currentRoom.isCleared = true;
        this.currentRoom.enemies = [];

        // 尝试给奖励
        const success = this.rewardManager.giveReward(
            this.currentRoom, this.player, this.itemSelectionUI
        );

        // 进入下一房间
        this.roomIndex++;
        if (this.roomIndex < this.rooms.length) {
            this.currentRoom = this.rooms[this.roomIndex];
            this.currentRoom.start(this.spriteManager);
            console.log(`进入房间 ${this.currentRoom.id} (${this.currentRoom.type})`);
        } else {
            console.log("🎉 所有房间完成！");
        }
    }

    showStats() {
        const stats = this.itemManager.recalculateStats();
        console.log("=== 当前属性 ===");
        console.log(`生命: ${this.player.health}/${this.player.maxHealth}`);
        console.log(`金币: ${this.player.gold}`);
        console.log(`发射物: ${stats.projectileCount + 1}`);
        console.log(`暴击: ${(stats.critChance * 100).toFixed(1)}%`);
        console.log(`移速: ${(stats.moveSpeed * 100).toFixed(0)}%`);
    }

    showHelp() {
        console.log(`
🐮 肉鸽牛牛 - 操作指南
===================
移动: WASD / 方向键
获得道具: 1-9 (指定ID), 0 (随机)
下一房间: R
属性统计: S
帮助: H

当前房间: ${this.currentRoom?.id} / ${this.rooms.length}
类型: ${this.currentRoom?.type}
        `);
    }

    update(dt) {
        if (!this.loaded) return;

        this.gameTime += dt;

        // 更新玩家
        this.player.update(dt, this.itemManager, { keys: this.keys });

        // 更新房间
        const justCleared = this.currentRoom.update(dt, this.player, this.spriteManager);
        if (justCleared) {
            console.log(`房间 ${this.currentRoom.id} 已清理！按 R 进入下一间`);
        }

        // 更新UI
        this.itemSelectionUI.update(dt);
        this.itemSelectionUI.handleInput({
            mouse: this.mouse,
            keys: { justPressed: this.keys },
            canvasWidth: this.width,
            canvasHeight: this.height
        });

        this.mouse.clicked = false;
    }

    draw() {
        if (!this.loaded) {
            this.drawLoading();
            return;
        }

        const ctx = this.ctx;

        // 清空
        ctx.fillStyle = "#1a1a2e";
        ctx.fillRect(0, 0, this.width, this.height);

        // 绘制房间背景（根据类型）
        this.drawRoomBackground(ctx);

        // 绘制房间内容
        this.currentRoom.draw(ctx, this.spriteManager);

        // 绘制玩家
        this.player.draw(ctx, this.spriteManager, this.itemManager);

        // 绘制UI
        this.drawHUD(ctx);

        // 绘制选择界面
        this.itemSelectionUI.draw(ctx, this.width, this.height);
    }

    drawLoading() {
        const ctx = this.ctx;
        ctx.fillStyle = "#0a0a14";
        ctx.fillRect(0, 0, this.width, this.height);
        
        ctx.fillStyle = "#4488ff";
        ctx.font = "24px Arial";
        ctx.textAlign = "center";
        ctx.fillText("🐮 加载中...", this.width / 2, this.height / 2);
    }

    drawRoomBackground(ctx) {
        const colors = {
            normal: "#1a1a2e",
            boss: "#2a1a1a",
            treasure: "#1a2a1a",
            shop: "#2a2a1a"
        };
        
        ctx.fillStyle = colors[this.currentRoom?.type] || colors.normal;
        ctx.fillRect(0, 0, this.width, this.height);

        // 绘制房间边框
        ctx.strokeStyle = this.currentRoom?.isCleared ? "#0f0" : "#444";
        ctx.lineWidth = 4;
        ctx.strokeRect(10, 10, this.width - 20, this.height - 20);

        // 房间类型标识
        ctx.fillStyle = "#fff";
        ctx.font = "16px Arial";
        ctx.textAlign = "left";
        const typeNames = { normal: "普通", boss: "BOSS", treasure: "宝箱", shop: "商店" };
        ctx.fillText(`${typeNames[this.currentRoom?.type]} 房间 ${this.currentRoom?.id}`, 20, 35);
    }

    drawHUD(ctx) {
        // 生命值
        ctx.fillStyle = "#fff";
        ctx.font = "20px Arial";
        ctx.textAlign = "left";
        let hearts = "❤️".repeat(Math.max(0, this.player.health));
        ctx.fillText(hearts, 20, this.height - 20);

        // 金币
        ctx.fillText(`💰 ${this.player.gold}`, 150, this.height - 20);

        // 敌人数
        ctx.textAlign = "right";
        ctx.fillText(`敌人: ${this.currentRoom?.enemies?.length || 0}`, this.width - 20, 35);

        // 道具数
        const itemCount = Object.keys(this.itemManager.ownedItems).length;
        ctx.fillText(`道具: ${itemCount}`, this.width - 20, 60);
    }

    loop(timestamp) {
        if (!this.running) return;

        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
        this.lastTime = timestamp;

        this.update(dt);
        this.draw();

        requestAnimationFrame(t => this.loop(t));
    }
}

// ==================== 导出 ====================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Game, Player, Enemy, GameRoom };
}
