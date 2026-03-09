// 肉鸽牛牛 v13.0 - 技能/大招系统
// 主动技能，冷却管理，战术选择

// ========== 技能定义 ==========
const SKILLS = {
    // 攻击类
    stampede: {
        id: 'stampede',
        name: '牛群冲锋',
        desc: '召唤3头幻影牛向前冲锋，造成大量伤害',
        icon: '🦬',
        cooldown: 15, // 秒
        duration: 3,
        type: 'attack',
        effect: (player, game) => {
            // 向前发射3头幻影牛
            for (let i = -1; i <= 1; i++) {
                const angle = (player.facing === 1 ? 0 : Math.PI) + i * 0.3;
                game.spawnStampedeCow(player.x, player.y, angle, player.damage * 5);
            }
        }
    },
    
    milkWave: {
        id: 'milkWave',
        name: '牛奶波动',
        desc: '全屏 milk 波纹，推开所有敌人并造成伤害',
        icon: '🥛',
        cooldown: 12,
        duration: 0,
        type: 'control',
        effect: (player, game) => {
            // 击退所有敌人
            for (let enemy of game.enemies) {
                const dx = enemy.x - player.x;
                const dy = enemy.y - player.y;
                const dist = Math.hypot(dx, dy);
                if (dist > 0) {
                    enemy.x += (dx / dist) * 200; // 强力击退
                    enemy.y += (dy / dist) * 200;
                    enemy.takeDamage(player.damage * 2);
                }
            }
            // 特效
            game.particles.createShockwave(player.x, player.y, '#FFF');
        }
    },
    
    // 防御类
    ironSkin: {
        id: 'ironSkin',
        name: '铁皮护甲',
        desc: '5秒内无敌，反弹50%伤害',
        icon: '🛡️',
        cooldown: 20,
        duration: 5,
        type: 'defense',
        effect: (player, game) => {
            player.invincible = 300; // 5秒无敌帧
            player.thorns = 0.5; // 反弹50%伤害
        },
        onEnd: (player) => {
            player.thorns = 0;
        }
    },
    
    healMilk: {
        id: 'healMilk',
        name: '治愈牛奶',
        desc: '瞬间回复3点生命，并在5秒内持续回血',
        icon: '❤️',
        cooldown: 18,
        duration: 5,
        type: 'heal',
        effect: (player, game) => {
            player.heal(3);
            player.regen = 0.5; // 每秒回0.5
        },
        onEnd: (player) => {
            player.regen = 0;
        }
    },
    
    // 辅助类
    timeWarp: {
        id: 'timeWarp',
        name: '时间扭曲',
        desc: '所有敌人减速50%，持续6秒',
        icon: '⏱️',
        cooldown: 25,
        duration: 6,
        type: 'utility',
        effect: (player, game) => {
            game.timeScale = 0.5; // 全局时间减速
        },
        onEnd: (player, game) => {
            game.timeScale = 1.0;
        }
    },
    
    berserk: {
        id: 'berserk',
        name: '狂暴模式',
        desc: '攻击力翻倍，攻速+50%，但受到伤害+50%，持续8秒',
        icon: '👹',
        cooldown: 30,
        duration: 8,
        type: 'buff',
        effect: (player, game) => {
            player.berserkMode = true;
            player.damage *= 2;
            player.attackSpeed *= 0.5; // 冷却减半 = 攻速翻倍
            player.damageTakenMultiplier = 1.5;
            // 变红特效
            player.tint = '#E74C3C';
        },
        onEnd: (player) => {
            player.berserkMode = false;
            player.damage /= 2;
            player.attackSpeed *= 2;
            player.damageTakenMultiplier = 1;
            player.tint = null;
        }
    },
    
    // 终极技能
    mooNuke: {
        id: 'mooNuke',
        name: '哞哞核弹',
        desc: '召唤巨型牛奶弹轰炸全场，对Boss特攻',
        icon: '☢️',
        cooldown: 60,
        duration: 0,
        type: 'ultimate',
        requiresCharge: true,
        chargeNeeded: 50, // 需要击杀50个敌人充能
        effect: (player, game) => {
            // 全场轰炸
            for (let i = 0; i < 20; i++) {
                setTimeout(() => {
                    const x = Math.random() * GAME_WIDTH;
                    const y = Math.random() * GAME_HEIGHT;
                    game.createNukeExplosion(x, y, player.damage * 10);
                }, i * 100);
            }
        }
    }
};

// ========== 技能管理器 ==========
class SkillManager {
    constructor(player) {
        this.player = player;
        this.slots = [null, null, null]; // 3个技能槽
        this.cooldowns = [0, 0, 0];
        this.activeDurations = [0, 0, 0];
    }
    
    // 装备技能
    equipSkill(slotIndex, skillId) {
        if (slotIndex < 0 || slotIndex > 2) return false;
        if (!SKILLS[skillId]) return false;
        
        this.slots[slotIndex] = skillId;
        this.cooldowns[slotIndex] = 0;
        return true;
    }
    
