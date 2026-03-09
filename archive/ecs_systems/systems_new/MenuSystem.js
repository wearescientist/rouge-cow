/**
 * MenuSystem - 菜单系统
 * 处理主菜单、暂停菜单、游戏结束等界面
 */

class MenuSystem {
    constructor(world, canvas) {
        this.world = world;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.priority = 300; // 最上层
        this.enabled = true;
        
        // 菜单状态
        this.currentMenu = null; // 'main', 'pause', 'gameover', 'victory', 'settings'
        this.previousMenu = null;
        
        // 菜单按钮
        this.buttons = [];
        this.hoveredButton = null;
        
        // 输入系统引用
        this.inputSystem = null;
        
        // 配置
        this.config = {
            buttonWidth: 200,
            buttonHeight: 50,
            buttonSpacing: 20,
            fontSize: 24,
            titleSize: 48,
            colors: {
                background: 'rgba(0, 0, 0, 0.85)',
                button: '#333',
                buttonHover: '#555',
                buttonActive: '#48f',
                text: '#fff',
                title: '#4f4'
            }
        };
    }
    
    init() {
        this.inputSystem = this.world.getSystem(InputSystem);
        
        if (this.inputSystem) {
            this.inputSystem.on('mousedown', (e) => this.handleClick(e));
        }
        
        // 创建主菜单
        this.createMainMenu();
    }
    
    update(dt) {
        if (!this.currentMenu) return;
        
        // 更新按钮悬停状态
        this.updateButtonHover();
        
        // 更新菜单逻辑
        switch (this.currentMenu) {
            case 'main':
                this.updateMainMenu(dt);
                break;
            case 'pause':
                this.updatePauseMenu(dt);
                break;
            case 'gameover':
                this.updateGameOverMenu(dt);
                break;
            case 'victory':
                this.updateVictoryMenu(dt);
                break;
        }
    }
    
    render(ctx) {
        if (!this.currentMenu) return;
        
        ctx.save();
        
        // 渲染背景
        ctx.fillStyle = this.config.colors.background;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 渲染当前菜单
        switch (this.currentMenu) {
            case 'main':
                this.renderMainMenu(ctx);
                break;
            case 'pause':
                this.renderPauseMenu(ctx);
                break;
            case 'gameover':
                this.renderGameOverMenu(ctx);
                break;
            case 'victory':
                this.renderVictoryMenu(ctx);
                break;
            case 'settings':
                this.renderSettingsMenu(ctx);
                break;
        }
        
        // 渲染按钮
        this.renderButtons(ctx);
        
        ctx.restore();
    }
    
    // ==================== 主菜单 ====================
    
    createMainMenu() {
        this.buttons = [];
        this.currentMenu = 'main';
        
        const centerX = this.canvas.width / 2;
        const startY = this.canvas.height / 2 - 50;
        
        this.addButton('开始游戏', centerX, startY, () => {
            this.startGame();
        });
        
        this.addButton('设置', centerX, startY + 70, () => {
            this.openMenu('settings');
        });
        
        this.addButton('退出', centerX, startY + 140, () => {
            // 在浏览器中无法真正退出，可以刷新页面
            location.reload();
        });
    }
    
    updateMainMenu(dt) {}
    
