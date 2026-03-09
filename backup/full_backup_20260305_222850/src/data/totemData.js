/**
 * 图腾数据与系统 - TotemSystem (深根之疫版)
 * v0.10.0 - 模块化重构
 */

const TOTEM_DATA = {
    // 6层对应的6个图腾
    ancestor: {
        name: '先祖图腾',
        icon: '🦴',
        stories: [
            '千年前，一颗陨星坠入草原深处，带来了来自群星的种子。',
            '角族的祖先发现了它，用地脉之力将其封印在深度休眠中。',
            '封印需要守护者血脉作为锚点，世代相传。'
        ],
        blessing: '初始HP +1'
    },
    resonance: {
        name: '共鸣图腾', 
        icon: '✨',
        stories: [
            '牛牛的双角在月光下会泛起淡金色的纹路，那是地脉共鸣者的标志。',
            '这种血脉让他能感知母虫的梦境渗透。',
            '在千根之心，金色纹路变成了与父毽交流的桥梁。'
        ],
        blessing: '攻击速度 +5%'
    },
    sacrifice: {
        name: '牺牲图腾',
        icon: '🔥',
        stories: [
            '"别下来。活下去。"那不是命令，那是爱。',
            '父亲宁愿自己死去，也要给儿子选择的权利。',
            '在最后一刻，父毽和母亲选择了成为永恒的封印。'
        ],
        blessing: '复活次数 +1'
    },
    choice: {
        name: '选择图腾',
        icon: '⚡',
        stories: [
            '断角长老说过："真正的力量不是征服，而是选择。"',
            '选择承受孤独，选择承担痛苦，选择——即使知道会输——也要战斗。',
            '母虫无法理解这种"非理性"的行为模式。'
        ],
        blessing: '初始金币 +50'
    },
    unity: {
        name: '羁绊图腾',
        icon: '💫',
        stories: [
            '母虫理解了牺牲，理解了爱，但从未理解两个独立意志的自愿融合。',
            '不是为了统一，而是为了保护对方的独立性。',
            '这是父毽给予母虫的"错误"——无法解析的情感bug。'
        ],
        blessing: '道具掉落率 +10%'
    },
    awakening: {
        name: '觉醒图腾',
        icon: '🌟',
        stories: [
            '在梦境间隙，据说可以短暂地与铁角和绒花并肩作战。',
            '收集齐七块祖先图腾，就能找到彻底净化母虫的方法。',
            '那是另一个故事了——关于如何让父母真正归来。'
        ],
        blessing: '移速 +10%'
    }
};

class TotemSystem {
    constructor() {
        this.collected = new Set();
        this.loadProgress();
    }
    
    collect(totemId) {
        if (TOTEM_DATA[totemId] && !this.collected.has(totemId)) {
            this.collected.add(totemId);
            this.saveProgress();
            this.applyBlessing(totemId);
            this.showCollectNotification(totemId);
            return true;
        }
        return false;
    }
    
    has(totemId) {
        return this.collected.has(totemId);
    }
    
    getCount() {
        return this.collected.size;
    }
    
    getAllTotems() {
        return Object.keys(TOTEM_DATA);
    }
    
    applyBlessing(totemId) {
        if (!window.game || !window.game.player) return;
        
        const blessings = {
            ancestor: () => { window.game.player.maxHp += 1; },
            resonance: () => { /* 攻击速度由其他系统处理 */ },
            sacrifice: () => { /* 复活次数由其他系统处理 */ },
            choice: () => { window.game.player.gold += 50; },
            unity: () => { /* 掉落率由其他系统处理 */ },
            awakening: () => { /* 移速由其他系统处理 */ }
        };
        
        if (blessings[totemId]) {
            blessings[totemId]();
        }
    }
    
    getTotalBlessings() {
        const texts = [];
        this.collected.forEach(id => {
            const data = TOTEM_DATA[id];
            if (data) texts.push(`${data.icon} ${data.name}: ${data.blessing}`);
        });
        return texts;
    }
    
