/**
 * 坐标调试器 - Coordinate Debugger
 * 可视化所有坐标系，一眼看出哪里偏移
 */

class CoordinateDebugger {
    constructor(game) {
        this.game = game;
        this.enabled = false;
        this.showGrid = true;
        this.showAxes = true;
        this.showEntities = true;
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }

    render(ctx) {
        if (!this.enabled) return;

        const { camera, canvas, player } = this.game;
        
        ctx.save();
        
        // 1. 绘制网格（世界坐标）
        if (this.showGrid) {
            this.drawWorldGrid(ctx, camera, canvas);
        }

        // 2. 绘制玩家位置的各种坐标表示
        if (player && this.showEntities) {
            this.drawPlayerDebug(ctx, player, camera, canvas);
        }

        // 3. 绘制说明文字
        this.drawLegend(ctx);
        
        ctx.restore();
    }

    drawWorldGrid(ctx, camera, canvas) {
        const gridSize = 100;
        const zoom = camera.zoom;
        
        // 计算可见范围的世界坐标
        const halfW = (canvas.width / 2) / zoom;
        const halfH = (canvas.height / 2) / zoom;
        const startX = Math.floor((camera.x - halfW) / gridSize) * gridSize;
        const endX = Math.ceil((camera.x + halfW) / gridSize) * gridSize;
        const startY = Math.floor((camera.y - halfH) / gridSize) * gridSize;
        const endY = Math.ceil((camera.y + halfH) / gridSize) * gridSize;

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;

        for (let x = startX; x <= endX; x += gridSize) {
            const screenX = (x - camera.x) * zoom + canvas.width / 2;
            ctx.beginPath();
            ctx.moveTo(screenX, 0);
            ctx.lineTo(screenX, canvas.height);
            ctx.stroke();
            
            // 世界坐标标签
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.font = '10px monospace';
            ctx.fillText(`W:${x}`, screenX + 2, canvas.height / 2);
        }

        for (let y = startY; y <= endY; y += gridSize) {
            const screenY = (y - camera.y) * zoom + canvas.height / 2;
            ctx.beginPath();
            ctx.moveTo(0, screenY);
            ctx.lineTo(canvas.width, screenY);
            ctx.stroke();
            
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.font = '10px monospace';
            ctx.fillText(`W:${y}`, canvas.width / 2 + 2, screenY - 2);
        }
    }

    drawPlayerDebug(ctx, player, camera, canvas) {
        const zoom = camera.zoom;
        
        // 🚨 修正：player.x, player.y 是脚底世界坐标
        // 但贴图现在用 CENTER 锚点绘制（脚底向上24像素）
        // 所以贴图实际中心位置是 (player.x, player.y - 24)
        
        const feetWorldX = player.x;
        const feetWorldY = player.y;
        const centerWorldX = feetWorldX;
        const centerWorldY = feetWorldY - 24; // 中心在脚底上24像素
        
        // 脚底屏幕坐标（ctx.translate 的位置）
        const feetScreenX = (feetWorldX - camera.x) * zoom + canvas.width / 2;
        const feetScreenY = (feetWorldY - camera.y) * zoom + canvas.height / 2;
        
        // 中心屏幕坐标（贴图实际绘制位置）
        const screenX = feetScreenX;
        const screenY = feetScreenY - 24 * zoom; // 向上偏移24像素

        // 绘制 CENTER 点（黄色十字）
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(screenX - 10, screenY);
        ctx.lineTo(screenX + 10, screenY);
        ctx.moveTo(screenX, screenY - 10);
        ctx.lineTo(screenX, screenY + 10);
        ctx.stroke();
        
        // 标签
        ctx.fillStyle = '#ffff00';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(`CENTER(${Math.round(centerWorldX)},${Math.round(centerWorldY)})`, screenX + 15, screenY);

        // 如果有 spriteData，绘制碰撞箱
        if (player.spriteData) {
            // CENTER 锚点，传入 center 坐标
            const box = player.spriteData.getHitbox(centerWorldX, centerWorldY, 1, 'center');
            
            // 碰撞箱世界坐标转为屏幕坐标（正确转换）
            const boxScreenX = (box.x - camera.x) * zoom + canvas.width / 2;
            const boxScreenY = (box.y - camera.y) * zoom + canvas.height / 2;
            
            // 绘制碰撞箱（绿色）- 使用缩放后的尺寸
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 2;
            ctx.strokeRect(
                boxScreenX, 
                boxScreenY, 
                box.width * zoom, 
                box.height * zoom
            );
            
            // 标签 - 显示缩放后的尺寸
            ctx.fillStyle = '#00ff00';
            ctx.font = '10px monospace';
            ctx.fillText(
                `HITBOX ${Math.round(box.width * zoom)}x${Math.round(box.height * zoom)}`, 
                boxScreenX, 
                boxScreenY - 5
            );
            
            // 绘制模型边界（蓝色虚线）- CENTER 锚点
            // 模型左上角世界坐标
            const modelLeft = centerWorldX - (player.spriteData.anchor.center.x - player.spriteData.modelOffsetX);
            const modelTop = centerWorldY - (player.spriteData.anchor.center.y - player.spriteData.modelOffsetY);
            // 转为屏幕坐标
            const modelScreenX = (modelLeft - camera.x) * zoom + canvas.width / 2;
            const modelScreenY = (modelTop - camera.y) * zoom + canvas.height / 2;
            const modelW = player.spriteData.modelWidth * zoom;
            const modelH = player.spriteData.modelHeight * zoom;
            ctx.strokeStyle = '#0088ff';
            ctx.lineWidth = 1;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(modelScreenX, modelScreenY, modelW, modelH);
            ctx.setLineDash([]);
            
            ctx.fillStyle = '#0088ff';
            ctx.font = '10px monospace';
            ctx.fillText(`MODEL ${Math.round(modelW)}x${Math.round(modelH)}`, modelScreenX, modelScreenY - 5);
        }

        // 脚底位置（红色，仅作参考）- 使用已定义的 feetScreenX/Y
        ctx.strokeStyle = '#ff0000';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(feetScreenX - 8, feetScreenY);
        ctx.lineTo(feetScreenX + 8, feetScreenY);
        ctx.stroke();
        ctx.fillStyle = '#ff0000';
        ctx.font = '10px monospace';
        ctx.fillText('FEET', feetScreenX + 10, feetScreenY);
    }

    drawLegend(ctx) {
        const x = 10, y = 20;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x, y, 200, 120);
        
        ctx.font = '12px monospace';
        ctx.fillStyle = '#ff0000';
        ctx.fillText('── FEET (脚底世界坐标)', x + 5, y + 20);
        ctx.fillStyle = '#00ff00';
        ctx.fillText('── HITBOX (碰撞箱)', x + 5, y + 40);
        ctx.fillStyle = '#0088ff';
        ctx.fillText('- - MODEL (模型边界)', x + 5, y + 60);
        ctx.fillStyle = '#ffff00';
        ctx.fillText('● CENTER (中心点)', x + 5, y + 80);
        ctx.fillStyle = '#ffffff';
        ctx.fillText('Grid = 100px world', x + 5, y + 100);
        ctx.fillText('按 C 切换调试', x + 5, y + 115);
    }

    worldToScreen(worldX, worldY, camera, canvas) {
        return {
            x: (worldX - camera.x) * camera.zoom + canvas.width / 2,
            y: (worldY - camera.y) * camera.zoom + canvas.height / 2
        };
    }
}

if (typeof module !== 'undefined') module.exports = CoordinateDebugger;
