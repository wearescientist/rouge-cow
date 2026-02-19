const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    
    await page.goto('file:///root/.openclaw/workspace/rougelike-cow/index.html');
    await page.waitForTimeout(8000);
    
    let roomsCleared = 0;
    let maxRooms = 20; // 防止无限循环
    
    while (roomsCleared < maxRooms) {
        // 向右移动进入新房间
        await page.keyboard.down('d');
        await page.waitForTimeout(3000);
        await page.keyboard.up('d');
        await page.waitForTimeout(1000);
        
        // 检查是否游戏结束或胜利
        const state = await page.evaluate(() => window.game?.state);
        if (state === 'victory') {
            console.log('🎉 通关成功！');
            await page.screenshot({ path: '/root/.openclaw/workspace/rougelike-cow/victory.png' });
            break;
        }
        if (state === 'gameover') {
            console.log('💀 游戏结束');
            await page.screenshot({ path: '/root/.openclaw/workspace/rougelike-cow/gameover.png' });
            break;
        }
        
        roomsCleared++;
        console.log(`已探索 ${roomsCleared} 个房间`);
        
        // 每5个房间截图
        if (roomsCleared % 5 === 0) {
            await page.screenshot({ path: `/root/.openclaw/workspace/rougelike-cow/progress_${roomsCleared}.png` });
        }
    }
    
    await browser.close();
})();
