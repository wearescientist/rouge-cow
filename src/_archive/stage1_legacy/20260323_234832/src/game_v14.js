// 肉鸽牛牛 v14.0 - 成就系统
// 丰富的成就，奖励，长期目标

// ========== 成就定义 ==========
const ACHIEVEMENTS = {
    // 基础成就
    firstBlood: {
        id: 'firstBlood',
        name: '初尝胜利',
        desc: '首次击败敌人',
        icon: '🩸',
        condition: (stats) => stats.totalKills >= 1,
        reward: { milkCoins: 10 }
    },
    
    killer: {
        id: 'killer',
        name: '杀戮者',
        desc: '累计击败100个敌人',
        icon: '⚔️',
        condition: (stats) => stats.totalKills >= 100,
        reward: { milkCoins: 50 }
    },
    
    massacre: {
        id: 'massacre',
        name: '大屠杀',
        desc: '累计击败1000个敌人',
        icon: '💀',
        condition: (stats) => stats.totalKills >= 1000,
        reward: { milkCoins: 200, unlock: 'skin_blood' }
    },
    
    // 生存成就
    survivor: {
        id: 'survivor',
        name: '幸存者',
        desc: '单局存活超过5分钟',
        icon: '⏱️',
        condition: (stats, runStats) => runStats.time >= 300,
        reward: { milkCoins: 30 }
    },
    
    immortal: {
        id: 'immortal',
        name: '不朽传说',
        desc: '单局存活超过15分钟',
        icon: '👑',
        condition: (stats, runStats) => runStats.time >= 900,
        reward: { milkCoins: 100, unlock: 'skin_gold' }
    },
    
    // 等级成就
    levelUp: {
        id: 'levelUp',
        name: '成长之路',
        desc: '单局达到10级',
        icon: '📈',
        condition: (stats, runStats) => runStats.level >= 10,
        reward: { milkCoins: 40 }
    },
    
    godlike: {
        id: 'godlike',
        name: '如同神明',
        desc: '单局达到30级',
        icon: '✨',
        condition: (stats, runStats) => runStats.level >= 30,
        reward: { milkCoins: 150, unlock: 'aura_divine' }
    },
    
    // 战斗成就
    waveMaster: {
        id: 'waveMaster',
        name: '浪潮之主',
        desc: '达到第20波',
        icon: '🌊',
        condition: (stats, runStats) => runStats.wave >= 20,
        reward: { milkCoins: 80 }
    },
    
    bossSlayer: {
        id: 'bossSlayer',
        name: 'Boss克星',
        desc: '累计击败10个Boss',
        icon: '👹',
        condition: (stats) => stats.totalBossKills >= 10,
        reward: { milkCoins: 100, unlock: 'title_slayer' }
    },
    
    // 无伤成就
    flawless: {
        id: 'flawless',
        name: '完美无瑕',
        desc: '无伤击败一个Boss',
        icon: '💎',
        condition: (stats, runStats, flags) => flags.flawlessBoss,
        reward: { milkCoins: 100, unlock: 'skin_perfect' }
    },
    
    noHit: {
        id: 'noHit',
        name: '不可思议',
        desc: '单局前3分钟不受伤',
        icon: '🛡️',
        condition: (stats, runStats, flags) => flags.noHitStart >= 180,
        reward: { milkCoins: 60 }
    },
    
    // 武器成就
    weaponMaster: {
        id: 'weaponMaster',
        name: '武器大师',
        desc: '所有武器达到5级',
        icon: '🗡️',
        condition: (stats) => stats.allWeaponsLevel5,
        reward: { milkCoins: 200, unlock: 'skin_master' }
    },
    
    // 收集成就
    collector: {
        id: 'collector',
        name: '收藏家',
        desc: '收集所有类型的道具',
        icon: '🎒',
        condition: (stats) => stats.allItemsCollected,
        reward: { milkCoins: 150 }
    },
    
    // 特殊成就
    pacifist: {
        id: 'pacifist',
        name: '和平主义者',
        desc: '单局前2分钟不击杀任何敌人（存活）',
        icon: '🕊️',
        condition: (stats, runStats, flags) => flags.pacifistTime >= 120,
        reward: { milkCoins: 100, unlock: 'skin_pacifist' }
    },
    
    speedrunner: {
        id: 'speedrunner',
        name: '极速者',
        desc: '在3分钟内击败第一个Boss',
        icon: '⚡',
        condition: (stats, runStats, flags) => flags.firstBossTime <= 180,
        reward: { milkCoins: 80 }
    },
    
    rich: {
        id: 'rich',
        name: '土豪牛',
        desc: '累计拥有1000牛奶币',
        icon: '💰',
        condition: (stats) => stats.maxMilkCoins >= 1000,
        reward: { milkCoins: 0, unlock: 'skin_rich' } // 不给币，给皮肤
    },
    
    // 隐藏成就
    secretCow: {
        id: 'secretCow',
        name: '秘密发现',
        desc: '发现隐藏房间（？）',
        icon: '❓',
        condition: (stats, runStats, flags) => flags.foundSecret,
        reward: { milkCoins: 50 },
        hidden: true
    }
};

