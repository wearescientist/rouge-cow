/**
 * Enemy Boss 行为逻辑
 * 从主类中拆分出来的原型扩展，保持运行行为不变。
 */
(function(global) {
    'use strict';

    const Enemy = global.Enemy;
    if (!Enemy) {
        console.warn('[RogueCow] Enemy 尚未加载，跳过扩展。');
        return;
    }

    function clampEnemyCombatPosition(room, x, y) {
        if (typeof SURVIVOR_CONFIG === 'undefined' || typeof SURVIVOR_CONFIG.clampEnemyToCombatArea !== 'function') {
            return { x, y };
        }
        return SURVIVOR_CONFIG.clampEnemyToCombatArea(x, y, room, 0.9);
    }

    Enemy.prototype.updateBossAI = function(dt, player, room) {
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
            const clamped = clampEnemyCombatPosition(room, newX, newY);
            
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
            const clamped = clampEnemyCombatPosition(room, newX, newY);
            this.x = clamped.x;
            this.y = clamped.y;
        }
        
        // 基础攻击冷却
        if (this.attackCd > 0) this.attackCd -= dt;
    }

    Enemy.prototype.updateBossSkillLogic = function(dt, player, room, bossCfg, skills, speedMult, dmgMult, cdMult) {
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

    global.Enemy = Enemy;
})(window);
