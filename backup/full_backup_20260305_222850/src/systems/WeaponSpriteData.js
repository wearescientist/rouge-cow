/**
 * WeaponSpriteData.js - 武器和投射物 SpriteData 管理
 * 管理子弹、近战武器、特效的精确渲染和碰撞
 */

class WeaponSpriteData {
    constructor() {
        // 投射物配置
        this.projectileConfigs = {
            // 默认子弹
            'default': {
                radius: 6,
                renderRadius: 4,
                color: '#ff0',
                glowColor: '#ff8800',
                glowSize: 8,
                hasTrail: true
            },
            // 飞刀 (knife)
            'rapid': {
                radius: 4,
                renderRadius: 8,
                width: 16,
                height: 6,
                color: '#ccc',
                glowColor: '#fff',
                glowSize: 4,
                hasTrail: true,
                rotationSpeed: 10
            },
            // 火球
            'fireball': {
                radius: 12,
                renderRadius: 14,
                color: '#f80',
                glowColor: '#f40',
                glowSize: 15,
                hasTrail: true,
                pulseEffect: true
            },
            // 冰锥
            'ice': {
                radius: 8,
                renderRadius: 10,
                width: 20,
                height: 8,
                color: '#8cf',
                glowColor: '#48f',
                glowSize: 10,
                hasTrail: true
            },
            // 闪电
            'lightning': {
                radius: 10,
                renderRadius: 3,
                color: '#ff0',
                glowColor: '#ff0',
                glowSize: 20,
                hasTrail: false,
                isInstant: true
            },
            // 毒镖
            'poison': {
                radius: 5,
                renderRadius: 6,
                width: 12,
                height: 4,
                color: '#4a4',
                glowColor: '#0f0',
                glowSize: 6,
                hasTrail: true
            },
            // 回旋镖
            'boomerang': {
                radius: 10,
                renderRadius: 12,
                width: 24,
                height: 8,
                color: '#fa0',
                glowColor: '#f80',
                glowSize: 8,
                hasTrail: true,
                rotationSpeed: 8
            },
            // 弹跳弹
            'bounce': {
                radius: 8,
                renderRadius: 10,
                color: '#f4f',
                glowColor: '#f8f',
                glowSize: 12,
                hasTrail: true,
                bounceEffect: true
            },
            // 爆炸弹
            'explode': {
                radius: 6,
                renderRadius: 8,
                color: '#f44',
                glowColor: '#f80',
                glowSize: 10,
                hasTrail: true,
                explodeRadius: 80
            },
            // 追踪弹
            'homing': {
                radius: 6,
                renderRadius: 8,
                color: '#8f8',
                glowColor: '#4f4',
                glowSize: 10,
                hasTrail: true,
                homingStrength: 0.1
            },
            // 穿透弹
            'penetrate': {
                radius: 4,
                renderRadius: 20,
                width: 40,
                height: 3,
                color: '#8ff',
                glowColor: '#0ff',
                glowSize: 8,
                hasTrail: false,
                pierceCount: 5
            },
            // 扇形弹
            'fan': {
                radius: 5,
                renderRadius: 6,
                width: 12,
                height: 5,
                color: '#fa8',
                glowColor: '#f84',
                glowSize: 6,
                hasTrail: true
            }
        };

        // 近战武器配置
        this.meleeConfigs = {
            // 鞭子
            'whip': {
                range: 120,
                arcAngle: 90,
                sweepTime: 0.15,
                color: '#c9a',
                glowColor: '#a79',
                trailWidth: 4
            },
            // 斧头
            'axe': {
                range: 100,
                arcAngle: 60,
                sweepTime: 0.2,
                color: '#aaa',
                glowColor: '#fff',
                trailWidth: 6,
                spinEffect: true
            },
            // 十字架
            'cross': {
                range: 80,
                arcAngle: 360,
                sweepTime: 0.5,
                color: '#fd0',
                glowColor: '#fa0',
                trailWidth: 8,
                orbitEffect: true
            },
            // 圣经
            'bible': {
                range: 100,
                arcAngle: 360,
                sweepTime: 1.0,
                color: '#fd4',
                glowColor: '#fa0',
                trailWidth: 6,
                orbitEffect: true,
                knockback: true
            }
        };

        // 区域效果配置
        this.areaConfigs = {
            // 圣水
            'holy_water': {
                radius: 80,
                duration: 4,
                tickRate: 0.5,
                color: '#48f',
                glowColor: '#8cf',
                rippleEffect: true
            },
            // 大蒜/光环
            'aura': {
                radius: 100,
                tickRate: 0.3,
                color: '#8f8',
                glowColor: '#4f4',
                pulseEffect: true
            }
        };
    }

