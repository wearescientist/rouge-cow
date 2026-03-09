// 肉鸽牛牛 v2.4 - Achievements & Stats
const Utils = { distance: (a, b) => Math.hypot(a.x - b.x, a.y - b.y), clamp: (val, min, max) => Math.max(min, Math.min(max, val)) };

// ========== 存储 ==========
const SaveSystem = {
    KEY: 'rogueCow_save_v24',
    load() {
        const data = localStorage.getItem(this.KEY);
        return data ? JSON.parse(data) : {
            gold: 0, totalKills: 0, totalRuns: 0, bestTime: 0, bestWave: 0, bestLevel: 0,
            permanent: { damage: 0, hp: 0, speed: 0, expGain: 0, critChance: 0, armor: 0 },
            unlockedWeapons: ['single'], dailyCompleted: false, lastDaily: null,
            achievements: {}, stats: { totalDamage: 0, totalExp: 0, bossesKilled: 0, powerupsUsed: 0 }
        };
    },
    save(data) { localStorage.setItem(this.KEY, JSON.stringify(data)); },
    unlockAchievement(id) {
        const save = this.load();
        if (!save.achievements[id]) {
            save.achievements[id] = { unlocked: true, date: new Date().toISOString() };
            this.save(save);
            return true;
        }
        return false;
    }
};

// ========== 成就定义 ==========
const ACHIEVEMENTS = {
    first_blood: { name: '第一滴血', desc: '击杀第一个敌人', icon: '🩸' },
    survivor: { name: '幸存者', desc: '存活超过5分钟', icon: '⏱️' },
    wave_10: { name: '波次大师', desc: '达到第10波', icon: '🌊' },
    boss_slayer: { name: 'BOSS杀手', desc: '击败第一个BOSS', icon: '👑' },
    rich: { name: '富豪', desc: '单局获得1000金币', icon: '💰' },
    level_20: { name: '满级大佬', desc: '达到20级', icon: '⭐' },
    killer_100: { name: '百人斩', desc: '累计击杀100个敌人', icon: '💀' },
    killer_1000: { name: '千人斩', desc: '累计击杀1000个敌人', icon: '☠️' },
    powerup_master: { name: '道具大师', desc: '使用50个道具', icon: '🎁' },
    untouchable: { name: '无伤通关', desc: '无伤击败BOSS', icon: '🛡️' },
    speedrun: { name: '速通者', desc: '3分钟内达到第5波', icon: '⚡' },
    collector: { name: '收藏家', desc: '解锁所有武器', icon: '🔫' }
};

// ========== 每日挑战 ==========
const DailyChallenge = {
    getTodaySeed() { const d = new Date(); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); },
    getModifiers() {
        const modifiers = [
            { name: '极速模式', desc: '敌人移速+50%', apply: (e) => e.speed *= 1.5 },
            { name: '经验狂潮', desc: '经验获取+100%', apply: () => {} },
            { name: '无尽波次', desc: '波次间隔减半', apply: () => {} }
        ];
        return modifiers[this.getTodaySeed() % modifiers.length];
    }
};

// ========== 道具 ==========
const POWERUPS = {
    health: { color: '#E74C3C', icon: '❤️', effect: (p) => { p.hp = Math.min(p.maxHp + 2, p.hp + 5); } },
    speed: { color: '#3498DB', icon: '⚡', effect: (p) => { p.speed *= 1.5; setTimeout(() => p.speed /= 1.5, 5000); } },
    damage: { color: '#E67E22', icon: '💪', effect: (p) => { p.damage *= 2; setTimeout(() => p.damage /= 2, 5000); } },
    magnet: { color: '#9B59B6', icon: '🧲', effect: (p) => { p.magnetRange = 300; setTimeout(() => p.magnetRange = 0, 8000); } },
    shield: { color: '#F1C40F', icon: '🛡️', effect: (p) => { p.shield = true; setTimeout(() => p.shield = false, 5000); } },
    bomb: { color: '#C0392B', icon: '💣', effect: (p, enemies, particles) => { enemies.forEach(e => { e.hp -= 10; particles.createExplosion(e.x, e.y, '#C0392B', 5); }); } }
};

