/**
 * SimpleLighting.js - 简化版光照系统
 *
 * 当前工程实际只有少量软光源（默认主要是玩家光）。
 * 旧实现每帧新建全屏 canvas，再满分辨率重绘整层 multiply，固定成本过高。
 * 这里改成：
 * 1. 复用离屏 canvas；
 * 2. 低分辨率光照缓冲再放大；
 * 3. 仅在光源/玩家位置/缩放明显变化时刷新；
 * 4. 压力高时降低刷新频率。
 */

class SimpleLighting {
    constructor(game) {
        this.game = game;
        this.ctx = game.ctx;
        this.lights = [];
        this.normalMaps = new Map();
        this.enabled = true;
        this.ambientLight = 0.74;

        this.lightCanvas = document.createElement('canvas');
        this.lightCtx = this.lightCanvas.getContext('2d');
        this.cacheScale = 0.5;
        this.cacheValid = false;
        this.renderFrame = 0;
        this.lastWidth = 0;
        this.lastHeight = 0;
        this.lastZoom = NaN;
        this.lastLightKey = '';
        this.lastPlayerScreenX = NaN;
        this.lastPlayerScreenY = NaN;
        this.lastTier = 'full';
        this.qualityPreset = 'high';
    }

    getNormalMap(sprite) {
        const key = sprite.src || sprite;
        if (this.normalMaps.has(key)) {
            return this.normalMaps.get(key);
        }
        const normalMap = this.generateNormalMap(sprite);
        this.normalMaps.set(key, normalMap);
        return normalMap;
    }

