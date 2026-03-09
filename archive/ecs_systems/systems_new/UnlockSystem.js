/**
 * UnlockSystem - 解锁系统
 * 新职业、武器、被动、宠物等内容的渐进式解锁
 */

class UnlockSystem {
    constructor(world) {
        this.world = world;
        this.priority = 280;
        this.enabled = true;
        
        // 解锁数据库
        this.unlockables = new Map();
        
        // 已解锁内容
        this.unlocked = new Set();
        
        // 解锁进度
        this.progress = new Map();
        
        // 解锁提示队列
        this.notifications = [];
        
        this.initUnlockables();
    }
    
    init() {
        // 监听游戏事件以检查解锁条件
        this.world.on('gameCompleted', (data) => this.onGameCompleted(data));
        this.world.on('playerDied', (data) => this.onPlayerDied(data));
        this.world.on('bossKilled', (data) => this.onBossKilled(data));
        this.world.on('achievementUnlocked', (data) => this.onAchievement(data));
        this.world.on('runCompleted', (data) => this.onRunCompleted(data));
        
        // 加载已保存的解锁数据
        this.loadUnlockedData();
    }
    
    /**
     * 初始化可解锁内容
     */
    initUnlockables() {
        // ===== 职业解锁 =====
        this.addUnlockable({
            id: 'class_warrior',
            name: '战士',
            description: '高生命值，擅长近战',
            type: 'class',
            icon: '⚔️',
            starting: true, // 初始解锁
            condition: null
        });
        
        this.addUnlockable({
            id: 'class_ranger',
            name: '游侠',
            description: '高攻速，远程专精',
            type: 'class',
            icon: '🏹',
            condition: { type: 'reachFloor', floor: 2 }
        });
        
        this.addUnlockable({
            id: 'class_mage',
            name: '法师',
            description: '高技能伤害，元素掌控',
            type: 'class',
            icon: '🔮',
            condition: { type: 'collectItems', itemType: 'magic', count: 10 }
        });
        
        this.addUnlockable({
            id: 'class_rogue',
            name: '刺客',
            description: '高暴击，潜行暗杀',
            type: 'class',
            icon: '🗡️',
            condition: { type: 'criticalKills', count: 50 }
        });
        
        this.addUnlockable({
            id: 'class_paladin',
            name: '圣骑士',
            description: '高防御，治疗能力',
            type: 'class',
            icon: '🛡️',
            condition: { type: 'noDamageBoss', count: 1 }
        });
        
        this.addUnlockable({
            id: 'class_necromancer',
            name: '死灵法师',
            description: '召唤亡灵，黑暗魔法',
            type: 'class',
            icon: '💀',
            condition: { type: 'summonKills', count: 100 }
        });
        
        // ===== 武器解锁 =====
        this.addUnlockable({
            id: 'weapon_scythe',
            name: '镰刀',
            description: '大范围横扫攻击',
            type: 'weapon',
            icon: '🔪',
            condition: { type: 'killCount', count: 500 }
        });
        
        this.addUnlockable({
            id: 'weapon_boomerang',
            name: '回旋镖',
            description: '可返回的远程武器',
            type: 'weapon',
            icon: '🔄',
            condition: { type: 'rangedKills', count: 100 }
        });
        
        this.addUnlockable({
            id: 'weapon_gloves',
            name: '拳套',
            description: '极快攻速，连击伤害',
            type: 'weapon',
            icon: '👊',
            condition: { type: 'comboHits', count: 100 }
        });
        
        this.addUnlockable({
            id: 'weapon_chakram',
            name: '环刃',
            description: '穿透敌人，弹射攻击',
            type: 'weapon',
            icon: '⭕',
            condition: { type: 'piercingKills', count: 50 }
        });
        
        this.addUnlockable({
            id: 'weapon_crossbow',
            name: '弩',
            description: '高伤害，装填慢',
            type: 'weapon',
            icon: '🎯',
            condition: { type: 'oneShotKills', count: 30 }
        });
        
        // ===== 被动解锁 =====
        this.addUnlockable({
            id: 'passive_vampire',
            name: '吸血鬼之牙',
            description: '攻击吸血',
            type: 'passive',
            icon: '🧛',
            condition: { type: 'lifeSteal', amount: 500 }
        });
        
        this.addUnlockable({
            id: 'passive_phoenix',
            name: '凤凰之羽',
            description: '死亡时复活一次',
            type: 'passive',
            icon: '🐦',
            condition: { type: 'dieCount', count: 10 }
        });
        
        this.addUnlockable({
            id: 'passive_ninja',
            name: '忍者卷轴',
            description: '闪避后隐身',
            type: 'passive',
            icon: '🥷',
            condition: { type: 'dodgeCount', count: 100 }
        });
        
        this.addUnlockable({
            id: 'passive_alchemist',
            name: '炼金术书',
            description: '药水效果翻倍',
            type: 'passive',
            icon: '⚗️',
            condition: { type: 'usePotions', count: 50 }
        });
        
        this.addUnlockable({
            id: 'passive_gambler',
            name: '赌徒骰子',
            description: '商店价格随机波动',
            type: 'passive',
            icon: '🎲',
            condition: { type: 'shopPurchases', count: 30 }
        });
        
        // ===== 宠物解锁 =====
        this.addUnlockable({
            id: 'pet_dragon',
            name: '幼龙',
            description: '喷火攻击，高伤害',
            type: 'pet',
            icon: '🐉',
            condition: { type: 'killBoss', bossId: 'boss_dragon' }
        });
        
        this.addUnlockable({
            id: 'pet_unicorn',
            name: '独角兽',
            description: '治疗光环，净化负面',
            type: 'pet',
            icon: '🦄',
            condition: { type: 'noDamageRun', floor: 3 }
        });
        
        this.addUnlockable({
            id: 'pet_robot',
            name: '机械助手',
            description: '自动收集金币',
            type: 'pet',
            icon: '🤖',
            condition: { type: 'collectGold', amount: 5000 }
        });
        
        this.addUnlockable({
            id: 'pet_ghost',
            name: '幽灵伙伴',
            description: '穿透墙壁攻击',
            type: 'pet',
            icon: '👻',
            condition: { type: 'secretRooms', count: 5 }
        });
        
        // ===== 难度解锁 =====
        this.addUnlockable({
            id: 'difficulty_normal',
            name: '普通难度',
            description: '标准游戏体验',
            type: 'difficulty',
            icon: '⭐',
            starting: true,
            condition: null
        });
        
        this.addUnlockable({
            id: 'difficulty_hard',
            name: '困难难度',
            description: '敌人更强，奖励更多',
            type: 'difficulty',
            icon: '⭐⭐',
            condition: { type: 'winCount', count: 1 }
        });
        
        this.addUnlockable({
            id: 'difficulty_nightmare',
            name: '噩梦难度',
            description: '极度危险，传奇奖励',
            type: 'difficulty',
            icon: '⭐⭐⭐',
            condition: { type: 'winCountHard', count: 3 }
        });
        
        this.addUnlockable({
            id: 'difficulty_impossible',
            name: '不可能难度',
            description: '你能做到吗？',
            type: 'difficulty',
            icon: '💀',
            condition: { type: 'winCountNightmare', count: 5 }
        });
        
        // ===== 游戏模式解锁 =====
        this.addUnlockable({
            id: 'mode_daily',
            name: '每日挑战',
            description: '每日随机种子挑战',
            type: 'mode',
            icon: '📅',
            condition: { type: 'playCount', count: 5 }
        });
        
        this.addUnlockable({
            id: 'mode_endless',
            name: '无尽模式',
            description: '无限楼层，你能走多远？',
            type: 'mode',
            icon: '♾️',
            condition: { type: 'reachFloor', floor: 6 }
        });
        
        this.addUnlockable({
            id: 'mode_boss_rush',
            name: 'Boss连战',
            description: '连续挑战所有Boss',
            type: 'mode',
            icon: '👑',
            condition: { type: 'killAllBosses', count: 1 }
        });
    }
    
