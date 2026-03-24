class OverlayCanvasRenderer {
    constructor(game) {
        this.game = game;
    }

    getRenderContext() {
        return this.game.getOverlayDrawContext ? this.game.getOverlayDrawContext() : this.game.ctx;
    }

    getMetrics() {
        const ctx = this.getRenderContext();
        const canvas = ctx.canvas;
        const cw = canvas.width || 900;
        const ch = canvas.height || 900;
        const scale = Math.min(cw, ch) / 960;
        return {
            ctx,
            cw,
            ch,
            scale,
            centerX: cw / 2,
            centerY: ch / 2
        };
    }

    fitPanel(metrics, designW, designH, margin = 26) {
        const safeMargin = Math.max(14, margin * metrics.scale);
        const scale = Math.min(
            1,
            (metrics.cw - safeMargin * 2) / Math.max(designW, 1),
            (metrics.ch - safeMargin * 2) / Math.max(designH, 1)
        );
        const width = Math.min(designW * scale, metrics.cw - safeMargin * 2);
        const height = Math.min(designH * scale, metrics.ch - safeMargin * 2);
        return {
            scale,
            width,
            height,
            x: (metrics.cw - width) / 2,
            y: (metrics.ch - height) / 2
        };
    }

    setRegion(key, panel, extra = {}) {
        this.game.overlayHitRegions[key] = {
            panel: { x: panel.x, y: panel.y, w: panel.width, h: panel.height },
            ...extra
        };
    }

    text(ctx, size, weight = '', family = 'ZCOOL KuaiLe Local') {
        const fontSize = Math.max(10, Math.round(size));
        ctx.font = `${weight}${fontSize}px ${family}`;
    }

    truncate(text, maxChars) {
        if (!text) return '';
        if (text.length <= maxChars) return text;
        return `${text.slice(0, Math.max(1, maxChars - 1))}…`;
    }

    drawOverlayBackdrop(ctx, alpha = 0.78, tint = 'rgba(9, 10, 14, 0.84)') {
        const canvas = ctx.canvas;
        const cw = canvas.width || 900;
        const ch = canvas.height || 900;
        ctx.save();
        ctx.fillStyle = tint;
        ctx.fillRect(0, 0, cw, ch);
        const vignette = ctx.createRadialGradient(cw / 2, ch * 0.46, ch * 0.08, cw / 2, ch * 0.5, ch * 0.72);
        vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignette.addColorStop(1, `rgba(0, 0, 0, ${alpha})`);
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, cw, ch);
        ctx.restore();
    }

    getOverlayThemeTones() {
        return this.game.themeToneResolver.getOverlayTones();
    }

    drawOverlayPanel(ctx, x, y, width, height, options = {}) {
        const scale = options.scale || 1;
        const accent = options.accent || '#d8bb77';
        const ink = options.ink || 'rgba(18, 12, 9, 0.92)';
        const paper = options.paper || 'rgba(75, 56, 40, 0.22)';
        const title = options.title || '';
        const subtitle = options.subtitle || '';
        const muted = options.muted || 'rgba(240, 228, 203, 0.76)';
        const outerPad = Math.max(4, 8 * scale);
        const headerH = Math.max(28, 56 * scale);
        ctx.save();
        ctx.fillStyle = ink;
        ctx.fillRect(x, y, width, height);
        ctx.fillStyle = paper;
        ctx.fillRect(x + outerPad, y + outerPad, width - outerPad * 2, height - outerPad * 2);
        ctx.fillStyle = 'rgba(255, 244, 220, 0.04)';
        ctx.fillRect(x + outerPad + 2, y + outerPad + 2, width - (outerPad + 2) * 2, headerH);
        ctx.strokeStyle = accent;
        ctx.lineWidth = Math.max(1.25, 3 * scale);
        ctx.strokeRect(x + 2, y + 2, width - 4, height - 4);
        ctx.strokeStyle = 'rgba(22, 14, 11, 0.88)';
        ctx.lineWidth = Math.max(1, 2 * scale);
        ctx.strokeRect(x + outerPad, y + outerPad, width - outerPad * 2, height - outerPad * 2);
        ctx.strokeStyle = 'rgba(255, 242, 215, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 18 * scale, y + headerH + 14 * scale);
        ctx.lineTo(x + width - 18 * scale, y + headerH + 14 * scale);
        ctx.stroke();
        if (title) {
            ctx.fillStyle = accent;
            ctx.textAlign = 'center';
            this.text(ctx, 34 * scale, 'bold ');
            ctx.fillText(title, x + width / 2, y + 42 * scale);
        }
        if (subtitle) {
            ctx.fillStyle = muted;
            this.text(ctx, 18 * scale);
            ctx.fillText(subtitle, x + width / 2, y + height - 24 * scale);
        }
        ctx.restore();
    }

    drawOverlayCard(ctx, x, y, width, height, options = {}) {
        const scale = options.scale || 1;
        const accent = options.accent || '#d8bb77';
        const fill = options.fill || 'rgba(33, 24, 18, 0.88)';
        const highlight = options.highlight || 'rgba(255, 244, 220, 0.04)';
        const inset = Math.max(4, 6 * scale);
        ctx.save();
        ctx.fillStyle = fill;
        ctx.fillRect(x, y, width, height);
        ctx.fillStyle = highlight;
        ctx.fillRect(x + inset, y + inset, width - inset * 2, Math.max(18 * scale, height * 0.22));
        ctx.strokeStyle = accent;
        ctx.lineWidth = options.lineWidth || Math.max(1.25, 2 * scale);
        ctx.strokeRect(x + 1, y + 1, width - 2, height - 2);
        ctx.strokeStyle = 'rgba(20, 13, 9, 0.9)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + inset, y + inset, width - inset * 2, height - inset * 2);
        ctx.restore();
    }

    drawOverlayButton(ctx, x, y, width, height, label, options = {}) {
        const scale = options.scale || 1;
        const tones = this.getOverlayThemeTones();
        this.drawOverlayCard(ctx, x, y, width, height, {
            scale,
            accent: options.hovered ? tones.inkText : (options.accent || tones.muted),
            fill: options.hovered ? 'rgba(88, 66, 46, 0.94)' : 'rgba(31, 24, 19, 0.9)',
            highlight: options.hovered ? 'rgba(255, 242, 214, 0.08)' : 'rgba(255, 242, 214, 0.03)'
        });
        ctx.fillStyle = options.hovered ? tones.inkText : tones.muted;
        ctx.textAlign = 'center';
        this.text(ctx, (options.hovered ? 25 : 23) * scale, options.hovered ? 'bold ' : '');
        ctx.fillText(label, x + width / 2, y + height / 2 + 8 * scale);
    }

    drawPauseScreen() {
        const game = this.game;
        const metrics = this.getMetrics();
        const ctx = metrics.ctx;
        const tones = this.getOverlayThemeTones();
        const panel = this.fitPanel(metrics, 480, 430);
        const pad = 32 * panel.scale;
        const btnW = Math.min(panel.width - pad * 2, 320 * panel.scale);
        const btnH = 54 * panel.scale;
        this.drawOverlayBackdrop(ctx, 0.8, tones.tint);
        this.drawOverlayPanel(ctx, panel.x, panel.y, panel.width, panel.height, {
            scale: panel.scale,
            accent: tones.accent,
            ink: tones.ink,
            paper: tones.paper,
            muted: tones.muted,
            title: '已暂停',
            subtitle: '按 ESC 键恢复游戏'
        });
        ctx.fillStyle = 'rgba(255, 244, 220, 0.035)';
        ctx.fillRect(panel.x + 24 * panel.scale, panel.y + 74 * panel.scale, panel.width - 48 * panel.scale, 56 * panel.scale);
        ctx.textAlign = 'center';
        const seedText = `种子 ${game.runSeed || '----'}`;
        ctx.fillStyle = tones.muted;
        this.text(ctx, 16 * panel.scale, 'bold ');
        ctx.fillText(seedText, panel.x + panel.width / 2, panel.y + 100 * panel.scale);
        const labels = [
            { id: 'resume', text: '继续游戏' },
            { id: 'settings', text: '游戏设置' },
            { id: 'restart', text: '重新开始' },
            { id: 'menu', text: '返回主菜单' }
        ];
        const startY = panel.y + 138 * panel.scale;
        const gap = 12 * panel.scale;
        game.pauseButtons = labels.map((btn, index) => ({
            id: btn.id,
            text: btn.text,
            x: panel.x + (panel.width - btnW) / 2,
            y: startY + index * (btnH + gap),
            w: btnW,
            h: btnH
        }));
        game.pauseButtons.forEach((btn) => {
            const isHovered = game.pauseHoverButton === btn.id;
            this.drawOverlayButton(ctx, btn.x, btn.y, btn.w, btn.h, btn.text, {
                scale: panel.scale,
                hovered: isHovered,
                accent: isHovered ? tones.inkText : tones.accent
            });
        });
    }

    drawShopUI() {
        const game = this.game;
        const metrics = this.getMetrics();
        const ctx = metrics.ctx;
        const tones = this.getOverlayThemeTones();
        const panel = this.fitPanel(metrics, 620, 430);
        const scale = panel.scale;
        const innerPad = 26 * scale;
        const gap = 18 * scale;
        const refreshH = 44 * scale;
        const itemW = Math.min(160 * scale, (panel.width - innerPad * 2 - gap * (game.shopItems.length - 1)) / Math.max(game.shopItems.length, 1));
        const itemH = Math.min(210 * scale, panel.height * 0.5);
        const itemsY = panel.y + 198 * scale;
        const startX = panel.x + (panel.width - (itemW * game.shopItems.length + gap * (game.shopItems.length - 1))) / 2;
        const refreshW = Math.min(210 * scale, panel.width - innerPad * 2);
        const refreshRect = { x: panel.x + (panel.width - refreshW) / 2, y: panel.y + panel.height - 76 * scale, w: refreshW, h: refreshH };
        const itemRects = [];
        this.drawOverlayBackdrop(ctx, 0.76, tones.tint);
        this.drawOverlayPanel(ctx, panel.x, panel.y, panel.width, panel.height, {
            scale,
            accent: tones.passive,
            ink: tones.ink,
            paper: tones.paper,
            muted: tones.muted,
            title: '盲眼的商店',
            subtitle: 'WASD 切换 | 空格确认 | E / Esc 关闭'
        });
        ctx.fillStyle = tones.gold;
        ctx.textAlign = 'center';
        this.text(ctx, 24 * scale);
        ctx.fillText(`金币 ${game.player.gold}`, metrics.centerX, panel.y + 74 * scale);
        game.shopItems.forEach((item, i) => {
            const rect = {
                x: startX + i * (itemW + gap),
                y: itemsY - itemH / 2,
                w: itemW,
                h: itemH
            };
            itemRects.push(rect);
            const ix = rect.x + rect.w / 2;
            const iy = rect.y + rect.h / 2;
            const isSelected = game.shopSelected === i;
            this.drawOverlayCard(ctx, rect.x, rect.y, rect.w, rect.h, {
                scale,
                accent: isSelected ? tones.gold : (item.sold ? tones.statusLocked : (game.player.gold >= item.price ? tones.passive : tones.statusWarning)),
                fill: item.sold ? 'rgba(20, 18, 17, 0.9)' : tones.ink,
                highlight: isSelected ? 'rgba(255, 226, 140, 0.12)' : 'rgba(255, 244, 220, 0.03)',
                lineWidth: isSelected ? Math.max(2, 3 * scale) : Math.max(1.25, 2 * scale)
            });
            ctx.textAlign = 'center';
            if (item.sold) {
                ctx.fillStyle = tones.statusLocked;
                this.text(ctx, 24 * scale, 'bold ');
                ctx.fillText('已售罄', ix, iy + 4 * scale);
                ctx.fillStyle = tones.muted;
                this.text(ctx, 15 * scale);
                ctx.fillText(`[${i + 1}]`, ix, iy + rect.h * 0.35);
                return;
            }
            this.text(ctx, 58 * scale);
            ctx.fillText(item.icon, ix, iy - rect.h * 0.18);
            ctx.fillStyle = tones.inkText;
            this.text(ctx, 18 * scale);
            ctx.fillText(this.truncate(item.name, Math.max(4, Math.round(10 * scale))), ix, iy + rect.h * 0.09);
            ctx.fillStyle = tones.muted;
            this.text(ctx, 13 * scale);
            ctx.fillText(this.truncate(item.desc, Math.max(6, Math.round(14 * scale))), ix, iy + rect.h * 0.21);
            ctx.fillStyle = game.player.gold >= item.price ? tones.statusPrice : tones.statusWarning;
            this.text(ctx, 20 * scale, 'bold ');
            ctx.fillText(`💰${item.price}`, ix, iy + rect.h * 0.36);
            ctx.fillStyle = tones.muted;
            this.text(ctx, 15 * scale);
            ctx.fillText(`[${i + 1}]`, ix, iy + rect.h * 0.46);
        });
        const refreshPrice = 10 * Math.pow(2, game.shopRefreshCount);
        this.drawOverlayButton(ctx, refreshRect.x, refreshRect.y, refreshRect.w, refreshRect.h, `刷新 ${refreshPrice}`, {
            scale,
            hovered: game.shopSelected === game.shopItems.length,
            accent: game.player.gold >= refreshPrice ? tones.passive : tones.statusWarning
        });
        this.setRegion('shop', panel, { items: itemRects, refresh: refreshRect });
    }

    drawChestSelectUI() {
        const game = this.game;
        const metrics = this.getMetrics();
        const ctx = metrics.ctx;
        const tones = this.getOverlayThemeTones();
        const panel = this.fitPanel(metrics, 680, 410);
        const scale = panel.scale;
        const gap = 18 * scale;
        const itemW = Math.min(180 * scale, (panel.width - 52 * scale - gap * (game.chestItems.length - 1)) / Math.max(game.chestItems.length, 1));
        const itemH = Math.min(220 * scale, panel.height * 0.56);
        const startX = panel.x + (panel.width - (itemW * game.chestItems.length + gap * (game.chestItems.length - 1))) / 2;
        const itemY = panel.y + 195 * scale;
        const itemRects = [];
        const rolling = typeof game.isChestRolling === 'function' ? game.isChestRolling() : false;
        const bundleMode = typeof game.isTreasureChestBundleUI === 'function' ? game.isTreasureChestBundleUI() : false;
        const revealRatio = game.chestRollState && game.chestRollState.duration
            ? Math.max(0, Math.min(1, (Date.now() - game.chestRollState.startedAt) / game.chestRollState.duration))
            : 1;
        const rouletteIcons = ['💰', '💎', '⚔️', '📦', '✨', '🌈'];
        this.drawOverlayBackdrop(ctx, 0.74, tones.tint);
        this.drawOverlayPanel(ctx, panel.x, panel.y, panel.width, panel.height, {
            scale,
            accent: tones.gold,
            ink: tones.ink,
            paper: tones.paper,
            muted: tones.muted,
            title: game.chestUiTitle || '幸运抽奖宝箱',
            subtitle: rolling
                ? `抽奖揭示中... ${Math.max(0, Math.ceil((1 - revealRatio) * ((game.chestRollState?.duration || 1000) / 1000)))}` 
                : (game.chestUiSubtitle || (bundleMode ? '空格领取全部奖励 | E / Esc 关闭' : '三选一奖励包 | WASD 切换 | 空格确认 | E / Esc 关闭'))
        });
        game.chestItems.forEach((item, i) => {
            const rect = {
                x: startX + i * (itemW + gap),
                y: itemY - itemH / 2,
                w: itemW,
                h: itemH
            };
            itemRects.push(rect);
            const ix = rect.x + rect.w / 2;
            const iy = rect.y + rect.h / 2;
            const isSelected = !rolling && !bundleMode && game.chestSelected === i;
            const accent = item.accent || tones.gold;
            this.drawOverlayCard(ctx, rect.x, rect.y, rect.w, rect.h, {
                scale,
                accent: isSelected ? accent : accent,
                fill: tones.ink,
                highlight: isSelected ? 'rgba(255, 226, 140, 0.16)' : 'rgba(255, 236, 192, 0.05)',
                lineWidth: isSelected ? Math.max(2, 3 * scale) : Math.max(1.25, 2 * scale)
            });
            ctx.textAlign = 'center';
            this.text(ctx, 64 * scale);
            if (rolling) {
                const icon = rouletteIcons[(Math.floor(Date.now() / 90) + i) % rouletteIcons.length];
                ctx.fillText(icon, ix, iy - rect.h * 0.18);
                ctx.fillStyle = tones.statusPrice;
                this.text(ctx, 13 * scale, 'bold ');
                ctx.fillText('抽取中', ix, iy - rect.h * 0.01);
                ctx.fillStyle = tones.inkText;
                this.text(ctx, 18 * scale, 'bold ');
                ctx.fillText('???', ix, iy + rect.h * 0.11);
                ctx.fillStyle = tones.muted;
                this.text(ctx, 14 * scale);
                ctx.fillText('正在揭示奖励包', ix, iy + rect.h * 0.24);
                ctx.fillStyle = tones.statusPrice;
                this.text(ctx, 16 * scale);
                ctx.fillText('请稍候...', ix, iy + rect.h * 0.41);
                return;
            }
            ctx.fillText(item.icon, ix, iy - rect.h * 0.18);
            ctx.fillStyle = accent;
            this.text(ctx, 13 * scale, 'bold ');
            ctx.fillText(item.tierLabel || '奖励', ix, iy - rect.h * 0.01);
            ctx.fillStyle = tones.inkText;
            this.text(ctx, 18 * scale, 'bold ');
            ctx.fillText(this.truncate(item.name, Math.max(4, Math.round(10 * scale))), ix, iy + rect.h * 0.11);
            ctx.fillStyle = tones.muted;
            this.text(ctx, 14 * scale);
            ctx.fillText(this.truncate(item.desc, Math.max(6, Math.round(14 * scale))), ix, iy + rect.h * 0.24);
            ctx.fillStyle = accent;
            this.text(ctx, 16 * scale);
            ctx.fillText(bundleMode ? `[空格] 领取全部` : `[${i + 1}] 选择`, ix, iy + rect.h * 0.41);
        });
        this.setRegion('chest', panel, { items: itemRects });
    }

    drawSymbolOrSprite(ctx, data, x, y, size = 48) {
        const spriteKey = data && data.iconSprite;
        if (spriteKey && this.game.sprites) {
            const sprite = this.game.sprites.get(spriteKey);
            if (sprite) {
                ctx.drawImage(sprite, x - size / 2, y - size / 2, size, size);
                return true;
            }
        }
        if (data && data.icon) {
            ctx.fillText(data.icon, x, y);
            return true;
        }
        return false;
    }

    drawWeaponBoxUI() {
        const game = this.game;
        const metrics = this.getMetrics();
        const ctx = metrics.ctx;
        const tones = this.getOverlayThemeTones();
        const panel = this.fitPanel(metrics, 720, 430);
        const scale = panel.scale;
        const gap = 18 * scale;
        const itemW = Math.min(190 * scale, (panel.width - 54 * scale - gap * (game.weaponBoxOptions.length - 1)) / Math.max(game.weaponBoxOptions.length, 1));
        const itemH = Math.min(230 * scale, panel.height * 0.56);
        const startX = panel.x + (panel.width - (itemW * game.weaponBoxOptions.length + gap * (game.weaponBoxOptions.length - 1))) / 2;
        const itemY = panel.y + 202 * scale;
        const itemRects = [];
        this.drawOverlayBackdrop(ctx, 0.76, tones.tint);
        this.drawOverlayPanel(ctx, panel.x, panel.y, panel.width, panel.height, {
            scale,
            accent: tones.weapon,
            ink: tones.ink,
            paper: tones.paper,
            muted: tones.muted,
            title: '神秘武器箱',
            subtitle: 'WASD 切换 | 空格确认 | E / Esc 关闭'
        });
        game.weaponBoxOptions.forEach((option, i) => {
            const rect = {
                x: startX + i * (itemW + gap),
                y: itemY - itemH / 2,
                w: itemW,
                h: itemH
            };
            itemRects.push(rect);
            const ix = rect.x + rect.w / 2;
            const iy = rect.y + rect.h / 2;
            const isSelected = game.weaponBoxSelected === i;
            this.drawOverlayCard(ctx, rect.x, rect.y, rect.w, rect.h, {
                scale,
                accent: isSelected ? tones.gold : (option.isNew ? tones.passive : tones.weapon),
                fill: tones.ink,
                highlight: isSelected ? 'rgba(255, 226, 140, 0.12)' : 'rgba(255, 244, 220, 0.04)',
                lineWidth: isSelected ? Math.max(2, 3 * scale) : Math.max(1.25, 2 * scale)
            });
            ctx.textAlign = 'center';
            ctx.fillStyle = option.isNew ? tones.statusNew : tones.statusLevel;
            this.text(ctx, 15 * scale, 'bold ');
            ctx.fillText(option.isNew ? '[新武器]' : (option.level >= option.maxLevel ? 'MAX' : `Lv.${option.level - 1} → Lv.${option.level}`), ix, iy - rect.h * 0.36);
            ctx.fillStyle = tones.inkText;
            this.text(ctx, 60 * scale);
            this.drawSymbolOrSprite(ctx, option.data, ix, iy - rect.h * 0.16, Math.max(28, 64 * scale));
            this.text(ctx, 18 * scale, 'bold ');
            ctx.fillText(this.truncate(option.data.name, Math.max(4, Math.round(11 * scale))), ix, iy + rect.h * 0.07);
            ctx.fillStyle = tones.muted;
            this.text(ctx, 13 * scale);
            ctx.fillText(this.truncate(option.data.desc || `${option.data.dmg}伤害 ${option.data.cd}秒冷却`, Math.max(7, Math.round(16 * scale))), ix, iy + rect.h * 0.22);
            ctx.fillStyle = tones.statusPrice;
            this.text(ctx, 16 * scale);
            ctx.fillText(`[${i + 1}] 选择`, ix, iy + rect.h * 0.42);
        });
        this.setRegion('weaponBox', panel, { items: itemRects });
    }

    drawLevelUpUI() {
        const game = this.game;
        const metrics = this.getMetrics();
        const ctx = metrics.ctx;
        const tones = this.getOverlayThemeTones();
        const panel = this.fitPanel(metrics, 760, 540);
        const scale = panel.scale;
        const padding = 24 * scale;
        const gapX = 18 * scale;
        const gapY = 18 * scale;
        const contentWidth = panel.width - padding * 2;
        const contentHeight = panel.height - 120 * scale;
        const cardWidth = (contentWidth - gapX) / 2;
        const cardHeight = (contentHeight - gapY) / 2;
        const cards = [];
        this.drawOverlayBackdrop(ctx, 0.76, tones.tint);
        this.drawOverlayPanel(ctx, panel.x, panel.y, panel.width, panel.height, {
            scale,
            accent: tones.accent,
            ink: tones.ink,
            paper: tones.paper,
            muted: tones.muted,
            title: '升级抉择',
            subtitle: 'WASD 切换 | 空格确认'
        });
        game.levelUpOptions.forEach((option, i) => {
            const row = Math.floor(i / 2);
            const col = i % 2;
            const card = {
                x: panel.x + padding + col * (cardWidth + gapX),
                y: panel.y + 76 * scale + row * (cardHeight + gapY),
                w: cardWidth,
                h: cardHeight
            };
            cards.push(card);
            const isWeapon = option.type === 'weapon';
            const isSelected = game.levelUpSelected === i;
            const borderColor = isWeapon ? tones.weapon : tones.passive;
            this.drawOverlayCard(ctx, card.x, card.y, card.w, card.h, {
                scale,
                accent: isSelected ? tones.gold : borderColor,
                fill: tones.ink,
                highlight: isSelected ? 'rgba(255, 226, 140, 0.12)' : (isWeapon ? 'rgba(195, 218, 244, 0.05)' : 'rgba(220, 240, 197, 0.04)'),
                lineWidth: isSelected ? Math.max(2, 3 * scale) : Math.max(1.25, 2 * scale)
            });
            const headerH = Math.max(22, 30 * scale);
            ctx.fillStyle = borderColor;
            ctx.fillRect(card.x + 6 * scale, card.y + 6 * scale, card.w - 12 * scale, headerH);
            ctx.fillStyle = tones.inkText;
            ctx.textAlign = 'left';
            this.text(ctx, 13 * scale, 'bold ');
            ctx.fillText(isWeapon ? '武器' : '被动', card.x + 12 * scale, card.y + 24 * scale);
            ctx.fillStyle = tones.gold;
            ctx.textAlign = 'center';
            this.text(ctx, 14 * scale, 'bold ');
            ctx.fillText(`${i + 1}`, card.x + card.w - 22 * scale, card.y + 24 * scale);
            const centerX = card.x + card.w / 2;
            const contentY = card.y + headerH + 14 * scale;
            ctx.fillStyle = tones.inkText;
            this.text(ctx, 42 * scale);
            this.drawSymbolOrSprite(ctx, option.data, centerX, contentY + card.h * 0.18, Math.max(28, 54 * scale));
            this.text(ctx, 16 * scale, 'bold ');
            ctx.fillText(this.truncate(option.data.name, Math.max(4, Math.round(11 * scale))), centerX, contentY + card.h * 0.4);
            const infoY = contentY + card.h * 0.54;
            if (isWeapon) {
                ctx.fillStyle = option.isNew ? tones.statusNew : tones.statusLevel;
                this.text(ctx, 13 * scale, 'bold ');
                ctx.fillText(option.isNew ? '[新武器]' : (option.level >= option.maxLevel ? 'MAX' : `Lv.${option.level}/${option.maxLevel}`), centerX, infoY);
                ctx.fillStyle = tones.muted;
                this.text(ctx, 11 * scale);
                ctx.fillText(this.truncate(`伤害${option.data.dmg} 冷却${option.data.cd}s`, Math.max(8, Math.round(18 * scale))), centerX, contentY + card.h * 0.7);
            } else {
                ctx.fillStyle = tones.statusPassive;
                this.text(ctx, 13 * scale, 'bold ');
                ctx.fillText(`Lv.${option.level}/${option.maxLevel}`, centerX, infoY);

                const baseDescY = contentY + card.h * 0.66;
                const hintY = contentY + card.h * 0.79;
                const superInfo = option.superInfo || null;

                ctx.fillStyle = tones.muted;
                this.text(ctx, 11 * scale);
                ctx.fillText(this.truncate(option.data.desc, Math.max(8, Math.round(18 * scale))), centerX, baseDescY);

                if (superInfo) {
                    const ownedHint = superInfo.owned === true;
                    const readyHint = superInfo.canEvolve === true;
                    const weaponLabel = `${superInfo.weaponName}→${superInfo.superName}`;
                    let hintColor = tones.muted;
                    if (readyHint) hintColor = tones.gold;
                    else if (ownedHint) hintColor = tones.statusNew;
                    else hintColor = '#b79eff';

                    const prefix = readyHint
                        ? `已持有 Lv.${superInfo.level} · 可合成超武：`
                        : (ownedHint ? `已持有 Lv.${superInfo.level} · 超武配方：` : '超武配方：');
                    ctx.fillStyle = hintColor;
                    this.text(ctx, ownedHint ? 11.5 * scale : 10.5 * scale, ownedHint ? 'bold ' : '');
                    ctx.fillText(this.truncate(prefix + weaponLabel, Math.max(8, Math.round(20 * scale))), centerX, hintY);
                }
            }
        });
        this.setRegion('levelUp', panel, { cards });
    }

    drawResultScreen() {
        const game = this.game;
        const data = game.gameResultData;
        const isVictory = game.gameResult === 'cleared';
        const isDead = game.gameResult === 'dead';
        const metrics = this.getMetrics();
        const ctx = metrics.ctx;
        const tones = this.getOverlayThemeTones();
        const panel = this.fitPanel(metrics, 500, 380, 20);
        const scale = panel.scale;
        this.drawOverlayBackdrop(ctx, 0.84, tones.tint);
        ctx.textAlign = 'center';
        ctx.fillStyle = isVictory ? tones.statusVictory : (isDead ? tones.statusDefeat : tones.statusNeutral);
        this.text(ctx, 56 * scale, 'bold ');
        ctx.fillText(isVictory ? '🎉 通关胜利! 🎉' : (isDead ? '💀 你阵亡了 💀' : '🏁 游戏结束 🏁'), metrics.centerX, Math.max(40, panel.y - 28 * scale));
        this.drawOverlayPanel(ctx, panel.x, panel.y, panel.width, panel.height, {
            scale,
            accent: isVictory ? tones.statusVictory : (isDead ? tones.statusDefeat : tones.statusNeutral),
            ink: tones.ink,
            paper: tones.paper,
            muted: tones.muted
        });
        ctx.fillStyle = tones.inkText;
        this.text(ctx, 24 * scale, 'bold ');
        ctx.fillText('📊 最终统计', metrics.centerX, panel.y + 35 * scale);
        ctx.strokeStyle = tones.statusLocked;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(panel.x + 30 * scale, panel.y + 50 * scale);
        ctx.lineTo(panel.x + panel.width - 30 * scale, panel.y + 50 * scale);
        ctx.stroke();
        const stats = [
            { label: '💯 最终分数', value: data.finalScore.toLocaleString(), color: tones.statusPrice },
            { label: '⚔️ 击杀敌人', value: data.stats.enemiesKilled, color: tones.inkText },
            { label: '🚪 探索房间', value: data.stats.roomsExplored, color: tones.inkText },
            { label: '💰 获得金币', value: game.player.gold, color: tones.gold },
            { label: '📍 到达层数', value: `${game.currentFloor}/${game.maxFloors}`, color: tones.inkText },
            { label: '⭐ 最高等级', value: `Lv.${game.player.lv}`, color: tones.statusPassive }
        ];
        const rowHeight = Math.min(45 * scale, (panel.height - 96 * scale) / stats.length);
        const startY = panel.y + 92 * scale;
        this.text(ctx, 20 * scale);
        ctx.textAlign = 'left';
        stats.forEach((stat, i) => {
            const y = startY + i * rowHeight;
            ctx.fillStyle = tones.muted;
            ctx.fillText(stat.label, panel.x + 34 * scale, y);
            ctx.fillStyle = stat.color;
            ctx.textAlign = 'right';
            ctx.fillText(String(stat.value), panel.x + panel.width - 34 * scale, y);
            ctx.textAlign = 'left';
        });
        const btnW = Math.min(200 * scale, panel.width - 40 * scale);
        const btnH = 50 * scale;
        const btnX = metrics.centerX - btnW / 2;
        const btnY = panel.y + panel.height + 20 * scale;
        game.resultBtnRect = { x: btnX, y: btnY, w: btnW, h: btnH };
        this.drawOverlayButton(ctx, btnX, btnY, btnW, btnH, '↩ 返回主菜单', {
            scale,
            hovered: false,
            accent: tones.accent
        });
        ctx.fillStyle = tones.muted;
        this.text(ctx, 14 * scale);
        ctx.textAlign = 'center';
        ctx.fillText('点击按钮或按空格键返回', metrics.centerX, btnY + btnH + 30 * scale);
    }
}

window.OverlayCanvasRenderer = OverlayCanvasRenderer;
