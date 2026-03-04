/**
 * BattleSimulator - 战斗模拟器
 * 自动化平衡测试工具
 * v0.23
 */

class BattleSimulator {
    constructor() {
        this.results = [];
        this.config = {
            maxSimulationTime: 60,  // 最大模拟时间（秒）
            tickRate: 60,           // 每秒tick数
            randomSeed: null        // 随机种子
        };
    }

    /**
     * 模拟单场战斗
     */
    simulateBattle(playerConfig, waveConfig, options = {}) {
        const sim = new Simulation(playerConfig, waveConfig, {
            ...this.config,
            ...options
        });
        
        return sim.run();
    }

    /**
     * 批量测试武器
     */
    async testWeaponBalance(weaponId, iterations = 100, difficulty = 'normal') {
        const results = [];
        
        for (let i = 0; i < iterations; i++) {
            const result = this.simulateBattle(
                { weapon: weaponId, items: [] },
                this.generateWave(difficulty, i)
            );
            results.push(result);
        }
        
        return this.analyzeResults(results, weaponId);
    }

    /**
     * 批量测试道具
     */
    async testItemBalance(itemId, iterations = 50) {
        const results = [];
        
        for (let i = 0; i < iterations; i++) {
            const result = this.simulateBattle(
                { weapon: 'whip', items: [itemId] },
                this.generateWave('normal', i)
            );
            results.push(result);
        }
        
        return this.analyzeResults(results, itemId);
    }

    /**
     * 生成敌人波次
     */
    generateWave(difficulty, seed) {
        const configs = {
            easy: { enemyCount: 10, enemyTier: 1, boss: false },
            normal: { enemyCount: 20, enemyTier: 2, boss: false },
            hard: { enemyCount: 30, enemyTier: 3, boss: true }
        };
        
        return configs[difficulty] || configs.normal;
    }

    /**
     * 分析结果
     */
    analyzeResults(results, testId) {
        const survived = results.filter(r => r.survived).length;
        const deaths = results.length - survived;
        
        const survivalTimes = results.map(r => r.duration);
        const damageDealt = results.map(r => r.damageDealt);
        const damageTaken = results.map(r => r.damageTaken);
        
        const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
        const min = arr => Math.min(...arr);
        const max = arr => Math.max(...arr);
        
        const analysis = {
            testId,
            iterations: results.length,
            
            // 生存统计
            survival: {
                count: survived,
                rate: survived / results.length,
                deathCount: deaths
            },
            
            // 时间统计
            time: {
                avg: avg(survivalTimes),
                min: min(survivalTimes),
                max: max(survivalTimes)
            },
            
            // 伤害统计
            damage: {
                dealt: {
                    avg: avg(damageDealt),
                    min: min(damageDealt),
                    max: max(damageDealt)
                },
                taken: {
                    avg: avg(damageTaken),
                    min: min(damageTaken),
                    max: max(damageTaken)
                }
            },
            
            // 平衡评分
            balance: this.calculateBalanceScore(results),
            
            // 建议
            recommendations: this.generateRecommendations(results, testId)
        };
        
        return analysis;
    }

    /**
     * 计算平衡评分
     */
    calculateBalanceScore(results) {
        const survivalRate = results.filter(r => r.survived).length / results.length;
        const idealSurvival = 0.7; // 理想生存率 70%
        
        // 生存率评分
        let survivalScore = 1 - Math.abs(survivalRate - idealSurvival) * 2;
        survivalScore = Math.max(0, Math.min(1, survivalScore));
        
        // 时间方差评分（方差小说明稳定）
        const times = results.map(r => r.duration);
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
        const variance = times.reduce((sum, t) => sum + Math.pow(t - avgTime, 2), 0) / times.length;
        const stabilityScore = Math.max(0, 1 - variance / 100);
        
        // 综合评分
        const overall = (survivalScore * 0.6 + stabilityScore * 0.4) * 100;
        
        return {
            overall: Math.round(overall),
            survival: Math.round(survivalScore * 100),
            stability: Math.round(stabilityScore * 100),
            grade: this.scoreToGrade(overall)
        };
    }

    /**
     * 分数转等级
     */
    scoreToGrade(score) {
        if (score >= 90) return 'S';
        if (score >= 80) return 'A';
        if (score >= 70) return 'B';
        if (score >= 60) return 'C';
        if (score >= 50) return 'D';
        return 'F';
    }

