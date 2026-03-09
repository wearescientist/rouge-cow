/**
 * BossSystem - Boss战系统
 * 6层独立Boss，完整AI，弱点机制
 */

class BossSystem {
    constructor(world) {
        this.world = world;
        this.priority = 36;
        this.enabled = true;
        
        // Boss数据库
        this.bossDatabase = new Map();
        
        // 活跃Boss
        this.activeBosses = new Map();
        
        this.initBossDatabase();
    }
    
    init() {
        // 监听房间进入
        this.world.on('roomEntered', (roomId, prevRoomId, room) => {
            if (room && room.type === 'boss') {
                this.spawnBossForRoom(room);
            }
        });
        
        // 监听敌人死亡
        this.world.on('entityDestroyed', (entity) => {
            if (entity.hasTag('boss')) {
                this.onBossKilled(entity);
            }
        });
    }
    
    /**
     * 初始化Boss数据库 - v0.12.0原版6Boss
     */
    initBossDatabase() {
        // 第1层：跳跳（兔子）- 牛牛的好友
        this.bossDatabase.set('floor1', {
            id: 'floor1',
            name: '跳跳',
            floor: 1,
            health: 400,
            damage: 3,
            speed: 200,
            size: 48,
            color: '#aa44ff',
            desc: '被寄生的草原袋鼠，牛牛的好友',
            phases: [
                { threshold: 1.0, name: '正常', skillCdMult: 1.0 },
                { threshold: 0.6, name: '狂暴', skillCdMult: 0.8, speedMult: 1.3, dmgMult: 1.3 },
                { threshold: 0.25, name: '绝望', skillCdMult: 0.6, speedMult: 1.5, dmgMult: 1.5 }
            ],
            skills: {
                charge: { cd: 4, warningTime: 1.5, speed: 300, dmg: 3 },
                bullet_hell: { cd: 5, bulletCount: 12, speed: 180, dmg: 2 },
                summon: { cd: 10, count: 3, types: ['chick', 'mouse'] }
            },
            loot: ['jump_boots', 'speed_gem']
        });
        
        // 第2层：铁爪（金雕）
        this.bossDatabase.set('floor2', {
            id: 'floor2',
            name: '铁爪',
            floor: 2,
            health: 450,
            damage: 4,
            speed: 180,
            size: 56,
            color: '#4488ff',
            desc: '被寄生的金雕，翅膀长满菌丝羽毛',
            phases: [
                { threshold: 1.0, name: '正常', skillCdMult: 1.0 },
                { threshold: 0.65, name: '狂暴', skillCdMult: 0.75, speedMult: 1.25, dmgMult: 1.4 },
                { threshold: 0.3, name: '绝望', skillCdMult: 0.55, speedMult: 1.4, dmgMult: 1.5 }
            ],
            skills: {
                charge: { cd: 3.5, warningTime: 1.2, speed: 350, dmg: 4 },
                bullet_hell: { cd: 4, bulletCount: 14, speed: 220, dmg: 2 },
                summon: { cd: 9, count: 2, types: ['pigeon', 'bat'] }
            },
            loot: ['feather_blade', 'wind_core']
        });
        
        // 第3层：泥背（老象龟）
        this.bossDatabase.set('floor3', {
            id: 'floor3',
            name: '泥背',
            floor: 3,
            health: 600,
            damage: 5,
            speed: 50,
            size: 72,
            color: '#44aa44',
            armor: 3,
            desc: '背甲变成移动孵化场的老象龟',
            phases: [
                { threshold: 1.0, name: '正常', skillCdMult: 1.0 },
                { threshold: 0.7, name: '狂暴', skillCdMult: 0.8, speedMult: 1.2, dmgMult: 1.3 },
                { threshold: 0.35, name: '绝望', skillCdMult: 0.6, speedMult: 1.3, dmgMult: 1.5 }
            ],
            skills: {
                charge: { cd: 6, warningTime: 2, speed: 200, dmg: 5 },
                bullet_hell: { cd: 5, bulletCount: 16, speed: 150, dmg: 3 },
                summon: { cd: 8, count: 4, types: ['snail', 'crab'] }
            },
            loot: ['turtle_shell', 'armor_plate']
        });
        
        // 第4层：银牙（狼群首领）
        this.bossDatabase.set('floor4', {
            id: 'floor4',
            name: '银牙',
            floor: 4,
            health: 500,
            damage: 4,
            speed: 220,
            size: 52,
            color: '#aa44ff',
            desc: '狼群首领，脊柱外露连接神经索',
            phases: [
                { threshold: 1.0, name: '正常', skillCdMult: 1.0 },
                { threshold: 0.6, name: '狂暴', skillCdMult: 0.75, speedMult: 1.4, dmgMult: 1.4 },
                { threshold: 0.25, name: '绝望', skillCdMult: 0.55, speedMult: 1.6, dmgMult: 1.6 }
            ],
            skills: {
                charge: { cd: 3, warningTime: 1, speed: 380, dmg: 4 },
                bullet_hell: { cd: 4, bulletCount: 18, speed: 200, dmg: 2 },
                summon: { cd: 7, count: 3, types: ['dog', 'wolf'] }
            },
            loot: ['wolf_fang', 'berserk_ring']
        });
        
        // 第5层：铁角（牛牛父亲）
        this.bossDatabase.set('floor5', {
            id: 'floor5',
            name: '铁角',
            floor: 5,
            health: 700,
            damage: 6,
            speed: 100,
            size: 64,
            color: '#ffaa00',
            desc: '牛牛的父亲，已被部分寄生，仍保留着最后一丝理智',
            phases: [
                { threshold: 1.0, name: '正常', skillCdMult: 1.0 },
                { threshold: 0.65, name: '狂暴', skillCdMult: 0.75, speedMult: 1.2, dmgMult: 1.4 },
                { threshold: 0.3, name: '绝望', skillCdMult: 0.55, speedMult: 1.4, dmgMult: 1.6 }
            ],
            skills: {
                charge: { cd: 4, warningTime: 1.5, speed: 280, dmg: 6 },
                bullet_hell: { cd: 4, bulletCount: 20, speed: 180, dmg: 3 },
                summon: { cd: 8, count: 3, types: ['bear', 'wolf'] }
            },
            loot: ['brother_horn', 'family_locket']
        });
        
        // 第6层：深渊母体（最终Boss，静止不动）
        this.bossDatabase.set('floor6', {
            id: 'floor6',
            name: '深渊母体',
            floor: 6,
            health: 800,
            damage: 8,
            speed: 0,  // 不移动
            size: 120,
            color: '#880000',
            isFinal: true,
            isStatic: true,
            desc: '山丘大小的肉质团，母虫的真身',
            phases: [
                { threshold: 1.0, name: '觉醒', skillCdMult: 1.0 },
                { threshold: 0.8, name: '腐蚀', skillCdMult: 0.85, dmgMult: 1.2 },
                { threshold: 0.6, name: '召唤', skillCdMult: 0.7, dmgMult: 1.4 },
                { threshold: 0.4, name: '黑暗', skillCdMult: 0.6, dmgMult: 1.6 },
                { threshold: 0.2, name: '绝望', skillCdMult: 0.5, dmgMult: 2.0 }
            ],
            skills: {
                bullet_hell: { cd: 3, bulletCount: 24, speed: 250, dmg: 3 },
                summon: { cd: 6, count: 4, types: ['chick', 'mouse', 'rabbit', 'bat'] },
                shockwave: { cd: 4, range: 400, dmg: 4 }
            },
            loot: ['heart_of_abyss', 'true_ending_key']
        });
    }
    
