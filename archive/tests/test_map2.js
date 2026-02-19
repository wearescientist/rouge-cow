const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    
    await page.goto('https://wearescientist.github.io/rouge-cow/', { waitUntil: 'networkidle' });
    await page.waitForTimeout(5000);
    
    const mapInfo = await page.evaluate(() => {
        if (!window.game) return { error: 'No game object', windowKeys: Object.keys(window).filter(k => k.includes('game') || k.includes('Game')) };
        
        const game = window.game;
        const rooms = Array.from(game.allRooms.entries()).map(([id, room]) => ({
            id,
            type: room.type,
            enemies: room.enemies.length,
            cleared: room.cleared,
            doors: Object.entries(room.doors).map(([dir, door]) => ({
                dir,
                hasTarget: !!door,
                targetType: door?.target?.type,
                open: door?.open
            }))
        }));
        
        return {
            currentRoom: game.curRoom.id,
            currentType: game.curRoom.type,
            totalRooms: game.allRooms.size,
            rooms
        };
    });
    
    console.log('Map Info:', JSON.stringify(mapInfo, null, 2));
    
    await browser.close();
})();
