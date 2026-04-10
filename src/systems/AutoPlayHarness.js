(function(global){
  'use strict';

  function nowMs(){
    return (global.performance && typeof global.performance.now === 'function') ? global.performance.now() : Date.now();
  }

  function clamp01(v){ return Math.max(0, Math.min(1, v)); }
  function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }
  function len2(x, y){ return Math.sqrt(x * x + y * y) || 0; }
  function norm(x, y){ const l = len2(x, y); return l > 0.0001 ? { x: x / l, y: y / l } : { x: 0, y: 0 }; }
  function dist(a, b, c, d){ const dx = a - c; const dy = b - d; return Math.sqrt(dx * dx + dy * dy); }
  function hasText(v){ return typeof v === 'string' && v.trim().length > 0; }
  function safeArray(v){ return Array.isArray(v) ? v : []; }

  class AutoPlayHarness {
    constructor(game){
      this.game = game || global.game || null;
      this.enabled = false;
      this.profile = 'balanced';
      this.vector = { x: 0, y: 0 };
      this.lastActionAt = 0;
      this.lastDashAt = 0;
      this.lastStatusAt = 0;
      this.lastInteractionAt = 0;
      this.lastUiResolveAt = 0;
      this.orbitSign = 1;
      this.orbitFlipAt = 0;
      this.benchmark = null;
      this.lastBenchmarkReport = null;
      this.loopHandle = 0;
      this.roomMemory = new Map();
      this.currentIntent = '';
      this.routeLock = null;
      this.travelWaypoint = null;
      this.recentRooms = [];
      this.lastRoomKey = '';
      this.installHooks();
      this.startLoop();
    }

    resolveGamePrototype(){
      const instanceProto = this.game ? Object.getPrototypeOf(this.game) : null;
      if (instanceProto && typeof instanceProto.getMobileMoveVector === 'function') return instanceProto;
      const globalProto = global.game ? Object.getPrototypeOf(global.game) : null;
      if (globalProto && typeof globalProto.getMobileMoveVector === 'function') return globalProto;
      try {
        if (typeof Game !== 'undefined' && Game && Game.prototype && typeof Game.prototype.getMobileMoveVector === 'function') {
          return Game.prototype;
        }
      } catch (err) {}
      return null;
    }

    installHooks(){
      const proto = this.resolveGamePrototype();
      if (!proto || typeof proto.getMobileMoveVector !== 'function') return false;
      if (proto.getMobileMoveVector.__autoPlayWrapped) return true;
      const original = proto.getMobileMoveVector;
      proto.getMobileMoveVector = function(){
        const base = original.apply(this, arguments) || { x: 0, y: 0 };
        const harness = global.autoPlayHarness;
        if (!harness || !harness.enabled) return base;
        if (harness.game !== this) harness.attach(this);
        if (harness.hasManualDirectionalInput(this)) return base;
        const ai = harness.vector || { x: 0, y: 0 };
        const merged = { x: base.x + ai.x, y: base.y + ai.y };
        const l = Math.hypot(merged.x, merged.y);
        return l > 1 ? { x: merged.x / l, y: merged.y / l } : merged;
      };
      proto.getMobileMoveVector.__autoPlayWrapped = true;
      proto.getMobileMoveVector.__autoPlayOriginal = original;
      return true;
    }

    startLoop(){
      if (this.loopHandle) return;
      const tick = () => {
        this.loopHandle = global.requestAnimationFrame(tick);
        this.attach(global.game || this.game || null);
        if (!this.enabled) return;
        this.update();
      };
      this.loopHandle = global.requestAnimationFrame(tick);
    }

    attach(game){
      if (game) this.game = game;
      this.installHooks();
    }

    hasManualDirectionalInput(game){
      if (!game || !game.keys) return false;
      return !!(
        game.keys.w || game.keys.W || game.keys.a || game.keys.A || game.keys.s || game.keys.S ||
        game.keys.d || game.keys.D || game.keys.ArrowUp || game.keys.ArrowDown ||
        game.keys.ArrowLeft || game.keys.ArrowRight
      );
    }

    notify(message, tone = 'info'){
      const game = this.game || global.game;
      if (!game) return;
      if (typeof game.showToast === 'function') {
        game.showToast(message, { tone, duration: 1600 });
      }
      if (game.damageNumbers && game.player) {
        game.damageNumbers.spawn(game.player.cx, game.player.cy - 42, message, {
          color: tone === 'warn' ? '#ffb347' : '#8fe3ff',
          size: 13,
          life: 1.25
        });
      }
    }

    setEnabled(force){
      const next = typeof force === 'boolean' ? force : !this.enabled;
      this.enabled = next;
      this.installHooks();
      if (!next) {
        this.vector = { x: 0, y: 0 };
        this.currentIntent = '';
      }
      return this.enabled;
    }

    toggleAssist(force){
      const enabled = this.setEnabled(force);
      if (!enabled) {
        this.stopBenchmark({ silent: true });
      }
      this.notify(enabled ? 'AI辅助已开启' : 'AI辅助已关闭', enabled ? 'info' : 'warn');
      return enabled;
    }

    stopAll(){
      this.setEnabled(false);
      this.stopBenchmark({ silent: true });
      return true;
    }

    getStatus(){
      const game = this.game || global.game;
      const room = game?.curRoom;
      const enemies = room ? this.getActiveEnemies(room) : [];
      const nearestEnemy = enemies[0] || null;
      const benchmark = this.benchmark ? {
        active: true,
        mode: this.benchmark.mode,
        scenario: this.benchmark.current?.id || this.benchmark.mode,
        progress: clamp01((nowMs() - this.benchmark.startedAt) / Math.max(1, this.benchmark.current?.durationMs || this.benchmark.durationMs || 1)),
        remainingMs: Math.max(0, (this.benchmark.current?.durationMs || this.benchmark.durationMs || 0) - (nowMs() - this.benchmark.startedAt)),
        stepIndex: this.benchmark.index || 0,
        totalSteps: this.benchmark.scenarios ? this.benchmark.scenarios.length : 1,
        lastReportName: this.lastBenchmarkReport?.fileName || ''
      } : null;
      return {
        enabled: this.enabled,
        profile: this.profile,
        roomType: room?.type || '-',
        floor: game?.currentFloor || 0,
        enemyCount: enemies.length,
        nearestEnemy: nearestEnemy ? (nearestEnemy.name || nearestEnemy.typeKey || nearestEnemy.baseId || nearestEnemy.type || 'enemy') : '',
        vector: { ...this.vector },
        currentIntent: this.currentIntent || '',
        benchmark
      };
    }

    getActiveEnemies(room){
      if (!room) return [];
      const list = room.getActiveEnemies ? room.getActiveEnemies() : room.enemies;
      return safeArray(list).filter(e => e && e.hp > 0);
    }

    getItems(){
      try {
        if (global.ITEMS) return global.ITEMS;
        if (typeof ITEMS !== 'undefined') return ITEMS;
      } catch (err) {}
      return {};
    }

    getWeapons(){
      try {
        if (global.WEAPONS) return global.WEAPONS;
        if (typeof WEAPONS !== 'undefined') return WEAPONS;
      } catch (err) {}
      return {};
    }

    getPassives(){
      try {
        if (global.PASSIVES) return global.PASSIVES;
        if (typeof PASSIVES !== 'undefined') return PASSIVES;
      } catch (err) {}
      return {};
    }

    getWeaponEvolutions(){
      try {
        if (global.WEAPON_EVOLUTIONS) return global.WEAPON_EVOLUTIONS;
        if (typeof WEAPON_EVOLUTIONS !== 'undefined') return WEAPON_EVOLUTIONS;
      } catch (err) {}
      return {};
    }

    getRoomMemory(room){
      if (!room) {
        return {
          shopRefreshes: 0,
          purchased: Object.create(null),
          shopDialogueDone: false,
          shopCompleted: false,
          shopCompletedGold: 0,
          shopCompletedAt: 0,
          lastShopToggleAt: 0,
          enteredAt: 0,
          visits: 0,
          lastProgressSignature: '',
          lastProgressAt: 0,
          resolvedAt: 0,
          forceCenterUntil: 0
        };
      }
      const key = room.id || `${room.floor || 0}:${room.type || 'room'}:${room.x || 0}:${room.y || 0}`;
      if (!this.roomMemory.has(key)) {
        this.roomMemory.set(key, {
          shopRefreshes: 0,
          purchased: Object.create(null),
          shopDialogueDone: false,
          shopCompleted: false,
          shopCompletedGold: 0,
          shopCompletedAt: 0,
          lastShopToggleAt: 0,
          enteredAt: 0,
          visits: 0,
          lastProgressSignature: '',
          lastProgressAt: 0,
          resolvedAt: 0,
          forceCenterUntil: 0
        });
      }
      return this.roomMemory.get(key);
    }

    rememberRecentRoom(roomKey){
      if (!roomKey) return;
      if (!Array.isArray(this.recentRooms)) this.recentRooms = [];
      if (this.recentRooms[this.recentRooms.length - 1] === roomKey) return;
      this.recentRooms.push(roomKey);
      if (this.recentRooms.length > 8) this.recentRooms.shift();
    }

    getRouteLock(currentRoom){
      const lock = this.routeLock;
      if (!lock) return null;
      if (lock.expiresAt <= nowMs()) {
        this.routeLock = null;
        return null;
      }
      if (lock.fromKey !== this.getRoomKey(currentRoom)) {
        this.routeLock = null;
        return null;
      }
      const targetDoor = currentRoom?.doors?.[lock.dir];
      if (!targetDoor || !targetDoor.open || !targetDoor.target) {
        this.routeLock = null;
        return null;
      }
      return lock;
    }

    setRouteLock(currentRoom, route, reason = ''){
      if (!route || !route.dir) return;
      this.routeLock = {
        fromKey: this.getRoomKey(currentRoom),
        targetKey: this.getRoomKey(route.finalTarget || route.target),
        dir: route.dir,
        reason,
        expiresAt: nowMs() + 1200
      };
    }

    isCombatRoom(room){
      return !!room && (room.type === 'normal' || room.type === 'elite' || room.type === 'boss');
    }

    getChestTargets(room){
      const chests = [];
      if (Array.isArray(room?.chests)) {
        for (const chest of room.chests) {
          if (!chest || chest.disabled || chest.opened) continue;
          chests.push({ ...chest, kind: 'treasure_chest' });
        }
      }
      if (room?.chest && !room.chest.opened) {
        chests.push({ ...room.chest, kind: room.type === 'hidden' ? 'hidden_chest' : 'chest' });
      }
      return chests;
    }

    getHiddenObjectiveState(game, room, pickups = [], chests = []){
      const floor = this.getHiddenFloor(room, game);
      const progress = this.getHiddenProgress(game, room) || { puzzleState: {} };
      const targetNode = this.chooseHiddenInteractTarget(game, room, progress);
      const orbReady = !!(room?.hiddenOrb && floor !== 6 && (progress.completed || progress.phase === 'awakened' || progress.phase === 'played' || progress.witnessed));
      const pendingCore = floor === 6 ? !!targetNode : (!progress.completed || !!targetNode || (!!orbReady && !progress.witnessed));
      return {
        floor,
        progress,
        targetNode,
        orbReady,
        pending: pendingCore || pickups.length > 0 || chests.length > 0
      };
    }

    getBossAftermathState(game, room, pickups = [], chests = []){
      const aftermath = room?.bossAftermath;
      if (!aftermath?.active) {
        return {
          active: false,
          pending: false,
          needsApproach: false,
          dialogueStarted: false,
          rewardsGranted: false,
          exitsSpawned: false,
          promptTarget: null
        };
      }
      const promptTarget = {
        x: Number.isFinite(aftermath.x) ? aftermath.x : (room?.centerX || 0),
        y: Number.isFinite(aftermath.y) ? aftermath.y : ((room?.centerY || 0) - 40),
        radius: Math.max(24, aftermath.promptRadius || 0)
      };
      const needsApproach = !aftermath.dialogueStarted;
      const waitingRewards = aftermath.dialogueStarted && !aftermath.rewardsGranted;
      const waitingExits = aftermath.rewardsGranted && !aftermath.exitsSpawned;
      return {
        active: true,
        pending: needsApproach || waitingRewards || waitingExits || pickups.length > 0 || chests.length > 0,
        needsApproach,
        dialogueStarted: !!aftermath.dialogueStarted,
        rewardsGranted: !!aftermath.rewardsGranted,
        exitsSpawned: !!aftermath.exitsSpawned,
        promptTarget
      };
    }

    isShopWorthRevisiting(game, room, memory = null){
      if (!room || room.type !== 'shop') return false;
      const mem = memory || this.getRoomMemory(room);
      if (!mem.shopCompleted) return true;
      const playerGold = game?.player?.gold || 0;
      const gainedGold = playerGold - (mem.shopCompletedGold || 0);
      return gainedGold >= 35;
    }

    isShopResolved(game, room){
      if (!room || room.type !== 'shop') return true;
      if (!room.visited) return false;
      const memory = this.getRoomMemory(room);
      return memory.shopCompleted && !this.isShopWorthRevisiting(game, room, memory);
    }

    getRoomState(game, room, options = {}){
      const player = options.player || game?.player || null;
      const pickups = this.getPickups(game, room, player, { keepOrder: true });
      const chests = this.getChestTargets(room);
      const enemies = this.getActiveEnemies(room);
      const combatPending = this.isCombatRoom(room) ? ((room?.cleared !== true) || enemies.length > 0) : enemies.length > 0;
      const hidden = room?.type === 'hidden' ? this.getHiddenObjectiveState(game, room, pickups, chests) : { pending: false, progress: null, targetNode: null, orbReady: false, floor: 0 };
      const aftermath = room?.type === 'boss' ? this.getBossAftermathState(game, room, pickups, chests) : { active: false, pending: false, needsApproach: false, dialogueStarted: false, rewardsGranted: false, exitsSpawned: false, promptTarget: null };
      const shopPending = room?.type === 'shop' ? !this.isShopResolved(game, room) : false;
      const lootPending = pickups.length > 0;
      const chestPending = chests.length > 0;
      const resolved = !combatPending && !lootPending && !chestPending && !hidden.pending && !shopPending && !aftermath.pending;
      return {
        room,
        enemies,
        pickups,
        chests,
        combatPending,
        hidden,
        aftermath,
        shopPending,
        lootPending,
        chestPending,
        resolved,
        lockInRoom: !resolved
      };
    }

    updateRoomStateMemory(game, room, state){
      if (!room || !state) return;
      const memory = this.getRoomMemory(room);
      const progress = room.type === 'hidden' ? (state.hidden.progress || { puzzleState: {} }) : null;
      const puzzle = progress?.puzzleState || {};
      const signature = JSON.stringify({
        cleared: !!room.cleared,
        enemies: state.enemies.length,
        pickups: state.pickups.length,
        chests: state.chests.length,
        shopPending: state.shopPending,
        hiddenPending: state.hidden.pending,
        aftermathPending: state.aftermath?.pending,
        aftermathDialogueStarted: !!state.aftermath?.dialogueStarted,
        aftermathRewardsGranted: !!state.aftermath?.rewardsGranted,
        aftermathExitsSpawned: !!state.aftermath?.exitsSpawned,
        hiddenStage: puzzle.stage || puzzle.phase || '',
        hiddenCompleted: !!progress?.completed,
        witnessed: !!progress?.witnessed,
        inputIndex: puzzle.inputIndex || 0,
        litCount: safeArray(puzzle.litNodeIds).length,
        blockedCount: Object.keys(puzzle.blocked || {}).length
      });
      const stamp = nowMs();
      if (memory.lastProgressSignature !== signature) {
        memory.lastProgressSignature = signature;
        memory.lastProgressAt = stamp;
        memory.forceCenterUntil = 0;
      } else if (room.type === 'hidden' && state.lockInRoom && stamp - (memory.lastProgressAt || 0) > 4200) {
        memory.forceCenterUntil = Math.max(memory.forceCenterUntil || 0, stamp + 950);
        memory.lastProgressAt = stamp - 2600;
      }
      if (state.resolved) {
        memory.resolvedAt = stamp;
      }
    }

    hasReachableBossRoom(game, currentRoom){
      const graph = this.collectReachableRooms(currentRoom);
      for (const room of graph.roomByKey.values()) {
        if (this.isBossRoom(room)) return true;
      }
      return false;
    }


    getPlayerPos(player){
      return {
        x: Number.isFinite(player?.cx) ? player.cx : (player?.x || 0),
        y: Number.isFinite(player?.cy) ? player.cy : (player?.y || 0)
      };
    }

    getEntityPos(entity){
      return {
        x: Number.isFinite(entity?.cx) ? entity.cx : (entity?.x || 0),
        y: Number.isFinite(entity?.cy) ? entity.cy : (entity?.y || 0)
      };
    }

    isLowHealth(game){
      const hp = game?.player?.hp || 0;
      const maxHp = Math.max(1, game?.player?.maxHp || 1);
      return hp / maxHp <= 0.55;
    }

    getOwnedBaseWeaponCount(game){
      return safeArray(game?.weapons).filter(w => w && !w.isSuper).length;
    }

    getCurrentRoomGoldNeed(game){
      if (!game?.player) return 0;
      const lowHp = this.isLowHealth(game);
      const base = lowHp ? 85 : 120;
      return Math.max(40, base - (game.player.gold || 0));
    }

    getHiddenFloor(room, game){
      return room?.hiddenRoomFloor || game?.currentFloor || room?.floor || 0;
    }

    getHiddenProgress(game, room){
      const floor = this.getHiddenFloor(room, game);
      if (!floor) return null;
      try {
        if (typeof game?.ensureHiddenRoomSetup === 'function') game.ensureHiddenRoomSetup(room);
      } catch (err) {}
      try {
        if (typeof game?.getHiddenRoomProgress === 'function') return game.getHiddenRoomProgress(floor);
      } catch (err) {}
      return room?.hiddenPuzzleState ? { puzzleState: room.hiddenPuzzleState } : null;
    }

    update(){
      const game = this.game || global.game;
      if (!game || game.state !== 'playing') {
        this.vector = { x: 0, y: 0 };
        this.currentIntent = '';
        return;
      }

      if (this.handleUi(game)) {
        this.vector = { x: 0, y: 0 };
        this.updateBenchmark();
        return;
      }

      if (game.paused || game.transition?.active || game.showResultScreen) {
        this.vector = { x: 0, y: 0 };
        this.currentIntent = '';
        this.updateBenchmark();
        return;
      }

      const room = game.curRoom;
      if (!room || !game.player) {
        this.vector = { x: 0, y: 0 };
        this.currentIntent = '';
        this.updateBenchmark();
        return;
      }

      const roomKey = this.getRoomKey(room);
      if (this.lastRoomKey !== roomKey) {
        this.lastRoomKey = roomKey;
        this.noteRoomEntry(room);
      }

      this.vector = this.computeMoveVector(game, room);
      this.handleActions(game, room);
      this.updateBenchmark();
    }

    chooseBestIndex(options, scorer){
      if (!Array.isArray(options) || options.length <= 0 || typeof scorer !== 'function') return -1;
      let bestIndex = -1;
      let bestScore = -Infinity;
      for (let i = 0; i < options.length; i++) {
        const score = Number(scorer(options[i], i));
        if (score > bestScore) {
          bestScore = score;
          bestIndex = i;
        }
      }
      return bestIndex;
    }

    scoreWeaponType(type){
      const table = {
        instant: 24,
        orbit: 22,
        area: 19,
        proj: 17,
        aura: 16,
        melee: 11
      };
      return table[type] || 12;
    }

    scoreWeaponOption(game, option){
      if (!option) return -Infinity;
      const weapons = this.getWeapons();
      const data = option.data || weapons[option.key] || {};
      const currentCount = this.getOwnedBaseWeaponCount(game);
      let score = 0;
      if (option.isNew) {
        score += currentCount < 4 ? 88 : (currentCount < 6 ? 62 : 18);
        score += this.scoreWeaponType(data.type);
      } else {
        score += 96;
        score += Math.min(42, (option.level || 1) * 7);
        score += this.scoreWeaponType(data.type) * 0.8;
        if ((option.level || 1) >= 8) score += 18;
      }
      if (hasText(data.desc) && /穿透|连锁|冻结|爆炸|范围|环绕|追踪|雷暴/i.test(data.desc)) score += 10;
      if (hasText(data.name) && /闪电|冰|火|雷|风暴|圣/i.test(data.name)) score += 6;
      return score;
    }

    scorePassiveOption(game, option){
      if (!option) return -Infinity;
      const passives = this.getPassives();
      const data = option.data || passives[option.key] || {};
      const effect = data.effect || '';
      const lowHp = this.isLowHealth(game);
      let score = 42;
      const base = {
        dmg: 56,
        damage: 56,
        fireRate: 54,
        fireRateMult: 54,
        speed: 18,
        crit: 32,
        critAdd: 32,
        maxHp: lowHp ? 60 : 34,
        maxHpAdd: lowHp ? 60 : 34,
        armor: lowHp ? 48 : 28,
        armorAdd: lowHp ? 48 : 28,
        projCount: 64,
        projCountAdd: 64,
        duration: 26,
        range: 24,
        luck: 18,
        luckAdd: 18,
        expBonus: 14,
        goldBonus: 10
      };
      if (base[effect] !== undefined) score += base[effect];
      if (option.superInfo?.owned) score += 18;
      if (option.superInfo?.canEvolve) score += 54;
      if (hasText(option.superInfo?.superName)) score += 8;
      if (hasText(data.desc) && /攻速|伤害|暴击|弹体|数量|进化|冷却/i.test(data.desc)) score += 10;
      return score;
    }

    scoreLevelUpOption(game, option){
      if (!option) return -Infinity;
      if (option.type === 'weapon') return this.scoreWeaponOption(game, option);
      if (option.type === 'passive') return this.scorePassiveOption(game, option);
      return 0;
    }

    scoreTreasureReward(game, reward){
      if (!reward) return -Infinity;
      const tierBonus = { common: 0, rare: 22, legendary: 54 };
      const weapons = this.getOwnedBaseWeaponCount(game);
      let score = tierBonus[reward.tier] || 0;
      if (reward.rewardType === 'item') {
        const count = safeArray(reward.rewards).length || reward.count || 1;
        score += 96 + count * 34;
        if (count <= 0) score -= 26;
      } else if (reward.rewardType === 'weapon') {
        const count = reward.count || 1;
        score += (weapons < 6 ? 90 : 64) + count * (weapons < 4 ? 30 : 22);
      } else if (reward.rewardType === 'gold') {
        const goldNeed = this.getCurrentRoomGoldNeed(game);
        score += Math.min(110, (reward.value || 0) * ((game?.player?.gold || 0) < goldNeed ? 0.9 : 0.62));
      } else {
        score += Math.min(96, (reward.value || 0) * 0.7);
      }
      return score;
    }

    scoreShopItem(game, item){
      if (!item || item.sold) return -Infinity;
      const items = this.getItems();
      const def = items[item.id] || item;
      const effect = def.effect || '';
      const lowHp = this.isLowHealth(game);
      const ownedWeapons = this.getOwnedBaseWeaponCount(game);
      let score = 32;
      switch (effect) {
        case 'dmgMult': score += 86 + (def.value || 0) * 260; break;
        case 'fireRateMult': score += 80 + (def.value || 0) * 240; break;
        case 'projCountAdd': score += 104 + (def.value || 0) * 140; break;
        case 'critAdd': score += 56 + (def.value || 0) * 120; break;
        case 'maxHpAdd': score += lowHp ? 92 : 58; break;
        case 'armorAdd': score += lowHp ? 84 : 52; break;
        case 'speedMult': score += 26 + (def.value || 0) * 100; break;
        case 'luckAdd': score += 22 + (def.value || 0) * 70; break;
        case 'goldBonusMult': score += 16 + (def.value || 0) * 50; break;
        case 'expBonusAdd': score += 18 + (def.value || 0) * 44; break;
        case 'unlockCompanion': score += 108; break;
        case 'petSkill': score += 64; break;
        case 'freebie': score += 138; break;
        case 'halfCoupon': score += 118; break;
        case 'glassCannon': score += (game?.player?.maxHp || 0) >= 9 ? 72 : 20; break;
        case 'brittleBonePact': score += lowHp ? 6 : 18; break;
        case 'blackContract': score += 16; break;
        default:
          score += 44;
          break;
      }
      if (hasText(def.desc) && /伤害|攻速|暴击|弹体|护甲|生命|免费|折扣/i.test(def.desc)) score += 8;
      if (ownedWeapons < 3 && /projCountAdd|dmgMult|fireRateMult/.test(effect)) score += 8;
      const rarityBonus = {
        common: 0,
        uncommon: 6,
        rare: 14,
        epic: 26,
        legendary: 42,
        cursed: -8,
        mythic: 50
      };
      score += rarityBonus[item.rarity] || 0;
      return score;
    }

    chooseShopAction(game){
      const room = game?.curRoom;
      const memory = this.getRoomMemory(room);
      const items = safeArray(game?.shopItems).filter(Boolean);
      const playerGold = game?.player?.gold || 0;
      const itemStats = game?.items?.getStats?.() || {};
      const firstFree = !!(itemStats.shopFirstFree && room && !room.shopFirstFreeUsed);
      const preBossSpend = room?.type === 'shop' && !this.hasPendingOrdinaryRooms(game, room) && this.hasReachableBossRoom(game, room);
      const reserveGold = preBossSpend ? 0 : (this.isLowHealth(game) ? 18 : 28);
      const affordable = items
        .map((item, index) => ({ item, index, price: firstFree ? 0 : (item.price || 0), score: this.scoreShopItem(game, item) }))
        .filter(entry => !entry.item.sold && playerGold >= entry.price)
        .sort((a, b) => {
          const aValue = a.score + a.score / Math.max(18, a.price + 12) * 28;
          const bValue = b.score + b.score / Math.max(18, b.price + 12) * 28;
          return bValue - aValue;
        });

      const buyThreshold = preBossSpend ? 20 : 54;
      if (affordable.length > 0) {
        const best = affordable[0];
        const canAffordReserve = playerGold - best.price >= reserveGold || best.price <= 0;
        if ((best.score >= buyThreshold || (firstFree && best.score >= 18)) && canAffordReserve) {
          return { type: 'buy', index: best.index };
        }
      }

      const refreshBase = 16 + Math.max(0, (game?.currentFloor || 1) - 1) * 4;
      const refreshPrice = refreshBase * Math.pow(2, game?.shopRefreshCount || 0);
      const maxRefreshes = preBossSpend ? 6 : 4;
      const unsoldEntries = items.filter(item => !item?.sold);
      const bestUnsoldScore = unsoldEntries.reduce((best, item) => Math.max(best, this.scoreShopItem(game, item)), -Infinity);
      if (
        typeof game?.refreshShop === 'function' &&
        memory.shopRefreshes < maxRefreshes &&
        playerGold >= refreshPrice &&
        playerGold - refreshPrice >= Math.max(0, reserveGold - 8) &&
        unsoldEntries.length >= 1 &&
        (affordable.length === 0 || bestUnsoldScore < buyThreshold)
      ) {
        return { type: 'refresh' };
      }

      return { type: 'close' };
    }


    handleUi(game){
      const stamp = nowMs();
      if (stamp - this.lastUiResolveAt < 120) return false;
      const choose = (fn) => {
        this.lastUiResolveAt = stamp;
        try { fn(); } catch (err) { console.warn('[AutoPlayHarness] ui action failed', err); }
        return true;
      };

      if (global.shopNPCSystem?.isTalking) {
        const room = game?.curRoom;
        if (room?.type === 'shop') {
          const memory = this.getRoomMemory(room);
          memory.shopDialogueDone = true;
        }
        return choose(() => global.shopNPCSystem.skipLine?.());
      }
      if (game.bossChestLottery?.active) {
        if (game.bossChestLottery.phase === 'done') return choose(() => game.closeBossChestLottery?.());
        return true;
      }
      if (game.levelUpOpen && Array.isArray(game.levelUpOptions) && game.levelUpOptions.length) {
        const index = this.chooseBestIndex(game.levelUpOptions, option => this.scoreLevelUpOption(game, option));
        return choose(() => game.selectLevelUpOption?.(index >= 0 ? index : 0));
      }
      if (game.chestOpen && Array.isArray(game.chestItems) && game.chestItems.length) {
        if (typeof game.isChestRolling === 'function' && game.isChestRolling()) return true;
        const index = this.chooseBestIndex(game.chestItems, reward => this.scoreTreasureReward(game, reward));
        return choose(() => game.selectChestItem?.(index >= 0 ? index : 0));
      }
      if (game.weaponBoxOpen && Array.isArray(game.weaponBoxOptions) && game.weaponBoxOptions.length) {
        const index = this.chooseBestIndex(game.weaponBoxOptions, option => this.scoreWeaponOption(game, option));
        return choose(() => game.selectWeaponBoxOption?.(index >= 0 ? index : 0));
      }
      if (game.shopOpen) {
        const action = this.chooseShopAction(game);
        return choose(() => {
          const memory = this.getRoomMemory(game.curRoom);
          if (action.type === 'buy') {
            const item = game.shopItems?.[action.index];
            if (item) memory.purchased[item.id] = (memory.purchased[item.id] || 0) + 1;
            memory.shopCompleted = false;
            game.buyItem?.(action.index);
            return;
          }
          if (action.type === 'refresh') {
            memory.shopRefreshes += 1;
            memory.shopCompleted = false;
            game.refreshShop?.();
            return;
          }
          memory.shopCompleted = true;
          memory.shopCompletedGold = game?.player?.gold || 0;
          memory.shopCompletedAt = stamp;
          memory.lastShopToggleAt = stamp;
          game.closeShop?.();
        });
      }
      return false;
    }

    computeMoveVector(game, room){
      const player = game.player;
      const state = this.getRoomState(game, room, { player });
      this.updateRoomStateMemory(game, room, state);
      const enemies = state.enemies;
      const pickups = state.pickups;
      const centerTarget = { x: room.centerX || this.getPlayerPos(player).x, y: room.centerY || this.getPlayerPos(player).y };
      const memory = this.getRoomMemory(room);

      if (room.type === 'hidden' && (state.hidden.pending || state.chests.length || pickups.length)) {
        if ((memory.forceCenterUntil || 0) > nowMs()) {
          this.currentIntent = 'hidden.recenter';
          return this.seekTarget(player, {
            x: room.centerX || centerTarget.x,
            y: (room.centerY || centerTarget.y) + Math.max(58, (room.height || 600) * 0.12)
          }, 16);
        }
        const hiddenMove = this.computeHiddenRoomVector(game, room, pickups);
        if (hiddenMove) return hiddenMove;
      }

      if (state.combatPending) {
        if (enemies.length) {
          const target = this.chooseCombatTarget(player, enemies, room);
          this.currentIntent = `combat.${target?.typeKey || target?.name || 'enemy'}`;
          return this.computeCombatVector(game, player, target, enemies, room);
        }
        this.currentIntent = 'combat.wait';
        return this.seekTarget(player, centerTarget, 24);
      }

      if (state.aftermath?.pending && !state.lootPending && !state.chestPending) {
        if (state.aftermath.needsApproach && state.aftermath.promptTarget) {
          this.currentIntent = 'boss.aftermath.approach';
          return this.seekTarget(player, state.aftermath.promptTarget, Math.max(20, state.aftermath.promptTarget.radius - 18));
        }
        this.currentIntent = state.aftermath.rewardsGranted ? 'boss.aftermath.wait_exit' : 'boss.aftermath.wait_dialogue';
        return this.seekTarget(player, state.aftermath.promptTarget || centerTarget, 18);
      }

      if (state.chests.length) {
        const playerPos = this.getPlayerPos(player);
        const chestTarget = this.getBestChestTarget(state.chests, playerPos.x, playerPos.y);
        this.currentIntent = `interact.${chestTarget?.kind || 'chest'}`;
        return this.seekTargetAdaptive(player, room, chestTarget || centerTarget, 36, this.currentIntent);
      }

      if (pickups.length) {
        this.currentIntent = `pickup.${pickups[0].kind || 'drop'}`;
        return this.seekTargetAdaptive(player, room, pickups[0], pickups[0].kind === 'heart' ? 10 : 12, this.currentIntent);
      }

      if (room.type === 'shop' && room.npc) {
        if (this.shouldVisitShopNow(game, room) && state.shopPending && !game.shopOpen && !global.shopNPCSystem?.isTalking) {
          this.currentIntent = memory.shopDialogueDone ? 'shop.trade' : 'shop.talk';
          return this.seekTargetAdaptive(player, room, room.npc, 56, this.currentIntent);
        }
      }

      const doorTarget = this.chooseDoorTarget(game, room, player);
      if (doorTarget) {
        this.currentIntent = `door.${doorTarget.finalTarget?.type || doorTarget.target?.type || 'room'}`;
        return this.seekTargetAdaptive(player, room, doorTarget.pos, 14, this.currentIntent);
      }

      this.currentIntent = 'room.center';
      return this.seekTarget(player, centerTarget, 16);
    }


    getPickups(game, room, player, options = {}){
      const anchor = player ? this.getPlayerPos(player) : { x: room?.centerX || 0, y: room?.centerY || 0 };
      const list = [];
      if (Array.isArray(room?.gems)) {
        list.push(...room.gems.filter(Boolean).map(g => ({ x: g.x, y: g.y, kind: 'gem', value: g.v || 1 })));
      }
      if (Array.isArray(room?.goldDrops)) {
        list.push(...room.goldDrops.filter(Boolean).map(g => ({ x: g.x, y: g.y, kind: 'gold', value: g.v || g.value || 1 })));
      }
      if (Array.isArray(room?.items)) {
        list.push(...room.items.filter(Boolean).map(i => ({
          x: i.x,
          y: i.y,
          kind: i.type || (i.id ? 'item' : 'drop'),
          id: i.id,
          name: i.name,
          value: 1
        })));
      }

      const lowHp = this.isLowHealth(game);
      list.sort((a, b) => {
        const scoreA = this.getPickupPriority(a, lowHp) - dist(anchor.x, anchor.y, a.x, a.y) * 0.08;
        const scoreB = this.getPickupPriority(b, lowHp) - dist(anchor.x, anchor.y, b.x, b.y) * 0.08;
        return scoreB - scoreA;
      });
      return list;
    }


    getPickupPriority(pickup, lowHp = false){
      const table = {
        heart: lowHp ? 200 : 42,
        item: 165,
        weapon_box: 158,
        weapon: 154,
        ending_gate: 190,
        stairs: 186,
        gold: 54,
        gem: 50,
        drop: 36
      };
      return table[pickup?.kind] || 40;
    }

    chooseCombatTarget(player, enemies, room = null){
      const playerPos = this.getPlayerPos(player);
      const bullets = safeArray(room?.enemyBullets);
      const sorted = enemies.slice().sort((a, b) => {
        const pa = this.getEntityPos(a);
        const pb = this.getEntityPos(b);
        const da = dist(playerPos.x, playerPos.y, pa.x, pa.y);
        const db = dist(playerPos.x, playerPos.y, pb.x, pb.y);
        const bulletNearA = bullets.some(bullet => bullet && dist(pa.x, pa.y, bullet.x || 0, bullet.y || 0) < 88) ? 18 : 0;
        const bulletNearB = bullets.some(bullet => bullet && dist(pb.x, pb.y, bullet.x || 0, bullet.y || 0) < 88) ? 18 : 0;
        const scoreA = da - ((a.tier || 1) * 28) - (a.isBoss ? 92 : 0) - bulletNearA;
        const scoreB = db - ((b.tier || 1) * 28) - (b.isBoss ? 92 : 0) - bulletNearB;
        return scoreA - scoreB;
      });
      return sorted[0] || null;
    }


    computeCombatVector(game, player, target, enemies, room){
      if (!target) return { x: 0, y: 0 };
      const playerPos = this.getPlayerPos(player);
      const targetPos = this.getEntityPos(target);
      const px = playerPos.x;
      const py = playerPos.y;
      const tx = targetPos.x;
      const ty = targetPos.y;
      const d = dist(px, py, tx, ty);
      const bossLike = !!target.isBoss || (target.tier || 1) >= 4 || room.type === 'boss';
      const enemyPressure = Math.min(1, enemies.length / 8);
      const bulletPressure = Math.min(1, safeArray(room?.enemyBullets).length / 24);
      const desiredRange = bossLike
        ? (258 + enemyPressure * 44 + bulletPressure * 42)
        : ((target.tier || 1) >= 3 ? (212 + enemyPressure * 34 + bulletPressure * 30) : (176 + enemyPressure * 36 + bulletPressure * 28));
      const toward = norm(tx - px, ty - py);
      const away = norm(px - tx, py - ty);
      if (nowMs() > this.orbitFlipAt) {
        this.orbitSign *= -1;
        this.orbitFlipAt = nowMs() + 1700 + Math.random() * 900;
      }
      const strafe = { x: -toward.y * this.orbitSign, y: toward.x * this.orbitSign };
      let vx = 0;
      let vy = 0;

      if (d > desiredRange + 34) {
        vx += toward.x * 0.68;
        vy += toward.y * 0.68;
      } else if (d < desiredRange - 26) {
        vx += away.x * 1.42;
        vy += away.y * 1.42;
      }

      vx += strafe.x * (bossLike ? 0.96 : (0.66 + enemyPressure * 0.12));
      vy += strafe.y * (bossLike ? 0.96 : (0.66 + enemyPressure * 0.12));

      if (d < desiredRange * 0.78) {
        const push = (desiredRange * 0.78 - d) / Math.max(1, desiredRange * 0.78);
        vx += away.x * push * 1.38;
        vy += away.y * push * 1.38;
      }

      const repel = this.computeEnemyRepel(px, py, enemies, target, desiredRange);
      const projectileRepel = this.computeProjectileRepel(px, py, safeArray(room?.enemyBullets));
      vx += repel.x + projectileRepel.x;
      vy += repel.y + projectileRepel.y;

      const centerPull = norm((room.centerX || px) - px, (room.centerY || py) - py);
      vx += centerPull.x * (bossLike ? 0.18 : 0.12);
      vy += centerPull.y * (bossLike ? 0.18 : 0.12);

      const wall = this.computeWallAvoid(room, player, desiredRange >= 220 ? 156 : 142);
      vx += wall.x;
      vy += wall.y;

      const move = norm(vx, vy);
      const crowding = len2(repel.x + projectileRepel.x, repel.y + projectileRepel.y);
      if (
        player.dashCooldown <= 0 &&
        !player.isDashing &&
        nowMs() - this.lastDashAt > (bossLike ? 980 : 1220) &&
        (d < (bossLike ? 142 : 104) || crowding > 1.05)
      ) {
        this.lastDashAt = nowMs();
        game.pressMobileAction?.(' ');
      }
      return move;
    }


    computeEnemyRepel(px, py, enemies, focusTarget, desiredRange = 160){
      let rx = 0;
      let ry = 0;
      const innerRange = Math.max(128, desiredRange * 0.78);
      const outerRange = Math.max(148, desiredRange * 0.95);
      for (const enemy of enemies) {
        if (!enemy) continue;
        const pos = this.getEntityPos(enemy);
        const d = dist(px, py, pos.x, pos.y);
        if (d <= 0.001 || d > outerRange) continue;
        const forceBase = enemy === focusTarget ? 0.8 : 1.25;
        const force = (outerRange - d) / outerRange;
        const innerBoost = d < innerRange ? (innerRange - d) / innerRange : 0;
        rx += (px - pos.x) / d * force * forceBase * (1 + innerBoost * 1.1);
        ry += (py - pos.y) / d * force * forceBase * (1 + innerBoost * 1.1);
      }
      return { x: rx, y: ry };
    }

    computeProjectileRepel(px, py, bullets){
      let rx = 0;
      let ry = 0;
      for (const bullet of safeArray(bullets)) {
        if (!bullet) continue;
        const bx = Number.isFinite(bullet.cx) ? bullet.cx : (Number.isFinite(bullet.x) ? bullet.x : 0);
        const by = Number.isFinite(bullet.cy) ? bullet.cy : (Number.isFinite(bullet.y) ? bullet.y : 0);
        const d = dist(px, py, bx, by);
        if (d <= 0.001 || d > 184) continue;
        const force = (184 - d) / 184;
        rx += (px - bx) / d * force * 1.55;
        ry += (py - by) / d * force * 1.55;
      }
      return { x: rx, y: ry };
    }


    computeWallAvoid(room, player, marginOverride = null){
      const margin = marginOverride || 110;
      const pos = this.getPlayerPos(player);
      const left = pos.x;
      const right = (room.width || 900) - pos.x;
      const top = pos.y;
      const bottom = (room.height || 600) - pos.y;
      let vx = 0;
      let vy = 0;
      if (left < margin) vx += (margin - left) / margin * 1.34;
      if (right < margin) vx -= (margin - right) / margin * 1.34;
      if (top < margin) vy += (margin - top) / margin * 1.26;
      if (bottom < margin) vy -= (margin - bottom) / margin * 1.26;
      return { x: vx, y: vy };
    }


    seekTarget(player, target, minRange){
      const playerPos = this.getPlayerPos(player);
      const tx = target.x;
      const ty = target.y;
      const d = dist(playerPos.x, playerPos.y, tx, ty);
      if (d <= (minRange || 10)) return { x: 0, y: 0 };
      return norm(tx - playerPos.x, ty - playerPos.y);
    }

    getRoomKey(room){
      if (!room) return '';
      return room.id || `${room.floor || 0}:${room.type || 'room'}:${room.x || 0}:${room.y || 0}`;
    }

    noteRoomEntry(room){
      if (!room) return;
      const memory = this.getRoomMemory(room);
      memory.enteredAt = nowMs();
      memory.visits = (memory.visits || 0) + 1;
      room.visited = true;
      this.routeLock = null;
      this.travelWaypoint = null;
      this.rememberRecentRoom(this.getRoomKey(room));
    }

    getTravelWaypoint(player, room, target, minRange = 10, intentKey = ''){
      if (!player || !room || !target) return target;
      const playerPos = this.getPlayerPos(player);
      const dx = target.x - playerPos.x;
      const dy = target.y - playerPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy) || 0;
      if (distance < 150) {
        this.travelWaypoint = null;
        return target;
      }
      const roomKey = this.getRoomKey(room);
      const targetKey = `${Math.round(target.x)}:${Math.round(target.y)}`;
      const active = this.travelWaypoint;
      if (active && active.roomKey === roomKey && active.intentKey === intentKey && active.targetKey === targetKey) {
        const waypointDistance = dist(playerPos.x, playerPos.y, active.x, active.y);
        if (waypointDistance > Math.max(20, minRange + 8)) {
          return { x: active.x, y: active.y };
        }
      }
      const tangent = norm(-dy, dx);
      const wiggle = (Math.random() * 2 - 1) * Math.min(84, Math.max(28, distance * 0.18));
      const forward = 0.34 + Math.random() * 0.16;
      const margin = 88;
      const waypoint = {
        x: Math.max(margin, Math.min((room.width || 900) - margin, playerPos.x + dx * forward + tangent.x * wiggle)),
        y: Math.max(margin, Math.min((room.height || 600) - margin, playerPos.y + dy * forward + tangent.y * wiggle))
      };
      this.travelWaypoint = { roomKey, intentKey, targetKey, x: waypoint.x, y: waypoint.y };
      return waypoint;
    }

    seekTargetAdaptive(player, room, target, minRange, intentKey = ''){
      if (!player || !target) return { x: 0, y: 0 };
      const actualTarget = this.getTravelWaypoint(player, room, target, minRange, intentKey);
      return this.seekTarget(player, actualTarget, minRange);
    }


    collectReachableRooms(startRoom){
      const startKey = this.getRoomKey(startRoom);
      if (!startRoom || !startKey) {
        return { startKey: '', parent: new Map(), viaDir: new Map(), roomByKey: new Map(), depth: new Map() };
      }
      const parent = new Map([[startKey, null]]);
      const viaDir = new Map();
      const roomByKey = new Map([[startKey, startRoom]]);
      const depth = new Map([[startKey, 0]]);
      const queue = [startRoom];
      while (queue.length) {
        const room = queue.shift();
        const roomKey = this.getRoomKey(room);
        const baseDepth = depth.get(roomKey) || 0;
        for (const [dir, door] of Object.entries(room?.doors || {})) {
          const target = door?.target;
          if (!target) continue;
          const key = this.getRoomKey(target);
          if (!key || parent.has(key)) continue;
          parent.set(key, roomKey);
          viaDir.set(key, dir);
          roomByKey.set(key, target);
          depth.set(key, baseDepth + 1);
          queue.push(target);
        }
      }
      return { startKey, parent, viaDir, roomByKey, depth };
    }

    buildRouteInfo(graph, targetKey, currentRoom){
      if (!graph || !targetKey || !graph.parent.has(targetKey)) return null;
      const startKey = graph.startKey;
      let cursor = targetKey;
      while (graph.parent.get(cursor) && graph.parent.get(cursor) !== startKey) {
        cursor = graph.parent.get(cursor);
      }
      const firstStepKey = cursor;
      const dir = graph.viaDir.get(firstStepKey);
      if (!dir) return null;
      const room = currentRoom;
      const roomW = room?.width || 900;
      const roomH = room?.height || 600;
      const wallT = 60;
      const doorTargetPos = {
        up: { x: roomW * 0.5, y: wallT + 18 },
        down: { x: roomW * 0.5, y: roomH - wallT - 18 },
        left: { x: wallT + 18, y: roomH * 0.5 },
        right: { x: roomW - wallT - 18, y: roomH * 0.5 }
      };
      return {
        dir,
        pos: doorTargetPos[dir] || { x: room.centerX || roomW * 0.5, y: room.centerY || roomH * 0.5 },
        target: graph.roomByKey.get(firstStepKey) || null,
        finalTarget: graph.roomByKey.get(targetKey) || null,
        distance: graph.depth.get(targetKey) || 0
      };
    }

    isBossRoom(room){
      return !!room && room.type === 'boss';
    }

    isShopRoom(room){
      return !!room && room.type === 'shop';
    }

    isOrdinaryProgressRoom(room){
      if (!room) return false;
      return room.type !== 'boss' && room.type !== 'shop' && room.type !== 'start';
    }

    isProgressRoomResolved(game, room){
      if (!room) return true;
      if (!this.isOrdinaryProgressRoom(room)) return true;
      if (!room.visited) return false;
      return this.getRoomState(game, room).resolved;
    }

    canVisitBossNow(game, currentRoom){
      if (!currentRoom) return false;
      if (this.hasPendingOrdinaryRooms(game, currentRoom)) return false;
      if (this.hasPendingShop(game, currentRoom)) return false;
      return true;
    }

    hasPendingOrdinaryRooms(game, currentRoom){
      const graph = this.collectReachableRooms(currentRoom);
      for (const [key, room] of graph.roomByKey.entries()) {
        if (key === graph.startKey) continue;
        if (!this.isOrdinaryProgressRoom(room)) continue;
        if (!this.isProgressRoomResolved(game, room)) return true;
      }
      return false;
    }


    hasPendingShop(game, currentRoom){
      const graph = this.collectReachableRooms(currentRoom);
      for (const [key, room] of graph.roomByKey.entries()) {
        if (!this.isShopRoom(room)) continue;
        if (!this.isShopResolved(game, room)) return true;
      }
      return false;
    }


    shouldVisitShopNow(game, currentRoom){
      if (!currentRoom) return false;
      if (this.hasPendingOrdinaryRooms(game, currentRoom)) return false;
      return this.hasPendingShop(game, currentRoom);
    }


    findRouteToRoom(game, currentRoom, predicate, scorer){
      const graph = this.collectReachableRooms(currentRoom);
      const currentKey = graph.startKey;
      const candidates = [];
      for (const [key, room] of graph.roomByKey.entries()) {
        if (key === currentKey) continue;
        if (!predicate(room, key, graph)) continue;
        const route = this.buildRouteInfo(graph, key, currentRoom);
        if (!route) continue;
        const score = typeof scorer === 'function' ? scorer(room, route, key, graph) : 0;
        candidates.push({ room, route, score, key });
      }
      candidates.sort((a, b) => b.score - a.score || a.route.distance - b.route.distance);
      return candidates[0]?.route || null;
    }

    chooseDoorTarget(game, room, player){
      const roomW = room.width || 900;
      const roomH = room.height || 600;
      const wallT = 60;
      const doorTargetPos = {
        up: { x: roomW * 0.5, y: wallT + 18 },
        down: { x: roomW * 0.5, y: roomH - wallT - 18 },
        left: { x: wallT + 18, y: roomH * 0.5 },
        right: { x: roomW - wallT - 18, y: roomH * 0.5 }
      };
      const entries = Object.entries(room?.doors || {}).filter(([, door]) => door && door.open && door.target);
      if (!entries.length) return null;
      const currentKey = this.getRoomKey(room);
      const playerPos = this.getPlayerPos(player);

      const lock = this.getRouteLock(room);
      if (lock) {
        const target = room?.doors?.[lock.dir]?.target || null;
        return {
          dir: lock.dir,
          pos: doorTargetPos[lock.dir] || { x: room.centerX || roomW * 0.5, y: room.centerY || roomH * 0.5 },
          target,
          finalTarget: target,
          distance: 1
        };
      }

      const ordinaryRoute = this.findRouteToRoom(
        game,
        room,
        target => this.isOrdinaryProgressRoom(target) && !this.isProgressRoomResolved(game, target),
        (target, route) => {
          const basePriority = { treasure: 124, hidden: 118, elite: 92, normal: 80 };
          const typeScore = basePriority[target?.type] || 56;
          const recentPenalty = this.recentRooms.includes(this.getRoomKey(target)) ? 8 : 0;
          return typeScore - route.distance * 8 - recentPenalty;
        }
      );
      if (ordinaryRoute) {
        this.setRouteLock(room, ordinaryRoute, 'ordinary');
        return ordinaryRoute;
      }

      if (this.shouldVisitShopNow(game, room)) {
        const shopRoute = this.findRouteToRoom(
          game,
          room,
          target => this.isShopRoom(target) && !this.isShopResolved(game, target),
          (target, route) => 112 - route.distance * 6
        );
        if (shopRoute) {
          this.setRouteLock(room, shopRoute, 'shop');
          return shopRoute;
        }
      }

      const bossRoute = this.canVisitBossNow(game, room)
        ? this.findRouteToRoom(
            game,
            room,
            target => this.isBossRoom(target) && !this.getRoomState(game, target).resolved,
            (target, route) => 100 - route.distance * 6
          )
        : null;
      if (bossRoute) {
        this.setRouteLock(room, bossRoute, 'boss');
        return bossRoute;
      }

      const scored = entries.map(([dir, door]) => {
        const pos = doorTargetPos[dir] || { x: room.centerX || roomW * 0.5, y: room.centerY || roomH * 0.5 };
        const target = door.target;
        const targetKey = this.getRoomKey(target);
        const targetState = this.getRoomState(game, target);
        let priority = targetState.resolved ? 8 : 28;
        if (this.isBossRoom(target)) priority -= 10;
        if (this.recentRooms.length >= 2 && targetKey === this.recentRooms[this.recentRooms.length - 2]) priority -= 18;
        priority -= dist(playerPos.x, playerPos.y, pos.x, pos.y) * 0.01;
        return { dir, pos, priority, target, finalTarget: target };
      }).sort((a, b) => b.priority - a.priority);
      return scored[0] || null;
    }


    getNearestBy(list, fromX, fromY){
      let best = null;
      let bestDist = Infinity;
      for (const item of safeArray(list)) {
        const d = dist(fromX, fromY, item.x, item.y);
        if (d < bestDist) {
          best = item;
          bestDist = d;
        }
      }
      return best;
    }

    getBestChestTarget(list, fromX, fromY){
      const rarityRank = { legendary: 4, rare: 3, uncommon: 2, common: 1 };
      let best = null;
      let bestScore = -Infinity;
      for (const item of safeArray(list)) {
        const rarity = rarityRank[item?.quality] || rarityRank[item?.rarity] || 0;
        const proximity = dist(fromX, fromY, item.x, item.y);
        const score = rarity * 1000 - proximity;
        if (score > bestScore) {
          best = item;
          bestScore = score;
        }
      }
      return best;
    }

    chooseHiddenInteractTarget(game, room, progress){
      const floor = this.getHiddenFloor(room, game);
      const puzzle = progress?.puzzleState || {};
      const nodes = safeArray(room?.hiddenPuzzleNodes);
      const playerPos = this.getPlayerPos(game.player);

      if (floor === 1) {
        const states = safeArray(puzzle.candleStates);
        const template = safeArray(puzzle.templateMask);
        const mismatches = nodes.filter(node => node?.kind === 'candle' && states[node.index] !== template[node.index]);
        return this.getNearestBy(mismatches, playerPos.x, playerPos.y);
      }

      if (floor === 3 && puzzle.stage === 'input') {
        const expected = safeArray(puzzle.sequence)[puzzle.inputIndex || 0];
        return nodes.find(node => node?.kind === 'mushroom' && node.index === expected) || null;
      }

      if (floor === 4 && puzzle.phase === 'search') {
        const lit = new Set(safeArray(puzzle.litNodeIds));
        const candidates = nodes.filter(node => node?.kind === 'memory_mushroom' && node.variant === puzzle.activeVariant && !lit.has(node.id));
        return this.getNearestBy(candidates, playerPos.x, playerPos.y);
      }

      if (floor === 6) {
        const candidates = [];
        if (!puzzle.breadTaken) {
          const bread = nodes.find(node => node?.kind === 'legacy_bread');
          if (bread) candidates.push({ node: bread, priority: this.isLowHealth(game) || (game?.player?.maxHp || 0) <= 8 ? 120 : 72 });
        }
        if (!puzzle.moneyTaken) {
          const bag = nodes.find(node => node?.kind === 'legacy_bag');
          if (bag) candidates.push({ node: bag, priority: (game?.player?.maxHp || 0) > 8 ? 110 : 84 });
        }
        if (!puzzle.bookRead) {
          const book = nodes.find(node => node?.kind === 'legacy_book');
          if (book) candidates.push({ node: book, priority: 58 });
        }
        candidates.sort((a, b) => b.priority - a.priority || dist(playerPos.x, playerPos.y, a.node.x, a.node.y) - dist(playerPos.x, playerPos.y, b.node.x, b.node.y));
        return candidates[0]?.node || null;
      }

      return null;
    }

    computeHiddenFloor2Vector(game, room, progress){
      const critters = safeArray(room?.hiddenWormCritters);
      const playerPos = this.getPlayerPos(game.player);
      const demoSeen = !!progress?.puzzleState?.demoSeen;
      const visibleRed = critters.filter(c => c && c.red && c.alive && (c.hiddenTime || 0) <= 0);
      if (!demoSeen) {
        const waitSpot = { x: room.centerX || playerPos.x, y: (room.centerY || playerPos.y) + Math.max(90, (room.height || 600) * 0.18) };
        this.currentIntent = 'hidden.floor2.wait';
        return this.seekTarget(game.player, waitSpot, 20);
      }
      const target = this.getNearestBy(visibleRed, playerPos.x, playerPos.y);
      if (!target) {
        this.currentIntent = 'hidden.floor2.center';
        return this.seekTarget(game.player, { x: room.centerX || playerPos.x, y: room.centerY || playerPos.y }, 18);
      }
      const d = dist(playerPos.x, playerPos.y, target.x, target.y);
      const dashReady =
        game.player.dashCooldown <= 0 &&
        !game.player.isDashing &&
        nowMs() - this.lastDashAt > 900;
      const toward = norm(target.x - playerPos.x, target.y - playerPos.y);
      const staging = {
        x: target.x - toward.x * 86,
        y: target.y - toward.y * 86
      };

      if (dashReady && d <= 104) {
        this.lastDashAt = nowMs();
        game.pressMobileAction?.(' ');
        this.currentIntent = 'hidden.floor2.dash';
        return toward;
      }

      if (!dashReady && d < 64) {
        this.currentIntent = 'hidden.floor2.reset';
        return norm(playerPos.x - target.x, playerPos.y - target.y);
      }

      if (d > 74) {
        this.currentIntent = 'hidden.floor2.stage';
        return this.seekTarget(game.player, staging, 14);
      }

      this.currentIntent = 'hidden.floor2.red';
      return toward;
    }

    computeHiddenFloor5Vector(game, room, progress){
      const blockers = safeArray(room?.hiddenBlockers).filter(b => b && !b.sealed);
      const targets = safeArray(room?.hiddenSealTargets).filter(t => t && !progress?.puzzleState?.blocked?.[t.index]);
      const playerPos = this.getPlayerPos(game.player);
      if (!blockers.length || !targets.length) {
        this.currentIntent = 'hidden.floor5.center';
        return this.seekTarget(game.player, { x: room.centerX || playerPos.x, y: room.centerY || playerPos.y }, 16);
      }

      let best = null;
      let bestScore = Infinity;
      for (const blocker of blockers) {
        for (const target of targets) {
          const score = dist(blocker.x, blocker.y, target.x, target.y);
          if (score < bestScore) {
            bestScore = score;
            best = { blocker, target };
          }
        }
      }
      if (!best) return { x: 0, y: 0 };

      const pushDir = norm(best.target.x - best.blocker.x, best.target.y - best.blocker.y);
      const blockerRadius = Math.max(42, best.blocker.radius || 42);
      const staging = {
        x: best.blocker.x - pushDir.x * (blockerRadius + 28),
        y: best.blocker.y - pushDir.y * (blockerRadius + 28)
      };
      const alignTolerance = best.target.y < best.blocker.y ? 14 : 18;
      const stageDist = dist(playerPos.x, playerPos.y, staging.x, staging.y);
      this.currentIntent = 'hidden.floor5.push';
      if (stageDist > 12 || Math.abs(playerPos.x - staging.x) > alignTolerance || Math.abs(playerPos.y - staging.y) > alignTolerance) {
        return this.seekTarget(game.player, staging, 6);
      }
      return pushDir;
    }

    computeHiddenRoomVector(game, room, pickups){
      const floor = this.getHiddenFloor(room, game);
      const progress = this.getHiddenProgress(game, room) || { puzzleState: {} };
      const puzzle = progress.puzzleState || {};
      const playerPos = this.getPlayerPos(game.player);
      const centerLower = {
        x: room.centerX || playerPos.x,
        y: (room.centerY || playerPos.y) + Math.max(58, (room.height || 600) * 0.12)
      };
      const memory = this.getRoomMemory(room);

      const orbReady = !!(room.hiddenOrb && floor !== 6 && (progress.completed || progress.phase === 'awakened' || progress.phase === 'played' || progress.witnessed));

      if ((memory.forceCenterUntil || 0) > nowMs()) {
        this.currentIntent = 'hidden.recenter';
        return this.seekTarget(game.player, centerLower, 18);
      }

      if (progress.completed) {
        const chestTarget = this.getBestChestTarget(this.getChestTargets(room), playerPos.x, playerPos.y);
        if (orbReady && !progress.witnessed) {
          this.currentIntent = 'hidden.orb';
          return this.seekTarget(game.player, room.hiddenOrb, 10);
        }
        if (pickups.length) {
          this.currentIntent = `hidden.pickup.${pickups[0].kind || 'drop'}`;
          return this.seekTarget(game.player, pickups[0], 12);
        }
        if (chestTarget) {
          this.currentIntent = 'hidden.chest';
          return this.seekTarget(game.player, chestTarget, 36);
        }
      }

      if (floor === 2) return this.computeHiddenFloor2Vector(game, room, progress);

      if (floor === 3 && !progress.completed && puzzle.stage !== 'input') {
        this.currentIntent = 'hidden.floor3.wait';
        return this.seekTarget(game.player, centerLower, 16);
      }

      if (floor === 4 && !progress.completed && puzzle.phase !== 'search') {
        this.currentIntent = 'hidden.floor4.wait';
        return this.seekTarget(game.player, centerLower, 18);
      }

      if (floor === 5 && !progress.completed) {
        return this.computeHiddenFloor5Vector(game, room, progress);
      }

      const targetNode = this.chooseHiddenInteractTarget(game, room, progress);
      if (targetNode) {
        this.currentIntent = `hidden.${targetNode.kind || 'node'}`;
        return this.seekTarget(game.player, targetNode, targetNode.kind === 'legacy_book' ? 12 : 10);
      }

      if (orbReady && !progress.witnessed) {
        this.currentIntent = 'hidden.orb';
        return this.seekTarget(game.player, room.hiddenOrb, 10);
      }

      if (!progress.completed && floor !== 6) {
        this.currentIntent = 'hidden.center';
        return this.seekTarget(game.player, centerLower, 16);
      }

      this.currentIntent = 'hidden.center';
      return this.seekTarget(game.player, centerLower, 16);
    }


    handleActions(game, room){
      const stamp = nowMs();
      if (stamp - this.lastInteractionAt < 180) return;
      const playerPos = this.getPlayerPos(game.player);

      if (room.type === 'hidden') {
        const progress = this.getHiddenProgress(game, room) || { puzzleState: {} };
        const floor = this.getHiddenFloor(room, game);
        const orbReady = !!(room.hiddenOrb && floor !== 6 && (progress.completed || progress.phase === 'awakened' || progress.phase === 'played' || progress.witnessed));
        const targetNode = this.chooseHiddenInteractTarget(game, room, progress) || (orbReady && !progress.witnessed ? room.hiddenOrb : null);
        if (targetNode) {
          const d = dist(playerPos.x, playerPos.y, targetNode.x, targetNode.y);
          const interactRange = targetNode.kind === 'legacy_book' ? 58 : 72;
          if (d <= interactRange) {
            this.lastInteractionAt = stamp;
            game.triggerPrimaryInteraction?.();
            return;
          }
        }
      }

      const roomChest = this.getBestChestTarget(this.getChestTargets(room), playerPos.x, playerPos.y);
      if (roomChest) {
        const d = dist(playerPos.x, playerPos.y, roomChest.x, roomChest.y);
        if (d < 110) {
          this.lastInteractionAt = stamp;
          game.triggerPrimaryInteraction?.();
          return;
        }
      }

      if (room.type === 'shop' && room.npc) {
        const memory = this.getRoomMemory(room);
        if (!this.shouldVisitShopNow(game, room) || this.isShopResolved(game, room)) {
          return;
        }
        if (global.shopNPCSystem?.isTalking || game.shopOpen) {
          return;
        }
        const d = dist(playerPos.x, playerPos.y, room.npc.x, room.npc.y);
        if (d < 120) {
          this.lastInteractionAt = stamp;
          if (!memory.shopDialogueDone) {
            memory.lastShopToggleAt = stamp;
            game.triggerTalkInteraction?.();
          } else if (stamp - (memory.lastShopToggleAt || 0) > 900) {
            memory.lastShopToggleAt = stamp;
            game.triggerPrimaryInteraction?.();
          }
          return;
        }
      }
    }


    async startBenchmark(mode, options = {}){
      const game = this.game || global.game;
      if (!game) return false;
      const profiler = await global.getPerformanceProfiler?.();
      if (!profiler) {
        this.notify('性能分析器未加载', 'warn');
        return false;
      }
      this.enabled = true;
      this.profile = 'benchmark';
      if (mode === 'suite') {
        this.benchmark = {
          mode: 'suite',
          scenarios: [
            { id: 'current', label: '当前房', durationMs: options.currentMs || 15000 },
            { id: 'boss', label: 'Boss房', durationMs: options.bossMs || 20000 },
            { id: 'hidden', label: '隐藏房', durationMs: options.hiddenMs || 15000 }
          ],
          index: -1,
          results: [],
          profiler
        };
        await this.advanceSuiteScenario();
        return true;
      }
      this.benchmark = {
        mode,
        durationMs: options.durationMs || 20000,
        profiler,
        current: { id: mode, label: options.label || mode, durationMs: options.durationMs || 20000 },
        startedAt: 0,
        lastSampleAt: 0,
        samples: [],
        results: []
      };
      await this.prepareScenario(mode);
      profiler.reset();
      profiler.toggleEnabled?.(true);
      this.benchmark.startedAt = nowMs();
      this.notify(`开始 ${this.benchmark.current.label} 压测`, 'info');
      return true;
    }

    async advanceSuiteScenario(){
      if (!this.benchmark || this.benchmark.mode !== 'suite') return;
      this.benchmark.index += 1;
      if (this.benchmark.index >= this.benchmark.scenarios.length) {
        const combined = {
          exportedAt: new Date().toISOString(),
          mode: 'suite',
          floor: this.game?.currentFloor || 0,
          results: this.benchmark.results
        };
        const fileName = `autobench_suite_f${this.game?.currentFloor || 0}_${Date.now()}.json`;
        this.downloadJson(combined, fileName);
        this.lastBenchmarkReport = { fileName, payload: combined };
        this.notify('套跑完成，报告已导出', 'info');
        this.benchmark = null;
        this.enabled = false;
        this.vector = { x: 0, y: 0 };
        return;
      }
      const scenario = this.benchmark.scenarios[this.benchmark.index];
      const profiler = this.benchmark.profiler;
      this.benchmark.current = scenario;
      this.benchmark.samples = [];
      await this.prepareScenario(scenario.id);
      profiler.reset();
      profiler.toggleEnabled?.(true);
      this.benchmark.startedAt = nowMs();
      this.benchmark.lastSampleAt = 0;
      this.notify(`套跑 ${this.benchmark.index + 1}/${this.benchmark.scenarios.length}: ${scenario.label}`, 'info');
    }

    async prepareScenario(mode){
      const game = this.game || global.game;
      if (!game) return false;
      if (mode === 'boss') {
        game.debugJumpToBoss?.();
      } else if (mode === 'hidden') {
        global.debugJumpToHiddenRoom?.();
      }
      await new Promise(resolve => setTimeout(resolve, 80));
      const room = game.curRoom;
      if (!room) return false;
      if (mode === 'boss') {
        room.cleared = false;
        if (room.hordeManager && Array.isArray(room.hordeManager.enemies)) {
          room.hordeManager.enemies = room.hordeManager.enemies.filter(e => e && e.hp > 0);
        }
        if (this.getActiveEnemies(room).length === 0) {
          room.spawnEnemies?.();
        }
      }
      return true;
    }

    updateBenchmark(){
      if (!this.benchmark) return;
      const profiler = this.benchmark.profiler;
      const stamp = nowMs();
      const current = this.benchmark.current || this.benchmark;
      if (stamp - (this.benchmark.lastSampleAt || 0) > 2000) {
        this.benchmark.lastSampleAt = stamp;
        this.benchmark.samples.push({
          t: stamp - this.benchmark.startedAt,
          roomType: this.game?.curRoom?.type || '-',
          floor: this.game?.currentFloor || 0,
          enemyCount: this.getActiveEnemies(this.game?.curRoom).length,
          bullets: this.game?.bullets?.length || 0,
          particles: this.game?.particles?.active?.length || 0,
          snapshot: profiler.getSnapshot ? profiler.getSnapshot() : null
        });
      }
      if (stamp - this.benchmark.startedAt < (current.durationMs || this.benchmark.durationMs || 0)) return;
      const snapshot = profiler.getDetailedSnapshot ? profiler.getDetailedSnapshot() : profiler.getSnapshot();
      const payload = {
        exportedAt: new Date().toISOString(),
        mode: current.id || this.benchmark.mode,
        label: current.label || current.id || this.benchmark.mode,
        floor: this.game?.currentFloor || 0,
        roomType: this.game?.curRoom?.type || '-',
        summary: snapshot,
        samples: this.benchmark.samples || []
      };
      if (this.benchmark.mode === 'suite') {
        this.benchmark.results.push(payload);
        this.advanceSuiteScenario();
      } else {
        const fileName = `autobench_${payload.mode}_f${payload.floor}_${Date.now()}.json`;
        this.downloadJson(payload, fileName);
        this.lastBenchmarkReport = { fileName, payload };
        this.notify(`压测完成：${current.label}`, 'info');
        this.benchmark = null;
        this.enabled = false;
        this.vector = { x: 0, y: 0 };
      }
    }

    stopBenchmark(options = {}){
      if (!this.benchmark) return false;
      this.benchmark = null;
      if (!options.silent) this.notify('已停止压测', 'warn');
      return true;
    }

    downloadJson(payload, fileName){
      const text = JSON.stringify(payload, null, 2);
      try {
        const blob = new Blob([text], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 1500);
      } catch (err) {
        console.warn('[AutoPlayHarness] export failed, fallback to clipboard', err);
        navigator.clipboard?.writeText?.(text).catch(()=>{});
      }
    }
  }

  global.AutoPlayHarness = AutoPlayHarness;
  global.getAutoPlayHarness = async function(){
    if (!global.DEV_MODE_ENABLED) return null;
    if (!global.autoPlayHarness) {
      global.autoPlayHarness = new AutoPlayHarness(global.game || null);
    } else {
      global.autoPlayHarness.attach(global.game || null);
    }
    return global.autoPlayHarness;
  };
})(window);
