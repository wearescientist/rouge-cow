/**
 * AchievementSystem - 成就系统
 * 多维度成就追踪，奖励机制
 */

class AchievementSystem {
    constructor(world) {
        this.world = world;
        this.priority = 270;
        this.enabled = true;
        
        // 成就数据库
        this.achievements = new Map();
        
        // 解锁状态
        this.unlocked = new Set();
        this.progress = new Map(); // 成就ID -> 当前进度
        
        // 通知队列
        this.notifications = [];
        
        this.initAchievements();
    }
    
    init() {
        // 监听游戏事件
        this.world.on('enemyKilled', (data) => this.onEnemyKilled(data));
        this.world.on('bossKilled', (data) => this.onBossKilled(data));
        this.world.on('itemPickedUp', (data) => this.onItemPickup(data));
        this.world.on('gameCompleted', (data) => this.onGameCompleted(data));
        this.world.on('playerDied', (data) => this.onPlayerDied(data));
        this.world.on('floorChanged', (data) => this.onFloorChange(data));
        this.world.on('damageDealt', (data) => this.onDamageDealt(data));
        this.world.on('damageTaken', (data) => this.onDamageTaken(data));
        this.world.on('runStarted', () => this.onRunStarted());
        
        // 监听按键
        this.world.on('keyPressed', (key) => {
            if (key === 'v' || key === 'V') {
                this.toggleUI();
            }
        });
        
        // 加载已保存的成就
        this.loadSavedAchievements();
    }
    
    /**
     * 初始化成就数据库
     */
    initAchievements() {
        // ===== 战斗成就 =====
        this.addAchievement({
            id: 'kill_10',
            name: '初出茅庐',
            description: '累计击败10个敌人',
            category: 'combat',
            icon: '⚔️',
            target: 10,
            progressKey: 'totalKills'
        });
        
        this.addAchievement({
            id: 'kill_100',
            name: '屠戮者',
            description: '累计击败100个敌人',
            category: 'combat',
            icon: '🔪',
            target: 100,
            progressKey: 'totalKills'
        });
        
        this.addAchievement({
            id: 'kill_1000',
            name: '战神',
            description: '累计击败1000个敌人',
            category: 'combat',
            icon: '👑',
            target: 1000,
            progressKey: 'totalKills'
        });
        
        this.addAchievement({
            id: 'kill_10000',
            name: '毁灭者',
            description: '累计击败10000个敌人',
            category: 'combat',
            icon: '💀',
            target: 10000,
            progressKey: 'totalKills'
        });
        
        // ===== Boss成就 =====
        this.addAchievement({
            id: 'boss_first',
            name: '初胜',
            description: '击败第一个Boss',
            category: 'boss',
            icon: '🏆',
            target: 1,
            progressKey: 'bossKills'
        });
        
        this.addAchievement({
            id: 'boss_5',
            name: 'Boss猎人',
            description: '击败5个Boss',
            category: 'boss',
            icon: '🎯',
            target: 5,
            progressKey: 'bossKills'
        });
        
        this.addAchievement({
            id: 'boss_all',
            name: '全Boss征服',
            description: '击败所有Boss',
            category: 'boss',
            icon: '👑',
            target: 6,
            progressKey: 'bossKills'
        });
        
        this.addAchievement({
            id: 'boss_no_damage',
            name: '完美胜利',
            description: '无伤击败一个Boss',
            category: 'boss',
            icon: '✨',
            target: 1,
            progressKey: 'noDamageBossKills'
        });
        
        // ===== 探索成就 =====
        this.addAchievement({
            id: 'floor_1',
            name: '初入深渊',
            description: '到达第2层',
            category: 'exploration',
            icon: '📍',
            target: 2,
            progressKey: 'maxFloor'
        });
        
        this.addAchievement({
            id: 'floor_3',
            name: '深渊行者',
            description: '到达第4层',
            category: 'exploration',
            icon: '🔦',
            target: 4,
            progressKey: 'maxFloor'
        });
        
        this.addAchievement({
            id: 'floor_6',
            name: '深渊之王',
            description: '到达最深层',
            category: 'exploration',
            icon: '👑',
            target: 6,
            progressKey: 'maxFloor'
        });
        
        this.addAchievement({
            id: 'secret_rooms_10',
            name: '寻宝猎人',
            description: '发现10个秘密房间',
            category: 'exploration',
            icon: '🔍',
            target: 10,
            progressKey: 'secretRoomsFound'
        });
        
        // ===== 物品成就 =====
        this.addAchievement({
            id: 'items_50',
            name: '收藏家',
            description: '累计收集50个物品',
            category: 'collection',
            icon: '🎒',
            target: 50,
            progressKey: 'itemsCollected'
        });
        
        this.addAchievement({
            id: 'items_200',
            name: '囤积狂',
            description: '累计收集200个物品',
            category: 'collection',
            icon: '📦',
            target: 200,
            progressKey: 'itemsCollected'
        });
        
        this.addAchievement({
            id: 'legendary_item',
            name: '传说之物',
            description: '获得一件传说物品',
            category: 'collection',
            icon: '⭐',
            target: 1,
            progressKey: 'legendaryItems'
        });
        
        // ===== 特殊成就 =====
        this.addAchievement({
            id: 'flawless_victory',
            name: '完美通关',
            description: '通关时未死亡',
            category: 'special',
            icon: '💎',
            target: 1,
            progressKey: 'flawlessRuns'
        });
        
        this.addAchievement({
            id: 'pacifist',
            name: '和平主义者',
            description: '不击杀任何敌人到达第3层',
            category: 'special',
            icon: '🕊️',
            target: 1,
            progressKey: 'pacifistRuns'
        });
        
        this.addAchievement({
            id: 'speedrun',
            name: '速通者',
            description: '30分钟内通关',
            category: 'special',
            icon: '⏱️',
            target: 1,
            progressKey: 'speedruns'
        });
        
        this.addAchievement({
            id: 'rich',
            name: '富豪',
            description: '同时拥有10000金币',
            category: 'special',
            icon: '💰',
            target: 1,
            progressKey: 'maxGold'
        });
        
        // ===== 挑战成就 =====
        this.addAchievement({
            id: 'no_passives',
            name: '裸装挑战',
            description: '不带任何被动通关',
            category: 'challenge',
            icon: '🎯',
            target: 1,
            progressKey: 'noPassiveRuns'
        });
        
        this.addAchievement({
            id: 'one_hit',
            name: '一击必杀',
            description: '单次攻击造成1000+伤害',
            category: 'challenge',
            icon: '💥',
            target: 1,
            progressKey: 'maxSingleDamage'
        });
        
        this.addAchievement({
            id: 'survivor',
            name: '幸存者',
            description: '在1%生命下存活30秒',
            category: 'challenge',
            icon: '❤️',
            target: 1,
            progressKey: 'nearDeathSurvivals'
        });
        
        this.addAchievement({
            id: 'slayer',
            name: '连环杀手',
            description: '10秒内击杀10个敌人',
            category: 'challenge',
            icon: '🔥',
            target: 1,
            progressKey: 'quickKills'
        });
    }
    
