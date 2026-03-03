# 道具系统重构设计 v4.0 - 效果实装方案

## 1. 核心架构代码

### 道具系统主类
```javascript
class ItemSystem {
    constructor() {
        // 每层道具池
        this.floorPools = new Map();
        
        // 已获得的道具
        this.acquiredItems = [];
        
        // 当前层
        this.currentFloor = 1;
        
        // 统计
        this.stats = {
            itemsAcquired: 0,
            totalGoldSpent: 0,
            highestRarity: null
        };
    }
    
    // 初始化层道具池
    initFloorPool(floor) {
        this.currentFloor = floor;
        const pool = {
            common: [...ITEM_DATABASE.common],
            uncommon: [...ITEM_DATABASE.uncommon],
            rare: [...ITEM_DATABASE.rare],
            epic: [...ITEM_DATABASE.epic],
            legendary: [...ITEM_DATABASE.legendary],
            cursed: [...ITEM_DATABASE.cursed],
            mythic: [...ITEM_DATABASE.mythic]
        };
        
        // 打乱并截取
        const sizes = FLOOR_POOL_SIZES[floor];
        for (const rarity of Object.keys(pool)) {
            pool[rarity] = this.shuffle(pool[rarity]).slice(0, sizes[rarity] || 0);
        }
        
        this.floorPools.set(floor, pool);
    }
    
    // 抽取道具
    drawItem(preferredRarity = null) {
        const pool = this.floorPools.get(this.currentFloor);
        
        // 确定稀有度
        let rarity = preferredRarity || this.rollRarity();
        
        // 如果该稀有度池子空了，尝试降级
        while (pool[rarity].length === 0) {
            rarity = this.getLowerRarity(rarity);
            if (!rarity) return null;
        }
        
        // 从池子中移除并返回
        const item = pool[rarity].shift();
        return { ...item, uniqueId: this.generateUniqueId() };
    }
    
    // 获取道具
    acquireItem(item, source = 'unknown') {
        // 检查是否已拥有
        if (this.hasItem(item.id)) {
            console.warn(`已拥有道具: ${item.name}`);
            return false;
        }
        
        // 添加到已获得列表
        this.acquiredItems.push({
            ...item,
            acquiredAt: Date.now(),
            source,
            floor: this.currentFloor
        });
        
        // 应用效果
        this.applyItemEffect(item);
        
        // 更新统计
        this.stats.itemsAcquired++;
        if (RARITY_ORDER.indexOf(item.rarity) > RARITY_ORDER.indexOf(this.stats.highestRarity || 'common')) {
            this.stats.highestRarity = item.rarity;
        }
        
        // 播放特效
        this.playAcquireEffect(item);
        
        return true;
    }
    
    // 应用道具效果
    applyItemEffect(item) {
        const effect = item.effect;
        const player = window.game.player;
        
        switch (effect.type) {
            // ========== 基础属性 ==========
            case 'damage_up':
                player.bonuses.damage = (player.bonuses.damage || 0) + effect.value;
                break;
                
            case 'attack_speed':
                player.bonuses.attackSpeed = (player.bonuses.attackSpeed || 0) + effect.value;
                break;
                
            case 'range_up':
                player.bonuses.range = (player.bonuses.range || 0) + effect.value;
                break;
                
            case 'crit_chance':
                player.bonuses.critChance = (player.bonuses.critChance || 0) + effect.value;
                break;
                
            case 'crit_damage':
                player.bonuses.critDamage = (player.bonuses.critDamage || 0) + effect.value;
                break;
                
            case 'move_speed':
                player.bonuses.moveSpeed = (player.bonuses.moveSpeed || 0) + effect.value;
                break;
                
            // ========== 防御生存 ==========
            case 'max_hp':
                player.maxHp += effect.value;
                player.hp += effect.value; // 满血获得时加当前生命
                break;
                
            case 'armor':
                player.bonuses.armor = (player.bonuses.armor || 0) + effect.value;
                break;
                
            case 'regen':
                player.bonuses.regen = (player.bonuses.regen || 0) + effect.value;
                break;
                
            case 'dodge':
                player.bonuses.dodge = (player.bonuses.dodge || 0) + effect.value;
                break;
                
            case 'shield':
                player.bonuses.shieldLayers = (player.bonuses.shieldLayers || 0) + effect.value;
                break;
                
            // ========== 武器改造 ==========
            case 'multishot':
                player.bonuses.multishot = (player.bonuses.multishot || 0) + effect.value;
                break;
                
            case 'pierce':
                player.bonuses.pierce = (player.bonuses.pierce || 0) + effect.value;
                break;
                
            case 'bounce':
                player.bonuses.bounce = (player.bonuses.bounce || 0) + effect.value;
                break;
                
            case 'homing':
                player.bonuses.homing = (player.bonuses.homing || 0) + effect.value;
                break;
                
            case 'cooldown':
                player.bonuses.cooldown = (player.bonuses.cooldown || 0) + effect.value;
                break;
                
            // ========== 特殊效果 ==========
            case 'life_steal':
                player.bonuses.lifeSteal = (player.bonuses.lifeSteal || 0) + effect.value;
                break;
                
            case 'weapon_slot':
                player.maxWeapons = (player.maxWeapons || 6) + effect.value;
                break;
                
            case 'revive':
                player.bonuses.reviveCount = (player.bonuses.reviveCount || 0) + 1;
                break;
                
            // ... 更多效果类型
        }
    }
}
```

