// 肉鸽牛牛 v2.0 - UNIFIED EDITION
// 整合所有20轮开发内容

const CONFIG = {
    VERSION: '2.0.0',
    FPS: 60,
    DEBUG: false
};

const Utils = {
    distance: (a, b) => Math.hypot(a.x - b.x, a.y - b.y),
    clamp: (val, min, max) => Math.max(min, Math.min(max, val)),
    randomRange: (min, max) => Math.random() * (max - min) + min,
    lerp: (a, b, t) => a + (b - a) * t
};

// ========== 音频系统 ==========
const AudioSynth = {
    ctx: null,
    init() {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
    },
    resume() {
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    },
    playTone(freq, duration, type = 'square', vol = 0.1) {
        if (!this.ctx) this.init();
        this.resume();
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.frequency.value = freq;
        osc.type = type;
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
    },
    shoot() { this.playTone(440, 0.1); },
    hit() { this.playTone(200, 0.15, 'sawtooth'); },
    explosion() { this.playTone(150, 0.3, 'sawtooth', 0.2); },
    levelUp() {
        this.playTone(523, 0.2);
        setTimeout(() => this.playTone(659, 0.2), 100);
        setTimeout(() => this.playTone(784, 0.4), 200);
    }
};

// ========== 粒子系统 ==========
class ParticleSystem {
    constructor() {
        this.particles = [];
        this.damageNumbers = [];
    }
    
    createExplosion(x, y, color = '#FFF', count = 10) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            this.particles.push({
                x, y,
                vx: Math.cos(angle) * 4,
                vy: Math.sin(angle) * 4,
                life: 30,
                color,
                size: 4
            });
        }
    }
    
    createHitEffect(x, y) {
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 20,
                color: '#FFF',
                size: 3
            });
        }
    }
    
    addDamageNumber(x, y, damage, isCrit = false) {
        this.damageNumbers.push({
            x, y,
            text: isCrit ? `CRIT ${Math.floor(damage)}!` : Math.floor(damage).toString(),
            life: 40,
            vy: -2,
            color: isCrit ? '#FFD700' : '#FFF',
            size: isCrit ? 24 : 16
        });
    }
    
    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life--;
            p.size *= 0.95;
            if (p.life <= 0) this.particles.splice(i, 1);
        }
        
        for (let i = this.damageNumbers.length - 1; i >= 0; i--) {
            const d = this.damageNumbers[i];
            d.y += d.vy;
            d.life--;
            if (d.life <= 0) this.damageNumbers.splice(i, 1);
        }
    }
    
    draw(ctx) {
        for (let p of this.particles) {
            ctx.globalAlpha = p.life / 30;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
        
        for (let d of this.damageNumbers) {
            ctx.globalAlpha = d.life / 40;
            ctx.fillStyle = d.color;
            ctx.font = `bold ${d.size}px monospace`;
            ctx.textAlign = 'center';
            ctx.fillText(d.text, d.x, d.y);
        }
        ctx.textAlign = 'left';
        ctx.globalAlpha = 1;
    }
}

// ========== 实体基类 ==========
class Entity {
    constructor(x, y, size, color) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.color = color;
        this.vx = 0;
        this.vy = 0;
        this.active = true;
    }
}

// ========== 玩家类 ==========
class Player extends Entity {
    constructor(x, y) {
        super(x, y, 40, '#FFF');
        this.hp = 3;
        this.maxHp = 3;
        this.speed = 5;
        this.level = 1;
        this.exp = 0;
        this.expToLevel = 100;
        this.damage = 1;
        this.attackCooldown = 0;
        this.invincible = 0;
        this.facing = 1;
        this.critChance = 0;
        this.critDamage = 1.5;
        this.armor = 0;
    }
    
    update(input, enemies, canvasWidth, canvasHeight) {
        let dx = 0, dy = 0;
        if (input.keys['w'] || input.keys['arrowup']) dy = -1;
        if (input.keys['s'] || input.keys['arrowdown']) dy = 1;
        if (input.keys['a'] || input.keys['arrowleft']) { dx = -1; this.facing = -1; }
        if (input.keys['d'] || input.keys['arrowright']) { dx = 1; this.facing = 1; }
        
        if (dx !== 0 || dy !== 0) {
            const len = Math.hypot(dx, dy);
            this.x += (dx / len) * this.speed;
            this.y += (dy / len) * this.speed;
        }
        
        this.x = Utils.clamp(this.x, this.size/2, canvasWidth - this.size/2);
        this.y = Utils.clamp(this.y, this.size/2, canvasHeight - this.size/2);
        
        if (this.invincible > 0) this.invincible--;
        
        if (this.attackCooldown > 0) this.attackCooldown--;
        if (this.attackCooldown <= 0) {
            return this.findTarget(enemies);
        }
        return null;
    }
    
