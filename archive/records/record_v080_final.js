const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

(async () => {
    const videoDir = '/root/.openclaw/workspace/rouge-cow-videos';
    
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 720 },
        recordVideo: {
            dir: videoDir,
            size: { width: 1280, height: 720 }
        }
    });
    
    const page = await context.newPage();
    
    console.log('正在加载游戏...');
    await page.goto('http://localhost:8888/index_v0.8.0.html', { waitUntil: 'networkidle' });
    
    // 等待加载完成
    await page.waitForTimeout(3000);
    
    // 点击开始游戏按钮
    console.log('开始游戏...');
    await page.click('#startGameBtn');
    await page.waitForTimeout(2000);
    
    // 开启无敌模式
    console.log('开启无敌模式...');
    await page.keyboard.press('g');
    await page.waitForTimeout(500);
    
    // 录制游戏过程 - 完整通关六层
    console.log('开始录制六层通关过程（约4分钟）...');
    
    // 持续移动和探索，模拟通关过程
    const moves = ['w', 'a', 's', 'd'];
    const totalTime = 240000; // 4分钟
    const interval = 100;
    const steps = totalTime / interval;
    
    for (let i = 0; i < steps; i++) {
        const key = moves[Math.floor(Math.random() * moves.length)];
        await page.keyboard.press(key);
        
        // 每10秒尝试进入门
        if (i % 100 === 0) {
            await page.keyboard.press('w');
        }
        
        // 每30秒输出进度
        if (i % 300 === 0) {
            const progress = Math.floor((i / steps) * 100);
            console.log(`录制进度: ${progress}%`);
        }
        
        await page.waitForTimeout(interval);
    }
    
    console.log('录制完成，正在保存...');
    await page.waitForTimeout(2000);
    
    await context.close();
    await browser.close();
    
    console.log('完成！');
    process.exit(0);
})();
