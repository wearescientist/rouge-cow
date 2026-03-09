/**
 * CraftingSystem - 超武合成系统
 * 武器满级+被动道具=超级武器
 * 双被动可合成终极武器
 */

class CraftingSystem {
    constructor(world) {
        this.world = world;
        this.priority = 45;
        this.enabled = true;
        
        // 合成配方
        this.recipes = new Map();
        
        // 合成特效
        this.craftingEffect = {
            duration: 3.0,
            particles: 100
        };
        
        this.initRecipes();
    }
    
    init() {
        // 监听升级事件检查可合成
        this.world.on('weaponMaxLevel', (data) => {
            this.checkCraftable(data.player, data.weaponId);
        });
        
        // 监听获得被动道具
        this.world.on('passiveAcquired', (data) => {
            this.checkAllCraftable(data.player);
        });
    }
    
    /**
     * 初始化合成配方
     */
    initRecipes() {
        // 单层合成：武器+被动=超武
        this.recipes.set('sword_power_glove', {
            result: 'holy_sword',
            name: '圣剑',
            description: '范围+100%，伤害+200%',
            weapon: 'sword',
            passive: 'power_glove',
            effects: {
                damageMultiplier: 3.0,
                rangeMultiplier: 2.0,
                special: 'holy_aura'
            }
        });
        
        this.recipes.set('dagger_swift_boots', {
            result: 'time_dagger',
            name: '时间切割者',
            description: '攻速+300%，可时停敌人',
            weapon: 'dagger',
            passive: 'swift_boots',
            effects: {
                attackSpeedMultiplier: 4.0,
                special: 'time_stop_proc'
            }
        });
        
        this.recipes.set('spear_vitality_amulet', {
            result: 'dragon_spear',
            name: '龙枪',
            description: '穿透+10，击中回血',
            weapon: 'spear',
            passive: 'vitality_amulet',
            effects: {
                pierce: 10,
                lifeSteal: 0.1,
                special: 'dragon_breath'
            }
        });
        
        this.recipes.set('bow_critical_ring', {
            result: 'artemis_bow',
            name: '阿尔忒弥斯之弓',
            description: '自动追踪，暴击率+50%',
            weapon: 'bow',
            passive: 'critical_ring',
            effects: {
                homing: true,
                criticalChance: 0.5,
                special: 'artemis_mark'
            }
        });
        
        this.recipes.set('staff_swift_boots', {
            result: 'archmage_staff',
            name: '大法师之杖',
            description: '自动追踪×3发，伤害+150%',
            weapon: 'staff',
            passive: 'swift_boots',
            effects: {
                projectileCount: 3,
                damageMultiplier: 2.5,
                homing: true
            }
        });
        
        this.recipes.set('greatsword_power_glove', {
            result: 'berserker_blade',
            name: '狂战士之刃',
            description: '伤害+400%，攻速-20%',
            weapon: 'greatsword',
            passive: 'power_glove',
            effects: {
                damageMultiplier: 5.0,
                attackSpeedMultiplier: 0.8,
                special: 'berserk_rage'
            }
        });
        
        this.recipes.set('crossbow_critical_ring', {
            result: 'sniper_crossbow',
            name: '神射手十字弩',
            description: '距离越远伤害越高，最高+500%',
            weapon: 'crossbow',
            passive: 'critical_ring',
            effects: {
                sniperBonus: 5.0,
                pierce: 5,
                special: 'headshot'
            }
        });
        
        this.recipes.set('fireStaff_fire_enchantment', {
            result: 'inferno_staff',
            name: '炼狱法杖',
            description: '火焰风暴，全屏燃烧',
            weapon: 'fireStaff',
            passive: 'fire_enchantment',
            effects: {
                areaDamage: true,
                areaRadius: 300,
                burnDamage: 50,
                special: 'inferno_nova'
            }
        });
        
        this.recipes.set('lightningRod_chain_lightning_rod', {
            result: 'thor_hammer',
            name: '雷神之锤',
            description: '连锁闪电弹射20次',
            weapon: 'lightningRod',
            passive: 'chain_lightning_rod',
            effects: {
                chainCount: 20,
                chainDamageReduction: 0.1,
                special: 'thor_wrath'
            }
        });
        
        this.recipes.set('iceStaff_ice_enchantment', {
            result: 'absolute_zero',
            name: '绝对零度',
            description: '冰冻一切，减速80%',
            weapon: 'iceStaff',
            passive: 'ice_enchantment',
            effects: {
                slow: 0.8,
                slowDuration: 5,
                pierce: 99,
                special: 'freeze_shatter'
            }
        });
        
        // 双层合成：超武+另一被动=终极武器
        this.recipes.set('holy_sword_vampire_fang', {
            result: 'excalibur',
            name: 'EX咖喱棒',
            description: '传说中的圣剑，伤害+1000%，击中吸血20%',
            weapon: 'holy_sword',
            passive: 'vampire_fang',
            isUltimate: true,
            effects: {
                damageMultiplier: 11.0,
                lifeSteal: 0.2,
                rangeMultiplier: 3.0,
                special: 'holy_nova'
            }
        });
        
        this.recipes.set('time_dagger_dodge_boots', {
            result: 'chrono_blade',
            name: '时空之刃',
            description: '操控时间，攻速+500%，50%概率时停敌人3秒',
            weapon: 'time_dagger',
            passive: 'dodge_boots',
            isUltimate: true,
            effects: {
                attackSpeedMultiplier: 6.0,
                timeStopChance: 0.5,
                special: 'time_warp'
            }
        });
        
        this.recipes.set('thor_hammer_lightning_enchantment', {
            result: 'storm_caller',
            name: '风暴召唤者',
            description: '召唤雷暴，全屏随机闪电',
            weapon: 'thor_hammer',
            passive: 'lightning_enchantment',
            isUltimate: true,
            effects: {
                stormDamage: 200,
                stormInterval: 0.5,
                special: 'thunderstorm'
            }
        });
        
        this.recipes.set('inferno_staff_burning_shield', {
            result: 'phoenix_rebirth',
            name: '凤凰涅槃',
            description: '死亡时满血复活，全屏火焰爆发',
            weapon: 'inferno_staff',
            passive: 'burning_shield',
            isUltimate: true,
            effects: {
                revive: true,
                reviveCooldown: 300,
                novaDamage: 1000,
                special: 'phoenix_nova'
            }
        });
    }
    
