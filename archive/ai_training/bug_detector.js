/**
 * 肉鸽牛牛 - Bug检测系统 v1.0
 * 
 * 功能：在AI训练过程中自动检测游戏问题和异常
 */

const fs = require('fs');
const path = require('path');

class BugDetector {
    constructor(outputDir) {
        this.outputDir = outputDir;
        this.bugs = [];
        this.bugIdCounter = 0;
        
        // 检测配置
        this.config = {
            // 卡死检测阈值
            stuckThreshold: 5000,      // 5秒位置无变化视为卡死
            noProgressThreshold: 30000, // 30秒无进度视为停滞
            
            // 数值异常阈值
            maxHp: 1000,               // 超过视为异常
            maxGold: 99999,
            maxScore: 999999,
            minHp: -10,                // 低于视为异常
            
            // 性能阈值
            minFps: 10,                // 低于10fps视为性能问题
            maxMemoryMB: 500,          // 超过500MB视为内存泄漏
        };
        
        // 状态历史（用于检测卡死）
        this.stateHistory = [];
        this.maxHistorySize = 100;
        
        // 最后进度时间
        this.lastProgressTime = Date.now();
        this.lastProgressScore = 0;
        
        // 确保输出目录存在
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
    }
    
    // 生成Bug ID
    generateBugId() {
        this.bugIdCounter++;
        return `BUG_${String(this.bugIdCounter).padStart(3, '0')}`;
    }
    
    // 主检测入口
    async detect(page, gameState, trainCount) {
        const bugs = [];
        
        try {
            // 1. 检测崩溃/JS错误
            const crashBugs = await this.detectCrashes(page);
            bugs.push(...crashBugs);
            
            // 2. 检测逻辑错误
            const logicBugs = this.detectLogicErrors(gameState);
            bugs.push(...logicBugs);
            
            // 3. 检测卡死
            const stuckBugs = this.detectStuck(gameState);
            bugs.push(...stuckBugs);
            
            // 4. 检测无进度
            const progressBugs = this.detectNoProgress(gameState);
            bugs.push(...progressBugs);
            
            // 5. 检测性能问题
            const perfBugs = await this.detectPerformanceIssues(page, gameState);
            bugs.push(...perfBugs);
            
            // 6. 检测渲染问题
            const renderBugs = await this.detectRenderIssues(page, gameState);
            bugs.push(...renderBugs);
            
            // 7. 检测游戏状态异常
            const stateBugs = this.detectStateAnomalies(gameState);
            bugs.push(...stateBugs);
            
        } catch (e) {
            console.error('Bug检测出错:', e.message);
        }
        
        // 记录状态历史
        this.recordState(gameState);
        
        // 处理新发现的bugs
        for (const bug of bugs) {
            await this.processBug(bug, page, trainCount);
        }
        
        return bugs;
    }
    
    // 1. 检测崩溃/JS错误
    async detectCrashes(page) {
        const bugs = [];
        
        try {
            // 检查页面是否仍然响应
            const isResponsive = await page.evaluate(() => {
                return document.readyState === 'complete' && !!window.game;
            }).catch(() => false);
            
            if (!isResponsive) {
                bugs.push({
                    type: 'crash',
                    severity: 'critical',
                    description: '页面无响应或游戏对象丢失',
                    details: { readyState: await page.evaluate(() => document.readyState).catch(() => 'unknown') }
                });
            }
            
            // 检查控制台错误
            const consoleErrors = await page.evaluate(() => {
                return window.__consoleErrors || [];
            }).catch(() => []);
            
            if (consoleErrors.length > 0) {
                bugs.push({
                    type: 'javascript_error',
                    severity: 'high',
                    description: `检测到 ${consoleErrors.length} 个JS错误`,
                    details: { errors: consoleErrors.slice(-5) }
                });
            }
            
        } catch (e) {
            // 页面可能已经崩溃
            bugs.push({
                type: 'crash',
                severity: 'critical',
                description: '页面崩溃或无法访问',
                details: { error: e.message }
            });
        }
        
        return bugs;
    }
    
