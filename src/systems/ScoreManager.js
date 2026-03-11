class ScoreManager {

    constructor() {

        this.score = 0;

        this.startTime = 0;

        this.endTime = 0;

        this.isPlaying = false;

        

        // 统计

        this.stats = {

            enemiesKilled: 0,

            elitesKilled: 0,

            bossesKilled: 0,

            roomsExplored: 0,

            itemsCollected: 0,

            goldCollected: 0,

            damageTaken: 0,

            floorsCleared: 0,

            goldSpent: 0,        // 金币花费统计

            roomsRevisited: 0    // 重复访问房间统计

        };

        

        // 连杀系统

        this.killStreak = 0;

        this.lastKillTime = 0;

        this.streakMultiplier = 1;

        

        // 防挂机/刷分检测

        this.lastPosition = { x: 0, y: 0 };

        this.lastPositionTime = 0;

        this.visitedRooms = new Set();  // 已访问的房间ID集合

        

        // 最低分保护已移除，允许负分用于AI学习

        this.MIN_SCORE = -1000;

    }

    

    start() {
        
        this.score = 0;

        this.startTime = Date.now();

        this.isPlaying = true;

        this.stats = {

            enemiesKilled: 0,

            elitesKilled: 0,

            bossesKilled: 0,

            roomsExplored: 0,

            itemsCollected: 0,

            goldCollected: 0,

            damageTaken: 0,

            floorsCleared: 0,

            goldSpent: 0,

            roomsRevisited: 0

        };

        this.killStreak = 0;

        this.streakMultiplier = 1;

        this.lastPosition = { x: 0, y: 0 };

        this.lastPositionTime = Date.now();

        this.visitedRooms.clear();

        // v0.17.2: 移除调试日志
        // console.log('🏆 分数系统启动！');

    }

    

    // 基础加分

    add(points, reason = '') {

        if (!this.isPlaying) return;

        const actual = Math.floor(points * this.streakMultiplier);

        this.score += actual;

        // v0.17.2: 移除调试日志
        // if (reason) console.log(`💯 +${actual}分 (${reason})`);

        return actual;

    }

    

    // 扣分

    deduct(points, reason = '') {

        if (!this.isPlaying) return;

        this.score -= points; // 允许负分，用于AI学习区分好坏

        // v0.17.2: 移除调试日志
        // if (reason) console.log(`💔 -${points}分 (${reason})`);

    }

    

    // 击杀敌人

    onKillEnemy(enemyType = 'normal') {

        this.stats.enemiesKilled++;

        

        // 连杀计算

        const now = Date.now();

        if (now - this.lastKillTime < 10000) { // 10秒内

            this.killStreak++;

            if (this.killStreak >= 3) {

                this.streakMultiplier = 1.5;

                // v0.17.2: 移除调试日志
                // console.log(`🔥 连杀x${this.killStreak}！分数加成50%`);

            }

        } else {

            this.killStreak = 1;

            this.streakMultiplier = 1;

        }

        this.lastKillTime = now;

        

        let points = 10;

        if (enemyType === 'elite') {

            points = 30;

            this.stats.elitesKilled++;

        } else if (enemyType === 'boss') {

            points = 500;

            this.stats.bossesKilled++;

        }

        

        this.add(points, `击杀${enemyType === 'normal' ? '普通怪' : enemyType === 'elite' ? '精英' : 'Boss'}`);

    }

    

    // 进入新房间

    onEnterRoom() {

        this.stats.roomsExplored++;

        this.add(50, '探索新房间');

    }

    

    // 拾取道具

    onCollectItem() {

        this.stats.itemsCollected++;

        this.add(50, '拾取道具');

    }

    

    // 拾取金币

    onCollectGold(amount) {

        this.stats.goldCollected += amount;

        this.add(amount, `拾取${amount}金币`);

    }

    

    // 受伤

    onDamage() {

        this.stats.damageTaken++;

        this.deduct(5, '受伤');  // 轻微惩罚，让AI有更多学习机会

    }

    

    // 到达下层

    onFloorClear(floorNum) {

        this.stats.floorsCleared++;

        this.add(300, `通关第${floorNum}层`);

    }

    

    // 进入新层（别名）

    onEnterFloor(floorNum) {

        this.onFloorClear(floorNum);

    }

    

    // 花费金币（鼓励AI购物）

    onSpendGold(amount) {

        this.stats.goldSpent += amount;

        // 花费金币加分（花费的50%作为奖励）

        const bonus = Math.floor(amount * 0.5);

        this.add(bonus, `消费${amount}金币奖励`);

    }

    

    // 检测原地停留（防挂机）

    checkStallPosition(playerX, playerY) {

        const now = Date.now();

        const dist = Math.sqrt((playerX - this.lastPosition.x) ** 2 + (playerY - this.lastPosition.y) ** 2);

        

        if (dist < 10) {

            // 位置基本没变，检测停留时间

            const stallTime = Math.floor((now - this.lastPositionTime) / 1000);

            if (stallTime > 0 && stallTime % 30 === 0) {

                // 每30秒扣一次分

                this.deduct(10, `原地停留${stallTime}秒`);

            }

        } else {

            // 位置变化，重置计时

            this.lastPosition = { x: playerX, y: playerY };

            this.lastPositionTime = now;

        }

    }

    

    // 检测重复访问房间（防刷分）

    checkRoomRevisit(roomId) {

        if (this.visitedRooms.has(roomId)) {

            // 重复访问扣分

            this.stats.roomsRevisited++;

            this.deduct(5, '重复访问房间');

            return true;

        } else {

            // 首次访问，记录

            this.visitedRooms.add(roomId);

            return false;

        }

    }

    

    // 游戏结束计算

    end(result) {

        this.isPlaying = false;

        this.endTime = Date.now();

        

        const playTime = (this.endTime - this.startTime) / 1000; // 秒

        let finalScore = this.score;

        let multiplier = 1;

        

        // 通关加成

        if (result === 'cleared') {

            multiplier = 1.5;

            

            // 无伤加成

            if (this.stats.damageTaken === 0) {

                multiplier = 2.0;

                // v0.17.2: 移除调试日志
                // console.log('🌟 无伤通关！分数×2');

            }

            

            // 快速通关

            if (playTime < 300) { // 5分钟

                multiplier *= 1.5;

                // v0.17.2: 移除调试日志
                // console.log('⚡ 极速通关！额外×1.5');

            }

        }

        

        // 死亡惩罚

        if (result === 'dead') {

            finalScore -= 500;

            // v0.17.2: 移除调试日志
            // console.log('💀 死亡惩罚 -500分');

        }

        

        finalScore = Math.floor(finalScore * multiplier);
        
        // 记录负分用于学习（但不低于-1000防止极端值）
        if (finalScore < -1000) finalScore = -1000;

        

        // 保存到本地排行榜

        this.saveHighScore(finalScore, result);

        

        return {

            finalScore,

            baseScore: this.score,

            multiplier,

            playTime,

            stats: {...this.stats},

            result

        };

    }

    

    // 保存最高分

    saveHighScore(score, result) {

        try {

            const key = 'rougecow_highscores';

            let scores = JSON.parse(localStorage.getItem(key) || '[]');

            scores.push({

                score,

                result,

                date: new Date().toISOString(),

                stats: {...this.stats}

            });

            scores.sort((a, b) => b.score - a.score);

            scores = scores.slice(0, 10); // 只保留前10

            localStorage.setItem(key, JSON.stringify(scores));

        } catch (e) {

            console.warn('保存排行榜失败:', e);

        }

    }

    

    // 获取排行榜

    getHighScores() {

        try {

            return JSON.parse(localStorage.getItem('rougecow_highscores') || '[]');

        } catch (e) {

            console.warn('读取排行榜失败:', e);

            return [];

        }

    }

    

    // 格式化显示

    formatScore() {

        return this.score.toLocaleString();

    }

}



// ============================================================================




// Export to global
window.ScoreManager = ScoreManager;
