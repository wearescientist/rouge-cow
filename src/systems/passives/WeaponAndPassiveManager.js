/**
 * PassiveManager - 被动道具管理器
 * 从 index.html 迁移的独立模块
 */

function getPassiveStepValue(passive, stepIndex) {
    if (Array.isArray(passive?.perLevel)) {
        return passive.perLevel[stepIndex] ?? 0;
    }
    return passive?.value ?? 0;
}

function getPassiveTotalValue(passive, level) {
    let total = 0;
    for (let i = 0; i < level; i++) {
        total += getPassiveStepValue(passive, i);
    }
    return total;
}

class PassiveManager {

    constructor(player) {

        this.player = player;

        this.passives = {}; // { key: level }

    }

    

    // 添加或升级被动

    add(key) {

        const passive = PASSIVES[key];

        if (!passive) return false;

        

        const currentLevel = this.passives[key] || 0;

        if (currentLevel >= passive.maxLevel) return false; // 已满级

        

        this.passives[key] = currentLevel + 1;

        

        // 立即应用被动效果

        this.applyEffect(passive);

        

        return true;

    }

    

    // 应用被动效果

    applyEffect(passive) {

        switch(passive.effect) {

            case 'maxHpPct':

                // 空心之心：增加最大生命值百分比

                const hpBonus = Math.floor(this.player.maxHp * passive.value);

                this.player.maxHp += hpBonus;

                this.player.hp += hpBonus;

                break;

        }

    }

    

    // 获取被动效果统计

