/**
 * 碰撞系统 - CollisionSystem v2.0
 * 分层碰撞检测: AABB快速剔除 → 精确碰撞箱 → 像素级(可选)
 * 
 * 核心原则:
 * 1. 所有实体使用 feet(脚底) 作为世界坐标原点
 * 2. 碰撞检测使用 SpriteData.getHitbox() 获取精确AABB
 * 3. 分层检测减少计算量
 */

class CollisionSystem {
    constructor() {
        this.debug = false;
        
        // 统计信息
        this.stats = {
            aabbChecks: 0,
            hitboxChecks: 0,
            pixelChecks: 0,
            collisions: 0
        };
        
        // 空间分区配置
        this.spatialGrid = null;
        this.gridSize = 100; // 每个格子100x100像素
    }
    
    /**
     * 重置统计
     */
    resetStats() {
        this.stats = {
            aabbChecks: 0,
            hitboxChecks: 0,
            pixelChecks: 0,
            collisions: 0
        };
    }
    
    /**
     * 获取实体的碰撞箱
     * @param {Object} entity - 必须有 x,y(脚底), spriteData
     * @returns {Object} {x, y, width, height, cx, cy}
     */
    getHitbox(entity) {
        const scale = this.getEntityCollisionScale(entity);
        if (entity.spriteData) {
            // 贴图边界即碰撞边界（完整 bounds）
            const fullBounds = this.getSpriteBoundsHitbox(entity, scale);
            if (fullBounds) return fullBounds;

            // 回退：使用 SpriteData 内置碰撞箱
            if (typeof entity.spriteData.getHitbox === 'function') {
                return entity.spriteData.getHitbox(entity.x, entity.y, scale);
            }
        }
        
        // 回退: 基于size的估算
        const size = entity.size || 24;
        const scaledSize = size * scale;
        
        return {
            x: entity.x - scaledSize / 2,
            y: entity.y - scaledSize,
            width: scaledSize,
            height: scaledSize,
            cx: entity.x,
            cy: entity.y - scaledSize / 2
        };
    }

    getEntityCollisionScale(entity) {
        if (!entity || typeof entity !== 'object') return 1;
        if (Number.isFinite(entity.collisionScale) && entity.collisionScale > 0) {
            return entity.collisionScale;
        }
        if (typeof entity.getCollisionScale === 'function') {
            const s = entity.getCollisionScale(window.game?.sprites);
            if (Number.isFinite(s) && s > 0) return s;
        }
        if (typeof entity.getRenderScale === 'function') {
            const s = entity.getRenderScale(window.game?.sprites);
            if (Number.isFinite(s) && s > 0) return s;
        }
        if (Number.isFinite(entity.scale) && entity.scale > 0) {
            return entity.scale;
        }
        return 1;
    }

    getSpriteBoundsHitbox(entity, scale = 1) {
        const sd = entity.spriteData;
        if (!sd || !sd.bounds || !sd.anchor || !sd.anchor.feet) return null;

        const bounds = sd.bounds;
        const feet = sd.anchor.feet;
        const modelW = bounds.width * scale;
        const modelH = bounds.height * scale;

        const offsetX = (bounds.x - feet.x) * scale;
        const offsetY = (bounds.y - feet.y) * scale;

        const x = entity.x + offsetX;
        const y = entity.y + offsetY;
        return {
            x,
            y,
            width: modelW,
            height: modelH,
            cx: x + modelW / 2,
            cy: y + modelH / 2
        };
    }
    
    /**
     * AABB碰撞检测 (最快)
     */
    aabbIntersect(a, b) {
        this.stats.aabbChecks++;
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }
    
    /**
     * 检测两个实体是否碰撞
     */
    checkCollision(entityA, entityB) {
        const boxA = this.getHitbox(entityA);
        const boxB = this.getHitbox(entityB);
        
        // 步骤1: AABB快速剔除
        if (!this.aabbIntersect(boxA, boxB)) {
            return false;
        }
        
        this.stats.hitboxChecks++;
        this.stats.collisions++;
        return true;
    }
    
