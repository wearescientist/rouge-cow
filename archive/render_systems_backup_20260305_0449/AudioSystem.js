// 音频系统 - 使用外部音频文件 + BGM合成
// 合成音效数据保留但停用，仅使用外部文件
class AudioSystem {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.masterVolume = 0.4;
        this.bgmVolume = 0.3;
        this.sfxVolume = 0.4;
        this.currentBGM = null;
        this.bgmLoopTimer = null;
        this.lastPlayTime = {};
        
        // BGM配置（从sfx_config.json读取）
        this.bgmConfigs = {
            menu: {
                tempo: 87,
                scale: [0, 4, 7],  // 回到原来的音阶
                bars: 19,
                style: 'ambient',
                instruments: ['pad', 'bell', 'bass'],
                baseFreq: 220  // 标准A3
            },
            normal: {
                tempo: 118,
                scale: [0, 5, 7],
                bars: 24,
                style: 'groove',
                instruments: ['drum', 'bass', 'chord', 'arp'],
                baseFreq: 220
            },
            elite: {
                tempo: 127,
                scale: [0, 5, 7],
                bars: 20,
                style: 'intense',
                instruments: ['drum_heavy', 'bass_aggressive', 'chord', 'lead'],
                baseFreq: 220
            },
            boss: {
                tempo: 143,
                scale: [0, 4, 7],
                bars: 31,
                style: 'epic',
                instruments: ['drum_epic', 'bass_dark', 'orch', 'choir'],
                baseFreq: 220
            },
            victory: {
                tempo: 135,
                scale: [0, 3, 7],
                bars: 21,
                style: 'celebration',
                instruments: ['drum', 'bass', 'brass', 'bell'],
                baseFreq: 220
            }
        };
        
