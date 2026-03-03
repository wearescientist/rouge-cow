# 道具系统重构设计 v2.0 - 道具清单（100个）

## 普通道具（白色）- 30个

### 基础属性类（10个）
```javascript
const COMMON_ITEMS = [
    {
        id: 'whetstone',
        name: '磨刀石',
        icon: '🗡️',
        description: '武器伤害+10%',
        effect: { type: 'damage_up', value: 0.10 }
    },
    {
        id: 'light_gloves',
        name: '轻手套',
        icon: '🧤',
        description: '攻击速度+15%',
        effect: { type: 'attack_speed', value: 0.15 }
    },
    {
        id: 'telescope',
        name: '望远镜',
        icon: '🔭',
        description: '攻击范围+20%',
        effect: { type: 'range_up', value: 0.20 }
    },
    {
        id: 'apple',
        name: '红苹果',
        icon: '🍎',
        description: '最大生命值+1',
        effect: { type: 'max_hp', value: 1 }
    },
    {
        id: 'bread',
        name: '面包',
        icon: '🍞',
        description: '最大生命值+2',
        effect: { type: 'max_hp', value: 2 }
    },
    {
        id: 'leather_armor',
        name: '皮甲',
        icon: '🦺',
        description: '护甲+1',
        effect: { type: 'armor', value: 1 }
    },
    {
        id: 'running_shoes',
        name: '跑鞋',
        icon: '👟',
        description: '移动速度+10%',
        effect: { type: 'move_speed', value: 0.10 }
    },
    {
        id: 'bandage',
        name: '绷带',
        icon: '🩹',
        description: '生命回复+0.5/秒',
        effect: { type: 'regen', value: 0.5 }
    },
    {
        id: 'lucky_coin',
        name: '幸运币',
        icon: '🪙',
        description: '金币获取+15%',
        effect: { type: 'gold_bonus', value: 0.15 }
    },
    {
        id: 'notebook',
        name: '笔记本',
        icon: '📓',
        description: '经验获取+15%',
        effect: { type: 'exp_bonus', value: 0.15 }
    }
];
```

### 武器改造类（10个）
```javascript
const COMMON_WEAPON_ITEMS = [
    {
        id: 'extra_arrow',
        name: '额外箭矢',
        icon: '🏹',
        description: '投射物数量+1（上限+5）',
        effect: { type: 'multishot', value: 1, maxBonus: 5 }
    },
    {
        id: 'sharp_tip',
        name: '锋利箭头',
        icon: '📌',
        description: '穿透+1（上限+3）',
        effect: { type: 'pierce', value: 1, maxBonus: 3 }
    },
    {
        id: 'rubber_coating',
        name: '橡胶涂层',
        icon: '🎾',
        description: '子弹弹射+1（上限+3）',
        effect: { type: 'bounce', value: 1, maxBonus: 3 }
    },
    {
        id: 'heavy_head',
        name: '重型弹头',
        icon: '🔨',
        description: '子弹尺寸+20%',
        effect: { type: 'projectile_size', value: 0.20 }
    },
    {
        id: 'quick_reload',
        name: '快速装填',
        icon: '⚡',
        description: '冷却时间-10%',
        effect: { type: 'cooldown', value: 0.10 }
    },
    {
        id: 'extended_mag',
        name: '扩容弹夹',
        icon: '📦',
        description: '弹夹容量+20%',
        effect: { type: 'magazine', value: 0.20 }
    },
    {
        id: 'stabilizer',
        name: '稳定器',
        icon: '🎯',
        description: '子弹扩散-15%',
        effect: { type: 'spread_reduce', value: 0.15 }
    },
    {
        id: 'magnifying_lens',
        name: '放大镜',
        icon: '🔍',
        description: '暴击率+5%',
        effect: { type: 'crit_chance', value: 0.05 }
    },
    {
        id: 'gunpowder',
        name: '火药粉',
        icon: '🧨',
        description: '爆炸范围+15%',
        effect: { type: 'aoe_radius', value: 0.15 }
    },
    {
        id: 'wind_enchant',
        name: '风之附魔',
        icon: '💨',
        description: '子弹速度+20%',
        effect: { type: 'projectile_speed', value: 0.20 }
    }
];
```

