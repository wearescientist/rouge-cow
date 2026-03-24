#!/usr/bin/env node
/**
 * Auto Balance Test - 全自动武器平衡测试
 * v0.26 - 无需浏览器，Node.js直接运行
 * 
 * 使用方法: node scripts/auto-balance-test.js
 */

const fs = require('fs');
const path = require('path');

// 模拟Web Audio API
const mockAudioContext = {
    currentTime: 0,
    createOscillator: () => ({
        frequency: { value: 0, setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
        type: 'sine',
        connect: () => {},
        start: () => {},
        stop: () => {}
    }),
    createGain: () => ({
        gain: { value: 1, setValueAtTime: () => {}, exponentialRampToValueAtTime: () => {} },
        connect: () => {}
    }),
    createBiquadFilter: () => ({
        type: 'lowpass',
        frequency: { value: 1000 },
        connect: () => {}
    }),
    createBuffer: () => ({
        length: 4410,
        getChannelData: () => new Float32Array(4410)
    }),
    createBufferSource: () => ({
        buffer: null,
        connect: () => {},
        start: () => {}
    }),
    destination: {},
    sampleRate: 44100
};

global.window = {
    AudioContext: function() { return mockAudioContext; },
    webkitAudioContext: function() { return mockAudioContext; }
};
global.AudioContext = global.window.AudioContext;
global.webkitAudioContext = global.window.webkitAudioContext;

// 从index.html提取武器数据
function extractWeaponsFromHTML() {
    const indexPath = path.join(__dirname, '..', 'index.html');
    const content = fs.readFileSync(indexPath, 'utf-8');
    
    // 提取WEAPONS对象
    const match = content.match(/const WEAPONS = \{([\s\S]*?)\};/);
    if (!match) {
        console.error('无法找到WEAPONS定义');
        process.exit(1);
    }
    
    // 构建武器数据（简化版，从HTML直接解析）
    const weapons = {};
    const weaponPattern = /(\w+):\s*\{\s*key:\s*['"](\w+)['"],\s*name:\s*['"]([^'"]+)['"],\s*icon:\s*['"]([^'"]+)['"],\s*dmg:\s*(\d+),\s*cd:\s*([\d.]+)/g;
    
    let m;
    while ((m = weaponPattern.exec(content)) !== null) {
        const [_, key, key2, name, icon, dmg, cd] = m;
        
        // 提取更多属性
        const startIdx = m.index;
        const endIdx = content.indexOf('}', startIdx);
        const weaponStr = content.substring(startIdx, endIdx + 1);
        
        const weapon = {
            key: key,
            name: name,
            icon: icon,
            dmg: parseInt(dmg),
            cd: parseFloat(cd),
            range: extractNumber(weaponStr, 'range') || 200,
            type: extractString(weaponStr, 'type') || 'proj',
            subtype: extractString(weaponStr, 'subtype') || 'normal',
            count: extractNumber(weaponStr, 'count') || 1,
            pierce: extractNumber(weaponStr, 'pierce') || 0,
            bounce: extractNumber(weaponStr, 'bounce') || 0,
            chain: extractNumber(weaponStr, 'chain') || 0,
            duration: extractNumber(weaponStr, 'duration') || 0,
            color: extractString(weaponStr, 'color') || '#fff'
        };
        
        weapons[key] = weapon;
    }
    
    return weapons;
}

function extractNumber(str, key) {
    const match = str.match(new RegExp(`${key}:\\s*(\\d+)`));
    return match ? parseInt(match[1]) : null;
}

function extractString(str, key) {
    const match = str.match(new RegExp(`${key}:\\s*['"]([^'"]+)['"]`));
    return match ? match[1] : null;
}

// 模拟敌人数据
const ENEMY_TYPES = {
    chick: { name: '变异小鸡', hp: 12, speed: 140, size: 24 },
    mouse: { name: '感染老鼠', hp: 10, speed: 160, size: 20 },
    snail: { name: '寄生蜗牛', hp: 25, speed: 50, size: 28 },
    bat: { name: '蝙蝠', hp: 10, speed: 180, size: 20 }
};

// 武器平衡测试器
class WeaponBalanceTester {
    constructor() {
        this.WEAPONS = extractWeaponsFromHTML();
        this.testConfig = {
            simulationRuns: 100,
            testDuration: 60,
            enemyDensity: 50,
            roomSize: { w: 800, h: 600 }
        };
        this.results = new Map();
    }
    
    async runFullTest() {
        console.log('═'.repeat(60));
        console.log('🎮 AI武器平衡测试系统 v0.26');
        console.log('═'.repeat(60));
        console.log(`测试配置: ${this.testConfig.simulationRuns}次模拟 × ${Object.keys(this.WEAPONS).length}种武器`);
        console.log('');
        
        const weapons = Object.keys(this.WEAPONS);
        const results = [];
        
        for (let i = 0; i < weapons.length; i++) {
            const key = weapons[i];
            process.stdout.write(`\r[${i+1}/${weapons.length}] 测试 ${this.WEAPONS[key].name}... `);
            const result = await this.testWeapon(key);
            this.results.set(key, result);
            results.push(result);
        }
        
        console.log('\n');
        const report = this.generateReport(results);
        this.printReport(report);
        this.saveReport(report);
        
        return report;
    }
    
    async testWeapon(weaponKey) {
        const weapon = this.WEAPONS[weaponKey];
        const runs = [];
        
        for (let i = 0; i < this.testConfig.simulationRuns; i++) {
            const run = this.simulateCombat(weapon);
            runs.push(run);
        }
        
        const stats = this.calculateStats(runs);
        
        return {
            weaponKey,
            weaponName: weapon.name,
            icon: weapon.icon,
            type: weapon.type,
            subtype: weapon.subtype,
            baseDmg: weapon.dmg,
            baseCD: weapon.cd,
            theoreticalDPS: weapon.dmg / weapon.cd,
            ...stats
        };
    }
    
    simulateCombat(weapon) {
        let totalDamage = 0;
        let hits = 0;
        let kills = 0;
        let time = 0;
        let cooldown = 0;
        
        // 生成敌人
        const enemies = [];
        for (let i = 0; i < this.testConfig.enemyDensity; i++) {
            const types = Object.keys(ENEMY_TYPES);
            const typeKey = types[Math.floor(Math.random() * types.length)];
            const type = ENEMY_TYPES[typeKey];
            enemies.push({
                x: Math.random() * this.testConfig.roomSize.w,
                y: Math.random() * this.testConfig.roomSize.h,
                hp: type.hp,
                maxHp: type.hp,
                size: type.size
            });
        }
        
        // v0.26 fix: 持续伤害管理
        // 记录活动的持续伤害效果
        const activeEffects = []; // { type, endTime, lastTick, tickRate, dmg, range }
        
        // 战斗模拟
        while (time < this.testConfig.testDuration && enemies.length > 0) {
            const dt = 0.1;
            time += dt;
            cooldown -= dt;
            
            // 武器攻击
            if (cooldown <= 0) {
                const attack = this.simulateAttack(weapon, enemies, time);
                totalDamage += attack.damage;
                hits += attack.hits;
                kills += attack.kills;
                
                // 添加持续效果
                if (attack.sustainedEffect) {
                    activeEffects.push({
                        ...attack.sustainedEffect,
                        endTime: time + attack.sustainedEffect.duration,
                        lastTick: time
                    });
                }
                
                cooldown = weapon.cd;
            }
            
            // 处理持续伤害
            for (let i = activeEffects.length - 1; i >= 0; i--) {
                const effect = activeEffects[i];
                
                // 检查是否到达tick时间
                if (time - effect.lastTick >= effect.tickRate) {
                    effect.lastTick = time;
                    
                    // 计算此次tick的伤害
                    const targets = this.getTargetsInRadius(enemies, effect.range, 5); // 最多5个目标
                    for (const target of targets) {
                        const actualDmg = effect.dmg * (0.9 + Math.random() * 0.2);
                        totalDamage += actualDmg;
                        hits++;
                        target.hp -= actualDmg;
                        if (target.hp <= 0) kills++;
                    }
                }
                
                // 移除过期效果
                if (time >= effect.endTime) {
                    activeEffects.splice(i, 1);
                }
            }
            
            // 更新敌人
            for (let i = enemies.length - 1; i >= 0; i--) {
                if (enemies[i].hp <= 0) {
                    enemies.splice(i, 1);
                }
            }
        }
        
        return {
            totalDamage,
            kills,
            hits,
            effectiveDPS: totalDamage / this.testConfig.testDuration,
            clearTime: time,
            survivalRate: kills / this.testConfig.enemyDensity
        };
    }
    
    simulateAttack(weapon, enemies, currentTime) {
        let damage = 0;
        let hits = 0;
        let kills = 0;
        let sustainedEffect = null;
        
        const dmg = weapon.dmg;
        const range = weapon.range;
        
        // 根据武器类型计算
        switch (weapon.type) {
            case 'melee':
                // 近战：扇形命中3个
                const meleeTargets = Math.min(3, enemies.length);
                for (let i = 0; i < meleeTargets; i++) {
                    if (Math.random() < 0.98) {
                        hits++;
                        const actualDmg = dmg * (0.9 + Math.random() * 0.2);
                        damage += actualDmg;
                        enemies[i].hp -= actualDmg;
                        if (enemies[i].hp <= 0) kills++;
                    }
                }
                break;
                
            case 'proj':
                // 投射物
                const count = weapon.count || 1;
                for (let c = 0; c < count && enemies.length > 0; c++) {
                    const target = enemies[Math.floor(Math.random() * enemies.length)];
                    let hitChance = 0.95;
                    if (weapon.subtype === 'homing') hitChance = 0.98;
                    if (weapon.subtype === 'rapid') hitChance = 0.90;
                    
                    if (Math.random() < hitChance) {
                        hits++;
                        let actualDmg = dmg * (0.9 + Math.random() * 0.2);
                        
                        // 暴击
                        if (Math.random() < 0.1) actualDmg *= 1.5;
                        
                        damage += actualDmg;
                        target.hp -= actualDmg;
                        if (target.hp <= 0) kills++;
                        
                        // 穿透加成（简化）
                        if (weapon.pierce) {
                            const pierceTargets = Math.min(weapon.pierce, enemies.length - 1);
                            for (let p = 0; p < pierceTargets; p++) {
                                const pierceDmg = actualDmg * 0.5; // 穿透衰减
                                damage += pierceDmg;
                                hits++;
                            }
                        }
                    }
                }
                
                // 环刃特殊处理：轨道投射物持续伤害
                if (weapon.subtype === 'orbit_proj') {
                    const orbitDuration = weapon.orbitDuration || 2.5;
                    const tickRate = 0.2; // 每0.2秒一次伤害
                    sustainedEffect = {
                        type: 'orbit_proj',
                        duration: orbitDuration,
                        tickRate: tickRate,
                        dmg: dmg * 0.3, // 每次轨道伤害较低
                        range: weapon.orbitRadius || 140
                    };
                }
                break;
                
            case 'orbit':
                // 环绕物（圣经等）：生成持续伤害效果
                // 初始伤害（环绕物出现时的首次伤害）
                const orbitTargets = Math.min(weapon.count || 3, enemies.length);
                for (let i = 0; i < orbitTargets; i++) {
                    hits++;
                    const actualDmg = dmg * (0.9 + Math.random() * 0.2);
                    damage += actualDmg;
                    enemies[i].hp -= actualDmg;
                    if (enemies[i].hp <= 0) kills++;
                }
                
                // 添加持续效果
                sustainedEffect = {
                    type: 'orbit',
                    duration: weapon.duration || 6,
                    tickRate: 0.3, // 每0.3秒一次伤害
                    dmg: dmg * weapon.count || 3, // 每次tick造成全部环绕物的伤害
                    range: range
                };
                break;
                
            case 'instant':
                // 即时攻击（闪电等）
                if (enemies.length > 0) {
                    // 闪电命中率受范围影响
                    let hitChance = 0.95;
                    const nearest = this.getNearestTarget(enemies);
                    const dist = this.getDistanceToCenter(nearest);
                    if (dist > range * 0.8) hitChance = 0.7; // 远距离降低命中
                    
                    if (Math.random() < hitChance) {
                        hits++;
                        let actualDmg = dmg * (0.9 + Math.random() * 0.2);
                        if (Math.random() < 0.1) actualDmg *= 1.5;
                        
                        damage += actualDmg;
                        nearest.hp -= actualDmg;
                        if (nearest.hp <= 0) kills++;
                        
                        // 连锁闪电
                        if (weapon.chain) {
                            const chainTargets = Math.min(weapon.chain, enemies.length - 1);
                            for (let c = 0; c < chainTargets; c++) {
                                const chainDmg = actualDmg * 0.6; // 连锁衰减40%
                                damage += chainDmg;
                                hits++;
                            }
                        }
                    }
                }
                break;
                
            case 'area':
                // 区域攻击（圣水等）：生成持续区域
                // 首次伤害
                const areaTargets = Math.min(5, enemies.length);
                for (let i = 0; i < areaTargets; i++) {
                    hits++;
                    const actualDmg = dmg * (0.9 + Math.random() * 0.2);
                    damage += actualDmg;
                    enemies[i].hp -= actualDmg;
                    if (enemies[i].hp <= 0) kills++;
                }
                
                // 添加持续效果
                sustainedEffect = {
                    type: 'area',
                    duration: weapon.duration || 5,
                    tickRate: weapon.tickRate || 0.5,
                    dmg: dmg,
                    range: range
                };
                break;
                
            case 'aura':
                // 光环（辉耀等）：持续伤害
                const auraTargets = Math.min(4, enemies.length);
                for (let i = 0; i < auraTargets; i++) {
                    hits++;
                    const actualDmg = dmg * (0.9 + Math.random() * 0.2);
                    damage += actualDmg;
                    enemies[i].hp -= actualDmg;
                    if (enemies[i].hp <= 0) kills++;
                }
                
                sustainedEffect = {
                    type: 'aura',
                    duration: 999, // 光环持续到下一次释放
                    tickRate: weapon.tickRate || 0.2,
                    dmg: dmg,
                    range: range
                };
                break;
        }
        
        return { damage, hits, kills, sustainedEffect };
    }
    
    getNearestTarget(enemies) {
        let nearest = null;
        let minDist = Infinity;
        const centerX = this.testConfig.roomSize.w / 2;
        const centerY = this.testConfig.roomSize.h / 2;
        
        for (const e of enemies) {
            const dist = Math.sqrt((e.x - centerX) ** 2 + (e.y - centerY) ** 2);
            if (dist < minDist) {
                minDist = dist;
                nearest = e;
            }
        }
        return nearest;
    }
    
    getDistanceToCenter(target) {
        const centerX = this.testConfig.roomSize.w / 2;
        const centerY = this.testConfig.roomSize.h / 2;
        return Math.sqrt((target.x - centerX) ** 2 + (target.y - centerY) ** 2);
    }
    
    getTargetsInRadius(enemies, radius, maxCount) {
        const centerX = this.testConfig.roomSize.w / 2;
        const centerY = this.testConfig.roomSize.h / 2;
        
        const inRange = enemies
            .map(e => ({
                enemy: e,
                dist: Math.sqrt((e.x - centerX) ** 2 + (e.y - centerY) ** 2)
            }))
            .filter(item => item.dist <= radius)
            .sort((a, b) => a.dist - b.dist)
            .slice(0, maxCount)
            .map(item => item.enemy);
        
        return inRange;
    }
    
    calculateStats(runs) {
        const avg = arr => arr.reduce((a, b) => a + b, 0) / arr.length;
        const std = (arr, mean) => Math.sqrt(arr.reduce((sq, n) => sq + (n - mean) ** 2, 0) / arr.length);
        
        const dpsValues = runs.map(r => r.effectiveDPS);
        const avgDPS = avg(dpsValues);
        const stdDPS = std(dpsValues, avgDPS);
        
        return {
            avgDPS: Math.round(avgDPS),
            stdDPS: Math.round(stdDPS),
            cvDPS: stdDPS / avgDPS,
            minDPS: Math.round(Math.min(...dpsValues)),
            maxDPS: Math.round(Math.max(...dpsValues)),
            avgKills: Math.round(avg(runs.map(r => r.kills))),
            survivalRate: runs.filter(r => r.kills >= this.testConfig.enemyDensity).length / runs.length
        };
    }
    
    generateReport(results) {
        const allDPS = results.map(r => r.avgDPS);
        const avgAllDPS = allDPS.reduce((a, b) => a + b, 0) / allDPS.length;
        const minDPS = Math.min(...allDPS);
        const maxDPS = Math.max(...allDPS);
        
        // 分级
        const tiers = { S: [], A: [], B: [], C: [], D: [] };
        
        for (const r of results) {
            const ratio = r.avgDPS / avgAllDPS;
            r.dpsRatio = ratio;
            r.tier = ratio > 1.5 ? 'S' : ratio > 1.2 ? 'A' : ratio > 0.8 ? 'B' : ratio > 0.5 ? 'C' : 'D';
            tiers[r.tier].push(r);
        }
        
        // 计算平衡分数
        let balanceScore = 100;
        for (const r of results) {
            const ratio = r.avgDPS / avgAllDPS;
            if (ratio > 1.5) balanceScore -= (ratio - 1.5) * 20;
            if (ratio < 0.5) balanceScore -= (0.5 - ratio) * 20;
            if (r.cvDPS > 0.3) balanceScore -= (r.cvDPS - 0.3) * 10;
        }
        balanceScore = Math.max(0, Math.min(100, balanceScore));
        
        // 生成建议
        const recommendations = [];
        for (const r of results) {
            const ratio = r.avgDPS / avgAllDPS;
            if (ratio > 1.5) {
                const target = avgAllDPS * 1.3;
                recommendations.push({
                    weapon: r.weaponName,
                    type: 'nerf',
                    severity: 'high',
                    current: r.avgDPS,
                    target: Math.round(target),
                    suggestion: `伤害降低 ${Math.round((1 - target/r.avgDPS) * 100)}%`
                });
            } else if (ratio < 0.5) {
                const target = avgAllDPS * 0.7;
                recommendations.push({
                    weapon: r.weaponName,
                    type: 'buff',
                    severity: 'high',
                    current: r.avgDPS,
                    target: Math.round(target),
                    suggestion: `伤害增加 ${Math.round((target/r.avgDPS - 1) * 100)}%`
                });
            }
        }
        
        return {
            timestamp: new Date().toISOString(),
            summary: {
                totalWeapons: results.length,
                avgDPS: Math.round(avgAllDPS),
                minDPS,
                maxDPS,
                minMaxRatio: (minDPS / maxDPS * 100).toFixed(1) + '%',
                balanceScore: Math.round(balanceScore)
            },
            tiers,
            recommendations,
            results: results.sort((a, b) => b.avgDPS - a.avgDPS)
        };
    }
    
    printReport(report) {
        const { summary, tiers, recommendations } = report;
        
        // 颜色函数
        const red = s => `\x1b[31m${s}\x1b[0m`;
        const green = s => `\x1b[32m${s}\x1b[0m`;
        const yellow = s => `\x1b[33m${s}\x1b[0m`;
        const blue = s => `\x1b[34m${s}\x1b[0m`;
        const cyan = s => `\x1b[36m${s}\x1b[0m`;
        
        // 分数颜色
        const scoreColor = summary.balanceScore > 70 ? green : summary.balanceScore > 50 ? yellow : red;
        
        console.log('');
        console.log('━'.repeat(60));
        console.log('📊 测试结果汇总');
        console.log('━'.repeat(60));
        console.log(`平衡分数: ${scoreColor(summary.balanceScore + '/100')}`);
        console.log(`武器数量: ${summary.totalWeapons}`);
        console.log(`平均DPS: ${summary.avgDPS}`);
        console.log(`DPS范围: ${summary.minDPS} - ${summary.maxDPS}`);
        console.log(`最低/最高比: ${summary.minMaxRatio}`);
        console.log('');
        
        // 分级显示
        console.log('🎯 武器分级');
        console.log('━'.repeat(60));
        
        const tierColors = { S: red, A: yellow, B: green, C: blue, D: red };
        const tierIcons = { S: '⚠️', A: '↗️', B: '✅', C: '↘️', D: '❌' };
        
        for (const [tier, weapons] of Object.entries(tiers)) {
            if (weapons.length === 0) continue;
            console.log(`\n${tierColors[tier](tier + '级')} ${tierIcons[tier]} (${weapons.length}个)`);
            for (const w of weapons) {
                console.log(`  ${w.icon} ${w.weaponName.padEnd(8)} DPS: ${cyan(w.avgDPS.toString().padStart(3))} (${(w.dpsRatio*100).toFixed(0)}%) [${w.type}]`);
            }
        }
        
        // 调整建议
        if (recommendations.length > 0) {
            console.log('');
            console.log('🔧 调整建议');
            console.log('━'.repeat(60));
            for (const rec of recommendations) {
                const color = rec.type === 'nerf' ? red : green;
                const arrow = rec.type === 'nerf' ? '↘️' : '↗️';
                console.log(color(`${arrow} ${rec.weapon}: ${rec.current} → ${rec.target} | ${rec.suggestion} (${rec.severity})`));
            }
        } else {
            console.log('');
            console.log(green('✅ 所有武器平衡良好，无需调整'));
        }
        
        console.log('');
        console.log('━'.repeat(60));
        console.log('完整报告已保存到: reports/weapon-balance-report.json');
        console.log('━'.repeat(60));
    }
    
    saveReport(report) {
        const reportsDir = path.join(__dirname, '..', 'reports');
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }
        
        const filename = `weapon-balance-${Date.now()}.json`;
        const filepath = path.join(reportsDir, filename);
        fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
        
        // 同时保存最新报告
        fs.writeFileSync(
            path.join(reportsDir, 'weapon-balance-latest.json'),
            JSON.stringify(report, null, 2)
        );
        
        // 生成Markdown报告
        this.generateMarkdownReport(report, path.join(reportsDir, 'weapon-balance-latest.md'));
        
        return filepath;
    }
    
    generateMarkdownReport(report, filepath) {
        const { summary, tiers, recommendations, results } = report;
        
        const md = `# 武器平衡测试报告

**测试时间**: ${new Date(report.timestamp).toLocaleString()}  
**平衡分数**: ${summary.balanceScore}/100

---

## 📊 汇总

| 指标 | 数值 |
|:---|:---|
| 武器总数 | ${summary.totalWeapons} |
| 平均DPS | ${summary.avgDPS} |
| DPS最低 | ${summary.minDPS} |
| DPS最高 | ${summary.maxDPS} |
| 最低/最高比 | ${summary.minMaxRatio} |

---

## 🎯 武器分级

### S级 (过强)
${tiers.S.map(w => `- ${w.icon} **${w.weaponName}** - DPS: ${w.avgDPS} (${(w.dpsRatio*100).toFixed(0)}%)`).join('\n') || '无'}

### A级 (偏强)
${tiers.A.map(w => `- ${w.icon} **${w.weaponName}** - DPS: ${w.avgDPS} (${(w.dpsRatio*100).toFixed(0)}%)`).join('\n') || '无'}

### B级 (正常)
${tiers.B.map(w => `- ${w.icon} **${w.weaponName}** - DPS: ${w.avgDPS} (${(w.dpsRatio*100).toFixed(0)}%)`).join('\n') || '无'}

### C级 (偏弱)
${tiers.C.map(w => `- ${w.icon} **${w.weaponName}** - DPS: ${w.avgDPS} (${(w.dpsRatio*100).toFixed(0)}%)`).join('\n') || '无'}

### D级 (过弱)
${tiers.D.map(w => `- ${w.icon} **${w.weaponName}** - DPS: ${w.avgDPS} (${(w.dpsRatio*100).toFixed(0)}%)`).join('\n') || '无'}

---

## 🔧 调整建议

${recommendations.length > 0 ? recommendations.map(r => `| ${r.weapon} | ${r.type === 'nerf' ? '削弱' : '增强'} | ${r.current} → ${r.target} | ${r.suggestion} |`).join('\n') : '无需调整'}

---

## 📈 详细数据

| 武器 | 类型 | 基础伤害 | CD | 实际DPS | 比例 | 分级 |
|:---|:---|---:|---:|---:|---:|:---|
${results.map(r => `| ${r.icon} ${r.weaponName} | ${r.type} | ${r.baseDmg} | ${r.baseCD}s | ${r.avgDPS} | ${(r.dpsRatio*100).toFixed(0)}% | ${r.tier} |`).join('\n')}

---

*生成自 AI平衡测试系统 v0.26*
`;
        
        fs.writeFileSync(filepath, md);
    }
}

// 运行测试
const tester = new WeaponBalanceTester();
tester.runFullTest().catch(console.error);
