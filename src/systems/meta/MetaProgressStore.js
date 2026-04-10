(function attachMetaProgressStore(global) {
    'use strict';

    class MetaProgressStore {
        constructor() {
            this.storageKey = global.MetaProgressSchemas.META_PROGRESS_STORAGE_KEY;
            this.state = this.load();
        }

        load() {
            let raw = null;
            try {
                raw = localStorage.getItem(this.storageKey);
            } catch (error) {
                console.warn('[MetaProgressStore] 读取失败', error);
            }
            if (!raw) {
                return global.MetaProgressMigration.migrateLegacyProgress(
                    global.MetaProgressSchemas.createDefaultMetaProgress()
                );
            }
            try {
                return global.MetaProgressSchemas.normalizeMetaProgress(JSON.parse(raw));
            } catch (error) {
                console.warn('[MetaProgressStore] 存档损坏，回退默认值', error);
                return global.MetaProgressMigration.migrateLegacyProgress(
                    global.MetaProgressSchemas.createDefaultMetaProgress()
                );
            }
        }

        save() {
            this.state.audit.lastUpdatedAt = Date.now();
            try {
                localStorage.setItem(this.storageKey, JSON.stringify(this.state));
            } catch (error) {
                console.warn('[MetaProgressStore] 保存失败', error);
            }
        }

        getState() {
            return global.MetaProgressSchemas.cloneJson(this.state);
        }

        mutate(mutator) {
            if (typeof mutator === 'function') {
                mutator(this.state);
                this.state = global.MetaProgressSchemas.normalizeMetaProgress(this.state);
                this.save();
            }
            return this.getState();
        }
    }

    global.MetaProgressStore = MetaProgressStore;
})(window);
