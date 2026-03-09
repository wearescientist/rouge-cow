class MenuOverlayController {
    constructor() {
        this.root = null;
        this.toastStack = null;
        this.confirmBox = null;
        this.confirmTitle = null;
        this.confirmMessage = null;
        this.confirmCancel = null;
        this.confirmOk = null;
        this._resolver = null;
        this._initialized = false;
        this._handleKeyDown = this.handleKeyDown.bind(this);
    }

    init() {
        if (this._initialized) return;

        const style = document.createElement('style');
        style.textContent = `
            .menu-overlay-root { position: fixed; inset: 0; z-index: 2200; pointer-events: none; }
            .menu-overlay-confirm { position: absolute; inset: 0; display: none; align-items: center; justify-content: center; background: rgba(4, 7, 12, 0.62); pointer-events: auto; }
            .menu-overlay-card { width: min(420px, calc(100vw - 32px)); padding: 20px 18px 16px; border: 1px solid rgba(255,255,255,0.14); border-radius: 16px; background: linear-gradient(180deg, rgba(10,14,24,0.96), rgba(8,11,19,0.98)); box-shadow: 0 18px 50px rgba(0,0,0,0.42); color: #f4f2ef; }
            .menu-overlay-title { margin: 0 0 10px; font-size: 28px; line-height: 1.1; }
            .menu-overlay-message { margin: 0; font-size: 15px; line-height: 1.6; color: #d4dae7; }
            .menu-overlay-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 18px; }
            .menu-overlay-btn { min-width: 110px; padding: 10px 14px; border: 1px solid rgba(255,255,255,0.14); border-radius: 12px; background: rgba(255,255,255,0.06); color: #fff; font: inherit; cursor: pointer; }
            .menu-overlay-btn:hover { background: rgba(255,255,255,0.12); }
            .menu-overlay-btn.danger { background: rgba(185, 54, 54, 0.18); border-color: rgba(255,120,120,0.24); }
            .menu-overlay-btn.primary { background: rgba(85, 118, 255, 0.18); border-color: rgba(134,161,255,0.3); }
            .menu-overlay-toast-stack { position: absolute; top: 18px; right: 18px; display: flex; flex-direction: column; gap: 10px; width: min(360px, calc(100vw - 28px)); }
            .menu-overlay-toast { padding: 12px 14px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.12); background: rgba(8,12,21,0.94); color: #f5f5f2; box-shadow: 0 10px 28px rgba(0,0,0,0.28); opacity: 0; transform: translateY(-8px); transition: opacity 0.18s ease, transform 0.18s ease; pointer-events: auto; }
            .menu-overlay-toast.show { opacity: 1; transform: translateY(0); }
            .menu-overlay-toast.info { border-color: rgba(123, 176, 255, 0.24); }
            .menu-overlay-toast.warn { border-color: rgba(255, 197, 104, 0.28); }
            .menu-overlay-toast.error { border-color: rgba(255, 122, 122, 0.3); }
        `;
        document.head.appendChild(style);

        this.root = document.createElement('div');
        this.root.className = 'menu-overlay-root';
        this.root.innerHTML = `
            <div class="menu-overlay-confirm">
                <div class="menu-overlay-card">
                    <h3 class="menu-overlay-title"></h3>
                    <p class="menu-overlay-message"></p>
                    <div class="menu-overlay-actions">
                        <button type="button" class="menu-overlay-btn" data-action="cancel">取消</button>
                        <button type="button" class="menu-overlay-btn primary" data-action="ok">确认</button>
                    </div>
                </div>
            </div>
            <div class="menu-overlay-toast-stack"></div>
        `;
        document.body.appendChild(this.root);

        this.confirmBox = this.root.querySelector('.menu-overlay-confirm');
        this.confirmTitle = this.root.querySelector('.menu-overlay-title');
        this.confirmMessage = this.root.querySelector('.menu-overlay-message');
        this.confirmCancel = this.root.querySelector('[data-action="cancel"]');
        this.confirmOk = this.root.querySelector('[data-action="ok"]');
        this.toastStack = this.root.querySelector('.menu-overlay-toast-stack');

        this.confirmCancel.addEventListener('click', () => this.resolve(false));
        this.confirmOk.addEventListener('click', () => this.resolve(true));
        this.confirmBox.addEventListener('click', (event) => {
            if (event.target === this.confirmBox) {
                this.resolve(false);
            }
        });
        window.addEventListener('keydown', this._handleKeyDown);
        this._initialized = true;
    }

    async confirm(options = {}) {
        this.init();

        if (this._resolver) {
            this.resolve(false);
        }

        this.confirmTitle.textContent = options.title || '请确认操作';
        this.confirmMessage.textContent = options.message || '';
        this.confirmCancel.textContent = options.cancelText || '取消';
        this.confirmOk.textContent = options.confirmText || '确认';
        this.confirmOk.classList.toggle('danger', !!options.danger);
        this.confirmOk.classList.toggle('primary', !options.danger);
        this.confirmBox.style.display = 'flex';

        return new Promise((resolve) => {
            this._resolver = resolve;
        });
    }

    toast(message, options = {}) {
        this.init();

        const toast = document.createElement('div');
        const tone = options.tone || 'info';
        toast.className = `menu-overlay-toast ${tone}`;
        toast.textContent = message;
        this.toastStack.appendChild(toast);

        requestAnimationFrame(() => toast.classList.add('show'));

        const duration = Math.max(1000, options.duration || 2200);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 180);
        }, duration);
    }

    resolve(result) {
        if (!this._resolver) return;

        const resolve = this._resolver;
        this._resolver = null;
        this.confirmBox.style.display = 'none';
        this.confirmOk.classList.remove('danger');
        this.confirmOk.classList.add('primary');
        resolve(result);
    }

    handleKeyDown(event) {
        if (!this._resolver) return;
        if (event.key === 'Escape') {
            this.resolve(false);
        }
        if (event.key === 'Enter') {
            this.resolve(true);
        }
    }
}

window.MenuOverlayController = MenuOverlayController;
