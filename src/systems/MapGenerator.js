class MapGenerator {

    generate(floor = 1) {

        const rooms = new Map();

        const start = new Room(0, 0, 'start', floor);

        rooms.set(start.id, start);

        

        const queue = [start];

        const dirs = [

            { dx: 0, dy: -1, name: 'up', opp: 'down' },

            { dx: 1, dy: 0, name: 'right', opp: 'left' },

            { dx: 0, dy: 1, name: 'down', opp: 'up' },

            { dx: -1, dy: 0, name: 'left', opp: 'right' }

        ];

        

        let count = 1;

        // v0.20.0: 固定房间数 = 8 + 层数 (1层=9房, 6层=14房)
        const maxRooms = 8 + floor;

        

        while (queue.length && count < maxRooms) {

            const cur = queue.shift();

            for (const dir of dirs.sort(() => Math.random() - 0.5)) {

                const nx = cur.gx + dir.dx, ny = cur.gy + dir.dy;

                const id = `${floor}_${nx},${ny}`;

                

                if (rooms.has(id)) {

                    const ex = rooms.get(id);

                    if (!cur.doors[dir.name]) {

                        cur.doors[dir.name] = { open: cur.cleared, target: ex };

                        ex.doors[dir.opp] = { open: ex.cleared, target: cur };

                    }

                    continue;

                }

                

                if (Math.random() > 0.4 || count < 5) {

                    let type = 'normal';

                    if (count === maxRooms - 1) {
                        // 最后一个房间：Boss房
                        type = 'boss';
                    } else if (count === 5) {
                        // 第5个房间固定为宝箱房
                        type = 'treasure';
                    } else if (count === 6) {
                        // 第6个房间固定为精英房
                        type = 'elite';
                    } else if (count === 7) {
                        // 第7个房间固定为商店房
                        type = 'shop';
                    }

                    

                    const nr = new Room(nx, ny, type, floor);

                    cur.doors[dir.name] = { open: cur.cleared, target: nr };

                    nr.doors[dir.opp] = { open: nr.cleared, target: cur };

                    rooms.set(id, nr);

                    queue.push(nr);

                    count++;

                }

            }

        }

        

        // 修复：确保所有相邻房间都有双向门连接

        this.fixDoorConnections(rooms);
        
        // 确保每层至少有1个商店和1个宝箱
        this.ensureSpecialRooms(rooms, start);

        

        return { start, rooms };

    }

    

    // 修复门连接：确保相邻房间都有双向门

    fixDoorConnections(rooms) {

        const dirs = [

            { dx: 0, dy: -1, name: 'up', opp: 'down' },

            { dx: 1, dy: 0, name: 'right', opp: 'left' },

            { dx: 0, dy: 1, name: 'down', opp: 'up' },

            { dx: -1, dy: 0, name: 'left', opp: 'right' }

        ];

        

        for (const room of rooms.values()) {

            for (const dir of dirs) {

                const nx = room.gx + dir.dx;

                const ny = room.gy + dir.dy;

                // 优先使用带 floor 的键，如果不存在则使用备用键
                let neighborId = `${room.floor}_${nx},${ny}`;
                if (!rooms.has(neighborId)) {
                    neighborId = `${nx},${ny}`;
                }

                

                if (rooms.has(neighborId)) {

                    const neighbor = rooms.get(neighborId);

                    // 如果当前房间没有这个方向的门，创建一个

                    if (!room.doors[dir.name]) {

                        room.doors[dir.name] = { 

                            open: room.cleared, 

                            target: neighbor 

                        };

                    }

                    // 如果相邻房间没有反向的门，创建一个

                    if (!neighbor.doors[dir.opp]) {

                        neighbor.doors[dir.opp] = { 

                            open: neighbor.cleared, 

                            target: room 

                        };

                    }

                }

            }

        }

    }
    
    // 确保每层至少有1个商店和1个宝箱
    ensureSpecialRooms(rooms, start) {
        const roomList = Array.from(rooms.values());
        
        // 检查是否已有商店和宝箱
        const hasShop = roomList.some(r => r.type === 'shop');
        const hasTreasure = roomList.some(r => r.type === 'treasure');
        
        // 获取非起点、非boss的普通房间列表
        const normalRooms = roomList.filter(r => 
            r.type === 'normal' && 
            r !== start && 
            !r.bossRoom
        );
        
        // 如果没有宝箱，将第一个普通房改为宝箱房
        if (!hasTreasure && normalRooms.length > 0) {
            normalRooms[0].type = 'treasure';
            normalRooms[0].cleared = true;
            // 生成宝箱
            normalRooms[0].chest = {
                x: normalRooms[0].centerX,
                y: normalRooms[0].centerY,
                opened: false,
                items: []
            };
            // v0.17.2: 移除调试日志
            // console.log(`宝箱房强制添加在 (${normalRooms[0].gx}, ${normalRooms[0].gy})`);
        }
        
        // 如果没有商店，将第二个普通房或新的一个房改为商店
        if (!hasShop) {
            const shopRoom = normalRooms.find(r => r.type === 'normal') || normalRooms[0];
            if (shopRoom) {
                shopRoom.type = 'shop';
                shopRoom.cleared = true;
                // 创建盲眼NPC
                shopRoom.npc = new ShopNPC(shopRoom.centerX, shopRoom.centerY);
            // v0.17.2: 移除调试日志
            // console.log(`商店房强制添加在 (${shopRoom.gx}, ${shopRoom.gy})`);
            }
        }
    }

}



