// 肉鸽牛牛 v11.0 - 更多敌人类型
// 添加丰富的敌人种类和行为模式

// ========== 新敌人类型 ==========

class EnemySheep extends Enemy {
    constructor(x, y) {
        super(x, y, 'sheep');
        this.hp = 5;
        this.speed = 1.2;
        this.size = 56;
        this.behavior = 'flock'; // 群体行为
        this.flockRange = 150;
    }
    
    update(player, enemies) {
        // 绵羊会群体行动：寻找附近的同伴并聚集
        let flockX = 0, flockY = 0, flockCount = 0;
        
        for (let e of enemies) {
            if (e !== this && e.type === 'sheep' && e.active) {
                const dist = Math.hypot(e.x - this.x, e.y - this.y);
                if (dist < this.flockRange) {
                    flockX += e.x;
                    flockY += e.y;
                    flockCount++;
                }
            }
        }
        
        // 混合行为：追踪玩家 + 群体聚集
        let dx = player.x - this.x;
        let dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);
        
        if (flockCount > 0) {
            // 向群体中心靠拢
            const centerX = flockX / flockCount;
            const centerY = flockY / flockCount;
            dx = dx * 0.7 + (centerX - this.x) * 0.3;
            dy = dy * 0.7 + (centerY - this.y) * 0.3;
        }
        
        if (dist > 0) {
            this.x += (dx / Math.hypot(dx, dy)) * this.speed;
            this.y += (dy / Math.hypot(dx, dy)) * this.speed;
        }
        
        // 朝向
        if (dx < 0) this.facing = -1;
        if (dx > 0) this.facing = 1;
    }
}

class EnemyCow extends Enemy {
    constructor(x, y) {
        super(x, y, 'cow');
        this.hp = 8;
        this.speed = 1.0;
        this.size = 64;
        this.behavior = 'charge';
        this.chargeTimer = 0;
        this.isCharging = false;
        this.chargeDir = { x: 0, y: 0 };
    }
    
    update(player, enemies) {
        if (this.isCharging) {
            // 冲锋中
            this.x += this.chargeDir.x * 8;
            this.y += this.chargeDir.y * 8;
            this.chargeTimer--;
            
            if (this.chargeTimer <= 0) {
                this.isCharging = false;
                this.chargeTimer = 180; // 3秒冷却
            }
            
            // 边界反弹
            if (this.x < 50 || this.x > GAME_WIDTH - 50) this.chargeDir.x *= -1;
            if (this.y < 50 || this.y > GAME_HEIGHT - 50) this.chargeDir.y *= -1;
        } else {
            // 正常移动，积蓄力量
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.hypot(dx, dy);
            
            if (dist > 0) {
                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed;
            }
            
            this.chargeTimer--;
            if (this.chargeTimer <= 0 && dist < 200) {
                // 开始冲锋！
                this.isCharging = true;
                this.chargeTimer = 60; // 冲锋持续1秒
                this.chargeDir = { x: dx / dist, y: dy / dist };
                
                // 预警效果
                if (window.gameInstance) {
                    window.gameInstance.particles.createChargeWarning(this.x, this.y);
                }
            }
            
            if (dx < 0) this.facing = -1;
            if (dx > 0) this.facing = 1;
        }
    }
    
    draw(ctx) {
        super.draw(ctx);
        
        // 冲锋预警指示器
        if (!this.isCharging && this.chargeTimer < 60) {
            ctx.strokeStyle = '#E74C3C';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size + 10, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

class EnemyHorse extends Enemy {
    constructor(x, y) {
        super(x, y, 'horse');
        this.hp = 6;
        this.speed = 3.0; // 很快！
        this.size = 60;
        this.behavior = 'hitandrun';
        this.attackCooldown = 0;
    }
    
    update(player, enemies) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);
        
        if (this.attackCooldown > 0) {
            // 攻击后撤退
            this.attackCooldown--;
            if (dist > 0) {
                this.x -= (dx / dist) * this.speed * 0.8;
                this.y -= (dy / dist) * this.speed * 0.8;
            }
        } else {
            // 快速接近
            if (dist > 0) {
                this.x += (dx / dist) * this.speed;
                this.y += (dy / dist) * this.speed;
            }
            
            // 接触后触发攻击冷却
            if (dist < this.radius + player.radius) {
                this.attackCooldown = 90; // 1.5秒冷却
            }
        }
        
        if (dx < 0) this.facing = -1;
        if (dx > 0) this.facing = 1;
    }
}

class EnemyDuck extends Enemy {
    constructor(x, y) {
        super(x, y, 'duck');
        this.hp = 2;
        this.speed = 2.0;
        this.size = 40;
        this.behavior = 'zigzag';
        this.zigzagTimer = 0;
        this.baseAngle = 0;
    }
    
    update(player, enemies) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);
        
        if (dist > 0) {
            // 基础方向朝向玩家
            let angle = Math.atan2(dy, dx);
            
            // 添加Z字摇摆
            this.zigzagTimer += 0.2;
            angle += Math.sin(this.zigzagTimer) * 0.5;
            
            this.x += Math.cos(angle) * this.speed;
            this.y += Math.sin(angle) * this.speed;
        }
        
        if (dx < 0) this.facing = -1;
        if (dx > 0) this.facing = 1;
    }
}

