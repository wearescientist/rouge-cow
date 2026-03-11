/**
 * NewEnemy Class - New Monster System
 * Compatible with generated_assets/ monsters
 */

class NewEnemy {
    constructor(x, y, typeKey, tier = 1) {
        const cfg = ENEMY_TYPES_NEW[typeKey];
        if (!cfg) {
            throw new Error(`NewEnemy: Unknown type "${typeKey}"`);
        }
        
        this.x = x;
        this.y = y;
        this.typeKey = typeKey;
        this.baseId = cfg.baseId;
        this.version = cfg.version;
        
        // Stats
        this.size = cfg.size || 32;
        this.tier = cfg.tier || tier;
        this.hp = cfg.hp;
        this.maxHp = this.hp;
        this.speed = cfg.speed;
        this.dmg = cfg.dmg;
        this.exp = cfg.exp;
        this.gold = cfg.gold || 5;
        this.color = cfg.color || '#f4e5d0';
        this.type = cfg.type || 'common';
        this.needsFlip = cfg.needsFlip || false;  // 贴图是否需要预先翻转
        this.hasBounce = cfg.hasBounce || false;  // 是否有行走颠簸效果
        
        // Physics
        this.vx = 0;
        this.vy = 0;
        
        // Combat state
        this.hitTimer = 0;
        this.attackCd = 0;
        this.specialCd = 0;
        
        // Status effects
        this.slowTimer = 0;
        this.stunTimer = 0;
        this.poisonTimer = 0;
        this.poisonDmg = 0;
        this.blindTimer = 0;
        
        // Animation
        this.facingRight = true;
        this.walkCycle = 0;
        this.animTimer = 0;
        
        // Sprite loading - v0.34: 加载多帧动画
        this.spritePaths = cfg.spritePaths;
        this.spriteFrames = [];  // 存储多个帧的 Image
        this.spriteLoaded = false;
        this.animFrame = 0;
        this.animSpeed = 8;  // 每秒8帧
        this.loadedFrameCount = 0;
        this.loadSpriteFrames();
        
        // Collision data (fallback)
        this.spriteData = {
            bounds: { x: 0, y: 0, width: this.size * 0.8, height: this.size * 0.8 },
            getHitbox: (feetX, feetY, scale = 1) => {
                const s = this.size * 0.8 * scale;
                return {
                    x: feetX - s / 2,
                    y: feetY - s,
                    width: s,
                    height: s,
                    cx: feetX,
                    cy: feetY - s / 2
                };
            },
            getCenterPosition: (feetX, feetY) => ({
                x: feetX,
                y: feetY - this.size * 0.4
            })
        };
    }
    
    // v0.34: 动态加载帧 (f01.png 开始，直到加载失败)
    // 不同版本帧数不同：v2=4帧, v3=3帧 等
    loadSpriteFrames() {
        if (!this.spritePaths) return;
        
        const basePath = this.spritePaths.ready;
        if (!basePath) return;
        
        // 提取基础路径 (去掉 /f01.png)
        const baseDir = basePath.replace(/\/f01\.png$/, '');
        
        this.spriteFrames = [];
        this.loadedFrameCount = 0;
        this.spriteLoaded = false;
        
        // 最多尝试加载8帧，遇到2个连续失败则停止
        let consecutiveFailures = 0;
        const maxFramesToTry = 8;
        
        for (let i = 1; i <= maxFramesToTry; i++) {
            const frameNum = i.toString().padStart(2, '0');
            const frameName = `f${frameNum}.png`;
            const frameIndex = i - 1;
            
            const img = new Image();
            
            img.onload = () => {
                this.spriteFrames[frameIndex] = img;
                this.loadedFrameCount++;
                consecutiveFailures = 0;
                this.spriteLoaded = true;
            };
            
            img.onerror = () => {
                consecutiveFailures++;
                // 连续2个失败，说明没有更多帧了
                if (consecutiveFailures >= 2) {
                    // 截断到实际加载的帧数
                    const actualCount = this.spriteFrames.filter(f => f).length;
                    this.spriteFrames = this.spriteFrames.slice(0, actualCount);
                    this.spriteLoaded = true;
                }
            };
            
            img.src = `${baseDir}/${frameName}`;
        }
        
        // 超时保底：500ms后如果还没标记加载完成，强制完成
        setTimeout(() => {
            if (!this.spriteLoaded) {
                const actualCount = this.spriteFrames.filter(f => f).length;
                if (actualCount > 0) {
                    this.spriteFrames = this.spriteFrames.slice(0, actualCount);
                    this.spriteLoaded = true;
                }
            }
        }, 500);
    }
    
