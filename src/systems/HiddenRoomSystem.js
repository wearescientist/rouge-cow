(function attachHiddenRoomSystem(global) {
    'use strict';

    const STORAGE_KEY = 'rougecow_hidden_rooms_v036_merged';
    const HIDDEN_ROOM_VERSION = '0.36.7-hiddenrooms-layout-editor';
    const HIDDEN_LAYOUT_STORAGE_KEY = 'rougecow_hidden_room_layout_editor_v1';

    
const HIDDEN_ROOM_PROFILES = JSON.parse(JSON.stringify((global.HiddenRoomRuntimeData && global.HiddenRoomRuntimeData.profiles) || {}));

    const SECRETROOM_ASSET_BASE = 'assets/runtime/sprites/secretroom/';
    const SECRETROOM_SPRITES = {};
    const SECRETROOM_PROCESSED = {};
    const SECRETROOM_FILES = {
        dec_barrel: 'dec_barrel.png',
        dec_candle: 'dec_candle.png',
        dec_crate: 'dec_crate.png',
        dec_mushroom: 'dec_mushroom.png',
        dec_pillar: 'dec_pillar.png',
        dec_statue: 'dec_statue.png',
        item_book: 'item_book.png',
        item_bread: 'item_bread.png',
        item_coin_bag: 'item_coin_bag.png',
        item_crystal_ball: 'item_crystal_ball.png',
        item_lantern: 'item_lantern.png',
        item_mushroom: 'item_mushroom.png',
        item_skull: 'item_skull.png',
        item_torch: 'item_torch.png',
        desk: 'desk.png',
        set1_mush_01: 'set1_mush_01.png',
        set1_mush_02: 'mushroom/set1_mush_02.png',
        set1_mush_08: 'mushroom/set1_mush_08.png',
        set1_mush_11: 'mushroom/set1_mush_11.png',
        set1_mush_13: 'mushroom/set1_mush_13.png',
        set2_mush_01: 'mushroom/set2_mush_01.png',
        set2_mush_02: 'mushroom/set2_mush_02.png',
        set2_mush_05: 'mushroom/set2_mush_05.png',
        set2_mush_12: 'mushroom/set2_mush_12.png',
        set2_mush_15: 'mushroom/set2_mush_15.png',
        set2_mush_16: 'mushroom/set2_mush_16.png',
        set5_mush_01: 'mushroom/set5_mush_01.png',
        set5_mush_02: 'set5_mush_02.png',
        set5_mush_09: 'mushroom/set5_mush_09.png',
        set5_mush_10: 'mushroom/set5_mush_10.png',
        set5_mush_11: 'mushroom/set5_mush_11.png',
        set5_mush_16: 'set5_mush_16.png',
        cluster_mush_01: 'mushroom/cluster_mush_01.png',
        cluster_mush_02: 'mushroom/cluster_mush_02.png',
        cluster_mush_03: 'mushroom/cluster_mush_03.png',
        cluster_mush_04: 'mushroom/cluster_mush_04.png',
        cluster_mush_05: 'mushroom/cluster_mush_05.png',
        cluster_mush_06: 'mushroom/cluster_mush_06.png',
        rabbit_black_1: 'rabbit_black_walk_01.png',
        rabbit_black_2: 'rabbit_black_walk_02.png',
        rabbit_black_3: 'rabbit_black_walk_03.png',
        rabbit_black_4: 'rabbit_black_walk_04.png',
        layer1_set2_floor_crack: 'layer1_set2_floor_crack.png',
        layer1_set2_floor_detail: 'layer1_set2_floor_detail.png',
        layer1_set2_wall_bottom: 'layer1_set2_wall_bottom.png',
        layer1_set2_wall_glowing: 'layer1_set2_wall_glowing.png',
        layer1_set3_floor_crack: 'layer1_set3_floor_crack.png',
        layer1_set4_floor_crack: 'layer1_set4_floor_crack.png',
        layer1_set5_floor_crack: 'layer1_set5_floor_crack.png',
        layer1_set5_wall_glowing: 'layer1_set5_wall_glowing.png',
        layer1_wall_glowing: 'layer1_wall_glowing.png'
    };

    const FLOOR4_QUESTIONS = Array.isArray(global.HiddenRoomRuntimeData?.floor4Questions) ? global.HiddenRoomRuntimeData.floor4Questions.map((entry) => ({ ...entry })) : [
        { category: 'torch', answer: 2 },
        { category: 'pillar', answer: 3 },
        { category: 'mushroom', answer: 1 }
    ];
    const FLOOR4_ANSWER_VALUES = Array.isArray(global.HiddenRoomRuntimeData?.floor4AnswerValues) ? global.HiddenRoomRuntimeData.floor4AnswerValues.slice() : [1, 2, 3, 4, 5, 6];

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function easeOutCubic(t) {
        const x = clamp(t, 0, 1);
        return 1 - Math.pow(1 - x, 3);
    }

    function drawHiddenFilmOverlay(ctx, room, floor, time) {
        const canvas = ctx && ctx.canvas;
        if (!canvas) return;
        const w = canvas.width || 0;
        const h = canvas.height || 0;
        if (!w || !h) return;
        const cx = w * 0.5;
        const cy = h * 0.5;
        const edgeAlpha = floor === 6 ? 0.075 : 0.09;
        const tint = floor === 6
            ? { r: 255, g: 212, b: 160 }
            : (floor === 5
                ? { r: 164, g: 240, b: 210 }
                : { r: 146, g: 210, b: 255 });

        ctx.save();
        const vignette = ctx.createRadialGradient(cx, cy, Math.min(w, h) * 0.22, cx, cy, Math.max(w, h) * 0.74);
        vignette.addColorStop(0, 'rgba(0,0,0,0)');
        vignette.addColorStop(0.72, 'rgba(0,0,0,0.012)');
        vignette.addColorStop(1, `rgba(0,0,0,${edgeAlpha})`);
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, w, h);

        const pulse = 0.5 + Math.sin(time * 0.75) * 0.5;
        const centerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.30);
        centerGlow.addColorStop(0, `rgba(${tint.r},${tint.g},${tint.b},${floor === 6 ? 0.012 : 0.007})`);
        centerGlow.addColorStop(0.5, `rgba(${tint.r},${tint.g},${tint.b},${floor === 6 ? 0.005 : 0.003})`);
        centerGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = 0.22 + pulse * 0.03;
        ctx.fillStyle = centerGlow;
        ctx.fillRect(0, 0, w, h);
        ctx.restore();
    }

    function roomWidth(room) {
        return Number.isFinite(room?.width) ? room.width : 720;
    }

    function roomHeight(room) {
        return Number.isFinite(room?.height) ? room.height : 520;
    }

    function roomCenterX(room) {
        if (Number.isFinite(room?.centerX)) return room.centerX;
        if (Number.isFinite(room?.x)) return room.x + roomWidth(room) * 0.5;
        return roomWidth(room) * 0.5;
    }

    function roomCenterY(room) {
        if (Number.isFinite(room?.centerY)) return room.centerY;
        if (Number.isFinite(room?.y)) return room.y + roomHeight(room) * 0.5;
        return roomHeight(room) * 0.5;
    }

    function parseHexColor(hex) {
        if (typeof hex !== 'string') return null;
        const normalized = hex.trim();
        if (!normalized.startsWith('#')) return null;
        const raw = normalized.slice(1);
        if (raw.length === 3) {
            const r = parseInt(raw[0] + raw[0], 16);
            const g = parseInt(raw[1] + raw[1], 16);
            const b = parseInt(raw[2] + raw[2], 16);
            return { r, g, b };
        }
        if (raw.length === 6) {
            const r = parseInt(raw.slice(0, 2), 16);
            const g = parseInt(raw.slice(2, 4), 16);
            const b = parseInt(raw.slice(4, 6), 16);
            return { r, g, b };
        }
        return null;
    }

    function toRgba(color, alpha) {
        if (typeof color === 'string' && color.startsWith('rgba(')) return color;
        const rgb = parseHexColor(color);
        if (!rgb) return `rgba(255,255,255,${alpha})`;
        return `rgba(${rgb.r},${rgb.g},${rgb.b},${alpha})`;
    }

    function getHiddenVisualTuning() {
        const tuning = global.game?.debugVisualTuning || {};
        return {
            wormBrightness: Number.isFinite(tuning.wormBrightness) ? tuning.wormBrightness : 1.9,
            mushroomBrightness: Number.isFinite(tuning.mushroomBrightness) ? tuning.mushroomBrightness : 1.35,
            lanternBrightness: Number.isFinite(tuning.lanternBrightness) ? tuning.lanternBrightness : 1.12
        };
    }

    function drawRoundedRectPath(ctx, x, y, w, h, r) {
        const radius = Math.max(0, Math.min(r || 0, w * 0.5, h * 0.5));
        if (typeof ctx.roundRect === 'function') {
            ctx.beginPath();
            ctx.roundRect(x, y, w, h, radius);
            return;
        }
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + w, y, x + w, y + h, radius);
        ctx.arcTo(x + w, y + h, x, y + h, radius);
        ctx.arcTo(x, y + h, x, y, radius);
        ctx.arcTo(x, y, x + w, y, radius);
    }


    const HIDDEN_RADIAL_CACHE = new Map();

    function getCachedHiddenRadialSprite(options = {}) {
        const size = Math.max(24, Math.round(options.size || 128));
        const key = [
            size,
            options.color || '#ffffff',
            ...(options.stops || [[0, 0.3], [0.56, 0.12], [1, 0]])
                .map((entry) => `${Number(entry[0]).toFixed(3)}:${Number(entry[1]).toFixed(4)}`)
        ].join('|');
        if (HIDDEN_RADIAL_CACHE.has(key)) return HIDDEN_RADIAL_CACHE.get(key);
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        const cx = size * 0.5;
        const cy = size * 0.5;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, size * 0.5);
        const stops = options.stops || [[0, 0.3], [0.56, 0.12], [1, 0]];
        stops.forEach(([stop, alpha]) => grad.addColorStop(stop, toRgba(options.color || '#ffffff', alpha)));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(cx, cy, size * 0.5, 0, Math.PI * 2);
        ctx.fill();
        HIDDEN_RADIAL_CACHE.set(key, canvas);
        return canvas;
    }

    function drawCachedHiddenRadial(ctx, x, y, radiusX, radiusY, color, stops, options = {}) {
        if (!Number.isFinite(x) || !Number.isFinite(y) || radiusX <= 0 || radiusY <= 0) return;
        const sprite = getCachedHiddenRadialSprite({ color, stops, size: options.size || 128 });
        ctx.save();
        if (options.composite) ctx.globalCompositeOperation = options.composite;
        if (Number.isFinite(options.alpha)) ctx.globalAlpha *= options.alpha;
        if (options.rotation) {
            ctx.translate(x, y);
            ctx.rotate(options.rotation);
            ctx.drawImage(sprite, -radiusX, -radiusY, radiusX * 2, radiusY * 2);
        } else {
            ctx.drawImage(sprite, x - radiusX, y - radiusY, radiusX * 2, radiusY * 2);
        }
        ctx.restore();
    }


    function spawnDamageText(game, x, y, text, color, size, life) {
        if (!game?.damageNumbers || !Number.isFinite(x) || !Number.isFinite(y)) return;
        game.damageNumbers.spawn(x, y, text, {
            color: color || '#ffffff',
            size: size || 14,
            life: life || 1.2
        });
    }

    function cameraShake(game, intensity, duration) {
        const camera = game?.camera;
        if (camera && typeof camera.shake === 'function') {
            camera.shake(intensity, duration || 0.35);
        }
    }

    function sparkle(game, x, y, color, count) {
        if (!game?.particles) return;
        if (typeof game.particles.sparkle === 'function') game.particles.sparkle(x, y, color, count || 12);
        if (typeof game.particles.burst === 'function') game.particles.burst(x, y, color, Math.max(6, Math.floor((count || 12) * 0.65)));
    }

    function getSecretroomSprite(key) {
        const file = SECRETROOM_FILES[key];
        if (!file) return null;
        let img = SECRETROOM_SPRITES[key];
        if (img) return img;
        img = new Image();
        img.src = SECRETROOM_ASSET_BASE + file;
        img.decoding = 'async';
        SECRETROOM_SPRITES[key] = img;
        return img;
    }

    function getProcessedSecretroomSprite(key) {
        const cached = SECRETROOM_PROCESSED[key];
        if (cached) return cached;
        const img = getSecretroomSprite(key);
        if (!img || !img.complete || !img.naturalWidth) return null;

        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const srcCanvas = document.createElement('canvas');
        srcCanvas.width = w;
        srcCanvas.height = h;
        const srcCtx = srcCanvas.getContext('2d');
        srcCtx.drawImage(img, 0, 0, w, h);
        const imageData = srcCtx.getImageData(0, 0, w, h);
        const data = imageData.data;

        let minX = w;
        let minY = h;
        let maxX = -1;
        let maxY = -1;
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const i = (y * w + x) * 4;
                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];
                const a = data[i + 3];
                if (a === 0) continue;
                const nearBlack = r < 18 && g < 18 && b < 18;
                const bottomWatermark = y > h * 0.86 && r > 180 && g > 180 && b > 180;
                if (nearBlack || bottomWatermark) {
                    data[i + 3] = 0;
                    continue;
                }
                if (data[i + 3] > 12) {
                    if (x < minX) minX = x;
                    if (y < minY) minY = y;
                    if (x > maxX) maxX = x;
                    if (y > maxY) maxY = y;
                }
            }
        }
        srcCtx.putImageData(imageData, 0, 0);
        if (maxX < minX || maxY < minY) return img;

        const pad = 2;
        const cropX = Math.max(0, minX - pad);
        const cropY = Math.max(0, minY - pad);
        const cropW = Math.min(w - cropX, (maxX - minX + 1) + pad * 2);
        const cropH = Math.min(h - cropY, (maxY - minY + 1) + pad * 2);
        const out = document.createElement('canvas');
        out.width = cropW;
        out.height = cropH;
        out.getContext('2d').drawImage(srcCanvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
        SECRETROOM_PROCESSED[key] = out;
        return out;
    }

    function drawSpriteCentered(ctx, camera, key, x, y, drawW, drawH, options = {}) {
        const raw = getSecretroomSprite(key);
        if (!raw || !raw.complete || !raw.naturalWidth) return false;
        const img = options.raw ? raw : (getProcessedSecretroomSprite(key) || raw);
        const srcW = Math.max(1, img.naturalWidth || img.width || drawW || 1);
        const srcH = Math.max(1, img.naturalHeight || img.height || drawH || 1);
        const exactSize = !!options.exactSize;
        const fitScale = exactSize ? 1 : Math.min(
            Math.max(1, drawW || srcW) / srcW,
            Math.max(1, drawH || srcH) / srcH
        );
        const renderW = exactSize ? Math.max(1, drawW || srcW) : (srcW * fitScale);
        const renderH = exactSize ? Math.max(1, drawH || srcH) : (srcH * fitScale);
        const pos = camera.worldToScreen(x, y);
        const brightness = Number.isFinite(options.brightness) ? options.brightness : 1;
        const glowAlpha = Number.isFinite(options.glowAlpha) ? options.glowAlpha : 0.30;
        const glowBlur = Number.isFinite(options.glowBlur) ? options.glowBlur : 16;
        ctx.save();
        ctx.translate(pos.x, pos.y + (options.offsetY || 0));
        if (options.rotation) ctx.rotate(options.rotation);
        const stretchX = Number.isFinite(options.scaleX) ? options.scaleX : 1;
        const stretchY = Number.isFinite(options.scaleY) ? options.scaleY : 1;
        if (options.flipX || stretchX !== 1 || stretchY !== 1) ctx.scale((options.flipX ? -1 : 1) * stretchX, stretchY);
        const baseAlpha = Number.isFinite(options.alpha) ? options.alpha : 1;
        const halfW = renderW * 0.5;
        const halfH = renderH * 0.5;

        if (options.glow) {
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            ctx.globalAlpha = baseAlpha * glowAlpha;
            ctx.shadowColor = options.glowColor || 'rgba(143,220,255,0.9)';
            ctx.shadowBlur = glowBlur;
            if (brightness !== 1) ctx.filter = `brightness(${brightness})`;
            ctx.drawImage(img, -halfW, -halfH, renderW, renderH);
            ctx.restore();
        }

        ctx.globalAlpha = baseAlpha;
        if (brightness !== 1) ctx.filter = `brightness(${brightness})`;
        if (options.tint) {
            ctx.drawImage(img, -halfW, -halfH, renderW, renderH);
            ctx.globalCompositeOperation = 'source-atop';
            ctx.fillStyle = options.tint;
            ctx.fillRect(-halfW, -halfH, renderW, renderH);
        } else {
            ctx.drawImage(img, -halfW, -halfH, renderW, renderH);
        }
        ctx.restore();
        return true;
    }

    function drawImageCentered(ctx, camera, image, x, y, drawW, drawH, options = {}) {
        if (!image || !(image.complete || image.width) || !(image.naturalWidth || image.width)) return false;
        const srcW = Math.max(1, image.naturalWidth || image.width || drawW || 1);
        const srcH = Math.max(1, image.naturalHeight || image.height || drawH || 1);
        const exactSize = !!options.exactSize;
        const fitScale = exactSize ? 1 : Math.min(
            Math.max(1, drawW || srcW) / srcW,
            Math.max(1, drawH || srcH) / srcH
        );
        const renderW = exactSize ? Math.max(1, drawW || srcW) : (srcW * fitScale);
        const renderH = exactSize ? Math.max(1, drawH || srcH) : (srcH * fitScale);
        const pos = camera.worldToScreen(x, y);
        ctx.save();
        ctx.translate(pos.x, pos.y + (options.offsetY || 0));
        if (options.rotation) ctx.rotate(options.rotation);
        const stretchX = Number.isFinite(options.scaleX) ? options.scaleX : 1;
        const stretchY = Number.isFinite(options.scaleY) ? options.scaleY : 1;
        if (options.flipX || stretchX !== 1 || stretchY !== 1) ctx.scale((options.flipX ? -1 : 1) * stretchX, stretchY);
        ctx.globalAlpha = Number.isFinite(options.alpha) ? options.alpha : 1;
        const halfW = renderW * 0.5;
        const halfH = renderH * 0.5;
        ctx.drawImage(image, -halfW, -halfH, renderW, renderH);
        ctx.restore();
        return true;
    }

    function pushGlow(room, x, y, radius, color, alpha, pulse, hiddenScale) {
        room.hiddenLightSources = room.hiddenLightSources || [];
        room.hiddenLightSources.push({ x, y, radius, color, alpha, pulse: pulse || 0, hiddenScale: Number.isFinite(hiddenScale) ? hiddenScale : 1 });
    }

    function addDecor(room, decor) {
        room.hiddenDecor = room.hiddenDecor || [];
        room.hiddenDecor.push(decor);
        if (decor.light) {
            pushGlow(
                room,
                decor.x,
                decor.y + (decor.light.offsetY || 0),
                decor.light.radius || 56,
                decor.light.color || '#ffffff',
                decor.light.alpha || 0.2,
                decor.light.pulse || 0,
                decor.light.hiddenScale
            );
        }
    }

    function makeMotes(room, floor) {
        const cx = roomCenterX(room);
        const cy = roomCenterY(room);
        const spreadX = Math.max(250, roomWidth(room) * 0.42);
        const spreadY = Math.max(180, roomHeight(room) * 0.34);
        const profile = HIDDEN_ROOM_PROFILES[floor];
        room.hiddenMotes = [];
        for (let i = 0; i < 18; i++) {
            room.hiddenMotes.push({
                x: cx + Math.cos((i / 18) * Math.PI * 2) * (spreadX * (0.45 + (i % 3) * 0.18)),
                y: cy + Math.sin((i / 18) * Math.PI * 2) * (spreadY * (0.42 + (i % 4) * 0.14)),
                radius: 3 + (i % 3),
                speed: 0.5 + (i % 5) * 0.14,
                phase: i * 0.73,
                color: profile.color
            });
        }
    }

    function buildFloorDecor(room, floor) {
        room.hiddenDecor = [];
        room.hiddenLightSources = [];
        room.hiddenMotes = [];
        room.environmentLights = [];
        const cx = roomCenterX(room);
        const cy = roomCenterY(room);
        const spreadX = Math.max(250, roomWidth(room) * 0.36);
        const spreadY = Math.max(170, roomHeight(room) * 0.28);

        const anchorColor = floor === 6 ? { r: 255, g: 214, b: 168 } : { r: 126, g: 186, b: 214 };
        room.environmentLights.push({
            kind: 'room_anchor',
            x: cx,
            y: cy + 8,
            radiusX: Math.max(112, spreadX * 0.54),
            radiusY: Math.max(76, spreadY * 0.44),
            bloomRadius: 18,
            color: anchorColor,
            alpha: floor === 6 ? 0.006 : 0.004,
            reveal: floor === 6 ? 0.05 : 0.04,
            clarity: 0.02,
            colorizeAlpha: floor === 6 ? 0.006 : 0.004,
            bloomAlpha: 0.004,
            haloAlpha: 0.003,
            preserveSharpness: 0.05,
            preferColor: true,
            pulseSpeed: 0.55,
            pulseAmount: 0.012
        });

        if (floor === 1) {
            pushGlow(room, cx, cy + 4, 28, '#9ddcff', 0.018, 0.02, 0.86);
            room.environmentLights.push({
                kind: 'room_template_side',
                x: cx - 300,
                y: cy + 6,
                radiusX: 88,
                radiusY: 74,
                bloomRadius: 18,
                color: { r: 118, g: 222, b: 255 },
                alpha: 0.008,
                reveal: 0.05,
                clarity: 0.03,
                colorizeAlpha: 0.010,
                bloomAlpha: 0.006,
                haloAlpha: 0.004,
                preserveSharpness: 0.06,
                preferColor: true,
                pulseSpeed: 0.7,
                pulseAmount: 0.015
            });
        } else if (floor === 2) {
            pushGlow(room, cx, cy, 54, '#78d5ee', 0.030, 0.03, 0.92);
            room.environmentLights.push({
                kind: 'room_worm_stage',
                x: cx,
                y: cy + 6,
                radiusX: 128,
                radiusY: 92,
                bloomRadius: 24,
                color: { r: 118, g: 213, b: 238 },
                alpha: 0.010,
                reveal: 0.07,
                clarity: 0.03,
                colorizeAlpha: 0.012,
                bloomAlpha: 0.008,
                haloAlpha: 0.006,
                preserveSharpness: 0.06,
                preferColor: true,
                pulseSpeed: 0.7,
                pulseAmount: 0.015
            });
        } else if (floor === 3) {
            pushGlow(room, cx, cy - 12, 24, '#b893ff', 0.018, 0.03, 0.86);
        } else if (floor === 4) {
            pushGlow(room, cx, cy - 16, 26, '#8fdcff', 0.020, 0.03, 0.88);
        } else if (floor === 5) {
            pushGlow(room, cx, cy, 22, '#9ff2cf', 0.014, 0.02, 0.84);
        } else if (floor === 6) {
            room.environmentLights.push({
                kind: 'legacy_table_warm',
                x: cx - 8,
                y: cy - 8,
                radiusX: 96,
                radiusY: 62,
                bloomRadius: 24,
                color: { r: 255, g: 210, b: 148 },
                alpha: 0.010,
                reveal: 0.06,
                clarity: 0.03,
                colorizeAlpha: 0.012,
                bloomAlpha: 0.008,
                haloAlpha: 0.006,
                preserveSharpness: 0.08,
                preferColor: true,
                pulseSpeed: 0.65,
                pulseAmount: 0.015
            });
        }
    }

    function buildPuzzleNodes(room, floor, progress) {
        const cx = roomCenterX(room);
        const cy = roomCenterY(room);
        const spreadX = Math.max(250, roomWidth(room) * 0.36);
        const spreadY = Math.max(170, roomHeight(room) * 0.28);
        const nodes = [];

        buildFloorDecor(room, floor);

        if (floor === 1) {
            const offsets = [
                [-spreadX * 0.56, -spreadY * 0.44], [-spreadX * 0.56, 0], [-spreadX * 0.56, spreadY * 0.44],
                [spreadX * 0.56, -spreadY * 0.44], [spreadX * 0.56, 0], [spreadX * 0.56, spreadY * 0.44]
            ];
            offsets.forEach((offset, index) => {
                const x = cx + offset[0];
                const y = cy + offset[1];
                nodes.push({ kind: 'candle', index, x, y, radius: 108 });
            });
        } else if (floor === 2) {
            const critterOffsets = [
                [-spreadX * 0.52, -spreadY * 0.24],
                [spreadX * 0.48, -spreadY * 0.18],
                [0, spreadY * 0.36]
            ];
            const killedIds = new Set(progress.puzzleState.killedIds || []);
            room.hiddenWormCritters = critterOffsets.map((offset, index) => ({
                kind: 'hidden_worm',
                id: `floor2_worm_${index}`,
                x: cx + offset[0],
                y: cy + offset[1],
                baseX: cx + offset[0],
                baseY: cy + offset[1],
                vx: index % 2 === 0 ? 74 + index * 8 : -72 - index * 7,
                vy: index < 2 ? 44 + index * 4 : -42,
                radius: 34,
                alive: !killedIds.has(`floor2_worm_${index}`),
                hue: '#ff7fae'
            }));
            progress.puzzleState.targetCount = 3;
            progress.puzzleState.killedCount = room.hiddenWormCritters.filter(item => !item.alive).length;
        } else if (floor === 3) {
            const runSeed = String((global.game || {}).runSeed || 'seed');
            const rng = seededRng(runSeed + '-hidden-floor3-layout');
            const baseOffsets = [
                [-spreadX * 0.46, -spreadY * 0.44], [-spreadX * 0.10, -spreadY * 0.58], [spreadX * 0.38, -spreadY * 0.34],
                [spreadX * 0.26, spreadY * 0.12], [-spreadX * 0.28, spreadY * 0.32], [spreadX * 0.06, spreadY * 0.48]
            ];
            baseOffsets.forEach((offset, index) => {
                const jitterX = (rng() - 0.5) * 46;
                const jitterY = (rng() - 0.5) * 34;
                nodes.push({ kind: 'mushroom', index, x: cx + offset[0] + jitterX, y: cy + offset[1] + jitterY, radius: 64, spriteKey: 'dec_mushroom' });
            });
        } else if (floor === 4) {
            const answerOffsets = [
                [-spreadX * 0.62, spreadY * 0.56],
                [-spreadX * 0.36, spreadY * 0.62],
                [-spreadX * 0.10, spreadY * 0.66],
                [spreadX * 0.10, spreadY * 0.66],
                [spreadX * 0.36, spreadY * 0.62],
                [spreadX * 0.62, spreadY * 0.56]
            ];
            answerOffsets.forEach((offset, i) => {
                nodes.push({ kind: 'answer', answerValue: FLOOR4_ANSWER_VALUES[i], label: String(FLOOR4_ANSWER_VALUES[i]), x: cx + offset[0], y: cy + offset[1], radius: 64 });
                pushGlow(room, cx + offset[0], cy + offset[1], 56, '#7fcfff', 0.12, 0.14);
            });
        } else if (floor === 5) {
            const targetOffsets = [[-spreadX * 0.50, -spreadY * 0.18], [0, spreadY * 0.44], [spreadX * 0.50, -spreadY * 0.18]];
            const blockerOffsets = [[-spreadX * 0.34, spreadY * 0.12], [0, -spreadY * 0.56], [spreadX * 0.34, spreadY * 0.12]];
            room.hiddenSealTargets = targetOffsets.map((offset, index) => ({
                index,
                x: cx + offset[0],
                y: cy + offset[1],
                radius: 42
            }));
            room.hiddenBlockers = blockerOffsets.map((offset, index) => {
                const sealed = !!progress.puzzleState.blocked?.[index];
                const target = sealed ? room.hiddenSealTargets[index] : null;
                return {
                    index,
                    x: target ? target.x : (cx + offset[0]),
                    y: target ? target.y : (cy + offset[1]),
                    homeX: cx + offset[0],
                    homeY: cy + offset[1],
                    radius: 40,
                    spriteKey: 'dec_statue',
                    drawW: 92,
                    drawH: 92,
                    sealed
                };
            });
            room.hiddenSealTargets.forEach(t => nodes.push({ kind: 'seal_target', index: t.index, x: t.x, y: t.y, radius: t.radius }));
            room.hiddenBlockers.forEach(b => nodes.push({ kind: 'seal_blocker', index: b.index, x: b.x, y: b.y, radius: b.radius, spriteKey: b.spriteKey, drawW: b.drawW, drawH: b.drawH, sealed: !!b.sealed }));
            room.hiddenDecorMushrooms = [
                { id: 'f5_decor_top_l', floor: 5, sealIndex: 0, x: cx - spreadX * 0.22, y: cy - spreadY * 0.48, spriteKey: 'set5_mush_16', drawW: 84, drawH: 84, offsetY: -6, glowColor: '#a8f2d8', phase: 0.3 },
                { id: 'f5_decor_top_r', floor: 5, sealIndex: 0, x: cx + spreadX * 0.22, y: cy - spreadY * 0.48, spriteKey: 'set5_mush_02', drawW: 88, drawH: 88, offsetY: -6, glowColor: '#9de8d0', phase: 0.9 },
                { id: 'f5_decor_left', floor: 5, sealIndex: 1, x: cx - spreadX * 0.60, y: cy + spreadY * 0.18, spriteKey: 'set5_mush_16', drawW: 86, drawH: 86, offsetY: -6, glowColor: '#98e8ca', phase: 1.5 },
                { id: 'f5_decor_right', floor: 5, sealIndex: 2, x: cx + spreadX * 0.60, y: cy + spreadY * 0.18, spriteKey: 'set5_mush_02', drawW: 90, drawH: 90, offsetY: -6, glowColor: '#a6efd2', phase: 2.2 },
                { id: 'f5_decor_core', floor: 5, alwaysOn: true, x: cx, y: cy + spreadY * 0.42, spriteKey: 'set5_mush_16', drawW: 92, drawH: 92, offsetY: -6, glowColor: '#b6ffe3', phase: 2.9 }
            ];
        } else if (floor === 6) {
            room.hiddenConvergencePoint = { x: cx, y: cy + 6, radius: 56 };
            room.hiddenConvergenceStreams = [0, 1, 2, 3].map((id, index) => {
                const angle = -Math.PI * 0.5 + (index / 4) * Math.PI * 2;
                return {
                    x: cx + Math.cos(angle) * spreadX * 0.72,
                    y: cy + Math.sin(angle) * spreadY * 0.78
                };
            });
        }

        if (Array.isArray(room.hiddenTemplateCells)) {
            room.hiddenTemplateCells.forEach((cell, index) => registerLayoutTarget(cell, `template_${index}`, `模板蘑菇${index + 1}`));
        }
        nodes.forEach((node, index) => {
            const id = node.kind === 'memory_mushroom' ? `memory_${index}` : (typeof node.index === 'number' ? `${node.kind}_${node.index}` : `${node.kind}_${index}`);
            registerLayoutTarget(node, id, labelForNodeKind(node));
        });
        if (room.hiddenLegacyTable) registerLayoutTarget(room.hiddenLegacyTable, 'legacy_table', '桌子');
        if (room.hiddenLegacyCandle) registerLayoutTarget(room.hiddenLegacyCandle, 'legacy_candle', '桌上蜡烛');
        room.hiddenPuzzleNodes = nodes;
        room.hiddenOrb = { kind: 'orb', x: cx, y: cy + 8, radius: 58 };
    }

    function triggerRoomPulse(room, strength, duration) {
        room.hiddenPulse = {
            strength: strength || 1,
            time: duration || 0.6,
            maxTime: duration || 0.6
        };
    }

    function triggerOrbFlash(room, color, intensity, duration) {
        if (!room) return;
        room.hiddenOrbFlash = {
            color: color || room.hiddenProfile?.color || '#ffffff',
            intensity: Number.isFinite(intensity) ? intensity : 1,
            time: duration || 0.26,
            maxTime: duration || 0.26
        };
    }

    function triggerStepFeedback(game, room, floor, x, y, text, color) {
        const profile = getProfile(floor);
        const useColor = color || profile.color;
        triggerRoomPulse(room, 0.22, 0.22);
        triggerOrbFlash(room, useColor, 0.9, 0.22);
        cameraShake(game, 3.2, 0.18);
        sparkle(game, x, y, useColor, 7);
    }

    function markCompleted(game, room, floor) {
        const profile = getProfile(floor);
        const progress = getFloorProgress(game, floor);
        if (progress.completed) return;

        progress.completed = true;
        progress.failed = false;
        progress.phase = 'solved_anim';
        progress.crystalState = 'awakening';
        progress.solveAnimTimer = 0.9;
        progress.crystalActivated = false;
        room.cleared = true;
        room.hiddenCompletionTime = 1.8;
        triggerRoomPulse(room, 1, 1.2);
        triggerOrbFlash(room, profile.color, 1.5, 0.72);

        recompute(game.hiddenRooms);
        saveState(game);
        cameraShake(game, 7, 0.9);
        sparkle(game, room.hiddenOrb?.x || roomCenterX(room), room.hiddenOrb?.y || roomCenterY(room), profile.color, 20);
    }

    function markFailed(game, room, floor, message) {
        const profile = getProfile(floor);
        const progress = getFloorProgress(game, floor);
        if (progress.failed) return;
        progress.failed = true;
        progress.phase = 'failed_locked';
        progress.crystalState = 'dormant';
        room.hiddenFailureTime = 1.6;
        triggerRoomPulse(room, 0.65, 0.9);
        triggerOrbFlash(room, '#9aa3b2', 0.72, 0.42);
        saveState(game);
        cameraShake(game, 5, 0.7);
        sparkle(game, room.hiddenOrb?.x || roomCenterX(room), room.hiddenOrb?.y || roomCenterY(room), '#8a90a0', 12);

    }

    function playCrystalVoiceTick(kind) {
        global.AudioRuntimeBridge?.playPulse({
            type: 'triangle',
            startFreq: kind === '爸爸' ? 190 : 280,
            endFreq: kind === '爸爸' ? 150 : 220,
            volume: 0.045,
            duration: 0.05
        });
    }

    function showNote(profile, extraHtml) {
        const existing = document.getElementById('hiddenRoomNoteCard');
        if (existing) existing.remove();

        const speaker = profile?.noteSpeaker || '妈妈';
        const card = document.createElement('div');
        card.id = 'hiddenRoomNoteCard';
        card.style.cssText = [
            'position:fixed',
            'left:50%',
            'bottom:28px',
            'transform:translateX(-50%)',
            'width:min(860px, calc(100vw - 36px))',
            'padding:14px 18px 16px',
            'border-radius:14px',
            'border:1px solid rgba(255,255,255,0.12)',
            'border-top:2px solid ' + (profile?.color || '#b9f4ff'),
            'background:rgba(0,0,0,0.70)',
            'color:#f5f2ff',
            'z-index:25000',
            'box-shadow:0 14px 40px rgba(0,0,0,0.35)',
            'line-height:1.7',
            'font-family:Arial,sans-serif',
            'backdrop-filter:blur(3px)'
        ].join(';');
        card.innerHTML = `
            <div style="font-size:12px;color:${profile?.color || '#b9f4ff'};letter-spacing:0.08em;margin-bottom:8px;">水晶球里传来${speaker}的声音：</div>
            <div class="hidden-room-note-text" style="font-size:17px;color:#f3f0e8;white-space:pre-line;min-height:54px;"></div>
            ${extraHtml ? `<div style="margin-top:10px;font-size:12px;color:#bcb7c8;">${extraHtml}</div>` : ''}
        `;
        document.body.appendChild(card);
        const textEl = card.querySelector('.hidden-room-note-text');
        const fullText = String(profile?.note || '');
        let idx = 0;
        const timer = setInterval(() => {
            if (idx < fullText.length) {
                textEl.textContent += fullText[idx];
                idx += 1;
                if (idx % 2 === 0) playCrystalVoiceTick(speaker);
            } else {
                clearInterval(timer);
            }
        }, 76);
        const close = () => {
            clearInterval(timer);
            card.remove();
        };
        const autoTimer = setTimeout(close, Math.max(6200, fullText.length * 170 + 2400));
        card.addEventListener('click', () => {
            clearTimeout(autoTimer);
            close();
        }, { once: true });
    }

    function getHiddenInteractable(game, room) {
        if (!room || room.type !== 'hidden' || !game?.player) return null;
        const floor = getFloor(game, room);
        const progress = getFloorProgress(game, floor);
        const candidates = [];
        const px = Number.isFinite(game.player.cx) ? game.player.cx : game.player.x;
        const py = Number.isFinite(game.player.cy) ? game.player.cy : game.player.y;

        getSortedEditorList(room.hiddenPuzzleNodes || []).forEach(node => {
            if (node.kind === 'mushroom' || node.kind === 'seal_target' || node.kind === 'seal_blocker') return;
            if (floor === 4 && progress.failed) return;
            const bonus = node.kind === 'candle' ? 18 : 10;
            const d = Math.hypot(px - node.x, py - node.y);
            if (d <= ((node.radius || 56) + bonus)) candidates.push({ target: node, dist: d, weight: 0 });
        });

        const orbReady = progress.phase === 'awakened' || progress.phase === 'played' || progress.witnessed;
        if (room.hiddenOrb && orbReady) {
            const d = Math.hypot(px - room.hiddenOrb.x, py - room.hiddenOrb.y);
            if (d <= 112) candidates.push({ target: room.hiddenOrb, dist: d, weight: 0 });
        }

        if (candidates.length <= 0) return null;
        candidates.sort((a, b) => (a.weight - b.weight) || (a.dist - b.dist));
        return candidates[0].target;
    }

    function isFloor1Solved(progress) {
        const states = progress.puzzleState.candleStates || [];
        if (states.length !== 6) return false;
        return states.every(Boolean);
    }

    function countFloor1Lit(progress) {
        const states = progress?.puzzleState?.candleStates || [];
        return states.reduce((acc, v) => acc + (v ? 1 : 0), 0);
    }

    function resetFloor3Preview(progress) {
        progress.puzzleState.stage = 'preview';
        progress.puzzleState.previewRound = 0;
        progress.puzzleState.previewStep = 0;
        progress.puzzleState.previewLit = false;
        progress.puzzleState.previewTimer = 0.45;
        progress.puzzleState.activePreviewIndex = -1;
        progress.puzzleState.inputIndex = 0;
        progress.puzzleState.lastTriggeredNode = -1;
        progress.puzzleState.replayTimer = 0;
        progress.puzzleState.cooldown = 0;
        progress.puzzleState.hoveredIndex = -1;
    }

        function isFloor5Solved(progress) {
        const blocked = progress.puzzleState.blocked || [];
        return blocked.length > 0 && blocked.every(Boolean);
    }

    function killFloor2Critter(game, room, critter) {
        if (!critter || !critter.alive || !critter.red) return false;
        critter.alive = false;
        room.hiddenWormBloodStains = Array.isArray(room.hiddenWormBloodStains) ? room.hiddenWormBloodStains : [];
        room.hiddenWormBloodStains.push({
            x: critter.x,
            y: critter.y + 8,
            radius: 18 + Math.random() * 6,
            seed: Math.random() * Math.PI * 2
        });
        const progress = getFloorProgress(game, 2);
        const killedIds = progress.puzzleState.killedIds || (progress.puzzleState.killedIds = []);
        if (!killedIds.includes(critter.id)) killedIds.push(critter.id);
        progress.puzzleState.killedCount = killedIds.length;
        progress.puzzleState.targetCount = 4;
        triggerStepFeedback(game, room, 2, critter.x, critter.y, `异虫 ${progress.puzzleState.killedCount}/${progress.puzzleState.targetCount}`, critter.hue || '#ff6670');
        if ((progress.puzzleState.killedCount || 0) >= 4) {
            markCompleted(game, room, 2);
        } else {
            saveState(game);
        }
        return true;
    }

    function handleFloor4Answer(game, room, answerValue) {
        const progress = getFloorProgress(game, 4);
        if (progress.failed || progress.puzzleState.failedPermanently) {

            return true;
        }
        const question = FLOOR4_QUESTIONS[progress.puzzleState.currentQuestionIndex];
        if (!question) return true;

        progress.started = true;
        progress.discovered = true;
        if (answerValue === question.answer) {
            progress.puzzleState.currentQuestionIndex += 1;
            progress.puzzleState.questionFlash = 0.8;
            triggerStepFeedback(game, room, 4, room.hiddenOrb.x, room.hiddenOrb.y, null, '#8ed8ff');
            if (progress.puzzleState.currentQuestionIndex >= FLOOR4_QUESTIONS.length) {
                markCompleted(game, room, 4);
            } else {
                saveState(game);
            }
        } else {
            progress.puzzleState.wrongAttempts += 1;
            progress.attempts = progress.puzzleState.wrongAttempts;
            progress.puzzleState.questionFlash = 0.8;
            sparkle(game, room.hiddenOrb.x, room.hiddenOrb.y, '#9097a6', 8);
            cameraShake(game, 4.5, 0.45);

            if (progress.puzzleState.wrongAttempts >= 3) {
                progress.puzzleState.failedPermanently = true;
                markFailed(game, room, 4, '计数石板永久沉寂');
            } else {
                saveState(game);
            }
        }
        return true;
    }

    function handleNodeInteract(game, room, node) {
        const floor = getFloor(game, room);
        const profile = getProfile(floor);
        const progress = getFloorProgress(game, floor);
        if (floor === 1) seedFloor1PuzzleFromRun(game, progress);
        progress.discovered = true;
        progress.started = true;

        if (floor === 1 && node.kind === 'candle') {
            const states = progress.puzzleState.candleStates;
            if (!Array.isArray(states) || node.index < 0 || node.index >= states.length) return true;
            if (states[node.index]) {
                sparkle(game, node.x, node.y - 10, '#9aa0aa', 5);
                return true;
            }
            const beforeLit = countFloor1Lit(progress);
            states[node.index] = true;
            const afterLit = countFloor1Lit(progress);
            if (afterLit > beforeLit) {
                triggerStepFeedback(game, room, floor, node.x, node.y - 10, null, '#ffd27d');
            }
            if (isFloor1Solved(progress)) markCompleted(game, room, floor);
            else saveState(game);
            return true;
        }

        if (floor === 4 && node.kind === 'answer') {
            return handleFloor4Answer(game, room, node.answerValue);
        }

        if (floor === 5 && node.kind === 'relic') {
            return true;
        }

        return false;
    }

    function startFloor6Cinematic(game, room) {
        const progress = getFloorProgress(game, 6);
        progress.puzzleState.cinematicStarted = true;
        progress.puzzleState.cinematicTime = 0;
        progress.puzzleState.beamCount = 0;
        triggerRoomPulse(room, 1.2, 2.8);
        saveState(game);
    }

    function handleOrbInteract(game, room) {
        const floor = getFloor(game, room);
        const profile = getProfile(floor);
        const progress = getFloorProgress(game, floor);
        if (floor === 1) seedFloor1PuzzleFromRun(game, progress);
        progress.discovered = true;
        progress.started = true;

        if (progress.phase === 'awakened' || progress.phase === 'played' || progress.witnessed) {
            triggerOrbFlash(room, profile.color, 0.6, 0.2);
            showNote(profile);
            progress.witnessed = true;
            progress.phase = 'played';
            progress.crystalState = 'played';
            progress.crystalActivated = true;
            recompute(game.hiddenRooms);
            saveState(game);
            return true;
        }

        triggerOrbFlash(room, '#7b8290', 0.26, 0.10);
        return true;
    }

    function setupRoom(game, room) {
        if (!room || room.type !== 'hidden') return null;
        const floor = getFloor(game, room);
        if (room.hiddenMode && room.hiddenProfile && room.hiddenRoomFloor === floor && room.hiddenRuntimeVersion === HIDDEN_ROOM_VERSION) {
            return room.hiddenMode;
        }
        const profile = getProfile(floor);
        const progress = getFloorProgress(game, floor);
        progress.puzzleState = normalizePuzzleState(floor, progress.puzzleState);
        progress.discovered = true;

        room.hiddenRuntimeVersion = HIDDEN_ROOM_VERSION;
        room.hiddenMode = {
            id: profile.id,
            title: profile.title,
            subtitle: profile.subtitle,
            color: profile.color,
            challenge: floor === 2
        };
        room.hiddenProfile = profile;
        room.hiddenRoomFloor = floor;
        room.hiddenRewardGranted = false;
        room.chest = null;
        room.chests = [];
        room.ambientWorms = [];
        room.secretHints = [];
        room.hiddenMotes = [];
        room._hiddenModeAnnounced = false;
        room.environmentLights = room.environmentLights || [];
        room.secretHints = room.secretHints || [];
        room.hiddenPuzzleState = progress.puzzleState;
        room.hiddenRenderTime = room.hiddenRenderTime || 0;
        room.hiddenTitleTime = 2.8;
        room.hiddenCompletionTime = 0;
        room.hiddenFailureTime = 0;
        room.hiddenPulse = room.hiddenPulse || null;
        room.hiddenOrbFlash = room.hiddenOrbFlash || null;
        room.cleared = progress.completed ? true : floor !== 2;

        hydrateHiddenLayoutCustomDecorFromStore(floor);
        buildPuzzleNodes(room, floor, progress);
        applyHiddenLayoutOverrides(room, floor);
        if (floor === 2) {
            room.enemies = [];
            room.enemyBullets = [];
            room.enemySpawned = true;
        }
        if (floor === 3 && progress.puzzleState.stage !== 'input' && !progress.completed) {
            resetFloor3Preview(progress);
        }
        if (progress.completed && !progress.witnessed && progress.phase === 'idle') {
            progress.phase = 'awakened';
            progress.crystalState = 'ready';
            progress.crystalActivated = true;
        }
        if (progress.witnessed) {
            progress.phase = 'played';
            progress.crystalState = 'played';
        }
        saveState(game);
        return room.hiddenMode;
    }

    function updateSolveAnimation(game, room, floor, dt) {
        const progress = getFloorProgress(game, floor);
        if (progress.phase !== 'solved_anim') return;
        progress.solveAnimTimer = Math.max(0, (progress.solveAnimTimer || 0) - dt);
        triggerRoomPulse(room, 0.45, 0.08);
        triggerOrbFlash(room, room.hiddenProfile?.color || '#ffffff', 0.8, 0.08);
        if (progress.solveAnimTimer <= 0) {
            progress.phase = 'awakened';
            progress.crystalState = 'ready';
            progress.crystalActivated = true;
            saveState(game);
        }
    }

    function updateFloor3(game, room, dt) {
        const progress = getFloorProgress(game, 3);
        if (progress.completed) return;
        const puzzle = progress.puzzleState;
        puzzle.cooldown = Math.max(0, (puzzle.cooldown || 0) - dt);

        if (puzzle.stage === 'preview') {
            puzzle.previewTimer -= dt;
            if (puzzle.previewTimer <= 0) {
                if (puzzle.previewLit) {
                    puzzle.previewLit = false;
                    puzzle.activePreviewIndex = -1;
                    puzzle.previewStep += 1;
                    if (puzzle.previewStep >= puzzle.sequence.length) {
                        puzzle.previewRound += 1;
                        puzzle.previewStep = 0;
                        if (puzzle.previewRound >= 2) {
                            puzzle.stage = 'input';
                            puzzle.inputIndex = 0;
                            puzzle.lastTriggeredNode = -1;
                            puzzle.previewTimer = 2.4;
                            puzzle.replayTimer = 2.4;
                            saveState(game);
                            return;
                        }
                        puzzle.previewTimer = 2.4;
                    } else {
                        puzzle.previewTimer = 0.14;
                    }
                } else {
                    const activeIndex = puzzle.sequence[puzzle.previewStep];
                    puzzle.activePreviewIndex = activeIndex;
                    puzzle.previewLit = true;
                    puzzle.previewTimer = 0.40;
                    const activeNode = (room.hiddenPuzzleNodes || []).find(n => n.kind === 'mushroom' && n.index === activeIndex);
                    if (activeNode) sparkle(game, activeNode.x, activeNode.y - 8, '#b893ff', 4);
                }
            }
            return;
        }

        if (puzzle.stage !== 'input') return;
        puzzle.previewTimer -= dt;
        if (puzzle.previewTimer <= 0) {
            if (puzzle.previewLit) {
                puzzle.previewLit = false;
                puzzle.activePreviewIndex = -1;
                puzzle.previewStep += 1;
                if (puzzle.previewStep >= puzzle.sequence.length) {
                    puzzle.previewStep = 0;
                    puzzle.previewTimer = 2.4;
                } else {
                    puzzle.previewTimer = 0.14;
                }
            } else {
                const activeIndex = puzzle.sequence[puzzle.previewStep];
                puzzle.activePreviewIndex = activeIndex;
                puzzle.previewLit = true;
                puzzle.previewTimer = 0.40;
                const activeNode = (room.hiddenPuzzleNodes || []).find(n => n.kind === 'mushroom' && n.index === activeIndex);
                if (activeNode) sparkle(game, activeNode.x, activeNode.y - 8, '#b893ff', 4);
            }
        }

        const px = Number.isFinite(game.player?.cx) ? game.player.cx : game.player?.x;
        const py = Number.isFinite(game.player?.cy) ? game.player.cy : game.player?.y;
        if (!Number.isFinite(px) || !Number.isFinite(py)) {
            puzzle.hoveredIndex = -1;
            return;
        }
        let nearIndex = -1;
        let nearDist = Infinity;
        getSortedEditorList(room.hiddenPuzzleNodes || []).forEach(node => {
            if (node.kind !== 'mushroom') return;
            const d = Math.hypot(px - node.x, py - node.y);
            if (d <= (node.radius || 62) && d < nearDist) {
                nearDist = d;
                nearIndex = node.index;
            }
        });
        puzzle.hoveredIndex = nearIndex;
    }

    function updateFloor2(game, room, dt) {
        if (getHiddenLayoutEditorState().active) return;
        const progress = getFloorProgress(game, 2);
        const critters = Array.isArray(room.hiddenWormCritters) ? room.hiddenWormCritters : [];
        let rabbit = room.hiddenDemoRabbit;
        const px = Number.isFinite(game.player?.cx) ? game.player.cx : game.player?.x;
        const py = Number.isFinite(game.player?.cy) ? game.player.cy : game.player?.y;
        const isDashing = !!game.player?.isDashing;
        const t = room.hiddenRenderTime || 0;
        progress.puzzleState.targetCount = 4;
        if (!Array.isArray(progress.puzzleState.killedIds)) progress.puzzleState.killedIds = [];
        progress.puzzleState.killedCount = progress.puzzleState.killedIds.length;

        critters.forEach((critter, index) => {
            if (!critter.alive) return;
            if (critter.hiddenTime > 0) {
                critter.hiddenTime = Math.max(0, critter.hiddenTime - dt);
                if (critter.hiddenTime <= 0) {
                    critter.homeX = critter.reappearX;
                    critter.homeY = critter.reappearY;
                    critter.x = critter.homeX;
                    critter.y = critter.homeY;
                }
                return;
            }
            const crawl = t * 2.4 + critter.driftPhase;
            critter.x = critter.homeX + Math.sin(crawl) * 16 + Math.sin(crawl * 0.42 + index) * 8;
            critter.y = critter.homeY + Math.sin(crawl * 1.8 + index * 0.7) * 3 + Math.cos(crawl * 0.65) * 2;
            critter.vx = Math.cos(crawl) * 38 + Math.cos(crawl * 0.42 + index) * 10;
            critter.vy = Math.cos(crawl * 1.8 + index * 0.7) * 7;
        });

        if (!progress.puzzleState.demoSeen && (!rabbit || !rabbit.active)) {
            const demoTarget = critters.find(c => c.red && c.alive && c.hiddenTime <= 0) || null;
            rabbit = room.hiddenDemoRabbit = {
                active: true,
                state: 'delay',
                timer: 0.75,
                x: roomCenterX(room) - Math.max(260, roomWidth(room) * 0.38),
                y: roomCenterY(room) - Math.max(54, roomHeight(room) * 0.12),
                targetId: demoTarget?.id || null,
                trail: [],
                glow: 1,
                facing: 1,
                speedX: 0
            };
        }

        if (rabbit && rabbit.active) {
            rabbit.trail = Array.isArray(rabbit.trail) ? rabbit.trail : [];
            rabbit.trail = rabbit.trail.filter(item => (item.life -= dt) > 0);
            const target = critters.find(c => c.id === rabbit.targetId && c.red && c.alive && c.hiddenTime <= 0)
                || critters.find(c => c.red && c.alive && c.hiddenTime <= 0);
            if (rabbit.state === 'delay') {
                rabbit.timer -= dt;
                if (rabbit.timer <= 0) rabbit.state = 'walk';
            } else if (rabbit.state === 'walk') {
                const tx = target ? target.x - 70 : rabbit.x + 40;
                const ty = target ? target.y + 6 : rabbit.y;
                const dx = tx - rabbit.x;
                const dy = ty - rabbit.y;
                const d = Math.hypot(dx, dy) || 1;
                rabbit.speedX = (dx / d) * 120;
                rabbit.facing = rabbit.speedX < 0 ? -1 : 1;
                rabbit.x += rabbit.speedX * dt;
                rabbit.y += (dy / d) * dt * 120;
                if (target && Math.hypot(rabbit.x - target.x, rabbit.y - target.y) < 54) rabbit.state = 'lineup';
            } else if (rabbit.state === 'lineup') {
                const tx = target ? target.x - 120 : rabbit.x;
                const ty = target ? target.y + 18 : rabbit.y;
                const dx = tx - rabbit.x;
                const dy = ty - rabbit.y;
                const d = Math.hypot(dx, dy) || 1;
                rabbit.speedX = (dx / d) * 130;
                rabbit.facing = rabbit.speedX < 0 ? -1 : 1;
                rabbit.x += rabbit.speedX * dt;
                rabbit.y += (dy / d) * dt * 130;
                if (d < 18) {
                    rabbit.state = 'dash_pause';
                    rabbit.timer = 0.16;
                }
            } else if (rabbit.state === 'dash_pause') {
                rabbit.timer -= dt;
                if (rabbit.timer <= 0) rabbit.state = 'dash';
            } else if (rabbit.state === 'dash') {
                rabbit.trail.push({ x: rabbit.x, y: rabbit.y, life: 0.18 });
                const tx = target ? target.x + 80 : roomCenterX(room) + 220;
                const ty = target ? target.y + 4 : rabbit.y;
                const dx = tx - rabbit.x;
                const dy = ty - rabbit.y;
                const d = Math.hypot(dx, dy) || 1;
                rabbit.speedX = (dx / d) * 640;
                rabbit.facing = rabbit.speedX < 0 ? -1 : 1;
                rabbit.x += rabbit.speedX * dt;
                rabbit.y += (dy / d) * dt * 640;
                if (target && target.alive && target.hiddenTime <= 0 && Math.hypot(rabbit.x - target.x, rabbit.y - target.y) < 36) {
                    killFloor2Critter(game, room, target, true);
                    progress.puzzleState.demoSeen = true;
                    progress.puzzleState.killedCount = (progress.puzzleState.killedIds || []).length;
                    triggerStepFeedback(game, room, 2, target.x, target.y, null, '#ff6670');
                    rabbit.state = 'exit';
                    rabbit.targetId = null;
                    saveState(game);
                }
            } else if (rabbit.state === 'exit') {
                rabbit.trail.push({ x: rabbit.x, y: rabbit.y, life: 0.14 });
                rabbit.speedX = 260;
                rabbit.facing = 1;
                rabbit.x += rabbit.speedX * dt;
                if (rabbit.x > roomCenterX(room) + roomWidth(room) * 0.5 + 80) {
                    rabbit.active = false;
                    room.hiddenDemoRabbit = null;
                    progress.puzzleState.demoSeen = true;
                    saveState(game);
                }
            }
        }

        if (!progress.puzzleState.demoSeen) return;
        critters.forEach((critter, index) => {
            if (!critter.alive || critter.hiddenTime > 0) return;
            if (!Number.isFinite(px) || !Number.isFinite(py)) return;
            const dist = Math.hypot(px - critter.x, py - critter.y);
            if (isDashing && dist <= 34) {
                if (critter.red) {
                    killFloor2Critter(game, room, critter);
                } else {
                    critter.hiddenTime = 0.32;
                    critter.reappearX = clamp(critter.homeX + Math.cos(index + t) * 44, roomCenterX(room) - Math.max(320, roomWidth(room) * 0.46), roomCenterX(room) + Math.max(320, roomWidth(room) * 0.46));
                    critter.reappearY = clamp(critter.homeY + Math.sin(index + t) * 36, roomCenterY(room) - Math.max(210, roomHeight(room) * 0.34), roomCenterY(room) + Math.max(210, roomHeight(room) * 0.34));
                }
                return;
            }
            if (!isDashing && dist <= 52) {
                critter.hiddenTime = 0.38;
                const angle = ((index + 1) * 1.7) + t * 0.7;
                critter.reappearX = clamp(critter.homeX + Math.cos(angle) * 92, roomCenterX(room) - Math.max(320, roomWidth(room) * 0.46), roomCenterX(room) + Math.max(320, roomWidth(room) * 0.46));
                critter.reappearY = clamp(critter.homeY + Math.sin(angle) * 70, roomCenterY(room) - Math.max(210, roomHeight(room) * 0.34), roomCenterY(room) + Math.max(210, roomHeight(room) * 0.34));
            }
        });
    }

    function updateFloor4(game, room, dt) {
        const progress = getFloorProgress(game, 4);
        progress.puzzleState.questionFlash = Math.max(0, (progress.puzzleState.questionFlash || 0) - dt);
    }


    function updateFloor5(game, room, dt) {
        const progress = getFloorProgress(game, 5);
        if (progress.completed) return;
        const puzzle = progress.puzzleState;
        const px = Number.isFinite(game.player?.cx) ? game.player.cx : game.player?.x;
        const py = Number.isFinite(game.player?.cy) ? game.player.cy : game.player?.y;
        if (!Number.isFinite(px) || !Number.isFinite(py)) return;
        const blockers = Array.isArray(room.hiddenBlockers) ? room.hiddenBlockers : [];
        const targets = Array.isArray(room.hiddenSealTargets) ? room.hiddenSealTargets : [];
        const bounds = {
            left: roomCenterX(room) - Math.max(250, roomWidth(room) * 0.36),
            right: roomCenterX(room) + Math.max(250, roomWidth(room) * 0.36),
            top: roomCenterY(room) - Math.max(170, roomHeight(room) * 0.28),
            bottom: roomCenterY(room) + Math.max(170, roomHeight(room) * 0.28)
        };
        const prev = room.hiddenPrevPlayerPos || { x: px, y: py };
        const moveX = px - prev.x;
        const moveY = py - prev.y;
        room.hiddenPrevPlayerPos = { x: px, y: py };
        const moveLen = Math.hypot(moveX, moveY);
        let changed = false;

        blockers.forEach((blocker) => {
            if (!blocker || blocker.sealed) return;
            const node = room.hiddenPuzzleNodes?.find(n => n.kind === 'seal_blocker' && n.index === blocker.index);
            const toBlockX = blocker.x - px;
            const toBlockY = blocker.y - py;
            const d = Math.hypot(toBlockX, toBlockY);
            if (moveLen > 0.2 && d <= (blocker.radius || 40) + 34) {
                const pushDot = moveX * toBlockX + moveY * toBlockY;
                if (pushDot > 0) {
                    const pushScale = Math.min(0.68, 0.26 + moveLen * 0.04);
                    blocker.x += moveX * pushScale;
                    blocker.y += moveY * pushScale;
                    changed = true;
                }
            }

            blocker.x = clamp(blocker.x, bounds.left, bounds.right);
            blocker.y = clamp(blocker.y, bounds.top, bounds.bottom);

            blockers.forEach(other => {
                if (!other || other === blocker || other.sealed) return;
                const dx = blocker.x - other.x;
                const dy = blocker.y - other.y;
                const dist = Math.hypot(dx, dy);
                const minDist = (blocker.radius || 40) + (other.radius || 40) - 12;
                if (dist > 0.001 && dist < minDist) {
                    const overlap = (minDist - dist) * 0.5;
                    blocker.x += (dx / dist) * overlap;
                    blocker.y += (dy / dist) * overlap;
                    other.x -= (dx / dist) * overlap;
                    other.y -= (dy / dist) * overlap;
                }
            });

            if (node) {
                node.x = blocker.x;
                node.y = blocker.y;
            }
            const target = targets.find(t => !puzzle.blocked?.[t.index] && Math.hypot(blocker.x - t.x, blocker.y - t.y) <= 30);
            if (target) {
                blocker.x = target.x;
                blocker.y = target.y;
                blocker.sealed = true;
                if (node) {
                    node.x = blocker.x;
                    node.y = blocker.y;
                }
                puzzle.blocked[target.index] = true;
                puzzle.sealedCount = (puzzle.blocked || []).filter(Boolean).length;
                triggerStepFeedback(game, room, 5, target.x, target.y, null, '#9ff2cf');
                changed = true;
            }
        });

        if (isFloor5Solved(progress)) {
            markCompleted(game, room, 5);
            return;
        }
        if (changed) saveState(game);
    }

    function updateFloor6(game, room, dt) {
        const progress = getFloorProgress(game, 6);
        if (progress.completed) return;
        const target = room.hiddenConvergencePoint;
        if (!target) return;
        const px = Number.isFinite(game.player?.cx) ? game.player.cx : game.player?.x;
        const py = Number.isFinite(game.player?.cy) ? game.player.cy : game.player?.y;
        if (!Number.isFinite(px) || !Number.isFinite(py)) return;
        const d = Math.hypot(px - target.x, py - target.y);
        if (d <= (target.radius || 56)) {
            if (!progress.puzzleState.found) {
                progress.puzzleState.found = true;
                triggerStepFeedback(game, room, 6, target.x, target.y, null, '#b9f4ff');
            }
            progress.puzzleState.holdTime += dt;
            if (progress.puzzleState.holdTime >= 1) {
                markCompleted(game, room, 6);
            }
        } else {
            progress.puzzleState.holdTime = Math.max(0, (progress.puzzleState.holdTime || 0) - dt * 1.4);
            progress.puzzleState.found = false;
        }
    }

    function onEnemyKilled(game, enemy) {
        const room = game?.curRoom;
        if (!room || room.type !== 'hidden') return;
        const floor = getFloor(game, room);
        if (floor !== 2) return;
        if (!enemy || !enemy._hiddenWormTarget) return;
        const progress = getFloorProgress(game, floor);
        const killedIds = progress.puzzleState.killedIds || (progress.puzzleState.killedIds = []);
        const key = String(enemy.id ?? enemy.spawnId ?? enemy._hiddenTargetId ?? enemy.cx + ':' + enemy.cy);
        if (killedIds.includes(key)) return;
        killedIds.push(key);
        progress.puzzleState.killedCount = killedIds.length;
        if ((progress.puzzleState.killedCount || 0) >= (progress.puzzleState.targetCount || 0) && (progress.puzzleState.targetCount || 0) > 0) {
            markCompleted(game, room, floor);
        } else {
            saveState(game);
        }
    }

    function patchRoomSpawnEnemies() {
        if (typeof Room === 'undefined' || !Room.prototype || Room.prototype.__hiddenRoomSpawnPatched) return;
        const original = Room.prototype.spawnEnemies;
        if (typeof original !== 'function') return;
        Room.prototype.spawnEnemies = function patchedSpawnEnemies() {
            const result = original.apply(this, arguments);
            const game = global.game;
            if (!game || this.type !== 'hidden') return result;
            const floor = getFloor(game, this);
            if (floor !== 2) return result;
            this.enemies = [];
            this.enemyBullets = [];
            this.enemySpawned = true;
            return result;
        };
        Room.prototype.__hiddenRoomSpawnPatched = true;
    }

    function drawLightBlob(ctx, camera, light, time) {
        const pos = camera.worldToScreen(light.x, light.y);
        const pulse = light.pulse ? (1 + Math.sin(time * 3 + light.radius * 0.01) * light.pulse) : 1;
        const radius = (light.radius || 60) * pulse * (light.hiddenScale || 1);
        drawCachedHiddenRadial(ctx, pos.x, pos.y, radius, radius, light.color || '#ffffff', [
            [0, (light.alpha || 0.22) * pulse],
            [0.56, (light.alpha || 0.22) * pulse * 0.38],
            [1, 0]
        ], { composite: 'screen' });
    }

    function drawAmbientMotes(ctx, camera, room, time) {
        return;
    }

    function drawHiddenDecor(ctx, camera, room, game) {
        const decor = Array.isArray(room.hiddenDecor) ? room.hiddenDecor : [];
        const floor = room.hiddenRoomFloor || 0;
        const progress = (game && floor) ? getFloorProgress(game, floor) : null;
        const question = floor === 4 && progress && !progress.completed && !progress.failed ? FLOOR4_QUESTIONS[clamp(progress.puzzleState.currentQuestionIndex || 0, 0, FLOOR4_QUESTIONS.length - 1)] : null;
        const activeCategory = question?.category || null;
        const time = room.hiddenRenderTime || 0;
        const tuning = getHiddenVisualTuning();
        getSortedEditorList(decor).forEach(item => {
            let alpha = Number.isFinite(item.alpha) ? item.alpha : 1;
            let tint = null;
            const decorMode = getHiddenPlacedDecorMode(item, progress);
            const mushroomDecor = isHiddenMushroomDecorItem(item);
            if (mushroomDecor) return;
            if (floor === 4 && item.category) {
                const hot = item.category === activeCategory;
                alpha = hot ? Math.min(1, alpha + 0.18 + Math.sin(time * 5) * 0.05) : Math.max(0.38, alpha - 0.30);
                if (!hot) tint = 'rgba(60,70,84,0.42)';
            }
            if (mushroomDecor && decorMode) {
                alpha *= decorMode === 'active' ? 1 : (decorMode === 'preview' ? 0.92 : 0.82);
            }
            ctx.save();
            if (item.blend) ctx.globalCompositeOperation = item.blend;
            const customImg = item.kind === 'custom_decor' ? getCustomDecorImage(item.imageSrc) : null;
            const itemScale = Number.isFinite(item.scale) ? item.scale : 1;
            const stretchX = (Number.isFinite(item.scaleX) ? item.scaleX : 1) * itemScale;
            const stretchY = (Number.isFinite(item.scaleY) ? item.scaleY : 1) * itemScale;
            if (item.kind === 'mushroom_band') {
                drawHiddenMushroomBand(ctx, camera, item, decorMode, tuning);
            } else if (customImg) {
                drawImageCentered(ctx, camera, customImg, item.x, item.y, item.drawW || item.w, item.drawH || item.h, {
                    alpha,
                    rotation: item.rotation,
                    flipX: item.flipX,
                    exactSize: true,
                    scaleX: stretchX,
                    scaleY: stretchY
                });
            } else {
                drawSpriteCentered(ctx, camera, item.key, item.x, item.y, item.w || item.drawW, item.h || item.drawH, {
                    alpha,
                    rotation: item.rotation,
                    flipX: item.flipX,
                    tint,
                    exactSize: true,
                    scaleX: stretchX,
                    scaleY: stretchY,
                    brightness: mushroomDecor && decorMode ? (1 + ((decorMode === 'active' ? 1.34 : (decorMode === 'preview' ? 1.22 : 1.12)) - 1) * tuning.mushroomBrightness) : 1,
                    glow: mushroomDecor && !!decorMode,
                    glowColor: item.glowColor || item.glow || '#8fdcff',
                    glowAlpha: mushroomDecor && decorMode ? (decorMode === 'active' ? 0.22 : 0.10) * (0.6 + tuning.mushroomBrightness * 0.4) : 0,
                    glowBlur: 14 * (0.86 + tuning.mushroomBrightness * 0.14)
                });
            }
            if (item.kind !== 'mushroom_band' && mushroomDecor && decorMode) {
                const pos = camera.worldToScreen(item.x, item.y - 4);
                const auraR = Math.max(item.w || item.drawW || 54, item.h || item.drawH || 54) * (decorMode === 'active' ? 0.92 : 0.66) * (0.84 + tuning.mushroomBrightness * 0.16);
                const glowColor = item.glowColor || item.glow || '#8fdcff';
                drawCachedHiddenRadial(ctx, pos.x, pos.y, auraR, auraR, glowColor, [
                    [0, (decorMode === 'active' ? 0.16 : 0.08) * (0.6 + tuning.mushroomBrightness * 0.4)],
                    [0.55, (decorMode === 'active' ? 0.07 : 0.03) * (0.6 + tuning.mushroomBrightness * 0.4)],
                    [1, 0]
                ], { composite: 'screen' });
            }
            if (floor === 4 && item.category === activeCategory) {
                const pos = camera.worldToScreen(item.x, item.y - 6);
                const glowR = Math.max(item.w || 60, item.h || 60) * 0.72;
                drawCachedHiddenRadial(ctx, pos.x, pos.y, glowR, glowR, '#a0dcff', [[0, 0.16], [1, 0]], { composite: 'screen' });
            }
            ctx.restore();
        });
    }

    function drawCandleNode(ctx, camera, node, lit, time) {
        const lanternMul = getHiddenVisualTuning().lanternBrightness;
        const nodeScale = Number.isFinite(node.scale) ? node.scale : 1;
        drawSpriteCentered(ctx, camera, 'dec_candle', node.x, node.y, 58 * nodeScale, 58 * nodeScale, {
            alpha: 1,
            rotation: node.rotation,
            exactSize: true,
            brightness: lit ? (1 + 0.10 * lanternMul) : 1
        });
        const pos = camera.worldToScreen(node.x, node.y);
        const flameX = pos.x + (Number.isFinite(node.flameOffsetX) ? node.flameOffsetX : 0) * nodeScale;
        const flameY = pos.y + (Number.isFinite(node.flameOffsetY) ? node.flameOffsetY : -29) * nodeScale;
        ctx.save();
        if (lit) {
            const pulse = 1 + Math.sin(time * 6 + (node.index || 0) * 0.8) * 0.10;
            const ember = ctx.createRadialGradient(flameX, flameY - 1.5 * nodeScale, 0, flameX, flameY - 1.5 * nodeScale, 12 * nodeScale);
            ember.addColorStop(0, `rgba(255,214,146,${0.20 * (0.6 + lanternMul * 0.4)})`);
            ember.addColorStop(0.55, `rgba(255,176,94,${0.08 * (0.6 + lanternMul * 0.4)})`);
            ember.addColorStop(1, 'rgba(255,176,94,0)');
            ctx.fillStyle = ember;
            ctx.beginPath();
            ctx.arc(flameX, flameY - 1.5 * nodeScale, 12 * nodeScale, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(255,236,188,0.96)';
            ctx.beginPath();
            ctx.ellipse(flameX, flameY, 2.8 * nodeScale, 5.8 * nodeScale * pulse, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = 'rgba(255,170,90,0.90)';
            ctx.beginPath();
            ctx.ellipse(flameX, flameY + 1.4 * nodeScale, 1.55 * nodeScale, 3.0 * nodeScale * pulse, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            ctx.strokeStyle = 'rgba(110,118,132,0.55)';
            ctx.lineWidth = Math.max(1, 1.2 * nodeScale);
            ctx.beginPath();
            ctx.moveTo(flameX, flameY + 4 * nodeScale);
            ctx.lineTo(flameX, flameY - 1 * nodeScale);
            ctx.stroke();
        }
        ctx.restore();
    }

    function drawGlowingMushroomSprite(ctx, camera, key, x, y, drawW, drawH, options = {}) {
        const mushroomMul = getHiddenVisualTuning().mushroomBrightness;
        const glowColor = options.glowColor || '#8fdcff';
        const pos = camera.worldToScreen(x, y + (options.offsetY || 0));
        const pulse = Number.isFinite(options.pulse) ? options.pulse : 1;
        const haloRadius = (options.haloRadius || 42) * pulse * (0.84 + mushroomMul * 0.16);
        const floorRadius = (options.floorRadius || 34) * pulse * (0.84 + mushroomMul * 0.16);
        const glowMul = 0.6 + mushroomMul * 0.4;
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        drawCachedHiddenRadial(ctx, pos.x, pos.y + 10, (options.floorW || 24) * pulse, (options.floorH || 12) * pulse, glowColor, [
            [0, (options.floorAlpha0 ?? 0.24) * glowMul],
            [0.56, (options.floorAlpha1 ?? 0.10) * glowMul],
            [1, 0]
        ], { composite: 'screen' });
        drawCachedHiddenRadial(ctx, pos.x, pos.y - 8, haloRadius, haloRadius, glowColor, [
            [0, (options.haloAlpha0 ?? 0.30) * glowMul],
            [0.5, (options.haloAlpha1 ?? 0.14) * glowMul],
            [1, 0]
        ], { composite: 'screen' });
        ctx.restore();
        drawSpriteCentered(ctx, camera, key, x, y + (options.offsetY || 0), drawW, drawH, {
            alpha: Number.isFinite(options.alpha) ? options.alpha : 1,
            rotation: options.rotation,
            exactSize: true,
            raw: true,
            brightness: 1 + ((Number.isFinite(options.brightness) ? options.brightness : 1.42) - 1) * mushroomMul,
            glow: true,
            glowColor,
            glowAlpha: (Number.isFinite(options.spriteGlowAlpha) ? options.spriteGlowAlpha : 0.46) * glowMul,
            glowBlur: (Number.isFinite(options.glowBlur) ? options.glowBlur : 18) * (0.86 + mushroomMul * 0.14),
            scaleX: options.scaleX,
            scaleY: options.scaleY
        });
    }

    function getConfiguredMushroomSprite(node, fallbackKey = 'set5_mush_16') {
        const scale = Number.isFinite(node?.scale) ? node.scale : 1;
        const scaleX = Number.isFinite(node?.scaleX) ? node.scaleX : 1;
        const scaleY = Number.isFinite(node?.scaleY) ? node.scaleY : 1;
        return {
            key: node?.spriteKey || node?.assetKey || fallbackKey,
            drawW: (node?.drawW || node?.w || 92) * scale * scaleX,
            drawH: (node?.drawH || node?.h || 92) * scale * scaleY,
            offsetY: node?.offsetY || 0,
            glowColor: node?.glowColor || node?.glow || '#8fdcff'
        };
    }

    function isHiddenMushroomDecorAssetKey(key) {
        return typeof key === 'string' && /^(set[125]_mush_|cluster_mush_)/.test(key);
    }

    function isHiddenMushroomDecorItem(item) {
        if (!item) return false;
        if (item.kind === 'mushroom_band') return true;
        return isHiddenMushroomDecorAssetKey(item.key)
            || isHiddenMushroomDecorAssetKey(item.spriteKey)
            || isHiddenMushroomDecorAssetKey(item.assetKey)
            || isHiddenMushroomDecorAssetKey(item.customAssetName);
    }

    function getHiddenPlacedDecorMode(item, progress) {
        if (!isHiddenMushroomDecorItem(item)) return null;
        if (item.kind === 'mushroom_band') {
            return progress?.completed ? 'active' : 'preview_static';
        }
        const floor = Number.isFinite(item.floor) ? item.floor : 0;
        const puzzle = progress?.puzzleState || {};
        if (progress?.completed) return 'active';
        if (floor === 3 && Number.isFinite(item.linkedIndex)) {
            const sequence = Array.isArray(puzzle.sequence) ? puzzle.sequence : [];
            const entered = new Set(sequence.slice(0, Math.max(0, puzzle.inputIndex || 0)));
            if (entered.has(item.linkedIndex)) return 'preview';
            if (puzzle.stage === 'input' && puzzle.hoveredIndex === item.linkedIndex) return 'hover';
            if (puzzle.stage === 'input' && puzzle.activePreviewIndex === item.linkedIndex && puzzle.previewLit) return 'preview_static';
            return 'preview_static';
        }
        if (floor === 4 && item.linkedId) {
            return puzzle.litNodeIds?.includes(item.linkedId) ? 'preview' : 'preview_static';
        }
        if (floor === 5 && Number.isFinite(item.sealIndex)) {
            return puzzle.blocked?.[item.sealIndex] ? 'preview' : 'preview_static';
        }
        if (floor >= 1 && floor <= 6) return 'preview_static';
        return null;
    }

    function pushCompanionMushroom(room, floor, source, suffix, dx, dy, spriteKey, scale, phase) {
        return;
    }

    function getSharedMushroomVisualProfile(mode) {
        switch (mode) {
            case 'active':
                return {
                    brightness: 1.58,
                    haloRadius: 56,
                    floorRadius: 44,
                    floorW: 28,
                    floorH: 14,
                    haloAlpha0: 0.36,
                    haloAlpha1: 0.16,
                    floorAlpha0: 0.27,
                    floorAlpha1: 0.12,
                    spriteGlowAlpha: 0.54,
                    glowBlur: 20,
                    pulseSpeed: 0,
                    pulseAmount: 0
                };
            case 'preview':
                return {
                    brightness: 1.52,
                    haloRadius: 50,
                    floorRadius: 38,
                    floorW: 24,
                    floorH: 12,
                    haloAlpha0: 0.30,
                    haloAlpha1: 0.12,
                    floorAlpha0: 0.21,
                    floorAlpha1: 0.09,
                    spriteGlowAlpha: 0.50,
                    glowBlur: 18,
                    pulseSpeed: 4.2,
                    pulseAmount: 0.06
                };
            case 'preview_static':
                return {
                    brightness: 1.46,
                    haloRadius: 48,
                    floorRadius: 36,
                    floorW: 24,
                    floorH: 12,
                    haloAlpha0: 0.28,
                    haloAlpha1: 0.11,
                    floorAlpha0: 0.20,
                    floorAlpha1: 0.08,
                    spriteGlowAlpha: 0.48,
                    glowBlur: 18,
                    pulseSpeed: 2.2,
                    pulseAmount: 0.04
                };
            case 'hover':
                return {
                    brightness: 1.22,
                    haloRadius: 26,
                    floorRadius: 20,
                    floorW: 14,
                    floorH: 7,
                    haloAlpha0: 0.14,
                    haloAlpha1: 0.05,
                    floorAlpha0: 0.10,
                    floorAlpha1: 0.04,
                    spriteGlowAlpha: 0.24,
                    glowBlur: 12,
                    pulseSpeed: 3,
                    pulseAmount: 0.03
                };
            default:
                return {
                    brightness: 1.10,
                    haloRadius: 18,
                    floorRadius: 14,
                    floorW: 10,
                    floorH: 5,
                    haloAlpha0: 0.10,
                    haloAlpha1: 0.03,
                    floorAlpha0: 0.08,
                    floorAlpha1: 0.03,
                    spriteGlowAlpha: 0.18,
                    glowBlur: 10,
                    pulseSpeed: 0,
                    pulseAmount: 0
                };
        }
    }

    function drawSharedMushroomNode(ctx, camera, node, sprite, mode, time, options = {}) {
        const profile = getSharedMushroomVisualProfile(mode);
        const phase = Number.isFinite(options.phase) ? options.phase : (Number.isFinite(node?.index) ? node.index : 0);
        const pulse = profile.pulseAmount > 0
            ? (1 + Math.sin(time * profile.pulseSpeed + phase) * profile.pulseAmount)
            : 1;
        drawGlowingMushroomSprite(ctx, camera, sprite.key, node.x, node.y, sprite.drawW, sprite.drawH, {
            offsetY: sprite.offsetY,
            pulse,
            brightness: profile.brightness,
            glowColor: sprite.glowColor,
            rotation: node.rotation,
            haloRadius: profile.haloRadius,
            floorRadius: profile.floorRadius,
            floorW: profile.floorW,
            floorH: profile.floorH,
            haloAlpha0: profile.haloAlpha0,
            haloAlpha1: profile.haloAlpha1,
            floorAlpha0: profile.floorAlpha0,
            floorAlpha1: profile.floorAlpha1,
            spriteGlowAlpha: profile.spriteGlowAlpha,
            glowBlur: profile.glowBlur
        });
    }

    function drawMushroomNode(ctx, camera, node, state, time, completed = false) {
        const sprite = getConfiguredMushroomSprite(node);
        const sequence = Array.isArray(state.sequence) ? state.sequence : [];
        const entered = new Set(sequence.slice(0, Math.max(0, state.inputIndex || 0)));
        const previewLit = !!state.previewLit && state.activePreviewIndex === node.index;
        const activeLit = entered.has(node.index);
        const hovered = state.stage === 'input' && state.hoveredIndex === node.index;
        let mode = null;
        if (completed || activeLit) mode = 'active';
        else if (previewLit) mode = 'preview';
        else if (hovered) mode = 'hover';
        if (!mode) return;
        drawSharedMushroomNode(ctx, camera, node, sprite, mode, time);
    }

    function drawMemoryMushroomNode(ctx, camera, node, progress, time) {
        const puzzle = progress?.puzzleState || {};
        const variant = OVR_FLOOR4_VARIANTS[node.variant] || OVR_FLOOR4_VARIANTS[0];
        const sprite = getConfiguredMushroomSprite({
            ...node,
            spriteKey: node?.spriteKey || variant.key,
            drawW: node?.drawW || variant.w,
            drawH: node?.drawH || variant.h,
            offsetY: Number.isFinite(node?.offsetY) ? node.offsetY : variant.offsetY,
            glowColor: node?.glowColor || variant.glow
        });
        const litNodeIds = Array.isArray(puzzle.litNodeIds) ? puzzle.litNodeIds : [];
        const solvedLit = litNodeIds.includes(node.id) || !!progress?.completed;
        if (!solvedLit) return;
        drawSharedMushroomNode(ctx, camera, node, sprite, 'active', time);
    }

    function getDecorMushroomMode(node, progress) {
        if (!node) return 'off';
        const floor = Number.isFinite(node.floor) ? node.floor : 0;
        const puzzle = progress?.puzzleState || {};
        if (progress?.completed) return 'active';
        if (floor === 2 || floor === 6) {
            return 'preview_static';
        }
        if (floor === 3) {
            const sequence = Array.isArray(puzzle.sequence) ? puzzle.sequence : [];
            const entered = new Set(sequence.slice(0, Math.max(0, puzzle.inputIndex || 0)));
            if (Number.isFinite(node.linkedIndex) && entered.has(node.linkedIndex)) return 'preview';
            if (Number.isFinite(node.linkedIndex) && puzzle.stage === 'input' && puzzle.hoveredIndex === node.linkedIndex) return 'hover';
            if (Number.isFinite(node.linkedIndex) && puzzle.stage === 'input' && puzzle.activePreviewIndex === node.linkedIndex && puzzle.previewLit) return 'preview_static';
            return 'off';
        }
        if (floor === 4) {
            if (node.linkedId && puzzle.litNodeIds?.includes(node.linkedId)) return 'active';
            return 'off';
        }
        if (floor === 5) {
            if (Number.isFinite(node.sealIndex) && puzzle.blocked?.[node.sealIndex]) return 'active';
            return 'preview_static';
        }
        return 'preview_static';
    }

    function drawDecorMushroomNode(ctx, camera, node, progress, time) {
        const mode = getDecorMushroomMode(node, progress);
        if (mode === 'off') return;
        const sprite = getConfiguredMushroomSprite(node);
        drawSharedMushroomNode(ctx, camera, node, sprite, mode, time, {
            phase: Number.isFinite(node.phase) ? node.phase : (Number.isFinite(node.index) ? node.index : 0)
        });
    }

    function drawRelicNode(ctx, camera, node, active, color, time, previewLit) {
        const lanternMul = getHiddenVisualTuning().lanternBrightness;
        const warm = !!active || !!previewLit || !!node.alwaysGlow;
        const idx = Number.isFinite(node.index) ? node.index : 0;
        const pulse = warm ? (1 + Math.sin(time * 7 + idx) * 0.1) : 1;
        const drawW = node.drawW || 72;
        const drawH = node.drawH || 72;
        drawSpriteCentered(ctx, camera, node.spriteKey || 'item_book', node.x, node.y, drawW, drawH, {
            alpha: 1,
            exactSize: true,
            brightness: warm ? (1 + (1.12 - 1) * lanternMul) : 1.02,
            rotation: node.rotation,
            scaleX: node.scaleX,
            scaleY: node.scaleY,
            glow: warm,
            glowColor: node.glow || color,
            glowAlpha: warm ? 0.20 * (0.6 + lanternMul * 0.4) : 0,
            glowBlur: 16
        });
        if (!warm) return;
        const pos = camera.worldToScreen(node.x, node.y);
        if (!Number.isFinite(pos.x) || !Number.isFinite(pos.y)) return;
        ctx.save();
        const glowColor = node.glow || color;
        const radius = Math.max(24, (Math.max(drawW, drawH) * 0.58)) * pulse * (0.86 + lanternMul * 0.14);
        const grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, radius);
        grad.addColorStop(0, toRgba(glowColor, (active || node.alwaysGlow ? 0.18 : 0.12) * (0.6 + lanternMul * 0.4)));
        grad.addColorStop(0.5, toRgba(glowColor, 0.07 * (0.6 + lanternMul * 0.4)));
        grad.addColorStop(1, toRgba(glowColor, 0));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function drawSealTarget(ctx, camera, target, sealed, time) {
        const pos = camera.worldToScreen(target.x, target.y);
        ctx.save();
        const pulse = 1 + Math.sin(time * 4 + target.index) * 0.05;
        const r = 22 * pulse;
        const glow = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, sealed ? 40 : 30);
        glow.addColorStop(0, sealed ? 'rgba(166,239,210,0.24)' : 'rgba(132,216,238,0.12)');
        glow.addColorStop(0.55, sealed ? 'rgba(166,239,210,0.10)' : 'rgba(132,216,238,0.04)');
        glow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, sealed ? 40 : 30, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = sealed ? 'rgba(124,220,190,0.26)' : 'rgba(24,42,54,0.28)';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = sealed ? 'rgba(170,255,220,0.86)' : 'rgba(148,228,255,0.42)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
        ctx.stroke();
        if (sealed) {
            ctx.strokeStyle = 'rgba(190,255,228,0.34)';
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 30 * pulse, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.restore();
    }

    function drawSealBlocker(ctx, camera, blocker, time = 0) {
        const blockScale = Number.isFinite(blocker.scale) ? blocker.scale : 1;
        if (blocker.sealed) {
            const pos = camera.worldToScreen(blocker.x, blocker.y - 6);
            const pulse = 1 + Math.sin(time * 3.2 + (blocker.index || 0) * 0.8) * 0.05;
            ctx.save();
            const glow = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 42 * pulse);
            glow.addColorStop(0, 'rgba(166,239,210,0.20)');
            glow.addColorStop(0.56, 'rgba(166,239,210,0.08)');
            glow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 42 * pulse, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
        drawSpriteCentered(ctx, camera, blocker.spriteKey || 'dec_crate', blocker.x, blocker.y, (blocker.drawW || 90) * blockScale, (blocker.drawH || 90) * blockScale, {
            alpha: blocker.sealed ? 0.96 : 0.88,

            rotation: blocker.rotation,
            exactSize: true,
            brightness: blocker.sealed ? 1.08 : 0.96
        });
    }

    function drawSealLeaks(ctx, camera, room, progress, time) {
        const targets = Array.isArray(room.hiddenSealTargets) ? room.hiddenSealTargets : [];
        const blocked = progress?.puzzleState?.blocked || [];
        targets.forEach((target, index) => {
            if (!target || blocked[index]) return;
            const from = camera.worldToScreen(target.x, target.y);
            const dirX = Number.isFinite(target.leakDirX) ? target.leakDirX : 0;
            const dirY = Number.isFinite(target.leakDirY) ? target.leakDirY : -1;
            const len = Math.hypot(dirX, dirY) || 1;
            const nx = dirX / len;
            const ny = dirY / len;
            const beamLen = 46 + Math.sin(time * 4 + index * 0.8) * 6;
            const toX = from.x + nx * beamLen;
            const toY = from.y + ny * beamLen;
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            const beam = ctx.createLinearGradient(from.x, from.y, toX, toY);
            beam.addColorStop(0, 'rgba(144,228,255,0.24)');
            beam.addColorStop(0.5, 'rgba(144,228,255,0.10)');
            beam.addColorStop(1, 'rgba(144,228,255,0)');
            ctx.strokeStyle = beam;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(toX, toY);
            ctx.stroke();
            ctx.restore();
        });
    }

    function drawLegacyRoom(ctx, camera, room, progress, time) {
        const table = room.hiddenLegacyTable;
        if (table) {
            const scale = Number.isFinite(table.scale) ? table.scale : 1;
            const scaleX = Number.isFinite(table.scaleX) ? table.scaleX : 1;
            const scaleY = Number.isFinite(table.scaleY) ? table.scaleY : 1;
            const w = (table.w || 214) * scale * scaleX;
            const h = (table.h || 72) * scale * scaleY;
            drawSpriteCentered(ctx, camera, 'desk', table.x, table.y, w, h, {
                alpha: 0.98,
                rotation: table.rotation,
                exactSize: true
            });
            const p = camera.worldToScreen(table.x, table.y + h * 0.16);
            ctx.save();
            const pool = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, Math.max(64, w * 0.52));
            pool.addColorStop(0, 'rgba(255,214,160,0.08)');
            pool.addColorStop(0.62, 'rgba(255,214,160,0.03)');
            pool.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = pool;
            ctx.beginPath();
            ctx.ellipse(p.x, p.y, Math.max(52, w * 0.36), Math.max(18, h * 0.38), 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }

        const candle = room.hiddenLegacyCandle;
        if (candle) {
            drawCandleNode(ctx, camera, { x: candle.x, y: candle.y, index: 0, scale: 0.72, rotation: candle.rotation }, true, time);
        }
    }

    function drawAnswerNode(ctx, camera, node, profileColor, activeQuestion) {
        const pos = camera.worldToScreen(node.x, node.y);
        ctx.save();
        const grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 44);
        grad.addColorStop(0, toRgba(profileColor, activeQuestion ? 0.24 : 0.12));
        grad.addColorStop(1, toRgba(profileColor, 0));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 44, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'rgba(16,18,28,0.88)';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 24, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = activeQuestion ? toRgba(profileColor, 0.82) : 'rgba(255,255,255,0.22)';
        ctx.lineWidth = activeQuestion ? 2.4 : 1.2;
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 24, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,255,255,0.92)';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(node.label || String(node.answerValue), pos.x, pos.y + 6);
        ctx.restore();
    }


    function drawHiddenInteractCue(ctx, camera, game, room) {
        const target = getHiddenInteractable(game, room);
        if (!target) return;
        const profile = room.hiddenProfile || getProfile(room.hiddenRoomFloor || 1);
        const color = profile?.color || '#b9f4ff';
        const time = room.hiddenRenderTime || 0;
        const pos = camera.worldToScreen(target.x, target.y - 8);
        const pulse = 1 + Math.sin(time * 5.6) * 0.08;
        const radius = Math.max(34, (target.radius || 42) * 0.9) * pulse;

        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        const glow = ctx.createRadialGradient(pos.x, pos.y - radius * 0.18, 0, pos.x, pos.y - radius * 0.18, radius * 1.18);
        glow.addColorStop(0, toRgba(color, 0.22));
        glow.addColorStop(0.42, toRgba(color, 0.12));
        glow.addColorStop(1, toRgba(color, 0));
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.ellipse(pos.x, pos.y - radius * 0.12, radius * 0.92, radius * 1.12, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = toRgba(color, 0.28);
        for (let i = 0; i < 3; i++) {
            const phase = time * (1.8 + i * 0.28) + i * 1.4;
            const px = pos.x + Math.sin(phase) * (radius * 0.34 + i * 6);
            const py = pos.y - radius * 0.62 - ((phase * 16) % 18);
            ctx.beginPath();
            ctx.arc(px, py, i === 0 ? 2.2 : 1.6, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }

    function drawOrb(ctx, camera, room, progress, time, game) {
        if (!room.hiddenOrb) return;
        const profile = room.hiddenProfile || getProfile(room.hiddenRoomFloor || 1);
        const orb = ensureLayoutTargetDefaults(room.hiddenOrb);
        const pedestal = room.hiddenOrbPedestal ? ensureLayoutTargetDefaults(room.hiddenOrbPedestal) : null;
        const pos = camera.worldToScreen(orb.x, orb.y);
        const flash = room.hiddenOrbFlash;
        const flashT = flash ? easeOutCubic(flash.time / flash.maxTime) : 0;
        const restingColor = progress.completed ? '#8fb8ff' : profile.color;
        const flashColor = flash?.color || restingColor;
        const haloRadius = 40 + flashT * 16;
        const floor = room.hiddenRoomFloor || 1;
        const idleAlpha = progress.completed ? 0.16 : 0.05;
        const grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, haloRadius);
        grad.addColorStop(0, toRgba(progress.failed ? '#7c8390' : flashColor, progress.completed ? (idleAlpha + flashT * 0.18) : (idleAlpha + flashT * 0.16)));
        grad.addColorStop(0.52, toRgba(progress.failed ? '#7c8390' : flashColor, progress.completed ? 0.05 : 0.02));
        grad.addColorStop(1, toRgba(progress.failed ? '#7c8390' : flashColor, 0));
        ctx.save();
        const basePool = ctx.createRadialGradient(pos.x, pos.y + 12, 0, pos.x, pos.y + 12, floor === 6 ? 46 : 40);
        basePool.addColorStop(0, floor === 6 ? 'rgba(255,212,160,0.08)' : (progress.completed ? 'rgba(143,184,255,0.10)' : 'rgba(143,216,255,0.06)'));
        basePool.addColorStop(0.6, floor === 6 ? 'rgba(255,212,160,0.03)' : (progress.completed ? 'rgba(143,184,255,0.04)' : 'rgba(143,216,255,0.02)'));
        basePool.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = basePool;
        ctx.beginPath();
        ctx.ellipse(pos.x, pos.y + 12, 28, 16, 0, 0, Math.PI * 2);
        ctx.fill();

        if (progress.completed || flashT > 0.01 || progress.failed) {
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, haloRadius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        const drawOrbSprite = () => {
            const orbScale = Number.isFinite(orb.scale) ? orb.scale : 1;
            const orbScaleX = Number.isFinite(orb.scaleX) ? orb.scaleX : 1;
            const orbScaleY = Number.isFinite(orb.scaleY) ? orb.scaleY : 1;
            const orbSize = Math.max(44, Math.round((orb.radius || orb.baseRadius || 34) * 1.38)) * orbScale;
            drawSpriteCentered(ctx, camera, 'item_crystal_ball', orb.x, orb.y, orbSize * orbScaleX, orbSize * orbScaleY, {
                alpha: progress.failed ? 0.62 : (progress.completed ? 1 : (0.92 + flashT * 0.08)),

                tint: progress.failed ? 'rgba(82,88,102,0.58)' : null,
                rotation: orb.rotation,
                exactSize: true
            });
            ctx.save();
            const orbScreen = camera.worldToScreen(orb.x, orb.y);
            ctx.strokeStyle = progress.failed ? 'rgba(180,186,196,0.12)' : `rgba(255,255,255,${0.20 + flashT * 0.42 + (progress.completed ? 0.20 : 0)})`;
            ctx.lineWidth = progress.completed ? 1.8 : 1.4;
            ctx.beginPath();
            ctx.ellipse(orbScreen.x, orbScreen.y + 2, 16 * orbScale * orbScaleX, 16 * orbScale * orbScaleY, 0, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        };

        const drawPedestalSprite = () => {
            if (!pedestal) return;
            const scale = Number.isFinite(pedestal.scale) ? pedestal.scale : 1;
            const scaleX = Number.isFinite(pedestal.scaleX) ? pedestal.scaleX : 1;
            const scaleY = Number.isFinite(pedestal.scaleY) ? pedestal.scaleY : 1;
            drawSpriteCentered(ctx, camera, 'dec_pillar', pedestal.x, pedestal.y, (pedestal.w || pedestal.baseW || 118) * scale * scaleX, (pedestal.h || pedestal.baseH || 58) * scale * scaleY, {

                alpha: pedestal.alpha || 0.95,
                rotation: pedestal.rotation,
                exactSize: true
            });
        };

        const orbLayer = Number.isFinite(orb.editorLayer) ? orb.editorLayer : 0;
        const pedestalLayer = Number.isFinite(pedestal?.editorLayer) ? pedestal.editorLayer : -1;
        if (pedestalLayer <= orbLayer) {
            drawPedestalSprite();
            drawOrbSprite();
        } else {
            drawOrbSprite();
            drawPedestalSprite();
        }
    }

    function drawFloor2Critters(ctx, camera, room, time) {
        const stains = Array.isArray(room.hiddenWormBloodStains) ? room.hiddenWormBloodStains : [];
        stains.forEach((stain, index) => {
            const pos = camera.worldToScreen(stain.x, stain.y);
            const r = stain.radius || 18;
            ctx.save();
            ctx.globalCompositeOperation = 'multiply';
            const smear = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, r * 1.3);
            smear.addColorStop(0, 'rgba(120,12,18,0.56)');
            smear.addColorStop(0.55, 'rgba(88,8,14,0.36)');
            smear.addColorStop(1, 'rgba(48,0,0,0)');
            ctx.fillStyle = smear;
            ctx.beginPath();
            ctx.ellipse(pos.x, pos.y, r * 1.1, r * 0.72, (stain.seed || index) * 0.3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        });
        const critters = Array.isArray(room.hiddenWormCritters) ? room.hiddenWormCritters : [];
        critters.forEach((critter, index) => {
            if (!critter || !critter.alive || critter.hiddenTime > 0) return;
            const isRed = !!critter.red;
            const palette = (typeof room.getAmbientWormPalette === 'function' ? room.getAmbientWormPalette() : null) || {
                body: '#75c5d2',
                core: '#a8dee6',
                glow: { r: 114, g: 188, b: 203 }
            };
            const worm = {
                x: critter.x,
                y: critter.y + 6,
                dir: Math.atan2(critter.vy || 0.2, critter.vx || 1),
                len: isRed ? 18 : 17,
                thickness: isRed ? 2.5 : 2.3,
                wiggle: isRed ? 2.15 : 2.0,
                phase: time * 5.2 + (critter.driftPhase || index),
                glowScale: isRed ? 1.16 : 0.92,
                color: isRed ? {
                    body: '#be5661',
                    core: '#e1a0a7',
                    glow: { r: 210, g: 98, b: 112 }
                } : palette
            };
            const pos = camera.worldToScreen(worm.x, worm.y + 6);
            const wormMul = getHiddenVisualTuning().wormBrightness;
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            drawCachedHiddenRadial(ctx, pos.x, pos.y, (isRed ? 19 : 16) * (0.84 + wormMul * 0.16), (isRed ? 10 : 8) * (0.84 + wormMul * 0.16), isRed ? '#d26270' : '#76d5ee', [
                [0, (isRed ? 0.08 : 0.07) * (0.6 + wormMul * 0.4)],
                [0.58, (isRed ? 0.03 : 0.025) * (0.6 + wormMul * 0.4)],
                [1, 0]
            ], { composite: 'screen' });
            ctx.restore();

            if (typeof room.drawWormCritter === 'function') {
                room.drawWormCritter(ctx, camera, worm, { renderMode: 'normal' });
            }
        });

        const rabbit = room.hiddenDemoRabbit;
        if (rabbit && rabbit.active) {
            rabbit.trail.forEach((trail) => {
                const p = camera.worldToScreen(trail.x, trail.y);
                ctx.save();
                ctx.globalCompositeOperation = 'screen';
                ctx.globalAlpha = Math.max(0, trail.life / 0.18) * 0.26;
                ctx.fillStyle = '#91f2ff';
                ctx.beginPath();
                ctx.ellipse(p.x, p.y, 20, 14, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });
            const p = camera.worldToScreen(rabbit.x, rabbit.y);
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            drawCachedHiddenRadial(ctx, p.x, p.y, 52, 52, '#99f2ff', [[0, 0.32], [0.55, 0.12], [1, 0]], { composite: 'screen' });
            ctx.globalCompositeOperation = 'source-over';
            const frame = `rabbit_black_${((Math.floor(time * 10) % 4) + 1)}`;
            drawSpriteCentered(ctx, camera, frame, rabbit.x, rabbit.y, 54, 54, { alpha: 1, raw: true, flipX: rabbit.facing < 0 });
            ctx.restore();
        }
    }

    function drawConvergence(ctx, camera, room, game, time) {
        const progress = getFloorProgress(game, 6);
        const target = room.hiddenConvergencePoint;
        const streams = Array.isArray(room.hiddenConvergenceStreams) ? room.hiddenConvergenceStreams : [];
        if (!target) return;
        const targetPos = camera.worldToScreen(target.x, target.y);

        streams.forEach((source, index) => {
            const s = camera.worldToScreen(source.x, source.y);
            const alpha = 0.16 + Math.sin(time * 2.5 + index) * 0.04;
            ctx.save();
            ctx.strokeStyle = `rgba(185,244,255,${Math.max(0.08, alpha)})`;
            ctx.lineWidth = 2.2;
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(targetPos.x, targetPos.y);
            ctx.stroke();
            ctx.restore();
        });

        const holdRatio = clamp((progress.puzzleState.holdTime || 0) / 1, 0, 1);
        ctx.save();
        const pulse = 1 + Math.sin(time * 4.5) * 0.05;
        const r = 28 * pulse;
        const glow = ctx.createRadialGradient(targetPos.x, targetPos.y, 0, targetPos.x, targetPos.y, 64);
        glow.addColorStop(0, `rgba(185,244,255,${0.12 + holdRatio * 0.18})`);
        glow.addColorStop(1, 'rgba(185,244,255,0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(targetPos.x, targetPos.y, 64, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(185,244,255,${0.36 + holdRatio * 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(targetPos.x, targetPos.y, r, 0, Math.PI * 2);
        ctx.stroke();

        if (holdRatio > 0) {
            ctx.strokeStyle = 'rgba(236,255,255,0.92)';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(targetPos.x, targetPos.y, r + 6, -Math.PI * 0.5, -Math.PI * 0.5 + Math.PI * 2 * holdRatio);
            ctx.stroke();
        }
        ctx.restore();
    }

    function drawBanner(ctx, room, progress, time) {
        const profile = room.hiddenProfile;
        if (!profile) return;
        const alpha = room.hiddenTitleTime > 0 ? clamp(room.hiddenTitleTime / 2.8, 0, 1) : 0;
        if (alpha <= 0 && !(room.hiddenRoomFloor === 4) && !(room.hiddenRoomFloor === 3) && !(room.hiddenRoomFloor === 6)) return;
        const x = ctx.canvas.width * 0.5;
        const y = 64;
        ctx.save();
        if (alpha > 0) {
            ctx.globalAlpha = alpha;
            ctx.fillStyle = 'rgba(8,10,18,0.68)';
            ctx.fillRect(x - 180, y - 28, 360, 56);
            ctx.strokeStyle = toRgba(profile.color, 0.55);
            ctx.strokeRect(x - 180, y - 28, 360, 56);
            ctx.fillStyle = toRgba(profile.color, 0.98);
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(profile.title, x, y - 2);
            ctx.fillStyle = 'rgba(255,255,255,0.82)';
            ctx.font = '12px Arial';

        }
        ctx.restore();
    }

    function drawVignette(ctx, room, game, time) {
        return;
    }

    function patchRoomDraw() {
        if (typeof Room === 'undefined' || !Room.prototype || Room.prototype.__hiddenRoomDrawPatched) return;
        const original = Room.prototype.draw;
        if (typeof original !== 'function') return;
        Room.prototype.draw = function patchedHiddenRoomBaseDraw(ctx, camera, sprites) {
            const result = original.apply(this, arguments);
            const game = global.game;
            if (!game || this.type !== 'hidden') return result;
            const floor = getFloor(game, this);
            if (floor !== 2) return result;
            game.ensureHiddenRoomSetup?.(this);
            return result;
        };
        Room.prototype.__hiddenRoomDrawPatched = true;
    }

    function patchGamePrototype() {
        if (typeof Game === 'undefined' || !Game.prototype || Game.prototype.__hiddenRoomPatched) return;

        const originalStart = Game.prototype.start;
        if (typeof originalStart === 'function') {
            Game.prototype.start = function patchedStart() {
                ensureState(this);
                return originalStart.apply(this, arguments);
            };
        }

        Game.prototype.ensureHiddenRoomSetup = function patchedEnsureHiddenRoomSetup(room) {
            ensureState(this);
            return setupRoom(this, room);
        };

        Game.prototype.getHiddenRoomProgress = function patchedGetHiddenRoomProgress(floor) {
            return getFloorProgress(this, floor);
        };

        const originalGetInteractionContext = Game.prototype.getInteractionContext;
        if (typeof originalGetInteractionContext === 'function') {
            Game.prototype.getInteractionContext = function patchedGetInteractionContext() {
                const room = this.curRoom;
                if (room && room.type === 'hidden') {
                    this.ensureHiddenRoomSetup(room);
                    const target = getHiddenInteractable(this, room);
                    const floor = getFloor(this, room);
                    const progress = getFloorProgress(this, floor);
                    if (target) {
                        if (target.kind === 'orb') {
                            if (progress.completed) return { type: 'hidden_orb', label: '' };
                            if (floor === 3) return { type: 'hidden_orb', label: '' };
                            if (floor === 4) return { type: 'hidden_orb', label: '' };
                            if (floor === 6) return { type: 'hidden_orb', label: '' };
                            return { type: 'hidden_orb', label: '' };
                        }
                        if (target.kind === 'candle') {
                            const lit = !!progress.puzzleState.candleStates?.[target.index];
                            return { type: 'hidden_node', label: '' };
                        }
                        if (target.kind === 'answer') return { type: 'hidden_node', label: '' };
                        if (target.kind === 'relic') return { type: 'hidden_node', label: '' };
                    }
                }
                return originalGetInteractionContext.apply(this, arguments);
            };
        }

        const originalTriggerPrimary = Game.prototype.triggerPrimaryInteraction;
        if (typeof originalTriggerPrimary === 'function') {
            Game.prototype.triggerPrimaryInteraction = function patchedTriggerPrimaryInteraction() {
                const room = this.curRoom;
                if (room && room.type === 'hidden') {
                    this.ensureHiddenRoomSetup(room);
                    const target = getHiddenInteractable(this, room);
                    if (target) {
                        if (target.kind === 'orb') return handleOrbInteract(this, room);
                        return handleNodeInteract(this, room, target);
                    }
                }
                return originalTriggerPrimary.apply(this, arguments);
            };
        }

        const originalApplyDamage = Game.prototype.applyDamage;
        if (typeof originalApplyDamage === 'function') {
            Game.prototype.applyDamage = function patchedApplyDamage(e, dmg, stats, bullet) {
                const killed = originalApplyDamage.apply(this, arguments);
                if (killed) onEnemyKilled(this, e);
                return killed;
            };
        }

        const originalUpdate = Game.prototype.update;
        if (typeof originalUpdate === 'function') {
            Game.prototype.update = function patchedHiddenRoomUpdate(dt) {
                const result = originalUpdate.apply(this, arguments);
                const room = this.curRoom;
                if (!room || room.type !== 'hidden') return result;
                this.ensureHiddenRoomSetup(room);
                room.hiddenRenderTime = (room.hiddenRenderTime || 0) + dt;
                room.hiddenTitleTime = Math.max(0, (room.hiddenTitleTime || 0) - dt);
                room.hiddenCompletionTime = Math.max(0, (room.hiddenCompletionTime || 0) - dt);
                room.hiddenFailureTime = Math.max(0, (room.hiddenFailureTime || 0) - dt);
                if (room.hiddenPulse) {
                    room.hiddenPulse.time = Math.max(0, room.hiddenPulse.time - dt);
                    if (room.hiddenPulse.time <= 0) room.hiddenPulse = null;
                }
                if (room.hiddenOrbFlash) {
                    room.hiddenOrbFlash.time = Math.max(0, room.hiddenOrbFlash.time - dt);
                    if (room.hiddenOrbFlash.time <= 0) room.hiddenOrbFlash = null;
                }

                const floor = getFloor(this, room);
                updateSolveAnimation(this, room, floor, dt);
                if (floor === 2) updateFloor2(this, room, dt);
                if (floor === 3) updateFloor3(this, room, dt);
                if (floor === 4) updateFloor4(this, room, dt);
                if (floor === 5) updateFloor5(this, room, dt);
                if (floor === 6) updateFloor6(this, room, dt);
                return result;
            };
        }

        const originalDraw = Game.prototype.draw;
        if (typeof originalDraw === 'function') {
            Game.prototype.draw = function patchedGameDraw() {
                const result = originalDraw.apply(this, arguments);
                const room = this.curRoom;
                if (!room || room.type !== 'hidden' || !this.ctx || !this.camera) return result;
                this.ensureHiddenRoomSetup(room);
                const floor = getFloor(this, room);
                const progress = getFloorProgress(this, floor);
                const time = room.hiddenRenderTime || 0;
                this.ctx.save();
                drawVignette(this.ctx, room, this, time);
                drawHiddenDecor(this.ctx, this.camera, room, this);
                drawAmbientMotes(this.ctx, this.camera, room, time);
                getSortedEditorList(room.hiddenPuzzleNodes || []).forEach(node => {
                    if (node.kind === 'candle') {
                        drawCandleNode(this.ctx, this.camera, node, !!progress.puzzleState.candleStates?.[node.index], time);
                    } else if (node.kind === 'mushroom') {
                        drawMushroomNode(this.ctx, this.camera, node, progress.puzzleState, time);
                    } else if (node.kind === 'relic') {
                        drawRelicNode(this.ctx, this.camera, node, false, room.hiddenProfile.color, time, false);
                    } else if (node.kind === 'seal_target') {
                        drawSealTarget(this.ctx, this.camera, node, !!progress.puzzleState.blocked?.[node.index], time);
                    } else if (node.kind === 'seal_blocker') {
                        drawSealBlocker(this.ctx, this.camera, node, time);
                    } else if (node.kind === 'answer') {
                        drawAnswerNode(this.ctx, this.camera, node, room.hiddenProfile.color, !progress.failed);
                    }
                });
                if (floor === 6) drawConvergence(this.ctx, this.camera, room, this, time);
                drawOrb(this.ctx, this.camera, room, progress, time, this);
                drawHiddenInteractCue(this.ctx, this.camera, this, room);
                drawBanner(this.ctx, room, progress, time);
                this.ctx.restore();
                return result;
            };
        }


        Game.prototype.debugJumpToHiddenRoom = function patchedDebugJumpToHiddenRoom() {
            const room = typeof this.debugFindRoomByType === 'function'
                ? this.debugFindRoomByType('hidden')
                : null;
            if (!room) {
                this.damageNumbers?.spawn(this.player?.cx || 0, (this.player?.cy || 0) - 40, '本层无隐藏房!', { color: '#f44', size: 14, life: 1.2 });
                return false;
            }
            if (typeof this.debugTeleportToRoom === 'function') this.debugTeleportToRoom(room, '跳转隐藏房');
            return true;
        };

        Game.prototype.toggleHiddenLayoutEditor = function patchedToggleHiddenLayoutEditor() {
            installHiddenLayoutEditorInput();
            const state = getHiddenLayoutEditorState();
            state.active = !state.active;
            if (state.active && this.curRoom?.type === 'hidden') {
                this.ensureHiddenRoomSetup(this.curRoom);
                const selected = getSelectedHiddenLayoutTarget(this.curRoom);
                state.selectedId = selected?.id || null;
            } else {
                state.dragging = null;
            }
            this.damageNumbers?.spawn(this.player?.cx || 0, (this.player?.cy || 0) - 40, state.active ? '布局编辑 ON' : '布局编辑 OFF', { color: state.active ? '#6f6' : '#aaa', size: 14, life: 1.1 });
            this.debugPanel?.refreshHiddenRoomEditorTools?.();
            return state.active;
        };

        Game.prototype.saveHiddenRoomLayout = function patchedSaveHiddenRoomLayout() {
            const room = getActiveHiddenLayoutRoom(this);
            if (!room) return false;
            captureHiddenLayoutOverrides(room, room.hiddenRoomFloor || getFloor(this, room));
            this.damageNumbers?.spawn(this.player?.cx || 0, (this.player?.cy || 0) - 40, '隐藏房布局已保存', { color: '#8ff', size: 14, life: 1.2 });
            this.debugPanel?.refreshHiddenRoomEditorTools?.();
            return true;
        };

        Game.prototype.resetHiddenRoomLayout = function patchedResetHiddenRoomLayout() {
            const room = getActiveHiddenLayoutRoom(this);
            if (!room) return false;
            const floor = room.hiddenRoomFloor || getFloor(this, room);
            clearHiddenLayoutOverridesForFloor(floor);
            room.hiddenRuntimeVersion = null;
            room.hiddenMode = null;
            this.ensureHiddenRoomSetup(room);
            this.damageNumbers?.spawn(this.player?.cx || 0, (this.player?.cy || 0) - 40, '隐藏房布局已重置', { color: '#ffd27f', size: 14, life: 1.2 });
            this.debugPanel?.refreshHiddenRoomEditorTools?.();
            return true;
        };

        Game.prototype.cycleHiddenLayoutTarget = function patchedCycleHiddenLayoutTarget(dir) {
            const room = getActiveHiddenLayoutRoom(this);
            if (!room) return null;
            const selected = moveHiddenLayoutSelection(room, dir >= 0 ? 1 : -1);
            this.debugPanel?.refreshHiddenRoomEditorTools?.();
            return selected;
        };

        Game.prototype.scaleHiddenLayoutTarget = function patchedScaleHiddenLayoutTarget(delta) {
            const room = getActiveHiddenLayoutRoom(this);
            if (!room) return null;
            const selected = getSelectedHiddenLayoutTarget(room);
            if (!selected) return null;
            selected.obj.scale = clamp((selected.obj.scale || 1) + delta, 0.2, 4);
            this.debugPanel?.refreshHiddenRoomEditorTools?.();
            return selected.obj.scale;
        };

        Game.prototype.rotateHiddenLayoutTarget = function patchedRotateHiddenLayoutTarget(deg) {
            const room = getActiveHiddenLayoutRoom(this);
            if (!room) return null;
            const selected = getSelectedHiddenLayoutTarget(room);
            if (!selected) return null;
            selected.obj.rotation = (selected.obj.rotation || 0) + (deg * Math.PI / 180);
            this.debugPanel?.refreshHiddenRoomEditorTools?.();
            return selected.obj.rotation;
        };

        Game.prototype.nudgeHiddenLayoutLayer = function patchedNudgeHiddenLayoutLayer(delta) {
            const room = getActiveHiddenLayoutRoom(this);
            if (!room) return null;
            const selected = getSelectedHiddenLayoutTarget(room);
            if (!selected) return null;
            selected.obj.editorLayer = Math.round((selected.obj.editorLayer || 0) + delta);
            this.debugPanel?.refreshHiddenRoomEditorTools?.();
            return selected.obj.editorLayer;
        };

        Game.prototype.moveHiddenLayoutTarget = function patchedMoveHiddenLayoutTarget(dx, dy) {
            const room = getActiveHiddenLayoutRoom(this);
            if (!room) return null;
            const selected = getSelectedHiddenLayoutTarget(room);
            if (!selected) return null;
            nudgeHiddenLayoutTarget(selected, dx || 0, dy || 0);
            this.debugPanel?.refreshHiddenRoomEditorTools?.();
            return { x: selected.obj.x, y: selected.obj.y };
        };

        Game.prototype.resizeHiddenLayoutTarget = function patchedResizeHiddenLayoutTarget(dw, dh) {
            const room = getActiveHiddenLayoutRoom(this);
            if (!room) return null;
            const selected = getSelectedHiddenLayoutTarget(room);
            if (!selected) return null;
            if (!resizeHiddenLayoutTargetObject(selected.obj, dw || 0, dh || 0)) return null;
            this.debugPanel?.refreshHiddenRoomEditorTools?.();
            return {
                w: Number.isFinite(selected.obj.w) ? selected.obj.w : (Number.isFinite(selected.obj.drawW) ? selected.obj.drawW : null),
                h: Number.isFinite(selected.obj.h) ? selected.obj.h : (Number.isFinite(selected.obj.drawH) ? selected.obj.drawH : null),
                radius: Number.isFinite(selected.obj.radius) ? selected.obj.radius : null,
                scaleX: Number.isFinite(selected.obj.scaleX) ? selected.obj.scaleX : 1,
                scaleY: Number.isFinite(selected.obj.scaleY) ? selected.obj.scaleY : 1
            };
        };

        Game.prototype.importHiddenLayoutAssets = async function patchedImportHiddenLayoutAssets(options = {}) {
            const picker = document.createElement('input');
            picker.type = 'file';
            picker.accept = 'image/*';
            picker.multiple = true;
            picker.style.position = 'fixed';
            picker.style.left = '-9999px';
            picker.style.top = '-9999px';
            picker.style.opacity = '0';
            if (options.directory) {
                picker.setAttribute('webkitdirectory', '');
                picker.setAttribute('directory', '');
            }
            document.body.appendChild(picker);
            const loaded = await new Promise((resolve) => {
                let resolved = false;
                const finish = async () => {
                    if (resolved) return;
                    resolved = true;
                    const assets = await importHiddenLayoutAssets(picker.files);
                    picker.remove();
                    resolve(assets);
                };
                picker.addEventListener('change', finish, { once: true });
                picker.addEventListener('cancel', () => {
                    if (resolved) return;
                    resolved = true;
                    picker.remove();
                    resolve([]);
                }, { once: true });
                picker.value = '';
                picker.click();
                setTimeout(() => {
                    if (resolved) return;
                    try {
                        picker.focus();
                    } catch (_) {}
                }, 0);
            });
            if (!loaded.length) {
                this.damageNumbers?.spawn(this.player?.cx || 0, (this.player?.cy || 0) - 40, options.directory ? '目录导入未选择任何图片' : '图片导入未选择任何文件', { color: '#aaa', size: 14, life: 1.2 });
            } else {
                this.damageNumbers?.spawn(this.player?.cx || 0, (this.player?.cy || 0) - 40, `已导入 ${loaded.length} 张素材`, { color: '#8ff', size: 14, life: 1.2 });
            }
            this.debugPanel?.refreshHiddenRoomEditorTools?.();
            return loaded;
        };

        Game.prototype.placeHiddenDecorAsset = function patchedPlaceHiddenDecorAsset(assetId, count = 1) {
            const room = getActiveHiddenLayoutRoom(this);
            if (!room) {
                const action = {
                    type: 'place_failed',
                    reason: 'not_hidden_room',
                    currentRoomType: this.curRoom?.type || null,
                    assetId,
                    count: Number(count) || 1,
                    at: Date.now()
                };
                setHiddenLayoutLastAction(action);
                console.warn('[HiddenRoomLayoutEditor] place failed', action);
                this.damageNumbers?.spawn(this.player?.cx || 0, (this.player?.cy || 0) - 40, '当前不在隐藏房，无法放置素材', { color: '#f88', size: 14, life: 1.2 });
                this.debugPanel?.refreshHiddenRoomEditorTools?.();
                return 0;
            }
            const floor = room.hiddenRoomFloor || getFloor(this, room);
            const asset = getHiddenLayoutAssetLibrary().find((item) => item.id === assetId);
            if (!asset) {
                const action = {
                    type: 'place_failed',
                    reason: 'asset_missing',
                    floor,
                    assetId,
                    count: Number(count) || 1,
                    at: Date.now()
                };
                setHiddenLayoutLastAction(action);
                console.warn('[HiddenRoomLayoutEditor] place failed', action);
                this.damageNumbers?.spawn(this.player?.cx || 0, (this.player?.cy || 0) - 40, '素材不存在或尚未加载完成', { color: '#f88', size: 14, life: 1.2 });
                this.debugPanel?.refreshHiddenRoomEditorTools?.();
                return 0;
            }
            const total = Math.max(1, Math.min(24, Number(count) || 1));
            let created = 0;
            let lastDecor = null;
            const cameraAnchor = {
                x: Number.isFinite(this.camera?.x) ? this.camera.x : roomCenterX(room),
                y: Number.isFinite(this.camera?.y) ? this.camera.y : roomCenterY(room)
            };
            for (let i = 0; i < total; i++) {
                const decor = createHiddenDecorInstanceFromAsset(asset, floor, room, cameraAnchor);
                if (!decor) continue;
                room.hiddenDecor = room.hiddenDecor || [];
                room.hiddenDecor.push(clone(decor));
                lastDecor = decor;
                created += 1;
            }
            if (lastDecor) {
                const state = getHiddenLayoutEditorState();
                state.selectedId = lastDecor.layoutId;
                state.hoverId = lastDecor.layoutId;
            }
            const action = {
                type: created > 0 ? 'place_success' : 'place_failed',
                reason: created > 0 ? 'ok' : 'create_failed',
                floor,
                assetId: asset.id,
                assetName: asset.name,
                countRequested: total,
                countCreated: created,
                x: Math.round(cameraAnchor.x),
                y: Math.round(cameraAnchor.y),
                lastLayoutId: lastDecor?.layoutId || null,
                at: Date.now()
            };
            setHiddenLayoutLastAction(action);
            console.info('[HiddenRoomLayoutEditor] place asset', action);
            this.damageNumbers?.spawn(
                this.player?.cx || roomCenterX(room),
                (this.player?.cy || roomCenterY(room)) - 40,
                created > 0 ? `已放置 ${created} 个 ${asset.name}` : `放置失败: ${asset.name}`,
                { color: created > 0 ? '#8ff' : '#f88', size: 14, life: 1.2 }
            );
            this.debugPanel?.refreshHiddenRoomEditorTools?.();
            return created;
        };

        Game.prototype.deleteSelectedHiddenDecor = function patchedDeleteSelectedHiddenDecor() {
            const room = getActiveHiddenLayoutRoom(this);
            if (!room) return false;
            const selected = getSelectedHiddenLayoutTarget(room);
            if (!selected || selected.kind !== 'custom_decor') return false;
            const floor = room.hiddenRoomFloor || getFloor(this, room);
            room.hiddenDecor = (room.hiddenDecor || []).filter((item) => item.layoutId !== selected.id);
            removeHiddenDecorInstance(floor, selected.id);
            const state = getHiddenLayoutEditorState();
            state.selectedId = null;
            this.debugPanel?.refreshHiddenRoomEditorTools?.();
            return true;
        };

        Game.prototype.clearHiddenPlacedDecor = function patchedClearHiddenPlacedDecor() {
            const room = getActiveHiddenLayoutRoom(this);
            if (!room) return false;
            const floor = room.hiddenRoomFloor || getFloor(this, room);
            room.hiddenDecor = (room.hiddenDecor || []).filter((item) => item.kind !== 'custom_decor');
            clearHiddenDecorInstancesForFloor(floor);
            const floorStore = getFloorLayoutOverrides(floor);
            Object.keys(floorStore).forEach((key) => {
                if (/^custom_decor_/.test(key)) delete floorStore[key];
            });
            saveHiddenLayoutStore();
            const state = getHiddenLayoutEditorState();
            state.selectedId = null;
            this.debugPanel?.refreshHiddenRoomEditorTools?.();
            return true;
        };

        Game.prototype.__hiddenRoomPatched = true;
    }

    function ensureHiddenLayoutEditorGameMethods() {
        if (typeof Game === 'undefined' || !Game.prototype) return;

        if (typeof Game.prototype.importHiddenLayoutAssets !== 'function') {
            Game.prototype.importHiddenLayoutAssets = async function patchedImportHiddenLayoutAssets(options = {}) {
                const picker = document.createElement('input');
                picker.type = 'file';
                picker.accept = 'image/*';
                picker.multiple = true;
                picker.style.position = 'fixed';
                picker.style.left = '-9999px';
                picker.style.top = '-9999px';
                picker.style.opacity = '0';
                if (options.directory) {
                    picker.setAttribute('webkitdirectory', '');
                    picker.setAttribute('directory', '');
                }
                document.body.appendChild(picker);
                const loaded = await new Promise((resolve) => {
                    let resolved = false;
                    const finish = async () => {
                        if (resolved) return;
                        resolved = true;
                        const assets = await importHiddenLayoutAssets(picker.files);
                        picker.remove();
                        resolve(assets);
                    };
                    picker.addEventListener('change', finish, { once: true });
                    picker.addEventListener('cancel', () => {
                        if (resolved) return;
                        resolved = true;
                        picker.remove();
                        resolve([]);
                    }, { once: true });
                    picker.value = '';
                    picker.click();
                    setTimeout(() => {
                        if (resolved) return;
                        try {
                            picker.focus();
                        } catch (_) {}
                    }, 0);
                });
                if (!loaded.length) {
                    this.damageNumbers?.spawn(this.player?.cx || 0, (this.player?.cy || 0) - 40, options.directory ? '目录导入未选择任何图片' : '图片导入未选择任何文件', { color: '#aaa', size: 14, life: 1.2 });
                } else {
                    this.damageNumbers?.spawn(this.player?.cx || 0, (this.player?.cy || 0) - 40, `已导入 ${loaded.length} 张素材`, { color: '#8ff', size: 14, life: 1.2 });
                }
                this.debugPanel?.refreshHiddenRoomEditorTools?.();
                return loaded;
            };
        }

        if (typeof Game.prototype.placeHiddenDecorAsset !== 'function') {
            Game.prototype.placeHiddenDecorAsset = function patchedPlaceHiddenDecorAsset(assetId, count = 1) {
                const room = getActiveHiddenLayoutRoom(this);
                if (!room) {
                    const action = {
                        type: 'place_failed',
                        reason: 'not_hidden_room',
                        currentRoomType: this.curRoom?.type || null,
                        assetId,
                        count: Number(count) || 1,
                        at: Date.now()
                    };
                    setHiddenLayoutLastAction(action);
                    console.warn('[HiddenRoomLayoutEditor] place failed', action);
                    this.damageNumbers?.spawn(this.player?.cx || 0, (this.player?.cy || 0) - 40, '当前不在隐藏房，无法放置素材', { color: '#f88', size: 14, life: 1.2 });
                    this.debugPanel?.refreshHiddenRoomEditorTools?.();
                    return 0;
                }
                const floor = room.hiddenRoomFloor || getFloor(this, room);
                const asset = getHiddenLayoutAssetLibrary().find((item) => item.id === assetId);
                if (!asset) {
                    const action = {
                        type: 'place_failed',
                        reason: 'asset_missing',
                        floor,
                        assetId,
                        count: Number(count) || 1,
                        at: Date.now()
                    };
                    setHiddenLayoutLastAction(action);
                    console.warn('[HiddenRoomLayoutEditor] place failed', action);
                    this.damageNumbers?.spawn(this.player?.cx || 0, (this.player?.cy || 0) - 40, '素材不存在或尚未加载完成', { color: '#f88', size: 14, life: 1.2 });
                    this.debugPanel?.refreshHiddenRoomEditorTools?.();
                    return 0;
                }
                const total = Math.max(1, Math.min(24, Number(count) || 1));
                let created = 0;
                let lastDecor = null;
                const cameraAnchor = {
                    x: Number.isFinite(this.camera?.x) ? this.camera.x : roomCenterX(room),
                    y: Number.isFinite(this.camera?.y) ? this.camera.y : roomCenterY(room)
                };
                for (let i = 0; i < total; i++) {
                    const decor = createHiddenDecorInstanceFromAsset(asset, floor, room, cameraAnchor);
                    if (!decor) continue;
                    room.hiddenDecor = room.hiddenDecor || [];
                    room.hiddenDecor.push(clone(decor));
                    lastDecor = decor;
                    created += 1;
                }
                if (lastDecor) {
                    const state = getHiddenLayoutEditorState();
                    state.selectedId = lastDecor.layoutId;
                    state.hoverId = lastDecor.layoutId;
                }
                const action = {
                    type: created > 0 ? 'place_success' : 'place_failed',
                    reason: created > 0 ? 'ok' : 'create_failed',
                    floor,
                    assetId: asset.id,
                    assetName: asset.name,
                    countRequested: total,
                    countCreated: created,
                    x: Math.round(cameraAnchor.x),
                    y: Math.round(cameraAnchor.y),
                    lastLayoutId: lastDecor?.layoutId || null,
                    at: Date.now()
                };
                setHiddenLayoutLastAction(action);
                console.info('[HiddenRoomLayoutEditor] place asset', action);
                this.damageNumbers?.spawn(
                    this.player?.cx || roomCenterX(room),
                    (this.player?.cy || roomCenterY(room)) - 40,
                    created > 0 ? `已放置 ${created} 个 ${asset.name}` : `放置失败: ${asset.name}`,
                    { color: created > 0 ? '#8ff' : '#f88', size: 14, life: 1.2 }
                );
                this.debugPanel?.refreshHiddenRoomEditorTools?.();
                return created;
            };
        }

        if (typeof Game.prototype.deleteSelectedHiddenDecor !== 'function') {
            Game.prototype.deleteSelectedHiddenDecor = function patchedDeleteSelectedHiddenDecor() {
                const room = getActiveHiddenLayoutRoom(this);
                if (!room) return false;
                const selected = getSelectedHiddenLayoutTarget(room);
                if (!selected || selected.kind !== 'custom_decor') return false;
                const floor = room.hiddenRoomFloor || getFloor(this, room);
                room.hiddenDecor = (room.hiddenDecor || []).filter((item) => item.layoutId !== selected.id);
                removeHiddenDecorInstance(floor, selected.id);
                const state = getHiddenLayoutEditorState();
                state.selectedId = null;
                this.debugPanel?.refreshHiddenRoomEditorTools?.();
                return true;
            };
        }

        if (typeof Game.prototype.clearHiddenPlacedDecor !== 'function') {
            Game.prototype.clearHiddenPlacedDecor = function patchedClearHiddenPlacedDecor() {
                const room = getActiveHiddenLayoutRoom(this);
                if (!room) return false;
                const floor = room.hiddenRoomFloor || getFloor(this, room);
                room.hiddenDecor = (room.hiddenDecor || []).filter((item) => item.kind !== 'custom_decor');
                clearHiddenDecorInstancesForFloor(floor);
                const floorStore = getFloorLayoutOverrides(floor);
                Object.keys(floorStore).forEach((key) => {
                    if (/^custom_decor_/.test(key)) delete floorStore[key];
                });
                saveHiddenLayoutStore();
                const state = getHiddenLayoutEditorState();
                state.selectedId = null;
                this.debugPanel?.refreshHiddenRoomEditorTools?.();
                return true;
            };
        }
    }

    function patchTrueEnding() {
        if (typeof TrueEndingSystem === 'undefined' || !TrueEndingSystem.prototype || TrueEndingSystem.prototype.__hiddenRoomPatched) return;
        const originalCheck = TrueEndingSystem.prototype.checkRequirements;
        TrueEndingSystem.prototype.checkRequirements = function patchedCheckRequirements() {
            const game = global.game;
            if (game?.hiddenRooms?.trueEndingUnlocked) return true;
            return typeof originalCheck === 'function' ? originalCheck.apply(this, arguments) : false;
        };
        TrueEndingSystem.prototype.__hiddenRoomPatched = true;
    }


    function installHiddenRoomKeyHandler() {
        if (global.__hiddenRoomKeyHandlerInstalled) return;
        global.addEventListener('keydown', (event) => {
            if (!event || event.repeat) return;
            const key = String(event.key || '').toLowerCase();
            if (key !== 'e') return;
            const game = global.game;
            const room = game?.curRoom;
            if (!game || !room || room.type !== 'hidden') return;
            if (typeof game.triggerPrimaryInteraction !== 'function') return;
            const tag = (event.target && event.target.tagName ? event.target.tagName : '').toLowerCase();
            if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
            event.preventDefault();
            event.stopPropagation();
            game.triggerPrimaryInteraction();
        }, true);
        global.__hiddenRoomKeyHandlerInstalled = true;
    }


    // === v0.36.2 hidden room redesign overrides ===
    const OVR_FLOOR1_TEMPLATES = [
        [1,0,1,0, 0,1,1,0],
        [1,1,0,1, 0,0,1,1],
        [0,1,1,0, 1,0,0,1],
        [1,0,0,1, 1,1,0,0],
        [0,1,0,1, 1,0,1,0],
        [1,1,0,0, 0,1,1,0]
    ].map(row => row.map(Boolean));

    const OVR_FLOOR4_VARIANTS = [
        { key: 'set1_mush_01', w: 86, h: 86, offsetY: -8, glow: '#86ddff', style: 'single' },
        { key: 'set5_mush_02', w: 92, h: 92, offsetY: -6, glow: '#7fd7ff', style: 'single' },
        { key: 'set5_mush_16', w: 82, h: 82, offsetY: -4, glow: '#9be7ff', style: 'single' }
    ];

    const OVR_FLOOR6_DIARY_TEXT = `牛宝：

如果你看到这里，桌上的面包就拿去吃掉。
你小时候一饿就难受，偏偏又总忍着不说。
钱我也给你放在旁边了，路上总会用得上，别嫌沉，能拿多少就拿多少。

你父亲留在上一层了。
他说门后那些东西总得有人拦着，不然你就真的没有路走了。
我知道我劝不住他。
他这个人，一直都是这样。

我们一路往下逃，本来只是想让你活下去。
可是走到这里，我才明白，有些事情早就不是我们能躲开的了。
我看到了那张模糊的脸。
是那个人。
那个一直在指引你回家，指引你往这边来的人。

如果你已经走到这里，就别再为我们停下来了。
把东西带上，好好活着。
别饿着，别冻着，也别再怪自己。

爸爸妈妈永远爱你。`;
    const OVR_FLOOR6_BREAD_TEXT = '牛宝，记得先把面包吃了。路还长，别饿着往前走。';
    const OVR_FLOOR6_MONEY_TEXT = '钱我放在桌旁了。能拿多少就拿多少，路上总会用得上。';

    Object.assign(HIDDEN_ROOM_PROFILES[1], {
        id: 'mushroom_candle_copy',
        title: '平移复刻房',
        color: '#8fd8ff',
        type: 'copy_grid',
        note: '快守不住这里了。\n我们得继续往下逃。\n可到底发生了什么……'
    });
    Object.assign(HIDDEN_ROOM_PROFILES[2], {
        id: 'burrow_worms',
        title: '异色蠕虫房',
        color: '#95e4ff',
        type: 'burrow_worms'
    });
    Object.assign(HIDDEN_ROOM_PROFILES[3], {
        color: '#8fe6ff',
        type: 'mushroom_sequence'
    });
    Object.assign(HIDDEN_ROOM_PROFILES[4], {
        id: 'memory_projection',
        title: '投影记忆房',
        color: '#8fdcff',
        type: 'memory_projection',
        note: '牛牛，如果你能来到这里，\n先照顾好自己。\n我们快要坚持不住了……'
    });
    Object.assign(HIDDEN_ROOM_PROFILES[5], {
        id: 'father_barricade',
        title: '父亲防线房',
        color: '#a6efd2',
        type: 'father_barricade'
    });
    Object.assign(HIDDEN_ROOM_PROFILES[6], {
        id: 'legacy_room',
        title: '母亲遗产房',
        color: '#ffd5a4',
        type: 'legacy_room',
        noteSpeaker: '母亲的日记',
        note: OVR_FLOOR6_DIARY_TEXT
    });

    function seededRng(seed) {
        let t = (hashString(seed) || 1) >>> 0;
        return function () {
            t += 0x6D2B79F5;
            let r = Math.imul(t ^ (t >>> 15), 1 | t);
            r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
            return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
        };
    }

    function shuffleWithRng(values, rng) {
        const arr = values.slice();
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(rng() * (i + 1));
            const tmp = arr[i];
            arr[i] = arr[j];
            arr[j] = tmp;
        }
        return arr;
    }

    function seededPermutation(size, seed) {
        const base = Array.from({ length: size }, (_, i) => i);
        return shuffleWithRng(base, seededRng(seed));
    }

function createFloorState() {
        return {
            discovered: false,
            started: false,
            completed: false,
            failed: false,
            attempts: 0,
            witnessed: false,
            phase: 'idle',
            crystalState: 'dormant',
            solveAnimTimer: 0,
            crystalActivated: false,
            puzzleState: {}
        };
    }

function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

const SHARED_HIDDEN_LAYOUT_IDS = new Set(['orb', 'orb_pedestal']);

function getHiddenLayoutStore() {
        if (!global.__hiddenRoomLayoutStore) {
            let parsed = { version: HIDDEN_ROOM_VERSION, floors: {} };
            try {
                const raw = localStorage.getItem(HIDDEN_LAYOUT_STORAGE_KEY);
                if (raw) {
                    const next = JSON.parse(raw);
                    if (next && typeof next === 'object') parsed = next;
                }
            } catch (err) {
                console.warn('[HiddenRoomLayoutEditor] failed to load layout store', err);
            }
            if (!parsed.floors || typeof parsed.floors !== 'object') parsed.floors = {};
            if (!parsed.sharedTargets || typeof parsed.sharedTargets !== 'object') parsed.sharedTargets = {};
            global.__hiddenRoomLayoutStore = parsed;
        }
        return global.__hiddenRoomLayoutStore;
    }

function saveHiddenLayoutStore() {
        try {
            const store = getHiddenLayoutStore();
            store.version = HIDDEN_ROOM_VERSION;
            localStorage.setItem(HIDDEN_LAYOUT_STORAGE_KEY, JSON.stringify(store));
        } catch (err) {
            console.warn('[HiddenRoomLayoutEditor] failed to save layout store', err);
        }
    }

function getHiddenLayoutRuntimeState() {
        if (!global.__hiddenRoomLayoutRuntimeState) {
            global.__hiddenRoomLayoutRuntimeState = {
                assets: [],
                decorByFloor: {},
                nextAssetId: 1,
                nextDecorId: 1,
                builtinAssetLoadPromise: null,
                builtinAssetsLoaded: false,
                lastAction: null
            };
        }
        return global.__hiddenRoomLayoutRuntimeState;
    }

function setHiddenLayoutLastAction(action) {
        getHiddenLayoutRuntimeState().lastAction = action || null;
    }

function getHiddenLayoutAssetLibrary() {
        void ensureBuiltinHiddenLayoutAssets();
        return getHiddenLayoutRuntimeState().assets;
    }

function getHiddenLayoutFloorCustomDecor(floor) {
        const state = getHiddenLayoutRuntimeState();
        const key = String(floor || 0);
        if (!Array.isArray(state.decorByFloor[key])) state.decorByFloor[key] = [];
        return state.decorByFloor[key];
    }

function sanitizeHiddenLayoutAssetName(name) {
        return String(name || 'asset').replace(/[^\w\u4e00-\u9fa5.-]+/g, '_').slice(0, 48) || 'asset';
    }

function getCustomDecorImage(src) {
        if (!src) return null;
        if (!global.__hiddenRoomCustomDecorImages) global.__hiddenRoomCustomDecorImages = {};
        if (!global.__hiddenRoomCustomDecorImages[src]) {
            const img = new Image();
            img.decoding = 'async';
            img.src = src;
            global.__hiddenRoomCustomDecorImages[src] = img;
        }
        return global.__hiddenRoomCustomDecorImages[src];
    }

const BUILTIN_HIDDEN_LAYOUT_ASSET_SOURCES = [
        'assets/runtime/sprites/secretroom/dec_mushroom.png',
        'assets/runtime/sprites/secretroom/dec_candle.png',
        'assets/runtime/sprites/secretroom/dec_barrel.png',
        'assets/runtime/sprites/secretroom/dec_crate.png',
        'assets/runtime/sprites/secretroom/dec_pillar.png',
        'assets/runtime/sprites/secretroom/dec_statue.png',
        'assets/runtime/sprites/secretroom/desk.png',
        'assets/runtime/sprites/secretroom/item_book.png',
        'assets/runtime/sprites/secretroom/item_bread.png',
        'assets/runtime/sprites/secretroom/item_coin_bag.png',
        'assets/runtime/sprites/secretroom/item_crystal_ball.png',
        'assets/runtime/sprites/secretroom/item_lantern.png',
        'assets/runtime/sprites/secretroom/item_skull.png',
        'assets/runtime/sprites/secretroom/item_torch.png',
        'assets/runtime/sprites/secretroom/set1_mush_01.png',
        'assets/runtime/sprites/secretroom/set1_mush_02.png',
        'assets/runtime/sprites/secretroom/set1_mush_08.png',
        'assets/runtime/sprites/secretroom/set1_mush_11.png',
        'assets/runtime/sprites/secretroom/set1_mush_13.png',
        'assets/runtime/sprites/secretroom/set2_mush_01.png',
        'assets/runtime/sprites/secretroom/set2_mush_02.png',
        'assets/runtime/sprites/secretroom/set2_mush_05.png',
        'assets/runtime/sprites/secretroom/set2_mush_12.png',
        'assets/runtime/sprites/secretroom/set2_mush_15.png',
        'assets/runtime/sprites/secretroom/set2_mush_16.png',
        'assets/runtime/sprites/secretroom/set5_mush_01.png',
        'assets/runtime/sprites/secretroom/set5_mush_02.png',
        'assets/runtime/sprites/secretroom/set5_mush_09.png',
        'assets/runtime/sprites/secretroom/set5_mush_10.png',
        'assets/runtime/sprites/secretroom/set5_mush_11.png',
        'assets/runtime/sprites/secretroom/set5_mush_16.png',
        'assets/runtime/sprites/secretroom/mushroom/cluster_mush_01.png',
        'assets/runtime/sprites/secretroom/mushroom/cluster_mush_02.png',
        'assets/runtime/sprites/secretroom/mushroom/cluster_mush_03.png',
        'assets/runtime/sprites/secretroom/mushroom/cluster_mush_04.png',
        'assets/runtime/sprites/secretroom/mushroom/cluster_mush_05.png',
        'assets/runtime/sprites/secretroom/mushroom/cluster_mush_06.png',
        'assets/runtime/sprites/secretroom/layer1_set2_floor_crack.png',
        'assets/runtime/sprites/secretroom/layer1_set3_floor_crack.png',
        'assets/runtime/sprites/secretroom/layer1_set4_floor_crack.png',
        'assets/runtime/sprites/secretroom/layer1_set5_floor_crack.png'
    ];

function findHiddenLayoutBuiltinAssetByName(name) {
        const normalized = sanitizeHiddenLayoutAssetName(name).toLowerCase();
        if (!normalized) return null;
        return getHiddenLayoutRuntimeState().assets.find((asset) => {
            const assetName = sanitizeHiddenLayoutAssetName(asset?.name || '').toLowerCase();
            const fileName = sanitizeHiddenLayoutAssetName(String(asset?.fileName || '').replace(/\.[^.]+$/, '')).toLowerCase();
            return !!asset?.builtIn && (assetName === normalized || fileName === normalized);
        }) || null;
    }

function resolvePersistentHiddenDecorSource(snapshot) {
        if (!snapshot || typeof snapshot !== 'object') return null;
        const currentSrc = typeof snapshot.imageSrc === 'string' ? snapshot.imageSrc : '';
        if (currentSrc && !/^blob:/i.test(currentSrc)) return currentSrc;
        const builtin = findHiddenLayoutBuiltinAssetByName(snapshot.customAssetName || snapshot.layoutLabel || '');
        return builtin?.src || currentSrc || null;
    }

function loadHiddenLayoutAssetFromUrl(src, options = {}) {
        if (!src) return Promise.resolve(null);
        const runtime = getHiddenLayoutRuntimeState();
        const existing = runtime.assets.find((asset) => asset.src === src);
        if (existing) return Promise.resolve(existing);
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => {
                const baseName = src.split('/').pop() || 'asset';
                const asset = {
                    id: options.id || `asset_${runtime.nextAssetId++}`,
                    name: sanitizeHiddenLayoutAssetName((options.name || baseName).replace(/\.[^.]+$/, '')),
                    fileName: baseName,
                    fileSize: 0,
                    lastModified: 0,
                    src,
                    width: img.naturalWidth || img.width || 64,
                    height: img.naturalHeight || img.height || 64,
                    builtIn: !!options.builtIn
                };
                runtime.assets.push(asset);
                global.__hiddenRoomCustomDecorImages = global.__hiddenRoomCustomDecorImages || {};
                global.__hiddenRoomCustomDecorImages[src] = img;
                resolve(asset);
            };
            img.onerror = () => resolve(null);
            img.decoding = 'async';
            img.src = src;
        });
    }

function ensureBuiltinHiddenLayoutAssets() {
        const runtime = getHiddenLayoutRuntimeState();
        if (runtime.builtinAssetsLoaded) return Promise.resolve(runtime.assets);
        if (runtime.builtinAssetLoadPromise) return runtime.builtinAssetLoadPromise;
        runtime.builtinAssetLoadPromise = Promise.all(
            BUILTIN_HIDDEN_LAYOUT_ASSET_SOURCES.map((src, index) => loadHiddenLayoutAssetFromUrl(src, {
                id: `builtin_asset_${index + 1}`,
                builtIn: true
            }))
        ).then((assets) => {
            runtime.builtinAssetsLoaded = true;
            runtime.builtinAssetLoadPromise = null;
            global.game?.debugPanel?.refreshHiddenRoomEditorTools?.();
            return assets.filter(Boolean);
        }).catch((err) => {
            runtime.builtinAssetLoadPromise = null;
            console.warn('[HiddenRoomLayoutEditor] failed to preload builtin assets', err);
            return runtime.assets;
        });
        return runtime.builtinAssetLoadPromise;
    }

async function importHiddenLayoutAssets(files) {
        const list = Array.from(files || []).filter((file) => file && /^image\//.test(file.type || ''));
        if (!list.length) return [];
        const runtime = getHiddenLayoutRuntimeState();
        const loaded = await Promise.all(list.map((file) => new Promise((resolve) => {
            const existing = runtime.assets.find((asset) => asset.fileName === file.name && asset.fileSize === file.size && asset.lastModified === file.lastModified);
            if (existing) return resolve(existing);
            const src = URL.createObjectURL(file);
            const img = new Image();
            img.onload = () => {
                const asset = {
                    id: `asset_${runtime.nextAssetId++}`,
                    name: sanitizeHiddenLayoutAssetName(file.name.replace(/\.[^.]+$/, '')),
                    fileName: file.name,
                    fileSize: file.size,
                    lastModified: file.lastModified,
                    src,
                    width: img.naturalWidth || img.width || 64,
                    height: img.naturalHeight || img.height || 64
                };
                runtime.assets.push(asset);
                global.__hiddenRoomCustomDecorImages = global.__hiddenRoomCustomDecorImages || {};
                global.__hiddenRoomCustomDecorImages[src] = img;
                resolve(asset);
            };
            img.onerror = () => resolve(null);
            img.decoding = 'async';
            img.src = src;
        })));
        return loaded.filter(Boolean);
    }

function createHiddenDecorInstanceFromAsset(asset, floor, room, anchor = null) {
        if (!asset) return null;
        const runtime = getHiddenLayoutRuntimeState();
        const decorList = getHiddenLayoutFloorCustomDecor(floor);
        const sameAssetCount = decorList.filter((item) => item.assetId === asset.id).length + 1;
        const baseX = Number.isFinite(anchor?.x) ? anchor.x : (room ? roomCenterX(room) : 360);
        const baseY = Number.isFinite(anchor?.y) ? anchor.y : (room ? roomCenterY(room) : 260);
        const sourceW = Math.max(1, asset.width || 64);
        const sourceH = Math.max(1, asset.height || 64);
        const defaultMaxSide = 64;
        const defaultScale = defaultMaxSide / Math.max(sourceW, sourceH);
        const drawW = Math.max(12, Math.round(sourceW * defaultScale));
        const drawH = Math.max(12, Math.round(sourceH * defaultScale));
        const decor = {
            kind: 'custom_decor',
            assetId: asset.id,
            imageSrc: asset.src,
            key: null,
            x: baseX + ((sameAssetCount - 1) % 4) * 24 - 36,
            y: baseY + Math.floor((sameAssetCount - 1) / 4) * 24 - 18,
            drawW,
            drawH,
            baseDrawW: drawW,
            baseDrawH: drawH,
            scale: 1,
            scaleX: 1,
            scaleY: 1,
            rotation: 0,
            alpha: 1,
            editorLayer: 3,
            layoutId: `custom_decor_${runtime.nextDecorId++}`,
            layoutLabel: `${asset.name} #${sameAssetCount}`,
            customAssetName: asset.name
        };
        decorList.push(clone(decor));
        return decor;
    }

function removeHiddenDecorInstance(floor, layoutId) {
        const decorList = getHiddenLayoutFloorCustomDecor(floor);
        const next = decorList.filter((item) => item.layoutId !== layoutId);
        getHiddenLayoutRuntimeState().decorByFloor[String(floor || 0)] = next;
    }

function clearHiddenDecorInstancesForFloor(floor) {
        getHiddenLayoutRuntimeState().decorByFloor[String(floor || 0)] = [];
    }

function getFloorLayoutOverrides(floor) {
        const store = getHiddenLayoutStore();
        const key = String(floor || 0);
        if (!store.floors[key] || typeof store.floors[key] !== 'object') store.floors[key] = {};
        return store.floors[key];
    }

function ensureLayoutTargetDefaults(target) {
        if (!target) return target;
        if (!Number.isFinite(target.scale)) target.scale = 1;
        if (!Number.isFinite(target.scaleX)) target.scaleX = 1;
        if (!Number.isFinite(target.scaleY)) target.scaleY = 1;
        if (!Number.isFinite(target.rotation)) target.rotation = 0;
        if (!Number.isFinite(target.editorLayer)) target.editorLayer = 0;
        if (Number.isFinite(target.radius) && !Number.isFinite(target.baseRadius)) target.baseRadius = target.radius;
        if (Number.isFinite(target.w) && !Number.isFinite(target.baseW)) target.baseW = target.w;
        if (Number.isFinite(target.h) && !Number.isFinite(target.baseH)) target.baseH = target.h;
        if (Number.isFinite(target.drawW) && !Number.isFinite(target.baseDrawW)) target.baseDrawW = target.drawW;
        if (Number.isFinite(target.drawH) && !Number.isFinite(target.baseDrawH)) target.baseDrawH = target.drawH;
        return target;
    }

function registerLayoutTarget(target, id, label) {
        if (!target) return target;
        ensureLayoutTargetDefaults(target);
        target.layoutId = id;
        target.layoutLabel = label;
        return target;
    }

function labelForNodeKind(node) {
        if (!node) return '对象';
        if (node.kind === 'candle') return `蜡烛${(node.index || 0) + 1}`;
        if (node.kind === 'mushroom') return `顺序蘑菇${(node.index || 0) + 1}`;
        if (node.kind === 'memory_mushroom') return `记忆蘑菇${(node.index || 0) + 1}`;
        if (node.kind === 'seal_target') return `封印点${(node.index || 0) + 1}`;
        if (node.kind === 'seal_blocker') return `雕像${(node.index || 0) + 1}`;
        if (node.kind === 'legacy_book') return '日记';
        if (node.kind === 'legacy_bread') return '面包';
        if (node.kind === 'legacy_bag') return '钱袋';
        if (node.kind === 'legacy_lantern') return '提灯';
        return node.kind || '对象';
    }

function collectHiddenLayoutTargets(room, floor) {
        const targets = [];
        const push = (obj, id, label, kind) => {
            if (!obj) return;
            registerLayoutTarget(obj, id, label);
            targets.push({ id, label, kind: kind || obj.kind || id, obj });
        };

        if (room.hiddenOrbPedestal) push(room.hiddenOrbPedestal, 'orb_pedestal', '石墩', 'orb_pedestal');
        if (room.hiddenOrb) push(room.hiddenOrb, 'orb', '水晶球', 'orb');
        if (room.hiddenLegacyTable) push(room.hiddenLegacyTable, 'legacy_table', '桌子', 'legacy_table');
        if (room.hiddenLegacyCandle) push(room.hiddenLegacyCandle, 'legacy_candle', '桌上蜡烛', 'legacy_candle');
        if (room.hiddenLegacyLantern) push(room.hiddenLegacyLantern, 'legacy_lantern_decor', '提灯光', 'legacy_lantern_decor');
        if (Array.isArray(room.hiddenTemplateCells)) {
            room.hiddenTemplateCells.forEach((cell, index) => {
                push(cell, `template_${index}`, `模板蘑菇${index + 1}`, 'template_cell');
            });
        }
        if (Array.isArray(room.hiddenFloor1Panels)) {
            room.hiddenFloor1Panels.forEach((panel, index) => {
                push(panel, panel.layoutId || `floor1_panel_${index}`, panel.layoutLabel || `背景框${index + 1}`, 'floor1_panel');
            });
        }
        if (Array.isArray(room.hiddenWormCritters)) {
            room.hiddenWormCritters.forEach((critter, index) => {
                push(critter, critter.id || `worm_${index}`, critter.red ? `红虫${index + 1}` : `荧光虫${index + 1}`, 'hidden_worm');
            });
        }
        if (room.hiddenDemoRabbit) push(room.hiddenDemoRabbit, 'demo_rabbit', '黑兔演示', 'hidden_demo_rabbit');
        if (Array.isArray(room.hiddenPuzzleNodes)) {
            room.hiddenPuzzleNodes.forEach((node, index) => {
                const id = node.kind === 'memory_mushroom'
                    ? `memory_${index}`
                    : (typeof node.index === 'number' ? `${node.kind}_${node.index}` : `${node.kind}_${index}`);
                push(node, id, labelForNodeKind(node), node.kind);
            });
        }
        if (Array.isArray(room.hiddenDecor)) {
            room.hiddenDecor.forEach((decor, index) => {
                push(decor, decor.layoutId || `decor_${index}`, decor.layoutLabel || `装饰${index + 1}`, decor.kind || 'decor');
            });
        }
        room.hiddenLayoutTargets = targets;
        return targets;
    }

function applyLayoutOverrideToTarget(target, override) {
        if (!target || !override || typeof override !== 'object') return;
        ensureLayoutTargetDefaults(target);
        if (Number.isFinite(override.x)) target.x = override.x;
        if (Number.isFinite(override.y)) target.y = override.y;
        if (target.kind === 'hidden_worm') {
            if (Number.isFinite(override.x)) target.homeX = override.x;
            if (Number.isFinite(override.y)) target.homeY = override.y;
            if (Number.isFinite(override.x)) target.reappearX = override.x;
            if (Number.isFinite(override.y)) target.reappearY = override.y;
        }
        if (Number.isFinite(override.scale)) target.scale = clamp(override.scale, 0.2, 4);
        if (Number.isFinite(override.scaleX)) target.scaleX = clamp(override.scaleX, 0.1, 6);
        if (Number.isFinite(override.scaleY)) target.scaleY = clamp(override.scaleY, 0.1, 6);
        if (Number.isFinite(override.w)) target.w = Math.max(4, override.w);
        if (Number.isFinite(override.h)) target.h = Math.max(4, override.h);
        if (Number.isFinite(override.drawW)) target.drawW = Math.max(4, override.drawW);
        if (Number.isFinite(override.drawH)) target.drawH = Math.max(4, override.drawH);
        if (Number.isFinite(override.radius)) target.radius = Math.max(2, override.radius);
        if (Number.isFinite(override.rotation)) target.rotation = override.rotation;
        if (Number.isFinite(override.editorLayer)) target.editorLayer = Math.round(override.editorLayer);
    }

function applyHiddenLayoutOverrides(room, floor) {
        const store = getHiddenLayoutStore();
        const shared = store.sharedTargets || {};
        const overrides = getFloorLayoutOverrides(floor);
        const targets = collectHiddenLayoutTargets(room, floor);
        targets.forEach(({ id, obj }) => {
            if (SHARED_HIDDEN_LAYOUT_IDS.has(id) && shared[id]) applyLayoutOverrideToTarget(obj, shared[id]);
            applyLayoutOverrideToTarget(obj, overrides[id]);
        });
        return targets;
    }

function hydrateHiddenLayoutCustomDecorFromStore(floor) {
        const floorStore = getFloorLayoutOverrides(floor);
        const runtime = getHiddenLayoutRuntimeState();
        const decorList = [];
        Object.entries(floorStore).forEach(([id, snapshot]) => {
            if (!/^custom_decor_/.test(id) || !snapshot || typeof snapshot !== 'object') return;
            const imageSrc = resolvePersistentHiddenDecorSource(snapshot);
            if (!imageSrc) return;
            decorList.push({
                kind: 'custom_decor',
                layoutId: id,
                layoutLabel: snapshot.layoutLabel || id,
                assetId: snapshot.assetId || null,
                customAssetName: snapshot.customAssetName || snapshot.layoutLabel || id,
                imageSrc,
                key: null,
                x: Number.isFinite(snapshot.x) ? snapshot.x : 0,
                y: Number.isFinite(snapshot.y) ? snapshot.y : 0,
                scale: Number.isFinite(snapshot.scale) ? snapshot.scale : 1,
                scaleX: Number.isFinite(snapshot.scaleX) ? snapshot.scaleX : 1,
                scaleY: Number.isFinite(snapshot.scaleY) ? snapshot.scaleY : 1,
                drawW: Number.isFinite(snapshot.drawW) ? snapshot.drawW : (Number.isFinite(snapshot.w) ? snapshot.w : 64),
                drawH: Number.isFinite(snapshot.drawH) ? snapshot.drawH : (Number.isFinite(snapshot.h) ? snapshot.h : 64),
                baseDrawW: Number.isFinite(snapshot.baseDrawW) ? snapshot.baseDrawW : (Number.isFinite(snapshot.drawW) ? snapshot.drawW : 64),
                baseDrawH: Number.isFinite(snapshot.baseDrawH) ? snapshot.baseDrawH : (Number.isFinite(snapshot.drawH) ? snapshot.drawH : 64),
                rotation: Number.isFinite(snapshot.rotation) ? snapshot.rotation : 0,
                alpha: Number.isFinite(snapshot.alpha) ? snapshot.alpha : 1,
                editorLayer: Number.isFinite(snapshot.editorLayer) ? snapshot.editorLayer : 3
            });
        });
        runtime.decorByFloor[String(floor || 0)] = decorList;
        return decorList;
    }

function captureHiddenLayoutOverrides(room, floor) {
        const store = getHiddenLayoutStore();
        const floorStore = getFloorLayoutOverrides(floor);
        const targets = collectHiddenLayoutTargets(room, floor);
        Object.keys(floorStore).forEach((key) => delete floorStore[key]);
        targets.forEach(({ id, obj }) => {
            const snapshot = {
                x: Number(Number.isFinite(obj.homeX) ? obj.homeX : (obj.x || 0)),
                y: Number(Number.isFinite(obj.homeY) ? obj.homeY : (obj.y || 0)),
                scale: Number.isFinite(obj.scale) ? obj.scale : 1,
                scaleX: Number.isFinite(obj.scaleX) ? obj.scaleX : 1,
                scaleY: Number.isFinite(obj.scaleY) ? obj.scaleY : 1,
                w: Number.isFinite(obj.w) ? obj.w : undefined,
                h: Number.isFinite(obj.h) ? obj.h : undefined,
                drawW: Number.isFinite(obj.drawW) ? obj.drawW : undefined,
                drawH: Number.isFinite(obj.drawH) ? obj.drawH : undefined,
                baseDrawW: Number.isFinite(obj.baseDrawW) ? obj.baseDrawW : undefined,
                baseDrawH: Number.isFinite(obj.baseDrawH) ? obj.baseDrawH : undefined,
                radius: Number.isFinite(obj.radius) ? obj.radius : undefined,
                rotation: Number.isFinite(obj.rotation) ? obj.rotation : 0,
                editorLayer: Number.isFinite(obj.editorLayer) ? obj.editorLayer : 0,
                alpha: Number.isFinite(obj.alpha) ? obj.alpha : 1
            };
            if ((obj.kind || id).indexOf('custom_decor') === 0 || obj.kind === 'custom_decor') {
                snapshot.kind = 'custom_decor';
                snapshot.assetId = obj.assetId || null;
                snapshot.layoutLabel = obj.layoutLabel || id;
                snapshot.customAssetName = obj.customAssetName || obj.layoutLabel || id;
                snapshot.imageSrc = resolvePersistentHiddenDecorSource({
                    imageSrc: obj.imageSrc || null,
                    customAssetName: snapshot.customAssetName,
                    layoutLabel: snapshot.layoutLabel
                });
            }
            floorStore[id] = snapshot;
            if (SHARED_HIDDEN_LAYOUT_IDS.has(id)) {
                if (!store.sharedTargets || typeof store.sharedTargets !== 'object') store.sharedTargets = {};
                store.sharedTargets[id] = clone(snapshot);
            }
        });
        saveHiddenLayoutStore();
        return floorStore;
    }

function clearHiddenLayoutOverridesForFloor(floor) {
        const store = getHiddenLayoutStore();
        delete store.floors[String(floor || 0)];
        saveHiddenLayoutStore();
    }

function getSortedEditorList(items) {
        const list = Array.isArray(items) ? items.slice() : [];
        return list.sort((a, b) => {
            const la = Number.isFinite(a?.editorLayer) ? a.editorLayer : 0;
            const lb = Number.isFinite(b?.editorLayer) ? b.editorLayer : 0;
            return la - lb;
        });
    }

function getLayoutTargetMetrics(target) {
        const obj = target?.obj || target;
        if (!obj) return { w: 48, h: 48 };
        const scale = Number.isFinite(obj.scale) ? obj.scale : 1;
        const scaleX = Number.isFinite(obj.scaleX) ? obj.scaleX : 1;
        const scaleY = Number.isFinite(obj.scaleY) ? obj.scaleY : 1;
        const kind = target?.kind || obj.kind || '';
        if (kind === 'orb') {
            const size = Math.max(44, Math.round((obj.radius || obj.baseRadius || 34) * 1.38)) * scale;
            return { w: size * scaleX, h: size * scaleY };
        }
        if (kind === 'orb_pedestal') {
            return { w: (obj.w || obj.baseW || 116) * scale * scaleX, h: (obj.h || obj.baseH || 58) * scale * scaleY };
        }
        if (kind === 'legacy_table') {
            return { w: ((obj.w || obj.baseW || 214) + 86) * scale * scaleX, h: ((obj.h || obj.baseH || 72) + 94) * scale * scaleY };
        }
        if (kind === 'legacy_candle') return { w: 50 * scale * scaleX, h: 50 * scale * scaleY };
        if (kind === 'candle') return { w: 58 * scale * scaleX, h: 58 * scale * scaleY };
        if (kind === 'template_cell') return { w: 68 * scale * scaleX, h: 68 * scale * scaleY };
        if (kind === 'floor1_panel') return { w: (obj.w || obj.baseW || 300) * scale * scaleX, h: (obj.h || obj.baseH || 432) * scale * scaleY };
        if (kind === 'mushroom') return { w: 92 * scale * scaleX, h: 92 * scale * scaleY };
        if (kind === 'memory_mushroom') return { w: 108 * scale * scaleX, h: 108 * scale * scaleY };
        if (kind === 'seal_target') return { w: 52 * scale * scaleX, h: 52 * scale * scaleY };
        if (kind === 'seal_blocker') return { w: (obj.drawW || obj.baseDrawW || 90) * scale * scaleX, h: (obj.drawH || obj.baseDrawH || 90) * scale * scaleY };
        if (kind === 'legacy_book') return { w: 60 * scale * scaleX, h: 60 * scale * scaleY };
        if (kind === 'legacy_bread') return { w: 48 * scale * scaleX, h: 28 * scale * scaleY };
        if (kind === 'legacy_bag') return { w: 70 * scale * scaleX, h: 70 * scale * scaleY };
        if (kind === 'legacy_lantern') return { w: 60 * scale * scaleX, h: 60 * scale * scaleY };
        if (kind === 'hidden_worm') return { w: 44 * scale * scaleX, h: 26 * scale * scaleY };
        if (kind === 'hidden_demo_rabbit') return { w: 54 * scale * scaleX, h: 54 * scale * scaleY };
        return { w: (obj.drawW || obj.w || obj.baseDrawW || obj.baseW || 64) * scale * scaleX, h: (obj.drawH || obj.h || obj.baseDrawH || obj.baseH || 64) * scale * scaleY };
    }

function getLayoutTargetScreenBounds(camera, target) {
        const obj = target?.obj || target;
        const pos = camera.worldToScreen(obj.x, obj.y);
        const size = getLayoutTargetMetrics(target);
        return {
            x: pos.x - size.w * 0.5,
            y: pos.y - size.h * 0.5,
            w: size.w,
            h: size.h,
            centerX: pos.x,
            centerY: pos.y
        };
    }

function getLayoutTargetHitPadding(target) {
        const size = getLayoutTargetMetrics(target);
        const minSize = Math.max(1, Math.min(size.w, size.h));
        const basePadding = clamp(minSize * 0.18, 12, 28);
        return target?.kind === 'custom_decor' ? Math.max(basePadding, 20) : basePadding;
    }

function getScreenDistanceToExpandedBounds(bounds, screenX, screenY, padding) {
        const left = bounds.x - padding;
        const top = bounds.y - padding;
        const right = bounds.x + bounds.w + padding;
        const bottom = bounds.y + bounds.h + padding;
        const dx = screenX < left ? left - screenX : (screenX > right ? screenX - right : 0);
        const dy = screenY < top ? top - screenY : (screenY > bottom ? screenY - bottom : 0);
        return Math.hypot(dx, dy);
    }

function isScreenPointNearTarget(camera, target, screenX, screenY, extraPadding = 0) {
        if (!camera || !target) return false;
        const bounds = getLayoutTargetScreenBounds(camera, target);
        const padding = getLayoutTargetHitPadding(target) + Math.max(0, extraPadding);
        return getScreenDistanceToExpandedBounds(bounds, screenX, screenY, padding) <= 0.001;
    }

function getHiddenLayoutEditorCanvas(game) {
        return game?.canvas || document.getElementById('gameCanvas') || document.querySelector('canvas');
    }

function getActiveHiddenLayoutRoom(game) {
        const room = game?.curRoom;
        if (!room || room.type !== 'hidden') return null;
        return room;
    }

function getHiddenLayoutEditorState() {
        if (!global.__hiddenRoomLayoutEditorState) {
            global.__hiddenRoomLayoutEditorState = {
                active: false,
                selectedId: null,
                hoverId: null,
                dragging: null,
                installed: false
            };
        }
        return global.__hiddenRoomLayoutEditorState;
    }

function syncHiddenLayoutTargetPosition(obj, x, y) {
        if (!obj) return;
        if (Number.isFinite(x)) {
            obj.x = x;
            if (Number.isFinite(obj.homeX)) obj.homeX = x;
            if (Number.isFinite(obj.reappearX)) obj.reappearX = x;
            if (Number.isFinite(obj.baseX)) obj.baseX = x;
        }
        if (Number.isFinite(y)) {
            obj.y = y;
            if (Number.isFinite(obj.homeY)) obj.homeY = y;
            if (Number.isFinite(obj.reappearY)) obj.reappearY = y;
            if (Number.isFinite(obj.baseY)) obj.baseY = y;
        }
    }

function nudgeHiddenLayoutTarget(target, dx, dy) {
        if (!target?.obj) return null;
        const obj = target.obj;
        syncHiddenLayoutTargetPosition(obj, (obj.x || 0) + (dx || 0), (obj.y || 0) + (dy || 0));
        return obj;
    }

function resizeHiddenLayoutTargetObject(obj, dw, dh) {
        if (!obj) return false;
        let changed = false;
        if (Number.isFinite(dw) && dw !== 0) {
            if (Number.isFinite(obj.w) || Number.isFinite(obj.baseW)) {
                obj.w = clamp((obj.w || obj.baseW || 64) + dw, 4, 2400);
                changed = true;
            } else if (Number.isFinite(obj.drawW) || Number.isFinite(obj.baseDrawW)) {
                obj.drawW = clamp((obj.drawW || obj.baseDrawW || 64) + dw, 4, 2400);
                changed = true;
            } else if (Number.isFinite(obj.radius) || Number.isFinite(obj.baseRadius)) {
                obj.radius = clamp((obj.radius || obj.baseRadius || 24) + dw * 0.5, 2, 800);
                changed = true;
            } else {
                obj.scaleX = clamp((obj.scaleX || 1) + dw * 0.01, 0.1, 6);
                changed = true;
            }
        }
        if (Number.isFinite(dh) && dh !== 0) {
            if (Number.isFinite(obj.h) || Number.isFinite(obj.baseH)) {
                obj.h = clamp((obj.h || obj.baseH || 64) + dh, 4, 2400);
                changed = true;
            } else if (Number.isFinite(obj.drawH) || Number.isFinite(obj.baseDrawH)) {
                obj.drawH = clamp((obj.drawH || obj.baseDrawH || 64) + dh, 4, 2400);
                changed = true;
            } else if (!(Number.isFinite(obj.radius) || Number.isFinite(obj.baseRadius))) {
                obj.scaleY = clamp((obj.scaleY || 1) + dh * 0.01, 0.1, 6);
                changed = true;
            }
        }
        return changed;
    }

function getHiddenLayoutEditorSelectionInfo(game) {
        const room = getActiveHiddenLayoutRoom(game);
        const selected = room ? getSelectedHiddenLayoutTarget(room) : null;
        const obj = selected?.obj || null;
        if (!selected || !obj) return null;
        return {
            id: selected.id,
            label: selected.label,
            kind: selected.kind,
            x: Number(obj.x || 0),
            y: Number(obj.y || 0),
            scale: Number.isFinite(obj.scale) ? obj.scale : 1,
            scaleX: Number.isFinite(obj.scaleX) ? obj.scaleX : 1,
            scaleY: Number.isFinite(obj.scaleY) ? obj.scaleY : 1,
            w: Number.isFinite(obj.w) ? obj.w : (Number.isFinite(obj.drawW) ? obj.drawW : (Number.isFinite(obj.radius) ? obj.radius * 2 : null)),
            h: Number.isFinite(obj.h) ? obj.h : (Number.isFinite(obj.drawH) ? obj.drawH : (Number.isFinite(obj.radius) ? obj.radius * 2 : null)),
            rotation: Number.isFinite(obj.rotation) ? obj.rotation : 0,
            layer: Number.isFinite(obj.editorLayer) ? obj.editorLayer : 0
        };
    }

function getSelectedHiddenLayoutTarget(room) {
        const editor = getHiddenLayoutEditorState();
        const targets = collectHiddenLayoutTargets(room, room.hiddenRoomFloor || 0);
        if (!targets.length) return null;
        let selected = targets.find((target) => target.id === editor.selectedId) || null;
        if (!selected) {
            selected = targets[0];
            editor.selectedId = selected.id;
        }
        return selected;
    }

function moveHiddenLayoutSelection(room, dir) {
        const editor = getHiddenLayoutEditorState();
        const targets = collectHiddenLayoutTargets(room, room.hiddenRoomFloor || 0);
        if (!targets.length) return null;
        let index = targets.findIndex((target) => target.id === editor.selectedId);
        if (index < 0) index = 0;
        index = (index + dir + targets.length) % targets.length;
        editor.selectedId = targets[index].id;
        return targets[index];
    }

function getTargetAtScreenPoint(game, room, screenX, screenY) {
        const wrapped = collectHiddenLayoutTargets(room, room.hiddenRoomFloor || 0).slice().sort((a, b) => {
            const la = Number.isFinite(a.obj?.editorLayer) ? a.obj.editorLayer : 0;
            const lb = Number.isFinite(b.obj?.editorLayer) ? b.obj.editorLayer : 0;
            return lb - la;
        });
        let nearest = null;
        for (const target of wrapped) {
            const bounds = getLayoutTargetScreenBounds(game.camera, target);
            const padding = getLayoutTargetHitPadding(target);
            const distance = getScreenDistanceToExpandedBounds(bounds, screenX, screenY, padding);
            if (distance <= 0.001) {
                return target;
            }
            const snapRadius = clamp(Math.min(bounds.w, bounds.h) * 0.45 + padding, 18, 72);
            const centerDistance = Math.hypot(screenX - bounds.centerX, screenY - bounds.centerY);
            if (centerDistance <= snapRadius) {
                const layer = Number.isFinite(target.obj?.editorLayer) ? target.obj.editorLayer : 0;
                const score = centerDistance - layer * 0.35;
                if (!nearest || score < nearest.score) {
                    nearest = { target, score };
                }
            }
        }
        return nearest?.target || null;
    }

function installHiddenLayoutEditorInput() {
        const editor = getHiddenLayoutEditorState();
        if (editor.installed) return;
        const isEditableUiTarget = (target) => {
            const tag = String(target?.tagName || '').toLowerCase();
            if (tag === 'input' || tag === 'textarea' || tag === 'select' || tag === 'button') return true;
            if (typeof target?.closest === 'function' && target.closest('#debugPanel')) return true;
            return !!target?.isContentEditable;
        };
        const getPoint = (event, game) => {
            const canvas = getHiddenLayoutEditorCanvas(game);
            const camera = game?.camera;
            if (!canvas || !camera) return null;
            const rect = canvas.getBoundingClientRect();
            const localX = event.clientX - rect.left;
            const localY = event.clientY - rect.top;
            if (localX < 0 || localY < 0 || localX > rect.width || localY > rect.height) return null;
            const cameraWidth = Number.isFinite(camera.width) ? camera.width : canvas.width || rect.width;
            const cameraHeight = Number.isFinite(camera.height) ? camera.height : canvas.height || rect.height;
            const scaleX = cameraWidth / Math.max(1, rect.width);
            const scaleY = cameraHeight / Math.max(1, rect.height);
            const screenX = localX * scaleX;
            const screenY = localY * scaleY;
            let world = null;
            if (typeof camera.screenToWorldWithScale === 'function') {
                world = camera.screenToWorldWithScale(localX, localY, rect);
            } else if (typeof camera.screenToWorld === 'function') {
                world = camera.screenToWorld(screenX, screenY);
            } else {
                const zoom = Number.isFinite(camera.zoom) && Math.abs(camera.zoom) > 1e-4 ? camera.zoom : 1;
                const cameraX = Number.isFinite(camera.x) ? camera.x : 0;
                const cameraY = Number.isFinite(camera.y) ? camera.y : 0;
                world = {
                    x: (screenX - cameraWidth * 0.5) / zoom + cameraX,
                    y: (screenY - cameraHeight * 0.5) / zoom + cameraY
                };
            }
            return { localX, localY, screenX, screenY, world, rect, canvas };
        };
        const withActiveRoom = (callback) => {
            const state = getHiddenLayoutEditorState();
            if (!state.active) return null;
            const game = global.game;
            const room = getActiveHiddenLayoutRoom(game);
            if (!room) return null;
            return callback(game, room, state);
        };
        const handlePointerDown = (event) => withActiveRoom((game, room, state) => {
            if (event.button !== 0 || isEditableUiTarget(event.target)) return null;
            const point = getPoint(event, game);
            if (!point) return null;
            let target = getTargetAtScreenPoint(game, room, point.screenX, point.screenY);
            if (!target) {
                const selected = getSelectedHiddenLayoutTarget(room);
                if (selected && isScreenPointNearTarget(game.camera, selected, point.screenX, point.screenY, 24)) {
                    target = selected;
                }
            }
            if (!target) {
                state.selectedId = null;
                state.hoverId = null;
                state.dragging = null;
                game?.debugPanel?.refreshHiddenRoomEditorTools?.();
                return null;
            }
            state.selectedId = target.id;
            state.hoverId = target.id;
            state.dragging = {
                id: target.id,
                pointerId: event.pointerId,
                offsetX: target.obj.x - point.world.x,
                offsetY: target.obj.y - point.world.y
            };
            point.canvas?.setPointerCapture?.(event.pointerId);
            game?.debugPanel?.refreshHiddenRoomEditorTools?.();
            event.preventDefault();
            event.stopPropagation();
            return null;
        });
        const handlePointerMove = (event) => withActiveRoom((game, room, state) => {
            const point = getPoint(event, game);
            if (!point) return null;
            if (state.dragging) {
                const target = collectHiddenLayoutTargets(room, room.hiddenRoomFloor || 0).find((item) => item.id === state.dragging.id);
                if (target) {
                    syncHiddenLayoutTargetPosition(target.obj, point.world.x + state.dragging.offsetX, point.world.y + state.dragging.offsetY);
                    game?.debugPanel?.refreshHiddenRoomEditorTools?.();
                }
                event.preventDefault();
                event.stopPropagation();
                return null;
            }
            const hover = getTargetAtScreenPoint(game, room, point.screenX, point.screenY);
            state.hoverId = hover?.id || null;
            return null;
        });
        const release = (event) => {
            const state = getHiddenLayoutEditorState();
            if (state.dragging?.pointerId != null) {
                const canvas = getHiddenLayoutEditorCanvas(global.game);
                canvas?.releasePointerCapture?.(state.dragging.pointerId);
            }
            state.dragging = null;
            if (event) event.stopPropagation?.();
        };
        const handleWheel = (event) => withActiveRoom((game, room) => {
            if (isEditableUiTarget(event.target)) return null;
            const point = getPoint(event, game);
            if (!point) return null;
            const target = getTargetAtScreenPoint(game, room, point.screenX, point.screenY) || getSelectedHiddenLayoutTarget(room);
            if (!target) return null;
            getHiddenLayoutEditorState().selectedId = target.id;
            const amount = event.deltaY < 0 ? 0.06 : -0.06;
            target.obj.scale = clamp((target.obj.scale || 1) + amount, 0.1, 8);
            game?.debugPanel?.refreshHiddenRoomEditorTools?.();
            event.preventDefault();
            event.stopPropagation();
            return null;
        });

        document.addEventListener('pointerdown', handlePointerDown, true);
        document.addEventListener('pointermove', handlePointerMove, true);
        document.addEventListener('pointerup', release, true);
        document.addEventListener('pointercancel', release, true);
        document.addEventListener('wheel', handleWheel, { capture: true, passive: false });
        window.addEventListener('blur', release);

        document.addEventListener('keydown', (event) => {
            const state = getHiddenLayoutEditorState();
            if (!state.active || isEditableUiTarget(event.target)) return;
            const game = global.game;
            const room = getActiveHiddenLayoutRoom(game);
            if (!room) return;
            const key = String(event.key || '');
            const step = event.shiftKey ? 18 : 4;
            let handled = true;
            if (key === 'ArrowLeft') game?.moveHiddenLayoutTarget?.(-step, 0);
            else if (key === 'ArrowRight') game?.moveHiddenLayoutTarget?.(step, 0);
            else if (key === 'ArrowUp') game?.moveHiddenLayoutTarget?.(0, -step);
            else if (key === 'ArrowDown') game?.moveHiddenLayoutTarget?.(0, step);
            else if (key === '[') game?.cycleHiddenLayoutTarget?.(-1);
            else if (key === ']') game?.cycleHiddenLayoutTarget?.(1);
            else if (key === '-' || key === '_') game?.scaleHiddenLayoutTarget?.(-0.05);
            else if (key === '=' || key === '+') game?.scaleHiddenLayoutTarget?.(0.05);
            else if (key === ',') game?.rotateHiddenLayoutTarget?.(-5);
            else if (key === '.') game?.rotateHiddenLayoutTarget?.(5);
            else if (key === 'PageDown') game?.nudgeHiddenLayoutLayer?.(-1);
            else if (key === 'PageUp') game?.nudgeHiddenLayoutLayer?.(1);
            else if (key === ';') game?.resizeHiddenLayoutTarget?.(-6, 0);
            else if (key === "'") game?.resizeHiddenLayoutTarget?.(6, 0);
            else if (key === '[' && event.altKey) game?.resizeHiddenLayoutTarget?.(0, -6);
            else if (key === ']' && event.altKey) game?.resizeHiddenLayoutTarget?.(0, 6);
            else handled = false;
            if (!handled) return;
            event.preventDefault();
            event.stopPropagation();
        }, true);
        editor.installed = true;
    }

function drawHiddenLayoutEditorOverlay(ctx, camera, room, game) {
        const editor = getHiddenLayoutEditorState();
        if (!editor.active || !room || room.type !== 'hidden') return;
        const targets = collectHiddenLayoutTargets(room, room.hiddenRoomFloor || 0);
        if (!targets.length) return;
        ctx.save();
        ctx.lineWidth = 2;
        targets.forEach((target) => {
            const bounds = getLayoutTargetScreenBounds(camera, target);
            const isSelected = editor.selectedId === target.id;
            const isHover = editor.hoverId === target.id;
            ctx.strokeStyle = isSelected ? 'rgba(120,255,180,0.95)' : (isHover ? 'rgba(255,218,120,0.85)' : 'rgba(140,210,255,0.45)');
            ctx.fillStyle = isSelected ? 'rgba(120,255,180,0.10)' : 'rgba(120,180,255,0.04)';
            ctx.beginPath();
            ctx.rect(bounds.x, bounds.y, bounds.w, bounds.h);
            ctx.fill();
            ctx.stroke();
            if (isSelected) {
                ctx.beginPath();
                ctx.arc(bounds.centerX, bounds.centerY, 4, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(120,255,180,0.9)';
                ctx.fill();
            }
        });
        const selected = getSelectedHiddenLayoutTarget(room);
        if (selected) {
            const scale = Number.isFinite(selected.obj.scale) ? selected.obj.scale : 1;
            const rotationDeg = Math.round(((selected.obj.rotation || 0) * 180 / Math.PI));
            const label = `${selected.label}  缩放 ${scale.toFixed(2)}  旋转 ${rotationDeg}°  图层 ${(selected.obj.editorLayer || 0)}`;
            ctx.fillStyle = 'rgba(0,0,0,0.72)';
            ctx.fillRect(18, 18, Math.min(ctx.canvas.width - 36, 420), 34);
            ctx.strokeStyle = 'rgba(120,255,180,0.55)';
            ctx.strokeRect(18, 18, Math.min(ctx.canvas.width - 36, 420), 34);
            ctx.fillStyle = '#dfffea';
            ctx.font = '14px Arial';
            ctx.textBaseline = 'middle';
            ctx.fillText(`布局编辑中：${label}`, 30, 35);
        }
        ctx.restore();
    }

function hashString(value) {
        const str = String(value || '');
        let hash = 2166136261;
        for (let i = 0; i < str.length; i++) {
            hash ^= str.charCodeAt(i);
            hash = Math.imul(hash, 16777619);
        }
        return (hash >>> 0);
    }

function recompute(state) {
        let completed = 0;
        let witnessed = 0;
        let allSolved = true;
        for (let floor = 1; floor <= 6; floor++) {
            const item = state.floors[floor];
            if (item.completed) completed += 1;
            else allSolved = false;
            if (item.witnessed) witnessed += 1;
        }
        state.totalCompletedCount = completed;
        state.totalWitnessedCount = witnessed;
        state.allSolved = allSolved;
        state.trueEndingUnlocked = witnessed >= 6;
        return state;
    }

function ensureFloorState(state, floor) {
        if (!state.floors[floor]) state.floors[floor] = createFloorState();
        const item = state.floors[floor];
        item.witnessed = !!item.witnessed;
        item.phase = typeof item.phase === 'string' ? item.phase : (item.completed ? 'awakened' : 'idle');
        item.crystalState = typeof item.crystalState === 'string' ? item.crystalState : (item.witnessed ? 'played' : (item.completed ? 'ready' : 'dormant'));
        item.solveAnimTimer = Number.isFinite(item.solveAnimTimer) ? item.solveAnimTimer : 0;
        item.puzzleState = normalizePuzzleState(floor, item.puzzleState);
        return item;
    }

function saveState(game) {
        if (!game || !game.hiddenRooms) return;
        recompute(game.hiddenRooms);
        const room = game?.curRoom;
        if (room?.type === 'hidden') {
            const floor = getFloor(game, room);
            room.hiddenPuzzleState = game.hiddenRooms?.floors?.[floor]?.puzzleState || room.hiddenPuzzleState;
        }
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(game.hiddenRooms));
        } catch (err) {
            console.warn('[HiddenRoomSystem] failed to save local progress', err);
        }
    }

function getProfile(floor) {
        return HIDDEN_ROOM_PROFILES[floor] || HIDDEN_ROOM_PROFILES[1];
    }

function getFloor(game, room) {
        return Math.max(1, Number(room?.floor || game?.currentFloor || 1));
    }

function getFloorProgress(game, floor) {
        const state = ensureState(game);
        const progress = ensureFloorState(state, floor);
        const room = game?.curRoom;
        if (room?.type === 'hidden' && getFloor(game, room) === floor) {
            room.hiddenPuzzleState = progress.puzzleState;
        }
        return progress;
    }

function seedFloor3PuzzleFromRun(game, progress) {
        if (!progress || progress.completed) return;
        const runSeed = String(game?.runSeed || game?.currentMapSeed || 'seed');
        if (progress.puzzleState && progress.puzzleState._seedKey === runSeed) return;
        progress.puzzleState = normalizePuzzleState(3, Object.assign({}, progress.puzzleState || {}, {
            sequence: seededPermutation(6, runSeed + '-hidden-floor3-seq'),
            stage: 'preview',
            previewRound: 0,
            previewStep: 0,
            previewLit: false,
            previewTimer: 0.52,
            activePreviewIndex: -1,
            inputIndex: 0,
            lastTriggeredNode: -1,
            replayTimer: 0.0,
            cooldown: 0,
            hoveredIndex: -1,
            _seedKey: runSeed
        }));
    }

    function createDefaultState() {
        return {
            version: HIDDEN_ROOM_VERSION,
            runSeed: '',
            floors: {
                1: createFloorState(),
                2: createFloorState(),
                3: createFloorState(),
                4: createFloorState(),
                5: createFloorState(),
                6: createFloorState()
            },
            totalCompletedCount: 0,
            totalWitnessedCount: 0,
            allSolved: false,
            trueEndingUnlocked: false
        };
    }

    function createPuzzleState(floor) {
        switch (floor) {
            case 1:
                return {
                    templateMask: OVR_FLOOR1_TEMPLATES[0].slice(),
                    candleStates: OVR_FLOOR1_TEMPLATES[0].slice(),
                    _seedKey: ''
                };
            case 2:
                return {
                    demoSeen: false,
                    killedIds: [],
                    targetCount: 3,
                    killedCount: 0,
                    _seedKey: ''
                };
            case 3:
                return {
                    sequence: [2, 5, 1, 4, 0, 3],
                    stage: 'preview',
                    previewRound: 0,
                    previewStep: 0,
                    previewLit: false,
                    previewTimer: 0.45,
                    activePreviewIndex: -1,
                    inputIndex: 0,
                    lastTriggeredNode: -1,
                    replayTimer: 0,
                    cooldown: 0,
                    hoveredIndex: -1
                };
            case 4:
                return {
                    sequence: [0, 1, 2],
                    round: 0,
                    phase: 'pre_countdown',
                    phaseTimer: 2.4,
                    activeVariant: 0,
                    litNodeIds: [],
                    roundHits: 0,
                    wrongAttempts: 0,
                    _seedKey: ''
                };
            case 5:
                return {
                    blocked: [false, false, false],
                    sealedCount: 0
                };
            case 6:
                return {
                    breadTaken: false,
                    moneyTaken: false,
                    bookRead: false
                };
            default:
                return {};
        }
    }

    function normalizePuzzleState(floor, puzzleState) {
        const base = createPuzzleState(floor);
        const next = Object.assign({}, base, puzzleState || {});
        if (floor === 1) {
            next.templateMask = Array.isArray(next.templateMask) ? next.templateMask.slice(0, 8).map(Boolean) : base.templateMask.slice();
            while (next.templateMask.length < 8) next.templateMask.push(false);
            next.candleStates = Array.isArray(next.candleStates) ? next.candleStates.slice(0, 8).map(Boolean) : base.candleStates.slice();
            while (next.candleStates.length < 8) next.candleStates.push(false);
            next._seedKey = typeof next._seedKey === 'string' ? next._seedKey : '';
        }
        if (floor === 2) {
            next.demoSeen = !!next.demoSeen;
            next.killedIds = Array.isArray(next.killedIds) ? next.killedIds.slice() : [];
            next.targetCount = 3;
            next.killedCount = Number.isFinite(next.killedCount) ? next.killedCount : next.killedIds.length;
            next._seedKey = typeof next._seedKey === 'string' ? next._seedKey : '';
        }
        if (floor === 3) {
            next.sequence = Array.isArray(next.sequence) && next.sequence.length === 6 ? next.sequence.slice() : base.sequence.slice();
            next.stage = typeof next.stage === 'string' ? next.stage : 'preview';
            next.previewRound = Number.isFinite(next.previewRound) ? next.previewRound : 0;
            next.previewStep = Number.isFinite(next.previewStep) ? next.previewStep : 0;
            next.previewLit = !!next.previewLit;
            next.previewTimer = Number.isFinite(next.previewTimer) ? next.previewTimer : 0.45;
            next.activePreviewIndex = Number.isFinite(next.activePreviewIndex) ? next.activePreviewIndex : -1;
            next.inputIndex = Number.isFinite(next.inputIndex) ? next.inputIndex : 0;
            next.lastTriggeredNode = Number.isFinite(next.lastTriggeredNode) ? next.lastTriggeredNode : -1;
            next.replayTimer = Number.isFinite(next.replayTimer) ? next.replayTimer : 0;
            next.cooldown = Number.isFinite(next.cooldown) ? next.cooldown : 0;
            next.hoveredIndex = Number.isFinite(next.hoveredIndex) ? next.hoveredIndex : -1;
        }
        if (floor === 4) {
            next.sequence = Array.isArray(next.sequence) && next.sequence.length === 3 ? next.sequence.slice(0, 3) : base.sequence.slice();
            next.round = Number.isFinite(next.round) ? next.round : 0;
            next.phase = typeof next.phase === 'string' ? next.phase : 'pre_countdown';
            next.phaseTimer = Number.isFinite(next.phaseTimer) ? next.phaseTimer : 2.4;
            next.activeVariant = Number.isFinite(next.activeVariant) ? next.activeVariant : next.sequence[0];
            next.litNodeIds = Array.isArray(next.litNodeIds) ? next.litNodeIds.slice() : [];
            next.roundHits = Number.isFinite(next.roundHits) ? next.roundHits : 0;
            next.wrongAttempts = Number.isFinite(next.wrongAttempts) ? next.wrongAttempts : 0;
            next._seedKey = typeof next._seedKey === 'string' ? next._seedKey : '';
        }
        if (floor === 5) {
            next.blocked = Array.isArray(next.blocked) ? next.blocked.slice(0, 3).map(Boolean) : base.blocked.slice();
            while (next.blocked.length < 3) next.blocked.push(false);
            next.sealedCount = Number.isFinite(next.sealedCount) ? next.sealedCount : next.blocked.filter(Boolean).length;
        }
        if (floor === 6) {
            next.breadTaken = !!next.breadTaken;
            next.moneyTaken = !!next.moneyTaken;
            next.bookRead = !!next.bookRead;
        }
        return next;
    }

    function seedFloor1PuzzleFromRun(game, progress) {
        if (!progress || progress.completed) return;
        const runSeed = String(game?.runSeed || game?.currentMapSeed || 'seed');
        if (progress.puzzleState && progress.puzzleState._seedKey === runSeed) return;
        const template = clone(OVR_FLOOR1_TEMPLATES[hashString(runSeed + '-hidden-floor1-template') % OVR_FLOOR1_TEMPLATES.length]);
        const rng = seededRng(runSeed + '-hidden-floor1-candles');
        const flipOrder = shuffleWithRng([0,1,2,3,4,5,6,7], rng);
        const candleStates = template.slice();
        const mismatchCount = 2 + (hashString(runSeed + '-hidden-floor1-mismatch') % 2);
        for (let i = 0; i < mismatchCount; i++) candleStates[flipOrder[i]] = !candleStates[flipOrder[i]];
        progress.puzzleState = normalizePuzzleState(1, {
            templateMask: template,
            candleStates,
            _seedKey: runSeed
        });
    }

    function seedFloor4PuzzleFromRun(game, progress) {
        if (!progress || progress.completed) return;
        const runSeed = String(game?.runSeed || game?.currentMapSeed || 'seed');
        if (progress.puzzleState && progress.puzzleState._seedKey === runSeed) return;
        const sequence = seededPermutation(3, runSeed + '-hidden-floor4-seq');
        progress.puzzleState = normalizePuzzleState(4, {
            sequence,
            round: 0,
            phase: 'pre_countdown',
            phaseTimer: 2.4,
            activeVariant: sequence[0],
            litNodeIds: [],
            roundHits: 0,
            wrongAttempts: 0,
            _seedKey: runSeed
        });
    }

    function ensureState(game) {
        const currentRunSeed = String(game?.runSeed || game?.currentMapSeed || 'seed');
        if (game.hiddenRooms && game.hiddenRooms.runSeed === currentRunSeed) {
            for (let floor = 1; floor <= 6; floor++) ensureFloorState(game.hiddenRooms, floor);
            return recompute(game.hiddenRooms);
        }

        let loaded = null;
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) loaded = JSON.parse(raw);
        } catch (err) {
            console.warn('[HiddenRoomSystem] failed to load local progress', err);
        }

        const shouldReuse = loaded && typeof loaded === 'object' && loaded.runSeed === currentRunSeed;
        const state = shouldReuse ? loaded : createDefaultState();
        if (!state.floors) state.floors = createDefaultState().floors;
        state.version = HIDDEN_ROOM_VERSION;
        state.runSeed = currentRunSeed;
        for (let floor = 1; floor <= 6; floor++) ensureFloorState(state, floor);
        game.hiddenRooms = recompute(state);
        return game.hiddenRooms;
    }

    function getFloor1TemplateCells(room) {
        return Array.isArray(room.hiddenTemplateCells) ? room.hiddenTemplateCells : [];
    }

    const HIDDEN_WALL_CLUSTER_DIMENSIONS = {
        cluster_mush_01: { w: 64, h: 34 },
        cluster_mush_02: { w: 64, h: 43 },
        cluster_mush_03: { w: 64, h: 33 },
        cluster_mush_04: { w: 64, h: 52 },
        cluster_mush_05: { w: 64, h: 28 },
        cluster_mush_06: { w: 64, h: 38 },
        set1_mush_02: { w: 44, h: 52 },
        set1_mush_08: { w: 42, h: 48 },
        set1_mush_11: { w: 44, h: 50 },
        set1_mush_13: { w: 42, h: 48 },
        set2_mush_01: { w: 40, h: 48 },
        set2_mush_02: { w: 42, h: 50 },
        set2_mush_05: { w: 40, h: 46 },
        set2_mush_12: { w: 42, h: 52 },
        set2_mush_15: { w: 44, h: 50 },
        set2_mush_16: { w: 42, h: 48 },
        set5_mush_01: { w: 44, h: 48 },
        set5_mush_09: { w: 40, h: 46 },
        set5_mush_10: { w: 42, h: 48 },
        set5_mush_11: { w: 42, h: 50 }
    };

    const HIDDEN_MUSHROOM_BAND_STYLES = [
        ['cluster_mush_01', 'set1_mush_08', 'cluster_mush_03', 'set2_mush_05', 'cluster_mush_05'],
        ['set5_mush_01', 'cluster_mush_02', 'set2_mush_12', 'cluster_mush_04', 'set1_mush_11'],
        ['cluster_mush_06', 'set5_mush_09', 'cluster_mush_03', 'set2_mush_16', 'set1_mush_13'],
        ['set2_mush_02', 'cluster_mush_01', 'set5_mush_10', 'cluster_mush_05', 'set1_mush_02'],
        ['cluster_mush_04', 'set2_mush_15', 'cluster_mush_02', 'set5_mush_11', 'cluster_mush_06'],
        ['set1_mush_11', 'cluster_mush_03', 'set5_mush_09', 'cluster_mush_01', 'set2_mush_12'],
        ['set2_mush_01', 'cluster_mush_05', 'set1_mush_13', 'cluster_mush_04', 'set5_mush_10'],
        ['cluster_mush_02', 'set5_mush_01', 'cluster_mush_06', 'set2_mush_05', 'set1_mush_08']
    ];
    const HIDDEN_MUSHROOM_BAND_CACHE = new Map();

    function createHiddenMushroomBand(room, floor, axis, x, y, lengthClass, styleIndex, scale = 1, options = {}) {
        return {
            kind: 'mushroom_band',
            floor,
            x,
            y,
            bandAxis: axis,
            bandLength: lengthClass,
            bandStyle: styleIndex % HIDDEN_MUSHROOM_BAND_STYLES.length,
            drawW: axis === 'x' ? Math.round((lengthClass === 'long' ? 268 : (lengthClass === 'mid' ? 214 : 176)) * scale) : Math.round(82 * scale),
            drawH: axis === 'x' ? Math.round(82 * scale) : Math.round((lengthClass === 'long' ? 268 : (lengthClass === 'mid' ? 214 : 176)) * scale),
            glowColor: options.glowColor || '#8fdcff',
            alpha: 0.98,
            scale: 1,
            rotation: options.rotation || 0,
            flipX: !!options.flipX,
            flipY: !!options.flipY,
            editorLayer: 3,
            layoutLabel: `mush_band_${floor}_${axis}_${styleIndex}_${lengthClass}`
        };
    }

    function getHiddenMushroomBandCanvas(item) {
        const axis = item.bandAxis === 'y' ? 'y' : 'x';
        const lengthClass = item.bandLength || 'mid';
        const styleIndex = Math.max(0, Number(item.bandStyle) || 0) % HIDDEN_MUSHROOM_BAND_STYLES.length;
        const cacheKey = `${axis}:${lengthClass}:${styleIndex}`;
        if (HIDDEN_MUSHROOM_BAND_CACHE.has(cacheKey)) return HIDDEN_MUSHROOM_BAND_CACHE.get(cacheKey);

        const style = HIDDEN_MUSHROOM_BAND_STYLES[styleIndex];
        const isHorizontal = axis === 'x';
        const cells = lengthClass === 'long' ? 6 : (lengthClass === 'short' ? 4 : 5);
        const cellMajor = isHorizontal ? 40 : 34;
        const cellMinor = isHorizontal ? 30 : 28;
        const pad = 14;
        const canvas = document.createElement('canvas');
        canvas.width = isHorizontal ? (pad * 2 + cellMajor * cells + 32) : (pad * 2 + cellMinor * 2 + 32);
        canvas.height = isHorizontal ? (pad * 2 + cellMinor * 2 + 28) : (pad * 2 + cellMajor * cells + 28);
        const ctx = canvas.getContext('2d');
        const rng = seededRng(`hidden_band_${cacheKey}`);
        for (let lane = 0; lane < 2; lane++) {
            for (let i = 0; i < cells; i++) {
                const key = style[(i + lane * 2) % style.length];
                const img = getProcessedSecretroomSprite(key) || getSecretroomSprite(key);
                if (!img || !img.complete || !(img.naturalWidth || img.width)) continue;
                const scale = 0.78 + rng() * 0.34;
                const drawW = Math.max(18, (img.naturalWidth || img.width || 32) * scale * 0.58);
                const drawH = Math.max(18, (img.naturalHeight || img.height || 32) * scale * 0.58);
                const jitterA = (rng() - 0.5) * 8;
                const jitterB = (rng() - 0.5) * 6;
                const x = isHorizontal
                    ? pad + i * cellMajor + lane * 10 + jitterA
                    : pad + lane * cellMinor + jitterA;
                const y = isHorizontal
                    ? pad + lane * cellMinor + jitterB
                    : pad + i * cellMajor + lane * 8 + jitterB;
                ctx.drawImage(img, x, y, drawW, drawH);
            }
        }
        HIDDEN_MUSHROOM_BAND_CACHE.set(cacheKey, canvas);
        return canvas;
    }

    function drawHiddenMushroomBand(ctx, camera, item, decorMode, tuning) {
        const canvas = getHiddenMushroomBandCanvas(item);
        if (!canvas) return false;
        const pos = camera.worldToScreen(item.x, item.y);
        if (!Number.isFinite(pos.x) || !Number.isFinite(pos.y)) return false;
        const glowColor = item.glowColor || '#8fdcff';
        const active = decorMode === 'active';
        const preview = decorMode === 'preview' || decorMode === 'hover' || decorMode === 'preview_static';
        const glowMul = 0.40 + tuning.mushroomBrightness * 1.10;
        const sizeMul = 0.78 + tuning.mushroomBrightness * 0.28;
        const brightnessBase = active ? 1.92 : (preview ? 1.58 : 1.04);
        const alphaBase = active ? 0.48 : (preview ? 0.24 : 0.03);
        const renderW = item.drawW || canvas.width;
        const renderH = item.drawH || canvas.height;
        const halfW = renderW * 0.5;
        const halfH = renderH * 0.5;

        ctx.save();
        ctx.translate(pos.x, pos.y + (item.offsetY || 0));
        if (item.rotation) ctx.rotate(item.rotation);
        ctx.scale(item.flipX ? -1 : 1, item.flipY ? -1 : 1);

        drawCachedHiddenRadial(ctx, 0, 0, Math.max(34, renderW * 0.42) * sizeMul, Math.max(24, renderH * 0.42) * sizeMul, glowColor, [
            [0, alphaBase * glowMul],
            [0.56, alphaBase * 0.38 * glowMul],
            [1, 0]
        ], { composite: 'screen' });

        ctx.globalAlpha = (active ? 0.48 : (preview ? 0.28 : 0.10)) * glowMul;
        ctx.filter = `brightness(${brightnessBase * glowMul})`;
        ctx.drawImage(canvas, -halfW, -halfH, renderW, renderH);

        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = Number.isFinite(item.alpha) ? item.alpha : 1;
        ctx.filter = `brightness(${1 + ((brightnessBase - 1) * glowMul)})`;
        ctx.drawImage(canvas, -halfW, -halfH, renderW, renderH);
        ctx.restore();
        return true;
    }

    function addHiddenWallClusterDecor(room, floor) {
        return;
    }

    function buildFloorDecor(room, floor) {
        room.hiddenDecor = [];
        room.hiddenLightSources = [];
        room.hiddenMotes = [];
        room.environmentLights = [];
        const cx = roomCenterX(room);
        const cy = roomCenterY(room);
        if (floor === 2) {
            room.environmentLights.push({
                kind: 'room_worm_stage',
                x: cx,
                y: cy + 6,
                radiusX: 118,
                radiusY: 84,
                bloomRadius: 24,
                color: { r: 118, g: 213, b: 238 },
                alpha: 0.006,
                reveal: 0.05,
                clarity: 0.02,
                colorizeAlpha: 0.008,
                bloomAlpha: 0.006,
                haloAlpha: 0.004,
                preserveSharpness: 0.05,
                preferColor: true,
                pulseSpeed: 0.9,
                pulseAmount: 0.02
            });
        } else if (floor === 6) {
            room.environmentLights.push({
                kind: 'legacy_table_warm',
                x: cx - 12,
                y: cy - 10,
                radiusX: 88,
                radiusY: 58,
                bloomRadius: 22,
                color: { r: 255, g: 210, b: 148 },
                alpha: 0.007,
                reveal: 0.05,
                clarity: 0.02,
                colorizeAlpha: 0.009,
                bloomAlpha: 0.007,
                haloAlpha: 0.005,
                preserveSharpness: 0.06,
                preferColor: true,
                pulseSpeed: 0.8,
                pulseAmount: 0.018
            });
        }
        addHiddenWallClusterDecor(room, floor);
        const customDecor = getHiddenLayoutFloorCustomDecor(floor);
        customDecor.forEach((decor) => addDecor(room, clone(decor)));
    }

    function buildPuzzleNodes(room, floor, progress) {
        const cx = roomCenterX(room);
        const cy = roomCenterY(room);
        const spreadX = Math.max(250, roomWidth(room) * 0.36);
        const spreadY = Math.max(170, roomHeight(room) * 0.28);
        const nodes = [];
        buildFloorDecor(room, floor);
        room.hiddenDecorMushrooms = [];

        if (floor === 1) {
            seedFloor1PuzzleFromRun(global.game || null, progress);
            const leftX = cx - 300;
            const rightX = cx + 300;
            const startY = cy - 164;
            const colGap = 136;
            const rowGap = 98;
            const templateRowShift = [0, 0, 0, 0];
            const candleRowShift = [0, 0, 0, 0];
            room.hiddenTemplateBoard = {
                centerX: cx,
                centerY: cy - 10,
                leftX,
                rightX,
                y: startY + rowGap * 1.5,
                cellW: 92,
                cellH: 92,
                cols: 2,
                rows: 4,
                rowGap,
                colGap,
                boardW: 300,
                boardH: 432,
                stageR: 268
            };
            room.hiddenFloor1Panels = [
                registerLayoutTarget({ kind: 'floor1_panel', x: leftX, y: startY + rowGap * 1.5, w: 300, h: 432, scale: 1, rotation: 0, editorLayer: -3, tint: 'rgba(88,140,158,0.20)', border: 'rgba(140,220,240,0.18)' }, 'floor1_panel_left', '左背景框'),
                registerLayoutTarget({ kind: 'floor1_panel', x: rightX, y: startY + rowGap * 1.5, w: 300, h: 432, scale: 1, rotation: 0, editorLayer: -3, tint: 'rgba(150,108,72,0.18)', border: 'rgba(255,214,160,0.16)' }, 'floor1_panel_right', '右背景框')
            ];
            room.hiddenTemplateCells = [];
            for (let row = 0; row < 4; row++) {
                for (let col = 0; col < 2; col++) {
                    const idx = row * 2 + col;
                    const tx = leftX + (col - 0.5) * colGap + templateRowShift[row];
                    const ty = startY + row * rowGap;
                    room.hiddenTemplateCells.push({
                        index: idx,
                        x: tx,
                        y: ty,
                        hasMushroom: !!progress.puzzleState.templateMask[idx],
                        row,
                        col,
                        assetKey: 'set5_mush_16',
                        drawW: 78,
                        drawH: 78,
                        offsetY: -6,
                        glowColor: '#8fdcff',
                        scale: 1,
                        scaleX: 1,
                        scaleY: 1,
                        rotation: 0,
                        editorLayer: 0
                    });
                    const cx2 = rightX + (col - 0.5) * colGap + candleRowShift[row];
                    const cy2 = startY + row * rowGap;
                    nodes.push({ kind: 'candle', index: idx, x: cx2, y: cy2, radius: 80, row, col, scale: 1, flameOffsetX: 0, flameOffsetY: -29 });
                }
            }
        } else if (floor === 2) {
            const puzzle = progress.puzzleState;
            const rng = seededRng(String((global.game || {}).runSeed || 'seed') + '-hidden-floor2-layout');
            const total = 20;
            const allIndices = shuffleWithRng(Array.from({ length: total }, (_, i) => i), rng);
            const redIndices = new Set(allIndices.slice(0, 4));
            const rangeX = Math.max(420, spreadX * 1.18);
            const rangeY = Math.max(250, spreadY * 0.96);
            room.hiddenWormCritters = [];
            for (let i = 0; i < total; i++) {
                const x = cx + (rng() - 0.5) * rangeX;
                const y = cy + (rng() - 0.5) * rangeY;
                room.hiddenWormCritters.push({
                    kind: 'hidden_worm',
                    id: `floor2_worm_${i}`,
                    x,
                    y,
                    homeX: x,
                    homeY: y,
                    radius: 24,
                    alive: !puzzle.killedIds?.includes(`floor2_worm_${i}`),
                    red: redIndices.has(i),
                    hue: redIndices.has(i) ? '#d65a66' : '#70bccc',
                    driftPhase: rng() * 6.28,
                    vx: (rng() - 0.5) * 44,
                    vy: (rng() - 0.5) * 34,
                    hiddenTime: 0,
                    reappearX: x,
                    reappearY: y
                });
            }
            room.hiddenWormBloodStains = room.hiddenWormCritters
                .filter((critter) => critter.red && !critter.alive)
                .map((critter, index) => ({
                    x: critter.x,
                    y: critter.y + 8,
                    radius: 20 + (index % 3) * 2,
                    seed: index * 0.73
                }));
            const aliveRed = room.hiddenWormCritters.filter(c => c.red && c.alive);
            const targetA = aliveRed[0] || null;
            const targetB = aliveRed[1] || aliveRed[0] || null;
            room.hiddenDecorMushrooms = [];
            room.hiddenDemoRabbit = puzzle.demoSeen ? null : {
                active: true,
                state: 'delay',
                timer: 0.65,
                x: cx - rangeX * 0.48,
                y: cy - rangeY * 0.10,
                targetAId: targetA?.id || null,
                targetBId: targetB?.id || null,
                trail: [],
                glow: 1,
                facing: 1,
                speedX: 0
            };
            puzzle.targetCount = 4;
            puzzle.killedCount = (puzzle.killedIds || []).length;
        } else if (floor === 3) {
            const offsets = [
                [-spreadX * 0.55, -spreadY * 0.18], [-spreadX * 0.22, -spreadY * 0.56], [spreadX * 0.22, -spreadY * 0.56],
                [spreadX * 0.55, -spreadY * 0.18], [spreadX * 0.28, spreadY * 0.44], [-spreadX * 0.28, spreadY * 0.44]
            ];
            offsets.forEach((offset, index) => {
                const variant = OVR_FLOOR4_VARIANTS[index % OVR_FLOOR4_VARIANTS.length];
                nodes.push({
                    kind: 'mushroom',
                    index,
                    x: cx + offset[0],
                    y: cy + offset[1],
                    radius: 62,
                    spriteKey: variant.key,
                    drawW: variant.w,
                    drawH: variant.h,
                    offsetY: variant.offsetY,
                    glowColor: variant.glow
                });
            });
            room.hiddenDecorMushrooms = [];
            nodes.forEach((node, index) => {
                pushCompanionMushroom(room, 3, node, `a_${index}`, -46, 12, 'set1_mush_08', 0.48, index * 0.7);
                pushCompanionMushroom(room, 3, node, `b_${index}`, 44, 8, 'set2_mush_05', 0.42, index * 0.7 + 0.2);
                pushCompanionMushroom(room, 3, node, `c_${index}`, 0, 34, 'cluster_mush_03', 0.52, index * 0.7 + 0.4);
            });
        } else if (floor === 4) {
            seedFloor4PuzzleFromRun(global.game || null, progress);
            const positions = [
                [-spreadX * 0.44, -spreadY * 0.36], [0, -spreadY * 0.40], [spreadX * 0.44, -spreadY * 0.36],
                [-spreadX * 0.50, 0], [0, spreadY * 0.02], [spreadX * 0.50, 0],
                [-spreadX * 0.38, spreadY * 0.44], [0, spreadY * 0.50], [spreadX * 0.38, spreadY * 0.44]
            ];
            const variants = [0,1,2, 1,2,0, 2,0,1];
            positions.forEach((offset, index) => {
                const variant = OVR_FLOOR4_VARIANTS[variants[index]] || OVR_FLOOR4_VARIANTS[0];
                nodes.push({
                    kind: 'memory_mushroom',
                    id: 'f4_' + index,
                    index,
                    variant: variants[index],
                    x: cx + offset[0],
                    y: cy + offset[1],
                    radius: 66,
                    spriteKey: variant.key,
                    drawW: variant.w,
                    drawH: variant.h,
                    offsetY: variant.offsetY,
                    glowColor: variant.glow
                });
            });
            room.hiddenDecorMushrooms = [];
            nodes.forEach((node, index) => {
                pushCompanionMushroom(room, 4, node, `l_${index}`, -52, 18, 'set5_mush_09', 0.44, index * 0.5);
                pushCompanionMushroom(room, 4, node, `r_${index}`, 50, 18, 'set2_mush_12', 0.40, index * 0.5 + 0.24);
            });
        } else if (floor === 5) {
            const targetOffsets = [[0, -spreadY * 0.50], [-spreadX * 0.40, spreadY * 0.10], [spreadX * 0.40, spreadY * 0.10]];
            const blockerOffsets = [[-spreadX * 0.14, -spreadY * 0.04], [0, spreadY * 0.30], [spreadX * 0.14, -spreadY * 0.04]];
            room.hiddenSealTargets = targetOffsets.map((offset, index) => ({
                index,
                x: cx + offset[0],
                y: cy + offset[1],
                radius: 44,
                leakDirX: ((cx - (cx + offset[0])) || 0),
                leakDirY: ((cy - (cy + offset[1])) || 0)
            }));
            room.hiddenBlockers = blockerOffsets.map((offset, index) => {
                const sealed = !!progress.puzzleState.blocked?.[index];
                const target = sealed ? room.hiddenSealTargets[index] : null;
                return {
                    index,
                    x: target ? target.x : (cx + offset[0]),
                    y: target ? target.y : (cy + offset[1]),
                    homeX: cx + offset[0],
                    homeY: cy + offset[1],
                    radius: 40,
                    spriteKey: 'dec_statue',
                    drawW: 92,
                    drawH: 92,
                    sealed
                };
            });
            room.hiddenSealTargets.forEach(t => nodes.push({ kind: 'seal_target', index: t.index, x: t.x, y: t.y, radius: t.radius }));
            room.hiddenBlockers.forEach(b => nodes.push({ kind: 'seal_blocker', index: b.index, x: b.x, y: b.y, radius: b.radius, spriteKey: b.spriteKey, drawW: b.drawW, drawH: b.drawH, sealed: !!b.sealed }));
            room.hiddenDecorMushrooms = [];
            room.hiddenSealTargets.forEach((target, index) => {
                pushCompanionMushroom(room, 5, { ...target, kind: 'seal_target' }, `t_${index}_a`, -42, 18, 'set1_mush_11', 0.44, index * 0.8);
                pushCompanionMushroom(room, 5, { ...target, kind: 'seal_target' }, `t_${index}_b`, 42, 18, 'set5_mush_10', 0.40, index * 0.8 + 0.2);
                pushCompanionMushroom(room, 5, { ...target, kind: 'seal_target' }, `t_${index}_c`, 0, 36, 'cluster_mush_04', 0.46, index * 0.8 + 0.4);
            });
        } else if (floor === 6) {
            room.hiddenLegacyTable = registerLayoutTarget({ kind: 'legacy_table', x: cx, y: cy - 4, w: 214, h: 72, scale: 1, rotation: 0, editorLayer: -2 }, 'legacy_table', '桌子');
            room.hiddenLegacyCandle = registerLayoutTarget({ kind: 'legacy_candle', x: cx - 132, y: cy - 34, radius: 28, drawW: 42, drawH: 42, scale: 1, rotation: 0, editorLayer: 1, alwaysGlow: true }, 'legacy_candle', '桌上蜡烛');
            nodes.push(registerLayoutTarget({ kind: 'legacy_lantern', x: cx - 90, y: cy - 40, radius: 34, spriteKey: 'item_lantern', drawW: 54, drawH: 54, alwaysGlow: true, glow: '#ffd59d', scale: 1, rotation: 0, editorLayer: 2 }, 'legacy_lantern', '提灯'));
            nodes.push(registerLayoutTarget({ kind: 'legacy_book', x: cx - 30, y: cy - 34, radius: 42, spriteKey: 'item_book', drawW: 58, drawH: 58, scale: 1, rotation: 0, editorLayer: 2 }, 'legacy_book', '日记'));
            nodes.push(registerLayoutTarget({ kind: 'legacy_bread', x: cx + 22, y: cy - 30, radius: 38, spriteKey: 'item_bread', drawW: 54, drawH: 34, scale: 1, rotation: 0, editorLayer: 2 }, 'legacy_bread', '面包'));
            nodes.push(registerLayoutTarget({ kind: 'legacy_bag', x: cx + 94, y: cy + 8, radius: 42, spriteKey: 'item_coin_bag', drawW: 72, drawH: 72, scale: 1, rotation: 0, editorLayer: 2 }, 'legacy_bag', '钱袋'));
        }

        room.hiddenPuzzleNodes = nodes;
        room.hiddenOrbPedestal = floor === 6 ? null : registerLayoutTarget({ kind: 'orb_pedestal', x: cx, y: cy + 22, w: 118, h: 58, alpha: 0.95, scale: 1, rotation: 0, editorLayer: -1 }, 'orb_pedestal', '石墩');
        room.hiddenOrb = floor === 6 ? null : registerLayoutTarget({ kind: 'orb', x: cx, y: cy - 2, radius: 34, scale: 1, rotation: 0, editorLayer: 1 }, 'orb', '水晶球');
    }

    function countFloor1Matches(progress) {
        const states = progress?.puzzleState?.candleStates || [];
        const template = progress?.puzzleState?.templateMask || [];
        let matches = 0;
        for (let i = 0; i < Math.min(states.length, template.length); i++) {
            if (!!states[i] === !!template[i]) matches += 1;
        }
        return matches;
    }

    function isFloor1Solved(progress) {
        return countFloor1Matches(progress) === 8;
    }

    let activeBottomCaption = null;
    let bottomCaptionInputBound = false;

    function closeBottomCaption() {
        const state = activeBottomCaption;
        if (!state) return false;
        if (state.timer) clearInterval(state.timer);
        if (state.autoTimer) clearTimeout(state.autoTimer);
        if (state.card?.parentNode) state.card.remove();
        activeBottomCaption = null;
        return true;
    }

    function revealBottomCaption() {
        const state = activeBottomCaption;
        if (!state) return false;
        if (state.timer) {
            clearInterval(state.timer);
            state.timer = null;
        }
        state.idx = state.fullText.length;
        state.textEl.textContent = state.fullText;
        return true;
    }

    function ensureBottomCaptionInput() {
        if (bottomCaptionInputBound || typeof document === 'undefined') return;
        bottomCaptionInputBound = true;
        document.addEventListener('keydown', (event) => {
            if (!activeBottomCaption) return;
            if (event.key === ' ' || event.key === 'Enter') {
                event.preventDefault();
                event.stopPropagation();
                revealBottomCaption();
                return;
            }
            if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                closeBottomCaption();
            }
        }, true);
    }

    function showBottomCaption(options) {
        closeBottomCaption();
        ensureBottomCaptionInput();
        const prefix = String(options?.prefix || '水晶球里传来妈妈的声音：');
        const color = options?.color || '#b9f4ff';
        const fullText = String(options?.text || '');
        const baseSpeed = Number.isFinite(options?.speed) ? options.speed : 96;
        const visibleChars = Math.max(1, fullText.replace(/\s/g, '').length);
        const speed = Math.max(baseSpeed, Math.ceil(2200 / visibleChars));
        const voiceKind = options?.voiceKind || '妈妈';
        const card = document.createElement('div');
        card.id = 'hiddenRoomNoteCard';
        card.style.cssText = [
            'position:fixed','left:50%','bottom:28px','transform:translateX(-50%)',
            'width:min(860px, calc(100vw - 36px))','padding:14px 18px 16px','border-radius:14px',
            'border:1px solid rgba(255,255,255,0.12)','border-top:2px solid ' + color,
            'background:rgba(0,0,0,0.72)','color:#f5f2ff','z-index:25000',
            'box-shadow:0 14px 40px rgba(0,0,0,0.35)','line-height:1.75',
            'font-family:Arial,sans-serif','backdrop-filter:blur(3px)'
        ].join(';');
        card.innerHTML = `
            <div style="font-size:12px;color:${color};letter-spacing:0.08em;margin-bottom:8px;">${prefix}</div>
            <div class="hidden-room-note-text" style="font-size:17px;color:#f3f0e8;white-space:pre-line;min-height:54px;"></div>
        `;
        document.body.appendChild(card);
        const textEl = card.querySelector('.hidden-room-note-text');
        const state = { card, textEl, fullText, idx: 0, timer: null, autoTimer: null };
        activeBottomCaption = state;
        state.timer = setInterval(() => {
            if (state.idx < fullText.length) {
                textEl.textContent += fullText[state.idx];
                state.idx += 1;
                if (state.idx % 3 === 0) playCrystalVoiceTick(voiceKind);
            } else if (state.timer) {
                clearInterval(state.timer);
                state.timer = null;
            }
        }, speed);
        const close = () => closeBottomCaption();
        state.autoTimer = setTimeout(close, Math.max(3200, fullText.length * Math.max(18, speed + 18) + 900));
        card.addEventListener('click', () => {
            if (state.idx < fullText.length) revealBottomCaption();
            else close();
        });
    }

    function showNote(profile, extraHtml) {
        showBottomCaption({
            prefix: `水晶球里传来${profile?.noteSpeaker || '妈妈'}的声音：`,
            text: String(profile?.note || ''),
            color: profile?.color || '#b9f4ff',
            speed: 108,
            voiceKind: profile?.noteSpeaker || '妈妈'
        });
    }

    function getHiddenInteractable(game, room) {
        if (!room || room.type !== 'hidden' || !game?.player) return null;
        const floor = getFloor(game, room);
        const progress = getFloorProgress(game, floor);
        const candidates = [];
        const px = Number.isFinite(game.player.cx) ? game.player.cx : game.player.x;
        const py = Number.isFinite(game.player.cy) ? game.player.cy : game.player.y;

        getSortedEditorList(room.hiddenPuzzleNodes || []).forEach(node => {
            if (floor === 5 && (node.kind === 'seal_target' || node.kind === 'seal_blocker')) return;
            if (floor === 4 && node.kind === 'memory_mushroom') {
                if (progress.completed || progress.puzzleState.phase !== 'search') return;
            } else if (floor === 3 && node.kind === 'mushroom') {
                if (progress.completed || progress.puzzleState.stage !== 'input') return;
            } else if (!['candle','mushroom','memory_mushroom','legacy_book','legacy_bread','legacy_bag'].includes(node.kind)) {
                return;
            }
            const d = Math.hypot(px - node.x, py - node.y);
            if (d <= ((node.radius || 56) + 10)) candidates.push({ target: node, dist: d, weight: 0 });
        });

        const orbReady = room.hiddenOrb && (progress.phase === 'awakened' || progress.phase === 'played' || progress.witnessed);
        if (orbReady) {
            const d = Math.hypot(px - room.hiddenOrb.x, py - room.hiddenOrb.y);
            if (d <= 112) candidates.push({ target: room.hiddenOrb, dist: d, weight: 1 });
        }

        if (candidates.length <= 0) return null;
        candidates.sort((a, b) => (a.weight - b.weight) || (a.dist - b.dist));
        return candidates[0].target;
    }

    function killFloor2Critter(game, room, critter) {
        if (!critter || !critter.alive || !critter.red) return false;
        critter.alive = false;
        const progress = getFloorProgress(game, 2);
        const killedIds = progress.puzzleState.killedIds || (progress.puzzleState.killedIds = []);
        if (!killedIds.includes(critter.id)) killedIds.push(critter.id);
        progress.puzzleState.killedCount = killedIds.length;
        progress.puzzleState.targetCount = 4;
        triggerStepFeedback(game, room, 2, critter.x, critter.y, null, critter.hue || '#ff6670');
        if ((progress.puzzleState.killedCount || 0) >= 4) {
            markCompleted(game, room, 2);
        } else {
            saveState(game);
        }
        return true;
    }

    function beginFloor4Round(progress) {
        const round = progress.puzzleState.round || 0;
        const sequence = progress.puzzleState.sequence || [0,1,2];
        progress.puzzleState.activeVariant = sequence[Math.min(round, sequence.length - 1)];
        progress.puzzleState.phase = 'pre_countdown';
        progress.puzzleState.phaseTimer = 2.4;
        progress.puzzleState.roundHits = 0;
    }

    function resetFloor4Room(game, room, progress) {
        seedFloor4PuzzleFromRun(game, progress);
        progress.puzzleState.litNodeIds = [];
        progress.puzzleState.wrongAttempts = 0;
        progress.failed = false;
        progress.phase = 'idle';
        room.hiddenTitleTime = 1.2;
        if (game?.player) {
            game.player.x = roomCenterX(room);
            game.player.y = roomCenterY(room) + Math.max(130, roomHeight(room) * 0.28);
        }
        triggerRoomPulse(room, 0.55, 0.45);
        triggerOrbFlash(room, '#8aa2b8', 0.62, 0.28);
        saveState(game);
    }

    function completeLegacyRoom(game, room) {
        const progress = getFloorProgress(game, 6);
        if (!progress.completed) {
            progress.completed = true;
            progress.phase = 'awakened';
            progress.crystalState = 'played';
            recompute(game.hiddenRooms);
        }
        saveState(game);
    }

    function handleNodeInteract(game, room, node) {
        const floor = getFloor(game, room);
        const progress = getFloorProgress(game, floor);
        if (floor === 1) seedFloor1PuzzleFromRun(game, progress);
        if (floor === 4) seedFloor4PuzzleFromRun(game, progress);
        progress.discovered = true;
        progress.started = true;

        if (floor === 1 && node.kind === 'candle') {
            const states = progress.puzzleState.candleStates;
            const template = progress.puzzleState.templateMask;
            const idx = node.index;
            if (!Array.isArray(states) || !Array.isArray(template) || idx < 0 || idx >= states.length) return true;
            const wasMatch = !!states[idx] === !!template[idx];
            states[idx] = !states[idx];
            const nowMatch = !!states[idx] === !!template[idx];
            if (!wasMatch && nowMatch) triggerStepFeedback(game, room, floor, node.x, node.y - 10, null, '#8fd8ff');
            if (isFloor1Solved(progress)) markCompleted(game, room, floor);
            else saveState(game);
            return true;
        }

        if (floor === 3 && node.kind === 'mushroom') {
            const puzzle = progress.puzzleState;
            if (progress.completed || puzzle.stage !== 'input') return true;
            const expected = puzzle.sequence[puzzle.inputIndex];
            if (node.index === expected) {
                triggerStepFeedback(game, room, 3, node.x, node.y - 8, null, '#cfb2ff');
                puzzle.inputIndex += 1;
                puzzle.lastTriggeredNode = node.index;
                if (puzzle.inputIndex >= puzzle.sequence.length) {
                    markCompleted(game, room, 3);
                } else {
                    saveState(game);
                }
            } else {
                sparkle(game, node.x, node.y - 8, '#9097a6', 7);
                cameraShake(game, 4.5, 0.35);
                resetFloor3Preview(progress);
                saveState(game);
            }
            return true;
        }

        if (floor === 4 && node.kind === 'memory_mushroom') {
            const puzzle = progress.puzzleState;
            if (progress.completed || puzzle.phase !== 'search') return true;
            if (puzzle.litNodeIds.includes(node.id)) return true;
            if (node.variant === puzzle.activeVariant) {
                puzzle.litNodeIds.push(node.id);
                puzzle.roundHits += 1;
                triggerStepFeedback(game, room, 4, node.x, node.y - 10, null, '#8fdcff');
                if (puzzle.roundHits >= 3) {
                    puzzle.round += 1;
                    if (puzzle.round >= 3) {
                        markCompleted(game, room, 4);
                    } else {
                        beginFloor4Round(progress);
                        saveState(game);
                    }
                } else {
                    saveState(game);
                }
            } else {
                puzzle.wrongAttempts += 1;
                sparkle(game, node.x, node.y - 8, '#7b8799', 7);
                cameraShake(game, 4.2, 0.28);
                if (puzzle.wrongAttempts >= 3) {
                    resetFloor4Room(game, room, progress);
                } else {
                    saveState(game);
                }
            }
            return true;
        }

        if (floor === 6 && node.kind === 'legacy_book') {
            progress.puzzleState.bookRead = true;
            progress.witnessed = true;
            progress.phase = 'played';
            progress.crystalState = 'played';
            completeLegacyRoom(game, room);
            showBottomCaption({ prefix: '母亲的日记：', text: OVR_FLOOR6_DIARY_TEXT, color: '#ffd5a4', speed: 72, voiceKind: '妈妈' });
            triggerStepFeedback(game, room, 6, node.x, node.y - 8, null, '#ffd5a4');
            return true;
        }

        if (floor === 6 && node.kind === 'legacy_bread') {
            if (!progress.puzzleState.breadTaken) {
                progress.puzzleState.breadTaken = true;
                if (game?.player) {
                    game.player.maxHp = (game.player.maxHp || 0) + 2;
                    game.player.hp = game.player.maxHp;
                }
                completeLegacyRoom(game, room);
                showBottomCaption({ prefix: '获得：', text: '生命上限 +2\n生命回满', color: '#ffd5a4', speed: 54, voiceKind: '系统' });
                triggerStepFeedback(game, room, 6, node.x, node.y - 4, null, '#ffd5a4');
                saveState(game);
            }
            return true;
        }

        if (floor === 6 && node.kind === 'legacy_bag') {
            if (!progress.puzzleState.moneyTaken) {
                progress.puzzleState.moneyTaken = true;
                if (game?.player) game.player.gold = (game.player.gold || 0) + 500;
                completeLegacyRoom(game, room);
                showBottomCaption({ prefix: '获得：', text: '获得 500 金币', color: '#ffd86a', speed: 52, voiceKind: '系统' });
                triggerStepFeedback(game, room, 6, node.x, node.y - 4, null, '#ffd86a');
                saveState(game);
            }
            return true;
        }

        return false;
    }

    function handleOrbInteract(game, room) {
        const floor = getFloor(game, room);
        if (floor === 6 || !room.hiddenOrb) return false;
        const profile = getProfile(floor);
        const progress = getFloorProgress(game, floor);
        progress.discovered = true;
        progress.started = true;

        if (progress.phase === 'awakened' || progress.phase === 'played' || progress.witnessed) {
            triggerOrbFlash(room, profile.color, 0.6, 0.2);
            showNote(profile);
            progress.witnessed = true;
            progress.phase = 'played';
            progress.crystalState = 'played';
            progress.crystalActivated = true;
            recompute(game.hiddenRooms);
            saveState(game);
            return true;
        }
        triggerOrbFlash(room, '#7b8290', 0.26, 0.10);
        return true;
    }

    function setupRoom(game, room) {
        if (!room || room.type !== 'hidden') return null;
        const floor = getFloor(game, room);
        if (room.hiddenMode && room.hiddenProfile && room.hiddenRoomFloor === floor && room.hiddenRuntimeVersion === HIDDEN_ROOM_VERSION) {
            return room.hiddenMode;
        }
        const profile = getProfile(floor);
        const progress = getFloorProgress(game, floor);
        progress.puzzleState = normalizePuzzleState(floor, progress.puzzleState);
        progress.discovered = true;
        if (floor === 1) seedFloor1PuzzleFromRun(game, progress);
        if (floor === 4) seedFloor4PuzzleFromRun(game, progress);
        if (floor === 6 && !progress.completed) {
            progress.completed = true;
            progress.phase = 'awakened';
            progress.crystalState = 'played';
            recompute(game.hiddenRooms);
        }

        room.hiddenRuntimeVersion = HIDDEN_ROOM_VERSION;
        room.hiddenMode = {
            id: profile.id,
            title: profile.title,
            subtitle: profile.subtitle,
            color: profile.color,
            challenge: floor === 2
        };
        room.hiddenProfile = profile;
        room.hiddenRoomFloor = floor;
        room.hiddenRewardGranted = false;
        room.chest = null;
        room.chests = [];
        room._hiddenModeAnnounced = false;
        room.environmentLights = room.environmentLights || [];
        room.secretHints = room.secretHints || [];
        room.hiddenPuzzleState = progress.puzzleState;
        room.hiddenRenderTime = room.hiddenRenderTime || 0;
        room.hiddenTitleTime = 2.8;
        room.hiddenCompletionTime = 0;
        room.hiddenFailureTime = 0;
        room.hiddenPulse = room.hiddenPulse || null;
        room.hiddenOrbFlash = room.hiddenOrbFlash || null;
        room.cleared = progress.completed ? true : floor !== 2;

        buildPuzzleNodes(room, floor, progress);
        applyHiddenLayoutOverrides(room, floor);
        if (floor === 2) {
            room.enemies = [];
            room.enemyBullets = [];
            room.enemySpawned = true;
        }
        if (floor === 3 && progress.puzzleState.stage !== 'input' && !progress.completed) resetFloor3Preview(progress);
        if (progress.completed && !progress.witnessed && progress.phase === 'idle') {
            progress.phase = 'awakened';
            progress.crystalState = floor === 6 ? 'played' : 'ready';
            progress.crystalActivated = floor !== 6;
        }
        if (progress.witnessed) {
            progress.phase = 'played';
            progress.crystalState = 'played';
        }
        saveState(game);
        return room.hiddenMode;
    }

    function updateFloor2(game, room, dt) {
        if (getHiddenLayoutEditorState().active) return;
        const progress = getFloorProgress(game, 2);
        const critters = Array.isArray(room.hiddenWormCritters) ? room.hiddenWormCritters : [];
        let rabbit = room.hiddenDemoRabbit;
        const px = Number.isFinite(game.player?.cx) ? game.player.cx : game.player?.x;
        const py = Number.isFinite(game.player?.cy) ? game.player.cy : game.player?.y;
        const isDashing = !!game.player?.isDashing;
        const t = room.hiddenRenderTime || 0;
        const rangeX = Math.max(260, roomWidth(room) * 0.42);
        const rangeY = Math.max(170, roomHeight(room) * 0.30);
        progress.puzzleState.targetCount = 4;
        if (!Array.isArray(progress.puzzleState.killedIds)) progress.puzzleState.killedIds = [];
        progress.puzzleState.killedCount = progress.puzzleState.killedIds.length;

        critters.forEach((critter, index) => {
            if (!critter.alive) return;
            if (critter.hiddenTime > 0) {
                critter.hiddenTime = Math.max(0, critter.hiddenTime - dt);
                if (critter.hiddenTime <= 0) {
                    critter.homeX = critter.reappearX;
                    critter.homeY = critter.reappearY;
                    critter.x = critter.homeX;
                    critter.y = critter.homeY;
                }
                return;
            }
            critter.x = critter.homeX + Math.sin(t * 1.9 + critter.driftPhase) * 10;
            critter.y = critter.homeY + Math.cos(t * 2.2 + critter.driftPhase) * 7;
        });

        if (!progress.puzzleState.demoSeen && (!rabbit || !rabbit.active)) {
            const aliveRed = critters.filter(c => c.red && c.alive);
            rabbit = room.hiddenDemoRabbit = {
                active: true,
                state: 'delay',
                timer: 0.65,
                x: roomCenterX(room) - Math.max(260, roomWidth(room) * 0.42),
                y: roomCenterY(room) - Math.max(50, roomHeight(room) * 0.10),
                targetAId: aliveRed[0]?.id || null,
                targetBId: aliveRed[1]?.id || aliveRed[0]?.id || null,
                trail: [],
                glow: 1,
                facing: 1,
                speedX: 0
            };
        }

        if (rabbit && rabbit.active) {
            rabbit.trail = Array.isArray(rabbit.trail) ? rabbit.trail : [];
            rabbit.trail = rabbit.trail.filter(item => (item.life -= dt) > 0);
            const targetA = critters.find(c => c.id === rabbit.targetAId && c.red && c.alive);
            const targetB = critters.find(c => c.id === rabbit.targetBId && c.red && c.alive);
            const moveToward = (tx, ty, speed) => {
                const dx = tx - rabbit.x;
                const dy = ty - rabbit.y;
                const d = Math.hypot(dx, dy) || 1;
                rabbit.speedX = (dx / d) * speed;
                rabbit.facing = rabbit.speedX >= 0 ? 1 : -1;
                rabbit.x += (dx / d) * dt * speed;
                rabbit.y += (dy / d) * dt * speed;
                return d;
            };
            if (rabbit.state === 'delay') {
                rabbit.timer -= dt;
                rabbit.speedX = 0;
                if (rabbit.timer <= 0) rabbit.state = 'approachA';
            } else if (rabbit.state === 'approachA') {
                if (!targetA) {
                    rabbit.state = 'lineupB';
                } else {
                    const d = moveToward(targetA.x - 62, targetA.y + 8, 130);
                    if (d < 20) {
                        targetA.hiddenTime = 0.40;
                        const ang = (targetA.driftPhase || 0) + t * 0.7 + 1.2;
                        targetA.reappearX = clamp(targetA.homeX + Math.cos(ang) * 84, roomCenterX(room) - rangeX, roomCenterX(room) + rangeX);
                        targetA.reappearY = clamp(targetA.homeY + Math.sin(ang) * 66, roomCenterY(room) - rangeY, roomCenterY(room) + rangeY);
                        rabbit.state = 'lineupB';
                        rabbit.timer = 0.10;
                    }
                }
            } else if (rabbit.state === 'lineupB') {
                if (rabbit.timer > 0) {
                    rabbit.timer -= dt;
                    rabbit.speedX = 0;
                } else if (!targetB) {
                    rabbit.state = 'exit';
                } else {
                    const d = moveToward(targetB.x - 116, targetB.y + 18, 138);
                    if (d < 18) {
                        rabbit.state = 'dashPause';
                        rabbit.timer = 0.14;
                        rabbit.speedX = 0;
                    }
                }
            } else if (rabbit.state === 'dashPause') {
                rabbit.timer -= dt;
                rabbit.speedX = 0;
                if (rabbit.timer <= 0) rabbit.state = 'dashKillB';
            } else if (rabbit.state === 'dashKillB') {
                rabbit.trail.push({ x: rabbit.x, y: rabbit.y, life: 0.18 });
                if (!targetB) {
                    rabbit.state = 'exit';
                } else {
                    const throughX = targetB.x + 188;
                    const throughY = targetB.y + 2;
                    const dx = throughX - rabbit.x;
                    const dy = throughY - rabbit.y;
                    const d = Math.hypot(dx, dy) || 1;
                    rabbit.speedX = (dx / d) * 760;
                    rabbit.facing = rabbit.speedX >= 0 ? 1 : -1;
                    rabbit.x += (dx / d) * dt * 760;
                    rabbit.y += (dy / d) * dt * 760;
                    if (targetB.alive && targetB.hiddenTime <= 0 && Math.hypot(rabbit.x - targetB.x, rabbit.y - targetB.y) < 38) {
                        killFloor2Critter(game, room, targetB);
                        progress.puzzleState.demoSeen = true;
                        rabbit.state = 'flashOrb';
                        rabbit.timer = 0.10;
                        rabbit.exitY = throughY;
                        triggerOrbFlash(room, '#91f2ff', 0.45, 0.18);
                        saveState(game);
                    } else if (rabbit.x > throughX) {
                        rabbit.state = 'exit';
                    }
                }
            } else if (rabbit.state === 'flashOrb') {
                rabbit.timer -= dt;
                rabbit.speedX = 540;
                rabbit.facing = 1;
                rabbit.x += dt * 540;
                rabbit.y += ((rabbit.exitY || rabbit.y) - rabbit.y) * Math.min(1, dt * 10);
                if (rabbit.timer <= 0) rabbit.state = 'exit';
            } else if (rabbit.state === 'exit') {
                rabbit.trail.push({ x: rabbit.x, y: rabbit.y, life: 0.14 });
                rabbit.speedX = 520;
                rabbit.facing = 1;
                rabbit.x += dt * 520;
                rabbit.y += (((rabbit.exitY || rabbit.y) - rabbit.y) * Math.min(1, dt * 8));
                if (rabbit.x > roomCenterX(room) + roomWidth(room) * 0.5 + 80) {
                    rabbit.active = false;
                    room.hiddenDemoRabbit = null;
                    progress.puzzleState.demoSeen = true;
                    saveState(game);
                }
            }
        }

        if (!progress.puzzleState.demoSeen) return;
        critters.forEach((critter, index) => {
            if (!critter.alive || critter.hiddenTime > 0) return;
            if (!Number.isFinite(px) || !Number.isFinite(py)) return;
            const dist = Math.hypot(px - critter.x, py - critter.y);
            if (isDashing && dist <= 34) {
                if (critter.red) {
                    killFloor2Critter(game, room, critter);
                } else {
                    critter.hiddenTime = 0.32;
                    critter.reappearX = clamp(critter.homeX + Math.cos(index + t) * 34, roomCenterX(room) - rangeX, roomCenterX(room) + rangeX);
                    critter.reappearY = clamp(critter.homeY + Math.sin(index + t) * 26, roomCenterY(room) - rangeY, roomCenterY(room) + rangeY);
                }
                return;
            }
            if (!isDashing && dist <= 52) {
                critter.hiddenTime = 0.40;
                const angle = ((index + 1) * 1.7) + t * 0.7;
                critter.reappearX = clamp(critter.homeX + Math.cos(angle) * 82, roomCenterX(room) - rangeX, roomCenterX(room) + rangeX);
                critter.reappearY = clamp(critter.homeY + Math.sin(angle) * 66, roomCenterY(room) - rangeY, roomCenterY(room) + rangeY);
            }
        });
    }

    function updateFloor4(game, room, dt) {
        const progress = getFloorProgress(game, 4);
        if (progress.completed) return;
        const puzzle = progress.puzzleState;
        if (puzzle.phase === 'pre_countdown') {
            puzzle.phaseTimer -= dt;
            if (puzzle.phaseTimer <= 0) {
                puzzle.phase = 'projection';
                puzzle.phaseTimer = 2.4;
            }
            return;
        }
        if (puzzle.phase === 'projection') {
            puzzle.phaseTimer -= dt;
            if (puzzle.phaseTimer <= 0) {
                puzzle.phase = 'search';
                puzzle.phaseTimer = 0;
                puzzle.roundHits = 0;
            }
            return;
        }
    }

    function updateFloor5(game, room, dt) {
        const progress = getFloorProgress(game, 5);
        if (progress.completed) return;
        const puzzle = progress.puzzleState;
        const px = Number.isFinite(game.player?.cx) ? game.player.cx : game.player?.x;
        const py = Number.isFinite(game.player?.cy) ? game.player.cy : game.player?.y;
        if (!Number.isFinite(px) || !Number.isFinite(py)) return;
        const blockers = Array.isArray(room.hiddenBlockers) ? room.hiddenBlockers : [];
        const targets = Array.isArray(room.hiddenSealTargets) ? room.hiddenSealTargets : [];
        const bounds = {
            left: roomCenterX(room) - Math.max(250, roomWidth(room) * 0.36),
            right: roomCenterX(room) + Math.max(250, roomWidth(room) * 0.36),
            top: roomCenterY(room) - Math.max(170, roomHeight(room) * 0.28),
            bottom: roomCenterY(room) + Math.max(170, roomHeight(room) * 0.28)
        };
        const prev = room.hiddenPrevPlayerPos || { x: px, y: py };
        const moveX = px - prev.x;
        const moveY = py - prev.y;
        room.hiddenPrevPlayerPos = { x: px, y: py };
        const moveLen = Math.hypot(moveX, moveY);
        let changed = false;

        targets.forEach(target => {
            if (puzzle.blocked?.[target.index]) return;
            const dirX = roomCenterX(room) - target.x;
            const dirY = roomCenterY(room) - target.y;
            const len = Math.hypot(dirX, dirY) || 1;
            const dist = Math.hypot(px - target.x, py - target.y);
            if (dist < 96 && game?.player) {
                const push = (96 - dist) * 0.03;
                game.player.x += (dirX / len) * push;
                game.player.y += (dirY / len) * push;
            }
        });

        blockers.forEach((blocker) => {
            if (!blocker || blocker.sealed) return;
            const node = room.hiddenPuzzleNodes?.find(n => n.kind === 'seal_blocker' && n.index === blocker.index);
            const toBlockX = blocker.x - px;
            const toBlockY = blocker.y - py;
            const d = Math.hypot(toBlockX, toBlockY);
            if (moveLen > 0.2 && d <= (blocker.radius || 40) + 34) {
                const pushDot = moveX * toBlockX + moveY * toBlockY;
                if (pushDot > 0) {
                    const pushScale = Math.min(0.55, 0.26 + moveLen * 0.05);
                    blocker.x += moveX * pushScale;
                    blocker.y += moveY * pushScale;
                    changed = true;
                }
            }
            blocker.x = clamp(blocker.x, bounds.left, bounds.right);
            blocker.y = clamp(blocker.y, bounds.top, bounds.bottom);
            blockers.forEach(other => {
                if (!other || other === blocker || other.sealed) return;
                const dx = blocker.x - other.x;
                const dy = blocker.y - other.y;
                const dist = Math.hypot(dx, dy);
                const minDist = (blocker.radius || 40) + (other.radius || 40) - 12;
                if (dist > 0.001 && dist < minDist) {
                    const overlap = (minDist - dist) * 0.5;
                    blocker.x += (dx / dist) * overlap;
                    blocker.y += (dy / dist) * overlap;
                    other.x -= (dx / dist) * overlap;
                    other.y -= (dy / dist) * overlap;
                }
            });
            if (node) { node.x = blocker.x; node.y = blocker.y; node.sealed = !!blocker.sealed; }
            const target = targets.find(t => !puzzle.blocked?.[t.index] && Math.hypot(blocker.x - t.x, blocker.y - t.y) <= 34);
            if (target) {
                blocker.x = target.x; blocker.y = target.y; blocker.sealed = true;
                if (node) { node.x = blocker.x; node.y = blocker.y; node.sealed = true; }
                puzzle.blocked[target.index] = true;
                puzzle.sealedCount = (puzzle.blocked || []).filter(Boolean).length;
                triggerStepFeedback(game, room, 5, target.x, target.y, null, '#a6efd2');
                changed = true;
            }
        });
        if (isFloor5Solved(progress)) { markCompleted(game, room, 5); return; }
        if (changed) saveState(game);
    }

    function updateFloor6(game, room, dt) {
        return;
    }

    function drawFloor1TemplateBoard(ctx, camera, room, time) {
        const board = room.hiddenTemplateBoard;
        if (!board) return;
        const cells = getFloor1TemplateCells(room);
        const centerY = board.centerY || roomCenterY(room);
        const boardCenter = camera.worldToScreen(board.centerX || roomCenterX(room), centerY);
        const panelW = board.boardW || 260;
        const panelH = board.boardH || 388;
        const stageR = board.stageR || 164;

        ctx.save();
        const stage = ctx.createRadialGradient(boardCenter.x, boardCenter.y, 0, boardCenter.x, boardCenter.y, stageR);
        stage.addColorStop(0, 'rgba(48,54,60,0.12)');
        stage.addColorStop(0.42, 'rgba(18,22,28,0.06)');
        stage.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = stage;
        ctx.beginPath();
        ctx.arc(boardCenter.x, boardCenter.y, stageR, 0, Math.PI * 2);
        ctx.fill();

        const panels = Array.isArray(room.hiddenFloor1Panels) && room.hiddenFloor1Panels.length
            ? getSortedEditorList(room.hiddenFloor1Panels.map(panel => ensureLayoutTargetDefaults(panel)))
            : [
                ensureLayoutTargetDefaults({ kind: 'floor1_panel', x: board.leftX, y: board.y, w: panelW, h: panelH, scale: 1, rotation: 0, editorLayer: -3, tint: 'rgba(88,140,158,0.20)', border: 'rgba(140,220,240,0.18)' }),
                ensureLayoutTargetDefaults({ kind: 'floor1_panel', x: board.rightX, y: board.y, w: panelW, h: panelH, scale: 1, rotation: 0, editorLayer: -3, tint: 'rgba(150,108,72,0.18)', border: 'rgba(255,214,160,0.16)' })
            ];
        panels.forEach((panel) => {
            const pos = camera.worldToScreen(panel.x, panel.y);
            const scale = Number.isFinite(panel.scale) ? panel.scale : 1;
            const scaleX = Number.isFinite(panel.scaleX) ? panel.scaleX : 1;
            const scaleY = Number.isFinite(panel.scaleY) ? panel.scaleY : 1;
            const w = (panel.w || panel.baseW || panelW) * scale * scaleX;
            const h = (panel.h || panel.baseH || panelH) * scale * scaleY;
            const tint = panel.tint || 'rgba(88,140,158,0.18)';
            const border = panel.border || 'rgba(255,255,255,0.16)';
            ctx.save();
            ctx.translate(pos.x, pos.y);
            if (panel.rotation) ctx.rotate(panel.rotation);
            drawRoundedRectPath(ctx, -w * 0.5, -h * 0.5, w, h, 24 * scale);
            const fill = ctx.createLinearGradient(0, -h * 0.5, 0, h * 0.5);
            fill.addColorStop(0, 'rgba(12,16,22,0.44)');
            fill.addColorStop(1, 'rgba(5,8,12,0.56)');
            ctx.fillStyle = fill;
            ctx.fill();
            ctx.strokeStyle = border;
            ctx.lineWidth = 2;
            ctx.stroke();
            const sheen = ctx.createLinearGradient(-w * 0.5, -h * 0.5, w * 0.5, h * 0.5);
            sheen.addColorStop(0, tint);
            sheen.addColorStop(1, 'rgba(255,255,255,0)');
            ctx.fillStyle = sheen;
            drawRoundedRectPath(ctx, -w * 0.5 + 2, -h * 0.5 + 2, w - 4, h - 4, Math.max(4, 22 * scale));
            ctx.fill();
            ctx.restore();
        });
        ctx.restore();

        getSortedEditorList(cells).forEach(cell => {
            const pos = camera.worldToScreen(cell.x, cell.y);
            const active = !!cell.hasMushroom;
            const sprite = getConfiguredMushroomSprite(cell);
            ctx.save();
            ctx.fillStyle = 'rgba(10,14,20,0.46)';
            ctx.beginPath();
            ctx.ellipse(pos.x, pos.y + 8, 34, 20, 0, 0, Math.PI * 2);
            ctx.fill();
            if (active) {
                drawSharedMushroomNode(ctx, camera, cell, sprite, 'preview_static', time, { phase: cell.index });
            }
            ctx.restore();
        });
    }

    function drawFloor2Critters(ctx, camera, room, time) {
        const critters = Array.isArray(room.hiddenWormCritters) ? room.hiddenWormCritters : [];
        critters.forEach((critter, index) => {
            if (!critter || !critter.alive || critter.hiddenTime > 0) return;
            const isRed = !!critter.red;
            const palette = (typeof room.getAmbientWormPalette === 'function' ? room.getAmbientWormPalette() : null) || {
                body: '#75c5d2',
                core: '#a8dee6',
                glow: { r: 114, g: 188, b: 203 }
            };
            const worm = {
                x: critter.x,
                y: critter.y + 6,
                dir: Math.atan2(critter.vy || 0.2, critter.vx || 1),
                len: isRed ? 18 : 17,
                thickness: isRed ? 2.55 : 2.3,
                wiggle: isRed ? 2.15 : 2.0,
                phase: time * 5.2 + (critter.driftPhase || index),
                glowScale: isRed ? 1.22 : 0.98,
                color: isRed ? {
                    body: '#c15d66',
                    core: '#e5a6ad',
                    glow: { r: 214, g: 102, b: 116 }
                } : palette
            };
            const pos = camera.worldToScreen(worm.x, worm.y + 6);
            const wormMul = getHiddenVisualTuning().wormBrightness;
            if (isRed) {
                ctx.save();
                ctx.globalCompositeOperation = 'screen';
                drawCachedHiddenRadial(ctx, pos.x, pos.y + 6, 22 * (0.86 + wormMul * 0.18), 10 * (0.86 + wormMul * 0.18), '#d26270', [
                    [0, 0.12 * (0.6 + wormMul * 0.4)],
                    [0.58, 0.05 * (0.6 + wormMul * 0.4)],
                    [1, 0]
                ], { composite: 'screen' });
                if (typeof room.getWormLightAnchors === 'function') {
                    const anchors = room.getWormLightAnchors(worm, 5);
                    anchors.forEach((anchor, anchorIndex) => {
                        const sp = camera.worldToScreen(anchor.x, anchor.y + 4);
                        const t = anchorIndex / Math.max(1, anchors.length - 1);
                        const scale = 0.68 + (1 - Math.abs(t - 0.5) * 1.3) * 0.42;
                        drawCachedHiddenRadial(ctx, sp.x, sp.y, 12 * scale, 9 * scale, '#d26270', [
                            [0, 0.16 * (0.6 + wormMul * 0.4)],
                            [0.62, 0.06 * (0.6 + wormMul * 0.4)],
                            [1, 0]
                        ], { composite: 'screen' });
                    });
                }
                ctx.restore();
            }
            if (typeof room.drawWormCritter === 'function') {
                room.drawWormCritter(ctx, camera, worm, { renderMode: 'normal' });
            }
        });
        const rabbit = room.hiddenDemoRabbit;
        if (rabbit && rabbit.active) {
            rabbit.trail.forEach((trail) => {
                const p = camera.worldToScreen(trail.x, trail.y);
                ctx.save();
                ctx.globalCompositeOperation = 'screen';
                ctx.globalAlpha = Math.max(0, trail.life / 0.18) * 0.26;
                ctx.fillStyle = '#91f2ff';
                ctx.beginPath();
                ctx.ellipse(p.x, p.y, 20, 14, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            });
            const p = camera.worldToScreen(rabbit.x, rabbit.y);
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            drawCachedHiddenRadial(ctx, p.x, p.y, 52, 52, '#99f2ff', [[0, 0.32], [0.55, 0.12], [1, 0]], { composite: 'screen' });
            ctx.globalCompositeOperation = 'source-over';
            const frame = `rabbit_black_${((Math.floor(time * 10) % 4) + 1)}`;
            drawSpriteCentered(ctx, camera, frame, rabbit.x, rabbit.y, 54, 54, { alpha: 1, raw: true, flipX: (rabbit.facing || 1) < 0 });
            ctx.restore();
        }
    }

    function drawHiddenWorldLayer(ctx, camera, room, game, time) {
        const floor = getFloor(game, room);
        const progress = getFloorProgress(game, floor);
        drawHiddenDecor(ctx, camera, room, game);
        if (floor === 1) drawFloor1TemplateBoard(ctx, camera, room, time);
        if (floor === 5) drawSealLeaks(ctx, camera, room, progress, time);
        if (floor === 6) drawLegacyRoom(ctx, camera, room, progress, time);
        if (floor === 2) drawFloor2Critters(ctx, camera, room, time);
        getSortedEditorList(room.hiddenPuzzleNodes || []).forEach(node => {
            if (node.kind === 'candle') {
                drawCandleNode(ctx, camera, node, !!progress.puzzleState.candleStates?.[node.index], time);
            } else if (node.kind === 'mushroom') {
                drawMushroomNode(ctx, camera, node, progress.puzzleState, time, !!progress.completed);
            } else if (node.kind === 'memory_mushroom') {
                drawMemoryMushroomNode(ctx, camera, node, progress, time);
            } else if (node.kind === 'seal_target') {
                drawSealTarget(ctx, camera, node, !!progress.puzzleState.blocked?.[node.index], time);
            } else if (node.kind === 'seal_blocker') {
                drawSealBlocker(ctx, camera, node, time);
            } else if (node.kind === 'legacy_book') {
                drawRelicNode(ctx, camera, node, !!progress.puzzleState.bookRead, '#9fd4ff', time, !!progress.puzzleState.bookRead);
            } else if (node.kind === 'legacy_bread') {
                drawRelicNode(ctx, camera, node, !!progress.puzzleState.breadTaken, '#ffd5a4', time, false);
            } else if (node.kind === 'legacy_bag') {
                drawRelicNode(ctx, camera, node, !!progress.puzzleState.moneyTaken, '#ffd86a', time, false);
            } else if (node.kind === 'legacy_lantern') {
                drawRelicNode(ctx, camera, node, true, '#ffd5a4', time, true);
            }
        });
        if (floor === 6 && room.hiddenLegacyCandle) {
            drawCandleNode(ctx, camera, room.hiddenLegacyCandle, true, time);
        }
        drawOrb(ctx, camera, room, progress, time, game);
        drawHiddenFilmOverlay(ctx, room, floor, time);
    }

    function drawFloor4Overlay(ctx, room, game, time) {
        const progress = getFloorProgress(game, 4);
        if (progress.completed) return;
        const puzzle = progress.puzzleState;
        const variant = OVR_FLOOR4_VARIANTS[puzzle.activeVariant] || OVR_FLOOR4_VARIANTS[0];
        if (puzzle.phase === 'pre_countdown' || puzzle.phase === 'projection') {
            const value = Math.max(1, Math.ceil(puzzle.phaseTimer));
            ctx.save();
            ctx.fillStyle = 'rgba(0,0,0,0.26)';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            if (puzzle.phase === 'projection') {
                const x = ctx.canvas.width * 0.5;
                const y = ctx.canvas.height * 0.38;
                const img = getSecretroomSprite(variant.key);
                if (img && img.complete && img.naturalWidth && img.naturalHeight) {
                    ctx.save();
                    ctx.translate(x, y);
                    ctx.globalAlpha = 0.96;
                    try {
                        ctx.drawImage(img, -variant.w * 0.7, -variant.h * 0.7, variant.w * 1.4, variant.h * 1.4);
                    } catch (err) {
                        console.warn('[HiddenRoomSystem] floor4 overlay draw skipped', err);
                    }
                    ctx.restore();
                }
            }
            ctx.fillStyle = 'rgba(255,255,255,0.92)';
            ctx.font = 'bold 52px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(String(value), ctx.canvas.width * 0.5, ctx.canvas.height * 0.58);
            ctx.restore();
        }
    }

    function patchRoomDraw() {
        if (typeof Room === 'undefined' || !Room.prototype || Room.prototype.__hiddenRoomDrawPatched) return;
        const original = Room.prototype.draw;
        if (typeof original !== 'function') return;
        Room.prototype.draw = function patchedHiddenRoomBaseDraw(ctx, camera, sprites) {
            const result = original.apply(this, arguments);
            const game = global.game;
            if (!game || this.type !== 'hidden') return result;
            game.ensureHiddenRoomSetup?.(this);
            drawHiddenWorldLayer(ctx, camera, this, game, this.hiddenRenderTime || 0);
            return result;
        };
        Room.prototype.__hiddenRoomDrawPatched = true;
    }

    function patchGamePrototype() {
        if (typeof Game === 'undefined' || !Game.prototype || Game.prototype.__hiddenRoomPatched) return;

        const originalStart = Game.prototype.start;
        if (typeof originalStart === 'function') {
            Game.prototype.start = function patchedStart() {
                ensureState(this);
                return originalStart.apply(this, arguments);
            };
        }

        Game.prototype.ensureHiddenRoomSetup = function patchedEnsureHiddenRoomSetup(room) {
            ensureState(this);
            return setupRoom(this, room);
        };

        Game.prototype.getHiddenRoomProgress = function patchedGetHiddenRoomProgress(floor) {
            return getFloorProgress(this, floor);
        };

        const originalGetInteractionContext = Game.prototype.getInteractionContext;
        if (typeof originalGetInteractionContext === 'function') {
            Game.prototype.getInteractionContext = function patchedGetInteractionContext() {
                const room = this.curRoom;
                if (room && room.type === 'hidden') {
                    this.ensureHiddenRoomSetup(room);
                    const target = getHiddenInteractable(this, room);
                    if (target) return { type: 'hidden_node', label: '' };
                    return { type: 'hidden_node', label: '' };
                }
                return originalGetInteractionContext.apply(this, arguments);
            };
        }

        const originalTriggerPrimary = Game.prototype.triggerPrimaryInteraction;
        if (typeof originalTriggerPrimary === 'function') {
            Game.prototype.triggerPrimaryInteraction = function patchedTriggerPrimaryInteraction() {
                const room = this.curRoom;
                if (room && room.type === 'hidden') {
                    this.ensureHiddenRoomSetup(room);
                    const target = getHiddenInteractable(this, room);
                    if (target) {
                        if (target.kind === 'orb') return handleOrbInteract(this, room);
                        return handleNodeInteract(this, room, target);
                    }
                    return false;
                }
                return originalTriggerPrimary.apply(this, arguments);
            };
        }

        const originalApplyDamage = Game.prototype.applyDamage;
        if (typeof originalApplyDamage === 'function') {
            Game.prototype.applyDamage = function patchedApplyDamage(e, dmg, stats, bullet) {
                const killed = originalApplyDamage.apply(this, arguments);
                if (killed) onEnemyKilled(this, e);
                return killed;
            };
        }

        const originalUpdate = Game.prototype.update;
        if (typeof originalUpdate === 'function') {
            Game.prototype.update = function patchedHiddenRoomUpdate(dt) {
                const result = originalUpdate.apply(this, arguments);
                const room = this.curRoom;
                if (!room || room.type !== 'hidden') return result;
                this.ensureHiddenRoomSetup(room);
                room.chest = null;
                room.chests = [];
                room.ambientWorms = [];
                room.secretHints = [];
                room.hiddenMotes = [];
                room.hiddenRenderTime = (room.hiddenRenderTime || 0) + dt;
                room.hiddenTitleTime = Math.max(0, (room.hiddenTitleTime || 0) - dt);
                room.hiddenCompletionTime = Math.max(0, (room.hiddenCompletionTime || 0) - dt);
                room.hiddenFailureTime = Math.max(0, (room.hiddenFailureTime || 0) - dt);
                if (room.hiddenPulse) {
                    room.hiddenPulse.time = Math.max(0, room.hiddenPulse.time - dt);
                    if (room.hiddenPulse.time <= 0) room.hiddenPulse = null;
                }
                if (room.hiddenOrbFlash) {
                    room.hiddenOrbFlash.time = Math.max(0, room.hiddenOrbFlash.time - dt);
                    if (room.hiddenOrbFlash.time <= 0) room.hiddenOrbFlash = null;
                }
                const floor = getFloor(this, room);
                updateSolveAnimation(this, room, floor, dt);
                if (floor === 2) updateFloor2(this, room, dt);
                if (floor === 3) updateFloor3(this, room, dt);
                if (floor === 4) updateFloor4(this, room, dt);
                if (floor === 5) updateFloor5(this, room, dt);
                if (floor === 6) updateFloor6(this, room, dt);
                return result;
            };
        }

        const originalDraw = Game.prototype.draw;
        if (typeof originalDraw === 'function') {
            Game.prototype.draw = function patchedGameDraw() {
                const result = originalDraw.apply(this, arguments);
                const room = this.curRoom;
                if (!room || room.type !== 'hidden' || !this.ctx || !this.camera) return result;
                this.ensureHiddenRoomSetup(room);
                const floor = getFloor(this, room);
                const progress = getFloorProgress(this, floor);
                const time = room.hiddenRenderTime || 0;
                this.ctx.save();
                drawVignette(this.ctx, room, this, time);
                if (floor === 4) drawFloor4Overlay(this.ctx, room, this, time);
                drawHiddenLayoutEditorOverlay(this.ctx, this.camera, room, this);
                drawHiddenInteractCue(this.ctx, this.camera, this, room);
                drawBanner(this.ctx, room, progress, time);
                this.ctx.restore();
                return result;
            };
        }

        Game.prototype.debugJumpToHiddenRoom = function patchedDebugJumpToHiddenRoom() {
            const room = typeof this.debugFindRoomByType === 'function'
                ? this.debugFindRoomByType('hidden')
                : null;
            if (!room) {
                this.damageNumbers?.spawn(this.player?.cx || 0, (this.player?.cy || 0) - 40, '本层无隐藏房!', { color: '#f44', size: 14, life: 1.2 });
                return false;
            }
            if (typeof this.debugTeleportToRoom === 'function') this.debugTeleportToRoom(room, '跳转隐藏房');
            return true;
        };

        Game.prototype.toggleHiddenLayoutEditor = function patchedToggleHiddenLayoutEditor() {
            installHiddenLayoutEditorInput();
            const state = getHiddenLayoutEditorState();
            state.active = !state.active;
            if (state.active && this.curRoom?.type === 'hidden') {
                this.ensureHiddenRoomSetup(this.curRoom);
                const selected = getSelectedHiddenLayoutTarget(this.curRoom);
                state.selectedId = selected?.id || null;
            } else {
                state.dragging = null;
            }
            this.damageNumbers?.spawn(this.player?.cx || 0, (this.player?.cy || 0) - 40, state.active ? '布局编辑 ON' : '布局编辑 OFF', { color: state.active ? '#6f6' : '#aaa', size: 14, life: 1.1 });
            this.debugPanel?.refreshHiddenRoomEditorTools?.();
            return state.active;
        };

        Game.prototype.saveHiddenRoomLayout = function patchedSaveHiddenRoomLayout() {
            const room = getActiveHiddenLayoutRoom(this);
            if (!room) return false;
            captureHiddenLayoutOverrides(room, room.hiddenRoomFloor || getFloor(this, room));
            this.damageNumbers?.spawn(this.player?.cx || 0, (this.player?.cy || 0) - 40, '隐藏房布局已保存', { color: '#8ff', size: 14, life: 1.2 });
            this.debugPanel?.refreshHiddenRoomEditorTools?.();
            return true;
        };

        Game.prototype.resetHiddenRoomLayout = function patchedResetHiddenRoomLayout() {
            const room = getActiveHiddenLayoutRoom(this);
            if (!room) return false;
            const floor = room.hiddenRoomFloor || getFloor(this, room);
            clearHiddenLayoutOverridesForFloor(floor);
            room.hiddenRuntimeVersion = null;
            room.hiddenMode = null;
            this.ensureHiddenRoomSetup(room);
            this.damageNumbers?.spawn(this.player?.cx || 0, (this.player?.cy || 0) - 40, '隐藏房布局已重置', { color: '#ffd27f', size: 14, life: 1.2 });
            this.debugPanel?.refreshHiddenRoomEditorTools?.();
            return true;
        };

        Game.prototype.cycleHiddenLayoutTarget = function patchedCycleHiddenLayoutTarget(dir) {
            const room = getActiveHiddenLayoutRoom(this);
            if (!room) return null;
            const selected = moveHiddenLayoutSelection(room, dir >= 0 ? 1 : -1);
            this.debugPanel?.refreshHiddenRoomEditorTools?.();
            return selected;
        };

        Game.prototype.scaleHiddenLayoutTarget = function patchedScaleHiddenLayoutTarget(delta) {
            const room = getActiveHiddenLayoutRoom(this);
            if (!room) return null;
            const selected = getSelectedHiddenLayoutTarget(room);
            if (!selected) return null;
            selected.obj.scale = clamp((selected.obj.scale || 1) + delta, 0.2, 4);
            this.debugPanel?.refreshHiddenRoomEditorTools?.();
            return selected.obj.scale;
        };

        Game.prototype.rotateHiddenLayoutTarget = function patchedRotateHiddenLayoutTarget(deg) {
            const room = getActiveHiddenLayoutRoom(this);
            if (!room) return null;
            const selected = getSelectedHiddenLayoutTarget(room);
            if (!selected) return null;
            selected.obj.rotation = (selected.obj.rotation || 0) + (deg * Math.PI / 180);
            this.debugPanel?.refreshHiddenRoomEditorTools?.();
            return selected.obj.rotation;
        };

        Game.prototype.nudgeHiddenLayoutLayer = function patchedNudgeHiddenLayoutLayer(delta) {
            const room = getActiveHiddenLayoutRoom(this);
            if (!room) return null;
            const selected = getSelectedHiddenLayoutTarget(room);
            if (!selected) return null;
            selected.obj.editorLayer = Math.round((selected.obj.editorLayer || 0) + delta);
            this.debugPanel?.refreshHiddenRoomEditorTools?.();
            return selected.obj.editorLayer;
        };

        Game.prototype.moveHiddenLayoutTarget = function patchedMoveHiddenLayoutTarget(dx, dy) {
            const room = getActiveHiddenLayoutRoom(this);
            if (!room) return null;
            const selected = getSelectedHiddenLayoutTarget(room);
            if (!selected) return null;
            nudgeHiddenLayoutTarget(selected, dx || 0, dy || 0);
            this.debugPanel?.refreshHiddenRoomEditorTools?.();
            return { x: selected.obj.x, y: selected.obj.y };
        };

        Game.prototype.resizeHiddenLayoutTarget = function patchedResizeHiddenLayoutTarget(dw, dh) {
            const room = getActiveHiddenLayoutRoom(this);
            if (!room) return null;
            const selected = getSelectedHiddenLayoutTarget(room);
            if (!selected) return null;
            if (!resizeHiddenLayoutTargetObject(selected.obj, dw || 0, dh || 0)) return null;
            this.debugPanel?.refreshHiddenRoomEditorTools?.();
            return {
                w: Number.isFinite(selected.obj.w) ? selected.obj.w : (Number.isFinite(selected.obj.drawW) ? selected.obj.drawW : null),
                h: Number.isFinite(selected.obj.h) ? selected.obj.h : (Number.isFinite(selected.obj.drawH) ? selected.obj.drawH : null),
                radius: Number.isFinite(selected.obj.radius) ? selected.obj.radius : null,
                scaleX: Number.isFinite(selected.obj.scaleX) ? selected.obj.scaleX : 1,
                scaleY: Number.isFinite(selected.obj.scaleY) ? selected.obj.scaleY : 1
            };
        };

        Game.prototype.__hiddenRoomPatched = true;
    }
    function bootstrap() {
        if (typeof global.debugJumpToHiddenRoom !== 'function') {
            global.debugJumpToHiddenRoom = function globalDebugJumpToHiddenRoom() {
                const game = global.game;
                if (!game) return false;
                if (typeof game.debugJumpToHiddenRoom === 'function') {
                    return game.debugJumpToHiddenRoom();
                }
                const protoFn = Game?.prototype?.debugJumpToHiddenRoom;
                if (typeof protoFn === 'function') {
                    return protoFn.call(game);
                }
                return false;
            };
        }
        patchRoomSpawnEnemies();
        patchRoomDraw();
        patchGamePrototype();
        ensureHiddenLayoutEditorGameMethods();
        patchTrueEnding();
        installHiddenRoomKeyHandler();
        global.HiddenRoomSystemRuntime = {
            version: HIDDEN_ROOM_VERSION,
            ensureState,
            saveState,
            getProfile,
            createDefaultState,
            drawFloor2Critters,
            getLayoutEditorState: getHiddenLayoutEditorState,
            captureHiddenLayoutOverrides,
            clearLocalProgress() {
                localStorage.removeItem(STORAGE_KEY);
            },
            resetAll(game) {
                if (game) {
                    game.hiddenRooms = clone(createDefaultState());
                    saveState(game);
                } else {
                    localStorage.setItem(STORAGE_KEY, JSON.stringify(createDefaultState()));
                }
            }
        };
        global.HiddenRoomLayoutEditor = {
            isActive() {
                return !!getHiddenLayoutEditorState().active;
            },
            getAssetLibrary() {
                return getHiddenLayoutAssetLibrary().map((asset) => ({
                    id: asset.id,
                    name: asset.name,
                    width: asset.width,
                    height: asset.height,
                    src: asset.src
                }));
            },
            getSelectedLabel() {
                const info = getHiddenLayoutEditorSelectionInfo(global.game);
                return info?.label || '未选中';
            },
            getSelectedInfo() {
                return getHiddenLayoutEditorSelectionInfo(global.game);
            },
            getLastAction() {
                return getHiddenLayoutRuntimeState().lastAction;
            },
            importFiles(game, options) {
                return game?.importHiddenLayoutAssets?.(options);
            },
            placeAsset(game, assetId, count) {
                return game?.placeHiddenDecorAsset?.(assetId, count);
            },
            placeAssetDirect(assetId, count) {
                const game = global.game;
                ensureHiddenLayoutEditorGameMethods();
                const action = {
                    assetId,
                    count: Number(count) || 1,
                    hasGame: !!game,
                    hasMethod: typeof game?.placeHiddenDecorAsset === 'function',
                    roomType: game?.curRoom?.type || null,
                    editorActive: !!getHiddenLayoutEditorState().active
                };
                console.info('[HiddenRoomLayoutEditor] bridge place asset', action);
                if (typeof game?.placeHiddenDecorAsset === 'function') {
                    return game.placeHiddenDecorAsset(assetId, count);
                }
                console.warn('[HiddenRoomLayoutEditor] bridge missing placeHiddenDecorAsset', action);
                setHiddenLayoutLastAction({
                    type: 'place_failed',
                    reason: 'missing_game_method',
                    ...action,
                    at: Date.now()
                });
                game?.debugPanel?.refreshHiddenRoomEditorTools?.();
                return 0;
            },
            removeSelected(game) {
                return game?.deleteSelectedHiddenDecor?.();
            },
            clearPlaced(game) {
                return game?.clearHiddenPlacedDecor?.();
            },
            toggle(game) {
                return game?.toggleHiddenLayoutEditor?.();
            },
            save(game) {
                return game?.saveHiddenRoomLayout?.();
            },
            reset(game) {
                return game?.resetHiddenRoomLayout?.();
            }
        };
        global.debugDumpHiddenLayoutStore = function debugDumpHiddenLayoutStore(floor) {
            try {
                const raw = localStorage.getItem(HIDDEN_LAYOUT_STORAGE_KEY);
                const parsed = raw ? JSON.parse(raw) : null;
                if (!Number.isFinite(floor)) return parsed;
                return parsed?.floors?.[String(floor)] || null;
            } catch (err) {
                console.warn('[HiddenRoomLayoutEditor] dump failed', err);
                return null;
            }
        };
        const retryBind = () => {
            try { patchRoomSpawnEnemies(); } catch (_) {}
            try { patchRoomDraw(); } catch (_) {}
            try { patchGamePrototype(); } catch (_) {}
            try { ensureHiddenLayoutEditorGameMethods(); } catch (_) {}
        };
        retryBind();
        if (typeof global.addEventListener === 'function') {
            global.addEventListener('load', () => {
                try { retryBind(); } catch (_) {}
                try { global.setTimeout?.(() => retryBind(), 0); } catch (_) {}
                try { global.setTimeout?.(() => retryBind(), 300); } catch (_) {}
                try { global.setTimeout?.(() => retryBind(), 1000); } catch (_) {}
            }, { once: true });
        }
    }

    bootstrap();
})(window);