// ========== 音频 ==========
const AudioSynth = {
    ctx: null, volume: 0.3,
    init() { window.AudioContext = window.AudioContext || window.webkitAudioContext; this.ctx = new AudioContext(); },
    resume() { if (this.ctx?.state === 'suspended') this.ctx.resume(); },
    playTone(freq, duration, type = 'square', vol = 0.1) {
        if (!this.ctx) this.init();
        this.resume();
        const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.frequency.value = freq;
        osc.type = type;
        gain.gain.setValueAtTime(vol * this.volume, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },
    shoot() { this.playTone(440, 0.1); },
    hit() { this.playTone(200, 0.15, 'sawtooth'); },
    explosion() { this.playTone(150, 0.3, 'sawtooth'); },
    levelUp() { this.playTone(523, 0.2); setTimeout(() => this.playTone(659, 0.2), 100); setTimeout(() => this.playTone(784, 0.4), 200); },
    click() { this.playTone(880, 0.05); },
    bossSpawn() { this.playTone(150, 0.3); setTimeout(() => this.playTone(100, 0.4), 300); },
    powerup() { this.playTone(600, 0.1); setTimeout(() => this.playTone(800, 0.15), 100); },
    achievement() { this.playTone(523, 0.1); setTimeout(() => this.playTone(659, 0.1), 100); setTimeout(() => this.playTone(784, 0.1), 200); setTimeout(() => this.playTone(1047, 0.3), 300); }
};

// ========== 粒子 ==========
class ParticleSystem {
    constructor() { this.particles = []; this.damageNumbers = []; this.shake = 0; }
    createExplosion(x, y, color = '#FFF', count = 10, force = 4) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            this.particles.push({ x, y, vx: Math.cos(angle) * force, vy: Math.sin(angle) * force, life: 30, color, size: 4, decay: 0.95 });
        }
        this.shake = 10;
    }
    createHitEffect(x, y) { for (let i = 0; i < 5; i++) this.particles.push({ x, y, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6, life: 20, color: '#FFF', size: 3, decay: 0.9 }); }
    addDamageNumber(x, y, damage, isCrit = false) { this.damageNumbers.push({ x, y, text: isCrit ? `CRIT ${Math.floor(damage)}!` : Math.floor(damage).toString(), life: 40, vy: -2, color: isCrit ? '#FFD700' : '#FFF', size: isCrit ? 24 : 16 }); }
    screenShake(ctx) {
        if (this.shake > 0) { const dx = (Math.random() - 0.5) * this.shake, dy = (Math.random() - 0.5) * this.shake; ctx.translate(dx, dy); this.shake *= 0.9; if (this.shake < 0.5) this.shake = 0; return () => ctx.translate(-dx, -dy); }
        return null;
    }
    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) { const p = this.particles[i]; p.x += p.vx; p.y += p.vy; p.life--; p.size *= p.decay || 0.95; if (p.life <= 0) this.particles.splice(i, 1); }
        for (let i = this.damageNumbers.length - 1; i >= 0; i--) { const d = this.damageNumbers[i]; d.y += d.vy; d.life--; if (d.life <= 0) this.damageNumbers.splice(i, 1); }
    }
    draw(ctx) {
        for (let p of this.particles) { ctx.globalAlpha = p.life / 30; ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); }
        ctx.globalAlpha = 1;
        for (let d of this.damageNumbers) { ctx.globalAlpha = d.life / 40; ctx.fillStyle = d.color; ctx.font = `bold ${d.size}px monospace`; ctx.textAlign = 'center'; ctx.fillText(d.text, d.x, d.y); }
        ctx.textAlign = 'left'; ctx.globalAlpha = 1;
    }
}

