const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext({
        recordVideo: {
            dir: '/root/.openclaw/workspace/rougelike-cow/videos/',
            size: { width: 1200, height: 800 }
        }
    });
    const page = await context.newPage();
    
    await page.goto('file:///root/.openclaw/workspace/rougelike-cow/index.html');
    await page.waitForTimeout(6000);
    
    console.log('开启无敌模式...');
    await page.keyboard.press('g');
    await page.waitForTimeout(500);
    
    console.log('开始探索...');
    
    // 探索各个方向
    const directions = [
        { key: 'd', name: '右', steps: 8 },
        { key: 's', name: '下', steps: 8 },
        { key: 'a', name: '左', steps: 8 },
        { key: 'w', name: '上', steps: 8 },
        { key: 'd', name: '右', steps: 6 },
        { key: 's', name: '下', steps: 6 }
    ];
    
    for (const dir of directions) {
        console.log(`向${dir.name}探索...`);
        for (let i = 0; i < dir.steps; i++) {
            await page.keyboard.down(dir.key);
            await page.waitForTimeout(400);
            await page.keyboard.up(dir.key);
            
            // 随机战斗移动
            for (let j = 0; j < 3; j++) {
                const fightDirs = ['w', 'a', 's', 'd'];
                const fd = fightDirs[Math.floor(Math.random() * 4)];
                await page.keyboard.down(fd);
                await page.waitForTimeout(200);
                await page.keyboard.up(fd);
            }
        }
    }
    
    console.log('探索完成');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: '/root/.openclaw/workspace/rougelike-cow/godmode_final.png' });
    
    await context.close();
    await browser.close();
})();
