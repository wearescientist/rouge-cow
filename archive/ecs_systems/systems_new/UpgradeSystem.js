/**
 * UpgradeSystem - 升级系统
 * 处理升级时的选择界面（武器升级、被动道具、属性提升）
 */

class UpgradeSystem {
    constructor(world) {
        this.world = world;
        this.priority = 50;
        this.enabled = true;
        
        // 升级选项配置
        this.config = {
            optionsCount: 3,  // 每次升级显示的选项数量
            rerollCost: 50,   // 刷新选项的金币消耗
            canReroll: true
        };
        
        // 当前升级选项
        this.currentOptions = [];
        this.isShowingUpgrade = false;
        
        // 数据管理器引用
        this.dataManager = null;
    }
    
    init() {
        // 监听升级事件
        this.world.on('levelUp', (data) => {
            this.onPlayerLevelUp(data.entity, data.level);
        });
    }
    
    /**
     * 玩家升级时的处理
     */
    onPlayerLevelUp(player, level) {
        // 暂停游戏
        this.world.pause();
        this.isShowingUpgrade = true;
        
        // 生成升级选项
        this.currentOptions = this.generateUpgradeOptions(player);
        
        // 显示升级界面
        this.showUpgradeUI(player);
        
        console.log(`Level up! Generated ${this.currentOptions.length} upgrade options`);
    }
    
    /**
     * 生成升级选项
     */
    generateUpgradeOptions(player) {
        const options = [];
        const playerComp = player.get(PlayerComponent);
        
        if (!playerComp) return options;
        
        // 1. 检查武器栏是否有空位或可以升级的武器
        const weaponOptions = this.getWeaponUpgradeOptions(player, playerComp);
        options.push(...weaponOptions);
        
        // 2. 检查被动道具
        const passiveOptions = this.getPassiveOptions(player, playerComp);
        options.push(...passiveOptions);
        
        // 3. 属性提升选项（保底）
        const statOptions = this.getStatUpgradeOptions();
        options.push(...statOptions);
        
        // 随机选择指定数量的选项
        return this.shuffleArray(options).slice(0, this.config.optionsCount);
    }
    
    /**
     * 获取武器升级选项
     */
    getWeaponUpgradeOptions(player, playerComp) {
        const options = [];
        
        // 检查现有武器是否可以升级
        for (let i = 0; i < playerComp.weaponSlots.length; i++) {
            const weaponData = playerComp.weaponSlots[i];
            if (weaponData && weaponData.level < 5) {
                options.push({
                    type: 'weapon_upgrade',
                    slot: i,
                    weaponId: weaponData.weaponId,
                    currentLevel: weaponData.level,
                    nextLevel: weaponData.level + 1,
                    name: `升级武器`,
                    description: `${weaponData.weaponId} Lv.${weaponData.level} → Lv.${weaponData.level + 1}`,
                    icon: '⬆️'
                });
            }
        }
        
        // 检查是否有空武器栏
        const emptySlot = playerComp.weaponSlots.findIndex(w => w === null);
        if (emptySlot !== -1) {
            // 提供新武器选项
            const availableWeapons = ['sword', 'bow', 'spear', 'dagger', 'magicWand'];
            const randomWeapon = availableWeapons[Math.floor(Math.random() * availableWeapons.length)];
            
            options.push({
                type: 'new_weapon',
                slot: emptySlot,
                weaponId: randomWeapon,
                name: '新武器',
                description: `获得新的武器: ${randomWeapon}`,
                icon: '🆕'
            });
        }
        
        return options;
    }
    
    /**
     * 获取被动道具选项
     */
    getPassiveOptions(player, playerComp) {
        const options = [];
        const passives = playerComp.passives || [];
        
        // 获取数据管理器
        if (!this.dataManager) {
            // 尝试从全局获取
            this.dataManager = window.game?.dataManager;
        }
        
        // 检查现有被动是否可以升级
        for (const passive of passives) {
            const passiveData = this.dataManager?.getPassive(passive.id);
            if (passiveData && passive.level < passiveData.maxLevel) {
                options.push({
                    type: 'passive_upgrade',
                    passiveId: passive.id,
                    currentLevel: passive.level,
                    nextLevel: passive.level + 1,
                    name: passiveData.name,
                    description: `${passiveData.description} (Lv.${passive.level} → Lv.${passive.level + 1})`,
                    icon: passiveData.icon || '✨'
                });
            }
        }
        
        // 检查是否可以添加新被动
        if (passives.length < 6) {  // 最多6个被动
            const availablePassives = ['power_glove', 'swift_boots', 'vitality_amulet', 
                                       'critical_ring', 'magnet', 'life_steal_charm'];
            
            // 过滤掉已有的
            const existingIds = passives.map(p => p.id);
            const newOptions = availablePassives.filter(id => !existingIds.includes(id));
            
            if (newOptions.length > 0) {
                const randomPassive = newOptions[Math.floor(Math.random() * newOptions.length)];
                const passiveData = this.dataManager?.getPassive(randomPassive);
                
                options.push({
                    type: 'new_passive',
                    passiveId: randomPassive,
                    name: passiveData?.name || '新被动',
                    description: passiveData?.description || '获得新的被动效果',
                    icon: passiveData?.icon || '✨'
                });
            }
        }
        
        return options;
    }
    
