/**
 * MapGenerator - 地图生成器
 * 生成随机房间布局的Roguelike地图
 */

class MapGenerator {
    constructor(world) {
        this.world = world;
        
        // 地图配置
        this.config = {
            gridSize: { x: 5, y: 5 },      // 房间网格大小
            roomSize: { min: 10, max: 20 }, // 房间大小（格子数）
            cellSize: 32,                   // 每个格子像素大小
            roomCount: { min: 5, max: 12 }, // 房间数量
            corridorWidth: 2,               // 走廊宽度
            loopChance: 0.3                 // 生成环路的几率
        };
        
        // 房间类型权重
        this.roomTypes = {
            start: { weight: 0, max: 1 },
            normal: { weight: 50, max: 999 },
            combat: { weight: 30, max: 10 },
            treasure: { weight: 10, max: 3 },
            shop: { weight: 8, max: 2 },
            boss: { weight: 0, max: 1 },
            secret: { weight: 2, max: 2 },
            stairs: { weight: 0, max: 1 }   // 下楼楼梯房间
        };
        
        // 楼层配置 - 房间数 = 5 + 层数，每层独立Boss（v0.12.0原版6Boss），大幅增加怪物密度
        this.floorConfigs = {
            1: { roomCount: { min: 6, max: 6 }, enemyLevel: 1, eliteChance: 0.1, hasBoss: true, bossType: 'floor1', enemySpawnMultiplier: 1.0, packSizeMultiplier: 1.0 },
            2: { roomCount: { min: 7, max: 7 }, enemyLevel: 2, eliteChance: 0.15, hasBoss: true, bossType: 'floor2', enemySpawnMultiplier: 1.5, packSizeMultiplier: 1.5 },
            3: { roomCount: { min: 8, max: 8 }, enemyLevel: 3, eliteChance: 0.2, hasBoss: true, bossType: 'floor3', enemySpawnMultiplier: 2.0, packSizeMultiplier: 2.0 },
            4: { roomCount: { min: 9, max: 9 }, enemyLevel: 4, eliteChance: 0.25, hasBoss: true, bossType: 'floor4', enemySpawnMultiplier: 3.0, packSizeMultiplier: 3.0 },
            5: { roomCount: { min: 10, max: 10 }, enemyLevel: 5, eliteChance: 0.3, hasBoss: true, bossType: 'floor5', enemySpawnMultiplier: 4.5, packSizeMultiplier: 4.0 },
            6: { roomCount: { min: 11, max: 11 }, enemyLevel: 6, eliteChance: 0.35, hasBoss: true, bossType: 'floor6', enemySpawnMultiplier: 6.0, packSizeMultiplier: 5.0 }
        };
        
        // 生成的地图数据
        this.rooms = new Map();      // key: "x,y", value: roomData
        this.corridors = [];         // 走廊数据
        this.grid = null;            // 二维网格
        this.currentFloor = 1;       // 当前楼层
    }
    
    /**
     * 生成新地图
     */
    generate(floor = 1, seed = null) {
        this.currentFloor = floor;
        
        if (seed) {
            this.setRandomSeed(seed);
        }
        
        this.rooms.clear();
        this.corridors = [];
        
        // 获取楼层配置
        const floorConfig = this.floorConfigs[floor] || this.floorConfigs[1];
        
        // 1. 创建房间布局
        this.generateRoomLayout(floorConfig);
        
        // 2. 连接房间
        this.connectRooms();
        
        // 3. 生成环路
        this.createLoops();
        
        // 4. 分配房间类型
        this.assignRoomTypes(floorConfig);
        
        // 5. 生成房间内容
        this.generateRoomContents(floorConfig);
        
        // 6. 放置楼梯
        this.placeStairs();
        
        console.log(`Floor ${floor} generated: ${this.rooms.size} rooms`);
        return this.getMapData();
    }
    