### 效果管理器
```javascript
class ItemEffectManager {
    constructor() {
        // 被动效果（持续生效）
        this.passiveEffects = [];
        
        // 触发效果（条件触发）
        this.triggerEffects = [];
        
        // 主动效果（按键使用）
        this.activeEffects = [];
        
        // 定时器
        this.timers = new Map();
    }
    
    // 注册效果
    registerEffect(item) {
        const effect = item.effect;
        
        // 分类存储
        if (this.isPassiveEffect(effect)) {
            this.passiveEffects.push({ item, effect });
        } else if (this.isTriggerEffect(effect)) {
            this.triggerEffects.push({ item, effect });
        } else if (this.isActiveEffect(effect)) {
            this.activeEffects.push({ item, effect });
        }
        
        // 设置定时器（如果需要）
        if (effect.interval) {
            this.startIntervalEffect(item, effect);
        }
    }
    
    // 被动效果检查
    isPassiveEffect(effect) {
        const passiveTypes = [
            'damage_up', 'attack_speed', 'range_up', 'crit_chance', 'crit_damage',
            'move_speed', 'max_hp', 'armor', 'regen', 'dodge', 'shield',
            'multishot', 'pierce', 'bounce', 'homing', 'cooldown',
            'life_steal', 'gold_bonus', 'exp_bonus'
        ];
        return passiveTypes.includes(effect.type);
    }
    
    // 触发效果检查
    isTriggerEffect(effect) {
        const triggerTypes = [
            'auto_heal', 'shield_regen', 'death_defy', 'midas_touch',
            'necromancy', 'periodic_invincible', 'thorn', 'execute'
        ];
        return triggerTypes.includes(effect.type);
    }
    
    // 主动效果检查
    isActiveEffect(effect) {
        return effect.type.startsWith('active_');
    }
    
    // 开始定时效果
    startIntervalEffect(item, effect) {
        const timer = setInterval(() => {
            this.triggerEffect(item, effect);
        }, effect.interval * 1000);
        
        this.timers.set(item.uniqueId, timer);
    }
    
    // 触发效果
    triggerEffect(item, effect) {
        const player = window.game.player;
        
        switch (effect.type) {
            case 'auto_heal':
                if (player.hp / player.maxHp <= effect.threshold) {
                    player.hp += player.maxHp * effect.heal;
                    player.hp = Math.min(player.hp, player.maxHp);
                    this.showEffectText(player, '自动治疗!');
                }
                break;
                
            case 'shield_regen':
                player.bonuses.tempShield = (player.bonuses.tempShield || 0) + effect.value;
                this.showEffectText(player, '+护盾');
                break;
                
            case 'periodic_invincible':
                player.addBuff('invincible', effect.duration);
                this.showEffectText(player, '无敌!');
                break;
        }
    }
    
    // 显示效果文字
    showEffectText(target, text) {
        window.game.damageNumbers.spawn(target.x, target.y - 30, text, {
            color: '#4ff',
            size: 12,
            life: 1
        });
    }
}
```

## 2. 与现有系统集成

### 修改玩家类
```javascript
// 在PlayerManager或Player类中添加
class Player {
    constructor() {
        // ... 原有属性
        
        // 道具加成
        this.bonuses = {
            damage: 0,
            attackSpeed: 0,
            range: 0,
            critChance: 0,
            critDamage: 0.5, // 基础暴击伤害150%
            moveSpeed: 0,
            armor: 0,
            regen: 0,
            dodge: 0,
            shieldLayers: 0,
            multishot: 0,
            pierce: 0,
            bounce: 0,
            homing: 0,
            cooldown: 0,
            lifeSteal: 0,
            goldBonus: 0,
            expBonus: 0
        };
        
        // 最大武器槽
        this.maxWeapons = 6;
    }
    
    // 获取总属性（基础+道具加成）
    getTotalDamage(baseDamage) {
        return baseDamage * (1 + this.bonuses.damage);
    }
    
    getTotalAttackSpeed(baseSpeed) {
        return baseSpeed * (1 + this.bonuses.attackSpeed);
    }
    
    // 检查闪避
    checkDodge() {
        return Math.random() < this.bonuses.dodge;
    }
    
    // 检查暴击
    checkCrit() {
        return Math.random() < this.bonuses.critChance;
    }
}
```

