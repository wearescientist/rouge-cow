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
    
    console.log('v5.12 子弹追踪测试...');
    
    // 向右进入战斗房间
    await page.keyboard.down('d');
    await page.waitForTimeout(3000);
    await page.keyboard.up('d');
    await page.waitForTimeout(2000);
    
    // 战斗，观察子弹
    console.log('观察子弹追踪...');
    for (let i = 0; i < 20; i++) {
        const dirs = ['w', 'a', 's', 'd'];
        const dir = dirs[Math.floor(Math.random() * 4)];
        await page.keyboard.down(dir);
        await page.waitForTimeout(300);
        await page.keyboard.up(dir);
    }
    
    console.log('测试完成');
    await page.waitForTimeout(2000);
    
    await context.close();
    await browser.close();
})();