### 生存防御类（10个）
```javascript
const COMMON_DEFENSE_ITEMS = [
    {
        id: 'small_shield',
        name: '小圆盾',
        icon: '🛡️',
        description: '格挡1次伤害（每60秒）',
        effect: { type: 'shield_block', value: 1, cooldown: 60 }
    },
    {
        id: 'first_aid',
        name: '急救包',
        icon: '💊',
        description: '使用后回复3点生命（一次性）',
        effect: { type: 'heal', value: 3, consumable: true }
    },
    {
        id: 'dodge_boots',
        name: '闪避靴',
        icon: '👢',
        description: '闪避率+5%',
        effect: { type: 'dodge', value: 0.05 }
    },
    {
        id: 'hp_potion',
        name: '生命药水',
        icon: '🧪',
        description: '拾取时回复2点生命',
        effect: { type: 'heal_on_pickup', value: 2 }
    },
    {
        id: 'iron_ring',
        name: '铁指环',
        icon: '💍',
        description: '受到伤害-0.5',
        effect: { type: 'damage_reduction_flat', value: 0.5 }
    },
    {
        id: 'repel_ring',
        name: '排斥指环',
        icon: '💫',
        description: '敌人靠近时小幅击退',
        effect: { type: 'knockback_aura', value: 20 }
    },
    {
        id: 'timer',
        name: '定时器',
        icon: '⏱️',
        description: '冲刺冷却-0.5秒',
        effect: { type: 'dash_cd', value: 0.5 }
    },
    {
        id: 'energy_drink',
        name: '能量饮料',
        icon: '🥤',
        description: '冲刺距离+20%',
        effect: { type: 'dash_distance', value: 0.20 }
    },
    {
        id: 'magnet',
        name: '小磁铁',
        icon: '🧲',
        description: '拾取范围+30%',
        effect: { type: 'pickup_range', value: 0.30 }
    },
    {
        id: 'safety_ring',
        name: '安全护符',
        icon: '📿',
        description: '受到致命伤害时保留1点生命（每房间1次）',
        effect: { type: 'death_defy', value: 1, cooldown: 'room' }
    }
];
```

## 优秀道具（绿色）- 20个

