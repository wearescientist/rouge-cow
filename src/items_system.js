/**
 * 肉鸽牛牛 - 道具系统核心
 * 100个道具的完整实现
 * 
 * 设计原则：
 * 1. Everything stacks with everything
 * 2. 4种叠加类型：linear(线性), hyperbolic(双曲线), exponential(指数), step(阶梯)
 * 3. 5种稀有度：common(白), rare(蓝), epic(紫), legendary(金), cursed(红)
 */

// ==================== 道具数据库 ====================
const ITEMS_DATABASE = {
    // ========== 武器增强类 (1-25) ==========
    1: {
        id: 1, name: "多重射击", icon: "🎯", rarity: "common",
        effect: "projectileCount", value: 1, stackType: "linear",
        description: "所有武器发射物数量+1", maxStacks: 10
    },
    2: {
        id: 2, name: "巨大化", icon: "📏", rarity: "common",
        effect: "projectileSize", value: 0.5, stackType: "linear",
        description: "所有武器尺寸+50%", maxStacks: 8
    },
    3: {
        id: 3, name: "快速射击", icon: "⚡", rarity: "common",
        effect: "fireRate", value: -0.15, stackType: "hyperbolic",
        description: "武器发射间隔-15%", maxStacks: 10
    },
    4: {
        id: 4, name: "穿甲弹", icon: "🔩", rarity: "rare",
        effect: "pierceCount", value: 1, stackType: "linear",
        description: "子弹可穿透1个敌人", maxStacks: 5
    },
    5: {
        id: 5, name: "追踪瞄准", icon: "🧲", rarity: "rare",
        effect: "homingAngle", value: 15, stackType: "linear",
        description: "子弹小幅追踪敌人", maxStacks: 5
    },
    6: {
        id: 6, name: "弹跳子弹", icon: "🎾", rarity: "rare",
        effect: "bounceCount", value: 2, stackType: "linear",
        description: "子弹可在墙壁弹跳2次", maxStacks: 4
    },
    7: {
        id: 7, name: "分裂弹", icon: "💥", rarity: "rare",
        effect: "splitCount", value: 3, stackType: "step",
        description: "击中时分裂成3个小子弹", maxStacks: 3
    },
    8: {
        id: 8, name: "暴击镜片", icon: "🔍", rarity: "rare",
        effect: "critChance", value: 0.20, stackType: "hyperbolic",
        description: "20%几率暴击(2倍伤害)", maxStacks: 8
    },
    9: {
        id: 9, name: "毒素涂层", icon: "🧪", rarity: "rare",
        effect: "poisonDuration", value: 3, stackType: "linear",
        description: "子弹使敌人中毒(3秒)", maxStacks: 5
    },
    10: {
        id: 10, name: "火焰附魔", icon: "🔥", rarity: "rare",
        effect: "burnDuration", value: 2, stackType: "linear",
        description: "子弹使敌人燃烧(2秒)", maxStacks: 5
    },
    11: {
        id: 11, name: "冰冻核心", icon: "❄️", rarity: "epic",
        effect: "freezeChance", value: 0.25, stackType: "hyperbolic",
        description: "子弹25%几率冰冻敌人1秒", maxStacks: 5
    },
    12: {
        id: 12, name: "闪电链", icon: "⚡", rarity: "epic",
        effect: "chainCount", value: 2, stackType: "linear",
        description: "击中时连锁到附近2个敌人", maxStacks: 5
    },
    13: {
        id: 13, name: "爆炸弹头", icon: "💣", rarity: "epic",
        effect: "explosionRadius", value: 0.30, stackType: "linear",
        description: "子弹击中时小范围爆炸", maxStacks: 5
    },
    14: {
        id: 14, name: "黑洞发生器", icon: "🌑", rarity: "epic",
        effect: "blackHolePull", value: 0.30, stackType: "linear",
        description: "子弹吸引周围敌人", maxStacks: 4
    },
    15: {
        id: 15, name: "时间缓慢", icon: "⏱️", rarity: "epic",
        effect: "slowChance", value: 0.20, stackType: "hyperbolic",
        description: "子弹有20%几率使敌人减速", maxStacks: 5
    },
    16: {
        id: 16, name: "神圣之光", icon: "✨", rarity: "epic",
        effect: "undeadMultiplier", value: 3, stackType: "step",
        description: "子弹对亡灵造成3倍伤害", maxStacks: 2
    },
    17: {
        id: 17, name: "生命偷取", icon: "🧛", rarity: "epic",
        effect: "lifeSteal", value: 0.10, stackType: "linear",
        description: "造成伤害的10%转为生命", maxStacks: 5
    },
    18: {
        id: 18, name: "弹射起步", icon: "🚀", rarity: "rare",
        effect: "projectileSpeed", value: 0.50, stackType: "linear",
        description: "子弹速度+50%，伤害+20%", maxStacks: 5
    },
    19: {
        id: 19, name: "回旋镖", icon: "🪃", rarity: "rare",
        effect: "returnCount", value: 1, stackType: "linear",
        description: "子弹会返回并造成二次伤害", maxStacks: 3
    },
    20: {
        id: 20, name: "霰弹扩散", icon: "🎆", rarity: "rare",
        effect: "shotgunCount", value: 3, stackType: "linear",
        description: "单发武器变成3发散射", maxStacks: 4
    },
    21: {
        id: 21, name: "激光聚焦", icon: "🔦", rarity: "epic",
        effect: "laserMode", value: 1, stackType: "step",
        description: "武器变成直线穿透激光", maxStacks: 1
    },
    22: {
        id: 22, name: "自动瞄准", icon: "🤖", rarity: "epic",
        effect: "autoAimAngle", value: 30, stackType: "linear",
        description: "武器自动锁定最近敌人", maxStacks: 3
    },
    23: {
        id: 23, name: "连发射击", icon: "🔫", rarity: "epic",
        effect: "burstCount", value: 1, stackType: "linear",
        description: "每次发射额外+1发", maxStacks: 5
    },
    24: {
        id: 24, name: "终极进化", icon: "🦋", rarity: "legendary",
        effect: "weaponLevel", value: 1, stackType: "linear",
        description: "所有武器效果+1级", maxStacks: 3
    },
    25: {
        id: 25, name: "武器大师", icon: "🏆", rarity: "legendary",
        effect: "weaponSlot", value: 1, stackType: "linear",
        description: "可以同时装备武器数量+1", maxStacks: 2
    },

    // ========== 防御生存类 (26-50) ==========
    26: {
        id: 26, name: "心之容器", icon: "❤️", rarity: "common",
        effect: "maxHealth", value: 2, stackType: "linear",
        description: "最大生命值+2", maxStacks: 10
    },
    27: {
        id: 27, name: "钢铁护甲", icon: "🛡️", rarity: "common",
        effect: "damageReduction", value: 1, stackType: "linear",
        description: "受到伤害-1", maxStacks: 5
    },
    28: {
        id: 28, name: "快速回复", icon: "🏥", rarity: "common",
        effect: "regenRate", value: 0.50, stackType: "linear",
        description: "生命回复速度+50%", maxStacks: 5
    },
    29: {
        id: 29, name: "护盾发生器", icon: "🔰", rarity: "rare",
        effect: "shieldLayer", value: 1, stackType: "linear",
        description: "获得1点护盾(抵消一次伤害)", maxStacks: 3
    },
    30: {
        id: 30, name: "闪避靴", icon: "👢", rarity: "rare",
        effect: "dodgeChance", value: 0.15, stackType: "hyperbolic",
        description: "15%几率闪避攻击", maxStacks: 8
    },
    31: {
        id: 31, name: "荆棘护甲", icon: "🌵", rarity: "rare",
        effect: "thornDamage", value: 0.50, stackType: "linear",
        description: "受到伤害时反弹50%伤害", maxStacks: 5
    },
    32: {
        id: 32, name: "吸血獠牙", icon: "🦷", rarity: "rare",
        effect: "killHeal", value: 1, stackType: "linear",
        description: "击杀敌人回复1生命", maxStacks: 5
    },
    33: {
        id: 33, name: "不朽护符", icon: "📿", rarity: "epic",
        effect: "reviveCount", value: 1, stackType: "linear",
        description: "死亡时复活一次(50%生命)", maxStacks: 3
    },
    34: {
        id: 34, name: "神圣护盾", icon: "⭐", rarity: "epic",
        effect: "invincibleInterval", value: -1, stackType: "linear",
        description: "每隔8秒获得1秒无敌", maxStacks: 5
    },
    35: {
        id: 35, name: "伤害转化", icon: "🔄", rarity: "epic",
        effect: "damageToExp", value: 0.30, stackType: "linear",
        description: "受到伤害的30%转化为经验", maxStacks: 5
    },
    36: {
        id: 36, name: "生命护盾", icon: "🩸", rarity: "rare",
        effect: "healthDefense", value: 5, stackType: "step",
        description: "当前生命值越高，防御越高(最多+5)", maxStacks: 2
    },
    37: {
        id: 37, name: "应急包", icon: "🎒", rarity: "rare",
        effect: "emergencyHeal", value: 0.30, stackType: "step",
        description: "生命低于20%时瞬间回复30%", maxStacks: 3
    },
    38: {
        id: 38, name: "幽灵形态", icon: "👻", rarity: "rare",
        effect: "ghostDuration", value: 3, stackType: "linear",
        description: "受伤后3秒内可穿过敌人", maxStacks: 3
    },
    39: {
        id: 39, name: "最后屏障", icon: "🏰", rarity: "epic",
        effect: "deathPrevent", value: 1, stackType: "linear",
        description: "生命不会低于1点(每场战斗一次)", maxStacks: 3
    },
    40: {
        id: 40, name: "生命共享", icon: "🔗", rarity: "rare",
        effect: "minionShareDamage", value: -0.50, stackType: "linear",
        description: "召唤物受到伤害的50%由你承担", maxStacks: 3
    },
    41: {
        id: 41, name: "再生因子", icon: "🧬", rarity: "rare",
        effect: "idleRegen", value: 0.50, stackType: "linear",
        description: "站立不动时快速回血", maxStacks: 5
    },
    42: {
        id: 42, name: "牺牲护符", icon: "🎭", rarity: "epic",
        effect: "goldShield", value: 1, stackType: "step",
        description: "受到伤害时优先扣除金币(1金币=1伤害)", maxStacks: 1
    },
    43: {
        id: 43, name: "时间回溯", icon: "⏮️", rarity: "epic",
        effect: "rewindTime", value: 3, stackType: "linear",
        description: "受到伤害后3秒内可回溯位置", maxStacks: 2
    },
    44: {
        id: 44, name: "钢铁意志", icon: "🗿", rarity: "epic",
        effect: "hitInvincible", value: 2, stackType: "linear",
        description: "受伤后2秒内无敌", maxStacks: 3
    },
    45: {
        id: 45, name: "生命虹吸", icon: "🌈", rarity: "epic",
        effect: "lifeDrain", value: 1, stackType: "linear",
        description: "周围敌人每秒损失1生命，你获得等量治疗", maxStacks: 5
    },
    46: {
        id: 46, name: "第二心脏", icon: "💓", rarity: "epic",
        effect: "doubleHealth", value: 1, stackType: "step",
        description: "生命值上限翻倍，但初始只有50%", maxStacks: 1
    },
    47: {
        id: 47, name: "防御姿态", icon: "🧘", rarity: "rare",
        effect: "defenseStance", value: 3, stackType: "linear",
        description: "不移动时防御+3", maxStacks: 3
    },
    48: {
        id: 48, name: "痛苦转化", icon: "😣", rarity: "rare",
        effect: "painToPower", value: 1.00, stackType: "linear",
        description: "受到伤害后下次攻击伤害+100%", maxStacks: 3
    },
    49: {
        id: 49, name: "凤凰之羽", icon: "🪶", rarity: "legendary",
        effect: "phoenixRevive", value: 1, stackType: "linear",
        description: "死亡后满血复活，但清空所有金币", maxStacks: 2
    },
    50: {
        id: 50, name: "绝对防御", icon: "🛐", rarity: "legendary",
        effect: "autoDodge", value: -1, stackType: "linear",
        description: "每第5次攻击自动闪避", maxStacks: 3
    },

    // ========== 移动探索类 (51-70) ==========
    51: {
        id: 51, name: "加速靴", icon: "👟", rarity: "common",
        effect: "moveSpeed", value: 0.20, stackType: "linear",
        description: "移动速度+20%", maxStacks: 5
    },
    52: {
        id: 52, name: "飞行翅膀", icon: "🦅", rarity: "rare",
        effect: "flight", value: 1, stackType: "step",
        description: "可以飞行(无视障碍物)", maxStacks: 1
    },
    53: {
        id: 53, name: "穿墙术", icon: "🚪", rarity: "rare",
        effect: "wallPhasing", value: 1, stackType: "step",
        description: "可以穿过墙壁", maxStacks: 1
    },
    54: {
        id: 54, name: "冲刺靴", icon: "💨", rarity: "rare",
        effect: "dashCooldown", value: -0.50, stackType: "linear",
        description: "双击方向键冲刺(3秒CD)", maxStacks: 4
    },
    55: {
        id: 55, name: "磁铁", icon: "🧲", rarity: "common",
        effect: "magnetRange", value: 0.30, stackType: "linear",
        description: "自动吸取范围内金币和经验", maxStacks: 5
    },
    56: {
        id: 56, name: "扩展视野", icon: "👁️", rarity: "common",
        effect: "viewRange", value: 0.30, stackType: "linear",
        description: "视野范围+30%", maxStacks: 4
    },
    57: {
        id: 57, name: "地图雷达", icon: "📡", rarity: "rare",
        effect: "enemyRadar", value: 1, stackType: "step",
        description: "显示当前房间所有敌人位置", maxStacks: 1
    },
    58: {
        id: 58, name: "瞬移腰带", icon: "🌀", rarity: "epic",
        effect: "teleportCooldown", value: -1, stackType: "linear",
        description: "按空格短距离瞬移(5秒CD)", maxStacks: 4
    },
    59: {
        id: 59, name: "水上行走", icon: "🌊", rarity: "rare",
        effect: "waterWalk", value: 1, stackType: "step",
        description: "可以在水/毒液上行走", maxStacks: 1
    },
    60: {
        id: 60, name: "隐身衣", icon: "🥷", rarity: "rare",
        effect: "invisibilityTime", value: -1, stackType: "linear",
        description: "静止3秒后隐身(敌人不攻击)", maxStacks: 3
    },
    61: {
        id: 61, name: "二段跳", icon: "🦘", rarity: "rare",
        effect: "extraJump", value: 1, stackType: "linear",
        description: "可以空中再跳一次", maxStacks: 3
    },
    62: {
        id: 62, name: "滑行靴", icon: "⛸️", rarity: "rare",
        effect: "iceTrail", value: 2, stackType: "linear",
        description: "移动时留下冰道，敌人减速", maxStacks: 3
    },
    63: {
        id: 63, name: "钩爪", icon: "🪝", rarity: "rare",
        effect: "hookRange", value: 0.30, stackType: "linear",
        description: "按空格发射钩爪拉到墙壁", maxStacks: 3
    },
    64: {
        id: 64, name: "时间加速", icon: "⏩", rarity: "epic",
        effect: "timeScale", value: 0.20, stackType: "linear",
        description: "自身时间流速+20%(移速/攻速)", maxStacks: 3
    },
    65: {
        id: 65, name: "相位移动", icon: "🌊", rarity: "epic",
        effect: "phaseThrough", value: 1, stackType: "step",
        description: "移动时无视敌人碰撞", maxStacks: 1
    },
    66: {
        id: 66, name: "全局定位", icon: "🗺️", rarity: "rare",
        effect: "fullMap", value: 1, stackType: "step",
        description: "显示全地图房间布局", maxStacks: 1
    },
    67: {
        id: 67, name: "快速传送", icon: "🚀", rarity: "epic",
        effect: "quickTeleport", value: 1, stackType: "step",
        description: "清理房间后可以立即传送", maxStacks: 1
    },
    68: {
        id: 68, name: "重力靴", icon: "🌑", rarity: "epic",
        effect: "wallWalk", value: 1, stackType: "step",
        description: "可以走上墙壁和天花板", maxStacks: 1
    },
    69: {
        id: 69, name: "时间停止", icon: "⏸️", rarity: "legendary",
        effect: "timeStopDuration", value: 0.50, stackType: "linear",
        description: "每10秒可以停止时间2秒", maxStacks: 3
    },
    70: {
        id: 70, name: "无限瞬移", icon: "🌌", rarity: "legendary",
        effect: "teleportCost", value: -1, stackType: "linear",
        description: "瞬移无CD，但需要消耗5金币", maxStacks: 4
    },

    // ========== 资源经济类 (71-85) ==========
    71: {
        id: 71, name: "金币袋", icon: "💰", rarity: "common",
        effect: "goldGain", value: 0.50, stackType: "linear",
        description: "金币获取量+50%", maxStacks: 5
    },
    72: {
        id: 72, name: "商店折扣", icon: "🏷️", rarity: "common",
        effect: "shopDiscount", value: -0.20, stackType: "hyperbolic",
        description: "商店价格-20%", maxStacks: 5
    },
    73: {
        id: 73, name: "贪婪之手", icon: "🖐️", rarity: "rare",
        effect: "goldBonus", value: 0.50, stackType: "linear",
        description: "拾取金币时额外获得50%", maxStacks: 5
    },
    74: {
        id: 74, name: "金蛋", icon: "🥚", rarity: "rare",
        effect: "goldToDamage", value: 100, stackType: "step",
        description: "每持有100金币，伤害+1", maxStacks: 1
    },
    75: {
        id: 75, name: "投资计划", icon: "📈", rarity: "rare",
        effect: "roomClearGold", value: 10, stackType: "linear",
        description: "每清理一个房间获得10金币", maxStacks: 5
    },
    76: {
        id: 76, name: "掉落加成", icon: "🎁", rarity: "rare",
        effect: "dropRate", value: 0.25, stackType: "hyperbolic",
        description: "敌人掉落率+25%", maxStacks: 5
    },
    77: {
        id: 77, name: "钥匙串", icon: "🔑", rarity: "rare",
        effect: "keyEfficiency", value: 1, stackType: "linear",
        description: "每把钥匙可以打开2扇门", maxStacks: 3
    },
    78: {
        id: 78, name: "炸弹袋", icon: "💣", rarity: "common",
        effect: "bombCapacity", value: 5, stackType: "linear",
        description: "炸弹携带上限+5", maxStacks: 5
    },
    79: {
        id: 79, name: "幸运币", icon: "🍀", rarity: "epic",
        effect: "shopExtraItem", value: 1, stackType: "linear",
        description: "商店刷新时出现额外商品", maxStacks: 3
    },
    80: {
        id: 80, name: "复制机", icon: "📠", rarity: "epic",
        effect: "shopDuplicate", value: 1, stackType: "step",
        description: "进入商店时复制一个随机道具", maxStacks: 1
    },
    81: {
        id: 81, name: "摇钱树", icon: "🌳", rarity: "epic",
        effect: "waveStartGold", value: 10, stackType: "linear",
        description: "每波开始时获得金币=波数×10", maxStacks: 3
    },
    82: {
        id: 82, name: "债务合约", icon: "📜", rarity: "cursed",
        effect: "overdraftLimit", value: 50, stackType: "linear",
        description: "可以透支购买(最多-50金币)", maxStacks: 3
    },
    83: {
        id: 83, name: "摇奖机", icon: "🎰", rarity: "epic",
        effect: "gambleChance", value: 0.50, stackType: "linear",
        description: "消耗10金币有50%获得道具", maxStacks: 3
    },
    84: {
        id: 84, name: "自动拾取", icon: "🤲", rarity: "rare",
        effect: "autoCollectSpeed", value: 0.50, stackType: "linear",
        description: "金币和经验自动飞向你", maxStacks: 3
    },
    85: {
        id: 85, name: "富可敌国", icon: "👑", rarity: "legendary",
        effect: "goldCap", value: 9999, stackType: "step",
        description: "金币上限9999，超过部分转为伤害", maxStacks: 1
    },

    // ========== 召唤随从类 (86-95) ==========
    86: {
        id: 86, name: "小精灵", icon: "🧚", rarity: "rare",
        effect: "fairyCount", value: 1, stackType: "linear",
        description: "跟随射击，伤害=你的一半", maxStacks: 3
    },
    87: {
        id: 87, name: "守护球", icon: "🔮", rarity: "rare",
        effect: "orbiterCount", value: 1, stackType: "linear",
        description: "环绕保护，阻挡子弹，造成接触伤害", maxStacks: 4
    },
    88: {
        id: 88, name: "召唤骷髅", icon: "💀", rarity: "rare",
        effect: "skeletonChance", value: 0.20, stackType: "hyperbolic",
        description: "击杀有20%几率召唤骷髅战士", maxStacks: 5
    },
    89: {
        id: 89, name: "无人机", icon: "🛸", rarity: "rare",
        effect: "droneCount", value: 1, stackType: "linear",
        description: "自动攻击最近敌人", maxStacks: 3
    },
    90: {
        id: 90, name: "影子分身", icon: "🎭", rarity: "epic",
        effect: "shadowCount", value: 1, stackType: "linear",
        description: "创建一个影子模仿你的动作", maxStacks: 2
    },
    91: {
        id: 91, name: "蜂群", icon: "🐝", rarity: "rare",
        effect: "beeCount", value: 5, stackType: "linear",
        description: "5只蜜蜂自动攻击敌人", maxStacks: 3
    },
    92: {
        id: 92, name: "宠物龙", icon: "🐉", rarity: "epic",
        effect: "dragonCount", value: 1, stackType: "linear",
        description: "喷火攻击，大范围伤害", maxStacks: 2
    },
    93: {
        id: 93, name: "镜像分身", icon: "🪞", rarity: "epic",
        effect: "mirrorCount", value: 2, stackType: "linear",
        description: "创建2个分身，有你的30%伤害", maxStacks: 2
    },
    94: {
        id: 94, name: "亡灵军团", icon: "⚰️", rarity: "epic",
        effect: "undeadWaveCount", value: 3, stackType: "linear",
        description: "每波召唤3个骷髅，持续30秒", maxStacks: 3
    },
    95: {
        id: 95, name: "天使降临", icon: "👼", rarity: "legendary",
        effect: "angelChance", value: 0.50, stackType: "linear",
        description: "受伤时50%几率召唤天使治疗", maxStacks: 3
    },

    // ========== 特殊机制/诅咒类 (96-100) ==========
    96: {
        id: 96, name: "狂暴模式", icon: "😈", rarity: "cursed",
        effect: "berserkMode", value: 1, stackType: "step",
        description: "伤害+50%，但无法控制自动射击", maxStacks: 1
    },
    97: {
        id: 97, name: "献祭之心", icon: "💔", rarity: "cursed",
        effect: "sacrifice", value: 1, stackType: "step",
        description: "每秒损失1生命，伤害+100%", maxStacks: 1
    },
    98: {
        id: 98, name: "混沌骰子", icon: "🎲", rarity: "cursed",
        effect: "chaosDice", value: 1, stackType: "linear",
        description: "每波随机获得一个道具(也可能负面)", maxStacks: 3
    },
    99: {
        id: 99, name: "双重人生", icon: "⚖️", rarity: "legendary",
        effect: "dualLife", value: 1, stackType: "step",
        description: "同时控制两个角色(共享生命)", maxStacks: 1
    },
    100: {
        id: 100, name: "通关秘籍", icon: "📖", rarity: "legendary",
        effect: "cheatMode", value: 1, stackType: "step",
        description: "所有属性+30%，但敌人数×2", maxStacks: 1
    }
};

