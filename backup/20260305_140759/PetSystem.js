/**
 * PetSystem.js - 宠物系统 v0.22
 * 从 index.html 迁移的独立模块
 */

// ==========================================
// v0.21 宠物数据定义
// ==========================================
const PETS = {
    // 基础宠物
    brimstone: {
        id: 'brimstone',
        name: '硫磺火牛',
        icon: '🔥',
        desc: '发射贯穿全屏的火焰激光',
        rarity: 'epic',
        attackType: 'laser',
        damage: 25,
        attackCd: 2.5,
        attackRange: 1000,
        color: '#ff4400'
    },
    tech: {
        id: 'tech',
        name: '科技牛',
        icon: '🔬',
        desc: '环绕玩家发射激光',
        rarity: 'epic',
        attackType: 'orbit',
        damage: 15,
        attackCd: 0.1,
        attackRange: 150,
        color: '#00ff88'
    },
    tear: {
        id: 'tear',
        name: '眼泪牛',
        icon: '💧',
        desc: '发射会弹跳的眼泪',
        rarity: 'rare',
        attackType: 'bounce',
        damage: 12,
        attackCd: 1.0,
        attackRange: 200,
        color: '#4488ff'
    },
    bomb: {
        id: 'bomb',
        name: '炸弹牛',
        icon: '💣',
        desc: '向敌人投掷炸弹',
        rarity: 'rare',
        attackType: 'bomb',
        damage: 40,
        attackCd: 2.0,
        attackRange: 180,
        color: '#ff8800'
    },
    knife: {
        id: 'knife',
        name: '飞刀牛',
        icon: '🔪',
        desc: '发射回旋飞刀',
        rarity: 'rare',
        attackType: 'boomerang',
        damage: 20,
        attackCd: 1.5,
        attackRange: 150,
        color: '#cccccc'
    },
    blackhole: {
        id: 'blackhole',
        name: '黑洞牛',
        icon: '🕳️',
        desc: '发射吸引敌人的黑洞',
        rarity: 'legendary',
        attackType: 'blackhole',
        damage: 5,
        attackCd: 4.0,
        attackRange: 200,
        color: '#440044'
    },
    aura: {
        id: 'aura',
        name: '光环牛',
        icon: '✨',
        desc: '周围持续造成伤害',
        rarity: 'epic',
        attackType: 'aura',
        damage: 8,
        attackCd: 0.5,
        attackRange: 100,
        color: '#ffcc00'
    },
    missile: {
        id: 'missile',
        name: '导弹牛',
        icon: '🚀',
        desc: '发射追踪导弹',
        rarity: 'epic',
        attackType: 'homing',
        damage: 30,
        attackCd: 2.0,
        attackRange: 300,
        color: '#ff4444'
    },
    copy: {
        id: 'copy',
        name: '复制牛',
        icon: '📋',
        desc: '复制玩家上一次攻击',
        rarity: 'legendary',
        attackType: 'copy',
        damage: 0.7,
        attackCd: 1.0,
        attackRange: 250,
        color: '#8888ff'
    },
    ice: {
        id: 'ice',
        name: '冰冻牛',
        icon: '❄️',
        desc: '发射减速敌人的冰锥',
        rarity: 'rare',
        attackType: 'slow',
        damage: 10,
        attackCd: 1.2,
        attackRange: 180,
        color: '#88ccff'
    },
    thunder: {
        id: 'thunder',
        name: '雷电牛',
        icon: '⚡',
        desc: '发射跳跃的闪电',
        rarity: 'rare',
        attackType: 'chain',
        damage: 15,
        attackCd: 1.5,
        attackRange: 200,
        color: '#ffff00'
    },
    holy: {
        id: 'holy',
        name: '圣心牛',
        icon: '💖',
        desc: '发射追踪眼泪并治疗玩家',
        rarity: 'legendary',
        attackType: 'heal',
        damage: 18,
        attackCd: 1.0,
        attackRange: 220,
        heal: 1,
        color: '#ff88ff'
    },
    godhead: {
        id: 'godhead',
        name: '神性牛',
        icon: '✨',
        desc: '发射带神圣光环的眼泪',
        rarity: 'mythic',
        attackType: 'aoe',
        damage: 25,
        attackCd: 1.2,
        attackRange: 200,
        color: '#ffd700'
    },
    dragon: {
        id: 'dragon',
        name: '幼龙',
        icon: '🐉',
        desc: '喷吐火焰',
        rarity: 'epic',
        attackType: 'breath',
        damage: 12,
        attackCd: 0.3,
        attackRange: 120,
        color: '#ff6644'
    },
    fairy: {
        id: 'fairy',
        name: '小精灵',
        icon: '🧚',
        desc: '快速发射小子弹',
        rarity: 'rare',
        attackType: 'rapid',
        damage: 5,
        attackCd: 0.4,
        attackRange: 150,
        color: '#88ff88'
    }
};

