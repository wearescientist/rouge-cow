// 音频系统 - 使用外部音频文件 + BGM合成
// 合成音效数据保留但停用，仅使用外部文件
class AudioSystem {
    constructor() {
        this.ctx = null;
        this.enabled = true;
        this.masterVolume = 0.6;  // v0.26-fix: 降低主音量防止失真
        this.bgmVolume = 0.3;
        this.sfxVolume = 1.0;       // v0.26-fix: 音效总音量保持1.0，由AudioController单独控制
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
        
        // BGM文件配置 (v0.30: 改用外部BGM文件)
        this.bgmFiles = {
            menu:   'bgm/bgm_menu_90bpm.wav',
            normal: 'bgm/bgm_normal_109bpm.wav',
            elite:  'bgm/bgm_elite_143bpm.wav',
            boss:   'bgm/bgm_boss_135bpm.wav'
        };
        
        // BGM音频缓存
        this.bgmCache = {};
        this.bgmSource = null;
        this.bgmBuffer = null;
        this.basePath = 'assets/runtime/audio/';
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
            
            // 加载保存的音量 - 带安全上限防止失真
            const savedMaster = localStorage.getItem('rougecow_masterVolume');
            const savedBgm = localStorage.getItem('rougecow_bgmVolume');
            const savedSfx = localStorage.getItem('rougecow_sfxVolume');
            if (savedMaster) {
                this.masterVolume = Math.min(parseFloat(savedMaster), 0.8); // 上限0.8
                this.masterGain.gain.value = this.masterVolume;
            }
            if (savedBgm) {
                this.bgmVolume = Math.min(parseFloat(savedBgm), 0.5); // 上限0.5
                this.bgmGain.gain.value = this.bgmVolume;
            }
            if (savedSfx) this.sfxVolume = Math.min(parseFloat(savedSfx), 1.0); // 上限1.0
            
            console.log('[Audio] 初始化完成');
            return true;
        } catch (e) {
            console.warn('[Audio] 初始化失败:', e);
            this.enabled = false;
            return false;
        }
    }

    // ========================================
    // BGM 外部文件播放 (v0.30)
    // ========================================
    
    /**
     * 播放BGM - 根据类型自动切换
     * @param {string} type - 'menu', 'normal', 'elite', 'boss'
     */
    playBGM(type) {
        if (!this.enabled || !this.ctx) return;

        if (this.ctx.state === 'suspended') {
            this.ctx.resume().catch(() => {});
        }
        
        // 相同BGM不重复播放
        if (this.currentBGM === type) return;
        
        // 停止当前BGM
        this.stopBGM();
        
        const filePath = this.bgmFiles[type];
        if (!filePath) {
            console.warn(`[Audio] 未知BGM类型: ${type}`);
            return;
        }
        
        this.currentBGM = type;
        
        // 检查缓存
        if (this.bgmCache[filePath]) {
            this._playBGMBuffer(this.bgmCache[filePath]);
            console.log(`[Audio] 播放BGM (缓存): ${type}`);
        } else {
            // 加载并播放
            this._loadAndPlayBGM(filePath, type);
        }
    }
    
    /**
     * 加载并播放BGM文件
     */
    _loadAndPlayBGM(filePath, type) {
        const fullPath = this.basePath + filePath;
        
        fetch(fullPath)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.arrayBuffer();
            })
            .then(arrayBuffer => this.ctx.decodeAudioData(arrayBuffer))
            .then(audioBuffer => {
                this.bgmCache[filePath] = audioBuffer;
                if (this.currentBGM === type) {
                    this._playBGMBuffer(audioBuffer);
                    console.log(`[Audio] 播放BGM (加载): ${type}`);
                }
            })
            .catch(err => {
                console.warn(`[Audio] BGM加载失败 ${filePath}:`, err);
                this.currentBGM = null;
            });
    }
    
    /**
     * 播放BGM缓冲区 (循环)
     */
    _playBGMBuffer(buffer) {
        if (!this.ctx || !this.bgmGain) return;
        
        // 停止之前的BGM
        if (this.bgmSource) {
            try {
                this.bgmSource.stop();
                this.bgmSource.disconnect();
            } catch (e) {}
        }
        
        // 创建新的音频源
        this.bgmSource = this.ctx.createBufferSource();
        this.bgmSource.buffer = buffer;
        this.bgmSource.loop = true;  // 循环播放
        this.bgmSource.connect(this.bgmGain);
        
        // 淡入效果
        const now = this.ctx.currentTime;
        this.bgmGain.gain.cancelScheduledValues(now);
        this.bgmGain.gain.setValueAtTime(0, now);
        this.bgmGain.gain.linearRampToValueAtTime(this.bgmVolume, now + 0.5);
        
        this.bgmSource.start(0);
    }

    /**
     * 停止BGM (带淡出)
     */
    stopBGM() {
        if (!this.ctx) return;
        
        // 淡出效果
        if (this.bgmGain) {
            const now = this.ctx.currentTime;
            this.bgmGain.gain.cancelScheduledValues(now);
            this.bgmGain.gain.setValueAtTime(this.bgmGain.gain.value, now);
            this.bgmGain.gain.linearRampToValueAtTime(0, now + 0.3);
        }
        
        // 延迟停止源
        if (this.bgmSource) {
            const source = this.bgmSource;
            this.bgmSource = null;
            
            setTimeout(() => {
                try {
                    source.stop();
                    source.disconnect();
                } catch (e) {}
            }, 350);
        }
        
        this.currentBGM = null;
    }
    
    /**
     * 暂停BGM (用于游戏暂停)
     */
    pauseBGM() {
        if (this.ctx && this.ctx.state === 'running') {
            this.ctx.suspend();
        }
    }
    
    /**
     * 恢复BGM
     */
    resumeBGM() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
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

// 导出到全局
window.AudioSystem = AudioSystem;