// ==================== 叠加计算系统 ====================
const StackCalculator = {
    // 线性叠加: value * stacks
    linear(value, stacks) {
        return value * stacks;
    },

    // 双曲线叠加: 1 - 1/(1 + value * stacks) 或 value * stacks / (1 + value * stacks)
    // 用于闪避、暴击等概率属性，防止达到100%
    hyperbolic(value, stacks, type = "probability") {
        if (type === "probability") {
            // 概率类: 15% + 15% 实际效果递减
            // 2个: 1 - (1-0.15)^2 = 27.75%
            // 5个: 1 - (1-0.15)^5 = 55.6%
            return 1 - Math.pow(1 - value, stacks);
        } else {
            // 收益递减类: 加速等
            // 2个: 0.15 + 0.15*0.7 = 25.5%
            return value * stacks / (1 + value * stacks * 0.3);
        }
    },

    // 指数叠加: value^stacks 或 (1+value)^stacks
    exponential(value, stacks, type = "multiply") {
        if (type === "multiply") {
            // 乘法: 2x * 2x = 4x
            return Math.pow(value, stacks);
        } else {
            // 复利: 1.5x * 1.5x = 2.25x
            return Math.pow(1 + value, stacks) - 1;
        }
    },

    // 阶梯叠加: 特定数量质变
    step(value, stacks, thresholds = [1, 3, 5]) {
        // 根据堆叠数返回不同阶段
        if (stacks >= thresholds[2]) return value * 3; // 5个: 3倍效果
        if (stacks >= thresholds[1]) return value * 2; // 3个: 2倍效果
        if (stacks >= thresholds[0]) return value;     // 1个: 基础效果
        return 0;
    }
};

