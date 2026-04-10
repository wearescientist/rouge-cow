(function attachRoomPresentationMixin(global) {
    'use strict';

    if (!global.Room) return;
    const Room = global.Room;

    const methods = {



drawFloor7BossTotem(ctx, camera, sprites, time = Date.now() / 1000) {
    if (this.floor !== 7 || this.type !== 'boss' || !this.trueEndingBossTotem) return;
    const totem = this.trueEndingBossTotem;
    if (totem.absorbed) return;

    const pos = camera.worldToScreen(totem.x, totem.y);
    const spriteName = totem.state === 'absorbing'
        ? 'totem_attack'
        : (totem.state === 'spent' ? 'totem_speed' : 'totem_defense');
    const sprite = sprites ? sprites.get(spriteName) : null;
    const basePulse = 0.72 + Math.sin(time * 2.6 + (totem.pulseSeed || 0) * 7) * 0.18;
    const haloRadius = totem.state === 'absorbing' ? 120 : 90;

    ctx.save();
    const halo = ctx.createRadialGradient(pos.x, pos.y + 14, 0, pos.x, pos.y + 14, haloRadius);
    halo.addColorStop(0, `rgba(150, 220, 255, ${0.26 * basePulse})`);
    halo.addColorStop(0.45, `rgba(96, 150, 255, ${0.18 * basePulse})`);
    halo.addColorStop(1, 'rgba(20, 25, 40, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(pos.x, pos.y + 14, haloRadius, 0, Math.PI * 2);
    ctx.fill();

    if (sprite) {
        const size = totem.state === 'absorbing' ? 118 : 96;
        ctx.globalAlpha = totem.state === 'spent' ? 0.45 : 0.92;
        ctx.drawImage(sprite, pos.x - size / 2, pos.y - size * 0.78, size, size);
    }

    if (totem.state === 'absorbing') {
        const enemies = this.getActiveEnemies ? this.getActiveEnemies() : this.enemies;
        const boss = (enemies || []).find(enemy => enemy && enemy.isBoss && enemy.hp > 0);
        if (boss) {
            const bossPos = camera.worldToScreen(boss.x, boss.cy || boss.y);
            ctx.globalAlpha = 0.8;
            ctx.strokeStyle = 'rgba(186, 240, 255, 0.72)';
            ctx.lineWidth = 6;
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y - 18);
            ctx.lineTo(bossPos.x, bossPos.y - 10);
            ctx.stroke();
        }
    }
    ctx.restore();
},



getRoomFloorScreenRect(camera) {
    if (!camera || typeof camera.worldToScreen !== 'function') {
        return { x: 0, y: 0, width: this.width, height: this.height, cx: this.width / 2, cy: this.height / 2 };
    }
    const wallT = SURVIVOR_CONFIG.WALL_THICKNESS;
    const tl = camera.worldToScreen(wallT, wallT);
    const br = camera.worldToScreen(this.width - wallT, this.height - wallT);
    if (!tl || !br || !Number.isFinite(tl.x) || !Number.isFinite(tl.y) || !Number.isFinite(br.x) || !Number.isFinite(br.y)) {
        return { x: 0, y: 0, width: this.width, height: this.height, cx: this.width / 2, cy: this.height / 2 };
    }
    return {
        x: tl.x,
        y: tl.y,
        width: br.x - tl.x,
        height: br.y - tl.y,
        cx: (tl.x + br.x) / 2,
        cy: (tl.y + br.y) / 2
    };
},


getCinematicRoomPalette() {
    const palettes = {
        1: { shadow: 'rgba(12, 12, 12, 0.48)', sideShadow: 'rgba(18, 18, 16, 0.30)', haze: 'rgba(226, 220, 208, 0.050)', centerLift: 'rgba(241, 236, 223, 0.085)', warmLift: 'rgba(210, 196, 170, 0.040)' },
        2: { shadow: 'rgba(10, 18, 6, 0.48)', sideShadow: 'rgba(42, 58, 22, 0.26)', haze: 'rgba(170, 206, 96, 0.066)', centerLift: 'rgba(226, 238, 166, 0.092)', warmLift: 'rgba(198, 214, 120, 0.046)' },
        3: { shadow: 'rgba(18, 8, 18, 0.50)', sideShadow: 'rgba(86, 44, 102, 0.24)', haze: 'rgba(214, 156, 188, 0.060)', centerLift: 'rgba(236, 196, 226, 0.084)', warmLift: 'rgba(192, 124, 182, 0.038)' },
        4: { shadow: 'rgba(20, 10, 8, 0.46)', sideShadow: 'rgba(126, 70, 34, 0.24)', haze: 'rgba(255, 154, 84, 0.072)', centerLift: 'rgba(255, 212, 148, 0.094)', warmLift: 'rgba(244, 146, 72, 0.046)' },
        5: { shadow: 'rgba(18, 6, 8, 0.50)', sideShadow: 'rgba(126, 52, 60, 0.24)', haze: 'rgba(222, 116, 116, 0.060)', centerLift: 'rgba(244, 204, 202, 0.082)', warmLift: 'rgba(216, 114, 116, 0.040)' },
        6: { shadow: 'rgba(18, 8, 24, 0.56)', sideShadow: 'rgba(92, 54, 146, 0.26)', haze: 'rgba(146, 96, 202, 0.072)', centerLift: 'rgba(232, 214, 164, 0.094)', warmLift: 'rgba(152, 108, 210, 0.046)' },
        7: { shadow: 'rgba(18, 14, 10, 0.42)', sideShadow: 'rgba(120, 94, 46, 0.20)', haze: 'rgba(234, 212, 156, 0.060)', centerLift: 'rgba(248, 234, 184, 0.090)', warmLift: 'rgba(232, 194, 110, 0.038)' }
    };
    return palettes[this.floor] || palettes[1];
},


getCinematicRoomProfile() {
    const hidden = this.type === 'hidden';
    const shop = this.type === 'shop';
    const treasure = this.type === 'treasure';
    const boss = this.type === 'boss';
    const elite = this.type === 'elite';
    const start = this.type === 'start';
    const normal = this.type === 'normal';
    const supported = normal || shop || treasure || boss || elite || start;
    return {
        enabled: supported && !hidden,
        centerLiftAlpha: shop ? 0.090 : (treasure ? 0.100 : (boss ? 0.050 : (elite ? 0.072 : (start ? 0.064 : 0.076)))),
        centerLiftRadius: shop ? 0.44 : (treasure ? 0.40 : (boss ? 0.36 : 0.46)),
        warmLiftAlpha: treasure ? 0.058 : (shop ? 0.050 : (boss ? 0.034 : 0.028)),
        edgeAlpha: boss ? 0.150 : (elite ? 0.118 : (shop ? 0.108 : 0.100)),
        sideBeamAlpha: boss ? 0.080 : (shop ? 0.062 : 0.052),
        topFogAlpha: boss ? 0.058 : 0.044,
        floorHazeAlpha: boss ? 0.050 : (treasure ? 0.056 : 0.046),
        contactShadowAlpha: shop ? 0.24 : (treasure ? 0.22 : 0.18),
        contactShadowBlur: 16,
        contactShadowScale: 1,
        ambientSparkle: normal || elite || start
    };
},


drawCinematicBaseOverlays(ctx, camera, profile, palette) {
    if (!ctx || !camera || !profile?.enabled) return;
    const rect = this.getRoomFloorScreenRect(camera);
    if (!Number.isFinite(rect.width) || !Number.isFinite(rect.height) || rect.width <= 4 || rect.height <= 4) return;

    const radius = Math.max(rect.width, rect.height) * Math.max(0.28, profile.centerLiftRadius || 0.44);
    const solid = (rgba) => rgba.replace(/0\.[0-9]+\)$/,'1)');
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.width, rect.height);
    ctx.clip();

    if ((profile.topFogAlpha || 0) > 0.001) {
        const topFog = ctx.createLinearGradient(rect.cx, rect.y, rect.cx, rect.y + rect.height * 0.38);
        topFog.addColorStop(0, solid(palette.haze));
        topFog.addColorStop(0.42, palette.haze);
        topFog.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.globalAlpha = profile.topFogAlpha;
        ctx.fillStyle = topFog;
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height * 0.44);
    }

    if ((profile.floorHazeAlpha || 0) > 0.001) {
        const lowerHaze = ctx.createLinearGradient(rect.cx, rect.y + rect.height, rect.cx, rect.y + rect.height * 0.56);
        lowerHaze.addColorStop(0, solid(palette.haze));
        lowerHaze.addColorStop(0.36, palette.haze);
        lowerHaze.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.globalAlpha = profile.floorHazeAlpha;
        ctx.fillStyle = lowerHaze;
        ctx.fillRect(rect.x, rect.y + rect.height * 0.46, rect.width, rect.height * 0.54);
    }

    if ((profile.centerLiftAlpha || 0) > 0.001) {
        const lift = ctx.createRadialGradient(rect.cx, rect.cy, 0, rect.cx, rect.cy, radius);
        lift.addColorStop(0, solid(palette.centerLift));
        lift.addColorStop(0.45, palette.centerLift);
        lift.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.globalAlpha = profile.centerLiftAlpha;
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = lift;
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    }

    if ((profile.warmLiftAlpha || 0) > 0.001) {
        const warm = ctx.createRadialGradient(rect.cx, rect.cy + rect.height * 0.08, 0, rect.cx, rect.cy + rect.height * 0.08, radius * 0.78);
        warm.addColorStop(0, solid(palette.warmLift));
        warm.addColorStop(0.55, palette.warmLift);
        warm.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.globalAlpha = profile.warmLiftAlpha;
        ctx.globalCompositeOperation = 'screen';
        ctx.fillStyle = warm;
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height);
    }

    if ((profile.edgeAlpha || 0) > 0.001) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = profile.edgeAlpha;

        const leftGrad = ctx.createLinearGradient(rect.x, rect.y, rect.x + rect.width * 0.18, rect.y);
        leftGrad.addColorStop(0, solid(palette.shadow));
        leftGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = leftGrad;
        ctx.fillRect(rect.x, rect.y, rect.width * 0.20, rect.height);

        const rightGrad = ctx.createLinearGradient(rect.x + rect.width, rect.y, rect.x + rect.width * 0.82, rect.y);
        rightGrad.addColorStop(0, solid(palette.shadow));
        rightGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = rightGrad;
        ctx.fillRect(rect.x + rect.width * 0.80, rect.y, rect.width * 0.20, rect.height);

        const topGrad = ctx.createLinearGradient(rect.x, rect.y, rect.x, rect.y + rect.height * 0.14);
        topGrad.addColorStop(0, solid(palette.shadow));
        topGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = topGrad;
        ctx.fillRect(rect.x, rect.y, rect.width, rect.height * 0.16);

        const bottomGrad = ctx.createLinearGradient(rect.x, rect.y + rect.height, rect.x, rect.y + rect.height * 0.88);
        bottomGrad.addColorStop(0, solid(palette.shadow));
        bottomGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = bottomGrad;
        ctx.fillRect(rect.x, rect.y + rect.height * 0.86, rect.width, rect.height * 0.14);
    }

    if ((profile.sideBeamAlpha || 0) > 0.001) {
        ctx.globalAlpha = profile.sideBeamAlpha;
        const sideW = rect.width * 0.13;
        const beamL = ctx.createLinearGradient(rect.x, rect.y, rect.x + sideW, rect.y);
        beamL.addColorStop(0, solid(palette.sideShadow));
        beamL.addColorStop(0.46, palette.sideShadow);
        beamL.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = beamL;
        ctx.fillRect(rect.x, rect.y + rect.height * 0.08, sideW, rect.height * 0.84);

        const beamR = ctx.createLinearGradient(rect.x + rect.width, rect.y, rect.x + rect.width - sideW, rect.y);
        beamR.addColorStop(0, solid(palette.sideShadow));
        beamR.addColorStop(0.46, palette.sideShadow);
        beamR.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = beamR;
        ctx.fillRect(rect.x + rect.width - sideW, rect.y + rect.height * 0.08, sideW, rect.height * 0.84);
    }

    ctx.restore();
},


