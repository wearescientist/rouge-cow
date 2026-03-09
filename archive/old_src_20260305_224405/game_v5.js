// 肉鸽牛牛 v5.0 - Boss战斗系统
// Boss有多阶段、特殊攻击、召唤小弟

class BossAI extends Enemy {
    constructor(x, y) {
        super(x, y, 'boss');
        this.phase = 1;
        this.maxPhase = 3;
        this.phaseThresholds = [0.7, 0.4, 0.0]; // 血量百分比切换阶段
        
        // Boss属性
        this.size = 120;
        this.radius = 50;
        this.maxHp = 50;
        this.hp = 50;
        this.speed = 2;
        
        // 攻击冷却
        this.attackTimer = 0;
        this.attackPattern = 0; // 当前攻击模式
        
        // 阶段1：普通攻击
        // 阶段2：召唤小弟 + 冲锋
        // 阶段3：狂暴 + 全屏攻击
        
        this.charging = false;
        this.chargeDir = { x: 0, y: 0 };
        this.chargeTimer = 0;
        
        this.summonTimer = 0;
        this.minions = [];
    }
    
    update(player, enemies) {
        // 检查阶段切换
        const hpPercent = this.hp / this.maxHp;
        if (this.phase < 3 && hpPercent <= this.phaseThresholds[this.phase - 1]) {
            this.phase++;
            this.onPhaseChange();
        }
        
        // 根据阶段行为
        if (this.phase === 1) {
            this.phase1Behavior(player, enemies);
        } else if (this.phase === 2) {
            this.phase2Behavior(player, enemies);
        } else {
            this.phase3Behavior(player, enemies);
        }
        
        // 更新召唤的小弟
        this.minions = this.minions.filter(m => m.active);
        for (let minion of this.minions) {
            minion.update(player, enemies);
        }
    }
    
