(function(){
  const root = typeof window !== 'undefined' ? window : globalThis;

  const PET_UNLOCK_ITEM_ID = 901;
  const PET_SKILL_ITEM_IDS = {
    attack: 902,
    attackSpeed: 903,
    luck: 904,
    gold: 905,
    exp: 906,
    crit: 907
  };

  const PET_SKILL_DEFS = {
    attack: {
      key: 'attack',
      name: '攻击',
      icon: '⚔️',
      maxLevel: 5,
      values: [0.08, 0.16, 0.24, 0.32, 0.40]
    },
    attackSpeed: {
      key: 'attackSpeed',
      name: '攻速',
      icon: '⚡',
      maxLevel: 5,
      values: [0.08, 0.16, 0.24, 0.32, 0.40]
    },
    luck: {
      key: 'luck',
      name: '幸运',
      icon: '🍀',
      maxLevel: 5,
      values: [1, 2, 3, 4, 5]
    },
    gold: {
      key: 'gold',
      name: '金币',
      icon: '💰',
      maxLevel: 5,
      values: [0.15, 0.30, 0.45, 0.60, 0.75]
    },
    exp: {
      key: 'exp',
      name: '经验',
      icon: '✨',
      maxLevel: 5,
      values: [0.12, 0.24, 0.36, 0.48, 0.60]
    },
    crit: {
      key: 'crit',
      name: '暴击',
      icon: '💥',
      maxLevel: 5,
      values: [0.05, 0.10, 0.15, 0.20, 0.25]
    }
  };

  root.PETS = {
    companion: {
      id: 'companion',
      name: '守护灵宠',
      icon: '🐮',
      color: '#9fd8ff',
      attackRange: 0,
      attackCd: 999
    }
  };

  root.PET_UNLOCK_ITEM_ID = PET_UNLOCK_ITEM_ID;
  root.PET_SKILL_ITEM_IDS = PET_SKILL_ITEM_IDS;
  root.PET_SKILL_DEFS = PET_SKILL_DEFS;

  const ITEMS = root.ITEMS;
  if (ITEMS && typeof ITEMS === 'object') {
    for (const key of Object.keys(ITEMS)) {
      const item = ITEMS[key];
      if (!item || typeof item !== 'object') continue;
      if (item.effect === 'unlockPet' || item.petId) {
        delete ITEMS[key];
      }
    }

    ITEMS[PET_UNLOCK_ITEM_ID] = {
      id: PET_UNLOCK_ITEM_ID,
      name: '灵宠契约',
      icon: '🐮',
      rarity: 'rare',
      unlockFloor: 1,
      effect: 'unlockCompanion',
      desc: '解锁唯一宠物，并开启宠物技能道具池',
      price: 120
    };

    const skillItems = {
      attack: { name: '利爪刻印', icon: '⚔️', rarity: 'common', unlockFloor: 1, desc: '宠物技能：攻击提升一级' },
      attackSpeed: { name: '迅息符', icon: '⚡', rarity: 'common', unlockFloor: 1, desc: '宠物技能：攻速提升一级' },
      luck: { name: '四叶穗', icon: '🍀', rarity: 'rare', unlockFloor: 1, desc: '宠物技能：幸运提升一级' },
      gold: { name: '聚财囊', icon: '💰', rarity: 'common', unlockFloor: 1, desc: '宠物技能：金币收益提升一级' },
      exp: { name: '启智芽', icon: '✨', rarity: 'common', unlockFloor: 1, desc: '宠物技能：经验收益提升一级' },
      crit: { name: '猎心瞳', icon: '💥', rarity: 'rare', unlockFloor: 1, desc: '宠物技能：暴击率提升一级' }
    };

    for (const [key, id] of Object.entries(PET_SKILL_ITEM_IDS)) {
      const meta = skillItems[key];
      ITEMS[id] = {
        id,
        name: meta.name,
        icon: meta.icon,
        rarity: meta.rarity,
        unlockFloor: meta.unlockFloor,
        effect: 'petSkill',
        petSkillKey: key,
        desc: meta.desc,
        price: 90
      };
    }
  }

  if (typeof Game !== 'undefined' && Game.prototype) {
    const originalGetAvailableItemsByFloor = Game.prototype.getAvailableItemsByFloor;
    Game.prototype.getAvailableItemsByFloor = function() {
      const list = typeof originalGetAvailableItemsByFloor === 'function'
        ? originalGetAvailableItemsByFloor.call(this)
        : Object.values(root.ITEMS || {});
      const petMgr = this.petManager;
      return list.filter((item) => {
        if (!item) return false;
        if (item.id === PET_UNLOCK_ITEM_ID) {
          return !(petMgr && petMgr.isUnlocked);
        }
        if (item.effect === 'petSkill') {
          if (!petMgr || !petMgr.isUnlocked) return false;
          return !petMgr.isSkillMaxed(item.petSkillKey);
        }
        return true;
      });
    };

    Game.prototype.spawnFlyingItem = function(startX, startY, targetX, targetY) {
      const availableItems = this.getAvailableItemsByFloor();
      if (!availableItems || availableItems.length === 0) return;
      const item = availableItems[randInt(0, availableItems.length - 1)];
      this.curRoom.items.push({
        x: startX, y: startY,
        targetX, targetY,
        isFlying: true,
        flyTime: 0.5,
        id: item.id, icon: item.icon, name: item.name
      });
    };

    Game.prototype.unlockPet = function() {
      if (!this.petManager) return false;
      const unlockedNow = this.petManager.unlockPet('companion');
      if (unlockedNow && this.damageNumbers && this.player) {
        this.damageNumbers.spawn(this.player.cx, this.player.cy - 60, '+ 守护灵宠', {
          color: '#9fd8ff', size: 16, life: 2
        });
      }
      return unlockedNow;
    };
  }
})();
