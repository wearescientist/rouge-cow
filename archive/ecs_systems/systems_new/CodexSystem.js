/**
 * CodexSystem - 图鉴系统
 * 敌人/道具/宠物/武器收集图鉴
 */

class CodexSystem {
    constructor(world) {
        this.world = world;
        this.priority = 260;
        this.enabled = true;
        
        // 图鉴数据
        this.codex = {
            enemies: new Map(),
            items: new Map(),
            pets: new Map(),
            weapons: new Map(),
            bosses: new Map()
        };
        
        // 解锁状态
        this.unlocked = {
            enemies: new Set(),
            items: new Set(),
            pets: new Set(),
            weapons: new Set(),
            bosses: new Set()
        };
        
        // 统计
        this.stats = {
            totalKills: 0,
            uniqueKills: new Set(),
            itemsCollected: 0,
            petsUnlocked: 0,
            weaponsCrafted: 0,
            bossesDefeated: new Set()
        };
        
        this.isUIOpen = false;
        this.currentTab = 'enemies';
    }
    
    init() {
        this.initCodexData();
        
        // 监听事件
        this.world.on('entityDestroyed', (entity) => {
            if (entity.hasTag('enemy')) {
                this.onEnemyKilled(entity);
            }
        });
        
        this.world.on('itemPickedUp', (data) => {
            this.unlockItem(data.itemId);
        });
        
        this.world.on('petUnlocked', (data) => {
            this.unlockPet(data.petId);
        });
        
        this.world.on('weaponCrafted', (data) => {
            this.unlockWeapon(data.result);
        });
        
        this.world.on('bossKilled', (data) => {
            this.unlockBoss(data.boss.id);
        });
        
        // 按键监听
        this.world.on('keyPressed', (key) => {
            if (key === 'c' || key === 'C') {
                this.toggleUI();
            }
        });
    }
    
    /**
     * 初始化图鉴数据
     */
    initCodexData() {
        // 敌人图鉴
        const enemySpawn = this.world.getSystem(EnemySpawnSystem);
        if (enemySpawn && enemySpawn.enemyData) {
            for (const [key, data] of Object.entries(enemySpawn.enemyData)) {
                this.codex.enemies.set(key, {
                    id: key,
                    name: data.name,
                    description: this.getEnemyDescription(key),
                    tier: data.isBoss ? 4 : data.isMiniBoss ? 3 : data.isElite ? 2 : 1,
                    killCount: 0,
                    icon: this.getEnemyIcon(key)
                });
            }
        }
        
        // 道具图鉴（从ItemSystem获取）
        const itemSystem = this.world.getSystem(ItemSystem);
        if (itemSystem && itemSystem.itemDatabase) {
            for (const [key, data] of itemSystem.itemDatabase) {
                this.codex.items.set(key, {
                    id: key,
                    name: data.name,
                    type: data.type,
                    rarity: data.rarity,
                    description: data.description,
                    effect: data.effectType,
                    collectedCount: 0,
                    icon: data.icon
                });
            }
        }
        
        // 宠物图鉴
        const petSystem = this.world.getSystem(PetSystem);
        if (petSystem && petSystem.petDatabase) {
            for (const [key, data] of petSystem.petDatabase) {
                this.codex.pets.set(key, {
                    id: key,
                    name: data.name,
                    type: data.type,
                    rarity: data.rarity,
                    description: data.description,
                    ability: data.ability?.name,
                    unlocked: false,
                    icon: data.icon
                });
            }
        }
        
        // 武器图鉴
        const weaponSystem = this.world.getSystem(WeaponSystem);
        if (weaponSystem && weaponSystem.weaponDatabase) {
            for (const [key, data] of weaponSystem.weaponDatabase) {
                this.codex.weapons.set(key, {
                    id: key,
                    name: data.name,
                    type: data.type,
                    damage: data.damage,
                    description: data.description,
                    crafted: false,
                    icon: data.icon
                });
            }
        }
        
        // Boss图鉴
        const bossSystem = this.world.getSystem(BossSystem);
        if (bossSystem && bossSystem.bossDatabase) {
            for (const [key, data] of bossSystem.bossDatabase) {
                this.codex.bosses.set(key, {
                    id: key,
                    name: data.name,
                    floor: data.floor,
                    health: data.health,
                    description: data.description || `第${data.floor}层Boss`,
                    phases: data.phases.length,
                    defeated: false,
                    bestTime: null,
                    noDamage: false
                });
            }
        }
    }
    
