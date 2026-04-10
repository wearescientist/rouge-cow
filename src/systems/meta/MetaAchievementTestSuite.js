(function attachMetaAchievementTestSuite(global) {
    'use strict';

    function wait(ms) {
        return new Promise((resolve) => global.setTimeout(resolve, ms));
    }

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    class MetaAchievementTestSuite {
        constructor(game, options = {}) {
            this.game = game || global.game || null;
            this.resetMetaOnStart = options.resetMetaOnStart !== false;
            this.running = false;
            this.results = [];
            this.index = -1;
            this.startedAt = 0;
            this.current = null;
            this.pending = null;
            this.queue = this.buildScenarios();
        }

        attach(game) {
            if (game) this.game = game;
        }

        buildScenarios() {
            return [
                { key: 'story_floor1_boss', label: '击败 1 层 Boss', run: (meta) => meta.onEvent('boss_defeated', { floor: 1 }), expect: ['story_floor1_boss'] },
                { key: 'story_floor2_boss', label: '击败 2 层 Boss', run: (meta) => meta.onEvent('boss_defeated', { floor: 2 }), expect: ['story_floor2_boss'] },
                { key: 'story_floor3_boss', label: '击败 3 层 Boss', run: (meta) => meta.onEvent('boss_defeated', { floor: 3 }), expect: ['story_floor3_boss'] },
                { key: 'story_floor4_boss', label: '击败 4 层 Boss', run: (meta) => meta.onEvent('boss_defeated', { floor: 4 }), expect: ['story_floor4_boss'] },
                { key: 'story_floor5_boss', label: '击败 5 层 Boss', run: (meta) => meta.onEvent('boss_defeated', { floor: 5 }), expect: ['story_floor5_boss'] },
                { key: 'story_floor6_boss', label: '击败 6 层 Boss', run: (meta) => meta.onEvent('boss_defeated', { floor: 6 }), expect: ['story_floor6_boss'] },
                { key: 'false_ending', label: '假结局链', run: (meta) => meta.onEvent('false_ending_cleared', { floor: 6 }), expect: ['fake_ending_clear', 'unlock_bible'], expectUnlocks: ['hidden_room_system', 'bible_unlock'] },
                { key: 'true_ending', label: '真结局链', run: (meta) => meta.onEvent('true_ending_cleared', { floor: 7 }), expect: ['true_ending_clear', 'unlock_scythe'], expectUnlocks: ['scythe_unlock'] },
                { key: 'hidden_floor_4', label: '隐藏谜题第4层节点', run: (meta) => meta.onEvent('hidden_progress_updated', { totalWitnessedCount: 4, totalCompletedCount: 4, trueEndingUnlocked: false, witnessedFloors: [1,2,3,4], completedFloors: [1,2,3,4] }), expect: ['hidden_floor4_complete'] },
                { key: 'hidden_floor_6', label: '隐藏谜题第6层节点', run: (meta) => meta.onEvent('hidden_progress_updated', { totalWitnessedCount: 6, totalCompletedCount: 6, trueEndingUnlocked: true, witnessedFloors: [1,2,3,4,5,6], completedFloors: [1,2,3,4,5,6] }), expect: ['hidden_floor6_complete', 'true_route_ever'], expectUnlocks: ['true_route_runtime'] },
                { key: 'story_father_words', label: '父亲遗言碎页', run: (meta) => meta.onEvent('story_unlocked', { key: 'father_words' }), expect: ['story_father_words'] },
                { key: 'story_mother_words', label: '母亲遗言碎页', run: (meta) => meta.onEvent('story_unlocked', { key: 'mother_words' }), expect: ['story_mother_words'] },
                { key: 'story_false_ending_page', label: '假结局碎页', run: (meta) => meta.onEvent('story_unlocked', { key: 'false_ending' }), expect: ['story_false_ending_page'] },
                { key: 'story_dream_gap_page', label: '梦隙碎页', run: (meta) => meta.onEvent('story_unlocked', { key: 'dream_gap' }), expect: ['story_dream_gap_page'] },
                { key: 'story_truth_corridor_page', label: '真相回廊碎页', run: (meta) => meta.onEvent('story_unlocked', { key: 'truth_corridor' }), expect: ['story_truth_corridor_page'] },
                { key: 'kills_1000', label: '累计击杀 1000', run: (meta) => meta.onEvent('enemy_killed', { count: 1000 }), expect: ['kill_total_1000'] },
                { key: 'kills_5000', label: '累计击杀 5000', run: (meta) => meta.onEvent('enemy_killed', { count: 4000 }), expect: ['kill_total_5000'] },
                { key: 'kills_20000', label: '累计击杀 20000', run: (meta) => meta.onEvent('enemy_killed', { count: 15000 }), expect: ['kill_total_20000'] },
                { key: 'kills_50000', label: '累计击杀 50000', run: (meta) => meta.onEvent('enemy_killed', { count: 30000 }), expect: ['kill_total_50000'] },
                { key: 'gold_run_1000', label: '单局金币 1000', run: (meta, game) => this.setRunGold(meta, game, 1000), expect: ['gold_run_1000'] },
                { key: 'gold_run_2000', label: '单局金币 2000', run: (meta, game) => this.setRunGold(meta, game, 2000), expect: ['gold_run_2000'] },
                { key: 'gold_run_5000', label: '单局金币 5000', run: (meta, game) => this.setRunGold(meta, game, 5000), expect: ['gold_run_5000'] },
                { key: 'level_run_20', label: '单局等级 20', run: (meta, game) => this.setRunLevel(meta, game, 20), expect: ['level_run_20'] },
                { key: 'level_run_25', label: '单局等级 25', run: (meta, game) => this.setRunLevel(meta, game, 25), expect: ['level_run_25'] },
                { key: 'level_run_30', label: '单局等级 30', run: (meta, game) => this.setRunLevel(meta, game, 30), expect: ['level_run_30'] },
                { key: 'damage_hit_100', label: '单次伤害 100', run: (meta) => meta.onEvent('damage_dealt', { amount: 100 }), expect: ['damage_hit_100'] },
                { key: 'damage_hit_300', label: '单次伤害 300', run: (meta) => meta.onEvent('damage_dealt', { amount: 300 }), expect: ['damage_hit_300'] },
                { key: 'damage_hit_800', label: '单次伤害 800', run: (meta) => meta.onEvent('damage_dealt', { amount: 800 }), expect: ['damage_hit_800'] },
                { key: 'weapon_max_level', label: '武器满级', run: (meta) => meta.onEvent('weapon_max_level', { weaponKey: 'sword' }), expect: ['weapon_max_level'] },
                { key: 'super_weapon_1', label: '首把超武', run: (meta) => meta.onEvent('weapon_evolved', { weaponKey: 'sword', superWeaponCount: 1 }), expect: ['first_super_weapon'] },
                { key: 'super_weapon_2', label: '双超武', run: (meta) => meta.onEvent('weapon_evolved', { weaponKey: 'bible', superWeaponCount: 2 }), expect: ['super_weapon_2'] },
                { key: 'super_weapon_3', label: '三超武', run: (meta) => meta.onEvent('weapon_evolved', { weaponKey: 'axe', superWeaponCount: 3 }), expect: ['super_weapon_3', 'unlock_storm_axe'], expectUnlocks: ['storm_axe_unlock'] },
                { key: 'super_weapon_5', label: '五超武', run: (meta) => meta.onEvent('weapon_evolved', { weaponKey: 'storm_axe', superWeaponCount: 5 }), expect: ['super_weapon_5'] },
                { key: 'super_weapon_6', label: '六超武', run: (meta) => meta.onEvent('weapon_evolved', { weaponKey: 'scythe', superWeaponCount: 6 }), expect: ['super_weapon_6'] },
                { key: 'legendary_atk', label: '传奇攻击链', run: (meta) => this.seedLegendaryChain(meta, 'dmgMult'), expect: ['legendary_first'], expectUnlocks: ['legendary_atk'] },
                { key: 'legendary_speed', label: '传奇移速链', run: (meta) => this.seedLegendaryChain(meta, 'speedMult'), expectUnlocks: ['legendary_speed'] },
                { key: 'legendary_crit', label: '传奇暴击链', run: (meta) => this.seedLegendaryChain(meta, 'critAdd'), expect: ['legendary_three'], expectUnlocks: ['legendary_crit'] },
                { key: 'legendary_gold', label: '传奇金币链', run: (meta) => this.seedLegendaryChain(meta, 'goldBonusMult'), expectUnlocks: ['legendary_gold'] },
                { key: 'legendary_exp', label: '传奇经验链', run: (meta) => this.seedLegendaryChain(meta, 'expBonusAdd'), expectUnlocks: ['legendary_exp'] },
                { key: 'codex_10', label: '图鉴 10', run: (meta) => meta.onEvent('codex_sync', { count: 10 }), expect: ['codex_10'] },
                { key: 'codex_30', label: '图鉴 30', run: (meta) => meta.onEvent('codex_sync', { count: 30 }), expect: ['codex_30'] },
                { key: 'runs_total_5', label: '完成 5 局', run: (meta) => { for (let i = 0; i < 5; i++) { meta.runTracker.start(); meta.onEvent('run_finished', { result: 'dead' }); } }, expect: ['runs_total_5'] }
            ];
        }

        seedLegendaryChain(meta, effect) {
            meta.onEvent('item_seen', { effect, rarity: 'common' });
            meta.onEvent('item_seen', { effect, rarity: 'rare' });
            meta.onEvent('item_seen', { effect, rarity: 'epic' });
        }

        setRunGold(meta, game, value) {
            if (game?.player) game.player.gold = value;
            meta.onEvent('gold_changed', { value });
        }

        setRunLevel(meta, game, value) {
            if (game?.player) game.player.lv = value;
            meta.onEvent('level_changed', { value });
        }

        resetMetaProgress() {
            const meta = this.game?.metaProgress;
            if (!meta?.store) return false;
            meta.store.state = global.MetaProgressSchemas.createDefaultMetaProgress();
            meta.store.save();
            meta.runTracker.reset();
            meta.lastCodexCount = 0;
            meta.reconcileTalentPoints();
            meta.applyPersistentEffects();
            meta.syncCodexPresentation(true);
            return true;
        }

        async start(options = {}) {
            this.attach(options.game || this.game || global.game);
            if (!this.game?.metaProgress) return false;
            this.queue = this.buildScenarios();
            this.results = [];
            this.index = -1;
            this.current = null;
            this.pending = null;
            this.startedAt = Date.now();
            this.running = true;
            if (options.resetMetaOnStart !== false && this.resetMetaOnStart) {
                this.resetMetaProgress();
                await wait(60);
            }
            return this.advance();
        }

        stop() {
            this.running = false;
            this.current = null;
            this.pending = null;
            return clone(this.results);
        }

        getStatus() {
            return {
                running: this.running,
                index: this.index,
                total: this.queue.length,
                currentKey: this.current?.key || '',
                currentLabel: this.current?.label || '',
                passed: this.results.filter((entry) => entry.ok).length,
                failed: this.results.filter((entry) => !entry.ok).length,
                startedAt: this.startedAt,
                results: clone(this.results)
            };
        }

        getReport() {
            return {
                exportedAt: new Date().toISOString(),
                total: this.queue.length,
                passed: this.results.filter((entry) => entry.ok).length,
                failed: this.results.filter((entry) => !entry.ok).length,
                durationMs: this.startedAt ? (Date.now() - this.startedAt) : 0,
                results: clone(this.results)
            };
        }

        async advance() {
            if (!this.running || !this.game?.metaProgress) return false;
            this.index += 1;
            if (this.index >= this.queue.length) {
                this.running = false;
                return false;
            }
            this.current = this.queue[this.index];
            await this.runCurrent();
            return true;
        }

        async runCurrent() {
            const meta = this.game?.metaProgress;
            const scenario = this.current;
            if (!meta || !scenario) return false;
            meta.runTracker.start({
                currentFloor: this.game?.currentFloor || 1,
                gold: this.game?.player?.gold || 0,
                level: this.game?.player?.lv || 1
            });
            const before = meta.getMetaState();
            scenario.run(meta, this.game);
            meta.flush();
            await wait(80);
            const after = meta.getMetaState();
            const unlocked = Object.keys(after.achievements?.unlocked || {});
            const contentKeys = Object.keys(after.unlocks || {}).filter((key) => after.unlocks[key]?.unlocked);
            const missingAchievements = (scenario.expect || []).filter((key) => !unlocked.includes(key));
            const missingUnlocks = (scenario.expectUnlocks || []).filter((key) => !contentKeys.includes(key));
            const ok = missingAchievements.length === 0 && missingUnlocks.length === 0;
            this.results.push({
                key: scenario.key,
                label: scenario.label,
                ok,
                missingAchievements,
                missingUnlocks,
                unlockedAchievementsDelta: unlocked.filter((key) => !before.achievements?.unlocked?.[key]),
                unlockedContentDelta: contentKeys.filter((key) => !before.unlocks?.[key]?.unlocked)
            });
            return ok;
        }
    }

    global.MetaAchievementTestSuite = MetaAchievementTestSuite;
})(window);
