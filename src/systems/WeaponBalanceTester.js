/**
 * WeaponBalanceTester - AI自动武器平衡测试系统
 * v0.26 - 自动化武器性能评估与平衡建议
 * 
 * 测试原理：
 * 1. 模拟标准战斗场景（固定时间/敌人配置）
 * 2. 统计各武器DPS、清场效率、生存贡献
 * 3. 计算平衡性指标（变异系数、极差比）
 * 4. 输出调整建议
 */

class WeaponBalanceTester {
    constructor() {
        this.testResults = new Map(); // sampleKey -> 测试结果
        this.standardEnemyHP = 100;   // 标准敌人血量
        this.testDuration = 60;       // 单次测试时长(秒)
        this.simulationRuns = 60;     // 每武器模拟次数
        this.excludedWeaponKeys = new Set(['icicle', 'lightning']);
        this.accountLockedFormalWeapons = new Set(['bible', 'scythe', 'axe']);
        
        // 平衡性阈值
        this.balanceThresholds = {
            dpsVariance: 0.3,      // DPS变异系数阈值 (>0.3认为不平衡)
            minMaxRatio: 0.5,      // 最低/最高伤害比阈值 (<0.5认为差距过大)
            overPerform: 1.5,      // 超标阈值 (>1.5倍平均认为过强)
            underPerform: 0.7      // 不足阈值 (<0.7倍平均认为过弱)
        };
        
        // 标准测试配置
        this.testConfig = {
            playerLevel: 10,
            weaponLevel: 8,
            enemyDensity: 50,      // 敌人数量
            enemyTypes: ['chick', 'snail', 'pigeon'], // 混合敌人类型
            roomSize: { w: 800, h: 600 },
            testPatterns: ['room', 'boss'] // 测试模式
        };

        this.enemyProfiles = {
            swarm: { hp: 140, speed: 144, radius: 18, armor: 0.03, tag: 'swarm' },
            bruiser: { hp: 420, speed: 96, radius: 26, armor: 0.1, tag: 'bruiser' },
            elite: { hp: 1400, speed: 88, radius: 34, armor: 0.14, tag: 'elite' },
            boss: { hp: 120000, speed: 74, radius: 62, armor: 0.2, tag: 'boss', isBoss: true }
        };

        this.scenarioConfigs = {
            room: {
                key: 'room',
                label: '普通房',
                weight: 0.55,
                duration: 60,
                roomSize: { w: 900, h: 720 },
                groups: [
                    { profile: 'swarm', count: 42, minRadius: 90, maxRadius: 280 },
                    { profile: 'bruiser', count: 18, minRadius: 150, maxRadius: 340 },
                    { profile: 'elite', count: 5, minRadius: 220, maxRadius: 380 }
                ]
            },
            boss: {
                key: 'boss',
                label: 'Boss',
                weight: 0.45,
                duration: 60,
                roomSize: { w: 920, h: 720 },
                groups: [
                    { profile: 'boss', count: 1, minRadius: 180, maxRadius: 180 }
                ]
            }
        };
    }

    getFormalWeaponKeys() {
        return Object.keys(WEAPONS || {}).filter((weaponKey) => {
            const weapon = WEAPONS?.[weaponKey];
            if (!weapon) return false;
            if (this.excludedWeaponKeys.has(weaponKey)) return false;
            if (this.accountLockedFormalWeapons.has(weaponKey)) return true;
            if (weapon.hiddenFromPool) return false;
            if (weapon.mergedInto) return false;
            return true;
        });
    }

    buildWeaponStageSamples() {
        const samples = [];
        for (const weaponKey of this.getFormalWeaponKeys()) {
            const baseWeapon = WEAPONS?.[weaponKey];
            if (!baseWeapon) continue;
            const maxLevel = Math.max(1, baseWeapon.maxLevel || 8);
            for (let level = 1; level <= maxLevel; level++) {
                const simWeapon = this.buildLevelWeaponConfig(weaponKey, level);
                samples.push({
                    sampleKey: `${weaponKey}_lv${level}`,
                    weaponKey,
                    weaponName: baseWeapon.name,
                    stageType: 'level',
                    stageLevel: level,
                    stageLabel: `Lv.${level}`,
                    displayName: `${baseWeapon.name} Lv.${level}`,
                    simWeapon
                });
            }

            const evo = WEAPON_EVOLUTIONS?.[weaponKey];
            const superKey = evo?.result;
            const superCfg = superKey ? SUPER_WEAPONS?.[superKey] : null;
            if (superKey && superCfg) {
                samples.push({
                    sampleKey: `${superKey}_super`,
                    weaponKey,
                    weaponName: baseWeapon.name,
                    stageType: 'super',
                    stageLevel: maxLevel,
                    stageLabel: '超武',
                    displayName: `${superCfg.name} 超武`,
                    superWeaponKey: superKey,
                    simWeapon: this.buildSuperWeaponConfig(superKey)
                });
            }
        }
        return samples;
    }

    buildLevelWeaponConfig(weaponKey, level) {
        const baseCfg = WEAPONS?.[weaponKey];
        const fakeWeapon = {
            baseKey: weaponKey,
            cfg: { ...(baseCfg || {}) },
            baseAttackCoeff: Number.isFinite(baseCfg?.attackCoeff) ? baseCfg.attackCoeff : null,
            upgradeHistory: []
        };
        for (let nextLevel = 2; nextLevel <= level; nextLevel++) {
            if (typeof applyUpgrade === 'function') {
                applyUpgrade(fakeWeapon, nextLevel);
            }
        }
        return { ...fakeWeapon.cfg };
    }

    buildSuperWeaponConfig(superKey) {
        return { ...(SUPER_WEAPONS?.[superKey] || {}) };
    }

    getBaseAttackPower() {
        return window.WEAPON_DAMAGE_MODEL?.baseAttackPower || 24;
    }

    getWeaponAttackCoeff(weapon) {
        if (Number.isFinite(weapon?.attackCoeff)) return weapon.attackCoeff;
        if (Number.isFinite(weapon?.dmg)) return weapon.dmg / this.getBaseAttackPower();
        return 1;
    }

    getWeaponLevelGrowth(weaponKey, weapon) {
        return window.WEAPON_DAMAGE_MODEL?.levelGrowthByKey?.[weaponKey]
            || window.WEAPON_DAMAGE_MODEL?.levelGrowthByType?.[weapon?.type]
            || 1.2;
    }

    getBalanceMultiplier(weaponKey) {
        const map = {
            whip: 1.0,
            scythe: 0.95,
            wand: 1.1,
            knife: 0.62,
            axe: 1.1,
            cross: 1.05,
            fireball: 1.35,
            shuriken: 0.72,
            icicle: 1.0,
            laser: 1.2,
            poison_dart: 1.05,
            bible: 1.2,
            lightning: 0.95,
            holy_water: 1.35,
            radiance: 1.15
        };
        return map[weaponKey] || 1;
    }

    getWeaponBaseDamage(weaponKey, weapon, level = this.testConfig.weaponLevel || 1) {
        if (!weapon) return this.getBaseAttackPower();
        return this.getBaseAttackPower()
            * this.getWeaponAttackCoeff(weapon)
            * Math.pow(this.getWeaponLevelGrowth(weaponKey, weapon), Math.max(0, level - 1))
            * this.getBalanceMultiplier(weaponKey);
    }
    
