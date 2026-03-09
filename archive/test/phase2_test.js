/**
 * Phase 2 自检脚本
 * 测试核心系统迁移
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

console.log('=== Phase 2 自检开始 ===\n');

// 测试 1: 检查新系统文件
test('Phase 2 系统文件检查', () => {
    const requiredFiles = [
        'src/systems/InputSystem.js',
        'src/systems/PlayerControllerSystem.js',
        'src/systems/WeaponSystem.js',
        'src/systems/EnemySpawnSystem.js',
        'src/systems/AISystem.js',
        'src/systems/ItemSystem.js'
    ];
    
    for (const file of requiredFiles) {
        const fullPath = path.join(__dirname, '..', file);
        assert(fs.existsSync(fullPath), `文件存在: ${file}`);
    }
});

// 测试 2: InputSystem 检查
test('InputSystem 功能检查', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'src/systems/InputSystem.js'), 'utf-8');
    
    assert(content.includes('class InputSystem'), 'InputSystem 类存在');
    assert(content.includes('keys'), '键盘输入处理');
    assert(content.includes('mouse'), '鼠标输入处理');
    assert(content.includes('getMovementInput'), '移动输入方法');
    assert(content.includes('isActionDown'), '动作检测方法');
});

// 测试 3: PlayerControllerSystem 检查
test('PlayerControllerSystem 功能检查', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'src/systems/PlayerControllerSystem.js'), 'utf-8');
    
    assert(content.includes('class PlayerControllerSystem'), 'PlayerControllerSystem 类存在');
    assert(content.includes('tryDash'), '翻滚功能');
    assert(content.includes('tryAttack'), '攻击功能');
    assert(content.includes('switchWeaponSlot'), '武器切换功能');
    assert(content.includes('pickupWeapon'), '武器拾取功能');
});

// 测试 4: WeaponSystem 检查
test('WeaponSystem 功能检查', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'src/systems/WeaponSystem.js'), 'utf-8');
    
    assert(content.includes('class WeaponSystem'), 'WeaponSystem 类存在');
    assert(content.includes('weaponDatabase'), '武器数据库');
    assert(content.includes('createWeapon'), '创建武器方法');
    assert(content.includes('performAttack'), '执行攻击方法');
    assert(content.includes('performMeleeAttack'), '近战攻击');
    assert(content.includes('performRangedAttack'), '远程攻击');
    assert(content.includes('findNearestEnemy'), '追踪目标');
});

// 测试 5: EnemySpawnSystem 检查
test('EnemySpawnSystem 功能检查', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'src/systems/EnemySpawnSystem.js'), 'utf-8');
    
    assert(content.includes('class EnemySpawnSystem'), 'EnemySpawnSystem 类存在');
    assert(content.includes('startWave'), '开始波次');
    assert(content.includes('spawnEnemy'), '生成敌人');
    assert(content.includes('spawnBoss'), '生成Boss');
    assert(content.includes('selectEnemyType'), '选择敌人类型');
    assert(content.includes('difficultyMultiplier'), '难度系数');
});

// 测试 6: AISystem 检查
test('AISystem 功能检查', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'src/systems/AISystem.js'), 'utf-8');
    
    assert(content.includes('class AISystem'), 'AISystem 类存在');
    assert(content.includes('currentState'), 'AI 状态');
    assert(content.includes('chase'), '追踪状态');
    assert(content.includes('attack'), '攻击状态');
    assert(content.includes('patrol'), '巡逻状态');
    assert(content.includes('findTarget'), '查找目标');
});

// 测试 7: ItemSystem 检查
test('ItemSystem 功能检查', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'src/systems/ItemSystem.js'), 'utf-8');
    
    assert(content.includes('class ItemSystem'), 'ItemSystem 类存在');
    assert(content.includes('itemDatabase'), '道具数据库');
    assert(content.includes('passiveDatabase'), '被动道具数据库');
    assert(content.includes('pickupItem'), '拾取道具');
    assert(content.includes('applyConsumable'), '消耗品效果');
    assert(content.includes('spawnItem'), '生成道具');
    assert(content.includes('spawnDropsFromEnemy'), '敌人掉落');
});

// 测试 8: 武器数据检查
test('武器数据库完整性', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'src/systems/WeaponSystem.js'), 'utf-8');
    
    const weaponTypes = ['sword', 'bow', 'spear', 'wand'];
    for (const type of weaponTypes) {
        assert(content.includes(`'${type}'`), `武器类型: ${type}`);
    }
    
    assert(content.includes('melee'), '近战类型');
    assert(content.includes('ranged'), '远程类型');
});

// 测试 9: 道具数据检查
test('道具数据库完整性', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'src/systems/ItemSystem.js'), 'utf-8');
    
    const itemTypes = ['health_potion', 'gold', 'exp_orb'];
    for (const type of itemTypes) {
        assert(content.includes(`'${type}'`), `道具类型: ${type}`);
    }
    
    const passives = ['power_glove', 'swift_boots', 'vitality_amulet'];
    for (const passive of passives) {
        assert(content.includes(`'${passive}'`), `被动道具: ${passive}`);
    }
});

// 测试 10: 代码质量检查
test('Phase 2 代码质量', () => {
    const files = [
        'src/systems/PlayerControllerSystem.js',
        'src/systems/WeaponSystem.js',
        'src/systems/AISystem.js',
        'src/systems/ItemSystem.js'
    ];
    
    for (const file of files) {
        const content = fs.readFileSync(path.join(__dirname, '..', file), 'utf-8');
        
        // 检查有注释
        assert(content.includes('/**') || content.includes('//'), `${file} 有注释`);
        
        // 检查有错误处理
        assert(content.includes('if (') || content.includes('try'), `${file} 有条件判断`);
    }
});

// ==================== 总结 ====================
console.log('\n=== Phase 2 自检结果 ===');
console.log(`测试通过: ${testsPassed}/${testsRun}`);
console.log(`通过率: ${((testsPassed/testsRun)*100).toFixed(1)}%`);

if (testsPassed === testsRun) {
    console.log('\n✅ Phase 2 通过！可以进入 Phase 3');
    process.exit(0);
} else {
    console.log('\n❌ Phase 2 有测试失败');
    process.exit(1);
}
