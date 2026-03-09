
// ============================================================================
// 肉鸽牛牛 v0.9.0 幸存者模式重构 - 全武器同时攻击+3选1+刷怪重做
// ============================================================================

const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
const dist = (x1, y1, x2, y2) => Math.sqrt((x2-x1)**2 + (y2-y1)**2);
const rand = (min, max) => Math.random() * (max - min) + min;
const randInt = (min, max) => Math.floor(rand(min, max));
const randChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];

// 精灵图加载器
class SpriteLoader {
    constructor() {
        this.sprites = {};
        this.loaded = 0;
        this.total = 0;
        this.errors = [];
    }
    
    load(name, src) {
        this.total++;
        return new Promise((resolve) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                this.sprites[name] = img;
                this.loaded++;
                console.log(`✓ Loaded: ${name}`);
                resolve(img);
            };
            
            img.onerror = () => {
                console.warn(`✗ Failed to load: ${src}`);
                this.errors.push({ name, src });
                this.loaded++;
                resolve(null);
            };
            
            setTimeout(() => {
                if (!img.complete) {
                    console.warn(`⏱ Timeout: ${src}`);
                    this.errors.push({ name, src, timeout: true });
                    resolve(null);
                }
            }, 5000);
            
            img.src = src;
        });
    }
    
    get(name) { return this.sprites[name]; }
    has(name) { return name in this.sprites; }
    isReady() { return this.loaded >= this.total; }
    getProgress() { return this.total > 0 ? this.loaded / this.total : 1; }
    getErrorCount() { return this.errors.length; }
}

// 粒子系统
class ParticleSystem {
    constructor(max = 500) {
        this.pool = Array(max).fill(null).map(() => ({
            x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1,
            color: '#fff', size: 4, active: false, type: 'rect',
            gravity: 0, rotation: 0, rotSpeed: 0, glow: 0
        }));
        this.active = [];
    }

    emit(x, y, color, opts = {}) {
        const p = this.pool.find(p => !p.active) || this.pool[0];
        p.x = x; p.y = y; p.color = color; p.active = true;
        p.life = opts.life || 1; p.maxLife = p.life;
        p.size = opts.size || 4;
        p.type = opts.type || 'rect';
        p.gravity = opts.gravity || 0;
        p.rotation = opts.rotation || 0;
        p.rotSpeed = opts.rotSpeed || 0;
        p.glow = opts.glow || 0;
        const speed = opts.speed || 100;
        const angle = opts.angle != null ? opts.angle : Math.random() * Math.PI * 2;
        p.vx = Math.cos(angle) * speed;
        p.vy = Math.sin(angle) * speed;
        if (!this.active.includes(p)) this.active.push(p);
    }

    burst(x, y, color, count = 10, opts = {}) {
        for (let i = 0; i < count; i++) {
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
        // 核心爆炸 - 圆形粒子
        for (let i = 0; i < count; i++) {
            this.emit(x, y, color, {
                speed: rand(80, 250),
                life: rand(0.4, 0.9),
                size: rand(3, 8),
                type: 'circle',
                glow: rand(10, 20)
            });
        }
        // 火花 - 小矩形
        for (let i = 0; i < count / 2; i++) {
            this.emit(x, y, '#ff0', {
                speed: rand(100, 300),
                life: rand(0.2, 0.5),
                size: rand(1, 3),
                type: 'rect'
            });
        }
    }

    trail(x, y, color, count = 3) {
        for (let i = 0; i < count; i++) {
            this.emit(x + rand(-3, 3), y + rand(-3, 3), color, {
                speed: rand(10, 30),
                life: rand(0.15, 0.35),
                size: rand(2, 4),
                type: 'circle',
                glow: 5
            });
        }
    }

    sparkle(x, y, color, count = 5) {
        for (let i = 0; i < count; i++) {
            this.emit(x, y, color, {
                speed: rand(20, 60),
                life: rand(0.5, 1.2),
                size: rand(2, 5),
                type: 'star',
                rotSpeed: rand(-3, 3)
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
                this.active.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        for (const p of this.active) {
            const alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = p.color;
            
            // 发光效果
            if (p.glow > 0) {
                ctx.shadowBlur = p.glow;
                ctx.shadowColor = p.color;
            }
            
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.rotation);
            
            if (p.type === 'rect') {
                ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
            } else if (p.type === 'circle') {
                ctx.beginPath();
                ctx.arc(0, 0, p.size/2, 0, Math.PI * 2);
                ctx.fill();
            } else if (p.type === 'star') {
                this.drawStar(ctx, 0, 0, 5, p.size, p.size/2);
            }
            
            ctx.restore();
            ctx.shadowBlur = 0;
        }
        ctx.globalAlpha = 1;
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
}

// 伤害数字系统
class DamageNumberSystem {
    constructor(max = 100) {
        this.pool = Array(max).fill(null).map(() => ({
            x: 0, y: 0, value: 0, life: 0, maxLife: 1,
            color: '#fff', size: 14, active: false,
            vx: 0, vy: 0, critical: false
        }));
        this.active = [];
    }
    
    spawn(x, y, value, opts = {}) {
        const dn = this.pool.find(d => !d.active) || this.pool[0];
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
        this.spawn(x, y, '+' + value, { color: '#4f4', life: 1.0, size: 16 });
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
    
    draw(ctx) {
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        for (const dn of this.active) {
            const alpha = Math.min(1, dn.life / dn.maxLife * 2);
            ctx.globalAlpha = alpha;
            ctx.font = `bold ${dn.size}px Arial`;
            
            // 暴击效果 - 发光描边
            if (dn.critical) {
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#f80';
                ctx.strokeStyle = '#800';
                ctx.lineWidth = 2;
                ctx.strokeText(dn.value, dn.x, dn.y);
            }
            
            ctx.fillStyle = dn.color;
            ctx.fillText(dn.value, dn.x, dn.y);
            ctx.shadowBlur = 0;
        }
        ctx.globalAlpha = 1;
    }
}

// 音效系统
class SoundManager {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }
    
    init() {
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.enabled = false;
        }
    }
    
    play(type) {
        if (!this.enabled || !this.ctx) return;
        if (this.ctx.state === 'suspended') this.ctx.resume();
        
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        
        switch(type) {
            case 'shoot':
                osc.frequency.value = 800;
                gain.gain.value = 0.1;
                osc.start();
                osc.frequency.exponentialRampToValueAtTime(400, this.ctx.currentTime + 0.1);
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
                osc.stop(this.ctx.currentTime + 0.1);
                break;
            case 'hit':
                osc.frequency.value = 200;
                osc.type = 'square';
                gain.gain.value = 0.15;
                osc.start();
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
                osc.stop(this.ctx.currentTime + 0.15);
                break;
            case 'kill':
                osc.frequency.value = 600;
                gain.gain.value = 0.2;
                osc.start();
                osc.frequency.setValueAtTime(600, this.ctx.currentTime);
                osc.frequency.setValueAtTime(800, this.ctx.currentTime + 0.1);
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
                osc.stop(this.ctx.currentTime + 0.3);
                break;
            case 'levelup':
                osc.frequency.value = 400;
                gain.gain.value = 0.25;
                osc.start();
                for (let i = 0; i < 5; i++) {
                    osc.frequency.setValueAtTime(400 + i * 100, this.ctx.currentTime + i * 0.05);
                }
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
                osc.stop(this.ctx.currentTime + 0.5);
                break;
            case 'evolve':
                osc.frequency.value = 300;
                gain.gain.value = 0.3;
                osc.start();
                for (let i = 0; i < 8; i++) {
                    osc.frequency.setValueAtTime(300 + i * 100, this.ctx.currentTime + i * 0.05);
                }
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.8);
                osc.stop(this.ctx.currentTime + 0.8);
                break;
            case 'buy':
                osc.frequency.value = 500;
                gain.gain.value = 0.2;
                osc.start();
                osc.frequency.setValueAtTime(500, this.ctx.currentTime);
                osc.frequency.setValueAtTime(700, this.ctx.currentTime + 0.1);
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.3);
                osc.stop(this.ctx.currentTime + 0.3);
                break;
            case 'gem':
                osc.frequency.value = 1200;
                gain.gain.value = 0.08;
                osc.type = 'sine';
                osc.start();
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
                osc.stop(this.ctx.currentTime + 0.08);
                break;
            case 'hurt':
                osc.frequency.value = 150;
                osc.type = 'sawtooth';
                gain.gain.value = 0.25;
                osc.start();
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
                osc.stop(this.ctx.currentTime + 0.2);
                break;
            case 'portal':
                osc.frequency.value = 800;
                gain.gain.value = 0.15;
                osc.type = 'sine';
                osc.start();
                for (let i = 0; i < 6; i++) {
                    osc.frequency.setValueAtTime(800 + i * 150, this.ctx.currentTime + i * 0.08);
                }
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.6);
                osc.stop(this.ctx.currentTime + 0.6);
                break;
            case 'boss':
                osc.frequency.value = 200;
                gain.gain.value = 0.4;
                osc.type = 'sawtooth';
                osc.start();
                for (let i = 0; i < 10; i++) {
                    osc.frequency.setValueAtTime(200 - i * 15, this.ctx.currentTime + i * 0.1);
                }
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 1.2);
                osc.stop(this.ctx.currentTime + 1.2);
                break;
            case 'victory':
                osc.frequency.value = 440;
                gain.gain.value = 0.25;
                osc.type = 'sine';
                osc.start();
                [440, 554, 659, 880, 1109, 1319].forEach((freq, i) => {
                    osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.12);
                });
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 1.2);
                osc.stop(this.ctx.currentTime + 1.2);
                break;
            case 'gameover':
                osc.frequency.value = 880;
                gain.gain.value = 0.2;
                osc.type = 'triangle';
                osc.start();
                [880, 830, 783, 740, 698, 659, 622, 587, 554, 523, 494, 466].forEach((freq, i) => {
                    osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.08);
                });
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 1.2);
                osc.stop(this.ctx.currentTime + 1.2);
                break;
            case 'wave':
                osc.frequency.value = 300;
                gain.gain.value = 0.15;
                osc.type = 'square';
                osc.start();
                for (let i = 0; i < 5; i++) {
                    osc.frequency.setValueAtTime(300 + i * 50, this.ctx.currentTime + i * 0.05);
                }
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.4);
                osc.stop(this.ctx.currentTime + 0.4);
                break;
            case 'elite':
                osc.frequency.value = 150;
                gain.gain.value = 0.3;
                osc.type = 'sawtooth';
                osc.start();
                for (let i = 0; i < 8; i++) {
                    osc.frequency.setValueAtTime(150 + Math.random() * 200, this.ctx.currentTime + i * 0.06);
                }
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.6);
                osc.stop(this.ctx.currentTime + 0.6);
                break;
            case 'chest':
                osc.frequency.value = 600;
                gain.gain.value = 0.2;
                osc.type = 'triangle';
                osc.start();
                [600, 800, 600, 800, 1000].forEach((freq, i) => {
                    osc.frequency.setValueAtTime(freq, this.ctx.currentTime + i * 0.06);
                });
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
                osc.stop(this.ctx.currentTime + 0.5);
                break;
        }
    }
}

// 材料系统
const MATERIALS = {
    fire: { name: '火焰精华', icon: '🔥', color: '#f44' },
    ice: { name: '冰霜结晶', icon: '❄️', color: '#48f' },
    thunder: { name: '雷电核心', icon: '⚡', color: '#fc0' },
    shadow: { name: '暗影碎片', icon: '🌑', color: '#848' },
    life: { name: '生命精华', icon: '🌿', color: '#4f4' },
    steel: { name: '钢铁碎片', icon: '🔩', color: '#888' },
    magic: { name: '魔法粉尘', icon: '✨', color: '#f8f' },
    ancient: { name: '远古遗物', icon: '🏺', color: '#fa0' }
};

class MaterialManager {
    constructor() {
        this.materials = {};
        for (const key in MATERIALS) {
            this.materials[key] = 0;
        }
    }
    
    add(type, amount = 1) {
        if (this.materials[type] !== undefined) {
            this.materials[type] += amount;
            return true;
        }
        return false;
    }
    
    has(type, amount = 1) {
        return (this.materials[type] || 0) >= amount;
    }
    
    consume(type, amount = 1) {
        if (this.has(type, amount)) {
            this.materials[type] -= amount;
            return true;
        }
        return false;
    }
    
    getCount(type) {
        return this.materials[type] || 0;
    }
    
    getAll() {
        return Object.entries(this.materials)
            .filter(([_, count]) => count > 0)
            .map(([type, count]) => ({ ...MATERIALS[type], type, count }));
    }
}

// 道具数据库
const ITEMS = {
    1: { id: 1, name: '多重射击', icon: '🎯', rarity: 'common', effect: 'projCount', value: 1, desc: '子弹+1', price: 40 },
    2: { id: 2, name: '巨大化', icon: '📏', rarity: 'common', effect: 'projSize', value: 0.3, desc: '子弹变大', price: 35 },
    3: { id: 3, name: '快速射击', icon: '⚡', rarity: 'common', effect: 'fireRate', value: 0.15, desc: '射速+15%', price: 45 },
    4: { id: 4, name: '穿甲弹', icon: '🔩', rarity: 'rare', effect: 'pierce', value: 1, desc: '穿透+1', price: 80 },
    5: { id: 5, name: '暴击镜片', icon: '🔍', rarity: 'rare', effect: 'crit', value: 0.1, desc: '暴击+10%', price: 75 },
    6: { id: 6, name: '心之容器', icon: '❤️', rarity: 'common', effect: 'maxHp', value: 2, desc: '生命+2', price: 50 },
    7: { id: 7, name: '钢铁护甲', icon: '🛡️', rarity: 'rare', effect: 'armor', value: 1, desc: '护甲+1', price: 85 },
    8: { id: 8, name: '吸血獠牙', icon: '🦷', rarity: 'rare', effect: 'lifeSteal', value: 0.05, desc: '吸血5%', price: 90 },
    9: { id: 9, name: '加速靴', icon: '👟', rarity: 'common', effect: 'speed', value: 0.2, desc: '移速+20%', price: 40 },
    10: { id: 10, name: '飞行翅膀', icon: '🦅', rarity: 'epic', effect: 'fly', value: 1, desc: '可以飞行', price: 150 },
    11: { id: 11, name: '磁铁', icon: '🧲', rarity: 'rare', effect: 'magnet', value: 50, desc: '吸范围+50', price: 70 },
    12: { id: 12, name: '金蛋', icon: '🥚', rarity: 'epic', effect: 'goldBonus', value: 0.5, desc: '金币+50%', price: 120 },
    13: { id: 13, name: '火焰附魔', icon: '🔥', rarity: 'rare', effect: 'fireDmg', value: 5, desc: '火焰伤害+5', price: 85 },
    14: { id: 14, name: '冰冻核心', icon: '❄️', rarity: 'rare', effect: 'slow', value: 0.2, desc: '减速敌人20%', price: 80 },
    15: { id: 15, name: '雷电宝珠', icon: '⚡', rarity: 'epic', effect: 'chain', value: 1, desc: '连锁攻击+1', price: 140 },
    // v0.8.0 最终整合
    16: { id: 16, name: '狂暴之血', icon: '🩸', rarity: 'rare', effect: 'crit', value: 0.1, desc: '暴击率+10%', price: 80 },
    17: { id: 17, name: '爆炸弹', icon: '💣', rarity: 'rare', effect: 'fireDmg', value: 5, desc: '爆炸伤害+5', price: 90 },
    18: { id: 18, name: '冰冻弹', icon: '🧊', rarity: 'rare', effect: 'slow', value: 0.2, desc: '减速效果+20%', price: 85 },
    19: { id: 19, name: '护盾发生器', icon: '🛡️', rarity: 'rare', effect: 'armor', value: 2, desc: '护甲+2', price: 100 },
    20: { id: 20, name: '复活币', icon: '🪙', rarity: 'legendary', effect: 'maxHp', value: 2, desc: '生命上限+2', price: 300 },
    21: { id: 21, name: '经验书', icon: '📚', rarity: 'common', effect: 'speed', value: 0.1, desc: '移速+10%', price: 40 },
    22: { id: 22, name: '金磁铁', icon: '🧲', rarity: 'rare', effect: 'magnet', value: 80, desc: '拾取范围+80', price: 75 },
    23: { id: 23, name: '疾风靴', icon: '👢', rarity: 'epic', effect: 'speed', value: 0.3, desc: '移速+30%', price: 140 },
    24: { id: 24, name: '天使祝福', icon: '👼', rarity: 'legendary', effect: 'maxHp', value: 3, desc: '生命+3', price: 350 },
    25: { id: 25, name: '黑洞核心', icon: '🕳️', rarity: 'legendary', effect: 'magnet', value: 200, desc: '拾取范围+200', price: 400 },
    26: { id: 26, name: '雷电之刃', icon: '⚡', rarity: 'epic', effect: 'chain', value: 1, desc: '连锁攻击+1', price: 140 },
    // 第1次迭代：新增24个道具 (27-50)
    // 攻击类扩展
    27: { id: 27, name: '霰弹扩散', icon: '📦', rarity: 'common', effect: 'spread', value: 15, desc: '散射角度+15°', price: 35 },
    28: { id: 28, name: '追踪芯片', icon: '🧿', rarity: 'rare', effect: 'homing', value: 0.3, desc: '追踪强度+30%', price: 95 },
    29: { id: 29, name: '弹跳子弹', icon: '🎱', rarity: 'rare', effect: 'bounce', value: 1, desc: '弹跳+1次', price: 85 },
    30: { id: 30, name: '毒液涂层的', icon: '🧪', rarity: 'rare', effect: 'poisonDmg', value: 3, desc: '毒伤害+3/秒', price: 80 },
    31: { id: 31, name: '狙击镜', icon: '🔭', rarity: 'epic', effect: 'critDmg', value: 0.5, desc: '暴击伤害+50%', price: 130 },
    32: { id: 32, name: '连发装置', icon: '🔫', rarity: 'epic', effect: 'burst', value: 1, desc: '连射+1发', price: 150 },
    // 防御类扩展
    33: { id: 33, name: '再生因子', icon: '🧬', rarity: 'rare', effect: 'regen', value: 0.5, desc: '每秒回复0.5HP', price: 100 },
    34: { id: 34, name: '荆棘护甲', icon: '🌵', rarity: 'rare', effect: 'thorn', value: 2, desc: '反弹2点伤害', price: 90 },
    35: { id: 35, name: '闪避靴', icon: '👻', rarity: 'epic', effect: 'dodge', value: 0.1, desc: '闪避+10%', price: 130 },
    36: { id: 36, name: '神圣护盾', icon: '✨', rarity: 'legendary', effect: 'shield', value: 1, desc: '免伤盾+1层', price: 300 },
    37: { id: 37, name: '不朽之心', icon: '💝', rarity: 'legendary', effect: 'revive', value: 1, desc: '死亡时复活一次', price: 500 },
    // 移动类扩展
    38: { id: 38, name: '瞬移装置', icon: '🌀', rarity: 'epic', effect: 'dashDist', value: 0.5, desc: '冲刺距离+50%', price: 120 },
    39: { id: 39, name: '时间怀表', icon: '⏱️', rarity: 'legendary', effect: 'slowTime', value: 0.2, desc: '子弹时间20%', price: 400 },
    // 资源类扩展
    40: { id: 40, name: '幸运币', icon: '🍀', rarity: 'rare', effect: 'luck', value: 0.2, desc: '幸运+20%', price: 110 },
    41: { id: 41, name: '贪婪之手', icon: '🤲', rarity: 'rare', effect: 'goldOnKill', value: 2, desc: '击杀金币+2', price: 95 },
    42: { id: 42, name: '经验加成', icon: '📈', rarity: 'common', effect: 'expBonus', value: 0.2, desc: '经验+20%', price: 45 },
    43: { id: 43, name: '采集器', icon: '📡', rarity: 'epic', effect: 'pickupRange', value: 50, desc: '拾取范围+50', price: 125 },
    // 召唤类
    44: { id: 44, name: '小精灵', icon: '🧚', rarity: 'rare', effect: 'fairy', value: 1, desc: '小精灵跟随射击', price: 140 },
    45: { id: 45, name: '守护球', icon: '🔮', rarity: 'epic', effect: 'orbit', value: 1, desc: '环绕攻击球+1', price: 160 },
    46: { id: 46, name: '宠物龙', icon: '🐉', rarity: 'legendary', effect: 'dragon', value: 1, desc: '喷火幼龙跟随', price: 450 },
    // 诅咒类（高风险高回报）
    47: { id: 47, name: '狂暴模式', icon: '😈', rarity: 'cursed', effect: 'glassCannon', value: 1, desc: '伤害+50% 生命-30%', price: 0 },
    48: { id: 48, name: '献祭之心', icon: '💔', rarity: 'cursed', effect: 'bloodMoney', value: 1, desc: '金币+100% 每秒扣血', price: 0 },
    // 特殊道具
    49: { id: 49, name: '盲眼萃取液', icon: '🧴', rarity: 'legendary', effect: 'invincible', value: 3, desc: '3秒无敌时间', price: 350 },
    50: { id: 50, name: '图腾骨片', icon: '🦴', rarity: 'legendary', effect: 'upgradeAll', value: 1, desc: '全属性+10%', price: 600 }
};

function getItemPrice(itemId) {
    const item = ITEMS[itemId];
    if (!item) return 100;
    const basePrice = item.price || 50;
    const variance = basePrice * 0.2;
    return Math.floor(basePrice + rand(-variance, variance));
}

class ItemManager {
    constructor(player) {
        this.player = player;
        this.owned = {};
        this.cache = null;
        this.dirty = true;
    }

    add(id) {
        const item = ITEMS[id];
        if (!item) return false;
        this.owned[id] = (this.owned[id] || 0) + 1;
        this.dirty = true;
        
        if (item.effect === 'maxHp') {
            this.player.maxHp += item.value;
            this.player.hp += item.value;
        }
        return true;
    }

    getStats() {
        if (!this.dirty) return this.cache;
        
        const s = {
            // 基础属性
            projCount: 1, projSize: 1, fireRate: 1, pierce: 0,
            crit: 0, critDmg: 1.5, maxHp: 0, armor: 0, lifeSteal: 0,
            speed: 1, fly: false, magnet: 100, goldBonus: 1,
            // 伤害类型
            fireDmg: 0, thunderDmg: 0, poisonDmg: 0, curseDmg: 0,
            // 控制效果
            slowChance: 0, slowAmount: 0, stunChance: 0,
            // 新属性（第1次迭代）
            spread: 0, homing: 0, bounce: 0, burst: 0,
            regen: 0, thorn: 0, dodge: 0, shield: 0, revive: 0,
            dashDist: 1, slowTime: 0, luck: 0, goldOnKill: 0, expBonus: 0,
            pickupRange: 0, fairy: 0, orbit: 0, dragon: 0,
            glassCannon: 0, bloodMoney: 0, invincible: 0, upgradeAll: 0,
            // 治疗
            healOnHit: 0
        };
        
        for (const [id, count] of Object.entries(this.owned)) {
            const item = ITEMS[id];
            if (!item) continue;
            const v = item.value * count;
            
            switch (item.effect) {
                // 基础攻击
                case 'projCount': s.projCount += v; break;
                case 'projSize': s.projSize += v; break;
                case 'fireRate': s.fireRate *= (1 + v); break;
                case 'pierce': s.pierce += v; break;
                case 'crit': s.crit = Math.min(1, s.crit + v); break;
                case 'critDmg': s.critDmg += v; break;
                // 防御
                case 'maxHp': s.maxHp += v; break;
                case 'armor': s.armor += v; break;
                case 'lifeSteal': s.lifeSteal += v; break;
                case 'regen': s.regen += v; break;
                case 'thorn': s.thorn += v; break;
                case 'dodge': s.dodge = Math.min(0.5, s.dodge + v); break;
                case 'shield': s.shield += v; break;
                case 'revive': s.revive += v; break;
                // 移动
                case 'speed': s.speed += v; break;
                case 'fly': s.fly = true; break;
                case 'dashDist': s.dashDist += v; break;
                case 'slowTime': s.slowTime += v; break;
                // 资源
                case 'magnet': s.magnet += v; break;
                case 'goldBonus': s.goldBonus += v; break;
                case 'luck': s.luck += v; break;
                case 'goldOnKill': s.goldOnKill += v; break;
                case 'expBonus': s.expBonus += v; break;
                case 'pickupRange': s.pickupRange += v; break;
                // 伤害类型
                case 'fireDmg': s.fireDmg += v; break;
                case 'thunderDmg': s.thunderDmg += v; break;
                case 'poisonDmg': s.poisonDmg += v; break;
                case 'curseDmg': s.curseDmg += v; break;
                case 'slow': s.slowAmount += v; break;
                case 'chain': s.chain = (s.chain || 0) + v; break;
                // 特殊效果
                case 'spread': s.spread += v; break;
                case 'homing': s.homing += v; break;
                case 'bounce': s.bounce += v; break;
                case 'burst': s.burst += v; break;
                // 召唤
                case 'fairy': s.fairy += v; break;
                case 'orbit': s.orbit += v; break;
                case 'dragon': s.dragon += v; break;
                // 诅咒
                case 'glassCannon': s.glassCannon += v; break;
                case 'bloodMoney': s.bloodMoney += v; break;
                // 特殊
                case 'invincible': s.invincible += v; break;
                case 'upgradeAll': s.upgradeAll += v; break;
            }
        }
        
        // 诅咒效果处理
        if (s.glassCannon > 0) {
            s.fireRate *= 1.5;
            s.maxHp *= 0.7;
        }
        if (s.bloodMoney > 0) {
            s.goldBonus *= 2;
        }
        if (s.upgradeAll > 0) {
            s.speed *= 1.1;
            s.fireRate *= 1.1;
            s.crit = Math.min(1, s.crit * 1.1 + 0.1);
        }
        
        this.cache = s;
        this.dirty = false;
        return s;
    }

    has(id) { return (this.owned[id] || 0) > 0; }
    count(id) { return this.owned[id] || 0; }
    
