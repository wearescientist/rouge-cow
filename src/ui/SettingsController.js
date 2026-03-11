class SettingsController {
    constructor(options = {}) {
        this.audioGetter = options.audioGetter || (() => null);
        this.gameGetter = options.gameGetter || (() => null);
        this.settingsStore = options.settingsStore || null;
        this.modal = document.getElementById('settingsModal');
        this.card = this.modal ? this.modal.querySelector('.settings-card') : null;
        this.closeBtn = document.getElementById('settingsClose');
        this.themeSelect = document.getElementById('themeSelect');
        this.sfxSlider = document.getElementById('sfxVolume');
        this.bgmSlider = document.getElementById('bgmVolume');
        this.sfxValue = document.getElementById('sfxVolumeValue');
        this.bgmValue = document.getElementById('bgmVolumeValue');
        this.masterSlider = null;
        this.masterValue = null;
        this.autoPauseCheckbox = null;
        this.screenShakeCheckbox = null;
        this.damageNumbersCheckbox = null;
        this.hd2dCheckbox = null;
        this.tiltShiftCheckbox = null;
        this.dynamicLightingCheckbox = null;
        this.enemySystemCheckbox = null;  // v0.34: 敌人系统选择

        this.handleClose = this.close.bind(this);
        this.handleSfxInput = this.handleSfxInput.bind(this);
        this.handleBgmInput = this.handleBgmInput.bind(this);
        this.handleMasterInput = this.handleMasterInput.bind(this);
        this.handleThemeChange = this.handleThemeChange.bind(this);
        this.handleBackdropClick = this.handleBackdropClick.bind(this);
        this.handleCheckboxChange = this.handleCheckboxChange.bind(this);
        this._bound = false;
    }

    bind() {
        if (this._bound) return;

        this.ensureAdvancedControls();

        if (this.closeBtn) {
            this.closeBtn.onclick = this.handleClose;
        }

        if (this.sfxSlider) {
            this.sfxSlider.oninput = this.handleSfxInput;
        }

        if (this.bgmSlider) {
            this.bgmSlider.oninput = this.handleBgmInput;
        }

        if (this.masterSlider) {
            this.masterSlider.oninput = this.handleMasterInput;
        }

        if (this.themeSelect) {
            this.themeSelect.onchange = this.handleThemeChange;
        }

        if (this.autoPauseCheckbox) {
            this.autoPauseCheckbox.onchange = this.handleCheckboxChange;
        }

        if (this.screenShakeCheckbox) {
            this.screenShakeCheckbox.onchange = this.handleCheckboxChange;
        }

        if (this.damageNumbersCheckbox) {
            this.damageNumbersCheckbox.onchange = this.handleCheckboxChange;
        }

        if (this.hd2dCheckbox) {
            this.hd2dCheckbox.onchange = this.handleCheckboxChange;
        }

        if (this.tiltShiftCheckbox) {
            this.tiltShiftCheckbox.onchange = this.handleCheckboxChange;
        }

        if (this.dynamicLightingCheckbox) {
            this.dynamicLightingCheckbox.onchange = this.handleCheckboxChange;
        }

        if (this.enemySystemCheckbox) {
            this.enemySystemCheckbox.onchange = this.handleEnemySystemChange.bind(this);
        }

        if (this.modal) {
            this.modal.addEventListener('click', this.handleBackdropClick);
        }

        this._bound = true;
    }

    open() {
        if (!this.modal) return;

        this.bind();
        this.syncFromStorage();
        this.modal.style.display = 'block';
        const game = this.gameGetter ? this.gameGetter() : null;
        game?.refreshPauseState?.();
    }

    close() {
        if (!this.modal) return;
        this.modal.style.display = 'none';
        const game = this.gameGetter ? this.gameGetter() : null;
        game?.refreshPauseState?.();
    }

    isOpen() {
        return !!(this.modal && window.getComputedStyle(this.modal).display !== 'none');
    }

    syncFromStorage() {
        const settings = this.settingsStore ? this.settingsStore.load() : null;
        const audio = this.audioGetter();

        const masterVolume = settings ? settings.masterVolume : (audio ? audio.masterVolume : 0.6);
        const bgmVolume = settings ? settings.bgmVolume : (audio ? audio.bgmVolume : 0.3);
        const sfxVolume = settings ? settings.sfxVolume : (audio ? audio.sfxVolume : 1.0);

        this.syncSlider(this.masterSlider, this.masterValue, masterVolume);
        this.syncSlider(this.sfxSlider, this.sfxValue, sfxVolume);
        this.syncSlider(this.bgmSlider, this.bgmValue, bgmVolume);

        if (this.themeSelect && settings) {
            this.themeSelect.value = settings.theme;
        }

        if (this.autoPauseCheckbox && settings) {
            this.autoPauseCheckbox.checked = settings.autoPauseOnBlur;
        }

        if (this.screenShakeCheckbox && settings) {
            this.screenShakeCheckbox.checked = settings.enableScreenShake;
        }

        if (this.damageNumbersCheckbox && settings) {
            this.damageNumbersCheckbox.checked = settings.showDamageNumbers;
        }

        if (this.hd2dCheckbox && settings) {
            this.hd2dCheckbox.checked = settings.enableHD2D;
        }

        if (this.tiltShiftCheckbox && settings) {
            this.tiltShiftCheckbox.checked = settings.enableTiltShift;
            this.tiltShiftCheckbox.disabled = !settings.enableHD2D;
        }

        if (this.dynamicLightingCheckbox && settings) {
            this.dynamicLightingCheckbox.checked = settings.enableDynamicLighting;
            this.dynamicLightingCheckbox.disabled = !settings.enableHD2D;
        }

        if (this.enemySystemCheckbox && settings) {
            this.enemySystemCheckbox.checked = settings.useNewEnemySystem;
        }
    }

    syncSlider(slider, output, rawValue) {
        if (!slider || !output) return;
        const numericValue = Number(rawValue);
        const percent = Math.round((Number.isFinite(numericValue) ? numericValue : 0) * 100);
        slider.value = percent;
        output.textContent = `${percent}%`;
    }

    handleSfxInput(event) {
        const value = parseInt(event.target.value, 10);
        if (this.sfxValue) {
            this.sfxValue.textContent = `${value}%`;
        }

        this.updateSettings({ sfxVolume: value / 100 });
    }

    handleBgmInput(event) {
        const value = parseInt(event.target.value, 10);
        if (this.bgmValue) {
            this.bgmValue.textContent = `${value}%`;
        }

        this.updateSettings({ bgmVolume: value / 100 });
    }

    handleMasterInput(event) {
        const value = parseInt(event.target.value, 10);
        if (this.masterValue) {
            this.masterValue.textContent = `${value}%`;
        }

        this.updateSettings({ masterVolume: value / 100 });
    }

    handleThemeChange(event) {
        this.updateSettings({ theme: event.target.value });
    }

    handleCheckboxChange() {
        this.updateSettings({
            autoPauseOnBlur: !!(this.autoPauseCheckbox && this.autoPauseCheckbox.checked),
            enableScreenShake: !!(this.screenShakeCheckbox && this.screenShakeCheckbox.checked),
            showDamageNumbers: !!(this.damageNumbersCheckbox && this.damageNumbersCheckbox.checked),
            enableHD2D: !!(this.hd2dCheckbox && this.hd2dCheckbox.checked),
            enableTiltShift: !!(this.tiltShiftCheckbox && this.tiltShiftCheckbox.checked),
            enableDynamicLighting: !!(this.dynamicLightingCheckbox && this.dynamicLightingCheckbox.checked)
        });

        const hd2dEnabled = !!(this.hd2dCheckbox && this.hd2dCheckbox.checked);
        if (this.tiltShiftCheckbox) this.tiltShiftCheckbox.disabled = !hd2dEnabled;
        if (this.dynamicLightingCheckbox) this.dynamicLightingCheckbox.disabled = !hd2dEnabled;
    }

    // v0.34: 敌人系统切换处理
    handleEnemySystemChange() {
        const useNew = !!(this.enemySystemCheckbox && this.enemySystemCheckbox.checked);
        
        // 更新设置
        this.updateSettings({ useNewEnemySystem: useNew });
        
        // 立即应用到全局开关
        window.USE_NEW_ENEMY_SYSTEM = useNew;
        
        // 显示提示
        const game = this.gameGetter();
        if (game && game.damageNumbers) {
            const msg = useNew ? '新敌人系统已启用' : '已切换至经典敌人系统';
            game.damageNumbers.spawn(
                game.player?.x || 400,
                game.player?.y || 300,
                msg,
                { color: useNew ? '#ff6b6b' : '#4ecdc4', size: 16, life: 3 }
            );
        }
        
        console.log(`[Settings] Enemy system switched to: ${useNew ? 'NEW' : 'LEGACY'}`);
        
        // 提示：需要重启房间才能生效
        if (game && game.showToast) {
            game.showToast('敌人系统已切换，进入下一房间生效');
        }
    }

    handleBackdropClick(event) {
        if (event.target === this.modal) {
            this.close();
        }
    }

    ensureAdvancedControls() {
        if (!this.card || this.masterSlider) return;

        const closeButton = this.closeBtn;
        const container = document.createElement('div');
        container.innerHTML = `
            <div class="settings-group">
                <label class="settings-label">
                    <span>🔉 主音量</span>
                    <span id="masterVolumeValue">60%</span>
                </label>
                <input type="range" id="masterVolume" min="0" max="100" value="60" style="width:100%;">
            </div>
            <div class="settings-group">
                <label class="settings-row">
                    <span>🖥 失焦自动暂停</span>
                    <input type="checkbox" id="autoPauseOnBlur" checked>
                </label>
            </div>
            <div class="settings-group">
                <label class="settings-row">
                    <span>💥 屏幕震动</span>
                    <input type="checkbox" id="enableScreenShake" checked>
                </label>
            </div>
            <div class="settings-group">
                <label class="settings-row">
                    <span>🔢 伤害数字</span>
                    <input type="checkbox" id="showDamageNumbers" checked>
                </label>
            </div>
            <div class="settings-group">
                <label class="settings-row">
                    <span>🌫 HD-2D 氛围</span>
                    <input type="checkbox" id="enableHD2D" checked>
                </label>
            </div>
            <div class="settings-group">
                <label class="settings-row">
                    <span>🌀 移轴暗角</span>
                    <input type="checkbox" id="enableTiltShift" checked>
                </label>
            </div>
            <div class="settings-group">
                <label class="settings-row">
                    <span>💡 动态光照</span>
                    <input type="checkbox" id="enableDynamicLighting" checked>
                </label>
            </div>
            <div class="settings-group" style="border-top: 1px solid rgba(255,255,255,0.1); margin-top: 12px; padding-top: 12px;">
                <label class="settings-row" title="实验性功能：使用新的楼层敌人系统">
                    <span>🧪 新敌人系统 (实验性)</span>
                    <input type="checkbox" id="useNewEnemySystem">
                </label>
                <small style="color: rgba(255,255,255,0.5); display: block; margin-top: 4px;">切换后进入下一房间生效</small>
            </div>
        `;

        while (container.firstChild) {
            this.card.insertBefore(container.firstChild, closeButton);
        }

        this.masterSlider = document.getElementById('masterVolume');
        this.masterValue = document.getElementById('masterVolumeValue');
        this.autoPauseCheckbox = document.getElementById('autoPauseOnBlur');
        this.screenShakeCheckbox = document.getElementById('enableScreenShake');
        this.damageNumbersCheckbox = document.getElementById('showDamageNumbers');
        this.hd2dCheckbox = document.getElementById('enableHD2D');
        this.tiltShiftCheckbox = document.getElementById('enableTiltShift');
        this.dynamicLightingCheckbox = document.getElementById('enableDynamicLighting');
        this.enemySystemCheckbox = document.getElementById('useNewEnemySystem');
    }

    updateSettings(partialSettings) {
        if (!this.settingsStore) return;

        const next = this.settingsStore.patch(partialSettings);
        const game = this.gameGetter();
        this.settingsStore.applyToGame(game, next);
    }
}

window.SettingsController = SettingsController;