    /**
     * 检查玩家是否在敌人攻击范围内 (触碰伤害)
     */
    isPlayerInHitRange(player, enemy) {
        const boxA = this.getHitbox(player);
        const boxB = this.getHitbox(enemy);
        const padding = Number.isFinite(enemy?.contactDamagePadding) ? enemy.contactDamagePadding : 6;

        this.stats.aabbChecks++;
        if (
            boxA.x < boxB.x + boxB.width + padding &&
            boxA.x + boxA.width > boxB.x - padding &&
            boxA.y < boxB.y + boxB.height + padding &&
            boxA.y + boxA.height > boxB.y - padding
        ) {
            this.stats.hitboxChecks++;
            this.stats.collisions++;
            return true;
        }

        // 回退：中心点圆形检测，覆盖贴图锚点不一致导致的“看起来接触但AABB未重叠”
        const pa = this.getEntityCenterAndRadius(player, boxA);
        const pb = this.getEntityCenterAndRadius(enemy, boxB);
        const dx = pa.cx - pb.cx;
        const dy = pa.cy - pb.cy;
        const hitRange = pa.radius + pb.radius + padding;
        if ((dx * dx + dy * dy) <= (hitRange * hitRange)) {
            this.stats.hitboxChecks++;
            this.stats.collisions++;
            return true;
        }
        return false;
    }

    getEntityCenterAndRadius(entity, box) {
        const cx = Number.isFinite(entity?.cx) ? entity.cx : (box.cx ?? (box.x + box.width / 2));
        let cy = box.cy ?? (box.y + box.height / 2);
        if (typeof entity?.getCenterY === 'function') {
            const customCy = entity.getCenterY();
            if (Number.isFinite(customCy)) cy = customCy;
        } else if (Number.isFinite(entity?.cy)) {
            cy = entity.cy;
        }

        let radius = Math.min(box.width, box.height) * 0.5;
        if (typeof entity?.getCollisionRadius === 'function') {
            const r = entity.getCollisionRadius();
            if (Number.isFinite(r) && r > 0) radius = r;
        }

        return { cx, cy, radius };
    }
    
    /**
     * 批量检测: 实体与列表中所有对象的碰撞
     * @returns {Array} 碰撞的对象列表
     */
    checkCollisionsWithList(entity, list) {
        const collisions = [];
        for (const other of list) {
            if (other === entity) continue;
            if (other.hp !== undefined && other.hp <= 0) continue; // 跳过已死亡
            
            if (this.checkCollision(entity, other)) {
                collisions.push(other);
            }
        }
        return collisions;
    }
    
    /**
     * 限制移动: 检查并防止穿过其他实体
     */
    restrictMovement(mover, newX, newY, obstacles) {
        // 测试新位置
        const testMover = { ...mover, x: newX, y: newY };
        const moverBox = this.getHitbox(testMover);
        
        let finalX = newX;
        let finalY = newY;
        let collided = false;
        
        for (const obstacle of obstacles) {
            if (obstacle === mover) continue;
            if (obstacle.hp !== undefined && obstacle.hp <= 0) continue;
            
            const obstacleBox = this.getHitbox(obstacle);
            
            if (this.aabbIntersect(moverBox, obstacleBox)) {
                collided = true;
                
                // 计算最小分离向量
                const overlapX = Math.min(
                    moverBox.x + moverBox.width - obstacleBox.x,
                    obstacleBox.x + obstacleBox.width - moverBox.x
                );
                const overlapY = Math.min(
                    moverBox.y + moverBox.height - obstacleBox.y,
                    obstacleBox.y + obstacleBox.height - moverBox.y
                );
                
                // 沿最小重叠方向分离
                if (overlapX < overlapY) {
                    finalX += (mover.x < obstacle.x) ? -overlapX : overlapX;
                } else {
                    finalY += (mover.y < obstacle.y) ? -overlapY : overlapY;
                }
                
                // 更新moverBox为调整后的位置
                testMover.x = finalX;
                testMover.y = finalY;
                const newBox = this.getHitbox(testMover);
                moverBox.x = newBox.x;
                moverBox.y = newBox.y;
            }
        }
        
        return { x: finalX, y: finalY, collided };
    }