drawSoftShadowEllipse(ctx, camera, worldX, worldY, radiusX, radiusY, alpha = 0.18, blur = 14) {
    if (!ctx || !camera || !Number.isFinite(worldX) || !Number.isFinite(worldY)) return;
    const pos = camera.worldToScreen(worldX, worldY);
    const zoom = camera.zoom || 1;
    const rx = Math.max(4, radiusX * zoom);
    const ry = Math.max(2, radiusY * zoom);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
    ctx.filter = `blur(${Math.max(0, blur * zoom * 0.35)}px)`;
    ctx.beginPath();
    ctx.ellipse(pos.x, pos.y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
},


drawCinematicContactShadows(ctx, camera, profile) {
    if (!ctx || !camera || !profile) return;
    const alpha = profile.contactShadowAlpha || 0;
    if (alpha <= 0.001) return;
    const blur = profile.contactShadowBlur || 14;
    const scale = profile.contactShadowScale || 1;

    if (Array.isArray(this.chests) && this.chests.length > 0) {
        this.chests.forEach((chest) => {
            if (!chest || chest.disabled) return;
            this.drawSoftShadowEllipse(ctx, camera, chest.x, chest.y + 12, 16 * scale, 6 * scale, alpha * (chest.opened ? 0.75 : 1), blur);
        });
    } else if (this.chest && !this.chest.disabled) {
        this.drawSoftShadowEllipse(ctx, camera, this.chest.x, this.chest.y + 12, 16 * scale, 6 * scale, alpha, blur);
    }

    if (this.type === 'shop' && this.npc) {
        this.drawSoftShadowEllipse(ctx, camera, this.npc.x, this.npc.y + 30, 28 * scale, 10 * scale, alpha * 1.15, blur + 2);
    }
},


drawAmbientEffects(ctx, camera, sprites, viewLeft, viewTop, viewRight, viewBottom) {

    const center = camera.worldToScreen(this.centerX, this.centerY);

    const time = Date.now() / 1000;
    const cinematicProfile = this.getCinematicRoomProfile();
    const cinematicPalette = this.getCinematicRoomPalette();

    let grad, pulse, sparkle, hiddenPulse, x, y, pos, flicker;

    this.drawCinematicBaseOverlays(ctx, camera, cinematicProfile, cinematicPalette);
    this.drawCinematicContactShadows(ctx, camera, cinematicProfile);

    // Phase 2 rollback: clear the full-scene shell until a stable material pass is ready.

    // 根据房间类型添加不同氛围效果

    switch(this.type) {

        case 'boss':

            // Boss房间 - 脉动红光

            pulse = 0.3 + Math.sin(time * 2) * 0.1;

            grad = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, 400);

            grad.addColorStop(0, `rgba(255, 0, 0, ${pulse})`);

            grad.addColorStop(0.5, `rgba(100, 0, 0, ${pulse * 0.5})`);

            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.fillStyle = grad;

            ctx.fillRect(0, 0, camera.viewWidth, camera.viewHeight);

            this.drawFloor7BossTotem(ctx, camera, sprites, time);

            break;

            

        case 'treasure':
            // 宝箱房 - 金色微光
            sparkle = 0.05 + Math.sin(time * 3) * 0.02;
            grad = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, 220);
            grad.addColorStop(0, `rgba(255, 215, 0, ${sparkle})`);
            grad.addColorStop(0.42, `rgba(255, 215, 0, ${sparkle * 0.42})`);
            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, camera.viewWidth, camera.viewHeight);
            
            if (sprites && Array.isArray(this.chests) && this.chests.length > 0) {
                this.chests.forEach(chest => {
                    if (chest.disabled) return;
                    const pos = camera.worldToScreen(chest.x, chest.y);
                    const chestSpriteName = chest.opened ? 'chest_open' : 'chest_closed';
                    const chestSprite = sprites.get(chestSpriteName);
                    if (chestSprite) {
                        const prevSmoothing = ctx.imageSmoothingEnabled;
                        const drawWidth = 50;
                        const drawHeight = 46;
                        ctx.imageSmoothingEnabled = false;
                        const entityBrightness = getPropEntityBrightness();
                        ctx.save();
                        ctx.filter = `brightness(${entityBrightness})`;
                        ctx.drawImage(chestSprite, pos.x - drawWidth / 2, pos.y - drawHeight / 2, drawWidth, drawHeight);
                        ctx.restore();
                        ctx.imageSmoothingEnabled = prevSmoothing;
                    }
                    if (!chest.opened && window.game && window.game.player) {
                        const d = Math.hypot(window.game.player.x - chest.x, window.game.player.y - chest.y);
                        if (d < 60) {
                            const label = chest.quality === 'legendary' ? '传奇宝箱' : (chest.quality === 'rare' ? '稀有宝箱' : '普通宝箱');
                            ctx.fillStyle = '#4f4';
                            ctx.font = '12px Arial';
                            ctx.textAlign = 'center';
                            ctx.fillText(`按E打开${label}`, pos.x, pos.y - 40);
                        }
                    }
                });
            } else if (sprites && this.chest) {
                const chestSpriteName = this.chest.opened ? 'chest_open' : 'chest_closed';
                const chestSprite = sprites.get(chestSpriteName);
                if (chestSprite) {
                    const pos = camera.worldToScreen(this.chest.x, this.chest.y);
                    const prevSmoothing = ctx.imageSmoothingEnabled;
                    const drawWidth = 50;
                    const drawHeight = 46;
                    ctx.imageSmoothingEnabled = false;
                    const entityBrightness = getPropEntityBrightness();
                    ctx.save();
                    ctx.filter = `brightness(${entityBrightness})`;
                    ctx.drawImage(chestSprite, pos.x - drawWidth / 2, pos.y - drawHeight / 2, drawWidth, drawHeight);
                    ctx.restore();
                    ctx.imageSmoothingEnabled = prevSmoothing;
                }
            }
            break;

            

        case 'shop':
            break;

            

        case 'hidden':

            // 隐藏房 - 紫色诡异光芒

            hiddenPulse = 0.2 + Math.sin(time * 1.5) * 0.08;

            grad = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, 350);

            grad.addColorStop(0, `rgba(148, 0, 211, ${hiddenPulse})`);

            grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

            ctx.fillStyle = grad;

            ctx.fillRect(0, 0, camera.viewWidth, camera.viewHeight);

            break;

            

        default:

            // 隐藏房提示改为 presentation overlay 层绘制，避免被壳层盖住

            // 普通房间 - 稳定的轻颗粒光斑，避免随机闪烁破坏电影感

            if (cinematicProfile.ambientSparkle) {
                const orbitX = Math.sin(time * 0.27 + this.gx * 0.91 + this.gy * 0.43);
                const orbitY = Math.cos(time * 0.22 + this.gx * 0.57 - this.gy * 0.71);
                x = this.centerX + orbitX * this.width * 0.18;
                y = this.centerY + orbitY * this.height * 0.12;
                pos = camera.worldToScreen(x, y);
                const radius = 28 + Math.sin(time * 0.9 + this.floor * 0.6) * 4;
                flicker = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, radius);
                flicker.addColorStop(0, 'rgba(150, 200, 235, 0.08)');
                flicker.addColorStop(0.48, 'rgba(132, 176, 214, 0.035)');
                flicker.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.save();
                ctx.globalCompositeOperation = 'screen';
                ctx.fillStyle = flicker;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

    }

}
    };

    global.RoomPresentationMixin = methods;
    Object.assign(global.Room.prototype, methods);
})(window);
