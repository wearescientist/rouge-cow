/**
 * Performance Test Tool - 性能测试工具
 * 自动化性能基准测试
 * v0.22.1 - Phase 3 质量保障
 */

class PerformanceTester {
    constructor() {
        this.results = [];
        this.running = false;
    }

    /**
     * 运行基准测试
     * @param {Object} game - 游戏实例
     * @param {number} duration - 测试时长（秒）
     * @returns {Object} 测试结果
     */
    async runBenchmark(game, duration = 10) {
        if (this.running) {
            console.warn('[PerfTest] 测试已在运行中');
            return null;
        }
        
        this.running = true;
        console.log(`[PerfTest] 开始基准测试，时长 ${duration} 秒...`);
        
        const samples = {
            fps: [],
            frameTime: [],
            memory: [],
            entityCount: [],
            bulletCount: []
        };
        
        const startTime = performance.now();
        const sampleInterval = 100; // 每100ms采样一次
        
        while (performance.now() - startTime < duration * 1000) {
            const sample = this._sample(game);
            samples.fps.push(sample.fps);
            samples.frameTime.push(sample.frameTime);
            samples.memory.push(sample.memory);
            samples.entityCount.push(sample.entityCount);
            samples.bulletCount.push(sample.bulletCount);
            
            await this._sleep(sampleInterval);
        }
        
        const result = this._analyzeSamples(samples, duration);
        this.results.push(result);
        this.running = false;
        
        console.log('[PerfTest] 基准测试完成:', result);
        return result;
    }

    /**
     * 采样当前状态
     */
    _sample(game) {
        const mem = performance.memory ? {
            used: performance.memory.usedJSHeapSize / 1048576,
            total: performance.memory.totalJSHeapSize / 1048576,
            limit: performance.memory.jsHeapSizeLimit / 1048576
        } : null;
        
        return {
            timestamp: performance.now(),
            fps: game.lastFps || 60,
            frameTime: game.lastFrameTime || 16.67,
            memory: mem ? mem.used : 0,
            entityCount: game.enemies ? game.enemies.length : 0,
            bulletCount: game.bullets ? game.bullets.length : 0
        };
    }

    /**
     * 分析采样数据
     */
    _analyzeSamples(samples, duration) {
        const analyze = (arr) => {
            const sorted = [...arr].sort((a, b) => a - b);
            const sum = arr.reduce((a, b) => a + b, 0);
            return {
                min: sorted[0],
                max: sorted[sorted.length - 1],
                avg: sum / arr.length,
                median: sorted[Math.floor(sorted.length / 2)],
                p95: sorted[Math.floor(sorted.length * 0.95)],
                p99: sorted[Math.floor(sorted.length * 0.99)]
            };
        };
        
        return {
            duration: duration,
            timestamp: new Date().toISOString(),
            fps: analyze(samples.fps),
            frameTime: analyze(samples.frameTime),
            memory: analyze(samples.memory.filter(m => m > 0)),
            entityCount: analyze(samples.entityCount),
            bulletCount: analyze(samples.bulletCount),
            
            // 性能评级
            rating: this._calculateRating(analyze(samples.fps), analyze(samples.frameTime))
        };
    }

    /**
     * 计算性能评级
     */
    _calculateRating(fps, frameTime) {
        let score = 100;
        
        // FPS 评分
        if (fps.avg < 30) score -= 40;
        else if (fps.avg < 45) score -= 20;
        else if (fps.avg < 55) score -= 10;
        
        // 帧时间评分
        if (frameTime.avg > 50) score -= 30;
        else if (frameTime.avg > 33) score -= 15;
        
        // 稳定性评分
        if (fps.min < 20) score -= 20;
        
        // 评级
        let grade = 'F';
        if (score >= 90) grade = 'A';
        else if (score >= 80) grade = 'B';
        else if (score >= 70) grade = 'C';
        else if (score >= 60) grade = 'D';
        
        return { score, grade };
    }

    /**
     * 压力测试
     * @param {Object} game - 游戏实例
     */
    async runStressTest(game) {
        console.log('[PerfTest] 开始压力测试...');
        
        const phases = [
            { name: '10敌人', spawn: 10 },
            { name: '50敌人', spawn: 50 },
            { name: '100敌人', spawn: 100 },
            { name: '200敌人', spawn: 200 }
        ];
        
        const results = [];
        
        for (const phase of phases) {
            console.log(`[PerfTest] 阶段: ${phase.name}`);
            
            // 生成敌人
            if (game.spawnEnemies) {
                game.spawnEnemies(phase.spawn);
            }
            
            // 等待稳定
            await this._sleep(2000);
            
            // 测试3秒
            const result = await this.runBenchmark(game, 3);
            result.phase = phase.name;
            results.push(result);
        }
        
        console.log('[PerfTest] 压力测试完成');
        return results;
    }

    /**
     * 生成测试报告
     */
    generateReport() {
        const report = {
            summary: {
                testCount: this.results.length,
                averageScore: this.results.reduce((sum, r) => sum + r.rating.score, 0) / this.results.length,
                averageGrade: this._calculateAverageGrade()
            },
            results: this.results,
            timestamp: new Date().toISOString()
        };
        
        // 下载报告
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `perf_report_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        
        return report;
    }

    _calculateAverageGrade() {
        const grades = this.results.map(r => r.rating.grade);
        const gradeScores = { 'A': 4, 'B': 3, 'C': 2, 'D': 1, 'F': 0 };
        const avg = grades.reduce((sum, g) => sum + (gradeScores[g] || 0), 0) / grades.length;
        
        if (avg >= 3.5) return 'A';
        if (avg >= 2.5) return 'B';
        if (avg >= 1.5) return 'C';
        if (avg >= 0.5) return 'D';
        return 'F';
    }

    _sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * 清空结果
     */
    clear() {
        this.results = [];
    }
}

// 全局导出
window.PerformanceTester = PerformanceTester;
window.perfTester = new PerformanceTester();

// 控制台快捷命令
console.log('[PerfTest] 性能测试工具已加载');
console.log('用法: await perfTester.runBenchmark(game, 10)');
console.log('      await perfTester.runStressTest(game)');
console.log('      perfTester.generateReport()');
