/**
 * DebugPanel.js - 调试面板系统 (完整版)
 * 从 Game 类分离的调试功能
 */

class DebugPanel {
    constructor(game) {
        this.game = game;
        this.showHitboxDebug = false;
        this.visible = false;
        
        this.init();
    }
    
    init() {
        // 绑定键盘快捷键
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F9') {
                this.toggle();
            }
        });
    }
    
    ensurePanel() {
        if (!document.getElementById('debugPanel')) {
            this.createPanel();
        }
    }
    
    createPanel() {
        if (document.getElementById('debugPanel')) return;
        
        const panel = document.createElement('div');
        panel.id = 'debugPanel';
        panel.style.cssText = 'display:none;position:fixed;top:10px;right:10px;background:rgba(0,0,0,0.9);border:1px solid #444;border-radius:8px;padding:10px;width:280px;z-index:99999;font-size:12px;color:#fff;';
        
        panel.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;border-bottom:1px solid #444;padding-bottom:5px;">
                <span style="font-weight:bold;color:#4f4;">🐛 调试面板 (F9)</span>
                <button onclick="window.game.debugPanel.toggle()" style="background:#f44;border:none;color:#fff;border-radius:3px;cursor:pointer;padding:2px 8px;">×</button>
            </div>
            
            <!-- 速度控制 -->
            <div style="margin-bottom:8px;">
                <div style="color:#888;margin-bottom:3px;">⚡ 速度</div>
                <div style="display:flex;gap:3px;flex-wrap:wrap;">
                    <button onclick="window.game.setSpeed(1)" style="flex:1;padding:3px;background:#333;border:1px solid #555;color:#fff;border-radius:3px;cursor:pointer;font-size:11px;">1x</button>
                    <button onclick="window.game.setSpeed(2)" style="flex:1;padding:3px;background:#333;border:1px solid #555;color:#fff;border-radius:3px;cursor:pointer;font-size:11px;">2x</button>
                    <button onclick="window.game.setSpeed(5)" style="flex:1;padding:3px;background:#333;border:1px solid #555;color:#fff;border-radius:3px;cursor:pointer;font-size:11px;">5x</button>
                    <button onclick="window.game.setSpeed(10)" style="flex:1;padding:3px;background:#333;border:1px solid #555;color:#fff;border-radius:3px;cursor:pointer;font-size:11px;">10x</button>
                </div>
            </div>
            
            <!-- AI平衡测试 -->
            <div style="margin-bottom:8px;">
                <div style="color:#888;margin-bottom:3px;">🤖 AI平衡测试</div>
                <div style="display:flex;gap:3px;">
                    <button onclick="window.game.runWeaponBalanceTest()" style="flex:1;padding:5px;background:#2a8;border:none;color:#fff;border-radius:3px;cursor:pointer;font-size:11px;">⚡ 运行测试</button>
                    <button onclick="window.game.exportBalanceReport()" style="flex:1;padding:5px;background:#48f;border:none;color:#fff;border-radius:3px;cursor:pointer;font-size:11px;">📊 导出报告</button>
                </div>
            </div>
            
            <!-- 调试开关 -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:8px;">
                <button id="debugGodMode" onclick="window.game.toggleGodModeDebug()" style="padding:5px;background:#333;border:1px solid #555;color:#fff;border-radius:3px;cursor:pointer;font-size:11px;">🛡️ 无敌: OFF</button>
                <button id="debugHitbox" onclick="window.game.debugPanel.toggleHitboxDebug()" style="padding:5px;background:#333;border:1px solid #555;color:#fff;border-radius:3px;cursor:pointer;font-size:11px;">🎯 碰撞: OFF</button>
            </div>
            
            <!-- 武器控制 -->
            <div style="margin-bottom:8px;">
                <div style="color:#888;margin-bottom:3px;">⚔️ 武器</div>
                <select id="debugWeaponSelect" style="width:100%;padding:3px;background:#222;border:1px solid #555;color:#fff;border-radius:3px;font-size:11px;margin-bottom:3px;">
                    <option value="">选择武器...</option>
                </select>
                <div style="display:flex;gap:3px;">
                    <button onclick="window.game.debugAddWeapon()" style="flex:1;padding:4px;background:#2a4;border:none;color:#fff;border-radius:3px;cursor:pointer;font-size:11px;">添加</button>
                    <button onclick="window.game.debugUpgradeWeapon()" style="flex:1;padding:4px;background:#48f;border:none;color:#fff;border-radius:3px;cursor:pointer;font-size:11px;">升级</button>
                    <button onclick="window.game.debugMaxWeapon()" style="flex:1;padding:4px;background:#a4f;border:none;color:#fff;border-radius:3px;cursor:pointer;font-size:11px;">满级</button>
                </div>
            </div>
            
            <!-- 被动控制 -->
            <div style="margin-bottom:8px;">
                <div style="color:#888;margin-bottom:3px;">💎 被动</div>
                <select id="debugPassiveSelect" style="width:100%;padding:3px;background:#222;border:1px solid #555;color:#fff;border-radius:3px;font-size:11px;margin-bottom:3px;">
                    <option value="">选择被动...</option>
                </select>
                <div style="display:flex;gap:3px;">
                    <button onclick="window.game.debugAddPassive()" style="flex:1;padding:4px;background:#2a4;border:none;color:#fff;border-radius:3px;cursor:pointer;font-size:11px;">添加</button>
                    <button onclick="window.game.debugMaxPassive()" style="flex:1;padding:4px;background:#a4f;border:none;color:#fff;border-radius:3px;cursor:pointer;font-size:11px;">满级</button>
                </div>
            </div>
            
            <!-- 道具控制 -->
            <div style="margin-bottom:8px;">
                <div style="color:#888;margin-bottom:3px;">🎁 道具</div>
                <select id="debugItemSelect" style="width:100%;padding:3px;background:#222;border:1px solid #555;color:#fff;border-radius:3px;font-size:11px;margin-bottom:3px;">
                    <option value="">选择道具...</option>
                </select>
                <div style="display:flex;gap:3px;">
                    <button onclick="window.game.debugAddItem()" style="flex:1;padding:4px;background:#2a4;border:none;color:#fff;border-radius:3px;cursor:pointer;font-size:11px;">添加</button>
                    <button onclick="window.game.debugRandomItem()" style="flex:1;padding:4px;background:#48f;border:none;color:#fff;border-radius:3px;cursor:pointer;font-size:11px;">随机</button>
                    <button onclick="window.game.debugClearItems()" style="flex:1;padding:4px;background:#f44;border:none;color:#fff;border-radius:3px;cursor:pointer;font-size:11px;">清空</button>
                </div>
            </div>
            
            <!-- 宠物控制 -->
            <div style="margin-bottom:8px;">
                <div style="color:#888;margin-bottom:3px;">🐾 宠物</div>
                <div style="display:flex;gap:3px;">
                    <button onclick="window.game.debugAddPet()" style="flex:1;padding:4px;background:#2a4;border:none;color:#fff;border-radius:3px;cursor:pointer;font-size:11px;">添加</button>
                    <button onclick="window.game.debugRandomPet()" style="flex:1;padding:4px;background:#48f;border:none;color:#fff;border-radius:3px;cursor:pointer;font-size:11px;">随机</button>
                    <button onclick="window.game.debugClearPets()" style="flex:1;padding:4px;background:#f44;border:none;color:#fff;border-radius:3px;cursor:pointer;font-size:11px;">清空</button>
                </div>
            </div>
            
            <!-- 快捷操作 -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:8px;">
                <button onclick="window.game.debugNextFloor()" style="padding:5px;background:#f80;border:none;color:#fff;border-radius:3px;cursor:pointer;font-size:11px;">🗺️ 下一层</button>
                <button onclick="window.game.debugKillAll()" style="padding:5px;background:#f44;border:none;color:#fff;border-radius:3px;cursor:pointer;font-size:11px;">☠️ 杀光怪</button>
            </div>

            <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:8px;">
                <button onclick="window.game.debugJumpToShop()" style="padding:5px;background:#6a3;border:none;color:#fff;border-radius:3px;cursor:pointer;font-size:11px;">🛒 商店</button>
                <button onclick="window.game.debugJumpToBoss()" style="padding:5px;background:#a33;border:none;color:#fff;border-radius:3px;cursor:pointer;font-size:11px;">👹 Boss</button>
            </div>
            
            <!-- 测试通关动画 -->
            <div style="margin-bottom:8px;">
                <button onclick="window.game.startVictorySequence()" style="width:100%;padding:5px;background:linear-gradient(135deg, #f1c40f, #f39c12);border:none;color:#000;border-radius:3px;cursor:pointer;font-size:11px;font-weight:bold;">🏆 测试通关动画</button>
            </div>
            
            <!-- 玩家状态 -->
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:8px;">
                <button onclick="window.game.debugHeal()" style="padding:5px;background:#4a4;border:none;color:#fff;border-radius:3px;cursor:pointer;font-size:11px;">❤️ 回满血</button>
                <button onclick="window.game.debugLevelUp()" style="padding:5px;background:#48f;border:none;color:#fff;border-radius:3px;cursor:pointer;font-size:11px;">⬆️ 升级</button>
            </div>
            
            <!-- 其他 -->
            <div style="display:flex;gap:5px;">
                <button onclick="window.game.toggleTheme()" style="flex:1;padding:4px;background:#333;border:1px solid #555;color:#fff;border-radius:3px;cursor:pointer;font-size:11px;">🎨 主题</button>
                <button onclick="window.game.perfMonitor.toggle()" style="flex:1;padding:4px;background:#333;border:1px solid #555;color:#fff;border-radius:3px;cursor:pointer;font-size:11px;">📊 性能</button>
            </div>
        `;
        
        document.body.appendChild(panel);
        this.populateSelects();
    }
    
    toggle() {
        this.ensurePanel();
        const panel = document.getElementById('debugPanel');
        if (panel) {
            this.visible = !this.visible;
            panel.style.display = this.visible ? 'block' : 'none';
        }
    }
    
    // ===== 碰撞调试 (使用 Game 类的状态) =====
    toggleHitboxDebug() {
        // 调用 Game 类的方法
        if (this.game && this.game.toggleHitboxDebug) {
            const result = this.game.toggleHitboxDebug();
            // 更新按钮状态
            const btn = document.getElementById('debugHitbox');
            if (btn) btn.textContent = `🎯 碰撞: ${result ? 'ON' : 'OFF'}`;
            return result;
        }
    }
    
    // 填充下拉选项
    populateSelects() {
        // 武器选择
        const weaponSelect = document.getElementById('debugWeaponSelect');
        if (weaponSelect && typeof WEAPONS !== 'undefined') {
            weaponSelect.innerHTML = '<option value="">选择武器...</option>' +
                Object.entries(WEAPONS).map(([key, w]) => 
                    `<option value="${key}">${w.name}</option>`
                ).join('');
        }
        
        // 被动选择
        const passiveSelect = document.getElementById('debugPassiveSelect');
        if (passiveSelect && typeof PASSIVES !== 'undefined') {
            passiveSelect.innerHTML = '<option value="">选择被动...</option>' +
                Object.entries(PASSIVES).map(([key, p]) => 
                    `<option value="${key}">${p.name}</option>`
                ).join('');
        }
        
        // 道具选择
        const itemSelect = document.getElementById('debugItemSelect');
        if (itemSelect && typeof ITEMS !== 'undefined') {
            itemSelect.innerHTML = '<option value="">选择道具...</option>' +
                Object.values(ITEMS).map(item => 
                    `<option value="${item.id}">${item.icon} ${item.name}</option>`
                ).join('');
        }
    }
}

// 导出到全局
window.DebugPanel = DebugPanel;
