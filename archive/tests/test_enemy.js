const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    
    const logs = [];
    page.on('console', msg => logs.push(msg.text()));
    
    await page.goto('https://wearescientist.github.io/rouge-cow/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    await page.screenshot({ path: '/root/.openclaw/workspace/rougelike-cow/test_enemy_in_start.png' });
    
    console.log('Logs:', logs.slice(-10));
    
    await browser.close();
})();
