class GameSettingsStore {
    constructor(options = {}) {
        this.storage = options.storage || window.localStorage;
        this.storageKey = options.storageKey || 'rougecow_settings';
        this.graphicsPresets = {
            high: {
                enableHD2D: true,
                enableVignette: true,
                enableOtherRoomVignette: true,
                enableHiddenRoomVignette: true,
                enableAwakeningRoomVignette: true,
                enableRoomEffects: true,
                enableBloom: true,
                enableColorAtmosphere: true,
                enableDynamicLighting: true,
                enableAmbientSpores: true,
                enableCharacterShadow: true,
                enableWarmTint: true,
                enableRoomStaticCache: true,
                enableEnemyAiThrottling: true,
                enableCinematicCamera: true,
                enableWeaponCadenceThrottling: true,
                enablePixelSampling: false
            },
            medium: {
                enableHD2D: true,
                enableVignette: true,
                enableOtherRoomVignette: true,
                enableHiddenRoomVignette: true,
                enableAwakeningRoomVignette: true,
                enableRoomEffects: true,
                enableBloom: false,
                enableColorAtmosphere: true,
                enableDynamicLighting: true,
                enableAmbientSpores: true,
                enableCharacterShadow: true,
                enableWarmTint: true,
                enableRoomStaticCache: true,
                enableEnemyAiThrottling: true,
                enableCinematicCamera: true,
                enableWeaponCadenceThrottling: true,
                enablePixelSampling: false
            },
            low: {
                enableHD2D: true,
                enableVignette: true,
                enableOtherRoomVignette: true,
                enableHiddenRoomVignette: true,
                enableAwakeningRoomVignette: true,
                enableRoomEffects: false,
                enableBloom: false,
                enableColorAtmosphere: false,
                enableDynamicLighting: false,
                enableAmbientSpores: false,
                enableCharacterShadow: true,
                enableWarmTint: false,
                enableRoomStaticCache: true,
                enableEnemyAiThrottling: true,
                enableCinematicCamera: true,
                enableWeaponCadenceThrottling: true,
                enablePixelSampling: false
            }
        };
        this.defaults = {
            masterVolume: 0.6,
            bgmVolume: 0.3,
            sfxVolume: 1.0,
            gameBrightness: 1.0,
            entityBrightness: 0.40,
            playerBrightness: 1.00,
            enemyBrightness: 1.00,
            propBrightness: 1.00,
            spatialGridCellSize: 128,
            theme: 'dark',
            autoPauseOnBlur: true,
            allowBackgroundRun: false,
            enableScreenShake: true,
            autoDampenStrongShake: true,
            enableBossSlowmoWhitelist: true,
            audioExperiencePreset: 'standard',
            enableCriticalSfxOnly: false,
            showDamageNumbers: true,
            enableMinimalHitSfx: false,
            graphicsQuality: 'high',
            devMode: this.storage.getItem('dev_mode') === '1',
            enableLayer1ShellDebug: false,
            ...this.graphicsPresets.high
        };
    }

