/**
 * ItemSystem - 道具系统
 * 管理道具生成、拾取、效果应用
 */

class ItemSystem {
    constructor(world) {
        this.world = world;
        this.priority = 40;
        this.enabled = true;
        
        // 道具数据库
        this.itemDatabase = new Map();
        
        // 被动道具（类似吸血鬼幸存者）
        this.passiveDatabase = new Map();
        
        // 自动拾取范围
        this.magnetRange = 100;
    }
    
    init() {
        this.loadItemData();
        this.loadPassiveData();
    }
    
    loadItemData() {
        // ===== 生命恢复类消耗品 =====
        this.itemDatabase.set('health_potion', {
            name: '生命药水',
            type: 'consumable',
            rarity: 'common',
            effectType: 'heal',
            effectValue: 30,
            description: '恢复30点生命值',
            icon: '🧪'
        });
        
        this.itemDatabase.set('large_health_potion', {
            name: '大生命药水',
            type: 'consumable',
            rarity: 'uncommon',
            effectType: 'heal',
            effectValue: 80,
            description: '恢复80点生命值',
            icon: '🧫'
        });
        
        this.itemDatabase.set('full_restore_potion', {
            name: '完全恢复药水',
            type: 'consumable',
            rarity: 'rare',
            effectType: 'heal_full',
            description: '完全恢复生命值',
            icon: '🏺'
        });
        
        this.itemDatabase.set('regeneration_potion', {
            name: '再生药水',
            type: 'consumable',
            rarity: 'uncommon',
            effectType: 'regen',
            effectValue: 10,
            duration: 10,
            description: '10秒内每秒恢复10点生命',
            icon: '💚'
        });
        
        // ===== 增益类消耗品 =====
        this.itemDatabase.set('strength_potion', {
            name: '力量药水',
            type: 'consumable',
            rarity: 'uncommon',
            effectType: 'buff_damage',
            effectValue: 0.3,
            duration: 30,
            description: '30秒内伤害+30%',
            icon: '💪'
        });
        
        this.itemDatabase.set('speed_potion', {
            name: '速度药水',
            type: 'consumable',
            rarity: 'uncommon',
            effectType: 'buff_speed',
            effectValue: 0.5,
            duration: 20,
            description: '20秒内移动速度+50%',
            icon: '⚡'
        });
        
        this.itemDatabase.set('iron_skin_potion', {
            name: '铁皮药水',
            type: 'consumable',
            rarity: 'uncommon',
            effectType: 'buff_armor',
            effectValue: 10,
            duration: 30,
            description: '30秒内护甲+10',
            icon: '🛡️'
        });
        
        this.itemDatabase.set('haste_potion', {
            name: '急速药水',
            type: 'consumable',
            rarity: 'rare',
            effectType: 'buff_attack_speed',
            effectValue: 0.4,
            duration: 15,
            description: '15秒内攻击速度+40%',
            icon: '⏩'
        });
        
        this.itemDatabase.set('berserk_potion', {
            name: '狂暴药水',
            type: 'consumable',
            rarity: 'rare',
            effectType: 'buff_berserk',
            effectValue: 0.5,
            duration: 10,
            description: '10秒内伤害+50%，但受到伤害+20%',
            icon: '😤'
        });
        
        // ===== 功能类消耗品 =====
        this.itemDatabase.set('bomb', {
            name: '炸弹',
            type: 'consumable',
            rarity: 'common',
            effectType: 'bomb',
            effectValue: 100,
            radius: 150,
            description: '造成100点范围伤害',
            icon: '💣'
        });
        
        this.itemDatabase.set('freeze_bomb', {
            name: '冰冻炸弹',
            type: 'consumable',
            rarity: 'uncommon',
            effectType: 'freeze',
            duration: 5,
            radius: 200,
            description: '冰冻范围内敌人5秒',
            icon: '❄️'
        });
        
        this.itemDatabase.set('scroll_of_confusion', {
            name: '混乱卷轴',
            type: 'consumable',
            rarity: 'rare',
            effectType: 'confuse',
            duration: 8,
            radius: 300,
            description: '使范围内敌人混乱8秒',
            icon: '🌀'
        });
        
        this.itemDatabase.set('portal_scroll', {
            name: '传送卷轴',
            type: 'consumable',
            rarity: 'rare',
            effectType: 'teleport_random',
            description: '随机传送到地图某处',
            icon: '🌀'
        });
        
        this.itemDatabase.set('map_reveal', {
            name: '显形药水',
            type: 'consumable',
            rarity: 'uncommon',
            effectType: 'reveal_map',
            description: '显示整张地图',
            icon: '🗺️'
        });
        
        // ===== 资源类 =====
        this.itemDatabase.set('gold', {
            name: '金币',
            type: 'resource',
            rarity: 'common',
            autoPickup: true,
            description: '通用货币',
            icon: '🪙'
        });
        
        this.itemDatabase.set('gold_bag', {
            name: '金币袋',
            type: 'resource',
            rarity: 'uncommon',
            autoPickup: true,
            effectType: 'gold',
            effectValue: 50,
            description: '获得50金币',
            icon: '💰'
        });
        
        this.itemDatabase.set('exp_orb', {
            name: '经验球',
            type: 'resource',
            rarity: 'common',
            autoPickup: true,
            effectType: 'exp',
            effectValue: 10,
            description: '获得经验值',
            icon: '🔮'
        });
        
        this.itemDatabase.set('large_exp_orb', {
            name: '大经验球',
            type: 'resource',
            rarity: 'uncommon',
            autoPickup: true,
            effectType: 'exp',
            effectValue: 50,
            description: '获得大量经验值',
            icon: '🔮'
        });
        
        // ===== 永久提升道具 =====
        this.itemDatabase.set('power_shard', {
            name: '力量碎片',
            type: 'permanent',
            rarity: 'rare',
            effectType: 'maxDamage',
            effectValue: 5,
            description: '永久提升5点攻击力',
            icon: '💎'
        });
        
        this.itemDatabase.set('vitality_shard', {
            name: '活力碎片',
            type: 'permanent',
            rarity: 'rare',
            effectType: 'maxHealth',
            effectValue: 20,
            description: '永久提升20点生命值',
            icon: '❤️'
        });
        
        this.itemDatabase.set('agility_shard', {
            name: '敏捷碎片',
            type: 'permanent',
            rarity: 'rare',
            effectType: 'maxSpeed',
            effectValue: 10,
            description: '永久提升10点移动速度',
            icon: '💨'
        });
        
        this.itemDatabase.set('heart_container', {
            name: '心之容器',
            type: 'permanent',
            rarity: 'epic',
            effectType: 'maxHealth_large',
            effectValue: 50,
            description: '永久提升50点最大生命值',
            icon: '💖'
        });
        
        // ===== 材料类 =====
        this.itemDatabase.set('slime_goo', {
            name: '史莱姆粘液',
            type: 'material',
            rarity: 'common',
            description: '炼金材料',
            icon: '💧'
        });
        
        this.itemDatabase.set('wolf_fang', {
            name: '狼牙',
            type: 'material',
            rarity: 'uncommon',
            description: '制作材料',
            icon: '🦷'
        });
        
        this.itemDatabase.set('dragon_scale', {
            name: '龙鳞',
            type: 'material',
            rarity: 'epic',
            description: '传说中的锻造材料',
            icon: '🐉'
        });
        
        this.itemDatabase.set('ectoplasm', {
            name: '灵质',
            type: 'material',
            rarity: 'rare',
            description: '幽灵留下的物质',
            icon: '👻'
        });
        
        // ===== 批量添加更多消耗品 (扩展至60+) =====
        // 食物类消耗品
        this.itemDatabase.set('apple', {
            name: '苹果',
            type: 'consumable',
            rarity: 'common',
            effectType: 'heal',
            effectValue: 10,
            description: '恢复10点生命值',
            icon: '🍎'
        });
        
        this.itemDatabase.set('meat', {
            name: '烤肉',
            type: 'consumable',
            rarity: 'common',
            effectType: 'heal',
            effectValue: 25,
            description: '恢复25点生命值',
            icon: '🍖'
        });
        
        this.itemDatabase.set('golden_apple', {
            name: '金苹果',
            type: 'consumable',
            rarity: 'epic',
            effectType: 'heal',
            effectValue: 100,
            description: '恢复100点生命值，并获得5秒无敌',
            icon: '🍏'
        });
        
        this.itemDatabase.set('cheese', {
            name: '奶酪',
            type: 'consumable',
            rarity: 'common',
            effectType: 'heal',
            effectValue: 15,
            description: '恢复15点生命值',
            icon: '🧀'
        });
        
        this.itemDatabase.set('bread', {
            name: '面包',
            type: 'consumable',
            rarity: 'common',
            effectType: 'heal',
            effectValue: 20,
            description: '恢复20点生命值',
            icon: '🍞'
        });
        
        // 更多药水类
        this.itemDatabase.set('mana_potion', {
            name: '法力药水',
            type: 'consumable',
            rarity: 'uncommon',
            effectType: 'cooldown_reset',
            description: '立即重置所有技能冷却',
            icon: '🔵'
        });
        
        this.itemDatabase.set('invisibility_potion', {
            name: '隐形药水',
            type: 'consumable',
            rarity: 'rare',
            effectType: 'buff_invisible',
            effectValue: 1,
            duration: 10,
            description: '10秒内隐形，敌人无法发现你',
            icon: '👤'
        });
        
        this.itemDatabase.set('giant_potion', {
            name: '巨人药水',
            type: 'consumable',
            rarity: 'rare',
            effectType: 'buff_giant',
            effectValue: 0.5,
            duration: 20,
            description: '20秒内体型+50%，伤害+30%，移速-10%',
            icon: '🦍'
        });
        
        this.itemDatabase.set('dwarf_potion', {
            name: '矮人药水',
            type: 'consumable',
            rarity: 'rare',
            effectType: 'buff_dwarf',
            effectValue: -0.3,
            duration: 20,
            description: '20秒内体型-30%，移速+30%，闪避+20%',
            icon: '🧝'
        });
        
        this.itemDatabase.set('poison_potion', {
            name: '剧毒药水',
            type: 'consumable',
            rarity: 'uncommon',
            effectType: 'poison_area',
            effectValue: 20,
            radius: 200,
            duration: 5,
            description: '释放剧毒云雾，持续伤害范围内敌人',
            icon: '☠️'
        });
        
        // 卷轴类
        this.itemDatabase.set('scroll_of_fireball', {
            name: '火球卷轴',
            type: 'consumable',
            rarity: 'uncommon',
            effectType: 'fireball',
            effectValue: 150,
            description: '发射巨大火球造成150点伤害',
            icon: '🔥'
        });
        
        this.itemDatabase.set('scroll_of_lightning', {
            name: '闪电卷轴',
            type: 'consumable',
            rarity: 'rare',
            effectType: 'lightning_strike',
            effectValue: 200,
            description: '召唤闪电攻击所有敌人',
            icon: '⚡'
        });
        
        this.itemDatabase.set('scroll_of_healing', {
            name: '治疗卷轴',
            type: 'consumable',
            rarity: 'uncommon',
            effectType: 'heal_area',
            effectValue: 50,
            radius: 300,
            description: '治疗范围内所有友方单位50点生命',
            icon: '✨'
        });
        
        this.itemDatabase.set('scroll_of_summoning', {
            name: '召唤卷轴',
            type: 'consumable',
            rarity: 'epic',
            effectType: 'summon_ally',
            effectValue: 3,
            description: '召唤3个骷髅战士协助战斗',
            icon: '💀'
        });
        
        // 炸弹类
        this.itemDatabase.set('fire_bomb', {
            name: '燃烧弹',
            type: 'consumable',
            rarity: 'uncommon',
            effectType: 'fire_bomb',
            effectValue: 80,
            radius: 150,
            duration: 5,
            description: '造成80点伤害并点燃敌人5秒',
            icon: '💥'
        });
        
        this.itemDatabase.set('ice_bomb', {
            name: '冰霜炸弹',
            type: 'consumable',
            rarity: 'uncommon',
            effectType: 'ice_bomb',
            effectValue: 60,
            radius: 150,
            duration: 3,
            description: '造成60点伤害并冰冻敌人3秒',
            icon: '🧊'
        });
        
        this.itemDatabase.set('holy_water', {
            name: '圣水',
            type: 'consumable',
            rarity: 'rare',
            effectType: 'holy_damage',
            effectValue: 100,
            radius: 250,
            description: '对亡灵造成100点伤害，对其他敌人50点',
            icon: '💧'
        });
        
        // 特殊道具
        this.itemDatabase.set('dice', {
            name: '命运骰子',
            type: 'consumable',
            rarity: 'epic',
            effectType: 'random_effect',
            description: '随机产生一个效果（可能好可能坏）',
            icon: '🎲'
        });
        
        this.itemDatabase.set('wishing_star', {
            name: '许愿星',
            type: 'consumable',
            rarity: 'legendary',
            effectType: 'wish',
            description: '实现一个愿望（升级武器/恢复生命/获得金币）',
            icon: '⭐'
        });
        
        this.itemDatabase.set('time_stop_watch', {
            name: '时停怀表',
            type: 'consumable',
            rarity: 'legendary',
            effectType: 'time_stop',
            duration: 5,
            description: '停止时间5秒，只有你可以行动',
            icon: '⌚'
        });
        
        // 材料扩展
        this.itemDatabase.set('bat_wing', {
            name: '蝙蝠翅膀',
            type: 'material',
            rarity: 'common',
            description: '制作材料',
            icon: '🦇'
        });
        
        this.itemDatabase.set('spider_silk', {
            name: '蜘蛛丝',
            type: 'material',
            rarity: 'common',
            description: '炼金材料',
            icon: '🕸️'
        });
        
        this.itemDatabase.set('snake_skin', {
            name: '蛇皮',
            type: 'material',
            rarity: 'uncommon',
            description: '制作材料',
            icon: '🐍'
        });
        
        this.itemDatabase.set('bear_claw', {
            name: '熊爪',
            type: 'material',
            rarity: 'uncommon',
            description: '锻造材料',
            icon: '🐾'
        });
        
        this.itemDatabase.set('panther_eye', {
            name: '豹眼',
            type: 'material',
            rarity: 'rare',
            description: '神秘材料',
            icon: '👁️'
        });
        
        this.itemDatabase.set('turtle_shell', {
            name: '龟壳',
            type: 'material',
            rarity: 'rare',
            description: '防御材料',
            icon: '🐢'
        });
        
        this.itemDatabase.set('phoenix_ash', {
            name: '凤凰灰烬',
            type: 'material',
            rarity: 'legendary',
            description: '传说中的复活材料',
            icon: '🔥'
        });
        
        this.itemDatabase.set('unicorn_horn', {
            name: '独角兽之角',
            type: 'material',
            rarity: 'legendary',
            description: '极其稀有的魔法材料',
            icon: '🦄'
        });
        
        // ===== 第四波消耗品扩展 (达到80+) =====
        // 更多药水
        this.itemDatabase.set('antidote', {
            name: '解毒剂',
            type: 'consumable',
            rarity: 'common',
            effectType: 'cure_poison',
            description: '解除中毒效果',
            icon: '💉'
        });
        
        this.itemDatabase.set('elixir_of_life', {
            name: '生命精华',
            type: 'consumable',
            rarity: 'epic',
            effectType: 'heal_over_time',
            effectValue: 5,
            duration: 60,
            description: '60秒内每秒恢复5生命',
            icon: '🧴'
        });
        
        this.itemDatabase.set('elixir_of_youth', {
            name: '青春之泉',
            type: 'consumable',
            rarity: 'legendary',
            effectType: 'restore_all',
            description: '完全恢复生命和法力，清除所有负面效果',
            icon: '💎'
        });
        
        this.itemDatabase.set('mutation_potion', {
            name: '变异药水',
            type: 'consumable',
            rarity: 'rare',
            effectType: 'random_buff',
            description: '随机获得一个强力增益（也可能是负面）',
            icon: '🧪'
        });
        
        this.itemDatabase.set('heroic_potion', {
            name: '英雄药水',
            type: 'consumable',
            rarity: 'epic',
            effectType: 'buff_all_stats',
            effectValue: 0.5,
            duration: 30,
            description: '30秒内所有属性+50%',
            icon: '🦸'
        });
        
        // 更多卷轴
        this.itemDatabase.set('scroll_of_protection', {
            name: '保护卷轴',
            type: 'consumable',
            rarity: 'uncommon',
            effectType: 'buff_shield',
            effectValue: 100,
            duration: 30,
            description: '获得100点护盾，持续30秒',
            icon: '🛡️'
        });
        
        this.itemDatabase.set('scroll_of_rage', {
            name: '狂怒卷轴',
            type: 'consumable',
            rarity: 'rare',
            effectType: 'buff_rage',
            effectValue: 1.0,
            duration: 15,
            description: '15秒内伤害翻倍，但受到伤害+50%',
            icon: '😡'
        });
        
        this.itemDatabase.set('scroll_of_haste', {
            name: '急速卷轴',
            type: 'consumable',
            rarity: 'uncommon',
            effectType: 'buff_haste',
            effectValue: 1.0,
            duration: 20,
            description: '20秒内攻速和移速翻倍',
            icon: '⚡'
        });
        
        this.itemDatabase.set('scroll_of_petrification', {
            name: '石化卷轴',
            type: 'consumable',
            rarity: 'epic',
            effectType: 'petrify_area',
            duration: 10,
            radius: 300,
            description: '石化范围内所有敌人10秒（被攻击解除）',
            icon: '🗿'
        });
        
        this.itemDatabase.set('scroll_of_teleportation', {
            name: '传送卷轴',
            type: 'consumable',
            rarity: 'uncommon',
            effectType: 'teleport_controlled',
            description: '选择位置传送',
            icon: '🌀'
        });
        
        this.itemDatabase.set('scroll_of_identify', {
            name: '鉴定卷轴',
            type: 'consumable',
            rarity: 'common',
            effectType: 'identify',
            description: '鉴定一件未知物品',
            icon: '🔍'
        });
        
        this.itemDatabase.set('scroll_of_enchant_weapon', {
            name: '武器附魔卷轴',
            type: 'consumable',
            rarity: 'rare',
            effectType: 'enchant_weapon',
            description: '为武器附加随机附魔',
            icon: '✨'
        });
        
        this.itemDatabase.set('scroll_of_mass_destruction', {
            name: '毁灭卷轴',
            type: 'consumable',
            rarity: 'legendary',
            effectType: 'nuke',
            effectValue: 9999,
            description: '消灭屏幕上所有普通敌人，对Boss造成9999伤害',
            icon: '☢️'
        });
        
        // 特殊道具
        this.itemDatabase.set('health_kit', {
            name: '医疗包',
            type: 'consumable',
            rarity: 'uncommon',
            effectType: 'heal_large',
            effectValue: 150,
            description: '恢复150点生命值',
            icon: '🏥'
        });
        
        this.itemDatabase.set('adrenaline_shot', {
            name: '肾上腺素注射',
            type: 'consumable',
            rarity: 'rare',
            effectType: 'buff_adrenaline',
            effectValue: 0.5,
            duration: 10,
            description: '10秒内攻速+100%，移速+50%，结束后虚弱5秒',
            icon: '💉'
        });
        
        this.itemDatabase.set('stimpack', {
            name: '兴奋剂',
            type: 'consumable',
            rarity: 'uncommon',
            effectType: 'buff_stim',
            duration: 30,
            description: '免疫控制和减速，持续30秒',
            icon: '💊'
        });
        
        this.itemDatabase.set('repair_kit', {
            name: '修理包',
            type: 'consumable',
            rarity: 'uncommon',
            effectType: 'repair_armor',
            effectValue: 50,
            description: '恢复50点护甲耐久',
            icon: '🔧'
        });
        
        this.itemDatabase.set('ammo_box', {
            name: '弹药箱',
            type: 'consumable',
            rarity: 'common',
            effectType: 'restore_ammo',
            description: '恢复所有弹药',
            icon: '📦'
        });
        
        this.itemDatabase.set('mystery_box', {
            name: '神秘盒子',
            type: 'consumable',
            rarity: 'rare',
            effectType: 'random_item',
            description: '随机获得一件物品',
            icon: '📦'
        });
        
        this.itemDatabase.set(' Pandora_box', {
            name: '潘多拉魔盒',
            type: 'consumable',
            rarity: 'legendary',
            effectType: 'pandora',
            description: '可能获得巨大财富或灾难',
            icon: '📤'
        });
        
        // 更多炸弹/投掷物
        this.itemDatabase.set('flash_bang', {
            name: '闪光弹',
            type: 'consumable',
            rarity: 'common',
            effectType: 'stun_area',
            duration: 3,
            radius: 200,
            description: '致盲范围内敌人3秒',
            icon: '💡'
        });
        
        this.itemDatabase.set('smoke_bomb', {
            name: '烟雾弹',
            type: 'consumable',
            rarity: 'common',
            effectType: 'smoke_screen',
            duration: 10,
            radius: 250,
            description: '创造烟雾，敌人无法看到你',
            icon: '🌫️'
        });
        
        this.itemDatabase.set('gravity_bomb', {
            name: '重力炸弹',
            type: 'consumable',
            rarity: 'rare',
            effectType: 'gravity_well',
            duration: 5,
            radius: 200,
            description: '将范围内所有敌人拉向中心',
            icon: '🌌'
        });
        
        this.itemDatabase.set('black_hole_grenade', {
            name: '黑洞手雷',
            type: 'consumable',
            rarity: 'epic',
            effectType: 'black_hole',
            duration: 8,
            radius: 300,
            description: '创造黑洞持续吸引并伤害敌人',
            icon: '⚫'
        });
        
        this.itemDatabase.set('love_potion', {
            name: '魅惑药水',
            type: 'consumable',
            rarity: 'rare',
            effectType: 'charm',
            duration: 15,
            radius: 150,
            description: '魅惑范围内一个敌人成为你的盟友',
            icon: '💕'
        });
        
        this.itemDatabase.set('fear_gas', {
            name: '恐惧瓦斯',
            type: 'consumable',
            rarity: 'uncommon',
            effectType: 'fear',
            duration: 8,
            radius: 200,
            description: '使范围内敌人恐惧逃跑8秒',
            icon: '💨'
        });
        
        // 钥匙类
        this.itemDatabase.set('bronze_key', {
            name: '青铜钥匙',
            type: 'consumable',
            rarity: 'common',
            description: '打开青铜宝箱',
            icon: '🗝️'
        });
        
        this.itemDatabase.set('silver_key', {
            name: '银钥匙',
            type: 'consumable',
            rarity: 'uncommon',
            description: '打开白银宝箱',
            icon: '🗝️'
        });
        
        this.itemDatabase.set('gold_key', {
            name: '金钥匙',
            type: 'consumable',
            rarity: 'rare',
            description: '打开黄金宝箱',
            icon: '🗝️'
        });
        
        this.itemDatabase.set('master_key', {
            name: '万能钥匙',
            type: 'consumable',
            rarity: 'epic',
            description: '打开任何宝箱',
            icon: '🗝️'
        });
        
        // 灵魂类
        this.itemDatabase.set('soul_crystal', {
            name: '灵魂水晶',
            type: 'consumable',
            rarity: 'rare',
            effectType: 'soul_charge',
            description: '收集100个灵魂释放强力攻击',
            icon: '💠'
        });
        
        this.itemDatabase.set('demon_contract', {
            name: '恶魔契约',
            type: 'consumable',
            rarity: 'legendary',
            effectType: 'demon_deal',
            description: '获得强大力量但失去部分生命上限',
            icon: '📜'
        });
        
        this.itemDatabase.set('angel_blessing', {
            name: '天使祝福',
            type: 'consumable',
            rarity: 'legendary',
            effectType: 'angel_bless',
            description: '恢复全部生命并净化所有负面效果',
            icon: '👼'
        });
        
        // 符文类
        this.itemDatabase.set('rune_of_power', {
            name: '力量符文',
            type: 'consumable',
            rarity: 'rare',
            effectType: 'rune_power',
            duration: 60,
            description: '武器伤害+50%持续60秒',
            icon: 'ᚦ'
        });
        
        this.itemDatabase.set('rune_of_defense', {
            name: '防御符文',
            type: 'consumable',
            rarity: 'rare',
            effectType: 'rune_defense',
            duration: 60,
            description: '受到伤害-50%持续60秒',
            icon: 'ᚧ'
        });
        
        this.itemDatabase.set('rune_of_speed', {
            name: '速度符文',
            type: 'consumable',
            rarity: 'rare',
            effectType: 'rune_speed',
            duration: 60,
            description: '攻速和移速+50%持续60秒',
            icon: 'ᚨ'
        });
        
        this.itemDatabase.set('mega_potion', {
            name: '超级药水',
            type: 'consumable',
            rarity: 'epic',
            effectType: 'mega_heal',
            effectValue: 500,
            description: '瞬间恢复500点生命',
            icon: '🏺'
        });
        
        this.itemDatabase.set('revive_token', {
            name: '复活币',
            type: 'consumable',
            rarity: 'legendary',
            effectType: 'extra_life',
            description: '死亡时自动复活',
            icon: '🎫'
        });
    }
    
