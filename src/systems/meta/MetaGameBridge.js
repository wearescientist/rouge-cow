(function attachMetaGameBridge(global) {
    'use strict';

    function wrapMethod(target, methodName, wrapper) {
        const original = target?.[methodName];
        if (typeof original !== 'function') return;
        target[methodName] = wrapper(original);
    }

    function ensureMeta(game) {
        if (!game || game.metaProgress) return game?.metaProgress || null;
        game.metaProgress = new global.MetaProgressController(game);
        return game.metaProgress;
    }

    function reportMetaSeenItems(game, items) {
        const meta = ensureMeta(game);
        if (!meta) return;
        (Array.isArray(items) ? items : []).forEach((item) => {
            const itemId = Number(item?.id ?? item?.itemId);
            const source = global.ITEMS?.[itemId] || item;
            if (!source) return;
            meta.onEvent('item_seen', {
                itemId,
                rarity: source.rarity,
                effect: source.effect
            });
        });
    }

    function installDebugHooks() {
        if (global.debugMeta?.__metaPatched) return;
        global.debugMeta = {
            __metaPatched: true,
            unlockAchievement(id) {
                return ensureMeta(global.game)?.unlockAchievementByKey?.(id);
            },
            unlockContent(id) {
                return ensureMeta(global.game)?.unlockContentByKey?.(id);
            },
            clearAchievement(id) {
                return ensureMeta(global.game)?.clearAchievementByKey?.(id);
            },
            clearUnlock(id) {
                return ensureMeta(global.game)?.clearUnlockByKey?.(id);
            },
            setHiddenProgress(witnessedCount = 0, completedCount = 0, trueRoute = false, witnessedFloors = [], completedFloors = []) {
                const meta = ensureMeta(global.game);
                meta?.onEvent('hidden_progress_updated', {
                    totalWitnessedCount: Number(witnessedCount) || 0,
                    totalCompletedCount: Number(completedCount) || 0,
                    trueEndingUnlocked: !!trueRoute,
                    witnessedFloors: Array.isArray(witnessedFloors) ? witnessedFloors : [],
                    completedFloors: Array.isArray(completedFloors) ? completedFloors : []
                });
                return meta?.getSnapshot?.();
            },
            setStoryEntries() {
                const meta = ensureMeta(global.game);
                const keys = Array.from(arguments)
                    .flat()
                    .filter((key) => typeof key === 'string' && key.trim());
                keys.forEach((key) => meta?.onEvent('story_unlocked', { key }));
                return meta?.getSnapshot?.();
            },
            resetMeta() {
                return ensureMeta(global.game)?.resetMeta?.();
            },
            dumpSnapshot() {
                return ensureMeta(global.game)?.getSnapshot?.();
            }
        };
    }

    function installGameBridge() {
        if (typeof Game === 'undefined' || Game.prototype.__metaBridgeInstalled) return;
        const proto = Game.prototype;

        wrapMethod(proto, 'initMainMenu', (original) => function wrappedInitMainMenu() {
            const result = original.apply(this, arguments);
            ensureMeta(this);
            return result;
        });

        wrapMethod(proto, 'update', (original) => function wrappedUpdate(dt) {
            ensureMeta(this)?.onFrameSample(this);
            return original.apply(this, arguments);
        });

        wrapMethod(proto, 'endGame', (original) => function wrappedEndGame(result) {
            const output = original.apply(this, arguments);
            if (result === 'dead' || result === 'cleared') {
                const meta = ensureMeta(this);
                meta?.onEvent('run_finished', { result });
                meta?.flush();
            }
            return output;
        });

        wrapMethod(proto, 'startGame', (original) => function wrappedStartGame() {
            ensureMeta(this)?.resetRun();
            return original.apply(this, arguments);
        });

        wrapMethod(proto, 'startVictorySequence', (original) => function wrappedStartVictorySequence() {
            const meta = ensureMeta(this);
            if ((this.currentFloor || 0) >= (this.maxFloors || 0) && global.trueEndingSystem?.playTrueEnding) {
                meta?.onEvent('true_ending_cleared', { floor: this.currentFloor });
                global.trueEndingSystem.playTrueEnding();
                return;
            }
            meta?.onEvent('false_ending_cleared', { floor: this.currentFloor });
            return original.apply(this, arguments);
        });

        wrapMethod(proto, 'completeBossAftermath', (original) => function wrappedCompleteBossAftermath(room) {
            const before = this.currentFloor;
            const result = original.apply(this, arguments);
            ensureMeta(this)?.onEvent('boss_defeated', { floor: before });
            return result;
        });

        wrapMethod(proto, 'checkWeaponEvolution', (original) => function wrappedCheckWeaponEvolution(weaponIdx) {
            const weapon = this.weapons?.[weaponIdx];
            const beforeIsSuper = !!weapon?.isSuper;
            const beforeLevel = Number(weapon?.level) || 0;
            const result = original.apply(this, arguments);
            const nextWeapon = this.weapons?.[weaponIdx];
            const meta = ensureMeta(this);
            if (!beforeIsSuper && nextWeapon?.isSuper) {
                const superCount = (this.weapons || []).filter(item => item?.isSuper).length;
                meta?.onEvent('weapon_evolved', {
                    weaponKey: nextWeapon.baseKey,
                    superWeaponCount: superCount
                });
            }
            if (beforeLevel < 8 && Number(nextWeapon?.level) >= 8 && !nextWeapon?.isSuper) {
                meta?.onEvent('weapon_max_level', { weaponKey: nextWeapon.baseKey });
            }
            return result;
        });

        wrapMethod(proto, 'applyDamage', (original) => function wrappedApplyDamage(enemy, dmg, stats, bullet) {
            const beforeHp = Number(enemy?.hp) || 0;
            const result = original.apply(this, arguments);
            const dealt = Math.max(0, beforeHp - (Number(enemy?.hp) || 0));
            const meta = ensureMeta(this);
            if (dealt > 0) meta?.onEvent('damage_dealt', { amount: dealt, enemyType: enemy?.typeKey || enemy?.type });
            if (beforeHp > 0 && (Number(enemy?.hp) || 0) <= 0) {
                meta?.onEvent('enemy_killed', {
                    count: 1,
                    enemyType: enemy?.typeKey || enemy?.type,
                    isBoss: !!enemy?.isBoss
                });
            }
            return result;
        });

        wrapMethod(proto, 'getAvailableItemsByFloor', (original) => function wrappedGetAvailableItemsByFloor() {
            const list = original.apply(this, arguments) || [];
            return list.filter(item => !item?.hiddenFromPool);
        });

        wrapMethod(proto, 'openShop', (original) => function wrappedOpenShop() {
            const result = original.apply(this, arguments);
            reportMetaSeenItems(this, this.shopItems || []);
            return result;
        });

        proto.__metaBridgeInstalled = true;
    }

    function installLegacyPatches() {
        if (typeof ItemManager !== 'undefined' && !ItemManager.prototype.__metaPatched) {
            wrapMethod(ItemManager.prototype, 'add', (original) => function wrappedAdd(id) {
                const added = original.apply(this, arguments);
                if (added && global.game?.metaProgress && global.ITEMS?.[id]) {
                    const item = global.ITEMS[id];
                    global.game.metaProgress.onEvent('item_picked', {
                        itemId: Number(id),
                        rarity: item.rarity,
                        effect: item.effect
                    });
                }
                return added;
            });
            wrapMethod(ItemManager.prototype, 'getStats', (original) => function wrappedGetStats() {
                const stats = original.apply(this, arguments);
                const bonuses = global.game?.metaProgress?.getTalentBonuses?.();
                if (!bonuses) return stats;
                const nextStats = { ...stats };
                if (bonuses.finalDamagePercent > 0) {
                    nextStats.dmg *= (1 + bonuses.finalDamagePercent / 100);
                }
                if (bonuses.moveSpeedPercent > 0) {
                    nextStats.speed *= (1 + bonuses.moveSpeedPercent / 100);
                }
                if (bonuses.expGainPercent > 0) {
                    nextStats.expBonus += bonuses.expGainPercent / 100;
                }
                if (bonuses.luckFlat > 0) {
                    nextStats.luck += bonuses.luckFlat;
                }
                return nextStats;
            });
            ItemManager.prototype.__metaPatched = true;
        }

        if (typeof Game !== 'undefined' && !Game.prototype.__metaEconomyPatched) {
            wrapMethod(Game.prototype, 'buyItem', (original) => function wrappedBuyItem(index) {
                const room = this.curRoom && this.curRoom.type === 'shop' ? this.curRoom : null;
                const mode = this.metaProgress?.getShopDiscountMode?.() || '';
                if (room && this.shopItems?.[index] && !this.shopItems[index].sold && !room.metaTalentPurchaseUsed && mode) {
                    if (mode === 'half_first_item') {
                        this.shopItems[index].price = Math.max(0, Math.floor((this.shopItems[index].price || 0) * 0.5));
                    } else if (mode === 'free_first_item' || mode === 'free_first_item_plus_one_refresh') {
                        this.shopItems[index].price = 0;
                    }
                }
                const beforeSold = !!this.shopItems?.[index]?.sold;
                const result = original.apply(this, arguments);
                if (room && !beforeSold && this.shopItems?.[index]?.sold && mode) {
                    room.metaTalentPurchaseUsed = true;
                }
                return result;
            });

            wrapMethod(Game.prototype, 'refreshShop', (original) => function wrappedRefreshShop() {
                const room = this.curRoom && this.curRoom.type === 'shop' ? this.curRoom : null;
                const mode = this.metaProgress?.getShopDiscountMode?.() || '';
                if (room && mode === 'free_first_item_plus_one_refresh' && !room.metaTalentRefreshUsed) {
                    const snapshotGold = this.player?.gold || 0;
                    const snapshotCount = this.shopRefreshCount || 0;
                    const result = original.apply(this, arguments);
                    room.metaTalentRefreshUsed = true;
                    if (this.player) this.player.gold = snapshotGold;
                    this.shopRefreshCount = snapshotCount;
                    reportMetaSeenItems(this, this.shopItems || []);
                    return result;
                }
                const result = original.apply(this, arguments);
                reportMetaSeenItems(this, this.shopItems || []);
                return result;
            });

            wrapMethod(Game.prototype, 'tryRevive', (original) => function wrappedTryRevive() {
                const revived = original.apply(this, arguments);
                if (revived) return revived;
                const bonuses = this.metaProgress?.getTalentBonuses?.();
                if (!bonuses?.reviveOnceAt1Hp || this.metaProgress?.runTracker?.talentReviveUsed) return revived;
                this.metaProgress.runTracker.talentReviveUsed = true;
                this.player.hp = Math.min(this.player.maxHp, 1);
                this.damageNumbers?.spawn(this.player.cx, this.player.cy - 40, '余烬复苏!', {
                    color: '#ffd27a',
                    size: 18,
                    life: 1.8
                });
                this.particles?.burst(this.player.cx, this.player.cy, '#ffd27a', 24);
                return true;
            });

            wrapMethod(Game.prototype, 'spawnBossUpgradeReward', (original) => function wrappedSpawnBossUpgradeReward() {
                const result = original.apply(this, arguments);
                const extra = Number(this.metaProgress?.getTalentBonuses?.().bossCoreBonus) || 0;
                if (extra > 0 && this.curRoom) {
                    const cx = this.curRoom.centerX;
                    const cy = this.curRoom.centerY;
                    for (let i = 0; i < extra; i++) {
                        this.spawnFlyingItem?.(cx, cy - 100, cx - 120 - i * 36, cy + 28);
                    }
                }
                return result;
            });



            Game.prototype.__metaEconomyPatched = true;
        }

        if (typeof GameFlowCoordinator !== 'undefined' && !GameFlowCoordinator.__metaPatched) {
            wrapMethod(GameFlowCoordinator, 'buildTreasureChestChoice', (original) => function wrappedBuildTreasureChestChoice(game) {
                const reward = original.apply(this, arguments);
                if (reward?.rewardType === 'item') {
                    reportMetaSeenItems(game, reward.rewards || []);
                }
                return reward;
            });
            wrapMethod(GameFlowCoordinator, 'restartGame', (original) => function wrappedRestartGame(game) {
                ensureMeta(game)?.resetRun();
                return original.apply(this, arguments);
            });
            wrapMethod(GameFlowCoordinator, 'saveGame', (original) => function wrappedSaveGame(game) {
                if (game?.metaProgress) game.metaProgress.onFrameSample(game);
                const ok = original.apply(this, arguments);
                if (!ok || !game?.metaProgress || !game?.saveStateAdapter) return ok;
                try {
                    const raw = game.saveStateAdapter.getSaveString();
                    if (!raw) return ok;
                    const save = JSON.parse(raw);
                    save.metaRunState = game.metaProgress.exportRunState();
                    game.saveStateAdapter.setSaveString(JSON.stringify(save));
                } catch (error) {
                    console.warn('[MetaGameBridge] 写入 metaRunState 失败', error);
                }
                return ok;
            });
            wrapMethod(GameFlowCoordinator, 'loadGame', (original) => function wrappedLoadGame(game) {
                let metaRunState = null;
                try {
                    const raw = game?.saveStateAdapter?.getSaveString?.();
                    if (raw) metaRunState = JSON.parse(raw).metaRunState || null;
                } catch (error) {
                    console.warn('[MetaGameBridge] 读取 metaRunState 失败', error);
                }
                const ok = original.apply(this, arguments);
                if (ok) {
                    const meta = ensureMeta(game);
                    if (metaRunState) meta.restoreRunState(metaRunState);
                    meta.flush();
                }
                return ok;
            });
            GameFlowCoordinator.__metaPatched = true;
        }

        if (global.HiddenRoomProgress?.saveState && !global.HiddenRoomProgress.__metaPatched) {
            const originalSaveState = global.HiddenRoomProgress.saveState;
            global.HiddenRoomProgress.saveState = function wrappedHiddenRoomSaveState(game) {
                const result = originalSaveState.apply(this, arguments);
                const floors = game?.hiddenRooms?.floors || {};
                const witnessedFloors = Object.keys(floors).filter((floor) => floors[floor]?.witnessed).map((floor) => Number(floor));
                const completedFloors = Object.keys(floors).filter((floor) => floors[floor]?.completed).map((floor) => Number(floor));
                game?.metaProgress?.onEvent('hidden_progress_updated', {
                    trueEndingUnlocked: !!game?.hiddenRooms?.trueEndingUnlocked,
                    totalWitnessedCount: Number(game?.hiddenRooms?.totalWitnessedCount) || 0,
                    totalCompletedCount: Number(game?.hiddenRooms?.totalCompletedCount) || 0,
                    witnessedFloors,
                    completedFloors
                });
                return result;
            };
            global.HiddenRoomProgress.__metaPatched = true;
        }
    }

    installGameBridge();
    installLegacyPatches();
    installDebugHooks();
})(window);