    getGraphicsPresets() {
        return this.graphicsPresets;
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
                entityBrightness: parsed.entityBrightness != null ? parsed.entityBrightness : this.defaults.entityBrightness,
                playerBrightness: parsed.playerBrightness != null ? parsed.playerBrightness : this.defaults.playerBrightness,
                enemyBrightness: parsed.enemyBrightness != null ? parsed.enemyBrightness : this.defaults.enemyBrightness,
                propBrightness: parsed.propBrightness != null ? parsed.propBrightness : this.defaults.propBrightness,
                theme: parsed.theme || legacyTheme || this.defaults.theme,
                allowBackgroundRun: parsed.allowBackgroundRun === true,
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
        const quality = this.normalizeGraphicsQuality(settings.graphicsQuality);
        const preset = this.graphicsPresets[quality] || this.graphicsPresets.high;
        return {
            masterVolume: this.clamp(settings.masterVolume, this.defaults.masterVolume),
            bgmVolume: this.clamp(settings.bgmVolume, this.defaults.bgmVolume),
            sfxVolume: this.clamp(settings.sfxVolume, this.defaults.sfxVolume),
            gameBrightness: this.clampRange(settings.gameBrightness, 0.5, 1.5, this.defaults.gameBrightness),
            entityBrightness: this.clampRange(settings.entityBrightness, 0, 1, this.defaults.entityBrightness),
            playerBrightness: this.clampRange(settings.playerBrightness, 0, 1.5, this.defaults.playerBrightness),
            enemyBrightness: this.clampRange(settings.enemyBrightness, 0, 1.5, this.defaults.enemyBrightness),
            propBrightness: this.clampRange(settings.propBrightness, 0, 1.5, this.defaults.propBrightness),
            spatialGridCellSize: this.clampRange(settings.spatialGridCellSize, 64, 192, this.defaults.spatialGridCellSize),
            theme: settings.theme === 'light' ? 'light' : 'dark',
            autoPauseOnBlur: settings.allowBackgroundRun === true ? false : (settings.autoPauseOnBlur !== false),
            allowBackgroundRun: settings.allowBackgroundRun === true,
            enableScreenShake: settings.enableScreenShake !== false,
            autoDampenStrongShake: settings.autoDampenStrongShake !== false,
            enableBossSlowmoWhitelist: settings.enableBossSlowmoWhitelist !== false,
            audioExperiencePreset: this.normalizeAudioPreset(settings.audioExperiencePreset),
            enableCriticalSfxOnly: settings.enableCriticalSfxOnly === true,
            showDamageNumbers: settings.showDamageNumbers !== false,
            enableMinimalHitSfx: settings.enableMinimalHitSfx === true,
            graphicsQuality: quality,
            enableHD2D: settings.enableHD2D !== false,
            enableVignette: this.pickBoolean(settings.enableVignette, preset.enableVignette),
            enableOtherRoomVignette: this.pickBoolean(settings.enableOtherRoomVignette, this.pickBoolean(settings.enableVignette, preset.enableVignette)),
            enableHiddenRoomVignette: this.pickBoolean(settings.enableHiddenRoomVignette, this.pickBoolean(settings.enableVignette, preset.enableVignette)),
            enableAwakeningRoomVignette: this.pickBoolean(settings.enableAwakeningRoomVignette, this.pickBoolean(settings.enableVignette, preset.enableVignette)),
            enableRoomEffects: this.pickBoolean(settings.enableRoomEffects, preset.enableRoomEffects),
            enableBloom: this.pickBoolean(settings.enableBloom, preset.enableBloom),
            enableColorAtmosphere: this.pickBoolean(settings.enableColorAtmosphere, preset.enableColorAtmosphere),
            enableDynamicLighting: this.pickBoolean(settings.enableDynamicLighting, preset.enableDynamicLighting),
            enableAmbientSpores: this.pickBoolean(settings.enableAmbientSpores, preset.enableAmbientSpores),
            enableCharacterShadow: this.pickBoolean(settings.enableCharacterShadow, preset.enableCharacterShadow),
            enableWarmTint: this.pickBoolean(settings.enableWarmTint, preset.enableWarmTint),
            enableRoomStaticCache: this.pickBoolean(settings.enableRoomStaticCache, preset.enableRoomStaticCache),
            enableEnemyAiThrottling: this.pickBoolean(settings.enableEnemyAiThrottling, preset.enableEnemyAiThrottling),
            enableCinematicCamera: this.pickBoolean(settings.enableCinematicCamera, preset.enableCinematicCamera),
            enableWeaponCadenceThrottling: this.pickBoolean(settings.enableWeaponCadenceThrottling, preset.enableWeaponCadenceThrottling),
            enablePixelSampling: this.pickBoolean(settings.enablePixelSampling, preset.enablePixelSampling),
            enableLayer1ShellDebug: this.pickBoolean(settings.enableLayer1ShellDebug, this.defaults.enableLayer1ShellDebug),
            devMode: settings.devMode === true
        };
    }

    normalizeGraphicsQuality(value) {
        return ['high', 'medium', 'low'].includes(value) ? value : 'high';
    }

    pickBoolean(value, fallback) {
        return value === undefined || value === null ? !!fallback : value !== false;
    }

    detectGraphicsQuality(settings = {}) {
        const normalized = this.normalize(settings);
        const keys = [
            'enableVignette',
            'enableOtherRoomVignette',
            'enableHiddenRoomVignette',
            'enableAwakeningRoomVignette',
            'enableRoomEffects',
            'enableBloom',
            'enableColorAtmosphere',
            'enableDynamicLighting',
            'enableAmbientSpores',
            'enableCharacterShadow',
            'enableWarmTint',
            'enableRoomStaticCache',
            'enableEnemyAiThrottling',
            'enableCinematicCamera',
            'enableWeaponCadenceThrottling',
            'enablePixelSampling'
        ];
        if (
            Math.abs((normalized.entityBrightness ?? this.defaults.entityBrightness) - this.defaults.entityBrightness) > 0.001 ||
            Math.abs((normalized.playerBrightness ?? this.defaults.playerBrightness) - this.defaults.playerBrightness) > 0.001 ||
            Math.abs((normalized.enemyBrightness ?? this.defaults.enemyBrightness) - this.defaults.enemyBrightness) > 0.001 ||
            Math.abs((normalized.propBrightness ?? this.defaults.propBrightness) - this.defaults.propBrightness) > 0.001
        ) {
            return 'custom';
        }
        for (const [quality, preset] of Object.entries(this.graphicsPresets)) {
            if (keys.every((key) => normalized[key] === preset[key])) {
                return quality;
            }
        }
        return 'custom';
    }

