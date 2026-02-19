const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testGame() {
    console.log('🎮 测试 v0.7.1 游戏功能...');
    
    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
        viewport: { width: 1200, height: 800 }
    });
    
    const page = await context.newPage();
    
    // 启用控制台日志
    page.on('console', msg => {
        console.log('📝', msg.text());
    });
    
    const gamePath = path.join(__dirname, 'index.html');
    await page.goto('file://' + gamePath);
    
    console.log('⏳ 等待游戏加载...');
    await page.waitForTimeout(3000);
    
    // 点击开始按钮
    await page.click('#startGameBtn');
    await page.waitForTimeout(1000);
    
    // 截图：游戏开始
    await page.screenshot({ path: 'v071_test_1_start.png' });
    console.log('✓ 截图：游戏开始');
    
    // 测试移动
    console.log('🎮 测试移动...');
    for (let i = 0; i < 5; i++) {
        await page.keyboard.press('w');
        await page.waitForTimeout(100);
        await page.keyboard.press('d');
        await page.waitForTimeout(100);
    }
    await page.screenshot({ path: 'v071_test_2_move.png' });
    console.log('✓ 截图：移动后');
    
    // 测试穿墙修复 - 移动到边界
    console.log('🧱 测试边界...');
    // 移动到左上角
    for (let i = 0; i < 20; i++) {
        await page.keyboard.press('a');
        await page.waitForTimeout(50);
    }
    for (let i = 0; i < 20; i++) {
        await page.keyboard.press('w');
        await page.waitForTimeout(50);
    }
    await page.screenshot({ path: 'v071_test_3_corner.png' });
    console.log('✓ 截图：角落（测试穿墙修复）');
    
    // 开启无敌模式
    await page.keyboard.press('g');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'v071_test_4_godmode.png' });
    console.log('✓ 截图：无敌模式');
    
    // 测试道具
    await page.keyboard.press('1');
    await page.waitForTimeout(200);
    await page.keyboard.press('2');
    await page.waitForTimeout(200);
    await page.screenshot({ path: 'v071_test_5_items.png' });
    console.log('✓ 截图：使用道具');
    
    // 移动到门并进入下一个房间
    console.log('🚪 尝试进入下一个房间...');
    // 回到中心
    for (let i = 0; i < 15; i++) {
        await page.keyboard.press('d');
        await page.waitForTimeout(50);
    }
    for (let i = 0; i < 15; i++) {
        await page.keyboard.press('s');
        await page.waitForTimeout(50);
    }
    // 向下门移动
    for (let i = 0; i < 10; i++) {
        await page.keyboard.press('s');
        await page.waitForTimeout(100);
    }
    await page.waitForTimeout(1000);
    await page.screenshot({ path: 'v071_test_6_newroom.png' });
    console.log('✓ 截图：新房间');
    
    // 尝试打开商店（如果当前是商店房）
    console.log('🏪 尝试打开商店...');
    await page.keyboard.press('e');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'v071_test_7_shop.png' });
    console.log('✓ 截图：商店测试');
    
    // 关闭商店
    await page.keyboard.press('e');
    await page.waitForTimeout(500);
    
    // 最终截图
    await page.screenshot({ path: 'v071_test_final.png' });
    console.log('✓ 截图：最终状态');
    
    console.log('\n✅ 测试完成！');
    console.log('生成的截图：');
    const files = fs.readdirSync(__dirname).filter(f => f.startsWith('v071_test_'));
    files.forEach(f => console.log(`  - ${f}`));
    
    await browser.close();
}

testGame().catch(err => {
    console.error('❌ 测试失败:', err);
    process.exit(1);
});
