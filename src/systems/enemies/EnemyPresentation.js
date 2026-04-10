/**
 * Enemy 碰撞与表现逻辑
 * 从主类中拆分出来的原型扩展，保持运行行为不变。
 */
(function(global) {
    'use strict';

    const Enemy = global.Enemy;
    if (!Enemy) {
        console.warn('[RogueCow] Enemy 尚未加载，跳过扩展。');
        return;
    }

    function getEnemyBrightness() {
        const settings = window.game?.runtimeSettings || window.game?.settings || {};
        const base = Number(settings.entityBrightness ?? 0.4);
        const enemy = Number(settings.enemyBrightness ?? 1);
        const safeBase = Number.isFinite(base) ? Math.max(0, Math.min(1, base)) : 0.4;
        const safeEnemy = Number.isFinite(enemy) ? Math.max(0, Math.min(1.5, enemy)) : 1;
        return Math.max(0, safeBase * safeEnemy);
    }

    Enemy.prototype.getCollisionRadius = function() {
        const sprites = window.game?.sprites;
        const scale = this.getCollisionScale(sprites);

        if (this.spriteData && this.spriteData.bounds) {
            return (this.spriteData.bounds.width * scale) / 2;
        }

        // 回退
        return ((this.size || 24) * scale) * 0.5;
    }

    Enemy.prototype.getCenterY = function() {
        if (this.spriteData?.anchor?.center && this.spriteData?.anchor?.feet) {
            const scale = this.getCollisionScale(window.game?.sprites);
            const dy = (this.spriteData.anchor.center.y - this.spriteData.anchor.feet.y) * scale;
            return this.y + dy;
        }
        // 回退：基于 size 的估算
        return this.y - (this.size || 24) * 0.5;
    }

    Enemy.prototype.containsPoint = function(px, py) {
        const cx = this.x;
        const cy = this.getCenterY();
        const radius = this.getCollisionRadius();
        
        const dx = px - cx;
        const dy = py - cy;
        return (dx * dx + dy * dy) <= (radius * radius);
    }

    Enemy.prototype.intersectsCircle = function(cx, cy, radius) {
        const ex = this.x;
        const ey = this.getCenterY();
        const enemyRadius = this.getCollisionRadius();
        
        const dx = cx - ex;
        const dy = cy - ey;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance <= (radius + enemyRadius);
    }

    Enemy.prototype.intersectsBullet = function(bx, by, bulletRadius) {
        const ex = this.x;
        const ey = this.getCenterY();
        const enemyRadius = this.getCollisionRadius();
        
        const dx = bx - ex;
        const dy = by - ey;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance <= (bulletRadius + enemyRadius);
    }

    Enemy.prototype.getSpriteDimensions = function(sprites) {
        const outlinedSpriteName = this.getOutlinedSpriteName();
        const sprite = sprites?.get(outlinedSpriteName) || sprites?.get(this.sprite);
        return {
            width: sprite?.width || 64,
            height: sprite?.height || 64
        };
    }

    Enemy.prototype.getRenderScale = function(sprites) {
        // 第6层Boss维持独立超大体型
        if (this.isBoss && this.bossFloor === 6) {
            const { height } = this.getSpriteDimensions(sprites);
            return height > 0 ? 300 / height : 1;
        }

        // T1 用贴图原始尺寸；T2/T3/T4 保持合理体型差
        const tierScale = {
            1: 1.0,
            2: 1.2,
            3: 1.45,
            4: 1.75
        };
        return tierScale[this.tier] || 1.0;
    }

    Enemy.prototype.getCollisionScale = function(sprites) {
        return this.getRenderScale(sprites);
    }

    Enemy.prototype.getTargetHeight = function(sprites) {
        const { height } = this.getSpriteDimensions(sprites);
        const canvasScale = typeof window !== 'undefined' && window.game && typeof window.game.getCanvasScale === 'function'
            ? window.game.getCanvasScale()
            : 1;
        return Math.round(height * this.getRenderScale(sprites) * canvasScale);
    }

    Enemy.prototype.draw = function(ctx, sprites) {
        const targetHeight = this.getTargetHeight(sprites);
        const size = targetHeight / 2;  // 用于特效的参考尺寸

        

        if (this.hitTimer > 0 && Math.floor(Date.now() / 50) % 2) {

            ctx.globalAlpha = 0.5;

        }

        

        // 状态效果视觉 - v0.18.4 fix: 使用中心坐标而非脚底坐标
        const centerX = this.cx || this.x;
        const centerY = this.cy || (this.y - (this.size || 24) * 0.5);

        if (this.slowTimer > 0) {
            ctx.strokeStyle = '#48f';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(centerX, centerY, size + 5, 0, Math.PI * 2);
            ctx.stroke();
        }

        if (this.poisonTimer > 0) {
            ctx.strokeStyle = '#4a4';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(centerX, centerY, size + 8, 0, Math.PI * 2);
            ctx.stroke();
        }

        

        // Boss颜色随血量渐变: #800(深红) -> #f00(亮红) - v0.18.4 fix: 使用中心坐标
        if (this.isBoss) {
            const hpPercent = this.hp / this.maxHp;
            // 血量越低，颜色越亮红; 满血时深红#800，30%时亮红#f00
            const r = Math.floor(128 + 127 * (1 - hpPercent));
            const g = 0;
            const b = 0;
            const glowColor = `rgb(${r}, ${g}, ${b})`;
            
            ctx.strokeStyle = glowColor;
            ctx.lineWidth = 3;
            ctx.shadowColor = glowColor;
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(centerX, centerY, size + 10, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
        }

        

        // 绘制敌人精灵（带动画效果）
        // 优先使用描边贴图（根据类型：white普通/red精英/goldBOSS）
        const outlinedSpriteName = this.getOutlinedSpriteName();
        let sprite = sprites.get(outlinedSpriteName);
        // 如果描边贴图不存在，回退到基础贴图
        if (!sprite) {
            sprite = sprites.get(this.sprite);
        }
        
        if (sprite) {
            ctx.save();
            const entityBrightness = getEnemyBrightness();
            
            // 计算动画偏移 - 只有上下移动，没有旋转
            let offsetY = 0;
            let scaleX, scaleY = 1;
            
            // 判断贴图朝向：头朝左还是朝右
            // 头朝右的贴图需要反向翻转
            const headFacingRight = ['turtle', 'dog2', 'goose', 'snail']; // 头朝右的贴图列表
            const isHeadRight = headFacingRight.includes(this.sprite);
            
            // 水平翻转：根据朝向和贴图头部方向计算
            // 玩家在右边(facingRight=true)时，头应该朝右
            // 头朝左的贴图：facingRight ? 不翻转(1) : 翻转(-1)
            // 头朝右的贴图：facingRight ? 翻转(-1) : 不翻转(1)
            if (isHeadRight) {
                scaleX = this.facingRight ? -1 : 1;
            } else {
                scaleX = this.facingRight ? 1 : -1;
            }

            

            const walkPhase = Math.sin(this.walkCycle);

            const walkPhase2 = Math.cos(this.walkCycle);

            

            switch (this.animType) {
                case 'hop': // 跳跃 - 大幅上下弹跳
                    offsetY = Math.abs(Math.sin(this.walkCycle * 0.5)) * -8;
                    break;
                case 'hopfast': // 快速跳跃
                    offsetY = Math.abs(Math.sin(this.walkCycle * 0.8)) * -6;
                    break;
                case 'scurry': // 疾走 - 高频小幅
                    offsetY = walkPhase * 2;
                    break;
                case 'slide': // 滑动 - 平滑
                    offsetY = 0;
                    break;
                case 'flutter': // 振翅 - 快速振动
                    offsetY = Math.sin(this.animTimer * 15) * 3;
                    break;
                case 'waddle': // 摇摆 - 左右摇摆
                    offsetY = Math.abs(walkPhase) * -2;
                    break;
                case 'fly': // 飞行 - 上下浮动
                    offsetY = Math.sin(this.animTimer * 3) * 4;
                    break;
                case 'prowl': // 潜行 - 缓慢接近
                    offsetY = walkPhase2 * 1;
                    break;
                case 'run': // 奔跑
                    offsetY = Math.abs(walkPhase) * -3;
                    break;
                case 'trot': // 小跑
                    offsetY = walkPhase * 2;
                    break;
                case 'slither': // 滑行 - S形
                    offsetY = Math.sin(this.x * 0.1 + this.animTimer * 5) * 2;
                    break;
                case 'heavy': // 沉重 - 慢速大幅
                    offsetY = Math.abs(walkPhase) * -4;
                    break;
                case 'sidle': // 横移
                    offsetY = 0;
                    break;
                case 'crawl': // 爬行
                    offsetY = 4;
                    // v0.33: 移除scaleY压缩，保持贴图原始比例
                    break;
                case 'charge': // 冲锋
                    offsetY = Math.abs(walkPhase) * -2;
                    break;
                case 'dive': // 俯冲
                    offsetY = Math.sin(this.animTimer * 8) * 6;
                    break;
                default: // 默认行走
                    offsetY = walkPhase * 1.5;
            }
            
            // 应用变换 - 只有上下移动和水平翻转，没有旋转
            ctx.translate(this.x, this.y + offsetY);
            ctx.scale(scaleX, scaleY);

            

            // 精英敌人：绘制颜色叠加效果（换色）

            if (this.isElite) {

                // 使用混合模式给精英敌人添加颜色色调

                ctx.save();

                ctx.globalCompositeOperation = 'source-atop';

                ctx.fillStyle = 'rgba(255, 100, 100, 0.4)'; // 红色精英色调

                ctx.fillRect(-size, -size, size * 2, size * 2);

                ctx.restore();

            }

            

            // v0.33: 简化的贴图绘制 - 贴图已裁剪，直接按目标高度绘制
            // 从 bounds 获取贴图尺寸
            let spriteW = sprite.width || 64;
            let spriteH = sprite.height || 64;
            
            // 计算保持比例的尺寸（targetHeight 已在方法开头计算）
            const scale = (size * 2) / spriteH;
            const drawW = spriteW * scale;
            const drawH = spriteH * scale;
            
            // 计算绘制位置（脚底对齐）
            const drawX = -drawW / 2;
            const drawY = -drawH;
            
            // v0.30-opt1: 优化描边
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            ctx.shadowBlur = 6;
            ctx.shadowOffsetX = 0;
            ctx.shadowOffsetY = 0;
            
            // 绘制贴图主体（带描边）
            ctx.filter = `brightness(${entityBrightness})`;
            ctx.drawImage(sprite, drawX, drawY, drawW, drawH);
            ctx.restore();
            
            // 精英敌人发光边框
            if (this.isElite) {
                ctx.save();
                ctx.strokeStyle = 'rgba(255, 80, 80, 0.8)';
                ctx.lineWidth = 2;
                ctx.strokeRect(drawX - 2, drawY - 2, drawW + 4, drawH + 4);
                ctx.restore();
            }

            

            // 精英敌人：添加发光边框效果

            if (this.isElite) {

                ctx.save();

                ctx.strokeStyle = 'rgba(255, 80, 80, 0.8)';

                ctx.lineWidth = 2;

                ctx.strokeRect(-size - 2, -size - 2, size * 2 + 4, size * 2 + 4);

                ctx.restore();

            }

            

            ctx.restore();

        } else {

            // 使用emoji作为后备

            const emojiMap = {

                chick: '🐤', pig: '🐷', sheep: '🐑', dog: '🐕', cat: '🐱',

                bear: '🐻', rabbit: '🐰', bird: '🐦', turtle: '🐢', dog2: '🐺',

                snail: '🐌', squirrel: '🐿️', goose: '🪿',

                duck: '🦆', duck2: '🦆', duck3: '🐥', snake: '🐍',

                crab: '🦀', pigeon: '🕊️', pig2: '🐖', rabbit2: '🐇'

            };

            ctx.fillStyle = '#fff';  // 重置为白色，避免继承黑色背景

            ctx.font = this.isBoss ? '48px Arial' : '24px Arial';

            ctx.textAlign = 'center';

            const entityBrightness = getEnemyBrightness();
            ctx.save();
            ctx.filter = `brightness(${entityBrightness})`;
            ctx.fillText(emojiMap[this.sprite] || '👾', this.x, this.y + 8);
            ctx.restore();

        }

        

        ctx.globalAlpha = 1;

        

        if (this.hp < this.maxHp) {
            const barWidth = this.isBoss ? 100 : 24;
            const barOffset = this.isBoss ? 12 : 8;  // 在精灵顶部之上
            ctx.fillStyle = '#000';
            ctx.fillRect(this.x - barWidth/2, this.y - size * 2 - barOffset, barWidth, 6);
            // v0.9.5 - 使用配置的color
            ctx.fillStyle = this.color || '#f00';
            ctx.fillRect(this.x - barWidth/2, this.y - size * 2 - barOffset, barWidth * (this.hp / this.maxHp), 6);
        }

        

        if (this.isBoss) {

            ctx.fillStyle = '#f0f';

            ctx.font = 'bold 16px Arial';

            ctx.textAlign = 'center';

            ctx.fillText(this.name, this.x, this.y - size - 20);

        }

    }

    Enemy.prototype.getOutlinedSpriteName = function() {
        // v0.12.0 fix: 第6层Boss直接使用配置好的sprite名称(如boss6_yellow)
        if (this.isBoss && this.bossFloor === 6) {
            return this.sprite;
        }
        
        // v0.9.5 - 使用配置中的color属性映射到贴图颜色
        const colorMap = {
            '#fff': 'white',    // T1 白色
            '#48f': 'blue',     // T2 速度 蓝色
            '#4a4': 'green',    // T2 坦克 绿色
            '#f44': 'red',      // T2 射手 红色
            '#a4f': 'purple',   // T2 刺客 紫色
            '#fa0': 'gold',     // T3 金色小Boss
            '#d80': 'gold',     // T3 玄龟
            '#f80': 'gold',     // T3 宝箱怪
            '#fa4': 'gold',     // T3 幽灵
            '#800': 'gold'      // T4 Boss 深红
        };
        
        // 使用配置的color映射，如果没有映射则根据tier回退
        const outlineColor = colorMap[this.color] || 
            (this.tier === 1 ? 'white' : 
             this.tier === 2 ? 'lime' : 
             this.tier >= 3 ? 'gold' : 'white');
        
        return this.sprite + '_' + outlineColor;
    }

    Enemy.prototype.getDisplayName = function() {
        const tierPrefix = {
            1: '',
            2: '强壮',
            3: '凶恶',
            4: '精英',
            5: '首领',
            6: 'BOSS'
        };
        const prefix = tierPrefix[this.tier] || '';
        return prefix ? `[${prefix}] ${this.typeKey}` : this.typeKey;
    }

    Enemy.prototype.drawWithOffset = function(ctx, sprites, floor) {
        // v0.33: 统一使用 getTargetHeight 计算目标高度（传入sprites获取贴图尺寸）
        const targetHeight = this.getTargetHeight(sprites);
        
        // 绘制敌人精灵（带动画效果）- 已经在(0,0)位置
        // 优先使用描边贴图（根据类型：white普通/red精英/goldBOSS）
        const outlinedSpriteName = this.getOutlinedSpriteName();
        let sprite = sprites.get(outlinedSpriteName);
        // 如果描边贴图不存在，回退到基础贴图
        if (!sprite) {
            sprite = sprites.get(this.sprite);
        }
        
        // v0.33-fix: 使用贴图实际尺寸（描边贴图也已裁剪）
        let spriteW = 64, spriteH = 64;
        if (sprite) {
            spriteW = sprite.width || 64;
            spriteH = sprite.height || 64;
        }
        
        // 计算保持比例的绘制尺寸
        const scale = targetHeight / spriteH;
        const drawW = (spriteW * scale) / 2;  // 半宽
        const drawH = (spriteH * scale) / 2;  // 半高
        
        // 用于特效的参考尺寸
        const size = drawH;
        
        if (this.hitTimer > 0 && Math.floor(Date.now() / 50) % 2) {
            ctx.globalAlpha = 0.5;
        }
        
        // 状态效果视觉
        const centerOffsetY = -drawH;
        
        if (this.slowTimer > 0) {
            ctx.strokeStyle = '#48f';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, centerOffsetY, size + 5, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        if (this.poisonTimer > 0) {
            ctx.strokeStyle = '#4a4';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(0, centerOffsetY, size + 8, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        if (this.isBoss) {
            // Boss光环效果 - v0.18.4 fix: 使用中心坐标
            ctx.strokeStyle = `rgba(255, 0, 255, ${0.3 + Math.sin(Date.now() / 200) * 0.2})`;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(0, centerOffsetY, size + 10, 0, Math.PI * 2);
            ctx.stroke();
            
            // 冲撞预警效果 - v0.18.4 fix: 使用中心坐标
            if (this.chargeWarning) {
                const floor = this.bossFloor || 1;
                const bossKey = 'floor' + floor;
                const bossCfg = BOSS_TYPES[bossKey] || BOSS_TYPES.floor1;
                const warningProgress = this.chargeWarningTimer / bossCfg.skills.charge.warningTime;
                const alpha = 0.5 + warningProgress * 0.5;
                const radius = size + 15 + warningProgress * 20;
                
                // 红色闪烁警告圈
                ctx.strokeStyle = `rgba(255, 0, 0, ${alpha})`;
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.arc(0, centerOffsetY, radius, 0, Math.PI * 2);
                ctx.stroke();
                
                // 冲撞方向指示线
                if (this.chargeDir) {
                    ctx.strokeStyle = 'rgba(255, 100, 100, 0.8)';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(0, centerOffsetY);
                    ctx.lineTo(this.chargeDir.x * 100, this.chargeDir.y * 100 + centerOffsetY);
                    ctx.stroke();
                }
                
                // 警告文字
                ctx.fillStyle = '#f00';
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.fillText('!', 0, centerOffsetY - radius - 10);
            }
            
            // 冲撞中效果 - v0.18.4 fix: 使用中心坐标
            if (this.isCharging) {
                ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                ctx.beginPath();
                ctx.arc(0, centerOffsetY, size + 20, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        

        // v0.33: 绘制敌人精灵（带动画效果）- 已经在(0,0)位置
        // sprite 已在前面获取，现在直接绘制
        if (sprite) {

            ctx.save();

            

            // 计算动画偏移 - 只有上下移动，没有旋转
            let offsetY = 0;
            let scaleX, scaleY = 1;
            
            // 判断贴图朝向：头朝左还是朝右
            // 头朝右的贴图需要反向翻转
            const headFacingRight = ['turtle', 'dog2', 'goose', 'snail']; // 头朝右的贴图列表
            const isHeadRight = headFacingRight.includes(this.sprite);
            
            // 水平翻转：根据朝向和贴图头部方向计算
            // 头朝左的贴图：facingRight ? 不翻转(1) : 翻转(-1)
            // 头朝右的贴图：facingRight ? 翻转(-1) : 不翻转(1)
            if (isHeadRight) {
                scaleX = this.facingRight ? -1 : 1;
            } else {
                scaleX = this.facingRight ? 1 : -1;
            }

            

            const walkPhase = Math.sin(this.walkCycle);

            const walkPhase2 = Math.cos(this.walkCycle);

            

            switch (this.animType) {

                case 'hop':
                    offsetY = Math.abs(Math.sin(this.walkCycle * 0.5)) * -8;
                    break;

                case 'hopfast':
                    offsetY = Math.abs(Math.sin(this.walkCycle * 0.8)) * -6;
                    break;

                case 'scurry':
                    offsetY = walkPhase * 2;
                    break;

                case 'slide':
                    offsetY = 0;
                    break;

                case 'flutter':
                    offsetY = Math.sin(this.animTimer * 15) * 3;
                    break;

                case 'waddle':
                    offsetY = Math.abs(walkPhase) * -2;
                    break;

                case 'fly':
                    offsetY = Math.sin(this.animTimer * 3) * 4;
                    break;

                case 'prowl':
                    offsetY = walkPhase2 * 1;
                    break;

                case 'run':
                    offsetY = Math.abs(walkPhase) * -3;
                    break;

                case 'trot':
                    offsetY = walkPhase * 2;
                    break;

                case 'slither':
                    offsetY = Math.sin(this.x * 0.1 + this.animTimer * 5) * 2;
                    break;

                case 'heavy':
                    offsetY = Math.abs(walkPhase) * -4;
                    break;

                case 'sidle':
                    offsetY = 0;
                    break;

                case 'crawl':
                    offsetY = 4;
                    // v0.33: 保持贴图原始比例
                    break;

                case 'charge':
                    offsetY = Math.abs(walkPhase) * -2;
                    break;

                case 'dive':
                    offsetY = Math.sin(this.animTimer * 8) * 6;

                    break;

                default:
                    offsetY = walkPhase * 1.5;

            }

            

            // 应用变换 - 只有上下移动和水平翻转，没有旋转
            ctx.translate(0, offsetY);
            ctx.scale(scaleX, scaleY);

            

            // v0.33: 绘制精灵 - 使用保持比例的尺寸
            // drawW/drawH 是半宽/半高，乘以2得到全尺寸
            ctx.drawImage(sprite, -drawW, -drawH * 2, drawW * 2, drawH * 2);

            

            ctx.restore();

        } else {

            // 使用emoji作为后备

            const emojiMap = {

                chick: '🐤', pig: '🐷', sheep: '🐑', dog: '🐕', cat: '🐱',

                bear: '🐻', rabbit: '🐰', bird: '🐦', turtle: '🐢', dog2: '🐺',

                snail: '🐌', squirrel: '🐿️', goose: '🪿',

                duck: '🦆', duck2: '🦆', duck3: '🐥', snake: '🐍',

                crab: '🦀', pigeon: '🕊️', pig2: '🐖', rabbit2: '🐇'

            };

            ctx.fillStyle = '#fff';  // 重置为白色，避免继承黑色背景

            ctx.font = this.isBoss ? '48px Arial' : '24px Arial';

            ctx.textAlign = 'center';

            ctx.fillText(emojiMap[this.sprite] || '👾', 0, 8);

        }

        

        ctx.globalAlpha = 1;

        

        // 血条 - 始终显示，优化视觉效果
        const barWidth = this.isBoss ? 100 : 32;
        const barHeight = this.isBoss ? 8 : 5;
        // 血条在精灵顶部之上：精灵高度是 drawH*2，再向上偏移
        const barY = -drawH * 2 - (this.isBoss ? 12 : 8);
        const hpPercent = Math.max(0, this.hp / this.maxHp);
        
        // 血条背景（带边框）
        ctx.fillStyle = '#000';
        ctx.fillRect(-barWidth/2 - 1, barY - 1, barWidth + 2, barHeight + 2);
        
        // v0.9.5 - 血条颜色使用配置的color
        ctx.fillStyle = this.color || '#f44';
        ctx.fillRect(-barWidth/2, barY, barWidth * hpPercent, barHeight);
        
        // 血条空槽
        ctx.fillStyle = '#222';
        ctx.fillRect(-barWidth/2 + barWidth * hpPercent, barY, barWidth * (1 - hpPercent), barHeight);
        
        // v0.9.5 - T3/T4显示血量数字
        if (this.tier >= 3) {
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'center';
            const hpText = `${Math.floor(this.hp)}/${this.maxHp}`;
            ctx.fillText(hpText, 0, barY - 5);
        }
        
        if (this.isBoss) {

            ctx.fillStyle = '#f0f';

            ctx.font = 'bold 16px Arial';

            ctx.textAlign = 'center';

            ctx.fillText(this.name, 0, -size - 35);

        }

    }

    global.Enemy = Enemy;
})(window);