// ==================== 道具管理器 ====================
class ItemManager {
    constructor(player) {
        this.player = player;
        // 玩家持有的道具: { itemId: count }
        this.ownedItems = {};
        // 缓存计算后的属性
        this.cachedStats = {};
        this.needsRecalculation = true;
    }

    // 获得道具
    acquireItem(itemId) {
        const item = ITEMS_DATABASE[itemId];
        if (!item) {
            console.warn(`道具ID ${itemId} 不存在`);
            return false;
        }

        const currentCount = this.ownedItems[itemId] || 0;
        
        // 检查最大堆叠
        if (item.maxStacks && currentCount >= item.maxStacks) {
            console.log(`${item.name} 已达到最大堆叠数 ${item.maxStacks}`);
            return false;
        }

        this.ownedItems[itemId] = currentCount + 1;
        this.needsRecalculation = true;

        // 触发获得效果
        this.onItemAcquired(item);
        
        return true;
    }

    // 失去道具（用于诅咒道具等）
    removeItem(itemId, count = 1) {
        if (!this.ownedItems[itemId]) return false;
        
        this.ownedItems[itemId] -= count;
        if (this.ownedItems[itemId] <= 0) {
            delete this.ownedItems[itemId];
        }
        
        this.needsRecalculation = true;
        return true;
    }

