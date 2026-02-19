const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    
    // 打开游戏
    await page.goto('https://wearescientist.github.io/rouge-cow/', { waitUntil: 'networkidle' });
    
    // 等待加载完成
    await page.waitForTimeout(3000);
    
    // 获取玩家初始位置
    const canvas = await page.locator('canvas');
    const box = await canvas.boundingBox();
    console.log('Canvas:', box);
    
    // 截图 - 起点房间
    await page.screenshot({ path: '/root/.openclaw/workspace/rougelike-cow/test_start.png' });
    
    // 持续向右移动进入右边的门
    for (let i = 0; i < 20; i++) {
        await page.keyboard.press('d');
        await page.waitForTimeout(100);
    }
    
    await page.waitForTimeout(500);
    
    // 截图 - 应该进入新房间
    await page.screenshot({ path: '/root/.openclaw/workspace/rougelike-cow/test_new_room.png' });
    
    // 等待一下看敌人
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/root/.openclaw/workspace/rougelike-cow/test_with_enemies.png' });
    
    console.log('Test completed');
    
    await browser.close();
})();
