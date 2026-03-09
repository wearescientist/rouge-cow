/**
 * Phase 1 自检脚本 (Node.js 版本)
 * 测试 ECS 基础架构
 */

const fs = require('fs');
const path = require('path');

// 简单的测试框架
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
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

console.log('=== Phase 1 自检开始 ===\n');

// 测试 1: 检查文件结构
test('文件结构检查', () => {
    const requiredFiles = [
        'src/ecs/Component.js',
        'src/ecs/Entity.js',
        'src/ecs/World.js',
        'src/ecs/SystemManager.js',
        'src/systems/MovementSystem.js',
        'src/systems/CollisionSystem.js',
        'src/systems/CombatSystem.js',
        'src/systems/RenderSystem.js',
        'src/Game.js'
    ];
    
    for (const file of requiredFiles) {
        const fullPath = path.join(__dirname, '..', file);
        assert(fs.existsSync(fullPath), `文件存在: ${file}`);
        const content = fs.readFileSync(fullPath, 'utf-8');
        assert(content.length > 0, `文件非空: ${file}`);
    }
});

// 测试 2: 检查 Component 定义
test('Component 类定义检查', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'src/ecs/Component.js'), 'utf-8');
    
    // 检查基类
    assert(content.includes('class Component'), 'Component 基类存在');
    
    // 检查核心组件
    const requiredComponents = [
        'TransformComponent',
        'SpriteComponent',
        'MovementComponent',
        'HealthComponent',
        'WeaponComponent',
        'PlayerComponent',
        'EnemyComponent',
        'ColliderComponent',
        'ItemComponent',
        'ProjectileComponent'
    ];
    
    for (const comp of requiredComponents) {
        assert(content.includes(`class ${comp}`), `组件存在: ${comp}`);
    }
});

// 测试 3: 检查 World 类
test('World 类功能检查', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'src/ecs/World.js'), 'utf-8');
    
    // 检查核心方法
    const requiredMethods = [
        'createEntity',
        'destroyEntity',
        'getEntitiesWithComponents',
        'addSystem',
        'update',
        'createPlayer',
        'createEnemy',
        'createItem',
        'createProjectile'
    ];
    
    for (const method of requiredMethods) {
        assert(content.includes(method), `方法存在: ${method}`);
    }
    
    // 检查实体池
    assert(content.includes('entityPool'), '实体池存在');
    assert(content.includes('_registerComponent'), '组件注册存在');
});

// 测试 4: 检查系统
test('Systems 功能检查', () => {
    const systems = [
        { file: 'MovementSystem.js', methods: ['update', 'setInput', 'startDash'] },
        { file: 'CollisionSystem.js', methods: ['update', 'intersect', 'canCollide'] },
        { file: 'CombatSystem.js', methods: ['update', 'dealDamage', 'heal', 'performAttack'] },
        { file: 'RenderSystem.js', methods: ['update', 'render', 'setCameraTarget'] }
    ];
    
    for (const sys of systems) {
        const content = fs.readFileSync(path.join(__dirname, '..', 'src/systems', sys.file), 'utf-8');
        assert(content.includes('class'), `${sys.file} 有类定义`);
        
        for (const method of sys.methods) {
            assert(content.includes(method), `${sys.file} 有方法: ${method}`);
        }
    }
});

// 测试 5: 检查 Game 类
test('Game 类功能检查', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'src/Game.js'), 'utf-8');
    
    assert(content.includes('class Game'), 'Game 类存在');
    assert(content.includes('init()'), 'init 方法存在');
    assert(content.includes('gameLoop()'), 'gameLoop 方法存在');
    assert(content.includes('update('), 'update 方法存在');
    assert(content.includes('render('), 'render 方法存在');
    assert(content.includes('initSystems('), 'initSystems 方法存在');
    assert(content.includes('initInput('), 'initInput 方法存在');
});

// 测试 6: 检查代码风格
test('代码风格检查', () => {
    const files = [
        'src/ecs/World.js',
        'src/Game.js'
    ];
    
    for (const file of files) {
        const content = fs.readFileSync(path.join(__dirname, '..', file), 'utf-8');
        
        // 检查是否使用严格模式或类
        assert(content.includes('class ') || content.includes('use strict'), `${file} 使用现代 JS`);
        
        // 检查是否有注释
        assert(content.includes('/**') || content.includes('//'), `${file} 有注释`);
    }
});

// 测试 7: 检查导出
test('模块导出检查', () => {
    const files = [
        { path: 'src/ecs/World.js', exports: ['World'] },
        { path: 'src/ecs/Entity.js', exports: ['Entity'] },
        { path: 'src/Game.js', exports: ['Game'] }
    ];
    
    for (const file of files) {
        const content = fs.readFileSync(path.join(__dirname, '..', file.path), 'utf-8');
        
        for (const exp of file.exports) {
            assert(
                content.includes(`window.${exp}`) || content.includes(`module.exports`),
                `${file.path} 导出 ${exp}`
            );
        }
    }
});

// 测试 8: 检查 QuadTree 集成
test('QuadTree 集成检查', () => {
    const collisionContent = fs.readFileSync(path.join(__dirname, '..', 'src/systems/CollisionSystem.js'), 'utf-8');
    
    assert(collisionContent.includes('QuadTree'), 'CollisionSystem 使用 QuadTree');
    assert(collisionContent.includes('quadTree.insert'), '使用 QuadTree 插入');
    assert(collisionContent.includes('quadTree.query'), '使用 QuadTree 查询');
});

// ==================== 总结 ====================
console.log('\n=== Phase 1 自检结果 ===');
console.log(`测试通过: ${testsPassed}/${testsRun}`);
console.log(`通过率: ${((testsPassed/testsRun)*100).toFixed(1)}%`);

if (testsPassed === testsRun) {
    console.log('\n✅ Phase 1 通过！可以进入 Phase 2');
    process.exit(0);
} else {
    console.log('\n❌ Phase 1 有测试失败，请修复后重试');
    process.exit(1);
}
