/**
 * 肉鸽牛牛 - 以撒风格房间系统
 * 一个屏幕就是一个房间
 */

// 房间类型
const RoomType = {
    NORMAL: 'normal',
    BOSS: 'boss',
    TREASURE: 'treasure',
    SHOP: 'shop',
    SECRET: 'secret',
    START: 'start'
};

// 房间方向
const Direction = {
    UP: 0,
    RIGHT: 1,
    DOWN: 2,
    LEFT: 3
};

// 单个房间类
class IsaacRoom {
    constructor(x, y, type = RoomType.NORMAL) {
        this.gridX = x;  // 地图网格坐标
        this.gridY = y;
        this.type = type;
        this.id = `${x},${y}`;
        
        // 房间尺寸（像素）
        this.width = 900;
        this.height = 600;
        
        // 墙壁厚度
        this.wallThickness = 40;
        
        // 门
        this.doors = {
            [Direction.UP]: null,
            [Direction.RIGHT]: null,
            [Direction.DOWN]: null,
            [Direction.LEFT]: null
        };
        
        // 状态
        this.visited = false;
        this.cleared = false;
        this.enemies = [];
        this.obstacles = [];
        this.items = []; // 房间内的道具底座
        
        // 波次管理
        this.wave = 1;
        this.currentWave = 0;
        this.totalWaves = 1;
        this.spawnTimer = 0;
        
        this.generateObstacles();
    }

    generateObstacles() {
        // 根据房间类型生成障碍物
        const obstacleCount = this.type === RoomType.BOSS ? 4 :
                             this.type === RoomType.TREASURE ? 2 : 
                             Math.floor(Math.random() * 5) + 3;
        
        this.obstacles = [];
        for (let i = 0; i < obstacleCount; i++) {
            let x, y, valid;
            let attempts = 0;
            
            do {
                valid = true;
                // 避免在门附近和中央生成
                x = this.wallThickness + 80 + Math.random() * (this.width - this.wallThickness * 2 - 160);
                y = this.wallThickness + 80 + Math.random() * (this.height - this.wallThickness * 2 - 160);
                
                // 检查是否太靠近中央（玩家出生点）
                const centerX = this.width / 2;
                const centerY = this.height / 2;
                if (Math.abs(x - centerX) < 100 && Math.abs(y - centerY) < 100) {
                    valid = false;
                }
                
                // 检查是否重叠
                for (const obs of this.obstacles) {
                    const dist = Math.sqrt((x - obs.x) ** 2 + (y - obs.y) ** 2);
                    if (dist < 80) valid = false;
                }
                
                attempts++;
            } while (!valid && attempts < 50);
            
            if (valid) {
                this.obstacles.push({
                    x, y,
                    width: 40 + Math.random() * 30,
                    height: 40 + Math.random() * 30,
                    type: Math.random() > 0.7 ? 'rock' : 'pit'
                });
            }
        }
    }

    startWave(waveNum) {
        this.currentWave = 0; // 从0开始，刷完一波才+1
        this.targetWave = this.type === RoomType.BOSS ? 3 : 
                         this.type === RoomType.NORMAL ? 1 + Math.floor(waveNum / 3) : 1;
        this.spawnTimer = 0;
        this.totalWaves = this.targetWave;
    }

    update(dt, player, spriteManager) {
        if (!this.visited) return;
        if (this.cleared) return;

        // 更新敌人
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(dt, player, this.enemies);
            
            // 检查碰撞
            if (enemy.distanceTo(player) < 20) {
                player.takeDamage(enemy.damage);
            }
            
            // 障碍物碰撞
            for (const obs of this.obstacles) {
                if (this.checkObstacleCollision(enemy, obs)) {
                    // 简单的推开
                    const dx = enemy.x - obs.x;
                    const dy = enemy.y - obs.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > 0) {
                        enemy.x += (dx / dist) * 2;
                        enemy.y += (dy / dist) * 2;
                    }
                }
            }
            
            // 墙壁碰撞
            this.constrainToRoom(enemy);
            