    addUnlockable(data) {
        this.unlockables.set(data.id, data);
        
        if (data.starting) {
            this.unlocked.add(data.id);
        }
    }
    
    // ===== 事件处理 =====
    onGameCompleted(data) {
        this.checkCondition('winCount');
        
        if (data.difficulty === 'hard') {
            this.checkCondition('winCountHard');
        } else if (data.difficulty === 'nightmare') {
            this.checkCondition('winCountNightmare');
        }
        
        if (data.noDamage) {
            this.checkCondition('noDamageRun');
        }
    }
    
    onPlayerDied(data) {
        this.incrementProgress('dieCount');
    }
    
    onBossKilled(data) {
        const bossId = data.boss?.id || data.bossId;
        if (bossId) {
            this.incrementProgress('bossKill_' + bossId);
            
            // 检查是否击败所有Boss
            const bossSystem = this.world.getSystem(BossSystem);
            if (bossSystem) {
                const allBosses = Array.from(bossSystem.bossDatabase.keys());
                const allKilled = allBosses.every(id => 
                    (this.progress.get('bossKill_' + id) || 0) > 0
                );
                if (allKilled) {
                    this.checkCondition('killAllBosses');
                }
            }
        }
        
        if (data.noDamage) {
            this.incrementProgress('noDamageBoss');
        }
    }
    
