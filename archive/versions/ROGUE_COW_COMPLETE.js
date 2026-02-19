// ============================================================================
// 肉鸽牛牛 v3.0 ULTIMATE - 完整游戏
// 整合所有30轮开发内容 | 无外部依赖 | 单文件可运行
// ============================================================================

// ===================== 工具函数 =====================
const U = {
    dist: (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
    clamp: (v, min, max) => Math.max(min, Math.min(max, v)),
    rand: (min, max) => Math.random() * (max - min) + min,
    randInt: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
    angle: (a, b) => Math.atan2(b.y - a.y, b.x - a.x)
};

// ===================== 配置 =====================
const CFG = {
    VER: '3.0.0',
    TILE: 80,
    MAX_P: 150,
    MAX_E: 30,
    FPS: 60
};

// ===================== 存储系统 =====================
const DB = {
    KEY: 'RC3_ULTIMATE',
    load() {
        const raw = localStorage.getItem(this.KEY);
        if (raw) {
            try { return JSON.parse(raw); } catch (e) {}
        }
        return this.getDefault();
    },
    getDefault() {
        return {
            gold: 0, kills: 0, runs: 0, bestTime: 0, bestWave: 0,
            perm: { dmg: 0, hp: 0, spd: 0, exp: 0, crit: 0, arm: 0 },
            ach: {}, stats: { dmg: 0, exp: 0, boss: 0, pup: 0 },
            daily: { done: false, date: null },
            settings: { vol: 0.3, minimap: true, particles: true }
        };
    },
    save(d) { localStorage.setItem(this.KEY, JSON.stringify(d)); },
    addGold(n) { const s = this.load(); s.gold += n; this.save(s); return s.gold; },
    unlock(id) {
        const s = this.load();
        if (!s.ach[id]) { s.ach[id] = Date.now(); this.save(s); return true; }
        return false;
    }
};

// ===================== 音频系统 =====================
const SND = {
    ctx: null, init: false,
    setup() {
        if (this.init) return;
        this.init = true;
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
            const resume = () => { this.ctx.resume(); document.removeEventListener('click', resume); };
            document.addEventListener('click', resume);
        } catch (e) {}
    },
    get vol() { return DB.load().settings.vol; },
    set vol(v) { const s = DB.load(); s.settings.vol = Math.max(0, Math.min(1, v)); DB.save(s); },
    play(f, d, type = 'square', v = 0.1) {
        if (!this.ctx) return;
        try {
            const o = this.ctx.createOscillator(), g = this.ctx.createGain();
            o.connect(g); g.connect(this.ctx.destination);
            o.frequency.value = f; o.type = type;
            g.gain.setValueAtTime(v * this.vol, this.ctx.currentTime);
            g.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + d);
            o.start(); o.stop(this.ctx.currentTime + d);
        } catch (e) {}
    },
    shoot() { this.play(440, 0.08); },
    hit() { this.play(180, 0.12, 'sawtooth'); },
    explode() { this.play(130, 0.25, 'sawtooth'); },
    lvl() { this.play(523, 0.15); setTimeout(() => this.play(659, 0.15), 80); setTimeout(() => this.play(784, 0.3), 160); },
    click() { this.play(880, 0.04); },
    boss() { this.play(140, 0.25); setTimeout(() => this.play(90, 0.35), 250); },
    power() { this.play(550, 0.08); setTimeout(() => this.play(750, 0.12), 80); },
    ach() { this.play(523, 0.08); setTimeout(() => this.play(659, 0.08), 80); setTimeout(() => this.play(784, 0.08), 160); setTimeout(() => this.play(1046, 0.25), 240); }
};

// ===================== 成就定义 =====================
const ACH = {
    first: { n: '第一滴血', d: '击杀第一个敌人', i: '🩸' },
    survive: { n: '幸存者', d: '存活5分钟', i: '⏱️' },
    wave10: { n: '波次大师', d: '达到第10波', i: '🌊' },
    boss: { n: 'BOSS杀手', d: '击败BOSS', i: '👑' },
    explore: { n: '探索者', d: '探索所有房间', i: '🗺️' },
    rich: { n: '富豪', d: '单局1000金币', i: '💰' },
    lvl20: { n: '满级大佬', d: '达到20级', i: '⭐' },
    k100: { n: '百人斩', d: '累计击杀100', i: '💀' },
    k1000: { n: '千人斩', d: '累计击杀1000', i: '☠️' }
};

// ===================== 道具定义 =====================
const PUP_DEF = {
    hp: { c: '#E74C3C', i: '❤️', e: p => p.hp = Math.min(p.mhp + 2, p.hp + 5) },
    spd: { c: '#3498DB', i: '⚡', e: p => { p.spd *= 1.5; setTimeout(() => p.spd /= 1.5, 5000); } },
    dmg: { c: '#E67E22', i: '💪', e: p => { p.dmg *= 2; setTimeout(() => p.dmg /= 2, 5000); } },
    mag: { c: '#9B59B6', i: '🧲', e: p => { p.magnet = 280; setTimeout(() => p.magnet = 0, 8000); } },
    shield: { c: '#F1C40F', i: '🛡️', e: p => { p.shield = true; setTimeout(() => p.shield = false, 5000); } },
    bomb: { c: '#C0392B', i: '💣', e: (p, enemies, ps) => enemies.forEach(e => { e.hp -= 10; ps.explode(e.x, e.y, '#C0392B', 3); }) }
};

