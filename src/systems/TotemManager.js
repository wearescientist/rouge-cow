class TotemManager {

    constructor() {

        this.owned = new Set();

        this.load();

    }

    

    load() {

        try {

            const saved = localStorage.getItem('rougecow_totems');

            if (saved) this.owned = new Set(JSON.parse(saved));

        } catch (e) {}

    }

    

    save() {

        try {

            localStorage.setItem('rougecow_totems', JSON.stringify([...this.owned]));

        } catch (e) {}

    }

    

    collect(id) {

        if (this.owned.has(id)) return false;

        this.owned.add(id);

        this.save();

        return true;

    }

    

    has(id) { return this.owned.has(id); }

    getCount() { return this.owned.size; }

    

    getAllBonuses() {

        const bonuses = { dmg: 0, maxHp: 0, speed: 0, exp: 0, gold: 0, regen: 0, crit: 0 };

        for (const id of this.owned) {

            const totem = TOTEMS[id];

            if (totem) bonuses[totem.effect] += totem.value;

        }

        return bonuses;

    }

}



// 房间类


// Export to global
window.TotemManager = TotemManager;
