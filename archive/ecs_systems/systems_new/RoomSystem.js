/**
 * RoomSystem - 房间系统
 * 管理房间状态、清理检测、传送门激活
 */

class RoomSystem {
    constructor(world) {
        this.world = world;
        this.priority = 11;
        this.enabled = true;
        
        // 地图生成器
        this.mapGenerator = new MapGenerator(world);
        
        // 当前地图数据
        this.currentMap = null;
        this.currentRoomId = null;
        this.currentFloor = 1;
        this.maxFloors = 6;
        
        // 房间实体映射
        this.roomEntities = new Map(); // roomId -> Set<entityId>
        
        // 房间状态
        this.rooms = new Map(); // roomId -> roomState
        
        // 迷雾战争
        this.fogOfWar = true;
        this.revealedRooms = new Set();
        
        // 楼梯实体
        this.stairsEntity = null;
    }
    
    init() {
        // 监听敌人死亡事件
        this.world.on('entityDestroyed', (entity) => {
            if (entity.hasTag('enemy')) {
                this.onEnemyKilled(entity);
            }
        });
    }
    
    /**
     * 生成新关卡
     */
    generateLevel(floor = 1) {
        this.currentFloor = floor;
        
        // 生成地图
        this.currentMap = this.mapGenerator.generate(floor);
        
        // 初始化房间状态
        this.rooms.clear();
        for (const room of this.currentMap.rooms) {
            this.rooms.set(room.id, {
                ...room,
                enemyCount: 0,
                isLocked: false,
                portalsActive: false
            });
        }
        
        // 创建地图实体
        this.createMapEntities();
        
        // 设置起始房间
        if (this.currentMap.startRoom) {
            this.enterRoom(this.currentMap.startRoom.id);
        }
        
        // 创建楼梯（如果不是最后一层）
        if (floor < this.maxFloors) {
            this.createStairs();
        }
        
        console.log(`Level ${floor} generated with ${this.currentMap.rooms.length} rooms`);
        this.world.emit('levelGenerated', floor, this.currentMap);
    }
    
    /**
     * 创建楼梯实体
     */
    createStairs() {
        // 找到有楼梯的房间
        const stairsRoom = this.currentMap.rooms.find(r => r.hasStairs);
        if (!stairsRoom) return;
        
        const cellSize = this.currentMap.config.cellSize;
        const x = stairsRoom.x + stairsRoom.stairsPos.x * cellSize;
        const y = stairsRoom.y + stairsRoom.stairsPos.y * cellSize;
        
        this.stairsEntity = this.world.createEntity()
            .add(new TransformComponent(x, y))
            .add(new SpriteComponent({ width: 48, height: 48 }))
            .add(new ColliderComponent({
                radius: 24,
                layer: 'stairs',
                isTrigger: true
            }))
            .addTag('stairs');
        
        // 设置楼梯纹理
        const sprite = this.stairsEntity.get(SpriteComponent);
        if (sprite) {
            sprite.texture = 'chest_closed'; // 使用箱子作为楼梯的临时纹理
        }
        
        console.log(`Stairs created in room ${stairsRoom.id} at (${x}, ${y})`);
    }
    
    /**
     * 检查玩家是否触发下楼
     */
    checkStairsTrigger(player) {
        if (!this.stairsEntity || this.currentFloor >= this.maxFloors) return false;
        
        const playerTransform = player.get(TransformComponent);
        const stairsTransform = this.stairsEntity.get(TransformComponent);
        
        if (!playerTransform || !stairsTransform) return false;
        
        const dx = playerTransform.x - stairsTransform.x;
        const dy = playerTransform.y - stairsTransform.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 40) {
            this.descendFloor();
            return true;
        }
        
