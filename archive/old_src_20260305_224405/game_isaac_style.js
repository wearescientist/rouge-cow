/**
 * 肉鸽牛牛 - 以撒风格完整游戏
 * 一个屏幕一个房间，清理后选择方向
 */

class IsaacCowGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = 900;
        this.height = 600;
        
        this.state = 'loading';
        this.gameTime = 0;
        this.lastTime = 0;
        
        // 系统
        this.spriteManager = new SpriteManager();
        this.itemManager = null;
        this.weaponManager = null;
        this.particles = new ParticleSystem();
        
        // 地图
        this.mapGenerator = new MapGenerator();
        this.currentRoom = null;
        this.allRooms = null;
        this.minimap = new Minimap();
        
        // 玩家
        this.player = null;
        this.expGems = [];
        this.coins = [];
        
        // UI
        this.itemSelectionUI = null;
        this.transitioning = false;
        this.transitionTimer = 0;
        this.transitionDirection = null;
        
        // HD-2D渲染器
        this.hd2dRenderer = null;
        
        // 输入
        this.keys = {};
        
        this.setupInput();
    }

    async init() {
        await this.spriteManager.loadAll();
        
        // 生成地图
        this.currentRoom = this.mapGenerator.generate();
        this.allRooms = this.mapGenerator.rooms;
        this.currentRoom.visited = true;
        this.currentRoom.startWave(1);
        
        // 创建玩家
        this.player = new Player(450, 300);
        
        // 管理器
        this.itemManager = new ItemManager(this.player);
        this.weaponManager = new WeaponManager(this.player);
        this.itemSelectionUI = new ItemSelectionUI(this.itemManager);
        
        // 初始武器
        this.weaponManager.addWeapon('whip');
        
        // 初始化HD-2D渲染器
        if (typeof HD2DRenderer !== 'undefined') {
            try {
                this.hd2dRenderer = new HD2DRenderer(this.canvas, this.ctx);
                if (typeof HD2DEffects !== 'undefined') {
                    this.hd2dRenderer.setParams(HD2DEffects.presets.light);
                }
                console.log('[HD2D] 渲染器初始化完成');
            } catch (e) {
                console.error('[HD2D] 初始化失败:', e);
                this.hd2dRenderer = null;
            }
        } else {
            console.warn('[HD2D] HD2DRenderer 未加载');
        }
        
        this.state = 'playing';
        console.log('%c🐮 肉鸽牛牛 - 以撒风格', 'font-size:24px;color:#4488ff');
        console.log('%c清理房间，选择方向，继续探索！', 'font-size:14px');
        
        requestAnimationFrame(t => this.loop(t));
    }

    setupInput() {
        window.addEventListener('keydown', e => {
            this.keys[e.key] = true;
            this.handleKey(e.key);
        });
        window.addEventListener('keyup', e => this.keys[e.key] = false);
    }

    handleKey(key) {
        if (this.transitioning) return;
        
        if (key >= '1' && key <= '9') {
            this.giveItem(parseInt(key));
        }
        if (key === '0') {
            this.giveItem(Math.floor(Math.random() * 100) + 1);
        }
        if (key === 'w' || key === 'W') {
            this.weaponManager.addWeapon(Object.keys(WEAPONS)[Math.floor(Math.random() * 8)]);
        }
        // M键显示地图
        if (key === 'm' || key === 'M') {
            this.showMap = !this.showMap;
        }
    }

    giveItem(itemId) {
        const success = this.itemManager.acquireItem(itemId);
        if (success) {
            const item = ITEMS_DATABASE[itemId];
            this.particles.emitItemBurst(this.player.x, this.player.y, item.rarity);
        }
    }

    update(dt) {
        if (this.state !== 'playing') return;
        if (this.transitioning) {
            this.updateTransition(dt);
            return;
        }
        if (this.itemSelectionUI.visible) return;

        this.gameTime += dt;

        // 更新HD2D渲染器（轮廓光呼吸动画等）
        if (this.hd2dRenderer) {
            this.hd2dRenderer.update(dt, this.player, null);
        }

        const stats = this.itemManager.recalculateStats();

        // 更新玩家
        this.player.update(dt, this.itemManager, { keys: this.keys }, this.currentRoom);

        // 更新房间
        const justCleared = this.currentRoom.update(dt, this.player, this.spriteManager);
        
        if (justCleared) {
            this.onRoomCleared();
        }

        // 检查门传送
        const transitionDir = this.currentRoom.checkDoorTransition(this.player);
        if (transitionDir !== null && this.currentRoom.cleared) {
            this.startTransition(transitionDir);
        }

        // 武器更新
        this.weaponManager.update(dt, this.currentRoom.enemies, this.itemManager);

        // 碰撞检测
        this.handleCombat(stats);

        // 掉落物
        this.updateDrops(dt, stats);

        // 粒子
        this.particles.update();

        // 升级检查
        this.checkLevelUp();
    }

    handleCombat(stats) {
        // 子弹与敌人
        for (const bullet of this.weaponManager.bullets) {
            if (bullet instanceof Bullet) {
                for (const enemy of this.currentRoom.enemies) {
                    if (bullet.collidesWith(enemy)) {
                        if (bullet.hit(enemy)) {
                            let damage = bullet.damage * stats.damage;
                            
                            // 暴击
                            if (Math.random() < (stats.critChance || 0)) {
                                damage *= 2;
                            }
                            
                            const killed = enemy.takeDamage(damage, {
                                burn: bullet.burn,
                                poison: bullet.poison,
                                slow: bullet.slow ? 0.5 : 1
                            });
                            
                            this.particles.emitHit(enemy.x, enemy.y, bullet.color);
                            
                            if (killed) {
                                this.onEnemyDeath(enemy);
                            }
                        }
                    }
                }
            } else if (bullet.type === 'melee' || bullet.type === 'orbit') {
                for (const enemy of this.currentRoom.enemies) {
                    const dist = Math.sqrt((enemy.x - bullet.x) ** 2 + (enemy.y - bullet.y) ** 2);
                    if (dist < (bullet.size || 20)) {
                        if (enemy.takeDamage(bullet.damage)) {
                            this.onEnemyDeath(enemy);
                        }
                    }
                }
            }
        }

        // 玩家与敌人碰撞
        for (const enemy of this.currentRoom.enemies) {
            if (enemy.distanceTo(this.player) < 20) {
                if (this.player.takeDamage(enemy.damage)) {
                    this.particles.emitHit(this.player.x, this.player.y, '#f00');
                }
            }
        }
    }

    onEnemyDeath(enemy) {
        // 经验
        this.expGems.push(new ExpGem(enemy.x, enemy.y, enemy.exp));
        
        // 金币
        if (Math.random() < 0.3) {
            this.coins.push(new Coin(enemy.x, enemy.y, 1));
        }
        
        // 击杀回血
        const stats = this.itemManager.recalculateStats();
        if (stats.killHeal > 0) {
            this.player.heal(stats.killHeal);
        }
        
        this.particles.emitExplosion(enemy.x, enemy.y);
    }

    updateDrops(dt, stats) {
        const magnetRange = 100 * (stats.magnetRange || 1);
        
        for (let i = this.expGems.length - 1; i >= 0; i--) {
            const gem = this.expGems[i];
            if (gem.update(dt, this.player, magnetRange)) {
                this.player.exp += gem.value;
                this.expGems.splice(i, 1);
            } else if (!gem.alive) {
                this.expGems.splice(i, 1);
            }
        }
        
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            if (coin.update(dt, this.player, magnetRange)) {
                this.player.gold += coin.value;
                this.coins.splice(i, 1);
            } else if (!coin.alive) {
                this.coins.splice(i, 1);
            }
        }
    }

    onRoomCleared() {
        console.log(`房间清理完成！可以前往下一个房间`);
        
        // 给予奖励
        const items = this.itemManager.getRandomItemsFromPool(3, this.currentRoom.type, true);
        if (items.length > 0) {
            this.itemSelectionUI.show(items, (selected) => {
                console.log(`获得: ${selected.name}`);
            });
        }
    }

    startTransition(dir) {
        const door = this.currentRoom.doors[dir];
        if (!door || !door.target) return;
        
        this.transitioning = true;
        this.transitionDirection = dir;
        this.nextRoom = door.target;
        this.transitionTimer = 0;
    }

    updateTransition(dt) {
        this.transitionTimer += dt;
        
        if (this.transitionTimer >= 0.3) {
            // 完成传送
            this.currentRoom = this.nextRoom;
            this.currentRoom.visited = true;
            
            if (!this.currentRoom.cleared) {
                this.currentRoom.startWave(this.currentRoom.wave);
            }
            
            // 放置玩家在新位置
            const oppositeDir = (this.transitionDirection + 2) % 4;
            switch (oppositeDir) {
                case Direction.UP: this.player.y = 60; break;
                case Direction.DOWN: this.player.y = 540; break;
                case Direction.LEFT: this.player.x = 60; break;
                case Direction.RIGHT: this.player.x = 840; break;
            }
            
            this.expGems = [];
            this.coins = [];
            
            this.transitioning = false;
        }
    }

    checkLevelUp() {
        const needed = this.player.level * 100;
        if (this.player.exp >= needed) {
            this.player.exp -= needed;
            this.player.level++;
            this.player.maxHealth++;
            this.player.health++;
            
            // 升级奖励
            const upgrades = [];
            const availableWeapons = Object.keys(WEAPONS).filter(w => 
                !this.weaponManager.weapons.find(ww => ww.id === w)
            );
            
            if (availableWeapons.length > 0 && this.weaponManager.weapons.length < 6) {
                const w = availableWeapons[Math.floor(Math.random() * availableWeapons.length)];
                upgrades.push({ type: 'weapon', id: w, ...WEAPONS[w] });
            }
            
            const items = this.itemManager.getRandomItemsFromPool(3, 'normal', true);
            upgrades.push(...items.map(i => ({ ...i, type: 'item' })));
            
            this.itemSelectionUI.show(upgrades.slice(0, 4), (selected) => {
                if (selected.type === 'weapon') {
                    this.weaponManager.addWeapon(selected.id);
                } else {
                    this.itemManager.acquireItem(selected.id);
                }
            });
        }
    }

    draw() {
        this.ctx.fillStyle = '#0a0a14';
        this.ctx.fillRect(0, 0, this.width, this.height);

        if (this.state === 'loading') {
            this.drawLoading();
            return;
        }

        // 使用HD2D渲染器渲染世界
        if (this.hd2dRenderer) {
            const renderWorld = () => {
                // 1. 绘制房间背景
                this.currentRoom.drawBackground(this.ctx);
                
                // 2. 绘制敌人阴影
                if (this.currentRoom.enemies.length > 0) {
                    const enemies = this.currentRoom.enemies.map(e => ({ x: e.x, y: e.y }));
                    this.hd2dRenderer.shadow.renderBatch(enemies);
                }

                // 3. 绘制敌人和其他房间元素
                this.currentRoom.drawEntities(this.ctx, this.spriteManager);

                // 4. 绘制掉落物阴影
                this.renderDropShadows();

                // 5. 绘制掉落物
                for (const gem of this.expGems) gem.draw(this.ctx);
                for (const coin of this.coins) coin.draw(this.ctx);

                // 6. 绘制武器效果
                this.weaponManager.draw(this.ctx);

                // 7. 绘制玩家（带HD2D效果）
                this.player.drawHD2D(this.ctx, this.spriteManager, this.itemManager, this.hd2dRenderer);

                // 8. 粒子
                this.particles.draw(this.ctx);
            };

            // 渲染世界
            renderWorld();
            
            // 9. 后处理效果（移轴景深+色调映射）
            this.hd2dRenderer.renderPostProcess(this.player.x, this.player.y);
        } else {
            // 降级：普通渲染
            this.currentRoom.draw(this.ctx, this.spriteManager);
            for (const gem of this.expGems) gem.draw(this.ctx);
            for (const coin of this.coins) coin.draw(this.ctx);
            this.weaponManager.draw(this.ctx);
            this.player.draw(this.ctx, this.spriteManager, this.itemManager);
            this.particles.draw(this.ctx);
        }

        // 转场效果
        if (this.transitioning) {
            const alpha = Math.sin(this.transitionTimer / 0.3 * Math.PI);
            this.ctx.fillStyle = `rgba(0,0,0,${alpha})`;
            this.ctx.fillRect(0, 0, this.width, this.height);
        }

        // UI
        this.drawUI();
    }

    renderDropShadows() {
        if (!this.hd2dRenderer) return;
        const drops = [
            ...this.expGems.map(g => ({ x: g.x, y: g.y })),
            ...this.coins.map(c => ({ x: c.x, y: c.y }))
        ];
        this.hd2dRenderer.shadow.renderBatch(drops);
    }

    drawLoading() {
        this.ctx.fillStyle = '#0a0a14';
        this.ctx.fillRect(0, 0, this.width, this.height);
        this.ctx.fillStyle = '#4488ff';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🐮 加载中...', this.width / 2, this.height / 2);
    }

    drawUI() {
        // HUD
        this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this.ctx.fillRect(10, 10, 200, 100);

        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        
        // 生命
        const hp = Math.max(0, Math.ceil(this.player.health));
        const hearts = hp > 0 ? '❤️'.repeat(hp) : '💀';
        this.ctx.fillText(hearts, 20, 35);
        
        // 等级经验
        this.ctx.fillStyle = '#4488ff';
        this.ctx.fillText(`Lv.${this.player.level} EXP:${Math.floor(this.player.exp)}`, 20, 60);
        
        // 金币
        this.ctx.fillStyle = '#ffcc00';
        this.ctx.fillText(`💰 ${this.player.gold}`, 20, 85);

        // 房间信息
        this.ctx.fillStyle = '#fff';
        this.ctx.textAlign = 'right';
        const roomNames = {
            [RoomType.NORMAL]: '普通',
            [RoomType.BOSS]: 'BOSS',
            [RoomType.TREASURE]: '宝箱',
            [RoomType.SHOP]: '商店',
            [RoomType.START]: '起点'
        };
        this.ctx.fillText(`${roomNames[this.currentRoom.type]}房间`, this.width - 20, 35);
        this.ctx.fillText(`敌人:${this.currentRoom.enemies.length}`, this.width - 20, 60);
        if (!this.currentRoom.cleared) {
            this.ctx.fillStyle = '#f44';
            this.ctx.fillText('🔒 锁定', this.width - 20, 85);
        } else {
            this.ctx.fillStyle = '#4f4';
            this.ctx.fillText('✓ 已清理', this.width - 20, 85);
        }

        // 小地图
        this.minimap.draw(this.ctx, this.currentRoom, this.allRooms, this.width - 150, 100);

        // 武器栏
        this.drawWeaponBar();

        // 道具栏
        this.drawItemBar();

        // 选择界面
        this.itemSelectionUI.draw(this.ctx, this.width, this.height);
    }

    drawWeaponBar() {
        this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this.ctx.fillRect(10, this.height - 60, 350, 50);
        
        let x = 20;
        for (const weapon of this.weaponManager.weapons) {
            this.ctx.fillStyle = '#333';
            this.ctx.fillRect(x, this.height - 50, 40, 40);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(weapon.config.icon, x + 20, this.height - 25);
            this.ctx.fillStyle = '#0f0';
            this.ctx.font = '10px Arial';
            this.ctx.fillText(`Lv${weapon.level}`, x + 20, this.height - 15);
            x += 50;
        }
    }

    drawItemBar() {
        const items = this.itemManager.getOwnedItemsList();
        this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this.ctx.fillRect(this.width - 310, this.height - 60, 300, 50);
        
        let x = this.width - 300;
        for (const item of items.slice(0, 6)) {
            const colors = { common: '#888', rare: '#4488ff', epic: '#aa44ff', legendary: '#ffcc00', cursed: '#ff4444' };
            this.ctx.strokeStyle = colors[item.rarity];
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x, this.height - 50, 40, 40);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(item.icon, x + 20, this.height - 30);
            if (item.count > 1) {
                this.ctx.fillStyle = '#ff0';
                this.ctx.font = '10px Arial';
                this.ctx.fillText(item.count, x + 35, this.height - 20);
            }
            x += 45;
        }
    }

    loop(timestamp) {
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
        this.lastTime = timestamp;
        
        this.update(dt);
        this.draw();
        
        requestAnimationFrame(t => this.loop(t));
    }
}

