/**
 * ItemSpriteData.js - 物品和拾取系统 SpriteData 管理
 * 优化经验宝石、金币、道具的渲染和拾取范围
 */

class ItemSpriteData {
    constructor() {
        // 物品基础配置
        this.itemConfigs = {
            // 经验宝石
            'gem_blue': {
                size: 12,
                pickupRadius: 20,
                renderSize: 16,
                bounceHeight: 20,
                bounceDuration: 0.5,
                color: '#48f',
                glowColor: '#8cf',
                glowSize: 8,
                magnetRadius: 150
            },
            'gem_green': {
                size: 14,
                pickupRadius: 22,
                renderSize: 18,
                bounceHeight: 25,
                bounceDuration: 0.5,
                color: '#4a4',
                glowColor: '#8f8',
                glowSize: 10,
                magnetRadius: 150
            },
            'gem_red': {
                size: 16,
                pickupRadius: 25,
                renderSize: 20,
                bounceHeight: 30,
                bounceDuration: 0.5,
                color: '#f44',
                glowColor: '#f88',
                glowSize: 12,
                magnetRadius: 150
            },
            'gem_gold': {
                size: 18,
                pickupRadius: 28,
                renderSize: 24,
                bounceHeight: 35,
                bounceDuration: 0.5,
                color: '#fc0',
                glowColor: '#fd4',
                glowSize: 15,
                magnetRadius: 200
            },
            
            // 金币
            'coin_gold': {
                size: 10,
                pickupRadius: 18,
                renderSize: 14,
                bounceHeight: 20,
                bounceDuration: 0.5,
                color: '#fc0',
                glowColor: '#fd4',
                glowSize: 6,
                magnetRadius: 120
            },
            'coin_silver': {
                size: 9,
                pickupRadius: 16,
                renderSize: 12,
                bounceHeight: 18,
                bounceDuration: 0.5,
                color: '#ccc',
                glowColor: '#eee',
                glowSize: 5,
                magnetRadius: 120
            },
            
            // 道具
            'item_potion': {
                size: 16,
                pickupRadius: 25,
                renderSize: 20,
                bounceHeight: 15,
                bounceDuration: 0.3,
                color: '#f48',
                glowColor: '#f8c',
                glowSize: 10,
                magnetRadius: 100
            },
            'item_chest': {
                size: 24,
                pickupRadius: 35,
                renderSize: 32,
                bounceHeight: 0,
                bounceDuration: 0,
                color: '#c84',
                glowColor: '#fc4',
                glowSize: 15,
                magnetRadius: 80
            }
        };

        // 拾取动画配置
        this.pickupAnimation = {
            duration: 0.3,
            scaleStart: 1.0,
            scaleEnd: 1.5,
            alphaStart: 1.0,
            alphaEnd: 0.0,
            moveUpDistance: 30
        };

        // 磁铁吸引配置
        this.magnetConfig = {
            minSpeed: 200,
            maxSpeed: 800,
            acceleration: 2000
        };
    }

    /**
     * 获取物品配置
     * @param {string} itemType 
     * @returns {Object}
     */
    getConfig(itemType) {
        return this.itemConfigs[itemType] || this.itemConfigs['gem_blue'];
    }

    /**
     * 计算拾取范围（考虑玩家拾取范围加成）
     * @param {string} itemType 
     * @param {number} playerPickupRange - 玩家拾取范围加成 (0-1)
     * @returns {number}
     */
    getPickupRadius(itemType, playerPickupRange = 0) {
        const config = this.getConfig(itemType);
        return config.pickupRadius * (1 + playerPickupRange);
    }

    /**
     * 计算磁铁吸引范围
     * @param {string} itemType 
     * @param {number} playerMagnetRange - 玩家磁铁范围加成
     * @returns {number}
     */
     getMagnetRadius(itemType, playerMagnetRange = 0) {
        const config = this.getConfig(itemType);
        return config.magnetRadius * (1 + playerMagnetRange);
    }

