const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    
    // 捕获控制台日志
    page.on('console', msg => console.log('LOG:', msg.text()));
    page.on('pageerror', err => console.log('ERROR:', err.message));
    
    // 访问并强制刷新
    await page.goto('https://wearescientist.github.io/rouge-cow/?nocache=1', { waitUntil: 'networkidle' });
    await page.waitForTimeout(10000);
    
    // 截图看状态
    await page.screenshot({ path: '/root/.openclaw/workspace/rougelike-cow/test_v5.6_status.png' });
    
    await browser.close();
})();
