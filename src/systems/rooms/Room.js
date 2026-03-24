class Room {

    getLayer1FullSceneBackdropUrl() {
        return 'none';
    }

    syncStageShellBackdrop() {
        const mainLayout = document.getElementById('mainLayout');
        if (!mainLayout) return;

        const nextValue = this.getLayer1FullSceneBackdropUrl();
        if (Room._activeStageShellBackdrop !== nextValue) {
            mainLayout.style.setProperty('--stage-shell-bg', nextValue);
            Room._activeStageShellBackdrop = nextValue;
        }

        const shouldUseSceneShell = Number.isFinite(this.floor) && this.floor >= 1 && this.floor <= 6;
        if (shouldUseSceneShell) {
            mainLayout.dataset.sceneShell = 'layer1';
            this.applyLayer1ShellRuntimeVars(mainLayout);
            this.logLayer1ShellDebug(mainLayout);
            return;
        }

        delete mainLayout.dataset.sceneShell;
        this.clearLayer1ShellRuntimeVars(mainLayout);
    }

    getLayer1EnvelopeTextures() {
        if (this.floor !== 1) return null;

        if (!Room._layer1EnvelopeTextures) {
            const isLocal = location.hostname === 'localhost' ||
                location.hostname === '127.0.0.1' ||
                location.protocol === 'file:';
            const basePath = isLocal
                ? './assets/runtime/sprites/'
                : 'https://wearescientist.github.io/rouge-cow/assets/runtime/sprites/';
            const createImage = (src) => {
                const image = new Image();
                image.decoding = 'async';
                image.src = src;
                return image;
            };

            Room._layer1EnvelopeTextures = {
                roomShellTrial: createImage(basePath + 'rooms/shells/floor1_shell_greenhouse_primary.png' + this.getShellAssetVersionTag()),
                floorBase: null,
                floorDetail: null,
                floorCrack: null,
                wallCoreBase: createImage(basePath + 'tiles/layer1/wall/layer1_wall_base.png'),
                wallCoreTop: createImage(basePath + 'tiles/layer1/wall/layer1_wall_top.png'),
                wallCoreBottom: createImage(basePath + 'tiles/layer1/wall/layer1_wall_bottom.png'),
                wallBase: createImage(basePath + 'tiles/layer1/set1/layer1_set1_wall_base.png'),
                wallTop: createImage(basePath + 'tiles/layer1/set2/layer1_set2_wall_top.png'),
                wallBottom: createImage(basePath + 'tiles/layer1/set2/layer1_set2_wall_bottom.png'),
                wallGlowing: createImage(basePath + 'tiles/layer1/set2/layer1_set2_wall_glowing.png'),
                cornerInnerTl: createImage(basePath + 'tiles/layer1/set1/layer1_set1_corner_inner_tl.png'),
                cornerInnerTr: createImage(basePath + 'tiles/layer1/set1/layer1_set1_corner_inner_tr.png'),
                cornerInnerBl: createImage(basePath + 'tiles/layer1/set1/layer1_set1_corner_inner_bl.png'),
                cornerInnerBr: createImage(basePath + 'tiles/layer1/set1/layer1_set1_corner_inner_br.png'),
                cornerTl: createImage(basePath + 'tiles/layer1/set1/layer1_set1_corner_tl.png'),
                cornerTr: createImage(basePath + 'tiles/layer1/set1/layer1_set1_corner_tr.png'),
                cornerBl: createImage(basePath + 'tiles/layer1/set1/layer1_set1_corner_bl.png'),
                cornerBr: createImage(basePath + 'tiles/layer1/set1/layer1_set1_corner_br.png'),
                doorClosed: createImage(basePath + 'tiles/layer1/door/layer1_door_normal_closed.png'),
                doorOpen: createImage(basePath + 'tiles/layer1/door/layer1_door_normal_open.png')
            };
        }

        return Room._layer1EnvelopeTextures;
    }

    isEnvelopeTextureReady(image) {
        return !!(image && image.complete && image.naturalWidth > 0);
    }

    drawTiledImageRect(ctx, image, x, y, width, height, options = {}) {
        if (!this.isEnvelopeTextureReady(image) || width <= 0 || height <= 0) return;

        const {
            alpha = 1,
            tileWidth = image.naturalWidth,
            tileHeight = image.naturalHeight,
            rotation = 0,
            mirrorX = false,
            mirrorY = false,
            compositeOperation = 'source-over'
        } = options;

        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.clip();
        ctx.globalAlpha = alpha;
        ctx.globalCompositeOperation = compositeOperation;

        const cols = Math.ceil(width / tileWidth) + 1;
        const rows = Math.ceil(height / tileHeight) + 1;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const destX = x + col * tileWidth;
                const destY = y + row * tileHeight;
                ctx.save();
                ctx.translate(destX + tileWidth / 2, destY + tileHeight / 2);
                if (rotation !== 0) ctx.rotate(rotation);
                ctx.scale(mirrorX ? -1 : 1, mirrorY ? -1 : 1);
                ctx.drawImage(image, -tileWidth / 2, -tileHeight / 2, tileWidth, tileHeight);
                ctx.restore();
            }
        }

        ctx.restore();
    }

    getDoorPositions() {
        const doorPositions = {};
        const wallT = SURVIVOR_CONFIG.WALL_THICKNESS;
        const doorSize = 220;
        const doorOffset = (doorSize - wallT) / 2;

        for (const [dir, door] of Object.entries(this.doors)) {
            if (!door) continue;

            let doorX;
            let doorY;
            let doorW;
            let doorH;
            let doorRotation;

            switch (dir) {
                case 'up':
                    doorX = this.centerX - doorSize / 2;
                    doorY = -doorOffset;
                    doorW = doorSize;
                    doorH = doorSize;
                    doorRotation = 0;
                    break;
                case 'down':
                    doorX = this.centerX - doorSize / 2;
                    doorY = this.height - wallT - doorOffset;
                    doorW = doorSize;
                    doorH = doorSize;
                    doorRotation = Math.PI;
                    break;
                case 'left':
                    doorX = -doorOffset;
                    doorY = this.centerY - doorSize / 2;
                    doorW = doorSize;
                    doorH = doorSize;
                    doorRotation = -Math.PI / 2;
                    break;
                case 'right':
                    doorX = this.width - wallT - doorOffset;
                    doorY = this.centerY - doorSize / 2;
                    doorW = doorSize;
                    doorH = doorSize;
                    doorRotation = Math.PI / 2;
                    break;
                default:
                    continue;
            }

            doorPositions[dir] = { x: doorX, y: doorY, w: doorW, h: doorH, rotation: doorRotation };
        }

        return doorPositions;
    }

    getDoorLightColor(door) {
        switch (door?.target?.type) {
            case 'start':
                return { r: 126, g: 214, b: 255 };
            case 'normal':
                return { r: 244, g: 238, b: 210 };
            case 'boss':
                return { r: 255, g: 82, b: 68 };
            case 'treasure':
                return { r: 255, g: 214, b: 92 };
            case 'shop':
                return { r: 205, g: 122, b: 255 };
            case 'elite':
                return { r: 108, g: 255, b: 132 };
            case 'hidden':
                return { r: 120, g: 236, b: 220 };
            default:
                return { r: 245, g: 245, b: 255 };
        }
    }

    drawDoorLightBeams(ctx, camera, doorPositions, viewLeft, viewTop, viewRight, viewBottom) {
        const time = Date.now() / 1000;

        for (const [dir, door] of Object.entries(this.doors)) {
            if (!door || !door.open) continue;
            if (door?.target?.type === 'hidden' && this.type !== 'hidden') continue;

            const pos = doorPositions[dir];
            if (!pos) continue;

            const color = this.getDoorLightColor(door);
            const config = {
                color,
                intensity: door?.target?.type === 'boss' ? 4.5 : 4,
                opacity: door?.target?.type === 'hidden' ? 0.82 : 0.9,
                length: door?.target?.type === 'boss' ? 114 : 100,
                spread: door?.target?.type === 'shop' ? 1.92 : 1.85,
                softness: 11,
                lip: 2
            };

            if (pos.x >= viewRight || pos.x + pos.w <= viewLeft || pos.y >= viewBottom || pos.y + pos.h <= viewTop) {
                continue;
            }

            const pulse = 0.94 + Math.sin(time * 2.2 + pos.x * 0.01 + pos.y * 0.01) * 0.06;
            const openingWidth = 200;
            const beamLength = config.length;
            const farWidth = openingWidth * config.spread;
            const lipThickness = 12;

            let originX = this.centerX;
            let originY = this.centerY;
            let angle = 0;

            switch (dir) {
                case 'up':
                    originY = SURVIVOR_CONFIG.floorTop;
                    angle = 0;
                    break;
                case 'down':
                    originY = SURVIVOR_CONFIG.floorBottom;
                    angle = Math.PI;
                    break;
                case 'left':
                    originX = SURVIVOR_CONFIG.floorLeft;
                    angle = -Math.PI / 2;
                    break;
                case 'right':
                    originX = SURVIVOR_CONFIG.floorRight;
                    angle = Math.PI / 2;
                    break;
            }

            const screenOrigin = camera.worldToScreen(originX, originY);
            const screenScale = Number.isFinite(screenOrigin?.scale) ? screenOrigin.scale : (camera.zoom || 1);
            const doorScreenStart = camera.worldToScreen(pos.x, pos.y);
            const doorScreenEnd = camera.worldToScreen(pos.x + pos.w, pos.y + pos.h);
            const sourceScreenW = Math.max(
                Math.abs(doorScreenEnd.x - doorScreenStart.x),
                Math.abs(doorScreenEnd.y - doorScreenStart.y),
                openingWidth * screenScale
            );
            const beamScreenH = beamLength * screenScale;
            const farScreenW = Math.max(sourceScreenW * config.spread, farWidth * screenScale);
            const lipScreenThickness = Math.max(2, lipThickness * screenScale);
            const blurPx = Math.max(0, config.softness * screenScale);
            const darkFloorFactor = this.floor >= 6 ? 0.68 : 0.82;
            const beamNear = Math.min(1, config.opacity * 0.16 * config.intensity * pulse * darkFloorFactor);
            const beamMid = Math.min(1, config.opacity * 0.085 * config.intensity * pulse * darkFloorFactor);
            const beamFar = Math.min(1, config.opacity * 0.022 * config.intensity * pulse * darkFloorFactor);
            const lipA = Math.min(1, config.opacity * 0.12 * config.lip * pulse * darkFloorFactor);
            const lipB = Math.min(1, config.opacity * 0.075 * config.lip * pulse * darkFloorFactor);
            const glowAlpha = Math.min(1, config.opacity * 0.05 * config.intensity * pulse * darkFloorFactor);

            ctx.save();
            ctx.translate(screenOrigin.x, screenOrigin.y);
            ctx.rotate(angle);
            ctx.globalCompositeOperation = 'screen';
            ctx.filter = `blur(${blurPx}px)`;

            const beamGradient = ctx.createLinearGradient(0, 0, 0, beamScreenH);
            beamGradient.addColorStop(0, `rgba(${config.color.r}, ${config.color.g}, ${config.color.b}, ${beamNear})`);
            beamGradient.addColorStop(0.42, `rgba(${config.color.r}, ${config.color.g}, ${config.color.b}, ${beamMid})`);
            beamGradient.addColorStop(0.78, `rgba(${config.color.r}, ${config.color.g}, ${config.color.b}, ${beamFar})`);
            beamGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = beamGradient;
            ctx.beginPath();
            ctx.moveTo(-sourceScreenW / 2, 0);
            ctx.lineTo(sourceScreenW / 2, 0);
            ctx.lineTo(farScreenW / 2, beamScreenH);
            ctx.lineTo(-farScreenW / 2, beamScreenH);
            ctx.closePath();
            ctx.fill();

            ctx.filter = 'none';
            ctx.shadowBlur = Math.max(8, blurPx * 1.6);
            ctx.shadowColor = `rgba(${config.color.r}, ${config.color.g}, ${config.color.b}, ${glowAlpha})`;

            const lipGradient = ctx.createLinearGradient(0, 0, 0, lipScreenThickness);
            lipGradient.addColorStop(0, `rgba(${Math.round(config.color.r * 0.38)}, ${Math.round(config.color.g * 0.34)}, ${Math.round(config.color.b * 0.3)}, ${lipA})`);
            lipGradient.addColorStop(0.45, `rgba(${Math.round(config.color.r * 0.72)}, ${Math.round(config.color.g * 0.66)}, ${Math.round(config.color.b * 0.58)}, ${lipB})`);
            lipGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
            ctx.fillStyle = lipGradient;
            ctx.fillRect(-sourceScreenW / 2, -lipScreenThickness * 0.2, sourceScreenW, lipScreenThickness);

            ctx.restore();
        }
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
        const wallT = SURVIVOR_CONFIG.WALL_THICKNESS;
        const roomTopLeft = camera.worldToScreen(0, 0);
        const roomBottomRight = camera.worldToScreen(this.width, this.height);
        const floorTopLeft = camera.worldToScreen(wallT, wallT);
        const floorBottomRight = camera.worldToScreen(this.width - wallT, this.height - wallT);
        const canvasW = ctx.canvas.width || 960;
        const canvasH = ctx.canvas.height || 960;

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

        const keys = Object.keys(ROOM_TEMPLATES);

        this.templateKey = templateKey || keys[Math.floor(Math.random() * keys.length)];

        this.template = ROOM_TEMPLATES[this.templateKey];
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
            const bossY = (floor === 6) ? this.centerY - 50 : this.centerY - 100;
            
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

        // 楼层到地板贴图的映射
        const FLOOR_SPRITE_MAP = [
            'layer1_floor_mycelium',    // 第1层 - 菌丝区
            'layer2_floor_greenhouse',  // 第2层 - 孵化温室
            'layer3_floor_nerve',       // 第3层 - 神经索
            'layer4_floor_furnace',     // 第4层 - 消化熔炉
            'layer5_floor_courtyard',   // 第5层 - 母虫庭院
            'layer6_floor_core'         // 第6层 - 千根之心
        ];
        
        const floorColors = { 
            start: '#1a1a2e', normal: '#16213e', boss: '#2d1b2e', 
            treasure: '#2d2d1b', shop: '#1b1b2d', hidden: '#2d1b2d'
        };
        
        // 计算视野范围（世界坐标）
        const viewLeft = camera.x - camera.viewWidth / 2;
        const viewTop = camera.y - camera.viewHeight / 2;
        const viewRight = viewLeft + camera.viewWidth;
        const viewBottom = viewTop + camera.viewHeight;

        if (this.floor === 1) {
            this.drawLayer1UnifiedRoom(ctx, camera, sprites, viewLeft, viewTop, viewRight, viewBottom, Date.now() / 1000);
            return;
        }
        
        // 地板区域：墙内 1760x1760 的区域
        const floorLeft = SURVIVOR_CONFIG.WALL_THICKNESS;           // 120
        const floorTop = SURVIVOR_CONFIG.WALL_THICKNESS;            // 120
        const floorRight = this.width - SURVIVOR_CONFIG.WALL_THICKNESS;   // 1880
        const floorBottom = this.height - SURVIVOR_CONFIG.WALL_THICKNESS; // 1880
        
        // 地板使用贴图拉伸绘制（1024x1024贴图拉伸填充到1760x1760）
        const floorSpriteName = FLOOR_SPRITE_MAP[this.floor - 1] || 'layer1_floor_mycelium';
        const floorSprite = sprites ? sprites.get(floorSpriteName) : null;
        
        // 只绘制视野和地板区域的交集
        const clipLeft = Math.max(viewLeft, floorLeft);
        const clipTop = Math.max(viewTop, floorTop);
        const clipRight = Math.min(viewRight, floorRight);
        const clipBottom = Math.min(viewBottom, floorBottom);
        
        if (clipRight > clipLeft && clipBottom > clipTop) {
            if (floorSprite) {
                ctx.save();
                const floorTopLeft = camera.worldToScreen(clipLeft, clipTop);
                const floorBottomRight = camera.worldToScreen(clipRight, clipBottom);
                const width = floorBottomRight.x - floorTopLeft.x;
                const height = floorBottomRight.y - floorTopLeft.y;
                
                // 拉伸贴图填充地板区域（1760x1760）
                ctx.drawImage(floorSprite, floorTopLeft.x, floorTopLeft.y, width, height);
                ctx.restore();
            } else {
                // 回退到纯色
                ctx.fillStyle = floorColors[this.type] || '#16213e';
                const floorTopLeft = camera.worldToScreen(clipLeft, clipTop);
                const floorBottomRight = camera.worldToScreen(clipRight, clipBottom);
                ctx.fillRect(floorTopLeft.x, floorTopLeft.y, 
                    floorBottomRight.x - floorTopLeft.x, 
                    floorBottomRight.y - floorTopLeft.y);
            }
        }

        

        // 房间环境光效

        this.drawAmbientEffects(ctx, camera, sprites, viewLeft, viewTop, viewRight, viewBottom);

        

        // 绘制网格（装饰）

        ctx.strokeStyle = 'rgba(255,255,255,0.03)';

        ctx.lineWidth = 1;

        const gridStartX = Math.floor(viewLeft / 50) * 50;

        const gridStartY = Math.floor(viewTop / 50) * 50;

        for (let wx = gridStartX; wx < viewRight; wx += 50) {

            const top = camera.worldToScreen(wx, viewTop);

            const bottom = camera.worldToScreen(wx, viewBottom);

            ctx.beginPath(); ctx.moveTo(top.x, top.y); ctx.lineTo(bottom.x, bottom.y); ctx.stroke();

        }

        for (let wy = gridStartY; wy < viewBottom; wy += 50) {

            const left = camera.worldToScreen(viewLeft, wy);

            const right = camera.worldToScreen(viewRight, wy);

            ctx.beginPath(); ctx.moveTo(left.x, left.y); ctx.lineTo(right.x, right.y); ctx.stroke();

        }

        

        // 绘制房间边界（厚墙）- 使用贴图平铺+翻转实现4面墙
        const wallThickness = SURVIVOR_CONFIG.WALL_THICKNESS;
        const wallSpriteName = 'layer' + this.floor + '_wall';
        const wallSprite = sprites ? sprites.get(wallSpriteName) : null;
        
        if (wallSprite) {
            // 辅助函数：平铺绘制墙
            // flipX: 水平翻转, flipY: 垂直翻转
            const drawHorizontalWall = (worldX, worldY, worldW, worldH, flipY = false) => {
                const tl = camera.worldToScreen(worldX, worldY);
                const br = camera.worldToScreen(worldX + worldW, worldY + worldH);
                const screenX = tl.x, screenY = tl.y;
                const screenW = br.x - tl.x, screenH = br.y - tl.y;
                
                const tileWorldSize = 120;
                const tilesX = Math.ceil(worldW / tileWorldSize);
                const tileScreenSize = screenW / tilesX;
                
                for (let tx = 0; tx < tilesX; tx++) {
                    const destX = screenX + tx * tileScreenSize;
                    const drawSize = Math.min(tileScreenSize, screenX + screenW - destX);
                    if (drawSize <= 0) continue;
                    
                    ctx.save();
                    ctx.translate(destX + drawSize/2, screenY + screenH/2);
                    if (flipY) ctx.scale(1, -1); // 垂直翻转
                    ctx.drawImage(wallSprite, 0, 0, 64, 64, -drawSize/2, -drawSize/2, drawSize, drawSize);
                    ctx.restore();
                }
            };
            
            const drawVerticalWall = (worldX, worldY, worldW, worldH, flipX = false) => {
                const tl = camera.worldToScreen(worldX, worldY);
                const br = camera.worldToScreen(worldX + worldW, worldY + worldH);
                const screenX = tl.x, screenY = tl.y;
                const screenW = br.x - tl.x, screenH = br.y - tl.y;
                
                const tileWorldSize = 120;
                const tilesY = Math.ceil(worldH / tileWorldSize);
                const tileScreenSize = screenH / tilesY;
                
                for (let ty = 0; ty < tilesY; ty++) {
                    const destY = screenY + ty * tileScreenSize;
                    const drawSize = Math.min(tileScreenSize, screenY + screenH - destY);
                    if (drawSize <= 0) continue;
                    
                    ctx.save();
                    ctx.translate(screenX + screenW/2, destY + drawSize/2);
                    ctx.rotate(Math.PI / 2); // 顺时针90度
                    if (flipX) ctx.scale(1, -1); // 水平翻转（旋转后的Y对应原X）
                    ctx.drawImage(wallSprite, 0, 0, 64, 64, -drawSize/2, -drawSize/2, drawSize, drawSize);
                    ctx.restore();
                }
            };
            
            // 四面墙 - 整面绘制（门稍后覆盖）
            
            // 上墙 - 正常
            if (viewTop < wallThickness) {
                drawHorizontalWall(viewLeft, 0, viewRight - viewLeft, wallThickness, false);
            }
            
            // 下墙 - 垂直翻转
            if (viewBottom > this.height - wallThickness) {
                drawHorizontalWall(viewLeft, this.height - wallThickness, viewRight - viewLeft, wallThickness, true);
            }
            
            // 左墙 - 水平翻转（旋转后）
            if (viewLeft < wallThickness) {
                drawVerticalWall(0, viewTop, wallThickness, viewBottom - viewTop, true);
            }
            
            // 右墙 - 正常
            if (viewRight > this.width - wallThickness) {
                drawVerticalWall(this.width - wallThickness, viewTop, wallThickness, viewBottom - viewTop, false);
            }
            
            // 绘制四个墙角贴图（覆盖在墙上层，120x120）
            const corners = [
                { name: 'tl', x: 0, y: 0 },
                { name: 'tr', x: this.width - wallThickness, y: 0 },
                { name: 'bl', x: 0, y: this.height - wallThickness },
                { name: 'br', x: this.width - wallThickness, y: this.height - wallThickness }
            ];
            
            for (const corner of corners) {
                if (corner.x < viewRight && corner.x + wallThickness > viewLeft &&
                    corner.y < viewBottom && corner.y + wallThickness > viewTop) {
                    const cornerSpriteName = 'layer' + this.floor + '_corner_' + corner.name;
                    const cornerSprite = sprites ? sprites.get(cornerSpriteName) : null;
                    
                    const tl = camera.worldToScreen(corner.x, corner.y);
                    const br = camera.worldToScreen(corner.x + wallThickness, corner.y + wallThickness);
                    
                    if (cornerSprite) {
                        ctx.drawImage(cornerSprite, tl.x, tl.y, br.x - tl.x, br.y - tl.y);
                    }
                }
            }
        } else {
            // 回退到纯色
            ctx.fillStyle = '#0f0f1a';
            if (viewLeft < wallThickness) {
                const topLeft = camera.worldToScreen(0, viewTop);
                const bottomRight = camera.worldToScreen(wallThickness, viewBottom);
                ctx.fillRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
            }
            if (viewRight > this.width - wallThickness) {
                const topLeft = camera.worldToScreen(this.width - wallThickness, viewTop);
                const bottomRight = camera.worldToScreen(this.width, viewBottom);
                ctx.fillRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
            }
            if (viewTop < wallThickness) {
                const topLeft = camera.worldToScreen(viewLeft, 0);
                const bottomRight = camera.worldToScreen(viewRight, wallThickness);
                ctx.fillRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
            }
            if (viewBottom > this.height - wallThickness) {
                const topLeft = camera.worldToScreen(viewLeft, this.height - wallThickness);
                const bottomRight = camera.worldToScreen(viewRight, this.height);
                ctx.fillRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
            }
        }

        

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
                    // 2-6层不再绘制门贴图/红绿门块，保留通行与光束即可
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

    

    drawAmbientEffects(ctx, camera, sprites, viewLeft, viewTop, viewRight, viewBottom) {

        const center = camera.worldToScreen(this.centerX, this.centerY);

        const time = Date.now() / 1000;

        let grad, pulse, sparkle, hiddenPulse, x, y, pos, flicker;

        

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
                            const size = 32;
                            ctx.drawImage(chestSprite, pos.x - size, pos.y - size, size * 2, size * 2);
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
                        const size = 32;
                        ctx.drawImage(chestSprite, pos.x - size, pos.y - size, size * 2, size * 2);
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

                // 普通房间 - 微弱环境光

                if (Math.random() < 0.02) {

                    // 偶尔闪烁的微光

                    x = viewLeft + Math.random() * (viewRight - viewLeft);

                    y = viewTop + Math.random() * (viewBottom - viewTop);

                    pos = camera.worldToScreen(x, y);

                    flicker = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 30);

                    flicker.addColorStop(0, 'rgba(100, 200, 255, 0.1)');

                    flicker.addColorStop(1, 'rgba(0, 0, 0, 0)');

                    ctx.fillStyle = flicker;

                    ctx.beginPath();

                    ctx.arc(pos.x, pos.y, 30, 0, Math.PI * 2);

                    ctx.fill();

                }

        }

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
            wormBrightness: Number.isFinite(tuning.wormBrightness) ? tuning.wormBrightness : 1
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
        return (this.ambientWorms || []).map((worm, index) => {
            const crawl = time * worm.speed + worm.seed;
            const headX = worm.baseX + Math.cos(crawl * 0.7 + index) * worm.drift * 0.65;
            const headY = worm.baseY + Math.sin(crawl * 0.95 + index * 0.43) * worm.drift * 0.42;
            const dir = worm.dir + Math.sin(crawl * 0.45) * 0.35;
            return {
                kind: 'ambient_worm',
                x: headX,
                y: headY,
                dir,
                len: worm.len,
                thickness: worm.thickness,
                wiggle: worm.wiggle,
                phase: crawl,
                color: palette,
                lightAlpha: 0.06 * worm.glowScale,
                reveal: 0.18,
                clarity: 0.28,
                radiusX: 7 * worm.glowScale,
                radiusY: 5 * worm.glowScale,
                bloomRadius: 4 * worm.glowScale,
                noBloom: true,
                haloAlpha: 0,
                selfVisibleOnly: true
            };
        });
    }

    getSecretHintWormCritters(time = Date.now() / 1000) {
        if (!Array.isArray(this.secretHints) || this.secretHints.length === 0) return [];
        const wallT = SURVIVOR_CONFIG.WALL_THICKNESS;
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
                    critters.push({
                        kind: 'secret_worm',
                        x: p.x + perpX * bodyDrift,
                        y: p.y + perpY * bodyDrift,
                        dir: travelDir + Math.sin(time * 0.55 + wormSeed * 1.9) * 0.11,
                        len: 14 + ((groupIndex + wormIndex + hintIndex) % 3) * 2,
                        thickness: 1.8 + ((groupIndex + wormIndex) % 2) * 0.3,
                        wiggle: 1.8 + (wormIndex % 2) * 0.35,
                        phase: time * 1.8 + wormSeed * 3.1,
                        color: palette,
                        lightAlpha: 0.08 + prominence * 0.02,
                        reveal: 0.16 + prominence * 0.04,
                        clarity: 0.22 + prominence * 0.05,
                        radiusX: 6 + prominence * 2,
                        radiusY: 4 + prominence * 1.5,
                        bloomRadius: 4 + prominence * 1.2,
                        noBloom: true,
                        haloAlpha: 0,
                        selfVisibleOnly: true
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

        const glowPts = this.getWormLightAnchors(worm, 5).map((p) => camera.worldToScreen(p.x, p.y));
        if (renderMode === 'mask') {
            ctx.strokeStyle = 'rgba(255,255,255,0.24)';
            ctx.lineWidth = Math.max(1.0, thickness * 0.52);
            ctx.beginPath();
            ctx.moveTo(glowPts[0].x, glowPts[0].y);
            for (let i = 1; i < glowPts.length; i++) ctx.lineTo(glowPts[i].x, glowPts[i].y);
            ctx.stroke();
            ctx.restore();
            return;
        }

        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.shadowBlur = 7 * glowScale * glowRadiusMul;
        ctx.shadowColor = `rgba(${glow.r}, ${glow.g}, ${glow.b}, ${0.12 * glowAlphaMul})`;
        ctx.strokeStyle = `rgba(${glow.r}, ${glow.g}, ${glow.b}, ${0.12 * glowAlphaMul})`;
        ctx.lineWidth = Math.max(1.4, thickness * 0.82);
        ctx.beginPath();
        ctx.moveTo(glowPts[0].x, glowPts[0].y);
        for (let i = 1; i < glowPts.length; i++) ctx.lineTo(glowPts[i].x, glowPts[i].y);
        ctx.stroke();
        glowPts.forEach((p, i) => {
            const alpha = (i === 0 ? 0.14 : 0.07) * glowAlphaMul;
            ctx.fillStyle = `rgba(${glow.r}, ${glow.g}, ${glow.b}, ${alpha})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, Math.max(2.2, thickness * (i === 0 ? 0.98 : 0.68)) * glowRadiusMul, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = typeof color.body === 'string' && color.body.startsWith('#')
            ? `${color.body}b8`
            : color.body;
        ctx.lineWidth = Math.max(1.1, thickness * 0.88);
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.fillStyle = typeof color.core === 'string' && color.core.startsWith('#')
            ? `${color.core}aa`
            : color.core;
        ctx.beginPath();
        ctx.ellipse(pts[0].x, pts[0].y, Math.max(1.2, thickness * 0.44), Math.max(0.92, thickness * 0.28), dir, 0, Math.PI * 2);
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

    getPresentationLightSources(time = Date.now() / 1000) {
        const sources = [];
        const wallT = SURVIVOR_CONFIG.WALL_THICKNESS;
        const sideAnchors = {
            up: { x: this.centerX, y: wallT + 34 },
            down: { x: this.centerX, y: this.height - wallT - 34 },
            left: { x: wallT + 34, y: this.centerY },
            right: { x: this.width - wallT - 34, y: this.centerY }
        };

        if (Array.isArray(this.secretHints) && this.secretHints.length > 0) {
            this.secretHints.forEach((hint, index) => {
                if (hint.type === 'candle') {
                    const anchor = sideAnchors[hint.side] || sideAnchors.right;
                    const flicker = 0.65 + Math.sin(time * 6 + index) * 0.18;
                    sources.push({
                        kind: 'candle',
                        x: anchor.x,
                        y: anchor.y - 10,
                        radiusX: 68,
                        radiusY: 56,
                        bloomRadius: 34,
                        color: { r: 255, g: 218, b: 120 },
                        alpha: 0.38 * flicker,
                        reveal: 0.5,
                        clarity: 0.22,
                        bloomAlpha: 0.07,
                        preferColor: true,
                        flicker
                    });
                }
            });
        }

        if (Array.isArray(this.hiddenLightSources) && this.hiddenLightSources.length > 0) {
            this.hiddenLightSources.forEach((light, index) => {
                if (!light) return;
                const pulse = light.pulse ? (1 + Math.sin(time * 3 + index * 0.6) * light.pulse) : 1;
                sources.push({
                    kind: light.kind || 'hidden_room',
                    x: Number.isFinite(light.x) ? light.x : this.centerX,
                    y: Number.isFinite(light.y) ? light.y : this.centerY,
                    radiusX: Math.max(10, (light.radiusX ?? light.radius ?? 58) * pulse),
                    radiusY: Math.max(10, (light.radiusY ?? light.radius ?? 48) * pulse),
                    bloomRadius: Math.max(6, (light.bloomRadius ?? (light.radius ?? 58) * 0.52) * pulse),
                    color: light.color || { r: 180, g: 220, b: 255 },
                    alpha: Math.max(0, light.alpha ?? 0.18),
                    reveal: Math.max(0.1, Math.min(0.86, light.reveal ?? 0.56)),
                    clarity: Math.max(0.08, Math.min(0.5, light.clarity ?? light.reveal ?? 0.22)),
                    bloomAlpha: Math.max(0.01, Math.min(0.12, light.bloomAlpha ?? (light.alpha ?? 0.18) * 0.32)),
                    preferColor: true,
                    flicker: 1
                });
            });
        }

        if (this.type === 'hidden' && Array.isArray(this.hiddenPuzzleNodes) && this.hiddenPuzzleNodes.length > 0) {
            const state = this.hiddenPuzzleState || {};
            this.hiddenPuzzleNodes.forEach((node) => {
                if (!node) return;
                if (node.kind === 'candle') {
                    const lit = !!state.candleStates?.[node.index];
                    sources.push({
                        kind: 'hidden_candle',
                        x: node.x,
                        y: node.y - 18,
                        radiusX: lit ? 64 : 28,
                        radiusY: lit ? 50 : 22,
                        bloomRadius: lit ? 34 : 16,
                        color: { r: 255, g: 210, b: 138 },
                        alpha: lit ? 0.26 : 0.05,
                        reveal: lit ? 0.52 : 0.16,
                        clarity: lit ? 0.24 : 0.08,
                        bloomAlpha: lit ? 0.08 : 0.02,
                        preferColor: true,
                        pulseSpeed: lit ? 6 : 0,
                        pulseAmount: lit ? 0.06 : 0,
                        flicker: 1
                    });
                    return;
                }
                if (node.kind === 'mushroom') {
                    const activePreview = state.stage === 'preview' && state.previewLit && state.activePreviewIndex === node.index;
                    const inputLit = state.stage === 'input' && node.index < state.inputIndex;
                    const hovered = state.stage === 'input' && state.hoveredIndex === node.index;
                    const hot = activePreview || inputLit || hovered;
                    sources.push({
                        kind: 'hidden_mushroom',
                        x: node.x,
                        y: node.y - 6,
                        radiusX: hot ? 70 : 42,
                        radiusY: hot ? 54 : 34,
                        bloomRadius: hot ? 36 : 22,
                        color: { r: 184, g: 147, b: 255 },
                        alpha: hot ? 0.18 : 0.08,
                        reveal: hot ? 0.42 : 0.2,
                        clarity: hot ? 0.2 : 0.1,
                        bloomAlpha: hot ? 0.07 : 0.03,
                        preferColor: true,
                        pulseSpeed: hot ? 7 : 2.5,
                        pulseAmount: hot ? 0.08 : 0.03
                    });
                    return;
                }
                if (node.kind === 'memory_mushroom') {
                    const lit = !!state.litNodeIds?.includes(node.id);
                    const active = state.phase === 'search' && state.activeVariant === node.variant && !lit;
                    sources.push({
                        kind: 'hidden_memory',
                        x: node.x,
                        y: node.y - 8,
                        radiusX: lit ? 72 : (active ? 60 : 40),
                        radiusY: lit ? 54 : (active ? 46 : 30),
                        bloomRadius: lit ? 38 : (active ? 30 : 18),
                        color: { r: 142, g: 216, b: 255 },
                        alpha: lit ? 0.2 : (active ? 0.14 : 0.05),
                        reveal: lit ? 0.46 : (active ? 0.34 : 0.14),
                        clarity: lit ? 0.22 : (active ? 0.16 : 0.08),
                        bloomAlpha: lit ? 0.08 : (active ? 0.05 : 0.02),
                        preferColor: true,
                        pulseSpeed: active || lit ? 4.8 : 0,
                        pulseAmount: active || lit ? 0.06 : 0
                    });
                    return;
                }
                if (node.kind === 'legacy_book') {
                    sources.push({
                        kind: 'legacy_book',
                        x: node.x,
                        y: node.y - 6,
                        radiusX: 34,
                        radiusY: 28,
                        bloomRadius: 18,
                        color: { r: 130, g: 196, b: 255 },
                        alpha: 0.12,
                        reveal: 0.16,
                        clarity: 0.08,
                        bloomAlpha: 0.03,
                        preferColor: true
                    });
                    return;
                }
                if (node.kind === 'legacy_bread') {
                    sources.push({
                        kind: 'legacy_bread',
                        x: node.x,
                        y: node.y - 2,
                        radiusX: 36,
                        radiusY: 28,
                        bloomRadius: 18,
                        color: { r: 255, g: 222, b: 146 },
                        alpha: 0.1,
                        reveal: 0.14,
                        clarity: 0.08,
                        bloomAlpha: 0.03,
                        preferColor: true
                    });
                    return;
                }
                if (node.kind === 'legacy_bag') {
                    sources.push({
                        kind: 'legacy_bag',
                        x: node.x,
                        y: node.y + 2,
                        radiusX: 34,
                        radiusY: 28,
                        bloomRadius: 16,
                        color: { r: 166, g: 255, b: 216 },
                        alpha: 0.1,
                        reveal: 0.14,
                        clarity: 0.08,
                        bloomAlpha: 0.03,
                        preferColor: true
                    });
                }
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

        if (this.type === 'treasure' && Array.isArray(this.chests) && this.chests.length > 0) {
            this.chests.forEach((chest, index) => {
                if (!chest || chest.disabled) return;
                const quality = chest.quality || 'normal';
                const isLegendary = quality === 'legendary';
                const isRare = quality === 'rare';
                sources.push({
                    kind: 'treasure_chest',
                    x: chest.x,
                    y: chest.y + 10,
                    radiusX: isLegendary ? 132 : (isRare ? 120 : 108),
                    radiusY: isLegendary ? 98 : (isRare ? 88 : 78),
                    bloomRadius: isLegendary ? 72 : (isRare ? 62 : 54),
                    color: isLegendary ? { r: 255, g: 214, b: 96 } : (isRare ? { r: 178, g: 118, b: 255 } : { r: 248, g: 248, b: 242 }),
                    alpha: isLegendary ? 0.64 : (isRare ? 0.54 : 0.46),
                    reveal: isLegendary ? 0.96 : (isRare ? 0.84 : 0.78),
                    clarity: isLegendary ? 1.08 : (isRare ? 1.02 : 0.98),
                    pulseSpeed: 2.2 + index * 0.18,
                    pulseAmount: isLegendary ? 0.08 : 0.06,
                    bloomAlpha: isLegendary ? 0.26 : (isRare ? 0.22 : 0.18),
                    haloAlpha: isLegendary ? 0.12 : (isRare ? 0.1 : 0.08),
                    haloRadiusMul: isLegendary ? 1.36 : (isRare ? 1.26 : 1.18),
                    colorizeAlpha: isLegendary ? 0.28 : (isRare ? 0.24 : 0.18),
                    colorizeRadiusMul: isLegendary ? 1.22 : (isRare ? 1.16 : 1.12),
                    preserveSharpness: isLegendary ? 1.02 : (isRare ? 0.94 : 0.88),
                    preferColor: true
                });
            });
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
        const width = scene.canvasW;
        const height = scene.canvasH;
        const center = scene.center;
        const roomRect = scene.roomRect;
        const floorRect = scene.floorRect;
        const shell = {
            left: Math.max(12, floorRect.left - roomRect.left),
            right: Math.max(12, roomRect.right - floorRect.right),
            top: Math.max(12, floorRect.top - roomRect.top),
            bottom: Math.max(12, roomRect.bottom - floorRect.bottom)
        };
        const lipSize = Math.max(shell.left, shell.top) * 1.7;
        const roomSeed = ((this.gx + 11) * 31 + (this.gy + 7) * 17 + this.floor * 13) & 0xffff;
        const textures = this.getLayer1EnvelopeTextures();
        const fillBandShape = (points, fillStyle, blur = 0, alpha = 1) => {
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
        const drawTexturedShape = (points, image, dest, options = {}) => {
            if (!this.isEnvelopeTextureReady(image)) return;

            const {
                alpha = 1,
                blur = 0,
                mirrorX = false,
                mirrorY = false
            } = options;

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.closePath();
            ctx.clip();
            if (blur > 0) ctx.filter = `blur(${blur}px)`;
            ctx.globalAlpha = alpha;
            ctx.translate(dest.x + (mirrorX ? dest.w : 0), dest.y + (mirrorY ? dest.h : 0));
            ctx.scale(mirrorX ? -1 : 1, mirrorY ? -1 : 1);
            ctx.drawImage(image, 0, 0, dest.w, dest.h);
            ctx.restore();
        };
        const drawStamp = (image, x, y, w, h, options = {}) => {
            if (!this.isEnvelopeTextureReady(image)) return;

            const {
                alpha = 1,
                blur = 0,
                mirrorX = false,
                mirrorY = false
            } = options;

            ctx.save();
            if (blur > 0) ctx.filter = `blur(${blur}px)`;
            ctx.globalAlpha = alpha;
            ctx.translate(x + (mirrorX ? w : 0), y + (mirrorY ? h : 0));
            ctx.scale(mirrorX ? -1 : 1, mirrorY ? -1 : 1);
            ctx.drawImage(image, 0, 0, w, h);
            ctx.restore();
        };

        ctx.save();
        ctx.fillStyle = '#0b0c0e';
        ctx.fillRect(0, 0, width, height);

        if (this.isEnvelopeTextureReady(textures?.roomShellTrial)) {
            ctx.drawImage(
                textures.roomShellTrial,
                roomRect.left,
                roomRect.top,
                roomRect.width,
                roomRect.height
            );

            const shellShade = ctx.createLinearGradient(0, roomRect.top, 0, roomRect.bottom);
            shellShade.addColorStop(0, 'rgba(8, 10, 12, 0.14)');
            shellShade.addColorStop(0.45, 'rgba(0, 0, 0, 0)');
            shellShade.addColorStop(1, 'rgba(0, 0, 0, 0.22)');
            ctx.fillStyle = shellShade;
            ctx.fillRect(roomRect.left, roomRect.top, roomRect.width, roomRect.height);
            ctx.restore();
            return;
        }

        let grad = ctx.createRadialGradient(center.x, center.y, floorRect.width * 0.18, center.x, center.y, width * 0.58);
        grad.addColorStop(0, 'rgba(128, 136, 146, 0.12)');
        grad.addColorStop(0.48, 'rgba(54, 58, 63, 0.14)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.48)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        const topPoints = [
            { x: roomRect.left + width * 0.04, y: roomRect.top },
            { x: roomRect.left + width * 0.16, y: roomRect.top + shell.top * 0.28 },
            { x: floorRect.left + shell.left * 0.16, y: floorRect.top - shell.top * 0.48 },
            { x: center.x - floorRect.width * 0.18, y: floorRect.top - shell.top * 0.78 },
            { x: center.x, y: floorRect.top - shell.top * 0.42 },
            { x: center.x + floorRect.width * 0.18, y: floorRect.top - shell.top * 0.78 },
            { x: floorRect.right - shell.right * 0.16, y: floorRect.top - shell.top * 0.48 },
            { x: roomRect.right - width * 0.16, y: roomRect.top + shell.top * 0.28 },
            { x: roomRect.right - width * 0.04, y: roomRect.top }
        ];
        grad = ctx.createLinearGradient(0, roomRect.top, 0, floorRect.top);
        grad.addColorStop(0, 'rgba(7, 9, 12, 0.84)');
        grad.addColorStop(0.55, 'rgba(24, 26, 28, 0.48)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        fillBandShape(topPoints, grad, 8, 1);
        fillBandShape([
            { x: width * 0.16, y: height * 0.02 },
            { x: width * 0.28, y: height * 0.1 },
            { x: width * 0.42, y: height * 0.16 },
            { x: width * 0.5, y: height * 0.14 },
            { x: width * 0.58, y: height * 0.16 },
            { x: width * 0.72, y: height * 0.1 },
            { x: width * 0.84, y: height * 0.02 },
            { x: width * 0.84, y: 0 },
            { x: width * 0.16, y: 0 }
        ], 'rgba(220, 226, 232, 0.035)', 12, 1);

        drawTexturedShape(topPoints, textures?.wallCoreTop || textures?.wallTop, {
            x: floorRect.left - shell.left * 0.42,
            y: roomRect.top,
            w: floorRect.width + (shell.left + shell.right) * 0.84,
            h: Math.max(shell.top * 2.1, lipSize)
        }, { alpha: 0.32, blur: 1.6 });

        const leftPoints = [
            { x: roomRect.left, y: roomRect.top + shell.top * 0.16 },
            { x: floorRect.left - shell.left * 0.05, y: floorRect.top - shell.top * 0.08 },
            { x: floorRect.left - shell.left * 0.32, y: center.y - floorRect.height * 0.24 },
            { x: floorRect.left - shell.left * 0.14, y: center.y },
            { x: floorRect.left - shell.left * 0.28, y: center.y + floorRect.height * 0.24 },
            { x: floorRect.left - shell.left * 0.04, y: floorRect.bottom + shell.bottom * 0.08 },
            { x: roomRect.left, y: roomRect.bottom - shell.bottom * 0.14 }
        ];
        grad = ctx.createLinearGradient(roomRect.left, 0, floorRect.left, 0);
        grad.addColorStop(0, 'rgba(4, 5, 7, 0.9)');
        grad.addColorStop(0.52, 'rgba(22, 24, 27, 0.44)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        fillBandShape(leftPoints, grad, 6, 1);
        drawTexturedShape(leftPoints, textures?.wallCoreBase || textures?.wallBase, {
            x: roomRect.left - shell.left * 0.1,
            y: floorRect.top - shell.top * 0.2,
            w: Math.max(shell.left * 1.55, lipSize * 0.82),
            h: floorRect.height + shell.top * 0.4 + shell.bottom * 0.4
        }, { alpha: 0.22, blur: 0.9 });

        const rightPoints = [
            { x: roomRect.right, y: roomRect.top + shell.top * 0.16 },
            { x: floorRect.right + shell.right * 0.05, y: floorRect.top - shell.top * 0.08 },
            { x: floorRect.right + shell.right * 0.32, y: center.y - floorRect.height * 0.24 },
            { x: floorRect.right + shell.right * 0.14, y: center.y },
            { x: floorRect.right + shell.right * 0.28, y: center.y + floorRect.height * 0.24 },
            { x: floorRect.right + shell.right * 0.04, y: floorRect.bottom + shell.bottom * 0.08 },
            { x: roomRect.right, y: roomRect.bottom - shell.bottom * 0.14 }
        ];
        grad = ctx.createLinearGradient(roomRect.right, 0, floorRect.right, 0);
        grad.addColorStop(0, 'rgba(4, 5, 7, 0.9)');
        grad.addColorStop(0.52, 'rgba(22, 24, 27, 0.44)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        fillBandShape(rightPoints, grad, 6, 1);
        drawTexturedShape(rightPoints, textures?.wallCoreBase || textures?.wallBase, {
            x: floorRect.right - Math.max(shell.right * 0.55, lipSize * 0.2),
            y: floorRect.top - shell.top * 0.2,
            w: Math.max(shell.right * 1.55, lipSize * 0.82),
            h: floorRect.height + shell.top * 0.4 + shell.bottom * 0.4
        }, { alpha: 0.22, blur: 0.9, mirrorX: true });

        const bottomPoints = [
            { x: roomRect.left + width * 0.05, y: roomRect.bottom },
            { x: roomRect.left + width * 0.14, y: roomRect.bottom - shell.bottom * 0.12 },
            { x: floorRect.left + floorRect.width * 0.08, y: floorRect.bottom - shell.bottom * 0.06 },
            { x: center.x - floorRect.width * 0.18, y: floorRect.bottom - shell.bottom * 0.34 },
            { x: center.x, y: floorRect.bottom - shell.bottom * 0.14 },
            { x: center.x + floorRect.width * 0.18, y: floorRect.bottom - shell.bottom * 0.34 },
            { x: floorRect.right - floorRect.width * 0.08, y: floorRect.bottom - shell.bottom * 0.06 },
            { x: roomRect.right - width * 0.14, y: roomRect.bottom - shell.bottom * 0.12 },
            { x: roomRect.right - width * 0.05, y: roomRect.bottom }
        ];
        grad = ctx.createLinearGradient(0, floorRect.bottom - shell.bottom * 0.4, 0, roomRect.bottom);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        grad.addColorStop(0.44, 'rgba(10, 11, 13, 0.22)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.82)');
        fillBandShape(bottomPoints, grad, 8, 1);
        drawTexturedShape(bottomPoints, textures?.wallCoreBottom || textures?.wallBottom, {
            x: floorRect.left - floorRect.width * 0.08,
            y: floorRect.bottom - shell.bottom * 0.36,
            w: floorRect.width * 1.16,
            h: Math.max(shell.bottom * 2.2, lipSize * 0.9)
        }, { alpha: 0.34, blur: 1.8 });

        drawStamp(textures?.cornerInnerTl, floorRect.left - lipSize * 0.76, floorRect.top - lipSize * 0.7, lipSize, lipSize, { alpha: 0.62, blur: 0.3 });
        drawStamp(textures?.cornerInnerTr, floorRect.right - lipSize * 0.24, floorRect.top - lipSize * 0.7, lipSize, lipSize, { alpha: 0.62, blur: 0.3 });
        drawStamp(textures?.cornerInnerBl, floorRect.left - lipSize * 0.76, floorRect.bottom - lipSize * 0.28, lipSize, lipSize, { alpha: 0.58, blur: 0.4 });
        drawStamp(textures?.cornerInnerBr, floorRect.right - lipSize * 0.24, floorRect.bottom - lipSize * 0.28, lipSize, lipSize, { alpha: 0.58, blur: 0.4 });

        if ((roomSeed & 1) === 0) {
            drawStamp(textures?.wallGlowing, roomRect.left + shell.left * 0.08, floorRect.top + floorRect.height * 0.1, shell.left * 0.9, floorRect.height * 0.24, { alpha: 0.16, blur: 1.1 });
        }
        if ((roomSeed & 2) === 0) {
            drawStamp(textures?.wallGlowing, roomRect.right - shell.right * 0.98, floorRect.top + floorRect.height * 0.62, shell.right * 0.9, floorRect.height * 0.2, { alpha: 0.16, blur: 1.1, mirrorX: true });
        }

        for (let i = 0; i < 7; i++) {
            const angle = time * (0.08 + i * 0.02) + roomSeed * 0.001 + i * 1.7;
            const px = width * (0.08 + (((roomSeed + i * 97) % 840) / 1000));
            const py = height * (0.08 + (((roomSeed + i * 53) % 760) / 1000)) + Math.sin(angle) * 12;
            const radius = 1.5 + (i % 3) * 0.7;
            const spore = ctx.createRadialGradient(px, py, 0, px, py, radius * 6);
            spore.addColorStop(0, 'rgba(231, 237, 245, 0.35)');
            spore.addColorStop(1, 'rgba(231, 237, 245, 0)');
            ctx.fillStyle = spore;
            ctx.beginPath();
            ctx.arc(px, py, radius * 6, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    getShellAssetVersionTag() {
        return "?v=v0.35.1_perf_phase12";
    }

    getFloorAssetVersionTag() {
        return "?v=v0.35.1_perf_phase12";
    }

    getLayer1ShellRuntimeBasePath() {
        const isLocal = location.hostname === 'localhost' ||
            location.hostname === '127.0.0.1' ||
            location.protocol === 'file:';
        return isLocal
            ? '/assets/runtime/sprites/'
            : 'https://wearescientist.github.io/rouge-cow/assets/runtime/sprites/';
    }

    getSceneShellAssetPaths() {
        const floor = Number.isFinite(this.floor) ? this.floor : 1;
        const themed = {
            1: {
                far: 'rooms/shells/floor1_shell_greenhouse_far.png',
                mid: 'rooms/shells/floor1_shell_greenhouse_mid.png',
                primary: 'rooms/shells/floor1_shell_greenhouse_primary.png'
            },
            2: {
                far: 'rooms/shells/floor2_shell_greenhouse_far.png',
                mid: 'rooms/shells/floor2_shell_greenhouse_mid.png',
                primary: 'rooms/shells/floor2_shell_greenhouse_primary.png'
            },
            3: {
                far: 'rooms/shells/floor3_shell_nerve_far.png',
                mid: 'rooms/shells/floor3_shell_nerve_mid.png',
                primary: 'rooms/shells/floor3_shell_nerve_primary.png'
            },
            4: {
                far: 'rooms/shells/floor4_shell_furnace_far.png',
                mid: 'rooms/shells/floor4_shell_furnace_mid.png',
                primary: 'rooms/shells/floor4_shell_furnace_primary.png'
            },
            5: {
                far: 'rooms/shells/floor5_shell_courtyard_far.png',
                mid: 'rooms/shells/floor5_shell_courtyard_mid.png',
                primary: 'rooms/shells/floor5_shell_courtyard_primary.png'
            },
            6: {
                far: 'rooms/shells/floor6_shell_core_far.png',
                mid: 'rooms/shells/floor6_shell_core_mid.png',
                primary: 'rooms/shells/floor6_shell_core_primary.png'
            }
        };
        return themed[floor] || themed[1];
    }

    getSceneShellToneProfile() {
        return {
            primary: { brightness: 0.9, contrast: 1 },
            mid: { brightness: 0.5, contrast: 1 },
            far: { brightness: 0.4, contrast: 1 }
        };
    }

    getLayer1ShellRuntimeConfig() {
        if (!Room._layer1ShellRuntimeConfigBase) {
            Room._layer1ShellRuntimeConfigBase = {
                viewport: { width: 1706, height: 960 },
                roomFrame: { x: 469.15, y: 96.15, size: 767.7 },
                layers: {
                    primary: {
                        assetPath: 'rooms/backdrops/back_organic_primary.png',
                        x: -849.5,
                        y: -1359,
                        width: 3405.3,
                        height: 3678.4,
                        rotation: 0,
                        parallax: 0.18,
                        opacity: 1,
                        brightness: 0.9,
                        contrast: 1
                    },
                    mid: {
                        assetPath: 'rooms/backdrops/back_organic_mid.png',
                        x: -547.8,
                        y: -1103.3,
                        width: 2773,
                        height: 3192.9,
                        rotation: -176,
                        parallax: 0.18,
                        opacity: 1,
                        brightness: 0.5,
                        contrast: 1
                    },
                    far: {
                        assetPath: 'rooms/backdrops/back_organic_far.png',
                        x: -228.2,
                        y: -843.3,
                        width: 2189.9,
                        height: 2621.3,
                        rotation: 1,
                        parallax: 0.18,
                        opacity: 1,
                        brightness: 0.4,
                        contrast: 1
                    }
                }
            };
        }
        const base = Room._layer1ShellRuntimeConfigBase;
        const assetPaths = this.getSceneShellAssetPaths();
        const tones = this.getSceneShellToneProfile();
        return {
            viewport: { ...base.viewport },
            roomFrame: { ...base.roomFrame },
            layers: {
                primary: { ...base.layers.primary, assetPath: assetPaths.primary, ...tones.primary },
                mid: { ...base.layers.mid, assetPath: assetPaths.mid, ...tones.mid },
                far: { ...base.layers.far, assetPath: assetPaths.far, ...tones.far }
            }
        };
    }

    getLayer1ShellRuntimeImages() {
        if (!Room._layer1ShellRuntimeImages) {
            Room._layer1ShellRuntimeImages = {};
        }
        const basePath = this.getLayer1ShellRuntimeBasePath();
        const config = this.getLayer1ShellRuntimeConfig();
        const images = {};
        Object.entries(config.layers).forEach(([key, layer]) => {
            const src = basePath + layer.assetPath + this.getShellAssetVersionTag();
            if (!Room._layer1ShellRuntimeImages[src]) {
                const image = new Image();
                image.decoding = 'async';
                image.onload = () => {
                    console.info('[Layer1ShellImageLoaded]', key, image.naturalWidth, image.naturalHeight, image.src);
                };
                image.onerror = () => {
                    console.error('[Layer1ShellImageError]', key, image.src);
                };
                image.src = src;
                Room._layer1ShellRuntimeImages[src] = image;
            }
            images[key] = Room._layer1ShellRuntimeImages[src];
        });
        return images;
    }

    getLayer1ShellDestRect(scene, layerKey) {
        const config = this.getLayer1ShellRuntimeConfig();
        const layer = config.layers[layerKey];
        if (!layer) return null;

        const roomCenterX = this.width * 0.5;
        const roomCenterY = this.height * 0.5;
        const viewportW = config.viewport.width;
        const viewportH = config.viewport.height;
        const playableHalfW = Math.max(this.width * 0.5 - SURVIVOR_CONFIG.WALL_THICKNESS, 1);
        const playableHalfH = Math.max(this.height * 0.5 - SURVIVOR_CONFIG.WALL_THICKNESS, 1);
        const anchorX = Number.isFinite(scene?.player?.x)
            ? scene.player.x
            : (Number.isFinite(scene?.camera?.x) ? scene.camera.x : roomCenterX);
        const anchorY = Number.isFinite(scene?.player?.y)
            ? scene.player.y
            : (Number.isFinite(scene?.camera?.y) ? scene.camera.y : roomCenterY);
        const nx = Math.max(-1, Math.min(1, (anchorX - roomCenterX) / playableHalfW));
        const ny = Math.max(-1, Math.min(1, (anchorY - roomCenterY) / playableHalfH));
        const roleMotion = { primary: 1.18, mid: 0.7, far: 0.34 };
        const parallaxScale = Math.max(0.35, (Number.isFinite(layer.parallax) ? layer.parallax : 0.18) / 0.18);
        const motionScale = (roleMotion[layerKey] || 0.5) * parallaxScale;
        const spareX = Math.max(0, (layer.width - viewportW) * 0.5);
        const spareY = Math.max(0, (layer.height - viewportH) * 0.5);
        const maxTravelX = Math.min(spareX * 0.24, viewportW * 0.14) * motionScale * 0.25;
        const maxTravelY = Math.min(spareY * 0.2, viewportH * 0.11) * motionScale * 0.25;
        const offsetX = -nx * maxTravelX;
        const offsetY = -ny * maxTravelY;

        return {
            x: (layer.x / viewportW) * 100,
            y: (layer.y / viewportH) * 100,
            width: (layer.width / viewportW) * 100,
            height: (layer.height / viewportH) * 100,
            offsetX,
            offsetY,
            rotation: layer.rotation,
            opacity: layer.opacity,
            brightness: layer.brightness,
            contrast: layer.contrast,
            imageUrl: `url("${this.getLayer1ShellRuntimeBasePath()}${layer.assetPath}${this.getShellAssetVersionTag()}")`
        };
    }

    applyLayer1ShellRuntimeVars(mainLayout) {
        const camera = window.game?.camera || null;
        const player = window.game?.player || null;
        const scene = (camera || player) ? { camera, player } : null;
        const far = this.getLayer1ShellDestRect(scene, 'far');
        const mid = this.getLayer1ShellDestRect(scene, 'mid');
        const primary = this.getLayer1ShellDestRect(scene, 'primary');
        const applyVars = (prefix, layer) => {
            mainLayout.style.setProperty(`--scene-shell-${prefix}-left`, `${layer.x}%`);
            mainLayout.style.setProperty(`--scene-shell-${prefix}-top`, `${layer.y}%`);
            mainLayout.style.setProperty(`--scene-shell-${prefix}-width`, `${layer.width}%`);
            mainLayout.style.setProperty(`--scene-shell-${prefix}-height`, `${layer.height}%`);
            mainLayout.style.setProperty(`--scene-shell-${prefix}-offset-x`, `${layer.offsetX}px`);
            mainLayout.style.setProperty(`--scene-shell-${prefix}-offset-y`, `${layer.offsetY}px`);
            mainLayout.style.setProperty(`--scene-shell-${prefix}-rotation`, `${layer.rotation}deg`);
            mainLayout.style.setProperty(`--scene-shell-${prefix}-opacity`, String(layer.opacity));
            mainLayout.style.setProperty(`--scene-shell-${prefix}-brightness`, String(layer.brightness));
            mainLayout.style.setProperty(`--scene-shell-${prefix}-contrast`, String(layer.contrast));
            mainLayout.style.setProperty(`--scene-shell-${prefix}-image`, layer.imageUrl);
        };

        applyVars('far', far);
        applyVars('mid', mid);
        applyVars('primary', primary);
    }

    logLayer1ShellDebug(mainLayout) {
        const debugKey = `${this.id}:${this.floor}`;
        if (Room._lastLayer1ShellDebugKey === debugKey) return;
        Room._lastLayer1ShellDebugKey = debugKey;

        const images = this.getLayer1ShellRuntimeImages();
        const computed = getComputedStyle(mainLayout);
        const backdrop = mainLayout.querySelector('.scene-shell-backdrop');
        const foreground = mainLayout.querySelector('.scene-shell-foreground');
        const farEl = mainLayout.querySelector('.scene-shell-runtime-far');
        const midEl = mainLayout.querySelector('.scene-shell-runtime-mid');
        const primaryEl = mainLayout.querySelector('.scene-shell-runtime-primary');
        const payload = {
            roomId: this.id,
            floor: this.floor,
            sceneShell: mainLayout.dataset.sceneShell || '(none)',
            shellVars: {
                far: {
                    left: computed.getPropertyValue('--scene-shell-far-left').trim(),
                    top: computed.getPropertyValue('--scene-shell-far-top').trim(),
                    width: computed.getPropertyValue('--scene-shell-far-width').trim(),
                    height: computed.getPropertyValue('--scene-shell-far-height').trim(),
                    image: computed.getPropertyValue('--scene-shell-far-image').trim()
                },
                mid: {
                    left: computed.getPropertyValue('--scene-shell-mid-left').trim(),
                    top: computed.getPropertyValue('--scene-shell-mid-top').trim(),
                    width: computed.getPropertyValue('--scene-shell-mid-width').trim(),
                    height: computed.getPropertyValue('--scene-shell-mid-height').trim(),
                    image: computed.getPropertyValue('--scene-shell-mid-image').trim()
                },
                primary: {
                    left: computed.getPropertyValue('--scene-shell-primary-left').trim(),
                    top: computed.getPropertyValue('--scene-shell-primary-top').trim(),
                    width: computed.getPropertyValue('--scene-shell-primary-width').trim(),
                    height: computed.getPropertyValue('--scene-shell-primary-height').trim(),
                    image: computed.getPropertyValue('--scene-shell-primary-image').trim()
                }
            },
            dom: {
                backdropDisplay: backdrop ? getComputedStyle(backdrop).display : '(missing)',
                foregroundDisplay: foreground ? getComputedStyle(foreground).display : '(missing)',
                farDisplay: farEl ? getComputedStyle(farEl).display : '(missing)',
                midDisplay: midEl ? getComputedStyle(midEl).display : '(missing)',
                primaryDisplay: primaryEl ? getComputedStyle(primaryEl).display : '(missing)'
            },
            rects: {
                centerGame: document.getElementById('centerGame')?.getBoundingClientRect?.() || null,
                backdrop: backdrop?.getBoundingClientRect?.() || null,
                foreground: foreground?.getBoundingClientRect?.() || null,
                far: farEl?.getBoundingClientRect?.() || null,
                mid: midEl?.getBoundingClientRect?.() || null,
                primary: primaryEl?.getBoundingClientRect?.() || null
            },
            imageState: {
                far: images.far ? { src: images.far.src, complete: images.far.complete, width: images.far.naturalWidth, height: images.far.naturalHeight } : null,
                mid: images.mid ? { src: images.mid.src, complete: images.mid.complete, width: images.mid.naturalWidth, height: images.mid.naturalHeight } : null,
                primary: images.primary ? { src: images.primary.src, complete: images.primary.complete, width: images.primary.naturalWidth, height: images.primary.naturalHeight } : null
            }
        };

        console.groupCollapsed('[Layer1ShellDebug]');
        console.log(payload);
        console.warn(
            '[Layer1ShellDebugSummary]',
            'sceneShell=', payload.sceneShell,
            'far=', payload.shellVars.far.left, payload.shellVars.far.top, payload.shellVars.far.width, payload.shellVars.far.height,
            'mid=', payload.shellVars.mid.left, payload.shellVars.mid.top, payload.shellVars.mid.width, payload.shellVars.mid.height,
            'primary=', payload.shellVars.primary.left, payload.shellVars.primary.top, payload.shellVars.primary.width, payload.shellVars.primary.height,
            'farLoaded=', payload.imageState.far?.complete, payload.imageState.far?.width, payload.imageState.far?.height,
            'midLoaded=', payload.imageState.mid?.complete, payload.imageState.mid?.width, payload.imageState.mid?.height,
            'primaryLoaded=', payload.imageState.primary?.complete, payload.imageState.primary?.width, payload.imageState.primary?.height
        );
        console.groupEnd();
        window.__layer1ShellDebug = payload;
    }

    clearLayer1ShellRuntimeVars(mainLayout) {
        [
            '--scene-shell-far-left',
            '--scene-shell-far-top',
            '--scene-shell-far-width',
            '--scene-shell-far-height',
            '--scene-shell-far-offset-x',
            '--scene-shell-far-offset-y',
            '--scene-shell-far-rotation',
            '--scene-shell-far-opacity',
            '--scene-shell-far-brightness',
            '--scene-shell-far-contrast',
            '--scene-shell-far-image',
            '--scene-shell-mid-left',
            '--scene-shell-mid-top',
            '--scene-shell-mid-width',
            '--scene-shell-mid-height',
            '--scene-shell-mid-offset-x',
            '--scene-shell-mid-offset-y',
            '--scene-shell-mid-rotation',
            '--scene-shell-mid-opacity',
            '--scene-shell-mid-brightness',
            '--scene-shell-mid-contrast',
            '--scene-shell-mid-image',
            '--scene-shell-primary-left',
            '--scene-shell-primary-top',
            '--scene-shell-primary-width',
            '--scene-shell-primary-height',
            '--scene-shell-primary-offset-x',
            '--scene-shell-primary-offset-y',
            '--scene-shell-primary-rotation',
            '--scene-shell-primary-opacity',
            '--scene-shell-primary-brightness',
            '--scene-shell-primary-contrast',
            '--scene-shell-primary-image'
        ].forEach((key) => mainLayout.style.removeProperty(key));
    }

}



// ============================================================================

// 吸血鬼幸存者风格刷怪系统 v2.0

// ============================================================================


// Export to global
window.Room = Room;