    // Getters for center position (used by particles, effects)
    get cx() {
        return this.x;
    }
    get cy() {
        return this.y - this.size * 0.4;
    }
    
    update(dt, player, room) {
        if (this.stunTimer > 0) {
            this.stunTimer -= dt;
            return;
        }
        
        // Slow effect
        let speedMult = 1;
        if (this.slowTimer > 0) {
            this.slowTimer -= dt;
            speedMult = 0.5;
        }
        
        // Poison damage
        if (this.poisonTimer > 0) {
            this.poisonTimer -= dt;
            this.poisonDmgTimer = (this.poisonDmgTimer || 0) + dt;
            if (this.poisonDmgTimer >= 1) {
                this.hp -= this.poisonDmg;
                this.poisonDmgTimer = 0;
            }
        }
        
        // v0.34: 移除aggro range限制，像旧系统一样一直追踪
        // Calculate distance to player
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // Movement - 始终追踪玩家
        if (dist > 10) {
            this.vx = (dx / dist) * this.speed * speedMult;
            this.vy = (dy / dist) * this.speed * speedMult;
        } else {
            this.vx = 0;
            this.vy = 0;
        }
        
        // v0.34: 修复朝向 - 根据dx判断脸应该朝哪边
        // 如果玩家在自己右边(dx>0)，脸朝右；左边则朝左
        if (Math.abs(dx) > 5) {
            this.facingRight = dx > 0;
        }
        
        // Update position with collision
        const game = window.game;
        let newX = this.x + this.vx * dt;
        let newY = this.y + this.vy * dt;
        
        // Clamp to valid area
        if (typeof SURVIVOR_CONFIG !== 'undefined') {
            const clamped = SURVIVOR_CONFIG.clampToValidArea(newX, newY, room);
            newX = clamped.x;
            newY = clamped.y;
        }

        // v0.36-fix: 新怪也接入敌人-敌人分离，避免出生/追击时叠模。
        if (window.collisionSystem && room?.hordeManager?.enemies) {
            const restricted = window.collisionSystem.restrictEnemyMovement(
                this,
                newX,
                newY,
                player,
                room.hordeManager.enemies
            );
            newX = restricted.x;
            newY = restricted.y;
        }
        
        this.x = newX;
        this.y = newY;
        
        // Update timers
        if (this.hitTimer > 0) this.hitTimer -= dt;
        if (this.attackCd > 0) this.attackCd -= dt;
        
        // v0.34: 动画帧轮播
        if (this.vx !== 0 || this.vy !== 0) {
            this.walkCycle += dt * 10;
            this.animTimer += dt;
            // 每0.125秒切换一帧 (8fps)
            if (this.spriteFrames.length > 0) {
                this.animFrame = Math.floor(this.animTimer * this.animSpeed) % this.spriteFrames.length;
            }
        } else {
            this.walkCycle = 0;
            this.animTimer = 0;
            this.animFrame = 0;  // 待机显示第一帧
        }
    }
    
    takeDamage(amount, isCrit = false) {
        this.hp -= amount;
        this.hitTimer = 0.2;
        
        // Show damage number
        const game = window.game;
        if (game && game.damageNumbers) {
            const opts = isCrit ? { color: '#ff6b6b', size: 18, life: 1.2 } : {};
            game.damageNumbers.spawn(this.cx, this.cy, Math.floor(amount), opts);
        }
        
        return this.hp <= 0;
    }
    
