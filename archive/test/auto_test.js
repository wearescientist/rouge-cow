/**
 * 自动化测试脚本
 * 验证游戏核心功能
 */

class AutoTester {
    constructor() {
        this.results = [];
        this.errors = [];
    }
    
    log(testName, success, message) {
        const result = { testName, success, message, timestamp: new Date() };
        this.results.push(result);
        console.log(`[${success ? '✓' : '✗'}] ${testName}: ${message}`);
    }
    
    // 测试 AudioSystem
    testAudioSystem() {
        try {
            const audioSys = new AudioSystem({ 
                on: () => {},
                getEntitiesWithTag: () => []
            });
            
            if (!audioSys.enabled) {
                this.log('AudioSystem', false, 'AudioSystem未启用');
                return false;
            }
            
            if (audioSys.soundBuffers.size < 10) {
                this.log('AudioSystem', false, `音效数量不足: ${audioSys.soundBuffers.size}`);
                return false;
            }
            
            this.log('AudioSystem', true, `生成了 ${audioSys.soundBuffers.size} 个音效`);
            return true;
        } catch (e) {
            this.log('AudioSystem', false, `错误: ${e.message}`);
            return false;
        }
    }
    
    // 测试 ItemSystem
    testItemSystem() {
        try {
            const itemSys = new ItemSystem({
                on: () => {},
                getSystem: () => null,
                getEntitiesWithTag: () => [],
                createEntity: () => ({ add: () => {}, addTag: () => {}, get: () => null })
            });
            
            itemSys.init();
            
            const itemCount = itemSys.itemDatabase.size;
            const passiveCount = itemSys.passiveDatabase.size;
            
            if (itemCount < 50) {
                this.log('ItemSystem', false, `消耗品数量不足: ${itemCount}`);
                return false;
            }
            
            if (passiveCount < 50) {
                this.log('ItemSystem', false, `被动道具数量不足: ${passiveCount}`);
                return false;
            }
            
            this.log('ItemSystem', true, `消耗品: ${itemCount}, 被动: ${passiveCount}`);
            return true;
        } catch (e) {
            this.log('ItemSystem', false, `错误: ${e.message}`);
            return false;
        }
    }
    
    // 测试 WeaponSystem
    testWeaponSystem() {
        try {
            const weaponSys = new WeaponSystem({
                on: () => {},
                getEntitiesWithComponents: () => [],
                getEntitiesWithTag: () => [],
                getSystem: () => null
            });
            
            weaponSys.init();
            
            if (weaponSys.weaponDatabase.size < 10) {
                this.log('WeaponSystem', false, `武器数量不足: ${weaponSys.weaponDatabase.size}`);
                return false;
            }
            
            this.log('WeaponSystem', true, `武器数量: ${weaponSys.weaponDatabase.size}`);
            return true;
        } catch (e) {
            this.log('WeaponSystem', false, `错误: ${e.message}`);
            return false;
        }
    }
    
    // 测试 EnemySpawnSystem
    testEnemySpawnSystem() {
        try {
            const enemySys = new EnemySpawnSystem({
                on: () => {},
                getEntitiesWithTag: () => [],
                createEnemy: () => ({ get: () => null })
            });
            
            const enemyCount = Object.keys(enemySys.enemyData || {}).length;
            
            if (enemyCount < 20) {
                this.log('EnemySpawnSystem', false, `敌人类型不足: ${enemyCount}`);
                return false;
            }
            
            this.log('EnemySpawnSystem', true, `敌人类型: ${enemyCount}`);
            return true;
        } catch (e) {
            this.log('EnemySpawnSystem', false, `错误: ${e.message}`);
            return false;
        }
    }
    
    // 运行所有测试
    runAllTests() {
        console.log('=== 开始自动化测试 ===\n');
        
        this.testAudioSystem();
        this.testItemSystem();
        this.testWeaponSystem();
        this.testEnemySpawnSystem();
        
        console.log('\n=== 测试报告 ===');
        const passed = this.results.filter(r => r.success).length;
        const total = this.results.length;
        console.log(`通过率: ${passed}/${total} (${(passed/total*100).toFixed(1)}%)`);
        
        if (passed < total) {
            console.log('\n失败的测试:');
            this.results.filter(r => !r.success).forEach(r => {
                console.log(`  - ${r.testName}: ${r.message}`);
            });
        }
        
        return { passed, total, results: this.results };
    }
}

// 导出
window.AutoTester = AutoTester;