    // 获取拥有的道具列表（用于UI显示）
    getOwnedItems() {
        const items = [];
        for (const [id, count] of Object.entries(this.owned)) {
            const item = ITEMS[id];
            if (item && count > 0) {
                items.push({
                    id: id,
                    name: item.name,
                    icon: item.icon,
                    count: count,
                    desc: item.desc
                });
            }
        }
        return items;
    }
}

// 被动道具管理器（吸血鬼幸存者风格）
class PassiveManager {
    constructor(player) {
        this.player = player;
        this.passives = {}; // { key: level }
    }
    
    // 添加或升级被动
    add(key) {
        const passive = PASSIVES[key];
        if (!passive) return false;
        
        const currentLevel = this.passives[key] || 0;
        if (currentLevel >= passive.maxLevel) return false; // 已满级
        
        this.passives[key] = currentLevel + 1;
        
        // 立即应用被动效果
        this.applyEffect(passive);
        
        return true;
    }
    
    // 应用被动效果
    applyEffect(passive) {
        switch(passive.effect) {
            case 'maxHpPct':
                // 空心之心：增加最大生命值百分比
                const hpBonus = Math.floor(this.player.maxHp * passive.value);
                this.player.maxHp += hpBonus;
                this.player.hp += hpBonus;
                break;
        }
    }
    
    // 获取被动效果统计
    getStats() {
        const stats = {
            dmg: 1,           // 菠菜
            armor: 0,         // 护甲
            maxHpPct: 0,      // 空心之心
            cooldown: 1,      // 空白之书（冷却倍率，越小越好）
            range: 1,         // 烛台
            projSpeed: 1,     // 护腕
            duration: 1,      // 魔法拼写器
            projCount: 0,     // 复制器
            speed: 1,         // 翅膀
            magnet: 0,        // 吸引器
            luck: 0,          // 四叶草
            expBonus: 0       // 王冠
        };
        
        for (const [key, level] of Object.entries(this.passives)) {
            const passive = PASSIVES[key];
            if (!passive || level <= 0) continue;
            
            const totalValue = passive.value * level;
            
            switch(passive.effect) {
                case 'dmg':
                    stats.dmg += totalValue;
                    break;
                case 'armor':
                    stats.armor += totalValue;
                    break;
                case 'maxHpPct':
                    stats.maxHpPct += totalValue;
                    break;
                case 'cooldown':
                    stats.cooldown *= Math.pow(1 - passive.value, level);
                    break;
                case 'range':
                    stats.range += totalValue;
                    break;
                case 'projSpeed':
                    stats.projSpeed += totalValue;
                    break;
                case 'duration':
                    stats.duration += totalValue;
                    break;
                case 'projCount':
                    stats.projCount += totalValue;
                    break;
                case 'speed':
                    stats.speed += totalValue;
                    break;
                case 'magnet':
                    stats.magnet += totalValue;
                    break;
                case 'luck':
                    stats.luck += totalValue;
                    break;
                case 'expBonus':
                    stats.expBonus += totalValue;
                    break;
            }
        }
        
        return stats;
    }
    
    // 检查是否有某个被动
    has(key) {
        return (this.passives[key] || 0) > 0;
    }
    
    // 获取被动等级
    getLevel(key) {
        return this.passives[key] || 0;
    }
    
    // 获取所有被动列表（用于UI显示）
    getOwnedPassives() {
        const list = [];
        for (const [key, level] of Object.entries(this.passives)) {
            const passive = PASSIVES[key];
            if (passive && level > 0) {
                list.push({
                    key: key,
                    name: passive.name,
                    icon: passive.icon,
                    level: level,
                    maxLevel: passive.maxLevel,
                    desc: passive.desc
                });
            }
        }
        return list;
    }
    
    // 检查是否可以合成超武
    checkEvolution(weaponKey) {
        const evo = WEAPON_EVOLUTIONS[weaponKey];
        if (!evo) return null;
        
        // 检查是否有对应被动
        if (!this.has(evo.requires)) return null;
        
        return evo;
    }
    
    // 序列化（用于存档）
    serialize() {
        return this.passives;
    }
    
    // 反序列化（用于读档）
    deserialize(data) {
        this.passives = data || {};
    }
}

// 武器系统 - 支持进化
const WEAPONS = {
    // 基础武器（吸血鬼幸存者风格）
    whip: { key: 'whip', name: '鞭子', icon: '🪄', dmg: 20, cd: 1.0, range: 100, type: 'melee', color: '#f60', maxLevel: 8 },
    wand: { key: 'wand', name: '魔杖', icon: '🔮', dmg: 15, cd: 0.6, speed: 300, type: 'proj', color: '#48f', maxLevel: 8 },
    knife: { key: 'knife', name: '飞刀', icon: '🗡️', dmg: 12, cd: 0.4, speed: 400, pierce: 3, type: 'proj', color: '#ccc', maxLevel: 8 },
    axe: { key: 'axe', name: '斧头', icon: '🪓', dmg: 25, cd: 1.2, speed: 250, type: 'proj', color: '#8b4513', maxLevel: 8 },
    bible: { key: 'bible', name: '圣经', icon: '📖', dmg: 10, cd: 0.8, range: 80, type: 'orbit', color: '#ffd700', maxLevel: 8 },
    fireball: { key: 'fireball', name: '火球', icon: '🔥', dmg: 30, cd: 1.5, speed: 200, type: 'proj', color: '#ff4500', maxLevel: 8 },
    lightning: { key: 'lightning', name: '闪电', icon: '⚡', dmg: 18, cd: 0.5, range: 150, type: 'instant', color: '#ffff00', maxLevel: 8 },
    holy_water: { key: 'holy_water', name: '圣水', icon: '💧', dmg: 8, cd: 1.0, range: 60, type: 'area', color: '#00bfff', maxLevel: 8 },
    cross: { key: 'cross', name: '十字架', icon: '✝️', dmg: 22, cd: 1.0, speed: 250, type: 'proj', color: '#ddd', maxLevel: 8 },
    garlic: { key: 'garlic', name: '大蒜', icon: '🧄', dmg: 5, cd: 0.3, range: 50, type: 'aura', color: '#4a4', maxLevel: 8 },
    // 新增武器
    shuriken: { key: 'shuriken', name: '手里剑', icon: '🎯', dmg: 18, cd: 0.7, speed: 350, pierce: 2, type: 'proj', color: '#888', maxLevel: 8 },
    icicle: { key: 'icicle', name: '冰锥', icon: '❄️', dmg: 22, cd: 0.9, speed: 280, type: 'proj', color: '#aff', maxLevel: 8 },
    scythe: { key: 'scythe', name: '镰刀', icon: '⚰️', dmg: 35, cd: 1.3, range: 90, type: 'melee', color: '#848', maxLevel: 8 },
    // v0.30: 激光武器
    laser: { key: 'laser', name: '激光', icon: '🔴', dmg: 15, cd: 0.5, range: 3000, type: 'laser', color: '#ff0044', maxLevel: 8, width: 12 },
    poison_dart: { key: 'poison_dart', name: '毒镖', icon: '📍', dmg: 12, cd: 0.5, speed: 380, type: 'proj', color: '#4a4', maxLevel: 8 }
};

// 被动道具系统（吸血鬼幸存者风格）
const PASSIVES = {
    spinach: { key: 'spinach', name: '菠菜', icon: '🥬', desc: '伤害+10%', effect: 'dmg', value: 0.1, maxLevel: 5 },
    armor: { key: 'armor', name: '护甲', icon: '🛡️', desc: '减伤+1', effect: 'armor', value: 1, maxLevel: 5 },
    hollow_heart: { key: 'hollow_heart', name: '空心之心', icon: '💝', desc: '最大生命+20%', effect: 'maxHpPct', value: 0.2, maxLevel: 5 },
    empty_tome: { key: 'empty_tome', name: '空白之书', icon: '📚', desc: '冷却-8%', effect: 'cooldown', value: 0.08, maxLevel: 5 },
    candelabrador: { key: 'candelabrador', name: '烛台', icon: '🕯️', desc: '攻击范围+10%', effect: 'range', value: 0.1, maxLevel: 5 },
    bracer: { key: 'bracer', name: '护腕', icon: '💪', desc: '弹射速度+10%', effect: 'projSpeed', value: 0.1, maxLevel: 5 },
    spellbinder: { key: 'spellbinder', name: '魔法拼写器', icon: '✨', desc: '持续时间+10%', effect: 'duration', value: 0.1, maxLevel: 5 },
    duplicator: { key: 'duplicator', name: '复制器', icon: '🔄', desc: '投射物数量+1', effect: 'projCount', value: 1, maxLevel: 5 },
    wings: { key: 'wings', name: '翅膀', icon: '🪶', desc: '移速+10%', effect: 'speed', value: 0.1, maxLevel: 5 },
    attractorb: { key: 'attractorb', name: '吸引器', icon: '🧲', desc: '拾取范围+25%', effect: 'magnet', value: 25, maxLevel: 5 },
    clover: { key: 'clover', name: '四叶草', icon: '🍀', desc: '幸运+10%', effect: 'luck', value: 0.1, maxLevel: 5 },
    crown: { key: 'crown', name: '王冠', icon: '👑', desc: '经验获取+8%', effect: 'expBonus', value: 0.08, maxLevel: 5 }
};

// 超武合成配方（武器满级+对应被动=超武）
const WEAPON_EVOLUTIONS = {
    whip: { 
        requires: 'hollow_heart', 
        result: 'blood_whip',
        name: '血鞭',
        icon: '🩸',
        desc: '可暴击并吸血',
        bonus: { dmg: 1.5, lifeSteal: 0.1, crit: 0.15 }
    },
    wand: { 
        requires: 'empty_tome', 
        result: 'holy_wand',
        name: '圣魔杖',
        icon: '🔯',
        desc: '无CD自动追踪',
        bonus: { cd: 0.3, homing: true }
    },
    knife: { 
        requires: 'bracer', 
        result: 'thousand_edge',
        name: '千刃',
        icon: '💠',
        desc: '极速连射',
        bonus: { cd: 0.2, projCount: 2 }
    },
    axe: { 
        requires: 'candelabrador', 
        result: 'death_spiral',
        name: '死亡螺旋',
        icon: '🌀',
        desc: '穿透高伤',
        bonus: { dmg: 1.8, pierce: 5 }
    },
    cross: { 
        requires: 'clover', 
        result: 'heaven_sword',
        name: '天堂之剑',
        icon: '⚔️',
        desc: '高暴击',
        bonus: { dmg: 2, crit: 0.25 }
    },
    bible: { 
        requires: 'spellbinder', 
        result: 'unholy_vespers',
        name: '邪恶晚祷',
        icon: '📿',
        desc: '永不消失',
        bonus: { duration: 3 }
    },
    fireball: { 
        requires: 'spinach', 
        result: 'hellfire',
        name: '地狱火',
        icon: '🔥',
        desc: '穿透火焰',
        bonus: { dmg: 1.5, pierce: 3 }
    },
    holy_water: { 
        requires: 'attractorb', 
        result: 'la_borra',
        name: '拉博拉',
        icon: '💦',
        desc: '追踪区域',
        bonus: { homing: true, range: 1.3 }
    },
    // 新增超武合成
    shuriken: { 
        requires: 'duplicator', 
        result: 'ninja_storm',
        name: '忍者风暴',
        icon: '🌀',
        desc: '弹幕齐射',
        bonus: { projCount: 3, cd: 0.5 }
    },
    icicle: { 
        requires: 'spellbinder', 
        result: 'blizzard',
        name: '暴风雪',
        icon: '🌨️',
        desc: '范围冰冻',
        bonus: { range: 2, slow: true }
    },
    scythe: { 
        requires: 'candelabrador', 
        result: 'grim_reaper',
        name: '死神镰刀',
        icon: '💀',
        desc: '即死判定',
        bonus: { dmg: 2, execute: 0.1 }
    },
    // v0.30: 激光进化为棱镜激光
    laser: { 
        requires: 'duplicator', 
        result: 'prism_laser',
        name: '棱镜激光',
        icon: '🔴',
        desc: '三道棱镜激光分裂',
        bonus: { count: 3, width: 1.5, cd: 0.6 }
    },
    poison_dart: { 
        requires: 'attractorb', 
        result: 'venom_strike',
        name: '剧毒打击',
        icon: '☠️',
        desc: '剧毒蔓延',
        bonus: { poison: true, poisonDmg: 5 }
    }
};

// 超武定义
const SUPER_WEAPONS = {
    blood_whip: { name: '血鞭', icon: '🩸', dmg: 35, cd: 0.8, range: 120, type: 'melee', color: '#c00' },
    holy_wand: { name: '圣魔杖', icon: '🔯', dmg: 20, cd: 0.2, speed: 350, type: 'proj', color: '#88f' },
    thousand_edge: { name: '千刃', icon: '💠', dmg: 15, cd: 0.1, speed: 500, pierce: 5, type: 'proj', color: '#0ff' },
    death_spiral: { name: '死亡螺旋', icon: '🌀', dmg: 45, cd: 1.0, speed: 200, pierce: 10, type: 'proj', color: '#800' },
    heaven_sword: { name: '天堂之剑', icon: '⚔️', dmg: 50, cd: 1.2, speed: 300, type: 'proj', color: '#fe0' },
    unholy_vespers: { name: '邪恶晚祷', icon: '📿', dmg: 18, cd: 0.5, range: 100, type: 'orbit', color: '#4a0' },
    hellfire: { name: '地狱火', icon: '🔥', dmg: 50, cd: 1.2, speed: 250, pierce: 5, type: 'proj', color: '#f40' },
    la_borra: { name: '拉博拉', icon: '💦', dmg: 12, cd: 0.8, range: 80, type: 'area', color: '#48f' },
    // 新增超武
    ninja_storm: { name: '忍者风暴', icon: '🌀', dmg: 25, cd: 0.4, speed: 400, pierce: 3, type: 'proj', color: '#888' },
    blizzard: { name: '暴风雪', icon: '🌨️', dmg: 30, cd: 1.0, speed: 200, range: 200, type: 'area', color: '#aff' },
    grim_reaper: { name: '死神镰刀', icon: '💀', dmg: 60, cd: 1.0, range: 120, type: 'melee', color: '#848' },
    // v0.30: 棱镜激光超武
    prism_laser: { name: '棱镜激光', icon: '🔴', dmg: 35, cd: 0.3, range: 3000, type: 'laser', color: '#ff0044', width: 18, count: 3 },
    venom_strike: { name: '剧毒打击', icon: '☠️', dmg: 15, cd: 0.4, speed: 400, type: 'proj', color: '#4a4' }
};

class Weapon {
    constructor(key, level = 1, isSuper = false) {
        this.baseKey = key;
        this.isSuper = isSuper; // 是否为超武
        
        // 根据是否是超武选择配置
        if (isSuper && SUPER_WEAPONS[key]) {
            this.cfg = { ...SUPER_WEAPONS[key] };
            this.level = 1; // 超武固定1级
            this.maxLevel = 1;
        } else {
            this.cfg = { ...WEAPONS[key] };
            this.level = level;
            this.maxLevel = WEAPONS[key]?.maxLevel || 8;
        }
        
        this.cd = 0;
        this.xp = 0;
        this.xpToNext = 100;
    }
    
    // 进化成超武
    evolveToSuper(evoKey) {
        if (!SUPER_WEAPONS[evoKey]) return false;
        
        this.isSuper = true;
        this.baseKey = evoKey;
        this.cfg = { ...SUPER_WEAPONS[evoKey] };
        this.level = 1;
        this.maxLevel = 1;
        
        return true;
    }
    
    // 检查是否可以升级
    canLevelUp() {
        if (this.isSuper) return false; // 超武不能升级
        return this.level < this.maxLevel;
    }
    
    getDamage(stats) { 
        if (this.isSuper) return this.cfg.dmg; // 超武固定伤害
        let dmg = this.cfg.dmg * (1 + (this.level - 1) * 0.15);
        return dmg;
    }
    
    update(dt) { this.cd -= dt; }
    canFire() { return this.cd <= 0; }
    
    addXp(amount) {
        if (this.isSuper) return false; // 超武不能升级
        if (this.level >= this.maxLevel) return false; // 满级
        
        this.xp += amount;
        if (this.xp >= this.xpToNext) {
            this.xp -= this.xpToNext;
            this.level++;
            this.xpToNext = Math.floor(this.xpToNext * 1.5);
            return true;
        }
        return false;
    }
    
    getLevelColor() {
        if (this.isSuper) return '#f0f'; // 超武紫色
        if (this.level >= this.maxLevel) return '#fa0'; // 满级金色
        if (this.level >= 5) return '#0ff';
        if (this.level >= 3) return '#4f4';
        if (this.level >= 2) return '#fff';
        return '#aaa';
    }
    
    fire(player, target, stats) {
        // 防止除以零或无效值
        const fireRate = (stats && stats.fireRate > 0) ? stats.fireRate : 1;
        this.cd = this.cfg.cd / fireRate;
        
        // 激光类型特殊处理
        if (this.cfg.type === 'laser') {
            // 激光武器只在有目标时返回标记，不创建普通子弹
            if (!target) return [];
            return [{
                type: 'laser',
                isLaser: true,
                weapon: this,
                target: target,
                dmg: this.getDamage(stats),
                color: this.cfg.color,
                width: (this.cfg.width || 12) * (1 + (this.level - 1) * 0.1),
                range: this.cfg.range || 3000,
                isSuper: this.isSuper
            }];
        }
        
        const bullets = [];
        const count = Math.max(1, Math.floor(stats.projCount || 1));
        
        for (let i = 0; i < count; i++) {
            let angle = 0;
            if (target) {
                angle = Math.atan2(target.y - player.y, target.x - player.x);
                if (count > 1) angle += (i - (count - 1) / 2) * 0.15;
            } else {
                angle = Math.random() * Math.PI * 2;
            }
            
            bullets.push({
                x: player.x, y: player.y,
                vx: Math.cos(angle) * (this.cfg.speed || 200),
                vy: Math.sin(angle) * (this.cfg.speed || 200),
                dmg: this.getDamage(stats),
                color: this.cfg.color,
                icon: this.cfg.icon,  // 添加武器图标
                life: this.cfg.type === 'melee' ? 0.3 : 3,
                pierce: (this.cfg.pierce || 0) + stats.pierce,
                type: this.cfg.type,
                range: this.cfg.range,
                hits: new Set(),
                homing: this.cfg.type !== 'melee',
                target: target,
                weapon: this
            });
        }
        return bullets;
    }
}

// 敌人配置（第4次迭代：使用全部22种模型）
const ENEMY_TYPES = {
    // === Tier 1: 弱小敌人 ===
    chick: { name: '变异小鸡', hp: 8, speed: 160, dmg: 1, exp: 2, gold: 3, color: '#ff6', sprite: 'chick', anim: 'hop' },
    mouse: { name: '感染老鼠', hp: 6, speed: 200, dmg: 1, exp: 2, gold: 2, color: '#888', sprite: 'mouse', anim: 'scurry' },
    snail: { name: '寄生蜗牛', hp: 15, speed: 40, dmg: 1, exp: 1, gold: 2, color: '#8a8', sprite: 'snail', anim: 'slide' },
    pigeon: { name: '变异鸽子', hp: 10, speed: 180, dmg: 1, exp: 2, gold: 3, color: '#ccc', sprite: 'pigeon', anim: 'flutter' },
    duck3: { name: '小野鸭', hp: 8, speed: 140, dmg: 1, exp: 2, gold: 2, color: '#ff6', sprite: 'duck3', anim: 'waddle' },
    
    // === Tier 2: 普通敌人 ===
    rabbit: { name: '狂暴兔子', hp: 12, speed: 180, dmg: 2, exp: 3, gold: 4, color: '#f99', sprite: 'rabbit', anim: 'hop' },
    rabbit2: { name: '暴走兔', hp: 10, speed: 220, dmg: 2, exp: 3, gold: 4, color: '#f66', sprite: 'rabbit2', anim: 'hopfast' },
    bird: { name: '感染小鸟', hp: 10, speed: 240, dmg: 1, exp: 3, gold: 4, color: '#9cf', sprite: 'bird', anim: 'fly' },
    duck2: { name: '鸭鸭', hp: 12, speed: 130, dmg: 2, exp: 3, gold: 4, color: '#fc6', sprite: 'duck2', anim: 'waddle' },
    pig2: { name: '小猪崽', hp: 18, speed: 80, dmg: 2, exp: 3, gold: 5, color: '#fcc', sprite: 'pig2', anim: 'waddle' },
    
    // === Tier 3: 标准敌人 ===
    cat: { name: '变异猫', hp: 18, speed: 190, dmg: 2, exp: 4, gold: 6, color: '#fa3', sprite: 'cat', anim: 'prowl' },
    duck: { name: '感染鸭子', hp: 16, speed: 120, dmg: 2, exp: 4, gold: 5, color: '#ff0', sprite: 'duck', anim: 'waddle' },
    squirrel: { name: '疯狂松鼠', hp: 14, speed: 220, dmg: 2, exp: 4, gold: 6, color: '#963', sprite: 'squirrel', anim: 'scurry' },
    goose: { name: '守卫鹅', hp: 20, speed: 150, dmg: 2, exp: 4, gold: 6, color: '#fff', sprite: 'goose', anim: 'charge', special: 'charge' },
    
    // === Tier 4: 较强敌人 ===
    dog: { name: '疯狗', hp: 22, speed: 210, dmg: 3, exp: 6, gold: 8, color: '#963', sprite: 'dog', anim: 'run' },
    pig: { name: '变异小猪', hp: 28, speed: 90, dmg: 3, exp: 6, gold: 9, color: '#f9c', sprite: 'pig', anim: 'waddle' },
    sheep: { name: '变异小羊', hp: 24, speed: 110, dmg: 2, exp: 5, gold: 7, color: '#eee', sprite: 'sheep', anim: 'trot' },
    snake: { name: '毒蛇', hp: 16, speed: 190, dmg: 3, exp: 5, gold: 8, color: '#4a4', sprite: 'snake', anim: 'slither', special: 'poison' },
    
    // === Tier 5: 精英敌人 ===
    bear: { name: '巨熊', hp: 45, speed: 80, dmg: 4, exp: 10, gold: 15, color: '#630', sprite: 'bear', anim: 'heavy' },
    crab: { name: '铁甲蟹', hp: 55, speed: 70, dmg: 3, exp: 12, gold: 18, color: '#f44', sprite: 'crab', anim: 'sidle', armor: 3 },
    dog2: { name: '恶犬', hp: 30, speed: 200, dmg: 3, exp: 8, gold: 12, color: '#844', sprite: 'dog2', anim: 'run' },
    
    // === Tier 6: Boss级 ===
    turtle: { name: '玄龟', hp: 80, speed: 50, dmg: 5, exp: 20, gold: 30, color: '#2a2', sprite: 'turtle', anim: 'crawl', armor: 5 },
    
    // === 特殊敌人（剧情相关） ===
    tiaotiao: { name: '跳跳', hp: 30, speed: 260, dmg: 3, exp: 15, gold: 20, color: '#c85', sprite: 'rabbit', anim: 'hop', special: 'jump' },
    tiezhua: { name: '铁爪', hp: 28, speed: 320, dmg: 4, exp: 18, gold: 22, color: '#a52', sprite: 'bird', anim: 'dive', special: 'dive' },
    nibei: { name: '泥背', hp: 70, speed: 60, dmg: 3, exp: 20, gold: 35, color: '#6a5', sprite: 'turtle', anim: 'crawl', special: 'tank', armor: 4 },
    yinya: { name: '银牙', hp: 45, speed: 200, dmg: 4, exp: 25, gold: 30, color: '#789', sprite: 'dog2', anim: 'run', special: 'summon' },
    boss_dog: { name: '狼王', hp: 65, speed: 170, dmg: 4, exp: 18, gold: 25, color: '#444', sprite: 'dog2', anim: 'run', special: 'howl' },
    
    // 新增敌人
    // Tier 1 新敌人
    frog: { name: '变异蛙', hp: 9, speed: 100, dmg: 1, exp: 2, gold: 3, color: '#4a4', sprite: 'frog', anim: 'hop' },
    bat: { name: '蝙蝠', hp: 7, speed: 220, dmg: 1, exp: 2, gold: 3, color: '#668', sprite: 'bird', anim: 'fly' },
    
    // Tier 2 新敌人
    fox: { name: '狡猾狐狸', hp: 14, speed: 200, dmg: 2, exp: 3, gold: 5, color: '#d82', sprite: 'dog', anim: 'run' },
    bee: { name: '毒蜂', hp: 8, speed: 260, dmg: 2, exp: 3, gold: 4, color: '#fc0', sprite: 'bird', anim: 'fly' },
    
    // Tier 3 新敌人
    wolf: { name: '野狼', hp: 20, speed: 180, dmg: 2, exp: 5, gold: 7, color: '#aaa', sprite: 'dog2', anim: 'run' },
    owl: { name: '夜枭', hp: 18, speed: 160, dmg: 2, exp: 5, gold: 6, color: '#864', sprite: 'bird', anim: 'fly' },
    
    // Tier 4 新敌人
    boar: { name: '野猪', hp: 32, speed: 120, dmg: 3, exp: 7, gold: 10, color: '#654', sprite: 'pig', anim: 'charge' },
    spider: { name: '巨蛛', hp: 22, speed: 150, dmg: 3, exp: 6, gold: 8, color: '#422', sprite: 'snake', anim: 'crawl' },
    
    // Tier 5 新敌人
    panther: { name: '黑豹', hp: 40, speed: 240, dmg: 4, exp: 12, gold: 20, color: '#222', sprite: 'cat', anim: 'prowl' },
    scorpion: { name: '毒蝎', hp: 35, speed: 140, dmg: 4, exp: 10, gold: 16, color: '#a40', sprite: 'crab', anim: 'sidle' },
    
    // 特殊敌人
    mimic: { name: '宝箱怪', hp: 50, speed: 100, dmg: 5, exp: 30, gold: 50, color: '#a44', sprite: 'bear', anim: 'heavy', special: 'mimic' },
    ghost: { name: '幽灵', hp: 25, speed: 180, dmg: 3, exp: 15, gold: 25, color: '#8ff', sprite: 'pigeon', anim: 'flutter', special: 'ethereal' }
};

