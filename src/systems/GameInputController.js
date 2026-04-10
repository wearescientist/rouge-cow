(function attachGameInputController(global) {
    'use strict';

    const GameInputController = {
    setupInput() {

        window.addEventListener('keydown', e => {

            this.keys[e.key] = true;

            

            // 结算画面操作

            if (this.showResultScreen) {

                if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {

                    this.returnToMainMenu();

                }

                return;

            }

            

            // v0.22: 通关剧情按键切换
            if (this.credits && this.credits.active) {
                if (e.key === ' ' || e.key === 'Enter') {
                    this.advanceCredits();
                }
                return;
            }

            

            const blockingOverlayOpen = this.hasBlockingOverlayOpen();
            const modalPauseActive = this.paused && blockingOverlayOpen;

            // ESC暂停/恢复（阻塞弹窗优先处理自身关闭）

            if (e.key === 'Escape') {

                if (this.chestOpen) {
                    this.closeChestSelect();
                    return;
                }

                if (this.weaponBoxOpen) {
                    this.closeWeaponBoxSelect();
                    return;
                }

                if (this.shopOpen) {
                    this.closeShop();
                    return;
                }

                if (this.bossChestLottery && this.bossChestLottery.active && this.bossChestLottery.phase === 'done') {
                    this.closeBossChestLottery();
                    return;
                }

                if (this.state === 'playing' && (!blockingOverlayOpen || this.manualPaused)) {

                    this.togglePause();

                }

                return;

            }

            

            // 如果是手动暂停，不处理其他按键；弹窗暂停仍允许弹窗本身收按键

            if (this.paused && !modalPauseActive) return;

            

            // 升级选择界面操作（4选1）

            if (this.levelUpOpen) {
                if (e.key === 'a' || e.key === 'A') {
                    this.levelUpSelected = this.moveGridSelection(this.levelUpSelected, this.levelUpOptions.length, 2, -1, 0);
                } else if (e.key === 'd' || e.key === 'D') {
                    this.levelUpSelected = this.moveGridSelection(this.levelUpSelected, this.levelUpOptions.length, 2, 1, 0);
                } else if (e.key === 'w' || e.key === 'W') {
                    this.levelUpSelected = this.moveGridSelection(this.levelUpSelected, this.levelUpOptions.length, 2, 0, -1);
                } else if (e.key === 's' || e.key === 'S') {
                    this.levelUpSelected = this.moveGridSelection(this.levelUpSelected, this.levelUpOptions.length, 2, 0, 1);
                } else if (e.key === ' ' || e.key === 'Enter') {
                    this.selectLevelUpOption(this.levelUpSelected >= 0 ? this.levelUpSelected : 0);
                }

                return;

            }

            

            // 宝箱交互
            if (e.key === 'e' || e.key === 'E') {
                // 关闭已打开的界面
                if (this.chestOpen) {
                    this.closeChestSelect();
                    return;
                }
                
                const chest = this.getNearestInteractableChest();
                if (chest) {
                    if (this.curRoom?.type === 'treasure' && Array.isArray(this.curRoom.chests)) {
                        this.openTreasureChest(chest);
                    } else {
                        this.openChestSelect(chest);
                    }
                    return;
                }
            }
            
            // 商店NPC交互 - F交谈，E商店
            if (this.curRoom && this.curRoom.type === 'shop' && this.curRoom.npc) {
                const dx = this.player.x - this.curRoom.npc.x;
                const dy = this.player.y - this.curRoom.npc.y;
                const d = Math.sqrt(dx*dx + dy*dy);
                if (d < 200) { // 放大交互距离
                    // F键 - 与盲眼交谈
                    if (e.key === 'f' || e.key === 'F') {
                        if (window.shopNPCSystem) {
                            window.shopNPCSystem.startDialogue();
                        }
                        return;
                    }
                    // E键 - 打开商店
                    if (e.key === 'e' || e.key === 'E') {
                        if (!this.shopOpen) {
                            this.openShop();
                        } else {
                            this.closeShop();
                        }
                        return;
                    }
                }
            }

            // 通用主交互（七层蜡烛/中央点、对话继续、通用交互）
            if (e.key === 'e' || e.key === 'E') {
                this.triggerPrimaryInteraction();
                return;
            }
            
            // 盲眼对话控制：空格/回车加速当前句，ESC跳过整段
            if (window.shopNPCSystem && window.shopNPCSystem.isTalking) {
                if (e.key === ' ' || e.key === 'Enter' || e.key === 'f' || e.key === 'F') {
                    window.shopNPCSystem.skipLine();
                    return;
                }
                if (e.key === 'Escape') {
                    window.shopNPCSystem.skipDialogue?.();
                    return;
                }
            }

            

            if (this.shopOpen) {
                const shopChoiceCount = this.shopItems.length + 1;
                if (e.key === 'a' || e.key === 'A') {
                    if (this.shopSelected === this.shopItems.length) {
                        this.shopSelected = this.shopItems.length - 1;
                    } else {
                        this.shopSelected = this.moveLinearSelection(this.shopSelected, this.shopItems.length, -1);
                    }
                } else if (e.key === 'd' || e.key === 'D') {
                    if (this.shopSelected === this.shopItems.length) {
                        this.shopSelected = 0;
                    } else {
                        this.shopSelected = this.moveLinearSelection(this.shopSelected, this.shopItems.length, 1);
                    }
                } else if (e.key === 'w' || e.key === 'W' || e.key === 's' || e.key === 'S') {
                    const refreshIndex = this.shopItems.length;
                    this.shopSelected = this.shopSelected === refreshIndex ? 0 : refreshIndex;
                } else if (e.key === ' ' || e.key === 'Enter') {
                    const target = this.shopSelected >= 0 ? this.shopSelected : 0;
                    if (target === this.shopItems.length) {
                        this.refreshShop();
                    } else {
                        this.buyItem(target);
                    }
                } else if (e.key === 'e' || e.key === 'E' || e.key === 'Escape') {
                    this.closeShop();
                }

                return;

            }

            

            // 宝箱选择框按键处理
            if (this.chestOpen) {
                const chestRolling = this.isChestRolling();
                if (!chestRolling && (e.key === 'a' || e.key === 'A' || e.key === 'w' || e.key === 'W')) {
                    this.chestSelected = this.moveLinearSelection(this.chestSelected, this.chestItems.length, -1);
                } else if (!chestRolling && (e.key === 'd' || e.key === 'D' || e.key === 's' || e.key === 'S')) {
                    this.chestSelected = this.moveLinearSelection(this.chestSelected, this.chestItems.length, 1);
                } else if (!chestRolling && (e.key === ' ' || e.key === 'Enter')) {
                    this.selectChestItem(this.chestSelected >= 0 ? this.chestSelected : 0);
                } else if (e.key === 'e' || e.key === 'E' || e.key === 'Escape') {
                    this.closeChestSelect();
                }
                return;
            }
            
            // v0.9.5 - 武器箱选择框按键处理
            if (this.weaponBoxOpen) {
                if (e.key === 'a' || e.key === 'A' || e.key === 'w' || e.key === 'W') {
                    this.weaponBoxSelected = this.moveLinearSelection(this.weaponBoxSelected, this.weaponBoxOptions.length, -1);
                } else if (e.key === 'd' || e.key === 'D' || e.key === 's' || e.key === 'S') {
                    this.weaponBoxSelected = this.moveLinearSelection(this.weaponBoxSelected, this.weaponBoxOptions.length, 1);
                } else if (e.key === ' ' || e.key === 'Enter') {
                    this.selectWeaponBoxOption(this.weaponBoxSelected >= 0 ? this.weaponBoxSelected : 0);
                } else if (e.key === 'e' || e.key === 'E' || e.key === 'Escape') {
                    this.closeWeaponBoxSelect();
                }
                return;
            }
            
            // 👑 金色Boss宝箱抽奖按键处理
            if (this.bossChestLottery && this.bossChestLottery.active) {
                if (this.bossChestLottery.phase === 'done') {
                    if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
                        this.closeBossChestLottery();
                    }
                }
                return;
            }

            

            if (e.key >= '1' && e.key <= '9') {

                const id = parseInt(e.key, 10);

                if (this.items.add(id)) {

                    this.particles.burst(this.player.cx, this.player.cy, '#ff0', 15);  // v0.16.3: 使用中心点

                }

            }

            

            // F键全屏功能已移除

            

            if (e.key === 'g' || e.key === 'G') {

                this.toggleGodMode();

            }
            
            // 速度调整快捷键 -/+ (或 =)

            if (e.key === '-' || e.key === '_') {

                const speeds = [1, 2, 5, 10];

                const currentIdx = speeds.indexOf(this.timeScale);

                const newIdx = Math.max(0, currentIdx - 1);

                this.setSpeed(speeds[newIdx]);

            }

            if (e.key === '=' || e.key === '+' || e.key === '0') {

                const speeds = [1, 2, 5, 10];

                const currentIdx = speeds.indexOf(this.timeScale);

                const newIdx = Math.min(speeds.length - 1, currentIdx + 1);

                this.setSpeed(speeds[newIdx]);

            }

            

            // 存档功能快捷键（第5次迭代）

            if (e.key === 'l' || e.key === 'L') {

                if (this.hasSave()) {

                    this.loadGame();

                    this.particles.burst(this.player.cx, this.player.cy, '#48f', 20);  // v0.16.3: 使用中心点

                    // v0.17.2: 移除调试日志
                    // console.log('📂 已加载存档');

                } else {

                    // v0.17.2: 移除调试日志
                    // console.log('❌ 无存档可加载');

                }

            }

            if (e.key === 'k' || e.key === 'K') {

                this.saveGame();

                    this.particles.burst(this.player.cx, this.player.cy, '#4f4', 20);  // v0.16.3: 使用中心点

                // v0.17.2: 移除调试日志
                // console.log('💾 已手动存档');

            }
            
        });

        

        window.addEventListener('keyup', e => this.keys[e.key] = false);

        

        // 鼠标点击支持

        const canvas = document.getElementById('gameCanvas');

        if (canvas) {

            canvas.addEventListener('mousedown', e => {

                const rect = canvas.getBoundingClientRect();

                const scaleX = canvas.width / rect.width;

                const scaleY = canvas.height / rect.height;

                this.mouseX = (e.clientX - rect.left) * scaleX;

                this.mouseY = (e.clientY - rect.top) * scaleY;

                this.mouseDown = true;

                this.handleClick(this.mouseX, this.mouseY);

            });

            

            canvas.addEventListener('mouseup', () => {

                this.mouseDown = false;

            });

            

            canvas.addEventListener('mousemove', e => {

                const rect = canvas.getBoundingClientRect();

                const scaleX = canvas.width / rect.width;

                const scaleY = canvas.height / rect.height;

                this.mouseX = (e.clientX - rect.left) * scaleX;

                this.mouseY = (e.clientY - rect.top) * scaleY;

                

                // v0.22.1: 暂停菜单悬停效果

                if (this.manualPaused && !this.hasBlockingOverlayOpen()) {

                    this.handlePauseMouseMove(e);

                }

            });

            

            // 触摸控制支持（移动设备）

            canvas.addEventListener('touchstart', e => {

                e.preventDefault();

                const touch = e.touches[0];

                const rect = canvas.getBoundingClientRect();

                const scaleX = canvas.width / rect.width;

                const scaleY = canvas.height / rect.height;

                this.mouseX = (touch.clientX - rect.left) * scaleX;

                this.mouseY = (touch.clientY - rect.top) * scaleY;

                this.mouseDown = true;

                this.handleClick(this.mouseX, this.mouseY);

            }, { passive: false });

            

            canvas.addEventListener('touchmove', e => {

                e.preventDefault();

                const touch = e.touches[0];

                const rect = canvas.getBoundingClientRect();

                const scaleX = canvas.width / rect.width;

                const scaleY = canvas.height / rect.height;

                this.mouseX = (touch.clientX - rect.left) * scaleX;

                this.mouseY = (touch.clientY - rect.top) * scaleY;

            }, { passive: false });

            

            canvas.addEventListener('touchend', e => {

                e.preventDefault();

                this.mouseDown = false;

            }, { passive: false });

            

        }

        // 移动端虚拟摇杆/按钮
        this.setupMobileControls();

        

        // v0.32-fix: 窗口焦点处理 - 切出时自动暂停

        this.wasPausedBeforeBlur = false;

        window.addEventListener('blur', () => {

            if (this.autoPauseOnBlur && this.state === 'playing' && !this.paused) {

                this.wasPausedBeforeBlur = false;

                this.togglePause();

            } else {

                this.wasPausedBeforeBlur = true;

            }

        });

        

        window.addEventListener('focus', () => {

            // 恢复时保持暂停状态，让玩家决定是否继续

            // 这样可以避免突然恢复游戏导致意外

        });

        

        // 页面可见性变化处理（切换标签页）

        document.addEventListener('visibilitychange', () => {

            if (this.autoPauseOnBlur && document.hidden && this.state === 'playing' && !this.paused) {

                this.wasPausedBeforeBlur = false;

                this.togglePause();

            }

        });

    },

    setupMobileControls() {
        const root = document.getElementById('mobileControls');
        const joystick = document.getElementById('mobileJoystick');
        const stick = document.getElementById('mobileStick');
        const dashBtn = document.getElementById('mobileDashBtn');
        const interactBtn = document.getElementById('mobileInteractBtn');
        const confirmBtn = document.getElementById('mobileConfirmBtn');
        const talkBtn = document.getElementById('mobileTalkBtn');
        const pauseBtn = document.getElementById('mobilePauseBtn');
        const cancelBtn = document.getElementById('mobileCancelBtn');
        const auxBtn = document.getElementById('mobileAuxBtn');
        const choiceButtons = [
            document.getElementById('mobileChoice1'),
            document.getElementById('mobileChoice2'),
            document.getElementById('mobileChoice3')
        ].filter(Boolean);
        if (!root || !joystick || !stick) return;
        this.mobileControlsRoot = root;
        this.mobileButtons = { dashBtn, interactBtn, confirmBtn, talkBtn, pauseBtn, cancelBtn, auxBtn, choiceButtons };

        const updateEnabled = () => {
            const bySize = window.innerWidth <= 900 || window.innerHeight <= 620;
            const enabled = this.isMobileDevice || bySize;
            this.mobileInput.enabled = enabled;
            root.dataset.orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
            document.body.classList.toggle('mobile-landscape-mode', enabled && root.dataset.orientation === 'landscape');
            document.body.classList.toggle('mobile-portrait-stage-mode', enabled && root.dataset.orientation === 'portrait');
            if (!enabled) {
                this.mobileInput.active = false;
                this.mobileInput.pointerId = null;
                this.mobileInput.dx = 0;
                this.mobileInput.dy = 0;
                this.resetMobileStickVisual();
            }
            this.updateMobileControlsVisibility();
            requestAnimationFrame(() => {
                this.camera?.updateViewport?.();
            });
        };

        updateEnabled();
        window.addEventListener('resize', updateEnabled);
        window.addEventListener('orientationchange', updateEnabled);

        const getVec = (e) => {
            const r = joystick.getBoundingClientRect();
            const cx = r.left + r.width * 0.5;
            const cy = r.top + r.height * 0.5;
            const dx = e.clientX - cx;
            const dy = e.clientY - cy;
            const radius = r.width * 0.38;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const clamped = Math.min(radius, dist);
            return {
                dx: (dx / dist) * (clamped / radius),
                dy: (dy / dist) * (clamped / radius),
                px: (dx / dist) * clamped,
                py: (dy / dist) * clamped
            };
        };

        const onStickDown = (e) => {
            if (!this.mobileInput.enabled) return;
            e.preventDefault();
            this.mobileInput.active = true;
            this.mobileInput.pointerId = e.pointerId;
            if (window.PointerEvent && typeof joystick.setPointerCapture === 'function') {
                try { joystick.setPointerCapture(e.pointerId); } catch (_) {}
            }
            const v = getVec(e);
            this.mobileInput.dx = v.dx;
            this.mobileInput.dy = v.dy;
            stick.style.transform = `translate3d(${v.px}px, ${v.py}px, 0)`;
        };

        const onStickMove = (e) => {
            if (!this.mobileInput.enabled) return;
            if (!this.mobileInput.active || e.pointerId !== this.mobileInput.pointerId) return;
            e.preventDefault();
            const v = getVec(e);
            this.mobileInput.dx = v.dx;
            this.mobileInput.dy = v.dy;
            stick.style.transform = `translate3d(${v.px}px, ${v.py}px, 0)`;
        };

        const onStickUp = (e) => {
            if (!this.mobileInput.enabled) return;
            if (e.pointerId !== this.mobileInput.pointerId) return;
            this.mobileInput.active = false;
            this.mobileInput.pointerId = null;
            this.mobileInput.dx = 0;
            this.mobileInput.dy = 0;
            this.resetMobileStickVisual();
        };

        joystick.addEventListener('pointerdown', onStickDown, { passive: false });
        joystick.addEventListener('pointermove', onStickMove, { passive: false });
        joystick.addEventListener('pointerup', onStickUp);
        joystick.addEventListener('pointercancel', onStickUp);
        joystick.addEventListener('lostpointercapture', onStickUp);

        if (!window.PointerEvent) {
            joystick.addEventListener('touchstart', (e) => {
                if (!this.mobileInput.enabled) return;
                const t = e.touches[0];
                if (!t) return;
                onStickDown({ preventDefault: () => e.preventDefault(), pointerId: 1, clientX: t.clientX, clientY: t.clientY });
            }, { passive: false });
            joystick.addEventListener('touchmove', (e) => {
                if (!this.mobileInput.enabled || !this.mobileInput.active) return;
                const t = e.touches[0];
                if (!t) return;
                onStickMove({ preventDefault: () => e.preventDefault(), pointerId: 1, clientX: t.clientX, clientY: t.clientY });
            }, { passive: false });
            const clearTouchStick = (e) => {
                onStickUp({ pointerId: 1 });
                if (e && typeof e.preventDefault === 'function') e.preventDefault();
            };
            joystick.addEventListener('touchend', clearTouchStick, { passive: false });
            joystick.addEventListener('touchcancel', clearTouchStick, { passive: false });
        }

        const tapAction = (fn) => (e) => {
            if (!this.mobileInput.enabled) return;
            e.preventDefault();
            fn();
        };
        let pauseLongPressTimer = null;
        let pauseLongPressConsumed = false;
        const clearPauseLongPress = () => {
            if (pauseLongPressTimer) {
                clearTimeout(pauseLongPressTimer);
                pauseLongPressTimer = null;
            }
        };
        const beginPausePress = (e) => {
            if (!this.mobileInput.enabled) return;
            e.preventDefault();
            clearPauseLongPress();
            pauseLongPressConsumed = false;
            pauseLongPressTimer = setTimeout(async () => {
                pauseLongPressTimer = null;
                pauseLongPressConsumed = true;
                await this.activateMobileDebugPanel();
            }, 620);
        };
        const endPausePress = (e, cancelOnly = false) => {
            if (!this.mobileInput.enabled) return;
            if (e && typeof e.preventDefault === 'function') e.preventDefault();
            const consumed = pauseLongPressConsumed;
            clearPauseLongPress();
            pauseLongPressConsumed = false;
            if (!cancelOnly && !consumed) {
                this.togglePause();
            }
        };

        if (dashBtn) {
            dashBtn.addEventListener('pointerdown', tapAction(() => this.pressMobileAction(' ')), { passive: false });
            if (!window.PointerEvent) dashBtn.addEventListener('touchstart', tapAction(() => this.pressMobileAction(' ')), { passive: false });
        }
        if (interactBtn) {
            interactBtn.addEventListener('pointerdown', tapAction(() => this.triggerPrimaryInteraction()), { passive: false });
            if (!window.PointerEvent) interactBtn.addEventListener('touchstart', tapAction(() => this.triggerPrimaryInteraction()), { passive: false });
        }
        if (confirmBtn) {
            confirmBtn.addEventListener('pointerdown', tapAction(() => this.triggerMobileConfirm()), { passive: false });
            if (!window.PointerEvent) confirmBtn.addEventListener('touchstart', tapAction(() => this.triggerMobileConfirm()), { passive: false });
        }
        if (talkBtn) {
            talkBtn.addEventListener('pointerdown', tapAction(() => this.triggerTalkInteraction()), { passive: false });
            if (!window.PointerEvent) talkBtn.addEventListener('touchstart', tapAction(() => this.triggerTalkInteraction()), { passive: false });
        }
        if (pauseBtn) {
            pauseBtn.addEventListener('pointerdown', beginPausePress, { passive: false });
            pauseBtn.addEventListener('pointerup', (e) => endPausePress(e, false), { passive: false });
            pauseBtn.addEventListener('pointercancel', (e) => endPausePress(e, true), { passive: false });
            pauseBtn.addEventListener('pointerleave', (e) => endPausePress(e, true), { passive: false });
            if (!window.PointerEvent) {
                pauseBtn.addEventListener('touchstart', beginPausePress, { passive: false });
                pauseBtn.addEventListener('touchend', (e) => endPausePress(e, false), { passive: false });
                pauseBtn.addEventListener('touchcancel', (e) => endPausePress(e, true), { passive: false });
            }
        }
        if (cancelBtn) {
            cancelBtn.addEventListener('pointerdown', tapAction(() => this.triggerMobileCancel()), { passive: false });
            if (!window.PointerEvent) cancelBtn.addEventListener('touchstart', tapAction(() => this.triggerMobileCancel()), { passive: false });
        }
        if (auxBtn) {
            auxBtn.addEventListener('pointerdown', tapAction(() => this.handleMobileChoice(0)), { passive: false });
            if (!window.PointerEvent) auxBtn.addEventListener('touchstart', tapAction(() => this.handleMobileChoice(0)), { passive: false });
        }
        choiceButtons.forEach((button, index) => {
            button.addEventListener('pointerdown', tapAction(() => this.handleMobileChoice(index)), { passive: false });
            if (!window.PointerEvent) button.addEventListener('touchstart', tapAction(() => this.handleMobileChoice(index)), { passive: false });
        });
    },

    resetMobileStickVisual() {
        const stick = document.getElementById('mobileStick');
        if (stick) stick.style.transform = 'translate3d(0, 0, 0)';
    },

    pressMobileAction(key) {
        this.keys[key] = true;
        setTimeout(() => { this.keys[key] = false; }, 90);
    },

    triggerMobileConfirm() {
        if (this.showResultScreen) {
            this.returnToMainMenu();
            return;
        }
        if (this.bossChestLottery && this.bossChestLottery.active && this.bossChestLottery.phase === 'done') {
            this.closeBossChestLottery();
            return;
        }
        if (this.levelUpOpen) {
            this.selectLevelUpOption(this.levelUpSelected >= 0 ? this.levelUpSelected : 0);
            return;
        }
        if (this.shopOpen) {
            const target = this.shopSelected >= 0 ? this.shopSelected : 0;
            if (target === this.shopItems.length) this.refreshShop();
            else this.buyItem(target);
            return;
        }
        if (this.chestOpen) {
            this.selectChestItem(this.chestSelected >= 0 ? this.chestSelected : 0);
            return;
        }
        if (this.weaponBoxOpen) {
            this.selectWeaponBoxOption(this.weaponBoxSelected >= 0 ? this.weaponBoxSelected : 0);
            return;
        }
        if (this.paused && !this.hasBlockingOverlayOpen()) {
            this.executePauseButton('resume');
            return;
        }
        this.triggerPrimaryInteraction();
    },

    triggerMobileCancel() {
        if (this.showResultScreen) return;
        if (this.bossChestLottery && this.bossChestLottery.active && this.bossChestLottery.phase === 'done') {
            this.closeBossChestLottery();
            return;
        }
        if (this.shopOpen) {
            this.closeShop();
            return;
        }
        if (this.chestOpen) {
            this.closeChestSelect();
            return;
        }
        if (this.weaponBoxOpen) {
            this.closeWeaponBoxSelect();
            return;
        }
        if (this.manualPaused && !this.hasBlockingOverlayOpen()) {
            this.togglePause();
        }
    },

    getInteractionContext() {
        if (!this.player) {
            return { type: 'interact', label: '交互' };
        }
        if (window.shopNPCSystem && window.shopNPCSystem.isTalking) {
            return { type: 'dialogue', label: '继续' };
        }
        if (this.shopOpen) {
            return { type: 'shop_close', label: '离店' };
        }
        if (this.chestOpen) {
            return { type: 'chest_close', label: '关闭' };
        }
        const chest = this.getNearestInteractableChest();
        if (chest) {
            if (this.curRoom?.type === 'treasure' && Array.isArray(this.curRoom.chests)) {
                const profile = this.getTreasureChestProfile(chest.quality);
                return { type: 'chest_open', label: `开${profile.label}` };
            }
            return { type: 'chest_open', label: this.curRoom.type === 'hidden' ? '开启密藏' : '开箱' };
        }
        if (this.curRoom && this.curRoom.type === 'shop' && this.curRoom.npc) {
            const dx = this.player.x - this.curRoom.npc.x;
            const dy = this.player.y - this.curRoom.npc.y;
            if (Math.sqrt(dx * dx + dy * dy) < 200) {
                return { type: 'shop_open', label: this.shopOpen ? '离店' : '商店' };
            }
        }
        const floor7Context = this.floor7AwakeningSystem?.getInteractionContext?.();
        if (floor7Context) return floor7Context;
        return { type: 'interact', label: '交互' };
    },

    triggerPrimaryInteraction() {
        const context = this.getInteractionContext();
        switch (context.type) {
            case 'floor7_locked':
                break;
            case 'floor7_candle':
                this.floor7AwakeningSystem?.triggerCurrentCandle?.();
                break;
            case 'floor7_center':
                this.floor7AwakeningSystem?.triggerCurrentCenter?.();
                break;
            case 'dialogue':
                if (window.shopNPCSystem) window.shopNPCSystem.skipLine();
                break;
            case 'shop_close':
                this.closeShop();
                break;
            case 'chest_close':
                this.closeChestSelect();
                break;
            case 'chest_open':
                const chest = this.getNearestInteractableChest();
                if (chest) {
                    if (this.curRoom?.type === 'treasure' && Array.isArray(this.curRoom.chests)) {
                        this.openTreasureChest(chest);
                    } else {
                        this.openChestSelect(chest);
                    }
                }
                break;
            case 'shop_open':
                if (!this.shopOpen) this.openShop();
                else this.closeShop();
                break;
            default:
                this.pressMobileAction('e');
                break;
        }
    },

    triggerTalkInteraction() {
        if (window.shopNPCSystem && window.shopNPCSystem.isTalking) {
            window.shopNPCSystem.skipLine();
            return;
        }
        if (this.curRoom && this.curRoom.type === 'shop' && this.curRoom.npc) {
            const dx = this.player.x - this.curRoom.npc.x;
            const dy = this.player.y - this.curRoom.npc.y;
            if (Math.sqrt(dx * dx + dy * dy) < 200 && window.shopNPCSystem) {
                window.shopNPCSystem.startDialogue();
                return;
            }
        }
        this.pressMobileAction('f');
    },

    async activateMobileDebugPanel() {
        if (!window.DEV_MODE_ENABLED) {
            window.DEV_MODE_ENABLED = true;
            try { localStorage.setItem('dev_mode', '1'); } catch (_) {}
        }
        if (typeof this.toggleDebugPanel === 'function') {
            const handled = await this.toggleDebugPanel();
            return handled !== false;
        }
        await window.ensureDevToolsLoaded?.();
        if (!this.debugPanel && window.DebugPanel) {
            this.debugPanel = new window.DebugPanel(this);
            this.initDebugPanel?.();
        }
        this.debugPanel?.toggle?.();
        return true;
    },

    handleMobileChoice(index) {
        if (this.shopOpen) {
            this.buyItem(index);
            return;
        }
        if (this.chestOpen) {
            this.selectChestItem(index);
        }
    },

    getMobileMoveVector() {
        if (!this.mobileInput || !this.mobileInput.enabled || !this.mobileInput.active) {
            return { x: 0, y: 0 };
        }
        const deadZone = 0.16;
        let x = this.mobileInput.dx || 0;
        let y = this.mobileInput.dy || 0;
        if (Math.abs(x) < deadZone) x = 0;
        if (Math.abs(y) < deadZone) y = 0;
        return { x, y };
    },

    updateMobileControlsVisibility() {
        const root = this.mobileControlsRoot || document.getElementById('mobileControls');
        if (!root) return;
        const shouldShow = !!(
            this.mobileInput &&
            this.mobileInput.enabled &&
            this.state === 'playing' &&
            !this.showResultScreen
        );
        root.classList.toggle('active', shouldShow);
        root.dataset.orientation = window.innerWidth > window.innerHeight ? 'landscape' : 'portrait';
        document.body.classList.toggle('mobile-hud-mode', shouldShow);
        document.body.classList.toggle('mobile-landscape-mode', shouldShow && root.dataset.orientation === 'landscape');
        document.body.classList.toggle('mobile-portrait-stage-mode', shouldShow && root.dataset.orientation === 'portrait');
        if (shouldShow) {
            this.updateMobileControlsLayout();
            this.updateMobileActionState();
        }
        requestAnimationFrame(() => {
            this.camera?.updateViewport?.();
        });
    },

    updateMobileControlsLayout() {
        const root = this.mobileControlsRoot || document.getElementById('mobileControls');
        const centerGame = document.getElementById('centerGame');
        if (!root || !centerGame) return;

        const centerRect = centerGame.getBoundingClientRect();
        if (!centerRect || centerRect.width <= 0 || centerRect.height <= 0) return;

        const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 0;
        const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
        if (!viewportWidth || !viewportHeight) return;

        const compact = viewportWidth <= 600;
        root.dataset.orientation = viewportWidth > viewportHeight ? 'landscape' : 'portrait';
        const panelGap = compact ? 10 : 14;
        const bottomPad = compact ? 8 : 12;
        const minHeight = compact ? 148 : 166;
        const maxHeight = compact ? 196 : 236;
        const availableHeight = Math.max(0, viewportHeight - centerRect.bottom - panelGap - bottomPad);
        const panelHeight = Math.max(minHeight, Math.min(maxHeight, availableHeight));
        const panelTop = Math.min(viewportHeight - bottomPad - panelHeight, centerRect.bottom + panelGap);
        const panelLeft = Math.max(compact ? 12 : 16, centerRect.left);
        const panelRightGap = Math.max(compact ? 12 : 16, viewportWidth - centerRect.right);

        root.style.setProperty('--mobile-control-side-pad', `${Math.round(panelLeft)}px`);
        root.style.setProperty('--mobile-control-panel-left', `${Math.round(panelLeft)}px`);
        root.style.setProperty('--mobile-control-right-gap', `${Math.round(panelRightGap)}px`);
        root.style.setProperty('--mobile-control-panel-right-gap', `${Math.round(panelRightGap)}px`);
        root.style.setProperty('--mobile-control-bottom-pad', `${bottomPad}px`);
        root.style.setProperty('--mobile-control-panel-top', `${Math.round(panelTop)}px`);
        root.style.setProperty('--mobile-control-panel-height', `${Math.round(panelHeight)}px`);

        const topHud = root.querySelector('.mobile-top-hud');
        const isLandscape = root.dataset.orientation === 'landscape';
        const baseTopHudWidth = Math.max(240, topHud?.offsetWidth || 320);
        const baseTopHudHeight = Math.max(72, topHud?.offsetHeight || 108);
        const availableTopWidth = Math.max(220, viewportWidth - Math.max(20, panelLeft + panelRightGap));
        const availableTopHeight = isLandscape
            ? Math.max(76, Math.min(centerRect.height * 0.28, viewportHeight * 0.24))
            : Math.max(74, centerRect.top - Math.max(8, (compact ? 8 : 10)));
        const hudScaleX = availableTopWidth / baseTopHudWidth;
        const hudScaleY = availableTopHeight / baseTopHudHeight;
        const mobileTopHudScale = Math.max(isLandscape ? 0.66 : 0.74, Math.min(isLandscape ? 0.92 : 1, hudScaleX, hudScaleY));

        const leftScale = isLandscape
            ? Math.max(0.68, Math.min(0.84, centerRect.height / 820, viewportWidth / 1320))
            : Math.max(0.72, Math.min(0.94, panelHeight / 214, viewportWidth / 640));
        const rightScale = isLandscape
            ? Math.max(0.66, Math.min(0.82, centerRect.height / 800, viewportWidth / 1280))
            : Math.max(0.70, Math.min(0.92, panelHeight / 208, viewportWidth / 620));
        const centerActionScale = isLandscape
            ? Math.max(0.74, Math.min(0.90, centerRect.height / 760, viewportWidth / 1220))
            : Math.max(0.78, Math.min(0.96, panelHeight / 196, viewportWidth / 660));
        const choiceScale = isLandscape
            ? Math.max(0.76, Math.min(0.92, viewportWidth / 1320, centerRect.height / 760))
            : Math.max(0.82, Math.min(0.98, viewportWidth / 760));

        root.style.setProperty('--mobile-top-hud-scale', mobileTopHudScale.toFixed(3));
        root.style.setProperty('--mobile-left-control-scale', leftScale.toFixed(3));
        root.style.setProperty('--mobile-right-control-scale', rightScale.toFixed(3));
        root.style.setProperty('--mobile-center-action-scale', centerActionScale.toFixed(3));
        root.style.setProperty('--mobile-choice-scale', choiceScale.toFixed(3));
    },

    updateMobileActionState() {
        const context = this.getInteractionContext();
        const canTalk = !!(
            (window.shopNPCSystem && window.shopNPCSystem.isTalking) ||
            (this.player && this.curRoom && this.curRoom.type === 'shop' && this.curRoom.npc &&
             Math.sqrt((this.player.x - this.curRoom.npc.x) ** 2 + (this.player.y - this.curRoom.npc.y) ** 2) < 200)
        );

        this.sidebarHudPresenter.updateMobileActionState({
            ...context,
            canTalk,
            talkLabel: (window.shopNPCSystem && window.shopNPCSystem.isTalking) ? '继续' : '对话',
            showChoices: this.shopOpen || this.chestOpen
        });
    },

    moveLinearSelection(current, count, delta) {
        if (count <= 0) return -1;
        const base = current >= 0 ? current : 0;
        return (base + delta + count) % count;
    },

    moveGridSelection(current, count, columns, dx, dy) {
        if (count <= 0) return -1;
        const safeColumns = Math.max(1, columns || 1);
        const base = current >= 0 ? current : 0;
        let row = Math.floor(base / safeColumns);
        let col = base % safeColumns;
        const maxRow = Math.floor((count - 1) / safeColumns);

        row = Math.max(0, Math.min(maxRow, row + dy));
        col = Math.max(0, Math.min(safeColumns - 1, col + dx));

        let next = row * safeColumns + col;
        while (next >= count && col > 0) {
            col--;
            next = row * safeColumns + col;
        }
        return Math.max(0, Math.min(count - 1, next));
    },

    handleClick(x, y) {
        // v0.22.1: 暂停菜单点击处理
        if (this.manualPaused && !this.hasBlockingOverlayOpen()) {
            const pausePoint = this.toOverlayPoint(x, y);
            this.handlePauseCanvasClick(pausePoint.x, pausePoint.y);
            return;
        }
        
        // v0.22: 通关剧情点击切换
        if (this.credits && this.credits.active) {
            this.advanceCredits();
            return;
        }

        // v0.22: 检测点击的UI窗口并设为活动窗口
        const overlayPoint = this.toOverlayPoint(x, y);
        const clickedUI = this.detectClickedUI(overlayPoint.x, overlayPoint.y);
        if (clickedUI) {
            this.activeUIWindow = clickedUI;
        }

        // 结算画面点击处理

        if (this.showResultScreen) {

            // 使用保存的按钮坐标进行检测

            const btn = this.resultBtnRect;

            if (btn && overlayPoint.x > btn.x && overlayPoint.x < btn.x + btn.w && overlayPoint.y > btn.y && overlayPoint.y < btn.y + btn.h) {

                this.returnToMainMenu();

            }

            return;

        }

        

        // 升级选择界面点击处理（4选1）

        if (this.levelUpOpen) {
            const cards = this.overlayHitRegions?.levelUp?.cards || [];
            for (let i = 0; i < cards.length; i++) {
                const card = cards[i];
                if (overlayPoint.x > card.x && overlayPoint.x < card.x + card.w && overlayPoint.y > card.y && overlayPoint.y < card.y + card.h) {
                    this.levelUpSelected = i;
                    this.selectLevelUpOption(i);
                    return;
                }
            }
            return;

        }

        

        // 商店界面点击处理

        if (this.shopOpen) {
            const shopRegion = this.overlayHitRegions?.shop;
            if (!shopRegion) return;
            if (overlayPoint.x < shopRegion.panel.x || overlayPoint.x > shopRegion.panel.x + shopRegion.panel.w || overlayPoint.y < shopRegion.panel.y || overlayPoint.y > shopRegion.panel.y + shopRegion.panel.h) {
                this.closeShop();
                return;
            }
            const refresh = shopRegion.refresh;
            if (refresh && overlayPoint.x >= refresh.x && overlayPoint.x <= refresh.x + refresh.w && overlayPoint.y >= refresh.y && overlayPoint.y <= refresh.y + refresh.h) {
                this.shopSelected = this.shopItems.length;
                this.refreshShop();
                return;
            }
            const items = shopRegion.items || [];
            for (let i = 0; i < items.length; i++) {
                const itemRect = items[i];
                if (overlayPoint.x > itemRect.x && overlayPoint.x < itemRect.x + itemRect.w &&
                    overlayPoint.y > itemRect.y && overlayPoint.y < itemRect.y + itemRect.h) {
                    this.shopSelected = i;
                    this.buyItem(i);
                    return;
                }
            }
            return;
        }
        
        // 宝箱选择框点击处理
        if (this.chestOpen) {
            const chestRegion = this.overlayHitRegions?.chest;
            if (!chestRegion) return;
            if (overlayPoint.x < chestRegion.panel.x || overlayPoint.x > chestRegion.panel.x + chestRegion.panel.w || overlayPoint.y < chestRegion.panel.y || overlayPoint.y > chestRegion.panel.y + chestRegion.panel.h) {
                if (this.chestUiMode === 'treasure_bundle') return;
                this.closeChestSelect();
                return;
            }
            const items = chestRegion.items || [];
            for (let i = 0; i < items.length; i++) {
                const itemRect = items[i];
                if (overlayPoint.x > itemRect.x && overlayPoint.x < itemRect.x + itemRect.w &&
                    overlayPoint.y > itemRect.y && overlayPoint.y < itemRect.y + itemRect.h) {
                    this.chestSelected = i;
                    this.selectChestItem(i);
                    return;
                }
            }
            return;
        }
        
        // 武器箱选择框点击处理
        if (this.weaponBoxOpen) {
            const weaponRegion = this.overlayHitRegions?.weaponBox;
            if (!weaponRegion) return;
            if (overlayPoint.x < weaponRegion.panel.x || overlayPoint.x > weaponRegion.panel.x + weaponRegion.panel.w || overlayPoint.y < weaponRegion.panel.y || overlayPoint.y > weaponRegion.panel.y + weaponRegion.panel.h) {
                this.closeWeaponBoxSelect();
                return;
            }
            const items = weaponRegion.items || [];
            for (let i = 0; i < items.length; i++) {
                const itemRect = items[i];
                if (overlayPoint.x > itemRect.x && overlayPoint.x < itemRect.x + itemRect.w &&
                    overlayPoint.y > itemRect.y && overlayPoint.y < itemRect.y + itemRect.h) {
                    this.weaponBoxSelected = i;
                    this.selectWeaponBoxOption(i);
                    return;
                }
            }
            return;
        }
        
        // 👑 金色Boss宝箱抽奖点击处理
        if (this.bossChestLottery && this.bossChestLottery.active) {
            // 只有完成阶段才能点击关闭
            if (this.bossChestLottery.phase === 'done') {
                this.closeBossChestLottery();
            }
            return;
        }
    },

    detectClickedUI(x, y) {
        if (this.weaponBoxOpen) {
            const panel = this.overlayHitRegions?.weaponBox?.panel;
            if (panel && x >= panel.x && x <= panel.x + panel.w && y >= panel.y && y <= panel.y + panel.h) {
                return 'weaponBox';
            }
        }
        if (this.chestOpen) {
            const panel = this.overlayHitRegions?.chest?.panel;
            if (panel && x >= panel.x && x <= panel.x + panel.w && y >= panel.y && y <= panel.y + panel.h) {
                return 'chest';
            }
        }
        if (this.levelUpOpen) {
            const panel = this.overlayHitRegions?.levelUp?.panel;
            if (panel && x >= panel.x && x <= panel.x + panel.w && y >= panel.y && y <= panel.y + panel.h) {
                return 'levelUp';
            }
        }
        if (this.shopOpen) {
            const panel = this.overlayHitRegions?.shop?.panel;
            if (panel && x >= panel.x && x <= panel.x + panel.w && y >= panel.y && y <= panel.y + panel.h) {
                return 'shop';
            }
        }
        
        return null;
    },

    };

    global.GameInputController = GameInputController;
})(typeof window !== 'undefined' ? window : globalThis);
