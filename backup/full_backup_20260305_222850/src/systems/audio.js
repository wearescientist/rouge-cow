/**
 * 音效系统 - AudioManager
 * 基于 Web Audio API 的高性能音频管理器
 */

class AudioManager {
    constructor() {
        // 初始化 Web Audio API
        this.audioContext = null;
        this.masterGain = null;
        this.bgmGain = null;
        this.sfxGain = null;
        
        // 音频缓存
        this.buffers = new Map();
        this.bgmBuffer = null;
        this.bgmSource = null;
        
        // 设置
        this.masterVolume = 0.7;
        this.bgmVolume = 0.5;
        this.sfxVolume = 0.8;
        this.muted = false;
        
        // 楼层音乐映射
        this.floorMusic = {
            1: 'mycelium',      // 菌丝区 - 诡异神秘
            2: 'greenhouse',    // 孵化温室 - 紧张压抑
            3: 'neural',        // 神经索 - 电子迷幻
            4: 'furnace',       // 消化熔炉 - 沉重工业
            5: 'courtyard',     // 母虫庭院 - 史诗战斗
            6: 'heart'          // 千根之心 - 最终决战
        };
        
        this.init();
    }
    
    /**
     * 初始化音频上下文
     */
    init() {
        try {
            // 创建音频上下文（兼容旧版浏览器）
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            this.audioContext = new AudioContext();
            
            // 主音量节点
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.masterVolume;
            this.masterGain.connect(this.audioContext.destination);
            
            // BGM 音量节点
            this.bgmGain = this.audioContext.createGain();
            this.bgmGain.gain.value = this.bgmVolume;
            this.bgmGain.connect(this.masterGain);
            
            // SFX 音量节点
            this.sfxGain = this.audioContext.createGain();
            this.sfxGain.gain.value = this.sfxVolume;
            this.sfxGain.connect(this.masterGain);
            
            console.log('🔊 音频系统初始化成功');
        } catch (e) {
            console.error('❌ 音频系统初始化失败:', e);
        }
    }
    
    /**
     * 生成程序化音效 - 使用振荡器合成
     */
    generateTone(frequency, duration, type = 'sine', volume = 0.3) {
        if (!this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.connect(gainNode);
        gainNode.connect(this.sfxGain);
        
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + duration);
    }
    
    /**
     * 播放射击音效
     */
    playShoot(weaponType = 'wand') {
        const configs = {
            wand: { freq: 880, type: 'sine', duration: 0.1 },      // 魔杖 - 清脆
            knife: { freq: 1200, type: 'square', duration: 0.05 }, // 飞刀 - 锐利
            axe: { freq: 220, type: 'sawtooth', duration: 0.2 },   // 斧头 - 沉重
            fireball: { freq: 440, type: 'sawtooth', duration: 0.3 }, // 火球 - 爆裂
            lightning: { freq: 2000, type: 'square', duration: 0.08 } // 闪电 - 迅捷
        };
        
        const config = configs[weaponType] || configs.wand;
        this.generateTone(config.freq, config.duration, config.type, 0.2);
    }
    
    /**
     * 播放击中音效
     */
    playHit() {
        // 使用噪声缓冲模拟打击感
        this.generateTone(150, 0.1, 'square', 0.15);
    }
    
    /**
     * 播放拾取音效
     */
    playPickup(type = 'gem') {
        const configs = {
            gem: { freq: 1320, type: 'sine', duration: 0.15 },      // 经验宝石 - 清脆
            gold: { freq: 660, type: 'sine', duration: 0.2 },       // 金币 - 悦耳
            item: { freq: 880, type: 'triangle', duration: 0.3 },   // 道具 - 庄重
            weapon: { freq: 1100, type: 'square', duration: 0.25 }  // 武器 - 兴奋
        };
        
        const config = configs[type] || configs.gem;
        this.generateTone(config.freq, config.duration, config.type, 0.25);
    }
    
    /**
     * 播放升级音效
     */
    playLevelUp() {
        // 上升音阶
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5 E5 G5 C6
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.generateTone(freq, 0.3, 'sine', 0.3);
            }, i * 100);
        });
    }
    
    /**
     * 播放敌人死亡音效
     */
    playEnemyDeath(size = 'small') {
        const configs = {
            small: { freq: 200, duration: 0.15, vol: 0.15 },
            medium: { freq: 150, duration: 0.2, vol: 0.2 },
            large: { freq: 100, duration: 0.3, vol: 0.25 }
        };
        
        const config = configs[size] || configs.small;
        this.generateTone(config.freq, config.duration, 'sawtooth', config.vol);
    }
    
    /**
     * 播放房间清理完成音效
     */
    playRoomClear() {
        // 胜利和弦
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C大调和弦
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.generateTone(freq, 0.5, 'triangle', 0.25);
            }, i * 80);
        });
    }
    
    /**
     * 播放受伤音效
     */
    playHurt() {
        this.generateTone(150, 0.2, 'sawtooth', 0.3);
    }
    
    /**
     * 播放开门音效
     */
    playDoorOpen() {
        this.generateTone(400, 0.3, 'sine', 0.15);
    }
    
    /**
     * 播放按钮点击音效
     */
    playButtonClick() {
        this.generateTone(800, 0.05, 'sine', 0.1);
    }
    
    /**
     * 播放游戏开始音效
     */
    playGameStart() {
        // 史诗开场
        const notes = [440, 554, 659, 880];
        notes.forEach((freq, i) => {
            setTimeout(() => {
                this.generateTone(freq, 0.6, 'triangle', 0.3);
            }, i * 150);
        });
    }
    
    /**
     * 播放游戏结束音效
     */
    playGameOver(victory = false) {
        if (victory) {
            // 胜利凯歌
            const notes = [523, 659, 783, 1046, 1318];
            notes.forEach((freq, i) => {
                setTimeout(() => {
                    this.generateTone(freq, 0.4, 'sine', 0.35);
                }, i * 120);
            });
        } else {
            // 失败低沉
            const notes = [440, 349, 293, 220];
            notes.forEach((freq, i) => {
                setTimeout(() => {
                    this.generateTone(freq, 0.5, 'sawtooth', 0.3);
                }, i * 200);
            });
        }
    }
    
    /**
     * 设置主音量
     */
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        if (this.masterGain) {
            this.masterGain.gain.setValueAtTime(this.masterVolume, this.audioContext.currentTime);
        }
    }
    
    /**
     * 设置BGM音量
     */
    setBGMVolume(volume) {
        this.bgmVolume = Math.max(0, Math.min(1, volume));
        if (this.bgmGain) {
            this.bgmGain.gain.setValueAtTime(this.bgmVolume, this.audioContext.currentTime);
        }
    }
    
    /**
     * 设置SFX音量
     */
    setSFXVolume(volume) {
        this.sfxVolume = Math.max(0, Math.min(1, volume));
        if (this.sfxGain) {
            this.sfxGain.gain.setValueAtTime(this.sfxVolume, this.audioContext.currentTime);
        }
    }
    
    /**
     * 静音切换
     */
    toggleMute() {
        this.muted = !this.muted;
        if (this.masterGain) {
            const volume = this.muted ? 0 : this.masterVolume;
            this.masterGain.gain.setValueAtTime(volume, this.audioContext.currentTime);
        }
        return this.muted;
    }
    
    /**
     * 恢复音频上下文（处理浏览器自动播放策略）
     */
    resume() {
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioManager;
}
