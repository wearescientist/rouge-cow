#!/usr/bin/env node
/**
 * Weapon Balance Analysis - 武器平衡分析（简化版）
 * v0.26 - 基于理论DPS + 特性系数，不模拟复杂战斗
 * 
 * 核心公式: 理论DPS = 伤害 / CD
 * 调整系数基于武器特性（AOE、穿透、持续等）
 */

const fs = require('fs');
const path = require('path');

// 从index.html提取武器数据
function extractWeapons() {
    const indexPath = path.join(__dirname, '..', 'index.html');
    const content = fs.readFileSync(indexPath, 'utf-8');
    
    const weapons = {};
    const weaponPattern = /(\w+):\s*\{\s*key:\s*['"](\w+)['"],\s*name:\s*['"]([^'"]+)['"],\s*icon:\s*['"]([^'"]+)['"],\s*dmg:\s*(\d+),\s*cd:\s*([\d.]+)/g;
    
    let m;
    while ((m = weaponPattern.exec(content)) !== null) {
        const [_, key, key2, name, icon, dmg, cd] = m;
        
        const startIdx = m.index;
        const endIdx = content.indexOf('}', startIdx);
        const weaponStr = content.substring(startIdx, endIdx + 1);
        
        weapons[key] = {
            key,
            name,
            icon,
            dmg: parseInt(dmg),
            cd: parseFloat(cd),
            range: extractNum(weaponStr, 'range') || 200,
            type: extractStr(weaponStr, 'type') || 'proj',
            subtype: extractStr(weaponStr, 'subtype') || 'normal',
            count: extractNum(weaponStr, 'count') || 1,
            pierce: extractNum(weaponStr, 'pierce') || 0,
            bounce: extractNum(weaponStr, 'bounce') || 0,
            chain: extractNum(weaponStr, 'chain') || 0,
            duration: extractNum(weaponStr, 'duration') || 0,
            tickRate: extractNum(weaponStr, 'tickRate') || 0,
            explodeRadius: extractNum(weaponStr, 'explodeRadius') || 0,
            color: extractStr(weaponStr, 'color') || '#fff'
        };
    }
    
    return weapons;
}

function extractNum(str, key) {
    const match = str.match(new RegExp(`${key}:\\s*([\\d.]+)`));
    return match ? parseFloat(match[1]) : null;
}

function extractStr(str, key) {
    const match = str.match(new RegExp(`${key}:\\s*['"]([^'"]+)['"]`));
    return match ? match[1] : null;
}

// 计算武器效能评分
function calculateEffectiveness(weapon) {
    const baseDPS = weapon.dmg / weapon.cd;
    let multiplier = 1.0;
    let factors = [];
    
    // ========== 数量系数 ==========
    // 多发武器理论上可以命中多个目标
    if (weapon.count > 1) {
        // 不是简单乘以count，因为多发不一定全部命中
        const countBonus = 1 + (weapon.count - 1) * 0.4;
        multiplier *= countBonus;
        factors.push(`多发×${countBonus.toFixed(2)}`);
    }
    
    // ========== 穿透系数 ==========
    if (weapon.pierce > 0) {
        // 穿透可以命中同一直线上的多个敌人
        // 假设平均穿透2-3个敌人（不是每次都穿透99个）
        const pierceBonus = 1 + Math.min(weapon.pierce, 3) * 0.25;
        multiplier *= pierceBonus;
        factors.push(`穿透×${pierceBonus.toFixed(2)}`);
    }
    
    // ========== 弹跳系数 ==========
    if (weapon.bounce > 0) {
        const bounceBonus = 1 + weapon.bounce * 0.15;
        multiplier *= bounceBonus;
        factors.push(`弹跳×${bounceBonus.toFixed(2)}`);
    }
    
    // ========== 连锁系数 ==========
    if (weapon.chain > 0) {
        // 连锁闪电每次衰减，总伤害 = 1 + 0.6 + 0.36 + ...
        let chainTotal = 1;
        let decay = 0.6;
        for (let i = 0; i < weapon.chain; i++) {
            chainTotal += decay;
            decay *= 0.6;
        }
        multiplier *= chainTotal;
        factors.push(`连锁×${chainTotal.toFixed(2)}`);
    }
    
    // ========== 爆炸/范围系数 ==========
    if (weapon.explodeRadius > 0) {
        // 爆炸可以命中聚集的敌人，假设平均命中2-3个
        const explodeBonus = 2.0;
        multiplier *= explodeBonus;
        factors.push(`爆炸×${explodeBonus.toFixed(2)}`);
    }
    
    // ========== 持续伤害系数 ==========
    if (weapon.duration > 0 && weapon.tickRate > 0) {
        // 持续伤害武器的总伤害 = 单次伤害 × tick次数
        // 但敌人可能被其他武器击杀，所以不是全额计算
        const ticks = weapon.duration / weapon.tickRate;
        // 假设持续武器平均能发挥60%的潜力
        const sustainBonus = 1 + ticks * 0.6;
        multiplier *= sustainBonus;
        factors.push(`持续×${sustainBonus.toFixed(2)}`);
    }
    
    // ========== 类型调整系数 ==========
    // 某些类型在实际游戏中表现不同
    switch (weapon.type) {
        case 'melee':
            // 近战范围小但伤害可靠，略微下调
            multiplier *= 0.9;
            factors.push('近战×0.90');
            break;
        case 'orbit':
            // 环绕物在人群中很强，但在分散时弱
            multiplier *= 1.2;
            factors.push('环绕×1.20');
            break;
        case 'aura':
            // 光环持续输出，非常稳定
            multiplier *= 1.1;
            factors.push('光环×1.10');
            break;
    }
    
    // ========== CD惩罚 ==========
    // 极长CD的武器在实战中可能错过击杀时机
    if (weapon.cd > 3) {
        const cdPenalty = 0.85;
        multiplier *= cdPenalty;
        factors.push('长CD×0.85');
    }
    
    const effectiveDPS = baseDPS * multiplier;
    
    return {
        baseDPS,
        multiplier,
        effectiveDPS,
        factors
    };
}

// 主函数
function runAnalysis() {
    console.log('');
    console.log('╔══════════════════════════════════════════════════════════════╗');
    console.log('║           武器平衡分析系统 v0.26 (理论版)                    ║');
    console.log('║     基于理论DPS + 武器特性系数，无复杂战斗模拟               ║');
    console.log('╚══════════════════════════════════════════════════════════════╝');
    console.log('');
    
    const weapons = extractWeapons();
    const results = [];
    
    for (const [key, weapon] of Object.entries(weapons)) {
        const analysis = calculateEffectiveness(weapon);
        results.push({
            key,
            ...weapon,
            ...analysis
        });
    }
    
    // 计算统计
    const allDPS = results.map(r => r.effectiveDPS);
    const avgDPS = allDPS.reduce((a, b) => a + b, 0) / allDPS.length;
    const minDPS = Math.min(...allDPS);
    const maxDPS = Math.max(...allDPS);
    
    // 分级
    const tiers = { S: [], A: [], B: [], C: [], D: [] };
    
    for (const r of results) {
        const ratio = r.effectiveDPS / avgDPS;
        r.ratio = ratio;
        r.tier = ratio > 1.5 ? 'S' : ratio > 1.2 ? 'A' : ratio > 0.8 ? 'B' : ratio > 0.5 ? 'C' : 'D';
        tiers[r.tier].push(r);
    }
    
    // 排序
    for (const tier of Object.values(tiers)) {
        tier.sort((a, b) => b.effectiveDPS - a.effectiveDPS);
    }
    
    // 打印报告
    console.log('📊 统计汇总');
    console.log('─'.repeat(60));
    console.log(`武器数量: ${results.length}`);
    console.log(`平均效能DPS: ${avgDPS.toFixed(1)}`);
    console.log(`最低: ${minDPS.toFixed(1)} | 最高: ${maxDPS.toFixed(1)}`);
    console.log(`极差比: ${(minDPS/maxDPS*100).toFixed(1)}%`);
    console.log('');
    
    console.log('🎯 武器分级（按效能DPS排序）');
    console.log('─'.repeat(60));
    
    const tierNames = { S: '⚠️ 过强', A: '↗️ 偏强', B: '✅ 正常', C: '↘️ 偏弱', D: '❌ 过弱' };
    const tierColors = { 
        S: '\x1b[31m', // red
        A: '\x1b[33m', // yellow
        B: '\x1b[32m', // green
        C: '\x1b[34m', // blue
        D: '\x1b[35m'  // magenta
    };
    const reset = '\x1b[0m';
    
    for (const [tierName, weapons] of Object.entries(tiers)) {
        if (weapons.length === 0) continue;
        
        console.log(`\n${tierColors[tierName]}${tierName}级${reset} ${tierNames[tierName]} (${weapons.length}个)`);
        
        for (const w of weapons) {
            const ratioStr = `${(w.ratio*100).toFixed(0)}%`;
            const factorsStr = w.factors.join(', ');
            console.log(`  ${w.icon} ${w.name.padEnd(8)} 效能:${w.effectiveDPS.toFixed(0).padStart(4)} 基础:${w.baseDPS.toFixed(0).padStart(3)} 倍率:${w.multiplier.toFixed(1)}x (${ratioStr})`);
            console.log(`     ${factorsStr}`);
        }
    }
    
    // 调整建议
    console.log('');
    console.log('🔧 调整建议');
    console.log('─'.repeat(60));
    
    const suggestions = [];
    
    for (const r of results) {
        const ratio = r.effectiveDPS / avgDPS;
        
        if (ratio > 1.5) {
            const target = avgDPS * 1.3;
            const nerf = 1 - target / r.effectiveDPS;
            suggestions.push({
                weapon: r.name,
                type: 'nerf',
                current: r.effectiveDPS.toFixed(0),
                target: target.toFixed(0),
                action: `伤害降低 ${(nerf*100).toFixed(0)}%`
            });
        } else if (ratio < 0.5) {
            const target = avgDPS * 0.7;
            const buff = target / r.effectiveDPS - 1;
            suggestions.push({
                weapon: r.name,
                type: 'buff',
                current: r.effectiveDPS.toFixed(0),
                target: target.toFixed(0),
                action: `伤害增加 ${(buff*100).toFixed(0)}%`
            });
        }
    }
    
    if (suggestions.length > 0) {
        for (const s of suggestions) {
            const color = s.type === 'nerf' ? '\x1b[31m' : '\x1b[32m';
            const arrow = s.type === 'nerf' ? '↘️' : '↗️';
            console.log(`${color}${arrow} ${s.weapon}: ${s.current} → ${s.target} | ${s.action}${reset}`);
        }
    } else {
        console.log('\x1b[32m✅ 武器平衡良好，无需调整\x1b[0m');
    }
    
    // 保存报告
    const reportsDir = path.join(__dirname, '..', 'reports');
    if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
    }
    
    const report = {
        timestamp: new Date().toISOString(),
        summary: {
            totalWeapons: results.length,
            avgDPS: avgDPS.toFixed(1),
            minDPS: minDPS.toFixed(1),
            maxDPS: maxDPS.toFixed(1)
        },
        tiers: {
            S: tiers.S.map(w => ({ name: w.name, effectiveDPS: w.effectiveDPS.toFixed(1), ratio: (w.ratio*100).toFixed(0)+'%' })),
            A: tiers.A.map(w => ({ name: w.name, effectiveDPS: w.effectiveDPS.toFixed(1), ratio: (w.ratio*100).toFixed(0)+'%' })),
            B: tiers.B.map(w => ({ name: w.name, effectiveDPS: w.effectiveDPS.toFixed(1), ratio: (w.ratio*100).toFixed(0)+'%' })),
            C: tiers.C.map(w => ({ name: w.name, effectiveDPS: w.effectiveDPS.toFixed(1), ratio: (w.ratio*100).toFixed(0)+'%' })),
            D: tiers.D.map(w => ({ name: w.name, effectiveDPS: w.effectiveDPS.toFixed(1), ratio: (w.ratio*100).toFixed(0)+'%' }))
        },
        suggestions,
        details: results.sort((a, b) => b.effectiveDPS - a.effectiveDPS).map(r => ({
            name: r.name,
            baseDPS: r.baseDPS.toFixed(1),
            multiplier: r.multiplier.toFixed(2),
            effectiveDPS: r.effectiveDPS.toFixed(1),
            factors: r.factors
        }))
    };
    
    fs.writeFileSync(
        path.join(reportsDir, 'weapon-balance-analysis.json'),
        JSON.stringify(report, null, 2)
    );
    
    console.log('');
    console.log('─'.repeat(60));
    console.log('报告已保存: reports/weapon-balance-analysis.json');
    console.log('─'.repeat(60));
}

// 运行
runAnalysis();
