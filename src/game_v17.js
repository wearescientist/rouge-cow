// 肉鸽牛牛 v17.0 - 剧情/任务系统
// 主线剧情，支线任务，目标导向

// ========== 剧情章节 ==========
const STORY_CHAPTERS = {
    prologue: {
        id: 'prologue',
        title: '序章：失落的牧场',
        desc: '小奶牛哞哞回到家，发现牧场被寄生怪物入侵，父母失踪...',
        objectives: [
            { text: '击败10个敌人', type: 'kill', target: 10, completed: false },
            { text: '存活2分钟', type: 'survive', target: 120, completed: false }
        ],
        reward: { milkCoins: 50, unlock: 'chapter1' },
        nextChapter: 'chapter1'
    },
    
    chapter1: {
        id: 'chapter1',
        title: '第一章：地底探险',
        desc: '追寻踪迹，哞哞发现了一个通往地底的洞穴...',
        objectives: [
            { text: '到达第5波', type: 'wave', target: 5, completed: false },
            { text: '击败第一个Boss', type: 'boss', target: 1, completed: false },
            { text: '收集5个道具', type: 'collect', target: 5, completed: false }
        ],
        reward: { milkCoins: 100, unlock: 'character_sheep' },
        nextChapter: 'chapter2'
    },
    
    chapter2: {
        id: 'chapter2',
        title: '第二章：寄生源头',
        desc: '深入洞穴，发现寄生怪物来自一个古老实验室...',
        objectives: [
            { text: '无伤击败Boss', type: 'flawless_boss', target: 1, completed: false },
            { text: '达到15级', type: 'level', target: 15, completed: false },
            { text: '存活10分钟', type: 'survive', target: 600, completed: false }
        ],
        reward: { milkCoins: 200, unlock: 'weapon_void' },
        nextChapter: 'chapter3'
    },
    
    chapter3: {
        id: 'chapter3',
        title: '第三章：母体之战',
        desc: '最终的决战，面对寄生母体，拯救父母！',
        objectives: [
            { text: '击败最终Boss', type: 'final_boss', target: 1, completed: false },
            { text: '达到第30波', type: 'wave', target: 30, completed: false }
        ],
        reward: { milkCoins: 500, unlock: 'ending_true' },
        nextChapter: null
    }
};

// ========== 支线任务 ==========
const SIDE_QUESTS = {
    collector: {
        id: 'collector',
        name: '收藏家',
        desc: '在一局游戏中收集所有类型的道具',
        type: 'collect_all_items',
        reward: { milkCoins: 100, item: 'rare_crate' }
    },
    
    pacifist: {
        id: 'pacifist',
        name: '和平主义者',
        desc: '无伤存活5分钟',
        type: 'no_hit_time',
        target: 300,
        reward: { milkCoins: 150, item: 'shield_permanent' }
    },
    
    weaponMaster: {
        id: 'weaponMaster',
        name: '武器大师',
        desc: '在一局中使用所有6种武器各击杀至少10个敌人',
        type: 'weapon_variety',
        target: { kills: 10, weapons: 6 },
        reward: { milkCoins: 200, item: 'ultimate_weapon' }
    },
    
    speedrunner: {
        id: 'speedrunner',
        name: '极速通关',
        desc: '在10分钟内击败第10波的Boss',
        type: 'speed_run',
        target: { time: 600, wave: 10 },
        reward: { milkCoins: 300, title: 'speed_demon' }
    },
    
    richCow: {
        id: 'richCow',
        name: '土豪牛',
        desc: '在一局中获得500金币',
        type: 'collect_coins',
        target: 500,
        reward: { milkCoins: 100, item: 'money_bag' }
    },
    
    survivor: {
        id: 'survivor',
        name: '生存专家',
        desc: '单局击败1000个敌人',
        type: 'kill_count',
        target: 1000,
        reward: { milkCoins: 400, skin: 'battle_scarred' }
    }
};

// ========== 任务管理器 ==========
class QuestManager {
    constructor(saveSystem) {
        this.save = saveSystem;
        this.currentChapter = this.save.data.currentChapter || 'prologue';
        this.completedChapters = new Set(this.save.data.completedChapters || []);
        this.activeQuests = [];
        this.completedQuests = new Set(this.save.data.completedQuests || []);
        this.currentRunProgress = {};
        
        this.initSideQuests();
    }
    