```javascript
const UNCOMMON_ITEMS = [
    // 属性类
    {
        id: 'iron_sword',
        name: '铁剑',
        icon: '⚔️',
        description: '武器伤害+20%',
        effect: { type: 'damage_up', value: 0.20 }
    },
    {
        id: 'chain_mail',
        name: '锁子甲',
        icon: '🦺',
        description: '护甲+2，移速-5%',
        effect: { type: 'armor', value: 2, penalty: { move_speed: -0.05 } }
    },
    {
        id: 'steak',
        name: '牛排',
        icon: '🥩',
        description: '最大生命值+3，回复满血',
        effect: { type: 'max_hp', value: 3, heal_full: true }
    },
    {
        id: 'green_herb',
        name: '草药',
        icon: '🌿',
        description: '生命回复+1/秒',
        effect: { type: 'regen', value: 1.0 }
    },
    {
        id: 'roller_skates',
        name: '轮滑鞋',
        icon: '🛼',
        description: '移速+20%，冲刺距离+10%',
        effect: { type: 'move_speed', value: 0.20, dash_distance: 0.10 }
    },
    
    // 武器类
    {
        id: 'double_shot',
        name: '双重射击',
        icon: '📏',
        description: '投射物数量+2',
        effect: { type: 'multishot', value: 2 }
    },
    {
        id: 'drill_tip',
        name: '钻头箭头',
        icon: '🔩',
        description: '穿透+2',
        effect: { type: 'pierce', value: 2 }
    },
    {
        id: 'super_ball',
        name: '超级弹球',
        icon: '🔴',
        description: '弹射+2，弹射后伤害+20%',
        effect: { type: 'bounce', value: 2, bounce_damage: 0.20 }
    },
    {
        id: 'laser_sight',
        name: '激光瞄准',
        icon: '🔦',
        description: '暴击率+10%，扩散-20%',
        effect: { type: 'crit_chance', value: 0.10, spread_reduce: 0.20 }
    },
    {
        id: 'homing_module',
        name: '追踪模块',
        icon: '🧭',
        description: '子弹小幅追踪（15度）',
        effect: { type: 'homing', value: 15 }
    },
    
    // 防御类
    {
        id: 'medkit',
        name: '医疗箱',
        icon: '🏥',
        description: '每秒回复2%最大生命（低于50%时翻倍）',
        effect: { type: 'regen_percent', value: 0.02, double_threshold: 0.50 }
    },
    {
        id: 'barrier_device',
        name: '屏障装置',
        icon: '🛡️',
        description: '每30秒获得1点护盾',
        effect: { type: 'shield_regen', value: 1, interval: 30 }
    },
    {
        id: 'evasion_cape',
        name: '闪避斗篷',
        icon: '🦇',
        description: '闪避率+10%，闪避后2秒无敌',
        effect: { type: 'dodge', value: 0.10, iframes_on_dodge: 2 }
    },
    {
        id: 'thorn_bush',
        name: '荆棘丛',
        icon: '🌵',
        description: '受到伤害反弹30%',
        effect: { type: 'thorn', value: 0.30 }
    },
    {
        id: 'vampire_fang',
        name: '吸血獠牙',
        icon: '🦷',
        description: '造成伤害的5%转为生命',
        effect: { type: 'life_steal', value: 0.05 }
    },
    
    // 特殊类
    {
        id: 'piggy_bank',
        name: '存钱罐',
        icon: '🐷',
        description: '金币获取+30%，每100金币+1%伤害',
        effect: { type: 'gold_bonus', value: 0.30, gold_to_damage: 0.0001 }
    },
    {
        id: 'wise_book',
        name: '智慧书',
        icon: '📚',
        description: '经验获取+30%，升级时回复10%生命',
        effect: { type: 'exp_bonus', value: 0.30, heal_on_level_up: 0.10 }
    },
    {
        id: 'clover',
        name: '四叶草',
        icon: '🍀',
        description: '道具稀有度+10%，掉落率+20%',
        effect: { type: 'rarity_bonus', value: 0.10, drop_rate: 0.20 }
    },
    {
        id: 'alarm_clock',
        name: '闹钟',
        icon: '⏰',
        description: '所有武器冷却-20%',
        effect: { type: 'cooldown', value: 0.20 }
    },
    {
        id: 'safety_helmet',
        name: '安全帽',
        icon: '⛑️',
        description: '免疫首次伤害（每房间）',
        effect: { type: 'first_hit_immunity', value: true }
    }
];
```

## 稀有道具（蓝色）- 18个