    /**
     * 运行完整平衡测试套件
     */
    async runFullTest() {
        console.log('[WeaponBalanceTester] 开始完整武器平衡测试...');
        const samples = this.buildWeaponStageSamples();
        const results = [];

        for (const sample of samples) {
            console.log(`[WeaponBalanceTester] 测试阶段: ${sample.displayName}`);
            const result = await this.testWeaponStage(sample);
            this.testResults.set(sample.sampleKey, result);
            results.push(result);
        }
        
        // 生成平衡报告
        const report = this.generateBalanceReport(results);
        console.log('[WeaponBalanceTester] 测试完成', report);
        
        return report;
    }
    
    /**
     * 测试单个武器性能
     */
    async testWeaponStage(sample) {
        const weapon = sample.simWeapon;
        const scenarioResults = {};

        for (const scenarioKey of this.testConfig.testPatterns) {
            const runs = [];
            for (let i = 0; i < this.simulationRuns; i++) {
                runs.push(this.simulateCombat(sample, scenarioKey));
            }
            scenarioResults[scenarioKey] = this.calculateStats(runs, this.getScenarioConfig(scenarioKey));
        }

        const avgDPS = this.getWeightedScenarioMetric(scenarioResults, 'avgDPS');
        const avgKills = this.getWeightedScenarioMetric(scenarioResults, 'avgKills');
        const avgAccuracy = this.getWeightedScenarioMetric(scenarioResults, 'avgAccuracy');
        const survivalRate = this.getWeightedScenarioMetric(scenarioResults, 'survivalRate');
        const cvDPS = this.getWeightedScenarioMetric(scenarioResults, 'cvDPS');
        const roomTTK = scenarioResults.room?.avgClearTime || 0;
        const roomClearRate = scenarioResults.room?.clearRate || 0;
        const roomPressure = scenarioResults.room?.avgRoomPressure || 0;
        const bossTTK = scenarioResults.boss?.avgBossKillTime || 0;
        const bossKillRate = scenarioResults.boss?.bossKillRate || 0;
        const bossPressure = scenarioResults.boss?.avgBossPressure || 0;
        
        return {
            sampleKey: sample.sampleKey,
            weaponKey: sample.weaponKey,
            superWeaponKey: sample.superWeaponKey || null,
            weaponName: sample.displayName,
            baseWeaponName: sample.weaponName,
            stageType: sample.stageType,
            stageLabel: sample.stageLabel,
            stageLevel: sample.stageLevel,
            type: weapon.type,
            subtype: weapon.subtype,
            baseDmg: Math.round(this.getWeaponBaseDamage(sample.weaponKey, weapon, sample.stageLevel || 1)),
            baseCD: weapon.cd,
            theoreticalDPS: this.getWeaponBaseDamage(sample.weaponKey, weapon, sample.stageLevel || 1) / Math.max(weapon.cd || 0.5, 0.05),
            avgDPS,
            avgKills,
            avgAccuracy,
            survivalRate,
            cvDPS,
            roomDPS: scenarioResults.room?.avgDPS || 0,
            bossDPS: scenarioResults.boss?.avgDPS || 0,
            roomTTK,
            roomClearRate,
            roomPressure,
            bossTTK,
            bossKillRate,
            bossPressure,
            roleProfile: this.getRoleProfile(scenarioResults),
            scenarioResults
        };
    }

    getScenarioConfig(scenarioKey) {
        return this.scenarioConfigs[scenarioKey] || this.scenarioConfigs.room;
    }

    getWeightedScenarioMetric(scenarioResults, metric) {
        let total = 0;
        let weightSum = 0;
        for (const scenarioKey of this.testConfig.testPatterns) {
            const scenario = this.getScenarioConfig(scenarioKey);
            const value = scenarioResults?.[scenarioKey]?.[metric];
            if (!Number.isFinite(value)) continue;
            total += value * scenario.weight;
            weightSum += scenario.weight;
        }
        return weightSum > 0 ? total / weightSum : 0;
    }

    getRoleProfile(scenarioResults) {
        const crowdDPS = scenarioResults.room?.avgDPS || 0;
        const bossDPS = scenarioResults.boss?.avgDPS || 0;
        const peak = Math.max(crowdDPS, bossDPS, 1);

        if (Math.abs(crowdDPS - bossDPS) / peak <= 0.12) return '均衡型';

        if (crowdDPS > bossDPS * 2.1) return '清图型';
        if (bossDPS > crowdDPS * 1.2) return '打王型';
        return crowdDPS >= bossDPS ? '偏清图' : '偏打王';
    }
    
    /**
     * 模拟单次战斗
     */
    simulateCombat(sample, scenarioKey = 'room') {
        const weapon = sample.simWeapon;
        const scenario = this.getScenarioConfig(scenarioKey);
        this.testConfig.roomSize = { ...scenario.roomSize };
        const enemies = this.spawnTestEnemies(scenarioKey);
        
        let totalDamage = 0;
        let kills = 0;
        let hits = 0;
        let misses = 0;
        
        let time = 0;
        let cooldown = 0;
        const duration = scenario.duration || this.testDuration;
        
        // 战斗模拟主循环
        while (time < duration && enemies.some(e => e.hp > 0)) {
            const dt = 0.1; // 100ms timestep
            time += dt;
            cooldown -= dt;
            
            // 武器攻击
            if (cooldown <= 0) {
                const attack = this.simulateAttack(sample, weapon, enemies, scenario);
                totalDamage += attack.damage;
                hits += attack.hits;
                misses += attack.misses;
                kills += attack.kills;
                
                cooldown = this.getAttackInterval(weapon, scenario);
            }
            
            // 更新敌人位置（简单AI）
            this.updateEnemies(enemies, dt, scenario, time);
        }

        const alive = enemies.filter(e => e.hp > 0);
        const boss = enemies.find(e => e.isBoss);
        return {
            scenarioKey,
            totalDamage,
            kills,
            hits,
            misses,
            accuracy: hits / (hits + misses) || 0,
            effectiveDPS: totalDamage / duration,
            clearTime: alive.length === 0 ? time : duration,
            timeAlive: Math.max(0, duration - time),
            duration,
            cleared: alive.length === 0,
            remainingEnemies: alive.length,
            remainingBossHpRatio: boss ? Math.max(0, boss.hp) / Math.max(1, boss.maxHp) : 0
        };
    }

    getGuardianKnifeAttackInterval(weapon, scenario) {
        const speed = Math.max(120, weapon?.speed || 260);
        const returnSpeed = Math.max(160, weapon?.returnSpeed || speed * 1.25);
        const passDistance = Math.max(72, weapon?.passThroughDistance || 72);
        const count = Math.max(1, weapon?.count || 1);
        const searchDistance = scenario?.key === 'boss' ? 180 : 260;
        const returnDistance = scenario?.key === 'boss' ? 96 : 168;
        const chaseTime = searchDistance / (speed * 1.34);
        const passTime = passDistance / (speed * 1.16);
        const curveTime = scenario?.key === 'boss' ? 0.28 : 0.34;
        const reacquireTime = scenario?.key === 'boss' ? 0.09 : 0.18;
        const returnTime = returnDistance / (returnSpeed * 1.38);
        const overlapEfficiency = 1 + Math.max(0, count - 1) * 0.32;
        const cycleTime = chaseTime + passTime + curveTime + reacquireTime + returnTime;
        return Math.max(0.08, cycleTime / overlapEfficiency);
    }

