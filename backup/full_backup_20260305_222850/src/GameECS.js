/**
 * GameECS - ECS 版本游戏主类 (v0.24)
 * 整合所有 ECS 系统的完整游戏控制器
 */

class GameECS {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // ECS 世界
        this.world = new World();
        
        // 数据管理器
        this.dataManager = new DataManager();
        
        // 所有系统
        this.systems = {};
        
        // 游戏状态
        this.isRunning = false;
        this.isPaused = false;
        this.lastTime = 0;
        this.deltaTime = 0;
        this.timeScale = 1;
        this.currentFloor = 1;
        
        // 统计
        this.stats = {
            fps: 0,
            frameCount: 0,
            lastFpsTime: 0
        };
        
        // 初始化
        this.init();
    }
    
    async init() {
        try {
            console.log('=== GameECS v0.24 Initializing ===');
            
            // 1. 加载游戏数据
            await this.dataManager.init();
            
            // 2. 初始化核心系统
            this.initCoreSystems();
            
            // 3. 加载游戏资源
            await this.loadAssets();
            
            // 4. 初始化游戏系统
            this.initGameSystems();
            
            // 5. 初始化 UI 系统
            this.initUISystems();
            
            // 6. 初始化特效系统
            this.initEffectSystems();
            
            // 7. 初始化存档设置系统
            this.initSaveSettingsSystems();
            
            // 8. 设置事件监听
            this.setupEventListeners();
            
            // 9. 显示主菜单
            this.showMainMenu();
            
            console.log('=== GameECS Initialized ===');
            console.log('Systems:', Object.keys(this.systems).join(', '));
            
        } catch (e) {
            console.error('Failed to initialize GameECS:', e);
            throw e;
        }
    }
    
    initCoreSystems() {
        // 输入系统
        this.systems.input = new InputSystem(this.world, this.canvas);
        this.world.addSystem(this.systems.input);
        
        // 移动系统
        this.systems.movement = new MovementSystem(this.world);
        this.world.addSystem(this.systems.movement);
        
        // 碰撞系统
        this.systems.collision = new CollisionSystem(this.world);
        this.world.addSystem(this.systems.collision);
        
        // 相机系统
        this.systems.camera = new CameraSystem(this.world, this.canvas);
        this.world.addSystem(this.systems.camera);
        
        // 渲染系统
        this.systems.render = new RenderSystem(this.world, this.canvas);
        this.world.addSystem(this.systems.render);
    }
    
    /**
     * 加载游戏资源
     */
    async loadAssets() {
        console.log('Loading game assets...');
        
        // 更新加载界面
        const loadingText = document.querySelector('#loading div:last-child');
        if (loadingText) loadingText.textContent = '正在加载游戏资源...';
        
        // 使用AssetManager加载所有资源
        if (window.assetManager) {
            await window.assetManager.loadAllAssets((progress, current) => {
                console.log(`Loading: ${Math.floor(progress)}% - ${current}`);
            });
            
            // 将资源传递给渲染系统
            if (this.systems.render) {
                this.systems.render.loadTexturesFromAssetManager();
            }
        }
        
        console.log('Assets loaded successfully');
    }
    
    initGameSystems() {
        // 玩家控制系统
        this.systems.playerController = new PlayerControllerSystem(this.world);
        this.world.addSystem(this.systems.playerController);
        
        // 武器系统
        this.systems.weapon = new WeaponSystem(this.world);
        this.world.addSystem(this.systems.weapon);
        // 加载武器数据
        this.systems.weapon.weaponDatabase = this.dataManager.weapons;
        
        // 战斗系统
        this.systems.combat = new CombatSystem(this.world);
        this.world.addSystem(this.systems.combat);
        
        // 状态效果系统
        this.systems.statusEffect = new StatusEffectSystem(this.world);
        this.world.addSystem(this.systems.statusEffect);
        
        // AI 系统
        this.systems.ai = new AISystem(this.world);
        this.world.addSystem(this.systems.ai);
        
        // 敌人生成系统
        this.systems.enemySpawn = new EnemySpawnSystem(this.world);
        this.world.addSystem(this.systems.enemySpawn);
        
        // 道具系统
        this.systems.item = new ItemSystem(this.world);
        this.world.addSystem(this.systems.item);
        // 加载道具数据
        this.systems.item.itemDatabase = this.dataManager.items;
        this.systems.item.passiveDatabase = this.dataManager.passives;
        
        // 商店系统
        this.systems.shop = new ShopSystem(this.world);
        this.world.addSystem(this.systems.shop);
        
        // 超武合成系统
        this.systems.crafting = new CraftingSystem(this.world);
        this.world.addSystem(this.systems.crafting);
        
        // 宠物系统
        this.systems.pet = new PetSystem(this.world);
        this.world.addSystem(this.systems.pet);
        
        // 道具连携系统
        this.systems.synergy = new SynergySystem(this.world);
        this.world.addSystem(this.systems.synergy);
        
        // 血迹系统
        this.systems.bloodStain = new BloodStainSystem(this.world);
        this.world.addSystem(this.systems.bloodStain);
        
        // 闪电/激光系统
        this.systems.lightning = new LightningSystem(this.world);
        this.world.addSystem(this.systems.lightning);
        
        // 房间系统
        this.systems.room = new RoomSystem(this.world);
        this.world.addSystem(this.systems.room);
        
        // 升级系统
        this.systems.upgrade = new UpgradeSystem(this.world);
        this.world.addSystem(this.systems.upgrade);
    }
    
    initUISystems() {
        // UI 系统
        this.systems.ui = new UISystem(this.world, this.canvas);
        this.world.addSystem(this.systems.ui);
        
        // 菜单系统
        this.systems.menu = new MenuSystem(this.world, this.canvas);
        this.world.addSystem(this.systems.menu);
        
        // 伤害数字系统
        this.systems.damageNumber = new DamageNumberSystem(this.world);
        this.world.addSystem(this.systems.damageNumber);
        
        // 小地图系统
        this.systems.minimap = new MinimapSystem(this.world, this.canvas);
        this.world.addSystem(this.systems.minimap);
    }
    
    initEffectSystems() {
        // 动画系统
        this.systems.animation = new AnimationSystem(this.world);
        this.world.addSystem(this.systems.animation);
        
        // 屏幕特效系统
        this.systems.screenEffect = new ScreenEffectSystem(this.world, this.canvas);
        this.world.addSystem(this.systems.screenEffect);
        
        // 粒子系统
        this.systems.particle = new ParticleSystem(this.world);
        this.world.addSystem(this.systems.particle);
        
        // 音频系统
        this.systems.audio = new AudioSystem(this.world);
        this.world.addSystem(this.systems.audio);
    }
    
    initSaveSettingsSystems() {
        // 存档系统
        this.systems.save = new SaveSystem(this.world);
        this.world.addSystem(this.systems.save);
        
        // 设置系统
        this.systems.settings = new SettingsSystem(this.world);
        this.world.addSystem(this.systems.settings);
        
        // 成就系统
        this.systems.achievement = new AchievementSystem(this.world);
        this.world.addSystem(this.systems.achievement);
        
        // 调试系统
        this.systems.debug = new DebugSystem(this.world, this.canvas);
        this.world.addSystem(this.systems.debug);
    }
    
    setupEventListeners() {
        // 游戏开始
        this.world.on('gameStarted', () => {
            this.startNewGame();
        });
        
        // 游戏暂停/恢复
        this.world.on('gamePaused', () => {
            this.pause();
        });
        
        this.world.on('gameResumed', () => {
            this.resume();
        });
        
        // 游戏重启
        this.world.on('gameRestarted', () => {
            this.restart();
        });
        
        // 玩家死亡
        this.world.on('playerDeath', () => {
            this.handlePlayerDeath();
        });
        
        // 房间清理 - 保存进度
        this.world.on('roomCleared', (roomId) => {
            console.log(`Room ${roomId} cleared`);
            if (this.systems.save) {
                this.systems.save.requestAutoSave();
            }
        });
        
        // 升级选择
        this.world.on('showUpgradeOptions', (data) => {
            console.log('Show upgrade options:', data.options.length);
        });
        
        // 窗口大小改变
        window.addEventListener('resize', () => this.handleResize());
    }
    
    showMainMenu() {
        if (this.systems.menu) {
            this.systems.menu.openMenu('main');
        }
    }
    
    async startNewGame() {
        console.log('Starting new game...');
        
        // 清空世界
        this.world.clear();
        
        // 重置楼层
        this.currentFloor = 1;
        
        // 创建玩家
        const player = this.world.createPlayer(0, 0, {
            movement: { speed: 150, maxSpeed: 200, dashSpeed: 400 },
            health: { maxHealth: 100 },
            player: { level: 1 }
        });
        
        // 设置相机跟随
        if (this.systems.camera) {
            this.systems.camera.setTarget(player);
        }
        
        // 生成第一关
        if (this.systems.room) {
            this.systems.room.generateLevel(this.currentFloor);
        }
        
        // 装备初始武器
        if (this.systems.playerController) {
            this.systems.playerController.pickupWeapon(player, 'sword');
        }
        
        // 播放 BGM
        if (this.systems.audio) {
            // this.systems.audio.playBgm('dungeon_theme');
        }
        
        // 开始游戏循环
        this.start();
        
        // 显示提示
        if (this.systems.damageNumber) {
            const transform = player.get(TransformComponent);
            this.systems.damageNumber.spawnText(
                transform.x, transform.y - 50,
                '游戏开始! 使用 WASD 移动，空格翻滚',
                { color: '#4f4', size: 16, life: 3 }
            );
        }
    }
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.isPaused = false;
        this.lastTime = performance.now();
        
        this.world.start();
        
        console.log('Game started');
        this.gameLoop();
    }
    
    pause() {
        this.isPaused = true;
        this.world.pause();
    }
    
    resume() {
        this.isPaused = false;
        this.lastTime = performance.now();
        this.world.start();
    }
    
    restart() {
        this.stop();
        this.startNewGame();
    }
    
    stop() {
        this.isRunning = false;
        this.world.pause();
    }
    
    handlePlayerDeath() {
        console.log('Player died');
        
        // 播放死亡音效
        if (this.systems.audio) {
            // this.systems.audio.play('player_death');
        }
        
        // 保存统计
        if (this.systems.save) {
            // TODO: 保存死亡统计
        }
        
        // 显示游戏结束菜单
        setTimeout(() => {
            if (this.systems.menu) {
                this.systems.menu.openGameOverMenu({});
            }
        }, 1000);
    }
    
    handleResize() {
        const container = this.canvas.parentElement;
        if (container) {
            this.canvas.width = container.clientWidth;
            this.canvas.height = container.clientHeight;
        }
        
        if (this.systems.camera) {
            this.systems.camera.viewport = {
                width: this.canvas.width,
                height: this.canvas.height
            };
        }
    }
    
    gameLoop() {
        if (!this.isRunning) return;
        
        const currentTime = performance.now();
        this.deltaTime = (currentTime - this.lastTime) / 1000;
        this.lastTime = currentTime;
        
        // 限制最大 deltaTime
        this.deltaTime = Math.min(this.deltaTime, 0.1);
        
        // 更新 FPS
        this.stats.frameCount++;
        if (currentTime - this.stats.lastFpsTime >= 1000) {
            this.stats.fps = this.stats.frameCount;
            this.stats.frameCount = 0;
            this.stats.lastFpsTime = currentTime;
        }
        
        // 应用时间缩放
        let dt = this.deltaTime;
        if (this.systems.screenEffect) {
            dt *= this.systems.screenEffect.getTimeScale();
        }
        
        // 更新
        if (!this.isPaused) {
            this.update(dt);
        }
        
        // 渲染
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }
    
    update(dt) {
        // 更新世界
        this.world.update(dt);
    }
    
    render() {
        const ctx = this.ctx;
        
        // 清空画布
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 应用屏幕特效变换
        if (this.systems.screenEffect) {
            this.systems.screenEffect.apply(ctx);
        }
        
        // 保存相机变换
        ctx.save();
        
        // 应用相机变换
        if (this.systems.camera) {
            this.systems.camera.applyTransform(ctx);
        }
        
        // 渲染地图
        this.renderMap(ctx);
        
        // 渲染粒子（在实体下方）
        if (this.systems.particle) {
            this.systems.particle.render(ctx);
        }
        
        // 渲染实体（使用渲染系统）
        if (this.systems.render) {
            this.systems.render.render(ctx);
        } else {
            this.renderEntities(ctx);
        }
        
        // 恢复相机变换
        ctx.restore();
        
        // 恢复屏幕特效变换
        if (this.systems.screenEffect) {
            this.systems.screenEffect.restore(ctx);
        }
        
        // 渲染屏幕特效覆盖层
        if (this.systems.screenEffect) {
            this.systems.screenEffect.renderOverlay(ctx);
        }
        
        // 渲染 UI
        if (this.systems.ui) {
            this.systems.ui.render(ctx);
        }
        
        // 渲染伤害数字
        if (this.systems.damageNumber) {
            this.systems.damageNumber.render(ctx);
        }
        
        // 渲染小地图
        if (this.systems.minimap) {
            this.systems.minimap.render(ctx);
        }
        
        // 渲染菜单
        if (this.systems.menu) {
            this.systems.menu.render(ctx);
        }
        
        // 渲染调试信息
        this.renderDebug(ctx);
    }
    
    renderMap(ctx) {
        // 渲染网格背景
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        
        const gridSize = 50;
        const viewBounds = this.systems.camera?.getViewportBounds();
        
        if (viewBounds) {
            const startX = Math.floor(viewBounds.minX / gridSize) * gridSize;
            const endX = Math.ceil(viewBounds.maxX / gridSize) * gridSize;
            const startY = Math.floor(viewBounds.minY / gridSize) * gridSize;
            const endY = Math.ceil(viewBounds.maxY / gridSize) * gridSize;
            
            for (let x = startX; x <= endX; x += gridSize) {
                ctx.beginPath();
                ctx.moveTo(x, startY);
                ctx.lineTo(x, endY);
                ctx.stroke();
            }
            
            for (let y = startY; y <= endY; y += gridSize) {
                ctx.beginPath();
                ctx.moveTo(startX, y);
                ctx.lineTo(endX, y);
                ctx.stroke();
            }
        }
    }
    
    renderEntities(ctx) {
        const entities = this.world.getEntitiesWithComponents(TransformComponent, SpriteComponent);
        
        // 按 Z 排序
        entities.sort((a, b) => {
            const za = a.get(TransformComponent).z;
            const zb = b.get(TransformComponent).z;
            return za - zb;
        });
        
        for (const entity of entities) {
            const transform = entity.get(TransformComponent);
            const sprite = entity.get(SpriteComponent);
            
            if (!sprite.visible) continue;
            
            ctx.save();
            ctx.translate(transform.x, transform.y);
            ctx.rotate(transform.rotation);
            ctx.globalAlpha = sprite.alpha;
            
            // 根据标签选择颜色
            let color = sprite.tint || '#666';
            if (entity.hasTag('player')) color = '#4f4';
            else if (entity.hasTag('enemy')) color = '#f44';
            else if (entity.hasTag('projectile')) color = '#ff0';
            else if (entity.hasTag('item')) color = '#48f';
            
            ctx.fillStyle = color;
            ctx.fillRect(-sprite.width/2, -sprite.height/2, sprite.width, sprite.height);
            
            // 边框
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeRect(-sprite.width/2, -sprite.height/2, sprite.width, sprite.height);
            
            ctx.restore();
        }
    }
    
    renderDebug(ctx) {
        if (!this.systems.settings?.get('display', 'showFPS')) {
            return;
        }
        
        ctx.fillStyle = '#0f0';
        ctx.font = '14px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        const stats = this.world.getStats();
        const y = this.canvas.height - 100;
        
        ctx.fillText(`FPS: ${this.stats.fps}`, 10, y);
        ctx.fillText(`Entities: ${stats.entityCount}`, 10, y + 20);
        ctx.fillText(`Components: ${stats.componentTypes}`, 10, y + 40);
        ctx.fillText(`Floor: ${this.currentFloor}`, 10, y + 60);
    }
    
    destroy() {
        this.stop();
        
        for (const system of Object.values(this.systems)) {
            if (system.destroy) {
                system.destroy();
            }
        }
        
        this.world.clear();
    }
}

window.GameECS = GameECS;
