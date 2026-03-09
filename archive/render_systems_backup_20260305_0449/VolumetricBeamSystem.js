// ============================================================
// v0.24 - 体积光束系统 (Volumetric Beam System)
// 八方旅人风格：从窗户/开口射入的3D光柱
// ============================================================

export class VolumetricBeamSystem {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        // 光束列表
        this.beams = [];
        this.maxBeams = 5;
        
        // 光源开口位置（相对于房间）
        this.lightSources = [];
        
        this.time = 0;
        this.dustParticles = []; // 光束中的尘埃
        this.maxDustParticles = 100;
        
        // v0.24-r8: 添加光束闪烁效果
        this.flickerIntensity = 0;
        this.flickerSpeed = 10;
        
        // 悬浮尘埃（环境）
        this.ambientDust = [];
        this.maxAmbientDust = 30;
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
    }
    
    /**
     * 为房间生成光束
     */
    generateRoomBeams(room, floor) {
        this.beams = [];
        this.lightSources = [];
        
        const colors = this.getBeamColors(floor);
        const beamCount = floor === 2 ? 3 : (floor === 6 ? 2 : 1); // 温室多一些光
        
        for (let i = 0; i < beamCount; i++) {
            // 随机选择开口位置（上墙或侧墙）
            const side = Math.random() > 0.5 ? 'top' : (Math.random() > 0.5 ? 'left' : 'right');
            let sourceX, sourceY, angle;
            
            const wallInset = 40;
            
            switch(side) {
                case 'top':
                    sourceX = room.x + wallInset + Math.random() * (room.width - wallInset * 2);
                    sourceY = room.y + wallInset;
                    angle = Math.PI / 2 + (Math.random() - 0.5) * 0.3;
                    break;
                case 'left':
                    sourceX = room.x + wallInset;
                    sourceY = room.y + wallInset + Math.random() * (room.height - wallInset * 2);
                    angle = 0 + (Math.random() - 0.5) * 0.3;
                    break;
                case 'right':
                    sourceX = room.x + room.width - wallInset;
                    sourceY = room.y + wallInset + Math.random() * (room.height - wallInset * 2);
                    angle = Math.PI + (Math.random() - 0.5) * 0.3;
                    break;
            }
            
            const beam = {
                sourceX, sourceY,
                angle,
                width: 60 + Math.random() * 80,
                length: 200 + Math.random() * 300,
                color: colors.beam,
                dustColor: colors.dust,
                intensity: 0.3 + Math.random() * 0.3,
                pulseSpeed: 0.5 + Math.random() * 0.5
            };
            
            this.beams.push(beam);
            
            // 为光束生成尘埃粒子
            this.generateBeamDust(beam);
        }
    }
    
    generateBeamDust(beam) {
        const particleCount = 30; // 增加粒子数量
        for (let i = 0; i < particleCount; i++) {
            const t = Math.random(); // 沿光束长度的位置
            const spread = (Math.random() - 0.5) * beam.width * (0.5 + t * 0.5); // 越远离光源越宽
            
            this.dustParticles.push({
                x: beam.sourceX + Math.cos(beam.angle) * t * beam.length * 0.5 + spread,
                y: beam.sourceY + Math.sin(beam.angle) * t * beam.length * 0.5 + spread * 0.3,
                vx: (Math.random() - 0.5) * 3,
                vy: Math.random() * 5 + 2,
                life: Math.random(),
                size: 0.5 + Math.random() * 2.5,
                beamIndex: this.beams.length - 1,
                twinkle: Math.random() * Math.PI * 2, // 闪烁相位
                twinkleSpeed: 2 + Math.random() * 3
            });
        }
    }
    
    /**
     * 生成环境悬浮尘埃
     */
    generateAmbientDust(room) {
        for (let i = 0; i < this.maxAmbientDust; i++) {
            this.ambientDust.push({
                x: room.x + Math.random() * room.width,
                y: room.y + Math.random() * room.height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                size: 0.5 + Math.random() * 1.5,
                alpha: 0.1 + Math.random() * 0.3
            });
        }
    }
    
    update(dt) {
        this.time += dt;
        
        // 更新闪烁
        this.flickerIntensity = Math.sin(this.time * this.flickerSpeed) * 0.1;
        
        // 更新光束内尘埃粒子
        this.dustParticles.forEach(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.life -= dt * 0.25; // 减慢衰减
            p.twinkle += p.twinkleSpeed * dt;
            
            // 重置粒子
            if (p.life <= 0 && this.beams[p.beamIndex]) {
                const beam = this.beams[p.beamIndex];
                const t = Math.random();
                const spread = (Math.random() - 0.5) * beam.width * (0.5 + t * 0.5);
                p.x = beam.sourceX + Math.cos(beam.angle) * t * beam.length * 0.5 + spread;
                p.y = beam.sourceY + Math.sin(beam.angle) * t * beam.length * 0.5 + spread * 0.3;
                p.life = 1;
            }
        });
        
        // 更新环境尘埃
        this.ambientDust.forEach(p => {
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.alpha = 0.1 + Math.sin(this.time + p.x * 0.01) * 0.1;
        });
    }
    
    /**
     * 绘制体积光束
     */
    drawBeams(ctx, camera, floor) {
        this.beams.forEach((beam, index) => {
            this.drawVolumetricBeam(ctx, beam, camera, index);
        });
        
        // 绘制光束中的尘埃
        this.drawBeamDust(ctx, camera);
    }
    
    drawVolumetricBeam(ctx, beam, camera, index) {
        const source = camera.worldToScreen(beam.sourceX, beam.sourceY);
        // 安全检查
        if (!isFinite(source.x) || !isFinite(source.y)) return;
        
        // 计算光束末端
        const endX = beam.sourceX + Math.cos(beam.angle || 0) * (beam.length || 100);
        const endY = beam.sourceY + Math.sin(beam.angle || 0) * (beam.length || 100);
        const end = camera.worldToScreen(endX, endY);
        
        if (!isFinite(end.x) || !isFinite(end.y)) return;
        
        // 计算垂直方向（光束宽度方向）
        const perpAngle = beam.angle + Math.PI / 2;
        const halfWidth = beam.width * camera.zoom * 0.5;
        
        const dx = Math.cos(perpAngle) * halfWidth;
        const dy = Math.sin(perpAngle) * halfWidth;
        
        // 脉动效果
        const pulse = 0.8 + Math.sin(this.time * beam.pulseSpeed + index) * 0.2;
        const alpha = beam.intensity * pulse;
        
        ctx.save();
        
        // 绘制主光束（梯形，近宽远窄）
        const farWidth = halfWidth * 0.3; // 远处更窄
        
        // 创建渐变
        const gradient = ctx.createLinearGradient(source.x, source.y, end.x, end.y);
        gradient.addColorStop(0, this.hexToRgba(beam.color, alpha * 0.6));
        gradient.addColorStop(0.3, this.hexToRgba(beam.color, alpha * 0.4));
        gradient.addColorStop(0.7, this.hexToRgba(beam.color, alpha * 0.15));
        gradient.addColorStop(1, this.hexToRgba(beam.color, 0));
        
        ctx.fillStyle = gradient;
        ctx.globalCompositeOperation = 'screen';
        
        // 绘制光束形状
        ctx.beginPath();
        ctx.moveTo(source.x - dx, source.y - dy);
        ctx.lineTo(source.x + dx, source.y + dy);
        ctx.lineTo(end.x + farWidth * Math.cos(perpAngle), end.y + farWidth * Math.sin(perpAngle));
        ctx.lineTo(end.x - farWidth * Math.cos(perpAngle), end.y - farWidth * Math.sin(perpAngle));
        ctx.closePath();
        ctx.fill();
        
        // 绘制内部核心光束（更亮更窄）
        const coreGradient = ctx.createLinearGradient(source.x, source.y, end.x, end.y);
        coreGradient.addColorStop(0, this.hexToRgba('#ffffff', alpha * 0.5));
        coreGradient.addColorStop(0.2, this.hexToRgba(beam.color, alpha * 0.3));
        coreGradient.addColorStop(1, this.hexToRgba(beam.color, 0));
        
        ctx.fillStyle = coreGradient;
        ctx.beginPath();
        ctx.moveTo(source.x - dx * 0.3, source.y - dy * 0.3);
        ctx.lineTo(source.x + dx * 0.3, source.y + dy * 0.3);
        ctx.lineTo(end.x + farWidth * 0.3 * Math.cos(perpAngle), end.y + farWidth * 0.3 * Math.sin(perpAngle));
        ctx.lineTo(end.x - farWidth * 0.3 * Math.cos(perpAngle), end.y - farWidth * 0.3 * Math.sin(perpAngle));
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }
    
    drawBeamDust(ctx, camera) {
        ctx.save();
        ctx.globalCompositeOperation = 'screen';
        
        // 绘制光束内尘埃（带闪烁）
        this.dustParticles.forEach(p => {
            if (!this.beams[p.beamIndex] || p.life <= 0) return;
            
            const pos = camera.worldToScreen(p.x, p.y);
            const size = p.size * camera.zoom;
            const beam = this.beams[p.beamIndex];
            
            // 闪烁效果
            const twinkleAlpha = 0.5 + Math.sin(p.twinkle) * 0.5;
            
            ctx.fillStyle = beam.dustColor;
            ctx.globalAlpha = p.life * 0.7 * twinkleAlpha;
            
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
            ctx.fill();
            
            // 高光核心
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = p.life * 0.4 * twinkleAlpha;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, size * 0.4, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // 绘制环境悬浮尘埃
        ctx.globalCompositeOperation = 'source-over';
        this.ambientDust.forEach(p => {
            const pos = camera.worldToScreen(p.x, p.y);
            const size = p.size * camera.zoom;
            
            ctx.fillStyle = 'rgba(255, 255, 255,' + p.alpha + ')';
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        ctx.restore();
    }
    
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }
    
    getBeamColors(floor) {
        // v0.24-r10: 增强光束颜色饱和度
        const palettes = {
            1: { beam: '#a8f6bf', dust: '#d8ffe8' },      // 菌丝 - 明亮绿光
            2: { beam: '#ffeeb0', dust: '#ffffe0' },      // 温室 - 金黄色阳光
            3: { beam: '#ff69c6', dust: '#ffc6e6' },      // 神经 - 霓虹粉紫光
            4: { beam: '#ff8c30', dust: '#ffe0b0' },      // 熔炉 - 炽烈橙光
            5: { beam: '#ffe94d', dust: '#fff8c8' },      // 庭院 - 明亮黄光
            6: { beam: '#ff2a55', dust: '#ffb0c0' }       // 千根 - 血红色光
        };
        return palettes[floor] || palettes[1];
    }
}
