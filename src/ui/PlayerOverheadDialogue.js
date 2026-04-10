class PlayerOverheadDialogue {
    constructor(options = {}) {
        this.gameGetter = options.gameGetter || (() => window.game);
        this.root = null;
        this.textEl = null;
        this.activeSequence = null;
        this.lineIndex = 0;
        this.lineElapsed = 0;
        this.lineDuration = 0;
        this.visibleChars = 0;
        this.typeAccumulator = 0;
        this.visible = false;
        this.rafId = 0;
        this.lastTs = 0;
        this.ensureUi();
        this.tick = this.tick.bind(this);
        this.rafId = requestAnimationFrame(this.tick);
    }

    ensureUi() {
        if (this.root || typeof document === 'undefined') return;

        const style = document.createElement('style');
        style.id = 'playerOverheadDialogueStyle';
        style.textContent = `
            .player-overhead-dialogue {
                position: fixed;
                left: 0;
                top: 0;
                z-index: 18500;
                display: none;
                pointer-events: none;
                transform: translate(-50%, -100%);
            }
            .player-overhead-dialogue__bubble {
                max-width: 220px;
                padding: 7px 10px;
                border-radius: 10px;
                background: rgba(0, 0, 0, 0.46);
                color: rgba(255, 255, 255, 0.94);
                font-size: 14px;
                line-height: 1.45;
                letter-spacing: 0.2px;
                text-align: center;
                box-shadow: 0 8px 20px rgba(0, 0, 0, 0.18);
                white-space: pre-wrap;
                opacity: 0;
                transform: translateY(4px);
                transition: opacity 0.16s ease, transform 0.16s ease;
            }
            .player-overhead-dialogue.show .player-overhead-dialogue__bubble {
                opacity: 1;
                transform: translateY(0);
            }
            @media (max-width: 900px) {
                .player-overhead-dialogue__bubble {
                    max-width: 168px;
                    padding: 6px 8px;
                    font-size: 12px;
                    line-height: 1.38;
                    border-radius: 9px;
                }
            }
        `;
        document.head.appendChild(style);

        this.root = document.createElement('div');
        this.root.className = 'player-overhead-dialogue';
        this.root.innerHTML = '<div class="player-overhead-dialogue__bubble"></div>';
        this.textEl = this.root.firstElementChild;
        document.body.appendChild(this.root);
    }

    normalizeLine(line) {
        if (typeof line === 'string') {
            const text = line.trim();
            return text ? { text, anchor: 'player', color: '', maxWidth: 220, duration: null, targetGetter: null } : null;
        }
        if (!line || typeof line !== 'object') return null;
        const text = String(line.text || '').trim();
        if (!text) return null;
        return {
            text,
            anchor: line.anchor || 'player',
            color: typeof line.color === 'string' ? line.color : '',
            maxWidth: Number.isFinite(line.maxWidth) ? line.maxWidth : 220,
            duration: Number.isFinite(line.duration) ? line.duration : null,
            targetGetter: typeof line.targetGetter === 'function' ? line.targetGetter : null,
            worldX: Number.isFinite(line.worldX) ? line.worldX : null,
            worldY: Number.isFinite(line.worldY) ? line.worldY : null,
            offsetY: Number.isFinite(line.offsetY) ? line.offsetY : null
        };
    }

    normalizeLines(lines) {
        return (Array.isArray(lines) ? lines : [])
            .map((line) => this.normalizeLine(line))
            .filter(Boolean);
    }

    computeLineDuration(line) {
        if (Number.isFinite(line?.duration) && line.duration > 0) return line.duration;
        const length = Array.from(String(line?.text || '')).length;
        const typing = Math.max(0.45, length * 0.055);
        const reading = Math.max(1.45, Math.min(4.6, 1.2 + length * 0.045));
        return typing + reading;
    }

    getLineTypeStep(line) {
        const length = Array.from(String(line?.text || '')).length;
        if (length <= 10) return 0.040;
        if (length <= 24) return 0.034;
        return 0.030;
    }

    resetTyping(line) {
        this.visibleChars = 0;
        this.typeAccumulator = 0;
        this.setText(line, '');
    }

    start(lines, options = {}) {
        const normalized = this.normalizeLines(lines);
        if (normalized.length <= 0) {
            this.stop();
            return false;
        }

        this.activeSequence = {
            id: options.id || '',
            lines: normalized,
            gap: Number.isFinite(options.gap) ? options.gap : 0.2,
            finished: false,
            lockPlayer: !!options.lockPlayer,
            onComplete: typeof options.onComplete === 'function' ? options.onComplete : null
        };
        this.lineIndex = 0;
        this.lineElapsed = 0;
        this.lineDuration = this.computeLineDuration(normalized[0]);
        this.resetTyping(normalized[0]);
        this.show();
        return true;
    }

    finishSequence(suppressComplete = false) {
        const onComplete = !suppressComplete ? this.activeSequence?.onComplete : null;
        this.activeSequence = null;
        this.lineIndex = 0;
        this.lineElapsed = 0;
        this.lineDuration = 0;
        this.visibleChars = 0;
        this.typeAccumulator = 0;
        this.hide();
        if (typeof onComplete === 'function') onComplete();
    }

    stop(options = {}) {
        this.finishSequence(!!options.suppressComplete);
    }

    getCurrentLine() {
        return this.activeSequence?.lines?.[this.lineIndex] || null;
    }

    isBusy() {
        return !!this.activeSequence;
    }

    isPlayerLocked() {
        return !!this.activeSequence?.lockPlayer;
    }

    setText(line, textOverride = null) {
        if (!this.textEl) return;
        this.textEl.textContent = textOverride != null ? String(textOverride) : String(line?.text || '');
        this.textEl.style.color = line?.color || 'rgba(255, 255, 255, 0.94)';
        this.textEl.style.maxWidth = `${Math.max(160, Number(line?.maxWidth) || 220)}px`;
    }

    show() {
        if (!this.root) return;
        this.visible = true;
        this.root.style.display = 'block';
        this.root.classList.add('show');
    }

    hide() {
        if (!this.root) return;
        this.visible = false;
        this.root.classList.remove('show');
        this.root.style.display = 'none';
    }

    updatePosition() {
        if (!this.visible || !this.root) return;
        const game = this.gameGetter();
        const player = game?.player;
        const camera = game?.camera;
        const canvas = game?.canvas;
        const rect = canvas?.getBoundingClientRect?.();
        if (!player || !camera || !rect) return;
        const line = this.getCurrentLine();
        let worldX = Number.isFinite(player.cx) ? player.cx : player.x;
        let worldY = (Number.isFinite(player.cy) ? player.cy : player.y) - ((player.height || player.size || 64) * 0.86);

        if (line?.targetGetter) {
            const target = line.targetGetter(game, line) || null;
            if (target) {
                worldX = Number.isFinite(target.x) ? target.x : worldX;
                worldY = Number.isFinite(target.y) ? target.y : worldY;
                if (Number.isFinite(target.height)) worldY -= target.height * 0.86;
            }
        } else if (line?.anchor === 'boss') {
            const boss = game?.floor7AwakeningSystem?.getBossEnemy?.(game.curRoom);
            if (boss) {
                worldX = Number.isFinite(boss.cx) ? boss.cx : (Number.isFinite(boss.x) ? boss.x : worldX);
                const baseY = Number.isFinite(boss.cy) ? boss.cy : (Number.isFinite(boss.y) ? boss.y : worldY);
                worldY = baseY - ((boss.drawSize || boss.size || boss.height || 100) * 0.9);
            }
        } else if (Number.isFinite(line?.worldX) && Number.isFinite(line?.worldY)) {
            worldX = line.worldX;
            worldY = line.worldY;
        }
        if (Number.isFinite(line?.offsetY)) worldY += line.offsetY;

        const pos = camera.worldToScreen(worldX, worldY);
        const scaleX = rect.width / Math.max(canvas.width || rect.width, 1);
        const scaleY = rect.height / Math.max(canvas.height || rect.height, 1);
        this.root.style.left = `${rect.left + pos.x * scaleX}px`;
        this.root.style.top = `${rect.top + pos.y * scaleY}px`;
    }

    advanceLine() {
        if (!this.activeSequence) return;
        this.lineIndex += 1;
        if (this.lineIndex >= this.activeSequence.lines.length) {
            this.finishSequence(false);
            return;
        }
        const line = this.activeSequence.lines[this.lineIndex];
        this.lineElapsed = -this.activeSequence.gap;
        this.lineDuration = this.computeLineDuration(line);
        this.resetTyping(line);
        this.show();
    }

    tick(ts) {
        const dt = this.lastTs ? Math.min(0.1, (ts - this.lastTs) / 1000) : 0;
        this.lastTs = ts;

        if (this.activeSequence) {
            this.lineElapsed += dt;
            if (this.lineElapsed < 0) {
                this.hide();
            } else {
                this.show();
                const line = this.getCurrentLine();
                if (line) {
                    const chars = Array.from(String(line.text || ''));
                    const step = this.getLineTypeStep(line);
                    this.typeAccumulator += dt;
                    while (this.visibleChars < chars.length && this.typeAccumulator >= step) {
                        this.typeAccumulator -= step;
                        this.visibleChars += 1;
                    }
                    const typedText = chars.slice(0, this.visibleChars).join('');
                    this.setText(line, typedText);
                }
                if (this.lineElapsed >= this.lineDuration) {
                    this.advanceLine();
                }
            }
        }

        this.updatePosition();
        this.rafId = requestAnimationFrame(this.tick);
    }

    destroy() {
        if (this.rafId) cancelAnimationFrame(this.rafId);
        this.rafId = 0;
        this.stop();
        if (this.root?.parentNode) this.root.parentNode.removeChild(this.root);
        this.root = null;
        this.textEl = null;
    }
}

window.PlayerOverheadDialogue = PlayerOverheadDialogue;
