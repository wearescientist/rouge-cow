/**
 * SoundEffectSystem.js - 集中式音效管理系统 v1.0
 * 
 * 所有音效调用都通过此系统，不再分散在代码各处
 * 修改音效只需修改此文件
 * 
 * 使用方式:
 *   game.sfx.playWeaponAttack('whip');
 *   game.sfx.playEnemyHit('snail', false);
 *   game.sfx.playBGM('boss');
 */

class SoundEffectSystem {
    constructor(game) {
        this.game = game;
        this.audioCtrl = game.audioCtrl;
        this.audio = game.audio;
        
        // 敌人材质映射表
        this.ENEMY_MATERIALS = {
            // T1 小怪
            'chick': 'bird', 'snail': 'shell', 'pigeon': 'bird',
            'duck3': 'bird', 'bat': 'bird', 'rabbit': 'fur', 'rabbit2': 'fur',
            'bird': 'bird', 'duck2': 'bird', 'pig2': 'fur', 'cat': 'fur',
            'duck': 'bird', 'squirrel': 'fur', 'goose': 'bird', 'dog': 'fur',
            'pig': 'fur', 'sheep': 'fur', 'snake': 'slime',
            // T2 精英
            'bee': 'bird', 'panther': 'fur', 'crab': 'shell', 'nibei': 'shell',
            'bear': 'fur', 'fox': 'fur', 'tiaotiao': 'fur', 'tiezhua': 'bird',
            'yinya': 'fur', 'dog2': 'fur',
            // T3 小Boss
            'wolf_king': 'fur', 'turtle': 'shell', 'mimic': 'bone', 'ghost': 'slime',
            // T4 Boss
            'mother': 'slime'
        };
        
        // 楼层脚步映射
        this.FLOOR_FOOTSTEPS = {
            1: 'step_snow',      // 菌丝区
            2: 'step_grass',     // 孵化温室
            3: 'step_concrete',  // 神经索
            4: 'step_concrete',  // 消化熔炉
            5: 'step_wood',      // 母虫庭院
            6: 'step_carpet'     // 千根之心
        };
    }
    
    // ==========================================
    // 武器音效
    // ==========================================
    
    /**
     * 播放武器攻击音效
     * @param {string} weaponKey - 武器key: 'whip', 'knife', 'laser' 等
     */
    playWeaponAttack(weaponKey) {
        const soundMap = {
            'whip': 'wave',
            'blood_whip': 'wave',
            'scythe': 'scythe',
            'knife': 'knife',
            'axe': 'axe',
            'cross': 'cross',
            'wand': 'wand',
            'fireball': 'fireball',
            'shuriken': 'shuriken',
            'icicle': 'icicle',
            'lightning': 'lightning',
            'laser': 'laser',
            'dart': 'dart',
            'poison_dart': 'poison_dart',
            'holy_water': 'holy_water',
            'bible': 'wave',
            'unholy_vespers': 'wave',
            'orbit': 'wave'
        };
        const soundId = soundMap[weaponKey] || 'wand';
        this.audioCtrl.play(soundId);
    }
    
    /**
     * 播放武器进化音效
     */
    playWeaponEvolution() {
        this.audioCtrl.play('evolve');
    }
    
    // ==========================================
    // 命中音效
    // ==========================================
    
    /**
     * 播放敌人受击音效
     * @param {string} enemyType - 敌人类型key
     * @param {boolean} isCrit - 是否暴击
     */
    playEnemyHit(enemyType, isCrit = false) {
        if (isCrit) {
            this.audioCtrl.playCrit();
        } else {
            const material = this.ENEMY_MATERIALS[enemyType] || 'flesh';
            this.audioCtrl.playHit(material);
        }
    }
    
    /**
     * 播放玩家受击音效
     */
    playPlayerHit() {
        this.audioCtrl.play('hurt');
    }
    
    /**
     * 播放敌人死亡音效
     * @param {string} enemyType - 敌人类型key
     */
    playEnemyDeath(enemyType) {
        // 死亡使用重击音效
        this.audioCtrl.play('kill');
    }
    
    /**
     * 播放Boss撞墙音效
     */
    playBossHitWall() {
        this.audioCtrl.playHit('shell');
    }
    