        return false;
    }
    
    /**
     * 下楼到下一层
     */
    descendFloor() {
        if (this.currentFloor >= this.maxFloors) {
            console.log('Already at max floor!');
            return;
        }
        
        const nextFloor = this.currentFloor + 1;
        console.log(`Descending to floor ${nextFloor}...`);
        
        // 清除当前地图
        this.clearMapEntities();
        
        // 清除所有敌人
        const enemies = this.world.getEntitiesWithTag('enemy');
        for (const enemy of enemies) {
            enemy.destroy();
        }
        
        // 清除所有投射物
        const projectiles = this.world.getEntitiesWithTag('projectile');
        for (const proj of projectiles) {
            proj.destroy();
        }
        
        // 清除楼梯
        if (this.stairsEntity) {
            this.stairsEntity.destroy();
            this.stairsEntity = null;
        }
        
        // 生成新楼层
        this.generateLevel(nextFloor);
        
        // 触发事件
        this.world.emit('floorDescended', this.currentFloor, nextFloor);
    }
    
    /**
     * 创建地图实体（墙壁、障碍物等）
     */
    createMapEntities() {
        // 清除旧的地图实体
        this.clearMapEntities();
        
        for (const room of this.currentMap.rooms) {
            this.createRoomEntities(room);
        }
        
        // 创建走廊
        for (const corridor of this.currentMap.corridors) {
            this.createCorridorEntities(corridor);
        }
    }
    
    /**
     * 创建房间实体
     */
    createRoomEntities(room) {
        const cellSize = this.currentMap.config.cellSize;
        const entities = new Set();
        
        // 检查是否连接到Boss房
        const connectsToBoss = this.hasBossConnection(room);
        
        // 创建墙壁（房间边界）
        for (let x = 0; x < room.width; x++) {
            for (let y = 0; y < room.height; y++) {
                // 边界墙
                if (x === 0 || x === room.width - 1 || y === 0 || y === room.height - 1) {
                    // 检查是否是门位置（与其他房间连接的地方）
                    if (this.isDoorPosition(room, x, y)) {
                        // 检查这扇门是否通往Boss房
                        const leadsToBoss = this.isDoorToBoss(room, x, y);
                        
                        // 创建门（初始关闭）
                        const door = this.createDoor(
                            room.x + x * cellSize,
                            room.y + y * cellSize,
                            room.id,
                            leadsToBoss
                        );
                        entities.add(door.id);
                    } else {
                        // 创建墙壁
                        const wall = this.createWall(
                            room.x + x * cellSize,
                            room.y + y * cellSize
                        );
                        entities.add(wall.id);
                    }
                }
            }
        }
        
        // 创建内部障碍物
        for (const terrain of room.terrain) {
            const obstacle = this.createObstacle(
                room.x + terrain.x * cellSize,
                room.y + terrain.y * cellSize
            );
            entities.add(obstacle.id);
        }
        
        this.roomEntities.set(room.id, entities);
    }
    
    /**
     * 检查房间是否连接到Boss房
     */
    hasBossConnection(room) {
        if (!room.connections) return false;
        for (const connectedRoom of room.connections) {
            if (connectedRoom.type === 'boss') {
                return true;
            }
        }
        return false;
    }
    
    /**
     * 检查特定门位置是否通往Boss房
     */
    isDoorToBoss(room, x, y) {
        if (!room.connections) return false;
        
        const centerX = Math.floor(room.width / 2);
        const centerY = Math.floor(room.height / 2);
        
        for (const connectedRoom of room.connections) {
            if (connectedRoom.type !== 'boss') continue;
            
            const dx = connectedRoom.gridX - room.gridX;
            const dy = connectedRoom.gridY - room.gridY;
            
            // 检查这个门位置是否朝向Boss房
            if (dx === 1 && x === room.width - 1 && y === centerY) return true;
            if (dx === -1 && x === 0 && y === centerY) return true;
            if (dy === 1 && y === room.height - 1 && x === centerX) return true;
            if (dy === -1 && y === 0 && x === centerX) return true;
        }
        
        return false;
    }
    
    /**
     * 创建走廊实体
     */
    createCorridorEntities(corridor) {
        const cellSize = this.currentMap.config.cellSize;
        
        for (const point of corridor.path) {
            // 走廊地面（与其他区域区分）
            // 这里可以添加视觉上的走廊标记
        }
    }
    
    /**
     * 检查位置是否是门
     */
    isDoorPosition(room, x, y) {
        if (!room.connections) return false;
        
        const centerX = Math.floor(room.width / 2);
        const centerY = Math.floor(room.height / 2);
        
        for (const connectedRoom of room.connections) {
            const dx = connectedRoom.gridX - room.gridX;
            const dy = connectedRoom.gridY - room.gridY;
            
            // 检查是否是连接方向的门位置
            if (dx === 1 && x === room.width - 1 && y === centerY) return true;
            if (dx === -1 && x === 0 && y === centerY) return true;
            if (dy === 1 && y === room.height - 1 && x === centerX) return true;
            if (dy === -1 && y === 0 && x === centerX) return true;
        }
        
        return false;
    }
    
    /**
     * 创建墙壁
     */
    createWall(x, y) {
        const wall = this.world.createEntity()
            .add(new TransformComponent(x, y))
            .add(new SpriteComponent({ width: 32, height: 32 }))
            .add(new ColliderComponent({
                type: 'rectangle',
                width: 32,
                height: 32,
                layer: 'obstacle',
                isStatic: true
            }))
            .addTag('wall')
            .addTag('obstacle');
        
        // 设置纹理
        const sprite = wall.get(SpriteComponent);
        if (sprite) {
            const layerNum = Math.min(6, Math.max(1, this.currentFloor));
            sprite.texture = `layer${layerNum}_wall`;
        }
        
        return wall;
    }
    
    /**
     * 创建障碍物
     */
    createObstacle(x, y) {
        const obstacle = this.world.createEntity()
            .add(new TransformComponent(x, y))
            .add(new SpriteComponent({ width: 32, height: 32 }))
            .add(new ColliderComponent({
                type: 'rectangle',
                width: 24,
                height: 24,
                layer: 'obstacle',
                isStatic: true
            }))
            .addTag('obstacle');
        
        // 随机选择装饰纹理
        const decorations = ['deco_mushroom', 'deco_bone', 'deco_crystal', 'deco_egg'];
        const randomDeco = decorations[Math.floor(Math.random() * decorations.length)];
        
        const sprite = obstacle.get(SpriteComponent);
        if (sprite) {
            sprite.texture = randomDeco;
        }
        
        return obstacle;
    }
    
    /**
     * 创建门 - 通往Boss房的门有特殊效果
     */
    createDoor(x, y, roomId, leadsToBoss = false) {
        const door = this.world.createEntity()
            .add(new TransformComponent(x, y))
            .add(new SpriteComponent({ width: 32, height: 32 }))
            .add(new ColliderComponent({
                type: 'rectangle',
                width: 32,
                height: 32,
                layer: 'obstacle',
                isStatic: true
            }))
            .addTag('door')
            .addTag(`room_${roomId}`);
        
        const sprite = door.get(SpriteComponent);
        if (sprite) {
            const layerNum = Math.min(6, Math.max(1, this.currentFloor));
            
            // 通往Boss房的特殊标记
            if (leadsToBoss) {
                door.addTag('boss_door');
                sprite.color = '#ff0000';
                sprite.glowColor = '#ff4444';
                sprite.glowIntensity = 1.5;
            }
            
            // 设置纹理
            sprite.texture = `layer${layerNum}_door_closed`;
        }
        
        return door;
    }
    
    /**
     * 进入房间
     */
    enterRoom(roomId) {
        const prevRoomId = this.currentRoomId;
        this.currentRoomId = roomId;
        
        const room = this.rooms.get(roomId);
        if (!room) return;
        
        // 标记为已访问
        room.isVisited = true;
        this.revealedRooms.add(roomId);
        
        // Boss房特殊警告
        if (room.type === 'boss') {
            console.warn('⚠️ 警告：进入BOSS房！准备迎接最终挑战！');
            this.world.emit('bossRoomEntered', room);
        }
        
        // 如果房间未清理且是战斗房间，锁定门
        if (!room.isCleared && (room.type === 'combat' || room.type === 'normal')) {
            this.lockRoom(roomId);
            this.spawnRoomEnemies(room);
        }
        
        // 激活传送门（如果是已清理的房间）
        if (room.isCleared) {
            this.activatePortals(roomId);
        }
        
        console.log(`Entered room: ${roomId} (${room.type})`);
        this.world.emit('roomEntered', roomId, prevRoomId, room);
    }
    
    /**
     * 锁定房间
     */
    lockRoom(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return;
        
        room.isLocked = true;
        
        // 关闭所有门
        const doors = this.world.getEntitiesWithTag(`room_${roomId}`);
        for (const door of doors) {
            if (door.hasTag('door')) {
                const collider = door.get(ColliderComponent);
                if (collider) {
                    collider.isTrigger = false; // 激活碰撞（关闭）
                }
            }
        }
    }
    
    /**
     * 解锁房间
     */
    unlockRoom(roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return;
        
        room.isLocked = false;
        room.isCleared = true;
        
        // 打开所有门
        const doors = this.world.getEntitiesWithTag(`room_${roomId}`);
        for (const door of doors) {
            if (door.hasTag('door')) {
                // 可以销毁门或变成触发器
                door.destroy();
            }
        }
        
        // 激活传送门
        this.activatePortals(roomId);
        
        this.world.emit('roomCleared', roomId);
    }
    
    /**
     * 生成房间敌人 - 割草模式：大量怪物 + 高强度
     */
    spawnRoomEnemies(room) {
        if (!room.enemySpawns) return;
        
        const cellSize = this.currentMap.config.cellSize;
        let totalEnemies = 0;
        
        // 激进的难度倍率：每层指数级增长
        // 1层: 1x, 2层: 1.6x, 3层: 2.5x, 4层: 4x, 5层: 6x, 6层: 10x
        const difficultyMultiplier = Math.pow(1.6, this.currentFloor - 1);
        
        for (const spawn of room.enemySpawns) {
            for (let i = 0; i < spawn.spawnCount; i++) {
                const enemyType = spawn.enemyTypes[Math.floor(Math.random() * spawn.enemyTypes.length)];
                const offsetX = (Math.random() - 0.5) * 60; // 稍微分散一点避免完全重叠
                const offsetY = (Math.random() - 0.5) * 60;
                
                // 精英怪额外倍率
                const eliteMult = spawn.isElite ? 1.5 : 1.0;
                const finalMult = difficultyMultiplier * eliteMult;
                
                this.world.createEnemy(
                    room.x + spawn.x * cellSize + offsetX,
                    room.y + spawn.y * cellSize + offsetY,
                    enemyType,
                    {
                        health: { 
                            maxHealth: Math.floor((40 + room.gridX * 5) * finalMult),
                            currentHealth: Math.floor((40 + room.gridX * 5) * finalMult)
                        },
                        movement: { 
                            speed: Math.min(200, Math.floor((80 + (spawn.isElite ? 30 : 0)) * (1 + this.currentFloor * 0.05)))
                        },
                        combat: { 
                            attackDamage: Math.floor((12 + room.gridY * 2) * finalMult),
                            attackCooldown: Math.max(0.5, 1.2 - this.currentFloor * 0.1) // 后期攻击更快
                        },
                        enemy: { 
                            expValue: Math.floor(15 * difficultyMultiplier * (spawn.isElite ? 2 : 1)), 
                            dropChance: spawn.isElite ? 0.6 : Math.min(0.5, 0.2 + this.currentFloor * 0.05),
                            isElite: spawn.isElite || false
                        }
                    }
                );
                
                totalEnemies++;
            }
        }
        
        room.enemyCount = totalEnemies;
        console.log(`[割草模式] 第${this.currentFloor}层房间 ${room.id} 生成 ${totalEnemies} 只怪物 (难度倍率: ${difficultyMultiplier.toFixed(1)}x)`);
    }
    
    /**
     * 敌人死亡回调
     */
    onEnemyKilled(enemy) {
        if (!this.currentRoomId) return;
        
        const room = this.rooms.get(this.currentRoomId);
        if (!room || room.isCleared) return;
        
        // 减少敌人计数（防止负数）
        room.enemyCount = Math.max(0, room.enemyCount - 1);
        
        // 检查是否清理完成
        if (room.enemyCount <= 0) {
            this.unlockRoom(this.currentRoomId);
        }
    }
    
    /**
     * 激活传送门
     */
    activatePortals(roomId) {
        const room = this.rooms.get(roomId);
        if (!room || !room.connections) return;
        
        const cellSize = this.currentMap.config.cellSize;
        
        for (const connectedRoom of room.connections) {
            // 计算门位置
            const dx = connectedRoom.gridX - room.gridX;
            const dy = connectedRoom.gridY - room.gridY;
            
            let portalX = room.x + room.width * cellSize / 2;
            let portalY = room.y + room.height * cellSize / 2;
            
            if (dx === 1) portalX = room.x + (room.width - 1) * cellSize;
            if (dx === -1) portalX = room.x;
            if (dy === 1) portalY = room.y + (room.height - 1) * cellSize;
            if (dy === -1) portalY = room.y;
            
            // 创建传送门
            this.createPortal(portalX, portalY, connectedRoom.id);
        }
        
        room.portalsActive = true;
    }
    
    /**
     * 创建传送门
     */
    createPortal(x, y, targetRoomId) {
        return this.world.createEntity()
            .add(new TransformComponent(x, y))
            .add(new SpriteComponent({ width: 48, height: 48 }))
            .add(new ColliderComponent({
                radius: 24,
                layer: 'portal',
                isTrigger: true
            }))
            .addTag('portal')
            .addTag(`to_${targetRoomId}`);
    }
    
    /**
     * 检查玩家是否触发传送门
     */
    checkPortalTrigger(player) {
        const playerTransform = player.get(TransformComponent);
        if (!playerTransform) return;
        
        const portals = this.world.getEntitiesWithTag('portal');
        
        for (const portal of portals) {
            const portalTransform = portal.get(TransformComponent);
            if (!portalTransform) continue;
            
            const dx = playerTransform.x - portalTransform.x;
            const dy = playerTransform.y - portalTransform.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 30) {
                // 找到目标房间
                for (const tag of portal.tags) {
                    if (tag.startsWith('to_')) {
                        const targetRoomId = tag.substring(3);
                        this.teleportToRoom(player, targetRoomId);
                        return;
                    }
                }
            }
        }
    }
    
    /**
     * 传送到房间
     */
    teleportToRoom(player, roomId) {
        const room = this.rooms.get(roomId);
        if (!room) return;
        
        const cellSize = this.currentMap.config.cellSize;
        const playerTransform = player.get(TransformComponent);
        
        if (playerTransform) {
            // 传送到房间中心
            playerTransform.x = room.x + room.width * cellSize / 2;
            playerTransform.y = room.y + room.height * cellSize / 2;
        }
        
        this.enterRoom(roomId);
    }
    
    /**
     * 清除地图实体
     */
    clearMapEntities() {
        for (const entityIds of this.roomEntities.values()) {
            for (const entityId of entityIds) {
                const entity = this.world.getEntity(entityId);
                if (entity) {
                    entity.destroy();
                }
            }
        }
        this.roomEntities.clear();
        
        // 清除传送门
        const portals = this.world.getEntitiesWithTag('portal');
        for (const portal of portals) {
            portal.destroy();
        }
    }
    
    /**
     * 获取当前房间
     */
    getCurrentRoom() {
        return this.rooms.get(this.currentRoomId);
    }
    
    /**
     * 获取地图数据
     */
    getMapData() {
        return this.currentMap;
    }
    
    update(dt) {
        // 检查玩家是否触发传送门或楼梯
        const players = this.world.getEntitiesWithTag('player');
        for (const player of players) {
            this.checkPortalTrigger(player);
            this.checkStairsTrigger(player);
        }
    }
    
    /**
     * 获取当前楼层
     */
    getCurrentFloor() {
        return this.currentFloor;
    }
    
    destroy() {}
}

window.RoomSystem = RoomSystem;
