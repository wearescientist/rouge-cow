/**
 * WeaponVisuals.js - logic-driven weapon visuals
 */

class WeaponVisuals {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;

        this.shadowConfig = {
            enabled: true,
            offsetY: 7,
            scale: 0.75,
            alpha: 0.2,
            blur: 2
        };

        this.glowConfig = {
            enabled: true,
            maxIntensity: 0.7
        };

        this.ambientConfig = {
            enabled: true,
            baseBrightness: 1.0,
            minBrightness: 0.55
        };

        this.projectileSpriteMap = {
            homing: 'bullet_lightning',
            poison_homing: 'bullet_lightning',
            rapid: 'bullet_arrow',
            boomerang: 'bullet_arrow',
            bounce: 'bullet_lightning',
            explode: 'bullet_fireball',
            fan: 'bullet_arrow',
            penetrate: 'bullet_ice',
            orbit_proj: 'bullet_lightning',
            chain: 'bullet_lightning'
        };

        this.weaponSpriteMap = {
            whip: 'weapon_whip',
            scythe: 'weapon_scythe',
            wand: 'weapon_wand',
            knife: 'weapon_knife',
            axe: 'weapon_axe',
            bible: 'weapon_bible',
            fireball: 'weapon_fireball',
            lightning: 'weapon_lightning',
            holy_water: 'weapon_holywater'
        };
    }

    drawBullet(bullet, screenX, screenY, zoom = 1) {
        if (!bullet) return;

        const ctx = this.ctx;
        const time = Date.now() / 1000;

        if (this.shadowConfig.enabled && bullet.type !== 'instant' && bullet.type !== 'laser_beam' && bullet.type !== 'area' && bullet.type !== 'aura') {
            this.drawShadow(bullet, screenX, screenY, zoom);
        }

        if (this.glowConfig.enabled && (bullet.dmg || 0) > 25 && bullet.type !== 'area' && bullet.type !== 'aura') {
            this.drawGlow(bullet, screenX, screenY, zoom);
        }

        let brightness = this.ambientConfig.baseBrightness;
        if (this.ambientConfig.enabled) {
            brightness = this.calculateAmbientBrightness(bullet.x, bullet.y);
        }

        ctx.save();
        ctx.globalAlpha = brightness;
        this.drawBulletByType(bullet, screenX, screenY, zoom, time);
        ctx.restore();
    }

    drawShadow(bullet, screenX, screenY, zoom) {
        const ctx = this.ctx;
        const cfg = this.shadowConfig;
        const size = Math.max(4, (bullet.size || 8) * cfg.scale * zoom);

        ctx.save();
        ctx.translate(screenX, screenY + cfg.offsetY * zoom);
        ctx.scale(1, 0.4);
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0, 0, 0, ${cfg.alpha})`;
        ctx.filter = `blur(${cfg.blur}px)`;
        ctx.fill();
        ctx.restore();
    }

    drawGlow(bullet, screenX, screenY, zoom) {
        const ctx = this.ctx;
        const intensity = Math.min((bullet.dmg || 0) / 70, this.glowConfig.maxIntensity);
        const size = Math.max(8, (bullet.size || 10) * 1.6 * zoom);

        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, size);
        const color = bullet.color || '#ffffff';
        gradient.addColorStop(0, this.hexToRgba(color, intensity));
        gradient.addColorStop(0.5, this.hexToRgba(color, intensity * 0.4));
        gradient.addColorStop(1, 'transparent');
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    calculateAmbientBrightness(x, y) {
        const room = this.game.map?.currentRoom;
        if (!room) return this.ambientConfig.baseBrightness;

        let brightness = this.ambientConfig.baseBrightness;
        const hd2dEnabled = !this.game.runtimeSettings || this.game.runtimeSettings.enableHD2D !== false;
        if (this.game.hd2dRenderer && hd2dEnabled) {
            const centerX = room.centerX || room.width / 2;
            const centerY = room.centerY || room.height / 2;
            const dx = x - centerX;
            const dy = y - centerY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const maxDist = Math.max(room.width || 1, room.height || 1) / 2;
            const vignette = Math.max(0.72, 1 - (dist / Math.max(1, maxDist)) * 0.3);
            brightness *= vignette;
        }

        return Math.max(brightness, this.ambientConfig.minBrightness);
    }

    drawBulletByType(bullet, screenX, screenY, zoom, time) {
        switch (bullet.type) {
            case 'proj':
                this.drawProjectile(bullet, screenX, screenY, zoom, time);
                break;
            case 'melee':
                this.drawMelee(bullet, screenX, screenY, zoom, time);
                break;
            case 'laser_beam':
                this.drawLaser(bullet, screenX, screenY, zoom);
                break;
            case 'area':
            case 'aura':
                this.drawAreaOrAura(bullet, screenX, screenY, zoom, time);
                break;
            default:
                this.drawDefault(bullet, screenX, screenY, zoom);
                break;
        }
    }

    drawProjectile(bullet, screenX, screenY, zoom, time) {
        const ctx = this.ctx;
        const angle = (bullet.vx !== undefined && bullet.vy !== undefined)
            ? Math.atan2(bullet.vy, bullet.vx)
            : 0;
        const baseSize = Math.max(8, bullet.size || 10);
        const scale = bullet.scale || 1;
        const width = baseSize * scale * zoom;
        const height = baseSize * scale * zoom;

        ctx.save();
        ctx.translate(screenX, screenY);

        const style = bullet.renderStyle || 'default';
        if (style === 'knife_throw') {
            this.drawKnifeProjectile(ctx, bullet, width, angle);
        } else if (style === 'axe_spin') {
            this.drawAxeProjectile(ctx, bullet, width, angle, time);
        } else if (style === 'orbit_bible') {
            this.drawBibleProjectile(ctx, bullet, width, time);
        } else if (style === 'cross_bounce') {
            this.drawCrossProjectile(ctx, bullet, width, time);
        } else if (style === 'shuriken') {
            this.drawShurikenProjectile(ctx, bullet, width, time);
        } else if (style === 'fireball') {
            this.drawFireballProjectile(ctx, bullet, width, height, time, angle);
        } else if (style === 'magic_orb') {
            this.drawMagicOrbProjectile(ctx, bullet, width, time, angle);
        } else if (style === 'poison_dart') {
            this.drawPoisonDartProjectile(ctx, bullet, width, angle, time);
        } else if (style === 'icicle') {
            this.drawIcicleProjectile(ctx, bullet, width, angle, time);
        } else {
            if (angle) ctx.rotate(angle);
            const sprite = this.getProjectileSprite(bullet);
            if (sprite) ctx.drawImage(sprite, -width / 2, -height / 2, width, height);
            else this.drawFallbackProjectile(ctx, bullet, width, height);
        }

        ctx.restore();
    }

    drawMelee(bullet, screenX, screenY, zoom, time) {
        const ctx = this.ctx;
        if (this.isHolySwordWeapon(bullet.weaponKey)) {
            this.drawHolySwordMelee(ctx, bullet, screenX, screenY, zoom, time);
            return;
        }
        if (this.isScytheWeapon(bullet.weaponKey)) {
            this.drawScytheMelee(ctx, bullet, screenX, screenY, zoom, time);
            return;
        }
        this.drawGenericMelee(ctx, bullet, screenX, screenY, zoom, time);
    }

    isHolySwordWeapon(weaponKey) {
        return weaponKey === 'whip' || weaponKey === 'blood_whip';
    }

    isScytheWeapon(weaponKey) {
        return weaponKey === 'scythe' || weaponKey === 'death_scythe';
    }

    getMeleeSwingPose(bullet, zoom, options = {}) {
        const baseRange = Math.max(100, bullet.range || options.defaultRange || 140);
        const rangeScale = Math.max(0.9, Math.min(1.9, baseRange / (options.rangeReference || 340)));
        const reachMultiplier = options.reachMultiplier || 0.32;
        const weaponReach = Math.max(
            options.minReach || 28,
            Math.min(baseRange * reachMultiplier, options.maxReach || 240)
        ) * zoom;
        const arcAngle = ((bullet.arcAngle || options.defaultArc || 120) * Math.PI) / 180;
        const baseAngle = bullet.angle || 0;
        const start = baseAngle - arcAngle * 0.5;
        const end = baseAngle + arcAngle * 0.5;
        const lifeWindow = options.lifeWindow || 0.25;
        const lifeRatio = Math.max(0, Math.min(1, (bullet.life || lifeWindow) / lifeWindow));
        const swingT = 1 - lifeRatio;
        const swingAngle = start + (end - start) * swingT;
        const tipX = Math.cos(swingAngle) * weaponReach;
        const tipY = Math.sin(swingAngle) * weaponReach;

        return {
            baseRange,
            rangeScale,
            weaponReach,
            arcAngle,
            lifeRatio,
            swingT,
            swingAngle,
            tipX,
            tipY
        };
    }

    getMeleeHandOffset(swingAngle, rangeScale, zoom, options = {}) {
        const handDistance = (options.handDistance || 14) * rangeScale * zoom;
        const handLift = (options.handLift || 10) * rangeScale * zoom;
        return {
            x: Math.cos(swingAngle) * handDistance,
            y: Math.sin(swingAngle) * handDistance - handLift
        };
    }

    drawHolySwordMelee(ctx, bullet, screenX, screenY, zoom, time) {
        const pose = this.getMeleeSwingPose(bullet, zoom, {
            defaultRange: 336,
            defaultArc: 128,
            rangeReference: 336,
            reachMultiplier: 0.34,
            minReach: 42,
            maxReach: 220
        });
        const sprite = this.game.sprites?.get('weapon_whip');
        const hand = this.getMeleeHandOffset(pose.swingAngle, pose.rangeScale, zoom, {
            handDistance: 12,
            handLift: 12
        });
        const bladeLength = Math.max(78, 124 * pose.rangeScale * zoom);
        const bladeThickness = Math.max(22, 30 * pose.rangeScale * zoom);
        const trailRadius = Math.max(44, pose.weaponReach * 0.96);

        ctx.save();
        ctx.translate(screenX, screenY);
        const trail = ctx.createRadialGradient(hand.x, hand.y, trailRadius * 0.12, hand.x, hand.y, trailRadius * 1.08);
        trail.addColorStop(0, 'rgba(255, 250, 220, 0.14)');
        trail.addColorStop(0.55, 'rgba(255, 225, 120, 0.26)');
        trail.addColorStop(1, 'rgba(255, 210, 110, 0)');
        ctx.strokeStyle = trail;
        ctx.lineWidth = Math.max(10, 15 * pose.rangeScale * zoom);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(hand.x, hand.y, trailRadius, pose.swingAngle - 0.52, pose.swingAngle + 0.1);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 238, 184, 0.72)';
        ctx.lineWidth = Math.max(4, 7 * pose.rangeScale * zoom);
        ctx.beginPath();
        ctx.moveTo(0, -zoom * 6);
        ctx.lineTo(hand.x, hand.y);
        ctx.stroke();

        ctx.save();
        ctx.translate(hand.x, hand.y);
        ctx.rotate(pose.swingAngle + Math.PI * 0.14 + Math.sin((time || 0) * 20) * 0.015);
        if (sprite) {
            ctx.filter = `drop-shadow(0 0 ${Math.max(6, 12 * zoom)}px rgba(255,215,100,0.55))`;
            ctx.drawImage(
                sprite,
                -bladeThickness * 0.28,
                -bladeThickness * 0.5,
                bladeLength,
                bladeThickness
            );
            ctx.filter = 'none';
        }
        ctx.restore();
        ctx.restore();
    }

    drawScytheMelee(ctx, bullet, screenX, screenY, zoom, time) {
        const pose = this.getMeleeSwingPose(bullet, zoom, {
            defaultRange: 364,
            defaultArc: 110,
            rangeReference: 364,
            reachMultiplier: 0.38,
            minReach: 48,
            maxReach: 252
        });
        const sprite = this.game.sprites?.get('weapon_scythe');
        const hand = this.getMeleeHandOffset(pose.swingAngle, pose.rangeScale, zoom, {
            handDistance: 14,
            handLift: 10
        });
        const bladeLength = Math.max(84, 132 * pose.rangeScale * zoom);
        const bladeThickness = Math.max(30, 40 * pose.rangeScale * zoom);
        const trailRadius = Math.max(52, pose.weaponReach);

        ctx.save();
        ctx.translate(screenX, screenY);
        const trail = ctx.createRadialGradient(hand.x, hand.y, trailRadius * 0.16, hand.x, hand.y, trailRadius * 1.14);
        trail.addColorStop(0, 'rgba(220, 210, 255, 0.10)');
        trail.addColorStop(0.56, 'rgba(166, 120, 255, 0.24)');
        trail.addColorStop(1, 'rgba(120, 70, 180, 0)');
        ctx.strokeStyle = trail;
        ctx.lineWidth = Math.max(8, 12 * pose.rangeScale * zoom);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(hand.x, hand.y, trailRadius, pose.swingAngle - 0.36, pose.swingAngle + 0.2);
        ctx.stroke();

        ctx.strokeStyle = 'rgba(208, 200, 255, 0.72)';
        ctx.lineWidth = Math.max(4, 6 * pose.rangeScale * zoom);
        ctx.beginPath();
        ctx.moveTo(0, -zoom * 4);
        ctx.lineTo(hand.x, hand.y);
        ctx.stroke();

        ctx.save();
        ctx.translate(hand.x, hand.y);
        ctx.rotate(pose.swingAngle + Math.PI * 0.18 + Math.sin((time || 0) * 14) * 0.015);
        if (sprite) {
            ctx.filter = `drop-shadow(0 0 ${Math.max(6, 12 * zoom)}px rgba(190,120,255,0.45))`;
            ctx.drawImage(
                sprite,
                -bladeThickness * 0.3,
                -bladeThickness * 0.52,
                bladeLength,
                bladeThickness
            );
            ctx.filter = 'none';
        }
        ctx.restore();
        ctx.restore();
    }

    drawGenericMelee(ctx, bullet, screenX, screenY, zoom, time) {
        const sprite = this.getWeaponSprite(bullet);
        const rangePx = (bullet.range || 100) * 0.42 * zoom;
        const lifeRatio = Math.max(0, Math.min(1, (bullet.life || 0.25) / 0.25));
        const swingAlpha = 0.42 + (1 - lifeRatio) * 0.35;

        ctx.save();
        ctx.translate(screenX, screenY);
        const arcAngle = ((bullet.arcAngle || 90) * Math.PI) / 180;
        const start = (bullet.angle || 0) - arcAngle * 0.5;
        const end = (bullet.angle || 0) + arcAngle * 0.5;

        if (sprite) {
            const swingT = 1 - lifeRatio;
            const weaponAngle = start + (end - start) * swingT;
            const wx = Math.cos(weaponAngle) * rangePx;
            const wy = Math.sin(weaponAngle) * rangePx;
            const size = Math.max(16, 28 * zoom);
            ctx.save();
            ctx.translate(wx, wy);
            ctx.rotate(weaponAngle + Math.PI * 0.5 + Math.sin(time * 24) * 0.03);
            ctx.globalAlpha = 0.78 + swingAlpha * 0.2;
            ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
            ctx.restore();
        }

        ctx.restore();
    }

    drawAreaOrAura(bullet, screenX, screenY, zoom, time) {
        const key = bullet.weaponKey || '';
        const style = bullet.renderStyle || '';
        if (style === 'holy_water_pool' || key === 'holy_water' || key === 'la_borra') {
            this.drawHolyWaterArea(bullet, screenX, screenY, zoom, time);
            return;
        }
        if (style === 'radiance' || key === 'radiance' || key === 'solar_radiance') {
            this.drawRadianceArea(bullet, screenX, screenY, zoom, time);
            return;
        }
        this.drawSoftArea(bullet, screenX, screenY, zoom);
    }

    drawSoftArea(bullet, screenX, screenY, zoom) {
        const ctx = this.ctx;
        const radius = Math.max(20, (bullet.range || 90) * zoom);
        ctx.save();
        ctx.translate(screenX, screenY);
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
        gradient.addColorStop(0, this.hexToRgba(bullet.color || '#ffffff', 0.2));
        gradient.addColorStop(0.55, this.hexToRgba(bullet.color || '#ffffff', 0.12));
        gradient.addColorStop(1, this.hexToRgba(bullet.color || '#ffffff', 0));
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    drawRadianceArea(bullet, screenX, screenY, zoom, time) {
        const ctx = this.ctx;
        const radius = Math.max(28, (bullet.range || 120) * zoom);
        const seed = bullet.visualSeed || 0;
        const seededTime = time + seed * 0.0017;

        ctx.save();
        ctx.translate(screenX, screenY);

        // Natural fill + short edge fade (no visible ring)
        const core = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
        core.addColorStop(0, 'rgba(255, 225, 100, 0.30)');
        core.addColorStop(0.70, 'rgba(255, 190, 55, 0.22)');
        core.addColorStop(0.88, 'rgba(255, 168, 42, 0.16)');
        core.addColorStop(0.97, 'rgba(255, 150, 36, 0.05)');
        core.addColorStop(1, 'rgba(255, 140, 30, 0)');
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fill();

        const sparkleCount = radius > 180 ? 16 : 12;
        for (let i = 0; i < sparkleCount; i++) {
            const a = ((i * 47 + Math.floor(seededTime * 25) + seed * 0.17) % 360) * Math.PI / 180;
            const d = (0.15 + (((i * 0.137 + seededTime * 0.31 + seed * 0.0007) % 1) * 0.78)) * radius;
            const x = Math.cos(a) * d;
            const y = Math.sin(a) * d;
            const twinkle = 0.42 + Math.sin(seededTime * 9 + i * 0.8 + seed * 0.003) * 0.3;
            const s = (1.2 + ((i % 3) * 0.6)) * zoom;

            ctx.fillStyle = `rgba(255, 245, 180, ${Math.max(0.2, twinkle)})`;
            ctx.beginPath();
            ctx.arc(x, y, s, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    drawHolyWaterArea(bullet, screenX, screenY, zoom, time) {
        const ctx = this.ctx;
        const radius = Math.max(26, (bullet.range || 110) * zoom * 0.55);
        const seed = bullet.visualSeed || 0;
        const seededTime = time + seed * 0.0021;

        ctx.save();
        ctx.translate(screenX, screenY);

        // irregular puddle body
        this.drawIrregularBlob(ctx, radius, '#5ec7ff', 0.24, seededTime * 1.7, 0.14);
        this.drawIrregularBlob(ctx, radius * 0.75, '#d8f6ff', 0.20, seededTime * 1.2, 0.1);

        // splash droplets
        for (let i = 0; i < 8; i++) {
            const a = ((i * 61 + Math.floor(seededTime * 20) + seed * 0.11) % 360) * Math.PI / 180;
            const d = radius * (0.52 + ((i % 5) * 0.08) + Math.sin(seededTime * 1.7 + i + seed * 0.01) * 0.03);
            const x = Math.cos(a) * d;
            const y = Math.sin(a) * d;
            const r = (1.3 + (i % 3) * 0.6) * zoom;
            ctx.fillStyle = 'rgba(180, 235, 255, 0.55)';
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();

        this.drawHolyWaterBottleThrow(bullet, screenX, screenY, zoom, time);
    }

    drawIrregularBlob(ctx, radius, color, alpha, phase, jagged) {
        const steps = 28;
        ctx.fillStyle = this.hexToRgba(color, alpha);
        ctx.beginPath();
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const a = t * Math.PI * 2;
            const n = 1 + Math.sin(a * 3 + phase) * jagged + Math.cos(a * 5 - phase * 0.7) * jagged * 0.6;
            const r = radius * n;
            const x = Math.cos(a) * r;
            const y = Math.sin(a) * r;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.fill();
    }

    drawHolyWaterBottleThrow(bullet, screenX, screenY, zoom, time) {
        const srcX = bullet.sourceX;
        const srcY = bullet.sourceY;
        const spawnedAt = bullet.spawnAt;
        if (typeof srcX !== 'number' || typeof srcY !== 'number' || typeof spawnedAt !== 'number') return;
        const seed = bullet.visualSeed || 0;

        const flight = bullet.bottleFlight || 0.28;
        const age = time - spawnedAt;
        if (age > flight + 0.12) return;

        const cam = this.game.camera;
        if (!cam) return;
        const src = cam.worldToScreen(srcX, srcY);
        const t = Math.max(0, Math.min(1, age / flight));

        const x = src.x + (screenX - src.x) * t;
        const yArc = -Math.sin(t * Math.PI) * ((16 + (seed % 5)) * zoom);
        const y = src.y + (screenY - src.y) * t + yArc;

        const bottle = this.game.sprites?.get('weapon_holywater');
        const rot = t * (7 + (seed % 3));

        if (age <= flight) {
            this.ctx.save();
            this.ctx.translate(x, y);
            this.ctx.rotate(rot);
            const s = 12 * zoom;
            if (bottle) this.ctx.drawImage(bottle, -s / 2, -s / 2, s, s);
            else {
                this.ctx.fillStyle = 'rgba(140,220,255,0.9)';
                this.ctx.fillRect(-3 * zoom, -5 * zoom, 6 * zoom, 10 * zoom);
            }
            this.ctx.restore();
        } else {
            const k = 1 - Math.min(1, (age - flight) / 0.12);
            for (let i = 0; i < 7; i++) {
                const a = (i / 7) * Math.PI * 2 + i * 0.23 + seed * 0.001;
                const d = (8 + i * 1.5) * zoom * (1 - k);
                const px = screenX + Math.cos(a) * d;
                const py = screenY + Math.sin(a) * d;
                this.ctx.fillStyle = `rgba(200,245,255,${0.8 * k})`;
                this.ctx.beginPath();
                this.ctx.arc(px, py, (1.3 + (i % 2) * 0.8) * zoom, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
    }

    drawLaser(bullet, screenX, screenY, zoom) {
        const ctx = this.ctx;
        const width = (bullet.width || 12) * zoom;
        const color = bullet.color || '#ff0044';
        const points = bullet.pathPoints || null;

        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.shadowBlur = 16 * zoom;
        ctx.shadowColor = color;
        ctx.globalCompositeOperation = 'screen';

        if (points && points.length > 1) {
            const cam = this.game.camera;
            const screenPoints = points.map((p) => cam.worldToScreen(p.x, p.y));

            ctx.strokeStyle = this.hexToRgba(color, 0.32);
            ctx.lineWidth = width * 1.8;
            ctx.beginPath();
            ctx.moveTo(screenPoints[0].x, screenPoints[0].y);
            for (let i = 1; i < screenPoints.length; i++) ctx.lineTo(screenPoints[i].x, screenPoints[i].y);
            ctx.stroke();

            ctx.strokeStyle = this.hexToRgba(color, 0.78);
            ctx.lineWidth = width;
            ctx.beginPath();
            ctx.moveTo(screenPoints[0].x, screenPoints[0].y);
            for (let i = 1; i < screenPoints.length; i++) ctx.lineTo(screenPoints[i].x, screenPoints[i].y);
            ctx.stroke();

            ctx.strokeStyle = this.hexToRgba('#ffffff', 0.92);
            ctx.lineWidth = Math.max(2, width * 0.34);
            ctx.beginPath();
            ctx.moveTo(screenPoints[0].x, screenPoints[0].y);
            for (let i = 1; i < screenPoints.length; i++) ctx.lineTo(screenPoints[i].x, screenPoints[i].y);
            ctx.stroke();
        } else {
            const range = (bullet.range || 3000) * zoom;
            ctx.translate(screenX, screenY);
            ctx.rotate(bullet.angle || 0);

            const grad = ctx.createLinearGradient(0, -width, 0, width);
            grad.addColorStop(0, this.hexToRgba(color, 0));
            grad.addColorStop(0.25, this.hexToRgba(color, 0.45));
            grad.addColorStop(0.5, this.hexToRgba('#ffffff', 0.85));
            grad.addColorStop(0.75, this.hexToRgba(color, 0.45));
            grad.addColorStop(1, this.hexToRgba(color, 0));

            ctx.fillStyle = grad;
            ctx.fillRect(0, -width, range, width * 2);
        }
        ctx.restore();
    }

    drawKnifeProjectile(ctx, bullet, width, angle) {
        const len = Math.max(5.8, width * 1.08);
        const half = Math.max(1.1, width * 0.11);
        ctx.save();
        ctx.rotate(angle);
        // blade
        ctx.fillStyle = '#f4f6fb';
        ctx.beginPath();
        ctx.moveTo(len * 0.55, 0);
        ctx.lineTo(-len * 0.18, -half);
        ctx.lineTo(-len * 0.32, 0);
        ctx.lineTo(-len * 0.18, half);
        ctx.closePath();
        ctx.fill();
        // spine
        ctx.strokeStyle = 'rgba(160,175,200,0.9)';
        ctx.lineWidth = Math.max(1, width * 0.08);
        ctx.beginPath();
        ctx.moveTo(-len * 0.2, 0);
        ctx.lineTo(len * 0.38, 0);
        ctx.stroke();
        // short tail
        const grad = ctx.createLinearGradient(-len * 0.9, 0, -len * 0.15, 0);
        grad.addColorStop(0, 'rgba(220,230,255,0)');
        grad.addColorStop(1, 'rgba(220,230,255,0.35)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(-len * 0.5, 0, len * 0.45, half * 0.9, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    drawAxeProjectile(ctx, bullet, width, angle, time) {
        const sprite = this.game.sprites?.get('weapon_axe');
        const spin = (typeof bullet.spin === 'number') ? bullet.spin : (time * 22); // self-rotation
        const size = Math.max(10, width * 1.25);

        ctx.save();
        // face flight direction + keep spinning
        ctx.rotate((angle || 0) + spin);

        if (sprite) {
            ctx.drawImage(sprite, -size / 2, -size / 2, size, size);
        } else {
            // fallback keeps rotation feel
            const r = Math.max(5.5, width * 0.44);
            ctx.fillStyle = '#e8edf5';
            for (let i = 0; i < 3; i++) {
                const a = i * (Math.PI * 2 / 3);
                ctx.save();
                ctx.rotate(a);
                ctx.beginPath();
                ctx.moveTo(r * 1.05, 0);
                ctx.lineTo(-r * 0.18, -r * 0.24);
                ctx.lineTo(-r * 0.42, 0);
                ctx.lineTo(-r * 0.18, r * 0.24);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
            }
            ctx.fillStyle = '#9a7a4a';
            ctx.beginPath();
            ctx.arc(0, 0, r * 0.22, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    drawBibleProjectile(ctx, bullet, width, time) {
        const sprite = this.game.sprites?.get('weapon_bible');
        const spin = time * 8;
        ctx.save();
        ctx.rotate(spin);
        const s = width * 1.28;
        ctx.globalAlpha = 0.92;
        if (sprite) ctx.drawImage(sprite, -s / 2, -s / 2, s, s);
        else this.drawFallbackProjectile(ctx, bullet, s, s);
        ctx.restore();

        ctx.save();
        ctx.rotate(-spin * 0.6);
        ctx.strokeStyle = this.hexToRgba('#fff6c9', 0.55);
        ctx.lineWidth = Math.max(1, s * 0.07);
        ctx.beginPath();
        ctx.moveTo(-s * 0.22, 0);
        ctx.lineTo(s * 0.22, 0);
        ctx.moveTo(0, -s * 0.22);
        ctx.lineTo(0, s * 0.22);
        ctx.stroke();
        ctx.restore();
    }

    drawShurikenProjectile(ctx, bullet, width, time) {
        const r = Math.max(3.6, width * 0.40);
        const spin = (typeof bullet.spin === 'number')
            ? bullet.spin
            : (time * 14 + (bullet.visualSeed || 0) * 0.01);
        ctx.save();
        ctx.rotate(spin);
        // silver-gray body
        ctx.fillStyle = this.hexToRgba('#c4c9d1', 0.95);
        ctx.strokeStyle = this.hexToRgba('#8f959e', 0.95);
        ctx.lineWidth = Math.max(1, width * 0.09);
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const rr = i % 2 === 0 ? r : r * 0.43;
            const a = (i / 8) * Math.PI * 2;
            const x = Math.cos(a) * rr;
            const y = Math.sin(a) * rr;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        // carve center hole with evenodd path to avoid white-core artifacts
        ctx.moveTo(Math.max(1.2, r * 0.28), 0);
        ctx.arc(0, 0, Math.max(1.2, r * 0.28), 0, Math.PI * 2, true);
        ctx.fill('evenodd');
        // stroke outer contour only
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
            const rr = i % 2 === 0 ? r : r * 0.43;
            const a = (i / 8) * Math.PI * 2;
            const x = Math.cos(a) * rr;
            const y = Math.sin(a) * rr;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();
    }

    drawCrossProjectile(ctx, bullet, width, time) {
        const r = Math.max(3.8, width * 0.36);
        ctx.save();
        ctx.rotate(time * 6);
        ctx.strokeStyle = this.hexToRgba('#ffffff', 0.9);
        ctx.lineWidth = Math.max(1, width * 0.11);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-r, 0);
        ctx.lineTo(r, 0);
        ctx.moveTo(0, -r);
        ctx.lineTo(0, r);
        ctx.stroke();
        ctx.restore();
    }

    drawFireballProjectile(ctx, bullet, width, height, time, angle) {
        const FIREBALL_ROT_OFFSET = 0; // if needed: Math.PI / 2 or -Math.PI / 2
        const sprite = this.game.sprites?.get('weapon_fireball') || this.game.sprites?.get('bullet_fireball');
        const pulse = 0.88 + Math.sin(time * 12) * 0.08;
        const w = width * pulse;
        const h = height * pulse;

        // only directional tail, no external ring
        ctx.save();
        ctx.rotate(angle || 0);
        const tailLen = Math.max(7, w * 1.6);
        const grad = ctx.createLinearGradient(-tailLen, 0, 0, 0);
        grad.addColorStop(0, 'rgba(255,120,40,0)');
        grad.addColorStop(1, 'rgba(255,170,70,0.55)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(-tailLen * 0.45, 0, tailLen * 0.55, h * 0.22, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (sprite) {
            ctx.save();
            ctx.rotate((angle || 0) + FIREBALL_ROT_OFFSET);
            ctx.drawImage(sprite, -w / 2, -h / 2, w, h);
            ctx.restore();
        } else {
            ctx.save();
            ctx.rotate(angle || 0);
            this.drawFallbackProjectile(ctx, bullet, w, h);
            ctx.restore();
        }
    }

    drawMagicOrbProjectile(ctx, bullet, width, time, angle) {
        const r = Math.max(3.2, width * 0.34);
        const seededTime = time + (bullet.visualSeed || 0) * 0.0015;
        ctx.save();
        ctx.rotate(angle || 0);

        // magic tail in exact opposite of flight direction
        const trail = ctx.createLinearGradient(-r * 5.2, 0, -r * 0.5, 0);
        trail.addColorStop(0, 'rgba(130,170,255,0)');
        trail.addColorStop(1, 'rgba(130,170,255,0.4)');
        ctx.fillStyle = trail;
        ctx.beginPath();
        ctx.ellipse(-r * 2.2, 0, r * 2.4, r * 0.56, 0, 0, Math.PI * 2);
        ctx.fill();

        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.2);
        g.addColorStop(0, 'rgba(255,255,255,0.95)');
        g.addColorStop(0.45, 'rgba(180,220,255,0.85)');
        g.addColorStop(1, 'rgba(90,140,255,0.55)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.fill();

        for (let i = 0; i < 3; i++) {
            const a = seededTime * 6 + i * Math.PI * 0.66;
            const x = Math.cos(a) * r * 0.55;
            const y = Math.sin(a) * r * 0.55;
            ctx.fillStyle = 'rgba(220,240,255,0.7)';
            ctx.beginPath();
            ctx.arc(x, y, Math.max(1, r * 0.16), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    drawPoisonDartProjectile(ctx, bullet, width, angle, time) {
        const len = Math.max(7, width * 1.2);
        const body = Math.max(2.2, width * 0.2);
        ctx.save();
        ctx.rotate(angle);

        // tiny green toxic tail
        const tail = ctx.createLinearGradient(-len, 0, 0, 0);
        tail.addColorStop(0, 'rgba(70,200,90,0)');
        tail.addColorStop(1, 'rgba(90,240,120,0.35)');
        ctx.fillStyle = tail;
        ctx.beginPath();
        ctx.ellipse(-len * 0.45, 0, len * 0.55, body * 0.9, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(130,255,150,0.95)';
        ctx.beginPath();
        ctx.moveTo(len * 0.5, 0);
        ctx.lineTo(-len * 0.3, -body);
        ctx.lineTo(-len * 0.45, 0);
        ctx.lineTo(-len * 0.3, body);
        ctx.closePath();
        ctx.fill();

        // toxic pulse
        const p = 0.4 + Math.sin(time * 18) * 0.2;
        ctx.fillStyle = `rgba(190,255,190,${Math.max(0.25, p)})`;
        ctx.beginPath();
        ctx.arc(-len * 0.2, 0, body * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    drawIcicleProjectile(ctx, bullet, width, angle, time) {
        const len = Math.max(8, width * 1.5);
        const half = Math.max(2.5, width * 0.25);
        ctx.save();
        ctx.rotate(angle);

        ctx.fillStyle = 'rgba(210,245,255,0.9)';
        ctx.beginPath();
        ctx.moveTo(len * 0.52, 0);
        ctx.lineTo(-len * 0.25, -half);
        ctx.lineTo(-len * 0.55, 0);
        ctx.lineTo(-len * 0.25, half);
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,255,255,0.85)';
        ctx.lineWidth = Math.max(1, width * 0.09);
        ctx.beginPath();
        ctx.moveTo(-len * 0.4, 0);
        ctx.lineTo(len * 0.35, 0);
        ctx.stroke();

        const blink = 0.35 + Math.sin(time * 16) * 0.2;
        ctx.fillStyle = `rgba(230,255,255,${Math.max(0.2, blink)})`;
        ctx.beginPath();
        ctx.arc(0, 0, half * 0.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawDefaultProjectile(ctx, bullet, width, height) {
        const sprite = this.getProjectileSprite(bullet);
        if (sprite) ctx.drawImage(sprite, -width / 2, -height / 2, width, height);
        else this.drawFallbackProjectile(ctx, bullet, width, height);
    }

    drawFallbackProjectile(ctx, bullet, width, height) {
        ctx.fillStyle = bullet.color || '#ffffff';
        if (bullet.subtype === 'rapid' || bullet.subtype === 'fan') {
            ctx.beginPath();
            ctx.moveTo(width * 0.45, 0);
            ctx.lineTo(-width * 0.2, -height * 0.18);
            ctx.lineTo(-width * 0.32, 0);
            ctx.lineTo(-width * 0.2, height * 0.18);
            ctx.closePath();
            ctx.fill();
            return;
        }

        ctx.beginPath();
        ctx.arc(0, 0, Math.max(width, height) * 0.32, 0, Math.PI * 2);
        ctx.fill();
    }

    drawDefault(bullet, screenX, screenY, zoom) {
        const ctx = this.ctx;
        const size = Math.max(5, (bullet.size || 7) * zoom);
        ctx.fillStyle = bullet.color || '#ffffff';
        ctx.beginPath();
        ctx.arc(screenX, screenY, size, 0, Math.PI * 2);
        ctx.fill();
    }

    getProjectileSprite(bullet) {
        const key = bullet.sprite || this.projectileSpriteMap[bullet.subtype || ''] || null;
        return key ? this.game.sprites?.get(key) : null;
    }

    getWeaponSprite(bullet) {
        const key = bullet.weaponSprite || this.weaponSpriteMap[bullet.weaponKey || ''] || null;
        return key ? this.game.sprites?.get(key) : null;
    }

    hexToRgba(hex, alpha) {
        if (!hex || typeof hex !== 'string' || !hex.startsWith('#') || hex.length < 7) {
            return `rgba(255,255,255,${alpha})`;
        }
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
}

window.WeaponVisuals = WeaponVisuals;