// ==================== 增强Player ====================
class Player extends Entity {
    constructor(x, y) {
        super(x, y, 20, 20);
        this.maxHealth = 6;
        this.health = 6;
        this.gold = 0;
        this.exp = 0;
        this.level = 1;
        this.facingRight = true;
        this.invincible = 0;
        this.canFly = false;
    }

    update(dt, itemManager, input, room) {
        const stats = itemManager.recalculateStats();
        this.canFly = stats.canFly;
        
        const speed = 150 * stats.moveSpeed;
        this.vel = new Vec2(0, 0);
        
        if (input.keys['w'] || input.keys['ArrowUp']) this.vel.y = -speed;
        if (input.keys['s'] || input.keys['ArrowDown']) this.vel.y = speed;
        if (input.keys['a'] || input.keys['ArrowLeft']) { this.vel.x = -speed; this.facingRight = false; }
        if (input.keys['d'] || input.keys['ArrowRight']) { this.vel.x = speed; this.facingRight = true; }

        super.update(dt);

        // 房间边界 + 障碍物
        if (room) {
            this.constrainToRoom(room);
            this.handleObstacles(room);
        }

        if (this.invincible > 0) this.invincible -= dt;
    }

    constrainToRoom(room) {
        const margin = room.wallThickness + 10;
        this.x = Math.max(margin, Math.min(room.width - margin, this.x));
        this.y = Math.max(margin, Math.min(room.height - margin, this.y));
    }