// BOSS配置
const BOSS_TYPES = {
    mother: {
        name: '母体',
        hp: 500,
        speed: 30,
        dmg: 5,
        exp: 100,
        gold: 200,
        color: '#f0f',
        sprite: 'bear',
        scale: 2,
        phases: [
            { hpPercent: 100, behavior: 'normal' },
            { hpPercent: 70, behavior: 'enrage' },
            { hpPercent: 30, behavior: 'desperate' }
        ]
    }
};

class Enemy {
    constructor(x, y, typeKey) {
        const cfg = ENEMY_TYPES[typeKey] || ENEMY_TYPES.chick;
        this.x = x; this.y = y;
        this.typeKey = typeKey;
        this.hp = cfg.hp + (cfg.armor || 0) * 10;
        this.maxHp = this.hp;
        this.speed = cfg.speed;
        this.dmg = cfg.dmg;
        this.exp = cfg.exp;
        this.gold = cfg.gold || 5;
        this.color = cfg.color;
        this.sprite = cfg.sprite;
        this.special = cfg.special;
        this.armor = cfg.armor || 0;
        this.vx = 0; this.vy = 0;
        this.hitTimer = 0;
        this.attackCd = 0;
        this.specialCd = 0;
        
        // 状态效果
        this.slowTimer = 0;
        this.stunTimer = 0;
        this.poisonTimer = 0;
        this.poisonDmg = 0;
        
        // 动画系统
        this.animType = cfg.anim || 'walk';
        this.animTimer = 0;
        this.facingRight = true;
        this.walkCycle = 0;
    }

    update(dt, player, room) {
        // 状态效果处理
        if (this.stunTimer > 0) {
            this.stunTimer -= dt;
            return; // 眩晕时无法行动
        }
        
        if (this.slowTimer > 0) {
            this.slowTimer -= dt;
            dt *= 0.5; // 减速50%
        }
        
        if (this.poisonTimer > 0) {
            this.poisonTimer -= dt;
            this.hp -= this.poisonDmg * dt;
        }
        
        // 特殊行为
        if (this.special === 'jump' && this.specialCd <= 0) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const d = Math.sqrt(dx*dx + dy*dy);
            if (d > 0 && d < 200) {
                this.vx = (dx / d) * this.speed * 2;
                this.vy = (dy / d) * this.speed * 2;
                this.specialCd = 2;
            }
        } else if (this.special === 'dive' && this.specialCd <= 0) {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const d = Math.sqrt(dx*dx + dy*dy);
            if (d > 100 && d < 400) {
                this.vx = (dx / d) * this.speed * 3;
                this.vy = (dy / d) * this.speed * 3;
                this.specialCd = 3;
            }
        } else {
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const d = Math.sqrt(dx*dx + dy*dy);
            
            if (d > 0) {
                this.vx = (dx / d) * this.speed;
                this.vy = (dy / d) * this.speed;
            }
        }
        
        if (this.special === 'tank') {
            this.vx *= 0.8;
            this.vy *= 0.8;
        }
        
        if (this.special === 'summon' && this.specialCd <= 0 && room.enemies.length < 10) {
            this.specialCd = 5;
            const angle = Math.random() * Math.PI * 2;
            const r = 30;
            room.enemies.push(new Enemy(
                this.x + Math.cos(angle) * r,
                this.y + Math.sin(angle) * r,
                'dog'
            ));
        }
        
        for (const other of room.enemies) {
            if (other === this) continue;
            const odx = this.x - other.x;
            const ody = this.y - other.y;
            const od = Math.sqrt(odx*odx + ody*ody);
            if (od < 30 && od > 0) {
                this.vx += (odx / od) * 50;
                this.vy += (ody / od) * 50;
            }
        }
        
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        // 使用房间实际尺寸限制敌人移动
        const wallT = 60;
        const maxX = room ? room.width - wallT : 1140;
        const maxY = room ? room.height - wallT : 740;
        this.x = clamp(this.x, wallT, maxX);
        this.y = clamp(this.y, wallT, maxY);
        
        // 更新动画状态
        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > 10) {
            // 根据速度方向决定朝向
            if (Math.abs(this.vx) > Math.abs(this.vy)) {
                this.facingRight = this.vx > 0;
            }
            // 更新行走周期
            this.walkCycle += speed * dt * 0.02;
        } else {
            this.walkCycle = 0;
        }
        this.animTimer += dt;
        
        if (this.hitTimer > 0) this.hitTimer -= dt;
        if (this.attackCd > 0) this.attackCd -= dt;
        if (this.specialCd > 0) this.specialCd -= dt;
    }

    takeDamage(dmg, stats = {}) {
        const actualDmg = Math.max(1, dmg - this.armor);
        this.hp -= actualDmg;
        this.hitTimer = 0.15;
        
        // 显示伤害数字
        if (window.game && window.game.damageNumbers) {
            const isCrit = stats.crit && Math.random() < stats.crit;
            window.game.damageNumbers.spawn(this.x, this.y - 20, Math.floor(actualDmg), {
                critical: isCrit
            });
        }
        
        // 受击粒子效果
        if (window.game && window.game.particles) {
            window.game.particles.burst(this.x, this.y, '#fff', 5, { type: 'circle', life: 0.3 });
            // 出血效果
            window.game.particles.burst(this.x, this.y, '#f44', 3, { type: 'circle', size: 3 });
        }
        
        // 击退效果
        if (stats.knockback && window.game && window.game.player) {
            const angle = Math.atan2(this.y - window.game.player.y, this.x - window.game.player.x);
            this.x += Math.cos(angle) * stats.knockback;
            this.y += Math.sin(angle) * stats.knockback;
        }
        
        // 应用状态效果
        if (stats.slowChance && Math.random() < stats.slowChance) {
            this.slowTimer = 2;
        }
        if (stats.stunChance && Math.random() < stats.stunChance) {
            this.stunTimer = 1;
        }
        
        return this.hp <= 0;
    }

    applyPoison(dmg, duration) {
        this.poisonDmg = Math.max(this.poisonDmg, dmg);
        this.poisonTimer = Math.max(this.poisonTimer, duration);
    }

    // 使用世界坐标绘制（在Room.draw中使用）
    draw(ctx, sprites) {
        const size = this.isBoss ? 36 : 16;
        
        if (this.hitTimer > 0 && Math.floor(Date.now() / 50) % 2) {
            ctx.globalAlpha = 0.5;
        }
        
        // 状态效果视觉
        if (this.slowTimer > 0) {
            ctx.strokeStyle = '#48f';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, size + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
        if (this.poisonTimer > 0) {
            ctx.strokeStyle = '#4a4';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, size + 8, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        if (this.isBoss) {
            ctx.strokeStyle = `rgba(255, 0, 255, ${0.3 + Math.sin(Date.now() / 200) * 0.2})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, size + 10, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // 绘制敌人精灵（带动画效果）
        const sprite = sprites.get(this.sprite);
        if (sprite) {
            ctx.save();
            
            // 计算动画偏移和旋转
            let offsetY = 0;
            let rotate = 0;
            let scaleX = this.facingRight ? 1 : -1;
            let scaleY = 1;
            
            const walkPhase = Math.sin(this.walkCycle);
            const walkPhase2 = Math.cos(this.walkCycle);
            
            switch (this.animType) {
                case 'hop': // 跳跃 - 大幅上下弹跳
                    offsetY = Math.abs(Math.sin(this.walkCycle * 0.5)) * -8;
                    rotate = this.vx * 0.01;
                    break;
                case 'hopfast': // 快速跳跃
                    offsetY = Math.abs(Math.sin(this.walkCycle * 0.8)) * -6;
                    rotate = this.vx * 0.015;
                    break;
                case 'scurry': // 疾走 - 高频小幅
                    offsetY = walkPhase * 2;
                    rotate = walkPhase * 0.1;
                    break;
                case 'slide': // 滑动 - 平滑
                    offsetY = 0;
                    rotate = 0;
                    break;
                case 'flutter': // 振翅 - 快速振动
                    offsetY = Math.sin(this.animTimer * 15) * 3;
                    rotate = Math.sin(this.animTimer * 10) * 0.1;
                    break;
                case 'waddle': // 摇摆 - 左右摇摆
                    offsetY = Math.abs(walkPhase) * -2;
                    rotate = walkPhase * 0.2;
                    break;
                case 'fly': // 飞行 - 上下浮动
                    offsetY = Math.sin(this.animTimer * 3) * 4;
                    rotate = this.vx * 0.005;
                    break;
                case 'prowl': // 潜行 - 缓慢接近
                    offsetY = walkPhase2 * 1;
                    rotate = walkPhase * 0.05;
                    break;
                case 'run': // 奔跑
                    offsetY = Math.abs(walkPhase) * -3;
                    rotate = this.vx * 0.008;
                    break;
                case 'trot': // 小跑
                    offsetY = walkPhase * 2;
                    rotate = walkPhase * 0.08;
                    break;
                case 'slither': // 滑行 - S形
                    offsetY = Math.sin(this.x * 0.1 + this.animTimer * 5) * 2;
                    rotate = Math.cos(this.x * 0.1 + this.animTimer * 5) * 0.15;
                    break;
                case 'heavy': // 沉重 - 慢速大幅
                    offsetY = Math.abs(walkPhase) * -4;
                    rotate = walkPhase * 0.15;
                    break;
                case 'sidle': // 横移
                    offsetY = 0;
                    rotate = walkPhase * 0.1;
                    break;
                case 'crawl': // 爬行
                    offsetY = 4;
                    scaleY = 0.7;
                    rotate = walkPhase * 0.05;
                    break;
                case 'charge': // 冲锋
                    offsetY = Math.abs(walkPhase) * -2;
                    rotate = this.facingRight ? 0.1 : -0.1;
                    break;
                case 'dive': // 俯冲
                    offsetY = Math.sin(this.animTimer * 8) * 6;
                    rotate = this.vy * 0.02;
                    break;
                default: // 默认行走
                    offsetY = walkPhase * 1.5;
                    rotate = this.vx * 0.003;
            }
            
            // 应用变换
            ctx.translate(this.x, this.y + offsetY);
            ctx.rotate(rotate);
            ctx.scale(scaleX, scaleY);
            
            // 精英敌人：绘制颜色叠加效果（换色）
            if (this.isElite) {
                // 使用混合模式给精英敌人添加颜色色调
                ctx.save();
                ctx.globalCompositeOperation = 'source-atop';
                ctx.fillStyle = 'rgba(255, 100, 100, 0.4)'; // 红色精英色调
                ctx.fillRect(-size, -size, size * 2, size * 2);
                ctx.restore();
            }
            
            // 绘制精灵
            ctx.drawImage(sprite, -size, -size, size * 2, size * 2);
            
            // 精英敌人：添加发光边框效果
            if (this.isElite) {
                ctx.save();
                ctx.strokeStyle = 'rgba(255, 80, 80, 0.8)';
                ctx.lineWidth = 2;
                ctx.strokeRect(-size - 2, -size - 2, size * 2 + 4, size * 2 + 4);
                ctx.restore();
            }
            
            ctx.restore();
        } else {
            // 使用emoji作为后备
            const emojiMap = {
                chick: '🐤', pig: '🐷', sheep: '🐑', dog: '🐕', cat: '🐱',
                bear: '🐻', rabbit: '🐰', bird: '🐦', turtle: '🐢', dog2: '🐺',
                mouse: '🐭', snail: '🐌', squirrel: '🐿️', goose: '🪿',
                duck: '🦆', duck2: '🦆', duck3: '🐥', snake: '🐍',
                crab: '🦀', pigeon: '🕊️', pig2: '🐖', rabbit2: '🐇'
            };
            ctx.font = this.isBoss ? '48px Arial' : '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(emojiMap[this.sprite] || '👾', this.x, this.y + 8);
        }
        
        ctx.globalAlpha = 1;
        
        if (this.hp < this.maxHp) {
            const barWidth = this.isBoss ? 100 : 24;
            ctx.fillStyle = '#000';
            ctx.fillRect(this.x - barWidth/2, this.y - size - 10, barWidth, 6);
            ctx.fillStyle = this.isBoss ? '#f0f' : '#f00';
            ctx.fillRect(this.x - barWidth/2, this.y - size - 10, barWidth * (this.hp / this.maxHp), 6);
        }
        
        if (this.isBoss) {
            ctx.fillStyle = '#f0f';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.name, this.x, this.y - size - 20);
        }
    }
    
    // 使用偏移坐标绘制（在已经translate到屏幕坐标后调用）
    drawWithOffset(ctx, sprites) {
        const size = this.isBoss ? 36 : 16;
        
        if (this.hitTimer > 0 && Math.floor(Date.now() / 50) % 2) {
            ctx.globalAlpha = 0.5;
        }
        
        // 状态效果视觉
        if (this.slowTimer > 0) {
            ctx.strokeStyle = '#48f';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, size + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
        if (this.poisonTimer > 0) {
            ctx.strokeStyle = '#4a4';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, 0, size + 8, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        if (this.isBoss) {
            ctx.strokeStyle = `rgba(255, 0, 255, ${0.3 + Math.sin(Date.now() / 200) * 0.2})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, 0, size + 10, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // 绘制敌人精灵（带动画效果）- 已经在(0,0)位置
        const sprite = sprites.get(this.sprite);
        if (sprite) {
            ctx.save();
            
            // 计算动画偏移和旋转
            let offsetY = 0;
            let rotate = 0;
            let scaleX = this.facingRight ? 1 : -1;
            let scaleY = 1;
            
            const walkPhase = Math.sin(this.walkCycle);
            const walkPhase2 = Math.cos(this.walkCycle);
            
            switch (this.animType) {
                case 'hop':
                    offsetY = Math.abs(Math.sin(this.walkCycle * 0.5)) * -8;
                    rotate = this.vx * 0.01;
                    break;
                case 'hopfast':
                    offsetY = Math.abs(Math.sin(this.walkCycle * 0.8)) * -6;
                    rotate = this.vx * 0.015;
                    break;
                case 'scurry':
                    offsetY = walkPhase * 2;
                    rotate = walkPhase * 0.1;
                    break;
                case 'slide':
                    offsetY = 0;
                    rotate = 0;
                    break;
                case 'flutter':
                    offsetY = Math.sin(this.animTimer * 15) * 3;
                    rotate = Math.sin(this.animTimer * 10) * 0.1;
                    break;
                case 'waddle':
                    offsetY = Math.abs(walkPhase) * -2;
                    rotate = walkPhase * 0.2;
                    break;
                case 'fly':
                    offsetY = Math.sin(this.animTimer * 3) * 4;
                    rotate = this.vx * 0.005;
                    break;
                case 'prowl':
                    offsetY = walkPhase2 * 1;
                    rotate = walkPhase * 0.05;
                    break;
                case 'run':
                    offsetY = Math.abs(walkPhase) * -3;
                    rotate = this.vx * 0.008;
                    break;
                case 'trot':
                    offsetY = walkPhase * 2;
                    rotate = walkPhase * 0.08;
                    break;
                case 'slither':
                    offsetY = Math.sin(this.x * 0.1 + this.animTimer * 5) * 2;
                    rotate = Math.cos(this.x * 0.1 + this.animTimer * 5) * 0.15;
                    break;
                case 'heavy':
                    offsetY = Math.abs(walkPhase) * -4;
                    rotate = walkPhase * 0.15;
                    break;
                case 'sidle':
                    offsetY = 0;
                    rotate = walkPhase * 0.1;
                    break;
                case 'crawl':
                    offsetY = 4;
                    scaleY = 0.7;
                    rotate = walkPhase * 0.05;
                    break;
                case 'charge':
                    offsetY = Math.abs(walkPhase) * -2;
                    rotate = this.facingRight ? 0.1 : -0.1;
                    break;
                case 'dive':
                    offsetY = Math.sin(this.animTimer * 8) * 6;
                    rotate = this.vy * 0.02;
                    break;
                default:
                    offsetY = walkPhase * 1.5;
                    rotate = this.vx * 0.003;
            }
            
            // 应用变换
            ctx.translate(0, offsetY);
            ctx.rotate(rotate);
            ctx.scale(scaleX, scaleY);
            
            // 绘制精灵
            ctx.drawImage(sprite, -size, -size, size * 2, size * 2);
            
            ctx.restore();
        } else {
            // 使用emoji作为后备
            const emojiMap = {
                chick: '🐤', pig: '🐷', sheep: '🐑', dog: '🐕', cat: '🐱',
                bear: '🐻', rabbit: '🐰', bird: '🐦', turtle: '🐢', dog2: '🐺',
                mouse: '🐭', snail: '🐌', squirrel: '🐿️', goose: '🪿',
                duck: '🦆', duck2: '🦆', duck3: '🐥', snake: '🐍',
                crab: '🦀', pigeon: '🕊️', pig2: '🐖', rabbit2: '🐇'
            };
            ctx.font = this.isBoss ? '48px Arial' : '24px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(emojiMap[this.sprite] || '👾', 0, 8);
        }
        
        ctx.globalAlpha = 1;
        
        // 血条
        if (this.hp < this.maxHp) {
            const barWidth = this.isBoss ? 100 : 24;
            ctx.fillStyle = '#000';
            ctx.fillRect(-barWidth/2, -size - 10, barWidth, 6);
            ctx.fillStyle = this.isBoss ? '#f0f' : '#f00';
            ctx.fillRect(-barWidth/2, -size - 10, barWidth * (this.hp / this.maxHp), 6);
        }
        
        if (this.isBoss) {
            ctx.fillStyle = '#f0f';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(this.name, 0, -size - 20);
        }
    }
}

// 盲眼NPC类
class ShopNPC {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.name = '盲眼';
    }
    
    draw(ctx, playerNear = false) {
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(this.x - 35, this.y - 35, 70, 70);
        ctx.strokeStyle = '#4a4';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - 35, this.y - 35, 70, 70);
        
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🦯', this.x - 8, this.y + 8);
        ctx.fillText('👁️', this.x + 8, this.y + 8);
        
        ctx.fillStyle = '#4f4';
        ctx.font = '12px Arial';
        ctx.fillText('盲眼', this.x, this.y + 30);
        
        if (playerNear) {
            ctx.fillStyle = '#ff0';
            ctx.font = 'bold 14px Arial';
            ctx.fillText('按 E 打开商店', this.x, this.y - 45);
        }
    }
}

// 图腾系统
const TOTEMS = {
    1: { id: 1, name: '先祖之力', icon: '🦴', desc: '攻击力+10%', effect: 'dmg', value: 0.1 },
    2: { id: 2, name: '地脉守护', icon: '🛡️', desc: '最大生命+1', effect: 'maxHp', value: 1 },
    3: { id: 3, name: '疾风步', icon: '👟', desc: '移动速度+10%', effect: 'speed', value: 0.1 },
    4: { id: 4, name: '智慧之眼', icon: '👁️', desc: '经验获取+20%', effect: 'exp', value: 0.2 },
    5: { id: 5, name: '贪婪之手', icon: '💰', desc: '金币获取+25%', effect: 'gold', value: 0.25 },
    6: { id: 6, name: '再生之血', icon: '❤️', desc: '生命恢复+0.1/秒', effect: 'regen', value: 0.1 },
    7: { id: 7, name: '幸运星', icon: '⭐', desc: '暴击率+5%', effect: 'crit', value: 0.05 }
};

class TotemManager {
    constructor() {
        this.owned = new Set();
        this.load();
    }
    
    load() {
        try {
            const saved = localStorage.getItem('rougecow_totems');
            if (saved) this.owned = new Set(JSON.parse(saved));
        } catch (e) {}
    }
    
    save() {
        try {
            localStorage.setItem('rougecow_totems', JSON.stringify([...this.owned]));
        } catch (e) {}
    }
    
    collect(id) {
        if (this.owned.has(id)) return false;
        this.owned.add(id);
        this.save();
        return true;
    }
    
    has(id) { return this.owned.has(id); }
    getCount() { return this.owned.size; }
    
    getAllBonuses() {
        const bonuses = { dmg: 0, maxHp: 0, speed: 0, exp: 0, gold: 0, regen: 0, crit: 0 };
        for (const id of this.owned) {
            const totem = TOTEMS[id];
            if (totem) bonuses[totem.effect] += totem.value;
        }
        return bonuses;
    }
}

// 房间类
class Room {
    constructor(gx, gy, type = 'normal', floor = 1, templateKey = null) {
        this.gx = gx; this.gy = gy;
        this.id = `${gx},${gy}`;
        this.type = type;
        this.floor = floor;
        this.doors = { up: null, down: null, left: null, right: null };
        this.enemies = [];
        this.cleared = type === 'start' || type === 'treasure' || type === 'shop';
        this.visited = false;
        this.items = [];
        this.npc = null;
        
        // 大房间尺寸
        this.width = SURVIVOR_CONFIG.ROOM_WIDTH;
        this.height = SURVIVOR_CONFIG.ROOM_HEIGHT;
        this.centerX = this.width / 2;
        this.centerY = this.height / 2;
        
        // 选择模板（8个之一）
        const keys = Object.keys(ROOM_TEMPLATES);
        this.templateKey = templateKey || keys[Math.floor(Math.random() * keys.length)];
        this.template = ROOM_TEMPLATES[this.templateKey];
        // 将相对坐标（0-1）转换为绝对坐标
        this.spawnPoints = this.template.spawnPoints.map(p => ({
            x: p.x < 1 ? p.x * this.width : p.x,
            y: p.y < 1 ? p.y * this.height : p.y
        }));
        
        // 波次管理器
        this.hordeManager = null;
        if (type === 'normal' || type === 'boss') {
            this.hordeManager = new HordeManager(this);
        }
        
        if (type === 'shop') {
            this.npc = new ShopNPC(this.centerX, this.centerY);
        }
        
        this.spawnRoomItems();
    }
    
