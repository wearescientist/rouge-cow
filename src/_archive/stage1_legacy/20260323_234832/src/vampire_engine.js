/**
 * 肉鸽牛牛 - 吸血鬼幸存者风格重构
 * 大房间(2700x1800) + 相机跟随 + 波次生存
 */

// ==================== 常量配置 ====================
const SURVIVOR_CONFIG = {
    // 房间尺寸（9倍以撒房间）
    ROOM_WIDTH: 2700,
    ROOM_HEIGHT: 1800,
    
    // 视口尺寸（屏幕显示范围）
    VIEW_WIDTH: 900,
    VIEW_HEIGHT: 600,
    
    // 相机
    CAMERA_SMOOTH: 0.1,  // 平滑跟随系数
    
    // 波次系统
    WAVE_INTERVAL: 30,   // 秒
    WAVE_BASE_COUNT: 20,
    WAVE_INCREMENT: 5,
    
    // 空间网格
    GRID_CELL_SIZE: 150, // 碰撞检测格子大小
    
    // 8个房间模板
    TEMPLATES: [
        'maze',      // 回字形迷宫
        'cross',     // 十字河流
        'spiral',    // 螺旋死亡
        'islands',   // 岛屿群
        'arena',     // 竞技场
        'dual',      // 双通道
        'ruins',     // 废墟迷宫
        'corridor'   // 无尽长廊
    ]
};

// ==================== 相机系统 ====================
class SurvivorCamera {
    constructor() {
        this.x = SURVIVOR_CONFIG.ROOM_WIDTH / 2;
        this.y = SURVIVOR_CONFIG.ROOM_HEIGHT / 2;
        this.target = null;
        this.viewWidth = SURVIVOR_CONFIG.VIEW_WIDTH;
        this.viewHeight = SURVIVOR_CONFIG.VIEW_HEIGHT;
        this.roomWidth = SURVIVOR_CONFIG.ROOM_WIDTH;
        this.roomHeight = SURVIVOR_CONFIG.ROOM_HEIGHT;
    }
    
    follow(target) {
        this.target = target;
    }
    
    update() {
        if (!this.target) return;
        
        // 平滑跟随
        this.x += (this.target.x - this.x) * SURVIVOR_CONFIG.CAMERA_SMOOTH;
        this.y += (this.target.y - this.y) * SURVIVOR_CONFIG.CAMERA_SMOOTH;
        
        // 限制在房间边界（不显示外面）
        const minX = this.viewWidth / 2;
        const maxX = this.roomWidth - this.viewWidth / 2;
        const minY = this.viewHeight / 2;
        const maxY = this.roomHeight - this.viewHeight / 2;
        
        this.x = Math.max(minX, Math.min(maxX, this.x));
        this.y = Math.max(minY, Math.min(maxY, this.y));
    }
    
    // 世界坐标转屏幕坐标
    worldToScreen(wx, wy) {
        return {
            x: wx - this.x + this.viewWidth / 2,
            y: wy - this.y + this.viewHeight / 2
        };
    }
    
    // 屏幕坐标转世界坐标
    screenToWorld(sx, sy) {
        return {
            x: sx + this.x - this.viewWidth / 2,
            y: sy + this.y - this.viewHeight / 2
        };
    }
    
    // 检查是否在视野内
    isVisible(wx, wy, radius = 50) {
        const dx = Math.abs(wx - this.x);
        const dy = Math.abs(wy - this.y);
        return dx < this.viewWidth / 2 + radius && dy < this.viewHeight / 2 + radius;
    }
}

// ==================== 空间网格（碰撞优化） ====================
class SpatialGrid {
    constructor() {
        this.cellSize = SURVIVOR_CONFIG.GRID_CELL_SIZE;
        this.cells = new Map(); // key: "x,y", value: [entities]
        this.roomWidth = SURVIVOR_CONFIG.ROOM_WIDTH;
        this.roomHeight = SURVIVOR_CONFIG.ROOM_HEIGHT;
        // 2700x1800 / 150 = 18x12 = 216个格子
    }
    