    handleObstacles(room) {
        if (this.canFly) return; // 飞行无视障碍物
        
        for (const obs of room.obstacles) {
            if (obs.type === 'pit') continue; // 坑可以走
            
            const dx = this.x - obs.x;
            const dy = this.y - obs.y;
            const overlapX = (obs.width / 2 + 12) - Math.abs(dx);
            const overlapY = (obs.height / 2 + 12) - Math.abs(dy);
            
            if (overlapX > 0 && overlapY > 0) {
                if (overlapX < overlapY) {
                    this.x += dx > 0 ? overlapX : -overlapX;
                } else {
                    this.y += dy > 0 ? overlapY : -overlapY;
                }
            }
        }
    }

    takeDamage(amount) {
        if (this.invincible > 0) return false;
        this.health -= amount;
        this.invincible = 1.0;
        return true;
    }

    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }

    draw(ctx, spriteManager, itemManager) {
        const stats = itemManager.recalculateStats();
        const floatY = this.canFly ? Math.sin(Date.now() / 200) * 3 : 0;
        
        // 阴影
        if (!this.canFly) {
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.beginPath();
            ctx.ellipse(this.x, this.y + 12, 10, 3, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // 玩家
        spriteManager.draw(ctx, 'player_cow', this.x - 16, this.y - 16 + floatY, {
            width: 32, height: 32, flipX: !this.facingRight
        });

        // 受伤闪烁
        if (this.invincible > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.fillStyle = 'rgba(255,0,0,0.3)';
            ctx.fillRect(this.x - 16, this.y - 16 + floatY, 32, 32);
        }
    }

    /**
     * HD2D版本绘制（带光影效果）
     */
    drawHD2D(ctx, spriteManager, itemManager, hd2dRenderer) {
        const floatY = this.canFly ? Math.sin(Date.now() / 200) * 3 : 0;
        
        // 使用HD2D渲染器渲染角色
        const drawCharacter = () => {
            // 玩家贴图
            spriteManager.draw(ctx, 'player_cow', this.x - 16, this.y - 16 + floatY, {
                width: 32, height: 32, flipX: !this.facingRight
            });

            // 受伤闪烁
            if (this.invincible > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
                ctx.fillStyle = 'rgba(255,0,0,0.3)';
                ctx.fillRect(this.x - 16, this.y - 16 + floatY, 32, 32);
            }
        };

        // 通过HD2D渲染器渲染（包含阴影、脚底柔光、轮廓光）
        if (!this.canFly) {
            hd2dRenderer.renderPlayerEffects(this.x, this.y, drawCharacter);
        } else {
            // 飞行状态：只有轮廓光，没有脚底效果
            hd2dRenderer.backlight.render(this.x, this.y + floatY, 32, 32);
            drawCharacter();
        }
    }
}

// ==================== 导出 ====================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { IsaacCowGame, Player };
}
