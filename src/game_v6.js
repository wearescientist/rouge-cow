// 肉鸽牛牛 v6.0 - 存档和元成长系统
// 永久升级，跨局成长

// ========== 存档系统 ==========
class SaveSystem {
    constructor() {
        this.key = 'rougelike_cow_save';
        this.data = this.load();
    }
    
    load() {
        try {
            const saved = localStorage.getItem(this.key);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch(e) {
            console.log('存档加载失败');
        }
        return this.getDefaultData();
    }
    
    save() {
        try {
            localStorage.setItem(this.key, JSON.stringify(this.data));
        } catch(e) {
            console.log('存档失败');
        }
    }
    
    getDefaultData() {
        return {
            // 牧场等级（元货币）
            milkCoins: 0,
            
            // 永久升级
            upgrades: {
                startHp: 0,        // 初始生命+1
                startDamage: 0,    // 初始伤害+1
                startSpeed: 0,     // 初始速度+5%
                expBonus: 0,       // 经验获取+10%
                coinBonus: 0       // 金币获取+10%
            },
            
            // 解锁内容
            unlocked: {
                characters: ['cow'],  // 解锁的角色
                weapons: ['milk']     // 解锁的武器
            },
            
            // 统计
            stats: {
                totalRuns: 0,
                totalKills: 0,
                totalDeaths: 0,
                bestTime: 0,
                bestWave: 0,
                bestLevel: 0
            },
            
            // 成就
            achievements: []
        };
    }
    
    // 增加牧场币
    addMilkCoins(amount) {
        this.data.milkCoins += amount;
        this.save();
    }
    
    // 购买升级
    buyUpgrade(upgradeKey) {
        const costs = {
            startHp: (level) => 50 * Math.pow(2, level),
            startDamage: (level) => 100 * Math.pow(2, level),
            startSpeed: (level) => 80 * Math.pow(2, level),
            expBonus: (level) => 60 * Math.pow(2, level),
            coinBonus: (level) => 60 * Math.pow(2, level)
        };
        
        const currentLevel = this.data.upgrades[upgradeKey];
        const cost = costs[upgradeKey](currentLevel);
        
        if (this.data.milkCoins >= cost) {
            this.data.milkCoins -= cost;
            this.data.upgrades[upgradeKey]++;
            this.save();
            return true;
        }
        return false;
    }
    
    // 更新统计
    updateStats(runStats) {
        const s = this.data.stats;
        s.totalRuns++;
        s.totalKills += runStats.kills || 0;
        s.totalDeaths++;
        
        if (runStats.time > s.bestTime) s.bestTime = runStats.time;
        if (runStats.wave > s.bestWave) s.bestWave = runStats.wave;
        if (runStats.level > s.bestLevel) s.bestLevel = runStats.level;
        
        this.save();
    }
    
    // 应用永久加成到玩家
    applyPermanentBonuses(player) {
        const u = this.data.upgrades;
        player.maxHp += u.startHp;
        player.hp += u.startHp;
        player.damage += u.startDamage;
        player.speed *= (1 + u.startSpeed * 0.05);
        player.expBonus = 1 + u.expBonus * 0.1;
        player.coinBonus = 1 + u.coinBonus * 0.1;
    }
}

// ========== 牧场（主菜单） ==========
class Ranch {
    constructor(saveSystem) {
        this.save = saveSystem;
        this.visible = true;
    }
    
    render() {
        // 绘制牧场界面HTML
        const ranchDiv = document.getElementById('ranch') || this.createRanchUI();
        ranchDiv.style.display = this.visible ? 'block' : 'none';
    }
    
    createRanchUI() {
        const div = document.createElement('div');
        div.id = 'ranch';
        div.innerHTML = `
            <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:#2d1b2e;z-index:100;color:white;padding:40px;overflow:auto;">
                <h1>🏠 牧场（主基地）</h1>
                <div style="margin:20px 0;font-size:24px;">
                    🥛 牛奶币: <span id="milkCoins">${this.save.data.milkCoins}</span>
                </div>
                
                <div style="display:flex;gap:40px;margin-top:40px;">
                    <!-- 永久升级 -->
                    <div style="flex:1;background:rgba(0,0,0,0.3);padding:20px;border-radius:10px;">
                        <h2>🔧 永久升级</h2>
                        <div id="upgradeList"></div>
                    </div>
                    
                    <!-- 统计 -->
                    <div style="flex:1;background:rgba(0,0,0,0.3);padding:20px;border-radius:10px;">
                        <h2>📊 统计</h2>
                        <div id="statsList"></div>
                    </div>
                </div>
                
                <button onclick="window.startGame()" style="margin-top:40px;padding:20px 40px;font-size:24px;background:#27ae60;color:white;border:none;border-radius:10px;cursor:pointer;">
                    🎮 开始冒险
                </button>
            </div>
        `;
        document.body.appendChild(div);
        this.updateUpgradeList();
        this.updateStatsList();
        return div;
    }
    
