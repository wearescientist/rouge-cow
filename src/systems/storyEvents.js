/**
 * 剧情事件系统 - StoryEventSystem (深根之疫版)
 * v0.10.0 - 模块化重构
 */

const STORY_EVENTS = {
    // 商店NPC对话（盲眼）
    shopDialogues: [
        "\"你是铁角的儿子，\"盲眼用爪子梳理着稀疏的胡须，\"你父亲...是个固执的傻瓜。\"",
        "\"他明知道下来就是送死，还是跟着歌声走了。你母亲也是。\"",
        "\"他们确实还活着。至少，身体还活着。\"",
        "\"那些歌声，是母虫读取了你母亲的记忆，模仿出来的。\"",
        "\"它学会了爱的概念，就像学会了一种武器。\""
    ],
    
    // 层间过渡剧情
    floorTransitions: [
        { // 1->2
            title: "第一层结束",
            text: "跳跳的身体倒下了，眼中的乳白色渐渐褪去。在最后一刻，他认出了牛牛。\n\n\"地...底下...母虫...在做梦...快...醒...\""
        },
        { // 2->3
            title: "第二层结束", 
            text: "铁爪的菌丝羽毛散落一地。这只曾经骄傲的猎手，终于停止了痛苦的俯冲。\n\n牛牛注意到他后颈处有一个圆形的创口，边缘整齐，像是被什么精密的东西植入过。"
        },
        { // 3->4
            title: "第三层结束",
            text: "泥背的背甲破裂，那些寄生的小虫子失去了控制，钻回了地底。\n\n\"母虫...在收集...守护者血脉...\"他临死前的低语让牛牛的心沉了下去。"
        },
        { // 4->5
            title: "第四层结束",
            text: "银牙的狼群一只接一只倒下，神经索断裂时发出令人牙酸的声响。\n\n\"你父母...在核心...还活着...但快...\""
        },
        { // 5->6
            title: "第五层结束",
            text: "盲眼在生命的最后时刻，将一瓶萃取液交给了牛牛。\n\n\"你父亲让我转告你...'你已经比我伟大了'。\""
        }
    ],
    
    // 父母梦境事件（随机触发）
    dreamEvents: [
        {
            speaker: "父亲的声音",
            text: "\"记住，真正的力量不是征服，而是选择。\"",
            effect: "攻击力提升10%（本层）",
            apply: () => {
                // 攻击提升效果待实现
                console.log('[梦境] 攻击力提升10%');
            }
        },
        {
            speaker: "母亲的歌声",
            text: "\"睡吧，睡吧，我的小牛...\"",
            effect: "回复2点HP",
            apply: () => {
                if (window.game && window.game.player) {
                    window.game.player.hp = Math.min(window.game.player.hp + 2, window.game.player.maxHp);
                }
            }
        },
        {
            speaker: "父亲的声音",
            text: "\"别相信...歌声...那是...诱饵...\"",
            effect: "获得短暂无敌（5秒）",
            apply: () => {
                if (window.game) {
                    const originalGodMode = window.game.godMode;
                    window.game.godMode = true;
                    setTimeout(() => { 
                        if (window.game) window.game.godMode = originalGodMode; 
                    }, 5000);
                }
            }
        },
        {
            speaker: "母亲的歌声",
            text: "\"我们爱你...不是因为你是谁...而是因为...你是我们的孩子。\"",
            effect: "获得护盾（抵挡1次伤害）",
            apply: () => {
                // 护盾效果待实现
                console.log('[梦境] 获得护盾');
            }
        }
    ]
};

class StoryEventSystem {
    constructor() {
        this.shopVisitCount = 0;
        this.currentFloor = 1;
        this.dreamCooldown = 0;
        this.activeTimeouts = [];
    }
    
    // 显示商店NPC对话
    showShopDialogue() {
        const dialogue = STORY_EVENTS.shopDialogues[Math.min(this.shopVisitCount, STORY_EVENTS.shopDialogues.length - 1)];
        this.shopVisitCount++;
        
        this.showDialogueBox({
            speaker: "盲眼",
            text: dialogue,
            speakerColor: "#888"
        });
    }
    
