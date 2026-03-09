/**
 * DifficultySystem - 难度系统
 * 多难度等级，影响敌人强度、奖励倍率
 */

class DifficultySystem {
    constructor(world) {
        this.world = world;
        this.priority = 10;
        this.enabled = true;
        
        // 难度配置
        this.difficulties = new Map();
        
        // 当前难度
        this.currentDifficulty = 'normal';
        
        // 难度解锁状态
        this.unlockedDifficulties = new Set(['normal']);
        
        // 各难度通关次数
        this.clearCounts = new Map();
        
        this.initDifficulties();
    }
    
    init() {
        // 监听通关事件
        this.world.on('gameCompleted', (data) => {
            this.onGameCompleted(data);
        });
        
        // 应用难度修正
        this.world.on('enemySpawned', (data) => {
            this.applyEnemyModifiers(data.enemy);
        });
        
        this.world.on('bossSpawned', (data) => {
            this.applyBossModifiers(data.boss);
        });
        
        this.world.on('rewardCalculated', (data) => {
            this.applyRewardModifiers(data);
        });
        
        // 加载数据
        this.loadData();
    }
    
    /**
     * 初始化难度配置
     */
    initDifficulties() {
        this.difficulties.set('easy', {
            id: 'easy',
            name: '简单',
            description: '适合新手体验游戏',
            icon: '🌱',
            color: '#2ecc71',
            modifiers: {
                enemyHealth: 0.7,      // 敌人生命-30%
                enemyDamage: 0.6,      // 敌人伤害-40%
                enemySpeed: 0.8,       // 敌人速度-20%
                enemySpawnRate: 0.8,   // 生成速率-20%
                playerDamage: 1.3,     // 玩家伤害+30%
                playerHealth: 1.5,     // 玩家生命+50%
                expGain: 1.2,          // 经验获取+20%
                goldGain: 0.8,         // 金币获取-20%
                itemDropRate: 0.7,     // 物品掉率-30%
                reviveCount: 2         // 免费复活次数
            },
            unlockRequirement: null,   // 初始解锁
            scoreMultiplier: 0.5       // 分数倍率
        });
        
        this.difficulties.set('normal', {
            id: 'normal',
            name: '普通',
            description: '标准游戏体验',
            icon: '⭐',
            color: '#f1c40f',
            modifiers: {
                enemyHealth: 1.0,
                enemyDamage: 1.0,
                enemySpeed: 1.0,
                enemySpawnRate: 1.0,
                playerDamage: 1.0,
                playerHealth: 1.0,
                expGain: 1.0,
                goldGain: 1.0,
                itemDropRate: 1.0,
                reviveCount: 0
            },
            unlockRequirement: null,
            scoreMultiplier: 1.0
        });
        
        this.difficulties.set('hard', {
            id: 'hard',
            name: '困难',
            description: '敌人更强，奖励更多',
            icon: '⭐⭐',
            color: '#e67e22',
            modifiers: {
                enemyHealth: 1.5,      // 敌人生命+50%
                enemyDamage: 1.5,      // 敌人伤害+50%
                enemySpeed: 1.2,       // 敌人速度+20%
                enemySpawnRate: 1.3,   // 生成速率+30%
                eliteChance: 0.3,      // 精英怪几率+30%
                playerDamage: 0.9,     // 玩家伤害-10%
                expGain: 1.3,          // 经验获取+30%
                goldGain: 1.5,         // 金币获取+50%
                itemDropRate: 1.3,     // 物品掉率+30%
                rareDropBonus: 0.2,    // 稀有物品额外几率
                reviveCount: 0
            },
            unlockRequirement: { type: 'win', difficulty: 'normal', count: 1 },
            scoreMultiplier: 1.5
        });
        
        this.difficulties.set('nightmare', {
            id: 'nightmare',
            name: '噩梦',
            description: '极度危险，传奇奖励',
            icon: '⭐⭐⭐',
            color: '#e74c3c',
            modifiers: {
                enemyHealth: 2.2,      // 敌人生命+120%
                enemyDamage: 2.0,      // 敌人伤害+100%
                enemySpeed: 1.4,       // 敌人速度+40%
                enemySpawnRate: 1.6,   // 生成速率+60%
                eliteChance: 0.6,      // 精英怪几率+60%
                miniBossChance: 0.15,  // 小Boss出现几率
                playerDamage: 0.8,     // 玩家伤害-20%
                playerHealth: 0.8,     // 玩家生命-20%
                expGain: 1.6,          // 经验获取+60%
                goldGain: 2.0,         // 金币获取+100%
                itemDropRate: 1.6,     // 物品掉率+60%
                legendaryDropBonus: 0.1, // 传说物品额外几率
                curseChance: 0.3,      // 诅咒房间几率
                reviveCount: 0
            },
            unlockRequirement: { type: 'win', difficulty: 'hard', count: 3 },
            scoreMultiplier: 2.5
        });
        
        this.difficulties.set('impossible', {
            id: 'impossible',
            name: '不可能',
            description: '你能做到吗？',
            icon: '💀',
            color: '#9b59b6',
            modifiers: {
                enemyHealth: 3.5,      // 敌人生命+250%
                enemyDamage: 3.0,      // 敌人伤害+200%
                enemySpeed: 1.6,       // 敌人速度+60%
                enemySpawnRate: 2.0,   // 生成速率+100%
                eliteChance: 1.0,      // 全是精英
                miniBossChance: 0.3,   // 小Boss频繁出现
                playerDamage: 0.7,     // 玩家伤害-30%
                playerHealth: 0.6,     // 玩家生命-40%
                expGain: 2.0,          // 经验获取+100%
                goldGain: 3.0,         // 金币获取+200%
                itemDropRate: 2.0,     // 物品掉率+100%
                legendaryDropBonus: 0.25, // 传说物品高几率
                uniqueDropEnabled: true, // 独特物品可掉落
                curseChance: 0.6,      // 高诅咒几率
                permadeath: true,      // 永久死亡，无存档
                oneLife: true,         // 只有一条命
                reviveCount: 0
            },
            unlockRequirement: { type: 'win', difficulty: 'nightmare', count: 5 },
            scoreMultiplier: 5.0
        });
    }
    