    // 获得道具时的即时效果
    onItemAcquired(item) {
        // 播放音效
        this.playAcquireSound(item.rarity);
        
        // 显示获得提示
        this.showAcquireEffect(item);
        
        // 特殊即时效果
        switch (item.effect) {
            case "maxHealth":
                this.player.maxHealth += item.value;
                this.player.health += item.value;
                break;
            case "weaponSlot":
                this.player.maxWeaponSlots += item.value;
                break;
            case "flight":
                this.player.canFly = true;
                break;
            case "wallPhasing":
                this.player.canPhaseWall = true;
                break;
            // 其他即时效果...
        }
    }

    // 播放获得音效（根据稀有度）
    playAcquireSound(rarity) {
        const sounds = {
            common: "item_common.mp3",
            rare: "item_rare.mp3",
            epic: "item_epic.mp3",
            legendary: "item_legendary.mp3",
            cursed: "item_cursed.mp3"
        };
        // Audio.play(sounds[rarity]);
    }

    // 显示获得效果
    showAcquireEffect(item) {
        // 创建浮动文字
        const colors = {
            common: "#ffffff",
            rare: "#4488ff",
            epic: "#aa44ff",
            legendary: "#ffcc00",
            cursed: "#ff4444"
        };
        
        // GameUI.showFloatingText(
        //     this.player.x, this.player.y - 30,
        //     `${item.icon} ${item.name}`,
        //     colors[item.rarity]
        // );
    }