    loadPassiveData() {
        // ===== 攻击类被动道具 =====
        this.passiveDatabase.set('power_glove', {
            name: '力量手套',
            description: '攻击力+10%',
            maxLevel: 5,
            category: 'attack',
            effect: (level, player) => {
                const weapon = player.get(WeaponComponent);
                if (weapon) weapon.damage *= (1 + 0.1 * level);
            }
        });
        
        this.passiveDatabase.set('critical_ring', {
            name: '暴击戒指',
            description: '暴击率+5%',
            maxLevel: 5,
            category: 'attack',
            effect: (level, player) => {
                const weapon = player.get(WeaponComponent);
                if (weapon) weapon.criticalChance = Math.min(1, weapon.criticalChance + 0.05 * level);
            }
        });
        
        this.passiveDatabase.set('critical_damage_bracelet', {
            name: '暴伤手镯',
            description: '暴击伤害+20%',
            maxLevel: 5,
            category: 'attack',
            effect: (level, player) => {
                const weapon = player.get(WeaponComponent);
                if (weapon) weapon.criticalDamage += 0.2 * level;
            }
        });
        
        this.passiveDatabase.set('attack_speed_gloves', {
            name: '攻速手套',
            description: '攻击速度+10%',
            maxLevel: 5,
            category: 'attack',
            effect: (level, player) => {
                const weapon = player.get(WeaponComponent);
                if (weapon) weapon.attackSpeed *= (1 + 0.1 * level);
            }
        });
        
        this.passiveDatabase.set('piercing_arrow', {
            name: '穿透箭矢',
            description: '投射物穿透+1',
            maxLevel: 5,
            category: 'attack',
            effect: (level, player) => {
                const weapon = player.get(WeaponComponent);
                if (weapon) weapon.pierce += level;
            }
        });
        
        this.passiveDatabase.set('multishot_charm', {
            name: '多重射击护符',
            description: '额外发射+1个投射物',
            maxLevel: 3,
            category: 'attack',
            effect: (level, player) => {
                const weapon = player.get(WeaponComponent);
                if (weapon) weapon.projectileCount = (weapon.projectileCount || 1) + level;
            }
        });
        
        this.passiveDatabase.set('fire_enchantment', {
            name: '火焰附魔',
            description: '攻击附加灼烧效果',
            maxLevel: 3,
            category: 'attack',
            effect: (level, player) => {
                const combat = player.get(CombatComponent);
                if (combat) {
                    combat.onHitEffects = combat.onHitEffects || [];
                    combat.onHitEffects.push({ type: 'burn', damage: 5 * level, duration: 3 });
                }
            }
        });
        
        this.passiveDatabase.set('ice_enchantment', {
            name: '冰霜附魔',
            description: '攻击附加减速效果',
            maxLevel: 3,
            category: 'attack',
            effect: (level, player) => {
                const combat = player.get(CombatComponent);
                if (combat) {
                    combat.onHitEffects = combat.onHitEffects || [];
                    combat.onHitEffects.push({ type: 'slow', strength: 0.2 * level, duration: 2 });
                }
            }
        });
        
        this.passiveDatabase.set('lightning_enchantment', {
            name: '闪电附魔',
            description: '攻击有概率释放闪电链',
            maxLevel: 3,
            category: 'attack',
            effect: (level, player) => {
                const combat = player.get(CombatComponent);
                if (combat) combat.lightningChance = 0.1 * level;
            }
        });
        
        this.passiveDatabase.set('vampire_fang', {
            name: '吸血鬼之牙',
            description: '造成伤害的5%转化为生命',
            maxLevel: 5,
            category: 'attack',
            effect: (level, player) => {
                const weapon = player.get(WeaponComponent);
                if (weapon) weapon.lifeSteal += 0.05 * level;
            }
        });
        
        // ===== 防御类被动道具 =====
        this.passiveDatabase.set('vitality_amulet', {
            name: '活力护符',
            description: '最大生命值+15%',
            maxLevel: 5,
            category: 'defense',
            effect: (level, player) => {
                const health = player.get(HealthComponent);
                if (health) {
                    const bonus = Math.floor(health.maxHealth * 0.15 * level);
                    health.maxHealth += bonus;
                    health.currentHealth += bonus;
                }
            }
        });
        
        this.passiveDatabase.set('armor_plate', {
            name: '装甲板',
            description: '护甲+5',
            maxLevel: 5,
            category: 'defense',
            effect: (level, player) => {
                const health = player.get(HealthComponent);
                if (health) health.armor += 5 * level;
            }
        });
        
        this.passiveDatabase.set('regeneration_ring', {
            name: '再生戒指',
            description: '每秒恢复1%生命',
            maxLevel: 5,
            category: 'defense',
            effect: (level, player) => {
                const health = player.get(HealthComponent);
                if (health) health.regenRate += 0.01 * level;
            }
        });
        
        this.passiveDatabase.set('dodge_boots', {
            name: '闪避靴',
            description: '闪避率+8%',
            maxLevel: 5,
            category: 'defense',
            effect: (level, player) => {
                const combat = player.get(CombatComponent);
                if (combat) combat.dodgeChance = Math.min(0.5, (combat.dodgeChance || 0) + 0.08 * level);
            }
        });
        
        this.passiveDatabase.set('thorn_armor', {
            name: '荆棘护甲',
            description: '受到伤害反弹20%',
            maxLevel: 3,
            category: 'defense',
            effect: (level, player) => {
                const combat = player.get(CombatComponent);
                if (combat) combat.thornDamage = 0.2 * level;
            }
        });
        
        this.passiveDatabase.set('invincibility_clock', {
            name: '无敌时钟',
            description: '受伤后无敌时间+0.2秒',
            maxLevel: 5,
            category: 'defense',
            effect: (level, player) => {
                const health = player.get(HealthComponent);
                if (health) health.invincibleDuration += 0.2 * level;
            }
        });
        
        this.passiveDatabase.set('barrier_generator', {
            name: '护盾发生器',
            description: '每30秒获得一个吸收伤害的护盾',
            maxLevel: 3,
            category: 'defense',
            effect: (level, player) => {
                const combat = player.get(CombatComponent);
                if (combat) combat.barrierLevel = level;
            }
        });
        
        // ===== 移动类被动道具 =====
        this.passiveDatabase.set('swift_boots', {
            name: '迅捷之靴',
            description: '移动速度+10%',
            maxLevel: 5,
            category: 'movement',
            effect: (level, player) => {
                const movement = player.get(MovementComponent);
                if (movement) {
                    movement.speed *= (1 + 0.1 * level);
                    movement.maxSpeed *= (1 + 0.1 * level);
                    movement.baseSpeed = movement.speed;
                }
            }
        });
        
        this.passiveDatabase.set('dash_boots', {
            name: '冲刺靴',
            description: '冲刺距离+25%，冷却-10%',
            maxLevel: 5,
            category: 'movement',
            effect: (level, player) => {
                const movement = player.get(MovementComponent);
                if (movement) {
                    movement.dashSpeed *= (1 + 0.25 * level);
                    movement.dashCooldown *= (1 - 0.1 * level);
                }
            }
        });
        
        this.passiveDatabase.set('ghost_cloak', {
            name: '幽灵斗篷',
            description: '冲刺时无敌时间+0.3秒',
            maxLevel: 3,
            category: 'movement',
            effect: (level, player) => {
                const movement = player.get(MovementComponent);
                if (movement) movement.dashInvincibleTime += 0.3 * level;
            }
        });
        
        this.passiveDatabase.set('winged_sandals', {
            name: '飞翼凉鞋',
            description: '可以短暂飞行跨越障碍',
            maxLevel: 1,
            category: 'movement',
            effect: (level, player) => {
                const movement = player.get(MovementComponent);
                if (movement) movement.canFly = true;
            }
        });
        
        // ===== 实用类被动道具 =====
        this.passiveDatabase.set('magnet', {
            name: '磁铁',
            description: '拾取范围+50%',
            maxLevel: 3,
            category: 'utility',
            effect: (level, player) => {
                const playerComp = player.get(PlayerComponent);
                if (playerComp) playerComp.magnetRange = (playerComp.magnetRange || 100) * (1 + 0.5 * level);
            }
        });
        
        this.passiveDatabase.set('lucky_coin', {
            name: '幸运币',
            description: '金币获取+20%，掉宝率+10%',
            maxLevel: 5,
            category: 'utility',
            effect: (level, player) => {
                const playerComp = player.get(PlayerComponent);
                if (playerComp) {
                    playerComp.goldMultiplier = (playerComp.goldMultiplier || 1) * (1 + 0.2 * level);
                    playerComp.dropChanceBonus = (playerComp.dropChanceBonus || 0) + 0.1 * level;
                }
            }
        });
        
        this.passiveDatabase.set('xp_scroll', {
            name: '智慧卷轴',
            description: '经验获取+15%',
            maxLevel: 5,
            category: 'utility',
            effect: (level, player) => {
                const playerComp = player.get(PlayerComponent);
                if (playerComp) playerComp.expMultiplier = (playerComp.expMultiplier || 1) * (1 + 0.15 * level);
            }
        });
        
        this.passiveDatabase.set('cooldown_clock', {
            name: '冷却时钟',
            description: '技能冷却-10%',
            maxLevel: 5,
            category: 'utility',
            effect: (level, player) => {
                const weapon = player.get(WeaponComponent);
                if (weapon) weapon.cooldown *= Math.pow(0.9, level);
            }
        });
        
        this.passiveDatabase.set('range_scope', {
            name: '射程瞄准镜',
            description: '攻击范围+15%',
            maxLevel: 5,
            category: 'utility',
            effect: (level, player) => {
                const weapon = player.get(WeaponComponent);
                if (weapon) weapon.range *= (1 + 0.15 * level);
            }
        });
        
        this.passiveDatabase.set('curse_charm', {
            name: '诅咒护符',
            description: '敌人受到的伤害+10%，但你也承受+5%',
            maxLevel: 5,
            category: 'utility',
            effect: (level, player) => {
                const combat = player.get(CombatComponent);
                if (combat) {
                    combat.damageDealtMultiplier = (combat.damageDealtMultiplier || 1) * (1 + 0.1 * level);
                    combat.damageTakenMultiplier = (combat.damageTakenMultiplier || 1) * (1 + 0.05 * level);
                }
            }
        });
        
        this.passiveDatabase.set('berserk_blood', {
            name: '狂战士之血',
            description: '生命低于30%时伤害+30%',
            maxLevel: 3,
            category: 'utility',
            effect: (level, player) => {
                const combat = player.get(CombatComponent);
                if (combat) combat.berserkThreshold = 0.3;
                if (combat) combat.berserkDamageBonus = 0.3 * level;
            }
        });
        
        this.passiveDatabase.set('holy_grail', {
            name: '圣杯',
            description: '治疗效果+25%',
            maxLevel: 3,
            category: 'utility',
            effect: (level, player) => {
                const health = player.get(HealthComponent);
                if (health) health.healMultiplier = (health.healMultiplier || 1) * (1 + 0.25 * level);
            }
        });
        
        this.passiveDatabase.set('phoenix_feather', {
            name: '凤凰羽毛',
            description: '死亡时复活一次，恢复50%生命',
            maxLevel: 1,
            category: 'utility',
            effect: (level, player) => {
                const health = player.get(HealthComponent);
                if (health) health.hasRevive = true;
            }
        });
        
        // ===== 批量扩展更多被动道具 (扩展至80+) =====
        // 更多攻击类
        this.passiveDatabase.set('blood_blade', {
            name: '血刃',
            description: '生命越低伤害越高，最多+50%',
            maxLevel: 3,
            category: 'attack',
            effect: (level, player) => {
                const combat = player.get(CombatComponent);
                if (combat) combat.lowHealthDamageBonus = 0.5 * level;
            }
        });
        
        this.passiveDatabase.set('executioner_axe', {
            name: '处刑者之斧',
            description: '对低于20%生命的敌人伤害+30%',
            maxLevel: 3,
            category: 'attack',
            effect: (level, player) => {
                const combat = player.get(CombatComponent);
                if (combat) combat.executionerBonus = 0.3 * level;
            }
        });
        
        this.passiveDatabase.set('double_edge_sword', {
            name: '双刃剑',
            description: '伤害+25%，但受到伤害+10%',
            maxLevel: 3,
            category: 'attack',
            effect: (level, player) => {
                const weapon = player.get(WeaponComponent);
                const combat = player.get(CombatComponent);
                if (weapon) weapon.damage *= (1 + 0.25 * level);
                if (combat) combat.damageTakenMultiplier = (combat.damageTakenMultiplier || 1) * (1 + 0.1 * level);
            }
        });
        
        this.passiveDatabase.set('sniper_lens', {
            name: '狙击镜片',
            description: '距离越远伤害越高，最多+40%',
            maxLevel: 3,
            category: 'attack',
            effect: (level, player) => {
                const combat = player.get(CombatComponent);
                if (combat) combat.sniperBonus = 0.4 * level;
            }
        });
        
        this.passiveDatabase.set('rapid_fire_circuit', {
            name: '速射电路',
            description: '连续命中同一敌人时攻速递增',
            maxLevel: 3,
            category: 'attack',
            effect: (level, player) => {
                const weapon = player.get(WeaponComponent);
                if (weapon) weapon.rapidFireLevel = level;
            }
        });
        
        this.passiveDatabase.set('explosive_rounds', {
            name: '爆炸弹药',
            description: '投射物命中时爆炸，造成30%溅射伤害',
            maxLevel: 3,
            category: 'attack',
            effect: (level, player) => {
                const weapon = player.get(WeaponComponent);
                if (weapon) weapon.explosiveLevel = level;
            }
        });
        
        this.passiveDatabase.set('chain_lightning_rod', {
            name: '连锁闪电棒',
            description: '攻击有20%概率弹射到附近敌人',
            maxLevel: 3,
            category: 'attack',
            effect: (level, player) => {
                const weapon = player.get(WeaponComponent);
                if (weapon) weapon.chainLightningChance = 0.2 * level;
            }
        });
        
        this.passiveDatabase.set('poison_coating', {
            name: '毒液涂层',
            description: '攻击附加中毒，每秒10伤害持续5秒',
            maxLevel: 3,
            category: 'attack',
            effect: (level, player) => {
                const combat = player.get(CombatComponent);
                if (combat) {
                    combat.onHitEffects = combat.onHitEffects || [];
                    combat.onHitEffects.push({ type: 'poison', damage: 10 * level, duration: 5 });
                }
            }
        });
        
        this.passiveDatabase.set('bleeding_blade', {
            name: '放血刃',
            description: '攻击附加流血，每秒15伤害持续4秒，可叠加3层',
            maxLevel: 3,
            category: 'attack',
            effect: (level, player) => {
                const combat = player.get(CombatComponent);
                if (combat) {
                    combat.onHitEffects = combat.onHitEffects || [];
                    combat.onHitEffects.push({ type: 'bleed', damage: 15 * level, duration: 4, stackable: true, maxStacks: 3 });
                }
            }
        });
        
        this.passiveDatabase.set('divine_smite', {
            name: '神圣审判',
            description: '每5次攻击触发神圣打击，造成200%伤害',
            maxLevel: 3,
            category: 'attack',
            effect: (level, player) => {
                const weapon = player.get(WeaponComponent);
                if (weapon) weapon.divineSmiteLevel = level;
            }
        });
        
        // 更多防御类
        this.passiveDatabase.set('frozen_heart', {
            name: '冰冻之心',
            description: '被攻击时20%概率冰冻攻击者3秒',
            maxLevel: 3,
            category: 'defense',
            effect: (level, player) => {
                const combat = player.get(CombatComponent);
                if (combat) combat.freezeOnHitChance = 0.2 * level;
            }
        });
        
        this.passiveDatabase.set('burning_shield', {
            name: '燃烧护盾',
            description: '被近战攻击时对攻击者造成20点火焰伤害',
            maxLevel: 3,
            category: 'defense',
            effect: (level, player) => {
                const combat = player.get(CombatComponent);
                if (combat) combat.fireRetaliation = 20 * level;
            }
        });
        
        this.passiveDatabase.set('absorption_shield', {
            name: '吸收护盾',
            description: '每30秒获得一个吸收50伤害的护盾',
            maxLevel: 5,
            category: 'defense',
            effect: (level, player) => {
                const combat = player.get(CombatComponent);
                if (combat) combat.absorptionShieldLevel = level;
            }
        });
        
        this.passiveDatabase.set('defensive_stance', {
            name: '防御姿态',
            description: '站立不动时护甲+50%',
            maxLevel: 3,
            category: 'defense',
            effect: (level, player) => {
                const combat = player.get(CombatComponent);
                if (combat) combat.defensiveStanceLevel = level;
            }
        });
        
        this.passiveDatabase.set('second_chance', {
            name: '第二次机会',
            description: '受到致命伤害时保留1点生命，冷却60秒',
            maxLevel: 1,
            category: 'defense',
            effect: (level, player) => {
                const health = player.get(HealthComponent);
                if (health) health.hasSecondChance = true;
            }
        });
        
        this.passiveDatabase.set('damage_reduction_amulet', {
            name: '减伤护符',
            description: '受到伤害-10%',
            maxLevel: 5,
            category: 'defense',
            effect: (level, player) => {
                const combat = player.get(CombatComponent);
                if (combat) combat.damageReduction = (combat.damageReduction || 0) + 0.1 * level;
            }
        });
        
        this.passiveDatabase.set('spell_resistance_cloak', {
            name: '法抗斗篷',
            description: '受到的魔法伤害-25%',
            maxLevel: 3,
            category: 'defense',
            effect: (level, player) => {
                const combat = player.get(CombatComponent);
                if (combat) combat.magicResistance = (combat.magicResistance || 0) + 0.25 * level;
            }
        });
        
        this.passiveDatabase.set('evasion_boots', {
            name: '闪避靴',
            description: '移速+5%，闪避+5%',
            maxLevel: 5,
            category: 'defense',
            effect: (level, player) => {
                const movement = player.get(MovementComponent);
                const combat = player.get(CombatComponent);
                if (movement) {
                    movement.speed *= (1 + 0.05 * level);
                    movement.baseSpeed = movement.speed;
                }
                if (combat) combat.dodgeChance = (combat.dodgeChance || 0) + 0.05 * level;
            }
        });
        
        // 更多移动类
        this.passiveDatabase.set('ninja_boots', {
            name: '忍者靴',
            description: '移动时留下残影，敌人更难命中你',
            maxLevel: 3,
            category: 'movement',
            effect: (level, player) => {
                const combat = player.get(CombatComponent);
                if (combat) combat.afterimageLevel = level;
            }
        });
        
        this.passiveDatabase.set('flying_carpet', {
            name: '飞毯',
            description: '可以跨越深渊和障碍',
            maxLevel: 1,
            category: 'movement',
            effect: (level, player) => {
                const movement = player.get(MovementComponent);
                if (movement) movement.canFlyOver = true;
            }
        });
        
        this.passiveDatabase.set('time_warp_boots', {
            name: '时空扭曲靴',
            description: '冲刺后3秒内移速+30%',
            maxLevel: 3,
            category: 'movement',
            effect: (level, player) => {
                const movement = player.get(MovementComponent);
                if (movement) movement.timeWarpLevel = level;
            }
        });
        
        this.passiveDatabase.set('gravity_boots', {
            name: '重力靴',
            description: '免疫击退和击飞',
            maxLevel: 1,
            category: 'movement',
            effect: (level, player) => {
                const movement = player.get(MovementComponent);
                if (movement) movement.immuneToKnockback = true;
            }
        });
        
        this.passiveDatabase.set('wall_walker', {
            name: '墙壁行者',
            description: '可以短暂在墙上行走',
            maxLevel: 1,
            category: 'movement',
            effect: (level, player) => {
                const movement = player.get(MovementComponent);
                if (movement) movement.canWalkOnWalls = true;
            }
        });
        
        this.passiveDatabase.set('water_walker', {
            name: '水上漂',
            description: '可以在液体上行走',
            maxLevel: 1,
            category: 'movement',
            effect: (level, player) => {
                const movement = player.get(MovementComponent);
                if (movement) movement.canWalkOnWater = true;
            }
        });
        
        this.passiveDatabase.set('phase_boots', {
            name: '相位靴',
            description: '冲刺时穿过敌人并造成伤害',
            maxLevel: 3,
            category: 'movement',
            effect: (level, player) => {
                const movement = player.get(MovementComponent);
                if (movement) movement.phaseDashDamage = 20 * level;
            }
        });
        
        // 更多实用类
        this.passiveDatabase.set('treasure_hunter_map', {
            name: '寻宝地图',
            description: '显示本层所有宝箱位置',
            maxLevel: 1,
            category: 'utility',
            effect: (level, player) => {
                const playerComp = player.get(PlayerComponent);
                if (playerComp) playerComp.showTreasures = true;
            }
        });
        
        this.passiveDatabase.set('enemy_radar', {
            name: '敌人雷达',
            description: '小地图显示敌人位置',
            maxLevel: 1,
            category: 'utility',
            effect: (level, player) => {
                const playerComp = player.get(PlayerComponent);
                if (playerComp) playerComp.enemyRadar = true;
            }
        });
        
        this.passiveDatabase.set('item_magnet_extreme', {
            name: '超级磁铁',
            description: '拾取范围翻倍，物品自动飞向你的速度+100%',
            maxLevel: 3,
            category: 'utility',
            effect: (level, player) => {
                const playerComp = player.get(PlayerComponent);
                if (playerComp) {
                    playerComp.magnetRange = (playerComp.magnetRange || 100) * (1 + level);
                    playerComp.magnetSpeed = (playerComp.magnetSpeed || 100) * (1 + level);
                }
            }
        });
        
        this.passiveDatabase.set('gamblers_dice', {
            name: '赌徒骰子',
            description: '商店价格-20%，但购买时有10%概率什么都得不到',
            maxLevel: 1,
            category: 'utility',
            effect: (level, player) => {
                const playerComp = player.get(PlayerComponent);
                if (playerComp) {
                    playerComp.shopDiscount = 0.2;
                    playerComp.gambleChance = 0.1;
                }
            }
        });
        
        this.passiveDatabase.set('black_market_card', {
            name: '黑市卡',
            description: '商店出售更稀有物品，但价格+30%',
            maxLevel: 1,
            category: 'utility',
            effect: (level, player) => {
                const playerComp = player.get(PlayerComponent);
                if (playerComp) {
                    playerComp.shopRarityBonus = 1;
                    playerComp.shopPriceMultiplier = 1.3;
                }
            }
        });
        
        this.passiveDatabase.set('skill_book', {
            name: '技能书',
            description: '升级时额外获得1技能点',
            maxLevel: 3,
            category: 'utility',
            effect: (level, player) => {
                const playerComp = player.get(PlayerComponent);
                if (playerComp) playerComp.bonusSkillPoints = (playerComp.bonusSkillPoints || 0) + level;
            }
        });
        
        this.passiveDatabase.set('double_exp_charm', {
            name: '双倍经验护符',
            description: '经验获取+100%，但金币获取-50%',
            maxLevel: 1,
            category: 'utility',
            effect: (level, player) => {
                const playerComp = player.get(PlayerComponent);
                if (playerComp) {
                    playerComp.expMultiplier = (playerComp.expMultiplier || 1) * 2;
                    playerComp.goldMultiplier = (playerComp.goldMultiplier || 1) * 0.5;
                }
            }
        });
        
        this.passiveDatabase.set('rich_man_signet', {
            name: '富人印章',
            description: '金币获取+100%，但经验获取-50%',
            maxLevel: 1,
            category: 'utility',
            effect: (level, player) => {
                const playerComp = player.get(PlayerComponent);
                if (playerComp) {
                    playerComp.goldMultiplier = (playerComp.goldMultiplier || 1) * 2;
                    playerComp.expMultiplier = (playerComp.expMultiplier || 1) * 0.5;
                }
            }
        });
        
        this.passiveDatabase.set('weapon_master_emblem', {
            name: '武器大师徽章',
            description: '武器升级所需经验-30%',
            maxLevel: 3,
            category: 'utility',
            effect: (level, player) => {
                const playerComp = player.get(PlayerComponent);
                if (playerComp) playerComp.weaponExpMultiplier = (playerComp.weaponExpMultiplier || 1) * (1 - 0.3 * level);
            }
        });
        
        this.passiveDatabase.set('health_for_gold', {
            name: '血金契约',
            description: '拾取金币时恢复1点生命',
            maxLevel: 3,
            category: 'utility',
            effect: (level, player) => {
                const playerComp = player.get(PlayerComponent);
                if (playerComp) playerComp.goldHealAmount = (playerComp.goldHealAmount || 0) + level;
            }
        });
        
        this.passiveDatabase.set('kill_for_mana', {
            name: '杀戮回能',
            description: '击杀敌人时减少1秒技能冷却',
            maxLevel: 3,
            category: 'utility',
            effect: (level, player) => {
                const weapon = player.get(WeaponComponent);
                if (weapon) weapon.cooldownReductionOnKill = level;
            }
        });
        
        this.passiveDatabase.set('pet_companion', {
            name: '宠物伙伴',
            description: '获得一个协助战斗的宠物',
            maxLevel: 3,
            category: 'utility',
            effect: (level, player) => {
                const playerComp = player.get(PlayerComponent);
                if (playerComp) playerComp.petLevel = level;
            }
        });
        
        this.passiveDatabase.set('clone_projector', {
            name: '克隆投影器',
            description: '攻击时有10%概率创造一个持续5秒的幻影协助攻击',
            maxLevel: 3,
            category: 'utility',
            effect: (level, player) => {
                const weapon = player.get(WeaponComponent);
                if (weapon) weapon.cloneChance = 0.1 * level;
            }
        });
        
        this.passiveDatabase.set('time_dilation_device', {
            name: '时间膨胀装置',
            description: '敌人移动速度-15%',
            maxLevel: 3,
            category: 'utility',
            effect: (level, player) => {
                const playerComp = player.get(PlayerComponent);
                if (playerComp) playerComp.timeDilation = 0.15 * level;
            }
        });
        
        this.passiveDatabase.set('pain_for_power', {
            name: '痛苦之力',
            description: '受到伤害后5秒内伤害+20%',
            maxLevel: 3,
            category: 'utility',
            effect: (level, player) => {
                const combat = player.get(CombatComponent);
                if (combat) combat.painForPowerLevel = level;
            }
        });
        
        this.passiveDatabase.set('last_stand', {
            name: '背水一战',
            description: '生命低于10%时攻击速度+100%',
            maxLevel: 3,
            category: 'utility',
            effect: (level, player) => {
                const weapon = player.get(WeaponComponent);
                if (weapon) weapon.lastStandLevel = level;
            }
        });
        
        this.passiveDatabase.set('overclock_chip', {
            name: '超频芯片',
            description: '所有属性+10%，但每秒失去1生命',
            maxLevel: 3,
            category: 'utility',
            effect: (level, player) => {
                const combat = player.get(CombatComponent);
                const movement = player.get(MovementComponent);
                const health = player.get(HealthComponent);
                if (combat) combat.overclockLevel = level;
                if (movement) {
                    movement.speed *= (1 + 0.1 * level);
                    movement.baseSpeed = movement.speed;
                }
                if (health) health.overclockDrain = level;
            }
        });
        
        this.passiveDatabase.set('symbiotic_armor', {
            name: '共生装甲',
            description: '受到伤害时50%概率恢复10生命',
            maxLevel: 3,
            category: 'utility',
            effect: (level, player) => {
                const combat = player.get(CombatComponent);
                if (combat) combat.symbioticHealChance = 0.5 * level;
            }
        });
        
        this.passiveDatabase.set('cursed_gold_coin', {
            name: '诅咒金币',
            description: '金币获取+50%，但受到的伤害+20%',
            maxLevel: 1,
            category: 'utility',
            effect: (level, player) => {
                const playerComp = player.get(PlayerComponent);
                const combat = player.get(CombatComponent);
                if (playerComp) playerComp.goldMultiplier = (playerComp.goldMultiplier || 1) * 1.5;
                if (combat) combat.damageTakenMultiplier = (combat.damageTakenMultiplier || 1) * 1.2;
            }
        });
        
        // ===== 第四波被动道具扩展 (达到100+) =====
        // 更多攻击类
        this.passiveDatabase.set('elemental_fury', {
            name: '元素之怒',
            description: '元素伤害+30%（火焰/冰霜/闪电）',
            maxLevel: 3,
            category: 'attack',
            effect: (level, player) => {
                const combat = player.get(CombatComponent);
                if (combat) combat.elementalDamageBonus = (combat.elementalDamageBonus || 0) + 0.3 * level;
            }
        });
        
        this.passiveDatabase.set('necromancy_tome', {
            name: '死灵法典',
            description: '击杀敌人时有15%概率复活其为骷髅战士',
            maxLevel: 3,
            category: 'attack',
            effect: (level, player) => {
                const combat = player.get(CombatComponent);
                if (combat) combat.necromancyChance = 0.15 * level;
            }
        });
        
        this.passiveDatabase.set('soul_harvester', {
            name: '灵魂收割者',
            description: '每击杀100个敌人，伤害永久+5%',
            maxLevel: 5,
            category: 'attack',
            effect: (level, player) => {
                const combat = player.get(CombatComponent);
                if (combat) combat.soulHarvestLevel = level;
            }
        });
        
        this.passiveDatabase.set('combo_master', {
            name: '连击大师',
            description: '连续命中同一敌人时，每层连击+5%伤害',
            maxLevel: 3,
            category: 'attack',
            effect: (level, player) => {
                const combat = player.get(CombatComponent);
                if (combat) combat.comboBonus = 0.05 * level;
            }
        });
        
        this.passiveDatabase.set('ricochet_shots', {
            name: '弹射射击',
            description: '投射物可以弹射到墙壁，最多3次',
            maxLevel: 3,
            category: 'attack',
            effect: (level, player) => {
                const weapon = player.get(WeaponComponent);
                if (weapon) weapon.ricochetCount = level;
            }
        });
        
        this.passiveDatabase.set('piercing_shots', {
            name: '穿透射击',
            description: '投射物穿透敌人后伤害+20%',
            maxLevel: 3,
            category: 'attack',
            effect: (level, player) => {
                const weapon = player.get(WeaponComponent);
                if (weapon) weapon.pierceDamageBonus = 0.2 * level;
            }
        });
        
        this.passiveDatabase.set('ammo_conservation', {
            name: '弹药节约',
            description: '20%概率不消耗弹药/不进入冷却',
            maxLevel: 3,
            category: 'attack',
            effect: (level, player) => {
                const weapon = player.get(WeaponComponent);
                if (weapon) weapon.ammoConservationChance = 0.2 * level;
            }
        });
        
        this.passiveDatabase.set('aim_assist', {
            name: '瞄准辅助',
            description: '投射物轻微追踪最近敌人',
            maxLevel: 3,
            category: 'attack',
            effect: (level, player) => {
                const weapon = player.get(WeaponComponent);
                if (weapon) weapon.aimAssistLevel = level;
            }
        });
        
        this.passiveDatabase.set('frenzy_mode', {
            name: '狂怒模式',
            description: '连续击杀5个敌人后进入狂怒，攻速+50%持续5秒',
            maxLevel: 3,
            category: 'attack',
            effect: (level, player) => {
                const weapon = player.get(WeaponComponent);
                if (weapon) weapon.frenzyLevel = level;
            }
        });
        
        this.passiveDatabase.set('armor_breaker', {
            name: '破甲者',
            description: '攻击无视敌人30%护甲',
            maxLevel: 3,
            category: 'attack',
            effect: (level, player) => {
                const combat = player.get(CombatComponent);
                if (combat) combat.armorPenetration = (combat.armorPenetration || 0) + 0.3 * level;
            }
        });
        
        this.passiveDatabase.set('weaken_strike', {
            name: '虚弱打击',
            description: '攻击有25%概率使敌人伤害-30%持续5秒',
            maxLevel: 3,
            category: 'attack',
            effect: (level, player) => {
                const combat = player.get(CombatComponent);
                if (combat) combat.weakenChance = 0.25 * level;
            }
        });
        
        // 更多防御类
        this.passiveDatabase.set('spiked_armor', {
            name: '尖刺装甲',
            description: '被近战攻击时反弹50%伤害',
            maxLevel: 3,
            category: 'defense',
            effect: (level, player) => {
                const combat = player.get(CombatComponent);
                if (combat) combat.spikeReflect = (combat.spikeReflect || 0) + 0.5 * level;
            }
        });
        
        this.passiveDatabase.set('magic_shield', {
            name: '魔法护盾',
            description: '每30秒抵挡一次技能伤害',
            maxLevel: 3,
            category: 'defense',
            effect: (level, player) => {
                const combat = player.get(CombatComponent);
                if (combat) combat.magicShieldLevel = level;
            }
        });
        
        this.passiveDatabase.set('life_link', {
            name: '生命链接',
            description: '将受到伤害的10%转化为5秒内的持续掉血',
            maxLevel: 3,
            category: 'defense',
            effect: (level, player) => {
                const combat = player.get(CombatComponent);
                if (combat) combat.lifeLinkConversion = 0.1 * level;
            }
        });
        
        this.passiveDatabase.set('deflection_shield', {
            name: '偏转护盾',
            description: '远程攻击有15%概率被偏转',
            maxLevel: 3,
            category: 'defense',
            effect: (level, player) => {
                const combat = player.get(CombatComponent);
                if (combat) combat.deflectionChance = 0.15 * level;
            }
        });
        
        this.passiveDatabase.set('adrenaline_gland', {
            name: '肾上腺素腺体',
            description: '受到伤害后3秒内移速+30%',
            maxLevel: 3,
            category: 'defense',
            effect: (level, player) => {
                const combat = player.get(CombatComponent);
                if (combat) combat.adrenalineLevel = level;
            }
        });
        
        this.passiveDatabase.set('emergency_barrier', {
            name: '紧急屏障',
            description: '生命值首次低于25%时获得无敌护盾5秒，冷却120秒',
            maxLevel: 1,
            category: 'defense',
            effect: (level, player) => {
                const health = player.get(HealthComponent);
                if (health) health.hasEmergencyBarrier = true;
            }
        });
        
        this.passiveDatabase.set('vampiric_shield', {
            name: '吸血护盾',
            description: '护盾存在时造成伤害的20%转化为护盾值',
            maxLevel: 3,
            category: 'defense',
            effect: (level, player) => {
                const combat = player.get(CombatComponent);
                if (combat) combat.vampiricShieldLeech = 0.2 * level;
            }
        });
        
        this.passiveDatabase.set('fortress_stance', {
            name: '要塞姿态',
            description: '3秒内不移动获得20%减伤，最多叠加3层',
            maxLevel: 3,
            category: 'defense',
            effect: (level, player) => {
                const combat = player.get(CombatComponent);
                if (combat) combat.fortressLevel = level;
            }
        });
        
        // 更多移动类
        this.passiveDatabase.set('blink_device', {
            name: '闪现装置',
            description: '每隔8秒可以闪现一段距离',
            maxLevel: 3,
            category: 'movement',
            effect: (level, player) => {
                const movement = player.get(MovementComponent);
                if (movement) movement.blinkCooldown = Math.max(3, 8 - level * 2);
            }
        });
        
        this.passiveDatabase.set('momentum_engine', {
            name: '动量引擎',
            description: '移动速度每秒+5%，最多+30%，停止后重置',
            maxLevel: 3,
            category: 'movement',
            effect: (level, player) => {
                const movement = player.get(MovementComponent);
                if (movement) movement.momentumLevel = level;
            }
        });
        
        this.passiveDatabase.set('slide_boots', {
            name: '滑行靴',
            description: '停止移动后会继续滑行一段距离',
            maxLevel: 3,
            category: 'movement',
            effect: (level, player) => {
                const movement = player.get(MovementComponent);
                if (movement) movement.slideLevel = level;
            }
        });
        
        this.passiveDatabase.set('ghost_form', {
            name: '幽灵形态',
            description: '可以穿越敌人，穿越时造成伤害',
            maxLevel: 3,
            category: 'movement',
            effect: (level, player) => {
                const movement = player.get(MovementComponent);
                if (movement) movement.ghostFormLevel = level;
            }
        });
        
        this.passiveDatabase.set('homing_dash', {
            name: '追踪冲刺',
            description: '冲刺会自动导向最近的敌人',
            maxLevel: 1,
            category: 'movement',
            effect: (level, player) => {
                const movement = player.get(MovementComponent);
                if (movement) movement.homingDash = true;
            }
        });
        
        // 更多实用类
        this.passiveDatabase.set('alchemy_knowledge', {
            name: '炼金知识',
            description: '药水效果+50%，持续时间+50%',
            maxLevel: 3,
            category: 'utility',
            effect: (level, player) => {
                const playerComp = player.get(PlayerComponent);
                if (playerComp) {
                    playerComp.potionEffectMultiplier = (playerComp.potionEffectMultiplier || 1) * (1 + 0.5 * level);
                    playerComp.potionDurationMultiplier = (playerComp.potionDurationMultiplier || 1) * (1 + 0.5 * level);
                }
            }
        });
        
        this.passiveDatabase.set('chest_finder', {
            name: '宝箱探测器',
            description: '进入新楼层时标记所有宝箱位置',
            maxLevel: 1,
            category: 'utility',
            effect: (level, player) => {
                const playerComp = player.get(PlayerComponent);
                if (playerComp) playerComp.chestFinder = true;
            }
        });
        
        this.passiveDatabase.set('secret_vision', {
            name: '秘密视觉',
            description: '可以看到隐藏房间和秘密通道',
            maxLevel: 1,
            category: 'utility',
            effect: (level, player) => {
                const playerComp = player.get(PlayerComponent);
                if (playerComp) playerComp.seeSecrets = true;
            }
        });
        
        this.passiveDatabase.set('loot_drops', {
            name: '掠夺者',
            description: '敌人掉落金币+30%',
            maxLevel: 5,
            category: 'utility',
            effect: (level, player) => {
                const playerComp = player.get(PlayerComponent);
                if (playerComp) playerComp.dropGoldMultiplier = (playerComp.dropGoldMultiplier || 1) * (1 + 0.3 * level);
            }
        });
        
        this.passiveDatabase.set('quality_loot', {
            name: '品质战利品',
            description: '稀有物品掉率+50%',
            maxLevel: 3,
            category: 'utility',
            effect: (level, player) => {
                const playerComp = player.get(PlayerComponent);
                if (playerComp) playerComp.rarityBonus = (playerComp.rarityBonus || 0) + 0.5 * level;
            }
        });
        
        this.passiveDatabase.set('starting_gold', {
            name: '初始资金',
            description: '每层开始时获得100金币',
            maxLevel: 3,
            category: 'utility',
            effect: (level, player) => {
                const playerComp = player.get(PlayerComponent);
                if (playerComp) playerComp.startingGold = (playerComp.startingGold || 0) + 100 * level;
            }
        });
        
        this.passiveDatabase.set('free_sample', {
            name: '免费样品',
            description: '商店第一件商品免费',
            maxLevel: 1,
            category: 'utility',
            effect: (level, player) => {
                const playerComp = player.get(PlayerComponent);
                if (playerComp) playerComp.freeSample = true;
            }
        });
        
        this.passiveDatabase.set('haggling_skill', {
            name: '讨价还价',
            description: '商店价格-25%',
            maxLevel: 3,
            category: 'utility',
            effect: (level, player) => {
                const playerComp = player.get(PlayerComponent);
                if (playerComp) playerComp.shopDiscount = (playerComp.shopDiscount || 0) + 0.25 * level;
            }
        });
        
        this.passiveDatabase.set('treasure_hunter', {
            name: '寻宝猎人',
            description: '破坏罐子/箱子时有10%概率发现稀有物品',
            maxLevel: 3,
            category: 'utility',
            effect: (level, player) => {
                const playerComp = player.get(PlayerComponent);
                if (playerComp) playerComp.breakableRareChance = 0.1 * level;
            }
        });
        
        this.passiveDatabase.set('key_master', {
            name: '钥匙大师',
            description: '可以打开上锁的箱子而不消耗钥匙',
            maxLevel: 1,
            category: 'utility',
            effect: (level, player) => {
                const playerComp = player.get(PlayerComponent);
                if (playerComp) playerComp.freeUnlock = true;
            }
        });
        
        this.passiveDatabase.set('experience_sage', {
            name: '经验智者',
            description: '击杀精英敌人获得的经验+100%',
            maxLevel: 3,
            category: 'utility',
            effect: (level, player) => {
                const playerComp = player.get(PlayerComponent);
                if (playerComp) playerComp.eliteExpBonus = (playerComp.eliteExpBonus || 0) + 1.0 * level;
            }
        });
        
        this.passiveDatabase.set('boss_slayer', {
            name: 'Boss杀手',
            description: '对Boss伤害+30%',
            maxLevel: 3,
            category: 'utility',
            effect: (level, player) => {
                const combat = player.get(CombatComponent);
                if (combat) combat.bossDamageBonus = (combat.bossDamageBonus || 0) + 0.3 * level;
            }
        });
        
        this.passiveDatabase.set('minion_master', {
            name: '召唤大师',
            description: '召唤物伤害+50%，生命+50%',
            maxLevel: 3,
            category: 'utility',
            effect: (level, player) => {
                const playerComp = player.get(PlayerComponent);
                if (playerComp) {
                    playerComp.minionDamageBonus = (playerComp.minionDamageBonus || 0) + 0.5 * level;
                    playerComp.minionHealthBonus = (playerComp.minionHealthBonus || 0) + 0.5 * level;
                }
            }
        });
        
        this.passiveDatabase.set('damage_conversion', {
            name: '伤害转化',
            description: '超过10%最大生命的伤害会被减免50%',
            maxLevel: 1,
            category: 'utility',
            effect: (level, player) => {
                const combat = player.get(CombatComponent);
                if (combat) combat.damageConversion = true;
            }
        });
        
        this.passiveDatabase.set('health_for_power', {
            name: '生命献祭',
            description: '可以消耗生命代替法力使用技能',
            maxLevel: 1,
            category: 'utility',
            effect: (level, player) => {
                const playerComp = player.get(PlayerComponent);
                if (playerComp) playerComp.bloodMagic = true;
            }
        });
        
        this.passiveDatabase.set('emergency_recall', {
            name: '紧急召回',
            description: '生命值低于10%时立即传送到安全位置，冷却300秒',
            maxLevel: 1,
            category: 'utility',
            effect: (level, player) => {
                const health = player.get(HealthComponent);
                if (health) health.hasEmergencyRecall = true;
            }
        });
    }
    
