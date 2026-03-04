/**
 * 自动测试：验证重开游戏后能否攻击
 * 
 * 使用方法：在浏览器控制台运行 testRestartAttack()
 */

window.testRestartAttack = async function() {
    console.log('🧪 开始测试：重开游戏后能否攻击');
    
    const game = window.game;
    if (!game) {
        console.error('❌ 游戏未加载');
        return;
    }
    
    // 测试步骤1：设置5倍速并开始游戏
    console.log('🧪 步骤1：设置5倍速');
    game.setSpeed(5);
    await sleep(1000);
    
    // 检查是否能攻击（观察bullets数组）
    const initialBullets = game.bullets.length;
    console.log(`🧪 初始子弹数: ${initialBullets}`);
    
    // 等待一段时间观察
    await sleep(3000);
    const afterBullets = game.bullets.length;
    console.log(`🧪 3秒后子弹数: ${afterBullets}`);
    
    if (afterBullets > initialBullets) {
        console.log('✅ 第一轮游戏可以攻击');
    } else {
        console.log('⚠️ 第一轮游戏可能没有攻击（可能是没有敌人）');
    }
    
    // 测试步骤2：触发游戏结束（模拟死亡）
    console.log('🧪 步骤2：触发游戏结束');
    game.state = 'gameover';
    game.endGame('dead');
    await sleep(1000);
    
    // 测试步骤3：点击返回主菜单
    console.log('🧪 步骤3：返回主菜单');
    game.returnToMainMenu();
    await sleep(1000);
    
    // 测试步骤4：再次开始游戏
    console.log('🧪 步骤4：重新开始游戏');
    document.getElementById('story').style.display = 'none';
    game.state = 'playing';
    document.getElementById('mainLayout').classList.add('active');
    document.getElementById('topScoreBar').style.display = 'block';
    game.camera.updateViewport();
    game.scoreManager.start();
    
    // 关键：重置时间戳
    game.lastT = null;
    game.timeScale = 1;
    game.setSpeed(1);
    
    await sleep(1000);
    
    // 测试步骤5：检查能否攻击
    console.log('🧪 步骤5：检查能否攻击');
    const bulletsBefore = game.bullets.length;
    console.log(`🧪 重开后初始子弹数: ${bulletsBefore}`);
    console.log(`🧪 timeScale: ${game.timeScale}`);
    console.log(`🧪 weapons: ${game.weapons.length}`);
    console.log(`🧪 weapons[0].cd: ${game.weapons[0]?.cd}`);
    
    await sleep(3000);
    
    const bulletsAfter = game.bullets.length;
    console.log(`🧪 3秒后子弹数: ${bulletsAfter}`);
    
    if (bulletsAfter > bulletsBefore) {
        console.log('✅ 测试通过：重开游戏后可以攻击！');
        return true;
    } else {
        console.log('❌ 测试失败：重开游戏后不能攻击！');
        console.log(`   timeScale: ${game.timeScale}`);
        console.log(`   lastT: ${game.lastT}`);
        console.log(`   weapons[0].cd: ${game.weapons[0]?.cd}`);
        return false;
    }
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// 如果URL包含 test=restart，自动运行测试
if (window.location.search.includes('test=restart')) {
    console.log('🧪 检测到测试参数，自动运行测试');
    setTimeout(() => testRestartAttack(), 2000);
}

console.log('✅ 测试脚本已加载，运行 testRestartAttack() 开始测试');
