/**
 * InputSystem - 输入系统
 * 统一处理键盘、鼠标、触摸输入
 */

class InputSystem {
    constructor(world, canvas) {
        this.world = world;
        this.canvas = canvas;
        this.priority = 5;
        this.enabled = true;
        
        // 输入状态
        this.keys = new Map();
        this.keysPressed = new Set(); // 本帧按下的键
        this.keysReleased = new Set(); // 本帧释放的键
        
        this.mouse = {
            x: 0,
            y: 0,
            worldX: 0,
            worldY: 0,
            down: false,
            pressed: false, // 本帧按下
            released: false // 本帧释放
        };
        
        this.touch = {
            active: false,
            x: 0,
            y: 0,
            identifier: null
        };
        
        // 输入配置
        this.keyMap = {
            moveUp: ['KeyW', 'ArrowUp'],
            moveDown: ['KeyS', 'ArrowDown'],
            moveLeft: ['KeyA', 'ArrowLeft'],
            moveRight: ['KeyD', 'ArrowRight'],
            dash: ['Space'],
            pause: ['Escape'],
            weapon1: ['Digit1'],
            weapon2: ['Digit2'],
            weapon3: ['Digit3'],
            weapon4: ['Digit4']
        };
        
        this.listeners = [];
    }
    
    init() {
        this.setupKeyboard();
        this.setupMouse();
        this.setupTouch();
    }
    
    setupKeyboard() {
        window.addEventListener('keydown', (e) => {
            if (!this.keys.has(e.code)) {
                this.keys.set(e.code, true);
                this.keysPressed.add(e.code);
            }
            
            // 触发按键事件
            this.emit('keydown', e);
            
            // 阻止默认行为（游戏相关按键）
            if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
                e.preventDefault();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys.delete(e.code);
            this.keysReleased.add(e.code);
            this.emit('keyup', e);
        });
    }
    
    setupMouse() {
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
            this.updateWorldMousePosition();
        });
        
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0) {
                this.mouse.down = true;
                this.mouse.pressed = true;
            }
            this.emit('mousedown', e);
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            if (e.button === 0) {
                this.mouse.down = false;
                this.mouse.released = true;
            }
            this.emit('mouseup', e);
        });
        
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }
    
    setupTouch() {
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (e.touches.length > 0) {
                const touch = e.touches[0];
                const rect = this.canvas.getBoundingClientRect();
                this.touch.active = true;
                this.touch.identifier = touch.identifier;
                this.touch.x = touch.clientX - rect.left;
                this.touch.y = touch.clientY - rect.top;
            }
        }, { passive: false });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            for (const touch of e.touches) {
                if (touch.identifier === this.touch.identifier) {
                    const rect = this.canvas.getBoundingClientRect();
                    this.touch.x = touch.clientX - rect.left;
                    this.touch.y = touch.clientY - rect.top;
                    break;
                }
            }
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.touch.active = false;
            this.touch.identifier = null;
        });
    }
    
    updateWorldMousePosition() {
        // 需要渲染系统提供转换
        if (!this.world) return;
        
        // 安全获取RenderSystem，使用字符串名称避免依赖顺序
        const renderSystem = this.world.systems && this.world.systems['render'];
        if (renderSystem && renderSystem.screenToWorld) {
            const pos = renderSystem.screenToWorld(this.mouse.x, this.mouse.y);
            this.mouse.worldX = pos.x;
            this.mouse.worldY = pos.y;
        } else {
            // 如果RenderSystem不可用，使用屏幕坐标
            this.mouse.worldX = this.mouse.x;
            this.mouse.worldY = this.mouse.y;
        }
    }
    
    update(dt) {
        // 清空本帧事件
        this.keysPressed.clear();
        this.keysReleased.clear();
        this.mouse.pressed = false;
        this.mouse.released = false;
        
        // 更新世界鼠标位置（跟随相机移动）
        this.updateWorldMousePosition();
    }
    
    // 查询方法
    isKeyDown(code) {
        return this.keys.has(code);
    }
    
    isKeyPressed(code) {
        return this.keysPressed.has(code);
    }
    
    isKeyReleased(code) {
        return this.keysReleased.has(code);
    }
    
    isActionDown(action) {
        const codes = this.keyMap[action];
        if (!codes) return false;
        return codes.some(code => this.isKeyDown(code));
    }
    
    isActionPressed(action) {
        const codes = this.keyMap[action];
        if (!codes) return false;
        return codes.some(code => this.isKeyPressed(code));
    }
    
    getMovementInput() {
        let x = 0;
        let y = 0;
        
        if (this.isActionDown('moveUp')) y -= 1;
        if (this.isActionDown('moveDown')) y += 1;
        if (this.isActionDown('moveLeft')) x -= 1;
        if (this.isActionDown('moveRight')) x += 1;
        
        // 归一化
        if (x !== 0 || y !== 0) {
            const len = Math.sqrt(x * x + y * y);
            x /= len;
            y /= len;
        }
        
        return { x, y };
    }
    
    on(event, callback) {
        this.listeners.push({ event, callback });
    }
    
    emit(event, data) {
        for (const listener of this.listeners) {
            if (listener.event === event) {
                listener.callback(data);
            }
        }
    }
    
    destroy() {
        this.listeners = [];
    }
}

window.InputSystem = InputSystem;