// ==========================================
// v0.22 宠物系统 - Pet System
// ==========================================

/**
 * 单个宠物实例
 * 使用player_cow贴图，40%缩放
 */
class Pet {
    constructor(petId, game, index = 0) {
        const cfg = PETS[petId];
        if (!cfg) {
            throw new Error(`Unknown pet: ${petId}`);
        }
        
        this.petId = petId;
        this.cfg = cfg;
        this.game = game;
        this.index = index;
        
        // v0.22-fix: 先初始化类型相关属性，再计算位置
        this.isCow = true;
        this.orbitAngle = index * (Math.PI * 2 / 10);
        this.orbitRadius = 80 + (index % 3) * 20;
        
        this.formationOffset = this.calcFormationOffset(index, game.player);
        if (game.player) {
            if (this.isCow) {
                this.x = game.player.x + this.formationOffset.x;
                this.y = game.player.y + this.formationOffset.y;
            } else {
                this.x = game.player.x + Math.cos(this.orbitAngle) * this.orbitRadius;
                this.y = game.player.y + Math.sin(this.orbitAngle) * this.orbitRadius;
            }
        } else {
            this.x = 0;
            this.y = 0;
        }
        
        this.vx = 0;
        this.vy = 0;
        this.angle = 0;
        this.walkCycle = 0;
        
        this.cd = 0;
        this.target = null;
        
        this.state = 'follow';
        
        this.scale = 0.4;
        this.frame = 0;
        
        this.color = cfg.color || '#ffffff';
        
        this.blinkTimer = Math.random() * 2000;
        this.isBlinking = false;
        
        this.radius = 12;
        
        this.baseSpeed = 180;
    }
    
    calcFormationOffset(index, player) {
        if (this.isCow) {
            // v0.22-fix: 排队跟随模式（以撒式），距离100
            const spacing = 100; // 距离增加到100px
            const offsetY = -(index + 1) * spacing;
            return { x: 0, y: offsetY };
        } else {
            return { x: 0, y: -100 }; // 非牛牛在正上方100px
        }
    }
    
    updateOrbit(dt) {
        if (!this.isCow) {
            this.orbitAngle += dt * 2;
            this.formationOffset = {
                x: Math.cos(this.orbitAngle) * this.orbitRadius,
                y: Math.sin(this.orbitAngle) * this.orbitRadius
            };
        }
    }
    
    updateIndex(index) {
        this.index = index;
        this.formationOffset = this.calcFormationOffset(index);
    }
    
