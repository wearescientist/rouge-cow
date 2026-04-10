class CinematicSubtitleSystem {
    constructor(options = {}) {
        this.gameGetter = options.gameGetter || (() => window.game);
        this.sequence = null;
        this.index = 0;
        this.lineElapsed = 0;
        this.lineDuration = 0;
        this.visibleChars = 0;
        this.typeAccumulator = 0;
    }

    getGame() {
        return this.gameGetter ? this.gameGetter() : window.game;
    }

    normalizeLines(lines = []) {
        return (Array.isArray(lines) ? lines : [])
            .map((line) => {
                if (typeof line === 'string') return { text: line.trim() };
                if (!line || typeof line !== 'object') return null;
                const text = typeof line.text === 'string' ? line.text.trim() : '';
                const displayText = typeof line.displayText === 'string' ? line.displayText.trim() : '';
                if (!text && !displayText) return null;
                return {
                    speaker: line.speaker || '',
                    name: line.name || '',
                    text,
                    displayText,
                    duration: Number.isFinite(line.duration) ? line.duration : null
                };
            })
            .filter(Boolean);
    }

    getDisplayText(line = {}) {
        if (line.displayText) return line.displayText;
        if (line.name && line.text) return `${line.name}：${line.text}`;
        return line.text || '';
    }

    estimateDuration(line = {}, defaultDuration = null) {
        if (Number.isFinite(line.duration) && line.duration > 0) return line.duration;
        if (Number.isFinite(defaultDuration) && defaultDuration > 0) return defaultDuration;
        const length = Array.from(this.getDisplayText(line)).length;
        const typing = Math.max(0.55, length * 0.052);
        const reading = Math.max(1.8, Math.min(5.2, 1.35 + length * 0.05));
        return typing + reading;
    }

    getTypeStep(line = {}) {
        const length = Array.from(this.getDisplayText(line)).length;
        if (length <= 10) return 0.042;
        if (length <= 24) return 0.036;
        return 0.032;
    }

    syncLineDuration() {
        const line = this.sequence?.lines?.[this.index];
        this.lineDuration = line ? this.estimateDuration(line, this.sequence.defaultDuration) : 0;
    }

    playLines(lines, options = {}) {
        const normalized = this.normalizeLines(lines);
        if (normalized.length <= 0) {
            this.clear({ suppressComplete: true });
            return false;
        }

        this.sequence = {
            lines: normalized,
            lockPlayer: !!options.lockPlayer,
            gap: Number.isFinite(options.gap) ? Math.max(0, options.gap) : 0.16,
            defaultDuration: Number.isFinite(options.defaultDuration) ? options.defaultDuration : null,
            onComplete: typeof options.onComplete === 'function' ? options.onComplete : null
        };
        this.index = 0;
        this.lineElapsed = 0;
        this.visibleChars = 0;
        this.typeAccumulator = 0;
        this.syncLineDuration();
        return true;
    }

    finishSequence(suppressComplete = false) {
        const onComplete = !suppressComplete ? this.sequence?.onComplete : null;
        this.sequence = null;
        this.index = 0;
        this.lineElapsed = 0;
        this.lineDuration = 0;
        this.visibleChars = 0;
        this.typeAccumulator = 0;
        if (typeof onComplete === 'function') onComplete();
    }

    clear(options = {}) {
        this.finishSequence(!!options.suppressComplete);
    }

    isBusy() {
        return !!this.sequence;
    }

    isPlayerLocked() {
        return !!(this.sequence?.lockPlayer);
    }

    update(dt) {
        if (!this.sequence || !(dt >= 0)) return;
        this.lineElapsed += dt;
        const line = this.sequence.lines[this.index];
        if (line && this.lineElapsed >= 0) {
            const chars = Array.from(this.getDisplayText(line));
            const step = this.getTypeStep(line);
            this.typeAccumulator += dt;
            while (this.visibleChars < chars.length && this.typeAccumulator >= step) {
                this.typeAccumulator -= step;
                this.visibleChars += 1;
            }
        }
        if (this.lineElapsed < this.lineDuration) return;

        this.index += 1;
        if (this.index >= this.sequence.lines.length) {
            this.finishSequence(false);
            return;
        }

        this.lineElapsed = -this.sequence.gap;
        this.visibleChars = 0;
        this.typeAccumulator = 0;
        this.syncLineDuration();
    }

    draw(ctx) {
        if (!ctx || !this.sequence) return;
        const line = this.sequence.lines[this.index];
        if (!line || this.lineElapsed < 0) return;

        const game = this.getGame();
        const canvas = ctx.canvas || game?.canvas;
        const width = canvas?.width || 900;
        const height = canvas?.height || 600;
        const fullText = this.getDisplayText(line);
        const text = Array.from(fullText).slice(0, this.visibleChars).join('');
        const progress = this.lineDuration > 0 ? Math.min(1, this.lineElapsed / this.lineDuration) : 1;
        const fadeIn = Math.min(1, progress * 4.2);
        const fadeOut = Math.min(1, Math.max(0, this.lineDuration - this.lineElapsed) * 4.8);
        const alpha = Math.max(0, Math.min(fadeIn, fadeOut));

        const compact = !!(game?.isMobileDevice || (typeof window !== 'undefined' && (window.innerWidth <= 900 || window.innerHeight <= 620)));
        const fontSize = compact ? 18 : 26;
        const sidePad = compact ? 56 : 120;
        const bubbleInset = compact ? 42 : 64;
        const bubbleHeight = compact ? 58 : 72;
        const yOffset = compact ? 58 : 78;

        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.font = `${fontSize}px "ZCOOL KuaiLe Local", sans-serif`;

        const maxWidth = Math.min(compact ? 520 : 720, width - sidePad);
        const metrics = ctx.measureText(text);
        const bubbleWidth = Math.min(maxWidth, Math.max(compact ? 180 : 260, metrics.width + bubbleInset));
        const x = width * 0.5;
        const y = height - yOffset;

        ctx.fillStyle = 'rgba(5, 8, 14, 0.76)';
        ctx.strokeStyle = 'rgba(255, 246, 215, 0.18)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(x - bubbleWidth * 0.5, y - bubbleHeight * 0.5, bubbleWidth, bubbleHeight, 18);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#f7f2e6';
        ctx.shadowColor = 'rgba(255, 226, 162, 0.24)';
        ctx.shadowBlur = 10;
        ctx.fillText(text, x, y + 1);
        ctx.restore();
    }
}

window.CinematicSubtitleSystem = CinematicSubtitleSystem;
