(function attachGameRenderBridge(global) {
    'use strict';

    const GameRenderBridge = {


getCanvasScale(baseSize = 960) {
    const canvas = this.canvas || document.getElementById('gameCanvas');
    const width = canvas?.width || baseSize;
    const height = canvas?.height || baseSize;
    return Math.min(width, height) / baseSize;
},



getWorldRenderScale() {
    const canvas = this.canvas || document.getElementById('gameCanvas');
    const canvasW = canvas?.width || SURVIVOR_CONFIG.VIEW_WIDTH || 960;
    const canvasH = canvas?.height || SURVIVOR_CONFIG.VIEW_HEIGHT || 960;
    if (this.camera?.showFullRoom) {
        return Math.min(
            canvasW / Math.max(SURVIVOR_CONFIG.ROOM_WIDTH, 1),
            canvasH / Math.max(SURVIVOR_CONFIG.ROOM_HEIGHT, 1)
        );
    }
    return this.camera?.zoom || 1;
},



getEntityRenderScale() {
    const canvasScale = this.getCanvasScale();
    const worldScale = this.getWorldRenderScale();
    if (this.camera?.showFullRoom) {
        return Math.max(canvasScale, worldScale);
    }
    return worldScale;
},



getEntityBrightnessBase() {
    const raw = Number(this.runtimeSettings?.entityBrightness);
    if (!Number.isFinite(raw)) return 0.4;
    return Math.max(0, Math.min(1, raw));
},



getCategoryBrightness(key, fallback = 1) {
    const raw = Number(this.runtimeSettings?.[key]);
    if (!Number.isFinite(raw)) return fallback;
    return Math.max(0, Math.min(1.5, raw));
},



getEntityBrightness(category = 'player') {
    const base = this.getEntityBrightnessBase();
    const categoryKey = category === 'enemy'
        ? 'enemyBrightness'
        : (category === 'prop' ? 'propBrightness' : 'playerBrightness');
    return Math.max(0, base * this.getCategoryBrightness(categoryKey, 1));
},



withEntityBrightness(drawFn, extraMultiplier = 1, category = 'player') {
    if (typeof drawFn !== 'function') return;
    const brightness = Math.max(0, this.getEntityBrightness(category) * (Number.isFinite(extraMultiplier) ? extraMultiplier : 1));
    this.ctx.save();
    this.ctx.filter = `brightness(${brightness})`;
    try {
        drawFn();
    } finally {
        this.ctx.restore();
    }
},



ensureCinematicToolkitState() {
    if (!this.cinematicToolkitState) {
        this.cinematicToolkitState = {
            barCurrent: 0,
            barTarget: 0,
            barReleaseAt: 0,
            slowUntil: 0,
            lastStamp: 0
        };
    }
    return this.cinematicToolkitState;
},



startCinematicBeat(options = {}) {
    const state = this.ensureCinematicToolkitState();
    const now = (globalThis.performance && typeof globalThis.performance.now === 'function')
        ? globalThis.performance.now()
        : Date.now();
    const bar = Number.isFinite(options.bar) ? Math.max(0, Math.min(0.22, options.bar)) : 0.08;
    const durationMs = Number.isFinite(options.durationMs) ? Math.max(80, options.durationMs) : 420;
    const slowScale = Number.isFinite(options.slowScale) ? Math.max(0.5, Math.min(1, options.slowScale)) : 1;
    const slowMs = Number.isFinite(options.slowMs) ? Math.max(0, options.slowMs) : 0;
    const whitelistOn = this.runtimeSettings?.enableBossSlowmoWhitelist !== false;
    const whitelist = window.BOSS_PRESENTATION_CONFIG?.slowMotionWhitelist || [];
    const beatTag = String(options.tag || '');
    const allowSlowMo = !whitelistOn || !beatTag || whitelist.includes(beatTag);

    state.barTarget = Math.max(state.barTarget, bar);
    state.barReleaseAt = Math.max(state.barReleaseAt, now + durationMs);

    if (slowMs > 0 && allowSlowMo && this.timeScale !== undefined) {
        this.timeScale = Math.min(this.timeScale || 1, slowScale);
        state.slowUntil = Math.max(state.slowUntil, now + slowMs);
    }
},



updateCinematicToolkit() {
    const state = this.ensureCinematicToolkitState();
    const now = (globalThis.performance && typeof globalThis.performance.now === 'function')
        ? globalThis.performance.now()
        : Date.now();

    if (state.lastStamp <= 0) state.lastStamp = now;
    const dt = Math.max(0, Math.min(0.08, (now - state.lastStamp) / 1000));
    state.lastStamp = now;

    if (now >= state.barReleaseAt) {
        state.barTarget = 0;
    }
    if (state.slowUntil > 0 && now >= state.slowUntil && this.timeScale !== undefined && this.timeScale < 1) {
        this.timeScale = 1;
        state.slowUntil = 0;
    }

    const lerpSpeed = 8.5;
    state.barCurrent += (state.barTarget - state.barCurrent) * Math.min(1, dt * lerpSpeed);
    if (Math.abs(state.barCurrent - state.barTarget) < 0.001) {
        state.barCurrent = state.barTarget;
    }
},



drawCinematicLetterbox(ctx = this.getOverlayDrawContext()) {
    if (!ctx) return;
    this.updateCinematicToolkit();
    if (this.showResultScreen || this.paused || this.hasBlockingOverlayOpen?.()) return;
    const state = this.cinematicToolkitState;
    if (!state || state.barCurrent <= 0.001) return;
    const viewW = this.overlayCanvas?.width || this.canvas?.width || 960;
    const viewH = this.overlayCanvas?.height || this.canvas?.height || 960;
    const barHeight = Math.round(viewH * state.barCurrent);
    if (barHeight <= 0) return;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.82)';
    ctx.fillRect(0, 0, viewW, barHeight);
    ctx.fillRect(0, viewH - barHeight, viewW, barHeight);
    ctx.restore();
},



getBulletDebugCollision(bullet) {
    if (!bullet) return null;
    if (bullet.type === 'melee') {
        return {
            kind: 'arc',
            radius: bullet.range || 100,
            color: '#ff4df1',
            label: `近战 ${Math.round(bullet.range || 100)}`,
            angle: bullet.angle || 0,
            arcAngle: bullet.arcAngle || 90
        };
    }
    if (bullet.type === 'area') {
        return {
            kind: 'circle',
            radius: bullet.range || 100,
            color: '#36e1ff',
            label: `区域 ${Math.round(bullet.range || 100)}`
        };
    }
    if (bullet.type === 'aura') {
        return {
            kind: 'circle',
            radius: bullet.range || 100,
            color: '#52ff84',
            label: `光环 ${Math.round(bullet.range || 100)}`
        };
    }

    let radius = bullet.hitRadius || 8;
    let color = '#7dff8a';
    let label = '子弹';
    if (bullet.subtype === 'explode') {
        radius = bullet.explodeRadius || 80;
        color = '#ff9b47';
        label = `爆炸 ${Math.round(radius)}`;
    } else if (bullet.subtype === 'homing' || bullet.subtype === 'poison_homing') {
        radius = bullet.hitRadius || 10;
        color = '#9f8cff';
        label = `追踪 ${Math.round(radius)}`;
    } else if (bullet.subtype === 'boomerang') {
        radius = bullet.hitRadius || 15;
        color = '#ffd166';
        label = `回旋 ${Math.round(radius)}`;
    } else if (bullet.subtype === 'orbit_proj') {
        radius = bullet.hitRadius || 12;
        color = '#ffe15c';
        label = `环绕 ${Math.round(radius)}`;
    } else if (bullet.type === 'laser_beam' || bullet.isLaser) {
        radius = bullet.radius || 20;
        color = '#ff5b7f';
        label = `激光 ${Math.round(radius)}`;
    } else if (bullet.hitRadius) {
        label = `${bullet.weaponKey || '子弹'} ${Math.round(radius)}`;
    }

    return { kind: 'circle', radius, color, label };
},



drawDebugCircle(screenX, screenY, radius, color, label = '') {
    if (!Number.isFinite(radius) || radius <= 0) return;
    this.ctx.save();
    this.ctx.translate(screenX, screenY);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 1.5;
    this.ctx.setLineDash([4, 4]);
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius, 0, Math.PI * 2);
    this.ctx.stroke();
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    this.ctx.fill();
    if (label) {
        this.ctx.fillStyle = color;
        this.ctx.font = '10px ZCOOL KuaiLe Local';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(label, 0, -radius - 6);
    }
    this.ctx.restore();
},



drawDebugArc(screenX, screenY, radius, angle, arcAngleDeg, color, label = '') {
    if (!Number.isFinite(radius) || radius <= 0) return;
    this.ctx.save();
    this.ctx.translate(screenX, screenY);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = 1.5;
    this.ctx.setLineDash([5, 5]);
    const arcRad = (arcAngleDeg || 90) * Math.PI / 360;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, radius, angle - arcRad, angle + arcRad);
    this.ctx.stroke();
    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(Math.cos(angle - arcRad) * radius, Math.sin(angle - arcRad) * radius);
    this.ctx.moveTo(0, 0);
    this.ctx.lineTo(Math.cos(angle + arcRad) * radius, Math.sin(angle + arcRad) * radius);
    this.ctx.stroke();
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, 2.5, 0, Math.PI * 2);
    this.ctx.fill();
    if (label) {
        this.ctx.fillStyle = color;
        this.ctx.font = '10px ZCOOL KuaiLe Local';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(label, 0, -radius - 6);
    }
    this.ctx.restore();
},


