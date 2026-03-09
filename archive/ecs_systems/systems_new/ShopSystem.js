/**
 * ShopSystem - 商店系统
 * 管理商店界面、商品、购买逻辑
 */

class ShopSystem {
    constructor(world) {
        this.world = world;
        this.priority = 150;
        this.enabled = true;
        
        // 商店状态
        this.isOpen = false;
        this.shopItems = [];
        this.refreshCost = 10;
        this.refreshCount = 0;
        
        // 商店配置
        this.config = {
            itemsPerShop: 4,
            priceMultiplier: 1.0,
            refreshCostBase: 10,
            refreshCostIncrement: 5
        };
        
        // 商品池
        this.itemPool = {
            weapons: [],
            passives: [],
            consumables: []
        };
    }
    
    init() {
        this.initItemPool();
        
        // 监听进入商店房间
        this.world.on('roomEntered', (roomId, prevRoomId, room) => {
            if (room && room.type === 'shop') {
                this.openShop();
            } else {
                this.closeShop();
            }
        });
        
        // 监听按键（打开/关闭商店）
        this.world.on('keyPressed', (key) => {
            if (key === 'b' || key === 'B') {
                this.toggleShop();
            }
        });
    }
    
    /**
     * 初始化商品池
     */
    initItemPool() {
        // 武器池
        this.itemPool.weapons = [
            { id: 'sword', name: '铁剑', type: 'weapon', price: 50, rarity: 'common' },
            { id: 'dagger', name: '匕首', type: 'weapon', price: 40, rarity: 'common' },
            { id: 'spear', name: '长矛', type: 'weapon', price: 60, rarity: 'uncommon' },
            { id: 'bow', name: '木弓', type: 'weapon', price: 50, rarity: 'common' },
            { id: 'staff', name: '法杖', type: 'weapon', price: 70, rarity: 'uncommon' },
            { id: 'greatsword', name: '巨剑', type: 'weapon', price: 100, rarity: 'rare' },
            { id: 'crossbow', name: '十字弩', type: 'weapon', price: 80, rarity: 'uncommon' },
            { id: 'fireStaff', name: '火焰法杖', type: 'weapon', price: 120, rarity: 'rare' },
            { id: 'lightningRod', name: '雷电权杖', type: 'weapon', price: 150, rarity: 'epic' }
        ];
        
        // 被动道具池
        this.itemPool.passives = [
            { id: 'power_glove', name: '力量手套', type: 'passive', price: 80, rarity: 'uncommon', desc: '攻击+10%' },
            { id: 'swift_boots', name: '迅捷之靴', type: 'passive', price: 60, rarity: 'common', desc: '移速+10%' },
            { id: 'vitality_amulet', name: '活力护符', type: 'passive', price: 100, rarity: 'uncommon', desc: '生命+15%' },
            { id: 'critical_ring', name: '暴击戒指', type: 'passive', price: 120, rarity: 'rare', desc: '暴击+5%' },
            { id: 'magnet', name: '磁铁', type: 'passive', price: 50, rarity: 'common', desc: '拾取范围+50%' },
            { id: 'regeneration_ring', name: '再生戒指', type: 'passive', price: 150, rarity: 'rare', desc: '每秒恢复1%生命' },
            { id: 'armor_plate', name: '装甲板', type: 'passive', price: 80, rarity: 'uncommon', desc: '护甲+5' },
            { id: 'vampire_fang', name: '吸血鬼之牙', type: 'passive', price: 200, rarity: 'epic', desc: '造成伤害的5%转化为生命' }
        ];
        
        // 消耗品池
        this.itemPool.consumables = [
            { id: 'health_potion', name: '生命药水', type: 'consumable', price: 20, rarity: 'common', desc: '恢复30生命' },
            { id: 'large_health_potion', name: '大生命药水', type: 'consumable', price: 40, rarity: 'uncommon', desc: '恢复80生命' },
            { id: 'strength_potion', name: '力量药水', type: 'consumable', price: 30, rarity: 'common', desc: '攻击+30% 30秒' },
            { id: 'speed_potion', name: '速度药水', type: 'consumable', price: 30, rarity: 'common', desc: '移速+50% 20秒' },
            { id: 'bomb', name: '炸弹', type: 'consumable', price: 25, rarity: 'common', desc: '造成100范围伤害' },
            { id: 'golden_apple', name: '金苹果', type: 'consumable', price: 100, rarity: 'epic', desc: '恢复100生命并获得5秒无敌' }
        ];
    }
    
