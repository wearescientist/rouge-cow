const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    
    await page.goto('file:///root/.openclaw/workspace/rougelike-cow/index.html');
    await page.waitForTimeout(6000);
    
    // 截图初始状态
    await page.screenshot({ path: '/root/.openclaw/workspace/rougelike-cow/start.png' });
    console.log('游戏开始');
    
    const directions = ['w', 'a', 's', 'd'];
    
    // 模拟玩家游玩 60 秒
    for (let i = 0; i < 60; i++) {
        // 随机移动
        const dir = directions[Math.floor(Math.random() * 4)];
        await page.keyboard.down(dir);
        await page.waitForTimeout(500);
        await page.keyboard.up(dir);
        
        // 每秒截图
        if (i % 5 === 0) {
            await page.screenshot({ path: `/root/.openclaw/workspace/rougelike-cow/game_${i}.png` });
            console.log(`游戏进行中... ${i}秒`);
        }
        
        await page.waitForTimeout(500);
    }
    
    // 最终截图
    await page.screenshot({ path: '/root/.openclaw/workspace/rougelike-cow/final.png' });
    console.log('游戏结束');
    
    await browser.close();
})();
