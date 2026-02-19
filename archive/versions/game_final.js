/**
 * 肉鸽牛牛 - 核心引擎
 * 实体系统、碰撞检测、相机、粒�?
 */

// ==================== 向量工具 ====================
class Vec2 {
    constructor(x = 0, y = 0) { this.x = x; this.y = y; }
    add(v) { return new Vec2(this.x + v.x, this.y + v.y); }
    sub(v) { return new Vec2(this.x - v.x, this.y - v.y); }
    mul(s) { return new Vec2(this.x * s, this.y * s); }
    length() { return Math.sqrt(this.x * this.x + this.y * this.y); }
    normalize() {
        const len = this.length();
        return len > 0 ? new Vec2(this.x / len, this.y / len) : new Vec2(0, 0);
    }
    distance(v) { return this.sub(v).length(); }
    static fromAngle(angle) { return new Vec2(Math.cos(angle), Math.sin(angle)); }
}

// ==================== 实体基类 ====================
class Entity {
    constructor(x, y, width, height) {
        this.pos = new Vec2(x, y);
        this.vel = new Vec2(0, 0);
        this.width = width;
        this.height = height;
        this.rotation = 0;
        this.alive = true;
        this.z = 0; // 渲染层级
    }

    get x() { return this.pos.x; }
    get y() { return this.pos.y; }
    set x(v) { this.pos.x = v; }
    set y(v) { this.pos.y = v; }

    get bounds() {
        return {
            left: this.x - this.width / 2,
            right: this.x + this.width / 2,
            top: this.y - this.height / 2,
            bottom: this.y + this.height / 2
        };
    }

    update(dt) {
        this.pos = this.pos.add(this.vel.mul(dt));
    }

    draw(ctx) {
        // 子类实现
    }

    collidesWith(other) {
        const a = this.bounds;
        const b = other.bounds;
        return a.left < b.right && a.right > b.left &&
               a.top < b.bottom && a.bottom > b.top;
    }

    distanceTo(other) {
        return this.pos.distance(other.pos);
    }

    destroy() {
        this.alive = false;
    }
}

// ==================== 相机系统 ====================
class Camera {
    constructor(width, height) {
        this.pos = new Vec2(0, 0);
        this.width = width;
        this.height = height;
        this.shakeAmount = 0;
        this.shakeDecay = 0.9;
    }

    follow(target, smoothing = 0.1) {
        const targetX = target.x - this.width / 2;
        const targetY = target.y - this.height / 2;
        
        this.pos.x += (targetX - this.pos.x) * smoothing;
        this.pos.y += (targetY - this.pos.y) * smoothing;

        // 震动衰减
        if (this.shakeAmount > 0.1) {
            this.pos.x += (Math.random() - 0.5) * this.shakeAmount;
            this.pos.y += (Math.random() - 0.5) * this.shakeAmount;
            this.shakeAmount *= this.shakeDecay;
        } else {
            this.shakeAmount = 0;
        }
    }

    shake(amount) {
        this.shakeAmount = Math.max(this.shakeAmount, amount);
    }

    apply(ctx) {
        ctx.translate(-this.pos.x, -this.pos.y);
    }

    reset(ctx) {
        ctx.translate(this.pos.x, this.pos.y);
    }

    toWorld(screenX, screenY) {
        return new Vec2(screenX + this.pos.x, screenY + this.pos.y);
    }

    toScreen(worldX, worldY) {
        return new Vec2(worldX - this.pos.x, worldY - this.pos.y);
    }
}

// ==================== 碰撞检测管理器 ====================
class CollisionManager {
    constructor() {
        this.entities = new Set();
    }

    add(entity) {
        this.entities.add(entity);
    }

    remove(entity) {
        this.entities.delete(entity);
    }

    checkCollisions(groupA, groupB, callback) {
        for (const a of groupA) {
            for (const b of groupB) {
                if (a.alive && b.alive && a.collidesWith(b)) {
                    callback(a, b);
                }
            }
        }
    }

    checkRadius(source, targets, radius, callback) {
        for (const target of targets) {
            if (target.alive && source.distanceTo(target) <= radius) {
                callback(source, target);
            }
        }
    }
}

// ==================== 游戏时间管理�?====================
class GameTime {
    constructor() {
        this.now = 0;
        this.delta = 0;
        this.scale = 1.0;
        this.slowMotion = 1.0;
    }

    update(timestamp) {
        const dt = (timestamp - this.now) / 1000;
        this.now = timestamp;
        this.delta = Math.min(dt, 0.1) * this.scale * this.slowMotion;
        return this.delta;
    }

    setTimeScale(scale, duration = 0) {
        this.scale = scale;
        if (duration > 0) {
            setTimeout(() => { this.scale = 1.0; }, duration * 1000);
        }
    }

    setSlowMotion(factor, duration = 0) {
        this.slowMotion = factor;
        if (duration > 0) {
            setTimeout(() => { this.slowMotion = 1.0; }, duration * 1000);
        }
    }
}

// ==================== 导出 ====================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Vec2, Entity, Camera, Particle, ParticleSystem, CollisionManager, GameTime };
}


/**
 * 肉鸽牛牛 - 道具系统核心
 * 100个道具的完整实现
 * 
 * 设计原则�?
 * 1. Everything stacks with everything
 * 2. 4种叠加类型：linear(线�?, hyperbolic(双曲�?, exponential(指数), step(阶梯)
 * 3. 5种稀有度：common(�?, rare(�?, epic(�?, legendary(�?, cursed(�?
 */

