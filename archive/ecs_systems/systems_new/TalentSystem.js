/**
 * TalentSystem - 天赋系统
 * 三系天赋树，可升级，可重置
 */

class TalentSystem {
    constructor(world) {
        this.world = world;
        this.priority = 47;
        this.enabled = true;
        
        // 天赋树
        this.talentTrees = {
            power: [],    // 力量系
            agility: [],  // 敏捷系
            wisdom: []    // 智力系
        };
        
        // 玩家天赋数据
        this.playerTalents = new Map(); // playerId -> { allocated, points }
        
        this.isUIOpen = false;
        this.currentTree = 'power';
        
        this.initTalentTrees();
    }
    
    init() {
        // 监听升级
        this.world.on('levelUp', (data) => {
            this.onPlayerLevelUp(data.player, data.level);
        });
        
        // 监听按键
        this.world.on('keyPressed', (key) => {
            if (key === 't' || key === 'T') {
                this.toggleUI();
            }
        });
    }
    
    /**
     * 初始化天赋树
     */
    initTalentTrees() {
        // ===== 力量系 =====
        this.talentTrees.power = [
            // 第一层
            {
                id: 'power_1_1',
                name: '力量强化',
                description: '攻击力+10%',
                tier: 1,
                maxRank: 5,
                effect: { damageMultiplier: 0.1 },
                icon: '💪',
                requires: null
            },
            {
                id: 'power_1_2',
                name: '生命强化',
                description: '最大生命值+15%',
                tier: 1,
                maxRank: 5,
                effect: { healthMultiplier: 0.15 },
                icon: '❤️',
                requires: null
            },
            // 第二层
            {
                id: 'power_2_1',
                name: '暴击精通',
                description: '暴击率+3%',
                tier: 2,
                maxRank: 5,
                effect: { criticalChance: 0.03 },
                icon: '💥',
                requires: 'power_1_1'
            },
            {
                id: 'power_2_2',
                name: '暴伤强化',
                description: '暴击伤害+20%',
                tier: 2,
                maxRank: 5,
                effect: { criticalDamage: 0.2 },
                icon: '🔥',
                requires: 'power_1_1'
            },
            // 第三层
            {
                id: 'power_3_1',
                name: '吸血',
                description: '造成伤害的5%转化为生命',
                tier: 3,
                maxRank: 3,
                effect: { lifeSteal: 0.05 },
                icon: '🩸',
                requires: 'power_2_1'
            },
            {
                id: 'power_3_2',
                name: '斩杀',
                description: '对低于20%生命的敌人伤害+50%',
                tier: 3,
                maxRank: 3,
                effect: { executionerBonus: 0.5 },
                icon: '⚔️',
                requires: 'power_2_2'
            },
            // 终极天赋
            {
                id: 'power_ultimate',
                name: '战神之怒',
                description: '生命低于30%时伤害+100%',
                tier: 4,
                maxRank: 1,
                effect: { berserkDamage: 1.0 },
                icon: '👑',
                requires: ['power_3_1', 'power_3_2']
            }
        ];
        
        // ===== 敏捷系 =====
        this.talentTrees.agility = [
            // 第一层
            {
                id: 'agi_1_1',
                name: '速度强化',
                description: '移动速度+8%',
                tier: 1,
                maxRank: 5,
                effect: { speedMultiplier: 0.08 },
                icon: '⚡',
                requires: null
            },
            {
                id: 'agi_1_2',
                name: '攻速强化',
                description: '攻击速度+10%',
                tier: 1,
                maxRank: 5,
                effect: { attackSpeedMultiplier: 0.1 },
                icon: '💨',
                requires: null
            },
            // 第二层
            {
                id: 'agi_2_1',
                name: '闪避',
                description: '闪避率+5%',
                tier: 2,
                maxRank: 5,
                effect: { dodgeChance: 0.05 },
                icon: '💫',
                requires: 'agi_1_1'
            },
            {
                id: 'agi_2_2',
                name: '冲刺强化',
                description: '冲刺距离+25%，冷却-20%',
                tier: 2,
                maxRank: 3,
                effect: { dashDistance: 0.25, dashCooldown: -0.2 },
                icon: '🏃',
                requires: 'agi_1_1'
            },
            // 第三层
            {
                id: 'agi_3_1',
                name: '连击',
                description: '连续命中同一敌人时，每层+5%伤害',
                tier: 3,
                maxRank: 3,
                effect: { comboBonus: 0.05 },
                icon: '🎯',
                requires: 'agi_2_1'
            },
            {
                id: 'agi_3_2',
                name: '时间扭曲',
                description: '击杀敌人时时间减缓50%持续1秒',
                tier: 3,
                maxRank: 3,
                effect: { timeWarpDuration: 1 },
                icon: '⏱️',
                requires: 'agi_2_2'
            },
            // 终极天赋
            {
                id: 'agi_ultimate',
                name: '时间行者',
                description: '所有技能冷却-40%，持续5秒（冷却60秒）',
                tier: 4,
                maxRank: 1,
                effect: { cooldownReduction: 0.4 },
                icon: '⌛',
                requires: ['agi_3_1', 'agi_3_2']
            }
        ];
        
        // ===== 智力系 =====
        this.talentTrees.wisdom = [
            // 第一层
            {
                id: 'wis_1_1',
                name: '智慧',
                description: '经验获取+15%',
                tier: 1,
                maxRank: 5,
                effect: { expMultiplier: 0.15 },
                icon: '📖',
                requires: null
            },
            {
                id: 'wis_1_2',
                name: '法力回复',
                description: '技能冷却-10%',
                tier: 1,
                maxRank: 5,
                effect: { cooldownReduction: 0.1 },
                icon: '🔮',
                requires: null
            },
            // 第二层
            {
                id: 'wis_2_1',
                name: '元素亲和',
                description: '元素伤害+20%',
                tier: 2,
                maxRank: 5,
                effect: { elementalDamage: 0.2 },
                icon: '🔥',
                requires: 'wis_1_1'
            },
            {
                id: 'wis_2_2',
                name: '范围强化',
                description: '技能范围+25%',
                tier: 2,
                maxRank: 3,
                effect: { areaMultiplier: 0.25 },
                icon: '💠',
                requires: 'wis_1_2'
            },
            // 第三层
            {
                id: 'wis_3_1',
                name: '召唤精通',
                description: '召唤物伤害+50%，生命+50%',
                tier: 3,
                maxRank: 3,
                effect: { minionDamage: 0.5, minionHealth: 0.5 },
                icon: '👥',
                requires: 'wis_2_1'
            },
            {
                id: 'wis_3_2',
                name: '超载',
                description: '技能伤害+50%，但消耗双倍资源',
                tier: 3,
                maxRank: 3,
                effect: { overchargeDamage: 0.5 },
                icon: '⚡',
                requires: 'wis_2_2'
            },
            // 终极天赋
            {
                id: 'wis_ultimate',
                name: '大法师',
                description: '所有技能效果+100%',
                tier: 4,
                maxRank: 1,
                effect: { spellPower: 1.0 },
                icon: '🌟',
                requires: ['wis_3_1', 'wis_3_2']
            }
        ];
    }
    
