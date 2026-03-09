/**
 * DailyChallengeSystem - 每日挑战系统
 * 每日随机种子、特殊规则、排行榜
 */

class DailyChallengeSystem {
    constructor(world) {
        this.world = world;
        this.priority = 290;
        this.enabled = true;
        
        // 今日挑战数据
        this.todaySeed = null;
        this.todayModifiers = [];
        this.todayDate = null;
        
        // 玩家今日成绩
        this.todayAttempt = null;
        
        // 历史记录
        this.history = [];
        
        // 挑战配置
        this.modifierPool = [
            // 正面修正
            { id: 'double_damage', name: '玻璃大炮', description: '伤害x2，生命x0.5', type: 'mixed', 
              effects: { playerDamage: 2.0, playerHealth: 0.5 }, weight: 10 },
            { id: 'fast_reload', name: '无限火力', description: '攻速+50%', type: 'positive', 
              effects: { attackSpeed: 1.5 }, weight: 15 },
            { id: 'rich_start', name: '土豪开局', description: '初始金币+1000', type: 'positive', 
              effects: { startGold: 1000 }, weight: 10 },
            { id: 'lucky_day', name: '幸运日', description: '掉率+100%', type: 'positive', 
              effects: { dropRate: 2.0 }, weight: 10 },
            
            // 负面修正
            { id: 'hard_mode', name: '敌强我弱', description: '敌人生命+50%，玩家伤害-20%', type: 'negative', 
              effects: { enemyHealth: 1.5, playerDamage: 0.8 }, weight: 15 },
            { id: 'no_heal', name: '无治疗', description: '无法恢复生命', type: 'negative', 
              effects: { noHeal: true }, weight: 10 },
            { id: 'one_hit', name: '一击必杀', description: '受到任何伤害立即死亡', type: 'negative', 
              effects: { oneHitKill: true }, weight: 5 },
            { id: 'darkness', name: '黑暗侵袭', description: '视野范围-50%', type: 'negative', 
              effects: { visionRange: 0.5 }, weight: 10 },
            
            // 特殊规则
            { id: 'only_melee', name: '近战专精', description: '只能使用近战武器', type: 'special', 
              effects: { onlyMelee: true }, weight: 8 },
            { id: 'random_weapon', name: '武器轮换', description: '每30秒随机更换武器', type: 'special', 
              effects: { randomWeapon: 30 }, weight: 8 },
            { id: 'pet_party', name: '宠物派对', description: '可同时携带3只宠物', type: 'special', 
              effects: { maxPets: 3 }, weight: 8 },
            { id: 'no_passives', name: '裸装挑战', description: '无法获得被动', type: 'special', 
              effects: { noPassives: true }, weight: 8 },
            { id: 'infinite_dash', name: '无限冲刺', description: '无冲刺冷却', type: 'positive', 
              effects: { infiniteDash: true }, weight: 10 },
            { id: 'enemy_swarm', name: '虫群模式', description: '敌人数量x3，生命x0.5', type: 'mixed', 
              effects: { enemyCount: 3.0, enemyHealth: 0.5 }, weight: 10 }
        ];
        
        this.isDailyRun = false;
        this.leaderboard = [];
    }
    
    init() {
        this.generateDailyChallenge();
        this.loadData();
        
        // 监听游戏事件
        this.world.on('runStarted', (data) => {
            if (data.isDaily) {
                this.startDailyRun();
            }
        });
        
        this.world.on('gameCompleted', (data) => {
            if (this.isDailyRun) {
                this.completeDailyRun(data);
            }
        });
        
        this.world.on('playerDied', (data) => {
            if (this.isDailyRun) {
                this.failDailyRun(data);
            }
        });
    }
    
    /**
     * 生成今日挑战
     */
    generateDailyChallenge() {
        const now = new Date();
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        
        // 检查是否需要重新生成
        if (this.todayDate === dateStr) {
            return;
        }
        
        this.todayDate = dateStr;
        
        // 基于日期生成种子
        this.todaySeed = this.dateToSeed(dateStr);
        
        // 随机选择2-3个修正
        const count = 2 + Math.floor(this.seededRandom(this.todaySeed) * 2);
        this.todayModifiers = this.selectModifiers(count);
        
        console.log(`📅 今日挑战已生成: ${dateStr}, 种子: ${this.todaySeed}`);
    }
    
