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
    
    // 跳过剧情
    await page.click('#startGameBtn');
    await page.waitForTimeout(1000);
    
    console.log('v7.0 探索新房间类型...');
    
    // 开启无敌模式
    await page.keyboard.press('g');
    
    // 探索各个方向找特殊房间
    const directions = ['d', 's', 'a', 'w', 'd', 's'];
    for (const dir of directions) {
        console.log(`向${dir}探索...`);
        await page.keyboard.down(dir);
        await page.waitForTimeout(2500);
        await page.keyboard.up(dir);
        await page.waitForTimeout(1000);
    }
    
    console.log('测试完成');
    await page.waitForTimeout(2000);
    
    await context.close();
    await browser.close();
})();