```javascript
const RARE_ITEMS = [
    // 强力属性
    {
        id: 'magic_sword',
        name: '魔法剑',
        icon: '⚔️',
        description: '武器伤害+35%，暴击率+10%',
        effect: { type: 'damage_up', value: 0.35, crit_chance: 0.10 }
    },
    {
        id: 'plate_armor',
        name: '板甲',
        icon: '🛡️',
        description: '护甲+4，免疫击退',
        effect: { type: 'armor', value: 4, knockback_immunity: true }
    },
    {
        id: 'titan_blood',
        name: '泰坦之血',
        icon: '🩸',
        description: '最大生命值+5，当前生命+10',
        effect: { type: 'max_hp', value: 5, current_hp_bonus: 10 }
    },
    
    // 武器改造
    {
        id: 'triple_shot',
        name: '三重射击',
        icon: '📐',
        description: '投射物数量+3，散射角度-20%',
        effect: { type: 'multishot', value: 3, spread_reduce: 0.20 }
    },
    {
        id: 'plasma_tip',
        name: '等离子箭头',
        icon: '⚡',
        description: '穿透+3，穿透后伤害不减少',
        effect: { type: 'pierce', value: 3, pierce_no_falloff: true }
    },
    {
        id: 'time_bullet',
        name: '时停子弹',
        icon: '⏳',
        description: '子弹速度-30%，伤害+50%',
        effect: { type: 'bullet_slow', value: 0.30, damage_bonus: 0.50 }
    },
    
    // 防御生存
    {
        id: 'auto_heal',
        name: '自动治疗',
        icon: '❤️',
        description: '生命低于30%时自动回复50%（每90秒）',
        effect: { type: 'auto_heal', threshold: 0.30, heal: 0.50, cooldown: 90 }
    },
    {
        id: 'resurrection_stone',
        name: '复活石',
        icon: '💎',
        description: '死亡时复活，恢复50%生命（一次性）',
        effect: { type: 'revive', heal: 0.50, consumable: true }
    },
    {
        id: 'force_field',
        name: '力场发生器',
        icon: '🛸',
        description: '每20秒获得2秒无敌护盾',
        effect: { type: 'periodic_invincible', interval: 20, duration: 2 }
    },
    
    // 特殊效果
    {
        id: 'weapon_fusion',
        name: '武器融合器',
        icon: '🔀',
        description: '可以同时激活的武器数+1',
        effect: { type: 'weapon_slot', value: 1 }
    },
    {
        id: 'skill_book',
        name: '技能书',
        icon: '📖',
        description: '所有武器等级+1',
        effect: { type: 'weapon_level_all', value: 1 }
    },
    {
        id: 'explosive_shot',
        name: '爆炸射击',
        icon: '💥',
        description: '子弹击中时爆炸（范围伤害30%）',
        effect: { type: 'explosive_hit', radius: 80, damage_percent: 0.30 }
    },
    {
        id: 'chain_lightning',
        name: '连锁闪电',
        icon: '⚡',
        description: '击中时连锁到2个附近敌人（50%伤害）',
        effect: { type: 'chain', count: 2, damage_percent: 0.50, range: 150 }
    },
    {
        id: 'execute_blade',
        name: '处决之刃',
        icon: '🔪',
        description: '对低于20%生命的敌人必定暴击且伤害+100%',
        effect: { type: 'execute', threshold: 0.20, crit: true, damage_bonus: 1.0 }
    },
    {
        id: 'blood_sword',
        name: '血之剑',
        icon: '🗡️',
        description: '伤害+50%，造成伤害的10%转为生命',
        effect: { type: 'damage_up', value: 0.50, life_steal: 0.10 }
    },
    {
        id: 'gold_midas',
        name: '点金手',
        icon: '👑',
        description: '敌人死亡时有20%变成金币（价值=生命值）',
        effect: { type: 'midas_touch', chance: 0.20 }
    },
    {
        id: 'exp_magnet',
        name: '经验磁铁',
        icon: '🧲',
        description: '经验自动吸取范围+100%，经验+25%',
        effect: { type: 'exp_range', value: 1.0, exp_bonus: 0.25 }
    },
    {
        id: 'summon_scroll',
        name: '召唤卷轴',
        icon: '📜',
        description: '每60秒召唤一个友方单位协助战斗（持续30秒）',
        effect: { type: 'summon', interval: 60, duration: 30 }
    }
];
```

## 史诗道具（紫色）- 14个

