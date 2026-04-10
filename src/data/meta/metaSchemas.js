(function attachMetaSchemas(global) {
    'use strict';

    const META_PROGRESS_VERSION = 1;
    const META_PROGRESS_STORAGE_KEY = 'cowMetaProgress_v1';

    function cloneJson(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function createDefaultMetaProgress() {
        return {
            version: META_PROGRESS_VERSION,
            achievements: {
                unlocked: {},
                progress: {}
            },
            unlocks: {},
            talents: {
                points: 0,
                spentPoints: 0,
                levels: {}
            },
            stats: {
                totalKills: 0,
                totalRuns: 0,
                totalBossKills: 0,
                hiddenWitnessedCount: 0,
                hiddenCompletedCount: 0,
                bestRunGold: 0,
                bestRunLevel: 1,
                peakHitDamage: 0,
                legendaryUnlockCount: 0,
                codexSeenCount: 0
            },
            seen: {
                hiddenRooms: {
                    1: { witnessed: false, completed: false },
                    2: { witnessed: false, completed: false },
                    3: { witnessed: false, completed: false },
                    4: { witnessed: false, completed: false },
                    5: { witnessed: false, completed: false },
                    6: { witnessed: false, completed: false }
                },
                storyEntries: {
                    father_words: false,
                    mother_words: false,
                    false_ending: false,
                    dream_gap: false,
                    truth_corridor: false
                },
                legendaryChains: {
                    atk: { common: false, rare: false, epic: false },
                    speed: { common: false, rare: false, epic: false },
                    crit: { common: false, rare: false, epic: false },
                    gold: { common: false, rare: false, epic: false },
                    exp: { common: false, rare: false, epic: false }
                }
            },
            flags: {
                falseEndingCleared: false,
                trueRouteEverUnlocked: false,
                trueEndingCleared: false,
                hiddenRoomSystemEnabled: false
            },
            audit: {
                migratedFromLegacy: false,
                createdAt: Date.now(),
                lastUpdatedAt: Date.now()
            }
        };
    }

    function normalizeLegendarySeen(raw = {}) {
        const base = createDefaultMetaProgress().seen.legendaryChains;
        const next = cloneJson(base);
        Object.keys(next).forEach((chainKey) => {
            const chain = raw[chainKey] || {};
            next[chainKey].common = !!chain.common;
            next[chainKey].rare = !!chain.rare;
            next[chainKey].epic = !!chain.epic;
        });
        return next;
    }

    function normalizeHiddenRoomSeen(raw = {}) {
        const base = createDefaultMetaProgress().seen.hiddenRooms;
        const next = cloneJson(base);
        Object.keys(next).forEach((floorKey) => {
            const source = raw[floorKey] || {};
            next[floorKey].witnessed = !!source.witnessed;
            next[floorKey].completed = !!source.completed;
        });
        return next;
    }

    function normalizeStorySeen(raw = {}) {
        const base = createDefaultMetaProgress().seen.storyEntries;
        const next = cloneJson(base);
        Object.keys(next).forEach((key) => {
            next[key] = !!raw[key];
        });
        return next;
    }

    function normalizeMetaProgress(raw) {
        const base = createDefaultMetaProgress();
        const source = raw && typeof raw === 'object' ? raw : {};
        const normalized = cloneJson(base);

        normalized.version = Number(source.version) || META_PROGRESS_VERSION;
        normalized.achievements.unlocked = { ...(source.achievements?.unlocked || {}) };
        normalized.achievements.progress = { ...(source.achievements?.progress || {}) };
        normalized.unlocks = { ...(source.unlocks || {}) };
        normalized.talents.points = Math.max(0, Number(source.talents?.points) || 0);
        normalized.talents.spentPoints = Math.max(0, Number(source.talents?.spentPoints) || 0);
        normalized.talents.levels = { ...(source.talents?.levels || {}) };
        normalized.stats.totalKills = Math.max(0, Number(source.stats?.totalKills) || 0);
        normalized.stats.totalRuns = Math.max(0, Number(source.stats?.totalRuns) || 0);
        normalized.stats.totalBossKills = Math.max(0, Number(source.stats?.totalBossKills) || 0);
        normalized.stats.hiddenWitnessedCount = Math.max(0, Number(source.stats?.hiddenWitnessedCount) || 0);
        normalized.stats.hiddenCompletedCount = Math.max(0, Number(source.stats?.hiddenCompletedCount) || 0);
        normalized.stats.bestRunGold = Math.max(0, Number(source.stats?.bestRunGold) || 0);
        normalized.stats.bestRunLevel = Math.max(1, Number(source.stats?.bestRunLevel) || 1);
        normalized.stats.peakHitDamage = Math.max(0, Number(source.stats?.peakHitDamage) || 0);
        normalized.stats.legendaryUnlockCount = Math.max(0, Number(source.stats?.legendaryUnlockCount) || 0);
        normalized.stats.codexSeenCount = Math.max(0, Number(source.stats?.codexSeenCount) || 0);
        normalized.seen.hiddenRooms = normalizeHiddenRoomSeen(source.seen?.hiddenRooms);
        normalized.seen.storyEntries = normalizeStorySeen(source.seen?.storyEntries);
        normalized.seen.legendaryChains = normalizeLegendarySeen(source.seen?.legendaryChains);
        normalized.flags.falseEndingCleared = !!source.flags?.falseEndingCleared;
        normalized.flags.trueRouteEverUnlocked = !!source.flags?.trueRouteEverUnlocked;
        normalized.flags.trueEndingCleared = !!source.flags?.trueEndingCleared;
        normalized.flags.hiddenRoomSystemEnabled = !!source.flags?.hiddenRoomSystemEnabled;
        normalized.audit.migratedFromLegacy = !!source.audit?.migratedFromLegacy;
        normalized.audit.createdAt = Number(source.audit?.createdAt) || normalized.audit.createdAt;
        normalized.audit.lastUpdatedAt = Number(source.audit?.lastUpdatedAt) || Date.now();

        return normalized;
    }

    global.MetaProgressSchemas = {
        META_PROGRESS_VERSION,
        META_PROGRESS_STORAGE_KEY,
        cloneJson,
        createDefaultMetaProgress,
        normalizeHiddenRoomSeen,
        normalizeStorySeen,
        normalizeLegendarySeen,
        normalizeMetaProgress
    };
})(window);
