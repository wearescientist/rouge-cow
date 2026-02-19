const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    
    const logs = [];
    page.on('console', msg => logs.push(msg.text()));
    
    await page.goto('https://wearescientist.github.io/rouge-cow/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // 截图起点
    await page.screenshot({ path: '/root/.openclaw/workspace/rougelike-cow/test_door_start.png' });
    
    // 持续按住右键2秒
    console.log('Holding right arrow...');
    await page.keyboard.down('d');
    await page.waitForTimeout(2000);
    await page.keyboard.up('d');
    
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/root/.openclaw/workspace/rougelike-cow/test_door_after.png' });
    
    // 检查是否切换了房间
    const roomInfo = await page.evaluate(() => {
        if (!window.game) return { error: 'no game' };
        return {
            roomId: window.game.curRoom.id,
            roomType: window.game.curRoom.type,
            enemies: window.game.curRoom.enemies.length,
            playerPos: { x: window.game.player.x, y: window.game.player.y }
        };
    });
    
    console.log('Room info:', roomInfo);
    
    await browser.close();
})();
