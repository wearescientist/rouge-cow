/**
 * UISystem - UI 渲染系统（重构版）
 * 三栏式布局：左栏（角色/武器）、中栏（游戏）、右栏（地图/道具）
 */

class UISystem {
    constructor(world, canvas) {
        this.world = world;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.priority = 200;
        this.enabled = true;
        
        // 玩家引用
        this.player = null;
        
        // UI 配置
        this.config = {
            leftPanelWidth: 220,
            rightPanelWidth: 220,
            panelPadding: 10,
            barHeight: 20,
            fontSize: 14,
            fontFamily: 'Arial, sans-serif',
            colors: {
                panelBg: 'rgba(0, 0, 0, 0.7)',
                panelBorder: '#444',
                health: '#e74c3c',
                healthBg: '#2c0000',
                exp: '#3498db',
                expBg: '#00152c',
                stamina: '#2ecc71',
                gold: '#f1c40f',
                text: '#ecf0f1',
                textDim: '#95a5a6',
                rare: '#9b59b6',
                epic: '#e67e22',
                legend: '#e74c3c'
            }
        };
        
        // 背包格子
        this.inventorySlots = 20;
        this.slotsPerRow = 4;
        
        // 被动道具显示
        this.passiveIcons = [];
        
        // 武器槽
        this.weaponSlots = 6;
        
        // 小地图
        this.minimapSize = 180;
    }
    
    init() {
        this.world.on('entityCreated', (entity) => {
            if (entity.hasTag('player')) {
                this.player = entity;
            }
        });
    }
    
    update(dt) {
        if (!this.player || !this.player.active) {
            const players = this.world.getEntitiesWithTag('player');
            if (players.length > 0) {
                this.player = players[0];
            }
        }
    }
    
    render(ctx) {
        if (!this.player) return;
        
        ctx.save();
        
        // 渲染左栏
        this.renderLeftPanel(ctx);
        
        // 渲染右栏
        this.renderRightPanel(ctx);
        
        // 渲染底部HUD
        this.renderBottomHUD(ctx);
        
        ctx.restore();
    }
    
    /**
     * 左栏：角色信息 + 武器
     */
    renderLeftPanel(ctx) {
        const w = this.config.leftPanelWidth;
        const h = this.canvas.height;
        const pad = this.config.panelPadding;
        
        // 面板背景
        ctx.fillStyle = this.config.colors.panelBg;
        ctx.fillRect(0, 0, w, h);
        
        // 边框
        ctx.strokeStyle = this.config.colors.panelBorder;
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, w, h);
        
        let y = pad;
        
        // 角色头像区域
        y += this.renderCharacterHeader(ctx, pad, y, w - pad * 2);
        
        // 血条
        y += 10;
        y += this.renderHealthBar(ctx, pad, y, w - pad * 2);
        
        // 经验条
        y += 10;
        y += this.renderExpBar(ctx, pad, y, w - pad * 2);
        
        // 属性面板
        y += 20;
        y += this.renderStatsPanel(ctx, pad, y, w - pad * 2);
        
