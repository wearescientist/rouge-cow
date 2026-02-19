const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    
    await page.goto('file:///root/.openclaw/workspace/rougelike-cow/index.html');
    await page.waitForTimeout(6000);
    
    console.log('游戏开始');
    
    // 向右走到门
    console.log('向右走...');
    await page.keyboard.down('d');
    await page.waitForTimeout(2000);
    await page.keyboard.up('d');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/root/.openclaw/workspace/rougelike-cow/p5_step1.png' });
    
    // 继续向右
    console.log('继续向右...');
    await page.keyboard.down('d');
    await page.waitForTimeout(2000);
    await page.keyboard.up('d');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/root/.openclaw/workspace/rougelike-cow/p5_step2.png' });
    
    // 随机战斗
    console.log('战斗...');
    for (let i = 0; i < 10; i++) {
        const dirs = ['w', 'a', 's', 'd'];
        const dir = dirs[Math.floor(Math.random() * 4)];
        await page.keyboard.down(dir);
        await page.waitForTimeout(400);
        await page.keyboard.up(dir);
    }
    await page.screenshot({ path: '/root/.openclaw/workspace/rougelike-cow/p5_step3.png' });
    
    // 向下走
    console.log('向下走...');
    await page.keyboard.down('s');
    await page.waitForTimeout(2000);
    await page.keyboard.up('s');
    await page.waitForTimeout(1000);
    await page.screenshot({ path: '/root/.openclaw/workspace/rougelike-cow/p5_step4.png' });
    
    // 继续探索
    console.log('继续探索...');
    for (let i = 0; i < 20; i++) {
        const dirs = ['w', 'a', 's', 'd'];
        const dir = dirs[Math.floor(Math.random() * 4)];
        await page.keyboard.down(dir);
        await page.waitForTimeout(500);
        await page.keyboard.up(dir);
        
        if (i % 5 === 0) {
            await page.screenshot({ path: `/root/.openclaw/workspace/rougelike-cow/p5_fight${i}.png` });
        }
    }
    
    await page.screenshot({ path: '/root/.openclaw/workspace/rougelike-cow/p5_final.png' });
    console.log('结束');
    
    await browser.close();
})();
