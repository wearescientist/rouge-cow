/**
 * AudioController.js - 游戏音效控制器 v3.0
 * 扁平化架构：所有音效直接映射到文件，无中间判断
 * 
 * 调用方式：audioCtrl.play('whip') 直接查表播放
 */

class AudioController {
    constructor(game) {
        this.game = game;
        this.audio = game.audio;
        this.basePath = 'assets/runtime/audio/';
        
        // 音频缓存
        this.cache = new Map();
        
        // 未知音效警告记录（防止高频刷屏）
        this.warnedSounds = new Set();
        
        // 音效冷却时间（防止叠加爆炸）
        this.soundCooldowns = new Map();  // soundId -> lastPlayTime
        this.cooldownMs = {
            'coin': 50,      // 金币音效50ms冷却
            'gem': 50,       // 宝石音效50ms冷却
            'exp': 100,      // 经验音效100ms冷却
            'hurt': 100,     // 受伤音效100ms冷却
            'hit_flesh': 30, // 命中音效30ms冷却
            'hit_bone': 30,
            'hit_shell': 30,
            'hit_slime': 30,
            'hit_fur': 30,
            'hit_bird': 30,
            'knife_whistle': 90
        };
        
        // ==========================================
        // 音效注册表 - 扁平化直接映射
        // ==========================================
        this.registry = {
            // ===== 武器类 (WEAPON) - 直接映射 =====
            // 武器音效 - 统一较低音量 (v0.30: 重新平衡)
            'whip':     { type: 'file', file: 'weapons/whip_crack_Sharp_lea_#3-1772638713348.mp3', vol: 0.18 },
            'blood_whip': { type: 'file', file: 'weapons/whip_crack_Sharp_lea_#3-1772638713348.mp3', vol: 0.2 },
            'scythe':   { type: 'file', file: 'weapons/Heavy_scythe_slash_#2-1772638772954.mp3', vol: 0.18 },
            'death_scythe': { type: 'file', file: 'weapons/Heavy_scythe_slash_#2-1772638772954.mp3', vol: 0.2 },
            'knife':    { type: 'file', file: 'weapons/knife_throw_v1.mp3', vol: 0.20 },
            'knife_whistle': { type: 'files', files: [
                'weapons/whistling/whistle_01.mp3',
                'weapons/whistling/whistle_02.mp3',
                'weapons/whistling/whistle_03.mp3',
                'weapons/whistling/whistle_04.mp3',
                'weapons/whistling/whistle_05.mp3',
                'weapons/whistling/whistle_06.mp3',
                'weapons/whistling/whistle_07.mp3',
                'weapons/whistling/whistle_08.mp3',
                'weapons/whistling/whistle_09.mp3'
            ], vol: 0.18 },
            'axe':      { type: 'file', file: 'weapons/axe_throw_v1.mp3', vol: 0.18 },
            'cross':    { type: 'file', file: 'weapons/cross_launch_v1.mp3', vol: 0.18 },
            'heaven_sword': { type: 'file', file: 'weapons/cross_launch_v1.mp3', vol: 0.2 },
            'wand':     { type: 'file', file: 'weapons/wand_cast_v1.mp3', vol: 0.16 },
            'fireball': { type: 'file', file: 'weapons/fireball_v1.mp3', vol: 0.15 },
            'fireball_pet': { type: 'file', file: 'weapons/fireball_v1.mp3', vol: 0.08 }, // 宠物专用低音量火球
            'shuriken': { type: 'file', file: 'weapons/shuriken_v2.mp3', vol: 0.18 },
            'icicle':   { type: 'file', file: 'weapons/icicle_v2.mp3', vol: 0.18 },
            'lightning':{ type: 'file', file: 'weapons/lighting.ogg', vol: 0.16 },
            'laser':    { type: 'file', file: 'weapons/laser2.ogg', vol: 0.15 },
            'prism_beam':{ type: 'file', file: 'weapons/laser2.ogg', vol: 0.15 },  // 炽天使硫磺使用激光音效
            'storm_arc': { type: 'file', file: 'weapons/lighting.ogg', vol: 0.16 },
            'dart':     { type: 'file', file: 'weapons/dart_shoot_v2.mp3', vol: 0.18 },
            'poison_dart':{ type: 'file', file: 'weapons/dart_shoot_v2.mp3', vol: 0.18 },
            'holy_water':{ type: 'file', file: 'weapons/bottle_broken_.mp3', vol: 0.18 },
            'holywater': { type: 'file', file: 'weapons/bottle_broken_.mp3', vol: 0.18 },  // 别名，兼容宠物系统调用
            
            // ===== 命中类 (HIT) - 材质细分 - 降低音量防止失真 =====
            'hit_flesh': { type: 'hit', material: 'flesh', count: 5, heavyCount: 3, vol: 0.5 },
            'hit_bone':  { type: 'hit', material: 'bone', count: 5, heavyCount: 3, vol: 0.5 },
            'hit_shell': { type: 'hit', material: 'shell', count: 5, heavyCount: 3, vol: 0.5 },
            'hit_slime': { type: 'hit', material: 'slime', count: 5, heavyCount: 3, vol: 0.5 },
            'hit_fur':   { type: 'hit', material: 'fur', count: 5, heavyCount: 3, vol: 0.5 },
            'hit_bird':  { type: 'hit', material: 'bird', count: 5, heavyCount: 3, vol: 0.5 },
            'hit_crit':  { type: 'hit', material: 'shell', count: 3, heavyOnly: true, vol: 0.55 }, // 暴击用重击
            
            // ===== UI类 (UI) - 直接映射 - 降低音量防止失真 =====
            'coin':      { type: 'file', file: 'coin_pickup.mp3', vol: 0.5 },
            'gem':       { type: 'file', file: 'exp-gain.ogg', vol: 0.5 },
            'chest':     { type: 'file', file: 'chest_open_4-1772638191873.mp3', vol: 0.55 },
            'levelup':   { type: 'file', file: 'Character_level_up_2-1772638391320.mp3', vol: 0.6 },
            'heal':      { type: 'file', file: 'Magical_healing_spel_1-1772638416412.mp3', vol: 0.5 },
            'evolve':    { type: 'file', file: 'weapen_evolution_powe_3-1772638360660.mp3', vol: 0.55 },
            'boss':      { type: 'file', file: 'boss enter.ogg', vol: 0.6 },
            'buy':       { type: 'file', file: 'ui/switch_001.ogg', vol: 0.5 },
            'exp':       { type: 'file', file: 'exp-gain.ogg', vol: 0.5 },
            'click':     { type: 'file', file: 'ui/click_002.ogg', vol: 0.5 },
            'select':    { type: 'file', file: 'ui/select_002.ogg', vol: 0.5 },
            'switch':    { type: 'file', file: 'ui/switch_001.ogg', vol: 0.5 },
            
            // ===== 脚步类 (STEP) - 随机播放 =====
            'step_snow':     { type: 'random', prefix: 'footstep/footstep_snow', count: 5, vol: 0.3 },
            'step_grass':    { type: 'random', prefix: 'footstep/footstep_grass', count: 5, vol: 0.3 },
            'step_concrete': { type: 'random', prefix: 'footstep/footstep_concrete', count: 5, vol: 0.3 },
            'step_wood':     { type: 'random', prefix: 'footstep/footstep_wood', count: 5, vol: 0.3 },
            'step_carpet':   { type: 'random', prefix: 'footstep/footstep_carpet', count: 5, vol: 0.3 },
            
            // ===== 其他音效 =====
            'hurt':      { type: 'hit', material: 'flesh', count: 5, heavyCount: 3, vol: 0.6 },
            'kill':      { type: 'hit', material: 'bone', count: 3, heavyOnly: true, vol: 0.7 },
            'unlock':    { type: 'file', file: 'Character_level_up_2-1772638391320.mp3', vol: 0.7 },
            
            // ===== 无声类 (MUTE) =====
            'warning':   { type: 'mute' },
            'wave':      { type: 'mute' },
            'elite':     { type: 'mute' },
            'radiance':  { type: 'mute' },
            'bible':     { type: 'mute' },
            'portal':    { type: 'mute' },
            'dash':      { type: 'mute' },
            'explosion': { type: 'mute' },
            'victory':   { type: 'mute' },
            'gameover':  { type: 'mute' },
            'shoot':     { type: 'mute' }, // 通用shoot，各武器有自己的
            'metal':     { type: 'mute' },
            'spawn':     { type: 'mute' }
        };
    }
    
