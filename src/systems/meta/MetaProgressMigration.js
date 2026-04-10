(function attachMetaProgressMigration(global) {
    'use strict';

    function migrateLegacyProgress(baseState) {
        const next = global.MetaProgressSchemas.cloneJson(baseState);
        let migrated = false;

        try {
            const ending = JSON.parse(localStorage.getItem('cowEnding') || 'null');
            if (ending && typeof ending === 'object') {
                next.flags.falseEndingCleared = !!next.flags.falseEndingCleared;
                if (ending.unlocked) next.flags.trueRouteEverUnlocked = true;
                if (ending.played) next.flags.trueEndingCleared = true;
                migrated = true;
            }
        } catch (error) {
            console.warn('[MetaProgressMigration] cowEnding 迁移失败', error);
        }

        if (migrated) {
            next.audit.migratedFromLegacy = true;
            next.audit.lastUpdatedAt = Date.now();
        }
        return next;
    }

    global.MetaProgressMigration = { migrateLegacyProgress };
})(window);
