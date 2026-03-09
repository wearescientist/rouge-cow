// ============================================================
// v0.24 - 像素深度系统 (Pixel Depth System)
// 八方旅人风格：2D像素 + 3D深度感
// ============================================================

export class PixelDepthSystem {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        // 深度层配置
        this.depthLayers = {
            background: { parallax: 0.2, offsetY: 0 },    // 远景
            midground: { parallax: 0.5, offsetY: 20 },    // 中景
            foreground: { parallax: 0.8, offsetY: 40 },   // 近景
            ground: { parallax: 1.0, offsetY: 60 }        // 地面
        };
        
        // v0.24-r1: 增强建筑厚度数据
        this.wallThickness = 120;  // 与游戏房间墙壁厚度一致
        this.wallHeight = 80;      // 增加墙壁高度（3D深度效果）
        this.depthShadow = 0.6;    // 深度阴影强度
        
        // 边缘高光
        this.edgeHighlight = true;
        this.highlightIntensity = 0.3;
        
        // 每个房间的3D结构缓存
        this.roomGeometry = new Map();
        
        // v0.24-r6: 纹理缓存
        this.textureCache = new Map();
        this.brickPatterns = this.generateBrickPatterns();
        
        // 装饰元素
        this.decorations = ['crack', 'moss', 'lichen', 'carving', 'hole', 'peeling'];
        
        // v0.24-r11: 墙壁破损系统
        this.damagePatterns = this.generateDamagePatterns();
        
