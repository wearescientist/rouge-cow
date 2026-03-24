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
        this.name = cfg.name || typeKey;
        this.floor = cfg.floor || null;
        
        // Stats
        this.size = cfg.size || 32;
        this.tier = cfg.tier || tier;
        this.hp = cfg.hp;
        this.maxHp = this.hp;
        this.speed = cfg.speed;
        this.dmg = cfg.dmg;
        this.armor = Number.isFinite(cfg.armor) ? cfg.armor : 0;
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
        this.poisonStacks = 0;
        this.poisonStackDmg = 0;
        this.poisonMaxStacks = 0;
        this.poisonSpreadGen = 0;
        this.poisonSpreadConfig = null;
        this.blindTimer = 0;
        this.freezeMeter = 0;
        this.freezeMeterDecay = 0.5;
        this.freezeTimer = 0;
        this.isFrozen = false;
        
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

        if (!window.__enemyFrameCache) window.__enemyFrameCache = new Map();
        const frameCache = window.__enemyFrameCache;
        const cached = frameCache.get(baseDir);
        if (cached && Array.isArray(cached.frames) && cached.frames.length > 0) {
            this.spriteFrames = cached.frames.slice();
            this.loadedFrameCount = this.spriteFrames.length;
            this.spriteLoaded = true;
            return;
        }
        
        this.spriteFrames = [];
        this.loadedFrameCount = 0;
        this.spriteLoaded = false;

        const maxFramesToTry = 8;
        const loadNextFrame = (index) => {
            if (index > maxFramesToTry) {
                this.spriteLoaded = this.spriteFrames.length > 0;
                if (this.spriteLoaded) {
                    frameCache.set(baseDir, { frames: this.spriteFrames.slice() });
                }
                return;
            }

            const frameNum = index.toString().padStart(2, '0');
            const img = new Image();

            img.onload = () => {
                this.spriteFrames.push(img);
                this.loadedFrameCount = this.spriteFrames.length;
                loadNextFrame(index + 1);
            };

            img.onerror = () => {
                this.spriteLoaded = this.spriteFrames.length > 0;
                if (this.spriteLoaded) {
                    frameCache.set(baseDir, { frames: this.spriteFrames.slice() });
                }
            };

            img.src = `${baseDir}/f${frameNum}.png`;
        };

        loadNextFrame(1);

        // 超时保底：500ms后如果还没标记加载完成，强制完成
        setTimeout(() => {
            if (!this.spriteLoaded) {
                const actualCount = this.spriteFrames.filter(f => f).length;
                if (actualCount > 0) {
                    this.spriteFrames = this.spriteFrames.slice(0, actualCount);
                    this.loadedFrameCount = this.spriteFrames.length;
                    this.spriteLoaded = true;
                    frameCache.set(baseDir, { frames: this.spriteFrames.slice() });
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
        if (this.isBoss && this.damageIntakeState) {
            const hpPercent = this.maxHp > 0 ? (this.hp / this.maxHp) : 1;
            const intakeProfile = getBossDamageIntakeProfile(this.bossFloor || this.floor || window.game?.currentFloor || 1, hpPercent);
            const decayPerSecond = Math.max(1, this.maxHp * intakeProfile.dpsCapFrac);
            this.damageIntakeState.bucket = Math.max(0, (this.damageIntakeState.bucket || 0) - decayPerSecond * dt);
            this.damageIntakeState.lastProfile = intakeProfile;
        }

        if (this.poisonTimer > 0) {
            this.poisonTimer -= dt;
            this.poisonDmgTimer = (this.poisonDmgTimer || 0) + dt;
            if (this.poisonDmgTimer >= 1) {
                const stacks = Math.max(0, this.poisonStacks || 0);
                const perStack = Math.max(0, this.poisonStackDmg || 0);
                const tickDmg = stacks > 0 ? (stacks * perStack) : this.poisonDmg;
                if (tickDmg > 0) {
                    this.hp -= tickDmg;
                }
                this.poisonDmgTimer = 0;
                if (this.hp <= 0 && !this.poisonDeathHandled) {
                    this.poisonDeathHandled = true;
                    this.handlePoisonDeath(room);
                }
            }
        }

        if (this.freezeMeter > 0 && this.freezeTimer <= 0) {
            this.freezeMeter = Math.max(0, this.freezeMeter - dt * (this.freezeMeterDecay || 0.5));
        }
        if (this.freezeTimer > 0) {
            this.freezeTimer -= dt;
            this.isFrozen = true;
        } else {
            this.isFrozen = false;
            if (this.freezeMeter >= 1) {
                this.freezeTimer = Math.max(this.freezeTimer, this.freezeDuration || 1.2);
                this.freezeMeter = 0;
                this.isFrozen = true;
            }
        }

        if (this.stunTimer > 0 || this.isFrozen) {
            this.stunTimer = Math.max(0, this.stunTimer - dt);
            return;
        }
        
        // Slow effect
        let speedMult = 1;
        if (this.slowTimer > 0) {
            this.slowTimer -= dt;
            speedMult = 0.5;
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
    
    _resolveDamageInfo(isCritOrInfo) {
        if (typeof isCritOrInfo === 'object' && isCritOrInfo !== null) {
            return isCritOrInfo;
        }
        return { isCrit: !!isCritOrInfo };
    }

    _getHitMaterial() {
        const key = String(this.kind || this.id || '').toLowerCase();
        if (/(snail|crab|nibei|turtle|shell)/.test(key)) return 'shell';
        if (/(pigeon|bat|bee|goose|bird)/.test(key)) return 'bird';
        if (/(fox|rabbit|panther|bear|fur)/.test(key)) return 'fur';
        if (/(ghost|snake|mother|slime|worm)/.test(key)) return 'slime';
        if (/(mimic|bone|skeleton)/.test(key)) return 'bone';
        return 'flesh';
    }

    takeDamage(amount, isCritOrInfo = false) {
        const damageInfo = this._resolveDamageInfo(isCritOrInfo);
        const isCrit = !!damageInfo.isCrit;
        const ignoreArmor = !!damageInfo.ignoreArmor;
        const armor = ignoreArmor ? 0 : Math.max(0, Math.min(this.isBoss ? 0.45 : 0.35, Number.isFinite(this.armor) ? this.armor : 0));
        let actualAmount = Math.max(1, amount * (1 - armor));

        if (this.isBoss) {
            if (!this.damageIntakeState) this.damageIntakeState = { bucket: 0, lastProfile: null };
            const hpPercent = this.maxHp > 0 ? (this.hp / this.maxHp) : 1;
            const intakeProfile = getBossDamageIntakeProfile(this.bossFloor || this.floor || window.game?.currentFloor || 1, hpPercent);
            const capPerSecond = Math.max(1, this.maxHp * intakeProfile.dpsCapFrac);
            const perHitCap = Math.max(12, this.maxHp * intakeProfile.hitCapFrac);
            const remainingBudget = Math.max(0, capPerSecond - (this.damageIntakeState.bucket || 0));
            const clampedHit = Math.min(actualAmount, perHitCap);
            const overflow = Math.max(0, clampedHit - remainingBudget);
            actualAmount = Math.max(0, Math.min(clampedHit, remainingBudget) + overflow * intakeProfile.overCapScalar);
            if (actualAmount <= 0.35) return false;
            this.damageIntakeState.bucket = Math.min(capPerSecond * 1.2, (this.damageIntakeState.bucket || 0) + actualAmount);
            this.damageIntakeState.lastProfile = intakeProfile;
        }

        this.hp -= actualAmount;
        this.hitTimer = 0.2;
        
        // Show damage number
        const game = window.game;
        if (game && game.damageNumbers && actualAmount >= 1) {
            const opts = isCrit ? { color: '#ff6b6b', size: 18, life: 1.2 } : {};
            game.damageNumbers.spawn(this.cx, this.cy, Math.floor(actualAmount), opts);
        }

        if (game?.audioCtrl) {
            if (isCrit) game.audioCtrl.playCrit();
            else game.audioCtrl.playHit(this._getHitMaterial());
        }
        
        return this.hp <= 0;
    }
    
    // v0.35-fix: 添加 applyPoison 方法（兼容武器系统）
    applyPoison(dmg, duration, stacks = 1, maxStacks = 5, options = null) {
        const nextStacks = Math.min(maxStacks, (this.poisonStacks || 0) + Math.max(1, stacks || 0));
        this.poisonStacks = Math.max(this.poisonStacks || 0, nextStacks);
        this.poisonMaxStacks = Math.max(this.poisonMaxStacks || 0, maxStacks || 0);
        this.poisonStackDmg = Math.max(this.poisonStackDmg || 0, dmg || 0);
        this.poisonDmg = Math.max(this.poisonDmg || 0, dmg || 0);
        this.poisonTimer = Math.max(this.poisonTimer || 0, duration || 0);
        this.poisonDeathHandled = false;

        if (options) {
            this.poisonSpreadConfig = {
                spreadTargets: options.spreadTargets || 0,
                spreadRange: options.spreadRange || 0,
                spreadMaxGen: options.spreadMaxGen || 0,
                spreadGen: options.spreadGen || 0,
                cloudOnDeath: !!options.cloudOnDeath,
                cloudDuration: options.cloudDuration || 0,
                cloudStacks: options.cloudStacks || 0
            };
            this.poisonSpreadGen = options.spreadGen || 0;
        }
    }

    applyFreezeMeter(gain, duration = 1.2) {
        const inc = Math.max(0, gain || 0);
        if (inc <= 0) return;
        this.freezeMeter = Math.min(2, (this.freezeMeter || 0) + inc);
        this.freezeDuration = Math.max(this.freezeDuration || 0, duration || 0);
    }

    handlePoisonDeath(room) {
        const cfg = this.poisonSpreadConfig;
        if (!cfg) return;
        const enemies = room?.getActiveEnemies ? room.getActiveEnemies() : room?.enemies;
        if (!enemies || enemies.length === 0) return;

        if (cfg.spreadTargets > 0 && (cfg.spreadGen || 0) < (cfg.spreadMaxGen || 0)) {
            const candidates = enemies.filter(e => e && e.hp > 0 && e !== this);
            candidates.sort((a, b) => {
                const da = Math.hypot(a.cx - this.cx, a.cy - this.cy);
                const db = Math.hypot(b.cx - this.cx, b.cy - this.cy);
                return da - db;
            });
            let spreadCount = 0;
            for (const other of candidates) {
                if (spreadCount >= cfg.spreadTargets) break;
                const d = Math.hypot(other.cx - this.cx, other.cy - this.cy);
                if (d > (cfg.spreadRange || 0)) break;
                other.applyPoison(
                    this.poisonStackDmg || 4,
                    this.poisonTimer || 3,
                    1,
                    this.poisonMaxStacks || 5,
                    {
                        spreadTargets: cfg.spreadTargets,
                        spreadRange: cfg.spreadRange,
                        spreadMaxGen: cfg.spreadMaxGen,
                        spreadGen: (cfg.spreadGen || 0) + 1,
                        cloudOnDeath: cfg.cloudOnDeath,
                        cloudDuration: cfg.cloudDuration,
                        cloudStacks: cfg.cloudStacks
                    }
                );
                spreadCount++;
            }
        }

        if (cfg.cloudOnDeath && (cfg.cloudDuration || 0) > 0 && window.game) {
            window.game.bullets.push({
                x: this.cx, y: this.cy,
                type: 'area', subtype: 'poison_cloud',
                dmg: 0, range: 110,
                life: cfg.cloudDuration,
                duration: cfg.cloudDuration,
                tickRate: 0.28,
                color: '#78d68b',
                poisonStacksOnHit: Math.max(1, cfg.cloudStacks || 1),
                poisonStackDmg: Math.max(1, this.poisonStackDmg || 5),
                poisonDuration: Math.max(1, this.poisonTimer || 3),
                poisonMaxStacks: Math.max(3, this.poisonMaxStacks || 5),
                poisonSpreadTargets: 0,
                poisonSpreadRange: 0,
                poisonSpreadMaxGen: 0,
                weaponKey: 'poison_dart'
            });
        }
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
        let scale = this.size / contentHeight;
        const tf = (this.isBoss && this.activeFrameTransforms?.[this.animFrame])
            ? this.activeFrameTransforms[this.animFrame]
            : null;
        if (tf && Number.isFinite(tf.scale)) {
            scale *= tf.scale;
        }
        let drawW = sprite.width * scale;
        let drawH = sprite.height * scale;
        
        // 内容区域在缩放后的实际尺寸，用来对齐脚底和中心。
        const scaledContentW = contentWidth * scale;
        const scaledContentH = contentHeight * scale;
        const contentOffsetX = contentBounds.x * scale;
        const contentOffsetY = contentBounds.y * scale;
        
        // 绘制位置：脚底对齐内容底边，中心对齐内容中心，而不是对齐整张画布。
        let drawX = -(contentOffsetX + scaledContentW / 2);
        let drawY = -(contentOffsetY + scaledContentH) + bounce;

        // Boss 对齐策略：以当前动作第一帧作为地平线基准，后续帧只按相对位移修正。
        // 不做逐帧按非透明底边贴地，避免跳跃/飞行动画被压平。
        if (this.isBoss && this.activeFrameBaseline) {
            const base = this.activeFrameBaseline;
            const relX = (Number.isFinite(tf?.x) ? tf.x : 0) - base.firstX;
            const relY = (Number.isFinite(tf?.y) ? tf.y : 0) - base.firstY;
            const bossScale = (base.baseScale || (this.size / Math.max(1, sprite.height || 1)))
                * (Number.isFinite(tf?.scale) ? tf.scale : 1);
            drawW = sprite.width * bossScale;
            drawH = sprite.height * bossScale;
            drawX = -base.anchorX + relX;
            drawY = -base.bottomY + relY + bounce;
        }

        const floatCfg = (this.isBoss && !this.phaseTwoActive) ? this.phase1FloatConfig : null;
        if (floatCfg?.enabled) {
            const states = Array.isArray(floatCfg.states) && floatCfg.states.length > 0 ? floatCfg.states : ['move', 'skill'];
            if (states.includes(this.activeBossAnim)) {
                const time = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
                const amp = Number.isFinite(floatCfg.amplitude) ? floatCfg.amplitude : 0;
                const speed = Number.isFinite(floatCfg.speed) ? floatCfg.speed : 1;
                const sway = Number.isFinite(floatCfg.sway) ? floatCfg.sway : 0;
                drawY += Math.sin(time * Math.PI * 2 * speed + this.phaseFloatSeed) * amp;
                drawX += Math.cos(time * Math.PI * speed + this.phaseFloatSeed * 0.7) * sway;
            }
        }
        
        // v0.36-tune: 怪物贴图做轻柔化和浅边处理，往玩家的观感靠。
        // 目标不是模糊成糊团，而是压低生硬黑边和脏对比。
        const previousFilter = ctx.filter;
        const previousAlpha = ctx.globalAlpha;

        const extraFlipX = !!(tf?.flipX);
        const extraRotDeg = Number.isFinite(tf?.rot) ? tf.rot : 0;
        const drawMirror = extraFlipX;
        const imageX = drawMirror ? (-drawX - drawW) : drawX;

        if (extraRotDeg !== 0) {
            ctx.rotate((extraRotDeg * Math.PI) / 180);
        }
        if (drawMirror) {
            ctx.scale(-1, 1);
        }

        ctx.filter = 'brightness(1.08) contrast(0.9) saturate(0.9) blur(0.2px)';
        ctx.drawImage(sprite, imageX, drawY, drawW, drawH);

        // 叠一层极淡暖白，但只沿精灵本体提亮，不要把整张绘制矩形打亮成白框。
        ctx.filter = 'brightness(1.04) saturate(0.92)';
        ctx.globalCompositeOperation = 'screen';
        ctx.globalAlpha = previousAlpha * 0.14;
        ctx.drawImage(sprite, imageX, drawY, drawW, drawH);

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
    drawWithOffset(ctx, sprites, floor, screenScale = 1) {
        // v0.34: 原点已经在正确位置，直接调用绘制方法
        const cx = 0;
        const cy = 0;

        ctx.save();
        if (Number.isFinite(screenScale) && screenScale > 0 && screenScale !== 1) {
            ctx.scale(screenScale, screenScale);
        }

        if (this.spriteLoaded && this.spriteFrames.length > 0) {
            this.drawSprite(ctx, cx, cy);
        } else {
            this.drawFallback(ctx, cx, cy);
        }

        // HP bar
        if (this.hp < this.maxHp || this.tier >= 2) {
            this.drawHPBar(ctx, cx, cy);
        }
        ctx.restore();
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

function clampBossDamage(value, floor = window.game?.currentFloor || 1) {
    const floorCaps = [0, 2, 3, 4, 5, 6, 7, 8];
    const cap = floorCaps[Math.max(1, Math.min(7, Number(floor) || 1))] || 8;
    return Math.max(1, Math.min(cap, Number.isFinite(value) ? value : 1));
}

const BOSS_DAMAGE_INTAKE_PROFILE = {
    // 楼层越高减伤越重；1层放松，避免飞刀这类高频武器前期刮痧过头。
    1: { targetTTK: 24, dpsCapFrac: 0.085, overCapScalar: 0.70, hitCapFrac: 0.090 },
    2: { targetTTK: 26, dpsCapFrac: 0.072, overCapScalar: 0.60, hitCapFrac: 0.070 },
    3: { targetTTK: 28, dpsCapFrac: 0.060, overCapScalar: 0.52, hitCapFrac: 0.055 },
    4: { targetTTK: 30, dpsCapFrac: 0.050, overCapScalar: 0.44, hitCapFrac: 0.045 },
    5: { targetTTK: 32, dpsCapFrac: 0.043, overCapScalar: 0.38, hitCapFrac: 0.038 },
    6: { targetTTK: 34, dpsCapFrac: 0.038, overCapScalar: 0.32, hitCapFrac: 0.032 },
    7: { targetTTK: 36, dpsCapFrac: 0.034, overCapScalar: 0.28, hitCapFrac: 0.028 }
};

function getBossDamageIntakeProfile(floor = window.game?.currentFloor || 1, hpPercent = 1) {
    const floorNum = Math.max(1, Math.min(7, Number(floor) || 1));
    const base = BOSS_DAMAGE_INTAKE_PROFILE[floorNum] || BOSS_DAMAGE_INTAKE_PROFILE[1];
    const phaseScalar = hpPercent <= 0.33 ? 1.08 : (hpPercent <= 0.66 ? 1.04 : 1.0);
    return {
        ...base,
        dpsCapFrac: base.dpsCapFrac * phaseScalar,
        hitCapFrac: base.hitCapFrac * (hpPercent <= 0.33 ? 1.04 : 1.0)
    };
}

const BOSS_PRESSURE_PROFILE = {
    1: { cooldownMult: 0.92, bulletCount: 14, bulletSpeed: 164, homingCount: 4, homingSpeed: 112, summonCount: 3, summonHpScale: 0.48, chargeSpeed: 420 },
    2: { cooldownMult: 0.84, bulletCount: 16, bulletSpeed: 178, homingCount: 4, homingSpeed: 122, summonCount: 4, summonHpScale: 0.52, chargeSpeed: 440 },
    3: { cooldownMult: 0.76, bulletCount: 18, bulletSpeed: 192, homingCount: 5, homingSpeed: 132, summonCount: 4, summonHpScale: 0.56, chargeSpeed: 468 },
    4: { cooldownMult: 0.68, bulletCount: 21, bulletSpeed: 208, homingCount: 6, homingSpeed: 144, summonCount: 5, summonHpScale: 0.60, chargeSpeed: 496 },
    5: { cooldownMult: 0.60, bulletCount: 24, bulletSpeed: 224, homingCount: 6, homingSpeed: 156, summonCount: 5, summonHpScale: 0.64, chargeSpeed: 520 },
    6: { cooldownMult: 0.54, bulletCount: 27, bulletSpeed: 242, homingCount: 7, homingSpeed: 170, summonCount: 6, summonHpScale: 0.68, chargeSpeed: 548 },
    7: { cooldownMult: 0.48, bulletCount: 30, bulletSpeed: 262, homingCount: 8, homingSpeed: 184, summonCount: 7, summonHpScale: 0.72, chargeSpeed: 580 }
};

function getBossAnimationSet(floorNum) {
    const cfg = window.BOSS_ANIMATION_CONFIG?.[Number(floorNum)] || window.BOSS_ANIMATION_CONFIG?.[String(Number(floorNum))] || null;
    const moveFps = Number(cfg?.moveFps);
    const moveIntervalMs = Number(cfg?.moveFrameIntervalMs);
    const transformFps = Number(cfg?.transformFps);
    const phase2MoveFps = Number(cfg?.phase2MoveFps);
    const phase2SkillFps = Number(cfg?.phase2SkillFps);
    let resolvedMoveFps = 7;
    let resolvedTransformFps = 8;
    let resolvedPhase2MoveFps = 7;
    let resolvedPhase2SkillFps = 7;
    if (Number.isFinite(moveFps) && moveFps > 0) resolvedMoveFps = moveFps;
    else if (Number.isFinite(moveIntervalMs) && moveIntervalMs > 0) resolvedMoveFps = 1000 / moveIntervalMs;
    if (Number.isFinite(transformFps) && transformFps > 0) resolvedTransformFps = transformFps;
    if (Number.isFinite(phase2MoveFps) && phase2MoveFps > 0) resolvedPhase2MoveFps = phase2MoveFps;
    if (Number.isFinite(phase2SkillFps) && phase2SkillFps > 0) resolvedPhase2SkillFps = phase2SkillFps;

    const extra = {
        skillMode: String(cfg?.skillMode || 'sequence'),
        skillUseMoveBaseline: !!cfg?.skillUseMoveBaseline,
        phase2SkillUseMoveBaseline: !!cfg?.phase2SkillUseMoveBaseline,
        phase1Float: cfg?.phase1Float ? JSON.parse(JSON.stringify(cfg.phase1Float)) : null,
        phase2SkillFps: resolvedPhase2SkillFps
    };

    if (typeof window.getBossAnimationFrames === 'function') {
        return {
            move: window.getBossAnimationFrames(floorNum, 'move'),
            skill: window.getBossAnimationFrames(floorNum, 'skill'),
            transform: window.getBossAnimationFrames(floorNum, 'transform'),
            phase2Move: window.getBossAnimationFrames(floorNum, 'phase2Move'),
            phase2Skill: window.getBossAnimationFrames(floorNum, 'phase2Skill'),
            moveFps: resolvedMoveFps,
            transformFps: resolvedTransformFps,
            phase2MoveFps: resolvedPhase2MoveFps,
            ...extra
        };
    }
    if (!cfg) return { move: [], skill: [], transform: [], phase2Move: [], phase2Skill: [], ...extra };
    return {
        move: Array.isArray(cfg.move) ? cfg.move.slice() : [],
        skill: Array.isArray(cfg.skill) ? cfg.skill.slice() : [],
        transform: Array.isArray(cfg.transform) ? cfg.transform.slice() : [],
        phase2Move: Array.isArray(cfg.phase2Move) ? cfg.phase2Move.slice() : [],
        phase2Skill: Array.isArray(cfg.phase2Skill) ? cfg.phase2Skill.slice() : [],
        moveFps: resolvedMoveFps,
        transformFps: resolvedTransformFps,
        phase2MoveFps: resolvedPhase2MoveFps,
        ...extra
    };
}

// NewBoss class
class NewBoss extends NewEnemy {
    constructor(x, y, floorNum) {
        const bossRuntimeConfig = typeof getNewBossConfigForFloor === 'function'
            ? getNewBossConfigForFloor(floorNum)
            : null;
        const bossConfig = getFloorBossConfig(floorNum);
        const typeKey = bossRuntimeConfig?.typeKey || getEnemyRuntimeKey(bossConfig, floorNum);
        if (!typeKey) {
            throw new Error(`NewBoss: No boss config for floor ${floorNum}`);
        }
        super(x, y, typeKey, 4);
        
        this.bossFloor = floorNum;
        this.isBoss = true;
        this.phase = 0;
        this.damageIntakeState = { bucket: 0, lastProfile: getBossDamageIntakeProfile(floorNum, 1) };

        if (bossRuntimeConfig) {
            this.name = bossRuntimeConfig.name || this.name;
            this.hp = bossRuntimeConfig.hp;
            this.maxHp = bossRuntimeConfig.hp;
            this.speed = bossRuntimeConfig.speed;
            this.dmg = bossRuntimeConfig.dmg;
            this.armor = Number.isFinite(bossRuntimeConfig.armor) ? bossRuntimeConfig.armor : this.armor;
            this.exp = bossRuntimeConfig.exp;
            this.gold = bossRuntimeConfig.gold;
            this.color = bossRuntimeConfig.color;
        } else {
            this.dmg = clampBossDamage(this.dmg);
        }
        
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
        this.isStatic = bossRuntimeConfig?.isStatic === true || floorNum === 6;

        this.moveSpriteFrames = [];
        this.skillSpriteFrames = [];
        this.moveFrameTransforms = [];
        this.skillFrameTransforms = [];
        this.transformSpriteFrames = [];
        this.transformFrameTransforms = [];
        this.phase2MoveSpriteFrames = [];
        this.phase2MoveFrameTransforms = [];
        this.phase2SkillSpriteFrames = [];
        this.phase2SkillFrameTransforms = [];
        this.activeFrameTransforms = [];
        this.moveFrameBaseline = null;
        this.skillFrameBaseline = null;
        this.transformFrameBaseline = null;
        this.phase2MoveFrameBaseline = null;
        this.phase2SkillFrameBaseline = null;
        this.activeFrameBaseline = null;
        this.activeBossAnim = 'move';
        this.skillAnimLock = 0;
        this.transformAnimSpeed = 8;
        this.phase2AnimSpeed = 7;
        this.phase2SkillAnimSpeed = 7;
        this.phase1SkillMode = 'sequence';
        this.skillUseMoveBaseline = false;
        this.phase2SkillUseMoveBaseline = false;
        this.phase1FloatConfig = null;
        this.phaseFloatSeed = Math.random() * Math.PI * 2;
        this.selectedSkillFrameIndex = null;
        this.phaseTwoActive = false;
        this.phaseTransitionState = null;
        this.phaseTransitionTriggerHp = floorNum === 7 ? Math.max(1, Math.floor(this.maxHp * 0.52)) : 0;
        this.phaseTwoStats = floorNum === 7 ? {
            maxHp: Math.round(this.maxHp * 1.22),
            speed: Math.max(this.speed + 22, 142),
            dmg: this.dmg + 4,
            size: Math.max(this.size + 52, 172),
            color: '#7fd8ff'
        } : null;
        this.animSpeed = 7;
        this.loadBossSpriteFrames();
    }

    takeDamage(amount, isCritOrInfo = false) {
        if (this.phaseTransitionState?.active) {
            const game = window.game;
            game?.damageNumbers?.spawn?.(this.cx, this.cy - 10, '免疫', { color: '#8fe9ff', size: 14, life: 0.45 });
            return false;
        }

        if (this.bossFloor === 7 && !this.phaseTwoActive) {
            const triggerHp = this.phaseTransitionTriggerHp || Math.max(1, Math.floor(this.maxHp * 0.52));
            const wouldHp = this.hp - amount;
            if (wouldHp <= triggerHp) {
                const applied = Math.max(0, this.hp - triggerHp);
                if (applied > 0) {
                    super.takeDamage(applied, isCritOrInfo);
                }
                this.hp = Math.max(triggerHp, this.hp);
                this.beginFloor7PhaseTransition(window.game?.curRoom);
                return false;
            }
        }

        return super.takeDamage(amount, isCritOrInfo);
    }

    update(dt, player, room) {
        // Use NewEnemy update for basic movement (unless charging/static)
        if (!this.isCharging && !this.chargeWarning && !this.isStatic && !this.phaseTransitionState?.active) {
            // Call parent update but skip if we're handling boss AI
            this.updateBasicMovement(dt, player, room);
        }
        
        // Boss AI
        this.updateBossAI(dt, player, room);
        this.updateBossAnimation(dt);
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
        
        if (this.vx !== 0 || this.vy !== 0) this.walkCycle += dt * 8;
        else this.walkCycle = 0;
    }

    async loadBossSpriteFrames() {
        const frameSet = getBossAnimationSet(this.bossFloor);
        if (Number.isFinite(frameSet?.moveFps) && frameSet.moveFps > 0) {
            this.animSpeed = frameSet.moveFps;
        }
        if (Number.isFinite(frameSet?.transformFps) && frameSet.transformFps > 0) {
            this.transformAnimSpeed = frameSet.transformFps;
        }
        if (Number.isFinite(frameSet?.phase2MoveFps) && frameSet.phase2MoveFps > 0) {
            this.phase2AnimSpeed = frameSet.phase2MoveFps;
        }
        if (Number.isFinite(frameSet?.phase2SkillFps) && frameSet.phase2SkillFps > 0) {
            this.phase2SkillAnimSpeed = frameSet.phase2SkillFps;
        }
        this.phase1SkillMode = String(frameSet?.skillMode || 'sequence');
        this.skillUseMoveBaseline = !!frameSet?.skillUseMoveBaseline;
        this.phase2SkillUseMoveBaseline = !!frameSet?.phase2SkillUseMoveBaseline;
        this.phase1FloatConfig = frameSet?.phase1Float ? JSON.parse(JSON.stringify(frameSet.phase1Float)) : null;
        if (!frameSet.move.length && !frameSet.skill.length) {
            this.moveSpriteFrames = this.spriteFrames.slice();
            this.moveFrameTransforms = this.spriteFrames.map(() => ({ x: 0, y: 0, scale: 1, rot: 0, flipX: false }));
            this.moveFrameBaseline = this._buildBossFrameBaseline(this.moveSpriteFrames, this.moveFrameTransforms);
            return;
        }

        const moveLoaded = await this._loadFrameListWithCutout(frameSet.move);
        const skillLoaded = await this._loadFrameListWithCutout(frameSet.skill);
        const transformLoaded = await this._loadFrameListWithCutout(frameSet.transform);
        const phase2MoveLoaded = await this._loadFrameListWithCutout(frameSet.phase2Move);
        const phase2SkillLoaded = await this._loadFrameListWithCutout(frameSet.phase2Skill);

        if (moveLoaded.frames.length > 0) {
            this.moveSpriteFrames = moveLoaded.frames;
            this.moveFrameTransforms = moveLoaded.transforms;
            this.moveFrameBaseline = this._buildBossFrameBaseline(this.moveSpriteFrames, this.moveFrameTransforms);
            this.spriteFrames = moveLoaded.frames.slice();
            this.activeFrameTransforms = this.moveFrameTransforms;
            this.activeFrameBaseline = this.moveFrameBaseline;
            this.loadedFrameCount = this.spriteFrames.length;
            this.spriteLoaded = true;
        }
        if (skillLoaded.frames.length > 0) {
            this.skillSpriteFrames = skillLoaded.frames;
            this.skillFrameTransforms = skillLoaded.transforms;
            this.skillFrameBaseline = this._buildBossFrameBaseline(this.skillSpriteFrames, this.skillFrameTransforms);
        }
        if (transformLoaded.frames.length > 0) {
            this.transformSpriteFrames = transformLoaded.frames;
            this.transformFrameTransforms = transformLoaded.transforms;
            this.transformFrameBaseline = this._buildBossFrameBaseline(this.transformSpriteFrames, this.transformFrameTransforms);
        }
        if (phase2MoveLoaded.frames.length > 0) {
            this.phase2MoveSpriteFrames = phase2MoveLoaded.frames;
            this.phase2MoveFrameTransforms = phase2MoveLoaded.transforms;
            this.phase2MoveFrameBaseline = this._buildBossFrameBaseline(this.phase2MoveSpriteFrames, this.phase2MoveFrameTransforms);
        }
        if (phase2SkillLoaded.frames.length > 0) {
            this.phase2SkillSpriteFrames = phase2SkillLoaded.frames;
            this.phase2SkillFrameTransforms = phase2SkillLoaded.transforms;
            this.phase2SkillFrameBaseline = this._buildBossFrameBaseline(this.phase2SkillSpriteFrames, this.phase2SkillFrameTransforms);
        }
    }

    _normalizeBossFrameEntry(entry) {
        if (typeof entry === 'string') {
            return { src: entry, x: 0, y: 0, scale: 1, rot: 0, flipX: false };
        }
        return {
            src: String(entry?.src || ''),
            x: Number.isFinite(entry?.x) ? Number(entry.x) : 0,
            y: Number.isFinite(entry?.y) ? Number(entry.y) : 0,
            scale: Number.isFinite(entry?.scale) ? Number(entry.scale) : 1,
            rot: Number.isFinite(entry?.rot) ? Number(entry.rot) : 0,
            flipX: !!entry?.flipX
        };
    }

    _loadFrameListWithCutout(entries) {
        if (!Array.isArray(entries) || entries.length === 0) {
            return Promise.resolve({ frames: [], transforms: [] });
        }
        const tasks = entries.map((entry) => new Promise((resolve) => {
            const normalized = this._normalizeBossFrameEntry(entry);
            const src = normalized.src;
            if (!src) {
                resolve(null);
                return;
            }
            const img = new Image();
            img.onload = () => {
                if (typeof src === 'string' && src.includes('/enemies/boss/')) {
                    resolve({ img: this._cutoutBossBackground(img), tf: normalized });
                    return;
                }
                resolve({ img, tf: normalized });
            };
            img.onerror = () => resolve(null);
            img.src = src;
        }));
        return Promise.all(tasks).then((results) => {
            const ok = results.filter(Boolean);
            return {
                frames: ok.map(r => r.img),
                transforms: ok.map(r => r.tf)
            };
        });
    }

    _buildBossFrameBaseline(frames, transforms) {
        if (!frames || frames.length === 0) return null;
        const first = frames[0];
        if (!first) return null;
        const t0 = transforms?.[0] || { x: 0, y: 0, scale: 1 };
        const firstHeight = Math.max(1, first.height || 1);
        const firstWidth = Math.max(1, first.width || 1);
        const baseScaleRaw = this.size / firstHeight;
        const baseScale = baseScaleRaw * (Number.isFinite(t0.scale) ? t0.scale : 1);
        return {
            firstX: Number.isFinite(t0.x) ? t0.x : 0,
            firstY: Number.isFinite(t0.y) ? t0.y : 0,
            anchorX: (firstWidth / 2) * baseScale,
            bottomY: firstHeight * baseScale,
            baseScale: baseScaleRaw
        };
    }

    _cutoutBossBackground(img) {
        try {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            ctx.drawImage(img, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            const w = canvas.width;
            const h = canvas.height;
            const visited = new Uint8Array(w * h);
            const stack = [];

            let sr = 0, sg = 0, sb = 0, sc = 0;
            const sample = (x, y) => {
                const i = (y * w + x) * 4;
                if (data[i + 3] < 6) return;
                sr += data[i];
                sg += data[i + 1];
                sb += data[i + 2];
                sc += 1;
            };
            const push = (x, y) => {
                if (x < 0 || y < 0 || x >= w || y >= h) return;
                const idx = y * w + x;
                if (visited[idx]) return;
                visited[idx] = 1;
                stack.push(idx);
            };

            for (let x = 0; x < w; x++) {
                sample(x, 0); sample(x, h - 1);
                push(x, 0); push(x, h - 1);
            }
            for (let y = 0; y < h; y++) {
                sample(0, y); sample(w - 1, y);
                push(0, y); push(w - 1, y);
            }
            if (sc === 0) return img;
            const br = sr / sc, bg = sg / sc, bb = sb / sc;
            const threshold = 66;

            while (stack.length > 0) {
                const idx = stack.pop();
                const x = idx % w;
                const y = (idx / w) | 0;
                const i = idx * 4;
                if (data[i + 3] < 6) continue;

                const dr = data[i] - br;
                const dg = data[i + 1] - bg;
                const db = data[i + 2] - bb;
                if ((dr * dr + dg * dg + db * db) > threshold * threshold) continue;

                data[i + 3] = 0;
                push(x - 1, y); push(x + 1, y); push(x, y - 1); push(x, y + 1);
            }
            ctx.putImageData(imageData, 0, 0);
            return canvas;
        } catch (e) {
            return img;
        }
    }

    triggerSkillAnimation(duration = 0.45) {
        if (this.phaseTransitionState?.active) return;
        if (!this.skillSpriteFrames.length && !this.phase2SkillSpriteFrames.length) return;
        this.activeBossAnim = 'skill';
        this.skillAnimLock = Math.max(this.skillAnimLock, duration);
        this.animTimer = 0;
        this.animFrame = 0;
        if (!this.phaseTwoActive && this.phase1SkillMode === 'random_single' && this.skillSpriteFrames.length > 0) {
            this.selectedSkillFrameIndex = Math.floor(Math.random() * this.skillSpriteFrames.length);
        }
    }

    beginFloor7PhaseTransition(room = window.game?.curRoom) {
        if (this.bossFloor !== 7 || this.phaseTwoActive || this.phaseTransitionState?.active) return;
        const totem = room?.trueEndingBossTotem || {
            x: room?.centerX || this.x,
            y: (room?.centerY || this.y) - 24,
            state: 'idle',
            absorbed: false
        };
        if (room?.trueEndingBossTotem) {
            room.trueEndingBossTotem.state = 'absorbing';
            room.trueEndingBossTotem.absorbed = false;
        }

        this.phaseTransitionState = {
            active: true,
            stage: 'pull',
            timer: 0,
            totemX: totem.x,
            totemY: totem.y + 56,
            pullDuration: 0.75,
            transformDuration: 1.35
        };
        this.isCharging = false;
        this.chargeWarning = false;
        this.vx = 0;
        this.vy = 0;
        this.skillAnimLock = 0;
        this.activeBossAnim = 'move';
        this.animTimer = 0;
        this.animFrame = 0;
        const game = window.game;
        game?.particles?.burst?.(this.cx, this.cy, '#8fe9ff', 18);
        game?.camera?.addShake?.(6);
    }

    completeFloor7PhaseTransition(room = window.game?.curRoom) {
        this.phaseTransitionState = null;
        this.phaseTwoActive = true;
        this.activeBossAnim = 'move';
        this.skillAnimLock = 0;
        if (this.phaseTwoStats) {
            this.maxHp = this.phaseTwoStats.maxHp;
            this.hp = Math.max(this.hp, Math.floor(this.maxHp * 0.68));
            this.speed = this.phaseTwoStats.speed;
            this.dmg = this.phaseTwoStats.dmg;
            this.size = this.phaseTwoStats.size;
            this.color = this.phaseTwoStats.color;
            if (this.phase2MoveSpriteFrames.length > 0) {
                this.phase2MoveFrameBaseline = this._buildBossFrameBaseline(this.phase2MoveSpriteFrames, this.phase2MoveFrameTransforms);
            }
            if (this.phase2SkillSpriteFrames.length > 0) {
                this.phase2SkillFrameBaseline = this._buildBossFrameBaseline(this.phase2SkillSpriteFrames, this.phase2SkillFrameTransforms);
            }
        }
        if (room?.trueEndingBossTotem) {
            room.trueEndingBossTotem.state = 'spent';
            room.trueEndingBossTotem.absorbed = true;
        }
        const game = window.game;
        game?.particles?.burst?.(this.cx, this.cy - 20, '#b56dff', 32);
        game?.camera?.addShake?.(10);
    }

    updateFloor7PhaseTransition(dt, room = window.game?.curRoom) {
        const state = this.phaseTransitionState;
        if (!state?.stage) return false;
        state.timer += dt;

        if (state.stage === 'pull') {
            const dx = state.totemX - this.x;
            const dy = state.totemY - this.y;
            const distToTotem = Math.hypot(dx, dy);
            if (distToTotem > 1) {
                const step = Math.min(distToTotem, 280 * dt);
                this.x += (dx / distToTotem) * step;
                this.y += (dy / distToTotem) * step;
                if (Math.abs(dx) > 4) this.facingRight = dx > 0;
            }
            if (distToTotem <= 10 || state.timer >= state.pullDuration) {
                this.x = state.totemX;
                this.y = state.totemY;
                state.stage = 'transform';
                state.timer = 0;
                this.activeBossAnim = 'transform';
                this.animTimer = 0;
                this.animFrame = 0;
            }
            return true;
        }

        this.activeBossAnim = 'transform';
        if (state.timer >= state.transformDuration) {
            this.completeFloor7PhaseTransition(room);
        }
        return true;
    }

    updateBossAnimation(dt) {
        if (this.skillAnimLock > 0) {
            this.skillAnimLock -= dt;
            if (this.skillAnimLock <= 0) {
                this.activeBossAnim = 'move';
                this.selectedSkillFrameIndex = null;
            }
        }

        const moveFrames = this.moveSpriteFrames.length ? this.moveSpriteFrames : this.spriteFrames;
        let active = moveFrames;
        let activeTransforms = this.moveFrameTransforms;
        let activeBaseline = this.moveFrameBaseline;
        let activeFps = this.animSpeed;

        if (this.phaseTransitionState?.active && this.phaseTransitionState.stage === 'transform' && this.transformSpriteFrames.length > 0) {
            active = this.transformSpriteFrames;
            activeTransforms = this.transformFrameTransforms;
            activeBaseline = this.transformFrameBaseline;
            activeFps = this.transformAnimSpeed;
        } else if (this.phaseTwoActive && this.phase2MoveSpriteFrames.length > 0) {
            const phase2SkillFrames = this.phase2SkillSpriteFrames.length > 0 ? this.phase2SkillSpriteFrames : this.phase2MoveSpriteFrames;
            const phase2SkillTransforms = this.phase2SkillFrameTransforms.length > 0 ? this.phase2SkillFrameTransforms : this.phase2MoveFrameTransforms;
            const phase2SkillBaseline = this.phase2SkillUseMoveBaseline ? (this.phase2MoveFrameBaseline || this.phase2SkillFrameBaseline) : (this.phase2SkillFrameBaseline || this.phase2MoveFrameBaseline);
            active = (this.activeBossAnim === 'skill' && phase2SkillFrames.length > 0) ? phase2SkillFrames : this.phase2MoveSpriteFrames;
            activeTransforms = (this.activeBossAnim === 'skill' && phase2SkillTransforms.length > 0) ? phase2SkillTransforms : this.phase2MoveFrameTransforms;
            activeBaseline = (this.activeBossAnim === 'skill' && phase2SkillBaseline) ? phase2SkillBaseline : this.phase2MoveFrameBaseline;
            activeFps = (this.activeBossAnim === 'skill') ? this.phase2SkillAnimSpeed : this.phase2AnimSpeed;
        } else if (this.activeBossAnim === 'skill' && this.skillSpriteFrames.length > 0) {
            if (this.phase1SkillMode === 'random_single') {
                const idx = Number.isInteger(this.selectedSkillFrameIndex) ? this.selectedSkillFrameIndex : 0;
                const frame = this.skillSpriteFrames[idx] || this.skillSpriteFrames[0];
                const tf = this.skillFrameTransforms[idx] || this.skillFrameTransforms[0] || { x: 0, y: 0, scale: 1, rot: 0, flipX: false };
                active = frame ? [frame] : this.skillSpriteFrames;
                activeTransforms = [tf];
                activeBaseline = this.skillUseMoveBaseline ? (this.moveFrameBaseline || this.skillFrameBaseline) : this.skillFrameBaseline;
                activeFps = 1;
            } else {
                active = this.skillSpriteFrames;
                activeTransforms = this.skillFrameTransforms;
                activeBaseline = this.skillUseMoveBaseline ? (this.moveFrameBaseline || this.skillFrameBaseline) : this.skillFrameBaseline;
            }
        }

        if (active && active.length > 0 && this.spriteFrames !== active) {
            this.spriteFrames = active;
            this.loadedFrameCount = active.length;
            this.animTimer = 0;
            this.animFrame = 0;
        }
        this.activeFrameTransforms = activeTransforms || [];
        this.activeFrameBaseline = activeBaseline || null;
        if (!this.spriteFrames.length) return;

        if (this.activeBossAnim === 'skill' || this.activeBossAnim === 'transform') {
            this.animTimer += dt;
            this.animFrame = Math.floor(this.animTimer * activeFps) % this.spriteFrames.length;
            return;
        }

        const moving = this.isStatic || Math.abs(this.vx) > 0.01 || Math.abs(this.vy) > 0.01 || this.isCharging;
        if (moving) {
            this.animTimer += dt;
            this.animFrame = Math.floor(this.animTimer * activeFps) % this.spriteFrames.length;
        } else {
            this.animTimer = 0;
            this.animFrame = 0;
        }
    }
    
    updateBossAI(dt, player, room) {
        const game = window.game;
        const floor = this.bossFloor;

        if (this.phaseTransitionState?.active) {
            this.updateFloor7PhaseTransition(dt, room);
            return;
        }
        
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
        
        const speedMult = 1 + (phase - 1) * 0.24;
        const dmgMult = 1 + (phase - 1) * 0.45;
        const cdMult = Math.max(0.48, 1 - (phase - 1) * 0.18);
        
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
                const pressure = BOSS_PRESSURE_PROFILE[this.bossFloor || window.game?.currentFloor || 1] || BOSS_PRESSURE_PROFILE[1];
                const chargeSpeed = pressure.chargeSpeed || (420 + Math.max(0, (this.bossFloor || 1) - 1) * 22);
                this.vx = this.chargeDir.x * chargeSpeed;
                this.vy = this.chargeDir.y * chargeSpeed;
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
        const pressure = BOSS_PRESSURE_PROFILE[this.bossFloor || game?.currentFloor || 1] || BOSS_PRESSURE_PROFILE[1];
        
        // Update cooldowns
        for (const key in this.skillCooldowns) {
            if (this.skillCooldowns[key] > 0) this.skillCooldowns[key] -= dt;
        }
        
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        
        // 1. Charge attack
        if (!this.isStatic && this.skillCooldowns.charge <= 0 && dist > 100 && dist < 400) {
            this.skillCooldowns.charge = 8 * cdMult * pressure.cooldownMult;
            this.chargeWarning = true;
            this.chargeWarningTimer = 0;
            this.chargeDir = { x: dx/dist, y: dy/dist };
            this.triggerSkillAnimation(0.8);
            if (game && game.particles && typeof game.particles.burst === 'function') {
                game.particles.burst(this.cx, this.cy, '#f0f', 10);
            }
            return true;
        }
        
        // 2. Shockwave
        if (this.skillCooldowns.shockwave <= 0 && dist < 120) {
            this.skillCooldowns.shockwave = 5 * cdMult * pressure.cooldownMult;
            this.triggerSkillAnimation();
            if (game && game.particles && typeof game.particles.burst === 'function') {
                game.particles.burst(this.cx, this.cy, '#f0f', 20);
            }
            if (dist < 120 && !game.godMode && !player.isDashing) {
                player.takeDamage(clampBossDamage(this.dmg * dmgMult, this.bossFloor));
            }
            return true;
        }
        
        // 3. Bullet hell
        if (this.skillCooldowns.bullet_hell <= 0) {
            this.skillCooldowns.bullet_hell = 6 * cdMult * pressure.cooldownMult;
            this.triggerSkillAnimation();
            const bulletCount = pressure.bulletCount || 12;
            const bulletSpeed = pressure.bulletSpeed || 150;
            for (let i = 0; i < bulletCount; i++) {
                const angle = (i / bulletCount) * Math.PI * 2;
                game.bullets.push({
                    x: this.x, y: this.y,
                    vx: Math.cos(angle) * bulletSpeed,
                    vy: Math.sin(angle) * bulletSpeed,
                    dmg: clampBossDamage(this.dmg * dmgMult, this.bossFloor),
                    color: '#ff00ff', life: 3.2, isEnemyBullet: true
                });
            }
            return true;
        }
        
        // 4. Homing bullets
        if (this.skillCooldowns.homing <= 0) {
            this.skillCooldowns.homing = 4 * cdMult * pressure.cooldownMult;
            this.triggerSkillAnimation();
            const homingCount = pressure.homingCount || 3;
            const homingSpeed = pressure.homingSpeed || 100;
            for (let i = 0; i < homingCount; i++) {
                const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 0.5;
                game.bullets.push({
                    x: this.x, y: this.y,
                    vx: Math.cos(angle) * homingSpeed,
                    vy: Math.sin(angle) * homingSpeed,
                    dmg: clampBossDamage(this.dmg * dmgMult, this.bossFloor),
                    color: '#ff00ff', life: 5.4, isEnemyBullet: true,
                    homing: true, target: player
                });
            }
            return true;
        }
        
        // 5. Summon
        if (this.skillCooldowns.summon <= 0) {
            this.skillCooldowns.summon = 10 * cdMult * pressure.cooldownMult;
            this.triggerSkillAnimation();
            const enemyCount = room.hordeManager ? room.hordeManager.enemies.length : room.enemies.length;
            if (enemyCount < 15) {
                const summonCount = pressure.summonCount || 3;
                for (let i = 0; i < summonCount; i++) {
                    const angle = (i / summonCount) * Math.PI * 2;
                    const r = 80;
                    const sx = this.x + Math.cos(angle) * r;
                    const sy = this.y + Math.sin(angle) * r;
                    // Summon current-floor minions instead of always using the first 5 global weak mobs
                    const summonPool = Object.values(ENEMY_TYPES_NEW).filter(cfg => cfg && cfg.floor === this.bossFloor && cfg.tier >= 1 && cfg.tier <= 2 && cfg.type !== 'boss');
                    const fallbackPool = Object.values(ENEMY_TYPES_NEW).filter(cfg => cfg && cfg.floor === this.bossFloor && cfg.tier >= 1 && cfg.tier <= 3 && cfg.type !== 'boss');
                    const resolvedPool = (summonPool.length ? summonPool : fallbackPool);
                    const selectedCfg = resolvedPool[Math.floor(Math.random() * resolvedPool.length)] || null;
                    if (!selectedCfg?.id) continue;
                    const minion = createEnemy(sx, sy, selectedCfg.id);
                    minion.hp *= pressure.summonHpScale || 0.32;
                    minion.maxHp = minion.hp;
                    minion.dmg = clampBossDamage(minion.dmg * 0.7, this.bossFloor);
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
