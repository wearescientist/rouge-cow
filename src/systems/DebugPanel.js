/**
 * DebugPanel.js - 调试面板系统 (完整版)
 * 从 Game 类分离的调试功能
 */

class DebugPanel {
    constructor(game) {
        this.game = game;
        this.showHitboxDebug = false;
        this.visible = false;
        this.lastStatsUpdate = 0;
        this.collapsed = true;
        this.pendingFloorJumpValue = null;
        this.ensureVisualTuningState();
        
        this.init();
    }
    
    init() {
        // F9 由轻量 DEV 壳统一管理，避免在关闭 DEV 时仍常驻重调试逻辑
        if (!window.__F9ManagedByDevShell) {
            document.addEventListener('keydown', (e) => {
                if (e.key === 'F9') {
                    this.toggle();
                }
            });
        }
    }
    
    ensurePanel() {
        if (!document.getElementById('debugPanel')) {
            this.createPanel();
        }
    }
    
    createPanel() {
        if (document.getElementById('debugPanel')) return;

        const section = (title, body, options = {}) => {
            const openAttr = options.open ? ' open' : '';
            return `
                <details class="debug-section"${openAttr}>
                    <summary>${title}</summary>
                    <div class="debug-section-body">${body}</div>
                </details>
            `;
        };

        const selectStyle = 'width:100%;padding:6px 8px;background:#171b22;border:1px solid rgba(140,190,255,0.18);color:#eef7ff;border-radius:8px;font-size:12px;margin-bottom:6px;';
        const buttonBase = 'padding:6px 8px;border:none;border-radius:8px;cursor:pointer;font-size:12px;color:#fff;';
        const subtleBtn = `${buttonBase}background:#2a3340;border:1px solid rgba(255,255,255,0.08);`;

        const panel = document.createElement('div');
        panel.id = 'debugPanel';
        panel.style.cssText = 'display:none;position:fixed;top:0;right:0;bottom:0;width:min(396px, calc(100vw - 28px));max-width:calc(100vw - 12px);z-index:99999;font-size:12px;color:#fff;pointer-events:none;transition:transform 0.18s ease, opacity 0.18s ease;opacity:1;';
        panel.innerHTML = `
            <button id="debugPanelDock" onclick="window.game.debugPanel.toggleCollapsed()" style="position:absolute;top:18px;left:-32px;width:32px;height:88px;background:rgba(10,14,20,0.96);border:1px solid rgba(135,190,255,0.3);border-right:none;border-radius:12px 0 0 12px;color:#d7efff;cursor:pointer;pointer-events:auto;box-shadow:0 8px 22px rgba(0,0,0,0.35);font-size:16px;font-weight:bold;display:flex;align-items:center;justify-content:center;">◀</button>
            <div id="debugPanelShell" style="height:100%;background:rgba(8,10,14,0.94);border-left:1px solid rgba(135,190,255,0.22);box-shadow:-14px 0 36px rgba(0,0,0,0.38);padding:12px 12px 18px;overflow-y:auto;overflow-x:hidden;pointer-events:auto;backdrop-filter:blur(6px);">
                <style>
                    #debugPanelShell .debug-section{border:1px solid rgba(135,190,255,0.12);border-radius:12px;background:rgba(255,255,255,0.03);margin-bottom:10px;overflow:hidden;}
                    #debugPanelShell .debug-section > summary{list-style:none;cursor:pointer;padding:10px 12px;color:#d9efff;font-weight:700;background:rgba(255,255,255,0.04);display:flex;align-items:center;justify-content:space-between;gap:8px;}
                    #debugPanelShell .debug-section > summary::-webkit-details-marker{display:none;}
                    #debugPanelShell .debug-section > summary::after{content:'展开';font-size:11px;color:#7fa8ca;font-weight:500;}
                    #debugPanelShell .debug-section[open] > summary::after{content:'收起';}
                    #debugPanelShell .debug-section-body{padding:10px 12px;display:grid;gap:8px;}
                    #debugPanelShell .debug-grid-2{display:grid;grid-template-columns:1fr 1fr;gap:6px;}
                    #debugPanelShell .debug-grid-3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;}
                    #debugPanelShell .debug-grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;}
                    #debugPanelShell .debug-subtitle{color:#89a5bf;font-size:11px;margin:0 0 4px;}
                    @media (max-width: 900px) {
                        #debugPanel{width:min(360px, calc(100vw - 22px)) !important;max-width:calc(100vw - 10px) !important;}
                        #debugPanelDock{display:flex !important;height:82px !important;top:14px !important;left:-28px !important;width:28px !important;font-size:14px !important;}
                        #debugPanelShell{padding:10px 10px 16px !important;}
                        #debugPanelShell .debug-grid-4{grid-template-columns:1fr 1fr;}
                        #debugPanelShell .debug-grid-3{grid-template-columns:1fr 1fr;}
                        #debugPanelShell .debug-grid-2{grid-template-columns:1fr;}
                    }
                </style>
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;border-bottom:1px solid rgba(135,190,255,0.16);padding-bottom:8px;gap:8px;">
                    <span style="font-weight:bold;color:#7effb2;">🐛 测试面板 (F9)</span>
                    <div style="display:flex;gap:6px;">
                        <button onclick="window.game.openSettings && window.game.openSettings()" style="background:#35506b;border:none;color:#fff;border-radius:8px;cursor:pointer;padding:5px 10px;">设置</button>
                        <button onclick="window.game.debugPanel.toggleCollapsed()" style="background:#255a7a;border:none;color:#fff;border-radius:8px;cursor:pointer;padding:5px 10px;">侧收</button>
                        <button onclick="window.game.debugPanel.toggle()" style="background:#8a3340;border:none;color:#fff;border-radius:8px;cursor:pointer;padding:5px 10px;">×</button>
                    </div>
                </div>
                <div style="font-size:11px;color:#8ca3b8;margin:-4px 0 12px 0;line-height:1.5;">按功能分区，默认折叠高频以外内容。隐藏房编辑保留，但不再把无效发光调节塞进面板。</div>
                ${section('⚡ 快速控制', `
                    <div class="debug-grid-4">
                        <button onclick="window.game.setSpeed(1)" style="${subtleBtn}">1x</button>
                        <button onclick="window.game.setSpeed(2)" style="${subtleBtn}">2x</button>
                        <button onclick="window.game.setSpeed(5)" style="${subtleBtn}">5x</button>
                        <button onclick="window.game.setSpeed(10)" style="${subtleBtn}">10x</button>
                    </div>
                    <div class="debug-grid-2">
                        <button id="debugGodMode" onclick="window.game.toggleGodModeDebug()" style="${subtleBtn}">🛡️ 无敌: OFF</button>
                        <button id="debugHitbox" onclick="window.game.debugPanel.toggleHitboxDebug()" style="${subtleBtn}">🎯 碰撞: OFF</button>
                        <button onclick="window.game.debugHeal()" style="${buttonBase}background:#2e7d32;">❤️ 回满血</button>
                        <button onclick="window.game.debugLevelUp()" style="${buttonBase}background:#1565c0;">⬆️ 升级</button>
                        <button onclick="window.game.debugKillAll()" style="${buttonBase}background:#b23c3c;">☠️ 杀光怪</button>
                        <div style="display:grid;grid-template-columns:1fr 92px;gap:6px;grid-column:1 / -1;">
                            <select id="debugFloorSelect" style="${selectStyle}margin-bottom:0;">
                                <option value="1">第1层</option>
                                <option value="2">第2层</option>
                                <option value="3">第3层</option>
                                <option value="4">第4层</option>
                                <option value="5">第5层</option>
                                <option value="6">第6层</option>
                                <option value="7">第7层</option>
                            </select>
                            <button onclick="window.game.debugPanel.jumpToSelectedFloor()" style="${buttonBase}background:#ef6c00;">🗺️ 跳层</button>
                        </div>
                    </div>
                    <div class="debug-grid-3">
                        <button onclick="window.game.debugJumpToShop()" style="${buttonBase}background:#587c2d;">🛒 商店</button>
                        <button onclick="window.game.debugJumpToBoss()" style="${buttonBase}background:#8c2d2d;">👹 Boss</button>
                        <button onclick="window.debugJumpToHiddenRoom()" style="${buttonBase}background:#2f5f8c;">🕳️ 隐藏房</button>
                    </div>
                `, { open: true })}
                ${section('⚔️ 构筑调试', `
                    <div>
                        <div class="debug-subtitle">武器</div>
                        <select id="debugWeaponSelect" style="${selectStyle}"><option value="">选择武器...</option></select>
                        <div class="debug-grid-3">
                            <button onclick="window.game.debugAddWeapon()" style="${buttonBase}background:#2a7a4a;">添加</button>
                            <button onclick="window.game.debugUpgradeWeapon()" style="${buttonBase}background:#2d66a3;">升级</button>
                            <button onclick="window.game.debugMaxWeapon()" style="${buttonBase}background:#6a3db4;">满级</button>
                        </div>
                    </div>
                    <div>
                        <div class="debug-subtitle">被动</div>
                        <select id="debugPassiveSelect" style="${selectStyle}"><option value="">选择被动...</option></select>
                        <div class="debug-grid-2">
                            <button onclick="window.game.debugAddPassive()" style="${buttonBase}background:#2a7a4a;">添加</button>
                            <button onclick="window.game.debugMaxPassive()" style="${buttonBase}background:#6a3db4;">满级</button>
                        </div>
                    </div>
                    <div>
                        <div class="debug-subtitle">道具</div>
                        <select id="debugItemSelect" style="${selectStyle}"><option value="">选择道具...</option></select>
                        <div class="debug-grid-3">
                            <button onclick="window.game.debugAddItem()" style="${buttonBase}background:#2a7a4a;">添加</button>
                            <button onclick="window.game.debugRandomItem()" style="${buttonBase}background:#2d66a3;">随机</button>
                            <button onclick="window.game.debugClearItems()" style="${buttonBase}background:#8c2d2d;">清空</button>
                        </div>
                    </div>
                    <div>
                        <div class="debug-subtitle">宠物</div>
                        <select id="debugPetSelect" style="${selectStyle}"><option value="">选择宠物...</option></select>
                        <div class="debug-grid-3">
                            <button onclick="window.game.debugAddPet()" style="${buttonBase}background:#2a7a4a;">添加</button>
                            <button onclick="window.game.debugRandomPet()" style="${buttonBase}background:#2d66a3;">随机</button>
                            <button onclick="window.game.debugClearPets()" style="${buttonBase}background:#8c2d2d;">清空</button>
                        </div>
                    </div>
                `, { open: true })}
                ${section('📊 测试与性能', `
                    <div class="debug-grid-2">
                        <button onclick="window.game.runWeaponBalanceTest()" style="${buttonBase}background:#187e72;">⚡ 运行测试</button>
                        <button onclick="window.game.exportBalanceReport()" style="${buttonBase}background:#2d66a3;">📊 导出报告</button>
                        <button onclick="window.game.startVictorySequence()" style="${buttonBase}background:linear-gradient(135deg, #f1c40f, #f39c12);color:#111;font-weight:bold;">🏆 通关动画</button>
                        <button id="debugPerfToggle" onclick="window.game.debugPanel.togglePerformanceMonitor()" style="${subtleBtn}">📊 性能: OFF</button>
                    </div>
                    <div id="debugRuntimeStats" style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:11px;color:#ddd;"></div>
                    <div style="margin-top:4px;border-top:1px solid rgba(255,255,255,0.08);padding-top:8px;display:grid;gap:8px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
                            <div class="debug-subtitle" style="margin:0;color:#d7efff;">CPU帧耗分析器（下面是代码耗时，不是真实FPS；父子项会重叠，不要直接相加）</div>
                            <div style="display:flex;gap:6px;flex-wrap:wrap;">
                                <button id="debugFrameProfilerToggle" onclick="window.game.debugPanel.toggleFrameProfiler()" style="${subtleBtn}">分析: ON</button>
                                <button onclick="window.game.debugPanel.resetFrameProfiler()" style="${subtleBtn}">重置</button>
                                <button onclick="window.game.debugPanel.exportFrameProfiler()" style="${subtleBtn}">导出JSON</button>
                            </div>
                        </div>
                        <div id="debugFrameProfilerSummary" style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;font-size:11px;color:#ddd;"></div>
                        <div id="debugFrameProfilerTop" style="display:grid;gap:6px;font-size:11px;color:#ddd;"></div>
                    </div>
                    <div style="margin-top:4px;border-top:1px solid rgba(255,255,255,0.08);padding-top:8px;display:grid;gap:8px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
                            <div class="debug-subtitle" style="margin:0;color:#d7efff;">AI 自动游玩 / 自动压测</div>
                            <div style="display:flex;gap:6px;flex-wrap:wrap;">
                                <button id="debugAutoPilotToggle" onclick="window.game.debugPanel.toggleAutoPilot()" style="${subtleBtn}">AI辅助: OFF</button>
                                <button onclick="window.game.debugPanel.startAutoDirector()" style="${subtleBtn}">自开局</button>
                                <button onclick="window.game.debugPanel.startAchievementSuite()" style="${subtleBtn}">成就巡检</button>
                                <button onclick="window.game.debugPanel.stopAutoPlay()" style="${subtleBtn}">停止</button>
                            </div>
                        </div>
                        <div class="debug-grid-3">
                            <button onclick="window.game.debugPanel.startAutoBenchmark('current')" style="${buttonBase}background:#2d66a3;">当前房压测</button>
                            <button onclick="window.game.debugPanel.startAutoBenchmark('boss')" style="${buttonBase}background:#7a3a2d;">Boss压测</button>
                            <button onclick="window.game.debugPanel.startAutoBenchmark('hidden')" style="${buttonBase}background:#4b4f9d;">隐藏房压测</button>
                        </div>
                        <div class="debug-grid-2">
                            <button onclick="window.game.debugPanel.startAutoBenchmark('suite')" style="${buttonBase}background:#3d7b69;">三场景套跑</button>
                            <button onclick="window.game.debugPanel.exportAutoPlayReport()" style="${subtleBtn}">导出最近AI报告</button>
                        </div>
                        <div id="debugAutoPlayStatus" style="display:grid;gap:6px;font-size:11px;color:#ddd;"></div>
                    </div>
                `, { open: true })}
                ${section('🧩 隐藏房布局编辑', `
                    <div id="debugHiddenLayoutStatus" style="font-size:11px;color:#cfe6ff;line-height:1.5;">未启用</div>
                    <div class="debug-grid-2">
                        <button id="debugHiddenLayoutToggle" onclick="window.game.toggleHiddenLayoutEditor()" style="${buttonBase}background:#2d6b4a;">编辑: OFF</button>
                        <button onclick="window.game.saveHiddenRoomLayout()" style="${buttonBase}background:#2d66a3;">保存草稿</button>
                        <button onclick="window.game.resetHiddenRoomLayout()" style="${buttonBase}background:#8c2d2d;">恢复正式布局</button>
                        <button onclick="window.debugJumpToHiddenRoom()" style="${buttonBase}background:#2f5f8c;">回到隐藏房</button>
                    </div>
                    <div class="debug-grid-2">
                        <button onclick="window.game.cycleHiddenLayoutTarget(-1)" style="${subtleBtn}">选择 -</button>
                        <button onclick="window.game.cycleHiddenLayoutTarget(1)" style="${subtleBtn}">选择 +</button>
                    </div>
                    <div class="debug-grid-4">
                        <button onclick="window.game.moveHiddenLayoutTarget(0,-6)" style="${subtleBtn}">↑</button>
                        <button onclick="window.game.moveHiddenLayoutTarget(-6,0)" style="${subtleBtn}">←</button>
                        <button onclick="window.game.moveHiddenLayoutTarget(0,6)" style="${subtleBtn}">↓</button>
                        <button onclick="window.game.moveHiddenLayoutTarget(6,0)" style="${subtleBtn}">→</button>
                    </div>
                    <div class="debug-grid-3">
                        <button onclick="window.game.scaleHiddenLayoutTarget(-0.1)" style="${subtleBtn}">缩放 -</button>
                        <button onclick="window.game.rotateHiddenLayoutTarget(-5)" style="${subtleBtn}">旋转 -</button>
                        <button onclick="window.game.nudgeHiddenLayoutLayer(-1)" style="${subtleBtn}">图层 -</button>
                        <button onclick="window.game.scaleHiddenLayoutTarget(0.1)" style="${subtleBtn}">缩放 +</button>
                        <button onclick="window.game.rotateHiddenLayoutTarget(5)" style="${subtleBtn}">旋转 +</button>
                        <button onclick="window.game.nudgeHiddenLayoutLayer(1)" style="${subtleBtn}">图层 +</button>
                    </div>
                    <div class="debug-grid-2">
                        <button onclick="window.game.nudgeHiddenLayoutAlpha(-0.05)" style="${subtleBtn}">透明 -</button>
                        <button onclick="window.game.nudgeHiddenLayoutAlpha(0.05)" style="${subtleBtn}">透明 +</button>
                    </div>
                    <div class="debug-grid-2">
                        <button onclick="window.game.resizeHiddenLayoutTarget(-6,0)" style="${subtleBtn}">宽 -</button>
                        <button onclick="window.game.resizeHiddenLayoutTarget(6,0)" style="${subtleBtn}">宽 +</button>
                        <button onclick="window.game.resizeHiddenLayoutTarget(0,-6)" style="${subtleBtn}">高 -</button>
                        <button onclick="window.game.resizeHiddenLayoutTarget(0,6)" style="${subtleBtn}">高 +</button>
                    </div>
                    <div style="margin-top:2px;border:1px solid rgba(255,255,255,0.08);border-radius:8px;background:rgba(0,0,0,0.14);padding:8px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;margin-bottom:6px;">
                            <div style="color:#d8f1ff;">素材库</div>
                            <div style="display:flex;gap:4px;">
                                <button id="debugHiddenAssetImport" style="padding:4px 8px;background:#4468a8;border:none;color:#fff;border-radius:6px;cursor:pointer;font-size:11px;">导入图片</button>
                                <button id="debugHiddenAssetImportDir" style="padding:4px 8px;background:#4b5d8c;border:none;color:#fff;border-radius:6px;cursor:pointer;font-size:11px;">导入目录</button>
                            </div>
                        </div>
                        <div id="debugHiddenLayoutAssets" style="display:grid;gap:6px;max-height:220px;overflow:auto;"></div>
                        <div class="debug-grid-2" style="margin-top:6px;">
                            <button id="debugHiddenRemoveSelected" style="padding:4px;background:#7b3a3a;border:1px solid #955;color:#fff;border-radius:6px;cursor:pointer;font-size:11px;">删除选中装饰</button>
                            <button id="debugHiddenClearPlaced" style="padding:4px;background:#5c2f54;border:1px solid #866;color:#fff;border-radius:6px;cursor:pointer;font-size:11px;">清空已放置</button>
                        </div>
                    </div>
                `, { open: false })}
            </div>
        `;

        document.body.appendChild(panel);
        this.populateSelects();
        this.applyPanelState();
        this.refreshRuntimeStats(true);
        this.refreshHiddenRoomEditorTools();
        this.enhanceHiddenRoomEditorPanel();
    }

