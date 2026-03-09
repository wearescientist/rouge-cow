/**
 * ECS Component Definitions
 * 所有游戏数据的纯数据结构
 */

// Component 基类
class Component {
    constructor() {
        this.type = this.constructor.name;
    }
    
    clone() {
        const clone = new this.constructor();
        Object.assign(clone, this);
        return clone;
    }
}

// ========== 核心组件 ==========

class TransformComponent extends Component {
    constructor(x = 0, y = 0, rotation = 0, scaleX = 1, scaleY = 1) {
        super();
        this.x = x;
        this.y = y;
        this.rotation = rotation;
        this.scaleX = scaleX;
        this.scaleY = scaleY;
        this.z = 0; // 渲染层级
    }
}

class SpriteComponent extends Component {
    constructor(options = {}) {
        super();
        this.image = options.image || null;
        this.width = options.width || 32;
        this.height = options.height || 32;
        this.anchorX = options.anchorX || 0.5;
        this.anchorY = options.anchorY || 0.5;
        this.alpha = options.alpha !== undefined ? options.alpha : 1;
        this.tint = options.tint || null;
        this.visible = options.visible !== undefined ? options.visible : true;
        
        // 动画
        this.animations = options.animations || {};
        this.currentAnimation = null;
        this.frameIndex = 0;
        this.animationTimer = 0;
        this.animationSpeed = 1;
    }
}

class MovementComponent extends Component {
    constructor(options = {}) {
        super();
        this.vx = 0;
        this.vy = 0;
        this.speed = options.speed || 100;
        this.maxSpeed = options.maxSpeed || 200;
        this.acceleration = options.acceleration || 500;
        this.friction = options.friction || 0.85;
        this.isMoving = false;
        this.direction = { x: 0, y: -1 }; // 默认朝向上
        
        // 翻滚/冲刺
        this.isDashing = false;
        this.dashSpeed = options.dashSpeed || 400;
        this.dashDuration = options.dashDuration || 0.2;
        this.dashCooldown = options.dashCooldown || 1;
        this.dashTimer = 0;
        this.dashCooldownTimer = 0;
        this.dashInvincible = false;
    }
}

class HealthComponent extends Component {
    constructor(options = {}) {
        super();
        this.maxHealth = options.maxHealth || 100;
        this.currentHealth = options.currentHealth || this.maxHealth;
        this.armor = options.armor || 0;
        this.invincible = false;
        this.invincibleTime = 0;
        this.damageFlash = 0;
        
        // 生命恢复
        this.regenRate = options.regenRate || 0;
        this.regenDelay = options.regenDelay || 5;
        this.lastDamageTime = 0;
    }
}

// ========== 战斗组件 ==========

class WeaponComponent extends Component {
    constructor(options = {}) {
        super();
        this.weaponId = options.weaponId || null;
        this.damage = options.damage || 10;
        this.cooldown = options.cooldown || 0.5;
        this.cooldownTimer = 0;
        this.range = options.range || 100;
        this.attackSpeed = options.attackSpeed || 1;
        this.projectileSpeed = options.projectileSpeed || 300;
        this.isAttacking = false;
        this.attackTimer = 0;
        this.attackDuration = options.attackDuration || 0.3;
        
        // 武器特性
        this.pierce = options.pierce || 0;
        this.bounce = options.bounce || 0;
        this.criticalChance = options.criticalChance || 0;
        this.criticalDamage = options.criticalDamage || 2;
        this.lifeSteal = options.lifeSteal || 0;
        
        // 特效
        this.effectType = options.effectType || null;
        this.effectDuration = options.effectDuration || 0;
        this.effectValue = options.effectValue || 0;
    }
}

class CombatComponent extends Component {
    constructor(options = {}) {
        super();
        this.attackDamage = options.attackDamage || 10;
        this.attackRange = options.attackRange || 50;
        this.attackCooldown = options.attackCooldown || 1;
        this.attackTimer = 0;
        this.isAttacking = false;
        
        // 伤害类型
        this.damageType = options.damageType || 'physical';
        this.canCrit = options.canCrit !== undefined ? options.canCrit : true;
    }
}