    // 使用技能
    useSkill(slotIndex, game) {
        if (slotIndex < 0 || slotIndex > 2) return false;
        
        const skillId = this.slots[slotIndex];
        if (!skillId) return false;
        if (this.cooldowns[slotIndex] > 0) return false;
        
        const skill = SKILLS[skillId];
        
        // 检查充能
        if (skill.requiresCharge && this.player.skillCharge < skill.chargeNeeded) {
            return false;
        }
        
        // 执行效果
        skill.effect(this.player, game);
        
        // 设置冷却
        this.cooldowns[slotIndex] = skill.cooldown;
        
        // 设置持续时间
        if (skill.duration > 0) {
            this.activeDurations[slotIndex] = skill.duration;
        }
        
        // 消耗充能
        if (skill.requiresCharge) {
            this.player.skillCharge = 0;
        }
        
        // 特效
        game.particles.createSkillCastEffect(this.player.x, this.player.y, skill.icon);
        game.sounds.playSkillSound?.();
        
        return true;
    }
    
    // 更新冷却
    update(deltaTime) {
        for (let i = 0; i < 3; i++) {
            if (this.cooldowns[i] > 0) {
                this.cooldowns[i] -= deltaTime;
                if (this.cooldowns[i] < 0) this.cooldowns[i] = 0;
            }
            
            // 处理持续技能结束
            if (this.activeDurations[i] > 0) {
                this.activeDurations[i] -= deltaTime;
                if (this.activeDurations[i] <= 0) {
                    const skill = SKILLS[this.slots[i]];
                    if (skill.onEnd) {
                        skill.onEnd(this.player, window.gameInstance);
                    }
                    this.activeDurations[i] = 0;
                }
            }
        }
    }
    
    // 获取技能槽状态
    getSlotStatus(slotIndex) {
        const skillId = this.slots[slotIndex];
        if (!skillId) return null;
        
        const skill = SKILLS[skillId];
        return {
            skill: skill,
            cooldown: this.cooldowns[slotIndex],
            maxCooldown: skill.cooldown,
            isActive: this.activeDurations[slotIndex] > 0,
            duration: this.activeDurations[slotIndex],
            ready: this.cooldowns[slotIndex] <= 0
        };
    }
}

// ========== 幻影牛（冲锋技能用）==========
class StampedeCow {
    constructor(x, y, angle, damage) {
        this.x = x;
        this.y = y;
        this.vx = Math.cos(angle) * 8;
        this.vy = Math.sin(angle) * 8;
        this.damage = damage;
        this.radius = 30;
        this.active = true;
        this.lifetime = 60; // 1秒
    }
    
    update(enemies) {
        this.x += this.vx;
        this.y += this.vy;
        this.lifetime--;
        
        if (this.lifetime <= 0) {
            this.active = false;
        }
        
        // 碰撞敌人
        for (let enemy of enemies) {
            if (Math.hypot(enemy.x - this.x, enemy.y - this.y) < enemy.radius + this.radius) {
                enemy.takeDamage(this.damage);
                // 强力击退
                enemy.x += this.vx * 2;
                enemy.y += this.vy * 2;
            }
        }
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(Math.atan2(this.vy, this.vx));
        
        // 幻影效果
        ctx.globalAlpha = this.lifetime / 60 * 0.7;
        ctx.fillStyle = '#FFF';
        ctx.fillRect(-30, -20, 60, 40);
        
        // 光效
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#FFF';
        ctx.fillRect(-30, -20, 60, 40);
        ctx.shadowBlur = 0;
        
        ctx.restore();
    }
}

// ========== 核弹爆炸 ==========
class NukeExplosion {
    constructor(x, y, damage) {
        this.x = x;
        this.y = y;
        this.damage = damage;
        this.radius = 0;
        this.maxRadius = 150;
        this.active = true;
        this.hitEnemies = new Set();
    }
    
    update(enemies) {
        this.radius += 10;
        
        if (this.radius >= this.maxRadius) {
            this.active = false;
        }
        
        // 伤害范围内敌人
        for (let enemy of enemies) {
            if (this.hitEnemies.has(enemy)) continue;
            
            const dist = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            if (dist < this.radius) {
                enemy.takeDamage(this.damage);
                this.hitEnemies.add(enemy);
            }
        }
    }
    
    draw(ctx) {
        const alpha = 1 - (this.radius / this.maxRadius);
        
        // 外圈
        ctx.fillStyle = `rgba(255, 200, 100, ${alpha * 0.5})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();
        
        // 内圈
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ========== 技能选择UI ==========
class SkillSelectionUI {
    static showAvailableSkills(player, onSelect) {
        const available = Object.keys(SKILLS).filter(id => {
            // 检查解锁条件
            return true; // 简化：所有技能都可用
        });
        
        return available.map(id => SKILLS[id]);
    }
}

// ========== 技能充能系统 ==========
class SkillChargeSystem {
    constructor(player) {
        this.player = player;
        this.charge = 0;
        this.maxCharge = 50;
    }
    
    addCharge(amount) {
        this.charge = Math.min(this.maxCharge, this.charge + amount);
        this.player.skillCharge = this.charge;
    }
    
    onEnemyKilled() {
        this.addCharge(1);
    }
    
    canUseUltimate() {
        return this.charge >= this.maxCharge;
    }
}

console.log('Skill system loaded');
console.log('7 active skills, 3 skill slots, cooldown management');