    // 重新计算所有属性
    recalculateStats() {
        if (!this.needsRecalculation) return this.cachedStats;

        const stats = {
            // 武器增强
            projectileCount: 0,
            projectileSize: 1,
            fireRate: 1,
            pierceCount: 0,
            homingAngle: 0,
            bounceCount: 0,
            splitCount: 0,
            critChance: 0,
            poisonDuration: 0,
            burnDuration: 0,
            freezeChance: 0,
            chainCount: 0,
            explosionRadius: 0,
            blackHolePull: 0,
            slowChance: 0,
            undeadMultiplier: 1,
            lifeSteal: 0,
            projectileSpeed: 1,
            returnCount: 0,
            shotgunCount: 0,
            laserMode: false,
            autoAimAngle: 0,
            burstCount: 0,
            weaponLevel: 0,

            // 防御生存
            damageReduction: 0,
            regenRate: 1,
            shieldLayer: 0,
            dodgeChance: 0,
            thornDamage: 0,
            killHeal: 0,
            reviveCount: 0,
            invincibleInterval: 8,
            damageToExp: 0,
            healthDefense: 0,
            emergencyHeal: 0,
            ghostDuration: 0,
            deathPrevent: 0,
            minionShareDamage: 0,
            idleRegen: 0,
            goldShield: false,
            rewindTime: 0,
            hitInvincible: 0,
            lifeDrain: 0,
            defenseStance: 0,
            painToPower: 0,
            phoenixRevive: 0,
            autoDodge: 5,

            // 移动探索
            moveSpeed: 1,
            canFly: false,
            canPhaseWall: false,
            dashCooldown: 3,
            magnetRange: 100,
            viewRange: 1,
            enemyRadar: false,
            teleportCooldown: 5,
            waterWalk: false,
            invisibilityTime: 3,
            extraJump: 0,
            iceTrail: 0,
            hookRange: 100,
            timeScale: 1,
            phaseThrough: false,
            fullMap: false,
            quickTeleport: false,
            wallWalk: false,
            timeStopDuration: 2,
            teleportCost: 5,

            // 资源经济
            goldGain: 1,
            shopDiscount: 0,
            goldBonus: 0,
            goldToDamage: 0,
            roomClearGold: 0,
            dropRate: 1,
            keyEfficiency: 1,
            bombCapacity: 5,
            shopExtraItem: 0,
            shopDuplicate: false,
            waveStartGold: 0,
            overdraftLimit: 0,
            gambleChance: 0,
            autoCollectSpeed: 1,
            goldCap: 999,

            // 召唤随从
            fairyCount: 0,
            orbiterCount: 0,
            skeletonChance: 0,
            droneCount: 0,
            shadowCount: 0,
            beeCount: 0,
            dragonCount: 0,
            mirrorCount: 0,
            undeadWaveCount: 0,
            angelChance: 0,

            // 特殊/诅咒
            berserkMode: false,
            sacrifice: false,
            chaosDice: 0,
            dualLife: false,
            cheatMode: false
        };

        // 遍历所有持有的道具并计算
        for (const [itemId, count] of Object.entries(this.ownedItems)) {
            const item = ITEMS_DATABASE[itemId];
            if (!item) continue;

            this.applyItemEffect(stats, item, count);
        }

        this.cachedStats = stats;
        this.needsRecalculation = false;
        return stats;
    }

