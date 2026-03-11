/**
 * 商店NPC盲眼对话系统 - 沉浸式交互
 * v0.13.0 - 5轮迭代优化版
 * 迭代1: 对话气泡位置优化（左/右布局）
 * 迭代2: 打字机效果+跳过
 * 迭代3: 音效提示（盲眼/玩家不同音色）
 * 迭代4: 对话历史记录面板
 * 迭代5: 情感色彩边框+呼吸动画
 */

// 盲眼对话剧本 - 6层对应6组对话，逐层揭示真相
const BLIND_DIALOGUES = {
    // 第1层 - 初次见面，神秘氛围
    floor1: [
        { speaker: 'blind', text: '...有脚步声。是新的气味。' },
        { speaker: 'blind', text: '角族的血脉...你是铁角的儿子。' },
        { speaker: 'niuniu', text: '你是谁？你怎么知道我父亲？' },
        { speaker: 'blind', text: '呵...我是谁？一个在这黑暗中待了四十年的...旁观者。' },
        { speaker: 'blind', text: '你父亲...是个固执的傻瓜。明知道下来是送死，还是跟着那歌声走了。' },
        { speaker: 'niuniu', text: '他还活着吗？！' },
        { speaker: 'blind', text: '活着？那要看你怎么定义"活着"了...' },
        { speaker: 'blind', text: '这里的生物都被"改造"过了。跳跳、铁爪...他们曾是你的朋友吧？' }
    ],
    
    // 第2层 - 揭示母虫真相
    floor2: [
        { speaker: 'niuniu', text: '跳跳他们...还能恢复吗？' },
        { speaker: 'blind', text: '恢复？呵...年轻人，你还没理解你面对的是什么。' },
        { speaker: 'blind', text: '千年前，一颗陨星坠入草原。带来的不是财富，而是一种...格式塔。' },
        { speaker: 'blind', text: '它不是生命，而是生命的"模板"。它读取、学习、同化。' },
        { speaker: 'niuniu', text: '格式塔...' },
        { speaker: 'blind', text: '它认为统一所有意识是"完美"。没有孤独，没有死亡，也没有...自由意志。' },
        { speaker: 'blind', text: '你祖先用生命封印了它。但封印需要"守护者血脉"作为锚点。' },
        { speaker: 'blind', text: '现在，封印松动了。而你父母...被选中了。' }
    ],
    
    // 第3层 - 揭示父母状况
    floor3: [
        { speaker: 'niuniu', text: '被选中...是什么意思？' },
        { speaker: 'blind', text: '母虫需要他们的基因。草原动物的DNA太原始了，它需要更"高等"的样本。' },
        { speaker: 'blind', text: '守护者血脉能让它创造出适应地表环境的完美寄生体。' },
        { speaker: 'niuniu', text: '那我父母现在...' },
        { speaker: 'blind', text: '在核心。在那团不断做梦的肉质中央。' },
        { speaker: 'blind', text: '母虫正在"拆解"他们。学习他们的记忆、情感、一切。' },
        { speaker: 'blind', text: '它特别困惑一件事：为什么这些生物会为"别人"牺牲自己？' },
        { speaker: 'blind', text: '这对它来说...很新奇。' }
    ],
    
    // 第4层 - 歌声的真相
    floor4: [
        { speaker: 'niuniu', text: '我听到的歌声...' },
        { speaker: 'blind', text: '是的，那首歌。你小时候每次做噩梦，她用来安抚你的歌。' },
        { speaker: 'blind', text: '母虫读取了你母亲的记忆，模仿出那首歌。' },
        { speaker: 'niuniu', text: '模仿？' },
        { speaker: 'blind', text: '它学会了"爱"的概念...就像学会了一种武器。' },
        { speaker: 'blind', text: '那首歌是诱饵，让你父亲走进陷阱。但也是真实的...' },
        { speaker: 'blind', text: '因为母虫不理解：如果只是"模仿"，为什么这些生物会响应？' },
        { speaker: 'blind', text: '它开始疑惑：难道"爱"不只是记忆和激素？' }
    ],
    
    // 第5层 - 给予萃取液，揭示希望
    floor5: [
        { speaker: 'niuniu', text: '我该怎么救他们？' },
        { speaker: 'blind', text: '救？你以为这是那种...英雄救美的故事吗？' },
        { speaker: 'blind', text: '...但也许，还有一丝可能。' },
        { speaker: 'blind', text: '这个给你。我用四十年的分泌物浓缩而成。' },
        { speaker: 'niuniu', text: '这是...?' },
        { speaker: 'blind', text: '能暂时屏蔽母虫精神控制的...唯一一次机会。' },
        { speaker: 'blind', text: '在第六层的核心使用它。如果你还想保留自己的意志的话。' },
        { speaker: 'blind', text: '你父亲让我转告你...他说："你已经比我伟大了。"' }
    ],
    
    // 第6层 - 最后的准备
    floor6: [
        { speaker: 'blind', text: '你来了。我能感觉到...核心的脉动。' },
        { speaker: 'blind', text: '母虫庭院就在前面。那里有两个茧，你父母在里面。' },
        { speaker: 'niuniu', text: '我该怎么做？' },
        { speaker: 'blind', text: '记住：母虫无法理解"选择"。它以为牺牲是逻辑的决定。' },
        { speaker: 'blind', text: '但你父母证明了：牺牲是因为"爱"，而爱不是程序。' },
        { speaker: 'blind', text: '用你的双角，用地脉共鸣，去让它看看什么是它永远无法解析的"错误"。' },
        { speaker: 'blind', text: '最后的建议：无论发生什么，记住你父母的话...' },
        { speaker: 'blind', text: '"别下来。活下去。"' },
        { speaker: 'blind', text: '但你选择了下来。你选择了战斗。这就是你比他们伟大的地方。' }
    ],
    
    // 后续对话 - 随机提示（已完成所有层后）
    random: [
        ['跳跳、铁爪、银牙...他们都曾是勇士。'],
        ['别相信"完美统一"的幻象...'],
        ['你的双角...那是地脉共鸣的标志。']
    ]
};