class EnemyGoose extends Enemy {
    constructor(x, y) {
        super(x, y, 'goose');
        this.hp = 4;
        this.speed = 2.2;
        this.size = 52;
        this.behavior = 'aggressive';
        this.rageMode = false;
    }
    
    update(player, enemies) {
        // 受伤后进入狂暴模式
        if (this.hp < this.maxHp * 0.5 && !this.rageMode) {
            this.rageMode = true;
            this.speed *= 1.5;
            // 变红效果
        }
        
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.hypot(dx, dy);
        
        // 鹅非常 aggressively 追击，不会退缩
        if (dist > 0) {
            this.x += (dx / dist) * this.speed;
            this.y += (dy / dist) * this.speed;
        }
        
        if (dx < 0) this.facing = -1;
        if (dx > 0) this.facing = 1;
    }
    
    draw(ctx) {
        super.draw(ctx);
        
        // 狂暴模式红色边框
        if (this.rageMode) {
            ctx.strokeStyle = '#E74C3C';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.stroke();
        }
    }
}

class EnemyTurkey extends Enemy {
    constructor(x, y) {
        super(x, y, 'turkey');
        this.hp = 7;
        this.speed = 1.8;
        this.size = 58;
        this.behavior = 'spawn_minions';
        this.spawnTimer = 300; // 5秒召唤一次
    }
    
    update(player, enemies) {
        super.update(player, enemies);
        
        // 召唤小火鸡
        this.spawnTimer--;
        if (this.spawnTimer <= 0) {
            this.spawnTimer = 300;
            
            // 在周围生成2-3只小鸡
            for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) {
                const angle = Math.random() * Math.PI * 2;
                const dist = 50 + Math.random() * 30;
                const sx = this.x + Math.cos(angle) * dist;
                const sy = this.y + Math.sin(angle) * dist;
                
                if (window.gameInstance) {
                    window.gameInstance.spawnEnemyAt('chick', sx, sy);
                }
            }
            
            // 召唤特效
            if (window.gameInstance) {
                window.gameInstance.particles.createSpawnEffect(this.x, this.y);
            }
        }
    }
}

// ========== 精英敌人变体 ==========
class EliteEnemy extends Enemy {
    constructor(x, y, baseType) {
        super(x, y, 'elite_' + baseType);
        this.baseType = baseType;
        this.isElite = true;
        
        // 精英属性翻倍
        this.hp *= 3;
        this.maxHp = this.hp;
        this.speed *= 1.2;
        this.size *= 1.3;
        this.damage *= 2;
        
        // 随机精英词缀
        const prefixes = ['狂暴', '坚韧', '迅捷', '寄生'];
        this.prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
        
        // 词缀效果
        if (this.prefix === '狂暴') {
            this.damage *= 1.5;
        } else if (this.prefix === '坚韧') {
            this.hp *= 1.5;
            this.maxHp = this.hp;
        } else if (this.prefix === '迅捷') {
            this.speed *= 1.5;
        } else if (this.prefix === '寄生') {
            // 死亡时复活一次
            this.canRevive = true;
        }
    }
    
    takeDamage(dmg) {
        this.hp -= dmg;
        
        if (this.hp <= 0 && this.canRevive) {
            this.hp = this.maxHp * 0.3;
            this.canRevive = false;
            // 复活特效
            if (window.gameInstance) {
                window.gameInstance.particles.createReviveEffect(this.x, this.y);
            }
            return false;
        }
        
        if (this.hp <= 0) {
            this.active = false;
            return true;
        }
        return false;
    }
    
    draw(ctx) {
        super.draw(ctx);
        
        // 精英光环
        ctx.strokeStyle = this.getEliteColor();
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size + 8, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // 词缀标签
        ctx.fillStyle = this.getEliteColor();
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(this.prefix, this.x, this.y - this.size - 15);
        ctx.textAlign = 'left';
    }
    
    getEliteColor() {
        const colors = {
            '狂暴': '#E74C3C',
            '坚韧': '#3498DB',
            '迅捷': '#2ECC71',
            '寄生': '#9B59B6'
        };
        return colors[this.prefix] || '#F1C40F';
    }
}

// ========== 敌人图鉴 ==========
const ENEMY_CODEX = {
    chick: { name: '感染小鸡', threat: 1, desc: '速度快但脆弱' },
    pig: { name: '感染小猪', threat: 2, desc: '生命值较高' },
    sheep: { name: '群聚绵羊', threat: 2, desc: '会聚集成群' },
    cow: { name: '狂暴奶牛', threat: 3, desc: '会冲锋攻击' },
    horse: { name: '疾行马', threat: 3, desc: '极快的速度，打带跑' },
    duck: { name: '摇摆鸭', threat: 1, desc: 'Z字形移动' },
    goose: { name: '愤怒鹅', threat: 3, desc: '受伤后狂暴' },
    turkey: { name: '召唤火鸡', threat: 4, desc: '会持续召唤小弟' },
    boss: { name: '寄生牧羊犬', threat: 5, desc: 'Boss级敌人' }
};

console.log('Enemy variety system loaded');
console.log('New enemies: Sheep, Cow, Horse, Duck, Goose, Turkey');
console.log('Elite enemies with affixes added');