    /**
     * 为房间生成Boss
     */
    spawnBossForRoom(room) {
        const roomSystem = this.world.getSystem(RoomSystem);
        if (!roomSystem) return;
        
        const floor = roomSystem.getCurrentFloor();
        
        // 查找对应楼层的Boss
        let bossData = null;
        for (const [key, data] of this.bossDatabase) {
            if (data.floor === floor) {
                bossData = { key, ...data };
                break;
            }
        }
        
        if (!bossData) {
            // 默认使用第1层Boss
            bossData = { key: 'queen_mycelium', ...this.bossDatabase.get('queen_mycelium') };
        }
        
        // 创建Boss实体
        const cellSize = roomSystem.currentMap?.config?.cellSize || 32;
        const centerX = room.x + (room.width * cellSize) / 2;
        const centerY = room.y + (room.height * cellSize) / 2;
        
        const boss = this.createBossEntity(centerX, centerY, bossData);
        
        // 记录活跃Boss
        this.activeBosses.set(room.id, {
            entity: boss,
            data: bossData,
            currentPhase: 0,
            phaseTimer: 0,
            attackTimer: 0,
            behaviorTimer: 0
        });
        
        // Boss预警
        this.world.emit('bossSpawned', { boss, data: bossData });
        this.world.emit('playSound', 'boss_warning');
        
        // 锁定房间门
        this.world.emit('lockRoom', room.id);
    }
    