```javascript
const EPIC_ITEMS = [
    {
        id: 'dragon_sword',
        name: '龙鳞剑',
        icon: '🐉',
        description: '武器伤害+60%，攻击附带燃烧（2秒）',
        effect: { type: 'damage_up', value: 0.60, burn: 2 }
    },
    {
        id: 'diamond_armor',
        name: '钻石甲',
        icon: '💎',
        description: '护甲+6，受到伤害-30%',
        effect: { type: 'armor', value: 6, damage_reduction: 0.30 }
    },
    {
        id: 'phoenix_feather',
        name: '凤凰羽毛',
        icon: '🪶',
        description: '死亡时满血复活，移速+30%（持续10秒）',
        effect: { type: 'revive_full', speed_bonus: 0.30, duration: 10 }
    },
    
    // 武器改造
    {
        id: 'quintuple_shot',
        name: '五重射击',
        icon: '🎯',
        description: '投射物数量+5，精准度+25%',
        effect: { type: 'multishot', value: 5, accuracy: 0.25 }
    },
    {
        id: 'black_hole_gun',
        name: '黑洞发生器',
        icon: '🌑',
        description: '子弹产生小型黑洞，吸引附近敌人',
        effect: { type: 'black_hole', radius: 100, pull_strength: 50 }
    },
    {
        id: 'laser_beam',
        name: '激光束',
        icon: '🔦',
        description: '所有武器变为穿透激光（无限穿透）',
        effect: { type: 'laser_mode', pierce: 999 }
    },
    
    // 防御
    {
        id: 'immortal_body',
        name: '不朽之身',
        icon: '🏛️',
        description: '每5秒获得1秒无敌，生命回复+3/秒',
        effect: { type: 'periodic_invincible', interval: 5, duration: 1, regen: 3 }
    },
    {
        id: 'mirror_shield',
        name: '镜盾',
        icon: '🪞',
        description: '受到伤害反弹100%，格挡概率+20%',
        effect: { type: 'thorn', value: 1.0, block_chance: 0.20 }
    },
    
    // 特殊
    {
        id: 'weapon_mastery',
        name: '武器精通',
        icon: '🏆',
        description: '武器槽+2，所有武器攻速+30%',
        effect: { type: 'weapon_slot', value: 2, attack_speed: 0.30 }
    },
    {
        id: 'crit_master',
        name: '暴击大师',
        icon: '🎲',
        description: '暴击率+30%，暴击伤害+100%',
        effect: { type: 'crit_chance', value: 0.30, crit_damage: 1.0 }
    },
    {
        id: 'time_stop',
        name: '时间停止器',
        icon: '⏱️',
        description: '每45秒触发时间停止3秒（敌人静止）',
        effect: { type: 'time_stop', interval: 45, duration: 3 }
    },
    {
        id: 'necronomicon',
        name: '死灵书',
        icon: '📕',
        description: '击杀敌人时30%几率复活为友方（持续20秒）',
        effect: { type: 'necromancy', chance: 0.30, duration: 20 }
    },
    {
        id: 'rainbow_gem',
        name: '彩虹宝石',
        icon: '💎',
        description: '每次攻击随机附加一种元素效果（火/冰/雷/毒）',
        effect: { type: 'random_element', elements: ['fire', 'ice', 'lightning', 'poison'] }
    },
    {
        id: 'divine_blessing',
        name: '神圣祝福',
        icon: '✨',
        description: '全属性+15%，受到伤害-15%',
        effect: { type: 'all_stats', value: 0.15, damage_reduction: 0.15 }
    }
];
```

## 传说道具（橙色）- 10个

```javascript
const LEGENDARY_ITEMS = [
    {
        id: 'excalibur',
        name: '王者之剑',
        icon: '⚔️',
        description: '武器伤害+100%，攻击发射剑气（穿透+无限距离）',
        effect: { type: 'damage_up', value: 1.0, sword_beam: { pierce: 999, range: 9999 } }
    },
    {
        id: 'aegis',
        name: '宙斯盾',
        icon: '🛡️',
        description: '完全免疫伤害（3秒/每15秒），护甲+10',
        effect: { type: 'periodic_invincible', interval: 15, duration: 3, armor: 10 }
    },
    {
        id: 'phoenix_heart',
        name: '凤凰之心',
        icon: '❤️',
        description: '无限复活（每次复活后5秒无敌），伤害+30%',
        effect: { type: 'infinite_revive', invincible_on_revive: 5, damage_bonus: 0.30 }
    },
    {
        id: 'octuple_shot',
        name: '八重齐射',
        icon: '🎆',
        description: '投射物数量+8，弹药无限（不消耗CD）',
        effect: { type: 'multishot', value: 8, infinite_ammo: true }
    },
    {
        id: 'black_hole_core',
        name: '黑洞核心',
        icon: '🌌',
        description: '全屏持续吸引敌人（每3秒触发1秒），伤害+50%',
        effect: { type: 'screen_pull', interval: 3, duration: 1, damage_bonus: 0.50 }
    },
    {
        id: 'god_mode',
        name: '神模式',
        icon: '👑',
        description: '10秒内无敌+伤害翻倍（冷却60秒，主动使用）',
        effect: { type: 'active_god_mode', duration: 10, cooldown: 60, damage_mult: 2.0 }
    },
    {
        id: 'vampire_lord',
        name: '吸血鬼领主',
        icon: '🧛',
        description: '伤害+80%，造成伤害的25%转为生命，溢出转为护盾',
        effect: { type: 'damage_up', value: 0.80, life_steal: 0.25, overheal_to_shield: true }
    },
    {
        id: 'master_of_arms',
        name: '武器大师',
        icon: '🏆',
        description: '武器槽+3，所有武器视为满级，攻速+50%',
        effect: { type: 'weapon_slot', value: 3, max_level_all: true, attack_speed: 0.50 }
    },
    {
        id: 'eternal_gold',
        name: '永恒黄金',
        icon: '💰',
        description: '金币获取+100%，每1金币+0.1%伤害，金币不再减少',
        effect: { type: 'gold_bonus', value: 1.0, gold_to_damage: 0.001, gold_never_decrease: true }
    },
    {
        id: 'reality_anchor',
        name: '现实锚点',
        icon: '⚓',
        description: '免疫所有负面效果，时间类效果延长50%',
        effect: { type: 'debuff_immunity', time_extend: 0.50 }
    }
];
```