    /**
     * 打开商店
     */
    openShop() {
        if (this.isOpen) return;
        
        this.isOpen = true;
        this.refreshCount = 0;
        this.refreshCost = this.config.refreshCostBase;
        this.generateShopItems();
        
        // 暂停游戏
        this.world.emit('gamePaused');
        this.world.emit('shopOpened');
        
        console.log('Shop opened with', this.shopItems.length, 'items');
    }
    
    /**
     * 关闭商店
     */
    closeShop() {
        if (!this.isOpen) return;
        
        this.isOpen = false;
        
        // 恢复游戏
        this.world.emit('gameResumed');
        this.world.emit('shopClosed');
    }
    
    /**
     * 切换商店
     */
    toggleShop() {
        if (this.isOpen) {
            this.closeShop();
        } else {
            this.openShop();
        }
    }
    
    /**
     * 生成商店商品
     */
    generateShopItems() {
        this.shopItems = [];
        
        // 根据权重选择商品类型
        const weights = {
            weapons: 0.3,
            passives: 0.4,
            consumables: 0.3
        };
        
        for (let i = 0; i < this.config.itemsPerShop; i++) {
            const type = this.weightedRandom(weights);
            const pool = this.itemPool[type];
            
            if (pool.length > 0) {
                const item = this.randomFromArray(pool);
                const discountedPrice = Math.floor(item.price * this.config.priceMultiplier);
                
                this.shopItems.push({
                    ...item,
                    slot: i,
                    finalPrice: discountedPrice,
                    sold: false
                });
            }
        }
    }
    
    /**
     * 刷新商店
     */
    refreshShop() {
        const player = this.getPlayer();
        if (!player) return false;
        
        const playerComp = player.get(PlayerComponent);
        if (!playerComp) return false;
        
        // 检查金币
        if ((playerComp.gold || 0) < this.refreshCost) {
            this.world.emit('shopMessage', '金币不足！');
            return false;
        }
        
        // 扣除金币
        playerComp.gold -= this.refreshCost;
        
        // 增加刷新成本
        this.refreshCount++;
        this.refreshCost = this.config.refreshCostBase + this.refreshCount * this.config.refreshCostIncrement;
        
        // 重新生成商品
        this.generateShopItems();
        
        this.world.emit('shopRefreshed');
        return true;
    }
    
    /**
     * 购买商品
     */
    buyItem(slotIndex) {
        const item = this.shopItems[slotIndex];
        if (!item || item.sold) return false;
        
        const player = this.getPlayer();
        if (!player) return false;
        
        const playerComp = player.get(PlayerComponent);
        if (!playerComp) return false;
        
        // 检查金币
        if ((playerComp.gold || 0) < item.finalPrice) {
            this.world.emit('shopMessage', '金币不足！');
            return false;
        }
        
        // 扣除金币
        playerComp.gold -= item.finalPrice;
        
        // 给予物品
        this.giveItemToPlayer(player, item);
        
        // 标记为已售
        item.sold = true;
        
        // 播放音效
        this.world.emit('itemPickedUp', { itemType: item.type });
        
        console.log('Bought:', item.name);
        return true;
    }
    
    /**
     * 给予玩家物品
     */
    giveItemToPlayer(player, item) {
        switch (item.type) {
            case 'weapon':
                // 添加到武器库或替换当前武器
                this.world.emit('weaponAcquired', { weaponId: item.id });
                break;
                
            case 'passive':
                // 添加被动道具
                const itemSystem = this.world.getSystem(ItemSystem);
                if (itemSystem) {
                    itemSystem.addPassive(player, item.id);
                }
                break;
                
            case 'consumable':
                // 添加到背包或直接使用效果
                const inventory = player.get(InventoryComponent);
                if (inventory) {
                    inventory.addItem({ itemId: item.id, count: 1 });
                }
                break;
        }
    }
    
    /**
     * 获取玩家
     */
    getPlayer() {
        const players = this.world.getEntitiesWithTag('player');
        return players.length > 0 ? players[0] : null;
    }
    
    /**
     * 加权随机
     */
    weightedRandom(weights) {
        const total = Object.values(weights).reduce((a, b) => a + b, 0);
        let random = Math.random() * total;
        
        for (const [key, weight] of Object.entries(weights)) {
            random -= weight;
            if (random <= 0) return key;
        }
        
        return Object.keys(weights)[0];
    }
    
    /**
     * 从数组随机选择
     */
    randomFromArray(array) {
        return array[Math.floor(Math.random() * array.length)];
    }
    
