const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    
    const logs = [];
    page.on('console', msg => logs.push(msg.text()));
    
    await page.goto('https://wearescientist.github.io/rouge-cow/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // 进入战斗房间
    await page.keyboard.down('d');
    await page.waitForTimeout(3000);
    await page.keyboard.up('d');
    await page.waitForTimeout(1000);
    
    // 截图 - 普通状态
    await page.screenshot({ path: '/root/.openclaw/workspace/rougelike-cow/test_normal.png' });
    
    // 按空格激活地脉共鸣
    await page.keyboard.press(' ');
    await page.waitForTimeout(500);
    
    // 截图 - 激活状态
    await page.screenshot({ path: '/root/.openclaw/workspace/rougelike-cow/test_resonance.png' });
    
    console.log('Logs:', logs.slice(-10));
    
    await browser.close();
})();