    restrictMovementAgainstShopTable(mover, newX, newY, npc) {
        const cfg = npc?.tableCollision;
        if (!cfg) return { x: newX, y: newY, collided: false };

        const moverBox = this.getHitbox({ ...mover, x: newX, y: newY });
        const moverRadius = Math.max(16, Math.max(moverBox.width * 0.45, moverBox.height * 0.3));
        const halfWidth = cfg.halfWidth + moverRadius + (cfg.padding || 0);
        const halfHeight = cfg.halfHeight + moverRadius + (cfg.padding || 0);
        const centerX = npc.x + (cfg.centerOffsetX || 0);
        const centerY = npc.y + (cfg.centerOffsetY || 0);

        const dx = newX - centerX;
        const dy = newY - centerY;
        const nx = Math.abs(dx) / Math.max(1, halfWidth);
        const ny = Math.abs(dy) / Math.max(1, halfHeight);
        const diamondDistance = nx + ny;

        if (diamondDistance >= 1) {
            return { x: newX, y: newY, collided: false };
        }

        const prevX = Number.isFinite(mover?.x) ? mover.x : newX;
        const prevY = Number.isFinite(mover?.y) ? mover.y : newY;
        const moveDx = newX - prevX;
        const moveDy = newY - prevY;
        const signX = Math.sign(dx) || Math.sign(moveDx) || Math.sign(prevX - centerX) || 1;
        const signY = Math.sign(dy) || Math.sign(moveDy) || Math.sign(prevY - centerY) || 1;
        const yRatio = Math.min(0.999, Math.abs(dy) / Math.max(1, halfHeight));
        const xRatio = Math.min(0.999, Math.abs(dx) / Math.max(1, halfWidth));
        const edgePadding = 4;

        const candidateX = {
            x: centerX + signX * (halfWidth * Math.max(0.08, 1 - yRatio) + edgePadding),
            y: newY
        };
        const candidateY = {
            x: newX,
            y: centerY + signY * (halfHeight * Math.max(0.08, 1 - xRatio) + edgePadding)
        };
        const chooseX = Math.hypot(candidateX.x - newX, candidateX.y - newY) <= Math.hypot(candidateY.x - newX, candidateY.y - newY);
        const safeX = chooseX ? candidateX.x : candidateY.x;
        const safeY = chooseX ? candidateX.y : candidateY.y;

        return {
            x: safeX,
            y: safeY,
            collided: true
        };
    }
    
    /**
     * 限制玩家移动
     */
    restrictPlayerMovement(player, newX, newY, enemies, npc) {
        const obstacles = [...enemies];
        let result = this.restrictMovement(player, newX, newY, obstacles);

        if (npc?.isShopTableObstacle) {
            result = this.restrictMovementAgainstShopTable(player, result.x, result.y, npc);
        } else if (npc) {
            result = this.restrictMovement(player, result.x, result.y, [npc]);
        }

        return result;
    }
    
    /**
     * 限制敌人移动
     * @param {Object} enemy - 敌人
     * @param {number} newX, newY - 目标位置
     * @param {Object} player - 玩家
     * @param {Array} allEnemies - 所有敌人
     * @returns {Object} {x, y}
     */
    restrictEnemyMovement(enemy, newX, newY, player, allEnemies) {
        // 构建障碍物列表（玩家+其他敌人）
        const obstacles = [player];
        for (const other of allEnemies) {
            if (other !== enemy && other.hp > 0) {
                obstacles.push(other);
            }
        }
        return this.restrictMovement(enemy, newX, newY, obstacles);
    }
    
    /**
     * 检测点是否在实体碰撞箱内
     */
    pointInEntity(x, y, entity) {
        const box = this.getHitbox(entity);
        return x >= box.x && x <= box.x + box.width &&
               y >= box.y && y <= box.y + box.height;
    }
    