    // v0.35-fix: 添加 applyPoison 方法（兼容武器系统）
    applyPoison(dmg, duration) {
        this.poisonDmg = Math.max(this.poisonDmg, dmg);
        this.poisonTimer = Math.max(this.poisonTimer, duration);
    }
    
    draw(ctx, camera) {
        const cx = this.x - camera.x;
        const cy = this.y - camera.y;
        
        // Cull off-screen
        if (cx < -100 || cx > ctx.canvas.width + 100 || 
            cy < -100 || cy > ctx.canvas.height + 100) {
            return;
        }
        
        // v0.34: Hit flash - 使用脚底位置
        if (this.hitTimer > 0) {
            ctx.save();
            ctx.globalCompositeOperation = 'source-atop';
            ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(this.hitTimer * 4, 0.9)})`;
            ctx.translate(cx, cy);
            ctx.fillRect(-this.size, -this.size * 2, this.size * 2, this.size * 2);
            ctx.restore();
        }
        
        // v0.34: Draw sprite or fallback
        if (this.spriteLoaded && this.spriteFrames.length > 0) {
            this.drawSprite(ctx, cx, cy);
        } else {
            this.drawFallback(ctx, cx, cy);
        }
        
        // HP bar
        if (this.hp < this.maxHp || this.tier >= 2) {
            this.drawHPBar(ctx, cx, cy);
        }
    }
    
    drawSprite(ctx, cx, cy) {
        ctx.save();
        
        // v0.34: 修复贴图定位 - 原点移到脚底，y轴向上为负
        ctx.translate(cx, cy);
        
        // v0.34: 修复朝向翻转 - 考虑贴图是否需要预先翻转
        // needsFlip: 贴图方向反了，需要额外翻转来修正
        const shouldFlip = this.facingRight !== (this.needsFlip || false);
        if (!shouldFlip) {
            ctx.scale(-1, 1);
        }
        
        // 行走颠簸动画（根据配置决定是否启用）
        const bounce = this.hasBounce ? Math.sin(this.walkCycle) * 4 : 0;
        
        // 获取当前帧
        const sprite = this.spriteFrames[this.animFrame] || this.spriteFrames[0];
        if (!sprite) return;
        
        // v0.36-fix: 按非透明内容边界缩放，而不是按整张画布缩放。
        // 否则 48x48 的低像素样张会把怪物视觉体型一并缩小。
        const contentBounds = this._getSpriteContentBounds(sprite);
        const contentHeight = Math.max(1, contentBounds.height || sprite.height || 1);
        const contentWidth = Math.max(1, contentBounds.width || sprite.width || 1);
        const scale = this.size / contentHeight;
        const drawW = sprite.width * scale;
        const drawH = sprite.height * scale;
        
        // 内容区域在缩放后的实际尺寸，用来对齐脚底和中心。
        const scaledContentW = contentWidth * scale;
        const scaledContentH = contentHeight * scale;
        const contentOffsetX = contentBounds.x * scale;
        const contentOffsetY = contentBounds.y * scale;
        
        // 绘制位置：脚底对齐内容底边，中心对齐内容中心，而不是对齐整张画布。
        const drawX = -(contentOffsetX + scaledContentW / 2);
        const drawY = -(contentOffsetY + scaledContentH) + bounce;
        
        // v0.36-tune: 怪物贴图做轻柔化和浅边处理，往玩家的观感靠。
        // 目标不是模糊成糊团，而是压低生硬黑边和脏对比。
        const previousFilter = ctx.filter;
        const previousAlpha = ctx.globalAlpha;

        ctx.filter = 'brightness(1.08) contrast(0.9) saturate(0.9) blur(0.2px)';
        ctx.drawImage(sprite, drawX, drawY, drawW, drawH);

        // 叠一层极淡暖白，但只沿精灵本体提亮，不要把整张绘制矩形打亮成白框。
        ctx.filter = 'brightness(1.04) saturate(0.92)';
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = previousAlpha * 0.14;
        ctx.drawImage(sprite, drawX, drawY, drawW, drawH);

        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = previousAlpha;
        ctx.filter = previousFilter;
        
        ctx.restore();
    }
    
    drawFallback(ctx, cx, cy) {
        ctx.save();
        ctx.translate(cx, cy);
        
        if (!this.facingRight) {
            ctx.scale(-1, 1);
        }
        
        const size = this.size * 0.8;
        const bounce = Math.sin(this.walkCycle) * 3;
        
        // Body - 脚底对齐
        ctx.fillStyle = this.color;
        ctx.fillRect(-size/2, -size + bounce, size, size);
        
        // Eyes
        ctx.fillStyle = '#000';
        ctx.fillRect(-size/4, -size * 0.7 + bounce, size/6, size/6);
        ctx.fillRect(size/12, -size * 0.7 + bounce, size/6, size/6);
        
        ctx.restore();
    }
    
    drawHPBar(ctx, cx, cy) {
        ctx.save();
        ctx.translate(cx, cy);
        
        const barW = this.size;
        const barH = 4;
        const x = -barW / 2;
        const y = -this.size - 10;
        
        ctx.fillStyle = 'rgba(0,0,0,0.5)';
        ctx.fillRect(x, y, barW, barH);
        
        const hpPercent = Math.max(0, this.hp / this.maxHp);
        ctx.fillStyle = hpPercent > 0.5 ? '#78c98d' : (hpPercent > 0.25 ? '#f0b45f' : '#d96b6b');
        ctx.fillRect(x, y, barW * hpPercent, barH);
        
        ctx.restore();
    }
    
    // Collision
    getCollisionRadius() {
        return this.size * 0.4;
    }
    
    getHitbox() {
        return this.spriteData.getHitbox(this.x, this.y);
    }
    
    // v0.34: 新增 - 获取中心点Y坐标（用于碰撞检测）
    getCenterY() {
        if (this.spriteData?.anchor?.center && this.spriteData?.anchor?.feet) {
            const dy = this.spriteData.anchor.center.y - this.spriteData.anchor.feet.y;
            return this.y + dy;
        }
        // 回退：基于 size 的估算
        return this.y - (this.size || 32) * 0.4;
    }
    
    // v0.34: 新增 - 检测点是否在敌人范围内
    containsPoint(px, py) {
        const cx = this.x;
        const cy = this.getCenterY();
        const radius = this.getCollisionRadius();
        
        const dx = px - cx;
        const dy = py - cy;
        return (dx * dx + dy * dy) <= (radius * radius);
    }
    
    // v0.34: 新增 - 检测与圆形范围是否相交
    intersectsCircle(cx, cy, radius) {
        const ex = this.x;
        const ey = this.getCenterY();
        const enemyRadius = this.getCollisionRadius();
        
        const dx = cx - ex;
        const dy = cy - ey;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance <= (radius + enemyRadius);
    }
    
    // v0.34: 新增 - 检测子弹碰撞
    intersectsBullet(bx, by, bulletRadius) {
        const ex = this.x;
        const ey = this.getCenterY();
        const enemyRadius = this.getCollisionRadius();
        
        const dx = bx - ex;
        const dy = by - ey;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance <= (bulletRadius + enemyRadius);
    }
    
    // v0.35-fix: 计算贴图内容的实际边界（去除透明边距）
    _getSpriteContentBounds(sprite) {
        // 如果已经缓存，直接返回
        if (sprite._contentBounds) {
            return sprite._contentBounds;
        }
        
        // 创建临时canvas获取像素数据
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = sprite.width;
        canvas.height = sprite.height;
        ctx.drawImage(sprite, 0, 0);
        
        try {
            const imageData = ctx.getImageData(0, 0, sprite.width, sprite.height);
            const data = imageData.data;
            
            let minX = sprite.width, minY = sprite.height;
            let maxX = 0, maxY = 0;
            
            // 遍历所有像素，找到非透明区域的边界
            for (let y = 0; y < sprite.height; y++) {
                for (let x = 0; x < sprite.width; x++) {
                    const alpha = data[(y * sprite.width + x) * 4 + 3];
                    if (alpha > 10) { // 非透明像素
                        minX = Math.min(minX, x);
                        minY = Math.min(minY, y);
                        maxX = Math.max(maxX, x);
                        maxY = Math.max(maxY, y);
                    }
                }
            }
            
            // 如果全是透明，返回整个画布
            if (minX > maxX) {
                sprite._contentBounds = { x: 0, y: 0, width: sprite.width, height: sprite.height };
            } else {
                sprite._contentBounds = {
                    x: minX,
                    y: minY,
                    width: maxX - minX + 1,
                    height: maxY - minY + 1
                };
            }
        } catch (e) {
            // 如果获取失败，返回整个画布
            sprite._contentBounds = { x: 0, y: 0, width: sprite.width, height: sprite.height };
        }
        
        return sprite._contentBounds;
    }
    
    // v0.34: 新增 - 带偏移绘制（用于 Room 渲染）
    drawWithOffset(ctx, sprites, floor) {
        // v0.34: 原点已经在正确位置，直接调用绘制方法
        const cx = 0;
        const cy = 0;
        
        if (this.spriteLoaded && this.spriteFrames.length > 0) {
            this.drawSprite(ctx, cx, cy);
        } else {
            this.drawFallback(ctx, cx, cy);
        }
        
        // HP bar
        if (this.hp < this.maxHp || this.tier >= 2) {
            this.drawHPBar(ctx, cx, cy);
        }
    }
}

function getFloorBossConfig(floorNum) {
    const floorKey = `floor${floorNum}`;
    const monsters = window.FLOOR_DATA?.floors?.[floorKey]?.monsters || [];
    return monsters.find(monster => (monster.tier || 1) >= 4) || null;
}

function getEnemyRuntimeKey(monster, floorNum) {
    if (!monster) return null;
    return `${monster.id}_t${monster.tier || 1}_f${floorNum}`;
}

function clampBossDamage(value) {
    return Math.max(1, Math.min(2, Number.isFinite(value) ? value : 1));
}

// NewBoss class
class NewBoss extends NewEnemy {
    constructor(x, y, floorNum) {
        const bossConfig = getFloorBossConfig(floorNum);
        const typeKey = getEnemyRuntimeKey(bossConfig, floorNum);
        if (!typeKey) {
            throw new Error(`NewBoss: No boss config for floor ${floorNum}`);
        }
        super(x, y, typeKey, 4);
        
        this.bossFloor = floorNum;
        this.isBoss = true;
        this.dmg = clampBossDamage(this.dmg);
        
        // Boss skills
        this.skillCooldowns = {
            charge: 0,
            shockwave: 0,
            bullet_hell: 0,
            homing: 0,
            summon: 0
        };
        
        this.isCharging = false;
        this.chargeWarning = false;
        this.chargeTimer = 0;
        this.chargeWarningTimer = 0;
        this.chargeDir = { x: 0, y: 0 };
        this.isStatic = floorNum === 6; // Floor 6 boss is static
    }
    
    update(dt, player, room) {
        // Use NewEnemy update for basic movement (unless charging/static)
        if (!this.isCharging && !this.chargeWarning && !this.isStatic) {
            // Call parent update but skip if we're handling boss AI
            this.updateBasicMovement(dt, player, room);
        }
        
        // Boss AI
        this.updateBossAI(dt, player, room);
    }
    
    updateBasicMovement(dt, player, room) {
        // Simplified from NewEnemy.update
        if (this.stunTimer > 0) {
            this.stunTimer -= dt;
            return;
        }
        
        let speedMult = this.slowTimer > 0 ? 0.5 : 1;
        
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        // v0.34: 始终追踪玩家，使用dx判断朝向
        if (dist > 10) {
            this.vx = (dx / dist) * this.speed * speedMult;
            this.vy = (dy / dist) * this.speed * speedMult;
        } else {
            this.vx = 0;
            this.vy = 0;
        }
        
        // v0.34: 修复朝向 - 根据dx判断脸应该朝哪边
        if (Math.abs(dx) > 5) {
            this.facingRight = dx > 0;
        }
        
        let newX = this.x + this.vx * dt;
        let newY = this.y + this.vy * dt;
        
        if (typeof SURVIVOR_CONFIG !== 'undefined') {
            const clamped = SURVIVOR_CONFIG.clampToValidArea(newX, newY, room);
            newX = clamped.x;
            newY = clamped.y;
        }
        
        this.x = newX;
        this.y = newY;
        
        if (this.hitTimer > 0) this.hitTimer -= dt;
        if (this.attackCd > 0) this.attackCd -= dt;
        
        if (this.vx !== 0 || this.vy !== 0) {
            this.walkCycle += dt * 8;
            this.animTimer += dt;
            if (this.spriteFrames.length > 0) {
                this.animFrame = Math.floor(this.animTimer * this.animSpeed) % this.spriteFrames.length;
            }
        } else {
            this.walkCycle = 0;
            this.animTimer = 0;
            this.animFrame = 0;
        }
    }
    
    updateBossAI(dt, player, room) {
        const game = window.game;
        const floor = this.bossFloor;
        
        // Static boss (floor 6)
        if (this.isStatic) {
            this.updateBossSkills(dt, player, room, 1, 1, 1);
            return;
        }
        
        // Calculate phase
        const hpPercent = this.hp / this.maxHp;
        let phase = 1;
        if (hpPercent < 0.3) phase = 3;
        else if (hpPercent < 0.6) phase = 2;
        
        const speedMult = 1 + (phase - 1) * 0.2;
        const dmgMult = 1 + (phase - 1) * 0.3;
        const cdMult = 1 - (phase - 1) * 0.15;
        
        // Charging
        if (this.isCharging) {
            let newX = this.x + this.vx * dt;
            let newY = this.y + this.vy * dt;
            
            if (typeof SURVIVOR_CONFIG !== 'undefined') {
                const clamped = SURVIVOR_CONFIG.clampToValidArea(newX, newY, room);
                if (clamped.x !== newX || clamped.y !== newY) {
                    this.isCharging = false;
                    this.vx = 0;
                    this.vy = 0;
                    if (game && game.particles && typeof game.particles.burst === 'function') {
                        game.particles.burst(this.cx, this.cy, '#f44', 10);
                    }
                } else {
                    this.x = clamped.x;
                    this.y = clamped.y;
                }
            }
            
            // Charge damage
            const dx = player.x - this.x;
            const dy = player.y - this.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < 40 && this.attackCd <= 0) {
                if (!game.godMode && !player.isDashing) {
                    player.takeDamage(clampBossDamage(this.dmg * 2));
                }
                this.attackCd = 0.5;
                this.isCharging = false;
                this.vx = 0;
                this.vy = 0;
            }
            
            this.chargeTimer += dt;
            if (this.chargeTimer > 1.5) {
                this.isCharging = false;
                this.chargeWarning = false;
                this.chargeTimer = 0;
                this.vx = 0;
                this.vy = 0;
            }
            return;
        }
        
        // Charge warning
        if (this.chargeWarning) {
            this.chargeWarningTimer += dt;
            if (this.chargeWarningTimer >= 1.0) {
                this.isCharging = true;
                this.chargeWarning = false;
                this.vx = this.chargeDir.x * 400;
                this.vy = this.chargeDir.y * 400;
            }
            return;
        }
        
        // Try skills
        const usedSkill = this.updateBossSkills(dt, player, room, speedMult, dmgMult, cdMult);
        
        // Normal movement if no skill used
        if (!usedSkill) {
            this.updateBasicMovement(dt, player, room);
        }
    }
    
    updateBossSkills(dt, player, room, speedMult, dmgMult, cdMult) {
        const game = window.game;
        
        // Update cooldowns
        for (const key in this.skillCooldowns) {
            if (this.skillCooldowns[key] > 0) this.skillCooldowns[key] -= dt;
        }
        
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        // 1. Charge attack
        if (!this.isStatic && this.skillCooldowns.charge <= 0 && dist > 100 && dist < 400) {
            this.skillCooldowns.charge = 8 * cdMult;
            this.chargeWarning = true;
            this.chargeWarningTimer = 0;
            this.chargeDir = { x: dx/dist, y: dy/dist };
            if (game && game.particles && typeof game.particles.burst === 'function') {
                game.particles.burst(this.cx, this.cy, '#f0f', 10);
            }
            return true;
        }
        
        // 2. Shockwave
        if (this.skillCooldowns.shockwave <= 0 && dist < 120) {
            this.skillCooldowns.shockwave = 5 * cdMult;
            if (game && game.particles && typeof game.particles.burst === 'function') {
                game.particles.burst(this.cx, this.cy, '#f0f', 20);
            }
            if (dist < 120 && !game.godMode && !player.isDashing) {
                player.takeDamage(clampBossDamage(this.dmg * dmgMult));
            }
            return true;
        }
        
        // 3. Bullet hell
        if (this.skillCooldowns.bullet_hell <= 0) {
            this.skillCooldowns.bullet_hell = 6 * cdMult;
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                game.bullets.push({
                    x: this.x, y: this.y,
                    vx: Math.cos(angle) * 150,
                    vy: Math.sin(angle) * 150,
                    dmg: clampBossDamage(this.dmg * dmgMult),
                    color: '#ff00ff', life: 3, isEnemyBullet: true
                });
            }
            return true;
        }
        
        // 4. Homing bullets
        if (this.skillCooldowns.homing <= 0) {
            this.skillCooldowns.homing = 4 * cdMult;
            for (let i = 0; i < 3; i++) {
                const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.5;
                game.bullets.push({
                    x: this.x, y: this.y,
                    vx: Math.cos(angle) * 100,
                    vy: Math.sin(angle) * 100,
                    dmg: clampBossDamage(this.dmg * dmgMult),
                    color: '#ff00ff', life: 5, isEnemyBullet: true,
                    homing: true, target: player
                });
            }
            return true;
        }
        
        // 5. Summon
        if (this.skillCooldowns.summon <= 0) {
            this.skillCooldowns.summon = 10 * cdMult;
            const enemyCount = room.hordeManager ? room.hordeManager.enemies.length : room.enemies.length;
            if (enemyCount < 15) {
                for (let i = 0; i < 3; i++) {
                    const angle = (i / 3) * Math.PI * 2;
                    const r = 80;
                    const sx = this.x + Math.cos(angle) * r;
                    const sy = this.y + Math.sin(angle) * r;
                    // Summon a weak minion
                    const minionKeys = Object.keys(ENEMY_TYPES_NEW).slice(0, 5);
                    const typeKey = minionKeys[Math.floor(Math.random() * minionKeys.length)];
                    const minion = createEnemy(sx, sy, typeKey);
                    minion.hp *= 0.3;
                    minion.maxHp = minion.hp;
                    minion.dmg = clampBossDamage(minion.dmg * 0.5);
                    if (room.hordeManager) room.hordeManager.enemies.push(minion);
                    else room.enemies.push(minion);
                }
            }
            if (game && game.particles && typeof game.particles.burst === 'function') {
                game.particles.burst(this.cx, this.cy, '#0f0', 15);
            }
            return true;
        }
        
        return false;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { NewEnemy, NewBoss };
}