    // 应用单个道具效果
    applyItemEffect(stats, item, count) {
        const { effect, value, stackType } = item;
        let finalValue;

        switch (stackType) {
            case "linear":
                finalValue = StackCalculator.linear(value, count);
                break;
            case "hyperbolic":
                finalValue = StackCalculator.hyperbolic(value, count);
                break;
            case "exponential":
                finalValue = StackCalculator.exponential(value, count);
                break;
            case "step":
                finalValue = StackCalculator.step(value, count);
                break;
            default:
                finalValue = value * count;
        }

        // 根据效果类型应用
        switch (effect) {
            // 乘法类效果 (基础值1)
            case "projectileSize":
            case "fireRate":
            case "projectileSpeed":
            case "moveSpeed":
            case "regenRate":
            case "magnetRange":
            case "viewRange":
            case "timeScale":
            case "goldGain":
            case "dropRate":
            case "autoCollectSpeed":
                // 这些效果是多plicative的
                if (stackType === "hyperbolic") {
                    stats[effect] *= (1 - finalValue); // 减速/减CD类
                } else {
                    stats[effect] += finalValue;
                }
                break;

            // 布尔/开关类效果
            case "flight":
            case "wallPhasing":
            case "waterWalk":
            case "phaseThrough":
            case "enemyRadar":
            case "fullMap":
            case "quickTeleport":
            case "wallWalk":
            case "shopDuplicate":
            case "goldShield":
            case "berserkMode":
            case "sacrifice":
            case "dualLife":
            case "cheatMode":
            case "laserMode":
                stats[effect] = finalValue > 0;
                break;

            // 加法类效果
            default:
                if (stats[effect] !== undefined) {
                    if (typeof stats[effect] === "number") {
                        stats[effect] += finalValue;
                    } else {
                        stats[effect] = finalValue;
                    }
                }
        }
    }