    /**
     * 检查特定武器是否可合成
     */
    checkCraftable(player, weaponId) {
        const weaponComp = player.get(WeaponComponent);
        if (!weaponComp) return null;
        
        // 获取玩家所有被动道具
        const playerComp = player.get(PlayerComponent);
        const passives = playerComp ? (playerComp.passives || []) : [];
        
        // 检查单层合成
        for (const [key, recipe] of this.recipes) {
            if (recipe.weapon === weaponId && !recipe.isUltimate) {
                // 检查是否有对应被动
                const hasPassive = passives.some(p => p.id === recipe.passive);
                if (hasPassive) {
                    this.showCraftableNotification(player, recipe);
                    return recipe;
                }
            }
        }
        
        // 检查双层合成（超武+另一被动）
        for (const [key, recipe] of this.recipes) {
            if (recipe.weapon === weaponId && recipe.isUltimate) {
                const hasPassive = passives.some(p => p.id === recipe.passive);
                if (hasPassive) {
                    this.showCraftableNotification(player, recipe);
                    return recipe;
                }
            }
        }
        
        return null;
    }
    
    /**
     * 检查所有可合成
     */
    checkAllCraftable(player) {
        const weaponComp = player.get(WeaponComponent);
        if (!weaponComp) return [];
        
        const craftables = [];
        
        // 获取当前武器和所有已装备武器
        const weapons = this.getAllPlayerWeapons(player);
        
        weapons.forEach(weapon => {
            const recipe = this.checkCraftable(player, weapon);
            if (recipe) {
                craftables.push({ weapon, recipe });
            }
        });
        
        return craftables;
    }
    
