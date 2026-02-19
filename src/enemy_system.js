/**
 * 肉鸽牛牛 - 敌人系统
 * 22种感染敌人 + AI + 波次管理
 */

// ==================== 敌人状态机 ====================
const EnemyStates = {
    IDLE: 'idle',
    CHASE: 'chase',
    ATTACK: 'attack',
    STUNNED: 'stunned',
    FLEE: 'flee'
};

// ==================== 敌人基类 ====================
class Enemy extends Entity {
    constructor(x, y, config) {
        super(x, y, 24, 24);
        this.config = { ...config };
        
        // 基础属性
        this.maxHp = config.hp;
        this.hp = config.hp;
        this.speed = config.speed;
        this.damage = config.damage;
        this.exp = config.exp;
        this.spriteId = config.id;
        
        // 状态
        this.state = EnemyStates.CHASE;
        this.stateTimer = 0;
        this.attackCooldown = 0;
        this.stunTimer = 0;
        this.frozenTimer = 0;
        this.burnTimer = 0;
        this.poisonTimer = 0;
        
        // 动画
        this.animOffset = Math.random() * 1000;
        this.facingRight = true;
        this.hitFlash = 0;
        
        // 效果
        this.slowFactor = 1.0;
    }

    update(dt, player, allEnemies) {
        // 状态效果处理
        if (this.stunTimer > 0) {
            this.stunTimer -= dt;
            this.state = EnemyStates.STUNNED;
        }
        
        if (this.frozenTimer > 0) {
            this.frozenTimer -= dt;
            return; // 冻结不动
        }

        if (this.burnTimer > 0) {
            this.burnTimer -= dt;
            this.hp -= 2 * dt; // 燃烧伤害
        }

        if (this.poisonTimer > 0) {
            this.poisonTimer -= dt;
            this.hp -= 1 * dt; // 中毒伤害
        }

        // 减速恢复
        this.slowFactor = Math.min(1.0, this.slowFactor + dt * 0.5);

        // 状态机
        switch (this.state) {
            case EnemyStates.CHASE:
                this.chase(dt, player, allEnemies);
                break;
            case EnemyStates.STUNNED:
                this.vel = new Vec2(0, 0);
                if (this.stunTimer <= 0) {
                    this.state = EnemyStates.CHASE;
                }
                break;
        }

        // 攻击冷却
        if (this.attackCooldown > 0) this.attackCooldown -= dt;

        // 受伤闪烁
        if (this.hitFlash > 0) this.hitFlash -= dt;

        // 应用速度
        const actualSpeed = this.speed * this.slowFactor;
        this.vel = this.vel.normalize().mul(actualSpeed);
        super.update(dt);

        // 边界限制
        this.x = Math.max(20, Math.min(880, this.x));
        this.y = Math.max(20, Math.min(580, this.y));
    }

    chase(dt, player, allEnemies) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // 分离行为（避免重叠）
        let separateX = 0, separateY = 0;
        let separateCount = 0;
        
        for (const other of allEnemies) {
            if (other === this) continue;
            const odx = this.x - other.x;
            const ody = this.y - other.y;
            const odist = Math.sqrt(odx * odx + ody * ody);
            
            if (odist < 30 && odist > 0) {
                separateX += odx / odist;
                separateY += ody / odist;
                separateCount++;
            }
        }

        // 计算最终速度
        if (dist > 0) {
            this.vel = new Vec2(dx / dist, dy / dist);
            this.facingRight = dx > 0;
        }

        // 应用分离
        if (separateCount > 0) {
            separateX /= separateCount;
            separateY /= separateCount;
            this.vel = this.vel.add(new Vec2(separateX, separateY).mul(0.5));
        }
    }

    takeDamage(amount, effects = {}) {
        this.hp -= amount;
        this.hitFlash = 0.2;

        // 应用效果
        if (effects.stun) this.stunTimer = effects.stun;
        if (effects.freeze) this.frozenTimer = effects.freeze;
        if (effects.slow) this.slowFactor = effects.slow;
        if (effects.burn) this.burnTimer = effects.burn;
        if (effects.poison) this.poisonTimer = effects.poison;

        // 击退
        if (effects.knockback) {
            // 由外部处理
        }

        return this.hp <= 0;
    }

    draw(ctx, spriteManager) {
        // 状态效果可视化
        if (this.frozenTimer > 0) {
            ctx.fillStyle = 'rgba(100, 200, 255, 0.3)';
            ctx.fillRect(this.x - 14, this.y - 14, 28, 28);
        }
        if (this.burnTimer > 0) {
            ctx.fillStyle = 'rgba(255, 100, 0, 0.3)';
            ctx.fillRect(this.x - 14, this.y - 14, 28, 28);
        }

        // 阴影
        ctx.fillStyle = 'rgba(0,0,0,0.2)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 10, 10, 3, 0, 0, Math.PI * 2);
        ctx.fill();

        // 敌人精灵
        const floatY = Math.sin((Date.now() + this.animOffset) / 300) * 1;
        
        spriteManager.draw(ctx, this.spriteId, this.x - 16, this.y - 16 + floatY, {
            width: 32,
            height: 32,
            flipX: !this.facingRight,
            tint: this.hitFlash > 0 ? 'rgba(255,0,0,0.5)' : null
        });

        // 血条
        if (this.hp < this.maxHp || this.maxHp >= 40) {
            const barWidth = 24;
            const hpPercent = Math.max(0, this.hp / this.maxHp);
            
            ctx.fillStyle = '#333';
            ctx.fillRect(this.x - barWidth / 2, this.y - 22, barWidth, 4);
            
            ctx.fillStyle = hpPercent > 0.5 ? '#4f4' : hpPercent > 0.25 ? '#ff4' : '#f44';
            ctx.fillRect(this.x - barWidth / 2, this.y - 22, barWidth * hpPercent, 4);
        }

        // 状态图标
        let iconY = this.y - 28;
        if (this.frozenTimer > 0) {
            ctx.font = '12px Arial';
            ctx.fillText('❄️', this.x, iconY);
            iconY -= 12;
        }
        if (this.burnTimer > 0) {
            ctx.font = '12px Arial';
            ctx.fillText('🔥', this.x, iconY);
        }
    }
}

