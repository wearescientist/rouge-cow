(function attachInheritancePanel(global) {
    'use strict';

    class InheritancePanel {
        constructor() {
            this.overlay = null;
            this.activeTab = 'achievements';
            this.activeAchievementFilter = 'all';
            this.activeAchievementCategory = '主线';
            this.selectedTalentKey = 'final_dmg';
            this._escHandler = (event) => {
                if (event.key === 'Escape') this.close();
            };
            this.ensureStyle();
        }

        ensureStyle() {
            if (document.getElementById('inheritancePanelStyle')) return;
            const style = document.createElement('style');
            style.id = 'inheritancePanelStyle';
            style.textContent = `
                .inherit-overlay{position:fixed;inset:0;z-index:18050;display:none;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 0%,rgba(232,179,95,.17),transparent 32%),radial-gradient(circle at 14% 24%,rgba(110,56,23,.18),transparent 28%),linear-gradient(180deg,rgba(7,8,10,.72),rgba(3,4,5,.94));backdrop-filter:blur(18px)}
                .inherit-shell{width:min(1420px,calc(100vw - 28px));height:min(930px,calc(100vh - 28px));display:grid;grid-template-columns:320px minmax(0,1fr);border-radius:34px;overflow:hidden;border:1px solid rgba(233,192,120,.22);background:radial-gradient(circle at top,rgba(99,58,27,.34),transparent 32%),linear-gradient(180deg,rgba(18,13,10,.988),rgba(8,7,6,.99));box-shadow:0 44px 140px rgba(0,0,0,.52),inset 0 1px 0 rgba(255,235,204,.06);font-family:"Microsoft YaHei UI","PingFang SC","Segoe UI",sans-serif}
                .inherit-sidebar{padding:28px 24px;display:flex;flex-direction:column;gap:18px;border-right:1px solid rgba(228,186,115,0.1);background:radial-gradient(circle at top,rgba(102,72,32,.3),transparent 26%),linear-gradient(180deg,rgba(49,34,20,.96),rgba(17,13,10,.97))}
                .inherit-kicker{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:#d6a05c}
                .inherit-title{margin:0;font-size:42px;line-height:1.02;color:#fbf0df;text-shadow:0 3px 18px rgba(0,0,0,.36);font-family:"ZCOOL KuaiLe Local","Microsoft YaHei UI","PingFang SC",sans-serif}
                .inherit-sub{margin:0;color:#c6b293;font-size:13px;line-height:1.85}
                .inherit-hero{padding:18px 18px 20px;border-radius:26px;background:linear-gradient(180deg,rgba(255,216,149,.1),rgba(255,255,255,.02));border:1px solid rgba(255,239,211,.08);box-shadow:inset 0 1px 0 rgba(255,255,255,.04)}
                .inherit-nav{display:grid;gap:10px}
                .inherit-nav-btn{border:1px solid rgba(255,255,255,0.08);border-radius:22px;padding:16px 16px;background:linear-gradient(180deg,rgba(255,255,255,.045),rgba(255,255,255,.018));color:#efe2ce;text-align:left;cursor:pointer;font:inherit;display:grid;gap:4px}
                .inherit-nav-btn strong{font-size:16px}
                .inherit-nav-btn span{font-size:12px;color:#c9b79d}
                .inherit-nav-btn.active{border-color:rgba(227,189,123,.42);background:linear-gradient(180deg,rgba(137,95,43,.38),rgba(44,29,16,.42));box-shadow:inset 0 0 0 1px rgba(255,233,196,.06),0 12px 26px rgba(0,0,0,.18)}
                .inherit-close{margin-top:auto;border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:12px 14px;background:rgba(255,255,255,0.03);color:#f0e3ce;font:inherit;cursor:pointer}
                .inherit-main{min-width:0;min-height:0;display:flex;flex-direction:column;background:radial-gradient(circle at top,rgba(89,51,25,.2),transparent 22%)}
                .inherit-header{padding:22px 26px 16px;border-bottom:1px solid rgba(228,186,115,0.08);display:flex;justify-content:space-between;gap:18px;align-items:flex-end}
                .inherit-header h3{margin:0;font-size:28px;line-height:1.05;color:#f9edda;font-family:"ZCOOL KuaiLe Local","Microsoft YaHei UI","PingFang SC",sans-serif}
                .inherit-header p{margin:6px 0 0;color:#bca98e;font-size:13px;line-height:1.6;max-width:760px}
                .inherit-pills{display:flex;flex-wrap:wrap;gap:10px}
                .inherit-pill{padding:10px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);font-size:12px;color:#d7c6af}
                .inherit-filter-row{display:flex;flex-wrap:wrap;gap:10px}
                .inherit-filter{padding:9px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.08);background:rgba(255,255,255,.03);color:#d8c8b3;font:inherit;font-size:12px;cursor:pointer}
                .inherit-filter.active{border-color:rgba(227,189,123,.32);background:linear-gradient(180deg,rgba(125,86,41,.22),rgba(34,24,15,.28));color:#fff1dd}
                .inherit-content{flex:1 1 auto;min-height:0;padding:18px 24px 24px;overflow:auto;display:grid;gap:14px;align-content:start}
                .inherit-hero-grid{display:grid;grid-template-columns:1.4fr .9fr;gap:16px}
                .inherit-panel{position:relative;border:1px solid rgba(255,255,255,.07);border-radius:28px;padding:20px;background:linear-gradient(180deg,rgba(45,32,20,.46),rgba(18,15,11,.3));box-shadow:inset 0 1px 0 rgba(255,255,255,.03)}
                .inherit-panel::before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:linear-gradient(135deg,rgba(255,235,194,.045),transparent 32%)}
                .inherit-panel h4{margin:0 0 12px;font-size:18px;color:#f6ead6}
                .inherit-stat-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px}
                .inherit-stat-card{padding:16px;border-radius:22px;background:linear-gradient(180deg,rgba(255,214,160,.08),rgba(255,255,255,.02));border:1px solid rgba(255,255,255,.06)}
                .inherit-stat-card strong{display:block;font-size:28px;line-height:1;color:#fff0da}
                .inherit-stat-card span{display:block;margin-top:6px;font-size:12px;color:#c9b89f}
                .inherit-recent{display:grid;gap:10px}
                .inherit-recent-item{padding:13px 14px;border-radius:18px;border:1px solid rgba(255,255,255,.05);background:rgba(255,255,255,.03);color:#deceb8;font-size:13px;line-height:1.65}
                .inherit-recent-item strong{color:#fff2dd}
                .inherit-section-head{display:flex;justify-content:space-between;gap:12px;align-items:end}
                .inherit-section-head h4{margin:0;font-size:20px;color:#f5e7d3}
                .inherit-section-head p{margin:4px 0 0;font-size:12px;color:#a8967e}
                .inherit-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:16px;align-content:start}
                .inherit-card{position:relative;border:1px solid rgba(255,255,255,.07);border-radius:26px;padding:18px;background:linear-gradient(180deg,rgba(45,33,22,.42),rgba(19,15,11,.34));display:flex;flex-direction:column;gap:14px;overflow:hidden}
                .inherit-card::before{content:"";position:absolute;inset:0;border-radius:inherit;pointer-events:none;background:radial-gradient(circle at top,rgba(255,220,154,.06),transparent 34%)}
                .inherit-card.locked{opacity:.9}
                .inherit-card.featured{border-color:rgba(238,198,129,.34);background:linear-gradient(180deg,rgba(108,74,34,.26),rgba(24,18,12,.46))}
                .inherit-card.mainline{background:linear-gradient(180deg,rgba(71,47,28,.5),rgba(20,16,12,.4))}
                .inherit-card.weapon{background:linear-gradient(180deg,rgba(49,30,19,.48),rgba(18,14,11,.34))}
                .inherit-card.unlocked{box-shadow:0 18px 28px rgba(0,0,0,.14),inset 0 1px 0 rgba(255,255,255,.04)}
                .inherit-card.mystery{background:linear-gradient(180deg,rgba(22,22,24,.86),rgba(14,14,16,.96));border-style:dashed;border-color:rgba(192,197,207,.18)}
                .inherit-card.disabled{opacity:.56;border-style:dashed}
                .inherit-card-top{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
                .inherit-card-main{display:flex;gap:12px;align-items:flex-start}
                .inherit-icon{width:56px;height:56px;border-radius:18px;display:flex;align-items:center;justify-content:center;font-size:28px;background:linear-gradient(180deg,rgba(255,255,255,.07),rgba(255,255,255,.03));box-shadow:inset 0 0 0 1px rgba(255,255,255,.05)}
                .inherit-card.mystery .inherit-icon{background:linear-gradient(180deg,rgba(140,146,158,.12),rgba(255,255,255,.02));color:#d4dae4}
                .inherit-name{margin:0;font-size:20px;line-height:1.2;color:#f6ead6}
                .inherit-desc{margin:4px 0 0;color:#cebea8;font-size:13px;line-height:1.72}
                .inherit-chip-row{display:flex;flex-wrap:wrap;gap:8px}
                .inherit-chip{padding:5px 10px;border-radius:999px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);font-size:11px;color:#decfba}
                .inherit-card.mystery .inherit-chip{background:rgba(208,214,226,.04);color:#c0c7d3}
                .inherit-value-box{padding:12px 13px;border-radius:18px;background:rgba(255,255,255,.03);border:1px solid rgba(255,255,255,.05);font-size:12px;line-height:1.7;color:#decfbb}
                .inherit-value-box strong{display:block;margin-bottom:4px;color:#f8ebd8;font-size:12px}
                .inherit-progress{display:grid;gap:8px}
                .inherit-progress-meta{display:flex;justify-content:space-between;gap:10px;font-size:12px;color:#d6c7b1}
                .inherit-bar{height:8px;border-radius:999px;background:rgba(255,255,255,.06);overflow:hidden}
                .inherit-bar>span{display:block;height:100%;background:linear-gradient(90deg,#d39c53,#f4d394)}
                .inherit-card.mystery .inherit-bar>span{background:linear-gradient(90deg,#5d6470,#99a2b4)}
                .inherit-actions{display:flex;flex-wrap:wrap;gap:10px}
                .inherit-action{border:1px solid rgba(255,255,255,.08);border-radius:14px;padding:10px 12px;background:rgba(255,255,255,.04);color:#f1e4cf;font:inherit;cursor:pointer}
                .inherit-action.primary{border-color:rgba(227,189,123,.32);background:linear-gradient(180deg,rgba(125,86,41,.22),rgba(34,24,15,.28))}
                .inherit-action:disabled{opacity:.42;cursor:not-allowed}
                .inherit-tier{display:grid;gap:10px}
                .inherit-tier-band{padding:8px 2px 2px;border:none;background:none;display:flex;justify-content:space-between;gap:12px;align-items:end}
                .inherit-tier-band strong{display:block;font-size:18px;color:#fff1dd}
                .inherit-tier-band span{display:block;margin-top:2px;font-size:11px;color:#bca98f}
                .inherit-tier-lock{font-size:11px;color:#bba98f}
                .inherit-summary-list{display:grid;gap:8px;margin:0;padding:0;list-style:none}
                .inherit-summary-list li{padding:12px 13px;border-radius:18px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.05);color:#ddcfbc;font-size:13px;line-height:1.68}
                .inherit-altar{display:grid;grid-template-columns:1.2fr .8fr;gap:16px}
                .inherit-altar-main{padding:24px;border-radius:30px;border:1px solid rgba(241,208,149,.15);background:radial-gradient(circle at top,rgba(211,157,79,.18),transparent 28%),linear-gradient(180deg,rgba(56,36,22,.5),rgba(17,14,11,.38))}
                .inherit-altar-main h4{margin:0 0 10px;font-size:24px;color:#fff0d9}
                .inherit-altar-main p{margin:0;color:#cab89d;font-size:14px;line-height:1.8;max-width:680px}
                .inherit-seal-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px;margin-top:18px}
                .inherit-seal{padding:14px 12px;border-radius:20px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06);text-align:center}
                .inherit-seal strong{display:block;font-size:26px;color:#fff0d9}
                .inherit-seal span{display:block;margin-top:5px;font-size:11px;color:#cab89d}
                .inherit-talent-top{display:grid;gap:16px}
                .inherit-resource-bar{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;border-radius:20px;border:1px solid rgba(255,255,255,.06);background:linear-gradient(180deg,rgba(43,31,21,.52),rgba(15,13,11,.48))}
                .inherit-resource-main{display:flex;align-items:baseline;gap:12px;min-width:0}
                .inherit-resource-main h4{margin:0;font-size:18px;color:#fff0d9}
                .inherit-resource-main p{margin:0;color:#cab89d;font-size:12px;line-height:1.5;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
                .inherit-resource-side{display:flex;flex-wrap:wrap;gap:8px}
                .inherit-resource-chip{display:flex;align-items:center;gap:8px;padding:7px 11px;border-radius:999px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.06)}
                .inherit-resource-chip strong{display:block;font-size:15px;color:#fff0da;line-height:1}
                .inherit-resource-chip span{display:block;font-size:11px;color:#c9b89f}
                .inherit-achievement-tabs{display:flex;flex-wrap:wrap;gap:8px}
                .inherit-achievement-tab{padding:8px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.08);background:linear-gradient(180deg,rgba(84,74,110,.22),rgba(42,34,52,.24));color:#e9e2f6;font:inherit;font-size:12px;cursor:pointer}
                .inherit-achievement-tab.active{border-color:rgba(244,233,180,.4);background:linear-gradient(180deg,rgba(118,104,151,.48),rgba(64,52,87,.5));box-shadow:0 10px 22px rgba(0,0,0,.16)}
                .inherit-achievement-list{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
                .inherit-achievement-row{display:grid;grid-template-columns:44px minmax(0,1fr);gap:10px;align-items:center;padding:8px 10px;border-radius:14px;border:1px solid rgba(255,255,255,.06);background:linear-gradient(180deg,rgba(24,23,30,.92),rgba(15,14,19,.96))}
                .inherit-achievement-row.mystery{opacity:.86;border-style:dashed}
                .inherit-achievement-row-icon{width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;background:linear-gradient(180deg,rgba(252,245,177,.14),rgba(255,255,255,.03));box-shadow:inset 0 0 0 1px rgba(255,255,255,.06),0 0 12px rgba(250,232,115,.09)}
                .inherit-achievement-row.mystery .inherit-achievement-row-icon{background:linear-gradient(180deg,rgba(192,197,207,.1),rgba(255,255,255,.02));box-shadow:inset 0 0 0 1px rgba(255,255,255,.05)}
                .inherit-achievement-row-main{min-width:0;display:grid;gap:4px}
                .inherit-achievement-row-head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
                .inherit-achievement-row-head strong{font-size:13px;line-height:1.2;color:#fff4e3}
                .inherit-achievement-row-head span{font-size:10px;color:#dfd2b2;white-space:nowrap}
                .inherit-achievement-row-desc{font-size:10px;line-height:1.35;color:#d6c9af;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
                .inherit-achievement-row-bar{height:5px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden}
                .inherit-achievement-row-bar>span{display:block;height:100%;background:linear-gradient(90deg,#fff2a0,#fffef2)}
                .inherit-achievement-row-foot{display:flex;justify-content:space-between;gap:8px;align-items:center;font-size:9px;color:#d9ccb2}
                .inherit-talent-layout{display:grid;grid-template-columns:minmax(0,1fr) 252px;gap:12px;align-items:start}
                .inherit-talent-grid{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:9px}
                .inherit-talent-node{position:relative;border:1px solid rgba(255,255,255,.08);border-radius:18px;padding:9px 8px;background:linear-gradient(180deg,rgba(28,27,33,.92),rgba(17,15,20,.96));display:grid;justify-items:center;gap:6px;cursor:pointer}
                .inherit-talent-node.active{border-color:rgba(245,231,144,.48);box-shadow:0 0 28px rgba(244,229,118,.18),inset 0 0 0 1px rgba(255,247,185,.08)}
                .inherit-talent-node.locked{opacity:.58}
                .inherit-talent-node-icon{width:56px;height:56px;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:28px;background:linear-gradient(180deg,rgba(255,247,184,.16),rgba(255,255,255,.03));box-shadow:inset 0 0 0 1px rgba(255,255,255,.06)}
                .inherit-talent-node-name{font-size:12px;color:#fff2df;font-weight:700}
                .inherit-talent-node-meta{font-size:10px;color:#d8c9b3}
                .inherit-talent-detail{padding:12px;border-radius:20px;border:1px solid rgba(233,192,120,.16);background:linear-gradient(180deg,rgba(38,29,22,.94),rgba(17,14,11,.98));position:sticky;top:0;display:grid;gap:10px;box-shadow:inset 0 1px 0 rgba(255,255,255,.04)}
                .inherit-talent-detail-head{display:grid;grid-template-columns:64px minmax(0,1fr);gap:10px;align-items:center}.inherit-talent-detail-icon{width:64px;height:64px;border-radius:18px;display:flex;align-items:center;justify-content:center;font-size:34px;background:linear-gradient(180deg,rgba(255,247,184,.16),rgba(255,255,255,.03));box-shadow:0 0 18px rgba(244,229,118,.1),inset 0 0 0 1px rgba(255,255,255,.06)}
                .inherit-talent-detail h4{margin:0;font-size:18px;color:#fff3dd}
                .inherit-talent-detail p{margin:0;color:#d8c9b3;font-size:12px;line-height:1.55}
                .inherit-talent-detail-stats{display:grid;gap:8px}
                .inherit-talent-detail-stat{padding:9px 10px;border-radius:14px;background:rgba(255,255,255,.035);border:1px solid rgba(255,255,255,.05)}
                .inherit-talent-detail-stat strong{display:block;font-size:11px;color:#f6e7d1}
                .inherit-talent-detail-stat span{display:block;margin-top:4px;font-size:11px;color:#ddd1bd;line-height:1.5}
                @media (max-width:1020px){.inherit-shell{grid-template-columns:1fr}.inherit-sidebar{border-right:none;border-bottom:1px solid rgba(228,186,115,.08)}.inherit-hero-grid,.inherit-altar{grid-template-columns:1fr}}
                @media (max-width:1520px){.inherit-achievement-list{grid-template-columns:repeat(3,minmax(0,1fr))}}
                @media (max-width:1280px){.inherit-achievement-list{grid-template-columns:repeat(2,minmax(0,1fr))}.inherit-talent-grid{grid-template-columns:repeat(4,minmax(0,1fr))}}
                @media (max-width:1020px){.inherit-achievement-list,.inherit-talent-layout{grid-template-columns:1fr}.inherit-resource-bar{display:grid}.inherit-resource-main p{white-space:normal}.inherit-talent-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.inherit-talent-detail{position:static}}
            `;
            document.head.appendChild(style);
        }

        ensureOverlay() {
            if (this.overlay) return;
            const overlay = document.createElement('div');
            overlay.className = 'inherit-overlay';
            overlay.innerHTML = `
                <div class="inherit-shell">
                    <aside class="inherit-sidebar"></aside>
                    <section class="inherit-main">
                        <div class="inherit-header"></div>
                        <div class="inherit-content"></div>
                    </section>
                </div>
            `;
            overlay.addEventListener('click', (event) => {
                if (event.target === overlay) this.close();
            });
            document.body.appendChild(overlay);
            this.overlay = overlay;
            this.sidebar = overlay.querySelector('.inherit-sidebar');
            this.header = overlay.querySelector('.inherit-header');
            this.content = overlay.querySelector('.inherit-content');
        }

        getMeta() {
            return global.game?.metaProgress?.getMetaState?.() || global.MetaProgressSchemas?.createDefaultMetaProgress?.() || null;
        }

        open(tab = 'achievements') {
            this.activeTab = tab === 'talents' ? 'talents' : 'achievements';
            this.ensureOverlay();
            this.render();
            this.overlay.style.display = 'flex';
            document.addEventListener('keydown', this._escHandler);
            global.game?.refreshPauseState?.();
        }

        close() {
            if (!this.overlay) return;
            this.overlay.style.display = 'none';
            document.removeEventListener('keydown', this._escHandler);
            global.game?.refreshPauseState?.();
        }

        render() {
            this.renderSidebar();
            this.renderHeader();
            this.renderContent();
        }

        renderSidebar() {
            const meta = this.getMeta();
            const unlockedAchievements = Object.keys(meta?.achievements?.unlocked || {}).length;
            const totalAchievements = global.MetaAchievementData?.defs?.length || 0;
            const spent = Number(meta?.talents?.spentPoints) || 0;
            const points = Number(meta?.talents?.points) || 0;
            const earned = global.game?.metaProgress?.getEarnedTalentPoints?.() || 0;
            this.sidebar.innerHTML = `
                <div class="inherit-kicker">Meta / Legacy</div>
                <div class="inherit-hero">
                    <h2 class="inherit-title">传承</h2>
                    <p class="inherit-sub">局外成长与记录。</p>
                </div>
                <div class="inherit-nav">
                    <button type="button" class="inherit-nav-btn ${this.activeTab === 'achievements' ? 'active' : ''}" data-tab="achievements">
                        <strong>成就勋记</strong>
                        <span>${unlockedAchievements} / ${totalAchievements} 已达成</span>
                    </button>
                    <button type="button" class="inherit-nav-btn ${this.activeTab === 'talents' ? 'active' : ''}" data-tab="talents">
                        <strong>天赋谱系</strong>
                        <span>可用 ${points} / 已投入 ${spent} / 累计获得 ${earned}</span>
                    </button>
                </div>
                <button type="button" class="inherit-close">关闭传承</button>
            `;
            this.sidebar.querySelectorAll('[data-tab]').forEach((button) => {
                button.addEventListener('click', () => {
                    this.activeTab = button.dataset.tab;
                    this.render();
                });
            });
            this.sidebar.querySelector('.inherit-close').addEventListener('click', () => this.close());
        }

        renderHeader() {
            const meta = this.getMeta();
            if (this.activeTab === 'talents') {
                this.header.innerHTML = `
                    <div>
                        <h3>天赋谱系</h3>
                    </div>
                    <div class="inherit-pills">
                        <div class="inherit-pill">可用点数 ${Number(meta?.talents?.points) || 0}</div>
                        <div class="inherit-pill">已投入成本 ${Number(meta?.talents?.spentPoints) || 0}</div>
                        <div class="inherit-pill">已激活效果 ${(global.game?.metaProgress?.getTalentSummaryRows?.() || []).length}</div>
                    </div>
                `;
                return;
            }
            const defs = global.MetaAchievementData?.defs || [];
            const milestoneCount = defs.filter((def) => def.priority === 'P0').length;
            const unlockedAchievements = Object.keys(meta?.achievements?.unlocked || {}).length;
            this.header.innerHTML = `
                <div>
                    <h3>成就勋记</h3>
                </div>
                <div class="inherit-pills">
                    <div class="inherit-pill">已达成 ${unlockedAchievements}</div>
                    <div class="inherit-pill">总条目 ${defs.length}</div>
                    <div class="inherit-pill">关键里程碑 ${milestoneCount}</div>
                </div>
            `;
        }

        renderContent() {
            this.content.innerHTML = this.activeTab === 'talents'
                ? this.renderTalents()
                : this.renderAchievements();
            this.bindActions();
        }

        getRecentAchievements(limit = 3) {
            return this.getRecentAchievementsBy(limit, null);
        }

        getRecentAchievementsBy(limit = 3, predicate = null) {
            const meta = this.getMeta();
            return Object.entries(meta?.achievements?.unlocked || {})
                .map(([key, info]) => ({
                    def: global.MetaAchievementData?.byKey?.[key],
                    time: Number(info?.time) || 0
                }))
                .filter((entry) => entry.def && (!predicate || predicate(entry.def)))
                .sort((a, b) => b.time - a.time)
                .slice(0, limit);
        }

        getAchievementCardView(def, meta) {
            const unlocked = !!meta?.achievements?.unlocked?.[def.key];
            const mystery = !unlocked && def.displayMode === 'mystery';
            return {
                unlocked,
                mystery,
                title: mystery ? (def.mysteryTitle || '？？？') : def.title,
                icon: mystery ? (def.mysteryIcon || '❓') : (def.icon || '🏆'),
                description: mystery ? (def.mysteryDescription || '一段尚未显形的记录。') : def.description,
                category: mystery ? '？？？' : def.category,
                targetLabel: mystery ? (def.mysteryLabel || '未知条件') : (def.targetLabel || def.hint),
                triggerSummary: mystery ? '未知条件' : (def.triggerSummary || def.hint)
            };
        }

        renderAchievements() {
            const meta = this.getMeta();
            const controller = global.game?.metaProgress || null;
            const defs = global.MetaAchievementData?.defs || [];
            const unlockedCount = Object.keys(meta?.achievements?.unlocked || {}).length;
            const categories = ['主线', 'Build / 武器', '战斗统计', '图鉴 / 收集', '解锁'];
            if (!categories.includes(this.activeAchievementCategory)) this.activeAchievementCategory = '主线';
            const visibleDefs = defs.filter((def) => this.matchAchievementFilter(def, meta));
            const categoryDefs = visibleDefs.filter((def) => def.category === this.activeAchievementCategory);
            const completedInCategory = categoryDefs.filter((def) => meta?.achievements?.unlocked?.[def.key]).length;

            return `
                <section class="inherit-resource-bar">
                    <article class="inherit-resource-main">
                        <h4>勋记册</h4>
                    </article>
                    <div class="inherit-resource-side">
                        <div class="inherit-resource-chip"><strong>${unlockedCount}</strong><span>已达成</span></div>
                        <div class="inherit-resource-chip"><strong>${defs.length}</strong><span>总条目</span></div>
                        <div class="inherit-resource-chip"><strong>${completedInCategory}</strong><span>${this.activeAchievementCategory}</span></div>
                        <div class="inherit-resource-chip"><strong>${categoryDefs.length}</strong><span>当前分类总数</span></div>
                    </div>
                </section>
                <section class="inherit-achievement-tabs">
                    ${categories.map((category) => `
                        <button type="button" class="inherit-achievement-tab ${this.activeAchievementCategory === category ? 'active' : ''}" data-achievement-category="${category}">${category}</button>
                    `).join('')}
                </section>
                <section class="inherit-tier">
                    <div class="inherit-section-head">
                        <div>
                            <h4>${this.activeAchievementCategory}</h4>
                            <p>${completedInCategory} / ${categoryDefs.length} 已完成</p>
                        </div>
                    </div>
                    <div class="inherit-achievement-list">
                        ${categoryDefs.map((def) => this.renderAchievementRow(def, controller)).join('')}
                    </div>
                </section>
                ${categoryDefs.length === 0 ? `
                    <section class="inherit-panel">
                        <div class="inherit-recent-item">当前分类暂无条目。</div>
                    </section>
                ` : ''}
            `;
        }

        matchAchievementFilter(def, meta) {
            const unlocked = !!meta?.achievements?.unlocked?.[def.key];
            switch (this.activeAchievementFilter) {
                case 'pending':
                    return !unlocked;
                case 'mainline':
                    return def.category === '主线';
                case 'unlocked':
                    return unlocked;
                case 'milestone':
                    return def.priority === 'P0';
                default:
                    return true;
            }
        }

        renderAchievementRow(def, controller) {
            const meta = this.getMeta();
            const progress = controller?.getAchievementProgress?.(def) || { unlocked: false, current: 0, target: 1, ratio: 0 };
            const view = this.getAchievementCardView(def, meta);
            const unlocked = view.unlocked;
            const progressLabel = view.mystery ? '???' : (unlocked ? '已完成' : `${Math.min(progress.current, progress.target)} / ${progress.target}`);
            return `
                <article class="inherit-achievement-row ${view.mystery ? 'mystery' : ''}">
                    <div class="inherit-achievement-row-icon">${view.icon}</div>
                    <div class="inherit-achievement-row-main">
                        <div class="inherit-achievement-row-head">
                            <strong>${view.title}</strong>
                            <span>${view.mystery ? '未知' : progressLabel}</span>
                        </div>
                        <div class="inherit-achievement-row-desc">${view.description} · ${view.targetLabel}</div>
                        <div class="inherit-achievement-row-bar"><span style="width:${view.mystery ? 0 : Math.round(progress.ratio * 100)}%;"></span></div>
                        <div class="inherit-achievement-row-foot">
                            <span>${view.mystery ? '？？？' : view.category}</span>
                            <span>${unlocked ? (meta.achievements?.unlocked?.[def.key] ? new Date(meta.achievements.unlocked[def.key].time).toLocaleDateString('zh-CN') : '已完成') : view.triggerSummary}</span>
                        </div>
                    </div>
                </article>
            `;
        }

        renderTalents() {
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
            `;
        }

        bindActions() {
            this.content.querySelectorAll('[data-filter]').forEach((button) => {
                button.addEventListener('click', () => {
                    this.activeAchievementFilter = button.getAttribute('data-filter') || 'all';
                    this.render();
                });
            });
            this.content.querySelectorAll('[data-achievement-category]').forEach((button) => {
                button.addEventListener('click', () => {
                    this.activeAchievementCategory = button.getAttribute('data-achievement-category') || '主线';
                    this.render();
                });
            });
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
        }
    }

    global.inheritancePanel = new InheritancePanel();
})(window);
