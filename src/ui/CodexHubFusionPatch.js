(function attachCodexHubFusionPatch(global) {
    'use strict';

    const codex = global.collectionCodex;
    if (!codex || codex.__hubFusionPatched) return;
    codex.__hubFusionPatched = true;

    const proto = Object.getPrototypeOf(codex);
    const originalRenderSidebar = proto.renderSidebar;
    const originalRenderHeader = proto.renderHeader;
    const originalRenderTools = proto.renderTools;
    const originalRenderContent = proto.renderContent;

    function ensurePatchStyles() {
        if (document.getElementById('collectionCodexHubFusionStyles')) return;
        const style = document.createElement('style');
        style.id = 'collectionCodexHubFusionStyles';
        style.textContent = `
            .codexhub-overlay {
                position: fixed;
                inset: 0;
                z-index: 16000;
                display: none;
                align-items: stretch;
                justify-content: center;
                padding: 0;
                overflow: hidden;
                background:
                    radial-gradient(circle at top, rgba(235, 185, 99, 0.14), transparent 24%),
                    linear-gradient(180deg, rgba(5, 5, 7, 0.92), rgba(2, 2, 4, 0.98));
                backdrop-filter: blur(12px);
            }
            .codexhub-shell {
                width: 100%;
                height: 100dvh;
                min-height: 100dvh;
                display: flex;
                flex-direction: column;
            }
            .codexhub-page {
                width: 100%;
                max-width: min(1680px, calc(100vw - 28px));
                margin: 0 auto;
                min-height: 0;
                flex: 1;
                display: grid;
                grid-template-rows: auto minmax(0, 1fr);
                padding: max(14px, env(safe-area-inset-top)) max(14px, env(safe-area-inset-right)) max(14px, env(safe-area-inset-bottom)) max(14px, env(safe-area-inset-left));
                box-sizing: border-box;
            }
            .codexhub-topbar {
                display: grid;
                gap: 16px;
                padding: 18px 20px 16px;
                border: 1px solid rgba(205, 164, 105, 0.16);
                border-radius: 26px;
                background:
                    radial-gradient(circle at top, rgba(255, 222, 171, 0.06), transparent 46%),
                    linear-gradient(180deg, rgba(20, 16, 12, 0.96), rgba(10, 9, 7, 0.98));
                box-shadow: inset 0 0 0 1px rgba(255,255,255,0.03), 0 20px 52px rgba(0,0,0,0.22);
                backdrop-filter: blur(8px);
            }
            .codexhub-topline {
                display: grid;
                grid-template-columns: 168px minmax(0, 1fr) 168px;
                align-items: center;
                gap: 16px;
            }
            .codexhub-backslot,
            .codexhub-backghost {
                display: flex;
                align-items: center;
            }
            .codexhub-backghost {
                visibility: hidden;
                pointer-events: none;
            }
            .codexhub-brand {
                display: grid;
                justify-items: center;
                text-align: center;
                gap: 6px;
            }
            .collection-topbar-kicker {
                font-size: 11px;
                letter-spacing: 0.18em;
                text-transform: uppercase;
                color: #d7a25b;
            }
            .collection-topbar-title {
                margin: 0;
                font-size: clamp(30px, 4.2vw, 52px);
                line-height: 0.98;
                color: #f7eedf;
                letter-spacing: 0.03em;
            }
            .collection-topbar-sub {
                max-width: 760px;
                color: #bda98c;
                font-size: 13px;
                line-height: 1.65;
            }
            .codexhub-navrow {
                display: flex;
                justify-content: center;
                align-items: center;
            }
            .collection-topnav {
                display: inline-grid;
                grid-auto-flow: column;
                gap: 10px;
                padding: 8px;
                border-radius: 18px;
                border: 1px solid rgba(255,255,255,0.07);
                background: rgba(255,255,255,0.03);
                box-shadow: inset 0 0 0 1px rgba(255,255,255,0.02);
            }
            .collection-topnav-btn {
                min-width: 116px;
                min-height: 48px;
                padding: 0 18px;
                border-radius: 14px;
                border: 1px solid rgba(255,255,255,0.06);
                background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015));
                color: #dccaaf;
                font: inherit;
                font-size: 15px;
                font-weight: 800;
                cursor: pointer;
                transition: transform 0.14s ease, border-color 0.14s ease, filter 0.14s ease;
            }
            .collection-topnav-btn:hover { transform: translateY(-1px); filter: brightness(1.05); }
            .collection-topnav-btn.active {
                border-color: rgba(230, 188, 118, 0.34);
                background: linear-gradient(180deg, rgba(134, 93, 45, 0.38), rgba(47, 31, 18, 0.42));
                color: #fff3dd;
                box-shadow: inset 0 0 0 1px rgba(255, 232, 196, 0.05), 0 10px 22px rgba(0,0,0,0.18);
            }
            .collection-topbar-close {
                min-width: 140px;
                min-height: 48px;
                padding: 0 18px;
                border-radius: 14px;
                border: 1px solid rgba(255,255,255,0.08);
                background: linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02));
                color: #f0e4d1;
                font: inherit;
                font-weight: 700;
                cursor: pointer;
            }
            .codexhub-body {
                min-height: 0;
                margin-top: 18px;
                display: grid;
                grid-template-columns: 320px minmax(0, 1fr);
                gap: 18px;
                align-items: stretch;
                isolation: isolate;
            }
            .codexhub-body.is-single {
                grid-template-columns: 1fr;
            }
            .codexhub-sidebar,
            .codexhub-main {
                min-height: 0;
                border: 1px solid rgba(197, 155, 96, 0.16);
                border-radius: 24px;
                background:
                    linear-gradient(180deg, rgba(16, 13, 10, 0.965), rgba(8, 8, 6, 0.985)),
                    linear-gradient(90deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01));
                box-shadow: inset 0 0 0 1px rgba(255,255,255,0.02);
                overflow: hidden;
            }
            .codexhub-sidebar {
                position: relative;
                z-index: 3;
                display: flex;
                flex-direction: column;
                padding: 18px;
                pointer-events: auto;
            }
            .codexhub-main {
                position: relative;
                z-index: 1;
                display: flex;
                flex-direction: column;
                min-width: 0;
            }
            .collection-nav,
            .collection-nav-btn {
                pointer-events: auto;
            }
            .collection-header,
            .collection-tools,
            .collection-content {
                width: 100%;
                max-width: none;
                margin: 0;
                box-sizing: border-box;
            }
            .collection-header { padding: 20px 22px 0; }
            .collection-tools { padding: 14px 22px 0; }
            .collection-content {
                padding: 18px 22px 22px;
                min-height: 0;
                overflow: auto;
            }
            .collection-main.is-wide .collection-header,
            .collection-main.is-wide .collection-tools,
            .collection-main.is-wide .collection-content {
                max-width: none;
                margin: 0;
            }
            .collection-header-text h3 {
                font-size: clamp(28px, 3.4vw, 42px);
            }
            .collection-tools:empty { display: none; }
            .collection-hub-note {
                padding: 12px 14px;
                border-radius: 14px;
                border: 1px solid rgba(255,255,255,0.06);
                background: rgba(255,255,255,0.03);
                color: #c6b398;
                font-size: 13px;
                line-height: 1.65;
            }
            .collection-talents-wrap,
            .collection-achievement-wrap,
            .collection-codex-wrap {
                display: grid;
                gap: 16px;
                align-content: start;
            }
            @media (max-width: 1180px) {
                .codexhub-body {
                    grid-template-columns: 280px minmax(0, 1fr);
                }
            }
            @media (max-width: 960px) {
                .codexhub-page {
                    max-width: none;
                    padding-left: max(10px, env(safe-area-inset-left));
                    padding-right: max(10px, env(safe-area-inset-right));
                    padding-bottom: max(10px, env(safe-area-inset-bottom));
                }
                .codexhub-topbar {
                    padding: 16px 14px 14px;
                    gap: 14px;
                }
                .codexhub-topline {
                    grid-template-columns: 1fr;
                    justify-items: center;
                }
                .codexhub-backslot,
                .codexhub-backghost {
                    width: 100%;
                    justify-content: center;
                }
                .codexhub-backghost { display: none; }
                .collection-topbar-sub {
                    max-width: none;
                    font-size: 12px;
                }
                .codexhub-body {
                    grid-template-columns: 1fr;
                }
                .codexhub-sidebar {
                    display: none !important;
                }
                .collection-header,
                .collection-tools,
                .collection-content {
                    padding-left: 14px;
                    padding-right: 14px;
                }
                .collection-topnav {
                    width: 100%;
                    grid-template-columns: repeat(3, minmax(0, 1fr));
                    gap: 8px;
                    justify-content: stretch;
                }
                .collection-topnav-btn {
                    min-width: 0;
                    padding: 0 10px;
                    font-size: 14px;
                }
                .collection-board {
                    grid-template-columns: 1fr;
                }
                .inherit-talent-layout {
                    grid-template-columns: 1fr !important;
                }
            }
        `;
        document.head.appendChild(style);
    }

    function applyLauncherLabels() {
        const inheritanceBtn = document.getElementById('menuInheritance');
        if (inheritanceBtn) {
            const span = inheritanceBtn.querySelector('span');
            if (span) span.textContent = '天赋图鉴';
        }
        const collectionBtn = document.getElementById('menuCollection');
        if (collectionBtn) collectionBtn.style.display = 'none';
        const storyCodexBtn = document.getElementById('codexBtn');
        if (storyCodexBtn) storyCodexBtn.textContent = '📚 天赋图鉴';
    }

    function patchGameApi() {
        const game = global.game;
        if (!game || game.__hubFusionPatched) return false;
        game.__hubFusionPatched = true;
        game.openCollection = function patchedOpenCollection(initialTab = 'characters') {
            if (global.collectionCodex) {
                global.collectionCodex.open(initialTab || 'characters');
                return;
            }
            this.showToast?.('天赋图鉴未加载。', { tone: 'warn', duration: 2200 });
        };
        game.openInheritance = function patchedOpenInheritance() {
            if (global.collectionCodex) {
                global.collectionCodex.open('talents');
                return;
            }
            this.showToast?.('天赋图鉴未加载。', { tone: 'warn', duration: 2200 });
        };
        return true;
    }

    ensurePatchStyles();
    applyLauncherLabels();
    global.addEventListener('DOMContentLoaded', applyLauncherLabels);
    const patchTimer = global.setInterval(() => {
        if (patchGameApi()) global.clearInterval(patchTimer);
    }, 400);
    global.setTimeout(() => global.clearInterval(patchTimer), 12000);

    codex.activeSection = codex.activeSection || 'codex';
    codex.lastCodexTab = codex.lastCodexTab || (codex.activeTab === 'achievements' ? 'characters' : codex.activeTab || 'characters');
    codex.selectedTalentKey = codex.selectedTalentKey || 'final_dmg';

    proto.getMeta = function getMeta() {
        return global.game?.metaProgress?.getMetaState?.() || global.MetaProgressSchemas?.createDefaultMetaProgress?.() || null;
    };

    proto.getHubSections = function getHubSections() {
        return [
            { key: 'codex', label: '图鉴', desc: '角色、敌人、道具、剧情' },
            { key: 'achievements', label: '成就', desc: '里程碑与收藏进度' },
            { key: 'talents', label: '天赋', desc: '局外成长与点数投入' }
        ];
    };

    proto.resolveHubTarget = function resolveHubTarget(target) {
        const normalized = String(target || '').trim();
        if (normalized === 'talents' || normalized === 'talent') {
            return { section: 'talents', tab: null };
        }
        if (normalized === 'achievements' || normalized === 'achievement') {
            return { section: 'achievements', tab: 'achievements' };
        }
        const codexKeys = new Set((this.getCategories?.() || []).map((item) => item.key));
        if (codexKeys.has(normalized)) {
            return { section: 'codex', tab: normalized };
        }
        return { section: 'codex', tab: this.lastCodexTab || 'characters' };
    };

    proto.ensureOverlay = function patchedEnsureOverlay() {
        if (this.overlay && this.overlay.dataset.hubFusionBuilt === '1') return;
        if (this.overlay && this.overlay.parentNode) this.overlay.parentNode.removeChild(this.overlay);
        this.overlay = document.createElement('div');
        this.overlay.className = 'collection-overlay codexhub-overlay';
        this.overlay.dataset.hubFusionBuilt = '1';
        this.overlay.innerHTML = `
            <div class="codexhub-shell">
                <div class="codexhub-page">
                    <header class="codexhub-topbar">
                        <div class="codexhub-topline">
                            <div class="codexhub-backslot"><button type="button" class="collection-topbar-close">返回菜单</button></div>
                            <div class="collection-topbar-brand codexhub-brand"></div>
                            <div class="codexhub-backghost"><button type="button" class="collection-topbar-close" tabindex="-1" aria-hidden="true">返回菜单</button></div>
                        </div>
                        <div class="codexhub-navrow">
                            <div class="collection-topnav"></div>
                        </div>
                    </header>
                    <div class="codexhub-body">
                        <aside class="collection-sidebar codexhub-sidebar"></aside>
                        <section class="collection-main codexhub-main">
                            <div class="collection-header"></div>
                            <div class="collection-tools"></div>
                            <div class="collection-content"></div>
                        </section>
                    </div>
                </div>
            </div>
        `;
        this.brand = this.overlay.querySelector('.collection-topbar-brand');
        this.sectionNav = this.overlay.querySelector('.collection-topnav');
        this.closeBtn = this.overlay.querySelector('.collection-topbar-close');
        this.body = this.overlay.querySelector('.codexhub-body');
        this.sidebar = this.overlay.querySelector('.collection-sidebar');
        this.main = this.overlay.querySelector('.collection-main');
        this.header = this.overlay.querySelector('.collection-header');
        this.tools = this.overlay.querySelector('.collection-tools');
        this.content = this.overlay.querySelector('.collection-content');
        this.closeBtn.addEventListener('click', () => this.close());
        this.overlay.addEventListener('click', (event) => {
            if (event.target === this.overlay) this.close();
        });
        document.body.appendChild(this.overlay);
    };

    proto.getCategories = function patchedGetCategories() {
        return [
            { key: 'characters', label: '角色档案', hint: '角色', icon: '🎭', kicker: '角色' },
            { key: 'enemies', label: '敌人图鉴', hint: '敌人', icon: '👁️', kicker: '敌人' },
            { key: 'items', label: '道具图鉴', hint: '道具', icon: '🎒', kicker: '道具' },
            { key: 'arsenal', label: '武器 + 被动', hint: '武器 / 被动', icon: '⚔️', kicker: '武器' },
            { key: 'totems', label: '图腾遗物', hint: '图腾', icon: '🦴', kicker: '图腾' },
            { key: 'story', label: '剧情碎片', hint: '碎片', icon: '🧾', kicker: '碎片' }
        ];
    };

    proto.renderTopbar = function renderTopbar() {
        const sectionMeta = {
            codex: {
                kicker: 'Archive / Build',
                title: '天赋图鉴',
                sub: '把图鉴、成就、天赋整合到一页，收口成一个真正能长期维护的总览中心。'
            },
            achievements: {
                kicker: 'Milestones',
                title: '天赋图鉴',
                sub: '查看关键里程碑、收集完成度，以及当前局外推进的整体节奏。'
            },
            talents: {
                kicker: 'Meta Growth',
                title: '天赋图鉴',
                sub: '这里专门处理局外成长、点数分配和可持续强化，不再拆成另一套弹窗。'
            }
        }[this.activeSection || 'codex'];
        this.brand.innerHTML = `
            <div class="collection-topbar-kicker">${sectionMeta.kicker}</div>
            <h2 class="collection-topbar-title">${sectionMeta.title}</h2>
            <div class="collection-topbar-sub">${sectionMeta.sub}</div>
        `;
        this.sectionNav.innerHTML = this.getHubSections().map((section) => `
            <button type="button" class="collection-topnav-btn ${this.activeSection === section.key ? 'active' : ''}" data-hub-section="${section.key}" title="${section.desc}">${section.label}</button>
        `).join('');
        this.sectionNav.querySelectorAll('[data-hub-section]').forEach((button) => {
            button.addEventListener('click', () => {
                const section = button.getAttribute('data-hub-section') || 'codex';
                if (section === this.activeSection) return;
                this.activeSection = section;
                if (section === 'codex') {
                    this.activeTab = this.lastCodexTab || 'characters';
                } else if (section === 'achievements') {
                    this.activeTab = 'achievements';
                }
                this.selectedEntryKey = null;
                this.searchTerm = '';
                this.showUnlockedOnly = false;
                this.render();
            });
        });
    };

    proto.open = function patchedOpen(target = 'characters') {
        this.syncFromGame(global.game);
        const resolved = this.resolveHubTarget(target);
        this.activeSection = resolved.section;
        if (resolved.section === 'codex') {
            this.lastCodexTab = resolved.tab || this.lastCodexTab || 'characters';
            this.activeTab = this.lastCodexTab;
        } else if (resolved.section === 'achievements') {
            this.activeTab = 'achievements';
        }
        this.selectedEntryKey = null;
        this.ensureOverlay();
        this.render();
        this.overlay.style.display = 'flex';
        document.addEventListener('keydown', this._escHandler);
        global.game?.refreshPauseState?.();
    };

    proto.render = function patchedRender() {
        this.renderTopbar();
        const isSingle = this.activeSection !== 'codex';
        this.body.classList.toggle('is-single', isSingle);
        this.main.classList.toggle('is-wide', isSingle);
        this.sidebar.style.display = isSingle ? 'none' : 'flex';
        this.renderSidebar();
        this.renderHeader();
        this.renderTools();
        this.renderContent();
    };

    proto.renderSidebar = function patchedRenderSidebar() {
        if (this.activeSection !== 'codex') {
            this.sidebar.innerHTML = '';
            return;
        }
        const categories = this.getCategories();
        const total = this.getTotalProgress?.() || { unlocked: 0, total: 0 };
        this.activeTab = this.lastCodexTab || this.activeTab || 'characters';
        const currentMeta = this.getCurrentTabMeta?.() || { title: '图鉴' };
        this.sidebar.innerHTML = `
            <div class="collection-brand">
                <div class="collection-kicker">Codex / Archive</div>
                <h2>天赋图鉴</h2>
                <p>图鉴内容集中收在这里，成就与天赋放到上方一级导航，避免再拆成两套页面。</p>
                <div class="collection-brand-progress">
                    <div class="collection-mini-stat">
                        <div class="label">总归档</div>
                        <div class="value">${total.unlocked}/${total.total}</div>
                    </div>
                    <div class="collection-mini-stat">
                        <div class="label">当前分页</div>
                        <div class="value">${global.collectionEscapeHtml ? global.collectionEscapeHtml(currentMeta.title) : currentMeta.title}</div>
                    </div>
                </div>
            </div>
            <div class="collection-nav"></div>
        `;
        const nav = this.sidebar.querySelector('.collection-nav');
        categories.forEach((category) => {
            const progress = this.getCategoryProgress?.(category.key) || { unlocked: 0, total: 0 };
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `collection-nav-btn ${this.activeTab === category.key ? 'active' : ''}`;
            button.dataset.categoryKey = category.key;
            button.innerHTML = `
                <span class="collection-nav-icon">${global.collectionEscapeHtml ? global.collectionEscapeHtml(category.icon) : category.icon}</span>
                <span>
                    <div class="collection-nav-title">${global.collectionEscapeHtml ? global.collectionEscapeHtml(category.label) : category.label}</div>
                    <div class="collection-nav-hint">${global.collectionEscapeHtml ? global.collectionEscapeHtml(category.hint) : category.hint}</div>
                </span>
                <span class="collection-nav-meta">${progress.unlocked}/${progress.total}</span>
            `;
            button.addEventListener('click', () => {
                this.activeSection = 'codex';
                this.activeTab = category.key;
                this.lastCodexTab = category.key;
                this.searchTerm = '';
                this.showUnlockedOnly = false;
                this.selectedEntryKey = null;
                this.render();
            });
            nav.appendChild(button);
        });
    };

    proto.renderHeader = function patchedRenderHeader() {
        if (this.activeSection === 'talents') {
            const meta = this.getMeta();
            const controller = global.game?.metaProgress || null;
            const points = Number(meta?.talents?.points) || 0;
            const spent = Number(meta?.talents?.spentPoints) || 0;
            const earned = controller?.getEarnedTalentPoints?.() || 0;
            const activeRows = controller?.getTalentSummaryRows?.() || [];
            this.header.innerHTML = `
                <div class="collection-header-main">
                    <div class="collection-header-icon">✦</div>
                    <div class="collection-header-text">
                        <div class="collection-header-kicker">Talents</div>
                        <h3>天赋谱系</h3>
                        <div class="collection-header-sub">把局外成长、可用点数和投入结构集中到一页处理，避免原来那套又大又空的旧弹窗。</div>
                    </div>
                </div>
                <div class="collection-progress">
                    <div class="collection-pill">可用点数<strong>${points}</strong></div>
                    <div class="collection-pill">已投入<strong>${spent}</strong></div>
                    <div class="collection-pill">累计获得<strong>${earned}</strong></div>
                    <div class="collection-pill">生效祷文<strong>${activeRows.length}</strong></div>
                </div>
            `;
            return;
        }
        if (this.activeSection === 'achievements') {
            this.activeTab = 'achievements';
        } else {
            this.activeTab = this.lastCodexTab || 'characters';
        }
        originalRenderHeader.call(this);
    };

    proto.renderTools = function patchedRenderTools() {
        if (this.activeSection === 'talents') {
            this.tools.innerHTML = '<div class="collection-hub-note">天赋页保留了点数投入、节点选择和重置操作。这里只做全屏化和结构整合，不再拆成另一套 UI。</div>';
            return;
        }
        if (this.activeSection === 'achievements') {
            this.activeTab = 'achievements';
        } else {
            this.activeTab = this.lastCodexTab || 'characters';
        }
        originalRenderTools.call(this);
    };

    proto.renderTalentsHub = function renderTalentsHub() {
        global.inheritancePanel?.ensureStyle?.();
        const meta = this.getMeta();
        const levels = meta?.talents?.levels || {};
        const controller = global.game?.metaProgress || null;
        const summaryRows = controller?.getTalentSummaryRows?.() || [];
        const availablePoints = Number(meta?.talents?.points) || 0;
        const spentPoints = Number(meta?.talents?.spentPoints) || 0;
        const earnedPoints = controller?.getEarnedTalentPoints?.() || 0;
        const groups = [1, 2, 3].map((tier) => ({
            tier,
            entries: (global.MetaTalentData?.defs || []).filter((item) => item.tier === tier)
        }));
        const allDefs = groups.flatMap((group) => group.entries);
        const selectedDef = global.MetaTalentData?.byKey?.[this.selectedTalentKey] || allDefs[0] || null;
        if (selectedDef && !global.MetaTalentData?.byKey?.[this.selectedTalentKey]) {
            this.selectedTalentKey = selectedDef.key;
        }
        const selectedLevel = selectedDef ? Math.max(0, Number(levels[selectedDef.key]) || 0) : 0;
        const selectedCheck = selectedDef ? (controller?.canUpgradeTalent?.(selectedDef.key) || { ok: false, reason: '', cost: 0 }) : null;
        const selectedUnlock = selectedDef ? (controller?.getTalentUnlockProgress?.(selectedDef) || { current: 0, required: 0 }) : { current: 0, required: 0 };
        const selectedCurrentText = selectedDef
            ? (global.MetaTalentData?.formatTalentProgress?.(selectedDef, selectedLevel) || '尚未投入')
            : '';
        const selectedNextText = selectedDef
            ? (global.MetaTalentData?.formatTalentNextValue?.(selectedDef, selectedLevel) || '已满级')
            : '';
        const selectedNextCost = selectedDef && selectedLevel < selectedDef.maxLevel ? global.MetaTalentData.getTalentCost(selectedDef, selectedLevel) : 0;
        return `
            <div class="collection-talents-wrap">
                <section class="inherit-resource-bar">
                    <article class="inherit-resource-main">
                        <h4>天赋祭坛</h4>
                    </article>
                    <div class="inherit-resource-side">
                        <div class="inherit-resource-chip"><strong>${availablePoints}</strong><span>可用点数</span></div>
                        <div class="inherit-resource-chip"><strong>${spentPoints}</strong><span>已投入成本</span></div>
                        <div class="inherit-resource-chip"><strong>${earnedPoints}</strong><span>累计获得</span></div>
                        <div class="inherit-resource-chip"><strong>${summaryRows.length}</strong><span>生效祷文</span></div>
                    </div>
                </section>
                <section class="inherit-talent-layout">
                    <div>
                        ${groups.map((group) => {
                            const tierInvested = controller?.getTalentInvestments?.(levels, [group.tier]) || 0;
                            const unlockNeed = group.tier === 1 ? '默认开启'
                                : group.tier === 2 ? '需要第 1 层累计投入 5 次'
                                : '需要第 1 + 2 层累计投入 12 次';
                            return `
                                <section class="inherit-tier">
                                    <div class="inherit-tier-band">
                                        <div>
                                            <strong>第 ${group.tier} 层</strong>
                                            <span>${group.tier === 1 ? '基础生存与输出' : group.tier === 2 ? '经济与构筑强化' : '关键局外特权'}</span>
                                        </div>
                                        <div class="inherit-tier-lock">本层累计投入 ${tierInvested} 次 · ${unlockNeed}</div>
                                    </div>
                                    <div class="inherit-talent-grid">
                                        ${group.entries.map((def) => {
                                            const level = Math.max(0, Number(levels[def.key]) || 0);
                                            const check = controller?.canUpgradeTalent?.(def.key) || { ok: false, reason: '', cost: 0 };
                                            const nodeClass = [
                                                'inherit-talent-node',
                                                this.selectedTalentKey === def.key ? 'active' : '',
                                                !check.ok && level <= 0 && def.tier > 1 ? 'locked' : ''
                                            ].filter(Boolean).join(' ');
                                            return `
                                                <button type="button" class="${nodeClass}" data-action="select-talent" data-talent-key="${def.key}">
                                                    <div class="inherit-talent-node-icon">${def.icon || '✦'}</div>
                                                    <div class="inherit-talent-node-name">${def.title}</div>
                                                    <div class="inherit-talent-node-meta">Lv.${level}/${def.maxLevel}</div>
                                                </button>
                                            `;
                                        }).join('')}
                                    </div>
                                </section>
                            `;
                        }).join('')}
                    </div>
                    ${selectedDef ? `
                        <aside class="inherit-talent-detail">
                            <div class="inherit-talent-detail-head">
                                <div class="inherit-talent-detail-icon">${selectedDef.icon || '✦'}</div>
                                <div>
                                    <h4>${selectedDef.title}</h4>
                                    <p>${selectedDef.effectDesc}</p>
                                </div>
                            </div>
                            <div class="inherit-chip-row">
                                <span class="inherit-chip">${selectedDef.type}</span>
                                <span class="inherit-chip">Lv.${selectedLevel}/${selectedDef.maxLevel}</span>
                                <span class="inherit-chip">费用 ${selectedDef.costs.join(' / ')}</span>
                            </div>
                            <div class="inherit-talent-detail-stats">
                                <div class="inherit-talent-detail-stat"><strong>当前收益</strong><span>${selectedCurrentText}</span></div>
                                <div class="inherit-talent-detail-stat"><strong>下一档</strong><span>${selectedNextText}${selectedLevel < selectedDef.maxLevel ? ` · 消耗 ${selectedNextCost} 点` : ''}</span></div>
                                <div class="inherit-talent-detail-stat"><strong>解锁条件</strong><span>${selectedDef.unlockCondition}${selectedUnlock.required > 0 ? `（${selectedUnlock.current}/${selectedUnlock.required}）` : ''}</span></div>
                                <div class="inherit-talent-detail-stat"><strong>说明</strong><span>${selectedDef.desc}</span></div>
                            </div>
                            <div class="inherit-actions">
                                <button type="button" class="inherit-action primary" data-action="upgrade-talent" data-talent-key="${selectedDef.key}" ${selectedCheck?.ok ? '' : 'disabled'}>${selectedLevel < selectedDef.maxLevel ? `投入 ${selectedNextCost} 点` : '已满级'}</button>
                                <button type="button" class="inherit-action" data-action="reset-talents">全部重置</button>
                            </div>
                        </aside>
                    ` : ''}
                </section>
            </div>
        `;
    };

    proto.bindTalentActions = function bindTalentActions() {
        this.content.querySelectorAll('[data-action="select-talent"]').forEach((button) => {
            button.addEventListener('click', () => {
                const key = button.getAttribute('data-talent-key');
                if (!key) return;
                this.selectedTalentKey = key;
                this.render();
            });
        });
        this.content.querySelectorAll('[data-action="upgrade-talent"]').forEach((button) => {
            button.addEventListener('click', () => {
                const key = button.getAttribute('data-talent-key');
                const result = global.game?.metaProgress?.upgradeTalent?.(key);
                if (!result?.ok) {
                    global.game?.showToast?.(result?.reason || '无法投入该天赋。', { tone: 'warn', duration: 1800 });
                    return;
                }
                this.render();
            });
        });
        this.content.querySelectorAll('[data-action="reset-talents"]').forEach((button) => {
            button.addEventListener('click', () => {
                global.game?.metaProgress?.resetTalents?.();
                this.render();
            });
        });
    };

    proto.renderContent = function patchedRenderContent() {
        if (this.activeSection === 'talents') {
            this.content.innerHTML = this.renderTalentsHub();
            this.bindTalentActions();
            return;
        }
        if (this.activeSection === 'achievements') {
            this.activeTab = 'achievements';
        } else {
            this.activeTab = this.lastCodexTab || 'characters';
        }
        originalRenderContent.call(this);
        if (this.activeSection === 'codex') {
            this.lastCodexTab = this.activeTab || this.lastCodexTab || 'characters';
        }
    };

    if (global.MenuController?.prototype && !global.MenuController.prototype.__hubFusionPatched) {
        const menuProto = global.MenuController.prototype;
        const originalInit = menuProto.init;
        menuProto.init = function patchedMenuInit() {
            const result = originalInit.call(this);
            applyLauncherLabels();
            return result;
        };
        menuProto.__hubFusionPatched = true;
    }
})(window);
