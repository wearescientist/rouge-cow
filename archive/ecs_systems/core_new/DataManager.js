/**
 * DataManager - 数据管理器
 * 加载和管理游戏数据（武器、敌人、道具等）
 */

class DataManager {
    constructor() {
        // 数据缓存
        this.weapons = new Map();
        this.enemies = new Map();
        this.items = new Map();
        this.passives = new Map();
        
        // 加载状态
        this.loaded = false;
    }
    
    /**
     * 初始化并加载所有数据
     */
    async init() {
        try {
            await Promise.all([
                this.loadWeapons(),
                this.loadEnemies(),
                this.loadItems()
            ]);
            
            this.loaded = true;
            console.log('DataManager initialized');
            console.log(`- Weapons: ${this.weapons.size}`);
            console.log(`- Enemies: ${this.enemies.size}`);
            console.log(`- Items: ${this.items.size}`);
            console.log(`- Passives: ${this.passives.size}`);
            
            return true;
        } catch (e) {
            console.error('Failed to load game data:', e);
            // 使用内置数据作为后备
            this.loadBuiltInData();
            return false;
        }
    }
    
    /**
     * 加载武器数据
     */
    async loadWeapons() {
        try {
            const response = await fetch('src/data/weapons.json');
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            
            for (const [key, weapon] of Object.entries(data.weapons)) {
                this.weapons.set(key, weapon);
            }
        } catch (e) {
            // 静默处理 CORS/网络错误，使用内置数据
            this.loadBuiltInWeapons();
        }
    }
    
    /**
     * 加载敌人数据
     */
    async loadEnemies() {
        try {
            const response = await fetch('src/data/enemies.json');
            if (!response.ok) throw new Error('Network response was not ok');
            const data = await response.json();
            
            for (const [key, enemy] of Object.entries(data.enemies)) {
                this.enemies.set(key, enemy);
            }
        } catch (e) {
            // 静默处理 CORS/网络错误，使用内置数据
            this.loadBuiltInEnemies();
        }
    }
    
    /**
     * 加载道具数据
     */
    async loadItems() {
        try {
            const response = await fetch('src/data/items.json');
            const data = await response.json();
            
            // 加载消耗品
            for (const [key, item] of Object.entries(data.items.consumables)) {
                item.category = 'consumable';
                this.items.set(key, item);
            }
            
            // 加载资源
            for (const [key, item] of Object.entries(data.items.resources)) {
                item.category = 'resource';
                this.items.set(key, item);
            }
            
            // 加载永久道具
            for (const [key, item] of Object.entries(data.items.permanent)) {
                item.category = 'permanent';
                this.items.set(key, item);
            }
            
            // 加载特殊道具
            for (const [key, item] of Object.entries(data.items.special)) {
                item.category = 'special';
                this.items.set(key, item);
            }
            
            // 加载被动道具
            for (const [key, passive] of Object.entries(data.items.passives)) {
                this.passives.set(key, passive);
            }
        } catch (e) {
            // 静默处理 CORS/网络错误，使用内置数据
            this.loadBuiltInItems();
        }
    }
    
    /**
     * 获取武器数据
     */
    getWeapon(id) {
        return this.weapons.get(id);
    }
    
    /**
     * 获取敌人数据
     */
    getEnemy(id) {
        return this.enemies.get(id);
    }
    
    /**
     * 获取道具数据
     */
    getItem(id) {
        return this.items.get(id);
    }
    
    /**
     * 获取被动道具数据
     */
    getPassive(id) {
        return this.passives.get(id);
    }
    
    /**
     * 获取所有武器
     */
    getAllWeapons() {
        return Array.from(this.weapons.values());
    }
    
    /**
     * 获取所有敌人
     */
    getAllEnemies() {
        return Array.from(this.enemies.values());
    }
    
    /**
     * 按类型获取敌人
     */
    getEnemiesByType(type) {
        return this.getAllEnemies().filter(e => e.type === type);
    }
    
    /**
     * 获取所有被动道具
     */
    getAllPassives() {
        return Array.from(this.passives.values());
    }
    
    /**
     * 随机获取敌人（按波次难度）
     */
    getRandomEnemyForWave(wave) {
        const available = this.getAllEnemies().filter(e => {
            if (e.type === 'boss') return false;
            // 根据波次解锁敌人类型
            const unlockWave = e.unlockWave || 1;
            return wave >= unlockWave;
        });
        
        if (available.length === 0) return null;
        
        return available[Math.floor(Math.random() * available.length)];
    }
    
    /**
     * 获取Boss数据
     */
    getBoss(bossId) {
        return this.getAllEnemies().find(e => e.isBoss && e.id === bossId);
    }
    
    /**
     * 获取适合当前波次的Boss
     */
    getBossForWave(wave) {
        const bosses = this.getAllEnemies().filter(e => {
            return e.isBoss && e.unlockWave && wave >= e.unlockWave;
        });
        
        if (bosses.length === 0) return null;
        
        // 返回适合当前波次的Boss
        return bosses[Math.min(Math.floor(wave / 10), bosses.length - 1)];
    }
    
    // ==================== 内置数据（后备）====================
    
    loadBuiltInData() {
        this.loadBuiltInWeapons();
        this.loadBuiltInEnemies();
        this.loadBuiltInItems();
        this.loaded = true;
    }
    
    loadBuiltInWeapons() {
        const builtInWeapons = [
            { id: 'sword', name: '铁剑', type: 'melee', damage: 15, cooldown: 0.5, range: 60 },
            { id: 'bow', name: '木弓', type: 'ranged', damage: 10, cooldown: 0.8, range: 300, projectileSpeed: 400 },
            { id: 'spear', name: '长矛', type: 'melee', damage: 20, cooldown: 0.7, range: 90, pierce: 2 },
            { id: 'wand', name: '法杖', type: 'ranged', damage: 15, cooldown: 0.6, range: 250, homing: true }
        ];
        
        for (const weapon of builtInWeapons) {
            this.weapons.set(weapon.id, weapon);
        }
    }
    
    loadBuiltInEnemies() {
        const builtInEnemies = [
            { id: 'slime', name: '史莱姆', type: 'normal', health: 30, speed: 60, damage: 8, expValue: 10 },
            { id: 'goblin', name: '哥布林', type: 'normal', health: 45, speed: 90, damage: 12, expValue: 15 },
            { id: 'skeleton', name: '骷髅', type: 'normal', health: 60, speed: 75, damage: 15, expValue: 20 },
            { id: 'orc', name: '兽人', type: 'elite', health: 120, speed: 70, damage: 20, expValue: 35, isElite: true }
        ];
        
        for (const enemy of builtInEnemies) {
            this.enemies.set(enemy.id, enemy);
        }
    }
    
    loadBuiltInItems() {
        const builtInItems = [
            { id: 'health_potion', name: '生命药水', type: 'consumable', effect: { type: 'heal', value: 30 } },
            { id: 'gold', name: '金币', type: 'resource', autoPickup: true }
        ];
        
        for (const item of builtInItems) {
            this.items.set(item.id, item);
        }
        
        const builtInPassives = [
            { id: 'power_glove', name: '力量手套', description: '攻击力+10%', maxLevel: 5 },
            { id: 'swift_boots', name: '迅捷之靴', description: '移动速度+10%', maxLevel: 5 }
        ];
        
        for (const passive of builtInPassives) {
            this.passives.set(passive.id, passive);
        }
    }
}

// 导出单例
window.DataManager = DataManager;
