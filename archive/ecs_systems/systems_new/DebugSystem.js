/**
 * DebugSystem - 调试系统
 * 提供实时调试信息、性能监控、作弊功能
 */

class DebugSystem {
    constructor(world, canvas) {
        this.world = world;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.priority = 1000; // 最后渲染
        this.enabled = false; // 默认关闭
        
        // 调试配置
        this.config = {
            showFPS: true,
            showEntityCount: true,
            showSystemStats: true,
            showCollisionBoxes: false,
            showAIState: false,
            showPaths: false,
            godMode: false,
            infiniteAmmo: false
        };
        
        // 性能统计
        this.performance = {
            fps: 0,
            frameTime: 0,
            updateTime: 0,
            renderTime: 0,
            memoryUsage: 0
        };
        
        // 历史记录
        this.history = {
            fps: new Array(60).fill(0),
            frameTime: new Array(60).fill(0)
        };
        
        // 命令行
        this.console = {
            visible: false,
            history: [],
            currentInput: '',
            cursorPosition: 0
        };
        
        // 可用命令
        this.commands = {
            'help': this.cmdHelp.bind(this),
            'god': this.cmdGodMode.bind(this),
            'killall': this.cmdKillAll.bind(this),
            'levelup': this.cmdLevelUp.bind(this),
            'spawn': this.cmdSpawn.bind(this),
            'give': this.cmdGive.bind(this),
            'teleport': this.cmdTeleport.bind(this),
            'clear': this.cmdClear.bind(this),
            'fps': this.cmdToggleFPS.bind(this),
            'collision': this.cmdToggleCollision.bind(this),
            'reset': this.cmdReset.bind(this)
        };
    }
    
    init() {
        // 设置键盘监听
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        console.log('DebugSystem initialized');
        console.log('Press F3 to toggle debug mode');
        console.log('Press ~ to open console');
    }
    
    handleKeyDown(e) {
        // F3 - 切换调试模式
        if (e.key === 'F3') {
            this.enabled = !this.enabled;
            console.log(`Debug mode: ${this.enabled ? 'ON' : 'OFF'}`);
            e.preventDefault();
        }
        
        // ~ 或 ` - 切换控制台
        if (e.key === '`' || e.key === '~') {
            this.console.visible = !this.console.visible;
            e.preventDefault();
        }
        
        // 控制台输入处理
        if (this.console.visible) {
            this.handleConsoleInput(e);
        }
    }
    
    handleConsoleInput(e) {
        if (e.key === 'Enter') {
            this.executeCommand(this.console.currentInput);
            this.console.currentInput = '';
            this.console.cursorPosition = 0;
        } else if (e.key === 'Backspace') {
            if (this.console.cursorPosition > 0) {
                this.console.currentInput = 
                    this.console.currentInput.slice(0, this.console.cursorPosition - 1) +
                    this.console.currentInput.slice(this.console.cursorPosition);
                this.console.cursorPosition--;
            }
        } else if (e.key === 'ArrowLeft') {
            this.console.cursorPosition = Math.max(0, this.console.cursorPosition - 1);
        } else if (e.key === 'ArrowRight') {
            this.console.cursorPosition = Math.min(
                this.console.currentInput.length,
                this.console.cursorPosition + 1
            );
        } else if (e.key.length === 1) {
            this.console.currentInput = 
                this.console.currentInput.slice(0, this.console.cursorPosition) +
                e.key +
                this.console.currentInput.slice(this.console.cursorPosition);
            this.console.cursorPosition++;
        }
    }
    
    update(dt) {
        if (!this.enabled) return;
        
        // 更新性能统计
        this.updatePerformanceStats(dt);
    }
    
    updatePerformanceStats(dt) {
        // 更新 FPS
        this.performance.fps = Math.round(1 / dt);
        this.performance.frameTime = dt * 1000;
        
        // 更新历史
        this.history.fps.shift();
        this.history.fps.push(this.performance.fps);
        this.history.frameTime.shift();
        this.history.frameTime.push(this.performance.frameTime);
        
        // 计算平均
        this.performance.avgFps = this.history.fps.reduce((a, b) => a + b) / this.history.fps.length;
        this.performance.avgFrameTime = this.history.frameTime.reduce((a, b) => a + b) / this.history.frameTime.length;
        
        // 内存使用（如果可用）
        if (performance.memory) {
            this.performance.memoryUsage = performance.memory.usedJSHeapSize / 1048576; // MB
        }
    }
    
