class AmbienceSystem {
    constructor(ctx, width, height) {
        this.ctx = ctx;
        this.width = width;
        this.height = height;
        this.enabled = true;

        this.spores = [];
        this.sporeCount = 96;
        this.sporeSize = 1.2;
        this.sporeColor = [0.7, 0.85, 0.3];

        this.time = 0;
        this.lightPhase = Math.random() * Math.PI * 2;
        this.baseAlpha = 0;
        this.waveAlpha = 0;
        this.waveSpeed = 0.001;
        this.renderFrame = 0;
        this.baseFillColor = '';
        this.baseShadowColor = '';

        this.roomWidth = 2000;
        this.roomHeight = 2000;

        this.initSpores();
    }

    initSpores() {
        this.spores = [];
        const c = this.sporeColor;
        this.baseFillColor = `rgb(${Math.round(c[0] * 255)}, ${Math.round(c[1] * 255)}, ${Math.round(c[2] * 255)})`;
        this.baseShadowColor = `rgb(${Math.round(c[0] * 255)}, ${Math.round(c[1] * 255)}, ${Math.round(c[2] * 255)})`;
        for (let i = 0; i < this.sporeCount; i++) {
            this.spores.push({
                worldX: Math.random() * this.roomWidth,
                worldY: Math.random() * this.roomHeight,
                vx: (Math.random() - 0.5) * 0.25,
                vy: (Math.random() - 0.5) * 0.12,
                size: 1.2 + Math.random() * 0.8,
                phase: Math.random() * Math.PI * 2,
                opacity: 0.32 + Math.random() * 0.28
            });
        }
    }

    update(dt) {
        this.time += dt;

        for (const s of this.spores) {
            s.worldX += s.vx;
            s.worldY += s.vy + Math.sin(s.phase) * 0.05;
            s.phase += 0.015;

            if (s.worldX < -10) s.worldX = this.roomWidth + 10;
            if (s.worldX > this.roomWidth + 10) s.worldX = -10;
            if (s.worldY < -10) s.worldY = this.roomHeight + 10;
            if (s.worldY > this.roomHeight + 10) s.worldY = -10;
        }
    }

    render(ctx, camera) {
        if (this.enabled === false) return;

        const w = ctx.canvas.width || 960;
        const h = ctx.canvas.height || 960;
        const game = (typeof window !== 'undefined') ? window.game : null;
        const budget = (typeof window !== 'undefined' && window.RenderBudgetManager && game)
            ? window.RenderBudgetManager.getBudget(game, game?.curRoom || null, ctx.canvas)
            : null;
        const tier = budget?.tier || 'full';
        const stride = tier === 'low' ? 5 : (tier === 'medium' ? 3 : 1);
        const glowStride = tier === 'low' ? 12 : (tier === 'medium' ? 8 : 5);

        this.renderFrame = (this.renderFrame + 1) % 4096;

        ctx.save();

        for (let i = 0; i < this.spores.length; i += stride) {
            const s = this.spores[i];
            const screenPos = camera.worldToScreen(s.worldX, s.worldY);
            if (screenPos.x < -40 || screenPos.x > w + 40 || screenPos.y < -40 || screenPos.y > h + 40) {
                continue;
            }

            const pulse = Math.sin(s.phase) * 0.3 + 0.7;
            const alpha = s.opacity * pulse;
            const radius = s.size * camera.zoom;
            const useGlow = (i % glowStride) === 0 && radius >= 1.2;

            if (useGlow) {
                ctx.shadowBlur = Math.max(1.5, radius * 1.8);
                ctx.shadowColor = `rgba(179, 217, 77, ${Math.min(0.45, alpha * 0.45)})`;
            } else {
                ctx.shadowBlur = 0;
            }
            ctx.fillStyle = `rgba(179, 217, 77, ${alpha})`;

            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, radius, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // 全局压暗层已移除，避免和玩家跟随暗角叠加。
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
    }
}

if (typeof module !== 'undefined') module.exports = AmbienceSystem;