    update(dt) {
        // 处理自动拾取
        this.handleAutoPickup(dt);
        
        // 处理道具飞向玩家（磁铁效果）
        this.handleItemMagnet(dt);
    }
    
    handleAutoPickup(dt) {
        const players = this.world.getEntitiesWithTag('player');
        const items = this.world.getEntitiesWithTag('item');
        
        for (const player of players) {
            const playerTransform = player.get(TransformComponent);
            if (!playerTransform) continue;
            
            // 获取玩家的磁铁范围
            const pickupRange = this.magnetRange; // 可以通过被动道具增加
            
            for (const item of items) {
                const itemComp = item.get(ItemComponent);
                const itemTransform = item.get(TransformComponent);
                
                if (!itemComp || !itemTransform) continue;
                if (!itemComp.autoPickup) continue;
                
                const dx = playerTransform.x - itemTransform.x;
                const dy = playerTransform.y - itemTransform.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                if (dist <= pickupRange) {
                    this.pickupItem(player, item);
                }
            }
        }
    }
    
    handleItemMagnet(dt) {
        const players = this.world.getEntitiesWithTag('player');
        const items = this.world.getEntitiesWithTag('item');
        
        for (const player of players) {
            const playerTransform = player.get(TransformComponent);
            if (!playerTransform) continue;
            
            for (const item of items) {
                const itemComp = item.get(ItemComponent);
                const itemTransform = item.get(TransformComponent);
                const movement = item.get(MovementComponent);
                
                if (!itemComp || !itemTransform || !movement) continue;
                
                const dx = playerTransform.x - itemTransform.x;
                const dy = playerTransform.y - itemTransform.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                // 在一定范围内加速飞向玩家
                if (dist < this.magnetRange * 1.5) {
                    const speed = itemComp.magnetSpeed * (1 - dist / (this.magnetRange * 1.5));
                    movement.vx = (dx / dist) * speed;
                    movement.vy = (dy / dist) * speed;
                }
            }
        }
    }
    