    /**
     * 创建房间布局（随机漫步算法）
     */
    generateRoomLayout(floorConfig) {
        const centerX = Math.floor(this.config.gridSize.x / 2);
        const centerY = Math.floor(this.config.gridSize.y / 2);
        
        // 从中心开始
        this.addRoom(centerX, centerY, 'start');
        
        let currentX = centerX;
        let currentY = centerY;
        const targetRoomCount = this.randomRange(
            floorConfig.roomCount.min,
            floorConfig.roomCount.max
        );
        
        // 随机漫步生成房间
        while (this.rooms.size < targetRoomCount) {
            const directions = [
                { x: 0, y: -1 }, // 上
                { x: 0, y: 1 },  // 下
                { x: -1, y: 0 }, // 左
                { x: 1, y: 0 }   // 右
            ];
            
            // 随机选择方向
            const dir = directions[Math.floor(Math.random() * directions.length)];
            const newX = currentX + dir.x;
            const newY = currentY + dir.y;
            
            // 检查边界
            if (newX < 0 || newX >= this.config.gridSize.x ||
                newY < 0 || newY >= this.config.gridSize.y) {
                continue;
            }
            
            const key = `${newX},${newY}`;
            
            // 如果位置为空，创建新房间
            if (!this.rooms.has(key)) {
                this.addRoom(newX, newY, 'normal');
            }
            
            // 一定概率继续从当前位置扩展，一定概率跳到随机已有房间
            if (Math.random() < 0.7) {
                currentX = newX;
                currentY = newY;
            } else {
                const existingRooms = Array.from(this.rooms.values());
                const randomRoom = existingRooms[Math.floor(Math.random() * existingRooms.length)];
                currentX = randomRoom.gridX;
                currentY = randomRoom.gridY;
            }
        }
    }
    
    /**
     * 连接房间（最小生成树）
     */
    connectRooms() {
        const roomList = Array.from(this.rooms.values());
        const connected = new Set();
        const unconnected = new Set(roomList);
        
        // 从起始房间开始
        const startRoom = roomList.find(r => r.type === 'start');
        if (startRoom) {
            connected.add(startRoom);
            unconnected.delete(startRoom);
        }
        
        // 连接所有房间
        while (unconnected.size > 0) {
            let bestConnection = null;
            let minDistance = Infinity;
            
            // 找到最近的未连接房间
            for (const connRoom of connected) {
                for (const unconnRoom of unconnected) {
                    const dist = this.getRoomDistance(connRoom, unconnRoom);
                    if (dist < minDistance) {
                        minDistance = dist;
                        bestConnection = {
                            from: connRoom,
                            to: unconnRoom
                        };
                    }
                }
            }
            
            if (bestConnection) {
                this.createCorridor(bestConnection.from, bestConnection.to);
                connected.add(bestConnection.to);
                unconnected.delete(bestConnection.to);
            }
        }
    }
    
    /**
     * 创建环路
     */
    createLoops() {
        const roomList = Array.from(this.rooms.values());
        
        for (let i = 0; i < roomList.length; i++) {
            for (let j = i + 1; j < roomList.length; j++) {
                const roomA = roomList[i];
                const roomB = roomList[j];
                
                // 检查是否已连接
                if (this.areRoomsConnected(roomA, roomB)) continue;
                
                // 随机决定是否创建环路
                if (Math.random() < this.config.loopChance) {
                    const dist = this.getRoomDistance(roomA, roomB);
                    if (dist <= 2) { // 只连接近距离房间
                        this.createCorridor(roomA, roomB);
                    }
                }
            }
        }
    }
    
    /**
     * 分配房间类型
     */
    assignRoomTypes(floorConfig) {
        const roomList = Array.from(this.rooms.values());
        const typeCounts = {};
        
        // 初始化计数
        for (const type in this.roomTypes) {
            typeCounts[type] = 0;
        }
        
        const startRoom = roomList.find(r => r.type === 'start');
        
        // Boss房间放在最远的房间（如果该层有Boss）
        if (floorConfig.hasBoss) {
            let farthestRoom = null;
            let maxDist = 0;
            
            for (const room of roomList) {
                if (room.type === 'start') continue;
                
                const dist = this.getRoomDistance(room, startRoom);
                if (dist > maxDist) {
                    maxDist = dist;
                    farthestRoom = room;
                }
            }
            
            if (farthestRoom) {
                farthestRoom.type = 'boss';
                farthestRoom.bossType = floorConfig.bossType;
                typeCounts.boss++;
            }
        }
        
        // 分配其他房间类型
        for (const room of roomList) {
            if (room.type === 'start' || room.type === 'boss') continue;
            
            const availableTypes = [];
            for (const [type, config] of Object.entries(this.roomTypes)) {
                if (typeCounts[type] < config.max && config.weight > 0) {
                    // 根据权重添加
                    for (let i = 0; i < config.weight; i++) {
                        availableTypes.push(type);
                    }
                }
            }
            
            if (availableTypes.length > 0) {
                const selectedType = availableTypes[Math.floor(Math.random() * availableTypes.length)];
                room.type = selectedType;
                typeCounts[selectedType]++;
            }
        }
    }
    
