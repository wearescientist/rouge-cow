const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    
    await page.goto('file:///root/.openclaw/workspace/rougelike-cow/index.html');
    await page.waitForTimeout(5000);
    
    await page.screenshot({ path: '/root/.openclaw/workspace/rougelike-cow/test_v59.png' });
    console.log('v5.9 截图完成');
    
    await browser.close();
})();
