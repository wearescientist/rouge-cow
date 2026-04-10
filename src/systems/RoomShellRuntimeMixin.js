(function attachRoomShellRuntimeMixin(global) {
    'use strict';

    if (!global.Room) return;
    const Room = global.Room;
    const isLayer1ShellDebugEnabled = () =>
        global.DebugNamespaces?.isEnabled?.('layer1-shell') === true
        || global.game?.runtimeSettings?.enableLayer1ShellDebug === true;

    const methods = {

getLayer1FullSceneBackdropUrl() {
    return 'none';
},


syncStageShellBackdrop() {
    const mainLayout = document.getElementById('mainLayout');
    if (!mainLayout) return;

    const nextValue = this.getLayer1FullSceneBackdropUrl();
    if (Room._activeStageShellBackdrop !== nextValue) {
        mainLayout.style.setProperty('--stage-shell-bg', nextValue);
        Room._activeStageShellBackdrop = nextValue;
    }

    const shouldUseSceneShell = Number.isFinite(this.floor) && this.floor >= 1 && this.floor <= 7;
    if (shouldUseSceneShell) {
        mainLayout.dataset.sceneShell = 'layer1';
        this.applyLayer1ShellRuntimeVars(mainLayout);
        this.logLayer1ShellDebug(mainLayout);
        return;
    }

    delete mainLayout.dataset.sceneShell;
    this.clearLayer1ShellRuntimeVars(mainLayout);
},


getLayer1EnvelopeTextures() {
    if (this.floor !== 1) return null;

    if (!Room._layer1EnvelopeTextures) {
        const basePath = window.RuntimeAssetBase?.spriteBase || new URL('./assets/runtime/sprites/', document.baseURI || location.href).href;
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
            wallCoreBase: null,
            wallCoreTop: null,
            wallCoreBottom: null,
            wallBase: null,
            wallTop: null,
            wallBottom: null,
            wallGlowing: null,
            cornerInnerTl: null,
            cornerInnerTr: null,
            cornerInnerBl: null,
            cornerInnerBr: null,
            cornerTl: null,
            cornerTr: null,
            cornerBl: null,
            cornerBr: null,
            doorClosed: null,
            doorOpen: null
        };
    }

    return Room._layer1EnvelopeTextures;
},


isEnvelopeTextureReady(image) {
    return !!(image && image.complete && image.naturalWidth > 0);
},


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
},


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
},


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
},


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
},


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
},


getShellAssetVersionTag() {
    return "?v=v0.35.1_perf_phase12";
},


getFloorAssetVersionTag() {
    return "?v=v0.35.1_perf_phase12";
},


getLayer1ShellRuntimeBasePath() {
    return window.RuntimeAssetBase?.spriteBase || new URL('./assets/runtime/sprites/', document.baseURI || location.href).href;
},


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
        },
        7: {
            far: 'rooms/shells/floor7_shell_greenhouse_far7.png',
            mid: 'rooms/shells/floor7_shell_greenhouse_mid7.png',
            primary: 'rooms/shells/floor7_shell_greenhouse_primary7.png'
        }
    };
    return themed[floor] || themed[1];
},


getSceneShellToneProfile() {
    return {
        primary: { brightness: 0.9, contrast: 1 },
        mid: { brightness: 0.5, contrast: 1 },
        far: { brightness: 0.4, contrast: 1 }
    };
},


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
},


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
                if (isLayer1ShellDebugEnabled()) {
                    console.info('[Layer1ShellImageLoaded]', key, image.naturalWidth, image.naturalHeight, image.src);
                }
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
},


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

    let xPct = (layer.x / viewportW) * 100;
    let yPct = (layer.y / viewportH) * 100;
    let widthPct = (layer.width / viewportW) * 100;
    let heightPct = (layer.height / viewportH) * 100;

    const mobileLandscapeShellMode = typeof document !== 'undefined'
        && document.body?.classList?.contains('mobile-hud-mode')
        && window.innerWidth > window.innerHeight;
    if (mobileLandscapeShellMode) {
        const scale = 1.28;
        const nextWidth = widthPct * scale;
        const nextHeight = heightPct * scale;
        xPct -= (nextWidth - widthPct) * 0.5;
        yPct -= (nextHeight - heightPct) * 0.5;
        widthPct = nextWidth;
        heightPct = nextHeight;
    }

    return {
        x: xPct,
        y: yPct,
        width: widthPct,
        height: heightPct,
        offsetX,
        offsetY,
        rotation: layer.rotation,
        opacity: layer.opacity,
        brightness: layer.brightness,
        contrast: layer.contrast,
        imageUrl: `url("${this.getLayer1ShellRuntimeBasePath()}${layer.assetPath}${this.getShellAssetVersionTag()}")`
    };
},


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
},


logLayer1ShellDebug(mainLayout) {
    if (!isLayer1ShellDebugEnabled()) return;

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
},


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
    };

    global.RoomShellRuntimeMixin = methods;
    Object.assign(global.Room.prototype, methods);
})(window);