// ===================== 粒子系统 =====================
class PSys {
    constructor() {
        this.pool = Array(CFG.MAX_P).fill(null).map(() => ({ a: false }));
        this.nums = [];
        this.shake = 0;
    }
    explode(x, y, c = '#FFF', n = 10, f = 4) {
        let cnt = 0;
        for (let p of this.pool) {
            if (!p.a) {
                p.a = true; p.x = x; p.y = y;
                const ang = (Math.PI * 2 * cnt) / n;
                p.vx = Math.cos(ang) * f; p.vy = Math.sin(ang) * f;
                p.life = 30; p.c = c; p.s = 4;
                cnt++; if (cnt >= n) break;
            }
        }
        this.shake = 8;
    }
    dmg(x, y, d, crit) {
        if (this.nums.length > 18) this.nums.shift();
        this.nums.push({ x, y, t: crit ? `CRIT ${~~d}!` : '' + ~~d, l: 35, vy: -1.5, c: crit ? '#FFD700' : '#FFF', s: crit ? 18 : 13 });
    }
    shakeScreen(ctx) {
        if (this.shake <= 0) return null;
        const dx = (Math.random() - 0.5) * this.shake, dy = (Math.random() - 0.5) * this.shake;
        ctx.translate(dx, dy);
        this.shake *= 0.9;
        if (this.shake < 0.5) this.shake = 0;
        return () => ctx.translate(-dx, -dy);
    }
    update() {
        for (let p of this.pool) {
            if (p.a) { p.x += p.vx; p.y += p.vy; p.life--; p.s *= 0.96; if (p.life <= 0) p.a = false; }
        }
        for (let i = this.nums.length - 1; i >= 0; i--) {
            const d = this.nums[i]; d.y += d.vy; d.l--;
            if (d.l <= 0) this.nums.splice(i, 1);
        }
    }
    draw(ctx) {
        const s = DB.load().settings;
        if (s.particles) {
            for (let p of this.pool) {
                if (p.a) { ctx.globalAlpha = p.life / 30; ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI * 2); ctx.fill(); }
            }
        }
        ctx.globalAlpha = 1;
        for (let d of this.nums) {
            ctx.globalAlpha = d.l / 35; ctx.fillStyle = d.c; ctx.font = `bold ${d.s}px monospace`;
            ctx.textAlign = 'center'; ctx.fillText(d.t, d.x, d.y);
        }
        ctx.textAlign = 'left'; ctx.globalAlpha = 1;
    }
}

// ===================== 实体类 =====================
class Ent { constructor(x, y, s, c) { this.x = x; this.y = y; this.s = s; this.c = c; this.a = true; } }

