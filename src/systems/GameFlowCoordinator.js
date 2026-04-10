(function attachGameFlowCoordinator(global) {
    'use strict';

    function randIntInclusive(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    const GameFlowCoordinator = {
        endGame(game, result) {
            if (game.isRestarting) return null;
            const scoreData = game.scoreManager.end(result);
            game.gameResult = result;
            game.gameResultData = scoreData;
            game.showResultScreen = true;
            return scoreData;
        },

        returnToMainMenu(game) {
            game.paused = true;
            game.credits = null;
            game.hideFullscreenCinematicOverlay();
            game.isRestarting = true;
            game.godMode = true;
            game.showResultScreen = false;
            game.gameResult = null;
            game.gameResultData = null;
            game.state = 'menu';
            game.scoreManager.isPlaying = false;
            game.screenFlow?.showStory();
            this.restartGame(game);
        },

        restartGame(game) {
            game.curRoom = null;
            game.allRooms = null;
            game.playerOverheadDialogue?.stop();
            game._weaponSelecting = false;
            game.destroy();
            game.isRestarting = true;
            game.state = 'menu';
            game.scoreManager.isPlaying = false;
            game.player.hp = game.player.maxHp = 6;
            game.player.exp = 0;
            game.player.lv = 1;
            game.player.gold = 20;
            game.player.facingRight = true;
            game.player.isMoving = false;
            game.player.walkCycle = 0;
            game.player.isDashing = false;
            game.player.dashTime = 0;
            game.player.dashCooldown = 0;
            game.player.dashDirection = { x: 0, y: 0 };
            game.player.dashTrail = [];
            game.player.jumpY = 0;
            game.player.blinkTimer = 0;
            game.player.idleTimer = 0;
            game.player.isEating = false;
            game.player.eatTimer = 0;
            game.player.nextBlinkMs = 2200 + Math.random() * 1400;
            game.player.nextEatMs = 5200 + Math.random() * 2400;
            game.player.history = [];
            game.player.isBlinking = false;
            game.currentFloor = 1;
            game.ensureRunSeed(true);
            game.storyFlags = { shown: {} };
            game.pendingFloorIntroFloor = null;
            game.weapons = [];
            game.passives = new PassiveManager(game.player);
            game.items = new ItemManager(game.player);
            game.totems = new TotemManager();
            game.regenTimer = 0;
            game.bullets = [];
            game.orbitals = [];
            game.guardianKnives = [];
            game.lastGuardianKnifeWhistleAt = 0;
            game.lightningEffects = [];
            game._roomAreaShotKeys = new Set();
            game.particles = new ParticleSystem();
            game.damageNumbers = new DamageNumberSystem();
            game.settingsStore.applyToGame(game, game.runtimeSettings);
            game.paused = false;
            game.manualPaused = false;
            game.state = 'menu';
            game.timeScale = 1;
            game.lastT = null;
            try { game.setSpeed(1); } catch (e) { console.error('setSpeed 失败:', e); }
            game.shopOpen = false;
            game.levelUpOpen = false;
            game.chestOpen = false;
            game.shopItems = [];
            game.chestItems = [];
            game.activeChestSource = null;
            game.activeTreasureRewardOrigin = null;
            game.chestUiMode = 'choice';
            game.chestUiTitle = '幸运抽奖宝箱';
            game.chestUiSubtitle = '三选一奖励包 | WASD 切换 | 空格确认 | E / Esc 关闭';
            game.chestRollState = null;
            game.levelUpOptions = [];
            game.panelRefreshCharges = 0;
            game.panelRefreshChargesMax = 0;
            game.shopRefreshCount = 0;
            game.sidebarHudPresenter.resetDebugUI();
            game.camera.x = SURVIVOR_CONFIG.ROOM_WIDTH / 2;
            game.camera.y = SURVIVOR_CONFIG.ROOM_HEIGHT / 2;
            game.regenerateMap();
            if (game.bloodStains) game.bloodStains.stainsByRoom.clear();
            game.scoreManager.start();
            game.screenFlow?.showMainMenu();
            if (game.audio) game.audio.playBGM('menu');
        },

        startGame(game) {
            game.deleteSave();
            game.checkpointState = null;
            game.playerOverheadDialogue?.stop();
            if (global.HiddenRoomSystemRuntime?.resetAll) {
                global.HiddenRoomSystemRuntime.resetAll(game);
            }
            if (global.HiddenRoomSystemRuntime?.clearLocalProgress) {
                global.HiddenRoomSystemRuntime.clearLocalProgress();
            }
            game.enterWeaponSelectionFlow();
        },

        async continueGame(game) {
            if (!this.loadGame(game)) {
                game.showToast('存档加载失败，可能是旧存档损坏。', { tone: 'error' });
                return;
            }

            game.screenFlow?.hideMainMenu();
            await game.ensureRunCoreAssetsReady({
                showOverlay: true,
                status: '正在恢复洞穴',
                text: '正在补齐当前存档所需素材...'
            });
            game.showResultScreen = false;
            game.gameResult = null;
            game.gameResultData = null;
            game.credits = null;
            game.hideFullscreenCinematicOverlay();
            game.screenFlow?.showGameplay();
            game.kickOffDeferredWarmup();
            game.camera?.updateViewport?.();
            game.initItemGrid?.();
            requestAnimationFrame(() => game.refreshInkStageDecor(true));
            if (!game.rafId) game.loop(0);
            game.isRestarting = false;
            game.godMode = false;
            game.paused = false;
            game.manualPaused = false;
            game.scoreManager.start();
            game.state = 'playing';
            setTimeout(() => game.handleStoryRoomEntry(game.curRoom), 180);
        },

        togglePause(game) {
            if (game.hasBlockingOverlayOpen()) return;
            game.manualPaused = !game.manualPaused;
            game.refreshPauseState();
        },

        goToNextFloor(game) {
            if (game.currentFloor >= game.maxFloors) {
                game.startVictorySequence();
                return;
            }
            game.beginFloorTransition();
        },

        saveGame(game) {
            try {
                const saveData = {
                    player: {
                        hp: game.player.hp,
                        maxHp: game.player.maxHp,
                        exp: game.player.exp,
                        lv: game.player.lv,
                        gold: game.player.gold
                    },
                    items: game.items.owned,
                    itemGrowth: game.items.growthState || {},
                    weapons: game.weapons.map((w) => ({ key: w.baseKey, level: w.level, evolution: w.evolution })),
                    currentFloor: game.currentFloor,
                    runSeed: game.runSeed,
                    storyFlags: game.storyFlags ? JSON.parse(JSON.stringify(game.storyFlags)) : { shown: {} },
                    checkpoint: game.checkpointState || game.captureCheckpoint(game.curRoom, { playerX: game.player.x, playerY: game.player.y, floor: game.currentFloor }),
                    floorCheckpoint: game.serializeCurrentFloorCheckpointState(game.currentFloor),
                    hiddenRooms: game.hiddenRooms ? JSON.parse(JSON.stringify(game.hiddenRooms)) : null,
                    timestamp: Date.now()
                };

                if (!game.saveStateAdapter.setSaveString(JSON.stringify(saveData))) return false;
                return true;
            } catch (e) {
                console.error('存档失败:', e);
                return false;
            }
        },

        loadGame(game) {
            try {
                const saveData = game.saveStateAdapter.getSaveString();
                if (!saveData) return false;
                const data = JSON.parse(saveData);
                Object.assign(game.player, data.player);
                game.player.isDashing = false;
                game.player.dashTime = 0;
                game.player.hitTimer = 0;
                game.items.owned = data.items || {};
                game.items.growthState = data.itemGrowth || {};
                game.items.dirty = true;
                if (data.weapons && data.weapons.length > 0) {
                    game.weapons = data.weapons.map((w) => new Weapon(w.key, w.level, w.evolution));
                }
                if (data.hiddenRooms) {
                    game.hiddenRooms = JSON.parse(JSON.stringify(data.hiddenRooms));
                    if (global.HiddenRoomSystemRuntime?.saveState) global.HiddenRoomSystemRuntime.saveState(game);
                }
                game.rebuildWorldFromSaveData(data);
                global.collectionCodex?.syncFromGame?.(game);
                return true;
            } catch (e) {
                console.error('读档失败:', e);
                return false;
            }
        },

        buildTreasureRewardByTierAndType(game, tier, rewardType) {
            return this.buildTreasureChestChoice(game, tier, rewardType);
        },

        generateTreasureChestRewardsByQuality(game, quality = 'common') {
            const rewards = [];
            const usedTypes = new Set();
            for (let i = 0; i < 3; i++) {
                const tier = game.rollTreasureTierForChest(quality, i);
                const rewardType = game.rollTreasureRewardType(Array.from(usedTypes));
                usedTypes.add(rewardType);
                rewards.push(this.buildTreasureRewardByTierAndType(game, tier, rewardType));
            }
            return rewards;
        },

        buildTreasureChestChoice(game, tierOverride = null, rewardTypeOverride = null) {
            const tier = tierOverride || game.rollTreasureRewardTier();
            const rewardType = rewardTypeOverride || game.rollTreasureRewardType();
            const floor = game.currentFloor || 1;
            const count = tier.count;
            const clearReward = game.estimateNormalRoomClearRewards(floor);
            const resourceMultiplier = game.getTreasureResourceMultiplierByTier(tier.key);
            const reward = {
                rewardType,
                tier: tier.key,
                tierLabel: tier.label,
                count,
                accent: tier.accent,
                icon: '🎁',
                name: tier.label + '奖励',
                desc: '',
                rewards: [],
                value: 0
            };

            if (rewardType === 'item') {
                const availableItems = game.getAvailableItemsByFloor().slice();
                while (reward.rewards.length < count && availableItems.length > 0) {
                    const idx = randIntInclusive(0, availableItems.length - 1);
                    reward.rewards.push(availableItems.splice(idx, 1)[0]);
                }
                reward.icon = tier.key === 'legendary' ? '🌈' : (tier.key === 'rare' ? '✨' : '📦');
                reward.name = `${tier.label}道具包`;
                reward.desc = reward.rewards.length > 0 ? `获得 ${reward.rewards.length} 个随机道具` : '道具池已空，开启后会自动转成金币补偿';
                return reward;
            }

            if (rewardType === 'weapon') {
                reward.icon = tier.key === 'legendary' ? '⚔️' : (tier.key === 'rare' ? '🗡️' : '🔧');
                reward.name = `${tier.label}武器包`;
                reward.desc = `获得 ${count} 次随机武器奖励`;
                return reward;
            }

            if (rewardType === 'gold') {
                reward.icon = tier.key === 'legendary' ? '👑' : '💰';
                reward.name = `${tier.label}金币包`;
                const baseline = Math.max(16, Math.round(clearReward.gold * resourceMultiplier));
                const targetValue = typeof game.getTargetGoldRewardValue === 'function'
                    ? game.getTargetGoldRewardValue(game.currentFloor || 1, tier.key)
                    : baseline;
                reward.value = Math.max(baseline, targetValue);
                reward.desc = `获得 ${reward.value} 金币`;
                return reward;
            }

            reward.icon = '💰';
            reward.name = `${tier.label}补给包`;
            reward.value = Math.max(18, Math.round(clearReward.gold * 1.1));
            reward.desc = `获得 ${reward.value} 金币`;
            return reward;
        }
    };

    global.GameFlowCoordinator = GameFlowCoordinator;
})(window);
