(function attachWeaponIconResolver(global) {
    'use strict';

    const resolver = {
        getMarkup(data, options = {}) {
            const iconSprite = data?.iconSprite || data?.spriteKey || null;
            const fallbackIcon = data?.icon || options.fallbackIcon || '•';
            const altText = data?.name || data?.label || options.altText || '';
            const style = options.style || 'width:100%;height:100%;object-fit:contain;';
            if (!global.AssetResolver) {
                return String(fallbackIcon || '•');
            }
            return global.AssetResolver.createWeaponIconMarkup(iconSprite, fallbackIcon, altText, style);
        },
        getSpriteCandidates(iconSprite) {
            return global.AssetResolver ? global.AssetResolver.weaponIconCandidates(iconSprite) : [];
        }
    };

    global.WeaponIconResolver = resolver;
})(window);