    update(dt, player, enemies, allPets) {
        if (!player) return;
        
        if (this.cd > 0) {
            this.cd -= dt;
        }
        
        if (!this.isCow) {
            this.updateOrbit(dt);
        }
        
        switch (this.state) {
            case 'follow':
                this.updateFollow(dt, player, enemies);
                break;
            case 'aim':
                this.updateAim(dt, player, enemies);
                break;
            case 'attack':
                this.updateAttack(dt, player, enemies);
                break;
        }
        
        // v0.22-fix: 应用宠物间碰撞避免
        if (allPets) {
            this.applySeparation(allPets, dt);
        }
        
        // v0.22-fix: 应用与玩家的碰撞避免，防止重叠
        this.applyPlayerSeparation(player, dt);
        
        this.updateAnimation(dt);
    }
    
    applySeparation(allPets, dt) {
        const minDist = 80; // v0.22-fix: 宠物间最小距离80px（原来是24px）
        const sepForce = 500; // v0.22-fix: 增加排斥力
        
        for (const other of allPets) {
            if (other === this) continue;
            
            const dx = this.x - other.x;
            const dy = this.y - other.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < minDist && dist > 0.1) {
                const nx = dx / dist;
                const ny = dy / dist;
                const force = (minDist - dist) / minDist * sepForce;
                this.x += nx * force * dt;
                this.y += ny * force * dt;
            }
        }
    }
    
    // v0.22-fix: 与玩家的碰撞避免，防止宠物与玩家重叠
    applyPlayerSeparation(player, dt) {
        // 玩家碰撞半径（ approximate ）
        const playerRadius = 20;
        const minDist = this.radius + playerRadius + 10; // 额外10px缓冲
        const sepForce = 400; // 更强的排斥力确保分离
        
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < minDist && dist > 0.1) {
            const nx = dx / dist;
            const ny = dy / dist;
            // 距离越近，排斥力越强
            const force = (minDist - dist) / minDist * sepForce;
            this.x += nx * force * dt;
            this.y += ny * force * dt;
        }
    }
    
    updateFollow(dt, player, enemies) {
        const attackRange = this.cfg.attackRange || 200;
        
        let targetX, targetY;
        
        if (this.isCow) {
            targetX = player.x + this.formationOffset.x;
            targetY = player.y + this.formationOffset.y;
        } else {
            targetX = player.x + this.formationOffset.x;
            targetY = player.y + this.formationOffset.y;
        }
        
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distToTarget = Math.sqrt(dx * dx + dy * dy);
        
        const playerSpeed = 180;
        const catchUpMult = 1.2;
        const speed = playerSpeed * catchUpMult;
        
        if (distToTarget > 2) {
            this.vx = (dx / distToTarget) * speed;
            this.vy = (dy / distToTarget) * speed;
        } else {
            this.x = targetX;
            this.y = targetY;
            this.vx = 0;
            this.vy = 0;
        }
        
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        this.angle = player.facingRight ? 0 : Math.PI;
        
        this.target = this.findTarget(enemies, attackRange);
        if (this.target && this.cd <= 0) {
            this.state = 'aim';
        }
    }
    
    updateAim(dt, player, enemies) {
        if (!this.target || this.target.hp <= 0) {
            this.state = 'follow';
            this.target = null;
            return;
        }
        
        const targetX = this.target.cx || this.target.x;
        const targetY = this.target.cy || this.target.y;
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const attackRange = this.cfg.attackRange || 200;
        
        if (dist > attackRange * 1.5) {
            this.state = 'follow';
            this.target = null;
            return;
        }
        
        this.angle = Math.atan2(dy, dx);
        this.vx = 0;
        this.vy = 0;
        
        if (this.cd <= 0) {
            this.state = 'attack';
        }
    }
    
    updateAttack(dt, player, enemies) {
        this.fire(player);
        
        this.cd = this.cfg.attackCd || 1.0;
        this.state = 'follow';
        
        if (this.target && this.target.hp > 0) {
            const targetX = this.target.cx || this.target.x;
            const targetY = this.target.cy || this.target.y;
            const dx = targetX - this.x;
            const dy = targetY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > (this.cfg.attackRange || 200) * 1.5) {
                this.target = null;
            }
        }
    }
    
    findTarget(enemies, range) {
        let nearest = null;
        let minDist = range;
        
        for (const enemy of enemies) {
            if (enemy.hp <= 0) continue;
            
            const enemyX = enemy.cx || enemy.x;
            const enemyY = enemy.cy || enemy.y;
            const dx = enemyX - this.x;
            const dy = enemyY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < minDist) {
                minDist = dist;
                nearest = enemy;
            }
        }
        
        return nearest;
    }
    
    fire(player) {
        const attackType = this.cfg.attackType || 'proj';
        const damage = this.cfg.damage || 10;
        const stats = { damageMult: 1, critChance: 0, critMult: 1.5 };
        
        const bullets = this.createBullets(attackType, damage, stats);
        
        if (bullets.length > 0) {
            this.game.bullets.push(...bullets);
        }
        
        // v0.22-fix: 圣心牛治疗逻辑
        if (attackType === 'heal' && this.cfg.heal && player) {
            player.hp = Math.min(player.hp + this.cfg.heal, player.maxHp);
        }
        
        // v0.30: 宠物音效 - 硫磺牛用激光，其他用对应音效
        const attackType = this.cfg.attackType;
        if (attackType === 'laser') {
            this.game.audioCtrl.play('laser');
        } else if (attackType === 'orbit') {
            this.game.audioCtrl.play('fireball_pet'); // 科技牛用低音量火球
        } else if (attackType === 'bomb') {
            this.game.audioCtrl.play('fireball'); // 炸弹牛用火球音效
        } else if (attackType === 'blackhole') {
            this.game.audioCtrl.play('holy_water'); // 黑洞牛用圣水音效
        } else if (attackType === 'breath') {
            this.game.audioCtrl.play('fireball'); // 幼龙用火球音效
        } else if (attackType === 'chain') {
            this.game.audioCtrl.play('lightning'); // 雷电牛用闪电音效
        } else if (attackType === 'slow') {
            this.game.audioCtrl.play('icicle'); // 冰冻牛用冰锥音效
        } else if (attackType === 'heal') {
            this.game.audioCtrl.play('heal'); // 圣心牛用治疗音效
        } else if (attackType === 'homing' || attackType === 'aoe') {
            this.game.audioCtrl.play('fireball_pet'); // 追踪类用低音量火球
        } else if (attackType === 'rapid') {
            this.game.audioCtrl.play('knife'); // 快速攻击用飞刀音效
        } else if (attackType === 'bounce') {
            this.game.audioCtrl.play('cross'); // 弹跳用十字架音效
        } else if (attackType === 'boomerang') {
            this.game.audioCtrl.play('axe'); // 回旋用斧头音效
        } else {
            this.game.audioCtrl.play('fireball_pet'); // 默认用低音量火球
        }
    }
    
    createBullets(attackType, damage, stats) {
        const bullets = [];
        const color = this.cfg.color || '#fff';
        
        // v0.22-opt: 宠物子弹视觉大小配置（与碰撞半径一致，确保视觉效果匹配）
        const PET_VISUAL_SIZES = {
            laser: 24,      // 激光 - 粗光束
            orbit: 18,      // 环绕激光
            bounce: 14,     // 弹跳眼泪
            bomb: 20,       // 炸弹
            boomerang: 16,  // 飞刀
            blackhole: 28,  // 黑洞
            aura: 22,       // 光环
            homing: 16,     // 追踪导弹
            slow: 14,       // 冰锥
            heal: 14,       // 治疗眼泪
            breath: 12,     // 火焰
            chain: 16,      // 闪电
            aoe: 20,        // 神性爆炸
            rapid: 10,      // 快速子弹
            copy: 14,       // 复制子弹
            proj: 14        // 默认投射物
        };
        const visualSize = PET_VISUAL_SIZES[attackType] || 14;
        
        switch (attackType) {
            case 'laser':
                if (!this.game.petLasers) this.game.petLasers = [];
                
                // v0.30: 宠物激光重构 - 存储引用而非静态坐标，支持跟随移动
                this.game.petLasers.push({
                    x: this.x, y: this.y,
                    angle: this.angle,
                    width: visualSize * 0.6, // 宠物激光比玩家细
                    color: color,
                    life: 2.0, // 持续2秒
                    maxLife: 2.0,
                    dmg: damage * 0.3, // 每跳伤害
                    isFromPet: true,
                    owner: this, // 引用宠物实例
                    hitEnemies: new Set(), // 本帧已击中
                    hitCooldowns: new Map(), // 持续伤害冷却
                    range: 1000,
                    glowIntensity: 1.5
                });
                break;
                
            case 'orbit':
                if (!this.game.orbitals) this.game.orbitals = [];
                // v0.22-opt: 环绕激光视觉效果增强
                this.game.orbitals.push({
                    x: this.x, y: this.y,
                    angle: this.angle,
                    radius: 100,
                    dmg: damage,
                    life: 4,
                    maxLife: 4,
                    speed: 4,
                    color: color,
                    isLaser: true,
                    isFromPet: true,
                    isPet: true,
                    visualSize: visualSize,
                    glowIntensity: 1.2
                });
                break;
                
            case 'bounce':
                bullets.push({
                    x: this.x, y: this.y,
                    vx: Math.cos(this.angle) * 200,
                    vy: Math.sin(this.angle) * 200,
                    life: 3,
                    dmg: damage,
                    radius: visualSize * 0.6,
                    bounces: 3,
                    bouncesLeft: 3,
                    hits: new Set(),
                    isFromPet: true,
                    isPet: true,
                    visualSize: visualSize,
                    color: color,
                    subtype: 'bounce',
                    type: 'bounce'
                });
                break;
                
            case 'bomb':
                bullets.push({
                    x: this.x, y: this.y,
                    vx: Math.cos(this.angle) * 150,
                    vy: Math.sin(this.angle) * 150,
                    life: 1.5,
                    dmg: damage,
                    radius: visualSize * 0.7,
                    subtype: 'explode',
                    explodeRadius: 100,
                    isFromPet: true,
                    isPet: true,
                    visualSize: visualSize,
                    color: color,
                    hits: new Set()
                });
                break;
                
            case 'boomerang':
                bullets.push({
                    x: this.x, y: this.y,
                    vx: Math.cos(this.angle) * 250,
                    vy: Math.sin(this.angle) * 250,
                    life: 2,
                    dmg: damage,
                    radius: visualSize * 0.6,
                    subtype: 'boomerang',
                    returnTo: { x: this.x, y: this.y },
                    isReturning: false,
                    isFromPet: true,
                    isPet: true,
                    visualSize: visualSize,
                    color: color,
                    hits: new Set()
                });
                break;
                
            case 'blackhole':
                bullets.push({
                    x: this.x, y: this.y,
                    vx: Math.cos(this.angle) * 120,
                    vy: Math.sin(this.angle) * 120,
                    life: 5,
                    dmg: damage,
                    radius: visualSize * 0.8,
                    subtype: 'blackhole',
                    pullRadius: 180,
                    isFromPet: true,
                    isPet: true,
                    visualSize: visualSize,
                    color: color,
                    hits: new Set()
                });
                break;
                
            case 'aura':
                if (!this.game.orbitals) this.game.orbitals = [];
                // v0.22-opt: 光环视觉效果增强
                this.game.orbitals.push({
                    x: this.x, y: this.y,
                    angle: 0,
                    radius: 100,
                    dmg: damage,
                    life: 6,
                    maxLife: 6,
                    isAura: true,
                    isFromPet: true,
                    isPet: true,
                    visualSize: visualSize,
                    color: color,
                    pulseSpeed: 2,
                    glowIntensity: 0.8
                });
                break;
                
            case 'homing':
                bullets.push({
                    x: this.x, y: this.y,
                    vx: Math.cos(this.angle) * 200,
                    vy: Math.sin(this.angle) * 200,
                    life: 4,
                    dmg: damage,
                    radius: visualSize * 0.6,
                    subtype: 'homing',
                    target: this.target,
                    turnSpeed: 4,
                    isFromPet: true,
                    isPet: true,
                    visualSize: visualSize,
                    color: color,
                    hits: new Set()
                });
                break;
                
            case 'slow':
                bullets.push({
                    x: this.x, y: this.y,
                    vx: Math.cos(this.angle) * 280,
                    vy: Math.sin(this.angle) * 280,
                    life: 1.8,
                    dmg: damage,
                    radius: visualSize * 0.6,
                    subtype: 'ice',
                    slowAmount: 0.5,
                    slowDuration: 2.5,
                    isFromPet: true,
                    isPet: true,
                    visualSize: visualSize,
                    color: color,
                    hits: new Set()
                });
                break;
                
            case 'heal': // 圣心牛 - 追踪治疗眼泪
                bullets.push({
                    x: this.x, y: this.y,
                    vx: Math.cos(this.angle) * 240,
                    vy: Math.sin(this.angle) * 240,
                    life: 2.5,
                    dmg: damage,
                    radius: visualSize * 0.6,
                    subtype: 'homing',
                    target: this.target,
                    turnSpeed: 3.5,
                    isFromPet: true,
                    isPet: true,
                    isHeal: true,
                    visualSize: visualSize,
                    color: color,
                    hits: new Set()
                });
                break;
                
            case 'breath': // 幼龙 - 火焰喷射（短程扇形）
                for (let i = -1; i <= 1; i++) {
                    const spreadAngle = this.angle + i * 0.25;
                    bullets.push({
                        x: this.x, y: this.y,
                        vx: Math.cos(spreadAngle) * 320,
                        vy: Math.sin(spreadAngle) * 320,
                        life: 0.6,
                        dmg: damage,
                        radius: visualSize * 0.5,
                        isFromPet: true,
                        isPet: true,
                        visualSize: visualSize,
                        color: color,
                        hits: new Set()
                    });
                }
                break;
                
            case 'chain': // 雷电牛 - 连锁闪电
                bullets.push({
                    x: this.x, y: this.y,
                    vx: Math.cos(this.angle) * 380,
                    vy: Math.sin(this.angle) * 380,
                    life: 1.8,
                    dmg: damage,
                    radius: visualSize * 0.6,
                    subtype: 'chain',
                    chainCount: 4,
                    chainRange: 180,
                    isFromPet: true,
                    isPet: true,
                    visualSize: visualSize,
                    color: color,
                    hits: new Set()
                });
                break;
                
            case 'aoe': // 神性牛 - 范围爆炸眼泪
                bullets.push({
                    x: this.x, y: this.y,
                    vx: Math.cos(this.angle) * 220,
                    vy: Math.sin(this.angle) * 220,
                    life: 2.2,
                    dmg: damage,
                    radius: visualSize * 0.7,
                    subtype: 'explode',
                    explodeRadius: 80,
                    isFromPet: true,
                    isPet: true,
                    visualSize: visualSize,
                    color: color,
                    hits: new Set()
                });
                break;
                
            case 'rapid': // 小精灵 - 快速小子弹（3连发）
                for (let i = 0; i < 3; i++) {
                    const spread = (i - 1) * 0.12;
                    bullets.push({
                        x: this.x, y: this.y,
                        vx: Math.cos(this.angle + spread) * 380,
                        vy: Math.sin(this.angle + spread) * 380,
                        life: 1.5,
                        dmg: damage,
                        radius: visualSize * 0.5,
                        isFromPet: true,
                        isPet: true,
                        visualSize: visualSize,
                        color: color,
                        hits: new Set()
                    });
                }
                break;
                
            case 'copy':
                if (this.game.weapons && this.game.weapons.length > 0) {
                    const playerWeapon = this.game.weapons[0];
                    const weaponType = playerWeapon.cfg.type;
                    const weaponSubtype = playerWeapon.cfg.subtype || '';
                    const copyDamage = playerWeapon.cfg.damage * 0.7;
                    
                    if (weaponType === 'proj' || weaponSubtype === 'tech') {
                        bullets.push({
                            x: this.x, y: this.y,
                            vx: Math.cos(this.angle) * 400,
                            vy: Math.sin(this.angle) * 400,
                            life: 1.5,
                            dmg: copyDamage,
                            radius: visualSize * 0.5,
                            isFromPet: true,
                            isPet: true,
                            visualSize: visualSize,
                            color: '#8888ff',
                            subtype: 'tech',
                            hits: new Set()
                        });
                    } else if (weaponType === 'melee') {
                        bullets.push({
                            x: this.x + Math.cos(this.angle) * 40,
                            y: this.y + Math.sin(this.angle) * 40,
                            vx: 0, vy: 0,
                            life: 0.15,
                            dmg: copyDamage,
                            radius: visualSize * 2.5,
                            isFromPet: true,
                            isPet: true,
                            visualSize: visualSize,
                            color: '#8888ff',
                            type: 'melee',
                            hits: new Set()
                        });
                    } else {
                        bullets.push({
                            x: this.x, y: this.y,
                            vx: Math.cos(this.angle) * 350,
                            vy: Math.sin(this.angle) * 350,
                            life: 1.5,
                            dmg: copyDamage,
                            radius: visualSize * 0.6,
                            isFromPet: true,
                            isPet: true,
                            visualSize: visualSize,
                            color: '#8888ff',
                            hits: new Set()
                        });
                    }
                }
                break;
                
            case 'proj':
            default:
                bullets.push({
                    x: this.x, y: this.y,
                    vx: Math.cos(this.angle) * 320,
                    vy: Math.sin(this.angle) * 320,
                    life: 2,
                    dmg: damage,
                    radius: visualSize * 0.6,
                    isFromPet: true,
                    isPet: true,
                    visualSize: visualSize,
                    color: color,
                    hits: new Set()
                });
                break;
        }
        
        return bullets;
    }
    
    updateAnimation(dt) {
        if (Math.abs(this.vx) > 10 || Math.abs(this.vy) > 10) {
            this.walkCycle += dt * 8;
        } else {
            this.walkCycle = 0;
        }
        
        const isMoving = this.walkCycle > 0;
        if (isMoving) {
            const walkCycle = Math.floor(this.walkCycle) % 4;
            this.frame = [1, 2, 3, 2][walkCycle];
        } else {
            this.blinkTimer += dt * 1000;
            if (this.blinkTimer >= 2000) {
                this.isBlinking = true;
                if (this.blinkTimer >= 2100) {
                    this.blinkTimer = 0;
                    this.isBlinking = false;
                }
            }
            this.frame = this.isBlinking ? 3 : 0;
        }
    }
    
    render(ctx, camera, sprites) {
        if (!isFinite(this.x) || !isFinite(this.y)) {
            console.warn(`[Pet] Invalid position: ${this.petId} at (${this.x}, ${this.y})`);
            return;
        }
        
        if (!camera.isVisible(this.x, this.y, 30)) return;
        
        const pos = camera.worldToScreen(this.x, this.y);
        const sprite = sprites.get('player_' + this.frame);
        
        let drawX = -13, drawY = -13, drawW = 26, drawH = 26;
        
        if (sprite && window.spriteDataRegistry) {
            let spriteData = this._spriteData;
            if (!spriteData) {
                spriteData = window.spriteDataRegistry.getFromImage(sprite);
                if (spriteData) {
                    this._spriteData = spriteData;
                    this._renderScale = 0.4;
                    this.renderScale = 0.4;
                }
            }
            
            if (spriteData) {
                const renderSize = spriteData.getDrawSize(this._renderScale);
                const renderPos = spriteData.worldToRender(0, 0, this._renderScale, 'feet');
                drawX = renderPos.x;
                drawY = renderPos.y;
                drawW = renderSize.width;
                drawH = renderSize.height;
            }
        }
        
        ctx.save();
        
        // v0.22-opt: 宠物发光效果
        const time = Date.now() / 1000;
        const pulse = 1 + Math.sin(time * 3 + this.index) * 0.1;
        ctx.shadowBlur = 15 * pulse;
        ctx.shadowColor = this.color;
        
        ctx.globalCompositeOperation = 'source-over';
        
        ctx.translate(pos.x, pos.y);
        if (Math.cos(this.angle) < 0) {
            ctx.scale(-1, 1);
        }
        
        const bob = this.walkCycle > 0 ? Math.abs(Math.sin(this.walkCycle)) * -4 : 0;
        ctx.translate(0, bob);
        
        // v0.22-opt: 添加宠物着色效果
        if (this.color && this.color !== '#ffffff') {
            // 绘制着色层
            ctx.save();
            ctx.globalCompositeOperation = 'multiply';
            ctx.fillStyle = this.color;
            ctx.globalAlpha = 0.3;
            if (sprite) {
                ctx.drawImage(sprite, drawX, drawY, drawW, drawH);
            }
            ctx.restore();
        }
        
        if (sprite) {
            ctx.drawImage(sprite, drawX, drawY, drawW, drawH);
        } else {
            ctx.fillStyle = this.color || '#888';
            ctx.beginPath();
            ctx.arc(0, 0, 10, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // v0.22-opt: 攻击状态指示器
        if (this.state === 'aim' || this.state === 'attack') {
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ff0000';
            ctx.globalAlpha = 0.6 + Math.sin(time * 15) * 0.4;
            ctx.beginPath();
            ctx.arc(drawX + drawW * 0.7, drawY + 5, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

/**
 * 宠物管理器
 * 管理所有出战宠物
 */
class PetManager {
    constructor(game) {
        this.game = game;
        this.pets = [];
        this.maxPets = 10;
        this.unlockedPets = [];
    }
    
    unlockPet(petId) {
        if (!this.unlockedPets.includes(petId)) {
            this.unlockedPets.push(petId);
            console.log(`[Pet] 解锁宠物: ${PETS[petId]?.name || petId}`);
        }
    }
    
    addPet(petId) {
        if (this.pets.some(p => p.petId === petId)) {
            return false;
        }
        
        if (this.pets.length >= this.maxPets) {
            return false;
        }
        
        const index = this.pets.length;
        const pet = new Pet(petId, this.game, index);
        this.pets.push(pet);
        
        const cfg = PETS[petId];
        if (cfg && this.game.damageNumbers) {
            this.game.damageNumbers.spawn(
                this.game.player.x,
                this.game.player.y - 50,
                `+ ${cfg.name}`,
                { color: cfg.color || '#f8f', size: 14, life: 2 }
            );
        }
        
        return true;
    }
    
    removePet(petId) {
        const idx = this.pets.findIndex(p => p.petId === petId);
        if (idx >= 0) {
            this.pets.splice(idx, 1);
            this.pets.forEach((p, i) => p.updateIndex(i));
            return true;
        }
        return false;
    }
    
    update(dt, player, enemies) {
        for (const pet of this.pets) {
            pet.update(dt, player, enemies, this.pets);
        }
    }
    
    render(ctx, camera, sprites) {
        for (const pet of this.pets) {
            pet.render(ctx, camera, sprites);
        }
    }
    
    clear() {
        this.pets = [];
    }
    
    get count() {
        return this.pets.length;
    }
}

// 导出（兼容模块系统和全局变量）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PETS, Pet, PetManager };
}