    /**
     * 设置当前难度
     */
    setDifficulty(difficultyId) {
        if (!this.difficulties.has(difficultyId)) {
            console.warn(`难度 ${difficultyId} 不存在`);
            return false;
        }
        
        if (!this.unlockedDifficulties.has(difficultyId)) {
            console.warn(`难度 ${difficultyId} 未解锁`);
            return false;
        }
        
        this.currentDifficulty = difficultyId;
        
        this.world.emit('difficultyChanged', {
            difficulty: this.getCurrentDifficulty()
        });
        
        return true;
    }
    
    getCurrentDifficulty() {
        return this.difficulties.get(this.currentDifficulty);
    }
    
    getModifier(key) {
        const diff = this.getCurrentDifficulty();
        return diff?.modifiers?.[key] ?? 1.0;
    }
    
    /**
     * 应用敌人修正
     */
    applyEnemyModifiers(enemy) {
        const diff = this.getCurrentDifficulty();
        if (!diff) return;
        
        const mods = diff.modifiers;
        
        // 应用生命修正
        if (mods.enemyHealth && enemy.health) {
            enemy.maxHealth *= mods.enemyHealth;
            enemy.health = enemy.maxHealth;
        }
        
        // 应用伤害修正
        if (mods.enemyDamage && enemy.damage) {
            enemy.damage *= mods.enemyDamage;
        }
        
        // 应用速度修正
        if (mods.enemySpeed && enemy.speed) {
            enemy.speed *= mods.enemySpeed;
        }
        
        // 应用颜色标识
        if (diff.id !== 'normal') {
            enemy.difficultyTint = diff.color;
        }
    }
    
    /**
     * 应用Boss修正
     */
    applyBossModifiers(boss) {
        const diff = this.getCurrentDifficulty();
        if (!diff) return;
        
        const mods = diff.modifiers;
        
        if (mods.enemyHealth) {
            const multiplier = 1 + (mods.enemyHealth - 1) * 0.5; // Boss生命增长减半
            boss.maxHealth *= multiplier;
            boss.health = boss.maxHealth;
        }
        
        if (mods.enemyDamage) {
            boss.damage *= mods.enemyDamage;
        }
        
        // 噩梦及以上Boss获得额外技能
        if (diff.id === 'nightmare' || diff.id === 'impossible') {
            boss.enraged = true;
            boss.extraAbility = true;
        }
    }
    
    /**
     * 应用奖励修正
     */
    applyRewardModifiers(data) {
        const diff = this.getCurrentDifficulty();
        if (!diff) return;
        
        const mods = diff.modifiers;
        
        if (data.exp && mods.expGain) {
            data.exp = Math.floor(data.exp * mods.expGain);
        }
        
        if (data.gold && mods.goldGain) {
            data.gold = Math.floor(data.gold * mods.goldGain);
        }
        
        // 应用掉率修正
        if (data.dropRate) {
            if (mods.itemDropRate) {
                data.dropRate *= mods.itemDropRate;
            }
            if (mods.rareDropBonus && data.rarity === 'rare') {
                data.dropRate *= (1 + mods.rareDropBonus);
            }
            if (mods.legendaryDropBonus && data.rarity === 'legendary') {
                data.dropRate *= (1 + mods.legendaryDropBonus);
            }
        }
        
        // 应用分数倍率
        if (data.score) {
            data.score = Math.floor(data.score * diff.scoreMultiplier);
        }
    }
    
    /**
     * 检查是否应该生成精英怪
     */
    shouldSpawnElite() {
        const chance = this.getModifier('eliteChance');
        return Math.random() < chance;
    }
    
    /**
     * 检查是否应该生成小Boss
     */
    shouldSpawnMiniBoss() {
        const chance = this.getModifier('miniBossChance');
        return chance > 0 && Math.random() < chance;
    }
    
    /**
     * 是否是永久死亡模式
     */
    isPermadeath() {
        return this.getModifier('permadeath') === true;
    }
    