// ========== 成就管理器 ==========
class AchievementManager {
    constructor(saveSystem) {
        this.save = saveSystem;
        this.unlocked = new Set(this.save.data.achievements || []);
        this.recentUnlocks = []; // 最近解锁，用于显示
        this.notificationQueue = [];
        
        // 运行时标志
        this.runFlags = {
            flawlessBoss: false,
            noHitStart: 0,
            pacifistTime: 0,
            firstBossTime: null,
            foundSecret: false,
            killsThisRun: 0
        };
    }
    
    // 检查所有成就
    checkAchievements(runStats) {
        const stats = this.save.data.stats;
        
        for (let [id, achievement] of Object.entries(ACHIEVEMENTS)) {
            if (this.unlocked.has(id)) continue; // 已解锁
            
            if (achievement.condition(stats, runStats, this.runFlags)) {
                this.unlockAchievement(id);
            }
        }
    }
    
    unlockAchievement(id) {
        const achievement = ACHIEVEMENTS[id];
        if (!achievement || this.unlocked.has(id)) return;
        
        this.unlocked.add(id);
        this.save.data.achievements = Array.from(this.unlocked);
        
        // 发放奖励
        if (achievement.reward.milkCoins) {
            this.save.addMilkCoins(achievement.reward.milkCoins);
        }
        if (achievement.reward.unlock) {
            this.save.data.unlocked[achievement.reward.unlock] = true;
        }
        
        this.save.save();
        
        // 加入通知队列
        this.notificationQueue.push(achievement);
        
        console.log(`成就解锁: ${achievement.name}!`);
    }
    
    // 显示通知
    showNotifications(ctx) {
        if (this.notificationQueue.length === 0) return;
        
        // 显示队列中的第一个
        const achievement = this.notificationQueue[0];
        const alpha = 1; // 可以添加淡出动画
        
        ctx.save();
        ctx.globalAlpha = alpha;
        
        // 背景
        ctx.fillStyle = 'rgba(241, 196, 15, 0.9)';
        ctx.fillRect(CONFIG.width/2 - 200, 100, 400, 100);
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 3;
        ctx.strokeRect(CONFIG.width/2 - 200, 100, 400, 100);
        
        // 文字
        ctx.fillStyle = '#000';
        ctx.font = 'bold 20px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('🏆 成就解锁!', CONFIG.width/2, 130);
        
        ctx.font = 'bold 28px monospace';
        ctx.fillText(`${achievement.icon} ${achievement.name}`, CONFIG.width/2, 160);
        
        ctx.font = '16px monospace';
        ctx.fillStyle = '#333';
        ctx.fillText(achievement.desc, CONFIG.width/2, 185);
        
        ctx.restore();
        
        // 3秒后移除
        setTimeout(() => {
            this.notificationQueue.shift();
        }, 3000);
    }
    
    // 运行时事件记录
    onEnemyKilled() {
        this.runFlags.killsThisRun++;
        if (this.runFlags.noHitStart < 9999) {
            this.runFlags.noHitStart++; // 计时
        }
    }
    
    onPlayerHit() {
        this.runFlags.noHitStart = 0; // 重置无伤
        this.runFlags.pacifistTime = 0; // 重置和平主义
        this.runFlags.flawlessBoss = false;
    }
    