// ========== 角色组件 ==========

class PlayerComponent extends Component {
    constructor(options = {}) {
        super();
        this.playerId = options.playerId || 'player1';
        this.level = 1;
        this.experience = 0;
        this.nextLevelExp = 100;
        this.skillPoints = 0;
        
        // 属性
        this.strength = options.strength || 10;
        this.agility = options.agility || 10;
        this.intelligence = options.intelligence || 10;
        this.vitality = options.vitality || 10;
        
        // 武器槽
        this.weaponSlots = [null, null, null, null];
        this.activeWeaponSlot = 0;
        
        // 统计数据
        this.kills = 0;
        this.damageDealt = 0;
        this.damageTaken = 0;
        this.itemsCollected = 0;
    }
    
    addExp(amount) {
        this.experience += amount;
        if (this.experience >= this.nextLevelExp) {
            this.levelUp();
        }
    }
    
    levelUp() {
        this.level++;
        this.experience -= this.nextLevelExp;
        this.nextLevelExp = Math.floor(this.nextLevelExp * 1.2);
        this.skillPoints += 1;
        // 属性提升
        this.strength += 1;
        this.agility += 1;
        this.vitality += 1;
    }
}

class EnemyComponent extends Component {
    constructor(options = {}) {
        super();
        this.enemyType = options.enemyType || 'basic';
        this.enemyId = options.enemyId || null;
        this.level = options.level || 1;
        this.isElite = options.isElite || false;
        this.isBoss = options.isBoss || false;
        
        // AI 行为
        this.behaviorType = options.behaviorType || 'chase';
        this.aggroRange = options.aggroRange || 200;
        this.attackRange = options.attackRange || 50;
        
        // 掉落
        this.expValue = options.expValue || 10;
        this.dropTable = options.dropTable || [];
        this.dropChance = options.dropChance || 0.3;
    }
}

// ========== AI 组件 ==========

class AIComponent extends Component {
    constructor(options = {}) {
        super();
        this.behaviorTree = options.behaviorTree || null;
        this.currentState = 'idle';
        this.targetEntity = null;
        this.lastDecisionTime = 0;
        this.decisionInterval = options.decisionInterval || 0.5;
        
        // 路径寻找
        this.path = [];
        this.pathIndex = 0;
        this.pathUpdateTimer = 0;
        this.pathUpdateInterval = 0.5;
        
        // 状态记忆
        this.lastKnownTargetPos = null;
        this.alertLevel = 0;
        this.patrolPoints = options.patrolPoints || [];
        this.patrolIndex = 0;
    }
}

// ========== 碰撞组件 ==========

class ColliderComponent extends Component {
    constructor(options = {}) {
        super();
        this.type = options.type || 'circle'; // circle, rectangle
        this.radius = options.radius || 16;
        this.width = options.width || 32;
        this.height = options.height || 32;
        this.offsetX = options.offsetX || 0;
        this.offsetY = options.offsetY || 0;
        
        // 碰撞层级
        this.layer = options.layer || 'default';
        this.mask = options.mask || ['default'];
        this.isTrigger = options.isTrigger || false;
        this.isStatic = options.isStatic || false;
        
        // 碰撞状态
        this.collisions = [];
    }
}

// ========== 道具组件 ==========

class ItemComponent extends Component {
    constructor(options = {}) {
        super();
        this.itemId = options.itemId || null;
        this.itemType = options.itemType || 'consumable';
        this.rarity = options.rarity || 'common';
        this.stackable = options.stackable !== undefined ? options.stackable : true;
        this.maxStack = options.maxStack || 99;
        this.count = options.count || 1;
        
        // 效果
        this.effectType = options.effectType || null;
        this.effectValue = options.effectValue || 0;
        this.duration = options.duration || 0;
        
        // 拾取
        this.autoPickup = options.autoPickup !== undefined ? options.autoPickup : true;
        this.pickupRange = options.pickupRange || 50;
        this.magnetSpeed = options.magnetSpeed || 200;
    }
}