        // BGM循环间隔（毫秒，根据配置计算）
        this.bgmLoopDuration = {
            menu: 55000,    // ~55秒
            normal: 53000,  // ~53秒
            elite: 59500,   // ~59秒
            boss: 57900,    // ~58秒
            victory: 37700  // ~38秒
        };
    }

    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            this.masterGain = this.ctx.createGain();
            this.masterGain.gain.value = this.masterVolume;
            this.masterGain.connect(this.ctx.destination);
            
            this.bgmGain = this.ctx.createGain();
            this.bgmGain.gain.value = this.bgmVolume;
            this.bgmGain.connect(this.masterGain);
            
            // 加载保存的音量
            const savedMaster = localStorage.getItem('rougecow_masterVolume');
            const savedBgm = localStorage.getItem('rougecow_bgmVolume');
            const savedSfx = localStorage.getItem('rougecow_sfxVolume');
            if (savedMaster) this.masterVolume = parseFloat(savedMaster);
            if (savedBgm) this.bgmVolume = parseFloat(savedBgm);
            if (savedSfx) this.sfxVolume = parseFloat(savedSfx);
            
            console.log('[Audio] 初始化完成');
            return true;
        } catch (e) {
            console.warn('[Audio] 初始化失败:', e);
            this.enabled = false;
            return false;
        }
    }

    // BGM 循环播放 - 暂时禁用，等待外部BGM文件
    playBGM(type) {
        // BGM暂时禁用
        return;
        
        if (!this.enabled || !this.ctx || this.currentBGM === type) return;
        this.stopBGM();
        
        const config = this.bgmConfigs[type];
        if (!config) return;
        
        this.currentBGM = type;
        this._playBGMLoop(type, config);
        
        console.log(`[Audio] 播放BGM: ${type}`);
    }

    _playBGMLoop(type, config) {
        if (this.currentBGM !== type) return;
        
        const t = this.ctx.currentTime;
        const beatTime = 60 / config.tempo;
        const loopBeats = 8;
        
        // 根据风格播放不同的BGM层
        this._playDrumLayer(t, beatTime, loopBeats, config);
        this._playBassLayer(t, beatTime, loopBeats, config);
        this._playChordLayer(t, beatTime, loopBeats, config);
        
        // 设置循环定时器 - 和原来一样
        this.bgmLoopTimer = setTimeout(() => {
            this._playBGMLoop(type, config);
        }, 8000 * beatTime);
    }
    
    // 鼓点层
    _playDrumLayer(startTime, beatTime, beats, config) {
        const vol = this.bgmVolume;
        
        for (let i = 0; i < beats; i++) {
            const time = startTime + i * beatTime;
            
            // Kick on beat 1, 5
            if (i % 4 === 0) {
                this._playKick(time, vol * 0.4);
            }
            
            // Hi-hat on every beat
            if (config.style !== 'ambient') {
                this._playHiHat(time + beatTime * 0.5, vol * 0.2);
            }
            
            // Snare on beat 3, 7 (groove, intense, epic)
            if ((i === 2 || i === 6) && ['groove', 'intense', 'epic'].includes(config.style)) {
                this._playSnare(time, vol * 0.3);
            }
        }
    }
    
    // 贝斯层
    _playBassLayer(startTime, beatTime, beats, config) {
        const vol = this.bgmVolume;
        const baseFreq = config.style === 'ambient' ? 110 : 55; // ambient用更高音
        
        for (let i = 0; i < beats; i += 2) {
            const time = startTime + i * beatTime;
            const note = config.scale[i % config.scale.length];
            const freq = baseFreq * Math.pow(2, note / 12);
            
            // ambient风格用更长的音符
            const duration = config.style === 'ambient' ? beatTime * 4 : beatTime * 2;
            this._playBassNote(time, freq, duration, vol * 0.3);
        }
    }
    
    // 和弦层
    _playChordLayer(startTime, beatTime, beats, config) {
        if (!['celebration', 'epic'].includes(config.style)) return;
        
        const vol = this.bgmVolume * 0.2;
        const baseFreq = 220;
        
        // 每4拍一个和弦
        for (let i = 0; i < beats; i += 4) {
            const time = startTime + i * beatTime;
            
            config.scale.forEach((note, idx) => {
                const freq = baseFreq * Math.pow(2, (note + idx * 12) / 12);
                this._playPadNote(time, freq, beatTime * 4, vol);
            });
        }
    }
    
    // 鼓点合成
    _playKick(time, volume) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.frequency.setValueAtTime(150, time);
        osc.frequency.exponentialRampToValueAtTime(40, time + 0.1);
        
        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
        
        osc.connect(gain);
        gain.connect(this.bgmGain);
        
        osc.start(time);
        osc.stop(time + 0.15);
    }
    
    _playSnare(time, volume) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(200, time);
        
        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.1);
        
        osc.connect(gain);
        gain.connect(this.bgmGain);
        
        osc.start(time);
        osc.stop(time + 0.1);
    }
    
    _playHiHat(time, volume) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'square';
        osc.frequency.setValueAtTime(800, time);
        
        gain.gain.setValueAtTime(volume, time);
        gain.gain.exponentialRampToValueAtTime(0.001, time + 0.05);
        
        osc.connect(gain);
        gain.connect(this.bgmGain);
        
        osc.start(time);
        osc.stop(time + 0.05);
    }
    
    _playBassNote(time, freq, duration, volume) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, time);
        
        gain.gain.setValueAtTime(volume, time);
        gain.gain.setValueAtTime(volume, time + duration * 0.8);
        gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
        
        osc.connect(gain);
        gain.connect(this.bgmGain);
        
        osc.start(time);
        osc.stop(time + duration);
    }
    
    _playPadNote(time, freq, duration, volume) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, time);
        
        gain.gain.setValueAtTime(0, time);
        gain.gain.linearRampToValueAtTime(volume, time + 0.1);
        gain.gain.setValueAtTime(volume, time + duration - 0.1);
        gain.gain.linearRampToValueAtTime(0, time + duration);
        
        osc.connect(gain);
        gain.connect(this.bgmGain);
        
        osc.start(time);
        osc.stop(time + duration);
    }

    stopBGM() {
        if (this.bgmLoopTimer) {
            clearTimeout(this.bgmLoopTimer);
            this.bgmLoopTimer = null;
        }
        this.currentBGM = null;
    }

    // ========================================
    // 以下合成音效方法已停用，保留数据供参考
    // 实际音效由 AudioController 通过外部文件播放
    // ========================================
    
    playSFX(type, volume = 1) {
        // 已停用 - 由 AudioController 处理
        // 保留方法签名以兼容旧代码
        console.log(`[Audio] 合成音效已停用: ${type}`);
    }

    playCrit(material, volume = 1) {
        // 已停用
    }
    
    playHit(material, volume = 1) {
        // 已停用
    }
    
    playWeapon(type, volume = 1) {
        // 已停用
    }

    // 音量控制
    setMasterVolume(v) {
        this.masterVolume = Math.max(0, Math.min(1, v));
        if (this.masterGain) this.masterGain.gain.value = this.masterVolume;
        localStorage.setItem('rougecow_masterVolume', this.masterVolume);
    }

    setBGMVolume(v) {
        this.bgmVolume = Math.max(0, Math.min(1, v));
        if (this.bgmGain) this.bgmGain.gain.value = this.bgmVolume;
        localStorage.setItem('rougecow_bgmVolume', this.bgmVolume);
    }

    setSfxVolume(v) {
        this.sfxVolume = Math.max(0, Math.min(1, v));
        localStorage.setItem('rougecow_sfxVolume', this.sfxVolume);
    }

    // 预加载（空实现兼容）
    preloadSFX(types) {
        return Promise.resolve();
    }

    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }
}

// 导出
window.AudioSystem = AudioSystem;
