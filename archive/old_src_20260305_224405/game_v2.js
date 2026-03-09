// 肉鸽牛牛 v2.0 - 道具系统版
// 基于v1，添加道具掉落和三选一升级

// 在v1代码基础上添加以下类...

// ========== 道具定义 ==========
const ITEMS = {
    milk: {
        name: '浓缩牛奶',
        desc: '伤害 +1',
        color: '#FFF',
        icon: '🥛',
        effect: (player) => { player.damage += 1; }
    },
    clover: {
        name: '幸运草',
        desc: '暴击率 +10%',
        color: '#2ECC71',
        icon: '🍀',
        effect: (player) => { player.critChance = (player.critChance || 0) + 0.1; }
    },
    bell: {
        name: '金铃铛',
        desc: '攻击速度 +20%',
        color: '#F1C40F',
        icon: '🔔',
        effect: (player) => { player.attackSpeed = Math.max(5, player.attackSpeed * 0.8); }
    },
    heart: {
        name: '大心脏',
        desc: '最大生命 +1',
        color: '#E74C3C',
        icon: '❤️',
        effect: (player) => { 
            player.maxHp += 1; 
            player.hp += 1;
        }
    },
    boots: {
        name: '铁蹄靴',
        desc: '移动速度 +15%',
        color: '#9B59B6',
        icon: '👢',
        effect: (player) => { player.speed *= 1.15; }
    },
    horn: {
        name: '牛角盔',
        desc: '击退效果 +50%',
        color: '#34495E',
        icon: '🦬',
        effect: (player) => { player.knockback = (player.knockback || 0) + 0.5; }
    }
};

class ItemDrop {
    constructor(x, y, itemKey) {
        this.x = x;
        this.y = y;
        this.itemKey = itemKey;
        this.radius = 16;
        this.active = true;
        this.bobOffset = Math.random() * Math.PI * 2;
    }
    
    update(player) {
        // 漂浮动画
        this.bobOffset += 0.05;
        
        // 拾取检测
        const dist = Math.hypot(this.x - player.x, this.y - player.y);
        if (dist < this.radius + player.radius) {
            this.active = false;
            return this.itemKey;
        }
        return null;
    }
    
    draw(ctx) {
        const item = ITEMS[this.itemKey];
        const bob = Math.sin(this.bobOffset) * 3;
        
        // 背景圈
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.arc(this.x, this.y + bob + 16, 12, 0, Math.PI * 2);
        ctx.fill();
        
        // 物品光晕
        ctx.fillStyle = item.color + '40';
        ctx.beginPath();
        ctx.arc(this.x, this.y + bob, 20, 0, Math.PI * 2);
        ctx.fill();
        
        // 物品背景
        ctx.fillStyle = '#2C3E50';
        ctx.fillRect(this.x - 14, this.y + bob - 14, 28, 28);
        ctx.strokeStyle = item.color;
        ctx.lineWidth = 2;
        ctx.strokeRect(this.x - 14, this.y + bob - 14, 28, 28);
        
        // 图标（用简单图形代替emoji）
        ctx.fillStyle = item.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y + bob, 8, 0, Math.PI * 2);
        ctx.fill();
    }
}

// ========== 升级界面 ==========
class LevelUpMenu {
    constructor() {
        this.visible = false;
        this.options = [];
        this.selected = -1;
    }
    
    show(player) {
        this.visible = true;
        // 随机3个选项
        const keys = Object.keys(ITEMS);
        this.options = [];
        while (this.options.length < 3) {
            const key = keys[Math.floor(Math.random() * keys.length)];
            if (!this.options.includes(key)) {
                this.options.push(key);
            }
        }
        
        // 显示菜单
        const menu = document.getElementById('levelUpMenu');
        const container = document.getElementById('upgradeOptions');
        menu.style.display = 'block';
        
        container.innerHTML = this.options.map((key, idx) => {
            const item = ITEMS[key];
            return `
                <div class="upgradeOption" onclick="window.selectUpgrade(${idx})">
                    <div class="name">${item.icon} ${item.name}</div>
                    <div class="desc">${item.desc}</div>
                </div>
            `;
        }).join('');
        
        // 暂停游戏
        window.currentState = 'PAUSED';
    }
    
    select(index, player) {
        const key = this.options[index];
        ITEMS[key].effect(player);
        
        this.visible = false;
        document.getElementById('levelUpMenu').style.display = 'none';
        window.currentState = 'PLAYING';
        
        // 显示获得提示
        console.log(`获得: ${ITEMS[key].name}`);
    }
}

