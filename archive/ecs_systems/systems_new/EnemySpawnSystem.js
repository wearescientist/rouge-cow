/**
 * EnemySpawnSystem - 敌人生成系统
 * 管理波次、敌人生成、难度曲线
 */

class EnemySpawnSystem {
    constructor(world) {
        this.world = world;
        this.priority = 12;
        this.enabled = true;
        
        // 波次状态
        this.wave = 0;
        this.waveTimer = 0;
        this.timeBetweenWaves = 5; // 波次间隔
        this.isWaveActive = false;
        
        // 敌人生成
        this.spawnTimer = 0;
        this.spawnInterval = 2; // 生成间隔
        this.enemiesToSpawn = 0;
        this.enemiesKilled = 0;
        this.totalEnemiesInWave = 0;
        
        // 难度
        this.difficultyMultiplier = 1;
        
        // 敌人配置
        this.enemyTypes = [
            // T1 普通敌人
            { type: 'chick', weight: 50, minWave: 1 },
            { type: 'mouse', weight: 45, minWave: 1 },
            { type: 'pigeon', weight: 40, minWave: 1 },
            { type: 'snail', weight: 35, minWave: 1 },
            { type: 'slime', weight: 40, minWave: 1 },
            { type: 'goblin', weight: 30, minWave: 1 },
            { type: 'rabbit', weight: 30, minWave: 2 },
            { type: 'bird', weight: 25, minWave: 2 },
            { type: 'duck', weight: 25, minWave: 2 },
            { type: 'squirrel', weight: 20, minWave: 2 },
            { type: 'skeleton', weight: 20, minWave: 3 },
            { type: 'dog', weight: 20, minWave: 3 },
            { type: 'pig', weight: 15, minWave: 4 },
            { type: 'sheep', weight: 15, minWave: 4 },
            { type: 'snake', weight: 15, minWave: 4 },
            // T2 精英敌人
            { type: 'rabbit2', weight: 12, minWave: 5 },
            { type: 'orc', weight: 15, minWave: 5 },
            { type: 'bee', weight: 10, minWave: 5 },
            { type: 'panther', weight: 10, minWave: 6 },
            { type: 'crab', weight: 10, minWave: 6 },
            { type: 'bear', weight: 8, minWave: 7 },
            { type: 'dark_knight', weight: 10, minWave: 8 },
            { type: 'mage', weight: 8, minWave: 8 },
            { type: 'spider', weight: 8, minWave: 8 },
            // T3 小Boss
            { type: 'ghost', weight: 5, minWave: 10 },
            { type: 'turtle', weight: 4, minWave: 12 },
            { type: 'mimic', weight: 3, minWave: 12 },
            // Boss
            { type: 'boss_goblinKing', weight: 1, minWave: 15 },
            { type: 'boss_lich', weight: 1, minWave: 20 },
            { type: 'boss_wolfKing', weight: 1, minWave: 25 },
            { type: 'boss_dragon', weight: 1, minWave: 30 }
        ];
        
        // Boss 配置
        this.bossConfig = {
            hpMultiplier: 10,
            damageMultiplier: 2,
            expValue: 100,
            isBoss: true
        };
        
        // 生成区域
        this.spawnRadius = { min: 400, max: 600 };
        
        // 敌人数据缓存
        this.enemyData = this.initEnemyData();
    }
    
