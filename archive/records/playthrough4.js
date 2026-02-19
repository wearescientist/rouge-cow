const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    
    await page.goto('file:///root/.openclaw/workspace/rougelike-cow/index.html');
    await page.waitForTimeout(5000);
    
    console.log('游戏开始 - 尝试通关');
    await page.screenshot({ path: '/root/.openclaw/workspace/rougelike-cow/run_start.png' });
    
    // 门的坐标
    const doors = {
        up: { x: 450, y: 50 },
        down: { x: 450, y: 550 },
        left: { x: 50, y: 300 },
        right: { x: 850, y: 300 }
    };
    
    const doorKeys = ['up', 'down', 'left', 'right'];
    let currentDoorIdx = 0;
    
    for (let step = 0; step < 120; step++) {
        // 获取游戏信息
        const info = await page.evaluate(() => {
            const g = window.game;
            return g ? {
                roomType: g.curRoom?.type,
                enemies: g.curRoom?.enemies?.length || 0,
                cleared: g.curRoom?.cleared,
                state: g.state,
                hp: g.player?.hp,
                lv: g.player?.lv
            } : null;
        });
        
        if (!info) continue;
        
        if (info.state === 'victory') {
            console.log('🎉 通关成功！');
            await page.screenshot({ path: '/root/.openclaw/workspace/rougelike-cow/run_victory.png' });
            break;
        }
        if (info.state === 'gameover') {
            console.log('💀 游戏结束');
            await page.screenshot({ path: '/root/.openclaw/workspace/rougelike-cow/run_gameover.png' });
            break;
        }
        
        // 如果有敌人，随机移动战斗
        if (info.enemies > 0) {
            console.log(`Step ${step}: 战斗! 敌人:${info.enemies} HP:${info.hp} Lv:${info.lv}`);
            for (let i = 0; i < 5; i++) {
                const dirs = ['w', 'a', 's', 'd'];
                const dir = dirs[Math.floor(Math.random() * 4)];
                await page.keyboard.down(dir);
                await page.waitForTimeout(300);
                await page.keyboard.up(dir);
            }
        }
        // 如果房间清理了，尝试进入下一个房间
        else if (info.cleared) {
            const door = doorKeys[currentDoorIdx % 4];
            console.log(`Step ${step}: 寻找${door}门...`);
            
            // 向门移动
            const target = doors[door];
            const moves = [
                target.y < 300 ? 'w' : target.y > 300 ? 's' : null,
                target.x < 450 ? 'a' : target.x > 450 ? 'd' : null
            ].filter(Boolean);
            
            for (const dir of moves) {
                await page.keyboard.down(dir);
                await page.waitForTimeout(600);
                await page.keyboard.up(dir);
            }
            
            currentDoorIdx++;
        }
        
        // 每20步截图
        if (step % 20 === 0) {
            await page.screenshot({ path: `/root/.openclaw/workspace/rougelike-cow/run_${step}.png` });
        }
        
        await page.waitForTimeout(200);
    }
    
    await page.screenshot({ path: '/root/.openclaw/workspace/rougelike-cow/run_final.png' });
    console.log('游戏结束');
    await browser.close();
})();
