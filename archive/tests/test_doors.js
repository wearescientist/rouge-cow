const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    
    const logs = [];
    page.on('console', msg => logs.push(msg.text()));
    
    await page.goto('https://wearescientist.github.io/rouge-cow/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // 截图起点
    await page.screenshot({ path: '/root/.openclaw/workspace/rougelike-cow/test_v4.4_start.png' });
    
    // 向右移动到门
    console.log('Moving right to door...');
    for (let i = 0; i < 50; i++) {
        await page.keyboard.press('d');
        await page.waitForTimeout(50);
    }
    
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/root/.openclaw/workspace/rougelike-cow/test_v4.4_after_right.png' });
    
    // 检查日志
    console.log('\n=== Logs ===');
    logs.slice(-20).forEach(l => console.log(l));
    
    await browser.close();
})();
