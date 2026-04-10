class SidebarHudPresenter {
    constructor(game) {
        this.game = game;
        this.textCache = new Map();
        this.lastFastUpdate = 0;
        this.lastEquipmentUpdate = 0;
        this.lastItemUpdate = 0;
        this.lastMiniMapUpdate = 0;
        this.sidebarFitQueued = false;
        this.sidebarFitSignature = '';
        this.debugSnapshot = {
            lastFrameCost: 0,
            lastFastUpdate: 0,
            lastEquipmentUpdate: 0,
            lastItemUpdate: 0,
            lastMiniMapUpdate: 0
        };
        this.equipmentSignature = '';
        this.itemSignature = '';
        this.miniMapSignature = '';
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
        const start = performance.now();
        const now = start;
        const game = this.game;
        let shouldFitSidebars = false;
        game.applyFloorHudTheme();

        if (now - this.lastFastUpdate >= 80) {
            this.updatePrimaryStats();
            this.updateCombatStats();
            this.updateRunStats();
            this.updateHeartsAndExp();
            this.updateLegacyTopInfo();
            this.lastFastUpdate = now;
            this.debugSnapshot.lastFastUpdate = now;
        }

        const equipmentSignature = this.getEquipmentSignature();
        if (equipmentSignature !== this.equipmentSignature || now - this.lastEquipmentUpdate >= 250) {
            this.updateEquipment();
            this.equipmentSignature = equipmentSignature;
            this.lastEquipmentUpdate = now;
            this.debugSnapshot.lastEquipmentUpdate = now;
            shouldFitSidebars = true;
        }

        const itemSignature = this.getItemSignature();
        if (itemSignature !== this.itemSignature || now - this.lastItemUpdate >= 250) {
            this.updateItemGrid();
            this.itemSignature = itemSignature;
            this.lastItemUpdate = now;
            this.debugSnapshot.lastItemUpdate = now;
            shouldFitSidebars = true;
        }

        const miniMapSignature = this.getMiniMapSignature();
        if (miniMapSignature !== this.miniMapSignature || now - this.lastMiniMapUpdate >= 180) {
            this.updateMiniMap(now);
            this.miniMapSignature = miniMapSignature;
            this.lastMiniMapUpdate = now;
            this.debugSnapshot.lastMiniMapUpdate = now;
            shouldFitSidebars = true;
        }

        if (shouldFitSidebars) {
            this.scheduleSidebarFit();
        }

        this.debugSnapshot.lastFrameCost = performance.now() - start;
    }

    scheduleSidebarFit(force = false) {
        if (force) {
            this.sidebarFitSignature = '';
        }
        if (this.sidebarFitQueued) return;
        this.sidebarFitQueued = true;
        requestAnimationFrame(() => {
            this.sidebarFitQueued = false;
            this.fitSidebars(force);
        });
    }

    fitSidebars(force = false) {
        const layout = document.getElementById('mainLayout');
        const leftSidebar = document.getElementById('leftSidebar');
        const rightSidebar = document.getElementById('rightSidebar');
        if (!layout || !leftSidebar || !rightSidebar) return;

        const signature = [
            Math.round(window.innerWidth),
            Math.round(window.innerHeight),
            this.equipmentSignature,
            this.itemSignature,
            this.miniMapSignature,
            document.getElementById('sidebarHp')?.textContent || '',
            document.getElementById('sidebarScore')?.textContent || ''
        ].join('|');
        if (!force && signature === this.sidebarFitSignature) return;
        this.sidebarFitSignature = signature;

        this.fitSidebarColumn(leftSidebar, {
            anchorSide: 'right',
            origin: 'top right'
        });
        this.fitSidebarColumn(rightSidebar, {
            anchorSide: 'left',
            origin: 'top left'
        });
    }

    fitSidebarColumn(sidebar, options = {}) {
        const stack = sidebar?.querySelector('.sidebar-stack');
        if (!stack || getComputedStyle(sidebar).display === 'none') return;

        const previous = {
            transform: stack.style.transform,
            transformOrigin: stack.style.transformOrigin,
            top: stack.style.top,
            left: stack.style.left,
            right: stack.style.right
        };

        stack.style.transform = 'none';
        stack.style.transformOrigin = options.origin || 'top left';
        stack.style.top = '0px';
        stack.style.left = '0px';
        stack.style.right = 'auto';

        const availableWidth = sidebar.clientWidth;
        const availableHeight = sidebar.clientHeight;
        const contentWidth = Math.max(stack.offsetWidth, stack.scrollWidth);
        const contentHeight = Math.max(stack.offsetHeight, stack.scrollHeight);

        if (!availableWidth || !availableHeight || !contentWidth || !contentHeight) {
            stack.style.transform = previous.transform;
            stack.style.transformOrigin = previous.transformOrigin;
            stack.style.top = previous.top;
            stack.style.left = previous.left;
            stack.style.right = previous.right;
            return;
        }

        const scale = Math.min(availableWidth / contentWidth, availableHeight / contentHeight, 1);
        const scaledWidth = contentWidth * scale;
        const scaledHeight = contentHeight * scale;
        const top = Math.max((availableHeight - scaledHeight) / 2, 0);

        stack.style.top = `${Math.round(top)}px`;
        if (options.anchorSide === 'right') {
            stack.style.left = `${Math.max(availableWidth - scaledWidth, 0)}px`;
            stack.style.right = 'auto';
        } else {
            stack.style.left = '0px';
            stack.style.right = 'auto';
        }
        stack.style.transformOrigin = options.origin || 'top left';
        stack.style.transform = `scale(${scale})`;
        stack.dataset.sidebarScale = scale.toFixed(4);
    }

    setText(id, value) {
        const el = document.getElementById(id);
        const nextValue = String(value);
        if (!el || this.textCache.get(id) === nextValue) return;
        el.textContent = nextValue;
        this.textCache.set(id, nextValue);
    }

    getEquipmentSignature() {
        const weapons = (this.game.weapons || []).map((weapon) => `${weapon.baseKey}:${weapon.level}:${weapon.isSuper ? 1 : 0}`).join('|');
        const passives = (this.game.passives ? this.game.passives.getOwnedPassives() : [])
            .map((passive) => `${passive.key || passive.id || passive.name}:${passive.level}`)
            .join('|');
        const petSkills = (this.game.petManager?.getSkillEntries?.() || [])
            .map((entry) => `${entry.key}:${entry.level}`)
            .join('|');
        const petUnlocked = this.game.petManager?.isUnlocked ? '1' : '0';
        return `${weapons}__${passives}__${petUnlocked}__${petSkills}`;
    }

    getItemSignature() {
        const ownedItems = this.game.items ? this.game.items.getOwnedItems() : [];
        return ownedItems
            .slice(0, 20)
            .map((item) => item ? `${item.id}:${item.rarity}:${item.icon}` : 'empty')
            .join('|');
    }

    getMiniMapSignature() {
        const rooms = this.game.allRooms ? Array.from(this.game.allRooms.values()) : [];
        const visibleRooms = rooms.filter((room) => room.type !== 'hidden');
        const visitedCount = visibleRooms.reduce((count, room) => count + (room.visited ? 1 : 0), 0);
        const currentRoom = this.game.curRoom;
        const roomKey = currentRoom ? `${currentRoom.gx},${currentRoom.gy},${currentRoom.type}` : 'none';
        return `${this.game.currentFloor}|${rooms.length}|${visitedCount}|${roomKey}`;
    }

    getDebugSnapshot() {
        return { ...this.debugSnapshot };
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
        this.setText('mobileFloor', `第${game.currentFloor}层`);
        this.setText('mobileGold', game.player.gold);

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

    renderMobileCompactSlots(containerId, entries, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;
        const maxSlots = options.maxSlots || 6;
        const items = Array.isArray(entries) ? entries.slice(0, maxSlots) : [];
        if (!items.length) {
            container.innerHTML = `<div class="mobile-slot-grid empty"><div class="mobile-row-value dim">${options.emptyText || '暂无'}</div></div>`;
            return;
        }
        const html = [];
        for (let i = 0; i < maxSlots; i++) {
            const entry = items[i];
            if (!entry) {
                html.push('<div class="mobile-slot-chip empty" aria-hidden="true"></div>');
                continue;
            }
            const title = (options.title ? options.title(entry) : '').replace(/"/g, '&quot;');
            const iconMarkup = options.icon ? options.icon(entry) : `<span class="mobile-slot-fallback">•</span>`;
            const levelText = options.level ? options.level(entry) : '';
            html.push(`<div class="mobile-slot-chip" title="${title}">${iconMarkup}${levelText ? `<span class="mobile-slot-level">${levelText}</span>` : ''}</div>`);
        }
        container.innerHTML = `<div class="mobile-slot-grid">${html.join('')}</div>`;
    }
    renderMobileSlotGrid(mobileContainerId, entries, options = {}) {
        const mobileContainer = document.getElementById(mobileContainerId);
        if (!mobileContainer) return;
        const maxSlots = options.maxSlots || 6;
        const emptyText = options.emptyText || '暂无';
        const normalized = Array.isArray(entries) ? entries.slice(0, maxSlots) : [];
        const hasLive = normalized.some((entry) => !!entry);
        if (!hasLive) {
            mobileContainer.innerHTML = `<div class="mobile-slot-grid empty"><div class="mobile-row-value dim">${emptyText}</div></div>`;
            return;
        }
        const html = [];
        for (let i = 0; i < maxSlots; i++) {
            const entry = normalized[i];
            if (!entry) {
                html.push('<div class="mobile-slot-chip empty"><span class="mobile-slot-fallback">·</span></div>');
                continue;
            }
            const iconMarkup = options.icon ? options.icon(entry) : '<span class="mobile-slot-fallback">•</span>';
            const levelText = options.level ? (options.level(entry) || '') : '';
            const title = (options.title ? options.title(entry) : '').replace(/"/g, '&quot;');
            const extraClass = options.className ? ` ${options.className(entry)}` : '';
            html.push(`<div class="mobile-slot-chip${extraClass}" title="${title}">${iconMarkup}${levelText ? `<span class="mobile-slot-level">${levelText}</span>` : ''}</div>`);
        }
        mobileContainer.innerHTML = `<div class="mobile-slot-grid">${html.join('')}</div>`;
    }

    mirrorEquipmentSlotsToMobile(sourceContainerId, mobileContainerId, options = {}) {
        const source = document.getElementById(sourceContainerId);
        const mobile = document.getElementById(mobileContainerId);
        if (!source || !mobile) return;
        const slots = Array.from(source.querySelectorAll('.equipment-slot')).slice(0, options.maxSlots || 6);
        const hasLive = slots.some((slot) => !slot.classList.contains('empty'));
        const gridClass = ['mobile-slot-grid', options.gridClass || ''].filter(Boolean).join(' ');
        if (!hasLive) {
            mobile.innerHTML = `<div class="${gridClass} empty"><div class="mobile-row-value dim">${options.emptyText || '暂无'}</div></div>`;
            return;
        }
        const html = [];
        for (const slot of slots) {
            if (slot.classList.contains('empty')) {
                html.push('<div class="mobile-slot-chip empty"><span class="mobile-slot-fallback">·</span></div>');
                continue;
            }
            const iconMarkup = slot.querySelector('.equipment-icon')?.innerHTML || '<span class="mobile-slot-fallback">•</span>';
            const levelText = slot.querySelector('.equipment-level')?.textContent?.trim() || '';
            const title = (slot.getAttribute('title') || '').replace(/"/g, '&quot;');
            const extraClass = [
                slot.classList.contains('active') ? 'active' : '',
                slot.classList.contains('passive-slot') ? 'passive-slot' : '',
                slot.classList.contains('pet-slot') ? 'pet-slot' : ''
            ].filter(Boolean).join(' ');
            html.push(`<div class="mobile-slot-chip${extraClass ? ` ${extraClass}` : ''}" title="${title}">${iconMarkup}${levelText ? `<span class="mobile-slot-level">${levelText}</span>` : ''}</div>`);
        }
        mobile.innerHTML = `<div class="${gridClass}">${html.join('')}</div>`;
    }

    updateEquipment() {
        const game = this.game;
        this.renderEquipmentSlots('sidebarWeapons', game.weapons, {
            maxSlots: 6,
            emptyTitle: '空武器槽',
            className: (weapon) => `equipment-slot${weapon ? '' : ' empty'}${weapon && weapon.isSuper ? ' active' : ''}`,
            title: (weapon) => `${weapon.cfg.name} ${weapon.isSuper ? '[超武]' : `[Lv.${weapon.level}]`}`,
            icon: (weapon) => (window.WeaponIconResolver
                ? window.WeaponIconResolver.getMarkup(weapon.cfg, { style: 'width:100%;height:100%;object-fit:contain;', altText: weapon.cfg.name })
                : (weapon.cfg.iconSprite ? window.AssetResolver ? window.AssetResolver.createWeaponIconMarkup(weapon.cfg.iconSprite, weapon.cfg.icon, weapon.cfg.name, 'width:100%;height:100%;object-fit:contain;') : `<img src="${window.RuntimeAssetBase?.resolveSprite?.(`weapons/${weapon.cfg.iconSprite}.png`) || `assets/runtime/sprites/weapons/${weapon.cfg.iconSprite}.png`}" alt="${weapon.cfg.name}" style="width:100%;height:100%;object-fit:contain;">` : weapon.cfg.icon)),
            level: (weapon) => (weapon.isSuper ? 'MAX' : `Lv${weapon.level}`)
        });

        const weaponsSummaryText = game.weapons.length > 0
                ? game.weapons.map((w) => `${w.cfg.name}${w.isSuper ? '★' : ''}`).slice(0, 2).join(' / ') + (game.weapons.length > 2 ? ` +${game.weapons.length - 2}` : '')
                : '暂无武器';
        const weaponsSummaryEl = document.getElementById('sidebarWeaponsSummary');
        if (weaponsSummaryEl) {
            weaponsSummaryEl.textContent = weaponsSummaryText;
        }
        this.mirrorEquipmentSlotsToMobile('sidebarWeapons', 'mobileWeaponsSummary', {
            maxSlots: 6,
            emptyText: '暂无武器',
            gridClass: 'compact-equipment'
        });

        const ownedPassives = game.passives ? game.passives.getOwnedPassives() : [];
        this.renderEquipmentSlots('sidebarEvolutionPassives', ownedPassives.slice(0, 6), {
            maxSlots: 6,
            emptyTitle: '空被动槽',
            className: (passive) => `equipment-slot passive-slot${passive ? '' : ' empty'}`,
            title: (passive) => `${passive.name} [Lv.${passive.level}]`,
            icon: (passive) => passive.icon,
            level: (passive) => `Lv${passive.level}`
        });

        const passivesSummaryText = ownedPassives.length > 0
                ? ownedPassives.slice(0, 2).map((p) => p.name).join(' / ') + (ownedPassives.length > 2 ? ` +${ownedPassives.length - 2}` : '')
                : '暂无被动';
        const passivesSummaryEl = document.getElementById('sidebarPassivesSummary');
        if (passivesSummaryEl) {
            passivesSummaryEl.textContent = passivesSummaryText;
        }
        this.mirrorEquipmentSlotsToMobile('sidebarEvolutionPassives', 'mobilePassivesSummary', {
            maxSlots: 6,
            emptyText: '暂无被动',
            gridClass: 'compact-equipment'
        });

        const petEntries = game.petManager?.getSkillEntries?.() || [];
        this.renderEquipmentSlots('sidebarPetSkills', petEntries, {
            maxSlots: 6,
            emptyTitle: '空宠物技能槽',
            className: (entry) => `equipment-slot passive-slot pet-slot${entry && entry.unlocked ? ' active' : ''}${entry ? '' : ' empty'}`,
            title: (entry) => entry.unlocked ? `${entry.name} [Lv.${entry.level}]` : `${entry.name} [未解锁]`,
            icon: (entry) => entry.icon,
            level: (entry) => entry.level > 0 ? `Lv${entry.level}` : '--'
        });

        const petSummaryEl = document.getElementById('sidebarPetSummary');
        if (petSummaryEl) {
            if (!game.petManager?.isUnlocked) {
                petSummaryEl.textContent = '拾取灵宠契约后开启宠物技能池';
            } else {
                const unlocked = petEntries.filter((entry) => entry.level > 0);
                petSummaryEl.textContent = unlocked.length > 0
                    ? `守护灵宠 · ${unlocked.map((entry) => `${entry.name}Lv${entry.level}`).slice(0, 2).join(' / ')}${unlocked.length > 2 ? ` +${unlocked.length - 2}` : ''}`
                    : '守护灵宠已跟随，继续拾取宠物技能成长';
            }
        }
    }

    updateCombatStats() {
        const game = this.game;
        if (!game.items) return;
        const stats = game.items.getStats() || {};
        const petBonuses = game.petManager?.getTeamBonuses?.() || {};
        const speed = Number.isFinite(stats.speed) ? stats.speed : 1;
        const fireRateBase = Number.isFinite(stats.fireRate) ? stats.fireRate : 1;
        const fireRate = fireRateBase * (1 + (petBonuses.fireRateMul || 0));
        const critBase = Number.isFinite(stats.crit) ? stats.crit : 0;
        const crit = critBase + (petBonuses.critAdd || 0) + ((petBonuses.luckAdd || 0) * 0.5);
        const armor = Number.isFinite(stats.armor) ? stats.armor : 0;
        const attackPower = Math.max(
            1,
            Number(game.currentCombatStats?.attackPower)
                || Number(game.player?.attackPowerBase)
                || Number(window.WEAPON_DAMAGE_MODEL?.baseAttackPower)
                || 24
        );
        this.setText('sidebarDmg', attackPower);
        this.setText('sidebarSpeed', `${Math.floor(speed * 100)}%`);
        this.setText('sidebarFireRate', `${Math.floor(fireRate * 100)}%`);
        this.setText('sidebarCrit', `${Math.floor(crit * 100)}%`);
        const blockChance = armor > 0 ? Math.min(50, Math.round(armor / (armor + 17) * 100)) : 0;
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
        this.setText('mobileTime', `${minutes}:${seconds}`);
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
            if (mobileHeartsEl) {
                mobileHeartsEl.innerHTML = heartsStr.split('').map((heart) => `<span class="mobile-heart-cell">${heart}</span>`).join('');
            }
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
        this.scheduleSidebarFit(true);
    }

    updateMobileActionState(context) {
        const game = this.game;
        const interactBtn = game.mobileButtons?.interactBtn || document.getElementById('mobileInteractBtn');
        const confirmBtn = game.mobileButtons?.confirmBtn || document.getElementById('mobileConfirmBtn');
        const talkBtn = game.mobileButtons?.talkBtn || document.getElementById('mobileTalkBtn');
        const cancelBtn = game.mobileButtons?.cancelBtn || document.getElementById('mobileCancelBtn');
        const auxBtn = game.mobileButtons?.auxBtn || document.getElementById('mobileAuxBtn');
        const choiceStrip = document.getElementById('mobileChoiceStrip');

        if (interactBtn && context.label !== undefined) {
            interactBtn.textContent = context.label;
        }

        if (confirmBtn) {
            confirmBtn.textContent = context.showChoices ? '选择' : '确认';
        }

        if (talkBtn) {
            talkBtn.classList.toggle('hidden', !context.canTalk);
            if (context.talkLabel) talkBtn.textContent = context.talkLabel;
        }

        if (cancelBtn) {
            cancelBtn.classList.toggle('hidden', !(game.shopOpen || game.chestOpen || game.weaponBoxOpen || (game.manualPaused && !game.hasBlockingOverlayOpen?.())));
        }

        if (auxBtn) {
            const showAux = !!context.showChoices;
            auxBtn.classList.toggle('hidden', !showAux);
            if (showAux) auxBtn.textContent = '选1';
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

    updateMiniMap(now = performance.now()) {
        const game = this.game;
        const canvases = [
            document.getElementById('miniMapCanvas'),
            document.getElementById('mobileMiniMapCanvas')
        ].filter(Boolean);

        if (canvases.length === 0) return;
        if (!game.allRooms || game.allRooms.size === 0) return;

        game.applyFloorHudTheme();
        const mapColors = game.themeToneResolver.getMiniMapColors();
        const revealAll = !!(game.items?.getStats?.()?.fullMapScroll);
        const rooms = Array.from(game.allRooms.values()).filter((room) => room.type !== 'hidden');
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

                const isVisited = !!r.visited;
                const isVisible = revealAll || isVisited;
                if (isVisible) {
                    if (!isVisited && revealAll) {
                        ctx.save();
                        ctx.globalAlpha = 0.52;
                        ctx.fillStyle = '#6f7480';
                        ctx.fillRect(rx, ry, rw, rw);
                        ctx.globalAlpha = 0.95;
                        ctx.strokeStyle = '#b9c0cd';
                        ctx.lineWidth = size <= 140 ? 1 : 1.5;
                        ctx.strokeRect(rx, ry, rw, rw);
                        ctx.restore();
                    } else {
                        switch(r.type) {
                            case 'start': ctx.fillStyle = mapColors.start; break;
                            case 'boss': ctx.fillStyle = mapColors.boss; break;
                            case 'treasure': ctx.fillStyle = mapColors.treasure; break;
                            case 'shop': ctx.fillStyle = mapColors.shop; break;
                            case 'elite': ctx.fillStyle = mapColors.elite; break;
                            default: ctx.fillStyle = mapColors.normal;
                        }
                        ctx.fillRect(rx, ry, rw, rw);
                    }
                } else {
                    ctx.strokeStyle = mapColors.unvisited;
                    ctx.lineWidth = size <= 140 ? 1 : 1.5;
                    ctx.strokeRect(rx, ry, rw, rw);
                }

                if (r.type === 'boss' && isVisible) {
                    const pulse = 0.5 + Math.sin(now / 150) * 0.5;
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
                    const pulse = 1 + Math.sin(now / 200) * 0.3;
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
