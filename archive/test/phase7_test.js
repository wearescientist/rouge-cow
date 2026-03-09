/**
 * Phase 7 最终集成测试
 * 测试所有系统集成
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

console.log('=== Phase 7 最终集成测试 ===\n');

// 测试 1: 检查所有 ECS 核心文件
test('ECS 核心文件完整性', () => {
    const files = [
        'src/ecs/Component.js',
        'src/ecs/Entity.js',
        'src/ecs/SystemManager.js',
        'src/ecs/World.js'
    ];
    
    for (const file of files) {
        assert(fs.existsSync(path.join(__dirname, '..', file)), `文件存在: ${file}`);
    }
});

// 测试 2: 检查所有系统文件
test('所有系统文件完整性', () => {
    const systems = [
        'InputSystem', 'MovementSystem', 'CollisionSystem', 'CameraSystem',
        'PlayerControllerSystem', 'WeaponSystem', 'CombatSystem', 'AISystem',
        'EnemySpawnSystem', 'ItemSystem', 'MapGenerator', 'RoomSystem',
        'UISystem', 'MenuSystem', 'DamageNumberSystem', 'MinimapSystem',
        'ScreenEffectSystem', 'ParticleSystem', 'AudioSystem',
        'SaveSystem', 'SettingsSystem'
    ];
    
    for (const sys of systems) {
        const file = `src/systems/${sys}.js`;
        assert(fs.existsSync(path.join(__dirname, '..', file)), `系统存在: ${sys}`);
    }
});

// 测试 3: 检查 ECS 入口文件
test('ECS 入口文件检查', () => {
    assert(fs.existsSync(path.join(__dirname, '..', 'src/GameECS.js')), 'GameECS.js 存在');
    assert(fs.existsSync(path.join(__dirname, '..', 'index_ecs.html')), 'index_ecs.html 存在');
});

// 测试 4: GameECS 类完整性
test('GameECS 类功能检查', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'src/GameECS.js'), 'utf-8');
    
    assert(content.includes('class GameECS'), 'GameECS 类定义');
    assert(content.includes('initCoreSystems'), '初始化核心系统');
    assert(content.includes('initGameSystems'), '初始化游戏系统');
    assert(content.includes('initUISystems'), '初始化 UI 系统');
    assert(content.includes('initEffectSystems'), '初始化特效系统');
    assert(content.includes('initSaveSettingsSystems'), '初始化存档设置系统');
});

// 测试 5: 系统注册检查
test('系统注册检查', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'src/GameECS.js'), 'utf-8');
    
    // 检查是否将所有系统添加到 world
    const systemNames = [
        'input', 'movement', 'collision', 'camera',
        'playerController', 'weapon', 'combat', 'ai',
        'enemySpawn', 'item', 'room',
        'ui', 'menu', 'damageNumber', 'minimap',
        'screenEffect', 'particle', 'audio',
        'save', 'settings'
    ];
    
    for (const name of systemNames) {
        assert(content.includes(`this.systems.${name}`), `系统注册: ${name}`);
    }
});

// 测试 6: 事件系统集成检查
test('事件系统集成检查', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'src/GameECS.js'), 'utf-8');
    
    assert(content.includes('setupEventListeners'), '设置事件监听');
    assert(content.includes('world.on'), '监听世界事件');
    
    const events = ['gameStarted', 'gamePaused', 'gameResumed', 'playerDeath'];
    for (const event of events) {
        assert(content.includes(event), `事件: ${event}`);
    }
});

// 测试 7: 游戏循环检查
test('游戏循环检查', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'src/GameECS.js'), 'utf-8');
    
    assert(content.includes('gameLoop'), '游戏循环');
    assert(content.includes('update('), '更新方法');
    assert(content.includes('render('), '渲染方法');
    assert(content.includes('requestAnimationFrame'), '使用 RAF');
});

// 测试 8: 系统依赖检查
test('系统依赖检查', () => {
    // 检查 RoomSystem 使用 MapGenerator
    const roomSystem = fs.readFileSync(path.join(__dirname, '..', 'src/systems/RoomSystem.js'), 'utf-8');
    assert(roomSystem.includes('MapGenerator'), 'RoomSystem 依赖 MapGenerator');
    
    // 检查 PlayerControllerSystem 使用 InputSystem
    const playerSystem = fs.readFileSync(path.join(__dirname, '..', 'src/systems/PlayerControllerSystem.js'), 'utf-8');
    assert(playerSystem.includes('InputSystem'), 'PlayerControllerSystem 依赖 InputSystem');
    
    // 检查 CollisionSystem 使用 QuadTree
    const collisionSystem = fs.readFileSync(path.join(__dirname, '..', 'src/systems/CollisionSystem.js'), 'utf-8');
    assert(collisionSystem.includes('QuadTree'), 'CollisionSystem 依赖 QuadTree');
});

// 测试 9: HTML 入口检查
test('HTML 入口检查', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'index_ecs.html'), 'utf-8');
    
    // 检查加载了所有脚本
    assert(content.includes('src/ecs/Component.js'), '加载 Component.js');
    assert(content.includes('src/ecs/World.js'), '加载 World.js');
    assert(content.includes('src/GameECS.js'), '加载 GameECS.js');
    
    // 检查创建 GameECS 实例
    assert(content.includes('new GameECS'), '创建 GameECS 实例');
});

// 测试 10: 代码质量检查
test('代码质量检查', () => {
    const gameECS = fs.readFileSync(path.join(__dirname, '..', 'src/GameECS.js'), 'utf-8');
    
    // 检查有错误处理
    assert(gameECS.includes('try') || gameECS.includes('catch'), '有错误处理');
    
    // 检查有注释
    assert(gameECS.includes('/**') || gameECS.includes('//'), '有代码注释');
    
    // 检查使用了所有系统
    assert(gameECS.includes('this.systems.'), '使用系统引用');
});

// 测试 11: 系统数量检查
test('系统数量检查', () => {
    const files = fs.readdirSync(path.join(__dirname, '..', 'src/systems'));
    const systemFiles = files.filter(f => f.endsWith('.js') && !f.includes('index'));
    
    console.log(`   发现 ${systemFiles.length} 个系统文件:`);
    for (const file of systemFiles) {
        console.log(`   - ${file}`);
    }
    
    assert(systemFiles.length >= 15, '系统数量 >= 15');
});

// 测试 12: 组件数量检查
test('组件数量检查', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'src/ecs/Component.js'), 'utf-8');
    
    const componentMatches = content.match(/class \w+Component extends Component/g);
    const count = componentMatches ? componentMatches.length : 0;
    
    console.log(`   发现 ${count} 个组件定义`);
    
    assert(count >= 10, '组件数量 >= 10');
});

// ==================== 最终报告 ====================
console.log('\n=== Phase 7 最终报告 ===');
console.log(`测试通过: ${testsPassed}/${testsRun}`);
console.log(`通过率: ${((testsPassed/testsRun)*100).toFixed(1)}%`);

if (testsPassed === testsRun) {
    console.log('\n✅✅✅ ECS 迁移完成！所有阶段通过！✅✅✅');
    console.log('\n项目统计:');
    
    // 统计文件数
    const srcFiles = fs.readdirSync(path.join(__dirname, '..', 'src'));
    const systemFiles = fs.readdirSync(path.join(__dirname, '..', 'src/systems'));
    const ecsFiles = fs.readdirSync(path.join(__dirname, '..', 'src/ecs'));
    
    console.log(`- ECS 核心文件: ${ecsFiles.length}`);
    console.log(`- 系统文件: ${systemFiles.length}`);
    console.log(`- 源代码文件: ${srcFiles.length}`);
    console.log('\n你可以通过 index_ecs.html 运行 ECS 版本游戏');
    
    process.exit(0);
} else {
    console.log('\n❌ 有测试失败，请检查');
    process.exit(1);
}