    buildGraphicsPatch(quality) {
        const normalizedQuality = this.normalizeGraphicsQuality(quality);
        return {
            graphicsQuality: normalizedQuality,
            enableHD2D: true,
            enableOtherRoomVignette: true,
            enableHiddenRoomVignette: true,
            enableAwakeningRoomVignette: true,
            ...this.graphicsPresets[normalizedQuality]
        };
    }

    applyGraphicsQuality(settings, quality) {
        return this.normalize({ ...settings, ...this.buildGraphicsPatch(quality) });
    }

    applyToGame(game, settings = null) {
        if (!game) return this.load();

        const prev = game.runtimeSettings ? { ...game.runtimeSettings } : null;
        const next = settings ? this.normalize(settings) : this.load();
        const detectedQuality = this.detectGraphicsQuality(next);
        game.runtimeSettings = next;
        game.autoPauseOnBlur = next.allowBackgroundRun === true ? false : next.autoPauseOnBlur;
        game.allowBackgroundRun = next.allowBackgroundRun === true;
        game.devModeEnabled = next.devMode;
        if (window.DebugNamespaces?.setEnabled) {
            const forcedBySearch = window.DebugNamespaces.isSearchEnabled?.('layer1-shell') === true;
            if (next.enableLayer1ShellDebug === true) {
                window.DebugNamespaces.setEnabled('layer1-shell', true);
            } else if (!forcedBySearch) {
                window.DebugNamespaces.setEnabled('layer1-shell', false, { persist: false });
            }
        }

        document.documentElement.setAttribute('data-theme', next.theme);
        this.storage.setItem('gameTheme', next.theme);
        if (next.devMode) this.storage.setItem('dev_mode', '1');
        else this.storage.removeItem('dev_mode');

        const centerGame = document.getElementById('centerGame');
        if (centerGame) {
            // 全局 CSS brightness 会把游戏暗角一起提亮/压暗，导致亮度和暗角互相覆盖。
            // 这里统一关闭容器级 filter，改由主渲染链在暗角前单独处理世界亮度。
            centerGame.style.filter = 'none';
        }

        if (game.camera) {
            game.camera.enableShake = next.enableScreenShake;
            game.camera.enableCinematicCamera = next.enableCinematicCamera !== false;
            if (!next.enableScreenShake) game.camera.shake = 0;
        }
        if (game.damageNumbers) {
            game.damageNumbers.enabled = next.showDamageNumbers;
        }

        const hd2dEnabled = next.enableHD2D !== false;
        const profileName = detectedQuality === 'custom' ? next.graphicsQuality : detectedQuality;

        if (game.hd2dRenderer) {
            game.hd2dRenderer.enablePlayerVignette = hd2dEnabled && next.enableVignette !== false;
            game.hd2dRenderer.enableOtherRoomVignette = hd2dEnabled && next.enableVignette !== false && next.enableOtherRoomVignette !== false;
            game.hd2dRenderer.enableHiddenRoomVignette = hd2dEnabled && next.enableVignette !== false && next.enableHiddenRoomVignette !== false;
            game.hd2dRenderer.enableAwakeningRoomVignette = hd2dEnabled && next.enableVignette !== false && next.enableAwakeningRoomVignette !== false;
            game.hd2dRenderer.activeGraphicsQuality = profileName;

            if (game.hd2dRenderer.ambience) {
                game.hd2dRenderer.ambience.enabled = hd2dEnabled && next.enableAmbientSpores !== false;
                const sporeTarget = profileName === 'low' ? 68 : (profileName === 'medium' ? 104 : 132);
                if (game.hd2dRenderer.ambience.sporeCount !== sporeTarget) {
                    game.hd2dRenderer.ambience.sporeCount = sporeTarget;
                    game.hd2dRenderer.ambience.initSpores();
                }
            }
            if (game.hd2dRenderer.colorGrading) {
                game.hd2dRenderer.colorGrading.enabled = hd2dEnabled && next.enableWarmTint !== false;
                const tintAlpha = profileName === 'low' ? 0.05 : (profileName === 'medium' ? 0.07 : 0.085);
                game.hd2dRenderer.colorGrading.setParams({ tintAlpha });
            }
            if (game.hd2dRenderer.shadow) {
                game.hd2dRenderer.shadow.enabled = hd2dEnabled && next.enableCharacterShadow !== false;
            }
            if (game.hd2dRenderer.lighting) {
                game.hd2dRenderer.lighting.enabled = hd2dEnabled && next.enableDynamicLighting !== false;
                game.hd2dRenderer.lighting.qualityPreset = profileName;
                game.hd2dRenderer.lighting.maxLights = profileName === 'low' ? 4 : (profileName === 'medium' ? 7 : 10);
            }
            if (game.hd2dRenderer.roomBlur) {
                game.hd2dRenderer.roomBlur.enabled = hd2dEnabled && next.enableRoomEffects !== false;
                game.hd2dRenderer.roomBlur.enableBloomLayer = hd2dEnabled && next.enableBloom !== false;
                game.hd2dRenderer.roomBlur.enableColorLayer = hd2dEnabled && next.enableColorAtmosphere !== false;
                game.hd2dRenderer.roomBlur.enablePresentationMask = hd2dEnabled && next.enableRoomEffects !== false;
                if (profileName === 'high') {
                    game.hd2dRenderer.roomBlur.rClear = 330;
                    game.hd2dRenderer.roomBlur.rHeavy = 470;
                    game.hd2dRenderer.roomBlur.blurLight = 0.8;
                    game.hd2dRenderer.roomBlur.blurHeavy = 1.45;
                    game.hd2dRenderer.roomBlur.outerDimStrength = 0.22;
                    game.hd2dRenderer.roomBlur.outerTintStrength = 0.075;
                    game.hd2dRenderer.roomBlur.playerGlowAlpha = 0.075;
                } else if (profileName === 'medium') {
                    game.hd2dRenderer.roomBlur.rClear = 320;
                    game.hd2dRenderer.roomBlur.rHeavy = 455;
                    game.hd2dRenderer.roomBlur.blurLight = 0.72;
                    game.hd2dRenderer.roomBlur.blurHeavy = 1.3;
                    game.hd2dRenderer.roomBlur.outerDimStrength = 0.2;
                    game.hd2dRenderer.roomBlur.outerTintStrength = 0.06;
                    game.hd2dRenderer.roomBlur.playerGlowAlpha = 0.065;
                } else {
                    game.hd2dRenderer.roomBlur.rClear = 300;
                    game.hd2dRenderer.roomBlur.rHeavy = 430;
                    game.hd2dRenderer.roomBlur.blurLight = 0.6;
                    game.hd2dRenderer.roomBlur.blurHeavy = 1.1;
                    game.hd2dRenderer.roomBlur.outerDimStrength = 0.17;
                    game.hd2dRenderer.roomBlur.outerTintStrength = 0.045;
                    game.hd2dRenderer.roomBlur.playerGlowAlpha = 0.05;
                }
            }
        }

        if (game.lighting) {
            game.lighting.enabled = hd2dEnabled && next.enableDynamicLighting !== false;
            game.lighting.qualityPreset = profileName;
            game.lighting.maxLights = profileName === 'low' ? 4 : (profileName === 'medium' ? 7 : 10);
        }

        if (game.audio) {
            if (typeof game.audio.setMasterVolume === 'function') game.audio.setMasterVolume(next.masterVolume);
            if (typeof game.audio.setBGMVolume === 'function') game.audio.setBGMVolume(next.bgmVolume);
            if (typeof game.audio.setSFXVolume === 'function') game.audio.setSFXVolume(next.sfxVolume);
        }
        if (game.audioCtrl?.applyRuntimeSettings) {
            game.audioCtrl.applyRuntimeSettings(next);
        }

        if (this.shouldInvalidateRoomStaticCache(prev, next)) {
            this.invalidateRoomStaticCaches(game);
        }

        return next;
    }

