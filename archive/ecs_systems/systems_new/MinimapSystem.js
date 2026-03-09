/**
 * MinimapSystem - 小地图系统
 * 显示当前地图布局、房间状态、玩家位置
 */

class MinimapSystem {
    constructor(world, canvas) {
        this.world = world;
        this.canvas = canvas;
        this.priority = 180;
        this.enabled = true;
        
        // 小地图配置
        this.config = {
            size: 150,           // 小地图尺寸
            padding: 20,         // 边距
            roomSize: 20,        // 房间显示大小
            roomGap: 5,          // 房间间距
            alpha: 0.8,          // 透明度
            colors: {
                unexplored: '#333',
                explored: '#555',
                current: '#48f',
                cleared: '#4f4',
                boss: '#f44',
                treasure: '#ffd700',
                shop: '#fa0',
                player: '#0f0',
                corridor: '#444'
            }
        };
        
        // 房间系统引用
        this.roomSystem = null;
        
        // 小地图位置（右下角）
        this.x = 0;
        this.y = 0;
    }
    
    init() {
        this.roomSystem = this.world.getSystem(RoomSystem);
        this.updatePosition();
    }
    
    updatePosition() {
        this.x = this.canvas.width - this.config.size - this.config.padding;
        this.y = this.canvas.height - this.config.size - this.config.padding;
    }
    
    update(dt) {
        // 窗口大小改变时更新位置
        if (this.canvas.width !== this._lastWidth || this.canvas.height !== this._lastHeight) {
            this.updatePosition();
            this._lastWidth = this.canvas.width;
            this._lastHeight = this.canvas.height;
        }
    }
    
    render(ctx) {
        if (!this.roomSystem || !this.roomSystem.currentMap) return;
        
        ctx.save();
        
        // 背景
        ctx.fillStyle = `rgba(0, 0, 0, ${this.config.alpha})`;
        ctx.fillRect(this.x, this.y, this.config.size, this.config.size);
        
        // 边框
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x, this.y, this.config.size, this.config.size);
        
        // 获取地图数据
        const mapData = this.roomSystem.currentMap;
        const rooms = mapData.rooms;
        
        if (rooms.length === 0) {
            ctx.restore();
            return;
        }
        
        // 计算地图边界
        let minGridX = Infinity, maxGridX = -Infinity;
        let minGridY = Infinity, maxGridY = -Infinity;
        
        for (const room of rooms) {
            minGridX = Math.min(minGridX, room.gridX);
            maxGridX = Math.max(maxGridX, room.gridX);
            minGridY = Math.min(minGridY, room.gridY);
            maxGridY = Math.max(maxGridY, room.gridY);
        }
        
        const gridWidth = maxGridX - minGridX + 1;
        const gridHeight = maxGridY - minGridY + 1;
        
        // 计算缩放
        const cellSize = Math.min(
            (this.config.size - 20) / gridWidth,
            (this.config.size - 20) / gridHeight
        );
        
        const offsetX = this.x + (this.config.size - gridWidth * cellSize) / 2;
        const offsetY = this.y + (this.config.size - gridHeight * cellSize) / 2;
        
        // 绘制走廊
        ctx.fillStyle = this.config.colors.corridor;
        for (const corridor of mapData.corridors || []) {
            const roomA = corridor.roomA;
            const roomB = corridor.roomB;
            
            const ax = offsetX + (roomA.gridX - minGridX + 0.5) * cellSize;
            const ay = offsetY + (roomA.gridY - minGridY + 0.5) * cellSize;
            const bx = offsetX + (roomB.gridX - minGridX + 0.5) * cellSize;
            const by = offsetY + (roomB.gridY - minGridY + 0.5) * cellSize;
            
            ctx.beginPath();
            ctx.moveTo(ax, ay);
            ctx.lineTo(bx, by);
            ctx.strokeStyle = this.config.colors.corridor;
            ctx.lineWidth = cellSize * 0.3;
            ctx.stroke();
        }
        