// ==================== 波次管理器 ====================
class WaveManager {
    constructor(spriteManager) {
        this.spriteManager = spriteManager;
        this.wave = 1;
        this.waveTimer = 0;
        this.spawnTimer = 0;
        this.enemiesToSpawn = 0;
        this.totalSpawned = 0;
        this.isWaveActive = false;
        this.waveBreak = false;
        this.breakTimer = 0;
    }

    startWave(waveNum) {
        this.wave = waveNum;
        this.waveTimer = 0;
        this.spawnTimer = 0;
        this.totalSpawned = 0;
        this.isWaveActive = true;
        this.waveBreak = false;
        
        // 计算敌人数
        this.enemiesToSpawn = 5 + waveNum * 3;
        
        console.log(`第 ${waveNum} 波开始！敌人数: ${this.enemiesToSpawn}`);
    }

    update(dt, spawnCallback) {
        if (!this.isWaveActive) return;

        this.waveTimer += dt;

        if (this.waveBreak) {
            // 波次间隔
            this.breakTimer -= dt;
            if (this.breakTimer <= 0) {
                this.waveBreak = false;
            }
            return;
        }

        // 刷怪
        if (this.totalSpawned < this.enemiesToSpawn) {
            this.spawnTimer += dt;
            
            // 动态刷怪间隔
            const spawnInterval = Math.max(0.3, 2.0 - this.wave * 0.1);
            
            if (this.spawnTimer >= spawnInterval) {
                this.spawnTimer = 0;
                this.spawnEnemy(spawnCallback);
            }
        }
    }

    spawnEnemy(spawnCallback) {
        // 随机位置（屏幕边缘）
        const side = Math.floor(Math.random() * 4);
        let x, y;
        switch (side) {
            case 0: x = Math.random() * 900; y = -30; break;
            case 1: x = 930; y = Math.random() * 600; break;
            case 2: x = Math.random() * 900; y = 630; break;
            case 3: x = -30; y = Math.random() * 600; break;
        }

        // 获取敌人配置
        const config = this.spriteManager.getRandomEnemy(this.wave);
        
        // 波数加成
        const scaledConfig = {
            ...config,
            hp: config.hp * (1 + this.wave * 0.1),
            damage: config.damage * (1 + this.wave * 0.05),
            speed: config.speed * (1 + this.wave * 0.02)
        };

        spawnCallback(x, y, scaledConfig);
        this.totalSpawned++;
    }

    checkWaveComplete(currentEnemies) {
        if (!this.isWaveActive) return false;
        if (this.totalSpawned >= this.enemiesToSpawn && currentEnemies === 0) {
            this.endWave();
            return true;
        }
        return false;
    }

    endWave() {
        this.isWaveActive = false;
        this.waveBreak = true;
        this.breakTimer = 5; // 5秒间隔
        console.log(`第 ${this.wave} 波完成！`);
    }

    getWaveInfo() {
        return {
            wave: this.wave,
            progress: this.totalSpawned / this.enemiesToSpawn,
            remaining: Math.max(0, this.enemiesToSpawn - this.totalSpawned),
            breakTime: this.breakTimer
        };
    }
}

// ==================== 经验宝石 ====================
class ExpGem extends Entity {
    constructor(x, y, value) {
        super(x, y, 12, 12);
        this.value = value;
        this.attracted = false;
        this.attractionSpeed = 200;
        this.life = 30; // 30秒后消失
    }

    update(dt, player, magnetRange) {
        const dist = this.distanceTo(player);
        
        // 磁铁吸引
        if (dist < magnetRange || this.attracted) {
            this.attracted = true;
            const dir = player.pos.sub(this.pos).normalize();
            this.vel = dir.mul(this.attractionSpeed);
        } else {
            this.vel = new Vec2(0, 0);
        }

        super.update(dt);
        this.life -= dt;

        if (dist < 15) {
            this.destroy();
            return true; // 被收集
        }

        if (this.life <= 0) {
            this.destroy();
        }

        return false;
    }

    draw(ctx) {
        const alpha = Math.min(1, this.life / 5);
        ctx.globalAlpha = alpha;
        
        ctx.fillStyle = '#4488ff';
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#4488ff';
        ctx.beginPath();
        ctx.moveTo(this.x, this.y - 6);
        ctx.lineTo(this.x + 5, this.y);
        ctx.lineTo(this.x, this.y + 6);
        ctx.lineTo(this.x - 5, this.y);
        ctx.closePath();
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }
}

// ==================== 金币 ====================
class Coin extends ExpGem {
    constructor(x, y, value) {
        super(x, y, value);
        this.width = 14;
        this.height = 14;
    }

    draw(ctx) {
        const alpha = Math.min(1, this.life / 5);
        ctx.globalAlpha = alpha;
        
        ctx.fillStyle = '#ffcc00';
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#ffcc00';
        ctx.beginPath();
        ctx.arc(this.x, this.y, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#ffee88';
        ctx.beginPath();
        ctx.arc(this.x - 2, this.y - 2, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }
}

// ==================== 导出 ====================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Enemy, WaveManager, ExpGem, Coin, EnemyStates };
}