    /**
     * 获取复活次数
     */
    getReviveCount() {
        return this.getModifier('reviveCount') || 0;
    }
    
    /**
     * 通关处理
     */
    onGameCompleted(data) {
        const diffId = data.difficulty || this.currentDifficulty;
        
        // 记录通关次数
        const current = this.clearCounts.get(diffId) || 0;
        this.clearCounts.set(diffId, current + 1);
        
        // 检查难度解锁
        this.checkDifficultyUnlocks();
        
        // 保存数据
        this.saveData();
    }
    
    /**
     * 检查难度解锁
     */
    checkDifficultyUnlocks() {
        for (const [id, diff] of this.difficulties) {
            if (this.unlockedDifficulties.has(id)) continue;
            if (!diff.unlockRequirement) continue;
            
            const req = diff.unlockRequirement;
            const count = this.clearCounts.get(req.difficulty) || 0;
            
            if (count >= req.count) {
                this.unlockedDifficulties.add(id);
                
                this.world.emit('difficultyUnlocked', {
                    difficulty: diff
                });
                
                console.log(`🔓 难度解锁: ${diff.name}`);
            }
        }
    }
    
    // ===== 持久化 =====
    loadData() {
        try {
            const saved = localStorage.getItem('rougeCow_difficulty');
            if (saved) {
                const data = JSON.parse(saved);
                if (data.unlocked) {
                    data.unlocked.forEach(id => this.unlockedDifficulties.add(id));
                }
                if (data.clears) {
                    Object.entries(data.clears).forEach(([k, v]) => {
                        this.clearCounts.set(k, v);
                    });
                }
            }
        } catch (e) {
            console.warn('加载难度数据失败:', e);
        }
    }
    
    saveData() {
        try {
            const data = {
                unlocked: Array.from(this.unlockedDifficulties),
                clears: Object.fromEntries(this.clearCounts),
                timestamp: Date.now()
            };
            localStorage.setItem('rougeCow_difficulty', JSON.stringify(data));
        } catch (e) {
            console.warn('保存难度数据失败:', e);
        }
    }
    
    // ===== UI =====
    renderDifficultySelect(ctx, x, y, w, h, selectedId = null) {
        const difficulties = Array.from(this.difficulties.values());
        const itemH = 80;
        const spacing = 10;
        
        difficulties.forEach((diff, i) => {
            const itemY = y + i * (itemH + spacing);
            const isUnlocked = this.unlockedDifficulties.has(diff.id);
            const isSelected = (selectedId || this.currentDifficulty) === diff.id;
            
            // 背景
            if (isSelected) {
                ctx.fillStyle = diff.color;
                ctx.globalAlpha = 0.3;
                ctx.fillRect(x, itemY, w, itemH);
                ctx.globalAlpha = 1;
            }
            
            ctx.fillStyle = isUnlocked ? '#2c3e50' : '#1a1a1a';
            ctx.fillRect(x, itemY, w, itemH);
            
            // 边框
            ctx.strokeStyle = isSelected ? diff.color : (isUnlocked ? '#555' : '#333');
            ctx.lineWidth = isSelected ? 3 : 1;
            ctx.strokeRect(x, itemY, w, itemH);
            
            // 图标
            ctx.font = '36px Arial';
            ctx.textAlign = 'left';
            ctx.fillStyle = isUnlocked ? diff.color : '#555';
            ctx.fillText(isUnlocked ? diff.icon : '🔒', x + 15, itemY + 50);
            
            // 名称
            ctx.fillStyle = isUnlocked ? '#fff' : '#666';
            ctx.font = 'bold 18px Arial';
            ctx.fillText(isUnlocked ? diff.name : '???', x + 70, itemY + 30);
            
            // 描述
            ctx.fillStyle = isUnlocked ? '#aaa' : '#555';
            ctx.font = '12px Arial';
            ctx.fillText(isUnlocked ? diff.description : '未解锁', x + 70, itemY + 50);
            
            // 通关次数
            if (isUnlocked) {
                const clears = this.clearCounts.get(diff.id) || 0;
                ctx.fillStyle = '#f1c40f';
                ctx.font = '14px Arial';
                ctx.textAlign = 'right';
                ctx.fillText(`通关: ${clears}`, x + w - 15, itemY + 45);
            }
            
            // 解锁条件
            if (!isUnlocked && diff.unlockRequirement) {
                ctx.fillStyle = '#e74c3c';
                ctx.font = '11px Arial';
                ctx.textAlign = 'right';
                const reqDiff = this.difficulties.get(diff.unlockRequirement.difficulty);
                ctx.fillText(`需通关${reqDiff?.name || ''} ${diff.unlockRequirement.count}次`, x + w - 15, itemY + 65);
            }
            
            // 倍率
            if (isUnlocked) {
                ctx.fillStyle = '#2ecc71';
                ctx.font = '12px Arial';
                ctx.textAlign = 'left';
                ctx.fillText(`${diff.scoreMultiplier}x 分数`, x + 70, itemY + 68);
            }
        });
    }
    
    update(dt) {}
}

window.DifficultySystem = DifficultySystem;