    pickupItem(player, item) {
        const itemComp = item.get(ItemComponent);
        const playerComp = player.get(PlayerComponent);
        const inventory = player.get(InventoryComponent);
        
        if (!itemComp || !playerComp || !inventory) return;
        
        const itemData = this.itemDatabase.get(itemComp.itemId);
        if (!itemData) return;
        
        let success = false;
        
        // 根据道具类型处理
        switch (itemData.type) {
            case 'consumable':
                success = this.applyConsumable(player, itemData);
                break;
                
            case 'resource':
                success = this.applyResource(player, itemData, itemComp);
                break;
                
            case 'permanent':
                success = this.applyPermanent(player, itemData);
                break;
                
            default:
                // 添加到背包
                success = inventory.addItem(itemComp);
        }
        
        if (success) {
            // 触发事件
            this.world.emit('itemPickedUp', player, itemComp.itemId);
            
            // 销毁道具实体
            item.destroy();
            
            // 更新统计
            playerComp.itemsCollected++;
        }
    }
    
    applyConsumable(player, itemData) {
        const combat = this.world.getSystem(CombatSystem);
        const health = player.get(HealthComponent);
        const playerComp = player.get(PlayerComponent);
        const movement = player.get(MovementComponent);
        const combatComp = player.get(CombatComponent);
        
        switch (itemData.effectType) {
            case 'heal':
                if (health && combat) {
                    combat.heal(player, itemData.effectValue);
                    return true;
                }
                break;
                
            case 'heal_full':
                if (health && combat) {
                    combat.heal(player, health.maxHealth);
                    return true;
                }
                break;
                
            case 'regen':
                if (health) {
                    const statusEffectSystem = this.world.getSystem(StatusEffectSystem);
                    if (statusEffectSystem) {
                        statusEffectSystem.addEffect(player, 'regeneration', itemData.duration);
                    }
                    return true;
                }
                break;
                
            case 'buff_damage':
                if (combatComp) {
                    combatComp.damageBuff = (combatComp.damageBuff || 1) * (1 + itemData.effectValue);
                    setTimeout(() => {
                        if (combatComp) combatComp.damageBuff = 1;
                    }, itemData.duration * 1000);
                    return true;
                }
                break;
                
            case 'buff_speed':
                if (movement) {
                    const oldSpeed = movement.speed;
                    movement.speed *= (1 + itemData.effectValue);
                    setTimeout(() => {
                        if (movement) movement.speed = oldSpeed;
                    }, itemData.duration * 1000);
                    return true;
                }
                break;
                
            case 'buff_armor':
                if (health) {
                    const oldArmor = health.armor;
                    health.armor += itemData.effectValue;
                    setTimeout(() => {
                        if (health) health.armor = oldArmor;
                    }, itemData.duration * 1000);
                    return true;
                }
                break;
                
            case 'bomb':
                // 在玩家位置造成范围伤害
                const playerTransform = player.get(TransformComponent);
                if (playerTransform && combat) {
                    const enemies = this.world.getEntitiesWithTag('enemy');
                    for (const enemy of enemies) {
                        const enemyTransform = enemy.get(TransformComponent);
                        if (!enemyTransform) continue;
                        
                        const dx = enemyTransform.x - playerTransform.x;
                        const dy = enemyTransform.y - playerTransform.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        
                        if (dist <= itemData.radius) {
                            combat.dealDamage(player, enemy, itemData.effectValue);
                        }
                    }
                    return true;
                }
                break;
                
            case 'freeze':
                const pt = player.get(TransformComponent);
                if (pt) {
                    const statusEffectSystem = this.world.getSystem(StatusEffectSystem);
                    const enemies = this.world.getEntitiesWithTag('enemy');
                    for (const enemy of enemies) {
                        const et = enemy.get(TransformComponent);
                        if (!et) continue;
                        
                        const dx = et.x - pt.x;
                        const dy = et.y - pt.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        
                        if (dist <= itemData.radius && statusEffectSystem) {
                            statusEffectSystem.addEffect(enemy, 'freeze', itemData.duration);
                        }
                    }
                    return true;
                }
                break;
                
            case 'reveal_map':
                const roomSystem = this.world.getSystem(RoomSystem);
                if (roomSystem) {
                    roomSystem.revealAllRooms();
                    return true;
                }
                break;
        }
        
        return false;
    }
    
