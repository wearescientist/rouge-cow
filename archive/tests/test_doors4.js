const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    
    await page.goto('https://wearescientist.github.io/rouge-cow/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // 持续按住右键3秒
    console.log('Holding right arrow for 3 seconds...');
    await page.keyboard.down('d');
    await page.waitForTimeout(3000);
    await page.keyboard.up('d');
    
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/root/.openclaw/workspace/rougelike-cow/test_door_3sec.png' });
    
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
