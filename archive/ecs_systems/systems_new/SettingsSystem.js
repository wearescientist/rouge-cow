/**
 * SettingsSystem - 设置系统
 * 管理游戏设置、键位绑定、显示选项
 */

class SettingsSystem {
    constructor(world) {
        this.world = world;
        this.priority = 0;
        this.enabled = true;
        
        // 设置键名
        this.settingsKey = 'rougecow_settings';
        
        // 默认设置
        this.defaults = {
            // 音频
            audio: {
                masterVolume: 1.0,
                bgmVolume: 0.7,
                sfxVolume: 1.0,
                muted: false
            },
            
            // 显示
            display: {
                fullscreen: false,
                vsync: true,
                showFPS: true,
                showDamageNumbers: true,
                showMinimap: true,
                screenShake: true,
                particleEffects: true,
                lightingQuality: 'high' // low, medium, high
            },
            
            // 游戏
            gameplay: {
                autoPickup: true,
                pauseOnFocusLost: true,
                showEnemyHealthBars: true,
                damageNumbers: true,
                autoAim: false,
                aimAssist: 0.0 // 0-1
            },
            
            // 控制
            controls: {
                mouseSensitivity: 1.0,
                invertY: false,
                keybindings: {
                    moveUp: ['KeyW', 'ArrowUp'],
                    moveDown: ['KeyS', 'ArrowDown'],
                    moveLeft: ['KeyA', 'ArrowLeft'],
                    moveRight: ['KeyD', 'ArrowRight'],
                    dash: ['Space'],
                    attack: ['MouseLeft'],
                    interact: ['KeyE'],
                    pause: ['Escape'],
                    weapon1: ['Digit1'],
                    weapon2: ['Digit2'],
                    weapon3: ['Digit3'],
                    weapon4: ['Digit4'],
                    useItem: ['KeyQ']
                }
            },
            
            // 辅助功能
            accessibility: {
                colorblindMode: 'none', // none, protanopia, deuteranopia, tritanopia
                highContrast: false,
                largeText: false,
                reducedMotion: false,
                subtitles: true
            }
        };
        
        // 当前设置
        this.settings = JSON.parse(JSON.stringify(this.defaults));
        
        // 设置变更回调
        this.changeCallbacks = new Map();
    }
    
    init() {
        // 加载保存的设置
        this.loadSettings();
        
        // 应用初始设置
        this.applySettings();
        
        console.log('SettingsSystem initialized');
    }
    
    /**
     * 加载设置
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem(this.settingsKey);
            if (saved) {
                const parsed = JSON.parse(saved);
                this.settings = this.deepMerge(this.defaults, parsed);
            }
        } catch (e) {
            console.error('Failed to load settings:', e);
        }
    }
    
    /**
     * 保存设置
     */
    saveSettings() {
        try {
            localStorage.setItem(this.settingsKey, JSON.stringify(this.settings));
            console.log('Settings saved');
            return true;
        } catch (e) {
            console.error('Failed to save settings:', e);
            return false;
        }
    }
    
    /**
     * 应用设置到各个系统
     */
    applySettings() {
        // 应用音频设置
        this.applyAudioSettings();
        
        // 应用显示设置
        this.applyDisplaySettings();
        
        // 应用控制设置
        this.applyControlSettings();
    }
    
    /**
     * 应用音频设置
     */
    applyAudioSettings() {
        const audioSystem = this.world.getSystem(AudioSystem);
        if (audioSystem) {
            audioSystem.setVolume('master', this.settings.audio.masterVolume);
            audioSystem.setVolume('bgm', this.settings.audio.bgmVolume);
            audioSystem.setVolume('sfx', this.settings.audio.sfxVolume);
            
            if (this.settings.audio.muted !== audioSystem.muted) {
                audioSystem.toggleMute();
            }
        }
    }
    
    /**
     * 应用显示设置
     */
    applyDisplaySettings() {
        // 全屏
        if (this.settings.display.fullscreen) {
            document.documentElement.requestFullscreen?.();
        }
        
        // 屏幕震动
        const screenEffect = this.world.getSystem(ScreenEffectSystem);
        if (screenEffect) {
            screenEffect.enabled = this.settings.display.screenShake;
        }
        
        // 粒子效果
        const particleSystem = this.world.getSystem(ParticleSystem);
        if (particleSystem) {
            particleSystem.enabled = this.settings.display.particleEffects;
        }
    }
    
    /**
     * 应用控制设置
     */
    applyControlSettings() {
        const inputSystem = this.world.getSystem(InputSystem);
        if (inputSystem) {
            // 更新键位绑定
            inputSystem.keyMap = { ...this.settings.controls.keybindings };
        }
    }
    
