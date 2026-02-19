const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    
    // 打开游戏
    await page.goto('https://wearescientist.github.io/rouge-cow/', { waitUntil: 'networkidle' });
    
    // 等待加载完成
    await page.waitForTimeout(3000);
    
    // 截图 - 起点房间
    await page.screenshot({ path: '/root/.openclaw/workspace/rougelike-cow/test_room1.png' });
    
    // 移动到右边的门
    await page.keyboard.press('d');
    await page.waitForTimeout(200);
    await page.keyboard.press('d');
    await page.waitForTimeout(200);
    await page.keyboard.press('d');
    await page.waitForTimeout(200);
    await page.keyboard.press('d');
    await page.waitForTimeout(200);
    await page.keyboard.press('d');
    await page.waitForTimeout(500);
    
    // 截图 - 应该进入新房间
    await page.screenshot({ path: '/root/.openclaw/workspace/rougelike-cow/test_room2.png' });
    
    // 等待一下看敌人
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/root/.openclaw/workspace/rougelike-cow/test_room3.png' });
    
    console.log('Test completed');
    
    await browser.close();
})();