    onBossKilled(time, wasHit) {
        if (!wasHit) {
            this.runFlags.flawlessBoss = true;
        }
        if (this.runFlags.firstBossTime === null) {
            this.runFlags.firstBossTime = time;
        }
    }
    
    onSecretFound() {
        this.runFlags.foundSecret = true;
    }
    
    resetRunFlags() {
        this.runFlags = {
            flawlessBoss: false,
            noHitStart: 0,
            pacifistTime: 0,
            firstBossTime: null,
            foundSecret: false,
            killsThisRun: 0
        };
    }
    
    // 获取完成度
    getCompletionRate() {
        const total = Object.keys(ACHIEVEMENTS).length;
        const unlocked = this.unlocked.size;
        return { unlocked, total, percent: Math.floor((unlocked / total) * 100) };
    }
    
    // 获取成就列表（用于UI显示）
    getAchievementList() {
        return Object.values(ACHIEVEMENTS).map(a => ({
            ...a,
            unlocked: this.unlocked.has(a.id),
            isHidden: a.hidden && !this.unlocked.has(a.id)
        }));
    }
}

// ========== 称号系统 ==========
const TITLES = {
    newbie: { name: '新手奶牛', condition: () => true },
    slayer: { name: 'Boss克星', condition: (achievements) => achievements.includes('bossSlayer') },
    master: { name: '武器大师', condition: (achievements) => achievements.includes('weaponMaster') },
    pacifist: { name: '和平使者', condition: (achievements) => achievements.includes('pacifist') },
    rich: { name: '土豪牛', condition: (achievements) => achievements.includes('rich') },
    immortal: { name: '不朽传说', condition: (achievements) => achievements.includes('immortal') }
};

class TitleSystem {
    constructor(achievementManager) {
        this.achievements = achievementManager;
        this.equippedTitle = 'newbie';
    }
    
    getAvailableTitles() {
        return Object.entries(TITLES)
            .filter(([id, title]) => title.condition(this.achievements.unlocked))
            .map(([id, title]) => ({ id, name: title.name }));
    }
    
    equipTitle(titleId) {
        if (TITLES[titleId] && TITLES[titleId].condition(this.achievements.unlocked)) {
            this.equippedTitle = titleId;
            return true;
        }
        return false;
    }
    
    getCurrentTitle() {
        return TITLES[this.equippedTitle]?.name || '新手奶牛';
    }
}

// ========== 统计追踪 ==========
class StatsTracker {
    constructor() {
        this.currentRun = {
            kills: 0,
            bossesKilled: 0,
            itemsCollected: new Set(),
            weaponsUsed: new Set(),
            maxLevel: 1,
            maxWave: 1,
            time: 0,
            damageDealt: 0,
            damageTaken: 0,
            healingDone: 0
        };
    }
    
    recordKill(type) {
        this.currentRun.kills++;
        if (type === 'boss') this.currentRun.bossesKilled++;
    }
    
    recordItem(itemId) {
        this.currentRun.itemsCollected.add(itemId);
    }
    
    recordWeapon(weaponId) {
        this.currentRun.weaponsUsed.add(weaponId);
    }
    
    updateMaxLevel(level) {
        this.currentRun.maxLevel = Math.max(this.currentRun.maxLevel, level);
    }
    
    updateMaxWave(wave) {
        this.currentRun.maxWave = Math.max(this.currentRun.maxWave, wave);
    }
    
    getRunStats() {
        return {
            ...this.currentRun,
            itemsCollected: this.currentRun.itemsCollected.size,
            weaponsUsed: this.currentRun.weaponsUsed.size
        };
    }
    
    reset() {
        this.currentRun = {
            kills: 0,
            bossesKilled: 0,
            itemsCollected: new Set(),
            weaponsUsed: new Set(),
            maxLevel: 1,
            maxWave: 1,
            time: 0,
            damageDealt: 0,
            damageTaken: 0,
            healingDone: 0
        };
    }
}

console.log('Achievement system loaded');
console.log(`${Object.keys(ACHIEVEMENTS).length} achievements, title system, stats tracking`);
