const ITEMS = {
    // ========== 基础攻击类 (1-15) ==========
    1: { id: 1, name: '多重射击', icon: '🎯', rarity: 'common', effect: 'projCount', value: 1, desc: '子弹+1', price: 40 },
    2: { id: 2, name: '巨大化', icon: '📏', rarity: 'common', effect: 'projSize', value: 0.3, desc: '子弹大小+30%', price: 35 },
    3: { id: 3, name: '快速射击', icon: '⚡', rarity: 'common', effect: 'fireRate', value: 0.15, desc: '射速+15%', price: 45 },
    4: { id: 4, name: '穿甲弹', icon: '🔩', rarity: 'rare', effect: 'pierce', value: 1, desc: '穿透+1', price: 80 },
    5: { id: 5, name: '暴击镜片', icon: '🔍', rarity: 'rare', effect: 'crit', value: 0.1, desc: '暴击率+10%', price: 75 },
    6: { id: 6, name: '狙击镜', icon: '🔭', rarity: 'epic', effect: 'critDmg', value: 0.5, desc: '暴击伤害+50%', price: 130 },
    7: { id: 7, name: '连发装置', icon: '🔫', rarity: 'epic', effect: 'burst', value: 1, desc: '连射+1发', price: 150 },
    8: { id: 8, name: '追踪芯片', icon: '🧿', rarity: 'rare', effect: 'homing', value: 0.5, desc: '子弹追踪能力+50%', price: 95 },
    9: { id: 9, name: '弹跳子弹', icon: '🎱', rarity: 'rare', effect: 'bounce', value: 1, desc: '弹跳+1次', price: 85 },
    10: { id: 10, name: '四向射击', icon: '➕', rarity: 'legendary', effect: 'quad', value: 1, desc: '四向发射，单发伤害-30%', price: 350 },
    11: { id: 11, name: '狂暴之血', icon: '🩸', rarity: 'rare', effect: 'crit', value: 0.1, desc: '暴击率+10%', price: 80 },
    12: { id: 12, name: '冰冻核心', icon: '❄️', rarity: 'rare', effect: 'slow', value: 0.2, desc: '减速敌人20%', price: 80 },
    13: { id: 13, name: '雷电宝珠', icon: '⚡', rarity: 'epic', effect: 'chain', value: 1, desc: '连锁攻击+1', price: 140 },
    14: { id: 14, name: '眼泪炸弹', icon: '💧', rarity: 'rare', effect: 'splitTear', value: 3, desc: '命中分裂3个泪弹', price: 170 },
    15: { id: 15, name: '科技2', icon: '🔦', rarity: 'epic', effect: 'tech2', value: 1, desc: '副武器：持续小激光', price: 240 },
    
    // ========== 基础防御/生存类 (16-25) ==========
    16: { id: 16, name: '心之容器', icon: '❤️', rarity: 'common', effect: 'maxHp', value: 1, desc: '生命上限+1', price: 50 },
    17: { id: 17, name: '复活币', icon: '🪙', rarity: 'legendary', effect: 'maxHp', value: 1, desc: '生命上限+1，死亡时复活', price: 500 },
    18: { id: 18, name: '九命猫', icon: '🐱', rarity: 'mythic', effect: 'nineLives', value: 1, desc: '死亡原地复活，血量上限变2', price: 800 },
    19: { id: 19, name: '幽灵靴', icon: '👻', rarity: 'epic', effect: 'armor', value: 2, desc: '护甲+2，格挡概率提升', price: 130 },
    20: { id: 20, name: '飞行翅膀', icon: '🦅', rarity: 'epic', effect: 'fly', value: 1, desc: '可以飞行，越过障碍', price: 150 },
    21: { id: 21, name: '瞬移装置', icon: '🌀', rarity: 'epic', effect: 'dashDist', value: 0.5, desc: '冲刺距离+50%', price: 120 },
    
    // ========== 资源/经济类 (26-32) ==========
    22: { id: 22, name: '金蛋', icon: '🥚', rarity: 'epic', effect: 'goldBonus', value: 0.5, desc: '金币获取+50%', price: 120 },
    23: { id: 23, name: '贪婪之手', icon: '🤲', rarity: 'rare', effect: 'goldOnKill', value: 2, desc: '击杀金币+2', price: 95 },
    24: { id: 24, name: '幸运币', icon: '🍀', rarity: 'rare', effect: 'luck', value: 1, desc: '幸运+1，提升高级掉落率', price: 110 },
    25: { id: 25, name: '经验书', icon: '📚', rarity: 'common', effect: 'expBonus', value: 0.1, desc: '经验获取+10%', price: 40 },
    26: { id: 26, name: '疾风靴', icon: '👢', rarity: 'epic', effect: 'speed', value: 0.3, desc: '移速+30%', price: 140 },
    27: { id: 27, name: '加速靴', icon: '👟', rarity: 'common', effect: 'speed', value: 0.1, desc: '移速+10%', price: 40 },
    28: { id: 28, name: '藏宝图', icon: '🗺️', rarity: 'rare', effect: 'mapReveal', value: 1, desc: '显示特殊房间位置', price: 150 },
    
    // ========== 预留位置 (29-31) ==========
    // 29-31号位置已预留，待后续添加新道具
    // 原宠物道具已移除，避免系统复杂性
    
    // ========== 诅咒类道具 (32-39) ==========
    
    // ========== 诅咒类 (39-48) ==========
    32: { id: 32, name: '玻璃大炮', icon: '🔮', rarity: 'cursed', effect: 'glassCannon', value: 1, desc: '伤害+100%，生命上限-50%', price: 100 },
    33: { id: 33, name: '豆浆', icon: '🥛', rarity: 'cursed', effect: 'soyMilk', value: 1, desc: '伤害-50%，射速+200%，弹道变小', price: 80 },
    34: { id: 34, name: '参孙之怒', icon: '😤', rarity: 'cursed', effect: 'samson', value: 1, desc: '受伤后本层伤害+50%，最多3次', price: 120 },
    // 35号位置已预留，原墨菲定律已移除
    36: { id: 36, name: '进化因子', icon: '🧬', rarity: 'epic', effect: 'evolution', value: 1, desc: '每层全属性+10%', price: 250 },
    37: { id: 37, name: '达尔文奖', icon: '🏆', rarity: 'legendary', effect: 'darwin', value: 1, desc: '每击杀500敌人伤害×1.3', price: 400 },
    38: { id: 38, name: '适应装甲', icon: '🛡️', rarity: 'epic', effect: 'adaptiveArmor', value: 1, desc: '每层护甲+1，火焰伤害+5%', price: 250 },
    39: { id: 39, name: '收藏家', icon: '🏛️', rarity: 'legendary', effect: 'collector', value: 1, desc: '每个收集的道具+2%全属性', price: 450 },
    
    // ========== 特殊/神话 (40-45) ==========
    40: { id: 40, name: '薛定谔的猫', icon: '🐱', rarity: 'mythic', effect: 'schrodinger', value: 1, desc: '死亡时50%概率复活', price: 1200 },
    41: { id: 41, name: '基因锁', icon: '🔒', rarity: 'mythic', effect: 'geneLock', value: 1, desc: '低血量时全属性+100%', price: 1000 },
    42: { id: 42, name: '量子态', icon: '⚛️', rarity: 'mythic', effect: 'quantumState', value: 1, desc: '50%概率格挡伤害', price: 1500 },
    // 43号位置已预留，原天选之人已移除
    // 44号位置已预留，原概率坍缩已移除
    45: { id: 45, name: '傲慢王冠', icon: '👑', rarity: 'cursed', effect: 'prideCrown', value: 1, desc: '满血伤害翻倍，不满血减半', price: 2000 },
    
    // ========== 宠物解锁道具 (46-60) ==========
    // 这些道具解锁对应宠物，获得后宠物加入宠物池可召唤
    46: { id: 46, name: '硫磺火之角', icon: '🔥', rarity: 'epic', effect: 'unlockPet', value: 1, petId: 'brimstone', desc: '解锁宠物：硫磺火牛', price: 300 },
    47: { id: 47, name: '科技芯片', icon: '🔬', rarity: 'epic', effect: 'unlockPet', value: 1, petId: 'tech', desc: '解锁宠物：科技牛', price: 300 },
    48: { id: 48, name: '眼泪瓶', icon: '💧', rarity: 'rare', effect: 'unlockPet', value: 1, petId: 'tear', desc: '解锁宠物：眼泪牛', price: 200 },
    49: { id: 49, name: '炸弹袋', icon: '💣', rarity: 'rare', effect: 'unlockPet', value: 1, petId: 'bomb', desc: '解锁宠物：炸弹牛', price: 200 },
    50: { id: 50, name: '飞刀鞘', icon: '🔪', rarity: 'rare', effect: 'unlockPet', value: 1, petId: 'knife', desc: '解锁宠物：飞刀牛', price: 220 },
    51: { id: 51, name: '黑洞核心', icon: '🕳️', rarity: 'legendary', effect: 'unlockPet', value: 1, petId: 'blackhole', desc: '解锁宠物：黑洞牛', price: 500 },
    52: { id: 52, name: '光环石', icon: '✨', rarity: 'epic', effect: 'unlockPet', value: 1, petId: 'aura', desc: '解锁宠物：光环牛', price: 350 },
    53: { id: 53, name: '导弹遥控器', icon: '🎯', rarity: 'epic', effect: 'unlockPet', value: 1, petId: 'missile', desc: '解锁宠物：导弹牛', price: 350 },
    54: { id: 54, name: '复制镜', icon: '🪞', rarity: 'legendary', effect: 'unlockPet', value: 1, petId: 'copy', desc: '解锁宠物：复制牛', price: 600 },
    55: { id: 55, name: '冰冻之心', icon: '❄️', rarity: 'rare', effect: 'unlockPet', value: 1, petId: 'ice', desc: '解锁宠物：冰冻牛', price: 200 },
    56: { id: 56, name: '雷电水晶', icon: '⚡', rarity: 'rare', effect: 'unlockPet', value: 1, petId: 'thunder', desc: '解锁宠物：雷电牛', price: 220 },
    57: { id: 57, name: '神圣符文', icon: '💖', rarity: 'legendary', effect: 'unlockPet', value: 1, petId: 'holy', desc: '解锁宠物：圣心牛', price: 800 },
    58: { id: 58, name: '神性碎片', icon: '✨', rarity: 'mythic', effect: 'unlockPet', value: 1, petId: 'godhead', desc: '解锁宠物：神性牛', price: 1500 },
    59: { id: 59, name: '龙蛋', icon: '🐉', rarity: 'epic', effect: 'unlockPet', value: 1, petId: 'dragon', desc: '解锁宠物：幼龙', price: 400 },
    60: { id: 60, name: '精灵球', icon: '🔮', rarity: 'rare', effect: 'unlockPet', value: 1, petId: 'fairy', desc: '解锁宠物：小精灵', price: 180 },
    
    // ========== v0.26 基础属性道具系列 (101-130) ==========
    // 6层架构：普通(1-2层) → 稀有(3-4层) → 史诗(5-6层) → 传说(Boss掉落)
    
    // --- 攻击力系列 ---
    101: { id: 101, name: '生锈短剑', icon: '🗡️', rarity: 'common', effect: 'dmgMult', value: 0.12, desc: '伤害+12%', price: 50, unlockFloor: 1 },
    102: { id: 102, name: '精钢长剑', icon: '⚔️', rarity: 'rare', effect: 'dmgMult', value: 0.25, desc: '伤害+25%', price: 120, unlockFloor: 3 },
    103: { id: 103, name: '附魔利剑', icon: '🗡️✨', rarity: 'epic', effect: 'dmgMult', value: 0.40, desc: '伤害+40%', price: 280, unlockFloor: 5 },
    104: { id: 104, name: '传说圣剑', icon: '🏆', rarity: 'legendary', effect: 'dmgMult', value: 0.60, desc: '伤害+60%', price: 0, unlockFloor: 1, bossDrop: true },
    
    // --- 射速系列 ---
    105: { id: 105, name: '发条装置', icon: '⏱️', rarity: 'common', effect: 'fireRateMult', value: 0.10, desc: '射速+10%', price: 45, unlockFloor: 1 },
    106: { id: 106, name: '涡轮引擎', icon: '⚙️', rarity: 'rare', effect: 'fireRateMult', value: 0.20, desc: '射速+20%', price: 110, unlockFloor: 3 },
    107: { id: 107, name: '时间加速器', icon: '⏩', rarity: 'epic', effect: 'fireRateMult', value: 0.35, desc: '射速+35%', price: 260, unlockFloor: 5 },
    108: { id: 108, name: '无限齿轮', icon: '♾️', rarity: 'legendary', effect: 'fireRateMult', value: 0.50, desc: '射速+50%', price: 0, unlockFloor: 1, bossDrop: true },
    
    // --- 移速系列 ---
    109: { id: 109, name: '草鞋', icon: '🩴', rarity: 'common', effect: 'speedMult', value: 0.10, desc: '移速+10%', price: 40, unlockFloor: 1 },
    110: { id: 110, name: '皮靴', icon: '👢', rarity: 'rare', effect: 'speedMult', value: 0.20, desc: '移速+20%', price: 100, unlockFloor: 3 },
    111: { id: 111, name: '羽靴', icon: '🕊️', rarity: 'epic', effect: 'speedMult', value: 0.35, desc: '移速+35%', price: 240, unlockFloor: 5 },
    112: { id: 112, name: '赫尔墨斯之靴', icon: '👟✨', rarity: 'legendary', effect: 'speedMult', value: 0.50, desc: '移速+50%', price: 0, unlockFloor: 1, bossDrop: true },
    
    // --- 暴击系列 ---
    113: { id: 113, name: '幸运币', icon: '🪙', rarity: 'common', effect: 'critAdd', value: 0.08, desc: '暴击率+8%', price: 55, unlockFloor: 1 },
    114: { id: 114, name: '四叶草', icon: '🍀', rarity: 'rare', effect: 'critAdd', value: 0.15, desc: '暴击率+15%', price: 130, unlockFloor: 3 },
    115: { id: 115, name: '鹰眼透镜', icon: '🔍', rarity: 'epic', effect: 'critAdd', value: 0.25, desc: '暴击率+25%', price: 300, unlockFloor: 5 },
    116: { id: 116, name: '命运之眼', icon: '👁️', rarity: 'legendary', effect: 'critAdd', value: 0.35, desc: '暴击率+35%', price: 0, unlockFloor: 1, bossDrop: true },
    
    // --- 生命系列 ---
    117: { id: 117, name: '野果', icon: '🪰', rarity: 'common', effect: 'maxHpAdd', value: 1, desc: '生命上限+1', price: 45, unlockFloor: 1 },
    118: { id: 118, name: '肉干', icon: '🥩', rarity: 'rare', effect: 'maxHpAdd', value: 2, desc: '生命上限+2', price: 110, unlockFloor: 3 },
    119: { id: 119, name: '生命药水', icon: '🧪❤️', rarity: 'epic', effect: 'maxHpAdd', value: 3, desc: '生命上限+3', price: 260, unlockFloor: 5 },
    120: { id: 120, name: '凤凰之血', icon: '🩸🔥', rarity: 'legendary', effect: 'maxHpAdd', value: 4, desc: '生命上限+4', price: 0, unlockFloor: 1, bossDrop: true },
    
    // --- 护甲系列 ---
    121: { id: 121, name: '破布甲', icon: '🦺', rarity: 'common', effect: 'armorAdd', value: 1, desc: '护甲+1，格挡+5.5%', price: 50, unlockFloor: 1 },
    122: { id: 122, name: '铁片甲', icon: '⛓️', rarity: 'rare', effect: 'armorAdd', value: 2, desc: '护甲+2，格挡+10.5%', price: 120, unlockFloor: 3 },
    123: { id: 123, name: '精钢甲', icon: '🛡️', rarity: 'epic', effect: 'armorAdd', value: 4, desc: '护甲+4，格挡+19%', price: 280, unlockFloor: 5 },
    124: { id: 124, name: '龙鳞甲', icon: '🐉', rarity: 'legendary', effect: 'armorAdd', value: 6, desc: '护甲+6，格挡+26%', price: 0, unlockFloor: 1, bossDrop: true },
    
    // --- 穿透系列 ---
    125: { id: 125, name: '尖刺', icon: '📌', rarity: 'common', effect: 'pierceAdd', value: 1, desc: '穿透+1', price: 60, unlockFloor: 1 },
    126: { id: 126, name: '长矛', icon: '🎯', rarity: 'rare', effect: 'pierceAdd', value: 2, desc: '穿透+2', price: 140, unlockFloor: 3 },
    127: { id: 127, name: '溃灭之刺', icon: '🌑', rarity: 'epic', effect: 'pierceAdd', value: 3, desc: '穿透+3', price: 320, unlockFloor: 5 },
    
    // --- 子弹数量系列 ---
    128: { id: 128, name: '分叉箭', icon: '🏹', rarity: 'common', effect: 'projCountAdd', value: 1, desc: '子弹+1，散射+5°', price: 70, unlockFloor: 1 },
    129: { id: 129, name: '散射核心', icon: '💠', rarity: 'rare', effect: 'projCountAdd', value: 1, desc: '子弹+1，散射+10°', price: 160, unlockFloor: 3 },
    130: { id: 130, name: '风暴之眼', icon: '🌀', rarity: 'epic', effect: 'projCountAdd', value: 2, desc: '子弹+2，散射+15°', price: 380, unlockFloor: 5 }
};