    // 2. 检测逻辑错误
    detectLogicErrors(state) {
        const bugs = [];
        
        if (!state) return bugs;
        
        // 负数HP
        if (state.playerHp !== undefined && state.playerHp < 0) {
            bugs.push({
                type: 'logic_error',
                severity: 'critical',
                description: `玩家HP为负数: ${state.playerHp}`,
                details: { hp: state.playerHp, maxHp: state.playerMaxHp }
            });
        }
        
        // HP超过最大值
        if (state.playerHp > state.playerMaxHp) {
            bugs.push({
                type: 'logic_error',
                severity: 'high',
                description: `玩家HP超过最大值: ${state.playerHp}/${state.playerMaxHp}`,
                details: { hp: state.playerHp, maxHp: state.playerMaxHp }
            });
        }
        
        // 异常高的数值
        if (state.playerHp > this.config.maxHp) {
            bugs.push({
                type: 'logic_error',
                severity: 'medium',
                description: `玩家HP异常高: ${state.playerHp}`,
                details: { hp: state.playerHp }
            });
        }
        
        if (state.playerGold > this.config.maxGold) {
            bugs.push({
                type: 'logic_error',
                severity: 'medium',
                description: `金币数异常: ${state.playerGold}`,
                details: { gold: state.playerGold }
            });
        }
        
        if (state.score > this.config.maxScore) {
            bugs.push({
                type: 'logic_error',
                severity: 'medium',
                description: `分数异常: ${state.score}`,
                details: { score: state.score }
            });
        }
        
        // 负数金币
        if (state.playerGold < 0) {
            bugs.push({
                type: 'logic_error',
                severity: 'critical',
                description: `金币为负数: ${state.playerGold}`,
                details: { gold: state.playerGold }
            });
        }
        
        // 等级异常
        if (state.playerLv < 1 || state.playerLv > 100) {
            bugs.push({
                type: 'logic_error',
                severity: 'medium',
                description: `等级异常: ${state.playerLv}`,
                details: { level: state.playerLv }
            });
        }
        
        // 敌人数量异常
        if (state.enemyCount < 0) {
            bugs.push({
                type: 'logic_error',
                severity: 'critical',
                description: `敌人数量为负数: ${state.enemyCount}`,
                details: { enemyCount: state.enemyCount }
            });
        }
        
        return bugs;
    }
    
    // 3. 检测卡死
    detectStuck(state) {
        const bugs = [];
        
        if (!state || this.stateHistory.length < 2) return bugs;
        
        // 检查位置是否长时间未变化
        const recent = this.stateHistory.slice(-10);
        if (recent.length < 10) return bugs;
        
        const first = recent[0];
        const last = recent[recent.length - 1];
        const timeDiff = last.timestamp - first.timestamp;
        
        // 如果5秒内位置几乎没变化，且不在菜单中
        if (timeDiff > this.config.stuckThreshold && !state.isPaused && !state.inShop) {
            const posDiff = Math.abs(first.x - last.x) + Math.abs(first.y - last.y);
            if (posDiff < 10) {
                bugs.push({
                    type: 'stuck',
                    severity: 'high',
                    description: `玩家可能卡死，${(timeDiff/1000).toFixed(1)}秒位置无变化`,
                    details: { 
                        duration: timeDiff,
                        position: { x: state.playerX, y: state.playerY },
                        room: state.roomNumber
                    }
                });
            }
        }
        
        return bugs;
    }
    
