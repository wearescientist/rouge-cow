/**
 * LightningSystem - 闪电/激光系统
 * 连锁闪电、激光武器、落雷效果
 */

class LightningSystem {
    constructor(world) {
        this.world = world;
        this.priority = 55;
        this.enabled = true;
        
        // 活跃效果
        this.activeLightnings = [];
        this.activeLasers = [];
        
        // 配置
        this.config = {
            lightningSegments: 20,
            jitter: 5
        };
    }
    
    init() {
        // 监听闪电触发
        this.world.on('chainLightning', (data) => {
            this.createChainLightning(data.source, data.target, data.damage, data.chainCount);
        });
        
        // 监听激光射击
        this.world.on('laserFired', (data) => {
            this.createLaser(data.source, data.direction, data.damage, data.duration);
        });
        
        // 监听落雷
        this.world.on('thunderStrike', (data) => {
            this.createThunderStrike(data.x, data.y, data.damage);
        });
    }
    
    /**
     * 创建连锁闪电
     */
    createChainLightning(source, firstTarget, damage, maxChains = 5) {
        const targets = [firstTarget];
        const chain = [{
            from: source,
            to: firstTarget,
            delay: 0
        }];
        
        // 寻找连锁目标
        let currentTarget = firstTarget;
        const chainRange = 200;
        const hitEntities = new Set([source.id, firstTarget.id]);
        
        for (let i = 0; i < maxChains - 1; i++) {
            const nextTarget = this.findNextChainTarget(currentTarget, chainRange, hitEntities);
            if (!nextTarget) break;
            
            chain.push({
                from: currentTarget,
                to: nextTarget,
                delay: (i + 1) * 0.1
            });
            
            targets.push(nextTarget);
            hitEntities.add(nextTarget.id);
            currentTarget = nextTarget;
        }
        
        // 创建闪电效果
        const lightning = {
            type: 'chain',
            segments: chain,
            damage: damage,
            life: 0.3,
            maxLife: 0.3,
            branchPoints: []
        };
        
        // 生成分支点
        chain.forEach(seg => {
            if (Math.random() < 0.3) {
                this.createBranch(seg, lightning);
            }
        });
        
        this.activeLightnings.push(lightning);
        
        // 造成伤害（带延迟）
        chain.forEach((seg, i) => {
            setTimeout(() => {
                const combat = this.world.getSystem(CombatSystem);
                if (combat && seg.to.active) {
                    const actualDamage = damage * Math.pow(0.7, i); // 衰减
                    combat.dealDamage(source, seg.to, actualDamage, { isLightning: true });
                    
                    // 麻痹效果
                    const statusEffect = this.world.getSystem(StatusEffectSystem);
                    if (statusEffect) {
                        statusEffect.addEffect(seg.to, 'stun', 0.2);
                    }
                }
            }, seg.delay * 1000);
        });
        
        // 播放音效
        this.world.emit('playSoundAt', 'lightning', 
            (source.get(TransformComponent)?.x || 0),
            (source.get(TransformComponent)?.y || 0)
        );
    }
    
    /**
     * 寻找下一个连锁目标
     */
    findNextChainTarget(fromEntity, range, excludeIds) {
        const fromTransform = fromEntity.get(TransformComponent);
        if (!fromTransform) return null;
        
        const enemies = this.world.getEntitiesWithTag('enemy');
        let bestTarget = null;
        let bestDist = range;
        
        for (const enemy of enemies) {
            if (excludeIds.has(enemy.id)) continue;
            if (!enemy.active) continue;
            
            const transform = enemy.get(TransformComponent);
            if (!transform) continue;
            
            const dx = transform.x - fromTransform.x;
            const dy = transform.y - fromTransform.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < bestDist) {
                bestDist = dist;
                bestTarget = enemy;
            }
        }
        