class ShopNPCSystem {
    constructor() {
        this.talkCount = 0;
        this.currentDialogue = null;
        this.dialogueIndex = 0;
        this.isTalking = false;
        this.npcBubble = null;
        this.playerBubble = null;
        this.dialogueHistory = []; // 对话历史记录
        this.historyPanelOpen = false; // 历史面板是否打开
        this.loadProgress();
    }
    
    loadProgress() {
        try {
            const saved = localStorage.getItem('cowBlindTalks');
            if (saved) {
                this.talkCount = parseInt(saved) || 0;
            }
        } catch (e) {}
    }
    
    saveProgress() {
        try {
            localStorage.setItem('cowBlindTalks', this.talkCount.toString());
        } catch (e) {}
    }
    
    // 获取当前层数
    getCurrentFloor() {
        if (window.game) {
            return window.game.currentFloor || 1;
        }
        return 1;
    }
    
    // 显示NPC头顶交互提示 - 简洁两排设计
    showInteractPrompt(npcX, npcY) {
        this.removePrompt();
        
        const prompt = document.createElement('div');
        prompt.id = 'npcInteractPrompt';
        prompt.style.cssText = `
            position: fixed;
            background: rgba(0, 0, 0, 0.85);
            border-radius: 10px;
            padding: 16px 24px;
            color: #fff;
            font-family: Arial, sans-serif;
            font-size: 22px;
            z-index: 5000;
            pointer-events: none;
            transform: translate(-50%, -100%);
            margin-top: -60px;
            white-space: nowrap;
        `;
        prompt.innerHTML = `
            <div style="margin-bottom: 6px;"><span style="color: #aaa;">[F]</span> 交谈</div>
            <div><span style="color: #aaa;">[E]</span> 商店</div>
        `;
        
        // 计算屏幕位置 - 使用 camera 正确转换
        if (window.game) {
            let screenX, screenY;
            const canvas = window.game.canvas;
            const rect = canvas.getBoundingClientRect();
            if (window.game.camera && window.game.camera.worldToScreen) {
                const pos = window.game.camera.worldToScreen(npcX, npcY);
                screenX = rect.left + pos.x;
                screenY = rect.top + pos.y;
            } else {
                screenX = rect.left + (npcX / 2000) * rect.width;
                screenY = rect.top + (npcY / 2000) * rect.height;
            }
            prompt.style.left = screenX + 'px';
            prompt.style.top = screenY + 'px';
        }
        
        document.body.appendChild(prompt);
    }
    
    removePrompt() {
        const existing = document.getElementById('npcInteractPrompt');
        if (existing) existing.remove();
    }
    
