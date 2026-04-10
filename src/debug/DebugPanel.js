/**
 * DebugPanel - 超级调试面板
 * 系统切换、数据来源切换、实时测试工具
 */

class DebugPanel {
    constructor(game) {
        this.game = game;
        this.visible = false;
        this.activeTab = 'systems';
        
        // 调试状态
        this.debugState = {
            systems: {
                weaponSystem: 'legacy',
                itemSystem: 'legacy',
                enemySpawn: 'legacy',
                mapGenerator: 'legacy',
                combatSystem: 'legacy',
                aiSystem: 'legacy',
            },
            dataSource: {
                weapons: 'inline',
                items: 'inline',
                enemies: 'inline',
                passives: 'inline',
            },
            toggles: {
                godMode: false,
                infiniteAmmo: false,
                showHitbox: false,
                showPaths: false,
                freezeEnemies: false,
                fastSpawn: false,
                logEvents: false,
            },
            overrides: {
                playerSpeed: null,
                playerDamage: null,
                enemyHealth: null,
                spawnRate: null,
                dropRate: null,
            }
        };
        
        this.performanceStats = { fps: 0, frameTime: 0, entityCount: 0 };
        this.eventLog = [];
        this.maxLogEntries = 100;
        
        this.init();
    }
    
    init() {
        this.createPanel();
        this.setupKeyboardShortcuts();
        console.log('[DebugPanel] Press F12 or ~ to toggle');
    }
    
    createPanel() {
        const panel = document.createElement('div');
        panel.id = 'debug-panel';
        panel.innerHTML = this.getPanelHTML();
        document.body.appendChild(panel);
        this.panelElement = panel;
        this.bindEvents();
    }
    
    getPanelHTML() {
        return `
            <style>
                #debug-panel {
                    position: fixed;
                    top: 10px;
                    right: 10px;
                    width: 380px;
                    background: rgba(0,0,0,0.95);
                    border: 2px solid #0f0;
                    border-radius: 8px;
                    color: #0f0;
                    font-family: monospace;
                    font-size: 12px;
                    z-index: 9999;
                    display: none;
                }
                #debug-panel.visible { display: block; }
                .dbg-header {
                    background: #0f0;
                    color: #000;
                    padding: 8px 12px;
                    font-weight: bold;
                    display: flex;
                    justify-content: space-between;
                }
                .dbg-close { cursor: pointer; }
                .dbg-tabs { display: flex; border-bottom: 1px solid #0f0; }
                .dbg-tab {
                    flex: 1;
                    padding: 8px;
                    text-align: center;
                    cursor: pointer;
                    background: #001100;
                }
                .dbg-tab.active { background: #0f0; color: #000; }
                .dbg-content { padding: 12px; max-height: 70vh; overflow-y: auto; }
                .dbg-section { margin-bottom: 16px; }
                .dbg-title {
                    font-weight: bold;
                    border-bottom: 1px solid #0f0;
                    padding-bottom: 4px;
                    margin-bottom: 8px;
                }
                .dbg-row {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 4px 0;
                }
                .dbg-select, .dbg-input {
                    background: #001100;
                    color: #0f0;
                    border: 1px solid #0f0;
                    padding: 4px;
                }
                .dbg-btn {
                    background: #0f0;
                    color: #000;
                    border: none;
                    padding: 6px 12px;
                    cursor: pointer;
                    font-weight: bold;
                    margin: 2px;
                }
                .dbg-btn:hover { background: #0c0; }
                .dbg-log {
                    height: 120px;
                    overflow-y: auto;
                    background: #001100;
                    border: 1px solid #0f0;
                    padding: 8px;
                    font-size: 10px;
                }
            </style>
            
            <div class="dbg-header">
                <span>🔧 DEBUG PANEL v0.25</span>
                <span class="dbg-close" onclick="window.debugPanel.toggle()">✕</span>
            </div>
            
            <div class="dbg-tabs">
                <div class="dbg-tab active" data-tab="systems">系统</div>
                <div class="dbg-tab" data-tab="data">数据</div>
                <div class="dbg-tab" data-tab="cheats">作弊</div>
                <div class="dbg-tab" data-tab="log">日志</div>
            </div>
            
            <div class="dbg-content">
                <!-- 系统切换 -->
                <div id="tab-systems" class="tab-content">
                    <div class="dbg-section">
                        <div class="dbg-title">🎮 系统实现切换</div>
                        ${this.getSystemSelects()}
                    </div>
                    <div class="dbg-section">
                        <div class="dbg-title">🔄 快捷操作</div>
                        <button class="dbg-btn" onclick="window.debugPanel.reloadWithConfig()">🔄 重载配置</button>
                        <button class="dbg-btn" onclick="window.debugPanel.resetAllLegacy()">⏪ 全旧版</button>
                    </div>
                </div>
                
                <!-- 数据来源 -->
                <div id="tab-data" class="tab-content" style="display:none">
                    <div class="dbg-section">
                        <div class="dbg-title">📦 数据来源</div>
                        ${this.getDataSelects()}
                    </div>
                    <div class="dbg-section">
                        <div class="dbg-title">📁 数据工具</div>
                        <button class="dbg-btn" onclick="window.debugPanel.exportData()">💾 导出</button>
                        <button class="dbg-btn" onclick="window.debugPanel.validateData()">✓ 验证</button>
                    </div>
                </div>
                
                <!-- 作弊 -->
                <div id="tab-cheats" class="tab-content" style="display:none">
                    <div class="dbg-section">
                        <div class="dbg-title">⚡ 即时操作</div>
                        <button class="dbg-btn" onclick="window.debugPanel.killAll()">💀 清怪</button>
                        <button class="dbg-btn" onclick="window.debugPanel.spawnBoss()">👹 Boss</button>
                        <button class="dbg-btn" onclick="window.debugPanel.levelUp()">⬆️ 升级</button>
                        <button class="dbg-btn" onclick="window.debugPanel.giveWeapon()">🗡️ 武器</button>
                        <button class="dbg-btn" onclick="window.debugPanel.giveItem()">🎁 道具</button>
                    </div>
                    <div class="dbg-section">
                        <div class="dbg-title">🔢 数值覆盖</div>
                        <div class="dbg-row">
                            <span>移速倍率</span>
                            <input type="number" class="dbg-input" id="ov-speed" placeholder="1.0" step="0.1">
                        </div>
                        <div class="dbg-row">
                            <span>伤害倍率</span>
                            <input type="number" class="dbg-input" id="ov-damage" placeholder="1.0" step="0.1">
                        </div>
                        <div class="dbg-row">
                            <span>敌血倍率</span>
                            <input type="number" class="dbg-input" id="ov-hp" placeholder="1.0" step="0.1">
                        </div>
                    </div>
                </div>
                
                <!-- 日志 -->
                <div id="tab-log" class="tab-content" style="display:none">
                    <div class="dbg-section">
                        <div class="dbg-title">📝 事件日志</div>
                        <div class="dbg-log" id="debug-log-content"></div>
                        <button class="dbg-btn" onclick="window.debugPanel.clearLog()">清空</button>
                    </div>
                </div>
            </div>
        `;
    }
    
