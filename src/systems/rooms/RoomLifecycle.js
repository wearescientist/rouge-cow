/**
 * Room 生命周期与刷怪逻辑
 * 从主类中拆分出来的原型扩展，保持运行行为不变。
 */
(function(global) {
    'use strict';

    const Room = global.Room;
    if (!Room) {
        console.warn('[RogueCow] Room 尚未加载，跳过扩展。');
        return;
    }

    Room.prototype.spawnRoomItems = function() {
        if (this.type === 'treasure') {
            const createQuality = () => {
                if (window.game && typeof window.game.rollTreasureChestQuality === 'function') {
                    return window.game.rollTreasureChestQuality();
                }
                const roll = Math.random();
                if (roll < 0.05) return 'legendary';
                if (roll < 0.20) return 'rare';
                return 'common';
            };
            const positions = [-96, 0, 96];
            this.chest = null;
            this.chests = positions.map(offsetX => {
                const quality = createQuality();
                return {
                    x: this.centerX + offsetX,
                    y: this.centerY,
                    opened: false,
                    disabled: false,
                    quality,
                    rewards: window.game && typeof window.game.generateTreasureChestRewardsByQuality === 'function'
                        ? window.game.generateTreasureChestRewardsByQuality(quality)
                        : []
                };
            });

        } else if (this.type === 'hidden') {
            // 隐藏房：每层固定一个，进房即给隐藏奖励
            this.cleared = true;
            this.chests = [];
            this.chest = {
                x: this.centerX,
                y: this.centerY,
                opened: false,
                items: []
            };
            const secretPool = window.game && typeof window.game.getAvailableItemsByFloor === 'function'
                ? window.game.getAvailableItemsByFloor()
                : Object.values(ITEMS || {});
            if (secretPool.length > 0) {
                const selected = secretPool[Math.floor(Math.random() * secretPool.length)];
                if (selected) {
                    this.chest.items = [{
                        id: selected.id,
                        icon: selected.icon,
                        name: selected.name,
                        desc: selected.desc,
                        rarity: selected.rarity
                    }];
                }
            }

        }

    }

    Room.prototype.getActiveEnemies = function() {

        if (this.hordeManager) {

            return this.hordeManager.getActiveEnemies();

        }

        return this.enemies.filter(e => e.hp > 0);

    }

    Room.prototype.update = function(dt) {

        if (this.hordeManager) {

            this.hordeManager.update(dt);

            // 持续补充敌人直到达到本波目标

            if (this.hordeManager.spawnedThisWave < this.hordeManager.targetCount) {

                this.hordeManager.spawnBatch();

            }

        }

    }

    Room.prototype.spawnEnemies = function() {

        if (this.type === 'start' || this.type === 'treasure' || this.type === 'shop') return;

        

        if (this.type === 'hidden') {

            const eliteTypes = ['bear', 'yinya'];

            const typeKey = randChoice(eliteTypes);

            const elite = createEnemy(this.centerX, this.centerY, typeKey);

            // v0.18.4: 应用楼层难度倍率
            const floor = window.game?.currentFloor || 1;
            elite.hp *= 2 * floor;  // 基础2倍精英 × 楼层倍率

            elite.maxHp = elite.hp;

            elite.dmg *= 1.5;

            elite.isElite = true;

            // 如果有HordeManager，添加到它的enemies数组

            if (this.hordeManager) {

                this.hordeManager.enemies.push(elite);

            } else {

                this.enemies.push(elite);

            }

            return;

        }

        

        if (this.type === 'boss') {
            // v0.12.0 - 根据当前楼层选择对应的Boss
            const floor = window.game ? window.game.currentFloor : 1;
            const bossKey = 'floor' + Math.min(Math.max(floor, 1), 6);
            const bossCfg = BOSS_TYPES[bossKey];
            
            if (!bossCfg) {
                console.error(`[Boss生成] 未找到楼层${floor}的Boss配置`);
                return;
            }
            
            // v0.20.0: 割草模式 - Boss血量 = 基础 × 10 × 楼层^1.5 (第6层=150倍基础)
            const bossHp = Math.floor(bossCfg.baseHp * 10 * Math.pow(floor, 1.5));
            // Boss伤害保持原版，不受楼层影响
            
            // 第6层Boss固定在房间中央略高位置
            const bossX = this.centerX;
            const bossY = (floor === 6) ? this.centerY - 50 : this.centerY - 100;
            
            const boss = createBoss(bossX, bossY, floor);
            boss.name = bossCfg.name;
            boss.hp = bossHp;
            boss.maxHp = bossHp;
            boss.speed = bossCfg.speed;
            // v0.20.0: Boss伤害保持原版，不受楼层影响（玩家太脆）
            boss.dmg = bossCfg.dmg;
            boss.exp = bossCfg.exp;
            boss.gold = bossCfg.gold;
            boss.color = bossCfg.color;
            boss.isBoss = true;
            boss.tier = 4;
            boss.phase = 0;
            boss.bossFloor = floor; // 记录Boss楼层用于后续逻辑
            
            // 设置贴图
            if (bossCfg.sprite) {
                boss.sprite = bossCfg.sprite;
            }
            
            // 第6层特殊处理：静止Boss
            if (floor === 6) {
                boss.isStatic = true;
                boss.speed = 0;
            }

            // Boss攻击系统初始化
            boss.skillCooldowns = {
                charge: 3,
                bullet_hell: 2,
                summon: 5,
                shockwave: 4,
                homing: 1
            };
            boss.skillTimers = {};
            boss.isCharging = false;
            boss.chargeWarning = false;
            boss.chargeDir = { x: 0, y: 0 };
            
            // v0.17.2: 移除调试日志
        // console.log(`[Boss生成] 第${floor}层Boss: ${boss.name}, HP:${bossHp}, 贴图:${boss.sprite}`);
            
            if (this.hordeManager) {
                this.hordeManager.enemies.push(boss);
            } else {
                this.enemies.push(boss);
            }
            
            return;
        }

        

        // v0.9.5 - 普通房间和精英房的敌人由HordeManager动态生成
        // 如果HordeManager不存在（异常情况），使用简单后备生成
        if (this.hordeManager) return;
        
        // 后备生成：只生成T1基础怪（避免破坏新系统平衡）
        const count = randInt(3, 5);
        
        // v0.18.4: 应用楼层难度倍率
        const floor = window.game?.currentFloor || 1;
        
        // Use new system monsters if available
        const useNewTypes = (typeof USE_NEW_ENEMY_SYSTEM !== 'undefined' && USE_NEW_ENEMY_SYSTEM && 
                            typeof getRandomNewMonsterForFloor === 'function');
        
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const r = 150 + Math.random() * 100;
            const x = 450 + Math.cos(angle) * r;
            const y = 300 + Math.sin(angle) * r;
            
            let typeKey;
            if (useNewTypes) {
                typeKey = getRandomNewMonsterForFloor(floor);
            } else {
                const t1Types = ['chick', 'snail', 'pigeon', 'duck3', 'bat'];
                typeKey = randChoice(t1Types);
            }
            
            const enemy = createEnemy(x, y, typeKey, 1);
            // 应用楼层倍率
            enemy.hp *= floor;
            enemy.maxHp = enemy.hp;
            this.enemies.push(enemy);
        }

    }

    global.Room = Room;
})(window);
