/**
 * 商店NPC盲眼对话系统 - 沉浸式交互
 * v0.13.0 - 5轮迭代优化版
 * 迭代1: 对话气泡位置优化（左/右布局）
 * 迭代2: 打字机效果+跳过
 * 迭代3: 音效提示（盲眼/玩家不同音色）
 * 迭代4: 对话历史记录面板
 * 迭代5: 情感色彩边框+呼吸动画
 */

// 盲眼对话剧本 - 优先读取统一剧情数据，缺失时回退到本地默认值
const DEFAULT_BLIND_DIALOGUES = {
    floor1: [
        { speaker: 'blind', text: '既到此处，先歇片刻。人一慌，手里的兵刃也会跟着失了准头。' },
        { speaker: 'niuniu', text: '下面到底是什么？' },
        { speaker: 'blind', text: '地底之物，本就凶顽，如今又沾了秽气，自然更难应付。你初下此间，先顾全自己，再谈往后。' },
        { speaker: 'niuniu', text: '这些东西，真能用得上？' },
        { speaker: 'blind', text: '手中有备，心里便稳。心若稳了，路才能走远。' }
    ],
    floor2: [
        { speaker: 'blind', text: '再往下走，感染会愈发深重。' },
        { speaker: 'niuniu', text: '我方才见到的东西……有些古怪。' },
        { speaker: 'blind', text: '这便是了。许多东西，外相仍似旧日，内里却早已坏透。' },
        { speaker: 'niuniu', text: '所以，不能迟疑？' },
        { speaker: 'blind', text: '正是。你若心软一瞬，它们便会借你这一瞬近身。' }
    ],
    floor3: [
        { speaker: 'blind', text: '你能行至此处，倒比我先前料想的更沉得住气。' },
        { speaker: 'niuniu', text: '为什么下面那些怪物，越来越像活人？' },
        { speaker: 'blind', text: '感染深了，便会学。学人声，学人形，学你熟悉的一切。愈是如此，愈不可轻信。' },
        { speaker: 'niuniu', text: '连这些也能学会？' },
        { speaker: 'blind', text: '世间最难防的，从来不是面目可怖之物，而是披着旧影前来的东西。' }
    ],
    floor4: [
        { speaker: 'blind', text: '走到这里，最忌心神摇动。' },
        { speaker: 'niuniu', text: '我总觉得，它们不像只想杀我，更像是在拦我。' },
        { speaker: 'blind', text: '你走得愈深，它们便愈知道你要去往何处。会拦你，并不奇怪。' },
        { speaker: 'niuniu', text: '这么说，我走对了？' },
        { speaker: 'blind', text: '路既至此，便没有轻易回头的道理。你若在此止步，前面受的苦，便都白受了。' }
    ],
    floor5: [
        { speaker: 'blind', text: '这一层不会轻松，先把该带的带上。' },
        { speaker: 'niuniu', text: '这里的怪物……竟还会说话。' },
        { speaker: 'blind', text: '不足为奇。感染到了深处，残存的意识反倒会更分明。' },
        { speaker: 'niuniu', text: '残存的意识？' },
        { speaker: 'blind', text: '嗯。它或许还认得你，也或许还记得从前的一些事。只是记得归记得，它终究已不是旧日之人了。' },
        { speaker: 'niuniu', text: '……' },
        { speaker: 'blind', text: '你须记住，像人的东西，未必还是人。' }
    ],
    floor6: [
        { speaker: 'blind', text: '终究还是走到这里了。' },
        { speaker: 'niuniu', text: '越往下，我越觉得不对。' },
        { speaker: 'blind', text: '近母体之处，污染最盛，也最擅借人心行事。它会循着你最挂念的东西而来，也会化作你最不忍下手的模样。' },
        { speaker: 'niuniu', text: '那我该怎么办？' },
        { speaker: 'blind', text: '守住本心，莫受其惑。你走到今日，不是为了在最后一步前乱了分寸。' },
        { speaker: 'niuniu', text: '……' },
        { speaker: 'blind', text: '去吧。把这一切了结了，你也该回家了。' }
    ],
    random: [
        ['再往深处走，最先乱的往往不是手，而是心。'],
        ['像人的东西，未必还是人。'],
        ['心若稳了，路才能走远。']
    ]
};