    getAttackInterval(weapon, scenario = null) {
        if (!weapon) return 0.5;
        if (weapon.subtype === 'guardian_knife') {
            return this.getGuardianKnifeAttackInterval(weapon, scenario);
        }
        if (weapon.type === 'aura') return weapon.tickRate || weapon.cd || 0.2;
        if (weapon.type === 'laser') return weapon.cd || weapon.tickCooldown || 0.25;
        return weapon.cd || 0.5;
    }
    
    /**
     * 模拟单次攻击
     */
    simulateAttack(sample, weapon, enemies, scenario) {
        let damage = 0;
        let hits = 0;
        let misses = 0;
        let kills = 0;
        
        const dmg = this.getWeaponBaseDamage(sample.weaponKey, weapon, sample.stageLevel || 1);
        const range = weapon.range || 200;
        const applyHit = (target, amount, hitWeight = 1) => {
            if (!target || target.hp <= 0) return;
            const actual = Math.max(1, Math.floor(amount));
            damage += actual;
            hits += hitWeight;
            target.hp -= actual;
            if (target.hp <= 0) {
                target.hp = 0;
                kills++;
            }
        };
        
        // 根据武器类型计算命中
        switch (weapon.type) {
            case 'melee':
                for (let i = 0; i < Math.max(1, weapon.count || 1); i++) {
                    const meleeTargets = this.getTargetsInArc(enemies, range, weapon.arcAngle || 120, scenario);
                    if (!meleeTargets.length) {
                        misses++;
                        continue;
                    }
                    for (const target of meleeTargets) {
                        if (this.hitCheck(weapon, target, scenario, i, meleeTargets.length)) {
                            applyHit(target, this.calculateDamage(dmg, weapon, target, scenario));
                        } else {
                            misses++;
                        }
                    }
                }
                break;
                
            case 'proj':
                const shotCount = this.getProjectileShotCount(weapon, scenario);
                for (let i = 0; i < shotCount; i++) {
                    const target = this.getProjectileTarget(enemies, scenario, weapon, i, shotCount, range);
                    if (!target) {
                        misses++;
                        continue;
                    }
                    if (!this.hitCheck(weapon, target, scenario, i, shotCount)) {
                        misses++;
                        continue;
                    }

                    const actualDmg = this.calculateDamage(dmg, weapon, target, scenario);
                    applyHit(target, actualDmg);

                    if (weapon.subtype === 'boomerang') {
                        const returnTarget = target.isBoss ? target : this.getAlternateTarget(target, enemies, range);
                        if (returnTarget) {
                            applyHit(returnTarget, actualDmg * (weapon.returnDamage ? 0.92 : 0.68));
                        }
                    }

                    if (weapon.subtype === 'bounce' || weapon.bounce) {
                        const bounceTargets = this.getSecondaryTargets(
                            target,
                            enemies,
                            Math.min(weapon.bounce || 0, scenario.key === 'room' ? 4 : 1),
                            range * 0.75
                        );
                        let bounceMult = 0.72;
                        for (const bounceTarget of bounceTargets) {
                            applyHit(bounceTarget, actualDmg * bounceMult);
                            bounceMult *= 0.82;
                        }
                    }

                    if (weapon.subtype === 'explode' || weapon.explodeRadius) {
                        const splashTargets = this.getSecondaryTargets(
                            target,
                            enemies,
                            scenario.key === 'room' ? 3 : 0,
                            weapon.explodeRadius || 140
                        );
                        for (const splashTarget of splashTargets) {
                            applyHit(splashTarget, actualDmg * 0.74);
                        }
                    }

                    if (weapon.pierce) {
                        const pierceBudget = weapon.pierce >= 99
                            ? (scenario.key === 'room' ? 4 : 0)
                            : (scenario.key === 'room' ? Math.min(3, weapon.pierce) : 0);
                        const pierceTargets = this.getSecondaryTargets(
                            target,
                            enemies,
                            pierceBudget,
                            range
                        );
                        let pierceMult = 0.58;
                        for (const pierceTarget of pierceTargets) {
                            applyHit(pierceTarget, actualDmg * pierceMult);
                            pierceMult *= 0.85;
                        }
                    }
                }
                break;
                
            case 'orbit':
                {
                    const orbitTargets = this.getTargetsInRadius(enemies, range, scenario);
                    const tickCount = Math.max(2, Math.round(Math.min(weapon.duration || 6, 3.6) / 0.45));
                    const orbitCount = Math.max(1, weapon.count || 1);
                    const coverageMult = 0.68 + Math.min(orbitCount, 6) * 0.1;
                    const codexMult = weapon.codexWeaponized
                        ? 1 + Math.min(0.24, (weapon.codexExtraShots || 0) * 0.04 + ((weapon.codexShotDmgScale || 1) - 1) * 0.16 + (weapon.codexBurstChance || 0) * 0.22)
                        : 1;
                    for (const target of orbitTargets) {
                        const orbitMult = target.isBoss ? 0.42 : 0.3;
                        const actualDmg = this.calculateDamage(dmg * tickCount * coverageMult * codexMult * orbitMult, weapon, target, scenario);
                        applyHit(target, actualDmg, tickCount * Math.min(1.9, coverageMult));
                    }
                }
                break;
                
            case 'instant':
                {
                    const instantTarget = this.getNearestTarget(enemies, range);
                    if (!instantTarget) {
                        misses++;
                        break;
                    }
                    const actualDmg = this.calculateDamage(dmg, weapon, instantTarget, scenario);
                    applyHit(instantTarget, actualDmg);

                    const chainTargets = this.getSecondaryTargets(
                        instantTarget,
                        enemies,
                        Math.min(weapon.chain || 0, scenario.key === 'room' ? 6 : 0),
                        weapon.chainRange || range * 0.6
                    );
                    let chainMult = 0.66;
                    for (const chainTarget of chainTargets) {
                        applyHit(chainTarget, actualDmg * chainMult);
                        chainMult *= 0.84;
                    }

                    if (weapon.branches && scenario.key !== 'boss') {
                        const forkTargets = this.getSecondaryTargets(instantTarget, enemies, Math.min(weapon.branches, 3), range * 0.5);
                        for (const forkTarget of forkTargets) {
                            applyHit(forkTarget, actualDmg * 0.48);
                        }
                    }
                }
                break;
                
            case 'area':
                {
                    const areaRadius = Math.max(100, range * 0.46, weapon.growTo || 0);
                    const areaTargets = this.getTargetsInRadius(enemies, areaRadius, scenario);
                    const tickRate = Math.max(0.12, weapon.tickRate || 0.5);
                    const spreadMult = 1 + Math.min(0.14, Math.max(0, ((weapon.growTo || 0) - (weapon.growFrom || 0)) / 220) * 0.12);
                    const burstMult = 1 + Math.max(0, weapon.maxBurstDmgScale || 0) * 0.08 + Math.max(0, ((weapon.exposeMultiplier || 0) - 1)) * 0.08;
                    const tickCount = Math.max(2, Math.round(Math.min(weapon.duration || 6, 4.2) / tickRate * (scenario.key === 'room' ? 0.3 : 0.13)));
                    for (const target of areaTargets) {
                        const areaMult = target.isBoss ? 0.28 : 0.38;
                        const actualDmg = this.calculateDamage(dmg * tickCount * spreadMult * burstMult * areaMult, weapon, target, scenario);
                        applyHit(target, actualDmg, tickCount);
                    }
                }
                break;
                
            case 'aura':
                {
                    const auraTargets = this.getTargetsInRadius(enemies, range, scenario);
                    const auraRangeMult = 1 + Math.min(0.1, Math.max(0, ((weapon.range || 0) - 280) / 280) * 0.08);
                    const executeMult = 1 + Math.max(0, weapon.execute || 0) * 0.36 + (weapon.burstOnDeath ? 0.04 : 0);
                    for (const target of auraTargets) {
                        const auraMult = target.isBoss ? 0.8 : 0.94;
                        const actualDmg = this.calculateDamage(dmg * auraMult * auraRangeMult * executeMult, weapon, target, scenario);
                        applyHit(target, actualDmg);
                    }
                }
                break;

            case 'laser':
                {
                    const tickCount = Math.max(2, Math.round((weapon.beamLife || 0.22) / Math.max(weapon.tickCooldown || 0.15, 0.04)));
                    const lineTargets = this.getTargetsInLine(enemies, range, weapon.width || 14, scenario);
                    if (!lineTargets.length) {
                        misses++;
                        break;
                    }
                    for (const target of lineTargets) {
                        const laserMult = target.isBoss ? 0.86 : 0.72;
                        const actualDmg = this.calculateDamage(dmg * tickCount * laserMult, weapon, target, scenario);
                        applyHit(target, actualDmg, tickCount);
                    }
                }
                break;
        }
        
        return { damage, hits, misses, kills };
    }

