function getPropEntityBrightness() {
    const settings = window.game?.runtimeSettings || window.game?.settings || {};
    const base = Number(settings.entityBrightness ?? 0.4);
    const category = Number(settings.propBrightness ?? 1);
    const safeBase = Number.isFinite(base) ? Math.max(0, Math.min(1, base)) : 0.4;
    const safeCategory = Number.isFinite(category) ? Math.max(0, Math.min(1.5, category)) : 1;
    return Math.max(0, Math.min(1.5, safeBase * safeCategory));
}

const ROOM_TEMPLATE_LIBRARY = {
    maze: {
        name: '回字形迷宫',
        obstacles: [
            { x: 200, y: 100, w: 2300, h: 100 },
            { x: 200, y: 1600, w: 2300, h: 100 },
            { x: 100, y: 200, w: 100, h: 1400 },
            { x: 2500, y: 200, w: 100, h: 1400 },
            { x: 800, y: 500, w: 1100, h: 80 },
            { x: 800, y: 1200, w: 1100, h: 80 },
            { x: 800, y: 580, w: 80, h: 620 },
            { x: 1820, y: 580, w: 80, h: 620 }
        ],
        spawnPoints: [{ x: 500, y: 300 }, { x: 2200, y: 300 }, { x: 500, y: 1500 }, { x: 2200, y: 1500 }, { x: 1350, y: 200 }, { x: 1350, y: 1600 }]
    },
    cross: {
        name: '十字河流',
        obstacles: [{ x: 1300, y: 0, w: 100, h: 700 }, { x: 1300, y: 1100, w: 100, h: 700 }, { x: 0, y: 850, w: 1000, h: 100 }, { x: 1700, y: 850, w: 1000, h: 100 }],
        spawnPoints: [{ x: 500, y: 400 }, { x: 2200, y: 400 }, { x: 500, y: 1400 }, { x: 2200, y: 1400 }, { x: 1350, y: 900 }]
    },
    spiral: {
        name: '螺旋死亡',
        obstacles: [{ x: 400, y: 400, w: 1900, h: 100 }, { x: 2200, y: 400, w: 100, h: 500 }, { x: 600, y: 800, w: 1700, h: 100 }, { x: 600, y: 900, w: 100, h: 500 }, { x: 700, y: 1300, w: 1300, h: 100 }, { x: 1900, y: 1000, w: 100, h: 300 }],
        spawnPoints: [{ x: 300, y: 300 }, { x: 2400, y: 300 }, { x: 300, y: 1500 }, { x: 2400, y: 1500 }, { x: 1350, y: 900 }]
    },
    islands: {
        name: '岛屿群',
        obstacles: [{ x: 300, y: 300, w: 200, h: 200 }, { x: 800, y: 200, w: 250, h: 150 }, { x: 1500, y: 300, w: 200, h: 200 }, { x: 2100, y: 250, w: 250, h: 200 }, { x: 400, y: 800, w: 300, h: 200 }, { x: 1200, y: 750, w: 300, h: 300 }, { x: 2000, y: 800, w: 250, h: 200 }, { x: 300, y: 1300, w: 250, h: 200 }, { x: 900, y: 1400, w: 200, h: 200 }, { x: 1600, y: 1350, w: 250, h: 200 }, { x: 2200, y: 1300, w: 200, h: 200 }],
        spawnPoints: [{ x: 200, y: 600 }, { x: 2500, y: 600 }, { x: 200, y: 1200 }, { x: 2500, y: 1200 }, { x: 700, y: 900 }, { x: 1800, y: 900 }]
    },
    arena: {
        name: '竞技场',
        obstacles: [{ x: 0, y: 0, w: 800, h: 300 }, { x: 1900, y: 0, w: 800, h: 300 }, { x: 0, y: 1500, w: 800, h: 300 }, { x: 1900, y: 1500, w: 800, h: 300 }, { x: 0, y: 300, w: 300, h: 1200 }, { x: 2400, y: 300, w: 300, h: 1200 }, { x: 800, y: 0, w: 1100, h: 100 }, { x: 800, y: 1700, w: 1100, h: 100 }],
        spawnPoints: [{ x: 400, y: 400 }, { x: 2300, y: 400 }, { x: 400, y: 1400 }, { x: 2300, y: 1400 }, { x: 1350, y: 200 }, { x: 1350, y: 1600 }, { x: 200, y: 900 }, { x: 2500, y: 900 }]
    },
    dual: {
        name: '双通道',
        obstacles: [{ x: 0, y: 550, w: 1000, h: 100 }, { x: 1700, y: 550, w: 1000, h: 100 }, { x: 0, y: 1150, w: 1000, h: 100 }, { x: 1700, y: 1150, w: 1000, h: 100 }, { x: 1200, y: 850, w: 300, h: 100 }],
        spawnPoints: [{ x: 200, y: 300 }, { x: 2500, y: 300 }, { x: 200, y: 1500 }, { x: 2500, y: 1500 }, { x: 1350, y: 650 }, { x: 1350, y: 1150 }]
    },
    ruins: {
        name: '废墟迷宫',
        obstacles: [{ x: 400, y: 300, w: 150, h: 400 }, { x: 800, y: 600, w: 200, h: 100 }, { x: 1200, y: 200, w: 100, h: 300 }, { x: 1600, y: 500, w: 150, h: 250 }, { x: 2000, y: 300, w: 100, h: 400 }, { x: 300, y: 900, w: 200, h: 100 }, { x: 700, y: 1100, w: 150, h: 200 }, { x: 1100, y: 900, w: 200, h: 150 }, { x: 1500, y: 1200, w: 100, h: 300 }, { x: 1900, y: 1000, w: 250, h: 100 }, { x: 2300, y: 1300, w: 100, h: 200 }, { x: 500, y: 1400, w: 300, h: 100 }, { x: 1000, y: 1500, w: 150, h: 200 }, { x: 1800, y: 1500, w: 200, h: 150 }],
        spawnPoints: [{ x: 200, y: 200 }, { x: 2500, y: 200 }, { x: 200, y: 1600 }, { x: 2500, y: 1600 }, { x: 1350, y: 800 }, { x: 1350, y: 1000 }]
    },
    corridor: {
        name: '无尽长廊',
        obstacles: [{ x: 0, y: 0, w: 200, h: 1800 }, { x: 2500, y: 0, w: 200, h: 1800 }, { x: 600, y: 400, w: 100, h: 200 }, { x: 1300, y: 800, w: 100, h: 200 }, { x: 2000, y: 1200, w: 100, h: 200 }],
        spawnPoints: [{ x: 300, y: 200 }, { x: 300, y: 600 }, { x: 300, y: 1000 }, { x: 300, y: 1400 }, { x: 2400, y: 300 }, { x: 2400, y: 900 }, { x: 2400, y: 1500 }]
    }
};

const FLOOR_SPRITE_MAP = [
    'layer1_floor_mycelium',
    'layer2_floor_greenhouse',
    'layer3_floor_nerve',
    'layer4_floor_furnace',
    'layer5_floor_courtyard',
    'layer6_floor_core',
    'layer7_floor_final'
];

const ROOM_FLOOR_COLORS = {
    start: '#1a1a2e',
    normal: '#16213e',
    boss: '#2d1b2e',
    treasure: '#2d2d1b',
    shop: '#1b1b2d',
    hidden: '#2d1b2d'
};

class Room {
    getLayer1FullSceneBackdropUrl() {
        return window.RoomShellRuntimeMixin.getLayer1FullSceneBackdropUrl.call(this);
    }
    syncStageShellBackdrop() {
        return window.RoomShellRuntimeMixin.syncStageShellBackdrop.call(this);
    }
    getLayer1EnvelopeTextures() {
        return window.RoomShellRuntimeMixin.getLayer1EnvelopeTextures.call(this);
    }
    isEnvelopeTextureReady(image) {
        return window.RoomShellRuntimeMixin.isEnvelopeTextureReady.call(this, image);
    }
    drawTiledImageRect(ctx, image, x, y, width, height, options = {}) {
        return window.RoomShellRuntimeMixin.drawTiledImageRect.call(this, ctx, image, x, y, width, height, options);
    }
    getDoorPositions() {
        return window.RoomShellRuntimeMixin.getDoorPositions.call(this);
    }
    getDoorLightColor(door) {
        return window.RoomShellRuntimeMixin.getDoorLightColor.call(this, door);
    }
    drawDoorLightBeams(ctx, camera, doorPositions, viewLeft, viewTop, viewRight, viewBottom) {
        return window.RoomShellRuntimeMixin.drawDoorLightBeams.call(this, ctx, camera, doorPositions, viewLeft, viewTop, viewRight, viewBottom);
    }

    drawLayer1ForegroundOcclusion(ctx, camera) {
        if (this.floor !== 1) return;

        const scene = this.getLayer1SceneLayout(ctx, camera);
        const floorRect = scene.floorRect;
        const shellDepthX = floorRect.width * 0.085;
        const shellDepthY = floorRect.height * 0.085;
        const centerX = (floorRect.left + floorRect.right) * 0.5;
        const centerY = (floorRect.top + floorRect.bottom) * 0.5;

        const fillSoftBand = (points, fillStyle, blur = 0, alpha = 1) => {
            ctx.save();
            if (blur > 0) ctx.filter = `blur(${blur}px)`;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = fillStyle;
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        };

        const topBand = [
            { x: floorRect.left + floorRect.width * 0.08, y: floorRect.top },
            { x: centerX - floorRect.width * 0.18, y: floorRect.top },
            { x: centerX - floorRect.width * 0.1, y: floorRect.top + shellDepthY * 0.95 },
            { x: centerX, y: floorRect.top + shellDepthY * 1.12 },
            { x: centerX + floorRect.width * 0.1, y: floorRect.top + shellDepthY * 0.95 },
            { x: centerX + floorRect.width * 0.18, y: floorRect.top },
            { x: floorRect.right - floorRect.width * 0.08, y: floorRect.top },
            { x: floorRect.right - floorRect.width * 0.08, y: floorRect.top + shellDepthY * 0.32 },
            { x: floorRect.left + floorRect.width * 0.08, y: floorRect.top + shellDepthY * 0.32 }
        ];
        const leftBand = [
            { x: floorRect.left, y: floorRect.top + floorRect.height * 0.12 },
            { x: floorRect.left + shellDepthX * 0.34, y: floorRect.top + floorRect.height * 0.16 },
            { x: floorRect.left + shellDepthX * 0.82, y: centerY - floorRect.height * 0.16 },
            { x: floorRect.left + shellDepthX * 1.04, y: centerY },
            { x: floorRect.left + shellDepthX * 0.82, y: centerY + floorRect.height * 0.16 },
            { x: floorRect.left + shellDepthX * 0.34, y: floorRect.bottom - floorRect.height * 0.16 },
            { x: floorRect.left, y: floorRect.bottom - floorRect.height * 0.12 }
        ];
        const rightBand = [
            { x: floorRect.right, y: floorRect.top + floorRect.height * 0.12 },
            { x: floorRect.right - shellDepthX * 0.34, y: floorRect.top + floorRect.height * 0.16 },
            { x: floorRect.right - shellDepthX * 0.82, y: centerY - floorRect.height * 0.16 },
            { x: floorRect.right - shellDepthX * 1.04, y: centerY },
            { x: floorRect.right - shellDepthX * 0.82, y: centerY + floorRect.height * 0.16 },
            { x: floorRect.right - shellDepthX * 0.34, y: floorRect.bottom - floorRect.height * 0.16 },
            { x: floorRect.right, y: floorRect.bottom - floorRect.height * 0.12 }
        ];
        const bottomBand = [
            { x: floorRect.left + floorRect.width * 0.12, y: floorRect.bottom },
            { x: centerX - floorRect.width * 0.17, y: floorRect.bottom },
            { x: centerX - floorRect.width * 0.09, y: floorRect.bottom - shellDepthY * 0.66 },
            { x: centerX, y: floorRect.bottom - shellDepthY * 0.78 },
            { x: centerX + floorRect.width * 0.09, y: floorRect.bottom - shellDepthY * 0.66 },
            { x: centerX + floorRect.width * 0.17, y: floorRect.bottom },
            { x: floorRect.right - floorRect.width * 0.12, y: floorRect.bottom },
            { x: floorRect.right - floorRect.width * 0.12, y: floorRect.bottom - shellDepthY * 0.22 },
            { x: floorRect.left + floorRect.width * 0.12, y: floorRect.bottom - shellDepthY * 0.22 }
        ];

        const topGrad = ctx.createLinearGradient(0, floorRect.top, 0, floorRect.top + shellDepthY * 1.18);
        topGrad.addColorStop(0, 'rgba(4, 5, 7, 0.98)');
        topGrad.addColorStop(0.34, 'rgba(6, 7, 9, 0.92)');
        topGrad.addColorStop(1, 'rgba(6, 7, 9, 0)');
        fillSoftBand(topBand, topGrad, 8, 1);

        const leftGrad = ctx.createLinearGradient(floorRect.left, 0, floorRect.left + shellDepthX * 1.18, 0);
        leftGrad.addColorStop(0, 'rgba(4, 5, 7, 0.98)');
        leftGrad.addColorStop(0.36, 'rgba(6, 7, 9, 0.9)');
        leftGrad.addColorStop(1, 'rgba(6, 7, 9, 0)');
        fillSoftBand(leftBand, leftGrad, 7, 1);

        const rightGrad = ctx.createLinearGradient(floorRect.right, 0, floorRect.right - shellDepthX * 1.18, 0);
        rightGrad.addColorStop(0, 'rgba(4, 5, 7, 0.98)');
        rightGrad.addColorStop(0.36, 'rgba(6, 7, 9, 0.9)');
        rightGrad.addColorStop(1, 'rgba(6, 7, 9, 0)');
        fillSoftBand(rightBand, rightGrad, 7, 1);

        const bottomGrad = ctx.createLinearGradient(0, floorRect.bottom, 0, floorRect.bottom - shellDepthY * 0.92);
        bottomGrad.addColorStop(0, 'rgba(4, 5, 7, 0.96)');
        bottomGrad.addColorStop(0.34, 'rgba(6, 7, 9, 0.84)');
        bottomGrad.addColorStop(1, 'rgba(6, 7, 9, 0)');
        fillSoftBand(bottomBand, bottomGrad, 7, 1);
    }

