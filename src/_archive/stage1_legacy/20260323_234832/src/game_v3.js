// 肉鸽牛牛 v3.0 - 武器多样化
// 添加多种武器类型和攻击模式

// ========== 武器定义 ==========
const WEAPONS = {
    milk: {
        name: '牛奶弹',
        desc: '单发高伤害',
        color: '#FFF',
        fireRate: 25,
        damage: 1,
        pierce: 0,
        speed: 10,
        projectileCount: 1,
        spread: 0,
        homing: false
    },
    spread: {
        name: '散弹牛奶',
        desc: '扇形3发',
        color: '#FFE4B5',
        fireRate: 35,
        damage: 0.8,
        pierce: 0,
        speed: 9,
        projectileCount: 3,
        spread: 0.3, // 弧度
        homing: false
    },
    rapid: {
        name: '连射奶瓶',
        desc: '快速连发',
        color: '#87CEEB',
        fireRate: 8,
        damage: 0.5,
        pierce: 0,
        speed: 12,
        projectileCount: 1,
        spread: 0.1,
        homing: false
    },
    pierce: {
        name: '穿透奶酪',
        desc: '穿透多个敌人',
        color: '#FFA500',
        fireRate: 40,
        damage: 1.5,
        pierce: 3, // 穿透3个敌人
        speed: 8,
        projectileCount: 1,
        spread: 0,
        homing: false
    },
    homing: {
        name: '追踪酸奶',
        desc: '自动追踪敌人',
        color: '#DDA0DD',
        fireRate: 30,
        damage: 0.7,
        pierce: 0,
        speed: 7,
        projectileCount: 1,
        spread: 0,
        homing: true
    },
    burst: {
        name: '爆发奶油',
        desc: '5连发爆发',
        color: '#FFF8DC',
        fireRate: 45,
        damage: 0.6,
        pierce: 0,
        speed: 10,
        projectileCount: 5, // 瞬间5发
        spread: 0.05,
        homing: false,
        isBurst: true
    }
};

class BulletV3 {
    constructor(x, y, angle, weaponType, damage) {
        this.x = x;
        this.y = y;
        this.weapon = WEAPONS[weaponType];
        this.damage = damage;
        this.speed = this.weapon.speed;
        this.radius = 6;
        this.active = true;
        this.pierceCount = this.weapon.pierce;
        this.homing = this.weapon.homing;
        this.angle = angle;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
        this.lifetime = 120; // 2秒生命周期
    }
    
    update(enemies) {
        this.lifetime--;
        if (this.lifetime <= 0) {
            this.active = false;
            return;
        }
        
        // 追踪逻辑
        if (this.homing && enemies.length > 0) {
            let nearest = null;
            let minDist = 200; // 追踪范围
            
            for (let e of enemies) {
                const dist = Math.hypot(e.x - this.x, e.y - this.y);
                if (dist < minDist) {
                    minDist = dist;
                    nearest = e;
                }
            }
            
            if (nearest) {
                const targetAngle = Math.atan2(nearest.y - this.y, nearest.x - this.x);
                // 平滑转向
                let diff = targetAngle - this.angle;
                while (diff > Math.PI) diff -= Math.PI * 2;
                while (diff < -Math.PI) diff += Math.PI * 2;
                this.angle += diff * 0.1;
                this.vx = Math.cos(this.angle) * this.speed;
                this.vy = Math.sin(this.angle) * this.speed;
            }
        }
        
        this.x += this.vx;
        this.y += this.vy;
        
        // 边界检查
        if (this.x < -100 || this.x > GAME_WIDTH + 100 || 
            this.y < -100 || this.y > GAME_HEIGHT + 100) {
            this.active = false;
        }
    }
    