// ==================== 道具数据�?====================
const ITEMS_DATABASE = {
    // ========== 武器增强�?(1-25) ==========
    1: {
        id: 1, name: "多重射击", icon: "🎯", rarity: "common",
        effect: "projectileCount", value: 1, stackType: "linear",
        description: "所有武器发射物数量+1", maxStacks: 10
    },
    2: {
        id: 2, name: "巨大�?, icon: "📏", rarity: "common",
        effect: "projectileSize", value: 0.5, stackType: "linear",
        description: "所有武器尺�?50%", maxStacks: 8
    },
    3: {
        id: 3, name: "快速射�?, icon: "�?, rarity: "common",
        effect: "fireRate", value: -0.15, stackType: "hyperbolic",
        description: "武器发射间隔-15%", maxStacks: 10
    },
    4: {
        id: 4, name: "穿甲�?, icon: "🔩", rarity: "rare",
        effect: "pierceCount", value: 1, stackType: "linear",
        description: "子弹可穿�?个敌�?, maxStacks: 5
    },
    5: {
        id: 5, name: "追踪瞄准", icon: "🧲", rarity: "rare",
        effect: "homingAngle", value: 15, stackType: "linear",
        description: "子弹小幅追踪敌人", maxStacks: 5
    },
    6: {
        id: 6, name: "弹跳子弹", icon: "🎾", rarity: "rare",
        effect: "bounceCount", value: 2, stackType: "linear",
        description: "子弹可在墙壁弹跳2�?, maxStacks: 4
    },
    7: {
        id: 7, name: "分裂�?, icon: "💥", rarity: "rare",
        effect: "splitCount", value: 3, stackType: "step",
        description: "击中时分裂成3个小子弹", maxStacks: 3
    },
    8: {
        id: 8, name: "暴击镜片", icon: "🔍", rarity: "rare",
        effect: "critChance", value: 0.20, stackType: "hyperbolic",
        description: "20%几率暴击(2倍伤�?", maxStacks: 8
    },
    9: {
        id: 9, name: "毒素涂层", icon: "🧪", rarity: "rare",
        effect: "poisonDuration", value: 3, stackType: "linear",
        description: "子弹使敌人中�?3�?", maxStacks: 5
    },
    10: {
        id: 10, name: "火焰附魔", icon: "🔥", rarity: "rare",
        effect: "burnDuration", value: 2, stackType: "linear",
        description: "子弹使敌人燃�?2�?", maxStacks: 5
    },
    11: {
        id: 11, name: "冰冻核心", icon: "❄️", rarity: "epic",
        effect: "freezeChance", value: 0.25, stackType: "hyperbolic",
        description: "子弹25%几率冰冻敌人1�?, maxStacks: 5
    },
    12: {
        id: 12, name: "闪电�?, icon: "�?, rarity: "epic",
        effect: "chainCount", value: 2, stackType: "linear",
        description: "击中时连锁到附近2个敌�?, maxStacks: 5
    },
    13: {
        id: 13, name: "爆炸弹头", icon: "💣", rarity: "epic",
        effect: "explosionRadius", value: 0.30, stackType: "linear",
        description: "子弹击中时小范围爆炸", maxStacks: 5
    },
    14: {
        id: 14, name: "黑洞发生�?, icon: "🌑", rarity: "epic",
        effect: "blackHolePull", value: 0.30, stackType: "linear",
        description: "子弹吸引周围敌人", maxStacks: 4
    },
    15: {
        id: 15, name: "时间缓慢", icon: "⏱️", rarity: "epic",
        effect: "slowChance", value: 0.20, stackType: "hyperbolic",
        description: "子弹�?0%几率使敌人减�?, maxStacks: 5
    },
    16: {
        id: 16, name: "神圣之光", icon: "�?, rarity: "epic",
        effect: "undeadMultiplier", value: 3, stackType: "step",
        description: "子弹对亡灵造成3倍伤�?, maxStacks: 2
    },
    17: {
        id: 17, name: "生命偷取", icon: "🧛", rarity: "epic",
        effect: "lifeSteal", value: 0.10, stackType: "linear",
        description: "造成伤害�?0%转为生命", maxStacks: 5
    },
    18: {
        id: 18, name: "弹射起步", icon: "🚀", rarity: "rare",
        effect: "projectileSpeed", value: 0.50, stackType: "linear",
        description: "子弹速度+50%，伤�?20%", maxStacks: 5
    },
    19: {
        id: 19, name: "回旋�?, icon: "🪃", rarity: "rare",
        effect: "returnCount", value: 1, stackType: "linear",
        description: "子弹会返回并造成二次伤害", maxStacks: 3
    },
    20: {
        id: 20, name: "霰弹扩散", icon: "🎆", rarity: "rare",
        effect: "shotgunCount", value: 3, stackType: "linear",
        description: "单发武器变成3发散�?, maxStacks: 4
    },
    21: {
        id: 21, name: "激光聚�?, icon: "🔦", rarity: "epic",
        effect: "laserMode", value: 1, stackType: "step",
        description: "武器变成直线穿透激�?, maxStacks: 1
    },
    22: {
        id: 22, name: "自动瞄准", icon: "🤖", rarity: "epic",
        effect: "autoAimAngle", value: 30, stackType: "linear",
        description: "武器自动锁定最近敌�?, maxStacks: 3
    },
    23: {
        id: 23, name: "连发射击", icon: "🔫", rarity: "epic",
        effect: "burstCount", value: 1, stackType: "linear",
        description: "每次发射额外+1�?, maxStacks: 5
    },
    24: {
        id: 24, name: "终极进化", icon: "🦋", rarity: "legendary",
        effect: "weaponLevel", value: 1, stackType: "linear",
        description: "所有武器效�?1�?, maxStacks: 3
    },
    25: {
        id: 25, name: "武器大师", icon: "🏆", rarity: "legendary",
        effect: "weaponSlot", value: 1, stackType: "linear",
        description: "可以同时装备武器数量+1", maxStacks: 2
    },

    // ========== 防御生存�?(26-50) ==========
    26: {
        id: 26, name: "心之容器", icon: "❤️", rarity: "common",
        effect: "maxHealth", value: 2, stackType: "linear",
        description: "最大生命�?2", maxStacks: 10
    },
    27: {
        id: 27, name: "钢铁护甲", icon: "🛡�?, rarity: "common",
        effect: "damageReduction", value: 1, stackType: "linear",
        description: "受到伤害-1", maxStacks: 5
    },
    28: {
        id: 28, name: "快速回�?, icon: "🏥", rarity: "common",
        effect: "regenRate", value: 0.50, stackType: "linear",
        description: "生命回复速度+50%", maxStacks: 5
    },
    29: {
        id: 29, name: "护盾发生�?, icon: "🔰", rarity: "rare",
        effect: "shieldLayer", value: 1, stackType: "linear",
        description: "获得1点护�?抵消一次伤�?", maxStacks: 3
    },
    30: {
        id: 30, name: "闪避�?, icon: "👢", rarity: "rare",
        effect: "dodgeChance", value: 0.15, stackType: "hyperbolic",
        description: "15%几率闪避攻击", maxStacks: 8
    },
    31: {
        id: 31, name: "荆棘护甲", icon: "🌵", rarity: "rare",
        effect: "thornDamage", value: 0.50, stackType: "linear",
        description: "受到伤害时反�?0%伤害", maxStacks: 5
    },
    32: {
        id: 32, name: "吸血獠牙", icon: "🦷", rarity: "rare",
        effect: "killHeal", value: 1, stackType: "linear",
        description: "击杀敌人回复1生命", maxStacks: 5
    },
    33: {
        id: 33, name: "不朽护符", icon: "📿", rarity: "epic",
        effect: "reviveCount", value: 1, stackType: "linear",
        description: "死亡时复活一�?50%生命)", maxStacks: 3
    },
    34: {
        id: 34, name: "神圣护盾", icon: "�?, rarity: "epic",
        effect: "invincibleInterval", value: -1, stackType: "linear",
        description: "每隔8秒获�?秒无�?, maxStacks: 5
    },
    35: {
        id: 35, name: "伤害转化", icon: "🔄", rarity: "epic",
        effect: "damageToExp", value: 0.30, stackType: "linear",
        description: "受到伤害�?0%转化为经�?, maxStacks: 5
    },
    36: {
        id: 36, name: "生命护盾", icon: "🩸", rarity: "rare",
        effect: "healthDefense", value: 5, stackType: "step",
        description: "当前生命值越高，防御越高(最�?5)", maxStacks: 2
    },
    37: {
        id: 37, name: "应急包", icon: "🎒", rarity: "rare",
        effect: "emergencyHeal", value: 0.30, stackType: "step",
        description: "生命低于20%时瞬间回�?0%", maxStacks: 3
    },
    38: {
        id: 38, name: "幽灵形�?, icon: "👻", rarity: "rare",
        effect: "ghostDuration", value: 3, stackType: "linear",
        description: "受伤�?秒内可穿过敌�?, maxStacks: 3
    },
    39: {
        id: 39, name: "最后屏�?, icon: "🏰", rarity: "epic",
        effect: "deathPrevent", value: 1, stackType: "linear",
        description: "生命不会低于1�?每场战斗一�?", maxStacks: 3
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
        description: "受到伤害时优先扣除金�?1金币=1伤害)", maxStacks: 1
    },
    43: {
        id: 43, name: "时间回溯", icon: "⏮️", rarity: "epic",
        effect: "rewindTime", value: 3, stackType: "linear",
        description: "受到伤害�?秒内可回溯位�?, maxStacks: 2
    },
    44: {
        id: 44, name: "钢铁意志", icon: "🗿", rarity: "epic",
        effect: "hitInvincible", value: 2, stackType: "linear",
        description: "受伤�?秒内无敌", maxStacks: 3
    },
    45: {
        id: 45, name: "生命虹吸", icon: "🌈", rarity: "epic",
        effect: "lifeDrain", value: 1, stackType: "linear",
        description: "周围敌人每秒损失1生命，你获得等量治疗", maxStacks: 5
    },
    46: {
        id: 46, name: "第二心脏", icon: "💓", rarity: "epic",
        effect: "doubleHealth", value: 1, stackType: "step",
        description: "生命值上限翻倍，但初始只�?0%", maxStacks: 1
    },
    47: {
        id: 47, name: "防御姿�?, icon: "🧘", rarity: "rare",
        effect: "defenseStance", value: 3, stackType: "linear",
        description: "不移动时防御+3", maxStacks: 3
    },
    48: {
        id: 48, name: "痛苦转化", icon: "😣", rarity: "rare",
        effect: "painToPower", value: 1.00, stackType: "linear",
        description: "受到伤害后下次攻击伤�?100%", maxStacks: 3
    },
    49: {
        id: 49, name: "凤凰之羽", icon: "🪶", rarity: "legendary",
        effect: "phoenixRevive", value: 1, stackType: "linear",
        description: "死亡后满血复活，但清空所有金�?, maxStacks: 2
    },
    50: {
        id: 50, name: "绝对防御", icon: "🛐", rarity: "legendary",
        effect: "autoDodge", value: -1, stackType: "linear",
        description: "每第5次攻击自动闪�?, maxStacks: 3
    },

    // ========== 移动探索�?(51-70) ==========
    51: {
        id: 51, name: "加速靴", icon: "👟", rarity: "common",
        effect: "moveSpeed", value: 0.20, stackType: "linear",
        description: "移动速度+20%", maxStacks: 5
    },
    52: {
        id: 52, name: "飞行翅膀", icon: "🦅", rarity: "rare",
        effect: "flight", value: 1, stackType: "step",
        description: "可以飞行(无视障碍�?", maxStacks: 1
    },
    53: {
        id: 53, name: "穿墙�?, icon: "🚪", rarity: "rare",
        effect: "wallPhasing", value: 1, stackType: "step",
        description: "可以穿过墙壁", maxStacks: 1
    },
    54: {
        id: 54, name: "冲刺�?, icon: "💨", rarity: "rare",
        effect: "dashCooldown", value: -0.50, stackType: "linear",
        description: "双击方向键冲�?3秒CD)", maxStacks: 4
    },
    55: {
        id: 55, name: "磁铁", icon: "🧲", rarity: "common",
        effect: "magnetRange", value: 0.30, stackType: "linear",
        description: "自动吸取范围内金币和经验", maxStacks: 5
    },
    56: {
        id: 56, name: "扩展视野", icon: "👁�?, rarity: "common",
        effect: "viewRange", value: 0.30, stackType: "linear",
        description: "视野范围+30%", maxStacks: 4
    },
    57: {
        id: 57, name: "地图雷达", icon: "📡", rarity: "rare",
        effect: "enemyRadar", value: 1, stackType: "step",
        description: "显示当前房间所有敌人位�?, maxStacks: 1
    },
    58: {
        id: 58, name: "瞬移腰带", icon: "🌀", rarity: "epic",
        effect: "teleportCooldown", value: -1, stackType: "linear",
        description: "按空格短距离瞬移(5秒CD)", maxStacks: 4
    },
    59: {
        id: 59, name: "水上行走", icon: "🌊", rarity: "rare",
        effect: "waterWalk", value: 1, stackType: "step",
        description: "可以在水/毒液上行�?, maxStacks: 1
    },
    60: {
        id: 60, name: "隐身�?, icon: "🥷", rarity: "rare",
        effect: "invisibilityTime", value: -1, stackType: "linear",
        description: "静止3秒后隐身(敌人不攻�?", maxStacks: 3
    },
    61: {
        id: 61, name: "二段�?, icon: "🦘", rarity: "rare",
        effect: "extraJump", value: 1, stackType: "linear",
        description: "可以空中再跳一�?, maxStacks: 3
    },
    62: {
        id: 62, name: "滑行�?, icon: "⛸️", rarity: "rare",
        effect: "iceTrail", value: 2, stackType: "linear",
        description: "移动时留下冰道，敌人减�?, maxStacks: 3
    },
    63: {
        id: 63, name: "钩爪", icon: "🪝", rarity: "rare",
        effect: "hookRange", value: 0.30, stackType: "linear",
        description: "按空格发射钩爪拉到墙�?, maxStacks: 3
    },
    64: {
        id: 64, name: "时间加�?, icon: "�?, rarity: "epic",
        effect: "timeScale", value: 0.20, stackType: "linear",
        description: "自身时间流�?20%(移�?攻�?", maxStacks: 3
    },
    65: {
        id: 65, name: "相位移动", icon: "🌊", rarity: "epic",
        effect: "phaseThrough", value: 1, stackType: "step",
        description: "移动时无视敌人碰�?, maxStacks: 1
    },
    66: {
        id: 66, name: "全局定位", icon: "🗺�?, rarity: "rare",
        effect: "fullMap", value: 1, stackType: "step",
        description: "显示全地图房间布局", maxStacks: 1
    },
    67: {
        id: 67, name: "快速传�?, icon: "🚀", rarity: "epic",
        effect: "quickTeleport", value: 1, stackType: "step",
        description: "清理房间后可以立即传�?, maxStacks: 1
    },
    68: {
        id: 68, name: "重力�?, icon: "🌑", rarity: "epic",
        effect: "wallWalk", value: 1, stackType: "step",
        description: "可以走上墙壁和天花板", maxStacks: 1
    },
    69: {
        id: 69, name: "时间停止", icon: "⏸️", rarity: "legendary",
        effect: "timeStopDuration", value: 0.50, stackType: "linear",
        description: "�?0秒可以停止时�?�?, maxStacks: 3
    },
    70: {
        id: 70, name: "无限瞬移", icon: "🌌", rarity: "legendary",
        effect: "teleportCost", value: -1, stackType: "linear",
        description: "瞬移无CD，但需要消�?金币", maxStacks: 4
    },

    // ========== 资源经济�?(71-85) ==========
    71: {
        id: 71, name: "金币�?, icon: "💰", rarity: "common",
        effect: "goldGain", value: 0.50, stackType: "linear",
        description: "金币获取�?50%", maxStacks: 5
    },
    72: {
        id: 72, name: "商店折扣", icon: "🏷�?, rarity: "common",
        effect: "shopDiscount", value: -0.20, stackType: "hyperbolic",
        description: "商店价格-20%", maxStacks: 5
    },
    73: {
        id: 73, name: "贪婪之手", icon: "🖐�?, rarity: "rare",
        effect: "goldBonus", value: 0.50, stackType: "linear",
        description: "拾取金币时额外获�?0%", maxStacks: 5
    },
    74: {
        id: 74, name: "金蛋", icon: "🥚", rarity: "rare",
        effect: "goldToDamage", value: 100, stackType: "step",
        description: "每持�?00金币，伤�?1", maxStacks: 1
    },
    75: {
        id: 75, name: "投资计划", icon: "📈", rarity: "rare",
        effect: "roomClearGold", value: 10, stackType: "linear",
        description: "每清理一个房间获�?0金币", maxStacks: 5
    },
    76: {
        id: 76, name: "掉落加成", icon: "🎁", rarity: "rare",
        effect: "dropRate", value: 0.25, stackType: "hyperbolic",
        description: "敌人掉落�?25%", maxStacks: 5
    },
    77: {
        id: 77, name: "钥匙�?, icon: "🔑", rarity: "rare",
        effect: "keyEfficiency", value: 1, stackType: "linear",
        description: "每把钥匙可以打开2扇门", maxStacks: 3
    },
    78: {
        id: 78, name: "炸弹�?, icon: "💣", rarity: "common",
        effect: "bombCapacity", value: 5, stackType: "linear",
        description: "炸弹携带上限+5", maxStacks: 5
    },
    79: {
        id: 79, name: "幸运�?, icon: "🍀", rarity: "epic",
        effect: "shopExtraItem", value: 1, stackType: "linear",
        description: "商店刷新时出现额外商�?, maxStacks: 3
    },
    80: {
        id: 80, name: "复制�?, icon: "📠", rarity: "epic",
        effect: "shopDuplicate", value: 1, stackType: "step",
        description: "进入商店时复制一个随机道�?, maxStacks: 1
    },
    81: {
        id: 81, name: "摇钱�?, icon: "🌳", rarity: "epic",
        effect: "waveStartGold", value: 10, stackType: "linear",
        description: "每波开始时获得金币=波数×10", maxStacks: 3
    },
    82: {
        id: 82, name: "债务合约", icon: "📜", rarity: "cursed",
        effect: "overdraftLimit", value: 50, stackType: "linear",
        description: "可以透支购买(最�?50金币)", maxStacks: 3
    },
    83: {
        id: 83, name: "摇奖�?, icon: "🎰", rarity: "epic",
        effect: "gambleChance", value: 0.50, stackType: "linear",
        description: "消�?0金币�?0%获得道具", maxStacks: 3
    },
    84: {
        id: 84, name: "自动拾取", icon: "🤲", rarity: "rare",
        effect: "autoCollectSpeed", value: 0.50, stackType: "linear",
        description: "金币和经验自动飞向你", maxStacks: 3
    },
    85: {
        id: 85, name: "富可敌国", icon: "👑", rarity: "legendary",
        effect: "goldCap", value: 9999, stackType: "step",
        description: "金币上限9999，超过部分转为伤�?, maxStacks: 1
    },

    // ========== 召唤随从�?(86-95) ==========
    86: {
        id: 86, name: "小精�?, icon: "🧚", rarity: "rare",
        effect: "fairyCount", value: 1, stackType: "linear",
        description: "跟随射击，伤�?你的一�?, maxStacks: 3
    },
    87: {
        id: 87, name: "守护�?, icon: "🔮", rarity: "rare",
        effect: "orbiterCount", value: 1, stackType: "linear",
        description: "环绕保护，阻挡子弹，造成接触伤害", maxStacks: 4
    },
    88: {
        id: 88, name: "召唤骷髅", icon: "💀", rarity: "rare",
        effect: "skeletonChance", value: 0.20, stackType: "hyperbolic",
        description: "击杀�?0%几率召唤骷髅战士", maxStacks: 5
    },
    89: {
        id: 89, name: "无人�?, icon: "🛸", rarity: "rare",
        effect: "droneCount", value: 1, stackType: "linear",
        description: "自动攻击最近敌�?, maxStacks: 3
    },
    90: {
        id: 90, name: "影子分身", icon: "🎭", rarity: "epic",
        effect: "shadowCount", value: 1, stackType: "linear",
        description: "创建一个影子模仿你的动�?, maxStacks: 2
    },
    91: {
        id: 91, name: "蜂群", icon: "🐝", rarity: "rare",
        effect: "beeCount", value: 5, stackType: "linear",
        description: "5只蜜蜂自动攻击敌�?, maxStacks: 3
    },
    92: {
        id: 92, name: "宠物�?, icon: "🐉", rarity: "epic",
        effect: "dragonCount", value: 1, stackType: "linear",
        description: "喷火攻击，大范围伤害", maxStacks: 2
    },
    93: {
        id: 93, name: "镜像分身", icon: "🪞", rarity: "epic",
        effect: "mirrorCount", value: 2, stackType: "linear",
        description: "创建2个分身，有你�?0%伤害", maxStacks: 2
    },
    94: {
        id: 94, name: "亡灵军团", icon: "⚰️", rarity: "epic",
        effect: "undeadWaveCount", value: 3, stackType: "linear",
        description: "每波召唤3个骷髅，持续30�?, maxStacks: 3
    },
    95: {
        id: 95, name: "天使降临", icon: "👼", rarity: "legendary",
        effect: "angelChance", value: 0.50, stackType: "linear",
        description: "受伤�?0%几率召唤天使治疗", maxStacks: 3
    },

    // ========== 特殊机制/诅咒�?(96-100) ==========
    96: {
        id: 96, name: "狂暴模式", icon: "😈", rarity: "cursed",
        effect: "berserkMode", value: 1, stackType: "step",
        description: "伤害+50%，但无法控制自动射击", maxStacks: 1
    },
    97: {
        id: 97, name: "献祭之心", icon: "💔", rarity: "cursed",
        effect: "sacrifice", value: 1, stackType: "step",
        description: "每秒损失1生命，伤�?100%", maxStacks: 1
    },
    98: {
        id: 98, name: "混沌骰子", icon: "🎲", rarity: "cursed",
        effect: "chaosDice", value: 1, stackType: "linear",
        description: "每波随机获得一个道�?也可能负�?", maxStacks: 3
    },
    99: {
        id: 99, name: "双重人生", icon: "⚖️", rarity: "legendary",
        effect: "dualLife", value: 1, stackType: "step",
        description: "同时控制两个角色(共享生命)", maxStacks: 1
    },
    100: {
        id: 100, name: "通关秘籍", icon: "📖", rarity: "legendary",
        effect: "cheatMode", value: 1, stackType: "step",
        description: "所有属�?30%，但敌人数�?", maxStacks: 1
    }
};

// ==================== 叠加计算系统 ====================
const StackCalculator = {
    // 线性叠�? value * stacks
    linear(value, stacks) {
        return value * stacks;
    },

    // 双曲线叠�? 1 - 1/(1 + value * stacks) �?value * stacks / (1 + value * stacks)
    // 用于闪避、暴击等概率属性，防止达到100%
    hyperbolic(value, stacks, type = "probability") {
        if (type === "probability") {
            // 概率�? 15% + 15% 实际效果递减
            // 2�? 1 - (1-0.15)^2 = 27.75%
            // 5�? 1 - (1-0.15)^5 = 55.6%
            return 1 - Math.pow(1 - value, stacks);
        } else {
            // 收益递减�? 加速等
            // 2�? 0.15 + 0.15*0.7 = 25.5%
            return value * stacks / (1 + value * stacks * 0.3);
        }
    },

    // 指数叠加: value^stacks �?(1+value)^stacks
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
        // 根据堆叠数返回不同阶�?
        if (stacks >= thresholds[2]) return value * 3; // 5�? 3倍效�?
        if (stacks >= thresholds[1]) return value * 2; // 3�? 2倍效�?
        if (stacks >= thresholds[0]) return value;     // 1�? 基础效果
        return 0;
    }
};

