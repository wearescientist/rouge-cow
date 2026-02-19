const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    
    await page.goto('https://wearescientist.github.io/rouge-cow/?nocache=' + Date.now(), { 
        waitUntil: 'networkidle'
    });
    await page.waitForTimeout(10000);
    
    const status = await page.evaluate(() => ({
        gameExists: typeof window.game !== 'undefined',
        roomType: window.game?.curRoom?.type
    }));
    
    console.log('Status:', status);
    
    if (status.gameExists) {
        await page.screenshot({ path: '/root/.openclaw/workspace/rougelike-cow/test_v50_ok.png' });
        console.log('✅ v5.0 运行正常！');
    } else {
        console.log('❌ v5.0 也有问题');
    }
    
    await browser.close();
})();