    /**
     * 计算弹跳偏移
     * @param {string} itemType 
     * @param {number} spawnTime - 已生成时间
     * @returns {number} Y轴偏移
     */
    getBounceOffset(itemType, spawnTime) {
        const config = this.getConfig(itemType);
        
        if (spawnTime >= config.bounceDuration) {
            return 0;
        }
        
        const progress = spawnTime / config.bounceDuration;
        return -Math.sin(progress * Math.PI) * config.bounceHeight;
    }

    /**
     * 检测物品与玩家的碰撞/拾取
     * @param {Object} item - {x, y, type}
     * @param {Object} player - {x, y, pickupRange}
     * @returns {boolean}
     */
    canPickup(item, player) {
        const pickupRadius = this.getPickupRadius(item.type, player.pickupRange || 0);
        
        const dx = item.x - player.x;
        const dy = item.y - player.y;
        const distanceSq = dx * dx + dy * dy;
        
        return distanceSq <= (pickupRadius * pickupRadius);
    }

    /**
     * 计算磁铁吸引速度
     * @param {Object} item 
     * @param {Object} player 
     * @param {number} dt - 时间增量
     * @returns {Object} {vx, vy}
     */
    calculateMagnetVelocity(item, player, dt) {
        const magnetRadius = this.getMagnetRadius(item.type, player.magnetRange || 0);
        
        const dx = player.x - item.x;
        const dy = player.y - item.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > magnetRadius || distance < 1) {
            return { vx: 0, vy: 0 };
        }
        
        // 距离越近速度越快
        const attractionStrength = 1 - (distance / magnetRadius);
        const speed = this.magnetConfig.minSpeed + 
                      (this.magnetConfig.maxSpeed - this.magnetConfig.minSpeed) * attractionStrength;
        
        return {
            vx: (dx / distance) * speed,
            vy: (dy / distance) * speed
        };
    }

    /**
     * 获取渲染参数
     * @param {string} itemType 
     * @returns {Object}
     */
    getRenderParams(itemType) {
        const config = this.getConfig(itemType);
        
        return {
            size: config.renderSize,
            color: config.color,
            glowColor: config.glowColor,
            glowSize: config.glowSize,
            hasBounce: config.bounceHeight > 0
        };
    }

    /**
     * 获取拾取动画参数
     * @param {number} progress - 0-1
     * @returns {Object} {scale, alpha, offsetY}
     */
    getPickupAnimation(progress) {
        const anim = this.pickupAnimation;
        
        // 缓动函数
        const easeOut = (t) => 1 - Math.pow(1 - t, 3);
        const eased = easeOut(progress);
        
        return {
            scale: anim.scaleStart + (anim.scaleEnd - anim.scaleStart) * eased,
            alpha: anim.alphaStart + (anim.alphaEnd - anim.alphaStart) * eased,
            offsetY: -anim.moveUpDistance * eased
        };
    }

    /**
     * 批量检测拾取
     * @param {Array} items 
     * @param {Object} player 
     * @returns {Array} 可拾取的物品索引
     */
    checkBatchPickup(items, player) {
        const pickupIndices = [];
        
        for (let i = 0; i < items.length; i++) {
            if (this.canPickup(items[i], player)) {
                pickupIndices.push(i);
            }
        }
        
        return pickupIndices;
    }

    /**
     * 优化物品渲染批次
     * @param {Array} items 
     * @param {Camera} camera 
     * @returns {Array} 可见的物品
     */
    cullItems(items, camera) {
        return items.filter(item => {
            // 使用物品的实际大小作为可见性检测
            const config = this.getConfig(item.type);
            return camera.isVisible(item.x, item.y, config.renderSize);
        });
    }
}

// 创建全局实例
if (typeof window !== 'undefined') {
    window.itemSpriteData = new ItemSpriteData();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ItemSpriteData;
}
