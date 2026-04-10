((root, factory) => {
    if (typeof module !== "undefined" && module.exports) {
        module.exports = factory();
    } else {
        const exported = factory();
        if (exported && exported.WeaponSurvivalSimulator) {
            root.WeaponSurvivalSimulator = exported.WeaponSurvivalSimulator;
        }
    }
})(
    typeof globalThis !== "undefined" ? globalThis : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : this,
    function () {
    "use strict";

    const defaultTablesFactory = (globalObj) => ({
        WEAPONS: globalObj.WEAPONS || {},
        WEAPON_EVOLUTIONS: globalObj.WEAPON_EVOLUTIONS || {},
        SUPER_WEAPONS: globalObj.SUPER_WEAPONS || {},
        WEAPON_DAMAGE_MODEL: globalObj.WEAPON_DAMAGE_MODEL || {},
        applyUpgrade: typeof globalObj.applyUpgrade === "function" ? globalObj.applyUpgrade : null
    });

    const defaultFloorData = (globalObj) => globalObj.FLOOR_DATA || { floors: {} };

    function createRng(seed) {
        let state = (seed || 0) >>> 0;
        return function () {
            state |= 0;
            state = Math.imul(state, 0x6d2b79f5) + 0x1b873593;
            let z = state ^ (state >>> 16);
            z = Math.imul(z, 0x85ebca6b);
            z = z ^ (z >>> 13);
            z = Math.imul(z, 0xc2b2ae35);
            z = z ^ (z >>> 16);
            return (z >>> 0) / 0x100000000;
        };
    }

    class WeaponState {
        constructor(baseKey, tables) {
            this.baseKey = baseKey;
            this.originKey = baseKey;
            this.tables = tables;
            this.applyUpgrade = tables.applyUpgrade;
            this.reset();
        }

        reset() {
            this.cfg = JSON.parse(JSON.stringify(this.tables.WEAPONS[this.originKey] || {}));
            this.level = 1;
            this.maxLevel = 8;
            this.xp = 0;
            this.xpToNext = 100;
            this.isSuper = false;
            this.superAttackCoeffBonus = 1;
            this.preSuperLevel = 1;
        }

        addXp(amount) {
            if (this.isSuper || this.level >= this.maxLevel) return;
            this.xp += amount;
            while (this.xp >= this.xpToNext && this.level < this.maxLevel) {
                this.xp -= this.xpToNext;
                this.level++;
                this.xpToNext = Math.floor(this.xpToNext * 1.5);
                if (typeof this.applyUpgrade === "function") {
                    this.applyUpgrade(this, this.level);
                }
            }
            if (this.level >= this.maxLevel) {
                this.evolveToSuper();
            }
        }

        evolveToSuper() {
            if (this.isSuper) return;
            const evolution = this.tables.WEAPON_EVOLUTIONS[this.originKey];
            if (!evolution) return;
            const superCfg = this.tables.SUPER_WEAPONS[evolution.result];
            if (!superCfg) return;
            this.preSuperLevel = this.level;
            this.isSuper = true;
            this.cfg = JSON.parse(JSON.stringify(superCfg));
            const carry = Math.max(0, this.preSuperLevel - 4);
            const carryPerLevel = this.tables.WEAPON_DAMAGE_MODEL?.superCoeffCarryPerLevel || 0.04;
            this.superAttackCoeffBonus = 1 + carry * carryPerLevel;
        }

        getAttackCoeff() {
            if (Number.isFinite(this.cfg.attackCoeff)) return this.cfg.attackCoeff;
            if (Number.isFinite(this.cfg.dmg)) {
                return this.cfg.dmg / (this.tables.WEAPON_DAMAGE_MODEL?.baseAttackPower || 24);
            }
            return 1;
        }

        getLevelDamageGrowth() {
            const growth = this.tables.WEAPON_DAMAGE_MODEL?.levelGrowthByKey?.[this.originKey];
            if (Number.isFinite(growth)) return growth;
            const typeGrowth = this.tables.WEAPON_DAMAGE_MODEL?.levelGrowthByType?.[this.cfg.type];
            if (Number.isFinite(typeGrowth)) return typeGrowth;
            return 1.15;
        }

        getLevelDamageMultiplier() {
            if (this.isSuper) return 1;
            const growth = this.getLevelDamageGrowth();
            return Math.pow(growth, Math.max(0, this.level - 1));
        }

        getBaseDamage() {
            const basePower = this.tables.WEAPON_DAMAGE_MODEL?.baseAttackPower || 24;
            let dmg = basePower * this.getAttackCoeff();
            dmg *= this.getLevelDamageMultiplier();
            if (this.isSuper) dmg *= this.superAttackCoeffBonus;
            return Math.max(1, dmg);
        }

        getFireInterval() {
            if (this.cfg.type === "area" || this.cfg.type === "aura") {
                return this.cfg.tickRate || this.cfg.cd || 0.25;
            }
            if (this.cfg.type === "laser") {
                return this.cfg.tickCooldown || this.cfg.cd || 0.2;
            }
            return this.cfg.cd || 0.5;
        }

        getEffectiveDps(roomType, enemyCount) {
            const baseDamage = this.getBaseDamage();
            const interval = Math.max(0.04, this.getFireInterval());
            const multi = (this.cfg.count || 1);
            const splitBonus = 1 + (this.cfg.splitCount ? Math.min(3, this.cfg.splitCount) * 0.08 : 0);
            const pierceBonus = 1 + Math.min(0.4, (this.cfg.pierce || 0) * 0.035);
            const bounceBonus = this.cfg.bounce ? 1 + Math.min(0.35, this.cfg.bounce * 0.04) : 1;
            const typeBonus = {
                orbit: 1.25,
                laser: 1.4,
                area: 1.3,
                aura: 1.2,
                instant: 1.1,
                melee: 1.15
            }[this.cfg.type] || 1;
            const roomBonus = roomType === "boss" ? 1.1 : roomType === "elite" ? 1.05 : 1;
            const crowdBonus = 1 + Math.min(0.35, Math.max(0, enemyCount - 1) * 0.08);
            const projectileBonus = 1 + Math.min(0.25, Math.max(0, (this.cfg.speed || 0) - 400) / 1600);
            return (baseDamage * multi * splitBonus * pierceBonus * bounceBonus * typeBonus * roomBonus * crowdBonus * projectileBonus) / interval;
        }
    }

    function computeEnemyXp(enemy) {
        const hp = enemy.stats?.hp || 8;
        const dmg = enemy.stats?.dmg || 1;
        const tierBonus = enemy.type === "boss" ? 70 : enemy.type === "elite" ? 25 : 0;
        return Math.max(5, Math.round(hp * 0.35 + dmg * 2 + tierBonus));
    }

    function buildRoomEnemies(floorTemplate, type, count, rng) {
        const sources = (floorTemplate?.monsters || []).filter((monster) => monster.type === type);
        if (!sources.length) return [];
        const enemies = [];
        for (let i = 0; i < count; i++) {
            const template = sources[Math.floor(rng() * sources.length)];
            enemies.push({
                id: template.id,
                name: template.name,
                tier: template.tier,
                type: template.type,
                stats: template.stats
            });
        }
        return enemies;
    }

    function computeEnemyThreat(enemies, floorIndex, roomType) {
        const floorMul = 1 + Math.max(0, floorIndex - 1) * 0.08;
        const roomMul = roomType === "boss" ? 1.4 : roomType === "elite" ? 1.15 : 1;
        return enemies.reduce((sum, enemy) => {
            const hp = enemy.stats?.hp || 1;
            const dmg = enemy.stats?.dmg || 1;
            const speed = enemy.stats?.speed || 100;
            const tierMul = enemy.type === "boss" ? 1.6 : enemy.type === "elite" ? 1.2 : 1;
            const contrib = dmg * (1 + speed / 260) * tierMul;
            return sum + contrib;
        }, 0) * floorMul * roomMul;
    }

    function simulateRoom(floorIndex, roomType, enemies, weapon) {
        const totalHp = enemies.reduce((sum, enemy) => sum + (enemy.stats?.hp || 1), 0);
        const dps = weapon.getEffectiveDps(roomType, enemies.length);
        const timeToClear = Math.max(0.35, totalHp / Math.max(1, dps));
        const threat = computeEnemyThreat(enemies, floorIndex, roomType);
        const damageTaken = threat * timeToClear * (roomType === "boss" ? 1.3 : 1);
        const xp = enemies.reduce((sum, enemy) => sum + computeEnemyXp(enemy), 0);
        return {
            time: timeToClear,
            damage: damageTaken,
            xp,
            kills: enemies.length
        };
    }

    function simulateRun(options, tables, floorData, rng) {
        const weapon = new WeaponState(options.weapon, tables);
        const stats = {
            heroHp: options.heroHp,
            maxHp: options.heroHp,
            floorsCleared: 0,
            roomsCleared: 0,
            kills: 0,
            xp: 0,
            damageTaken: 0,
            time: 0,
            log: []
        };

        for (let floorIndex = 1; floorIndex <= options.floors; floorIndex++) {
            const floorKey = `floor${floorIndex}`;
            const floorTemplate = floorData.floors?.[floorKey];
            if (!floorTemplate) break;

            const runLayout = (roomType, roomCount, enemiesPerRoom) => {
                for (let roomIndex = 0; roomIndex < roomCount; roomIndex++) {
                    const enemies = buildRoomEnemies(floorTemplate, roomType, enemiesPerRoom, rng);
                    if (!enemies.length) continue;
                    const result = simulateRoom(floorIndex, roomType, enemies, weapon);
                    stats.heroHp -= result.damage;
                    stats.damageTaken += result.damage;
                    stats.time += result.time;
                    stats.kills += result.kills;
                    stats.roomsCleared += 1;
                    stats.xp += result.xp;
                    weapon.addXp(result.xp);
                    stats.log.push({
                        floor: floorIndex,
                        room: roomIndex + 1,
                        roomType,
                        damage: Number(result.damage.toFixed(1)),
                        time: Number(result.time.toFixed(2)),
                        heroHp: Number(stats.heroHp.toFixed(1)),
                        xp: result.xp
                    });
                    if (stats.heroHp <= 0) return false;
                }
                return true;
            };

            if (!runLayout("common", options.commonRooms, options.commonEnemies)) break;
            if (!runLayout("elite", options.eliteRooms, options.eliteEnemies)) break;

            const bosses = (floorTemplate.monsters || []).filter((monster) => monster.type === "boss");
            for (const boss of bosses) {
                const bossResult = simulateRoom(floorIndex, "boss", [{
                    id: boss.id,
                    name: boss.name,
                    type: boss.type,
                    stats: boss.stats
                }], weapon);
                const adjustedDamage = bossResult.damage * 1.1;
                stats.heroHp -= adjustedDamage;
                stats.damageTaken += adjustedDamage;
                stats.time += bossResult.time;
                stats.kills += bossResult.kills;
                stats.roomsCleared += 1;
                const bossXp = Math.round(bossResult.xp * 1.5);
                stats.xp += bossXp;
                weapon.addXp(bossXp);
                stats.log.push({
                    floor: floorIndex,
                    room: 0,
                    roomType: "boss",
                    damage: Number(adjustedDamage.toFixed(1)),
                    time: Number(bossResult.time.toFixed(2)),
                    heroHp: Number(stats.heroHp.toFixed(1)),
                    xp: bossXp
                });
                if (stats.heroHp <= 0) break;
            }
            if (stats.heroHp <= 0) break;
            stats.floorsCleared = floorIndex;
        }

        stats.survived = stats.heroHp > 0;
        stats.weapon = {
            key: weapon.originKey,
            level: weapon.level,
            isSuper: weapon.isSuper,
            xp: weapon.xp,
            xpToNext: weapon.xpToNext
        };
        return stats;
    }

    function normalizeOptions(raw) {
        return {
            weapon: raw.weapon || "whip",
            floors: Math.max(1, Math.min(7, raw.floors || 4)),
            runs: Math.max(1, raw.runs || 1),
            seed: raw.seed || Date.now(),
            heroHp: Math.max(1, raw.heroHp || 6),
            commonRooms: Math.max(1, raw.commonRooms || 5),
            eliteRooms: Math.max(1, raw.eliteRooms || 2),
            commonEnemies: Math.max(1, raw.commonEnemies || 6),
            eliteEnemies: Math.max(1, raw.eliteEnemies || 3)
        };
    }

    function summarizeRuns(runs) {
        const best = runs.reduce((winner, current) => {
            if (!winner) return current;
            if (current.floorsCleared > winner.floorsCleared) return current;
            if (current.floorsCleared === winner.floorsCleared && current.roomsCleared > winner.roomsCleared) return current;
            return winner;
        }, null);
        const totalDamage = runs.reduce((sum, run) => sum + run.damageTaken, 0);
        const totalKills = runs.reduce((sum, run) => sum + run.kills, 0);
        return {
            totalRuns: runs.length,
            bestRun: best,
            averageDamage: runs.length ? totalDamage / runs.length : 0,
            averageKills: runs.length ? totalKills / runs.length : 0
        };
    }

    class WeaponSurvivalSimulator {
        constructor({ tables = null, floorData = null } = {}) {
            const globalObj = typeof window !== "undefined" ? window : typeof self !== "undefined" ? self : global;
            this.tables = tables || defaultTablesFactory(globalObj);
            this.floorData = floorData || defaultFloorData(globalObj);
        }

        run(options) {
            const normalized = normalizeOptions(options || {});
            const runs = [];
            for (let i = 0; i < normalized.runs; i++) {
                const seed = normalized.seed + i;
                const rng = createRng(seed);
                const stats = simulateRun(normalized, this.tables, this.floorData, rng);
                runs.push(stats);
            }
            const summary = summarizeRuns(runs);
            return {
                timestamp: new Date().toISOString(),
                options: normalized,
                summary,
                runs
            };
        }
    }

    function patchDebugPanelButtons() {
        const runBtn = document.querySelector('button[onclick="window.game.runWeaponBalanceTest()"]');
        const exportBtn = document.querySelector('button[onclick="window.game.exportBalanceReport()"]');
        if (!runBtn && !exportBtn) {
            setTimeout(patchDebugPanelButtons, 200);
            return;
        }
        if (runBtn) {
            runBtn.textContent = '⚔️ 生存测试';
            runBtn.onclick = () => window.game?.runWeaponSurvivalTest?.();
        }
        if (exportBtn) {
            exportBtn.textContent = '📈 导出生存报告';
            exportBtn.onclick = () => window.game?.exportWeaponSurvivalReport?.();
        }
    }

    if (typeof window !== "undefined") {
        patchDebugPanelButtons();
    }

    function escapeHtml(value) {
        if (value == null) return '';
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function buildHTMLReport(report) {
        const rows = report.runs.map((run, index) => {
            const weapon = escapeHtml(run.weapon.key);
            const level = run.weapon.level;
            const superFlag = run.weapon.isSuper ? ' (超武)' : '';
            return `
                <tr>
                    <td>${index + 1}</td>
                    <td>${weapon}${superFlag}</td>
                    <td>${run.floorsCleared}</td>
                    <td>${run.roomsCleared}</td>
                    <td>${run.kills}</td>
                    <td>${Math.round(run.damageTaken)}</td>
                    <td>${run.survived ? '✔️' : '✗'}</td>
                    <td>${level}</td>
                </tr>
            `;
        }).join('');

        const head = `
            <div class="summary-card">
                <div><strong>Runs</strong>: ${report.summary.totalRuns}</div>
                <div><strong>Best floor</strong>: ${report.summary.bestRun?.floorsCleared || 0}</div>
                <div><strong>Avg damage</strong>: ${report.summary.averageDamage.toFixed(1)}</div>
                <div><strong>Avg kills</strong>: ${report.summary.averageKills.toFixed(1)}</div>
            </div>
        `;

        const styles = `
            body { font-family: "Segoe UI", system-ui, sans-serif; background:#04050a; color:#eef1ff; }
            .report-shell { max-width: 960px; margin:0 auto; padding:32px; }
            h1 { margin-bottom:0.3em; }
            .meta { color:#9bb0d1; margin-bottom:16px; }
            table { width:100%; border-collapse:collapse; margin-top:16px; }
            th, td { padding:10px 12px; border-bottom:1px solid rgba(255,255,255,0.08); text-align:left; }
            th { background:rgba(255,255,255,0.06); }
            .summary-card { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:10px; margin-bottom:8px; }
            .summary-card div { padding:10px; border-radius:10px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.08); }
        `;

        return `
            <!DOCTYPE html>
            <html lang="zh-CN">
            <head>
                <meta charset="UTF-8">
                <title>Survival Report</title>
                <style>${styles}</style>
            </head>
            <body>
                <div class="report-shell">
                    <h1>单武器生存测试</h1>
                    <div class="meta">
                        武器: ${escapeHtml(report.options.weapon)} | Floors: ${report.options.floors} | Runs: ${report.options.runs} | Seed: ${report.options.seed}
                    </div>
                    ${head}
                    <table>
                        <thead>
                            <tr>
                                <th>Run</th>
                                <th>武器</th>
                                <th>楼层</th>
                                <th>房间</th>
                                <th>击杀</th>
                                <th>受伤</th>
                                <th>存活</th>
                                <th>等级</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rows}
                        </tbody>
                    </table>
                </div>
            </body>
            </html>
        `;
    }

    WeaponSurvivalSimulator.buildHTMLReport = buildHTMLReport;

    function patchDebugPanelButtons() {
        const runBtn = document.querySelector('button[onclick="window.game.runWeaponBalanceTest()"]');
        const exportBtn = document.querySelector('button[onclick="window.game.exportBalanceReport()"]');
        if (!runBtn && !exportBtn) {
            setTimeout(patchDebugPanelButtons, 200);
        }
        if (runBtn) {
            runBtn.textContent = '⚔️ 生存测试';
            runBtn.onclick = () => window.game?.runWeaponSurvivalTest?.();
        }
        if (exportBtn) {
            exportBtn.textContent = '📈 导出生存报告';
            exportBtn.onclick = () => window.game?.exportWeaponSurvivalReport?.();
        }
    }

    if (typeof window !== "undefined") {
        patchDebugPanelButtons();
    }

    return { WeaponSurvivalSimulator };
});
