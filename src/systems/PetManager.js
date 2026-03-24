class PetManager {
    constructor(game) {
        this.game = game;
        this.pet = null;
        this.pets = [];
        this.unlocked = false;
        this.skillLevels = {
            attack: 0,
            attackSpeed: 0,
            luck: 0,
            gold: 0,
            exp: 0,
            crit: 0
        };
        this.petId = 'companion';
    }

    unlockPet(petId = 'companion') {
        this.petId = petId || 'companion';
        const wasUnlocked = this.unlocked;
        this.unlocked = true;
        if (!this.pet && this.game && this.game.player) {
            const pet = new Pet(this.petId, this.game, 0);
            pet.setLeader(this.game.player);
            this.pet = pet;
            this.pets = [pet];
        }
        return !wasUnlocked;
    }

    addPet(petId = 'companion') {
        if (this.pet) return false;
        return this.unlockPet(petId);
    }

    removePet() {
        this.pet = null;
        this.pets = [];
        this.unlocked = false;
        Object.keys(this.skillLevels).forEach((key) => {
            this.skillLevels[key] = 0;
        });
        return true;
    }

    clear() {
        this.removePet();
    }

    get count() {
        return this.pet ? 1 : 0;
    }

    get isUnlocked() {
        return !!this.unlocked;
    }

    getSkillLevel(skillKey) {
        return this.skillLevels[skillKey] || 0;
    }

    isSkillMaxed(skillKey) {
        const def = window.PET_SKILL_DEFS?.[skillKey];
        if (!def) return true;
        return this.getSkillLevel(skillKey) >= (def.maxLevel || 5);
    }

    upgradeSkill(skillKey) {
        if (!this.unlocked) return { ok: false, reason: 'locked' };
        const def = window.PET_SKILL_DEFS?.[skillKey];
        if (!def) return { ok: false, reason: 'invalid' };
        const cur = this.getSkillLevel(skillKey);
        if (cur >= (def.maxLevel || 5)) return { ok: false, reason: 'maxed', level: cur };
        const next = cur + 1;
        this.skillLevels[skillKey] = next;
        return { ok: true, level: next, def };
    }

    getTeamBonuses() {
        const defs = window.PET_SKILL_DEFS || {};
        const read = (key) => {
            const lv = this.getSkillLevel(key);
            const arr = defs[key]?.values || [];
            return lv > 0 ? (arr[lv - 1] ?? 0) : 0;
        };
        return {
            dmgMul: read('attack'),
            fireRateMul: read('attackSpeed'),
            luckAdd: read('luck'),
            goldMul: read('gold'),
            expBonus: read('exp'),
            critAdd: read('crit'),
            armorAdd: 0,
            goldPerKill: 0
        };
    }

    getSkillEntries() {
        const defs = window.PET_SKILL_DEFS || {};
        return ['attack', 'attackSpeed', 'luck', 'gold', 'exp', 'crit'].map((key) => {
            const def = defs[key] || { key, name: key, icon: '·', maxLevel: 5 };
            return {
                key,
                name: def.name,
                icon: def.icon,
                level: this.getSkillLevel(key),
                maxLevel: def.maxLevel || 5,
                unlocked: this.getSkillLevel(key) > 0
            };
        });
    }

    update(dt, player, enemies) {
        if (!this.pet) return;
        this.pet.setLeader(player);
        this.pet.update(dt, player, Array.isArray(enemies) ? enemies : [], this.pets);
    }

    render(ctx, camera, sprites) {
        if (!this.pet) return;
        this.pet.render(ctx, camera, sprites);
    }
}

window.PetManager = PetManager;