function getBlindDialogues() {
    const storyData = window.StoryDialogueData?.blindDialogues;
    if (!storyData || typeof storyData !== 'object') {
        return DEFAULT_BLIND_DIALOGUES;
    }

    return {
        floor1: storyData[1] || DEFAULT_BLIND_DIALOGUES.floor1,
        floor2: storyData[2] || DEFAULT_BLIND_DIALOGUES.floor2,
        floor3: storyData[3] || DEFAULT_BLIND_DIALOGUES.floor3,
        floor4: storyData[4] || DEFAULT_BLIND_DIALOGUES.floor4,
        floor5: storyData[5] || DEFAULT_BLIND_DIALOGUES.floor5,
        floor6: storyData[6] || DEFAULT_BLIND_DIALOGUES.floor6,
        random: DEFAULT_BLIND_DIALOGUES.random
    };
}

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

    getAnchorScreenPosition(entity, anchor = 'center') {
        if (!window.game || !entity) return null;

        const canvas = window.game.canvas;
        const rect = canvas?.getBoundingClientRect?.();
        if (!rect) return null;

        let anchorY = entity.y;
        if (anchor === 'head') {
            const entityHeight = entity.height || entity.size || entity.radius * 2 || 100;
            anchorY -= entityHeight * 0.62;
        }

        if (window.game.camera?.worldToScreen) {
            const pos = window.game.camera.worldToScreen(entity.x, anchorY);
            const scaleX = rect.width / Math.max(canvas.width || rect.width, 1);
            const scaleY = rect.height / Math.max(canvas.height || rect.height, 1);
            return {
                x: rect.left + pos.x * scaleX,
                y: rect.top + pos.y * scaleY
            };
        }

        return {
            x: rect.left + (entity.x / 2000) * rect.width,
            y: rect.top + (anchorY / 2000) * rect.height
        };
    }

    getShopkeeperRenderAnchor(kind = 'bubble') {
        const game = window.game;
        const renderData = game?.shopkeeperPresentationData;
        const canvas = game?.canvas;
        const rect = canvas?.getBoundingClientRect?.();
        if (!renderData || !canvas || !rect) return null;

        const scaleX = rect.width / Math.max(canvas.width || rect.width, 1);
        const scaleY = rect.height / Math.max(canvas.height || rect.height, 1);
        const left = rect.left + renderData.drawX * scaleX;
        const top = rect.top + renderData.drawY * scaleY;
        const width = renderData.drawW * scaleX;
        const height = renderData.drawH * scaleY;

        const profiles = {
            prompt: { x: 0.50, y: 0.16 },
            bubble: { x: 0.56, y: 0.34 }
        };
        const profile = profiles[kind] || profiles.bubble;
        return {
            x: left + width * profile.x,
            y: top + height * profile.y,
            left,
            top,
            width,
            height
        };
    }

    getDialogueBubblePosition(entity, side) {
        const pos = this.getAnchorScreenPosition(entity, 'head');
        if (!pos) return null;

        const entityWidth = entity.width || entity.size || entity.radius * 2 || 100;
        const sideOffset = entityWidth * 0.42 + 16;

        return {
            x: pos.x + (side === 'right' ? sideOffset : -sideOffset),
            y: pos.y - 8
        };
    }


    getViewportRect() {
        const canvas = window.game?.canvas;
        const rect = canvas?.getBoundingClientRect?.();
        if (!rect) return null;
        return rect;
    }

    clampPosition(left, top, width, height, padding = 12) {
        const rect = this.getViewportRect();
        if (!rect) return { left, top };
        return {
            left: Math.max(rect.left + padding, Math.min(left, rect.right - width - padding)),
            top: Math.max(rect.top + padding, Math.min(top, rect.bottom - height - padding))
        };
    }

    getPromptScreenPosition(npc) {
        const anchor = this.getShopkeeperRenderAnchor('prompt') || this.getAnchorScreenPosition(npc, 'head');
        if (!anchor) return null;
        return {
            left: anchor.x,
            top: anchor.y - 18,
            transform: 'translate(-50%, -100%)'
        };
    }

    getNpcBubbleScreenPosition(npc, bubble) {
        const anchor = this.getShopkeeperRenderAnchor('bubble') || this.getAnchorScreenPosition(npc, 'head');
        if (!anchor || !bubble) return null;
        const width = bubble.offsetWidth || 360;
        const height = bubble.offsetHeight || 120;
        const left = anchor.x - width * 0.5;
        const top = anchor.y - height - 18;
        return this.clampPosition(left, top, width, height, 16);
    }

    getPlayerBubbleScreenPosition(player, bubble) {
        const anchor = this.getAnchorScreenPosition(player, 'head');
        if (!anchor || !bubble) return null;
        const width = bubble.offsetWidth || 360;
        const height = bubble.offsetHeight || 120;
        const left = anchor.x - width * 0.5;
        const top = anchor.y - height - 18;
        return this.clampPosition(left, top, width, height, 16);
    }

    applyPosition(element, pos) {
        if (!element || !pos) return;
        element.style.left = pos.left + 'px';
        element.style.top = pos.top + 'px';
        if (pos.transform) {
            element.style.transform = pos.transform;
        }
    }

    shouldHideDialogueUi() {
        const game = window.game;
        if (!game) return false;
        return !!(
            game.manualPaused ||
            game.paused ||
            game.settingsOpen ||
            game.levelUpOpen ||
            game.chestOpen ||
            game.shopOpen ||
            game.weaponBoxOpen ||
            game.confirmDialogOpen
        );
    }

    syncDialogueUiVisibility() {
        const hidden = this.shouldHideDialogueUi();
        const prompt = document.getElementById('npcInteractPrompt');
        if (prompt) prompt.style.display = hidden ? 'none' : 'block';
        if (this.npcBubble) this.npcBubble.style.display = hidden ? 'none' : 'block';
        if (this.playerBubble) this.playerBubble.style.display = hidden ? 'none' : 'block';
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
            z-index: 520;
            pointer-events: none;
            transform: translate(-50%, -100%);
            white-space: nowrap;
        `;
        prompt.innerHTML = `
            <div style="margin-bottom: 6px;"><span style="color: #aaa;">[F]</span> 交谈</div>
            <div><span style="color: #aaa;">[E]</span> 商店</div>
        `;
        
        // 计算屏幕位置 - 使用 camera 正确转换
        if (window.game) {
            const targetNpc = window.game.curRoom?.npc || { x: npcX, y: npcY, height: 100, size: 100 };
            const pos = this.getPromptScreenPosition(targetNpc);
            if (pos) {
                this.applyPosition(prompt, pos);
            }
        }
        this.syncDialogueUiVisibility();
        
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
        window.game?.playerOverheadDialogue?.stop?.();
        window.game?.refreshPauseState?.();
        
        const floor = this.getCurrentFloor();
        const blindDialogues = getBlindDialogues();
        
        // 选择对话内容 - 根据层数
        let dialogue;
        if (floor === 1) {
            dialogue = blindDialogues.floor1;
        } else if (floor === 2) {
            dialogue = blindDialogues.floor2;
        } else if (floor === 3) {
            dialogue = blindDialogues.floor3;
        } else if (floor === 4) {
            dialogue = blindDialogues.floor4;
        } else if (floor === 5) {
            dialogue = blindDialogues.floor5;
        } else if (floor === 6) {
            dialogue = blindDialogues.floor6;
        } else {
            // 超过6层或异常情况，使用随机提示
            const randomTips = blindDialogues.random;
            const tip = randomTips[Math.floor(Math.random() * randomTips.length)];
            dialogue = [{ speaker: 'blind', text: tip[0] }];
        }
        
        this.currentDialogue = dialogue;
        this.dialogueIndex = 0;
        this.talkCount++;
        this.saveProgress();
        window.collectionCodex?.onBlindDialogueStart?.(floor);
        
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
    
    getCompactDialogueMetrics() {
        const compact = typeof window !== 'undefined' && (window.innerWidth <= 900 || window.innerHeight <= 620);
        return compact
            ? { fontSize: 14, minWidth: 168, maxWidth: Math.max(180, Math.min(window.innerWidth - 28, 280)), padding: '10px 12px 12px', labelSize: 11, labelMargin: 4 }
            : { fontSize: 18, minWidth: 220, maxWidth: 420, padding: '12px 16px 14px', labelSize: 12, labelMargin: 6 };
    }

    // 显示NPC气泡（左侧对话布局，带打字机效果+情感色彩）
    showNPCBubbleWithTyping(text) {
        if (!window.game || !window.game.curRoom || !window.game.curRoom.npc) return;
        
        const npc = window.game.curRoom.npc;
        this.currentFullText = text;
        
        const emotionColor = this.getEmotionColor(text);
        const metrics = this.getCompactDialogueMetrics();
        const bubble = document.createElement('div');
        bubble.id = 'npcDialogueBubble';
        bubble.style.cssText = `
            position: fixed;
            background: rgba(0, 0, 0, 0.62);
            border: 1px solid rgba(255,255,255,0.14);
            border-top: 2px solid ${emotionColor};
            border-radius: 12px;
            padding: ${metrics.padding};
            color: #f4f2ef;
            font-family: Arial, sans-serif;
            font-size: ${metrics.fontSize}px;
            min-width: ${metrics.minWidth}px;
            max-width: ${metrics.maxWidth}px;
            line-height: 1.6;
            z-index: 520;
            box-shadow: 0 10px 26px rgba(0,0,0,0.30);
            backdrop-filter: blur(3px);
            transform: none;
            pointer-events: none;
        `;
        bubble.innerHTML = `
            <div style="color: ${emotionColor}; font-size: ${metrics.labelSize}px; margin-bottom: ${metrics.labelMargin}px; letter-spacing: 0.12em; font-weight: bold;">盲眼</div>
            <div class="dialogue-text" style="white-space: pre-wrap;"></div>
        `;
        
        document.body.appendChild(bubble);
        this.applyPosition(bubble, this.getNpcBubbleScreenPosition(npc, bubble));
        this.npcBubble = bubble;
        this.currentBubble = bubble;
        this.syncDialogueUiVisibility();
        
        const textEl = bubble.querySelector('.dialogue-text');
        let charIndex = 0;
        this.playTypingSound('blind');
        
        this.typingTimer = setInterval(() => {
            if (charIndex < text.length) {
                textEl.textContent += text[charIndex];
                charIndex++;
                if (charIndex % 3 === 0) {
                    this.playTypingSound('blind');
                }
            } else {
                clearInterval(this.typingTimer);
                this.typingTimer = null;
                this.autoAdvanceTimer = setTimeout(() => {
                    if (this.isTalking) this.showNextLine();
                }, 1500);
            }
        }, 38);
    }
    
    // 显示玩家气泡（右侧对话布局，带打字机效果）
    showPlayerBubbleWithTyping(text) {
        if (!window.game || !window.game.player) return;
        
        const player = window.game.player;
        this.currentFullText = text;
        const metrics = this.getCompactDialogueMetrics();
        
        const bubble = document.createElement('div');
        bubble.id = 'playerDialogueBubble';
        bubble.style.cssText = `
            position: fixed;
            background: rgba(0, 0, 0, 0.62);
            border: 1px solid rgba(255,255,255,0.14);
            border-top: 2px solid #78d99d;
            border-radius: 12px;
            padding: ${metrics.padding};
            color: #fff;
            font-family: Arial, sans-serif;
            font-size: ${metrics.fontSize}px;
            min-width: ${metrics.minWidth}px;
            max-width: ${metrics.maxWidth}px;
            line-height: 1.6;
            z-index: 520;
            box-shadow: 0 10px 26px rgba(0,0,0,0.30);
            backdrop-filter: blur(3px);
            transform: none;
            pointer-events: none;
        `;
        bubble.innerHTML = `
            <div style="color: #9fe6b8; font-size: ${metrics.labelSize}px; margin-bottom: ${metrics.labelMargin}px; letter-spacing: 0.12em; font-weight: bold;">牛牛</div>
            <div class="dialogue-text" style="white-space: pre-wrap;"></div>
        `;
        
        document.body.appendChild(bubble);
        this.applyPosition(bubble, this.getPlayerBubbleScreenPosition(player, bubble));
        this.playerBubble = bubble;
        this.currentBubble = bubble;
        this.syncDialogueUiVisibility();
        
        const textEl = bubble.querySelector('.dialogue-text');
        let charIndex = 0;
        this.playTypingSound('player');
        
        this.typingTimer = setInterval(() => {
            if (charIndex < text.length) {
                textEl.textContent += text[charIndex];
                charIndex++;
                if (charIndex % 3 === 0) {
                    this.playTypingSound('player');
                }
            } else {
                clearInterval(this.typingTimer);
                this.typingTimer = null;
                this.autoAdvanceTimer = setTimeout(() => {
                    if (this.isTalking) this.showNextLine();
                }, 1200);
            }
        }, 32);
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
    
    finishCurrentLine() {
        if (!this.currentBubble || !this.currentFullText) return false;
        const textEl = this.currentBubble.querySelector('.dialogue-text');
        if (!textEl) return false;
        if (this.typingTimer) {
            clearInterval(this.typingTimer);
            this.typingTimer = null;
        }
        textEl.textContent = this.currentFullText;
        return true;
    }

    // 跳过当前对话（点击/按键）
    skipLine() {
        if (!this.isTalking) return;
        if (this.typingTimer) {
            this.finishCurrentLine();
            return;
        }
        if (this.autoAdvanceTimer) {
            clearTimeout(this.autoAdvanceTimer);
            this.autoAdvanceTimer = null;
        }
        this.showNextLine();
    }

    skipDialogue() {
        if (!this.isTalking) return;
        this.endDialogue();
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
        this.syncDialogueUiVisibility();
        if (!window.game) return;

        if (!this.isTalking && window.game.curRoom?.npc) {
            const prompt = document.getElementById('npcInteractPrompt');
            if (prompt) {
                this.applyPosition(prompt, this.getPromptScreenPosition(window.game.curRoom.npc));
            }
        }

        if (this.npcBubble && window.game.curRoom?.npc) {
            this.applyPosition(this.npcBubble, this.getNpcBubbleScreenPosition(window.game.curRoom.npc, this.npcBubble));
        }

        if (this.playerBubble && window.game.player) {
            this.applyPosition(this.playerBubble, this.getPlayerBubbleScreenPosition(window.game.player, this.playerBubble));
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