    findTarget(enemies) {
        let nearest = null;
        let minDist = 300;
        
        for (let e of enemies) {
            const dist = Utils.distance(this, e);
            if (dist < minDist) {
                minDist = dist;
                nearest = e;
            }
        }
        return nearest;
    }
    
    shootAt(target, bulletsArray) {
        if (!target) return;
        const isCrit = Math.random() < this.critChance;
        const finalDamage = isCrit ? this.damage * this.critDamage : this.damage;
        
        bulletsArray.push(new Bullet(this.x, this.y, target.x, target.y, finalDamage, isCrit));
        this.attackCooldown = 20;
        AudioSynth.shoot();
    }
    
    gainExp(amount, particleSystem) {
        this.exp += amount;
        if (this.exp >= this.expToLevel) {
            this.exp -= this.expToLevel;
            this.level++;
            this.expToLevel = Math.floor(this.expToLevel * 1.2);
            this.hp = Math.min(this.maxHp, this.hp + 1);
            AudioSynth.levelUp();
            if (particleSystem) {
                particleSystem.createExplosion(this.x, this.y, '#FFD700', 20);
            }
            return true;
        }
        return false;
    }
    
    takeDamage(dmg) {
        if (this.invincible > 0) return false;
        
        const actualDamage = Math.max(1, dmg - this.armor);
        this.hp -= actualDamage;
        this.invincible = 60;
        AudioSynth.hit();
        return this.hp <= 0;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        if (this.invincible > 0 && Math.floor(Date.now() / 50) % 2) {
            ctx.globalAlpha = 0.5;
        }
        if (this.facing === -1) ctx.scale(-1, 1);
        
        ctx.fillStyle = '#FFE4C4';
        ctx.fillRect(-20, -30, 40, 60);
        
        ctx.fillStyle = '#FFF';
        ctx.beginPath();
        ctx.arc(0, -25, 20, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#000';
        ctx.fillRect(-8, -28, 4, 4);
        ctx.fillRect(4, -28, 4, 4);
        
        ctx.restore();
    }
}

// ========== 敌人类 ==========
class Enemy extends Entity {
    constructor(x, y, type = 'pig') {
        const types = {
            chick: { color: '#FFD700', hp: 1, speed: 2.5, exp: 8, size: 40 },
            pig: { color: '#FF69B4', hp: 3, speed: 1.5, exp: 12, size: 50 },
            sheep: { color: '#ECF0F1', hp: 5, speed: 1.2, exp: 15, size: 55 },
            cow: { color: '#FFF', hp: 8, speed: 1.0, exp: 20, size: 60 }
        };
        
        const t = types[type] || types.pig;
        super(x, y, t.size, t.color);
        this.type = type;
        this.hp = t.hp;
        this.maxHp = t.hp;
        this.speed = t.speed;
        this.expValue = t.exp;
        this.facing = -1;
    }
    
    update(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist > 0) {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }
        
        if (dx < 0) this.facing = -1;
        if (dx > 0) this.facing = 1;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        if (this.facing === 1) ctx.scale(-1, 1);
        
        ctx.fillStyle = this.color;
        ctx.fillRect(-this.size/2, -this.size/2, this.size, this.size);
        
        ctx.fillStyle = '#000';
        ctx.fillRect(-this.size/3, -this.size/4, this.size/6, this.size/6);
        ctx.fillRect(this.size/6, -this.size/4, this.size/6, this.size/6);
        
        if (this.hp < this.maxHp) {
            ctx.fillStyle = '#000';
            ctx.fillRect(-this.size/2, -this.size/2 - 10, this.size, 6);
            ctx.fillStyle = '#E74C3C';
            ctx.fillRect(-this.size/2, -this.size/2 - 10, this.size * (this.hp / this.maxHp), 6);
        }
        
        ctx.restore();
    }
}

