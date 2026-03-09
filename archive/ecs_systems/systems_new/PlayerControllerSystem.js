/**
 * PlayerControllerSystem - 玩家控制器系统
 * 处理玩家专属逻辑：移动、翻滚、攻击、武器切换
 */

class PlayerControllerSystem {
    constructor(world) {
        this.world = world;
        this.priority = 15;
        this.enabled = true;
        
        this.inputSystem = null;
        this.movementSystem = null;
        this.combatSystem = null;
    }
    
    init() {
        this.inputSystem = this.world.getSystem(InputSystem);
        this.movementSystem = this.world.getSystem(MovementSystem);
        this.combatSystem = this.world.getSystem(CombatSystem);
    }
    
    update(dt) {
        if (!this.inputSystem) return;
        
        const players = this.world.getEntitiesWithTag('player');
        
        for (const player of players) {
            this.processPlayer(player, dt);
        }
    }
    
    processPlayer(player, dt) {
        const movement = player.get(MovementComponent);
        const playerComp = player.get(PlayerComponent);
        const weapon = player.get(WeaponComponent);
        
        if (!movement || !playerComp) return;
        
        // 翻滚
        if (this.inputSystem.isActionPressed('dash')) {
            this.tryDash(player);
        }
        
        // 移动输入
        if (!movement.isDashing) {
            const input = this.inputSystem.getMovementInput();
            if (input.x !== 0 || input.y !== 0) {
                this.movementSystem.setInput(player, input.x, input.y);
            }
        }
        
        // 攻击
        if (this.inputSystem.mouse.down || this.inputSystem.mouse.pressed) {
            this.tryAttack(player);
        }
        
        // 武器切换
        this.handleWeaponSwitch(player, playerComp);
        
        // 更新武器冷却
        if (weapon) {
            if (weapon.cooldownTimer > 0) {
                weapon.cooldownTimer -= dt;
            }
            if (weapon.isAttacking) {
                weapon.attackTimer -= dt;
                if (weapon.attackTimer <= 0) {
                    weapon.isAttacking = false;
                }
            }
        }
    }
    
    tryDash(player) {
        if (!this.movementSystem) return;
        
        const success = this.movementSystem.startDash(player);
        if (success) {
            // 可以添加翻滚特效
            this.world.emit('playerDash', player);
        }
    }
    
    tryAttack(player) {
        if (!this.combatSystem) return;
        
        const weapon = player.get(WeaponComponent);
        const transform = player.get(TransformComponent);
        
        if (!weapon || !transform) return;
        
        // 检查冷却
        if (weapon.cooldownTimer > 0) return;
        
        // 计算攻击方向（朝向鼠标）
        if (this.inputSystem) {
            const targetX = this.inputSystem.mouse.worldX;
            const targetY = this.inputSystem.mouse.worldY;
            this.combatSystem.performAttack(player, { x: targetX, y: targetY });
        }
    }
    
    handleWeaponSwitch(player, playerComp) {
        const slots = ['weapon1', 'weapon2', 'weapon3', 'weapon4'];
        
        for (let i = 0; i < slots.length; i++) {
            if (this.inputSystem.isActionPressed(slots[i])) {
                this.switchWeaponSlot(player, playerComp, i);
                break;
            }
        }
    }
    
    switchWeaponSlot(player, playerComp, slotIndex) {
        if (slotIndex === playerComp.activeWeaponSlot) return;
        if (slotIndex >= playerComp.weaponSlots.length) return;
        
        const newWeaponData = playerComp.weaponSlots[slotIndex];
        if (!newWeaponData) return; // 空槽位
        
        // 保存当前武器
        const currentWeapon = player.get(WeaponComponent);
        if (currentWeapon) {
            playerComp.weaponSlots[playerComp.activeWeaponSlot] = {
                weaponId: currentWeapon.weaponId,
                level: currentWeapon.level || 1
            };
        }
        
        // 切换到新武器
        playerComp.activeWeaponSlot = slotIndex;
        
        // 创建新武器组件
        const newWeapon = new WeaponComponent(newWeaponData);
        player.remove(WeaponComponent);
        player.add(newWeapon);
        
        // 触发切换事件
        this.world.emit('weaponSwitched', player, slotIndex, newWeaponData);
    }
    
    /**
     * 拾取武器
     */
    pickupWeapon(player, weaponId) {
        const playerComp = player.get(PlayerComponent);
        if (!playerComp) return false;
        
        // 查找已有武器
        const existingSlot = playerComp.weaponSlots.findIndex(
            w => w && w.weaponId === weaponId
        );
        
        if (existingSlot !== -1) {
            // 升级现有武器
            const weaponData = playerComp.weaponSlots[existingSlot];
            if (weaponData.level < 5) {
                weaponData.level++;
                
                // 如果是当前装备的武器，更新组件
                if (existingSlot === playerComp.activeWeaponSlot) {
                    const weapon = player.get(WeaponComponent);
                    if (weapon) {
                        weapon.level = weaponData.level;
                        this.upgradeWeaponStats(weapon);
                    }
                }
                
                this.world.emit('weaponUpgraded', player, weaponId, weaponData.level);
                return true;
            }
            return false; // 已满级
        }
        
        // 查找空槽位
        const emptySlot = playerComp.weaponSlots.findIndex(w => w === null);
        if (emptySlot === -1) return false; // 武器栏满
        
        // 添加新武器
        playerComp.weaponSlots[emptySlot] = {
            weaponId: weaponId,
            level: 1
        };
        
        // 如果是第一个武器，自动装备
        if (emptySlot === 0 && playerComp.weaponSlots.filter(w => w).length === 1) {
            playerComp.activeWeaponSlot = 0;
            const weapon = new WeaponComponent({ weaponId, level: 1 });
            player.add(weapon);
        }
        
        this.world.emit('weaponPickedUp', player, weaponId, emptySlot);
        return true;
    }
    
    /**
     * 升级武器属性
     */
    upgradeWeaponStats(weapon) {
        const level = weapon.level;
        // 每级提升 20% 伤害
        weapon.damage *= 1.2;
        // 减少冷却
        weapon.cooldown *= 0.95;
        // 提升暴击
        weapon.criticalChance = Math.min(1, weapon.criticalChance + 0.05);
    }
    
    destroy() {}
}

window.PlayerControllerSystem = PlayerControllerSystem;
