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
    
    // 截图 - 应该有敌人
    await page.screenshot({ path: '/root/.openclaw/workspace/rougelike-cow/test_melee_room.png' });
    
    // 等待一段时间让武器自动攻击
    await page.waitForTimeout(5000);
    await page.screenshot({ path: '/root/.openclaw/workspace/rougelike-cow/test_melee_attack.png' });
    
    console.log('Logs:', logs.slice(-20));
    
    await browser.close();
})();
