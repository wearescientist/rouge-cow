(function attachDamageNumberSystem(global) {
    const rand = global.rand || ((min, max) => Math.random() * (max - min) + min);
class DamageNumberSystem {

    constructor(max = 100) {
        this.enabled = true;

        this.pool = Array(max).fill(null).map(() => ({

            x: 0, y: 0, value: 0, life: 0, maxLife: 1,

            color: '#ffffff', size: 14, active: false,

            vx: 0, vy: 0, critical: false

        }));

        this.active = [];
        this.cursor = 0;

    }

    acquireNumberSlot() {
        const poolLen = this.pool.length;
        for (let i = 0; i < poolLen; i += 1) {
            const index = (this.cursor + i) % poolLen;
            const candidate = this.pool[index];
            if (!candidate.active) {
                this.cursor = (index + 1) % poolLen;
                return candidate;
            }
        }
        const fallback = this.pool[this.cursor];
        this.cursor = (this.cursor + 1) % poolLen;
        return fallback;
    }

    

    spawn(x, y, value, opts = {}) {
        if (!this.enabled) return;

        const dn = this.acquireNumberSlot();

        dn.x = x; dn.y = y; dn.value = value; dn.active = true;

        dn.life = opts.life || 0.8; dn.maxLife = dn.life;

        dn.size = opts.size || (opts.critical ? 22 : 14);

        dn.color = opts.color || (opts.critical ? '#ff0' : '#fff');

        dn.critical = opts.critical || false;

        dn.vx = rand(-30, 30);

        dn.vy = opts.critical ? -120 : -80;

        if (!this.active.includes(dn)) this.active.push(dn);

    }

    

    spawnHeal(x, y, value) {

        this.spawn(x, y, '+' + value, { color: '#44ff44', life: 1.0, size: 16 });

    }

    

    update(dt) {

        for (let i = this.active.length - 1; i >= 0; i--) {

            const dn = this.active[i];

            dn.x += dn.vx * dt;

            dn.y += dn.vy * dt;

            dn.vy += 200 * dt; // 重力

            dn.life -= dt;

            if (dn.life <= 0) {

                dn.active = false;

                this.active.splice(i, 1);

            }

        }

    }

    

    draw(ctx, camera) {

        ctx.textAlign = 'center';

        ctx.textBaseline = 'middle';

        for (const dn of this.active) {

            const alpha = Math.min(1, dn.life / dn.maxLife * 2);

            ctx.globalAlpha = alpha;

            ctx.font = `bold ${dn.size}px ZCOOL KuaiLe Local`;

            

            // 使用相机转换世界坐标到屏幕坐标

            const screenPos = camera ? camera.worldToScreen(dn.x, dn.y) : { x: dn.x, y: dn.y };

            

            // 暴击效果 - 发光描边

            if (dn.critical) {

                ctx.shadowBlur = 10;

                ctx.shadowColor = '#f80';

                ctx.strokeStyle = '#800';

                ctx.lineWidth = 2;

                ctx.strokeText(dn.value, screenPos.x, screenPos.y);

            }

            

            ctx.fillStyle = dn.color;

            ctx.fillText(dn.value, screenPos.x, screenPos.y);

            ctx.shadowBlur = 0;

        }

        ctx.globalAlpha = 1;

    }

}
    global.DamageNumberSystem = DamageNumberSystem;
})(window);
