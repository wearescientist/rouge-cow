/**
 * AI快速观察脚本 - 单轮观察模式
 * 运行一局游戏，收集问题，生成修复建议
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname);
const BUG_REPORT_DIR = path.join(PROJECT_ROOT, 'bug_reports');

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ==================== 问题观察器 ====================
class GameObserver {
    constructor() {
        this.issues = [];
        this.metrics = {
            fps: [],
            memory: [],
            errors: [],
            stateChanges: []
        };
        this.startTime = Date.now();
    }
    
    async observe(page, duration = 60000) {
        console.log('🔍 Starting game observation...');
        
        const interval = 1000; // 每秒采样
        const samples = duration / interval;
        
        for (let i = 0; i < samples; i++) {
            const elapsed = i * interval;
            const state = await this.getGameState(page);
            
            if (state) {
                this.recordMetrics(state);
                this.checkForIssues(state, elapsed);
                
                // 显示进度
                if (i % 5 === 0) {
                    this.displayStatus(state, elapsed);
                }
            }
            
            await sleep(interval);
        }
        
        return this.generateReport();
    }
    
    async getGameState(page) {
        try {
            return await page.evaluate(() => {
                const game = window.game;
                if (!game) return null;
                
                // 获取性能数据
                const perf = performance.memory ? {
                    usedJSHeapSize: performance.memory.usedJSHeapSize,
                    totalJSHeapSize: performance.memory.totalJSHeapSize
                } : null;
                
                return {
                    timestamp: Date.now(),
                    playerHp: game.player?.hp ?? 0,
                    playerMaxHp: game.player?.maxHp ?? 0,
                    playerLv: game.player?.lv ?? 1,
                    playerGold: game.player?.gold ?? 0,
                    roomType: game.curRoom?.type ?? 'unknown',
                    roomCleared: game.curRoom?.cleared ?? false,
                    enemyCount: game.curRoom?.enemies?.length ?? 0,
                    bulletCount: game.bullets?.length ?? 0,
                    particleCount: game.particles?.active?.length ?? 0,
                    gameState: game.state ?? 'unknown',
                    score: game.scoreManager?.score ?? 0,
                    performance: perf,
                    consoleErrors: window.__consoleErrors?.length ?? 0
                };
            });
        } catch (e) {
            return null;
        }
    }
    
    recordMetrics(state) {
        this.metrics.stateChanges.push({
            time: Date.now() - this.startTime,
            state: state
        });
        
        if (state.performance) {
            this.metrics.memory.push({
                time: Date.now() - this.startTime,
                used: state.performance.usedJSHeapSize / 1024 / 1024 // MB
            });
        }
    }
    
    checkForIssues(state, elapsed) {
        // 检查1: 玩家卡死（位置长时间不变）
        const recentStates = this.metrics.stateChanges.slice(-10);
        if (recentStates.length >= 10) {
            const first = recentStates[0].state;
            const last = recentStates[recentStates.length - 1].state;
            if (first.playerHp === last.playerHp && 
                first.playerGold === last.playerGold &&
                first.score === last.score &&
                elapsed > 10000) {
                this.addIssue('player_stuck', 'Player appears stuck (no progress)', 'medium', {
                    duration: elapsed
                });
            }
        }
        
        // 检查2: 生命值异常
        if (state.playerHp < 0 || state.playerHp > 1000) {
            this.addIssue('invalid_hp', `Invalid HP value: ${state.playerHp}`, 'high', {
                hp: state.playerHp
            });
        }
        
        // 检查3: 控制台错误
        if (state.consoleErrors > 0) {
            this.addIssue('console_errors', `${state.consoleErrors} console errors detected`, 'medium', {
                count: state.consoleErrors
            });
        }
        
        // 检查4: 游戏状态异常
        if (state.gameState === 'unknown' || state.gameState === null) {
            this.addIssue('invalid_state', 'Game state is invalid', 'critical', {
                state: state.gameState
            });
        }
        
        // 检查5: 性能问题
        if (state.particleCount > 1000) {
            this.addIssue('too_many_particles', `High particle count: ${state.particleCount}`, 'low', {
                count: state.particleCount
            });
        }
        
        // 检查6: 子弹数量异常
        if (state.bulletCount > 500) {
            this.addIssue('too_many_bullets', `High bullet count: ${state.bulletCount}`, 'low', {
                count: state.bulletCount
            });
        }
    }
    
    addIssue(type, description, severity, details = {}) {
        // 避免重复报告相同问题
        const recent = this.issues.slice(-5);
        if (recent.some(i => i.type === type)) return;
        
        this.issues.push({
            type,
            description,
            severity,
            timestamp: Date.now() - this.startTime,
            details
        });
        
        const emoji = { critical: '🔴', high: '🟠', medium: '🟡', low: '🔵' };
        console.log(`  ${emoji[severity] || '⚪'} [${severity.toUpperCase()}] ${description}`);
    }
    
    displayStatus(state, elapsed) {
        const seconds = Math.floor(elapsed / 1000);
        const hp = `${state.playerHp}/${state.playerMaxHp}`;
        const enemies = state.enemyCount.toString().padStart(2);
        const score = state.score.toString().padStart(5);
        const room = state.roomType.substring(0, 4).toUpperCase();
        
        process.stdout.write(`\r  ⏱️ ${seconds}s | ❤️ ${hp} | 👾 ${enemies} | 💯 ${score} | 🏠 ${room} | Issues: ${this.issues.length}`);
    }
    
    generateReport() {
        console.log('\n\n📊 Observation Report');
        console.log('='.repeat(50));
        
        // 统计
        const critical = this.issues.filter(i => i.severity === 'critical').length;
        const high = this.issues.filter(i => i.severity === 'high').length;
        const medium = this.issues.filter(i => i.severity === 'medium').length;
        const low = this.issues.filter(i => i.severity === 'low').length;
        
        console.log(`Total Issues: ${this.issues.length}`);
        console.log(`  🔴 Critical: ${critical}`);
        console.log(`  🟠 High: ${high}`);
        console.log(`  🟡 Medium: ${medium}`);
        console.log(`  🔵 Low: ${low}`);
        
        // 问题详情
        if (this.issues.length > 0) {
            console.log('\n📋 Issue Details:');
            this.issues.forEach((issue, i) => {
                console.log(`  ${i + 1}. [${issue.severity}] ${issue.type}`);
                console.log(`     ${issue.description}`);
                console.log(`     Time: ${issue.timestamp}ms`);
            });
        }
        
        // 生成修复建议
        const recommendations = this.generateRecommendations();
        console.log('\n🔧 Recommendations:');
        recommendations.forEach((rec, i) => {
            console.log(`  ${i + 1}. [${rec.priority}] ${rec.action}`);
            console.log(`     ${rec.reason}`);
        });
        
        // 保存报告
        const report = {
            timestamp: new Date().toISOString(),
            duration: Date.now() - this.startTime,
            summary: { critical, high, medium, low, total: this.issues.length },
            issues: this.issues,
            recommendations,
            metrics: this.metrics
        };
        
        const reportPath = path.join(BUG_REPORT_DIR, `observation_${Date.now()}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
        console.log(`\n💾 Report saved: ${reportPath}`);
        
        return report;
    }
    
    generateRecommendations() {
        const recs = [];
        
        const issueTypes = new Set(this.issues.map(i => i.type));
        
        if (issueTypes.has('player_stuck')) {
            recs.push({
                priority: 'high',
                action: 'Improve AI navigation or add stuck detection',
                reason: 'Player got stuck during gameplay'
            });
        }
        
        if (issueTypes.has('console_errors')) {
            recs.push({
                priority: 'high',
                action: 'Fix JavaScript errors in console',
                reason: 'Console errors detected during gameplay'
            });
        }
        
        if (issueTypes.has('invalid_hp')) {
            recs.push({
                priority: 'critical',
                action: 'Add HP bounds checking',
                reason: 'HP value went out of valid range'
            });
        }
        
        if (issueTypes.has('too_many_particles') || issueTypes.has('too_many_bullets')) {
            recs.push({
                priority: 'medium',
                action: 'Optimize object pooling',
                reason: 'Too many active particles/bullets'
            });
        }
        
        if (this.metrics.memory.length > 0) {
            const avgMemory = this.metrics.memory.reduce((a, b) => a + b.used, 0) / this.metrics.memory.length;
            if (avgMemory > 200) {
                recs.push({
                    priority: 'medium',
                    action: 'Check for memory leaks',
                    reason: `High average memory usage: ${avgMemory.toFixed(1)}MB`
                });
            }
        }
        
        return recs;
    }
}

// ==================== 主程序 ====================
async function main() {
    console.log('🐮 牛牛肉鸽 - AI Quick Observation');
    console.log('=====================================\n');
    
    // 确保目录存在
    if (!fs.existsSync(BUG_REPORT_DIR)) {
        fs.mkdirSync(BUG_REPORT_DIR, { recursive: true });
    }
    
    const browser = await chromium.launch({ 
        headless: false,
        channel: 'chrome'
    });
    
    const context = await browser.newContext({
        viewport: { width: 1200, height: 800 }
    });
    
    const page = await context.newPage();
    
    // 监听控制台错误
    await page.evaluateOnNewDocument(() => {
        window.__consoleErrors = [];
        const originalError = console.error;
        console.error = function(...args) {
            window.__consoleErrors.push(args.join(' '));
            originalError.apply(console, args);
        };
    });
    
    // 加载游戏
    const gamePath = path.join(PROJECT_ROOT, 'index.html');
    await page.goto(`file:///${gamePath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle' });
    
    console.log('🎮 Game loaded, starting in 3 seconds...');
    await sleep(3000);
    
    // 开始游戏
    await page.click('#startGameBtn');
    await sleep(1000);
    
    // 设置游戏速度
    await page.evaluate(() => {
        if (window.game && window.game.setSpeed) {
            window.game.setSpeed(3);
        }
    });
    
    console.log('✅ Game started, observation begins!\n');
    
    // 开始观察
    const observer = new GameObserver();
    const report = await observer.observe(page, 60000); // 观察60秒
    
    // 关闭浏览器
    await browser.close();
    
    console.log('\n✅ Observation complete!');
    
    // 如果有严重问题，返回错误码
    if (report.summary.critical > 0) {
        process.exit(1);
    }
}

main().catch(err => {
    console.error('❌ Error:', err);
    process.exit(1);
});