    showCollectNotification(totemId) {
        const data = TOTEM_DATA[totemId];
        if (!data) return;
        
        const notif = document.createElement('div');
        notif.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: rgba(40, 30, 10, 0.95);
            border: 2px solid #fa0;
            border-radius: 8px;
            padding: 15px 20px;
            color: #fff;
            font-family: Arial, sans-serif;
            z-index: 10000;
            max-width: 300px;
            animation: slideIn 0.5s ease;
        `;
        notif.innerHTML = `
            <div style="color: #fa0; font-size: 12px; margin-bottom: 5px;">🦴 图腾收集</div>
            <div style="font-size: 24px; margin-bottom: 5px;">${data.icon}</div>
            <div style="font-size: 18px; font-weight: bold; color: #fa0;">${data.name}</div>
            <div style="font-size: 12px; color: #a64; margin-top: 5px;">${data.blessing}</div>
        `;
        
        document.body.appendChild(notif);
        
        setTimeout(() => {
            notif.style.animation = 'fadeOut 0.5s ease';
            setTimeout(() => notif.remove(), 500);
        }, 4000);
    }
    
    showTotemUI() {
        // 暂停游戏
        const wasPaused = window.game && window.game.paused;
        if (window.game) {
            window.game.paused = true;
        }
        
        const overlay = document.createElement('div');
        overlay.id = 'totemOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: Arial, sans-serif;
        `;
        
        const container = document.createElement('div');
        container.style.cssText = `
            width: 90%;
            max-width: 800px;
            max-height: 80%;
            background: rgba(30, 25, 15, 0.95);
            border: 2px solid #fa0;
            border-radius: 12px;
            padding: 30px;
            overflow-y: auto;
        `;
        
        let html = `
            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #fa0; margin: 0;">🦴 祖先图腾</h2>
                <p style="color: #888; margin-top: 10px;">收集图腾骨片，聆听角族的历史</p>
                <p style="color: #a64; font-size: 14px;">已收集: ${this.collected.size} / ${Object.keys(TOTEM_DATA).length}</p>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
        `;
        
        Object.entries(TOTEM_DATA).forEach(([key, data]) => {
            const isCollected = this.collected.has(key);
            html += `
                <div style="
                    background: rgba(255,255,255,0.03);
                    border: 1px solid ${isCollected ? '#fa0' : '#333'};
                    border-radius: 8px;
                    padding: 20px;
                    text-align: center;
                    opacity: ${isCollected ? 1 : 0.5};
                ">
                    <div style="font-size: 48px; margin-bottom: 10px;">${isCollected ? data.icon : '❓'}</div>
                    <div style="font-size: 18px; color: ${isCollected ? '#fa0' : '#666'}; font-weight: bold;">
                        ${isCollected ? data.name : '未发现的图腾'}
                    </div>
                    ${isCollected ? `
                        <div style="margin-top: 15px; text-align: left;">
                            ${data.stories.map(s => `<p style="margin: 8px 0; color: #888; font-size: 12px; line-height: 1.5;">• ${s}</p>`).join('')}
                        </div>
                        <div style="margin-top: 12px; padding: 8px; background: rgba(250, 170, 0, 0.1); border-radius: 4px; color: #fa0; font-size: 12px;">
                            ${data.blessing}
                        </div>
                    ` : '<div style="margin-top: 10px; color: #555; font-size: 12px;">在冒险中寻找...</div>'}
                </div>
            `;
        });
        
        html += `
            </div>
            <div style="text-align: center; margin-top: 30px;">
                <button id="totemCloseBtn" style="
                    padding: 12px 40px;
                    background: #fa0;
                    color: #000;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 16px;
                    font-weight: bold;
                ">关闭</button>
            </div>
        `;
        
        container.innerHTML = html;
        overlay.appendChild(container);
        document.body.appendChild(overlay);
        
        // 关闭按钮事件
        document.getElementById('totemCloseBtn').addEventListener('click', () => {
            overlay.remove();
            // 恢复游戏状态
            if (window.game && !wasPaused) {
                window.game.paused = false;
            }
        });
        
        const closeHandler = (e) => {
            if (e.target === overlay) {
                overlay.remove();
                // 恢复游戏状态
                if (window.game && !wasPaused) {
                    window.game.paused = false;
                }
            }
        };
        overlay.addEventListener('click', closeHandler);
    }
    
    saveProgress() {
        try {
            localStorage.setItem('cowTotems', JSON.stringify(Array.from(this.collected)));
        } catch (e) {
            console.warn('Failed to save totem progress:', e);
        }
    }
    
    loadProgress() {
        try {
            const saved = localStorage.getItem('cowTotems');
            if (saved) {
                const data = JSON.parse(saved);
                data.forEach(key => this.collected.add(key));
            }
        } catch (e) {
            console.warn('Failed to load totem progress:', e);
        }
    }
    
    reset() {
        this.collected.clear();
        localStorage.removeItem('cowTotems');
    }
}

// 创建全局实例
window.totemSystem = new TotemSystem();
