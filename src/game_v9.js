// 肉鸽牛牛 v9.0 - 平衡性和难度曲线
// 让游戏前期友好，后期有挑战

// ========== 难度管理器 ==========
class DifficultyManager {
    constructor() {
        this.wave = 1;
        this.difficultyMultiplier = 1;
    }
    
    update(wave) {
        this.wave = wave;
        // 难度曲线：前期慢增长，后期快增长
        // 1-5波：线性增长
        // 5-10波：中等增长
        // 10波+：快速增长
        if (wave <= 5) {
            this.difficultyMultiplier = 1 + (wave - 1) * 0.1;
        } else if (wave <= 10) {
            this.difficultyMultiplier = 1.4 + (wave - 5) * 0.15;
        } else {
            this.difficultyMultiplier = 2.15 + (wave - 10) * 0.2;
        }
    }
    
    // 敌人属性缩放
    getEnemyStats(type) {
        const baseStats = {
            chick: { hp: 1, speed: 2.5, damage: 1, exp: 8 },
            pig: { hp: 3, speed: 1.5, damage: 1, exp: 12 },
            boss: { hp: 50, speed: 2, damage: 2, exp: 100 }
        };
        
        const stats = baseStats[type];
        return {
            hp: Math.floor(stats.hp * this.difficultyMultiplier),
            speed: stats.speed * Math.min(1.5, this.difficultyMultiplier),
            damage: Math.floor(stats.damage * Math.min(2, this.difficultyMultiplier * 0.8)),
            exp: Math.floor(stats.exp * (1 + this.wave * 0.05))
        };
    }
    
    // 生成间隔（随难度降低）
    getSpawnInterval() {
        // 从120帧逐渐降到30帧
        return Math.max(30, 120 - this.wave * 8);
    }
    
    // 最大敌人数
    getMaxEnemies() {
        return Math.min(50, 5 + this.wave * 3);
    }
    
    // 敌人类型概率
    getEnemyTypeProbabilities() {
        // 前期小鸡多，后期猪多
        const pigChance = Math.min(0.7, 0.3 + this.wave * 0.04);
        return {
            chick: 1 - pigChance,
            pig: pigChance,
            boss: this.wave % 5 === 0 ? 1 : 0 // 每5波可能出Boss
        };
    }
}

// ========== 掉落管理器 ==========
class DropManager {
    constructor() {
        this.dropRates = {
            expGem: 1.0,      // 必掉
            healthOrb: 0.05,  // 5%掉血球（回复1心）
            coin: 0.15,       // 15%掉金币
            weapon: 0.08,     // 8%掉武器
            item: 0.10        // 10%掉道具
        };
    }
    
    // 计算掉落
    calculateDrop(enemyType, enemyLevel, playerLuck = 0) {
        const drops = [];
        
        // 必掉经验
        const expValue = enemyType === 'boss' ? 50 : 
                        enemyType === 'pig' ? 12 : 8;
        drops.push({ type: 'exp', value: expValue });
        
        // 幸运加成
        const luckBonus = playerLuck * 0.05;
        
        // 血球（低血时概率提升）
        if (Math.random() < this.dropRates.healthOrb + luckBonus) {
            drops.push({ type: 'health' });
        }
        
        // 金币
        if (Math.random() < this.dropRates.coin + luckBonus) {
            const coinValue = enemyType === 'boss' ? 20 : 
                             enemyType === 'pig' ? 3 : 1;
            drops.push({ type: 'coin', value: coinValue });
        }
        
        // 武器
        if (Math.random() < this.dropRates.weapon + luckBonus) {
            const weapons = Object.keys(WEAPONS);
            drops.push({ type: 'weapon', key: weapons[Math.floor(Math.random() * weapons.length)] });
        }
        
        // 道具
        if (Math.random() < this.dropRates.item + luckBonus) {
            const items = Object.keys(ITEMS);
            drops.push({ type: 'item', key: items[Math.floor(Math.random() * items.length)] });
        }
        
        return drops;
    }
}

// ========== 升级平衡 ==========
class ProgressionManager {
    constructor() {
        // 经验需求曲线
        this.expCurve = [100, 150, 220, 310, 420, 550, 700, 880, 1100, 1350];
    }
    