    getKey(cx, cy) {
        return `${cx},${cy}`;
    }
    
    getCellByPos(x, y) {
        const cx = Math.floor(x / this.cellSize);
        const cy = Math.floor(y / this.cellSize);
        return { cx, cy };
    }
    
    clear() {
        this.cells.clear();
    }
    
    insert(entity) {
        const { cx, cy } = this.getCellByPos(entity.x, entity.y);
        const key = this.getKey(cx, cy);
        if (!this.cells.has(key)) {
            this.cells.set(key, []);
        }
        this.cells.get(key).push(entity);
        entity._gridCell = { cx, cy };
    }
    
    update(entity) {
        if (!entity._gridCell) {
            this.insert(entity);
            return;
        }
        const { cx, cy } = this.getCellByPos(entity.x, entity.y);
        if (cx !== entity._gridCell.cx || cy !== entity._gridCell.cy) {
            // 从旧格子移除
            const oldKey = this.getKey(entity._gridCell.cx, entity._gridCell.cy);
            const oldCell = this.cells.get(oldKey);
            if (oldCell) {
                const idx = oldCell.indexOf(entity);
                if (idx >= 0) oldCell.splice(idx, 1);
            }
            // 插入新格子
            this.insert(entity);
        }
    }
    
    // 获取周围9格的实体
    getNearby(x, y) {
        const { cx, cy } = this.getCellByPos(x, y);
        const result = [];
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const key = this.getKey(cx + dx, cy + dy);
                const cell = this.cells.get(key);
                if (cell) result.push(...cell);
            }
        }
        return result;
    }
}