## 诅咒道具（红色）- 6个

```javascript
const CURSED_ITEMS = [
    {
        id: 'demon_pact',
        name: '恶魔契约',
        icon: '📜',
        description: '伤害+100%，但每秒失去1%生命',
        effect: { type: 'damage_up', value: 1.0, hp_drain: 0.01 }
    },
    {
        id: 'glass_body',
        name: '玻璃身躯',
        icon: '🪞',
        description: '伤害+150%，受到伤害+100%',
        effect: { type: 'damage_up', value: 1.50, damage_taken: 1.0 }
    },
    {
        id: 'blood_rage',
        name: '血怒',
        icon: '🩸',
        description: '攻速+80%，移速+50%，但无法控制移动方向',
        effect: { type: 'attack_speed', value: 0.80, move_speed: 0.50, chaotic_movement: true }
    },
    {
        id: 'soul_trade',
        name: '灵魂交易',
        icon: '💀',
        description: '立即获得3个随机传说道具，最大生命-50%',
        effect: { type: 'give_legendary', count: 3, max_hp_penalty: 0.50 }
    },
    {
        id: 'doom_clock',
        name: '末日时钟',
        icon: '⏰',
        description: '伤害每秒+5%（无限叠加），但300秒后死亡',
        effect: { type: 'doom_timer', damage_per_second: 0.05, death_timer: 300 }
    },
    {
        id: 'chaos_orb',
        name: '混沌之球',
        icon: '🌪️',
        description: '所有属性随机波动（-20%~+100%），每秒重新计算',
        effect: { type: 'chaos_stats', min_mult: 0.80, max_mult: 2.0, interval: 1 }
    }
];
```

## 神话道具（金色）- 2个

```javascript
const MYTHIC_ITEMS = [
    {
        id: 'omnipotence',
        name: '全能之石',
        icon: '💎',
        description: '伤害+200%，攻速+100%，移速+50%，生命+100%，无限复活，全屏伤害',
        effect: {
            type: 'omnipotence',
            damage: 2.0,
            attack_speed: 1.0,
            move_speed: 0.50,
            max_hp: 1.0,
            infinite_revive: true,
            screen_damage: { interval: 1, damage_mult: 0.5 }
        }
    },
    {
        id: 'world_breaker',
        name: '世界破坏者',
        icon: '🔨',
        description: '一击必杀（对Boss也有效），但每层只能使用1次',
        effect: {
            type: 'one_shot',
            works_on_boss: true,
            charges_per_floor: 1
        }
    }
];
```

---

## 本轮完成统计

| 稀有度 | 数量 | 价格区间 |
|--------|------|----------|
| 普通（白） | 30 | 50-100 |
| 优秀（绿） | 20 | 100-200 |
| 稀有（蓝） | 18 | 200-400 |
| 史诗（紫） | 14 | 400-800 |
| 传说（橙） | 10 | 800-1500 |
| 诅咒（红） | 6 | 200-600 |
| 神话（金） | 2 | 2000-5000 |
| **总计** | **100** | - |

---
*第二轮完成 - 2026-03-02*
