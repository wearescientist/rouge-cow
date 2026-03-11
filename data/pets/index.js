const PETS = {
    // 基础宠物 - v0.20.0: 全屏射程 + 高伤害
    brimstone: {
        id: 'brimstone',
        name: '硫磺火牛',
        icon: '🔥',
        desc: '发射贯穿全屏的火焰激光',
        rarity: 'epic',
        attackType: 'laser',
        damage: 80,  // v0.20.0: 大幅提升伤害
        attackCd: 2.0,  // v0.20.0: 略微加快
        attackRange: 3000,  // v0.20.0: 全屏射程
        color: '#ff4400',
        laserWidth: 30  // v0.20.0: 激光宽度
    },
    tech: {
        id: 'tech',
        name: '科技牛',
        icon: '🔬',
        desc: '环绕玩家发射激光',
        rarity: 'epic',
        attackType: 'orbit',
        damage: 40,  // v0.20.0: 提升伤害
        attackCd: 0.1,
        attackRange: 400,  // v0.20.0: 增大环绕范围
        color: '#00ff88'
    },
    tear: {
        id: 'tear',
        name: '眼泪牛',
        icon: '💧',
        desc: '发射会弹跳的眼泪',
        rarity: 'rare',
        attackType: 'bounce',
        damage: 50,  // v0.20.0: 大幅提升伤害
        attackCd: 0.8,  // v0.20.0: 略微加快
        attackRange: 3000,  // v0.20.0: 全屏射程
        color: '#4488ff'
    },
    bomb: {
        id: 'bomb',
        name: '炸弹牛',
        icon: '💣',
        desc: '向敌人投掷炸弹',
        rarity: 'rare',
        attackType: 'bomb',
        damage: 120,  // v0.20.0: 大幅提升伤害
        attackCd: 1.5,  // v0.20.0: 略微加快
        attackRange: 3000,  // v0.20.0: 全屏射程
        color: '#ff8800',
        explodeRadius: 150  // v0.20.0: 增大爆炸范围
    },
    knife: {
        id: 'knife',
        name: '飞刀牛',
        icon: '🔪',
        desc: '发射回旋飞刀',
        rarity: 'rare',
        attackType: 'boomerang',
        damage: 60,  // v0.20.0: 大幅提升伤害
        attackCd: 1.2,  // v0.20.0: 略微加快
        attackRange: 400,  // v0.20.0: 增大射程
        color: '#cccccc'
    },
    blackhole: {
        id: 'blackhole',
        name: '黑洞牛',
        icon: '🕳️',
        desc: '发射吸引敌人的黑洞',
        rarity: 'legendary',
        attackType: 'blackhole',
        damage: 30,  // v0.20.0: 大幅提升伤害
        attackCd: 3.0,  // v0.20.0: 略微加快
        attackRange: 3000,  // v0.20.0: 全屏射程
        color: '#440044',
        pullRadius: 250  // v0.20.0: 增大吸引范围
    },
    aura: {
        id: 'aura',
        name: '光环牛',
        icon: '✨',
        desc: '周围持续造成伤害',
        rarity: 'epic',
        attackType: 'aura',
        damage: 25,  // v0.20.0: 大幅提升伤害
        attackCd: 0.3,  // v0.20.0: 更快触发
        attackRange: 200,  // v0.20.0: 增大光环范围
        color: '#ffcc00'
    },
    missile: {
        id: 'missile',
        name: '导弹牛',
        icon: '🚀',
        desc: '发射追踪导弹',
        rarity: 'epic',
        attackType: 'homing',
        damage: 100,  // v0.20.0: 大幅提升伤害
        attackCd: 1.5,  // v0.20.0: 略微加快
        attackRange: 3000,  // v0.20.0: 全屏射程
        color: '#ff4444'
    },
    copy: {
        id: 'copy',
        name: '复制牛',
        icon: '📋',
        desc: '复制玩家上一次攻击',
        rarity: 'legendary',
        attackType: 'copy',
        damage: 0.8, // v0.20.0: 80%玩家伤害
        attackCd: 0.8,  // v0.20.0: 更快触发
        attackRange: 3000,  // v0.20.0: 全屏射程
        color: '#8888ff'
    },
    ice: {
        id: 'ice',
        name: '冰冻牛',
        icon: '❄️',
        desc: '发射减速敌人的冰锥',
        rarity: 'rare',
        attackType: 'slow',
        damage: 45,  // v0.20.0: 大幅提升伤害
        attackCd: 1.0,  // v0.20.0: 略微加快
        attackRange: 3000,  // v0.20.0: 全屏射程
        color: '#88ccff'
    },
    thunder: {
        id: 'thunder',
        name: '雷电牛',
        icon: '⚡',
        desc: '发射跳跃的闪电',
        rarity: 'rare',
        attackType: 'chain',
        damage: 60,  // v0.20.0: 大幅提升伤害
        attackCd: 1.2,  // v0.20.0: 略微加快
        attackRange: 3000,  // v0.20.0: 全屏射程
        color: '#ffff00'
    },
    holy: {
        id: 'holy',
        name: '圣心牛',
        icon: '💖',
        desc: '发射追踪眼泪并治疗玩家',
        rarity: 'legendary',
        attackType: 'heal',
        damage: 70,  // v0.20.0: 大幅提升伤害
        attackCd: 0.8,  // v0.20.0: 略微加快
        attackRange: 3000,  // v0.20.0: 全屏射程
        heal: 2, // v0.20.0: 每次攻击回复2血
        color: '#ff88ff'
    },
    godhead: {
        id: 'godhead',
        name: '神性牛',
        icon: '✨',
        desc: '发射带神圣光环的眼泪',
        rarity: 'mythic',
        attackType: 'aoe',
        damage: 100,  // v0.20.0: 大幅提升伤害
        attackCd: 1.0,  // v0.20.0: 略微加快
        attackRange: 3000,  // v0.20.0: 全屏射程
        color: '#ffd700'
    },
    dragon: {
        id: 'dragon',
        name: '幼龙',
        icon: '🐉',
        desc: '喷吐火焰',
        rarity: 'epic',
        attackType: 'breath',
        damage: 35,  // v0.20.0: 大幅提升伤害
        attackCd: 0.2,  // v0.20.0: 更快喷射
        attackRange: 350,  // v0.20.0: 更大射程
        color: '#ff6644'
    },
    fairy: {
        id: 'fairy',
        name: '小精灵',
        icon: '🧚',
        desc: '快速发射小子弹',
        rarity: 'rare',
        attackType: 'rapid',
        damage: 20,  // v0.20.0: 大幅提升伤害
        attackCd: 0.25,  // v0.20.0: 更快射击
        attackRange: 3000,  // v0.20.0: 全屏射程
        color: '#88ff88'
    }
}

// Export to global
window.PETS = PETS;