            if (enemy.hp <= 0) {
                this.enemies.splice(i, 1);
            }
        }

        // 刷怪
        if (this.currentWave < this.totalWaves) {
            this.spawnTimer += dt;
            const spawnInterval = Math.max(1, 3 - this.currentWave * 0.2);
            
            if (this.spawnTimer >= spawnInterval) {
                this.spawnTimer = 0;
                this.currentWave++; // 波数+1
                // 刷出一波敌人
                const count = 2 + this.currentWave;
                for (let i = 0; i < count; i++) {
                    this.spawnEnemy(spriteManager, player);
                }
            }
        }

        // 检查清理
        if (this.currentWave >= this.totalWaves && this.enemies.length === 0 && !this.cleared) {
            this.cleared = true;
            this.openDoors();
            return true; // 刚刚清理完成
        }
        
        return false;
    }

    spawnEnemy(spriteManager, player) {
        // 在屏幕边缘生成
        const side = Math.floor(Math.random() * 4);
        let x, y;
        const margin = 60;
        
        switch (side) {
            case 0: x = margin + Math.random() * (this.width - margin * 2); y = this.wallThickness + 20; break;
            case 1: x = this.width - this.wallThickness - 20; y = margin + Math.random() * (this.height - margin * 2); break;
            case 2: x = margin + Math.random() * (this.width - margin * 2); y = this.height - this.wallThickness - 20; break;
            case 3: x = this.wallThickness + 20; y = margin + Math.random() * (this.height - margin * 2); break;
        }

        const config = spriteManager.getRandomEnemy(this.wave);
        const enemy = new Enemy(x, y, config);
        this.enemies.push(enemy);
    }

    checkObstacleCollision(entity, obs) {
        return entity.x > obs.x - obs.width / 2 - 12 &&
               entity.x < obs.x + obs.width / 2 + 12 &&
               entity.y > obs.y - obs.height / 2 - 12 &&
               entity.y < obs.y + obs.height / 2 + 12;
    }

    constrainToRoom(entity) {
        const margin = this.wallThickness + 12;
        entity.x = Math.max(margin, Math.min(this.width - margin, entity.x));
        entity.y = Math.max(margin, Math.min(this.height - margin, entity.y));
    }

    openDoors() {
        // 打开所有门
        for (const dir of Object.keys(this.doors)) {
            if (this.doors[dir]) {
                this.doors[dir].open = true;
            }
        }
    }

    checkDoorTransition(player) {
        const doorSize = 80;
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        
        // 上门
        if (this.doors[Direction.UP] && this.doors[Direction.UP].open) {
            if (player.y < this.wallThickness + 20 && Math.abs(player.x - centerX) < doorSize / 2) {
                return Direction.UP;
            }
        }
        // 下门
        if (this.doors[Direction.DOWN] && this.doors[Direction.DOWN].open) {
            if (player.y > this.height - this.wallThickness - 20 && Math.abs(player.x - centerX) < doorSize / 2) {
                return Direction.DOWN;
            }
        }
        // 左门
        if (this.doors[Direction.LEFT] && this.doors[Direction.LEFT].open) {
            if (player.x < this.wallThickness + 20 && Math.abs(player.y - centerY) < doorSize / 2) {
                return Direction.LEFT;
            }
        }
        // 右门
        if (this.doors[Direction.RIGHT] && this.doors[Direction.RIGHT].open) {
            if (player.x > this.width - this.wallThickness - 20 && Math.abs(player.y - centerY) < doorSize / 2) {
                return Direction.RIGHT;
            }
        }
        
        return null;
    }

    draw(ctx, spriteManager) {
        // 绘制地板
        const floorColors = {
            [RoomType.NORMAL]: '#2a2a3e',
            [RoomType.BOSS]: '#3e1a1a',
            [RoomType.TREASURE]: '#1a3e1a',
            [RoomType.SHOP]: '#3e3e1a',
            [RoomType.SECRET]: '#1a1a3e',
            [RoomType.START]: '#2a3e2a'
        };
        
        ctx.fillStyle = floorColors[this.type] || floorColors[RoomType.NORMAL];
        ctx.fillRect(0, 0, this.width, this.height);
        
        // 地板网格
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        for (let x = 0; x < this.width; x += 50) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.height); ctx.stroke();
        }
        for (let y = 0; y < this.height; y += 50) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.width, y); ctx.stroke();
        }

        // 绘制墙壁（四周）
        ctx.fillStyle = this.cleared ? '#3a3a4e' : '#1a1a2e';
        
        // 上门
        if (!this.doors[Direction.UP] || !this.doors[Direction.UP].open) {
            ctx.fillRect(0, 0, this.width / 2 - 40, this.wallThickness);
            ctx.fillRect(this.width / 2 + 40, 0, this.width / 2 - 40, this.wallThickness);
        } else {
            ctx.fillRect(0, 0, this.width, this.wallThickness);
            ctx.fillStyle = '#000';
            ctx.fillRect(this.width / 2 - 35, 0, 70, 5); // 门洞
        }
        
        // 下门
        ctx.fillStyle = this.cleared ? '#3a3a4e' : '#1a1a2e';
        if (!this.doors[Direction.DOWN] || !this.doors[Direction.DOWN].open) {
            ctx.fillRect(0, this.height - this.wallThickness, this.width / 2 - 40, this.wallThickness);
            ctx.fillRect(this.width / 2 + 40, this.height - this.wallThickness, this.width / 2 - 40, this.wallThickness);
        } else {
            ctx.fillRect(0, this.height - this.wallThickness, this.width, this.wallThickness);
        }
        
        // 左门
        if (!this.doors[Direction.LEFT] || !this.doors[Direction.LEFT].open) {
            ctx.fillRect(0, 0, this.wallThickness, this.height / 2 - 40);
            ctx.fillRect(0, this.height / 2 + 40, this.wallThickness, this.height / 2 - 40);
        } else {
            ctx.fillRect(0, 0, this.wallThickness, this.height);
        }
        
        // 右门
        if (!this.doors[Direction.RIGHT] || !this.doors[Direction.RIGHT].open) {
            ctx.fillRect(this.width - this.wallThickness, 0, this.wallThickness, this.height / 2 - 40);
            ctx.fillRect(this.width - this.wallThickness, this.height / 2 + 40, this.wallThickness, this.height / 2 - 40);
        } else {
            ctx.fillRect(this.width - this.wallThickness, 0, this.wallThickness, this.height);
        }

        // 绘制障碍物
        for (const obs of this.obstacles) {
            if (obs.type === 'rock') {
                ctx.fillStyle = '#555';
                ctx.fillRect(obs.x - obs.width / 2, obs.y - obs.height / 2, obs.width, obs.height);
                ctx.fillStyle = '#777';
                ctx.fillRect(obs.x - obs.width / 2 + 3, obs.y - obs.height / 2 + 3, obs.width - 6, obs.height - 6);
            } else {
                ctx.fillStyle = '#1a1a2e';
                ctx.fillRect(obs.x - obs.width / 2, obs.y - obs.height / 2, obs.width, obs.height);
                ctx.strokeStyle = '#333';
                ctx.strokeRect(obs.x - obs.width / 2, obs.y - obs.height / 2, obs.width, obs.height);
            }
        }

        // 绘制门
        this.drawDoors(ctx);

        // 绘制敌人
        for (const enemy of this.enemies) {
            enemy.draw(ctx, spriteManager);
        }

        // 未清理时显示锁图标
        if (!this.cleared && this.enemies.length > 0) {
            ctx.fillStyle = 'rgba(255,100,100,0.5)';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🔒', this.width / 2, this.wallThickness + 30);
        }
    }

    drawDoors(ctx) {
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const doorSize = 70;
        
        for (const [dir, door] of Object.entries(this.doors)) {
            if (!door) continue;
            
            const isOpen = door.open;
            ctx.fillStyle = isOpen ? '#2a4a2a' : '#4a2a2a';
            
            switch (parseInt(dir)) {
                case Direction.UP:
                    ctx.fillRect(centerX - doorSize / 2, 0, doorSize, this.wallThickness);
                    if (!isOpen) {
                        ctx.fillStyle = '#888';
                        ctx.fillRect(centerX - 15, 5, 30, 25);
                    }
                    break;
                case Direction.DOWN:
                    ctx.fillRect(centerX - doorSize / 2, this.height - this.wallThickness, doorSize, this.wallThickness);
                    if (!isOpen) {
                        ctx.fillStyle = '#888';
                        ctx.fillRect(centerX - 15, this.height - 30, 30, 25);
                    }
                    break;
                case Direction.LEFT:
                    ctx.fillRect(0, centerY - doorSize / 2, this.wallThickness, doorSize);
                    if (!isOpen) {
                        ctx.fillStyle = '#888';
                        ctx.fillRect(5, centerY - 15, 25, 30);
                    }
                    break;
                case Direction.RIGHT:
                    ctx.fillRect(this.width - this.wallThickness, centerY - doorSize / 2, this.wallThickness, doorSize);
                    if (!isOpen) {
                        ctx.fillStyle = '#888';
                        ctx.fillRect(this.width - 30, centerY - 15, 25, 30);
                    }
                    break;
            }
        }
    }
}

