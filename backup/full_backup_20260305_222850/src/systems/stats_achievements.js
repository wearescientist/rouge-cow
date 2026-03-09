/**
 * 统计与成就系统 - v0.14.0
 * 第7轮迭代：统计与成就系统
 * 
 * 功能：
 * 1. 游戏数据统计
 * 2. 成就系统
 * 3. 排行榜
 * 4. 数据可视化
 */

// ==================== 统计系统 ====================
class StatisticsSystem {
    constructor() {
        this.data = this.load();
        this.sessionStats = this.createSessionStats();
    }
    
    createSessionStats() {
        return {
            startTime: Date.now(),
            kills: 0,
            damageDealt: 0,
            damageTaken: 0,
            goldEarned: 0,
            goldSpent: 0,
            itemsCollected: 0,
            roomsExplored: 0,
            floorsCleared: 0,
            deaths: 0,
            playTime: 0
        };
    }
    
    load() {
        try {
            const saved = localStorage.getItem('rougecow_statistics');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.warn('加载统计数据失败:', e);
        }
        
        return this.createDefaultStats();
    }
    
    createDefaultStats() {
        return {
            // 总体统计
            total: {
                gamesPlayed: 0,
                gamesWon: 0,
                totalPlayTime: 0, // 秒
                totalKills: 0,
                totalDamageDealt: 0,
                totalDamageTaken: 0,
                totalGoldEarned: 0,
                totalGoldSpent: 0,
                totalItemsCollected: 0,
                totalRoomsExplored: 0,
                highestFloor: 0,
                highestScore: 0,
                longestRun: 0 // 秒
            },
            
            // 按角色统计
            byCharacter: {},
            
            // 按武器统计
            byWeapon: {},
            
            // 按敌人统计
            byEnemy: {},
            
            // 历史记录（最近50局）
            history: [],
            
            // 每日统计
            daily: {},
            
            // 首次记录
            firstPlayed: Date.now(),
            lastPlayed: null
        };
    }
    
    save() {
        try {
            localStorage.setItem('rougecow_statistics', JSON.stringify(this.data));
        } catch (e) {
            console.warn('保存统计数据失败:', e);
        }
    }
    
    // 记录事件
    record(event, value = 1, metadata = {}) {
        switch(event) {
            case 'kill':
                this.sessionStats.kills += value;
                this.data.total.totalKills += value;
                this.recordEnemyKill(metadata.enemyType);
                break;
                
            case 'damage_dealt':
                this.sessionStats.damageDealt += value;
                this.data.total.totalDamageDealt += value;
                break;
                
            case 'damage_taken':
                this.sessionStats.damageTaken += value;
                this.data.total.totalDamageTaken += value;
                break;
                
            case 'gold_earned':
                this.sessionStats.goldEarned += value;
                this.data.total.totalGoldEarned += value;
                break;
                
            case 'gold_spent':
                this.sessionStats.goldSpent += value;
                this.data.total.totalGoldSpent += value;
                break;
                
            case 'item_collected':
                this.sessionStats.itemsCollected += value;
                this.data.total.totalItemsCollected += value;
                break;
                
            case 'room_explored':
                this.sessionStats.roomsExplored += value;
                this.data.total.totalRoomsExplored += value;
                break;
                
            case 'floor_cleared':
                this.sessionStats.floorsCleared += value;
                this.data.total.highestFloor = Math.max(
                    this.data.total.highestFloor,
                    metadata.floor || 0
                );
                break;
                
            case 'game_start':
                this.data.total.gamesPlayed++;
                break;
                
            case 'game_win':
                this.data.total.gamesWon++;
                this.endGame(true, metadata);
                break;
                
            case 'game_death':
                this.sessionStats.deaths++;
                this.endGame(false, metadata);
                break;
        }
        
        // 实时保存
        this.save();
    }
    
    recordEnemyKill(enemyType) {
        if (!enemyType) return;
        
        if (!this.data.byEnemy[enemyType]) {
            this.data.byEnemy[enemyType] = { kills: 0, firstKill: Date.now() };
        }
        
        this.data.byEnemy[enemyType].kills++;
    }
    