    onPlayerLevelUp(player, level) {
        const data = this.getPlayerData(player);
        data.points++;
        
        this.world.emit('talentPointsGained', {
            player,
            points: data.points,
            totalGained: level
        });
    }
    
    getPlayerData(player) {
        if (!this.playerTalents.has(player.id)) {
            this.playerTalents.set(player.id, {
                allocated: new Map(), // talentId -> rank
                points: 0,
                presets: []
            });
        }
        return this.playerTalents.get(player.id);
    }
    
    allocateTalent(player, talentId) {
        const data = this.getPlayerData(player);
        const tree = this.talentTrees[this.currentTree];
        const talent = tree.find(t => t.id === talentId);
        
        if (!talent) return false;
        if (data.points <= 0) return false;
        
        const currentRank = data.allocated.get(talentId) || 0;
        if (currentRank >= talent.maxRank) return false;
        
        // 检查前置条件
        if (!this.checkPrerequisites(data, talent)) return false;
        
        // 分配
        data.allocated.set(talentId, currentRank + 1);
        data.points--;
        
        // 应用效果
        this.applyTalentEffect(player, talent);
        
        this.world.emit('talentAllocated', {
            player,
            talent,
            rank: currentRank + 1
        });
        
        return true;
    }
    
    checkPrerequisites(data, talent) {
        if (!talent.requires) return true;
        
        const requires = Array.isArray(talent.requires) ? talent.requires : [talent.requires];
        
        return requires.every(reqId => {
            const reqRank = data.allocated.get(reqId) || 0;
            return reqRank > 0;
        });
    }
    
