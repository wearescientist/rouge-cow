class ScreenFlowController {
    constructor(options = {}) {
        this.onSelectWeapon = options.onSelectWeapon || (() => {});
        this.onStartSelection = options.onStartSelection || (() => {});
        this.getMenuController = options.getMenuController || (() => null);
        this.mainMenu = document.getElementById('mainMenu');
        this.loadingScreen = document.getElementById('loadingScreen');
        this.story = document.getElementById('story');
        this.weaponSelect = document.getElementById('weaponSelect');
        this.weaponOptions = document.getElementById('weaponOptions');
        this.startGameBtn = document.getElementById('startGameBtn');
        this.mainLayout = document.getElementById('mainLayout');
        this.topScoreBar = document.getElementById('topScoreBar');
        this._weaponSelectionLocked = false;
        this._bound = false;
        this.bind();
    }

    bind() {
        if (this._bound) return;
        if (this.startGameBtn) {
            this.startGameBtn.onclick = async () => {
                if (this.startGameBtn._isProcessing) return;
                this.startGameBtn._isProcessing = true;
                try {
                    await Promise.resolve(this.onStartSelection());
                } finally {
                    this.startGameBtn._isProcessing = false;
                }
            };
        }
        this._bound = true;
    }

    showMainMenu() {
        this.hideAllEntryScreens({ keep: 'mainMenu' });
        const menuController = this.getMenuController();
        if (menuController && typeof menuController.showMenu === 'function') {
            menuController.showMenu();
            return;
        }
        if (!this.mainMenu) return;
        this.mainMenu.style.display = 'block';
        this.mainMenu.style.opacity = '1';
    }

    hideMainMenu() {
        const menuController = this.getMenuController();
        if (menuController && typeof menuController.hideMenu === 'function') {
            menuController.hideMenu();
            return;
        }
        if (!this.mainMenu) return;
        this.mainMenu.style.display = 'none';
    }

    hideAllEntryScreens(options = {}) {
        const keep = options.keep || null;
        if (keep !== 'mainMenu') this.hideMainMenu();
        if (keep !== 'loadingScreen' && this.loadingScreen) this.loadingScreen.style.display = 'none';
        if (keep !== 'story' && this.story) this.story.style.display = 'none';
        if (keep !== 'weaponSelect' && this.weaponSelect) this.weaponSelect.style.display = 'none';
    }

    showStory() {
        this.hideAllEntryScreens({ keep: 'story' });
        if (this.mainLayout) {
            this.mainLayout.classList.remove('active');
            this.mainLayout.style.display = '';
        }
        if (this.topScoreBar) {
            this.topScoreBar.style.display = 'none';
        }
        if (this.story) {
            this.story.style.display = 'block';
        }
    }

    showWeaponSelect(starterWeapons = []) {
        if (!this.weaponSelect || !this.weaponOptions) return;

        this._weaponSelectionLocked = false;
        this.hideAllEntryScreens({ keep: 'weaponSelect' });
        this.weaponOptions.innerHTML = starterWeapons.map((weapon) => `
            <div class="weapon-option" data-weapon="${weapon.key}" style="--w-accent:${weapon.color};">
                <div class="weapon-card-top">
                    <div class="weapon-icon-badge">${window.WeaponIconResolver
                        ? window.WeaponIconResolver.getMarkup(weapon, { style: 'width:72%;height:72%;object-fit:contain;filter:drop-shadow(0 4px 10px rgba(0,0,0,0.35));', altText: weapon.name })
                        : (weapon.iconSprite ? `<img src="assets/runtime/sprites/weapons/${weapon.iconSprite}.png" alt="${weapon.name}" style="width:72%;height:72%;object-fit:contain;filter:drop-shadow(0 4px 10px rgba(0,0,0,0.35));">` : weapon.icon)}</div>
                    <div class="weapon-pick-label">起始武器</div>
                </div>
                <div class="weapon-title">${weapon.name}</div>
                <div class="weapon-desc">${weapon.desc}</div>
                <div class="weapon-card-footer">洞口前的最后整理。选定后立刻装备，本轮开局只保留这一次选择。</div>
            </div>
        `).join('');

        this.weaponSelect.style.display = 'block';

        this.weaponOptions.querySelectorAll('.weapon-option').forEach((element) => {
            element.onclick = () => {
                if (this._weaponSelectionLocked) return;
                this._weaponSelectionLocked = true;
                const weaponKey = element.dataset.weapon;
                this.weaponOptions.querySelectorAll('.weapon-option').forEach((option) => {
                    option.style.pointerEvents = 'none';
                    option.classList.toggle('is-selected', option === element);
                    option.style.opacity = option === element ? '1' : '0.5';
                });
                this.onSelectWeapon(weaponKey);
            };
        });
    }

    showGameplay() {
        this.hideAllEntryScreens();
        if (this.mainLayout) this.mainLayout.classList.add('active');
        if (this.topScoreBar) this.topScoreBar.style.display = 'none';
    }
}

window.ScreenFlowController = ScreenFlowController;