    getProjectileShotCount(weapon, scenario) {
        const baseCount = Math.max(1, weapon.count || 1);
        const burst = Math.max(1, weapon.burst || 1);
        if (weapon.subtype === 'fan' && scenario.key === 'boss') {
            return Math.max(1, Math.ceil(baseCount * 0.65));
        }
        return baseCount * burst;
    }
    
    /**
     * 生成测试敌人
     */
    spawnTestEnemies(scenarioKey = 'room') {
        const scenario = this.getScenarioConfig(scenarioKey);
        const enemies = [];
        const centerX = scenario.roomSize.w / 2;
        const centerY = scenario.roomSize.h / 2;
        let idx = 0;

        for (const group of scenario.groups) {
            const profile = this.enemyProfiles[group.profile];
            if (!profile) continue;
            for (let i = 0; i < group.count; i++) {
                const angle = group.count === 1 ? 0 : (Math.PI * 2 * i) / group.count;
                const spread = group.maxRadius - group.minRadius;
                const radius = group.minRadius + (spread > 0 ? (i % 5) / 4 * spread : 0);
                enemies.push({
                    id: `${scenario.key}_${group.profile}_${idx++}`,
                    x: centerX + Math.cos(angle) * radius,
                    y: centerY + Math.sin(angle) * radius,
                    hp: profile.hp,
                    maxHp: profile.hp,
                    speed: profile.speed,
                    radius: profile.radius,
                    armor: profile.armor || 0,
                    tag: profile.tag,
                    isBoss: !!profile.isBoss,
                    orbitPhase: angle,
                    spawnRadius: radius,
                    roomSize: { ...scenario.roomSize }
                });
            }
        }
        
        return enemies;
    }
    
    /**
     * 更新敌人位置
     */
    updateEnemies(enemies, dt, scenario, time) {
        const centerX = scenario.roomSize.w / 2;
        const centerY = scenario.roomSize.h / 2;
        
        for (const e of enemies) {
            if (e.hp <= 0) continue;

            if (e.isBoss) {
                e.orbitPhase += dt * 0.35;
                const orbitRadius = e.spawnRadius || 180;
                e.x = centerX + Math.cos(e.orbitPhase) * orbitRadius;
                e.y = centerY + Math.sin(e.orbitPhase) * Math.max(120, orbitRadius * 0.7);
                continue;
            }

            const dx = centerX - e.x;
            const dy = centerY - e.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const lateralX = -dy / dist;
            const lateralY = dx / dist;
            const drift = Math.sin(time * 0.9 + e.orbitPhase) * 18;

            if (dist > 75) {
                e.x += ((dx / dist) * e.speed + lateralX * drift) * dt;
                e.y += ((dy / dist) * e.speed + lateralY * drift) * dt;
            }
        }
    }
    
    /**
     * 命中检查
     */
    hitCheck(weapon, target, scenario, shotIndex = 0, shotCount = 1) {
        let hitChance = 0.93;
        
        if (weapon.subtype === 'homing' || weapon.subtype === 'poison_homing') hitChance = 0.985;
        if (weapon.subtype === 'rapid') hitChance = 0.9;
        if (weapon.type === 'melee') hitChance = 0.975;
        if (weapon.type === 'laser') hitChance = 0.995;
        if (weapon.type === 'area' || weapon.type === 'aura') hitChance = 0.97;
        if (weapon.subtype === 'fan' && scenario.key === 'boss') {
            const centerBias = 1 - Math.abs(shotIndex - (shotCount - 1) / 2) / Math.max(1, shotCount / 2);
            hitChance *= 0.58 + centerBias * 0.35;
        }
        if (target?.isBoss && weapon.type === 'melee') hitChance += 0.02;
        
        return Math.random() < hitChance;
    }
    
    /**
     * 计算实际伤害
     */
    calculateDamage(baseDmg, weapon, target, scenario) {
        let dmg = baseDmg;

        if (target?.armor) {
            dmg *= 1 - Math.min(0.45, target.armor);
        }

        if (target?.isBoss) {
            if (weapon.type === 'melee' || weapon.type === 'laser') dmg *= 1.08;
            if (weapon.type === 'area' || weapon.type === 'aura') dmg *= 0.82;
            if (weapon.type === 'orbit') dmg *= 0.9;
        } else if (target?.tag === 'swarm' && ['area', 'aura', 'orbit'].includes(weapon.type)) {
            dmg *= 1.08;
        }
        
        // 暴击
        const critChance = Math.min(0.35, weapon.crit || 0.1);
        if (Math.random() < critChance) {
            dmg *= weapon.critDmg || 1.5;
        }
        
        // 伤害浮动
        dmg *= (0.92 + Math.random() * 0.16);
        
        return Math.floor(dmg);
    }
    
    /**
     * 辅助函数：获取扇形范围内目标
     */
    getTargetsInArc(enemies, range, angle, scenario) {
        const cap = scenario.key === 'room'
            ? Math.max(2, Math.min(6, Math.round(angle / 45)))
            : 1;
        return enemies
            .filter(e => e.hp > 0 && this.getDistance(e) <= range)
            .sort((a, b) => this.getDistance(a) - this.getDistance(b))
            .slice(0, cap);
    }
    
    /**
     * 辅助函数：获取圆形范围内目标
     */
    getTargetsInRadius(enemies, radius, scenario) {
        const cap = scenario.key === 'room' ? 6 : 1;
        return enemies
            .filter(e => e.hp > 0 && this.getDistance(e) <= radius)
            .sort((a, b) => this.getDistance(a) - this.getDistance(b))
            .slice(0, cap);
    }
    
    /**
     * 辅助函数：获取最近目标
     */
    getNearestTarget(enemies, range = Infinity) {
        let nearest = null;
        let minDist = Infinity;
        
        for (const e of enemies) {
            if (e.hp <= 0) continue;
            const dist = this.getDistance(e);
            if (dist > range) continue;
            if (dist < minDist) {
                minDist = dist;
                nearest = e;
            }
        }
        
        return nearest;
    }

