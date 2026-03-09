/**
 * 肉鸽牛牛 - 完整游戏
 * 整合所有系统的主类
 */

class RougelikeCowGame {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        // 游戏状态
        this.state = 'loading'; // loading, menu, playing, paused, gameover
        this.gameTime = 0;
        this.lastTime = 0;
        
        // 核心系统
        this.camera = new Camera(this.width, this.height);
        this.particles = new ParticleSystem();
        this.collision = new CollisionManager();
        this.gameTimeManager = new GameTime();
        
        // 游戏对象
        this.player = null;
        this.enemies = [];
        this.expGems = [];
        this.coins = [];
        
        // 管理器
        this.spriteManager = new SpriteManager();
        this.itemManager = null;
        this.weaponManager = null;
        this.waveManager = null;
        this.rewardManager = null;
        
        // UI
        this.itemSelectionUI = null;
        this.levelUpUI = null;
        
        // 输入
        this.keys = {};
        this.mouse = { x: 0, y: 0, clicked: false };
        
        // 房间
        this.currentRoom = null;
        this.roomCleared = false;
        
        this.setupInput();
    }

    async init() {
        // 加载精灵
        await this.spriteManager.loadAll();
        
        // 初始化玩家
        this.player = new Player(this.width / 2, this.height / 2);
        
        // 初始化管理器
        this.itemManager = new ItemManager(this.player);
        this.weaponManager = new WeaponManager(this.player);
        this.waveManager = new WaveManager(this.spriteManager);
        this.rewardManager = new RoomRewardManager(this.itemManager);
        
        // 初始化UI
        this.itemSelectionUI = new ItemSelectionUI(this.itemManager);
        this.levelUpUI = new ItemSelectionUI(this.itemManager); // 复用选择UI
        
        // 初始武器
        this.weaponManager.addWeapon('whip');
        
        // 开始第一波
        this.waveManager.startWave(1);
        
        this.state = 'playing';
        console.log('%c🐮 肉鸽牛牛 启动完成！', 'font-size:24px;color:#4488ff');
        
        requestAnimationFrame(t => this.loop(t));
    }

    setupInput() {
        // 键盘
        window.addEventListener('keydown', e => {
            this.keys[e.key] = true;
            this.handleKeyPress(e.key);
        });
        window.addEventListener('keyup', e => this.keys[e.key] = false);
        
        // 鼠标
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.addEventListener('mousemove', e => {
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        this.canvas.addEventListener('mousedown', () => this.mouse.clicked = true);
        this.canvas.addEventListener('mouseup', () => this.mouse.clicked = false);
    }

    handleKeyPress(key) {
        // 调试键
        if (key >= '1' && key <= '9') {
            this.giveItem(parseInt(key));
        }
        if (key === '0') {
            this.giveItem(Math.floor(Math.random() * 100) + 1);
        }
        if (key === 'w' || key === 'W') {
            this.weaponManager.addWeapon(Object.keys(WEAPONS)[Math.floor(Math.random() * 8)]);
        }
    }

    giveItem(itemId) {
        const success = this.itemManager.acquireItem(itemId);
        if (success) {
            const item = ITEMS_DATABASE[itemId];
            this.particles.emitItemBurst(this.player.x, this.player.y, item.rarity);
            
            // 立即应用道具效果
            this.applyItemEffects();
        }
    }

    applyItemEffects() {
        // 道具效果通过 itemManager.getEffectValue 实时获取
        // 这里可以处理一些即时效果
    }

    update(dt) {
        if (this.state !== 'playing') return;

        // 游戏时间缩放（时停道具等）
        const timeScale = this.itemManager ? 
            (this.itemManager.getEffectValue('timeScale') || 1) : 1;
        dt *= timeScale;

        this.gameTime += dt;

        // 获取道具属性
        const itemStats = this.itemManager ? this.itemManager.recalculateStats() : {};

        // 更新玩家
        this.player.update(dt, this.itemManager, { keys: this.keys });

        // 更新武器
        this.weaponManager.update(dt, this.enemies, this.itemManager);

        // 更新波次
        this.waveManager.update(dt, (x, y, config) => {
            this.enemies.push(new Enemy(x, y, config));
        });

        // 检查波次完成
        if (this.waveManager.checkWaveComplete(this.enemies.length)) {
            this.onWaveComplete();
        }

        // 更新敌人
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            enemy.update(dt, this.player, this.enemies);

            // 玩家碰撞
            if (enemy.distanceTo(this.player) < 20) {
                if (this.player.takeDamage(enemy.damage)) {
                    this.camera.shake(5);
                    this.particles.emitHit(this.player.x, this.player.y, '#ff0000');
                }
            }

            // 死亡检查
            if (enemy.hp <= 0) {
                this.onEnemyDeath(enemy);
                this.enemies.splice(i, 1);
                continue;
            }
        }

        // 子弹碰撞
        this.handleBulletCollisions(itemStats);

        // 更新经验宝石
        const magnetRange = 100 * (itemStats.magnetRange || 1);
        for (let i = this.expGems.length - 1; i >= 0; i--) {
            const gem = this.expGems[i];
            if (gem.update(dt, this.player, magnetRange)) {
                this.player.exp += gem.value;
                this.expGems.splice(i, 1);
                this.checkLevelUp();
            } else if (!gem.alive) {
                this.expGems.splice(i, 1);
            }
        }

        // 更新金币
        for (let i = this.coins.length - 1; i >= 0; i--) {
            const coin = this.coins[i];
            if (coin.update(dt, this.player, magnetRange)) {
                this.player.gold += coin.value;
                this.coins.splice(i, 1);
            } else if (!coin.alive) {
                this.coins.splice(i, 1);
            }
        }

        // 更新粒子
        this.particles.update();

        // 相机跟随
        this.camera.follow(this.player);

        // UI更新
        this.itemSelectionUI.update(dt);
        if (this.itemSelectionUI.visible) {
            this.itemSelectionUI.handleInput({
                mouse: this.mouse,
                keys: { justPressed: this.keys },
                canvasWidth: this.width,
                canvasHeight: this.height
            });
        }

        this.mouse.clicked = false;

        // 游戏结束检查
        if (this.player.health <= 0) {
            this.state = 'gameover';
        }
    }

    handleBulletCollisions(itemStats) {
        for (const bullet of this.weaponManager.bullets) {
            if (bullet instanceof Bullet) {
                for (const enemy of this.enemies) {
                    if (bullet.collidesWith(enemy)) {
                        if (bullet.hit(enemy)) {
                            // 计算伤害
                            let damage = bullet.damage;
                            
                            // 暴击
                            const critChance = itemStats.critChance || 0;
                            if (Math.random() < critChance) {
                                damage *= 2;
                                this.particles.emit(enemy.x, enemy.y, 5, { 
                                    color: '#ffcc00', speed: 50, life: 0.3 
                                });
                            }

                            // 生命偷取
                            const lifeSteal = itemStats.lifeSteal || 0;
                            if (lifeSteal > 0) {
                                this.player.heal(damage * lifeSteal);
                            }

                            // 实际伤害
                            const killed = enemy.takeDamage(damage, {
                                burn: bullet.burn > 0 ? bullet.burn : 0,
                                poison: bullet.poison > 0 ? bullet.poison : 0,
                                slow: bullet.slow ? 0.5 : 1
                            });

                            this.particles.emitHit(enemy.x, enemy.y, bullet.color);
                            this.camera.shake(2);

                            if (killed) {
                                enemy.hp = 0; // 确保死亡
                            }
                        }
                    }
                }
            } else if (bullet.type === 'melee' || bullet.type === 'orbit') {
                // 近战和环绕伤害
                for (const enemy of this.enemies) {
                    const dist = Math.sqrt(
                        (enemy.x - bullet.x) ** 2 + (enemy.y - bullet.y) ** 2
                    );
                    if (dist < (bullet.size || 20)) {
                        enemy.takeDamage(bullet.damage);
                        this.particles.emitHit(enemy.x, enemy.y, bullet.color);
                    }
                }
            } else if (bullet.type === 'area') {
                // 区域持续伤害
                bullet.tickTimer = (bullet.tickTimer || 0) + (1/60);
                if (bullet.tickTimer >= bullet.tickRate) {
                    bullet.tickTimer = 0;
                    for (const enemy of this.enemies) {
                        const dist = Math.sqrt(
                            (enemy.x - bullet.x) ** 2 + (enemy.y - bullet.y) ** 2
                        );
                        if (dist < bullet.radius) {
                            enemy.takeDamage(bullet.damage);
                        }
                    }
                }
            }
        }
    }

    onEnemyDeath(enemy) {
        // 掉落经验
        const expValue = Math.floor(enemy.exp * this.itemManager.getEffectValue('goldGain'));
        this.expGems.push(new ExpGem(enemy.x, enemy.y, expValue));

        // 掉落金币
        if (Math.random() < 0.3) {
            const goldValue = Math.floor(Math.random() * 3) + 1;
            this.coins.push(new Coin(enemy.x + (Math.random() - 0.5) * 20, 
                                     enemy.y + (Math.random() - 0.5) * 20, goldValue));
        }

        // 击杀回血
        const killHeal = this.itemManager.getEffectValue('killHeal');
        if (killHeal > 0) {
            this.player.heal(killHeal);
        }

        // 爆炸死亡效果
        this.particles.emitExplosion(enemy.x, enemy.y);
    }

    onWaveComplete() {
        // 给予奖励
        const items = this.itemManager.getRandomItemsFromPool(3, 'normal', true);
        if (items.length > 0) {
            this.itemSelectionUI.show(items, (selected) => {
                console.log(`获得: ${selected.name}`);
            });
        }

        // 下一波
        setTimeout(() => {
            this.waveManager.startWave(this.waveManager.wave + 1);
        }, 2000);
    }

    checkLevelUp() {
        const expNeeded = this.player.level * 100;
        if (this.player.exp >= expNeeded) {
            this.player.exp -= expNeeded;
            this.player.level++;
            
            // 升级奖励
            const upgrades = this.generateUpgradeOptions();
            this.levelUpUI.show(upgrades, (selected) => {
                if (selected.type === 'weapon') {
                    this.weaponManager.addWeapon(selected.id);
                } else {
                    this.itemManager.acquireItem(selected.id);
                }
            });
        }
    }

    generateUpgradeOptions() {
        const options = [];
        
        // 新武器
        const availableWeapons = Object.keys(WEAPONS).filter(w => 
            !this.weaponManager.weapons.find(ww => ww.id === w)
        );
        if (availableWeapons.length > 0 && this.weaponManager.weapons.length < 6) {
            const weapon = availableWeapons[Math.floor(Math.random() * availableWeapons.length)];
            options.push({
                type: 'weapon',
                id: weapon,
                name: WEAPONS[weapon].name,
                icon: WEAPONS[weapon].icon,
                description: WEAPONS[weapon].description,
                rarity: 'rare'
            });
        }

        // 随机道具
        const items = this.itemManager.getRandomItemsFromPool(3, 'normal', true);
        options.push(...items.map(item => ({ ...item, type: 'item' })));

        return options.slice(0, 4);
    }

    draw() {
        // 清空
        this.ctx.fillStyle = '#1a1a2e';
        this.ctx.fillRect(0, 0, this.width, this.height);

        if (this.state === 'loading') {
            this.drawLoading();
            return;
        }

        // 相机变换
        this.camera.apply(this.ctx);

        // 绘制游戏世界
        this.drawWorld();

        this.camera.reset(this.ctx);

        // 绘制UI
        this.drawUI();
    }

    drawLoading() {
        this.ctx.fillStyle = '#0a0a14';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.ctx.fillStyle = '#4488ff';
        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('🐮 加载中...', this.width / 2, this.height / 2);
    }

    drawWorld() {
        // 地面网格
        this.ctx.strokeStyle = '#222233';
        this.ctx.lineWidth = 1;
        for (let x = 0; x < 1000; x += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, 1000);
            this.ctx.stroke();
        }
        for (let y = 0; y < 1000; y += 50) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(1000, y);
            this.ctx.stroke();
        }

        // 绘制区域效果
        for (const area of this.weaponManager.areas) {
            this.ctx.fillStyle = area.color + '60';
            this.ctx.beginPath();
            this.ctx.arc(area.x, area.y, area.radius, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // 绘制经验宝石
        for (const gem of this.expGems) gem.draw(this.ctx);
        for (const coin of this.coins) coin.draw(this.ctx);

        // 绘制武器效果
        this.weaponManager.draw(this.ctx);

        // 绘制敌人
        for (const enemy of this.enemies) {
            enemy.draw(this.ctx, this.spriteManager);
        }

        // 绘制玩家
        this.player.draw(this.ctx, this.spriteManager, this.itemManager);

        // 绘制粒子
        this.particles.draw(this.ctx);
    }

    drawUI() {
        // HUD背景
        this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this.ctx.fillRect(10, 10, 200, 100);

        // 生命值
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 16px Arial';
        this.ctx.textAlign = 'left';
        const hp = '❤️'.repeat(Math.max(0, Math.ceil(this.player.health)));
        this.ctx.fillText(hp, 20, 35);

        // 等级和经验
        this.ctx.fillStyle = '#4488ff';
        this.ctx.fillText(`Lv.${this.player.level} 经验:${Math.floor(this.player.exp)}`, 20, 60);

        // 金币
        this.ctx.fillStyle = '#ffcc00';
        this.ctx.fillText(`💰 ${this.player.gold}`, 20, 85);

        // 波次信息
        const waveInfo = this.waveManager.getWaveInfo();
        this.ctx.fillStyle = '#fff';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`波次 ${waveInfo.wave}`, this.width - 20, 35);
        this.ctx.fillText(`敌人: ${this.enemies.length}`, this.width - 20, 60);

        // 武器栏
        this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this.ctx.fillRect(10, this.height - 60, 400, 50);
        
        let wx = 20;
        for (const weapon of this.weaponManager.weapons) {
            this.ctx.fillStyle = '#333';
            this.ctx.fillRect(wx, this.height - 50, 40, 40);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '20px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(weapon.config.icon, wx + 20, this.height - 25);
            this.ctx.fillStyle = '#0f0';
            this.ctx.font = '10px Arial';
            this.ctx.fillText(`Lv${weapon.level}`, wx + 20, this.height - 15);
            wx += 50;
        }

        // 道具栏
        const items = this.itemManager.getOwnedItemsList();
        this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this.ctx.fillRect(this.width - 310, this.height - 60, 300, 50);
        
        let ix = this.width - 300;
        for (const item of items.slice(0, 6)) {
            const colors = {
                common: '#888',
                rare: '#4488ff',
                epic: '#aa44ff',
                legendary: '#ffcc00',
                cursed: '#ff4444'
            };
            this.ctx.strokeStyle = colors[item.rarity];
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(ix, this.height - 50, 40, 40);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(item.icon, ix + 20, this.height - 30);
            if (item.count > 1) {
                this.ctx.fillStyle = '#ff0';
                this.ctx.font = '10px Arial';
                this.ctx.fillText(item.count, ix + 35, this.height - 20);
            }
            ix += 45;
        }

        // 选择界面
        this.itemSelectionUI.draw(this.ctx, this.width, this.height);

        // 游戏结束
        if (this.state === 'gameover') {
            this.ctx.fillStyle = 'rgba(0,0,0,0.8)';
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.ctx.fillStyle = '#ff4444';
            this.ctx.font = 'bold 48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('游戏结束', this.width / 2, this.height / 2);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '24px Arial';
            this.ctx.fillText(`存活波次: ${this.waveManager.wave}`, this.width / 2, this.height / 2 + 50);
        }
    }

    loop(timestamp) {
        const dt = this.gameTimeManager.update(timestamp);
        this.update(dt);
        this.draw();
        requestAnimationFrame(t => this.loop(t));
    }
}