    shouldInvalidateRoomStaticCache(prev, next) {
        if (!prev) return false;
        return prev.graphicsQuality !== next.graphicsQuality
            || prev.enableRoomStaticCache !== next.enableRoomStaticCache
            || prev.enablePixelSampling !== next.enablePixelSampling;
    }

    invalidateRoomStaticCaches(game) {
        const visited = new Set();
        const tryInvalidate = (room) => {
            if (!room || visited.has(room)) return;
            visited.add(room);
            if (typeof room.invalidateStaticRenderCache === 'function') {
                room.invalidateStaticRenderCache();
            }
        };
        tryInvalidate(game.curRoom);
        if (Array.isArray(game.rooms)) {
            game.rooms.forEach(tryInvalidate);
        }
        const allFloors = game.allFloors;
        if (allFloors && typeof allFloors.forEach === 'function') {
            allFloors.forEach((entry) => {
                if (Array.isArray(entry?.rooms)) entry.rooms.forEach(tryInvalidate);
            });
        }
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

    normalizeAudioPreset(value) {
        const preset = String(value || '').toLowerCase();
        if (preset === 'immersive' || preset === 'quiet' || preset === 'standard') return preset;
        return this.defaults.audioExperiencePreset || 'standard';
    }
}

window.GameSettingsStore = GameSettingsStore;