    render(ctx) {
        if (!this.enabled && !this.console.visible) return;
        
        ctx.save();
        
        if (this.enabled) {
            this.renderDebugInfo(ctx);
            this.renderPerformanceGraph(ctx);
            
            if (this.config.showCollisionBoxes) {
                this.renderCollisionBoxes(ctx);
            }
            
            if (this.config.showAIState) {
                this.renderAIState(ctx);
            }
        }
        
        if (this.console.visible) {
            this.renderConsole(ctx);
        }
        
        ctx.restore();
    }
    
    renderDebugInfo(ctx) {
        const x = 10;
        let y = 20;
        const lineHeight = 18;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(5, 5, 250, 200);
        
        ctx.font = '14px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
        // FPS
        if (this.config.showFPS) {
            const fpsColor = this.performance.fps >= 55 ? '#0f0' : 
                            this.performance.fps >= 30 ? '#ff0' : '#f00';
            ctx.fillStyle = fpsColor;
            ctx.fillText(`FPS: ${this.performance.fps} (${this.performance.avgFps.toFixed(1)} avg)`, x, y);
            y += lineHeight;
            
            ctx.fillStyle = '#0f0';
            ctx.fillText(`Frame: ${this.performance.frameTime.toFixed(2)}ms`, x, y);
            y += lineHeight;
        }
        
        // 实体统计
        if (this.config.showEntityCount) {
            const stats = this.world.getStats();
            ctx.fillStyle = '#0f0';
            ctx.fillText(`Entities: ${stats.entityCount}`, x, y);
            y += lineHeight;
            ctx.fillText(`Components: ${stats.componentTypes}`, x, y);
            y += lineHeight;
        }
        
        // 内存
        if (this.performance.memoryUsage > 0) {
            ctx.fillStyle = this.performance.memoryUsage > 500 ? '#f00' : '#0f0';
            ctx.fillText(`Memory: ${this.performance.memoryUsage.toFixed(1)} MB`, x, y);
            y += lineHeight;
        }
        
        // 系统统计
        if (this.config.showSystemStats) {
            y += 5;
            ctx.fillStyle = '#48f';
            ctx.fillText('Systems:', x, y);
            y += lineHeight;
            
            ctx.fillStyle = '#0f0';
            const systemNames = Object.keys(window.game?.systems || {});
            ctx.fillText(systemNames.slice(0, 5).join(', '), x, y);
        }
    }
    
    renderPerformanceGraph(ctx) {
        const x = 10;
        const y = 220;
        const width = 250;
        const height = 60;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x - 5, y - 5, width + 10, height + 10);
        
        // 绘制 FPS 图
        ctx.strokeStyle = '#0f0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let i = 0; i < this.history.fps.length; i++) {
            const px = x + (i / this.history.fps.length) * width;
            const py = y + height - (this.history.fps[i] / 60) * height;
            
