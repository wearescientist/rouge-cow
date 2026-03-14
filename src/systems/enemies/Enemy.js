class Enemy {

    constructor(x, y, typeKey, tier = 1) {
        const cfg = ENEMY_TYPES[typeKey] || ENEMY_TYPES.chick;
        this.x = x; this.y = y;  // 脚底位置
        // v0.16.3: 中心点（用于特效、碰撞等）
        this.size = cfg.size || 24;  // 贴图大小
        this.typeKey = typeKey;
        
        // v0.32: 加载贴图数据用于精确碰撞箱
        this.spriteData = null;
        if (typeof window !== 'undefined' && window.spriteDataRegistry) {
            this.spriteData = window.spriteDataRegistry.get(typeKey);
        }
        // 如果没有找到，使用基于 size 的默认数据
        if (!this.spriteData) {
            const size = this.size;
            const s = size * 0.8; // 缩放后的尺寸
            // v0.32-fix: 使用 v2.0 API 格式
            this.spriteData = {
                bounds: { x: 0, y: 0, width: s, height: s },
                getHitbox: (feetX, feetY, scale = 1) => {
                    const scaledS = s * scale;
                    return {
                        x: feetX - scaledS / 2,
                        y: feetY - scaledS,
                        width: scaledS,
                        height: scaledS,
                        cx: feetX,
                        cy: feetY - scaledS / 2
                    };
                },
                getCenterPosition: (feetX, feetY) => ({
                    x: feetX,
                    y: feetY - s * 0.45
                })
            };
        }
        // v0.9.5 - 使用配置中的tier（如果有），否则使用传入的tier
        // 这样可以确保mother等敌人有正确的tier
        this.tier = cfg.tier !== undefined ? cfg.tier : tier;

        this.hp = cfg.hp + (cfg.armor || 0) * 10;

        this.maxHp = this.hp;

        this.speed = cfg.speed;

        this.dmg = cfg.dmg;

        this.exp = cfg.exp;

        this.gold = cfg.gold || 5;

        this.color = cfg.color;

        this.sprite = cfg.sprite;
        this.type = cfg.type || 'normal'; // v0.9.5 - 复制type字段
        this.special = cfg.special;
        this.armor = cfg.armor || 0;

        this.vx = 0; this.vy = 0;

        this.hitTimer = 0;

        this.attackCd = 0;

        this.specialCd = 0;

        

        // 状态效果

        this.slowTimer = 0;

        this.stunTimer = 0;

        this.poisonTimer = 0;

        this.poisonDmg = 0;

        this.blindTimer = 0;

        

        // 动画系统

        this.animType = cfg.anim || 'walk';

        this.animTimer = 0;

        this.facingRight = true;

        this.walkCycle = 0;

    }





    // ===== Boss AI系统 =====
    updateBossAI(dt, player, room) {
        const floor = this.bossFloor || 1;
        const bossCfg = BOSS_TYPES['floor' + floor] || BOSS_TYPES.floor1;
        const skills = bossCfg.skills;
        const game = window.game;
        
        // 第6层Boss固定在中央，不移动
        if (this.isStatic || floor === 6) {
            // 只执行技能，不移动
            this.updateBossSkillLogic(dt, player, room, bossCfg, skills, 1, 1, 1);
            return;
        }
        
        // 计算当前阶段
        const hpPercent = this.hp / this.maxHp;
        let currentPhase = bossCfg.phases[0];
        for (const phase of bossCfg.phases) {
            if (hpPercent <= phase.hpPercent / 100) {
                currentPhase = phase;
            }
        }
        
        // 应用阶段加成
        const speedMult = currentPhase.speedMult || 1;
        const dmgMult = currentPhase.dmgMult || 1;
        const cdMult = currentPhase.skillCdMult || 1;
        
        // 冲撞攻击处理
        if (this.isCharging) {
            // 冲撞中，保持高速移动
            let newX = this.x + this.vx * dt;
            let newY = this.y + this.vy * dt;
            
            // Boss冲撞也要限制在有效区域内
            const clamped = SURVIVOR_CONFIG.clampToValidArea(newX, newY, game.curRoom);
            
            // 如果撞到边界，停止冲撞
            if (clamped.x !== newX || clamped.y !== newY) {
                this.isCharging = false;
                this.vx = 0;
                this.vy = 0;
                // 撞墙效果 - v0.16.3: 使用中心点
                game.particles.burst(this.cx, this.cy, '#f44', 10);
                // v0.30-fix: Boss撞墙使用重击壳类音效
                game.audioCtrl.playHit('shell');
            } else {
                this.x = clamped.x;
                this.y = clamped.y;
            }
            
            // 冲撞伤害检测 - v0.17.4 fix: 添加死亡检测和无敌检查
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < 40 && this.attackCd <= 0) {
                if (!game.godMode && !player.isDashing) {
                    const isDead = player.takeDamage(this.dmg * skills.charge.dmg * dmgMult);
                    if (isDead || player.hp <= 0) {
                        // 尝试复活
                        if (game.tryRevive) {
                            if (game.tryRevive()) {
                                // 复活成功
                            } else {
                                player.hp = 0;
                                game.state = 'gameover';
                                game.audioCtrl.play('gameover');
                            }
                        } else {
                            player.hp = 0;
                            game.state = 'gameover';
                            game.audioCtrl.play('gameover');
                        }
                    }
                }
                this.attackCd = 0.5;
                
                // 冲撞结束
                this.isCharging = false;
                this.vx = 0;
                this.vy = 0;
            }
            
            // 冲撞持续1.5秒后结束
            if (!this.chargeTimer) this.chargeTimer = 0;
            this.chargeTimer += dt;
            if (this.chargeTimer > 1.5) {
                this.isCharging = false;
                this.chargeWarning = false;
                this.chargeTimer = 0;
                this.vx = 0;
                this.vy = 0;
            }
            return;
        }
        
        // 冲撞预警
        if (this.chargeWarning) {
            this.chargeWarningTimer += dt;
            if (this.chargeWarningTimer >= skills.charge.warningTime) {
                // 开始冲撞！
                this.isCharging = true;
                this.chargeWarning = false;
                this.vx = this.chargeDir.x * skills.charge.speed;
                this.vy = this.chargeDir.y * skills.charge.speed;
                game.audioCtrl.playDash();
            }
            return;
        }
        
        // 尝试使用技能
        const usedSkill = this.updateBossSkillLogic(dt, player, room, bossCfg, skills, speedMult, dmgMult, cdMult);
        
        // 如果没有使用技能，正常追击玩家
        if (!usedSkill && !this.isCharging && !this.chargeWarning) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist > 0) {
                this.vx = (dx / dist) * this.speed * speedMult;
                this.vy = (dy / dist) * this.speed * speedMult;
            }
            
            // Boss移动也要限制在有效区域内
            let newX = this.x + this.vx * dt;
            let newY = this.y + this.vy * dt;
            const clamped = SURVIVOR_CONFIG.clampToValidArea(newX, newY, game.curRoom);
            this.x = clamped.x;
            this.y = clamped.y;
        }
        
        // 基础攻击冷却
        if (this.attackCd > 0) this.attackCd -= dt;
    }
    
    // v0.12.0 - 技能逻辑抽象（供静止Boss和普通Boss共用）
    updateBossSkillLogic(dt, player, room, bossCfg, skills, speedMult, dmgMult, cdMult) {
        const game = window.game;
        
        // 更新技能冷却
        for (const skillName in this.skillCooldowns) {
            if (this.skillCooldowns[skillName] > 0) {
                this.skillCooldowns[skillName] -= dt;
            }
        }
        
        // 尝试使用技能（按优先级）
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        // 1. 冲撞攻击（静止Boss不使用）
        if (!this.isStatic && this.skillCooldowns.charge <= 0 && dist > 100 && dist < 400) {
            this.skillCooldowns.charge = skills.charge.cd * cdMult;
            this.chargeWarning = true;
            this.chargeWarningTimer = 0;
            this.chargeDir = { x: dx/dist, y: dy/dist };
            game.particles.burst(this.cx, this.cy, '#f0f', 10);
            game.audioCtrl.play('warning');
            return true;
        }
        
        // 2. 震荡波（玩家近身时使用）- v0.17.4 fix: 添加死亡检测和无敌检查
        if (this.skillCooldowns.shockwave <= 0 && dist < skills.shockwave.range) {
            this.skillCooldowns.shockwave = skills.shockwave.cd * cdMult;
            game.particles.burst(this.cx, this.cy, '#f0f', 30);
            if (dist < skills.shockwave.range && !game.godMode && !player.isDashing) {
                const isDead = player.takeDamage(this.dmg * skills.shockwave.dmg * dmgMult);
                if (isDead || player.hp <= 0) {
                    if (game.tryRevive && game.tryRevive()) {
                        // 复活成功
                    } else {
                        player.hp = 0;
                        game.state = 'gameover';
                        game.audioCtrl.play('gameover');
                    }
                }
            }
            // audio effect removed;
            return true;
        }
        
        // 3. 弹幕齐射
        if (this.skillCooldowns.bullet_hell <= 0) {
            this.skillCooldowns.bullet_hell = skills.bullet_hell.cd * cdMult;
            for (let i = 0; i < skills.bullet_hell.bulletCount; i++) {
                const angle = (i / skills.bullet_hell.bulletCount) * Math.PI * 2;
                game.bullets.push({
                    x: this.x, y: this.y,
                    vx: Math.cos(angle) * skills.bullet_hell.speed,
                    vy: Math.sin(angle) * skills.bullet_hell.speed,
                    dmg: this.dmg * skills.bullet_hell.dmg * dmgMult,
                    color: '#ff00ff', life: 3, isEnemyBullet: true
                });
            }
            game.audioCtrl.play('whip');
            return true;
        }
        
        // 4. 追踪弹
        if (this.skillCooldowns.homing <= 0) {
            this.skillCooldowns.homing = skills.homing.cd * cdMult;
            for (let i = 0; i < skills.homing.count; i++) {
                const targetAngle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.3;
                game.bullets.push({
                    x: this.x, y: this.y,
                    vx: Math.cos(targetAngle) * skills.homing.speed,
                    vy: Math.sin(targetAngle) * skills.homing.speed,
                    dmg: this.dmg * skills.homing.dmg * dmgMult,
                    color: '#ff00ff', life: 5, isEnemyBullet: true,
                    homing: true, target: player
                });
            }
            game.audioCtrl.play('whip');
            return true;
        }
        
        // 5. 召唤小怪
        if (this.skillCooldowns.summon <= 0) {
            this.skillCooldowns.summon = skills.summon.cd * cdMult;
            for (let i = 0; i < skills.summon.count; i++) {
                const angle = (i / skills.summon.count) * Math.PI * 2;
                const r = 80;
                const sx = this.x + Math.cos(angle) * r;
                const sy = this.y + Math.sin(angle) * r;
                const typeKey = randChoice(skills.summon.types);
                const minion = createEnemy(sx, sy, typeKey);
                minion.hp *= 0.5; minion.maxHp *= 0.5;
                if (room.hordeManager) room.hordeManager.enemies.push(minion);
                else room.enemies.push(minion);
            }
            game.particles.burst(this.cx, this.cy, '#0f0', 20);
            game.audioCtrl.play('spawn');
            return true;
        }
        
        return false;
    }

    // v0.30-iter5: 获取碰撞半径 - 优先使用 SpriteData 配置
    getCollisionRadius() {
        const sprites = window.game?.sprites;
        const scale = this.getCollisionScale(sprites);

        if (this.spriteData && this.spriteData.bounds) {
            return (this.spriteData.bounds.width * scale) / 2;
        }

        // 回退
        return ((this.size || 24) * scale) * 0.5;
    }
    
    // v0.30-iter5: 获取贴图中心 Y 坐标
    // v0.32-fix: 使用 this.spriteData 而不是查询 registry，修复 typeKey 问题
    getCenterY() {
        if (this.spriteData?.anchor?.center && this.spriteData?.anchor?.feet) {
            const scale = this.getCollisionScale(window.game?.sprites);
            const dy = (this.spriteData.anchor.center.y - this.spriteData.anchor.feet.y) * scale;
            return this.y + dy;
        }
        // 回退：基于 size 的估算
        return this.y - (this.size || 24) * 0.5;
    }

    // v0.18.0: 检测点是否在敌人贴图范围内
    containsPoint(px, py) {
        const cx = this.x;
        const cy = this.getCenterY();
        const radius = this.getCollisionRadius();
        
        const dx = px - cx;
        const dy = py - cy;
        return (dx * dx + dy * dy) <= (radius * radius);
    }

    // v0.18.0: 检测敌人贴图是否与圆形范围相交
    intersectsCircle(cx, cy, radius) {
        const ex = this.x;
        const ey = this.getCenterY();
        const enemyRadius = this.getCollisionRadius();
        
        const dx = cx - ex;
        const dy = cy - ey;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance <= (radius + enemyRadius);
    }
    
    // v0.18.0: 检测子弹（圆形）与贴图（圆形）的碰撞
    intersectsBullet(bx, by, bulletRadius) {
        const ex = this.x;
        const ey = this.getCenterY();
        const enemyRadius = this.getCollisionRadius();
        
        const dx = bx - ex;
        const dy = by - ey;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance <= (bulletRadius + enemyRadius);
    }

    update(dt, player, room) {
        // v0.30-iter5: 更新中心点 - 使用 SpriteData 配置
        this.cx = this.x;
        this.cy = this.getCenterY();
        
        // 🩸 统一死亡检测 - 不管怎么死的，只要hp<=0就生成血迹
        if (this.hp <= 0) {
            // 确保只生成一次血迹
            if (!this._bloodSpawned) {
                this._bloodSpawned = true;
                if (window.game && window.game.bloodStains && window.game.curRoom) {
                    window.game.bloodStains.addStain(this.x, this.y, this.color, this.isBoss, window.game.curRoom, null, this.type);
                }
            }
            return; // 死亡后不再更新
        }

        // 状态效果处理
        if (this.stunTimer > 0) {
            this.stunTimer -= dt;
            return; // 眩晕时无法行动
        }

        if (this.slowTimer > 0) {
            this.slowTimer -= dt;
            dt *= 0.5; // 减速50%
        }

        if (this.blindTimer > 0) {
            this.blindTimer -= dt;
            dt *= 0.65; // 致盲时进一步减速
        }

        // 毒伤害处理
        if (this.poisonTimer > 0) {
            this.poisonTimer -= dt;
            this.hp -= this.poisonDmg * dt;
        }
        
        // ===== Boss AI系统 =====
        if (this.isBoss && room && window.game) {
            this.updateBossAI(dt, player, room);
            return; // Boss使用自定义AI，不执行普通移动
        }
        
        // 特殊行为
        let normalChase = true; // 是否执行普通追踪

        if (this.special === 'jump' && this.specialCd <= 0) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const d = Math.sqrt(dx*dx + dy*dy);

            if (d > 0 && d < 200) {
                // 跳跃突击
                this.vx = (dx / d) * this.speed * 2;
                this.vy = (dy / d) * this.speed * 2;
                this.specialCd = 2;
                normalChase = false;
            }
            // 如果距离不满足，继续执行普通追踪

        } else if (this.special === 'dive' && this.specialCd <= 0) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const d = Math.sqrt(dx*dx + dy*dy);

            if (d > 100 && d < 400) {
                // 俯冲攻击
                this.vx = (dx / d) * this.speed * 3;
                this.vy = (dy / d) * this.speed * 3;
                this.specialCd = 3;
                normalChase = false;
            }
            // 如果距离不满足，继续执行普通追踪
        }

        // 普通追踪逻辑（当特殊技能条件不满足时）
        if (normalChase) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const d = Math.sqrt(dx*dx + dy*dy);
            
            if (d > 0) {
                this.vx = (dx / d) * this.speed;
                this.vy = (dy / d) * this.speed;
            } else {
                // 防止d=0时卡住，给一个默认速度
                this.vx = this.speed;
                this.vy = 0;
            }
        }

        

        if (this.special === 'tank') {

            this.vx *= 0.8;

            this.vy *= 0.8;

        }

        

        // v0.9.5 - T2射手型敌人射击能力
        if (this.type === 'ranged' && this.specialCd <= 0) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const d = Math.sqrt(dx*dx + dy*dy);
            
            if (d > 50 && d < 400) { // 在射程内
                this.specialCd = 2; // 射击冷却2秒
                
                // 根据敌人类型发射不同子弹
                const angle = Math.atan2(dy, dx);
                
                if (this.typeKey === 'snake') {
                    // 毒蛇：喷毒液（直线弹道，绿色）
                    game.bullets.push({
                        x: this.x, y: this.y,
                        vx: Math.cos(angle) * 200,
                        vy: Math.sin(angle) * 200,
                        dmg: this.dmg,
                        color: '#44aa44',
                        life: 2,
                        isEnemyBullet: true
                    });
                } else if (this.typeKey === 'goose') {
                    // 守卫鹅：羽毛齐射（3发扇形）
                    for (let i = -1; i <= 1; i++) {
                        const spreadAngle = angle + i * 0.3;
                        game.bullets.push({
                            x: this.x, y: this.y,
                            vx: Math.cos(spreadAngle) * 180,
                            vy: Math.sin(spreadAngle) * 180,
                            dmg: this.dmg * 0.7,
                            color: '#ffffff',
                            life: 1.5,
                            isEnemyBullet: true
                        });
                    }
                } else if (this.typeKey === 'fox') {
                    // 狡猾狐狸：火球（爆炸效果）
                    game.bullets.push({
                        x: this.x, y: this.y,
                        vx: Math.cos(angle) * 160,
                        vy: Math.sin(angle) * 160,
                        dmg: this.dmg * 1.5,
                        color: '#ff8800',
                        life: 2.5,
                        isEnemyBullet: true,
                        explode: true // 爆炸标记
                    });
                }
            }
        }
        
        // v0.9.5 - T3小Boss特殊能力
        if (this.tier === 3 && this.specialCd <= 0) {
            if (this.special === 'howl') {
                // 狼王：狼嚎召唤3只白狼
                this.specialCd = 8;
                for (let i = 0; i < 3; i++) {
                    const angle = (i / 3) * Math.PI * 2;
                    const r = 60;
                    const wolf = createEnemy(
                        this.x + Math.cos(angle) * r,
                        this.y + Math.sin(angle) * r,
                        'dog2'
                    );
                    wolf.hp *= 0.6; // 召唤的狼较弱
                    wolf.maxHp *= 0.6;
                    // v0.16.3: 统一添加到hordeManager
                    if (room.hordeManager) {
                        room.hordeManager.enemies.push(wolf);
                    } else {
                        room.enemies.push(wolf);
                    }
                }
                // 加速效果
                this.speed *= 1.3;
                game.particles.burst(this.cx, this.cy, '#fa0', 20);  // v0.16.3: 使用中心点
                
            } else if (this.special === 'mimic') {
                // 宝箱怪：伪装（静止不动，玩家靠近时扑击）
                const dx = player.x - this.x;
                const dy = player.y - this.y;
                const d = Math.sqrt(dx*dx + dy*dy);
                
                if (d < 150) {
                    // 扑击！
                    this.specialCd = 4;
                    this.vx = (dx / d) * this.speed * 4;
                    this.vy = (dy / d) * this.speed * 4;
                    game.particles.burst(this.cx, this.cy, '#f44', 15);  // v0.16.3: 使用中心点
                } else {
                    // 伪装：几乎不动
                    this.vx *= 0.1;
                    this.vy *= 0.1;
                }
                
            } else if (this.special === 'ethereal') {
                // 幽灵：穿墙（不会被房间边界阻挡）+ 追踪弹
                this.specialCd = 3;
                // 发射追踪弹
                game.bullets.push({
                    x: this.x, y: this.y,
                    vx: 0, vy: 0,
                    dmg: this.dmg,
                    color: '#aaffff',
                    life: 4,
                    isEnemyBullet: true,
                    homing: true,
                    target: player,
                    speed: 150
                });
                
            } else if (this.typeKey === 'turtle') {
                // 玄龟：水弹射击（单发，冷却短）
                this.specialCd = 2;
                const dx = player.x - this.x;
                const dy = player.y - this.y;
                const angle = Math.atan2(dy, dx);
                game.bullets.push({
                    x: this.x, y: this.y,
                    vx: Math.cos(angle) * 180,
                    vy: Math.sin(angle) * 180,
                    dmg: this.dmg,
                    color: '#4488ff',
                    life: 2,
                    isEnemyBullet: true
                });
            }
        }
        
        // 原有summon能力（银牙的小狗召唤）
        if (this.special === 'summon' && this.specialCd <= 0) {
            const enemyCount = room.hordeManager ? room.hordeManager.enemies.length : room.enemies.length;
            if (enemyCount < 10) {
                this.specialCd = 5;
                const angle = Math.random() * Math.PI * 2;
                const r = 30;
                const dog = createEnemy(
                    this.x + Math.cos(angle) * r,
                    this.y + Math.sin(angle) * r,
                    'dog'
                );
                // v0.16.3: 统一添加到hordeManager
                if (room.hordeManager) {
                    room.hordeManager.enemies.push(dog);
                } else {
                    room.enemies.push(dog);
                }
            }
        }

        

        for (const other of room.enemies) {

            if (other === this) continue;

            const odx = this.x - other.x;

            const ody = this.y - other.y;

            const od = Math.sqrt(odx*odx + ody*ody);

            if (od < 30 && od > 0) {

                this.vx += (odx / od) * 50;

                this.vy += (ody / od) * 50;

            }

        }

        


        // 计算新位置
        let newX = this.x + this.vx * dt;
        let newY = this.y + this.vy * dt;
        
        // v0.14.1 - 碰撞限制：检查与玩家和其他敌人的碰撞
        if (window.collisionSystem && room) {
            const allEnemies = room.getActiveEnemies ? room.getActiveEnemies() : room.enemies;
            const restricted = window.collisionSystem.restrictEnemyMovement(
                this, newX, newY, player, allEnemies
            );
            newX = restricted.x;
            newY = restricted.y;
        }
        
        // 限制在有效区域内（地板+门）- 幽灵可以穿墙
        if (this.special !== 'ethereal') {
            const clamped = SURVIVOR_CONFIG.clampToValidArea(newX, newY, room);
            
            // 如果被限制了，给予反弹速度（避免卡在边界）
            if (clamped.x !== newX) this.vx *= -0.5;
            if (clamped.y !== newY) this.vy *= -0.5;
            
            this.x = clamped.x;
            this.y = clamped.y;
        } else {
            // 幽灵：仍然限制在房间范围内（防止走失）
            const margin = 200;
            const maxX = room ? room.width + margin : 1340;
            const maxY = room ? room.height + margin : 940;
            const minX = -margin;
            const minY = -margin;
            if (newX < minX || newX > maxX || newY < minY || newY > maxY) {
                // 如果幽灵走太远，瞬移回房间内
                this.x = room ? room.width / 2 : 600;
                this.y = room ? room.height / 2 : 400;
            } else {
                this.x = newX;
                this.y = newY;
            }
        }
        

        // 更新动画状态

        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);

        if (speed > 10) {

            // 根据速度方向决定朝向

            if (Math.abs(this.vx) > Math.abs(this.vy)) {

                this.facingRight = this.vx > 0;

            }

            // 更新行走周期

            this.walkCycle += speed * dt * 0.02;

        } else {

            this.walkCycle = 0;

        }

        this.animTimer += dt;

        

        if (this.hitTimer > 0) this.hitTimer -= dt;

        if (this.attackCd > 0) this.attackCd -= dt;

        if (this.specialCd > 0) this.specialCd -= dt;

    }



    takeDamage(dmg, stats = {}) {
        // 如果已经死亡，不再扣血
        if (this.hp <= 0) return true;
        
        // v0.25: 敌人护甲改为概率格挡（和玩家一致）
        // 格挡概率公式：护甲/(护甲+17)，上限50%
        const armor = this.armor || 0;
        const blockChance = Math.min(0.5, armor / (armor + 17));
        
        // 检查是否格挡
        if (Math.random() < blockChance) {
            // 格挡成功！显示"格挡"提示
            if (window.game && window.game.damageNumbers) {
                window.game.damageNumbers.spawn(this.x, this.y - 20, "格挡!", {
                    color: '#48f', size: 12
                });
            }
            return false; // 没死，且没受伤
        }
        
        // 未格挡，正常受伤
        const actualDmg = dmg;
        this.hp -= actualDmg;

        

        // 确保HP不会低于0

        if (this.hp < 0) this.hp = 0;

        

        this.hitTimer = 0.15;

        

        // 显示伤害数字

        if (window.game && window.game.damageNumbers) {

            window.game.damageNumbers.spawn(this.x, this.y - 20, Math.floor(actualDmg), {
                critical: !!stats.isCrit

            });

        }

        

        // 受击粒子效果 - 根据伤害量调整
        const isCrit = !!stats.isCrit;
        
        if (window.game && window.game.particles) {
            if (isCrit) {
                // 暴击特效
                window.game.particles.critEffect(this.x, this.y);
            } else if (actualDmg >= 20) {
                // 高伤害特效
                window.game.particles.hitEffect(this.x, this.y, '#fa4', actualDmg);
            } else {
                // 普通受击
                window.game.particles.hitEffect(this.x, this.y, '#fff', actualDmg);
            }
        }
        
        // 受击音效和屏幕震动
        if (window.game && window.game.audio) {
            // 根据敌人类型获取材质 - v0.30-fix: 使用 typeKey 而不是 type
            const enemyType = this.typeKey || 'chick';
            const ENEMY_MATERIALS = {
                // T1 小怪
                'chick': 'bird', 'snail': 'shell', 'pigeon': 'bird',
                'duck3': 'bird', 'bat': 'bird', 'rabbit': 'fur', 'rabbit2': 'fur',
                'bird': 'bird', 'duck2': 'bird', 'pig2': 'fur', 'cat': 'fur',
                'duck': 'bird', 'squirrel': 'fur', 'goose': 'bird', 'dog': 'fur',
                'pig': 'fur', 'sheep': 'fur', 'snake': 'slime',
                // T2 精英
                'bee': 'bird', 'panther': 'fur', 'crab': 'shell', 'nibei': 'shell',
                'bear': 'fur', 'fox': 'fur', 'tiaotiao': 'fur', 'tiezhua': 'bird',
                'yinya': 'fur', 'dog2': 'fur',
                // T3 小Boss
                'wolf_king': 'fur', 'turtle': 'shell', 'mimic': 'bone', 'ghost': 'slime',
                // T4 Boss
                'mother': 'slime'
            };
            const material = ENEMY_MATERIALS[enemyType] || 'flesh';
            
            if (isCrit) {
                window.game.audioCtrl.playCrit();
                // 暴击时屏幕震动
                if (window.game.camera) window.game.camera.addShake(15);
            } else {
                window.game.audioCtrl.playHit(material);
                // 普通受击轻微震动
                if (window.game.camera && actualDmg >= 10) window.game.camera.addShake(5);
            }
        }

        

        // 击退效果

        if (stats.knockback && window.game && window.game.player) {

            const angle = Math.atan2(this.y - window.game.player.y, this.x - window.game.player.x);

            this.x += Math.cos(angle) * stats.knockback;

            this.y += Math.sin(angle) * stats.knockback;

        }

        

        // 应用状态效果

        if (stats.slowChance && Math.random() < stats.slowChance) {

            this.slowTimer = 2;

        }

        if (stats.stunChance && Math.random() < stats.stunChance) {

            this.stunTimer = 1;

        }

        if (stats.freezeDuration) {
            this.stunTimer = Math.max(this.stunTimer || 0, stats.freezeDuration);
        }

        if (stats.blind) {
            this.blindTimer = Math.max(this.blindTimer || 0, 2.4);
        }

        

        return this.hp <= 0;

    }



    applyPoison(dmg, duration) {

        this.poisonDmg = Math.max(this.poisonDmg, dmg);

        this.poisonTimer = Math.max(this.poisonTimer, duration);

    }



    getSpriteDimensions(sprites) {
        const outlinedSpriteName = this.getOutlinedSpriteName();
        const sprite = sprites?.get(outlinedSpriteName) || sprites?.get(this.sprite);
        return {
            width: sprite?.width || 64,
            height: sprite?.height || 64
        };
    }

    getRenderScale(sprites) {
        // 第6层Boss维持独立超大体型
        if (this.isBoss && this.bossFloor === 6) {
            const { height } = this.getSpriteDimensions(sprites);
            return height > 0 ? 300 / height : 1;
        }

        // T1 用贴图原始尺寸；T2/T3/T4 保持合理体型差
        const tierScale = {
            1: 1.0,
            2: 1.2,
            3: 1.45,
            4: 1.75
        };
        return tierScale[this.tier] || 1.0;
    }

    getCollisionScale(sprites) {
        return this.getRenderScale(sprites);
    }

    getTargetHeight(sprites, screenScale = null) {
        const { height } = this.getSpriteDimensions(sprites);
        const canvasScale = typeof window !== 'undefined' && window.game && typeof window.game.getCanvasScale === 'function'
            ? window.game.getCanvasScale()
            : 1;
        const appliedScale = Number.isFinite(screenScale) ? screenScale : canvasScale;
        return Math.round(height * this.getRenderScale(sprites) * appliedScale);
    }

    // 使用世界坐标绘制（在Room.draw中使用）
    draw(ctx, sprites, screenScale = null) {
        const targetHeight = this.getTargetHeight(sprites, screenScale);
        const size = targetHeight / 2;  // 用于特效的参考尺寸

        

        if (this.hitTimer > 0 && Math.floor(Date.now() / 50) % 2) {

            ctx.globalAlpha = 0.5;

        }

        

        // 状态效果视觉 - v0.18.4 fix: 使用中心坐标而非脚底坐标
        const centerX = this.cx || this.x;
        const centerY = this.cy || (this.y - (this.size || 24) * 0.5);

        if (this.slowTimer > 0) {
            ctx.strokeStyle = '#48f';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(centerX, centerY, size + 5, 0, Math.PI * 2);
            ctx.stroke();
        }

        if (this.poisonTimer > 0) {
            ctx.strokeStyle = '#4a4';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(centerX, centerY, size + 8, 0, Math.PI * 2);
            ctx.stroke();
        }

        

        // Boss颜色随血量渐变: #800(深红) -> #f00(亮红) - v0.18.4 fix: 使用中心坐标
        if (this.isBoss) {
            const hpPercent = this.hp / this.maxHp;
            // 血量越低，颜色越亮红; 满血时深红#800，30%时亮红#f00
            const r = Math.floor(128 + 127 * (1 - hpPercent));
            const g = 0;
            const b = 0;
            const glowColor = `rgb(${r}, ${g}, ${b})`;
            
            ctx.strokeStyle = glowColor;
            ctx.lineWidth = 3;
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(centerX, centerY, size + 10, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        

        // 绘制敌人精灵（带动画效果）
        // 优先使用描边贴图（根据类型：white普通/red精英/goldBOSS）
        const outlinedSpriteName = this.getOutlinedSpriteName();
        let sprite = sprites.get(outlinedSpriteName);
        // 如果描边贴图不存在，回退到基础贴图
        if (!sprite) {
            sprite = sprites.get(this.sprite);
        }
        
        if (sprite) {
            ctx.save();
            
            // 计算动画偏移 - 只有上下移动，没有旋转
            let offsetY = 0;
            let scaleX, scaleY = 1;
            
            // 判断贴图朝向：头朝左还是朝右
            // 头朝右的贴图需要反向翻转
            const headFacingRight = ['turtle', 'dog2', 'goose', 'snail']; // 头朝右的贴图列表
            const isHeadRight = headFacingRight.includes(this.sprite);
            
            // 水平翻转：根据朝向和贴图头部方向计算
            // 玩家在右边(facingRight=true)时，头应该朝右
            // 头朝左的贴图：facingRight ? 不翻转(1) : 翻转(-1)
            // 头朝右的贴图：facingRight ? 翻转(-1) : 不翻转(1)
            if (isHeadRight) {
                scaleX = this.facingRight ? -1 : 1;
            } else {
                scaleX = this.facingRight ? 1 : -1;
            }

            

            const walkPhase = Math.sin(this.walkCycle);

            const walkPhase2 = Math.cos(this.walkCycle);

            

            switch (this.animType) {
                case 'hop': // 跳跃 - 大幅上下弹跳
                    offsetY = Math.abs(Math.sin(this.walkCycle * 0.5)) * -8;
                    break;
                case 'hopfast': // 快速跳跃
                    offsetY = Math.abs(Math.sin(this.walkCycle * 0.8)) * -6;
                    break;
                case 'scurry': // 疾走 - 高频小幅
                    offsetY = walkPhase * 2;
                    break;
                case 'slide': // 滑动 - 平滑
                    offsetY = 0;
                    break;
                case 'flutter': // 振翅 - 快速振动
                    offsetY = Math.sin(this.animTimer * 15) * 3;
                    break;
                case 'waddle': // 摇摆 - 左右摇摆
                    offsetY = Math.abs(walkPhase) * -2;
                    break;
                case 'fly': // 飞行 - 上下浮动
                    offsetY = Math.sin(this.animTimer * 3) * 4;
                    break;
                case 'prowl': // 潜行 - 缓慢接近
                    offsetY = walkPhase2 * 1;
                    break;
                case 'run': // 奔跑
                    offsetY = Math.abs(walkPhase) * -3;
                    break;
                case 'trot': // 小跑
                    offsetY = walkPhase * 2;
                    break;
                case 'slither': // 滑行 - S形
                    offsetY = Math.sin(this.x * 0.1 + this.animTimer * 5) * 2;
                    break;
                case 'heavy': // 沉重 - 慢速大幅
                    offsetY = Math.abs(walkPhase) * -4;
                    break;
                case 'sidle': // 横移
                    offsetY = 0;
                    break;
                case 'crawl': // 爬行
                    offsetY = 4;
                    // v0.33: 移除scaleY压缩，保持贴图原始比例
                    break;
                case 'charge': // 冲锋
                    offsetY = Math.abs(walkPhase) * -2;
                    break;
                case 'dive': // 俯冲
                    offsetY = Math.sin(this.animTimer * 8) * 6;
                    break;
                default: // 默认行走
                    offsetY = walkPhase * 1.5;
            }
            
            // 应用变换 - 只有上下移动和水平翻转，没有旋转
            ctx.translate(this.x, this.y + offsetY);
            ctx.scale(scaleX, scaleY);

            

            // 精英敌人：绘制颜色叠加效果（换色）

            if (this.isElite) {

                // 使用混合模式给精英敌人添加颜色色调

                ctx.save();

                ctx.globalCompositeOperation = 'source-atop';

                ctx.fillStyle = 'rgba(255, 100, 100, 0.4)'; // 红色精英色调

                ctx.fillRect(-size, -size, size * 2, size * 2);

                ctx.restore();

            }

            

            // v0.33: 简化的贴图绘制 - 贴图已裁剪，直接按目标高度绘制
            // 从 bounds 获取贴图尺寸
            let spriteW = sprite.width || 64;
            let spriteH = sprite.height || 64;
            
            // 计算保持比例的尺寸（targetHeight 已在方法开头计算）
            const scale = (size * 2) / spriteH;
            const drawW = spriteW * scale;
            const drawH = spriteH * scale;
            
            // 计算绘制位置（脚底对齐）
            const drawX = -drawW / 2;
            const drawY = -drawH;
            
            // v0.30-opt1: 优化描边
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 6;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            // 绘制贴图主体（带描边）
            ctx.drawImage(sprite, drawX, drawY, drawW, drawH);
            ctx.restore();
            
            // 精英敌人发光边框
            if (this.isElite) {
                ctx.save();
                ctx.strokeStyle = 'rgba(255, 80, 80, 0.8)';
                ctx.lineWidth = 2;
                ctx.strokeRect(drawX - 2, drawY - 2, drawW + 4, drawH + 4);
                ctx.restore();
            }

            

            // 精英敌人：添加发光边框效果

            if (this.isElite) {

                ctx.save();

                ctx.strokeStyle = 'rgba(255, 80, 80, 0.8)';

                ctx.lineWidth = 2;

                ctx.strokeRect(-size - 2, -size - 2, size * 2 + 4, size * 2 + 4);

                ctx.restore();

            }

            

            ctx.restore();

        } else {

            // 使用emoji作为后备

            const emojiMap = {

                chick: '🐤', pig: '🐷', sheep: '🐑', dog: '🐕', cat: '🐱',

                bear: '🐻', rabbit: '🐰', bird: '🐦', turtle: '🐢', dog2: '🐺',

                snail: '🐌', squirrel: '🐿️', goose: '🪿',

                duck: '🦆', duck2: '🦆', duck3: '🐥', snake: '🐍',

                crab: '🦀', pigeon: '🕊️', pig2: '🐖', rabbit2: '🐇'

            };

            ctx.fillStyle = '#fff';  // 重置为白色，避免继承黑色背景

            ctx.font = this.isBoss ? '48px Arial' : '24px Arial';

            ctx.textAlign = 'center';

            ctx.fillText(emojiMap[this.sprite] || '👾', this.x, this.y + 8);

        }

        

        ctx.globalAlpha = 1;

        

        if (this.hp < this.maxHp) {
            const barWidth = this.isBoss ? 100 : 24;
            const barOffset = this.isBoss ? 12 : 8;  // 在精灵顶部之上
            ctx.fillStyle = '#000';
            ctx.fillRect(this.x - barWidth/2, this.y - size * 2 - barOffset, barWidth, 6);
            // v0.9.5 - 使用配置的color
            ctx.fillStyle = this.color || '#f00';
            ctx.fillRect(this.x - barWidth/2, this.y - size * 2 - barOffset, barWidth * (this.hp / this.maxHp), 6);
        }

        

        if (this.isBoss) {

            ctx.fillStyle = '#f0f';

            ctx.font = 'bold 16px Arial';

            ctx.textAlign = 'center';

            ctx.fillText(this.name, this.x, this.y - size - 20);

        }

    }

    

    // 使用偏移坐标绘制（在已经translate到屏幕坐标后调用）

    // 获取描边颜色贴图名称 - 基于tier的颜色系统
    // 已加载颜色: white, red, pink, orange, purple, gold, blue, cyan, green, lime, magenta, yellow
    getOutlinedSpriteName() {
        // v0.12.0 fix: 第6层Boss直接使用配置好的sprite名称(如boss6_yellow)
        if (this.isBoss && this.bossFloor === 6) {
            return this.sprite;
        }
        
        // v0.9.5 - 使用配置中的color属性映射到贴图颜色
        const colorMap = {
            '#fff': 'white',    // T1 白色
            '#48f': 'blue',     // T2 速度 蓝色
            '#4a4': 'green',    // T2 坦克 绿色
            '#f44': 'red',      // T2 射手 红色
            '#a4f': 'purple',   // T2 刺客 紫色
            '#fa0': 'gold',     // T3 金色小Boss
            '#d80': 'gold',     // T3 玄龟
            '#f80': 'gold',     // T3 宝箱怪
            '#fa4': 'gold',     // T3 幽灵
            '#800': 'gold'      // T4 Boss 深红
        };
        
        // 使用配置的color映射，如果没有映射则根据tier回退
        const outlineColor = colorMap[this.color] || 
            (this.tier === 1 ? 'white' : 
             this.tier === 2 ? 'lime' : 
             this.tier >= 3 ? 'gold' : 'white');
        
        return this.sprite + '_' + outlineColor;
    }
    
    // 获取敌人显示名称（带等级标识）
    getDisplayName() {
        const tierPrefix = {
            1: '',
            2: '强壮',
            3: '凶恶',
            4: '精英',
            5: '首领',
            6: 'BOSS'
        };
        const prefix = tierPrefix[this.tier] || '';
        return prefix ? `[${prefix}] ${this.typeKey}` : this.typeKey;
    }

    drawWithOffset(ctx, sprites, floor, screenScale = null) {
        // v0.33: 统一使用 getTargetHeight 计算目标高度（传入sprites获取贴图尺寸）
        const targetHeight = this.getTargetHeight(sprites, screenScale);
        
        // 绘制敌人精灵（带动画效果）- 已经在(0,0)位置
        // 优先使用描边贴图（根据类型：white普通/red精英/goldBOSS）
        const outlinedSpriteName = this.getOutlinedSpriteName();
        let sprite = sprites.get(outlinedSpriteName);
        // 如果描边贴图不存在，回退到基础贴图
        if (!sprite) {
            sprite = sprites.get(this.sprite);
        }
        
        // v0.33-fix: 使用贴图实际尺寸（描边贴图也已裁剪）
        let spriteW = 64, spriteH = 64;
        if (sprite) {
            spriteW = sprite.width || 64;
            spriteH = sprite.height || 64;
        }
        
        // 计算保持比例的绘制尺寸
        const scale = targetHeight / spriteH;
        const drawW = (spriteW * scale) / 2;  // 半宽
        const drawH = (spriteH * scale) / 2;  // 半高
        
        // 用于特效的参考尺寸
        const size = drawH;
        
        if (this.hitTimer > 0 && Math.floor(Date.now() / 50) % 2) {
            ctx.globalAlpha = 0.5;
        }
        
        // 状态效果视觉
        const centerOffsetY = -drawH;
        
        if (this.slowTimer > 0) {
            ctx.strokeStyle = '#48f';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, centerOffsetY, size + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        if (this.poisonTimer > 0) {
            ctx.strokeStyle = '#4a4';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, centerOffsetY, size + 8, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        if (this.isBoss) {
            // Boss光环效果 - v0.18.4 fix: 使用中心坐标
            ctx.strokeStyle = `rgba(255, 0, 255, ${0.3 + Math.sin(Date.now() / 200) * 0.2})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, centerOffsetY, size + 10, 0, Math.PI * 2);
            ctx.stroke();
            
            // 冲撞预警效果 - v0.18.4 fix: 使用中心坐标
            if (this.chargeWarning) {
                const floor = this.bossFloor || 1;
                const bossKey = 'floor' + floor;
                const bossCfg = BOSS_TYPES[bossKey] || BOSS_TYPES.floor1;
                const warningProgress = this.chargeWarningTimer / bossCfg.skills.charge.warningTime;
                const alpha = 0.5 + warningProgress * 0.5;
                const radius = size + 15 + warningProgress * 20;
                
                // 红色闪烁警告圈
                ctx.strokeStyle = `rgba(255, 0, 0, ${alpha})`;
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(0, centerOffsetY, radius, 0, Math.PI * 2);
                ctx.stroke();
                
                // 冲撞方向指示线
                if (this.chargeDir) {
                    ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(0, centerOffsetY);
                    ctx.lineTo(this.chargeDir.x * 100, this.chargeDir.y * 100 + centerOffsetY);
                    ctx.stroke();
                }
                
                // 警告文字
                ctx.fillStyle = '#f00';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('!', 0, centerOffsetY - radius - 10);
            }
            
            // 冲撞中效果 - v0.18.4 fix: 使用中心坐标
            if (this.isCharging) {
                ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                ctx.beginPath();
                ctx.arc(0, centerOffsetY, size + 20, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        

        // v0.33: 绘制敌人精灵（带动画效果）- 已经在(0,0)位置
        // sprite 已在前面获取，现在直接绘制
        if (sprite) {

            ctx.save();

            

            // 计算动画偏移 - 只有上下移动，没有旋转
            let offsetY = 0;
            let scaleX, scaleY = 1;
            
            // 判断贴图朝向：头朝左还是朝右
            // 头朝右的贴图需要反向翻转
            const headFacingRight = ['turtle', 'dog2', 'goose', 'snail']; // 头朝右的贴图列表
            const isHeadRight = headFacingRight.includes(this.sprite);
            
            // 水平翻转：根据朝向和贴图头部方向计算
            // 头朝左的贴图：facingRight ? 不翻转(1) : 翻转(-1)
            // 头朝右的贴图：facingRight ? 翻转(-1) : 不翻转(1)
            if (isHeadRight) {
                scaleX = this.facingRight ? -1 : 1;
            } else {
                scaleX = this.facingRight ? 1 : -1;
            }

            

            const walkPhase = Math.sin(this.walkCycle);

            const walkPhase2 = Math.cos(this.walkCycle);

            

            switch (this.animType) {

                case 'hop':
                    offsetY = Math.abs(Math.sin(this.walkCycle * 0.5)) * -8;
                    break;

                case 'hopfast':
                    offsetY = Math.abs(Math.sin(this.walkCycle * 0.8)) * -6;
                    break;

                case 'scurry':
                    offsetY = walkPhase * 2;
                    break;

                case 'slide':
                    offsetY = 0;
                    break;

                case 'flutter':
                    offsetY = Math.sin(this.animTimer * 15) * 3;
                    break;

                case 'waddle':
                    offsetY = Math.abs(walkPhase) * -2;
                    break;

                case 'fly':
                    offsetY = Math.sin(this.animTimer * 3) * 4;
                    break;

                case 'prowl':
                    offsetY = walkPhase2 * 1;
                    break;

                case 'run':
                    offsetY = Math.abs(walkPhase) * -3;
                    break;

                case 'trot':
                    offsetY = walkPhase * 2;
                    break;

                case 'slither':
                    offsetY = Math.sin(this.x * 0.1 + this.animTimer * 5) * 2;
                    break;

                case 'heavy':
                    offsetY = Math.abs(walkPhase) * -4;
                    break;

                case 'sidle':
                    offsetY = 0;
                    break;

                case 'crawl':
                    offsetY = 4;
                    // v0.33: 保持贴图原始比例
                    break;

                case 'charge':
                    offsetY = Math.abs(walkPhase) * -2;
                    break;

                case 'dive':
                    offsetY = Math.sin(this.animTimer * 8) * 6;

                    break;

                default:
                    offsetY = walkPhase * 1.5;

            }

            

            // 应用变换 - 只有上下移动和水平翻转，没有旋转
            ctx.translate(0, offsetY);
            ctx.scale(scaleX, scaleY);

            

            // v0.33: 绘制精灵 - 使用保持比例的尺寸
            // drawW/drawH 是半宽/半高，乘以2得到全尺寸
            
            // ===== 黑粗描边效果（与玩家风格统一）=====
            // 在应用了同样变换（翻转+动画）的基础上绘制描边
            const outlineThickness = 3;
            const finalW = drawW * 2;
            const finalH = drawH * 2;
            
            // 保存当前变换，准备画描边
            ctx.save();
            ctx.globalAlpha = 1.0;
            
            // 用 shadow 方法绘制黑色描边
            ctx.shadowColor = 'black';
            ctx.shadowBlur = 0;
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                ctx.shadowOffsetX = Math.cos(angle) * outlineThickness;
                ctx.shadowOffsetY = Math.sin(angle) * outlineThickness;
                ctx.drawImage(sprite, -drawW, -drawH * 2, finalW, finalH);
            }
            ctx.shadowColor = 'transparent';
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            ctx.restore();
            
            // 绘制怪物本体
            ctx.drawImage(sprite, -drawW, -drawH * 2, finalW, finalH);

            

            ctx.restore();

        } else {

            // 使用emoji作为后备

            const emojiMap = {

                chick: '🐤', pig: '🐷', sheep: '🐑', dog: '🐕', cat: '🐱',

                bear: '🐻', rabbit: '🐰', bird: '🐦', turtle: '🐢', dog2: '🐺',

                snail: '🐌', squirrel: '🐿️', goose: '🪿',

                duck: '🦆', duck2: '🦆', duck3: '🐥', snake: '🐍',

                crab: '🦀', pigeon: '🕊️', pig2: '🐖', rabbit2: '🐇'

            };

            ctx.fillStyle = '#fff';  // 重置为白色，避免继承黑色背景

            ctx.font = this.isBoss ? '48px Arial' : '24px Arial';

            ctx.textAlign = 'center';

            ctx.fillText(emojiMap[this.sprite] || '👾', 0, 8);

        }

        

        ctx.globalAlpha = 1;

        

        // 血条 - 始终显示，优化视觉效果
        const barWidth = this.isBoss ? 100 : 32;
        const barHeight = this.isBoss ? 8 : 5;
        // 血条在精灵顶部之上：精灵高度是 drawH*2，再向上偏移
        const barY = -drawH * 2 - (this.isBoss ? 12 : 8);
        const hpPercent = Math.max(0, this.hp / this.maxHp);
        
        // 血条背景（带边框）
        ctx.fillStyle = '#000';
        ctx.fillRect(-barWidth/2 - 1, barY - 1, barWidth + 2, barHeight + 2);
        
        // v0.9.5 - 血条颜色使用配置的color
        ctx.fillStyle = this.color || '#f44';
        ctx.fillRect(-barWidth/2, barY, barWidth * hpPercent, barHeight);
        
        // 血条空槽
        ctx.fillStyle = '#222';
        ctx.fillRect(-barWidth/2 + barWidth * hpPercent, barY, barWidth * (1 - hpPercent), barHeight);
        
        // v0.9.5 - T3/T4显示血量数字
        if (this.tier >= 3) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'center';
            const hpText = `${Math.floor(this.hp)}/${this.maxHp}`;
            ctx.fillText(hpText, 0, barY - 5);
        }
        
        if (this.isBoss) {

            ctx.fillStyle = '#f0f';

            ctx.font = 'bold 16px Arial';

            ctx.textAlign = 'center';

            ctx.fillText(this.name, 0, -size - 35);

        }

    }

}



// 盲眼NPC类

