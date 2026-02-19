const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    
    const logs = [];
    page.on('console', msg => logs.push(msg.text()));
    
    await page.goto('https://wearescientist.github.io/rouge-cow/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(3000);
    
    // 截图起点
    await page.screenshot({ path: '/root/.openclaw/workspace/rougelike-cow/test_before_move.png' });
    
    // 持续向右移动，尝试穿过右边的门
    console.log('Moving right...');
    for (let i = 0; i < 60; i++) {
        await page.keyboard.press('d');
        await page.waitForTimeout(50);
    }
    
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/root/.openclaw/workspace/rougelike-cow/test_after_right.png' });
    
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
    console.log('Recent logs:', logs.slice(-10));
    
    await browser.close();
})();
