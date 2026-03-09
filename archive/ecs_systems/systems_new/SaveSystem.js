/**
 * SaveSystem - 存档系统
 * 管理游戏存档、加载、自动保存
 */

class SaveSystem {
    constructor(world) {
        this.world = world;
        this.priority = 0;
        this.enabled = true;
        
        // 存档键名
        this.saveKey = 'rougecow_save';
        this.settingsKey = 'rougecow_settings';
        this.statsKey = 'rougecow_stats';
        
        // 自动保存配置
        this.autoSaveInterval = 300; // 5分钟
        this.autoSaveTimer = 0;
        this.lastSaveTime = 0;
        
        // 当前存档数据
        this.currentSave = null;
        
        // 最大存档槽位数
        this.maxSaveSlots = 3;
    }
    
    init() {
        // 监听需要存档的事件
        this.setupEventListeners();
        
        console.log('SaveSystem initialized');
    }
    
    setupEventListeners() {
        // 监听重要事件触发自动保存
        this.world.on('roomCleared', () => {
            this.requestAutoSave();
        });
        
        this.world.on('levelUp', () => {
            this.requestAutoSave();
        });
        
        this.world.on('itemPickedUp', () => {
            this.requestAutoSave();
        });
        
        this.world.on('gamePaused', () => {
            this.saveGame();
        });
    }
    
    update(dt) {
        // 自动保存计时
        this.autoSaveTimer += dt;
        if (this.autoSaveTimer >= this.autoSaveInterval) {
            this.autoSaveTimer = 0;
            this.saveGame();
        }
    }
    
    /**
     * 请求自动保存（延迟执行，避免频繁保存）
     */
    requestAutoSave() {
        // 重置计时器，让自然保存周期处理
        this.autoSaveTimer = Math.max(0, this.autoSaveTimer - 60);
    }
    
    /**
     * 保存游戏
     */
    saveGame(slot = 0) {
        try {
            const saveData = this.gatherSaveData();
            
            // 添加元数据
            saveData.meta = {
                version: '0.23.0',
                saveTime: Date.now(),
                playTime: this.getPlayTime(),
                slot: slot
            };
            
            // 保存到 localStorage
            const key = slot === 0 ? this.saveKey : `${this.saveKey}_${slot}`;
            localStorage.setItem(key, JSON.stringify(saveData));
            
            this.currentSave = saveData;
            this.lastSaveTime = Date.now();
            
            console.log(`Game saved to slot ${slot}`);
            this.world.emit('gameSaved', saveData);
            
            return true;
        } catch (e) {
            console.error('Failed to save game:', e);
            return false;
        }
    }
    
    /**
     * 加载游戏
     */
    loadGame(slot = 0) {
        try {
            const key = slot === 0 ? this.saveKey : `${this.saveKey}_${slot}`;
            const saveString = localStorage.getItem(key);
            
            if (!saveString) {
                console.log(`No save found in slot ${slot}`);
                return null;
            }
            
            const saveData = JSON.parse(saveString);
            
            // 验证版本
            if (saveData.meta && saveData.meta.version) {
                if (!this.isVersionCompatible(saveData.meta.version)) {
                    console.warn('Save version incompatible');
                    return null;
                }
            }
            
            this.currentSave = saveData;
            this.applySaveData(saveData);
            
            console.log(`Game loaded from slot ${slot}`);
            this.world.emit('gameLoaded', saveData);
            
            return saveData;
        } catch (e) {
            console.error('Failed to load game:', e);
            return null;
        }
    }
    
    /**
     * 收集存档数据
     */
    gatherSaveData() {
        const saveData = {
            player: null,
            world: null,
            progress: null
        };
        
        // 保存玩家数据
        const players = this.world.getEntitiesWithTag('player');
        if (players.length > 0) {
            const player = players[0];
            saveData.player = this.serializePlayer(player);
        }
        
        // 保存世界状态
        saveData.world = this.serializeWorld();
        
        // 保存进度
        const roomSystem = this.world.getSystem(RoomSystem);
        const spawnSystem = this.world.getSystem(EnemySpawnSystem);
        
        saveData.progress = {
            currentRoom: roomSystem ? roomSystem.currentRoomId : null,
            wave: spawnSystem ? spawnSystem.wave : 0,
            floor: 1 // TODO: 实现楼层系统
        };
        
        return saveData;
    }
    
    /**
     * 序列化玩家数据
     */
    serializePlayer(player) {
        const data = {
            components: {}
        };
        
        // 保存各个组件
        const transform = player.get(TransformComponent);
        if (transform) {
            data.components.transform = {
                x: transform.x,
                y: transform.y
            };
        }
        
        const health = player.get(HealthComponent);
        if (health) {
            data.components.health = {
                currentHealth: health.currentHealth,
                maxHealth: health.maxHealth
            };
        }
        
        const playerComp = player.get(PlayerComponent);
        if (playerComp) {
            data.components.player = {
                level: playerComp.level,
                experience: playerComp.experience,
                nextLevelExp: playerComp.nextLevelExp,
                skillPoints: playerComp.skillPoints,
                strength: playerComp.strength,
                agility: playerComp.agility,
                vitality: playerComp.vitality,
                kills: playerComp.kills,
                itemsCollected: playerComp.itemsCollected,
                weaponSlots: playerComp.weaponSlots,
                activeWeaponSlot: playerComp.activeWeaponSlot,
                passives: playerComp.passives
            };
        }
        
        const inventory = player.get(InventoryComponent);
        if (inventory) {
            data.components.inventory = {
                items: inventory.items.filter(i => i !== null),
                gold: inventory.gold
            };
        }
        
        return data;
    }
    