    getStats() {

        const stats = {
            dmg: 1,           // 菠菜
            armor: 0,         // 护甲
            maxHpPct: 0,      // 空心之心
            cooldown: 1,      // 空白之书（冷却倍率，越小越好）
            range: 1,         // 烛台
            projSpeed: 1,     // 护腕
            duration: 1,      // 魔法拼写器
            projCount: 0,     // 复制器
            speed: 1,         // 翅膀
            magnet: 0,        // 吸引器
            luck: 0,          // 四叶草
            expBonus: 0,      // 王冠
            lifeSteal: 0,     // 红石榴
            focusPower: 0,
            luckyNovaChance: 0,
            luckyNovaRadius: 0,
            alchemyChance: 0,
            alchemyRadius: 0,
            alchemyDot: 0,
            retributionPulse: 0,
            retributionRadius: 0,
            moveConduction: 0,
            moveConductionWidth: 0,
            moveConductionChain: 0,
            lingeringFieldScale: 0,
            lingeringFieldDuration: 0,
            lingeringTickRateMul: 1,
            pickupMomentum: 0,
            pickupMomentumCap: 0,
            activeSynergies: []
        };

        

        for (const [key, level] of Object.entries(this.passives)) {

            const passive = PASSIVES[key];

            if (!passive || level <= 0) continue;

            

            switch(passive.effect) {

                case 'dmg':

                    stats.dmg += getPassiveTotalValue(passive, level);

                    break;

                case 'armor':

                    stats.armor += getPassiveTotalValue(passive, level);

                    break;

                case 'maxHpPct':

                    stats.maxHpPct += getPassiveTotalValue(passive, level);

                    break;

                case 'cooldown':

                    for (let i = 0; i < level; i++) {
                        stats.cooldown *= (1 - getPassiveStepValue(passive, i));
                    }

                    break;

                case 'range':

                    stats.range += getPassiveTotalValue(passive, level);

                    break;

                case 'projSpeed':

                    stats.projSpeed += getPassiveTotalValue(passive, level);

                    break;

                case 'duration':

                    stats.duration += getPassiveTotalValue(passive, level);

                    break;

                case 'projCount':

                    stats.projCount += getPassiveTotalValue(passive, level);

                    break;

                case 'speed':

                    stats.speed += getPassiveTotalValue(passive, level);

                    break;

                case 'magnet':

                    stats.magnet += getPassiveTotalValue(passive, level);

                    break;

                case 'luck':

                    stats.luck += getPassiveTotalValue(passive, level);

                    break;

                case 'expBonus':

                    stats.expBonus += getPassiveTotalValue(passive, level);

                    break;

                case 'lifeSteal':

                    stats.lifeSteal += getPassiveTotalValue(passive, level);

                    break;

            }

        }

        

        const focusLevel = this.getLevel('focus_lens');
        const cloverLevel = this.getLevel('clover');
        const flaskLevel = this.getLevel('alchemist_flask');
        const spinachLevel = this.getLevel('spinach');
        const pummarolaLevel = this.getLevel('pummarola');
        const armorLevel = this.getLevel('armor');
        const wingsLevel = this.getLevel('wings');
        const crownLevel = this.getLevel('crown');
        const attractorbLevel = this.getLevel('attractorb');
        const spellbinderLevel = this.getLevel('spellbinder');

        if (focusLevel > 0 && cloverLevel > 0) {
            stats.focusPower = 0.05 + focusLevel * 0.012;
            stats.luckyNovaChance = Math.min(0.5, 0.12 + cloverLevel * 0.03);
            stats.luckyNovaRadius = 88 + focusLevel * 10 + cloverLevel * 6;
            stats.activeSynergies.push('focus_refraction');
        }

        if (flaskLevel > 0 && spinachLevel > 0) {
            stats.alchemyChance = Math.min(0.55, 0.16 + flaskLevel * 0.035);
            stats.alchemyRadius = 92 + flaskLevel * 10 + spinachLevel * 6;
            stats.alchemyDot = 6 + flaskLevel * 2 + spinachLevel;
            stats.activeSynergies.push('alchemy_reaction');
        }

        if (pummarolaLevel > 0 && armorLevel > 0) {
            stats.retributionPulse = 0.12 + pummarolaLevel * 0.025 + armorLevel * 0.015;
            stats.retributionRadius = 96 + armorLevel * 12 + pummarolaLevel * 8;
            stats.activeSynergies.push('blood_armor_pulse');
        }

        if (wingsLevel > 0 && focusLevel > 0) {
            stats.moveConduction = 0.08 + wingsLevel * 0.015 + focusLevel * 0.01;
            stats.moveConductionWidth = 2 + focusLevel + Math.floor(wingsLevel * 0.5);
            stats.moveConductionChain = 26 + wingsLevel * 12 + focusLevel * 8;
            stats.activeSynergies.push('storm_guidance');
        }

        if (spellbinderLevel > 0 && flaskLevel > 0) {
            stats.lingeringFieldScale = 0.42 + spellbinderLevel * 0.03;
            stats.lingeringFieldDuration = 1.2 + spellbinderLevel * 0.22 + flaskLevel * 0.16;
            stats.lingeringTickRateMul = Math.max(0.55, 0.9 - spellbinderLevel * 0.035 - flaskLevel * 0.025);
            stats.activeSynergies.push('lingering_field');
        }

        if (crownLevel > 0 && attractorbLevel > 0) {
            stats.pickupMomentum = 0.018 + crownLevel * 0.006 + attractorbLevel * 0.004;
            stats.pickupMomentumCap = 0.18 + crownLevel * 0.03 + attractorbLevel * 0.02;
            stats.activeSynergies.push('royal_magnetism');
        }

        return stats;

    }

    

    // 检查是否有某个被动

    has(key) {

        return (this.passives[key] || 0) > 0;

    }

    

    // 获取被动等级

    getLevel(key) {

        return this.passives[key] || 0;

    }

    

    // 获取所有被动列表（用于UI显示）

    getOwnedPassives() {

        const list = [];

        for (const [key, level] of Object.entries(this.passives)) {

            const passive = PASSIVES[key];

            if (passive && level > 0) {

                list.push({

                    key: key,

                    name: passive.name,

                    icon: passive.icon,

                    level: level,

                    maxLevel: passive.maxLevel,

                    desc: passive.desc

                });

            }

        }

        return list;

    }

    

    // 检查是否可以合成超武 - v0.18.2 fix: 需要被动满级

    // v0.22: 检查进化条件（只需1级被动，不需要满级）
    checkEvolution(weaponKey) {
        const evo = WEAPON_EVOLUTIONS[weaponKey];
        if (!evo) return null;
        
        // v0.22: 只需有对应被动即可（1级就行）
        if (!this.has(evo.requires)) return null;
        
        return evo;
    }

    

    // 序列化（用于存档）

    serialize() {

        return this.passives;

    }

    

    // 反序列化（用于读档）

    deserialize(data) {

        this.passives = data || {};

    }

}



