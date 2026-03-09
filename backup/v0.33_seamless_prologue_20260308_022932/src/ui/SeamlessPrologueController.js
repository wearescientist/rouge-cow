class SeamlessPrologueController {
    constructor(options = {}) {
        this.onComplete = options.onComplete || (() => {});
        this.onSkip = options.onSkip || (() => {});
        this.menuRoot = document.getElementById('mainMenu');
        this.root = null;
        this.stage = null;
        this.bubble = null;
        this.skipHint = null;
        this.bridgeText = null;
        this.blackout = null;
        this.scenes = this.createScenes();
        this.images = new Map();
        this.currentSceneIndex = -1;
        this.currentLineIndex = -1;
        this.sceneTimer = null;
        this.lineTimer = null;
        this.finishTimer = null;
        this.typingTimer = null;
        this.active = false;
        this.isTyping = false;
        this.currentTypingText = '';
        this.currentTypingIndex = 0;
        this.audioCtx = null;
        this.audioReady = false;
        this.lastVoiceAt = 0;
        this._initialized = false;
        this._boundAdvance = this.handleAdvance.bind(this);
    }

    createScenes() {
        return [
            {
                key: 'menu_hold',
                useMenuBackground: true,
                duration: 11400,
                transitionToBlack: 1600,
                bubbles: [
                    { delay: 1400, text: '终于到家了。。。', width: '420px' },
                    { delay: 5200, text: '这。。。发生了什么。。。', width: '520px' }
                ]
            },
            {
                key: 'empty_home',
                image: 'assets/sprites/story/start2.png',
                duration: 11800,
                transitionToBlack: 1700,
                motionClass: 'scene-drift-in',
                bubbles: [
                    { delay: 1700, text: '爸！妈！你们在哪！', width: '500px' },
                    { delay: 6000, text: '其他人都去哪了！', width: '460px' }
                ]
            },
            {
                key: 'note',
                image: 'assets/sprites/story/start3.png',
                duration: 12600,
                transitionToBlack: 1800,
                motionClass: 'scene-drift-soft',
                bubbles: [
                    { delay: 1800, text: '“别来找我们，活下去。”', width: '540px', soft: true },
                    { delay: 6900, text: '你们知道的。。。从小我就不听话。。。', width: '620px', soft: true }
                ]
            },
            {
                key: 'descent',
                image: 'assets/sprites/story/start4.png',
                duration: 13200,
                motionClass: 'scene-drift-up',
                bubbles: [
                    { delay: 2100, text: '师傅。。。我可以做到吗？', width: '500px' },
                    { delay: 7600, text: '爸爸妈妈！你们等着，我来救你们了！', width: '640px' }
                ],
                bridgeText: '先拿个像样的家伙，再下去找你们。'
            }
        ];
    }

    init() {
        if (this._initialized) return;

        const style = document.createElement('style');
        style.textContent = `
            .seamless-prologue {
                position: fixed;
                inset: 0;
                z-index: 2100;
                display: none;
                overflow: hidden;
                pointer-events: auto;
                background: transparent;
                color: #fff;
                font-family: var(--font-main);
            }
            .seamless-prologue__stage {
                position: absolute;
                inset: 0;
            }
            .seamless-prologue__scene {
                position: absolute;
                inset: 0;
                opacity: 0;
                transition: opacity 1.5s ease;
                will-change: opacity, transform;
            }
            .seamless-prologue__scene.active {
                opacity: 1;
            }
            .seamless-prologue__scene img {
                position: absolute;
                left: 50%;
                top: 50%;
                width: auto;
                height: 100%;
                max-width: none;
                transform: translate3d(-50%, -50%, 0) scale(1);
                animation-duration: 10.8s;
                animation-timing-function: ease-in-out;
                animation-fill-mode: forwards;
                filter: saturate(0.95) brightness(0.95);
            }
            .seamless-prologue__veil {
                position: absolute;
                inset: 0;
                z-index: 1;
                background:
                    linear-gradient(180deg, rgba(5, 8, 14, 0.16), rgba(6, 8, 14, 0.22) 48%, rgba(5, 8, 14, 0.42)),
                    radial-gradient(circle at 50% 78%, rgba(0, 0, 0, 0), rgba(0, 0, 0, 0.32) 72%);
                pointer-events: none;
            }
            .seamless-prologue__blackout {
                position: absolute;
                inset: 0;
                z-index: 2;
                background: #000;
                opacity: 0;
                pointer-events: none;
                transition: opacity 1.25s ease;
            }
            .seamless-prologue__blackout.show {
                opacity: 1;
            }
            .seamless-prologue__bubble {
                position: absolute;
                left: 50%;
                bottom: 10%;
                z-index: 3;
                transform: translateX(-50%) translateY(10px);
                width: min(80vw, 780px);
                min-height: 88px;
                padding: 16px 24px 18px;
                border-radius: 16px;
                background: linear-gradient(180deg, rgba(6, 8, 14, 0.66), rgba(4, 6, 12, 0.84));
                border: 1px solid rgba(255, 255, 255, 0.10);
                box-shadow: 0 18px 44px rgba(0, 0, 0, 0.34);
                color: rgba(248, 245, 238, 0.98);
                font-size: 28px;
                line-height: 1.7;
                letter-spacing: 0.5px;
                text-align: center;
                opacity: 0;
                transition: opacity 0.45s ease, transform 0.45s ease;
                white-space: pre-wrap;
            }
            .seamless-prologue__bubble.show {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
            .seamless-prologue__bubble.soft {
                background: linear-gradient(180deg, rgba(10, 10, 12, 0.56), rgba(5, 5, 8, 0.76));
                border-color: rgba(255, 255, 255, 0.06);
            }
            .seamless-prologue__bridge {
                position: absolute;
                left: 50%;
                bottom: 14%;
                z-index: 4;
                transform: translateX(-50%);
                color: rgba(255, 255, 255, 0.98);
                font-size: 30px;
                line-height: 1.5;
                letter-spacing: 0.6px;
                text-shadow: 0 4px 18px rgba(0, 0, 0, 0.58);
                opacity: 0;
                transition: opacity 0.8s ease;
                white-space: nowrap;
            }
            .seamless-prologue__bridge.show {
                opacity: 1;
            }
            .seamless-prologue__skip {
                position: absolute;
                right: 26px;
                bottom: 22px;
                z-index: 4;
                color: rgba(255, 255, 255, 0.74);
                font-size: 14px;
                letter-spacing: 1px;
            }
            .scene-drift-in img { animation-name: seamlessSceneDriftIn; }
            .scene-drift-soft img { animation-name: seamlessSceneDriftSoft; }
            .scene-drift-up img { animation-name: seamlessSceneDriftUp; }
            @keyframes seamlessSceneDriftIn {
                from { transform: translate3d(-50%, -50%, 0) scale(1.01); }
                to { transform: translate3d(-50%, calc(-50% - 12px), 0) scale(1.045); }
            }
            @keyframes seamlessSceneDriftSoft {
                from { transform: translate3d(-50%, -50%, 0) scale(1.015); }
                to { transform: translate3d(calc(-50% + 10px), calc(-50% - 8px), 0) scale(1.04); }
            }
            @keyframes seamlessSceneDriftUp {
                from { transform: translate3d(-50%, -50%, 0) scale(1.02); }
                to { transform: translate3d(-50%, calc(-50% - 14px), 0) scale(1.055); }
            }
            @media (max-width: 800px) {
                .seamless-prologue__bubble {
                    width: min(88vw, 560px);
                    bottom: 12%;
                    min-height: 72px;
                    padding: 12px 16px 14px;
                    font-size: 20px;
                    line-height: 1.6;
                }
                .seamless-prologue__bridge {
                    bottom: 18%;
                    width: min(78vw, 360px);
                    white-space: normal;
                    text-align: center;
                    font-size: 21px;
                }
            }
        `;
        document.head.appendChild(style);

        this.root = document.createElement('div');
        this.root.className = 'seamless-prologue';
        this.root.innerHTML = `
            <div class="seamless-prologue__stage"></div>
            <div class="seamless-prologue__veil"></div>
            <div class="seamless-prologue__blackout"></div>
            <div class="seamless-prologue__bubble"></div>
            <div class="seamless-prologue__bridge"></div>
            <div class="seamless-prologue__skip">按任意键或点击跳过</div>
        `;
        document.body.appendChild(this.root);

        this.stage = this.root.querySelector('.seamless-prologue__stage');
        this.bubble = this.root.querySelector('.seamless-prologue__bubble');
        this.bridgeText = this.root.querySelector('.seamless-prologue__bridge');
        this.skipHint = this.root.querySelector('.seamless-prologue__skip');
        this.blackout = this.root.querySelector('.seamless-prologue__blackout');

        this.root.addEventListener('click', this._boundAdvance);
        document.addEventListener('keydown', this._boundAdvance);

        this.preload();
        this._initialized = true;
    }

    preload() {
        for (const scene of this.scenes) {
            if (!scene.image || this.images.has(scene.image)) continue;
            const img = new Image();
            img.src = scene.image;
            this.images.set(scene.image, img);
        }
    }

    async play() {
        this.init();
        this.stopTimers();
        this.active = true;
        this.currentSceneIndex = -1;
        this.currentLineIndex = -1;
        this.root.style.display = 'block';
        this.blackout.classList.remove('show');
        this.bridgeText.classList.remove('show');
        this.bridgeText.textContent = '';
        this.hideBubble();
        this.stage.innerHTML = '';
        this.primeAudio();
        await this.nextScene();
    }

    async nextScene() {
        this.currentSceneIndex += 1;
        this.currentLineIndex = -1;

        if (this.currentSceneIndex >= this.scenes.length) {
            this.finish();
            return;
        }

        const scene = this.scenes[this.currentSceneIndex];
        this.renderScene(scene);
        this.scheduleScene(scene);
        requestAnimationFrame(() => this.blackout.classList.remove('show'));
    }

    renderScene(scene) {
        const previous = this.stage.querySelector('.seamless-prologue__scene.active');
        if (previous) {
            previous.classList.remove('active');
            setTimeout(() => previous.remove(), 1900);
        }

        if (scene.useMenuBackground) {
            this.hideBubble();
            return;
        }

        const sceneEl = document.createElement('div');
        sceneEl.className = `seamless-prologue__scene ${scene.motionClass || ''}`;

        const img = this.images.get(scene.image) || new Image();
        if (!img.src) img.src = scene.image;

        const imgEl = document.createElement('img');
        imgEl.src = img.src;
        imgEl.alt = '';

        sceneEl.appendChild(imgEl);
        this.stage.appendChild(sceneEl);
        requestAnimationFrame(() => sceneEl.classList.add('active'));
        this.hideBubble();
    }

    scheduleScene(scene) {
        this.stopLineTimer();
        const lines = [...scene.bubbles];

        const showNextLine = () => {
            this.currentLineIndex += 1;
            if (this.currentLineIndex >= lines.length) return;

            const line = lines[this.currentLineIndex];
            this.typeBubble(line);

            const nextLine = lines[this.currentLineIndex + 1];
            if (nextLine) {
                this.lineTimer = setTimeout(showNextLine, Math.max(2200, nextLine.delay - line.delay));
            }
        };

        if (lines.length > 0) {
            this.lineTimer = setTimeout(showNextLine, lines[0].delay);
        }

        this.sceneTimer = setTimeout(() => {
            if (scene.bridgeText) {
                this.showBridgeText(scene.bridgeText);
                this.finishTimer = setTimeout(() => this.finish(), 2600);
                return;
            }

            this.transitionToNextScene(scene.transitionToBlack || 1600);
        }, scene.duration);
    }

    transitionToNextScene(duration) {
        this.stopSceneTimer();
        this.stopLineTimer();
        this.stopTyping();
        this.hideBubble();
        this.blackout.classList.add('show');
        this.finishTimer = setTimeout(() => {
            this.bridgeText.classList.remove('show');
            this.nextScene();
        }, duration);
    }

    typeBubble(line) {
        this.stopTyping();
        this.currentTypingText = line.text;
        this.currentTypingIndex = 0;
        this.isTyping = true;

        this.bubble.classList.toggle('soft', !!line.soft);
        this.bubble.style.width = line.width || '560px';
        this.bubble.textContent = '';
        this.bubble.classList.add('show');

        const step = () => {
            if (!this.isTyping) return;

            this.currentTypingIndex += 1;
            this.bubble.textContent = this.currentTypingText.slice(0, this.currentTypingIndex);
            this.playVoiceTick(this.currentTypingText[this.currentTypingIndex - 1]);

            if (this.currentTypingIndex >= this.currentTypingText.length) {
                this.isTyping = false;
                this.typingTimer = null;
                return;
            }

            this.typingTimer = setTimeout(
                step,
                this.getTypeDelay(this.currentTypingText[this.currentTypingIndex - 1])
            );
        };

        this.typingTimer = setTimeout(step, 280);
    }

    completeCurrentTyping() {
        if (!this.isTyping) return;
        this.stopTyping();
        this.bubble.textContent = this.currentTypingText;
    }

    hideBubble() {
        this.stopTyping();
        this.bubble.classList.remove('show');
        this.bubble.classList.remove('soft');
    }

    showBridgeText(text) {
        this.hideBubble();
        this.bridgeText.textContent = text;
        this.bridgeText.classList.add('show');
    }

    handleAdvance(event) {
        if (!this.active) return;
        if (event.type === 'keydown' && ['Shift', 'Control', 'Alt', 'Meta', 'Tab'].includes(event.key)) {
            return;
        }

        this.primeAudio();

        const scene = this.scenes[this.currentSceneIndex];
        if (!scene) return;

        if (this.isTyping) {
            this.completeCurrentTyping();
            return;
        }

        if (this.currentLineIndex < scene.bubbles.length - 1) {
            this.stopLineTimer();
            this.currentLineIndex += 1;
            this.typeBubble(scene.bubbles[this.currentLineIndex]);
            return;
        }

        if (this.currentSceneIndex < this.scenes.length - 1) {
            this.transitionToNextScene(scene.transitionToBlack || 1600);
            return;
        }

        this.skip();
    }

    skip() {
        if (!this.active) return;
        this.onSkip();
        this.finish();
    }

    finish() {
        if (!this.active) return;
        this.active = false;
        this.stopTimers();
        this.root.style.display = 'none';
        this.blackout.classList.remove('show');
        this.bridgeText.classList.remove('show');
        this.hideBubble();
        this.onComplete();
    }

    stopTimers() {
        this.stopSceneTimer();
        this.stopLineTimer();
        this.stopTyping();
        if (this.finishTimer) {
            clearTimeout(this.finishTimer);
            this.finishTimer = null;
        }
    }

    stopSceneTimer() {
        if (this.sceneTimer) {
            clearTimeout(this.sceneTimer);
            this.sceneTimer = null;
        }
    }

    stopLineTimer() {
        if (this.lineTimer) {
            clearTimeout(this.lineTimer);
            this.lineTimer = null;
        }
    }

    stopTyping() {
        if (this.typingTimer) {
            clearTimeout(this.typingTimer);
            this.typingTimer = null;
        }
        this.isTyping = false;
    }

    getTypeDelay(char) {
        if (/[。！？…]/.test(char)) return 380;
        if (/[，、】【]/.test(char)) return 260;
        return 150;
    }

    primeAudio() {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;

        if (!this.audioCtx) {
            try {
                this.audioCtx = new Ctx();
            } catch (error) {
                return;
            }
        }

        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume().catch(() => {});
        }

        if (this.audioReady) return;

        try {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = 'square';
            osc.frequency.value = 320;
            gain.gain.value = 0.0001;
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);

            const t = this.audioCtx.currentTime;
            gain.gain.setValueAtTime(0.0001, t);
            gain.gain.linearRampToValueAtTime(0.003, t + 0.008);
            gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.035);
            osc.start(t);
            osc.stop(t + 0.04);
            this.audioReady = true;
        } catch (error) {
            this.audioReady = false;
        }
    }

    playVoiceTick(char) {
        if (!char || /\s/.test(char)) return;

        const now = performance.now();
        if (now - this.lastVoiceAt < 112) return;
        this.lastVoiceAt = now;

        const Ctx = window.AudioContext || window.webkitAudioContext;
        if (!Ctx) return;

        if (!this.audioCtx) return;

        if (this.audioCtx.state === 'suspended') {
            this.audioCtx.resume().catch(() => {});
        }

        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'square';
        osc.frequency.value = /[。！？…，、】【]/.test(char) ? 340 : 430;
        gain.gain.value = 0.0001;
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        const t = this.audioCtx.currentTime;
        gain.gain.setValueAtTime(0.0001, t);
        gain.gain.linearRampToValueAtTime(0.018, t + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
        osc.start(t);
        osc.stop(t + 0.14);
    }
}

window.SeamlessPrologueController = SeamlessPrologueController;
