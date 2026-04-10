(function attachRunProgressTracker(global) {
    'use strict';

    class RunProgressTracker {
        constructor() {
            this.reset();
        }

        reset() {
            this.active = false;
            this.runId = '';
            this.startedAt = 0;
            this.settled = false;
            this.currentFloor = 1;
            this.kills = 0;
            this.runPeakGold = 0;
            this.runPeakLevel = 1;
            this.peakHitDamage = 0;
            this.bestBossFloor = 0;
            this.bossKills = 0;
            this.hiddenWitnessedCount = 0;
            this.hiddenCompletedCount = 0;
            this.superWeaponCount = 0;
            this.hasSuperWeapon = false;
            this.hasMaxLevelWeapon = false;
            this.runTrueRouteEnabled = false;
            this.finishedFalseEnding = false;
            this.finishedTrueEnding = false;
            this.talentStartupApplied = false;
            this.talentReviveUsed = false;
            this.runtimeUnlocks = {};
        }

        start(payload = {}) {
            this.reset();
            this.active = true;
            this.runId = payload.runId || `run_${Date.now()}`;
            this.startedAt = Date.now();
            this.currentFloor = Math.max(1, Number(payload.currentFloor) || 1);
            this.runPeakGold = Math.max(0, Number(payload.gold) || 0);
            this.runPeakLevel = Math.max(1, Number(payload.level) || 1);
            return this.getSnapshot();
        }

        restore(snapshot = {}) {
            this.reset();
            Object.assign(this, snapshot || {});
            this.active = !!snapshot.active;
            this.runtimeUnlocks = { ...(snapshot.runtimeUnlocks || {}) };
            return this.getSnapshot();
        }

        getSnapshot() {
            return {
                active: !!this.active,
                runId: this.runId,
                startedAt: this.startedAt,
                settled: !!this.settled,
                currentFloor: this.currentFloor,
                kills: this.kills,
                runPeakGold: this.runPeakGold,
                runPeakLevel: this.runPeakLevel,
                peakHitDamage: this.peakHitDamage,
                bestBossFloor: this.bestBossFloor,
                bossKills: this.bossKills,
                hiddenWitnessedCount: this.hiddenWitnessedCount,
                hiddenCompletedCount: this.hiddenCompletedCount,
                superWeaponCount: this.superWeaponCount,
                hasSuperWeapon: this.hasSuperWeapon,
                hasMaxLevelWeapon: this.hasMaxLevelWeapon,
                runTrueRouteEnabled: this.runTrueRouteEnabled,
                finishedFalseEnding: this.finishedFalseEnding,
                finishedTrueEnding: this.finishedTrueEnding,
                talentStartupApplied: this.talentStartupApplied,
                talentReviveUsed: this.talentReviveUsed,
                runtimeUnlocks: { ...(this.runtimeUnlocks || {}) }
            };
        }
    }

    global.RunProgressTracker = RunProgressTracker;
})(window);