class Powerup extends Ent {
    constructor(x, y, t) { const d = PUP_DEF[t]; super(x, y, 26, d.c); this.t = t; this.i = d.i; this.bob = Math.random() * Math.PI * 2; }
    update() { this.bob += 0.08; }
    draw(ctx) {
        const b = Math.sin(this.bob) * 4;
        ctx.fillStyle = this.c; ctx.beginPath(); ctx.arc(this.x, this.y + b, this.s / 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#FFF'; ctx.font = '16px monospace'; ctx.textAlign = 'center'; ctx.fillText(this.i, this.x, this.y + b + 5); ctx.textAlign = 'left';
    }
}

class Enemy extends Ent {
    constructor(x, y, t) {
        const types = {
            chick: { c: '#FFD700', hp: 1, spd: 2.2, exp: 8, s: 30, g: 1 },
            pig: { c: '#FF69B4', hp: 3, spd: 1.2, exp: 12, s: 40, g: 2 },
            sheep: { c: '#ECF0F1', hp: 5, spd: 0.9, exp: 15, s: 45, g: 3 },
            cow: { c: '#FFF', hp: 8, spd: 0.7, exp: 20, s: 50, g: 5 },
            bull: { c: '#C0392B', hp: 12, spd: 1.5, exp: 30, s: 52, g: 8 },
            fox: { c: '#E67E22', hp: 4, spd: 1.9, exp: 18, s: 36, g: 4 }
        };
        const tp = types[t] || types.pig;
        super(x, y, tp.s, tp.c);
        this.t = t; this.hp = tp.hp; this.mhp = tp.hp; this.spd = tp.spd; this.exp = tp.exp; this.g = tp.g; this.f = -1;
    }
    update(p, map) {
        const dx = p.x - this.x, dy = p.y - this.y, d = Math.hypot(dx, dy);
        if (d > 0) {
            const nx = (dx / d) * this.spd, ny = (dy / d) * this.spd;
            if (!map.isWall(this.x + nx, this.y)) this.x += nx;
            if (!map.isWall(this.x, this.y + ny)) this.y += ny;
        }
        this.f = dx < 0 ? -1 : dx > 0 ? 1 : this.f;
    }
    draw(ctx) {
        ctx.save(); ctx.translate(this.x, this.y);
        if (this.f === 1) ctx.scale(-1, 1);
        ctx.fillStyle = this.c; ctx.fillRect(-this.s / 2, -this.s / 2, this.s, this.s);
        ctx.fillStyle = '#000'; ctx.fillRect(-this.s / 3, -this.s / 4, this.s / 6, this.s / 6); ctx.fillRect(this.s / 6, -this.s / 4, this.s / 6, this.s / 6);
        if (this.hp < this.mhp) { ctx.fillStyle = '#000'; ctx.fillRect(-this.s / 2, -this.s / 2 - 6, this.s, 3); ctx.fillStyle = '#E74C3C'; ctx.fillRect(-this.s / 2, -this.s / 2 - 6, this.s * (this.hp / this.mhp), 3); }
        ctx.restore();
    }
}

class Bullet extends Ent {
    constructor(x, y, tx, ty, dmg, crit, spd = 10) {
        super(x, y, 6, crit ? '#FFD700' : '#FFF');
        this.dmg = dmg; this.crit = crit;
        const a = Math.atan2(ty - y, tx - x);
        this.vx = Math.cos(a) * spd; this.vy = Math.sin(a) * spd;
    }
    update(W, H) { this.x += this.vx; this.y += this.vy; if (this.x < -50 || this.x > W + 50 || this.y < -50 || this.y > H + 50) this.a = false; }
    draw(ctx) {
        ctx.fillStyle = this.c; ctx.beginPath(); ctx.arc(this.x, this.y, this.crit ? 5 : 4, 0, Math.PI * 2); ctx.fill();
        if (this.crit) { ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2; ctx.stroke(); }
    }
}

class Boss extends Ent {
    constructor(x, y) {
        super(x, y, 80, '#8E44AD');
        this.mhp = 70; this.hp = this.mhp; this.spd = 1.2; this.phase = 1;
        this.tx = x; this.ty = y; this.f = -1; this.t = 0;
    }
    update(p, map) {
        this.t++;
        if (this.hp < this.mhp * 0.5) this.phase = 2;
        if (this.hp < this.mhp * 0.25) this.phase = 3;
        if (this.t % 80 === 0) {
            let a = Math.random() * Math.PI * 2, d = 80 + Math.random() * 50, attempts = 0;
            do { this.tx = U.clamp(this.x + Math.cos(a) * d, this.s, map.W - this.s); this.ty = U.clamp(this.y + Math.sin(a) * d, this.s, map.H - this.s); a += 0.5; attempts++; } while (map.isWall(this.tx, this.ty) && attempts < 8);
        }
        const dx = this.tx - this.x, dy = this.ty - this.y, d = Math.hypot(dx, dy);
        if (d > 4) {
            const nx = (dx / d) * this.spd, ny = (dy / d) * this.spd;
            if (!map.isWall(this.x + nx, this.y)) this.x += nx;
            if (!map.isWall(this.x, this.y + ny)) this.y += ny;
        }
        const pdx = p.x - this.x; this.f = pdx < 0 ? -1 : pdx > 0 ? 1 : this.f;
    }
    draw(ctx) {
        ctx.save(); ctx.translate(this.x, this.y);
        if (this.f === 1) ctx.scale(-1, 1);
        const pulse = 1 + Math.sin(Date.now() / 180) * 0.07;
        ctx.fillStyle = this.phase === 3 ? '#C0392B' : this.phase === 2 ? '#E74C3C' : '#8E44AD';
        ctx.beginPath(); ctx.arc(0, 0, this.s / 2 * pulse, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(-9, -9, 7, 0, Math.PI * 2); ctx.arc(9, -9, 7, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#E74C3C'; ctx.beginPath(); ctx.arc(-9 + Math.sin(Date.now() / 90), -9, 3.5, 0, Math.PI * 2); ctx.arc(9 + Math.sin(Date.now() / 90), -9, 3.5, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#000'; ctx.fillRect(-this.s / 2, -this.s / 2 - 9, this.s, 5);
        ctx.fillStyle = this.phase === 3 ? '#C0392B' : '#E74C3C'; ctx.fillRect(-this.s / 2 + 1, -this.s / 2 - 7, (this.s - 2) * (this.hp / this.mhp), 3);
        ctx.fillStyle = '#FFF'; ctx.font = 'bold 12px monospace'; ctx.textAlign = 'center'; ctx.fillText(`BOSS ${~~this.hp}`, 0, -this.s / 2 - 11);
        ctx.restore();
    }
}

class Player extends Ent {
    constructor(x, y, perm, w) {
        super(x, y, 28, '#FFF');
        this.mhp = 3 + perm.hp; this.hp = this.mhp;
        this.bspd = 5 + perm.spd * 0.3; this.spd = this.bspd;
        this.bdmg = 1 + perm.dmg * 0.5; this.dmg = this.bdmg;
        this.lvl = 1; this.exp = 0; this.expReq = 100;
        this.cd = 0; this.inv = 0; this.f = 1;
        this.crit = perm.crit * 0.05; this.arm = perm.arm * 0.5;
        this.expMul = 1 + perm.exp * 0.1; this.w = w;
        this.magnet = 0; this.shield = false;
    }
    update(inp, enemies, map) {
        let dx = 0, dy = 0;
        if (inp.keys.w || inp.keys.arrowup) dy = -1;
        if (inp.keys.s || inp.keys.arrowdown) dy = 1;
        if (inp.keys.a || inp.keys.arrowleft) { dx = -1; this.f = -1; }
        if (inp.keys.d || inp.keys.arrowright) { dx = 1; this.f = 1; }
        if (dx !== 0 || dy !== 0) {
            const l = Math.hypot(dx, dy);
            const nx = (dx / l) * this.spd, ny = (dy / l) * this.spd;
            if (!map.isWall(this.x + nx, this.y)) this.x += nx;
            if (!map.isWall(this.x, this.y + ny)) this.y += ny;
        }
        this.x = U.clamp(this.x, this.s / 2 + 5, map.W - this.s / 2 - 5);
        this.y = U.clamp(this.y, this.s / 2 + 5, map.H - this.s / 2 - 5);
        if (this.inv > 0) this.inv--;
        if (this.cd > 0) this.cd--;
        if (this.cd <= 0) {
            let near = null, minD = 250;
            for (let e of enemies) { const d = U.dist(this, e); if (d < minD) { minD = d; near = e; } }
            return near;
        }
        return null;
    }
    shoot(t, bs) {
        if (!t) return;
        const crit = Math.random() < this.crit;
        const cds = { single: 15, dual: 11, shotgun: 25, spread: 18, rapid: 5, laser: 28 };
        switch (this.w) {
            case 'single': bs.push(new Bullet(this.x, this.y, t.x, t.y, this.dmg, crit)); break;
            case 'dual': bs.push(new Bullet(this.x - 6, this.y, t.x, t.y, this.dmg * 0.8, crit)); bs.push(new Bullet(this.x + 6, this.y, t.x, t.y, this.dmg * 0.8, crit)); break;
            case 'shotgun': for (let i = -2; i <= 2; i++) { const a = Math.atan2(t.y - this.y, t.x - this.x) + i * 0.2; bs.push(new Bullet(this.x, this.y, this.x + Math.cos(a) * 300, this.y + Math.sin(a) * 300, this.dmg * 0.6, crit)); } break;
            case 'spread': for (let i = 0; i < 6; i++) { const a = (Math.PI * 2 * i) / 6; bs.push(new Bullet(this.x, this.y, this.x + Math.cos(a) * 300, this.y + Math.sin(a) * 300, this.dmg * 0.55, crit)); } break;
            case 'rapid': const sp = (Math.random() - 0.5) * 0.3, a = Math.atan2(t.y - this.y, t.x - this.x) + sp; bs.push(new Bullet(this.x, this.y, this.x + Math.cos(a) * 300, this.y + Math.sin(a) * 300, this.dmg * 0.7, crit, 12)); break;
            case 'laser': bs.push(new Bullet(this.x, this.y, t.x, t.y, this.dmg * 2.2, crit, 15)); break;
        }
        this.cd = cds[this.w] || 15; SND.shoot();
    }
    gainExp(a, ps) {
        const fa = a * this.expMul; this.exp += fa;
        if (this.exp >= this.expReq) {
            this.exp -= this.expReq; this.lvl++;
            this.expReq = ~~(this.expReq * 1.2); this.hp = Math.min(this.mhp + 1, this.hp + 1);
            SND.lvl(); if (ps) ps.explode(this.x, this.y, '#FFD700', 12); return true;
        }
        return false;
    }
    takeDamage(dmg) {
        if (this.shield || this.inv > 0) return false;
        this.hp -= Math.max(1, dmg - this.arm); this.inv = 40; SND.hit(); return this.hp <= 0;
    }
    draw(ctx) {
        ctx.save(); ctx.translate(this.x, this.y);
        if (this.inv > 0 && ~~(Date.now() / 40) % 2) ctx.globalAlpha = 0.5;
        if (this.f === -1) ctx.scale(-1, 1);
        if (this.shield) { ctx.strokeStyle = '#F1C40F'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 24, 0, Math.PI * 2); ctx.stroke(); }
        ctx.fillStyle = '#FFE4C4'; ctx.fillRect(-14, -22, 28, 44);
        ctx.fillStyle = '#FFF'; ctx.beginPath(); ctx.arc(0, -18, 14, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#000'; ctx.fillRect(-5, -20, 2, 2); ctx.fillRect(3, -20, 2, 2);
        ctx.restore();
    }
}

// ===================== 地图系统 =====================
class Map {
    constructor(W, H) {
        this.W = W; this.H = H;
        this.cols = Math.ceil(W / CFG.TILE);
        this.rows = Math.ceil(H / CFG.TILE);
        this.tiles = []; this.rooms = [];
        this.generate();
    }
    generate() {
        for (let y = 0; y < this.rows; y++) { this.tiles[y] = []; for (let x = 0; x < this.cols; x++) this.tiles[y][x] = 1; }
        this.rooms = [];
        for (let i = 0; i < 8; i++) {
            const w = 5 + Math.floor(Math.random() * 7), h = 5 + Math.floor(Math.random() * 7);
            const x = 2 + Math.floor(Math.random() * (this.cols - w - 4)), y = 2 + Math.floor(Math.random() * (this.rows - h - 4));
            let overlap = false;
            for (let r of this.rooms) if (x < r.x + r.w + 2 && x + w + 2 > r.x && y < r.y + r.h + 2 && y + h + 2 > r.y) { overlap = true; break; }
            if (!overlap) {
                this.rooms.push({ x, y, w, h, cx: Math.floor(x + w / 2), cy: Math.floor(y + h / 2) });
                for (let ry = y; ry < y + h; ry++) for (let rx = x; rx < x + w; rx++) this.tiles[ry][rx] = 0;
            }
        }
        if (this.rooms.length < 3) return this.generate();
        for (let i = 0; i < this.rooms.length - 1; i++) {
            const r1 = this.rooms[i], r2 = this.rooms[i + 1];
            let x = r1.cx, y = r1.cy;
            while (x !== r2.cx) { this.tiles[y][x] = 0; x += x < r2.cx ? 1 : -1; }
            while (y !== r2.cy) { this.tiles[y][x] = 0; y += y < r2.cy ? 1 : -1; }
        }
        this.startRoom = this.rooms[0]; this.bossRoom = this.rooms[this.rooms.length - 1];
    }
    isWall(x, y) {
        const tx = Math.floor(x / CFG.TILE), ty = Math.floor(y / CFG.TILE);
        if (tx < 0 || tx >= this.cols || ty < 0 || ty >= this.rows) return true;
        return this.tiles[ty][tx] === 1;
    }
    draw(ctx, cx, cy) {
        const sc = Math.floor(cx / CFG.TILE), ec = sc + Math.ceil(ctx.canvas.width / CFG.TILE) + 1;
        const sr = Math.floor(cy / CFG.TILE), er = sr + Math.ceil(ctx.canvas.height / CFG.TILE) + 1;
        ctx.strokeStyle = '#3d2b3e'; ctx.lineWidth = 2;
        for (let y = Math.max(0, sr); y < Math.min(this.rows, er); y++)
            for (let x = Math.max(0, sc); x < Math.min(this.cols, ec); x++)
                if (this.tiles[y][x] === 1) { ctx.fillStyle = '#1a0f1a'; ctx.fillRect(x * CFG.TILE, y * CFG.TILE, CFG.TILE, CFG.TILE); ctx.strokeRect(x * CFG.TILE, y * CFG.TILE, CFG.TILE, CFG.TILE); }
    }
    drawMM(ctx, px, py, explored, current) {
        if (!DB.load().settings.minimap) return;
        const ms = 90, mx = ctx.canvas.width - ms - 12, my = 12, scale = ms / Math.max(this.cols, this.rows);
        ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.fillRect(mx, my, ms, ms); ctx.strokeStyle = '#555'; ctx.strokeRect(mx, my, ms, ms);
        for (let r of this.rooms) {
            if (!explored.has(this.rooms.indexOf(r))) continue;
            ctx.fillStyle = r === this.rooms[current] ? '#3498DB' : r === this.bossRoom ? '#E74C3C' : 'rgba(100,100,100,0.5)';
            ctx.fillRect(mx + r.x * scale, my + r.y * scale, r.w * scale, r.h * scale);
        }
        ctx.fillStyle = '#FFD700'; ctx.beginPath(); ctx.arc(mx + (px / CFG.TILE) * scale, my + (py / CFG.TILE) * scale, 2, 0, Math.PI * 2); ctx.fill();
    }
}

// ===================== 游戏主类 =====================
class Game {
    constructor(w, daily) {
        this.cv = document.getElementById('gameCanvas');
        this.cx = this.cv.getContext('2d');
        this.resize(); window.addEventListener('resize', () => this.resize());
        this.save = DB.load(); SND.vol = this.save.settings.vol;
        this.map = new Map(this.cv.width, this.cv.height);
        const sr = this.map.startRoom;
        this.p = new Player(sr.cx * CFG.TILE + CFG.TILE / 2, sr.cy * CFG.TILE + CFG.TILE / 2, this.save.perm, w);
        this.enemies = []; this.bullets = []; this.ps = new PSys(); this.pups = [];
        this.wave = 1; this.wt = 0; this.gt = 0; this.kills = 0; this.gold = 0;
        this.boss = null; this.over = false; this.paused = false; this.upgrading = false; this.upgs = [];
        this.daily = daily; this.run = { dmg: 0, exp: 0, boss: 0, pup: 0 };
        this.newAch = []; this.achPop = null;
        this.explored = new Set(); this.curRoom = this.getRoomAt(this.p.x, this.p.y); this.explored.add(this.curRoom);
        this.cam = { x: 0, y: 0 }; this.inp = { keys: {} };
        window.addEventListener('keydown', e => {
            this.inp.keys[e.key.toLowerCase()] = true;
            if (e.key === 'Escape') this.togglePause();
            if (e.key >= '1' && e.key <= '3' && this.upgrading) this.pickUpg(parseInt(e.key) - 1);
            if (e.key === 'm' || e.key === 'M') { this.save.settings.minimap = !this.save.settings.minimap; DB.save(this.save); }
            if (e.key === 'p' || e.key === 'P') { this.save.settings.particles = !this.save.settings.particles; DB.save(this.save); }
        });
        window.addEventListener('keyup', e => this.inp.keys[e.key.toLowerCase()] = false);
        this.loop = this.loop.bind(this); SND.setup();
    }
    resize() { this.cv.width = window.innerWidth; this.cv.height = window.innerHeight; this.map && this.map.generate(); }
    togglePause() { if (!this.over && !this.upgrading) this.paused = !this.paused; }
    getRoomAt(x, y) {
        const tx = Math.floor(x / CFG.TILE), ty = Math.floor(y / CFG.TILE);
        for (let i = 0; i < this.map.rooms.length; i++) { const r = this.map.rooms[i]; if (tx >= r.x && tx < r.x + r.w && ty >= r.y && ty < r.y + r.h) return i; }
        return -1;
    }
    updateCam() { const tx = this.p.x - this.cv.width / 2, ty = this.p.y - this.cv.height / 2; this.cam.x += Math.max(-12, Math.min(12, (tx - this.cam.x) * 0.08)); this.cam.y += Math.max(-12, Math.min(12, (ty - this.cam.y) * 0.08)); this.cam.x = U.clamp(this.cam.x, 0, this.map.W - this.cv.width); this.cam.y = U.clamp(this.cam.y, 0, this.map.H - this.cv.height); }
    checkAch() {
        const checks = [{ id: 'first', c: this.kills >= 1 }, { id: 'survive', c: this.gt >= 300 }, { id: 'wave10', c: this.wave >= 10 }, { id: 'boss', c: this.run.boss >= 1 }, { id: 'explore', c: this.explored.size >= this.map.rooms.length }, { id: 'rich', c: this.gold >= 1000 }, { id: 'lvl20', c: this.p.lvl >= 20 }, { id: 'k100', c: this.save.kills + this.kills >= 100 }, { id: 'k1000', c: this.save.kills + this.kills >= 1000 }];
        checks.forEach(ch => { if (ch.c && DB.unlock(ch.id)) { this.newAch.push(ACH[ch.id]); this.achPop || setTimeout(() => { if (this.newAch.length > 0) { this.achPop = { a: this.newAch.shift(), t: 180 }; SND.ach(); } }, 100); } });
    }
    spawnEn() {
        if (this.enemies.length >= CFG.MAX_E) return;
        const r = this.map.rooms[Math.floor(Math.random() * this.map.rooms.length)];
        const x = (r.x + 1 + Math.random() * (r.w - 2)) * CFG.TILE, y = (r.y + 1 + Math.random() * (r.h - 2)) * CFG.TILE;
        const types = ['chick', 'pig']; if (this.wave > 2) types.push('sheep'); if (this.wave > 4) types.push('cow', 'fox'); if (this.wave > 6) types.push('bull');
        this.enemies.push(new Enemy(x, y, types[~~(Math.random() * types.length)]));
    }
    spawnPup(x, y) { if (Math.random() > 0.1) return; this.pups.push(new Powerup(x, y, Object.keys(PUP_DEF)[~~(Math.random() * 6)])); }
    spawnBoss() { const br = this.map.bossRoom; this.boss = new Boss(br.cx * CFG.TILE + CFG.TILE / 2, br.cy * CFG.TILE + CFG.TILE / 2); SND.boss(); }
    pickUpg(i) { if (i >= 0 && i < this.upgs.length) { this.upgs[i].a(); this.upgrading = false; this.upgs = []; SND.lvl(); } }
    genUpgs() { const all = [{ n: '伤害+0.5', a: () => this.p.dmg += 0.5 }, { n: '生命+1', a: () => { this.p.mhp++; this.p.hp++; } }, { n: '移速+0.5', a: () => this.p.spd += 0.5 }, { n: '暴击+5%', a: () => this.p.crit += 0.05 }, { n: '护甲+0.5', a: () => this.p.arm += 0.5 }, { n: '经验+10%', a: () => this.p.expMul += 0.1 }]; return all.sort(() => 0.5 - Math.random()).slice(0, 3); }
    update() {
        if (this.paused || this.over || this.upgrading) { if (this.achPop && this.achPop.t > 0) this.achPop.t--; return; }
        this.updateCam(); this.gt += 1 / 60; this.wt++; this.checkAch();
        const newRoom = this.getRoomAt(this.p.x, this.p.y);
        if (newRoom !== -1 && newRoom !== this.curRoom) { this.curRoom = newRoom; this.explored.add(newRoom); }
        if (this.achPop) { this.achPop.t--; if (this.achPop.t <= 0) this.achPop = null; }
        const sr = this.boss ? 40 : Math.max(18, 80 - this.wave * 3);
        if (this.wt % sr === 0) this.spawnEn();
        if (!this.boss && this.wave % 5 === 0 && this.wt === 400) this.spawnBoss();
        if (!this.boss && this.wt % 1000 === 0) this.wave++;
        const t = this.p.update(this.inp, this.boss ? [this.boss, ...this.enemies] : this.enemies, this.map);
        if (t) this.p.shoot(t, this.bullets);
        for (let p of this.pups) p.update();
        for (let i = this.pups.length - 1; i >= 0; i--) {
            const p = this.pups[i], d = U.dist(this.p, p);
            if (d < this.p.s / 2 + p.s / 2 || (this.p.magnet > 0 && d < this.p.magnet)) {
                PUP_DEF[p.t].e(this.p, this.enemies, this.ps);
                if (p.t === 'bomb') { this.enemies.filter(e => e.hp <= 0).forEach(e => { this.p.gainExp(e.exp, this.ps); this.gold += e.g; this.kills++; }); this.enemies = this.enemies.filter(e => e.hp > 0); }
                this.run.pup++; SND.power(); this.pups.splice(i, 1);
            }
        }
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i]; b.update(this.map.W, this.map.H); if (!b.a) { this.bullets.splice(i, 1); continue; }
            if (this.boss && U.dist(b, this.boss) < this.boss.s / 2 + 7) {
                b.a = false; this.boss.hp -= b.dmg; this.run.dmg += b.dmg; this.ps.dmg(this.boss.x, this.boss.y - 35, b.dmg, b.crit);
                if (this.boss.hp <= 0) { this.ps.explode(this.boss.x, this.boss.y, '#8E44AD', 30, 5); this.p.gainExp(200, this.ps); this.gold += 50; this.spawnPup(this.boss.x, this.boss.y); this.run.boss++; this.run.exp += 200; this.boss = null; this.wave++; SND.explode(); }
            }
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const e = this.enemies[j]; if (U.dist(b, e) < e.s / 2 + 7) {
                    b.a = false; e.hp -= b.dmg; this.run.dmg += b.dmg; this.ps.dmg(e.x, e.y - 12, b.dmg, b.crit); this.ps.explode(e.x, e.y, '#FFF', 3, 2);
                    if (e.hp <= 0) { this.enemies.splice(j, 1); const lv = this.p.gainExp(e.exp, this.ps); this.run.exp += e.exp; this.gold += e.g; this.spawnPup(e.x, e.y); this.ps.explode(e.x, e.y, e.c, 6); SND.explode(); this.kills++; if (lv) { this.upgrading = true; this.upgs = this.genUpgs(); } }
                    break;
                }
            }
        }
        if (this.boss) { this.boss.update(this.p, this.map); if (U.dist(this.boss, this.p) < this.boss.s / 2 + 20) if (this.p.takeDamage(2)) return this.end(); }
        for (let i = this.enemies.length - 1; i >= 0; i--) { const e = this.enemies[i]; e.update(this.p, this.map); if (U.dist(e, this.p) < e.s / 2 + 14) if (this.p.takeDamage(1)) return this.end(); }
        this.ps.update();
    }
    draw() {
        this.cx.save(); this.cx.translate(-this.cam.x, -this.cam.y);
        const sr = this.ps.shakeScreen(this.cx);
        this.cx.fillStyle = '#2d1b2e'; this.cx.fillRect(this.cam.x, this.cam.y, this.cv.width, this.cv.height);
        this.map.draw(this.cx, this.cam.x, this.cam.y);
        this.ps.draw(this.cx);
        for (let p of this.pups) p.draw(this.cx);
        for (let b of this.bullets) b.draw(this.cx);
        if (this.boss) this.boss.draw(this.cx);
        for (let e of this.enemies) e.draw(this.cx);
        this.p.draw(this.cx);
        if (sr) sr();
        this.cx.restore();
        this.drawUI();
    }
    drawUI() {
        const c = this.cx; c.fillStyle = '#FFF'; c.font = '13px monospace'; c.textAlign = 'left';
        let y = 22; c.fillText(`HP:${'❤️'.repeat(Math.max(0, this.p.hp))}${'🖤'.repeat(Math.max(0, this.p.mhp - this.p.hp))}`, 10, y); y += 18;
        c.fillText(`Lv:${this.p.lvl}`, 10, y); y += 18; c.fillText(`EXP:${~~this.p.exp}/${this.p.expReq}`, 10, y); y += 18;
        c.fillText(`Wave:${this.wave}${this.boss ? '⚠️' : ''}`, 10, y); y += 18; c.fillText(`Room:${this.explored.size}/${this.map.rooms.length}`, 10, y); y += 18;
        const m = ~~(this.gt / 60), s = ~~(this.gt % 60); c.fillText(`Time:${m}:${s.toString().padStart(2, '0')}`, 10, y); y += 18;
        c.fillText(`K:${this.kills} G:${this.gold}`, 10, y);
        this.map.drawMM(c, this.p.x, this.p.y, this.explored, this.curRoom);
        if (this.achPop) { c.save(); c.globalAlpha = Math.min(1, this.achPop.t / 30); c.fillStyle = 'rgba(241,196,15,0.9)'; c.fillRect(this.cv.width / 2 - 115, 55, 230, 50); c.fillStyle = '#000'; c.font = 'bold 16px monospace'; c.textAlign = 'center'; c.fillText('🏆成就解锁!', this.cv.width / 2, 78); c.font = '14px monospace'; c.fillText(`${this.achPop.a.i} ${this.achPop.a.n}`, this.cv.width / 2, 95); c.restore(); }
        if (this.upgrading) { c.fillStyle = 'rgba(0,0,0,0.85)'; c.fillRect(0, 0, this.cv.width, this.cv.height); c.fillStyle = '#F1C40F'; c.font = 'bold 28px monospace'; c.textAlign = 'center'; c.fillText('升级选择', this.cv.width / 2, this.cv.height / 2 - 80); c.font = '12px monospace'; c.fillText('按 1-3 选择', this.cv.width / 2, this.cv.height / 2 - 55); for (let i = 0; i < this.upgs.length; i++) { const u = this.upgs[i], uy = this.cv.height / 2 - 25 + i * 50; c.fillStyle = '#3498DB'; c.fillRect(this.cv.width / 2 - 100, uy - 20, 200, 42); c.fillStyle = '#FFF'; c.font = 'bold 16px monospace'; c.fillText(`${i + 1}. ${u.n}`, this.cv.width / 2, uy + 5); } }
        if (this.paused) { c.fillStyle = 'rgba(0,0,0,0.7)'; c.fillRect(0, 0, this.cv.width, this.cv.height); c.fillStyle = '#FFF'; c.font = 'bold 44px monospace'; c.textAlign = 'center'; c.fillText('PAUSED', this.cv.width / 2, this.cv.height / 2); c.font = '14px monospace'; c.fillText('ESC:继续 | M:小地图 | P:粒子', this.cv.width / 2, this.cv.height / 2 + 35); }
    }
    end() {
        this.over = true; this.save.runs++; this.save.kills += this.kills; this.save.gold += this.gold;
        this.save.stats.dmg += this.run.dmg; this.save.stats.exp += this.run.exp; this.save.stats.boss += this.run.boss; this.save.stats.pup += this.run.pup;
        if (this.gt > this.save.bestTime) this.save.bestTime = this.gt; if (this.wave > this.save.bestWave) this.save.bestWave = this.wave;
        if (this.daily) this.save.daily.done = true; DB.save(this.save);
        this.cx.fillStyle = 'rgba(0,0,0,0.9)'; this.cx.fillRect(0, 0, this.cv.width, this.cv.height);
        this.cx.fillStyle = '#E74C3C'; this.cx.font = 'bold 52px monospace'; this.cx.textAlign = 'center'; this.cx.fillText('GAME OVER', this.cv.width / 2, this.cv.height / 2 - 80);
        this.cx.fillStyle = '#FFF'; this.cx.font = '22px monospace'; this.cx.fillText(`Wave:${this.wave} Kills:${this.kills} Lv:${this.p.lvl}`, this.cv.width / 2, this.cv.height / 2 - 30);
        const m = ~~(this.gt / 60), s = ~~(this.gt % 60); this.cx.font = '18px monospace'; this.cx.fillText(`Time:${m}m${s}s Gold:${this.gold}`, this.cv.width / 2, this.cv.height / 2 + 5);
        this.cx.fillStyle = '#3498DB'; this.cx.fillText(`Dmg:${~~this.run.dmg} Exp:${~~this.run.exp}`, this.cv.width / 2, this.cv.height / 2 + 38);
        this.cx.fillStyle = '#F1C40F'; this.cx.fillText(`Total:${this.save.gold}`, this.cv.width / 2, this.cv.height / 2 + 70);
        this.cx.fillStyle = '#AAA'; this.cx.font = '14px monospace'; this.cx.fillText('Press SPACE', this.cv.width / 2, this.cv.height / 2 + 110);
        setTimeout(() => window.addEventListener('keydown', e => { if (e.code === 'Space') showMenu(); }, { once: true }), 500);
    }
    loop() { this.update(); this.draw(); requestAnimationFrame(this.loop); }
}