    ensureVisualTuningState() {}

    bindVisualTuningControls() {}

    enhanceHiddenRoomEditorPanel() {
        const panel = document.getElementById('debugPanelShell');
        if (!panel || panel.dataset.hiddenEditorBound === 'true') return;
        panel.dataset.hiddenEditorBound = 'true';
        panel.querySelector('#debugFloorSelect')?.addEventListener('change', (event) => {
            this.pendingFloorJumpValue = String(event.target?.value || '');
        });
        panel.querySelector('#debugHiddenAssetImport')?.addEventListener('click', () => window.game?.importHiddenLayoutAssets?.());
        panel.querySelector('#debugHiddenAssetImportDir')?.addEventListener('click', () => window.game?.importHiddenLayoutAssets?.({ directory: true }));
        panel.querySelector('#debugHiddenRemoveSelected')?.addEventListener('click', () => window.game?.deleteSelectedHiddenDecor?.());
        panel.querySelector('#debugHiddenClearPlaced')?.addEventListener('click', () => window.game?.clearHiddenPlacedDecor?.());
    }

    applyPanelState(forceVisible = false) {
        const panel = document.getElementById('debugPanel');
        if (!panel) return;
        const dock = document.getElementById('debugPanelDock');
        const shell = document.getElementById('debugPanelShell');
        const shouldShow = forceVisible ? true : this.visible;
        panel.style.display = shouldShow ? 'block' : 'none';
        if (!shouldShow) return;
        panel.style.transform = this.collapsed ? 'translateX(calc(100% - 28px))' : 'translateX(0)';
        panel.style.opacity = this.collapsed ? '0.96' : '1';
        if (dock) dock.textContent = this.collapsed ? '▶' : '◀';
        if (dock) dock.title = this.collapsed ? '展开调试边栏' : '收起调试边栏';
        if (shell) {
            shell.style.opacity = this.collapsed ? '0.42' : '1';
            shell.style.pointerEvents = this.collapsed ? 'none' : 'auto';
        }
    }

