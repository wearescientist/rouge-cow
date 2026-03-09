/**
 * 增强音效系统 - v0.14.0
 * 第5轮迭代：音效系统增强
 * 
 * 功能：
 * 1. 动态音乐系统（根据场景切换）
 * 2. 3D音效定位
 * 3. 音效混合器
 * 4. 自适应音量
 * 5. 音效预设
 */

class EnhancedAudioSystem {
    constructor() {
        this.context = null;
        this.masterGain = null;
        this.bgmGain = null;
        this.sfxGain = null;
        this.uiGain = null;
        
        this.bgm = null;
        this.currentBgm = null;
        this.bgmQueue = [];
        
        this.sounds = new Map();
        this.pools = new Map();
        
        this.volume = {
            master: 1.0,
            bgm: 0.5,
            sfx: 0.7,
            ui: 0.6
        };
        
        this.muted = false;
        this.initialized = false;
        
        // 音乐状态
        this.musicState = 'calm'; // calm, combat, boss, victory
        this.combatTimer = null;
    }
    
    // ========== 初始化 ==========
    
    init() {
        if (this.initialized) return;
        
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            
            // 主音量
            this.masterGain = this.context.createGain();
            this.masterGain.connect(this.context.destination);
            
            // 分类音量
            this.bgmGain = this.context.createGain();
            this.sfxGain = this.context.createGain();
            this.uiGain = this.context.createGain();
            
            this.bgmGain.connect(this.masterGain);
            this.sfxGain.connect(this.masterGain);
            this.uiGain.connect(this.masterGain);
            
            this.updateVolumes();
            this.initialized = true;
            
            console.log('🔊 增强音效系统已初始化');
        } catch (e) {
            console.warn('音频初始化失败:', e);
        }
    }
    
    // ========== 音量控制 ==========
    
    setVolume(type, value) {
        this.volume[type] = Math.max(0, Math.min(1, value));
        this.updateVolumes();
    }
    
    updateVolumes() {
        if (!this.initialized) return;
        
        const master = this.muted ? 0 : this.volume.master;
        this.masterGain.gain.value = master;
        
        this.bgmGain.gain.value = this.volume.bgm;
        this.sfxGain.gain.value = this.volume.sfx;
        this.uiGain.gain.value = this.volume.ui;
    }
    
    mute() {
        this.muted = true;
        this.updateVolumes();
    }
    
    unmute() {
        this.muted = false;
        this.updateVolumes();
    }
    
    toggleMute() {
        this.muted = !this.muted;
        this.updateVolumes();
        return this.muted;
    }
    
    // ========== 音效加载与播放 ==========
    
    async loadSound(name, url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.context.decodeAudioData(arrayBuffer);
            
            this.sounds.set(name, audioBuffer);
            console.log(`🎵 加载音效: ${name}`);
        } catch (e) {
            console.warn(`加载音效失败 ${name}:`, e);
        }
    }
    
    play(name, options = {}) {
        if (!this.initialized || !this.sounds.has(name)) return null;
        
        const {
            volume = 1.0,
            pitch = 1.0,
            pan = 0, // -1 (左) 到 1 (右)
            loop = false,
            category = 'sfx' // sfx, ui, bgm
        } = options;
        
        const source = this.context.createBufferSource();
        source.buffer = this.sounds.get(name);
        source.playbackRate.value = pitch;
        
        // 创建增益节点
        const gainNode = this.context.createGain();
        gainNode.gain.value = volume;
        
        // 声相（立体声定位）
        const panner = this.context.createStereoPanner();
        panner.pan.value = pan;
        
        // 连接节点
        source.connect(panner);
        panner.connect(gainNode);
        
        // 根据分类连接到不同的增益节点
        if (category === 'bgm') {
            gainNode.connect(this.bgmGain);
        } else if (category === 'ui') {
            gainNode.connect(this.uiGain);
        } else {
            gainNode.connect(this.sfxGain);
        }
        
        source.loop = loop;
        source.start(0);
        
        return { source, gainNode };
    }
    
    // ========== 3D音效 ==========
    
    playAt(name, x, y, listenerX, listenerY, options = {}) {
        // 计算距离和方向
        const dx = x - listenerX;
        const dy = y - listenerY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 音量随距离衰减
        const maxDistance = options.maxDistance || 500;
        const volume = Math.max(0, 1 - distance / maxDistance);
        
        // 声相
        const pan = Math.max(-1, Math.min(1, dx / maxDistance));
        
        // 播放
        return this.play(name, {
            ...options,
            volume: (options.volume || 1) * volume,
            pan
        });
    }
    
    // ========== 动态音乐系统 ==========
    
    playBGM(name, fadeDuration = 1000) {
        if (!this.initialized) return;
        if (this.currentBgm === name) return;
        
        // 淡出当前音乐
        if (this.bgm) {
            this.fadeOut(this.bgm.gainNode, fadeDuration, () => {
                this.bgm.source.stop();
            });
        }
        
        // 播放新音乐
        const buffer = this.sounds.get(name);
        if (!buffer) return;
        
        const source = this.context.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        
        const gainNode = this.context.createGain();
        gainNode.gain.value = 0;
        
        source.connect(gainNode);
        gainNode.connect(this.bgmGain);
        
        source.start(0);
        
        // 淡入
        this.fadeIn(gainNode, fadeDuration);
        
        this.bgm = { source, gainNode, name };
        this.currentBgm = name;
    }
    
    stopBGM(fadeDuration = 1000) {
        if (!this.bgm) return;
        
        this.fadeOut(this.bgm.gainNode, fadeDuration, () => {
            this.bgm.source.stop();
            this.bgm = null;
            this.currentBgm = null;
        });
    }
    
    fadeIn(gainNode, duration) {
        const now = this.context.currentTime;
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(1, now + duration / 1000);
    }
    
    fadeOut(gainNode, duration, onComplete) {
        const now = this.context.currentTime;
        gainNode.gain.setValueAtTime(gainNode.gain.value, now);
        gainNode.gain.linearRampToValueAtTime(0, now + duration / 1000);
        
        setTimeout(() => {
            if (onComplete) onComplete();
        }, duration);
    }
    
    // ========== 智能音乐切换 ==========
    
    updateMusicState(gameState) {
        const { inCombat, inBossRoom, enemiesNearby } = gameState;
        
        let newState = 'calm';
        if (inBossRoom) {
            newState = 'boss';
        } else if (inCombat || enemiesNearby > 5) {
            newState = 'combat';
        }
        
        if (newState !== this.musicState) {
            this.musicState = newState;
            this.onMusicStateChange(newState);
        }
    }
    
    onMusicStateChange(state) {
        const bgmMap = {
            calm: 'bgm_exploration',
            combat: 'bgm_combat',
            boss: 'bgm_boss',
            victory: 'bgm_victory'
        };
        
        const bgmName = bgmMap[state];
        if (bgmName && this.sounds.has(bgmName)) {
            this.playBGM(bgmName);
        }
    }
    
    // ========== 音效预设 ==========
    
    playPreset(presetName, options = {}) {
        const presets = {
            // UI音效
            buttonClick: { name: 'ui_click', volume: 0.5, category: 'ui' },
            buttonHover: { name: 'ui_hover', volume: 0.3, category: 'ui' },
            openMenu: { name: 'ui_open', volume: 0.6, category: 'ui' },
            closeMenu: { name: 'ui_close', volume: 0.6, category: 'ui' },
            
            // 战斗音效
            shoot: { name: 'sfx_shoot', volume: 0.4 },
            hit: { name: 'sfx_hit', volume: 0.5 },
            crit: { name: 'sfx_crit', volume: 0.7 },
            enemyDeath: { name: 'sfx_death', volume: 0.5 },
            levelUp: { name: 'sfx_levelup', volume: 0.8 },
            
            // 环境音效
            doorOpen: { name: 'sfx_door', volume: 0.4 },
            pickupGold: { name: 'sfx_coin', volume: 0.3 },
            pickupItem: { name: 'sfx_item', volume: 0.5 },
            heal: { name: 'sfx_heal', volume: 0.5 }
        };
        
        const preset = presets[presetName];
        if (!preset) return;
        
        return this.play(preset.name, { ...preset, ...options });
    }
    
    // ========== 程序化音效生成 ==========
    
    generateTone(frequency, duration, type = 'sine') {
        if (!this.initialized) return;
        
        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();
        
        oscillator.type = type;
        oscillator.frequency.value = frequency;
        
        gainNode.gain.setValueAtTime(0.3, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.sfxGain);
        
        oscillator.start();
        oscillator.stop(this.context.currentTime + duration);
    }
    
    // 生成简单的音效
    generateSFX(type) {
        const generators = {
            coin: () => this.generateTone(1200, 0.1, 'sine'),
            powerup: () => {
                this.generateTone(440, 0.1, 'sine');
                setTimeout(() => this.generateTone(554, 0.1, 'sine'), 50);
                setTimeout(() => this.generateTone(659, 0.2, 'sine'), 100);
            },
            error: () => this.generateTone(150, 0.3, 'sawtooth'),
            click: () => this.generateTone(800, 0.05, 'square')
        };
        
        if (generators[type]) {
            generators[type]();
        }
    }
    
    // ========== 音效事件处理 ==========
    
    on(event, callback) {
        // 简单的事件系统
        if (!this.eventListeners) this.eventListeners = {};
        if (!this.eventListeners[event]) this.eventListeners[event] = [];
        this.eventListeners[event].push(callback);
    }
    
    emit(event, data) {
        if (!this.eventListeners || !this.eventListeners[event]) return;
        this.eventListeners[event].forEach(cb => cb(data));
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EnhancedAudioSystem };
}
