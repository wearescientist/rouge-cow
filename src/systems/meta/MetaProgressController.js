(function attachMetaProgressController(global) {
    'use strict';

    const LEGENDARY_CHAIN_MAP = Object.freeze({
        dmgMult: 'atk',
        speedMult: 'speed',
        critAdd: 'crit',
        goldBonusMult: 'gold',
        expBonusAdd: 'exp'
    });

    const LEGENDARY_UNLOCK_EFFECTS = Object.freeze({
        legendary_atk_unlocked: [104],
        legendary_speed_unlocked: [112],
        legendary_crit_unlocked: [116],
        legendary_gold_unlocked: [132],
        legendary_exp_unlocked: [136]
    });

    const WEAPON_UNLOCK_EFFECTS = Object.freeze({
        weapon_bible_unlocked: ['bible'],
        weapon_scythe_unlocked: ['scythe'],
        weapon_storm_axe_unlocked: ['axe']
    });

    const SHOP_DISCOUNT_LABELS = Object.freeze({
        half_first_item: '首件商品半价',
        free_first_item: '首件商品免费',
        free_first_item_plus_one_refresh: '首件商品免费 + 1 次免费刷新'
    });

    class MetaProgressController {
        constructor(game) {
            this.game = game || null;
            this.store = new global.MetaProgressStore();
            this.runTracker = new global.RunProgressTracker();
            this.achievementRuntime = new global.AchievementRuntime(global.MetaAchievementData.defs);
            this.unlockRuntime = new global.UnlockRuntime(global.MetaUnlockData.defs);
            this.toast = new global.MetaToastController();
            this.lastCodexCount = 0;
            this.cleanupLegacyRunScopedUnlocks();
            this.reconcileTalentPoints();
            this.applyPersistentEffects();
            this.syncCodexPresentation(true);
        }

        getMetaState() {
            const state = this.store.getState();
            const runtimeUnlocks = this.getRunState()?.runtimeUnlocks || {};
            if (Object.keys(runtimeUnlocks).length <= 0) return state;
            state.unlocks = {
                ...(state.unlocks || {}),
                ...global.MetaProgressSchemas.cloneJson(runtimeUnlocks)
            };
            return state;
        }

        getRunState() {
            return this.runTracker.getSnapshot();
        }

        getSnapshot() {
            return {
                meta: this.getMetaState(),
                run: this.getRunState()
            };
        }

        exportRunState() {
            return this.getRunState();
        }

        restoreRunState(snapshot) {
            this.runTracker.restore(snapshot || {});
            this.flush();
        }

        resetRun() {
            this.runTracker.reset();
        }

        cleanupLegacyRunScopedUnlocks() {
            const runScopedKeys = (global.MetaUnlockData?.defs || [])
                .filter((def) => (def.scope || 'account') === 'run')
                .map((def) => def.key);
            if (runScopedKeys.length <= 0) return;
            this.store.mutate((state) => {
                runScopedKeys.forEach((key) => {
                    if (state.unlocks?.[key]) delete state.unlocks[key];
                });
            });
        }

        getTalentLevel(key) {
            const meta = this.getMetaState();
            return Math.max(0, Number(meta.talents?.levels?.[key]) || 0);
        }

        getTalentCost(key, level = this.getTalentLevel(key)) {
            const def = global.MetaTalentData?.byKey?.[key];
            return global.MetaTalentData?.getTalentCost?.(def, level) || 0;
        }

        getTalentInvestments(levels = this.getMetaState().talents?.levels || {}, tiers = []) {
            const tierSet = new Set(Array.isArray(tiers) ? tiers : []);
            return (global.MetaTalentData?.defs || []).reduce((sum, def) => {
                if (tierSet.size > 0 && !tierSet.has(def.tier)) return sum;
                return sum + Math.max(0, Number(levels?.[def.key]) || 0);
            }, 0);
        }

        getTalentSpentCost(levels = this.getMetaState().talents?.levels || {}) {
            return (global.MetaTalentData?.defs || []).reduce((sum, def) => {
                const level = Math.max(0, Number(levels?.[def.key]) || 0);
                for (let i = 0; i < level; i++) {
                    sum += global.MetaTalentData.getTalentCost(def, i);
                }
                return sum;
            }, 0);
        }

        getTalentUnlockProgress(def) {
            const requirement = def?.unlockRequirement || { tiers: [], investments: 0 };
            const current = this.getTalentInvestments(this.getMetaState().talents?.levels || {}, requirement.tiers || []);
            return {
                current,
                required: Math.max(0, Number(requirement.investments) || 0),
                ok: current >= Math.max(0, Number(requirement.investments) || 0)
            };
        }

        getTalentBonuses() {
            const meta = this.getMetaState();
            const levels = meta.talents?.levels || {};
            const getSum = (key) => {
                const def = global.MetaTalentData?.byKey?.[key];
                const level = Math.max(0, Number(levels[key]) || 0);
                if (!def || level <= 0) return 0;
                return def.values.slice(0, level).reduce((sum, value) => sum + (Number(value) || 0), 0);
            };
            const getLast = (key) => {
                const def = global.MetaTalentData?.byKey?.[key];
                const level = Math.max(0, Number(levels[key]) || 0);
                if (!def || level <= 0) return null;
                return def.values[level - 1];
            };
            return {
                maxHpFlat: getSum('hp'),
                finalDamagePercent: getSum('final_dmg'),
                moveSpeedPercent: getSum('move_speed'),
                expGainPercent: getSum('exp_gain'),
                startGoldFlat: getSum('start_gold'),
                luckFlat: getSum('luck_up'),
                bossCoreBonus: getSum('boss_core_plus'),
                reviveOnceAt1Hp: this.getTalentLevel('survive_once') > 0,
                startWeaponLevelBonus: getSum('start_weapon_lv1'),
                weaponRefreshBonus: getSum('weapon_extra_pick'),
                shopDiscountLevel: this.getTalentLevel('shop_discount'),
                shopDiscountMode: getLast('shop_discount'),
                disabledEliteStartBonus: this.getTalentLevel('elite_start_bonus') > 0
            };
        }

        getTotalTalentPoints() {
            const meta = this.getMetaState();
            return Math.max(0, Number(meta.talents?.points) || 0);
        }

        getSpentTalentPoints() {
            const meta = this.getMetaState();
            return Math.max(0, Number(meta.talents?.spentPoints) || 0);
        }

        getEarnedTalentPoints() {
            const meta = this.store.getState();
            return Object.keys(meta?.achievements?.unlocked || {}).length;
        }

        reconcileTalentPoints() {
            const earned = this.getEarnedTalentPoints();
            this.store.mutate((state) => {
                state.talents.spentPoints = this.getTalentSpentCost(state.talents?.levels || {});
                state.talents.points = Math.max(0, earned - state.talents.spentPoints);
            });
        }

        canUpgradeTalent(key) {
            const def = global.MetaTalentData?.byKey?.[key];
            if (!def || def.disabled) return { ok: false, reason: '该天赋当前未启用', cost: 0 };
            const current = this.getTalentLevel(key);
            if (current >= def.maxLevel) return { ok: false, reason: '已满级', cost: 0 };
            const cost = this.getTalentCost(key, current);
            const unlockState = this.getTalentUnlockProgress(def);
            if (!unlockState.ok) {
                return {
                    ok: false,
                    reason: `${def.unlockCondition}（${unlockState.current}/${unlockState.required}）`,
                    cost
                };
            }
            if (this.getTotalTalentPoints() < cost) {
                return { ok: false, reason: `传承点不足，需要 ${cost} 点`, cost };
            }
            return { ok: true, reason: '', cost };
        }

        upgradeTalent(key) {
            const check = this.canUpgradeTalent(key);
            if (!check.ok) return check;
            const def = global.MetaTalentData.byKey[key];
            this.store.mutate((state) => {
                const current = Math.max(0, Number(state.talents.levels[key]) || 0);
                state.talents.levels[key] = current + 1;
                state.talents.points = Math.max(0, state.talents.points - check.cost);
                state.talents.spentPoints = this.getTalentSpentCost(state.talents.levels);
            });
            this.toast.showCard({
                icon: def.icon || '✨',
                kicker: '天赋已强化',
                title: def.title,
                body: `${def.effectDesc} | 消耗 ${check.cost} 点传承点`,
                accent: '#9ed98f',
                kind: 'stat',
                dedupeKey: `talent:${key}:${this.getTalentLevel(key)}`,
                duration: 2200
            });
            return { ok: true, reason: '', cost: check.cost };
        }

        resetTalents() {
            const earned = this.getEarnedTalentPoints();
            this.store.mutate((state) => {
                state.talents.points = earned;
                state.talents.spentPoints = 0;
                state.talents.levels = {};
            });
            this.toast.showCard({
                icon: '↺',
                kicker: '传承已重整',
                title: '天赋已重置',
                body: `已返还 ${earned} 点可分配传承点。`,
                accent: '#c7cfe2',
                kind: 'stat',
                dedupeKey: 'talent:reset',
                duration: 2200
            });
            return { ok: true };
        }

        onFrameSample(game) {
            const source = game || this.game;
            if (!source) return;
            if (!this.runTracker.active && source.state === 'playing') {
                this.runTracker.start({
                    currentFloor: source.currentFloor,
                    gold: source.player?.gold,
                    level: source.player?.lv
                });
            }
            if (!this.runTracker.active) return;
            if (!this.runTracker.talentStartupApplied && source.state === 'playing') {
                this.applyRunStartTalents(source);
            }
            this.runTracker.currentFloor = Math.max(1, Number(source.currentFloor) || 1);
            this.runTracker.runPeakGold = Math.max(this.runTracker.runPeakGold, Number(source.player?.gold) || 0);
            this.runTracker.runPeakLevel = Math.max(this.runTracker.runPeakLevel, Number(source.player?.lv) || 1);
            this.flush();
        }

        applyRunStartTalents(game) {
            const source = game || this.game;
            if (!source || !source.player) return;
            const bonuses = this.getTalentBonuses();
            if (bonuses.maxHpFlat > 0) {
                source.player.maxHp += bonuses.maxHpFlat;
                source.player.hp = Math.min(source.player.maxHp, source.player.hp + bonuses.maxHpFlat);
            }
            if (bonuses.startGoldFlat > 0) source.player.gold += bonuses.startGoldFlat;
            source.panelRefreshCharges = Math.max(0, Number(bonuses.weaponRefreshBonus) || 0);
            source.panelRefreshChargesMax = source.panelRefreshCharges;
            if (bonuses.startWeaponLevelBonus > 0 && Array.isArray(source.weapons) && source.weapons[0]) {
                for (let i = 0; i < bonuses.startWeaponLevelBonus; i++) {
                    if (!source.upgradeWeaponInstance?.(source.weapons[0], { popup: false })) break;
                }
            }
            this.runTracker.talentStartupApplied = true;
        }

        getTalentSummaryRows() {
            const bonuses = this.getTalentBonuses();
            const rows = [];
            if (bonuses.maxHpFlat > 0) rows.push(`生命上限 +${bonuses.maxHpFlat}`);
            if (bonuses.finalDamagePercent > 0) rows.push(`最终伤害 +${bonuses.finalDamagePercent}%`);
            if (bonuses.moveSpeedPercent > 0) rows.push(`移动速度 +${bonuses.moveSpeedPercent}%`);
            if (bonuses.expGainPercent > 0) rows.push(`经验获取 +${bonuses.expGainPercent}%`);
            if (bonuses.startGoldFlat > 0) rows.push(`开局金币 +${bonuses.startGoldFlat}`);
            if (bonuses.luckFlat > 0) rows.push(`幸运 +${bonuses.luckFlat}`);
            if (bonuses.weaponRefreshBonus > 0) rows.push(`升级/武器箱免费刷新 ${bonuses.weaponRefreshBonus} 次`);
            if (bonuses.startWeaponLevelBonus > 0) rows.push(`开局武器等级 +${bonuses.startWeaponLevelBonus}`);
            if (bonuses.bossCoreBonus > 0) rows.push(`Boss 晶核额外掉落 +${bonuses.bossCoreBonus}`);
            if (bonuses.shopDiscountMode) rows.push(`商店特权: ${SHOP_DISCOUNT_LABELS[bonuses.shopDiscountMode] || bonuses.shopDiscountMode}`);
            if (bonuses.reviveOnceAt1Hp) rows.push('每局一次 1 血复苏');
            return rows;
        }

        getAchievementValue(def, metaState = this.getMetaState(), runState = this.getRunState()) {
            switch (def.type) {
                case 'boss_floor':
                    return Number(runState?.bestBossFloor) || 0;
                case 'meta_stat':
                    return Number(metaState.stats?.[def.statKey]) || 0;
                case 'run_stat':
                    return Number(runState?.[def.statKey]) || 0;
                case 'peak_damage':
                    return Number(runState?.peakHitDamage) || 0;
                case 'run_flag':
                    return runState?.[def.flagKey] ? 1 : 0;
                case 'flag':
                    return def.scope === 'meta'
                        ? (metaState.flags?.[def.flagKey] ? 1 : 0)
                        : (runState?.[def.flagKey] ? 1 : 0);
                case 'unlock_effect':
                    return Object.values(metaState.unlocks || {}).some((entry) => entry?.effectKey === def.effectKey && entry?.unlocked) ? 1 : 0;
                case 'hidden_floor_seen':
                    return metaState.seen?.hiddenRooms?.[def.floor]?.witnessed ? 1 : 0;
                case 'hidden_floor_completed':
                    return metaState.seen?.hiddenRooms?.[def.floor]?.completed ? 1 : 0;
                case 'story_unlock':
                    return metaState.seen?.storyEntries?.[def.storyKey] ? 1 : 0;
                default:
                    return 0;
            }
        }

        getAchievementProgress(def) {
            const meta = this.getMetaState();
            const run = this.getRunState();
            const unlocked = !!meta.achievements?.unlocked?.[def.key];
            const current = this.getAchievementValue(def, meta, run);
            const target = Math.max(1, Number(def.targetValue || def.threshold) || 1);
            return {
                unlocked,
                current,
                target,
                ratio: unlocked ? 1 : Math.max(0, Math.min(1, current / target))
            };
        }

        onEvent(type, payload = {}) {
            switch (type) {
                case 'boss_defeated':
                    this.applyBossEvent(payload);
                    break;
                case 'enemy_killed':
                    this.runTracker.kills += Math.max(1, Number(payload.count) || 1);
                    this.store.mutate((state) => {
                        state.stats.totalKills += Math.max(1, Number(payload.count) || 1);
                    });
                    break;
                case 'damage_dealt':
                    this.runTracker.peakHitDamage = Math.max(this.runTracker.peakHitDamage, Number(payload.amount) || 0);
                    this.store.mutate((state) => {
                        state.stats.peakHitDamage = Math.max(state.stats.peakHitDamage, Number(payload.amount) || 0);
                    });
                    break;
                case 'weapon_evolved':
                    this.runTracker.hasSuperWeapon = true;
                    this.runTracker.superWeaponCount = Math.max(this.runTracker.superWeaponCount, Number(payload.superWeaponCount) || 0);
                    break;
                case 'weapon_max_level':
                    this.runTracker.hasMaxLevelWeapon = true;
                    break;
                case 'gold_changed':
                    this.runTracker.runPeakGold = Math.max(this.runTracker.runPeakGold, Number(payload.value) || 0);
                    this.store.mutate((state) => {
                        state.stats.bestRunGold = Math.max(state.stats.bestRunGold, this.runTracker.runPeakGold);
                    });
                    break;
                case 'level_changed':
                    this.runTracker.runPeakLevel = Math.max(this.runTracker.runPeakLevel, Number(payload.value) || 1);
                    this.store.mutate((state) => {
                        state.stats.bestRunLevel = Math.max(state.stats.bestRunLevel, this.runTracker.runPeakLevel);
                    });
                    break;
                case 'false_ending_cleared':
                    this.runTracker.finishedFalseEnding = true;
                    this.store.mutate((state) => {
                        state.flags.falseEndingCleared = true;
                    });
                    break;
                case 'true_ending_cleared':
                    this.runTracker.finishedTrueEnding = true;
                    this.store.mutate((state) => {
                        state.flags.trueEndingCleared = true;
                        state.flags.trueRouteEverUnlocked = true;
                    });
                    break;
                case 'hidden_progress_updated':
                    this.runTracker.runTrueRouteEnabled = !!payload.trueEndingUnlocked;
                    this.runTracker.hiddenWitnessedCount = Math.max(this.runTracker.hiddenWitnessedCount, Number(payload.totalWitnessedCount) || 0);
                    this.runTracker.hiddenCompletedCount = Math.max(this.runTracker.hiddenCompletedCount, Number(payload.totalCompletedCount) || 0);
                    if (payload.trueEndingUnlocked) {
                        this.store.mutate((state) => {
                            state.flags.trueRouteEverUnlocked = true;
                        });
                    }
                    this.store.mutate((state) => {
                        state.stats.hiddenWitnessedCount = Math.max(state.stats.hiddenWitnessedCount, Number(payload.totalWitnessedCount) || 0);
                        state.stats.hiddenCompletedCount = Math.max(state.stats.hiddenCompletedCount, Number(payload.totalCompletedCount) || 0);
                        const witnessedFloors = Array.isArray(payload.witnessedFloors) ? payload.witnessedFloors : [];
                        const completedFloors = Array.isArray(payload.completedFloors) ? payload.completedFloors : [];
                        witnessedFloors.forEach((floor) => {
                            const key = String(floor);
                            if (state.seen.hiddenRooms[key]) state.seen.hiddenRooms[key].witnessed = true;
                        });
                        completedFloors.forEach((floor) => {
                            const key = String(floor);
                            if (state.seen.hiddenRooms[key]) state.seen.hiddenRooms[key].completed = true;
                        });
                    });
                    break;
                case 'item_seen':
                case 'item_picked':
                    this.applyLegendarySeen(payload);
                    break;
                case 'story_unlocked':
                    this.store.mutate((state) => {
                        if (payload.key && Object.prototype.hasOwnProperty.call(state.seen.storyEntries, payload.key)) {
                            state.seen.storyEntries[payload.key] = true;
                        }
                    });
                    break;
                case 'codex_sync':
                    this.updateCodexSeenCount(Number(payload.count) || 0);
                    break;
                case 'run_finished':
                    this.settleRun(payload);
                    break;
                default:
                    break;
            }
            this.flush();
        }

        applyBossEvent(payload) {
            const floor = Number(payload.floor) || 0;
            if (floor <= 0) return;
            this.runTracker.bestBossFloor = Math.max(this.runTracker.bestBossFloor, floor);
            this.runTracker.bossKills += 1;
            this.store.mutate((state) => {
                state.stats.totalBossKills += 1;
            });
        }

        applyLegendarySeen(payload) {
            const rarity = String(payload.rarity || '').toLowerCase();
            const chainKey = LEGENDARY_CHAIN_MAP[payload.effect];
            if (!chainKey || !['common', 'rare', 'epic'].includes(rarity)) return;
            this.store.mutate((state) => {
                state.seen.legendaryChains[chainKey][rarity] = true;
            });
        }

        updateCodexSeenCount(count) {
            if (count === this.lastCodexCount) return;
            this.lastCodexCount = count;
            this.store.mutate((state) => {
                state.stats.codexSeenCount = Math.max(state.stats.codexSeenCount, count);
            });
        }

        settleRun(payload = {}) {
            if (!this.runTracker.active || this.runTracker.settled) return;
            this.runTracker.settled = true;
            if (payload.result === 'cleared' || payload.result === 'dead') {
                this.store.mutate((state) => {
                    state.stats.totalRuns += 1;
                });
            }
        }

        flush() {
            const meta = this.getMetaState();
            const run = this.getRunState();
            const unlockDefs = this.unlockRuntime.evaluate(meta, run);
            unlockDefs.forEach((def) => this.unlockContent(def));
            const refreshedMeta = this.getMetaState();
            const achievementDefs = this.achievementRuntime.evaluate(refreshedMeta, this.getRunState());
            achievementDefs.forEach((def) => this.unlockAchievement(def));
            this.syncCodexPresentation(false);
        }

        unlockContent(def) {
            const existing = this.getMetaState().unlocks?.[def.key];
            if (existing?.unlocked) return;
            if ((def.scope || 'account') === 'run') {
                this.runTracker.runtimeUnlocks[def.key] = {
                    unlocked: true,
                    time: Date.now(),
                    effectKey: def.effectKey,
                    scope: 'run'
                };
                this.toast.showUnlock(def);
                return;
            }
            this.store.mutate((state) => {
                state.unlocks[def.key] = {
                    unlocked: true,
                    time: Date.now(),
                    effectKey: def.effectKey,
                    scope: def.scope || 'account'
                };
                if (def.effectKey === 'hidden_room_system_enabled') state.flags.hiddenRoomSystemEnabled = true;
                if (def.effectKey.startsWith('legendary_')) {
                    state.stats.legendaryUnlockCount = Object.values(state.unlocks).filter((entry) =>
                        entry?.unlocked && String(entry.effectKey || '').startsWith('legendary_')
                    ).length;
                }
            });
            this.applyPersistentEffects();
            this.toast.showUnlock(def);
        }

        unlockAchievement(def) {
            if (this.getMetaState().achievements?.unlocked?.[def.key]) return;
            this.store.mutate((state) => {
                state.achievements.unlocked[def.key] = { time: Date.now() };
            });
            this.reconcileTalentPoints();
            this.toast.showAchievement(def);
        }

        unlockAchievementByKey(key) {
            const def = global.MetaAchievementData.byKey[key];
            if (def) this.unlockAchievement(def);
        }

        unlockContentByKey(key) {
            const def = global.MetaUnlockData.byKey[key];
            if (def) this.unlockContent(def);
        }

        clearAchievementByKey(key) {
            if (!key) return this.getSnapshot();
            this.store.mutate((state) => {
                delete state.achievements.unlocked[key];
            });
            this.reconcileTalentPoints();
            return this.getSnapshot();
        }

        clearUnlockByKey(key) {
            if (!key) return this.getSnapshot();
            this.store.mutate((state) => {
                delete state.unlocks[key];
                state.stats.legendaryUnlockCount = Object.values(state.unlocks).filter((entry) =>
                    entry?.unlocked && String(entry.effectKey || '').startsWith('legendary_')
                ).length;
            });
            delete this.runTracker.runtimeUnlocks[key];
            this.applyPersistentEffects();
            return this.getSnapshot();
        }

        resetMeta() {
            this.store.state = global.MetaProgressSchemas.createDefaultMetaProgress();
            this.store.save();
            this.runTracker.reset();
            this.lastCodexCount = 0;
            this.reconcileTalentPoints();
            this.applyPersistentEffects();
            this.syncCodexPresentation(true);
            return this.getSnapshot();
        }

        applyPersistentEffects() {
            const meta = this.getMetaState();
            Object.entries(WEAPON_UNLOCK_EFFECTS).forEach(([effectKey, keys]) => {
                const enabled = Object.values(meta.unlocks).some((entry) => entry?.effectKey === effectKey && entry?.unlocked);
                keys.forEach((weaponKey) => {
                    if (global.WEAPONS?.[weaponKey]) global.WEAPONS[weaponKey].hiddenFromPool = !enabled;
                });
            });
            Object.entries(LEGENDARY_UNLOCK_EFFECTS).forEach(([effectKey, ids]) => {
                const enabled = Object.values(meta.unlocks).some((entry) => entry?.effectKey === effectKey && entry?.unlocked);
                ids.forEach((itemId) => {
                    if (global.ITEMS?.[itemId]) global.ITEMS[itemId].hiddenFromPool = !enabled;
                });
            });
        }

        syncCodexPresentation(silent) {
            if (!global.collectionCodex?.syncFromMeta) return;
            global.collectionCodex.syncFromMeta(this.getMetaState(), { silent: !!silent });
        }

        getShopDiscountMode() {
            return this.getTalentBonuses().shopDiscountMode || '';
        }
    }

    global.MetaProgressController = MetaProgressController;
})(window);
