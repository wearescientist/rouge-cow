(function attachBloodStainSystem(global) {
class BloodStainParticle {
    constructor(x, y, angle, speed, size, color, life) {
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = speed;
        this.size = size; // 1-3像素
        this.color = color;
        this.life = life; // 0-1, 血迹是永久的所以为1
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
    }
}

// 🩸 血迹喷溅 - 由大量血点粒子组成的血迹
class BloodStain {
    constructor(x, y, enemyColor, isBoss = false, hitDir = null, enemyType = 'normal') {
        this.x = x;
        this.y = y;
        this.isBoss = isBoss;
        this.particles = [];
        this.createdAt = performance.now();
        this.lifetimeMs = 3000;
        
        // 基础红色主题（所有敌人通用的主色调）
        const redTheme = {
            deep: ['#3a0000', '#4a0000', '#500000', '#550000'],
            mid: ['#600000', '#700000', '#800000', '#8b0000'],
            bright: ['#a00000', '#b00000', '#c00000'],
            bone: ['#dddddd', '#cccccc', '#eeeeee']
        };
        
        // 特殊类型敌人的点缀色（8%概率使用）
        const accentColors = {
            normal: null, // 普通敌人没有点缀色
            speed: ['#0066cc', '#0088ff', '#3399ff', '#66aaff'], // 蓝色
            tank: ['#33aa33', '#44cc44', '#55dd55', '#66ee66'], // 绿色
            ranged: ['#cc4400', '#ff5500', '#ff7733', '#ff9944'], // 橙红色
            assassin: ['#8800cc', '#aa00ff', '#bb33ff', '#cc66ff'] // 紫色
        };
        
        // 获取点缀色配置
        const accent = accentColors[enemyType] || null;
        
        // 随机选择喷溅模式
        const sprayModes = ['directional', 'explosion', 'drip', 'fan'];
        const sprayMode = hitDir !== null ? 'directional' : sprayModes[Math.floor(Math.random() * sprayModes.length)];
        
        // 随机大小系数（0.7 - 1.5倍）
        const sizeMultiplier = 0.7 + Math.random() * 0.8;
        
        // 血点数量 - 根据大小调整
        const baseCount = isBoss ? 300 : (60 + Math.floor(Math.random() * 60));
        const count = Math.floor(baseCount * sizeMultiplier);
        
        // 根据喷溅模式生成血点
        switch(sprayMode) {
            case 'directional':
                this.generateDirectionalSpray(x, y, hitDir || Math.random() * Math.PI * 2, count, redTheme, accent, sizeMultiplier);
                break;
            case 'explosion':
                this.generateExplosionSpray(x, y, count, redTheme, accent, sizeMultiplier);
                break;
            case 'drip':
                this.generateDripSpray(x, y, count, redTheme, accent, sizeMultiplier);
                break;
            case 'fan':
                this.generateFanSpray(x, y, hitDir || Math.random() * Math.PI * 2, count, redTheme, accent, sizeMultiplier);
                break;
        }

        this.boundsRadius = this.computeBoundsRadius();
    }

    computeBoundsRadius() {
        let maxRadius = 12;
        for (const p of this.particles) {
            const dx = p.x - this.x;
            const dy = p.y - this.y;
            const extra = p.isStreak ? (p.streakLength || 0) * 0.5 : (p.size || 1);
            maxRadius = Math.max(maxRadius, Math.hypot(dx, dy) + extra);
        }
        return maxRadius;
    }
    
    // 方向性喷溅（被击中方向向后喷）
    generateDirectionalSpray(x, y, hitDir, count, theme, accent, sizeMult) {
        // 中心血泊（40%）
        const centerCount = Math.floor(count * 0.4);
        for (let i = 0; i < centerCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 25 * sizeMult;
            this.addBloodParticle(x, y, angle, dist, theme, accent, 0.8, 2, 4);
        }
        
        // 向后喷溅（40%）
        const sprayCount = Math.floor(count * 0.4);
        for (let i = 0; i < sprayCount; i++) {
            // 向后扇形喷溅
            const spread = Math.PI / 1.5; // 120度
            const angle = hitDir + Math.PI + (Math.random() - 0.5) * spread;
            const dist = (20 + Math.random() * 50) * sizeMult;
            this.addBloodParticle(x, y, angle, dist, theme, accent, 0.7, 1, 3);
        }
        
        // 随机飞溅（20%）
        const randomCount = count - centerCount - sprayCount;
        for (let i = 0; i < randomCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = (30 + Math.random() * 60) * sizeMult;
            this.addBloodParticle(x, y, angle, dist, theme, accent, 0.6, 1, 2);
        }
        
        // 添加血丝
        this.addStreaks(x, y, hitDir + Math.PI, 3 + Math.floor(4 * sizeMult), theme, accent, sizeMult);
    }
    
    // 爆炸式喷溅（向四周不均匀喷）
    generateExplosionSpray(x, y, count, theme, accent, sizeMult) {
        // 中心密集
        const centerCount = Math.floor(count * 0.35);
        for (let i = 0; i < centerCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 20 * sizeMult;
            this.addBloodParticle(x, y, angle, dist, theme, accent, 0.9, 2, 4);
        }
        
        // 随机方向爆发（不均匀）
        const burstCount = Math.floor(count * 0.5);
        // 2-4个主要爆发方向
        const burstDirs = 2 + Math.floor(Math.random() * 3);
        for (let i = 0; i < burstCount; i++) {
            // 选择主要方向
            const mainDir = Math.floor(Math.random() * burstDirs) * (Math.PI * 2 / burstDirs);
            const spread = Math.PI / 3;
            const angle = mainDir + (Math.random() - 0.5) * spread;
            const dist = (25 + Math.random() * 70) * sizeMult;
            this.addBloodParticle(x, y, angle, dist, theme, accent, 0.7, 1, 3);
        }
        
        // 外围零散血点
        const outerCount = count - centerCount - burstCount;
        for (let i = 0; i < outerCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = (50 + Math.random() * 80) * sizeMult;
            this.addBloodParticle(x, y, angle, dist, theme, accent, 0.5, 1, 2);
        }
        
        this.addStreaks(x, y, null, 4 + Math.floor(5 * sizeMult), theme, accent, sizeMult);
    }
    
    // 滴落式（向下流淌）
    generateDripSpray(x, y, count, theme, accent, sizeMult) {
        // 中心血泊
        const centerCount = Math.floor(count * 0.5);
        for (let i = 0; i < centerCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 20 * sizeMult;
            this.addBloodParticle(x, y, angle, dist, theme, accent, 0.85, 2, 4);
        }
        
        // 向下滴落
        const dripCount = Math.floor(count * 0.4);
        for (let i = 0; i < dripCount; i++) {
            // 主要向下，带随机偏移
            const angle = Math.PI / 2 + (Math.random() - 0.5) * 0.8;
            const dist = (20 + Math.random() * 60) * sizeMult;
            this.addBloodParticle(x, y, angle, dist, theme, accent, 0.75, 1, 3);
        }
        
        // 飞溅
        const splashCount = count - centerCount - dripCount;
        for (let i = 0; i < splashCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = (30 + Math.random() * 40) * sizeMult;
            this.addBloodParticle(x, y, angle, dist, theme, accent, 0.6, 1, 2);
        }
        
        // 向下流淌的血丝（8%概率点缀色）
        for (let i = 0; i < 3 + Math.floor(3 * sizeMult); i++) {
            const angle = Math.PI / 2 + (Math.random() - 0.5) * 0.5;
            const dist = 20 + Math.random() * 50 * sizeMult;
            const length = (3 + Math.random() * 6) * sizeMult;
            // 血丝也使用点缀色
            let streakColor;
            if (accent && Math.random() < 0.08) {
                streakColor = accent[Math.floor(Math.random() * accent.length)];
            } else {
                streakColor = theme.mid[Math.floor(Math.random() * theme.mid.length)];
            }
            this.particles.push({
                x: x + Math.cos(angle) * dist,
                y: y + Math.sin(angle) * dist,
                size: 1,
                isStreak: true,
                streakLength: length,
                streakAngle: angle,
                color: streakColor,
                alpha: 0.8
            });
        }
    }
    
    // 扇形喷溅（宽角度）
    generateFanSpray(x, y, baseDir, count, theme, accent, sizeMult) {
        // 中心
        const centerCount = Math.floor(count * 0.3);
        for (let i = 0; i < centerCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = Math.random() * 22 * sizeMult;
            this.addBloodParticle(x, y, angle, dist, theme, accent, 0.85, 2, 4);
        }
        
        // 扇形喷溅（180度）
        const fanCount = Math.floor(count * 0.55);
        const fanSpread = Math.PI; // 180度
        for (let i = 0; i < fanCount; i++) {
            const angle = baseDir + Math.PI / 2 + (Math.random() - 0.5) * fanSpread;
            const dist = (25 + Math.random() * 60) * sizeMult;
            this.addBloodParticle(x, y, angle, dist, theme, accent, 0.7, 1, 3);
        }
        
        // 其他方向
        const otherCount = count - centerCount - fanCount;
        for (let i = 0; i < otherCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = (40 + Math.random() * 50) * sizeMult;
            this.addBloodParticle(x, y, angle, dist, theme, accent, 0.6, 1, 2);
        }
        
        this.addStreaks(x, y, baseDir + Math.PI / 2, 3 + Math.floor(4 * sizeMult), theme, accent, sizeMult);
    }
    
    // 添加单个血点粒子
    addBloodParticle(cx, cy, angle, dist, theme, accent, alphaBase, minSize, maxSize) {
        const px = cx + Math.cos(angle) * dist;
        const py = cy + Math.sin(angle) * dist;
        
        // 距离越远血点越小
        const distFactor = Math.max(0.5, 1 - dist / 100);
        const size = minSize + Math.random() * (maxSize - minSize) * distFactor;
        
        // 随机选择颜色
        let color;
        const rand = Math.random();
        
        // 8%概率使用点缀色（特殊敌人类型）
        if (accent && rand < 0.08) {
            color = accent[Math.floor(Math.random() * accent.length)];
        } else if (rand < 0.45) {
            color = theme.deep[Math.floor(Math.random() * theme.deep.length)];
        } else if (rand < 0.75) {
            color = theme.mid[Math.floor(Math.random() * theme.mid.length)];
        } else if (rand < 0.92) {
            color = theme.bright[Math.floor(Math.random() * theme.bright.length)];
        } else {
            // 8%几率生成骨块（白色）
            color = theme.bone[Math.floor(Math.random() * theme.bone.length)];
        }
        
        this.particles.push({
            x: px,
            y: py,
            size: Math.max(1, size),
            color: color,
            alpha: alphaBase + Math.random() * 0.2
        });
    }
    
    // 添加血丝
    addStreaks(cx, cy, preferredDir, count, theme, accent, sizeMult) {
        for (let i = 0; i < count; i++) {
            let angle;
            if (preferredDir !== null) {
                angle = preferredDir + (Math.random() - 0.5) * (Math.PI / 2);
            } else {
                angle = Math.random() * Math.PI * 2;
            }
            const dist = (20 + Math.random() * 50) * sizeMult;
            const length = (2 + Math.random() * 5) * sizeMult;
            
            // 血丝也使用点缀色（8%概率）
            let streakColor;
            if (accent && Math.random() < 0.08) {
                streakColor = accent[Math.floor(Math.random() * accent.length)];
            } else {
                streakColor = theme.mid[Math.floor(Math.random() * theme.mid.length)];
            }
            
            this.particles.push({
                x: cx + Math.cos(angle) * dist,
                y: cy + Math.sin(angle) * dist,
                size: 1,
                isStreak: true,
                streakLength: length,
                streakAngle: angle,
                color: streakColor,
                alpha: 0.75
            });
        }
    }
    
    draw(ctx, camera) {
        const canvas = ctx && ctx.canvas;
        const center = camera && camera.worldToScreen ? camera.worldToScreen(this.x, this.y) : { x: this.x, y: this.y };
        const cullMargin = this.boundsRadius + 20;
        if (canvas && (center.x < -cullMargin || center.y < -cullMargin || center.x > canvas.width + cullMargin || center.y > canvas.height + cullMargin)) {
            return;
        }

        const ageMs = (performance && performance.now ? performance.now() : Date.now()) - this.createdAt;
        const fadeRatio = ageMs / Math.max(1, this.lifetimeMs);
        const stride = this.particles.length > 220 ? (fadeRatio > 0.45 ? 3 : 2) : (fadeRatio > 0.7 ? 2 : 1);

        for (let i = 0; i < this.particles.length; i += stride) {
            const p = this.particles[i];
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.alpha;

            let screenX = p.x, screenY = p.y;
            if (camera && camera.worldToScreen) {
                const pos = camera.worldToScreen(p.x, p.y);
                screenX = pos.x;
                screenY = pos.y;
            }
            if (canvas && (screenX < -8 || screenY < -8 || screenX > canvas.width + 8 || screenY > canvas.height + 8)) {
                continue;
            }

            if (p.isStreak) {
                ctx.save();
                ctx.translate(screenX, screenY);
                ctx.rotate(p.streakAngle);
                ctx.fillRect(-p.streakLength/2, -0.5, p.streakLength, 1);
                ctx.restore();
            } else {
                ctx.fillRect(screenX - p.size/2, screenY - p.size/2, p.size, p.size);
            }
        }
        ctx.globalAlpha = 1;
    }
}

// 🩸 血迹管理系统
class BloodStainSystem {
    constructor() {
        this.stainsByRoom = new Map(); // 按房间存储血迹
        this.maxStainsPerRoom = 56;
        this.maxBossStainsPerRoom = 84;
    }

    getQualityProfile() {
        const settings = window.game?.runtimeSettings || {};
        const quality = settings.graphicsQuality || 'high';
        if (quality === 'low') {
            return { normalCap: 34, bossCap: 52, maxAgeMs: 1800, cullMargin: 24 };
        }
        if (quality === 'medium') {
            return { normalCap: 44, bossCap: 68, maxAgeMs: 2400, cullMargin: 36 };
        }
        return { normalCap: this.maxStainsPerRoom, bossCap: this.maxBossStainsPerRoom, maxAgeMs: 3000, cullMargin: 48 };
    }
    
    // 获取房间的血迹数组
    getRoomStains(room) {
        if (!room) return [];
        const key = room.id || 'default';
        if (!this.stainsByRoom.has(key)) {
            this.stainsByRoom.set(key, []);
        }
        return this.stainsByRoom.get(key);
    }
    
    // 添加血迹 - hitDir是击中方向（向后喷溅）
    addStain(x, y, enemyColor, isBoss, room, hitDir = null, enemyType = 'normal') {
        const stains = this.getRoomStains(room);
        const profile = this.getQualityProfile();
        const cap = isBoss || room?.type === 'boss' || room?.type === 'hidden'
            ? profile.bossCap
            : profile.normalCap;
        if (stains.length >= cap) {
            stains.splice(0, stains.length - cap + 1);
        }
        stains.push(new BloodStain(x, y, enemyColor, isBoss, hitDir, enemyType));
    }
    
    // 绘制血迹
    draw(ctx, room, camera) {
        const stains = this.getRoomStains(room);
        const now = performance.now();
        const profile = this.getQualityProfile();
        let visibleCount = 0;
        for (let i = stains.length - 1; i >= 0; i--) {
            const stain = stains[i];
            const maxAgeMs = Math.min(stain.lifetimeMs || 3000, profile.maxAgeMs);
            if (now - stain.createdAt >= maxAgeMs) {
                stains.splice(i, 1);
                continue;
            }
            if (camera?.isVisible && !camera.isVisible(stain.x, stain.y, (stain.boundsRadius || 30) + profile.cullMargin)) {
                continue;
            }
            stain.draw(ctx, camera);
            visibleCount += 1;
        }
        const perf = window.game?.perfMonitor;
        if (perf?.setMetric) {
            perf.setMetric('blood.stains', stains.length);
            perf.setMetric('blood.visible', visibleCount);
        }
    }
    
    // 清理房间血迹（切换楼层时）
    clearRoom(room) {
        if (!room) return;
        const key = room.id || 'default';
        this.stainsByRoom.delete(key);
    }
}
    global.BloodStainParticle = BloodStainParticle;
    global.BloodStain = BloodStain;
    global.BloodStainSystem = BloodStainSystem;
})(window);
