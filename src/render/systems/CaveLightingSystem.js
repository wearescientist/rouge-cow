/**
 * CaveLightingSystem - 简化版光源系统
 */

class CaveLightingSystem {
    constructor(ctx, width, height) {
        this.ctx = ctx;
        this.width = width || 960;
        this.height = height || 600;
        this.crystals = [];
        this.enabled = true;
        this.renderFrame = 0;
        this.qualityPreset = 'high';
        this.maxLights = 10;
        this.lastDrawnLights = 0;
    }
    
    addCrystal(worldX, worldY) {
        this.crystals.push({
            worldX, worldY,
            radius: 100,
            color: [0.3, 0.6, 1.0],
            intensity: 0.6,
            phase: Math.random() * Math.PI * 2,
            pulseSpeed: 2
        });
    }

    addSpotlight(worldX, worldY, options = {}) {
        const colorHex = String(options.color || '#ff9f5c');
        const rgb = /^#([0-9a-f]{6})$/i.test(colorHex)
            ? [
                parseInt(colorHex.slice(1, 3), 16) / 255,
                parseInt(colorHex.slice(3, 5), 16) / 255,
                parseInt(colorHex.slice(5, 7), 16) / 255
            ]
            : [1.0, 0.62, 0.36];
        this.crystals.push({
            worldX,
            worldY,
            radius: Number.isFinite(options.radius) ? Math.max(40, options.radius) : 220,
            color: rgb,
            intensity: Number.isFinite(options.intensity) ? Math.max(0.2, options.intensity) : 1.4,
            currentIntensity: Number.isFinite(options.intensity) ? Math.max(0.2, options.intensity) : 1.4,
            phase: 0,
            pulseSpeed: Number.isFinite(options.pulseSpeed) ? options.pulseSpeed : 0,
            ttl: Number.isFinite(options.duration) ? Math.max(0.05, options.duration) : 1.35,
            transient: true
        });
    }
    
    update(dt) {
        if (this.crystals.length > 0) {
            this.crystals = this.crystals.filter((c) => {
                if (!c.transient) return true;
                c.ttl = (c.ttl || 0) - dt;
                return c.ttl > 0;
            });
        }
        for (const c of this.crystals) {
            c.phase += dt * c.pulseSpeed;
            c.currentIntensity = c.intensity * (0.7 + Math.sin(c.phase) * 0.3);
        }
    }
    
    generateCaveLights(roomWidth, roomHeight, wallThickness) {
        this.crystals = [];
        for (let i = 0; i < 10; i++) {
            const x = wallThickness + 150 + Math.random() * (roomWidth - wallThickness * 2 - 300);
            const y = wallThickness + 150 + Math.random() * (roomHeight - wallThickness * 2 - 300);
            this.addCrystal(x, y);
        }
    }
    
    render(ctx, player, camera) {
        if (this.enabled === false || !Array.isArray(this.crystals) || this.crystals.length === 0) return;

        const game = (typeof window !== 'undefined') ? window.game : null;
        const budget = (typeof window !== 'undefined' && window.RenderBudgetManager && game)
            ? window.RenderBudgetManager.getBudget(game, game?.curRoom || null, ctx.canvas)
            : null;
        const tier = budget?.tier || 'full';
        const preset = this.qualityPreset || 'high';
        const presetStride = preset === 'low' ? 4 : (preset === 'medium' ? 2 : 1);
        const stride = Math.max(tier === 'low' ? 3 : (tier === 'medium' ? 2 : 1), presetStride);
        const presetCap = preset === 'low' ? 4 : (preset === 'medium' ? 7 : 10);
        const tierCap = tier === 'low' ? 4 : (tier === 'medium' ? 7 : 10);
        const lightCap = Math.max(1, Math.min(this.maxLights || 10, presetCap, tierCap));

        this.renderFrame = (this.renderFrame + 1) % 4096;

        ctx.save();
        ctx.globalCompositeOperation = 'screen';

        let drawnLights = 0;
        for (let i = 0; i < this.crystals.length; i += stride) {
            if (drawnLights >= lightCap) break;
            const light = this.crystals[i];
            const pos = camera.worldToScreen(light.worldX, light.worldY);
            const r = light.radius * camera.zoom;

            if (pos.x < -r || pos.x > this.width + r || pos.y < -r || pos.y > this.height + r) continue;

            const c = light.color;
            const alpha = (light.currentIntensity || light.intensity) * 0.36;

            const grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, r);
            grad.addColorStop(0, `rgba(${c[0]*255}, ${c[1]*255}, ${c[2]*255}, ${alpha})`);
            grad.addColorStop(0.56, `rgba(${c[0]*255}, ${c[1]*255}, ${c[2]*255}, ${alpha * 0.22})`);
            grad.addColorStop(1, `rgba(${c[0]*255}, ${c[1]*255}, ${c[2]*255}, 0)`);

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
            ctx.fill();
            drawnLights += 1;
        }

        ctx.restore();
        this.lastDrawnLights = drawnLights;
        game?.perfMonitor?.setMetric?.('lighting.drawn', drawnLights);
        game?.perfMonitor?.setMetric?.('lighting.total', this.crystals.length);
        game?.perfMonitor?.setMetric?.('lighting.cap', lightCap);
    }
    
    resize(w, h) {
        this.width = w;
        this.height = h;
    }
}

if (typeof module !== 'undefined') {
    module.exports = CaveLightingSystem;
}