        // 武器栏
        y += 20;
        this.renderWeaponSlots(ctx, pad, y, w - pad * 2);
    }
    
    /**
     * 右栏：小地图 + 道具背包 + 被动道具
     */
    renderRightPanel(ctx) {
        const w = this.config.rightPanelWidth;
        const h = this.canvas.height;
        const pad = this.config.panelPadding;
        const x = this.canvas.width - w;
        
        // 面板背景
        ctx.fillStyle = this.config.colors.panelBg;
        ctx.fillRect(x, 0, w, h);
        
        // 边框
        ctx.strokeStyle = this.config.colors.panelBorder;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, 0, w, h);
        
        let y = pad;
        
        // 小地图
        y += this.renderMinimap(ctx, x + pad, y, w - pad * 2);
        
        // 当前层数
        y += 10;
        y += this.renderFloorInfo(ctx, x + pad, y, w - pad * 2);
        
        // 被动道具墙
        y += 20;
        y += this.renderPassiveItems(ctx, x + pad, y, w - pad * 2);
        
        // 道具背包
        y += 20;
        this.renderInventory(ctx, x + pad, y, w - pad * 2);
    }
    
    /**
     * 角色头像区域
     */
    renderCharacterHeader(ctx, x, y, w) {
        const h = 60;
        
        // 头像框
        ctx.fillStyle = '#333';
        ctx.fillRect(x, y, 50, h);
        ctx.strokeStyle = '#666';
        ctx.strokeRect(x, y, 50, h);
        
        // 占位符头像
        ctx.fillStyle = '#666';
        ctx.font = '30px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🐮', x + 25, y + 40);
        
        // 角色名和等级
        ctx.fillStyle = this.config.colors.text;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('深根行者', x + 60, y + 25);
        
        const playerComp = this.player.get(PlayerComponent);
        if (playerComp) {
            ctx.fillStyle = this.config.colors.gold;
            ctx.font = '14px Arial';
            ctx.fillText(`Lv.${playerComp.level}`, x + 60, y + 45);
        }
        
        return h;
    }
    
    /**
     * 血条
     */
    renderHealthBar(ctx, x, y, w) {
        const h = this.config.barHeight;
        const health = this.player.get(HealthComponent);
        
        if (!health) return h + 5;
        
        // 背景
        ctx.fillStyle = this.config.colors.healthBg;
        ctx.fillRect(x, y, w, h);
        
        // 血量
        const pct = health.currentHealth / health.maxHealth;
        ctx.fillStyle = pct < 0.3 ? '#ff0000' : this.config.colors.health;
        ctx.fillRect(x, y, w * pct, h);
        
        // 边框
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, w, h);
        
        // 文字
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            `${Math.floor(health.currentHealth)}/${Math.floor(health.maxHealth)}`,
            x + w / 2, y + h / 2 + 4
        );
        
        return h + 5;
    }
    
    /**
     * 经验条
     */
    renderExpBar(ctx, x, y, w) {
        const h = this.config.barHeight;
        const playerComp = this.player.get(PlayerComponent);
        
        if (!playerComp) return h + 5;
        
        // 背景
        ctx.fillStyle = this.config.colors.expBg;
        ctx.fillRect(x, y, w, h);
        
        // 经验
        const pct = playerComp.experience / playerComp.nextLevelExp;
        ctx.fillStyle = this.config.colors.exp;
        ctx.fillRect(x, y, w * pct, h);
        
        // 边框
        ctx.strokeStyle = '#000';
        ctx.strokeRect(x, y, w, h);
        
        // 文字
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
            `${Math.floor(playerComp.experience)}/${Math.floor(playerComp.nextLevelExp)}`,
            x + w / 2, y + h / 2 + 4
        );
        
        return h + 5;
    }
    
    /**
     * 属性面板
     */
    renderStatsPanel(ctx, x, y, w) {
        const h = 120;
        const pad = 5;
        
        // 背景
        ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.fillRect(x, y, w, h);
        ctx.strokeStyle = '#555';
        ctx.strokeRect(x, y, w, h);
        
        // 标题
        ctx.fillStyle = this.config.colors.text;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('属性', x + pad, y + 18);
        
        // 属性列表
        const stats = this.getPlayerStats();
        const colWidth = w / 2;
        let rowY = y + 35;
        
        ctx.font = '12px Arial';
        
        stats.forEach((stat, i) => {
            const col = i % 2;
            const colX = x + pad + col * colWidth;
            
            ctx.fillStyle = this.config.colors.textDim;
            ctx.fillText(stat.name + ':', colX, rowY);
            
            ctx.fillStyle = stat.color || this.config.colors.text;
            ctx.fillText(stat.value, colX + 50, rowY);
            
            if (col === 1) rowY += 18;
        });
        
        return h;
    }
    
    /**
     * 获取玩家属性
     */
    getPlayerStats() {
        const stats = [];
        const playerComp = this.player.get(PlayerComponent);
        const health = this.player.get(HealthComponent);
        const weapon = this.player.get(WeaponComponent);
        const movement = this.player.get(MovementComponent);
        
        if (weapon) {
            stats.push({ name: '攻击', value: Math.floor(weapon.damage), color: '#e74c3c' });
            stats.push({ name: '攻速', value: weapon.attackSpeed.toFixed(1), color: '#f39c12' });
        }
        
        if (movement) {
            stats.push({ name: '移速', value: Math.floor(movement.speed), color: '#2ecc71' });
        }
        
        if (weapon) {
            stats.push({ name: '暴击', value: Math.floor((weapon.criticalChance || 0) * 100) + '%', color: '#9b59b6' });
        }
        
        if (health) {
            stats.push({ name: '护甲', value: Math.floor(health.armor || 0), color: '#3498db' });
        }
        
        if (playerComp) {
            stats.push({ name: '金币', value: Math.floor(playerComp.gold || 0), color: '#f1c40f' });
        }
        
        return stats;
    }
    
    /**
     * 武器槽
     */
    renderWeaponSlots(ctx, x, y, w) {
        const slotSize = 32;
        const gap = 5;
        const cols = Math.floor(w / (slotSize + gap));
        
        ctx.fillStyle = this.config.colors.text;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('武器', x, y + 14);
        
        let slotY = y + 20;
        
        for (let i = 0; i < this.weaponSlots; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const slotX = x + col * (slotSize + gap);
            const slotYActual = slotY + row * (slotSize + gap);
            
            // 槽背景
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(slotX, slotYActual, slotSize, slotSize);
            
            // 边框（第一个槽高亮）
            ctx.strokeStyle = i === 0 ? '#f1c40f' : '#555';
            ctx.lineWidth = i === 0 ? 2 : 1;
            ctx.strokeRect(slotX, slotYActual, slotSize, slotSize);
            
            // TODO: 显示武器图标
        }
        
        return slotY + Math.ceil(this.weaponSlots / cols) * (slotSize + gap);
    }
    
    /**
     * 小地图（简化版）
     */
    renderMinimap(ctx, x, y, w) {
        const size = Math.min(w, this.minimapSize);
        
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(x, y, size, size);
        
        // 边框
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, size, size);
        
        // 获取RoomSystem
        const roomSystem = this.world.getSystem(RoomSystem);
        if (roomSystem && roomSystem.currentMap) {
            // 绘制房间
            const rooms = roomSystem.currentMap.rooms || [];
            const cellSize = size / 10; // 假设10x10网格
            
            rooms.forEach(room => {
                const rx = x + (room.gridX + 5) * cellSize;
                const ry = y + (room.gridY + 5) * cellSize;
                
                // 房间颜色
                if (room.type === 'start') ctx.fillStyle = '#2ecc71';
                else if (room.type === 'boss') ctx.fillStyle = '#e74c3c';
                else if (room.type === 'shop') ctx.fillStyle = '#3498db';
                else if (room.type === 'treasure') ctx.fillStyle = '#f1c40f';
                else if (room.isVisited) ctx.fillStyle = '#ecf0f1';
                else ctx.fillStyle = '#555';
                
                ctx.fillRect(rx + 2, ry + 2, cellSize - 4, cellSize - 4);
                
                // 当前房间标记
                if (roomSystem.currentRoomId === room.id) {
                    ctx.strokeStyle = '#f1c40f';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(rx, ry, cellSize, cellSize);
                }
            });
        }
        
        return size + 10;
    }
    
    /**
     * 层数信息
     */
    renderFloorInfo(ctx, x, y, w) {
        const roomSystem = this.world.getSystem(RoomSystem);
        const floor = roomSystem ? roomSystem.getCurrentFloor() : 1;
        
        ctx.fillStyle = this.config.colors.text;
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`第 ${floor} 层`, x + w / 2, y + 16);
        
        return 25;
    }
    
    /**
     * 被动道具墙
     */
    renderPassiveItems(ctx, x, y, w) {
        const iconSize = 28;
        const gap = 4;
        const cols = Math.floor(w / (iconSize + gap));
        const maxDisplay = 12;
        
        ctx.fillStyle = this.config.colors.text;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('被动道具', x, y + 14);
        
        let iconY = y + 20;
        
        // TODO: 从PlayerComponent获取实际被动道具
        for (let i = 0; i < maxDisplay; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const iconX = x + col * (iconSize + gap);
            const iconYActual = iconY + row * (iconSize + gap);
            
            // 背景
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(iconX, iconYActual, iconSize, iconSize);
            
            // 边框
            ctx.strokeStyle = '#666';
            ctx.strokeRect(iconX, iconYActual, iconSize, iconSize);
        }
        
        return iconY + Math.ceil(maxDisplay / cols) * (iconSize + gap);
    }
    
    /**
     * 道具背包
     */
    renderInventory(ctx, x, y, w) {
        const slotSize = 40;
        const gap = 5;
        const cols = Math.floor(w / (slotSize + gap));
        
        ctx.fillStyle = this.config.colors.text;
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('背包', x, y + 14);
        
        let slotY = y + 20;
        
        for (let i = 0; i < this.inventorySlots; i++) {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const slotX = x + col * (slotSize + gap);
            const slotYActual = slotY + row * (slotSize + gap);
            
            // 槽背景
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(slotX, slotYActual, slotSize, slotSize);
            
            // 边框
            ctx.strokeStyle = '#555';
            ctx.lineWidth = 1;
            ctx.strokeRect(slotX, slotYActual, slotSize, slotSize);
            
            // 序号
            if (i < 9) {
                ctx.fillStyle = '#666';
                ctx.font = '10px Arial';
                ctx.textAlign = 'left';
                ctx.fillText((i + 1).toString(), slotX + 3, slotYActual + 12);
            }
        }
        
        return slotY + Math.ceil(this.inventorySlots / cols) * (slotSize + gap);
    }
    
    /**
     * 底部HUD（快捷键提示等）
     */
    renderBottomHUD(ctx) {
        const h = 30;
        const y = this.canvas.height - h;
        
        // 背景条
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(this.config.leftPanelWidth, y, 
                     this.canvas.width - this.config.leftPanelWidth - this.config.rightPanelWidth, h);
        
        // 快捷键提示
        ctx.fillStyle = this.config.colors.textDim;
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText('[WASD]移动 [鼠标]瞄准/攻击 [空格]冲刺 [1-6]切换武器', 
                     this.config.leftPanelWidth + 10, y + 20);
    }
}

window.UISystem = UISystem;