    getSystemSelects() {
        const systems = [
            { key: 'weaponSystem', name: '武器系统' },
            { key: 'itemSystem', name: '道具系统' },
            { key: 'mapGenerator', name: '地图生成' },
            { key: 'enemySpawn', name: '敌人生成' },
            { key: 'combatSystem', name: '战斗系统' },
            { key: 'aiSystem', name: 'AI系统' },
        ];
        
        return systems.map(s => `
            <div class="dbg-row">
                <span>${s.name}</span>
                <select class="dbg-select" data-system="${s.key}">
                    <option value="legacy">旧版</option>
                    <option value="new">新版</option>
                    <option value="hybrid">混合</option>
                </select>
            </div>
        `).join('');
    }
    
    getDataSelects() {
        const datas = [
            { key: 'weapons', name: '武器数据' },
            { key: 'items', name: '道具数据' },
            { key: 'enemies', name: '敌人数据' },
            { key: 'passives', name: '被动数据' },
        ];
        
        return datas.map(d => `
            <div class="dbg-row">
                <span>${d.name}</span>
                <select class="dbg-select" data-data="${d.key}">
                    <option value="inline">内联</option>
                    <option value="json">JSON</option>
                    <option value="hybrid">混合</option>
                </select>
            </div>
        `).join('');
    }
    
