const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    
    await page.goto('file:///root/.openclaw/workspace/rougelike-cow/index.html');
    await page.waitForTimeout(5000);
    
    const directions = ['w', 'a', 's', 'd'];
    let roomsVisited = new Set();
    let lastRoom = null;
    
    for (let step = 0; step < 100; step++) {
        // 获取当前房间信息
        const gameInfo = await page.evaluate(() => {
            const g = window.game;
            if (!g) return null;
            return {
                state: g.state,
                roomId: g.curRoom?.id,
                roomType: g.curRoom?.type,
                enemies: g.curRoom?.enemies?.length || 0,
                cleared: g.curRoom?.cleared,
                hp: g.player?.hp,
                maxHp: g.player?.maxHp,
                lv: g.player?.lv
            };
        });
        
        if (!gameInfo) {
            console.log('无法获取游戏状态');
            break;
        }
        
        console.log(`Step ${step}: ${gameInfo.roomType}房间, 敌人:${gameInfo.enemies}, HP:${gameInfo.hp}/${gameInfo.maxHp}, Lv:${gameInfo.lv}`);
        
        if (gameInfo.state === 'victory') {
            console.log('🎉 通关成功！');
            await page.screenshot({ path: '/root/.openclaw/workspace/rougelike-cow/victory.png' });
            break;
        }
        if (gameInfo.state === 'gameover') {
            console.log('💀 游戏结束');
            await page.screenshot({ path: '/root/.openclaw/workspace/rougelike-cow/gameover.png' });
            break;
        }
        
        // 如果有敌人，在房间里移动战斗
        if (gameInfo.enemies > 0) {
            // 随机移动战斗
            for (let i = 0; i < 10; i++) {
                const dir = directions[Math.floor(Math.random() * 4)];
                await page.keyboard.down(dir);
                await page.waitForTimeout(200);
                await page.keyboard.up(dir);
            }
        }
        
        // 如果房间清理了，找门进入下一个房间
        if (gameInfo.cleared) {
            // 尝试各个方向找门
            for (const dir of directions) {
                await page.keyboard.down(dir);
                await page.waitForTimeout(800);
                await page.keyboard.up(dir);
                await page.waitForTimeout(500);
                
                // 检查是否换了房间
                const newInfo = await page.evaluate(() => window.game?.curRoom?.id);
                if (newInfo !== gameInfo.roomId) {
                    console.log(`  进入新房间: ${newInfo}`);
                    break;
                }
            }
        }
        
        // 每10步截图
        if (step % 10 === 0) {
            await page.screenshot({ path: `/root/.openclaw/workspace/rougelike-cow/step_${step}.png` });
        }
        
        await page.waitForTimeout(500);
    }
    
    await browser.close();
})();