// ==================== 道具管理�?====================
class ItemManager {
    constructor(player) {
        this.player = player;
        // 玩家持有的道�? { itemId: count }
        this.ownedItems = {};
        // 缓存计算后的属�?
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
        
        // 检查最大堆�?
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

    // 失去道具（用于诅咒道具等�?
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

    // 播放获得音效（根据稀有度�?
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

    // 重新计算所有属�?
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

        // 遍历所有持有的道具并计�?
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
            // 乘法类效�?(基础�?)
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
                // 这些效果是多plicative�?
                if (stackType === "hyperbolic") {
                    stats[effect] *= (1 - finalValue); // 减�?减CD�?
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

            // 加法类效�?
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

    // 获取特定效果的当前�?
    getEffectValue(effectName) {
        const stats = this.recalculateStats();
        return stats[effectName] || 0;
    }

    // 检查是否拥有某个道�?
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

        // 根据类型筛�?
        if (poolType !== "any") {
            const rarityWeights = {
                common: pool.filter(i => i.rarity === "common"),
                rare: pool.filter(i => i.rarity === "rare"),
                epic: pool.filter(i => i.rarity === "epic"),
                legendary: pool.filter(i => i.rarity === "legendary"),
                cursed: pool.filter(i => i.rarity === "cursed")
            };
            
            switch (poolType) {
                case "normal": // 普通房�?
                    pool = [...rarityWeights.common, ...rarityWeights.rare];
                    break;
                case "treasure": // 宝箱�?
                    pool = [...rarityWeights.rare, ...rarityWeights.epic];
                    break;
                case "boss": // Boss�?
                    pool = [...rarityWeights.epic, ...rarityWeights.legendary];
                    break;
                case "secret": // 隐藏�?
                    pool = [...rarityWeights.legendary, ...rarityWeights.cursed];
                    break;
            }
        }

        // 排除已满堆叠的道�?
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

    // 序列化（用于存档�?
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


/**
 * 肉鸽牛牛 - 道具视觉反馈系统
 * 道具获得效果、粒子特效、UI展示
 */

// ==================== 粒子效果 ====================
class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    // 创建获得道具时的粒子爆发
    createItemAcquireBurst(x, y, rarity) {
        const colors = {
            common: ["#ffffff", "#cccccc", "#999999"],
            rare: ["#4488ff", "#66aaff", "#88ccff"],
            epic: ["#aa44ff", "#cc66ff", "#ee88ff"],
            legendary: ["#ffcc00", "#ffdd44", "#ffee88"],
            cursed: ["#ff4444", "#ff6666", "#ff8888"]
        };

        const colorSet = colors[rarity] || colors.common;
        const count = rarity === "legendary" ? 50 : rarity === "epic" ? 30 : 20;

        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = 2 + Math.random() * 4;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                decay: 0.02 + Math.random() * 0.02,
                size: 3 + Math.random() * 5,
                color: colorSet[Math.floor(Math.random() * colorSet.length)],
                type: "burst"
            });
        }
    }

    // 创建持续的道具光环效�?
    createItemAura(x, y, itemId) {
        const rarityColors = {
            common: "rgba(255,255,255,0.3)",
            rare: "rgba(68,136,255,0.3)",
            epic: "rgba(170,68,255,0.3)",
            legendary: "rgba(255,204,0,0.3)",
            cursed: "rgba(255,68,68,0.3)"
        };

        // 每几帧产生一个环绕粒�?
        if (Math.random() < 0.3) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 20 + Math.random() * 10;
            
            this.particles.push({
                x: x + Math.cos(angle) * radius,
                y: y + Math.sin(angle) * radius,
                vx: -Math.sin(angle) * 2,
                vy: Math.cos(angle) * 2,
                life: 1.0,
                decay: 0.01,
                size: 2 + Math.random() * 3,
                color: rarityColors[ITEMS_DATABASE[itemId]?.rarity || "common"],
                type: "aura"
            });
        }
    }

    // 更新所有粒�?
    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;
            
            // 重力效果
            if (p.type === "burst") {
                p.vy += 0.1;
            }

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    // 绘制粒子
    draw(ctx) {
        ctx.save();
        
        for (const p of this.particles) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

// ==================== 道具获得提示 ====================
class ItemNotification {
    constructor() {
        this.notifications = [];
    }

    // 添加获得提示
    show(item, x, y) {
        const rarityColors = {
            common: "#ffffff",
            rare: "#4488ff",
            epic: "#aa44ff",
            legendary: "#ffcc00",
            cursed: "#ff4444"
        };

        const rarityGlow = {
            common: 10,
            rare: 15,
            epic: 20,
            legendary: 30,
            cursed: 25
        };

        this.notifications.push({
            item: item,
            x: x,
            y: y,
            startY: y,
            life: 2.0,
            maxLife: 2.0,
            color: rarityColors[item.rarity],
            glow: rarityGlow[item.rarity],
            scale: 0,
            targetScale: 1
        });
    }

    // 更新
    update(dt) {
        for (let i = this.notifications.length - 1; i >= 0; i--) {
            const n = this.notifications[i];
            
            n.life -= dt;
            
            // 上升动画
            n.y = n.startY - (n.maxLife - n.life) * 30;
            
            // 缩放动画
            if (n.scale < n.targetScale) {
                n.scale += dt * 5;
                if (n.scale > n.targetScale) n.scale = n.targetScale;
            }
            
            if (n.life <= 0) {
                this.notifications.splice(i, 1);
            }
        }
    }

    // 绘制
    draw(ctx) {
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        for (const n of this.notifications) {
            const alpha = Math.min(1, n.life);
            ctx.globalAlpha = alpha;

            // 发光效果
            ctx.shadowColor = n.color;
            ctx.shadowBlur = n.glow * n.scale;

            // 图标
            ctx.font = `bold ${32 * n.scale}px Arial`;
            ctx.fillText(n.item.icon, n.x, n.y - 20);

            // 名称
            ctx.font = `bold ${16 * n.scale}px Arial`;
            ctx.fillStyle = n.color;
            ctx.fillText(n.item.name, n.x, n.y + 15);

            // 描述（小字）
            if (n.scale >= 0.8) {
                ctx.font = `${12}px Arial`;
                ctx.fillStyle = "#cccccc";
                ctx.fillText(n.item.description, n.x, n.y + 35);
            }
        }

        ctx.restore();
    }
}

// ==================== 房间奖励选择界面 ====================
class ItemSelectionUI {
    constructor(itemManager) {
        this.itemManager = itemManager;
        this.visible = false;
        this.items = [];
        this.selectedIndex = -1;
        this.animationProgress = 0;
        this.callback = null;
    }

    // 显示选择界面
    show(items, onSelect) {
        this.items = items;
        this.visible = true;
        this.selectedIndex = -1;
        this.animationProgress = 0;
        this.callback = onSelect;
        
        // 播放打开音效
        // Audio.play("item_select_open.mp3");
    }

    // 隐藏
    hide() {
        this.visible = false;
        this.items = [];
    }

    // 更新动画
    update(dt) {
        if (!this.visible) return;

        if (this.animationProgress < 1) {
            this.animationProgress += dt * 3;
            if (this.animationProgress > 1) this.animationProgress = 1;
        }
    }

    // 处理输入
    handleInput(input) {
        if (!this.visible) return;

        const itemCount = this.items.length;

        // 鼠标/触摸选择
        if (input.mouse) {
            const centerX = input.canvasWidth / 2;
            const centerY = input.canvasHeight / 2;
            const itemWidth = 150;
            const spacing = 180;
            const totalWidth = (itemCount - 1) * spacing;
            const startX = centerX - totalWidth / 2;

            for (let i = 0; i < itemCount; i++) {
                const x = startX + i * spacing;
                const y = centerY;
                
                const dx = input.mouse.x - x;
                const dy = input.mouse.y - y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < itemWidth / 2) {
                    this.selectedIndex = i;
                    
                    if (input.mouse.clicked) {
                        this.selectItem(i);
                    }
                    break;
                }
            }
        }

        // 键盘选择
        if (input.keys) {
            if (input.keys.justPressed["ArrowLeft"]) {
                this.selectedIndex = Math.max(0, this.selectedIndex - 1);
            }
            if (input.keys.justPressed["ArrowRight"]) {
                this.selectedIndex = Math.min(itemCount - 1, this.selectedIndex + 1);
            }
            if (input.keys.justPressed["Enter"] || input.keys.justPressed[" "]) {
                if (this.selectedIndex >= 0) {
                    this.selectItem(this.selectedIndex);
                }
            }

            // 数字键快速选择
            for (let i = 0; i < itemCount; i++) {
                if (input.keys.justPressed[(i + 1).toString()]) {
                    this.selectItem(i);
                }
            }
        }
    }

    // 选择道具
    selectItem(index) {
        const item = this.items[index];
        if (!item) return;

        // 播放选择音效
        // Audio.play("item_select_confirm.mp3");

        // 应用道具
        this.itemManager.acquireItem(item.id);

        // 回调
        if (this.callback) {
            this.callback(item);
        }

        this.hide();
    }

    // 绘制
    draw(ctx, width, height) {
        if (!this.visible) return;

        const progress = this.easeOutBack(this.animationProgress);

        ctx.save();

        // 背景遮罩
        ctx.fillStyle = `rgba(0, 0, 0, ${0.8 * progress})`;
        ctx.fillRect(0, 0, width, height);

        // 标题
        ctx.textAlign = "center";
        ctx.font = "bold 32px Arial";
        ctx.fillStyle = `rgba(255, 255, 255, ${progress})`;
        ctx.fillText("选择一个道�?, width / 2, height / 2 - 180);

        // 绘制道具选项
        const itemCount = this.items.length;
        const itemWidth = 140;
        const itemHeight = 200;
        const spacing = 170;
        const totalWidth = (itemCount - 1) * spacing;
        const startX = width / 2 - totalWidth / 2;
        const centerY = height / 2;

        for (let i = 0; i < itemCount; i++) {
            const item = this.items[i];
            const x = startX + i * spacing;
            const y = centerY;
            const isSelected = i === this.selectedIndex;
            
            this.drawItemCard(ctx, item, x, y, itemWidth, itemHeight, progress, isSelected, i + 1);
        }

        // 操作提示
        ctx.font = "14px Arial";
        ctx.fillStyle = `rgba(200, 200, 200, ${progress})`;
        ctx.fillText("�?�?选择 | Enter/空格/点击 确认 | 数字�?1-4 快速选择", width / 2, height - 50);

        ctx.restore();
    }

    // 绘制单个道具卡片
    drawItemCard(ctx, item, x, y, w, h, progress, selected, number) {
        const rarityColors = {
            common: { main: "#888888", light: "#aaaaaa", dark: "#666666" },
            rare: { main: "#4488ff", light: "#66aaff", dark: "#2266dd" },
            epic: { main: "#aa44ff", light: "#cc66ff", dark: "#8822dd" },
            legendary: { main: "#ffcc00", light: "#ffdd44", dark: "#ddaa00" },
            cursed: { main: "#ff4444", light: "#ff6666", dark: "#dd2222" }
        };

        const color = rarityColors[item.rarity];
        const scale = selected ? 1.1 : 1.0;
        const finalW = w * progress * scale;
        const finalH = h * progress * scale;
        const finalX = x - finalW / 2;
        const finalY = y - finalH / 2;

        ctx.save();

        // 阴影
        if (selected) {
            ctx.shadowColor = color.main;
            ctx.shadowBlur = 30;
        }

        // 卡片背景
        ctx.fillStyle = "#1a1a2e";
        ctx.fillRect(finalX, finalY, finalW, finalH);

        // 边框
        ctx.strokeStyle = color.main;
        ctx.lineWidth = selected ? 4 : 2;
        ctx.strokeRect(finalX, finalY, finalW, finalH);

        // 内部装饰�?
        ctx.strokeStyle = color.dark;
        ctx.lineWidth = 1;
        ctx.strokeRect(finalX + 5, finalY + 5, finalW - 10, finalH - 10);

        // 数字标记
        ctx.font = "bold 16px Arial";
        ctx.fillStyle = color.light;
        ctx.textAlign = "left";
        ctx.fillText(`[${number}]`, finalX + 10, finalY + 25);

        // 稀有度标记
        ctx.font = "12px Arial";
        ctx.textAlign = "right";
        const rarityNames = {
            common: "普�?,
            rare: "稀�?,
            epic: "史诗",
            legendary: "传说",
            cursed: "诅咒"
        };
        ctx.fillText(rarityNames[item.rarity], finalX + finalW - 10, finalY + 25);

        // 图标
        ctx.textAlign = "center";
        ctx.font = `bold ${48 * progress}px Arial`;
        ctx.fillText(item.icon, x, finalY + 80);

        // 名称
        ctx.font = `bold ${16 * progress}px Arial`;
        ctx.fillStyle = color.light;
        ctx.fillText(item.name, x, finalY + 120);

        // 描述（自动换行）
        ctx.font = `${12 * progress}px Arial`;
        ctx.fillStyle = "#cccccc";
        this.wrapText(ctx, item.description, x, finalY + 150, finalW - 20, 16);

        // 已拥有数�?
        const owned = this.itemManager.getItemCount(item.id);
        if (owned > 0) {
            ctx.fillStyle = "#ffff00";
            ctx.font = "bold 14px Arial";
            ctx.fillText(`已拥�? ${owned}`, x, finalY + finalH - 15);
        }

        ctx.restore();
    }

    // 文字自动换行
    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text;
        let line = "";
        let testLine = "";
        let lineArray = [];

        // 简单处理：�?0个字符一行（中文�?
        for (let i = 0; i < words.length; i++) {
            testLine = line + words[i];
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && i > 0) {
                lineArray.push(line);
                line = words[i];
            } else {
                line = testLine;
            }
        }
        lineArray.push(line);

        // 绘制
        for (let i = 0; i < lineArray.length && i < 3; i++) {
            ctx.fillText(lineArray[i], x, y + i * lineHeight);
        }
    }

    // 缓动函数
    easeOutBack(t) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }
}

// ==================== 道具栏HUD ====================
class ItemHUD {
    constructor(itemManager) {
        this.itemManager = itemManager;
        this.slotSize = 40;
        this.spacing = 5;
    }

