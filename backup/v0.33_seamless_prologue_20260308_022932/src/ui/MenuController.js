class MenuController {
    constructor(options = {}) {
        this.game = options.game;
        this.checkSaveData = options.checkSaveData || (() => false);
        this.onStart = options.onStart || (() => {});
        this.onContinue = options.onContinue || (() => {});
        this.onOpenSettings = options.onOpenSettings || (() => {});
        this.onOpenCollection = options.onOpenCollection || (() => {});
        this.onExit = options.onExit || (() => {});

        this.mainMenu = document.getElementById('mainMenu');
        this.menuStart = document.getElementById('menuStart');
        this.menuContinue = document.getElementById('menuContinue');
        this.menuSettings = document.getElementById('menuSettings');
        this.menuCollection = document.getElementById('menuCollection');
        this.menuExit = document.getElementById('menuExit');
        this.menuCanvas = document.getElementById('menuCanvas');
        this.menuContent = this.mainMenu ? this.mainMenu.querySelector('.menu-content') : null;
        this.menuVersion = this.mainMenu ? this.mainMenu.querySelector('.menu-version') : null;

        this._resizeHandler = null;
        this._menuDecoRaf = null;
        this._hideTimer = null;
        this._initialized = false;
    }

    init() {
        if (this._initialized) {
            this.updateContinueButtonState();
            return;
        }

        this.updateContinueButtonState();

        if (this.menuStart) {
            this.menuStart.onclick = () => this.onStart();
        }

        if (this.menuContinue) {
            this.menuContinue.onclick = () => {
                if (this.menuContinue.disabled) return;
                this.onContinue();
            };
        }

        if (this.menuSettings) {
            this.menuSettings.onclick = () => this.onOpenSettings();
        }

        if (this.menuCollection) {
            this.menuCollection.onclick = () => this.onOpenCollection();
        }

        if (this.menuExit) {
            this.menuExit.onclick = () => this.onExit();
        }

        this.initBackgroundAnimation();
        this.initDecoration();
        this._initialized = true;
    }

    updateContinueButtonState() {
        if (!this.menuContinue) return false;

        const hasSave = !!this.checkSaveData();
        this.menuContinue.disabled = !hasSave;
        this.menuContinue.setAttribute('aria-disabled', hasSave ? 'false' : 'true');
        return hasSave;
    }

    showMenu() {
        if (!this.mainMenu) return;
        if (this._hideTimer) {
            clearTimeout(this._hideTimer);
            this._hideTimer = null;
        }
        this.mainMenu.style.display = 'block';
        this.mainMenu.style.opacity = '1';
        this.restoreChrome();
        this.updateContinueButtonState();
    }

    hideMenu() {
        if (!this.mainMenu) return;
        if (this._hideTimer) {
            clearTimeout(this._hideTimer);
        }
        this.mainMenu.style.opacity = '0';
        this.mainMenu.style.transition = 'opacity 0.5s';
        this._hideTimer = setTimeout(() => {
            this.mainMenu.style.display = 'none';
            this.restoreChrome();
            this._hideTimer = null;
        }, 500);
    }

    fadeChromeOut() {
        if (!this.menuContent) return Promise.resolve();

        this.menuContent.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
        this.menuContent.style.opacity = '0';
        this.menuContent.style.transform = 'translateY(-8px)';
        this.menuContent.style.pointerEvents = 'none';
        if (this.menuVersion) {
            this.menuVersion.style.transition = 'opacity 0.3s ease';
            this.menuVersion.style.opacity = '0';
        }
        return new Promise((resolve) => setTimeout(resolve, 460));
    }

    restoreChrome() {
        if (this.menuContent) {
            this.menuContent.style.opacity = '1';
            this.menuContent.style.transform = 'none';
            this.menuContent.style.pointerEvents = 'auto';
        }
        if (this.menuVersion) {
            this.menuVersion.style.opacity = '1';
        }
    }

    initBackgroundAnimation() {
        if (!this.mainMenu) return;

        const bgSrc = 'assets/sprites/ui/ChatGPT Image.png?v=menu_static2';
        const img = new Image();
        img.src = bgSrc;

        const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const ua = navigator.userAgent || '';
        const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(ua) || window.innerWidth <= 900;
        const lowCpu = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4;
        const lowMem = typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 4;
        const disableMotion = prefersReduced || (isMobile && (lowCpu || lowMem));

        this.mainMenu.style.backgroundImage = `linear-gradient(180deg, rgba(7,10,18,0.70), rgba(9,12,20,0.50) 42%, rgba(7,10,18,0.74)), url('${bgSrc}')`;
        this.mainMenu.style.backgroundColor = '#060a13';
        this.mainMenu.style.backgroundRepeat = 'no-repeat, no-repeat';
        this.mainMenu.style.backgroundPosition = 'center center, 50% 50%';
        this.mainMenu.style.backgroundSize = '100% 100%, auto 100%';
        this.mainMenu.style.backgroundBlendMode = 'normal, normal';
        this.mainMenu.style.willChange = disableMotion ? 'auto' : 'background-position';
        this.mainMenu.style.animation = disableMotion
            ? 'none'
            : (isMobile
                ? 'menuBgDriftMobile 72s ease-in-out infinite'
                : 'menuBgDriftDesktop 54s ease-in-out infinite');
    }

    initDecoration() {
        if (!this.menuCanvas) return;

        const canvas = this.menuCanvas;
        const ctx = canvas.getContext('2d');
        const ua = navigator.userAgent || '';
        const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(ua) || window.innerWidth <= 900;
        const lowCpu = typeof navigator.hardwareConcurrency === 'number' && navigator.hardwareConcurrency <= 4;
        const lowMem = typeof navigator.deviceMemory === 'number' && navigator.deviceMemory <= 4;
        const lowEnd = isMobile && (lowCpu || lowMem);
        const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        if (this._resizeHandler) {
            window.removeEventListener('resize', this._resizeHandler);
        }

        this._resizeHandler = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        this._resizeHandler();
        window.addEventListener('resize', this._resizeHandler, { passive: true });

        const particles = [];
        const particleCount = prefersReduced ? 0 : (lowEnd ? 10 : (isMobile ? 18 : 30));
        const speedBase = lowEnd ? 0.08 : (isMobile ? 0.12 : 0.18);
        for (let i = 0; i < particleCount; i++) {
            const baseAlpha = (Math.random() * 0.12) + (lowEnd ? 0.04 : 0.06);
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * speedBase,
                vy: (Math.random() - 0.5) * speedBase,
                size: Math.random() * (isMobile ? 1.2 : 1.6) + 0.8,
                alpha: baseAlpha,
                baseAlpha,
                twinkleSpeed: 0.5 + Math.random() * 1.3,
                twinkleOffset: Math.random() * Math.PI * 2
            });
        }

        if (this._menuDecoRaf) {
            cancelAnimationFrame(this._menuDecoRaf);
            this._menuDecoRaf = null;
        }

        let t = 0;
        const animate = () => {
            const isVisible = this.mainMenu && this.mainMenu.style.display !== 'none';
            if (isVisible && particles.length > 0) {
                t += 0.016;
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                particles.forEach((particle) => {
                    particle.x += particle.vx;
                    particle.y += particle.vy;

                    if (particle.x < 0) particle.x = canvas.width;
                    if (particle.x > canvas.width) particle.x = 0;
                    if (particle.y < 0) particle.y = canvas.height;
                    if (particle.y > canvas.height) particle.y = 0;

                    const twinkle = 0.72 + 0.28 * Math.sin((t * particle.twinkleSpeed) + particle.twinkleOffset);
                    particle.alpha = particle.baseAlpha * twinkle;

                    ctx.fillStyle = `rgba(212, 226, 245, ${particle.alpha.toFixed(3)})`;
                    ctx.beginPath();
                    ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
                    ctx.fill();
                });
            }

            this._menuDecoRaf = requestAnimationFrame(animate);
        };

        animate();
    }
}

window.MenuController = MenuController;