    /**
     * 初始化敌人数据
     */
    initEnemyData() {
        return {
            // T1 普通敌人
            chick: { name: '变异小鸡', health: 12, speed: 140, damage: 5, exp: 3, size: 20, color: '#ffeb3b' },
            mouse: { name: '感染老鼠', health: 10, speed: 160, damage: 4, exp: 3, size: 18, color: '#9e9e9e' },
            snail: { name: '寄生蜗牛', health: 25, speed: 50, damage: 6, exp: 2, size: 22, color: '#8bc34a' },
            pigeon: { name: '变异鸽子', health: 15, speed: 130, damage: 5, exp: 3, size: 22, color: '#e0e0e0' },
            slime: { name: '史莱姆', health: 30, speed: 60, damage: 8, exp: 10, size: 24, color: '#4caf50' },
            goblin: { name: '哥布林', health: 40, speed: 90, damage: 12, exp: 15, size: 26, color: '#66bb6a' },
            rabbit: { name: '可爱兔', health: 20, speed: 100, damage: 6, exp: 5, size: 24, color: '#ffcdd2' },
            bird: { name: '飞鸟', health: 18, speed: 150, damage: 5, exp: 4, size: 20, color: '#81d4fa' },
            duck: { name: '鸭子', health: 22, speed: 110, damage: 6, exp: 5, size: 24, color: '#fff59d' },
            squirrel: { name: '松鼠', health: 16, speed: 130, damage: 5, exp: 4, size: 20, color: '#d7ccc8' },
            skeleton: { name: '骷髅', health: 35, speed: 75, damage: 10, exp: 12, size: 28, color: '#e0e0e0' },
            dog: { name: '变异狗', health: 35, speed: 100, damage: 8, exp: 8, size: 28, color: '#a1887f' },
            pig: { name: '猪', health: 40, speed: 80, damage: 7, exp: 7, size: 30, color: '#f8bbd0' },
            sheep: { name: '羊', health: 30, speed: 90, damage: 6, exp: 6, size: 28, color: '#f5f5f5' },
            snake: { name: '毒蛇', health: 25, speed: 120, damage: 8, exp: 8, size: 24, color: '#66bb6a' },
            // T2 精英敌人
            rabbit2: { name: '暴走兔', health: 20, speed: 280, damage: 10, exp: 15, size: 26, color: '#4488ff', isElite: true },
            orc: { name: '兽人', health: 80, speed: 70, damage: 18, exp: 25, size: 34, color: '#8bc34a', isElite: true },
            bee: { name: '毒蜂', health: 12, speed: 300, damage: 6, exp: 10, size: 18, color: '#ffeb3b', isElite: true },
            panther: { name: '黑豹', health: 50, speed: 260, damage: 12, exp: 20, size: 30, color: '#212121', isElite: true },
            crab: { name: '铁甲蟹', health: 60, speed: 60, damage: 10, exp: 15, size: 32, color: '#ff7043', armor: 5, isElite: true },
            bear: { name: '棕熊', health: 100, speed: 85, damage: 15, exp: 30, size: 38, color: '#795548', isElite: true },
            dark_knight: { name: '黑暗骑士', health: 120, speed: 65, damage: 20, exp: 40, size: 36, color: '#424242', armor: 10, isElite: true },
            mage: { name: '黑暗法师', health: 45, speed: 55, damage: 25, exp: 25, size: 28, color: '#7c4dff', isElite: true },
            spider: { name: '巨型蜘蛛', health: 50, speed: 90, damage: 10, exp: 18, size: 26, color: '#8d6e63', isElite: true },
            // T3 小Boss
            ghost: { name: '幽灵', health: 80, speed: 90, damage: 15, exp: 35, size: 26, color: 'rgba(200,200,255,0.6)', canPhase: true, isMiniBoss: true },
            turtle: { name: '玄龟', health: 800, speed: 40, damage: 25, exp: 80, size: 56, color: '#ffaa00', armor: 20, isMiniBoss: true },
            mimic: { name: '宝箱怪', health: 500, speed: 70, damage: 30, exp: 60, size: 48, color: '#8d6e63', armor: 10, isMiniBoss: true },
            // Boss
            boss_goblinKing: { name: '哥布林王', health: 1500, speed: 60, damage: 35, exp: 200, size: 64, color: '#2e7d32', armor: 15, isBoss: true },
            boss_lich: { name: '巫妖', health: 2000, speed: 45, damage: 45, exp: 350, size: 56, color: '#4527a0', armor: 12, isBoss: true },
            boss_wolfKing: { name: '狼王', health: 2500, speed: 90, damage: 40, exp: 400, size: 60, color: '#1565c0', armor: 12, isBoss: true },
            boss_dragon: { name: '远古巨龙', health: 5000, speed: 55, damage: 70, exp: 800, size: 80, color: '#c62828', armor: 25, isBoss: true }
        };
    }
    