            if (i === 0) {
                ctx.moveTo(px, py);
            } else {
                ctx.lineTo(px, py);
            }
        }
        
        ctx.stroke();
        
        // 标签
        ctx.fillStyle = '#888';
        ctx.font = '10px monospace';
        ctx.fillText('60 FPS', x + width - 40, y + 10);
        ctx.fillText('30 FPS', x + width - 40, y + height / 2 + 5);
    }
    
    renderCollisionBoxes(ctx) {
        const entities = this.world.getEntitiesWithComponents(TransformComponent, ColliderComponent);
        
        ctx.strokeStyle = '#0f0';
        ctx.lineWidth = 1;
        
        for (const entity of entities) {
            const transform = entity.get(TransformComponent);
            const collider = entity.get(ColliderComponent);
            
            ctx.strokeRect(
                transform.x - collider.width / 2,
                transform.y - collider.height / 2,
                collider.width,
                collider.height
            );
        }
    }
    
    renderAIState(ctx) {
        const entities = this.world.getEntitiesWithComponents(AIComponent);
        
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        
        for (const entity of entities) {
            const transform = entity.get(TransformComponent);
            const ai = entity.get(AIComponent);
            
            ctx.fillStyle = '#ff0';
            ctx.fillText(ai.currentState, transform.x, transform.y - 30);
        }
    }
    
    renderConsole(ctx) {
        const height = 200;
        const inputHeight = 30;
        
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, this.canvas.height - height, this.canvas.width, height);
        
        // 历史记录
        ctx.font = '14px monospace';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#0f0';
        
        let y = this.canvas.height - height + 20;
        for (const line of this.console.history.slice(-10)) {
            ctx.fillText(line, 10, y);
            y += 18;
        }
        
        // 输入行
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, this.canvas.height - inputHeight, this.canvas.width, inputHeight);
        
        ctx.fillStyle = '#000';
        ctx.fillText('> ' + this.console.currentInput, 10, this.canvas.height - 10);
        
        // 光标
        const cursorX = 10 + ctx.measureText('> ' + this.console.currentInput.slice(0, this.console.cursorPosition)).width;
        ctx.fillRect(cursorX, this.canvas.height - 25, 2, 20);
    }
    
    // ==================== 命令 ====================
    
    executeCommand(input) {
        const parts = input.trim().split(' ');
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);
        
        this.console.history.push('> ' + input);
        
        if (this.commands[cmd]) {
            try {
                this.commands[cmd](args);
            } catch (e) {
                this.console.history.push(`Error: ${e.message}`);
            }
        } else if (cmd) {
            this.console.history.push(`Unknown command: ${cmd}`);
        }
    }
    
    cmdHelp() {
        this.console.history.push('Available commands:');
        this.console.history.push('  help - Show this help');
        this.console.history.push('  god - Toggle god mode');
        this.console.history.push('  killall - Kill all enemies');
        this.console.history.push('  levelup [n] - Level up n times');
        this.console.history.push('  spawn <enemy> [count] - Spawn enemies');
        this.console.history.push('  give <item> [count] - Give item');
        this.console.history.push('  teleport <x> <y> - Teleport player');
        this.console.history.push('  fps - Toggle FPS display');
        this.console.history.push('  collision - Toggle collision boxes');
        this.console.history.push('  reset - Reset game');
    }
    
    cmdGodMode() {
        this.config.godMode = !this.config.godMode;
        this.console.history.push(`God mode: ${this.config.godMode ? 'ON' : 'OFF'}`);
        
        // 应用到玩家
        const players = this.world.getEntitiesWithTag('player');
        for (const player of players) {
            const health = player.get(HealthComponent);
            if (health) {
                if (this.config.godMode) {
                    health.invincible = true;
                } else {
                    health.invincible = false;
                }
            }
        }
    }
    
    cmdKillAll() {
        const enemies = [...this.world.getEntitiesWithTag('enemy')];
        let count = 0;
        for (const enemy of enemies) {
            if (enemy.active) {
                enemy.destroy();
                count++;
            }
        }
        this.console.history.push(`Killed ${count} enemies`);
    }
    
    cmdLevelUp(args) {
        const times = parseInt(args[0]) || 1;
        const players = this.world.getEntitiesWithTag('player');
        
        for (const player of players) {
            const playerComp = player.get(PlayerComponent);
            if (playerComp) {
                for (let i = 0; i < times; i++) {
                    playerComp.addExp(playerComp.nextLevelExp);
                }
            }
        }
        
        this.console.history.push(`Leveled up ${times} time(s)`);
    }
    
    cmdSpawn(args) {
        const enemyType = args[0] || 'slime';
        const count = parseInt(args[1]) || 1;
        
        const players = this.world.getEntitiesWithTag('player');
        if (players.length === 0) return;
        
        const playerTransform = players[0].get(TransformComponent);
        
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const dist = 100;
            const x = playerTransform.x + Math.cos(angle) * dist;
            const y = playerTransform.y + Math.sin(angle) * dist;
            
            this.world.createEnemy(x, y, enemyType);
        }
        
        this.console.history.push(`Spawned ${count} ${enemyType}(s)`);
    }
    
    cmdGive(args) {
        const itemId = args[0] || 'health_potion';
        const count = parseInt(args[1]) || 1;
        
        this.console.history.push(`Gave ${count} ${itemId}(s)`);
    }
    
    cmdTeleport(args) {
        const x = parseFloat(args[0]) || 0;
        const y = parseFloat(args[1]) || 0;
        
        const players = this.world.getEntitiesWithTag('player');
        for (const player of players) {
            const transform = player.get(TransformComponent);
            if (transform) {
                transform.x = x;
                transform.y = y;
            }
        }
        
        this.console.history.push(`Teleported to (${x}, ${y})`);
    }
    
    cmdClear() {
        this.console.history = [];
    }
    
    cmdToggleFPS() {
        this.config.showFPS = !this.config.showFPS;
        this.console.history.push(`FPS display: ${this.config.showFPS ? 'ON' : 'OFF'}`);
    }
    
    cmdToggleCollision() {
        this.config.showCollisionBoxes = !this.config.showCollisionBoxes;
        this.console.history.push(`Collision boxes: ${this.config.showCollisionBoxes ? 'ON' : 'OFF'}`);
    }
    
    cmdReset() {
        window.game?.restart();
        this.console.history.push('Game reset');
    }
    
    destroy() {}
}

window.DebugSystem = DebugSystem;