    // 开始对话 - 根据当前层数选择对话
    startDialogue() {
        if (this.isTalking) return;
        this.isTalking = true;
        window.game?.refreshPauseState?.();
        
        const floor = this.getCurrentFloor();
        
        // 选择对话内容 - 根据层数
        let dialogue;
        if (floor === 1) {
            dialogue = BLIND_DIALOGUES.floor1;
        } else if (floor === 2) {
            dialogue = BLIND_DIALOGUES.floor2;
        } else if (floor === 3) {
            dialogue = BLIND_DIALOGUES.floor3;
        } else if (floor === 4) {
            dialogue = BLIND_DIALOGUES.floor4;
        } else if (floor === 5) {
            dialogue = BLIND_DIALOGUES.floor5;
        } else if (floor === 6) {
            dialogue = BLIND_DIALOGUES.floor6;
        } else {
            // 超过6层或异常情况，使用随机提示
            const randomTips = BLIND_DIALOGUES.random;
            const tip = randomTips[Math.floor(Math.random() * randomTips.length)];
            dialogue = [{ speaker: 'blind', text: tip[0] }];
        }
        
        this.currentDialogue = dialogue;
        this.dialogueIndex = 0;
        this.talkCount++;
        this.saveProgress();
        
        // 显示第一句
        this.showNextLine();
    }
    
    // 显示下一句对话
    showNextLine() {
        // 如果有正在进行的打字机效果，先完成它
        if (this.typingTimer) {
            clearInterval(this.typingTimer);
            this.typingTimer = null;
            // 显示完整文本
            if (this.currentBubble) {
                const textEl = this.currentBubble.querySelector('.dialogue-text');
                if (textEl && this.currentFullText) {
                    textEl.textContent = this.currentFullText;
                }
            }
            // 设置下一句的延迟
            this.autoAdvanceTimer = setTimeout(() => {
                if (this.isTalking) this.showNextLine();
            }, 1500);
            return;
        }
        
        // 清除当前气泡
        this.clearBubbles();
        
        if (this.dialogueIndex >= this.currentDialogue.length) {
            this.endDialogue();
            return;
        }
        
        const line = this.currentDialogue[this.dialogueIndex];
        this.dialogueIndex++;
        
        // 记录到对话历史（最多保留50条）
        this.dialogueHistory.push({
            speaker: line.speaker,
            text: line.text,
            floor: this.getCurrentFloor(),
            time: new Date().toLocaleTimeString()
        });
        if (this.dialogueHistory.length > 50) {
            this.dialogueHistory.shift();
        }
        
        // 显示气泡（带打字机效果）
        if (line.speaker === 'blind') {
            this.showNPCBubbleWithTyping(line.text);
        } else {
            this.showPlayerBubbleWithTyping(line.text);
        }
    }
    
    // 分析文本情感色彩
    getEmotionColor(text) {
        const dangerWords = ['死', '危险', '杀', '恐惧', '痛苦', '绝望', '怪物'];
        const hopeWords = ['爱', '希望', '拯救', '勇敢', '伟大', '战斗', '牺牲'];
        const mysteryWords = ['未知', '秘密', '困惑', '疑问', '疑惑', '不解'];
        
        for (const word of dangerWords) {
            if (text.includes(word)) return '#f44'; // 红色-危险
        }
        for (const word of hopeWords) {
            if (text.includes(word)) return '#4f4'; // 绿色-希望
        }
        for (const word of mysteryWords) {
            if (text.includes(word)) return '#a4f'; // 紫色-神秘
        }
        return '#888'; // 默认灰色
    }
    
