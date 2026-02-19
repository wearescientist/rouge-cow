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
    
    console.log('v6.0 故事模式测试');
    
    // 点击开始游戏
    await page.click('#startGameBtn');
    await page.waitForTimeout(1000);
    
    // 开启无敌模式
    await page.keyboard.press('g');
    
    // 探索
    for (let i = 0; i < 5; i++) {
        await page.keyboard.down('d');
        await page.waitForTimeout(2000);
        await page.keyboard.up('d');
        await page.waitForTimeout(500);
    }
    
    console.log('测试完成');
    await page.waitForTimeout(2000);
    
    await context.close();
    await browser.close();
})();
