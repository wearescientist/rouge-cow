/**
 * LEGACY TRUE ENDING BRIDGE - DO NOT ADD NEW ROUTE RULES HERE
 * 真路线主判定已切到 hiddenRooms.trueEndingUnlocked。
 *
 * 真结局系统 - TrueEndingSystem (深根之疫版)
 * v0.10.0 - 模块化重构
 */

class TrueEndingSystem {
    constructor() {
        this.unlocked = false;
        this.played = false;
        this.activeTimeouts = [];
        this.loadProgress();
    }
    
    // 检查是否满足真结局条件
    checkRequirements() {
        if (window.game?.hiddenRooms?.trueEndingUnlocked) return true;
        return false;
    }
    
    // 解锁真结局
    unlock() {
        if (!this.unlocked) {
            this.unlocked = true;
            this.saveProgress();
            window.collectionCodex?.onTrueRouteUnlocked?.();
            this.showUnlockNotification();
        }
    }
    
    showUnlockNotification() {
        const notif = document.createElement('div');
        notif.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(20, 10, 30, 0.98);
            border: 3px solid #f0f;
            border-radius: 16px;
            padding: 40px 60px;
            color: #fff;
            font-family: Arial, sans-serif;
            z-index: 20000;
            text-align: center;
            animation: fadeIn 1s ease;
            box-shadow: 0 0 50px rgba(255, 0, 255, 0.5);
        `;
        notif.innerHTML = `
            <div style="font-size: 64px; margin-bottom: 20px;">✨</div>
            <div style="font-size: 28px; color: #f0f; font-weight: bold; margin-bottom: 15px;">真相之路已开启</div>
            <div style="font-size: 16px; color: #ccc; max-width: 400px; line-height: 1.6;">
                你已经看完六层隐藏房留下的线索。<br>
                在第六层 Boss 房后，真正通往下方的阶梯将会出现。<br>
                继续走下去，去面对最后的真相。
            </div>
            <div style="margin-top: 25px; color: #888; font-size: 14px;">点击任意处继续</div>
        `;
        
        document.body.appendChild(notif);
        
        const closeHandler = () => {
            notif.style.animation = 'fadeOut 0.5s ease';
            setTimeout(() => notif.remove(), 500);
        };
        
        notif.addEventListener('click', closeHandler);
    }
    
    // 播放真结局
    playTrueEnding() {
        if (this.played) return;
        this.played = true;
        window.collectionCodex?.onTrueEnding?.();
        
        const scenes = [
            {
                text: '在千根之心，母虫开始坍缩。',
                duration: 3000
            },
            {
                text: '但这一次，牛牛没有离开。他选择了留下。',
                duration: 3000
            },
            {
                text: '在梦境间隙，他找到了父母的意识碎片。',
                duration: 3000
            },
            {
                text: '铁角和绒花微笑着看着他。',
                duration: 3000
            },
            {
                text: '"傻孩子，这次，我们一起回家。"',
                duration: 4000
            },
            {
                text: '三个月后，青穗大草原恢复了生机。\n\n盲眼的分泌物净化了被污染的土地，\n牛牛成为了新的部落领袖。\n\n而铁角和绒花...\n他们终于可以真正地休息。',
                duration: 6000
            },
            {
                text: '感谢游玩《深根之疫》\n\n在那梦境间隙的深处，\n爱与牺牲的故事，\n将永远流传。',
                duration: 5000
            }
        ];
        
        // 创建一个持续的黑屏背景
        const bgOverlay = document.createElement('div');
        bgOverlay.className = 'true-ending-bg';
        bgOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #000;
            z-index: 19999;
        `;
        document.body.appendChild(bgOverlay);
        
        this.playSceneSequence(scenes, 0, bgOverlay);
    }
    
    playSceneSequence(scenes, index, bgOverlay) {
        if (index >= scenes.length) {
            // 结局播放完成，淡出黑屏并返回主菜单
            bgOverlay.style.transition = 'opacity 2s ease';
            bgOverlay.style.opacity = '0';
            const timeoutId = setTimeout(() => {
                bgOverlay.remove();
                if (window.game) {
                    window.game.returnToMainMenu();
                }
            }, 2000);
            this.activeTimeouts.push(timeoutId);
            return;
        }
        
        const scene = scenes[index];
        this.showEndingScene(scene.text, scene.duration, () => {
            this.playSceneSequence(scenes, index + 1, bgOverlay);
        });
    }
    
    showEndingScene(text, duration, callback) {
        // 移除旧文字（如果存在）
        const oldText = document.querySelector('.true-ending-text');
        if (oldText) oldText.remove();
        
        const textEl = document.createElement('div');
        textEl.className = 'true-ending-text';
        textEl.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #fff;
            font-size: 22px;
            text-align: center;
            max-width: 700px;
            line-height: 2;
            font-family: Arial, sans-serif;
            white-space: pre-line;
            text-shadow: 0 0 20px rgba(255, 200, 255, 0.5);
            z-index: 20000;
            animation: fadeIn 2s ease;
        `;
        textEl.textContent = text;
        
        document.body.appendChild(textEl);
        
        const timeoutId = setTimeout(() => {
            textEl.style.animation = 'fadeOut 2s ease';
            const removeTimeout = setTimeout(() => {
                textEl.remove();
                if (callback) callback();
            }, 2000);
            this.activeTimeouts.push(removeTimeout);
        }, duration);
        
        this.activeTimeouts.push(timeoutId);
    }
    
    saveProgress() {
        try {
            localStorage.setItem('cowEnding', JSON.stringify({
                unlocked: this.unlocked,
                played: this.played
            }));
        } catch (e) {
            console.warn('Failed to save ending progress:', e);
        }
    }
    
    loadProgress() {
        try {
            const saved = localStorage.getItem('cowEnding');
            if (saved) {
                const data = JSON.parse(saved);
                this.unlocked = data.unlocked || false;
                this.played = data.played || false;
            }
        } catch (e) {
            console.warn('Failed to load ending progress:', e);
        }
    }
    
    reset() {
        this.unlocked = false;
        this.played = false;
        this.clearTimeouts();
        localStorage.removeItem('cowEnding');
    }
    
    clearTimeouts() {
        this.activeTimeouts.forEach(id => clearTimeout(id));
        this.activeTimeouts = [];
    }
    
    destroy() {
        this.clearTimeouts();
        document.querySelectorAll('.true-ending-scene, .true-ending-bg, .true-ending-text').forEach(el => el.remove());
    }
}

// 创建全局实例
window.trueEndingSystem = new TrueEndingSystem();