drawCredits(ctx) {
    if (!this.credits || !this.credits.active) {
        this.hideFullscreenCinematicOverlay();
        return;
    }

    if (this.credits.phase === 'ending') {
        const lines = this.credits.lines;
        const currentIdx = this.credits.lineIndex;
        if (currentIdx >= lines.length) {
            this.credits.phase = 'thanks';
            this.credits.thanksStartTime = Date.now();
            return;
        }

        const currentLine = lines[currentIdx];
        const elapsed = Date.now() - this.credits.stateTime;
        const { fadeDuration, displayDuration } = this.credits;
        let alpha = 1;
        if (this.credits.state === 'fadeIn') {
            alpha = Math.min(1, elapsed / fadeDuration);
            if (elapsed >= fadeDuration) {
                this.credits.state = 'display';
                this.credits.stateTime = Date.now();
            }
        } else if (this.credits.state === 'display') {
            alpha = 1;
            if (elapsed >= displayDuration && this.credits.autoPlay) {
                this.credits.state = 'fadeOut';
                this.credits.stateTime = Date.now();
            }
        } else if (this.credits.state === 'fadeOut') {
            alpha = Math.max(0, 1 - elapsed / fadeDuration);
            if (elapsed >= fadeDuration) {
                this.credits.lineIndex++;
                this.credits.state = 'fadeIn';
                this.credits.stateTime = Date.now();
            }
        }
        const isLastLine = currentIdx >= lines.length - 1;
        const showPrompt = !this.credits.autoPlay || (this.credits.state === 'display' && elapsed > displayDuration * 0.7);
        this.setFullscreenCinematicOverlay({
            opacity: 1,
            visible: true,
            clickable: true,
            text: currentLine || '',
            subtext: '',
            prompt: showPrompt && !isLastLine ? '点击或按空格键继续' : '',
            textAlpha: alpha
        });
    } else if (this.credits.phase === 'thanks') {
        const elapsed = Date.now() - this.credits.thanksStartTime;
        const progress = Math.min(1, elapsed / 1500);
        const alpha = Math.sin(progress * Math.PI / 2);
        this.setFullscreenCinematicOverlay({
            opacity: 1,
            visible: true,
            clickable: false,
            text: '感谢游玩',
            subtext: '',
            prompt: '',
            textAlpha: alpha
        });
        if (elapsed > 4000) {
            this.credits.active = false;
            this.hideFullscreenCinematicOverlay();
            this.returnToMainMenu();
        }
    }
},



