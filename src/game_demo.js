/**
 * 肉鸽牛牛 - 道具系统演示
 * 展示100个道具系统的完整使用方式
 */

// ==================== 模拟游戏环境 ====================
class MockPlayer {
    constructor() {
        this.x = 400;
        this.y = 300;
        this.maxHealth = 6;
        this.health = 6;
        this.gold = 0;
        this.keys = 0;
        this.maxWeaponSlots = 6;
        this.canFly = false;
        this.canPhaseWall = false;
        
        // 武器配置
        this.weapons = [];
        this.weaponStats = {
            projectileCount: 1,
            projectileSize: 1,
            fireRate: 1,
            pierceCount: 0,
            critChance: 0,
            damage: 10
        };
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }
}

class MockRoom {
    constructor(id, type, wave) {
        this.id = id;
        this.type = type; // normal, boss, treasure, secret, shop
        this.wave = wave;
        this.isCleared = false;
        this.enemies = [];
    }

    clear() {
        this.isCleared = true;
        this.enemies = [];
    }
}

// ==================== 游戏主类（演示版） ====================
class GameDemo {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext("2d");
        this.width = canvas.width;
        this.height = canvas.height;

        // 初始化玩家
        this.player = new MockPlayer();

        // 初始化道具系统
        this.itemManager = new ItemManager(this.player);
        
        // 初始化视觉系统
        this.particles = new ParticleSystem();
        this.notifications = new ItemNotification();
        this.itemSelectionUI = new ItemSelectionUI(this.itemManager);
        this.itemHUD = new ItemHUD(this.itemManager);

        // 初始化房间奖励系统
        this.rewardManager = new RoomRewardManager(this.itemManager);
        this.synergyHints = new ItemSynergyHints(this.itemManager);

        // 游戏状态
        this.rooms = [];
        this.currentRoom = null;
        this.currentPedestals = []; // 当前房间的道具底座
        this.gameTime = 0;
        this.lastTime = 0;

        // 输入
        this.keys = {};
        this.mouse = { x: 0, y: 0, clicked: false };

        this.setupInput();
        this.generateTestRooms();
        