    /**
     * 获取设置值
     */
    get(category, key) {
        return this.settings[category]?.[key];
    }
    
    /**
     * 设置值
     */
    set(category, key, value) {
        if (!this.settings[category]) {
            this.settings[category] = {};
        }
        
        const oldValue = this.settings[category][key];
        this.settings[category][key] = value;
        
        // 触发变更回调
        this.triggerChange(category, key, value, oldValue);
        
        // 立即保存
        this.saveSettings();
        
        // 应用设置
        this.applySettings();
    }
    
    /**
     * 批量设置
     */
    setBatch(category, values) {
        for (const [key, value] of Object.entries(values)) {
            this.set(category, key, value);
        }
    }
    
    /**
     * 重置设置为默认值
     */
    resetToDefaults() {
        this.settings = JSON.parse(JSON.stringify(this.defaults));
        this.saveSettings();
        this.applySettings();
    }
    
    /**
     * 重置特定分类
     */
    resetCategory(category) {
        if (this.defaults[category]) {
            this.settings[category] = JSON.parse(JSON.stringify(this.defaults[category]));
            this.saveSettings();
            this.applySettings();
        }
    }
    
    /**
     * 监听设置变更
     */
    onChange(category, key, callback) {
        const fullKey = `${category}.${key}`;
        if (!this.changeCallbacks.has(fullKey)) {
            this.changeCallbacks.set(fullKey, []);
        }
        this.changeCallbacks.get(fullKey).push(callback);
    }
    
    /**
     * 移除监听器
     */
    offChange(category, key, callback) {
        const fullKey = `${category}.${key}`;
        const callbacks = this.changeCallbacks.get(fullKey);
        if (callbacks) {
            const index = callbacks.indexOf(callback);
            if (index !== -1) {
                callbacks.splice(index, 1);
            }
        }
    }
    
    /**
     * 触发变更回调
     */
    triggerChange(category, key, newValue, oldValue) {
        const fullKey = `${category}.${key}`;
        const callbacks = this.changeCallbacks.get(fullKey);
        
        if (callbacks) {
            for (const callback of callbacks) {
                callback(newValue, oldValue, category, key);
            }
        }
        
        // 触发通用变更事件
        this.world.emit('settingChanged', { category, key, value: newValue, oldValue });
    }
    
    /**
     * 获取所有设置
     */
    getAllSettings() {
        return JSON.parse(JSON.stringify(this.settings));
    }
    
    /**
     * 深合并对象
     */
    deepMerge(target, source) {
        const result = { ...target };
        
        for (const key in source) {
            if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(target[key] || {}, source[key]);
            } else {
                result[key] = source[key];
            }
        }
        
        return result;
    }
    
    /**
     * 导出设置
     */
    exportSettings() {
        return btoa(JSON.stringify(this.settings));
    }
    
    /**
     * 导入设置
     */
    importSettings(settingsString) {
        try {
            const settings = JSON.parse(atob(settingsString));
            this.settings = this.deepMerge(this.defaults, settings);
            this.saveSettings();
            this.applySettings();
            return true;
        } catch (e) {
            console.error('Failed to import settings:', e);
            return false;
        }
    }
    
    /**
     * 获取键位显示名称
     */
    getKeyDisplayName(keyCode) {
        const keyNames = {
            'KeyW': 'W',
            'KeyA': 'A',
            'KeyS': 'S',
            'KeyD': 'D',
            'KeyE': 'E',
            'KeyQ': 'Q',
            'Space': '空格',
            'Escape': 'ESC',
            'ArrowUp': '↑',
            'ArrowDown': '↓',
            'ArrowLeft': '←',
            'ArrowRight': '→',
            'MouseLeft': '鼠标左键',
            'MouseRight': '鼠标右键',
            'MouseMiddle': '鼠标中键',
            'Digit1': '1',
            'Digit2': '2',
            'Digit3': '3',
            'Digit4': '4'
        };
        
        return keyNames[keyCode] || keyCode;
    }
    
    /**
     * 检查键位冲突
     */
    checkKeyConflicts(newBinding) {
        const conflicts = [];
        const keybindings = this.settings.controls.keybindings;
        
        for (const [action, keys] of Object.entries(keybindings)) {
            if (action === newBinding.action) continue;
            
            for (const key of newBinding.keys) {
                if (keys.includes(key)) {
                    conflicts.push({ action, key });
                }
            }
        }
        
        return conflicts;
    }
    
    destroy() {}
}

window.SettingsSystem = SettingsSystem;