    addAchievement(achievement) {
        achievement.reward = achievement.reward || this.calculateReward(achievement);
        this.achievements.set(achievement.id, achievement);
        this.progress.set(achievement.progressKey, 0);
    }
    
    calculateReward(achievement) {
        // 根据难度计算奖励
        const baseRewards = {
            combat: 100,
            boss: 200,
            exploration: 150,
            collection: 120,
            special: 500,
            challenge: 300
        };
        
        const base = baseRewards[achievement.category] || 100;
        const multiplier = Math.log10(achievement.target) || 1;
        
        return Math.floor(base * multiplier);
    }
    
    // ===== 事件处理 =====
    onEnemyKilled(data) {
        this.incrementProgress('totalKills');
        
        // 检查快速击杀
        if (!this.quickKillStart) {
            this.quickKillStart = Date.now();
            this.quickKillCount = 0;
        }
        this.quickKillCount++;
        
        const elapsed = Date.now() - this.quickKillStart;
        if (elapsed <= 10000 && this.quickKillCount >= 10) {
            this.checkAchievement('slayer');
        }
        if (elapsed > 10000) {
            this.quickKillStart = Date.now();
            this.quickKillCount = 1;
        }
    }
    
    onBossKilled(data) {
        this.incrementProgress('bossKills');
        
        // 检查无伤
        if (data.noDamage) {
            this.incrementProgress('noDamageBossKills');
        }
    }
    
    onItemPickup(data) {
        this.incrementProgress('itemsCollected');
        
        if (data.rarity === 'legendary') {
            this.incrementProgress('legendaryItems');
        }
        
        // 检查金币
        if (data.gold >= 10000) {
            this.checkAchievement('rich');
        }
    }
    
    onGameCompleted(data) {
        // 检查完美通关
        if (data.deaths === 0) {
            this.checkAchievement('flawless_victory');
        }
        
        // 检查速通
        if (data.time <= 30 * 60 * 1000) {
            this.checkAchievement('speedrun');
        }
        
        // 检查裸装
        if (data.passives === 0) {
            this.checkAchievement('no_passives');
        }
    }
    