    toggleCollapsed(force) {
        this.ensurePanel();
        this.collapsed = typeof force === 'boolean' ? force : !this.collapsed;
        this.applyPanelState();
    }
    
    toggle() {
        this.ensurePanel();
        this.populateSelects();
        this.visible = !this.visible;
        this.applyPanelState();
        if (this.visible) {
            this.refreshRuntimeStats(true);
            this.refreshHiddenRoomEditorTools();
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

    togglePerformanceMonitor() {
        const visible = this.game?.perfMonitor?.toggle ? this.game.perfMonitor.toggle() : false;
        const btn = document.getElementById('debugPerfToggle');
        if (btn) btn.textContent = `📊 性能: ${visible ? 'ON' : 'OFF'}`;
        this.refreshRuntimeStats(true);
        return visible;
    }

    toggleFrameProfiler() {
        const profiler = window.performanceProfiler;
        if (!profiler) return false;
        const enabled = profiler.toggleEnabled();
        this.refreshFrameProfilerStats(true);
        return enabled;
    }

    resetFrameProfiler() {
        window.performanceProfiler?.reset?.();
        this.refreshFrameProfilerStats(true);
    }

    exportFrameProfiler() {
        return window.performanceProfiler?.exportJson?.() || null;
    }

    async getAutoPlayHarness() {
        return await window.getAutoPlayHarness?.();
    }

    async toggleAutoPilot() {
        const harness = await this.getAutoPlayHarness();
        if (!harness) return false;
        harness.attach?.(this.game);
        const enabled = harness.toggleAssist();
        this.refreshAutoPlayStats(true);
        return enabled;
    }

    async startAutoBenchmark(mode) {
        const harness = await this.getAutoPlayHarness();
        if (!harness) return false;
        harness.attach?.(this.game);
        await harness.startBenchmark(mode);
        this.refreshAutoPlayStats(true);
        return true;
    }

    async stopAutoPlay() {
        const harness = await this.getAutoPlayHarness();
        if (harness) harness.stopAll();
        const director = await window.getAutoPlayDirector?.();
        director?.stop?.();
        this.refreshAutoPlayStats(true);
        return true;
    }

    async startAutoDirector() {
        const director = await window.getAutoPlayDirector?.();
        if (!director) return false;
        director.attach?.(this.game);
        await director.startRun();
        this.refreshAutoPlayStats(true);
        return true;
    }

    async startAchievementSuite() {
        const director = await window.getAutoPlayDirector?.();
        if (!director) return false;
        director.attach?.(this.game);
        await director.startAchievementSuite();
        this.refreshAutoPlayStats(true);
        return true;
    }

    async exportAutoPlayReport() {
        const harness = await this.getAutoPlayHarness();
        const payload = harness?.lastBenchmarkReport?.payload;
        if (!payload) return null;
        const text = JSON.stringify(payload, null, 2);
        const fileName = harness.lastBenchmarkReport.fileName || `autoplay_report_${Date.now()}.json`;
        try {
            const blob = new Blob([text], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1500);
        } catch (err) {
            navigator.clipboard?.writeText?.(text).catch(()=>{});
        }
        return payload;
    }

    refreshAutoPlayStats(force = false) {
        const root = document.getElementById('debugAutoPlayStatus');
        const toggle = document.getElementById('debugAutoPilotToggle');
        if (!root) return;
        const harness = window.autoPlayHarness || null;
        const director = window.autoPlayDirector || null;
        if (toggle) toggle.textContent = `AI辅助: ${harness?.enabled ? 'ON' : 'OFF'}`;
        if (!harness) {
            root.innerHTML = '<div style="color:#9bb7d3;">AI工具未加载。开启 DEV 后使用一次按钮即可初始化。</div>';
            return;
        }
        const status = harness.getStatus ? harness.getStatus() : {};
        const directorStatus = director?.getStatus ? director.getStatus() : null;
        const bench = status.benchmark;
        const progress = bench ? `${Math.round((bench.progress || 0) * 100)}%` : '-';
        const remain = bench ? `${Math.ceil((bench.remainingMs || 0) / 1000)}s` : '-';
        root.innerHTML = `
            <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;">
                <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:4px;padding:4px 6px;"><div style="color:#888;">状态</div><div style="color:#fff;font-weight:bold;">${status.enabled ? '运行中' : '待机'}</div></div>
                <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:4px;padding:4px 6px;"><div style="color:#888;">房间</div><div style="color:#fff;font-weight:bold;">${status.roomType || '-'}</div></div>
                <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:4px;padding:4px 6px;"><div style="color:#888;">敌人</div><div style="color:#fff;font-weight:bold;">${status.enemyCount || 0}</div></div>
                <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:4px;padding:4px 6px;"><div style="color:#888;">楼层</div><div style="color:#fff;font-weight:bold;">${status.floor || 0}</div></div>
            </div>
            <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);border-radius:6px;padding:6px 8px;line-height:1.5;">
                <div>目标：<b>${status.nearestEnemy || '无'}</b></div>
                <div>向量：<b>${Number(status.vector?.x || 0).toFixed(2)}, ${Number(status.vector?.y || 0).toFixed(2)}</b></div>
                <div>压测：<b>${bench ? `${bench.scenario} / ${progress} / 剩余 ${remain}` : '未运行'}</b></div>
                <div>最近报告：<b>${bench?.lastReportName || harness.lastBenchmarkReport?.fileName || '无'}</b></div>
                <div>导演：<b>${directorStatus?.enabled ? `${directorStatus.mode} / ${directorStatus.phase}` : '未运行'}</b></div>
                <div>巡检：<b>${directorStatus?.suite ? `${directorStatus.suite.passed}/${directorStatus.suite.total} 通过` : '未运行'}</b></div>
            </div>
        `;
    }

    getActiveEnemyCount() {
        const room = this.game?.curRoom;
        const hordeEnemies = room?.hordeManager?.getActiveEnemies?.();
        if (Array.isArray(hordeEnemies)) return hordeEnemies.length;
        if (Array.isArray(room?.enemies)) {
            return room.enemies.filter((enemy) => enemy && enemy.hp > 0).length;
        }
        return 0;
    }

    getParticleCount() {
        const particles = this.game?.particles;
        if (Array.isArray(particles?.active)) return particles.active.length;
        if (Array.isArray(particles?.particles)) return particles.particles.length;
        return 0;
    }


    refreshHiddenRoomEditorTools() {
        const status = document.getElementById('debugHiddenLayoutStatus');
        const toggle = document.getElementById('debugHiddenLayoutToggle');
        const editor = window.HiddenRoomLayoutEditor;
        const active = !!editor?.isActive?.();
        const info = editor?.getSelectedInfo?.() || null;
        const selected = info?.label || '未选中';
        const floor = this.game?.curRoom?.type === 'hidden' ? (this.game.curRoom.hiddenRoomFloor || this.game.currentFloor || '-') : '-';
        if (toggle) toggle.textContent = `编辑: ${active ? 'ON' : 'OFF'}`;
        if (status) {
            const x = info ? Math.round(info.x) : '-';
            const y = info ? Math.round(info.y) : '-';
            const scale = info ? Number(info.scale || 1).toFixed(2) : '-';
            const scaleX = info ? Number(info.scaleX || 1).toFixed(2) : '-';
            const scaleY = info ? Number(info.scaleY || 1).toFixed(2) : '-';
            const width = info && info.w != null ? Math.round(info.w) : '-';
            const height = info && info.h != null ? Math.round(info.h) : '-';
            const rot = info ? Math.round((info.rotation || 0) * 180 / Math.PI) : '-';
            const layer = info ? info.layer : '-';
            status.innerHTML = `当前层: <b>${floor}</b><br>状态: <b>${active ? '编辑中' : '未启用'}</b><br>选中: <b>${selected}</b><br>坐标: <b>${x}, ${y}</b>　缩放: <b>${scale}</b>　宽高: <b>${width} × ${height}</b><br>拉伸: <b>${scaleX}, ${scaleY}</b>　旋转: <b>${rot}°</b>　层级: <b>${layer}</b><br>操作: <b>拖拽 / 方向键移动 / 长按持续移动 / Shift+方向键快移 / [ ] 切换对象</b>`;
        }
    }

    refreshHiddenRoomEditorTools() {
        const status = document.getElementById('debugHiddenLayoutStatus');
        const toggle = document.getElementById('debugHiddenLayoutToggle');
        const assetsEl = document.getElementById('debugHiddenLayoutAssets');
        const editor = window.HiddenRoomLayoutEditor;
        const active = !!editor?.isActive?.();
        const info = editor?.getSelectedInfo?.() || null;
        const assets = editor?.getAssetLibrary?.() || [];
        const selected = info?.label || '未选中';
        const floor = this.game?.curRoom?.type === 'hidden' ? (this.game.curRoom.hiddenRoomFloor || this.game.currentFloor || '-') : '-';
        if (toggle) toggle.textContent = `编辑: ${active ? 'ON' : 'OFF'}`;
        if (status) {
            const x = info ? Math.round(info.x) : '-';
            const y = info ? Math.round(info.y) : '-';
            const scale = info ? Number(info.scale || 1).toFixed(2) : '-';
            const scaleX = info ? Number(info.scaleX || 1).toFixed(2) : '-';
            const scaleY = info ? Number(info.scaleY || 1).toFixed(2) : '-';
            const width = info && info.w != null ? Math.round(info.w) : '-';
            const height = info && info.h != null ? Math.round(info.h) : '-';
            const rot = info ? Math.round((info.rotation || 0) * 180 / Math.PI) : '-';
            const layer = info ? info.layer : '-';
            status.innerHTML = `当前层 <b>${floor}</b><br>状态 <b>${active ? '编辑中' : '未启用'}</b><br>选中 <b>${selected}</b><br>坐标 <b>${x}, ${y}</b> / 缩放 <b>${scale}</b><br>宽高 <b>${width} x ${height}</b> / 拉伸 <b>${scaleX}, ${scaleY}</b><br>旋转 <b>${rot}°</b> / 层级 <b>${layer}</b><br>鼠标 <b>左键拖拽 / 滚轮缩放</b><br>键盘 <b>方向键移动 / [ ] 切换</b>`;
        }
        if (assetsEl) {
            if (!assets.length) {
                assetsEl.innerHTML = '<div style="font-size:11px;color:#9bb7d3;">还没有导入素材。先导入图片或目录，再从素材库放置多个实例。</div>';
            } else {
                assetsEl.innerHTML = assets.map((asset) => `
                    <div style="display:grid;grid-template-columns:56px 1fr;gap:6px;padding:6px;border:1px solid rgba(255,255,255,0.08);border-radius:4px;background:rgba(255,255,255,0.03);">
                        <img src="${asset.src}" alt="${asset.name}" style="width:56px;height:56px;object-fit:contain;background:rgba(0,0,0,0.18);border-radius:3px;">
                        <div>
                            <div style="color:#fff;font-size:11px;word-break:break-all;">${asset.name}</div>
                            <div style="color:#8fb3d6;font-size:10px;margin:2px 0 6px;">${asset.width} x ${asset.height}</div>
                            <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;">
                                <button data-asset-id="${asset.id}" data-count="1" style="padding:4px;background:#2d6b4a;border:none;color:#fff;border-radius:3px;cursor:pointer;font-size:11px;">放置 1 个</button>
                                <button data-asset-id="${asset.id}" data-count="5" style="padding:4px;background:#356b88;border:none;color:#fff;border-radius:3px;cursor:pointer;font-size:11px;">放置 5 个</button>
                            </div>
                        </div>
                    </div>
                `).join('');
                assetsEl.querySelectorAll('button[data-asset-id]').forEach((btn) => {
                    btn.addEventListener('click', () => {
                        window.game?.placeHiddenDecorAsset?.(btn.dataset.assetId, Number(btn.dataset.count || 1));
                    });
                });
            }
        }
    }

    refreshFrameProfilerStats(force = false) {
        const profiler = window.performanceProfiler;
        const summaryEl = document.getElementById('debugFrameProfilerSummary');
        const topEl = document.getElementById('debugFrameProfilerTop');
        const toggleBtn = document.getElementById('debugFrameProfilerToggle');
        if (toggleBtn) toggleBtn.textContent = `分析: ${profiler?.enabled ? 'ON' : 'OFF'}`;
        if (!summaryEl || !topEl) return;
        if (!profiler) {
            summaryEl.innerHTML = '<div style="grid-column:1/-1;color:#9bb7d3;">性能分析器未加载。</div>';
            topEl.innerHTML = '';
            return;
        }
        const snap = profiler.getSnapshot();
        const summary = [
            ['真实FPS', Number(snap.fps || 0).toFixed(1)],
            ['真实均帧', `${Number(snap.avgFrame || 0).toFixed(2)}ms`],
            ['CPU均帧', `${Number(snap.cpuAvgFrame || 0).toFixed(2)}ms`],
            ['CPU理论', `${Number(snap.cpuFps || 0).toFixed(1)}`]
        ];
        summaryEl.innerHTML = summary.map(([label, value]) => `
            <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:4px;padding:4px 6px;">
                <div style="color:#888;">${label}</div>
                <div style="color:#fff;font-weight:bold;">${value}</div>
            </div>
        `).join('');
        const rows = (snap.sections || []).slice(0, 8).map((row, index) => `
            <div style="display:grid;grid-template-columns:24px 1fr 64px 64px 56px;gap:8px;align-items:center;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.05);border-radius:6px;padding:5px 7px;">
                <div style="color:#6d8aa8;">${index + 1}</div>
                <div style="color:#eef7ff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${row.label}</div>
                <div style="color:#9be7ff;text-align:right;">${row.avg.toFixed(2)}ms</div>
                <div style="color:#ffd27a;text-align:right;">${row.p95.toFixed(2)}ms</div>
                <div style="color:#9fd6a8;text-align:right;">${row.share.toFixed(0)}%</div>
            </div>
        `).join('');
        topEl.innerHTML = `
            <div style="display:grid;grid-template-columns:24px 1fr 64px 64px 56px;gap:8px;color:#7fa8ca;font-size:10px;">
                <div>#</div><div>段</div><div style="text-align:right;">平均</div><div style="text-align:right;">P95</div><div style="text-align:right;">占比</div>
            </div>
            ${rows || '<div style="color:#9bb7d3;">正在采样中……先进房、打怪、开隐藏房再看。</div>'}
        `;
    }

    refreshRuntimeStats(force = false) {
        if (!this.visible && !force) return;
        const now = performance.now();
        if (!force && now - this.lastStatsUpdate < 250) return;
        this.lastStatsUpdate = now;

        const container = document.getElementById('debugRuntimeStats');
        if (!container) return;

        const summary = this.game?.perfMonitor?.getSummary
            ? this.game.perfMonitor.getSummary()
            : {
                fps: Math.round(this.game?.perfMonitor?.avgFps || 0),
                frameTime: this.game?.perfMonitor?.frameTime || 0
            };
        const hud = this.game?.sidebarHudPresenter?.getDebugSnapshot
            ? this.game.sidebarHudPresenter.getDebugSnapshot()
            : null;

        const stats = [
            ['真实FPS', summary.fps || 0],
            ['60帧均值', summary.avgFps || summary.fps || 0],
            ['实时帧时', `${Number(summary.frameTime || 0).toFixed(1)}ms`],
            ['Low', `${summary.minFps || summary.fps || 0} / ${Number(summary.worstFrameTime || summary.frameTime || 0).toFixed(1)}ms`],
            ['敌人', this.getActiveEnemyCount()],
            ['子弹', this.game?.bullets?.length || 0],
            ['粒子', this.getParticleCount()],
            ['HUD', hud ? `${hud.lastFrameCost.toFixed(2)}ms` : '-'],
            ['房间', this.game?.allRooms?.size || 0],
            ['监视', this.game?.perfMonitor?.visible ? 'ON' : 'OFF']
        ];

        container.innerHTML = stats.map(([label, value]) => `
            <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:4px;padding:4px 6px;">
                <div style="color:#888;">${label}</div>
                <div style="color:#fff;font-weight:bold;">${value}</div>
            </div>
        `).join('');

        const btn = document.getElementById('debugPerfToggle');
        if (btn) btn.textContent = `📊 性能: ${this.game?.perfMonitor?.visible ? 'ON' : 'OFF'}`;
        this.syncFloorJumpSelect();
        this.refreshFrameProfilerStats(force);
        this.refreshAutoPlayStats(force);
        this.refreshHiddenRoomEditorTools();
    }

    syncFloorJumpSelect(force = false) {
        const select = document.getElementById('debugFloorSelect');
        if (!select) return;
        if (this.pendingFloorJumpValue && !force) {
            if (select.value !== this.pendingFloorJumpValue) select.value = this.pendingFloorJumpValue;
            return;
        }
        if (!force && document.activeElement === select) return;
        const current = String(Math.max(1, Math.min(this.game?.maxFloors || 7, this.game?.currentFloor || 1)));
        if (select.value !== current) select.value = current;
    }

    jumpToSelectedFloor() {
        const select = document.getElementById('debugFloorSelect');
        const floor = Number(this.pendingFloorJumpValue || select?.value || this.game?.currentFloor || 1);
        const ok = this.game?.debugJumpToFloor?.(floor);
        if (ok) {
            this.pendingFloorJumpValue = null;
            this.syncFloorJumpSelect(true);
        }
        return ok;
    }
    
    // 填充下拉选项
    populateSelects() {
        this.syncFloorJumpSelect(true);
        // 武器选择
        const weaponSelect = document.getElementById('debugWeaponSelect');
        if (weaponSelect && typeof WEAPONS !== 'undefined') {
            weaponSelect.innerHTML = '<option value="">选择武器...</option>' +
                Object.entries(WEAPONS).filter(([, w]) => !w?.hiddenFromPool).map(([key, w]) => 
                    `<option value="${key}">${w.name}</option>`
                ).join('');
        }
        
        // 被动选择
        const passiveSelect = document.getElementById('debugPassiveSelect');
        if (passiveSelect && typeof PASSIVES !== 'undefined') {
            passiveSelect.innerHTML = '<option value="">选择被动...</option>' +
                Object.entries(PASSIVES).filter(([, p]) => !p?.hiddenFromPool).map(([key, p]) => 
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

        // 宠物选择
        const petSelect = document.getElementById('debugPetSelect');
        if (petSelect && typeof PETS !== 'undefined') {
            petSelect.innerHTML = '<option value="">选择宠物...</option>' +
                Object.values(PETS).map(pet =>
                    `<option value="${pet.id}">${pet.icon || ''} ${pet.name}</option>`
                ).join('');
        }
    }
}

// 导出到全局
window.DebugPanel = DebugPanel;

DebugPanel.prototype.refreshHiddenRoomEditorTools = function () {
    const status = document.getElementById('debugHiddenLayoutStatus');
    const toggle = document.getElementById('debugHiddenLayoutToggle');
    const assetsEl = document.getElementById('debugHiddenLayoutAssets');
    const editor = window.HiddenRoomLayoutEditor;
    const active = !!editor?.isActive?.();
    const info = editor?.getSelectedInfo?.() || null;
    const lastAction = editor?.getLastAction?.() || null;
    const assets = editor?.getAssetLibrary?.() || [];
    const selected = info?.label || '未选中';
    const floor = (this.game?.curRoom?.type === 'hidden' || (Number(this.game?.curRoom?.floor) === 7 && this.game?.curRoom?.floor7Role === 'awakening'))
        ? (this.game.curRoom.hiddenRoomFloor || this.game.curRoom.floor || this.game.currentFloor || '-')
        : '-';
    if (toggle) toggle.textContent = `编辑: ${active ? 'ON' : 'OFF'}`;
    if (status) {
        const x = info ? Math.round(info.x) : '-';
        const y = info ? Math.round(info.y) : '-';
        const scale = info ? Number(info.scale || 1).toFixed(2) : '-';
        const scaleX = info ? Number(info.scaleX || 1).toFixed(2) : '-';
        const scaleY = info ? Number(info.scaleY || 1).toFixed(2) : '-';
        const width = info && info.w != null ? Math.round(info.w) : '-';
        const height = info && info.h != null ? Math.round(info.h) : '-';
        const rot = info ? Math.round((info.rotation || 0) * 180 / Math.PI) : '-';
        const layer = info ? info.layer : '-';
        const alpha = info ? Number(info.alpha || 1).toFixed(2) : '-';
        const lastActionText = !lastAction
            ? '无'
            : (lastAction.type === 'place_success'
                ? `放置 ${lastAction.assetName} x${lastAction.countCreated} @ (${lastAction.x}, ${lastAction.y})`
                : `失败 ${lastAction.reason}${lastAction.assetName ? ` / ${lastAction.assetName}` : ''}`);
        status.innerHTML = `当前层 <b>${floor}</b><br>状态 <b>${active ? '编辑中' : '未启用'}</b><br>选中 <b>${selected}</b><br>坐标 <b>${x}, ${y}</b> / 缩放 <b>${scale}</b><br>透明 <b>${alpha}</b> / 旋转 <b>${rot}°</b><br>宽高 <b>${width} x ${height}</b> / 拉伸 <b>${scaleX}, ${scaleY}</b><br>层级 <b>${layer}</b><br>最后动作 <b>${lastActionText}</b><br>鼠标 <b>左键拖拽 / 滚轮缩放</b><br>键盘 <b>方向键移动 / [ ] 切换</b>`;
    }
    if (!assetsEl) return;
    assetsEl.style.pointerEvents = 'auto';
    if (!assets.length) {
        assetsEl.innerHTML = '<div style="font-size:11px;color:#9bb7d3;pointer-events:auto;">内置素材仍在加载，或当前没有可用素材。</div>';
        return;
    }
    assetsEl.innerHTML = assets.map((asset) => `
        <div style="display:grid;grid-template-columns:56px 1fr;gap:6px;padding:6px;border:1px solid rgba(255,255,255,0.08);border-radius:4px;background:rgba(255,255,255,0.03);pointer-events:auto;">
            <img src="${asset.src}" alt="${asset.name}" style="width:56px;height:56px;object-fit:contain;background:rgba(0,0,0,0.18);border-radius:3px;pointer-events:none;">
            <div style="pointer-events:auto;">
                <div style="color:#fff;font-size:11px;word-break:break-all;">${asset.name}</div>
                <div style="color:#8fb3d6;font-size:10px;margin:2px 0 6px;">${asset.width} x ${asset.height}</div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;pointer-events:auto;">
                    <button type="button" onclick="console.info('[DebugPanel] inline asset click',{assetId:'${asset.id}',count:1}); window.HiddenRoomLayoutEditor && window.HiddenRoomLayoutEditor.placeAssetDirect && window.HiddenRoomLayoutEditor.placeAssetDirect('${asset.id}', 1);" style="padding:4px;background:#2d6b4a;border:none;color:#fff;border-radius:3px;cursor:pointer;font-size:11px;pointer-events:auto;position:relative;z-index:2;">放置 1 个</button>
                    <button type="button" onclick="console.info('[DebugPanel] inline asset click',{assetId:'${asset.id}',count:5}); window.HiddenRoomLayoutEditor && window.HiddenRoomLayoutEditor.placeAssetDirect && window.HiddenRoomLayoutEditor.placeAssetDirect('${asset.id}', 5);" style="padding:4px;background:#356b88;border:none;color:#fff;border-radius:3px;cursor:pointer;font-size:11px;pointer-events:auto;position:relative;z-index:2;">放置 5 个</button>
                </div>
            </div>
        </div>
    `).join('');
};