// ==================== 地图生成器 ====================
class MapGenerator {
    constructor() {
        this.rooms = new Map();
        this.minRooms = 8;
        this.maxRooms = 12;
    }

    generate(seed = Math.random()) {
        this.rooms.clear();
        
        // 起始房间
        const startRoom = new IsaacRoom(0, 0, RoomType.START);
        this.rooms.set(startRoom.id, startRoom);
        
        // BFS生成地图
        let roomCount = 1;
        const queue = [startRoom];
        const directions = [
            { dx: 0, dy: -1, dir: Direction.UP, opposite: Direction.DOWN },
            { dx: 1, dy: 0, dir: Direction.RIGHT, opposite: Direction.LEFT },
            { dx: 0, dy: 1, dir: Direction.DOWN, opposite: Direction.UP },
            { dx: -1, dy: 0, dir: Direction.LEFT, opposite: Direction.RIGHT }
        ];
        
        while (queue.length > 0 && roomCount < this.maxRooms) {
            const current = queue.shift();
            
            // 随机打乱方向
            const shuffledDirs = [...directions].sort(() => Math.random() - 0.5);
            
            for (const { dx, dy, dir, opposite } of shuffledDirs) {
                const newX = current.gridX + dx;
                const newY = current.gridY + dy;
                const newId = `${newX},${newY}`;
                
                // 检查是否已存在
                if (this.rooms.has(newId)) {
                    // 连接现有房间
                    const existingRoom = this.rooms.get(newId);
                    if (!current.doors[dir]) {
                        current.doors[dir] = { open: false, target: existingRoom };
                        existingRoom.doors[opposite] = { open: false, target: current };
                    }
                    continue;
                }
                
                // 随机决定是否创建新房间
                if (Math.random() > 0.6 || roomCount < this.minRooms) {
                    // 确定房间类型
                    let type = RoomType.NORMAL;
                    if (roomCount === this.maxRooms - 1) type = RoomType.BOSS;
                    else if (Math.random() < 0.15) type = RoomType.TREASURE;
                    else if (Math.random() < 0.1) type = RoomType.SHOP;
                    
                    const newRoom = new IsaacRoom(newX, newY, type);
                    
                    // 双向连接
                    current.doors[dir] = { open: false, target: newRoom };
                    newRoom.doors[opposite] = { open: false, target: current };
                    
                    this.rooms.set(newId, newRoom);
                    queue.push(newRoom);
                    roomCount++;
                }
            }
        }
        
        return startRoom;
    }

