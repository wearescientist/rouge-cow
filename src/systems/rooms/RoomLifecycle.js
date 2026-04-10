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
            const spreadX = Math.max(160, Math.min(230, this.width * 0.16));
            const spreadY = Math.max(110, Math.min(160, this.height * 0.11));
            const positions = [
                { x: -spreadX, y: spreadY * 0.2 },
                { x: spreadX, y: spreadY * 0.2 },
                { x: 0, y: -spreadY }
            ];
            this.chest = null;
            this.chests = positions.map((offset) => {
                const quality = createQuality();
                return {
                    x: this.centerX + offset.x,
                    y: this.centerY + offset.y,
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

            const floor = window.game?.currentFloor || 1;
            const typeKey = (typeof getRandomNewMonsterForFloor === 'function' &&
                (getRandomNewMonsterForFloor(floor, 2) ||
                 getRandomNewMonsterForFloor(floor, 3) ||
                 getRandomNewMonsterForFloor(floor))) || null;
            if (!typeKey) {
                console.error(`[HiddenRoom] 未找到第${floor}层的新怪物配置`);
                return;
            }

            const elite = createEnemy(this.centerX, this.centerY, typeKey);

            // v0.18.4: 应用楼层难度倍率
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
            const floor = window.game ? window.game.currentFloor : 1;
            // 第6层Boss固定在房间中央略高位置
            const bossX = this.centerX;
            const bossY = (floor === 6) ? this.centerY - 50 : this.centerY - 100;
            
            const boss = createBoss(bossX, bossY, floor);
            if (!boss) {
                console.error(`[Boss生成] 未找到楼层${floor}的新Boss配置`);
                return;
            }
            
            // v0.17.2: 移除调试日志
        // console.log(`[Boss生成] 第${floor}层Boss: ${boss.name}, 贴图:${boss.typeKey}`);
            
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
        
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const r = 150 + Math.random() * 100;
            const x = 450 + Math.cos(angle) * r;
            const y = 300 + Math.sin(angle) * r;
            
            const typeKey = (typeof getRandomNewMonsterForFloor === 'function' &&
                (getRandomNewMonsterForFloor(floor, 1) ||
                 getRandomNewMonsterForFloor(floor, [1, 2]) ||
                 getRandomNewMonsterForFloor(floor))) || null;
            if (!typeKey) continue;
            
            const enemy = createEnemy(x, y, typeKey, 1);
            // 应用楼层倍率
            enemy.hp *= floor;
            enemy.maxHp = enemy.hp;
            this.enemies.push(enemy);
        }

    }

    global.Room = Room;
})(window);