    recordWeaponUse(weaponKey, damage) {
        if (!this.data.byWeapon[weaponKey]) {
            this.data.byWeapon[weaponKey] = { uses: 0, damage: 0, kills: 0 };
        }
        
        this.data.byWeapon[weaponKey].uses++;
        this.data.byWeapon[weaponKey].damage += damage;
    }
    
    endGame(won, metadata = {}) {
        const sessionTime = (Date.now() - this.sessionStats.startTime) / 1000;
        this.sessionStats.playTime = sessionTime;
        this.data.total.totalPlayTime += sessionTime;
        
        // 记录最高分
        if (metadata.score > this.data.total.highestScore) {
            this.data.total.highestScore = metadata.score;
        }
        
        // 记录最长游戏
        if (sessionTime > this.data.total.longestRun) {
            this.data.total.longestRun = sessionTime;
        }
        
        // 添加到历史
        const record = {
            date: Date.now(),
            won,
            score: metadata.score || 0,
            floor: metadata.floor || 1,
            playTime: sessionTime,
            kills: this.sessionStats.kills,
            character: metadata.character
        };
        
        this.data.history.unshift(record);
        if (this.data.history.length > 50) {
            this.data.history.pop();
        }
        
        // 更新每日统计
        this.updateDailyStats(won, metadata.score || 0);
        
        // 重置会话统计
        this.sessionStats = this.createSessionStats();
        
        this.data.lastPlayed = Date.now();
        this.save();
    }
    
    updateDailyStats(won, score) {
        const today = new Date().toISOString().split('T')[0];
        
        if (!this.data.daily[today]) {
            this.data.daily[today] = { games: 0, wins: 0, totalScore: 0 };
        }
        
        this.data.daily[today].games++;
        if (won) this.data.daily[today].wins++;
        this.data.daily[today].totalScore += score;
    }
    
    // 获取统计摘要
    getSummary() {
        const t = this.data.total;
        const winRate = t.gamesPlayed > 0 ? (t.gamesWon / t.gamesPlayed * 100).toFixed(1) : 0;
        const avgScore = t.gamesPlayed > 0 ? (t.totalGoldEarned / t.gamesPlayed).toFixed(0) : 0;
        
        return {
            gamesPlayed: t.gamesPlayed,
            gamesWon: t.gamesWon,
            winRate: `${winRate}%`,
            totalPlayTime: this.formatTime(t.totalPlayTime),
            totalKills: t.totalKills,
            highestFloor: t.highestFloor,
            highestScore: t.highestScore,
            avgScore
        };
    }
    
    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        
        if (hours > 0) return `${hours}小时${mins}分`;
        return `${mins}分钟`;
    }
}

// ==================== 成就系统 ====================
class AchievementSystem {
    constructor(stats) {
        this.stats = stats;
        this.unlocked = this.loadUnlocked();
        this.progress = this.loadProgress();
    }
    