// ==================== 8个房间模板 ====================
const ROOM_TEMPLATES = {
    // 模板1：回字形迷宫
    maze: {
        name: '回字形迷宫',
        obstacles: [
            // 外框
            { x: 200, y: 100, w: 2300, h: 100 }, // 上
            { x: 200, y: 1600, w: 2300, h: 100 }, // 下
            { x: 100, y: 200, w: 100, h: 1400 }, // 左
            { x: 2500, y: 200, w: 100, h: 1400 }, // 右
            // 内框
            { x: 800, y: 500, w: 1100, h: 80 }, // 上内
            { x: 800, y: 1200, w: 1100, h: 80 }, // 下内
            { x: 800, y: 580, w: 80, h: 620 }, // 左内
            { x: 1820, y: 580, w: 80, h: 620 }, // 右内
        ],
        spawnPoints: [
            { x: 500, y: 300 }, { x: 2200, y: 300 },
            { x: 500, y: 1500 }, { x: 2200, y: 1500 },
            { x: 1350, y: 200 }, { x: 1350, y: 1600 }
        ]
    },
    
    // 模板2：十字河流
    cross: {
        name: '十字河流',
        obstacles: [
            // 十字分隔
            { x: 1300, y: 0, w: 100, h: 700 }, // 上中
            { x: 1300, y: 1100, w: 100, h: 700 }, // 下中
            { x: 0, y: 850, w: 1000, h: 100 }, // 左中
            { x: 1700, y: 850, w: 1000, h: 100 }, // 右中
        ],
        spawnPoints: [
            { x: 500, y: 400 }, { x: 2200, y: 400 },
            { x: 500, y: 1400 }, { x: 2200, y: 1400 },
            { x: 1350, y: 900 }
        ]
    },
    
    // 模板3：螺旋死亡
    spiral: {
        name: '螺旋死亡',
        obstacles: [
            // 螺旋墙壁
            { x: 400, y: 400, w: 1900, h: 100 },
            { x: 2200, y: 400, w: 100, h: 500 },
            { x: 600, y: 800, w: 1700, h: 100 },
            { x: 600, y: 900, w: 100, h: 500 },
            { x: 700, y: 1300, w: 1300, h: 100 },
            { x: 1900, y: 1000, w: 100, h: 300 },
        ],
        spawnPoints: [
            { x: 300, y: 300 }, { x: 2400, y: 300 },
            { x: 300, y: 1500 }, { x: 2400, y: 1500 },
            { x: 1350, y: 900 } // 中心
        ]
    },
    
    // 模板4：岛屿群
    islands: {
        name: '岛屿群',
        obstacles: [
            // 岛屿（安全区）
            { x: 300, y: 300, w: 200, h: 200 },
            { x: 800, y: 200, w: 250, h: 150 },
            { x: 1500, y: 300, w: 200, h: 200 },
            { x: 2100, y: 250, w: 250, h: 200 },
            { x: 400, y: 800, w: 300, h: 200 },
            { x: 1200, y: 750, w: 300, h: 300 }, // 中心大岛
            { x: 2000, y: 800, w: 250, h: 200 },
            { x: 300, y: 1300, w: 250, h: 200 },
            { x: 900, y: 1400, w: 200, h: 200 },
            { x: 1600, y: 1350, w: 250, h: 200 },
            { x: 2200, y: 1300, w: 200, h: 200 },
        ],
        spawnPoints: [
            { x: 200, y: 600 }, { x: 2500, y: 600 },
            { x: 200, y: 1200 }, { x: 2500, y: 1200 },
            { x: 700, y: 900 }, { x: 1800, y: 900 }
        ]
    },
    
    // 模板5：竞技场
    arena: {
        name: '竞技场',
        obstacles: [
            // 圆形边界用8个矩形近似
            { x: 0, y: 0, w: 800, h: 300 },
            { x: 1900, y: 0, w: 800, h: 300 },
            { x: 0, y: 1500, w: 800, h: 300 },
            { x: 1900, y: 1500, w: 800, h: 300 },
            { x: 0, y: 300, w: 300, h: 1200 },
            { x: 2400, y: 300, w: 300, h: 1200 },
            { x: 800, y: 0, w: 1100, h: 100 },
            { x: 800, y: 1700, w: 1100, h: 100 },
        ],
        spawnPoints: [
            { x: 400, y: 400 }, { x: 2300, y: 400 },
            { x: 400, y: 1400 }, { x: 2300, y: 1400 },
            { x: 1350, y: 200 }, { x: 1350, y: 1600 },
            { x: 200, y: 900 }, { x: 2500, y: 900 }
        ]
    },
    
    // 模板6：双通道
    dual: {
        name: '双通道',
        obstacles: [
            // 上下大厅分隔
            { x: 0, y: 550, w: 1000, h: 100 },
            { x: 1700, y: 550, w: 1000, h: 100 },
            { x: 0, y: 1150, w: 1000, h: 100 },
            { x: 1700, y: 1150, w: 1000, h: 100 },
            // 中间柱子
            { x: 1200, y: 850, w: 300, h: 100 },
        ],
        spawnPoints: [
            { x: 200, y: 300 }, { x: 2500, y: 300 },
            { x: 200, y: 1500 }, { x: 2500, y: 1500 },
            { x: 1350, y: 650 }, { x: 1350, y: 1150 }
        ]
    },
    
    // 模板7：废墟迷宫
    ruins: {
        name: '废墟迷宫',
        obstacles: [
            // 随机分布的断墙
            { x: 400, y: 300, w: 150, h: 400 },
            { x: 800, y: 600, w: 200, h: 100 },
            { x: 1200, y: 200, w: 100, h: 300 },
            { x: 1600, y: 500, w: 150, h: 250 },
            { x: 2000, y: 300, w: 100, h: 400 },
            { x: 300, y: 900, w: 200, h: 100 },
            { x: 700, y: 1100, w: 150, h: 200 },
            { x: 1100, y: 900, w: 200, h: 150 },
            { x: 1500, y: 1200, w: 100, h: 300 },
            { x: 1900, y: 1000, w: 250, h: 100 },
            { x: 2300, y: 1300, w: 100, h: 200 },
            { x: 500, y: 1400, w: 300, h: 100 },
            { x: 1000, y: 1500, w: 150, h: 200 },
            { x: 1800, y: 1500, w: 200, h: 150 },
        ],
        spawnPoints: [
            { x: 200, y: 200 }, { x: 2500, y: 200 },
            { x: 200, y: 1600 }, { x: 2500, y: 1600 },
            { x: 1350, y: 800 }, { x: 1350, y: 1000 }
        ]
    },
    
    // 模板8：无尽长廊
    corridor: {
        name: '无尽长廊',
        obstacles: [
            // 左右长墙
            { x: 0, y: 0, w: 200, h: 1800 },
            { x: 2500, y: 0, w: 200, h: 1800 },
            // 中间一些柱子增加变化
            { x: 600, y: 400, w: 100, h: 200 },
            { x: 1300, y: 800, w: 100, h: 200 },
            { x: 2000, y: 1200, w: 100, h: 200 },
        ],
        spawnPoints: [
            { x: 300, y: 200 }, { x: 300, y: 600 },
            { x: 300, y: 1000 }, { x: 300, y: 1400 },
            { x: 2400, y: 300 }, { x: 2400, y: 900 },
            { x: 2400, y: 1500 }
        ]
    }
};

