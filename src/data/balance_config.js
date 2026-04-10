/**
 * 游戏平衡性配置 - v0.14.0
 * 第2轮迭代：平衡性调整
 * 
 * 调整内容：
 * 1. 敌人难度曲线平滑化
 * 2. 经济系统平衡（金币获取与消耗）
 * 3. 武器伤害平衡
 * 4. 掉落率调整
 */

const BALANCE_CONFIG = {
    // ========== 难度曲线 ==========
    difficulty: {
        // 敌人血量增长曲线 (层数 -> 倍数)
        enemyHpCurve: (floor) => {
            // 指数增长，但后期趋缓
            return 1 + Math.pow(floor - 1, 0.85) * 0.3;
        },
        
        // 敌人伤害增长曲线
        enemyDamageCurve: (floor) => {
            return 1 + (floor - 1) * 0.15;
        },
        
        // 敌人速度增长曲线
        enemySpeedCurve: (floor) => {
            // 速度增长有限，避免过快
            return 1 + Math.min((floor - 1) * 0.05, 0.5);
        },
        
        // 波次间隔（秒）
        waveInterval: (floor) => {
            return Math.max(15, 30 - (floor - 1) * 2);
        },
        
        // 每波敌人数
        enemiesPerWave: (floor, roomType) => {
            const base = roomType === 'elite' ? 8 : roomType === 'boss' ? 1 : 5;
            return Math.floor(base + (floor - 1) * 0.5);
        }
    },
    
    // ========== 经济系统 ==========
    economy: {
        // 金币掉落基础值
        goldDropBase: {
            T1: { min: 1, max: 3 },
            T2: { min: 2, max: 5 },
            T3: { min: 5, max: 10 },
            T4: { min: 20, max: 50 }
        },
        
        // 金币掉落倍率（随层数）
        goldDropMultiplier: (floor) => {
            return 1 + (floor - 1) * 0.1;
        },
        
        // 商店价格曲线
        shopPrices: {
            common: (floor) => 20 + (floor - 1) * 5,
            rare: (floor) => 40 + (floor - 1) * 10,
            epic: (floor) => 80 + (floor - 1) * 15,
            legendary: (floor) => 150 + (floor - 1) * 25,
            healthPack: (floor) => 15 + (floor - 1) * 3
        },
        
        // 道具出售价格比例
        sellRatio: 0.3,
        
        // 初始金币
        startingGold: 0,
        
        // 通关奖励
        clearRewards: {
            gold: (floor) => 50 * floor,
            exp: (floor) => 100 * floor
        }
    },
    
    // ========== 经验系统 ==========
    experience: {
        // 升级所需经验公式
        expToLevel: (level) => {
            return Math.floor(100 * Math.pow(1.2, level - 1));
        },
        
        // 击杀经验（按敌人等级）
        killExp: {
            T1: 5,
            T2: 10,
            T3: 25,
            T4: 100
        },
        
        // 经验掉落倍率
        expMultiplier: (floor) => {
            return 1 + (floor - 1) * 0.05;
        }
    },
    
    // ========== 掉落率 ==========
    drops: {
        // 基础掉落率
        baseDropChance: {
            healthPack: 0.02,    // 2%
            gold: 0.8,           // 80%
            item: 0.05           // 5%
        },
        
        // 幸运值对掉落的影响
        luckEffect: (luck) => {
            return 1 + luck * 0.1; // 每点幸运+10%掉落率
        },
        
        // 道具稀有度权重
        rarityWeights: {
            common: 60,
            rare: 25,
            epic: 12,
            legendary: 3
        },
        
        // Boss掉落保底
        bossDrops: {
            minItems: 1,
            maxItems: 3,
            guaranteedRare: true
        }
    },
    
    // ========== 武器平衡 ==========
    weapons: {
        // 武器伤害倍率（相对于基础值）
        damageMultipliers: {
            whip: 1.0,
            sword: 1.2,
            bow: 0.9,
            staff: 1.1,
            gun: 0.8,
            orb: 0.7
        },
        
        // 武器冷却时间（秒）
        cooldowns: {
            whip: 0.8,
            sword: 0.6,
            bow: 0.5,
            staff: 0.4,
            gun: 0.3,
            orb: 1.0
        },
        
        // 升级收益递减
        levelScaling: (level) => {
            // 等级越高，每次升级收益越低
            return 1 + (level - 1) * 0.15 * Math.pow(0.95, level - 1);
        }
    },
    
    // ========== 玩家成长 ==========
    player: {
        // 基础属性
        baseStats: {
            hp: 6,
            maxHp: 6,
            speed: 200,
            damage: 1.0
        },
        
        // 升级属性成长
        levelUpStats: {
            hp: 1,           // 每级+1 HP
            damage: 0.05,    // 每级+5% 伤害
            speed: 5        // 每级+5 移速
        },
        
        // 受伤无敌时间（秒）
        invincibilityTime: 0.5,
        
        // 回血机制
        regeneration: {
            base: 0,         // 基础无回血
            perLevel: 0.01   // 每级+0.01 HP/秒
        }
    },
    
    // ========== 房间奖励 ==========
    roomRewards: {
        // 清理房间奖励
        clearBonus: {
            normal: { gold: 10, exp: 20 },
            elite: { gold: 25, exp: 50 },
            boss: { gold: 100, exp: 200 }
        },
        
        // 连杀奖励
        killStreak: {
            enabled: true,
            bonusPerKill: 0.05,  // 每连杀+5%分数
            maxBonus: 0.5        // 最高50%加成
        }
    }
};

// 辅助函数：根据权重随机选择
function weightedRandom(weights) {
    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    let random = Math.random() * total;
    
    for (const [key, weight] of Object.entries(weights)) {
        random -= weight;
        if (random <= 0) return key;
    }
    
    return Object.keys(weights)[0];
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BALANCE_CONFIG, weightedRandom };
}
