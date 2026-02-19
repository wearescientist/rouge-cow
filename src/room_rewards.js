/**
 * 肉鸽牛牛 - 房间奖励系统
 * 清理房间后提供以撒风格的道具选择
 */

// ==================== 房间奖励管理器 ====================
class RoomRewardManager {
    constructor(itemManager) {
        this.itemManager = itemManager;
        this.rewardsGiven = new Set(); // 记录已给过奖励的房间
        this.currentRoomReward = null;
        this.isSelecting = false;
    }

    // 检查房间是否可以给奖励
    canGiveReward(room) {
        // 已经给过奖励的房间
        if (this.rewardsGiven.has(room.id)) return false;
        
        // 只有清理完敌人的房间才能给奖励
        if (!room.isCleared) return false;

        // Boss房和宝箱房必有奖励
        if (room.type === "boss" || room.type === "treasure") return true;

        // 普通房30%几率给奖励（根据波数增加）
        const baseChance = 0.3;
        const waveBonus = room.wave * 0.02; // 每波+2%
        return Math.random() < (baseChance + waveBonus);
    }

    // 生成房间奖励
    generateReward(room) {
        const rewardType = this.determineRewardType(room);
        
        switch (rewardType) {
            case "item_choice":
                return this.generateItemChoice(room);
            case "guaranteed_item":
                return this.generateGuaranteedItem(room);
            case "resource_bonus":
                return this.generateResourceBonus(room);
            case "cursed_item":
                return this.generateCursedItem(room);
            default:
                return null;
        }
    }

    // 确定奖励类型
    determineRewardType(room) {
        switch (room.type) {
            case "boss":
                return Math.random() < 0.8 ? "guaranteed_item" : "item_choice";
            case "treasure":
                return "item_choice";
            case "secret":
                return Math.random() < 0.5 ? "cursed_item" : "guaranteed_item";
            case "shop":
                return "resource_bonus";
            default: // normal
                return Math.random() < 0.7 ? "item_choice" : "resource_bonus";
        }
    }

    // 生成道具选择奖励
    generateItemChoice(room) {
        // 根据房间类型确定道具池
        let poolType = "normal";
        let itemCount = 3;

        switch (room.type) {
            case "boss":
                poolType = "boss";
                itemCount = 2; // Boss房给2个高稀有度选择
                break;
            case "treasure":
                poolType = "treasure";
                itemCount = 3;
                break;
            case "secret":
                poolType = "secret";
                itemCount = 1; // 隐藏房给一个强力/诅咒道具
                break;
            default:
                // 普通房根据波数提升稀有度
                if (room.wave >= 10) poolType = "treasure";
                else if (room.wave >= 5) poolType = "normal";
        }

        const items = this.itemManager.getRandomItemsFromPool(itemCount, poolType, true);

        return {
            type: "item_choice",
            items: items,
            room: room
        };
    }

    // 生成确定道具奖励
    generateGuaranteedItem(room) {
        let poolType = "normal";
        
        if (room.type === "boss") poolType = "boss";
        else if (room.wave >= 8) poolType = "treasure";

        const items = this.itemManager.getRandomItemsFromPool(1, poolType, true);
        
        if (items.length === 0) return null;

        return {
            type: "guaranteed_item",
            item: items[0],
            room: room
        };
    }

    // 生成资源奖励
    generateResourceBonus(room) {
        const baseGold = 10 + room.wave * 5;
        const variance = Math.floor(Math.random() * baseGold * 0.5);
        
        const rewards = {
            gold: baseGold + variance
        };

        // 高波数额外奖励
        if (room.wave >= 5 && Math.random() < 0.3) {
            rewards.heal = Math.floor(room.wave / 2);
        }
        if (room.wave >= 8 && Math.random() < 0.2) {
            rewards.keys = 1;
        }

        return {
            type: "resource_bonus",
            rewards: rewards,
            room: room
        };
    }

    // 生成诅咒道具
    generateCursedItem(room) {
        const items = this.itemManager.getRandomItemsFromPool(1, "secret", true);
        
        if (items.length === 0) return null;

        return {
            type: "cursed_item",
            item: items[0],
            warning: "这是一个诅咒道具，会带来负面效果！",
            room: room
        };
    }

