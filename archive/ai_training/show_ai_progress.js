const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const learningFile = path.join(dataDir, 'ai_learning_data.json');

if (!fs.existsSync(learningFile)) {
    console.log('❌ 尚未找到学习数据，请先运行训练！');
    process.exit(0);
}

const data = JSON.parse(fs.readFileSync(learningFile, 'utf8'));

console.log('📊 AI 学习统计');
console.log('================');
console.log('总训练局数:', data.gamesPlayed || 0);
console.log('历史平均分:', Math.round(data.performance?.averageScore || 0));
console.log('历史最高分:', data.performance?.bestScore || 0);
console.log('当前探索率:', ((data.epsilon || 0) * 100).toFixed(1) + '%');
console.log('学习状态数:', Object.keys(data.qTable || {}).length);
console.log('');

console.log('🎯 当前策略权重');
console.log('----------------');
const weights = data.strategyWeights || {};
Object.entries(weights).forEach(([strategy, weight]) => {
    const bar = '█'.repeat(Math.round(weight * 20));
    console.log(strategy.padEnd(12), (weight * 100).toFixed(1) + '%', bar);
});
console.log('');

// v0.16.0: 武器胜率统计
if (data.performance?.weaponWinRates && Object.keys(data.performance.weaponWinRates).length > 0) {
    console.log('⚔️ 武器胜率 TOP 10');
    console.log('----------------');
    const sortedWeapons = Object.entries(data.performance.weaponWinRates)
        .filter(([_, stat]) => stat.count >= 3)
        .sort((a, b) => (b[1].wins / b[1].count) - (a[1].wins / a[1].count))
        .slice(0, 10);
    
    sortedWeapons.forEach(([key, stat], i) => {
        const winRate = (stat.wins / stat.count * 100).toFixed(1);
        const avgScore = Math.round(stat.avgScore || 0);
        console.log(`  #${i+1} ${key.padEnd(15)} 胜率:${winRate}% 均分:${avgScore.toLocaleString()} 场次:${stat.count}`);
    });
    console.log('');
}

// v0.16.0: 显示最常用的武器升级组合
if (data.performance?.weaponUpgrades && Object.keys(data.performance.weaponUpgrades).length > 0) {
    console.log('🔧 升级效果追踪');
    console.log('----------------');
    const sortedUpgrades = Object.entries(data.performance.weaponUpgrades)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 5);
    
    sortedUpgrades.forEach(([key, stat]) => {
        const winRate = stat.count > 0 ? (stat.wins / stat.count * 100).toFixed(1) : '0.0';
        console.log(`  ${key.padEnd(12)} 使用:${stat.count}次 胜率:${winRate}%`);
    });
    console.log('');
}

if (data.performance?.scoreHistory?.length > 0) {
    console.log('📈 最近 10 局分数');
    console.log('----------------');
    const recent = data.performance.scoreHistory.slice(-10);
    recent.forEach((game, i) => {
        const marker = game.score === data.performance.bestScore ? ' 🏆' : '';
        console.log(`  #${game.game}: ${game.score.toLocaleString()}分 [${game.result}]${marker}`);
    });
}

console.log('');
console.log('📝 最后更新:', data.lastUpdated);
if (data.version) {
    console.log('📦 数据版本:', data.version);
}
