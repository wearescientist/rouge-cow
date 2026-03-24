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
        this.testResults = new Map(); // 武器key -> 测试结果
        this.standardEnemyHP = 100;   // 标准敌人血量
        this.testDuration = 60;       // 单次测试时长(秒)
        this.simulationRuns = 60;     // 每武器模拟次数
        
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
            testPatterns: ['crowd', 'boss', 'mixed'] // 测试模式
        };

        this.enemyProfiles = {
            swarm: { hp: 90, speed: 140, radius: 18, armor: 0.02, tag: 'swarm' },
            bruiser: { hp: 240, speed: 92, radius: 26, armor: 0.08, tag: 'bruiser' },
            elite: { hp: 720, speed: 86, radius: 34, armor: 0.12, tag: 'elite' },
            boss: { hp: 9600, speed: 72, radius: 62, armor: 0.18, tag: 'boss', isBoss: true }
        };

        this.scenarioConfigs = {
            crowd: {
                key: 'crowd',
                label: '怪群',
                weight: 0.4,
                duration: 45,
                roomSize: { w: 860, h: 680 },
                groups: [
                    { profile: 'swarm', count: 26, minRadius: 80, maxRadius: 230 },
                    { profile: 'bruiser', count: 8, minRadius: 130, maxRadius: 280 },
                    { profile: 'elite', count: 2, minRadius: 190, maxRadius: 320 }
                ]
            },
            boss: {
                key: 'boss',
                label: 'Boss',
                weight: 0.35,
                duration: 40,
                roomSize: { w: 920, h: 720 },
                groups: [
                    { profile: 'boss', count: 1, minRadius: 180, maxRadius: 180 }
                ]
            },
            mixed: {
                key: 'mixed',
                label: '混合',
                weight: 0.25,
                duration: 50,
                roomSize: { w: 900, h: 700 },
                groups: [
                    { profile: 'swarm', count: 14, minRadius: 90, maxRadius: 240 },
                    { profile: 'bruiser', count: 6, minRadius: 130, maxRadius: 280 },
                    { profile: 'boss', count: 1, minRadius: 210, maxRadius: 210 }
                ]
            }
        };
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

    getWeaponBaseDamage(weaponKey, level = this.testConfig.weaponLevel || 1) {
        const weapon = WEAPONS[weaponKey];
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
        
        const weapons = Object.keys(WEAPONS);
        const results = [];
        
        for (const weaponKey of weapons) {
            console.log(`[WeaponBalanceTester] 测试武器: ${WEAPONS[weaponKey].name}`);
            const result = await this.testWeapon(weaponKey);
            this.testResults.set(weaponKey, result);
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
    async testWeapon(weaponKey) {
        const weapon = WEAPONS[weaponKey];
        const scenarioResults = {};

        for (const scenarioKey of this.testConfig.testPatterns) {
            const runs = [];
            for (let i = 0; i < this.simulationRuns; i++) {
                runs.push(this.simulateCombat(weaponKey, scenarioKey));
            }
            scenarioResults[scenarioKey] = this.calculateStats(runs, this.getScenarioConfig(scenarioKey));
        }

        const avgDPS = this.getWeightedScenarioMetric(scenarioResults, 'avgDPS');
        const avgKills = this.getWeightedScenarioMetric(scenarioResults, 'avgKills');
        const avgAccuracy = this.getWeightedScenarioMetric(scenarioResults, 'avgAccuracy');
        const survivalRate = this.getWeightedScenarioMetric(scenarioResults, 'survivalRate');
        
        return {
            weaponKey,
            weaponName: weapon.name,
            type: weapon.type,
            subtype: weapon.subtype,
            baseDmg: Math.round(this.getWeaponBaseDamage(weaponKey, 1)),
            baseCD: weapon.cd,
            theoreticalDPS: this.getWeaponBaseDamage(weaponKey, 1) / weapon.cd,
            avgDPS,
            avgKills,
            avgAccuracy,
            survivalRate,
            crowdDPS: scenarioResults.crowd?.avgDPS || 0,
            bossDPS: scenarioResults.boss?.avgDPS || 0,
            mixedDPS: scenarioResults.mixed?.avgDPS || 0,
            roleProfile: this.getRoleProfile(scenarioResults),
            scenarioResults
        };
    }

    getScenarioConfig(scenarioKey) {
        return this.scenarioConfigs[scenarioKey] || this.scenarioConfigs.crowd;
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
        const crowdDPS = scenarioResults.crowd?.avgDPS || 0;
        const bossDPS = scenarioResults.boss?.avgDPS || 0;
        const mixedDPS = scenarioResults.mixed?.avgDPS || 0;
        const peak = Math.max(crowdDPS, bossDPS, 1);

        if (Math.abs(crowdDPS - bossDPS) / peak <= 0.12) return '均衡型';

        if (crowdDPS > bossDPS * 2.1) return '清图型';
        if (bossDPS > crowdDPS * 1.2) return '打王型';
        if (mixedDPS > Math.max(crowdDPS, bossDPS) * 0.95) return '均衡型';
        return crowdDPS >= bossDPS ? '偏清图' : '偏打王';
    }
    
    /**
     * 模拟单次战斗
     */
    simulateCombat(weaponKey, scenarioKey = 'crowd') {
        const weapon = WEAPONS[weaponKey];
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
                const attack = this.simulateAttack(weaponKey, weapon, enemies, scenario);
                totalDamage += attack.damage;
                hits += attack.hits;
                misses += attack.misses;
                kills += attack.kills;
                
                cooldown = this.getAttackInterval(weapon);
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

    getAttackInterval(weapon) {
        if (!weapon) return 0.5;
        if (weapon.type === 'aura') return weapon.tickRate || weapon.cd || 0.2;
        if (weapon.type === 'laser') return weapon.cd || weapon.tickCooldown || 0.25;
        return weapon.cd || 0.5;
    }
    
    /**
     * 模拟单次攻击
     */
    simulateAttack(weaponKey, weapon, enemies, scenario) {
        let damage = 0;
        let hits = 0;
        let misses = 0;
        let kills = 0;
        
        const dmg = this.getWeaponBaseDamage(weaponKey);
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
                            Math.min(weapon.bounce || 0, scenario.key === 'crowd' ? 4 : scenario.key === 'mixed' ? 2 : 1),
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
                            scenario.key === 'crowd' ? 3 : scenario.key === 'mixed' ? 2 : 0,
                            weapon.explodeRadius || 140
                        );
                        for (const splashTarget of splashTargets) {
                            applyHit(splashTarget, actualDmg * 0.74);
                        }
                    }

                    if (weapon.pierce) {
                        const pierceBudget = weapon.pierce >= 99
                            ? (scenario.key === 'crowd' ? 4 : scenario.key === 'mixed' ? 2 : 0)
                            : (scenario.key === 'crowd' ? Math.min(3, weapon.pierce) : scenario.key === 'mixed' ? 1 : 0);
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
                    for (const target of orbitTargets) {
                        const actualDmg = this.calculateDamage(dmg * tickCount * (target.isBoss ? 0.52 : 0.38), weapon, target, scenario);
                        applyHit(target, actualDmg, tickCount);
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
                        Math.min(weapon.chain || 0, scenario.key === 'crowd' ? 6 : scenario.key === 'mixed' ? 3 : 0),
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
                    const areaTargets = this.getTargetsInRadius(enemies, Math.max(100, range * 0.46), scenario);
                    const tickRate = Math.max(0.12, weapon.tickRate || 0.5);
                    const tickCount = Math.max(2, Math.round(Math.min(weapon.duration || 6, 4.4) / tickRate * (scenario.key === 'crowd' ? 0.36 : scenario.key === 'mixed' ? 0.24 : 0.14)));
                    for (const target of areaTargets) {
                        const areaMult = target.isBoss ? 0.32 : 0.44;
                        const actualDmg = this.calculateDamage(dmg * tickCount * areaMult, weapon, target, scenario);
                        applyHit(target, actualDmg, tickCount);
                    }
                }
                break;
                
            case 'aura':
                {
                    const auraTargets = this.getTargetsInRadius(enemies, range, scenario);
                    for (const target of auraTargets) {
                        const auraMult = target.isBoss ? 0.9 : 1.08;
                        const actualDmg = this.calculateDamage(dmg * auraMult, weapon, target, scenario);
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
    spawnTestEnemies(scenarioKey = 'crowd') {
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
        const cap = scenario.key === 'crowd'
            ? Math.max(2, Math.min(6, Math.round(angle / 45)))
            : scenario.key === 'mixed'
                ? Math.max(1, Math.min(4, Math.round(angle / 70)))
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
        const cap = scenario.key === 'crowd' ? 6 : scenario.key === 'mixed' ? 4 : 1;
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
        const cap = scenario.key === 'crowd'
            ? Math.max(2, Math.min(5, Math.round(width / 6)))
            : scenario.key === 'mixed'
                ? Math.max(1, Math.min(3, Math.round(width / 10)))
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
        const bossPressureValues = runs.map(r => 1 - (r.remainingBossHpRatio || 0));
        const clearValues = runs.map(r => r.cleared ? 1 : 0);
        
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
            avgBossPressure: avg(bossPressureValues)
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
                topDPS: sorted[0]?.scenarioResults?.[scenarioKey]?.avgDPS || 0
            };
        }
        return summary;
    }

    generateBalanceReport(results) {
        const allDPS = results.map(r => r.avgDPS);
        const avgAllDPS = allDPS.reduce((a, b) => a + b, 0) / allDPS.length;
        const minDPS = Math.min(...allDPS);
        const maxDPS = Math.max(...allDPS);
        
        const report = {
            summary: {
                totalWeapons: results.length,
                avgDPS: avgAllDPS,
                minDPS,
                maxDPS,
                dpsRange: maxDPS - minDPS,
                minMaxRatio: minDPS / maxDPS,
                balanceScore: this.calculateBalanceScore(results, avgAllDPS),
                scenarioSummary: this.buildScenarioSummary(results)
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
            const ratio = r.avgDPS / avgAllDPS;
            r.dpsRatio = ratio;
            
            if (ratio > 1.5) report.tiers.S.push(r);
            else if (ratio > 1.2) report.tiers.A.push(r);
            else if (ratio > 0.8) report.tiers.B.push(r);
            else if (ratio > 0.5) report.tiers.C.push(r);
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
            const ratio = r.avgDPS / avgDPS;
            
            // 超标惩罚
            if (ratio > 1.5) score -= (ratio - 1.5) * 20;
            // 不足惩罚
            if (ratio < 0.5) score -= (0.5 - ratio) * 20;
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
            const targetDPS = avgDPS * 1.3;
            const adjustment = targetDPS / weapon.avgDPS;
            recs.push({
                weaponKey: weapon.weaponKey,
                weapon: weapon.weaponName,
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
            const targetDPS = avgDPS * 0.7;
            const adjustment = targetDPS / weapon.avgDPS;
            recs.push({
                weaponKey: weapon.weaponKey,
                weapon: weapon.weaponName,
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
            const targetDPS = avgDPS * 1.1;
            const adjustment = targetDPS / weapon.avgDPS;
            recs.push({
                weaponKey: weapon.weaponKey,
                weapon: weapon.weaponName,
                type: 'nerf',
                severity: 'low',
                currentDPS: Math.round(weapon.avgDPS),
                targetDPS: Math.round(targetDPS),
                suggestion: `微调：伤害降低 ${Math.round((1 - adjustment) * 100)}%`,
                autoAdjust: { dmgMult: adjustment }
            });
        }
        
        for (const weapon of report.tiers.C) {
            const targetDPS = avgDPS * 0.9;
            const adjustment = targetDPS / weapon.avgDPS;
            recs.push({
                weaponKey: weapon.weaponKey,
                weapon: weapon.weaponName,
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
                const weapon = WEAPONS[rec.weaponKey];
                if (weapon && rec.autoAdjust) {
                    const oldCoeff = this.getWeaponAttackCoeff(weapon);
                    weapon.attackCoeff = Math.round(oldCoeff * rec.autoAdjust.dmgMult * 1000) / 1000;
                    adjustments.push({
                        weapon: rec.weapon,
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
    generateHTMLReport(report) {
        const html = `
<!DOCTYPE html>
<html>
<head>
    <title>武器平衡性报告</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #1a1a2e; color: #fff; }
        .summary { background: #2a2a4e; padding: 20px; border-radius: 10px; margin-bottom: 20px; }
        .tier { margin: 20px 0; padding: 15px; border-radius: 8px; }
        .tier-S { background: #8b0000; }
        .tier-A { background: #ff6600; }
        .tier-B { background: #228b22; }
        .tier-C { background: #4169e1; }
        .tier-D { background: #483d8b; }
        .weapon { padding: 8px; margin: 5px 0; background: rgba(0,0,0,0.3); border-radius: 4px; }
        .recommendation { padding: 10px; margin: 10px 0; background: #3a3a5e; border-radius: 5px; }
        .nerf { border-left: 4px solid #ff4444; }
        .buff { border-left: 4px solid #44ff44; }
        .score { font-size: 48px; text-align: center; margin: 20px 0; }
        .score-good { color: #44ff44; }
        .score-bad { color: #ff4444; }
    </style>
</head>
<body>
    <h1>🎮 武器平衡性测试报告</h1>
    
    <div class="summary">
        <div class="score ${report.summary.balanceScore > 70 ? 'score-good' : 'score-bad'}">
            ${Math.round(report.summary.balanceScore)}/100
        </div>
        <p>测试武器数: ${report.summary.totalWeapons}</p>
        <p>平均DPS: ${Math.round(report.summary.avgDPS)}</p>
        <p>DPS范围: ${Math.round(report.summary.minDPS)} - ${Math.round(report.summary.maxDPS)}</p>
        <p>最低/最高比: ${(report.summary.minMaxRatio * 100).toFixed(1)}%</p>
        <p>怪群均值: ${Math.round(report.summary.scenarioSummary.crowd?.avgDPS || 0)} | Boss均值: ${Math.round(report.summary.scenarioSummary.boss?.avgDPS || 0)} | 混合均值: ${Math.round(report.summary.scenarioSummary.mixed?.avgDPS || 0)}</p>
    </div>
    
    <h2>📊 武器分级</h2>
    ${Object.entries(report.tiers).map(([tier, weapons]) => `
        <div class="tier tier-${tier}">
            <h3>${tier}级 (${weapons.length}个)</h3>
            ${weapons.map(w => `
                <div class="weapon">
                    ${w.weaponName} - DPS: ${Math.round(w.avgDPS)} 
                    (${(w.dpsRatio * 100).toFixed(0)}%)
                    [${w.type}/${w.subtype}] ${w.roleProfile}
                    <br>怪群:${Math.round(w.crowdDPS || 0)} / Boss:${Math.round(w.bossDPS || 0)} / 混合:${Math.round(w.mixedDPS || 0)}
                </div>
            `).join('')}
        </div>
    `).join('')}
    
    <h2>🔧 调整建议</h2>
    ${report.recommendations.map(rec => `
        <div class="recommendation ${rec.type}">
            <strong>${rec.weapon}</strong> - ${rec.type === 'nerf' ? '削弱' : '增强'} (${rec.severity})
            <br>当前DPS: ${rec.currentDPS} → 目标DPS: ${rec.targetDPS}
            <br>建议: ${rec.suggestion}
        </div>
    `).join('')}
</body>
</html>`;
        
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