    generateNormalMap(sprite) {
        const canvas = document.createElement('canvas');
        const w = sprite.width || 32;
        const h = sprite.height || 32;
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(sprite, 0, 0);
        const imageData = ctx.getImageData(0, 0, w, h);
        const pixels = imageData.data;
        const normalData = new Uint8ClampedArray(w * h * 4);

        for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                const idx = (y * w + x) * 4;
                const left = pixels[idx - 4 + 3];
                const right = pixels[idx + 4 + 3];
                const up = pixels[idx - w * 4 + 3];
                const down = pixels[idx + w * 4 + 3];
                const nx = (right - left) / 255;
                const ny = (down - up) / 255;
                const nz = 0.5;
                const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
                normalData[idx] = ((nx / len) * 0.5 + 0.5) * 255;
                normalData[idx + 1] = ((ny / len) * 0.5 + 0.5) * 255;
                normalData[idx + 2] = ((nz / len) * 0.5 + 0.5) * 255;
                normalData[idx + 3] = pixels[idx + 3];
            }
        }

        const output = document.createElement('canvas');
        output.width = w;
        output.height = h;
        output.getContext('2d').putImageData(new ImageData(normalData, w, h), 0, 0);
        return output;
    }

    addLight(x, y, config = {}) {
        this.lights.push({
            x, y,
            range: config.range || 100,
            intensity: config.intensity || 1.0,
            color: config.color || { r: 255, g: 220, b: 180 },
            flicker: config.flicker || false
        });
        this.cacheValid = false;
    }

    calculateLighting(x, y, normal) {
        let totalLight = this.ambientLight;
        for (const light of this.lights) {
            const dx = light.x - x;
            const dy = light.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > light.range) continue;
            const attenuation = 1 - (dist / light.range);
            const safeDist = Math.max(0.0001, dist);
            const lightDir = { x: dx / safeDist, y: dy / safeDist };
            const normalDot = Math.max(0, normal.x * lightDir.x + normal.y * lightDir.y);
            totalLight += light.intensity * attenuation * normalDot;
        }
        return Math.min(totalLight, 1.0);
    }

    getBudgetProfile() {
        const game = this.game;
        const budget = (typeof window !== 'undefined' && window.RenderBudgetManager)
            ? window.RenderBudgetManager.getBudget(game, game?.curRoom || null, game?.canvas)
            : null;
        const tier = budget?.tier || 'full';
        const preset = this.qualityPreset || 'high';
        const presetCacheScale = preset === 'low' ? 0.38 : (preset === 'medium' ? 0.46 : 0.56);
        const presetRedrawEvery = preset === 'low' ? 3 : (preset === 'medium' ? 2 : 1);
        return {
            tier,
            redrawEvery: Math.max(tier === 'low' ? 3 : (tier === 'medium' ? 2 : 1), presetRedrawEvery),
            cacheScale: Math.min(presetCacheScale, tier === 'low' ? 0.35 : (tier === 'medium' ? 0.42 : 0.5)),
            moveThreshold: preset === 'low' ? 12 : (preset === 'medium' ? 8 : 5)
        };
    }

    ensureBuffer(width, height, scale) {
        const nextW = Math.max(1, Math.ceil(width * scale));
        const nextH = Math.max(1, Math.ceil(height * scale));
        if (this.lightCanvas.width !== nextW || this.lightCanvas.height !== nextH) {
            this.lightCanvas.width = nextW;
            this.lightCanvas.height = nextH;
            this.cacheValid = false;
        }
    }

    buildLightKey() {
        if (!Array.isArray(this.lights) || this.lights.length === 0) return 'none';
        return this.lights.map((light) => [
            light.x?.toFixed?.(1) ?? light.x,
            light.y?.toFixed?.(1) ?? light.y,
            light.range,
            light.intensity,
            light.color?.r,
            light.color?.g,
            light.color?.b,
            light.flicker ? 1 : 0
        ].join(':')).join('|');
    }

    redrawLightBuffer(width, height, profile) {
        const scale = profile.cacheScale;
        this.ensureBuffer(width, height, scale);
        const lightCtx = this.lightCtx;
        const scaledW = this.lightCanvas.width;
        const scaledH = this.lightCanvas.height;
        const ambient = Math.floor(this.ambientLight * 255);

        lightCtx.setTransform(1, 0, 0, 1, 0, 0);
        lightCtx.clearRect(0, 0, scaledW, scaledH);
        lightCtx.globalCompositeOperation = 'source-over';
        lightCtx.fillStyle = `rgb(${ambient},${ambient},${ambient})`;
        lightCtx.fillRect(0, 0, scaledW, scaledH);
        lightCtx.globalCompositeOperation = 'lighter';

        const zoom = this.game?.camera?.zoom || 1;
        for (const light of this.lights) {
            const screenPos = this.game.camera.worldToScreen(light.x, light.y);
            const sx = screenPos.x * scale;
            const sy = screenPos.y * scale;
            const range = Math.max(8, light.range * zoom * scale);
            if (sx < -range || sx > scaledW + range || sy < -range || sy > scaledH + range) continue;

            const flicker = light.flicker ? (Math.random() * 0.08 - 0.04) : 0;
            const intensity = Math.max(0, light.intensity + flicker);
            const gradient = lightCtx.createRadialGradient(sx, sy, 0, sx, sy, range);
            gradient.addColorStop(0, `rgba(${light.color.r}, ${light.color.g}, ${light.color.b}, ${intensity})`);
            gradient.addColorStop(0.55, `rgba(${light.color.r}, ${light.color.g}, ${light.color.b}, ${intensity * 0.22})`);
            gradient.addColorStop(1, 'rgba(0,0,0,0)');

            lightCtx.fillStyle = gradient;
            lightCtx.beginPath();
            lightCtx.arc(sx, sy, range, 0, Math.PI * 2);
            lightCtx.fill();
        }

        this.cacheValid = true;
        this.lastWidth = width;
        this.lastHeight = height;
        this.lastZoom = zoom;
        this.lastLightKey = this.buildLightKey();
        this.lastTier = profile.tier;
        const playerLight = this.lights[0] || null;
        if (playerLight) {
            const playerPos = this.game.camera.worldToScreen(playerLight.x, playerLight.y);
            this.lastPlayerScreenX = playerPos.x;
            this.lastPlayerScreenY = playerPos.y;
        }
    }

    shouldRedraw(profile, width, height) {
        if (!this.cacheValid) return true;
        if (this.lastWidth !== width || this.lastHeight !== height) return true;
        const zoom = this.game?.camera?.zoom || 1;
        if (Math.abs(zoom - this.lastZoom) > 0.001) return true;
        if (this.lastTier !== profile.tier) return true;
        const lightKey = this.buildLightKey();
        if (lightKey !== this.lastLightKey) return true;
        if ((this.renderFrame % profile.redrawEvery) !== 0) return false;

        const playerLight = this.lights[0] || null;
        if (!playerLight) return true;
        const playerPos = this.game.camera.worldToScreen(playerLight.x, playerLight.y);
        const dx = playerPos.x - (this.lastPlayerScreenX || 0);
        const dy = playerPos.y - (this.lastPlayerScreenY || 0);
        return Math.hypot(dx, dy) >= profile.moveThreshold;
    }

    render() {
        if (!this.enabled || this.lights.length === 0) return;

        this.renderFrame = (this.renderFrame + 1) % 4096;
        const width = this.game.canvas.width || 960;
        const height = this.game.canvas.height || 540;
        const profile = this.getBudgetProfile();

        if (this.shouldRedraw(profile, width, height)) {
            this.redrawLightBuffer(width, height, profile);
        }

        this.ctx.save();
        this.ctx.globalCompositeOperation = 'multiply';
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.drawImage(this.lightCanvas, 0, 0, width, height);
        this.ctx.restore();
    }

    update(dt) {}

    clear() {
        this.lights = [];
        this.cacheValid = false;
    }
}

window.SimpleLighting = SimpleLighting;