    draw(ctx) {
        ctx.fillStyle = this.weapon.color;
        ctx.beginPath();
        
        if (this.weapon.name === '穿透奶酪') {
            // 奶酪形状（方形）
            ctx.rect(this.x - 6, this.y - 6, 12, 12);
        } else if (this.weapon.name === '追踪酸奶') {
            // 漩涡形状
            ctx.arc(this.x, this.y, 8, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFF';
            ctx.beginPath();
            ctx.arc(this.x, this.y, 4, 0, Math.PI * 2);
        } else {
            // 标准圆形
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        }
        
        ctx.fill();
        
        // 轨迹效果
        if (this.weapon.name === '连射奶瓶') {
            ctx.fillStyle = 'rgba(135, 206, 235, 0.3)';
            ctx.beginPath();
            ctx.arc(this.x - this.vx * 2, this.y - this.vy * 2, this.radius * 0.8, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

// ========== 修改Player类 ==========
class PlayerV3 extends Player {
    constructor() {
        super();
        this.currentWeapon = 'milk';
        this.weaponLevel = 1;
        this.burstCount = 0;
        this.burstTimer = 0;
    }
    
    autoAttack(enemies) {
        const weapon = WEAPONS[this.currentWeapon];
        
        // 爆发武器特殊处理
        if (weapon.isBurst && this.burstCount === 0) {
            this.burstCount = weapon.projectileCount;
            this.burstTimer = 0;
        }
        
        if (weapon.isBurst && this.burstCount > 0) {
            this.burstTimer--;
            if (this.burstTimer <= 0) {
                this.fireBullet(enemies, weapon);
                this.burstCount--;
                this.burstTimer = 3; // 3帧间隔
            }
            if (this.burstCount === 0) {
                this.cooldown = weapon.fireRate;
            }
            return;
        }
        
        // 普通武器
        if (this.cooldown <= 0) {
            for (let i = 0; i < weapon.projectileCount; i++) {
                this.fireBullet(enemies, weapon, i, weapon.projectileCount);
            }
            this.cooldown = weapon.fireRate;
        }
    }
    
    fireBullet(enemies, weapon, index = 0, total = 1) {
        // 找目标
        let targetX = this.x + this.facing * 100;
        let targetY = this.y;
        let minDist = 400;
        
        for (let e of enemies) {
            const dist = Math.hypot(e.x - this.x, e.y - this.y);
            if (dist < minDist) {
                minDist = dist;
                targetX = e.x;
                targetY = e.y;
            }
        }
        
        // 计算角度
        let baseAngle = Math.atan2(targetY - this.y, targetX - this.x);
        
        // 散射
        if (total > 1 && !weapon.isBurst) {
            const spreadOffset = (index - (total - 1) / 2) * weapon.spread;
            baseAngle += spreadOffset;
        } else {
            baseAngle += (Math.random() - 0.5) * weapon.spread;
        }
        
        return new BulletV3(this.x, this.y, baseAngle, this.currentWeapon, this.damage * weapon.damage);
    }
    
    changeWeapon(weaponKey) {
        this.currentWeapon = weaponKey;
        console.log(`切换武器: ${WEAPONS[weaponKey].name}`);
    }
}

// ========== 武器切换道具 ==========
const WEAPON_ITEMS = Object.keys(WEAPONS).map(key => ({
    key: key,
    ...WEAPONS[key]
}));

// 修改ItemDrop支持武器切换
class WeaponDrop extends ItemDrop {
    constructor(x, y, weaponKey) {
        super(x, y, 'weapon');
        this.weaponKey = weaponKey;
    }
    
    draw(ctx) {
        const weapon = WEAPONS[this.weaponKey];
        const bob = Math.sin(this.bobOffset) * 3;
        
        ctx.fillStyle = weapon.color + '60';
        ctx.beginPath();
        ctx.arc(this.x, this.y + bob, 22, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#2C3E50';
        ctx.fillRect(this.x - 16, this.y + bob - 16, 32, 32);
        
        ctx.strokeStyle = weapon.color;
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x - 16, this.y + bob - 16, 32, 32);
        
        // 简单图形表示武器类型
        ctx.fillStyle = weapon.color;
        if (this.weaponKey === 'spread') {
            // 三个点表示散射
            ctx.beginPath(); ctx.arc(this.x - 5, this.y + bob, 3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(this.x, this.y + bob - 5, 3, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(this.x + 5, this.y + bob, 3, 0, Math.PI * 2); ctx.fill();
        } else if (this.weaponKey === 'rapid') {
            // 竖线表示连射
            ctx.fillRect(this.x - 2, this.y + bob - 8, 4, 16);
        } else {
            ctx.beginPath(); ctx.arc(this.x, this.y + bob, 6, 0, Math.PI * 2); ctx.fill();
        }
    }
}

// 添加到Game类...
console.log('Weapon system loaded');