    /**
     * 创建Boss实体
     */
    createBossEntity(x, y, bossData) {
        const boss = this.world.createEntity()
            .add(new TransformComponent(x, y))
            .add(new SpriteComponent({
                width: bossData.size,
                height: bossData.size
            }))
            .add(new MovementComponent({
                speed: bossData.speed,
                maxSpeed: bossData.speed
            }))
            .add(new HealthComponent({
                maxHealth: bossData.health,
                currentHealth: bossData.health,
                armor: 10
            }))
            .add(new CombatComponent({
                attackDamage: bossData.damage,
                attackCooldown: 2.0
            }))
            .add(new ColliderComponent({
                radius: bossData.size / 2,
                layer: 'enemy'
            }))
            .add(new EnemyComponent({
                enemyType: bossData.id,
                isBoss: true,
                expValue: 500 * bossData.floor,
                dropChance: 1.0,
                dropTable: bossData.loot || []
            }));
        
        // Boss特有属性
        boss.bossData = bossData;
        boss.currentPhase = 0;
        boss.phaseTransitionTime = 0;
        boss.isInvulnerable = false;
        boss.weakPointExposed = false;
        boss.attackPattern = bossData.phases[0].attackPattern;
        
        boss.addTag('enemy');
        boss.addTag('boss');
        boss.addTag('elite');
        
        return boss;
    }
    
    /**
     * Boss被击杀
     */
    onBossKilled(boss) {
        const bossData = boss.bossData;
        if (!bossData) return;
        
        // 解锁房间
        this.world.emit('unlockCurrentRoom');
        
        // 掉落专属道具
        if (bossData.loot) {
            bossData.loot.forEach(itemId => {
                const transform = boss.get(TransformComponent);
                if (transform) {
                    this.world.createItem(
                        transform.x + (Math.random() - 0.5) * 100,
                        transform.y + (Math.random() - 0.5) * 100,
                        itemId
                    );
                }
            });
        }
        
        // 最终Boss通关
        if (bossData.isFinal) {
            this.world.emit('gameCompleted');
        }
        
        // 清除活跃记录
        for (const [roomId, data] of this.activeBosses) {
            if (data.entity === boss) {
                this.activeBosses.delete(roomId);
                break;
            }
        }
        
        // 通关奖励
        this.world.emit('bossKilled', {
            boss: bossData,
            floor: bossData.floor
        });
    }
    
    /**
     * 更新所有Boss
     */
    update(dt) {
        for (const [roomId, bossInfo] of this.activeBosses) {
            if (!bossInfo.entity.active) {
                this.activeBosses.delete(roomId);
                continue;
            }
            
            this.updateBossAI(bossInfo, dt);
        }
    }
    
    /**
     * Boss AI更新
     */
    updateBossAI(bossInfo, dt) {
        const boss = bossInfo.entity;
        const bossData = bossInfo.data;
        const health = boss.get(HealthComponent);
        
        if (!health) return;
        
        // 检查阶段转换
        const healthPercent = health.currentHealth / health.maxHealth;
        const phases = bossData.phases;
        
        for (let i = phases.length - 1; i >= 0; i--) {
            if (healthPercent <= phases[i].threshold && bossInfo.currentPhase < i) {
                this.transitionPhase(bossInfo, i);
                break;
            }
        }
        
        // 更新计时器
        bossInfo.phaseTimer += dt;
        bossInfo.attackTimer += dt;
        bossInfo.behaviorTimer += dt;
        
        // 执行当前阶段行为
        const currentPhase = phases[bossInfo.currentPhase];
        
        // 弱点机制：每10秒暴露弱点3秒
        const cycleTime = bossInfo.phaseTimer % 13;
        boss.weakPointExposed = cycleTime > 10;
        boss.isInvulnerable = !boss.weakPointExposed && currentPhase.threshold < 0.5;
        
        // 攻击模式
        if (bossInfo.attackTimer > 3) {
            bossInfo.attackTimer = 0;
            this.executeAttackPattern(boss, currentPhase.attackPattern);
        }
        
        // 行为切换
        if (bossInfo.behaviorTimer > 5) {
            bossInfo.behaviorTimer = 0;
            this.switchBehavior(boss, currentPhase.behaviors);
        }
    }
    
