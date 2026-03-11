/**
 * Game - 游戏主类
 * ECS 版本的游戏控制器
 */

class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // ECS 世界
        this.world = new World();
        
        // 系统
        this.systems = {};
        
        // 游戏状态
        this.isRunning = false;
        this.isPaused = false;
        this.lastTime = 0;
        this.deltaTime = 0;
        this.timeScale = 1;
        
        // 输入
        this.input = {
            keys: new Set(),
            mouse: { x: 0, y: 0, down: false },
            mouseWorldPos: { x: 0, y: 0 }
        };
        
        // 游戏数据
        this.player = null;
        this.camera = { x: 0, y: 0 };
        
        // 初始化
        this.init();
    }
    
    async init() {
        // 初始化系统
        this.initSystems();
        
        // 初始化输入
        this.initInput();
        
        // 创建初始场景
        await this.createScene();
        
        console.log('Game initialized');
        console.log('World stats:', this.world.getStats());
    }
    
    initSystems() {
        // 移动系统
        this.systems.movement = new MovementSystem(this.world);
        this.world.addSystem(this.systems.movement);
        
        // 碰撞系统
        this.systems.collision = new CollisionSystem(this.world);
        this.world.addSystem(this.systems.collision);
        
        // 战斗系统
        this.systems.combat = new CombatSystem(this.world);
        this.world.addSystem(this.systems.combat);
        
        // 渲染系统
        this.systems.render = new RenderSystem(this.world, this.canvas);
        this.world.addSystem(this.systems.render);
        
        // 设置碰撞回调
        this.systems.collision.onTrigger = (a, b) => this.handleTrigger(a, b);
    }
    
    initInput() {
        // 键盘输入
        window.addEventListener('keydown', (e) => {
            this.input.keys.add(e.code);
            this.handleKeyDown(e);
        });
        
        window.addEventListener('keyup', (e) => {
            this.input.keys.delete(e.code);
            this.handleKeyUp(e);
        });
        
        // 鼠标输入
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.input.mouse.x = e.clientX - rect.left;
            this.input.mouse.y = e.clientY - rect.top;
            
            // 转换到世界坐标
            const worldPos = this.systems.render.screenToWorld(
                this.input.mouse.x,
                this.input.mouse.y
            );
            this.input.mouseWorldPos = worldPos;
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            this.input.mouse.down = true;
            this.handleMouseDown(e);
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            this.input.mouse.down = false;
        });
    }
    
    async createScene() {
        // 创建玩家
        this.player = this.world.createPlayer(0, 0, {
            movement: { speed: 150, maxSpeed: 200, dashSpeed: 400 },
            health: { maxHealth: 100 }
        });
        
        // 设置相机跟随
        this.systems.render.setCameraTarget(this.player);
        
        // 创建测试敌人
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const dist = 200;
            const x = Math.cos(angle) * dist;
            const y = Math.sin(angle) * dist;
            
            this.world.createEnemy(x, y, 'basic', {
                health: { maxHealth: 50 },
                movement: { speed: 80 },
                combat: { attackDamage: 10 },
                enemy: { expValue: 20, dropTable: ['health_potion'] }
            });
        }
        
        // 启动世界
        this.world.start();
    }
    
    start() {
        this.isRunning = true;
        this.lastTime = performance.now();
        this.gameLoop();
    }
    
    pause() {
        this.isPaused = !this.isPaused;
        this.world.pause();
    }
    
    stop() {
        this.isRunning = false;
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // 限制最大 deltaTime 防止卡顿后跳帧
        this.deltaTime = Math.min(this.deltaTime, 0.1);
        
        if (!this.isPaused) {
            this.update(this.deltaTime * this.timeScale);
        }
        
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update(dt) {
        // 更新输入
        this.updateInput(dt);
        
        // 更新世界
        this.world.update(dt);
    }
    
    updateInput(dt) {
        if (!this.player) return;
        
        // 移动输入
        let dx = 0;
        let dy = 0;
        
        if (this.input.keys.has('KeyW') || this.input.keys.has('ArrowUp')) dy -= 1;
        if (this.input.keys.has('KeyS') || this.input.keys.has('ArrowDown')) dy += 1;
        if (this.input.keys.has('KeyA') || this.input.keys.has('ArrowLeft')) dx -= 1;
        if (this.input.keys.has('KeyD') || this.input.keys.has('ArrowRight')) dx += 1;
        
        if (dx !== 0 || dy !== 0) {
            this.systems.movement.setInput(this.player, dx, dy);
        }
    }
    
    render() {
        this.systems.render.render();
        
        // 渲染调试信息
        this.renderDebug();
    }
    
    renderDebug() {
        const ctx = this.ctx;
        const stats = this.world.getStats();
        
        ctx.fillStyle = '#0f0';
        ctx.font = '14px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        let y = 20;
        const lineHeight = 20;
        
        ctx.fillText(`Entities: ${stats.entityCount}`, 10, y);
        y += lineHeight;
        ctx.fillText(`Components: ${stats.componentTypes}`, 10, y);
        y += lineHeight;
        ctx.fillText(`Update: ${stats.updateTime.toFixed(2)}ms`, 10, y);
        y += lineHeight;
        ctx.fillText(`FPS: ${Math.round(1 / this.deltaTime)}`, 10, y);
    }
    
    handleKeyDown(e) {
        switch (e.code) {
            case 'Space':
                // 翻滚
                if (this.player) {
                    this.systems.movement.startDash(this.player);
                }
                break;
            case 'Escape':
                this.pause();
                break;
        }
    }
    
    handleKeyUp(e) {}
    
    handleMouseDown(e) {
        if (this.player && e.button === 0) {
            // 攻击
            const combat = this.systems.combat;
            combat.performAttack(this.player, this.input.mouseWorldPos);
        }
    }
    
    handleTrigger(entityA, entityB) {
        // 处理触发器碰撞
        const item = entityA.has(ItemComponent) ? entityA : 
                     entityB.has(ItemComponent) ? entityB : null;
        const player = entityA.has(PlayerComponent) ? entityA : 
                       entityB.has(PlayerComponent) ? entityB : null;
        
        if (item && player) {
            // 拾取道具
            this.collectItem(player, item);
        }
    }
    
    collectItem(player, item) {
        const itemComp = item.get(ItemComponent);
        const inventory = player.get(InventoryComponent);
        
        if (!itemComp || !inventory) return;
        
        // 添加到背包
        if (inventory.addItem(itemComp)) {
            // 应用效果
            this.applyItemEffect(player, itemComp);
            
            // 销毁道具实体
            item.destroy();
            
            // 更新统计
            const playerComp = player.get(PlayerComponent);
            if (playerComp) {
                playerComp.itemsCollected++;
            }
        }
    }
    
    applyItemEffect(player, item) {
        const health = player.get(HealthComponent);
        
        switch (item.effectType) {
            case 'heal':
                if (health) {
                    this.systems.combat.heal(player, item.effectValue);
                }
                break;
            case 'maxHealth':
                if (health) {
                    health.maxHealth += item.effectValue;
                    health.currentHealth += item.effectValue;
                }
                break;
            // 更多效果...
        }
    }
    
    destroy() {
        this.stop();
        this.world.clear();
    }
}

window.Game = Game;
