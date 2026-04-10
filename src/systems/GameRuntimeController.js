(function attachGameRuntimeController(global) {
    'use strict';

    const GameRuntimeController = {
    update(dt) {

        

        const bossChestAnimating = !!(this.bossChestLottery && this.bossChestLottery.active);
        if (bossChestAnimating) {
            this.particles.update(dt);
            this.damageNumbers.update(dt);
            this.updateBossChestLottery(dt);
            if (window.shopNPCSystem && typeof window.shopNPCSystem.syncDialogueUiVisibility === 'function') {
                window.shopNPCSystem.syncDialogueUiVisibility();
            }
            return;
        }

        if (this.floorTransitionState?.active) {
            this.updateFloorTransition(dt);
            if (window.shopNPCSystem && typeof window.shopNPCSystem.syncDialogueUiVisibility === 'function') {
                window.shopNPCSystem.syncDialogueUiVisibility();
            }
            return;
        }

        if (this.bossDialogueState?.active) {
            this.updateBossDialogueSequence(dt);
            if (window.shopNPCSystem && typeof window.shopNPCSystem.syncDialogueUiVisibility === 'function') {
                window.shopNPCSystem.syncDialogueUiVisibility();
            }
            return;
        }

        if (this.shopOpen || this.levelUpOpen || this.paused) {
            if (window.shopNPCSystem && typeof window.shopNPCSystem.syncDialogueUiVisibility === 'function') {
                window.shopNPCSystem.syncDialogueUiVisibility();
            }
            return;
        }

        

        // 更新剧情事件系统（父母梦境）- 暂停梦境事件
        if (window.storyEventSystem && this.state === 'playing') {
            window.storyEventSystem.update(dt);
            // 梦境事件暂停 - 可能影响游戏体验
            // if (Math.random() < 0.001) { // 每科0.1%概率
            //     window.storyEventSystem.triggerDreamEvent();
            // }
        }
        
        // 更新商店NPC交互提示
        if (window.shopNPCSystem && this.state === 'playing' && this.curRoom && this.curRoom.type === 'shop' && this.curRoom.npc) {
            const npc = this.curRoom.npc;
            const d = dist(this.player.x, this.player.y, npc.x, npc.y);
            const prompt = document.getElementById('npcInteractPrompt');
            
            // 调试输出
            if (!prompt && d < 200) {
                // v0.17.2: 移除调试日志
                // console.log(`[NPC提示] 距离: ${d.toFixed(0)}, 应显示提示`);
            }
            
            if (d < 200 && !this.shopOpen && !window.shopNPCSystem.isTalking) { // 放大交互距离
                // 在范围内，显示提示
                if (!prompt) {
                    // v0.17.2: 移除调试日志
                    // console.log('[NPC提示] 创建提示');
                    window.shopNPCSystem.showInteractPrompt(npc.x, npc.y);
                } else {
                    // 更新位置
                    window.shopNPCSystem.updatePromptPosition();
                }
            } else {
                // 不在范围内或商店已打开，移除提示
                if (prompt) {
                    window.shopNPCSystem.removePrompt();
                }
            }
        } else {
            // 不在商店房间，移除提示
            if (window.shopNPCSystem) {
                window.shopNPCSystem.removePrompt();
            }
        }

        

        // 更新对话气泡位置（对话进行中时跟随角色移动）
        if (window.shopNPCSystem && window.shopNPCSystem.isTalking) {
            window.shopNPCSystem.updatePromptPosition();
        }

        

        // 更新房间（波次系统）

        this.curRoom.update(dt);
        this.cinematicSubtitle?.update?.(dt);
        this.floor7AwakeningSystem?.update?.(dt);

        this.updateBossAftermath(dt);
        this.updateBossCombatDialogue(dt);

        

        if (this.transition.active) {

            this.transition.timer -= dt;

            if (this.transition.timer <= 0 && !this.transition.processed) {

                // 标记已处理，防止高速模式下重复触发

                this.transition.processed = true;

                this.bullets = [];

                this.curRoom = this.transition.target;

                // 检测是否重复访问（防刷分）

                const isRevisit = this.scoreManager.checkRoomRevisit(this.curRoom.id);

                

                this.curRoom.visited = true;

                // 分数：进入新房间（只有首次访问才给分）

                if (!isRevisit) {

                    this.scoreManager.onEnterRoom();

                }

                const roomW = SURVIVOR_CONFIG.ROOM_WIDTH;
                const roomH = SURVIVOR_CONFIG.ROOM_HEIGHT;
                const wallT = SURVIVOR_CONFIG.WALL_THICKNESS;

                // 传送位置：远离门区域，往房间中心移动 150px

                const spawnOffset = 150;

                if (this.transition.dir === 'left') this.player.x = roomW - wallT - spawnOffset;

                else if (this.transition.dir === 'right') this.player.x = wallT + spawnOffset;

                else this.player.x = roomW / 2;

                

                if (this.transition.dir === 'up') this.player.y = roomH - wallT - spawnOffset;

                else if (this.transition.dir === 'down') this.player.y = wallT + spawnOffset;

                else this.player.y = roomH / 2;

                this.handleStoryRoomEntry(this.curRoom);

                

                // v0.20.0: 传送宠物到玩家身后（跟随穿过门）

                if (this.petManager && this.petManager.pets.length > 0) {

                    const behindOffset = 25; // 每个宠物在玩家身后25px

                    

                    for (let i = 0; i < this.petManager.pets.length; i++) {

                        const pet = this.petManager.pets[i];

                        // 根据进入方向计算宠物在玩家身后的位置

                        if (this.transition.dir === 'left') {

                            pet.x = this.player.x + (i + 1) * behindOffset;

                            pet.y = this.player.y;

                        } else if (this.transition.dir === 'right') {

                            pet.x = this.player.x - (i + 1) * behindOffset;

                            pet.y = this.player.y;

                        } else if (this.transition.dir === 'up') {

                            pet.x = this.player.x;

                            pet.y = this.player.y + (i + 1) * behindOffset;

                        } else if (this.transition.dir === 'down') {

                            pet.x = this.player.x;

                            pet.y = this.player.y - (i + 1) * behindOffset;

                        } else {

                            // 默认：在玩家身后排列

                            pet.x = this.player.x;

                            pet.y = this.player.y + (i + 1) * behindOffset;

                        }

                        // 清空宠物的历史位置，避免瞬移回上一个房间

                        pet.history = [];

                    }

                }

                if (Array.isArray(this.guardianKnives) && this.guardianKnives.length > 0) {
                    this.guardianKnives.forEach((knife, index) => {
                        if (!knife) return;
                        knife.slotIndex = index;
                        knife.x = this.player.cx;
                        knife.y = this.player.cy - 32;
                        knife.vx = 0;
                        knife.vy = 0;
                        knife.state = 'idle';
                        knife.target = null;
                        knife.targetRef = null;
                        knife.cycleTarget = null;
                        knife.passRemaining = 0;
                        knife.curveTimer = 0;
                        knife.trail = [];
                        knife.hitTracker = new Map();
                    });
                }

                

                this.transition.active = false;

                if (this.curRoom && this.curRoom.type === 'hidden') {
                    const hiddenMode = this.ensureHiddenRoomSetup(this.curRoom);
                    if (hiddenMode && !this.curRoom._hiddenModeAnnounced) {
                        this.curRoom._hiddenModeAnnounced = true;
                        this.damageNumbers.spawn(this.player.cx, this.player.cy - 60, hiddenMode.title, { color: hiddenMode.color, size: 18, life: 2 });
                    }
                }

                

                // 如果是首次进入房间，生成敌人（包括Boss）

                if (!this.curRoom.cleared && this.curRoom.enemies.length === 0) {

                    this.curRoom.spawnEnemies();

                    // 播放对应房间类型的BGM

                    if (this.curRoom && this.curRoom.type === 'boss') {

                        this.audio.playBGM('boss');
                        const introCinematic = typeof window.getBossIntroCinematicConfig === 'function'
                            ? window.getBossIntroCinematicConfig(this.currentFloor)
                            : null;
                        const shakeCfg = introCinematic?.shake || { amount: 12, duration: 0.28 };
                        const zoomCfg = introCinematic?.zoom || { amount: 0.05, duration: 0.34 };
                        const spotlightCfg = introCinematic?.spotlight || (typeof window.getBossIntroSpotlightConfig === 'function'
                            ? window.getBossIntroSpotlightConfig(this.currentFloor)
                            : { radius: 260, intensity: 1.65, color: '#ff6b5e', duration: 1.4, pulseSpeed: 3.2 });
                        this.camera?.addShake?.(
                            shakeCfg.profile || shakeCfg.amount || 12,
                            shakeCfg.duration || 0.28,
                            shakeCfg.profile ? shakeCfg : null
                        );
                        this.camera?.pulseZoom?.(zoomCfg.amount || 0.05, zoomCfg.duration || 0.34);
                        this.hd2dRenderer?.lighting?.addSpotlight?.(
                            this.curRoom.centerX || this.player.x,
                            this.curRoom.centerY || this.player.y,
                            spotlightCfg
                        );
                        if (introCinematic?.beat && typeof this.startCinematicBeat === 'function') {
                            this.startCinematicBeat(introCinematic.beat);
                        }
                        this.startBossCombatDialogue(this.curRoom);

                    } else if (this.curRoom && this.curRoom.type === 'hidden') {

                        this.audio.playBGM('elite');

                    } else {

                        this.audio.playBGM('normal');

                    }

                } else if (this.curRoom.cleared) {

                    // 已清理的房间恢复 normal BGM

                    this.audio.playBGM('normal');

                }

                

                // 如果房间会刷怪且未清理，关闭所有门（封锁房间直到清怪完成）

                if (!this.curRoom.cleared && this.curRoom.hordeManager) {

                    this.closeAllDoors();

                }

                

                // 自动存档（进入新房间时）

                this.captureCheckpoint(this.curRoom, { playerX: this.player.x, playerY: this.player.y, floor: this.currentFloor });
                this.saveGame();

            }

            return;

        }



        this.updateMobileControlsVisibility();

        // 合并所有属性来源：道具 + 被动 + 图腾

        const itemStats = this.items.getStats();

        const passiveStats = this.passives.getStats();

        const totemBonuses = this.totems.getAllBonuses();
        const petBonuses = (this.petManager && typeof this.petManager.getTeamBonuses === 'function')
            ? this.petManager.getTeamBonuses()
            : {};
        this.petTeamBonuses = petBonuses;
        
        // v0.25: 基因锁 - 低血量时全属性+100%
        let geneLockMult = 1;
        if (itemStats.geneLock && this.player) {
            const hpPercent = this.player.hp / this.player.maxHp;
            if (hpPercent <= 0.3) {
                geneLockMult = 2; // 血量≤30%时，属性翻倍
                // 显示触发提示（只显示一次）
                if (!this.geneLockActive) {
                    this.geneLockActive = true;
                    this.damageNumbers.spawn(this.player.cx, this.player.cy - 50, "基因锁突破!", {
                        color: '#f0f', size: 16, life: 2
                    });
                }
            } else {
                this.geneLockActive = false;
            }
        }

        

        // 计算 fireRate，防止除以零或无效值

        const cooldown = passiveStats.cooldown || 1;
        if (this.player.pickupMomentumTimer > 0) {
            this.player.pickupMomentumTimer -= dt;
        } else {
            this.player.pickupMomentumTimer = 0;
            this.player.pickupMomentumStacks = 0;
        }
        const pickupMomentumStacks = Math.max(0, this.player.pickupMomentumStacks || 0);
        const pickupMomentumMul = 1 + pickupMomentumStacks;
        const pickupSpeedMul = 1 + pickupMomentumStacks * 0.5;
        const fireRate = Math.max(0.5, (itemStats.fireRate || 1) * (1 / cooldown) * (1 + (petBonuses.fireRateMul || 0)) * pickupMomentumMul);  // 最小值0.5，防止fireRate过小导致CD过大

        

        const stats = {
            ...itemStats,

            // 基础属性（道具+被动合并）

            attackPower: Math.max(
                1,
                (this.player?.attackPowerBase || window.WEAPON_DAMAGE_MODEL?.baseAttackPower || 24)
                    + (itemStats.attackPower || 0)
                    + (passiveStats.attackPower || 0)
            ),

            projCount: (itemStats.projCount || 1) + (passiveStats.projCount || 0),

            projSize: itemStats.projSize || 1,

            range: Math.max(0, (itemStats.range || 0) + ((passiveStats.range || 1) - 1)),

            projSpeed: Math.max(0, (itemStats.projSpeed || 0) + ((passiveStats.projSpeed || 1) - 1)),

            duration: Math.max(0, (itemStats.duration || 0) + ((passiveStats.duration || 1) - 1)),

            fireRate: isFinite(fireRate) ? fireRate : 1, // 防止 Infinity

            cooldown: 1,

            pierce: itemStats.pierce || 0,

            crit: Math.min(1, (itemStats.crit || 0) + (totemBonuses.crit || 0) + (((passiveStats.luck || 0) + (petBonuses.luckAdd || 0)) * 0.5) + (petBonuses.critAdd || 0)), // 幸运转化为暴击

            critDmg: itemStats.critDmg || 1.5,

            maxHp: itemStats.maxHp || 0,

            armor: (itemStats.armor || 0) + (passiveStats.armor || 0) + (petBonuses.armorAdd || 0),

            lifeSteal: (itemStats.lifeSteal || 0) + (passiveStats.lifeSteal || 0),

            speed: ((itemStats.speed || 1) + (passiveStats.speed || 0)) * (1 + (totemBonuses.speed || 0)) * pickupSpeedMul, // 翅膀+图腾

            fly: itemStats.fly || false,

            magnet: (itemStats.magnet || 100) + (passiveStats.magnet || 0),

            goldBonus: (itemStats.goldBonus || 1) * (1 + (petBonuses.goldMul || 0)),

            // 伤害类型

            fireDmg: itemStats.fireDmg || 0,

            thunderDmg: itemStats.thunderDmg || 0,

            poisonDmg: itemStats.poisonDmg || 0,

            curseDmg: itemStats.curseDmg || 0,

            // 控制效果

            slowChance: itemStats.slowChance || 0,

            slowAmount: itemStats.slowAmount || 0,

            stunChance: itemStats.stunChance || 0,

            // 其他

            dmg: (itemStats.dmg || 1) * (passiveStats.dmg || 1) * (1 + (totemBonuses.dmg || 0)) * (1 + (petBonuses.dmgMul || 0)) * (1 + pickupMomentumStacks * 0.4), // 菠菜+图腾+宠物
            focusPower: passiveStats.focusPower || 0,
            luckyNovaChance: passiveStats.luckyNovaChance || 0,
            luckyNovaRadius: passiveStats.luckyNovaRadius || 0,
            alchemyChance: passiveStats.alchemyChance || 0,
            alchemyRadius: passiveStats.alchemyRadius || 0,
            alchemyDot: passiveStats.alchemyDot || 0,
            retributionPulse: passiveStats.retributionPulse || 0,
            retributionRadius: passiveStats.retributionRadius || 0,
            moveConduction: passiveStats.moveConduction || 0,
            moveConductionWidth: passiveStats.moveConductionWidth || 0,
            moveConductionChain: passiveStats.moveConductionChain || 0,
            lingeringFieldScale: passiveStats.lingeringFieldScale || 0,
            lingeringFieldDuration: passiveStats.lingeringFieldDuration || 0,
            lingeringTickRateMul: passiveStats.lingeringTickRateMul || 1,
            pickupMomentum: passiveStats.pickupMomentum || 0,
            pickupMomentumCap: passiveStats.pickupMomentumCap || 0,
            activeSynergies: passiveStats.activeSynergies || [],
            
            // v0.25: 基因锁乘数
            geneLockMult: geneLockMult

        };
        
        // v0.25: 基因锁 - 应用属性加成
        if (geneLockMult > 1) {
            stats.projCount = Math.floor(stats.projCount * geneLockMult);
            stats.projSize *= geneLockMult;
            stats.fireRate *= geneLockMult; // 射速也翻倍
            stats.crit = Math.min(1, stats.crit * geneLockMult);
            stats.critDmg *= geneLockMult;
            stats.speed *= geneLockMult;
            stats.dmg *= geneLockMult;
        }

        this.currentCombatStats = { ...stats };

        

        const speed = 300 * stats.speed;  // 移速翻倍
        const playerInputLocked = this.isPlayerInputLocked();
        const combatSuppressed = this.isPlayerCombatSuppressed();

        

        // 冲刺冷却更新

        if (this.player.dashCooldown > 0) this.player.dashCooldown -= dt;

        

        // 冲刺处理 - 平地刺客冲刺

        if (playerInputLocked) {
            this.player.isDashing = false;
        }
        if (this.player.isDashing) {

            this.player.dashTime -= dt;

            if (this.player.dashTime <= 0) {

                this.player.isDashing = false;

            } else {

                // 平地冲刺 - 超快速度，短时间短距离爆发

                const dashSpeed = 2000;  // 极快的速度

                let newX = this.player.x + this.player.dashDirection.x * dashSpeed * dt;

                let newY = this.player.y + this.player.dashDirection.y * dashSpeed * dt;
                
                // 冲刺也要限制在有效区域内（地板+门）
                const clamped = SURVIVOR_CONFIG.clampToValidArea(newX, newY, this.curRoom);
                const dashEnemies = this.curRoom?.getActiveEnemies ? this.curRoom.getActiveEnemies() : this.curRoom?.enemies;
                if (window.collisionSystem) {
                    const dashRestricted = window.collisionSystem.restrictPlayerMovement(
                        this.player, clamped.x, clamped.y, dashEnemies, this.curRoom?.npc
                    );
                    this.player.x = dashRestricted.x;
                    this.player.y = dashRestricted.y;
                } else {
                    this.player.x = clamped.x;
                    this.player.y = clamped.y;
                }

                

                // 添加精灵图残影 - 使用当前帧

                const currentFrame = 4; // 冲刺帧

                this.player.dashTrail.push({

                    x: this.player.x,

                    y: this.player.y,

                    spriteName: 'player_dash_0',

                    alpha: 0.7,

                    facingRight: this.player.facingRight

                });

            }

        }

        

        // 普通移动

        let dx = 0, dy = 0;
        const mVec = playerInputLocked ? { x: 0, y: 0 } : this.getMobileMoveVector();
        dx += mVec.x;
        dy += mVec.y;

        if (!playerInputLocked && (this.keys['w'] || this.keys['W'] || this.keys['ArrowUp'])) dy -= 1;

        if (!playerInputLocked && (this.keys['s'] || this.keys['S'] || this.keys['ArrowDown'])) dy += 1;

        if (!playerInputLocked && (this.keys['a'] || this.keys['A'] || this.keys['ArrowLeft'])) { dx -= 1; this.player.facingRight = false; }

        if (!playerInputLocked && (this.keys['d'] || this.keys['D'] || this.keys['ArrowRight'])) { dx += 1; this.player.facingRight = true; }
        if (mVec.x < -0.08) this.player.facingRight = false;
        if (mVec.x > 0.08) this.player.facingRight = true;

        

        // 空格冲刺触发 - 刺客式短促冲刺

        if (!playerInputLocked && this.keys[' '] && this.player.dashCooldown <= 0 && !this.player.isDashing) {

            if (dx !== 0 || dy !== 0) {

                const len = Math.sqrt(dx*dx + dy*dy);

                this.player.isDashing = true;

                this.player.dashTime = 0.12;  // 冲刺时间保持不变

                this.player.dashCooldown = 1.5;  // CD加长到1.5秒

                this.player.dashDirection = {x: dx/len, y: dy/len};

                

                // 冲刺特效

                this.camera.addShake(3);

                this.audioCtrl.play('dash');

                

                // 立即添加一个残影

                this.player.dashTrail.push({

                    x: this.player.x,

                    y: this.player.y,

                    spriteName: 'player_dash_0',

                    alpha: 0.7,

                    facingRight: this.player.facingRight

                });

            }

        }

        

        this.player.isMoving = (dx !== 0 || dy !== 0);
        if (this.player.isMoving) {
            const moveLen = Math.sqrt(dx * dx + dy * dy);
            if (moveLen > 0) {
                this.player.moveDirection = { x: dx / moveLen, y: dy / moveLen };
            }
        }

        if (this.player.isMoving && !this.player.isDashing) {
            this.player.walkCycle += dt * 15;
            
            // v0.30: 脚步音效 - 每0.3秒播放一次
            if (!this.player.lastStepTime || Date.now() - this.player.lastStepTime > 300) {
                this.player.lastStepTime = Date.now();
                // 根据楼层确定脚步材质 (1-6层)
                const floor = this.currentFloor || 1;
                const floorSteps = {
                    1: 'step_snow',      // 菌丝区
                    2: 'step_grass',     // 孵化温室
                    3: 'step_concrete',  // 神经索
                    4: 'step_concrete',  // 消化熔炉
                    5: 'step_wood',      // 母虫庭院
                    6: 'step_carpet'     // 千根之心
                };
                const stepSound = floorSteps[floor] || 'step_concrete';
                this.audioCtrl.play(stepSound);
            }

        } else {

            this.player.walkCycle = 0;

        }

        

        // 更新残影

        for (let i = this.player.dashTrail.length - 1; i >= 0; i--) {

            this.player.dashTrail[i].alpha -= 0.08;  // 快速淡出

            if (this.player.dashTrail[i].alpha <= 0) {

                this.player.dashTrail.splice(i, 1);

            }

        }

        

        // 限制残影数量

        if (this.player.dashTrail.length > 10) {

            this.player.dashTrail.splice(0, this.player.dashTrail.length - 10);

        }

        

        // v0.16.0 fix: 提前获取活跃敌人，避免块级作用域问题
        const activeEnemies = this.curRoom.getActiveEnemies ? this.curRoom.getActiveEnemies() : this.curRoom.enemies;
        
        if ((dx !== 0 || dy !== 0) && !this.player.isDashing) {
            const len = Math.sqrt(dx*dx + dy*dy);
            let newX = this.player.x + (dx / len) * speed * dt;
            let newY = this.player.y + (dy / len) * speed * dt;
            
            // v0.14.1 - 碰撞限制：检查与敌人和NPC的碰撞
            if (window.collisionSystem) {
                const restricted = window.collisionSystem.restrictPlayerMovement(
                    this.player, newX, newY, activeEnemies, this.curRoom.npc
                );
                newX = restricted.x;
                newY = restricted.y;
            }
            
            // v0.15.0：先进行碰撞限制，再进行边界限制
            const clamped = SURVIVOR_CONFIG.clampToValidArea(newX, newY, this.curRoom);
            // 二次碰撞检测（边界限制后的位置）
            if (window.collisionSystem) {
                const finalCheck = window.collisionSystem.restrictPlayerMovement(
                    this.player, clamped.x, clamped.y, 
                    activeEnemies, this.curRoom.npc
                );
                this.player.x = finalCheck.x;
                this.player.y = finalCheck.y;
            } else {
                this.player.x = clamped.x;
                this.player.y = clamped.y;
            }
        }

        

        // 玩家边界限制 - 确保不会走出有效区域

        const validPos = SURVIVOR_CONFIG.clampToValidArea(this.player.x, this.player.y, this.curRoom);

        this.player.x = validPos.x;

        this.player.y = validPos.y;
        
        // v0.20.0: 记录玩家位置历史（供宠物链式跟随）
        if (!this.player.history) this.player.history = [];
        this.player.history.unshift({ x: this.player.x, y: this.player.y });
        if (this.player.history.length > (this.player.maxHistory || 30)) {
            this.player.history.pop();
        }
        
        // v0.9.5 - 玩家状态更新（hitTimer递减）
        if (this.player.hitTimer > 0) {
            this.player.hitTimer -= dt;
        }
        
        // 门传送检测 - 与 Room.draw 中的门位置保持一致（门和墙平齐）

        if (this.curRoom.cleared && !window.shopNPCSystem?.isTalking) {

            const roomW = SURVIVOR_CONFIG.ROOM_WIDTH;

            const roomH = SURVIVOR_CONFIG.ROOM_HEIGHT;

            const wallT = SURVIVOR_CONFIG.WALL_THICKNESS;
            const centerX = roomW / 2;
            const centerY = roomH / 2;
            
            for (const [dir, door] of Object.entries(this.curRoom.doors)) {
                if (!door || !door.open) continue;
                
                // 门位置与 Room.draw 中一致（统一100x100门洞）
                const pos = { 
                    up: [centerX - 100, 0, 200, wallT],
                    down: [centerX - 100, roomH - wallT, 200, wallT],
                    left: [0, centerY - 100, wallT, 200],
                    right: [roomW - wallT, centerY - 100, wallT, 200]
                }[dir];

                if (this.player.x > pos[0] && this.player.x < pos[0] + pos[2] &&

                    this.player.y > pos[1] && this.player.y < pos[1] + pos[3]) {

                    this.transition = { active: true, timer: 0.3, dir, target: door.target, processed: false };

                    break;

                }

            }

        }

        

        // 更新敌人（使用上面已获取的活跃敌人）
        this._enemyAiTick = (this._enemyAiTick || 0) + 1;
        let aiSkipped = 0;
        let aiUpdated = 0;
        const aiThrottleEnabled = this.runtimeSettings?.enableEnemyAiThrottling !== false;
        const throttleDistance = 560;
        const throttleStride = 3;
        for (const e of activeEnemies) {
            if (e.hp <= 0) continue;
            const enemyCx = Number.isFinite(e.cx) ? e.cx : e.x;
            const enemyCy = Number.isFinite(e.cy) ? e.cy : e.y;
            const playerCx = Number.isFinite(this.player?.cx) ? this.player.cx : this.player?.x;
            const playerCy = Number.isFinite(this.player?.cy) ? this.player.cy : this.player?.y;
            const enemyDist = dist(enemyCx, enemyCy, playerCx, playerCy);
            const shouldThrottle = aiThrottleEnabled && enemyDist > throttleDistance;
            const enemyPhase = Number.isFinite(Number(e.id))
                ? Number(e.id)
                : Math.floor((Number(e.x) || 0) * 0.1 + (Number(e.y) || 0) * 0.07);
            const shouldUpdateThisFrame = !shouldThrottle || ((this._enemyAiTick + enemyPhase) % throttleStride === 0);

            if (shouldUpdateThisFrame) {
                e.update(dt, this.player, this.curRoom);
                aiUpdated += 1;
            } else {
                if (Number.isFinite(e.attackCd) && e.attackCd > 0) {
                    e.attackCd = Math.max(0, e.attackCd - dt);
                }
                aiSkipped += 1;
            }
            
            // v0.14.0 - 使用碰撞系统的伤害判定 - v0.16.3: 使用中心点
            const inHitRange = window.collisionSystem 
                ? window.collisionSystem.isPlayerInHitRange(this.player, e)
                : dist(e.cx, e.cy, this.player.cx, this.player.cy) < 35;

            if (inHitRange && e.attackCd <= 0) {

                if (!this.godMode && !this.player.isDashing) {
                    // 统一使用 player.takeDamage 方法
                    const hpBefore = this.player.hp;
                    const incomingDmg = Number(e.dmg) || 0;
                    const isDead = this.player.takeDamage(incomingDmg, stats);
                    const tookDamage = this.player.hp < hpBefore;
                    
                    // v0.18.4 fix: 处理thorn效果（反弹伤害）
                    if (stats.thorn && stats.thorn > 0 && e.hp > 0) {
                        const thornDmg = Math.floor(e.dmg * stats.thorn);
                        if (thornDmg > 0) {
                            e.takeDamage(thornDmg);
                            // 显示反弹伤害数字
                            this.damageNumbers.spawn(e.cx, e.cy - 20, thornDmg, {
                                color: '#8aff8a', size: 14, life: 0.8
                            });
                        }
                    }
                    
                    if (tookDamage) {
                        // 分数：真实受伤才扣分
                        this.scoreManager.onDamage();
                        this.audioCtrl.play('hurt');
                        const hitShake = Math.min(12, 3.5 + incomingDmg * 1.8);
                        const hitPulse = Math.min(0.055, 0.014 + incomingDmg * 0.004);
                        this.camera?.addShake?.(hitShake, 0.2);
                        this.camera?.pulseZoom?.(hitPulse);
                        if (stats.retributionPulse) {
                            const pulseDmg = Math.max(8, Math.floor((e.dmg || 10) * (0.7 + stats.retributionPulse)));
                            this.explosionDamage(this.player.cx, this.player.cy, stats.retributionRadius || 120, pulseDmg, {
                                crit: 0,
                                critDmg: 1.5,
                                knockback: 20
                            }, {});
                            const pulseHeal = Math.max(1, Math.floor(stats.retributionPulse * 4));
                            this.player.hp = Math.min(this.player.maxHp, this.player.hp + pulseHeal);
                        }
                    }

                    // HP 检查（死亡判定）
                    if (isDead || this.player.hp <= 0) {
                        // 尝试复活（优先检查薛定谔的猫，然后是九命猫）
                        if (this.tryRevive()) {
                            // 复活成功，不进入gameover
                        } else {
                            this.player.hp = 0; // 确保不为负数
                            this.state = 'gameover';
                            this.audioCtrl.play('gameover');
                        }
                    }
                }

                e.attackCd = 0.5;

            }

        }
        this.perfMonitor?.setMetric?.('ai.skip', aiSkipped);
        this.perfMonitor?.setMetric?.('ai.update', aiUpdated);

        

        // 检查房间是否清理完成（使用活跃敌人而非原始数组）

        const aliveEnemies = activeEnemies.filter(e => e.hp > 0);

        if (aliveEnemies.length === 0 && !this.curRoom.cleared) {

            this.curRoom.cleared = true;

            this.openAllDoors(); // 打开门

            this.particles.burst(this.player.cx, this.player.cy, '#4f4', 30);  // v0.16.3: 使用中心点
            this.camera?.addShake?.(8);
            this.camera?.pulseZoom?.(0.036);

            

            // v0.20.0: 房间清理完成，切换回正常BGM

            if (this.audio && (this.curRoom.type === 'boss' || this.curRoom.type === 'hidden')) {

                this.audio.playBGM('normal');

            }

            

            // 房间清理完成，自动拾取所有经验球

            this.autoCollectAllGems();

            if (this.curRoom.type === 'hidden' && this.curRoom.hiddenMode && this.curRoom.hiddenMode.challenge && !this.curRoom.hiddenRewardGranted) {
                this.curRoom.hiddenRewardGranted = true;
                this.spawnHiddenTrialReward(this.curRoom);
                this.damageNumbers.spawn(this.player.cx, this.player.cy - 70, '试炼完成', { color: '#ffd24d', size: 20, life: 2 });
            }

            

            if (this.curRoom.type === 'boss') {
                this.startBossAftermath(this.curRoom, this._bossDeathInfo?.enemy || null);
                if (this.curRoom?.floor === 7) {
                    this.floor7AwakeningSystem?.onBossDefeated?.(this.curRoom, this._bossDeathInfo?.enemy || null);
                }
                return;
            }

            

            // v0.9.5 - 房间清理血包掉落 (5%概率)
            if (Math.random() < 0.05) {
                this.spawnHeartAt(this.curRoom.centerX + randInt(-50, 50), this.curRoom.centerY + randInt(-50, 50));
            }
            
            this.spawnRoomReward();
        }
        
        // 寻找最近目标（从活跃敌人中）

        let target = null, minD = 9999;

        for (const e of activeEnemies) {

            if (e.hp <= 0) continue;

            const d = dist(e.cx, e.cy, this.player.cx, this.player.cy);  // v0.16.3: 使用中心点

            if (d < minD) { minD = d; target = e; }

        }

        

        // 调试：检查敌人和武器状态

        

            // 幸存者模式：所有武器独立更新和开火（重启保护期间禁止开火）
        const weaponThrottleEnabled = this.runtimeSettings?.enableWeaponCadenceThrottling !== false;
        const passiveWeaponInterval = 1 / 30; // 仅对常驻类武器降频，避免影响投射类手感
        let weaponSkipped = 0;
        let weaponUpdated = 0;
        for (const w of this.weapons) {
            const weaponType = w.cfg.type;
            const subtype = w.cfg.subtype || '';
            w.update(dt);
            const shouldThrottleCadence = weaponThrottleEnabled
                && (weaponType === 'orbit' || weaponType === 'aura' || weaponType === 'area' || w.baseKey === 'radiance' || w.baseKey === 'holy_water');
            if (shouldThrottleCadence) {
                w._cadenceAccum = (w._cadenceAccum || 0) + dt;
                if (w._cadenceAccum < passiveWeaponInterval) {
                    weaponSkipped++;
                    continue;
                }
                w._cadenceAccum = Math.min(passiveWeaponInterval, w._cadenceAccum - passiveWeaponInterval);
            }
            weaponUpdated++;

            // v0.22: 武器攻击逻辑
            // proj(投射物)和instant(闪电类)需要目标才能攻击
            // melee(近战)现在也改为需要目标才能攻击
            // aura(光环)/area(区域)/orbit(环绕)可以无目标攻击
            const exemptFromRangeGate = w.baseKey === 'radiance' || w.baseKey === 'holy_water' || weaponType === 'orbit';
            const attackRange = Math.max(0, (w.cfg.searchRadius || w.getRange?.() || w.cfg.range || 0) * (1 + (stats.range || 0)));
            let rangeTarget = exemptFromRangeGate ? target : null;
            if (!exemptFromRangeGate && attackRange > 0) {
                let nearest = null;
                let nearestDist = attackRange;
                for (const e of activeEnemies) {
                    if (!e || e.hp <= 0) continue;
                    const d = dist(e.cx, e.cy, this.player.cx, this.player.cy);
                    if (d <= nearestDist) {
                        nearestDist = d;
                        nearest = e;
                    }
                }
                rangeTarget = nearest;
            }
            
            // 需要目标的武器类型：投射物、闪电、近战、激光
            const needsTarget = weaponType === 'proj' || 
                               (weaponType === 'instant' && subtype === 'chain') || // 闪电
                               weaponType === 'melee' || // 近战
                               weaponType === 'laser'; // v0.30: 激光需要有敌人
            
            // 除辉耀和圣水外，所有武器都要求“射程内有敌人”才开火。
            const hasEnemyInRange = exemptFromRangeGate ? true : !!rangeTarget;
            const canAttack = !combatSuppressed && !this.isRestarting && w.canFire() && hasEnemyInRange && (rangeTarget || !needsTarget);
            
            if (canAttack) {
                // 对于不需要目标的武器，如果没有目标则传入null
                const fireTarget = needsTarget ? rangeTarget : (rangeTarget || null);
                this.bullets.push(...w.fire(this.player, fireTarget, stats));
                
                // 根据武器类型播放对应音效
                if (!(w.baseKey === 'knife' && w.cfg?.subtype === 'guardian_knife')) {
                    this.audioCtrl.play(w.baseKey);
                }

            }

        }
        this.perfMonitor?.setMetric?.('weapon.skip', weaponSkipped);
        this.perfMonitor?.setMetric?.('weapon.update', weaponUpdated);
        this.perfMonitor?.setMetric?.('pool.particlesActive', this.particles?.active?.length || 0);
        this.perfMonitor?.setMetric?.('pool.particlesCap', this.particles?.maxActive || this.particles?.pool?.length || 0);
        this.perfMonitor?.setMetric?.('pool.damageActive', this.damageNumbers?.active?.length || 0);
        this.perfMonitor?.setMetric?.('pool.damageCap', this.damageNumbers?.pool?.length || 0);
        const audioPerf = this.audioCtrl?.getPerfSnapshot?.();
        if (audioPerf) {
            this.perfMonitor?.setMetric?.('audio.playTotal', audioPerf.audioPlayTotal || 0);
            this.perfMonitor?.setMetric?.('audio.cacheHit', audioPerf.audioCacheHit || 0);
            this.perfMonitor?.setMetric?.('audio.cacheMiss', audioPerf.audioCacheMiss || 0);
            this.perfMonitor?.setMetric?.('audio.preloadHitRate', audioPerf.audioPreloadHitRate || 0);
            this.perfMonitor?.setMetric?.('audio.preloadLoaded', audioPerf.audioPreloadLoaded || 0);
            this.perfMonitor?.setMetric?.('audio.preloadRequested', audioPerf.audioPreloadRequested || 0);
        }

        

        // v0.22: 更新宠物
        if (this.petManager && this.player) {
            const enemies = this.curRoom ? this.curRoom.getActiveEnemies() : [];
            this.petManager.update(dt, this.player, enemies);
        }

        

        // 调试：每秒输出完整攻击状态
        this._fullDbgTimer = (this._fullDbgTimer || 0) + dt;
        
        if (this._fullDbgTimer >= 1) {
            this._fullDbgTimer = 0;
            
            // v0.16.1 debug: 输出武器CD状态
            if (this.weapons && this.weapons.length > 0) {
                const weaponStatus = this.weapons.map((w, i) => {
                    const cdStatus = w.isSuper ? 'SUPER' : `${w.cd.toFixed(2)}/${w.cfg.cd.toFixed(2)}`;
                    return `#${i}:${w.cfg.name}(${w.level})[${cdStatus}]`;
                }).join(' | ');
                // v0.17.2: 移除调试日志
                // console.log(`[武器CD] ${weaponStatus}`);
            }

            const w = this.weapons[0];

            // 详细的敌人状态

            const roomInfo = this.curRoom ? {

                type: this.curRoom.type,

                enemiesLen: this.curRoom.enemies.length,

                hasHorde: !!this.curRoom.hordeManager,

                cleared: this.curRoom.cleared

            } : null;

        }

        

        // 子弹边界检查（大房间）

        const roomW = SURVIVOR_CONFIG.ROOM_WIDTH;

        const roomH = SURVIVOR_CONFIG.ROOM_HEIGHT;

        // v0.15.0 - 新武器系统子弹更新
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            
            // 处理延迟发射
            if (b.delay && b.delay > 0) {
                b.delay -= dt;
                continue;
            }
            
            // 处理不同类型的子弹更新
            if (b.type === 'melee') {
                // 近战攻击短暂存在
                b.life -= dt;
                this.updateMeleeBullet(b, activeEnemies, stats, i);
                if (b.life <= 0) this.bullets.splice(i, 1);
                continue;
            }
            
            if (b.type === 'instant') {
                // 即时攻击（闪电）立即结算
                this.updateInstantBullet(b, activeEnemies, stats, i);
                this.bullets.splice(i, 1);
                continue;
            }
            
            if (b.type === 'area') {
                // 区域持续伤害
                this.updateAreaBullet(b, activeEnemies, dt, i);
                if (b.life <= 0) this.bullets.splice(i, 1);
                continue;
            }
            
            if (b.type === 'aura') {
                // 光环跟随玩家 - v0.17.1 fix: 使用中心点
                b.x = this.player.cx;
                b.y = this.player.cy;
                this.updateAuraBullet(b, activeEnemies, dt, i);
                if (b.life <= 0) this.bullets.splice(i, 1);
                continue;
            }
            
            // v0.30: 激光子弹更新
            if (b.type === 'laser_beam' || b.isLaser) {
                this.updateLaserBullet(b, activeEnemies, dt, i);
                if (b.life <= 0) this.bullets.splice(i, 1);
                continue;
            }
            
            if (b.type === 'orbit_spawn') {
                // 生成环绕物，立即移除
                this.spawnOrbitals(b);
                this.bullets.splice(i, 1);
                continue;
            }

            if (b.type === 'guardian_knife_spawn') {
                this.spawnGuardianKnives(b);
                this.bullets.splice(i, 1);
                continue;
            }
            
            // 普通投射物更新
            if (!this.updateProjectileBullet(b, dt, activeEnemies, stats)) {
                this.bullets.splice(i, 1);
                continue;
            }
            
            // v0.17.5 fix: 敌方子弹与玩家碰撞检测
            if (b.isEnemyBullet) {
                const pdx = b.x - this.player.cx;
                const pdy = b.y - this.player.cy;
                const pDist = Math.sqrt(pdx*pdx + pdy*pdy);
                if (pDist < 20 && !this.godMode && !this.player.isDashing) {
                    const projectileDmg = Number(b.dmg) || 0;
                    const isDead = this.player.takeDamage(projectileDmg, {});
                    const hitShake = Math.min(10, 3 + projectileDmg * 1.6);
                    const hitPulse = Math.min(0.05, 0.012 + projectileDmg * 0.0035);
                    this.camera?.addShake?.(hitShake, 0.18);
                    this.camera?.pulseZoom?.(hitPulse);
                    if (isDead || this.player.hp <= 0) {
                        if (this.tryRevive && this.tryRevive()) {
                            // 复活成功
                        } else {
                            this.player.hp = 0;
                            this.state = 'gameover';
                            this.audioCtrl.play('gameover');
                        }
                    }
                    this.bullets.splice(i, 1);
                    continue;
                }
            }
            
            // 边界检查
            if (b.x < 0 || b.x > roomW || b.y < 0 || b.y > roomH) {
                this.bullets.splice(i, 1);
                continue;
            }
        }
        
        // 更新环绕物
        this.updateOrbitals(dt, activeEnemies, stats);
        this.updateGuardianKnives(dt, activeEnemies, stats);

        

        // v0.16.3: 更新经验宝石（弹出动画 + 吸取 + 更大拾取范围）- 使用当前房间的gems
        if (!this.curRoom) return;
        for (let i = this.curRoom.gems.length - 1; i >= 0; i--) {
            const g = this.curRoom.gems[i];
            if (!g.autoCollect && g.autoCollectAfter && Date.now() / 1000 >= g.autoCollectAfter) {
                g.autoCollect = true;
                g.targetX = this.player.cx;
                g.targetY = this.player.cy;
                delete g.autoCollectAfter;
            }
            
            // v0.16.3: 自动吸收模式（房间清理后）- 高速飞向玩家
            if (g.autoCollect) {
                const dx = this.player.cx - g.x;
                const dy = this.player.cy - g.y;
                const d = Math.sqrt(dx*dx + dy*dy);
                
                // 高速飞向玩家
                const speed = Math.min(d * 5, 800) * dt;
                if (d > 0) {
                    g.x += (dx / d) * speed;
                    g.y += (dy / d) * speed;
                }
                
                // 拾取判定
                if (d < 50) {
                    const expBonus = (this.passives ? this.passives.getStats().expBonus : 0) + (this.items?.getStats?.()?.expBonus || 0) + (this.petTeamBonuses?.expBonus || 0);
                    const expGained = Math.floor(g.v * (1 + expBonus));
                    this.player.exp += expGained;
                    this.curRoom.gems.splice(i, 1);
                    this.audioCtrl.play('gem');
                    this.grantPickupMomentum('exp');
                    
                    if (this.player.exp >= this.player.lv * 100) {
                        this.player.exp -= this.player.lv * 100;
                        this.player.lv++;
                        this.audioCtrl.play('levelup');
                        this.particles.burst(this.player.cx, this.player.cy, '#ff0', 20);
                        this.openLevelUpSelect();
                    }
                }
                continue;
            }
            
            // 弹出动画阶段 - 带重力弹跳
            if (g.spawnTime > 0) {
                g.x += g.vx * dt;
                g.y += g.vy * dt;
                g.spawnTime -= dt;
                
                // 重力效果
                const gravity = g.gravity || 400;
                g.vy += gravity * dt;
                g.vx *= 0.98;  // 空气阻力
                
                // 地面弹跳
                if (g.bounce && g.groundY && g.y >= g.groundY) {
                    g.y = g.groundY;
                    g.vy = -g.vy * 0.5;  // 反弹并损失能量
                    g.vx *= 0.7;  // 地面摩擦
                    if (Math.abs(g.vy) < 50) {
                        g.spawnTime = 0;  // 速度太小，停止弹跳
                    }
                }
            } else {
                // 吸取阶段 - v0.16.3: 提高吸取速度到12倍
                const d = dist(g.x, g.y, this.player.x, this.player.y);
                if (d < stats.magnet) {
                    g.x += (this.player.x - g.x) * 12 * dt;
                    g.y += (this.player.y - g.y) * 12 * dt;
                }
                
                // v0.16.3: 放大拾取范围从20到35
                if (d < 35) {
                    const expBonus = (this.passives ? this.passives.getStats().expBonus : 0) + (this.items?.getStats?.()?.expBonus || 0) + (this.petTeamBonuses?.expBonus || 0);
                    const expGained = Math.floor(g.v * (1 + expBonus));
                    this.player.exp += expGained;
                    this.curRoom.gems.splice(i, 1);
                    this.audioCtrl.play('gem');
                    this.grantPickupMomentum('exp');
                    
                    if (this.player.exp >= this.player.lv * 100) {
                        this.player.exp -= this.player.lv * 100;
                        this.player.lv++;
                        this.audioCtrl.play('levelup');
                        this.particles.burst(this.player.cx, this.player.cy, '#ff0', 20);  // v0.16.3: 使用中心点
                        this.openLevelUpSelect();
                    }
                    continue;
                }
            }
            
            // 生命周期衰减 - v0.16.3: 不再随时间消失，只清理已拾取的
            // g.life -= dt;
            // if (g.life <= 0) this.curRoom.gems.splice(i, 1);
        }
        
        // v0.16.3: 更新金币掉落物（与经验宝石相同逻辑）- 使用当前房间的goldDrops
        for (let i = this.curRoom.goldDrops.length - 1; i >= 0; i--) {
            const g = this.curRoom.goldDrops[i];
            if (!g.autoCollect && g.autoCollectAfter && Date.now() / 1000 >= g.autoCollectAfter) {
                g.autoCollect = true;
                g.targetX = this.player.cx;
                g.targetY = this.player.cy;
                delete g.autoCollectAfter;
            }
            
            // v0.16.3: 自动吸收模式（房间清理后）
            if (g.autoCollect) {
                const dx = this.player.cx - g.x;
                const dy = this.player.cy - g.y;
                const d = Math.sqrt(dx*dx + dy*dy);
                
                const speed = Math.min(d * 5, 800) * dt;
                if (d > 0) {
                    g.x += (dx / d) * speed;
                    g.y += (dy / d) * speed;
                }
                
                if (d < 50) {
                    this.player.gold += Math.max(1, Math.floor(g.v * (this.currentCombatStats?.goldBonus || 1)));
                    this.curRoom.goldDrops.splice(i, 1);
                    this.audioCtrl.play('coin');
                    this.grantPickupMomentum('gold');
                }
                continue;
            }
            
            // 弹出动画阶段 - 带重力弹跳（金币）
            if (g.spawnTime > 0) {
                g.x += g.vx * dt;
                g.y += g.vy * dt;
                g.spawnTime -= dt;
                
                const gravity = g.gravity || 400;
                g.vy += gravity * dt;
                g.vx *= 0.98;
                
                // 地面弹跳
                if (g.bounce && g.groundY && g.y >= g.groundY) {
                    g.y = g.groundY;
                    g.vy = -g.vy * 0.5;
                    g.vx *= 0.7;
                    if (Math.abs(g.vy) < 50) {
                        g.spawnTime = 0;
                    }
                }
            } else {
                // 吸取阶段
                const d = dist(g.x, g.y, this.player.x, this.player.y);
                if (d < stats.magnet) {
                    g.x += (this.player.x - g.x) * 12 * dt;
                    g.y += (this.player.y - g.y) * 12 * dt;
                }
                
                // 拾取判定
                if (d < 35) {
                    this.player.gold += Math.max(1, Math.floor(g.v * (this.currentCombatStats?.goldBonus || 1)));
                    this.curRoom.goldDrops.splice(i, 1);
                    this.audioCtrl.play('coin');
                    this.grantPickupMomentum('gold');
                    continue;
                }
            }
            
            // v0.16.3: 不再随时间消失
            // g.life -= dt;
            // if (g.life <= 0) this.curRoom.goldDrops.splice(i, 1);
        }

        if (this.curRoom && this.curRoom.cleared) {
            const hasLooseDrops = (this.curRoom.gems || []).some(g => g && !g.autoCollect) || (this.curRoom.goldDrops || []).some(g => g && !g.autoCollect);
            if (hasLooseDrops) this.autoCollectAllGems();
        }

        for (let i = this.curRoom.items.length - 1; i >= 0; i--) {

            const item = this.curRoom.items[i];

            if (!item || typeof item.x !== 'number' || typeof item.y !== 'number') {

                console.warn('⚠️ 无效的物品数据:', item);

                this.curRoom.items.splice(i, 1);

                continue;

            }

            // v0.16.3: Boss奖励飞行动画
            if (item.isFlying && item.flyTime > 0) {
                item.flyTime -= dt;
                const progress = 1 - (item.flyTime / 0.5);  // 0到1
                // 贝塞尔曲线飞行（带弧线）
                const height = 100;  // 飞行高度
                item.x = item.x + (item.targetX - item.x) * 0.1;
                item.y = item.y + (item.targetY - item.y) * 0.1 - Math.sin(progress * Math.PI) * 5;
                
                if (item.flyTime <= 0 || dist(item.x, item.y, item.targetX, item.targetY) < 10) {
                    item.x = item.targetX;
                    item.y = item.targetY;
                    item.isFlying = false;
                    // 落地特效
                    this.particles.sparkle(item.x, item.y, '#ff0', 8);
                }
                continue;  // 飞行中不可拾取
            }

            const d = dist(item.x, item.y, this.player.x, this.player.y);

            

            if (d < 50) {  // v0.16.3: 增大拾取范围从30到50

                if (item.type === 'weapon') {
                    // 吸血鬼幸存者风格：打开4选1升级选择界面
                    this.audioCtrl.play('chest');
                    this.openLevelUpSelect();
                } else if (item.type === 'weapon_upgrade_box') {
                    // Boss武器升级礼盒: 升级1/3/5个武器等级
                    this.audioCtrl.play('evolve');
                    const count = item.upgradeCount || 1;
                    
                    // 获取已拥有的武器列表
                    const ownedWeapons = this.weapons.filter(w => !w.isSuper && w.canLevelUp());
                    
                    if (ownedWeapons.length > 0) {
                        // 随机选择武器进行升级
                        for (let i = 0; i < count; i++) {
                            if (ownedWeapons.length === 0) break;
                            const idx = randInt(0, ownedWeapons.length - 1);
                            const weapon = ownedWeapons[idx];
                            
                            if (weapon.canLevelUp()) {
                                this.upgradeWeaponInstance(weapon, { popup: false });
                            }
                            
                            // 如果武器满级，从列表移除
                            if (!weapon.canLevelUp()) {
                                ownedWeapons.splice(idx, 1);
                            }
                        }
                        
                        // 视觉反馈
                        this.particles.burst(this.player.cx, this.player.cy, '#fa0', 20);  // v0.16.3: 使用中心点
                        this.damageNumbers.spawn(this.player.cx, this.player.cy - 40, `+${count}武器升级!`, { color: '#ffaa00', size: 18 });
                    } else {
                        // 没有可升级武器，给金币补偿
                        this.player.gold += count * 50;
                        this.damageNumbers.spawn(this.player.cx, this.player.cy - 40, `+${count * 50}金币`, { color: '#ffcc00', size: 16 });  // v0.16.3: 使用中心点
                    }
                } else if (item.type === 'heart') {
                    // v0.11.0 - 血包：恢复2点红心生命
                    const maxHeal = Math.min(2, this.player.maxHp - this.player.hp);
                    if (maxHeal > 0) {
                        this.player.hp += maxHeal;
                        this.damageNumbers.spawn(this.player.cx, this.player.cy - 20, `+${maxHeal}❤️`, { color: '#ff4444', size: 18 });  // v0.16.3: 使用中心点
                        this.particles.burst(item.x, item.y, '#f44', 10);
                        this.audioCtrl.play('heal');
                    }
                } else if (item.type === 'totem') {
                    if (this.totems.collect(item.totemId)) {

                        this.audioCtrl.play('evolve');

                        this.particles.burst(item.x, item.y, '#ff0', 30);

                        const totem = TOTEMS[item.totemId];

                        if (totem.effect === 'maxHp') {

                            this.player.maxHp += totem.value;

                            this.player.hp += totem.value;

                        }

                    }
                    if (item.hiddenTotemFloor && window.HiddenRoomSystemRuntime?.markTotemCollected) {
                        window.HiddenRoomSystemRuntime.markTotemCollected(this, item.hiddenTotemFloor);
                    }
                    this.damageNumbers.spawn(this.player.cx, this.player.cy - 42, `获得 ${item.name || '图腾'}`, {
                        color: '#ffe27a',
                        size: 18,
                        life: 1.8
                    });
                    this.showToast?.(`已获得${item.name || '图腾'}`, { tone: 'info', duration: 1600 });

                } else if (item.type === 'stairs') {
                    if (window.shopNPCSystem?.isTalking) {
                        continue;
                    }
                    this.audioCtrl.play('portal');
                    this.beginFloorTransition();
                } else if (item.type === 'ending_gate') {
                    if (window.shopNPCSystem?.isTalking) {
                        continue;
                    }
                    this.audioCtrl.play('portal');
                    this.startVictorySequence();
                } else if (item.type === 'weapon_box' || item.type === 'weapon_choice_chest') {
                    // v0.9.5 - 武器箱/T3武器选择箱：打开3选1选择界面
                    this.audioCtrl.play('chest');
                    this.openWeaponBoxSelect();
                } else if (item.type === 'boss_chest') {
                    // 金色Boss宝箱：开启抽奖
                    if (!item.opened) {
                        item.opened = true;
                        this.openBossChestLottery(item);
                    }
                } else {
                    this.audioCtrl.play('buy');
                    if (this.items.add(item.id)) {
                        const itemDef = ITEMS[item.id];
                        if (itemDef?.effect === 'unlockPet' && itemDef.petId) {
                            this.unlockPet(itemDef.petId);
                        }
                    }
                }

                this.curRoom.items.splice(i, 1);

                this.particles.burst(item.x, item.y, '#ff0', 10);

                // 分数：拾取道具

                this.scoreManager.onCollectItem();

            }

        }

        

        this.particles.update(dt);

        this.damageNumbers.update(dt);
        
        // v0.17.0 - 更新武器视觉效果
        if (window.weaponVisuals) {
            window.weaponVisuals.update(dt);
        }
        
        // v0.18.4 fix: 处理regen效果（每秒回血）
        if (this.player && this.items) {
            const stats = this.items.getStats();
            if (stats.regen && stats.regen > 0) {
                this.regenTimer += dt;
                if (this.regenTimer >= 1) { // 每秒触发一次
                    this.regenTimer -= 1;
                    const healAmount = stats.regen; // regen值是固定回复量
                    if (healAmount > 0 && this.player.hp < this.player.maxHp) {
                        this.player.hp = Math.min(this.player.maxHp, this.player.hp + healAmount);
                    }
                }
            }
        }
        
        // v0.24: 更新HD-2D渲染器
        this.hd2dRenderer.update(dt, this.player, this.camera);
    },

    loop(t) {

        let dt = Math.min((t - (this.lastT || t)) / 1000, 0.1) * this.timeScale;

        if (dt < 0) {

            console.warn(`[Game] dt为负数: ${dt}, 重置为0`);

            dt = 0;

        }

        this.lastT = t;

        

        // 更新性能监控

        this.perfMonitor.update();
        this.debugPanel?.refreshRuntimeStats?.();

        

        if (this.state === 'playing' || this.transition.active) {

            this.update(dt);

        }

        

        // 检测原地停留（防挂机）

        if (this.state === 'playing' && this.player && this.scoreManager.isPlaying) {

            this.scoreManager.checkStallPosition(this.player.x, this.player.y);

        }

        

        this.draw();

        

        // 绘制性能监控

        this.perfMonitor.draw(this.ctx, 10, 10);

        

        // 更新分数显示

        if (this.state === 'playing' && this.scoreManager.isPlaying) {

            this.updateScoreDisplay();

        }

        

        this.rafId = requestAnimationFrame(t => this.loop(t));

    },

    };

    global.GameRuntimeController = GameRuntimeController;
})(typeof window !== 'undefined' ? window : globalThis);
