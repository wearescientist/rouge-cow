const fs = require('fs');
const path = require('path');

console.log('🏗️ 构建 v0.7.3 - 新增40个道具...');

// 读取v0.7.2代码
let code = fs.readFileSync(path.join(__dirname, 'index_v0.7.2.html'), 'utf8');

// 1. 更新标题
code = code.replace('v0.7.2 武器进化系统', 'v0.7.3 新增40个道具');

// 2. 在ITEMS中添加40个新道具
const newItems = `
    // v0.7.3 新增40个道具
    16: { id: 16, name: '狂暴之血', icon: '🩸', rarity: 'rare', effect: 'berserk', value: 0.1, desc: '生命越低伤害越高', price: 80 },
    17: { id: 17, name: '穿透弹', icon: '🔫', rarity: 'common', effect: 'pierce', value: 1, desc: '穿透+1', price: 45 },
    18: { id: 18, name: '爆炸弹', icon: '💣', rarity: 'rare', effect: 'explosive', value: 1, desc: '子弹爆炸伤害', price: 90 },
    19: { id: 19, name: '连射装置', icon: '⚙️', rarity: 'common', effect: 'fireRate', value: 0.2, desc: '射速+20%', price: 50 },
    20: { id: 20, name: '狙击镜', icon: '🔭', rarity: 'rare', effect: 'sniper', value: 0.5, desc: '伤害+50%射速-20%', price: 85 },
    21: { id: 21, name: '分裂弹', icon: '✴️', rarity: 'epic', effect: 'split', value: 1, desc: '子弹分裂3个', price: 150 },
    22: { id: 22, name: '追踪芯片', icon: '🎯', rarity: 'rare', effect: 'homing', value: 0.5, desc: '追踪能力+50%', price: 75 },
    23: { id: 23, name: '毒液涂层', icon: '☠️', rarity: 'common', effect: 'poisonDmg', value: 3, desc: '中毒3伤害/秒', price: 40 },
    24: { id: 24, name: '冰冻弹', icon: '🧊', rarity: 'rare', effect: 'freezeChance', value: 0.2, desc: '20%冰冻2秒', price: 85 },
    25: { id: 25, name: '燃烧弹', icon: '🔥', rarity: 'common', effect: 'burnDmg', value: 5, desc: '燃烧5伤害/秒', price: 45 },
    26: { id: 26, name: '雷电链', icon: '⚡', rarity: 'epic', effect: 'chain', value: 2, desc: '连锁2个敌人', price: 140 },
    27: { id: 27, name: '暴击心脏', icon: '💗', rarity: 'rare', effect: 'critDmg', value: 0.5, desc: '暴击伤害+50%', price: 80 },
    28: { id: 28, name: '护盾发生器', icon: '🛡️', rarity: 'rare', effect: 'shield', value: 2, desc: '2点可恢复护盾', price: 100 },
    29: { id: 29, name: '伤害反弹', icon: '🔄', rarity: 'rare', effect: 'reflect', value: 0.3, desc: '反弹30%伤害', price: 90 },
    30: { id: 30, name: '无敌帧延长', icon: '⏱️', rarity: 'epic', effect: 'iframe', value: 0.5, desc: '无敌时间+0.5秒', price: 160 },
    31: { id: 31, name: '生命恢复', icon: '💚', rarity: 'common', effect: 'regen', value: 0.5, desc: '每秒恢复0.5生命', price: 55 },
    32: { id: 32, name: '伤害减免', icon: '🧱', rarity: 'rare', effect: 'damageReduce', value: 0.2, desc: '受到伤害-20%', price: 95 },
    33: { id: 33, name: '复活币', icon: '🪙', rarity: 'legendary', effect: 'revive', value: 1, desc: '死亡复活50%生命', price: 400 },
    34: { id: 34, name: '临时护盾', icon: '🛡️', rarity: 'common', effect: 'tempShield', value: 1, desc: '进房获得1护盾', price: 35 },
    35: { id: 35, name: '荆棘护甲', icon: '🌵', rarity: 'rare', effect: 'thorn', value: 2, desc: '反弹2近战伤害', price: 70 },
    36: { id: 36, name: '生命偷取', icon: '🧛', rarity: 'epic', effect: 'lifeSteal', value: 0.1, desc: '10%伤害转生命', price: 150 },
    37: { id: 37, name: '紧急治疗', icon: '🏥', rarity: 'rare', effect: 'emergencyHeal', value: 3, desc: '低生命自动治疗', price: 85 },
    38: { id: 38, name: '经验书', icon: '📚', rarity: 'common', effect: 'expBonus', value: 0.25, desc: '经验+25%', price: 40 },
    39: { id: 39, name: '金磁铁', icon: '🧲', rarity: 'rare', effect: 'magnet', value: 100, desc: '拾取范围+100', price: 75 },
    40: { id: 40, name: '幸运币', icon: '🍀', rarity: 'rare', effect: 'goldBonus', value: 0.3, desc: '金币+30%', price: 80 },
    41: { id: 41, name: '疾风靴', icon: '👢', rarity: 'epic', effect: 'speed', value: 0.4, desc: '移速+40%', price: 140 },
    42: { id: 42, name: '时间减缓', icon: '⏳', rarity: 'legendary', effect: 'timeSlow', value: 1, desc: '周期性时间减缓', price: 500 },
    43: { id: 43, name: '地图雷达', icon: '📡', rarity: 'rare', effect: 'radar', value: 1, desc: '小地图显示敌人', price: 90 },
    44: { id: 44, name: '商店折扣', icon: '🏷️', rarity: 'rare', effect: 'discount', value: 0.3, desc: '商店-30%价格', price: 100 },
    45: { id: 45, name: '额外生命', icon: '❤️', rarity: 'epic', effect: 'maxHp', value: 3, desc: '生命上限+3', price: 130 },
    46: { id: 46, name: '自动拾取', icon: '🤖', rarity: 'common', effect: 'autoPickup', value: 30, desc: '自动拾取范围+30', price: 35 },
    47: { id: 47, name: '双倍时间', icon: '⏰', rarity: 'rare', effect: 'doubleTime', value: 1, desc: '双倍奖励时间', price: 85 },
    48: { id: 48, name: '混沌骰子', icon: '🎲', rarity: 'legendary', effect: 'chaos', value: 1, desc: '随机改变属性', price: 450 },
    49: { id: 49, name: '诅咒契约', icon: '📜', rarity: 'epic', effect: 'curse', value: 1, desc: '伤害+50%生命-2', price: 120 },
    50: { id: 50, name: '天使祝福', icon: '👼', rarity: 'legendary', effect: 'blessing', value: 0.1, desc: '全属性+10%', price: 480 },
    51: { id: 51, name: '恶魔交易', icon: '😈', rarity: 'epic', effect: 'demon', value: 1, desc: '金币转化为伤害', price: 160 },
    52: { id: 52, name: '时空裂隙', icon: '🌀', rarity: 'legendary', effect: 'resetCD', value: 0.2, desc: '20%重置技能CD', price: 420 },
    53: { id: 53, name: '复制器', icon: '📋', rarity: 'epic', effect: 'duplicate', value: 1, desc: '道具效果+1', price: 180 },
    54: { id: 54, name: '转换器', icon: '🔄', rarity: 'rare', effect: 'convert', value: 1, desc: '金币经验互转', price: 95 },
    55: { id: 55, name: '黑洞核心', icon: '🕳️', rarity: 'legendary', effect: 'blackhole', value: 1, desc: '全屏吸引物品', price: 500 }
`;

