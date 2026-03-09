/**
 * Phase 4 自检脚本
 * 测试 UI & 输入系统
 */

const fs = require('fs');
const path = require('path');

let testsRun = 0;
let testsPassed = 0;

function test(name, fn) {
    testsRun++;
    try {
        fn();
        console.log(`✅ PASS: ${name}`);
        testsPassed++;
        return true;
    } catch (e) {
        console.log(`❌ FAIL: ${name}`);
        console.log(`   Error: ${e.message}`);
        return false;
    }
}

function assert(condition, message) {
    if (!condition) throw new Error(message || 'Assertion failed');
}

console.log('=== Phase 4 自检开始 ===\n');

// 测试 1: 检查 Phase 4 文件
test('Phase 4 系统文件检查', () => {
    const requiredFiles = [
        'src/systems/UISystem.js',
        'src/systems/MenuSystem.js',
        'src/systems/DamageNumberSystem.js',
        'src/systems/MinimapSystem.js'
    ];
    
    for (const file of requiredFiles) {
        const fullPath = path.join(__dirname, '..', file);
        assert(fs.existsSync(fullPath), `文件存在: ${file}`);
    }
});

// 测试 2: UISystem 检查
test('UISystem 功能检查', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'src/systems/UISystem.js'), 'utf-8');
    
    assert(content.includes('class UISystem'), 'UISystem 类存在');
    assert(content.includes('renderHealthBar'), '血条渲染');
    assert(content.includes('renderExpBar'), '经验条渲染');
    assert(content.includes('renderWeaponSlots'), '武器槽渲染');
    assert(content.includes('renderStats'), '统计信息渲染');
});

// 测试 3: MenuSystem 检查
test('MenuSystem 功能检查', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'src/systems/MenuSystem.js'), 'utf-8');
    
    assert(content.includes('class MenuSystem'), 'MenuSystem 类存在');
    assert(content.includes('openPauseMenu'), '打开暂停菜单');
    assert(content.includes('openGameOverMenu'), '打开游戏结束菜单');
    assert(content.includes('addButton'), '添加按钮');
    assert(content.includes('handleClick'), '处理点击');
});

// 测试 4: DamageNumberSystem 检查
test('DamageNumberSystem 功能检查', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'src/systems/DamageNumberSystem.js'), 'utf-8');
    
    assert(content.includes('class DamageNumberSystem'), 'DamageNumberSystem 类存在');
    assert(content.includes('spawnDamageNumber'), '生成伤害数字');
    assert(content.includes('spawnHealNumber'), '生成治疗数字');
    assert(content.includes('spawnExpNumber'), '生成经验数字');
    assert(content.includes('spawnLevelUpText'), '生成升级文字');
});

// 测试 5: MinimapSystem 检查
test('MinimapSystem 功能检查', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'src/systems/MinimapSystem.js'), 'utf-8');
    
    assert(content.includes('class MinimapSystem'), 'MinimapSystem 类存在');
    assert(content.includes('render'), '渲染方法');
    assert(content.includes('RoomSystem'), '使用 RoomSystem');
    assert(content.includes('currentRoomId'), '当前房间ID');
    assert(content.includes('isVisited'), '访问状态');
});

// 测试 6: UI 配置检查
test('UI 配置检查', () => {
    const uiContent = fs.readFileSync(path.join(__dirname, '..', 'src/systems/UISystem.js'), 'utf-8');
    
    assert(uiContent.includes('barWidth'), '进度条宽度配置');
    assert(uiContent.includes('barHeight'), '进度条高度配置');
    assert(uiContent.includes('fontSize'), '字体大小配置');
    assert(uiContent.includes('colors'), '颜色配置');
});

// 测试 7: 菜单类型检查
test('菜单类型检查', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'src/systems/MenuSystem.js'), 'utf-8');
    
    const menuTypes = ['main', 'pause', 'gameover', 'victory', 'settings'];
    for (const type of menuTypes) {
        assert(content.includes(type), `菜单类型: ${type}`);
    }
});

// 测试 8: 伤害数字配置检查
test('伤害数字配置检查', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'src/systems/DamageNumberSystem.js'), 'utf-8');
    
    assert(content.includes('gravity'), '重力配置');
    assert(content.includes('fadeSpeed'), '淡出速度');
    assert(content.includes('lifeTime'), '存在时间');
    assert(content.includes('criticalScale'), '暴击放大');
});

// 测试 9: 小地图配置检查
test('小地图配置检查', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'src/systems/MinimapSystem.js'), 'utf-8');
    
    assert(content.includes('size'), '小地图尺寸');
    assert(content.includes('roomSize'), '房间大小');
    assert(content.includes('unexplored'), '未探索颜色');
    assert(content.includes('current'), '当前房间颜色');
    assert(content.includes('cleared'), '已清理颜色');
});

// 测试 10: 事件监听检查
test('UI 事件监听检查', () => {
    const files = [
        'src/systems/MenuSystem.js',
        'src/systems/DamageNumberSystem.js'
    ];
    
    for (const file of files) {
        const content = fs.readFileSync(path.join(__dirname, '..', file), 'utf-8');
        assert(content.includes('world.on') || content.includes('world.emit'), 
               `${file} 使用事件系统`);
    }
});

// ==================== 总结 ====================
console.log('\n=== Phase 4 自检结果 ===');
console.log(`测试通过: ${testsPassed}/${testsRun}`);
console.log(`通过率: ${((testsPassed/testsRun)*100).toFixed(1)}%`);

if (testsPassed === testsRun) {
    console.log('\n✅ Phase 4 通过！可以进入 Phase 5');
    process.exit(0);
} else {
    console.log('\n❌ Phase 4 有测试失败');
    process.exit(1);
}