    getEnemyDescription(key) {
        const descriptions = {
            'slime': '最基础的敌人，移动缓慢但数量众多',
            'goblin': '贪婪的小怪物，喜欢成群结队',
            'chick': '被感染的家禽，虽然弱小但速度很快',
            'mouse': '在下水道中变异的老鼠，极其敏捷',
            'snail': '移动极慢但外壳坚硬',
            'pigeon': '变异的飞行生物，可以从空中攻击',
            'rabbit2': '速度极快的变异兔，难以瞄准',
            'bee': '会飞的毒虫，攻击附带毒素',
            'panther': '潜行的猎手，会从阴影中突袭',
            'crab': '拥有坚硬外壳的甲壳类生物',
            'bear': '力量巨大的猛兽，一击致命',
            'ghost': '半透明的幽灵，可以穿透墙壁',
            'turtle': '古老的生物，拥有极高的防御',
            'mimic': '伪装成宝箱的怪物，小心！',
            'boss_goblinKing': '哥布林的王者，可以召唤手下',
            'boss_lich': '不死的巫妖，掌控死亡魔法',
            'boss_wolfKing': '狼群之王，速度与力量的结合',
            'boss_dragon': '远古巨龙，毁灭一切的存在'
        };
        return descriptions[key] || '神秘的敌人';
    }
    
    getEnemyIcon(key) {
        const icons = {
            'slime': '🟢', 'goblin': '👺', 'chick': '🐤', 'mouse': '🐭',
            'snail': '🐌', 'pigeon': '🕊️', 'rabbit2': '🐇', 'bee': '🐝',
            'panther': '🐆', 'crab': '🦀', 'bear': '🐻', 'ghost': '👻',
            'turtle': '🐢', 'mimic': '📦', 'boss_goblinKing': '👑',
            'boss_lich': '💀', 'boss_wolfKing': '🐺', 'boss_dragon': '🐉'
        };
        return icons[key] || '❓';
    }
    
    onEnemyKilled(enemy) {
        const enemyComp = enemy.get(EnemyComponent);
        if (!enemyComp) return;
        
        const key = enemyComp.enemyType;
        const data = this.codex.enemies.get(key);
        
        if (data) {
            data.killCount++;
            this.unlocked.enemies.add(key);
            this.stats.totalKills++;
            this.stats.uniqueKills.add(key);
        }
    }
    
    unlockItem(itemId) {
        const data = this.codex.items.get(itemId);
        if (data) {
            data.collectedCount++;
            this.unlocked.items.add(itemId);
            this.stats.itemsCollected++;
        }
    }
    
    unlockPet(petId) {
        const data = this.codex.pets.get(petId);
        if (data) {
            data.unlocked = true;
            this.unlocked.pets.add(petId);
            this.stats.petsUnlocked++;
        }
    }
    
    unlockWeapon(weaponId) {
        const data = this.codex.weapons.get(weaponId);
        if (data) {
            data.crafted = true;
            this.unlocked.weapons.add(weaponId);
            this.stats.weaponsCrafted++;
        }
    }
    
    unlockBoss(bossId) {
        const data = this.codex.bosses.get(bossId);
        if (data) {
            data.defeated = true;
            this.unlocked.bosses.add(bossId);
            this.stats.bossesDefeated.add(bossId);
        }
    }
    
    toggleUI() {
        this.isUIOpen = !this.isUIOpen;
        if (this.isUIOpen) {
            this.world.emit('gamePaused');
        } else {
            this.world.emit('gameResumed');
        }
    }
    
    switchTab(tab) {
        this.currentTab = tab;
    }
    
    render(ctx) {
        if (!this.isUIOpen) return;
        
        const canvas = ctx.canvas;
        const w = canvas.width;
        const h = canvas.height;
        
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
        ctx.fillRect(0, 0, w, h);
        
        // 窗口
        const winW = 800;
        const winH = 600;
        const winX = (w - winW) / 2;
        const winY = (h - winH) / 2;
        
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(winX, winY, winW, winH);
        ctx.strokeStyle = '#f1c40f';
        ctx.lineWidth = 3;
        ctx.strokeRect(winX, winY, winW, winH);
        
        // 标题
        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 32px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('📚 图鉴', w / 2, winY + 40);
        
        // 标签页
        this.renderTabs(ctx, winX, winY + 60, winW);
        
        // 内容区域
        this.renderContent(ctx, winX + 20, winY + 100, winW - 40, winH - 120);
        
        // 关闭提示
        ctx.fillStyle = '#888';
        ctx.font = '14px Arial';
        ctx.fillText('按 [C] 关闭', w / 2, winY + winH - 20);
    }
    