    getLayer1SceneLayout(ctx, camera) {
        if (!camera || typeof camera.worldToScreen !== 'function') {
            const fallbackW = (ctx && ctx.canvas && Number.isFinite(ctx.canvas.width)) ? ctx.canvas.width : this.width;
            const fallbackH = (ctx && ctx.canvas && Number.isFinite(ctx.canvas.height)) ? ctx.canvas.height : this.height;
            return {
                canvasW: fallbackW,
                canvasH: fallbackH,
                center: { x: fallbackW / 2, y: fallbackH / 2 },
                roomRect: { left: 0, top: 0, right: fallbackW, bottom: fallbackH, width: fallbackW, height: fallbackH },
                floorRect: { left: 0, top: 0, right: fallbackW, bottom: fallbackH, width: fallbackW, height: fallbackH }
            };
        }
        const wallT = SURVIVOR_CONFIG.WALL_THICKNESS;
        const roomTopLeft = camera.worldToScreen(0, 0);
        const roomBottomRight = camera.worldToScreen(this.width, this.height);
        const floorTopLeft = camera.worldToScreen(wallT, wallT);
        const floorBottomRight = camera.worldToScreen(this.width - wallT, this.height - wallT);
        const safeCanvas = (ctx && ctx.canvas) ? ctx.canvas : null;
        const canvasW = (safeCanvas && Number.isFinite(safeCanvas.width) ? safeCanvas.width : (camera && Number.isFinite(camera.width) ? camera.width : 960));
        const canvasH = (safeCanvas && Number.isFinite(safeCanvas.height) ? safeCanvas.height : (camera && Number.isFinite(camera.height) ? camera.height : 960));

        return {
            canvasW,
            canvasH,
            center: camera.worldToScreen(this.centerX, this.centerY),
            roomRect: {
                left: roomTopLeft.x,
                top: roomTopLeft.y,
                right: roomBottomRight.x,
                bottom: roomBottomRight.y,
                width: roomBottomRight.x - roomTopLeft.x,
                height: roomBottomRight.y - roomTopLeft.y
            },
            floorRect: {
                left: floorTopLeft.x,
                top: floorTopLeft.y,
                right: floorBottomRight.x,
                bottom: floorBottomRight.y,
                width: floorBottomRight.x - floorTopLeft.x,
                height: floorBottomRight.y - floorTopLeft.y
            }
        };
    }

    drawLayer1UnifiedRoom(ctx, camera, sprites, viewLeft, viewTop, viewRight, viewBottom, time) {
        const textures = this.getLayer1EnvelopeTextures();
        const roomSeed = ((this.gx + 11) * 31 + (this.gy + 7) * 17 + this.floor * 13) & 0xffff;
        const baseFloorSprite = sprites ? sprites.get('layer1_floor_mycelium') : null;
        const scene = this.getLayer1SceneLayout(ctx, camera);
        const floorX = scene.floorRect.left;
        const floorY = scene.floorRect.top;
        const floorW = scene.floorRect.width;
        const floorH = scene.floorRect.height;

        ctx.save();
        ctx.beginPath();
        ctx.rect(floorX, floorY, floorW, floorH);
        ctx.clip();
        ctx.fillStyle = '#282826';
        ctx.fillRect(floorX, floorY, floorW, floorH);
        if (baseFloorSprite) {
            ctx.globalAlpha = 0.92;
            ctx.drawImage(baseFloorSprite, floorX, floorY, floorW, floorH);
        }
        ctx.globalAlpha = 0.22;
        ctx.fillStyle = '#000000';
        ctx.fillRect(floorX, floorY, floorW, floorH);
        ctx.restore();

        if (false && this.isEnvelopeTextureReady(textures?.floorCrack)) {
            ctx.save();
            ctx.globalAlpha = 0.08;
            for (let i = 0; i < 2; i++) {
                const px = floorX + floorW * (0.18 + (((roomSeed + i * 29) % 540) / 1000));
                const py = floorY + floorH * (0.16 + (((roomSeed + i * 47) % 620) / 1000));
                const crackW = floorW * 0.18;
                const crackH = floorH * 0.09;
                ctx.drawImage(textures.floorCrack, px, py, crackW, crackH);
            }
            ctx.restore();
        }

        this.drawAmbientEffects(ctx, camera, sprites, viewLeft, viewTop, viewRight, viewBottom);
    }

    invalidateStaticRenderCache() {
        this.renderCache.floorBaseKey = '';
        this.renderCache.floorBaseCanvas = null;
        this.renderCache.wallDecorKey = '';
        this.renderCache.wallDecorCanvas = null;
    }

    reportCacheMetrics() {
        const perf = window.game?.perfMonitor;
        if (!perf || typeof perf.setMetric !== 'function') return;
        perf.setMetric('roomCache.hit', this.renderCache.cacheHits || 0);
        perf.setMetric('roomCache.miss', this.renderCache.cacheMisses || 0);
        perf.setMetric('roomCache.rebuild', this.renderCache.rebuilds || 0);
    }

    getFloorSpriteName() {
        return FLOOR_SPRITE_MAP[this.floor - 1] || 'layer1_floor_mycelium';
    }