// 武器系统 - 支持进化

const WEAPONS = {
    // 近战类 - v0.16.3: 高伤害低射程
    whip: { key: 'whip', name: '圣剑', icon: '⚔️', iconSprite: 'weapon_whip', dmg: 28, cd: 0.72, range: 336, arcAngle: 128, type: 'melee', subtype: 'arc', color: '#ffd36b', knockback: 34, maxLevel: 8 },
    scythe: { key: 'scythe', name: '镰刀', icon: '⚰️', iconSprite: 'weapon_scythe', dmg: 45, cd: 0.92, range: 364, type: 'melee', subtype: 'circle', color: '#884488', knockback: 46, maxLevel: 8 },
    
    // 投射类 - v0.16.3: 自带多重的降低单个伤害
    wand: { key: 'wand', name: '魔杖', icon: '🔮', dmg: 18, cd: 0.6, speed: 380, range: 450, type: 'proj', subtype: 'homing', color: '#4488ff', homingStrength: 0.8, count: 1, maxLevel: 8 },
    knife: { key: 'knife', name: '飞刀', icon: '🗡️', dmg: 13, cd: 0.33, speed: 540, range: 420, pierce: 3, type: 'proj', subtype: 'rapid', color: '#cccccc', burst: 3, count: 1, maxLevel: 8 },
    axe: { key: 'axe', name: '斧头', icon: '🪓', dmg: 31, cd: 1.1, speed: 320, range: 360, type: 'proj', subtype: 'boomerang', color: '#8b4513', count: 1, maxLevel: 8 },
    cross: { key: 'cross', name: '十字架', icon: '✝️', dmg: 22, cd: 1.0, speed: 360, range: 450, type: 'proj', subtype: 'bounce', color: '#dddddd', bounce: 3, count: 1, maxLevel: 8 },
    fireball: { key: 'fireball', name: '火球', icon: '🔥', dmg: 31, cd: 1.28, speed: 420, range: 520, type: 'proj', subtype: 'explode', color: '#ff4500', explodeRadius: 175, count: 1, maxLevel: 8 },
    shuriken: { key: 'shuriken', name: '手里剑', icon: '🎯', dmg: 15, cd: 0.6, speed: 480, range: 400, type: 'proj', subtype: 'fan', color: '#888888', count: 3, spread: 25, maxLevel: 8 },
    icicle: { key: 'icicle', name: '冰锥', icon: '❄️', dmg: 26, cd: 0.8, speed: 420, range: 520, pierce: 99, type: 'proj', subtype: 'penetrate', color: '#aaffff', slow: 0.45, count: 1, maxLevel: 8 },
    laser: { key: 'laser', name: '激光', icon: '🔦', dmg: 22, cd: 0.68, range: 3000, type: 'laser', color: '#ff0044', width: 14, beamLife: 0.22, tickCooldown: 0.15, maxLevel: 8 },
    poison_dart: { key: 'poison_dart', name: '毒镖', icon: '📍', dmg: 14, cd: 0.45, speed: 460, range: 450, type: 'proj', subtype: 'poison_homing', color: '#44aa44', homingStrength: 1.0, poison: 6, count: 1, maxLevel: 8 },
    
    // 特殊类 - v0.16.3: AOE武器降低基础伤害
    bible: { key: 'bible', name: '圣经', icon: '📖', dmg: 24, cd: 4.9, range: 320, count: 7, duration: 10, orbitRadius: 320, orbitSpeed: 4.5, type: 'orbit', color: '#ffd700', maxLevel: 8 },
    lightning: { key: 'lightning', name: '闪电', icon: '⚡', dmg: 18, cd: 0.54, range: 680, chain: 5, chainRange: 420, type: 'instant', subtype: 'chain', color: '#ffff00', count: 1, maxLevel: 8 },
    holy_water: { key: 'holy_water', name: '圣水', icon: '💧', dmg: 18, cd: 2.5, range: 560, duration: 8.2, tickRate: 0.18, slow: 0.5, type: 'area', color: '#00bfff', count: 3, maxLevel: 8 },
    // v0.18.0: 辉耀 - 参考DOTA，持续灼烧周围敌人
    radiance: { key: 'radiance', name: '辉耀', icon: '🔥', dmg: 12, cd: 0.2, range: 280, tickRate: 0.18, type: 'aura', color: '#ff6600', burn: true, maxLevel: 8 }
};



