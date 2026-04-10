class SaveStateAdapter {
    constructor(options = {}) {
        this.storage = options.storage || window.localStorage;
        this.primaryKey = options.primaryKey || 'rougecow_save';
        this.legacyKeys = options.legacyKeys || ['rogueCow_save'];
    }

    getSaveString() {
        try {
            const primaryValue = this.storage.getItem(this.primaryKey);
            if (primaryValue) {
                return primaryValue;
            }

            for (const legacyKey of this.legacyKeys) {
                const legacyValue = this.storage.getItem(legacyKey);
                if (legacyValue) {
                    this.storage.setItem(this.primaryKey, legacyValue);
                    this.storage.removeItem(legacyKey);
                    return legacyValue;
                }
            }
        } catch (error) {
            console.warn('[SaveStateAdapter] read failed:', error);
        }

        return null;
    }

    hasSave() {
        return !!this.getSaveString();
    }

    setSaveString(saveString) {
        try {
            this.storage.setItem(this.primaryKey, saveString);
            for (const legacyKey of this.legacyKeys) {
                if (legacyKey !== this.primaryKey) {
                    this.storage.removeItem(legacyKey);
                }
            }
            return true;
        } catch (error) {
            console.warn('[SaveStateAdapter] write failed:', error);
            return false;
        }
    }

    clearSave() {
        try {
            this.storage.removeItem(this.primaryKey);
            for (const legacyKey of this.legacyKeys) {
                this.storage.removeItem(legacyKey);
            }
            return true;
        } catch (error) {
            console.warn('[SaveStateAdapter] clear failed:', error);
            return false;
        }
    }
}

window.SaveStateAdapter = SaveStateAdapter;