    getExpToLevel(level) {
        if (level <= this.expCurve.length) {
            return this.expCurve[level - 1];
        }
        // 超出预设曲线后指数增长
        return Math.floor(1350 * Math.pow(1.3, level - 10));
    }
    
    // 升级奖励选项（根据当前状态调整）
    getUpgradeOptions(player, count = 3) {
        const options = [];
        const available = Object.keys(ITEMS);
        
        // 根据玩家状态推荐
        const needs = [];
        if (player.hp <= 1) needs.push('heart');      // 低血推荐血量
        if (player.damage < 3) needs.push('milk');    // 低伤害推荐攻击
        if (player.speed < 5) needs.push('boots');    // 低速推荐速度
        
        // 优先加入需要的道具
        for (let need of needs) {
            if (options.length < count && available.includes(need)) {
                options.push(need);
            }
        }
        
        // 随机填充剩余选项
        while (options.length < count) {
            const random = available[Math.floor(Math.random() * available.length)];
            if (!options.includes(random)) {
                options.push(random);
            }
        }
        
        return options;
    }
}

// ========== 武器平衡 ==========
const WEAPON_BALANCE = {
    milk: {
        dps: 10,        // 理论每秒伤害
        burst: 8,       // 爆发能力
        control: 5,     // 控制能力
        ease: 10        // 易用性
    },
    spread: {
        dps: 12,
        burst: 10,
        control: 8,
        ease: 7
    },
    rapid: {
        dps: 15,
        burst: 12,
        control: 4,
        ease: 6
    },
    pierce: {
        dps: 8,
        burst: 6,
        control: 9,
        ease: 7
    },
    homing: {
        dps: 9,
        burst: 7,
        control: 10,
        ease: 9
    },
    burst: {
        dps: 14,
        burst: 15,
        control: 3,
        ease: 4
    }
};

// 武器建议（根据玩家水平推荐）
function getWeaponRecommendation(skillLevel) {
    // skillLevel: 0-10 (新手到高手)
    if (skillLevel < 4) {
        return ['homing', 'milk', 'pierce']; // 新手友好
    } else if (skillLevel < 7) {
        return ['spread', 'burst', 'rapid']; // 中等
    } else {
        return ['burst', 'rapid', 'spread']; // 高手向
    }
}

// ========== 经济平衡 ==========
class EconomyManager {
    constructor() {
        this.shopPrices = {
            heart: 15,
            milk: 20,
            clover: 25,
            bell: 20,
            boots: 25,
            horn: 30
        };
    }
    
    // 商店刷新价格
    getShopRefreshCost(wave) {
        return 5 + wave * 2;
    }
    
    // 动态定价（根据玩家财富调整）
    getDynamicPrice(basePrice, playerCoins) {
        // 玩家钱多就贵一点
        const wealthFactor = Math.min(2, 1 + playerCoins / 100);
        return Math.floor(basePrice * wealthFactor);
    }
}

// ========== 测试和调试工具 ==========
class DebugTools {
    constructor(game) {
        this.game = game;
        this.enabled = false;
    }
    
    toggle() {
        this.enabled = !this.enabled;
    }
    
    draw(ctx) {
        if (!this.enabled) return;
        
        const y = 100;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(10, y, 300, 200);
        
        ctx.fillStyle = '#0F0';
        ctx.font = '12px monospace';
        let line = 0;
        
        const drawLine = (text) => {
            ctx.fillText(text, 20, y + 20 + line * 15);
            line++;
        };
        
        drawLine(`=== DEBUG ===`);
        drawLine(`FPS: ${Math.round(1000 / 16)}`); // 估算
        drawLine(`Entities: ${this.game.enemies.length + this.game.bullets.length}`);
        drawLine(`Wave: ${this.game.wave}`);
        drawLine(`Difficulty: ${this.game.difficulty.difficultyMultiplier.toFixed(2)}x`);
        drawLine(`Player DPS: ${(this.game.player.damage * 60 / this.game.player.attackSpeed).toFixed(1)}`);
        drawLine(`Spawn Rate: ${this.game.difficulty.getSpawnInterval()}`);
        
        // 按F3切换
    }
}

// 按键监听（F3切换调试）
window.addEventListener('keydown', (e) => {
    if (e.key === 'F3' && window.gameInstance) {
        window.gameInstance.debugTools.toggle();
    }
});

console.log('Balance system loaded');
console.log('Press F3 to toggle debug mode');