    spawnRoomItems() {
        if (this.type === 'treasure') {
            const count = randInt(2, 4);
            const r = Math.min(this.width, this.height) * 0.15; // 相对半径
            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2;
                const x = this.centerX + Math.cos(angle) * r;
                const y = this.centerY + Math.sin(angle) * r;
                const itemId = randInt(1, 16);
                const item = ITEMS[itemId];
                if (item) {
                    this.items.push({ x, y, id: itemId, icon: item.icon, name: item.name });
                }
            }
        } else if (this.type === 'hidden') {
            const itemId = randInt(1, 16);
            const item = ITEMS[itemId];
            if (item) {
                this.items.push({
                    x: this.centerX, y: this.centerY,
                    id: itemId, icon: item.icon,
                    name: item.name + '(诅咒)', cursed: true
                });
            }
        }
    }
    
    // 获取当前活跃敌人（供外部使用）
    getActiveEnemies() {
        if (this.hordeManager) {
            return this.hordeManager.getActiveEnemies();
        }
        return this.enemies.filter(e => e.hp > 0);
    }
    
    update(dt) {
        if (this.hordeManager) {
            this.hordeManager.update(dt);
            // 持续补充敌人直到达到本波目标
            if (this.hordeManager.spawnedThisWave < this.hordeManager.targetCount) {
                this.hordeManager.spawnBatch();
            }
        }
    }

    spawnEnemies() {
        if (this.type === 'start' || this.type === 'treasure' || this.type === 'shop') return;
        
        if (this.type === 'hidden') {
            const eliteTypes = ['bear', 'yinya'];
            const typeKey = randChoice(eliteTypes);
            const elite = new Enemy(this.centerX, this.centerY, typeKey);
            elite.hp *= 2;
            elite.maxHp *= 2;
            elite.dmg *= 1.5;
            elite.isElite = true;
            // 如果有HordeManager，添加到它的enemies数组
            if (this.hordeManager) {
                this.hordeManager.enemies.push(elite);
            } else {
                this.enemies.push(elite);
            }
            return;
        }
        
        if (this.type === 'boss') {
            const bossCfg = BOSS_TYPES.mother;
            const boss = new Enemy(this.centerX, this.centerY - 100, 'bear');
            boss.name = bossCfg.name;
            boss.hp = bossCfg.hp;
            boss.maxHp = bossCfg.hp;
            boss.speed = bossCfg.speed;
            boss.dmg = bossCfg.dmg;
            boss.exp = bossCfg.exp;
            boss.gold = bossCfg.gold;
            boss.color = bossCfg.color;
            boss.isBoss = true;
            boss.phase = 0;
            // 如果有HordeManager，添加到它的enemies数组，否则添加到Room.enemies
            if (this.hordeManager) {
                this.hordeManager.enemies.push(boss);
            } else {
                this.enemies.push(boss);
            }
            return;
        }
        
        // 普通房间的敌人由HordeManager动态生成，这里只处理没有HordeManager的情况
        if (this.hordeManager) return;
        
        const count = randInt(3, 7);
        const types = Object.keys(ENEMY_TYPES).filter(k => !ENEMY_TYPES[k].special);
        
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const r = 150 + Math.random() * 100;
            const x = 450 + Math.cos(angle) * r;
            const y = 300 + Math.sin(angle) * r;
            
            if (Math.random() < 0.1 && (this.gx + this.gy) > 2) {
                const specialTypes = ['tiaotiao', 'tiezhua', 'nibei', 'yinya'];
                this.enemies.push(new Enemy(x, y, randChoice(specialTypes)));
            } else {
                this.enemies.push(new Enemy(x, y, randChoice(types)));
            }
        }
    }

    draw(ctx, camera) {
        const floorColors = { 
            start: '#1a1a2e', normal: '#16213e', boss: '#2d1b2e', 
            treasure: '#2d2d1b', shop: '#1b1b2d', hidden: '#2d1b2d'
        };
        
        // 计算视野范围（世界坐标）
        const viewLeft = camera.x - camera.viewWidth / 2;
        const viewTop = camera.y - camera.viewHeight / 2;
        const viewRight = viewLeft + camera.viewWidth;
        const viewBottom = viewTop + camera.viewHeight;
        
        // 地板使用世界坐标绘制，和墙、门保持一致
        ctx.fillStyle = floorColors[this.type] || '#16213e';
        const floorTopLeft = camera.worldToScreen(viewLeft, viewTop);
        const floorBottomRight = camera.worldToScreen(viewRight, viewBottom);
        ctx.fillRect(floorTopLeft.x, floorTopLeft.y, floorBottomRight.x - floorTopLeft.x, floorBottomRight.y - floorTopLeft.y);
        
        // 房间环境光效
        this.drawAmbientEffects(ctx, camera, viewLeft, viewTop, viewRight, viewBottom);
        
        // 绘制网格（装饰）
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        const gridStartX = Math.floor(viewLeft / 50) * 50;
        const gridStartY = Math.floor(viewTop / 50) * 50;
        for (let wx = gridStartX; wx < viewRight; wx += 50) {
            const top = camera.worldToScreen(wx, viewTop);
            const bottom = camera.worldToScreen(wx, viewBottom);
            ctx.beginPath(); ctx.moveTo(top.x, top.y); ctx.lineTo(bottom.x, bottom.y); ctx.stroke();
        }
        for (let wy = gridStartY; wy < viewBottom; wy += 50) {
            const left = camera.worldToScreen(viewLeft, wy);
            const right = camera.worldToScreen(viewRight, wy);
            ctx.beginPath(); ctx.moveTo(left.x, left.y); ctx.lineTo(right.x, right.y); ctx.stroke();
        }
        
        // 绘制房间边界（厚墙）- 使用世界坐标转换，和门保持一致
        ctx.fillStyle = '#0f0f1a';
        const wallThickness = 60;
        // 左墙
        if (viewLeft < wallThickness) {
            const topLeft = camera.worldToScreen(0, viewTop);
            const bottomRight = camera.worldToScreen(wallThickness, viewBottom);
            ctx.fillRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
        }
        // 右墙
        if (viewRight > this.width - wallThickness) {
            const topLeft = camera.worldToScreen(this.width - wallThickness, viewTop);
            const bottomRight = camera.worldToScreen(this.width, viewBottom);
            ctx.fillRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
        }
        // 上墙
        if (viewTop < wallThickness) {
            const topLeft = camera.worldToScreen(viewLeft, 0);
            const bottomRight = camera.worldToScreen(viewRight, wallThickness);
            ctx.fillRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
        }
        // 下墙
        if (viewBottom > this.height - wallThickness) {
            const topLeft = camera.worldToScreen(viewLeft, this.height - wallThickness);
            const bottomRight = camera.worldToScreen(viewRight, this.height);
            ctx.fillRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
        }
        
        // 绘制门（门向内凹进房间，避免被墙包围）
        const doorPositions = {};
        const wallT = 60; // 墙厚度
        
        for (const [dir, door] of Object.entries(this.doors)) {
            if (!door) continue;
            let doorX, doorY, doorW, doorH;
            switch(dir) {
                // 门和墙平齐，不凹陷不突出
                case 'up': doorX = this.centerX - 40; doorY = 0; doorW = 80; doorH = wallT; break;
                case 'down': doorX = this.centerX - 40; doorY = this.height - wallT; doorW = 80; doorH = wallT; break;
                case 'left': doorX = 0; doorY = this.centerY - 50; doorW = wallT; doorH = 100; break;
                case 'right': doorX = this.width - wallT; doorY = this.centerY - 50; doorW = wallT; doorH = 100; break;
            }
            doorPositions[dir] = { x: doorX, y: doorY, w: doorW, h: doorH };
            
            // 在墙上挖洞（用地板颜色覆盖门区域）
            if (doorX < viewRight && doorX + doorW > viewLeft &&
                doorY < viewBottom && doorY + doorH > viewTop) {
                const screenPos = camera.worldToScreen(doorX, doorY);
                const screenEnd = camera.worldToScreen(doorX + doorW, doorY + doorH);
                ctx.fillStyle = floorColors[this.type] || '#16213e';
                ctx.fillRect(screenPos.x, screenPos.y, screenEnd.x - screenPos.x, screenEnd.y - screenPos.y);
            }
        }
        
        // 绘制门
        for (const [dir, door] of Object.entries(this.doors)) {
            if (!door) continue;
            const pos = doorPositions[dir];
            if (!pos) continue;
            
            if (pos.x < viewRight && pos.x + pos.w > viewLeft &&
                pos.y < viewBottom && pos.y + pos.h > viewTop) {
                const screenPos = camera.worldToScreen(pos.x, pos.y);
                const screenEnd = camera.worldToScreen(pos.x + pos.w, pos.y + pos.h);
                const screenW = screenEnd.x - screenPos.x;
                const screenH = screenEnd.y - screenPos.y;
                // 门边框
                ctx.fillStyle = '#555';
                ctx.fillRect(screenPos.x - 2, screenPos.y - 2, screenW + 4, screenH + 4);
                // 门本体
                ctx.fillStyle = door.open ? '#4a4' : '#a44';
                ctx.fillRect(screenPos.x, screenPos.y, screenW, screenH);
                // 门把手/装饰
                ctx.fillStyle = '#222';
                ctx.fillRect(screenPos.x + screenW/2 - 3, screenPos.y + screenH/2 - 3, 6, 6);
            }
        }
        
        // 房间信息现在显示在顶部栏，不再在房间内绘制
    }
    
    drawAmbientEffects(ctx, camera, viewLeft, viewTop, viewRight, viewBottom) {
        const center = camera.worldToScreen(this.centerX, this.centerY);
        const time = Date.now() / 1000;
        let grad, pulse, sparkle, hiddenPulse, x, y, pos, flicker;
        
        // 根据房间类型添加不同氛围效果
        switch(this.type) {
            case 'boss':
                // Boss房间 - 脉动红光
                pulse = 0.3 + Math.sin(time * 2) * 0.1;
                grad = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, 400);
                grad.addColorStop(0, `rgba(255, 0, 0, ${pulse})`);
                grad.addColorStop(0.5, `rgba(100, 0, 0, ${pulse * 0.5})`);
                grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, camera.viewWidth, camera.viewHeight);
                break;
                
            case 'treasure':
                // 宝箱房 - 金色微光
                sparkle = 0.15 + Math.sin(time * 3) * 0.05;
                grad = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, 300);
                grad.addColorStop(0, `rgba(255, 215, 0, ${sparkle})`);
                grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, camera.viewWidth, camera.viewHeight);
                break;
                
            case 'shop':
                // 商店 - 蓝色魔法光
                grad = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, 250);
                grad.addColorStop(0, 'rgba(100, 150, 255, 0.1)');
                grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, camera.viewWidth, camera.viewHeight);
                break;
                
            case 'hidden':
                // 隐藏房 - 紫色诡异光芒
                hiddenPulse = 0.2 + Math.sin(time * 1.5) * 0.08;
                grad = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, 350);
                grad.addColorStop(0, `rgba(148, 0, 211, ${hiddenPulse})`);
                grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, camera.viewWidth, camera.viewHeight);
                break;
                
            default:
                // 普通房间 - 微弱环境光
                if (Math.random() < 0.02) {
                    // 偶尔闪烁的微光
                    x = viewLeft + Math.random() * (viewRight - viewLeft);
                    y = viewTop + Math.random() * (viewBottom - viewTop);
                    pos = camera.worldToScreen(x, y);
                    flicker = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 30);
                    flicker.addColorStop(0, 'rgba(100, 200, 255, 0.1)');
                    flicker.addColorStop(1, 'rgba(0, 0, 0, 0)');
                    ctx.fillStyle = flicker;
                    ctx.beginPath();
                    ctx.arc(pos.x, pos.y, 30, 0, Math.PI * 2);
                    ctx.fill();
                }
        }
    }
}

// ============================================================================
// 吸血鬼幸存者风格刷怪系统 v2.0
// ============================================================================
class HordeManager {
    constructor(room) {
        this.room = room;
        this.wave = 0;
        this.timer = 0;
        this.spawnedThisWave = 0;
        this.targetCount = 0;
        this.enemies = [];
        this.maxActiveEnemies = 80;
        
        // 根据房间类型设置刷怪策略
        this.setupRoomType();
        
        // 生成边缘刷怪点（避免在玩家脸上刷怪）
        this.spawnPoints = this.generateSpawnPoints();
        
        // 进房间立即开始第一波
        if (this.totalWaves > 0) {
            this.startNewWave();
        }
    }
    
    // 根据房间类型配置
    setupRoomType() {
        const type = this.room.type;
        
        switch(type) {
            case 'normal':
                this.waveCount = 3 + Math.floor(Math.random() * 3); // 3-5波
                this.baseEnemyCount = 10; // 敌人数量翻倍
                this.bossRoom = false;
                break;
            case 'boss':
                this.waveCount = 1;
                this.baseEnemyCount = 0;
                this.bossRoom = true;
                break;
            case 'hidden':
                this.waveCount = 1;
                this.baseEnemyCount = 6; // 敌人数量翻倍
                this.bossRoom = false;
                this.eliteOnly = true;
                break;
            default:
                this.waveCount = 0; // 起点/商店/宝箱不刷怪
                this.baseEnemyCount = 0;
        }
        
        this.totalWaves = this.waveCount;
    }
    
    // 生成边缘刷怪点（房间四边，距离墙一定距离）
    generateSpawnPoints() {
        const points = [];
        const w = this.room.width;
        const h = this.room.height;
        const margin = 120; // 距离墙的距离
        
        // 上下两边
        for (let x = margin; x < w - margin; x += 150) {
            points.push({x, y: margin});
            points.push({x, y: h - margin});
        }
        // 左右两边
        for (let y = margin; y < h - margin; y += 150) {
            points.push({x: margin, y});
            points.push({x: w - margin, y});
        }
        
        return points;
    }
    
    update(dt) {
        // 已完成所有波次
        if (this.wave >= this.totalWaves && this.enemies.filter(e => e.hp > 0).length === 0) {
            // 注意：不再在这里设置 cleared，让 Game.update() 统一处理
            // 包括自动拾取经验球等逻辑
            this.openDoors();
            return;
        }
        
        // 当前波次敌人死完，立即开始下一波
        const activeCount = this.enemies.filter(e => e.hp > 0).length;
        if (activeCount === 0 && this.spawnedThisWave >= this.targetCount && this.wave < this.totalWaves) {
            this.startNewWave();
        }
        
        // 持续刷怪直到达到本波目标
        if (this.spawnedThisWave < this.targetCount && activeCount < this.maxActiveEnemies) {
            this.spawnBatch();
        }
        
        this.enemies = this.enemies.filter(e => e.hp > 0);
    }
    
    startNewWave() {
        this.wave++;
        this.timer = 0;
        
        // 难度公式：基础数量 × (1 + 波数 × 0.2)
        const difficultyMultiplier = 1 + (this.wave - 1) * 0.2;
        this.targetCount = Math.floor(this.baseEnemyCount * difficultyMultiplier);
        this.spawnedThisWave = 0;
        
        // 播放波次开始音效（普通房间且非第一波）
        if (this.room.type === 'normal' && this.wave > 1 && window.game && window.game.sounds) {
            window.game.sounds.play('wave');
        }
        
        console.log(`🌊 第 ${this.wave}/${this.totalWaves} 波！目标：${this.targetCount} 只`);
    }
    
    spawnBatch() {
        const batchSize = Math.min(3, this.targetCount - this.spawnedThisWave);
        const activeCount = this.enemies.filter(e => e.hp > 0).length;
        if (activeCount >= this.maxActiveEnemies) return;
        
        for (let i = 0; i < batchSize; i++) {
            if (this.spawnedThisWave >= this.targetCount) break;
            
            // 随机选择刷怪点
            const point = this.spawnPoints[Math.floor(Math.random() * this.spawnPoints.length)];
            // 添加随机偏移
            const x = point.x + (Math.random() - 0.5) * 60;
            const y = point.y + (Math.random() - 0.5) * 60;
            
            const enemy = this.createEnemy(x, y);
            this.enemies.push(enemy);
            this.spawnedThisWave++;
        }
    }
    
    createEnemy(x, y) {
        // 根据波数选择敌人等级
        const typeKey = this.selectEnemyType();
        const enemy = new Enemy(x, y, typeKey);
        
        // 应用难度缩放
        const waveMultiplier = 1 + (this.wave - 1) * 0.15; // HP每波+15%
        const dmgMultiplier = 1 + (this.wave - 1) * 0.08;  // 伤害每波+8%
        const spdMultiplier = 1 + (this.wave - 1) * 0.03;  // 速度每波+3%
        
        enemy.hp = Math.floor(enemy.hp * waveMultiplier);
        enemy.maxHp = enemy.hp;
        enemy.dmg = Math.floor(enemy.dmg * dmgMultiplier);
        enemy.speed = Math.floor(enemy.speed * spdMultiplier);
        
        return enemy;
    }
    
    // 根据波数选择敌人类型
    selectEnemyType() {
        const tierKeys = {
            1: ['chick', 'mouse', 'snail'],
            2: ['rabbit', 'bird', 'pigeon'],
            3: ['cat', 'duck', 'squirrel'],
            4: ['dog', 'pig', 'sheep', 'goose'],
            5: ['bear', 'snake', 'crab'],
            6: ['turtle', 'boss_dog']
        };
        
        let tier;
        
        if (this.eliteOnly) {
            // 隐藏房只出精英
            tier = Math.random() < 0.5 ? 4 : 5;
        } else if (this.bossRoom && this.wave === 1) {
            // Boss房第一波出Boss
            return Math.random() < 0.5 ? 'turtle' : 'boss_dog';
        } else {
            // 普通房间根据波数选择
            const roll = Math.random();
            if (this.wave === 1) {
                tier = roll < 0.7 ? 1 : 2;
            } else if (this.wave === 2) {
                tier = roll < 0.4 ? 1 : (roll < 0.8 ? 2 : 3);
            } else {
                tier = roll < 0.2 ? 2 : (roll < 0.5 ? 3 : (roll < 0.8 ? 4 : 5));
            }
        }
        
        const types = tierKeys[tier];
        return types[Math.floor(Math.random() * types.length)];
    }
    
    openDoors() {
        Object.values(this.room.doors).forEach(door => {
            if (door) {
                door.open = true;
                door.locked = false;
            }
        });
        console.log('🚪 房间清理完成，门已开启');
    }
    
    getActiveEnemies() {
        return this.enemies.filter(e => e.hp > 0);
    }
}

// 地图生成器
class MapGenerator {
    generate(floor = 1) {
        const rooms = new Map();
        const start = new Room(0, 0, 'start', floor);
        rooms.set(start.id, start);
        
        const queue = [start];
        const dirs = [
            { dx: 0, dy: -1, name: 'up', opp: 'down' },
            { dx: 1, dy: 0, name: 'right', opp: 'left' },
            { dx: 0, dy: 1, name: 'down', opp: 'up' },
            { dx: -1, dy: 0, name: 'left', opp: 'right' }
        ];
        
        let count = 1;
        const maxRooms = 8 + floor * 2;
        
        while (queue.length && count < maxRooms) {
            const cur = queue.shift();
            for (const dir of dirs.sort(() => Math.random() - 0.5)) {
                const nx = cur.gx + dir.dx, ny = cur.gy + dir.dy;
                const id = `${nx},${ny}`;
                
                if (rooms.has(id)) {
                    const ex = rooms.get(id);
                    if (!cur.doors[dir.name]) {
                        cur.doors[dir.name] = { open: cur.cleared, target: ex };
                        ex.doors[dir.opp] = { open: ex.cleared, target: cur };
                    }
                    continue;
                }
                
                if (Math.random() > 0.4 || count < 5) {
                    let type = 'normal';
                    if (count === maxRooms - 1) {
                        type = 'boss';
                    } else if (count > 3) {
                        const roll = Math.random();
                        if (roll < 0.15) type = 'treasure';
                        else if (roll < 0.30) type = 'shop';
                        else if (roll < 0.35) type = 'hidden';
                    }
                    
                    const nr = new Room(nx, ny, type, floor);
                    cur.doors[dir.name] = { open: cur.cleared, target: nr };
                    nr.doors[dir.opp] = { open: nr.cleared, target: cur };
                    rooms.set(id, nr);
                    queue.push(nr);
                    count++;
                }
            }
        }
        
        // 修复：确保所有相邻房间都有双向门连接
        this.fixDoorConnections(rooms);
        
        return { start, rooms };
    }
    
    // 修复门连接：确保相邻房间都有双向门
    fixDoorConnections(rooms) {
        const dirs = [
            { dx: 0, dy: -1, name: 'up', opp: 'down' },
            { dx: 1, dy: 0, name: 'right', opp: 'left' },
            { dx: 0, dy: 1, name: 'down', opp: 'up' },
            { dx: -1, dy: 0, name: 'left', opp: 'right' }
        ];
        
        for (const room of rooms.values()) {
            for (const dir of dirs) {
                const nx = room.gx + dir.dx;
                const ny = room.gy + dir.dy;
                const neighborId = `${nx},${ny}`;
                
                if (rooms.has(neighborId)) {
                    const neighbor = rooms.get(neighborId);
                    // 如果当前房间没有这个方向的门，创建一个
                    if (!room.doors[dir.name]) {
                        room.doors[dir.name] = { 
                            open: room.cleared, 
                            target: neighbor 
                        };
                    }
                    // 如果相邻房间没有反向的门，创建一个
                    if (!neighbor.doors[dir.opp]) {
                        neighbor.doors[dir.opp] = { 
                            open: neighbor.cleared, 
                            target: room 
                        };
                    }
                }
            }
        }
    }
}

// ============================================================================
// 主游戏类 v0.7.2
// ============================================================================
// ==================== 吸血鬼幸存者风格重构 ====================
const SURVIVOR_CONFIG = {
    VIEW_WIDTH: 900, VIEW_HEIGHT: 600,
    CAMERA_SMOOTH: 0.1,
    WAVE_INTERVAL: 30, WAVE_BASE_COUNT: 20, WAVE_INCREMENT: 5,
    GRID_CELL_SIZE: 150,
    // 自适应视野：如果屏幕够大就显示完整房间
    ADAPTIVE_VIEW: true,
    // 房间尺寸会在运行时根据canvas动态计算
    ROOM_WIDTH: 1200,
    ROOM_HEIGHT: 800
};

class SurvivorCamera {
    constructor() {
        this.x = SURVIVOR_CONFIG.ROOM_WIDTH / 2;
        this.y = SURVIVOR_CONFIG.ROOM_HEIGHT / 2;
        this.target = null;
        this.viewWidth = SURVIVOR_CONFIG.VIEW_WIDTH;
        this.viewHeight = SURVIVOR_CONFIG.VIEW_HEIGHT;
        this.showFullRoom = false;
        this.zoom = 1;
        this.updateViewport();
    }
    
    // 根据窗口尺寸设置房间大小，确保房间完整显示并填满游戏区域
    updateViewport() {
        // 使用窗口尺寸减去两侧边栏
        const sidebarWidth = 260 * 2; // 左右边栏
        const canvasW = Math.max(800, window.innerWidth - sidebarWidth - 40);
        const canvasH = Math.max(600, window.innerHeight - 100);
        
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.width = canvasW;
            canvas.height = canvasH;
        }
        
        // 房间尺寸 = canvas 尺寸减去墙边距
        const wallMargin = 60;
        SURVIVOR_CONFIG.ROOM_WIDTH = Math.floor(canvasW - wallMargin * 2);
        SURVIVOR_CONFIG.ROOM_HEIGHT = Math.floor(canvasH - wallMargin * 2);
        
        const roomW = SURVIVOR_CONFIG.ROOM_WIDTH;
        const roomH = SURVIVOR_CONFIG.ROOM_HEIGHT;
        
        // 始终显示完整房间
        this.showFullRoom = true;
        this.viewWidth = roomW;
        this.viewHeight = roomH;
        this.x = roomW / 2;
        this.y = roomH / 2;
        this.zoom = 1;
        
        console.log(`📐 房间尺寸: ${roomW}x${roomH}, Canvas: ${canvasW}x${canvasH}`);
    }
    
    follow(target) { this.target = target; }
    
    update() {
        if (this.showFullRoom) {
            // 显示完整房间时，相机固定在中心
            this.x = SURVIVOR_CONFIG.ROOM_WIDTH / 2;
            this.y = SURVIVOR_CONFIG.ROOM_HEIGHT / 2;
            return;
        }
        
        if (!this.target) return;
        this.x += (this.target.x - this.x) * SURVIVOR_CONFIG.CAMERA_SMOOTH;
        this.y += (this.target.y - this.y) * SURVIVOR_CONFIG.CAMERA_SMOOTH;
        const minX = this.viewWidth / 2, maxX = SURVIVOR_CONFIG.ROOM_WIDTH - this.viewWidth / 2;
        const minY = this.viewHeight / 2, maxY = SURVIVOR_CONFIG.ROOM_HEIGHT - this.viewHeight / 2;
        this.x = Math.max(minX, Math.min(maxX, this.x));
        this.y = Math.max(minY, Math.min(maxY, this.y));
    }
    
    worldToScreen(wx, wy) {
        if (this.showFullRoom) {
            // 完整房间模式：房间填满 canvas，计算居中偏移
            const canvas = document.getElementById('gameCanvas');
            const canvasW = canvas ? canvas.clientWidth : 900;
            const canvasH = canvas ? canvas.clientHeight : 600;
            const roomW = SURVIVOR_CONFIG.ROOM_WIDTH;
            const roomH = SURVIVOR_CONFIG.ROOM_HEIGHT;
            
            // 计算居中偏移（房间尺寸已经根据 canvas 调整过）
            const offsetX = (canvasW - roomW) / 2;
            const offsetY = (canvasH - roomH) / 2;
            
            return { 
                x: wx + offsetX, 
                y: wy + offsetY 
            };
        }
        return { x: wx - this.x + this.viewWidth / 2, y: wy - this.y + this.viewHeight / 2 };
    }
    
    isVisible(wx, wy, radius = 50) {
        if (this.showFullRoom) {
            return wx >= -radius && wx <= SURVIVOR_CONFIG.ROOM_WIDTH + radius 
                && wy >= -radius && wy <= SURVIVOR_CONFIG.ROOM_HEIGHT + radius;
        }
        return Math.abs(wx - this.x) < this.viewWidth / 2 + radius && Math.abs(wy - this.y) < this.viewHeight / 2 + radius;
    }
}

class SpatialGrid {
    constructor() {
        this.cellSize = SURVIVOR_CONFIG.GRID_CELL_SIZE;
        this.cells = new Map();
    }
    getKey(cx, cy) { return `${cx},${cy}`; }
    getCellByPos(x, y) {
        return { cx: Math.floor(x / this.cellSize), cy: Math.floor(y / this.cellSize) };
    }
    clear() { this.cells.clear(); }
    insert(entity) {
        const { cx, cy } = this.getCellByPos(entity.x, entity.y);
        const key = this.getKey(cx, cy);
        if (!this.cells.has(key)) this.cells.set(key, []);
        this.cells.get(key).push(entity);
        entity._gridCell = { cx, cy };
    }
    getNearby(x, y) {
        const { cx, cy } = this.getCellByPos(x, y);
        const result = [];
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                const cell = this.cells.get(this.getKey(cx + dx, cy + dy));
                if (cell) result.push(...cell);
            }
        }
        return result;
    }
}

// 对象池管理器 - 统一管理可复用对象
class ObjectPool {
    constructor(createFn, resetFn, initialSize = 50) {
        this.createFn = createFn;
        this.resetFn = resetFn;
        this.available = [];
        this.inUse = new Set();
        
        // 预创建对象
        for (let i = 0; i < initialSize; i++) {
            this.available.push(this.createFn());
        }
    }
    
    acquire() {
        let obj = this.available.pop();
        if (!obj) {
            obj = this.createFn();
        }
        this.resetFn(obj);
        this.inUse.add(obj);
        return obj;
    }
    
    release(obj) {
        if (this.inUse.has(obj)) {
            this.inUse.delete(obj);
            this.available.push(obj);
        }
    }
    
    releaseAll() {
        this.inUse.forEach(obj => this.available.push(obj));
        this.inUse.clear();
    }
    
    getStats() {
        return {
            available: this.available.length,
            inUse: this.inUse.size,
            total: this.available.length + this.inUse.size
        };
    }
}

// 性能监控器
class PerformanceMonitor {
    constructor() {
        this.frames = [];
        this.lastTime = performance.now();
        this.fps = 60;
        this.avgFps = 60;
        this.frameTime = 16.67;
        this.updateInterval = 500; // 每500ms更新一次显示
        this.lastUpdate = 0;
        this.visible = false;
    }
    
    update() {
        const now = performance.now();
        const delta = now - this.lastTime;
        this.lastTime = now;
        
        this.frameTime = delta;
        this.frames.push(1000 / delta);
        
        // 保留最近60帧
        if (this.frames.length > 60) {
            this.frames.shift();
        }
        
        // 计算平均FPS
        if (now - this.lastUpdate > this.updateInterval) {
            this.avgFps = Math.round(this.frames.reduce((a, b) => a + b, 0) / this.frames.length);
            this.lastUpdate = now;
        }
        
        this.fps = Math.round(1000 / delta);
    }
    
    draw(ctx, x, y) {
        if (!this.visible) return;
        
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(x, y, 140, 70);
        
        ctx.fillStyle = this.avgFps >= 55 ? '#4f4' : this.avgFps >= 30 ? '#ff0' : '#f44';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`FPS: ${this.avgFps}`, x + 10, y + 20);
        
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.fillText(`Frame: ${this.frameTime.toFixed(1)}ms`, x + 10, y + 38);
        ctx.fillText(`Objects: ${window.game?.bullets?.length || 0}B ${window.game?.particles?.active?.length || 0}P`, x + 10, y + 56);
    }
    
    toggle() {
        this.visible = !this.visible;
        return this.visible;
    }
}

