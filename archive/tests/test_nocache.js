const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext({
        bypassCSP: true,
        javaScriptEnabled: true
    });
    const page = await context.newPage({ viewport: { width: 1200, height: 800 } });
    
    // 拦截请求，禁用缓存
    await page.route('**/*', route => {
        route.continue({ headers: { 'Cache-Control': 'no-cache' } });
    });
    
    page.on('console', msg => {
        if (msg.type() === 'error') console.log('CONSOLE ERROR:', msg.text());
    });
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    
    await page.goto('https://wearescientist.github.io/rouge-cow/', { 
        waitUntil: 'networkidle',
        timeout: 60000
    });
    
    // 等待加载完成
    await page.waitForFunction(() => {
        const loading = document.getElementById('loading');
        return loading && loading.classList.contains('hidden');
    }, { timeout: 30000 }).catch(() => console.log('Loading timeout'));
    
    await page.waitForTimeout(2000);
    
    const status = await page.evaluate(() => ({
        gameExists: typeof window.game !== 'undefined',
        roomType: window.game?.curRoom?.type
    }));
    
    console.log('Status:', status);
    await page.screenshot({ path: '/root/.openclaw/workspace/rougelike-cow/test_status.png' });
    
    await browser.close();
})();