    getProjectileTarget(enemies, scenario, weapon, shotIndex, shotCount, range) {
        if (scenario.key === 'boss') {
            return this.getNearestTarget(enemies, range);
        }
        const inRange = enemies
            .filter(e => e.hp > 0 && this.getDistance(e) <= range)
            .sort((a, b) => this.getDistance(a) - this.getDistance(b));
        if (!inRange.length) return null;
        if (weapon.subtype === 'fan') {
            return inRange[Math.min(inRange.length - 1, shotIndex % Math.max(1, Math.min(inRange.length, 4)))];
        }
        return inRange[Math.min(inRange.length - 1, shotIndex % Math.max(1, Math.min(inRange.length, 2)))];
    }

    getAlternateTarget(primaryTarget, enemies, range = Infinity) {
        return enemies
            .filter(e => e.hp > 0 && e !== primaryTarget && this.getDistance(e) <= range)
            .sort((a, b) => this.getDistanceToTarget(primaryTarget, a) - this.getDistanceToTarget(primaryTarget, b))[0] || null;
    }

    getSecondaryTargets(primaryTarget, enemies, limit, radius) {
        if (!primaryTarget || limit <= 0) return [];
        return enemies
            .filter(e => e.hp > 0 && e !== primaryTarget && this.getDistanceToTarget(primaryTarget, e) <= radius)
            .sort((a, b) => this.getDistanceToTarget(primaryTarget, a) - this.getDistanceToTarget(primaryTarget, b))
            .slice(0, limit);
    }

    getTargetsInLine(enemies, range, width, scenario) {
        const cap = scenario.key === 'room'
            ? Math.max(2, Math.min(5, Math.round(width / 6)))
            : 1;
        return enemies
            .filter(e => e.hp > 0 && this.getDistance(e) <= range)
            .sort((a, b) => this.getDistance(a) - this.getDistance(b))
            .slice(0, cap);
    }
    
    /**
     * 辅助函数：获取距离（简化：以中心为原点）
     */
    getDistance(target) {
        const roomSize = target?.roomSize || this.testConfig.roomSize;
        const playerX = roomSize.w / 2;
        const playerY = roomSize.h / 2;
        return Math.sqrt(
            (target.x - playerX) ** 2 + 
            (target.y - playerY) ** 2
        );
    }

    getDistanceToTarget(a, b) {
        return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
    }
    
    /**
     * 统计分析多次测试结果
     */
    calculateStats(runs, scenario) {
        const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
        const std = (arr, mean) => Math.sqrt(arr.reduce((sq, n) => sq + (n - mean) ** 2, 0) / arr.length);
        
        const dpsValues = runs.map(r => r.effectiveDPS);
        const killValues = runs.map(r => r.kills);
        const accuracyValues = runs.map(r => r.accuracy);
        const clearValues = runs.map(r => r.cleared ? 1 : 0);
        const clearTimes = runs.filter(r => r.cleared).map(r => r.clearTime);
        const bossPressureValues = runs.map((r) => r.cleared ? 1 : 1 - (r.remainingBossHpRatio || 0));
        const roomPressureValues = runs.map((r) => {
            const totalEnemies = Math.max(1, r.remainingEnemies + r.kills);
            return r.cleared ? 1 : 1 - (r.remainingEnemies / totalEnemies);
        });
        
        const avgDPS = avg(dpsValues);
        const stdDPS = std(dpsValues, avgDPS);
        const cvDPS = stdDPS / avgDPS; // 变异系数
        
        return {
            scenarioKey: scenario.key,
            scenarioLabel: scenario.label,
            avgDPS,
            stdDPS,
            cvDPS,
            minDPS: Math.min(...dpsValues),
            maxDPS: Math.max(...dpsValues),
            avgKills: avg(killValues),
            avgAccuracy: avg(accuracyValues),
            survivalRate: avg(clearValues),
            avgBossPressure: avg(bossPressureValues),
            avgBossKillTime: clearTimes.length ? avg(clearTimes) : scenario.duration,
            bossKillRate: avg(clearValues),
            avgClearTime: clearTimes.length ? avg(clearTimes) : scenario.duration,
            clearRate: avg(clearValues),
            avgRoomPressure: avg(roomPressureValues)
        };
    }
    
    /**
     * 生成平衡性报告
     */
    buildScenarioSummary(results) {
        const summary = {};
        for (const scenarioKey of this.testConfig.testPatterns) {
            const label = this.getScenarioConfig(scenarioKey).label;
            const sorted = [...results].sort((a, b) => (b.scenarioResults?.[scenarioKey]?.avgDPS || 0) - (a.scenarioResults?.[scenarioKey]?.avgDPS || 0));
            const avgDPS = results.length
                ? results.reduce((sum, result) => sum + (result.scenarioResults?.[scenarioKey]?.avgDPS || 0), 0) / results.length
                : 0;
            summary[scenarioKey] = {
                label,
                avgDPS,
                topWeapon: sorted[0]?.weaponName || '-',
                topDPS: sorted[0]?.scenarioResults?.[scenarioKey]?.avgDPS || 0,
                totalStages: results.length
            };
        }
        return summary;
    }

    getStageBandKey(result) {
        if (result?.stageType === 'super') return 'super';
        return `lv${Math.max(1, result?.stageLevel || 1)}`;
    }

    getStageBandLabel(bandKey) {
        if (bandKey === 'super') return '超武';
        const match = /^lv(\d+)$/.exec(String(bandKey || ''));
        return match ? `Lv.${match[1]}` : String(bandKey || '未知阶段');
    }

    buildStageBandSummary(results) {
        const summary = {};
        for (const result of results) {
            const bandKey = this.getStageBandKey(result);
            if (!summary[bandKey]) {
                summary[bandKey] = {
                    bandKey,
                    label: this.getStageBandLabel(bandKey),
                    count: 0,
                    totalDPS: 0,
                    topWeapon: '-',
                    topDPS: 0
                };
            }
            const band = summary[bandKey];
            band.count += 1;
            band.totalDPS += result.avgDPS || 0;
            if ((result.avgDPS || 0) > band.topDPS) {
                band.topDPS = result.avgDPS || 0;
                band.topWeapon = result.weaponName || '-';
            }
        }
        for (const band of Object.values(summary)) {
            band.avgDPS = band.count > 0 ? band.totalDPS / band.count : 0;
        }
        return summary;
    }

