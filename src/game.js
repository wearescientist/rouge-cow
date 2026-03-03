/**
 * game.js - 游戏主类（v0.23 重构版）
 * 整合新架构的核心游戏类
 */

class GameV23 {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        // ECS 世界
        this.world = new World();
        
        // 核心系统
        this.dataManager = new DataManager();
        this.camera = new Camera(0, 0, canvas.width, canvas.height);
        this.quadTree = new QuadTree({ x: -2000, y: -2000, width: 4000, height: 4000 });
        
        // 对象池
        this.particlePool = new ParticlePool(1000);
        this.bulletPool = new BulletPool(500);
        
        // 游戏状态
        this.state = 'loading'; // loading, menu, playing, paused, gameover
        this.time = 0;
        this.dt = 1/60;
        
        // 性能监控
        this.perfMonitor = new PerformanceMonitor();
        
        // 初始化
        this.init();
    }

    async init() {
        console.log('[GameV23] Initializing...');
        
        // 预加载数据
        await this.preloadData();
        
        // 初始化系统
        this.initSystems();
        
        // 初始化输入
        this.initInput();
        
        // 完成
        this.state = 'menu';
        console.log('[GameV23] Initialization complete');
    }

    async preloadData() {
        const toLoad = [
            { category: 'weapons', ids: ['whip', 'magic_wand', 'knife'] },
            { category: 'items', ids: ['heart_container', 'spinach'] },
            { category: 'enemies', ids: ['rabbit_t1'] }
        ];
        
        for (const { category, ids } of toLoad) {
            await this.dataManager.preload(category, ids);
        }
        
        console.log('[GameV23] Data preloaded');
    }

    initSystems() {
        // 添加 ECS 系统
        this.world.addSystem(new MovementSystem(this.world));
        this.world.addSystem(new CombatSystem(this.world));
        this.world.addSystem(new RenderSystem(this.world, this.ctx));
        
        console.log('[GameV23] Systems initialized');
    }

    initInput() {
        // 键盘输入
        this.keys = {};
        window.addEventListener('keydown', e => {
            this.keys[e.key] = true;
        });
        window.addEventListener('keyup', e => {
            this.keys[e.key] = false;
        });
        
        // 鼠标输入
        this.mouse = { x: 0, y: 0, down: false };
        this.canvas.addEventListener('mousemove', e => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        this.canvas.addEventListener('mousedown', () => this.mouse.down = true);
        this.canvas.addEventListener('mouseup', () => this.mouse.down = false);
    }

    start() {
        this.state = 'playing';
        this.lastTime = performance.now();
        requestAnimationFrame(t => this.loop(t));
    }

    loop(timestamp) {
        if (this.state === 'paused') {
            requestAnimationFrame(t => this.loop(t));
            return;
        }
        
        // 计算 delta time
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1); // 限制最大 dt
        this.lastTime = timestamp;
        this.time += dt;
        
        // 更新性能监控
        this.perfMonitor.tick(dt);
        
        // 更新
        this.update(dt);
        
        // 渲染
        this.render();
        
        requestAnimationFrame(t => this.loop(t));
    }

    update(dt) {
        // 更新相机
        this.camera.update(dt);
        
        // 重建四叉树
        this.quadTree.clear();
        
        // 更新世界
        this.world.update(dt);
    }

    render() {
        const ctx = this.ctx;
        
        // 清空画布
        ctx.fillStyle = '#0a0a14';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 应用相机变换
        ctx.save();
        const screenCenter = this.camera.worldToScreen(0, 0);
        ctx.translate(screenCenter.x, screenCenter.y);
        ctx.scale(this.camera.zoom, this.camera.zoom);
        ctx.translate(-this.camera.x, -this.camera.y);
        
        // 渲染世界
        this.world.render(ctx);
        
        ctx.restore();
        
        // 渲染UI
        this.renderUI(ctx);
    }

    renderUI(ctx) {
        // 显示 FPS
        ctx.fillStyle = '#4f4';
        ctx.font = '14px monospace';
        ctx.fillText(`FPS: ${Math.round(this.perfMonitor.fps)}`, 10, 20);
        
        // 显示实体数
        const stats = this.world.getStats();
        ctx.fillText(`Entities: ${stats.entities}`, 10, 40);
    }

    createPlayer(x, y) {
        const entity = this.world.createEntity();
        
        entity.add(new TransformComponent(x, y));
        entity.add(new HealthComponent(100));
        entity.addTag('player');
        
        // 相机跟随
        this.camera.follow(entity.get(TransformComponent));
        
        return entity;
    }

    createEnemy(x, y, type = 'rabbit_t1') {
        const data = this.dataManager.get('enemies', type);
        if (!data) {
            console.warn(`Enemy data not found: ${type}`);
            return null;
        }
        
        const entity = this.world.createEntity();
        
        entity.add(new TransformComponent(x, y));
        entity.add(new HealthComponent(data.stats.hp));
        entity.addTag('enemy');
        
        return entity;
    }

    pause() {
        this.state = 'paused';
    }

    resume() {
        this.state = 'playing';
        this.lastTime = performance.now();
    }

    destroy() {
        this.world.clear();
    }
}

// ECS 系统实现

class MovementSystem extends System {
    update(dt) {
        const entities = this.query([TransformComponent]);
        
        for (const entity of entities) {
            const transform = entity.get(TransformComponent);
            // 更新位置逻辑
        }
    }
}

class CombatSystem extends System {
    update(dt) {
        const entities = this.query([HealthComponent]);
        
        for (const entity of entities) {
            const health = entity.get(HealthComponent);
            health.update(dt);
        }
    }
}

class RenderSystem extends System {
    constructor(world, ctx) {
        super(world);
        this.ctx = ctx;
    }

    render(ctx) {
        // 按层级排序并渲染
        const entities = this.query([TransformComponent])
            .sort((a, b) => {
                const ta = a.get(TransformComponent);
                const tb = b.get(TransformComponent);
                return (ta.y + ta.height) - (tb.y + tb.height);
            });
        
        for (const entity of entities) {
            this.renderEntity(entity);
        }
    }

    renderEntity(entity) {
        const transform = entity.get(TransformComponent);
        if (!transform) return;
        
        // 简化的渲染
        this.ctx.fillStyle = entity.hasTag('player') ? '#4f4' : '#f44';
        this.ctx.fillRect(transform.x - 10, transform.y - 10, 20, 20);
    }
}

window.GameV23 = GameV23;
window.MovementSystem = MovementSystem;
window.CombatSystem = CombatSystem;
window.RenderSystem = RenderSystem;
