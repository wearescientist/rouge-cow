/**
 * 肉鸽牛牛 - 精灵管理系统
 * 加载和管理所有角色/敌人精灵
 */

// ==================== 精灵配置 ====================
const SPRITE_CONFIG = {
    // 主角
    player: {
        id: 'player_cow',
        name: '牛牛',
        src: 'assets/sprites/player_cow.png',
        width: 32,
        height: 32,
        animations: {
            idle: { frames: [0], speed: 0 },
            walk: { frames: [0], speed: 0.1 },
            fly: { frames: [0], speed: 0.05 }
        }
    },

    // 敌人配置 - 按难度分级
    enemies: {
        // Tier 1: 弱小敌人 (血量低,速度慢)
        tier1: [
            { id: 'chick', name: '感染小鸡', hp: 8, speed: 40, damage: 1, exp: 2 },
            { id: 'mouse', name: '感染老鼠', hp: 6, speed: 60, damage: 1, exp: 2 },
            { id: 'snail', name: '感染蜗牛', hp: 15, speed: 15, damage: 1, exp: 1 },
        ],
        // Tier 2: 普通敌人
        tier2: [
            { id: 'rabbit', name: '感染兔子', hp: 15, speed: 50, damage: 2, exp: 3 },
            { id: 'rabbit2', name: '狂暴兔子', hp: 18, speed: 65, damage: 2, exp: 4 },
            { id: 'chick', name: '感染小鸡', hp: 10, speed: 45, damage: 1, exp: 2 },
            { id: 'bird', name: '感染小鸟', hp: 12, speed: 70, damage: 2, exp: 3 },
            { id: 'pigeon', name: '感染鸽子', hp: 14, speed: 55, damage: 2, exp: 3 },
        ],
        // Tier 3: 标准敌人
        tier3: [
            { id: 'cat', name: '感染猫咪', hp: 25, speed: 55, damage: 3, exp: 5 },
            { id: 'duck', name: '感染鸭子', hp: 22, speed: 45, damage: 3, exp: 4 },
            { id: 'duck2', name: '感染野鸭', hp: 25, speed: 50, damage: 3, exp: 5 },
            { id: 'duck3', name: '狂暴鸭子', hp: 28, speed: 55, damage: 4, exp: 6 },
            { id: 'squirrel', name: '感染松鼠', hp: 20, speed: 75, damage: 3, exp: 5 },
        ],
        // Tier 4: 较强敌人
        tier4: [
            { id: 'dog', name: '感染小狗', hp: 35, speed: 60, damage: 4, exp: 7 },
            { id: 'dog2', name: '狂暴狗', hp: 40, speed: 70, damage: 5, exp: 8 },
            { id: 'pig', name: '感染小猪', hp: 45, speed: 35, damage: 4, exp: 8 },
            { id: 'pig2', name: '狂暴猪', hp: 50, speed: 40, damage: 5, exp: 9 },
            { id: 'enemy_pig_original', name: '原始感染猪', hp: 40, speed: 38, damage: 4, exp: 7 },
            { id: 'sheep', name: '感染绵羊', hp: 38, speed: 40, damage: 4, exp: 6 },
        ],
        // Tier 5: 精英敌人
        tier5: [
            { id: 'goose', name: '感染鹅', hp: 55, speed: 65, damage: 6, exp: 12 },
            { id: 'bear', name: '感染熊', hp: 70, speed: 35, damage: 8, exp: 15 },
            { id: 'snake', name: '感染蛇', hp: 30, speed: 80, damage: 5, exp: 10 },
        ],
        // Tier 6: Boss级
        tier6: [
            { id: 'crab', name: '感染螃蟹', hp: 100, speed: 25, damage: 10, exp: 25 },
            { id: 'turtle', name: '感染龟', hp: 120, speed: 20, damage: 8, exp: 20 },
        ]
    }
};

// ==================== 精灵管理器 ====================
class SpriteManager {
    constructor() {
        this.sprites = new Map();
        this.loaded = false;
        this.loadQueue = [];
    }