    generateBalanceReport(results) {
        const allDPS = results.map(r => r.avgDPS);
        const avgAllDPS = allDPS.reduce((a, b) => a + b, 0) / allDPS.length;
        const minDPS = Math.min(...allDPS);
        const maxDPS = Math.max(...allDPS);
        const stageBandSummary = this.buildStageBandSummary(results);
        
        const report = {
            summary: {
                totalWeapons: results.length,
                totalStages: results.length,
                totalBaseWeapons: this.getFormalWeaponKeys().length,
                avgDPS: avgAllDPS,
                minDPS,
                maxDPS,
                dpsRange: maxDPS - minDPS,
                minMaxRatio: minDPS / maxDPS,
                balanceScore: this.calculateBalanceScore(results, avgAllDPS),
                scenarioSummary: this.buildScenarioSummary(results),
                stageBandSummary
            },
            tiers: {
                S: [], // 超标 (>1.5倍平均)
                A: [], // 强势 (1.2-1.5倍)
                B: [], // 正常 (0.8-1.2倍)
                C: [], // 弱势 (0.5-0.8倍)
                D: []  // 严重不足 (<0.5倍)
            },
            recommendations: [],
            detailedResults: results
        };
        
        // 分级
        for (const r of results) {
            const globalRatio = r.avgDPS / avgAllDPS;
            const bandKey = this.getStageBandKey(r);
            const bandAvg = stageBandSummary?.[bandKey]?.avgDPS || avgAllDPS;
            const sameBand = results.filter((item) => this.getStageBandKey(item) === bandKey);
            const avgRoomPressure = sameBand.reduce((sum, item) => sum + (item.roomPressure || 0), 0) / Math.max(1, sameBand.length);
            const avgRoomTTKScore = sameBand.reduce((sum, item) => {
                const score = item.roomClearRate > 0
                    ? (this.getScenarioConfig('room').duration / Math.max(0.5, item.roomTTK || this.getScenarioConfig('room').duration))
                    : Math.max(0.2, item.roomPressure || 0);
                return sum + score;
            }, 0) / Math.max(1, sameBand.length);
            const avgBossPressure = sameBand.reduce((sum, item) => sum + (item.bossPressure || 0), 0) / Math.max(1, sameBand.length);
            const avgBossTTKScore = sameBand.reduce((sum, item) => {
                const score = item.bossKillRate > 0
                    ? (this.getScenarioConfig('boss').duration / Math.max(0.5, item.bossTTK || this.getScenarioConfig('boss').duration))
                    : Math.max(0.2, item.bossPressure || 0);
                return sum + score;
            }, 0) / Math.max(1, sameBand.length);
            const roomTTKScore = r.roomClearRate > 0
                ? (this.getScenarioConfig('room').duration / Math.max(0.5, r.roomTTK || this.getScenarioConfig('room').duration))
                : Math.max(0.2, r.roomPressure || 0);
            const roomRatio = ((roomTTKScore / Math.max(0.1, avgRoomTTKScore)) * 0.78) + (((r.roomPressure || 0) / Math.max(0.1, avgRoomPressure)) * 0.22);
            const bossTTKScore = r.bossKillRate > 0
                ? (this.getScenarioConfig('boss').duration / Math.max(0.5, r.bossTTK || this.getScenarioConfig('boss').duration))
                : Math.max(0.2, r.bossPressure || 0);
            const bossRatio = ((bossTTKScore / Math.max(0.1, avgBossTTKScore)) * 0.75) + (((r.bossPressure || 0) / Math.max(0.1, avgBossPressure)) * 0.25);
            const ratio = roomRatio * 0.42 + bossRatio * 0.58;
            r.globalDpsRatio = globalRatio;
            r.stageBandKey = bandKey;
            r.stageBandLabel = this.getStageBandLabel(bandKey);
            r.stageBandAvgDPS = bandAvg;
            r.powerScore = ratio;
            r.dpsRatio = ratio;
            
            if (ratio > 1.25) report.tiers.S.push(r);
            else if (ratio > 1.1) report.tiers.A.push(r);
            else if (ratio > 0.9) report.tiers.B.push(r);
            else if (ratio > 0.75) report.tiers.C.push(r);
            else report.tiers.D.push(r);
        }
        
        // 生成调整建议
        this.generateRecommendations(report, avgAllDPS);
        
        return report;
    }
    
    /**
     * 计算平衡性分数 (0-100)
     */
    calculateBalanceScore(results, avgDPS) {
        let score = 100;
        
        for (const r of results) {
            const ratio = r.dpsRatio || (r.avgDPS / avgDPS);
            
            // 超标惩罚
            if (ratio > 1.25) score -= (ratio - 1.25) * 30;
            // 不足惩罚
            if (ratio < 0.75) score -= (0.75 - ratio) * 24;
            // 高变异惩罚
            if (r.cvDPS > 0.3) score -= (r.cvDPS - 0.3) * 10;
        }
        
        return Math.max(0, Math.min(100, score));
    }
    
    /**
     * 生成调整建议
     */
    generateRecommendations(report, avgDPS) {
        const recs = [];
        
        // 过强武器建议削弱
        for (const weapon of report.tiers.S) {
            const bandAvg = weapon.stageBandAvgDPS || avgDPS;
            const targetDPS = bandAvg * 1.1;
            const adjustment = targetDPS / weapon.avgDPS;
            recs.push({
                weaponKey: weapon.weaponKey,
                weapon: weapon.weaponName,
                stageType: weapon.stageType,
                stageLabel: weapon.stageLabel,
                stageBandLabel: weapon.stageBandLabel,
                type: 'nerf',
                severity: 'high',
                currentDPS: Math.round(weapon.avgDPS),
                targetDPS: Math.round(targetDPS),
                suggestion: `伤害降低 ${Math.round((1 - adjustment) * 100)}% 或 CD增加 ${Math.round(((weapon.avgDPS / targetDPS) - 1) * 100)}%`,
                autoAdjust: { dmgMult: adjustment }
            });
        }
        
        // 过弱武器建议增强
        for (const weapon of report.tiers.D) {
            const bandAvg = weapon.stageBandAvgDPS || avgDPS;
            const targetDPS = bandAvg * 0.9;
            const adjustment = targetDPS / weapon.avgDPS;
            recs.push({
                weaponKey: weapon.weaponKey,
                weapon: weapon.weaponName,
                stageType: weapon.stageType,
                stageLabel: weapon.stageLabel,
                stageBandLabel: weapon.stageBandLabel,
                type: 'buff',
                severity: 'high',
                currentDPS: Math.round(weapon.avgDPS),
                targetDPS: Math.round(targetDPS),
                suggestion: `伤害增加 ${Math.round((adjustment - 1) * 100)}% 或 CD减少 ${Math.round((1 - (weapon.avgDPS / targetDPS)) * 100)}%`,
                autoAdjust: { dmgMult: adjustment }
            });
        }
        
        // 中等调整
        for (const weapon of report.tiers.A) {
            const bandAvg = weapon.stageBandAvgDPS || avgDPS;
            const targetDPS = bandAvg * 1.03;
            const adjustment = targetDPS / weapon.avgDPS;
            recs.push({
                weaponKey: weapon.weaponKey,
                weapon: weapon.weaponName,
                stageType: weapon.stageType,
                stageLabel: weapon.stageLabel,
                stageBandLabel: weapon.stageBandLabel,
                type: 'nerf',
                severity: 'low',
                currentDPS: Math.round(weapon.avgDPS),
                targetDPS: Math.round(targetDPS),
                suggestion: `微调：伤害降低 ${Math.round((1 - adjustment) * 100)}%`,
                autoAdjust: { dmgMult: adjustment }
            });
        }
        
        for (const weapon of report.tiers.C) {
            const bandAvg = weapon.stageBandAvgDPS || avgDPS;
            const targetDPS = bandAvg * 0.97;
            const adjustment = targetDPS / weapon.avgDPS;
            recs.push({
                weaponKey: weapon.weaponKey,
                weapon: weapon.weaponName,
                stageType: weapon.stageType,
                stageLabel: weapon.stageLabel,
                stageBandLabel: weapon.stageBandLabel,
                type: 'buff',
                severity: 'low',
                currentDPS: Math.round(weapon.avgDPS),
                targetDPS: Math.round(targetDPS),
                suggestion: `微调：伤害增加 ${Math.round((adjustment - 1) * 100)}%`,
                autoAdjust: { dmgMult: adjustment }
            });
        }
        
        report.recommendations = recs;
    }
    