// ========== 实体 ==========
class Entity { constructor(x, y, size, color) { this.x = x; this.y = y; this.size = size; this.color = color; this.vx = 0; this.vy = 0; this.active = true; } }
class Powerup extends Entity {
    constructor(x, y, type) { const p = POWERUPS[type]; super(x, y, 30, p.color); this.type = type; this.icon = p.icon; this.bobOffset = Math.random() * Math.PI * 2; }
    update() { this.bobOffset += 0.1; }
    draw(ctx) { const bob = Math.sin(this.bobOffset) * 5; ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y + bob, this.size / 2, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#FFF'; ctx.font = '20px monospace'; ctx.textAlign = 'center'; ctx.fillText(this.icon, this.x, this.y + bob + 7); ctx.textAlign = 'left'; }
}

class Boss extends Entity {
    constructor(x, y, type = 'wolf') {
        super(x, y, 100, '#8E44AD');
        this.type = type; this.maxHp = type === 'wolf' ? 100 : 150; this.hp = this.maxHp;
        this.speed = 1.5; this.phase = 1; this.attackTimer = 0; this.moveTimer = 0;
        this.targetX = x; this.targetY = y; this.facing = -1;
    }
    update(player, canvasWidth, canvasHeight) {
        this.attackTimer++; this.moveTimer++;
        if (this.hp < this.maxHp * 0.5) this.phase = 2;
        if (this.hp < this.maxHp * 0.25) this.phase = 3;
        if (this.moveTimer % 120 === 0) {
            const angle = Math.random() * Math.PI * 2, dist = 200;
            this.targetX = Utils.clamp(this.x + Math.cos(angle) * dist, 100, canvasWidth - 100);
            this.targetY = Utils.clamp(this.y + Math.sin(angle) * dist, 100, canvasHeight - 100);
        }
        const dx = this.targetX - this.x, dy = this.targetY - this.y, dist = Math.hypot(dx, dy);
        if (dist > 5) { this.x += (dx / dist) * this.speed; this.y += (dy / dist) * this.speed; }
        if (player.x - this.x < 0) this.facing = -1;
        if (player.x - this.x > 0) this.facing = 1;
    }
    draw(ctx) {
        ctx.save(); ctx.translate(this.x, this.y);
        if (this.facing === 1) ctx.scale(-1, 1);
        const pulse = 1 + Math.sin(Date.now() / 200) * 0.1;
        ctx.fillStyle = this.phase === 3 ? '#C0392B' : this.phase === 2 ? '#E74C3C' : '#8E44AD';
        ctx.beginPath(); ctx.arc(0, 0, this.size / 2 * pulse, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#000';
        ctx.beginPath(); ctx.arc(-15, -15, 12, 0, Math.PI * 2); ctx.arc(15, -15, 12, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#E74C3C';
        ctx.beginPath(); ctx.arc(-15 + Math.sin(Date.now() / 100) * 2, -15, 6, 0, Math.PI * 2); ctx.arc(15 + Math.sin(Date.now() / 100) * 2, -15, 6, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#000'; ctx.fillRect(-this.size / 2, -this.size / 2 - 15, this.size, 10);
        ctx.fillStyle = this.phase === 3 ? '#C0392B' : '#E74C3C';
        ctx.fillRect(-this.size / 2 + 2, -this.size / 2 - 13, (this.size - 4) * (this.hp / this.maxHp), 6);
        ctx.fillStyle = '#FFF'; ctx.font = 'bold 20px monospace'; ctx.textAlign = 'center';
        ctx.fillText(`BOSS HP: ${Math.floor(this.hp)}/${this.maxHp}`, 0, -this.size / 2 - 20);
        ctx.restore();
    }
}

class Enemy extends Entity {
    constructor(x, y, type = 'pig') {
        const types = { chick: { color: '#FFD700', hp: 1, speed: 2.8, exp: 8, size: 40, gold: 1 }, pig: { color: '#FF69B4', hp: 3, speed: 1.5, exp: 12, size: 50, gold: 2 }, sheep: { color: '#ECF0F1', hp: 5, speed: 1.2, exp: 15, size: 55, gold: 3 }, cow: { color: '#FFF', hp: 8, speed: 1.0, exp: 20, size: 60, gold: 5 }, bull: { color: '#C0392B', hp: 15, speed: 2.0, exp: 30, size: 65, gold: 8 } };
        const t = types[type] || types.pig;
        super(x, y, t.size, t.color);
        this.type = type; this.hp = t.hp; this.maxHp = t.hp; this.speed = t.speed; this.expValue = t.exp; this.goldValue = t.gold; this.facing = -1;
    }
    update(player) {
        const dx = player.x - this.x, dy = player.y - this.y, dist = Math.hypot(dx, dy);
        if (dist > 0) { this.x += (dx / dist) * this.speed; this.y += (dy / dist) * this.speed; }
        if (dx < 0) this.facing = -1;
        if (dx > 0) this.facing = 1;
    }
    draw(ctx) {
        ctx.save(); ctx.translate(this.x, this.y);
        if (this.facing === 1) ctx.scale(-1, 1);
        ctx.fillStyle = this.color; ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        ctx.fillStyle = '#000'; ctx.fillRect(-this.size / 3, -this.size / 4, this.size / 6, this.size / 6); ctx.fillRect(this.size / 6, -this.size / 4, this.size / 6, this.size / 6);
        if (this.hp < this.maxHp) { ctx.fillStyle = '#000'; ctx.fillRect(-this.size / 2, -this.size / 2 - 10, this.size, 6); ctx.fillStyle = '#E74C3C'; ctx.fillRect(-this.size / 2, -this.size / 2 - 10, this.size * (this.hp / this.maxHp), 6); }
        ctx.restore();
    }
}

class Bullet extends Entity {
    constructor(x, y, tx, ty, damage, isCrit = false, speed = 10) {
        super(x, y, 10, isCrit ? '#FFD700' : '#FFF');
        this.damage = damage; this.isCrit = isCrit;
        const angle = Math.atan2(ty - y, tx - x);
        this.vx = Math.cos(angle) * speed; this.vy = Math.sin(angle) * speed;
    }
    update(canvasWidth, canvasHeight) { this.x += this.vx; this.y += this.vy; if (this.x < -50 || this.x > canvasWidth + 50 || this.y < -50 || this.y > canvasHeight + 50) this.active = false; }
    draw(ctx) { ctx.fillStyle = this.color; ctx.beginPath(); ctx.arc(this.x, this.y, this.isCrit ? 8 : 6, 0, Math.PI * 2); ctx.fill(); if (this.isCrit) { ctx.strokeStyle = '#FFD700'; ctx.lineWidth = 2; ctx.stroke(); } }
}

class Player extends Entity {
    constructor(x, y, permanent = {}, weapon = 'single') {
        super(x, y, 40, '#FFF');
        this.maxHp = 3 + permanent.hp; this.hp = this.maxHp;
        this.baseSpeed = 5 + permanent.speed * 0.3; this.speed = this.baseSpeed;
        this.baseDamage = 1 + permanent.damage * 0.5; this.damage = this.baseDamage;
        this.level = 1; this.exp = 0; this.expToLevel = 100; this.attackCooldown = 0; this.invincible = 0; this.facing = 1;
        this.critChance = permanent.critChance * 0.05; this.critDamage = 1.5; this.armor = permanent.armor * 0.5;
        this.expMultiplier = 1 + permanent.expGain * 0.1; this.weapon = weapon;
        this.magnetRange = 0; this.shield = false;
    }
    update(input, enemies, canvasWidth, canvasHeight) {
        let dx = 0, dy = 0;
        if (input.keys['w'] || input.keys['arrowup']) dy = -1;
        if (input.keys['s'] || input.keys['arrowdown']) dy = 1;
        if (input.keys['a'] || input.keys['arrowleft']) { dx = -1; this.facing = -1; }
        if (input.keys['d'] || input.keys['arrowright']) { dx = 1; this.facing = 1; }
        if (dx !== 0 || dy !== 0) { const len = Math.hypot(dx, dy); this.x += (dx / len) * this.speed; this.y += (dy / len) * this.speed; }
        this.x = Utils.clamp(this.x, this.size / 2, canvasWidth - this.size / 2);
        this.y = Utils.clamp(this.y, this.size / 2, canvasHeight - this.size / 2);
        if (this.invincible > 0) this.invincible--;
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.attackCooldown <= 0) return this.findTarget(enemies);
        return null;
    }
    findTarget(enemies) { let nearest = null, minDist = 300; for (let e of enemies) { const dist = Utils.distance(this, e); if (dist < minDist) { minDist = dist; nearest = e; } } return nearest; }
    shootAt(target, bulletsArray) {
        if (!target) return;
        const isCrit = Math.random() < this.critChance;
        const cooldowns = { single: 20, dual: 15, shotgun: 35, spread: 25, rapid: 8, laser: 40 };
        switch (this.weapon) {
            case 'single': bulletsArray.push(new Bullet(this.x, this.y, target.x, target.y, this.damage, isCrit)); break;
            case 'dual': bulletsArray.push(new Bullet(this.x - 10, this.y, target.x, target.y, this.damage * 0.8, isCrit)); bulletsArray.push(new Bullet(this.x + 10, this.y, target.x, target.y, this.damage * 0.8, isCrit)); break;
            case 'shotgun': for (let i = -2; i <= 2; i++) { const angle = Math.atan2(target.y - this.y, target.x - this.x) + i * 0.2; bulletsArray.push(new Bullet(this.x, this.y, this.x + Math.cos(angle) * 300, this.y + Math.sin(angle) * 300, this.damage * 0.6, isCrit)); } break;
            case 'spread': for (let i = 0; i < 8; i++) { const angle = (Math.PI * 2 * i) / 8; bulletsArray.push(new Bullet(this.x, this.y, this.x + Math.cos(angle) * 300, this.y + Math.sin(angle) * 300, this.damage * 0.5, isCrit)); } break;
            case 'rapid': const spread = (Math.random() - 0.5) * 0.3, rAngle = Math.atan2(target.y - this.y, target.x - this.x) + spread; bulletsArray.push(new Bullet(this.x, this.y, this.x + Math.cos(rAngle) * 300, this.y + Math.sin(rAngle) * 300, this.damage * 0.7, isCrit, 12)); break;
            case 'laser': bulletsArray.push(new Bullet(this.x, this.y, target.x, target.y, this.damage * 3, isCrit, 15)); break;
        }
        this.attackCooldown = cooldowns[this.weapon] || 20; AudioSynth.shoot();
    }
    gainExp(amount, particleSystem) {
        const finalAmount = amount * this.expMultiplier; this.exp += finalAmount;
        if (this.exp >= this.expToLevel) { this.exp -= this.expToLevel; this.level++; this.expToLevel = Math.floor(this.expToLevel * 1.2); this.hp = Math.min(this.maxHp + 1, this.hp + 1); AudioSynth.levelUp(); if (particleSystem) particleSystem.createExplosion(this.x, this.y, '#FFD700', 20); return true; }
        return false;
    }
    takeDamage(dmg) { if (this.shield || this.invincible > 0) return false; const actualDamage = Math.max(1, dmg - this.armor); this.hp -= actualDamage; this.invincible = 60; AudioSynth.hit(); return this.hp <= 0; }
    draw(ctx) {
        ctx.save(); ctx.translate(this.x, this.y);
        if (this.invincible > 0 && Math.floor(Date.now() / 50) % 2) ctx.globalAlpha = 0.5;
        if (this.facing === -1) ctx.scale(-1, 1);
        if (this.shield) { ctx.strokeStyle = '#F1C40F'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 35, 0, Math.PI * 2); ctx.stroke(); }
        ctx.fillStyle = '#FFE4C4'; ctx.fillRect(-20, -30, 40, 60);
        ctx.fillStyle = '#FFF'; ctx.beginPath(); ctx.arc(0, -25, 20, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#000'; ctx.fillRect(-8, -28, 4, 4); ctx.fillRect(4, -28, 4, 4);
        ctx.restore();
    }
}

// ========== 游戏 ==========
class Game {
    constructor(weapon = 'single', isDaily = false) {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize(); window.addEventListener('resize', () => this.resize());
        this.save = SaveSystem.load();
        this.player = new Player(this.canvas.width / 2, this.canvas.height / 2, this.save.permanent, weapon);
        this.enemies = []; this.bullets = []; this.particles = new ParticleSystem(); this.powerups = [];
        this.wave = 1; this.waveTimer = 0; this.gameTime = 0; this.kills = 0; this.gold = 0;
        this.boss = null; this.isGameOver = false; this.isPaused = false;
        this.showingUpgrade = false; this.pendingUpgrades = [];
        this.isDaily = isDaily; this.dailyModifier = isDaily ? DailyChallenge.getModifiers() : null;
        this.runStats = { damageDealt: 0, expGained: 0, bossesKilled: 0, powerupsUsed: 0, maxHpLost: 0 };
        this.newAchievements = [];
        this.input = { keys: {} };
        window.addEventListener('keydown', e => { this.input.keys[e.key.toLowerCase()] = true; if (e.key === 'Escape') this.togglePause(); if (e.key >= '1' && e.key <= '3' && this.showingUpgrade) this.selectUpgrade(parseInt(e.key) - 1); });
        window.addEventListener('keyup', e => this.input.keys[e.key.toLowerCase()] = false);
        this.loop = this.loop.bind(this);
    }
    resize() { this.canvas.width = window.innerWidth; this.canvas.height = window.innerHeight; }
    togglePause() { if (!this.isGameOver && !this.showingUpgrade) this.isPaused = !this.isPaused; }
    
    checkAchievements() {
        const checks = [
            { id: 'first_blood', cond: this.kills >= 1 },
            { id: 'survivor', cond: this.gameTime >= 300 },
            { id: 'wave_10', cond: this.wave >= 10 },
            { id: 'boss_slayer', cond: this.runStats.bossesKilled >= 1 },
            { id: 'rich', cond: this.gold >= 1000 },
            { id: 'level_20', cond: this.player.level >= 20 },
            { id: 'killer_100', cond: this.save.totalKills + this.kills >= 100 },
            { id: 'killer_1000', cond: this.save.totalKills + this.kills >= 1000 }
        ];
        
        checks.forEach(c => {
            if (c.cond && SaveSystem.unlockAchievement(c.id)) {
                this.newAchievements.push(ACHIEVEMENTS[c.id]);
                AudioSynth.achievement();
            }
        });
    }
    
    showAchievementPopup() {
        if (this.newAchievements.length === 0) return;
        const ach = this.newAchievements.shift();
        this.achievementPopup = { ach, timer: 180 };
    }
    
    spawnEnemy() {
        let x, y;
        if (Math.random() < 0.5) { x = Math.random() < 0.5 ? -50 : this.canvas.width + 50; y = Math.random() * this.canvas.height; }
        else { x = Math.random() * this.canvas.width; y = Math.random() < 0.5 ? -50 : this.canvas.height + 50; }
        const types = ['chick', 'pig'];
        if (this.wave > 2) types.push('sheep');
        if (this.wave > 4) types.push('cow');
        if (this.wave > 6) types.push('bull');
        const type = types[Math.floor(Math.random() * types.length)];
        const enemy = new Enemy(x, y, type);
        if (this.isDaily && this.dailyModifier) this.dailyModifier.apply(enemy);
        this.enemies.push(enemy);
    }
    spawnPowerup(x, y) { if (Math.random() > 0.15) return; const types = Object.keys(POWERUPS); this.powerups.push(new Powerup(x, y, types[Math.floor(Math.random() * types.length)])); }
    spawnBoss() { this.boss = new Boss(this.canvas.width / 2, -100, 'wolf'); AudioSynth.bossSpawn(); }
    selectUpgrade(index) { if (index >= 0 && index < this.pendingUpgrades.length) { this.applyUpgrade(this.pendingUpgrades[index]); this.showingUpgrade = false; this.pendingUpgrades = []; } }
    generateUpgrades() { const all = [{ name: '伤害提升', desc: '攻击力+0.5', apply: () => { this.player.damage += 0.5; } }, { name: '生命强化', desc: '最大生命+1', apply: () => { this.player.maxHp += 1; this.player.hp += 1; } }, { name: '极速移动', desc: '移速+0.5', apply: () => { this.player.speed += 0.5; } }, { name: '暴击训练', desc: '暴击率+5%', apply: () => { this.player.critChance += 0.05; } }, { name: '护甲加固', desc: '护甲+0.5', apply: () => { this.player.armor += 0.5; } }, { name: '经验增幅', desc: '经验获取+10%', apply: () => { this.player.expMultiplier += 0.1; } }]; return all.sort(() => 0.5 - Math.random()).slice(0, 3); }
    applyUpgrade(upg) { upg.apply(); AudioSynth.levelUp(); }
    
    update() {
        if (this.isPaused || this.isGameOver || this.showingUpgrade) {
            if (this.achievementPopup && this.achievementPopup.timer > 0) this.achievementPopup.timer--;
            return;
        }
        
        this.gameTime += 1 / 60; this.waveTimer++;
        this.checkAchievements();
        if (this.achievementPopup) { this.achievementPopup.timer--; if (this.achievementPopup.timer <= 0) { this.achievementPopup = null; this.showAchievementPopup(); } }
        
        const spawnRate = this.boss ? 60 : Math.max(30, 120 - this.wave * 3);
        if (this.waveTimer % spawnRate === 0) { if (this.enemies.length < (this.boss ? 5 : 15 + this.wave * 2)) this.spawnEnemy(); }
        if (!this.boss && this.wave % 5 === 0 && this.waveTimer === 600) this.spawnBoss();
        if (!this.boss && this.waveTimer % 1800 === 0) this.wave++;
        
        const targets = this.boss ? [this.boss, ...this.enemies] : this.enemies;
        const target = this.player.update(this.input, targets, this.canvas.width, this.canvas.height);
        if (target) this.player.shootAt(target, this.bullets);
        
        for (let p of this.powerups) p.update();
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const p = this.powerups[i];
            const dist = Utils.distance(this.player, p);
            if (dist < this.player.size / 2 + p.size / 2 || (this.player.magnetRange > 0 && dist < this.player.magnetRange)) {
                POWERUPS[p.type].effect(this.player, this.enemies, this.particles);
                if (p.type === 'bomb') { for (let j = this.enemies.length - 1; j >= 0; j--) { if (this.enemies[j].hp <= 0) { this.player.gainExp(this.enemies[j].expValue, this.particles); this.gold += this.enemies[j].goldValue; this.kills++; } } this.enemies = this.enemies.filter(e => e.hp > 0); }
                this.runStats.powerupsUsed++;
                AudioSynth.powerup();
                this.powerups.splice(i, 1);
            }
        }
        
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.update(this.canvas.width, this.canvas.height);
            if (!b.active) { this.bullets.splice(i, 1); continue; }
            if (this.boss) {
                if (Utils.distance(b, this.boss) < this.boss.size / 2 + 10) {
                    b.active = false; this.boss.hp -= b.damage;
                    this.runStats.damageDealt += b.damage;
                    this.particles.addDamageNumber(this.boss.x, this.boss.y - 50, b.damage, b.isCrit);
                    if (this.boss.hp <= 0) { this.particles.createExplosion(this.boss.x, this.boss.y, '#8E44AD', 50, 8); this.player.gainExp(200, this.particles); this.gold += 50; this.spawnPowerup(this.boss.x, this.boss.y); this.runStats.bossesKilled++; this.runStats.expGained += 200; this.boss = null; this.wave++; AudioSynth.explosion(); }
                }
            }
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const e = this.enemies[j];
                if (Utils.distance(b, e) < e.size / 2 + 10) {
                    b.active = false; e.hp -= b.damage;
                    this.runStats.damageDealt += b.damage;
                    this.particles.addDamageNumber(e.x, e.y - 20, b.damage, b.isCrit); this.particles.createHitEffect(e.x, e.y);
                    if (e.hp <= 0) {
                        this.enemies.splice(j, 1);
                        const leveled = this.player.gainExp(e.expValue, this.particles);
                        this.runStats.expGained += e.expValue;
                        this.gold += e.goldValue; this.spawnPowerup(e.x, e.y); this.particles.createExplosion(e.x, e.y, e.color, 10);
                        AudioSynth.explosion(); this.kills++;
                        if (leveled) { this.showingUpgrade = true; this.pendingUpgrades = this.generateUpgrades(); }
                    }
                    break;
                }
            }
        }
        if (this.boss) { this.boss.update(this.player, this.canvas.width, this.canvas.height); if (Utils.distance(this.boss, this.player) < this.boss.size / 2 + 30) { if (this.player.takeDamage(2)) { this.gameOver(); return; } } }
        for (let i = this.enemies.length - 1; i >= 0; i--) { const e = this.enemies[i]; e.update(this.player); e.x = Utils.clamp(e.x, -100, this.canvas.width + 100); e.y = Utils.clamp(e.y, -100, this.canvas.height + 100); if (Utils.distance(e, this.player) < e.size / 2 + 20) { if (this.player.takeDamage(1)) { this.gameOver(); return; } } }
        this.particles.update();
    }
    