    applyTalentEffect(player, talent) {
        const effect = talent.effect;
        if (!effect) return;
        
        // 应用各种效果
        if (effect.damageMultiplier) {
            const weapon = player.get(WeaponComponent);
            if (weapon) weapon.damage *= (1 + effect.damageMultiplier);
        }
        
        if (effect.healthMultiplier) {
            const health = player.get(HealthComponent);
            if (health) {
                const bonus = health.maxHealth * effect.healthMultiplier;
                health.maxHealth += bonus;
                health.currentHealth += bonus;
            }
        }
        
        if (effect.speedMultiplier) {
            const movement = player.get(MovementComponent);
            if (movement) movement.speed *= (1 + effect.speedMultiplier);
        }
        
        if (effect.criticalChance) {
            const weapon = player.get(WeaponComponent);
            if (weapon) weapon.criticalChance += effect.criticalChance;
        }
        
        if (effect.criticalDamage) {
            const weapon = player.get(WeaponComponent);
            if (weapon) weapon.criticalDamage += effect.criticalDamage;
        }
        
        if (effect.lifeSteal) {
            const weapon = player.get(WeaponComponent);
            if (weapon) weapon.lifeSteal += effect.lifeSteal;
        }
        
        if (effect.cooldownReduction) {
            const combat = player.get(CombatComponent);
            if (combat) combat.cooldownReduction = (combat.cooldownReduction || 0) + effect.cooldownReduction;
        }
        
        if (effect.expMultiplier) {
            const playerComp = player.get(PlayerComponent);
            if (playerComp) playerComp.expMultiplier = (playerComp.expMultiplier || 1) * (1 + effect.expMultiplier);
        }
    }
    
    resetTalents(player) {
        const data = this.getPlayerData(player);
        
        // 计算已分配点数
        let allocatedPoints = 0;
        for (const [talentId, rank] of data.allocated) {
            allocatedPoints += rank;
        }
        
        // 返还点数
        data.points += allocatedPoints;
        data.allocated.clear();
        
        // 重新计算所有属性
        this.recalculatePlayerStats(player);
        
        this.world.emit('talentsReset', { player, pointsReturned: allocatedPoints });
        
        return allocatedPoints;
    }
    
    recalculatePlayerStats(player) {
        // 重置到基础状态，然后重新应用所有天赋
        // 简化处理：实际游戏中需要保存基础值
    }
    
    savePreset(player, name) {
        const data = this.getPlayerData(player);
        const preset = {
            name,
            talents: Array.from(data.allocated.entries())
        };
        data.presets.push(preset);
    }
    
    loadPreset(player, presetIndex) {
        const data = this.getPlayerData(player);
        const preset = data.presets[presetIndex];
        if (!preset) return false;
        
        // 重置并加载
        this.resetTalents(player);
        
        for (const [talentId, rank] of preset.talents) {
            for (let i = 0; i < rank; i++) {
                this.allocateTalent(player, talentId);
            }
        }
        
        return true;
    }
    
    toggleUI() {
        this.isUIOpen = !this.isUIOpen;
        if (this.isUIOpen) {
            this.world.emit('gamePaused');
        } else {
            this.world.emit('gameResumed');
        }
    }
    
    switchTree(tree) {
        this.currentTree = tree;
    }
    
    render(ctx) {
        if (!this.isUIOpen) return;
        
        const canvas = ctx.canvas;
        const w = canvas.width;
        const h = canvas.height;
        
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, w, h);
        
        // 窗口
        const winW = 900;
        const winH = 700;
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
        ctx.fillText('🌟 天赋', w / 2, winY + 40);
        
        // 天赋点显示
        const player = this.getPlayer();
        const data = player ? this.getPlayerData(player) : null;
        const points = data ? data.points : 0;
        
        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 24px Arial';
        ctx.fillText(`天赋点: ${points}`, w / 2, winY + 75);
        
        // 标签页
        this.renderTreeTabs(ctx, winX, winY + 90, winW);
        
        // 天赋树
        this.renderTalentTree(ctx, winX + 50, winY + 140, winW - 100, winH - 200);
        
        // 按钮
        this.renderButtons(ctx, winX + winW / 2, winY + winH - 50);
        