    init() {
        // 监听敌人死亡事件
        this.world.on('entityDestroyed', (entity) => {
            if (entity.hasTag('enemy') && this.isWaveActive) {
                this.onEnemyKilled();
            }
        });
    }
    
    update(dt) {
        if (!this.isWaveActive) {
            // 等待下一波
            this.waveTimer += dt;
            if (this.waveTimer >= this.timeBetweenWaves) {
                this.startWave();
            }
        } else {
            // 活跃的波次
            if (this.enemiesToSpawn > 0) {
                this.spawnTimer -= dt;
                if (this.spawnTimer <= 0) {
                    this.spawnEnemy();
                    this.spawnTimer = this.spawnInterval / this.difficultyMultiplier;
                }
            } else if (this.enemiesKilled >= this.totalEnemiesInWave) {
                // 波次完成
                this.endWave();
            }
        }
    }
    
    startWave() {
        this.wave++;
        this.isWaveActive = true;
        this.enemiesKilled = 0;
        this.waveTimer = 0;
        
        // 计算敌人数
        this.totalEnemiesInWave = Math.floor(5 + this.wave * 2 * this.difficultyMultiplier);
        this.enemiesToSpawn = this.totalEnemiesInWave;
        
        // 每5波是Boss波
        if (this.wave % 5 === 0) {
            this.spawnBoss();
        }
        
        // 增加难度
        this.difficultyMultiplier = 1 + (this.wave - 1) * 0.1;
        
        console.log(`Wave ${this.wave} started! Enemies: ${this.totalEnemiesInWave}`);
        this.world.emit('waveStart', this.wave, this.totalEnemiesInWave);
    }
    
    endWave() {
        this.isWaveActive = false;
        this.waveTimer = 0;
        
        console.log(`Wave ${this.wave} completed!`);
        this.world.emit('waveEnd', this.wave);
    }
    
    spawnEnemy() {
        // 获取玩家位置
        const players = this.world.getEntitiesWithTag('player');
        if (players.length === 0) return;
        
        const player = players[0];
        const playerTransform = player.get(TransformComponent);
        if (!playerTransform) return;
        
        // 计算生成位置（玩家周围环形区域）
        const angle = Math.random() * Math.PI * 2;
        const radius = this.spawnRadius.min + Math.random() * (this.spawnRadius.max - this.spawnRadius.min);
        const x = playerTransform.x + Math.cos(angle) * radius;
        const y = playerTransform.y + Math.sin(angle) * radius;
        
        // 选择敌人类型
        const enemyType = this.selectEnemyType();
        const data = this.enemyData[enemyType];
        
        if (!data) {
            console.warn(`Unknown enemy type: ${enemyType}`);
            return;
        }
        
        // 计算属性倍率
        const hpMultiplier = this.difficultyMultiplier;
        const damageMultiplier = this.difficultyMultiplier;
        const isBoss = data.isBoss || data.isMiniBoss;
        const finalHpMultiplier = isBoss ? hpMultiplier * 1.5 : hpMultiplier;
        
        // 创建敌人
        const enemy = this.world.createEnemy(x, y, enemyType, {
            health: {
                maxHealth: Math.floor(data.health * finalHpMultiplier),
                currentHealth: Math.floor(data.health * finalHpMultiplier),
                armor: data.armor || 0
            },
            movement: {
                speed: data.speed,
                baseSpeed: data.speed
            },
            combat: {
                attackDamage: Math.floor(data.damage * damageMultiplier),
                attackCooldown: 1.2
            },
            enemy: {
                level: this.wave,
                expValue: Math.floor(data.exp * this.difficultyMultiplier),
                dropTable: ['health_potion', 'gold'],
                dropChance: isBoss ? 1.0 : 0.3,
                isBoss: data.isBoss || false,
                isMiniBoss: data.isMiniBoss || false,
                isElite: data.isElite || false
            },
            ai: {
                behavior: data.canPhase ? 'phaser' : 'chase',
                aggroRange: 300,
                attackRange: 40
            }
        });
        
        // 设置视觉属性
        const sprite = enemy.get(SpriteComponent);
        if (sprite) {
            sprite.width = data.size;
            sprite.height = data.size;
            sprite.color = data.color;
            
            // 设置纹理（如果有对应的图片资源）
            const textureKey = this.getEnemyTextureKey(enemyType);
            if (textureKey) {
                sprite.texture = textureKey;
            }
        }
        
        const collider = enemy.get(ColliderComponent);
        if (collider) {
            collider.radius = data.size / 2;
        }
        
        this.enemiesToSpawn--;
    }
    