    /**
     * 序列化世界状态
     */
    serializeWorld() {
        const data = {
            rooms: {},
            entities: []
        };
        
        // 保存房间状态
        const roomSystem = this.world.getSystem(RoomSystem);
        if (roomSystem) {
            for (const [roomId, roomState] of roomSystem.rooms) {
                data.rooms[roomId] = {
                    isCleared: roomState.isCleared,
                    isVisited: roomState.isVisited
                };
            }
        }
        
        return data;
    }
    
    /**
     * 应用存档数据
     */
    applySaveData(saveData) {
        // 恢复玩家数据
        if (saveData.player) {
            const players = this.world.getEntitiesWithTag('player');
            if (players.length > 0) {
                this.deserializePlayer(players[0], saveData.player);
            }
        }
        
        // 恢复世界状态
        if (saveData.world) {
            this.deserializeWorld(saveData.world);
        }
    }
    
    /**
     * 反序列化玩家数据
     */
    deserializePlayer(player, data) {
        if (data.components.transform) {
            const transform = player.get(TransformComponent);
            if (transform) {
                transform.x = data.components.transform.x;
                transform.y = data.components.transform.y;
            }
        }
        
        if (data.components.health) {
            const health = player.get(HealthComponent);
            if (health) {
                health.currentHealth = data.components.health.currentHealth;
                health.maxHealth = data.components.health.maxHealth;
            }
        }
        
        if (data.components.player) {
            const playerComp = player.get(PlayerComponent);
            if (playerComp) {
                Object.assign(playerComp, data.components.player);
            }
        }
        
        if (data.components.inventory) {
            const inventory = player.get(InventoryComponent);
            if (inventory) {
                inventory.gold = data.components.inventory.gold;
                // TODO: 恢复物品
            }
        }
    }
    
    /**
     * 反序列化世界状态
     */
    deserializeWorld(data) {
        const roomSystem = this.world.getSystem(RoomSystem);
        if (roomSystem && data.rooms) {
            for (const [roomId, roomState] of Object.entries(data.rooms)) {
                const room = roomSystem.rooms.get(roomId);
                if (room) {
                    room.isCleared = roomState.isCleared;
                    room.isVisited = roomState.isVisited;
                }
            }
        }
    }
    
    /**
     * 检查存档是否存在
     */
    hasSave(slot = 0) {
        const key = slot === 0 ? this.saveKey : `${this.saveKey}_${slot}`;
        return localStorage.getItem(key) !== null;
    }
    
    /**
     * 获取存档信息
     */
    getSaveInfo(slot = 0) {
        const key = slot === 0 ? this.saveKey : `${this.saveKey}_${slot}`;
        const saveString = localStorage.getItem(key);
        
        if (!saveString) return null;
        
        try {
            const saveData = JSON.parse(saveString);
            return saveData.meta || null;
        } catch (e) {
            return null;
        }
    }
    
    /**
     * 删除存档
     */
    deleteSave(slot = 0) {
        try {
            const key = slot === 0 ? this.saveKey : `${this.saveKey}_${slot}`;
            localStorage.removeItem(key);
            console.log(`Save slot ${slot} deleted`);
            return true;
        } catch (e) {
            console.error('Failed to delete save:', e);
            return false;
        }
    }
    
    /**
     * 获取所有存档信息
     */
    getAllSaveInfo() {
        const saves = [];
        for (let i = 0; i < this.maxSaveSlots; i++) {
            saves.push(this.getSaveInfo(i));
        }
        return saves;
    }
    
    /**
     * 版本兼容性检查
     */
    isVersionCompatible(saveVersion) {
        // 简单的版本检查，可以根据需要扩展
        const currentVersion = '0.23.0';
        const saveParts = saveVersion.split('.').map(Number);
        const currentParts = currentVersion.split('.').map(Number);
        
        // 主版本号必须相同
        return saveParts[0] === currentParts[0];
    }
    
    /**
     * 获取游戏时间
     */
    getPlayTime() {
        // TODO: 实现游戏时间统计
        return 0;
    }
    
    /**
     * 导出存档（用于分享）
     */
    exportSave(slot = 0) {
        const saveData = this.loadGame(slot);
        if (!saveData) return null;
        
        return btoa(JSON.stringify(saveData)); // Base64 编码
    }
    
    /**
     * 导入存档
     */
    importSave(saveString, slot = 0) {
        try {
            const saveData = JSON.parse(atob(saveString));
            
            const key = slot === 0 ? this.saveKey : `${this.saveKey}_${slot}`;
            localStorage.setItem(key, JSON.stringify(saveData));
            
            console.log(`Save imported to slot ${slot}`);
            return true;
        } catch (e) {
            console.error('Failed to import save:', e);
            return false;
        }
    }
    
    destroy() {}
}

window.SaveSystem = SaveSystem;