    onAchievement(data) {
        this.incrementProgress('achievementCount');
    }
    
    onRunCompleted(data) {
        this.incrementProgress('playCount');
        
        if (data.maxFloor) {
            const currentMax = this.progress.get('maxFloorReached') || 0;
            if (data.maxFloor > currentMax) {
                this.setProgress('maxFloorReached', data.maxFloor);
            }
        }
    }
    
    // ===== 进度管理 =====
    incrementProgress(key, amount = 1) {
        const current = this.progress.get(key) || 0;
        this.setProgress(key, current + amount);
    }
    
    setProgress(key, value) {
        this.progress.set(key, value);
        this.checkAllUnlocks();
    }
    
    checkCondition(type, value) {
        for (const [id, unlockable] of this.unlockables) {
            if (this.unlocked.has(id)) continue;
            if (!unlockable.condition) continue;
            
            if (unlockable.condition.type === type) {
                const current = this.progress.get(type) || 0;
                if (current >= unlockable.condition.count) {
                    this.unlock(id);
                }
            }
        }
    }
    
    checkAllUnlocks() {
        for (const [id, unlockable] of this.unlockables) {
            if (this.unlocked.has(id)) continue;
            if (!unlockable.condition) continue;
            
            const condition = unlockable.condition;
            const current = this.progress.get(condition.type) || 0;
            
            if (current >= (condition.count || condition.amount || 1)) {
                this.unlock(id);
            }
        }
    }
    
    unlock(id) {
        if (this.unlocked.has(id)) return;
        
        const unlockable = this.unlockables.get(id);
        this.unlocked.add(id);
        
        // 发送通知
        this.notifications.push({
            id: unlockable.id,
            name: unlockable.name,
            icon: unlockable.icon,
            type: unlockable.type,
            time: Date.now()
        });
        
        this.world.emit('contentUnlocked', {
            unlockable,
            totalUnlocked: this.unlocked.size
        });
        
        console.log(`🔓 解锁: ${unlockable.name}`);
        
        // 保存
        this.saveUnlockedData();
    }
    
    isUnlocked(id) {
        return this.unlocked.has(id);
    }
    
    getUnlockedByType(type) {
        return Array.from(this.unlocked)
            .filter(id => this.unlockables.get(id)?.type === type)
            .map(id => this.unlockables.get(id));
    }
    
    // ===== 持久化 =====
    loadUnlockedData() {
        try {
            const saved = localStorage.getItem('rougeCow_unlocks');
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
            console.warn('加载解锁数据失败:', e);
        }
    }
    
