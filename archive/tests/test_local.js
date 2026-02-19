const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    
    page.on('console', msg => {
        if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text());
    });
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    
    // 使用本地服务器
    await page.goto('http://localhost:8080/index.html', { 
        waitUntil: 'networkidle'
    });
    await page.waitForTimeout(5000);
    
    const status = await page.evaluate(() => ({
        gameExists: typeof window.game !== 'undefined',
        roomType: window.game?.curRoom?.type
    }));
    
    console.log('Status:', status);
    await page.screenshot({ path: '/root/.openclaw/workspace/rougelike-cow/test_local.png' });
    
    await browser.close();
})();