// 8个房间模板 - 使用相对坐标 (0-1)，在 Room 构造函数中转换为绝对坐标
const ROOM_TEMPLATES = {
    empty: { name: '空旷大厅', spawnPoints: [{x:0.5,y:0.5}] },
    pillars: { name: '柱廊', spawnPoints: [{x:0.5,y:0.5}] },
    corners: { name: '广场', spawnPoints: [{x:0.5,y:0.5}] },
    cross: { name: '十字厅', spawnPoints: [{x:0.5,y:0.5}] },
    sides: { name: '回廊', spawnPoints: [{x:0.5,y:0.5}] },
    grid: { name: '大厅', spawnPoints: [{x:0.5,y:0.5}] },
    ring: { name: '竞技场', spawnPoints: [{x:0.5,y:0.5}] },
    maze: { name: '迷宫', spawnPoints: [{x:0.5,y:0.5}] }
};

// 楼层主题配置
const FLOOR_THEMES = {
    1: { name: '菌丝区', bgColor: '#0a0f0a', accentColor: '#4a4', enemyMod: 0.8 },
    2: { name: '孵化温室', bgColor: '#0a0a0f', accentColor: '#48f', enemyMod: 0.9 },
    3: { name: '神经索', bgColor: '#0f0a0f', accentColor: '#f4f', enemyMod: 1.0 },
    4: { name: '消化熔炉', bgColor: '#0f0a0a', accentColor: '#f44', enemyMod: 1.1 },
    5: { name: '母虫庭院', bgColor: '#0a0f0f', accentColor: '#4ff', enemyMod: 1.2 },
    6: { name: '千根之心', bgColor: '#0a0a0a', accentColor: '#ff0', enemyMod: 1.3 }
};

// 地图事件类型
const MAP_EVENTS = {
    trap: { name: '陷阱', icon: '⚠️', chance: 0.05, effect: 'damage' },
    shrine: { name: '神龛', icon: '🙏', chance: 0.03, effect: 'bless' },
    cache: { name: '补给', icon: '📦', chance: 0.04, effect: 'loot' },
    portal: { name: '传送门', icon: '🌀', chance: 0.02, effect: 'warp' }
};

// 全屏适配器 - 3栏布局模式下不干预canvas样式
class FullscreenAdapter {
    constructor(canvas, gameWidth = 900, gameHeight = 600) {
        this.canvas = canvas;
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.scale = 1;
        // 3栏布局模式下不自动调整canvas样式
        // this.setup();
        // window.addEventListener('resize', () => this.resize());
    }
    setup() {
        // 已禁用 - 3栏布局由CSS控制
    }
    resize() {
        // 已禁用 - 3栏布局由CSS控制
        // 只更新相机视野
        if (window.game?.camera) {
            window.game.camera.updateViewport();
        }
    }
}

// ============================================================================
// 分数系统 - ScoreManager
// ============================================================================

class ScoreManager {
    constructor() {
        this.score = 0;
        this.startTime = 0;
        this.endTime = 0;
        this.isPlaying = false;
        
        // 统计
        this.stats = {
            enemiesKilled: 0,
            elitesKilled: 0,
            bossesKilled: 0,
            roomsExplored: 0,
            itemsCollected: 0,
            goldCollected: 0,
            damageTaken: 0,
            floorsCleared: 0
        };
        
        // 连杀系统
        this.killStreak = 0;
        this.lastKillTime = 0;
        this.streakMultiplier = 1;
        
        // 最低分保护
        this.MIN_SCORE = 100;
    }
    
    start() {
        this.score = 0;
        this.startTime = Date.now();
        this.isPlaying = true;
        this.stats = {
            enemiesKilled: 0,
            elitesKilled: 0,
            bossesKilled: 0,
            roomsExplored: 0,
            itemsCollected: 0,
            goldCollected: 0,
            damageTaken: 0,
            floorsCleared: 0
        };
        this.killStreak = 0;
        this.streakMultiplier = 1;
        console.log('🏆 分数系统启动！');
    }
    
    // 基础加分
    add(points, reason = '') {
        if (!this.isPlaying) return;
        const actual = Math.floor(points * this.streakMultiplier);
        this.score += actual;
        if (reason) console.log(`💯 +${actual}分 (${reason})`);
        return actual;
    }
    
    // 扣分
    deduct(points, reason = '') {
        if (!this.isPlaying) return;
        this.score = Math.max(this.MIN_SCORE - 500, this.score - points); // 保证死亡后不低于MIN_SCORE
        if (reason) console.log(`💔 -${points}分 (${reason})`);
    }
    
    // 击杀敌人
    onKillEnemy(enemyType = 'normal') {
        this.stats.enemiesKilled++;
        
        // 连杀计算
        const now = Date.now();
        if (now - this.lastKillTime < 10000) { // 10秒内
            this.killStreak++;
            if (this.killStreak >= 3) {
                this.streakMultiplier = 1.5;
                console.log(`🔥 连杀x${this.killStreak}！分数加成50%`);
            }
        } else {
            this.killStreak = 1;
            this.streakMultiplier = 1;
        }
        this.lastKillTime = now;
        
        let points = 10;
        if (enemyType === 'elite') {
            points = 30;
            this.stats.elitesKilled++;
        } else if (enemyType === 'boss') {
            points = 500;
            this.stats.bossesKilled++;
        }
        
        this.add(points, `击杀${enemyType === 'normal' ? '普通怪' : enemyType === 'elite' ? '精英' : 'Boss'}`);
    }
    
    // 进入新房间
    onEnterRoom() {
        this.stats.roomsExplored++;
        this.add(50, '探索新房间');
    }
    
    // 拾取道具
    onCollectItem() {
        this.stats.itemsCollected++;
        this.add(50, '拾取道具');
    }
    
    // 拾取金币
    onCollectGold(amount) {
        this.stats.goldCollected += amount;
        this.add(amount, `拾取${amount}金币`);
    }
    
    // 受伤
    onDamage() {
        this.stats.damageTaken++;
        this.deduct(5, '受伤');
    }
    
    // 到达下层
    onFloorClear(floorNum) {
        this.stats.floorsCleared++;
        this.add(300, `通关第${floorNum}层`);
    }
    
    // 进入新层（别名）
    onEnterFloor(floorNum) {
        this.onFloorClear(floorNum);
    }
    
    // 游戏结束计算
    end(result) {
        this.isPlaying = false;
        this.endTime = Date.now();
        
        const playTime = (this.endTime - this.startTime) / 1000; // 秒
        let finalScore = this.score;
        let multiplier = 1;
        
        // 通关加成
        if (result === 'cleared') {
            multiplier = 1.5;
            
            // 无伤加成
            if (this.stats.damageTaken === 0) {
                multiplier = 2.0;
                console.log('🌟 无伤通关！分数×2');
            }
            
            // 快速通关
            if (playTime < 300) { // 5分钟
                multiplier *= 1.5;
                console.log('⚡ 极速通关！额外×1.5');
            }
        }
        
        // 死亡惩罚
        if (result === 'dead') {
            finalScore -= 500;
            console.log('💀 死亡惩罚 -500分');
        }
        
        finalScore = Math.max(this.MIN_SCORE, Math.floor(finalScore * multiplier));
        
        // 保存到本地排行榜
        this.saveHighScore(finalScore, result);
        
        return {
            finalScore,
            baseScore: this.score,
            multiplier,
            playTime,
            stats: {...this.stats},
            result
        };
    }
    
    // 保存最高分
    saveHighScore(score, result) {
        const key = 'rougecow_highscores';
        let scores = JSON.parse(localStorage.getItem(key) || '[]');
        scores.push({
            score,
            result,
            date: new Date().toISOString(),
            stats: {...this.stats}
        });
        scores.sort((a, b) => b.score - a.score);
        scores = scores.slice(0, 10); // 只保留前10
        localStorage.setItem(key, JSON.stringify(scores));
    }
    
    // 获取排行榜
    getHighScores() {
        return JSON.parse(localStorage.getItem('rougecow_highscores') || '[]');
    }
    
    // 格式化显示
    formatScore() {
        return this.score.toLocaleString();
    }
}