    saveUnlockedData() {
        try {
            const data = {
                unlocked: Array.from(this.unlocked),
                progress: Object.fromEntries(this.progress),
                timestamp: Date.now()
            };
            localStorage.setItem('rougeCow_unlocks', JSON.stringify(data));
        } catch (e) {
            console.warn('保存解锁数据失败:', e);
        }
    }
    
    // ===== UI =====
    render(ctx) {
        this.renderNotifications(ctx);
    }
    
    renderNotifications(ctx) {
        const now = Date.now();
        const active = this.notifications.filter(n => now - n.time < 6000);
        
        if (active.length === 0) return;
        
        const canvas = ctx.canvas;
        const w = canvas.width;
        
        active.forEach((notif, i) => {
            const alpha = Math.max(0, 1 - (now - notif.time) / 6000);
            const y = 150 + i * 70;
            
            // 背景
            ctx.fillStyle = `rgba(46, 204, 113, ${alpha * 0.9})`;
            ctx.fillRect(w / 2 - 220, y, 440, 60);
            
            // 图标
            ctx.font = '30px Arial';
            ctx.textAlign = 'left';
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fillText(notif.icon, w / 2 - 200, y + 40);
            
            // 文字
            ctx.font = 'bold 18px Arial';
            ctx.fillText(`解锁: ${notif.name}`, w / 2 - 160, y + 28);
            
            ctx.font = '14px Arial';
            ctx.fillStyle = `rgba(200, 200, 200, ${alpha})`;
            ctx.fillText(this.getTypeName(notif.type), w / 2 - 160, y + 48);
            
            // 装饰
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.5})`;
            ctx.lineWidth = 2;
            ctx.strokeRect(w / 2 - 220, y, 440, 60);
        });
        
        this.notifications = active;
    }
    
    getTypeName(type) {
        const names = {
            class: '新职业',
            weapon: '新武器',
            passive: '新被动',
            pet: '新宠物',
            difficulty: '新难度',
            mode: '新模式'
        };
        return names[type] || type;
    }
    
    // 渲染解锁界面（用于主菜单）
    renderUnlockUI(ctx, x, y, w, h) {
        // 标题
        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🔓 解锁进度', x + w / 2, y + 30);
        
        // 统计
        const categories = ['class', 'weapon', 'passive', 'pet', 'difficulty', 'mode'];
        const names = { class: '职业', weapon: '武器', passive: '被动', pet: '宠物', difficulty: '难度', mode: '模式' };
        
        let currentY = y + 60;
        
        categories.forEach(cat => {
            const all = Array.from(this.unlockables.values()).filter(u => u.type === cat);
            const unlocked = all.filter(u => this.unlocked.has(u.id));
            const pct = Math.floor((unlocked.length / all.length) * 100);
            
            // 类别名称
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(`${names[cat]}: ${unlocked.length}/${all.length}`, x + 20, currentY);
            
            // 进度条
            ctx.fillStyle = '#2c3e50';
            ctx.fillRect(x + 150, currentY - 12, 200, 15);
            ctx.fillStyle = pct === 100 ? '#2ecc71' : '#f1c40f';
            ctx.fillRect(x + 150, currentY - 12, 200 * (pct / 100), 15);
            
            // 百分比
            ctx.fillStyle = '#fff';
            ctx.font = '12px Arial';
            ctx.textAlign = 'right';
            ctx.fillText(`${pct}%`, x + 360, currentY);
            
            currentY += 35;
        });
        
        // 总进度
        const totalAll = this.unlockables.size;
        const totalUnlocked = this.unlocked.size;
        const totalPct = Math.floor((totalUnlocked / totalAll) * 100);
        
        currentY += 10;
        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`总进度: ${totalUnlocked}/${totalAll} (${totalPct}%)`, x + w / 2, currentY);
    }
    
    update(dt) {}
}

window.UnlockSystem = UnlockSystem;