    /**
     * 渲染商店界面
     */
    render(ctx) {
        if (!this.isOpen) return;
        
        const canvas = ctx.canvas;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // 半透明背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 商店窗口
        const windowW = 600;
        const windowH = 500;
        const windowX = centerX - windowW / 2;
        const windowY = centerY - windowH / 2;
        
        // 窗口背景
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(windowX, windowY, windowW, windowH);
        
        // 窗口边框
        ctx.strokeStyle = '#f1c40f';
        ctx.lineWidth = 3;
        ctx.strokeRect(windowX, windowY, windowW, windowH);
        
        // 标题
        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 28px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🏪 神秘商店', centerX, windowY + 45);
        
        // 玩家金币
        const player = this.getPlayer();
        const gold = player ? (player.get(PlayerComponent)?.gold || 0) : 0;
        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 18px Arial';
        ctx.fillText(`💰 ${gold}`, centerX, windowY + 75);
        
        // 商品网格
        this.renderShopGrid(ctx, windowX + 20, windowY + 100, windowW - 40);
        
        // 刷新按钮
        this.renderRefreshButton(ctx, centerX, windowY + windowH - 60);
        
        // 关闭提示
        ctx.fillStyle = '#888';
        ctx.font = '14px Arial';
        ctx.fillText('按 [B] 关闭商店', centerX, windowY + windowH - 20);
    }
    
    /**
     * 渲染商品网格
     */
    renderShopGrid(ctx, x, y, w) {
        const itemW = (w - 30) / 2;
        const itemH = 140;
        const gap = 10;
        
        this.shopItems.forEach((item, i) => {
            const col = i % 2;
            const row = Math.floor(i / 2);
            const itemX = x + col * (itemW + gap);
            const itemY = y + row * (itemH + gap);
            
            this.renderShopItem(ctx, itemX, itemY, itemW, itemH, item, i);
        });
    }
    
    /**
     * 渲染单个商品
     */
    renderShopItem(ctx, x, y, w, h, item, index) {
        // 背景
        if (item.sold) {
            ctx.fillStyle = '#333';
        } else {
            // 根据稀有度着色
            const rarityColors = {
                common: '#2c3e50',
                uncommon: '#27ae60',
                rare: '#2980b9',
                epic: '#8e44ad',
                legendary: '#c0392b'
            };
            ctx.fillStyle = rarityColors[item.rarity] || '#2c3e50';
        }
        ctx.fillRect(x, y, w, h);
        
        // 边框
        ctx.strokeStyle = item.sold ? '#555' : '#f1c40f';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);
        
        if (item.sold) {
            // 已售标记
            ctx.fillStyle = '#666';
            ctx.font = 'bold 20px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('已售完', x + w / 2, y + h / 2 + 5);
            return;
        }
        
        // 物品图标（占位符）
        ctx.fillStyle = '#444';
        ctx.fillRect(x + 10, y + 10, 60, 60);
        
        // 物品名
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(item.name, x + 80, y + 30);
        
        // 类型标签
        const typeLabels = { weapon: '[武器]', passive: '[被动]', consumable: '[消耗]' };
        ctx.fillStyle = '#aaa';
        ctx.font = '12px Arial';
        ctx.fillText(typeLabels[item.type] || '', x + 80, y + 50);
        
        // 描述
        if (item.desc) {
            ctx.fillStyle = '#ccc';
            ctx.font = '11px Arial';
            ctx.fillText(item.desc.substring(0, 20), x + 80, y + 75);
        }
        
        // 价格
        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'right';
        ctx.fillText(`💰 ${item.finalPrice}`, x + w - 10, y + h - 15);
        
        // 快捷键提示
        ctx.fillStyle = '#888';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`按 [${index + 1}] 购买`, x + 10, y + h - 15);
    }
    
    /**
     * 渲染刷新按钮
     */
    renderRefreshButton(ctx, centerX, y) {
        const btnW = 150;
        const btnH = 40;
        const btnX = centerX - btnW / 2;
        
        // 按钮背景
        ctx.fillStyle = '#2980b9';
        ctx.fillRect(btnX, y, btnW, btnH);
        
        // 边框
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.strokeRect(btnX, y, btnW, btnH);
        
        // 文字
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`🔄 刷新 (${this.refreshCost})`, centerX, y + 26);
    }
    
    update(dt) {
        // 商店打开时处理输入
        if (!this.isOpen) return;
        
        // 数字键购买
        for (let i = 0; i < this.shopItems.length; i++) {
            // 这里需要InputSystem支持，暂时通过事件处理
        }
    }
}

window.ShopSystem = ShopSystem;