    getRoom(x, y) {
        return this.rooms.get(`${x},${y}`);
    }
}

// ==================== 小地图 ====================
class Minimap {
    constructor() {
        this.cellSize = 20;
        this.padding = 10;
    }

    draw(ctx, currentRoom, allRooms, x, y) {
        ctx.save();
        
        // 找出边界
        let minX = 0, maxX = 0, minY = 0, maxY = 0;
        for (const room of allRooms.values()) {
            minX = Math.min(minX, room.gridX);
            maxX = Math.max(maxX, room.gridX);
            minY = Math.min(minY, room.gridY);
            maxY = Math.max(maxY, room.gridY);
        }
        
        const width = (maxX - minX + 1) * this.cellSize;
        const height = (maxY - minY + 1) * this.cellSize;
        
        // 背景
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(x, y, width + this.padding * 2, height + this.padding * 2);
        
        // 绘制房间
        for (const room of allRooms.values()) {
            const drawX = x + this.padding + (room.gridX - minX) * this.cellSize;
            const drawY = y + this.padding + (room.gridY - minY) * this.cellSize;
            
            if (room === currentRoom) {
                ctx.fillStyle = '#ff0';
            } else if (room.visited) {
                const colors = {
                    [RoomType.NORMAL]: '#888',
                    [RoomType.BOSS]: '#f00',
                    [RoomType.TREASURE]: '#0f0',
                    [RoomType.SHOP]: '#fa0',
                    [RoomType.START]: '#88f'
                };
                ctx.fillStyle = colors[room.type] || '#888';
            } else {
                continue; // 未访问不显示
            }
            
            ctx.fillRect(drawX + 2, drawY + 2, this.cellSize - 4, this.cellSize - 4);
            
            // 绘制连接
            ctx.fillStyle = '#666';
            if (room.doors[Direction.UP] && room.visited) {
                ctx.fillRect(drawX + this.cellSize / 2 - 2, drawY, 4, 2);
            }
            if (room.doors[Direction.DOWN] && room.visited) {
                ctx.fillRect(drawX + this.cellSize / 2 - 2, drawY + this.cellSize - 2, 4, 2);
            }
        }
        
        ctx.restore();
    }
}

// ==================== 导出 ====================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        IsaacRoom, MapGenerator, Minimap, 
        RoomType, Direction 
    };
}
