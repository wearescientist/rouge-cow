const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    
    // 捕获所有控制台输出
    page.on('console', msg => {
        const type = msg.type();
        const text = msg.text();
        if (type === 'error' || text.includes('ERROR') || text.includes('Unexpected')) {
            console.log(`CONSOLE ${type}: ${text}`);
        }
    });
    
    // 捕获页面错误
    page.on('pageerror', error => {
        console.log('PAGE ERROR:', error.message);
        console.log('Stack:', error.stack);
    });
    
    await page.goto('https://wearescientist.github.io/rouge-cow/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);
    
    // 检查window.game是否存在
    const gameExists = await page.evaluate(() => typeof window.game !== 'undefined');
    console.log('Game exists:', gameExists);
    
    await browser.close();
})();
