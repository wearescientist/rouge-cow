const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    await page.goto('https://wearescientist.github.io/rouge-cow/');
    await page.waitForTimeout(5000);
    
    // 截图看页面状态
    await page.screenshot({ path: '/root/.openclaw/workspace/rougelike-cow/simple_test.png' });
    
    // 获取页面标题
    const title = await page.title();
    console.log('Page title:', title);
    
    await browser.close();
})();