    onPlayerDied(data) {
        // 重置当前局的统计
    }
    
    onFloorChange(data) {
        const floor = data.newFloor;
        const currentMax = this.progress.get('maxFloor') || 0;
        if (floor > currentMax) {
            this.setProgress('maxFloor', floor);
        }
    }
    
    onDamageDealt(data) {
        if (data.damage >= 1000) {
            this.checkAchievement('one_hit');
        }
        
        const currentMax = this.progress.get('maxSingleDamage') || 0;
        if (data.damage > currentMax) {
            this.setProgress('maxSingleDamage', data.damage);
        }
    }
    
    onDamageTaken(data) {
        // 检查低生命存活
        if (data.healthPercent <= 1) {
            if (!this.nearDeathStart) {
                this.nearDeathStart = Date.now();
            }
        } else {
            this.nearDeathStart = null;
        }
        
        if (this.nearDeathStart) {
            const elapsed = Date.now() - this.nearDeathStart;
            if (elapsed >= 30000) {
                this.checkAchievement('survivor');
            }
        }
    }
    
    onRunStarted() {
        // 重置单局统计
        this.quickKillStart = null;
        this.quickKillCount = 0;
        this.nearDeathStart = null;
    }
    
    // ===== 进度管理 =====
    incrementProgress(key, amount = 1) {
        const current = this.progress.get(key) || 0;
        this.setProgress(key, current + amount);
    }
    
    setProgress(key, value) {
        this.progress.set(key, value);
        
        // 检查相关成就
        for (const [id, achievement] of this.achievements) {
            if (achievement.progressKey === key) {
                this.checkAchievementProgress(id);
            }
        }
    }
    
    checkAchievementProgress(id) {
        if (this.unlocked.has(id)) return;
        
        const achievement = this.achievements.get(id);
        const current = this.progress.get(achievement.progressKey) || 0;
        
        if (current >= achievement.target) {
            this.unlockAchievement(id);
        }
    }
    
    checkAchievement(id) {
        if (this.unlocked.has(id)) return;
        
        const achievement = this.achievements.get(id);
        this.setProgress(achievement.progressKey, achievement.target);
    }
    
    unlockAchievement(id) {
        if (this.unlocked.has(id)) return;
        
        const achievement = this.achievements.get(id);
        this.unlocked.add(id);
        
        // 发送通知
        this.notifications.push({
            id: achievement.id,
            name: achievement.name,
            icon: achievement.icon,
            reward: achievement.reward,
            time: Date.now()
        });
        
        // 发送奖励
        this.world.emit('achievementUnlocked', {
            achievement,
            reward: achievement.reward
        });
        
        console.log(`🏆 成就解锁: ${achievement.name}`);
        
        // 保存
        this.saveAchievements();
    }
    
    // ===== 持久化 =====
    loadSavedAchievements() {
        try {
            const saved = localStorage.getItem('rougeCow_achievements');
            if (saved) {
                const data = JSON.parse(saved);
                if (data.unlocked) {
                    data.unlocked.forEach(id => this.unlocked.add(id));
                }
                if (data.progress) {
                    Object.entries(data.progress).forEach(([k, v]) => {
                        this.progress.set(k, v);
                    });
                }
            }
        } catch (e) {
            console.warn('加载成就失败:', e);
        }
    }
    
    saveAchievements() {
        try {
            const data = {
                unlocked: Array.from(this.unlocked),
                progress: Object.fromEntries(this.progress),
                timestamp: Date.now()
            };
            localStorage.setItem('rougeCow_achievements', JSON.stringify(data));
        } catch (e) {
            console.warn('保存成就失败:', e);
        }
    }
    
    // ===== UI =====
    toggleUI() {
        this.isUIOpen = !this.isUIOpen;
        if (this.isUIOpen) {
            this.world.emit('gamePaused');
        } else {
            this.world.emit('gameResumed');
        }
    }
    
    render(ctx) {
        this.renderNotifications(ctx);
        
        if (!this.isUIOpen) return;
        
        const canvas = ctx.canvas;
        const w = canvas.width;
        const h = canvas.height;
        
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, w, h);
        
        // 窗口
        const winW = 800;
        const winH = 600;
        const winX = (w - winW) / 2;
        const winY = (h - winH) / 2;
        
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(winX, winY, winW, winH);
        ctx.strokeStyle = '#f1c40f';
        ctx.lineWidth = 3;
        ctx.strokeRect(winX, winY, winW, winH);
        
        // 标题
        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🏆 成就', w / 2, winY + 40);
        
        // 统计
        const total = this.achievements.size;
        const unlocked = this.unlocked.size;
        const progress = Math.floor((unlocked / total) * 100);
        
