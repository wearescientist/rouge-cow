(function attachPet(global) {
    const rand = global.rand || ((min, max) => Math.random() * (max - min) + min);
    const randChoice = global.randChoice || ((arr) => arr[Math.floor(Math.random() * arr.length)]);
class Pet {
    constructor(petId, game, index = 0) {
        const cfg = PETS[petId];
        if (!cfg) {
            throw new Error(`Unknown pet: ${petId}`);
        }
        
        this.petId = petId;
        this.cfg = cfg;
        this.game = game;
        this.index = index; // 在队伍中的位置 0, 1, 2
        
        // 位置 - 初始在玩家旁边
        // v0.22-fix: 初始位置在玩家身后，确保立即可见
        if (game.player) {
            // 根据index在玩家身后排列，避免重叠
            const spacing = 100; // 每个宠物间隔100像素（翻倍，确保足够空档）
            const angle = Math.PI; // 身后方向（下方）
            this.x = game.player.x + Math.cos(angle) * spacing * (index + 1);
            this.y = game.player.y + Math.sin(angle) * spacing * (index + 1);
        } else {
            this.x = 400;
            this.y = 300;
        }
        
        // 移动相关
        this.vx = 0;
        this.vy = 0;
        this.angle = 0; // 朝向角度
        this.walkCycle = 0;
        
        // 攻击相关
        this.cd = Math.random() * 0.35;
        this.target = null;
        
        // 状态: 'follow', 'aim', 'attack'
        this.state = 'follow';
        
        // v0.22: 使用玩家动画贴图组
        // 贴图路径: assets/runtime/sprites/player/player_{state}_{frame}.png
        this.scale = 0.4; // 40%大小
        this.frame = 0;
        
        // 颜色着色（不同宠物不同颜色）
        this.color = cfg.color || '#ffffff';
        
        // 动画
        this.blinkTimer = Math.random() * 2000;
        this.isBlinking = false;
        
        // 碰撞体积（用于避免与其他宠物重叠）
        this.radius = 12; // 宠物碰撞半径（略小于间距）
        
        // 移动速度: 玩家移速的150%，这样才能追上移动中的玩家
        this.baseSpeed = 270;
        
        // v0.22: 判断宠物类型（牛牛 vs 非牛牛）
        // 牛牛使用排队跟随，非牛牛使用环绕模式
        this.isCow = true; // 目前所有宠物都是牛牛（使用player贴图）
        this.orbitAngle = index * (Math.PI * 2 / 10); // 环绕角度（非牛牛用）
        this.orbitRadius = 80 + (index % 3) * 20; // 环绕半径（非牛牛用）
        
        // v0.20.0: 链式跟随 - 记录要跟随的目标（玩家或前一个宠物）
        this.leader = null; // 在PetManager中设置
        this.followDistance = 90; // 跟随距离（像素），翻倍确保足够空档
        this.history = []; // 位置历史记录（用于延迟跟随）
        this.maxHistory = 10; // 历史记录长度

        // 牛牛重做：主辅助、副输出
        this.supportTick = Math.random() * 0.35;
        this.activeSkillCd = 0;
        this.healTick = 0;
        this.econTick = 4 + Math.random() * 3;
    }
    
    /**
     * 计算阵型偏移
     * v0.20.0: 已弃用，改用链式跟随
     */
    calcFormationOffset(index, player) {
        // v0.20.0: 保持向后兼容，但实际使用链式跟随
        return { x: 0, y: 0 };
    }
    
    /**
     * v0.20.0: 设置跟随目标（链式跟随）
     * @param {Object} leader - 要跟随的目标（玩家或前一个宠物）
     */
    setLeader(leader) {
        this.leader = leader;
    }
    
    /**
     * v0.20.0: 记录位置到历史（用于延迟跟随效果）
     */
    recordPosition() {
        this.history.unshift({ x: this.x, y: this.y });
        if (this.history.length > this.maxHistory) {
            this.history.pop();
        }
    }
    
    /**
     * 更新环绕角度（非牛牛宠物用）
     */
    updateOrbit(dt) {
        if (!this.isCow) {
            this.orbitAngle += dt * 2; // 每秒转2弧度
            this.formationOffset = {
                x: Math.cos(this.orbitAngle) * this.orbitRadius,
                y: Math.sin(this.orbitAngle) * this.orbitRadius
            };
        }
    }
    
    /**
     * 更新阵型位置（当index改变时）
     */
    updateIndex(index) {
        this.index = index;
        this.formationOffset = this.calcFormationOffset(index);
    }

    getPetRoleType() {
        if (this.petId === 'brimstone') return 'ranged';
        if (this.petId === 'knife' || this.petId === 'ice') return 'melee';
        if (this.petId === 'bomb' || this.petId === 'blackhole' || this.petId === 'thunder') return 'active';
        if (this.petId === 'aura' || this.petId === 'holy' || this.petId === 'godhead') return 'aura';
        return 'passive';
    }

    usesDirectAttack() {
        const role = this.getPetRoleType();
        return role === 'ranged' || role === 'active' || role === 'melee';
    }

    getStaticTeamBonus() {
        switch (this.petId) {
            case 'tech':
                return { fireRateMul: 0.12 };
            case 'missile':
                return { dmgMul: 0.08 };
            case 'copy':
                return { critAdd: 0.06 };
            case 'holy':
                return { armorAdd: 1 };
            case 'tear':
                return { goldPerKill: 0.35 };
            default:
                return null;
        }
    }

    updateSupportRole(dt, player, enemies) {
        const role = this.getPetRoleType();
        if (role !== 'aura' && role !== 'passive') return;

        this.supportTick -= dt;
        this.healTick -= dt;
        this.econTick -= dt;

        // 经济型被动：眼泪牛定时产出金币
        if (this.petId === 'tear' && this.econTick <= 0 && this.game && this.game.player) {
            this.game.player.gold += 2;
            if (this.game.damageNumbers) {
                this.game.damageNumbers.spawn(this.game.player.cx, this.game.player.cy - 40, '+2$', {
                    color: '#ffd34a',
                    size: 12,
                    life: 0.9
                });
            }
            this.econTick = 12 + Math.random() * 4;
        }

        if (!Array.isArray(enemies) || enemies.length === 0) return;
        if (this.supportTick > 0) return;

        // 光环系：围绕玩家提供范围压制/伤害
        if (this.petId === 'aura') {
            this.dealPulseDamage(player.cx, player.cy, 160, 10, enemies, false);
            this.supportTick = 0.30;
        } else if (this.petId === 'godhead') {
            this.dealPulseDamage(player.cx, player.cy, 210, 14, enemies, true);
            this.supportTick = 0.22;
        } else if (this.petId === 'holy') {
            this.dealPulseDamage(player.cx, player.cy, 130, 7, enemies, false);
            this.supportTick = 0.35;
            if (this.healTick <= 0 && this.game && this.game.player) {
                this.game.player.hp = Math.min(this.game.player.maxHp, this.game.player.hp + 1);
                if (this.game.damageNumbers) {
                    this.game.damageNumbers.spawn(this.game.player.cx, this.game.player.cy - 52, '+1', {
                        color: '#90ffd8',
                        size: 12,
                        life: 0.8
                    });
                }
                this.healTick = 3.8;
            }
        }
    }

    dealPulseDamage(x, y, radius, baseDamage, enemies, useFalloff) {
        if (!this.game || !Array.isArray(enemies)) return;
        for (const e of enemies) {
            if (!e || e.hp <= 0) continue;
            const ex = e.cx || e.x;
            const ey = e.cy || e.y;
            const dx = ex - x;
            const dy = ey - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > radius) continue;
            const falloff = useFalloff ? Math.max(0.35, 1 - dist / radius) : 1;
            const dmg = Math.max(1, Math.floor(baseDamage * falloff));
            this.game.applyDamage(e, dmg, {}, { isFromPet: true, color: this.color });
        }
    }
    
    /**
     * 更新宠物AI
     * @param {number} dt - 时间增量
     * @param {Object} player - 玩家对象
     * @param {Array} enemies - 敌人列表
     * @param {Array} allPets - 所有宠物列表（用于碰撞避免）
     */
    update(dt, player, enemies, allPets) {
        if (!player) return;
        
        // 减少冷却
        if (this.cd > 0) {
            this.cd -= dt;
        }
        
        // v0.22: 非牛牛宠物更新环绕角度
        if (!this.isCow) {
            this.updateOrbit(dt);
        }

        // 牛牛重做：支持型先更新被动/光环
        this.updateSupportRole(dt, player, enemies);

        // AI状态机
        if (this.usesDirectAttack()) {
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
        } else {
            this.state = 'follow';
            this.updateFollow(dt, player, enemies);
        }
        
        // 碰撞避免（与其他宠物）
        if (allPets) {
            this.applySeparation(allPets, dt);
        }
        
        // 更新动画
        this.updateAnimation(dt);
    }
    
    /**
     * 碰撞避免 - 与其他宠物保持最小距离
     */
    applySeparation(allPets, dt) {
        const minDist = this.radius * 2; // 最小间距
        const sepForce = 200; // 排斥力
        
        for (const other of allPets) {
            if (other === this) continue;
            
            const dx = this.x - other.x;
            const dy = this.y - other.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < minDist && dist > 0.1) {
                // 计算排斥方向
                const nx = dx / dist;
                const ny = dy / dist;
                
                // 越近排斥力越强
                const force = (minDist - dist) / minDist * sepForce;
                
                // 应用排斥速度
                this.x += nx * force * dt;
                this.y += ny * force * dt;
            }
        }
    }
    
    /**
     * 跟随状态 - v0.20.0: 链式跟随（以撒的结合式）
     * 第一个宠物跟随玩家，第二个跟随第一个，以此类推
     */
    updateFollow(dt, player, enemies) {
        const attackRange = Math.max(this.cfg.attackRange || 200, 3000);
        
        // v0.20.0: 确定跟随目标
        let followTarget = this.leader || player;
        
        // 计算目标位置（跟随目标的身后）
        let targetX, targetY;
        
        // 直接跟随目标当前位置
        targetX = followTarget.x;
        targetY = followTarget.y;
        
        // 计算与目标位置的距离
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const distToTarget = Math.sqrt(dx * dx + dy * dy);
        
        // 跟随距离
        const minFollowDist = this.followDistance;
        
        // 移速计算：基础速度 + 距离加速 + 超距强拉
        let speed = 200; // 基础速度（比玩家180略快）
        
        // 远距离追赶加速：距离越远跑得越快
        if (distToTarget > 150) {
            speed += (distToTarget - 150) * 1.5; // 每多1像素距离加1.5速度
        }
        
        // 移动逻辑
        if (distToTarget > minFollowDist) {
            // 正常移动：基于 distToTarget 而不是 distToTarget - minFollowDist
            const moveDist = Math.min(distToTarget, speed * dt);
            if (moveDist > 0 && distToTarget > 0) {
                this.x += (dx / distToTarget) * moveDist;
                this.y += (dy / distToTarget) * moveDist;
            }
        }
        
        // 记录当前位置到历史（用于下一个宠物跟随）
        this.recordPosition();
        
        // 面向跟随目标
        this.angle = Math.atan2(dy, dx);
        
        if (!this.usesDirectAttack()) {
            this.target = null;
            return;
        }

        // 寻找攻击目标（全屏）
        this.target = this.findTarget(enemies, attackRange);
        if (this.target && this.cd <= 0) {
            this.state = 'aim';
        }
    }
    
    /**
     * 瞄准状态 - 停下并面向目标中心点
     * v0.20.0: 全屏射程，目标不会太远
     */
    updateAim(dt, player, enemies) {
        // 检查目标是否仍然有效
        if (!this.target || this.target.hp <= 0) {
            this.state = 'follow';
            this.target = null;
            return;
        }
        
        // v0.22: 使用目标中心点计算角度
        const targetX = this.target.cx || this.target.x;
        const targetY = this.target.cy || this.target.y;
        const dx = targetX - this.x;
        const dy = targetY - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const attackRange = Math.max(this.cfg.attackRange || 200, 3000);  // v0.20.0: 全屏射程
        
        // v0.20.0: 只有在目标死亡或超出全屏范围时才放弃目标
        if (dist > attackRange * 1.5) {
            this.state = 'follow';
            this.target = null;
            return;
        }
        
        // 面向目标中心点
        this.angle = Math.atan2(dy, dx);
        this.vx = 0;
        this.vy = 0;
        
        // 攻击CD就绪，开始攻击
        if (this.cd <= 0) {
            this.state = 'attack';
        }
    }
    
    /**
     * 攻击状态 - 发射攻击
     */
    updateAttack(dt, player, enemies) {
        // 执行攻击
        this.fire(player);
        
        // 重置冷却并回到跟随
        const baseCd = this.cfg.attackCd || 1.0;
        const jitter = 0.85 + Math.random() * 0.3;
        this.cd = baseCd * jitter;
        this.state = 'follow';
        
        // 保持目标（可能继续攻击同一个目标）
        if (this.target && this.target.hp > 0) {
            // v0.22: 使用中心点计算距离
            const targetX = this.target.cx || this.target.x;
            const targetY = this.target.cy || this.target.y;
            const dx = targetX - this.x;
            const dy = targetY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            // v0.20.0: 全屏射程检查
            if (dist > Math.max(this.cfg.attackRange || 200, 3000) * 1.5) {
                this.target = null;
            }
        }
    }
    
    /**
     * 寻找最近的敌人作为目标
     * v0.20.0: 全屏射程 (3000px)
     * v0.22: 使用敌人中心点(cx,cy)而不是脚底(x,y)
     */
    findTarget(enemies, range) {
        if (!Array.isArray(enemies) || enemies.length === 0) return null;
        let nearest = null;
        // v0.20.0: 使用全屏射程或传入的范围中的较大值
        let minDist = Math.max(range, 3000);
        
        for (const enemy of enemies) {
            if (enemy.hp <= 0) continue;
            
            // v0.22: 使用中心点
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
    
    /**
     * 执行攻击 - 根据宠物类型发射不同的子弹
     */
    fire(player) {
        // 近战牛牛：不发子弹，直接近战打击
        if (this.petId === 'knife' || this.petId === 'ice') {
            this.performMeleeStrike();
            return;
        }

        // 主动技能牛牛：按技能逻辑释放
        if (this.petId === 'bomb' || this.petId === 'blackhole' || this.petId === 'thunder') {
            this.castActiveSkill();
            return;
        }

        // 纯辅助牛牛：不走投射物
        if (!this.usesDirectAttack()) {
            return;
        }

        const attackType = this.cfg.attackType || 'proj';
        const damage = this.cfg.damage || 10;
        const stats = { damageMult: 1, critChance: 0, critMult: 1.5 };
        
        // 创建子弹/效果
        const bullets = this.createBullets(attackType, damage, stats);
        
        // 添加到游戏的子弹列表
        if (bullets.length > 0) {
            this.game.bullets.push(...bullets);
        }
        
        // 播放音效 - 使用宠物ID作为音效类型
        if (this.game.audio) {
            // 映射宠物ID到音效配置
            const sfxMap = {
                'brimstone': 'fireball',
                'tech': 'lightning',
                'tear': 'holywater',
                'bomb': 'fireball',
                'knife': 'knife',
                'blackhole': 'lightning',
                'aura': 'holywater'
            };
            const sfxType = sfxMap[this.petId] || 'wand';
            this.game.audioCtrl.play(sfxType);
        }
    }

    castActiveSkill() {
        if (!this.game) return;

        if (this.petId === 'thunder') {
            const enemies = this.game.curRoom?.getActiveEnemies ? this.game.curRoom.getActiveEnemies() : this.game.curRoom?.enemies;
            if (!Array.isArray(enemies) || enemies.length === 0) return;
            const seed = this.target && this.target.hp > 0 ? this.target : this.findTarget(enemies, 420);
            if (!seed) return;

            const hits = [];
            let anchor = seed;
            for (let i = 0; i < 3; i++) {
                if (!anchor || anchor.hp <= 0) break;
                hits.push(anchor);
                let best = null;
                let bestDist = 200;
                for (const e of enemies) {
                    if (!e || e.hp <= 0 || hits.includes(e)) continue;
                    const dx = (e.cx || e.x) - (anchor.cx || anchor.x);
                    const dy = (e.cy || e.y) - (anchor.cy || anchor.y);
                    const d = Math.sqrt(dx * dx + dy * dy);
                    if (d < bestDist) {
                        best = e;
                        bestDist = d;
                    }
                }
                anchor = best;
            }

            let prevX = this.x;
            let prevY = this.y;
            for (const e of hits) {
                const ex = e.cx || e.x;
                const ey = e.cy || e.y;
                if (!this.game.lightningEffects) this.game.lightningEffects = [];
                this.game.lightningEffects.push({ x1: prevX, y1: prevY, x2: ex, y2: ey, life: 0.12 });
                this.game.applyDamage(e, Math.max(1, Math.floor((this.cfg.damage || 55) * 0.8)), {}, { isFromPet: true, color: '#ffe066' });
                prevX = ex;
                prevY = ey;
            }
            return;
        }

        const attackType = this.cfg.attackType || 'proj';
        const damage = this.cfg.damage || 10;
        const bullets = this.createBullets(attackType, damage, {});
        if (bullets.length > 0) {
            this.game.bullets.push(...bullets);
        }
    }

    performMeleeStrike() {
        if (!this.game) return;
        const damage = this.cfg.damage || 32;
        const range = this.petId === 'ice' ? 82 : 92;
        const strikeX = this.x + Math.cos(this.angle) * (range * 0.6);
        const strikeY = this.y + Math.sin(this.angle) * (range * 0.6);

        this.game.bullets.push({
            x: strikeX,
            y: strikeY,
            vx: 0,
            vy: 0,
            life: 0.16,
            damage: damage,
            radius: range,
            range: range,
            type: 'melee',
            subtype: this.petId === 'ice' ? 'icicle' : 'whip',
            isFromPet: true,
            color: this.petId === 'ice' ? '#9edcff' : '#f0f0f0'
        });
    }
    
    /**
     * 根据攻击类型创建子弹
     */
    createBullets(attackType, damage, stats) {
        const bullets = [];
        const color = this.cfg.color || '#fff';
        
        switch (attackType) {
            case 'laser': // 激光（硫磺火牛）- v0.20.0: 全屏粗激光 + 持续伤害判定
                // 创建激光效果（贯穿全屏的粗直线）
                if (!this.game.petLaserEffects) this.game.petLaserEffects = [];
                
                const laserLength = 3000; // v0.20.0: 全屏激光长度
                const laserWidth = this.cfg.laserWidth || 30; // v0.20.0: 激光宽度
                const endX = this.x + Math.cos(this.angle) * laserLength;
                const endY = this.y + Math.sin(this.angle) * laserLength;
                
                // v0.20.0: 激光持续期间造成多次伤害
                const laserEffect = {
                    x1: this.x, y1: this.y,
                    x2: endX, y2: endY,
                    width: laserWidth,
                    color: color,
                    life: 0.5, // v0.20.0: 持续时间
                    maxLife: 0.5,
                    damage: damage,
                    isFromPet: true,
                    followSource: true,
                    owner: this,
                    length: laserLength,
                    sourceOffsetX: 0,
                    sourceOffsetY: 0,
                    angle: this.angle, // 记录角度用于碰撞检测
                    hitEnemies: new Set(), // 记录已受伤的敌人
                    lastDamageTime: 0, // 上次造成伤害的时间
                    damageInterval: 0.1 // v0.20.0: 每0.1秒造成一次伤害
                };
                this.game.petLaserEffects.push(laserEffect);
                break;
                
            case 'orbit': // 环绕激光（科技牛）- v0.20.0: 更大范围更高伤害
                if (!this.game.orbitals) this.game.orbitals = [];
                this.game.orbitals.push({
                    x: this.x, y: this.y,
                    angle: this.angle,
                    radius: 150,  // v0.20.0: 增大环绕半径
                    damage: damage,
                    life: 5,  // v0.20.0: 更长持续时间
                    maxLife: 5,
                    speed: 6,  // v0.20.0: 更快旋转
                    color: color,
                    isLaser: true,
                    isFromPet: true,
                    hitRadius: 40  // v0.20.0: 碰撞体积
                });
                break;
                
            case 'bounce': // 弹跳眼泪（眼泪牛）- v0.20.0: 更大更快
                bullets.push({
                    x: this.x, y: this.y,
                    vx: Math.cos(this.angle) * 350,  // v0.20.0: 更快
                    vy: Math.sin(this.angle) * 350,
                    life: 5,  // v0.20.0: 更长持续时间（全屏弹跳）
                    damage: damage,
                    radius: 18, // v0.20.0: 更大碰撞体积
                    bounces: 5,  // v0.20.0: 更多弹跳
                    isFromPet: true,
                    color: color,
                    type: 'bounce'
                });
                break;
                
            case 'bomb': // 炸弹（炸弹牛）- v0.20.0: 更大范围
                bullets.push({
                    x: this.x, y: this.y,
                    vx: Math.cos(this.angle) * 250,  // v0.20.0: 更快
                    vy: Math.sin(this.angle) * 250,
                    life: 2.0,  // v0.20.0: 更长飞行时间
                    damage: damage,
                    radius: 25, // v0.20.0: 更大碰撞体积
                    subtype: 'explode',
                    explodeRadius: this.cfg.explodeRadius || 150,  // v0.20.0: 使用配置的爆炸范围
                    isFromPet: true,
                    color: color
                });
                break;
                
            case 'boomerang': // 回旋飞刀（飞刀牛）- v0.20.0: 更大更快
                bullets.push({
                    x: this.x, y: this.y,
                    vx: Math.cos(this.angle) * 350,  // v0.20.0: 更快
                    vy: Math.sin(this.angle) * 350,
                    life: 3,  // v0.20.0: 更长持续时间
                    damage: damage,
                    radius: 25, // v0.20.0: 更大碰撞体积
                    subtype: 'boomerang',
                    returnTo: { x: this.x, y: this.y },
                    isReturning: false,
                    isFromPet: true,
                    color: color
                });
                break;
                
            case 'blackhole': // 黑洞（黑洞牛）- v0.20.0: 更大范围
                bullets.push({
                    x: this.x, y: this.y,
                    vx: Math.cos(this.angle) * 200,  // v0.20.0: 更快
                    vy: Math.sin(this.angle) * 200,
                    life: 6,  // v0.20.0: 更长持续时间
                    damage: damage,
                    radius: 35, // v0.20.0: 更大碰撞体积
                    subtype: 'blackhole',
                    pullRadius: this.cfg.pullRadius || 250,  // v0.20.0: 使用配置的吸引范围
                    isFromPet: true,
                    color: color
                });
                break;
                
            case 'aura': // 光环（光环牛）- v0.20.0: 更大范围更高频率
                // 以宠物为中心的范围伤害
                if (!this.game.orbitals) this.game.orbitals = [];
                this.game.orbitals.push({
                    x: this.x, y: this.y,
                    angle: 0,
                    radius: this.cfg.attackRange || 200,  // v0.20.0: 使用配置的范围
                    damage: damage,
                    life: 6,  // v0.20.0: 更长持续时间
                    maxLife: 6,
                    isAura: true,
                    isFromPet: true,
                    color: color,
                    hitRadius: 60  // v0.20.0: 碰撞体积
                });
                break;
                
            case 'homing': // 追踪导弹（导弹牛）- v0.20.0: 更快更大
                bullets.push({
                    x: this.x, y: this.y,
                    vx: Math.cos(this.angle) * 280,  // v0.20.0: 更快
                    vy: Math.sin(this.angle) * 280,
                    life: 6,  // v0.20.0: 更长追踪时间
                    damage: damage,
                    radius: 22, // v0.20.0: 更大碰撞体积
                    subtype: 'homing',
                    target: this.target,
                    turnSpeed: 4,  // v0.20.0: 更快转向
                    isFromPet: true,
                    color: color
                });
                break;
                
            case 'slow': // 减速冰锥（冰冻牛）- v0.20.0: 更大更快
                bullets.push({
                    x: this.x, y: this.y,
                    vx: Math.cos(this.angle) * 400,  // v0.20.0: 更快
                    vy: Math.sin(this.angle) * 400,
                    life: 4,  // v0.20.0: 更长持续时间
                    damage: damage,
                    radius: 22, // v0.20.0: 更大碰撞体积
                    subtype: 'ice',
                    slowAmount: 0.6, // v0.20.0: 减速60%
                    slowDuration: 3,  // v0.20.0: 更长减速时间
                    isFromPet: true,
                    color: color
                });
                break;
                
            case 'copy': // 复制牛 - 复制玩家最近一次攻击 - v0.20.0: 全屏大子弹
                // 复制玩家上一次发射的子弹类型（简化：复制玩家主武器）
                if (this.game.weapons && this.game.weapons.length > 0) {
                    const playerWeapon = this.game.weapons[0];
                    const weaponType = playerWeapon.cfg.type;
                    const weaponSubtype = playerWeapon.cfg.subtype || '';
                    
                    // 根据武器类型复制攻击
                    const copyDamage = playerWeapon.cfg.damage * this.cfg.damage; // 使用配置的伤害倍率
                    
                    if (weaponType === 'proj' || weaponSubtype === 'tech') {
                        // 复制科技投射物
                        bullets.push({
                            x: this.x, y: this.y,
                            vx: Math.cos(this.angle) * 500,  // v0.20.0: 更快
                            vy: Math.sin(this.angle) * 500,
                            life: 8,  // v0.20.0: 全屏持续时间
                            damage: copyDamage,
                            radius: 18,  // v0.20.0: 更大碰撞体积
                            isFromPet: true,
                            color: '#8888ff',
                            subtype: 'tech'
                        });
                    } else if (weaponType === 'melee') {
                        // 复制近战
                        bullets.push({
                            x: this.x + Math.cos(this.angle) * 60,  // v0.20.0: 更大范围
                            y: this.y + Math.sin(this.angle) * 60,
                            vx: 0, vy: 0,
                            life: 0.25,  // v0.20.0: 更长持续时间
                            damage: copyDamage,
                            radius: 80,  // v0.20.0: 更大范围
                            isFromPet: true,
                            color: '#8888ff',
                            type: 'melee'
                        });
                    } else {
                        // 默认复制投射物
                        bullets.push({
                            x: this.x, y: this.y,
                            vx: Math.cos(this.angle) * 500,  // v0.20.0: 更快
                            vy: Math.sin(this.angle) * 500,
                            life: 8,  // v0.20.0: 全屏持续时间
                            damage: copyDamage,
                            radius: 20, // v0.20.0: 更大碰撞体积
                            isFromPet: true,
                            color: '#8888ff'
                        });
                    }
                }
                break;
                
            case 'proj': // 默认投射物 - v0.20.0: 全屏大子弹
            default:
                bullets.push({
                    x: this.x, y: this.y,
                    vx: Math.cos(this.angle) * 500,  // v0.20.0: 更快
                    vy: Math.sin(this.angle) * 500,
                    life: 8,  // v0.20.0: 更长持续时间（全屏）
                    damage: damage,
                    radius: 20, // v0.20.0: 大碰撞体积
                    isFromPet: true,
                    color: color
                });
                break;
        }
        
        return bullets;
    }
    
    /**
     * 更新动画状态
     */
    updateAnimation(dt) {
        // 行走动画
        if (Math.abs(this.vx) > 10 || Math.abs(this.vy) > 10) {
            this.walkCycle += dt * 8;
        } else {
            this.walkCycle = 0;
        }
        
        // 计算当前帧
        const isMoving = this.walkCycle > 0;
        if (isMoving) {
            const walkCycle = Math.floor(this.walkCycle) % 4;
            this.frame = [1, 2, 3, 2][walkCycle];
        } else {
            // 待机眨眼
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
    
    /**
     * 渲染宠物
     */
    render(ctx, camera, sprites) {
        if (!camera.isVisible(this.x, this.y, 30)) return;
        
        const pos = camera.worldToScreen(this.x, this.y);
        
        // 根据状态获取正确的 sprite key
        let spriteKey;
        if (this.walkCycle > 0) {
            const walkFrames = ['player_walk_0', 'player_walk_1', 'player_walk_2', 'player_walk_3'];
            spriteKey = walkFrames[Math.floor(Date.now() / 140) % walkFrames.length];
        } else if (this.isBlinking) {
            spriteKey = 'player_blink_0';
        } else {
            const idleFrames = ['player_idle_0', 'player_idle_1'];
            spriteKey = idleFrames[Math.floor(Date.now() / 560) % idleFrames.length];
        }
        const sprite = sprites.get(spriteKey);
        
        // v0.32-fix: 使用 SpriteData 保持贴图比例
        const baseSize = 26; // 基准显示尺寸（约40%的64px）
        let drawW, drawH;
        
        // 获取玩家贴图数据（宠物使用玩家贴图）
        const playerSpriteData = window.spriteDataRegistry?.get('player');
        if (playerSpriteData) {
            const modelRatio = playerSpriteData.modelWidth / playerSpriteData.modelHeight;
            // 保持面积一致的计算
            const baseArea = baseSize * baseSize;
            if (modelRatio >= 1) {
                drawH = Math.sqrt(baseArea / modelRatio);
                drawW = drawH * modelRatio;
            } else {
                drawW = Math.sqrt(baseArea * modelRatio);
                drawH = drawW / modelRatio;
            }
        } else {
            drawW = baseSize;
            drawH = baseSize;
        }
        
        ctx.save();
        
        // 应用宠物颜色着色
        ctx.globalCompositeOperation = 'source-over';
        
        // 朝向翻转
        ctx.translate(pos.x, pos.y);
        if (Math.cos(this.angle) < 0) {
            ctx.scale(-1, 1);
        }
        
        // 行走颠簸
        const bob = this.walkCycle > 0 ? Math.abs(Math.sin(this.walkCycle * 0.5)) * -3 : 0;
        ctx.translate(0, bob);
        
        // 绘制宠物 - v0.32-fix: 使用保持比例的尺寸
        if (sprite) {
            const entityBrightness = Math.max(0, Math.min(1.5, Number(this.game?.getEntityBrightness?.('player') ?? 0.4)));
            ctx.save();
            ctx.filter = `brightness(${entityBrightness})`;
            ctx.drawImage(sprite, -drawW/2, -drawH, drawW, drawH);
            ctx.restore();
        } else {
            // 备用：绘制简单图形
            ctx.fillStyle = this.color || '#888';
            ctx.beginPath();
            ctx.arc(0, 0, baseSize * 0.4, 0, Math.PI * 2);
            ctx.fill();
        }

        // 辅助类牛牛的识别光环（仅视觉提示）
        if (this.petId === 'aura' || this.petId === 'holy' || this.petId === 'godhead') {
            const t = Date.now() * 0.004;
            const r = 10 + Math.sin(t + this.index) * 1.8;
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = this.petId === 'holy' ? 'rgba(140,255,220,0.65)' : 'rgba(255,210,90,0.55)';
            ctx.beginPath();
            ctx.arc(0, -drawH * 0.35, r, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        ctx.restore();
    }
}

    global.Pet = Pet;
})(window);