    /**
     * 日期转种子
     */
    dateToSeed(dateStr) {
        let hash = 0;
        for (let i = 0; i < dateStr.length; i++) {
            const char = dateStr.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }
    
    /**
     * 种子随机数
     */
    seededRandom(seed) {
        const x = Math.sin(seed++) * 10000;
        return x - Math.floor(x);
    }
    
    /**
     * 选择修正
     */
    selectModifiers(count) {
        const selected = [];
        const available = [...this.modifierPool];
        let seed = this.todaySeed;
        
        for (let i = 0; i < count && available.length > 0; i++) {
            // 加权随机
            const totalWeight = available.reduce((sum, m) => sum + m.weight, 0);
            let random = this.seededRandom(seed++) * totalWeight;
            
            let index = 0;
            for (let j = 0; j < available.length; j++) {
                random -= available[j].weight;
                if (random <= 0) {
                    index = j;
                    break;
                }
            }
            
            selected.push(available[index]);
            available.splice(index, 1);
        }
        
        return selected;
    }
    
    /**
     * 开始每日挑战
     */
    startDailyRun() {
        this.isDailyRun = true;
        this.todayAttempt = {
            date: this.todayDate,
            seed: this.todaySeed,
            modifiers: this.todayModifiers.map(m => m.id),
            startTime: Date.now(),
            floor: 1,
            kills: 0,
            score: 0,
            completed: false
        };
        
        // 应用修正
        this.applyModifiers();
        
        this.world.emit('dailyRunStarted', {
            seed: this.todaySeed,
            modifiers: this.todayModifiers
        });
    }
    
    /**
     * 应用修正
     */
    applyModifiers() {
        for (const mod of this.todayModifiers) {
            if (mod.effects) {
                this.world.emit('applyModifier', { modifier: mod });
            }
        }
    }
    
    /**
     * 完成挑战
     */
    completeDailyRun(data) {
        if (!this.todayAttempt) return;
        
        this.todayAttempt.completed = true;
        this.todayAttempt.floor = data.floor || 6;
        this.todayAttempt.kills = data.kills || 0;
        this.todayAttempt.score = this.calculateScore(data);
        this.todayAttempt.time = Date.now() - this.todayAttempt.startTime;
        
        // 保存到历史
        this.history.push({ ...this.todayAttempt });
        
        // 更新排行榜
        this.updateLeaderboard();
        
        this.world.emit('dailyRunCompleted', {
            attempt: this.todayAttempt,
            rank: this.getTodayRank()
        });
        
        this.saveData();
        this.isDailyRun = false;
    }
    
    /**
     * 挑战失败
     */
    failDailyRun(data) {
        if (!this.todayAttempt) return;
        
        this.todayAttempt.floor = data.floor || 1;
        this.todayAttempt.kills = data.kills || 0;
        this.todayAttempt.score = this.calculateScore(data);
        this.todayAttempt.time = Date.now() - this.todayAttempt.startTime;
        
        this.history.push({ ...this.todayAttempt });
        
        this.world.emit('dailyRunFailed', {
            attempt: this.todayAttempt
        });
        
        this.saveData();
        this.isDailyRun = false;
    }
    
    /**
     * 计算分数
     */
    calculateScore(data) {
        let score = 0;
        
        // 基础分
        score += (data.floor || 1) * 1000;
        score += (data.kills || 0) * 10;
        
        // 通关奖励
        if (data.completed) {
            score += 5000;
        }
        
        // 时间奖励（越快越好）
        const timeMinutes = (data.time || 0) / 60000;
        if (timeMinutes < 30) {
            score += Math.floor((30 - timeMinutes) * 100);
        }
        
        // 修正倍率
        for (const mod of this.todayModifiers) {
            if (mod.type === 'negative') score *= 1.5;
            if (mod.type === 'mixed') score *= 1.2;
        }
        
        return Math.floor(score);
    }
    
    /**
     * 获取今日排名
     */
    getTodayRank() {
        const todayRuns = this.history.filter(h => h.date === this.todayDate && h.completed);
        todayRuns.sort((a, b) => b.score - a.score);
        
        if (!this.todayAttempt) return null;
        
        const rank = todayRuns.findIndex(r => r === this.todayAttempt);
        return rank >= 0 ? rank + 1 : todayRuns.length + 1;
    }
    
    /**
     * 更新排行榜（模拟）
     */
    updateLeaderboard() {
        // 生成一些模拟玩家数据
        const mockPlayers = ['Player1', 'RogueMaster', 'CowKing', 'DungeonRunner', 'Speedster'];
        this.leaderboard = mockPlayers.map((name, i) => ({
            name,
            score: 15000 - i * 2000 + Math.floor(Math.random() * 1000),
            floor: 6,
            time: 20 + i * 5
        }));
        
        // 插入玩家成绩
        if (this.todayAttempt && this.todayAttempt.completed) {
            this.leaderboard.push({
                name: 'You',
                score: this.todayAttempt.score,
                floor: this.todayAttempt.floor,
                time: this.todayAttempt.time / 60000,
                isPlayer: true
            });
        }
        
        // 排序
        this.leaderboard.sort((a, b) => b.score - a.score);
        this.leaderboard = this.leaderboard.slice(0, 10);
    }
    
    /**
     * 检查今日是否已完成
     */
    hasCompletedToday() {
        return this.history.some(h => h.date === this.todayDate && h.completed);
    }
    
    /**
     * 获取今日最佳
     */
    getTodayBest() {
        const todayRuns = this.history.filter(h => h.date === this.todayDate && h.completed);
        if (todayRuns.length === 0) return null;
        
        return todayRuns.reduce((best, run) => run.score > best.score ? run : best);
    }
    
    // ===== 持久化 =====
    loadData() {
        try {
            const saved = localStorage.getItem('rougeCow_daily');
            if (saved) {
                const data = JSON.parse(saved);
                if (data.history) {
                    this.history = data.history;
                }
            }
        } catch (e) {
            console.warn('加载每日挑战数据失败:', e);
        }
    }
    
    saveData() {
        try {
            const data = {
                history: this.history.slice(-30), // 保留最近30天
                lastSave: Date.now()
            };
            localStorage.setItem('rougeCow_daily', JSON.stringify(data));
        } catch (e) {
            console.warn('保存每日挑战数据失败:', e);
        }
    }
    
    // ===== UI =====
    renderDailyUI(ctx, x, y, w, h) {
        // 标题
        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`📅 今日挑战 - ${this.todayDate}`, x + w / 2, y + 30);
        
        // 种子
        ctx.fillStyle = '#888';
        ctx.font = '12px Arial';
        ctx.fillText(`种子: ${this.todaySeed}`, x + w / 2, y + 50);
        
        // 修正列表
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('今日规则:', x + 20, y + 80);
        
        let modY = y + 105;
        for (const mod of this.todayModifiers) {
            // 图标背景
            const color = mod.type === 'positive' ? '#2ecc71' : 
                         mod.type === 'negative' ? '#e74c3c' : 
                         mod.type === 'mixed' ? '#f1c40f' : '#3498db';
            
            ctx.fillStyle = color;
            ctx.fillRect(x + 20, modY - 15, 5, 20);
            
            // 名称
            ctx.fillStyle = '#fff';
            ctx.font = '14px Arial';
            ctx.fillText(mod.name, x + 35, modY);
            
            // 描述
            ctx.fillStyle = '#aaa';
            ctx.font = '12px Arial';
            ctx.fillText(mod.description, x + 35, modY + 18);
            
            modY += 40;
        }
        
        // 今日最佳
        const best = this.getTodayBest();
        if (best) {
            modY += 10;
            ctx.fillStyle = '#2ecc71';
            ctx.font = 'bold 14px Arial';
            ctx.fillText('🏆 今日最佳:', x + 20, modY);
            
            ctx.fillStyle = '#fff';
            ctx.font = '12px Arial';
            ctx.fillText(`分数: ${best.score.toLocaleString()}`, x + 35, modY + 20);
            ctx.fillText(`到达: 第${best.floor}层`, x + 35, modY + 38);
        }
        
        // 排行榜
        const lbY = y + h - 200;
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🏆 排行榜', x + w / 2, lbY);
        
        this.leaderboard.forEach((entry, i) => {
            const entryY = lbY + 25 + i * 22;
            const isPlayer = entry.isPlayer;
            
            // 排名
            ctx.fillStyle = i < 3 ? '#f1c40f' : (isPlayer ? '#2ecc71' : '#888');
            ctx.font = isPlayer ? 'bold 12px Arial' : '12px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`${i + 1}.`, x + 30, entryY);
            
            // 名字
            ctx.fillStyle = isPlayer ? '#2ecc71' : '#fff';
            ctx.fillText(entry.name, x + 60, entryY);
            
            // 分数
            ctx.textAlign = 'right';
            ctx.fillText(entry.score.toLocaleString(), x + w - 30, entryY);
        });
    }
    
    update(dt) {}
}

window.DailyChallengeSystem = DailyChallengeSystem;