    onPhaseChange() {
        console.log(`Boss进入阶段${this.phase}!`);
        // 阶段切换时无敌几秒
        this.invincible = 120;
        
        // 召唤一圈小弟保护自己
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const mx = this.x + Math.cos(angle) * 100;
            const my = this.y + Math.sin(angle) * 100;
            // 在Game类中实际生成
        }
    }
    
    phase1Behavior(player, enemies) {
        // 阶段1：普通追踪 + 弹幕射击
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);
        
        // 保持一定距离
        if (dist > 250) {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        } else if (dist < 150) {
            this.x -= (dx / dist) * this.speed;
            this.y -= (dy / dist) * this.speed;
        }
        
        // 射击
        this.attackTimer--;
        if (this.attackTimer <= 0) {
            this.shootBulletPattern(player, 8); // 8方向弹幕
            this.attackTimer = 90;
        }
    }
    
    phase2Behavior(player, enemies) {
        // 阶段2：召唤 + 冲锋
        this.summonTimer--;
        if (this.summonTimer <= 0) {
            // 召唤2只小猪
            for (let i = 0; i < 2; i++) {
                const angle = Math.random() * Math.PI * 2;
                const sx = this.x + Math.cos(angle) * 80;
                const sy = this.y + Math.sin(angle) * 80;
                // 通知Game生成敌人
                if (window.gameInstance) {
                    window.gameInstance.spawnEnemyAt('pig', sx, sy);
                }
            }
            this.summonTimer = 300; // 5秒召唤一次
        }
        
        // 冲锋攻击
        if (!this.charging) {
            this.chargeTimer--;
            if (this.chargeTimer <= 0) {
                // 开始冲锋
                this.charging = true;
                const dx = player.x - this.x;
                const dy = player.y - this.y;
                const dist = Math.hypot(dx, dy);
                this.chargeDir = { x: dx / dist, y: dy / dist };
                this.chargeTimer = 60; // 冲锋持续时间
            }
            
            // 正常移动
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.hypot(dx, dy);
            if (dist > 0) {
                this.x += (dx / dist) * this.speed * 0.5;
                this.y += (dy / dist) * this.speed * 0.5;
            }
        } else {
            // 冲锋中
            this.x += this.chargeDir.x * 12; // 快速冲锋
            this.y += this.chargeDir.y * 12;
            this.chargeTimer--;
            
            if (this.chargeTimer <= 0) {
                this.charging = false;
                this.chargeTimer = 180; // 3秒后再次冲锋
            }
            
            // 边界反弹
            if (this.x < 100 || this.x > GAME_WIDTH - 100) {
                this.chargeDir.x *= -1;
            }
            if (this.y < 100 || this.y > GAME_HEIGHT - 100) {
                this.chargeDir.y *= -1;
            }
        }
    }
    
    phase3Behavior(player, enemies) {
        // 阶段3：狂暴 - 快速移动 + 全屏弹幕 + 追踪弹
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);
        
        // 快速追踪
        if (dist > 0) {
            this.x += (dx / dist) * this.speed * 1.5;
            this.y += (dy / dist) * this.speed * 1.5;
        }
        
        // 疯狂射击
        this.attackTimer--;
        if (this.attackTimer <= 0) {
            // 随机选择攻击模式
            const pattern = Math.floor(Math.random() * 3);
            if (pattern === 0) {
                this.shootBulletPattern(player, 12); // 12方向
            } else if (pattern === 1) {
                this.shootSpiralPattern(); // 螺旋弹
            } else {
                this.shootHomingMissiles(player); // 追踪导弹
            }
            this.attackTimer = 45;
        }
    }
    
    shootBulletPattern(player, count) {
        // 发射count方向弹幕
        const baseAngle = Math.atan2(player.y - this.y, player.x - this.x);
        for (let i = 0; i < count; i++) {
            const angle = baseAngle + (i / count) * Math.PI * 2;
            // 创建Boss子弹（需要Game类支持）
            if (window.gameInstance) {
                window.gameInstance.createBossBullet(this.x, this.y, angle);
            }
        }
    }
    
    shootSpiralPattern() {
        // 螺旋弹幕
        for (let i = 0; i < 4; i++) {
            setTimeout(() => {
                const angle = (gameFrame / 20) + (i * Math.PI / 2);
                if (window.gameInstance) {
                    window.gameInstance.createBossBullet(this.x, this.y, angle);
                }
            }, i * 200);
        }
    }
    
    shootHomingMissiles(player) {
        // 3发追踪导弹
        for (let i = 0; i < 3; i++) {
            setTimeout(() => {
                if (window.gameInstance) {
                    window.gameInstance.createHomingBullet(this.x, this.y, player);
                }
            }, i * 500);
        }
    }
    
    draw(ctx) {
        super.draw(ctx);
        
        // 阶段指示器
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 20px monospace';
        ctx.fillText(`P${this.phase}`, this.x - 15, this.y - this.size/2 - 20);
        
        // 冲锋指示
        if (this.charging) {
            ctx.strokeStyle = '#E74C3C';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

// Boss子弹类
class BossBullet {
    constructor(x, y, angle) {
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angle) * 6;
        this.vy = Math.sin(angle) * 6;
        this.radius = 10;
        this.active = true;
        this.damage = 1;
    }
    
    update() {
        this.x += this.vx;
        this.y += this.vy;
        
        if (this.x < -50 || this.x > GAME_WIDTH + 50 || 
            this.y < -50 || this.y > GAME_HEIGHT + 50) {
            this.active = false;
        }
    }
    
    draw(ctx) {
        ctx.fillStyle = '#E74C3C';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 内核
        ctx.fillStyle = '#C0392B';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 追踪导弹
class HomingMissile extends BossBullet {
    constructor(x, y, target) {
        super(x, y, 0);
        this.target = target;
        this.speed = 4;
        this.turnSpeed = 0.1;
        this.lifetime = 300;
    }
    
    update() {
        this.lifetime--;
        if (this.lifetime <= 0) {
            this.active = false;
            return;
        }
        
        // 追踪目标
        if (this.target && this.target.hp > 0) {
            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const targetAngle = Math.atan2(dy, dx);
            
            // 平滑转向
            let currentAngle = Math.atan2(this.vy, this.vx);
            let diff = targetAngle - currentAngle;
            while (diff > Math.PI) diff -= Math.PI * 2;
            while (diff < -Math.PI) diff += Math.PI * 2;
            
            currentAngle += diff * this.turnSpeed;
            this.vx = Math.cos(currentAngle) * this.speed;
            this.vy = Math.sin(currentAngle) * this.speed;
        }
        
        this.x += this.vx;
        this.y += this.vy;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.atan2(this.vy, this.vx));
        
        // 导弹形状
        ctx.fillStyle = '#E74C3C';
        ctx.beginPath();
        ctx.moveTo(10, 0);
        ctx.lineTo(-5, 5);
        ctx.lineTo(-5, -5);
        ctx.closePath();
        ctx.fill();
        
        // 尾焰
        ctx.fillStyle = '#F39C12';
        ctx.beginPath();
        ctx.arc(-8, 0, 4, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

console.log('Boss system loaded');
