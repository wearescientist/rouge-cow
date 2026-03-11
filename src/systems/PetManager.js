class PetManager {
    constructor(game) {
        this.game = game;
        this.pets = []; // 当前出战的宠物
        this.maxPets = 10; // v0.22: 全上！拿到多少上多少
        this.unlockedPets = []; // 已解锁的宠物池
    }
    
    /**
     * 解锁宠物到池子
     */
    unlockPet(petId) {
        if (!this.unlockedPets.includes(petId)) {
            this.unlockedPets.push(petId);
            console.log(`[Pet] 解锁宠物: ${PETS[petId]?.name || petId}`);
        }
    }
    
    /**
     * 添加宠物到出战列表
     * v0.22-fix: 立即设置跟随关系，确保宠物立即可见
     */
    addPet(petId) {
        // 检查是否已存在
        if (this.pets.some(p => p.petId === petId)) {
            return false;
        }
        
        // v0.22: 硬上限检查（防止无限添加导致性能问题）
        if (this.pets.length >= this.maxPets) {
            return false;
        }
        
        // 创建宠物实例，传入当前index
        const index = this.pets.length;
        const pet = new Pet(petId, this.game, index);
        
        // v0.22-fix: 立即设置跟随关系
        if (index === 0) {
            // 第一个宠物跟随玩家
            pet.setLeader(this.game.player);
        } else {
            // 其他宠物跟随前一个宠物
            pet.setLeader(this.pets[index - 1]);
        }
        
        this.pets.push(pet);
        
        // 显示提示
        const cfg = PETS[petId];
        if (cfg && this.game.damageNumbers) {
            this.game.damageNumbers.spawn(
                this.game.player.x, 
                this.game.player.y - 50, 
                `+ ${cfg.name}`,
                { color: cfg.color || '#f8f', size: 14, life: 2 }
            );
        }
        
        return true;
    }
    
    /**
     * 移除指定宠物
     */
    removePet(petId) {
        const idx = this.pets.findIndex(p => p.petId === petId);
        if (idx >= 0) {
            this.pets.splice(idx, 1);
            // 更新剩余宠物的index
            this.pets.forEach((p, i) => p.updateIndex(i));
            return true;
        }
        return false;
    }
    
    /**
     * 更新所有宠物
     * v0.20.0: 设置链式跟随关系
     */
    update(dt, player, enemies) {
        // v0.20.0: 设置链式跟随关系
        // 第一个宠物跟随玩家，第二个跟随第一个，以此类推
        for (let i = 0; i < this.pets.length; i++) {
            const pet = this.pets[i];
            if (i === 0) {
                // 第一个宠物跟随玩家
                pet.setLeader(player);
            } else {
                // 其他宠物跟随前一个宠物
                pet.setLeader(this.pets[i - 1]);
            }
        }
        
        for (const pet of this.pets) {
            pet.update(dt, player, enemies, this.pets);
        }
    }
    
    /**
     * 渲染所有宠物
     */
    render(ctx, camera, sprites) {
        for (const pet of this.pets) {
            pet.render(ctx, camera, sprites);
        }
    }
    
    /**
     * 清空所有宠物
     */
    clear() {
        this.pets = [];
    }
    
    /**
     * 获取宠物数量
     */
    get count() {
        return this.pets.length;
    }

    /**
     * 统计当前出战宠物带来的队伍增益（主辅助，副输出）
     */
    getTeamBonuses() {
        const bonuses = {
            fireRateMul: 0,
            dmgMul: 0,
            critAdd: 0,
            armorAdd: 0,
            goldPerKill: 0
        };

        for (const pet of this.pets) {
            if (!pet || typeof pet.getStaticTeamBonus !== 'function') continue;
            const b = pet.getStaticTeamBonus();
            if (!b) continue;
            bonuses.fireRateMul += b.fireRateMul || 0;
            bonuses.dmgMul += b.dmgMul || 0;
            bonuses.critAdd += b.critAdd || 0;
            bonuses.armorAdd += b.armorAdd || 0;
            bonuses.goldPerKill += b.goldPerKill || 0;
        }

        // 安全上限：避免多宠物叠加导致数值爆炸
        bonuses.fireRateMul = Math.min(0.45, bonuses.fireRateMul);
        bonuses.dmgMul = Math.min(0.35, bonuses.dmgMul);
        bonuses.critAdd = Math.min(0.25, bonuses.critAdd);
        bonuses.armorAdd = Math.min(4, bonuses.armorAdd);
        bonuses.goldPerKill = Math.min(1.5, bonuses.goldPerKill);

        return bonuses;
    }
}




// Export to global
window.PetManager = PetManager;