    initSideQuests() {
        // 随机选择2-3个支线任务
        const available = Object.keys(SIDE_QUESTS).filter(q => !this.completedQuests.has(q));
        this.activeQuests = available.slice(0, 3).map(id => ({
            ...SIDE_QUESTS[id],
            progress: 0,
            completed: false
        }));
    }
    
    // 开始新一局时重置进度
    startNewRun() {
        this.currentRunProgress = {
            kills: 0,
            items: new Set(),
            weapons: {},
            coins: 0,
            noHitTime: 0,
            bossesKilled: 0,
            flawlessBosses: 0
        };
    }
    
    // 更新任务进度
    update(event, data) {
        // 主线任务
        const chapter = STORY_CHAPTERS[this.currentChapter];
        if (chapter && !this.completedChapters.has(this.currentChapter)) {
            for (let obj of chapter.objectives) {
                if (obj.completed) continue;
                
                switch(obj.type) {
                    case 'kill':
                        if (event === 'kill') {
                            obj.progress = (obj.progress || 0) + 1;
                            if (obj.progress >= obj.target) obj.completed = true;
                        }
                        break;
                    case 'survive':
                        if (event === 'time' && data.time >= obj.target) {
                            obj.completed = true;
                        }
                        break;
                    case 'wave':
                        if (event === 'wave' && data.wave >= obj.target) {
                            obj.completed = true;
                        }
                        break;
                    case 'boss':
                        if (event === 'boss_kill') {
                            obj.completed = true;
                        }
                        break;
                    case 'collect':
                        if (event === 'item_collect') {
                            obj.progress = (obj.progress || 0) + 1;
                            if (obj.progress >= obj.target) obj.completed = true;
                        }
                        break;
                }
            }
            
            // 检查章节完成
            if (chapter.objectives.every(o => o.completed)) {
                this.completeChapter(this.currentChapter);
            }
        }
        
        // 支线任务
        for (let quest of this.activeQuests) {
            if (quest.completed) continue;
            
            switch(quest.type) {
                case 'collect_all_items':
                    if (event === 'item_collect') {
                        this.currentRunProgress.items.add(data.itemId);
                        if (this.currentRunProgress.items.size >= 6) {
                            quest.completed = true;
                        }
                    }
                    break;
                    
                case 'no_hit_time':
                    if (event === 'time' && !data.wasHit) {
                        this.currentRunProgress.noHitTime = data.time;
                        if (this.currentRunProgress.noHitTime >= quest.target) {
                            quest.completed = true;
                        }
                    }
                    break;
                    
                case 'weapon_variety':
                    if (event === 'weapon_kill') {
                        this.currentRunProgress.weapons[data.weapon] = 
                            (this.currentRunProgress.weapons[data.weapon] || 0) + 1;
                        const weaponsWithEnough = Object.values(this.currentRunProgress.weapons)
                            .filter(c => c >= quest.target.kills).length;
                        if (weaponsWithEnough >= quest.target.weapons) {
                            quest.completed = true;
                        }
                    }
                    break;
                    
                case 'speed_run':
                    if (event === 'wave_reached' && data.wave >= quest.target.wave) {
                        if (data.time <= quest.target.time) {
                            quest.completed = true;
                        }
                    }
                    break;
                    
                case 'collect_coins':
                    if (event === 'coin_collect') {
                        this.currentRunProgress.coins += data.amount;
                        if (this.currentRunProgress.coins >= quest.target) {
                            quest.completed = true;
                        }
                    }
                    break;
                    
                case 'kill_count':
                    if (event === 'kill') {
                        this.currentRunProgress.kills++;
                        if (this.currentRunProgress.kills >= quest.target) {
                            quest.completed = true;
                        }
                    }
                    break;
            }
            
            if (quest.completed) {
                this.completeQuest(quest);
            }
        }
    }
    
    completeChapter(chapterId) {
        const chapter = STORY_CHAPTERS[chapterId];
        if (!chapter) return;
        
        this.completedChapters.add(chapterId);
        this.save.data.completedChapters = Array.from(this.completedChapters);
        
        // 发放奖励
        if (chapter.reward.milkCoins) {
            this.save.addMilkCoins(chapter.reward.milkCoins);
        }
        if (chapter.reward.unlock) {
            this.save.data.unlocked[chapter.reward.unlock] = true;
        }
        
        // 推进到下一章
        if (chapter.nextChapter) {
            this.currentChapter = chapter.nextChapter;
            this.save.data.currentChapter = this.currentChapter;
        }
        
        this.save.save();
        
        // 显示完成
        console.log(`章节完成: ${chapter.title}`);
        // 可以触发剧情动画
    }
    
