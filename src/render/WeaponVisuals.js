/**
 * WeaponVisuals.js - logic-driven weapon visuals
 */

class WeaponVisuals {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.spriteBoundsCache = new WeakMap();

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
        if (typeof window !== 'undefined' && window.WEAPON_WEAPONKEY_TO_SPRITEKEY) {
            this.weaponSpriteMap = {
                ...this.weaponSpriteMap,
                ...window.WEAPON_WEAPONKEY_TO_SPRITEKEY
            };
        }

        this.weaponVisualConfig = this.buildWeaponVisualConfig();
        this.presentationEmissiveConfig = this.buildPresentationEmissiveConfig();
    }

    buildWeaponVisualConfig() {
        const defaults = {
            whip: {
                spriteKey: 'weapon_whip',
                size: 134,
                anchorX: 0.18,
                anchorY: 0.54,
                offsetX: 0,
                offsetY: 0,
                rotationDeg: 0,
                flipX: false,
                pose: {
                    defaultRange: 336,
                    defaultArc: 128,
                    rangeReference: 336,
                    reachMultiplier: 0.34,
                    minReach: 42,
                    maxReach: 220,
                    handDistance: 12,
                    handLift: 12,
                    trailWidth: 15,
                    trailStartOffset: -0.52,
                    trailEndOffset: 0.1,
                    lineWidth: 7,
                    lineLift: 6
                }
            },
            blood_whip: {
                inherit: 'whip',
                size: 148
            },
            scythe: {
                spriteKey: 'weapon_scythe',
                size: 148,
                anchorX: 0.3,
                anchorY: 0.58,
                offsetX: 0,
                offsetY: 0,
                rotationDeg: 0,
                flipX: false,
                pose: {
                    defaultRange: 364,
                    defaultArc: 110,
                    rangeReference: 364,
                    reachMultiplier: 0.38,
                    minReach: 48,
                    maxReach: 252,
                    handDistance: 14,
                    handLift: 10,
                    trailWidth: 12,
                    trailStartOffset: -0.36,
                    trailEndOffset: 0.2,
                    lineWidth: 6,
                    lineLift: 4
                }
            },
            death_scythe: {
                inherit: 'scythe',
                size: 162
            }
        };

        const overrides = (typeof window !== 'undefined' && window.WEAPON_VISUAL_TUNING)
            ? window.WEAPON_VISUAL_TUNING
            : {};

        const merged = { ...defaults };
        for (const [key, value] of Object.entries(overrides)) {
            merged[key] = this.mergeWeaponVisualConfig(merged[key], value);
        }
        return merged;
    }

    mergeWeaponVisualConfig(baseConfig = {}, overrideConfig = {}) {
        if (!overrideConfig) return { ...baseConfig };
        return {
            ...baseConfig,
            ...overrideConfig,
            pose: {
                ...(baseConfig.pose || {}),
                ...(overrideConfig.pose || {})
            }
        };
    }

    getWeaponVisualConfig(weaponKey) {
        if (!weaponKey) return null;
        const config = this.weaponVisualConfig?.[weaponKey];
        if (!config) return null;
        if (!config.inherit) return config;

        const parent = this.getWeaponVisualConfig(config.inherit);
        return this.mergeWeaponVisualConfig(parent, config);
    }

    getWeaponRenderMode(bullet) {
        return this.getWeaponVisualConfig(bullet?.weaponKey)?.renderMode || 'auto';
    }

    drawConfiguredProjectileSprite(ctx, bullet, zoom, options = {}) {
        const sprite = this.getWeaponSprite(bullet);
        if (!ctx || !sprite) return false;

        const visualCfg = this.getWeaponVisualConfig(bullet.weaponKey) || {};
        const scale = (bullet.scale || 1) * (options.scale || 1);
        const scene = options.scene || visualCfg.scene || 'projectile';
        const configuredSize = Number.isFinite(visualCfg.size) ? visualCfg.size : null;
        const runtimeSize = Number.isFinite(options.fallbackSize)
            ? options.fallbackSize
            : (Number.isFinite(bullet.size)
                ? bullet.size
                : (Number.isFinite(options.minSize) && zoom * scale > 0
                    ? options.minSize / (zoom * scale)
                    : null));
        const prefersRuntimeSize = scene !== 'melee' && scene !== 'area' && scene !== 'aura';
        const baseSize = prefersRuntimeSize
            ? (runtimeSize ?? configuredSize ?? 16)
            : (configuredSize ?? runtimeSize ?? 16);
        const targetSize = Math.max(
            options.minSize || 8,
            baseSize * zoom * scale
        );
        const anchorX = options.anchorX ?? visualCfg.anchorX ?? 0.5;
        const anchorY = options.anchorY ?? visualCfg.anchorY ?? 0.5;
        const offsetX = (visualCfg.offsetX || 0) + (options.offsetX || 0);
        const offsetY = (visualCfg.offsetY || 0) + (options.offsetY || 0);
        const rotation = (options.baseAngle || 0) +
            (options.extraRotation || 0) +
            (options.spin || 0) +
            ((visualCfg.rotationDeg || 0) * Math.PI / 180);

        ctx.save();
        ctx.rotate(rotation);
        if (visualCfg.flipX) ctx.scale(-1, 1);
        if (visualCfg.trimTransparent === false) {
            ctx.drawImage(
                sprite,
                offsetX - targetSize * anchorX,
                offsetY - targetSize * anchorY,
                targetSize,
                targetSize
            );
        } else {
            this.drawTrimmedSprite(ctx, sprite, {
                size: targetSize,
                anchorX,
                anchorY,
                offsetX,
                offsetY
            });
        }
        ctx.restore();
        return true;
    }

    getSpriteContentBounds(sprite) {
        if (!sprite) return null;
        const cached = this.spriteBoundsCache.get(sprite);
        if (cached) return cached;

        const width = sprite.naturalWidth || sprite.width || 0;
        const height = sprite.naturalHeight || sprite.height || 0;
        if (!width || !height) {
            return null;
        }

        let bounds = { x: 0, y: 0, width, height };
        try {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            if (ctx) {
                ctx.clearRect(0, 0, width, height);
                ctx.drawImage(sprite, 0, 0, width, height);
                const pixels = ctx.getImageData(0, 0, width, height).data;
                let minX = width;
                let minY = height;
                let maxX = -1;
                let maxY = -1;

                for (let y = 0; y < height; y++) {
                    for (let x = 0; x < width; x++) {
                        const alpha = pixels[(y * width + x) * 4 + 3];
                        if (alpha <= 8) continue;
                        if (x < minX) minX = x;
                        if (y < minY) minY = y;
                        if (x > maxX) maxX = x;
                        if (y > maxY) maxY = y;
                    }
                }

                if (maxX >= minX && maxY >= minY) {
                    bounds = {
                        x: minX,
                        y: minY,
                        width: maxX - minX + 1,
                        height: maxY - minY + 1
                    };
                }
            }
        } catch (err) {
            bounds = { x: 0, y: 0, width, height };
        }

        this.spriteBoundsCache.set(sprite, bounds);
        return bounds;
    }

    drawTrimmedSprite(ctx, sprite, options = {}) {
        if (!ctx || !sprite) return false;
        const bounds = this.getSpriteContentBounds(sprite);
        if (!bounds) return false;

        const sourceWidth = Math.max(1, bounds.width);
        const sourceHeight = Math.max(1, bounds.height);
        const targetHeight = Math.max(1, options.size || sourceHeight);
        const scale = targetHeight / sourceHeight;
        const drawWidth = sourceWidth * scale;
        const drawHeight = sourceHeight * scale;
        const anchorX = options.anchorX ?? 0.5;
        const anchorY = options.anchorY ?? 0.5;
        const offsetX = options.offsetX || 0;
        const offsetY = options.offsetY || 0;

        ctx.drawImage(
            sprite,
            bounds.x,
            bounds.y,
            sourceWidth,
            sourceHeight,
            offsetX - drawWidth * anchorX,
            offsetY - drawHeight * anchorY,
            drawWidth,
            drawHeight
        );
        return true;
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
            this.drawKnifeProjectile(ctx, bullet, width, angle, time, zoom);
        } else if (style === 'axe_spin') {
            this.drawAxeProjectile(ctx, bullet, width, angle, time, zoom);
        } else if (style === 'orbit_bible') {
            this.drawBibleProjectile(ctx, bullet, width, time, zoom);
        } else if (style === 'cross_bounce') {
            this.drawCrossProjectile(ctx, bullet, width, time, zoom);
        } else if (style === 'shuriken') {
            this.drawShurikenProjectile(ctx, bullet, width, time, zoom);
        } else if (style === 'fireball') {
            this.drawFireballProjectile(ctx, bullet, width, height, time, angle, zoom);
        } else if (style === 'magic_orb') {
            this.drawMagicOrbProjectile(ctx, bullet, width, time, angle, zoom);
        } else if (style === 'poison_dart') {
            this.drawPoisonDartProjectile(ctx, bullet, width, angle, time, zoom);
        } else if (style === 'icicle') {
            this.drawIcicleProjectile(ctx, bullet, width, angle, time, zoom);
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
        const visualCfg = this.getWeaponVisualConfig(bullet.weaponKey) || this.getWeaponVisualConfig('whip') || {};
        const poseCfg = visualCfg.pose || {};
        const pose = this.getMeleeSwingPose(bullet, zoom, poseCfg);
        const sprite = this.game.sprites?.get(visualCfg.spriteKey || 'weapon_whip');
        const hand = this.getMeleeHandOffset(pose.swingAngle, pose.rangeScale, zoom, poseCfg);
        const spriteSize = Math.max(94, (visualCfg.size || 134) * pose.rangeScale * zoom);
        const trailRadius = Math.max(44, pose.weaponReach * 0.96);

        ctx.save();
        ctx.translate(screenX, screenY);
        const trail = ctx.createRadialGradient(hand.x, hand.y, trailRadius * 0.12, hand.x, hand.y, trailRadius * 1.08);
        trail.addColorStop(0, 'rgba(255, 250, 220, 0.14)');
        trail.addColorStop(0.55, 'rgba(255, 225, 120, 0.26)');
        trail.addColorStop(1, 'rgba(255, 210, 110, 0)');
        ctx.strokeStyle = trail;
        ctx.lineWidth = Math.max(10, (poseCfg.trailWidth || 15) * pose.rangeScale * zoom);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(
            hand.x,
            hand.y,
            trailRadius,
            pose.swingAngle + (poseCfg.trailStartOffset || -0.52),
            pose.swingAngle + (poseCfg.trailEndOffset || 0.1)
        );
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255, 238, 184, 0.72)';
        ctx.lineWidth = Math.max(4, (poseCfg.lineWidth || 7) * pose.rangeScale * zoom);
        ctx.beginPath();
        ctx.moveTo(0, -zoom * (poseCfg.lineLift || 6));
        ctx.lineTo(hand.x, hand.y);
        ctx.stroke();

        ctx.save();
        ctx.translate(hand.x, hand.y);
        ctx.rotate(
            pose.swingAngle +
            Math.PI * 0.14 +
            ((visualCfg.rotationDeg || 0) * Math.PI / 180) +
            Math.sin((time || 0) * 20) * 0.015
        );
        if (visualCfg.flipX) ctx.scale(-1, 1);
        if (sprite) {
            ctx.filter = `drop-shadow(0 0 ${Math.max(6, 12 * zoom)}px rgba(255,215,100,0.55))`;
            this.drawTrimmedSprite(ctx, sprite, {
                size: spriteSize,
                anchorX: visualCfg.anchorX ?? 0.18,
                anchorY: visualCfg.anchorY ?? 0.54,
                offsetX: visualCfg.offsetX || 0,
                offsetY: visualCfg.offsetY || 0
            });
            ctx.filter = 'none';
        }
        ctx.restore();
        ctx.restore();
    }

    drawScytheMelee(ctx, bullet, screenX, screenY, zoom, time) {
        const visualCfg = this.getWeaponVisualConfig(bullet.weaponKey) || this.getWeaponVisualConfig('scythe') || {};
        const poseCfg = visualCfg.pose || {};
        const pose = this.getMeleeSwingPose(bullet, zoom, poseCfg);
        const sprite = this.game.sprites?.get(visualCfg.spriteKey || 'weapon_scythe');
        const hand = this.getMeleeHandOffset(pose.swingAngle, pose.rangeScale, zoom, poseCfg);
        const spriteSize = Math.max(110, (visualCfg.size || 148) * pose.rangeScale * zoom);
        const trailRadius = Math.max(52, pose.weaponReach);

        ctx.save();
        ctx.translate(screenX, screenY);
        const trail = ctx.createRadialGradient(hand.x, hand.y, trailRadius * 0.16, hand.x, hand.y, trailRadius * 1.14);
        trail.addColorStop(0, 'rgba(220, 210, 255, 0.10)');
        trail.addColorStop(0.56, 'rgba(166, 120, 255, 0.24)');
        trail.addColorStop(1, 'rgba(120, 70, 180, 0)');
        ctx.strokeStyle = trail;
        ctx.lineWidth = Math.max(8, (poseCfg.trailWidth || 12) * pose.rangeScale * zoom);
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.arc(
            hand.x,
            hand.y,
            trailRadius,
            pose.swingAngle + (poseCfg.trailStartOffset || -0.36),
            pose.swingAngle + (poseCfg.trailEndOffset || 0.2)
        );
        ctx.stroke();

        ctx.strokeStyle = 'rgba(208, 200, 255, 0.72)';
        ctx.lineWidth = Math.max(4, (poseCfg.lineWidth || 6) * pose.rangeScale * zoom);
        ctx.beginPath();
        ctx.moveTo(0, -zoom * (poseCfg.lineLift || 4));
        ctx.lineTo(hand.x, hand.y);
        ctx.stroke();

        ctx.save();
        ctx.translate(hand.x, hand.y);
        ctx.rotate(
            pose.swingAngle +
            Math.PI * 0.18 +
            ((visualCfg.rotationDeg || 0) * Math.PI / 180) +
            Math.sin((time || 0) * 14) * 0.015
        );
        if (visualCfg.flipX) ctx.scale(-1, 1);
        if (sprite) {
            ctx.filter = `drop-shadow(0 0 ${Math.max(6, 12 * zoom)}px rgba(190,120,255,0.45))`;
            this.drawTrimmedSprite(ctx, sprite, {
                size: spriteSize,
                anchorX: visualCfg.anchorX ?? 0.3,
                anchorY: visualCfg.anchorY ?? 0.58,
                offsetX: visualCfg.offsetX || 0,
                offsetY: visualCfg.offsetY || 0
            });
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
        this.drawAuraPseudoLight(bullet, screenX, screenY, zoom, time);
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

    drawAuraPseudoLight(bullet, screenX, screenY, zoom, time) {
        const ctx = this.ctx;
        const key = bullet.weaponKey || '';
        const baseRadius = Math.max(18, (bullet.range || 96) * zoom * 0.34);
        const pulse = 0.94 + Math.sin((time || 0) * 4.8 + (bullet.visualSeed || 0) * 0.001) * 0.06;
        const radius = baseRadius * pulse;
        const color = key === 'radiance' || key === 'solar_radiance'
            ? '#ffbf52'
            : (key === 'holy_water' || key === 'la_borra' ? '#88d9ff' : (bullet.color || '#ffffff'));
        const alpha = key === 'radiance' || key === 'solar_radiance' ? 0.18 : 0.12;

        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, radius);
        gradient.addColorStop(0, this.hexToRgba(color, alpha));
        gradient.addColorStop(0.5, this.hexToRgba(color, alpha * 0.45));
        gradient.addColorStop(1, this.hexToRgba(color, 0));
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
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

        const bottle = this.getWeaponSprite(bullet) || this.game.sprites?.get('weapon_holywater');
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

    drawKnifeProjectile(ctx, bullet, width, angle, time, zoom) {
        const renderMode = this.getWeaponRenderMode(bullet);
        if (renderMode === 'sprite' && this.drawConfiguredProjectileSprite(ctx, bullet, zoom, {
            baseAngle: angle,
            minSize: Math.max(6, width * 1.08)
        })) return;

        const isSuper = !!bullet?.isSuper;
        const len = Math.max(5.8, width * 1.08);
        const half = Math.max(1.1, width * 0.11);
        const bladeColor = isSuper ? '#f0c34a' : '#ff2a2a';
        const edgeColor = isSuper ? '#fff2b6' : '#ffd0d0';
        const trailColor = isSuper ? 'rgba(246,211,111,0.72)' : 'rgba(255,74,74,0.72)';
        ctx.save();
        ctx.rotate(angle);
        ctx.shadowBlur = isSuper ? Math.max(4, width * 0.45) : Math.max(2, width * 0.28);
        ctx.shadowColor = bladeColor;
        // blade body
        ctx.fillStyle = bladeColor;
        ctx.beginPath();
        ctx.moveTo(len * 0.56, 0);
        ctx.lineTo(-len * 0.12, -half * 1.15);
        ctx.lineTo(-len * 0.32, 0);
        ctx.lineTo(-len * 0.12, half * 1.15);
        ctx.closePath();
        ctx.fill();
        // bright edge
        ctx.shadowBlur = 0;
        ctx.strokeStyle = edgeColor;
        ctx.lineWidth = Math.max(1, width * 0.08);
        ctx.beginPath();
        ctx.moveTo(-len * 0.08, 0);
        ctx.lineTo(len * 0.42, 0);
        ctx.stroke();
        // red/gold tail only, no radial source bloom
        const grad = ctx.createLinearGradient(-len * 0.95, 0, -len * 0.08, 0);
        grad.addColorStop(0, isSuper ? 'rgba(246,211,111,0)' : 'rgba(255,74,74,0)');
        grad.addColorStop(0.55, trailColor);
        grad.addColorStop(1, isSuper ? 'rgba(255,242,182,0.18)' : 'rgba(255,208,208,0.14)');
        ctx.strokeStyle = grad;
        ctx.lineWidth = Math.max(1.2, width * 0.22);
        ctx.beginPath();
        ctx.moveTo(-len * 0.82, 0);
        ctx.lineTo(-len * 0.06, 0);
        ctx.stroke();
        ctx.restore();
        if (renderMode === 'both') {
            this.drawConfiguredProjectileSprite(ctx, bullet, zoom, {
                baseAngle: angle,
                minSize: Math.max(6, width * 1.08)
            });
        }
    }

    drawAxeProjectile(ctx, bullet, width, angle, time, zoom) {
        const spin = (typeof bullet.spin === 'number') ? bullet.spin : (time * 22); // self-rotation
        const size = Math.max(10, width * 1.25);
        if (this.drawConfiguredProjectileSprite(ctx, bullet, zoom, {
            baseAngle: angle,
            spin,
            minSize: size
        })) return;

        const sprite = this.getWeaponSprite(bullet) || this.game.sprites?.get('weapon_axe');

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

    drawBibleProjectile(ctx, bullet, width, time, zoom) {
        const renderMode = this.getWeaponRenderMode(bullet);
        const spin = time * 8;
        const s = width * 1.28;
        const isSuper = bullet?.weaponKey === 'unholy_vespers';
        const glowCore = isSuper ? '#ff6a5c' : '#7fc4ff';
        const glowOuter = isSuper ? 'rgba(255,74,54,0.34)' : 'rgba(88,172,255,0.28)';
        const crossColor = isSuper ? '#ffd0cb' : '#d7efff';
        const pulse = 0.92 + Math.sin(time * (isSuper ? 10 : 8)) * 0.08;

        ctx.save();
        const bloom = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.95);
        bloom.addColorStop(0, this.hexToRgba(glowCore, isSuper ? 0.34 : 0.28));
        bloom.addColorStop(0.5, glowOuter);
        bloom.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = bloom;
        ctx.beginPath();
        ctx.arc(0, 0, s * 0.95 * pulse, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        const drewSprite = (renderMode === 'sprite' || renderMode === 'both')
            ? this.drawConfiguredProjectileSprite(ctx, bullet, zoom, {
                spin,
                minSize: s
            })
            : false;
        if (renderMode === 'sprite' && drewSprite) return;
        if (!drewSprite) {
            const sprite = this.getWeaponSprite(bullet) || this.game.sprites?.get('weapon_bible');
            ctx.save();
            ctx.rotate(spin);
            ctx.globalAlpha = 0.92;
            ctx.shadowBlur = s * (isSuper ? 0.4 : 0.34) * pulse;
            ctx.shadowColor = glowCore;
            if (sprite) ctx.drawImage(sprite, -s / 2, -s / 2, s, s);
            else this.drawFallbackProjectile(ctx, bullet, s, s);
            ctx.restore();
        } else {
            ctx.save();
            ctx.rotate(spin);
            ctx.globalCompositeOperation = 'screen';
            ctx.globalAlpha = isSuper ? 0.26 : 0.22;
            ctx.fillStyle = glowOuter;
            ctx.beginPath();
            ctx.roundRect(-s * 0.34, -s * 0.42, s * 0.68, s * 0.84, s * 0.08);
            ctx.fill();
            ctx.restore();
        }

        ctx.save();
        ctx.rotate(-spin * 0.6);
        ctx.strokeStyle = this.hexToRgba(crossColor, isSuper ? 0.72 : 0.62);
        ctx.lineWidth = Math.max(1, s * 0.07);
        ctx.shadowBlur = s * 0.18;
        ctx.shadowColor = glowCore;
        ctx.beginPath();
        ctx.moveTo(-s * 0.22, 0);
        ctx.lineTo(s * 0.22, 0);
        ctx.moveTo(0, -s * 0.22);
        ctx.lineTo(0, s * 0.22);
        ctx.stroke();
        ctx.restore();
    }

    drawShurikenProjectile(ctx, bullet, width, time, zoom) {
        const visualCfg = this.getWeaponVisualConfig(bullet.weaponKey) || {};
        const r = Math.max(3.6, width * 0.40);
        const spin = (typeof bullet.spin === 'number')
            ? bullet.spin
            : (time * (((visualCfg.spinSpeedDeg || 800) * Math.PI) / 180) + (bullet.visualSeed || 0) * 0.01);
        const renderMode = this.getWeaponRenderMode(bullet);
        if (renderMode === 'sprite' && this.drawConfiguredProjectileSprite(ctx, bullet, zoom, {
            spin,
            minSize: Math.max(8, width)
        })) return;

        ctx.save();
        ctx.rotate(spin);
        const bladeLen = r * 1.18;
        const bladeBase = r * 0.36;
        const notch = r * 0.22;
        const metal = ctx.createLinearGradient(0, -bladeLen, 0, bladeLen);
        metal.addColorStop(0, '#f7fbff');
        metal.addColorStop(0.48, '#d0d7e2');
        metal.addColorStop(1, '#8a929f');
        ctx.fillStyle = metal;
        ctx.strokeStyle = this.hexToRgba('#6f7783', 0.95);
        ctx.lineWidth = Math.max(1, width * 0.08);

        for (let i = 0; i < 4; i++) {
            ctx.save();
            ctx.rotate((Math.PI * 2 * i) / 4);
            ctx.beginPath();
            ctx.moveTo(bladeLen, 0);
            ctx.lineTo(bladeBase, -bladeBase * 0.58);
            ctx.lineTo(notch, -bladeBase * 0.16);
            ctx.lineTo(bladeBase * 0.15, 0);
            ctx.lineTo(notch, bladeBase * 0.16);
            ctx.lineTo(bladeBase, bladeBase * 0.58);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
            ctx.restore();
        }

        ctx.fillStyle = this.hexToRgba('#aeb6c2', 0.96);
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.34, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(0, 0, Math.max(1.2, r * 0.16), 0, Math.PI * 2);
        ctx.fill();
        ctx.globalCompositeOperation = 'source-over';

        ctx.strokeStyle = this.hexToRgba('#f8fbff', 0.28);
        ctx.lineWidth = Math.max(1, width * 0.05);
        for (let i = 0; i < 4; i++) {
            const a = (Math.PI * 2 * i) / 4;
            ctx.beginPath();
            ctx.moveTo(Math.cos(a) * r * 0.22, Math.sin(a) * r * 0.22);
            ctx.lineTo(Math.cos(a) * bladeLen * 0.82, Math.sin(a) * bladeLen * 0.82);
            ctx.stroke();
        }
        ctx.restore();
        if (renderMode === 'both') {
            this.drawConfiguredProjectileSprite(ctx, bullet, zoom, {
                spin,
                minSize: Math.max(8, width)
            });
        }
    }

    drawCrossProjectile(ctx, bullet, width, time, zoom) {
        const visualCfg = this.getWeaponVisualConfig(bullet.weaponKey) || {};
        const r = Math.max(3.8, width * 0.36);
        const spin = (typeof bullet.spin === 'number')
            ? bullet.spin
            : time * (((visualCfg.spinSpeedDeg || 344) * Math.PI) / 180) * 0.3;
        const renderMode = this.getWeaponRenderMode(bullet);
        if (renderMode === 'sprite' && this.drawConfiguredProjectileSprite(ctx, bullet, zoom, {
            spin,
            minSize: Math.max(8, width)
        })) return;

        ctx.save();
        ctx.rotate(spin);
        if (bullet.weaponKey === 'heaven_sword') {
            const bladeLen = Math.max(14, width * 1.58);
            const bladeHalf = Math.max(2.4, width * 0.16);
            const guardHalf = bladeLen * 0.34;
            const guardHeight = bladeLen * 0.12;

            const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, bladeLen * 1.05);
            halo.addColorStop(0, 'rgba(255,244,180,0.34)');
            halo.addColorStop(0.55, 'rgba(255,206,92,0.18)');
            halo.addColorStop(1, 'rgba(255,206,92,0)');
            ctx.fillStyle = halo;
            ctx.beginPath();
            ctx.arc(0, 0, bladeLen * 1.02, 0, Math.PI * 2);
            ctx.fill();

            const blade = ctx.createLinearGradient(0, -bladeLen, 0, bladeLen);
            blade.addColorStop(0, '#fefefe');
            blade.addColorStop(0.42, '#e2ecf8');
            blade.addColorStop(1, '#7b8797');
            ctx.fillStyle = blade;
            ctx.strokeStyle = this.hexToRgba('#546070', 0.95);
            ctx.lineWidth = Math.max(1, width * 0.06);
            ctx.beginPath();
            ctx.moveTo(0, -bladeLen);
            ctx.lineTo(bladeHalf, -bladeLen * 0.58);
            ctx.lineTo(bladeHalf * 0.72, bladeLen * 0.34);
            ctx.lineTo(bladeHalf * 0.42, bladeLen * 0.9);
            ctx.lineTo(0, bladeLen);
            ctx.lineTo(-bladeHalf * 0.42, bladeLen * 0.9);
            ctx.lineTo(-bladeHalf * 0.72, bladeLen * 0.34);
            ctx.lineTo(-bladeHalf, -bladeLen * 0.58);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            const gold = ctx.createLinearGradient(-guardHalf, 0, guardHalf, 0);
            gold.addColorStop(0, '#9c6e1b');
            gold.addColorStop(0.5, '#ffd978');
            gold.addColorStop(1, '#9c6e1b');
            ctx.fillStyle = gold;
            ctx.strokeStyle = this.hexToRgba('#704b0f', 0.95);
            ctx.beginPath();
            ctx.moveTo(-guardHalf, -guardHeight * 0.2);
            ctx.lineTo(-guardHalf * 0.48, -guardHeight);
            ctx.lineTo(-bladeHalf * 0.8, -guardHeight * 0.34);
            ctx.lineTo(bladeHalf * 0.8, -guardHeight * 0.34);
            ctx.lineTo(guardHalf * 0.48, -guardHeight);
            ctx.lineTo(guardHalf, -guardHeight * 0.2);
            ctx.lineTo(guardHalf * 0.46, guardHeight);
            ctx.lineTo(-guardHalf * 0.46, guardHeight);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#6d4512';
            ctx.fillRect(-bladeHalf * 0.22, guardHeight, bladeHalf * 0.44, bladeLen * 0.34);
            ctx.fillStyle = '#e6c161';
            ctx.beginPath();
            ctx.arc(0, 0, bladeHalf * 1.35, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#5bc8ff';
            ctx.beginPath();
            ctx.arc(0, 0, bladeHalf * 0.62, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = this.hexToRgba('#fff4be', 0.48);
            ctx.lineWidth = Math.max(1, width * 0.04);
            ctx.beginPath();
            ctx.moveTo(0, -bladeLen * 0.82);
            ctx.lineTo(0, bladeLen * 0.74);
            ctx.stroke();
        } else {
            const arm = Math.max(8, width * 0.72);
            const bar = Math.max(2, width * 0.16);
            const tip = Math.max(2.4, width * 0.2);
            const fill = ctx.createLinearGradient(0, -arm, 0, arm);
            fill.addColorStop(0, '#fff8ef');
            fill.addColorStop(0.45, '#d7dde6');
            fill.addColorStop(1, '#9098a6');
            ctx.fillStyle = fill;
            ctx.strokeStyle = this.hexToRgba('#5f6875', 0.96);
            ctx.lineWidth = Math.max(1, width * 0.07);

            this.traceOrnateCrossPath(ctx, arm, bar, tip);
            ctx.fill();
            ctx.stroke();

            ctx.strokeStyle = this.hexToRgba('#ffffff', 0.42);
            ctx.lineWidth = Math.max(1, width * 0.04);
            ctx.beginPath();
            ctx.moveTo(0, -arm * 0.78);
            ctx.lineTo(0, arm * 0.74);
            ctx.moveTo(-arm * 0.7, 0);
            ctx.lineTo(arm * 0.7, 0);
            ctx.stroke();

            const gemGlow = ctx.createRadialGradient(0, 0, 0, 0, 0, arm * 0.46);
            gemGlow.addColorStop(0, 'rgba(255,240,180,0.36)');
            gemGlow.addColorStop(1, 'rgba(255,240,180,0)');
            ctx.fillStyle = gemGlow;
            ctx.beginPath();
            ctx.arc(0, 0, arm * 0.46, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#f0d48c';
            ctx.beginPath();
            ctx.arc(0, 0, bar * 0.95, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
        if (renderMode === 'both') {
            this.drawConfiguredProjectileSprite(ctx, bullet, zoom, {
                spin,
                minSize: Math.max(8, width)
            });
        }
    }

    traceOrnateCrossPath(ctx, arm, bar, tip) {
        ctx.beginPath();
        ctx.moveTo(bar, -bar);
        ctx.lineTo(bar, -arm + tip);
        ctx.lineTo(tip, -arm + tip);
        ctx.lineTo(0, -arm);
        ctx.lineTo(-tip, -arm + tip);
        ctx.lineTo(-bar, -arm + tip);
        ctx.lineTo(-bar, -bar);
        ctx.lineTo(-arm + tip, -bar);
        ctx.lineTo(-arm + tip, -tip);
        ctx.lineTo(-arm, 0);
        ctx.lineTo(-arm + tip, tip);
        ctx.lineTo(-arm + tip, bar);
        ctx.lineTo(-bar, bar);
        ctx.lineTo(-bar, arm - tip);
        ctx.lineTo(-tip, arm - tip);
        ctx.lineTo(0, arm);
        ctx.lineTo(tip, arm - tip);
        ctx.lineTo(bar, arm - tip);
        ctx.lineTo(bar, bar);
        ctx.lineTo(arm - tip, bar);
        ctx.lineTo(arm - tip, tip);
        ctx.lineTo(arm, 0);
        ctx.lineTo(arm - tip, -tip);
        ctx.lineTo(arm - tip, -bar);
        ctx.closePath();
    }

    drawFireballProjectile(ctx, bullet, width, height, time, angle, zoom) {
        const FIREBALL_ROT_OFFSET = 0; // if needed: Math.PI / 2 or -Math.PI / 2
        const renderMode = this.getWeaponRenderMode(bullet);
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

        if (renderMode === 'sprite' && this.drawConfiguredProjectileSprite(ctx, bullet, zoom, {
            baseAngle: angle,
            extraRotation: FIREBALL_ROT_OFFSET,
            scale: pulse,
            minSize: Math.max(w, h)
        })) {
            return;
        }

        const sprite = this.getWeaponSprite(bullet) || this.game.sprites?.get('weapon_fireball') || this.game.sprites?.get('bullet_fireball');
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
        if (renderMode === 'both') {
            this.drawConfiguredProjectileSprite(ctx, bullet, zoom, {
                baseAngle: angle,
                extraRotation: FIREBALL_ROT_OFFSET,
                scale: pulse,
                minSize: Math.max(w, h)
            });
        }
    }

    drawMagicOrbProjectile(ctx, bullet, width, time, angle, zoom) {
        const len = Math.max(10, width * 1.08);
        const coreR = Math.max(2.4, width * 0.2);
        const seededTime = time + (bullet.visualSeed || 0) * 0.0015;
        const renderMode = this.getWeaponRenderMode(bullet);
        if (renderMode === 'sprite' && this.drawConfiguredProjectileSprite(ctx, bullet, zoom, {
            baseAngle: angle,
            minSize: Math.max(8, width)
        })) return;

        ctx.save();
        ctx.rotate(angle || 0);

        const trail = ctx.createLinearGradient(-len * 1.2, 0, coreR * 0.5, 0);
        trail.addColorStop(0, 'rgba(118,88,180,0)');
        trail.addColorStop(0.65, 'rgba(118,88,180,0.1)');
        trail.addColorStop(1, 'rgba(162,126,232,0.3)');
        ctx.fillStyle = trail;
        ctx.beginPath();
        ctx.ellipse(-len * 0.45, 0, len * 0.52, coreR * 0.58, 0, 0, Math.PI * 2);
        ctx.fill();

        const halo = ctx.createRadialGradient(0, 0, 0, 0, 0, coreR * 1.9);
        halo.addColorStop(0, 'rgba(220,200,255,0.38)');
        halo.addColorStop(1, 'rgba(120,84,196,0)');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(0, 0, coreR * 1.9, 0, Math.PI * 2);
        ctx.fill();

        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, coreR * 1.15);
        g.addColorStop(0, 'rgba(245,236,255,0.9)');
        g.addColorStop(0.42, 'rgba(190,160,246,0.8)');
        g.addColorStop(1, 'rgba(105,72,182,0.72)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(0, 0, coreR, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(255,248,255,0.42)';
        ctx.beginPath();
        ctx.ellipse(coreR * 0.18, -coreR * 0.22, coreR * 0.42, coreR * 0.3, -0.5, 0, Math.PI * 2);
        ctx.fill();

        for (let i = 0; i < 2; i++) {
            const a = seededTime * 5 + i * Math.PI;
            const x = -coreR * 0.65 + Math.cos(a) * coreR * 0.42;
            const y = Math.sin(a) * coreR * 0.3;
            ctx.fillStyle = 'rgba(206,184,248,0.28)';
            ctx.beginPath();
            ctx.arc(x, y, Math.max(0.8, coreR * 0.16), 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
        if (renderMode === 'both') {
            this.drawConfiguredProjectileSprite(ctx, bullet, zoom, {
                baseAngle: angle,
                minSize: Math.max(8, width)
            });
        }
    }

    drawPoisonDartProjectile(ctx, bullet, width, angle, time, zoom) {
        const len = Math.max(7, width * 1.2);
        const body = Math.max(2.2, width * 0.2);
        const renderMode = this.getWeaponRenderMode(bullet);
        if (renderMode === 'sprite' && this.drawConfiguredProjectileSprite(ctx, bullet, zoom, {
            baseAngle: angle,
            minSize: Math.max(8, width * 1.2)
        })) return;

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
        if (renderMode === 'both') {
            this.drawConfiguredProjectileSprite(ctx, bullet, zoom, {
                baseAngle: angle,
                minSize: Math.max(8, width * 1.2)
            });
        }
    }

    drawIcicleProjectile(ctx, bullet, width, angle, time, zoom) {
        const len = Math.max(8, width * 1.5);
        const half = Math.max(2.5, width * 0.25);
        const renderMode = this.getWeaponRenderMode(bullet);
        if (renderMode === 'sprite' && this.drawConfiguredProjectileSprite(ctx, bullet, zoom, {
            baseAngle: angle,
            minSize: Math.max(8, width * 1.5)
        })) return;

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
        if (renderMode === 'both') {
            this.drawConfiguredProjectileSprite(ctx, bullet, zoom, {
                baseAngle: angle,
                minSize: Math.max(8, width * 1.5)
            });
        }
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

    buildPresentationEmissiveConfig() {
        return {
            knife: { kind: 'knife', color: '#ff3b3b', core: '#ffd0d0', alpha: 0.44, tailAlpha: 0.28 },
            knife_super: { kind: 'knife', color: '#f0c34a', core: '#fff1b4', alpha: 0.5, tailAlpha: 0.34 },
            laser: { kind: 'beam', color: '#ff4a4a', alpha: 0.42, width: 12, blur: 16 },
            wand: { kind: 'orb', color: '#7ec4ff', alpha: 0.24, radius: 18 },
            fireball: { kind: 'orb', color: '#ff7d3e', alpha: 0.34, radius: 20 },
            cross: { kind: 'orb', color: '#ffe2a6', alpha: 0.22, radius: 16 },
            bible: { kind: 'orb', color: '#f2ddb5', alpha: 0.16, radius: 13 },
            holy_water: { kind: 'orb', color: '#8ad8ff', alpha: 0.2, radius: 16 },
            lightning: { kind: 'orb', color: '#b4d4ff', alpha: 0.2, radius: 15 }
        };
    }

    getPresentationEmissiveSpec(entity) {
        if (!entity) return null;
        const key = entity.weaponKey || entity.baseKey || entity.type || '';
        if (key === 'knife' || entity.familyKey === 'knife') {
            return entity.isSuper ? this.presentationEmissiveConfig.knife_super : this.presentationEmissiveConfig.knife;
        }
        if (key === 'laser' || entity.type === 'laser') return this.presentationEmissiveConfig.laser;
        if (key === 'wand') return this.presentationEmissiveConfig.wand;
        if (key === 'fireball') return this.presentationEmissiveConfig.fireball;
        if (key === 'cross' || key === 'heaven_sword') return this.presentationEmissiveConfig.cross;
        if (key === 'bible' || key === 'unholy_vespers') return this.presentationEmissiveConfig.bible;
        if (key === 'holy_water' || key === 'holywater') return this.presentationEmissiveConfig.holy_water;
        if (key === 'lightning' || key === 'storm_arc') return this.presentationEmissiveConfig.lightning;
        return null;
    }

    renderPresentationOrb(ctx, pos, spec, pulse = 1) {
        const radius = Math.max(6, spec.radius || 16);
        const color = this.hexToRgb(spec.color || '#ffffff');
        const outer = ctx.createRadialGradient(pos.x, pos.y, radius * 0.12, pos.x, pos.y, radius * 1.12);
        outer.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${Math.min(0.22, spec.alpha * 0.72) * pulse})`);
        outer.addColorStop(0.45, `rgba(${color.r}, ${color.g}, ${color.b}, ${Math.min(0.12, spec.alpha * 0.42) * pulse})`);
        outer.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = outer;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius * 1.12, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = radius * 0.55;
        ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, ${Math.min(0.62, spec.alpha * 0.95)})`;
        ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${Math.min(0.34, spec.alpha)})`;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, Math.max(1.8, radius * 0.18), 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
    }

    renderPresentationBeam(ctx, entity, spec) {
        const points = Array.isArray(entity.pathPoints) && entity.pathPoints.length > 1
            ? entity.pathPoints
            : [{ x: entity.x, y: entity.y }, { x: entity.x + Math.cos(entity.angle || 0) * (entity.range || 300), y: entity.y + Math.sin(entity.angle || 0) * (entity.range || 300) }];
        const color = this.hexToRgb(spec.color || '#ffffff');
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${Math.min(0.28, spec.alpha * 0.7)})`;
        ctx.lineWidth = Math.max(6, spec.width || 12);
        ctx.shadowBlur = spec.blur || 16;
        ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, ${Math.min(0.68, spec.alpha)})`;
        ctx.beginPath();
        points.forEach((point, index) => {
            const pos = this.game.camera.worldToScreen(point.x, point.y);
            if (index === 0) ctx.moveTo(pos.x, pos.y);
            else ctx.lineTo(pos.x, pos.y);
        });
        ctx.stroke();
        ctx.restore();
    }

    renderPresentationKnife(ctx, entity, spec, time = Date.now() / 1000) {
        const pos = this.game.camera.worldToScreen(entity.x, entity.y);
        const angle = Math.atan2(entity.vy || 0, entity.vx || 1);
        const size = entity.drawSize || entity.size || (entity.isSuper ? 34 : 20);
        const len = size * (entity.isSuper ? 1.18 : 1.06) * (this.game.camera.zoom || 1);
        const tailLen = len * 0.95;
        const width = Math.max(2.2, len * 0.11);
        const color = this.hexToRgb(spec.color || '#ffffff');
        const pulse = 0.94 + Math.sin(time * 7.5 + (entity.slotIndex || 0)) * 0.05;

        ctx.save();
        ctx.translate(pos.x, pos.y);
        ctx.rotate(angle);
        const tailGrad = ctx.createLinearGradient(-tailLen, 0, len * 0.15, 0);
        tailGrad.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
        tailGrad.addColorStop(0.62, `rgba(${color.r}, ${color.g}, ${color.b}, ${Math.min(0.26, spec.tailAlpha || 0.22) * pulse})`);
        tailGrad.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, ${Math.min(0.14, spec.alpha * 0.28) * pulse})`);
        ctx.strokeStyle = tailGrad;
        ctx.lineWidth = width * 1.35;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-tailLen, 0);
        ctx.lineTo(len * 0.08, 0);
        ctx.stroke();

        ctx.strokeStyle = `rgba(${color.r}, ${color.g}, ${color.b}, ${Math.min(0.38, spec.alpha * 0.82) * pulse})`;
        ctx.lineWidth = width;
        ctx.shadowBlur = width * 2.2;
        ctx.shadowColor = `rgba(${color.r}, ${color.g}, ${color.b}, ${Math.min(0.62, spec.alpha)})`;
        ctx.beginPath();
        ctx.moveTo(-len * 0.04, 0);
        ctx.lineTo(len * 0.58, 0);
        ctx.stroke();
        ctx.restore();
    }

    renderPresentationEmissives(time = Date.now() / 1000) {
        const ctx = this.ctx;
        const camera = this.game?.camera;
        if (!ctx || !camera) return;

        const projectiles = [
            ...(Array.isArray(this.game?.bullets) ? this.game.bullets : []),
            ...(Array.isArray(this.game?.guardianKnives) ? this.game.guardianKnives : [])
        ];
        if (projectiles.length === 0) return;

        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        for (const entity of projectiles) {
            if (!entity) continue;
            if (entity.type === 'guardian_knife_spawn') continue;
            if (!camera.isVisible || camera.isVisible(entity.x, entity.y, 120)) {
                const spec = this.getPresentationEmissiveSpec(entity);
                if (!spec) continue;
                if (spec.kind === 'beam') {
                    this.renderPresentationBeam(ctx, entity, spec);
                    continue;
                }
                if (spec.kind === 'knife') {
                    this.renderPresentationKnife(ctx, entity, spec, time);
                    continue;
                }
                const pos = camera.worldToScreen(entity.x, entity.y);
                this.renderPresentationOrb(ctx, pos, spec, 0.94 + Math.sin(time * 5.2) * 0.04);
            }
        }
        ctx.restore();
    }

    getProjectileSprite(bullet) {
        const key = bullet.sprite || this.projectileSpriteMap[bullet.subtype || ''] || null;
        return key ? this.game.sprites?.get(key) : null;
    }

    getWeaponSprite(bullet) {
        const key = bullet.weaponSprite || this.weaponSpriteMap[bullet.weaponKey || ''] || null;
        return key ? this.game.sprites?.get(key) : null;
    }

    hexToRgb(hex) {
        if (!hex || typeof hex !== 'string' || !hex.startsWith('#') || hex.length < 7) {
            return { r: 255, g: 255, b: 255 };
        }
        return {
            r: parseInt(hex.slice(1, 3), 16),
            g: parseInt(hex.slice(3, 5), 16),
            b: parseInt(hex.slice(5, 7), 16)
        };
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