    renderTabs(ctx, x, y, w) {
        const tabs = [
            { id: 'enemies', name: '敌人', icon: '👹' },
            { id: 'items', name: '道具', icon: '🎒' },
            { id: 'pets', name: '宠物', icon: '🐾' },
            { id: 'weapons', name: '武器', icon: '⚔️' },
            { id: 'bosses', name: 'Boss', icon: '👑' }
        ];
        
        const tabW = w / tabs.length;
        
        tabs.forEach((tab, i) => {
            const tabX = x + i * tabW;
            const isActive = this.currentTab === tab.id;
            
            // 背景
            ctx.fillStyle = isActive ? '#2980b9' : '#2c3e50';
            ctx.fillRect(tabX, y, tabW, 35);
            
            // 边框
            ctx.strokeStyle = isActive ? '#f1c40f' : '#555';
            ctx.lineWidth = isActive ? 2 : 1;
            ctx.strokeRect(tabX, y, tabW, 35);
            
            // 文字
            ctx.fillStyle = '#fff';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`${tab.icon} ${tab.name}`, tabX + tabW / 2, y + 23);
        });
    }
    
    renderContent(ctx, x, y, w, h) {
        switch (this.currentTab) {
            case 'enemies':
                this.renderEnemiesTab(ctx, x, y, w, h);
                break;
            case 'items':
                this.renderItemsTab(ctx, x, y, w, h);
                break;
            case 'pets':
                this.renderPetsTab(ctx, x, y, w, h);
                break;
            case 'weapons':
                this.renderWeaponsTab(ctx, x, y, w, h);
                break;
            case 'bosses':
                this.renderBossesTab(ctx, x, y, w, h);
                break;
        }
    }
    
    renderEnemiesTab(ctx, x, y, w, h) {
        const items = Array.from(this.codex.enemies.values());
        const cols = 4;
        const itemW = w / cols;
        const itemH = 80;
        
        let row = 0;
        items.forEach((item, i) => {
            const col = i % cols;
            const ix = x + col * itemW;
            const iy = y + row * itemH;
            
            const unlocked = this.unlocked.enemies.has(item.id);
            
            // 背景
            ctx.fillStyle = unlocked ? '#2c3e50' : '#1a1a1a';
            ctx.fillRect(ix + 5, iy, itemW - 10, itemH - 5);
            
            // 图标
            ctx.font = '30px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(unlocked ? item.icon : '❓', ix + itemW / 2, iy + 35);
            
            // 名字
            ctx.fillStyle = unlocked ? '#fff' : '#666';
            ctx.font = '12px Arial';
            ctx.fillText(unlocked ? item.name : '???', ix + itemW / 2, iy + 55);
            
            // 击杀数
            if (unlocked && item.killCount > 0) {
                ctx.fillStyle = '#f1c40f';
                ctx.font = '10px Arial';
                ctx.fillText(`击杀: ${item.killCount}`, ix + itemW / 2, iy + 70);
            }
            
            if (col === cols - 1) row++;
        });
        
        // 统计
        ctx.fillStyle = '#888';
        ctx.font = '14px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`已解锁: ${this.unlocked.enemies.size}/${items.length} | 总击杀: ${this.stats.totalKills}`, x, y + h - 10);
    }
    
    renderItemsTab(ctx, x, y, w, h) {
        const items = Array.from(this.codex.items.values());
        const listH = 60;
        
        items.slice(0, 10).forEach((item, i) => {
            const iy = y + i * listH;
            const unlocked = this.unlocked.items.has(item.id);
            
            // 背景
            ctx.fillStyle = i % 2 === 0 ? '#2c3e50' : '#34495e';
            ctx.fillRect(x, iy, w, listH - 5);
            
            // 图标
            ctx.font = '24px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(unlocked ? (item.icon || '📦') : '❓', x + 10, iy + 35);
            
            // 信息
            if (unlocked) {
                ctx.fillStyle = '#fff';
                ctx.font = 'bold 14px Arial';
                ctx.fillText(item.name, x + 50, iy + 20);
                
                ctx.fillStyle = '#aaa';
                ctx.font = '12px Arial';
                ctx.fillText(item.description.substring(0, 40), x + 50, iy + 38);
                
                ctx.fillStyle = '#f1c40f';
                ctx.fillText(`收集: ${item.collectedCount}`, x + 50, iy + 52);
            } else {
                ctx.fillStyle = '#666';
                ctx.font = '14px Arial';
                ctx.fillText('???', x + 50, iy + 30);
            }
        });
    }
    
    renderPetsTab(ctx, x, y, w, h) {
        const items = Array.from(this.codex.pets.values());
        const cols = 3;
        const itemW = w / cols;
        const itemH = 100;
        
        let row = 0;
        items.forEach((item, i) => {
            const col = i % cols;
            const ix = x + col * itemW;
            const iy = y + row * itemH;
            
            // 背景
            ctx.fillStyle = item.unlocked ? '#27ae60' : '#2c3e50';
            ctx.fillRect(ix + 5, iy, itemW - 10, itemH - 5);
            
            // 图标
            ctx.font = '36px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(item.unlocked ? item.icon : '❓', ix + itemW / 2, iy + 40);
            
            // 名字
            ctx.fillStyle = item.unlocked ? '#fff' : '#888';
            ctx.font = '14px Arial';
            ctx.fillText(item.unlocked ? item.name : '???', ix + itemW / 2, iy + 65);
            
            // 类型
            if (item.unlocked) {
                ctx.font = '11px Arial';
                ctx.fillStyle = '#ccc';
                ctx.fillText(item.type, ix + itemW / 2, iy + 82);
            }
            
            if (col === cols - 1) row++;
        });
    }
    
    renderWeaponsTab(ctx, x, y, w, h) {
        const items = Array.from(this.codex.weapons.values());
        
        items.forEach((item, i) => {
            const iy = y + i * 50;
            
            ctx.fillStyle = item.crafted ? '#e67e22' : '#2c3e50';
            ctx.fillRect(x, iy, w, 45);
            
            ctx.font = '20px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(item.crafted ? (item.icon || '⚔️') : '❓', x + 10, iy + 28);
            
            ctx.fillStyle = item.crafted ? '#fff' : '#666';
            ctx.font = 'bold 14px Arial';
            ctx.fillText(item.crafted ? item.name : '???', x + 45, iy + 25);
            
            if (item.crafted) {
                ctx.fillStyle = '#f1c40f';
                ctx.font = '12px Arial';
                ctx.fillText('✓ 已合成', x + w - 80, iy + 25);
            }
        });
    }
    
    renderBossesTab(ctx, x, y, w, h) {
        const items = Array.from(this.codex.bosses.values());
        
        items.forEach((item, i) => {
            const iy = y + i * 70;
            
            // 背景
            const gradient = ctx.createLinearGradient(x, iy, x + w, iy);
            if (item.defeated) {
                gradient.addColorStop(0, '#8e44ad');
                gradient.addColorStop(1, '#2c3e50');
            } else {
                gradient.addColorStop(0, '#2c3e50');
                gradient.addColorStop(1, '#1a1a1a');
            }
            ctx.fillStyle = gradient;
            ctx.fillRect(x, iy, w, 65);
            
            // 名字
            ctx.fillStyle = item.defeated ? '#f1c40f' : '#666';
            ctx.font = 'bold 18px Arial';
            ctx.textAlign = 'left';
            ctx.fillText(item.defeated ? item.name : '???', x + 15, iy + 28);
            
            // 信息
            if (item.defeated) {
                ctx.fillStyle = '#aaa';
                ctx.font = '12px Arial';
                ctx.fillText(`第${item.floor}层 | ${item.phases}个阶段`, x + 15, iy + 48);
                
                if (item.noDamage) {
                    ctx.fillStyle = '#e74c3c';
                    ctx.fillText('♦ 无伤通关', x + w - 100, iy + 30);
                }
            } else {
                ctx.fillStyle = '#555';
                ctx.font = '12px Arial';
                ctx.fillText('未击败', x + 15, iy + 48);
            }
        });
    }
    
    update(dt) {}
}

window.CodexSystem = CodexSystem;
