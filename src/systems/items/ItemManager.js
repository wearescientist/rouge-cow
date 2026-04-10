/**
 * ItemManager - 道具管理器
 * 当前版本只维护新版道具表 + 单宠物系统
 */

class ItemManager {
    constructor(player) {
        this.player = player;
        this.owned = {};
        this.growthState = {};
        this.cache = null;
        this.dirty = true;
    }

    isGrowthItem(item) {
        return !!(item && typeof item.effect === 'string' && item.effect.startsWith('growth'));
    }

    ensureGrowthState(id, item = ITEMS[id]) {
        if (!this.isGrowthItem(item)) return null;
        if (!this.growthState[id]) {
            this.growthState[id] = {
                levels: 0,
                killsSincePickup: 0
            };
        }
        return this.growthState[id];
    }

    applyPickupSideEffects(item) {
        if (!item || !this.player) return;

        switch (item.effect) {
            case 'maxHpAdd':
                this.player.maxHp = Math.max(1, this.player.maxHp + (item.value || 0));
                this.player.hp = Math.min(this.player.maxHp, this.player.hp + (item.value || 0));
                break;
            case 'brittleBonePact':
                this.player.maxHp = Math.max(1, this.player.maxHp - 1);
                this.player.hp = Math.min(this.player.hp, this.player.maxHp);
                break;
            case 'glassCannon':
                this.player.maxHp = Math.max(1, Math.floor(this.player.maxHp * 0.5));
                this.player.hp = Math.min(this.player.hp, this.player.maxHp);
                break;
            default:
                break;
        }
    }

    add(id) {
        const item = ITEMS[id];
        if (!item) return false;

        if (item.effect === 'unlockCompanion') {
            if (!window.game?.petManager) return false;
            if (window.game.petManager.isUnlocked) return false;
            this.owned[id] = 1;
            this.dirty = true;
            window.game.unlockPet('companion');
            return true;
        }

        if (item.effect === 'petSkill') {
            if (!window.game?.petManager) return false;
            const result = window.game.petManager.upgradeSkill(item.petSkillKey);
            if (!result.ok) return false;
            return true;
        }

        if (this.owned[id]) return false;

        this.owned[id] = 1;
        this.ensureGrowthState(id, item);
        this.applyPickupSideEffects(item);
        this.dirty = true;
        window.collectionCodex?.unlockItem?.(String(id));
        return true;
    }

    onEnemyKilled(count = 1) {
        if (!count) return;
        let changed = false;
        for (const id of Object.keys(this.owned)) {
            const item = ITEMS[id];
            if (!this.isGrowthItem(item)) continue;
            const state = this.ensureGrowthState(id, item);
            state.killsSincePickup += count;
            const threshold = Math.max(1, item.growthEveryKills || 500);
            while (state.killsSincePickup >= threshold) {
                state.killsSincePickup -= threshold;
                state.levels += 1;
                changed = true;
            }
        }
        if (changed) {
            this.dirty = true;
        }
    }

    getGrowthSnapshot(id) {
        return this.growthState[id] || { levels: 0, killsSincePickup: 0 };
    }

