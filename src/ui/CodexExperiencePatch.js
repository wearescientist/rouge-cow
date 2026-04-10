(function attachCodexExperiencePatch(global) {
    'use strict';

    function installPatch() {
        if (typeof CollectionCodexSystem === 'undefined' || CollectionCodexSystem.prototype.__codexExperiencePatched) return;
        const proto = CollectionCodexSystem.prototype;
        const oldOpen = proto.open;

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

        proto.open = function patchedOpen(tab = 'characters') {
            const nextTab = tab === 'achievements' ? 'characters' : tab;
            return oldOpen.call(this, nextTab);
        };

        const style = document.createElement('style');
        style.id = 'codexExperiencePatchStyle';
        style.textContent = `
            .collection-header{padding:12px 16px 10px;gap:10px}
            .collection-header-icon{width:44px;height:44px;border-radius:12px;font-size:22px}
            .collection-header-text h3{font-size:22px}
            .collection-header-text .collection-header-kicker{font-size:10px;letter-spacing:.1em}
            .collection-header-text .collection-header-sub{display:none}
            .collection-progress{grid-template-columns:repeat(2,minmax(120px,1fr));gap:8px}
            .collection-pill{padding:8px 10px;border-radius:12px;font-size:10px}
            .collection-pill strong{margin-top:2px;font-size:15px}
            .collection-nav-btn{padding:8px 10px;border-radius:12px}
            .collection-nav-hint{display:none}
            .collection-nav-title{font-size:12px}
            .collection-nav-meta{font-size:10px;margin-top:0}
            .collection-tools{padding:10px 16px;gap:8px}
            .collection-search{padding:10px 36px 10px 12px;border-radius:12px}
            .collection-filter-row button,.collection-segment button{padding:6px 10px;font-size:11px}
            .collection-main{min-height:0}
            .collection-board{min-height:0;align-items:stretch}
            .collection-list-wrap{min-height:0;overflow:hidden}
            .collection-records{flex:1 1 auto;min-height:0;overflow:auto;align-content:start;padding-right:8px}
            .collection-detail{min-height:0}
            .collection-detail-body{min-height:0;overscroll-behavior:contain}
            .collection-content{overscroll-behavior:contain}
            .collection-content{padding:12px 16px 16px}
            .collection-board{grid-template-columns:minmax(0,1.2fr) minmax(280px,.8fr);gap:12px}
            .collection-section{border-radius:16px}
            .collection-section-head{padding:10px 12px}
            .collection-section-head h4{font-size:14px}
            .collection-section-head p{display:none}
            .collection-stamp{padding:4px 8px;font-size:10px;letter-spacing:.06em}
            .collection-records{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;padding:10px}
            .collection-record{display:grid;grid-template-columns:42px minmax(0,1fr) auto;gap:8px;align-items:center;padding:7px 8px;border-radius:12px;background:linear-gradient(180deg,rgba(22,22,28,.96),rgba(14,14,18,.98));min-height:0}
            .collection-record-index{display:none}
            .collection-record-top{display:contents}
            .collection-record-icon{width:42px;height:42px;border-radius:12px;font-size:20px}
            .collection-record-title{font-size:13px;line-height:1.2}
            .collection-record-subtitle{margin-top:1px;font-size:10px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
            .collection-record-preview{display:none}
            .collection-record-footer{display:none}
            .collection-record-note{align-self:center;padding:4px 8px;font-size:10px}
            .collection-detail-body{padding:10px;gap:8px}
            .collection-detail-hero{padding:12px;border-radius:14px}
            .collection-detail-icon{width:48px;height:48px;border-radius:12px;font-size:22px}
            .collection-detail-title{font-size:20px}
            .collection-detail-subtitle{margin-top:3px;font-size:11px;line-height:1.45}
            .collection-detail-meta{margin-top:8px;gap:6px}
            .collection-detail-chip{padding:4px 8px;font-size:10px}
            .collection-detail-section{padding:10px;border-radius:12px}
            .collection-detail-section h5{margin:0 0 6px;font-size:10px}
            .collection-detail-text{font-size:12px;line-height:1.5}
            .collection-detail-list{gap:6px}
            .collection-detail-list li{padding:8px;font-size:11px;line-height:1.45}
            .collection-detail-more{border:1px solid rgba(255,255,255,.08);border-radius:12px;background:rgba(255,255,255,.02)}
            .collection-detail-more>summary{list-style:none;cursor:pointer;padding:8px 10px;font-size:11px;color:#d8c7af}
            .collection-detail-more>summary::-webkit-details-marker{display:none}
            .collection-detail-more-body{padding:0 8px 8px;display:grid;gap:8px}
            .collection-tools{grid-template-columns:minmax(0,1fr) auto auto}
            .collection-search-wrap{min-width:0}
            @media (max-width:1320px){
                .collection-records{grid-template-columns:repeat(2,minmax(0,1fr))}
                .collection-board{grid-template-columns:1fr}
            }
            @media (max-width:1020px){
                .collection-tools{grid-template-columns:1fr}
                .collection-records{grid-template-columns:1fr}
                .collection-record{grid-template-columns:42px minmax(0,1fr)}
                .collection-record-note{grid-column:2;justify-self:start}
            }
        `;
        document.head.appendChild(style);
        proto.__codexExperiencePatched = true;
    }

    installPatch();
})(window);
