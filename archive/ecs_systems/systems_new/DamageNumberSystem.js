/**
 * DamageNumberSystem - 伤害数字系统
 * 显示伤害数值、治疗数值、经验值等浮动文字
 */

class DamageNumberSystem {
    constructor(world) {
        this.world = world;
        this.priority = 150;
        this.enabled = true;
        
        // 数字池
        this.numbers = [];
        
        // 配置
        this.config = {
            gravity: -50,         // 上升速度（负值表示向上）
            fadeSpeed: 1,         // 淡出速度
            lifeTime: 1.5,        // 存在时间
            spread: 30,           // 水平扩散范围
            criticalScale: 1.5,   // 暴击放大倍数
            colors: {
                damage: '#f44',
                damageCrit: '#fa0',
                heal: '#4f4',
                exp: '#48f',
                gold: '#ffd700',
                text: '#fff'
            }
        };
        
        // 监听伤害事件
        this.setupEventListeners();
    }
    
    init() {}
    
    setupEventListeners() {
        // 监听伤害事件
        this.world.on('damageDealt', (data) => {
            this.spawnDamageNumber(
                data.target,
                data.damage,
                data.isCritical,
                data.damageType
            );
        });
        
        // 监听治疗事件
        this.world.on('healApplied', (data) => {
            this.spawnHealNumber(data.target, data.amount);
        });
        
        // 监听经验获得
        this.world.on('expGained', (data) => {
            this.spawnExpNumber(data.entity, data.amount);
        });
    }
    
    update(dt) {
        for (let i = this.numbers.length - 1; i >= 0; i--) {
            const num = this.numbers[i];
            
            // 更新位置
            num.x += num.vx * dt;
            num.y += num.vy * dt;
            num.vy += this.config.gravity * dt; // 重力（向上减速）
            
            // 更新生命周期
            num.life -= dt;
            num.alpha = Math.max(0, num.life / this.config.lifeTime);
            
            // 缩放动画
            if (num.life > this.config.lifeTime * 0.8) {
                // 入场放大
                const progress = 1 - (num.life - this.config.lifeTime * 0.8) / (this.config.lifeTime * 0.2);
                num.scale = 0.5 + progress * 0.5;
            } else if (num.life < this.config.lifeTime * 0.2) {
                // 出场缩小
                const progress = num.life / (this.config.lifeTime * 0.2);
                num.scale = 0.5 + progress * 0.5;
            }
            
            // 移除过期数字
            if (num.life <= 0) {
                this.numbers.splice(i, 1);
            }
        }
    }
    
    render(ctx) {
        ctx.save();
        
        for (const num of this.numbers) {
            ctx.save();
            
            // 设置透明度
            ctx.globalAlpha = num.alpha;
            
            // 设置缩放
            ctx.translate(num.x, num.y);
            ctx.scale(num.scale, num.scale);
            
            // 绘制文字阴影
            ctx.fillStyle = '#000';
            ctx.font = `bold ${num.size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(num.text, 2, 2);
            
            // 绘制文字
            ctx.fillStyle = num.color;
            ctx.fillText(num.text, 0, 0);
            
            // 暴击特效
            if (num.isCritical) {
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.strokeText(num.text, 0, 0);
            }
            
            ctx.restore();
        }
        
        ctx.restore();
    }
    
    /**
     * 生成伤害数字
     */
    spawnDamageNumber(target, damage, isCritical = false, type = 'normal') {
        const transform = target.get(TransformComponent);
        if (!transform) return;
        
        const x = transform.x + (Math.random() - 0.5) * this.config.spread;
        const y = transform.y - 20 - Math.random() * 20;
        
        this.numbers.push({
            text: Math.floor(damage).toString(),
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 20,
            vy: -30 - Math.random() * 20,
            life: this.config.lifeTime,
            alpha: 1,
            scale: 1,
            size: isCritical ? 24 : 16,
            color: isCritical ? this.config.colors.damageCrit : this.config.colors.damage,
            isCritical: isCritical
        });
    }
    
    /**
     * 生成治疗数字
     */
    spawnHealNumber(target, amount) {
        const transform = target.get(TransformComponent);
        if (!transform) return;
        
        this.numbers.push({
            text: `+${Math.floor(amount)}`,
            x: transform.x,
            y: transform.y - 30,
            vx: 0,
            vy: -20,
            life: this.config.lifeTime,
            alpha: 1,
            scale: 1,
            size: 18,
            color: this.config.colors.heal,
            isCritical: false
        });
    }
    
    /**
     * 生成经验数字
     */
    spawnExpNumber(entity, amount) {
        const transform = entity.get(TransformComponent);
        if (!transform) return;
        
        this.numbers.push({
            text: `+${amount} EXP`,
            x: transform.x,
            y: transform.y - 50,
            vx: 0,
            vy: -15,
            life: this.config.lifeTime * 0.8,
            alpha: 1,
            scale: 1,
            size: 14,
            color: this.config.colors.exp,
            isCritical: false
        });
    }
    
    /**
     * 生成金币数字
     */
    spawnGoldNumber(x, y, amount) {
        this.numbers.push({
            text: `+${amount}g`,
            x: x,
            y: y - 20,
            vx: 0,
            vy: -20,
            life: this.config.lifeTime,
            alpha: 1,
            scale: 1,
            size: 16,
            color: this.config.colors.gold,
            isCritical: false
        });
    }
    
    /**
     * 生成自定义文字
     */
    spawnText(x, y, text, options = {}) {
        this.numbers.push({
            text: text,
            x: x,
            y: y,
            vx: options.vx || 0,
            vy: options.vy || -20,
            life: options.life || this.config.lifeTime,
            alpha: 1,
            scale: 1,
            size: options.size || 16,
            color: options.color || this.config.colors.text,
            isCritical: options.critical || false
        });
    }
    
    /**
     * 生成升级特效文字
     */
    spawnLevelUpText(entity, level) {
        const transform = entity.get(TransformComponent);
        if (!transform) return;
        
        this.numbers.push({
            text: `LEVEL UP! ${level}`,
            x: transform.x,
            y: transform.y - 60,
            vx: 0,
            vy: -30,
            life: 2,
            alpha: 1,
            scale: 1.5,
            size: 28,
            color: '#48f',
            isCritical: true
        });
    }
    
    /**
     * 清除所有数字
     */
    clear() {
        this.numbers = [];
    }
    
    destroy() {}
}

window.DamageNumberSystem = DamageNumberSystem;
