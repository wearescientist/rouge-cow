class OverlayCanvasRenderer {
    constructor(game) {
        this.game = game;
    }

    drawOverlayBackdrop(ctx, alpha = 0.78, tint = 'rgba(9, 10, 14, 0.84)') {
        const canvas = ctx.canvas;
        const cw = canvas.width || 900;
        const ch = canvas.height || 600;
        ctx.save();
        ctx.fillStyle = tint;
        ctx.fillRect(0, 0, cw, ch);
        const vignette = ctx.createRadialGradient(cw / 2, ch * 0.46, ch * 0.08, cw / 2, ch * 0.5, ch * 0.72);
        vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
        vignette.addColorStop(1, `rgba(0, 0, 0, ${alpha})`);
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, cw, ch);
        ctx.fillStyle = 'rgba(255, 241, 214, 0.03)';
        ctx.fillRect(cw * 0.18, ch * 0.06, cw * 0.64, ch * 0.12);
        ctx.restore();
    }

    getOverlayThemeTones() {
        return this.game.themeToneResolver.getOverlayTones();
    }

    drawOverlayPanel(ctx, x, y, width, height, options = {}) {
        const accent = options.accent || '#d8bb77';
        const ink = options.ink || 'rgba(18, 12, 9, 0.92)';
        const paper = options.paper || 'rgba(75, 56, 40, 0.22)';
        const title = options.title || '';
        const subtitle = options.subtitle || '';
        const muted = options.muted || 'rgba(240, 228, 203, 0.76)';
        ctx.save();
        ctx.fillStyle = ink;
        ctx.fillRect(x, y, width, height);
        ctx.fillStyle = paper;
        ctx.fillRect(x + 8, y + 8, width - 16, height - 16);
        ctx.fillStyle = 'rgba(255, 244, 220, 0.04)';
        ctx.fillRect(x + 10, y + 10, width - 20, 46);
        ctx.strokeStyle = accent;
        ctx.lineWidth = 3;
        ctx.strokeRect(x + 2, y + 2, width - 4, height - 4);
        ctx.strokeStyle = 'rgba(22, 14, 11, 0.88)';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 8, y + 8, width - 16, height - 16);
        ctx.strokeStyle = 'rgba(255, 242, 215, 0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 18, y + 58);
        ctx.lineTo(x + width - 18, y + 58);
        ctx.stroke();
        if (title) {
            ctx.fillStyle = accent;
            ctx.textAlign = 'center';
            ctx.font = 'bold 28px ZCOOL KuaiLe Local';
            ctx.fillText(title, x + width / 2, y + 36);
        }
        if (subtitle) {
            ctx.fillStyle = muted;
            ctx.font = '14px ZCOOL KuaiLe Local';
            ctx.fillText(subtitle, x + width / 2, y + height - 18);
        }
        ctx.restore();
    }

    drawOverlayCard(ctx, x, y, width, height, options = {}) {
        const accent = options.accent || '#d8bb77';
        const fill = options.fill || 'rgba(33, 24, 18, 0.88)';
        const highlight = options.highlight || 'rgba(255, 244, 220, 0.04)';
        ctx.save();
        ctx.fillStyle = fill;
        ctx.fillRect(x, y, width, height);
        ctx.fillStyle = highlight;
        ctx.fillRect(x + 6, y + 6, width - 12, Math.max(18, height * 0.22));
        ctx.strokeStyle = accent;
        ctx.lineWidth = options.lineWidth || 2;
        ctx.strokeRect(x + 1, y + 1, width - 2, height - 2);
        ctx.strokeStyle = 'rgba(20, 13, 9, 0.9)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 6, y + 6, width - 12, height - 12);
        ctx.restore();
    }

    drawOverlayButton(ctx, x, y, width, height, label, options = {}) {
        const tones = this.getOverlayThemeTones();
        this.drawOverlayCard(ctx, x, y, width, height, {
            accent: options.hovered ? tones.inkText : (options.accent || tones.muted),
            fill: options.hovered ? 'rgba(88, 66, 46, 0.94)' : 'rgba(31, 24, 19, 0.9)',
            highlight: options.hovered ? 'rgba(255, 242, 214, 0.08)' : 'rgba(255, 242, 214, 0.03)'
        });
        ctx.fillStyle = options.hovered ? tones.inkText : tones.muted;
        ctx.textAlign = 'center';
        ctx.font = options.hovered ? 'bold 19px ZCOOL KuaiLe Local' : '18px ZCOOL KuaiLe Local';
        ctx.fillText(label, x + width / 2, y + height / 2 + 6);
    }

    drawPauseScreen() {
        const game = this.game;
        const ctx = game.ctx;
        const canvas = ctx.canvas;
        const cw = canvas.width || 900;
        const ch = canvas.height || 600;
        const tones = this.getOverlayThemeTones();
        this.drawOverlayBackdrop(ctx, 0.8, tones.tint);
        this.drawOverlayPanel(ctx, cw / 2 - 192, ch / 2 - 162, 384, 364, {
            accent: tones.accent,
            ink: tones.ink,
            paper: tones.paper,
            muted: tones.muted,
            title: '已暂停',
            subtitle: '按 ESC 键恢复游戏'
        });
        ctx.fillStyle = 'rgba(255, 244, 220, 0.035)';
        ctx.fillRect(cw / 2 - 176, ch / 2 - 104, 352, 34);
        ctx.strokeStyle = 'rgba(255, 244, 220, 0.06)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(cw / 2 - 148, ch / 2 - 120);
        ctx.lineTo(cw / 2 + 148, ch / 2 - 120);
        ctx.stroke();
        ctx.textAlign = 'center';
        const buttons = [
            { id: 'resume', text: '继续游戏', y: ch / 2 - 18 },
            { id: 'settings', text: '游戏设置', y: ch / 2 + 34 },
            { id: 'restart', text: '重新开始', y: ch / 2 + 86 },
            { id: 'menu', text: '返回主菜单', y: ch / 2 + 138 }
        ];
        game.pauseButtons = buttons;
        buttons.forEach(btn => {
            const isHovered = game.pauseHoverButton === btn.id;
            this.drawOverlayButton(ctx, cw / 2 - 132, btn.y - 18, 264, 40, btn.text, {
                hovered: isHovered,
                accent: isHovered ? tones.inkText : tones.accent
            });
        });
    }

    drawShopUI() {
        const game = this.game;
        const ctx = game.ctx;
        const canvas = ctx.canvas;
        const cw = canvas.width || 900;
        const ch = canvas.height || 600;
        const centerX = cw / 2;
        const boxWidth = 500;
        const boxHeight = 350;
        const boxX = centerX - boxWidth / 2;
        const boxY = ch / 2 - boxHeight / 2;
        const tones = this.getOverlayThemeTones();
        this.drawOverlayBackdrop(ctx, 0.76, tones.tint);
        this.drawOverlayPanel(ctx, boxX, boxY, boxWidth, boxHeight, {
            accent: tones.passive,
            ink: tones.ink,
            paper: tones.paper,
            muted: tones.muted,
            title: '盲眼的商店',
            subtitle: '按 1-3 购买 | 按 E 关闭'
        });
        ctx.fillStyle = tones.gold;
        ctx.font = '18px ZCOOL KuaiLe Local';
        ctx.textAlign = 'center';
        ctx.fillText(`金币 ${game.player.gold}`, centerX, boxY + 74);
        const itemWidth = 130;
        const itemHeight = 160;
        const startX = centerX - (game.shopItems.length * itemWidth) / 2 + itemWidth / 2;
        game.shopItems.forEach((item, i) => {
            const ix = startX + i * (itemWidth + 20);
            const iy = boxY + 160;
            this.drawOverlayCard(ctx, ix - itemWidth / 2, iy - itemHeight / 2, itemWidth, itemHeight, {
                accent: item.sold ? tones.statusLocked : (game.player.gold >= item.price ? tones.passive : tones.statusWarning),
                fill: item.sold ? 'rgba(20, 18, 17, 0.9)' : tones.ink,
                highlight: 'rgba(255, 244, 220, 0.03)'
            });
            if (item.sold) {
                ctx.fillStyle = tones.statusLocked;
                ctx.font = 'bold 20px ZCOOL KuaiLe Local';
                ctx.fillText('已售罄', ix, iy + 5);
                ctx.fillStyle = tones.muted;
                ctx.font = '12px ZCOOL KuaiLe Local';
                ctx.fillText(`[${i + 1}]`, ix, iy + 80);
                return;
            }
            ctx.font = '48px ZCOOL KuaiLe Local';
            ctx.fillText(item.icon, ix, iy - 20);
            ctx.fillStyle = tones.inkText;
            ctx.font = '14px ZCOOL KuaiLe Local';
            ctx.fillText(item.name, ix, iy + 15);
            ctx.fillStyle = tones.muted;
            ctx.font = '11px ZCOOL KuaiLe Local';
            ctx.fillText(item.desc, ix, iy + 35);
            ctx.fillStyle = game.player.gold >= item.price ? tones.statusPrice : tones.statusWarning;
            ctx.font = 'bold 16px ZCOOL KuaiLe Local';
            ctx.fillText(`💰${item.price}`, ix, iy + 60);
            ctx.fillStyle = tones.muted;
            ctx.font = '12px ZCOOL KuaiLe Local';
            ctx.fillText(`[${i + 1}]`, ix, iy + 80);
        });
        const refreshPrice = 10 * Math.pow(2, game.shopRefreshCount);
        const canRefresh = game.player.gold >= refreshPrice;
        this.drawOverlayButton(ctx, centerX - 82, boxY + boxHeight - 72, 164, 34, `刷新  ${refreshPrice}`, {
            hovered: false,
            accent: canRefresh ? tones.passive : tones.statusWarning
        });
    }

    drawChestSelectUI() {
        const game = this.game;
        const ctx = game.ctx;
        const canvas = ctx.canvas;
        const cw = canvas.width || 900;
        const ch = canvas.height || 600;
        const centerX = cw / 2;
        const boxWidth = 560;
        const boxHeight = 320;
        const boxX = centerX - boxWidth / 2;
        const boxY = ch / 2 - boxHeight / 2;
        const tones = this.getOverlayThemeTones();
        this.drawOverlayBackdrop(ctx, 0.74, tones.tint);
        this.drawOverlayPanel(ctx, boxX, boxY, boxWidth, boxHeight, {
            accent: tones.gold,
            ink: tones.ink,
            paper: tones.paper,
            muted: tones.muted,
            title: '发现宝箱',
            subtitle: '按 1-3 选择物品 | 按 E 关闭宝箱'
        });
        const itemWidth = 150;
        const itemHeight = 180;
        const startX = centerX - (game.chestItems.length * itemWidth) / 2 + itemWidth / 2;
        game.chestItems.forEach((item, i) => {
            const ix = startX + i * (itemWidth + 20);
            const iy = boxY + 150;
            this.drawOverlayCard(ctx, ix - itemWidth / 2, iy - itemHeight / 2, itemWidth, itemHeight, {
                accent: tones.gold,
                fill: tones.ink,
                highlight: 'rgba(255, 236, 192, 0.05)'
            });
            ctx.font = '56px ZCOOL KuaiLe Local';
            ctx.textAlign = 'center';
            ctx.fillText(item.icon, ix, iy - 30);
            ctx.fillStyle = tones.inkText;
            ctx.font = 'bold 14px ZCOOL KuaiLe Local';
            ctx.fillText(item.name, ix, iy + 10);
            ctx.fillStyle = tones.muted;
            ctx.font = '11px ZCOOL KuaiLe Local';
            ctx.fillText(item.desc, ix, iy + 30);
            ctx.fillStyle = tones.statusPrice;
            ctx.font = '12px ZCOOL KuaiLe Local';
            ctx.fillText(`[${i + 1}] 选择`, ix, iy + 70);
        });
    }

    drawWeaponBoxUI() {
        const game = this.game;
        const ctx = game.ctx;
        const canvas = ctx.canvas;
        const cw = canvas.width || 900;
        const ch = canvas.height || 600;
        const centerX = cw / 2;
        const boxWidth = 600;
        const boxHeight = 340;
        const boxX = centerX - boxWidth / 2;
        const boxY = ch / 2 - boxHeight / 2;
        const tones = this.getOverlayThemeTones();
        this.drawOverlayBackdrop(ctx, 0.76, tones.tint);
        this.drawOverlayPanel(ctx, boxX, boxY, boxWidth, boxHeight, {
            accent: tones.weapon,
            ink: tones.ink,
            paper: tones.paper,
            muted: tones.muted,
            title: '神秘武器箱',
            subtitle: '按 1-3 选择武器 | 按 E 或 Esc 关闭'
        });
        const itemWidth = 160;
        const itemHeight = 200;
        const startX = centerX - (game.weaponBoxOptions.length * itemWidth) / 2 + itemWidth / 2;
        game.weaponBoxOptions.forEach((option, i) => {
            const ix = startX + i * (itemWidth + 20);
            const iy = boxY + 160;
            this.drawOverlayCard(ctx, ix - itemWidth / 2, iy - itemHeight / 2, itemWidth, itemHeight, {
                accent: option.isNew ? tones.passive : tones.weapon,
                fill: tones.ink,
                highlight: 'rgba(255, 244, 220, 0.04)'
            });
            ctx.textAlign = 'center';
            if (option.isNew) {
                ctx.fillStyle = tones.statusNew;
                ctx.font = 'bold 12px ZCOOL KuaiLe Local';
                ctx.fillText('[新武器]', ix, iy - 78);
            } else {
                ctx.fillStyle = tones.statusLevel;
                ctx.font = 'bold 12px ZCOOL KuaiLe Local';
                const isMaxLevel = option.level >= option.maxLevel;
                const levelText = isMaxLevel ? 'MAX' : `Lv.${option.level - 1} → Lv.${option.level}`;
                ctx.fillText(levelText, ix, iy - 78);
            }
            ctx.fillStyle = tones.inkText;
            ctx.font = '52px ZCOOL KuaiLe Local';
            ctx.fillText(option.data.icon, ix, iy - 24);
            ctx.font = 'bold 16px ZCOOL KuaiLe Local';
            ctx.fillText(option.data.name, ix, iy + 18);
            ctx.fillStyle = tones.muted;
            ctx.font = '11px ZCOOL KuaiLe Local';
            const desc = option.data.desc || `${option.data.dmg}伤害 ${option.data.cd}秒冷却`;
            ctx.fillText(desc, ix, iy + 44);
            ctx.fillStyle = tones.statusPrice;
            ctx.font = '14px ZCOOL KuaiLe Local';
            ctx.fillText(`[${i + 1}] 选择`, ix, iy + 84);
        });
    }

    drawLevelUpUI() {
        const game = this.game;
        const ctx = game.ctx;
        const boxWidth = 640;
        const boxHeight = 460;
        const boxX = (ctx.canvas.width || 900) / 2 - boxWidth / 2;
        const boxY = (ctx.canvas.height || 600) / 2 - boxHeight / 2;
        const tones = this.getOverlayThemeTones();
        this.drawOverlayBackdrop(ctx, 0.76, tones.tint);
        this.drawOverlayPanel(ctx, boxX, boxY, boxWidth, boxHeight, {
            accent: tones.accent,
            ink: tones.ink,
            paper: tones.paper,
            muted: tones.muted,
            title: '升级抉择',
            subtitle: '按 1-4 选择'
        });
        const padding = 20;
        const bottomBarHeight = 40;
        const contentWidth = boxWidth - padding * 2;
        const contentHeight = boxHeight - 64 - bottomBarHeight;
        const gapX = 20;
        const gapY = 20;
        const cardWidth = (contentWidth - gapX) / 2;
        const cardHeight = (contentHeight - gapY) / 2;
        const startX = boxX + padding;
        const startY = boxY + 68;
        game.levelUpOptions.forEach((option, i) => {
            const row = Math.floor(i / 2);
            const col = i % 2;
            const cardX = startX + col * (cardWidth + gapX);
            const cardY = startY + row * (cardHeight + gapY);
            const isWeapon = option.type === 'weapon';
            const borderColor = isWeapon ? tones.weapon : tones.passive;
            this.drawOverlayCard(ctx, cardX, cardY, cardWidth, cardHeight, {
                accent: borderColor,
                fill: tones.ink,
                highlight: isWeapon ? 'rgba(195, 218, 244, 0.05)' : 'rgba(220, 240, 197, 0.04)',
                lineWidth: 2
            });
            const headerHeight = Math.max(28, cardHeight * 0.15);
            ctx.fillStyle = borderColor;
            ctx.fillRect(cardX + 6, cardY + 6, cardWidth - 12, headerHeight - 2);
            ctx.fillStyle = tones.inkText;
            ctx.font = `bold ${Math.max(13, cardHeight * 0.08)}px ZCOOL KuaiLe Local`;
            ctx.textAlign = 'left';
            ctx.fillText(isWeapon ? '武器' : '被动', cardX + 14, cardY + headerHeight * 0.6);
            ctx.fillStyle = tones.gold;
            ctx.font = `bold ${Math.max(15, cardHeight * 0.09)}px ZCOOL KuaiLe Local`;
            ctx.textAlign = 'center';
            ctx.fillText(`${i + 1}`, cardX + cardWidth - 24, cardY + headerHeight * 0.6);
            const contentY = cardY + headerHeight;
            const contentH = cardHeight - headerHeight;
            const cardCenterX = cardX + cardWidth / 2;
            ctx.font = `${Math.max(40, cardHeight * 0.22)}px ZCOOL KuaiLe Local`;
            ctx.fillText(option.data.icon, cardCenterX, contentY + contentH * 0.35);
            ctx.fillStyle = tones.inkText;
            ctx.font = `bold ${Math.max(16, cardHeight * 0.09)}px ZCOOL KuaiLe Local`;
            ctx.fillText(option.data.name, cardCenterX, contentY + contentH * 0.55);
            const infoY = contentY + contentH * 0.7;
            if (isWeapon) {
                if (option.isNew) {
                    ctx.fillStyle = tones.statusNew;
                    ctx.font = `bold ${Math.max(14, cardHeight * 0.08)}px ZCOOL KuaiLe Local`;
                    ctx.fillText('[新武器]', cardCenterX, infoY);
                } else {
                    ctx.fillStyle = tones.statusLevel;
                    ctx.font = `bold ${Math.max(14, cardHeight * 0.08)}px ZCOOL KuaiLe Local`;
                    const isMaxLevel = option.level >= option.maxLevel;
                    const levelText = isMaxLevel ? 'MAX' : `Lv.${option.level}/${option.maxLevel}`;
                    ctx.fillText(levelText, cardCenterX, infoY);
                }
                ctx.fillStyle = tones.muted;
                ctx.font = `${Math.max(12, cardHeight * 0.07)}px ZCOOL KuaiLe Local`;
                ctx.fillText(`伤害${option.data.dmg} 冷却${option.data.cd}s`, cardCenterX, contentY + contentH * 0.85);
            } else {
                ctx.fillStyle = tones.statusPassive;
                ctx.font = `bold ${Math.max(14, cardHeight * 0.08)}px ZCOOL KuaiLe Local`;
                ctx.fillText(`Lv.${option.level}/${option.maxLevel}`, cardCenterX, infoY);
                ctx.fillStyle = tones.muted;
                ctx.font = `${Math.max(12, cardHeight * 0.07)}px ZCOOL KuaiLe Local`;
                let desc = option.data.desc;
                if (desc.length > 12) desc = desc.substring(0, 11) + '…';
                ctx.fillText(desc, cardCenterX, contentY + contentH * 0.85);
                if (option.superInfo) {
                    const { weaponName, superName, owned, canEvolve } = option.superInfo;
                    const fontSize = Math.max(14, cardHeight * 0.09);
                    if (owned) {
                        ctx.fillStyle = canEvolve ? tones.statusPrice : tones.statusLocked;
                        ctx.font = `bold ${fontSize}px ZCOOL KuaiLe Local`;
                        const icon = canEvolve ? '⭐' : '🔒';
                        ctx.fillText(`${icon}${weaponName}+${option.data.name}=${superName}`, cardCenterX, contentY + contentH * 0.95);
                    } else {
                        ctx.fillStyle = tones.statusLocked;
                        ctx.font = `${fontSize}px ZCOOL KuaiLe Local`;
                        ctx.fillText(`${weaponName}+${option.data.name}=${superName}`, cardCenterX, contentY + contentH * 0.95);
                    }
                }
            }
        });
    }

    drawResultScreen() {
        const game = this.game;
        const ctx = game.ctx;
        const data = game.gameResultData;
        const isVictory = game.gameResult === 'cleared';
        const isDead = game.gameResult === 'dead';
        const canvas = game.canvas;
        const cw = canvas.width;
        const ch = canvas.height;
        const centerX = cw / 2;
        const tones = this.getOverlayThemeTones();
        this.drawOverlayBackdrop(ctx, 0.84, tones.tint);
        ctx.textAlign = 'center';
        if (isVictory) {
            ctx.fillStyle = tones.statusVictory;
            ctx.font = 'bold 56px ZCOOL KuaiLe Local';
            ctx.fillText('🎉 通关胜利! 🎉', centerX, ch * 0.13);
        } else if (isDead) {
            ctx.fillStyle = tones.statusDefeat;
            ctx.font = 'bold 56px ZCOOL KuaiLe Local';
            ctx.fillText('💀 你阵亡了 💀', centerX, ch * 0.13);
        } else {
            ctx.fillStyle = tones.statusNeutral;
            ctx.font = 'bold 56px ZCOOL KuaiLe Local';
            ctx.fillText('🏁 游戏结束 🏁', centerX, ch * 0.13);
        }
        const panelW = Math.min(500, cw - 40);
        const panelH = Math.min(380, ch - 150);
        const panelX = (cw - panelW) / 2;
        const panelY = ch * 0.18;
        this.drawOverlayPanel(ctx, panelX, panelY, panelW, panelH, {
            accent: isVictory ? tones.statusVictory : (isDead ? tones.statusDefeat : tones.statusNeutral),
            ink: tones.ink,
            paper: tones.paper,
            muted: tones.muted
        });
        ctx.fillStyle = tones.inkText;
        ctx.font = 'bold 24px ZCOOL KuaiLe Local';
        ctx.fillText('📊 最终统计', centerX, panelY + 35);
        ctx.strokeStyle = tones.statusLocked;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(panelX + 30, panelY + 50);
        ctx.lineTo(panelX + panelW - 30, panelY + 50);
        ctx.stroke();
        ctx.font = '20px ZCOOL KuaiLe Local';
        ctx.textAlign = 'left';
        const stats = [
            { label: '💯 最终分数', value: data.finalScore.toLocaleString(), color: tones.statusPrice },
            { label: '⚔️ 击杀敌人', value: data.stats.enemiesKilled, color: tones.inkText },
            { label: '🚪 探索房间', value: data.stats.roomsExplored, color: tones.inkText },
            { label: '💰 获得金币', value: game.player.gold, color: tones.gold },
            { label: '📍 到达层数', value: `${game.currentFloor}/6`, color: tones.inkText },
            { label: '⭐ 最高等级', value: `Lv.${game.player.lv}`, color: tones.statusPassive }
        ];
        const rowHeight = Math.min(45, (panelH - 80) / stats.length);
        const startY = panelY + 90;
        stats.forEach((stat, i) => {
            const y = startY + i * rowHeight;
            ctx.fillStyle = tones.muted;
            ctx.fillText(stat.label, panelX + 50, y);
            ctx.fillStyle = stat.color;
            ctx.textAlign = 'right';
            ctx.fillText(String(stat.value), panelX + panelW - 50, y);
            ctx.textAlign = 'left';
        });
        const btnW = 200;
        const btnH = 50;
        const btnX = centerX - btnW / 2;
        const btnY = panelY + panelH + 20;
        game.resultBtnRect = { x: btnX, y: btnY, w: btnW, h: btnH };
        this.drawOverlayButton(ctx, btnX, btnY, btnW, btnH, '↩ 返回主菜单', {
            hovered: false,
            accent: tones.accent
        });
        ctx.fillStyle = tones.muted;
        ctx.font = '14px ZCOOL KuaiLe Local';
        ctx.textAlign = 'center';
        ctx.fillText('点击按钮或按空格键返回', centerX, btnY + btnH + 30);
    }
}

window.OverlayCanvasRenderer = OverlayCanvasRenderer;
