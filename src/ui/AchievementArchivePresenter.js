(function attachAchievementArchivePresenter(global) {
    'use strict';

    function installPresenter() {
        if (typeof CollectionCodexSystem === 'undefined' || CollectionCodexSystem.prototype.__metaAchievementPatched) return;
        const proto = CollectionCodexSystem.prototype;
        const oldGetEntries = proto.getAchievementEntries;
        const oldMarkUnlocked = proto.markUnlocked;

        proto.markUnlocked = function patchedMarkUnlocked(scope, key, options = {}) {
            const changed = oldMarkUnlocked.call(this, scope, key, options);
            if (changed && scope === 'story') {
                global.game?.metaProgress?.onEvent('story_unlocked', { key });
            }
            if (changed && scope !== 'achievements') {
                const unlocked = this.state?.unlocked || {};
                const count = ['characters', 'enemies', 'items', 'weapons', 'passives', 'totems', 'story']
                    .reduce((sum, bucket) => sum + Object.keys(unlocked[bucket] || {}).length, 0);
                global.game?.metaProgress?.onEvent('codex_sync', { count });
            }
            return changed;
        };

        proto.getAchievementEntries = function patchedGetAchievementEntries() {
            return global.MetaAchievementData.defs.map((def) => ({
                key: def.key,
                name: def.title,
                icon: def.icon || '🏆',
                desc: def.description,
                hint: def.hint
            }));
        };

        proto.unlockAchievement = function patchedUnlockAchievement(key, options = {}) {
            const def = global.MetaAchievementData.byKey[key];
            if (!def) return false;
            return this.markUnlocked('achievements', key, options);
        };

        proto.onBossDefeated = function patchedOnBossDefeated(payload = {}) {
            const floor = Number(payload.floor || 0);
            const enemyMap = { 1: 'rabbit', 2: 'bird', 3: 'mouse', 4: 'cat', 5: 'turtle', 6: 'mother' };
            const characterMap = { 1: 'tiaotiao', 2: 'tiezhua', 3: 'niubei', 4: 'yinya', 5: 'father', 6: 'mother', 7: 'shifu' };
            const storyMap = { 5: 'father_words', 6: 'mother_words' };
            if (enemyMap[floor]) this.unlockEnemy(enemyMap[floor], { silent: true });
            if (characterMap[floor]) this.unlockCharacter(characterMap[floor], { silent: true });
            if (storyMap[floor]) this.unlockStory(storyMap[floor], { silent: true });
        };

        proto.onTrueRouteUnlocked = function patchedOnTrueRouteUnlocked() {
            this.unlockStory('dream_gap', { silent: true });
        };

        proto.onFalseEnding = function patchedOnFalseEnding() {
            this.unlockStory('false_ending', { silent: true });
        };

        proto.onTrueEnding = function patchedOnTrueEnding() {
            this.unlockCharacter('shifu', { silent: true });
            this.unlockStory('truth_corridor', { silent: true });
        };

        proto.onWeaponExpanded = function patchedOnWeaponExpanded() {};
        proto.onFirstEvolution = function patchedOnFirstEvolution() {};

        proto.syncFromMeta = function patchedSyncFromMeta(metaState, options = {}) {
            if (!metaState) return;
            Object.keys(metaState.achievements?.unlocked || {}).forEach((key) => {
                this.markUnlocked('achievements', key, { silent: true });
            });
            if (!options.silent && this.isOpen()) this.render();
        };

        proto.__metaAchievementPatched = true;
        global.__metaLegacyGetAchievementEntries = oldGetEntries;
    }

    installPresenter();
    if (global.collectionCodex?.syncFromMeta) {
        global.collectionCodex.syncFromMeta(global.game?.metaProgress?.getMetaState?.(), { silent: true });
    }
})(window);