        // 开始游戏循环
        this.running = true;
        requestAnimationFrame(t => this.loop(t));
    }

    setupInput() {
        // 键盘
        window.addEventListener("keydown", e => {
            this.keys[e.key] = true;
            
            // 测试快捷键
            this.handleDebugKeys(e.key);
        });
        window.addEventListener("keyup", e => {
            this.keys[e.key] = false;
        });

        // 鼠标
        this.canvas.addEventListener("mousemove", e => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        this.canvas.addEventListener("mousedown", () => {
            this.mouse.clicked = true;
        });
        this.canvas.addEventListener("mouseup", () => {
            this.mouse.clicked = false;
        });
    }

    // 调试快捷键
    handleDebugKeys(key) {
        // 数字键1-9: 直接获得对应ID的道具
        if (key >= "1" && key <= "9") {
            const itemId = parseInt(key);
            this.giveItem(itemId);
        }
        
        // 0: 随机获得一个道具
        if (key === "0") {
            const randomId = Math.floor(Math.random() * 100) + 1;
            this.giveItem(randomId);
        }

        // R: 清理当前房间（触发奖励）
        if (key === "r" || key === "R") {
            this.clearCurrentRoom();
        }

        // S: 显示道具统计
        if (key === "s" || key === "S") {
            this.showItemStats();
        }

        // C: 清空所有道具
        if (key === "c" || key === "C") {
            this.itemManager.ownedItems = {};
            this.itemManager.needsRecalculation = true;
            console.log("已清空所有道具");
        }

        // H: 显示帮助
        if (key === "h" || key === "H") {
            this.showHelp();
        }
    }

    giveItem(itemId) {
        const item = ITEMS_DATABASE[itemId];
        if (!item) return;

        const success = this.itemManager.acquireItem(itemId);
        if (success) {
            // 视觉反馈
            this.particles.createItemAcquireBurst(this.player.x, this.player.y, item.rarity);
            this.notifications.show(item, this.player.x, this.player.y);
            
            // 检查组合
            const synergies = this.synergyHints.getActiveSynergies();
            if (synergies.length > 0) {
                console.log(`激活组合: ${synergies.map(s => s.name).join(", ")}`);
            }
        }
    }

    generateTestRooms() {
        // 生成测试房间
        this.rooms = [
            new MockRoom(1, "normal", 1),
            new MockRoom(2, "normal", 2),
            new MockRoom(3, "boss", 3),
            new MockRoom(4, "treasure", 3),
            new MockRoom(5, "secret", 4),
            new MockRoom(6, "normal", 5)
        ];
        this.currentRoom = this.rooms[0];
    }

    clearCurrentRoom() {
        if (!this.currentRoom) return;
        
        this.currentRoom.clear();
        
        // 尝试给予奖励
        const success = this.rewardManager.giveReward(
            this.currentRoom, 
            this.player, 
            this.itemSelectionUI
        );

        if (success) {
            console.log(`房间 ${this.currentRoom.id} 清理完成，奖励已生成`);
        } else {
            console.log(`房间 ${this.currentRoom.id} 清理完成，无奖励`);
        }

        // 前进到下一个房间
        const nextIndex = this.rooms.indexOf(this.currentRoom) + 1;
        if (nextIndex < this.rooms.length) {
            this.currentRoom = this.rooms[nextIndex];
            console.log(`进入房间 ${this.currentRoom.id} (${this.currentRoom.type})`);
        }
    }

    showItemStats() {
        const stats = this.itemManager.recalculateStats();
        const owned = this.itemManager.getOwnedItemsList();
        
        console.log("=== 当前道具统计 ===");
        console.log(`持有道具数: ${owned.length}`);
        console.log("道具列表:", owned.map(i => `${i.icon}${i.name}x${i.count}`).join(", "));
        console.log("--- 关键属性 ---");
        console.log(`发射物数量: ${stats.projectileCount + 1}`);
        console.log(`子弹尺寸: ${(stats.projectileSize * 100).toFixed(0)}%`);
        console.log(`攻击速度: ${(stats.fireRate * 100).toFixed(0)}%`);
        console.log(`暴击率: ${(stats.critChance * 100).toFixed(1)}%`);
        console.log(`闪避率: ${(stats.dodgeChance * 100).toFixed(1)}%`);
        console.log(`移动速度: ${(stats.moveSpeed * 100).toFixed(0)}%`);
        console.log(`金币获取: ${(stats.goldGain * 100).toFixed(0)}%`);
        console.log(`生命偷取: ${(stats.lifeSteal * 100).toFixed(0)}%`);
        console.log(`能否飞行: ${stats.canFly ? "是" : "否"}`);
        console.log(`能否穿墙: ${stats.canPhaseWall ? "是" : "否"}`);
        
        const synergies = this.synergyHints.getActiveSynergies();
        if (synergies.length > 0) {
            console.log("--- 激活的组合 ---");
            synergies.forEach(s => console.log(`✨ ${s.name}: ${s.effect}`));
        }
    }

    showHelp() {
        console.log(`
=== 肉鸽牛牛 道具系统演示 ===
快捷键:
  1-9: 获得对应ID的道具
  0: 随机获得一个道具
  R: 清理当前房间，触发奖励
  S: 显示道具统计
  C: 清空所有道具
  H: 显示帮助

当前房间: ${this.currentRoom?.id} (${this.currentRoom?.type})
        `);
    }

    update(dt) {
        this.gameTime += dt;

        // 更新粒子
        this.particles.update();

        // 更新通知
        this.notifications.update(dt);

        // 更新选择UI
        this.itemSelectionUI.update(dt);

        // 更新底座
        this.currentPedestals.forEach(p => p.update());

        // 处理选择UI输入
        if (this.itemSelectionUI.visible) {
            this.itemSelectionUI.handleInput({
                mouse: this.mouse,
                keys: { justPressed: this.keys },
                canvasWidth: this.width,
                canvasHeight: this.height
            });
        }

        // 玩家移动（WASD）
        const speed = 200 * this.itemManager.getEffectValue("moveSpeed") * dt;
        if (this.keys["w"] || this.keys["ArrowUp"]) this.player.y -= speed;
        if (this.keys["s"] || this.keys["ArrowDown"]) this.player.y += speed;
        if (this.keys["a"] || this.keys["ArrowLeft"]) this.player.x -= speed;
        if (this.keys["d"] || this.keys["ArrowRight"]) this.player.x += speed;

        // 边界限制
        this.player.x = Math.max(20, Math.min(this.width - 20, this.player.x));
        this.player.y = Math.max(20, Math.min(this.height - 20, this.player.y));

        // 重置点击状态
        this.mouse.clicked = false;
    }

    draw() {
        const ctx = this.ctx;

        // 清空画布
        ctx.fillStyle = "#1a1a2e";
        ctx.fillRect(0, 0, this.width, this.height);

        // 绘制房间信息
        this.drawRoomInfo(ctx);

        // 绘制玩家
        this.drawPlayer(ctx);

        // 绘制粒子
        this.particles.draw(ctx);

        // 绘制通知
        this.notifications.draw(ctx);

        // 绘制道具栏
        this.itemHUD.draw(ctx, 10, this.height - 60);

        // 绘制选择UI
        this.itemSelectionUI.draw(ctx, this.width, this.height);

        // 绘制帮助信息
        this.drawHelp(ctx);

        // 绘制组合提示
        this.drawActiveSynergies(ctx);
    }

    drawRoomInfo(ctx) {
        ctx.save();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "left";
        
        const roomTypeNames = {
            normal: "普通房间",
            boss: "Boss房间",
            treasure: "宝箱房",
            secret: "隐藏房",
            shop: "商店"
        };

        ctx.fillText(`房间 ${this.currentRoom?.id}: ${roomTypeNames[this.currentRoom?.type]}`, 20, 30);
        ctx.fillText(`波数: ${this.currentRoom?.wave}`, 20, 55);
        ctx.fillText(`状态: ${this.currentRoom?.isCleared ? "已清理" : "有敌人"}`, 20, 80);
        
        // 玩家状态
        ctx.fillText(`❤️ ${this.player.health}/${this.player.maxHealth}`, 20, 120);
        ctx.fillText(`💰 ${this.player.gold}`, 20, 145);
        ctx.fillText(`道具数: ${Object.keys(this.itemManager.ownedItems).length}`, 20, 170);

        ctx.restore();
    }

    drawPlayer(ctx) {
        ctx.save();

        // 检查是否飞行
        const canFly = this.itemManager.getEffectValue("canFly");
        
        // 绘制阴影（非飞行状态）
        if (!canFly) {
            ctx.fillStyle = "rgba(0,0,0,0.3)";
            ctx.beginPath();
            ctx.ellipse(this.player.x, this.player.y + 15, 15, 5, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // 绘制玩家（牛牛）
        ctx.font = "40px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        
        // 飞行时有翅膀
        if (canFly) {
            ctx.fillText("🐮🪽", this.player.x, this.player.y);
        } else {
            ctx.fillText("🐮", this.player.x, this.player.y);
        }

        // 绘制持有道具的光环效果
        const items = this.itemManager.getOwnedItemsList();
        if (items.length > 0) {
            const lastItem = items[items.length - 1];
            // this.particles.createItemAura(this.player.x, this.player.y, lastItem.id);
        }

        ctx.restore();
    }

    drawHelp(ctx) {
        ctx.save();
        ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
        ctx.fillRect(this.width - 220, 10, 210, 200);
        
        ctx.fillStyle = "#ffffff";
        ctx.font = "14px Arial";
        ctx.textAlign = "left";
        
        const helpText = [
            "快捷键:",
            "1-9: 获得道具ID 1-9",
            "0: 随机道具",
            "R: 清理房间",
            "S: 道具统计",
            "C: 清空道具",
            "H: 帮助",
            "",
            "WASD: 移动",
            "鼠标: 选择UI"
        ];

        helpText.forEach((line, i) => {
            ctx.fillText(line, this.width - 210, 30 + i * 20);
        });

        ctx.restore();
    }

    drawActiveSynergies(ctx) {
        const synergies = this.synergyHints.getActiveSynergies();
        if (synergies.length === 0) return;

        ctx.save();
        ctx.fillStyle = "#FFD700";
        ctx.font = "bold 16px Arial";
        ctx.textAlign = "center";

        synergies.forEach((s, i) => {
            ctx.fillText(`✨ ${s.name}`, this.width / 2, this.height - 100 - i * 25);
        });

        ctx.restore();
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

// ==================== HTML页面 ====================
function createDemoHTML() {
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>肉鸽牛牛 - 100道具系统演示</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            background: #0a0a14;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            font-family: Arial, sans-serif;
            color: #fff;
        }
        h1 {
            margin-bottom: 20px;
            text-align: center;
        }
        canvas {
            border: 2px solid #444;
            box-shadow: 0 0 20px rgba(68, 136, 255, 0.5);
        }
        .info {
            margin-top: 20px;
            text-align: center;
            color: #888;
        }
        .rarity-legend {
            display: flex;
            gap: 20px;
            margin-top: 10px;
            font-size: 14px;
        }
        .rarity-common { color: #888; }
        .rarity-rare { color: #4488ff; }
        .rarity-epic { color: #aa44ff; }
        .rarity-legendary { color: #ffcc00; }
        .rarity-cursed { color: #ff4444; }
    </style>
</head>
<body>
    <h1>🐮 肉鸽牛牛 - 100道具系统演示</h1>
    <canvas id="gameCanvas" width="900" height="600"></canvas>
    <div class="info">
        <p>按 H 查看所有快捷键 | 按 1-9 快速获得道具 | 按 R 清理房间获得奖励</p>
        <div class="rarity-legend">
            <span class="rarity-common">⚪ 普通</span>
            <span class="rarity-rare">🔵 稀有</span>
            <span class="rarity-epic">🟣 史诗</span>
            <span class="rarity-legendary">🟡 传说</span>
            <span class="rarity-cursed">🔴 诅咒</span>
        </div>
    </div>

    <script src="items_system.js"></script>
    <script src="items_visual.js"></script>
    <script src="room_rewards.js"></script>
    <script src="game_demo.js"></script>
    <script>
        // 启动游戏
        const canvas = document.getElementById("gameCanvas");
        const game = new GameDemo(canvas);
        
        // 显示初始帮助
        setTimeout(() => {
            game.showHelp();
            console.log("游戏已启动！按 H 查看帮助");
        }, 100);
    </script>
</body>
</html>
    `;
}

// 如果是Node环境，导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GameDemo, MockPlayer, MockRoom };
}
