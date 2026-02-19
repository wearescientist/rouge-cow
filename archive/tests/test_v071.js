const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testGame() {
    console.log('🎮 启动肉鸽牛牛 v0.7.1 测试...');
    
    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
        viewport: { width: 1200, height: 800 }
    });
    
    const page = await context.newPage();
    
    // 加载游戏
    const gamePath = path.join(__dirname, 'index.html');
    await page.goto('file://' + gamePath);
    
    console.log('⏳ 等待游戏加载...');
    await page.waitForTimeout(3000);
    
    // 截图：开始画面
    await page.screenshot({ path: 'test_v071_start.png' });
    console.log('✓ 截图：开始画面');
    
    // 点击开始按钮
    await page.click('#startGameBtn');
    await page.waitForTimeout(1000);
    
    // 截图：游戏初始状态
    await page.screenshot({ path: 'test_v071_game.png' });
    console.log('✓ 截图：游戏初始状态');
    
    // 测试移动（WASD）
    console.log('🎮 测试玩家移动...');
    await page.keyboard.press('w');
    await page.waitForTimeout(200);
    await page.keyboard.press('d');
    await page.waitForTimeout(200);
    await page.keyboard.press('s');
    await page.waitForTimeout(200);
    await page.keyboard.press('a');
    await page.waitForTimeout(200);
    
    await page.screenshot({ path: 'test_v071_move.png' });
    console.log('✓ 截图：移动测试');
    
    // 测试边界（尝试穿墙）
    console.log('🧱 测试边界（防止穿墙）...');
    // 移动到左边界
    for (let i = 0; i < 20; i++) {
        await page.keyboard.press('a');
        await page.waitForTimeout(50);
    }
    await page.screenshot({ path: 'test_v071_left_wall.png' });
    console.log('✓ 截图：左边界测试');
    
    // 移动到上边界
    for (let i = 0; i < 20; i++) {
        await page.keyboard.press('w');
        await page.waitForTimeout(50);
    }
    await page.screenshot({ path: 'test_v071_top_wall.png' });
    console.log('✓ 截图：上边界测试');
    
    // 开启无敌模式并寻找商店
    console.log('👑 开启无敌模式...');
    await page.keyboard.press('g');
    await page.waitForTimeout(500);
    
    // 测试道具拾取
    console.log('📦 测试道具系统...');
    await page.keyboard.press('1');
    await page.waitForTimeout(200);
    await page.keyboard.press('2');
    await page.waitForTimeout(200);
    
    await page.screenshot({ path: 'test_v071_items.png' });
    console.log('✓ 截图：道具测试');
    
    // 测试商店（如果当前是商店房）
    console.log('🏪 测试商店系统...');
    await page.keyboard.press('e');
    await page.waitForTimeout(500);
    await page.screenshot({ path: 'test_v071_shop.png' });
    console.log('✓ 截图：商店界面');
    
    // 关闭商店
    await page.keyboard.press('e');
    await page.waitForTimeout(500);
    
    // 最终状态截图
    await page.screenshot({ path: 'test_v071_final.png' });
    console.log('✓ 截图：最终状态');
    
    console.log('\n✅ 测试完成！');
    console.log('生成的截图：');
    console.log('  - test_v071_start.png');
    console.log('  - test_v071_game.png');
    console.log('  - test_v071_move.png');
    console.log('  - test_v071_left_wall.png');
    console.log('  - test_v071_top_wall.png');
    console.log('  - test_v071_items.png');
    console.log('  - test_v071_shop.png');
    console.log('  - test_v071_final.png');
    
    await browser.close();
}

testGame().catch(err => {
    console.error('❌ 测试失败:', err);
    process.exit(1);
});
