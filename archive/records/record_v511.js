const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext({
        recordVideo: {
            dir: '/root/.openclaw/workspace/rouge-cow-videos/',
            size: { width: 1200, height: 800 }
        }
    });
    const page = await context.newPage();
    
    await page.goto('file:///root/.openclaw/workspace/rougelike-cow/index.html');
    await page.waitForTimeout(6000);
    
    console.log('v5.11 AI测试开始...');
    
    // 探索各个房间
    const moves = [
        { key: 'd', time: 3000, name: '向右' },
        { key: 'd', time: 2000, name: '进入房间' },
        { key: 's', time: 3000, name: '向下' },
        { key: 's', time: 2000, name: '进入房间' },
        { key: 'a', time: 3000, name: '向左' },
        { key: 'a', time: 2000, name: '进入房间' },
        { key: 'w', time: 3000, name: '向上' },
        { key: 'w', time: 2000, name: '进入房间' }
    ];
    
    for (const move of moves) {
        console.log(move.name + '...');
        await page.keyboard.down(move.key);
        await page.waitForTimeout(move.time);
        await page.keyboard.up(move.key);
        await page.waitForTimeout(500);
        
        // 战斗
        for (let i = 0; i < 5; i++) {
            const dirs = ['w', 'a', 's', 'd'];
            const dir = dirs[Math.floor(Math.random() * 4)];
            await page.keyboard.down(dir);
            await page.waitForTimeout(300);
            await page.keyboard.up(dir);
        }
    }
    
    console.log('测试完成');
    await page.waitForTimeout(2000);
    
    await context.close();
    await browser.close();
})();