    /**
     * 执行合成
     */
    craft(player, weaponId, passiveId) {
        const recipeKey = `${weaponId}_${passiveId}`;
        const recipe = this.recipes.get(recipeKey);
        
        if (!recipe) {
            console.warn('No recipe found:', recipeKey);
            return false;
        }
        
        // 播放合成特效
        this.playCraftingEffect(player);
        
        // 应用新武器属性
        this.applyCraftedWeapon(player, recipe);
        
        // 移除消耗的被动（如果是单层合成）
        if (!recipe.isUltimate) {
            this.consumePassive(player, passiveId);
        }
        
        // 发送事件
        this.world.emit('weaponCrafted', {
            player,
            result: recipe.result,
            name: recipe.name,
            isUltimate: recipe.isUltimate || false
        });
        
        console.log(`Crafted: ${recipe.name}!`);
        return true;
    }
    
    /**
     * 应用合成后的武器
     */
    applyCraftedWeapon(player, recipe) {
        const weaponComp = player.get(WeaponComponent);
        if (!weaponComp) return;
        
        // 更新武器ID和名称
        weaponComp.weaponId = recipe.result;
        weaponComp.craftedName = recipe.name;
        weaponComp.isCrafted = true;
        weaponComp.isUltimate = recipe.isUltimate || false;
        
        // 应用效果
        const effects = recipe.effects;
        if (effects.damageMultiplier) {
            weaponComp.damage *= effects.damageMultiplier;
        }
        if (effects.attackSpeedMultiplier) {
            weaponComp.attackSpeed *= effects.attackSpeedMultiplier;
        }
        if (effects.rangeMultiplier) {
            weaponComp.range *= effects.rangeMultiplier;
        }
        if (effects.pierce !== undefined) {
            weaponComp.pierce = effects.pierce;
        }
        if (effects.homing !== undefined) {
            weaponComp.homing = effects.homing;
        }
        if (effects.criticalChance !== undefined) {
            weaponComp.criticalChance = effects.criticalChance;
        }
        if (effects.lifeSteal !== undefined) {
            weaponComp.lifeSteal = effects.lifeSteal;
        }
        if (effects.slow !== undefined) {
            weaponComp.slow = effects.slow;
            weaponComp.slowDuration = effects.slowDuration || 2;
        }
        
        // 特殊效果标记
        weaponComp.specialEffect = effects.special;
    }
    
    /**
     * 播放合成特效
     */
    playCraftingEffect(player) {
        const transform = player.get(TransformComponent);
        if (!transform) return;
        
        // 播放音效
        this.world.emit('playSound', 'craft');
        
        // 触发粒子特效
        const particleSystem = this.world.getSystem(ParticleSystem);
        if (particleSystem) {
            particleSystem.createExplosion(
                transform.x, 
                transform.y, 
                this.craftingEffect.particles,
                '#f1c40f'
            );
        }
        
        // 屏幕闪光
        const screenEffect = this.world.getSystem(ScreenEffectSystem);
        if (screenEffect) {
            screenEffect.flash('#f1c40f', 0.5);
        }
        
        // 时停效果
        this.world.emit('timeScale', 0.1, 0.5);
    }
    
    /**
     * 显示可合成提示
     */
    showCraftableNotification(player, recipe) {
        this.world.emit('craftableNotification', {
            player,
            recipe,
            message: `可合成: ${recipe.name}!`
        });
    }
    
    /**
     * 获取玩家所有武器
     */
    getAllPlayerWeapons(player) {
        // TODO: 支持多武器系统
        const weaponComp = player.get(WeaponComponent);
        return weaponComp ? [weaponComp.weaponId] : [];
    }
    
    /**
     * 消耗被动道具
     */
    consumePassive(player, passiveId) {
        const playerComp = player.get(PlayerComponent);
        if (!playerComp || !playerComp.passives) return;
        
        const index = playerComp.passives.findIndex(p => p.id === passiveId);
        if (index !== -1) {
            playerComp.passives.splice(index, 1);
        }
    }
    
    /**
     * 获取配方列表（用于UI显示）
     */
    getRecipesForUI() {
        const list = [];
        for (const [key, recipe] of this.recipes) {
            list.push({
                key,
                ...recipe
            });
        }
        return list;
    }
    
    update(dt) {
        // 持续检查可合成（被动道具可能通过其他方式获得）
        // 这里可以优化为事件驱动
    }
}

window.CraftingSystem = CraftingSystem;