    // 显示NPC气泡（左侧对话布局，带打字机效果+情感色彩）
    showNPCBubbleWithTyping(text) {
        if (!window.game || !window.game.curRoom || !window.game.curRoom.npc) return;
        
        const npc = window.game.curRoom.npc;
        this.currentFullText = text;
        
        // 获取情感色彩
        const emotionColor = this.getEmotionColor(text);
        const isIntense = emotionColor !== '#888';
        
        const bubble = document.createElement('div');
        bubble.id = 'npcDialogueBubble';
        bubble.style.cssText = `
            position: fixed;
            background: rgba(40, 35, 30, 0.98);
            border: 3px solid ${emotionColor};
            border-radius: 14px;
            padding: 20px 24px;
            color: #ddd;
            font-family: Arial, sans-serif;
            font-size: 18px;
            max-width: 360px;
            line-height: 1.6;
            z-index: 6000;
            box-shadow: 0 4px 20px ${emotionColor}40;
            transform: translate(-100%, -50%);
            margin-left: -20px;
            pointer-events: none;
            animation: ${isIntense ? 'breathe 2s ease-in-out infinite' : 'none'};
        `;
        bubble.innerHTML = `
            <div style="color: ${emotionColor}; font-size: 14px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px; font-weight: bold;">盲眼</div>
            <div class="dialogue-text"></div>
            <div style="position: absolute; right: -12px; top: 50%; transform: translateY(-50%); width: 0; height: 0; border-top: 12px solid transparent; border-bottom: 12px solid transparent; border-left: 12px solid ${emotionColor};"></div>
        `;
        
        // 添加呼吸动画样式（如果强烈情感）
        if (isIntense && !document.getElementById('emotionAnimStyle')) {
            const style = document.createElement('style');
            style.id = 'emotionAnimStyle';
            style.textContent = `
                @keyframes breathe {
                    0%, 100% { box-shadow: 0 4px 20px ${emotionColor}40; }
                    50% { box-shadow: 0 4px 30px ${emotionColor}80; }
                }
            `;
            document.head.appendChild(style);
        }
        
        // 使用 camera 正确转换世界坐标到屏幕坐标
        let screenX, screenY;
        const canvas = window.game.canvas;
        const rect = canvas.getBoundingClientRect();
        if (window.game.camera && window.game.camera.worldToScreen) {
            const pos = window.game.camera.worldToScreen(npc.x, npc.y);
            screenX = rect.left + pos.x;
            screenY = rect.top + pos.y;
        } else {
            // 备用：直接计算
            screenX = rect.left + (npc.x / 2000) * rect.width;
            screenY = rect.top + (npc.y / 2000) * rect.height;
        }
        bubble.style.left = screenX + 'px';
        bubble.style.top = screenY + 'px';
        
        document.body.appendChild(bubble);
        this.npcBubble = bubble;
        this.currentBubble = bubble;
        
        // 打字机效果 + 音效
        const textEl = bubble.querySelector('.dialogue-text');
        let charIndex = 0;
        
        // 播放盲眼说话音效（低频沙哑）
        this.playTypingSound('blind');
        
        this.typingTimer = setInterval(() => {
            if (charIndex < text.length) {
                textEl.textContent += text[charIndex];
                charIndex++;
                // 每5个字播放一次音效
                if (charIndex % 5 === 0) {
                    this.playTypingSound('blind');
                }
            } else {
                clearInterval(this.typingTimer);
                this.typingTimer = null;
                // 打字完成，设置自动下一句
                this.autoAdvanceTimer = setTimeout(() => {
                    if (this.isTalking) this.showNextLine();
                }, 1500);
            }
        }, 40); // 每字40ms
    }
    
    // 显示玩家气泡（右侧对话布局，带打字机效果）
    showPlayerBubbleWithTyping(text) {
        if (!window.game || !window.game.player) return;
        
        const player = window.game.player;
        this.currentFullText = text;
        
        const bubble = document.createElement('div');
        bubble.id = 'playerDialogueBubble';
        bubble.style.cssText = `
            position: fixed;
            background: rgba(30, 40, 35, 0.98);
            border: 2px solid #4f4;
            border-radius: 14px;
            padding: 20px 24px;
            color: #fff;
            font-family: Arial, sans-serif;
            font-size: 18px;
            max-width: 360px;
            line-height: 1.6;
            z-index: 6000;
            box-shadow: 0 4px 20px rgba(0,0,0,0.6);
            transform: translate(0, -50%);
            margin-left: 20px;
            pointer-events: none;
        `;
        bubble.innerHTML = `
            <div style="color: #4f4; font-size: 14px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 1px;">牛牛</div>
            <div class="dialogue-text"></div>
            <div style="position: absolute; left: -10px; top: 50%; transform: translateY(-50%); width: 0; height: 0; border-top: 10px solid transparent; border-bottom: 10px solid transparent; border-right: 10px solid #4f4;"></div>
        `;
        
        // 使用 camera 正确转换世界坐标到屏幕坐标
        let screenX, screenY;
        const canvas = window.game.canvas;
        const rect = canvas.getBoundingClientRect();
        if (window.game.camera && window.game.camera.worldToScreen) {
            const pos = window.game.camera.worldToScreen(player.x, player.y);
            screenX = rect.left + pos.x;
            screenY = rect.top + pos.y;
        } else {
            // 备用：直接计算
            screenX = rect.left + (player.x / 2000) * rect.width;
            screenY = rect.top + (player.y / 2000) * rect.height;
        }
        bubble.style.left = screenX + 'px';
        bubble.style.top = screenY + 'px';
        
        document.body.appendChild(bubble);
        this.playerBubble = bubble;
        this.currentBubble = bubble;
        
        // 打字机效果（玩家打字更快）+ 音效
        const textEl = bubble.querySelector('.dialogue-text');
        let charIndex = 0;
        
        // 播玩家说话音效（清晰中频）
        this.playTypingSound('player');
        
        this.typingTimer = setInterval(() => {
            if (charIndex < text.length) {
                textEl.textContent += text[charIndex];
                charIndex++;
                // 每4个字播放一次音效
                if (charIndex % 4 === 0) {
                    this.playTypingSound('player');
                }
            } else {
                clearInterval(this.typingTimer);
                this.typingTimer = null;
                this.autoAdvanceTimer = setTimeout(() => {
                    if (this.isTalking) this.showNextLine();
                }, 1200);
            }
        }, 30); // 每字30ms（更快）
    }
    