drawBossAftermath(ctx = this.ctx) {
    const aftermath = this.curRoom?.bossAftermath;
    if (!aftermath?.active) return;
    const pos = this.camera.worldToScreen(aftermath.x, aftermath.y);
    ctx.save();
    ctx.translate(pos.x, pos.y + 12);
    ctx.rotate(aftermath.corpseAngle || 0);
    const corpseScale = this.getEntityRenderScale ? this.getEntityRenderScale() : 1;
    if (corpseScale !== 1) ctx.scale(corpseScale, corpseScale);
    ctx.globalAlpha = 0.88;
    if (aftermath.corpseEnemy) {
        ctx.fillStyle = 'rgba(0,0,0,0.22)';
        ctx.beginPath();
        ctx.ellipse(0, 6, 46, 18, 0, 0, Math.PI * 2);
        ctx.fill();
        if (aftermath.corpseEnemy.spriteFrames?.length) {
            aftermath.corpseEnemy.drawSprite(ctx, 0, 0);
        }
    } else {
        ctx.fillStyle = 'rgba(70, 10, 18, 0.82)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 42, 26, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    ctx.restore();

    if (!aftermath.dialogueStarted) {
        const pulse = 0.55 + Math.sin(aftermath.promptPulse * 3.5) * 0.18;
        ctx.save();
        ctx.textAlign = 'center';
        ctx.fillStyle = `rgba(8, 8, 10, ${0.72 + pulse * 0.1})`;
        ctx.fillRect(pos.x - 68, pos.y - 116, 136, 28);
        ctx.strokeStyle = `rgba(255, 240, 220, ${0.4 + pulse * 0.2})`;
        ctx.strokeRect(pos.x - 68, pos.y - 116, 136, 28);
        ctx.fillStyle = `rgba(255,255,255,${0.8 + pulse * 0.15})`;
        ctx.font = '14px ZCOOL KuaiLe Local';
        ctx.fillText('靠近聆听', pos.x, pos.y - 97);
        ctx.restore();
    }
},


drawSpriteWithRatio(ctx, sprite, x, y, targetSize, spriteKey) {
    if (!sprite) return;
    
    const spriteData = this.spriteDataRegistry ? this.spriteDataRegistry.get(spriteKey) : null;
    
    if (spriteData) {
        const modelRatio = spriteData.modelWidth / spriteData.modelHeight;
        let drawW, drawH;
        
        if (modelRatio > 1) {
            drawW = targetSize;
            drawH = targetSize / modelRatio;
        } else {
            drawH = targetSize;
            drawW = targetSize * modelRatio;
        }
        
        const anchor = spriteData.anchor.feet;
        const drawX = x - drawW * (anchor.x / spriteData.canvasWidth);
        const drawY = y - drawH * (anchor.y / spriteData.canvasHeight);
        
        ctx.drawImage(sprite, drawX, drawY, drawW, drawH);
    } else {
        // 回退：固定正方形
        ctx.drawImage(sprite, x - targetSize/2, y - targetSize/2, targetSize, targetSize);
    }
},



applyFloorHudTheme() {
    const themeKey = this.getFloorThemeKey();
    if (themeKey === this.activeFloorTheme) return;
    document.documentElement.setAttribute('data-floor-theme', themeKey);
    this.activeFloorTheme = themeKey;
    this.activeThemeCanvasFill = this.themeToneResolver.getHudCanvasFill();
    this.refreshInkStageDecor(true);
},



getCurrentPlayerSpriteName() {
    if (!this.player) return 'player_idle_0';

    if (this.player.isDashing) return 'player_dash_0';
    if (this.player.hitTimer > 0) return 'player_hit_0';

    if (this.player.isMoving) {
        const walkFrames = ['player_walk_0', 'player_walk_1', 'player_walk_2', 'player_walk_3'];
        return walkFrames[Math.floor(Date.now() / 140) % walkFrames.length];
    }

    if (this.player.isEating) {
        const eatFrames = ['player_eat_0', 'player_eat_1', 'player_eat_2', 'player_eat_3'];
        const eatIndex = Math.min(eatFrames.length - 1, Math.floor(this.player.eatTimer / 180));
        return eatFrames[eatIndex];
    }

    if (this.player.isBlinking) return 'player_blink_0';

    const idleFrames = ['player_idle_0', 'player_idle_1'];
    return idleFrames[Math.floor(Date.now() / 560) % idleFrames.length];
},





draw() {
    // v0.22: 如果正在播放制作名单，只绘制制作名单
    if (this.credits && this.credits.active) {
        this.drawCredits(this.ctx);
        return;
    }

    this.shopkeeperPresentationData = null;

    // 更新相机
    this.camera.update();

    

    // 使用 canvas 实际尺寸

    const canvasW = this.canvas.width;

    const canvasH = this.canvas.height;

    const pixelSampling = this.runtimeSettings?.enablePixelSampling === true;
    this.ctx.imageSmoothingEnabled = !pixelSampling;
    this.ctx.imageSmoothingQuality = pixelSampling ? 'low' : 'high';

    

    // 清空画布

    this.applyFloorHudTheme();
    this.ctx.fillStyle = this.activeThemeCanvasFill || '#0d0d1a';

    this.ctx.fillRect(0, 0, canvasW, canvasH);

    

    // 保存上下文用于缩放

    this.ctx.save();

    if (this.camera.showFullRoom) {

        this.ctx.scale(this.camera.zoom, this.camera.zoom);

    }

    

    // 绘制房间（传入相机和精灵管理器）
    this.curRoom.draw(this.ctx, this.camera, this.sprites);

    

    // 🩸 绘制血迹（在地面，所有物品/敌人下方）
    if (this.bloodStains && this.curRoom) {
        this.bloodStains.draw(this.ctx, this.curRoom, this.camera);
    }

    this.floor7AwakeningSystem?.drawWorld?.(this.ctx, this.camera);

    if (this.curRoom && this.camera) {
        if (this.curRoom.type === 'hidden' && (this.curRoom.floor || this.currentFloor) === 2 && window.HiddenRoomSystemRuntime?.drawFloor2Critters) {
            window.HiddenRoomSystemRuntime.drawFloor2Critters(this.ctx, this.camera, this.curRoom, this.curRoom.hiddenRenderTime || 0);
        }
        if (typeof this.curRoom.drawPresentationCritters === 'function') {
            this.curRoom.drawPresentationCritters(this.ctx, this.camera, Date.now() / 1000);
        }
    }

    

    // 绘制掉落物（只绘制视野内的）
    
    // v0.16.3: 绘制经验宝石（优先使用贴图）- 使用当前房间的gems
    if (this.curRoom) {
        const gemSprite = this.sprites.get('effect_gem_blue');
        for (const g of this.curRoom.gems) {
            if (!this.camera.isVisible(g.x, g.y, 20)) continue;
            const pos = this.camera.worldToScreen(g.x, g.y);
            
            // 弹跳动画偏移 - 0.5秒持续时间
            let bounceY = 0;
            if (g.spawnTime > 0) {
                const progress = (0.5 - g.spawnTime) / 0.5;  // 0到1
                bounceY = -Math.sin(progress * Math.PI) * 20;  // 抛物线弹跳，最高20像素
            }
            
            if (gemSprite) {
                const size = 12;
                this.ctx.drawImage(gemSprite, pos.x - size, pos.y - size + bounceY, size * 2, size * 2);
            } else {
                this.ctx.fillStyle = '#48f';
                this.ctx.beginPath();
                this.ctx.moveTo(pos.x, pos.y - 6 + bounceY);
                this.ctx.lineTo(pos.x + 5, pos.y + bounceY);
                this.ctx.lineTo(pos.x, pos.y + 6 + bounceY);
                this.ctx.lineTo(pos.x - 5, pos.y + bounceY);
                this.ctx.fill();
            }
        }
        
        // v0.16.3: 绘制金币掉落物 - 使用当前房间的goldDrops，缩小+黑边
        for (const g of this.curRoom.goldDrops) {
            if (!this.camera.isVisible(g.x, g.y, 15)) continue;
            const pos = this.camera.worldToScreen(g.x, g.y);
            
            // 弹跳动画偏移 - 0.5秒持续时间
            let bounceY = 0;
            if (g.spawnTime > 0) {
                const progress = (0.5 - g.spawnTime) / 0.5;
                bounceY = -Math.sin(progress * Math.PI) * 20;
            }
            
            // 绘制金币图标（缩小到12px，加黑边）
            this.ctx.font = '12px ZCOOL KuaiLe Local';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            // 黑边
            this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
            this.ctx.fillText('🪙', pos.x - 1, pos.y + bounceY);
            this.ctx.fillText('🪙', pos.x + 1, pos.y + bounceY);
            this.ctx.fillText('🪙', pos.x, pos.y - 1 + bounceY);
            this.ctx.fillText('🪙', pos.x, pos.y + 1 + bounceY);
            // 本体
            this.ctx.fillText('🪙', pos.x, pos.y + bounceY);
            
            // 小数值显示（大于1时）
            if (g.v > 1) {
                this.ctx.fillStyle = '#fc0';
                this.ctx.font = '9px ZCOOL KuaiLe Local';
                this.ctx.fillText(g.v, pos.x + 8, pos.y - 6 + bounceY);
            }
        }
    }

    

    // 武器key到贴图名称的映射
    const WEAPON_SPRITE_MAP = {
        'whip': 'weapon_whip', 'wand': 'weapon_wand', 'knife': 'weapon_knife', 
        'axe': 'weapon_axe', 'bible': 'weapon_bible', 'fireball': 'weapon_fireball',
        'lightning': 'weapon_lightning', 'holy_water': 'weapon_holywater'
    };
    
    // ============================================================
    // v0.32 - HD-2D武器视觉效果系统
    // ============================================================
    const deferredForegroundBullets = [];
    for (const b of this.bullets) {
        if (b.delay && b.delay > 0) continue;
        if (!this.camera.isVisible(b.x, b.y, 30)) continue;
        if (this.weaponVisuals?.shouldRenderAfterForegroundOcclusion?.(b)) {
            deferredForegroundBullets.push(b);
            continue;
        }
        const pos = this.camera.worldToScreen(b.x, b.y);
        const bulletZoom = this.getEntityRenderScale();
        
        // 使用新的WeaponVisuals系统绘制（带HD-2D效果：阴影、辉光、环境光）
        this.weaponVisuals.drawBullet(b, pos.x, pos.y, bulletZoom);
        
        // v0.18.0: 子弹实际伤害范围调试显示
        if (this.showHitboxDebug) {
            const debugShape = this.getBulletDebugCollision(b);
            if (debugShape?.kind === 'arc') {
                this.drawDebugArc(
                    pos.x,
                    pos.y,
                    debugShape.radius * this.camera.zoom,
                    debugShape.angle || 0,
                    debugShape.arcAngle || 90,
                    debugShape.color,
                    debugShape.label
                );
            } else if (debugShape?.kind === 'circle') {
                this.drawDebugCircle(
                    pos.x,
                    pos.y,
                    debugShape.radius * this.camera.zoom,
                    debugShape.color,
                    debugShape.label
                );
            }
        }
    }
    
    // 绘制武器尾迹和粒子
    window.weaponVisuals.draw(this.ctx, this.camera);

    if (this.guardianKnives && this.player && this.camera) {
        const time = Date.now() / 1000;
        for (const knife of this.guardianKnives) {
            if (!knife) continue;
            if (!this.camera.isVisible(knife.x, knife.y, 36)) continue;

            const pos = this.camera.worldToScreen(knife.x, knife.y);
            const angle = Math.atan2(knife.vy || 0, knife.vx || 1);
            const isSuperKnife = !!knife.isSuper;
            const drawSize = knife.drawSize || (isSuperKnife ? 34 : 26);
            const bodyLen = drawSize * (isSuperKnife ? 1.5 : 1.32);
            const bodyWidth = drawSize * (isSuperKnife ? 0.22 : 0.16);
            const pulse = knife.state === 'idle' ? 0.96 + Math.sin(time * 3 + knife.slotIndex) * 0.05 : 1.04;
            const baseColor = isSuperKnife ? '#f0c34a' : '#ff2323';
            const glowColor = isSuperKnife ? '#f6d36f' : '#ff3636';
            const coreColor = isSuperKnife ? '#fff2b8' : '#ffb0b0';
            const drawGuardianKnifeNeedle = (drawPos, drawAngle, alpha, scaleY = 1) => {
                this.ctx.save();
                this.ctx.translate(drawPos.x, drawPos.y);
                this.ctx.rotate(drawAngle + Math.PI * 0.5);
                this.ctx.shadowBlur = isSuperKnife ? 10 : 4;
                this.ctx.shadowColor = glowColor;
                this.ctx.globalAlpha = alpha;
                this.ctx.scale(1, scaleY);

                const needleGrad = this.ctx.createLinearGradient(0, bodyLen * 0.48, 0, -bodyLen * 0.55);
                needleGrad.addColorStop(0, 'rgba(30, 0, 0, 0)');
                needleGrad.addColorStop(0.45, isSuperKnife ? 'rgba(255, 106, 72, 0.62)' : 'rgba(255, 31, 31, 0.72)');
                needleGrad.addColorStop(1, isSuperKnife ? 'rgba(255, 230, 150, 0.98)' : 'rgba(255, 108, 108, 0.98)');
                this.ctx.fillStyle = needleGrad;
                this.ctx.beginPath();
                this.ctx.moveTo(0, -bodyLen * 0.82);
                this.ctx.lineTo(bodyWidth * 0.92, 0);
                this.ctx.lineTo(0, bodyLen * 0.82);
                this.ctx.lineTo(-bodyWidth * 0.92, 0);
                this.ctx.closePath();
                this.ctx.fill();

                this.ctx.shadowBlur = isSuperKnife ? 6 : 2;
                this.ctx.shadowColor = coreColor;
                this.ctx.fillStyle = coreColor;
                this.ctx.beginPath();
                this.ctx.moveTo(0, -bodyLen * 0.5);
                this.ctx.lineTo(bodyWidth * 0.32, 0);
                this.ctx.lineTo(0, bodyLen * 0.5);
                this.ctx.lineTo(-bodyWidth * 0.32, 0);
                this.ctx.closePath();
                this.ctx.fill();

                this.ctx.shadowBlur = isSuperKnife ? 8 : 3;
                this.ctx.shadowColor = glowColor;
                this.ctx.fillStyle = baseColor;
                this.ctx.beginPath();
                this.ctx.moveTo(0, -bodyLen * 0.82);
                this.ctx.lineTo(bodyWidth * 0.2, -bodyLen * 0.45);
                this.ctx.lineTo(-bodyWidth * 0.2, -bodyLen * 0.45);
                this.ctx.closePath();
                this.ctx.fill();
                this.ctx.restore();
            };

            const trail = Array.isArray(knife.trail) ? knife.trail : [];
            if (trail.length > 1) {
                this.ctx.save();
                this.ctx.lineCap = 'round';
                this.ctx.lineJoin = 'round';
                this.ctx.shadowBlur = isSuperKnife ? 8 : 4;
                this.ctx.shadowColor = glowColor;
                for (let i = trail.length - 1; i > 0; i--) {
                    const current = trail[i];
                    const next = trail[i - 1];
                    if (!current || !next || current.breakAfter || next.breakBefore) continue;
                    const segDist = dist(current.x, current.y, next.x, next.y);
                    if (segDist > (isSuperKnife ? 40 : 32)) continue;
                    const ratio = Math.min(current.life / current.maxLife, next.life / next.maxLife);
                    const p0 = this.camera.worldToScreen(current.x, current.y);
                    const p1 = this.camera.worldToScreen(next.x, next.y);
                    this.ctx.strokeStyle = isSuperKnife
                        ? `rgba(255, 118, 84, ${0.18 + ratio * 0.42})`
                        : `rgba(255, 36, 36, ${0.22 + ratio * 0.48})`;
                    this.ctx.lineWidth = (isSuperKnife ? 2.4 : 1.8) * (0.35 + ratio * 0.5);
                    this.ctx.beginPath();
                    this.ctx.moveTo(p0.x, p0.y);
                    this.ctx.lineTo(p1.x, p1.y);
                    this.ctx.stroke();
                }
                this.ctx.restore();
            }

            drawGuardianKnifeNeedle(pos, angle, knife.state === 'idle' ? 0.9 : 0.98, pulse);

            if (this.showHitboxDebug) {
                this.drawDebugGuardianKnifeRange(knife);
            }
        }
    }
    
    // 环绕物效果绘制（圣经：贴图旋转+柔和发光）
    if (this.orbitals && this.player && this.camera) {
        for (const orb of this.orbitals) {
            if (!orb || !Number.isFinite(orb.angle) || !Number.isFinite(orb.radius)) continue;
            const ox = this.player.cx + Math.cos(orb.angle) * orb.radius;
            const oy = this.player.cy + Math.sin(orb.angle) * orb.radius;
            if (!this.camera.isVisible(ox, oy, 30)) continue;
            
            const pos = this.camera.worldToScreen(ox, oy);
            const time = Date.now() / 1000;
            const orbSpriteKey = orb.weaponSprite || (window.WEAPON_WEAPONKEY_TO_SPRITEKEY?.[orb.weaponKey || '']) || 'weapon_bible';
            const orbSprite = this.sprites ? this.sprites.get(orbSpriteKey) : null;
            const visualSpinSpeed = orb.visualSpinSpeed || Math.max(1.4, (orb.speed || 2) * 0.95);
            const isHolySwordOrb = orb.weaponKey === 'whip' || orb.weaponKey === 'blood_whip';
            const isSuperHolySwordOrb = orb.weaponKey === 'blood_whip';
            const spriteRotation = isHolySwordOrb ? orb.angle : (time * visualSpinSpeed + orb.angle);
            
            this.ctx.save();
            this.ctx.translate(pos.x, pos.y);
            
            const isPermanent = orb.permanent || orb.life === Infinity;
            const glowIntensity = isHolySwordOrb
                ? (isPermanent ? 11 + Math.sin(time * 8) * 3 : 7 + Math.sin(time * 8) * 2)
                : (isPermanent ? 14 + Math.sin(time * 9) * 4 : 9 + Math.sin(time * 9) * 3);
            this.ctx.shadowBlur = glowIntensity;
            this.ctx.shadowColor = isSuperHolySwordOrb ? '#ffb56e' : (orb.color || '#ffe082');
            this.ctx.globalAlpha = isPermanent ? 0.95 : 0.85;
            
            const drawSize = orb.drawSize || (isPermanent ? 76 : 60);
            let renderedConfiguredOrbital = false;
            if (isHolySwordOrb && this.weaponVisuals?.drawConfiguredProjectileSprite) {
                renderedConfiguredOrbital = !!this.weaponVisuals.drawConfiguredProjectileSprite(this.ctx, {
                    weaponKey: orb.weaponKey,
                    weaponSprite: orb.weaponSprite,
                    size: drawSize,
                    radius: orb.radius,
                    attackRadius: orb.attackRadius
                }, this.camera?.zoom || 1, {
                    scene: 'orbit',
                    baseAngle: orb.angle,
                    player: this.player,
                    orbitRadius: orb.radius,
                    attackRadius: orb.attackRadius || orb.radius,
                    fallbackSize: drawSize,
                    minSize: Math.max(8, drawSize)
                });
            }
            if (!renderedConfiguredOrbital) {
                this.ctx.rotate(spriteRotation);
                if (orbSprite) {
                    this.ctx.drawImage(orbSprite, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
                } else {
                    this.ctx.fillStyle = '#ffe082';
                    this.ctx.beginPath();
                    this.ctx.arc(0, 0, drawSize * 0.32, 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
            
            if (!isHolySwordOrb) {
                this.ctx.shadowBlur = 0;
                this.ctx.strokeStyle = 'rgba(255, 248, 214, 0.7)';
                this.ctx.lineWidth = 1.5;
                this.ctx.beginPath();
                this.ctx.moveTo(-4, 0);
                this.ctx.lineTo(4, 0);
                this.ctx.moveTo(0, -4);
                this.ctx.lineTo(0, 4);
                this.ctx.stroke();
            }
            
            this.ctx.restore();
        }
        
        // v0.18.0: 环绕物碰撞体积调试显示
        if (this.showHitboxDebug && this.orbitals) {
            for (const orb of this.orbitals) {
                if (!orb) continue;
                const ox = this.player.cx + Math.cos(orb.angle) * (orb.radius || 80);
                const oy = this.player.cy + Math.sin(orb.angle) * (orb.radius || 80);
                if (!this.camera.isVisible(ox, oy, 30)) continue;
                this.drawDebugOrbitalRange(orb);
            }
        }
    }

    

    for (const item of this.curRoom.items) {

        if (!this.camera.isVisible(item.x, item.y, 50)) continue;  // v0.16.3: 增大绘制范围从30到50

        const pos = this.camera.worldToScreen(item.x, item.y);

        

        // 获取物品描述和图标

        let desc = '';

        let icon = item.icon;

        if (item.type === 'weapon') {

            // 武器箱显示问号，不透露具体武器

            icon = '❓';

            desc = '神秘武器|拾取后三选一';

        } else if (item.type === 'totem') {

            const t = TOTEMS[item.totemId];

            desc = t ? `${t.name}|${t.desc}` : '图腾';

        } else if (item.type === 'stairs' || item.type === 'ending_gate') {

            // 楼梯特殊显示

            const isEndingGate = item.type === 'ending_gate';
            desc = isEndingGate ? (item.desc || '迈入终局') : '通往下一层';

            icon = isEndingGate ? (item.icon || '◉') : '🕳️';

            

            // 绘制楼梯特殊效果（紫色发光圆圈）

            const pulse = Math.sin(Date.now() / 300) * 5;

            this.ctx.strokeStyle = isEndingGate ? 'rgba(128, 220, 255, 0.8)' : 'rgba(160, 32, 240, 0.6)';

            this.ctx.lineWidth = 3;

            this.ctx.beginPath();

            this.ctx.arc(pos.x, pos.y, 25 + pulse, 0, Math.PI * 2);

            this.ctx.stroke();

            

            this.ctx.fillStyle = isEndingGate ? 'rgba(70, 190, 255, 0.22)' : 'rgba(160, 32, 240, 0.2)';

            this.ctx.beginPath();

            this.ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);

            this.ctx.fill();

            

            // 绘制描述文字

            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';

            this.ctx.fillRect(pos.x - 50, pos.y - 45, 100, 16);

            this.ctx.fillStyle = isEndingGate ? '#8fe9ff' : '#d0f';

            this.ctx.font = 'bold 11px ZCOOL KuaiLe Local';

            this.ctx.textAlign = 'center';

            this.ctx.fillText(desc, pos.x, pos.y - 33);

            
            // 绘制楼梯图标（更大）

            this.ctx.font = isEndingGate ? '28px ZCOOL KuaiLe Local' : '32px ZCOOL KuaiLe Local';

            this.ctx.fillText(icon, pos.x, pos.y + 10);

            continue; // 楼梯/结局入口绘制完成，跳过通用绘制

        } else if (item.type === 'boss_chest') {
            // 👑 金色Boss宝箱特殊绘制
            const time = Date.now() / 1000;
            const bounce = Math.sin(time * 3) * 3;
            const glowPulse = 0.5 + Math.sin(time * 4) * 0.3;
            
            // 外发光圈
            const gradient = this.ctx.createRadialGradient(pos.x, pos.y + bounce, 0, pos.x, pos.y + bounce, 40);
            gradient.addColorStop(0, `rgba(255, 215, 0, ${glowPulse})`);
            gradient.addColorStop(0.5, `rgba(255, 170, 0, ${glowPulse * 0.5})`);
            gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y + bounce, 40, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 地面光环
            this.ctx.strokeStyle = `rgba(255, 215, 0, ${0.3 + glowPulse * 0.3})`;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, 25 + Math.sin(time * 2) * 3, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // 宝箱图标（带弹跳效果）
            this.ctx.font = '36px ZCOOL KuaiLe Local';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('👑', pos.x, pos.y + 12 + bounce);
            
            // 名称标签
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(pos.x - 65, pos.y - 50, 130, 18);
            this.ctx.fillStyle = '#ffd700';
            this.ctx.font = 'bold 12px ZCOOL KuaiLe Local';
            this.ctx.fillText('金色Boss宝箱', pos.x, pos.y - 38);
            
            // 提示文字
            this.ctx.fillStyle = `rgba(255, 200, 100, ${0.5 + glowPulse * 0.5})`;
            this.ctx.font = '10px ZCOOL KuaiLe Local';
            this.ctx.fillText('点击开启', pos.x, pos.y + 35);
            
            continue; // 跳过通用绘制

        } else if (item.type === 'weapon_choice_chest') {
            // 🎁 T3武器选择箱特殊绘制
            const time = Date.now() / 1000;
            const bounce = Math.sin(time * 3) * 3;
            const glowPulse = 0.5 + Math.sin(time * 4) * 0.3;
            
            // 外发光圈（橙色）
            const gradient = this.ctx.createRadialGradient(pos.x, pos.y + bounce, 0, pos.x, pos.y + bounce, 35);
            gradient.addColorStop(0, `rgba(255, 136, 0, ${glowPulse})`);
            gradient.addColorStop(0.5, `rgba(255, 170, 0, ${glowPulse * 0.5})`);
            gradient.addColorStop(1, 'rgba(255, 100, 0, 0)');
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y + bounce, 35, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 地面光环
            this.ctx.strokeStyle = `rgba(255, 136, 0, ${0.3 + glowPulse * 0.3})`;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, 22 + Math.sin(time * 2) * 3, 0, Math.PI * 2);
            this.ctx.stroke();
            
            // 宝箱图标（带弹跳效果）
            this.ctx.font = '32px ZCOOL KuaiLe Local';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('🎁', pos.x, pos.y + 10 + bounce);
            
            // 名称标签
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(pos.x - 60, pos.y - 45, 120, 16);
            this.ctx.fillStyle = '#ff8800';
            this.ctx.font = 'bold 11px ZCOOL KuaiLe Local';
            this.ctx.fillText('武器选择箱', pos.x, pos.y - 34);
            
            // 提示文字
            this.ctx.fillStyle = `rgba(255, 200, 100, ${0.5 + glowPulse * 0.5})`;
            this.ctx.font = '10px ZCOOL KuaiLe Local';
            this.ctx.fillText('点击开启', pos.x, pos.y + 32);
            
            continue; // 跳过通用绘制

        } else {

            const itemData = ITEMS[item.id];

            desc = itemData ? `${itemData.name}|${itemData.desc}` : '道具';

        }

        

        // 绘制描述文字（物品上方）
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(pos.x - 60, pos.y - 35, 120, 14);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '10px ZCOOL KuaiLe Local';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(desc.substring(0, 20), pos.x, pos.y - 25);
        
        // 绘制物品图标（优先使用贴图）
        if (item.type === 'totem' && item.totemId) {
            // 图腾贴图映射
            const TOTEM_SPRITE_MAP = {
                1: 'totem_attack', 2: 'totem_attack', 3: 'totem_defense', 4: 'totem_defense',
                5: 'totem_speed', 6: 'totem_speed', 7: 'totem_attack', 8: 'totem_defense'
            };
            const spriteName = TOTEM_SPRITE_MAP[item.totemId] || 'totem_attack';
            const sprite = this.sprites.get(spriteName);
            if (sprite) {
                // v0.30-iter4: 使用辅助方法绘制，保持比例
                this.drawSpriteWithRatio(this.ctx, sprite, pos.x, pos.y + 5, 32, spriteName);
            } else {
                this.ctx.fillStyle = '#f0f';
                this.ctx.font = '20px ZCOOL KuaiLe Local';
                this.ctx.fillText(icon, pos.x, pos.y + 5);
            }
        } else if (item.id && item.id >= 1 && item.id <= 16) {
            // 使用道具贴图
            const spriteName = 'item_' + String(item.id).padStart(2, '0');
            const sprite = this.sprites.get(spriteName);
            if (sprite) {
                // v0.30-iter4: 使用辅助方法绘制，保持比例
                this.drawSpriteWithRatio(this.ctx, sprite, pos.x, pos.y + 5, 32, spriteName);
            } else {
                // 回退到emoji
                this.ctx.fillStyle = item.type === 'weapon' ? '#f80' : '#ff0';
                this.ctx.font = '20px ZCOOL KuaiLe Local';
                this.ctx.fillText(icon, pos.x, pos.y + 5);
            }
        } else {
            // 其他类型使用emoji
            this.ctx.fillStyle = item.type === 'weapon' ? '#f80' : '#ff0';
            this.ctx.font = '20px ZCOOL KuaiLe Local';
            this.ctx.fillText(icon, pos.x, pos.y + 5);
        }

        

        this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';

        this.ctx.lineWidth = 2;

        this.ctx.beginPath();

        this.ctx.arc(pos.x, pos.y, 15 + Math.sin(Date.now() / 200) * 3, 0, Math.PI * 2);

        this.ctx.stroke();

    }

    // 获取活跃敌人并更新空间网格

    const activeEnemies = this.curRoom.hordeManager ? this.curRoom.hordeManager.getActiveEnemies() : this.curRoom.enemies;

    const requestedGridSize = Number(this.runtimeSettings?.spatialGridCellSize);
    if (Number.isFinite(requestedGridSize) && this.spatialGrid?.setCellSize) {
        this.spatialGrid.setCellSize(requestedGridSize);
    }
    this.perfMonitor?.setMetric?.('grid.cellSize', this.spatialGrid?.cellSize || 0);
    this.spatialGrid.clear();

    for (const e of activeEnemies) {

        if (e.hp > 0) this.spatialGrid.insert(e);

    }

    

    // 绘制敌人（使用精灵图和动画）

    for (const e of activeEnemies) {

        if (!this.camera.isVisible(e.x, e.y, 30)) continue;

        // 使用Enemy类的draw方法，传入转换后的坐标

        const pos = this.camera.worldToScreen(e.x, e.y);
        const enemyScreenScale = this.getEntityRenderScale();

        if (this.hd2dRenderer && this.hd2dRenderer.shadow && this.runtimeSettings?.enableHD2D !== false) {
            this.hd2dRenderer.shadow.render(pos.x, pos.y, this.getEntityRenderScale(), {
                roomCenterX: (this.canvas.width || 960) / 2,
                roomCenterY: (this.canvas.height || 960) / 2
            });
        }

        this.ctx.save();

        this.ctx.translate(pos.x, pos.y);

        // 检查 sprites 是否已加载

        if (this.sprites && this.sprites.get) {

            e.drawWithOffset(this.ctx, this.sprites, this.currentFloor, enemyScreenScale);

        }

        this.ctx.restore();

    }

    this.drawBossAftermath(this.ctx);
    this.drawBossCombatDialogue(this.getOverlayDrawContext());
    
    // v0.18.0: 碰撞体积调试显示 - 圆形（旧系统）
    // v0.32: 添加矩形碰撞箱调试显示（新系统）
    if (this.showHitboxDebug) {
        // 使用 CollisionSystem 的矩形碰撞箱调试
        if (window.collisionSystem) {
            // 玩家碰撞箱
            const playerPos = this.camera.worldToScreen(this.player.x, this.player.y);
            window.collisionSystem.renderDebug(this.ctx, {...this.player, x: playerPos.x, y: playerPos.y}, '#0f0');
            
            // 敌人碰撞箱
            for (const e of activeEnemies) {
                if (e.hp <= 0) continue;
                const pos = this.camera.worldToScreen(e.x, e.y);
                window.collisionSystem.renderDebug(this.ctx, {...e, x: pos.x, y: pos.y}, '#f00');
            }

            // 商店NPC/桌台碰撞箱
            if (this.curRoom && this.curRoom.type === 'shop' && this.curRoom.npc) {
                const npc = this.curRoom.npc;
                const pos = this.camera.worldToScreen(npc.x, npc.y);
                window.collisionSystem.renderDebug(this.ctx, { ...npc, x: pos.x, y: pos.y }, '#c6f');
            }
        }
    }

    

    // 绘制NPC (v0.9.5 - 商人放大1.5倍)
    if (this.curRoom && this.curRoom.type === 'shop' && this.curRoom.npc) {
        const npc = this.curRoom.npc;
        if (this.camera.isVisible(npc.x, npc.y, 60)) {
            const pos = this.camera.worldToScreen(npc.x, npc.y);
            const d = dist(this.player.x, this.player.y, npc.x, npc.y);
            
            // v0.30-iter4: 使用 SpriteData 绘制 NPC
            const npcSprite = this.sprites.get('npc_shopkeeper');
            if (npcSprite) {
                const npcSize = 72 * this.getEntityRenderScale();
                let drawW = npcSize * 2;
                let drawH = npcSize * 2;
                let drawX = pos.x - npcSize;
                let drawY = pos.y - npcSize;
                
                // 尝试获取 SpriteData
                const npcSpriteData = this.spriteDataRegistry ? 
                    this.spriteDataRegistry.get('npc_shopkeeper') : null;
                
                if (npcSpriteData) {
                    const modelRatio = npcSpriteData.modelWidth / npcSpriteData.modelHeight;
                    
                    if (modelRatio > 1) {
                        drawW = npcSize * 2;
                        drawH = (npcSize * 2) / modelRatio;
                    } else {
                        drawH = npcSize * 2;
                        drawW = (npcSize * 2) * modelRatio;
                    }
                    
                    // 用 center 锚点绘制，让图片中心对准传入坐标
                    const anchor = npcSpriteData.anchor.center;
                    drawX = pos.x - drawW * (anchor.x / npcSpriteData.canvasWidth);
                    drawY = pos.y - drawH * (anchor.y / npcSpriteData.canvasHeight);
                }

                const renderData = this.getShopkeeperRenderData(pos, npcSprite, drawX, drawY, drawW, drawH);
                this.shopkeeperPresentationData = renderData;
                this.drawShopkeeperInScene(renderData);
            } else {
                // 回退到简单绘制（也放大4倍）
                this.ctx.fillStyle = '#4a4';
                this.ctx.beginPath();
                this.ctx.arc(pos.x, pos.y, 60, 0, Math.PI * 2); // 30->60
                this.ctx.fill();
                this.ctx.font = '96px ZCOOL KuaiLe Local'; // 24->96
                this.ctx.textAlign = 'center';
                this.ctx.fillText('\ud83e\uddaf', pos.x, pos.y + 32);
                this.shopkeeperPresentationData = null;
            }
            
            // 交互提示：使用气泡提示，不再在canvas上绘制文字
        }
    }

    

    // 玩家屏幕坐标

    const playerScreen = this.camera.worldToScreen(this.player.x, this.player.y);
    const entityScale = this.getEntityRenderScale();

    

    // 绘制冲刺残影 - 使用玩家精灵图（v0.20.0: 修复尺寸和位置，与玩家一致48x48）

    for (const trail of this.player.dashTrail) {

        const trailScreen = this.camera.worldToScreen(trail.x, trail.y);

        const trailSprite = this.sprites.get(trail.spriteName || ('player_' + trail.frame));

        

        if (trailSprite) {

            this.ctx.save();

            this.ctx.globalAlpha = trail.alpha;

            this.ctx.translate(trailScreen.x, trailScreen.y);

            

            // 面向方向翻转

            if (!trail.facingRight) this.ctx.scale(-1, 1);

            
            // v0.20.0: 修复尺寸为48x48，与玩家一致，脚底对齐
            const trailSize = 48 * entityScale;
            this.ctx.drawImage(trailSprite, -trailSize / 2, -trailSize, trailSize, trailSize);

            

            this.ctx.restore();

        }

    }

    this.ctx.globalAlpha = 1;

    // 绘制玩家（带动画）

    // 计算行走动画

    if (this.player.isMoving && !this.player.isDashing) {

        this.player.walkCycle = (this.player.walkCycle || 0) + 0.15;

    } else {

        this.player.walkCycle = 0;

    }

    

    const walkPhase = Math.sin(this.player.walkCycle);

    const walkBob = this.player.isMoving ? Math.abs(Math.sin(this.player.walkCycle * 0.5)) * -4 : 0; // 行走时的上下颠簸，静止时无

    const wobble = this.player.isMoving ? walkPhase * 3 : 0; // 左右轻微摇摆

    const breathY = this.player.isMoving ? 0 : Math.sin(Date.now() * 0.008) * -1.2; // 静止时轻微呼吸起伏

    

    this.updatePlayerIdleAnimations();

    

    const totalScreenY = playerScreen.y + (this.player.jumpY || 0) + walkBob;

    

    const currentPlayerSpriteName = this.getCurrentPlayerSpriteName();
    const playerSprite = this.sprites.get(currentPlayerSpriteName);

    if (this.hd2dRenderer && this.runtimeSettings?.enableHD2D !== false) {
        this.hd2dRenderer.renderPlayerBacklight(this.player, playerScreen.x, totalScreenY, entityScale);
    }

    this.ctx.save();
    
    // v0.18.3: 辉耀超武让玩家周身发金光
    const hasSolarRadiance = this.weapons?.some(w => w.baseKey === 'solar_radiance');
    if (hasSolarRadiance) {
        const time = Date.now() / 1000;
        const pulse = Math.sin(time * 3) * 0.3 + 0.7;
        this.ctx.shadowBlur = 30 * pulse;
        this.ctx.shadowColor = 'rgba(255, 200, 50, 0.8)';
    }
    
    this.ctx.translate(playerScreen.x, totalScreenY);

    

    // 面向方向翻转

    if (!this.player.facingRight) this.ctx.scale(-1, 1);

    

    // 行走时的身体倾斜

    if (this.player.isMoving && !this.player.isDashing) {

        this.ctx.rotate(walkPhase * 0.05);

    }

    
    // v0.33: 简化玩家渲染 - 贴图已裁剪，直接绘制
    if (playerSprite) {
        const playerSpriteData = this.player.spriteData;
        const targetHeight = (this.player.size || 40) * entityScale;
        if (playerSpriteData) {
            const bounds = playerSpriteData.bounds;
            const scale = targetHeight / bounds.height;
            
            const drawW = bounds.width * scale;
            const drawH = bounds.height * scale;
            
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.26)';
            this.ctx.shadowBlur = 5 * entityScale;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 1 * entityScale;

            // 脚底对齐，居中绘制
            const __drawPlayerSprite = () => this.ctx.drawImage(playerSprite, -drawW/2, -drawH, drawW, drawH);
            this.withEntityBrightness(__drawPlayerSprite, 1, 'player');
            this.ctx.shadowBlur = 0;
        } else {
            // 回退：固定尺寸
            const fallbackSize = targetHeight;
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.26)';
            this.ctx.shadowBlur = 5 * entityScale;
            this.ctx.shadowOffsetX = 0;
            this.ctx.shadowOffsetY = 1 * entityScale;
            const __drawFallbackPlayerSprite = () => this.ctx.drawImage(playerSprite, -fallbackSize / 2, -fallbackSize, fallbackSize, fallbackSize);
            this.withEntityBrightness(__drawFallbackPlayerSprite, 1, 'player');
            this.ctx.shadowBlur = 0;
        }
    } else {
        // 程序化绘制牛牛
        const offsetY = 15;  // 椭圆半径15，脚底对齐
        const bodyY = breathY + walkBob * 0.5 - offsetY;
        
        this.ctx.fillStyle = '#e8e8e8';
        this.ctx.beginPath();
        this.ctx.ellipse(0, bodyY, 20, 15, 0, 0, Math.PI * 2);
        this.ctx.fill();
        
        const headBob = Math.sin(this.player.walkCycle * 0.5) * 2;
        this.ctx.fillStyle = '#333';
        this.ctx.beginPath();
        this.ctx.arc(20, -12 + bodyY + headBob, 3, 0, Math.PI * 2);
        this.ctx.fill();
        
        // 牛角

        this.ctx.fillStyle = '#666';

        this.ctx.beginPath();

        this.ctx.moveTo(15, -25 + bodyY);

        this.ctx.lineTo(20, -35 + bodyY);

        this.ctx.lineTo(25, -25 + bodyY);

        this.ctx.fill();

    }

    

    // 绘制冲刺CD条（脚下）- v0.20.0: 修复位置，适应新的玩家模型大小

    if (this.player.dashCooldown > 0) {

        const barWidth = 32;  // v0.20.0: 稍微缩小匹配玩家宽度

        const barHeight = 4;

        const barY = 8; // v0.20.0: 调整位置到玩家脚下（原来38太偏下）

        const progress = 1 - (this.player.dashCooldown / 1.5); // CD进度

        

        // 背景条（灰色）

        this.ctx.fillStyle = 'rgba(100, 100, 100, 0.5)';

        this.ctx.fillRect(-barWidth/2, barY, barWidth, barHeight);

        

        // 进度条（青色渐变）

        const gradient = this.ctx.createLinearGradient(-barWidth/2, 0, barWidth/2, 0);

        gradient.addColorStop(0, '#00ffff');

        gradient.addColorStop(1, '#00cccc');

        this.ctx.fillStyle = gradient;

        this.ctx.fillRect(-barWidth/2, barY, barWidth * progress, barHeight);

        

        // 边框

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';

        this.ctx.lineWidth = 1;

        this.ctx.strokeRect(-barWidth/2, barY, barWidth, barHeight);

    }

    

    this.ctx.restore();

    

    // v0.22: 绘制宠物（在玩家之后，敌人之前）
    if (this.petManager) {
        this.petManager.render(this.ctx, this.camera, this.sprites);
    }

    

    // 冲刺特效

    if (this.player.isDashing) {

        this.ctx.strokeStyle = 'rgba(100, 200, 255, 0.6)';

        this.ctx.lineWidth = 2;

        const dir = this.player.facingRight ? 1 : -1;

        for (let i = 0; i < 3; i++) {

            const offset = (Date.now() / 30 + i * 15) % 25;

            this.ctx.beginPath();

            this.ctx.moveTo(playerScreen.x - dir * (15 + offset), totalScreenY - 10 + i * 8);

            this.ctx.lineTo(playerScreen.x - dir * (25 + offset), totalScreenY - 10 + i * 8);

            this.ctx.stroke();

        }

    }

    

    this.particles.draw(this.ctx, this.camera);

    // v0.15.0 - 绘制闪电效果
    if (this.lightningEffects) {
        this.ctx.save();
        for (let i = this.lightningEffects.length - 1; i >= 0; i--) {
            const eff = this.lightningEffects[i];
            eff.life -= 0.016;
            if (eff.life <= 0) {
                this.lightningEffects.splice(i, 1);
                continue;
            }
            const start = this.camera.worldToScreen(eff.x1, eff.y1);
            const end = this.camera.worldToScreen(eff.x2, eff.y2);
            const color = eff.color || '#ffff00';
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = 3;
            this.ctx.shadowBlur = 15;
            this.ctx.shadowColor = color;
            // 绘制锯齿形闪电
            this.ctx.beginPath();
            this.ctx.moveTo(start.x, start.y);
            const segments = 5;
            for (let j = 1; j < segments; j++) {
                const t = j / segments;
                const lx = start.x + (end.x - start.x) * t + (Math.random() - 0.5) * 20;
                const ly = start.y + (end.y - start.y) * t + (Math.random() - 0.5) * 20;
                this.ctx.lineTo(lx, ly);
            }
            this.ctx.lineTo(end.x, end.y);
            this.ctx.stroke();

            this.ctx.lineWidth = 1.4;
            this.ctx.shadowBlur = 0;
            this.ctx.strokeStyle = 'rgba(255,255,255,0.92)';
            this.ctx.stroke();
        }
        this.ctx.restore();
    }
    
    // v0.22 - 绘制宠物激光效果（硫磺火等）
    if (this.petLaserEffects) {
        this.ctx.save();
        for (let i = this.petLaserEffects.length - 1; i >= 0; i--) {
            const laser = this.petLaserEffects[i];
            this.syncPetLaserEffect(laser);
            laser.life -= 0.016;
            if (laser.life <= 0) {
                this.petLaserEffects.splice(i, 1);
                continue;
            }
            
            const start = this.camera.worldToScreen(laser.x1, laser.y1);
            const end = this.camera.worldToScreen(laser.x2, laser.y2);
            
            const alpha = laser.life / laser.maxLife;
            const width = laser.width * (0.8 + alpha * 0.4); // 脉冲效果
            
            // 外发光
            this.ctx.shadowBlur = 20;
            this.ctx.shadowColor = laser.color;
            
            // 激光主体
            this.ctx.strokeStyle = laser.color;
            this.ctx.lineWidth = width;
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
            this.ctx.moveTo(start.x, start.y);
            this.ctx.lineTo(end.x, end.y);
            this.ctx.stroke();
            
            // 内部核心（更亮更细）
            this.ctx.shadowBlur = 0;
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = width * 0.4;
            this.ctx.beginPath();
            this.ctx.moveTo(start.x, start.y);
            this.ctx.lineTo(end.x, end.y);
            this.ctx.stroke();
        }
        this.ctx.restore();
    }

    this.damageNumbers.draw(this.ctx, this.camera);

    if (this.curRoom && typeof this.curRoom.drawLayer1ForegroundOcclusion === 'function') {
        this.curRoom.drawLayer1ForegroundOcclusion(this.ctx, this.camera);
    }

    for (const b of deferredForegroundBullets) {
        const pos = this.camera.worldToScreen(b.x, b.y);
        const bulletZoom = this.getEntityRenderScale();
        this.weaponVisuals.drawBullet(b, pos.x, pos.y, bulletZoom);

        if (this.showHitboxDebug) {
            const debugShape = this.getBulletDebugCollision(b);
            if (debugShape?.kind === 'arc') {
                this.drawDebugArc(
                    pos.x,
                    pos.y,
                    debugShape.radius * this.camera.zoom,
                    debugShape.angle || 0,
                    debugShape.arcAngle || 90,
                    debugShape.color,
                    debugShape.label
                );
            } else if (debugShape?.kind === 'circle') {
                this.drawDebugCircle(
                    pos.x,
                    pos.y,
                    debugShape.radius * this.camera.zoom,
                    debugShape.color,
                    debugShape.label
                );
            }
        }
    }

    

    if (this.transition.active) {
        const alpha = Math.sin(this.transition.timer / 0.3 * Math.PI);
        this.ctx.fillStyle = `rgba(0,0,0,${alpha})`;
        // 使用 canvas 实际尺寸
        const cw = this.canvas.width || 800;
        const ch = this.canvas.height || 800;
        this.ctx.fillRect(0, 0, cw, ch);
    }

    

    // 恢复上下文

    this.ctx.restore();

    const hd2dEnabled = !this.runtimeSettings || this.runtimeSettings.enableHD2D !== false;
    const dynamicLightingEnabled = hd2dEnabled &&
        (!this.runtimeSettings || this.runtimeSettings.enableDynamicLighting !== false);
    const floor7FullBright = this.isFloor7FullBrightnessActive();
    const floor7AwakeningHiddenLightMode = Number(this.curRoom?.floor) === 7
        && this.curRoom?.floor7Role === 'awakening'
        && !floor7FullBright;

    // v0.24: HD-2D洞穴效果渲染（氛围+光源）
    if (this.hd2dRenderer && hd2dEnabled) {
        this.hd2dRenderer.render(this.ctx, this.player, this.camera);
    }
    
    // v0.32: 简化光照系统（multiply混合，会覆盖部分效果）
    if (!floor7FullBright && !floor7AwakeningHiddenLightMode && this.lighting && this.lighting.enabled && dynamicLightingEnabled) {
        if (this.lighting.lights.length > 0 && this.player) {
            this.lighting.lights[0].x = this.player.x;
            this.lighting.lights[0].y = this.player.y;
        }
        this.lighting.render();
    }
    
    const runtimeGameBrightness = Number(this.runtimeSettings?.gameBrightness);
    if (Number.isFinite(runtimeGameBrightness) && Math.abs(runtimeGameBrightness - 1) > 0.001) {
        this.ctx.save();
        if (typeof this.ctx.resetTransform === 'function') {
            this.ctx.resetTransform();
        } else {
            this.ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
        if (runtimeGameBrightness > 1) {
            const brightenAlpha = Math.min(0.36, (runtimeGameBrightness - 1) * 0.52);
            if (brightenAlpha > 0.001) {
                this.ctx.globalCompositeOperation = 'screen';
                this.ctx.fillStyle = `rgba(255,255,255,${brightenAlpha})`;
                this.ctx.fillRect(0, 0, canvasW, canvasH);
            }
        } else {
            const channel = Math.max(0, Math.min(255, Math.round(runtimeGameBrightness * 255)));
            this.ctx.globalCompositeOperation = 'multiply';
            this.ctx.fillStyle = `rgb(${channel},${channel},${channel})`;
            this.ctx.fillRect(0, 0, canvasW, canvasH);
        }
        this.ctx.restore();
    }

    // 恢复旧版后处理入口，优先兼容曾经明显可见的景深链
    if (!floor7FullBright && this.hd2dRenderer && this.player && hd2dEnabled) {
        const screenPos = this.camera.worldToScreen(this.player.x, this.player.y);
        if (typeof this.hd2dRenderer.renderPostProcess === 'function') {
            this.hd2dRenderer.renderPostProcess(screenPos.x, screenPos.y);
        } else if (typeof this.hd2dRenderer.renderFinalPostProcess === 'function') {
            this.hd2dRenderer.renderFinalPostProcess(screenPos.x, screenPos.y);
        }
    }

    if (this.curRoom && typeof this.curRoom.drawDoorLightBeams === 'function') {
        const viewLeft = this.camera.x - this.camera.viewWidth / 2;
        const viewTop = this.camera.y - this.camera.viewHeight / 2;
        const viewRight = viewLeft + this.camera.viewWidth;
        const viewBottom = viewTop + this.camera.viewHeight;
        this.curRoom.drawDoorLightBeams(
            this.ctx,
            this.camera,
            this.curRoom.getDoorPositions(),
            viewLeft,
            viewTop,
            viewRight,
            viewBottom
        );
    }

    // 滤镜之后再绘制 HUD 和交互弹窗，保证它们永远位于后处理上层
    this.renderOverlayUI();
    
},



getShopkeeperCandleLightMetrics(drawX, drawY, drawW, drawH) {
    return {
        // 紫蜡烛位于桌子的前侧拐角，不在盲眼头部附近
        flameX: drawX + drawW * 0.495,
        flameY: drawY + drawH * 0.59,
        groundX: drawX + drawW * 0.495,
        groundY: drawY + drawH * 0.89,
        scale: Math.max(0.85, drawH / 144)
    };
},



getShopkeeperRenderData(pos, npcSprite, drawX, drawY, drawW, drawH) {
    return {
        pos,
        npcSprite,
        drawX,
        drawY,
        drawW,
        drawH,
        candleLight: this.getShopkeeperCandleLightMetrics(drawX, drawY, drawW, drawH)
    };
},



drawShopkeeperCandleLight(light, layer = 'back') {
    if (!light) return;
    const ctx = this.ctx;
    const { flameX, flameY, groundX, groundY, scale } = light;
    const time = Date.now() / 1000;
    const flicker = Math.sin(time * 2.7) * 0.5 + Math.sin(time * 5.3) * 0.25;
    const flameLift = Math.sin(time * 4.8) * 1.6 * scale;
    const isBackLayer = layer === 'back';

    ctx.save();

    if (isBackLayer) {
        ctx.globalCompositeOperation = 'screen';
        const baseGlow = ctx.createRadialGradient(
            groundX, groundY, 0,
            groundX, groundY, 34 * scale
        );
        baseGlow.addColorStop(0, `rgba(210, 155, 255, ${0.18 + flicker * 0.03})`);
        baseGlow.addColorStop(0.55, `rgba(140, 82, 220, ${0.1 + flicker * 0.02})`);
        baseGlow.addColorStop(1, 'rgba(52, 18, 92, 0)');
        ctx.fillStyle = baseGlow;
        ctx.beginPath();
        ctx.ellipse(groundX, groundY, 24 * scale, 12 * scale, -0.14, 0, Math.PI * 2);
        ctx.fill();
    } else {
        ctx.globalCompositeOperation = 'source-over';
        this.drawShopkeeperCandleFlame(flameX, flameY + flameLift, scale, flicker, false);

        ctx.globalCompositeOperation = 'screen';
        const tintGradient = ctx.createRadialGradient(
            flameX + 6 * scale, flameY + 8 * scale, 0,
            flameX + 6 * scale, flameY + 8 * scale, 20 * scale
        );
        tintGradient.addColorStop(0, 'rgba(236, 204, 255, 0.22)');
        tintGradient.addColorStop(0.5, 'rgba(176, 102, 255, 0.12)');
        tintGradient.addColorStop(1, 'rgba(76, 24, 116, 0)');
        ctx.fillStyle = tintGradient;
        ctx.beginPath();
        ctx.arc(flameX + 6 * scale, flameY + 8 * scale, 20 * scale, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.restore();
},



drawShopkeeperCandleFlame(x, y, scale, flicker, isPresentation = false) {
    const sway = Math.sin(Date.now() / 240) * 1.1 * scale;
    const mainHeight = (isPresentation ? 10.8 : 9.2) * scale;
    const mainWidth = (isPresentation ? 5.8 : 4.9) * scale;

    this.ctx.save();
    this.ctx.shadowBlur = (isPresentation ? 18 : 14) * scale;
    this.ctx.shadowColor = `rgba(166, 92, 255, ${0.72 + flicker * 0.1})`;

    this.ctx.fillStyle = `rgba(116, 54, 214, ${0.96 + flicker * 0.02})`;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y - mainHeight);
    this.ctx.quadraticCurveTo(x + mainWidth, y - mainHeight * 0.38, x + mainWidth * 0.55 + sway, y + mainHeight * 0.18);
    this.ctx.quadraticCurveTo(x, y + mainHeight * 0.55, x - mainWidth * 0.7, y + mainHeight * 0.18);
    this.ctx.quadraticCurveTo(x - mainWidth, y - mainHeight * 0.32, x, y - mainHeight);
    this.ctx.fill();

    this.ctx.fillStyle = `rgba(214, 150, 255, ${0.92 + flicker * 0.03})`;
    this.ctx.beginPath();
    this.ctx.moveTo(x + 0.4 * scale, y - mainHeight * 0.68);
    this.ctx.quadraticCurveTo(x + mainWidth * 0.52, y - mainHeight * 0.18, x + mainWidth * 0.25 + sway * 0.4, y + mainHeight * 0.1);
    this.ctx.quadraticCurveTo(x, y + mainHeight * 0.28, x - mainWidth * 0.36, y);
    this.ctx.quadraticCurveTo(x - mainWidth * 0.42, y - mainHeight * 0.26, x + 0.4 * scale, y - mainHeight * 0.68);
    this.ctx.fill();

    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = 'rgba(228, 242, 255, 0.98)';
    this.ctx.beginPath();
    this.ctx.arc(x + 0.4 * scale, y - mainHeight * 0.3, 1.2 * scale, 0, Math.PI * 2);
    this.ctx.fill();

    const sparkAlpha = isPresentation ? 0.82 : 0.62;
    for (let i = 0; i < 3; i++) {
        const t = Date.now() / 1000 + i * 0.73;
        const px = x + Math.sin(t * (1.6 + i * 0.35)) * (2.4 + i) * scale;
        const py = y - mainHeight - 2 * scale - ((t * 12 + i * 9) % (10 * scale));
        const radius = (i === 0 ? 1.3 : 0.9) * scale;
        this.ctx.fillStyle = i === 0
            ? `rgba(226, 184, 255, ${sparkAlpha})`
            : `rgba(184, 110, 255, ${sparkAlpha * 0.78})`;
        this.ctx.beginPath();
        this.ctx.arc(px, py, radius, 0, Math.PI * 2);
        this.ctx.fill();
    }

    this.ctx.restore();
},



drawShopkeeperInScene(renderData) {
    if (!renderData) return;
    this.withEntityBrightness(() => {
        this.ctx.drawImage(renderData.npcSprite, renderData.drawX, renderData.drawY, renderData.drawW, renderData.drawH);
    }, 1, 'prop');
    this.drawShopkeeperCandleLight(renderData.candleLight, 'front');
},



renderOverlayUI() {
    this.clearOverlayLayer();
    this.overlayHitRegions = {};
    this.pauseButtons = null;
    this.resultBtnRect = null;
    this.weaponVisuals?.renderPresentationEmissives?.(Date.now() / 1000);
    // 更新侧边面板
    this.updateSidePanels();
    this.drawUI();

    // v0.22: UI窗口按活动状态排序绘制，活动的窗口在最上层
    const uiWindows = [];
    if (this.shopOpen) uiWindows.push({ type: 'shop', draw: () => this.drawShopUI() });
    if (this.levelUpOpen) uiWindows.push({ type: 'levelUp', draw: () => this.drawLevelUpUI() });
    if (this.chestOpen) uiWindows.push({ type: 'chest', draw: () => this.drawChestSelectUI() });
    if (this.weaponBoxOpen) uiWindows.push({ type: 'weaponBox', draw: () => this.drawWeaponBoxUI() });

    uiWindows.sort((a, b) => {
        if (a.type === this.activeUIWindow) return 1;
        if (b.type === this.activeUIWindow) return -1;
        return 0;
    });

    uiWindows.forEach(ui => ui.draw());

    if (this.bossChestLottery && this.bossChestLottery.active) {
        this.drawBossChestLottery(this.getOverlayDrawContext());
    }

    GameRenderBridge.drawCinematicLetterbox.call(this, this.getOverlayDrawContext());
    this.drawBossDialogueSequence(this.getOverlayDrawContext());
    this.floor7AwakeningSystem?.drawOverlay?.(this.getOverlayDrawContext());
    this.cinematicSubtitle?.draw?.(this.getOverlayDrawContext());
    if (this.paused && !this.hasBlockingOverlayOpen() && !this.floorTransitionState?.active) {
        this.drawPauseScreen();
    }
},





drawShopUI() {
    return this.overlayCanvasRenderer.drawShopUI();
},


drawChestSelectUI() {
    return this.overlayCanvasRenderer.drawChestSelectUI();
},


drawWeaponBoxUI() {
    return this.overlayCanvasRenderer.drawWeaponBoxUI();
},



drawLevelUpUI() {
    return this.overlayCanvasRenderer.drawLevelUpUI();
},





drawUI() {
    // v0.22: 制作人员名单播放中
    if (this.credits && this.credits.active) {
        this.drawCredits(this.ctx);
        return;
    }

    // 游戏结算画面

    if (this.showResultScreen && this.gameResultData) {

        this.drawResultScreen();

        return;

    }

    

    // 游戏结束/胜利触发（重启期间跳过）

    if (this.isRestarting) {

        // v0.17.2: 移除调试日志
        // console.log(`⚡ drawUI跳过: isRestarting=true, state=${this.state}`);

        return;

    }

    

    if (this.state === 'gameover' && this.scoreManager.isPlaying) {

        this.endGame('dead');

    }

    // v0.22: 原有的victory状态处理已移至startVictorySequence
    // 如果制作名单正在播放，不触发原来的结束流程
    if (this.state === 'victory' && this.scoreManager.isPlaying && !(this.credits && this.credits.active)) {
        this.audio.playBGM('victory');
        this.endGame('cleared');
    }

},


drawResultScreen() {
    return this.overlayCanvasRenderer.drawResultScreen();
},



drawBossCombatDialogue(ctx = this.getOverlayDrawContext()) {
    const state = this.bossCombatDialogueState;
    if (!ctx || !state?.active || !state.currentLine || state.lineTime <= 0 || !state.bossRef) return;
    const boss = state.bossRef;
    const bossHead = this.getDialogueHeadAnchor(boss, { x: boss.x, y: boss.cy || boss.y });
    const anchor = this.toOverlayPoint(bossHead.x, bossHead.y);
    const alpha = Math.max(0, Math.min(1, state.lineTime / 0.18, (state.lineDuration - state.lineTime) / 0.28));
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.font = '13px Arial';
    const fullText = state.currentFullLine || state.currentLine;
    const textW = ctx.measureText(fullText).width;
    const padX = 10;
    const w = Math.max(104, Math.min(220, textW + padX * 2));
    const h = 24;
    const viewW = this.overlayCanvas?.width || this.canvas.width;
    const x = Math.max(12, Math.min(viewW - w - 12, anchor.x - w * 0.5));
    const y = Math.max(8, anchor.y - h - 6);
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    ctx.strokeStyle = 'rgba(255,255,255,0.10)';
    ctx.lineWidth = 1.2;
    const radius = 6;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + w, y, x + w, y + h, radius);
    ctx.arcTo(x + w, y + h, x, y + h, radius);
    ctx.arcTo(x, y + h, x, y, radius);
    ctx.arcTo(x, y, x + w, y, radius);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(245,245,245,0.96)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(state.currentLine, x + w * 0.5, y + h * 0.53);
    ctx.restore();
}
    };

    global.GameRenderBridge = GameRenderBridge;
})(window);