    /**
     * 生成建议
     */
    generateRecommendations(results, testId) {
        const recommendations = [];
        const analysis = {
            survivalRate: results.filter(r => r.survived).length / results.length,
            avgTime: results.reduce((sum, r) => sum + r.duration, 0) / results.length,
            avgDamage: results.reduce((sum, r) => sum + r.damageDealt, 0) / results.length
        };
        
        // 生存率建议
        if (analysis.survivalRate > 0.9) {
            recommendations.push({
                type: 'too_strong',
                severity: 'high',
                message: `${testId} 过强，建议削弱伤害或增加冷却`
            });
        } else if (analysis.survivalRate < 0.3) {
            recommendations.push({
                type: 'too_weak',
                severity: 'high',
                message: `${testId} 过弱，建议增强伤害或减少冷却`
            });
        }
        
        // 时间建议
        if (analysis.avgTime < 10) {
            recommendations.push({
                type: 'too_fast',
                severity: 'medium',
                message: '战斗结束过快，建议增加敌人血量'
            });
        } else if (analysis.avgTime > 50) {
            recommendations.push({
                type: 'too_slow',
                severity: 'medium',
                message: '战斗时间过长，建议增加伤害输出'
            });
        }
        
        return recommendations;
    }

    /**
     * 生成报告
     */
    generateReport(tests) {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                totalTests: tests.length,
                passed: tests.filter(t => t.balance.grade !== 'F').length,
                failed: tests.filter(t => t.balance.grade === 'F').length
            },
            tests: tests,
            overallGrade: this.calculateOverallGrade(tests)
        };
        
        return report;
    }

    calculateOverallGrade(tests) {
        const scores = tests.map(t => t.balance.overall);
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        return this.scoreToGrade(avg);
    }
}

/**
 * 单次模拟
 */
class Simulation {
    constructor(playerConfig, waveConfig, options) {
        this.playerConfig = playerConfig;
        this.waveConfig = waveConfig;
        this.options = options;
        
        this.time = 0;
        this.dt = 1 / options.tickRate;
        this.maxTime = options.maxSimulationTime;
        
        this.player = null;
        this.enemies = [];
        this.projectiles = [];
        
        this.stats = {
            damageDealt: 0,
            damageTaken: 0,
            enemiesKilled: 0
        };
    }

    run() {
        this.initialize();
        
        while (this.time < this.maxTime) {
            this.update();
            
            // 检查结束条件
            if (this.player.hp <= 0) {
                return this.generateResult(false);
            }
            
            if (this.enemies.length === 0) {
                return this.generateResult(true);
            }
            
            this.time += this.dt;
        }
        
        // 超时，判定为失败
        return this.generateResult(false);
    }

    initialize() {
        // 初始化玩家
        this.player = {
            hp: 100,
            maxHp: 100,
            damage: this.getWeaponDamage(this.playerConfig.weapon),
            attackSpeed: this.getWeaponAttackSpeed(this.playerConfig.weapon),
            x: 0,
            y: 0
        };
        
        // 应用道具效果
        for (const itemId of this.playerConfig.items) {
            this.applyItemEffect(itemId);
        }
        
        // 生成敌人
        for (let i = 0; i < this.waveConfig.enemyCount; i++) {
            this.enemies.push({
                hp: 20 * this.waveConfig.enemyTier,
                damage: 5 * this.waveConfig.enemyTier,
                x: Math.random() * 400 - 200,
                y: Math.random() * 400 - 200
            });
        }
    }

    update() {
        // 简化模拟：每tick处理战斗
        
        // 玩家攻击
        const playerDPS = this.player.damage * this.player.attackSpeed;
        const damageThisTick = playerDPS * this.dt;
        
        // 分配到敌人
        if (this.enemies.length > 0) {
            const damagePerEnemy = damageThisTick / this.enemies.length;
            
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                const enemy = this.enemies[i];
                enemy.hp -= damagePerEnemy;
                this.stats.damageDealt += damagePerEnemy;
                
                if (enemy.hp <= 0) {
                    this.enemies.splice(i, 1);
                    this.stats.enemiesKilled++;
                }
            }
        }
        
        // 敌人攻击
        const enemyDPS = this.enemies.reduce((sum, e) => sum + e.damage, 0);
        const damageToPlayer = enemyDPS * this.dt * 0.3; // 假设玩家躲避70%攻击
        this.player.hp -= damageToPlayer;
        this.stats.damageTaken += damageToPlayer;
    }

    generateResult(survived) {
        return {
            survived,
            duration: this.time,
            damageDealt: this.stats.damageDealt,
            damageTaken: this.stats.damageTaken,
            enemiesKilled: this.stats.enemiesKilled,
            playerHp: this.player.hp
        };
    }

    getWeaponDamage(weaponId) {
        const damages = {
            'whip': 35,
            'magic_wand': 20,
            'knife': 15
        };
        return damages[weaponId] || 10;
    }

    getWeaponAttackSpeed(weaponId) {
        const speeds = {
            'whip': 0.83,  // 1/1.2
            'magic_wand': 1.0,
            'knife': 1.25  // 1/0.8
        };
        return speeds[weaponId] || 1.0;
    }

    applyItemEffect(itemId) {
        // 简化的道具效果
        const effects = {
            'heart_container': () => { this.player.maxHp += 1; this.player.hp += 1; },
            'spinach': () => { this.player.damage *= 1.1; }
        };
        
        if (effects[itemId]) {
            effects[itemId]();
        }
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BattleSimulator, Simulation };
} else {
    window.BattleSimulator = BattleSimulator;
    window.Simulation = Simulation;
}