    getAchievements() {
        return [
            // 基础成就
            {
                id: 'first_blood',
                name: '首杀',
                desc: '击杀第一个敌人',
                icon: '🩸',
                condition: () => this.stats.data.total.totalKills >= 1
            },
            {
                id: 'hunter',
                name: '猎人',
                desc: '累计击杀100个敌人',
                icon: '🏹',
                condition: () => this.stats.data.total.totalKills >= 100
            },
            {
                id: 'slaughter',
                name: '屠杀者',
                desc: '累计击杀1000个敌人',
                icon: '⚔️',
                condition: () => this.stats.data.total.totalKills >= 1000
            },
            
            // 生存成就
            {
                id: 'survivor',
                name: '幸存者',
                desc: '存活超过5分钟',
                icon: '⏱️',
                condition: () => this.stats.data.total.longestRun >= 300
            },
            {
                id: 'marathon',
                name: '马拉松选手',
                desc: '存活超过15分钟',
                icon: '🏃',
                condition: () => this.stats.data.total.longestRun >= 900
            },
            
            // 探索成就
            {
                id: 'explorer',
                name: '探险家',
                desc: '探索10个房间',
                icon: '🗺️',
                condition: () => this.stats.data.total.totalRoomsExplored >= 10
            },
            {
                id: 'cartographer',
                name: '制图师',
                desc: '探索100个房间',
                icon: '🧭',
                condition: () => this.stats.data.total.totalRoomsExplored >= 100
            },
            
            // 财富成就
            {
                id: 'collector',
                name: '收藏家',
                desc: '累计获得1000金币',
                icon: '💰',
                condition: () => this.stats.data.total.totalGoldEarned >= 1000
            },
            {
                id: 'tycoon',
                name: '大亨',
                desc: '累计获得10000金币',
                icon: '💎',
                condition: () => this.stats.data.total.totalGoldEarned >= 10000
            },
            
            // 战斗成就
            {
                id: 'warrior',
                name: '战士',
                desc: '累计造成1000点伤害',
                icon: '🗡️',
                condition: () => this.stats.data.total.totalDamageDealt >= 1000
            },
            {
                id: 'destroyer',
                name: '毁灭者',
                desc: '累计造成10000点伤害',
                icon: '🔥',
                condition: () => this.stats.data.total.totalDamageDealt >= 10000
            },
            
            // 胜利成就
            {
                id: 'first_win',
                name: '初次胜利',
                desc: '通关一次',
                icon: '🏆',
                condition: () => this.stats.data.total.gamesWon >= 1
            },
            {
                id: 'veteran',
                name: '老兵',
                desc: '通关10次',
                icon: '🎖️',
                condition: () => this.stats.data.total.gamesWon >= 10
            },
            
            // 深度成就
            {
                id: 'deep_diver',
                name: '深潜者',
                desc: '到达第3层',
                icon: '⬇️',
                condition: () => this.stats.data.total.highestFloor >= 3
            },
            {
                id: 'abyss_walker',
                name: '深渊行者',
                desc: '到达第6层',
                icon: '🌑',
                condition: () => this.stats.data.total.highestFloor >= 6
            },
            
            // 特殊成就
            {
                id: 'untouchable',
                name: '无伤',
                desc: '无伤通关',
                icon: '🛡️',
                condition: () => false // 需要特殊检测
            },
            {
                id: 'speedrun',
                name: '速通者',
                desc: '5分钟内通关',
                icon: '⚡',
                condition: () => false // 需要特殊检测
            }
        ];
    }
    
    check() {
        const achievements = this.getAchievements();
        const newlyUnlocked = [];
        
        for (const achievement of achievements) {
            if (!this.unlocked.has(achievement.id) && achievement.condition()) {
                this.unlock(achievement);
                newlyUnlocked.push(achievement);
            }
        }
        
        return newlyUnlocked;
    }
    
    unlock(achievement) {
        this.unlocked.add(achievement.id);
        this.saveUnlocked();
        
        // 触发解锁事件
        this.onUnlock(achievement);
        
        console.log(`🏆 解锁成就: ${achievement.name}`);
    }
    
    onUnlock(achievement) {
        // 显示解锁通知
        if (window.game && window.game.ui) {
            window.game.ui.showAchievementUnlock(achievement);
        }
    }
    
    loadUnlocked() {
        try {
            const saved = localStorage.getItem('rougecow_achievements');
            if (saved) {
                return new Set(JSON.parse(saved));
            }
        } catch (e) {
            console.warn('加载成就失败:', e);
        }
        return new Set();
    }
    
    saveUnlocked() {
        try {
            localStorage.setItem('rougecow_achievements', JSON.stringify([...this.unlocked]));
        } catch (e) {
            console.warn('保存成就失败:', e);
        }
    }
    
    loadProgress() {
        try {
            const saved = localStorage.getItem('rougecow_achievement_progress');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.warn('加载成就进度失败:', e);
        }
        return {};
    }
    
    getProgress() {
        const achievements = this.getAchievements();
        const unlocked = this.unlocked.size;
        const total = achievements.length;
        
        return {
            unlocked,
            total,
            percentage: Math.floor(unlocked / total * 100),
            list: achievements.map(a => ({
                ...a,
                unlocked: this.unlocked.has(a.id)
            }))
        };
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StatisticsSystem, AchievementSystem };
}