    applyResource(player, itemData, itemComp) {
        const inventory = player.get(InventoryComponent);
        if (!inventory) return false;
        
        switch (itemData.effectType) {
            case 'exp':
                const playerComp = player.get(PlayerComponent);
                if (playerComp) {
                    playerComp.addExp(itemData.effectValue * itemComp.count);
                    return true;
                }
                break;
                
            default:
                // 金币等资源
                inventory.gold += itemComp.count;
                return true;
        }
    }
    
    applyPermanent(player, itemData) {
        const combat = this.world.getSystem(CombatSystem);
        const health = player.get(HealthComponent);
        
        switch (itemData.effectType) {
            case 'maxHealth':
                if (health) {
                    health.maxHealth += itemData.effectValue;
                    health.currentHealth += itemData.effectValue;
                    return true;
                }
                break;
                
            case 'maxDamage':
                const weapon = player.get(WeaponComponent);
                if (weapon) {
                    weapon.damage += itemData.effectValue;
                    return true;
                }
                break;
        }
        
        return false;
    }
    
    /**
     * 添加被动道具
     */
    addPassive(player, passiveId) {
        const playerComp = player.get(PlayerComponent);
        if (!playerComp) return false;
        
        const passiveData = this.passiveDatabase.get(passiveId);
        if (!passiveData) return false;
        
        // 检查是否已有
        const existing = playerComp.passives?.find(p => p.id === passiveId);
        if (existing) {
            if (existing.level >= passiveData.maxLevel) {
                return false; // 已满级
            }
            existing.level++;
        } else {
            if (!playerComp.passives) playerComp.passives = [];
            playerComp.passives.push({ id: passiveId, level: 1 });
        }
        
        // 应用效果
        const level = existing ? existing.level : 1;
        passiveData.effect(level, player);
        
        return true;
    }
    