        return bestTarget;
    }
    
    /**
     * 创建分支闪电
     */
    createBranch(segment, parentLightning) {
        const toTransform = segment.to.get(TransformComponent);
        if (!toTransform) return;
        
        const angle = Math.random() * Math.PI * 2;
        const length = 30 + Math.random() * 50;
        
        parentLightning.branchPoints.push({
            x: toTransform.x,
            y: toTransform.y,
            angle: angle,
            length: length,
            life: 0.2
        });
    }
    
    /**
     * 创建激光
     */
    createLaser(source, direction, damage, duration) {
        const sourceTransform = source.get(TransformComponent);
        if (!sourceTransform) return;
        
        const laser = {
            type: 'laser',
            source: source,
            startX: sourceTransform.x,
            startY: sourceTransform.y,
            direction: direction,
            angle: Math.atan2(direction.y, direction.x),
            length: 0,
            maxLength: 800,
            width: 4,
            damage: damage,
            duration: duration,
            life: duration,
            hitEntities: new Set(),
            expanding: true,
            chargeTime: 0.2,
            color: '#00FFFF'
        };
        
        this.activeLasers.push(laser);
    }
    
    /**
     * 创建落雷
     */
    createThunderStrike(x, y, damage) {
        const strike = {
            type: 'strike',
            x: x,
            y: y,
            radius: 60,
            damage: damage,
            life: 0.5,
            maxLife: 0.5,
            branches: this.generateStrikeBranches(x, y)
        };
        
        this.activeLightnings.push(strike);
        
        // 立即造成伤害
        const enemies = this.world.getEntitiesWithTag('enemy');
        const combat = this.world.getSystem(CombatSystem);
        
        enemies.forEach(enemy => {
            const transform = enemy.get(TransformComponent);
            if (!transform) return;
            
            const dx = transform.x - x;
            const dy = transform.y - y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist < strike.radius && combat) {
                combat.dealDamage(null, enemy, damage, { isLightning: true });
            }
        });
        
        // 屏幕震动
        this.world.emit('screenShake', { intensity: 5, duration: 0.3 });
    }
    
    /**
     * 生成分支
     */
    generateStrikeBranches(x, y) {
        const branches = [];
        const count = 3 + Math.floor(Math.random() * 3);
        
        for (let i = 0; i < count; i++) {
            const points = [];
            let cx = x;
            let cy = y;
            const segments = 5 + Math.floor(Math.random() * 5);
            const baseAngle = -Math.PI / 2 + (Math.random() - 0.5);
            
            for (let j = 0; j < segments; j++) {
                const angle = baseAngle + (Math.random() - 0.5) * 0.5;
                const len = 20 + Math.random() * 30;
                cx += Math.cos(angle) * len;
                cy += Math.sin(angle) * len;
                points.push({ x: cx, y: cy });
            }
            
            branches.push(points);
        }
        
        return branches;
    }
    
    update(dt) {
        // 更新激光
        this.activeLasers = this.activeLasers.filter(laser => {
            laser.life -= dt;
            
            if (laser.life <= 0) return false;
            
            // 充能阶段
            if (laser.chargeTime > 0) {
                laser.chargeTime -= dt;
                return true;
            }
            
            // 扩展长度
            if (laser.expanding) {
                laser.length += 800 * dt;
                if (laser.length >= laser.maxLength) {
                    laser.expanding = false;
                }
            }
            
            // 持续伤害
            this.dealLaserDamage(laser);
            
            return true;
        });
        
        // 更新闪电
        this.activeLightnings = this.activeLightnings.filter(lightning => {
            lightning.life -= dt;
            
            // 更新分支
            if (lightning.branchPoints) {
                lightning.branchPoints.forEach(branch => {
                    branch.life -= dt;
                });
                lightning.branchPoints = lightning.branchPoints.filter(b => b.life > 0);
            }
            
            return lightning.life > 0;
        });
    }
    
    /**
     * 激光持续伤害
     */
    dealLaserDamage(laser) {
        const endX = laser.startX + Math.cos(laser.angle) * laser.length;
        const endY = laser.startY + Math.sin(laser.angle) * laser.length;
        
        const enemies = this.world.getEntitiesWithTag('enemy');
        const combat = this.world.getSystem(CombatSystem);
        if (!combat) return;
        
        enemies.forEach(enemy => {
            if (laser.hitEntities.has(enemy.id)) return;
            
            const transform = enemy.get(TransformComponent);
            if (!transform) return;
            
            const dist = this.pointToLineDistance(
                transform.x, transform.y,
                laser.startX, laser.startY,
                endX, endY
            );
            
            if (dist < laser.width + 10) {
                combat.dealDamage(laser.source, enemy, laser.damage * 0.1); // 持续伤害
                laser.hitEntities.add(enemy.id);
            }
        });
    }
    
    /**
     * 点到线段的距离
     */
    pointToLineDistance(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) {
            param = dot / lenSq;
        }
        
        let xx, yy;
        
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        const dx = px - xx;
        const dy = py - yy;
        
        return Math.sqrt(dx * dx + dy * dy);
    }
    
    render(ctx) {
        // 渲染激光
        this.activeLasers.forEach(laser => {
            this.renderLaser(ctx, laser);
        });
        
        // 渲染闪电
        this.activeLightnings.forEach(lightning => {
            if (lightning.type === 'chain') {
                this.renderChainLightning(ctx, lightning);
            } else if (lightning.type === 'strike') {
                this.renderThunderStrike(ctx, lightning);
            }
        });
    }
    
    renderLaser(ctx, laser) {
        const endX = laser.startX + Math.cos(laser.angle) * laser.length;
        const endY = laser.startY + Math.sin(laser.angle) * laser.length;
        
        const alpha = laser.chargeTime > 0 ? 0.3 : 1;
        const width = laser.chargeTime > 0 ? 1 : laser.width;
        
        ctx.save();
        ctx.globalAlpha = alpha * (laser.life / laser.duration);
        
        // 外发光
        ctx.shadowColor = laser.color;
        ctx.shadowBlur = 20;
        
        // 核心光束
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = width;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(laser.startX, laser.startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        
        // 外层
        ctx.strokeStyle = laser.color;
        ctx.lineWidth = width * 2;
        ctx.globalAlpha = alpha * 0.5;
        ctx.stroke();
        
        ctx.restore();
    }
    
    renderChainLightning(ctx, lightning) {
        const alpha = lightning.life / lightning.maxLife;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 15;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        lightning.segments.forEach(seg => {
            const fromTransform = seg.from.get(TransformComponent);
            const toTransform = seg.to.get(TransformComponent);
            
            if (!fromTransform || !toTransform) return;
            
            this.drawLightningPath(
                ctx,
                fromTransform.x, fromTransform.y,
                toTransform.x, toTransform.y,
                this.config.lightningSegments
            );
        });
        
        // 渲染分支
        if (lightning.branchPoints) {
            ctx.lineWidth = 1;
            ctx.globalAlpha = alpha * 0.5;
            
            lightning.branchPoints.forEach(branch => {
                if (branch.life <= 0) return;
                
                const endX = branch.x + Math.cos(branch.angle) * branch.length;
                const endY = branch.y + Math.sin(branch.angle) * branch.length;
                
                this.drawLightningPath(ctx, branch.x, branch.y, endX, endY, 5);
            });
        }
        
        ctx.restore();
    }
    
    renderThunderStrike(ctx, strike) {
        const alpha = strike.life / strike.maxLife;
        
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.shadowColor = '#FFFFFF';
        ctx.shadowBlur = 30;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        
        // 主干
        ctx.beginPath();
        ctx.moveTo(strike.x, strike.y - 300);
        ctx.lineTo(strike.x, strike.y);
        ctx.stroke();
        
        // 分支
        ctx.lineWidth = 2;
        ctx.shadowBlur = 15;
        
        strike.branches.forEach(branch => {
            ctx.beginPath();
            ctx.moveTo(strike.x, strike.y);
            
            branch.forEach(point => {
                ctx.lineTo(point.x, point.y);
            });
            
            ctx.stroke();
        });
        
        // 冲击波
        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.arc(strike.x, strike.y, strike.radius * (1 - alpha), 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    /**
     * 绘制锯齿状闪电路径
     */
    drawLightningPath(ctx, x1, y1, x2, y2, segments) {
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        
        for (let i = 1; i < segments; i++) {
            const t = i / segments;
            const x = x1 + (x2 - x1) * t;
            const y = y1 + (y2 - y1) * t;
            
            // 添加抖动
            const jitter = this.config.jitter * (1 - Math.abs(t - 0.5) * 2);
            const jx = x + (Math.random() - 0.5) * jitter * 2;
            const jy = y + (Math.random() - 0.5) * jitter * 2;
            
            ctx.lineTo(jx, jy);
        }
        
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
}

window.LightningSystem = LightningSystem;
