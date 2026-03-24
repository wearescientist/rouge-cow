// 肉鸽牛牛 v12.0 - 武器升级系统
// 武器可以升级变强，有等级和品质

// ========== 武器升级系统 ==========

class WeaponSystem {
    constructor() {
        this.weapons = {
            milk: { level: 1, exp: 0, quality: 'common' },
            spread: { level: 1, exp: 0, quality: 'common' },
            rapid: { level: 1, exp: 0, quality: 'common' },
            pierce: { level: 1, exp: 0, quality: 'common' },
            homing: { level: 1, exp: 0, quality: 'common' },
            burst: { level: 1, exp: 0, quality: 'common' }
        };
        this.currentWeapon = 'milk';
        this.weaponExpRate = 0.3; // 获得经验的比例
    }
    
    // 武器获得经验（使用时）
    gainWeaponExp(weaponKey, expAmount) {
        const weapon = this.weapons[weaponKey];
        if (!weapon) return;
        
        weapon.exp += expAmount * this.weaponExpRate;
        
        // 检查升级
        const expNeeded = this.getExpToLevel(weapon.level);
        if (weapon.exp >= expNeeded) {
            weapon.exp -= expNeeded;
            this.levelUpWeapon(weaponKey);
        }
    }
    
    getExpToLevel(level) {
        // 指数增长
        return Math.floor(100 * Math.pow(1.5, level - 1));
    }
    
    levelUpWeapon(weaponKey) {
        const weapon = this.weapons[weaponKey];
        weapon.level++;
        
        // 每5级提升品质
        if (weapon.level % 5 === 0) {
            this.upgradeQuality(weaponKey);
        }
        
        // 升级特效
        if (window.gameInstance) {
            window.gameInstance.showWeaponLevelUp(weaponKey, weapon.level);
        }
        
        console.log(`武器 ${WEAPONS[weaponKey].name} 升级到 Lv.${weapon.level}!`);
    }
    
    upgradeQuality(weaponKey) {
        const qualities = ['common', 'rare', 'epic', 'legendary'];
        const weapon = this.weapons[weaponKey];
        const currentIdx = qualities.indexOf(weapon.quality);
        
        if (currentIdx < qualities.length - 1) {
            weapon.quality = qualities[currentIdx + 1];
            console.log(`武器品质提升到 ${weapon.quality}!`);
        }
    }
    
    // 获取当前武器实际属性（基础值 × 等级加成 × 品质加成）
    getWeaponStats(weaponKey) {
        const base = WEAPONS[weaponKey];
        const weapon = this.weapons[weaponKey];
        
        // 等级加成：每级+5%伤害，-2%冷却（最多-50%）
        const levelMultiplier = 1 + (weapon.level - 1) * 0.05;
        const cooldownReduction = Math.min(0.5, (weapon.level - 1) * 0.02);
        
        // 品质加成
        const qualityMultipliers = {
            common: 1.0,
            rare: 1.2,
            epic: 1.5,
            legendary: 2.0
        };
        const qualityMult = qualityMultipliers[weapon.quality];
        
        return {
            damage: base.damage * levelMultiplier * qualityMult,
            fireRate: Math.max(5, base.fireRate * (1 - cooldownReduction)),
            pierce: base.pierce + Math.floor((weapon.level - 1) / 3), // 每3级+1穿透
            projectileCount: base.projectileCount + Math.floor((weapon.level - 1) / 10), // 每10级+1弹量
            color: this.getQualityColor(weapon.quality)
        };
    }
    
    getQualityColor(quality) {
        const colors = {
            common: '#95A5A6',
            rare: '#3498DB',
            epic: '#9B59B6',
            legendary: '#F1C40F'
        };
        return colors[quality] || '#FFF';
    }
    
    // 切换武器
    switchWeapon(weaponKey) {
        if (this.weapons[weaponKey]) {
            this.currentWeapon = weaponKey;
            return true;
        }
        return false;
    }
    
    // 融合两把武器（高级功能）
    fuseWeapons(weapon1, weapon2) {
        // 需要特定条件才能融合
        const w1 = this.weapons[weapon1];
        const w2 = this.weapons[weapon2];
        
        if (w1.level >= 10 && w2.level >= 10) {
            // 创建混合武器
            console.log(`融合 ${weapon1} 和 ${weapon2}...`);
            // 实现混合逻辑
            return true;
        }
        return false;
    }
}

// ========== 武器精通系统 ==========
class WeaponMastery {
    constructor() {
        this.masteries = {
            milk: { kills: 0, masteryLevel: 0 },
            spread: { kills: 0, masteryLevel: 0 },
            rapid: { kills: 0, masteryLevel: 0 },
            pierce: { kills: 0, masteryLevel: 0 },
            homing: { kills: 0, masteryLevel: 0 },
            burst: { kills: 0, masteryLevel: 0 }
        };
        
        this.masteryBonuses = {
            1: { name: '初学者', bonus: 'damage', value: 0.1 },
            2: { name: '熟练者', bonus: 'critChance', value: 0.05 },
            3: { name: '专家', bonus: 'pierce', value: 1 },
            4: { name: '大师', bonus: 'specialEffect', value: null },
            5: { name: '宗师', bonus: 'allStats', value: 0.2 }
        };
    }
    