class InventoryComponent extends Component {
    constructor(options = {}) {
        super();
        this.maxSlots = options.maxSlots || 20;
        this.items = new Array(this.maxSlots).fill(null);
        this.gold = 0;
    }
    
    addItem(itemComponent) {
        // 尝试堆叠
        if (itemComponent.stackable) {
            for (let slot of this.items) {
                if (slot && slot.itemId === itemComponent.itemId) {
                    const space = slot.maxStack - slot.count;
                    if (space > 0) {
                        const add = Math.min(space, itemComponent.count);
                        slot.count += add;
                        itemComponent.count -= add;
                        if (itemComponent.count <= 0) return true;
                    }
                }
            }
        }
        
        // 找空槽
        const emptySlot = this.items.findIndex(slot => slot === null);
        if (emptySlot !== -1) {
            this.items[emptySlot] = itemComponent;
            return true;
        }
        
        return false; // 背包满了
    }
}

// ========== 特效组件 ==========

class ParticleComponent extends Component {
    constructor(options = {}) {
        super();
        this.lifetime = options.lifetime || 1;
        this.maxLifetime = this.lifetime;
        this.velocity = options.velocity || { x: 0, y: 0 };
        this.acceleration = options.acceleration || { x: 0, y: 0 };
        this.rotationSpeed = options.rotationSpeed || 0;
        this.scaleStart = options.scaleStart || 1;
        this.scaleEnd = options.scaleEnd || 0;
        this.alphaStart = options.alphaStart !== undefined ? options.alphaStart : 1;
        this.alphaEnd = options.alphaEnd !== undefined ? options.alphaEnd : 0;
        this.color = options.color || '#ffffff';
        
        this.currentScale = this.scaleStart;
        this.currentAlpha = this.alphaStart;
    }
}

class EffectComponent extends Component {
    constructor(options = {}) {
        super();
        this.effects = []; // { type, value, duration, source }
    }
    
    addEffect(type, value, duration, source = null) {
        const existing = this.effects.find(e => e.type === type);
        if (existing) {
            existing.value = Math.max(existing.value, value);
            existing.duration = Math.max(existing.duration, duration);
        } else {
            this.effects.push({ type, value, duration, source, timeLeft: duration });
        }
    }
    
    hasEffect(type) {
        return this.effects.some(e => e.type === type);
    }
    
    getEffectValue(type) {
        const effect = this.effects.find(e => e.type === type);
        return effect ? effect.value : 0;
    }
}

// ========== 游戏流程组件 ==========

class RoomComponent extends Component {
    constructor(options = {}) {
        super();
        this.roomId = options.roomId || null;
        this.roomType = options.roomType || 'normal'; // normal, boss, shop, treasure
        this.width = options.width || 20;
        this.height = options.height || 15;
        this.tileSize = options.tileSize || 32;
        this.terrain = options.terrain || [];
        this.exits = options.exits || [];
        this.isCleared = false;
        this.isVisited = false;
    }
}

class ProjectileComponent extends Component {
    constructor(options = {}) {
        super();
        this.owner = options.owner || null; // 发射者实体ID
        this.damage = options.damage || 10;
        this.speed = options.speed || 300;
        this.pierce = options.pierce || 0;
        this.bounce = options.bounce || 0;
        this.lifetime = options.lifetime || 3;
        this.isHoming = options.isHoming || false;
        this.homingRange = options.homingRange || 150;
        
        // 视觉属性
        this.size = options.size || 8;
        this.color = options.color || null;
        
        // 减速效果
        this.slow = options.slow || 0;
        this.slowDuration = options.slowDuration || 0;
        
        this.hitEntities = new Set();
    }
}

// 导出所有组件
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        Component,
        TransformComponent,
        SpriteComponent,
        MovementComponent,
        HealthComponent,
        WeaponComponent,
        CombatComponent,
        PlayerComponent,
        EnemyComponent,
        AIComponent,
        ColliderComponent,
        ItemComponent,
        InventoryComponent,
        ParticleComponent,
        EffectComponent,
        RoomComponent,
        ProjectileComponent
    };
}