    // 绘制道具�?
    draw(ctx, x, y) {
        const items = this.itemManager.getOwnedItemsList();
        
        ctx.save();
        
        // 背景
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(x - 10, y - 10, this.slotSize * 8 + 20, this.slotSize + 20);

        // 绘制每个道具图标
        let drawX = x;
        for (const item of items.slice(0, 8)) { // 最多显�?�?
            this.drawItemIcon(ctx, item, drawX, y);
            drawX += this.slotSize + this.spacing;
        }

        // 如果还有更多，显�?�?
        if (items.length > 8) {
            ctx.fillStyle = "#888888";
            ctx.font = "bold 20px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(`+${items.length - 8}`, drawX + this.slotSize / 2, y + this.slotSize / 2);
        }

        ctx.restore();
    }

    // 绘制单个道具图标
    drawItemIcon(ctx, item, x, y) {
        const rarityBorders = {
            common: "#888888",
            rare: "#4488ff",
            epic: "#aa44ff",
            legendary: "#ffcc00",
            cursed: "#ff4444"
        };

        const size = this.slotSize;

        ctx.save();

        // 边框
        ctx.strokeStyle = rarityBorders[item.rarity];
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, size, size);

        // 背景
        ctx.fillStyle = "#1a1a2e";
        ctx.fillRect(x + 2, y + 2, size - 4, size - 4);

        // 图标
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(item.icon, x + size / 2, y + size / 2);

        // 堆叠数量
        if (item.count > 1) {
            ctx.fillStyle = "#ffff00";
            ctx.font = "bold 12px Arial";
            ctx.textAlign = "right";
            ctx.fillText(item.count.toString(), x + size - 3, y + 12);
        }

        ctx.restore();
    }
}

// ==================== 导出 ====================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ParticleSystem, ItemNotification, ItemSelectionUI, ItemHUD };
}


/**
 * 肉鸽牛牛 - 精灵管理系统
 * 加载和管理所有角�?敌人精灵
 */