    /**
     * 生成房间内容
     */
    generateRoomContents(floorConfig) {
        for (const room of this.rooms.values()) {
            // 生成房间尺寸
            room.width = this.randomRange(this.config.roomSize.min, this.config.roomSize.max);
            room.height = this.randomRange(this.config.roomSize.min, this.config.roomSize.max);
            
            // 生成地形
            room.terrain = this.generateTerrain(room);
            
            // 根据类型生成内容
            switch (room.type) {
                case 'combat':
                    room.enemySpawns = this.generateEnemySpawns(room, floorConfig);
                    break;
                case 'treasure':
                    room.treasures = this.generateTreasures(room, floorConfig);
                    break;
                case 'shop':
                    room.shopItems = this.generateShopItems(room, floorConfig);
                    break;
                case 'boss':
                    room.bossSpawn = { 
                        x: Math.floor(room.width / 2), 
                        y: Math.floor(room.height / 2),
                        bossType: room.bossType || 'boss_goblinKing'
                    };
                    break;
            }
        }
    }
    
    /**
     * 放置下楼楼梯
     */
    placeStairs() {
        // 找到最远的非Boss房间放置楼梯
        const roomList = Array.from(this.rooms.values());
        const startRoom = roomList.find(r => r.type === 'start');
        
        let stairsRoom = null;
        let maxDist = 0;
        
        for (const room of roomList) {
            if (room.type === 'start' || room.type === 'boss') continue;
            
            const dist = this.getRoomDistance(room, startRoom);
            if (dist > maxDist) {
                maxDist = dist;
                stairsRoom = room;
            }
        }
        
        // 如果没有合适的房间，使用任意非起始房间
        if (!stairsRoom) {
            stairsRoom = roomList.find(r => r.type !== 'start');
        }
        
        if (stairsRoom) {
            stairsRoom.hasStairs = true;
            stairsRoom.stairsPos = {
                x: Math.floor(stairsRoom.width / 2),
                y: Math.floor(stairsRoom.height / 2)
            };
        }
    }
    
    /**
     * 生成地形
     */
    generateTerrain(room) {
        const terrain = [];
        const obstacleCount = Math.floor(room.width * room.height * 0.05); // 5% 障碍物
        
        for (let i = 0; i < obstacleCount; i++) {
            terrain.push({
                x: Math.floor(Math.random() * room.width),
                y: Math.floor(Math.random() * room.height),
                type: 'obstacle'
            });
        }
        
        return terrain;
    }
    
    /**
     * 生成敌人刷新点 - 割草模式：后期大量刷怪
     */
    generateEnemySpawns(room, floorConfig) {
        const spawns = [];
        const spawnMult = floorConfig.enemySpawnMultiplier || 1.0;
        const packMult = floorConfig.packSizeMultiplier || 1.0;
        
        // 基础刷新点数量 × 倍率（后期更多刷新点）
        const baseSpawnPoints = Math.floor(this.currentFloor / 2) + 2;
        const spawnPointCount = Math.floor((baseSpawnPoints + Math.floor(Math.random() * 3)) * spawnMult);
        
        // 根据楼层选择敌人类型
        const enemyTiers = this.getEnemyTiersForFloor(this.currentFloor);
        
        for (let i = 0; i < spawnPointCount; i++) {
            const isElite = Math.random() < floorConfig.eliteChance;
            
            // 每个刷新点的怪物群大小 × 倍率（割草爽感来源）
            const basePackSize = 1 + Math.floor(Math.random() * (1 + Math.floor(this.currentFloor / 3)));
            const packSize = Math.max(1, Math.floor(basePackSize * packMult));
            
            spawns.push({
                x: 2 + Math.floor(Math.random() * (room.width - 4)),
                y: 2 + Math.floor(Math.random() * (room.height - 4)),
                enemyTypes: isElite ? enemyTiers.elite : enemyTiers.normal,
                spawnCount: packSize,
                isElite: isElite
            });
        }
        
        return spawns;
    }
    