    /**
     * 统一播放接口
     * @param {string} soundId - 音效ID，直接查表
     */
    play(soundId) {
        if (!this.audio || !this.audio.ctx) return;
        if (this.audio.ctx.state === 'suspended') {
            this.audio.ctx.resume().catch(() => {});
        }
        
        const cfg = this.registry[soundId];
        if (!cfg) {
            // 只警告一次，防止高频刷屏导致卡顿
            if (!this.warnedSounds.has(soundId)) {
                console.warn(`[Audio] 未知音效ID: ${soundId}`);
                this.warnedSounds.add(soundId);
            }
            return;
        }
        
        // 检查冷却时间（防止音效叠加爆炸）
        const cooldown = this.cooldownMs[soundId];
        if (cooldown) {
            const now = Date.now();
            const lastPlay = this.soundCooldowns.get(soundId) || 0;
            if (now - lastPlay < cooldown) {
                return; // 冷却中，跳过播放
            }
            this.soundCooldowns.set(soundId, now);
        }
        
        // 根据类型分发
        switch(cfg.type) {
            case 'file':
                this._playFile(cfg.file, cfg.vol);
                break;
            case 'hit':
                this._playHit(cfg);
                break;
            case 'random':
                this._playRandom(cfg);
                break;
            case 'files':
                this._playFromFiles(cfg);
                break;
            case 'mute':
                // 无声，直接返回
                break;
        }
    }
    
