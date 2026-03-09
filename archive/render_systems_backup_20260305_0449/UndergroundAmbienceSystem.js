// ============================================================
// v0.23-fix - 地下环境系统 (Underground Ambience System)
// 替代天气系统：水滴、落石、孢子、尘埃等地下环境效果
// ============================================================

export class UndergroundAmbienceSystem {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        // 地下环境效果
        this.effects = {
            waterDrops: [],    // 顶部水滴
            fallingRocks: [],  // 落石
            spores: [],        // 漂浮孢子
            dust: [],          // 尘埃
            embers: []         // 火星（熔炉层）
        };
        
        this.maxCounts = {
            waterDrops: 15,
            fallingRocks: 3,
            spores: 30,
            dust: 20,
            embers: 10
        };
        
        this.time = 0;
        this.initPools();
    }
    
    initPools() {
        // 初始化对象池
        Object.keys(this.effects).forEach(type => {
            for (let i = 0; i < this.maxCounts[type]; i++) {
                this.effects[type].push({
                    x: 0, y: 0,
                    vx: 0, vy: 0,
                    life: 0,
                    active: false
                });
            }
        });
    }
    
    update(dt, floor, camera) {
        this.time += dt;
        
        // 根据楼层生成不同的地下环境效果
        this.spawnByFloor(dt, floor, camera);
        
        // 更新所有效果
        this.updateWaterDrops(dt, camera);
        this.updateFallingRocks(dt, camera);
        this.updateSpores(dt, camera);
        this.updateDust(dt, camera);
        this.updateEmbers(dt, camera);
    }
    
    spawnByFloor(dt, floor, camera) {
        // v0.24-fix: 使用世界坐标生成粒子，在整个房间范围内
        const ROOM_WIDTH = 960;  // 房间宽度
        const ROOM_HEIGHT = 960; // 房间高度
        
        const worldBounds = { 
            minX: 0, 
            maxX: ROOM_WIDTH, 
            minY: 0, 
            maxY: ROOM_HEIGHT 
        };
        
        switch(floor) {
            case 1: // 菌丝区 - 水滴+孢子
                this.spawnEffect('waterDrops', 0.3, dt, worldBounds);
                this.spawnEffect('spores', 1.0, dt, worldBounds);
                break;
            case 2: // 温室 - 孢子+花粉
                this.spawnEffect('spores', 2.0, dt, worldBounds);
                this.spawnEffect('dust', 0.5, dt, worldBounds);
                break;
            case 3: // 神经索 - 漂浮尘埃
                this.spawnEffect('dust', 1.5, dt, worldBounds);
                this.spawnEffect('spores', 0.8, dt, worldBounds);
                break;
            case 4: // 熔炉 - 火星+热浪
                this.spawnEffect('embers', 1.5, dt, worldBounds);
                break;
            case 5: // 母虫庭院 - 尘埃+碎屑
                this.spawnEffect('dust', 1.0, dt, worldBounds);
                this.spawnEffect('fallingRocks', 0.1, dt, worldBounds);
                break;
            case 6: // 千根之心 - 血滴+孢子
                this.spawnEffect('waterDrops', 0.5, dt, worldBounds); // 血滴
                this.spawnEffect('spores', 0.5, dt, worldBounds);
                break;
        }
    }
    
    spawnEffect(type, rate, dt, bounds) {
        if (Math.random() > rate * dt) return;
        
        const pool = this.effects[type];
        const item = pool.find(p => !p.active);
        if (!item) return;
        
        item.active = true;
        item.life = 2 + Math.random() * 2;
        
        switch(type) {
            case 'waterDrops':
                item.x = bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
                item.y = bounds.minY - 10;
                item.vx = 0;
                item.vy = 100 + Math.random() * 50;
                break;
            case 'fallingRocks':
                item.x = bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
                item.y = bounds.minY - 20;
                item.vx = (Math.random() - 0.5) * 20;
                item.vy = 50 + Math.random() * 30;
                item.size = 3 + Math.random() * 5;
                break;
            case 'spores':
                item.x = bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
                item.y = bounds.minY + Math.random() * (bounds.maxY - bounds.minY);
                item.vx = (Math.random() - 0.5) * 10;
                item.vy = -5 - Math.random() * 10;
                item.size = 2 + Math.random() * 3;
                break;
            case 'dust':
                item.x = bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
                item.y = bounds.minY + Math.random() * (bounds.maxY - bounds.minY);
                item.vx = (Math.random() - 0.5) * 5;
                item.vy = (Math.random() - 0.5) * 5;
                break;
            case 'embers':
                item.x = bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
                item.y = bounds.maxY + 10;
                item.vx = (Math.random() - 0.5) * 30;
                item.vy = -30 - Math.random() * 40;
                break;
        }
    }
    
    updateWaterDrops(dt, camera) {
        this.effects.waterDrops.forEach(d => {
            if (!d.active) return;
            d.y += d.vy * dt;
            d.life -= dt;
            if (d.life <= 0) d.active = false;
        });
    }
    
    updateFallingRocks(dt, camera) {
        this.effects.fallingRocks.forEach(r => {
            if (!r.active) return;
            r.x += r.vx * dt;
            r.y += r.vy * dt;
            r.vy += 50 * dt; // 重力
            r.life -= dt;
            if (r.life <= 0) r.active = false;
        });
    }
    
    updateSpores(dt, camera) {
        this.effects.spores.forEach(s => {
            if (!s.active) return;
            s.x += s.vx * dt + Math.sin(this.time + s.y * 0.01) * 2;
            s.y += s.vy * dt;
            s.life -= dt;
            if (s.life <= 0) s.active = false;
        });
    }
    
    updateDust(dt, camera) {
        this.effects.dust.forEach(d => {
            if (!d.active) return;
            d.x += d.vx * dt;
            d.y += d.vy * dt;
            d.life -= dt;
            if (d.life <= 0) d.active = false;
        });
    }
    
    updateEmbers(dt, camera) {
        this.effects.embers.forEach(e => {
            if (!e.active) return;
            e.x += e.vx * dt;
            e.y += e.vy * dt;
            e.life -= dt;
            if (e.life <= 0) e.active = false;
        });
    }
    
    draw(ctx, camera, floor) {
        // 根据楼层绘制不同的环境效果
        const colors = this.getFloorColors(floor);
        
        // 绘制水滴/血滴
        ctx.save();
        ctx.fillStyle = colors.drop || '#88aacc';
        this.effects.waterDrops.forEach(d => {
            if (!d.active) return;
            const pos = camera.worldToScreen(d.x, d.y);
            ctx.globalAlpha = d.life / 4;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 2, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
        
        // 绘制孢子
        ctx.save();
        ctx.fillStyle = colors.spore || '#7fbc8f';
        ctx.shadowBlur = 4;
        ctx.shadowColor = ctx.fillStyle;
        this.effects.spores.forEach(s => {
            if (!s.active) return;
            const pos = camera.worldToScreen(s.x, s.y);
            ctx.globalAlpha = (s.life / 4) * 0.6;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, s.size || 3, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
        
        // 绘制火星
        if (floor === 4) {
            ctx.save();
            ctx.fillStyle = '#ff6b35';
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#ff4400';
            this.effects.embers.forEach(e => {
                if (!e.active) return;
                const pos = camera.worldToScreen(e.x, e.y);
                ctx.globalAlpha = e.life / 3;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, 2, 0, Math.PI * 2);
                ctx.fill();
            });
            ctx.restore();
        }
        
        // 绘制尘埃
        ctx.save();
        ctx.fillStyle = colors.dust || '#666';
        this.effects.dust.forEach(d => {
            if (!d.active) return;
            const pos = camera.worldToScreen(d.x, d.y);
            ctx.globalAlpha = (d.life / 4) * 0.3;
            ctx.fillRect(pos.x, pos.y, 2, 2);
        });
        ctx.restore();
    }
    
    getFloorColors(floor) {
        switch(floor) {
            case 1: return { drop: '#4a7c59', spore: '#5c8a6b', dust: '#3d5c4a' };
            case 2: return { spore: '#8fbc8f', dust: '#6b8e6b' };
            case 3: return { spore: '#ff79c6', dust: '#6b4a6b' };
            case 4: return {}; // 火星单独处理
            case 5: return { dust: '#8b4513', drop: '#654321' };
            case 6: return { drop: '#8b0000', spore: '#dc143c', dust: '#4a1a1a' };
            default: return {};
        }
    }
}