// ==================== 增强Player类 ====================
class Player extends Entity {
    constructor(x, y) {
        super(x, y, 24, 24);
        this.maxHealth = 6;
        this.health = 6;
        this.gold = 0;
        this.exp = 0;
        this.level = 1;
        this.facingRight = true;
        this.invincible = 0;
        this.canFly = false;
    }

    update(dt, itemManager, input) {
        const stats = itemManager.recalculateStats();
        const speed = 150 * stats.moveSpeed * (stats.timeScale || 1);

        this.vel = new Vec2(0, 0);
        
        if (input.keys['w'] || input.keys['ArrowUp']) this.vel.y = -speed;
        if (input.keys['s'] || input.keys['ArrowDown']) this.vel.y = speed;
        if (input.keys['a'] || input.keys['ArrowLeft']) { this.vel.x = -speed; this.facingRight = false; }
        if (input.keys['d'] || input.keys['ArrowRight']) { this.vel.x = speed; this.facingRight = true; }

        // 飞行能力
        this.canFly = stats.canFly;

        super.update(dt);

        // 边界
        this.x = Math.max(20, Math.min(880, this.x));
        this.y = Math.max(20, Math.min(580, this.y));

        if (this.invincible > 0) this.invincible -= dt;
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
        
        // 阴影
        if (!stats.canFly) {
            ctx.fillStyle = 'rgba(0,0,0,0.2)';
            ctx.beginPath();
            ctx.ellipse(this.x, this.y + 10, 10, 3, 0, 0, Math.PI * 2);
            ctx.fill();
        } else {
            const floatY = Math.sin(Date.now() / 200) * 3;
            spriteManager.draw(ctx, 'player_cow', this.x - 16, this.y - 16 + floatY, {
                width: 32, height: 32, flipX: !this.facingRight
            });
            return;
        }

        spriteManager.draw(ctx, 'player_cow', this.x - 16, this.y - 16, {
            width: 32, height: 32, flipX: !this.facingRight
        });

        if (this.invincible > 0 && Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.fillStyle = 'rgba(255,0,0,0.3)';
            ctx.fillRect(this.x - 16, this.y - 16, 32, 32);
        }
    }
}

// ==================== 导出 ====================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RougelikeCowGame, Player };
}
