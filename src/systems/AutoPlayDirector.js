(function attachAutoPlayDirector(global) {
    'use strict';

    function nowMs() {
        return (global.performance && typeof global.performance.now === 'function') ? global.performance.now() : Date.now();
    }

    function text(v) {
        return typeof v === 'string' ? v.trim() : '';
    }

    function visible(el) {
        if (!el) return false;
        const style = global.getComputedStyle ? global.getComputedStyle(el) : null;
        return !!style && style.display !== 'none' && style.visibility !== 'hidden' && style.opacity !== '0';
    }

    class AutoPlayDirector {
        constructor(options = {}) {
            this.game = options.game || global.game || null;
            this.enabled = false;
            this.mode = 'idle';
            this.phase = 'idle';
            this.startedAt = 0;
            this.lastActionAt = 0;
            this.lastPhaseAt = 0;
            this.autoRestart = false;
            this.preferredWeapon = '';
            this.selectedWeapon = '';
            this.lastError = '';
            this.loopHandle = 0;
            this.testSuite = null;
            this.lastSuiteReport = null;
            this.ensureLoop();
            this.bindQueryFlags();
        }

        bindQueryFlags() {
            const search = new URLSearchParams(global.location?.search || '');
            const auto = search.get('autoplay');
            const suite = search.get('autosuite');
            if (auto === '1') {
                global.setTimeout(() => this.startRun({
                    autoRestart: search.get('autoloop') === '1',
                    preferredWeapon: search.get('weapon') || ''
                }), 180);
            } else if (suite === 'achievements') {
                global.setTimeout(() => this.startAchievementSuite({
                    preferredWeapon: search.get('weapon') || ''
                }), 180);
            }
        }

        ensureLoop() {
            if (this.loopHandle) return;
            const tick = () => {
                this.loopHandle = global.requestAnimationFrame(tick);
                this.attach(global.game || this.game || null);
                if (this.enabled) this.update();
            };
            this.loopHandle = global.requestAnimationFrame(tick);
        }

        attach(game) {
            if (game) this.game = game;
            if (this.testSuite) this.testSuite.attach(this.game);
        }

        async getHarness() {
            const harness = await global.getAutoPlayHarness?.();
            if (harness && this.game) harness.attach(this.game);
            return harness || null;
        }

        async startRun(options = {}) {
            this.enabled = true;
            this.mode = 'run';
            this.phase = 'boot';
            this.startedAt = Date.now();
            this.lastPhaseAt = nowMs();
            this.lastActionAt = 0;
            this.lastError = '';
            this.autoRestart = !!options.autoRestart;
            this.preferredWeapon = text(options.preferredWeapon).toLowerCase();
            this.selectedWeapon = '';
            const harness = await this.getHarness();
            if (harness) harness.setEnabled(false);
            return true;
        }

        async startAchievementSuite(options = {}) {
            this.enabled = true;
            this.mode = 'achievement_suite';
            this.phase = 'boot';
            this.startedAt = Date.now();
            this.lastPhaseAt = nowMs();
            this.lastActionAt = 0;
            this.lastError = '';
            this.autoRestart = false;
            this.preferredWeapon = text(options.preferredWeapon).toLowerCase();
            this.selectedWeapon = '';
            this.testSuite = new global.MetaAchievementTestSuite(this.game, { resetMetaOnStart: true });
            const harness = await this.getHarness();
            if (harness) harness.setEnabled(false);
            return true;
        }

        async stop() {
            this.enabled = false;
            this.phase = 'idle';
            this.mode = 'idle';
            const harness = await this.getHarness();
            if (harness) harness.setEnabled(false);
            if (this.testSuite?.running) {
                this.lastSuiteReport = this.testSuite.getReport();
                this.testSuite.stop();
            }
            return true;
        }

        canAct(interval = 240) {
            const stamp = nowMs();
            if (stamp - this.lastActionAt < interval) return false;
            this.lastActionAt = stamp;
            return true;
        }

        setPhase(next) {
            if (this.phase === next) return;
            this.phase = next;
            this.lastPhaseAt = nowMs();
        }

        getStatus() {
            return {
                enabled: this.enabled,
                mode: this.mode,
                phase: this.phase,
                selectedWeapon: this.selectedWeapon,
                preferredWeapon: this.preferredWeapon,
                sinceMs: this.startedAt ? (Date.now() - this.startedAt) : 0,
                lastError: this.lastError,
                suite: this.testSuite?.getStatus?.() || null
            };
        }

        async update() {
            const game = this.game || global.game;
            if (!game) {
                this.setPhase('await_game');
                return;
            }
            if (this.handleResultScreen(game)) return;
            if (this.handleEntryFlow(game)) return;
            if (game.state !== 'playing') {
                this.setPhase('await_playing');
                return;
            }
            const harness = await this.getHarness();
            if (harness && !harness.enabled) harness.setEnabled(true);
            if (this.mode === 'achievement_suite') {
                this.setPhase('suite_running');
                await this.updateAchievementSuite();
                return;
            }
            this.setPhase('playing');
        }

        handleEntryFlow(game) {
            if (game.seamlessPrologue?.active && this.canAct(420)) {
                this.setPhase('skip_prologue');
                game.seamlessPrologue.skip?.();
                return true;
            }
            if (this.handleMainMenu()) return true;
            if (this.handleStoryScreen()) return true;
            if (this.handleWeaponSelect()) return true;
            if (game.paused && !game.showResultScreen && this.canAct(320)) {
                this.setPhase('resume_pause');
                game.togglePause?.();
                return true;
            }
            return false;
        }

        handleMainMenu() {
            const menu = global.document.getElementById('mainMenu');
            const startBtn = global.document.getElementById('menuStart');
            if (!visible(menu) || !startBtn) return false;
            this.setPhase('menu_start');
            if (!this.canAct(420)) return true;
            startBtn.click();
            return true;
        }

        handleStoryScreen() {
            const story = global.document.getElementById('story');
            const startBtn = global.document.getElementById('startGameBtn');
            if (!visible(story) || !startBtn) return false;
            this.setPhase('story_confirm');
            if (!this.canAct(420)) return true;
            startBtn.click();
            return true;
        }

        chooseWeaponElement(elements) {
            const scoreType = {
                orbit: 120,
                area: 110,
                aura: 108,
                proj: 92,
                melee: 74,
                instant: 86
            };
            const list = Array.from(elements || []);
            if (!list.length) return null;
            if (this.preferredWeapon) {
                const exact = list.find((el) => String(el.dataset.weapon || '').toLowerCase() === this.preferredWeapon);
                if (exact) return exact;
            }
            const scored = list.map((el) => {
                const key = String(el.dataset.weapon || '');
                const def = global.WEAPONS?.[key] || {};
                let score = scoreType[def.type] || 50;
                if (/圣|雷|风暴|剑|法典|镰/i.test(def.name || key)) score += 10;
                if (def.hiddenFromPool) score -= 999;
                return { el, score, key };
            }).sort((a, b) => b.score - a.score || a.key.localeCompare(b.key));
            return scored[0]?.el || null;
        }

        handleWeaponSelect() {
            const screen = global.document.getElementById('weaponSelect');
            const optionsRoot = global.document.getElementById('weaponOptions');
            if (!visible(screen) || !optionsRoot) return false;
            this.setPhase('weapon_select');
            const candidates = optionsRoot.querySelectorAll('.weapon-option');
            if (!candidates.length || !this.canAct(420)) return true;
            const target = this.chooseWeaponElement(candidates);
            if (!target) return true;
            this.selectedWeapon = String(target.dataset.weapon || '');
            target.click();
            return true;
        }

        handleResultScreen(game) {
            if (!game?.showResultScreen) return false;
            this.setPhase('result');
            if (!this.canAct(900)) return true;
            if (this.mode === 'achievement_suite') {
                game.restartGame?.();
                return true;
            }
            if (this.autoRestart) {
                game.restartGame?.();
                return true;
            }
            this.stop();
            return true;
        }

        async updateAchievementSuite() {
            const game = this.game || global.game;
            if (!game?.metaProgress) return;
            if (!this.testSuite) {
                this.testSuite = new global.MetaAchievementTestSuite(game, { resetMetaOnStart: true });
            }
            if (!this.testSuite.running) {
                await this.testSuite.start({ game });
                return;
            }
            if (this.testSuite.current && nowMs() - this.lastPhaseAt < 120) return;
            const hasNext = await this.testSuite.advance();
            if (!hasNext) {
                this.lastSuiteReport = this.testSuite.getReport();
                this.stop();
            }
        }
    }

    global.AutoPlayDirector = AutoPlayDirector;
    global.getAutoPlayDirector = async function getAutoPlayDirector() {
        if (!global.autoPlayDirector) {
            global.autoPlayDirector = new AutoPlayDirector({ game: global.game || null });
        } else {
            global.autoPlayDirector.attach(global.game || null);
        }
        return global.autoPlayDirector;
    };
})(window);