    renderMainMenu(ctx) {
        const centerX = this.canvas.width / 2;
        const titleY = 150;
        
        // 标题
        ctx.fillStyle = this.config.colors.title;
        ctx.font = `bold ${this.config.titleSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('深根之疫', centerX, titleY);
        
        // 副标题
        ctx.fillStyle = '#888';
        ctx.font = '20px Arial';
        ctx.fillText('Rogue Cow - v0.23 ECS', centerX, titleY + 50);
    }
    
    // ==================== 暂停菜单 ====================
    
    openPauseMenu() {
        this.previousMenu = this.currentMenu;
        this.currentMenu = 'pause';
        this.buttons = [];
        
        const centerX = this.canvas.width / 2;
        const startY = this.canvas.height / 2 - 50;
        
        this.addButton('继续游戏', centerX, startY, () => {
            this.closeMenu();
        });
        
        this.addButton('设置', centerX, startY + 70, () => {
            this.openMenu('settings');
        });
        
        this.addButton('返回主菜单', centerX, startY + 140, () => {
            this.openMenu('main');
        });
        
        // 暂停游戏
        this.world.emit('gamePaused');
    }
    
    updatePauseMenu(dt) {
        // 检测 ESC 键关闭菜单
        if (this.inputSystem && this.inputSystem.isActionPressed('pause')) {
            this.closeMenu();
        }
    }
    
    renderPauseMenu(ctx) {
        const centerX = this.canvas.width / 2;
        const titleY = 150;
        
        ctx.fillStyle = this.config.colors.text;
        ctx.font = `bold ${this.config.titleSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('游戏暂停', centerX, titleY);
    }
    
    // ==================== 游戏结束菜单 ====================
    
    openGameOverMenu(stats) {
        this.currentMenu = 'gameover';
        this.buttons = [];
        
        const centerX = this.canvas.width / 2;
        const startY = this.canvas.height / 2 + 50;
        
        this.addButton('再试一次', centerX, startY, () => {
            this.restartGame();
        });
        
        this.addButton('返回主菜单', centerX, startY + 70, () => {
            this.openMenu('main');
        });
    }
    
    updateGameOverMenu(dt) {}
    
    renderGameOverMenu(ctx) {
        const centerX = this.canvas.width / 2;
        const titleY = 200;
        
        ctx.fillStyle = '#f44';
        ctx.font = `bold ${this.config.titleSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('游戏结束', centerX, titleY);
        
        // 统计信息
        ctx.fillStyle = '#fff';
        ctx.font = '20px Arial';
        // TODO: 显示死亡统计
    }
    
    // ==================== 胜利菜单 ====================
    
    openVictoryMenu(stats) {
        this.currentMenu = 'victory';
        this.buttons = [];
        
        const centerX = this.canvas.width / 2;
        const startY = this.canvas.height / 2 + 50;
        
        this.addButton('继续游戏', centerX, startY, () => {
            this.closeMenu();
        });
        
        this.addButton('返回主菜单', centerX, startY + 70, () => {
            this.openMenu('main');
        });
    }
    
    updateVictoryMenu(dt) {}
    
    renderVictoryMenu(ctx) {
        const centerX = this.canvas.width / 2;
        const titleY = 200;
        
        ctx.fillStyle = '#4f4';
        ctx.font = `bold ${this.config.titleSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('胜利！', centerX, titleY);
    }
    
    // ==================== 设置菜单 ====================
    
    renderSettingsMenu(ctx) {
        const centerX = this.canvas.width / 2;
        const titleY = 150;
        
        ctx.fillStyle = this.config.colors.text;
        ctx.font = `bold ${this.config.titleSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('设置', centerX, titleY);
        
        // TODO: 添加音量、画质等设置选项
    }
    
    // ==================== 按钮系统 ====================
    
    addButton(text, x, y, onClick) {
        this.buttons.push({
            text,
            x: x - this.config.buttonWidth / 2,
            y: y - this.config.buttonHeight / 2,
            width: this.config.buttonWidth,
            height: this.config.buttonHeight,
            onClick,
            hovered: false
        });
    }
    
    updateButtonHover() {
        if (!this.inputSystem) return;
        
        const mouseX = this.inputSystem.mouse.x;
        const mouseY = this.inputSystem.mouse.y;
        
        this.hoveredButton = null;
        
        for (const button of this.buttons) {
            button.hovered = (
                mouseX >= button.x &&
                mouseX <= button.x + button.width &&
                mouseY >= button.y &&
                mouseY <= button.y + button.height
            );
            
            if (button.hovered) {
                this.hoveredButton = button;
            }
        }
    }
    
    renderButtons(ctx) {
        for (const button of this.buttons) {
            // 按钮背景
            if (button.hovered) {
                ctx.fillStyle = this.config.colors.buttonHover;
            } else {
                ctx.fillStyle = this.config.colors.button;
            }
            ctx.fillRect(button.x, button.y, button.width, button.height);
            
            // 边框
            ctx.strokeStyle = this.config.colors.buttonActive;
            ctx.lineWidth = 2;
            ctx.strokeRect(button.x, button.y, button.width, button.height);
            
            // 文字
            ctx.fillStyle = this.config.colors.text;
            ctx.font = `${this.config.fontSize}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
                button.text,
                button.x + button.width / 2,
                button.y + button.height / 2
            );
        }
    }
    
    handleClick(e) {
        if (!this.hoveredButton) return;
        if (!this.hoveredButton.onClick) return;
        
        try {
            this.hoveredButton.onClick();
        } catch (err) {
            console.error('Button click error:', err);
        }
    }
    
    // ==================== 菜单控制 ====================
    
    openMenu(menuName) {
        this.previousMenu = this.currentMenu;
        this.currentMenu = menuName;
        this.buttons = [];
        
        switch (menuName) {
            case 'main':
                this.createMainMenu();
                break;
            case 'settings':
                // 创建设置按钮
                const centerX = this.canvas.width / 2;
                const startY = this.canvas.height / 2;
                
                this.addButton('返回', centerX, startY + 100, () => {
                    this.openMenu(this.previousMenu || 'main');
                });
                break;
        }
    }
    
    closeMenu() {
        this.currentMenu = null;
        this.buttons = [];
        this.world.emit('gameResumed');
    }
    
    startGame() {
        this.currentMenu = null;
        this.buttons = [];
        this.world.emit('gameStarted');
    }
    
    restartGame() {
        this.currentMenu = null;
        this.buttons = [];
        this.world.emit('gameRestarted');
    }
    
    destroy() {}
}

window.MenuSystem = MenuSystem;