    getStats() {
        if (!this.dirty && this.cache) return this.cache;

        const s = {
            dmg: 1,
            projCount: 1,
            projSize: 1,
            fireRate: 1,
            pierce: 0,
            crit: 0,
            critDmg: 1.5,
            maxHp: 0,
            armor: 0,
            lifeSteal: 0,
            speed: 1,
            fly: false,
            magnet: 100,
            goldBonus: 1,
            expBonus: 0,
            luck: 0,
            fireDmg: 0,
            thunderDmg: 0,
            poisonDmg: 0,
            curseDmg: 0,
            slowChance: 0,
            slowAmount: 0,
            stunChance: 0,
            range: 0,
            projSpeed: 0,
            duration: 0,
            dashDist: 1,
            projCountAdd: 0,
            projSpreadAdd: 0,
            dmgMult: 0,
            fireRateMult: 0,
            speedMult: 0,
            critAdd: 0,
            maxHpAdd: 0,
            armorAdd: 0,
            goldBonusMult: 0,
            expBonusAdd: 0,
            luckAdd: 0,

            soyMilk: false,
            twinsMirror: false,
            riftDrum: false,
            aftershockHammer: false,
            echoFork: false,
            glassCannon: false,
            prideCrown: false,
            brittleBonePact: false,
            hungerOath: false,
            thinWick: false,
            blackContract: false,
            debtReceipt: false,
            freebie: false,
            halfCoupon: false,
            fullMapScroll: false,
            shopPriceMult: 1,
            shopFirstFree: false
        };

        for (const id of Object.keys(this.owned)) {
            const item = ITEMS[id];
            if (!item) continue;

            switch (item.effect) {
                case 'dmgMult':
                    s.dmgMult += item.value || 0;
                    break;
                case 'fireRateMult':
                    s.fireRateMult += item.value || 0;
                    break;
                case 'speedMult':
                    s.speedMult += item.value || 0;
                    break;
                case 'critAdd':
                    s.critAdd += item.value || 0;
                    break;
                case 'maxHpAdd':
                    s.maxHpAdd += item.value || 0;
                    break;
                case 'armorAdd':
                    s.armorAdd += item.value || 0;
                    break;
                case 'projCountAdd':
                    s.projCountAdd += item.value || 0;
                    break;
                case 'goldBonusMult':
                    s.goldBonusMult += item.value || 0;
                    break;
                case 'expBonusAdd':
                    s.expBonusAdd += item.value || 0;
                    break;
                case 'luckAdd':
                    s.luckAdd += item.value || 0;
                    break;

                case 'growthAttack':
                case 'growthFireRate':
                case 'growthSpeed':
                case 'growthCrit':
                case 'growthGold': {
                    const state = this.ensureGrowthState(id, item);
                    const levels = state?.levels || 0;
                    if (levels <= 0) break;
                    const gain = (item.value || 0) * levels;
                    if (item.effect === 'growthAttack') s.dmgMult += gain;
                    else if (item.effect === 'growthFireRate') s.fireRateMult += gain;
                    else if (item.effect === 'growthSpeed') s.speedMult += gain;
                    else if (item.effect === 'growthCrit') s.critAdd += gain;
                    else if (item.effect === 'growthGold') s.goldBonusMult += gain;
                    break;
                }

                case 'soyMilk':
                    s.soyMilk = true;
                    break;
                case 'twinsMirror':
                    s.twinsMirror = true;
                    break;
                case 'riftDrum':
                    s.riftDrum = true;
                    break;
                case 'aftershockHammer':
                    s.aftershockHammer = true;
                    break;
                case 'echoFork':
                    s.echoFork = true;
                    break;
                case 'glassCannon':
                    s.glassCannon = true;
                    break;
                case 'prideCrown':
                    s.prideCrown = true;
                    break;
                case 'brittleBonePact':
                    s.brittleBonePact = true;
                    break;
                case 'hungerOath':
                    s.hungerOath = true;
                    break;
                case 'thinWick':
                    s.thinWick = true;
                    break;
                case 'blackContract':
                    s.blackContract = true;
                    break;
                case 'debtReceipt':
                    s.debtReceipt = true;
                    break;
                case 'freebie':
                    s.freebie = true;
                    break;
                case 'halfCoupon':
                    s.halfCoupon = true;
                    break;
                case 'fullMapScroll':
                    s.fullMapScroll = true;
                    break;
                default:
                    break;
            }
        }

        if (s.dmgMult) s.dmg *= (1 + s.dmgMult);
        if (s.fireRateMult) s.fireRate *= (1 + s.fireRateMult);
        if (s.speedMult) s.speed *= (1 + s.speedMult);
        if (s.critAdd) s.crit = Math.min(0.95, s.crit + s.critAdd);
        if (s.maxHpAdd) s.maxHp += s.maxHpAdd;
        if (s.armorAdd) s.armor += s.armorAdd;
        if (s.projCountAdd) {
            s.projCount += s.projCountAdd;
            s.projSpreadAdd += s.projCountAdd * 5;
        }
        if (s.goldBonusMult) s.goldBonus *= (1 + s.goldBonusMult);
        if (s.expBonusAdd) s.expBonus += s.expBonusAdd;
        if (s.luckAdd) s.luck += s.luckAdd;

        if (s.soyMilk) {
            s.fireRate *= 2.2;
            s.dmg *= 0.35;
            s.critDmg = Math.max(1, s.critDmg - 0.5);
        }

        if (s.twinsMirror) {
            s.projCount += 1;
            s.dmg *= 0.7;
            s.projSpreadAdd += 8;
        }

        if (s.glassCannon) {
            s.dmg *= 1.5;
            s.armor *= 0.5;
        }

        if (s.brittleBonePact) {
            s.crit = Math.min(0.95, s.crit + 0.12);
        }

        if (s.hungerOath) {
            s.goldBonus *= 1.5;
            s.shopPriceMult *= 1.3;
        }

        if (s.debtReceipt) {
            s.expBonus += 0.3;
            s.goldBonus *= 0.7;
        }

        if (s.halfCoupon) {
            s.shopPriceMult *= 0.5;
        }

        if (s.freebie) {
            s.shopFirstFree = true;
        }

        if (s.thinWick && this.player) {
            const hpRate = this.player.maxHp > 0 ? (this.player.hp / this.player.maxHp) : 1;
            if (hpRate <= 0.5) {
                s.fireRate *= 1.3;
                s.crit = Math.min(0.95, s.crit + 0.10);
            }
        }

        this.cache = s;
        this.dirty = false;
        return s;
    }

    has(id) {
        return (this.owned[id] || 0) > 0;
    }

    count(id) {
        return this.owned[id] || 0;
    }

    getOwnedItems() {
        const items = [];
        for (const id of Object.keys(this.owned)) {
            const item = ITEMS[id];
            if (!item) continue;
            let desc = item.desc;
            if (this.isGrowthItem(item)) {
                const state = this.getGrowthSnapshot(id);
                desc = `${item.desc} | 当前${state.levels}层 | ${state.killsSincePickup}/${item.growthEveryKills || 500}`;
            }
            items.push({
                id: id,
                name: item.name,
                icon: item.icon,
                count: 1,
                desc,
                rarity: item.rarity || 'common',
                rarityColor: RARITY_COLORS[item.rarity] || '#888'
            });
        }

        const rarityOrder = { legendary: 4, epic: 3, rare: 2, common: 1 };
        items.sort((a, b) => (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0));
        return items;
    }
}

window.ItemManager = ItemManager;
