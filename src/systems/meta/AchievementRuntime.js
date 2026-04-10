(function attachAchievementRuntime(global) {
    'use strict';

    class AchievementRuntime {
        constructor(defs) {
            this.defs = Array.isArray(defs) ? defs : [];
        }

        evaluate(metaState, runState) {
            const unlocked = [];
            for (const def of this.defs) {
                if (metaState.achievements.unlocked[def.key]) continue;
                if (this.isSatisfied(def, metaState, runState)) unlocked.push(def);
            }
            return unlocked;
        }

        isSatisfied(def, metaState, runState) {
            switch (def.type) {
                case 'boss_floor':
                    return (Number(runState?.bestBossFloor) || 0) >= Number(def.threshold || 0);
                case 'meta_stat':
                    return (Number(metaState.stats?.[def.statKey]) || 0) >= Number(def.threshold || 0);
                case 'run_stat':
                    return (Number(runState?.[def.statKey]) || 0) >= Number(def.threshold || 0);
                case 'peak_damage':
                    return (Number(runState?.peakHitDamage) || 0) >= Number(def.threshold || 0);
                case 'run_flag':
                    return !!runState?.[def.flagKey];
                case 'flag':
                    if (def.scope === 'meta') return !!metaState.flags?.[def.flagKey];
                    return !!runState?.[def.flagKey];
                case 'unlock_effect':
                    return Object.values(metaState.unlocks || {}).some(entry => entry?.effectKey === def.effectKey && entry?.unlocked);
                case 'hidden_floor_seen':
                    return !!metaState.seen?.hiddenRooms?.[def.floor]?.witnessed;
                case 'hidden_floor_completed':
                    return !!metaState.seen?.hiddenRooms?.[def.floor]?.completed;
                case 'story_unlock':
                    return !!metaState.seen?.storyEntries?.[def.storyKey];
                default:
                    return false;
            }
        }
    }

    global.AchievementRuntime = AchievementRuntime;
})(window);