    recordKill(weaponKey) {
        const m = this.masteries[weaponKey];
        if (!m) return;
        
        m.kills++;
        
        // 检查精通等级提升
        const killsNeeded = [10, 50, 100, 250, 500];
        if (m.masteryLevel < killsNeeded.length && m.kills >= killsNeeded[m.masteryLevel]) {
            m.masteryLevel++;
            this.applyMasteryBonus(weaponKey, m.masteryLevel);
        }
    }
    
    applyMasteryBonus(weaponKey, level) {
        const bonus = this.masteryBonuses[level];
        console.log(`${WEAPONS[weaponKey].name} 精通等级提升！获得：${bonus.name}`);
        // 实际加成在玩家属性中应用
    }
    
    getMasteryStats(weaponKey) {
        const m = this.masteries[weaponKey];
        if (!m || m.masteryLevel === 0) return {};
        
        const stats = {};
        for (let i = 1; i <= m.masteryLevel; i++) {
            const bonus = this.masteryBonuses[i];
            if (bonus.bonus === 'allStats') {
                stats.damage = (stats.damage || 0) + bonus.value;
                stats.critChance = (stats.critChance || 0) + 0.05;
            } else {
                stats[bonus.bonus] = (stats[bonus.bonus] || 0) + bonus.value;
            }
        }
        return stats;
    }
}

// ========== 武器皮肤系统 ==========
class WeaponSkins {
    constructor() {
        this.skins = {
            milk: ['default', 'golden', 'void', 'rainbow'],
            spread: ['default', 'fire', 'ice', 'nature'],
            rapid: ['default', 'laser', 'bubble', 'shadow'],
            pierce: ['default', 'lightning', 'crystal', 'bone'],
            homing: ['default', 'star', 'heart', 'demon'],
            burst: ['default', 'explosion', 'time', 'galaxy']
        };
        this.unlockedSkins = {
            milk: ['default'],
            spread: ['default'],
            rapid: ['default'],
            pierce: ['default'],
            homing: ['default'],
            burst: ['default']
        };
        this.equippedSkins = {
            milk: 'default',
            spread: 'default',
            rapid: 'default',
            pierce: 'default',
            homing: 'default',
            burst: 'default'
        };
    }
    
    unlockSkin(weapon, skin) {
        if (this.skins[weapon] && this.skins[weapon].includes(skin)) {
            if (!this.unlockedSkins[weapon].includes(skin)) {
                this.unlockedSkins[weapon].push(skin);
                return true;
            }
        }
        return false;
    }
    
    equipSkin(weapon, skin) {
        if (this.unlockedSkins[weapon].includes(skin)) {
            this.equippedSkins[weapon] = skin;
            return true;
        }
        return false;
    }
    
    getBulletVisual(weapon) {
        const skin = this.equippedSkins[weapon];
        const visuals = {
            default: { color: WEAPONS[weapon].color, shape: 'circle' },
            golden: { color: '#FFD700', shape: 'star', glow: true },
            void: { color: '#2C3E50', shape: 'void', trail: true },
            rainbow: { color: 'rainbow', shape: 'circle', rainbow: true },
            fire: { color: '#E74C3C', shape: 'fire', particle: true },
            ice: { color: '#AED6F1', shape: 'crystal', slow: true },
            laser: { color: '#E74C3C', shape: 'beam', pierce: true }
        };
        return visuals[skin] || visuals.default;
    }
}

// ========== 武器对比UI ==========
class WeaponCompareUI {
    static showComparison(weapon1, weapon2, system) {
        const stats1 = system.getWeaponStats(weapon1);
        const stats2 = system.getWeaponStats(weapon2);
        
        return {
            weapon1: { key: weapon1, ...stats1 },
            weapon2: { key: weapon2, ...stats2 },
            betterDamage: stats1.damage > stats2.damage ? 1 : 2,
            betterSpeed: stats1.fireRate < stats2.fireRate ? 1 : 2
        };
    }
}

// ========== 集成到游戏 ==========
class WeaponManager {
    constructor() {
        this.system = new WeaponSystem();
        this.mastery = new WeaponMastery();
        this.skins = new WeaponSkins();
    }
    
    // 玩家使用武器击杀
    onWeaponKill(weaponKey) {
        this.system.gainWeaponExp(weaponKey, 10);
        this.mastery.recordKill(weaponKey);
    }
    
    // 获取当前武器完整属性
    getCurrentWeaponStats() {
        const baseStats = this.system.getWeaponStats(this.system.currentWeapon);
        const masteryStats = this.mastery.getMasteryStats(this.system.currentWeapon);
        
        return {
            ...baseStats,
            damage: baseStats.damage * (1 + (masteryStats.damage || 0)),
            critChance: masteryStats.critChance || 0,
            pierce: baseStats.pierce + (masteryStats.pierce || 0),
            visual: this.skins.getBulletVisual(this.system.currentWeapon)
        };
    }
}

console.log('Weapon upgrade system loaded');
console.log('Features: Level up, Quality tiers, Mastery, Skins');