// 被动道具系统（吸血鬼幸存者风格）

const PASSIVES = {

    spinach: { key: 'spinach', name: '菠菜', icon: '🥬', desc: '伤害+9%', effect: 'dmg', value: 0.09, maxLevel: 5 },

    armor: { key: 'armor', name: '护甲', icon: '🛡️', desc: '护甲+1，提升格挡概率', effect: 'armor', value: 1, maxLevel: 5 },

    hollow_heart: { key: 'hollow_heart', name: '空心之心', icon: '💝', desc: '最大生命+20%', effect: 'maxHpPct', value: 0.2, maxLevel: 5 },

    empty_tome: { key: 'empty_tome', name: '空白之书', icon: '📚', desc: '冷却-7%', effect: 'cooldown', value: 0.07, maxLevel: 5 },

    candelabrador: { key: 'candelabrador', name: '烛台', icon: '🕯️', desc: '攻击范围+9%', effect: 'range', value: 0.09, maxLevel: 5 },

    bracer: { key: 'bracer', name: '护腕', icon: '💪', desc: '弹射速度+10%', effect: 'projSpeed', value: 0.1, maxLevel: 5 },

    spellbinder: { key: 'spellbinder', name: '魔法拼写器', icon: '✨', desc: '持续时间+10%', effect: 'duration', value: 0.1, maxLevel: 5 },

    duplicator: { key: 'duplicator', name: '复制器', icon: '🔄', desc: '投射物阶段性增幅', effect: 'projCount', value: 1, perLevel: [1, 1, 1, 0, 1], maxLevel: 5 },

    wings: { key: 'wings', name: '翅膀', icon: '🪶', desc: '移速+10%，移动构筑更顺手', effect: 'speed', value: 0.1, maxLevel: 5 },

    attractorb: { key: 'attractorb', name: '吸引器', icon: '🧲', desc: '拾取范围+20%，拾取联动更强', effect: 'magnet', value: 20, maxLevel: 5 },

    clover: { key: 'clover', name: '四叶草', icon: '🍀', desc: '幸运+10%', effect: 'luck', value: 0.1, maxLevel: 5 },

    crown: { key: 'crown', name: '王冠', icon: '👑', desc: '经验获取+6%，拾取势能更强', effect: 'expBonus', value: 0.06, maxLevel: 5 },

    focus_lens: { key: 'focus_lens', name: '聚焦晶镜', icon: '🔎', desc: '攻击范围+10%，聚焦武器更稳定', effect: 'range', value: 0.1, maxLevel: 5 },

    alchemist_flask: { key: 'alchemist_flask', name: '炼金瓶', icon: '⚗️', desc: '持续时间+10%，残留与反应更持久', effect: 'duration', value: 0.1, maxLevel: 5 },

    pummarola: { key: 'pummarola', name: '红石榴', icon: '🍎', desc: '吸血+5%', effect: 'lifeSteal', value: 0.05, maxLevel: 5 }

};



// 超武合成配方（武器满级+对应被动=超武）