### 修改武器系统
```javascript
class Weapon {
    getModifiedStats(player) {
        return {
            damage: player.getTotalDamage(this.cfg.dmg),
            attackSpeed: player.getTotalAttackSpeed(this.cfg.cd),
            range: this.cfg.range * (1 + player.bonuses.range),
            pierce: (this.cfg.pierce || 0) + player.bonuses.pierce,
            bounce: (this.cfg.bounce || 0) + player.bonuses.bounce,
            multishot: player.bonuses.multishot,
            homing: player.bonuses.homing > 0,
            critChance: player.bonuses.critChance,
            critDamage: player.bonuses.critDamage
        };
    }
}
```

### 修改伤害计算
```javascript
function calculateDamage(source, target, baseDamage, isCrit = false) {
    let damage = baseDamage;
    
    // 应用道具加成
    if (source.bonuses) {
        damage = damage * (1 + source.bonuses.damage);
        
        // 暴击
        if (isCrit || source.checkCrit?.()) {
            damage = damage * (1.5 + source.bonuses.critDamage);
        }
        
        // 处决
        if (source.bonuses.execute && target.hp / target.maxHp <= source.bonuses.execute) {
            damage = damage * 2;
        }
    }
    
    // 护甲减伤
    if (target.bonuses?.armor) {
        damage = Math.max(1, damage - target.bonuses.armor);
    }
    
    return Math.floor(damage);
}
```

## 3. 商店集成

```javascript
class ShopSystem {
    constructor() {
        this.items = []; // 当前商品
        this.refreshCount = 0;
    }
    
    // 生成商店商品
    generateItems(floor) {
        const count = SHOP_ITEM_COUNTS[floor];
        const guarantee = SHOP_GUARANTEES[floor];
        
        this.items = [];
        
        for (let i = 0; i < count; i++) {
            // 至少一个高稀有度
            let rarity;
            if (i === 0 && guarantee.maxRarity) {
                rarity = this.rollHighRarity(guarantee.minRarity, guarantee.maxRarity);
            } else {
                rarity = window.game.itemSystem.rollRarity();
            }
            
            const item = window.game.itemSystem.drawItem(rarity);
            if (item) {
                this.items.push({
                    ...item,
                    price: this.calculatePrice(item)
                });
            }
        }
    }
    
    // 计算价格
    calculatePrice(item) {
        const basePrice = ITEM_PRICES[item.id] || 100;
        const refreshPenalty = this.refreshCount * 0.1; // 每次刷新涨价10%
        return Math.floor(basePrice * (1 + refreshPenalty));
    }
    
    // 购买
    buyItem(index) {
        const item = this.items[index];
        if (!item) return false;
        
        if (window.game.player.gold < item.price) {
            window.game.showMessage('金币不足!');
            return false;
        }
        
        if (window.game.itemSystem.hasItem(item.id)) {
            window.game.showMessage('已拥有该道具!');
            return false;
        }
        
        // 扣钱给道具
        window.game.player.gold -= item.price;
        window.game.itemSystem.acquireItem(item, 'shop');
        window.game.itemSystem.stats.totalGoldSpent += item.price;
        
        // 移除商品
        this.items.splice(index, 1);
        
        return true;
    }
}
```

## 4. 掉落集成

```javascript
class DropSystem {
    // 敌人死亡掉落
    onEnemyDeath(enemy) {
        const dropChance = this.getDropChance(enemy);
        
        if (Math.random() < dropChance) {
            const rarity = this.getDropRarity(enemy);
            const item = window.game.itemSystem.drawItem(rarity);
            
            if (item) {
                // 创建掉落物
                window.game.spawnItemDrop(enemy.x, enemy.y, item);
            }
        }
    }
    
    // 获取掉落率
    getDropChance(enemy) {
        let base = 0.05; // 基础5%
        
        switch (enemy.tier) {
            case 2: base = 0.15; break;
            case 3: base = 0.50; break;
            case 4: base = 1.0; break;
        }
        
        // 应用道具加成
        const bonus = window.game.player.bonuses.dropRate || 0;
        return Math.min(1, base * (1 + bonus));
    }
}
```

## 5. 本轮完成

- [x] 道具系统核心类
- [x] 效果管理器
- [x] 与玩家系统集成
- [x] 与武器系统集成
- [x] 商店集成方案
- [x] 掉落集成方案

---
*第四轮完成 - 2026-03-02*