        ctx.fillStyle = '#fff';
        ctx.font = '18px Arial';
        ctx.fillText(`进度: ${unlocked}/${total} (${progress}%)`, w / 2, winY + 70);
        
        // 进度条
        const barW = 400;
        const barX = (w - barW) / 2;
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(barX, winY + 80, barW, 20);
        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(barX, winY + 80, barW * (unlocked / total), 20);
        
        // 成就列表
        this.renderAchievementList(ctx, winX + 20, winY + 120, winW - 40, winH - 150);
        
        // 关闭提示
        ctx.fillStyle = '#888';
        ctx.font = '14px Arial';
        ctx.fillText('按 [V] 关闭', w / 2, winY + winH - 15);
    }
    
    renderNotifications(ctx) {
        const now = Date.now();
        const active = this.notifications.filter(n => now - n.time < 5000);
        
        if (active.length === 0) return;
        
        const canvas = ctx.canvas;
        const w = canvas.width;
        
        active.forEach((notif, i) => {
            const alpha = Math.max(0, 1 - (now - notif.time) / 5000);
            const y = 100 + i * 60;
            
            ctx.fillStyle = `rgba(241, 196, 15, ${alpha * 0.9})`;
            ctx.fillRect(w / 2 - 200, y, 400, 50);
            
            ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`${notif.icon} ${notif.name}`, w / 2 - 180, y + 32);
            
            ctx.fillStyle = `rgba(39, 174, 96, ${alpha})`;
            ctx.font = '14px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(`+${notif.reward}💰`, w / 2 + 180, y + 32);
        });
        
        // 清理过期通知
        this.notifications = active;
    }
    
    renderAchievementList(ctx, x, y, w, h) {
        // 分类显示
        const categories = ['combat', 'boss', 'exploration', 'collection', 'special', 'challenge'];
        const categoryNames = {
            combat: '战斗', boss: 'Boss', exploration: '探索',
            collection: '收集', special: '特殊', challenge: '挑战'
        };
        const colors = {
            combat: '#e74c3c', boss: '#9b59b6', exploration: '#3498db',
            collection: '#27ae60', special: '#f1c40f', challenge: '#e67e22'
        };
        
        let currentY = y;
        
        categories.forEach(cat => {
            const catAchievements = Array.from(this.achievements.values())
                .filter(a => a.category === cat);
            
            // 类别标题
            ctx.fillStyle = colors[cat];
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`${categoryNames[cat]} (${catAchievements.filter(a => this.unlocked.has(a.id)).length}/${catAchievements.length})`, x, currentY);
            currentY += 25;
            
            // 成就项
            catAchievements.forEach(ach => {
                const unlocked = this.unlocked.has(ach.id);
                const progress = this.progress.get(ach.progressKey) || 0;
                const pct = Math.min(100, (progress / ach.target) * 100);
                
                // 背景
                ctx.fillStyle = unlocked ? '#27ae60' : '#2c3e50';
                ctx.fillRect(x, currentY, w, 45);
                
                // 图标
                ctx.font = '24px Arial';
                ctx.textAlign = 'left';
                ctx.fillText(unlocked ? ach.icon : '🔒', x + 10, currentY + 30);
                
                // 名字和描述
                ctx.fillStyle = unlocked ? '#fff' : '#888';
                ctx.font = 'bold 14px Arial';
                ctx.fillText(unlocked ? ach.name : '???', x + 50, currentY + 18);
                
                ctx.fillStyle = unlocked ? '#ccc' : '#555';
                ctx.font = '11px Arial';
                ctx.fillText(unlocked ? ach.description : '未解锁', x + 50, currentY + 35);
                
                // 进度
                if (!unlocked) {
                    ctx.fillStyle = '#555';
                    ctx.fillRect(x + w - 150, currentY + 15, 100, 10);
                    ctx.fillStyle = colors[cat];
                    ctx.fillRect(x + w - 150, currentY + 15, 100 * (pct / 100), 10);
                    ctx.fillStyle = '#888';
                    ctx.font = '10px Arial';
                    ctx.textAlign = 'right';
                    ctx.fillText(`${progress}/${ach.target}`, x + w - 10, currentY + 24);
                } else {
                    ctx.fillStyle = '#f1c40f';
                    ctx.font = '12px Arial';
                    ctx.textAlign = 'right';
                    ctx.fillText(`✓ ${ach.reward}💰`, x + w - 10, currentY + 28);
                }
                
                currentY += 50;
            });
            
            currentY += 15;
        });
    }
    
    update(dt) {}
}

window.AchievementSystem = AchievementSystem;