    // 给予奖励
    giveReward(room, player, selectionUI) {
        if (!this.canGiveReward(room)) return false;

        const reward = this.generateReward(room);
        if (!reward) return false;

        this.currentRoomReward = reward;
        this.rewardsGiven.add(room.id);

        switch (reward.type) {
            case "item_choice":
                this.startItemSelection(reward.items, player, selectionUI);
                break;
            case "guaranteed_item":
                this.giveGuaranteedItem(reward.item, player);
                break;
            case "resource_bonus":
                this.giveResourceBonus(reward.rewards, player);
                break;
            case "cursed_item":
                this.giveCursedItem(reward.item, player, selectionUI);
                break;
        }

        return true;
    }

    // 开始道具选择
    startItemSelection(items, player, selectionUI) {
        this.isSelecting = true;
        
        // 暂停游戏
        // Game.pause();

        selectionUI.show(items, (selectedItem) => {
            this.onItemSelected(selectedItem, player);
        });
    }

    // 道具选择回调
    onItemSelected(item, player) {
        this.isSelecting = false;
        
        // 恢复游戏
        // Game.resume();

        // 打开门（允许离开房间）
        // room.openDoors();

        console.log(`选择了道具: ${item.name}`);
    }

    // 给予确定道具
    giveGuaranteedItem(item, player) {
        this.itemManager.acquireItem(item.id);
        
        // 显示获得效果
        // Game.showItemAcquireEffect(item, player.x, player.y);
        
        console.log(`获得道具: ${item.name}`);
    }

    // 给予资源奖励
    giveResourceBonus(rewards, player) {
        if (rewards.gold) {
            player.gold += rewards.gold;
            // Game.showFloatingText(`+${rewards.gold}💰`, player.x, player.y - 30);
        }
        if (rewards.heal) {
            player.heal(rewards.heal);
            // Game.showFloatingText(`+${rewards.heal}❤️`, player.x, player.y - 50);
        }
        if (rewards.keys) {
            player.keys += rewards.keys;
            // Game.showFloatingText(`+${rewards.keys}🔑`, player.x, player.y - 70);
        }

        console.log("获得资源奖励:", rewards);
    }

    // 给予诅咒道具
    giveCursedItem(item, player, selectionUI) {
        // 诅咒道具需要确认
        const confirmItems = [item, { id: -1, name: "放弃", icon: "🚫", description: "不要这个道具", rarity: "common" }];
        
        selectionUI.show(confirmItems, (selected) => {
            if (selected.id !== -1) {
                this.itemManager.acquireItem(selected.id);
                console.log(`获得诅咒道具: ${selected.name}`);
            }
        });
    }

    // 序列化
    serialize() {
        return {
            rewardsGiven: Array.from(this.rewardsGiven)
        };
    }

    // 反序列化
    deserialize(data) {
        this.rewardsGiven = new Set(data?.rewardsGiven || []);
    }
}

// ==================== 道具底座（以撒风格） ====================
class ItemPedestal {
    constructor(x, y, item) {
        this.x = x;
        this.y = y;
        this.item = item;
        this.bobOffset = 0;
        this.bobSpeed = 0.05;
        this.glowPhase = 0;
    }

    update() {
        this.bobOffset += this.bobSpeed;
        this.glowPhase += 0.1;
    }

    draw(ctx) {
        const bobY = Math.sin(this.bobOffset) * 5;
        const glowIntensity = (Math.sin(this.glowPhase) + 1) / 2;

        const rarityGlow = {
            common: { color: "rgba(255,255,255,", intensity: 0.2 },
            rare: { color: "rgba(68,136,255,", intensity: 0.4 },
            epic: { color: "rgba(170,68,255,", intensity: 0.5 },
            legendary: { color: "rgba(255,204,0,", intensity: 0.6 },
            cursed: { color: "rgba(255,68,68,", intensity: 0.5 }
        };

        const glow = rarityGlow[this.item.rarity] || rarityGlow.common;

        ctx.save();

        // 发光效果
        ctx.shadowColor = glow.color.replace("rgba(", "").replace(",", "").replace(/[\d.]+\)$/, "");
        ctx.shadowBlur = 20 + glowIntensity * 20;

        // 底座
        ctx.fillStyle = "#333344";
        ctx.fillRect(this.x - 20, this.y + 15, 40, 10);
        
        // 底座高亮
        ctx.fillStyle = "#444455";
        ctx.fillRect(this.x - 18, this.y + 13, 36, 4);