    /**
     * 获取投射物配置
     * @param {string} subtype 
     * @returns {Object}
     */
    getProjectileConfig(subtype) {
        return this.projectileConfigs[subtype] || this.projectileConfigs['default'];
    }

    /**
     * 获取近战武器配置
     * @param {string} weaponKey 
     * @returns {Object|null}
     */
    getMeleeConfig(weaponKey) {
        return this.meleeConfigs[weaponKey] || null;
    }

    /**
     * 获取区域效果配置
     * @param {string} subtype 
     * @returns {Object|null}
     */
    getAreaConfig(subtype) {
        return this.areaConfigs[subtype] || this.areaConfigs['holy_water'];
    }

    /**
     * 计算投射物精确碰撞箱
     * @param {Object} bullet - 子弹对象
     * @returns {Object} {x, y, radius} 或 {x, y, width, height}
     */
    getProjectileHitbox(bullet) {
        const config = this.getProjectileConfig(bullet.subtype);
        
        // 如果是矩形投射物（飞刀、冰锥等）
        if (config.width && config.height) {
            return {
                type: 'rect',
                x: bullet.x - config.width / 2,
                y: bullet.y - config.height / 2,
                width: config.width,
                height: config.height,
                angle: bullet.angle || 0
            };
        }
        
        // 圆形投射物
        return {
            type: 'circle',
            x: bullet.x,
            y: bullet.y,
            radius: config.radius
        };
    }

    /**
     * 检测投射物与敌人的碰撞
     * @param {Object} bullet 
     * @param {Object} enemy 
     * @returns {boolean}
     */
    checkCollision(bullet, enemy) {
        const hitbox = this.getProjectileHitbox(bullet);
        
        if (hitbox.type === 'circle') {
            // 圆形碰撞检测
            return enemy.intersectsCircle(hitbox.x, hitbox.y, hitbox.radius);
        } else {
            // 矩形碰撞检测（考虑旋转）
            return this.checkRectCircleCollision(
                hitbox, 
                { x: enemy.x, y: enemy.y - (enemy.size || 24) * 0.5 }, 
                (enemy.size || 24) * 0.5
            );
        }
    }

    /**
     * 矩形与圆的碰撞检测
     * @param {Object} rect - {x, y, width, height, angle}
     * @param {Object} circle - {x, y}
     * @param {number} radius 
     * @returns {boolean}
     */
    checkRectCircleCollision(rect, circle, radius) {
        // 简化处理：使用AABB包围盒
        const halfW = rect.width / 2;
        const halfH = rect.height / 2;
        
        // 找到矩形上离圆心最近的点
        const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
        const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
        
        const dx = circle.x - closestX;
        const dy = circle.y - closestY;
        
        return (dx * dx + dy * dy) <= (radius * radius);
    }

    /**
     * 获取渲染参数
     * @param {Object} bullet 
     * @returns {Object}
     */
    getRenderParams(bullet) {
        const config = this.getProjectileConfig(bullet.subtype);
        
        return {
            radius: config.renderRadius,
            color: config.color,
            glowColor: config.glowColor,
            glowSize: config.glowSize,
            hasTrail: config.hasTrail,
            width: config.width,
            height: config.height,
            rotationSpeed: config.rotationSpeed || 0
        };
    }
}

// 创建全局实例
if (typeof window !== 'undefined') {
    window.weaponSpriteData = new WeaponSpriteData();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WeaponSpriteData;
}