const WEAPON_EVOLUTIONS = {

    whip: { 

        requires: 'hollow_heart', 

        result: 'blood_whip',

        name: '圣裁之剑',

        icon: '🗡️',

        desc: '圣焰斩击并吸血',

        bonus: { dmg: 1.5, lifeSteal: 0.1, crit: 0.15 }

    },

    wand: { 
        requires: 'empty_tome', 
        result: 'holy_wand',
        name: '圣魔杖',
        icon: '🔯',
        desc: '极速追踪',
        bonus: { cd: 0.2, homingStrength: 2.0, speed: 1.2 }
    },

    knife: { 
        requires: 'bracer', 
        result: 'thousand_blade',
        name: '千刃',
        icon: '💠',
        desc: '极速连射',
        bonus: { cd: 0.1, burst: 5, speed: 1.25 }
    },

    axe: { 
        requires: 'candelabrador', 
        result: 'death_spiral',
        name: '死亡螺旋',
        icon: '🌀',
        desc: '穿透高伤',
        bonus: { dmg: 1.8, pierce: 10, range: 1.25 }
    },

    cross: { 
        requires: 'clover', 
        result: 'heaven_sword',
        name: '天穹十字',
        icon: '✝️',
        desc: '高暴击神圣弹跳',
        bonus: { dmg: 2.3, crit: 0.25, bounce: 5 }
    },

    bible: { 
        requires: 'crown', 
        result: 'unholy_vespers',
        name: '邪恶晚祷',
        icon: '📿',
        desc: '高速圣环压场',
        bonus: { duration: 2.2, count: 5, range: 1.35 }
    },

    fireball: { 
        requires: 'spinach', 
        result: 'hellfire',
        name: '地狱火',
        icon: '🔥',
        desc: '大范围爆炸',
        bonus: { dmg: 1.7, explodeRadius: 1.5, pierce: 5 }
    },

    holy_water: { 

        requires: 'alchemist_flask', 

        result: 'la_borra',

        name: '拉博拉',

        icon: '💦',

        desc: '炼成污染圣池',

        bonus: { homing: true, range: 1.5 }

    },

    // 新增超武合成

    shuriken: { 

        requires: 'duplicator', 

        result: 'ninja_storm',

        name: '忍者风暴',

        icon: '🌀',

        desc: '弹幕齐射',

        bonus: { projCount: 3, cd: 0.5 }

    },

    icicle: { 

        requires: 'spellbinder', 

        result: 'blizzard',

        name: '暴风雪',

        icon: '🌨️',

        desc: '范围冰冻',

        bonus: { range: 2, slow: true }

    },

    scythe: { 

        requires: 'armor', 

        result: 'death_scythe',

        name: '死神镰刀',

        icon: '💀',

        desc: '即死判定',

        bonus: { dmg: 2, execute: 0.1 }

    },

    laser: { 

        requires: 'focus_lens', 

        result: 'prism_beam',

        name: '炽天使硫磺',

        icon: '🔴',

        desc: '曲线追踪贯穿',

        bonus: { cd: 0.5, width: 1.8, duration: 2.2 }

    },

    poison_dart: { 

        requires: 'attractorb', 

        result: 'toxic_strike',

        name: '剧毒打击',

        icon: '☠️',

        desc: '剧毒蔓延',

        bonus: { poison: true, poisonDmg: 5 }

    },

    // v0.18.0: 辉耀进化 - 日天辉耀（参考DOTA辉耀）
    radiance: { 
        requires: 'pummarola', 
        result: 'solar_radiance',
        name: '日天辉耀',
        icon: '☀️',
        desc: '太阳灼烧+致盲',
        bonus: { range: 2.5, dmg: 2, blind: true }
    },

    lightning: {
        requires: 'wings',
        result: 'storm_arc',
        name: '风暴弧光',
        icon: '⛈️',
        desc: '连锁扩散雷网',
        bonus: { chain: 8, chainRange: 1.5, randomStrikes: true }
    }

};