    // 清除气泡
    clearBubbles() {
        if (this.npcBubble) {
            this.npcBubble.remove();
            this.npcBubble = null;
        }
        if (this.playerBubble) {
            this.playerBubble.remove();
            this.playerBubble = null;
        }
        if (this.autoAdvanceTimer) {
            clearTimeout(this.autoAdvanceTimer);
            this.autoAdvanceTimer = null;
        }
        if (this.typingTimer) {
            clearInterval(this.typingTimer);
            this.typingTimer = null;
        }
        this.currentBubble = null;
        this.currentFullText = null;
    }
    
    // 结束对话
    endDialogue() {
        this.clearBubbles();
        this.isTalking = false;
        this.currentDialogue = null;
        window.game?.refreshPauseState?.();
        
        // 对话结束后重新显示交互提示
        if (window.game && window.game.curRoom && window.game.curRoom.npc) {
            const npc = window.game.curRoom.npc;
            this.showInteractPrompt(npc.x, npc.y);
        }
    }
    
    // 跳过当前对话（点击/按键）
    skipLine() {
        if (!this.isTalking) return;
        
        if (this.autoAdvanceTimer) {
            clearTimeout(this.autoAdvanceTimer);
        }
        this.showNextLine();
    }
    
    // 播放打字音效
    playTypingSound(speaker) {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            
            const ctx = new AudioContext();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            
            osc.connect(gain);
            gain.connect(ctx.destination);
            
            if (speaker === 'blind') {
                // 盲眼：低频沙哑，类似老人声音
                osc.type = 'sine';
                osc.frequency.setValueAtTime(150, ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.05);
                gain.gain.setValueAtTime(0.1, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
            } else {
                // 玩家：中频清晰
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(300, ctx.currentTime);
                gain.gain.setValueAtTime(0.08, ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.03);
            }
            
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.05);
        } catch (e) {
            // 音频失败静默处理
        }
    }
    
    // 切换对话历史面板
    toggleHistoryPanel() {
        if (this.historyPanelOpen) {
            this.closeHistoryPanel();
        } else {
            this.showHistoryPanel();
        }
    }
    
    // 显示对话历史面板
    showHistoryPanel() {
        this.historyPanelOpen = true;
        
        const panel = document.createElement('div');
        panel.id = 'dialogueHistoryPanel';
        panel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 500px;
            max-height: 70vh;
            background: rgba(20, 15, 10, 0.98);
            border: 2px solid #888;
            border-radius: 12px;
            padding: 20px;
            z-index: 7000;
            font-family: Arial, sans-serif;
            color: #ddd;
            box-shadow: 0 8px 32px rgba(0,0,0,0.8);
        `;
        
        // 构建历史内容
        let historyHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; border-bottom: 1px solid #555; padding-bottom: 12px;">
                <div style="color: #fa0; font-size: 18px; font-weight: bold;">📜 与盲眼的对话记录</div>
                <button id="closeHistoryBtn" style="background: #444; border: none; color: #fff; padding: 6px 12px; border-radius: 4px; cursor: pointer;">关闭</button>
            </div>
            <div style="max-height: 50vh; overflow-y: auto; padding-right: 8px;">
        `;
        
        if (this.dialogueHistory.length === 0) {
            historyHTML += '<div style="color: #888; text-align: center; padding: 40px;">暂无对话记录</div>';
        } else {
            let currentFloor = null;
            this.dialogueHistory.forEach((entry, index) => {
                // 按楼层分组显示
                if (entry.floor !== currentFloor) {
                    currentFloor = entry.floor;
                    historyHTML += `<div style="color: #666; font-size: 12px; margin: 16px 0 8px 0; text-align: center;">━━ 第 ${currentFloor} 层 ━━</div>`;
                }
                
                const speakerColor = entry.speaker === 'blind' ? '#fa0' : '#4f4';
                const speakerName = entry.speaker === 'blind' ? '盲眼' : '牛牛';
                historyHTML += `
                    <div style="margin-bottom: 12px; padding: 10px; background: rgba(255,255,255,0.05); border-radius: 8px;">
                        <div style="color: ${speakerColor}; font-size: 11px; margin-bottom: 4px;">${speakerName} <span style="color: #666; font-size: 10px;">${entry.time}</span></div>
                        <div style="color: #ddd; line-height: 1.5;">${entry.text}</div>
                    </div>
                `;
            });
        }
        
        historyHTML += '</div>';
        panel.innerHTML = historyHTML;
        
        document.body.appendChild(panel);
        
        // 绑定关闭按钮
        document.getElementById('closeHistoryBtn').addEventListener('click', () => {
            this.closeHistoryPanel();
        });
    }
    
    // 关闭历史面板
    closeHistoryPanel() {
        this.historyPanelOpen = false;
        const panel = document.getElementById('dialogueHistoryPanel');
        if (panel) panel.remove();
    }
    
    // 更新NPC提示位置（跟随移动）
    updatePromptPosition() {
        const canvas = window.game.canvas;
        const rect = canvas.getBoundingClientRect();
        
        // 更新交互提示位置
        if (!this.isTalking && window.game && window.game.curRoom && window.game.curRoom.npc) {
            const npc = window.game.curRoom.npc;
            const prompt = document.getElementById('npcInteractPrompt');
            if (prompt) {
                let screenX, screenY;
                if (window.game.camera && window.game.camera.worldToScreen) {
                    const pos = window.game.camera.worldToScreen(npc.x, npc.y);
                    screenX = rect.left + pos.x;
                    screenY = rect.top + pos.y;
                } else {
                    screenX = rect.left + (npc.x / 2000) * rect.width;
                    screenY = rect.top + (npc.y / 2000) * rect.height;
                }
                prompt.style.left = screenX + 'px';
                prompt.style.top = screenY + 'px';
            }
        }
        
        // 更新对话气泡位置
        if (this.npcBubble && window.game && window.game.curRoom && window.game.curRoom.npc) {
            const npc = window.game.curRoom.npc;
            let screenX, screenY;
            if (window.game.camera && window.game.camera.worldToScreen) {
                const pos = window.game.camera.worldToScreen(npc.x, npc.y);
                screenX = rect.left + pos.x;
                screenY = rect.top + pos.y;
            } else {
                screenX = rect.left + (npc.x / 2000) * rect.width;
                screenY = rect.top + (npc.y / 2000) * rect.height;
            }
            this.npcBubble.style.left = screenX + 'px';
            this.npcBubble.style.top = screenY + 'px';
        }
        
        if (this.playerBubble && window.game && window.game.player) {
            const player = window.game.player;
            let screenX, screenY;
            if (window.game.camera && window.game.camera.worldToScreen) {
                const pos = window.game.camera.worldToScreen(player.x, player.y);
                screenX = rect.left + pos.x;
                screenY = rect.top + pos.y;
            } else {
                screenX = rect.left + (player.x / 2000) * rect.width;
                screenY = rect.top + (player.y / 2000) * rect.height;
            }
            this.playerBubble.style.left = screenX + 'px';
            this.playerBubble.style.top = screenY + 'px';
        }
    }
    
    // 清理所有UI
    destroy() {
        this.clearBubbles();
        this.removePrompt();
        this.isTalking = false;
    }
}

// 创建全局实例
window.shopNPCSystem = new ShopNPCSystem();