// ========== 子弹类 ==========
class Bullet extends Entity {
    constructor(x, y, tx, ty, damage, isCrit = false) {
        super(x, y, 10, isCrit ? '#FFD700' : '#FFF');
        this.damage = damage;
        this.isCrit = isCrit;
        const angle = Math.atan2(ty - y, tx - x);
        this.vx = Math.cos(angle) * 10;
        this.vy = Math.sin(angle) * 10;
    }
    
    update(canvasWidth, canvasHeight) {
        this.x += this.vx;
        this.y += this.vy;
        
        if (this.x < -50 || this.x > canvasWidth + 50 || 
            this.y < -50 || this.y > canvasHeight + 50) {
            this.active = false;
        }
    }
    
    draw(ctx) {
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.isCrit ? 8 : 6, 0, Math.PI * 2);
        ctx.fill();
        
        if (this.isCrit) {
            ctx.strokeStyle = '#FFD700';
            ctx.lineWidth = 2;
            ctx.stroke();
        }
    }
}

// ========== 游戏主类 ==========
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.resize();
        window.addEventListener('resize', () => this.resize());
        
        this.player = new Player(this.canvas.width/2, this.canvas.height/2);
        this.enemies = [];
        this.bullets = [];
        this.particles = new ParticleSystem();
        
        this.wave = 1;
        this.waveTimer = 0;
        this.gameTime = 0;
        this.kills = 0;
        this.isGameOver = false;
        this.isPaused = false;
        
        this.input = { keys: {} };
        window.addEventListener('keydown', e => {
            this.input.keys[e.key.toLowerCase()] = true;
            if (e.key === 'Escape') this.togglePause();
        });
        window.addEventListener('keyup', e => this.input.keys[e.key.toLowerCase()] = false);
        
        this.loop = this.loop.bind(this);
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
    }
    
    spawnEnemy() {
        let x, y;
        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? -50 : this.canvas.width + 50;
            y = Math.random() * this.canvas.height;
        } else {
            x = Math.random() * this.canvas.width;
            y = Math.random() < 0.5 ? -50 : this.canvas.height + 50;
        }
        
        const types = ['chick', 'pig'];
        if (this.wave > 3) types.push('sheep');
        if (this.wave > 5) types.push('cow');
        
        const type = types[Math.floor(Math.random() * types.length)];
        this.enemies.push(new Enemy(x, y, type));
    }
    
    update() {
        if (this.isPaused || this.isGameOver) return;
        
        this.gameTime += 1/60;
        this.waveTimer++;
        
        const spawnRate = Math.max(30, 120 - this.wave * 3);
        if (this.waveTimer % spawnRate === 0) {
            if (this.enemies.length < 15 + this.wave * 2) {
                this.spawnEnemy();
            }
        }
        
        if (this.waveTimer % 1800 === 0) {
            this.wave++;
        }
        
        const target = this.player.update(this.input, this.enemies, this.canvas.width, this.canvas.height);
        if (target) {
            this.player.shootAt(target, this.bullets);
        }
        
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.update(this.canvas.width, this.canvas.height);
            if (!b.active) {
                this.bullets.splice(i, 1);
                continue;
            }
            
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const e = this.enemies[j];
                if (Utils.distance(b, e) < e.size/2 + 10) {
                    b.active = false;
                    e.hp -= b.damage;
                    
                    this.particles.addDamageNumber(e.x, e.y - 20, b.damage, b.isCrit);
                    this.particles.createHitEffect(e.x, e.y);
                    
                    if (e.hp <= 0) {
                        this.enemies.splice(j, 1);
                        const leveledUp = this.player.gainExp(e.expValue, this.particles);
                        this.particles.createExplosion(e.x, e.y, e.color, 10);
                        AudioSynth.explosion();
                        this.kills++;
                    }
                    break;
                }
            }
        }
        
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            e.update(this.player);
            
            e.x = Utils.clamp(e.x, -100, this.canvas.width + 100);
            e.y = Utils.clamp(e.y, -100, this.canvas.height + 100);
            
            if (Utils.distance(e, this.player) < e.size/2 + 20) {
                if (this.player.takeDamage(1)) {
                    this.gameOver();
                    return;
                }
            }
        }
        
        this.particles.update();
    }
    
    draw() {
        this.ctx.fillStyle = '#2d1b2e';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.strokeStyle = '#3d2b3e';
        this.ctx.lineWidth = 1;
        for (let x = 0; x < this.canvas.width; x += 80) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y < this.canvas.height; y += 80) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
        
        this.particles.draw(this.ctx);
        
        for (let b of this.bullets) b.draw(this.ctx);
        for (let e of this.enemies) e.draw(this.ctx);
        this.player.draw(this.ctx);
        
        this.drawUI();
    }
    
    drawUI() {
        const ctx = this.ctx;
        ctx.fillStyle = '#FFF';
        ctx.font = '20px monospace';
        ctx.textAlign = 'left';
        
        let y = 40;
        ctx.fillText(`HP: ${'❤️'.repeat(this.player.hp)}${'🖤'.repeat(this.player.maxHp - this.player.hp)}`, 20, y); y += 30;
        ctx.fillText(`Level: ${this.player.level}`, 20, y); y += 30;
        ctx.fillText(`EXP: ${Math.floor(this.player.exp)}/${this.player.expToLevel}`, 20, y); y += 30;
        ctx.fillText(`Wave: ${this.wave}`, 20, y); y += 30;
        const mins = Math.floor(this.gameTime / 60);
        const secs = Math.floor(this.gameTime % 60);
        ctx.fillText(`Time: ${mins}:${secs.toString().padStart(2, '0')}`, 20, y); y += 30;
        ctx.fillText(`Kills: ${this.kills}`, 20, y);
        
        if (this.isPaused) {
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.fillStyle = '#FFF';
            ctx.font = 'bold 48px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
            ctx.font = '24px monospace';
            ctx.fillText('Press ESC to resume', this.canvas.width / 2, this.canvas.height / 2 + 50);
        }
    }
    
    gameOver() {
        this.isGameOver = true;
        
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#E74C3C';
        this.ctx.font = 'bold 64px monospace';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 80);
        
        this.ctx.fillStyle = '#FFF';
        this.ctx.font = '28px monospace';
        this.ctx.fillText(`Wave: ${this.wave} | Kills: ${this.kills} | Level: ${this.player.level}`, this.canvas.width / 2, this.canvas.height / 2);
        
        const mins = Math.floor(this.gameTime / 60);
        const secs = Math.floor(this.gameTime % 60);
        this.ctx.font = '24px monospace';
        this.ctx.fillText(`Survived: ${mins}m ${secs}s`, this.canvas.width / 2, this.canvas.height / 2 + 50);
        
        this.ctx.fillStyle = '#F1C40F';
        this.ctx.font = '20px monospace';
        this.ctx.fillText('Click or press SPACE to restart', this.canvas.width / 2, this.canvas.height / 2 + 120);
        
        setTimeout(() => {
            const restart = () => location.reload();
            window.addEventListener('click', restart, { once: true });
            window.addEventListener('keydown', (e) => { if (e.code === 'Space') restart(); }, { once: true });
        }, 500);
    }
    
    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(this.loop);
    }
}

