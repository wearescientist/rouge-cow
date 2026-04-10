const BOSS_TYPES = {
    // 第1层 - 跳跳（兔子）- 割草模式：血量×2.5
    floor1: {
        name: '跳跳',
        baseHp: 1000,
        speed: 200,
        dmg: 5,
        exp: 100,
        gold: 50,
        color: '#aa44ff',
        sprite: 'rabbit_yellow',  // 使用yellow文件夹贴图
        desc: '被寄生的草原袋鼠，牛牛的好友',
        skills: {
            charge: { cd: 4, warningTime: 1.5, speed: 300, dmg: 3 },
            bullet_hell: { cd: 5, bulletCount: 12, speed: 180, dmg: 2 },
            summon: { cd: 10, count: 3, types: ['chick', 'snail'] },
            shockwave: { cd: 7, range: 200, dmg: 2 },
            homing: { cd: 4, count: 3, speed: 160, dmg: 1.5 }
        },
        phases: [
            { hpPercent: 100, behavior: 'normal', skillCdMult: 1.0 },
            { hpPercent: 60, behavior: 'enrage', skillCdMult: 0.8, speedMult: 1.3 },
            { hpPercent: 25, behavior: 'desperate', skillCdMult: 0.6, speedMult: 1.5, dmgMult: 1.3 }
        ]
    },
    
    // 第2层 - 铁爪（鸟）- 割草模式：血量×3.3
    floor2: {
        name: '铁爪',
        baseHp: 1500,
        speed: 180,
        dmg: 7,
        exp: 120,
        gold: 60,
        color: '#4488ff',
        sprite: 'bird_yellow',
        desc: '被寄生的金雕，翅膀长满菌丝羽毛',
        skills: {
            charge: { cd: 3.5, warningTime: 1.2, speed: 350, dmg: 4 },
            bullet_hell: { cd: 4, bulletCount: 14, speed: 220, dmg: 2 },
            summon: { cd: 9, count: 2, types: ['pigeon', 'bat'] },
            shockwave: { cd: 6, range: 220, dmg: 2 },
            homing: { cd: 3, count: 4, speed: 200, dmg: 1.8 }
        },
        phases: [
            { hpPercent: 100, behavior: 'normal', skillCdMult: 1.0 },
            { hpPercent: 65, behavior: 'enrage', skillCdMult: 0.75, speedMult: 1.25 },
            { hpPercent: 30, behavior: 'desperate', skillCdMult: 0.55, speedMult: 1.4, dmgMult: 1.4 }
        ]
    },
    
    // 第3层 - 泥背（龟）- 割草模式：血量×4.2
    floor3: {
        name: '泥背',
        baseHp: 2500,
        speed: 50,
        dmg: 10,
        exp: 140,
        gold: 70,
        color: '#44aa44',
        sprite: 'turtle_yellow',
        desc: '背甲变成移动孵化场的老象龟',
        armor: 3,
        skills: {
            charge: { cd: 6, warningTime: 2, speed: 200, dmg: 5 },
            bullet_hell: { cd: 5, bulletCount: 16, speed: 150, dmg: 3 },
            summon: { cd: 8, count: 4, types: ['snail', 'crab'] },
            shockwave: { cd: 5, range: 280, dmg: 3 },
            homing: { cd: 4, count: 5, speed: 140, dmg: 2 }
        },
        phases: [
            { hpPercent: 100, behavior: 'normal', skillCdMult: 1.0 },
            { hpPercent: 70, behavior: 'enrage', skillCdMult: 0.8, speedMult: 1.2 },
            { hpPercent: 35, behavior: 'desperate', skillCdMult: 0.6, speedMult: 1.3, dmgMult: 1.5 }
        ]
    },
    
    // 第4层 - 银牙（松鼠）- 割草模式：血量×8
    floor4: {
        name: '银牙',
        baseHp: 4000,
        speed: 220,
        dmg: 12,
        exp: 130,
        gold: 65,
        color: '#aa44ff',
        sprite: 'squirrel_yellow',
        desc: '狼群首领，脊柱外露连接神经索',
        skills: {
            charge: { cd: 3, warningTime: 1, speed: 380, dmg: 4 },
            bullet_hell: { cd: 4, bulletCount: 18, speed: 200, dmg: 2 },
            summon: { cd: 7, count: 3, types: ['dog', 'dog2'] },
            shockwave: { cd: 6, range: 200, dmg: 2 },
            homing: { cd: 2.5, count: 5, speed: 220, dmg: 1.5 }
        },
        phases: [
            { hpPercent: 100, behavior: 'normal', skillCdMult: 1.0 },
            { hpPercent: 60, behavior: 'enrage', skillCdMult: 0.75, speedMult: 1.4 },
            { hpPercent: 25, behavior: 'desperate', skillCdMult: 0.55, speedMult: 1.6, dmgMult: 1.4 }
        ]
    },
    
    // 第5层 - 铁角（牛牛父亲）- 割草模式：血量×8.5
    floor5: {
        name: '铁角',
        baseHp: 6000,
        speed: 100,
        dmg: 18,
        exp: 160,
        gold: 80,
        color: '#ffaa00',
        sprite: 'pig_yellow',  // 实际是cow贴图
        desc: '牛牛的父亲，已被部分寄生，仍保留着最后一丝理智',
        skills: {
            charge: { cd: 4, warningTime: 1.5, speed: 280, dmg: 6 },
            bullet_hell: { cd: 4, bulletCount: 20, speed: 180, dmg: 3 },
            summon: { cd: 8, count: 3, types: ['bear', 'wolf'] },
            shockwave: { cd: 5, range: 300, dmg: 3 },
            homing: { cd: 3, count: 6, speed: 180, dmg: 2 }
        },
        phases: [
            { hpPercent: 100, behavior: 'normal', skillCdMult: 1.0 },
            { hpPercent: 65, behavior: 'enrage', skillCdMult: 0.75, speedMult: 1.2 },
            { hpPercent: 30, behavior: 'desperate', skillCdMult: 0.55, speedMult: 1.4, dmgMult: 1.5 }
        ]
    },
    
    // 第6层 - 母虫真身（固定在中央，不移动）- 割草模式：血量×12.5
    floor6: {
        name: '深渊母体',
        baseHp: 10000,
        speed: 0,         // 不移动
        dmg: 25,
        exp: 300,
        gold: 150,
        color: '#880000',
        sprite: 'boss6_yellow',  // 使用boss6贴图
        scale: 2.5,
        isStatic: true,   // 标记为静止Boss
        desc: '山丘大小的肉质团，母虫的真身',
        skills: {
            charge: { cd: 999, warningTime: 2, speed: 0, dmg: 0 },  // 冲撞无效
            bullet_hell: { cd: 3, bulletCount: 24, speed: 250, dmg: 3 },
            summon: { cd: 6, count: 4, types: ['chick', 'snail', 'rabbit', 'bat'] },
            shockwave: { cd: 4, range: 400, dmg: 4 },
            homing: { cd: 2, count: 8, speed: 200, dmg: 2.5 }
        },
        phases: [
            { hpPercent: 100, behavior: 'normal', skillCdMult: 1.0 },
            { hpPercent: 70, behavior: 'enrage', skillCdMult: 0.7 },
            { hpPercent: 30, behavior: 'desperate', skillCdMult: 0.5, dmgMult: 1.8 }
        ]
    }
};