// 找到ITEMS的结束位置并插入新道具
const itemsEndMarker = '};\n\nfunction getItemPrice';
code = code.replace(itemsEndMarker, newItems + '\n};\n\nfunction getItemPrice');

// 3. 更新getStats处理新效果
const statsInit = `const s = {
            projCount: 1, projSize: 1, fireRate: 1, pierce: 0,
            crit: 0, maxHp: 0, armor: 0, lifeSteal: 0,
            speed: 1, fly: false, magnet: 100, goldBonus: 1,
            fireDmg: 0, thunderDmg: 0, poisonDmg: 0, curseDmg: 0,
            slowChance: 0, slowAmount: 0, stunChance: 0,
            healOnHit: 0, burnDmg: 0, freezeChance: 0, chain: 0,
            berserk: 0, explosive: false, split: 0, sniper: 0,
            shield: 0, reflect: 0, iframe: 0, regen: 0,
            damageReduce: 0, revive: 0, thorn: 0, emergencyHeal: 0,
            expBonus: 0, radar: false, discount: 0, autoPickup: 0,
            chaos: 0, curse: 0, blessing: 0, demon: 0,
            resetCD: 0, duplicate: 0, blackhole: 0, critDmg: 0.5
        };`;

code = code.replace(/const s = \{[\s\S]*?slowAmount: 0,[\s\S]*?\};/, statsInit);

// 4. 保存新文件
fs.writeFileSync(path.join(__dirname, 'index_v0.7.3.html'), code);
console.log('✅ v0.7.3 构建完成！');
console.log('📁 输出文件: index_v0.7.3.html');