// ========== 启动 ==========
let game;
let gameStarted = false;

function startGame() {
    if (gameStarted) return;
    gameStarted = true;
    
    AudioSynth.init();
    AudioSynth.resume();
    
    game = new Game();
    game.loop();
    
    document.getElementById('startScreen')?.remove();
}

window.onload = () => {
    const startDiv = document.createElement('div');
    startDiv.id = 'startScreen';
    startDiv.innerHTML = `
        <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:#2d1b2e;display:flex;flex-direction:column;justify-content:center;align-items:center;color:white;z-index:9999;cursor:pointer;font-family:monospace;" onclick="startGame()">
            <h1 style="font-size:64px;margin-bottom:20px;">🐄 肉鸽牛牛</h1>
            <p style="font-size:28px;margin-bottom:10px;">v2.0 - UNIFIED</p>
            <p style="font-size:20px;color:#aaa;">点击任意处或按任意键开始</p>
            <div style="margin-top:40px;font-size:16px;color:#888;">
                <p>WASD / 方向键 移动</p>
                <p>自动攻击最近敌人</p>
                <p>ESC 暂停</p>
            </div>
        </div>
    `;
    document.body.appendChild(startDiv);
    
    window.addEventListener('keydown', () => startGame(), { once: true });
};

console.log('Rougelike Cow v2.0 - UNIFIED');
console.log('All systems integrated');
