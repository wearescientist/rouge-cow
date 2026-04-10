/**
 * LEGACY STORY BRIDGE - DO NOT ADD NEW CANON DIALOGUE HERE
 * 正式对白真源已切到 src/data/StoryDialogueData.js。
 */
(function attachStoryEventSystem(global) {
    'use strict';

    function safeLines(lines = []) {
        return (Array.isArray(lines) ? lines : [])
            .map(line => typeof line === 'string' ? { text: line } : line)
            .filter(line => line && String(line.text || '').trim());
    }

    class StoryEventSystem {
        constructor() {
            this.activeTimeouts = [];
            this.sequenceToken = 0;
        }

        update() {}

        triggerDreamEvent() {
            return false;
        }

        showShopDialogue(floor = global.game?.currentFloor || 1) {
            const lines = global.StoryDialogueData?.blindDialogues?.[floor] || [];
            this.showDialogueSequence(lines);
        }

        showFloorTransition() {
            return false;
        }

        closeDialogueBox() {
            const existing = document.getElementById('storyDialogueBox');
            if (!existing) return;
            existing.remove();
        }

        showDialogueBox({ speaker, text, title, speakerColor = '#fff', subtitle, autoClose, onClose }) {
            const wasPaused = !!(global.game && global.game.paused);
            if (global.game && global.game.state === 'playing') {
                global.game.paused = true;
            }

            this.closeDialogueBox();
            this.activeTimeouts.forEach(id => clearTimeout(id));
            this.activeTimeouts = [];

            const overlay = document.createElement('div');
            overlay.id = 'storyDialogueBox';
            overlay.style.cssText = [
                'position:fixed',
                'inset:0',
                'background:rgba(0,0,0,0.85)',
                'z-index:15000',
                'display:flex',
                'align-items:flex-end',
                'justify-content:center',
                'padding-bottom:50px'
            ].join(';');

            const box = document.createElement('div');
            box.style.cssText = [
                'width:90%',
                'max-width:800px',
                'background:rgba(20,15,10,0.95)',
                `border:2px solid ${speakerColor}`,
                'border-radius:12px',
                'padding:25px 30px',
                'font-family:Arial,sans-serif',
                'cursor:pointer'
            ].join(';');

            const parts = [];
            if (title) {
                parts.push(`<div style="color:#fa0;font-size:14px;margin-bottom:10px;text-transform:uppercase;letter-spacing:2px;">${title}</div>`);
            }
            if (speaker) {
                parts.push(`<div style="color:${speakerColor};font-size:16px;font-weight:bold;margin-bottom:12px;">${speaker}</div>`);
            }
            parts.push(`<div style="color:#ddd;font-size:16px;line-height:1.8;white-space:pre-line;">${text || ''}</div>`);
            if (subtitle) {
                parts.push(`<div style="color:#4f4;font-size:14px;margin-top:15px;font-style:italic;">${subtitle}</div>`);
            }
            parts.push('<div style="text-align:center;margin-top:20px;color:#666;font-size:12px;">点击任意处继续</div>');
            box.innerHTML = parts.join('');
            overlay.appendChild(box);
            document.body.appendChild(overlay);

            let closed = false;
            const closeHandler = () => {
                if (closed) return;
                closed = true;
                overlay.remove();
                if (global.game && !wasPaused) {
                    global.game.paused = false;
                }
                if (typeof onClose === 'function') onClose();
            };

            overlay.addEventListener('click', closeHandler);
            if (autoClose) {
                this.activeTimeouts.push(setTimeout(closeHandler, autoClose));
            }
        }

        showDialogueSequence(lines = [], options = {}) {
            const queue = safeLines(lines);
            if (!queue.length) {
                if (typeof options.onComplete === 'function') options.onComplete();
                return;
            }

            const token = ++this.sequenceToken;
            const playNext = (index) => {
                if (token !== this.sequenceToken) return;
                if (index >= queue.length) {
                    if (typeof options.onComplete === 'function') options.onComplete();
                    return;
                }
                const line = queue[index];
                const speakerName = line.name
                    || (line.speaker === 'player' ? '玩家' : (line.speaker === 'blind' ? '盲眼' : line.speaker));
                this.showDialogueBox({
                    title: line.title || options.title,
                    speaker: speakerName || options.speaker,
                    text: line.text,
                    speakerColor: line.color || options.speakerColor || '#fff',
                    subtitle: line.subtitle || options.subtitle,
                    autoClose: line.autoClose || options.autoClose,
                    onClose: () => playNext(index + 1)
                });
            };

            playNext(0);
        }

        destroy() {
            this.sequenceToken += 1;
            this.activeTimeouts.forEach(id => clearTimeout(id));
            this.activeTimeouts = [];
            this.closeDialogueBox();
        }
    }

    global.storyEventSystem = new StoryEventSystem();
})(window);
