class AmbienceSystem {
    constructor(ctx, width, height) {
        this.ctx = ctx;
        this.width = width;
        this.height = height;
        this.enabled = true;

        this.spores = [];
        this.sporeCount = 200;
        this.sporeSize = 1.2;
        this.sporeColor = [0.7, 0.85, 0.3];

        this.time = 0;
        this.lightPhase = Math.random() * Math.PI * 2;
        this.baseAlpha = 0;
        this.waveAlpha = 0;
        this.waveSpeed = 0.001;

        this.roomWidth = 2000;
        this.roomHeight = 2000;

        this.initSpores();
    }

    initSpores() {
        this.spores = [];
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

        this.update(0.016);

        ctx.save();
        const c = this.sporeColor;

        for (const s of this.spores) {
            const screenPos = camera.worldToScreen(s.worldX, s.worldY);
            if (screenPos.x < -50 || screenPos.x > w + 50 || screenPos.y < -50 || screenPos.y > h + 50) {
                continue;
            }

            const pulse = Math.sin(s.phase) * 0.3 + 0.7;
            const alpha = s.opacity * pulse;

            ctx.shadowBlur = s.size * 2 * camera.zoom;
            ctx.shadowColor = `rgba(${c[0] * 255}, ${c[1] * 255}, ${c[2] * 255}, ${alpha * 0.5})`;
            ctx.fillStyle = `rgba(${c[0] * 255}, ${c[1] * 255}, ${c[2] * 255}, ${alpha})`;

            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, s.size * camera.zoom, 0, Math.PI * 2);
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
