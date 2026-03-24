(function attachAssetResolver(global) {
    'use strict';

    const DEFAULTS = Object.freeze({
        spriteBase: 'assets/runtime/sprites/',
        audioBase: 'assets/runtime/audio/',
        weaponIconFolders: Object.freeze([
            'assets/runtime/sprites/weapons/generated/',
            'assets/runtime/sprites/weapons/',
            'assets/runtime/sprites/weapons/core/'
        ])
    });

    function stripLeading(path) {
        return String(path || '')
            .replace(/^\.\//, '')
            .replace(/^\.\.\//, '')
            .replace(/^assets\/runtime\/(audio|sprites)\//, '')
            .replace(/^runtime\/(audio|sprites)\//, '');
    }

    function ensurePng(path) {
        return /\.[a-z0-9]+$/i.test(path) ? path : `${path}.png`;
    }

    function escapeAttr(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function escapeHtml(value) {
        return String(value ?? '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    const AssetResolver = {
        sprite(path = '') {
            return `${DEFAULTS.spriteBase}${stripLeading(path)}`;
        },
        audio(path = '') {
            return `${DEFAULTS.audioBase}${stripLeading(path)}`;
        },
        effect(name = '') {
            const normalized = ensurePng(stripLeading(name));
            return this.sprite(`effects/${normalized}`);
        },
        enemy(path = '') {
            return this.sprite(`enemies/${stripLeading(path)}`);
        },
        weaponIconCandidates(iconSprite) {
            if (!iconSprite) return [];
            if (global.WEAPON_RUNTIME_SPRITES && global.WEAPON_RUNTIME_SPRITES[iconSprite]) {
                const manifestPath = global.WEAPON_RUNTIME_SPRITES[iconSprite];
                return [manifestPath].concat(
                    DEFAULTS.weaponIconFolders
                        .map((folder) => `${folder}${ensurePng(iconSprite)}`)
                        .filter((candidate) => candidate !== manifestPath)
                );
            }
            return DEFAULTS.weaponIconFolders.map((folder) => `${folder}${ensurePng(iconSprite)}`);
        },
        createWeaponIconMarkup(iconSprite, fallbackIcon, altText = '', style = 'width:100%;height:100%;object-fit:contain;') {
            if (!iconSprite) return escapeHtml(fallbackIcon || '•');
            const candidates = this.weaponIconCandidates(iconSprite);
            if (!candidates.length) return escapeHtml(fallbackIcon || '•');
            const fallbackHtml = escapeHtml(fallbackIcon || '•');
            return `<img src="${escapeAttr(candidates[0])}" alt="${escapeAttr(altText)}" data-asset-candidates="${escapeAttr(JSON.stringify(candidates))}" style="${escapeAttr(style)}" onerror="window.AssetResolver&&window.AssetResolver.handleImageFallback&&window.AssetResolver.handleImageFallback(this, '${escapeAttr(fallbackHtml)}');">`;
        },
        handleImageFallback(imgEl, fallbackHtml = '•') {
            if (!imgEl) return;
            let candidates = [];
            try {
                candidates = JSON.parse(imgEl.dataset.assetCandidates || '[]');
            } catch (err) {
                candidates = [];
            }
            const currentIndex = Number(imgEl.dataset.assetIndex || '0');
            const nextIndex = currentIndex + 1;
            if (nextIndex < candidates.length) {
                imgEl.dataset.assetIndex = String(nextIndex);
                imgEl.src = candidates[nextIndex];
                return;
            }
            imgEl.outerHTML = fallbackHtml;
        }
    };

    global.AssetResolver = AssetResolver;
})(window);