    /**
     * 播放单个文件
     */
    _playFile(file, volume) {
        const fullPath = this.basePath + file;
        
        // 检查缓存
        if (this.cache.has(file)) {
            this._playBuffer(this.cache.get(file), volume);
            return;
        }
        
        // 加载并播放
        fetch(fullPath)
            .then(res => {
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                return res.arrayBuffer();
            })
            .then(arrayBuffer => this.audio.ctx.decodeAudioData(arrayBuffer))
            .then(audioBuffer => {
                this.cache.set(file, audioBuffer);
                this._playBuffer(audioBuffer, volume);
            })
            .catch(err => {
                // 静默失败，不报错
            });
    }
    
    /**
     * 播放命中音效（随机选择）
     */
    _playHit(cfg) {
        const { material, count, heavyCount, heavyOnly, vol } = cfg;
        
        let file;
        if (heavyOnly) {
            // 只用重击
            const idx = Math.floor(Math.random() * heavyCount);
            file = `hit_custom/hit_${material}_heavy_${String(idx).padStart(3, '0')}.wav`;
        } else {
            // 随机选择轻击或重击
            const isHeavy = Math.random() < 0.3; // 30%概率重击
            if (isHeavy && heavyCount > 0) {
                const idx = Math.floor(Math.random() * heavyCount);
                file = `hit_custom/hit_${material}_heavy_${String(idx).padStart(3, '0')}.wav`;
            } else {
                const idx = Math.floor(Math.random() * count);
                file = `hit_custom/hit_${material}_${String(idx).padStart(3, '0')}.wav`;
            }
        }
        
        this._playFile(file, vol);
    }
    
    /**
     * 随机播放一组音效中的一个
     */
    _playRandom(cfg) {
        const { prefix, count, vol } = cfg;
        const idx = Math.floor(Math.random() * count);
        const file = `${prefix}_${String(idx).padStart(3, '0')}.ogg`;
        this._playFile(file, vol);
    }

    _playFromFiles(cfg) {
        const files = Array.isArray(cfg.files) ? cfg.files : [];
        if (files.length === 0) return;
        const file = files[Math.floor(Math.random() * files.length)];
        this._playFile(file, cfg.vol);
    }
    
    /**
     * 播放音频缓冲区
     */
    _playBuffer(buffer, volume) {
        const source = this.audio.ctx.createBufferSource();
        const gainNode = this.audio.ctx.createGain();
        
        source.buffer = buffer;
        
        // 应用全局音量和独立音量
        const finalVolume = this.audio.sfxVolume * volume;
        const now = this.audio.ctx.currentTime;
        
        // 快速淡入避免爆音
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(finalVolume, now + 0.02);
        
        source.connect(gainNode);
        gainNode.connect(this.audio.masterGain);
        
        source.start(0);
    }
    
    /**
     * 快捷方法：播放武器音效
     */
    playWeapon(weaponKey) {
        this.play(weaponKey);
    }
    
    /**
     * 快捷方法：播放命中音效
     */
    playHit(material) {
        // v0.30-fix: 提供默认材质，防止 undefined
        this.play(`hit_${material || 'flesh'}`);
    }
    
    /**
     * 快捷方法：播放暴击音效
     */
    playCrit() {
        this.play('hit_crit');
    }
    
    /**
     * 快捷方法：播放UI音效
     */
    playUI(type) {
        this.play(type);
    }
    
    /**
     * 快捷方法：播放冲刺音效
     */
    playDash() {
        this.play('dash');
    }
    
    /**
     * 预加载关键音效
     */
    preload() {
        const criticalSounds = [
            'weapons/whip_crack_Sharp_lea_#3-1772638713348.mp3',
            'weapons/Heavy_scythe_slash_#2-1772638772954.mp3',
            'weapons/cross_launch_v1.mp3',
            'weapons/knife_throw_v1.mp3',
            'weapons/whistling/whistle_01.mp3',
            'weapons/whistling/whistle_02.mp3',
            'weapons/laser2.ogg',
            'coin_pickup.mp3',
            'exp-gain.ogg'
        ];
        
        criticalSounds.forEach(file => {
            const fullPath = this.basePath + file;
            fetch(fullPath)
                .then(res => res.arrayBuffer())
                .then(arrayBuffer => this.audio.ctx.decodeAudioData(arrayBuffer))
                .then(audioBuffer => this.cache.set(file, audioBuffer))
                .catch(() => {});
        });
    }
}

// 导出到全局
window.AudioController = AudioController;