        // 绘制房间
        for (const room of rooms) {
            const roomState = this.roomSystem.rooms.get(room.id);
            if (!roomState) continue;
            
            // 未访问的房间不显示（除非相邻）
            if (!roomState.isVisited && !this.isAdjacentToVisited(room)) {
                continue;
            }
            
            const rx = offsetX + (room.gridX - minGridX) * cellSize + 2;
            const ry = offsetY + (room.gridY - minGridY) * cellSize + 2;
            const rSize = cellSize - 4;
            
            // 选择颜色
            let color = this.config.colors.unexplored;
            
            if (room.id === this.roomSystem.currentRoomId) {
                color = this.config.colors.current;
            } else if (roomState.isCleared) {
                color = this.config.colors.cleared;
            } else if (roomState.isVisited) {
                color = this.config.colors.explored;
            }
            
            // 特殊房间类型
            if (room.type === 'boss') {
                color = this.config.colors.boss;
            } else if (room.type === 'treasure') {
                color = this.config.colors.treasure;
            } else if (room.type === 'shop') {
                color = this.config.colors.shop;
            }
            
            // 绘制房间
            ctx.fillStyle = color;
            ctx.fillRect(rx, ry, rSize, rSize);
            
            // Boss房特殊标记 - 闪烁骷髅提示
            if (room.type === 'boss') {
                const pulse = (Date.now() % 1000) / 1000; // 0-1 闪烁
                const borderSize = 2 + pulse * 2;
                ctx.strokeStyle = `rgba(255, 68, 68, ${0.5 + pulse * 0.5})`;
                ctx.lineWidth = borderSize;
                ctx.strokeRect(rx - borderSize/2, ry - borderSize/2, rSize + borderSize, rSize + borderSize);
                
                // 绘制骷髅图标
                ctx.fillStyle = '#fff';
                ctx.font = `${Math.max(8, cellSize * 0.6)}px Arial`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText('☠️', rx + rSize/2, ry + rSize/2);
            }
            
            // 当前房间发光效果
            if (room.id === this.roomSystem.currentRoomId) {
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.strokeRect(rx - 1, ry - 1, rSize + 2, rSize + 2);
            }
            
            // 通往Boss房的门提示 - 在未清理房间显示警告
            if (roomState.isVisited && !roomState.isCleared && this.hasBossConnection(room)) {
                ctx.fillStyle = 'rgba(255, 68, 68, 0.6)';
                ctx.beginPath();
                ctx.arc(rx + rSize/2, ry + rSize/2, rSize * 0.15, 0, Math.PI * 2);
                ctx.fill();
            }
        }
        
        // 绘制玩家位置（在当前房间内）
        const currentRoom = this.roomSystem.getCurrentRoom();
        if (currentRoom) {
            const px = offsetX + (currentRoom.gridX - minGridX + 0.5) * cellSize;
            const py = offsetY + (currentRoom.gridY - minGridY + 0.5) * cellSize;
            
            ctx.fillStyle = this.config.colors.player;
            ctx.beginPath();
            ctx.arc(px, py, cellSize * 0.25, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    /**
     * 检查房间是否相邻于已访问的房间
     */
    isAdjacentToVisited(room) {
        const roomSystem = this.roomSystem;
        if (!roomSystem) return false;
        
        const directions = [
            { x: 0, y: -1 },
            { x: 0, y: 1 },
            { x: -1, y: 0 },
            { x: 1, y: 0 }
        ];
        
        for (const dir of directions) {
            const neighborId = `${room.gridX + dir.x},${room.gridY + dir.y}`;
            const neighbor = roomSystem.rooms.get(neighborId);
            if (neighbor && neighbor.isVisited) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * 检查房间是否连接到Boss房
     */
    hasBossConnection(room) {
        const roomSystem = this.roomSystem;
        if (!roomSystem || !room.connections) return false;
        
        for (const connectedRoom of room.connections) {
            if (connectedRoom.type === 'boss') {
                return true;
            }
        }
        return false;
    }
    
    destroy() {}
}

window.MinimapSystem = MinimapSystem;