    draw() {
        const shakeRestore = this.particles.screenShake(this.ctx);
        this.ctx.fillStyle = '#2d1b2e'; this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.strokeStyle = '#3d2b3e'; this.ctx.lineWidth = 1;
        for (let x = 0; x < this.canvas.width; x += 80) { this.ctx.beginPath(); this.ctx.moveTo(x, 0); this.ctx.lineTo(x, this.canvas.height); this.ctx.stroke(); }
        for (let y = 0; y < this.canvas.height; y += 80) { this.ctx.beginPath(); this.ctx.moveTo(0, y); this.ctx.lineTo(this.canvas.width, y); this.ctx.stroke(); }
        this.particles.draw(this.ctx);
        for (let p of this.powerups) p.draw(this.ctx);
        for (let b of this.bullets) b.draw(this.ctx);
        if (this.boss) this.boss.draw(this.ctx);
        for (let e of this.enemies) e.draw(this.ctx);
        this.player.draw(this.ctx);
        if (shakeRestore) shakeRestore();
        this.drawUI();
    }
    
    drawUI() {
        const ctx = this.ctx;
        ctx.fillStyle = '#FFF'; ctx.font = '20px monospace'; ctx.textAlign = 'left';
        let y = 40;
        ctx.fillText(`HP: ${'❤️'.repeat(Math.max(0, this.player.hp))}${'🖤'.repeat(Math.max(0, this.player.maxHp - this.player.hp))}`, 20, y); y += 30;
        ctx.fillText(`Level: ${this.player.level}`, 20, y); y += 30;
        ctx.fillText(`EXP: ${Math.floor(this.player.exp)}/${this.player.expToLevel}`, 20, y); y += 30;
        ctx.fillText(`Wave: ${this.wave} ${this.boss ? '⚠️ BOSS!' : ''}`, 20, y); y += 30;
        const mins = Math.floor(this.gameTime / 60), secs = Math.floor(this.gameTime % 60);
        ctx.fillText(`Time: ${mins}:${secs.toString().padStart(2, '0')}`, 20, y); y += 30;
        ctx.fillText(`Kills: ${this.kills} | Gold: ${this.gold}`, 20, y);
        ctx.fillText(`Weapon: ${this.player.weapon}${this.isDaily ? ' | 🏆每日' : ''}`, 20, y + 30);
        
        if (this.achievementPopup) {
            const popup = this.achievementPopup;
            const alpha = Math.min(1, popup.timer / 30);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = 'rgba(241, 196, 15, 0.9)';
            ctx.fillRect(this.canvas.width / 2 - 150, 100, 300, 80);
            ctx.fillStyle = '#000';
            ctx.font = 'bold 24px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('🏆 成就解锁!', this.canvas.width / 2, 135);
            ctx.fillText(`${popup.ach.icon} ${popup.ach.name}`, this.canvas.width / 2, 165);
            ctx.restore();
        }
        
        if (this.showingUpgrade) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'; ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.fillStyle = '#F1C40F'; ctx.font = 'bold 36px monospace'; ctx.textAlign = 'center';
            ctx.fillText('升级选择', this.canvas.width / 2, this.canvas.height / 2 - 100);
            for (let i = 0; i < this.pendingUpgrades.length; i++) {
                const upg = this.pendingUpgrades[i], uy = this.canvas.height / 2 - 20 + i * 60;
                ctx.fillStyle = '#3498DB'; ctx.fillRect(this.canvas.width / 2 - 150, uy - 25, 300, 50);
                ctx.fillStyle = '#FFF'; ctx.font = 'bold 20px monospace'; ctx.fillText(`${i + 1}. ${upg.name}`, this.canvas.width / 2, uy);
                ctx.font = '14px monospace'; ctx.fillStyle = '#CCC'; ctx.fillText(upg.desc, this.canvas.width / 2, uy + 18);
            }
        }
        if (this.isPaused) { ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; ctx.fillRect(0, 0, this.canvas.width, this.canvas.height); ctx.fillStyle = '#FFF'; ctx.font = 'bold 48px monospace'; ctx.textAlign = 'center'; ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2); }
    }
    
    gameOver() {
        this.isGameOver = true;
        this.save.totalRuns++;
        this.save.totalKills += this.kills;
        this.save.gold += this.gold;
        this.save.stats.totalDamage += this.runStats.damageDealt;
        this.save.stats.totalExp += this.runStats.expGained;
        this.save.stats.bossesKilled += this.runStats.bossesKilled;
        this.save.stats.powerupsUsed += this.runStats.powerupsUsed;
        if (this.gameTime > this.save.bestTime) this.save.bestTime = this.gameTime;
        if (this.wave > this.save.bestWave) this.save.bestWave = this.wave;
        if (this.isDaily) this.save.dailyCompleted = true;
        SaveSystem.save(this.save);
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.9)'; this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#E74C3C'; this.ctx.font = 'bold 64px monospace'; this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 100);
        this.ctx.fillStyle = '#FFF'; this.ctx.font = '28px monospace';
        this.ctx.fillText(`Wave: ${this.wave} | Kills: ${this.kills} | Level: ${this.player.level}`, this.canvas.width / 2, this.canvas.height / 2 - 40);
        const mins = Math.floor(this.gameTime / 60), secs = Math.floor(this.gameTime % 60);
        this.ctx.font = '24px monospace';
        this.ctx.fillText(`Time: ${mins}m ${secs}s | Gold: ${this.gold}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
        this.ctx.fillStyle = '#3498DB';
        this.ctx.fillText(`Damage: ${Math.floor(this.runStats.damageDealt)} | Exp: ${Math.floor(this.runStats.expGained)}`, this.canvas.width / 2, this.canvas.height / 2 + 50);
        this.ctx.fillStyle = '#F1C40F';
        this.ctx.fillText(`Total Gold: ${this.save.gold}`, this.canvas.width / 2, this.canvas.height / 2 + 90);
        this.ctx.fillStyle = '#AAA';
        this.ctx.font = '18px monospace';
        this.ctx.fillText('Press SPACE for Menu', this.canvas.width / 2, this.canvas.height / 2 + 140);
        setTimeout(() => { window.addEventListener('keydown', (e) => { if (e.code === 'Space') showMenu(); }, { once: true }); }, 500);
    }
    loop() { this.update(); this.draw(); requestAnimationFrame(this.loop); }
}

// ========== 菜单 ==========
function showMenu() {
    const save = SaveSystem.load();
    const today = new Date().toDateString();
    if (save.lastDaily !== today) { save.dailyCompleted = false; save.lastDaily = today; SaveSystem.save(save); }
    const dailyMod = DailyChallenge.getModifiers();
    const achCount = Object.keys(save.achievements).length;
    const totalAch = Object.keys(ACHIEVEMENTS).length;
    
    const menuDiv = document.createElement('div');
    menuDiv.id = 'menuScreen';
    menuDiv.innerHTML = `
        <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:#2d1b2e;display:flex;flex-direction:column;align-items:center;color:white;z-index:9999;font-family:monospace;padding:15px;overflow-y:auto;">
            <h1 style="font-size:42px;margin:10px 0;">🐄 肉鸽牛牛</h1>
            <p style="font-size:16px;color:#aaa;margin-bottom:10px;">v2.4 - 成就与统计 | 🏆 ${achCount}/${totalAch}</p>
            <div style="background:linear-gradient(135deg, #8E44AD, #3498DB);padding:12px 25px;border-radius:10px;margin-bottom:15px;cursor:pointer;" onclick="startDaily()">
                <h3 style="margin:0;">🏆 每日挑战</h3>
                <p style="margin:3px 0;font-size:13px;">${dailyMod.name}: ${dailyMod.desc}</p>
                <p style="margin:0;font-size:11px;color:#FFD700;">${save.dailyCompleted ? '✅ 已完成' : '⚡ 可挑战'}</p>
            </div>
            <div style="display:flex;gap:20px;flex-wrap:wrap;justify-content:center;width:100%;max-width:1200px;">
                <div style="background:rgba(255,255,255,0.1);padding:15px;border-radius:10px;min-width:180px;">
                    <h3 style="color:#F1C40F;margin:0 0 10px;">💰 ${save.gold}</h3>
                    <p style="margin:3px 0;font-size:13px;">总击杀: ${save.totalKills}</p>
                    <p style="margin:3px 0;font-size:13px;">总局数: ${save.totalRuns}</p>
                    <p style="margin:3px 0;font-size:13px;">最佳波次: ${save.bestWave}</p>
                    <p style="margin:3px 0;font-size:13px;">最佳时长: ${Math.floor(save.bestTime / 60)}m ${Math.floor(save.bestTime % 60)}s</p>
                </div>
                <div style="background:rgba(255,255,255,0.1);padding:15px;border-radius:10px;flex:1;min-width:250px;">
                    <h3 style="color:#3498DB;margin:0 0 10px;">⚔️ 升级</h3>
                    ${renderUpgrade(save, 'damage', '攻击力', 100, '🗡️')}
                    ${renderUpgrade(save, 'hp', '生命值', 80, '❤️')}
                    ${renderUpgrade(save, 'speed', '移速', 120, '👟')}
                    ${renderUpgrade(save, 'expGain', '经验', 150, '💎')}
                </div>
                <div style="background:rgba(255,255,255,0.1);padding:15px;border-radius:10px;min-width:200px;">
                    <h3 style="color:#E74C3C;margin:0 0 10px;">🔫 武器</h3>
                    ${renderWeapon('single', '单发', true)}
                    ${renderWeapon('dual', '双枪', save.gold >= 200)}
                    ${renderWeapon('shotgun', '霰弹', save.gold >= 500)}
                    ${renderWeapon('spread', '环射', save.gold >= 800)}
                    ${renderWeapon('rapid', '速射', save.gold >= 1000)}
                    ${renderWeapon('laser', '激光', save.gold >= 1500)}
                </div>
                <div style="background:rgba(255,255,255,0.1);padding:15px;border-radius:10px;min-width:200px;">
                    <h3 style="color:#9B59B6;margin:0 0 10px;">📊 统计</h3>
                    <p style="margin:3px 0;font-size:12px;">总伤害: ${Math.floor(save.stats.totalDamage)}</p>
                    <p style="margin:3px 0;font-size:12px;">总经验: ${Math.floor(save.stats.totalExp)}</p>
                    <p style="margin:3px 0;font-size:12px;">击败BOSS: ${save.stats.bossesKilled}</p>
                    <p style="margin:3px 0;font-size:12px;">使用道具: ${save.stats.powerupsUsed}</p>
                    <button onclick="showAchievements()" style="margin-top:10px;padding:8px 15px;background:#F1C40F;color:#000;border:none;border-radius:5px;cursor:pointer;font-size:12px;">查看成就 (${achCount}/${totalAch})</button>
                </div>
            </div>
            <button onclick="startNormal()" style="margin-top:15px;padding:12px 50px;font-size:24px;background:#E74C3C;color:white;border:none;border-radius:10px;cursor:pointer;">开始游戏</button>
        </div>
    `;
    document.body.appendChild(menuDiv);
    
    let selectedWeapon = 'single';
    document.querySelectorAll('.weapon-btn').forEach(btn => {
        btn.onclick = () => { if (btn.dataset.locked === 'true') return; document.querySelectorAll('.weapon-btn').forEach(b => b.style.borderColor = 'transparent'); btn.style.borderColor = '#F1C40F'; selectedWeapon = btn.dataset.weapon; };
    });
    
    window.startNormal = () => { AudioSynth.click(); document.getElementById('menuScreen').remove(); currentGame = new Game(selectedWeapon, false); AudioSynth.init(); AudioSynth.resume(); currentGame.loop(); };
    window.startDaily = () => { if (save.dailyCompleted) { alert('今日已完成！'); return; } AudioSynth.click(); document.getElementById('menuScreen').remove(); currentGame = new Game('single', true); AudioSynth.init(); AudioSynth.resume(); currentGame.loop(); };
    window.showAchievements = () => {
        const achDiv = document.createElement('div');
        achDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:#1a1a1a;padding:30px;border-radius:15px;max-height:80vh;overflow-y:auto;z-index:10000;color:white;font-family:monospace;min-width:400px;';
        let html = '<h2 style="text-align:center;margin-bottom:20px;">🏆 成就列表</h2>';
        for (let [id, ach] of Object.entries(ACHIEVEMENTS)) {
            const unlocked = save.achievements[id];
            html += `<div style="padding:10px;margin:5px 0;background:${unlocked ? 'rgba(39,174,96,0.3)' : 'rgba(0,0,0,0.3)'};border-radius:5px;opacity:${unlocked ? 1 : 0.5};"><span style="font-size:24px;margin-right:10px;">${ach.icon}</span><b>${ach.name}</b><br><small>${ach.desc}</small>${unlocked ? '<span style="float:right;color:#27AE60;">✓</span>' : ''}</div>`;
        }
        html += '<button onclick="this.parentElement.remove()" style="margin-top:15px;width:100%;padding:10px;background:#E74C3C;color:white;border:none;border-radius:5px;cursor:pointer;">关闭</button>';
        achDiv.innerHTML = html;
        document.body.appendChild(achDiv);
    };
}

function renderUpgrade(save, type, name, baseCost, icon) {
    const level = save.permanent[type], max = { damage: 10, hp: 10, speed: 5, expGain: 10, critChance: 5, armor: 5 }[type];
    const cost = baseCost + level * 50, canAfford = save.gold >= cost, isMax = level >= max;
    return `<div style="display:flex;justify-content:space-between;align-items:center;margin:5px 0;padding:8px;background:rgba(0,0,0,0.3);border-radius:5px;font-size:13px;"><span>${icon} ${name}: ${level}/${max}</span><button onclick="buyUpgrade('${type}')" ${!canAfford || isMax ? 'disabled' : ''} style="padding:4px 12px;background:${isMax ? '#666' : canAfford ? '#27AE60' : '#666'};color:white;border:none;border-radius:3px;cursor:${isMax || !canAfford ? 'not-allowed' : 'pointer'};font-size:12px;">${isMax ? 'MAX' : cost + '💰'}</button></div>`;
}

function renderWeapon(id, name, unlocked) { return `<div class="weapon-btn" data-weapon="${id}" data-locked="${!unlocked}" style="padding:8px;margin:3px 0;background:${!unlocked ? '#333' : 'rgba(0,0,0,0.3)'};border-radius:5px;border:2px solid ${id === 'single' ? '#F1C40F' : 'transparent'};cursor:${!unlocked ? 'not-allowed' : 'pointer'};opacity:${!unlocked ? 0.5 : 1};font-size:13px;">${!unlocked ? '🔒 ' : ''}${name}</div>`; }

function buyUpgrade(type) {
    const save = SaveSystem.load();
    const costs = { damage: 100, hp: 80, speed: 120, expGain: 150, critChance: 200, armor: 100 };
    const max = { damage: 10, hp: 10, speed: 5, expGain: 10, critChance: 5, armor: 5 };
    if (save.permanent[type] >= max[type]) return;
    const cost = costs[type] + save.permanent[type] * 50;
    if (save.gold >= cost) { save.gold -= cost; save.permanent[type]++; SaveSystem.save(save); AudioSynth.click(); document.getElementById('menuScreen').remove(); showMenu(); }
}

window.onload = showMenu;
console.log('Rougelike Cow v2.4 - Achievements & Stats');