    /**
     * 阶段转换
     */
    transitionPhase(bossInfo, newPhase) {
        bossInfo.currentPhase = newPhase;
        bossInfo.phaseTimer = 0;
        
        const phase = bossInfo.data.phases[newPhase];
        
        console.log(`Boss ${bossInfo.data.name} 进入阶段: ${phase.name}`);
        
        // 阶段转换特效
        const transform = bossInfo.entity.get(TransformComponent);
        if (transform) {
            const particleSystem = this.world.getSystem(ParticleSystem);
            if (particleSystem) {
                particleSystem.createExplosion(transform.x, transform.y, 50, bossInfo.data.color);
            }
        }
        
        // 播放音效
        this.world.emit('playSound', 'boss_phase_change');
        
        // 屏幕震动
        this.world.emit('screenShake', { intensity: 10, duration: 1 });
        
        // 短暂无敌
        bossInfo.entity.isInvulnerable = true;
        setTimeout(() => {
            if (bossInfo.entity.active) {
                bossInfo.entity.isInvulnerable = false;
            }
        }, 2000);
    }
    
    /**
     * 执行攻击模式
     */
    executeAttackPattern(boss, pattern) {
        const transform = boss.get(TransformComponent);
        if (!transform) return;
        
        switch (pattern) {
            case 'summon_spores':
                this.summonMinions(boss, 'spore', 3);
                break;
            case 'mycelium_grasp':
                this.createRootAttack(boss);
                break;
            case 'spore_explosion':
                this.createNovaAttack(boss, 200);
                break;
            case 'charge_rush':
                this.chargeAtPlayer(boss);
                break;
            case 'acid_deluge':
                this.createAcidRain(boss);
                break;
            case 'psychic_blast':
                this.createPsychicWave(boss);
                break;
            case 'flamethrower':
                this.createFlamethrower(boss);
                break;
            case 'devour_attack':
                this.createDevour(boss);
                break;
            case 'swarm_attack':
                this.summonMinions(boss, 'insect', 5);
                break;
            case 'apocalypse':
                this.createApocalypse(boss);
                break;
        }
    }
    
    /**
     * 切换行为
     */
    switchBehavior(boss, behaviors) {
        // 随机选择一个行为
        const behavior = behaviors[Math.floor(Math.random() * behaviors.length)];
        
        // 执行行为
        switch (behavior) {
            case 'spawn_minions':
                this.summonMinions(boss, 'minion', 2);
                break;
            case 'teleport':
                this.teleportBoss(boss);
                break;
            case 'shield':
                this.createShield(boss);
                break;
        }
    }
    
    // ===== 攻击实现 =====
    