// 超武定义 - v0.16.3: 恢复超武高伤害，只削弱初始武器
const SUPER_WEAPONS = {
    // 近战超武 - 高伤害
    blood_whip: { 
        name: '圣裁之剑', icon: '🗡️', dmg: 104, cd: 0.46, range: 520, arcAngle: 230, 
        type: 'melee', subtype: 'arc', color: '#ffe08a', knockback: 84, lifeSteal: 0.28,
        count: 4, crit: 0.35, critDmg: 2.8, special: '四重圣裁剑弧+暴击吸血'
    },
    death_scythe: { 
        name: '死神镰刀', icon: '💀', iconSprite: 'weapon_scythe', dmg: 178, cd: 0.62, range: 560, 
        type: 'melee', subtype: 'circle', color: '#440044', knockback: 96,
        count: 5, execute: { chance: 0.5, threshold: 0.5 }, special: '五重收割+半血处决'
    },
    
    // 投射超武 - 高伤害，体现超武价值
    holy_wand: { 
        name: '圣魔杖', icon: '🔯', dmg: 65, cd: 0.12, speed: 500, range: 600,
        type: 'proj', subtype: 'homing', color: '#8888ff', homingStrength: 3.0,
        count: 4, pierce: 5, chain: 5, special: '四连发+高伤害+连锁'
    },
    thousand_blade: { 
        name: '千刃', icon: '💠', dmg: 40, cd: 0.07, speed: 680, range: 560,
        type: 'proj', subtype: 'rapid', color: '#00ffff', burst: 5, pierce: 5, bounce: 3,
        count: 4, special: '4重千刃连发风暴'
    },
    death_spiral: { 
        name: '死亡螺旋', icon: '🌀', dmg: 100, cd: 0.7, speed: 350, range: 450, 
        type: 'proj', subtype: 'boomerang', color: '#880000', pierce: 99,
        count: 6, tripleThrow: true, returnDamage: true, special: '六重回旋镖+去回双伤'
    },
    heaven_sword: { 
        name: '天穹十字', icon: '✝️', iconSprite: 'weapon_whip', dmg: 110, cd: 0.8, speed: 450, range: 550,
        type: 'proj', subtype: 'bounce', color: '#ffee00', bounce: 99, crit: 0.65, critDmg: 4,
        count: 4, divineNova: true, special: '四重神圣弹跳+暴击新星'
    },
    // AOE超武 - 高伤害
    hellfire: { 
        name: '地狱火', icon: '🔥', dmg: 182, cd: 0.8, speed: 500, range: 620,
        type: 'proj', subtype: 'explode', color: '#ff4400', explodeRadius: 360,
        count: 6, split: 5, nova: true, secondaryExplosion: true, burnSpread: true, special: '六连爆裂地狱火+超大范围二段爆炸'
    },
    ninja_storm: { 
        name: '忍者风暴', icon: '🌀', dmg: 70, cd: 0.3, speed: 550, range: 550,
        type: 'proj', subtype: 'fan', color: '#888888', count: 12, spread: 90,
        returnToPlayer: true, pierce: 5, special: '12枚散射+高伤害'
    },
    blizzard: { 
        name: '暴风雪', icon: '🌨️', dmg: 70, cd: 0.6, speed: 400, range: 650,
        type: 'proj', subtype: 'penetrate', color: '#aaffff', pierce: 99, slow: 0.8,
        count: 6, freezeChance: 0.4, freezeDuration: 3, blizzardAOE: true, special: '六重+冻结3秒'
    },
    prism_beam: { 
        name: '炽天使硫磺', icon: '🔴', dmg: 65, cd: 0.3, range: 3000,
        type: 'laser', color: '#ff2f6d', width: 28, beamLife: 0.72, tickCooldown: 0.05,
        homingCurve: true, preferMoveDirection: true, turnRate: 2.35, maxTrackAngle: 0.48, segmentLength: 52,
        special: '沿走位喷射，在扇区内曲线索敌贯穿'
    },
    toxic_strike: { 
        name: '剧毒打击', icon: '☠️', dmg: 45, cd: 0.2, speed: 550, range: 600,
        type: 'proj', subtype: 'poison_homing', color: '#008800', homingStrength: 2.5,
        count: 6, poisonDmg: 40, spreadRange: 400, plagueBurst: true, special: '六重+毒爆瘟疫'
    },
    
    // 特殊超武
    unholy_vespers: { 
        name: '邪恶晚祷', icon: '📿', dmg: 106, cd: 0.82, range: 620, 
        type: 'orbit', color: '#ff6600', count: 14, duration: 24,
        rotationSpeed: 6.1, special: '十四重永续圣环+高速碾压'
    },
    la_borra: { 
        name: '拉博拉', icon: '💦', dmg: 76, cd: 0.72, range: 1080, duration: 20, 
        type: 'area', color: '#4488ff', count: 7, tickRate: 0.06,
        homing: true, slow: 0.72, special: '七片追踪污染圣池+极高频灼洗'
    },
    // 大蒜超武
    // v0.18.0: 日天辉耀 - 参考DOTA辉耀超武
    solar_radiance: { 
        name: '日天辉耀', icon: '☀️', dmg: 40, cd: 0.12, range: 620, tickRate: 0.12,
        type: 'aura', color: '#ffaa00', burn: true, blind: true, 
        special: '太阳领域扩张+高频灼烧+致盲'
    },
    storm_arc: {
        name: '风暴弧光', icon: '⛈️', dmg: 68, cd: 0.2, range: 920,
        type: 'instant', subtype: 'chain', color: '#aef6ff', chain: 14, chainRange: 560,
        fork: true, branches: 4, randomStrikes: true, special: '高频分叉雷网+密集落雷'
    }
};