    /**
     * 获取属性提升选项（保底选项）
     */
    getStatUpgradeOptions() {
        return [
            {
                type: 'stat_upgrade',
                stat: 'maxHealth',
                value: 20,
                name: '生命值提升',
                description: '最大生命值 +20',
                icon: '❤️'
            },
            {
                type: 'stat_upgrade',
                stat: 'damage',
                value: 5,
                name: '攻击力提升',
                description: '攻击力 +5',
                icon: '⚔️'
            },
            {
                type: 'stat_upgrade',
                stat: 'speed',
                value: 10,
                name: '移速提升',
                description: '移动速度 +10',
                icon: '💨'
            }
        ];
    }
    
    /**
     * 显示升级UI
     */
    showUpgradeUI(player) {
        // 触发事件让UI系统显示升级界面
        this.world.emit('showUpgradeOptions', {
            player: player,
            options: this.currentOptions,
            canReroll: this.config.canReroll,
            rerollCost: this.config.rerollCost
        });
    }
    
    /**
     * 选择升级选项
     */
    selectOption(player, optionIndex) {
        if (optionIndex < 0 || optionIndex >= this.currentOptions.length) {
            return false;
        }
        
        const option = this.currentOptions[optionIndex];
        const playerComp = player.get(PlayerComponent);
        const weaponComp = player.get(WeaponComponent);
        
        if (!playerComp) return false;
        
        switch (option.type) {
            case 'weapon_upgrade':
                // 升级武器
                playerComp.weaponSlots[option.slot].level++;
                if (weaponComp && playerComp.activeWeaponSlot === option.slot) {
                    this.upgradeWeaponStats(weaponComp);
                }
                break;
                
            case 'new_weapon':
                // 装备新武器
                playerComp.weaponSlots[option.slot] = {
                    weaponId: option.weaponId,
                    level: 1
                };
                // 如果是第一个武器，自动装备
                if (playerComp.weaponSlots.filter(w => w).length === 1) {
                    playerComp.activeWeaponSlot = option.slot;
                    // 创建武器组件
                    const newWeapon = new WeaponComponent({
                        weaponId: option.weaponId,
                        level: 1
                    });
                    player.add(newWeapon);
                }
                break;
                
            case 'passive_upgrade':
                // 升级被动
                const passive = playerComp.passives.find(p => p.id === option.passiveId);
                if (passive) {
                    passive.level++;
                    this.applyPassiveEffect(player, option.passiveId, passive.level);
                }
                break;
                
            case 'new_passive':
                // 添加新被动
                if (!playerComp.passives) playerComp.passives = [];
                playerComp.passives.push({
                    id: option.passiveId,
                    level: 1
                });
                this.applyPassiveEffect(player, option.passiveId, 1);
                break;
                
            case 'stat_upgrade':
                // 提升属性
                this.applyStatUpgrade(player, option.stat, option.value);
                break;
        }
        
        // 关闭升级界面，恢复游戏
        this.isShowingUpgrade = false;
        this.world.start();
        
        // 触发选择事件
        this.world.emit('upgradeSelected', {
            player: player,
            option: option
        });
        
        return true;
    }
    
    /**
     * 升级武器属性
     */
    upgradeWeaponStats(weapon) {
        // 每级提升 20% 伤害
        weapon.damage *= 1.2;
        // 减少冷却
        weapon.cooldown *= 0.95;
        // 提升暴击
        weapon.criticalChance = Math.min(1, weapon.criticalChance + 0.05);
    }
    
    /**
     * 应用被动效果
     */
    applyPassiveEffect(player, passiveId, level) {
        const passiveData = this.dataManager?.getPassive(passiveId);
        if (!passiveData || !passiveData.effect) return;
        
        const effect = passiveData.effect;
        const value = effect.valuePerLevel * level;
        
        switch (effect.type) {
            case 'damage_multiplier':
                // 应用到武器
                const weapon = player.get(WeaponComponent);
                if (weapon) {
                    weapon.damage *= (1 + value);
                }
                break;
                
            case 'speed_multiplier':
                const movement = player.get(MovementComponent);
                if (movement) {
                    movement.speed *= (1 + value);
                    movement.maxSpeed *= (1 + value);
                }
                break;
                
            case 'health_multiplier':
                const health = player.get(HealthComponent);
                if (health) {
                    const bonus = Math.floor(health.maxHealth * value);
                    health.maxHealth += bonus;
                    health.currentHealth += bonus;
                }
                break;
                
            case 'crit_chance':
                const w = player.get(WeaponComponent);
                if (w) {
                    w.criticalChance += value;
                }
                break;
        }
    }
    
    /**
     * 应用属性提升
     */
    applyStatUpgrade(player, stat, value) {
        switch (stat) {
            case 'maxHealth':
                const health = player.get(HealthComponent);
                if (health) {
                    health.maxHealth += value;
                    health.currentHealth += value;
                }
                break;
                
            case 'damage':
                const weapon = player.get(WeaponComponent);
                if (weapon) {
                    weapon.damage += value;
                }
                break;
                
            case 'speed':
                const movement = player.get(MovementComponent);
                if (movement) {
                    movement.speed += value;
                    movement.maxSpeed += value;
                }
                break;
        }
    }
    
    /**
     * 刷新选项
     */
    rerollOptions(player) {
        // 检查金币是否足够
        const inventory = player.get(InventoryComponent);
        if (!inventory || inventory.gold < this.config.rerollCost) {
            return false;
        }
        
        // 扣除金币
        inventory.gold -= this.config.rerollCost;
        
        // 生成新选项
        this.currentOptions = this.generateUpgradeOptions(player);
        this.showUpgradeUI(player);
        
        return true;
    }
    
    /**
     * 数组随机打乱
     */
    shuffleArray(array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    }
    
    update(dt) {
        // 升级系统主要在事件触发时工作
    }
    
    destroy() {}
}

window.UpgradeSystem = UpgradeSystem;