    bindEvents() {
        // 标签切换
        this.panelElement.querySelectorAll('.dbg-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        // 系统切换
        this.panelElement.querySelectorAll('[data-system]').forEach(sel => {
            sel.addEventListener('change', (e) => {
                this.debugState.systems[e.target.dataset.system] = e.target.value;
                this.log(`System ${e.target.dataset.system} → ${e.target.value}`);
            });
        });
        
        // 数据切换
        this.panelElement.querySelectorAll('[data-data]').forEach(sel => {
            sel.addEventListener('change', (e) => {
                this.debugState.dataSource[e.target.dataset.data] = e.target.value;
                this.log(`Data ${e.target.dataset.data} → ${e.target.value}`);
            });
        });
        
        // 数值覆盖
        ['speed', 'damage', 'hp'].forEach(key => {
            const el = document.getElementById(`ov-${key}`);
            if (el) {
                el.addEventListener('change', (e) => {
                    const val = parseFloat(e.target.value) || null;
                    this.debugState.overrides[key] = val;
                    this.log(`Override ${key} → ${val ?? 'default'}`);
                });
            }
        });
    }
    
    switchTab(tabName) {
        this.activeTab = tabName;
        this.panelElement.querySelectorAll('.dbg-tab').forEach(t => {
            t.classList.toggle('active', t.dataset.tab === tabName);
        });
        this.panelElement.querySelectorAll('.tab-content').forEach(c => {
            c.style.display = c.id === `tab-${tabName}` ? 'block' : 'none';
        });
    }
    
    // ===== 操作 =====
    
    killAll() {
        if (this.game?.enemies) {
            this.game.enemies.forEach(e => e.dead = true);
            this.log('Killed all enemies');
        }
    }
    
    spawnBoss() {
        if (this.game?.spawnBoss) {
            this.game.spawnBoss();
            this.log('Spawned boss');
        }
    }
    
    levelUp() {
        if (this.game?.playerLevelUp) {
            this.game.playerLevelUp();
            this.log('Level up');
        }
    }
    
    giveWeapon() {
        if (this.game?.addWeapon) {
            const weapons = Object.keys(this.game.weaponTypes || {});
            if (weapons.length > 0) {
                const w = weapons[Math.floor(Math.random() * weapons.length)];
                this.game.addWeapon(w);
                this.log(`Gave weapon: ${w}`);
            }
        }
    }
    
    giveItem() {
        if (this.game?.addPassiveItem) {
            const items = Object.keys(this.game.passiveItems || {});
            if (items.length > 0) {
                const i = items[Math.floor(Math.random() * items.length)];
                this.game.addPassiveItem(i);
                this.log(`Gave item: ${i}`);
            }
        }
    }
    
    reloadWithConfig() {
        localStorage.setItem('debugConfig', JSON.stringify(this.debugState));
        location.reload();
    }
    
    resetAllLegacy() {
        Object.keys(this.debugState.systems).forEach(k => this.debugState.systems[k] = 'legacy');
        Object.keys(this.debugState.dataSource).forEach(k => this.debugState.dataSource[k] = 'inline');
        this.updateUI();
        this.log('Reset all to legacy');
    }
    
    exportData() {
        const data = {
            weapons: this.game?.weaponTypes || {},
            items: this.game?.passiveItems || {},
            enemies: this.game?.enemyTypes || {},
            time: new Date().toISOString()
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `game-data-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        this.log('Data exported');
    }
    
    validateData() {
        let issues = [];
        if (this.game?.weaponTypes) {
            Object.entries(this.game.weaponTypes).forEach(([k, v]) => {
                if (!v.damage) issues.push(`${k} missing damage`);
            });
        }
        this.log(issues.length === 0 ? '✓ Validation passed' : `✗ ${issues.length} issues`);
    }
    
    // ===== 日志 =====
    
    log(message) {
        const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
        this.eventLog.unshift({ time, message });
        if (this.eventLog.length > this.maxLogEntries) this.eventLog.pop();
        
        const logEl = document.getElementById('debug-log-content');
        if (logEl) {
            logEl.innerHTML = this.eventLog.map(e => `<div>[${e.time}] ${e.message}</div>`).join('');
        }
        console.log(`[Debug] ${message}`);
    }
    
    clearLog() {
        this.eventLog = [];
        const logEl = document.getElementById('debug-log-content');
        if (logEl) logEl.innerHTML = '';
    }
    
    // ===== 控制 =====
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F12' || e.key === '`' || e.key === '~') {
                e.preventDefault();
                this.toggle();
            }
        });
    }
    
    toggle() {
        this.visible = !this.visible;
        this.panelElement.classList.toggle('visible', this.visible);
    }
    
    updateUI() {
        Object.entries(this.debugState.systems).forEach(([k, v]) => {
            const el = this.panelElement.querySelector(`[data-system="${k}"]`);
            if (el) el.value = v;
        });
        Object.entries(this.debugState.dataSource).forEach(([k, v]) => {
            const el = this.panelElement.querySelector(`[data-data="${k}"]`);
            if (el) el.value = v;
        });
    }
}

window.DebugPanel = DebugPanel;
