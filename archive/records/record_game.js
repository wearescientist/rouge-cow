const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext({
        recordVideo: {
            dir: '/root/.openclaw/workspace/rougelike-cow/videos/',
            size: { width: 1200, height: 800 }
        }
    });
    const page = await context.newPage();
    
    await page.goto('file:///root/.openclaw/workspace/rougelike-cow/index.html');
    await page.waitForTimeout(6000);
    
    console.log('开始录制游戏...');
    
    // 向右走到门
    console.log('向右探索...');
    await page.keyboard.down('d');
    await page.waitForTimeout(2000);
    await page.keyboard.up('d');
    await page.waitForTimeout(1000);
    
    // 继续向右
    await page.keyboard.down('d');
    await page.waitForTimeout(2000);
    await page.keyboard.up('d');
    await page.waitForTimeout(1000);
    
    // 战斗
    console.log('战斗模式...');
    for (let i = 0; i < 15; i++) {
        const dirs = ['w', 'a', 's', 'd'];
        const dir = dirs[Math.floor(Math.random() * 4)];
        await page.keyboard.down(dir);
        await page.waitForTimeout(400);
        await page.keyboard.up(dir);
    }
    
    // 向下探索
    console.log('向下探索...');
    await page.keyboard.down('s');
    await page.waitForTimeout(2000);
    await page.keyboard.up('s');
    await page.waitForTimeout(1000);
    
    // 继续战斗探索
    console.log('继续探索...');
    for (let i = 0; i < 30; i++) {
        const dirs = ['w', 'a', 's', 'd'];
        const dir = dirs[Math.floor(Math.random() * 4)];
        await page.keyboard.down(dir);
        await page.waitForTimeout(500);
        await page.keyboard.up(dir);
    }
    
    console.log('录制结束');
    await context.close();
    await browser.close();
})();
