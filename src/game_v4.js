// 肉鸽牛牛 v4.0 - 地图房间系统
// 添加以撒式的房间探索和地图生成

// ========== 房间类型 ==========
const ROOM_TYPES = {
    START: 'start',
    NORMAL: 'normal',
    SHOP: 'shop',
    TREASURE: 'treasure',
    BOSS: 'boss',
    SECRET: 'secret'
};

class Room {
    constructor(x, y, type = ROOM_TYPES.NORMAL) {
        this.gridX = x;
        this.gridY = y;
        this.type = type;
        this.width = 800;
        this.height = 600;
        this.doors = { up: null, down: null, left: null, right: null };
        this.visited = false;
        this.cleared = false;
        this.enemies = [];
        this.items = [];
        this.doorsLocked = false;
    }
    
    generateContent(wave) {
        // 根据房间类型生成内容
        if (this.type === ROOM_TYPES.START) {
            this.cleared = true;
            return;
        }
        
        if (this.type === ROOM_TYPES.NORMAL) {
            // 生成普通敌人
            const count = 3 + Math.floor(wave / 2);
            for (let i = 0; i < count; i++) {
                this.enemies.push({
                    type: Math.random() < 0.3 ? 'chick' : 'pig',
                    x: 200 + Math.random() * 400,
                    y: 150 + Math.random() * 300
                });
            }
        }
        
        if (this.type === ROOM_TYPES.SHOP) {
            // 商店：固定3个道具出售
            this.items = ['heart', 'milk', 'bell'];
            this.cleared = true;
        }
        
        if (this.type === ROOM_TYPES.TREASURE) {
            // 宝箱房：1个免费道具
            const keys = Object.keys(ITEMS);
            this.items = [keys[Math.floor(Math.random() * keys.length)]];
            this.cleared = true;
        }
        
        if (this.type === ROOM_TYPES.BOSS) {
            // Boss房
            this.enemies.push({ type: 'boss', x: 400, y: 250 });
        }
    }
    
    clear() {
        this.cleared = true;
        this.doorsLocked = false;
    }
}

// ========== 地图生成器 ==========
class DungeonGenerator {
    constructor() {
        this.rooms = [];
        this.mapSize = 5; // 5x5地图
        this.startRoom = null;
        this.bossRoom = null;
    }
    
    generate() {
        this.rooms = [];
        const grid = Array(this.mapSize).fill(null).map(() => Array(this.mapSize).fill(null));
        
        // 起点在中心
        const center = Math.floor(this.mapSize / 2);
        this.startRoom = new Room(center, center, ROOM_TYPES.START);
        grid[center][center] = this.startRoom;
        this.rooms.push(this.startRoom);
        
        // 随机生成相邻房间
        let roomCount = 1;
        const maxRooms = 8 + Math.floor(Math.random() * 5);
        
        while (roomCount < maxRooms) {
            // 找一个已有房间，尝试在其相邻位置生成新房间
            const existingRoom = this.rooms[Math.floor(Math.random() * this.rooms.length)];
            const directions = [
                { dx: 0, dy: -1, dir: 'up', opposite: 'down' },
                { dx: 0, dy: 1, dir: 'down', opposite: 'up' },
                { dx: -1, dy: 0, dir: 'left', opposite: 'right' },
                { dx: 1, dy: 0, dir: 'right', opposite: 'left' }
            ].sort(() => Math.random() - 0.5);
            
            for (let d of directions) {
                const nx = existingRoom.gridX + d.dx;
                const ny = existingRoom.gridY + d.dy;
                
                if (nx >= 0 && nx < this.mapSize && ny >= 0 && ny < this.mapSize && !grid[ny][nx]) {
                    // 决定房间类型
                    let type = ROOM_TYPES.NORMAL;
                    const rand = Math.random();
                    if (rand < 0.1) type = ROOM_TYPES.SHOP;
                    else if (rand < 0.2) type = ROOM_TYPES.TREASURE;
                    
                    const newRoom = new Room(nx, ny, type);
                    grid[ny][nx] = newRoom;
                    
                    // 连接门
                    existingRoom.doors[d.dir] = newRoom;
                    newRoom.doors[d.opposite] = existingRoom;
                    
                    this.rooms.push(newRoom);
                    roomCount++;
                    break;
                }
            }
        }
        
        // 找一个最远房间做Boss房
        let maxDist = 0;
        for (let room of this.rooms) {
            if (room.type === ROOM_TYPES.START) continue;
            const dist = Math.abs(room.gridX - center) + Math.abs(room.gridY - center);
            if (dist > maxDist) {
                maxDist = dist;
                this.bossRoom = room;
            }
        }
        if (this.bossRoom) {
            this.bossRoom.type = ROOM_TYPES.BOSS;
        }
        
        return grid;
    }
    
    drawMinimap(ctx, currentRoom, x, y, scale = 0.15) {
        const mw = this.mapSize * 60 * scale;
        const mh = this.mapSize * 45 * scale;
        
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x, y, mw + 20, mh + 20);
        
