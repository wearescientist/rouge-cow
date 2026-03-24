// 肉鸽牛牛 v7.0 - 音效和粒子效果
// 提升游戏手感和视觉反馈

// ========== 粒子系统 ==========
class ParticleSystem {
    constructor() {
        this.particles = [];
    }
    
    // 创建爆炸粒子（敌人死亡）
    createExplosion(x, y, color, count = 8) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
            const speed = 2 + Math.random() * 3;
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                color,
                30 + Math.random() * 20
            ));
        }
    }
    
    // 创建受伤粒子（受击）
    createHitParticles(x, y, color = '#FFF') {
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1 + Math.random() * 2;
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                color,
                20
            ));
        }
    }
    
    // 创建轨迹粒子（移动）
    createTrail(x, y, color) {
        if (Math.random() < 0.3) { // 降低频率
            this.particles.push(new Particle(
                x + (Math.random() - 0.5) * 10,
                y + (Math.random() - 0.5) * 10,
                0, 0,
                color,
                15,
                0.05 // 快速缩小
            ));
        }
    }
    
    // 创建升级特效
    createLevelUpEffect(x, y) {
        // 金色光圈
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 * i) / 20;
            this.particles.push(new Particle(
                x, y,
                Math.cos(angle) * 4,
                Math.sin(angle) * 4,
                '#FFD700',
                60,
                0,
                true // 发光
            ));
        }
        // 上升文字
        this.particles.push(new TextParticle(x, y - 30, 'LEVEL UP!', '#FFD700', 90));
    }
    
    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update();
            if (this.particles[i].life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }
    
    draw(ctx) {
        for (let p of this.particles) {
            p.draw(ctx);
        }
    }
}

class Particle {
    constructor(x, y, vx, vy, color, life, shrink = 0.02, glow = false) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.shrink = shrink;
        this.glow = glow;
        this.size = 4 + Math.random() * 4;
        this.gravity = 0.1;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.life--;
        this.size *= (1 - this.shrink);
    }
    
    draw(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.globalAlpha = alpha;
        
        if (this.glow) {
            ctx.shadowBlur = 10;
            ctx.shadowColor = this.color;
        }
        
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, Math.max(0, this.size), 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }
}

class TextParticle {
    constructor(x, y, text, color, life) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.life = life;
        this.maxLife = life;
        this.vy = -1;
    }
    
    update() {
        this.y += this.vy;
        this.life--;
    }
    
    draw(ctx) {
        const alpha = this.life / this.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = this.color;
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(this.text, this.x, this.y);
        ctx.textAlign = 'left';
        ctx.globalAlpha = 1;
    }
}

// ========== 音效系统（Web Audio API） ==========
class SoundSystem {
    constructor() {
        this.enabled = true;
        this.ctx = null;
        this.init();
    }
    
    init() {
        try {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            this.ctx = new AudioContext();
        } catch(e) {
            console.log('Web Audio API not supported');
            this.enabled = false;
        }
    }
    
    // 生成音效（8-bit风格）
    playTone(frequency, duration, type = 'square') {
        if (!this.enabled || !this.ctx) return;
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        osc.frequency.value = frequency;
        osc.type = type;
        
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
        
        osc.start(this.ctx.currentTime);
        osc.stop(this.ctx.currentTime + duration);
    }
    
    // 射击音效
    playShoot() {
        // 短促上升音
        this.playTone(440, 0.1, 'square');
        setTimeout(() => this.playTone(660, 0.1, 'square'), 50);
    }
    
    // 击中音效
    playHit() {
        // 低音
        this.playTone(200, 0.15, 'sawtooth');
    }
    
    // 敌人死亡音效
    playEnemyDeath() {
        // 下降音
        this.playTone(400, 0.2, 'square');
        setTimeout(() => this.playTone(200, 0.2, 'square'), 100);
    }
    
    // 玩家受伤
    playPlayerHit() {
        // 刺耳警告音
        this.playTone(150, 0.3, 'sawtooth');
        this.playTone(100, 0.3, 'sawtooth');
    }
    
    // 拾取经验
    playExpPickup() {
        // 清脆高音
        this.playTone(880, 0.1, 'sine');
    }
    
    // 升级音效
    playLevelUp() {
        // 胜利和弦
        this.playTone(523.25, 0.2, 'square'); // C5
        setTimeout(() => this.playTone(659.25, 0.2, 'square'), 100); // E5
        setTimeout(() => this.playTone(783.99, 0.4, 'square'), 200); // G5
    }
    
    // 道具拾取
    playItemPickup() {
        // 魔法音
        this.playTone(660, 0.1, 'sine');
        setTimeout(() => this.playTone(880, 0.2, 'sine'), 100);
    }
    
    // Boss警报
    playBossWarning() {
        // 低音警报
        for (let i = 0; i < 3; i++) {
            setTimeout(() => this.playTone(100, 0.5, 'sawtooth'), i * 600);
        }
    }
}

// ========== 屏幕震动 ==========
class ScreenShake {
    constructor() {
        this.shake = 0;
        this.shakeDecay = 0.9;
    }
    
    addShake(amount) {
        this.shake = Math.min(this.shake + amount, 20);
    }
    
    apply(ctx) {
        if (this.shake > 0.5) {
            const dx = (Math.random() - 0.5) * this.shake * 2;
            const dy = (Math.random() - 0.5) * this.shake * 2;
            ctx.translate(dx, dy);
            this.shake *= this.shakeDecay;
        }
    }
    
    reset(ctx) {
        if (this.shake > 0.5) {
            ctx.setTransform(1, 0, 0, 1, 0, 0);
        }
    }
}

// ========== 浮动伤害数字 ==========
class DamageNumbers {
    constructor() {
        this.numbers = [];
    }
    
    add(x, y, damage, isCrit = false) {
        this.numbers.push({
            x, y,
            text: isCrit ? `CRIT ${Math.floor(damage)}!` : Math.floor(damage).toString(),
            life: 40,
            vy: -2,
            color: isCrit ? '#FFD700' : '#FFF',
            size: isCrit ? 24 : 16
        });
    }
    
    update() {
        for (let i = this.numbers.length - 1; i >= 0; i--) {
            const n = this.numbers[i];
            n.y += n.vy;
            n.life--;
            if (n.life <= 0) {
                this.numbers.splice(i, 1);
            }
        }
    }
    
    draw(ctx) {
        for (let n of this.numbers) {
            const alpha = n.life / 40;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = n.color;
            ctx.font = `bold ${n.size}px monospace`;
            ctx.textAlign = 'center';
            ctx.fillText(n.text, n.x, n.y);
            ctx.textAlign = 'left';
        }
        ctx.globalAlpha = 1;
    }
}

console.log('Effects system loaded');
