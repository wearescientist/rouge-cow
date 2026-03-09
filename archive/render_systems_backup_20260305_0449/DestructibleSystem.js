// ============================================================
// v0.24 - 可破坏物体系统 (Destructible System)
// 八方旅人风格：3D碎片飞溅效果
// ============================================================

export class DestructibleSystem {
    constructor() {
        this.destructibles = [];    // 可破坏物体
        this.fragments = [];        // 碎片
        this.maxFragments = 100;
        
        this.time = 0;
    }
    
    /**
     * 添加可破坏物体
     */
    addDestructible(x, y, width, height, type = 'pot', floor = 1) {
        const colors = this.getObjectColors(type, floor);
        
        this.destructibles.push({
            x, y, width, height, type, floor,
            color: colors.main,
            highlight: colors.highlight,
            shadow: colors.shadow,
            hp: 1,
            destroyed: false
        });
    }
    
    /**
     * 破坏物体
     */
    destroy(destructible, impactX, impactY) {
        if (destructible.destroyed) return;
        destructible.destroyed = true;
        
        // 生成碎片
        const fragmentCount = 6 + Math.floor(Math.random() * 6);
        for (let i = 0; i < fragmentCount; i++) {
            this.spawnFragment(destructible, impactX, impactY);
        }
    }
    
    spawnFragment(parent, impactX, impactY) {
        if (this.fragments.length >= this.maxFragments) {
            this.fragments.shift();
        }
        
        const angle = Math.random() * Math.PI * 2;
        const speed = 100 + Math.random() * 150;
        const size = 4 + Math.random() * 8;
        
        this.fragments.push({
            x: parent.x + parent.width / 2 + (Math.random() - 0.5) * parent.width * 0.5,
            y: parent.y + parent.height / 2 + (Math.random() - 0.5) * parent.height * 0.5,
            z: parent.height / 2 + Math.random() * 20, // 初始高度
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            vz: 50 + Math.random() * 100, // 向上飞溅
            size,
            color: Math.random() > 0.5 ? parent.color : parent.highlight,
            rotation: Math.random() * Math.PI * 2,
            rotSpeed: (Math.random() - 0.5) * 10,
            gravity: 300,
            bounce: 0.4,
            life: 1.0
        });
    }
    
    update(dt) {
        this.time += dt;
        
        // 更新碎片物理
        for (let i = this.fragments.length - 1; i >= 0; i--) {
            const f = this.fragments[i];
            
            // 位置更新
            f.x += f.vx * dt;
            f.y += f.vy * dt;
            f.z += f.vz * dt;
            
            // 重力
            f.vz -= f.gravity * dt;
            
            // 地面碰撞
            if (f.z <= 0) {
                f.z = 0;
                f.vz = -f.vz * f.bounce;
                f.vx *= 0.8; // 摩擦力
                f.vy *= 0.8;
                
                if (Math.abs(f.vz) < 10) f.vz = 0;
            }
            
            // 旋转
            f.rotation += f.rotSpeed * dt;
            
            // 衰减
            f.life -= dt * 0.5;
            if (f.life <= 0) {
                this.fragments.splice(i, 1);
            }
        }
    }
    
    /**
     * 绘制可破坏物体（带3D厚度）
     */
    drawDestructibles(ctx, camera) {
        this.destructibles.forEach(d => {
            if (!d.destroyed) {
                this.drawObject3D(ctx, d, camera);
            }
        });
    }
    
    drawObject3D(ctx, obj, camera) {
        const pos = camera.worldToScreen(obj.x, obj.y);
        const w = obj.width * camera.zoom;
        const h = obj.height * camera.zoom;
        const depth = 12 * camera.zoom; // 厚度
        
        ctx.save();
        
        // 右侧面（厚度）
        ctx.fillStyle = obj.shadow;
        ctx.beginPath();
        ctx.moveTo(pos.x + w, pos.y);
        ctx.lineTo(pos.x + w + depth * 0.5, pos.y - depth);
        ctx.lineTo(pos.x + w + depth * 0.5, pos.y + h - depth);
        ctx.lineTo(pos.x + w, pos.y + h);
        ctx.closePath();
        ctx.fill();
        
        // 顶面
        ctx.fillStyle = obj.highlight;
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        ctx.lineTo(pos.x + w, pos.y);
        ctx.lineTo(pos.x + w + depth * 0.5, pos.y - depth);
        ctx.lineTo(pos.x + depth * 0.5, pos.y - depth);
        ctx.closePath();
        ctx.fill();
        
        // 正面
        ctx.fillStyle = obj.color;
        ctx.fillRect(pos.x, pos.y, w, h);
        
        // 高光
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.fillRect(pos.x, pos.y, w * 0.3, h);
        
        ctx.restore();
    }
    
