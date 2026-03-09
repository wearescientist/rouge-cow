// 肉鸽牛牛 v8.0 - UI美化和血条系统
// 专业游戏界面设计

// ========== 高级UI渲染器 ==========
class UIRenderer {
    constructor() {
        this.font = '16px "Courier New", monospace';
        this.barWidth = 200;
        this.barHeight = 20;
    }
    
    // 绘制血条（带分段）
    drawHealthBar(ctx, x, y, current, max, label = 'HP') {
        const segmentWidth = this.barWidth / max;
        
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, this.barWidth, this.barHeight);
        
        // 分段心形
        for (let i = 0; i < max; i++) {
            const sx = x + i * segmentWidth + 2;
            const sy = y + 2;
            const sw = segmentWidth - 4;
            const sh = this.barHeight - 4;
            
            if (i < current) {
                // 满血心形
                this.drawHeart(ctx, sx + sw/2, sy + sh/2, sw/2, '#E74C3C');
            } else {
                // 空心血形
                this.drawHeart(ctx, sx + sw/2, sy + sh/2, sw/2, '#555', true);
            }
        }
        
        // 标签
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 14px monospace';
        ctx.fillText(label, x - 35, y + 15);
    }
    
    // 绘制经验条（渐变）
    drawExpBar(ctx, x, y, current, max, level) {
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, this.barWidth, this.barHeight);
        
        // 渐变填充
        const fillWidth = (current / max) * this.barWidth;
        const gradient = ctx.createLinearGradient(x, y, x + fillWidth, y);
        gradient.addColorStop(0, '#3498DB');
        gradient.addColorStop(1, '#85C1E9');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, fillWidth, this.barHeight);
        
        // 边框
        ctx.strokeStyle = '#5DADE2';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, this.barWidth, this.barHeight);
        
        // 文字
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 12px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Lv.${level}  ${Math.floor(current)}/${max}`, x + this.barWidth/2, y + 15);
        ctx.textAlign = 'left';
    }
    
    // 绘制心形
    drawHeart(ctx, x, y, size, color, outline = false) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(size / 10, size / 10);
        
        ctx.beginPath();
        ctx.moveTo(0, 3);
        ctx.bezierCurveTo(-5, -2, -10, 0, -10, 5);
        ctx.bezierCurveTo(-10, 10, -5, 13, 0, 15);
        ctx.bezierCurveTo(5, 13, 10, 10, 10, 5);
        ctx.bezierCurveTo(10, 0, 5, -2, 0, 3);
        ctx.closePath();
        
        if (outline) {
            ctx.strokeStyle = color;
            ctx.lineWidth = 2;
            ctx.stroke();
        } else {
            ctx.fillStyle = color;
            ctx.fill();
            // 高光
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.beginPath();
            ctx.arc(-3, 2, 3, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
    
    // 绘制武器图标
    drawWeaponIcon(ctx, x, y, weaponKey) {
        const weapon = WEAPONS[weaponKey];
        if (!weapon) return;
        
        // 背景框
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(x, y, 60, 60);
        ctx.strokeStyle = weapon.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, 60, 60);
        
        // 武器图形
        ctx.fillStyle = weapon.color;
        ctx.save();
        ctx.translate(x + 30, y + 30);
        
        if (weaponKey === 'spread') {
            // 散射：三个点
            ctx.beginPath(); ctx.arc(-10, 5, 6, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(0, -10, 6, 0, Math.PI * 2); ctx.fill();
            ctx.beginPath(); ctx.arc(10, 5, 6, 0, Math.PI * 2); ctx.fill();
        } else if (weaponKey === 'rapid') {
            // 连射：竖线
            ctx.fillRect(-4, -15, 8, 30);
        } else if (weaponKey === 'pierce') {
            // 穿透：方形
            ctx.fillRect(-10, -10, 20, 20);
        } else if (weaponKey === 'homing') {
            // 追踪：靶心
            ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#000';
            ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI * 2); ctx.fill();
        } else {
            // 默认：圆形
            ctx.beginPath(); ctx.arc(0, 0, 12, 0, Math.PI * 2); ctx.fill();
        }
        
        ctx.restore();
        
        // 名称
        ctx.fillStyle = '#FFF';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(weapon.name, x + 30, y + 75);
        ctx.textAlign = 'left';
    }
    
    // 绘制道具栏
    drawInventory(ctx, x, y, items) {
        const slotSize = 50;
        const spacing = 10;
        
        for (let i = 0; i < 6; i++) {
            const sx = x + i * (slotSize + spacing);
            const sy = y;
            
            // 槽位背景
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillRect(sx, sy, slotSize, slotSize);
            ctx.strokeStyle = items[i] ? '#F1C40F' : '#555';
            ctx.lineWidth = 2;
            ctx.strokeRect(sx, sy, slotSize, slotSize);
            
            // 道具图标
            if (items[i]) {
                const item = ITEMS[items[i]];
                ctx.fillStyle = item.color;
                ctx.beginPath();
                ctx.arc(sx + slotSize/2, sy + slotSize/2, 15, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    
    // 绘制波数提示
    drawWaveAlert(ctx, wave) {
        const pulse = Math.sin(Date.now() / 200) * 0.2 + 1;
        ctx.save();
        ctx.translate(GAME_WIDTH / 2, 100);
        ctx.scale(pulse, pulse);
        
        ctx.fillStyle = 'rgba(231, 76, 60, 0.8)';
        ctx.font = 'bold 48px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`Wave ${wave}`, 0, 0);
        
        ctx.restore();
    }
    
    // 绘制Boss血条
    drawBossBar(ctx, boss) {
        const barWidth = 600;
        const barHeight = 30;
        const x = (GAME_WIDTH - barWidth) / 2;
        const y = 50;
        
        // 名字
        ctx.fillStyle = '#E74C3C';
        ctx.font = 'bold 24px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('寄生牧羊犬', GAME_WIDTH / 2, y - 15);
        
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(x, y, barWidth, barHeight);
        
        // 血量
        const hpPercent = boss.hp / boss.maxHp;
        const gradient = ctx.createLinearGradient(x, y, x + barWidth * hpPercent, y);
        gradient.addColorStop(0, '#C0392B');
        gradient.addColorStop(1, '#E74C3C');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, barWidth * hpPercent, barHeight);
        
        // 边框
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, barWidth, barHeight);
        
        // 阶段标记
        for (let i = 1; i <= 3; i++) {
            const px = x + barWidth * (1 - i * 0.33);
            ctx.strokeStyle = '#FFF';
            ctx.beginPath();
            ctx.moveTo(px, y);
            ctx.lineTo(px, y + barHeight);
            ctx.stroke();
        }
        
        // 百分比
        ctx.fillStyle = '#FFF';
        ctx.font = 'bold 16px monospace';
        ctx.fillText(`${Math.floor(hpPercent * 100)}%`, GAME_WIDTH / 2, y + 22);
    }
    
    // 绘制小地图（改进版）
    drawMinimap(ctx, dungeon, currentRoom, x, y) {
        const scale = 0.12;
        const rw = 50 * scale;
        const rh = 35 * scale;
        
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(x - 10, y - 10, 180, 140);
        ctx.strokeStyle = '#555';
        ctx.lineWidth = 2;
        ctx.strokeRect(x - 10, y - 10, 180, 140);
        
        // 绘制房间
        for (let room of dungeon.rooms) {
            const rx = x + room.gridX * 70 * scale;
            const ry = y + room.gridY * 50 * scale;
            
            // 房间颜色
            if (room === currentRoom) {
                ctx.fillStyle = '#2ECC71'; // 当前绿色
                ctx.shadowBlur = 10;
                ctx.shadowColor = '#2ECC71';
            } else if (room.visited) {
                ctx.fillStyle = '#95A5A6'; // 访问过灰色
                ctx.shadowBlur = 0;
            } else if (this.canSeeRoom(dungeon, currentRoom, room)) {
                ctx.fillStyle = '#34495E'; // 可见但未访问
                ctx.shadowBlur = 0;
            } else {
                continue; // 不可见
            }
            
            ctx.fillRect(rx, ry, rw, rh);
            ctx.shadowBlur = 0;
            
            // 特殊标记
            ctx.fillStyle = '#000';
            ctx.font = `${8 * scale}px monospace`;
            let mark = '';
            if (room.type === 'shop') mark = '$';
            else if (room.type === 'treasure') mark = '?';
            else if (room.type === 'boss') mark = '!';
            
            if (mark) {
                ctx.fillText(mark, rx + 2, ry + 8 * scale);
            }
        }
    }
    
    canSeeRoom(dungeon, current, target) {
        const dist = Math.abs(current.gridX - target.gridX) + 
                     Math.abs(current.gridY - target.gridY);
        return dist <= 1;
    }
}

console.log('UI system loaded');
