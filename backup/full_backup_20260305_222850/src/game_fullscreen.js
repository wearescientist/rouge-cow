/**
 * 肉鸽牛牛 - 全屏自适应版本
 * 自动适应窗口大小，保持比例
 */

class FullscreenGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // 游戏逻辑分辨率（固定）
        this.gameWidth = 900;
        this.gameHeight = 600;
        
        // 当前缩放比例
        this.scale = 1;
        this.offsetX = 0;
        this.offsetY = 0;
        
        // 初始化系统...
        this.spriteManager = new SpriteManager();
        this.itemManager = null;
        this.weaponManager = null;
        this.particles = new ParticleSystem();
        this.mapGenerator = new MapGenerator();
        this.minimap = new Minimap();
        
        this.currentRoom = null;
        this.allRooms = null;
        this.player = null;
        this.expGems = [];
        this.coins = [];
        this.itemSelectionUI = null;
        
        this.keys = {};
        this.transitioning = false;
        this.transitionTimer = 0;
        
        // 绑定resize
        this.resize();
        window.addEventListener('resize', () => this.resize());
        window.addEventListener('orientationchange', () => setTimeout(() => this.resize(), 100));
        
        this.setupInput();
    }

    // 自适应resize
    resize() {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // 计算最佳缩放比例，保持16:9比例
        const targetRatio = this.gameWidth / this.gameHeight;
        const windowRatio = windowWidth / windowHeight;
        
        let renderWidth, renderHeight;
        
        if (windowRatio > targetRatio) {
            // 窗口较宽，以高度为准
            renderHeight = windowHeight;
            renderWidth = renderHeight * targetRatio;
        } else {
            // 窗口较高，以宽度为准
            renderWidth = windowWidth;
            renderHeight = renderWidth / targetRatio;
        }
        
        // 设置canvas实际像素尺寸
        this.canvas.width = windowWidth;
        this.canvas.height = windowHeight;
        
        // 计算缩放比例和居中偏移
        this.scale = renderWidth / this.gameWidth;
        this.offsetX = (windowWidth - renderWidth) / 2;
        this.offsetY = (windowHeight - renderHeight) / 2;
        
        // 使用CSS设置显示尺寸（防止模糊）
        this.canvas.style.width = windowWidth + 'px';
        this.canvas.style.height = windowHeight + 'px';
    }

    // 坐标转换：屏幕坐标 -> 游戏坐标
    screenToGame(screenX, screenY) {
        return {
            x: (screenX - this.offsetX) / this.scale,
            y: (screenY - this.offsetY) / this.scale
        };
    }

    // 坐标转换：游戏坐标 -> 屏幕坐标
    gameToScreen(gameX, gameY) {
        return {
            x: gameX * this.scale + this.offsetX,
            y: gameY * this.scale + this.offsetY
        };
    }

    setupInput() {
        window.addEventListener('keydown', e => {
            this.keys[e.key] = true;
            this.handleKey(e.key);
        });
        window.addEventListener('keyup', e => this.keys[e.key] = false);
        
        // 鼠标点击支持（用于UI）
        this.canvas.addEventListener('mousedown', e => {
            const pos = this.screenToGame(e.clientX, e.clientY);
            this.handleClick(pos.x, pos.y);
        });
    }

    handleKey(key) {
        if (this.transitioning) return;
        if (key >= '1' && key <= '9') this.giveItem(parseInt(key));
        if (key === '0') this.giveItem(Math.floor(Math.random() * 100) + 1);
        if (key === 'w' || key === 'W') this.addRandomWeapon();
        if (key === 'f' || key === 'F') this.toggleFullscreen();
    }

    handleClick(x, y) {
        // 处理UI点击（道具选择等）
        if (this.itemSelectionUI && this.itemSelectionUI.visible) {
            // 转换到UI坐标系处理
        }
    }

    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
        } else {
            document.exitFullscreen();
        }
    }

    async init() {
        await this.spriteManager.loadAll();
        
        this.currentRoom = this.mapGenerator.generate();
        this.allRooms = this.mapGenerator.rooms;
        this.currentRoom.visited = true;
        this.currentRoom.startWave(1);
        
        this.player = new Player(450, 300);
        this.itemManager = new ItemManager(this.player);
        this.weaponManager = new WeaponManager(this.player);
        this.itemSelectionUI = new ItemSelectionUI(this.itemManager);
        
        this.weaponManager.addWeapon('whip');
        
        requestAnimationFrame(t => this.loop(t));
        document.getElementById('loading')?.classList.add('hidden');
    }

    // 游戏主循环
    loop(timestamp) {
        const dt = Math.min((timestamp - (this.lastTime || timestamp)) / 1000, 0.1);
        this.lastTime = timestamp;
        
        this.update(dt);
        this.draw();
        
        requestAnimationFrame(t => this.loop(t));
    }

    update(dt) {
        if (this.transitioning) {
            this.updateTransition(dt);
            return;
        }
        if (this.itemSelectionUI?.visible) return;

        const stats = this.itemManager.recalculateStats();
        
        // 更新玩家
        this.player.update(dt, this.itemManager, { keys: this.keys }, this.currentRoom);
        
        // 更新房间
        const justCleared = this.currentRoom.update(dt, this.player, this.spriteManager);
        if (justCleared) this.onRoomCleared();
        
        // 检查门传送
        const transitionDir = this.currentRoom.checkDoorTransition(this.player);
        if (transitionDir !== null && this.currentRoom.cleared) {
            this.startTransition(transitionDir);
        }
        
        // 武器更新
        this.weaponManager.update(dt, this.currentRoom.enemies, this.itemManager);
        
        // 碰撞检测...
        this.handleCombat(stats);
        
        // 掉落物更新
        this.updateDrops(dt, stats);
        
        // 粒子更新
        this.particles.update(dt);
        
        // 检查升级
        this.checkLevelUp();
    }

    // 绘制 - 关键！使用缩放
    draw() {
        const ctx = this.ctx;
        
        // 清空背景
        ctx.fillStyle = '#0a0a14';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 保存状态并应用变换
        ctx.save();
        
        // 移动到居中位置并缩放
        ctx.translate(this.offsetX, this.offsetY);
        ctx.scale(this.scale, this.scale);
        
        // 绘制黑边遮罩（保持比例）
        if (this.offsetX > 0 || this.offsetY > 0) {
            // 已经在背景色上，不需要额外遮罩
        }
        
        // 绘制游戏世界（按900x600逻辑坐标）
        this.drawWorld(ctx);
        
        ctx.restore();
        
        // 绘制UI（屏幕坐标，不缩放）
        this.drawScreenUI(ctx);
    }

    drawWorld(ctx) {
        // 房间
        this.currentRoom.draw(ctx, this.spriteManager);
        
        // 掉落物
        for (const gem of this.expGems) gem.draw(ctx);
        for (const coin of this.coins) coin.draw(ctx);
        
        // 武器效果
        this.weaponManager.draw(ctx);
        
        // 玩家
        this.player.draw(ctx, this.spriteManager, this.itemManager);
        
        // 粒子
        this.particles.draw(ctx);
        
        // 转场效果
        if (this.transitioning) {
            const alpha = Math.sin(this.transitionTimer / 0.3 * Math.PI);
            ctx.fillStyle = `rgba(0,0,0,${alpha})`;
            ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);
        }
    }

    drawScreenUI(ctx) {
        // UI元素使用屏幕坐标，不跟随游戏缩放
        const padding = 20;
        
        // 左上角状态
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(padding, padding, 180, 100);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        
        // 心形生命
        const hearts = '❤️'.repeat(Math.ceil(this.player.health));
        ctx.fillText(hearts, padding + 10, padding + 35);
        
        // 等级
        ctx.fillStyle = '#4488ff';
        ctx.fillText(`Lv.${this.player.level} EXP:${Math.floor(this.player.exp)}`, padding + 10, padding + 60);
        
        // 金币
        ctx.fillStyle = '#ffcc00';
        ctx.fillText(`💰 ${this.player.gold}`, padding + 10, padding + 85);
        
        // 右上角房间信息
        ctx.textAlign = 'right';
        ctx.fillStyle = '#fff';
        const roomNames = {normal:'普通',boss:'BOSS',treasure:'宝箱',shop:'商店',start:'起点'};
        ctx.fillText(`${roomNames[this.currentRoom.type]}房间`, this.canvas.width - padding, padding + 35);
        ctx.fillText(`敌人:${this.currentRoom.enemies.length}`, this.canvas.width - padding, padding + 60);
        
        // 清理状态
        if (!this.currentRoom.cleared) {
            ctx.fillStyle = '#f44';
            ctx.fillText('🔒 锁定', this.canvas.width - padding, padding + 85);
        } else {
            ctx.fillStyle = '#4f4';
            ctx.fillText('✓ 已清理', this.canvas.width - padding, padding + 85);
        }
        
        // 小地图（右上角）
        this.minimap.draw(ctx, this.currentRoom, this.allRooms, this.canvas.width - 150, padding + 100);
        
        // 底部武器栏和道具栏...
        this.drawBottomBar(ctx);
        
        // 全屏提示
        ctx.fillStyle = '#666';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('按 F 切换全屏', this.canvas.width / 2, this.canvas.height - 10);
        
        // 选择UI（如果有）
        if (this.itemSelectionUI?.visible) {
            // 选择UI需要特殊处理，在屏幕中心
            this.itemSelectionUI.draw(ctx, this.canvas.width, this.canvas.height);
        }
    }

    drawBottomBar(ctx) {
        const bottomY = this.canvas.height - 70;
        
        // 武器栏
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(20, bottomY, 300, 50);
        
        let wx = 30;
        for (const weapon of this.weaponManager.weapons) {
            ctx.fillStyle = '#333';
            ctx.fillRect(wx, bottomY + 5, 40, 40);
            ctx.fillStyle = '#fff';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(weapon.config.icon, wx + 20, bottomY + 32);
            wx += 50;
        }
        
        // 道具栏
        const items = this.itemManager.getOwnedItemsList();
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(this.canvas.width - 280, bottomY, 260, 50);
        
        let ix = this.canvas.width - 270;
        for (const item of items.slice(0, 5)) {
            const colors = {common:'#888',rare:'#48f',epic:'#a4f',legendary:'#fc0',cursed:'#f44'};
            ctx.strokeStyle = colors[item.rarity];
            ctx.lineWidth = 2;
            ctx.strokeRect(ix, bottomY + 5, 40, 40);
            ctx.fillStyle = '#fff';
            ctx.font = '16px Arial';
            ctx.fillText(item.icon, ix + 20, bottomY + 32);
            ix += 48;
        }
    }

    // 其他方法...
    giveItem(id) { this.itemManager.acquireItem(id); }
    addRandomWeapon() { this.weaponManager.addWeapon(Object.keys(WEAPONS)[Math.floor(Math.random() * 4)]); }
    onRoomCleared() { /* 显示奖励 */ }
    startTransition(dir) { this.transitioning = true; this.transitionDir = dir; this.transitionTimer = 0; }
    updateTransition(dt) { this.transitionTimer += dt; if (this.transitionTimer >= 0.3) { this.transitioning = false; } }
    handleCombat(stats) { /* 碰撞检测 */ }
    updateDrops(dt, stats) { /* 掉落物更新 */ }
    checkLevelUp() { /* 升级检查 */ }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FullscreenGame };
}