    /**
     * 绘制3D碎片
     */
    drawFragments(ctx, camera) {
        ctx.save();
        
        this.fragments.forEach(f => {
            const pos = camera.worldToScreen(f.x, f.y);
            if (!isFinite(pos.x) || !isFinite(pos.y)) return;
            
            const size = (f.size || 5) * (camera.zoom || 1);
            const heightOffset = -(f.z || 0) * (camera.zoom || 1) * 0.5;
            if (!isFinite(size) || size <= 0) return;
            
            // 阴影（在地面）
            if (f.z > 5) {
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                const shadowSize = size * (1 - f.z / 100);
                ctx.beginPath();
                ctx.ellipse(pos.x, pos.y, shadowSize, shadowSize * 0.4, 0, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // 碎片本体（带高度）
            ctx.save();
            ctx.translate(pos.x, pos.y + heightOffset);
            ctx.rotate(f.rotation);
            ctx.scale(1, 0.6 + f.z / 200); // 根据高度调整形状
            
            ctx.fillStyle = f.color;
            ctx.globalAlpha = f.life;
            
            // 绘制像素碎片
            ctx.fillRect(-size/2, -size/2, size, size);
            
            // 高光
            ctx.fillStyle = 'rgba(255,255,255,0.4)';
            ctx.fillRect(-size/2, -size/2, size * 0.4, size * 0.4);
            
            ctx.restore();
        });
        
        ctx.restore();
    }
    
    getObjectColors(type, floor) {
        const palettes = {
            pot: {
                1: { main: '#8b7355', highlight: '#a08060', shadow: '#6b5344' },
                2: { main: '#9b8365', highlight: '#b09070', shadow: '#7b6344' },
                3: { main: '#8b6b8b', highlight: '#a080a0', shadow: '#6b4b6b' },
                4: { main: '#a05a3a', highlight: '#b56a4a', shadow: '#804a2a' },
                5: { main: '#8b8b4a', highlight: '#9b9b5a', shadow: '#6b6b3a' },
                6: { main: '#8b3a3a', highlight: '#9b4a4a', shadow: '#6b2a2a' }
            },
            crate: {
                1: { main: '#6b5a44', highlight: '#7b6a54', shadow: '#4b3a24' },
                2: { main: '#7b6a54', highlight: '#8b7a64', shadow: '#5b4a34' },
                3: { main: '#6b4a6b', highlight: '#7b5a7b', shadow: '#4b2a4b' },
                4: { main: '#7b4a3a', highlight: '#8b5a4a', shadow: '#5b2a1a' },
                5: { main: '#6b6b3a', highlight: '#7b7b4a', shadow: '#4b4b2a' },
                6: { main: '#6b2a2a', highlight: '#7b3a3a', shadow: '#4b1a1a' }
            },
            crystal: {
                1: { main: '#5c8a8b', highlight: '#7caabb', shadow: '#3c6a6b' },
                2: { main: '#6c9a9b', highlight: '#8cbacc', shadow: '#4c7a7b' },
                3: { main: '#9c5a9b', highlight: '#bc7abb', shadow: '#7c3a7b' },
                4: { main: '#ac6a3b', highlight: '#cc8a5b', shadow: '#8c4a1b' },
                5: { main: '#9c9b3b', highlight: '#bcbb5b', shadow: '#7c7b1b' },
                6: { main: '#ac3a3b', highlight: '#cc5a5b', shadow: '#8c1a1b' }
            }
        };
        
        return (palettes[type] || palettes.pot)[floor] || palettes.pot[1];
    }
}