// ============================================================================

// 主游戏类 v0.7.2

// ============================================================================

// ==================== 吸血鬼幸存者风格重构 ====================

const SURVIVOR_CONFIG = {

    // v0.34: 16:9 完整镜头 1920x1080，游戏区 960x960 居中
    VIEW_WIDTH: 1920, VIEW_HEIGHT: 1080,

    CAMERA_SMOOTH: 0.1,

    WAVE_INTERVAL: 30, WAVE_BASE_COUNT: 20, WAVE_INCREMENT: 5,

    GRID_CELL_SIZE: 150,

    // 自适应视野：如果屏幕够大就显示完整房间

    ADAPTIVE_VIEW: true,

    // 房间尺寸：扩大以容纳加厚墙
    ROOM_WIDTH: 2000,
    ROOM_HEIGHT: 2000,
    
    // 墙厚度：增加以更好显示门
    WALL_THICKNESS: 120,
    
    // 地板区域边界（排除墙的区域）
    get floorLeft() { return this.WALL_THICKNESS; },
    get floorTop() { return this.WALL_THICKNESS; },
    get floorRight() { return this.ROOM_WIDTH - this.WALL_THICKNESS; },
    get floorBottom() { return this.ROOM_HEIGHT - this.WALL_THICKNESS; },
    
    // 门区域宽度（从中心向两侧延伸的距离）
    DOOR_WIDTH_HALF: 40,
    DOOR_HEIGHT_HALF: 30,
    
    // 检查位置是否在有效区域内（地板+门）
    isInValidArea(x, y, room) {
        const centerX = this.ROOM_WIDTH / 2;
        const centerY = this.ROOM_HEIGHT / 2;
        const doorWH = this.DOOR_WIDTH_HALF;
        const doorHH = this.DOOR_HEIGHT_HALF;
        
        // 首先检查是否在地板区域内
        const inFloor = x >= this.floorLeft && x <= this.floorRight && 
                        y >= this.floorTop && y <= this.floorBottom;
        if (inFloor) return true;
        
        // 如果不在地板内，检查是否在任何开放的门区域内
        if (!room || !room.doors) return false;
        
        const doors = room.doors;
        
        // 左侧门
        if (doors.left && doors.left.open) {
            if (x < this.floorLeft && y > centerY - doorWH && y < centerY + doorWH) return true;
        }
        // 右侧门
        if (doors.right && doors.right.open) {
            if (x > this.floorRight && y > centerY - doorWH && y < centerY + doorWH) return true;
        }
        // 上侧门
        if (doors.up && doors.up.open) {
            if (y < this.floorTop && x > centerX - doorHH && x < centerX + doorHH) return true;
        }
        // 下侧门
        if (doors.down && doors.down.open) {
            if (y > this.floorBottom && x > centerX - doorHH && x < centerX + doorHH) return true;
        }
        
        return false;
    },
    
    // 将位置限制在有效区域内
    clampToValidArea(x, y, room) {
        const centerX = this.ROOM_WIDTH / 2;
        const centerY = this.ROOM_HEIGHT / 2;
        const doorWH = this.DOOR_WIDTH_HALF;
        const doorHH = this.DOOR_HEIGHT_HALF;
        
        // 如果已经在有效区域内，直接返回
        if (this.isInValidArea(x, y, room)) return { x, y };
        
        // 尝试限制到地板区域
        let clampedX = clamp(x, this.floorLeft, this.floorRight);
        let clampedY = clamp(y, this.floorTop, this.floorBottom);
        
        // 如果限制后位置仍然不在有效区域（可能在角落），检查门区域
        if (!this.isInValidArea(clampedX, clampedY, room)) {
            // 检查哪个门最近，尝试进入门区域
            if (room && room.doors) {
                const doors = room.doors;
                
                // 左侧
                if (doors.left && doors.left.open && x < this.floorLeft && Math.abs(y - centerY) < doorWH) {
                    clampedX = this.floorLeft;
                    clampedY = clamp(y, centerY - doorWH, centerY + doorWH);
                }
                // 右侧
                else if (doors.right && doors.right.open && x > this.floorRight && Math.abs(y - centerY) < doorWH) {
                    clampedX = this.floorRight;
                    clampedY = clamp(y, centerY - doorWH, centerY + doorWH);
                }
                // 上侧
                else if (doors.up && doors.up.open && y < this.floorTop && Math.abs(x - centerX) < doorHH) {
                    clampedX = clamp(x, centerX - doorHH, centerX + doorHH);
                    clampedY = this.floorTop;
                }
                // 下侧
                else if (doors.down && doors.down.open && y > this.floorBottom && Math.abs(x - centerX) < doorHH) {
                    clampedX = clamp(x, centerX - doorHH, centerX + doorHH);
                    clampedY = this.floorBottom;
                }
            }
        }
        
        return { x: clampedX, y: clampedY };
    }

};




// Export to global
window.MapGenerator = MapGenerator;
