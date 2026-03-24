// 肉鸽牛牛 v16.0 - 排行榜系统
// 本地分数存储，排名，每日挑战

// ========== 排行榜管理器 ==========
class LeaderboardManager {
    constructor() {
        this.scoresKey = 'rougelike_cow_scores';
        this.playerNameKey = 'rougelike_cow_playername';
        this.scores = this.loadScores();
        this.playerName = localStorage.getItem(this.playerNameKey) || '无名奶牛';
    }
    
    loadScores() {
        try {
            const saved = localStorage.getItem(this.scoresKey);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch(e) {}
        return {
            daily: [],
            weekly: [],
            alltime: [],
            personal: []
        };
    }
    
    saveScores() {
        try {
            localStorage.setItem(this.scoresKey, JSON.stringify(this.scores));
        } catch(e) {
            console.log('Failed to save scores');
        }
    }
    
    setPlayerName(name) {
        this.playerName = name.substring(0, 12); // 限制长度
        localStorage.setItem(this.playerNameKey, this.playerName);
    }
    
    // 提交分数
    submitScore(runStats) {
        const scoreEntry = {
            name: this.playerName,
            score: this.calculateScore(runStats),
            time: runStats.time,
            wave: runStats.wave,
            level: runStats.level,
            kills: runStats.kills,
            date: Date.now(),
            dateStr: new Date().toLocaleDateString()
        };
        
        // 添加到各榜单
        this.addToLeaderboard('alltime', scoreEntry);
        this.addToLeaderboard('personal', scoreEntry);
        
        // 检查是否是每日/每周记录
        if (this.isDailyRecord(scoreEntry)) {
            this.addToLeaderboard('daily', scoreEntry);
        }
        
        this.saveScores();
        return this.getRank(scoreEntry.score);
    }
    
    calculateScore(stats) {
        // 分数计算公式
        let score = 0;
        score += stats.kills * 10;           // 击杀分
        score += stats.wave * 100;           // 波数分
        score += stats.level * 50;           // 等级分
        score += Math.floor(stats.time) * 2; // 生存时间分
        
        //  bonus
        if (stats.flawless) score *= 1.5;    // 无伤 bonus
        if (stats.noHitStart >= 180) score += 500;
        
        return Math.floor(score);
    }
    
    addToLeaderboard(type, entry) {
        this.scores[type].push(entry);
        // 排序并保留前100
        this.scores[type].sort((a, b) => b.score - a.score);
        this.scores[type] = this.scores[type].slice(0, 100);
    }
    
    isDailyRecord(entry) {
        const today = new Date().toDateString();
        const dailyBest = this.scores.daily[0];
        if (!dailyBest) return true;
        return entry.score > dailyBest.score * 0.8; // 前80%算每日记录
    }
    
    getRank(score) {
        const allScores = this.scores.alltime;
        for (let i = 0; i < allScores.length; i++) {
            if (allScores[i].score < score) {
                return i + 1;
            }
        }
        return allScores.length + 1;
    }
    
    // 获取前N名
    getTopN(type, n = 10) {
        return this.scores[type].slice(0, n);
    }
    
    // 获取个人最佳
    getPersonalBest() {
        if (this.scores.personal.length === 0) return null;
        return this.scores.personal[0];
    }
    
    // 获取附近排名（用于显示"你在第X名"）
    getNearbyRankings(score, range = 2) {
        const all = this.scores.alltime;
        const rank = this.getRank(score);
        const start = Math.max(0, rank - 1 - range);
        const end = Math.min(all.length, rank + range);
        return all.slice(start, end).map((entry, idx) => ({
            ...entry,
            rank: start + idx + 1,
            isPlayer: entry.name === this.playerName && entry.score === score
        }));
    }
    
    // 清空旧数据
    cleanup() {
        const oneWeek = 7 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        
        // 只保留最近一周的每日记录
        this.scores.daily = this.scores.daily.filter(s => now - s.date < oneWeek);
        
        this.saveScores();
    }
}

// ========== 每日挑战 ==========
class DailyChallenge {
    constructor() {
        this.challengeKey = 'rougelike_cow_daily';
        this.currentChallenge = this.generateDailyChallenge();
        this.attempts = 0;
        this.bestScore = 0;
    }
    
    generateDailyChallenge() {
        // 基于日期生成固定种子
        const today = new Date().toDateString();
        const seed = this.stringToSeed(today);
        
        const modifiers = [
            { name: '双倍敌人', effect: 'enemies_x2' },
            { name: '极速模式', effect: 'speed_x1.5' },
            { name: '玻璃大炮', effect: 'damage_x2_hp_half' },
            { name: '无限火力', effect: 'no_cooldown' },
            { name: '经济萧条', effect: 'no_drops' },
            { name: '冰天雪地', effect: 'ice_biome' }
        ];
        
        // 随机选择2个修饰符
        const selected = [];
        for (let i = 0; i < 2; i++) {
            const idx = Math.floor(this.seededRandom(seed + i) * modifiers.length);
            selected.push(modifiers[idx]);
        }
        
        return {
            date: today,
            modifiers: selected,
            reward: 100 // 完成奖励
        };
    }
    
    stringToSeed(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }
    
    seededRandom(seed) {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    }
    