// ============================================================================

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // 分数系统
        this.scoreManager = new ScoreManager();
        
        // 全屏适配
        this.fullscreen = new FullscreenAdapter(this.canvas, 900, 600);
        
        // 相机系统
        this.camera = new SurvivorCamera();
        
        // 空间网格（碰撞优化）
        this.spatialGrid = new SpatialGrid();
        this.perfMonitor = new PerformanceMonitor();
        
        this.sprites = new SpriteLoader();
        this.state = 'loading';
        
        // 玩家初始位置 - 找安全位置（避开障碍物）
        let startX = SURVIVOR_CONFIG.ROOM_WIDTH / 2;
        let startY = SURVIVOR_CONFIG.ROOM_HEIGHT / 2;
        
        // 检查中心是否有障碍物，如果有就尝试其他位置
        const wallT = 60;  // 墙厚度改小
        const safePositions = [
            {x: startX, y: startY},                    // 中心
            {x: startX - 100, y: startY},              // 左
            {x: startX + 100, y: startY},              // 右
            {x: startX, y: startY - 100},              // 上
            {x: startX, y: startY + 100},              // 下
            {x: startX - 150, y: startY - 150},        // 左上
            {x: startX + 150, y: startY - 150},        // 右上
            {x: startX - 150, y: startY + 150},        // 左下
            {x: startX + 150, y: startY + 150},        // 右下
            {x: wallT + 50, y: wallT + 50},            // 左上角附近
            {x: SURVIVOR_CONFIG.ROOM_WIDTH - wallT - 50, y: wallT + 50}, // 右上角
            {x: wallT + 50, y: SURVIVOR_CONFIG.ROOM_HEIGHT - wallT - 50}, // 左下角
            {x: SURVIVOR_CONFIG.ROOM_WIDTH - wallT - 50, y: SURVIVOR_CONFIG.ROOM_HEIGHT - wallT - 50} // 右下角
        ];
        
        let safePos = safePositions[0];
        
        this.player = { x: safePos.x, y: safePos.y, hp: 6, maxHp: 6, exp: 0, lv: 1, gold: 100, 
            facingRight: true, isMoving: false, walkCycle: 0,
            isDashing: false, dashTime: 0, dashCooldown: 0, dashDirection: {x:0, y:0}, dashTrail: [], jumpY: 0
        };
        
        // 相机跟随玩家
        this.camera.follow(this.player);
        this.items = new ItemManager(this.player);
        this.passives = new PassiveManager(this.player); // 被动道具系统（吸血鬼幸存者风格）
        this.totems = new TotemManager();
        this.materials = new MaterialManager(); // 材料系统
        this.weapons = [new Weapon('wand', 1)];  // 默认武器改为魔杖（远程）
        this.bullets = [];
        this.playerLasers = []; // v0.30: 玩家激光效果
        this.petLasers = []; // v0.30: 宠物激光效果
        this.particles = new ParticleSystem();
        this.damageNumbers = new DamageNumberSystem();
        this.gems = [];
        this.goldDrops = [];
        
        this.currentFloor = 1;
        this.maxFloors = 6;
        // 6层地形名称
        this.floorNames = ['菌丝区', '孵化温室', '神经索', '消化熔炉', '母虫庭院', '千根之心'];
        this.allFloors = new Map();
        
        // 先初始化相机视野，确保房间尺寸正确
        this.camera.updateViewport();
        
        // 等待一帧确保 canvas 尺寸正确
        setTimeout(() => {
            this.camera.updateViewport();
            // 重新生成地图以使用正确的房间尺寸
            this.regenerateMap();
        }, 0);
        
        // 临时地图（会被替换）
        const gen = new MapGenerator();
        const map = gen.generate(1);
        this.curRoom = map.start;
        this.allRooms = map.rooms;
        this.curRoom.visited = true;
        this.allFloors.set(1, { start: map.start, rooms: map.rooms });
        
        this.keys = {};
        this.transition = { active: false, timer: 0, dir: null, target: null };
        this.rafId = null;
        this.godMode = false;
        
        this.shopOpen = false;
        this.shopItems = [];
        this.shopSelected = -1;
        
        this.levelUpOpen = false; // 4选1升级选择界面（2武器+2被动）
        this.levelUpOptions = [];
        
        this.sounds = new SoundManager();
        
        // 时间缩放（游戏速度）
        this.timeScale = 1;
        
        // 暂停状态
        this.paused = false;
        
        this.setupInput();
        
        // 暴露到全局供按钮调用
        window.game = this;
    }
    
    setSpeed(speed) {
        this.timeScale = speed;
        // 更新按钮状态
        document.querySelectorAll('.speed-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.speed) === speed);
        });
        console.log(`⚡ 游戏速度设置为 ${speed}x`);
    }
    
    // 切换无敌模式（测试用）
    toggleGodMode() {
        this.godMode = !this.godMode;
        const btn = document.getElementById('godModeBtn');
        const status = document.getElementById('godModeStatus');
        if (btn && status) {
            btn.classList.toggle('active', this.godMode);
            status.textContent = this.godMode ? 'ON' : 'OFF';
            status.style.color = this.godMode ? '#4f4' : '#888';
        }
        console.log(`🛡️ 无敌模式: ${this.godMode ? '开启' : '关闭'}`);
    }
    
    // 切换主题
    toggleTheme() {
        const html = document.documentElement;
        const currentTheme = html.getAttribute('data-theme') || 'dark';
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', newTheme);
        localStorage.setItem('gameTheme', newTheme);
        console.log(`🎨 主题切换: ${newTheme}`);
        return newTheme;
    }
    
    // 加载保存的主题
    loadTheme() {
        const savedTheme = localStorage.getItem('gameTheme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
    }
    
    // 更新分数显示
    updateScoreDisplay() {
        const sm = this.scoreManager;
        if (!sm.isPlaying) return;
        
        // 顶部中央分数
        const scoreValue = document.getElementById('scoreValue');
        if (scoreValue) scoreValue.textContent = sm.formatScore();
        
        // 连杀显示
        const streakEl = document.getElementById('killStreak');
        if (streakEl) {
            if (sm.killStreak >= 3) {
                streakEl.style.display = 'block';
                document.getElementById('streakCount').textContent = sm.killStreak;
            } else {
                streakEl.style.display = 'none';
            }
        }
    }
    
    // 结束游戏并计算分数
    endGame(result) {
        const scoreData = this.scoreManager.end(result);
        console.log('🏆 游戏结束！分数统计：', scoreData);
        this.gameResult = result;
        this.gameResultData = scoreData;
        this.showResultScreen = true;
        return scoreData;
    }
    
    // 返回主菜单（重新开始）
    returnToMainMenu() {
        // 重置游戏状态
        this.showResultScreen = false;
        this.gameResult = null;
        this.gameResultData = null;
        this.state = 'menu';
        
        // 隐藏游戏布局，显示故事界面
        const mainLayout = document.getElementById('mainLayout');
        mainLayout.classList.remove('active');
        // 清除可能设置的内联样式，避免影响下次显示
        mainLayout.style.display = '';
        document.getElementById('topScoreBar').style.display = 'none';
        document.getElementById('story').style.display = 'block';
        
        // 重新初始化游戏
        this.restartGame();
    }
    
    // 重新开始游戏
    restartGame() {
        // 重置玩家数据
        this.player.hp = this.player.maxHp = 6;
        this.player.exp = 0;
        this.player.lv = 1;
        this.player.gold = 100;
        this.player.facingRight = true;
        this.player.isMoving = false;
        this.player.walkCycle = 0;
        this.player.isDashing = false;
        this.player.dashTime = 0;
        this.player.dashCooldown = 0;
        this.player.dashDirection = {x:0, y:0};
        this.player.dashTrail = [];
        this.player.jumpY = 0;
        
        // 重置游戏状态
        this.currentFloor = 1;
        this.weapons = [new Weapon('wand', 1)];
        this.passives = new PassiveManager(this.player);
        this.items = new ItemManager(this.player);
        this.totems = new TotemManager();
        this.materials = new MaterialManager();
        this.bullets = [];
        this.playerLasers = []; // v0.30: 重置激光
        this.petLasers = []; // v0.30: 重置宠物激光
        this.particles = new ParticleSystem();
        this.damageNumbers = new DamageNumberSystem();
        this.gems = [];
        this.goldDrops = [];
        
        // 重置暂停状态
        this.paused = false;
        
        // 重置游戏速度和时间戳
        this.timeScale = 1;
        this.lastT = null; // 重置时间戳，防止dt计算错误
        console.log('🔄 restartGame: timeScale 重置为 1, lastT 重置为 null');
        try {
            this.setSpeed(1); // 更新UI按钮状态
        } catch (e) {
            console.error('setSpeed 失败:', e);
        }
        
        // 关闭所有界面
        this.shopOpen = false;
        this.levelUpOpen = false;
        this.shopItems = [];
        this.levelUpOptions = [];
        
        // 重置无敌模式（测试用）
        this.godMode = false;
        const godModeBtn = document.getElementById('godModeBtn');
        const godModeStatus = document.getElementById('godModeStatus');
        if (godModeBtn && godModeStatus) {
            godModeBtn.classList.remove('active');
            godModeStatus.textContent = 'OFF';
            godModeStatus.style.color = '#888';
        }
        
        // 重置相机
        this.camera.x = SURVIVOR_CONFIG.ROOM_WIDTH / 2;
        this.camera.y = SURVIVOR_CONFIG.ROOM_HEIGHT / 2;
        
        // 重新生成地图
        this.regenerateMap();
        
        // 重置分数系统
        this.scoreManager.start();
        
        // 播放菜单BGM
        if (this.audio) this.audio.playBGM('menu');
        
        console.log('🔄 游戏已重置');
    }
    
    // 初始化道具格子
    initItemGrid() {
        const grid = document.getElementById('sidebarItems');
        if (!grid) return;
        grid.innerHTML = '';
        for (let i = 0; i < 20; i++) {
            const slot = document.createElement('div');
            slot.className = 'item-cell';
            slot.id = `sidebarItem${i}`;
            grid.appendChild(slot);
        }
    }
    
    // 更新侧边面板
    updateSidePanels() {
        // 左侧边栏 - 角色状态
        const hpEl = document.getElementById('sidebarHp');
        if (hpEl) hpEl.textContent = `${this.player.hp}/${this.player.maxHp}`;
        
        const lvEl = document.getElementById('sidebarLv');
        if (lvEl) lvEl.textContent = `Lv.${this.player.lv}`;
        
        const goldEl = document.getElementById('sidebarGold');
        if (goldEl) goldEl.textContent = this.player.gold;
        
        const floorEl = document.getElementById('sidebarFloor');
        if (floorEl) floorEl.textContent = `${this.currentFloor}/${this.maxFloors}`;
        
        // 武器列表
        const weaponList = document.getElementById('sidebarWeapons');
        if (weaponList) {
            weaponList.innerHTML = '';
            // 幸存者模式：显示所有已装备武器
            this.weapons.forEach((w) => {
                const div = document.createElement('div');
                div.className = 'weapon-item';
                div.innerHTML = `
                    <span class="weapon-icon">${w.cfg.icon}</span>
                    <span class="weapon-name">${w.cfg.name}</span>
                    <span class="weapon-lv">Lv.${w.level}${w.evolution ? '★' : ''}</span>
                `;
                weaponList.appendChild(div);
            });
        }
        
        // 材料
        const matsEl = document.getElementById('sidebarMaterials');
        if (matsEl) {
            const mats = this.materials.getAll();
            if (mats.length > 0) {
                matsEl.innerHTML = mats.map(m => `${m.icon}${m.count}`).join(' ');
            } else {
                matsEl.textContent = '暂无';
            }
        }
        
        // 战斗属性
        if (this.items) {
            const stats = this.items.getStats();
            // 幸存者模式：显示所有武器总DPS
            const dmgEl = document.getElementById('sidebarDmg');
            if (dmgEl && this.weapons.length > 0) {
                // 计算所有武器的平均伤害
                let totalDmg = 0;
                this.weapons.forEach(w => {
                    totalDmg += Math.floor(w.cfg.dmg * (1 + (w.level - 1) * 0.15) * stats.projSize);
                });
                dmgEl.textContent = totalDmg;
            }
            
            // 移速
            const speedEl = document.getElementById('sidebarSpeed');
            if (speedEl) {
                const speedPercent = Math.floor(stats.speed * 100);
                speedEl.textContent = speedPercent + '%';
            }
            
            // 攻速
            const fireRateEl = document.getElementById('sidebarFireRate');
            if (fireRateEl) {
                const fireRatePercent = Math.floor(stats.fireRate * 100);
                fireRateEl.textContent = fireRatePercent + '%';
            }
            
            // 暴击率
            const critEl = document.getElementById('sidebarCrit');
            if (critEl) {
                const critPercent = Math.floor(stats.crit * 100);
                critEl.textContent = critPercent + '%';
            }
            
            // 护甲
            const armorEl = document.getElementById('sidebarArmor');
            if (armorEl) {
                armorEl.textContent = stats.armor;
            }
        }
        
        // 右侧边栏 - 房间类型和状态
        const roomTypeEl = document.getElementById('sidebarRoomType');
        if (roomTypeEl) {
            const names = { start: '起点', normal: '战斗', boss: 'BOSS', treasure: '宝箱', shop: '商店', hidden: '隐藏' };
            roomTypeEl.textContent = names[this.curRoom.type] || '未知';
        }
        
        const roomStatusEl = document.getElementById('sidebarRoomStatus');
        if (roomStatusEl) {
            if (this.curRoom.cleared) {
                roomStatusEl.innerHTML = '✓ <span style="color:#4f4">已清理</span>';
            } else {
                roomStatusEl.innerHTML = '🔒 <span style="color:#f44">锁定</span>';
            }
        }
        
        // 分数
        const scoreEl = document.getElementById('sidebarScore');
        if (scoreEl && this.scoreManager) {
            scoreEl.textContent = this.scoreManager.score;
        }
        
        // 击杀
        const killsEl = document.getElementById('sidebarKills');
        if (killsEl && this.scoreManager) {
            killsEl.textContent = this.scoreManager.stats.enemiesKilled;
        }
        
        // 探索
        const roomsEl = document.getElementById('sidebarRooms');
        if (roomsEl && this.scoreManager) {
            roomsEl.textContent = this.scoreManager.stats.roomsExplored;
        }
        
        // 道具格子（20格）- 从owned对象获取道具列表
        const ownedItems = this.items ? this.items.getOwnedItems() : [];
        for (let i = 0; i < 20; i++) {
            const slot = document.getElementById(`sidebarItem${i}`);
            if (slot) {
                if (ownedItems[i]) {
                    slot.textContent = ownedItems[i].icon;
                    slot.classList.add('filled');
                    slot.title = ownedItems[i].name + (ownedItems[i].count > 1 ? ` x${ownedItems[i].count}` : '');
                } else {
                    slot.textContent = '';
                    slot.classList.remove('filled');
                    slot.title = '';
                }
            }
        }
        
        // 左侧边栏 - 角色状态更新
        // 1. 玩家生命值（心形）
        const heartsEl = document.getElementById('playerHearts');
        if (heartsEl && this.player) {
            const maxHearts = Math.ceil(this.player.maxHp / 2); // 每2点HP一个心
            const currentHearts = Math.floor(this.player.hp / 2);
            const hasHalf = this.player.hp % 2 === 1;
            let heartsStr = '';
            for (let i = 0; i < maxHearts; i++) {
                if (i < currentHearts) {
                    heartsStr += '❤️'; // 实心
                } else if (i === currentHearts && hasHalf) {
                    heartsStr += '💔'; // 半心（用破碎心代替）
                } else {
                    heartsStr += '🖤'; // 空心（用黑心代替）
                }
            }
            heartsEl.textContent = heartsStr;
        }
        
        // 2. 经验条
        const expBar = document.getElementById('expBar');
        const levelDisplay = document.getElementById('levelDisplay');
        const expText = document.getElementById('expText');
        if (expBar && this.player) {
            const expNeeded = this.player.lv * 100;
            const expPercent = (this.player.exp / expNeeded) * 100;
            expBar.style.width = `${expPercent}%`;
            if (levelDisplay) levelDisplay.textContent = this.player.lv;
            if (expText) expText.textContent = `${this.player.exp}/${expNeeded}`;
        }
        
        // 顶部信息栏更新
        // 3. 层数——地形名称
        const floorDisplay = document.getElementById('currentFloorDisplay');
        const floorName = document.getElementById('floorName');
        if (floorDisplay) floorDisplay.textContent = this.currentFloor;
        if (floorName) floorName.textContent = this.floorNames[this.currentFloor - 1] || '未知';
        
        // 4. 波次 | 敌人 | 连杀
        const waveNum = document.getElementById('waveNum');
        const enemyNum = document.getElementById('enemyNum');
        if (waveNum) {
            waveNum.textContent = this.curRoom.hordeManager ? this.curRoom.hordeManager.wave : 0;
        }
        if (enemyNum) {
            const activeCount = this.curRoom.hordeManager ? 
                this.curRoom.hordeManager.getActiveEnemies().length : 
                this.curRoom.enemies.filter(e => e.hp > 0).length;
            enemyNum.textContent = activeCount;
        }
        
        // 更新小地图（以撒风格：已访问=实心，未访问=轮廓）
        this.updateMiniMap();
    }
    
    // 小地图在右侧边栏以撒风格绘制 (updateMiniMap)
    // 已访问房间=实心，未访问房间=轮廓
    async loadSprites() {
        const basePath = 'https://wearescientist.github.io/rouge-cow/assets/sprites/';
        await this.sprites.load('player', basePath + 'player_cow.png');
        
        // 加载所有22种敌人精灵
        const allEnemies = [
            'chick', 'mouse', 'snail', 'pigeon', 'duck3',      // Tier 1
            'rabbit', 'rabbit2', 'bird', 'duck2', 'pig2',      // Tier 2
            'cat', 'duck', 'squirrel', 'goose',                // Tier 3
            'dog', 'pig', 'sheep', 'snake',                    // Tier 4
            'bear', 'crab', 'dog2',                            // Tier 5
            'turtle'                                           // Tier 6
        ];
        
        for (const name of allEnemies) {
            await this.sprites.load(name, basePath + name + '.png');
            this.updateLoadingProgress();
        }
    }
    
    updateLoadingProgress() {
        const progress = this.sprites.getProgress() * 100;
        const progressBar = document.getElementById('loadingProgress');
        const loadingText = document.getElementById('loadingText');
        if (progressBar) progressBar.style.width = `${progress}%`;
        if (loadingText) loadingText.textContent = `正在加载... ${Math.floor(progress)}%`;
    }
    
    // 重新生成地图（当房间尺寸改变时调用）
    regenerateMap() {
        const gen = new MapGenerator();
        const map = gen.generate(1);
        this.curRoom = map.start;
        this.allRooms = map.rooms;
        this.curRoom.visited = true;
        this.allFloors.set(1, { start: map.start, rooms: map.rooms });
        
        // 重新设置玩家位置
        const roomW = SURVIVOR_CONFIG.ROOM_WIDTH;
        const roomH = SURVIVOR_CONFIG.ROOM_HEIGHT;
        this.player.x = roomW / 2;
        this.player.y = roomH / 2;
        this.camera.follow(this.player);
        
        console.log(`🗺️ 地图重新生成: ${roomW}x${roomH}`);
    }

    setupInput() {
        window.addEventListener('keydown', e => {
            this.keys[e.key] = true;
            
            // 结算画面操作
            if (this.showResultScreen) {
                if (e.key === ' ' || e.key === 'Enter' || e.key === 'Escape') {
                    this.returnToMainMenu();
                }
                return;
            }
            
            // ESC暂停/恢复（仅在游戏中，不在商店/升级界面）
            if (e.key === 'Escape') {
                if (this.state === 'playing' && !this.shopOpen && !this.levelUpOpen) {
                    this.togglePause();
                }
                return;
            }
            
            // 如果游戏暂停，不处理其他按键
            if (this.paused) return;
            
            // 升级选择界面操作（4选1）
            if (this.levelUpOpen) {
                if (e.key >= '1' && e.key <= '4') {
                    this.selectLevelUpOption(parseInt(e.key) - 1);
                }
                return;
            }
            
            // 商店交互
            if (e.key === 'e' || e.key === 'E') {
                if (this.shopOpen) {
                    this.closeShop();
                } else if (this.curRoom.type === 'shop' && this.curRoom.npc) {
                    const d = dist(this.player.x, this.player.y, this.curRoom.npc.x, this.curRoom.npc.y);
                    if (d < 80) {
                        this.openShop();
                    }
                }
            }
            
            if (this.shopOpen) {
                if (e.key >= '1' && e.key <= '3') {
                    this.buyItem(parseInt(e.key) - 1);
                }
                return;
            }
            
            if (e.key >= '1' && e.key <= '9') {
                const id = parseInt(e.key);
                if (this.items.add(id)) {
                    this.particles.burst(this.player.x, this.player.y, '#ff0', 15);
                }
            }
            
            if (e.key === 'f' || e.key === 'F') {
                if (!document.fullscreenElement) {
                    document.documentElement.requestFullscreen();
                } else {
                    document.exitFullscreen();
                }
            }
            
            if (e.key === 'g' || e.key === 'G') {
                this.toggleGodMode();
            }
            
            // 速度调整快捷键 -/+ (或 =)
            if (e.key === '-' || e.key === '_') {
                const speeds = [1, 2, 5, 10];
                const currentIdx = speeds.indexOf(this.timeScale);
                const newIdx = Math.max(0, currentIdx - 1);
                this.setSpeed(speeds[newIdx]);
            }
            if (e.key === '=' || e.key === '+' || e.key === '0') {
                const speeds = [1, 2, 5, 10];
                const currentIdx = speeds.indexOf(this.timeScale);
                const newIdx = Math.min(speeds.length - 1, currentIdx + 1);
                this.setSpeed(speeds[newIdx]);
            }
            
            // 存档功能快捷键（第5次迭代）
            if (e.key === 'l' || e.key === 'L') {
                if (this.hasSave()) {
                    this.loadGame();
                    this.particles.burst(this.player.x, this.player.y, '#48f', 20);
                    console.log('📂 已加载存档');
                } else {
                    console.log('❌ 无存档可加载');
                }
            }
            if (e.key === 'k' || e.key === 'K') {
                this.saveGame();
                this.particles.burst(this.player.x, this.player.y, '#4f4', 20);
                console.log('💾 已手动存档');
            }
        });
        
        window.addEventListener('keyup', e => this.keys[e.key] = false);
        
        // 鼠标点击支持
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.addEventListener('mousedown', e => {
                const rect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                this.mouseX = (e.clientX - rect.left) * scaleX;
                this.mouseY = (e.clientY - rect.top) * scaleY;
                this.mouseDown = true;
                this.handleClick(this.mouseX, this.mouseY);
            });
            
            canvas.addEventListener('mouseup', () => {
                this.mouseDown = false;
            });
            
            canvas.addEventListener('mousemove', e => {
                const rect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                this.mouseX = (e.clientX - rect.left) * scaleX;
                this.mouseY = (e.clientY - rect.top) * scaleY;
            });
            
            // 触摸控制支持（移动设备）
            canvas.addEventListener('touchstart', e => {
                e.preventDefault();
                const touch = e.touches[0];
                const rect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                this.mouseX = (touch.clientX - rect.left) * scaleX;
                this.mouseY = (touch.clientY - rect.top) * scaleY;
                this.mouseDown = true;
                this.handleClick(this.mouseX, this.mouseY);
            }, { passive: false });
            
            canvas.addEventListener('touchmove', e => {
                e.preventDefault();
                const touch = e.touches[0];
                const rect = canvas.getBoundingClientRect();
                const scaleX = canvas.width / rect.width;
                const scaleY = canvas.height / rect.height;
                this.mouseX = (touch.clientX - rect.left) * scaleX;
                this.mouseY = (touch.clientY - rect.top) * scaleY;
            }, { passive: false });
            
            canvas.addEventListener('touchend', e => {
                e.preventDefault();
                this.mouseDown = false;
            }, { passive: false });
            
        }
    }
    
    // 处理点击事件
    handleClick(x, y) {
        // 结算画面点击处理
        if (this.showResultScreen) {
            // 使用保存的按钮坐标进行检测
            const btn = this.resultBtnRect;
            if (btn && x > btn.x && x < btn.x + btn.w && y > btn.y && y < btn.y + btn.h) {
                this.returnToMainMenu();
            }
            return;
        }
        
        // 升级选择界面点击处理（4选1）
        if (this.levelUpOpen) {
            const canvas = document.getElementById('gameCanvas');
            if (!canvas) return;
            const cw = canvas.width;
            const ch = canvas.height;
            
            // 计算四个选项的位置（2x2网格）
            const boxWidth = 560;
            const boxHeight = 400;
            const boxX = (cw - boxWidth) / 2;
            const boxY = (ch - boxHeight) / 2;
            const cardWidth = 240;
            const cardHeight = 150;
            const gapX = 40;
            const gapY = 30;
            const startX = boxX + (boxWidth - 2 * cardWidth - gapX) / 2 + cardWidth / 2;
            const startY = boxY + 100 + cardHeight / 2;
            
            for (let i = 0; i < 4; i++) {
                const row = Math.floor(i / 2);
                const col = i % 2;
                const cx = startX + col * (cardWidth + gapX);
                const cy = startY + row * (cardHeight + gapY);
                if (x > cx - cardWidth/2 && x < cx + cardWidth/2 &&
                    y > cy - cardHeight/2 && y < cy + cardHeight/2) {
                    this.selectLevelUpOption(i);
                    return;
                }
            }
            return;
        }
        
        // 商店界面点击处理
        if (this.shopOpen) {
            const canvas = document.getElementById('gameCanvas');
            if (!canvas) return;
            const cw = canvas.width || 900;
            const ch = canvas.height || 600;
            const centerX = cw / 2;
            const centerY = ch / 2;
            
            // 与 drawShopUI 完全一致的坐标
            const boxWidth = 500;
            const boxHeight = 350;
            const boxX = centerX - boxWidth / 2;
            const boxY = centerY - boxHeight / 2;
            const itemWidth = 130;
            const itemHeight = 160;
            const startX = centerX - (this.shopItems.length * itemWidth) / 2 + itemWidth / 2;
            const itemY = boxY + 160;
            
            // 检查是否点击在关闭区域（点击背景关闭）
            if (x < boxX || x > boxX + boxWidth || y < boxY || y > boxY + boxHeight) {
                this.closeShop();
                return;
            }
            
            for (let i = 0; i < this.shopItems.length; i++) {
                const ix = startX + i * (itemWidth + 20);
                if (x > ix - itemWidth/2 && x < ix + itemWidth/2 &&
                    y > itemY - itemHeight/2 && y < itemY + itemHeight/2) {
                    this.buyItem(i);
                    return;
                }
            }
            return;
        }
    }
    
    // 吸血鬼幸存者风格：4选1升级选择界面（2武器+2被动）
    openLevelUpSelect() {
        this.levelUpOpen = true;
        this.levelUpOptions = [];
        
        // 升级特效
        this.particles.explosion(this.player.x, this.player.y, '#ff0', 40);
        this.particles.sparkle(this.player.x, this.player.y, '#fff', 15);
        
        // 生成2个武器选项
        const availableWeapons = Object.keys(WEAPONS).filter(key => {
            const existing = this.weapons.find(w => w.baseKey === key && !w.isSuper);
            // 未满级的武器或新武器
            return !existing || existing.canLevelUp();
        });
        
        for (let i = 0; i < 2 && availableWeapons.length > 0; i++) {
            const idx = Math.floor(Math.random() * availableWeapons.length);
            const key = availableWeapons.splice(idx, 1)[0];
            const existing = this.weapons.find(w => w.baseKey === key);
            
            this.levelUpOptions.push({
                type: 'weapon',
                key: key,
                isNew: !existing,
                level: existing ? existing.level + 1 : 1,
                maxLevel: WEAPONS[key].maxLevel,
                data: WEAPONS[key]
            });
        }
        
        // 生成2个被动选项
        const availablePassives = Object.keys(PASSIVES).filter(key => {
            const level = this.passives.getLevel(key);
            const maxLevel = PASSIVES[key].maxLevel;
            return level < maxLevel; // 未满级的被动
        });
        
        for (let i = 0; i < 2 && availablePassives.length > 0; i++) {
            const idx = Math.floor(Math.random() * availablePassives.length);
            const key = availablePassives.splice(idx, 1)[0];
            const currentLevel = this.passives.getLevel(key);
            
            this.levelUpOptions.push({
                type: 'passive',
                key: key,
                level: currentLevel + 1,
                maxLevel: PASSIVES[key].maxLevel,
                data: PASSIVES[key]
            });
        }
        
        console.log('升级选择界面已打开', this.levelUpOptions);
    }
    
    closeLevelUpSelect() {
        this.levelUpOpen = false;
        this.levelUpOptions = [];
    }
    
    selectLevelUpOption(index) {
        if (index >= this.levelUpOptions.length) return;
        const option = this.levelUpOptions[index];
        
        if (option.type === 'weapon') {
            const existingIdx = this.weapons.findIndex(w => w.baseKey === option.key && !w.isSuper);
            if (existingIdx >= 0) {
                // 升级现有武器
                const weapon = this.weapons[existingIdx];
                if (weapon.canLevelUp()) {
                    weapon.level++;
                    this.particles.burst(this.player.x, this.player.y, '#f0f', 20);
                    console.log(`武器升级: ${option.data.name} Lv.${weapon.level}`);
                    
                    // 检查是否可以进化成超武
                    this.checkWeaponEvolution(existingIdx);
                }
            } else if (this.weapons.length < 6) {
                // 添加新武器
                this.weapons.push(new Weapon(option.key, 1));
                this.particles.burst(this.player.x, this.player.y, '#4f4', 15);
                console.log(`获得新武器: ${option.data.name}`);
            }
        } else if (option.type === 'passive') {
            // 添加或升级被动
            const isNew = this.passives.getLevel(option.key) === 0;
            this.passives.add(option.key);
            this.particles.burst(this.player.x, this.player.y, '#48f', 15);
            console.log(`${isNew ? '获得' : '升级'}被动: ${option.data.name} Lv.${option.level}`);
        }
        
        this.closeLevelUpSelect();
    }
    
    // 检查武器是否可以进化成超武
    checkWeaponEvolution(weaponIdx) {
        const weapon = this.weapons[weaponIdx];
        if (!weapon || weapon.isSuper) return;
        if (weapon.level < weapon.maxLevel) return; // 必须满级
        
        const evo = this.passives.checkEvolution(weapon.baseKey);
        if (!evo) return;
        
        // 可以进化！
        console.log(`武器${weapon.cfg.name}可以进化成${evo.name}！`);
        
        // 进化武器
        weapon.evolveToSuper(evo.result);
        this.particles.burst(this.player.x, this.player.y, '#f0f', 50);
        this.sounds.play('evolve');
        console.log(`✨ 武器进化: ${evo.name}！`);
    }
    
    openShop() {
        if (this.shopItems.length === 0) {
            const itemIds = Object.keys(ITEMS).map(Number);
            const selected = [];
            while (selected.length < 3 && itemIds.length > 0) {
                const idx = Math.floor(Math.random() * itemIds.length);
                const itemId = itemIds.splice(idx, 1)[0];
                const item = ITEMS[itemId];
                if (item) {
                    selected.push({
                        id: itemId,
                        icon: item.icon,
                        name: item.name,
                        desc: item.desc,
                        price: getItemPrice(itemId),
                        rarity: item.rarity
                    });
                }
            }
            this.shopItems = selected;
        }
        this.shopOpen = true;
        console.log('商店已打开');
    }
    
    closeShop() {
        this.shopOpen = false;
        this.shopSelected = -1;
        console.log('商店已关闭');
    }
    
    // 关闭当前房间所有门（进入刷怪房间时调用）
    closeAllDoors() {
        for (const door of Object.values(this.curRoom.doors)) {
            if (door) {
                door.open = false;
                door.locked = true;
            }
        }
        console.log('🚪 门已关闭，清理房间以开启');
    }
    
    // 打开当前房间所有门（清理完成后调用）
    openAllDoors() {
        for (const door of Object.values(this.curRoom.doors)) {
            if (door) {
                door.open = true;
                door.locked = false;
            }
        }
        console.log('🚪 门已开启');
    }
    
    // 房间清理完成后自动拾取所有经验球
    autoCollectAllGems() {
        if (this.gems.length === 0) return;
        
        let totalExp = 0;
        const expBonus = this.passives ? this.passives.getStats().expBonus : 0;
        
        // 计算所有经验值
        for (const g of this.gems) {
            totalExp += Math.floor(g.v * (1 + expBonus));
        }
        
        // 清空所有经验球
        this.gems = [];
        
        // 一次性添加经验
        this.player.exp += totalExp;
        
        // 显示经验飘字效果
        this.particles.burst(this.player.x, this.player.y, '#48f', 15);
        
        console.log(`✨ 自动拾取经验: +${totalExp}`);
        
        // 检查升级（可能连续升多级）
        while (this.player.exp >= this.player.lv * 100) {
            this.player.exp -= this.player.lv * 100;
            this.player.lv++;
            this.sounds.play('levelup');
            this.particles.burst(this.player.x, this.player.y, '#ff0', 20);
            // 打开4选1升级界面
            this.openLevelUpSelect();
            // 升级界面打开后退出循环，等升级完成后再检查
            break;
        }
    }
    
    buyItem(index) {
        if (index < 0 || index >= this.shopItems.length) return;
        const item = this.shopItems[index];
        if (this.player.gold >= item.price) {
            this.player.gold -= item.price;
            this.items.add(item.id);
            this.particles.burst(this.player.x, this.player.y, '#ff0', 20);
            this.sounds.play('buy');
            this.shopItems.splice(index, 1);
            console.log(`购买成功: ${item.name}`);
        } else {
            console.log('金币不足');
        }
    }

    async start() {
        // 加载保存的主题
        this.loadTheme();
        
        await this.loadSprites();
        this.sounds.init();
        document.getElementById('loading').classList.add('hidden');
        
        // 窗口大小变化时更新相机视野
        window.addEventListener('resize', () => {
            if (this.camera) {
                this.camera.updateViewport();
            }
        });
        
        document.getElementById('story').style.display = 'block';
        document.getElementById('startGameBtn').addEventListener('click', () => {
            document.getElementById('story').style.display = 'none';
            this.state = 'playing';
            // 显示游戏布局
            document.getElementById('mainLayout').classList.add('active');
            document.getElementById('topScoreBar').style.display = 'block';
            // 初始化相机视野
            this.camera.updateViewport();
            // 初始化道具格子
            this.initItemGrid();
            // 启动分数系统
            this.scoreManager.start();
            this.updateScoreDisplay();
            // 根据第一个房间类型播放BGM
            this._updateBGM();
            this.loop(0);
        });
    }
    
    // 切换暂停状态
    togglePause() {
        this.paused = !this.paused;
        console.log(this.paused ? '⏸️ 游戏已暂停' : '▶️ 游戏已恢复');
    }
    
    // 根据当前房间类型更新BGM
    _updateBGM() {
        if (!this.audio) return;
        
        const roomType = this.curRoom?.type;
        let bgmType = 'menu';
        
        switch(roomType) {
            case 'normal':
            case 'combat':
                bgmType = 'normal';
                break;
            case 'elite':
            case 'hidden':
                bgmType = 'elite';
                break;
            case 'boss':
                bgmType = 'boss';
                break;
            case 'start':
            case 'shop':
            case 'treasure':
            default:
                bgmType = 'menu';
                break;
        }
        
        this.audio.playBGM(bgmType);
    }
    
    // 绘制暂停界面
    drawPauseScreen() {
        const ctx = this.ctx;
        const canvas = ctx.canvas;
        const cw = canvas.width || 900;
        const ch = canvas.height || 600;
        
        // 半透明黑色遮罩
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, cw, ch);
        
        // 暂停文字
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 56px Arial';
        ctx.fillText('⏸️ 已暂停', cw / 2, ch / 2 - 30);
        
        // 提示文字
        ctx.fillStyle = '#aaa';
        ctx.font = '20px Arial';
        ctx.fillText('按 ESC 键恢复游戏', cw / 2, ch / 2 + 30);
    }
    
    // v0.30: 更新玩家激光效果
    _updatePlayerLasers(dt) {
        if (!this.playerLasers || this.playerLasers.length === 0) return;
        
        const activeEnemies = this.curRoom?.enemies?.filter(e => e.hp > 0) || [];
        
        for (let i = this.playerLasers.length - 1; i >= 0; i--) {
            const laser = this.playerLasers[i];
            
            // 更新激光位置跟随玩家
            laser.x = this.player.x;
            laser.y = this.player.y;
            
            // 如果有目标且目标存活，更新角度指向目标
            if (laser.target && laser.target.hp > 0) {
                const tx = laser.target.x || laser.target.cx || laser.target.x;
                const ty = laser.target.y || laser.target.cy || laser.target.y;
                laser.angle = Math.atan2(ty - laser.y, tx - laser.x);
            }
            
            // 计算激光终点
            const endX = laser.x + Math.cos(laser.angle) * laser.range;
            const endY = laser.y + Math.sin(laser.angle) * laser.range;
            
            // 持续伤害 - 每帧检测碰撞
            for (const enemy of activeEnemies) {
                if (laser.hits.has(enemy.id)) continue; // 本帧已击中
                
                const ex = enemy.x || enemy.cx || enemy.x;
                const ey = enemy.y || enemy.target.cy || enemy.y;
                
                // 点到线段距离检测
                const dist = this._pointToLineDistance(ex, ey, laser.x, laser.y, endX, endY);
                
                if (dist < laser.width + (enemy.radius || 15)) {
                    // 检查伤害冷却
                    const lastHit = laser.hitCooldowns.get(enemy.id) || 0;
                    const now = Date.now();
                    if (now - lastHit > 100) { // 每100ms最多造成一次伤害
                        enemy.hp -= laser.dmg;
                        laser.hitCooldowns.set(enemy.id, now);
                        this.damageNumbers.add(enemy.x, enemy.y, Math.floor(laser.dmg), false);
                        
                        if (enemy.hp <= 0) {
                            this.onEnemyKilled(enemy);
                        }
                    }
                    laser.hits.add(enemy.id);
                }
            }
            
            // 重置本帧击中记录
            laser.hits.clear();
            
            // 更新生命周期
            laser.life -= dt;
            if (laser.life <= 0) {
                this.playerLasers.splice(i, 1);
            }
        }
    }
    
    // v0.30: 更新宠物激光效果
    _updatePetLasers(dt) {
        if (!this.petLasers || this.petLasers.length === 0) return;
        
        const activeEnemies = this.curRoom?.enemies?.filter(e => e.hp > 0) || [];
        
        for (let i = this.petLasers.length - 1; i >= 0; i--) {
            const laser = this.petLasers[i];
            
            // 更新激光位置跟随宠物
            if (laser.owner && laser.owner.x !== undefined) {
                laser.x = laser.owner.x;
                laser.y = laser.owner.y;
                laser.angle = laser.owner.angle;
            }
            
            // 计算激光终点
            const endX = laser.x + Math.cos(laser.angle) * laser.range;
            const endY = laser.y + Math.sin(laser.angle) * laser.range;
            
            // 持续伤害
            for (const enemy of activeEnemies) {
                if (laser.hitEnemies.has(enemy.id)) continue;
                
                const ex = enemy.x || enemy.cx || enemy.x;
                const ey = enemy.y || enemy.cy || enemy.y;
                
                const dist = this._pointToLineDistance(ex, ey, laser.x, laser.y, endX, endY);
                
                if (dist < laser.width + (enemy.radius || 15)) {
                    const lastHit = laser.hitCooldowns.get(enemy.id) || 0;
                    const now = Date.now();
                    if (now - lastHit > 200) { // 宠物激光200ms一跳伤害
                        enemy.hp -= laser.dmg;
                        laser.hitCooldowns.set(enemy.id, now);
                        this.damageNumbers.add(enemy.x, enemy.y, Math.floor(laser.dmg), false);
                        
                        if (enemy.hp <= 0) {
                            this.onEnemyKilled(enemy);
                        }
                    }
                    laser.hitEnemies.add(enemy.id);
                }
            }
            
            laser.hitEnemies.clear();
            
            laser.life -= dt;
            if (laser.life <= 0) {
                this.petLasers.splice(i, 1);
            }
        }
    }
    
    // v0.30: 点到线段距离计算
    _pointToLineDistance(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) {
            param = dot / lenSq;
        }
        
        let xx, yy;
        
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        const dx = px - xx;
        const dy = py - yy;
        
        return Math.sqrt(dx * dx + dy * dy);
    }

    update(dt) {
        if (this.shopOpen || this.levelUpOpen || this.paused) return;
        
        // 更新房间（波次系统）
        this.curRoom.update(dt);
        
        if (this.transition.active) {
            this.transition.timer -= dt;
            if (this.transition.timer <= 0) {
                this.curRoom = this.transition.target;
                this.curRoom.visited = true;
                // 分数：进入新房间
                this.scoreManager.onEnterRoom();
                const roomW = SURVIVOR_CONFIG.ROOM_WIDTH;
                const roomH = SURVIVOR_CONFIG.ROOM_HEIGHT;
                const wallT = 60;
                // 传送位置：远离门区域，往房间中心移动 150px
                const spawnOffset = 150;
                if (this.transition.dir === 'left') this.player.x = roomW - wallT - spawnOffset;
                else if (this.transition.dir === 'right') this.player.x = wallT + spawnOffset;
                else this.player.x = roomW / 2;
                
                if (this.transition.dir === 'up') this.player.y = roomH - wallT - spawnOffset;
                else if (this.transition.dir === 'down') this.player.y = wallT + spawnOffset;
                else this.player.y = roomH / 2;
                
                this.transition.active = false;
                
                // 根据房间类型切换BGM
                this._updateBGM();
                
                // 如果是首次进入房间，生成敌人（包括Boss）
                if (!this.curRoom.cleared && this.curRoom.enemies.length === 0) {
                    this.curRoom.spawnEnemies();
                    // 播放对应房间类型的音效
                    if (this.curRoom.type === 'boss') {
                        this.sounds.play('boss');
                    } else if (this.curRoom.type === 'hidden') {
                        this.sounds.play('elite');
                    }
                }
                
                // 如果房间会刷怪且未清理，关闭所有门（封锁房间直到清怪完成）
                if (!this.curRoom.cleared && this.curRoom.hordeManager) {
                    this.closeAllDoors();
                }
                
                // 自动存档（进入新房间时）
                this.saveGame();
            }
            return;
        }

        // 合并所有属性来源：道具 + 被动 + 图腾
        const itemStats = this.items.getStats();
        const passiveStats = this.passives.getStats();
        const totemBonuses = this.totems.getAllBonuses();
        
        // 计算 fireRate，防止除以零或无效值
        const cooldown = passiveStats.cooldown || 1;
        const fireRate = (itemStats.fireRate || 1) * (1 / cooldown);
        
        const stats = {
            // 基础属性（道具+被动合并）
            projCount: (itemStats.projCount || 1) + (passiveStats.projCount || 0),
            projSize: itemStats.projSize || 1,
            fireRate: isFinite(fireRate) ? fireRate : 1, // 防止 Infinity
            pierce: itemStats.pierce || 0,
            crit: Math.min(1, (itemStats.crit || 0) + (totemBonuses.crit || 0) + ((passiveStats.luck || 0) * 0.5)), // 幸运转化为暴击
            critDmg: itemStats.critDmg || 1.5,
            maxHp: itemStats.maxHp || 0,
            armor: (itemStats.armor || 0) + (passiveStats.armor || 0),
            lifeSteal: itemStats.lifeSteal || 0,
            speed: ((itemStats.speed || 1) + (passiveStats.speed || 0)) * (1 + (totemBonuses.speed || 0)), // 翅膀+图腾
            fly: itemStats.fly || false,
            magnet: (itemStats.magnet || 100) + (passiveStats.magnet || 0),
            goldBonus: itemStats.goldBonus || 1,
            // 伤害类型
            fireDmg: itemStats.fireDmg || 0,
            thunderDmg: itemStats.thunderDmg || 0,
            poisonDmg: itemStats.poisonDmg || 0,
            curseDmg: itemStats.curseDmg || 0,
            // 控制效果
            slowChance: itemStats.slowChance || 0,
            slowAmount: itemStats.slowAmount || 0,
            stunChance: itemStats.stunChance || 0,
            // 其他
            dmg: (itemStats.dmg || 1) * (passiveStats.dmg || 1) * (1 + (totemBonuses.dmg || 0)) // 菠菜+图腾
        };
        
        const speed = 300 * stats.speed;  // 移速翻倍
        
        // 冲刺冷却更新
        if (this.player.dashCooldown > 0) this.player.dashCooldown -= dt;
        
        // 冲刺处理
        if (this.player.isDashing) {
            this.player.dashTime -= dt;
            if (this.player.dashTime <= 0) {
                this.player.isDashing = false;
                this.player.jumpY = 0;
            } else {
                // 冲刺中 - 快速移动
                const dashSpeed = 400;
                this.player.x += this.player.dashDirection.x * dashSpeed * dt;
                this.player.y += this.player.dashDirection.y * dashSpeed * dt;
                // 跳跃弧线
                const progress = 1 - (this.player.dashTime / 0.15);
                this.player.jumpY = -Math.sin(progress * Math.PI) * 12;
                // 添加残影
                if (Math.random() < 0.5) {
                    this.player.dashTrail.push({x: this.player.x, y: this.player.y + this.player.jumpY, alpha: 0.5});
                }
            }
        }
        
        // 普通移动
        let dx = 0, dy = 0;
        if (this.keys['w'] || this.keys['W'] || this.keys['ArrowUp']) dy -= 1;
        if (this.keys['s'] || this.keys['S'] || this.keys['ArrowDown']) dy += 1;
        if (this.keys['a'] || this.keys['A'] || this.keys['ArrowLeft']) { dx -= 1; this.player.facingRight = false; }
        if (this.keys['d'] || this.keys['D'] || this.keys['ArrowRight']) { dx += 1; this.player.facingRight = true; }
        
        // 空格冲刺触发
        if (this.keys[' '] && this.player.dashCooldown <= 0 && !this.player.isDashing) {
            if (dx !== 0 || dy !== 0) {
                const len = Math.sqrt(dx*dx + dy*dy);
                this.player.isDashing = true;
                this.player.dashTime = 0.15;
                this.player.dashCooldown = 0.6;
                this.player.dashDirection = {x: dx/len, y: dy/len};
            }
        }
        
        this.player.isMoving = (dx !== 0 || dy !== 0);
        if (this.player.isMoving && !this.player.isDashing) {
            this.player.walkCycle += dt * 15;
        } else {
            this.player.walkCycle = 0;
        }
        
        // 更新残影
        for (let i = this.player.dashTrail.length - 1; i >= 0; i--) {
            this.player.dashTrail[i].alpha -= 0.1;
            if (this.player.dashTrail[i].alpha <= 0) this.player.dashTrail.splice(i, 1);
        }
        
        if ((dx !== 0 || dy !== 0) && !this.player.isDashing) {
            const len = Math.sqrt(dx*dx + dy*dy);
            const newX = this.player.x + (dx / len) * speed * dt;
            const newY = this.player.y + (dy / len) * speed * dt;
            
            const wallThickness = 40;
            
            let canMoveX = true;
            const roomWidth = SURVIVOR_CONFIG.ROOM_WIDTH;
            const roomHeight = SURVIVOR_CONFIG.ROOM_HEIGHT;
            const centerX = roomWidth / 2;
            const centerY = roomHeight / 2;
            
            if (newX < wallThickness) {
                if (!(this.player.y > centerY - 40 && this.player.y < centerY + 40 && this.curRoom.doors.left && this.curRoom.doors.left.open)) {
                    canMoveX = false;
                }
            }
            if (newX > roomWidth - wallThickness) {
                if (!(this.player.y > centerY - 40 && this.player.y < centerY + 40 && this.curRoom.doors.right && this.curRoom.doors.right.open)) {
                    canMoveX = false;
                }
            }
            
            let canMoveY = true;
            if (newY < wallThickness) {
                if (!(this.player.x > centerX - 30 && this.player.x < centerX + 30 && this.curRoom.doors.up && this.curRoom.doors.up.open)) {
                    canMoveY = false;
                }
            }
            if (newY > roomHeight - wallThickness) {
                if (!(this.player.x > centerX - 30 && this.player.x < centerX + 30 && this.curRoom.doors.down && this.curRoom.doors.down.open)) {
                    canMoveY = false;
                }
            }
            
            if (canMoveX) this.player.x = newX;
            if (canMoveY) this.player.y = newY;
        }
        
        // 玩家边界限制 - 有门的地方允许走出去（走进门触发传送）
        let minX = 0, maxX = SURVIVOR_CONFIG.ROOM_WIDTH;
        let minY = 0, maxY = SURVIVOR_CONFIG.ROOM_HEIGHT;
        
        // 如果没有门，限制在墙内
        if (!this.curRoom.doors.left) minX = 60;
        if (!this.curRoom.doors.right) maxX = SURVIVOR_CONFIG.ROOM_WIDTH - 60;
        if (!this.curRoom.doors.up) minY = 60;
        if (!this.curRoom.doors.down) maxY = SURVIVOR_CONFIG.ROOM_HEIGHT - 60;
        
        this.player.x = clamp(this.player.x, minX, maxX);
        this.player.y = clamp(this.player.y, minY, maxY);
        
        // 门传送检测 - 与 Room.draw 中的门位置保持一致（门和墙平齐）
        if (this.curRoom.cleared) {
            const roomW = SURVIVOR_CONFIG.ROOM_WIDTH;
            const roomH = SURVIVOR_CONFIG.ROOM_HEIGHT;
            const wallT = 60;
            const centerX = roomW / 2;
            const centerY = roomH / 2;
            for (const [dir, door] of Object.entries(this.curRoom.doors)) {
                if (!door || !door.open) continue;
                // 门位置与 Room.draw 中一致（和墙平齐）
                const pos = { 
                    up: [centerX - 40, 0, 80, wallT],              // 上: y=0, h=60
                    down: [centerX - 40, roomH - wallT, 80, wallT], // 下: y=740, h=60
                    left: [0, centerY - 50, wallT, 100],           // 左: x=0, w=60
                    right: [roomW - wallT, centerY - 50, wallT, 100] // 右: x=1140, w=60
                }[dir];
                if (this.player.x > pos[0] && this.player.x < pos[0] + pos[2] &&
                    this.player.y > pos[1] && this.player.y < pos[1] + pos[3]) {
                    this.transition = { active: true, timer: 0.3, dir, target: door.target };
                    break;
                }
            }
        }
        
        // 更新敌人（使用波次管理器的活跃敌人）
        const activeEnemies = this.curRoom.getActiveEnemies ? this.curRoom.getActiveEnemies() : this.curRoom.enemies;
        for (const e of activeEnemies) {
            if (e.hp <= 0) continue;
            e.update(dt, this.player, this.curRoom);
            const d = dist(e.x, e.y, this.player.x, this.player.y);
            if (d < 35 && e.attackCd <= 0) {
                if (!this.godMode && !this.player.isDashing) {
                    const actualDmg = Math.max(0, e.dmg - stats.armor);
                    this.player.hp -= actualDmg;
                    // 分数：受伤扣分
                    if (actualDmg > 0) {
                        this.scoreManager.onDamage();
                        this.sounds.play('hurt');
                    }
                }
                e.attackCd = 0.5;
                if (this.player.hp <= 0) {
                    this.state = 'gameover';
                    this.sounds.play('gameover');
                }
            }
        }
        
        // 检查房间是否清理完成（使用活跃敌人而非原始数组）
        const aliveEnemies = activeEnemies.filter(e => e.hp > 0);
        if (aliveEnemies.length === 0 && !this.curRoom.cleared) {
            this.curRoom.cleared = true;
            this.openAllDoors(); // 打开门
            this.particles.burst(this.player.x, this.player.y, '#4f4', 30);
            
            // 房间清理完成，自动拾取所有经验球
            this.autoCollectAllGems();
            
            if (this.curRoom.type === 'boss') {
                this.spawnTotemPickup();
                this.spawnStairs(); // 生成通往下一层的楼梯
                // 只有第6层（最后一层）Boss才触发胜利
                if (this.currentFloor >= this.maxFloors) {
                    this.state = 'victory';
                }
                return;
            }
            
            this.spawnRoomReward();
        }
        
        // 寻找最近目标（从活跃敌人中）
        let target = null, minD = 9999;
        for (const e of activeEnemies) {
            if (e.hp <= 0) continue;
            const d = dist(e.x, e.y, this.player.x, this.player.y);
            if (d < minD) { minD = d; target = e; }
        }
        
        // 幸存者模式：所有武器独立更新和开火
        for (const w of this.weapons) {
            w.update(dt);
            if (w.canFire() && target) {
                const fired = w.fire(this.player, target, stats);
                // v0.30: 分离激光和普通子弹
                let hasLaser = false;
                for (const f of fired) {
                    if (f.isLaser) {
                        hasLaser = true;
                        // 激光添加到激光效果列表
                        if (!this.playerLasers) this.playerLasers = [];
                        this.playerLasers.push({
                            x: this.player.x,
                            y: this.player.y,
                            angle: Math.atan2(target.y - this.player.y, target.x - this.player.x),
                            target: target,
                            dmg: f.dmg,
                            color: f.color,
                            width: f.width * 1.5, // 玩家激光比配置更粗
                            range: f.range,
                            life: w.cfg.cd * 0.8, // 激光持续时间为CD的80%
                            maxLife: w.cfg.cd * 0.8,
                            isSuper: f.isSuper,
                            owner: 'player',
                            hits: new Set(), // 本帧已击中的敌人
                            hitCooldowns: new Map() // 持续伤害冷却
                        });
                    } else {
                        this.bullets.push(f);
                    }
                }
                // v0.30: 激光播放laser音效，其他播放shoot音效
                this.sounds.play(hasLaser ? 'laser' : 'shoot');
            }
        }
        
        // 子弹边界检查（大房间）
        const roomW = SURVIVOR_CONFIG.ROOM_WIDTH;
        const roomH = SURVIVOR_CONFIG.ROOM_HEIGHT;
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            
            if (b.x < 0 || b.x > roomW || b.y < 0 || b.y > roomH) {
                this.bullets.splice(i, 1);
                continue;
            }
            
            if (b.homing && b.target && activeEnemies.includes(b.target)) {
                const dx = b.target.x - b.x;
                const dy = b.target.y - b.y;
                const d = Math.sqrt(dx*dx + dy*dy);
                if (d > 0) {
                    const targetAngle = Math.atan2(dy, dx);
                    const currentAngle = Math.atan2(b.vy, b.vx);
                    let angleDiff = targetAngle - currentAngle;
                    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
                    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
                    const turnRate = 3 * dt;
                    const newAngle = currentAngle + Math.max(-turnRate, Math.min(turnRate, angleDiff));
                    const spd = Math.sqrt(b.vx*b.vx + b.vy*b.vy);
                    b.vx = Math.cos(newAngle) * spd;
                    b.vy = Math.sin(newAngle) * spd;
                }
            }
            
            // 拖尾效果
            if (b.type !== 'melee' && Math.random() < 0.3) {
                this.particles.trail(b.x, b.y, b.color || '#ff0', 2);
            }
            
            b.x += b.vx * dt; b.y += b.vy * dt; b.life -= dt;
            
            if (b.life <= 0) { this.bullets.splice(i, 1); continue; }
            
            let hit = false;
            // 使用空间网格优化碰撞检测
            const nearbyEnemies = this.spatialGrid.getNearby(b.x, b.y);
            for (const e of nearbyEnemies) {
                if (e.hp <= 0) continue;
                if (dist(b.x, b.y, e.x, e.y) < 20 && !b.hits.has(e)) {
                    b.hits.add(e);
                    
                    // 计算总伤害
                    let totalDmg = b.dmg;
                    if (stats.fireDmg) totalDmg += stats.fireDmg;
                    if (stats.thunderDmg && Math.random() < 0.3) totalDmg += stats.thunderDmg;
                    
                    const killed = e.takeDamage(totalDmg, stats);
                    
                    if (stats.poisonDmg) e.applyPoison(stats.poisonDmg, 3);
                    if (stats.healOnHit) {
                        this.player.hp = Math.min(this.player.maxHp, this.player.hp + stats.healOnHit);
                    }
                    
                    if (killed) {
                        e.hp = 0; // 标记死亡
                        this.gems.push({ x: e.x, y: e.y, v: e.exp || 10, life: 30 });
                        // 金币直接加，不掉落
                        const goldAmount = e.gold || 5;
                        this.player.gold += goldAmount;
                        // 击杀爆炸效果
                        this.particles.explosion(e.x, e.y, e.color || '#f44', 25);
                        // 金币闪光
                        this.particles.sparkle(e.x, e.y - 10, '#fc0', 8);
                        
                        // 材料掉落
                        if (Math.random() < 0.15) {
                            const matTypes = Object.keys(MATERIALS);
                            const matType = randChoice(matTypes);
                            this.materials.add(matType, 1);
                            console.log(`获得材料: ${MATERIALS[matType].name}`);
                        }
                        
                        // 分数：击杀敌人
                        const enemyType = e.isBoss ? 'boss' : (e.elite || e.hp > 50) ? 'elite' : 'normal';
                        this.scoreManager.onKillEnemy(enemyType);
                        
                        this.particles.burst(e.x, e.y, e.color, 8);
                        this.sounds.play('kill');
                    } else {
                        this.sounds.play('hit');
                    }
                    if (b.pierce-- <= 0) { hit = true; break; }
                }
            }
            if (hit) this.bullets.splice(i, 1);
        }
        
        for (let i = this.gems.length - 1; i >= 0; i--) {
            const g = this.gems[i];
            const d = dist(g.x, g.y, this.player.x, this.player.y);
            if (d < stats.magnet) {
                g.x += (this.player.x - g.x) * 5 * dt;
                g.y += (this.player.y - g.y) * 5 * dt;
            }
            if (d < 20) {
                // 应用经验加成
                const expBonus = this.passives ? this.passives.getStats().expBonus : 0;
                const expGained = Math.floor(g.v * (1 + expBonus));
                this.player.exp += expGained;
                this.gems.splice(i, 1);
                
                // 播放拾取音效
                this.sounds.play('gem');
                
                // 检查升级
                if (this.player.exp >= this.player.lv * 100) {
                    this.player.exp -= this.player.lv * 100;
                    this.player.lv++;
                    this.sounds.play('levelup');
                    this.particles.burst(this.player.x, this.player.y, '#ff0', 20);
                    // 打开4选1升级界面
                    this.openLevelUpSelect();
                }
            }
        }
        
        // 金币直接加，无需拾取
        this.goldDrops = [];
        
        for (let i = this.curRoom.items.length - 1; i >= 0; i--) {
            const item = this.curRoom.items[i];
            if (!item || typeof item.x !== 'number' || typeof item.y !== 'number') {
                console.warn('⚠️ 无效的物品数据:', item);
                this.curRoom.items.splice(i, 1);
                continue;
            }
            const d = dist(item.x, item.y, this.player.x, this.player.y);
            
            if (d < 30) {
                if (item.type === 'weapon') {
                    // 吸血鬼幸存者风格：打开4选1升级选择界面
                    this.sounds.play('chest');
                    this.openLevelUpSelect();
                } else if (item.type === 'totem') {
                    if (this.totems.collect(item.totemId)) {
                        this.sounds.play('evolve');
                        this.particles.burst(item.x, item.y, '#ff0', 30);
                        const totem = TOTEMS[item.totemId];
                        if (totem.effect === 'maxHp') {
                            this.player.maxHp += totem.value;
                            this.player.hp += totem.value;
                        }
                    }
                } else if (item.type === 'stairs') {
                    // 进入下一层
                    this.sounds.play('portal');
                    this.goToNextFloor();
                } else {
                    this.sounds.play('buy');
                    this.items.add(item.id);
                }
                this.curRoom.items.splice(i, 1);
                this.particles.burst(item.x, item.y, '#ff0', 10);
                // 分数：拾取道具
                this.scoreManager.onCollectItem();
            }
        }
        
        this.particles.update(dt);
        this.damageNumbers.update(dt);
        
        // v0.30: 更新玩家激光
        this._updatePlayerLasers(dt);
        // v0.30: 更新宠物激光
        this._updatePetLasers(dt);
    }
    
    // v0.30: 绘制玩家激光
    _drawPlayerLasers() {
        if (!this.playerLasers || this.playerLasers.length === 0) return;
        
        for (const laser of this.playerLasers) {
            const start = this.camera.worldToScreen(laser.x, laser.y);
            const endX = laser.x + Math.cos(laser.angle) * laser.range;
            const endY = laser.y + Math.sin(laser.angle) * laser.range;
            const end = this.camera.worldToScreen(endX, endY);
            
            const alpha = laser.life / laser.maxLife;
            const width = laser.width * (laser.isSuper ? 1.3 : 1.0);
            
            this.ctx.save();
            
            // 外发光
            this.ctx.shadowBlur = 20 * alpha;
            this.ctx.shadowColor = laser.color;
            
            // 外圈光晕
            this.ctx.strokeStyle = laser.color;
            this.ctx.globalAlpha = alpha * 0.4;
            this.ctx.lineWidth = width * 2;
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
            this.ctx.moveTo(start.x, start.y);
            this.ctx.lineTo(end.x, end.y);
            this.ctx.stroke();
            
            // 中圈
            this.ctx.globalAlpha = alpha * 0.7;
            this.ctx.lineWidth = width;
            this.ctx.stroke();
            
            // 核心白线
            this.ctx.shadowBlur = 0;
            this.ctx.globalAlpha = alpha;
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = width * 0.4;
            this.ctx.stroke();
            
            this.ctx.restore();
        }
    }
    
    // v0.30: 绘制宠物激光
    _drawPetLasers() {
        if (!this.petLasers || this.petLasers.length === 0) return;
        
        for (const laser of this.petLasers) {
            const start = this.camera.worldToScreen(laser.x, laser.y);
            const endX = laser.x + Math.cos(laser.angle) * laser.range;
            const endY = laser.y + Math.sin(laser.angle) * laser.range;
            const end = this.camera.worldToScreen(endX, endY);
            
            const alpha = laser.life / laser.maxLife;
            
            this.ctx.save();
            
            // 外发光
            this.ctx.shadowBlur = 15 * alpha;
            this.ctx.shadowColor = laser.color;
            
            // 外圈
            this.ctx.strokeStyle = laser.color;
            this.ctx.globalAlpha = alpha * 0.5;
            this.ctx.lineWidth = laser.width * 1.5;
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
            this.ctx.moveTo(start.x, start.y);
            this.ctx.lineTo(end.x, end.y);
            this.ctx.stroke();
            
            // 核心
            this.ctx.globalAlpha = alpha * 0.9;
            this.ctx.lineWidth = laser.width * 0.5;
            this.ctx.stroke();
            
            this.ctx.restore();
        }
    }

    draw() {
        // 更新相机
        this.camera.update();
        
        // 使用 canvas 实际尺寸
        const canvasW = this.canvas.width;
        const canvasH = this.canvas.height;
        
        // 清空画布
        this.ctx.fillStyle = '#0d0d1a';
        this.ctx.fillRect(0, 0, canvasW, canvasH);
        
        // 保存上下文用于缩放
        this.ctx.save();
        if (this.camera.showFullRoom) {
            this.ctx.scale(this.camera.zoom, this.camera.zoom);
        }
        
        // 绘制房间（传入相机）
        this.curRoom.draw(this.ctx, this.camera);
        
        // 绘制掉落物（只绘制视野内的）
        // 金币直接加，无需绘制
        for (const g of this.gems) {
            if (!this.camera.isVisible(g.x, g.y, 20)) continue;
            const pos = this.camera.worldToScreen(g.x, g.y);
            this.ctx.fillStyle = '#48f';
            this.ctx.beginPath();
            this.ctx.moveTo(pos.x, pos.y - 5);
            this.ctx.lineTo(pos.x + 4, pos.y);
            this.ctx.lineTo(pos.x, pos.y + 5);
            this.ctx.lineTo(pos.x - 4, pos.y);
            this.ctx.fill();
        }
        
        // 绘制子弹（使用武器图标）
        for (const b of this.bullets) {
            if (!this.camera.isVisible(b.x, b.y, 20)) continue;
            const pos = this.camera.worldToScreen(b.x, b.y);
            
            if (b.icon && b.type !== 'melee') {
                // 使用emoji图标绘制子弹
                this.ctx.font = '16px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(b.icon, pos.x, pos.y);
            } else {
                // 近战或没有图标的用圆形
                this.ctx.fillStyle = b.color;
                this.ctx.beginPath();
                this.ctx.arc(pos.x, pos.y, b.type === 'melee' ? 15 : 6, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        
        // v0.30: 绘制玩家激光
        this._drawPlayerLasers();
        // v0.30: 绘制宠物激光
        this._drawPetLasers();
        
        for (const item of this.curRoom.items) {
            if (!this.camera.isVisible(item.x, item.y, 30)) continue;
            const pos = this.camera.worldToScreen(item.x, item.y);
            
            // 获取物品描述和图标
            let desc = '';
            let icon = item.icon;
            if (item.type === 'weapon') {
                // 武器箱显示问号，不透露具体武器
                icon = '❓';
                desc = '神秘武器|拾取后三选一';
            } else if (item.type === 'totem') {
                const t = TOTEMS[item.totemId];
                desc = t ? `${t.name}|${t.desc}` : '图腾';
            } else if (item.type === 'stairs') {
                // 楼梯特殊显示
                desc = '通往下一层';
                icon = '🕳️';
                
                // 绘制楼梯特殊效果（紫色发光圆圈）
                const pulse = Math.sin(Date.now() / 300) * 5;
                this.ctx.strokeStyle = 'rgba(160, 32, 240, 0.6)';
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.arc(pos.x, pos.y, 25 + pulse, 0, Math.PI * 2);
                this.ctx.stroke();
                
                this.ctx.fillStyle = 'rgba(160, 32, 240, 0.2)';
                this.ctx.beginPath();
                this.ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
                this.ctx.fill();
                
                // 绘制描述文字
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                this.ctx.fillRect(pos.x - 50, pos.y - 45, 100, 16);
                this.ctx.fillStyle = '#d0f';
                this.ctx.font = 'bold 11px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(desc, pos.x, pos.y - 33);
                
                // 绘制楼梯图标（更大）
                this.ctx.font = '32px Arial';
                this.ctx.fillText(icon, pos.x, pos.y + 10);
                continue; // 楼梯绘制完成，跳过通用绘制
            } else {
                const itemData = ITEMS[item.id];
                desc = itemData ? `${itemData.name}|${itemData.desc}` : '道具';
            }
            
            // 绘制描述文字（物品上方）
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(pos.x - 60, pos.y - 35, 120, 14);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(desc.substring(0, 20), pos.x, pos.y - 25);
            
            // 绘制物品图标
            this.ctx.fillStyle = item.type === 'weapon' ? '#f80' : '#ff0';
            this.ctx.font = '20px Arial';
            this.ctx.fillText(icon, pos.x, pos.y + 5);
            
            this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.3)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(pos.x, pos.y, 15 + Math.sin(Date.now() / 200) * 3, 0, Math.PI * 2);
            this.ctx.stroke();
        }
        
        // 获取活跃敌人并更新空间网格
        const activeEnemies = this.curRoom.hordeManager ? this.curRoom.hordeManager.getActiveEnemies() : this.curRoom.enemies;
        this.spatialGrid.clear();
        for (const e of activeEnemies) {
            if (e.hp > 0) this.spatialGrid.insert(e);
        }
        
        // 绘制敌人（使用精灵图和动画）
        for (const e of activeEnemies) {
            if (!this.camera.isVisible(e.x, e.y, 30)) continue;
            // 使用Enemy类的draw方法，传入转换后的坐标
            const pos = this.camera.worldToScreen(e.x, e.y);
            this.ctx.save();
            this.ctx.translate(pos.x, pos.y);
            e.drawWithOffset(this.ctx, this.sprites);
            this.ctx.restore();
        }
        
        if (this.curRoom.type === 'shop' && this.curRoom.npc) {
            const npc = this.curRoom.npc;
            if (this.camera.isVisible(npc.x, npc.y, 40)) {
                const pos = this.camera.worldToScreen(npc.x, npc.y);
                const d = dist(this.player.x, this.player.y, npc.x, npc.y);
                // 简化的NPC绘制
                this.ctx.fillStyle = '#4a4';
                this.ctx.beginPath();
                this.ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '16px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('🦯', pos.x, pos.y + 5);
                if (d < 80 && !this.shopOpen) {
                    this.ctx.fillStyle = '#4f4';
                    this.ctx.fillText('按E交互', pos.x, pos.y - 30);
                }
            }
        }
        
        // 玩家屏幕坐标
        const playerScreen = this.camera.worldToScreen(this.player.x, this.player.y);
        
        // 绘制冲刺残影
        for (const trail of this.player.dashTrail) {
            const trailScreen = this.camera.worldToScreen(trail.x, trail.y);
            this.ctx.globalAlpha = trail.alpha * 0.4;
            this.ctx.fillStyle = '#88ccff';
            this.ctx.beginPath();
            this.ctx.arc(trailScreen.x, trailScreen.y, 12, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;
        
        // 绘制玩家（带动画）
        // 计算行走动画
        if (this.player.isMoving && !this.player.isDashing) {
            this.player.walkCycle = (this.player.walkCycle || 0) + 0.15;
        } else {
            this.player.walkCycle = 0;
        }
        
        const walkPhase = Math.sin(this.player.walkCycle);
        const walkBob = Math.abs(Math.sin(this.player.walkCycle * 0.5)) * -4; // 行走时的上下颠簸
        const breathY = Math.sin(Date.now() / 300) * 1; // 呼吸动画
        const wobble = this.player.isMoving ? walkPhase * 3 : 0; // 左右轻微摇摆
        
        const totalScreenY = playerScreen.y + (this.player.jumpY || 0) + breathY + walkBob;
        
        const playerSprite = this.sprites.get('player');
        this.ctx.save();
        this.ctx.translate(playerScreen.x, totalScreenY);
        
        // 面向方向翻转
        if (!this.player.facingRight) this.ctx.scale(-1, 1);
        
        // 行走时的身体倾斜
        if (this.player.isMoving && !this.player.isDashing) {
            this.ctx.rotate(walkPhase * 0.05);
        }
        
        if (playerSprite) {
            // 使用精灵图绘制角色（放大一倍以匹配敌人尺寸）
            // 精灵图自带腿部，不需要额外绘制
            this.ctx.drawImage(playerSprite, -32, -32, 64, 64);
        } else {
            // 程序化绘制牛牛（带行走动画）
            // 身体上下动
            const bodyY = breathY + walkBob * 0.5;
            
            // 身体
            this.ctx.fillStyle = '#e8e8e8';
            this.ctx.beginPath();
            this.ctx.ellipse(0, bodyY, 26, 20, 0, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 头部轻微摆动
            const headBob = Math.sin(this.player.walkCycle * 0.5) * 2;
            // 眼睛
            this.ctx.fillStyle = '#333';
            this.ctx.beginPath();
            this.ctx.arc(20, -12 + bodyY + headBob, 3, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 牛角
            this.ctx.fillStyle = '#666';
            this.ctx.beginPath();
            this.ctx.moveTo(15, -25 + bodyY);
            this.ctx.lineTo(20, -35 + bodyY);
            this.ctx.lineTo(25, -25 + bodyY);
            this.ctx.fill();
        }
        
        this.ctx.restore();
        
        // 冲刺特效
        if (this.player.isDashing) {
            this.ctx.strokeStyle = 'rgba(100, 200, 255, 0.6)';
            this.ctx.lineWidth = 2;
            const dir = this.player.facingRight ? 1 : -1;
            for (let i = 0; i < 3; i++) {
                const offset = (Date.now() / 30 + i * 15) % 25;
                this.ctx.beginPath();
                this.ctx.moveTo(playerScreen.x - dir * (15 + offset), totalScreenY - 10 + i * 8);
                this.ctx.lineTo(playerScreen.x - dir * (25 + offset), totalScreenY - 10 + i * 8);
                this.ctx.stroke();
            }
        }
        
        this.particles.draw(this.ctx);
        this.damageNumbers.draw(this.ctx);
        
        if (this.transition.active) {
            const alpha = Math.sin(this.transition.timer / 0.3 * Math.PI);
            this.ctx.fillStyle = `rgba(0,0,0,${alpha})`;
            this.ctx.fillRect(0, 0, 900, 600);
        }
        
        // 商店UI
        if (this.shopOpen) {
            this.drawShopUI();
        }
        
        // 4选1升级选择UI
        if (this.levelUpOpen) {
            this.drawLevelUpUI();
        }
        
        // 恢复上下文
        this.ctx.restore();
        
        // 暂停界面（在屏幕坐标系上绘制）
        if (this.paused) {
            this.drawPauseScreen();
        }
        
        // 更新侧边面板
        this.updateSidePanels();
        
        this.drawUI();
    }
    
    drawShopUI() {
        const ctx = this.ctx;
        const canvas = ctx.canvas;
        const cw = canvas.width || 900;
        const ch = canvas.height || 600;
        const centerX = cw / 2;
        const centerY = ch / 2;
        
        const boxWidth = 500;
        const boxHeight = 350;
        const boxX = centerX - boxWidth / 2;
        const boxY = centerY - boxHeight / 2;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        ctx.strokeStyle = '#4a4';
        ctx.lineWidth = 3;
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
        
        ctx.fillStyle = '#4f4';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🦯 盲眼的商店 👁️', centerX, boxY + 40);
        
        ctx.fillStyle = '#fc0';
        ctx.font = '18px Arial';
        ctx.fillText(`💰 ${this.player.gold}`, centerX, boxY + 70);
        
        const itemWidth = 130;
        const itemHeight = 160;
        const startX = centerX - (this.shopItems.length * itemWidth) / 2 + itemWidth / 2;
        
        this.shopItems.forEach((item, i) => {
            const ix = startX + i * (itemWidth + 20);
            const iy = boxY + 160;
            
            ctx.fillStyle = '#1a1a2e';
            ctx.fillRect(ix - itemWidth/2, iy - itemHeight/2, itemWidth, itemHeight);
            ctx.strokeStyle = this.player.gold >= item.price ? '#4a4' : '#a44';
            ctx.lineWidth = 2;
            ctx.strokeRect(ix - itemWidth/2, iy - itemHeight/2, itemWidth, itemHeight);
            
            ctx.font = '48px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(item.icon, ix, iy - 20);
            
            ctx.fillStyle = '#fff';
            ctx.font = '14px Arial';
            ctx.fillText(item.name, ix, iy + 15);
            
            ctx.fillStyle = '#aaa';
            ctx.font = '11px Arial';
            ctx.fillText(item.desc, ix, iy + 35);
            
            ctx.fillStyle = this.player.gold >= item.price ? '#fc0' : '#f44';
            ctx.font = 'bold 16px Arial';
            ctx.fillText(`💰${item.price}`, ix, iy + 60);
            
            ctx.fillStyle = '#666';
            ctx.font = '12px Arial';
            ctx.fillText(`[${i + 1}]`, ix, iy + 80);
        });
        
        ctx.fillStyle = '#888';
        ctx.font = '14px Arial';
        ctx.fillText('按 1-3 购买 | 按 E 关闭', centerX, boxY + boxHeight - 20);
    }
    
    drawLevelUpUI() {
        const ctx = this.ctx;
        const boxWidth = 640;
        const boxHeight = 460;
        const boxX = (ctx.canvas.width || 900) / 2 - boxWidth / 2;
        const boxY = (ctx.canvas.height || 600) / 2 - boxHeight / 2;
        const centerX = (ctx.canvas.width || 900) / 2;
        
        // 深色背景
        ctx.fillStyle = 'rgba(10, 10, 20, 0.98)';
        ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        // 金色边框
        ctx.strokeStyle = '#fa0';
        ctx.lineWidth = 4;
        ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);
        // 内边框
        ctx.strokeStyle = '#840';
        ctx.lineWidth = 2;
        ctx.strokeRect(boxX + 4, boxY + 4, boxWidth - 8, boxHeight - 8);
        
        // 标题背景条
        ctx.fillStyle = 'rgba(250, 160, 0, 0.2)';
        ctx.fillRect(boxX, boxY, boxWidth, 50);
        
        // 标题
        ctx.fillStyle = '#ff0';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⭐ 升级！选择一项 ⭐', centerX, boxY + 38);
        
        // 计算卡片布局 - 填满整个框
        const padding = 20; // 内边距
        const bottomBarHeight = 40; // 底部提示栏高度
        const contentWidth = boxWidth - padding * 2;
        const contentHeight = boxHeight - 50 - bottomBarHeight; // 减去标题和底部栏
        const gapX = 20; // 卡片横向间距
        const gapY = 20; // 卡片纵向间距
        
        // 2x2网格布局
        const cardWidth = (contentWidth - gapX) / 2;
        const cardHeight = (contentHeight - gapY) / 2;
        const startX = boxX + padding;
        const startY = boxY + 55; // 标题下方
        
        this.levelUpOptions.forEach((option, i) => {
            const row = Math.floor(i / 2);
            const col = i % 2;
            const cardX = startX + col * (cardWidth + gapX);
            const cardY = startY + row * (cardHeight + gapY);
            
            const isWeapon = option.type === 'weapon';
            const borderColor = isWeapon ? '#48f' : '#4f4';
            const bgColor = isWeapon ? 'rgba(30, 40, 80, 0.9)' : 'rgba(30, 60, 40, 0.9)';
            
            // 卡片背景
            ctx.fillStyle = bgColor;
            ctx.fillRect(cardX, cardY, cardWidth, cardHeight);
            
            // 卡片边框
            ctx.strokeStyle = borderColor;
            ctx.lineWidth = 3;
            ctx.strokeRect(cardX, cardY, cardWidth, cardHeight);
            
            // 顶部类型条
            const headerHeight = Math.max(28, cardHeight * 0.15);
            ctx.fillStyle = borderColor;
            ctx.fillRect(cardX, cardY, cardWidth, headerHeight);
            
            // 类型标签
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${Math.max(13, cardHeight * 0.08)}px Arial`;
            ctx.textAlign = 'left';
            ctx.fillText(isWeapon ? '🔫 武器' : '📦 被动', cardX + 12, cardY + headerHeight * 0.6);
            
            // 按键提示（右上角）
            ctx.fillStyle = 'rgba(0,0,0,0.4)';
            ctx.fillRect(cardX + cardWidth - 40, cardY, 40, headerHeight);
            ctx.fillStyle = '#ff0';
            ctx.font = `bold ${Math.max(15, cardHeight * 0.09)}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText(`[${i + 1}]`, cardX + cardWidth - 20, cardY + headerHeight * 0.6);
            
            // 计算内容区域
            const contentY = cardY + headerHeight;
            const contentH = cardHeight - headerHeight;
            const centerX = cardX + cardWidth / 2;
            
            // 图标（居中偏上）
            ctx.font = `${Math.max(40, cardHeight * 0.22)}px Arial`;
            ctx.textAlign = 'center';
            ctx.fillText(option.data.icon, centerX, contentY + contentH * 0.35);
            
            // 名称
            ctx.fillStyle = '#fff';
            ctx.font = `bold ${Math.max(16, cardHeight * 0.09)}px Arial`;
            ctx.fillText(option.data.name, centerX, contentY + contentH * 0.55);
            
            // 等级/描述区域
            const infoY = contentY + contentH * 0.7;
            if (isWeapon) {
                if (option.isNew) {
                    ctx.fillStyle = '#4f4';
                    ctx.font = `bold ${Math.max(14, cardHeight * 0.08)}px Arial`;
                    ctx.fillText('[新武器]', centerX, infoY);
                } else {
                    ctx.fillStyle = '#f0f';
                    ctx.font = `bold ${Math.max(14, cardHeight * 0.08)}px Arial`;
                    ctx.fillText(`Lv.${option.level}/${option.maxLevel}`, centerX, infoY);
                }
                // 武器属性
                ctx.fillStyle = '#ccc';
                ctx.font = `${Math.max(12, cardHeight * 0.07)}px Arial`;
                ctx.fillText(`伤害${option.data.dmg} 冷却${option.data.cd}s`, centerX, contentY + contentH * 0.85);
            } else {
                // 被动等级
                ctx.fillStyle = '#0ff';
                ctx.font = `bold ${Math.max(14, cardHeight * 0.08)}px Arial`;
                ctx.fillText(`Lv.${option.level}/${option.maxLevel}`, centerX, infoY);
                // 被动描述
                ctx.fillStyle = '#ccc';
                ctx.font = `${Math.max(12, cardHeight * 0.07)}px Arial`;
                // 截短描述以适应空间
                let desc = option.data.desc;
                if (desc.length > 12) desc = desc.substring(0, 11) + '…';
                ctx.fillText(desc, centerX, contentY + contentH * 0.85);
            }
        });
        
        // 底部提示
        ctx.fillStyle = 'rgba(100, 100, 100, 0.8)';
        ctx.fillRect(boxX, boxY + boxHeight - bottomBarHeight, boxWidth, bottomBarHeight);
        ctx.fillStyle = '#ff0';
        ctx.font = 'bold 15px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('按 1-4 选择 | 武器满级 + 对应被动 = 合成超武', centerX, boxY + boxHeight - 14);
    }

    drawUI() {
        // 游戏结算画面
        if (this.showResultScreen && this.gameResultData) {
            this.drawResultScreen();
            return;
        }
        
        // 游戏结束/胜利触发
        if (this.state === 'gameover' && this.scoreManager.isPlaying) {
            this.endGame('dead');
        }
        if (this.state === 'victory' && this.scoreManager.isPlaying) {
            this.sounds.play('victory');
            this.endGame('cleared');
        }
    }
    
    // 绘制游戏结算画面
    drawResultScreen() {
        const ctx = this.ctx;
        const data = this.gameResultData;
        const isVictory = this.gameResult === 'cleared';
        const isDead = this.gameResult === 'dead';
        
        // 获取实际canvas尺寸（适配动态大小）
        const canvas = this.canvas;
        const cw = canvas.width;
        const ch = canvas.height;
        const centerX = cw / 2;
        const centerY = ch / 2;
        
        // 深色背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.95)';
        ctx.fillRect(0, 0, cw, ch);
        
        // 标题
        ctx.textAlign = 'center';
        if (isVictory) {
            ctx.fillStyle = '#4f4';
            ctx.font = 'bold 56px Arial';
            ctx.fillText('🎉 通关胜利! 🎉', centerX, ch * 0.13);
        } else if (isDead) {
            ctx.fillStyle = '#f44';
            ctx.font = 'bold 56px Arial';
            ctx.fillText('💀 你阵亡了 💀', centerX, ch * 0.13);
        } else {
            ctx.fillStyle = '#fa0';
            ctx.font = 'bold 56px Arial';
            ctx.fillText('🏁 游戏结束 🏁', centerX, ch * 0.13);
        }
        
        // 统计面板背景（居中，宽度适应）
        const panelW = Math.min(500, cw - 40);
        const panelH = Math.min(380, ch - 150);
        const panelX = (cw - panelW) / 2;
        const panelY = ch * 0.18;
        
        ctx.fillStyle = 'rgba(20, 20, 40, 0.9)';
        ctx.fillRect(panelX, panelY, panelW, panelH);
        ctx.strokeStyle = isVictory ? '#4f4' : isDead ? '#f44' : '#fa0';
        ctx.lineWidth = 3;
        ctx.strokeRect(panelX, panelY, panelW, panelH);
        
        // 统计标题
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('📊 最终统计', centerX, panelY + 35);
        
        // 分隔线
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(panelX + 30, panelY + 50);
        ctx.lineTo(panelX + panelW - 30, panelY + 50);
        ctx.stroke();
        
        // 统计数据
        ctx.font = '20px Arial';
        ctx.textAlign = 'left';
        const stats = [
            { label: '💯 最终分数', value: data.finalScore.toLocaleString(), color: '#ff0' },
            { label: '⚔️ 击杀敌人', value: data.stats.enemiesKilled, color: '#fff' },
            { label: '🚪 探索房间', value: data.stats.roomsExplored, color: '#fff' },
            { label: '💰 获得金币', value: this.player.gold, color: '#fc0' },
            { label: '📍 到达层数', value: `${this.currentFloor}/6`, color: '#fff' },
            { label: '⭐ 最高等级', value: `Lv.${this.player.lv}`, color: '#0ff' }
        ];
        
        const rowHeight = Math.min(45, (panelH - 80) / stats.length);
        const startY = panelY + 90;
        
        stats.forEach((stat, i) => {
            const y = startY + i * rowHeight;
            ctx.fillStyle = '#aaa';
            ctx.fillText(stat.label, panelX + 50, y);
            ctx.fillStyle = stat.color;
            ctx.textAlign = 'right';
            ctx.fillText(String(stat.value), panelX + panelW - 50, y);
            ctx.textAlign = 'left';
        });
        
        // 返回按钮（保存坐标供点击检测使用）
        const btnW = 200;
        const btnH = 50;
        const btnX = centerX - btnW / 2;
        const btnY = panelY + panelH + 20;
        
        // 保存按钮坐标供handleClick使用
        this.resultBtnRect = { x: btnX, y: btnY, w: btnW, h: btnH };
        
        // 按钮背景
        ctx.fillStyle = '#2a2a4a';
        ctx.fillRect(btnX, btnY, btnW, btnH);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(btnX, btnY, btnW, btnH);
        
        // 按钮文字
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 22px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('↩ 返回主菜单', centerX, btnY + 33);
        
        // 提示
        ctx.fillStyle = '#888';
        ctx.font = '14px Arial';
        ctx.fillText('点击按钮或按空格键返回', centerX, btnY + btnH + 30);
    }
    
    // 以撒风格小地图（在右侧边栏显示）
    // 已访问房间=实心，未访问房间=轮廓
    updateMiniMap() {
        const canvas = document.getElementById('miniMapCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const size = 220;
        
        // 清空并填充背景
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(0, 0, size, size);
        
        if (!this.allRooms || this.allRooms.size === 0) {
            console.warn('小地图: allRooms为空');
            return;
        }
        
        const rooms = Array.from(this.allRooms.values());
        
        // 计算地图范围
        let minX = 0, maxX = 0, minY = 0, maxY = 0;
        for (const r of rooms) {
            minX = Math.min(minX, r.gx);
            maxX = Math.max(maxX, r.gx);
            minY = Math.min(minY, r.gy);
            maxY = Math.max(maxY, r.gy);
        }
        
        const width = maxX - minX + 1;
        const height = maxY - minY + 1;
        const padding = 20;
        const cellSize = Math.min((size - padding * 2) / width, (size - padding * 2) / height);
        const mapPixelW = width * cellSize;
        const mapPixelH = height * cellSize;
        const offsetX = (size - mapPixelW) / 2;
        const offsetY = (size - mapPixelH) / 2;
        
        // 绘制房间
        for (const r of rooms) {
            const rx = offsetX + (r.gx - minX) * cellSize + 2;
            const ry = offsetY + (r.gy - minY) * cellSize + 2;
            const rw = cellSize - 4;
            
            // 未访问的房间只绘制轮廓（以撒风格）
            if (r.visited) {
                switch(r.type) {
                    case 'start': ctx.fillStyle = '#4f4'; break;
                    case 'boss': ctx.fillStyle = '#f44'; break;
                    case 'treasure': ctx.fillStyle = '#fa0'; break;
                    case 'shop': ctx.fillStyle = '#48f'; break;
                    default: ctx.fillStyle = '#ccc';
                }
                ctx.fillRect(rx, ry, rw, rw);
            } else {
                ctx.strokeStyle = '#555';
                ctx.lineWidth = 1.5;
                ctx.strokeRect(rx, ry, rw, rw);
            }
            
            // 当前房间高亮
            if (r === this.curRoom) {
                ctx.strokeStyle = '#ff0';
                ctx.lineWidth = 3;
                ctx.strokeRect(rx - 2, ry - 2, rw + 4, rw + 4);
            }
        }
    }
    
    spawnRoomReward() {
        const roll = Math.random();
        if (this.curRoom.type === 'boss') {
            this.spawnWeaponPickup();
        } else if (this.curRoom.type === 'treasure') {
            this.spawnItemPickup();
        } else if (roll < 0.3) {
            this.spawnItemPickup();
        } else if (roll < 0.5) {
            this.spawnWeaponPickup();
        }
    }
    
    spawnItemPickup() {
        const itemId = randInt(1, 16);
        const item = ITEMS[itemId];
        if (!item) return;
        this.curRoom.items.push({ x: this.curRoom.centerX, y: this.curRoom.centerY, id: itemId, icon: item.icon, name: item.name });
    }
    
    spawnWeaponPickup() {
        // 武器箱不显示具体武器，用问号表示
        this.curRoom.items.push({
            x: this.curRoom.centerX, y: this.curRoom.centerY,
            type: 'weapon', icon: '❓', name: '神秘武器'
        });
    }
    
    spawnTotemPickup() {
        const totemId = randInt(1, 8);
        const totem = TOTEMS[totemId];
        if (!totem) return;
        this.curRoom.items.push({
            x: this.curRoom.centerX, y: this.curRoom.centerY,
            type: 'totem', totemId: totemId,
            icon: totem.icon, name: totem.name
        });
    }
    
    // 生成通往下一层的楼梯（Boss房清理后调用）
    spawnStairs() {
        // 在房间下方生成楼梯
        this.curRoom.items.push({
            x: this.curRoom.centerX,
            y: this.curRoom.height - 120,
            type: 'stairs',
            icon: '🕳️',
            name: '通往下一层'
        });
        console.log('🕳️ 通往下一层的楼梯已出现');
    }
    
    // 进入下一层
    goToNextFloor() {
        if (this.currentFloor >= this.maxFloors) {
            console.log('🏆 已到达最深层！');
            this.endGame('cleared');
            return;
        }
        
        this.currentFloor++;
        console.log(`⬇️ 进入第 ${this.currentFloor} 层`);
        
        // 清理当前游戏实体
        this.bullets = [];
        this.particles = new ParticleSystem();
        this.gems = [];
        this.goldDrops = [];
        
        // 重新生成地图
        const gen = new MapGenerator();
        const map = gen.generate(this.currentFloor);
        this.curRoom = map.start;
        this.allRooms = map.rooms;
        this.curRoom.visited = true;
        this.allFloors.set(this.currentFloor, { start: map.start, rooms: map.rooms });
        
        // 确保新房间的 items 数组有效
        if (!this.curRoom.items) {
            this.curRoom.items = [];
        }
        
        // 传送玩家到新地图起点
        this.player.x = this.curRoom.centerX;
        this.player.y = this.curRoom.centerY;
        
        // 恢复一些生命值（每层恢复1点）
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 1);
        
        // 分数：进入新层
        this.scoreManager.onEnterFloor(this.currentFloor);
        
        // 更新UI
        this.updateScoreDisplay();
        
        // 特效
        this.particles.burst(this.player.x, this.player.y, '#4f4', 30);
    }

    // 存档系统（第5次迭代）
    saveGame() {
        try {
            const saveData = {
                player: {
                    hp: this.player.hp,
                    maxHp: this.player.maxHp,
                    exp: this.player.exp,
                    lv: this.player.lv,
                    gold: this.player.gold
                },
                items: this.items.owned,
                weapons: this.weapons.map(w => ({ key: w.baseKey, level: w.level, evolution: w.evolution })),
                currentFloor: this.currentFloor,
                timestamp: Date.now()
            };
            localStorage.setItem('rougecow_save', JSON.stringify(saveData));
            console.log('💾 游戏已存档');
            return true;
        } catch (e) {
            console.error('存档失败:', e);
            return false;
        }
    }
    
    loadGame() {
        try {
            const saveData = localStorage.getItem('rougecow_save');
            if (!saveData) return false;
            
            const data = JSON.parse(saveData);
            
            // 恢复玩家数据
            Object.assign(this.player, data.player);
            
            // 恢复道具
            this.items.owned = data.items || {};
            this.items.dirty = true;
            
            // 恢复武器
            if (data.weapons && data.weapons.length > 0) {
                this.weapons = data.weapons.map(w => new Weapon(w.key, w.level, w.evolution));
            }
            
            // 恢复层数
            this.currentFloor = data.currentFloor || 1;
            
            console.log('📂 游戏已加载');
            return true;
        } catch (e) {
            console.error('读档失败:', e);
            return false;
        }
    }
    
    hasSave() {
        return !!localStorage.getItem('rougecow_save');
    }
    
    deleteSave() {
        localStorage.removeItem('rougecow_save');
        console.log('🗑️ 存档已删除');
    }

    loop(t) {
        const dt = Math.min((t - (this.lastT || t)) / 1000, 0.1) * this.timeScale;
        this.lastT = t;
        
        // 更新性能监控
        this.perfMonitor.update();
        
        if (this.state === 'playing' || this.transition.active) {
            this.update(dt);
        }
        this.draw();
        
        // 绘制性能监控
        this.perfMonitor.draw(this.ctx, 10, 10);
        
        // 更新分数显示
        if (this.state === 'playing' && this.scoreManager.isPlaying) {
            this.updateScoreDisplay();
        }
        
        this.rafId = requestAnimationFrame(t => this.loop(t));
    }
}

// 启动
window.onload = () => {
    const game = new Game();
    setTimeout(() => game.start(), 500);
    
    // 自动测试：重开游戏后能否攻击
    if (window.location.search.includes('test=restart')) {
        setTimeout(() => window.runRestartAttackTest(), 3000);
    }
};

// 自动测试函数
window.runRestartAttackTest = async function() {
    console.log('🧪 ========== 自动测试：重开游戏后能否攻击 ==========');
    const game = window.game;
    
    function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
    function getBullets() { return game.bullets.length; }
    
    // 第一轮游戏
    console.log('\n🧪 第一轮游戏（5倍速）');
    game.setSpeed(5);
    await sleep(2000);
    const b1 = getBullets();
    console.log(`🧪 初始子弹: ${b1}`);
    await sleep(5000);
    const b2 = getBullets();
    console.log(`🧪 5秒后子弹: ${b2}`);
    console.log(b2 > b1 ? '✅ 第一轮可以攻击' : '⚠️ 第一轮无攻击');
    
    // 结束游戏
    console.log('\n🧪 结束游戏');
    game.state = 'gameover';
    game.endGame('dead');
    await sleep(1500);
    
    // 返回主菜单
    console.log('\n🧪 返回主菜单');
    game.returnToMainMenu();
    await sleep(1500);
    
    // 第二轮游戏
    console.log('\n🧪 第二轮游戏（重开）');
    document.getElementById('startGameBtn').click();
    await sleep(2000);
    
    const status = {
        timeScale: game.timeScale,
        lastT: game.lastT,
        weaponCd: game.weapons[0]?.cd
    };
    console.log('🧪 状态:', status);
    
    const b3 = getBullets();
    console.log(`🧪 初始子弹: ${b3}`);
    await sleep(5000);
    const b4 = getBullets();
    console.log(`🧪 5秒后子弹: ${b4}`);
    
    // 结果
    console.log('\n🧪 ========== 测试结果 ==========');
    if (b4 > b3) {
        console.log('✅ 测试通过：重开游戏后可以攻击！');
        document.body.style.background = '#0f4'; // 绿色背景表示通过
    } else {
        console.log('❌ 测试失败：重开游戏后不能攻击！');
        console.log(`   timeScale=${status.timeScale}, lastT=${status.lastT}, cd=${status.weaponCd}`);
        document.body.style.background = '#f04'; // 红色背景表示失败
    }
};