    completeQuest(quest) {
        this.completedQuests.add(quest.id);
        this.save.data.completedQuests = Array.from(this.completedQuests);
        
        // 发放奖励
        if (quest.reward.milkCoins) {
            this.save.addMilkCoins(quest.reward.milkCoins);
        }
        
        this.save.save();
        console.log(`任务完成: ${quest.name}`);
    }
    
    // 获取当前任务列表用于UI显示
    getQuestList() {
        const chapter = STORY_CHAPTERS[this.currentChapter];
        return {
            chapter: chapter ? {
                title: chapter.title,
                desc: chapter.desc,
                objectives: chapter.objectives
            } : null,
            sideQuests: this.activeQuests
        };
    }
}

// ========== 剧情对话框 ==========
class StoryDialog {
    constructor() {
        this.queue = [];
        this.current = null;
    }
    
    show(chapterId, onComplete) {
        const chapter = STORY_CHAPTERS[chapterId];
        if (!chapter) return;
        
        this.current = { ...chapter, onComplete };
        this.render();
    }
    
    render() {
        const div = document.createElement('div');
        div.id = 'storyDialog';
        div.innerHTML = `
            <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:2000;display:flex;flex-direction:column;justify-content:center;align-items:center;color:white;padding:40px;">
                <h1 style="color:#f1c40f;margin-bottom:20px;">${this.current.title}</h1>
                <div style="max-width:600px;font-size:20px;line-height:1.6;margin-bottom:40px;">
                    ${this.current.desc}
                </div>
                <div style="background:rgba(255,255,255,0.1);padding:20px;border-radius:10px;margin-bottom:30px;">
                    <h3>目标:</h3>
                    <ul>
                        ${this.current.objectives.map(o => `<li>${o.text}</li>`).join('')}
                    </ul>
                </div>
                <button onclick="document.getElementById('storyDialog').remove(); window.gameInstance.questManager.currentDialog = null;" 
                    style="padding:15px 40px;font-size:20px;background:#27ae60;color:white;border:none;border-radius:10px;cursor:pointer;">
                    开始冒险
                </button>
            </div>
        `;
        document.body.appendChild(div);
    }
}

// ========== 任务追踪UI ==========
class QuestTrackerUI {
    constructor(questManager) {
        this.qm = questManager;
        this.visible = true;
    }
    
    draw(ctx) {
        if (!this.visible) return;
        
        const quests = this.qm.getQuestList();
        const x = GAME_WIDTH - 300;
        let y = 200;
        
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x - 10, y - 30, 280, 300);
        
        // 当前章节
        if (quests.chapter) {
            ctx.fillStyle = '#F1C40F';
            ctx.font = 'bold 18px monospace';
            ctx.fillText('📖 ' + quests.chapter.title, x, y);
            y += 30;
            
            ctx.fillStyle = '#AAA';
            ctx.font = '14px monospace';
            for (let obj of quests.chapter.objectives) {
                const status = obj.completed ? '✓' : '○';
                const color = obj.completed ? '#2ECC71' : '#FFF';
                ctx.fillStyle = color;
                ctx.fillText(`${status} ${obj.text}`, x + 10, y);
                y += 20;
            }
        }
        
        // 支线任务
        y += 20;
        ctx.fillStyle = '#9B59B6';
        ctx.font = 'bold 16px monospace';
        ctx.fillText('🎯 支线任务', x, y);
        y += 25;
        
        for (let quest of quests.sideQuests) {
            if (quest.completed) continue;
            
            ctx.fillStyle = '#FFF';
            ctx.font = '12px monospace';
            ctx.fillText(quest.name, x + 10, y);
            y += 15;
            
            ctx.fillStyle = '#AAA';
            ctx.font = '11px monospace';
            ctx.fillText(quest.desc.substring(0, 30) + '...', x + 20, y);
            y += 20;
        }
    }
}

console.log('Story/Quest system loaded');
console.log('4 chapters, 6 side quests, objective tracking');