    // 加载单个精灵
    loadSprite(id, src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.sprites.set(id, img);
                resolve(img);
            };
            img.onerror = () => {
                console.warn(`Failed to load sprite: ${src}`);
                reject(new Error(`Failed to load: ${src}`));
            };
            img.src = src;
        });
    }

    // 加载所有精灵
    async loadAll() {
        const promises = [];

        // 加载主角
        promises.push(
            this.loadSprite('player_cow', SPRITE_CONFIG.player.src)
                .catch(() => this.createFallbackSprite('player_cow', '🐮'))
        );

        // 加载所有敌人精灵
        const enemyIds = new Set();
        Object.values(SPRITE_CONFIG.enemies).forEach(tier => {
            tier.forEach(enemy => enemyIds.add(enemy.id));
        });

        enemyIds.forEach(id => {
            promises.push(
                this.loadSprite(id, `assets/sprites/${id}.png`)
                    .catch(() => this.createFallbackSprite(id, '👾'))
            );
        });

        await Promise.all(promises);
        this.loaded = true;
        console.log(`Loaded ${this.sprites.size} sprites`);
        return this.sprites;
    }

    // 创建备用精灵（当图片加载失败时使用Canvas绘制emoji）
    createFallbackSprite(id, emoji) {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        ctx.font = '28px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(emoji, 16, 18);
        
        const img = new Image();
        img.src = canvas.toDataURL();
        this.sprites.set(id, img);
        return img;
    }

    // 获取精灵
    get(id) {
        return this.sprites.get(id);
    }

    // 绘制精灵
    draw(ctx, id, x, y, options = {}) {
        const sprite = this.sprites.get(id);
        if (!sprite) return;

        const { 
            width = 32, 
            height = 32, 
            flipX = false, 
            rotation = 0,
            alpha = 1,
            tint = null
        } = options;

        ctx.save();
        ctx.globalAlpha = alpha;

        if (rotation !== 0 || flipX) {
            ctx.translate(x + width / 2, y + height / 2);
            if (flipX) ctx.scale(-1, 1);
            if (rotation !== 0) ctx.rotate(rotation);
            ctx.drawImage(sprite, -width / 2, -height / 2, width, height);
        } else {
            ctx.drawImage(sprite, x, y, width, height);
        }

        // 染色效果（用于显示受伤等）
        if (tint) {
            ctx.globalCompositeOperation = 'source-atop';
            ctx.fillStyle = tint;
            ctx.fillRect(x - width / 2, y - height / 2, width, height);
        }

        ctx.restore();
    }

    // 根据波数获取合适的敌人池
    getEnemyPoolForWave(wave) {
        const pools = [];
        
        // 根据波数解锁更高等级的敌人
        if (wave >= 1) pools.push(...SPRITE_CONFIG.enemies.tier1);
        if (wave >= 3) pools.push(...SPRITE_CONFIG.enemies.tier2);
        if (wave >= 5) pools.push(...SPRITE_CONFIG.enemies.tier3);
        if (wave >= 8) pools.push(...SPRITE_CONFIG.enemies.tier4);
        if (wave >= 12) pools.push(...SPRITE_CONFIG.enemies.tier5);
        if (wave >= 15) pools.push(...SPRITE_CONFIG.enemies.tier6);

        return pools;
    }

    // 生成随机敌人配置
    getRandomEnemy(wave) {
        const pool = this.getEnemyPoolForWave(wave);
        if (pool.length === 0) return SPRITE_CONFIG.enemies.tier1[0];
        
        // 波数越高，越容易出高级敌人
        const weights = pool.map((e, i) => {
            const tier = Math.floor(i / 4) + 1;
            return Math.min(wave / 5, 1) * tier;
        });
        
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < pool.length; i++) {
            random -= weights[i];
            if (random <= 0) return pool[i];
        }
        
        return pool[pool.length - 1];
    }

    // 获取Boss配置
    getBossForWave(wave) {
        const bosses = SPRITE_CONFIG.enemies.tier6;
        return bosses[Math.min(Math.floor(wave / 5), bosses.length - 1)];
    }
}

// ==================== 动画系统 ====================
class SpriteAnimator {
    constructor() {
        this.animations = new Map();
    }

    // 添加动画
    add(id, frames, speed = 0.1) {
        this.animations.set(id, {
            frames: frames,
            speed: speed,
            currentFrame: 0,
            timer: 0
        });
    }

    // 更新动画
    update(dt) {
        for (const anim of this.animations.values()) {
            anim.timer += dt;
            if (anim.timer >= anim.speed) {
                anim.timer = 0;
                anim.currentFrame = (anim.currentFrame + 1) % anim.frames.length;
            }
        }
    }

    // 获取当前帧
    getCurrentFrame(id) {
        const anim = this.animations.get(id);
        return anim ? anim.frames[anim.currentFrame] : 0;
    }
}

// ==================== 导出 ====================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SpriteManager, SpriteAnimator, SPRITE_CONFIG };
}
