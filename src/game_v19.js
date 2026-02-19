// 肉鸽牛牛 v19.0 - 天赋树系统
// 多分支成长路线，技能树

// ========== 天赋树定义 ==========
const TALENT_TREES = {
    combat: {
        name: '战斗系',
        icon: '⚔️',
        tiers: [
            // 第一层
            [
                { id: 'combat_1_1', name: '强力攻击', desc: '伤害+10%', effect: { damage: 0.1 }, maxPoints: 5 },
                { id: 'combat_1_2', name: '攻速提升', desc: '攻击速度+10%', effect: { attackSpeed: -0.1 }, maxPoints: 5 },
                { id: 'combat_1_3', name: '暴击训练', desc: '暴击率+5%', effect: { critChance: 0.05 }, maxPoints: 5 }
            ],
            // 第二层
            [
                { id: 'combat_2_1', name: '穿透射击', desc: '子弹穿透+1', effect: { pierce: 1 }, requires: ['combat_1_1'], maxPoints: 3 },
                { id: 'combat_2_2', name: '双重射击', desc: '20%几率发射2颗子弹', effect: { doubleShot: 0.2 }, requires: ['combat_1_2'], maxPoints: 3 },
                { id: 'combat_2_3', name: '致命一击', desc: '暴击伤害+50%', effect: { critDamage: 0.5 }, requires: ['combat_1_3'], maxPoints: 3 }
            ],
            // 第三层（终极天赋）
            [
                { id: 'combat_3_1', name: '毁灭者', desc: '伤害+50%，体型+20%', effect: { damage: 0.5, size: 0.2 }, requires: ['combat_2_1', 'combat_2_2'], maxPoints: 1 }
            ]
        ]
    },
    
    defense: {
        name: '防御系',
        icon: '🛡️',
        tiers: [
            [
                { id: 'def_1_1', name: '生命强化', desc: '最大生命+1', effect: { maxHp: 1 }, maxPoints: 5 },
                { id: 'def_1_2', name: '坚韧', desc: '护甲+1', effect: { armor: 1 }, maxPoints: 5 },
                { id: 'def_1_3', name: '恢复', desc: '每秒回复0.1生命', effect: { regen: 0.1 }, maxPoints: 5 }
            ],
            [
                { id: 'def_2_1', name: '铁壁', desc: '受伤-20%', effect: { damageReduction: 0.2 }, requires: ['def_1_1'], maxPoints: 3 },
                { id: 'def_2_2', name: '荆棘', desc: '反弹30%伤害', effect: { thorns: 0.3 }, requires: ['def_1_2'], maxPoints: 3 },
                { id: 'def_2_3', name: '急救', desc: '低血时回血+50%', effect: { emergencyHeal: 0.5 }, requires: ['def_1_3'], maxPoints: 3 }
            ],
            [
                { id: 'def_3_1', name: '不朽之身', desc: '死亡时复活一次', effect: { revive: 1 }, requires: ['def_2_1', 'def_2_2'], maxPoints: 1 }
            ]
        ]
    },
    
    utility: {
        name: '辅助系',
        icon: '✨',
        tiers: [
            [
                { id: 'util_1_1', name: '速度提升', desc: '移动速度+10%', effect: { speed: 0.1 }, maxPoints: 5 },
                { id: 'util_1_2', name: '拾取范围', desc: '经验拾取范围+30%', effect: { magnetRange: 0.3 }, maxPoints: 5 },
                { id: 'util_1_3', name: '幸运', desc: '掉落率+10%', effect: { luck: 0.1 }, maxPoints: 5 }
            ],
            [
                { id: 'util_2_1', name: '闪避', desc: '15%几率闪避攻击', effect: { dodge: 0.15 }, requires: ['util_1_1'], maxPoints: 3 },
                { id: 'util_2_2', name: '经验加成', desc: '经验获取+20%', effect: { expBonus: 0.2 }, requires: ['util_1_2'], maxPoints: 3 },
                { id: 'util_2_3', name: '商人', desc: '商店折扣20%', effect: { shopDiscount: 0.2 }, requires: ['util_1_3'], maxPoints: 3 }
            ],
            [
                { id: 'util_3_1', name: '时间行者', desc: '技能冷却-50%', effect: { cooldownReduction: 0.5 }, requires: ['util_2_1', 'util_2_2'], maxPoints: 1 }
            ]
        ]
    }
};

