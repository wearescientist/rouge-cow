(function attachAudioRuntimeBridge(global) {
    'use strict';

    if (global.AudioRuntimeBridge) return;

    function getAudioCtor() {
        return global.AudioContext || global.webkitAudioContext || null;
    }

    function getGameAudio() {
        return global.game && global.game.audio ? global.game.audio : null;
    }

    function getDestination(ctx) {
        const gameAudio = getGameAudio();
        if (gameAudio && gameAudio.masterGain && typeof gameAudio.masterGain.connect === 'function' && gameAudio.ctx === ctx) {
            return gameAudio.masterGain;
        }
        return ctx.destination;
    }

    const bridge = {
        _ctx: null,

        getContext(preferredCtx = null) {
            let ctx = preferredCtx || getGameAudio()?.ctx || bridge._ctx || null;
            if (!ctx) {
                const AudioCtor = getAudioCtor();
                if (!AudioCtor) return null;
                try {
                    ctx = new AudioCtor();
                    bridge._ctx = ctx;
                } catch (e) {
                    return null;
                }
            } else if (!bridge._ctx && ctx !== getGameAudio()?.ctx) {
                bridge._ctx = ctx;
            }

            try {
                if (ctx.state === 'suspended' && typeof ctx.resume === 'function') {
                    ctx.resume().catch(() => {});
                }
            } catch (e) {}
            return ctx;
        },

        playPulse(options = {}) {
            const ctx = bridge.getContext(options.ctx || null);
            if (!ctx) return;
            try {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                const destination = getDestination(ctx);
                osc.connect(gain);
                gain.connect(destination);

                const now = ctx.currentTime;
                const type = options.type || 'triangle';
                const startFreq = Math.max(40, Number.isFinite(options.startFreq) ? options.startFreq : 220);
                const endFreq = Math.max(30, Number.isFinite(options.endFreq) ? options.endFreq : Math.max(80, startFreq * 0.78));
                const volume = Math.max(0.0001, Math.min(0.2, Number.isFinite(options.volume) ? options.volume : 0.05));
                const duration = Math.max(0.015, Math.min(0.2, Number.isFinite(options.duration) ? options.duration : 0.05));
                const attack = Math.max(0, Math.min(duration * 0.35, Number.isFinite(options.attack) ? options.attack : 0));

                osc.type = type;
                osc.frequency.setValueAtTime(startFreq, now);
                if (Math.abs(endFreq - startFreq) > 1) {
                    osc.frequency.exponentialRampToValueAtTime(endFreq, now + duration);
                }

                gain.gain.cancelScheduledValues(now);
                gain.gain.setValueAtTime(0.0001, now);
                gain.gain.linearRampToValueAtTime(volume, now + attack);
                gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

                osc.start(now);
                osc.stop(now + duration);
            } catch (e) {}
        }
    };

    global.AudioRuntimeBridge = bridge;
})(window);