// ===================== 菜单 =====================
function showMenu() {
    const s = DB.load(), today = new Date().toDateString();
    if (s.daily.date !== today) { s.daily.done = false; s.daily.date = today; DB.save(s); }
    const ac = Object.keys(s.ach).length, tc = Object.keys(ACH).length;
    const md = document.createElement('div'); md.id = 'menuScreen';
    md.innerHTML = `<div style="position:fixed;top:0;left:0;width:100%;height:100%;background:#2d1b2e;display:flex;flex-direction:column;align-items:center;color:white;z-index:9999;font-family:monospace;padding:10px;overflow-y:auto;"><h1 style="font-size:34px;margin:6px 0;">🐄肉鸽牛牛</h1><p style="font-size:13px;color:#aaa;margin-bottom:8px;">v3.0 ULTIMATE | 🏆${ac}/${tc}</p><div style="background:linear-gradient(135deg,#8E44AD,#3498DB);padding:8px 18px;border-radius:10px;margin-bottom:10px;cursor:pointer;" onclick="startDaily()"><h3 style="margin:0;font-size:14px;">🏆每日挑战</h3><p style="margin:2px 0;font-size:11px;">今日:无尽模式</p><p style="margin:0;font-size:9px;color:#FFD700;">${s.daily.done ? '✅已完成' : '⚡可挑战'}</p></div><div style="display:flex;gap:10px;flex-wrap:wrap;justify-content:center;width:100%;max-width:1000px;"><div style="background:rgba(255,255,255,0.1);padding:10px;border-radius:10px;min-width:130px;"><h3 style="color:#F1C40F;margin:0 0 6px;font-size:14px;">💰${s.gold}</h3><p style="margin:2px 0;font-size:10px;">击杀:${s.kills}</p><p style="margin:2px 0;font-size:10px;">局数:${s.runs}</p><p style="margin:2px 0;font-size:10px;">最佳:${s.bestWave}波</p></div><div style="background:rgba(255,255,255,0.1);padding:10px;border-radius:10px;flex:1;min-width:180px;"><h3 style="color:#3498DB;margin:0 0 6px;font-size:14px;">⚔️升级</h3>${rUpg(s, 'dmg', '攻击', 100, '🗡️')}${rUpg(s, 'hp', '生命', 80, '❤️')}${rUpg(s, 'spd', '移速', 120, '👟')}${rUpg(s, 'exp', '经验', 150, '💎')}</div><div style="background:rgba(255,255,255,0.1);padding:10px;border-radius:10px;min-width:130px;"><h3 style="color:#E74C3C;margin:0 0 6px;font-size:14px;">🔫武器</h3>${rWep('single', '单发', true)}${rWep('dual', '双枪', s.gold >= 200)}${rWep('shotgun', '霰弹', s.gold >= 500)}${rWep('spread', '环射', s.gold >= 800)}${rWep('rapid', '速射', s.gold >= 1000)}${rWep('laser', '激光', s.gold >= 1500)}</div><div style="background:rgba(255,255,255,0.1);padding:10px;border-radius:10px;min-width:130px;"><h3 style="color:#9B59B6;margin:0 0 6px;font-size:14px;">📊统计</h3><p style="margin:2px 0;font-size:9px;">伤害:${~~s.stats.dmg}</p><p style="margin:2px 0;font-size:9px;">经验:${~~s.stats.exp}</p><p style="margin:2px 0;font-size:9px;">BOSS:${s.stats.boss}</p><p style="margin:2px 0;font-size:9px;">道具:${s.stats.pup}</p><button onclick="showAch()" style="margin-top:6px;padding:4px 8px;background:#F1C40F;color:#000;border:none;border-radius:5px;cursor:pointer;font-size:9px;">成就(${ac}/${tc})</button></div><div style="background:rgba(255,255,255,0.1);padding:10px;border-radius:10px;min-width:130px;"><h3 style="color:#1ABC9C;margin:0 0 6px;font-size:14px;">⚙️设置</h3><p style="margin:2px 0;font-size:10px;">音量:${~~(s.settings.vol * 100)}%</p><input type="range" min="0" max="100" value="${~~(s.settings.vol * 100)}" onchange="localStorage.setItem('RC3_TMP_VOL',this.value/100)" style="width:100%;"><p style="margin:4px 0 2px;font-size:9px;color:#aaa;">M:小地图 | P:粒子</p></div></div><button onclick="startNormal()" style="margin-top:10px;padding:8px 35px;font-size:18px;background:#E74C3C;color:white;border:none;border-radius:10px;cursor:pointer;">开始游戏</button><p style="margin-top:8px;font-size:10px;color:#666;">WASD移动 • 自动攻击 • ESC暂停</p></div>`;
    document.body.appendChild(md);
    let sw = 'single';
    document.querySelectorAll('.wep-btn').forEach(b => {
        b.onclick = () => {
            if (b.dataset.lk === 'true') return;
            document.querySelectorAll('.wep-btn').forEach(x => { x.style.borderColor = 'transparent'; x.style.background = 'rgba(0,0,0,0.3)'; });
            b.style.borderColor = '#F1C40F'; b.style.background = 'rgba(241,196,15,0.3)'; sw = b.dataset.w;
        };
    });
    window.startNormal = () => {
        const v = localStorage.getItem('RC3_TMP_VOL'); if (v) { const s = DB.load(); s.settings.vol = parseFloat(v); DB.save(s); localStorage.removeItem('RC3_TMP_VOL'); }
        SND.click(); const m = document.getElementById('menuScreen'); if (m) m.remove(); new Game(sw, false).loop();
    };
    window.startDaily = () => { if (s.daily.done) { alert('今日已完成!'); return; } SND.click(); const m = document.getElementById('menuScreen'); if (m) m.remove(); new Game('single', true).loop(); };
    window.showAch = () => {
        const ad = document.createElement('div'); ad.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#1a1a1a;padding:18px;border-radius:15px;max-height:80vh;overflow-y:auto;z-index:10000;color:white;font-family:monospace;min-width:300px;';
        let h = '<h2 style="text-align:center;margin:0 0 12px;font-size:20px;">🏆成就</h2>';
        for (let [id, a] of Object.entries(ACH)) { const u = s.ach[id]; h += `<div style="padding:6px;margin:3px 0;background:${u ? 'rgba(39,174,96,0.3)' : 'rgba(0,0,0,0.3)'};border-radius:5px;opacity:${u ? 1 : 0.5};"><span style="font-size:16px;margin-right:5px;">${a.i}</span><b style="font-size:13px;">${a.n}</b><br><small style="font-size:10px;">${a.d}</small>${u ? '<span style="float:right;color:#27AE60;">✓</span>' : ''}</div>`; }
        h += '<button onclick="this.parentElement.remove()" style="margin-top:8px;width:100%;padding:8px;background:#E74C3C;color:white;border:none;border-radius:5px;cursor:pointer;">关闭</button>';
        ad.innerHTML = h; document.body.appendChild(ad);
    };
}
function rUpg(s, t, n, bc, i) {
    const l = s.perm[t], mx = { dmg: 10, hp: 10, spd: 5, exp: 10, crit: 5, arm: 5 }[t], c = bc + l * 50, ca = s.gold >= c, im = l >= mx;
    return `<div style="display:flex;justify-content:space-between;align-items:center;margin:2px 0;padding:4px;background:rgba(0,0,0,0.3);border-radius:5px;font-size:10px;"><span>${i}${n}:${l}/${mx}</span><button onclick="bUpg('${t}')"${!ca || im ? ' disabled' : ''} style="padding:2px 6px;background:${im ? '#666' : ca ? '#27AE60' : '#666'};color:white;border:none;border-radius:3px;cursor:${im || !ca ? 'not-allowed' : 'pointer'};font-size:9px;">${im ? 'MAX' : c + '💰'}</button></div>`;
}
function rWep(id, n, u) { return `<div class="wep-btn" data-w="${id}" data-lk="${!u}" style="padding:4px;margin:2px 0;background:${!u ? '#333' : id === 'single' ? 'rgba(241,196,15,0.3)' : 'rgba(0,0,0,0.3)'};border-radius:5px;border:2px solid ${id === 'single' ? '#F1C40F' : 'transparent'};cursor:${!u ? 'not-allowed' : 'pointer'};opacity:${!u ? 0.5 : 1};font-size:10px;">${!u ? '🔒' : ''}${n}</div>`; }
function bUpg(t) {
    const s = DB.load(), bc = { dmg: 100, hp: 80, spd: 120, exp: 150, crit: 200, arm: 100 }, c = bc[t] + s.perm[t] * 50, mx = { dmg: 10, hp: 10, spd: 5, exp: 10, crit: 5, arm: 5 }[t];
    if (s.perm[t] >= mx) return; if (s.gold >= c) { s.gold -= c; s.perm[t]++; DB.save(s); SND.click(); const m = document.getElementById('menuScreen'); if (m) m.remove(); showMenu(); }
}
window.onload = () => { showMenu(); console.log('🐄 Roguelike Cow v3.0 ULTIMATE Ready!'); };
// ============================================================================
// END OF GAME
// ============================================================================