// ==================== 精灵配置 ====================
const SPRITE_CONFIG = {
    // 主角
    player: {
        id: 'player_cow',
        name: '牛牛',
        src: 'assets/sprites/player_cow.png',
        width: 32,
        height: 32,
        animations: {
            idle: { frames: [0], speed: 0 },
            walk: { frames: [0], speed: 0.1 },
            fly: { frames: [0], speed: 0.05 }
        }
    },

    // 敌人配置 - 按难度分�?
    enemies: {
        // Tier 1: 弱小敌人 (血量低,速度�?
        tier1: [
            { id: 'chick', name: '感染小鸡', hp: 8, speed: 40, damage: 1, exp: 2 },
            { id: 'mouse', name: '感染老鼠', hp: 6, speed: 60, damage: 1, exp: 2 },
            { id: 'snail', name: '感染蜗牛', hp: 15, speed: 15, damage: 1, exp: 1 },
        ],
        // Tier 2: 普通敌�?
        tier2: [
            { id: 'rabbit', name: '感染兔子', hp: 15, speed: 50, damage: 2, exp: 3 },
            { id: 'rabbit2', name: '狂暴兔子', hp: 18, speed: 65, damage: 2, exp: 4 },
            { id: 'chick', name: '感染小鸡', hp: 10, speed: 45, damage: 1, exp: 2 },
            { id: 'bird', name: '感染小鸟', hp: 12, speed: 70, damage: 2, exp: 3 },
            { id: 'pigeon', name: '感染鸽子', hp: 14, speed: 55, damage: 2, exp: 3 },
        ],
        // Tier 3: 标准敌人
        tier3: [
            { id: 'cat', name: '感染猫咪', hp: 25, speed: 55, damage: 3, exp: 5 },
            { id: 'duck', name: '感染鸭子', hp: 22, speed: 45, damage: 3, exp: 4 },
            { id: 'duck2', name: '感染野鸭', hp: 25, speed: 50, damage: 3, exp: 5 },
            { id: 'duck3', name: '狂暴鸭子', hp: 28, speed: 55, damage: 4, exp: 6 },
            { id: 'squirrel', name: '感染松鼠', hp: 20, speed: 75, damage: 3, exp: 5 },
        ],
        // Tier 4: 较强敌人
        tier4: [
            { id: 'dog', name: '感染小狗', hp: 35, speed: 60, damage: 4, exp: 7 },
            { id: 'dog2', name: '狂暴�?, hp: 40, speed: 70, damage: 5, exp: 8 },
            { id: 'pig', name: '感染小猪', hp: 45, speed: 35, damage: 4, exp: 8 },
            { id: 'pig2', name: '狂暴�?, hp: 50, speed: 40, damage: 5, exp: 9 },
            { id: 'enemy_pig_original', name: '原始感染�?, hp: 40, speed: 38, damage: 4, exp: 7 },
            { id: 'sheep', name: '感染绵羊', hp: 38, speed: 40, damage: 4, exp: 6 },
        ],
        // Tier 5: 精英敌人
        tier5: [
            { id: 'goose', name: '感染�?, hp: 55, speed: 65, damage: 6, exp: 12 },
            { id: 'bear', name: '感染�?, hp: 70, speed: 35, damage: 8, exp: 15 },
            { id: 'snake', name: '感染�?, hp: 30, speed: 80, damage: 5, exp: 10 },
        ],
        // Tier 6: Boss�?
        tier6: [
            { id: 'crab', name: '感染螃蟹', hp: 100, speed: 25, damage: 10, exp: 25 },
            { id: 'turtle', name: '感染�?, hp: 120, speed: 20, damage: 8, exp: 20 },
        ]
    }
};

// ==================== 精灵管理�?====================
class SpriteManager {
    constructor() {
        this.sprites = new Map();
        this.loaded = false;
        this.loadQueue = [];
    }

    // 加载单个精灵
    loadSprite(id, src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.sprites.set(id, img);
                resolve(img);
            };
            img.onerror = () => {
                console.warn(`Failed to load sprite: ${src}`);
                reject(new Error(`Failed to load: ${src}`));
            };
            img.src = src;
        });
    }

    // 加载所有精�?
    async loadAll() {
        const promises = [];

        // 加载主角
        promises.push(
            this.loadSprite('player_cow', SPRITE_CONFIG.player.src)
                .catch(() => this.createFallbackSprite('player_cow', '🐮'))
        );

        // 加载所有敌人精�?
        const enemyIds = new Set();
        Object.values(SPRITE_CONFIG.enemies).forEach(tier => {
            tier.forEach(enemy => enemyIds.add(enemy.id));
        });

        enemyIds.forEach(id => {
            promises.push(
                this.loadSprite(id, `assets/sprites/${id}.png`)
                    .catch(() => this.createFallbackSprite(id, '👾'))
            );
        });

        await Promise.all(promises);
        this.loaded = true;
        console.log(`Loaded ${this.sprites.size} sprites`);
        return this.sprites;
    }

    // 创建备用精灵（当图片加载失败时使用Canvas绘制emoji�?
    createFallbackSprite(id, emoji) {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        ctx.font = '28px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, 16, 18);
        
        const img = new Image();
        img.src = canvas.toDataURL();
        this.sprites.set(id, img);
        return img;
    }

    // 获取精灵
    get(id) {
        return this.sprites.get(id);
    }

    // 绘制精灵
    draw(ctx, id, x, y, options = {}) {
        const sprite = this.sprites.get(id);
        if (!sprite) return;

        const { 
            width = 32, 
            height = 32, 
            flipX = false, 
            rotation = 0,
            alpha = 1,
            tint = null
        } = options;

        ctx.save();
        ctx.globalAlpha = alpha;

        if (rotation !== 0 || flipX) {
            ctx.translate(x + width / 2, y + height / 2);
            if (flipX) ctx.scale(-1, 1);
            if (rotation !== 0) ctx.rotate(rotation);
            ctx.drawImage(sprite, -width / 2, -height / 2, width, height);
        } else {
            ctx.drawImage(sprite, x, y, width, height);
        }

        // 染色效果（用于显示受伤等�?
        if (tint) {
            ctx.globalCompositeOperation = 'source-atop';
            ctx.fillStyle = tint;
            ctx.fillRect(x - width / 2, y - height / 2, width, height);
        }

        ctx.restore();
    }

    // 根据波数获取合适的敌人�?
    getEnemyPoolForWave(wave) {
        const pools = [];
        
        // 根据波数解锁更高等级的敌�?
        if (wave >= 1) pools.push(...SPRITE_CONFIG.enemies.tier1);
        if (wave >= 3) pools.push(...SPRITE_CONFIG.enemies.tier2);
        if (wave >= 5) pools.push(...SPRITE_CONFIG.enemies.tier3);
        if (wave >= 8) pools.push(...SPRITE_CONFIG.enemies.tier4);
        if (wave >= 12) pools.push(...SPRITE_CONFIG.enemies.tier5);
        if (wave >= 15) pools.push(...SPRITE_CONFIG.enemies.tier6);

        return pools;
    }

    // 生成随机敌人配置
    getRandomEnemy(wave) {
        const pool = this.getEnemyPoolForWave(wave);
        if (pool.length === 0) return SPRITE_CONFIG.enemies.tier1[0];
        
        // 波数越高，越容易出高级敌�?
        const weights = pool.map((e, i) => {
            const tier = Math.floor(i / 4) + 1;
            return Math.min(wave / 5, 1) * tier;
        });
        
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < pool.length; i++) {
            random -= weights[i];
            if (random <= 0) return pool[i];
        }
        
        return pool[pool.length - 1];
    }

    // 获取Boss配置
    getBossForWave(wave) {
        const bosses = SPRITE_CONFIG.enemies.tier6;
        return bosses[Math.min(Math.floor(wave / 5), bosses.length - 1)];
    }
}

// ==================== 动画系统 ====================
class SpriteAnimator {
    constructor() {
        this.animations = new Map();
    }

    // 添加动画
    add(id, frames, speed = 0.1) {
        this.animations.set(id, {
            frames: frames,
            speed: speed,
            currentFrame: 0,
            timer: 0
        });
    }

    // 更新动画
    update(dt) {
        for (const anim of this.animations.values()) {
            anim.timer += dt;
            if (anim.timer >= anim.speed) {
                anim.timer = 0;
                anim.currentFrame = (anim.currentFrame + 1) % anim.frames.length;
            }
        }
    }

    // 获取当前�?
    getCurrentFrame(id) {
        const anim = this.animations.get(id);
        return anim ? anim.frames[anim.currentFrame] : 0;
    }
}

// ==================== 导出 ====================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SpriteManager, SpriteAnimator, SPRITE_CONFIG };
}


/**
 * 肉鸽牛牛 - 武器系统
 * 8种基础武器 + 进化 + 道具影响
 */

// ==================== 子弹�?====================
class Bullet extends Entity {
    constructor(x, y, options = {}) {
        super(x, y, options.size || 8, options.size || 8);
        this.vel = new Vec2(
            Math.cos(options.angle) * options.speed,
            Math.sin(options.angle) * options.speed
        );
        this.damage = options.damage || 10;
        this.life = options.life || 3.0;
        this.pierce = options.pierce || 0;
        this.bounce = options.bounce || 0;
        this.homing = options.homing || false;
        this.homingRange = options.homingRange || 150;
        this.homingStrength = options.homingStrength || 2;
        this.split = options.split || 0;
        this.chain = options.chain || 0;
        this.explosion = options.explosion || 0;
        this.slow = options.slow || false;
        this.freeze = options.freeze || false;
        this.burn = options.burn || 0;
        this.poison = options.poison || 0;
        this.color = options.color || '#fff';
        this.trail = options.trail || false;
        this.returning = options.returning || false;
        this.owner = options.owner;
        this.hitEnemies = new Set();
        this.origPos = new Vec2(x, y);
        this.returnSpeed = 0;
    }

    update(dt, enemies) {
        // 追踪效果
        if (this.homing && enemies.length > 0) {
            let nearest = null;
            let nearestDist = this.homingRange;
            
            for (const enemy of enemies) {
                const dist = this.distanceTo(enemy);
                if (dist < nearestDist && !this.hitEnemies.has(enemy)) {
                    nearest = enemy;
                    nearestDist = dist;
                }
            }

            if (nearest) {
                const desired = nearest.pos.sub(this.pos).normalize();
                const current = this.vel.normalize();
                const angle = Math.atan2(desired.y, desired.x) - Math.atan2(current.y, current.x);
                const turn = Math.atan2(Math.sin(angle), Math.cos(angle)) * this.homingStrength * dt;
                const newAngle = Math.atan2(this.vel.y, this.vel.x) + turn;
                const speed = this.vel.length();
                this.vel = Vec2.fromAngle(newAngle).mul(speed);
            }
        }

        // 回旋效果
        if (this.returning) {
            const dist = this.pos.distance(this.origPos);
            const maxDist = 200;
            
            if (dist > maxDist || this.vel.length() < 50) {
                // 返回
                const returnDir = this.owner.pos.sub(this.pos).normalize();
                this.vel = returnDir.mul(300);
                
                // 检查是否回到玩�?
                if (this.distanceTo(this.owner) < 20) {
                    this.destroy();
                }
            }
        }

        super.update(dt);
        this.life -= dt;

        if (this.life <= 0) {
            if (this.explosion > 0) {
                // 爆炸由外部处�?
                this.shouldExplode = true;
            }
            this.destroy();
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.atan2(this.vel.y, this.vel.x));

        // 子弹主体
        ctx.fillStyle = this.color;
        if (this.explosion > 0) {
            ctx.beginPath();
            ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        }

        // 光效
        ctx.shadowBlur = 10;
        ctx.shadowColor = this.color;
        ctx.fillStyle = 'rgba(255,255,255,0.5)';
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    hit(enemy) {
        if (this.hitEnemies.has(enemy)) return false;
        this.hitEnemies.add(enemy);
        
        this.pierce--;
        if (this.pierce < 0) {
            if (this.bounce > 0) {
                this.bounce--;
                this.vel.x *= -1;
                this.hitEnemies.clear();
                return false; // 没真正击�?
            }
            
            if (this.split > 0) {
                this.shouldSplit = true;
            }
            
            this.destroy();
            return true;
        }
        
        return true;
    }
}

// ==================== 武器配置 ====================
const WEAPONS = {
    // 1. 鞭子 - 近战，范围广
    whip: {
        id: 'whip',
        name: '鞭子',
        icon: '🪄',
        description: '近战范围攻击',
        damage: 15,
        cooldown: 1.5,
        range: 80,
        arc: Math.PI * 0.8,
        color: '#ff6600',
        type: 'melee',
        evolution: {
            requires: ['hollowHeart'],
            result: 'bloodyTear',
            name: '血�?,
            bonus: { damage: 1.5, lifesteal: 0.1 }
        }
    },

    // 2. 魔杖 - 自动追踪
    wand: {
        id: 'wand',
        name: '魔杖',
        icon: '🔮',
        description: '自动追踪敌人',
        damage: 10,
        cooldown: 1.2,
        speed: 200,
        homing: true,
        color: '#4488ff',
        type: 'projectile',
        evolution: {
            requires: ['emptyTome'],
            result: 'holyWand',
            name: '神圣魔杖',
            bonus: { cooldown: 0.5, pierce: 3 }
        }
    },

    // 3. 飞刀 - 穿�?
    knife: {
        id: 'knife',
        name: '飞刀',
        icon: '🗡�?,
        description: '快速穿�?,
        damage: 8,
        cooldown: 0.8,
        speed: 350,
        pierce: 3,
        color: '#cccccc',
        type: 'projectile',
        evolution: {
            requires: ['bracer'],
            result: 'thousandEdge',
            name: '千刃',
            bonus: { pierce: 999, damage: 2 }
        }
    },

    // 4. 斧头 - 回旋
    axe: {
        id: 'axe',
        name: '斧头',
        icon: '🪓',
        description: '回旋攻击',
        damage: 20,
        cooldown: 2.0,
        speed: 180,
        returning: true,
        color: '#8b4513',
        type: 'projectile',
        evolution: {
            requires: ['candelabrador'],
            result: 'deathSpiral',
            name: '死亡螺旋',
            bonus: { projectileCount: 3 }
        }
    },

    // 5. 圣经 - 环绕
    bible: {
        id: 'bible',
        name: '圣经',
        icon: '📖',
        description: '环绕保护',
        damage: 12,
        cooldown: 3.0,
        orbitRadius: 60,
        orbitSpeed: 3,
        duration: 3,
        color: '#ffd700',
        type: 'orbit',
        evolution: {
            requires: ['spellbinder'],
            result: 'unholyVespers',
            name: '不洁晚祷',
            bonus: { duration: 2, orbitRadius: 1.5 }
        }
    },

    // 6. 火球 - 爆炸
    fireball: {
        id: 'fireball',
        name: '火球',
        icon: '🔥',
        description: '爆炸范围伤害',
        damage: 25,
        cooldown: 2.5,
        speed: 150,
        explosion: 60,
        color: '#ff4400',
        type: 'projectile',
        evolution: {
            requires: ['spinach'],
            result: 'hellfire',
            name: '地狱�?,
            bonus: { explosion: 2, damage: 1.5 }
        }
    },

    // 7. 闪电 - 连锁
    lightning: {
        id: 'lightning',
        name: '闪电',
        icon: '�?,
        description: '连锁攻击',
        damage: 15,
        cooldown: 2.0,
        chain: 4,
        chainRange: 120,
        color: '#ffff00',
        type: 'instant',
        evolution: {
            requires: ['duplicator'],
            result: 'thunderLoop',
            name: '雷霆循环',
            bonus: { chain: 3, cooldown: 0.7 }
        }
    },

    // 8. 圣水 - 区域
    holyWater: {
        id: 'holyWater',
        name: '圣水',
        icon: '💧',
        description: '地面持续伤害',
        damage: 8,
        cooldown: 3.0,
        duration: 4,
        radius: 50,
        color: '#00ffff',
        type: 'area',
        evolution: {
            requires: ['attractorb'],
            result: 'saracenWater',
            name: '撒拉逊之�?,
            bonus: { duration: 2, radius: 1.5 }
        }
    }
};

// ==================== 武器实例 ====================
class Weapon {
    constructor(weaponId, level = 1) {
        this.config = WEAPONS[weaponId];
        this.id = weaponId;
        this.level = level;
        this.cooldown = 0;
        this.orbitAngle = 0;
        this.isEvolved = false;
    }

    get damage() {
        let base = this.config.damage;
        // 等级加成
        base *= (1 + (this.level - 1) * 0.2);
        return base;
    }

    get cooldownTime() {
        return this.config.cooldown;
    }

    canEvolve(items) {
        if (this.isEvolved || !this.config.evolution) return false;
        return this.config.evolution.requires.every(item => items.hasItem(item));
    }

    evolve() {
        if (!this.canEvolve) return;
        this.isEvolved = true;
        this.level = Math.max(this.level, 8);
        console.log(`武器进化: ${this.config.name} �?${this.config.evolution.name}`);
    }

    update(dt) {
        if (this.cooldown > 0) this.cooldown -= dt;
        this.orbitAngle += (this.config.orbitSpeed || 0) * dt;
    }

    canFire() {
        return this.cooldown <= 0;
    }

    fire(source, target, itemStats) {
        this.cooldown = this.cooldownTime * itemStats.fireRate;
        
        const bullets = [];
        const count = itemStats.projectileCount;
        
        // 计算基础角度
        let baseAngle = 0;
        if (target) {
            baseAngle = Math.atan2(target.y - source.y, target.x - source.x);
        }

        for (let i = 0; i < count; i++) {
            let angle = baseAngle;
            
            // 散射
            if (count > 1) {
                const spread = Math.PI / 6; // 30度散�?
                angle += spread * (i - (count - 1) / 2) / (count - 1);
            }

            bullets.push(...this.createBullet(source, angle, itemStats));
        }

        return bullets;
    }

    createBullet(source, angle, itemStats) {
        const bullets = [];
        const cfg = this.config;

        switch (cfg.type) {
            case 'melee':
                // 近战武器创建扇形攻击区域
                bullets.push({
                    type: 'melee',
                    x: source.x,
                    y: source.y,
                    angle: angle,
                    arc: cfg.arc * (1 + itemStats.projectileSize),
                    range: cfg.range,
                    damage: this.damage * itemStats.damage,
                    color: cfg.color,
                    life: 0.3,
                    pierce: 999,
                    knockback: 50
                });
                break;

            case 'projectile':
                const size = 8 * itemStats.projectileSize;
                bullets.push(new Bullet(source.x, source.y, {
                    angle: angle,
                    speed: cfg.speed * (1 + (itemStats.projectileSpeed - 1) * 0.5),
                    damage: this.damage * itemStats.damage,
                    size: size,
                    color: cfg.color,
                    pierce: (cfg.pierce || 0) + itemStats.pierceCount,
                    bounce: itemStats.bounceCount,
                    homing: cfg.homing || itemStats.homingAngle > 0,
                    homingStrength: itemStats.homingAngle / 30,
                    returning: cfg.returning,
                    owner: source,
                    split: itemStats.splitCount,
                    explosion: cfg.explosion ? cfg.explosion * (1 + itemStats.explosionRadius) : 0
                }));
                break;

            case 'orbit':
                // 环绕武器创建多个环绕�?
                const orbitCount = this.isEvolved ? 6 : 3;
                for (let i = 0; i < orbitCount; i++) {
                    const orbitAngle = this.orbitAngle + (Math.PI * 2 * i / orbitCount);
                    bullets.push({
                        type: 'orbit',
                        x: source.x + Math.cos(orbitAngle) * cfg.orbitRadius,
                        y: source.y + Math.sin(orbitAngle) * cfg.orbitRadius,
                        orbitCenter: source,
                        orbitAngle: orbitAngle,
                        orbitRadius: cfg.orbitRadius * (this.isEvolved ? 1.5 : 1),
                        damage: this.damage * itemStats.damage,
                        color: cfg.color,
                        size: 12 * itemStats.projectileSize,
                        life: cfg.duration * (this.isEvolved ? 2 : 1),
                        pierce: 999
                    });
                }
                break;

            case 'area':
                bullets.push({
                    type: 'area',
                    x: source.x + Math.cos(angle) * 100,
                    y: source.y + Math.sin(angle) * 100,
                    radius: cfg.radius * itemStats.projectileSize,
                    damage: this.damage * itemStats.damage,
                    color: cfg.color,
                    duration: cfg.duration * (this.isEvolved ? 2 : 1),
                    tickRate: 0.5
                });
                break;

            case 'instant':
                // 闪电立即命中
                bullets.push({
                    type: 'lightning',
                    source: source,
                    target: target,
                    chain: cfg.chain + (this.isEvolved ? 3 : 0),
                    chainRange: cfg.chainRange,
                    damage: this.damage * itemStats.damage,
                    color: cfg.color
                });
                break;
        }

        return bullets;
    }
}

// ==================== 武器管理�?====================
class WeaponManager {
    constructor(player) {
        this.player = player;
        this.weapons = [];
        this.maxSlots = 6;
        this.bullets = [];
        this.areas = []; // 持续区域效果
    }

    addWeapon(weaponId) {
        if (this.weapons.length >= this.maxSlots) {
            // 可以升级现有武器
            const existing = this.weapons.find(w => w.id === weaponId);
            if (existing) {
                existing.level++;
                return true;
            }
            return false;
        }

        // 检查是否是新武�?
        const existing = this.weapons.find(w => w.id === weaponId);
        if (existing) {
            existing.level++;
        } else {
            this.weapons.push(new Weapon(weaponId, 1));
        }
        return true;
    }

    update(dt, enemies, itemStats) {
        // 更新武器冷却
        for (const weapon of this.weapons) {
            weapon.update(dt);

            // 检查进�?
            if (weapon.canEvolve && weapon.canEvolve(itemStats)) {
                weapon.evolve();
            }

            // 自动攻击
            if (weapon.canFire()) {
                const target = this.findNearestEnemy(enemies);
                const newBullets = weapon.fire(this.player, target, itemStats);
                this.bullets.push(...newBullets);
            }
        }

        // 更新子弹
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            
            if (b instanceof Bullet) {
                b.update(dt, enemies);
                if (!b.alive) {
                    // 处理爆炸
                    if (b.shouldExplode && b.explosion > 0) {
                        this.createExplosion(b.x, b.y, b.explosion, b.damage, b.color);
                    }
                    // 处理分裂
                    if (b.shouldSplit && b.split > 0) {
                        for (let j = 0; j < b.split; j++) {
                            const angle = (Math.PI * 2 * j) / b.split;
                            this.bullets.push(new Bullet(b.x, b.y, {
                                angle: angle,
                                speed: b.vel.length() * 0.7,
                                damage: b.damage * 0.5,
                                size: b.width * 0.6,
                                color: b.color,
                                life: b.life * 0.5
                            }));
                        }
                    }
                    this.bullets.splice(i, 1);
                }
            } else {
                // 特殊子弹类型
                b.life -= dt;
                if (b.life <= 0) this.bullets.splice(i, 1);

                // 更新环绕位置
                if (b.type === 'orbit') {
                    b.x = b.orbitCenter.x + Math.cos(b.orbitAngle) * b.orbitRadius;
                    b.y = b.orbitCenter.y + Math.sin(b.orbitAngle) * b.orbitRadius;
                    b.orbitAngle += 3 * dt;
                }
            }
        }

        // 更新区域效果
        for (let i = this.areas.length - 1; i >= 0; i--) {
            const area = this.areas[i];
            area.duration -= dt;
            if (area.duration <= 0) {
                this.areas.splice(i, 1);
            }
        }
    }

    findNearestEnemy(enemies) {
        let nearest = null;
        let nearestDist = Infinity;
        
        for (const enemy of enemies) {
            const dist = this.player.distanceTo(enemy);
            if (dist < nearestDist) {
                nearestDist = dist;
                nearest = enemy;
            }
        }
        
        return nearest;
    }

    createExplosion(x, y, radius, damage, color) {
        this.areas.push({
            type: 'explosion',
            x, y, radius, damage, color,
            duration: 0.3,
            hitEnemies: new Set()
        });
    }

    draw(ctx) {
        // 绘制子弹
        for (const b of this.bullets) {
            if (b instanceof Bullet) {
                b.draw(ctx);
            } else if (b.type === 'melee') {
                // 绘制近战扇形
                ctx.save();
                ctx.translate(b.x, b.y);
                ctx.rotate(b.angle);
                ctx.fillStyle = b.color + '60';
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.arc(0, 0, b.range, -b.arc / 2, b.arc / 2);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            } else if (b.type === 'orbit') {
                // 绘制环绕�?
                ctx.save();
                ctx.fillStyle = b.color;
                ctx.shadowBlur = 10;
                ctx.shadowColor = b.color;
                ctx.beginPath();
                ctx.arc(b.x, b.y, b.size / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            } else if (b.type === 'area') {
                // 绘制区域
                ctx.save();
                ctx.fillStyle = b.color + '40';
                ctx.strokeStyle = b.color;
                ctx.beginPath();
                ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.stroke();
                ctx.restore();
            }
        }

        // 绘制区域效果
        for (const area of this.areas) {
            ctx.save();
            ctx.fillStyle = area.color + '60';
            ctx.beginPath();
            ctx.arc(area.x, area.y, area.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
}

// ==================== 导出 ====================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Bullet, Weapon, WeaponManager, WEAPONS };
}


/**
 * 肉鸽牛牛 - 敌人系统
 * 22种感染敌�?+ AI + 波次管理
 */

// ==================== 敌人状态机 ====================
const EnemyStates = {
    IDLE: 'idle',
    CHASE: 'chase',
    ATTACK: 'attack',
    STUNNED: 'stunned',
    FLEE: 'flee'
};

// ==================== 敌人基类 ====================
class Enemy extends Entity {
    constructor(x, y, config) {
        super(x, y, 24, 24);
        this.config = { ...config };
        
        // 基础属�?
        this.maxHp = config.hp;
        this.hp = config.hp;
        this.speed = config.speed;
        this.damage = config.damage;
        this.exp = config.exp;
        this.spriteId = config.id;
        
        // 状�?
        this.state = EnemyStates.CHASE;
        this.stateTimer = 0;
        this.attackCooldown = 0;
        this.stunTimer = 0;
        this.frozenTimer = 0;
        this.burnTimer = 0;
        this.poisonTimer = 0;
        
        // 动画
        this.animOffset = Math.random() * 1000;
        this.facingRight = true;
        this.hitFlash = 0;
        
        // 效果
        this.slowFactor = 1.0;
    }

    update(dt, player, allEnemies) {
        // 状态效果处�?
        if (this.stunTimer > 0) {
            this.stunTimer -= dt;
            this.state = EnemyStates.STUNNED;
        }
        
        if (this.frozenTimer > 0) {
            this.frozenTimer -= dt;
            return; // 冻结不动
        }

        if (this.burnTimer > 0) {
            this.burnTimer -= dt;
            this.hp -= 2 * dt; // 燃烧伤害
        }

        if (this.poisonTimer > 0) {
            this.poisonTimer -= dt;
            this.hp -= 1 * dt; // 中毒伤害
        }

        // 减速恢�?
        this.slowFactor = Math.min(1.0, this.slowFactor + dt * 0.5);

        // 状态机
        switch (this.state) {
            case EnemyStates.CHASE:
                this.chase(dt, player, allEnemies);
                break;
            case EnemyStates.STUNNED:
                this.vel = new Vec2(0, 0);
                if (this.stunTimer <= 0) {
                    this.state = EnemyStates.CHASE;
                }
                break;
        }

        // 攻击冷却
        if (this.attackCooldown > 0) this.attackCooldown -= dt;

        // 受伤闪烁
        if (this.hitFlash > 0) this.hitFlash -= dt;

        // 应用速度
        const actualSpeed = this.speed * this.slowFactor;
        this.vel = this.vel.normalize().mul(actualSpeed);
        super.update(dt);

        // 边界限制
        this.x = Math.max(20, Math.min(880, this.x));
        this.y = Math.max(20, Math.min(580, this.y));
    }

    chase(dt, player, allEnemies) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // 分离行为（避免重叠）
        let separateX = 0, separateY = 0;
        let separateCount = 0;
        
        for (const other of allEnemies) {
            if (other === this) continue;
            const odx = this.x - other.x;
            const ody = this.y - other.y;
            const odist = Math.sqrt(odx * odx + ody * ody);
            
            if (odist < 30 && odist > 0) {
                separateX += odx / odist;
                separateY += ody / odist;
                separateCount++;
            }
        }

        // 计算最终速度
        if (dist > 0) {
            this.vel = new Vec2(dx / dist, dy / dist);
            this.facingRight = dx > 0;
        }

        // 应用分离
        if (separateCount > 0) {
            separateX /= separateCount;
            separateY /= separateCount;
            this.vel = this.vel.add(new Vec2(separateX, separateY).mul(0.5));
        }
    }

    takeDamage(amount, effects = {}) {
        this.hp -= amount;
        this.hitFlash = 0.2;

        // 应用效果
        if (effects.stun) this.stunTimer = effects.stun;
        if (effects.freeze) this.frozenTimer = effects.freeze;
        if (effects.slow) this.slowFactor = effects.slow;
        if (effects.burn) this.burnTimer = effects.burn;
        if (effects.poison) this.poisonTimer = effects.poison;

        // 击退
        if (effects.knockback) {
            // 由外部处�?
        }

        return this.hp <= 0;
    }

    draw(ctx, spriteManager) {
        // 状态效果可视化
        if (this.frozenTimer > 0) {
            ctx.fillStyle = 'rgba(100, 200, 255, 0.3)';
            ctx.fillRect(this.x - 14, this.y - 14, 28, 28);
        }
        if (this.burnTimer > 0) {
            ctx.fillStyle = 'rgba(255, 100, 0, 0.3)';
            ctx.fillRect(this.x - 14, this.y - 14, 28, 28);
        }

        // 阴影
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 10, 10, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // 敌人精灵
        const floatY = Math.sin((Date.now() + this.animOffset) / 300) * 1;
        
        spriteManager.draw(ctx, this.spriteId, this.x - 16, this.y - 16 + floatY, {
            width: 32,
            height: 32,
            flipX: !this.facingRight,
            tint: this.hitFlash > 0 ? 'rgba(255,0,0,0.5)' : null
        });

        // 血�?
        if (this.hp < this.maxHp || this.maxHp >= 40) {
            const barWidth = 24;
            const hpPercent = Math.max(0, this.hp / this.maxHp);
            
            ctx.fillStyle = '#333';
            ctx.fillRect(this.x - barWidth / 2, this.y - 22, barWidth, 4);
            
            ctx.fillStyle = hpPercent > 0.5 ? '#4f4' : hpPercent > 0.25 ? '#ff4' : '#f44';
            ctx.fillRect(this.x - barWidth / 2, this.y - 22, barWidth * hpPercent, 4);
        }

        // 状态图�?
        let iconY = this.y - 28;
        if (this.frozenTimer > 0) {
            ctx.font = '12px Arial';
            ctx.fillText('❄️', this.x, iconY);
            iconY -= 12;
        }
        if (this.burnTimer > 0) {
            ctx.font = '12px Arial';
            ctx.fillText('🔥', this.x, iconY);
        }
    }
}

// ==================== 波次管理�?====================
class WaveManager {
    constructor(spriteManager) {
        this.spriteManager = spriteManager;
        this.wave = 1;
        this.waveTimer = 0;
        this.spawnTimer = 0;
        this.enemiesToSpawn = 0;
        this.totalSpawned = 0;
        this.isWaveActive = false;
        this.waveBreak = false;
        this.breakTimer = 0;
    }

    startWave(waveNum) {
        this.wave = waveNum;
        this.waveTimer = 0;
        this.spawnTimer = 0;
        this.totalSpawned = 0;
        this.isWaveActive = true;
        this.waveBreak = false;
        
        // 计算敌人�?
        this.enemiesToSpawn = 5 + waveNum * 3;
        
        console.log(`�?${waveNum} 波开始！敌人�? ${this.enemiesToSpawn}`);
    }

    update(dt, spawnCallback) {
        if (!this.isWaveActive) return;

        this.waveTimer += dt;

        if (this.waveBreak) {
            // 波次间隔
            this.breakTimer -= dt;
            if (this.breakTimer <= 0) {
                this.waveBreak = false;
            }
            return;
        }

        // 刷�?
        if (this.totalSpawned < this.enemiesToSpawn) {
            this.spawnTimer += dt;
            
            // 动态刷怪间�?
            const spawnInterval = Math.max(0.3, 2.0 - this.wave * 0.1);
            
            if (this.spawnTimer >= spawnInterval) {
                this.spawnTimer = 0;
                this.spawnEnemy(spawnCallback);
            }
        }
    }

    spawnEnemy(spawnCallback) {
        // 随机位置（屏幕边缘）
        const side = Math.floor(Math.random() * 4);
        let x, y;
        switch (side) {
            case 0: x = Math.random() * 900; y = -30; break;
            case 1: x = 930; y = Math.random() * 600; break;
            case 2: x = Math.random() * 900; y = 630; break;
            case 3: x = -30; y = Math.random() * 600; break;
        }

        // 获取敌人配置
        const config = this.spriteManager.getRandomEnemy(this.wave);
        
        // 波数加成
        const scaledConfig = {
            ...config,
            hp: config.hp * (1 + this.wave * 0.1),
            damage: config.damage * (1 + this.wave * 0.05),
            speed: config.speed * (1 + this.wave * 0.02)
        };

        spawnCallback(x, y, scaledConfig);
        this.totalSpawned++;
    }

    checkWaveComplete(currentEnemies) {
        if (!this.isWaveActive) return false;
        if (this.totalSpawned >= this.enemiesToSpawn && currentEnemies === 0) {
            this.endWave();
            return true;
        }
        return false;
    }

    endWave() {
        this.isWaveActive = false;
        this.waveBreak = true;
        this.breakTimer = 5; // 5秒间�?
        console.log(`�?${this.wave} 波完成！`);
    }

    getWaveInfo() {
        return {
            wave: this.wave,
            progress: this.totalSpawned / this.enemiesToSpawn,
            remaining: Math.max(0, this.enemiesToSpawn - this.totalSpawned),
            breakTime: this.breakTimer
        };
    }
}

// ==================== 经验宝石 ====================
class ExpGem extends Entity {
    constructor(x, y, value) {
        super(x, y, 12, 12);
        this.value = value;
        this.attracted = false;
        this.attractionSpeed = 200;
        this.life = 30; // 30秒后消失
    }

    update(dt, player, magnetRange) {
        const dist = this.distanceTo(player);
        
        // 磁铁吸引
        if (dist < magnetRange || this.attracted) {
            this.attracted = true;
            const dir = player.pos.sub(this.pos).normalize();
            this.vel = dir.mul(this.attractionSpeed);
        } else {
            this.vel = new Vec2(0, 0);
        }

        super.update(dt);
        this.life -= dt;

        if (dist < 15) {
            this.destroy();
            return true; // 被收�?
        }

        if (this.life <= 0) {
            this.destroy();
        }

        return false;
    }

    draw(ctx) {
        const alpha = Math.min(1, this.life / 5);
        ctx.globalAlpha = alpha;
        
        ctx.fillStyle = '#4488ff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#4488ff';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 6);
        ctx.lineTo(this.x + 5, this.y);
        ctx.lineTo(this.x, this.y + 6);
        ctx.lineTo(this.x - 5, this.y);
        ctx.closePath();
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }
}

// ==================== 金币 ====================
class Coin extends ExpGem {
    constructor(x, y, value) {
        super(x, y, value);
        this.width = 14;
        this.height = 14;
    }

    draw(ctx) {
        const alpha = Math.min(1, this.life / 5);
        ctx.globalAlpha = alpha;
        
        ctx.fillStyle = '#ffcc00';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#ffcc00';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffee88';
        ctx.beginPath();
        ctx.arc(this.x - 2, this.y - 2, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }
}

// ==================== 导出 ====================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Enemy, WaveManager, ExpGem, Coin, EnemyStates };
}


/**
 * 肉鸽牛牛 - 以撒风格房间系统
 * 一个屏幕就是一个房�?
 */

// 房间类型
const RoomType = {
    NORMAL: 'normal',
    BOSS: 'boss',
    TREASURE: 'treasure',
    SHOP: 'shop',
    SECRET: 'secret',
    START: 'start'
};

// 房间方向
const Direction = {
    UP: 0,
    RIGHT: 1,
    DOWN: 2,
    LEFT: 3
};

// 单个房间�?
class IsaacRoom {
    constructor(x, y, type = RoomType.NORMAL) {
        this.gridX = x;  // 地图网格坐标
        this.gridY = y;
        this.type = type;
        this.id = `${x},${y}`;
        
        // 房间尺寸（像素）
        this.width = 900;
        this.height = 600;
        
        // 墙壁厚度
        this.wallThickness = 40;
        
        // �?
        this.doors = {
            [Direction.UP]: null,
            [Direction.RIGHT]: null,
            [Direction.DOWN]: null,
            [Direction.LEFT]: null
        };
        
        // 状�?
        this.visited = false;
        this.cleared = false;
        this.enemies = [];
        this.obstacles = [];
        this.items = []; // 房间内的道具底座
        
        // 波次管理
        this.wave = 1;
        this.currentWave = 0;
        this.totalWaves = 1;
        this.spawnTimer = 0;
        
        this.generateObstacles();
    }

    generateObstacles() {
        // 根据房间类型生成障碍�?
        const obstacleCount = this.type === RoomType.BOSS ? 4 :
                             this.type === RoomType.TREASURE ? 2 : 
                             Math.floor(Math.random() * 5) + 3;
        
        this.obstacles = [];
        for (let i = 0; i < obstacleCount; i++) {
            let x, y, valid;
            let attempts = 0;
            
            do {
                valid = true;
                // 避免在门附近和中央生�?
                x = this.wallThickness + 80 + Math.random() * (this.width - this.wallThickness * 2 - 160);
                y = this.wallThickness + 80 + Math.random() * (this.height - this.wallThickness * 2 - 160);
                
                // 检查是否太靠近中央（玩家出生点�?
                const centerX = this.width / 2;
                const centerY = this.height / 2;
                if (Math.abs(x - centerX) < 100 && Math.abs(y - centerY) < 100) {
                    valid = false;
                }
                
                // 检查是否重�?
                for (const obs of this.obstacles) {
                    const dist = Math.sqrt((x - obs.x) ** 2 + (y - obs.y) ** 2);
                    if (dist < 80) valid = false;
                }
                
                attempts++;
            } while (!valid && attempts < 50);
            
            if (valid) {
                this.obstacles.push({
                    x, y,
                    width: 40 + Math.random() * 30,
                    height: 40 + Math.random() * 30,
                    type: Math.random() > 0.7 ? 'rock' : 'pit'
                });
            }
        }
    }

    startWave(waveNum) {
        this.currentWave = waveNum;
        this.spawnTimer = 0;
        this.totalWaves = this.type === RoomType.BOSS ? 3 : 
                         this.type === RoomType.NORMAL ? 1 + Math.floor(waveNum / 3) : 1;
    }

    update(dt, player, spriteManager) {
        if (!this.visited) return;
        if (this.cleared) return;

        // 更新敌人
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(dt, player, this.enemies);
            
            // 检查碰�?
            if (enemy.distanceTo(player) < 20) {
                player.takeDamage(enemy.damage);
            }
            
            // 障碍物碰�?
            for (const obs of this.obstacles) {
                if (this.checkObstacleCollision(enemy, obs)) {
                    // 简单的推开
                    const dx = enemy.x - obs.x;
                    const dy = enemy.y - obs.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > 0) {
                        enemy.x += (dx / dist) * 2;
                        enemy.y += (dy / dist) * 2;
                    }
                }
            }
            
            // 墙壁碰撞
            this.constrainToRoom(enemy);
            
            if (enemy.hp <= 0) {
                this.enemies.splice(i, 1);
            }
        }

        // 刷�?
        if (this.currentWave <= this.totalWaves) {
            this.spawnTimer += dt;
            const spawnInterval = Math.max(1, 3 - this.currentWave * 0.2);
            
            if (this.spawnTimer >= spawnInterval && this.enemies.length < 8) {
                this.spawnTimer = 0;
                this.spawnEnemy(spriteManager, player);
            }
        }

        // 检查清�?
        if (this.currentWave >= this.totalWaves && this.enemies.length === 0 && !this.cleared) {
            this.cleared = true;
            this.openDoors();
            return true; // 刚刚清理完成
        }
        
        return false;
    }

    spawnEnemy(spriteManager, player) {
        // 在屏幕边缘生�?
        const side = Math.floor(Math.random() * 4);
        let x, y;
        const margin = 60;
        
        switch (side) {
            case 0: x = margin + Math.random() * (this.width - margin * 2); y = this.wallThickness + 20; break;
            case 1: x = this.width - this.wallThickness - 20; y = margin + Math.random() * (this.height - margin * 2); break;
            case 2: x = margin + Math.random() * (this.width - margin * 2); y = this.height - this.wallThickness - 20; break;
            case 3: x = this.wallThickness + 20; y = margin + Math.random() * (this.height - margin * 2); break;
        }

        const config = spriteManager.getRandomEnemy(this.wave);
        const enemy = new Enemy(x, y, config);
        this.enemies.push(enemy);
    }

    checkObstacleCollision(entity, obs) {
        return entity.x > obs.x - obs.width / 2 - 12 &&
               entity.x < obs.x + obs.width / 2 + 12 &&
               entity.y > obs.y - obs.height / 2 - 12 &&
               entity.y < obs.y + obs.height / 2 + 12;
    }

    constrainToRoom(entity) {
        const margin = this.wallThickness + 12;
        entity.x = Math.max(margin, Math.min(this.width - margin, entity.x));
        entity.y = Math.max(margin, Math.min(this.height - margin, entity.y));
    }

    openDoors() {
        // 打开所有门
        for (const dir of Object.keys(this.doors)) {
            if (this.doors[dir]) {
                this.doors[dir].open = true;
            }
        }
    }

    checkDoorTransition(player) {
        const doorSize = 80;
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        
        // 上门
        if (this.doors[Direction.UP] && this.doors[Direction.UP].open) {
            if (player.y < this.wallThickness + 20 && Math.abs(player.x - centerX) < doorSize / 2) {
                return Direction.UP;
            }
        }
        // 下门
        if (this.doors[Direction.DOWN] && this.doors[Direction.DOWN].open) {
            if (player.y > this.height - this.wallThickness - 20 && Math.abs(player.x - centerX) < doorSize / 2) {
                return Direction.DOWN;
            }
        }
        // 左门
        if (this.doors[Direction.LEFT] && this.doors[Direction.LEFT].open) {
            if (player.x < this.wallThickness + 20 && Math.abs(player.y - centerY) < doorSize / 2) {
                return Direction.LEFT;
            }
        }
        // 右门
        if (this.doors[Direction.RIGHT] && this.doors[Direction.RIGHT].open) {
            if (player.x > this.width - this.wallThickness - 20 && Math.abs(player.y - centerY) < doorSize / 2) {
                return Direction.RIGHT;
            }
        }
        
        return null;
    }

    draw(ctx, spriteManager) {
        // 绘制地板
        const floorColors = {
            [RoomType.NORMAL]: '#2a2a3e',
            [RoomType.BOSS]: '#3e1a1a',
            [RoomType.TREASURE]: '#1a3e1a',
            [RoomType.SHOP]: '#3e3e1a',
            [RoomType.SECRET]: '#1a1a3e',
            [RoomType.START]: '#2a3e2a'
        };
        
        ctx.fillStyle = floorColors[this.type] || floorColors[RoomType.NORMAL];
        ctx.fillRect(0, 0, this.width, this.height);
        
        // 地板网格
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        for (let x = 0; x < this.width; x += 50) {
            ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.height); ctx.stroke();
        }
        for (let y = 0; y < this.height; y += 50) {
            ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.width, y); ctx.stroke();
        }

        // 绘制墙壁（四周）
        ctx.fillStyle = this.cleared ? '#3a3a4e' : '#1a1a2e';
        
        // 上门
        if (!this.doors[Direction.UP] || !this.doors[Direction.UP].open) {
            ctx.fillRect(0, 0, this.width / 2 - 40, this.wallThickness);
            ctx.fillRect(this.width / 2 + 40, 0, this.width / 2 - 40, this.wallThickness);
        } else {
            ctx.fillRect(0, 0, this.width, this.wallThickness);
            ctx.fillStyle = '#000';
            ctx.fillRect(this.width / 2 - 35, 0, 70, 5); // 门洞
        }
        
        // 下门
        ctx.fillStyle = this.cleared ? '#3a3a4e' : '#1a1a2e';
        if (!this.doors[Direction.DOWN] || !this.doors[Direction.DOWN].open) {
            ctx.fillRect(0, this.height - this.wallThickness, this.width / 2 - 40, this.wallThickness);
            ctx.fillRect(this.width / 2 + 40, this.height - this.wallThickness, this.width / 2 - 40, this.wallThickness);
        } else {
            ctx.fillRect(0, this.height - this.wallThickness, this.width, this.wallThickness);
        }
        
        // 左门
        if (!this.doors[Direction.LEFT] || !this.doors[Direction.LEFT].open) {
            ctx.fillRect(0, 0, this.wallThickness, this.height / 2 - 40);
            ctx.fillRect(0, this.height / 2 + 40, this.wallThickness, this.height / 2 - 40);
        } else {
            ctx.fillRect(0, 0, this.wallThickness, this.height);
        }
        
        // 右门
        if (!this.doors[Direction.RIGHT] || !this.doors[Direction.RIGHT].open) {
            ctx.fillRect(this.width - this.wallThickness, 0, this.wallThickness, this.height / 2 - 40);
            ctx.fillRect(this.width - this.wallThickness, this.height / 2 + 40, this.wallThickness, this.height / 2 - 40);
        } else {
            ctx.fillRect(this.width - this.wallThickness, 0, this.wallThickness, this.height);
        }

        // 绘制障碍�?
        for (const obs of this.obstacles) {
            if (obs.type === 'rock') {
                ctx.fillStyle = '#555';
                ctx.fillRect(obs.x - obs.width / 2, obs.y - obs.height / 2, obs.width, obs.height);
                ctx.fillStyle = '#777';
                ctx.fillRect(obs.x - obs.width / 2 + 3, obs.y - obs.height / 2 + 3, obs.width - 6, obs.height - 6);
            } else {
                ctx.fillStyle = '#1a1a2e';
                ctx.fillRect(obs.x - obs.width / 2, obs.y - obs.height / 2, obs.width, obs.height);
                ctx.strokeStyle = '#333';
                ctx.strokeRect(obs.x - obs.width / 2, obs.y - obs.height / 2, obs.width, obs.height);
            }
        }

        // 绘制�?
        this.drawDoors(ctx);

        // 绘制敌人
        for (const enemy of this.enemies) {
            enemy.draw(ctx, spriteManager);
        }

        // 未清理时显示锁图�?
        if (!this.cleared && this.enemies.length > 0) {
            ctx.fillStyle = 'rgba(255,100,100,0.5)';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('🔒', this.width / 2, this.wallThickness + 30);
        }
    }

    drawDoors(ctx) {
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        const doorSize = 70;
        
        for (const [dir, door] of Object.entries(this.doors)) {
            if (!door) continue;
            
            const isOpen = door.open;
            ctx.fillStyle = isOpen ? '#2a4a2a' : '#4a2a2a';
            
            switch (parseInt(dir)) {
                case Direction.UP:
                    ctx.fillRect(centerX - doorSize / 2, 0, doorSize, this.wallThickness);
                    if (!isOpen) {
                        ctx.fillStyle = '#888';
                        ctx.fillRect(centerX - 15, 5, 30, 25);
                    }
                    break;
                case Direction.DOWN:
                    ctx.fillRect(centerX - doorSize / 2, this.height - this.wallThickness, doorSize, this.wallThickness);
                    if (!isOpen) {
                        ctx.fillStyle = '#888';
                        ctx.fillRect(centerX - 15, this.height - 30, 30, 25);
                    }
                    break;
                case Direction.LEFT:
                    ctx.fillRect(0, centerY - doorSize / 2, this.wallThickness, doorSize);
                    if (!isOpen) {
                        ctx.fillStyle = '#888';
                        ctx.fillRect(5, centerY - 15, 25, 30);
                    }
                    break;
                case Direction.RIGHT:
                    ctx.fillRect(this.width - this.wallThickness, centerY - doorSize / 2, this.wallThickness, doorSize);
                    if (!isOpen) {
                        ctx.fillStyle = '#888';
                        ctx.fillRect(this.width - 30, centerY - 15, 25, 30);
                    }
                    break;
            }
        }
    }
}