        // 道具图标（上下浮动）
        ctx.font = "32px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(this.item.icon, this.x, this.y + bobY);

        // 光晕
        const gradient = ctx.createRadialGradient(
            this.x, this.y + bobY, 0,
            this.x, this.y + bobY, 40
        );
        gradient.addColorStop(0, glow.color + (glowIntensity * glow.intensity) + ")");
        gradient.addColorStop(1, glow.color + "0)");
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y + bobY, 40, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    // 检查玩家是否靠近
    checkPlayerProximity(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < 40; // 拾取范围
    }
}

// ==================== 道具组合提示系统 ====================
class ItemSynergyHints {
    constructor(itemManager) {
        this.itemManager = itemManager;
        this.synergies = this.defineSynergies();
    }

    // 定义道具组合
    defineSynergies() {
        return [
            {
                name: "元素大师",
                items: [10, 11], // 火焰附魔 + 冰冻核心
                effect: "子弹同时带燃烧和冰冻，敌人先冻住再融化受双倍伤害",
                bonus: { damageMultiplier: 2, freezeBurn: true }
            },
            {
                name: "枪林弹雨",
                items: [1, 20], // 多重射击 + 霰弹扩散
                effect: "每个散弹都+1，3发散弹变成6发",
                bonus: { shotgunExtra: 3 }
            },
            {
                name: "不朽之身",
                items: [33, 49], // 不朽护符 + 凤凰之羽
                effect: "死亡时满血复活，保留所有道具",
                bonus: { fullHealthRevive: true }
            },
            {
                name: "财神爷",
                items: [74, 85], // 金蛋 + 富可敌国
                effect: "每100金币伤害+3，金币上限9999",
                bonus: { goldDamageRate: 100, goldDamageAmount: 3 }
            },
            {
                name: "冰冻领域",
                items: [11, 62], // 冰冻核心 + 滑行靴
                effect: "走过的地方留下冰冻轨迹，敌人踩上减速",
                bonus: { iceTrailFreeze: true }
            },
            {
                name: "死神来了",
                items: [45, 32], // 生命虹吸 + 吸血獠牙
                effect: "击杀回血翻倍，血量越低吸血越多",
                bonus: { lifestealMultiplier: 2, lowHealthBonus: true }
            },
            {
                name: "光速子弹",
                items: [18, 64], // 弹射起步 + 时间加速
                effect: "子弹速度极快，伤害随飞行距离增加",
                bonus: { speedToDamage: true }
            },
            {
                name: "绝对防御",
                items: [31, 27], // 荆棘护甲 + 钢铁护甲
                effect: "防御+荆棘反弹，敌人攻击你等于自杀",
                bonus: { thornMultiplier: 2 }
            }
        ];
    }

    // 检查当前激活的组合
    getActiveSynergies() {
        const active = [];
        
        for (const synergy of this.synergies) {
            const hasAll = synergy.items.every(id => this.itemManager.hasItem(id));
            if (hasAll) {
                active.push(synergy);
            }
        }

        return active;
    }

    // 检查即将形成的组合
    getPotentialSynergies(itemId) {
        const potential = [];

        for (const synergy of this.synergies) {
            if (synergy.items.includes(itemId)) {
                const owned = synergy.items.filter(id => 
                    id === itemId || this.itemManager.hasItem(id)
                );
                
                if (owned.length === synergy.items.length - 1) {
                    // 差一个就形成组合
                    potential.push({
                        ...synergy,
                        missing: synergy.items.find(id => !owned.includes(id))
                    });
                }
            }
        }

        return potential;
    }

    // 显示组合提示
    drawSynergyHint(ctx, x, y, synergy) {
        ctx.save();
        
        ctx.fillStyle = "rgba(255, 215, 0, 0.9)";
        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 2;

        const text = `✨ ${synergy.name}: ${synergy.effect}`;
        const padding = 10;
        ctx.font = "bold 14px Arial";
        const metrics = ctx.measureText(text);
        const w = metrics.width + padding * 2;
        const h = 30;

        ctx.fillRect(x, y, w, h);
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = "#000000";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(text, x + padding, y + h / 2);

        ctx.restore();
    }
}

// ==================== 导出 ====================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RoomRewardManager, ItemPedestal, ItemSynergyHints };
}