    applyModifiers(game) {
        for (let mod of this.currentChallenge.modifiers) {
            switch(mod.effect) {
                case 'enemies_x2':
                    game.spawnRateMultiplier = 0.5;
                    break;
                case 'speed_x1.5':
                    game.player.speed *= 1.5;
                    game.enemies.forEach(e => e.speed *= 1.5);
                    break;
                case 'damage_x2_hp_half':
                    game.player.damage *= 2;
                    game.player.maxHp = Math.max(1, Math.floor(game.player.maxHp / 2));
                    game.player.hp = Math.min(game.player.hp, game.player.maxHp);
                    break;
                case 'no_cooldown':
                    game.player.attackSpeed = 1;
                    break;
            }
        }
    }
    
    submitAttempt(score) {
        this.attempts++;
        if (score > this.bestScore) {
            this.bestScore = score;
        }
    }
}

// ========== 排行榜UI ==========
class LeaderboardUI {
    constructor(leaderboard) {
        this.lb = leaderboard;
        this.currentTab = 'alltime';
        this.tabs = ['daily', 'weekly', 'alltime', 'personal'];
    }
    
    render(ctx) {
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(50, 50, GAME_WIDTH - 100, GAME_HEIGHT - 100);
        
        // 标题
        ctx.fillStyle = '#F1C40F';
        ctx.font = 'bold 32px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('🏆 排行榜', GAME_WIDTH / 2, 100);
        
        // 标签页
        const tabWidth = 150;
        const startX = (GAME_WIDTH - this.tabs.length * tabWidth) / 2;
        
        for (let i = 0; i < this.tabs.length; i++) {
            const tab = this.tabs[i];
            const x = startX + i * tabWidth;
            const isActive = tab === this.currentTab;
            
            ctx.fillStyle = isActive ? '#3498DB' : '#2C3E50';
            ctx.fillRect(x, 120, tabWidth - 10, 40);
            
            ctx.fillStyle = '#FFF';
            ctx.font = '16px monospace';
            ctx.fillText(this.getTabName(tab), x + (tabWidth - 10) / 2, 145);
        }
        
        // 列表
        const entries = this.lb.getTopN(this.currentTab, 10);
        const yStart = 200;
        const lineHeight = 50;
        
        for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];
            const y = yStart + i * lineHeight;
            
            // 排名颜色
            if (i === 0) ctx.fillStyle = '#FFD700';
            else if (i === 1) ctx.fillStyle = '#C0C0C0';
            else if (i === 2) ctx.fillStyle = '#CD7F32';
            else ctx.fillStyle = '#FFF';
            
            // 排名
            ctx.font = 'bold 24px monospace';
            ctx.textAlign = 'left';
            ctx.fillText(`#${i + 1}`, 100, y);
            
            // 名字
            ctx.font = '20px monospace';
            ctx.fillText(entry.name, 180, y);
            
            // 分数
            ctx.textAlign = 'right';
            ctx.fillStyle = '#F1C40F';
            ctx.font = 'bold 22px monospace';
            ctx.fillText(entry.score.toLocaleString(), GAME_WIDTH - 150, y);
            
            // 详情
            ctx.fillStyle = '#AAA';
            ctx.font = '12px monospace';
            ctx.fillText(`Lv.${entry.level} Wv.${entry.wave}`, GAME_WIDTH - 150, y + 20);
        }
        
        // 个人排名
        const personalEntry = this.lb.scores.personal[0];
        if (personalEntry) {
            ctx.fillStyle = '#2ECC71';
            ctx.fillRect(50, GAME_HEIGHT - 120, GAME_WIDTH - 100, 60);
            
            ctx.fillStyle = '#000';
            ctx.font = 'bold 20px monospace';
            ctx.textAlign = 'left';
            ctx.fillText('你的最佳:', 70, GAME_HEIGHT - 85);
            ctx.font = '24px monospace';
            ctx.textAlign = 'right';
            ctx.fillText(personalEntry.score.toLocaleString(), GAME_WIDTH - 70, GAME_HEIGHT - 80);
        }
    }
    
    getTabName(tab) {
        const names = {
            daily: '每日',
            weekly: '每周',
            alltime: '总榜',
            personal: '个人'
        };
        return names[tab] || tab;
    }
    
    handleClick(x, y) {
        // 处理标签页点击
        const tabWidth = 150;
        const startX = (GAME_WIDTH - this.tabs.length * tabWidth) / 2;
        
        if (y >= 120 && y <= 160) {
            for (let i = 0; i < this.tabs.length; i++) {
                if (x >= startX + i * tabWidth && x <= startX + (i + 1) * tabWidth - 10) {
                    this.currentTab = this.tabs[i];
                    return true;
                }
            }
        }
        return false;
    }
}

// ========== 输入名字对话框 ==========
function showNameInputDialog(callback) {
    const div = document.createElement('div');
    div.innerHTML = `
        <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);z-index:1000;display:flex;justify-content:center;align-items:center;">
            <div style="background:#2c3e50;padding:40px;border-radius:10px;text-align:center;color:white;">
                <h2>输入你的名字</h2>
                <input type="text" id="playerNameInput" maxlength="12" placeholder="无名奶牛" 
                    style="padding:10px;font-size:20px;margin:20px;width:200px;text-align:center;">
                <br>
                <button onclick="this.parentElement.parentElement.remove(); callback(document.getElementById('playerNameInput').value || '无名奶牛');" 
                    style="padding:15px 30px;font-size:18px;background:#27ae60;color:white;border:none;border-radius:5px;cursor:pointer;">
                    确定
                </button>
            </div>
        </div>
    `;
    document.body.appendChild(div);
}

console.log('Leaderboard system loaded');
console.log('Daily challenges, ranking, score tracking');
