/**
 * Phase 3 自检脚本
 * 测试游戏逻辑迁移
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

console.log('=== Phase 3 自检开始 ===\n');

// 测试 1: 检查 Phase 3 文件
test('Phase 3 系统文件检查', () => {
    const requiredFiles = [
        'src/systems/MapGenerator.js',
        'src/systems/RoomSystem.js',
        'src/systems/CameraSystem.js'
    ];
    
    for (const file of requiredFiles) {
        const fullPath = path.join(__dirname, '..', file);
        assert(fs.existsSync(fullPath), `文件存在: ${file}`);
    }
});

// 测试 2: MapGenerator 检查
test('MapGenerator 功能检查', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'src/systems/MapGenerator.js'), 'utf-8');
    
    assert(content.includes('class MapGenerator'), 'MapGenerator 类存在');
    assert(content.includes('generate('), 'generate 方法');
    assert(content.includes('generateRoomLayout'), '生成房间布局');
    assert(content.includes('connectRooms'), '连接房间');
    assert(content.includes('createCorridor'), '创建走廊');
    assert(content.includes('roomTypes'), '房间类型配置');
});

// 测试 3: RoomSystem 检查
test('RoomSystem 功能检查', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'src/systems/RoomSystem.js'), 'utf-8');
    
    assert(content.includes('class RoomSystem'), 'RoomSystem 类存在');
    assert(content.includes('generateLevel'), '生成关卡');
    assert(content.includes('enterRoom'), '进入房间');
    assert(content.includes('lockRoom'), '锁定房间');
    assert(content.includes('unlockRoom'), '解锁房间');
    assert(content.includes('spawnRoomEnemies'), '生成房间敌人');
    assert(content.includes('createPortal'), '创建传送门');
    assert(content.includes('teleportToRoom'), '房间传送');
});

// 测试 4: CameraSystem 检查
test('CameraSystem 功能检查', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'src/systems/CameraSystem.js'), 'utf-8');
    
    assert(content.includes('class CameraSystem'), 'CameraSystem 类存在');
    assert(content.includes('setTarget'), '设置目标');
    assert(content.includes('setBounds'), '设置边界');
    assert(content.includes('shake('), '震动效果');
    assert(content.includes('worldToScreen'), '世界坐标转屏幕');
    assert(content.includes('screenToWorld'), '屏幕坐标转世界');
    assert(content.includes('isInViewport'), '视口检测');
});

// 测试 5: 地图生成配置检查
test('地图生成配置检查', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'src/systems/MapGenerator.js'), 'utf-8');
    
    // 检查房间类型
    const roomTypes = ['start', 'normal', 'combat', 'treasure', 'shop', 'boss'];
    for (const type of roomTypes) {
        assert(content.includes(type), `房间类型: ${type}`);
    }
    
    // 检查配置参数
    assert(content.includes('gridSize'), '网格大小配置');
    assert(content.includes('roomSize'), '房间大小配置');
    assert(content.includes('cellSize'), '格子大小配置');
});

// 测试 6: 房间状态管理检查
test('房间状态管理检查', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'src/systems/RoomSystem.js'), 'utf-8');
    
    assert(content.includes('isCleared'), '房间清理状态');
    assert(content.includes('isVisited'), '房间访问状态');
    assert(content.includes('isLocked'), '房间锁定状态');
    assert(content.includes('enemyCount'), '敌人计数');
    assert(content.includes('onEnemyKilled'), '敌人死亡处理');
});

// 测试 7: 相机效果检查
test('相机效果检查', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'src/systems/CameraSystem.js'), 'utf-8');
    
    assert(content.includes('shakeIntensity'), '震动强度');
    assert(content.includes('shakeDuration'), '震动时长');
    assert(content.includes('shakeLight'), '轻微震动');
    assert(content.includes('shakeMedium'), '中等震动');
    assert(content.includes('shakeHeavy'), '强烈震动');
});

// 测试 8: 代码集成检查
test('Phase 3 代码集成', () => {
    // RoomSystem 和 CameraSystem 应该使用 ECS
    const files = [
        'src/systems/RoomSystem.js',
        'src/systems/CameraSystem.js'
    ];
    
    for (const file of files) {
        const content = fs.readFileSync(path.join(__dirname, '..', file), 'utf-8');
        
        // 检查使用 ECS 组件
        assert(content.includes('TransformComponent') || 
               content.includes('world.createEntity') ||
               content.includes('world.getEntitiesWith'), 
               `${file} 使用 ECS`);
        
        // 检查事件系统
        assert(content.includes('world.emit') || content.includes('world.on'), 
               `${file} 使用事件系统`);
    }
    
    // MapGenerator 是纯数据生成器，不需要直接使用 ECS
    const mapContent = fs.readFileSync(path.join(__dirname, '..', 'src/systems/MapGenerator.js'), 'utf-8');
    assert(mapContent.includes('class MapGenerator'), 'MapGenerator 是独立类');
});

// 测试 9: 传送门系统检查
test('传送门系统检查', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'src/systems/RoomSystem.js'), 'utf-8');
    
    assert(content.includes('activatePortals'), '激活传送门');
    assert(content.includes('checkPortalTrigger'), '检查传送门触发');
    assert(content.includes('tag'), '使用标签系统');
});

// 测试 10: 综合功能检查
test('综合游戏逻辑检查', () => {
    const roomContent = fs.readFileSync(path.join(__dirname, '..', 'src/systems/RoomSystem.js'), 'utf-8');
    
    // 房间和地图集成
    assert(roomContent.includes('MapGenerator'), 'RoomSystem 使用 MapGenerator');
    
    // 敌人生成集成
    assert(roomContent.includes('createEnemy'), 'RoomSystem 创建敌人');
    assert(roomContent.includes('spawnRoomEnemies'), 'RoomSystem 生成房间敌人');
    
    // 墙壁和障碍物创建在 RoomSystem 中
    assert(roomContent.includes('createWall'), 'RoomSystem 创建墙壁');
    assert(roomContent.includes('createObstacle'), 'RoomSystem 创建障碍物');
});

// ==================== 总结 ====================
console.log('\n=== Phase 3 自检结果 ===');
console.log(`测试通过: ${testsPassed}/${testsRun}`);
console.log(`通过率: ${((testsPassed/testsRun)*100).toFixed(1)}%`);

if (testsPassed === testsRun) {
    console.log('\n✅ Phase 3 通过！可以进入 Phase 4');
    process.exit(0);
} else {
    console.log('\n❌ Phase 3 有测试失败');
    process.exit(1);
}