// ==================== 地图生成�?====================
class MapGenerator {
    constructor() {
        this.rooms = new Map();
        this.minRooms = 8;
        this.maxRooms = 12;
    }

    generate(seed = Math.random()) {
        this.rooms.clear();
        
        // 起始房间
        const startRoom = new IsaacRoom(0, 0, RoomType.START);
        this.rooms.set(startRoom.id, startRoom);
        
        // BFS生成地图
        let roomCount = 1;
        const queue = [startRoom];
        const directions = [
            { dx: 0, dy: -1, dir: Direction.UP, opposite: Direction.DOWN },
            { dx: 1, dy: 0, dir: Direction.RIGHT, opposite: Direction.LEFT },
            { dx: 0, dy: 1, dir: Direction.DOWN, opposite: Direction.UP },
            { dx: -1, dy: 0, dir: Direction.LEFT, opposite: Direction.RIGHT }
        ];
        
        while (queue.length > 0 && roomCount < this.maxRooms) {
            const current = queue.shift();
            
            // 随机打乱方向
            const shuffledDirs = [...directions].sort(() => Math.random() - 0.5);
            
            for (const { dx, dy, dir, opposite } of shuffledDirs) {
                const newX = current.gridX + dx;
                const newY = current.gridY + dy;
                const newId = `${newX},${newY}`;
                
                // 检查是否已存在
                if (this.rooms.has(newId)) {
                    // 连接现有房间
                    const existingRoom = this.rooms.get(newId);
                    if (!current.doors[dir]) {
                        current.doors[dir] = { open: false, target: existingRoom };
                        existingRoom.doors[opposite] = { open: false, target: current };
                    }
                    continue;
                }
                
                // 随机决定是否创建新房�?
                if (Math.random() > 0.6 || roomCount < this.minRooms) {
                    // 确定房间类型
                    let type = RoomType.NORMAL;
                    if (roomCount === this.maxRooms - 1) type = RoomType.BOSS;
                    else if (Math.random() < 0.15) type = RoomType.TREASURE;
                    else if (Math.random() < 0.1) type = RoomType.SHOP;
                    
                    const newRoom = new IsaacRoom(newX, newY, type);
                    
                    // 双向连接
                    current.doors[dir] = { open: false, target: newRoom };
                    newRoom.doors[opposite] = { open: false, target: current };
                    
                    this.rooms.set(newId, newRoom);
                    queue.push(newRoom);
                    roomCount++;
                }
            }
        }
        
        return startRoom;
    }

