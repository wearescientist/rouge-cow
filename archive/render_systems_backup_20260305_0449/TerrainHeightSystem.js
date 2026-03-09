// ============================================================
// v0.24-r12 - 地形高度系统 (Terrain Height System)
// 八方旅人风格：地面高度变化、台阶、斜坡
// ============================================================

export class TerrainHeightSystem {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        
        // 高度层级
        this.heightLevels = {
            low: 0,
            mid: 16,
            high: 32
        };
        
        // 地形区块
        this.terrainBlocks = [];
        
        // 台阶连接
        this.steps = [];
        
        // 斜坡
        this.slopes = [];
        
        this.time = 0;
    }
    
    resize(width, height) {
        this.width = width;
        this.height = height;
    }
    
    /**
     * 为房间生成地形高度
     */
    generateRoomTerrain(room, floor) {
        this.terrainBlocks = [];
        this.steps = [];
        this.slopes = [];
        
        const blockSize = 80;
        const cols = Math.floor((room.width - 80) / blockSize);
        const rows = Math.floor((room.height - 80) / blockSize);
        
        // 生成基础地形高度
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const height = this.determineHeight(r, c, rows, cols, floor);
                
                this.terrainBlocks.push({
                    x: room.x + 40 + c * blockSize,
                    y: room.y + 40 + r * blockSize,
                    width: blockSize,
                    height: blockSize,
                    level: height,
                    hasStep: false
                });
            }
        }
        
        // 生成台阶连接不同高度
        this.generateSteps();
        
        // 生成斜坡
        this.generateSlopes();
    }
    
    determineHeight(row, col, totalRows, totalCols, floor) {
        // 根据楼层和位置决定高度
        const centerDist = Math.sqrt(
            Math.pow(row - totalRows/2, 2) + 
            Math.pow(col - totalCols/2, 2)
        );
        
        const maxDist = Math.sqrt(
            Math.pow(totalRows/2, 2) + 
            Math.pow(totalCols/2, 2)
        );
        
        // 中心高四周低，或根据楼层特点
        if (floor === 4) { // 熔炉 - 中间低四周高
            if (centerDist < maxDist * 0.3) return 'low';
            if (centerDist < maxDist * 0.6) return 'mid';
            return 'high';
        } else { // 其他 - 中间高四周低
            if (centerDist < maxDist * 0.3) return 'high';
            if (centerDist < maxDist * 0.6) return 'mid';
            return 'low';
        }
    }
    
    generateSteps() {
        // 在相邻的不同高度区块之间生成台阶
        for (let i = 0; i < this.terrainBlocks.length; i++) {
            const block = this.terrainBlocks[i];
            
            // 找到相邻区块
            const neighbors = this.terrainBlocks.filter(other => {
                const dx = Math.abs(other.x - block.x);
                const dy = Math.abs(other.y - block.y);
                return (dx === block.width && dy === 0) || (dx === 0 && dy === block.height);
            });
            
            neighbors.forEach(neighbor => {
                if (block.level !== neighbor.level && !block.hasStep) {
                    // 生成台阶
                    this.steps.push({
                        x: (block.x + neighbor.x) / 2,
                        y: (block.y + neighbor.y) / 2,
                        width: block.x === neighbor.x ? block.width : 20,
                        height: block.y === neighbor.y ? block.height : 20,
                        fromLevel: block.level,
                        toLevel: neighbor.level,
                        stepCount: 2
                    });
                    block.hasStep = true;
                    neighbor.hasStep = true;
                }
            });
        }
    }
    
    generateSlopes() {
        // 在远处生成斜坡
        this.terrainBlocks.forEach(block => {
            if (block.level === 'mid' && Math.random() > 0.8) {
                this.slopes.push({
                    x: block.x,
                    y: block.y,
                    width: block.width,
                    height: block.height,
                    direction: Math.random() > 0.5 ? 'up' : 'down'
                });
            }
        });
    }
    
    /**
     * 获取某位置的地面高度
     */
    getHeightAt(x, y) {
        const block = this.terrainBlocks.find(b => 
            x >= b.x && x < b.x + b.width &&
            y >= b.y && y < b.y + b.height
        );
        
        if (block) {
            return this.heightLevels[block.level];
        }
        return 0;
    }
    
    /**
     * 绘制地形
     */
    drawTerrain(ctx, camera, floor) {
        const colors = this.getTerrainColors(floor);
        
        // 绘制地形区块
        this.terrainBlocks.forEach(block => {
            this.drawTerrainBlock(ctx, block, camera, colors);
        });
        
        // 绘制台阶
        this.steps.forEach(step => {
            this.drawSteps(ctx, step, camera, colors);
        });
        
        // 绘制斜坡
        this.slopes.forEach(slope => {
            this.drawSlope(ctx, slope, camera, colors);
        });
    }
    
    drawTerrainBlock(ctx, block, camera, colors) {
        const pos = camera.worldToScreen(block.x, block.y);
        // 安全检查
        if (!isFinite(pos.x) || !isFinite(pos.y)) return;
        
        const w = (block.width || 0) * (camera.zoom || 1);
        const h = (block.height || 0) * (camera.zoom || 1);
        const heightOffset = (this.heightLevels[block.level] || 0) * (camera.zoom || 1);
        if (!isFinite(w) || !isFinite(h) || w <= 0 || h <= 0) return;
        
        // 绘制侧面（高度）
        ctx.fillStyle = colors[block.level + 'Side'];
        ctx.fillRect(pos.x, pos.y - heightOffset, w, heightOffset);
        
        // 绘制顶面
        const topColor = colors[block.level];
        ctx.fillStyle = topColor;
        ctx.fillRect(pos.x, pos.y - heightOffset, w, h);
        
        // 添加纹理
        this.addGroundTexture(ctx, pos.x, pos.y - heightOffset, w, h, topColor);
        
        // 边缘高光
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        ctx.strokeRect(pos.x, pos.y - heightOffset, w, h);
    }
    
    drawSteps(ctx, step, camera, colors) {
        const pos = camera.worldToScreen(step.x, step.y);
        if (!isFinite(pos.x) || !isFinite(pos.y)) return;
        
        const w = (step.width || 0) * (camera.zoom || 1);
        const h = (step.height || 0) * (camera.zoom || 1);
        if (!isFinite(w) || !isFinite(h) || w <= 0 || h <= 0) return;
        const fromH = this.heightLevels[step.fromLevel] * camera.zoom;
        const toH = this.heightLevels[step.toLevel] * camera.zoom;
        
        // 绘制台阶
        const stepHeight = (toH - fromH) / step.stepCount;
        
        for (let i = 0; i < step.stepCount; i++) {
            const stepY = pos.y - fromH - stepHeight * (i + 1);
            
            // 台阶面
            ctx.fillStyle = colors.steps;
            ctx.fillRect(pos.x, stepY, w, Math.abs(stepHeight));
            
            // 台阶边缘
            ctx.strokeStyle = 'rgba(0,0,0,0.3)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(pos.x, stepY);
            ctx.lineTo(pos.x + w, stepY);
            ctx.stroke();
        }
    }
    
    drawSlope(ctx, slope, camera, colors) {
        const pos = camera.worldToScreen(slope.x, slope.y);
        if (!isFinite(pos.x) || !isFinite(pos.y)) return;
        
        const w = (slope.width || 0) * (camera.zoom || 1);
        const h = (slope.height || 0) * (camera.zoom || 1);
        if (!isFinite(w) || !isFinite(h) || w <= 0 || h <= 0) return;
        
        // 斜坡渐变
        const gradient = ctx.createLinearGradient(
            pos.x, pos.y,
            slope.direction === 'up' ? pos.x : pos.x + w,
            slope.direction === 'up' ? pos.y - 32 * camera.zoom : pos.y
        );
        gradient.addColorStop(0, colors.low);
        gradient.addColorStop(1, colors.mid);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(pos.x, pos.y - 32 * camera.zoom, w, h + 32 * camera.zoom);
    }
    
    addGroundTexture(ctx, x, y, w, h, baseColor) {
        ctx.save();
        ctx.globalAlpha = 0.15;
        ctx.fillStyle = this.darkenColor(baseColor, 0.7);
        
        // 简单的地面纹理
        for (let i = 0; i < 8; i++) {
            const tx = x + Math.random() * w;
            const ty = y + Math.random() * h;
            const size = 2 + Math.random() * 4;
            ctx.fillRect(tx, ty, size, size);
        }
        
        ctx.restore();
    }
    
    getTerrainColors(floor) {
        const palettes = {
            1: {
                low: '#3d5c4a', lowSide: '#2d4a3e',
                mid: '#4a6b59', midSide: '#3a5c4a',
                high: '#5c8a6b', highSide: '#4a7c5c',
                steps: '#3d4d45'
            },
            2: {
                low: '#4a6b4a', lowSide: '#3a5b3a',
                mid: '#5a8b5a', midSide: '#4a7b4a',
                high: '#6aab6a', highSide: '#5a9b5a',
                steps: '#4a5d4a'
            },
            3: {
                low: '#4a3a5a', lowSide: '#3a2a4a',
                mid: '#5a4a6a', midSide: '#4a3a5a',
                high: '#6a5a7a', highSide: '#5a4a6a',
                steps: '#4a3d55'
            },
            4: {
                low: '#5c3d2d', lowSide: '#4c2d1d',
                mid: '#7c4d3d', midSide: '#6c3d2d',
                high: '#9c5d4d', highSide: '#8c4d3d',
                steps: '#5c3d35'
            },
            5: {
                low: '#4a4a2d', lowSide: '#3a3a1d',
                mid: '#5a5a3d', midSide: '#4a4a2d',
                high: '#6a6a4d', highSide: '#5a5a3d',
                steps: '#4a4a35'
            },
            6: {
                low: '#4a1a1a', lowSide: '#3a0a0a',
                mid: '#5a2a2a', midSide: '#4a1a1a',
                high: '#6a3a3a', highSide: '#5a2a2a',
                steps: '#4a1a1a'
            }
        };
        return palettes[floor] || palettes[1];
    }
    
    darkenColor(hex, factor) {
        const r = Math.floor(parseInt(hex.slice(1, 3), 16) * factor);
        const g = Math.floor(parseInt(hex.slice(3, 5), 16) * factor);
        const b = Math.floor(parseInt(hex.slice(5, 7), 16) * factor);
        return `#${r.toString(16).padStart(2,'0')}${g.toString(16).padStart(2,'0')}${b.toString(16).padStart(2,'0')}`;
    }
}