    // ==========================================
    // 收集音效
    // ==========================================
    
    /**
     * 播放金币收集音效
     */
    playCoinCollected() {
        this.audioCtrl.play('coin');
    }
    
    /**
     * 播放经验宝石收集音效
     */
    playGemCollected() {
        this.audioCtrl.play('gem');
    }
    
    /**
     * 播放经验获取音效
     */
    playExpGained() {
        this.audioCtrl.play('exp');
    }
    
    /**
     * 播放宝箱开启音效
     */
    playChestOpened() {
        this.audioCtrl.play('chest');
    }
    
    // ==========================================
    // 系统音效
    // ==========================================
    
    /**
     * 播放升级音效
     */
    playLevelUp() {
        this.audioCtrl.play('levelup');
    }
    
    /**
     * 播放治疗音效
     */
    playHeal() {
        this.audioCtrl.play('heal');
    }
    
    /**
     * 播放Boss出现音效
     */
    playBossAppear() {
        this.audioCtrl.play('boss');
    }
    
    /**
     * 播放购买物品音效
     */
    playBuyItem() {
        this.audioCtrl.play('buy');
    }
    
    /**
     * 播放解锁内容音效
     */
    playUnlock() {
        this.audioCtrl.play('unlock');
    }
    
    /**
     * 播放房间清理完成音效（吸收掉落物）
     */
    playRoomClear() {
        this.audioCtrl.play('gem');
    }
    
    // ==========================================
    // UI音效
    // ==========================================
    
    /**
     * 播放UI点击音效
     */
    playUIClick() {
        this.audioCtrl.play('click');
    }
    
    /**
     * 播放UI选择音效
     */
    playUISelect() {
        this.audioCtrl.play('select');
    }
    
    /**
     * 播放UI切换音效
     */
    playUISwitch() {
        this.audioCtrl.play('switch');
    }
    
    // ==========================================
    // 脚步音效
    // ==========================================
    
    /**
     * 播放脚步音效
     * @param {number} floor - 楼层 1-6
     */
    playFootstep(floor) {
        const soundId = this.FLOOR_FOOTSTEPS[floor] || 'step_concrete';
        this.audioCtrl.play(soundId);
    }
    
    // ==========================================
    // BGM控制
    // ==========================================
    
    /**
     * 播放BGM
     * @param {string} scene - 场景: 'menu'|'normal'|'elite'|'boss'|'victory'
     */
    playBGM(scene) {
        const bgmMap = {
            'menu': 'menu',
            'normal': 'normal',
            'elite': 'elite',
            'boss': 'boss',
            'victory': 'victory'
        };
        const bgmType = bgmMap[scene];
        if (bgmType && this.audio) {
            this.audio.playBGM(bgmType);
        }
    }
    
    /**
     * 停止BGM
     */
    stopBGM() {
        if (this.audio) {
            this.audio.stopBGM();
        }
    }
    
    /**
     * 根据房间类型播放对应BGM
     * @param {Object} room - 房间对象
     */
    playBGMForRoom(room) {
        if (!room) return;
        
        if (room.type === 'boss') {
            this.playBGM('boss');
        } else if (room.type === 'hidden' || room.type === 'elite') {
            this.playBGM('elite');
        } else {
            this.playBGM('normal');
        }
    }
    
    // ==========================================
    // 宠物音效
    // ==========================================
    
    /**
     * 播放宠物攻击音效
     * @param {string} attackType - 攻击类型
     */
    playPetAttack(attackType) {
        const soundMap = {
            'laser': 'laser',
            'orbit': 'fireball_pet',
            'bomb': 'fireball',
            'blackhole': 'holy_water',
            'breath': 'fireball',
            'chain': 'lightning',
            'slow': 'icicle',
            'heal': 'heal',
            'aura': 'wand',
            'homing': 'fireball_pet',
            'rapid': 'wand',
            'bounce': 'cross',
            'boomerang': 'axe',
            'copy': 'wand'
        };
        const soundId = soundMap[attackType] || 'fireball_pet';
        this.audioCtrl.play(soundId);
    }
}

// 导出到全局
window.SoundEffectSystem = SoundEffectSystem;