    getRoom(x, y) {
        return this.rooms.get(`${x},${y}`);
    }
}

// ==================== 小地�?====================
class Minimap {
    constructor() {
        this.cellSize = 20;
        this.padding = 10;
    }

    draw(ctx, currentRoom, allRooms, x, y) {
        ctx.save();
        
        // 找出边界
        let minX = 0, maxX = 0, minY = 0, maxY = 0;
        for (const room of allRooms.values()) {
            minX = Math.min(minX, room.gridX);
            maxX = Math.max(maxX, room.gridX);
            minY = Math.min(minY, room.gridY);
            maxY = Math.max(maxY, room.gridY);
        }
        
        const width = (maxX - minX + 1) * this.cellSize;
        const height = (maxY - minY + 1) * this.cellSize;
        
        // 背景
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(x, y, width + this.padding * 2, height + this.padding * 2);
        
        // 绘制房间
        for (const room of allRooms.values()) {
            const drawX = x + this.padding + (room.gridX - minX) * this.cellSize;
            const drawY = y + this.padding + (room.gridY - minY) * this.cellSize;
            
            if (room === currentRoom) {
                ctx.fillStyle = '#ff0';
            } else if (room.visited) {
                const colors = {
                    [RoomType.NORMAL]: '#888',
                    [RoomType.BOSS]: '#f00',
                    [RoomType.TREASURE]: '#0f0',
                    [RoomType.SHOP]: '#fa0',
                    [RoomType.START]: '#88f'
                };
                ctx.fillStyle = colors[room.type] || '#888';
            } else {
                continue; // 未访问不显示
            }
            
            ctx.fillRect(drawX + 2, drawY + 2, this.cellSize - 4, this.cellSize - 4);
            
            // 绘制连接
            ctx.fillStyle = '#666';
            if (room.doors[Direction.UP] && room.visited) {
                ctx.fillRect(drawX + this.cellSize / 2 - 2, drawY, 4, 2);
            }
            if (room.doors[Direction.DOWN] && room.visited) {
                ctx.fillRect(drawX + this.cellSize / 2 - 2, drawY + this.cellSize - 2, 4, 2);
            }
        }
        
        ctx.restore();
    }
}

// ==================== 导出 ====================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { 
        IsaacRoom, MapGenerator, Minimap, 
        RoomType, Direction 
    };
}


/**
 * 肉鸽牛牛 - 以撒风格完整游戏
 * 一个屏幕一个房间，清理后选择方向
 */

class IsaacCowGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = 900;
        this.height = 600;
        
        this.state = 'loading';
        this.gameTime = 0;
        this.lastTime = 0;
        
        // 系统
        this.spriteManager = new SpriteManager();
        this.itemManager = null;
        this.weaponManager = null;
        this.particles = new ParticleSystem();
        
        // 地图
        this.mapGenerator = new MapGenerator();
        this.currentRoom = null;
        this.allRooms = null;
        this.minimap = new Minimap();
        
        // 玩家
        this.player = null;
        this.expGems = [];
        this.coins = [];
        
        // UI
        this.itemSelectionUI = null;
        this.transitioning = false;
        this.transitionTimer = 0;
        this.transitionDirection = null;
        
        // 输入
        this.keys = {};
        
        this.setupInput();
    }

    async init() {
        await this.spriteManager.loadAll();
        
        // 生成地图
        this.currentRoom = this.mapGenerator.generate();
        this.allRooms = this.mapGenerator.rooms;
        this.currentRoom.visited = true;
        this.currentRoom.startWave(1);
        
        // 创建玩家
        this.player = new Player(450, 300);
        
        // 管理�?
        this.itemManager = new ItemManager(this.player);
        this.weaponManager = new WeaponManager(this.player);
        this.itemSelectionUI = new ItemSelectionUI(this.itemManager);
        
        // 初始武器
        this.weaponManager.addWeapon('whip');
        
        this.state = 'playing';
        console.log('%c🐮 肉鸽牛牛 - 以撒风格', 'font-size:24px;color:#4488ff');
        console.log('%c清理房间，选择方向，继续探索！', 'font-size:14px');
        
        requestAnimationFrame(t => this.loop(t));
    }

    setupInput() {
        window.addEventListener('keydown', e => {
            this.keys[e.key] = true;
            this.handleKey(e.key);
        });
        window.addEventListener('keyup', e => this.keys[e.key] = false);
    }

    handleKey(key) {
        if (this.transitioning) return;
        
        if (key >= '1' && key <= '9') {
            this.giveItem(parseInt(key));
        }
        if (key === '0') {
            this.giveItem(Math.floor(Math.random() * 100) + 1);
        }
        if (key === 'w' || key === 'W') {
            this.weaponManager.addWeapon(Object.keys(WEAPONS)[Math.floor(Math.random() * 8)]);
        }
        // M键显示地�?
        if (key === 'm' || key === 'M') {
            this.showMap = !this.showMap;
        }
    }

    giveItem(itemId) {
        const success = this.itemManager.acquireItem(itemId);
        if (success) {
            const item = ITEMS_DATABASE[itemId];
            this.particles.emitItemBurst(this.player.x, this.player.y, item.rarity);
        }
    }

    update(dt) {
        if (this.state !== 'playing') return;
        if (this.transitioning) {
            this.updateTransition(dt);
            return;
        }
        if (this.itemSelectionUI.visible) return;

        this.gameTime += dt;

        const stats = this.itemManager.recalculateStats();

        // 更新玩家
        this.player.update(dt, this.itemManager, { keys: this.keys }, this.currentRoom);

        // 更新房间
        const justCleared = this.currentRoom.update(dt, this.player, this.spriteManager);
        
        if (justCleared) {
            this.onRoomCleared();
        }

        // 检查门传�?
        const transitionDir = this.currentRoom.checkDoorTransition(this.player);
        if (transitionDir !== null && this.currentRoom.cleared) {
            this.startTransition(transitionDir);
        }

        // 武器更新
        this.weaponManager.update(dt, this.currentRoom.enemies, stats);

        // 碰撞检�?
        this.handleCombat(stats);

        // 掉落�?
        this.updateDrops(dt, stats);

        // 粒子
        this.particles.update();

        // 升级检�?
        this.checkLevelUp();
    }

    handleCombat(stats) {
        // 子弹与敌�?
        for (const bullet of this.weaponManager.bullets) {
            if (bullet instanceof Bullet) {
                for (const enemy of this.currentRoom.enemies) {
                    if (bullet.collidesWith(enemy)) {
                        if (bullet.hit(enemy)) {
                            let damage = bullet.damage * stats.damage;
                            
                            // 暴击
                            if (Math.random() < (stats.critChance || 0)) {
                                damage *= 2;
                            }
                            
                            const killed = enemy.takeDamage(damage, {
                                burn: bullet.burn,
                                poison: bullet.poison,
                                slow: bullet.slow ? 0.5 : 1
                            });
                            
                            this.particles.emitHit(enemy.x, enemy.y, bullet.color);
                            
                            if (killed) {
                                this.onEnemyDeath(enemy);
                            }
                        }
                    }
                }
            } else if (bullet.type === 'melee' || bullet.type === 'orbit') {
                for (const enemy of this.currentRoom.enemies) {
                    const dist = Math.sqrt((enemy.x - bullet.x) ** 2 + (enemy.y - bullet.y) ** 2);
                    if (dist < (bullet.size || 20)) {
                        if (enemy.takeDamage(bullet.damage)) {
                            this.onEnemyDeath(enemy);
                        }
                    }
                }
            }
        }

        // 玩家与敌人碰�?
        for (const enemy of this.currentRoom.enemies) {
            if (enemy.distanceTo(this.player) < 20) {
                if (this.player.takeDamage(enemy.damage)) {
                    this.particles.emitHit(this.player.x, this.player.y, '#f00');
                }
            }
        }
    }

    onEnemyDeath(enemy) {
        // 经验
        this.expGems.push(new ExpGem(enemy.x, enemy.y, enemy.exp));
        
        // 金币
        if (Math.random() < 0.3) {
            this.coins.push(new Coin(enemy.x, enemy.y, 1));
        }
        
        // 击杀回血
        const stats = this.itemManager.recalculateStats();
        if (stats.killHeal > 0) {
            this.player.heal(stats.killHeal);
        }
        
        this.particles.emitExplosion(enemy.x, enemy.y);
    }

    updateDrops(dt, stats) {
        const magnetRange = 100 * (stats.magnetRange || 1);
        
        for (let i = this.expGems.length - 1; i >= 0; i--) {
            const gem = this.expGems[i];
            if (gem.update(dt, this.player, magnetRange)) {
                this.player.exp += gem.value;
                this.expGems.splice(i, 1);
            } else if (!gem.alive) {
                this.expGems.splice(i, 1);
            }
        }
        
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            if (coin.update(dt, this.player, magnetRange)) {
                this.player.gold += coin.value;
                this.coins.splice(i, 1);
            } else if (!coin.alive) {
                this.coins.splice(i, 1);
            }
        }
    }

    onRoomCleared() {
        console.log(`房间清理完成！可以前往下一个房间`);
        
        // 给予奖励
        const items = this.itemManager.getRandomItemsFromPool(3, this.currentRoom.type, true);
        if (items.length > 0) {
            this.itemSelectionUI.show(items, (selected) => {
                console.log(`获得: ${selected.name}`);
            });
        }
    }

    startTransition(dir) {
        const door = this.currentRoom.doors[dir];
        if (!door || !door.target) return;
        
        this.transitioning = true;
        this.transitionDirection = dir;
        this.nextRoom = door.target;
        this.transitionTimer = 0;
    }

    updateTransition(dt) {
        this.transitionTimer += dt;
        
        if (this.transitionTimer >= 0.3) {
            // 完成传�?
            this.currentRoom = this.nextRoom;
            this.currentRoom.visited = true;
            
            if (!this.currentRoom.cleared) {
                this.currentRoom.startWave(this.currentRoom.wave);
            }
            
            // 放置玩家在新位置
            const oppositeDir = (this.transitionDirection + 2) % 4;
            switch (oppositeDir) {
                case Direction.UP: this.player.y = 60; break;
                case Direction.DOWN: this.player.y = 540; break;
                case Direction.LEFT: this.player.x = 60; break;
                case Direction.RIGHT: this.player.x = 840; break;
            }
            
            this.expGems = [];
            this.coins = [];
            
            this.transitioning = false;
        }
    }

    checkLevelUp() {
        const needed = this.player.level * 100;
        if (this.player.exp >= needed) {
            this.player.exp -= needed;
            this.player.level++;
            this.player.maxHealth++;
            this.player.health++;
            
            // 升级奖励
            const upgrades = [];
            const availableWeapons = Object.keys(WEAPONS).filter(w => 
                !this.weaponManager.weapons.find(ww => ww.id === w)
            );
            
            if (availableWeapons.length > 0 && this.weaponManager.weapons.length < 6) {
                const w = availableWeapons[Math.floor(Math.random() * availableWeapons.length)];
                upgrades.push({ type: 'weapon', id: w, ...WEAPONS[w] });
            }
            
            const items = this.itemManager.getRandomItemsFromPool(3, 'normal', true);
            upgrades.push(...items.map(i => ({ ...i, type: 'item' })));
            
            this.itemSelectionUI.show(upgrades.slice(0, 4), (selected) => {
                if (selected.type === 'weapon') {
                    this.weaponManager.addWeapon(selected.id);
                } else {
                    this.itemManager.acquireItem(selected.id);
                }
            });
        }
    }

    draw() {
        this.ctx.fillStyle = '#0a0a14';
        this.ctx.fillRect(0, 0, this.width, this.height);

        if (this.state === 'loading') {
            this.drawLoading();
            return;
        }

        // 绘制当前房间
        this.currentRoom.draw(this.ctx, this.spriteManager);

        // 绘制掉落�?
        for (const gem of this.expGems) gem.draw(this.ctx);
        for (const coin of this.coins) coin.draw(this.ctx);

        // 绘制武器效果
        this.weaponManager.draw(this.ctx);

        // 绘制玩家
        this.player.draw(this.ctx, this.spriteManager, this.itemManager);

        // 粒子
        this.particles.draw(this.ctx);

        // 转场效果
        if (this.transitioning) {
            const alpha = Math.sin(this.transitionTimer / 0.3 * Math.PI);
            this.ctx.fillStyle = `rgba(0,0,0,${alpha})`;
            this.ctx.fillRect(0, 0, this.width, this.height);
        }

        // UI
        this.drawUI();
    }

    drawLoading() {
        this.ctx.fillStyle = '#0a0a14';
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.fillStyle = '#4488ff';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🐮 加载�?..', this.width / 2, this.height / 2);
    }

    drawUI() {
        // HUD
        this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this.ctx.fillRect(10, 10, 200, 100);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        
        // 生命
        const hearts = '❤️'.repeat(Math.ceil(this.player.health));
        this.ctx.fillText(hearts, 20, 35);
        
        // 等级经验
        this.ctx.fillStyle = '#4488ff';
        this.ctx.fillText(`Lv.${this.player.level} EXP:${Math.floor(this.player.exp)}`, 20, 60);
        
        // 金币
        this.ctx.fillStyle = '#ffcc00';
        this.ctx.fillText(`💰 ${this.player.gold}`, 20, 85);

        // 房间信息
        this.ctx.fillStyle = '#fff';
        this.ctx.textAlign = 'right';
        const roomNames = {
            [RoomType.NORMAL]: '普�?,
            [RoomType.BOSS]: 'BOSS',
            [RoomType.TREASURE]: '宝箱',
            [RoomType.SHOP]: '商店',
            [RoomType.START]: '起点'
        };
        this.ctx.fillText(`${roomNames[this.currentRoom.type]}房间`, this.width - 20, 35);
        this.ctx.fillText(`敌人:${this.currentRoom.enemies.length}`, this.width - 20, 60);
        if (!this.currentRoom.cleared) {
            this.ctx.fillStyle = '#f44';
            this.ctx.fillText('🔒 锁定', this.width - 20, 85);
        } else {
            this.ctx.fillStyle = '#4f4';
            this.ctx.fillText('�?已清�?, this.width - 20, 85);
        }

        // 小地�?
        this.minimap.draw(this.ctx, this.currentRoom, this.allRooms, this.width - 150, 100);

        // 武器�?
        this.drawWeaponBar();

        // 道具�?
        this.drawItemBar();

        // 选择界面
        this.itemSelectionUI.draw(this.ctx, this.width, this.height);
    }

    drawWeaponBar() {
        this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this.ctx.fillRect(10, this.height - 60, 350, 50);
        
        let x = 20;
        for (const weapon of this.weaponManager.weapons) {
            this.ctx.fillStyle = '#333';
            this.ctx.fillRect(x, this.height - 50, 40, 40);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(weapon.config.icon, x + 20, this.height - 25);
            this.ctx.fillStyle = '#0f0';
            this.ctx.font = '10px Arial';
            this.ctx.fillText(`Lv${weapon.level}`, x + 20, this.height - 15);
            x += 50;
        }
    }

    drawItemBar() {
        const items = this.itemManager.getOwnedItemsList();
        this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this.ctx.fillRect(this.width - 310, this.height - 60, 300, 50);
        
        let x = this.width - 300;
        for (const item of items.slice(0, 6)) {
            const colors = { common: '#888', rare: '#4488ff', epic: '#aa44ff', legendary: '#ffcc00', cursed: '#ff4444' };
            this.ctx.strokeStyle = colors[item.rarity];
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, this.height - 50, 40, 40);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(item.icon, x + 20, this.height - 30);
            if (item.count > 1) {
                this.ctx.fillStyle = '#ff0';
                this.ctx.font = '10px Arial';
                this.ctx.fillText(item.count, x + 35, this.height - 20);
            }
            x += 45;
        }
    }

    loop(timestamp) {
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
        this.lastTime = timestamp;
        
        this.update(dt);
        this.draw();
        
        requestAnimationFrame(t => this.loop(t));
    }
}

// ==================== 增强Player ====================
class Player extends Entity {
    constructor(x, y) {
        super(x, y, 20, 20);
        this.maxHealth = 6;
        this.health = 6;
        this.gold = 0;
        this.exp = 0;
        this.level = 1;
        this.facingRight = true;
        this.invincible = 0;
        this.canFly = false;
    }

    update(dt, itemManager, input, room) {
        const stats = itemManager.recalculateStats();
        this.canFly = stats.canFly;
        
        const speed = 150 * stats.moveSpeed;
        this.vel = new Vec2(0, 0);
        
        if (input.keys['w'] || input.keys['ArrowUp']) this.vel.y = -speed;
        if (input.keys['s'] || input.keys['ArrowDown']) this.vel.y = speed;
        if (input.keys['a'] || input.keys['ArrowLeft']) { this.vel.x = -speed; this.facingRight = false; }
        if (input.keys['d'] || input.keys['ArrowRight']) { this.vel.x = speed; this.facingRight = true; }

        super.update(dt);

        // 房间边界 + 障碍�?
        if (room) {
            this.constrainToRoom(room);
            this.handleObstacles(room);
        }

        if (this.invincible > 0) this.invincible -= dt;
    }

    constrainToRoom(room) {
        const margin = room.wallThickness + 10;
        this.x = Math.max(margin, Math.min(room.width - margin, this.x));
        this.y = Math.max(margin, Math.min(room.height - margin, this.y));
    }

    handleObstacles(room) {
        if (this.canFly) return; // 飞行无视障碍�?
        
        for (const obs of room.obstacles) {
            if (obs.type === 'pit') continue; // 坑可以走
            
            const dx = this.x - obs.x;
            const dy = this.y - obs.y;
            const overlapX = (obs.width / 2 + 12) - Math.abs(dx);
            const overlapY = (obs.height / 2 + 12) - Math.abs(dy);
            
            if (overlapX > 0 && overlapY > 0) {
                if (overlapX < overlapY) {
                    this.x += dx > 0 ? overlapX : -overlapX;
                } else {
                    this.y += dy > 0 ? overlapY : -overlapY;
                }
            }
        }
    }

    takeDamage(amount) {
        if (this.invincible > 0) return false;
        this.health -= amount;
        this.invincible = 1.0;
        return true;
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    draw(ctx, spriteManager, itemManager) {
        const stats = itemManager.recalculateStats();
        const floatY = this.canFly ? Math.sin(Date.now() / 200) * 3 : 0;
        
        // 阴影
        if (!this.canFly) {
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.beginPath();
            ctx.ellipse(this.x, this.y + 12, 10, 3, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // 玩家
        spriteManager.draw(ctx, 'player_cow', this.x - 16, this.y - 16 + floatY, {
            width: 32, height: 32, flipX: !this.facingRight
        });

        // 受伤闪烁
        if (this.invincible > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.fillStyle = 'rgba(255,0,0,0.3)';
            ctx.fillRect(this.x - 16, this.y - 16 + floatY, 32, 32);
        }
    }
}

// ==================== 导出 ====================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { IsaacCowGame, Player };
}