        // 关闭提示
        ctx.fillStyle = '#888';
        ctx.font = '14px Arial';
        ctx.fillText('按 [T] 关闭', w / 2, winY + winH - 15);
    }
    
    renderTreeTabs(ctx, x, y, w) {
        const tabs = [
            { id: 'power', name: '力量', color: '#e74c3c' },
            { id: 'agility', name: '敏捷', color: '#2ecc71' },
            { id: 'wisdom', name: '智力', color: '#3498db' }
        ];
        
        const tabW = 150;
        const startX = x + (w - tabs.length * tabW) / 2;
        
        tabs.forEach((tab, i) => {
            const tabX = startX + i * tabW;
            const isActive = this.currentTree === tab.id;
            
            ctx.fillStyle = isActive ? tab.color : '#2c3e50';
            ctx.fillRect(tabX, y, tabW - 10, 40);
            
            ctx.strokeStyle = isActive ? '#fff' : '#555';
            ctx.lineWidth = isActive ? 2 : 1;
            ctx.strokeRect(tabX, y, tabW - 10, 40);
            
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(tab.name, tabX + (tabW - 10) / 2, y + 25);
        });
    }
    
    renderTalentTree(ctx, x, y, w, h) {
        const tree = this.talentTrees[this.currentTree];
        const player = this.getPlayer();
        const data = player ? this.getPlayerData(player) : null;
        
        // 按层级分组
        const tiers = [[], [], [], []];
        tree.forEach(t => tiers[t.tier - 1].push(t));
        
        const tierHeight = h / 4;
        
        tiers.forEach((tier, tierIndex) => {
            const tierY = y + tierIndex * tierHeight;
            const itemW = w / tier.length;
            
            tier.forEach((talent, i) => {
                const talentX = x + i * itemW + itemW / 2;
                const talentY = tierY + tierHeight / 2;
                
                this.renderTalentNode(ctx, talentX, talentY, talent, data);
            });
        });
    }
    
    renderTalentNode(ctx, x, y, talent, data) {
        const rank = data ? (data.allocated.get(talent.id) || 0) : 0;
        const maxed = rank >= talent.maxRank;
        const canAllocate = data && data.points > 0 && this.checkPrerequisites(data, talent);
        
        // 连接线
        if (talent.requires) {
            // 简化：不画连接线
        }
        
        // 节点圆圈
        const radius = 30;
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.fillStyle = maxed ? '#f1c40f' : (rank > 0 ? '#3498db' : '#2c3e50');
        ctx.fill();
        
        ctx.strokeStyle = canAllocate ? '#2ecc71' : '#555';
        ctx.lineWidth = rank > 0 ? 3 : 1;
        ctx.stroke();
        
        // 图标
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = rank > 0 ? '#fff' : '#888';
        ctx.fillText(talent.icon, x, y + 5);
        
        // 等级
        ctx.font = '12px Arial';
        ctx.fillStyle = '#fff';
        ctx.fillText(`${rank}/${talent.maxRank}`, x, y + radius + 15);
        
        // 名字
        ctx.font = 'bold 12px Arial';
        ctx.fillStyle = rank > 0 ? '#fff' : '#aaa';
        ctx.fillText(talent.name, x, y + radius + 30);
    }
    
    renderButtons(ctx, centerX, y) {
        // 重置按钮
        const btnW = 120;
        const btnH = 35;
        const resetX = centerX - 150;
        
        ctx.fillStyle = '#e74c3c';
        ctx.fillRect(resetX - btnW / 2, y - btnH / 2, btnW, btnH);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(resetX - btnW / 2, y - btnH / 2, btnW, btnH);
        
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🔄 重置', resetX, y + 5);
        
        // 保存预设
        const saveX = centerX + 150;
        ctx.fillStyle = '#27ae60';
        ctx.fillRect(saveX - btnW / 2, y - btnH / 2, btnW, btnH);
        ctx.strokeRect(saveX - btnW / 2, y - btnH / 2, btnW, btnH);
        ctx.fillStyle = '#fff';
        ctx.fillText('💾 保存', saveX, y + 5);
    }
    
    getPlayer() {
        const players = this.world.getEntitiesWithTag('player');
        return players.length > 0 ? players[0] : null;
    }
    
    update(dt) {}
}

window.TalentSystem = TalentSystem;