    updateUpgradeList() {
        const list = document.getElementById('upgradeList');
        if (!list) return;
        
        const upgrades = [
            { key: 'startHp', name: '强壮体魄', desc: '初始生命+1', icon: '❤️' },
            { key: 'startDamage', name: '锋利牛角', desc: '初始伤害+1', icon: '🦬' },
            { key: 'startSpeed', name: '轻快蹄子', desc: '移动速度+5%', icon: '👢' },
            { key: 'expBonus', name: '智慧大脑', desc: '经验获取+10%', icon: '🧠' },
            { key: 'coinBonus', name: '幸运草', desc: '金币获取+10%', icon: '🍀' }
        ];
        
        const costs = [50, 100, 80, 60, 60];
        
        list.innerHTML = upgrades.map((u, i) => {
            const level = this.save.data.upgrades[u.key];
            const cost = costs[i] * Math.pow(2, level);
            const canAfford = this.save.data.milkCoins >= cost;
            
            return `
                <div style="margin:15px 0;padding:15px;background:rgba(255,255,255,0.1);border-radius:5px;">
                    <div style="font-size:20px;">${u.icon} ${u.name} (Lv.${level})</div>
                    <div style="color:#aaa;">${u.desc}</div>
                    <button onclick="window.buyUpgrade('${u.key}')" 
                        style="margin-top:10px;padding:8px 16px;background:${canAfford ? '#27ae60' : '#555'};color:white;border:none;border-radius:5px;cursor:${canAfford ? 'pointer' : 'not-allowed'};">
                        升级 (${cost}🥛)
                    </button>
                </div>
            `;
        }).join('');
    }
    
    updateStatsList() {
        const list = document.getElementById('statsList');
        if (!list) return;
        
        const s = this.save.data.stats;
        const mins = Math.floor(s.bestTime / 60);
        const secs = s.bestTime % 60;
        
        list.innerHTML = `
            <div style="margin:10px 0;">总冒险次数: ${s.totalRuns}</div>
            <div style="margin:10px 0;">总击杀数: ${s.totalKills}</div>
            <div style="margin:10px 0;">死亡次数: ${s.totalDeaths}</div>
            <div style="margin:10px 0;">最长存活: ${mins}分${secs}秒</div>
            <div style="margin:10px 0;">最高波数: ${s.bestWave}</div>
            <div style="margin:10px 0;">最高等级: ${s.bestLevel}</div>
        `;
    }
    
    hide() {
        this.visible = false;
        const div = document.getElementById('ranch');
        if (div) div.style.display = 'none';
    }
    
    show() {
        this.visible = true;
        const div = document.getElementById('ranch');
        if (div) {
            div.style.display = 'block';
            this.updateUpgradeList();
            this.updateStatsList();
        }
    }
}

// ========== 游戏结束结算 ==========
class GameOverScreen {
    constructor(saveSystem) {
        this.save = saveSystem;
    }
    
    show(stats) {
        // 计算奖励
        const baseReward = stats.kills * 2 + stats.wave * 10 + stats.level * 5;
        const timeBonus = Math.floor(stats.time / 10);
        const totalReward = baseReward + timeBonus;
        
        this.save.addMilkCoins(totalReward);
        this.save.updateStats(stats);
        
        // 显示结算界面
        const div = document.createElement('div');
        div.innerHTML = `
            <div style="position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);z-index:200;color:white;display:flex;flex-direction:column;justify-content:center;align-items:center;">
                <h1 style="color:#e74c3c;font-size:48px;">GAME OVER</h1>
                <div style="font-size:24px;margin:20px;">
                    <div>存活时间: ${Math.floor(stats.time / 60)}:${(stats.time % 60).toString().padStart(2, '0')}</div>
                    <div>击败敌人: ${stats.kills}</div>
                    <div>达到波数: ${stats.wave}</div>
                    <div>最终等级: ${stats.level}</div>
                </div>
                <div style="font-size:32px;color:#f1c40f;margin:20px;">
                    获得 🥛 ${totalReward} 牛奶币!
                </div>
                <button onclick="window.returnToRanch()" style="padding:15px 30px;font-size:24px;background:#3498db;color:white;border:none;border-radius:10px;cursor:pointer;margin:10px;">
                    🏠 返回牧场
                </button>
                <button onclick="window.restartGame()" style="padding:15px 30px;font-size:24px;background:#27ae60;color:white;border:none;border-radius:10px;cursor:pointer;margin:10px;">
                    🔄 再次冒险
                </button>
            </div>
        `;
        document.body.appendChild(div);
    }
}

// 全局函数
window.buyUpgrade = function(key) {
    if (window.saveSystem.buyUpgrade(key)) {
        window.ranch.updateUpgradeList();
        document.getElementById('milkCoins').textContent = window.saveSystem.data.milkCoins;
    }
};

window.returnToRanch = function() {
    location.reload(); // 简单刷新回到牧场
};

window.restartGame = function() {
    location.reload();
};

console.log('Save system loaded');
