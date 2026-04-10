class ThemeToneResolver {
    constructor(root = document.documentElement) {
        this.root = root;
    }

    read(name, fallback) {
        const value = getComputedStyle(this.root).getPropertyValue(name).trim();
        return value || fallback;
    }

    getHudCanvasFill() {
        return this.read('--hud-surface-2', '#0d0d1a');
    }

    getOverlayTones() {
        return {
            tint: this.read('--hud-overlay-tint', 'rgba(9, 10, 14, 0.8)'),
            ink: this.read('--hud-overlay-ink', 'rgba(18, 12, 9, 0.92)'),
            paper: this.read('--hud-overlay-paper', 'rgba(75, 56, 40, 0.22)'),
            accent: this.read('--hud-overlay-accent', '#d8bb77'),
            muted: this.read('--hud-overlay-muted', 'rgba(240, 228, 203, 0.76)'),
            statusNew: this.read('--hud-overlay-status-new', '#9ecf8f'),
            statusLevel: this.read('--hud-overlay-status-level', '#d4b3ce'),
            statusPassive: this.read('--hud-overlay-status-passive', '#9bc4c8'),
            statusWarning: this.read('--hud-overlay-status-warning', '#cb7c74'),
            statusPrice: this.read('--hud-overlay-status-price', '#d8bb77'),
            statusLocked: this.read('--hud-overlay-status-locked', '#78706a'),
            statusVictory: this.read('--hud-overlay-status-victory', '#b8d79a'),
            statusDefeat: this.read('--hud-overlay-status-defeat', '#d86d63'),
            statusNeutral: this.read('--hud-overlay-status-neutral', '#d8bb77'),
            weapon: this.read('--hud-overlay-weapon', '#8fb5db'),
            passive: this.read('--hud-overlay-passive', '#8eb770'),
            gold: this.read('--hud-gold', '#d8bb77'),
            inkText: this.read('--hud-ink', '#efe0c7')
        };
    }

    getMiniMapColors() {
        return {
            bg: this.read('--hud-map-bg', '#1b1513'),
            outline: this.read('--hud-map-outline', 'rgba(214,184,132,0.22)'),
            unvisited: this.read('--hud-map-unvisited', '#665748'),
            current: this.read('--hud-map-current', '#f3dfa7'),
            start: this.read('--hud-map-start', '#8eb770'),
            boss: this.read('--hud-map-boss', '#d86d63'),
            treasure: this.read('--hud-map-treasure', '#d8bb77'),
            shop: this.read('--hud-map-shop', '#c8d7bf'),
            elite: this.read('--hud-map-elite', '#b68ace'),
            normal: this.read('--hud-ink', '#d9d0c0')
        };
    }
}

window.ThemeToneResolver = ThemeToneResolver;