// ========== 天赋管理器 ==========
class TalentManager {
    constructor(player) {
        this.player = player;
        this.talentPoints = 0;
        this.spentPoints = 0;
        this.acquired = new Set(); // 已获得的天赋
        this.pointsInTalent = {}; // 每个天赋投入的点数
    }
    
    // 获得天赋点（升级时）
    addTalentPoints(points) {
        this.talentPoints += points;
    }
    
    // 检查是否可以学习天赋
    canLearn(talentId) {
        if (this.talentPoints <= 0) return false;
        
        const talent = this.findTalent(talentId);
        if (!talent) return false;
        
        // 检查是否已达到最大点数
        const currentPoints = this.pointsInTalent[talentId] || 0;
        if (currentPoints >= talent.maxPoints) return false;
        
        // 检查前置条件
        if (talent.requires) {
            for (let req of talent.requires) {
                const reqPoints = this.pointsInTalent[req] || 0;
                const reqTalent = this.findTalent(req);
                if (reqPoints < (reqTalent?.maxPoints || 1)) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    // 学习天赋
    learn(talentId) {
        if (!this.canLearn(talentId)) return false;
        
        const talent = this.findTalent(talentId);
        if (!talent) return false;
        
        // 投入点数
        this.pointsInTalent[talentId] = (this.pointsInTalent[talentId] || 0) + 1;
        this.talentPoints--;
        this.spentPoints++;
        this.acquired.add(talentId);
        
        // 应用效果
        this.applyTalentEffect(talent);
        
        return true;
    }
    
    // 查找天赋
    findTalent(talentId) {
        for (let tree of Object.values(TALENT_TREES)) {
            for (let tier of tree.tiers) {
                for (let talent of tier) {
                    if (talent.id === talentId) return talent;
                }
            }
        }
        return null;
    }
    
    // 应用天赋效果
    applyTalentEffect(talent) {
        if (!talent.effect) return;
        
        for (let [stat, value] of Object.entries(talent.effect)) {
            if (this.player[stat] !== undefined) {
                // 如果是数值，累加；如果是百分比，特殊处理
                if (stat === 'damage' || stat === 'speed' || stat.includes('Bonus') || stat.includes('Chance')) {
                    this.player[stat] = (this.player[stat] || 0) + value;
                } else {
                    this.player[stat] += value;
                }
            } else {
                this.player[stat] = value;
            }
        }
    }
    
    // 重置天赋（付费或特定条件）
    reset() {
        this.talentPoints = this.spentPoints;
        this.spentPoints = 0;
        this.acquired.clear();
        this.pointsInTalent = {};
        
        // 重新计算玩家属性（简化：直接重置到基础值）
        // 实际应该记录基础值然后重新应用所有天赋
    }
    
    // 获取天赋树状态（用于UI）
    getTreeState() {
        const state = {};
        for (let [treeKey, tree] of Object.entries(TALENT_TREES)) {
            state[treeKey] = {
                ...tree,
                tiers: tree.tiers.map(tier => 
                    tier.map(talent => ({
                        ...talent,
                        acquired: this.pointsInTalent[talent.id] || 0,
                        canLearn: this.canLearn(talent.id),
                        isMaxed: (this.pointsInTalent[talent.id] || 0) >= talent.maxPoints
                    }))
                )
            };
        }
        return state;
    }
    
    // 获取总属性加成（用于显示）
    getTotalBonuses() {
        const bonuses = {};
        for (let talentId of this.acquired) {
            const talent = this.findTalent(talentId);
            if (talent && talent.effect) {
                for (let [stat, value] of Object.entries(talent.effect)) {
                    const points = this.pointsInTalent[talentId] || 1;
                    bonuses[stat] = (bonuses[stat] || 0) + (value * points);
                }
            }
        }
        return bonuses;
    }
}

// ========== 天赋树UI ==========
class TalentTreeUI {
    constructor(talentManager) {
        this.tm = talentManager;
        this.visible = false;
        this.currentTree = 'combat';
    }
    
    draw(ctx) {
        if (!this.visible) return;
        
        const x = 50;
        const y = 50;
        const w = GAME_WIDTH - 100;
        const h = GAME_HEIGHT - 100;
        
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#F1C40F';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, w, h);
        
        // 标题
        ctx.fillStyle = '#F1C40F';
        ctx.font = 'bold 32px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('TALENT TREES', x + w / 2, y + 50);
        
        // 剩余点数
        ctx.fillStyle = '#FFF';
        ctx.font = '24px monospace';
        ctx.fillText(`Points: ${this.tm.talentPoints}`, x + w / 2, y + 90);
        
        // 树选择标签
        const trees = Object.keys(TALENT_TREES);
        const tabWidth = w / trees.length;
        
        for (let i = 0; i < trees.length; i++) {
            const treeKey = trees[i];
            const tree = TALENT_TREES[treeKey];
            const isActive = treeKey === this.currentTree;
            
            ctx.fillStyle = isActive ? '#3498DB' : '#2C3E50';
            ctx.fillRect(x + i * tabWidth, y + 110, tabWidth - 10, 50);
            
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 20px monospace';
            ctx.fillText(`${tree.icon} ${tree.name}`, x + i * tabWidth + tabWidth / 2, y + 145);
        }
        
        // 绘制当前树
        this.drawTree(ctx, x + 50, y + 180, w - 100, h - 230);
    }
    
    drawTree(ctx, x, y, w, h) {
        const tree = TALENT_TREES[this.currentTree];
        const tierHeight = h / tree.tiers.length;
        
        for (let tierIdx = 0; tierIdx < tree.tiers.length; tierIdx++) {
            const tier = tree.tiers[tierIdx];
            const ty = y + tierIdx * tierHeight + tierHeight / 2;
            const nodeWidth = w / tier.length;
            
            for (let nodeIdx = 0; nodeIdx < tier.length; nodeIdx++) {
                const talent = tier[nodeIdx];
                const tx = x + nodeIdx * nodeWidth + nodeWidth / 2;
                
                const points = this.tm.pointsInTalent[talent.id] || 0;
                const isMaxed = points >= talent.maxPoints;
                const canLearn = this.tm.canLearn(talent.id);
                
                // 节点背景
                if (isMaxed) {
                    ctx.fillStyle = '#F1C40F'; // 金色完成
                } else if (points > 0) {
                    ctx.fillStyle = '#27AE60'; // 绿色部分完成
                } else if (canLearn) {
                    ctx.fillStyle = '#3498DB'; // 蓝色可学
                } else {
                    ctx.fillStyle = '#555'; // 灰色锁定
                }
                
                ctx.beginPath();
                ctx.arc(tx, ty, 40, 0, Math.PI * 2);
                ctx.fill();
                
                // 边框
                ctx.strokeStyle = '#FFF';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // 名称
                ctx.fillStyle = '#FFF';
                ctx.font = '12px monospace';
                ctx.textAlign = 'center';
                ctx.fillText(talent.name, tx, ty - 10);
                
                // 点数
                ctx.font = 'bold 16px monospace';
                ctx.fillText(`${points}/${talent.maxPoints}`, tx, ty + 15);
            }
        }
    }
    
    handleClick(mx, my) {
        // 处理树切换
        // 处理天赋点击
    }
}

console.log('Talent tree system loaded');
console.log('3 trees, 3 tiers each, ultimate talents');
