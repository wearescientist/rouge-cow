// 肉鸽牛牛 v18.0 - 装备系统
const EQUIP_SLOTS = {
    weapon: { name: '武器', icon: 'W' },
    head: { name: '头部', icon: 'H' },
    body: { name: '身体', icon: 'B' },
    legs: { name: '腿部', icon: 'L' },
    accessory1: { name: '饰品1', icon: 'A1' },
    accessory2: { name: '饰品2', icon: 'A2' }
};

const EQUIPMENT = {
    weapon_milk_cannon: {
        id: 'weapon_milk_cannon',
        name: 'Milk Cannon',
        slot: 'weapon',
        rarity: 'epic',
        stats: { damage: 5 }
    },
    head_iron_helmet: {
        id: 'head_iron_helmet',
        name: 'Iron Helmet',
        slot: 'head',
        rarity: 'rare',
        stats: { armor: 2 }
    },
    body_chainmail: {
        id: 'body_chainmail',
        name: 'Chainmail',
        slot: 'body',
        rarity: 'rare',
        stats: { armor: 3 }
    }
};

class EquipmentManager {
    constructor(player) {
        this.player = player;
        this.equipped = { weapon: null, head: null, body: null, legs: null, accessory1: null, accessory2: null };
        this.inventory = [];
    }
    
    equip(itemId, slot) {
        const item = EQUIPMENT[itemId];
        if (!item) return false;
        
        if (this.equipped[slot]) {
            this.unequip(slot);
        }
        
        this.equipped[slot] = itemId;
        this.applyStats(item);
        return true;
    }
    
    unequip(slot) {
        const itemId = this.equipped[slot];
        if (!itemId) return false;
        
        const item = EQUIPMENT[itemId];
        this.removeStats(item);
        this.equipped[slot] = null;
        this.inventory.push(itemId);
        return true;
    }
    
    applyStats(item) {
        if (item.stats) {
            for (let [stat, value] of Object.entries(item.stats)) {
                if (this.player[stat] !== undefined) {
                    this.player[stat] += value;
                }
            }
        }
    }
    
    removeStats(item) {
        if (item.stats) {
            for (let [stat, value] of Object.entries(item.stats)) {
                if (this.player[stat] !== undefined) {
                    this.player[stat] -= value;
                }
            }
        }
    }
}

console.log('Equipment system loaded');
