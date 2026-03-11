class SidebarHudPresenter {
    constructor(game) {
        this.game = game;
        this.roomNames = {
            start: '起点',
            normal: '战斗',
            boss: 'Boss',
            treasure: '宝箱',
            shop: '商店',
            hidden: '隐藏',
            elite: '精英'
        };
    }

    update() {
        const game = this.game;
        game.applyFloorHudTheme();
        this.updatePrimaryStats();
        this.updateEquipment();
        this.updateCombatStats();
        this.updateRunStats();
        this.updateItemGrid();
        this.updateHeartsAndExp();
        this.updateLegacyTopInfo();
        this.updateMiniMap();
        // updateMobileActionState 由 Game 独立管理
    }

    setText(id, value) {
        const el = document.getElementById(id);
        if (el) el.textContent = value;
    }

    updatePrimaryStats() {
        const game = this.game;
        const floorNameText = game.floorNames?.[game.currentFloor - 1] || '未知区域';
        this.setText('sidebarHp', `${game.player.hp}/${game.player.maxHp}`);
        this.setText('sidebarLv', `Lv.${game.player.lv}`);
        this.setText('sidebarGold', game.player.gold);
        this.setText('sidebarFloor', `${game.currentFloor}/${game.maxFloors}`);
        this.setText('sidebarMapFloor', `第${game.currentFloor}层`);
        this.setText('sidebarMapZone', floorNameText);

        if (game.curRoom) {
            const roomName = this.roomNames[game.curRoom.type] || '探索';
            this.setText('sidebarRoomType', roomName);
            this.setText('mobileRoomType', roomName);
        }
    }

    renderEquipmentSlots(containerId, entries, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const maxSlots = options.maxSlots || 6;
        const emptyTitle = options.emptyTitle || '空槽位';
        container.innerHTML = '';
        for (let i = 0; i < maxSlots; i++) {
            const entry = entries[i];
            const slot = document.createElement('div');
            slot.className = options.className ? options.className(entry) : `equipment-slot${entry ? '' : ' empty'}`;
            slot.title = entry ? options.title(entry) : emptyTitle;
            slot.innerHTML = entry
                ? `<span class="equipment-icon">${options.icon(entry)}</span><span class="equipment-level">${options.level(entry)}</span>`
                : '<span class="equipment-icon">·</span>';
            container.appendChild(slot);
        }
    }

    updateEquipment() {
        const game = this.game;
        this.renderEquipmentSlots('sidebarWeapons', game.weapons, {
            maxSlots: 6,
            emptyTitle: '空武器槽',
            className: (weapon) => `equipment-slot${weapon ? '' : ' empty'}${weapon && weapon.isSuper ? ' active' : ''}`,
            title: (weapon) => `${weapon.cfg.name} ${weapon.isSuper ? '[超武]' : `[Lv.${weapon.level}]`}`,
            icon: (weapon) => weapon.cfg.iconSprite ? `<img src="assets/sprites/weapons/${weapon.cfg.iconSprite}.png" alt="${weapon.cfg.name}" style="width:100%;height:100%;object-fit:contain;">` : weapon.cfg.icon,
            level: (weapon) => (weapon.isSuper ? 'MAX' : `Lv${weapon.level}`)
        });

        const weaponsSummaryEl = document.getElementById('sidebarWeaponsSummary');
        if (weaponsSummaryEl) {
            weaponsSummaryEl.textContent = game.weapons.length > 0
                ? game.weapons.map((w) => `${w.cfg.name}${w.isSuper ? '★' : ''}`).slice(0, 3).join(' / ') + (game.weapons.length > 3 ? ' ...' : '')
                : '最多可携带 6 件武器';
        }

        const ownedPassives = game.passives ? game.passives.getOwnedPassives() : [];
        this.renderEquipmentSlots('sidebarEvolutionPassives', ownedPassives.slice(0, 6), {
            maxSlots: 6,
            emptyTitle: '空被动槽',
            className: (passive) => `equipment-slot passive-slot${passive ? '' : ' empty'}`,
            title: (passive) => `${passive.name} [Lv.${passive.level}]`,
            icon: (passive) => passive.icon,
            level: (passive) => `Lv${passive.level}`
        });

        const passivesSummaryEl = document.getElementById('sidebarPassivesSummary');
        if (passivesSummaryEl) {
            passivesSummaryEl.textContent = ownedPassives.length > 0
                ? ownedPassives.slice(0, 2).map((p) => p.name).join(' / ') + (ownedPassives.length > 2 ? ` +${ownedPassives.length - 2}` : '')
                : '被动与武器联动可合成超武';
        }
    }

    updateCombatStats() {
        const game = this.game;
        if (!game.items) return;
        const stats = game.items.getStats();
        let totalDmg = 0;
        game.weapons.forEach((weapon) => {
            totalDmg += Math.floor(weapon.getDamage(stats) * stats.projSize);
        });
        this.setText('sidebarDmg', totalDmg);
        this.setText('sidebarSpeed', `${Math.floor(stats.speed * 100)}%`);
        this.setText('sidebarFireRate', `${Math.floor(stats.fireRate * 100)}%`);
        this.setText('sidebarCrit', `${Math.floor(stats.crit * 100)}%`);
        const blockChance = Math.min(50, Math.round(stats.armor / (stats.armor + 17) * 100));
        this.setText('sidebarArmor', `${blockChance}%`);
    }

    updateRunStats() {
        const game = this.game;
        if (!game.scoreManager) return;
        this.setText('sidebarScore', game.scoreManager.formatScore());
        this.setText('sidebarKills', game.scoreManager.stats.enemiesKilled);
        const totalRooms = game.allRooms?.size || 0;
        const explored = game.scoreManager.stats.roomsExplored;
        this.setText('sidebarRooms', totalRooms > 0 ? `${explored}/${totalRooms}` : `${explored}`);
        this.setText('sidebarStreak', game.scoreManager.killStreak || 0);

        const elapsedMs = game.scoreManager.isPlaying && game.scoreManager.startTime
            ? Date.now() - game.scoreManager.startTime
            : 0;
        const totalSeconds = Math.max(0, Math.floor(elapsedMs / 1000));
        const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
        const seconds = String(totalSeconds % 60).padStart(2, '0');
        this.setText('sidebarTime', `${minutes}:${seconds}`);
    }

    updateItemGrid() {
        const game = this.game;
        const ownedItems = game.items ? game.items.getOwnedItems() : [];
        for (let i = 0; i < 20; i++) {
            const slot = document.getElementById(`sidebarItem${i}`);
            if (!slot) continue;
            const item = ownedItems[i];
            if (!item) {
                slot.textContent = '';
                slot.classList.remove('filled');
                slot.style.background = 'linear-gradient(180deg, rgba(72,54,38,0.52), rgba(27,20,16,0.84)), var(--asset-ui-slot-item)';
                slot.style.backgroundSize = 'cover, 100% 100%';
                slot.style.backgroundRepeat = 'no-repeat, no-repeat';
                slot.style.borderColor = 'rgba(255,255,255,0.08)';
                slot.style.boxShadow = 'none';
                slot.title = '';
                continue;
            }
            slot.textContent = item.icon;
            slot.classList.add('filled');
            const rarityColor = item.rarityColor || '#888';
            slot.style.background = `linear-gradient(180deg, ${rarityColor}55, rgba(20,16,12,0.88)), var(--asset-ui-slot-item)`;
            slot.style.backgroundSize = 'cover, 100% 100%';
            slot.style.backgroundRepeat = 'no-repeat, no-repeat';
            slot.style.borderColor = rarityColor;
            slot.style.boxShadow = `0 0 5px ${rarityColor}66`;
            const rarityName = getRarityName(item.rarity);
            slot.title = `${item.name} [${rarityName}]\n${item.desc}`;
        }
    }

    updateHeartsAndExp() {
        const game = this.game;
        const heartsEl = document.getElementById('playerHearts');
        const mobileHeartsEl = document.getElementById('mobileHearts');
        if (heartsEl || mobileHeartsEl) {
            const maxHearts = Math.max(0, Math.floor(game.player.maxHp));
            const currentHearts = Math.max(0, Math.floor(game.player.hp));
            let heartsStr = '';
            for (let i = 0; i < maxHearts; i++) heartsStr += i < currentHearts ? '♥' : '♡';
            if (heartsEl) heartsEl.textContent = heartsStr;
            if (mobileHeartsEl) mobileHeartsEl.textContent = heartsStr;
        }

        const expNeeded = game.player.lv * 100;
        const expPercent = (game.player.exp / expNeeded) * 100;
        const expBar = document.getElementById('expBar');
        const mobileExpBar = document.getElementById('mobileExpBar');
        const levelDisplay = document.getElementById('levelDisplay');
        const mobileLevelDisplay = document.getElementById('mobileLevelDisplay');
        const expText = document.getElementById('expText');
        const mobileExpText = document.getElementById('mobileExpText');
        if (expBar) expBar.style.width = `${expPercent}%`;
        if (mobileExpBar) mobileExpBar.style.width = `${expPercent}%`;
        if (levelDisplay) levelDisplay.textContent = game.player.lv;
        if (mobileLevelDisplay) mobileLevelDisplay.textContent = `Lv.${game.player.lv}`;
        if (expText) expText.textContent = `${game.player.exp}/${expNeeded}`;
        if (mobileExpText) mobileExpText.textContent = `${game.player.exp}/${expNeeded}`;
    }

    updateLegacyTopInfo() {
        const game = this.game;
        this.setText('currentFloorDisplay', game.currentFloor);
        this.setText('floorName', game.floorNames[game.currentFloor - 1] || '未知');

        const waveNum = document.getElementById('waveNum');
        if (waveNum) waveNum.textContent = game.curRoom.hordeManager ? game.curRoom.hordeManager.wave : 0;

        const enemyNum = document.getElementById('enemyNum');
        if (enemyNum) {
            const activeCount = game.curRoom.hordeManager
                ? game.curRoom.hordeManager.getActiveEnemies().length
                : game.curRoom.enemies.filter((enemy) => enemy.hp > 0).length;
            enemyNum.textContent = activeCount;
        }
    }

    initItemGrid() {
        const grid = document.getElementById('sidebarItems');
        if (!grid) return;
        grid.innerHTML = '';
        for (let i = 0; i < 20; i++) {
            const slot = document.createElement('div');
            slot.className = 'item-cell';
            slot.id = `sidebarItem${i}`;
            grid.appendChild(slot);
        }
    }

    updateMobileActionState(context) {
        const game = this.game;
        const interactBtn = game.mobileButtons?.interactBtn || document.getElementById('mobileInteractBtn');
        const talkBtn = game.mobileButtons?.talkBtn || document.getElementById('mobileTalkBtn');
        const choiceStrip = document.getElementById('mobileChoiceStrip');

        if (interactBtn && context.label !== undefined) {
            interactBtn.textContent = context.label;
        }

        if (talkBtn) {
            talkBtn.classList.toggle('hidden', !context.canTalk);
            if (context.talkLabel) talkBtn.textContent = context.talkLabel;
        }

        if (choiceStrip) {
            choiceStrip.classList.toggle('hidden', !context.showChoices);
        }
    }

    updateScoreDisplay() {
        const game = this.game;
        const sm = game.scoreManager;
        if (!sm || !sm.isPlaying) return;

        const scoreValue = document.getElementById('scoreValue');
        if (scoreValue) scoreValue.textContent = sm.formatScore();

        const streakEl = document.getElementById('killStreak');
        if (streakEl) {
            if (sm.killStreak >= 3) {
                streakEl.style.display = 'block';
                const streakCount = document.getElementById('streakCount');
                if (streakCount) streakCount.textContent = sm.killStreak;
            } else {
                streakEl.style.display = 'none';
            }
        }

        this.updatePetCountDisplay();
    }

    updatePetCountDisplay() {
        const game = this.game;
        const countEl = document.getElementById('petCount');
        if (countEl && game.petManager) {
            countEl.textContent = game.petManager.count;
        }
    }

    updateMiniMap() {
        const game = this.game;
        const canvases = [
            document.getElementById('miniMapCanvas'),
            document.getElementById('mobileMiniMapCanvas')
        ].filter(Boolean);

        if (canvases.length === 0) return;
        if (!game.allRooms || game.allRooms.size === 0) return;

        game.applyFloorHudTheme();
        const mapColors = game.themeToneResolver.getMiniMapColors();
        const rooms = Array.from(game.allRooms.values());
        let minX = 0, maxX = 0, minY = 0, maxY = 0;

        for (const r of rooms) {
            minX = Math.min(minX, r.gx);
            maxX = Math.max(maxX, r.gx);
            minY = Math.min(minY, r.gy);
            maxY = Math.max(maxY, r.gy);
        }

        canvases.forEach((canvas) => {
            const ctx = canvas.getContext('2d');
            const size = canvas.width;
            const width = maxX - minX + 1;
            const height = maxY - minY + 1;
            const padding = size <= 140 ? 12 : 20;
            const cellSize = Math.min((size - padding * 2) / width, (size - padding * 2) / height);
            const mapPixelW = width * cellSize;
            const mapPixelH = height * cellSize;
            const offsetX = (size - mapPixelW) / 2;
            const offsetY = (size - mapPixelH) / 2;

            ctx.clearRect(0, 0, size, size);
            ctx.fillStyle = mapColors.bg;
            ctx.fillRect(0, 0, size, size);
            ctx.strokeStyle = mapColors.outline;
            ctx.lineWidth = size <= 140 ? 1.5 : 2;
            ctx.strokeRect(0, 0, size, size);

            for (const r of rooms) {
                const rx = offsetX + (r.gx - minX) * cellSize + 2;
                const ry = offsetY + (r.gy - minY) * cellSize + 2;
                const rw = cellSize - 4;

                if (r.visited) {
                    switch(r.type) {
                        case 'start': ctx.fillStyle = mapColors.start; break;
                        case 'boss': ctx.fillStyle = mapColors.boss; break;
                        case 'treasure': ctx.fillStyle = mapColors.treasure; break;
                        case 'shop': ctx.fillStyle = mapColors.shop; break;
                        case 'elite': ctx.fillStyle = mapColors.elite; break;
                        default: ctx.fillStyle = mapColors.normal;
                    }
                    ctx.fillRect(rx, ry, rw, rw);
                } else {
                    ctx.strokeStyle = mapColors.unvisited;
                    ctx.lineWidth = size <= 140 ? 1 : 1.5;
                    ctx.strokeRect(rx, ry, rw, rw);
                }

                if (r.type === 'boss' && r.visited) {
                    const pulse = 0.5 + Math.sin(Date.now() / 150) * 0.5;
                    ctx.strokeStyle = mapColors.boss;
                    ctx.globalAlpha = 0.8 + pulse * 0.2;
                    ctx.lineWidth = size <= 140 ? 2 : 3;
                    ctx.strokeRect(rx - 3, ry - 3, rw + 6, rw + 6);
                    ctx.globalAlpha = 1;
                    if (size > 140) {
                        ctx.fillStyle = mapColors.normal;
                        ctx.font = `${Math.max(8, rw * 0.6)}px ZCOOL KuaiLe Local`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText('☠️', rx + rw/2, ry + rw/2);
                    }
                }

                if (r === game.curRoom) {
                    const pulse = 1 + Math.sin(Date.now() / 200) * 0.3;
                    ctx.strokeStyle = mapColors.current;
                    ctx.lineWidth = size <= 140 ? 2 : 3;
                    ctx.strokeRect(rx - 2, ry - 2, rw + 4, rw + 4);
                    ctx.strokeStyle = mapColors.current;
                    ctx.globalAlpha = 0.45 * pulse;
                    ctx.lineWidth = size <= 140 ? 1.2 : 2;
                    ctx.strokeRect(rx - 4, ry - 4, rw + 8, rw + 8);
                    ctx.globalAlpha = 1;
                }
            }
        });
    }

    // 调试面板方法
    updateGodModeUI(isActive) {
        const btn = document.getElementById('godModeBtn');
        const status = document.getElementById('godModeStatus');
        if (btn && status) {
            btn.classList.toggle('active', isActive);
            status.textContent = isActive ? 'ON' : 'OFF';
            status.style.color = isActive ? '#4f4' : '#888';
        }
    }

    updateHitboxDebugUI(isActive) {
        const btn = document.getElementById('debugHitbox');
        if (btn) btn.textContent = `🎯 碰撞: ${isActive ? 'ON' : 'OFF'}`;
    }

    resetDebugUI() {
        const godModeBtn = document.getElementById('godModeBtn');
        const godModeStatus = document.getElementById('godModeStatus');
        if (godModeBtn && godModeStatus) {
            godModeBtn.classList.remove('active');
            godModeStatus.textContent = 'OFF';
            godModeStatus.style.color = '#888';
        }
    }
}

window.SidebarHudPresenter = SidebarHudPresenter;
