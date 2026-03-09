/**
 * Phase 5 自检脚本
 * 测试音效 & 特效系统
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

console.log('=== Phase 5 自检开始 ===\n');

// 测试 1: 检查 Phase 5 文件
test('Phase 5 系统文件检查', () => {
    const requiredFiles = [
        'src/systems/AudioSystem.js',
        'src/systems/ParticleSystem.js',
        'src/systems/ScreenEffectSystem.js'
    ];
    
    for (const file of requiredFiles) {
        const fullPath = path.join(__dirname, '..', file);
        assert(fs.existsSync(fullPath), `文件存在: ${file}`);
    }
});

// 测试 2: AudioSystem 检查
test('AudioSystem 功能检查', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'src/systems/AudioSystem.js'), 'utf-8');
    
    assert(content.includes('class AudioSystem'), 'AudioSystem 类存在');
    assert(content.includes('AudioContext'), '使用 Web Audio API');
    assert(content.includes('loadSound'), '加载音效方法');
    assert(content.includes('play('), '播放音效方法');
    assert(content.includes('playBgm'), '播放背景音乐');
    assert(content.includes('setVolume'), '设置音量');
    assert(content.includes('localStorage'), '保存音量设置');
});

// 测试 3: ParticleSystem 检查
test('ParticleSystem 功能检查', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'src/systems/ParticleSystem.js'), 'utf-8');
    
    assert(content.includes('class ParticleSystem'), 'ParticleSystem 类存在');
    assert(content.includes('createParticle'), '创建粒子');
    assert(content.includes('spawnExplosion'), '爆炸效果');
    assert(content.includes('spawnBloodEffect'), '血迹效果');
    assert(content.includes('spawnDeathEffect'), '死亡效果');
    assert(content.includes('spawnLevelUpEffect'), '升级效果');
});

// 测试 4: ScreenEffectSystem 检查
test('ScreenEffectSystem 功能检查', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'src/systems/ScreenEffectSystem.js'), 'utf-8');
    
    assert(content.includes('class ScreenEffectSystem'), 'ScreenEffectSystem 类存在');
    assert(content.includes('shake'), '震动效果');
    assert(content.includes('flash'), '闪光效果');
    assert(content.includes('slowMotion'), '慢动作效果');
    assert(content.includes('blur'), '模糊效果');
    assert(content.includes('vignette'), '暗角效果');
});

// 测试 5: 音频功能完整性
test('音频功能完整性', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'src/systems/AudioSystem.js'), 'utf-8');
    
    assert(content.includes('masterGain'), '主音量控制');
    assert(content.includes('bgmGain'), 'BGM 音量控制');
    assert(content.includes('sfxGain'), '音效音量控制');
    assert(content.includes('mute'), '静音功能');
    assert(content.includes('pitchVariation'), '音高变化');
});

// 测试 6: 粒子效果类型检查
test('粒子效果类型检查', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'src/systems/ParticleSystem.js'), 'utf-8');
    
    const effects = [
        'spawnExplosion',
        'spawnBloodEffect',
        'spawnDeathEffect',
        'spawnMuzzleFlash',
        'spawnImpactEffect',
        'spawnLevelUpEffect',
        'spawnRoomClearEffect'
    ];
    
    for (const effect of effects) {
        assert(content.includes(effect), `效果存在: ${effect}`);
    }
});

// 测试 7: 屏幕特效类型检查
test('屏幕特效类型检查', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'src/systems/ScreenEffectSystem.js'), 'utf-8');
    
    const effects = [
        'shakeLight',
        'shakeMedium',
        'shakeHeavy',
        'flashWhite',
        'flashRed',
        'flashGold',
        'slowMotionBurst'
    ];
    
    for (const effect of effects) {
        assert(content.includes(effect), `特效存在: ${effect}`);
    }
});

// 测试 8: 事件监听检查
test('特效事件监听检查', () => {
    const files = [
        'src/systems/ParticleSystem.js',
        'src/systems/ScreenEffectSystem.js'
    ];
    
    for (const file of files) {
        const content = fs.readFileSync(path.join(__dirname, '..', file), 'utf-8');
        assert(content.includes('setupEventListeners'), `${file} 有事件监听设置`);
        assert(content.includes('world.on'), `${file} 监听世界事件`);
    }
});

// 测试 9: 粒子池管理检查
test('粒子池管理检查', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'src/systems/ParticleSystem.js'), 'utf-8');
    
    assert(content.includes('maxParticles'), '最大粒子数限制');
    assert(content.includes('particles.length'), '粒子数检查');
    assert(content.includes('createBaseTextures'), '创建基础纹理');
});

// 测试 10: 时间缩放检查
test('时间缩放检查', () => {
    const content = fs.readFileSync(path.join(__dirname, '..', 'src/systems/ScreenEffectSystem.js'), 'utf-8');
    
    assert(content.includes('timeScale'), '时间缩放');
    assert(content.includes('getTimeScale'), '获取时间缩放');
    assert(content.includes('currentTimeScale'), '当前时间缩放');
    assert(content.includes('targetTimeScale'), '目标时间缩放');
});

// ==================== 总结 ====================
console.log('\n=== Phase 5 自检结果 ===');
console.log(`测试通过: ${testsPassed}/${testsRun}`);
console.log(`通过率: ${((testsPassed/testsRun)*100).toFixed(1)}%`);

if (testsPassed === testsRun) {
    console.log('\n✅ Phase 5 通过！可以进入 Phase 6');
    process.exit(0);
} else {
    console.log('\n❌ Phase 5 有测试失败');
    process.exit(1);
}