    /**
     * 空间分区: 构建网格加速碰撞检测
     */
    buildSpatialGrid(entities) {
        this.spatialGrid = new Map();
        
        for (const entity of entities) {
            if (entity.hp !== undefined && entity.hp <= 0) continue;
            
            const box = this.getHitbox(entity);
            const minGridX = Math.floor(box.x / this.gridSize);
            const maxGridX = Math.floor((box.x + box.width) / this.gridSize);
            const minGridY = Math.floor(box.y / this.gridSize);
            const maxGridY = Math.floor((box.y + box.height) / this.gridSize);
            
            // 将实体添加到所有重叠的格子
            for (let gx = minGridX; gx <= maxGridX; gx++) {
                for (let gy = minGridY; gy <= maxGridY; gy++) {
                    const key = `${gx},${gy}`;
                    if (!this.spatialGrid.has(key)) {
                        this.spatialGrid.set(key, []);
                    }
                    this.spatialGrid.get(key).push(entity);
                }
            }
        }
    }
    
    /**
     * 使用空间分区检测碰撞
     */
    checkCollisionsSpatial(entity, allEntities) {
        if (!this.spatialGrid) {
            return this.checkCollisionsWithList(entity, allEntities);
        }
        
        const box = this.getHitbox(entity);
        const gridX = Math.floor(box.x / this.gridSize);
        const gridY = Math.floor(box.y / this.gridSize);
        
        // 只检测同一格子的实体
        const key = `${gridX},${gridY}`;
        const candidates = this.spatialGrid.get(key) || [];
        
        return this.checkCollisionsWithList(entity, candidates);
    }
    
    /**
     * 渲染调试信息
     */
    renderDebug(ctx, entity, color = '#0f0') {
        if (!this.debug) return;
        
        const box = this.getHitbox(entity);
        
        ctx.save();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.strokeRect(box.x, box.y, box.width, box.height);
        
        // 中心点
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(box.cx, box.cy, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // 尺寸标注
        ctx.fillStyle = '#fff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`${Math.round(box.width)}x${Math.round(box.height)}`, 
                     box.cx, box.y - 5);

        if (entity?.isShopTableObstacle && entity?.tableCollision) {
            const cfg = entity.tableCollision;
            const centerX = entity.x + (cfg.centerOffsetX || 0);
            const centerY = entity.y + (cfg.centerOffsetY || 0);
            const halfWidth = cfg.halfWidth + (cfg.padding || 0);
            const halfHeight = cfg.halfHeight + (cfg.padding || 0);

            ctx.fillStyle = 'rgba(0, 255, 255, 0.16)';
            ctx.beginPath();
            ctx.moveTo(centerX, centerY - halfHeight);
            ctx.lineTo(centerX + halfWidth, centerY);
            ctx.lineTo(centerX, centerY + halfHeight);
            ctx.lineTo(centerX - halfWidth, centerY);
            ctx.closePath();
            ctx.fill();

            ctx.strokeStyle = '#00ffff';
            ctx.lineWidth = 3;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.moveTo(centerX, centerY - halfHeight);
            ctx.lineTo(centerX + halfWidth, centerY);
            ctx.lineTo(centerX, centerY + halfHeight);
            ctx.lineTo(centerX - halfWidth, centerY);
            ctx.closePath();
            ctx.stroke();

            ctx.setLineDash([]);
            ctx.fillStyle = '#f6f';
            ctx.beginPath();
            ctx.arc(centerX, centerY, 3, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#00ffff';
            ctx.font = 'bold 11px Arial';
            ctx.fillText(`商店桌台菱形 ${Math.round(halfWidth)}x${Math.round(halfHeight)}`, centerX, centerY - halfHeight - 10);
        }

        ctx.restore();
    }
    
    /**
     * 渲染网格调试
     */
    renderGridDebug(ctx) {
        if (!this.debug || !this.spatialGrid) return;
        
        ctx.save();
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
        ctx.lineWidth = 1;
        
        // 绘制所有有内容的格子
        for (const [key, entities] of this.spatialGrid) {
            if (entities.length === 0) continue;
            
            const [gx, gy] = key.split(',').map(Number);
            const x = gx * this.gridSize;
            const y = gy * this.gridSize;
            
            ctx.strokeRect(x, y, this.gridSize, this.gridSize);
            
            // 标注实体数量
            ctx.fillStyle = 'rgba(255, 255, 0, 0.5)';
            ctx.font = '12px Arial';
            ctx.fillText(entities.length, x + 5, y + 15);
        }
        
        ctx.restore();
    }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CollisionSystem };
}