    /**
     * 自动应用平衡调整（谨慎使用）
     */
    autoApplyAdjustments(report) {
        const adjustments = [];
        
        for (const rec of report.recommendations) {
            if (rec.severity === 'high') {
                if (rec.stageType === 'super') continue;
                const weapon = WEAPONS[rec.weaponKey];
                if (weapon && rec.autoAdjust) {
                    const oldCoeff = this.getWeaponAttackCoeff(weapon);
                    weapon.attackCoeff = Math.round(oldCoeff * rec.autoAdjust.dmgMult * 1000) / 1000;
                    adjustments.push({
                        weapon: rec.weapon,
                        stageLabel: rec.stageLabel,
                        oldDmg: Math.round(oldCoeff * this.getBaseAttackPower()),
                        newDmg: Math.round(weapon.attackCoeff * this.getBaseAttackPower()),
                        change: `${Math.round((weapon.attackCoeff / oldCoeff - 1) * 100)}%`
                    });
                }
            }
        }
        
        console.log('[WeaponBalanceTester] 已自动应用调整:', adjustments);
        return adjustments;
    }
    
    /**
     * 导出报告为JSON
     */
    exportReport(report) {
        const data = JSON.stringify(report, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `weapon_balance_report_${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }
    
    /**
     * 可视化报告（HTML格式）
     */
    buildHTMLReport(report) {
        const escapeHtml = (value) => String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        const fmt = (value, digits = 0) => Number.isFinite(value) ? value.toFixed(digits) : '-';
        const fmtPct = (value, digits = 0) => Number.isFinite(value) ? `${(value * 100).toFixed(digits)}%` : '-';
        const stageOrder = ['lv1', 'lv2', 'lv3', 'lv4', 'lv5', 'lv6', 'lv7', 'lv8', 'super'];
        const stageBands = stageOrder
            .map((key) => {
                const band = report.summary.stageBandSummary?.[key];
                if (!band) return null;
                const rows = (report.detailedResults || [])
                    .filter((item) => item.stageBandKey === key)
                    .sort((a, b) => (b.avgDPS || 0) - (a.avgDPS || 0));
                return { ...band, rows };
            })
            .filter(Boolean);
        const topOverall = [...(report.detailedResults || [])]
            .sort((a, b) => (b.avgDPS || 0) - (a.avgDPS || 0))
            .slice(0, 12);
        const groupedRecommendations = {
            high: (report.recommendations || []).filter((item) => item.severity === 'high'),
            low: (report.recommendations || []).filter((item) => item.severity === 'low')
        };

        return `
<!DOCTYPE html>
<html>
<head>
    <title>武器平衡性报告</title>
    <style>
        :root {
            --bg: #101521;
            --panel: #192233;
            --panel-2: #202c41;
            --line: #31415d;
            --text: #eef4ff;
            --muted: #9fb0cb;
            --accent: #7cc7ff;
            --good: #58d68d;
            --warn: #f4c56a;
            --bad: #ff7b72;
        }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: Arial, sans-serif; padding: 24px; background: linear-gradient(180deg, #0d1420 0%, #131c2b 100%); color: var(--text); }
        h1, h2, h3 { margin: 0; }
        .page { max-width: 1560px; margin: 0 auto; }
        .hero { display: grid; grid-template-columns: 280px 1fr; gap: 18px; margin-bottom: 18px; }
        .score-panel, .summary-panel, .section, .ranking-card, .recommendation-card { background: var(--panel); border: 1px solid var(--line); border-radius: 16px; box-shadow: 0 12px 30px rgba(0,0,0,0.22); }
        .score-panel { padding: 20px; display: flex; flex-direction: column; justify-content: center; align-items: center; }
        .score-value { font-size: 56px; font-weight: 700; color: ${report.summary.balanceScore > 70 ? 'var(--good)' : report.summary.balanceScore > 45 ? 'var(--warn)' : 'var(--bad)'}; }
        .score-caption { margin-top: 8px; color: var(--muted); font-size: 14px; text-align: center; }
        .summary-panel { padding: 20px; }
        .summary-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 16px; }
        .metric { background: var(--panel-2); border: 1px solid var(--line); border-radius: 12px; padding: 12px 14px; }
        .metric-label { color: var(--muted); font-size: 12px; margin-bottom: 6px; }
        .metric-value { font-size: 22px; font-weight: 700; }
        .chips { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
        .chip { padding: 6px 10px; border-radius: 999px; background: #263550; color: #dce8ff; font-size: 12px; border: 1px solid #35507a; }
        .section { padding: 18px; margin-bottom: 18px; }
        .section-head { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; margin-bottom: 14px; }
        .section-note { color: var(--muted); font-size: 13px; }
        .overview-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
        .ranking-list { display: grid; gap: 10px; }
        .ranking-card { padding: 12px 14px; background: var(--panel-2); }
        .ranking-topline { display: flex; justify-content: space-between; gap: 12px; font-size: 15px; font-weight: 700; }
        .ranking-subline { margin-top: 6px; color: var(--muted); font-size: 12px; }
        .stage-grid { display: grid; gap: 16px; }
        .stage-block { background: var(--panel-2); border: 1px solid var(--line); border-radius: 14px; overflow: hidden; }
        .stage-header { padding: 14px 16px; border-bottom: 1px solid var(--line); display: flex; justify-content: space-between; align-items: center; gap: 12px; }
        .stage-header-main { display: flex; flex-direction: column; gap: 4px; }
        .stage-header-sub { font-size: 12px; color: var(--muted); }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 13px; text-align: left; vertical-align: top; }
        th { color: var(--muted); background: rgba(255,255,255,0.03); font-weight: 600; }
        tr:last-child td { border-bottom: none; }
        .rank { width: 60px; color: var(--accent); font-weight: 700; }
        .delta-good { color: var(--good); }
        .delta-bad { color: var(--bad); }
        .delta-neutral { color: var(--muted); }
        .tag { display: inline-block; padding: 3px 8px; border-radius: 999px; font-size: 12px; border: 1px solid var(--line); background: #23314b; color: #dbe7ff; }
        .rec-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        .recommendation-card { padding: 14px 16px; background: var(--panel-2); }
        .recommendation-card h3 { margin-bottom: 10px; }
        .recommendation-item { padding: 10px 0; border-top: 1px solid rgba(255,255,255,0.08); }
        .recommendation-item:first-child { border-top: none; padding-top: 0; }
        .rec-topline { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 4px; }
        .rec-meta { color: var(--muted); font-size: 12px; margin-bottom: 4px; }
        .rec-text { font-size: 13px; line-height: 1.55; }
        .buff { color: var(--good); }
        .nerf { color: var(--bad); }
        @media (max-width: 1100px) {
            .hero, .overview-grid, .summary-grid, .rec-grid { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="page">
        <h1>武器平衡性阶段报告</h1>
        <div class="hero">
            <div class="score-panel">
                <div class="score-value">${Math.round(report.summary.balanceScore)}/100</div>
                <div class="score-caption">当前分数只用于提示“阶段内离散度”，不是强度高低排行榜。</div>
            </div>
            <div class="summary-panel">
                <h2>总览</h2>
                <div class="summary-grid">
                    <div class="metric">
                        <div class="metric-label">测试阶段数</div>
                        <div class="metric-value">${report.summary.totalStages}</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">基础武器数</div>
                        <div class="metric-value">${report.summary.totalBaseWeapons}</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">全局平均 DPS</div>
                        <div class="metric-value">${fmt(report.summary.avgDPS)}</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">普通房平均 DPS</div>
                        <div class="metric-value">${fmt(report.summary.scenarioSummary.room?.avgDPS)}</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">Boss 平均 DPS</div>
                        <div class="metric-value">${fmt(report.summary.scenarioSummary.boss?.avgDPS)}</div>
                    </div>
                    <div class="metric">
                        <div class="metric-label">全局 DPS 范围</div>
                        <div class="metric-value">${fmt(report.summary.minDPS)} - ${fmt(report.summary.maxDPS)}</div>
                    </div>
                </div>
                <div class="chips">
                    <span class="chip">普通房 Top: ${escapeHtml(report.summary.scenarioSummary.room?.topWeapon || '-')}</span>
                    <span class="chip">Boss Top: ${escapeHtml(report.summary.scenarioSummary.boss?.topWeapon || '-')}</span>
                    <span class="chip">最低/最高比: ${fmtPct(report.summary.minMaxRatio, 1)}</span>
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-head">
                <h2>全局 Top 12</h2>
                <div class="section-note">这里只看绝对 DPS，方便快速定位离谱点；是否超模请以下面的“同阶段排名”作为准绳。</div>
            </div>
            <div class="overview-grid">
                ${topOverall.map((item, index) => `
                    <div class="ranking-card">
                        <div class="ranking-topline">
                            <span>#${index + 1} ${escapeHtml(item.weaponName)}</span>
                            <span>${fmt(item.avgDPS)}</span>
                        </div>
                        <div class="ranking-subline">
                            阶段内倍率 ${fmtPct(item.dpsRatio, 0)} | 普通房 ${fmt(item.roomDPS)} | Boss ${fmt(item.bossDPS)} | ${escapeHtml(item.roleProfile || '-')}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="section">
            <div class="section-head">
                <h2>按等级排名</h2>
                <div class="section-note">每个区块只和同一等级或同一超武段比较。阶段内偏差为相对该阶段平均值的偏移。</div>
            </div>
            <div class="stage-grid">
                ${stageBands.map((band) => `
                    <div class="stage-block">
                        <div class="stage-header">
                            <div class="stage-header-main">
                                <h3>${escapeHtml(band.label)}</h3>
                                <div class="stage-header-sub">阶段样本 ${band.count} 个 | 阶段平均 DPS ${fmt(band.avgDPS)} | 阶段 Top ${escapeHtml(band.topWeapon)}</div>
                            </div>
                            <span class="tag">Top ${fmt(band.topDPS)}</span>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th class="rank">排名</th>
                                    <th>武器</th>
                                    <th>总 DPS</th>
                                    <th>普通房</th>
                                    <th>Boss</th>
                                    <th>阶段内倍率</th>
                                    <th>阶段内偏差</th>
                                    <th>定位</th>
                                    <th>分级</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${band.rows.map((item, index) => {
                                    const delta = (item.dpsRatio || 0) - 1;
                                    const deltaClass = delta > 0.08 ? 'delta-bad' : delta < -0.08 ? 'delta-good' : 'delta-neutral';
                                    const tier = Object.entries(report.tiers).find(([, list]) => list.includes(item))?.[0] || '-';
                                    return `
                                        <tr>
                                            <td class="rank">#${index + 1}</td>
                                            <td>${escapeHtml(item.weaponName)}</td>
                                            <td>${fmt(item.avgDPS)}</td>
                                            <td>${fmt(item.roomDPS)}</td>
                                            <td>${fmt(item.bossDPS)}</td>
                                            <td>${fmtPct(item.dpsRatio, 0)}</td>
                                            <td class="${deltaClass}">${delta >= 0 ? '+' : ''}${fmtPct(delta, 0)}</td>
                                            <td>${escapeHtml(item.roleProfile || '-')}</td>
                                            <td><span class="tag">${tier}</span></td>
                                        </tr>
                                    `;
                                }).join('')}
                            </tbody>
                        </table>
                    </div>
                `).join('')}
            </div>
        </div>

        <div class="section">
            <div class="section-head">
                <h2>完整优化建议</h2>
                <div class="section-note">高优先级建议用于直接改平衡；低优先级建议用于微调。目标 DPS 已按同阶段平均值推算，不再混用全局平均。</div>
            </div>
            <div class="rec-grid">
                <div class="recommendation-card">
                    <h3>高优先级</h3>
                    ${(groupedRecommendations.high.length ? groupedRecommendations.high : [{ weapon: '无', suggestion: '当前没有高优先级建议。' }]).map((rec) => `
                        <div class="recommendation-item">
                            <div class="rec-topline">
                                <strong>${escapeHtml(rec.weapon)}</strong>
                                <span class="${rec.type === 'nerf' ? 'nerf' : 'buff'}">${rec.type === 'nerf' ? '削弱' : '增强'}</span>
                            </div>
                            <div class="rec-meta">${escapeHtml(rec.stageBandLabel || rec.stageLabel || '-')} | 当前 ${fmt(rec.currentDPS)} → 目标 ${fmt(rec.targetDPS)}</div>
                            <div class="rec-text">${escapeHtml(rec.suggestion || '')}</div>
                        </div>
                    `).join('')}
                </div>
                <div class="recommendation-card">
                    <h3>低优先级</h3>
                    ${(groupedRecommendations.low.length ? groupedRecommendations.low : [{ weapon: '无', suggestion: '当前没有低优先级建议。' }]).map((rec) => `
                        <div class="recommendation-item">
                            <div class="rec-topline">
                                <strong>${escapeHtml(rec.weapon)}</strong>
                                <span class="${rec.type === 'nerf' ? 'nerf' : 'buff'}">${rec.type === 'nerf' ? '削弱' : '增强'}</span>
                            </div>
                            <div class="rec-meta">${escapeHtml(rec.stageBandLabel || rec.stageLabel || '-')} | 当前 ${fmt(rec.currentDPS)} → 目标 ${fmt(rec.targetDPS)}</div>
                            <div class="rec-text">${escapeHtml(rec.suggestion || '')}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>

        <div class="section">
            <div class="section-head">
                <h2>分级统计</h2>
                <div class="section-note">这里的 S/B/C/D 是按“同阶段内偏离度”算的，不代表跨等级强度。</div>
            </div>
            <div class="overview-grid">
                ${Object.entries(report.tiers).map(([tier, items]) => `
                    <div class="ranking-card">
                        <div class="ranking-topline">
                            <span>${tier} 级</span>
                            <span>${items.length}</span>
                        </div>
                        <div class="ranking-subline">
                            ${items.slice(0, 3).map((item) => escapeHtml(item.weaponName)).join(' / ') || '无'}
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    </div>
</body>
</html>`;
    }

    generateHTMLReport(report) {
        const html = this.buildHTMLReport(report);
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `weapon_balance_report_${Date.now()}.html`;
        a.click();
        
        URL.revokeObjectURL(url);
    }
}

window.WeaponBalanceTester = WeaponBalanceTester;
window.getWeaponBalanceTester = window.getWeaponBalanceTester || async function () {
    if (!window.weaponBalanceTester && window.WeaponBalanceTester) {
        window.weaponBalanceTester = new window.WeaponBalanceTester();
    }
    return window.weaponBalanceTester || null;
};
