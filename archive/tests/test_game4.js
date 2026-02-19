const { chromium } = require('playwright');

(async () => {
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport: { width: 1200, height: 800 } });
    
    // 打开游戏并捕获控制台日志
    const logs = [];
    page.on('console', msg => {
        const text = msg.text();
        logs.push(text);
        console.log('LOG:', text);
    });
    
    await page.goto('https://wearescientist.github.io/rouge-cow/', { waitUntil: 'networkidle' });
    
    // 等待加载完成
    await page.waitForTimeout(3000);
    
    // 截图
    await page.screenshot({ path: '/root/.openclaw/workspace/rougelike-cow/test_debug.png' });
    
    // 尝试所有方向
    const directions = [
        { key: 'd', name: 'right', duration: 30 },
        { key: 'a', name: 'left', duration: 30 },
        { key: 's', name: 'down', duration: 30 },
        { key: 'w', name: 'up', duration: 30 }
    ];
    
    for (const dir of directions) {
        console.log(`\nTrying ${dir.name}...`);
        
        // 先回到中心
        for (let i = 0; i < 20; i++) {
            await page.keyboard.press('s');
            await page.waitForTimeout(50);
        }
        for (let i = 0; i < 20; i++) {
            await page.keyboard.press('a');
            await page.waitForTimeout(50);
        }
        
        // 向指定方向移动
        for (let i = 0; i < dir.duration; i++) {
            await page.keyboard.press(dir.key);
            await page.waitForTimeout(50);
        }
        
        await page.waitForTimeout(500);
        await page.screenshot({ path: `/root/.openclaw/workspace/rougelike-cow/test_${dir.name}.png` });
    }
    
    console.log('\n=== All logs ===');
    logs.forEach(l => console.log(l));
    
    await browser.close();
})();
