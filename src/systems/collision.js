/**
 * 碰撞系统 - CollisionSystem v0.14.1
 * 硬边界碰撞 - 限制移动而非推开
 */

class CollisionSystem {
    constructor() {
        // 碰撞层定义
        this.layers = {
            PLAYER: 'player',
            ENEMY: 'enemy',
            NPC: 'npc',
            WALL: 'wall'
        };
        
        // 尺寸配置（基于新的贴图大小）
        this.sizeConfig = {
            player: { visual: 48, physics: 20 },      // 玩家 48x48
            t1_small: { visual: 36, physics: 14 },    // T1小型 36x36
            t1_medium: { visual: 44, physics: 18 },   // T1中型 44x44
            t2: { visual: 52, physics: 22 },          // T2精英 52x52
            t3: { visual: 68, physics: 28 },          // T3小Boss 68x68
            t4: { visual: 88, physics: 36 },          // T4 Boss 88x88
            npc: { visual: 100, physics: 45 }         // NPC盲眼
        };
    }

    /**
     * 获取实体的碰撞半径
     * @param {Object} entity - 实体对象
     */
    getRadius(entity) {
        // NPC特殊处理
        if (entity.typeKey === 'shopNPC' || entity.isNPC) {
            return this.sizeConfig.npc.physics;
        }
        
        // Boss
        if (entity.isBoss || entity.tier === 4) {
            return this.sizeConfig.t4.physics;
        }
        
        // T3
        if (entity.tier === 3) {
            return this.sizeConfig.t3.physics;
        }
        
        // T2
        if (entity.tier === 2) {
            return this.sizeConfig.t2.physics;
        }
        
        // 玩家
        if (entity.isPlayer || entity.lv !== undefined) {
            return this.sizeConfig.player.physics;
        }
        
        // T1 - 根据类型区分大小
        const smallTypes = ['chick', 'mouse', 'bat'];
        if (smallTypes.includes(entity.typeKey)) {
            return this.sizeConfig.t1_small.physics;
        }
        return this.sizeConfig.t1_medium.physics;
    }

    /**
     * 计算两实体间的距离
     */
    getDistance(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * 检查移动是否会碰撞，返回限制后的位置
     * @param {Object} mover - 移动的实体
     * @param {number} newX - 目标X
     * @param {number} newY - 目标Y
     * @param {Object} obstacle - 障碍物实体
     * @returns {Object} {x, y, collided} - 限制后的位置和是否碰撞
     */
    limitMovement(mover, newX, newY, obstacle) {
        const moverRadius = this.getRadius(mover);
        const obstacleRadius = this.getRadius(obstacle);
        const minDist = moverRadius + obstacleRadius;
        
        const dx = newX - obstacle.x;
        const dy = newY - obstacle.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist >= minDist) {
            // 没有碰撞，可以移动
            return { x: newX, y: newY, collided: false };
        }
        
        // 会碰撞，限制在边界上
        if (dist === 0) {
            // 完全重叠，保持原位
            return { x: mover.x, y: mover.y, collided: true };
        }
        
        // 计算边界位置
        const ratio = minDist / dist;
        const limitedX = obstacle.x + dx * ratio;
        const limitedY = obstacle.y + dy * ratio;
        
        return { x: limitedX, y: limitedY, collided: true };
    }

    /**
     * 限制玩家移动 - 检查与所有敌人和NPC的碰撞
     * @param {Object} player - 玩家
     * @param {number} newX - 目标X
     * @param {number} newY - 目标Y
     * @param {Array} enemies - 敌人数组
     * @param {Object} npc - NPC对象
     * @returns {Object} {x, y} - 限制后的位置
     */
    restrictPlayerMovement(player, newX, newY, enemies, npc) {
        let finalX = newX;
        let finalY = newY;
        
        // 检查与敌人的碰撞
        for (const enemy of enemies) {
            if (enemy.hp <= 0) continue;
            
            const result = this.limitMovement(player, finalX, finalY, enemy);
            if (result.collided) {
                finalX = result.x;
                finalY = result.y;
            }
        }
        
        // 检查与NPC的碰撞
        if (npc) {
            const result = this.limitMovement(player, finalX, finalY, npc);
            if (result.collided) {
                finalX = result.x;
                finalY = result.y;
            }
        }
        
        return { x: finalX, y: finalY };
    }

    /**
     * 限制敌人移动 - 检查与玩家和其他敌人的碰撞
     * @param {Object} enemy - 移动的敌人
     * @param {number} newX - 目标X
     * @param {number} newY - 目标Y
     * @param {Object} player - 玩家
     * @param {Array} allEnemies - 所有敌人
     * @returns {Object} {x, y} - 限制后的位置
     */
    restrictEnemyMovement(enemy, newX, newY, player, allEnemies) {
        let finalX = newX;
        let finalY = newY;
        
        // 检查与玩家的碰撞
        const playerResult = this.limitMovement(enemy, finalX, finalY, player);
        if (playerResult.collided) {
            finalX = playerResult.x;
            finalY = playerResult.y;
        }
        
        // 检查与其他敌人的碰撞
        for (const other of allEnemies) {
            if (other === enemy || other.hp <= 0) continue;
            
            const result = this.limitMovement(enemy, finalX, finalY, other);
            if (result.collided) {
                finalX = result.x;
                finalY = result.y;
            }
        }
        
        return { x: finalX, y: finalY };
    }

    /**
     * 检查玩家是否进入敌人攻击范围（触碰伤害）
     * @param {Object} player - 玩家对象
     * @param {Object} enemy - 敌人对象
     * @returns {boolean}
     */
    isPlayerInHitRange(player, enemy) {
        // 使用伤害判定距离（比碰撞距离大）
        const playerHitRadius = this.getRadius(player) * 1.4;  // 140% 物理半径
        const enemyHitRadius = this.getRadius(enemy) * 1.4;
        const dist = this.getDistance(player, enemy);
        return dist < (playerHitRadius + enemyHitRadius);
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CollisionSystem };
}