    // 4. 检测无进度
    detectNoProgress(state) {
        const bugs = [];
        
        if (!state) return bugs;
        
        const now = Date.now();
        
        // 检查分数是否有变化
        if (state.score > this.lastProgressScore) {
            this.lastProgressTime = now;
            this.lastProgressScore = state.score;
        } else if (now - this.lastProgressTime > this.config.noProgressThreshold) {
            // 30秒无进度
            bugs.push({
                type: 'no_progress',
                severity: 'medium',
                description: `${(this.config.noProgressThreshold/1000)}秒内游戏无进展`,
                details: {
                    duration: now - this.lastProgressTime,
                    lastScore: this.lastProgressScore,
                    currentScore: state.score,
                    room: state.roomNumber,
                    enemies: state.enemyCount
                }
            });
        }
        
        return bugs;
    }
    
    // 5. 检测性能问题
    async detectPerformanceIssues(page, state) {
        const bugs = [];
        
        try {
            // 检测帧率
            const fps = await page.evaluate(() => {
                return window.__fps || 60;
            }).catch(() => 60);
            
            if (fps < this.config.minFps) {
                bugs.push({
                    type: 'performance',
                    severity: 'medium',
                    description: `帧率过低: ${fps.toFixed(1)} FPS`,
                    details: { fps, threshold: this.config.minFps }
                });
            }
            
            // 检测内存使用
            const memory = await page.evaluate(() => {
                return performance.memory ? performance.memory.usedJSHeapSize / 1048576 : 0;
            }).catch(() => 0);
            
            if (memory > this.config.maxMemoryMB) {
                bugs.push({
                    type: 'memory_leak',
                    severity: 'high',
                    description: `内存使用过高: ${memory.toFixed(1)} MB`,
                    details: { memoryMB: memory, threshold: this.config.maxMemoryMB }
                });
            }
            
        } catch (e) {
            // 忽略性能检测错误
        }
        
        return bugs;
    }
    
    // 6. 检测渲染问题
    async detectRenderIssues(page, state) {
        const bugs = [];
        
        try {
            // 检查canvas是否正常渲染
            const canvasState = await page.evaluate(() => {
                const canvas = document.getElementById('gameCanvas');
                if (!canvas) return { exists: false };
                const ctx = canvas.getContext('2d');
                // 检查是否可以获取图像数据
                try {
                    const data = ctx.getImageData(0, 0, 1, 1);
                    return { exists: true, hasData: data.data.length > 0 };
                } catch (e) {
                    return { exists: true, hasData: false, error: e.message };
                }
            }).catch(() => ({ exists: false }));
            
            if (!canvasState.exists) {
                bugs.push({
                    type: 'render_error',
                    severity: 'critical',
                    description: '游戏Canvas不存在',
                    details: {}
                });
            } else if (!canvasState.hasData) {
                bugs.push({
                    type: 'render_error',
                    severity: 'high',
                    description: 'Canvas渲染异常（可能黑屏）',
                    details: { error: canvasState.error }
                });
            }
            
            // 检查玩家是否在画面外
            if (state && state.playerX !== undefined) {
                const roomW = 2700, roomH = 1800;
                if (state.playerX < 0 || state.playerX > roomW || 
                    state.playerY < 0 || state.playerY > roomH) {
                    bugs.push({
                        type: 'position_error',
                        severity: 'high',
                        description: '玩家位置超出房间边界',
                        details: { x: state.playerX, y: state.playerY, roomW, roomH }
                    });
                }
            }
            
        } catch (e) {
            // 忽略渲染检测错误
        }
        
        return bugs;
    }
    
    // 7. 检测游戏状态异常
    detectStateAnomalies(state) {
        const bugs = [];
        
        if (!state) return bugs;
        
        // 游戏进行中但玩家无法操作
        if (state.isPlaying && state.playerHp > 0 && !state.isPaused) {
            // 检查是否在某些异常状态
            if (state.enemyCount > 100) {
                bugs.push({
                    type: 'anomaly',
                    severity: 'medium',
                    description: `敌人数量异常多: ${state.enemyCount}`,
                    details: { enemyCount: state.enemyCount }
                });
            }
        }
        
        // 通关检测异常
        if (state.isVictory && state.playerHp <= 0) {
            bugs.push({
                type: 'logic_error',
                severity: 'critical',
                description: '玩家死亡但游戏显示胜利',
                details: { hp: state.playerHp, isVictory: state.isVictory }
            });
        }
        
        return bugs;
    }
    
