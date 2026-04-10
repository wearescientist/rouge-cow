(function attachWeaponVisualSystem(global) {
    const rand = global.rand || ((min, max) => Math.random() * (max - min) + min);
class WeaponVisualSystem {
    constructor() {
        this.trails = [];      // 武器尾迹
        this.particles = [];   // 武器粒子
        this.effects = [];     // 特效
    }

    // 更新所有效果
    update(dt) {
        // 更新尾迹
        for (let i = this.trails.length - 1; i >= 0; i--) {
            const t = this.trails[i];
            t.life -= dt;
            t.alpha = t.life / t.maxLife;
            if (t.life <= 0) this.trails.splice(i, 1);
        }
        
        // 更新粒子
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt;
            p.vx *= 0.98; // 阻力
            p.vy *= 0.98;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
        
        // 更新特效
        for (let i = this.effects.length - 1; i >= 0; i--) {
            const e = this.effects[i];
            e.life -= dt;
            if (e.update) e.update(dt);
            if (e.life <= 0) this.effects.splice(i, 1);
        }
    }

    // 添加尾迹点
    addTrail(x, y, color, size = 2, life = 0.3) {
        this.trails.push({
            x, y, color, size,
            life, maxLife: life,
            alpha: 1
        });
    }

    // 添加粒子
    addParticle(x, y, vx, vy, color, size, life) {
        this.particles.push({ x, y, vx, vy, color, size, life, maxLife: life });
    }

    // 生成爆炸粒子
    explode(x, y, color, count = 8, speed = 60) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
            const vel = speed * (0.5 + Math.random() * 0.5);
            this.addParticle(
                x, y,
                Math.cos(angle) * vel,
                Math.sin(angle) * vel,
                color,
                1 + Math.random() * 2,
                0.3 + Math.random() * 0.3
            );
        }
    }

    // 生成火花
    spark(x, y, color, count = 5) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 30 + Math.random() * 50;
            this.addParticle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                color,
                1,
                0.1 + Math.random() * 0.2
            );
        }
    }

    // 绘制所有效果
    draw(ctx, camera) {
        // 绘制尾迹
        for (const t of this.trails) {
            if (!camera.isVisible(t.x, t.y, 10)) continue;
            const pos = camera.worldToScreen(t.x, t.y);
            ctx.globalAlpha = t.alpha * 0.6;
            ctx.fillStyle = t.color;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, t.size, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 绘制粒子
        for (const p of this.particles) {
            if (!camera.isVisible(p.x, p.y, 5)) continue;
            const pos = camera.worldToScreen(p.x, p.y);
            const alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, p.size * alpha, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 绘制特效
        for (const e of this.effects) {
            if (e.draw && camera.isVisible(e.x, e.y, 30)) {
                e.draw(ctx, camera);
            }
        }
        
        ctx.globalAlpha = 1;
    }

    // 清理
    clear() {
        this.trails = [];
        this.particles = [];
        this.effects = [];
    }
}
    global.WeaponVisualSystem = WeaponVisualSystem;
    global.weaponVisuals = new WeaponVisualSystem();
})(window);
