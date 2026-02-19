const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    
    await page.goto('file:///root/.openclaw/workspace/rougelike-cow/index.html');
    await page.waitForTimeout(6000);
    
    // 截图起点
    await page.screenshot({ path: '/root/.openclaw/workspace/rougelike-cow/v511_start.png' });
    
    // 向右走到门（更长时间）
    console.log('向右走到门...');
    await page.keyboard.down('d');
    await page.waitForTimeout(3000);
    await page.keyboard.up('d');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/root/.openclaw/workspace/rougelike-cow/v511_door.png' });
    
    // 继续向右进入新房间
    console.log('进入新房间...');
    await page.keyboard.down('d');
    await page.waitForTimeout(2000);
    await page.keyboard.up('d');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/root/.openclaw/workspace/rougelike-cow/v511_newroom.png' });
    
    console.log('测试完成');
    await browser.close();
})();