    // 获取特定效果的当前值
    getEffectValue(effectName) {
        const stats = this.recalculateStats();
        return stats[effectName] || 0;
    }

    // 检查是否拥有某个道具
    hasItem(itemId) {
        return (this.ownedItems[itemId] || 0) > 0;
    }

    // 获取道具数量
    getItemCount(itemId) {
        return this.ownedItems[itemId] || 0;
    }

    // 获取所有持有的道具列表
    getOwnedItemsList() {
        return Object.entries(this.ownedItems).map(([id, count]) => ({
            ...ITEMS_DATABASE[id],
            count
        }));
    }

    // 从道具池随机获取道具（用于房间奖励）
    getRandomItemsFromPool(count, poolType = "any", excludeOwned = true) {
        let pool = Object.values(ITEMS_DATABASE);

        // 根据类型筛选
        if (poolType !== "any") {
            const rarityWeights = {
                common: pool.filter(i => i.rarity === "common"),
                rare: pool.filter(i => i.rarity === "rare"),
                epic: pool.filter(i => i.rarity === "epic"),
                legendary: pool.filter(i => i.rarity === "legendary"),
                cursed: pool.filter(i => i.rarity === "cursed")
            };
            
            switch (poolType) {
                case "normal": // 普通房间
                    pool = [...rarityWeights.common, ...rarityWeights.rare];
                    break;
                case "treasure": // 宝箱房
                    pool = [...rarityWeights.rare, ...rarityWeights.epic];
                    break;
                case "boss": // Boss房
                    pool = [...rarityWeights.epic, ...rarityWeights.legendary];
                    break;
                case "secret": // 隐藏房
                    pool = [...rarityWeights.legendary, ...rarityWeights.cursed];
                    break;
            }
        }

        // 排除已满堆叠的道具
        if (excludeOwned) {
            pool = pool.filter(item => {
                const owned = this.ownedItems[item.id] || 0;
                return owned < (item.maxStacks || 999);
            });
        }

        // 随机选择
        const results = [];
        const poolCopy = [...pool];
        
        for (let i = 0; i < count && poolCopy.length > 0; i++) {
            const index = Math.floor(Math.random() * poolCopy.length);
            results.push(poolCopy.splice(index, 1)[0]);
        }

        return results;
    }

    // 序列化（用于存档）
    serialize() {
        return this.ownedItems;
    }

    // 反序列化（用于读档）
    deserialize(data) {
        this.ownedItems = data || {};
        this.needsRecalculation = true;
    }
}

// ==================== 导出 ====================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ITEMS_DATABASE, StackCalculator, ItemManager };
}
