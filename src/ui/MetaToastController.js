(function attachMetaToastController(global) {
    'use strict';

    class MetaToastController {
        constructor() {
            this.root = null;
            this.dedupe = new Map();
        }

        ensureRoot() {
            if (this.root?.isConnected) return this.root;
            const root = document.createElement('div');
            root.id = 'metaProgressToastRoot';
            root.style.cssText = [
                'position:fixed',
                'top:84px',
                'right:18px',
                'display:flex',
                'flex-direction:column',
                'align-items:flex-end',
                'gap:14px',
                'z-index:32000',
                'pointer-events:none'
            ].join(';');
            document.body.appendChild(root);
            this.root = root;
            return root;
        }

        shouldSkip(dedupeKey, duration) {
            if (!dedupeKey) return false;
            const now = Date.now();
            const nextAllowed = this.dedupe.get(dedupeKey) || 0;
            if (nextAllowed > now) return true;
            this.dedupe.set(dedupeKey, now + Math.max(1200, duration || 2800));
            return false;
        }

        showCard(payload = {}) {
            const duration = Number(payload.duration) || 2800;
            if (this.shouldSkip(payload.dedupeKey, duration)) return;
            const root = this.ensureRoot();
            const kind = payload.kind || 'stat';
            const isBig = kind === 'milestone' || kind === 'unlock';
            const accent = payload.accent || '#f2c16d';
            const card = document.createElement('div');
            card.style.cssText = [
                `width:${isBig ? 'min(420px, calc(100vw - 42px))' : 'min(340px, calc(100vw - 42px))'}`,
                'padding:0',
                'border-radius:22px',
                'overflow:hidden',
                'background:linear-gradient(180deg, rgba(25,18,13,0.98), rgba(10,8,7,0.96))',
                `border:1px solid ${accent}`,
                'box-shadow:0 24px 56px rgba(0,0,0,0.38)',
                'color:#fff7ea',
                'font-family:"ZCOOL KuaiLe Local","Microsoft YaHei UI","PingFang SC",sans-serif',
                'pointer-events:none',
                'opacity:0',
                'transform:translate3d(18px, -6px, 0) scale(0.98)',
                'transition:opacity 220ms ease, transform 220ms ease'
            ].join(';');
            card.innerHTML = `
                <div style="padding:${isBig ? '16px 18px 18px' : '14px 16px'};background:
                    radial-gradient(circle at top right, ${accent}22, transparent 45%),
                    linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0));">
                    <div style="display:flex;gap:${isBig ? '14px' : '12px'};align-items:flex-start;">
                        <div style="width:${isBig ? '60px' : '48px'};height:${isBig ? '60px' : '48px'};border-radius:18px;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.05);font-size:${isBig ? '30px' : '25px'};box-shadow:inset 0 0 0 1px rgba(255,255,255,0.06);">${payload.icon || '✨'}</div>
                        <div style="flex:1;min-width:0;">
                            <div style="font-size:11px;letter-spacing:0.18em;text-transform:uppercase;color:${accent};">${payload.kicker || '进度更新'}</div>
                            <div style="margin-top:5px;font-size:${isBig ? '22px' : '18px'};line-height:1.28;color:#fff3df;">${payload.title || '已更新'}</div>
                            <div style="margin-top:7px;font-size:${isBig ? '13px' : '12px'};line-height:1.7;color:rgba(255,244,230,0.82);">${payload.body || ''}</div>
                        </div>
                    </div>
                </div>
            `;
            root.appendChild(card);
            requestAnimationFrame(() => {
                card.style.opacity = '1';
                card.style.transform = 'translate3d(0, 0, 0) scale(1)';
            });
            setTimeout(() => {
                card.style.opacity = '0';
                card.style.transform = 'translate3d(10px, -4px, 0) scale(0.985)';
                setTimeout(() => card.remove(), 240);
            }, duration);
        }

        showAchievement(def) {
            const milestone = def.priority === 'P0' || def.category === '主线';
            this.showCard({
                icon: def.icon || '🏆',
                kicker: milestone ? '里程碑达成' : '成就达成',
                title: def.toastTitle || def.title,
                body: def.toastBody || def.description,
                accent: milestone ? '#ffd18a' : '#ffcb7a',
                kind: milestone ? 'milestone' : 'stat',
                dedupeKey: `achievement:${def.key}`
            });
        }

        showUnlock(def) {
            this.showCard({
                icon: '🔓',
                kicker: '新内容已解锁',
                title: def.toastTitle || def.title,
                body: def.toastBody || def.description,
                accent: '#88d7ff',
                kind: 'unlock',
                dedupeKey: `unlock:${def.key}`
            });
        }
    }

    global.MetaToastController = MetaToastController;
})(window);