    // 记录状态历史
    recordState(state) {
        if (!state) return;
        
        this.stateHistory.push({
            timestamp: Date.now(),
            x: state.playerX,
            y: state.playerY,
            score: state.score,
            room: state.roomNumber
        });
        
        if (this.stateHistory.length > this.maxHistorySize) {
            this.stateHistory.shift();
        }
    }
    
    // 处理Bug（截图、记录）
    async processBug(bug, page, trainCount) {
        const bugId = this.generateBugId();
        const timestamp = Date.now();
        
        const bugReport = {
            bugId,
            trainCount,
            timestamp: new Date(timestamp).toISOString(),
            type: bug.type,
            severity: bug.severity,
            description: bug.description,
            details: bug.details,
            screenshot: null
        };
        
        // 严重bug截图
        if (['critical', 'high'].includes(bug.severity)) {
            try {
                const screenshotPath = path.join(this.outputDir, `${bugId}_${timestamp}.png`);
                await page.screenshot({ path: screenshotPath });
                bugReport.screenshot = screenshotPath;
            } catch (e) {
                console.log(`无法截图: ${e.message}`);
            }
        }
        
        this.bugs.push(bugReport);
        
        // 实时输出
        const severityEmoji = { critical: '🔴', high: '🟠', medium: '🟡', low: '🟢' };
        console.log(`\n${severityEmoji[bug.severity] || '⚪'} [${bugId}] ${bug.type}`);
        console.log(`   ${bug.description}`);
        
        return bugReport;
    }
    
    // 生成最终报告
    generateReport(trainCount) {
        const report = {
            trainCount,
            timestamp: new Date().toISOString(),
            summary: {
                total: this.bugs.length,
                critical: this.bugs.filter(b => b.severity === 'critical').length,
                high: this.bugs.filter(b => b.severity === 'high').length,
                medium: this.bugs.filter(b => b.severity === 'medium').length,
                low: this.bugs.filter(b => b.severity === 'low').length
            },
            bugs: this.bugs
        };
        
        // 按类型分组
        report.byType = {};
        for (const bug of this.bugs) {
            if (!report.byType[bug.type]) {
                report.byType[bug.type] = [];
            }
            report.byType[bug.type].push(bug);
        }
        
        return report;
    }
    
    // 保存报告
    saveReport(trainCount) {
        const report = this.generateReport(trainCount);
        const reportPath = path.join(this.outputDir, `bug_report_${trainCount}_${Date.now()}.json`);
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
        return reportPath;
    }
    
    // 打印总结
    printSummary(trainCount) {
        const summary = {
            total: this.bugs.length,
            critical: this.bugs.filter(b => b.severity === 'critical').length,
            high: this.bugs.filter(b => b.severity === 'high').length,
            medium: this.bugs.filter(b => b.severity === 'medium').length,
            low: this.bugs.filter(b => b.severity === 'low').length
        };
        
        console.log('\n' + '='.repeat(60));
        console.log(`🐛 Bug检测报告 - 训练 #${trainCount}`);
        console.log('='.repeat(60));
        console.log(`总计: ${summary.total} 个问题`);
        console.log(`  🔴 Critical: ${summary.critical}`);
        console.log(`  🟠 High: ${summary.high}`);
        console.log(`  🟡 Medium: ${summary.medium}`);
        console.log(`  🟢 Low: ${summary.low}`);
        
        if (this.bugs.length > 0) {
            console.log('\n问题列表:');
            const typeCount = {};
            for (const bug of this.bugs) {
                typeCount[bug.type] = (typeCount[bug.type] || 0) + 1;
            }
            for (const [type, count] of Object.entries(typeCount)) {
                console.log(`  - ${type}: ${count}次`);
            }
        }
        console.log('='.repeat(60));
        
        return summary;
    }
}

module.exports = BugDetector;