    /**
     * 在位置生成道具
     */
    spawnItem(x, y, itemId, count = 1) {
        const itemData = this.itemDatabase.get(itemId);
        if (!itemData) return null;
        
        const item = this.world.createEntity()
            .add(new TransformComponent(x, y))
            .add(new SpriteComponent({
                width: 24,
                height: 24,
                anchorX: 0.5,
                anchorY: 0.5
            }))
            .add(new MovementComponent({ speed: 0 }))
            .add(new ItemComponent({
                itemId: itemId,
                itemType: itemData.type,
                rarity: itemData.rarity,
                effectType: itemData.effectType,
                effectValue: itemData.effectValue,
                autoPickup: itemData.autoPickup !== false,
                count: count
            }))
            .add(new ColliderComponent({
                radius: 12,
                layer: 'item',
                isTrigger: true
            }));
        
        item.addTag('item');
        
        return item;
    }
    
    /**
     * 从敌人掉落
     */
    spawnDropsFromEnemy(enemy) {
        const transform = enemy.get(TransformComponent);
        const enemyComp = enemy.get(EnemyComponent);
        
        if (!transform || !enemyComp) return;
        
        // 经验球
        this.spawnItem(transform.x, transform.y, 'exp_orb', enemyComp.expValue / 10);
        
        // 金币
        const goldAmount = Math.floor(Math.random() * 5) + 1;
        this.spawnItem(transform.x + Math.random() * 20 - 10, 
                       transform.y + Math.random() * 20 - 10, 
                       'gold', goldAmount);
        
        // 道具掉落
        if (Math.random() < enemyComp.dropChance) {
            for (const dropId of enemyComp.dropTable) {
                this.spawnItem(transform.x + Math.random() * 30 - 15,
                               transform.y + Math.random() * 30 - 15,
                               dropId);
            }
        }
    }
    
    destroy() {}
}

window.ItemSystem = ItemSystem;
