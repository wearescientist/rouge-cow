class HordeManager {

    constructor(room) {

        this.room = room;

        this.wave = 0;

        this.timer = 0;

        this.spawnedThisWave = 0;

        this.targetCount = 0;

        this.enemies = [];

        this.spawnStats = {
            eliteTier3Spawned: 0
        };

        this.maxActiveEnemies = 80;

        

        // 根据房间类型设置刷怪策略

        this.setupRoomType();

        

        // 生成边缘刷怪点（避免在玩家脸上刷怪）

        this.spawnPoints = this.generateSpawnPoints();

        

        // 进房间立即开始第一波

        if (this.totalWaves > 0) {

            this.startNewWave();

        }

    }

    

    // 根据房间类型配置

    setupRoomType() {

        const type = this.room.type;

        this.bossRoom = false;
        this.eliteRoom = false;
        this.eliteOnly = false;

        

        // v0.20.0: 割草模式 - 根据楼层增加怪物数量
        const floor = window.game?.currentFloor || 1;
        const spawnMultiplier = Math.pow(floor, 0.8); // 1层=1x, 2层=1.7x, 3层=2.4x, 6层=4x

        switch(type) {

            case 'normal':

                this.waveCount = 3 + Math.floor(Math.random() * 3); // 3-5波

                this.baseEnemyCount = Math.floor(10 * spawnMultiplier); // 基础×楼层倍率

                this.bossRoom = false;

                break;

            case 'boss':

                this.waveCount = 1;

                this.baseEnemyCount = 0;

                this.bossRoom = true;

                break;

            case 'hidden':

                this.waveCount = 1;

                this.baseEnemyCount = 6; // 敌人数量翻倍

                this.bossRoom = false;

                this.eliteOnly = true;

                break;

            case 'elite':
                // 精英房：3波，前两波全T2，第三波15只T2+1只T3
                this.waveCount = 3;
                this.baseEnemyCount = 16; // 每波16只（翻倍）
                this.bossRoom = false;
                this.eliteRoom = true; // 标记为精英房
                break;

            default:

                this.waveCount = 0; // 起点/商店/宝箱不刷怪

                this.baseEnemyCount = 0;

        }

        

        this.totalWaves = this.waveCount;

    }

    

    // 生成边缘刷怪点（房间四边，距离墙一定距离）

    generateSpawnPoints() {

        const points = [];

        const w = this.room.width;

        const h = this.room.height;

        const margin = 120; // 距离墙的距离

        

        // 上下两边

        for (let x = margin; x < w - margin; x += 150) {

            points.push({x, y: margin});

            points.push({x, y: h - margin});

        }

        // 左右两边

        for (let y = margin; y < h - margin; y += 150) {

            points.push({x: margin, y});

            points.push({x: w - margin, y});

        }

        

        return points;

    }

    

    update(dt) {

        // 已完成所有波次
        if (this.wave >= this.totalWaves && this.enemies.filter(e => e.hp > 0).length === 0) {
            // v0.18.0 fix: 不在这里设置cleared，让Game.update()统一处理奖励逻辑
            // 只打开门，奖励由Game.update()发放
            this.openDoors();
            return;
        }

        

        // 当前波次敌人死完，立即开始下一波

        const activeCount = this.enemies.filter(e => e.hp > 0).length;

        if (activeCount === 0 && this.spawnedThisWave >= this.targetCount && this.wave < this.totalWaves) {

            this.startNewWave();

        }

        

        // 持续刷怪直到达到本波目标

        if (this.spawnedThisWave < this.targetCount && activeCount < this.maxActiveEnemies) {

            this.spawnBatch();

        }

        

        this.enemies = this.enemies.filter(e => e.hp > 0);

    }

    

    startNewWave() {

        this.wave++;

        this.timer = 0;

        

        // 难度公式：基础数量 × (1 + 波数 × 0.2)

        const difficultyMultiplier = 1 + (this.wave - 1) * 0.2;

        if (this.eliteRoom || this.eliteOnly) {
            this.targetCount = this.baseEnemyCount;
        } else {
            this.targetCount = Math.floor(this.baseEnemyCount * difficultyMultiplier);
        }

        this.spawnedThisWave = 0;

        

        // 播放波次开始音效（普通房间且非第一波）

        if (this.room.type === 'normal' && this.wave > 1 && window.game && window.game.audio) {

            window.game.audioCtrl.play('wave');

        }

        

        // v0.17.2: 移除调试日志（生产环境）

        // console.log(`🌊 第 ${this.wave}/${this.totalWaves} 波！目标：${this.targetCount} 只`);

    }

    

    spawnBatch() {

        const batchSize = Math.min(3, this.targetCount - this.spawnedThisWave);

        const activeCount = this.enemies.filter(e => e.hp > 0).length;

        if (activeCount >= this.maxActiveEnemies) return;

        

        for (let i = 0; i < batchSize; i++) {

            if (this.spawnedThisWave >= this.targetCount) break;

            

            const spawnPos = this.findSpawnPosition();
            if (!spawnPos) break;

            

            const enemy = this.createEnemy(spawnPos.x, spawnPos.y);

            this.enemies.push(enemy);

            this.spawnedThisWave++;

        }

    }

    findSpawnPosition() {
        const minGap = 56;
        const maxAttempts = 18;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const point = this.spawnPoints[Math.floor(Math.random() * this.spawnPoints.length)];
            const candidate = {
                x: point.x + (Math.random() - 0.5) * 60,
                y: point.y + (Math.random() - 0.5) * 60
            };

            if (!this.isSpawnPositionBlocked(candidate.x, candidate.y, minGap)) {
                return candidate;
            }
        }

        return null;
    }

    isSpawnPositionBlocked(x, y, minGap) {
        const minGapSq = minGap * minGap;
        const player = window.game?.player;

        if (player) {
            const dx = x - player.x;
            const dy = y - player.y;
            if ((dx * dx + dy * dy) < minGapSq * 2.25) {
                return true;
            }
        }

        for (const enemy of this.enemies) {
            if (!enemy || enemy.hp <= 0) continue;
            const dx = x - enemy.x;
            const dy = y - enemy.y;
            if ((dx * dx + dy * dy) < minGapSq) {
                return true;
            }
        }

        return false;
    }

    

    createEnemy(x, y) {

        // 根据波数选择敌人等级和类型
        const { typeKey, tier } = this.selectEnemyType();

        const enemy = createEnemy(x, y, typeKey, tier);

        

        // v0.20.0: 割草模式 - 只增加血量，不增加伤害（玩家太脆）
        const floor = window.game?.currentFloor || 1;
        // 楼层倍率: 1层=1x, 2层=2.8x, 3层=5.2x, 4层=8x, 5层=11.2x, 6层=15x
        const floorMultiplier = Math.pow(floor, 1.5);

        // 波数倍率 - 只影响血量
        const waveMultiplier = 1 + (this.wave - 1) * 0.2; // HP每波+20%

        // 总倍率 = 楼层倍率 × 波数倍率（仅血量）
        const totalHpMultiplier = floorMultiplier * waveMultiplier;

        enemy.hp = Math.floor(enemy.hp * totalHpMultiplier);
        enemy.maxHp = enemy.hp;
        // 伤害保持原版，不受楼层影响

        

        return enemy;

    }

    

    // v0.35 - 从FLOOR_DATA读取配置刷怪
    // 普通房间: T1 + T2混合 | 精英房: T2 + T3混合
    selectEnemyType() {
        const floor = window.game?.currentFloor || 1;
        const floorKey = 'floor' + floor;
        const buildTypeKey = monster => `${monster.id}_t${monster.tier || 1}_f${floor}`;
        
        // 从FLOOR_DATA读取当前楼层怪物池
        const floorData = window.FLOOR_DATA?.floors?.[floorKey];
        if (!floorData || !floorData.monsters) {
            console.warn(`[HordeManager] 未找到${floorKey}配置，使用默认`);
            return { typeKey: 'bat_v2_t1_f1', tier: 1 };
        }
        
        // 按tier分类怪物，返回带楼层后缀的key
        const t1Pool = floorData.monsters.filter(m => m.tier === 1);
        const t2Pool = floorData.monsters.filter(m => m.tier === 2);
        const t3Pool = floorData.monsters.filter(m => m.tier === 3);
        
        // Boss房
        if (this.bossRoom && this.wave === 1) {
            const bossPool = floorData.monsters.filter(m => m.tier >= 4);
            if (bossPool.length > 0) {
                const boss = randChoice(bossPool);
                return { typeKey: buildTypeKey(boss), tier: boss.tier, isBoss: true };
            }
        }
        
        // 精英房 - 前两波只出 T2，第三波仅最后 1 只为 T3
        if (this.eliteRoom) {
            const remainingSpawns = this.targetCount - this.spawnedThisWave;
            if (this.wave >= 3 && this.spawnStats.eliteTier3Spawned < 1 && remainingSpawns <= 1 && t3Pool.length > 0) {
                const t3 = randChoice(t3Pool);
                this.spawnStats.eliteTier3Spawned += 1;
                return { typeKey: buildTypeKey(t3), tier: 3, isElite: true };
            }
            if (t2Pool.length > 0) {
                const t2 = randChoice(t2Pool);
                return { typeKey: buildTypeKey(t2), tier: 2, isElite: true };
            }
            if (this.wave >= 3 && t3Pool.length > 0 && this.spawnStats.eliteTier3Spawned < 1) {
                const t3Fallback = randChoice(t3Pool);
                this.spawnStats.eliteTier3Spawned += 1;
                return { typeKey: buildTypeKey(t3Fallback), tier: 3, isElite: true };
            }
        }

        // 隐藏房等高阶模式：T2 优先，缺池时才回退到 T3
        if (this.eliteOnly) {
            if (t2Pool.length > 0) {
                const t2 = randChoice(t2Pool);
                return { typeKey: buildTypeKey(t2), tier: 2, isElite: true };
            }
            if (t3Pool.length > 0) {
                const t3 = randChoice(t3Pool);
                return { typeKey: buildTypeKey(t3), tier: 3, isElite: true };
            }
        }
        
        // 普通房间 - T1 + T2混合
        // T2替换率：基础30% + 层数x5%，最高60%
        const t2ReplaceRate = Math.min(0.30 + (floor - 1) * 0.05, 0.60);
        
        if (Math.random() < t2ReplaceRate && t2Pool.length > 0) {
            const t2 = randChoice(t2Pool);
            return { typeKey: buildTypeKey(t2), tier: 2, isElite: true };
        }
        
        // 出T1
        if (t1Pool.length > 0) {
            const t1 = randChoice(t1Pool);
            return { typeKey: buildTypeKey(t1), tier: 1 };
        }
        
        // 保底
        return { typeKey: 'bat_v2_t1_f1', tier: 1 };
    }
    

    openDoors() {

        Object.values(this.room.doors).forEach(door => {

            if (door) {

                door.open = true;

                door.locked = false;

            }

        });

        // v0.17.2: 移除调试日志
        // console.log('🚪 房间清理完成，门已开启');

    }

    

    getActiveEnemies() {

        return this.enemies.filter(e => e.hp > 0);

    }

}



// 地图生成器


// Export to global
window.HordeManager = HordeManager;
