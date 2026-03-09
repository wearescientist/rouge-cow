/**
 * SpriteBatchRenderer.js - 批量精灵渲染器
 * 减少 Canvas 状态切换，提升渲染性能
 * 
 * 使用场景：大量相同类型的敌人、粒子、特效
 */

class SpriteBatchRenderer {
    constructor() {
        this.batches = new Map(); // key -> { sprite, entities: [] }
        this.maxBatchSize = 1000;
    }

    /**
     * 添加实体到批次
     * @param {string} key - 批次键（通常是精灵名）
     * @param {HTMLImageElement} sprite - 精灵贴图
     * @param {Object} entity - 实体数据 {x, y, scale, frame, flipX, alpha}
     * @param {SpriteData} spriteData - 可选的 SpriteData
     */
    add(key, sprite, entity, spriteData = null) {
        if (!this.batches.has(key)) {
            this.batches.set(key, {
                sprite: sprite,
                spriteData: spriteData,
                entities: []
            });
        }
        
        const batch = this.batches.get(key);
        batch.entities.push(entity);
        
        // 如果 SpriteData 未设置但提供了，更新它
        if (!batch.spriteData && spriteData) {
            batch.spriteData = spriteData;
        }
    }

    /**
     * 渲染所有批次
     * @param {CanvasRenderingContext2D} ctx 
     * @param {Camera} camera 
     */
    render(ctx, camera) {
        for (const [key, batch] of this.batches) {
            if (batch.entities.length === 0) continue;
            
            ctx.save();
            
            // 批量渲染相同贴图
            for (const entity of batch.entities) {
                if (!camera.isVisible(entity.x, entity.y, entity.renderSize || 32)) continue;
                
                const pos = camera.worldToScreen(entity.x, entity.y);
                const scale = entity.scale || 1;
                const alpha = entity.alpha !== undefined ? entity.alpha : 1;
                
                ctx.globalAlpha = alpha;
                
                // 水平翻转
                if (entity.flipX) {
                    ctx.save();
                    ctx.translate(pos.x, pos.y);
                    ctx.scale(-1, 1);
                    ctx.translate(-pos.x, -pos.y);
                }
                
                // 使用 SpriteData 计算精确位置
                if (batch.spriteData) {
                    const renderScale = scale;
                    const drawParams = batch.spriteData.getFrameDrawParams(
                        entity.frame || 0,
                        pos.x, pos.y,
                        renderScale,
                        'feet'
                    );
                    
                    ctx.drawImage(
                        batch.sprite,
                        drawParams.frameX, drawParams.frameY,
                        drawParams.frameW, drawParams.frameH,
                        drawParams.x, drawParams.y,
                        drawParams.frameW * renderScale,
                        drawParams.frameH * renderScale
                    );
                } else {
                    // 简单渲染
                    const size = (entity.renderSize || 32) * scale;
                    ctx.drawImage(
                        batch.sprite,
                        pos.x - size / 2, pos.y - size,
                        size, size
                    );
                }
                
                if (entity.flipX) {
                    ctx.restore();
                }
            }
            
            ctx.restore();
        }
        
        // 清空批次
        this.clear();
    }

    /**
     * 渲染特定批次（带描边效果）
     * @param {CanvasRenderingContext2D} ctx 
     * @param {string} key - 批次键
     * @param {Object} options - { outlineColor, outlineWidth }
     */
    renderWithOutline(ctx, key, options = {}) {
        const batch = this.batches.get(key);
        if (!batch || batch.entities.length === 0) return;
        
        const outlineColor = options.outlineColor || 'black';
        const outlineWidth = options.outlineWidth || 4;
        
        ctx.save();
        
        // 先绘制描边
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = outlineColor;
        
        for (const entity of batch.entities) {
            // 简化的描边：绘制偏移的实体
            for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 4) {
                const ox = Math.cos(angle) * outlineWidth;
                const oy = Math.sin(angle) * outlineWidth;
                
                ctx.drawImage(
                    batch.sprite,
                    entity.x + ox, entity.y + oy,
                    entity.renderSize || 32,
                    entity.renderSize || 32
                );
            }
        }
        
        // 再绘制实体
        ctx.globalCompositeOperation = 'source-atop';
        for (const entity of batch.entities) {
            ctx.drawImage(
                batch.sprite,
                entity.x, entity.y,
                entity.renderSize || 32,
                entity.renderSize || 32
            );
        }
        
        ctx.restore();
    }

    /**
     * 清空所有批次
     */
    clear() {
        this.batches.clear();
    }

    /**
     * 获取批次统计
     * @returns {Object} { totalEntities, batchCount }
     */
    getStats() {
        let totalEntities = 0;
        for (const batch of this.batches.values()) {
            totalEntities += batch.entities.length;
        }
        return {
            totalEntities,
            batchCount: this.batches.size
        };
    }
}

// 创建全局实例
if (typeof window !== 'undefined') {
    window.spriteBatchRenderer = new SpriteBatchRenderer();
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpriteBatchRenderer;
}