    rebuildStaticRenderCaches(sprites) {
        const floorSpriteName = this.getFloorSpriteName();
        const wallSpriteName = `layer${this.floor}_wall`;
        const wallThickness = SURVIVOR_CONFIG.WALL_THICKNESS;
        const floorLeft = wallThickness;
        const floorTop = wallThickness;
        const floorWidth = this.width - wallThickness * 2;
        const floorHeight = this.height - wallThickness * 2;
        const floorSprite = sprites ? sprites.get(floorSpriteName) : null;
        const wallSprite = sprites ? sprites.get(wallSpriteName) : null;
        const pixelSampling = window.game?.runtimeSettings?.enablePixelSampling === true ? 1 : 0;
        const quality = window.game?.runtimeSettings?.graphicsQuality || 'high';
        const floorBaseKey = [this.floor, this.type, floorSpriteName, !!floorSprite, this.width, this.height, wallThickness, quality, pixelSampling].join('|');
        const wallDecorKey = [this.floor, wallSpriteName, !!wallSprite, this.width, this.height, wallThickness, quality, pixelSampling].join('|');

        if (this.renderCache.floorBaseKey !== floorBaseKey || !this.renderCache.floorBaseCanvas) {
            this.renderCache.cacheMisses += 1;
            const floorCanvas = document.createElement('canvas');
            floorCanvas.width = Math.max(1, Math.round(this.width));
            floorCanvas.height = Math.max(1, Math.round(this.height));
            const floorCtx = floorCanvas.getContext('2d');
            floorCtx.fillStyle = ROOM_FLOOR_COLORS[this.type] || '#16213e';
            floorCtx.fillRect(floorLeft, floorTop, floorWidth, floorHeight);
            if (floorSprite) {
                floorCtx.drawImage(floorSprite, floorLeft, floorTop, floorWidth, floorHeight);
            }
            this.renderCache.floorBaseKey = floorBaseKey;
            this.renderCache.floorBaseCanvas = floorCanvas;
            this.renderCache.rebuilds += 1;
        } else {
            this.renderCache.cacheHits += 1;
        }

        if (this.renderCache.wallDecorKey !== wallDecorKey || !this.renderCache.wallDecorCanvas) {
            this.renderCache.cacheMisses += 1;
            const wallCanvas = document.createElement('canvas');
            wallCanvas.width = Math.max(1, Math.round(this.width));
            wallCanvas.height = Math.max(1, Math.round(this.height));
            const wallCtx = wallCanvas.getContext('2d');

            wallCtx.strokeStyle = 'rgba(255,255,255,0.03)';
            wallCtx.lineWidth = 1;
            for (let x = 0; x <= this.width; x += 50) {
                wallCtx.beginPath();
                wallCtx.moveTo(x, 0);
                wallCtx.lineTo(x, this.height);
                wallCtx.stroke();
            }
            for (let y = 0; y <= this.height; y += 50) {
                wallCtx.beginPath();
                wallCtx.moveTo(0, y);
                wallCtx.lineTo(this.width, y);
                wallCtx.stroke();
            }

            if (wallSprite) {
                const drawHorizontalWall = (worldX, worldY, worldW, worldH, flipY = false) => {
                    const tileWorldSize = 120;
                    const tilesX = Math.ceil(worldW / tileWorldSize);
                    for (let tx = 0; tx < tilesX; tx++) {
                        const destX = worldX + tx * tileWorldSize;
                        const drawSize = Math.min(tileWorldSize, worldX + worldW - destX);
                        if (drawSize <= 0) continue;
                        wallCtx.save();
                        wallCtx.translate(destX + drawSize / 2, worldY + worldH / 2);
                        if (flipY) wallCtx.scale(1, -1);
                        wallCtx.drawImage(wallSprite, 0, 0, 64, 64, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
                        wallCtx.restore();
                    }
                };
                const drawVerticalWall = (worldX, worldY, worldW, worldH, flipX = false) => {
                    const tileWorldSize = 120;
                    const tilesY = Math.ceil(worldH / tileWorldSize);
                    for (let ty = 0; ty < tilesY; ty++) {
                        const destY = worldY + ty * tileWorldSize;
                        const drawSize = Math.min(tileWorldSize, worldY + worldH - destY);
                        if (drawSize <= 0) continue;
                        wallCtx.save();
                        wallCtx.translate(worldX + worldW / 2, destY + drawSize / 2);
                        wallCtx.rotate(Math.PI / 2);
                        if (flipX) wallCtx.scale(1, -1);
                        wallCtx.drawImage(wallSprite, 0, 0, 64, 64, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
                        wallCtx.restore();
                    }
                };

                drawHorizontalWall(0, 0, this.width, wallThickness, false);
                drawHorizontalWall(0, this.height - wallThickness, this.width, wallThickness, true);
                drawVerticalWall(0, 0, wallThickness, this.height, true);
                drawVerticalWall(this.width - wallThickness, 0, wallThickness, this.height, false);

                const corners = [
                    { name: 'tl', x: 0, y: 0 },
                    { name: 'tr', x: this.width - wallThickness, y: 0 },
                    { name: 'bl', x: 0, y: this.height - wallThickness },
                    { name: 'br', x: this.width - wallThickness, y: this.height - wallThickness }
                ];
                for (const corner of corners) {
                    const cornerSprite = sprites ? sprites.get(`layer${this.floor}_corner_${corner.name}`) : null;
                    if (cornerSprite) {
                        wallCtx.drawImage(cornerSprite, corner.x, corner.y, wallThickness, wallThickness);
                    }
                }
            } else {
                wallCtx.fillStyle = '#0f0f1a';
                wallCtx.fillRect(0, 0, this.width, wallThickness);
                wallCtx.fillRect(0, this.height - wallThickness, this.width, wallThickness);
                wallCtx.fillRect(0, 0, wallThickness, this.height);
                wallCtx.fillRect(this.width - wallThickness, 0, wallThickness, this.height);
            }

            this.renderCache.wallDecorKey = wallDecorKey;
            this.renderCache.wallDecorCanvas = wallCanvas;
            this.renderCache.rebuilds += 1;
        } else {
            this.renderCache.cacheHits += 1;
        }
    }

    drawCachedRoomLayer(ctx, camera, layerCanvas, viewLeft, viewTop, viewRight, viewBottom) {
        if (!layerCanvas) return;
        const clipLeft = Math.max(0, Math.min(this.width, viewLeft));
        const clipTop = Math.max(0, Math.min(this.height, viewTop));
        const clipRight = Math.max(0, Math.min(this.width, viewRight));
        const clipBottom = Math.max(0, Math.min(this.height, viewBottom));
        const clipW = clipRight - clipLeft;
        const clipH = clipBottom - clipTop;
        if (clipW <= 0 || clipH <= 0) return;
        const screenTopLeft = camera.worldToScreen(clipLeft, clipTop);
        const screenBottomRight = camera.worldToScreen(clipRight, clipBottom);
        const drawW = screenBottomRight.x - screenTopLeft.x;
        const drawH = screenBottomRight.y - screenTopLeft.y;
        if (drawW <= 0 || drawH <= 0) return;
        ctx.drawImage(layerCanvas, clipLeft, clipTop, clipW, clipH, screenTopLeft.x, screenTopLeft.y, drawW, drawH);
    }

    drawCachedStaticRoomBase(ctx, camera, sprites, viewLeft, viewTop, viewRight, viewBottom) {
        if (window.game?.runtimeSettings?.enableRoomStaticCache === false) {
            this.invalidateStaticRenderCache();
        }
        const zoom = Number.isFinite(camera?.zoom) ? camera.zoom : 1;
        const zoomBucket = Math.max(0.5, Math.min(2.5, Math.round(zoom * 10) / 10));
        if (this.renderCache.lastZoomBucket !== zoomBucket) {
            this.renderCache.lastZoomBucket = zoomBucket;
            this.invalidateStaticRenderCache();
        }
        this.rebuildStaticRenderCaches(sprites);
        this.drawCachedRoomLayer(ctx, camera, this.renderCache.floorBaseCanvas, viewLeft, viewTop, viewRight, viewBottom);
        this.drawAmbientEffects(ctx, camera, sprites, viewLeft, viewTop, viewRight, viewBottom);
        this.drawCachedRoomLayer(ctx, camera, this.renderCache.wallDecorCanvas, viewLeft, viewTop, viewRight, viewBottom);
        this.reportCacheMetrics();
    }

    constructor(gx, gy, type = 'normal', floor = 1, templateKey = null) {

        this.gx = gx; this.gy = gy;

        this.id = `${floor}_${gx},${gy}`;

        this.type = type;

        this.floor = floor;

        this.doors = { up: null, down: null, left: null, right: null };

        this.enemies = [];

        this.cleared = type === 'start' || type === 'treasure' || type === 'shop' || type === 'hidden';

        this.visited = false;

        this.items = [];
        this.secretHints = [];
        this.environmentLights = [];
        this.ambientWorms = [];
        this.roomMode = null;
        this.roomModeName = null;
        this.roomModeConfig = null;
        this.isSecretRoom = false;
        this.renderCache = {
            floorBaseKey: '',
            floorBaseCanvas: null,
            wallDecorKey: '',
            wallDecorCanvas: null,
            lastZoomBucket: null,
            cacheHits: 0,
            cacheMisses: 0,
            rebuilds: 0
        };
        
        // v0.16.3: 经验和金币按房间存储（像血迹一样）
        this.gems = [];      // 经验宝石
        this.goldDrops = []; // 金币掉落

        this.npc = null;

        

        // 大房间尺寸

        this.width = SURVIVOR_CONFIG.ROOM_WIDTH;

        this.height = SURVIVOR_CONFIG.ROOM_HEIGHT;

        this.centerX = this.width / 2;

        this.centerY = this.height / 2;

        

        // 选择模板（8个之一）

        const templateMap = window.ROOM_TEMPLATES || ROOM_TEMPLATE_LIBRARY;
        const keys = Object.keys(templateMap);

        this.templateKey = templateKey || keys[Math.floor(Math.random() * keys.length)];

        this.template = templateMap[this.templateKey];
        this.ambientWorms = this.buildAmbientWorms();

        // 将相对坐标（0-1）转换为绝对坐标

        this.spawnPoints = this.template.spawnPoints.map(p => ({

            x: p.x < 1 ? p.x * this.width : p.x,

            y: p.y < 1 ? p.y * this.height : p.y

        }));

        

        // 波次管理器

        this.hordeManager = null;

        if (type === 'normal' || type === 'boss' || type === 'elite') {

            this.hordeManager = new HordeManager(this);

        }

        

        if (type === 'shop') {
            // NPC中心对准房间中心，脚底在中心上方70（-70）
            this.npc = new ShopNPC(this.centerX, this.centerY - 70);
        }

        

        this.spawnRoomItems();

    }

    

    spawnRoomItems() {
        if (this.type === 'treasure') {
            const createQuality = () => {
                if (window.game && typeof window.game.rollTreasureChestQuality === 'function') {
                    return window.game.rollTreasureChestQuality();
                }
                const roll = Math.random();
                if (roll < 0.05) return 'legendary';
                if (roll < 0.20) return 'rare';
                return 'common';
            };
            const spreadX = Math.max(160, Math.min(230, this.width * 0.16));
            const spreadY = Math.max(110, Math.min(160, this.height * 0.11));
            const positions = [
                { x: -spreadX, y: spreadY * 0.2 },
                { x: spreadX, y: spreadY * 0.2 },
                { x: 0, y: -spreadY }
            ];
            this.chest = null;
            this.chests = positions.map((offset) => {
                const quality = createQuality();
                return {
                    x: this.centerX + offset.x,
                    y: this.centerY + offset.y,
                    opened: false,
                    disabled: false,
                    quality,
                    rewards: window.game && typeof window.game.generateTreasureChestRewardsByQuality === 'function'
                        ? window.game.generateTreasureChestRewardsByQuality(quality)
                        : []
                };
            });

        } else if (this.type === 'hidden') {
            // 隐藏房：每层固定一个，进房即给隐藏奖励
            this.cleared = true;
            this.chests = [];
            this.chest = {
                x: this.centerX,
                y: this.centerY,
                opened: false,
                items: []
            };
            const secretPool = window.game && typeof window.game.getAvailableItemsByFloor === 'function'
                ? window.game.getAvailableItemsByFloor()
                : Object.values(ITEMS || {});
            if (secretPool.length > 0) {
                const selected = secretPool[Math.floor(Math.random() * secretPool.length)];
                if (selected) {
                    this.chest.items = [{
                        id: selected.id,
                        icon: selected.icon,
                        name: selected.name,
                        desc: selected.desc,
                        rarity: selected.rarity
                    }];
                }
            }

        }

    }

    

    // 获取当前活跃敌人（供外部使用）

    getActiveEnemies() {

        if (this.hordeManager) {

            return this.hordeManager.getActiveEnemies();

        }

        return this.enemies.filter(e => e.hp > 0);

    }

    

    update(dt) {

        if (this.hordeManager) {

            this.hordeManager.update(dt);

            // 持续补充敌人直到达到本波目标

            if (this.hordeManager.spawnedThisWave < this.hordeManager.targetCount) {

                this.hordeManager.spawnBatch();

            }

        }

    }



    spawnEnemies() {

        if (this.type === 'start' || this.type === 'treasure' || this.type === 'shop') return;

        

        if (this.type === 'hidden') {

            const floor = window.game?.currentFloor || 1;
            const typeKey = (typeof getRandomNewMonsterForFloor === 'function' &&
                (getRandomNewMonsterForFloor(floor, 2) ||
                 getRandomNewMonsterForFloor(floor, 3) ||
                 getRandomNewMonsterForFloor(floor))) || null;
            if (!typeKey) {
                console.error(`[HiddenRoom] 未找到第${floor}层的新怪物配置`);
                return;
            }

            const elite = createEnemy(this.centerX, this.centerY, typeKey);

            // v0.18.4: 应用楼层难度倍率
            elite.hp *= 2 * floor;  // 基础2倍精英 × 楼层倍率

            elite.maxHp = elite.hp;

            elite.dmg *= 1.5;

            elite.isElite = true;

            // 如果有HordeManager，添加到它的enemies数组

            if (this.hordeManager) {

                this.hordeManager.enemies.push(elite);

            } else {

                this.enemies.push(elite);

            }

            return;

        }

        

        if (this.type === 'boss') {
            const floor = window.game ? window.game.currentFloor : 1;
            // 第6层Boss固定在房间中央略高位置
            const bossX = this.centerX;
            const bossY = (floor >= 6) ? this.centerY - 50 : this.centerY - 100;
            
            const boss = createBoss(bossX, bossY, floor);
            if (!boss) {
                console.error(`[Boss生成] 未找到楼层${floor}的新Boss配置`);
                return;
            }
            
            // v0.17.2: 移除调试日志
        // console.log(`[Boss生成] 第${floor}层Boss: ${boss.name}, 贴图:${boss.typeKey}`);
            
            if (this.hordeManager) {
                this.hordeManager.enemies.push(boss);
            } else {
                this.enemies.push(boss);
            }
            
            return;
        }

        

        // v0.9.5 - 普通房间和精英房的敌人由HordeManager动态生成
        // 如果HordeManager不存在（异常情况），使用简单后备生成
        if (this.hordeManager) return;
        
        // 后备生成：只生成T1基础怪（避免破坏新系统平衡）
        const count = randInt(3, 5);
        
        // v0.18.4: 应用楼层难度倍率
        const floor = window.game?.currentFloor || 1;
        
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const r = 150 + Math.random() * 100;
            const x = 450 + Math.cos(angle) * r;
            const y = 300 + Math.sin(angle) * r;
            
            const typeKey = (typeof getRandomNewMonsterForFloor === 'function' &&
                (getRandomNewMonsterForFloor(floor, 1) ||
                 getRandomNewMonsterForFloor(floor, [1, 2]) ||
                 getRandomNewMonsterForFloor(floor))) || null;
            if (!typeKey) continue;
            
            const enemy = createEnemy(x, y, typeKey, 1);
            // 应用楼层倍率
            enemy.hp *= floor;
            enemy.maxHp = enemy.hp;
            this.enemies.push(enemy);
        }

    }



    draw(ctx, camera, sprites) {
        this.syncStageShellBackdrop();

        // 计算视野范围（世界坐标）
        const viewLeft = camera.x - camera.viewWidth / 2;
        const viewTop = camera.y - camera.viewHeight / 2;
        const viewRight = viewLeft + camera.viewWidth;
        const viewBottom = viewTop + camera.viewHeight;

        if (this.floor === 1) {
            this.drawLayer1UnifiedRoom(ctx, camera, sprites, viewLeft, viewTop, viewRight, viewBottom, Date.now() / 1000);
            return;
        }
        this.drawCachedStaticRoomBase(ctx, camera, sprites, viewLeft, viewTop, viewRight, viewBottom);

        // 绘制门（门180x180，完整覆盖120厚的墙）
        const doorPositions = this.getDoorPositions();

        // 绘制门 - 使用贴图（根据方向旋转）
        for (const [dir, door] of Object.entries(this.doors)) {
            if (!door) continue;
            const pos = doorPositions[dir];
            if (!pos) continue;
            
            if (pos.x < viewRight && pos.x + pos.w > viewLeft &&
                pos.y < viewBottom && pos.y + pos.h > viewTop) {
                
                const doorSpriteName = 'layer' + this.floor + (door.open ? '_door_open' : '_door_closed');
                const doorSprite = sprites ? sprites.get(doorSpriteName) : null;
                
                const centerX = camera.worldToScreen(pos.x + pos.w/2, pos.y + pos.h/2);
                const halfW = (camera.worldToScreen(pos.x + pos.w, pos.y).x - camera.worldToScreen(pos.x, pos.y).x) / 2;
                const halfH = (camera.worldToScreen(pos.x, pos.y + pos.h).y - camera.worldToScreen(pos.x, pos.y).y) / 2;
                
                // v0.20.0: 检查是否通往Boss房（door.target 是目标房间）
                const leadsToBoss = door.target && door.target.type === 'boss';
                const leadsToHidden = door.target && door.target.type === 'hidden' && this.type !== 'hidden';
                
                if (leadsToHidden) {
                    // 秘密入口：维持墙体外观，仅靠环境暗示与碰撞通道进入
                    continue;
                }

                if (this.floor >= 2) {
                    // 2-7层不再绘制门贴图/红绿门块，保留通行与光束即可
                    continue;
                }

                if (doorSprite) {
                    ctx.save();
                    ctx.translate(centerX.x, centerX.y);
                    ctx.rotate(pos.rotation);
                    ctx.drawImage(doorSprite, -halfW, -halfH, halfW * 2, halfH * 2);
                    
                    // v0.20.0-fix: 通往Boss房的门 - 径向渐变光晕效果
                    if (leadsToBoss) {
                        const time = Date.now() / 1000;
                        const pulse = 0.5 + Math.sin(time * 3) * 0.5; // 柔和脉动
                        
                        // 绘制多层光晕（从中心向外扩散）
                        const centerX = 0;
                        const centerY = 0;
                        const maxRadius = Math.max(halfW, halfH) * 2.5;
                        
                        // 外层光晕 - 最淡最大
                        const outerGradient = ctx.createRadialGradient(
                            centerX, centerY, Math.max(halfW, halfH) * 0.8,
                            centerX, centerY, maxRadius
                        );
                        outerGradient.addColorStop(0, `rgba(255, 0, 0, ${0.4 + pulse * 0.2})`);
                        outerGradient.addColorStop(0.5, `rgba(255, 50, 0, ${0.2 + pulse * 0.15})`);
                        outerGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
                        
                        ctx.fillStyle = outerGradient;
                        ctx.fillRect(-maxRadius, -maxRadius, maxRadius * 2, maxRadius * 2);
                        
                        // 中层光晕
                        const midGradient = ctx.createRadialGradient(
                            centerX, centerY, halfW * 0.5,
                            centerX, centerY, Math.max(halfW, halfH) * 1.5
                        );
                        midGradient.addColorStop(0, `rgba(255, 100, 50, ${0.5 + pulse * 0.3})`);
                        midGradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
                        
                        ctx.fillStyle = midGradient;
                        ctx.fillRect(-maxRadius, -maxRadius, maxRadius * 2, maxRadius * 2);
                        
                        // 绘制警告符号 ☠️（在门上方）
                        ctx.fillStyle = `rgba(255, 255, 255, ${0.8 + pulse * 0.2})`;
                        ctx.font = `${Math.min(20, halfW * 0.8)}px Arial`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText('☠️', 0, -halfH + 20);
                    }
                    
                    ctx.restore();
                } else {
                    const screenPos = camera.worldToScreen(pos.x, pos.y);
                    const screenEnd = camera.worldToScreen(pos.x + pos.w, pos.y + pos.h);
                    const screenW = screenEnd.x - screenPos.x;
                    const screenH = screenEnd.y - screenPos.y;
                    
                    // v0.20.0-fix: 通往Boss房的门 - 径向渐变光晕
                    if (leadsToBoss) {
                        const time = Date.now() / 1000;
                        const pulse = 0.5 + Math.sin(time * 3) * 0.5;
                        const centerX = screenPos.x + screenW / 2;
                        const centerY = screenPos.y + screenH / 2;
                        const maxRadius = Math.max(screenW, screenH) * 1.5;
                        
                        // 外层径向渐变光晕
                        const gradient = ctx.createRadialGradient(
                            centerX, centerY, Math.max(screenW, screenH) * 0.3,
                            centerX, centerY, maxRadius
                        );
                        gradient.addColorStop(0, `rgba(255, 80, 50, ${0.6 + pulse * 0.2})`);
                        gradient.addColorStop(0.5, `rgba(255, 30, 0, ${0.3 + pulse * 0.15})`);
                        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
                        
                        ctx.fillStyle = gradient;
                        ctx.fillRect(
                            centerX - maxRadius, 
                            centerY - maxRadius, 
                            maxRadius * 2, 
                            maxRadius * 2
                        );
                        
                        // 门主体（暗红色）
                        ctx.fillStyle = `rgba(120, 20, 20, ${0.9 + pulse * 0.1})`;
                        ctx.fillRect(screenPos.x, screenPos.y, screenW, screenH);
                        
                        // 骷髅符号
                        ctx.fillStyle = `rgba(255, 255, 255, ${0.8 + pulse * 0.2})`;
                        ctx.font = `${Math.min(24, screenW * 0.5)}px Arial`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText('☠️', centerX, centerY);
                    } else {
                        ctx.fillStyle = '#555';
                        ctx.fillRect(screenPos.x - 2, screenPos.y - 2, screenW + 4, screenH + 4);
                        ctx.fillStyle = door.open ? '#4a4' : '#a44';
                        ctx.fillRect(screenPos.x, screenPos.y, screenW, screenH);
                    }
                }
            }
        }

        

        // 房间信息现在显示在顶部栏，不再在房间内绘制

    }
    drawFloor7BossTotem(ctx, camera, sprites, time = Date.now() / 1000) {
        return window.RoomPresentationMixin.drawFloor7BossTotem.call(this, ctx, camera, sprites, time);
    }
    getRoomFloorScreenRect(camera) {
        return window.RoomPresentationMixin.getRoomFloorScreenRect.call(this, camera);
    }
    getCinematicRoomPalette() {
        return window.RoomPresentationMixin.getCinematicRoomPalette.call(this);
    }
    getCinematicRoomProfile() {
        return window.RoomPresentationMixin.getCinematicRoomProfile.call(this);
    }
    drawCinematicBaseOverlays(ctx, camera, profile, palette) {
        return window.RoomPresentationMixin.drawCinematicBaseOverlays.call(this, ctx, camera, profile, palette);
    }
    drawSoftShadowEllipse(ctx, camera, worldX, worldY, radiusX, radiusY, alpha = 0.18, blur = 14) {
        return window.RoomPresentationMixin.drawSoftShadowEllipse.call(this, ctx, camera, worldX, worldY, radiusX, radiusY, alpha, blur);
    }
    drawCinematicContactShadows(ctx, camera, profile) {
        return window.RoomPresentationMixin.drawCinematicContactShadows.call(this, ctx, camera, profile);
    }
    drawAmbientEffects(ctx, camera, sprites, viewLeft, viewTop, viewRight, viewBottom) {
        return window.RoomPresentationMixin.drawAmbientEffects.call(this, ctx, camera, sprites, viewLeft, viewTop, viewRight, viewBottom);
    }



    getAmbientWormPalette() {
        const palettes = {
            1: { body: '#78c7a5', core: '#9bdaba', glow: { r: 136, g: 238, b: 182 } },
            2: { body: '#73c99a', core: '#97ddad', glow: { r: 132, g: 242, b: 170 } },
            3: { body: '#ac6dca', core: '#c599dd', glow: { r: 208, g: 145, b: 238 } },
            4: { body: '#c79563', core: '#dcb48b', glow: { r: 235, g: 185, b: 135 } },
            5: { body: '#c67588', core: '#db9aaa', glow: { r: 234, g: 153, b: 172 } },
            6: { body: '#c46f66', core: '#db9b95', glow: { r: 232, g: 147, b: 138 } }
        };
        return palettes[this.floor] || palettes[1];
    }

    getVisualTuning() {
        const tuning = window.game?.debugVisualTuning || {};
        return {
            wormBrightness: Number.isFinite(tuning.wormBrightness) ? tuning.wormBrightness : 1.9,
            mushroomBrightness: Number.isFinite(tuning.mushroomBrightness) ? tuning.mushroomBrightness : 1.35,
            lanternBrightness: Number.isFinite(tuning.lanternBrightness) ? tuning.lanternBrightness : 1.12
        };
    }

    buildAmbientWorms() {
        const wallT = SURVIVOR_CONFIG.WALL_THICKNESS;
        const count = this.type === 'hidden' ? 8 : (this.type === 'normal' ? (3 + Math.floor(Math.random() * 3)) : 3);
        const worms = [];
        const normalRoom = this.type === 'normal';
        const minX = wallT + 72;
        const maxX = Math.max(minX, this.width - wallT - 72);
        const minY = wallT + 68;
        const maxY = Math.max(minY, this.height - wallT - 68);
        for (let i = 0; i < count; i++) {
            const angle = (i / Math.max(1, count)) * Math.PI * 2 + Math.random() * 0.45;
            const radiusX = this.width * 0.24;
            const radiusY = this.height * 0.18;
            worms.push({
                seed: Math.random() * 1000,
                lane: i / Math.max(1, count - 1),
                baseX: normalRoom
                    ? minX + Math.random() * Math.max(1, maxX - minX)
                    : this.centerX + Math.cos(angle) * radiusX + (Math.random() - 0.5) * 60,
                baseY: normalRoom
                    ? minY + Math.random() * Math.max(1, maxY - minY)
                    : this.centerY + Math.sin(angle) * radiusY + (Math.random() - 0.5) * 44,
                len: 14 + Math.random() * 12,
                thickness: 1.8 + Math.random() * 1.6,
                speed: 0.34 + Math.random() * 0.22,
                drift: 10 + Math.random() * 18,
                wiggle: 1.6 + Math.random() * 2.4,
                dir: Math.random() * Math.PI * 2,
                glowScale: 1.0 + Math.random() * 0.45
            });
        }
        return worms;
    }

    getAmbientWormCritters(time = Date.now() / 1000) {
        const palette = this.getAmbientWormPalette();
        const hiddenRoom = this.type === 'hidden';
        const cinematicMul = hiddenRoom ? 1.0 : 0.92;
        return (this.ambientWorms || []).map((worm, index) => {
            const crawl = time * worm.speed + worm.seed;
            const headX = worm.baseX + Math.cos(crawl * 0.7 + index) * worm.drift * 0.65;
            const headY = worm.baseY + Math.sin(crawl * 0.95 + index * 0.43) * worm.drift * 0.42;
            const dir = worm.dir + Math.sin(crawl * 0.45) * 0.35;
            const glowScale = (worm.glowScale || 1) * (hiddenRoom ? 1.18 : 1.08);
            return {
                kind: 'worm_ambient',
                x: headX,
                y: headY,
                dir,
                len: worm.len,
                thickness: worm.thickness,
                wiggle: worm.wiggle,
                phase: crawl,
                color: palette,
                glowScale,
                lightAlpha: (hiddenRoom ? 0.12 : 0.10) * glowScale,
                reveal: hiddenRoom ? 0.30 : 0.24,
                clarity: hiddenRoom ? 0.34 : 0.28,
                radiusX: (hiddenRoom ? 12 : 10.5) * glowScale,
                radiusY: (hiddenRoom ? 9 : 7.5) * glowScale,
                bloomRadius: (hiddenRoom ? 7 : 6) * glowScale,
                noBloom: false,
                haloAlpha: (hiddenRoom ? 0.04 : 0.03) * cinematicMul,
                preserveSharpness: hiddenRoom ? 0.20 : 0.18,
                preferColor: true,
                selfVisibleOnly: true,
                forceCinematic: true
            };
        });
    }

    getSecretHintWormCritters(time = Date.now() / 1000) {
        if (!Array.isArray(this.secretHints) || this.secretHints.length === 0) return [];
        const wallT = SURVIVOR_CONFIG.WALL_THICKNESS;
        const hiddenRoom = this.type === 'hidden';
        const sideAnchors = {
            up: { x: this.centerX, y: wallT + 28, dx: 0, dy: -1 },
            down: { x: this.centerX, y: this.height - wallT - 28, dx: 0, dy: 1 },
            left: { x: wallT + 28, y: this.centerY, dx: -1, dy: 0 },
            right: { x: this.width - wallT - 28, y: this.centerY, dx: 1, dy: 0 }
        };
        const sourceSidesByTarget = {
            up: ['left', 'right', 'down'],
            down: ['left', 'right', 'up'],
            left: ['up', 'down', 'right'],
            right: ['up', 'down', 'left']
        };
        const palette = this.getAmbientWormPalette();
        const critters = [];
        const cubicPoint = (p0, p1, p2, p3, t) => {
            const mt = 1 - t;
            const mt2 = mt * mt;
            const t2 = t * t;
            const x = mt2 * mt * p0.x + 3 * mt2 * t * p1.x + 3 * mt * t2 * p2.x + t2 * t * p3.x;
            const y = mt2 * mt * p0.y + 3 * mt2 * t * p1.y + 3 * mt * t2 * p2.y + t2 * t * p3.y;
            return { x, y };
        };
        const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

        this.secretHints.forEach((hint, hintIndex) => {
            const anchor = sideAnchors[hint.side] || sideAnchors.right;
            const targetDirX = anchor.dx || 0;
            const targetDirY = anchor.dy || 0;
            const targetPerpX = -targetDirY;
            const targetPerpY = targetDirX;
            const targetX = anchor.x + targetDirX * 54;
            const targetY = anchor.y + targetDirY * 54;
            const sourceSides = sourceSidesByTarget[hint.side] || ['left', 'right', 'up'];
            const sourceGroupCount = 3 + (Math.abs((hint.seed || 0) % 2));
            const wormCountPerGroup = 2;
            const baseSpeed = 0.055;

            for (let groupIndex = 0; groupIndex < sourceGroupCount; groupIndex++) {
                const sourceSide = sourceSides[groupIndex % sourceSides.length];
                const sourceAnchor = sideAnchors[sourceSide] || sideAnchors.left;
                const sourceDirX = sourceAnchor.dx || 0;
                const sourceDirY = sourceAnchor.dy || 0;
                const sourcePerpX = -sourceDirY;
                const sourcePerpY = sourceDirX;
                const sideSpan = sourceDirX !== 0 ? (this.height - wallT * 2) : (this.width - wallT * 2);
                const lane = sourceGroupCount === 1 ? 0 : (groupIndex / (sourceGroupCount - 1) - 0.5);
                const laneOffset = lane * Math.min(90, sideSpan * 0.22);
                const seedPhase = (hint.seed || 0) * 0.0017 + groupIndex * 1.37 + hintIndex * 0.91;
                const laneJitter = Math.sin(seedPhase) * 22;
                const sourceX = sourceAnchor.x + sourceDirX * 92 + sourcePerpX * (laneOffset + laneJitter);
                const sourceY = sourceAnchor.y + sourceDirY * 92 + sourcePerpY * (laneOffset + laneJitter);
                const targetJitter = Math.sin(seedPhase * 0.73) * 18;
                const endX = targetX + targetPerpX * targetJitter + targetDirX * 18;
                const endY = targetY + targetPerpY * targetJitter + targetDirY * 18;
                const midBiasX = this.centerX + Math.sin(seedPhase * 1.3) * 46;
                const midBiasY = this.centerY + Math.cos(seedPhase * 1.1) * 38;
                const c1 = {
                    x: sourceX + (midBiasX - sourceX) * 0.34 + sourcePerpX * (18 + Math.sin(seedPhase * 1.8) * 12),
                    y: sourceY + (midBiasY - sourceY) * 0.34 + sourcePerpY * (18 + Math.cos(seedPhase * 1.4) * 10)
                };
                const c2 = {
                    x: endX + (midBiasX - endX) * 0.38 + targetPerpX * (12 + Math.cos(seedPhase * 1.9) * 14),
                    y: endY + (midBiasY - endY) * 0.38 + targetPerpY * (12 + Math.sin(seedPhase * 1.6) * 12)
                };

                for (let wormIndex = 0; wormIndex < wormCountPerGroup; wormIndex++) {
                    const wormSeed = seedPhase + wormIndex * 0.61;
                    const flow = ((time * (baseSpeed + wormIndex * 0.007)) + wormSeed * 0.17) % 1;
                    const t = clamp(flow, 0.04, 0.98);
                    const p = cubicPoint({ x: sourceX, y: sourceY }, c1, c2, { x: endX, y: endY }, t);
                    const ahead = cubicPoint({ x: sourceX, y: sourceY }, c1, c2, { x: endX, y: endY }, clamp(t + 0.018, 0.05, 0.995));
                    const behind = cubicPoint({ x: sourceX, y: sourceY }, c1, c2, { x: endX, y: endY }, clamp(t - 0.018, 0.005, 0.96));
                    const travelDir = Math.atan2(ahead.y - behind.y, ahead.x - behind.x);
                    const bodyDrift = Math.sin(time * 0.8 + wormSeed * 2.7) * 3.2;
                    const dirX = Math.cos(travelDir);
                    const dirY = Math.sin(travelDir);
                    const perpX = -dirY;
                    const perpY = dirX;
                    const prominence = 0.5 + (1 - Math.abs(t - 0.72) / 0.72) * 0.24;
                    const glowScale = (hiddenRoom ? 1.14 : 1.08) * (0.92 + prominence * 0.42);
                    critters.push({
                        kind: 'worm_secret',
                        x: p.x + perpX * bodyDrift,
                        y: p.y + perpY * bodyDrift,
                        dir: travelDir + Math.sin(time * 0.55 + wormSeed * 1.9) * 0.11,
                        len: 14 + ((groupIndex + wormIndex + hintIndex) % 3) * 2,
                        thickness: 1.8 + ((groupIndex + wormIndex) % 2) * 0.3,
                        wiggle: 1.8 + (wormIndex % 2) * 0.35,
                        phase: time * 1.8 + wormSeed * 3.1,
                        color: palette,
                        glowScale,
                        lightAlpha: (hiddenRoom ? 0.14 : 0.11) + prominence * (hiddenRoom ? 0.04 : 0.03),
                        reveal: (hiddenRoom ? 0.26 : 0.22) + prominence * 0.06,
                        clarity: (hiddenRoom ? 0.30 : 0.26) + prominence * 0.06,
                        radiusX: (hiddenRoom ? 10 : 8.5) + prominence * (hiddenRoom ? 4 : 2.8),
                        radiusY: (hiddenRoom ? 8 : 6.2) + prominence * (hiddenRoom ? 3 : 1.8),
                        bloomRadius: (hiddenRoom ? 7 : 5.8) + prominence * (hiddenRoom ? 2.4 : 1.5),
                        noBloom: false,
                        haloAlpha: hiddenRoom ? 0.05 : 0.035,
                        preserveSharpness: hiddenRoom ? 0.22 : 0.18,
                        preferColor: true,
                        selfVisibleOnly: true,
                        forceCinematic: true
                    });
                }
            }
        });
        return critters;
    }

    getPresentationCritters(time = Date.now() / 1000) {
        return [
            ...this.getAmbientWormCritters(time),
            ...this.getSecretHintWormCritters(time)
        ];
    }

    drawWormCritter(ctx, camera, worm, options = {}) {
        const zoom = camera.zoom || 1;
        const dir = worm.dir || 0;
        const len = worm.len || 16;
        const thickness = (worm.thickness || 2) * zoom;
        const wiggle = worm.wiggle || 2;
        const color = worm.color || this.getAmbientWormPalette();
        const glow = color.glow || { r: 176, g: 255, b: 208 };
        const glowScale = worm.glowScale || 1;
        const wormBrightness = this.getVisualTuning().wormBrightness;
        const glowRadiusMul = 0.82 + wormBrightness * 0.22;
        const glowAlphaMul = 0.60 + wormBrightness * 0.40;
        const renderMode = options.renderMode || 'normal';
        const hiddenRoom = this.type === 'hidden';
        const cinematicGlow = worm.forceCinematic !== false;
        const styleHidden = hiddenRoom || cinematicGlow;
        const segments = 7;
        const pts = [];
        const perpX = -Math.sin(dir);
        const perpY = Math.cos(dir);
        const dirX = Math.cos(dir);
        const dirY = Math.sin(dir);
        for (let i = 0; i < segments; i++) {
            const t = i / (segments - 1);
            const back = len * t;
            const sway = Math.sin((worm.phase || 0) * 2.2 - t * 3.6) * wiggle * (1 - t * 0.22);
            const wx = worm.x - dirX * back + perpX * sway;
            const wy = worm.y - dirY * back + perpY * sway;
            pts.push(camera.worldToScreen(wx, wy));
        }
        ctx.save();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const glowPts = this.getWormLightAnchors(worm, styleHidden ? 6 : 5).map((p) => camera.worldToScreen(p.x, p.y));
        if (renderMode === 'mask') {
            ctx.strokeStyle = styleHidden ? 'rgba(255,255,255,0.42)' : 'rgba(255,255,255,0.24)';
            ctx.lineWidth = Math.max(styleHidden ? 1.7 : 1.0, thickness * (styleHidden ? 0.72 : 0.52));
            ctx.beginPath();
            ctx.moveTo(glowPts[0].x, glowPts[0].y);
            for (let i = 1; i < glowPts.length; i++) ctx.lineTo(glowPts[i].x, glowPts[i].y);
            ctx.stroke();
            if (styleHidden) {
                glowPts.slice(0, 2).forEach((p, i) => {
                    ctx.fillStyle = `rgba(255,255,255,${i === 0 ? 0.28 : 0.16})`;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, Math.max(1.6, thickness * (i === 0 ? 0.72 : 0.46)), 0, Math.PI * 2);
                    ctx.fill();
                });
            }
            ctx.restore();
            return;
        }

        if (styleHidden) {
            const head = glowPts[0];
            const mid = glowPts[Math.min(glowPts.length - 1, 2)] || head;
            const glowBoost = (hiddenRoom ? 0.84 : 0.76) * glowRadiusMul;
            const underGlow = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, Math.max(14, 28 * glowScale * glowBoost));
            underGlow.addColorStop(0, `rgba(${glow.r}, ${glow.g}, ${glow.b}, ${(hiddenRoom ? 0.11 : 0.08) * glowAlphaMul})`);
            underGlow.addColorStop(0.55, `rgba(${glow.r}, ${glow.g}, ${glow.b}, ${(hiddenRoom ? 0.045 : 0.03) * glowAlphaMul})`);
            underGlow.addColorStop(1, `rgba(${glow.r}, ${glow.g}, ${glow.b}, 0)`);
            ctx.fillStyle = underGlow;
            ctx.beginPath();
            ctx.arc(head.x, head.y + Math.max(3, 6 * zoom), Math.max(14, 28 * glowScale * glowBoost), 0, Math.PI * 2);
            ctx.fill();

            const trailGlow = ctx.createLinearGradient(head.x, head.y, mid.x, mid.y);
            trailGlow.addColorStop(0, `rgba(${glow.r}, ${glow.g}, ${glow.b}, ${(hiddenRoom ? 0.10 : 0.07) * glowAlphaMul})`);
            trailGlow.addColorStop(1, `rgba(${glow.r}, ${glow.g}, ${glow.b}, 0)`);
            ctx.strokeStyle = trailGlow;
            ctx.lineWidth = Math.max(hiddenRoom ? 2.6 : 2.2, thickness * (hiddenRoom ? 1.55 : 1.35));
            ctx.beginPath();
            ctx.moveTo(head.x, head.y);
            ctx.lineTo(mid.x, mid.y);
            ctx.stroke();
        }

        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.shadowBlur = (styleHidden ? 12 : 8) * glowScale * glowRadiusMul;
        ctx.shadowColor = `rgba(${glow.r}, ${glow.g}, ${glow.b}, ${(styleHidden ? (hiddenRoom ? 0.20 : 0.16) : 0.12) * glowAlphaMul})`;
        ctx.strokeStyle = `rgba(${glow.r}, ${glow.g}, ${glow.b}, ${(styleHidden ? (hiddenRoom ? 0.18 : 0.14) : 0.12) * glowAlphaMul})`;
        ctx.lineWidth = Math.max(styleHidden ? 1.9 : 1.4, thickness * (styleHidden ? 1.02 : 0.82));
        ctx.beginPath();
        ctx.moveTo(glowPts[0].x, glowPts[0].y);
        for (let i = 1; i < glowPts.length; i++) ctx.lineTo(glowPts[i].x, glowPts[i].y);
        ctx.stroke();
        ctx.shadowBlur = (styleHidden ? 18 : 10) * glowScale * glowRadiusMul;
        ctx.strokeStyle = `rgba(${glow.r}, ${glow.g}, ${glow.b}, ${(styleHidden ? (hiddenRoom ? 0.08 : 0.06) : 0.05) * glowAlphaMul})`;
        ctx.lineWidth = Math.max(styleHidden ? 2.8 : 2.0, thickness * (styleHidden ? 1.30 : 1.05));
        ctx.beginPath();
        ctx.moveTo(glowPts[0].x, glowPts[0].y);
        for (let i = 1; i < glowPts.length; i++) ctx.lineTo(glowPts[i].x, glowPts[i].y);
        ctx.stroke();
        glowPts.forEach((p, i) => {
            const alpha = styleHidden
                ? (hiddenRoom ? (i === 0 ? 0.20 : (i < 3 ? 0.11 : 0.07)) : (i === 0 ? 0.16 : (i < 3 ? 0.09 : 0.06)))
                : (i === 0 ? 0.14 : 0.07);
            ctx.fillStyle = `rgba(${glow.r}, ${glow.g}, ${glow.b}, ${alpha * glowAlphaMul})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(styleHidden ? 2.5 : 2.2, thickness * (i === 0 ? (styleHidden ? 1.02 : 1.08) : (styleHidden ? 0.74 : 0.78))) * glowRadiusMul, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = typeof color.body === 'string' && color.body.startsWith('#')
            ? `${color.body}${styleHidden ? (hiddenRoom ? 'd6' : 'ca') : 'b8'}`
            : color.body;
        ctx.lineWidth = Math.max(styleHidden ? 1.34 : 1.1, thickness * (styleHidden ? 0.94 : 0.88));
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.stroke();

        ctx.shadowBlur = styleHidden ? 4 * glowScale : 0;
        ctx.shadowColor = `rgba(${glow.r}, ${glow.g}, ${glow.b}, ${styleHidden ? (hiddenRoom ? 0.12 : 0.08) : 0})`;
        ctx.fillStyle = typeof color.core === 'string' && color.core.startsWith('#')
            ? `${color.core}${styleHidden ? (hiddenRoom ? 'e6' : 'd4') : 'aa'}`
            : color.core;
        ctx.beginPath();
        ctx.ellipse(pts[0].x, pts[0].y, Math.max(styleHidden ? 1.7 : 1.2, thickness * (styleHidden ? 0.54 : 0.44)), Math.max(styleHidden ? 1.18 : 0.92, thickness * (styleHidden ? 0.34 : 0.28)), dir, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    getWormLightAnchors(worm, samples = 5) {
        if (!worm) return [];
        const dir = worm.dir || 0;
        const len = worm.len || 16;
        const wiggle = worm.wiggle || 2;
        const perpX = -Math.sin(dir);
        const perpY = Math.cos(dir);
        const dirX = Math.cos(dir);
        const dirY = Math.sin(dir);
        const anchors = [];
        const count = Math.max(1, samples | 0);
        for (let i = 0; i < count; i++) {
            const t = count === 1 ? 0 : i / (count - 1);
            const back = len * t;
            const sway = Math.sin((worm.phase || 0) * 2.2 - t * 3.6) * wiggle * (1 - t * 0.22);
            anchors.push({
                x: worm.x - dirX * back + perpX * sway,
                y: worm.y - dirY * back + perpY * sway,
                t
            });
        }
        return anchors;
    }

    drawPresentationCritters(ctx, camera, time = Date.now() / 1000, options = {}) {
        const critters = this.getPresentationCritters(time);
        critters.forEach((worm) => this.drawWormCritter(ctx, camera, worm, options));
    }


    getPresentationWormLightSources(time = Date.now() / 1000) {
        return [];
    }

    createHiddenFeatureLight(kind, x, y, options = {}) {
        if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
        const radiusX = Math.max(8, options.radiusX ?? options.radius ?? 48);
        const radiusY = Math.max(8, options.radiusY ?? options.radius ?? 36);
        const bloomRadius = Math.max(4, options.bloomRadius ?? (Math.max(radiusX, radiusY) * 0.5));
        return {
            kind,
            x,
            y,
            radiusX,
            radiusY,
            bloomRadius,
            color: options.color || { r: 180, g: 220, b: 255 },
            alpha: Math.max(0, options.alpha ?? 0),
            reveal: Math.max(0, options.reveal ?? 0),
            clarity: Math.max(0, options.clarity ?? 0),
            bloomAlpha: Math.max(0, options.bloomAlpha ?? 0),
            colorizeAlpha: Math.max(0, options.colorizeAlpha ?? 0),
            haloAlpha: Math.max(0, options.haloAlpha ?? 0),
            preserveSharpness: Math.max(0, options.preserveSharpness ?? 0),
            preferColor: options.preferColor !== false,
            pulseSpeed: Number.isFinite(options.pulseSpeed) ? options.pulseSpeed : 0,
            pulseAmount: Number.isFinite(options.pulseAmount) ? options.pulseAmount : 0,
            phase: Number.isFinite(options.phase) ? options.phase : 0,
            noBloom: !!options.noBloom,
            selfVisibleOnly: !!options.selfVisibleOnly,
            pinHidden: !!options.pinHidden,
            flicker: Number.isFinite(options.flicker) ? options.flicker : 1
        };
    }

    getCurrentHiddenPuzzleState() {
        if (this.type !== 'hidden') return this.hiddenPuzzleState || {};
        const game = typeof window !== 'undefined' ? window.game : null;
        const floor = Math.max(1, Number(this.floor || game?.currentFloor || 1));
        const live = game?.hiddenRooms?.floors?.[floor]?.puzzleState;
        return live || this.hiddenPuzzleState || {};
    }

    getCurrentHiddenProgress() {
        if (this.type !== 'hidden') return null;
        const game = typeof window !== 'undefined' ? window.game : null;
        const floor = Math.max(1, Number(this.floor || game?.currentFloor || 1));
        return game?.hiddenRooms?.floors?.[floor] || null;
    }

    getHiddenMushroomLightConfig(mode, scale = 1) {
        switch (mode) {
            case 'active':
                return {
                    radiusX: 92 * scale,
                    radiusY: 70 * scale,
                    bloomRadius: 44 * scale,
                    alpha: 0.38,
                    reveal: 0.70,
                    clarity: 0.36,
                    bloomAlpha: 0.18,
                    colorizeAlpha: 0.15,
                    haloAlpha: 0.09,
                    preserveSharpness: 0.34,
                    pulseSpeed: 0,
                    pulseAmount: 0
                };
            case 'preview':
                return {
                    radiusX: 82 * scale,
                    radiusY: 62 * scale,
                    bloomRadius: 38 * scale,
                    alpha: 0.34,
                    reveal: 0.58,
                    clarity: 0.32,
                    bloomAlpha: 0.16,
                    colorizeAlpha: 0.13,
                    haloAlpha: 0.08,
                    preserveSharpness: 0.30,
                    pulseSpeed: 4.2,
                    pulseAmount: 0.05
                };
            case 'preview_static':
                return {
                    radiusX: 82 * scale,
                    radiusY: 62 * scale,
                    bloomRadius: 40 * scale,
                    alpha: 0.36,
                    reveal: 0.72,
                    clarity: 0.38,
                    bloomAlpha: 0.18,
                    colorizeAlpha: 0.15,
                    haloAlpha: 0.09,
                    preserveSharpness: 0.36,
                    pulseSpeed: 2.2,
                    pulseAmount: 0.03
                };
            case 'dormant':
                return {
                    radiusX: 58 * scale,
                    radiusY: 44 * scale,
                    bloomRadius: 22 * scale,
                    alpha: 0.14,
                    reveal: 0.28,
                    clarity: 0.18,
                    bloomAlpha: 0.07,
                    colorizeAlpha: 0.05,
                    haloAlpha: 0.03,
                    preserveSharpness: 0.16,
                    pulseSpeed: 0,
                    pulseAmount: 0
                };
            case 'hover':
                return {
                    radiusX: 60 * scale,
                    radiusY: 46 * scale,
                    bloomRadius: 24 * scale,
                    alpha: 0.16,
                    reveal: 0.30,
                    clarity: 0.18,
                    bloomAlpha: 0.06,
                    colorizeAlpha: 0.05,
                    haloAlpha: 0.03,
                    preserveSharpness: 0.20,
                    pulseSpeed: 3,
                    pulseAmount: 0.02
                };
            default:
                return null;
        }
    }

    createHiddenMushroomLight(kind, node, mode, options = {}) {
        if (!node || !mode) return null;
        const scale = (Number.isFinite(node.scale) ? node.scale : 1) * (Number.isFinite(options.scaleMul) ? options.scaleMul : 1);
        const profile = this.getHiddenMushroomLightConfig(mode, scale);
        if (!profile) return null;
        const phaseBase = Number.isFinite(options.phase) ? options.phase : (Number.isFinite(node.index) ? node.index : 0) * 0.41;
        const yOffsetMul = Number.isFinite(options.yOffsetMul) ? options.yOffsetMul : 0.25;
        return this.createHiddenFeatureLight(kind, node.x, node.y - 8 + ((node.offsetY || 0) * yOffsetMul), {
            ...profile,
            color: options.color || node.glowColor || node.glow || '#7fd8ff',
            phase: phaseBase,
            pinHidden: true
        });
    }

    getHiddenTemplateCellLightState(cell) {
        if (!cell || !cell.hasMushroom) return null;
        return this.createHiddenMushroomLight('hidden_template_mushroom', cell, 'preview_static', {
            color: cell.glowColor || '#8fdcff',
            phase: (Number.isFinite(cell.index) ? cell.index : 0) * 0.37,
            yOffsetMul: 0.20
        });
    }

    getHiddenCandleLightState(node, puzzleState = this.getCurrentHiddenPuzzleState(), options = {}) {
        if (!node) return null;
        const lit = !!options.forceLit || !!node.alwaysGlow || !!puzzleState.candleStates?.[node.index];
        if (!lit) return null;
        const scale = (Number.isFinite(node.scale) ? node.scale : 1) * (Number.isFinite(options.scaleMul) ? options.scaleMul : 1);
        const phase = (Number.isFinite(node.index) ? node.index : 0) * 0.61;
        const flameOffsetY = Number.isFinite(options.flameOffsetY)
            ? options.flameOffsetY
            : (Number.isFinite(node.flameOffsetY) ? node.flameOffsetY : -29);
        const flameOffsetX = Number.isFinite(options.flameOffsetX)
            ? options.flameOffsetX
            : (Number.isFinite(node.flameOffsetX) ? node.flameOffsetX : 0);
        const profile = options.profile === 'legacy'
            ? {
                radiusX: 110 * scale,
                radiusY: 82 * scale,
                bloomRadius: 50 * scale,
                alpha: 0.48,
                reveal: 0.88,
                clarity: 0.40,
                bloomAlpha: 0.22,
                colorizeAlpha: 0.18,
                haloAlpha: 0.10,
                preserveSharpness: 0.34,
                pulseSpeed: 5.4,
                pulseAmount: 0.04
            }
            : {
                radiusX: 118 * scale,
                radiusY: 88 * scale,
                bloomRadius: 54 * scale,
                alpha: 0.54,
                reveal: 1.02,
                clarity: 0.48,
                bloomAlpha: 0.20,
                colorizeAlpha: 0.16,
                haloAlpha: 0.09,
                preserveSharpness: 0.40,
                pulseSpeed: 6.2,
                pulseAmount: 0.05
            };
        return this.createHiddenFeatureLight(options.kind || 'hidden_candle', node.x + flameOffsetX * scale * 0.15, node.y + flameOffsetY * scale, {
            ...profile,
            color: options.color || { r: 255, g: 214, b: 138 },
            phase,
            pinHidden: true,
            preferColor: true
        });
    }

    isHiddenMushroomDecorAssetKey(key) {
        return typeof key === 'string' && /^(set[125]_mush_|cluster_mush_)/.test(key);
    }

    isHiddenMushroomDecorItem(item) {
        if (!item) return false;
        if (item.kind === 'mushroom_band') return true;
        return this.isHiddenMushroomDecorAssetKey(item.key)
            || this.isHiddenMushroomDecorAssetKey(item.spriteKey)
            || this.isHiddenMushroomDecorAssetKey(item.assetKey)
            || this.isHiddenMushroomDecorAssetKey(item.customAssetName);
    }

    getHiddenMushroomNodeMode(node, puzzleState = this.getCurrentHiddenPuzzleState()) {
        if (!node) return null;
        const progress = this.getCurrentHiddenProgress();
        if (progress?.completed) return 'active';
        const floor = Math.max(1, Number(node.floor || this.floor || window.game?.currentFloor || 1));
        if (floor === 3) {
            const sequence = Array.isArray(puzzleState.sequence) ? puzzleState.sequence : [];
            const entered = new Set(sequence.slice(0, Math.max(0, puzzleState.inputIndex || 0)));
            const previewLit = !!puzzleState.previewLit && puzzleState.activePreviewIndex === node.index;
            const activeLit = entered.has(node.index);
            const hovered = puzzleState.stage === 'input' && puzzleState.hoveredIndex === node.index;
            if (activeLit) return 'active';
            if (previewLit) return 'preview';
            if (hovered) return 'hover';
            return 'dormant';
        }
        return 'preview_static';
    }

    getHiddenMemoryMushroomNodeMode(node, puzzleState = this.getCurrentHiddenPuzzleState()) {
        if (!node) return null;
        const progress = this.getCurrentHiddenProgress();
        if (progress?.completed) return 'active';
        const litNodeIds = Array.isArray(puzzleState.litNodeIds) ? puzzleState.litNodeIds : [];
        return litNodeIds.includes(node.id) ? 'active' : 'dormant';
    }

    getHiddenPlacedDecorMode(node, puzzleState = this.getCurrentHiddenPuzzleState()) {
        if (!this.isHiddenMushroomDecorItem(node)) return null;
        const progress = this.getCurrentHiddenProgress();
        if (node.kind === 'mushroom_band') {
            return progress?.completed ? 'active' : 'preview_static';
        }
        const floor = Math.max(1, Number(node.floor || this.floor || window.game?.currentFloor || 1));
        if (progress?.completed) return 'active';
        if (floor === 3 && Number.isFinite(node.linkedIndex)) {
            const sequence = Array.isArray(puzzleState.sequence) ? puzzleState.sequence : [];
            const entered = new Set(sequence.slice(0, Math.max(0, puzzleState.inputIndex || 0)));
            if (entered.has(node.linkedIndex)) return 'preview';
            if (puzzleState.stage === 'input' && puzzleState.hoveredIndex === node.linkedIndex) return 'hover';
            if (puzzleState.stage === 'input' && puzzleState.activePreviewIndex === node.linkedIndex && puzzleState.previewLit) return 'preview_static';
            return null;
        }
        if (floor === 4 && node.linkedId) {
            return puzzleState.litNodeIds?.includes(node.linkedId) ? 'active' : null;
        }
        if (floor === 5 && Number.isFinite(node.sealIndex)) {
            return puzzleState.blocked?.[node.sealIndex] ? 'active' : 'preview_static';
        }
        if (floor >= 1 && floor <= 6) return 'preview_static';
        return null;
    }

    getHiddenDecorMushroomMode(node, puzzleState = this.getCurrentHiddenPuzzleState()) {
        if (!node) return null;
        const floor = Math.max(1, Number(node.floor || this.floor || window.game?.currentFloor || 1));
        const progress = this.getCurrentHiddenProgress();
        if (progress?.completed) return 'active';
        if (floor === 2 || floor === 6) return 'preview_static';
        if (floor === 3) {
            const sequence = Array.isArray(puzzleState.sequence) ? puzzleState.sequence : [];
            const entered = new Set(sequence.slice(0, Math.max(0, puzzleState.inputIndex || 0)));
            if (Number.isFinite(node.linkedIndex) && entered.has(node.linkedIndex)) return 'preview';
            if (Number.isFinite(node.linkedIndex) && puzzleState.stage === 'input' && puzzleState.hoveredIndex === node.linkedIndex) return 'hover';
            if (Number.isFinite(node.linkedIndex) && puzzleState.stage === 'input' && puzzleState.activePreviewIndex === node.linkedIndex && puzzleState.previewLit) return 'preview_static';
            return null;
        }
        if (floor === 4) {
            if (node.linkedId && puzzleState.litNodeIds?.includes(node.linkedId)) return 'active';
            return null;
        }
        if (floor === 5) {
            if (Number.isFinite(node.sealIndex) && puzzleState.blocked?.[node.sealIndex]) return 'active';
            return 'preview_static';
        }
        return 'preview_static';
    }

    getHiddenMushroomLightState(node, puzzleState = this.getCurrentHiddenPuzzleState()) {
        const mode = this.getHiddenMushroomNodeMode(node, puzzleState);
        if (!mode) return null;
        return this.createHiddenMushroomLight('hidden_mushroom', node, mode, {
            phase: (Number.isFinite(node.index) ? node.index : 0) * 0.41,
            yOffsetMul: 0.22
        });
    }

    getHiddenMemoryMushroomLightState(node, puzzleState = this.getCurrentHiddenPuzzleState()) {
        const mode = this.getHiddenMemoryMushroomNodeMode(node, puzzleState);
        if (!mode) return null;
        return this.createHiddenMushroomLight('hidden_memory_mushroom', node, mode, {
            phase: (Number.isFinite(node.index) ? node.index : 0) * 0.43,
            yOffsetMul: 0.22
        });
    }

    getHiddenPlacedDecorLightState(node, puzzleState = this.getCurrentHiddenPuzzleState()) {
        const mode = this.getHiddenPlacedDecorMode(node, puzzleState);
        if (!mode) return null;
        return this.createHiddenMushroomLight('hidden_placed_decor_mushroom', node, mode, {
            phase: (Number.isFinite(node.index) ? node.index : 0) * 0.39,
            yOffsetMul: 0.18,
            scaleMul: Number.isFinite(node.scaleMul) ? node.scaleMul : 1
        });
    }

    getHiddenDecorMushroomLightState(node, puzzleState = this.getCurrentHiddenPuzzleState()) {
        const mode = this.getHiddenDecorMushroomMode(node, puzzleState);
        if (!mode) return null;
        return this.createHiddenMushroomLight('hidden_decor_mushroom', node, mode, {
            phase: (Number.isFinite(node.index) ? node.index : 0) * 0.35,
            yOffsetMul: 0.18,
            scaleMul: Number.isFinite(node.scaleMul) ? node.scaleMul : 1
        });
    }

    getHiddenSealTargetLightState(target, puzzleState = this.getCurrentHiddenPuzzleState()) {
        if (!target) return null;
        const sealed = !!puzzleState.blocked?.[target.index];
        const phase = (Number.isFinite(target.index) ? target.index : 0) * 0.63;
        return this.createHiddenFeatureLight('hidden_seal_target', target.x, target.y, {
            radiusX: sealed ? 60 : 38,
            radiusY: sealed ? 46 : 30,
            bloomRadius: sealed ? 28 : 16,
            color: sealed ? { r: 166, g: 239, b: 210 } : { r: 132, g: 216, b: 238 },
            alpha: sealed ? 0.20 : 0.08,
            reveal: sealed ? 0.36 : 0.12,
            clarity: sealed ? 0.20 : 0.08,
            bloomAlpha: sealed ? 0.12 : 0.03,
            colorizeAlpha: sealed ? 0.09 : 0.03,
            haloAlpha: sealed ? 0.06 : 0.02,
            preserveSharpness: sealed ? 0.20 : 0.12,
            pulseSpeed: sealed ? 3.0 : 2.4,
            pulseAmount: sealed ? 0.04 : 0.02,
            phase,
            pinHidden: true
        });
    }

    getHiddenSealBlockerLightState(node, puzzleState = this.getCurrentHiddenPuzzleState()) {
        if (!node) return null;
        const blocker = Array.isArray(this.hiddenBlockers)
            ? (this.hiddenBlockers.find((item) => item && item.index === node.index) || node)
            : node;
        const sealed = !!blocker.sealed || !!puzzleState.blocked?.[node.index];
        if (!sealed) return null;
        const phase = (Number.isFinite(node.index) ? node.index : 0) * 0.59;
        return this.createHiddenFeatureLight('hidden_seal_blocker', blocker.x, blocker.y - 8, {
            radiusX: 62,
            radiusY: 48,
            bloomRadius: 30,
            color: blocker.glowColor || '#a6efd2',
            alpha: 0.22,
            reveal: 0.30,
            clarity: 0.18,
            bloomAlpha: 0.12,
            colorizeAlpha: 0.10,
            haloAlpha: 0.06,
            preserveSharpness: 0.22,
            pulseSpeed: 3.2,
            pulseAmount: 0.04,
            phase,
            pinHidden: true
        });
    }

    getHiddenSealAmbientLightState(puzzleState = this.getCurrentHiddenPuzzleState()) {
        const sealedCount = Array.isArray(puzzleState.blocked) ? puzzleState.blocked.filter(Boolean).length : 0;
        if (sealedCount <= 0) return null;
        return this.createHiddenFeatureLight('hidden_seal_room', this.centerX, this.centerY - 6, {
            radiusX: 92 + sealedCount * 24,
            radiusY: 64 + sealedCount * 18,
            bloomRadius: 22 + sealedCount * 8,
            color: { r: 166, g: 239, b: 210 },
            alpha: 0.03 + sealedCount * 0.02,
            reveal: 0.07 + sealedCount * 0.05,
            clarity: 0.03 + sealedCount * 0.02,
            bloomAlpha: 0.01 + sealedCount * 0.01,
            colorizeAlpha: 0.02 + sealedCount * 0.02,
            haloAlpha: 0.01 + sealedCount * 0.01,
            preserveSharpness: 0.12,
            pulseSpeed: 1.8,
            pulseAmount: 0.02
        });
    }

    getHiddenLegacyLightState(node, puzzleState = this.getCurrentHiddenPuzzleState()) {
        if (!node) return null;
        if (node.kind === 'legacy_lantern') {
            return this.createHiddenFeatureLight('legacy_lantern', node.x, node.y - 10, {
                radiusX: 102,
                radiusY: 82,
                bloomRadius: 54,
                color: node.glow || '#ffd59d',
                alpha: 0.40,
                reveal: 0.58,
                clarity: 0.32,
                bloomAlpha: 0.22,
                colorizeAlpha: 0.16,
                haloAlpha: 0.10,
                preserveSharpness: 0.32,
                pulseSpeed: 5.4,
                pulseAmount: 0.05
            });
        }
        if (node.kind === 'legacy_book') {
            return puzzleState.bookRead ? this.createHiddenFeatureLight('legacy_book', node.x, node.y - 6, {
                radiusX: 42,
                radiusY: 34,
                bloomRadius: 22,
                color: { r: 130, g: 196, b: 255 },
                alpha: 0.16,
                reveal: 0.22,
                clarity: 0.12,
                bloomAlpha: 0.06,
                colorizeAlpha: 0.06,
                haloAlpha: 0.04,
                preserveSharpness: 0.14
            }) : null;
        }
        if (node.kind === 'legacy_bread') {
            return puzzleState.breadTaken ? this.createHiddenFeatureLight('legacy_bread', node.x, node.y - 2, {
                radiusX: 40,
                radiusY: 32,
                bloomRadius: 20,
                color: { r: 255, g: 222, b: 146 },
                alpha: 0.14,
                reveal: 0.20,
                clarity: 0.11,
                bloomAlpha: 0.05,
                colorizeAlpha: 0.05,
                haloAlpha: 0.03,
                preserveSharpness: 0.12
            }) : null;
        }
        if (node.kind === 'legacy_bag') {
            return puzzleState.moneyTaken ? this.createHiddenFeatureLight('legacy_bag', node.x, node.y + 2, {
                radiusX: 40,
                radiusY: 32,
                bloomRadius: 20,
                color: { r: 166, g: 255, b: 216 },
                alpha: 0.14,
                reveal: 0.20,
                clarity: 0.11,
                bloomAlpha: 0.05,
                colorizeAlpha: 0.05,
                haloAlpha: 0.03,
                preserveSharpness: 0.12
            }) : null;
        }
        return null;
    }


    getHiddenFloor2CritterLightState(critter) {
        if (!critter || !critter.alive || critter.hiddenTime > 0 || !critter.red) return null;
        return this.createHiddenFeatureLight('floor2_worm_red', critter.x, critter.y + 4, {
            radiusX: 58,
            radiusY: 38,
            bloomRadius: 26,
            color: critter.hue || { r: 214, g: 102, b: 116 },
            alpha: 0.24,
            reveal: 0.40,
            clarity: 0.24,
            bloomAlpha: 0.12,
            colorizeAlpha: 0.10,
            haloAlpha: 0.06,
            preserveSharpness: 0.22,
            pulseSpeed: 0,
            pulseAmount: 0,
            pinHidden: true
        });
    }

    getPresentationLightSources(time = Date.now() / 1000) {
        const sources = [];
        sources.push(...this.getPresentationWormLightSources(time));
        const wallT = SURVIVOR_CONFIG.WALL_THICKNESS;
        const sideAnchors = {
            up: { x: this.centerX, y: wallT + 34 },
            down: { x: this.centerX, y: this.height - wallT - 34 },
            left: { x: wallT + 34, y: this.centerY },
            right: { x: this.width - wallT - 34, y: this.centerY }
        };

        if (Array.isArray(this.secretHints) && this.secretHints.length > 0) {
            this.secretHints.forEach((hint, index) => {
                if (hint.type !== 'candle') return;
                const anchor = sideAnchors[hint.side] || sideAnchors.right;
                const flicker = 0.65 + Math.sin(time * 6 + index) * 0.18;
                sources.push({
                    kind: 'candle',
                    x: anchor.x,
                    y: anchor.y - 10,
                    radiusX: 84,
                    radiusY: 68,
                    bloomRadius: 40,
                    color: { r: 255, g: 196, b: 108 },
                    alpha: 0.46 * flicker,
                    reveal: 0.58,
                    clarity: 0.26,
                    bloomAlpha: 0.11,
                    colorizeAlpha: 0.08,
                    haloAlpha: 0.05,
                    preserveSharpness: 0.16,
                    preferColor: true,
                    flicker
                });
            });
        }

        if (Array.isArray(this.hiddenLightSources) && this.hiddenLightSources.length > 0) {
            this.hiddenLightSources.forEach((light, index) => {
                if (!light) return;
                const pulse = light.pulse ? (1 + Math.sin(time * 3 + index * 0.6) * light.pulse) : 1;
                const hiddenScale = Math.max(0.5, Number.isFinite(light.hiddenScale) ? light.hiddenScale : 1);
                const baseAlpha = Math.max(0, light.alpha ?? 0.18) * Math.min(1.22, 0.96 + hiddenScale * 0.22);
                sources.push({
                    kind: light.kind || 'hidden_room',
                    x: Number.isFinite(light.x) ? light.x : this.centerX,
                    y: Number.isFinite(light.y) ? light.y : this.centerY,
                    radiusX: Math.max(10, (light.radiusX ?? light.radius ?? 58) * pulse * hiddenScale),
                    radiusY: Math.max(10, (light.radiusY ?? light.radius ?? 48) * pulse * hiddenScale),
                    bloomRadius: Math.max(6, (light.bloomRadius ?? (light.radius ?? 58) * 0.52) * pulse * hiddenScale),
                    color: light.color || { r: 180, g: 220, b: 255 },
                    alpha: baseAlpha,
                    reveal: Math.max(0.14, Math.min(1.10, light.reveal ?? (baseAlpha * 2.9))),
                    clarity: Math.max(0.12, Math.min(0.78, light.clarity ?? (baseAlpha * 1.8))),
                    bloomAlpha: Math.max(0.02, Math.min(0.22, light.bloomAlpha ?? (baseAlpha * 0.58))),
                    colorizeAlpha: Math.max(0.04, Math.min(0.20, light.colorizeAlpha ?? (baseAlpha * 0.42))),
                    haloAlpha: Math.max(0.02, Math.min(0.16, light.haloAlpha ?? (baseAlpha * 0.26))),
                    preserveSharpness: Math.max(0.14, light.preserveSharpness ?? 0.26),
                    preferColor: true,
                    flicker: 1
                });
            });
        }

        if (this.type === 'hidden' && Array.isArray(this.hiddenTemplateCells) && this.hiddenTemplateCells.length > 0) {
            this.hiddenTemplateCells.forEach((cell) => {
                const light = this.getHiddenTemplateCellLightState(cell);
                if (light) sources.push(light);
            });
        }

        if (this.type === 'hidden' && Array.isArray(this.hiddenDecorMushrooms) && this.hiddenDecorMushrooms.length > 0) {
            const state = this.getCurrentHiddenPuzzleState();
            this.hiddenDecorMushrooms.forEach((node) => {
                const light = this.getHiddenDecorMushroomLightState(node, state);
                if (light) sources.push(light);
            });
        }

        if (this.type === 'hidden' && Array.isArray(this.hiddenDecor) && this.hiddenDecor.length > 0) {
            const state = this.getCurrentHiddenPuzzleState();
            this.hiddenDecor.forEach((node) => {
                const light = this.getHiddenPlacedDecorLightState(node, state);
                if (light) sources.push(light);
            });
        }

        if (this.type === 'hidden' && Array.isArray(this.hiddenWormCritters) && this.hiddenWormCritters.length > 0) {
            this.hiddenWormCritters.forEach((critter) => {
                const light = this.getHiddenFloor2CritterLightState(critter);
                if (light) sources.push(light);
            });
        }

        if (this.type === 'hidden' && Array.isArray(this.hiddenPuzzleNodes) && this.hiddenPuzzleNodes.length > 0) {
            const state = this.getCurrentHiddenPuzzleState();
            this.hiddenPuzzleNodes.forEach((node) => {
                if (!node) return;
                if (node.kind === 'candle') {
                    const light = this.getHiddenCandleLightState(node, state);
                    if (light) sources.push(light);
                    return;
                }
                if (node.kind === 'mushroom') {
                    const light = this.getHiddenMushroomLightState(node, state);
                    if (light) sources.push(light);
                    return;
                }
                if (node.kind === 'memory_mushroom') {
                    const light = this.getHiddenMemoryMushroomLightState(node, state);
                    if (light) sources.push(light);
                    return;
                }
                if (node.kind === 'seal_target') {
                    const light = this.getHiddenSealTargetLightState(node, state);
                    if (light) sources.push(light);
                    return;
                }
                if (node.kind === 'seal_blocker') {
                    const light = this.getHiddenSealBlockerLightState(node, state);
                    if (light) sources.push(light);
                    return;
                }
                if (['legacy_lantern', 'legacy_book', 'legacy_bread', 'legacy_bag'].includes(node.kind)) {
                    const light = this.getHiddenLegacyLightState(node, state);
                    if (light) sources.push(light);
                }
            });
            if (Math.max(1, Number(this.floor || window.game?.currentFloor || 1)) === 5) {
                const ambient = this.getHiddenSealAmbientLightState(state);
                if (ambient) sources.push(ambient);
            }
        }

        if (this.type === 'hidden' && this.hiddenLegacyCandle) {
            const light = this.getHiddenCandleLightState({
                x: this.hiddenLegacyCandle.x,
                y: this.hiddenLegacyCandle.y,
                scale: 0.72,
                index: 0
            }, this.getCurrentHiddenPuzzleState(), {
                forceLit: true,
                kind: 'legacy_candle',
                profile: 'legacy'
            });
            if (light) sources.push(light);
        }

        if (this.type === 'hidden' && this.hiddenOrb) {
            const orbPulse = 1 + Math.sin(time * 2.6) * 0.05;
            const progress = this.getCurrentHiddenProgress();
            const ready = !!(this.hiddenPulse || this.hiddenOrbFlash || progress?.completed || progress?.phase === 'awakened' || progress?.phase === 'played' || progress?.witnessed);
            sources.push({
                kind: 'hidden_orb',
                x: this.hiddenOrb.x,
                y: this.hiddenOrb.y - 4,
                radiusX: (ready ? 74 : 52) * orbPulse,
                radiusY: (ready ? 58 : 40) * orbPulse,
                bloomRadius: (ready ? 38 : 20) * orbPulse,
                color: ready ? { r: 138, g: 198, b: 255 } : { r: 148, g: 216, b: 255 },
                alpha: ready ? 0.24 : 0.08,
                reveal: ready ? 0.42 : 0.16,
                clarity: ready ? 0.28 : 0.10,
                bloomAlpha: ready ? 0.15 : 0.05,
                colorizeAlpha: ready ? 0.10 : 0.03,
                haloAlpha: ready ? 0.08 : 0.02,
                preserveSharpness: ready ? 0.32 : 0.16,
                preferColor: true
            });
        }

        if (this.type === 'hidden' && this.hiddenDemoRabbit?.active) {
            sources.push({
                kind: 'rabbit_demo',
                x: this.hiddenDemoRabbit.x,
                y: this.hiddenDemoRabbit.y - 2,
                radiusX: 72,
                radiusY: 52,
                bloomRadius: 40,
                color: { r: 134, g: 220, b: 255 },
                alpha: 0.28,
                reveal: 0.38,
                clarity: 0.24,
                bloomAlpha: 0.18,
                colorizeAlpha: 0.12,
                haloAlpha: 0.07,
                preserveSharpness: 0.22,
                preferColor: true
            });
        }

        if (Array.isArray(this.environmentLights) && this.environmentLights.length > 0) {
            this.environmentLights.forEach((light, index) => {
                if (!light) return;
                const pulseSpeed = Number.isFinite(light.pulseSpeed) ? light.pulseSpeed : 0;
                const pulseAmount = Number.isFinite(light.pulseAmount) ? light.pulseAmount : 0;
                const pulse = pulseSpeed > 0 ? (1 + Math.sin(time * pulseSpeed + index) * pulseAmount) : 1;
                const color = light.color || { r: 255, g: 220, b: 160 };
                sources.push({
                    kind: light.kind || 'generic',
                    x: Number.isFinite(light.x) ? light.x : this.centerX,
                    y: Number.isFinite(light.y) ? light.y : this.centerY,
                    radiusX: Math.max(8, (light.radiusX ?? light.radius ?? 64) * pulse),
                    radiusY: Math.max(8, (light.radiusY ?? light.radius ?? 52) * pulse),
                    bloomRadius: Math.max(6, (light.bloomRadius ?? (light.radius ?? 64) * 0.45) * pulse),
                    color,
                    alpha: Math.max(0, light.alpha ?? light.intensity ?? 0.5),
                    reveal: Math.max(0.1, Math.min(1.25, light.reveal ?? 0.85)),
                    flicker: Math.max(0.35, pulse)
                });
            });
        }

        if (this.type === 'shop' && this.npc) {
            // 保持与商人紫蜡烛视觉一致：稳定的紫色焦点光源（基于 NPC center 的 world 坐标）
            const pulse = 1 + Math.sin(time * 2.4) * 0.035;
            sources.push({
                kind: 'shop_candle',
                x: this.npc.x,
                y: this.npc.y + 14,
                radiusX: 124 * pulse,
                radiusY: 96 * pulse,
                bloomRadius: 44 * pulse,
                color: { r: 168, g: 94, b: 236 },
                alpha: 0.56,
                reveal: 0.78,
                clarity: 1.00,
                pulseSpeed: 2.4,
                pulseAmount: 0.035,
                bloomAlpha: 0.18,
                haloAlpha: 0.12,
                haloRadiusMul: 1.26,
                colorizeAlpha: 0.38,
                colorizeRadiusMul: 1.24,
                preserveSharpness: 0.84,
                preferColor: true
            });
        }

        const pushTreasureChestLight = (chest, index = 0) => {
            if (!chest || chest.disabled || chest.opened) return;
            const quality = chest.quality || 'common';
            const isLegendary = quality === 'legendary';
            const isRare = quality === 'rare';
            sources.push({
                kind: 'treasure_chest',
                x: chest.x,
                y: chest.y + 10,
                radiusX: isLegendary ? 146 : (isRare ? 132 : 118),
                radiusY: isLegendary ? 108 : (isRare ? 96 : 84),
                bloomRadius: isLegendary ? 80 : (isRare ? 68 : 58),
                color: isLegendary ? { r: 255, g: 214, b: 96 } : (isRare ? { r: 178, g: 118, b: 255 } : { r: 248, g: 248, b: 242 }),
                alpha: isLegendary ? 0.78 : (isRare ? 0.66 : 0.56),
                reveal: isLegendary ? 1.04 : (isRare ? 0.90 : 0.82),
                clarity: isLegendary ? 1.12 : (isRare ? 1.04 : 0.98),
                pulseSpeed: 2.2 + index * 0.18,
                pulseAmount: isLegendary ? 0.09 : 0.07,
                bloomAlpha: isLegendary ? 0.38 : (isRare ? 0.30 : 0.22),
                haloAlpha: isLegendary ? 0.14 : (isRare ? 0.11 : 0.09),
                haloRadiusMul: isLegendary ? 1.38 : (isRare ? 1.28 : 1.20),
                colorizeAlpha: isLegendary ? 0.40 : (isRare ? 0.32 : 0.22),
                colorizeRadiusMul: isLegendary ? 1.24 : (isRare ? 1.18 : 1.12),
                preserveSharpness: isLegendary ? 1.06 : (isRare ? 0.96 : 0.88),
                preferColor: true
            });
        };

        if (this.type === 'treasure' && Array.isArray(this.chests) && this.chests.length > 0) {
            this.chests.forEach((chest, index) => pushTreasureChestLight(chest, index));
        } else if (this.type === 'treasure' && this.chest) {
            // 兼容旧存档/旧布局：单宝箱模式也保留等级光源
            pushTreasureChestLight(this.chest, 0);
        }

        return sources;
    }

    drawSecretHints(ctx, camera, time) {
        const wallT = SURVIVOR_CONFIG.WALL_THICKNESS;
        const sideAnchors = {
            up: { x: this.centerX, y: wallT + 34 },
            down: { x: this.centerX, y: this.height - wallT - 34 },
            left: { x: wallT + 34, y: this.centerY },
            right: { x: this.width - wallT - 34, y: this.centerY }
        };

        this.secretHints.forEach((hint, index) => {
            const anchor = sideAnchors[hint.side] || sideAnchors.right;
            const pos = camera.worldToScreen(anchor.x, anchor.y);
            if (hint.type === 'candle') {
                const flicker = 0.65 + Math.sin(time * 6 + index) * 0.18;
                ctx.fillStyle = '#d8c7a0';
                ctx.fillRect(pos.x - 3, pos.y - 4, 6, 14);
                ctx.fillStyle = `rgba(255, 215, 90, ${0.7 * flicker})`;
                ctx.beginPath();
                ctx.ellipse(pos.x, pos.y - 9, 4, 7, 0, 0, Math.PI * 2);
                ctx.fill();
            }
        });
    }
    drawLayer1FullSceneEnvelope(ctx, scene, time) {
        return window.RoomShellRuntimeMixin.drawLayer1FullSceneEnvelope.call(this, ctx, scene, time);
    }
    getShellAssetVersionTag() {
        return window.RoomShellRuntimeMixin.getShellAssetVersionTag.call(this);
    }
    getFloorAssetVersionTag() {
        return window.RoomShellRuntimeMixin.getFloorAssetVersionTag.call(this);
    }
    getLayer1ShellRuntimeBasePath() {
        return window.RoomShellRuntimeMixin.getLayer1ShellRuntimeBasePath.call(this);
    }
    getSceneShellAssetPaths() {
        return window.RoomShellRuntimeMixin.getSceneShellAssetPaths.call(this);
    }
    getSceneShellToneProfile() {
        return window.RoomShellRuntimeMixin.getSceneShellToneProfile.call(this);
    }
    getLayer1ShellRuntimeConfig() {
        return window.RoomShellRuntimeMixin.getLayer1ShellRuntimeConfig.call(this);
    }
    getLayer1ShellRuntimeImages() {
        return window.RoomShellRuntimeMixin.getLayer1ShellRuntimeImages.call(this);
    }
    getLayer1ShellDestRect(scene, layerKey) {
        return window.RoomShellRuntimeMixin.getLayer1ShellDestRect.call(this, scene, layerKey);
    }
    applyLayer1ShellRuntimeVars(mainLayout) {
        return window.RoomShellRuntimeMixin.applyLayer1ShellRuntimeVars.call(this, mainLayout);
    }
    logLayer1ShellDebug(mainLayout) {
        return window.RoomShellRuntimeMixin.logLayer1ShellDebug.call(this, mainLayout);
    }
    clearLayer1ShellRuntimeVars(mainLayout) {
        return window.RoomShellRuntimeMixin.clearLayer1ShellRuntimeVars.call(this, mainLayout);
    }

}



// ============================================================================

// 吸血鬼幸存者风格刷怪系统 v2.0

// ============================================================================


// Export to global
window.Room = Room;