        // 3D立体增强
        this.depthShadowIntensity = 0.5;
        this.ambientOcclusion = 0.3;
    }
    
    /**
     * 生成砖石图案
     */
    generateBrickPatterns() {
        const patterns = [];
        for (let i = 0; i < 5; i++) {
            const pattern = [];
            const rows = 4 + Math.floor(Math.random() * 3);
            for (let r = 0; r < rows; r++) {
                const bricks = [];
                const brickCount = 3 + Math.floor(Math.random() * 3);
                const brickWidth = 1 / brickCount;
                for (let b = 0; b < brickCount; b++) {
                    bricks.push({
                        x: b * brickWidth + (Math.random() * 0.1),
                        y: r / rows,
                        w: brickWidth - 0.02,
                        h: 1 / rows - 0.02
                    });
                }
                pattern.push(bricks);
            }
            patterns.push(pattern);
        }
        return patterns;
    }
    
    /**
     * 生成墙壁破损图案
     */
    generateDamagePatterns() {
        const patterns = [];
        for (let i = 0; i < 8; i++) {
            const damage = [];
            const damageCount = 2 + Math.floor(Math.random() * 4);
            for (let d = 0; d < damageCount; d++) {
                damage.push({
                    x: 0.1 + Math.random() * 0.8,
                    y: 0.1 + Math.random() * 0.8,
                    size: 0.05 + Math.random() * 0.1,
                    type: ['chip', 'crack', 'hole', 'stain'][Math.floor(Math.random() * 4)]
                });
            }
            patterns.push(damage);
        }
        return patterns;
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
    }
    
    /**
     * 生成房间的3D几何结构
     */
    generateRoomGeometry(room) {
        const key = `${room.x},${room.y}`;
        if (this.roomGeometry.has(key)) return this.roomGeometry.get(key);
        
        const geometry = {
            walls: [],
            pillars: [],
            steps: [],
            ceiling: null
        };
        
        // 生成墙壁（带厚度）
        // 使用与游戏房间相同的墙壁厚度（120）
        const wallThickness = 120;
        geometry.walls = [
            // 上墙 - 有厚度
            {
                x: room.x, y: room.y,
                width: room.width, height: wallThickness,
                depth: this.wallHeight,
                type: 'top',
                faces: ['front', 'top', 'side']
            },
            // 左墙
            {
                x: room.x, y: room.y + wallThickness,
                width: wallThickness, height: room.height - wallThickness * 2,
                depth: this.wallHeight,
                type: 'left',
                faces: ['front', 'side']
            },
            // 右墙
            {
                x: room.x + room.width - wallThickness, y: room.y + wallThickness,
                width: wallThickness, height: room.height - wallThickness * 2,
                depth: this.wallHeight,
                type: 'right',
                faces: ['front', 'side']
            },
            // 下墙
            {
                x: room.x, y: room.y + room.height - wallThickness,
                width: room.width, height: wallThickness,
                depth: this.wallHeight,
                type: 'bottom',
                faces: ['front', 'top']
            }
        ];
        
        // 生成柱子（增加立体感）- 在地板区域内
        const pillarCount = Math.floor(room.width * room.height / 20000);
        for (let i = 0; i < pillarCount; i++) {
            geometry.pillars.push({
                x: room.x + wallThickness + 80 + Math.random() * (room.width - wallThickness * 2 - 160),
                y: room.y + wallThickness + 80 + Math.random() * (room.height - wallThickness * 2 - 160),
                width: 32,
                height: 32,
                depth: 64
            });
        }
        
        this.roomGeometry.set(key, geometry);
        return geometry;
    }
    
    /**
     * 绘制3D墙壁（带厚度和投影）
     */
    drawWalls3D(ctx, room, camera, floor) {
        const geometry = this.generateRoomGeometry(room);
        const colors = this.getFloorColors(floor);
        
        ctx.save();
        
        geometry.walls.forEach(wall => {
            const screenPos = camera.worldToScreen(wall.x, wall.y);
            // 安全检查：确保值是有效的
            if (!isFinite(screenPos.x) || !isFinite(screenPos.y)) return;
            
            const screenW = (wall.width || 0) * (camera.zoom || 1);
            const screenH = (wall.height || 0) * (camera.zoom || 1);
            const depthH = (wall.depth || 0) * (camera.zoom || 1) * 0.5;
            
            // 如果尺寸无效，跳过这面墙
            if (!isFinite(screenW) || !isFinite(screenH) || screenW <= 0 || screenH <= 0) return;
            
            // 根据墙壁类型绘制不同面
            switch(wall.type) {
                case 'top':
                    // 前面 - 先绘制底部（让顶面覆盖在上面）
                    const frontGrad = ctx.createLinearGradient(screenPos.x, screenPos.y, screenPos.x, screenPos.y + screenH);
                    frontGrad.addColorStop(0, colors.wall);
                    frontGrad.addColorStop(1, this.darkenColor(colors.wall, 0.7));
                    ctx.fillStyle = frontGrad;
                    ctx.fillRect(screenPos.x, screenPos.y, screenW, screenH);
                    
                    // 顶面（朝向玩家）- 使用更亮的颜色
                    ctx.fillStyle = colors.wallTop || '#7cba9a';
                    ctx.beginPath();
                    ctx.moveTo(screenPos.x, screenPos.y);
                    ctx.lineTo(screenPos.x + screenW, screenPos.y);
                    ctx.lineTo(screenPos.x + screenW - depthH, screenPos.y - depthH);
                    ctx.lineTo(screenPos.x + depthH, screenPos.y - depthH);
                    ctx.closePath();
                    ctx.fill();
                    
                    // 顶面边缘高光
                    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    break;
                    
                case 'left':
                    // 前面 - 先绘制
                    const leftGrad = ctx.createLinearGradient(screenPos.x, screenPos.y, screenPos.x + screenW, screenPos.y);
                    leftGrad.addColorStop(0, colors.wall);
                    leftGrad.addColorStop(1, this.darkenColor(colors.wall, 0.8));
                    ctx.fillStyle = leftGrad;
                    ctx.fillRect(screenPos.x, screenPos.y, screenW, screenH);
                    
                    // 左侧面（有深度）- 使用较亮颜色增强可见性
                    ctx.fillStyle = colors.wallSide || '#5c8a7a';
                    ctx.beginPath();
                    ctx.moveTo(screenPos.x + screenW, screenPos.y);
                    ctx.lineTo(screenPos.x + screenW + depthH, screenPos.y - depthH);
                    ctx.lineTo(screenPos.x + screenW + depthH, screenPos.y + screenH - depthH);
                    ctx.lineTo(screenPos.x + screenW, screenPos.y + screenH);
                    ctx.closePath();
                    ctx.fill();
                    
                    // 侧面边缘高光
                    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    break;
                    
                case 'right':
                    // 前面 - 先绘制
                    const rightGrad = ctx.createLinearGradient(screenPos.x + screenW, screenPos.y, screenPos.x, screenPos.y);
                    rightGrad.addColorStop(0, colors.wall);
                    rightGrad.addColorStop(1, this.darkenColor(colors.wall, 0.8));
                    ctx.fillStyle = rightGrad;
                    ctx.fillRect(screenPos.x, screenPos.y, screenW, screenH);
                    
                    // 右侧面 - 使用较亮颜色
                    ctx.fillStyle = colors.wallSide || '#5c8a7a';
                    ctx.beginPath();
                    ctx.moveTo(screenPos.x, screenPos.y);
                    ctx.lineTo(screenPos.x - depthH, screenPos.y - depthH);
                    ctx.lineTo(screenPos.x - depthH, screenPos.y + screenH - depthH);
                    ctx.lineTo(screenPos.x, screenPos.y + screenH);
                    ctx.closePath();
                    ctx.fill();
                    
                    // 侧面边缘高光
                    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
                    ctx.lineWidth = 1;
                    ctx.stroke();
                    break;
                    
                case 'bottom':
                    // 前面 - 底部较暗（下墙没有顶面，因为它在底部）
                    const bottomGrad = ctx.createLinearGradient(screenPos.x, screenPos.y, screenPos.x, screenPos.y + screenH);
                    bottomGrad.addColorStop(0, colors.wall);
                    bottomGrad.addColorStop(1, this.darkenColor(colors.wall, 0.7));
                    ctx.fillStyle = bottomGrad;
                    ctx.fillRect(screenPos.x, screenPos.y, screenW, screenH);
                    
                    // 底部边缘高光
                    ctx.fillStyle = 'rgba(255,255,255,0.1)';
                    ctx.fillRect(screenPos.x, screenPos.y, screenW, 1);
                    break;
            }
            
            // 添加像素纹理细节
            this.addPixelTexture(ctx, screenPos.x, screenPos.y, screenW, screenH, colors.texture);
        });
        
        // 绘制3D柱子
        geometry.pillars.forEach(pillar => {
            this.drawPillar3D(ctx, pillar, camera, colors);
        });
        
        ctx.restore();
    }
    
    /**
     * 绘制3D柱子
     */
    drawPillar3D(ctx, pillar, camera, colors) {
        const pos = camera.worldToScreen(pillar.x, pillar.y);
        const w = pillar.width * camera.zoom;
        const h = pillar.height * camera.zoom;
        const d = pillar.depth * camera.zoom * 0.5;
        
        // 顶面
        ctx.fillStyle = colors.pillarTop || colors.wallTop;
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y - d);
        ctx.lineTo(pos.x + w, pos.y - d);
        ctx.lineTo(pos.x + w + d * 0.5, pos.y - d * 1.5);
        ctx.lineTo(pos.x + d * 0.5, pos.y - d * 1.5);
        ctx.closePath();
        ctx.fill();
        
        // 右侧面
        ctx.fillStyle = colors.pillarSide || colors.wallSide;
        ctx.beginPath();
        ctx.moveTo(pos.x + w, pos.y - d);
        ctx.lineTo(pos.x + w + d * 0.5, pos.y - d * 1.5);
        ctx.lineTo(pos.x + w + d * 0.5, pos.y + h - d * 1.5);
        ctx.lineTo(pos.x + w, pos.y + h - d);
        ctx.closePath();
        ctx.fill();
        
        // 前面
        ctx.fillStyle = colors.pillar || colors.wall;
        ctx.fillRect(pos.x, pos.y - d, w, h);
    }
    
    /**
     * 添加像素纹理
     */
    addPixelTexture(ctx, x, y, w, h, textureColor) {
        if (!textureColor) return;
        
        ctx.save();
        
        // 1. 绘制砖石纹理
        const pattern = this.brickPatterns[Math.floor(Math.random() * this.brickPatterns.length)];
        ctx.strokeStyle = this.darkenColor(textureColor, 0.7);
        ctx.lineWidth = 1;
        ctx.globalAlpha = 0.4;
        
        pattern.forEach((row, rowIdx) => {
            row.forEach(brick => {
                const bx = x + brick.x * w;
                const by = y + brick.y * h;
                const bw = brick.w * w;
                const bh = brick.h * h;
                
                // 砖块边框
                ctx.strokeRect(bx, by, bw, bh);
                
                // 砖块内部 slight color variation
                if (Math.random() > 0.5) {
                    ctx.fillStyle = this.darkenColor(textureColor, 0.8 + Math.random() * 0.2);
                    ctx.fillRect(bx + 1, by + 1, bw - 2, bh - 2);
                }
            });
        });
        
        // 2. 添加裂缝
        if (Math.random() > 0.6) {
            ctx.strokeStyle = this.darkenColor(textureColor, 0.4);
            ctx.lineWidth = 1;
            ctx.beginPath();
            const crackX = x + Math.random() * w;
            const crackY = y + Math.random() * h;
            ctx.moveTo(crackX, crackY);
            for (let i = 0; i < 3; i++) {
                ctx.lineTo(
                    crackX + (Math.random() - 0.5) * 20,
                    crackY + Math.random() * 15
                );
            }
            ctx.stroke();
        }
        
        // 3. 添加苔藓/地衣（底部）
        ctx.fillStyle = '#2d3d2d';
        ctx.globalAlpha = 0.2;
        for (let i = 0; i < 3; i++) {
            const mx = x + Math.random() * w;
            const my = y + h - 5 - Math.random() * 10;
            ctx.fillRect(mx, my, 4 + Math.random() * 6, 3);
        }
        
        // 4. 添加破损效果
        const damagePattern = this.damagePatterns[Math.floor(Math.random() * this.damagePatterns.length)];
        damagePattern.forEach(damage => {
            const dx = x + damage.x * w;
            const dy = y + damage.y * h;
            const ds = damage.size * Math.min(w, h);
            
            switch(damage.type) {
                case 'chip':
                    // 缺角
                    ctx.fillStyle = this.darkenColor(textureColor, 0.3);
                    ctx.beginPath();
                    ctx.moveTo(dx, dy);
                    ctx.lineTo(dx + ds, dy);
                    ctx.lineTo(dx, dy + ds);
                    ctx.closePath();
                    ctx.fill();
                    break;
                case 'hole':
                    // 破洞
                    ctx.fillStyle = 'rgba(0,0,0,0.5)';
                    ctx.beginPath();
                    ctx.arc(dx, dy, ds * 0.5, 0, Math.PI * 2);
                    ctx.fill();
                    // 内阴影
                    ctx.strokeStyle = this.darkenColor(textureColor, 0.2);
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    break;
                case 'stain':
                    // 污渍
                    ctx.fillStyle = 'rgba(0,0,0,0.15)';
                    ctx.beginPath();
                    ctx.ellipse(dx, dy, ds, ds * 0.7, Math.random() * Math.PI, 0, Math.PI * 2);
                    ctx.fill();
                    break;
            }
        });
        
        // 5. 添加环境光遮蔽（边缘变暗）
        if (isFinite(x) && isFinite(y) && isFinite(w) && isFinite(h) && w > 0 && h > 0) {
            const aoGradient = ctx.createLinearGradient(x, y, x + w, y + h);
            aoGradient.addColorStop(0, 'rgba(0,0,0,0.2)');
            aoGradient.addColorStop(0.5, 'rgba(0,0,0,0)');
            aoGradient.addColorStop(1, 'rgba(0,0,0,0.15)');
            ctx.fillStyle = aoGradient;
            ctx.fillRect(x, y, w, h);
        }
        
        ctx.restore();
    }
    
    /**
     * 绘制视差背景层
     */
    drawParallaxLayer(ctx, layer, camera, floor) {
        const config = this.depthLayers[layer];
        if (!config) return;
        
        // 计算视差偏移
        const parallaxX = camera.x * (1 - config.parallax);
        const parallaxY = camera.y * (1 - config.parallax) + config.offsetY;
        
        ctx.save();
        
        // 绘制该层的背景元素
        const colors = this.getFloorColors(floor);
        ctx.fillStyle = colors[layer] || colors.background;
        ctx.globalAlpha = 0.4 + config.parallax * 0.4;
        
        // 简化的视差背景绘制
        const tileSize = 100;
        const startX = Math.floor((camera.x - parallaxX) / tileSize) * tileSize;
        const startY = Math.floor((camera.y - parallaxY) / tileSize) * tileSize;
        
        for (let x = startX; x < startX + this.width + tileSize; x += tileSize) {
            for (let y = startY; y < startY + this.height + tileSize; y += tileSize) {
                const screenX = x - parallaxX;
                const screenY = y - parallaxY;
                
                // 绘制装饰性元素
                this.drawParallaxElement(ctx, screenX, screenY, tileSize, layer, colors);
            }
        }
        
        ctx.restore();
    }
    
    drawParallaxElement(ctx, x, y, size, layer, colors) {
        switch(layer) {
            case 'background':
                // 远处的岩石/结构
                ctx.fillStyle = colors.farStructure || '#1a1a2e';
                ctx.fillRect(x + 20, y + 40, size - 40, size - 60);
                break;
            case 'midground':
                // 中景柱子
                ctx.fillStyle = colors.midStructure || '#2d2d44';
                ctx.fillRect(x + 30, y + 20, 20, size - 20);
                break;
            case 'foreground':
                // 近景装饰
                if (Math.random() > 0.5) {
                    ctx.fillStyle = colors.nearDecor || '#3d3d5c';
                    ctx.beginPath();
                    ctx.arc(x + size/2, y + size/2, 15, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
        }
    }
    
    getFloorColors(floor) {
        // v0.24-r10: 优化颜色，增强对比度和八方旅人风格
        const palettes = {
            1: { // 菌丝 - 增强绿色对比
                wall: '#3d6b5a', wallTop: '#7cba9a', wallSide: '#1f3f32',
                pillar: '#4d7c6a', pillarTop: '#8adcb8', pillarSide: '#2f4f42',
                texture: '#2f4f3f',
                background: '#0f1a15', midground: '#1f2f25', foreground: '#2f3f35',
                farStructure: '#0a1510', midStructure: '#152520', nearDecor: '#253530'
            },
            2: { // 温室 - 明亮阳光感
                wall: '#3d5c3d', wallTop: '#7cba7c', wallSide: '#2a4a2a',
                pillar: '#4d7c4d', pillarTop: '#8cda8c', pillarSide: '#3a5a3a',
                texture: '#1f3f1f',
                background: '#0f2f0f', midground: '#1f4f1f', foreground: '#2f6f2f',
                farStructure: '#0a1f0a', midStructure: '#153f15', nearDecor: '#255f25'
            },
            3: { // 神经 - 紫粉色梦幻
                wall: '#4a2a4a', wallTop: '#9c5a8c', wallSide: '#2a1a3a',
                pillar: '#5a3a5a', pillarTop: '#ac6a9c', pillarSide: '#3a2a4a',
                texture: '#2f1f3f',
                background: '#1f0f2f', midground: '#2f1f3f', foreground: '#3f2f4f',
                farStructure: '#150a25', midStructure: '#251535', nearDecor: '#352545'
            },
            4: { // 熔炉 - 火红炽热
                wall: '#5c2d1a', wallTop: '#b85c3d', wallSide: '#3d1a0a',
                pillar: '#6c3d2a', pillarTop: '#c86c4d', pillarSide: '#4c2d1a',
                texture: '#3f1f0f',
                background: '#2f0f00', midground: '#3f1f0f', foreground: '#4f2f1f',
                farStructure: '#250800', midStructure: '#351810', nearDecor: '#452820'
            },
            5: { // 庭院 - 黄褐色古老
                wall: '#3d3d1a', wallTop: '#8c8c4a', wallSide: '#2a2a0a',
                pillar: '#4d4d2a', pillarTop: '#9c9c5a', pillarSide: '#3a3a1a',
                texture: '#2f2f0f',
                background: '#1f1f0a', midground: '#2f2f1a', foreground: '#3f3f2a',
                farStructure: '#151505', midStructure: '#252510', nearDecor: '#353520'
            },
            6: { // 千根 - 血红黑暗
                wall: '#3d0a0a', wallTop: '#8c1a2d', wallSide: '#1f0505',
                pillar: '#4d1a1a', pillarTop: '#9c2a3d', pillarSide: '#2f0a0a',
                texture: '#2f0505',
                background: '#1f0505', midground: '#2f0a0a', foreground: '#3f0f0f',
                farStructure: '#150000', midStructure: '#250505', nearDecor: '#350a0a'
            }
        };
        return palettes[floor] || palettes[1];
    }
    
    /**
     * 颜色变暗辅助函数
     */
    darkenColor(hex, factor) {
        const r = Math.floor(parseInt(hex.slice(1, 3), 16) * factor);
        const g = Math.floor(parseInt(hex.slice(3, 5), 16) * factor);
        const b = Math.floor(parseInt(hex.slice(5, 7), 16) * factor);
        return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
    }
}