    // 显示层间过渡剧情
    showFloorTransition(floor) {
        if (floor < 1 || floor > STORY_EVENTS.floorTransitions.length) return;
        
        const event = STORY_EVENTS.floorTransitions[floor - 1];
        this.showDialogueBox({
            title: event.title,
            text: event.text,
            autoClose: 6000
        });
    }
    
    // 触发随机父母梦境事件
    triggerDreamEvent() {
        if (this.dreamCooldown > 0) return false;
        if (Math.random() > 0.15) return false; // 15%概率触发
        
        const event = STORY_EVENTS.dreamEvents[Math.floor(Math.random() * STORY_EVENTS.dreamEvents.length)];
        this.dreamCooldown = 60; // 60秒冷却
        
        // 应用效果
        event.apply();
        
        this.showDialogueBox({
            speaker: event.speaker,
            text: event.text,
            speakerColor: event.speaker.includes('父亲') ? '#48f' : '#f8c',
            subtitle: event.effect,
            autoClose: 4000
        });
        
        return true;
    }
    
    update(dt) {
        if (this.dreamCooldown > 0) {
            this.dreamCooldown -= dt;
        }
    }
    
    showDialogueBox({speaker, text, title, speakerColor = '#fff', subtitle, autoClose, onClose}) {
        // 暂停游戏
        const wasPaused = window.game && window.game.paused;
        if (window.game && window.game.state === 'playing') {
            window.game.paused = true;
        }
        
        // 移除现有对话框
        const existing = document.getElementById('storyDialogueBox');
        if (existing) {
            existing.remove();
            // 清理相关的timeout
            this.activeTimeouts = this.activeTimeouts.filter(id => clearTimeout(id));
        }
        
        const overlay = document.createElement('div');
        overlay.id = 'storyDialogueBox';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.85);
            z-index: 15000;
            display: flex;
            align-items: flex-end;
            justify-content: center;
            padding-bottom: 50px;
            animation: fadeIn 0.5s ease;
        `;
        
        const box = document.createElement('div');
        box.style.cssText = `
            width: 90%;
            max-width: 800px;
            background: rgba(20, 15, 10, 0.95);
            border: 2px solid ${speakerColor};
            border-radius: 12px;
            padding: 25px 30px;
            font-family: Arial, sans-serif;
            cursor: pointer;
        `;
        
        let html = '';
        if (title) {
            html += `<div style="color: #fa0; font-size: 14px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px;">${title}</div>`;
        }
        if (speaker) {
            html += `<div style="color: ${speakerColor}; font-size: 16px; font-weight: bold; margin-bottom: 12px;">${speaker}</div>`;
        }
        html += `<div style="color: #ddd; font-size: 16px; line-height: 1.8; white-space: pre-line;">${text}</div>`;
        if (subtitle) {
            html += `<div style="color: #4f4; font-size: 14px; margin-top: 15px; font-style: italic;">${subtitle}</div>`;
        }
        html += `<div style="text-align: center; margin-top: 20px; color: #666; font-size: 12px;">点击任意处继续</div>`;
        
        box.innerHTML = html;
        overlay.appendChild(box);
        document.body.appendChild(overlay);
        
        let closed = false;
        const closeHandler = () => {
            if (closed) return;
            closed = true;
            overlay.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                overlay.remove();
                // 恢复游戏状态（如果之前没有暂停）
                if (window.game && !wasPaused) {
                    window.game.paused = false;
                }
                if (typeof onClose === 'function') onClose();
            }, 300);
        };
        
        overlay.addEventListener('click', closeHandler);
        
        if (autoClose) {
            const timeoutId = setTimeout(closeHandler, autoClose);
            this.activeTimeouts.push(timeoutId);
        }
    }
    
    // 清理所有活动的timeout
    destroy() {
        this.activeTimeouts.forEach(id => clearTimeout(id));
        this.activeTimeouts = [];
        const existing = document.getElementById('storyDialogueBox');
        if (existing) existing.remove();
    }
}

// 创建全局实例
window.storyEventSystem = new StoryEventSystem();
