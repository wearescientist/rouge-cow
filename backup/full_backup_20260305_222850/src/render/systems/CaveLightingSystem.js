/**
 * CaveLightingSystem - 简化版光源系统
 */

class CaveLightingSystem {
    constructor(ctx, width, height) {
        this.ctx = ctx;
        this.width = width || 960;
        this.height = height || 600;
        this.crystals = [];
    }
    
    addCrystal(worldX, worldY) {
        this.crystals.push({
            worldX, worldY,
            radius: 100,
            color: [0.3, 0.6, 1.0],
            intensity: 0.6,
            phase: Math.random() * Math.PI * 2,
            pulseSpeed: 2
        });
    }
    
    update(dt) {
        for (const c of this.crystals) {
            c.phase += dt * c.pulseSpeed;
            c.currentIntensity = c.intensity * (0.7 + Math.sin(c.phase) * 0.3);
        }
    }
    
    generateCaveLights(roomWidth, roomHeight, wallThickness) {
        this.crystals = [];
        for (let i = 0; i < 10; i++) {
            const x = wallThickness + 150 + Math.random() * (roomWidth - wallThickness * 2 - 300);
            const y = wallThickness + 150 + Math.random() * (roomHeight - wallThickness * 2 - 300);
            this.addCrystal(x, y);
        }
    }
    
    render(ctx, player, camera) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        
        for (const light of this.crystals) {
            const pos = camera.worldToScreen(light.worldX, light.worldY);
            const r = light.radius * camera.zoom;
            
            // 裁剪
            if (pos.x < -r || pos.x > this.width + r || pos.y < -r || pos.y > this.height + r) continue;
            
            const c = light.color;
            const alpha = (light.currentIntensity || light.intensity) * 0.4;
            
            const grad = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, r);
            grad.addColorStop(0, `rgba(${c[0]*255}, ${c[1]*255}, ${c[2]*255}, ${alpha})`);
            grad.addColorStop(0.5, `rgba(${c[0]*255}, ${c[1]*255}, ${c[2]*255}, ${alpha * 0.3})`);
            grad.addColorStop(1, `rgba(${c[0]*255}, ${c[1]*255}, ${c[2]*255}, 0)`);
            
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    resize(w, h) {
        this.width = w;
        this.height = h;
    }
}

if (typeof module !== 'undefined') {
    module.exports = CaveLightingSystem;
}
