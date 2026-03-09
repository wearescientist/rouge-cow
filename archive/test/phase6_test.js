/**
 * Phase 6 自检脚本
 * 测试存档 & 设置系统
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

console.log('=== Phase 6 自检开始 ===\n');

// 测试 1: 检查 Phase 6 文件
test('Phase 6 系统文件检查', () => {
    const requiredFiles = [
        'src/systems/SaveSystem.js',
        'src/systems/SettingsSystem.js'
    ];
    
    for (const file of requiredFiles) {
        const fullPath = path.join(__dirname, '..', file);
        assert(fs.existsSync(fullPath), `文件存在: ${file}`);
    }
});

// 测试 2: SaveSystem 检查
test('SaveSystem 功能检查', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'src/systems/SaveSystem.js'), 'utf-8');
    
    assert(content.includes('class SaveSystem'), 'SaveSystem 类存在');
    assert(content.includes('saveGame'), '保存游戏方法');
    assert(content.includes('loadGame'), '加载游戏方法');
    assert(content.includes('localStorage'), '使用 localStorage');
    assert(content.includes('serializePlayer'), '序列化玩家');
    assert(content.includes('deserializePlayer'), '反序列化玩家');
});

// 测试 3: SettingsSystem 检查
test('SettingsSystem 功能检查', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'src/systems/SettingsSystem.js'), 'utf-8');
    
    assert(content.includes('class SettingsSystem'), 'SettingsSystem 类存在');
    assert(content.includes('loadSettings'), '加载设置');
    assert(content.includes('saveSettings'), '保存设置');
    assert(content.includes('applySettings'), '应用设置');
    assert(content.includes('get('), '获取设置');
    assert(content.includes('set('), '设置值');
});

// 测试 4: 存档功能检查
test('存档功能检查', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'src/systems/SaveSystem.js'), 'utf-8');
    
    assert(content.includes('autoSave'), '自动存档');
    assert(content.includes('hasSave'), '检查存档存在');
    assert(content.includes('getSaveInfo'), '获取存档信息');
    assert(content.includes('deleteSave'), '删除存档');
    assert(content.includes('exportSave'), '导出存档');
    assert(content.includes('importSave'), '导入存档');
});

// 测试 5: 设置分类检查
test('设置分类检查', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'src/systems/SettingsSystem.js'), 'utf-8');
    
    const categories = ['audio', 'display', 'gameplay', 'controls', 'accessibility'];
    for (const cat of categories) {
        assert(content.includes(cat), `设置分类: ${cat}`);
    }
});

// 测试 6: 版本兼容性检查
test('版本兼容性检查', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'src/systems/SaveSystem.js'), 'utf-8');
    
    assert(content.includes('version'), '版本号');
    assert(content.includes('isVersionCompatible'), '版本兼容性检查');
});

// 测试 7: 键位绑定检查
test('键位绑定检查', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'src/systems/SettingsSystem.js'), 'utf-8');
    
    assert(content.includes('keybindings'), '键位绑定');
    assert(content.includes('checkKeyConflicts'), '检查键位冲突');
    assert(content.includes('getKeyDisplayName'), '获取键位显示名');
});

// 测试 8: 设置回调系统
test('设置回调系统', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'src/systems/SettingsSystem.js'), 'utf-8');
    
    assert(content.includes('onChange'), '监听变更');
    assert(content.includes('triggerChange'), '触发变更');
    assert(content.includes('changeCallbacks'), '变更回调');
});

// 测试 9: 存档槽位检查
test('存档槽位检查', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'src/systems/SaveSystem.js'), 'utf-8');
    
    assert(content.includes('maxSaveSlots'), '最大存档槽位');
    assert(content.includes('saveKey'), '存档键名');
    assert(content.includes('slot'), '槽位参数');
});

// 测试 10: 设置应用检查
test('设置应用检查', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'src/systems/SettingsSystem.js'), 'utf-8');
    
    assert(content.includes('applyAudioSettings'), '应用音频设置');
    assert(content.includes('applyDisplaySettings'), '应用显示设置');
    assert(content.includes('applyControlSettings'), '应用控制设置');
});

// ==================== 总结 ====================
console.log('\n=== Phase 6 自检结果 ===');
console.log(`测试通过: ${testsPassed}/${testsRun}`);
console.log(`通过率: ${((testsPassed/testsRun)*100).toFixed(1)}%`);

if (testsPassed === testsRun) {
    console.log('\n✅ Phase 6 通过！可以进入 Phase 7 (最终集成测试)');
    process.exit(0);
} else {
    console.log('\n❌ Phase 6 有测试失败');
    process.exit(1);
}
