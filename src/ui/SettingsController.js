class SettingsController {
    constructor(options = {}) {
        this.audioGetter = options.audioGetter || (() => null);
        this.gameGetter = options.gameGetter || (() => null);
        this.settingsStore = options.settingsStore || null;
        this.modal = document.getElementById('settingsModal');
        this.card = this.modal ? this.modal.querySelector('.settings-card') : null;

        this.handleClose = this.close.bind(this);
        this.handleBackdropClick = this.handleBackdropClick.bind(this);
        this.handleSfxInput = this.handleSfxInput.bind(this);
        this.handleBgmInput = this.handleBgmInput.bind(this);
        this.handleMasterInput = this.handleMasterInput.bind(this);
        this.handleBrightnessInput = this.handleBrightnessInput.bind(this);
        this.handleEntityBrightnessInput = this.handleEntityBrightnessInput.bind(this);
        this.handlePlayerBrightnessInput = this.handlePlayerBrightnessInput.bind(this);
        this.handleEnemyBrightnessInput = this.handleEnemyBrightnessInput.bind(this);
        this.handlePropBrightnessInput = this.handlePropBrightnessInput.bind(this);
        this.handleThemeChange = this.handleThemeChange.bind(this);
        this.handleAudioPresetChange = this.handleAudioPresetChange.bind(this);
        this.handleCheckboxChange = this.handleCheckboxChange.bind(this);
        this.handleQualityClick = this.handleQualityClick.bind(this);
        this._bound = false;
    }

    ensureStyles() {
        if (document.getElementById('settingsFullScreenStyles')) {
            if (this.modal) this.modal.classList.add('settings-fullscreen-modal');
            if (this.card) this.card.classList.add('settings-fullscreen-card');
            return;
        }
        const style = document.createElement('style');
        style.id = 'settingsFullScreenStyles';
        style.textContent = `
            #settingsModal.settings-fullscreen-modal {
                position: fixed !important;
                inset: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                z-index: 10050 !important;
                display: none;
                background:
                    radial-gradient(circle at top, rgba(255,216,138,0.12), transparent 36%),
                    rgba(5, 8, 14, 0.9) !important;
                backdrop-filter: blur(12px);
            }
            #settingsModal.settings-fullscreen-modal .settings-card {
                position: absolute !important;
                inset: 0 !important;
                transform: none !important;
                width: 100vw !important;
                height: 100vh !important;
                max-width: none !important;
                margin: 0 !important;
                padding: 0 !important;
                border-radius: 0 !important;
                clip-path: none !important;
                overflow: hidden !important;
                background: transparent !important;
                box-shadow: none !important;
                border: none !important;
            }
            #settingsModal .settings-shell {
                position: relative;
                height: 100%;
                width: 100%;
                display: grid;
                grid-template-rows: auto 1fr auto;
                padding: max(18px, env(safe-area-inset-top)) clamp(18px, 3vw, 34px) max(14px, env(safe-area-inset-bottom)) clamp(18px, 3vw, 34px);
                background:
                    linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02)),
                    linear-gradient(180deg, rgba(14,18,26,0.96), rgba(8,10,16,0.98));
            }
            #settingsModal .settings-header {
                display: grid;
                grid-template-columns: 1fr auto;
                gap: 18px;
                align-items: end;
                max-width: 1320px;
                width: 100%;
                margin: 0 auto 16px;
                padding-bottom: 14px;
                border-bottom: 1px solid rgba(255,255,255,0.08);
            }
            #settingsModal .settings-eyebrow { text-align: left; margin-bottom: 8px; }
            #settingsModal .settings-title { text-align: left; margin: 0 0 8px; font-size: clamp(32px, 4vw, 48px); }
            #settingsModal .settings-subtitle { text-align: left; margin: 0; max-width: 760px; font-size: 14px; }
            #settingsModal .settings-scroll {
                width: 100%;
                max-width: 1320px;
                margin: 0 auto;
                min-height: 0;
                overflow: auto;
                padding-right: 8px;
            }
            #settingsModal .settings-section { margin-bottom: 18px; }
            #settingsModal .settings-section-head { display:flex; justify-content:space-between; align-items:end; gap:16px; margin-bottom:12px; }
            #settingsModal .settings-section-head h3 { margin:0 0 4px; color: var(--hud-title); font-size: 24px; }
            #settingsModal .settings-section-head p { margin:0; color: var(--hud-muted); font-size: 13px; }
            #settingsModal .settings-quality-status { color: var(--hud-gold); font-size: 13px; }
            #settingsModal .settings-grid { display:grid; gap:12px; }
            #settingsModal .settings-grid--audio { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            #settingsModal .settings-grid--switches { grid-template-columns: repeat(3, minmax(0, 1fr)); }
            #settingsModal .settings-group, #settingsModal .settings-toggle-card {
                min-height: 96px;
                padding: 14px 14px 12px;
                border-radius: 16px;
                background: rgba(255,255,255,0.035);
                border: 1px solid rgba(255,255,255,0.08);
                box-shadow: inset 0 1px 0 rgba(255,255,255,0.02);
            }
            #settingsModal .settings-group--slider { display:grid; align-content:start; gap:12px; }
            #settingsModal .settings-label { margin:0; gap:10px; align-items:start; }
            #settingsModal .settings-label span:last-child { color: var(--hud-gold); font-weight: 700; }
            #settingsModal .settings-quality-row { display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap:12px; margin-bottom: 12px; }
            #settingsModal .settings-quality-btn {
                padding: 14px 14px;
                border-radius: 14px;
                border: 1px solid rgba(255,255,255,0.1);
                background: rgba(255,255,255,0.04);
                color: var(--hud-ink);
                cursor: pointer;
                font-size: 15px;
                font-weight: 700;
            }
            #settingsModal .settings-quality-btn.is-active,
            #settingsModal .settings-quality-btn[aria-pressed="true"] {
                background: linear-gradient(180deg, var(--hud-button-1), var(--hud-button-2));
                border-color: rgba(255,226,175,0.24);
                color: var(--hud-title);
            }
            #settingsModal .settings-advanced { border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; background: rgba(255,255,255,0.03); overflow: hidden; }
            #settingsModal .settings-advanced > summary { cursor:pointer; padding:14px 16px; color:var(--hud-title); font-weight:700; }
            #settingsModal .settings-toggle-grid { display:grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap:12px; padding: 0 12px 12px; }
            #settingsModal .settings-toggle-card { display:flex; justify-content:space-between; align-items:center; gap:12px; min-height: 88px; }
            #settingsModal .settings-toggle-card--wide { grid-column: span 2; }
            #settingsModal .settings-toggle-card strong { display:block; margin-bottom:4px; color: var(--hud-ink); }
            #settingsModal .settings-toggle-card small { color: var(--hud-muted); line-height:1.45; }
            #settingsModal .settings-note { margin-top: 10px; color: var(--hud-muted); font-size: 12px; }
            #settingsModal .settings-footer {
                max-width: 1320px;
                width: 100%;
                margin: 14px auto 0;
                padding-top: 12px;
                border-top: 1px solid rgba(255,255,255,0.08);
                display: flex;
                justify-content: flex-end;
            }
            #settingsModal .settings-close { width: auto; min-width: 180px; margin: 0; }
            #settingsModal .settings-close--header { align-self: start; }
            @media (max-width: 960px) {
                #settingsModal .settings-shell { padding: max(10px, env(safe-area-inset-top)) 12px max(10px, env(safe-area-inset-bottom)) 12px; }
                #settingsModal .settings-header { grid-template-columns: 1fr; gap: 10px; margin-bottom: 12px; }
                #settingsModal .settings-title, #settingsModal .settings-subtitle, #settingsModal .settings-eyebrow { text-align: center; }
                #settingsModal .settings-scroll { padding-right: 2px; }
                #settingsModal .settings-grid--audio, #settingsModal .settings-grid--switches, #settingsModal .settings-toggle-grid, #settingsModal .settings-quality-row { grid-template-columns: 1fr 1fr; }
                #settingsModal .settings-toggle-card--wide { grid-column: span 2; }
                #settingsModal .settings-group, #settingsModal .settings-toggle-card { min-height: 78px; padding: 12px 12px 10px; }
                #settingsModal .settings-section-head { display:grid; grid-template-columns: 1fr; align-items:start; }
                #settingsModal .settings-footer { justify-content: stretch; }
                #settingsModal .settings-close { width: 100%; min-width: 0; }
            }
            @media (max-width: 640px) {
                #settingsModal .settings-grid--audio, #settingsModal .settings-grid--switches, #settingsModal .settings-toggle-grid, #settingsModal .settings-quality-row { grid-template-columns: 1fr; }
                #settingsModal .settings-toggle-card--wide { grid-column: span 1; }
                #settingsModal .settings-title { font-size: 28px; }
                #settingsModal .settings-subtitle { font-size: 12px; }
                #settingsModal .settings-group, #settingsModal .settings-toggle-card { min-height: 0; }
            }
        `;
        document.head.appendChild(style);
        if (this.modal) this.modal.classList.add('settings-fullscreen-modal');
        if (this.card) this.card.classList.add('settings-fullscreen-card');
    }

    bind() {
        if (this._bound) return;
        this.ensureStyles();
        this.ensureAdvancedControls();

        if (this.modal) this.modal.addEventListener('click', this.handleBackdropClick);
        if (this.closeBtn) this.closeBtn.onclick = this.handleClose;
        if (this.sfxSlider) this.sfxSlider.oninput = this.handleSfxInput;
        if (this.bgmSlider) this.bgmSlider.oninput = this.handleBgmInput;
        if (this.masterSlider) this.masterSlider.oninput = this.handleMasterInput;
        if (this.brightnessSlider) this.brightnessSlider.oninput = this.handleBrightnessInput;
        if (this.entityBrightnessSlider) this.entityBrightnessSlider.oninput = this.handleEntityBrightnessInput;
        if (this.playerBrightnessSlider) this.playerBrightnessSlider.oninput = this.handlePlayerBrightnessInput;
        if (this.enemyBrightnessSlider) this.enemyBrightnessSlider.oninput = this.handleEnemyBrightnessInput;
        if (this.propBrightnessSlider) this.propBrightnessSlider.oninput = this.handlePropBrightnessInput;
        if (this.themeSelect) this.themeSelect.onchange = this.handleThemeChange;
        if (this.audioPresetSelect) this.audioPresetSelect.onchange = this.handleAudioPresetChange;

        [
            this.allowBackgroundRunCheckbox,
            this.screenShakeCheckbox,
            this.autoDampenStrongShakeCheckbox,
            this.damageNumbersCheckbox,
            this.minimalHitSfxCheckbox,
            this.enableCriticalSfxOnlyCheckbox,
            this.enableBossSlowmoWhitelistCheckbox,
            this.devModeCheckbox,
            this.vignetteCheckbox,
            this.otherRoomVignetteCheckbox,
            this.hiddenRoomVignetteCheckbox,
            this.awakeningRoomVignetteCheckbox,
            this.roomEffectsCheckbox,
            this.bloomCheckbox,
            this.colorCheckbox,
            this.dynamicLightingCheckbox,
            this.ambientSporesCheckbox,
            this.shadowCheckbox,
            this.warmTintCheckbox,
            this.roomStaticCacheCheckbox,
            this.pixelSamplingCheckbox,
            this.enemyAiThrottlingCheckbox,
            this.cinematicCameraCheckbox,
            this.weaponCadenceThrottlingCheckbox
        ].forEach((checkbox) => {
            if (checkbox) checkbox.onchange = this.handleCheckboxChange;
        });

        this.qualityButtons.forEach((button) => {
            button.addEventListener('click', this.handleQualityClick);
        });

        this._bound = true;
    }

    open() {
        if (!this.modal) return;
        this.ensureStyles();
        this.bind();
        this.syncFromStorage();
        this.modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        const game = this.gameGetter ? this.gameGetter() : null;
        game?.refreshPauseState?.();
    }

    close() {
        if (!this.modal) return;
        this.modal.style.display = 'none';
        document.body.style.overflow = '';
        const game = this.gameGetter ? this.gameGetter() : null;
        game?.refreshPauseState?.();
    }

    isOpen() {
        return !!(this.modal && window.getComputedStyle(this.modal).display !== 'none');
    }

    ensureAdvancedControls() {
        this.ensureStyles();
        if (!this.card || this.card.dataset.settingsBuilt === '1') {
            if (this.card && this.card.dataset.settingsBuilt === '1') this.captureRefs();
            return;
        }

        this.card.innerHTML = `
            <div class="settings-shell">
                <div class="settings-header">
                    <div>
                        <div class="settings-eyebrow">Run Setup</div>
                        <h2 class="settings-title">游戏设置</h2>
                        <p class="settings-subtitle">把音量、画质、操作和表现一次调顺。手机横屏也能完整显示。</p>
                    </div>
                    <button id="settingsClose" class="settings-close settings-close--header" type="button">返回菜单</button>
                </div>
                <div class="settings-scroll">
                    <section class="settings-section">
                        <div class="settings-section-head">
                            <div>
                                <h3>音频</h3>
                                <p>先把听感调顺，再进洞。</p>
                            </div>
                        </div>
                        <div class="settings-grid settings-grid--audio">
                            <div class="settings-group settings-group--slider">
                                <label class="settings-label" for="masterVolume">
                                    <span>🔉 主音量<small>整体音量</small></span>
                                    <span id="masterVolumeValue">60%</span>
                                </label>
                                <input type="range" id="masterVolume" min="0" max="100" value="60">
                            </div>
                            <div class="settings-group settings-group--slider">
                                <label class="settings-label" for="bgmVolume">
                                    <span>🎵 音乐音量<small>菜单、战斗和演出</small></span>
                                    <span id="bgmVolumeValue">30%</span>
                                </label>
                                <input type="range" id="bgmVolume" min="0" max="100" value="30">
                            </div>
                            <div class="settings-group settings-group--slider">
                                <label class="settings-label" for="sfxVolume">
                                    <span>🔊 音效音量<small>攻击、掉落、命中反馈</small></span>
                                    <span id="sfxVolumeValue">100%</span>
                                </label>
                                <input type="range" id="sfxVolume" min="0" max="100" value="100">
                            </div>
                            <div class="settings-group settings-group--select">
                                <label class="settings-label" for="audioPreset">
                                    <span>🎚️ 音效预设<small>沉浸 / 标准 / 安静 三档混音</small></span>
                                </label>
                                <select id="audioPreset">
                                    <option value="immersive">沉浸</option>
                                    <option value="standard">标准</option>
                                    <option value="quiet">安静</option>
                                </select>
                            </div>
                            <div class="settings-group settings-group--slider">
                                <label class="settings-label" for="gameBrightness">
                                    <span>🌓 画面亮度<small>只改游戏画面，不改系统亮度</small></span>
                                    <span id="gameBrightnessValue">100%</span>
                                </label>
                                <input type="range" id="gameBrightness" min="50" max="150" value="100">
                            </div>
                            <div class="settings-group settings-group--slider settings-group--slider-compact">
                                <label class="settings-label" for="entityBrightness">
                                    <span>🐾 实体总亮度<small>统一压玩家、敌人、场景实体</small></span>
                                    <span id="entityBrightnessValue">40%</span>
                                </label>
                                <input type="range" id="entityBrightness" min="0" max="100" value="40">
                            </div>
                            <div class="settings-group settings-group--slider settings-group--slider-compact">
                                <label class="settings-label" for="playerBrightness">
                                    <span>🐮 玩家<small>玩家本体与宠物</small></span>
                                    <span id="playerBrightnessValue">100%</span>
                                </label>
                                <input type="range" id="playerBrightness" min="0" max="150" value="100">
                            </div>
                            <div class="settings-group settings-group--slider settings-group--slider-compact">
                                <label class="settings-label" for="enemyBrightness">
                                    <span>👾 敌人<small>普通怪、精英、Boss</small></span>
                                    <span id="enemyBrightnessValue">100%</span>
                                </label>
                                <input type="range" id="enemyBrightness" min="0" max="150" value="100">
                            </div>
                            <div class="settings-group settings-group--slider settings-group--slider-compact">
                                <label class="settings-label" for="propBrightness">
                                    <span>🕯️ 场景实体<small>商人、宝箱、隐藏房摆件等</small></span>
                                    <span id="propBrightnessValue">100%</span>
                                </label>
                                <input type="range" id="propBrightness" min="0" max="150" value="100">
                            </div>
                        </div>
                    </section>

                    <section class="settings-section">
                        <div class="settings-section-head settings-section-head--split">
                            <div>
                                <h3>画质</h3>
                                <p>先用档位，想细调再展开下面的高级画面。</p>
                            </div>
                            <div id="graphicsQualityStatus" class="settings-quality-status">当前：高画质</div>
                        </div>
                        <div class="settings-quality-row" id="graphicsQualityButtons">
                            <button type="button" class="settings-quality-btn" data-quality="high">高画质</button>
                            <button type="button" class="settings-quality-btn" data-quality="medium">中画质</button>
                            <button type="button" class="settings-quality-btn" data-quality="low">低画质</button>
                        </div>

                        <details class="settings-advanced" id="settingsGraphicsAdvanced">
                            <summary>高级画面开关</summary>
                            <div class="settings-toggle-grid">
                                <label class="settings-toggle-card"><span><strong>暗角总开关</strong><small>统一控制所有房间的外围压暗</small></span><input type="checkbox" id="enableVignette"></label>
                                <label class="settings-toggle-card"><span><strong>房间光效</strong><small>商店、宝箱、隐藏房额外光场</small></span><input type="checkbox" id="enableRoomEffects"></label>
                                <label class="settings-toggle-card"><span><strong>光晕发光</strong><small>亮点外围那圈发光</small></span><input type="checkbox" id="enableBloom"></label>
                                <label class="settings-toggle-card"><span><strong>彩色氛围</strong><small>金光、紫光、蓝光染色</small></span><input type="checkbox" id="enableColorAtmosphere"></label>
                                <label class="settings-toggle-card"><span><strong>动态光照</strong><small>场景动态光源和玩家软光</small></span><input type="checkbox" id="enableDynamicLighting"></label>
                                <label class="settings-toggle-card"><span><strong>洞穴孢子</strong><small>漂浮粒子氛围</small></span><input type="checkbox" id="enableAmbientSpores"></label>
                                <label class="settings-toggle-card"><span><strong>角色阴影</strong><small>脚底阴影和落地感</small></span><input type="checkbox" id="enableCharacterShadow"></label>
                                <label class="settings-toggle-card"><span><strong>暖色滤镜</strong><small>整体暖一点，不那么干</small></span><input type="checkbox" id="enableWarmTint"></label>
                                <label class="settings-toggle-card"><span><strong>房间静态缓存</strong><small>缓存地板/墙体静态层，减少重复绘制</small></span><input type="checkbox" id="enableRoomStaticCache"></label>
                                <label class="settings-toggle-card"><span><strong>像素采样模式</strong><small>关闭平滑插值，强化像素边缘</small></span><input type="checkbox" id="enablePixelSampling"></label>
                            </div>
                            <details class="settings-subsection" id="settingsVignetteAdvanced">
                                <summary>暗角分类开关</summary>
                                <div class="settings-toggle-grid">
                                    <label class="settings-toggle-card"><span><strong>其他房间</strong><small>普通房、Boss房、商店、宝箱房等</small></span><input type="checkbox" id="enableOtherRoomVignette"></label>
                                    <label class="settings-toggle-card"><span><strong>隐藏房</strong><small>隐藏房单独暗角控制</small></span><input type="checkbox" id="enableHiddenRoomVignette"></label>
                                    <label class="settings-toggle-card"><span><strong>觉醒房</strong><small>七层觉醒房单独暗角控制</small></span><input type="checkbox" id="enableAwakeningRoomVignette"></label>
                                </div>
                            </details>
                        </details>
                    </section>

                    <section class="settings-section">
                        <div class="settings-section-head">
                            <div>
                                <h3>玩法与界面</h3>
                                <p>这些不太吃性能，但会影响手感。</p>
                            </div>
                        </div>
                        <div class="settings-grid settings-grid--switches">
                            <label class="settings-toggle-card"><span><strong>允许后台运行</strong><small>切到别的窗口时游戏继续跑，不自动暂停</small></span><input type="checkbox" id="allowBackgroundRun"></label>
                            <label class="settings-toggle-card"><span><strong>屏幕震动</strong><small>受击、爆发、解谜反馈</small></span><input type="checkbox" id="enableScreenShake"></label>
                            <label class="settings-toggle-card"><span><strong>强震自动衰减</strong><small>无障碍友好：重击震动自动降幅</small></span><input type="checkbox" id="autoDampenStrongShake"></label>
                            <label class="settings-toggle-card"><span><strong>伤害数字</strong><small>关闭后战斗画面更干净</small></span><input type="checkbox" id="showDamageNumbers"></label>
                            <label class="settings-toggle-card"><span><strong>轻量打击音</strong><small>命中音更克制，长时间战斗更不吵</small></span><input type="checkbox" id="enableMinimalHitSfx"></label>
                            <label class="settings-toggle-card"><span><strong>仅关键音效</strong><small>压低非关键音，保留核心反馈</small></span><input type="checkbox" id="enableCriticalSfxOnly"></label>
                            <label class="settings-toggle-card"><span><strong>敌人 AI 节流</strong><small>远距离敌人降频更新，稳帧优先</small></span><input type="checkbox" id="enableEnemyAiThrottling"></label>
                            <label class="settings-toggle-card"><span><strong>武器节奏节流</strong><small>常驻型武器降频判定，降低战斗负载</small></span><input type="checkbox" id="enableWeaponCadenceThrottling"></label>
                            <label class="settings-toggle-card"><span><strong>电影感镜头</strong><small>缓动预判、冲击缩放与平滑震动</small></span><input type="checkbox" id="enableCinematicCamera"></label>
                            <label class="settings-toggle-card"><span><strong>慢动作白名单</strong><small>仅 Boss 关键演出触发慢动作</small></span><input type="checkbox" id="enableBossSlowmoWhitelist"></label>
                            <label class="settings-group settings-group--select settings-toggle-card"><span><strong>界面主题</strong><small>深色或浅色外观</small></span>
                                <select id="themeSelect">
                                    <option value="dark">深色</option>
                                    <option value="light">浅色</option>
                                </select>
                            </label>
                            <label class="settings-toggle-card settings-toggle-card--wide"><span><strong>DEV 模式</strong><small>开启后可用 F9 打开测试面板，切换会自动刷新</small></span><input type="checkbox" id="enableDevMode"></label>
                        </div>
                        <div id="devModeHint" class="settings-note">关闭时 F9 不会打开测试面板。切换后会自动刷新。</div>
                    </section>
                </div>
                <div class="settings-footer">
                    <button id="settingsCloseFooter" class="settings-close" type="button">返回菜单</button>
                </div>
            </div>
        `;

        this.card.dataset.settingsBuilt = '1';
        this.captureRefs();
    }

    captureRefs() {
        this.closeBtn = document.getElementById('settingsClose');
        this.closeFooterBtn = document.getElementById('settingsCloseFooter');
        this.themeSelect = document.getElementById('themeSelect');
        this.sfxSlider = document.getElementById('sfxVolume');
        this.bgmSlider = document.getElementById('bgmVolume');
        this.masterSlider = document.getElementById('masterVolume');
        this.audioPresetSelect = document.getElementById('audioPreset');
        this.brightnessSlider = document.getElementById('gameBrightness');
        this.entityBrightnessSlider = document.getElementById('entityBrightness');
        this.playerBrightnessSlider = document.getElementById('playerBrightness');
        this.enemyBrightnessSlider = document.getElementById('enemyBrightness');
        this.propBrightnessSlider = document.getElementById('propBrightness');
        this.sfxValue = document.getElementById('sfxVolumeValue');
        this.bgmValue = document.getElementById('bgmVolumeValue');
        this.masterValue = document.getElementById('masterVolumeValue');
        this.brightnessValue = document.getElementById('gameBrightnessValue');
        this.entityBrightnessValue = document.getElementById('entityBrightnessValue');
        this.playerBrightnessValue = document.getElementById('playerBrightnessValue');
        this.enemyBrightnessValue = document.getElementById('enemyBrightnessValue');
        this.propBrightnessValue = document.getElementById('propBrightnessValue');
        this.allowBackgroundRunCheckbox = document.getElementById('allowBackgroundRun');
        this.screenShakeCheckbox = document.getElementById('enableScreenShake');
        this.autoDampenStrongShakeCheckbox = document.getElementById('autoDampenStrongShake');
        this.damageNumbersCheckbox = document.getElementById('showDamageNumbers');
        this.minimalHitSfxCheckbox = document.getElementById('enableMinimalHitSfx');
        this.enableCriticalSfxOnlyCheckbox = document.getElementById('enableCriticalSfxOnly');
        this.enableBossSlowmoWhitelistCheckbox = document.getElementById('enableBossSlowmoWhitelist');
        this.vignetteCheckbox = document.getElementById('enableVignette');
        this.otherRoomVignetteCheckbox = document.getElementById('enableOtherRoomVignette');
        this.hiddenRoomVignetteCheckbox = document.getElementById('enableHiddenRoomVignette');
        this.awakeningRoomVignetteCheckbox = document.getElementById('enableAwakeningRoomVignette');
        this.roomEffectsCheckbox = document.getElementById('enableRoomEffects');
        this.bloomCheckbox = document.getElementById('enableBloom');
        this.colorCheckbox = document.getElementById('enableColorAtmosphere');
        this.dynamicLightingCheckbox = document.getElementById('enableDynamicLighting');
        this.ambientSporesCheckbox = document.getElementById('enableAmbientSpores');
        this.shadowCheckbox = document.getElementById('enableCharacterShadow');
        this.warmTintCheckbox = document.getElementById('enableWarmTint');
        this.roomStaticCacheCheckbox = document.getElementById('enableRoomStaticCache');
        this.pixelSamplingCheckbox = document.getElementById('enablePixelSampling');
        this.enemyAiThrottlingCheckbox = document.getElementById('enableEnemyAiThrottling');
        this.weaponCadenceThrottlingCheckbox = document.getElementById('enableWeaponCadenceThrottling');
        this.cinematicCameraCheckbox = document.getElementById('enableCinematicCamera');
        this.devModeCheckbox = document.getElementById('enableDevMode');
        this.devModeHint = document.getElementById('devModeHint');
        this.graphicsQualityStatus = document.getElementById('graphicsQualityStatus');
        this.qualityButtons = Array.from(document.querySelectorAll('.settings-quality-btn'));
        if (this.closeFooterBtn) this.closeFooterBtn.onclick = this.handleClose;
    }

    syncFromStorage() {
        const settings = this.settingsStore ? this.settingsStore.load() : null;
        const audio = this.audioGetter();
        const masterVolume = settings ? settings.masterVolume : (audio ? audio.masterVolume : 0.6);
        const bgmVolume = settings ? settings.bgmVolume : (audio ? audio.bgmVolume : 0.3);
        const sfxVolume = settings ? settings.sfxVolume : (audio ? audio.sfxVolume : 1.0);
        const gameBrightness = settings ? settings.gameBrightness : 1.0;
        const entityBrightness = settings ? settings.entityBrightness : 0.40;
        const playerBrightness = settings ? settings.playerBrightness : 1.00;
        const enemyBrightness = settings ? settings.enemyBrightness : 1.00;
        const propBrightness = settings ? settings.propBrightness : 1.00;

        this.syncSlider(this.masterSlider, this.masterValue, masterVolume);
        this.syncSlider(this.sfxSlider, this.sfxValue, sfxVolume);
        this.syncSlider(this.bgmSlider, this.bgmValue, bgmVolume);
        this.syncSlider(this.brightnessSlider, this.brightnessValue, gameBrightness);
        this.syncSlider(this.entityBrightnessSlider, this.entityBrightnessValue, entityBrightness);
        this.syncSlider(this.playerBrightnessSlider, this.playerBrightnessValue, playerBrightness);
        this.syncSlider(this.enemyBrightnessSlider, this.enemyBrightnessValue, enemyBrightness);
        this.syncSlider(this.propBrightnessSlider, this.propBrightnessValue, propBrightness);

        if (this.themeSelect && settings) this.themeSelect.value = settings.theme;
        if (this.audioPresetSelect && settings) this.audioPresetSelect.value = settings.audioExperiencePreset || 'standard';
        if (this.allowBackgroundRunCheckbox && settings) this.allowBackgroundRunCheckbox.checked = settings.allowBackgroundRun === true;
        if (this.screenShakeCheckbox && settings) this.screenShakeCheckbox.checked = settings.enableScreenShake;
        if (this.autoDampenStrongShakeCheckbox && settings) this.autoDampenStrongShakeCheckbox.checked = settings.autoDampenStrongShake !== false;
        if (this.damageNumbersCheckbox && settings) this.damageNumbersCheckbox.checked = settings.showDamageNumbers;
        if (this.minimalHitSfxCheckbox && settings) this.minimalHitSfxCheckbox.checked = settings.enableMinimalHitSfx === true;
        if (this.enableCriticalSfxOnlyCheckbox && settings) this.enableCriticalSfxOnlyCheckbox.checked = settings.enableCriticalSfxOnly === true;
        if (this.enableBossSlowmoWhitelistCheckbox && settings) this.enableBossSlowmoWhitelistCheckbox.checked = settings.enableBossSlowmoWhitelist !== false;
        if (this.vignetteCheckbox && settings) this.vignetteCheckbox.checked = settings.enableVignette !== false;
        if (this.otherRoomVignetteCheckbox && settings) this.otherRoomVignetteCheckbox.checked = settings.enableOtherRoomVignette !== false;
        if (this.hiddenRoomVignetteCheckbox && settings) this.hiddenRoomVignetteCheckbox.checked = settings.enableHiddenRoomVignette !== false;
        if (this.awakeningRoomVignetteCheckbox && settings) this.awakeningRoomVignetteCheckbox.checked = settings.enableAwakeningRoomVignette !== false;
        if (this.roomEffectsCheckbox && settings) this.roomEffectsCheckbox.checked = settings.enableRoomEffects !== false;
        if (this.bloomCheckbox && settings) this.bloomCheckbox.checked = settings.enableBloom !== false;
        if (this.colorCheckbox && settings) this.colorCheckbox.checked = settings.enableColorAtmosphere !== false;
        if (this.dynamicLightingCheckbox && settings) this.dynamicLightingCheckbox.checked = settings.enableDynamicLighting !== false;
        if (this.ambientSporesCheckbox && settings) this.ambientSporesCheckbox.checked = settings.enableAmbientSpores !== false;
        if (this.shadowCheckbox && settings) this.shadowCheckbox.checked = settings.enableCharacterShadow !== false;
        if (this.warmTintCheckbox && settings) this.warmTintCheckbox.checked = settings.enableWarmTint !== false;
        if (this.roomStaticCacheCheckbox && settings) this.roomStaticCacheCheckbox.checked = settings.enableRoomStaticCache !== false;
        if (this.pixelSamplingCheckbox && settings) this.pixelSamplingCheckbox.checked = settings.enablePixelSampling === true;
        if (this.enemyAiThrottlingCheckbox && settings) this.enemyAiThrottlingCheckbox.checked = settings.enableEnemyAiThrottling !== false;
        if (this.weaponCadenceThrottlingCheckbox && settings) this.weaponCadenceThrottlingCheckbox.checked = settings.enableWeaponCadenceThrottling !== false;
        if (this.cinematicCameraCheckbox && settings) this.cinematicCameraCheckbox.checked = settings.enableCinematicCamera !== false;
        if (this.devModeCheckbox && settings) this.devModeCheckbox.checked = settings.devMode === true;

        const resolvedQuality = this.settingsStore ? this.settingsStore.detectGraphicsQuality(settings) : (settings?.graphicsQuality || 'high');
        this.updateQualityUI(resolvedQuality, settings?.graphicsQuality || 'high');
        this.updateAdvancedToggleLockState();

        if (this.devModeHint) {
            this.devModeHint.textContent = (settings && settings.devMode)
                ? '已开启。现在可以用 F9 直接打开测试面板。'
                : '关闭时 F9 不会打开测试面板。切换后会自动刷新。';
        }
    }

    updateQualityUI(resolvedQuality, savedQuality = 'high') {
        const activeKey = resolvedQuality === 'custom' ? savedQuality : resolvedQuality;
        this.qualityButtons.forEach((button) => {
            const isActive = button.dataset.quality === activeKey && resolvedQuality !== 'custom';
            button.classList.toggle('is-active', isActive);
        });
        if (this.graphicsQualityStatus) {
            const labelMap = {
                high: '当前：高画质',
                medium: '当前：中画质',
                low: '当前：低画质',
                custom: '当前：自定义（你已经微调）'
            };
            this.graphicsQualityStatus.textContent = labelMap[resolvedQuality] || labelMap.high;
        }
    }

    updateAdvancedToggleLockState() {
        const roomEffectsOn = !!(this.roomEffectsCheckbox && this.roomEffectsCheckbox.checked);
        const vignetteOn = !!(this.vignetteCheckbox && this.vignetteCheckbox.checked);
        if (this.bloomCheckbox) this.bloomCheckbox.disabled = !roomEffectsOn;
        if (this.colorCheckbox) this.colorCheckbox.disabled = !roomEffectsOn;
        if (this.otherRoomVignetteCheckbox) this.otherRoomVignetteCheckbox.disabled = !vignetteOn;
        if (this.hiddenRoomVignetteCheckbox) this.hiddenRoomVignetteCheckbox.disabled = !vignetteOn;
        if (this.awakeningRoomVignetteCheckbox) this.awakeningRoomVignetteCheckbox.disabled = !vignetteOn;
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
        if (this.sfxValue) this.sfxValue.textContent = `${value}%`;
        this.updateSettings({ sfxVolume: value / 100 });
    }

    handleBgmInput(event) {
        const value = parseInt(event.target.value, 10);
        if (this.bgmValue) this.bgmValue.textContent = `${value}%`;
        this.updateSettings({ bgmVolume: value / 100 });
    }

    handleMasterInput(event) {
        const value = parseInt(event.target.value, 10);
        if (this.masterValue) this.masterValue.textContent = `${value}%`;
        this.updateSettings({ masterVolume: value / 100 });
    }

    handleBrightnessInput(event) {
        const value = parseInt(event.target.value, 10);
        if (this.brightnessValue) this.brightnessValue.textContent = `${value}%`;
        this.updateSettings({ gameBrightness: value / 100 });
    }

    handleEntityBrightnessInput(event) {
        const value = parseInt(event.target.value, 10);
        if (this.entityBrightnessValue) this.entityBrightnessValue.textContent = `${value}%`;
        this.updateSettings({ entityBrightness: value / 100 });
    }

    handlePlayerBrightnessInput(event) {
        const value = parseInt(event.target.value, 10);
        if (this.playerBrightnessValue) this.playerBrightnessValue.textContent = `${value}%`;
        this.updateSettings({ playerBrightness: value / 100 });
    }

    handleEnemyBrightnessInput(event) {
        const value = parseInt(event.target.value, 10);
        if (this.enemyBrightnessValue) this.enemyBrightnessValue.textContent = `${value}%`;
        this.updateSettings({ enemyBrightness: value / 100 });
    }

    handlePropBrightnessInput(event) {
        const value = parseInt(event.target.value, 10);
        if (this.propBrightnessValue) this.propBrightnessValue.textContent = `${value}%`;
        this.updateSettings({ propBrightness: value / 100 });
    }

    handleThemeChange(event) {
        this.updateSettings({ theme: event.target.value });
    }

    handleAudioPresetChange(event) {
        this.updateSettings({ audioExperiencePreset: event.target.value || 'standard' });
    }

    handleCheckboxChange(event) {
        const devToggled = event && event.target === this.devModeCheckbox;
        const nextSettings = {
            allowBackgroundRun: !!(this.allowBackgroundRunCheckbox && this.allowBackgroundRunCheckbox.checked),
            autoPauseOnBlur: !(this.allowBackgroundRunCheckbox && this.allowBackgroundRunCheckbox.checked),
            enableScreenShake: !!(this.screenShakeCheckbox && this.screenShakeCheckbox.checked),
            autoDampenStrongShake: !!(this.autoDampenStrongShakeCheckbox && this.autoDampenStrongShakeCheckbox.checked),
            showDamageNumbers: !!(this.damageNumbersCheckbox && this.damageNumbersCheckbox.checked),
            enableMinimalHitSfx: !!(this.minimalHitSfxCheckbox && this.minimalHitSfxCheckbox.checked),
            enableCriticalSfxOnly: !!(this.enableCriticalSfxOnlyCheckbox && this.enableCriticalSfxOnlyCheckbox.checked),
            enableBossSlowmoWhitelist: !!(this.enableBossSlowmoWhitelistCheckbox && this.enableBossSlowmoWhitelistCheckbox.checked),
            audioExperiencePreset: this.audioPresetSelect ? this.audioPresetSelect.value : 'standard',
            enableVignette: !!(this.vignetteCheckbox && this.vignetteCheckbox.checked),
            enableOtherRoomVignette: !!(this.otherRoomVignetteCheckbox && this.otherRoomVignetteCheckbox.checked),
            enableHiddenRoomVignette: !!(this.hiddenRoomVignetteCheckbox && this.hiddenRoomVignetteCheckbox.checked),
            enableAwakeningRoomVignette: !!(this.awakeningRoomVignetteCheckbox && this.awakeningRoomVignetteCheckbox.checked),
            enableRoomEffects: !!(this.roomEffectsCheckbox && this.roomEffectsCheckbox.checked),
            enableBloom: !!(this.bloomCheckbox && this.bloomCheckbox.checked),
            enableColorAtmosphere: !!(this.colorCheckbox && this.colorCheckbox.checked),
            enableDynamicLighting: !!(this.dynamicLightingCheckbox && this.dynamicLightingCheckbox.checked),
            enableAmbientSpores: !!(this.ambientSporesCheckbox && this.ambientSporesCheckbox.checked),
            enableCharacterShadow: !!(this.shadowCheckbox && this.shadowCheckbox.checked),
            enableWarmTint: !!(this.warmTintCheckbox && this.warmTintCheckbox.checked),
            enableRoomStaticCache: !!(this.roomStaticCacheCheckbox && this.roomStaticCacheCheckbox.checked),
            enablePixelSampling: !!(this.pixelSamplingCheckbox && this.pixelSamplingCheckbox.checked),
            enableEnemyAiThrottling: !!(this.enemyAiThrottlingCheckbox && this.enemyAiThrottlingCheckbox.checked),
            enableWeaponCadenceThrottling: !!(this.weaponCadenceThrottlingCheckbox && this.weaponCadenceThrottlingCheckbox.checked),
            enableCinematicCamera: !!(this.cinematicCameraCheckbox && this.cinematicCameraCheckbox.checked),
            devMode: !!(this.devModeCheckbox && this.devModeCheckbox.checked)
        };
        this.updateAdvancedToggleLockState();
        const customSettings = this.settingsStore ? this.settingsStore.patch({ ...nextSettings }) : null;
        const game = this.gameGetter();
        if (customSettings) {
            this.settingsStore.applyToGame(game, customSettings);
            this.updateQualityUI(this.settingsStore.detectGraphicsQuality(customSettings), customSettings.graphicsQuality || 'high');
        }
        if (devToggled && window.setDevModeEnabled) {
            window.setDevModeEnabled(!!nextSettings.devMode, { reload: true, persistSettings: false });
        }
        if (this.devModeHint) {
            this.devModeHint.textContent = nextSettings.devMode
                ? '已开启。现在可以用 F9 直接打开测试面板。'
                : '关闭时 F9 不会打开测试面板。切换后会自动刷新。';
        }
    }

    handleQualityClick(event) {
        const button = event.currentTarget;
        const quality = button?.dataset?.quality;
        if (!quality || !this.settingsStore) return;
        const next = this.settingsStore.patch(this.settingsStore.buildGraphicsPatch(quality));
        const game = this.gameGetter();
        this.settingsStore.applyToGame(game, next);
        this.syncFromStorage();
    }

    handleBackdropClick(event) {
        if (event.target === this.modal) this.close();
    }

    updateSettings(partialSettings) {
        if (!this.settingsStore) return;
        const next = this.settingsStore.patch(partialSettings);
        const game = this.gameGetter();
        this.settingsStore.applyToGame(game, next);
    }
}

window.SettingsController = SettingsController;