        // 绘制房间
        for (let room of this.rooms) {
            const rx = x + 10 + room.gridX * 60 * scale;
            const ry = y + 10 + room.gridY * 45 * scale;
            const rw = 50 * scale;
            const rh = 35 * scale;
            
            // 房间颜色
            if (room === currentRoom) {
                ctx.fillStyle = '#2ECC71'; // 当前房间绿色
            } else if (room.visited) {
                ctx.fillStyle = '#95A5A6'; // 访问过灰色
            } else {
                ctx.fillStyle = '#2C3E50'; // 未访问深色
            }
            
            ctx.fillRect(rx, ry, rw, rh);
            
            // 特殊房间标记
            if (room.type === ROOM_TYPES.SHOP) {
                ctx.fillStyle = '#F1C40F';
                ctx.font = `${10 * scale}px monospace`;
                ctx.fillText('$', rx + 3, ry + 10);
            } else if (room.type === ROOM_TYPES.TREASURE) {
                ctx.fillStyle = '#E74C3C';
                ctx.fillText('?', rx + 3, ry + 10);
            } else if (room.type === ROOM_TYPES.BOSS) {
                ctx.fillStyle = '#C0392B';
                ctx.fillText('!', rx + 3, ry + 10);
            }
            
            // 门
            ctx.fillStyle = '#7F8C8D';
            if (room.doors.up) ctx.fillRect(rx + rw/2 - 5*scale, ry - 5*scale, 10*scale, 5*scale);
            if (room.doors.down) ctx.fillRect(rx + rw/2 - 5*scale, ry + rh, 10*scale, 5*scale);
            if (room.doors.left) ctx.fillRect(rx - 5*scale, ry + rh/2 - 5*scale, 5*scale, 10*scale);
            if (room.doors.right) ctx.fillRect(rx + rw, ry + rh/2 - 5*scale, 5*scale, 10*scale);
        }
    }
}

// ========== 房间切换逻辑 ==========
class RoomManager {
    constructor(game) {
        this.game = game;
        this.dungeon = new DungeonGenerator();
        this.grid = this.dungeon.generate();
        this.currentRoom = this.dungeon.startRoom;
        this.currentRoom.visited = true;
        this.transitioning = false;
    }
    
    update() {
        if (this.transitioning) return;
        
        const player = this.game.player;
        
        // 检查是否靠近门
        if (this.currentRoom.cleared) {
            // 上门
            if (player.y < 80 && this.currentRoom.doors.up) {
                this.transitionToRoom(this.currentRoom.doors.up, 'down');
            }
            // 下门
            else if (player.y > GAME_HEIGHT - 80 && this.currentRoom.doors.down) {
                this.transitionToRoom(this.currentRoom.doors.down, 'up');
            }
            // 左门
            else if (player.x < 80 && this.currentRoom.doors.left) {
                this.transitionToRoom(this.currentRoom.doors.left, 'right');
            }
            // 右门
            else if (player.x > GAME_WIDTH - 80 && this.currentRoom.doors.right) {
                this.transitionToRoom(this.currentRoom.doors.right, 'left');
            }
        }
    }
    
    transitionToRoom(newRoom, entryDir) {
        this.transitioning = true;
        
        // 淡入淡出效果（简化版）
        setTimeout(() => {
            this.currentRoom = newRoom;
            newRoom.visited = true;
            
            // 设置玩家位置
            const player = this.game.player;
            if (entryDir === 'up') { player.x = GAME_WIDTH / 2; player.y = GAME_HEIGHT - 100; }
            else if (entryDir === 'down') { player.x = GAME_WIDTH / 2; player.y = 100; }
            else if (entryDir === 'left') { player.x = GAME_WIDTH - 100; player.y = GAME_HEIGHT / 2; }
            else if (entryDir === 'right') { player.x = 100; player.y = GAME_HEIGHT / 2; }
            
            // 加载房间内容
            if (!newRoom.cleared && newRoom.enemies.length === 0) {
                newRoom.generateContent(this.game.wave);
                // 生成敌人实体
                for (let e of newRoom.enemies) {
                    this.game.spawnEnemyAt(e.type, e.x, e.y);
                }
            }
            
            this.transitioning = false;
        }, 300);
    }
    
    drawDoors(ctx) {
        const room = this.currentRoom;
        ctx.fillStyle = room.cleared ? '#27AE60' : '#C0392B';
        
        if (room.doors.up) {
            ctx.fillRect(GAME_WIDTH/2 - 40, 0, 80, 20);
        }
        if (room.doors.down) {
            ctx.fillRect(GAME_WIDTH/2 - 40, GAME_HEIGHT - 20, 80, 20);
        }
        if (room.doors.left) {
            ctx.fillRect(0, GAME_HEIGHT/2 - 40, 20, 80);
        }
        if (room.doors.right) {
            ctx.fillRect(GAME_WIDTH - 20, GAME_HEIGHT/2 - 40, 20, 80);
        }
    }
}

console.log('Room system loaded');