// ==================== 波次管理器 ====================
class HordeManager {
    constructor(room) {
        this.room = room;
        this.wave = 0;
        this.timer = 0;
        this.spawnedThisWave = 0;
        this.targetCount = 0;
        this.isBossWave = false;
        this.enemies = [];
        this.maxActiveEnemies = 150; // 同屏最大敌人
        
        // 使用房间的生成点
        this.spawnPoints = room.template.spawnPoints || [{ x: 200, y: 200 }];
    }
    
    update(dt) {
        this.timer += dt;
        
        // 每30秒一波
        if (this.timer >= SURVIVOR_CONFIG.WAVE_INTERVAL) {
            this.startNewWave();
        }
        
        // 清理死亡敌人
        this.enemies = this.enemies.filter(e => e.hp > 0);
    }
    
    startNewWave() {
        this.wave++;
        this.timer = 0;
        this.isBossWave = this.wave % 5 === 0;
        
        // 计算本波目标数量
        this.targetCount = SURVIVOR_CONFIG.WAVE_BASE_COUNT + this.wave * SURVIVOR_CONFIG.WAVE_INCREMENT;
        if (this.isBossWave) this.targetCount = Math.floor(this.targetCount * 0.5); // Boss波数量少但质量高
        
        this.spawnedThisWave = 0;
        
        console.log(`🌊 第 ${this.wave} 波开始！目标：${this.targetCount} 只敌人`);
        
        // 立即生成第一波
        this.spawnBatch();
    }
    
    spawnBatch() {
        const batchSize = Math.min(10, this.targetCount - this.spawnedThisWave);
        const activeCount = this.enemies.filter(e => e.hp > 0).length;
        
        if (activeCount >= this.maxActiveEnemies) return; // 达到上限暂停生成
        
        for (let i = 0; i < batchSize; i++) {
            const point = this.spawnPoints[Math.floor(Math.random() * this.spawnPoints.length)];
            const enemy = this.createEnemy(point.x + rand(-50, 50), point.y + rand(-50, 50));
            this.enemies.push(enemy);
            this.spawnedThisWave++;
        }
    }
    
    createEnemy(x, y) {
        // 根据波数决定敌人类型
        const tier = Math.min(6, 1 + Math.floor(this.wave / 3));
        
        // 这里返回简化版敌人对象，实际应该引用你的 Enemy 类
        return {
            x, y,
            hp: 10 + this.wave * 2,
            maxHp: 10 + this.wave * 2,
            speed: 80 + Math.random() * 40,
            damage: 1 + Math.floor(this.wave / 5),
            tier,
            radius: 15
        };
    }
    
    // 获取当前活跃的敌人（用于渲染和碰撞）
    getActiveEnemies() {
        return this.enemies.filter(e => e.hp > 0);
    }
}

// 辅助函数
function rand(min, max) {
    return Math.random() * (max - min) + min;
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        SURVIVOR_CONFIG,
        SurvivorCamera,
        SpatialGrid,
        ROOM_TEMPLATES,
        HordeManager
    };
}