    /**
     * 获取敌人纹理键
     */
    getEnemyTextureKey(enemyType) {
        // 敌人类型到纹理键的映射
        const textureMap = {
            'chick': 'chick',
            'mouse': 'mouse',
            'snail': 'snail',
            'pigeon': 'pigeon',
            'slime': 'slime',
            'goblin': 'goblin',
            'rabbit': 'rabbit',
            'rabbit2': 'rabbit2',
            'bird': 'bird',
            'duck': 'duck',
            'duck2': 'duck2',
            'duck3': 'duck3',
            'squirrel': 'squirrel',
            'dog': 'dog',
            'dog2': 'dog2',
            'pig': 'pig',
            'pig2': 'pig2',
            'sheep': 'sheep',
            'snake': 'snake',
            'bear': 'bear',
            'crab': 'crab',
            'turtle': 'turtle',
            'cat': 'cat',
            'goose': 'goose',
            'boss6': 'boss6'
        };
        
        return textureMap[enemyType] || null;
    }
    
    spawnBoss() {
        const players = this.world.getEntitiesWithTag('player');
        if (players.length === 0) return;
        
        const player = players[0];
        const playerTransform = player.get(TransformComponent);
        
        // Boss 在更远的地方生成
        const angle = Math.random() * Math.PI * 2;
        const radius = 800;
        const x = playerTransform.x + Math.cos(angle) * radius;
        const y = playerTransform.y + Math.sin(angle) * radius;
        
        const enemy = this.world.createEnemy(x, y, 'boss', {
            health: {
                maxHealth: Math.floor(500 * this.difficultyMultiplier),
                currentHealth: Math.floor(500 * this.difficultyMultiplier)
            },
            movement: {
                speed: 60
            },
            combat: {
                attackDamage: Math.floor(30 * this.difficultyMultiplier),
                attackCooldown: 1
            },
            enemy: {
                level: this.wave,
                isBoss: true,
                expValue: this.bossConfig.expValue * this.difficultyMultiplier,
                dropTable: ['legendary_weapon', 'rare_item'],
                dropChance: 1.0
            }
        });
        
        // Boss 特殊标记
        const sprite = enemy.get(SpriteComponent);
        if (sprite) {
            sprite.width = 64;
            sprite.height = 64;
        }
        
        console.log('Boss spawned!');
        this.world.emit('bossSpawn', enemy);
    }
    
    selectEnemyType() {
        // 根据波次筛选可用的敌人类型
        const available = this.enemyTypes.filter(e => this.wave >= e.minWave);
        
        // 计算总权重
        const totalWeight = available.reduce((sum, e) => sum + e.weight, 0);
        
        // 随机选择
        let random = Math.random() * totalWeight;
        for (const enemy of available) {
            random -= enemy.weight;
            if (random <= 0) {
                return enemy.type;
            }
        }
        
        return available[0].type;
    }
    
    /**
     * 强制开始新波次（用于调试）
     */
    forceStartWave() {
        this.waveTimer = this.timeBetweenWaves;
    }
    
    /**
     * 获取当前波次信息
     */
    getWaveInfo() {
        return {
            wave: this.wave,
            isActive: this.isWaveActive,
            enemiesRemaining: this.enemiesToSpawn,
            enemiesKilled: this.enemiesKilled,
            totalEnemies: this.totalEnemiesInWave,
            progress: this.totalEnemiesInWave > 0 ? 
                (this.enemiesKilled / this.totalEnemiesInWave) : 0
        };
    }
    
    /**
     * 注册敌人死亡
     */
    onEnemyKilled() {
        this.enemiesKilled++;
    }
    
    destroy() {}
}

window.EnemySpawnSystem = EnemySpawnSystem;