    summonMinions(boss, type, count) {
        const transform = boss.get(TransformComponent);
        if (!transform) return;
        
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const dist = 100;
            const x = transform.x + Math.cos(angle) * dist;
            const y = transform.y + Math.sin(angle) * dist;
            
            this.world.createEnemy(x, y, type, {
                health: { maxHealth: 50 },
                enemy: { isMinion: true, master: boss }
            });
        }
    }
    
    createNovaAttack(boss, radius) {
        const transform = boss.get(TransformComponent);
        if (!transform) return;
        
        // 创建全屏AOE
        this.world.emit('explosion', {
            x: transform.x,
            y: transform.y,
            radius: radius,
            damage: 50,
            source: boss
        });
    }
    
    chargeAtPlayer(boss) {
        const bossTransform = boss.get(TransformComponent);
        const players = this.world.getEntitiesWithTag('player');
        if (!bossTransform || players.length === 0) return;
        
        const player = players[0];
        const playerTransform = player.get(TransformComponent);
        if (!playerTransform) return;
        
        const movement = boss.get(MovementComponent);
        if (!movement) return;
        
        // 计算方向
        const dx = playerTransform.x - bossTransform.x;
        const dy = playerTransform.y - bossTransform.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // 冲锋
        movement.vx = (dx / dist) * movement.speed * 3;
        movement.vy = (dy / dist) * movement.speed * 3;
    }
    
    teleportBoss(boss) {
        const transform = boss.get(TransformComponent);
        if (!transform) return;
        
        // 随机传送
        transform.x += (Math.random() - 0.5) * 300;
        transform.y += (Math.random() - 0.5) * 300;
        
        // 传送特效
        this.world.emit('teleport', { entity: boss });
    }
    
    createShield(boss) {
        // 创建护盾
        const health = boss.get(HealthComponent);
        if (health) {
            health.shield = 500;
        }
    }
    
    createRootAttack(boss) {
        // 菌丝缠绕攻击
        const transform = boss.get(TransformComponent);
        if (!transform) return;
        
        const players = this.world.getEntitiesWithTag('player');
        players.forEach(player => {
            const playerTransform = player.get(TransformComponent);
            if (!playerTransform) return;
            
            const dx = playerTransform.x - transform.x;
            const dy = playerTransform.y - transform.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < 200) {
                // 缠绕减速
                const statusEffect = this.world.getSystem(StatusEffectSystem);
                if (statusEffect) {
                    statusEffect.addEffect(player, 'slow', 3, { strength: 0.5 });
                }
            }
        });
    }
    
    createAcidRain(boss) {
        // 酸雨攻击
        const transform = boss.get(TransformComponent);
        if (!transform) return;
        
        // 在玩家位置生成酸液池
        const players = this.world.getEntitiesWithTag('player');
        players.forEach(player => {
            const playerTransform = player.get(TransformComponent);
            if (playerTransform) {
                this.world.emit('createAcidPool', {
                    x: playerTransform.x,
                    y: playerTransform.y,
                    duration: 5
                });
            }
        });
    }
    
    createPsychicWave(boss) {
        // 精神波攻击
        this.createNovaAttack(boss, 300);
    }
    
    createFlamethrower(boss) {
        // 火焰喷射
        const bossTransform = boss.get(TransformComponent);
        const players = this.world.getEntitiesWithTag('player');
        if (!bossTransform || players.length === 0) return;
        
        const player = players[0];
        const playerTransform = player.get(TransformComponent);
        if (!playerTransform) return;
        
        // 创建激光
        const dx = playerTransform.x - bossTransform.x;
        const dy = playerTransform.y - bossTransform.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        this.world.emit('laserFired', {
            source: boss,
            direction: { x: dx / dist, y: dy / dist },
            damage: 30,
            duration: 2
        });
    }
    
    createDevour(boss) {
        // 吞噬攻击（即时死效果）
        const bossTransform = boss.get(TransformComponent);
        const players = this.world.getEntitiesWithTag('player');
        if (!bossTransform || players.length === 0) return;
        
        const player = players[0];
        const playerTransform = player.get(TransformComponent);
        if (!playerTransform) return;
        
        const dx = playerTransform.x - bossTransform.x;
        const dy = playerTransform.y - bossTransform.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 100) {
            // 玩家需要快速躲避
            const health = player.get(HealthComponent);
            if (health) {
                health.currentHealth -= health.maxHealth * 0.3; // 30%最大生命值伤害
            }
        }
    }
    
    createApocalypse(boss) {
        // 最终Boss的末日攻击
        // 全屏多重攻击
        this.createNovaAttack(boss, 500);
        this.summonMinions(boss, 'corrupted', 10);
        
        // 随机落雷
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                const x = boss.get(TransformComponent)?.x || 0;
                const y = boss.get(TransformComponent)?.y || 0;
                this.world.emit('thunderStrike', {
                    x: x + (Math.random() - 0.5) * 400,
                    y: y + (Math.random() - 0.5) * 400,
                    damage: 100
                });
            }, i * 500);
        }
    }
}

window.BossSystem = BossSystem;
