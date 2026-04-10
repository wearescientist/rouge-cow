(function attachParticleSystem(global) {
    const rand = global.rand || ((min, max) => Math.random() * (max - min) + min);
class ParticleSystem {

    constructor(max = 360) {

        this.pool = Array(max).fill(null).map(() => ({

            x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1,

            color: '#ffffff', size: 4, active: false, type: 'rect',

            gravity: 0, rotation: 0, rotSpeed: 0, glow: 0

        }));

        this.active = [];
        this.maxActiveHard = Math.max(64, max);
        this.maxActive = this.maxActiveHard;
        this.maxActivePerRoom = Math.max(32, Math.floor(this.maxActive * 0.72));
        this.cursor = 0;
        this.frameBudget = Math.max(36, Math.floor(max * 0.16));
        this.frameStamp = -1;
        this.frameEmitted = 0;
        this.hitFxGate = new Map();
        this.drawFrame = 0;
        this.activeByRoom = new Map();
        this.droppedByCap = 0;
        this.lastDroppedByCap = 0;

    }

    getCapProfile() {
        const settings = window.game?.runtimeSettings || {};
        const quality = settings.graphicsQuality || 'high';
        let globalCap = this.maxActiveHard;
        let roomCap = Math.max(32, Math.floor(globalCap * 0.72));
        if (quality === 'low') {
            globalCap = Math.min(globalCap, 220);
            roomCap = Math.min(roomCap, 130);
        } else if (quality === 'medium') {
            globalCap = Math.min(globalCap, 290);
            roomCap = Math.min(roomCap, 180);
        }
        return { globalCap, roomCap };
    }

    resolveRoomKey(opts = null) {
        if (opts && typeof opts.roomKey === 'string' && opts.roomKey) return opts.roomKey;
        const roomId = window.game?.curRoom?.id;
        if (typeof roomId === 'string' && roomId) return roomId;
        return 'global';
    }

    getRoomLoad(roomKey) {
        return this.activeByRoom.get(roomKey) || 0;
    }

    getDrawProfile() {
        const load = this.getLoadFactor();
        const active = this.active.length;
        if (load >= 0.92 || active >= 340) {
            return { stride: 3, disableMinorGlow: true, cullMargin: 32, minAlpha: 0.08, maxDraw: 140 };
        }
        if (load >= 0.76 || active >= 240) {
            return { stride: 2, disableMinorGlow: true, cullMargin: 44, minAlpha: 0.06, maxDraw: 190 };
        }
        if (load >= 0.58 || active >= 160) {
            return { stride: 1, disableMinorGlow: false, cullMargin: 56, minAlpha: 0.04, maxDraw: 260 };
        }
        return { stride: 1, disableMinorGlow: false, cullMargin: 64, minAlpha: 0.02, maxDraw: 340 };
    }

    beginFrameBudget() {
        const stamp = Math.floor((performance && performance.now ? performance.now() : Date.now()) / 16.67);
        const capProfile = this.getCapProfile();
        this.maxActive = Math.max(64, Math.min(this.maxActiveHard, capProfile.globalCap));
        this.maxActivePerRoom = Math.max(32, Math.min(this.maxActive, capProfile.roomCap));
        this.frameBudget = Math.max(22, Math.floor(this.maxActive * 0.16));
        if (stamp !== this.frameStamp) {
            this.frameStamp = stamp;
            this.frameEmitted = 0;
            this.lastDroppedByCap = this.droppedByCap;
            this.droppedByCap = 0;
            if (this.hitFxGate.size > 256) {
                this.hitFxGate.clear();
            }
        }
    }

    getLoadFactor() {
        return this.active.length / Math.max(1, this.maxActive);
    }

    scaleCount(count) {
        const load = this.getLoadFactor();
        if (load >= 0.9) return Math.max(1, Math.floor(count * 0.16));
        if (load >= 0.78) return Math.max(1, Math.floor(count * 0.28));
        if (load >= 0.64) return Math.max(1, Math.floor(count * 0.46));
        if (load >= 0.5) return Math.max(1, Math.floor(count * 0.64));
        return count;
    }

    canEmit(count = 1, roomKey = 'global') {
        this.beginFrameBudget();
        const roomCount = this.getRoomLoad(roomKey);
        const can = this.active.length < this.maxActive
            && (this.frameEmitted + count) <= this.frameBudget
            && roomCount < this.maxActivePerRoom;
        if (!can) this.droppedByCap += 1;
        return can;
    }

    emit(x, y, color, opts = {}) {

        this.beginFrameBudget();
        const roomKey = this.resolveRoomKey(opts);
        if (!this.canEmit(1, roomKey)) return null;

        let p = null;
        const poolLen = this.pool.length;
        for (let i = 0; i < poolLen; i += 1) {
            const index = (this.cursor + i) % poolLen;
            if (!this.pool[index].active) {
                p = this.pool[index];
                this.cursor = (index + 1) % poolLen;
                break;
            }
        }
        if (!p) {
            p = this.pool[this.cursor];
            this.cursor = (this.cursor + 1) % poolLen;
        }

        p.x = x; p.y = y; p.color = color; p.active = true;

        p.life = opts.life || 1; p.maxLife = p.life;

        p.size = opts.size || 4;

        p.type = opts.type || 'rect';

        p.gravity = opts.gravity || 0;

        p.rotation = opts.rotation || 0;

        p.rotSpeed = opts.rotSpeed || opts.rotationSpeed || 0;

        p.glow = opts.glow || 0;
        p.sprite = opts.sprite || null;
        p.roomKey = roomKey;

        if (Number.isFinite(opts.vx) && Number.isFinite(opts.vy)) {
            p.vx = opts.vx;
            p.vy = opts.vy;
        } else {
            const speed = opts.speed || 100;
            const angle = opts.angle != null ? opts.angle : Math.random() * Math.PI * 2;
            p.vx = Math.cos(angle) * speed;
            p.vy = Math.sin(angle) * speed;
        }

        this.frameEmitted += 1;
        if (!this.active.includes(p)) this.active.push(p);
        this.activeByRoom.set(roomKey, (this.activeByRoom.get(roomKey) || 0) + 1);
        return p;

    }



    burst(x, y, color, count = 10, opts = {}) {

        count = this.scaleCount(Math.max(1, Math.floor(count)));
        for (let i = 0; i < count; i++) {
            if (!this.canEmit(1, this.resolveRoomKey(opts))) break;

            this.emit(x, y, color, { 

                speed: opts.speed || rand(50, 200), 

                life: opts.life || rand(0.3, 1.0),

                size: opts.size || rand(2, 6),

                type: opts.type || 'rect',

                gravity: opts.gravity || 0,

                rotSpeed: rand(-5, 5),

                glow: opts.glow || 0

            });

        }

    }



    explosion(x, y, color, count = 30) {
        count = this.scaleCount(Math.max(1, Math.floor(count)));
        // 30%概率使用爆炸贴图
        if (Math.random() < 0.3 && window.game && window.game.sprites) {
            const spriteName = count > 20 ? 'effect_explosion_large' : 'effect_explosion_small';
            for (let i = 0; i < Math.min(count, 8); i++) {
                if (!this.canEmit(1, this.resolveRoomKey())) break;
                const angle = rand(0, Math.PI * 2);
                const speed = rand(30, 80);
                this.emit(x, y, color, {
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    speed: speed,
                    life: rand(0.4, 0.8),
                    size: rand(16, 32),
                    type: 'sprite',
                    sprite: spriteName,
                    rotation: rand(0, Math.PI * 2)
                });
            }
        } else {
            // 核心爆炸 - 圆形粒子
            for (let i = 0; i < count; i++) {
                if (!this.canEmit(1, this.resolveRoomKey())) break;
                this.emit(x, y, color, {
                    speed: rand(80, 250),
                    life: rand(0.4, 0.9),
                    size: rand(3, 8),
                    type: 'circle',
                    glow: rand(10, 20)
                });
            }
        }
        
        // 火花 - 小矩形
        for (let i = 0; i < count / 2; i++) {
            if (!this.canEmit(1, this.resolveRoomKey())) break;
            this.emit(x, y, '#ff0', {
                speed: rand(100, 300),
                life: rand(0.2, 0.5),
                size: rand(1, 3),
                type: 'rect'
            });
        }
    }



    trail(x, y, color, count = 3) {
        count = this.scaleCount(Math.max(1, Math.floor(count)));
        // 50%概率使用贴图，50%概率使用代码绘制
        if (Math.random() < 0.5 && window.game && window.game.sprites) {
            for (let i = 0; i < count; i++) {
                if (!this.canEmit(1, this.resolveRoomKey())) break;
                this.emit(x + rand(-3, 3), y + rand(-3, 3), color, {
                    speed: rand(10, 30),
                    life: rand(0.2, 0.4),
                    size: rand(8, 16),
                    type: 'sprite',
                    sprite: 'effect_particle_smoke'
                });
            }
        } else {
            for (let i = 0; i < count; i++) {
                if (!this.canEmit(1, this.resolveRoomKey())) break;
                this.emit(x + rand(-3, 3), y + rand(-3, 3), color, {
                    speed: rand(10, 30),
                    life: rand(0.15, 0.35),
                    size: rand(2, 4),
                    type: 'circle',
                    glow: 5
                });
            }
        }
    }
    
    // 使用贴图的爆炸效果
    explosionWithSprite(x, y, spriteName, count = 10) {
        count = this.scaleCount(Math.max(1, Math.floor(count)));
        for (let i = 0; i < count; i++) {
            if (!this.canEmit(1, this.resolveRoomKey())) break;
            const angle = (Math.PI * 2 * i) / count + rand(-0.2, 0.2);
            const speed = rand(50, 150);
            this.emit(x, y, '#fff', {
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                speed: speed,
                life: rand(0.3, 0.6),
                size: rand(12, 24),
                type: 'sprite',
                sprite: spriteName,
                rotation: rand(0, Math.PI * 2),
                rotationSpeed: rand(-2, 2)
            });
        }
    }



    sparkle(x, y, color, count = 5) {
        count = this.scaleCount(Math.max(1, Math.floor(count)));
        // 40%概率使用 sparkle 贴图
        if (Math.random() < 0.4 && window.game && window.game.sprites) {
            for (let i = 0; i < count; i++) {
                if (!this.canEmit(1, this.resolveRoomKey())) break;
                this.emit(x, y, color, {
                    speed: rand(20, 60),
                    life: rand(0.5, 1.2),
                    size: rand(8, 16),
                    type: 'sprite',
                    sprite: 'effect_particle_glow',
                    rotation: rand(0, Math.PI * 2)
                });
            }
        } else {
            for (let i = 0; i < count; i++) {
                if (!this.canEmit(1, this.resolveRoomKey())) break;
                this.emit(x, y, color, {
                    speed: rand(20, 60),
                    life: rand(0.5, 1.2),
                    size: rand(2, 5),
                    type: 'star',
                    rotSpeed: rand(-3, 3)
                });
            }
        }
    }
    
    // 打击效果 - 用于敌人受击时的视觉反馈
    hitEffect(x, y, color = '#fff', damage = 0) {
        const gateKey = `${Math.round(x / 24)}:${Math.round(y / 24)}`;
        const now = performance && performance.now ? performance.now() : Date.now();
        const last = this.hitFxGate.get(gateKey) || 0;
        if (now - last < 42) return;
        this.hitFxGate.set(gateKey, now);
        // 50%概率使用击中贴图
        if (Math.random() < 0.5 && window.game && window.game.sprites) {
            const spriteName = Math.random() < 0.5 ? 'effect_hit_pierce' : 'effect_hit_slash';
            this.emit(x, y, color, {
                speed: rand(20, 50),
                life: rand(0.2, 0.4),
                size: rand(16, 24),
                type: 'sprite',
                sprite: spriteName,
                rotation: rand(0, Math.PI * 2)
            });
        } else {
            // 主爆炸
            this.burst(x, y, color, 8, {
                speed: rand(80, 200),
                life: rand(0.2, 0.5),
                size: rand(2, 5),
                type: 'circle',
                glow: 15
            });
        }
        
        // 血滴效果（使用贴图）
        const bloodCount = this.scaleCount(Math.min(5, Math.max(2, Math.floor(damage / 5))));
        if (window.game && window.game.sprites && Math.random() < 0.5) {
            for (let i = 0; i < bloodCount; i++) {
                this.emit(x, y, '#a00', {
                    speed: rand(30, 100),
                    angle: Math.random() * Math.PI * 2,
                    life: rand(0.3, 0.6),
                    size: rand(8, 14),
                    type: 'sprite',
                    sprite: 'effect_particle_blood',
                    gravity: 100
                });
            }
        } else {
            for (let i = 0; i < bloodCount; i++) {
                this.emit(x, y, '#a00', {
                    speed: rand(30, 100),
                    angle: Math.random() * Math.PI * 2,
                    life: rand(0.3, 0.6),
                    size: rand(2, 4),
                    type: 'circle',
                    gravity: 100
                });
            }
        }
    }
    
    // 暴击特效
    critEffect(x, y) {
        // 大爆发
        this.explosion(x, y, '#ff0', this.scaleCount(20));
        // 红色核心
        this.burst(x, y, '#f00', this.scaleCount(10), {
            speed: rand(50, 150),
            life: rand(0.3, 0.6),
            size: rand(3, 6),
            type: 'circle',
            glow: 20
        });
        // 星形闪光
        this.sparkle(x, y, '#fff', 8);
    }

    critBloodEffect(x, y, damage = 0, options = {}) {
        const sourceX = Number.isFinite(options.sourceX) ? options.sourceX : x;
        const sourceY = Number.isFinite(options.sourceY) ? options.sourceY : y;
        const awayX = x - sourceX;
        const awayY = y - sourceY;
        const awayLen = Math.hypot(awayX, awayY) || 1;
        const dirX = awayLen > 0 ? awayX / awayLen : 0;
        const dirY = awayLen > 0 ? awayY / awayLen : -1;
        const sprayCount = this.scaleCount(Math.min(18, Math.max(8, Math.floor(damage / 2) + 6)));

        this.critEffect(x, y);

        for (let i = 0; i < sprayCount; i++) {
            if (!this.canEmit(1, this.resolveRoomKey())) break;
            const spread = rand(-0.7, 0.7);
            const speed = rand(110, 250);
            const vx = dirX * speed + spread * 70;
            const vy = dirY * speed + rand(-90, 20);
            this.emit(x + rand(-4, 4), y + rand(-6, 6), '#b3122f', {
                vx,
                vy,
                speed,
                life: rand(0.22, 0.5),
                size: rand(3, 7),
                type: Math.random() < 0.4 ? 'sprite' : 'circle',
                sprite: 'effect_particle_blood',
                gravity: 135,
                glow: rand(4, 12)
            });
        }

        for (let i = 0; i < this.scaleCount(6); i++) {
            if (!this.canEmit(1, this.resolveRoomKey())) break;
            this.emit(x + rand(-5, 5), y + rand(-5, 5), '#ffd6d6', {
                speed: rand(50, 120),
                angle: Math.random() * Math.PI * 2,
                life: rand(0.12, 0.25),
                size: rand(2, 4),
                type: 'star',
                glow: 16,
                rotSpeed: rand(-5, 5)
            });
        }
    }



    update(dt) {

        for (let i = this.active.length - 1; i >= 0; i--) {

            const p = this.active[i];

            p.x += p.vx * dt;

            p.y += p.vy * dt;

            p.vy += p.gravity * dt * 60;

            p.rotation += p.rotSpeed * dt;

            p.life -= dt;

            if (p.life <= 0) {

                p.active = false;
                const roomKey = p.roomKey || 'global';
                const nextCount = Math.max(0, (this.activeByRoom.get(roomKey) || 0) - 1);
                if (nextCount <= 0) this.activeByRoom.delete(roomKey);
                else this.activeByRoom.set(roomKey, nextCount);
                p.roomKey = null;

                this.active.splice(i, 1);

            }

        }

    }



    draw(ctx, camera) {

        const canvas = ctx && ctx.canvas;
        const profile = this.getDrawProfile();
        const cullMargin = profile.cullMargin;
        const spriteCache = new Map();
        this.drawFrame = (this.drawFrame + 1) % 2048;
        let drawnCount = 0;
        let culledCount = 0;

        for (let i = 0; i < this.active.length; i++) {
            if (drawnCount >= profile.maxDraw) {
                culledCount += (this.active.length - i);
                break;
            }
            const p = this.active[i];
            const alpha = p.life / p.maxLife;
            if (alpha <= profile.minAlpha) {
                culledCount += 1;
                continue;
            }

            let screenX = p.x, screenY = p.y;
            if (camera && camera.worldToScreen) {
                const pos = camera.worldToScreen(p.x, p.y);
                screenX = pos.x;
                screenY = pos.y;
            }
            if (canvas && (screenX < -cullMargin || screenY < -cullMargin || screenX > canvas.width + cullMargin || screenY > canvas.height + cullMargin)) {
                culledCount += 1;
                continue;
            }

            const importance = (p.type === 'sprite' ? 2 : 0) + (p.glow > 0 ? 1 : 0) + (p.size >= 5 ? 1 : 0) + (alpha >= 0.55 ? 1 : 0);
            if (profile.stride > 1 && importance <= 1 && ((i + this.drawFrame) % profile.stride) !== 0) {
                culledCount += 1;
                continue;
            }

            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;

            const glowStrength = profile.disableMinorGlow && importance <= 1
                ? 0
                : (p.glow > 0 ? Math.min(p.glow, importance >= 3 ? p.glow : p.glow * 0.6) : 0);
            if (glowStrength > 0) {
                ctx.shadowBlur = glowStrength;
                ctx.shadowColor = p.color;
            } else {
                ctx.shadowBlur = 0;
            }

            const needsTransform = p.type === 'sprite' || p.type === 'star' || Math.abs(p.rotation) > 0.001;
            if (!needsTransform) {
                if (p.type === 'rect') {
                    ctx.fillRect(screenX - p.size/2, screenY - p.size/2, p.size, p.size);
                } else {
                    ctx.beginPath();
                    ctx.arc(screenX, screenY, p.size/2, 0, Math.PI * 2);
                    ctx.fill();
                }
                drawnCount += 1;
                continue;
            }

            ctx.save();
            ctx.translate(screenX, screenY);
            if (Math.abs(p.rotation) > 0.001) {
                ctx.rotate(p.rotation);
            }

            if (p.type === 'sprite' && p.sprite) {
                let sprite = spriteCache.get(p.sprite);
                if (sprite === undefined) {
                    sprite = window.game && window.game.sprites ? window.game.sprites.get(p.sprite) : null;
                    spriteCache.set(p.sprite, sprite || null);
                }
                if (sprite) {
                    const s = p.size * 2;
                    ctx.drawImage(sprite, -s/2, -s/2, s, s);
                } else {
                    ctx.beginPath();
                    ctx.arc(0, 0, p.size/2, 0, Math.PI * 2);
                    ctx.fill();
                }
            } else if (p.type === 'star') {
                this.drawStar(ctx, 0, 0, 5, p.size, p.size/2);
            } else if (p.type === 'rect') {
                ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
            } else {
                ctx.beginPath();
                ctx.arc(0, 0, p.size/2, 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.restore();
            drawnCount += 1;
        }

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
        const perf = window.game?.perfMonitor;
        if (perf?.setMetric) {
            let roomPeak = 0;
            for (const v of this.activeByRoom.values()) roomPeak = Math.max(roomPeak, v);
            perf.setMetric('particles.drawn', drawnCount);
            perf.setMetric('particles.culled', culledCount);
            perf.setMetric('particles.room', roomPeak);
            perf.setMetric('particles.drop', this.lastDroppedByCap);
        }

    }

    

    drawStar(ctx, cx, cy, spikes, outerRadius, innerRadius) {

        let rot = Math.PI / 2 * 3;

        let x = cx;

        let y = cy;

        let step = Math.PI / spikes;

        ctx.beginPath();

        ctx.moveTo(cx, cy - outerRadius);

        for (let i = 0; i < spikes; i++) {

            x = cx + Math.cos(rot) * outerRadius;

            y = cy + Math.sin(rot) * outerRadius;

            ctx.lineTo(x, y);

            rot += step;

            x = cx + Math.cos(rot) * innerRadius;

            y = cy + Math.sin(rot) * innerRadius;

            ctx.lineTo(x, y);

            rot += step;

        }

        ctx.lineTo(cx, cy - outerRadius);

        ctx.closePath();

        ctx.fill();

    }

    

    // v0.15.0 - 闪电效果（简单的视觉表现）
    lightning(x1, y1, x2, y2, color = '#ffff00') {
        // 在主游戏中直接绘制闪电，不通过粒子系统
        if (window.game) {
            window.game.lightningEffects = window.game.lightningEffects || [];
            window.game.lightningEffects.push({
                x1, y1, x2, y2, life: 0.16, color
            });
        }
    }

    

    // v0.15.0 - 区域效果
    areaEffect(x, y, radius, color) {
        if (!this.canEmit(1, this.resolveRoomKey())) return;
        this.emit(x + rand(-radius, radius), y + rand(-radius, radius), color, {
            speed: rand(10, 30),
            life: rand(0.3, 0.6),
            size: rand(5, 10),
            type: 'circle',
            glow: 8
        });
    }

}
    global.ParticleSystem = ParticleSystem;
})(window);
