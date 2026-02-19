const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    
    // 打开游戏
    await page.goto('https://wearescientist.github.io/rouge-cow/', { waitUntil: 'networkidle' });
    
    // 等待加载完成
    await page.waitForTimeout(3000);
    
    // 截图
    await page.screenshot({ path: '/root/.openclaw/workspace/rougelike-cow/test_screenshot.png', fullPage: true });
    
    // 获取控制台日志
    const logs = [];
    page.on('console', msg => logs.push(msg.text()));
    
    // 移动一下看看敌人
    await page.keyboard.press('d');
    await page.waitForTimeout(500);
    await page.keyboard.press('s');
    await page.waitForTimeout(500);
    
    // 再截图
    await page.screenshot({ path: '/root/.openclaw/workspace/rougelike-cow/test_screenshot2.png', fullPage: true });
    
    console.log('Logs:', logs.slice(-20).join('\n'));
    
    await browser.close();
})();