    /**
     * 根据楼层获取敌人类型
     */
    getEnemyTiersForFloor(floor) {
        const tiers = {
            1: {
                normal: ['chick', 'mouse', 'pigeon', 'snail'],
                elite: ['rabbit2', 'bee']
            },
            2: {
                normal: ['slime', 'goblin', 'rabbit', 'bird'],
                elite: ['orc', 'panther']
            },
            3: {
                normal: ['skeleton', 'dog', 'pig', 'snake'],
                elite: ['crab', 'bear', 'dark_knight']
            },
            4: {
                normal: ['sheep', 'duck', 'squirrel', 'ghost'],
                elite: ['mage', 'spider', 'turtle']
            },
            5: {
                normal: ['wolf', 'skeleton', 'ghost'],
                elite: ['mimic', 'dark_knight', 'bear']
            },
            6: {
                normal: ['ghost', 'dark_knight', 'skeleton'],
                elite: ['turtle', 'mimic', 'boss_wolfKing']
            }
        };
        
        return tiers[floor] || tiers[1];
    }
    
    /**
     * 生成宝藏
     */
    generateTreasures(room) {
        return [{
            x: room.width / 2,
            y: room.height / 2,
            type: 'chest',
            items: ['health_potion', 'power_shard']
        }];
    }
    
    /**
     * 生成商店物品
     */
    generateShopItems(room) {
        return [
            { itemId: 'health_potion', price: 10 },
            { itemId: 'power_shard', price: 50 },
            { itemId: 'swift_boots', price: 100 }
        ];
    }
    
    /**
     * 创建走廊连接两个房间
     */
    createCorridor(roomA, roomB) {
        const corridor = {
            roomA: roomA,
            roomB: roomB,
            path: []
        };
        
        // 简单的L形走廊
        const midX = roomA.gridX;
        const midY = roomB.gridY;
        
        // 水平段
        const startX = Math.min(roomA.gridX, roomB.gridX);
        const endX = Math.max(roomA.gridX, roomB.gridX);
        for (let x = startX; x <= endX; x++) {
            corridor.path.push({ x, y: midY });
        }
        
        // 垂直段
        const startY = Math.min(roomA.gridY, roomB.gridY);
        const endY = Math.max(roomA.gridY, roomB.gridY);
        for (let y = startY; y <= endY; y++) {
            if (y !== midY) { // 避免重复添加拐角
                corridor.path.push({ x: midX, y });
            }
        }
        
        this.corridors.push(corridor);
        
        // 添加到房间的连接列表
        if (!roomA.connections) roomA.connections = [];
        if (!roomB.connections) roomB.connections = [];
        roomA.connections.push(roomB);
        roomB.connections.push(roomA);
    }
    
    /**
     * 添加房间
     */
    addRoom(gridX, gridY, type = 'normal') {
        const key = `${gridX},${gridY}`;
        const room = {
            id: key,
            gridX,
            gridY,
            type,
            x: gridX * this.config.roomSize.max * this.config.cellSize,
            y: gridY * this.config.roomSize.max * this.config.cellSize,
            width: 0,
            height: 0,
            connections: [],
            isCleared: false,
            isVisited: false
        };
        this.rooms.set(key, room);
        return room;
    }
    
    /**
     * 获取房间距离（曼哈顿距离）
     */
    getRoomDistance(roomA, roomB) {
        return Math.abs(roomA.gridX - roomB.gridX) + Math.abs(roomA.gridY - roomB.gridY);
    }
    
    /**
     * 检查两个房间是否已连接
     */
    areRoomsConnected(roomA, roomB) {
        return roomA.connections && roomA.connections.includes(roomB);
    }
    
    /**
     * 随机范围
     */
    randomRange(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    /**
     * 设置随机种子
     */
    setRandomSeed(seed) {
        // 简单的伪随机数生成器
        let s = seed;
        Math.random = function() {
            s = (s * 9301 + 49297) % 233280;
            return s / 233280;
        };
    }
    
    /**
     * 获取地图数据
     */
    getMapData() {
        return {
            rooms: Array.from(this.rooms.values()),
            corridors: this.corridors,
            config: this.config,
            startRoom: Array.from(this.rooms.values()).find(r => r.type === 'start'),
            bossRoom: Array.from(this.rooms.values()).find(r => r.type === 'boss')
        };
    }
    
    /**
     * 世界坐标转房间ID
     */
    worldToRoomId(x, y) {
        const gridX = Math.floor(x / (this.config.roomSize.max * this.config.cellSize));
        const gridY = Math.floor(y / (this.config.roomSize.max * this.config.cellSize));
        return `${gridX},${gridY}`;
    }
}

window.MapGenerator = MapGenerator;
