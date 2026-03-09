/**
 * RenderSystem - 渲染系统 v2
 * 支持纹理、动画、光照效果
 */

class RenderSystem {
    constructor(world, canvas) {
        this.world = world;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.priority = 100;
        this.enabled = true;
        
        // 相机引用
        this.camera = null;
        
        // 纹理缓存
        this.textures = new Map();
        
        // 动画帧缓存
        this.animationFrames = new Map();
        
        // 渲染统计
        this.stats = {
            drawCalls: 0,
            entityCount: 0
        };
        
        // 视口裁剪
        this.cullingEnabled = true;
        this.cullingMargin = 100;
        
        // 光照效果
        this.lightingEnabled = true;
        this.ambientLight = 0.3;
        this.lights = [];
    }
    
    init() {
        this.camera = this.world.getSystem(CameraSystem);
        
        // 创建默认纹理
        this.createDefaultTextures();
        
        // 创建光照缓存画布（性能优化）
        this.lightCanvas = document.createElement('canvas');
        this.lightCanvas.width = this.canvas.width;
        this.lightCanvas.height = this.canvas.height;
        this.lightCtx = this.lightCanvas.getContext('2d');
    }
    
    /**
     * 创建默认纹理
     */
    createDefaultTextures() {
        // 创建彩色方块作为后备纹理
        const colors = {
            'player': '#4f4',
            'enemy': '#f44',
            'boss': '#a0f',
            'projectile': '#ff0',
            'item': '#48f',
            'wall': '#666',
            'obstacle': '#844'
        };
        
        for (const [name, color] of Object.entries(colors)) {
            const canvas = document.createElement('canvas');
            canvas.width = 32;
            canvas.height = 32;
            const ctx = canvas.getContext('2d');
            
            // 绘制渐变方块
            const gradient = ctx.createLinearGradient(0, 0, 32, 32);
            gradient.addColorStop(0, color);
            gradient.addColorStop(1, this.darkenColor(color, 0.3));
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, 32, 32);
            
            // 边框
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 0, 32, 32);
            
