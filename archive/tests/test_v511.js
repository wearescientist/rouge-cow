const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    
    await page.goto('file:///root/.openclaw/workspace/rougelike-cow/index.html');
    await page.waitForTimeout(6000);
    
    // 向右进入战斗房间
    console.log('向右探索...');
    await page.keyboard.down('d');
    await page.waitForTimeout(2000);
    await page.keyboard.up('d');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/root/.openclaw/workspace/rougelike-cow/v511_room1.png' });
    
    // 战斗
    console.log('战斗...');
    for (let i = 0; i < 15; i++) {
        const dirs = ['w', 'a', 's', 'd'];
        const dir = dirs[Math.floor(Math.random() * 4)];
        await page.keyboard.down(dir);
        await page.waitForTimeout(300);
        await page.keyboard.up(dir);
    }
    await page.screenshot({ path: '/root/.openclaw/workspace/rougelike-cow/v511_fight.png' });
    
    console.log('测试完成');
    await browser.close();
})();
