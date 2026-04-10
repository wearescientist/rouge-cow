(function attachUnlockRuntime(global) {
    'use strict';

    class UnlockRuntime {
        constructor(defs) {
            this.defs = Array.isArray(defs) ? defs : [];
        }

        evaluate(metaState, runState) {
            const unlocked = [];
            for (const def of this.defs) {
                const existing = metaState.unlocks?.[def.key];
                if (existing?.unlocked) continue;
                if (this.isSatisfied(def, metaState, runState)) unlocked.push(def);
            }
            return unlocked;
        }

        isSatisfied(def, metaState, runState) {
            switch (def.type) {
                case 'meta_flag':
                    return !!metaState.flags?.[def.flagKey || def.conditionKey];
                case 'run_flag':
                    return !!runState?.[def.flagKey || def.conditionKey];
                case 'run_stat':
                    return (Number(runState?.[def.statKey || def.conditionKey]) || 0) >= Number(def.threshold || def.conditionValue || 0);
                case 'legendary_chain': {
                    const chain = metaState.seen?.legendaryChains?.[def.chainKey || def.conditionKey];
                    return !!(chain && chain.common && chain.rare && chain.epic);
                }
                default:
                    return false;
            }
        }
    }

    global.UnlockRuntime = UnlockRuntime;
})(window);
