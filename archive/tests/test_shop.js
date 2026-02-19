const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function testShopFeature() {
    console.log('🏪 测试盲眼商店系统...');
    
    const browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const context = await browser.newContext({
        viewport: { width: 1200, height: 800 }
    });
    
    const page = await context.newPage();
    
    // 注入测试代码：强制进入商店房间
    await page.addInitScript(() => {
        // 修改游戏初始化，强制第一个房间是商店
        const originalGame = window.Game;
        window.Game = class extends originalGame {
            constructor() {
                super();
                // 强制当前房间为商店
                setTimeout(() => {
                    if (this.curRoom) {
                        this.curRoom.type = 'shop';
                        this.curRoom.cleared = true;
                        this.curRoom.npc = {
                            x: 80, y: 300,
                            name: '盲眼',
                            draw: function(ctx, playerNear) {
                                ctx.fillStyle = '#1a1a2e';
                                ctx.fillRect(this.x - 35, this.y - 35, 70, 70);
                                ctx.strokeStyle = '#4a4';
                                ctx.lineWidth = 2;
                                ctx.strokeRect(this.x - 35, this.y - 35, 70, 70);
                                ctx.font = '32px Arial';
                                ctx.textAlign = 'center';
                                ctx.fillText('🦯', this.x - 8, this.y + 8);
                                ctx.fillText('👁️', this.x + 8, this.y + 8);
                                ctx.fillStyle = '#4f4';
                                ctx.font = '12px Arial';
                                ctx.fillText('盲眼', this.x, this.y + 30);
                                if (playerNear) {
                                    ctx.fillStyle = '#ff0';
                                    ctx.font = 'bold 14px Arial';
                                    ctx.fillText('按 E 打开商店', this.x, this.y - 45);
                                }
                            }
                        };
                    }
                }, 100);
            }
        };
    });
    
    const gamePath = path.join(__dirname, 'index.html');
    await page.goto('file://' + gamePath);
    
    console.log('⏳ 等待游戏加载...');
    await page.waitForTimeout(3000);
    
    // 点击开始
    await page.click('#startGameBtn');
    await page.waitForTimeout(1000);
    
    // 截图：初始状态
    await page.screenshot({ path: 'test_shop_1_start.png' });
    console.log('✓ 截图：商店房间初始状态');
    
    // 移动到NPC附近
    console.log('🚶 移动到NPC附近...');
    for (let i = 0; i < 10; i++) {
        await page.keyboard.press('a');
        await page.waitForTimeout(100);
    }
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: 'test_shop_2_near_npc.png' });
    console.log('✓ 截图：靠近NPC');
    
    // 打开商店
    console.log('🛒 打开商店...');
    await page.keyboard.press('e');
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: 'test_shop_3_open.png' });
    console.log('✓ 截图：商店界面');
    
    // 关闭商店
    console.log('🔚 关闭商店...');
    await page.keyboard.press('e');
    await page.waitForTimeout(500);
    
    await page.screenshot({ path: 'test_shop_4_close.png' });
    console.log('✓ 截图：关闭商店');
    
    // 测试边界
    console.log('🧱 测试边界防止穿墙...');
    // 尝试向左穿墙
    for (let i = 0; i < 30; i++) {
        await page.keyboard.press('a');
        await page.waitForTimeout(50);
    }
    await page.screenshot({ path: 'test_shop_5_wall_left.png' });
    console.log('✓ 截图：左边界测试');
    
    // 尝试向上穿墙
    for (let i = 0; i < 30; i++) {
        await page.keyboard.press('w');
        await page.waitForTimeout(50);
    }
    await page.screenshot({ path: 'test_shop_6_wall_top.png' });
    console.log('✓ 截图：上边界测试');
    
    console.log('\n✅ 商店测试完成！');
    
    await browser.close();
}

testShopFeature().catch(err => {
    console.error('❌ 测试失败:', err);
    process.exit(1);
});