// ========== 修改Game类 ==========
class GameV2 extends Game {
    constructor() {
        super();
        this.itemDrops = [];
        this.levelUpMenu = new LevelUpMenu();
        this.player.critChance = 0;
        this.player.knockback = 0;
        
        // 绑定选择事件
        window.selectUpgrade = (idx) => this.levelUpMenu.select(idx, this.player);
    }
    
    spawnEnemy(type) {
        let x, y;
        if (Math.random() < 0.5) {
            x = Math.random() < 0.5 ? -60 : GAME_WIDTH + 60;
            y = Math.random() * GAME_HEIGHT;
        } else {
            x = Math.random() * GAME_WIDTH;
            y = Math.random() < 0.5 ? -60 : GAME_HEIGHT + 60;
        }
        this.enemies.push(new Enemy(x, y, type));
    }
    
    update() {
        if (currentState === 'PAUSED') return;
        if (currentState !== GameState.PLAYING) return;
        
        gameTime += 1/60;
        this.waveTimer++;
        
        // 生成敌人
        const spawnRate = Math.max(20, 100 - this.wave * 3);
        if (this.waveTimer % spawnRate === 0) {
            this.spawnEnemy();
        }
        
        // 波数
        if (this.waveTimer % 1800 === 0) {
            this.wave++;
        }
        
        // 更新子弹...
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.update();
            if (!b.active) {
                this.bullets.splice(i, 1);
                continue;
            }
            
            // 暴击检查
            let isCrit = Math.random() < (this.player.critChance || 0);
            let dmg = isCrit ? b.damage * 2 : b.damage;
            
            for (let j = this.enemies.length - 1; j >= 0; j--) {
                const e = this.enemies[j];
                if (Math.hypot(b.x - e.x, b.y - e.y) < e.radius + b.radius) {
                    b.active = false;
                    
                    // 击退
                    if (this.player.knockback > 0) {
                        const kb = this.player.knockback * 10;
                        const dx = e.x - this.player.x;
                        const dy = e.y - this.player.y;
                        const dist = Math.hypot(dx, dy);
                        e.x += (dx / dist) * kb;
                        e.y += (dy / dist) * kb;
                    }
                    
                    if (e.takeDamage(dmg)) {
                        // 死亡掉落
                        this.expGems.push(new ExpGem(e.x, e.y, e.type === 'boss' ? 50 : 10));
                        
                        // 10%掉落道具（Boss必掉）
                        if (e.type === 'boss' || Math.random() < 0.1) {
                            const itemKeys = Object.keys(ITEMS);
                            const randomItem = itemKeys[Math.floor(Math.random() * itemKeys.length)];
                            this.itemDrops.push(new ItemDrop(e.x, e.y, randomItem));
                        }
                        
                        this.enemies.splice(j, 1);
                        this.enemiesKilled++;
                    }
                    break;
                }
            }
        }
        
        // 更新经验
        for (let i = this.expGems.length - 1; i >= 0; i--) {
            if (this.expGems[i].update(this.player)) {
                const leveledUp = this.player.gainExp(this.expGems[i].value);
                this.expGems.splice(i, 1);
                
                if (leveledUp && !this.levelUpMenu.visible) {
                    this.levelUpMenu.show(this.player);
                }
            }
        }
        
        // 更新道具掉落
        for (let i = this.itemDrops.length - 1; i >= 0; i--) {
            const item = this.itemDrops[i].update(this.player);
            if (item) {
                // 直接应用道具效果
                ITEMS[item].effect(this.player);
                this.itemDrops.splice(i, 1);
                
                // 显示提示
                this.showFloatingText(`+${ITEMS[item].name}`, this.player.x, this.player.y - 40, ITEMS[item].color);
            }
        }
        
        // 更新敌人...
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            e.update(this.player, this.enemies);
            
            if (Math.hypot(e.x - this.player.x, e.y - this.player.y) < e.radius + this.player.radius) {
                if (this.player.takeDamage(1)) {
                    this.gameOver();
                }
            }
        }
        
        this.player.update(Input, this.enemies, this.bullets);
        this.updateUI();
    }
    
    showFloatingText(text, x, y, color) {
        // 简单的浮动文字效果（可以扩展）
        console.log(text);
    }
    
    draw() {
        super.draw();
        
        // 绘制道具
        for (let item of this.itemDrops) {
            item.draw(ctx);
        }
    }
}

// 启动
async function initV2() {
    Input.init();
    
    try {
        await Assets.load('enemy_pig', 'assets/enemies/enemy_pig.png');
        await Assets.load('enemy_chick', 'assets/enemies/enemy_chick.png');
        await Assets.load('boss_dog', 'assets/enemies/boss_dog.png');
    } catch(e) {}
    
    const game = new GameV2();
    
    function loop() {
        game.update();
        game.draw();
        requestAnimationFrame(loop);
    }
    
    loop();
}

initV2();