            this.textures.set(name, canvas);
        }
    }
    
    /**
     * 从AssetManager加载纹理
     */
    loadTexturesFromAssetManager() {
        if (!window.assetManager) return;
        
        // 将AssetManager中的图片复制到纹理缓存
        for (const [key, image] of window.assetManager.images) {
            this.textures.set(key, image);
        }
        
        console.log(`RenderSystem: Loaded ${window.assetManager.images.size} textures from AssetManager`);
    }
    
    /**
     * 加载纹理
     */
    async loadTexture(name, url) {
        try {
            const img = new Image();
            img.src = url;
            await new Promise((resolve, reject) => {
                img.onload = resolve;
                img.onerror = reject;
            });
            this.textures.set(name, img);
            return true;
        } catch (e) {
            console.warn(`Failed to load texture: ${url}`);
            return false;
        }
    }
    
    /**
     * 获取纹理
     */
    getTexture(name) {
        return this.textures.get(name);
    }
    
    update(dt) {
        // 渲染在 render() 方法中进行
    }
    
    render(ctx) {
        if (!this.camera) return;
        
        // 重置统计
        this.stats.drawCalls = 0;
        this.stats.entityCount = 0;
        
        // 获取视口范围（世界坐标）
        const viewBounds = this.camera.getViewportBounds();
        
        // 渲染地板（在实体下面）
        this.renderFloor(ctx, viewBounds);
        
        // 获取所有需要渲染的实体
        const entities = this.world.getEntitiesWithComponents(TransformComponent, SpriteComponent);
        
        // 按 Z 轴排序
        entities.sort((a, b) => {
            const za = a.get(TransformComponent).z || 0;
            const zb = b.get(TransformComponent).z || 0;
            return za - zb;
        });
        
        // 渲染每个实体（注意：此时ctx已在相机变换中，不需要再应用）
        for (const entity of entities) {
            if (this.shouldRender(entity, viewBounds)) {
                this.renderEntity(ctx, entity);
            }
        }
        
        // 渲染光照
        if (this.lightingEnabled) {
            this.renderLighting(ctx);
        }
    }
    
    /**
     * 渲染地板
     */
    renderFloor(ctx, viewBounds) {
        // 获取RoomSystem以获取地图数据
        const roomSystem = this.world.getSystem(RoomSystem);
        if (!roomSystem || !roomSystem.currentMap) return;
        
        const map = roomSystem.currentMap;
        const floor = roomSystem.currentFloor || 1;
        const cellSize = map.config.cellSize || 32;
        
        // 获取地板纹理
        const floorNames = [
            'layer1_floor_mycelium',
            'layer2_floor_greenhouse',
            'layer3_floor_nerve',
            'layer4_floor_furnace',
            'layer5_floor_courtyard',
            'layer6_floor_core'
        ];
        const floorTextureName = floorNames[Math.min(floor - 1, 5)];
        const floorTexture = this.textures.get(floorTextureName);
        
        // 计算可见的格子范围
        const minGridX = Math.floor(viewBounds.minX / cellSize);
        const maxGridX = Math.ceil(viewBounds.maxX / cellSize);
        const minGridY = Math.floor(viewBounds.minY / cellSize);
        const maxGridY = Math.ceil(viewBounds.maxY / cellSize);
        
        // 渲染地板
        for (let x = minGridX; x <= maxGridX; x++) {
            for (let y = minGridY; y <= maxGridY; y++) {
                const worldX = x * cellSize;
                const worldY = y * cellSize;
                
                if (floorTexture) {
                    ctx.drawImage(floorTexture, worldX, worldY, cellSize, cellSize);
                } else {
                    // 后备：绘制默认地板
                    ctx.fillStyle = '#2a2a3a';
                    ctx.fillRect(worldX, worldY, cellSize, cellSize);
                    ctx.strokeStyle = '#333';
                    ctx.strokeRect(worldX, worldY, cellSize, cellSize);
                }
                
                this.stats.drawCalls++;
            }
        }
    }
    
    /**
     * 检查实体是否在视口内
     */
    shouldRender(entity, viewBounds) {
        if (!this.cullingEnabled) return true;
        
        const transform = entity.get(TransformComponent);
        const sprite = entity.get(SpriteComponent);
        
        const halfWidth = sprite.width / 2 + this.cullingMargin;
        const halfHeight = sprite.height / 2 + this.cullingMargin;
        
        return (
            transform.x + halfWidth >= viewBounds.minX &&
            transform.x - halfWidth <= viewBounds.maxX &&
            transform.y + halfHeight >= viewBounds.minY &&
            transform.y - halfHeight <= viewBounds.maxY
        );
    }
    
    /**
     * 渲染单个实体
     */
    renderEntity(ctx, entity) {
        const transform = entity.get(TransformComponent);
        const sprite = entity.get(SpriteComponent);
        const health = entity.get(HealthComponent);
        
        if (!sprite.visible) return;
        
        ctx.save();
        
        // 应用变换
        ctx.translate(transform.x, transform.y);
        ctx.rotate(transform.rotation);
        ctx.scale(transform.scaleX * sprite.scaleX, transform.scaleY * sprite.scaleY);
        
        // 应用透明度
        ctx.globalAlpha = sprite.alpha;
        
        // 受伤闪烁效果
        if (health && health.damageFlash > 0) {
            ctx.globalAlpha *= (1 - health.damageFlash * 0.5);
        }
        
        // 获取纹理
        let texture = null;
        
        // 1. 检查是否有动画帧
        if (sprite.currentAnimation && sprite.animations[sprite.currentAnimation]) {
            const frameKey = `${sprite.texture}_${sprite.currentAnimation}_${sprite.frameIndex}`;
            texture = this.animationFrames.get(frameKey);
        }
        
        // 2. 使用sprite指定的纹理（从AssetManager加载的）
        if (!texture && sprite.texture) {
            texture = this.textures.get(sprite.texture);
        }
        
        // 3. 根据标签使用默认纹理
        if (!texture) {
            if (entity.hasTag('player')) {
                texture = this.textures.get('player_0') || this.textures.get('player');
            } else if (entity.hasTag('boss')) {
                texture = this.textures.get('boss6') || this.textures.get('boss');
            } else if (entity.hasTag('enemy')) {
                const enemyComp = entity.get(EnemyComponent);
                if (enemyComp && enemyComp.enemyType) {
                    texture = this.textures.get(enemyComp.enemyType);
                }
                if (!texture) {
                    texture = this.textures.get('enemy');
                }
            } else if (entity.hasTag('projectile')) {
                const weaponComp = entity.get(WeaponComponent);
                if (weaponComp && weaponComp.weaponType) {
                    texture = this.textures.get(`bullet_${weaponComp.weaponType}`) || 
                              this.textures.get('bullet_arrow');
                }
                if (!texture) {
                    texture = this.textures.get('projectile');
                }
            } else if (entity.hasTag('item')) {
                const itemComp = entity.get(ItemComponent);
                if (itemComp && itemComp.itemId) {
                    texture = this.textures.get(itemComp.itemId);
                }
                if (!texture) {
                    texture = this.textures.get('item');
                }
            } else if (entity.hasTag('wall')) {
                texture = this.textures.get('layer1_wall') || this.textures.get('wall');
            } else if (entity.hasTag('door')) {
                texture = this.textures.get('layer1_door_closed') || this.textures.get('wall');
            } else if (entity.hasTag('obstacle')) {
                texture = this.textures.get('deco_mushroom') || this.textures.get('obstacle');
            } else if (entity.hasTag('chest')) {
                texture = this.textures.get('chest_closed');
            } else if (entity.hasTag('npc')) {
                texture = this.textures.get('npc_shopkeeper');
            } else if (entity.hasTag('pet')) {
                texture = this.textures.get('chick');
            } else {
                texture = this.textures.get('player');
            }
        }
        
        // 3. 后备：绘制彩色方块
        if (!texture) {
            ctx.fillStyle = sprite.tint || '#666';
            ctx.fillRect(-sprite.width/2, -sprite.height/2, sprite.width, sprite.height);
        } else {
            // 绘制纹理
            ctx.drawImage(
                texture,
                -sprite.width * sprite.anchorX,
                -sprite.height * sprite.anchorY,
                sprite.width,
                sprite.height
            );
        }
        
        // 绘制血条（如果是单位）
        if (health && entity.hasTag('enemy')) {
            this.renderHealthBar(ctx, health, sprite.width);
        }
        
        ctx.restore();
        
        this.stats.drawCalls++;
        this.stats.entityCount++;
    }
    
    /**
     * 绘制血条
     */
    renderHealthBar(ctx, health, width) {
        const barWidth = width;
        const barHeight = 4;
        const y = -width / 2 - 10;
        
        // 背景
        ctx.fillStyle = '#522';
        ctx.fillRect(-barWidth/2, y, barWidth, barHeight);
        
        // 血量
        const hpPercent = health.currentHealth / health.maxHealth;
        ctx.fillStyle = hpPercent > 0.5 ? '#4f4' : hpPercent > 0.25 ? '#ff0' : '#f44';
        ctx.fillRect(-barWidth/2, y, barWidth * hpPercent, barHeight);
    }
    
    /**
     * 渲染光照效果
     */
    renderLighting(ctx) {
        // 使用缓存的光照画布（性能优化）
        const lightCanvas = this.lightCanvas;
        const lightCtx = this.lightCtx;
        
        // 清除画布
        lightCtx.clearRect(0, 0, lightCanvas.width, lightCanvas.height);
        
        // 填充环境光
        lightCtx.fillStyle = `rgba(0, 0, 0, ${1 - this.ambientLight})`;
        lightCtx.fillRect(0, 0, lightCanvas.width, lightCanvas.height);
        
        // 绘制光源
        lightCtx.globalCompositeOperation = 'destination-out';
        
        // 玩家光源
        const players = this.world.getEntitiesWithTag('player');
        for (const player of players) {
            const transform = player.get(TransformComponent);
            if (transform) {
                const screenPos = this.camera.worldToScreen(transform.x, transform.y);
                
                const gradient = lightCtx.createRadialGradient(
                    screenPos.x, screenPos.y, 0,
                    screenPos.x, screenPos.y, 150
                );
                gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
                gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
                
                lightCtx.fillStyle = gradient;
                lightCtx.beginPath();
                lightCtx.arc(screenPos.x, screenPos.y, 150, 0, Math.PI * 2);
                lightCtx.fill();
            }
        }
        
        // 叠加光照层
        ctx.globalCompositeOperation = 'multiply';
        ctx.drawImage(lightCanvas, 0, 0);
        ctx.globalCompositeOperation = 'source-over';
    }
    
    /**
     * 颜色变暗
     */
    darkenColor(color, factor) {
        const num = parseInt(color.replace('#', ''), 16);
        const r = Math.floor((num >> 16) * (1 - factor));
        const g = Math.floor(((num >> 8) & 0x00FF) * (1 - factor));
        const b = Math.floor((num & 0x0000FF) * (1 - factor));
        return `rgb(${r}, ${g}, ${b})`;
    }
    
    /**
     * 获取渲染统计
     */
    getStats() {
        return { ...this.stats };
    }
    
    destroy() {}
}

window.RenderSystem = RenderSystem;
