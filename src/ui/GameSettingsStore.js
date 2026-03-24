class GameSettingsStore {
    constructor(options = {}) {
        this.storage = options.storage || window.localStorage;
        this.storageKey = options.storageKey || 'rougecow_settings';
        this.defaults = {
            masterVolume: 0.6,
            bgmVolume: 0.3,
            sfxVolume: 1.0,
            gameBrightness: 1.0,
            theme: 'dark',
            autoPauseOnBlur: true,
            enableScreenShake: true,
            showDamageNumbers: true,
            enableHD2D: true,
            enableTiltShift: true,
            enableDynamicLighting: true,
            devMode: this.storage.getItem('dev_mode') === '1'
        };
    }

    load() {
        try {
            const raw = this.storage.getItem(this.storageKey);
            const legacyTheme = this.storage.getItem('gameTheme');
            const legacyMaster = this.storage.getItem('rougecow_masterVolume');
            const legacyBgm = this.storage.getItem('rougecow_bgmVolume');
            const legacySfx = this.storage.getItem('rougecow_sfxVolume');
            if (!raw) {
                return this.normalize({
                    ...this.defaults,
                    masterVolume: legacyMaster != null ? parseFloat(legacyMaster) : this.defaults.masterVolume,
                    bgmVolume: legacyBgm != null ? parseFloat(legacyBgm) : this.defaults.bgmVolume,
                    sfxVolume: legacySfx != null ? parseFloat(legacySfx) : this.defaults.sfxVolume,
                    theme: legacyTheme || this.defaults.theme,
                    devMode: this.storage.getItem('dev_mode') === '1'
                });
            }

            const parsed = JSON.parse(raw);
            return this.normalize({
                ...parsed,
                masterVolume: parsed.masterVolume != null ? parsed.masterVolume : legacyMaster,
                bgmVolume: parsed.bgmVolume != null ? parsed.bgmVolume : legacyBgm,
                sfxVolume: parsed.sfxVolume != null ? parsed.sfxVolume : legacySfx,
                gameBrightness: parsed.gameBrightness != null ? parsed.gameBrightness : this.defaults.gameBrightness,
                theme: parsed.theme || legacyTheme || this.defaults.theme,
                devMode: parsed.devMode != null ? parsed.devMode : (this.storage.getItem('dev_mode') === '1')
            });
        } catch (error) {
            console.warn('[GameSettingsStore] load failed:', error);
            return { ...this.defaults };
        }
    }

    save(settings) {
        const normalized = this.normalize(settings);
        this.storage.setItem(this.storageKey, JSON.stringify(normalized));
        return normalized;
    }

    patch(partialSettings) {
        const current = this.load();
        return this.save({ ...current, ...partialSettings });
    }

    normalize(settings = {}) {
        return {
            masterVolume: this.clamp(settings.masterVolume, this.defaults.masterVolume),
            bgmVolume: this.clamp(settings.bgmVolume, this.defaults.bgmVolume),
            sfxVolume: this.clamp(settings.sfxVolume, this.defaults.sfxVolume),
            gameBrightness: this.clampRange(settings.gameBrightness, 0.5, 1.5, this.defaults.gameBrightness),
            theme: settings.theme === 'light' ? 'light' : 'dark',
            autoPauseOnBlur: settings.autoPauseOnBlur !== false,
            enableScreenShake: settings.enableScreenShake !== false,
            showDamageNumbers: settings.showDamageNumbers !== false,
            enableHD2D: settings.enableHD2D !== false,
            enableTiltShift: settings.enableTiltShift !== false,
            enableDynamicLighting: settings.enableDynamicLighting !== false,
            devMode: settings.devMode === true
        };
    }

    applyToGame(game, settings = null) {
        if (!game) return this.load();

        const next = settings ? this.normalize(settings) : this.load();
        game.runtimeSettings = next;
        game.autoPauseOnBlur = next.autoPauseOnBlur;
        game.devModeEnabled = next.devMode;

        document.documentElement.setAttribute('data-theme', next.theme);
        this.storage.setItem('gameTheme', next.theme);
        if (next.devMode) this.storage.setItem('dev_mode', '1');
        else this.storage.removeItem('dev_mode');
        const centerGame = document.getElementById('centerGame');
        if (centerGame) {
            if (Math.abs((next.gameBrightness ?? 1) - 1) < 0.001) {
                centerGame.style.filter = 'none';
            } else {
                centerGame.style.filter = `brightness(${next.gameBrightness})`;
            }
        }

        if (game.camera) {
            game.camera.enableShake = next.enableScreenShake;
            if (!next.enableScreenShake) {
                game.camera.shake = 0;
            }
        }

        if (game.damageNumbers) {
            game.damageNumbers.enabled = next.showDamageNumbers;
        }

        if (game.hd2dRenderer) {
            if (game.hd2dRenderer.ambience) {
                game.hd2dRenderer.ambience.enabled = next.enableHD2D;
            }
            if (game.hd2dRenderer.colorGrading) {
                game.hd2dRenderer.colorGrading.enabled = next.enableHD2D;
            }
            if (game.hd2dRenderer.shadow) {
                game.hd2dRenderer.shadow.enabled = next.enableHD2D;
            }
            if (game.hd2dRenderer.lighting) {
                game.hd2dRenderer.lighting.enabled = next.enableHD2D && next.enableDynamicLighting;
            }
            if (game.hd2dRenderer.tiltShift) {
                game.hd2dRenderer.tiltShift.enabled = false;
            }
            if (game.hd2dRenderer.roomBlur) {
                game.hd2dRenderer.roomBlur.enabled = next.enableHD2D && next.enableTiltShift;
                game.hd2dRenderer.roomBlur.rClear = 330;
                game.hd2dRenderer.roomBlur.rHeavy = 470;
                game.hd2dRenderer.roomBlur.blurLight = 0.8;
                game.hd2dRenderer.roomBlur.blurHeavy = 1.45;
                game.hd2dRenderer.roomBlur.outerDimStrength = 0.22;
                game.hd2dRenderer.roomBlur.outerTintStrength = 0.06;
            }
        }

        if (game.lighting) {
            game.lighting.enabled = next.enableHD2D && next.enableDynamicLighting;
        }

        if (game.audio) {
            if (typeof game.audio.setMasterVolume === 'function') {
                game.audio.setMasterVolume(next.masterVolume);
            }
            if (typeof game.audio.setBGMVolume === 'function') {
                game.audio.setBGMVolume(next.bgmVolume);
            }
            if (typeof game.audio.setSFXVolume === 'function') {
                game.audio.setSFXVolume(next.sfxVolume);
            }
        }

        return next;
    }

    clamp(value, fallback) {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return fallback;
        return Math.max(0, Math.min(1, numeric));
    }

    clampRange(value, min, max, fallback) {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return fallback;
        return Math.max(min, Math.min(max, numeric));
    }
}

window.GameSettingsStore = GameSettingsStore;
