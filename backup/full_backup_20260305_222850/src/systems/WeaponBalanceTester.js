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
        this.simulationRuns = 100;    // 每武器模拟次数
        
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
            enemyDensity: 50,      // 敌人数量
            enemyTypes: ['chick', 'mouse', 'snail'], // 混合敌人类型
            roomSize: { w: 800, h: 600 },
            testPatterns: ['crowd', 'single', 'mixed'] // 测试模式
        };
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
        const runs = [];
        
        for (let i = 0; i < this.simulationRuns; i++) {
            const run = this.simulateCombat(weaponKey);
            runs.push(run);
        }
        
        // 统计分析
        const stats = this.calculateStats(runs);
        
        return {
            weaponKey,
            weaponName: weapon.name,
            type: weapon.type,
            subtype: weapon.subtype,
            baseDmg: weapon.dmg,
            baseCD: weapon.cd,
            theoreticalDPS: weapon.dmg / weapon.cd,
            ...stats,
            runs
        };
    }
    
    /**
     * 模拟单次战斗
     */
    simulateCombat(weaponKey) {
        const weapon = WEAPONS[weaponKey];
        const enemies = this.spawnTestEnemies();
        
        let totalDamage = 0;
        let kills = 0;
        let hits = 0;
        let misses = 0;
        let effectiveDPS = 0;
        
        let time = 0;
        let cooldown = 0;
        
        // 战斗模拟主循环
        while (time < this.testDuration && enemies.length > 0) {
            const dt = 0.1; // 100ms timestep
            time += dt;
            cooldown -= dt;
            
            // 武器攻击
            if (cooldown <= 0) {
                const attack = this.simulateAttack(weapon, enemies);
                totalDamage += attack.damage;
                hits += attack.hits;
                misses += attack.misses;
                kills += attack.kills;
                
                cooldown = weapon.cd;
            }
            
            // 更新敌人位置（简单AI）
            this.updateEnemies(enemies, dt);
        }
        
        effectiveDPS = totalDamage / this.testDuration;
        
        return {
            totalDamage,
            kills,
            hits,
            misses,
            accuracy: hits / (hits + misses) || 0,
            effectiveDPS,
            clearTime: time,
            timeAlive: this.testDuration - time // 剩余时间（负数表示超时）
        };
    }
    
    /**
     * 模拟单次攻击
     */
    simulateAttack(weapon, enemies) {
        let damage = 0;
        let hits = 0;
        let misses = 0;
        let kills = 0;
        
        const dmg = weapon.dmg;
        const range = weapon.range || 200;
        
        // 根据武器类型计算命中
        switch (weapon.type) {
            case 'melee':
                // 近战：扇形范围命中
                const meleeTargets = this.getTargetsInArc(enemies, range, weapon.arcAngle || 120);
                for (const target of meleeTargets) {
                    if (this.hitCheck(weapon, target)) {
                        hits++;
                        const actualDmg = this.calculateDamage(dmg, weapon, target);
                        damage += actualDmg;
                        target.hp -= actualDmg;
                        if (target.hp <= 0) kills++;
                    } else {
                        misses++;
                    }
                }
                break;
                
            case 'proj':
                // 投射物
                const projCount = weapon.count || 1;
                for (let i = 0; i < projCount; i++) {
                    const target = this.getNearestTarget(enemies);
                    if (target && this.getDistance(target) <= range) {
                        if (this.hitCheck(weapon, target)) {
                            hits++;
                            const actualDmg = this.calculateDamage(dmg, weapon, target);
                            damage += actualDmg;
                            target.hp -= actualDmg;
                            if (target.hp <= 0) kills++;
                            
                            // 穿透处理
                            if (weapon.pierce) {
                                // 简化：穿透额外造成部分伤害
                                damage += actualDmg * 0.3 * weapon.pierce;
                            }
                        } else {
                            misses++;
                        }
                    } else {
                        misses++;
                    }
                }
                break;
                
            case 'orbit':
                // 环绕物：持续范围伤害
                const orbitTargets = this.getTargetsInRadius(enemies, range);
                for (const target of orbitTargets) {
                    hits++;
                    const actualDmg = this.calculateDamage(dmg, weapon, target) * 0.5; // 环绕物伤害频率高但单次低
                    damage += actualDmg;
                    target.hp -= actualDmg;
                    if (target.hp <= 0) kills++;
                }
                break;
                
            case 'instant':
                // 即时攻击（闪电等）
                const instantTarget = this.getNearestTarget(enemies);
                if (instantTarget && this.getDistance(instantTarget) <= range) {
                    hits++;
                    const actualDmg = this.calculateDamage(dmg, weapon, instantTarget);
                    damage += actualDmg;
                    instantTarget.hp -= actualDmg;
                    if (instantTarget.hp <= 0) kills++;
                    
                    // 连锁闪电
                    if (weapon.chain) {
                        damage += actualDmg * weapon.chain * 0.6; // 衰减
                    }
                } else {
                    misses++;
                }
                break;
                
            case 'area':
                // 区域攻击（圣水）
                const areaTargets = this.getTargetsInRadius(enemies, range);
                for (const target of areaTargets) {
                    hits++;
                    const actualDmg = this.calculateDamage(dmg, weapon, target);
                    damage += actualDmg;
                    target.hp -= actualDmg;
                    if (target.hp <= 0) kills++;
                }
                break;
                
            case 'aura':
                // 光环（辉耀）
                const auraTargets = this.getTargetsInRadius(enemies, range);
                for (const target of auraTargets) {
                    hits++;
                    const actualDmg = this.calculateDamage(dmg, weapon, target);
                    damage += actualDmg;
                    target.hp -= actualDmg;
                    if (target.hp <= 0) kills++;
                }
                break;
        }
        
        return { damage, hits, misses, kills };
    }
    
    /**
     * 生成测试敌人
     */
    spawnTestEnemies() {
        const enemies = [];
        const types = this.testConfig.enemyTypes;
        
        for (let i = 0; i < this.testConfig.enemyDensity; i++) {
            const typeKey = types[Math.floor(Math.random() * types.length)];
            const type = ENEMY_TYPES[typeKey];
            
            enemies.push({
                x: Math.random() * this.testConfig.roomSize.w,
                y: Math.random() * this.testConfig.roomSize.h,
                hp: type.hp,
                maxHp: type.hp,
                speed: type.speed,
                type: typeKey,
                radius: type.size || 20
            });
        }
        
        return enemies;
    }
    
    /**
     * 更新敌人位置
     */
    updateEnemies(enemies, dt) {
        // 简化：敌人向中心移动
        const centerX = this.testConfig.roomSize.w / 2;
        const centerY = this.testConfig.roomSize.h / 2;
        
        for (const e of enemies) {
            if (e.hp <= 0) continue;
            
            const dx = centerX - e.x;
            const dy = centerY - e.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 10) {
                e.x += (dx / dist) * e.speed * dt;
                e.y += (dy / dist) * e.speed * dt;
            }
        }
        
        // 移除死亡敌人
        for (let i = enemies.length - 1; i >= 0; i--) {
            if (enemies[i].hp <= 0) {
                enemies.splice(i, 1);
            }
        }
    }
    
    /**
     * 命中检查
     */
    hitCheck(weapon, target) {
        // 基础命中率95%，根据武器类型调整
        let hitChance = 0.95;
        
        if (weapon.subtype === 'homing') hitChance = 0.98;
        if (weapon.subtype === 'rapid') hitChance = 0.90;
        if (weapon.type === 'melee') hitChance = 0.98;
        
        return Math.random() < hitChance;
    }
    
    /**
     * 计算实际伤害
     */
    calculateDamage(baseDmg, weapon, target) {
        let dmg = baseDmg;
        
        // 暴击
        if (Math.random() < 0.1) {
            dmg *= 1.5;
        }
        
        // 伤害浮动
        dmg *= (0.9 + Math.random() * 0.2);
        
        return Math.floor(dmg);
    }
    
    /**
     * 辅助函数：获取扇形范围内目标
     */
    getTargetsInArc(enemies, range, angle) {
        // 简化：返回范围内随机3个目标
        const inRange = enemies.filter(e => this.getDistance(e) <= range);
        return inRange.slice(0, 3);
    }
    
    /**
     * 辅助函数：获取圆形范围内目标
     */
    getTargetsInRadius(enemies, radius) {
        return enemies.filter(e => this.getDistance(e) <= radius);
    }
    
    /**
     * 辅助函数：获取最近目标
     */
    getNearestTarget(enemies) {
        let nearest = null;
        let minDist = Infinity;
        
        for (const e of enemies) {
            if (e.hp <= 0) continue;
            const dist = this.getDistance(e);
            if (dist < minDist) {
                minDist = dist;
                nearest = e;
            }
        }
        
        return nearest;
    }
    
    /**
     * 辅助函数：获取距离（简化：以中心为原点）
     */
    getDistance(target) {
        const playerX = this.testConfig.roomSize.w / 2;
        const playerY = this.testConfig.roomSize.h / 2;
        return Math.sqrt(
            (target.x - playerX) ** 2 + 
            (target.y - playerY) ** 2
        );
    }
    
    /**
     * 统计分析多次测试结果
     */
    calculateStats(runs) {
        const avg = (arr) => arr.reduce((a, b) => a + b, 0) / arr.length;
        const std = (arr, mean) => Math.sqrt(arr.reduce((sq, n) => sq + (n - mean) ** 2, 0) / arr.length);
        
        const dpsValues = runs.map(r => r.effectiveDPS);
        const killValues = runs.map(r => r.kills);
        const accuracyValues = runs.map(r => r.accuracy);
        
        const avgDPS = avg(dpsValues);
        const stdDPS = std(dpsValues, avgDPS);
        const cvDPS = stdDPS / avgDPS; // 变异系数
        
        return {
            avgDPS,
            stdDPS,
            cvDPS,
            minDPS: Math.min(...dpsValues),
            maxDPS: Math.max(...dpsValues),
            avgKills: avg(killValues),
            avgAccuracy: avg(accuracyValues),
            survivalRate: runs.filter(r => r.kills >= this.testConfig.enemyDensity).length / runs.length
        };
    }
    
    /**
     * 生成平衡性报告
     */
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
                balanceScore: this.calculateBalanceScore(results, avgAllDPS)
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
                    const oldDmg = weapon.dmg;
                    weapon.dmg = Math.floor(weapon.dmg * rec.autoAdjust.dmgMult);
                    adjustments.push({
                        weapon: rec.weapon,
                        oldDmg,
                        newDmg: weapon.dmg,
                        change: `${Math.round((weapon.dmg / oldDmg - 1) * 100)}%`
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
    </div>
    
    <h2>📊 武器分级</h2>
    ${Object.entries(report.tiers).map(([tier, weapons]) => `
        <div class="tier tier-${tier}">
            <h3>${tier}级 (${weapons.length}个)</h3>
            ${weapons.map(w => `
                <div class="weapon">
                    ${w.weaponName} - DPS: ${Math.round(w.avgDPS)} 
                    (${(w.dpsRatio * 100).toFixed(0)}%)
                    [${w.type}/${w.subtype}]
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

// 全局实例
window.weaponBalanceTester = new WeaponBalanceTester();
