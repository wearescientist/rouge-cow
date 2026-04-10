(function attachRuntimeAssetBase(global) {
    'use strict';

    const LEGACY_REMOTE_RUNTIME_BASE = 'https://wearescientist.github.io/rouge-cow/assets/runtime/';
    const LEGACY_REMOTE_ASSET_ROOT = 'https://wearescientist.github.io/rouge-cow/assets/';
    const LEGACY_ASSET_ALIASES = Object.freeze({});

    function normalizeAliasKey(input) {
        return String(input || '')
            .replace(/\\/g, '/')
            .replace(/^\.\//, '')
            .replace(/^\.\.\//, '')
            .replace(/^\/+/, '')
            .replace(/^https?:\/\/[^/]+\/+/, '');
    }

    function applyLegacyAssetAlias(input) {
        const value = String(input || '');
        if (!value) return value;
        const hashIndex = value.indexOf('#');
        const hash = hashIndex >= 0 ? value.slice(hashIndex) : '';
        const withoutHash = hashIndex >= 0 ? value.slice(0, hashIndex) : value;
        const queryIndex = withoutHash.indexOf('?');
        const query = queryIndex >= 0 ? withoutHash.slice(queryIndex) : '';
        const base = queryIndex >= 0 ? withoutHash.slice(0, queryIndex) : withoutHash;
        const alias = LEGACY_ASSET_ALIASES[normalizeAliasKey(base)];
        if (!alias) return value;
        return `${alias}${query}${hash}`;
    }

    function resolveLocalRuntimeBase() {
        const rawBase = global.__RUNTIME_ASSET_LOCAL_BASE__ || './assets/runtime/';
        const baseRef = global.document?.baseURI || global.location?.href || 'http://localhost/';
        try {
            return new URL(String(rawBase || './assets/runtime/').replace(/\/?$/, '/'), baseRef).href;
        } catch (err) {
            const normalized = String(rawBase || './assets/runtime/')
                .replace(/^\.\//, '')
                .replace(/^\//, '')
                .replace(/\/?$/, '/');
            return normalized;
        }
    }

    const mode = 'local-strict';
    const runtimeBase = resolveLocalRuntimeBase();

    try {
        global.localStorage?.removeItem?.('rougecow_asset_mode');
    } catch (err) {}

    function normalizeRuntimeAssetUrl(input) {
        const value = applyLegacyAssetAlias(input);
        if (!value) return value;
        if (/^(data:|blob:|file:|about:|javascript:|#)/i.test(value)) return value;
        if (/^https?:/i.test(value)) {
            if (value.indexOf(LEGACY_REMOTE_RUNTIME_BASE) === 0) {
                return runtimeBase + value.slice(LEGACY_REMOTE_RUNTIME_BASE.length);
            }
            if (value.indexOf(LEGACY_REMOTE_ASSET_ROOT) === 0) {
                return runtimeBase.replace(/runtime\/$/, '') + value.slice(LEGACY_REMOTE_ASSET_ROOT.length);
            }
            return value;
        }
        const normalized = value
            .replace(/^\.\//, '')
            .replace(/^\.\.\//, '')
            .replace(/^\//, '')
            .replace(/^assets\/runtime\//, '')
            .replace(/^runtime\//, '');
        if (normalized !== value || /^assets\/runtime\//.test(value) || /^runtime\//.test(value)) {
            return runtimeBase + normalized;
        }
        if (/^assets\/fonts\//.test(value)) {
            return runtimeBase.replace(/runtime\/$/, '') + value.replace(/^assets\//, '');
        }
        if (/^assets\//.test(value)) {
            return runtimeBase.replace(/runtime\/$/, '') + value.replace(/^assets\//, '');
        }
        return value;
    }

    function resolveAssetPath(path = '') {
        return normalizeRuntimeAssetUrl(String(path || ''));
    }

    function resolveSpritePath(path = '') {
        const normalized = String(path || '')
            .replace(/^\.\//, '')
            .replace(/^\.\.\//, '')
            .replace(/^\//, '')
            .replace(/^assets\/runtime\/sprites\//, '')
            .replace(/^runtime\/sprites\//, '')
            .replace(/^sprites\//, '');
        return normalizeRuntimeAssetUrl(`assets/runtime/sprites/${normalized}`);
    }

    function resolveAudioPath(path = '') {
        const normalized = String(path || '')
            .replace(/^\.\//, '')
            .replace(/^\.\.\//, '')
            .replace(/^\//, '')
            .replace(/^assets\/runtime\/audio\//, '')
            .replace(/^runtime\/audio\//, '')
            .replace(/^audio\//, '');
        return normalizeRuntimeAssetUrl(`assets/runtime/audio/${normalized}`);
    }

    function resolveFontPath(path = '') {
        const normalized = String(path || '')
            .replace(/^\.\//, '')
            .replace(/^\.\.\//, '')
            .replace(/^\//, '')
            .replace(/^assets\/fonts\//, '')
            .replace(/^fonts\//, '');
        return normalizeRuntimeAssetUrl(`assets/fonts/${normalized}`);
    }

    function patchSrcProperty(proto) {
        if (!proto) return;
        const desc = Object.getOwnPropertyDescriptor(proto, 'src');
        if (!desc || typeof desc.set !== 'function' || desc.set.__runtimeAssetPatched) return;
        const originalSet = desc.set;
        const originalGet = desc.get;
        function patchedSet(nextValue) {
            return originalSet.call(this, normalizeRuntimeAssetUrl(nextValue));
        }
        patchedSet.__runtimeAssetPatched = true;
        Object.defineProperty(proto, 'src', {
            configurable: true,
            enumerable: desc.enumerable,
            get: function getPatchedSrc() {
                return originalGet ? originalGet.call(this) : '';
            },
            set: patchedSet
        });
    }

    function patchSetAttribute() {
        const proto = global.Element && global.Element.prototype;
        if (!proto || proto.setAttribute.__runtimeAssetPatched) return;
        const original = proto.setAttribute;
        proto.setAttribute = function patchedSetAttribute(name, value) {
            if (typeof name === 'string' && /^(src|href)$/i.test(name)) {
                return original.call(this, name, normalizeRuntimeAssetUrl(value));
            }
            return original.call(this, name, value);
        };
        proto.setAttribute.__runtimeAssetPatched = true;
    }

    function patchFetch() {
        if (typeof global.fetch !== 'function' || global.fetch.__runtimeAssetPatched) return;
        const originalFetch = global.fetch.bind(global);
        const patchedFetch = function(input, init) {
            if (typeof input === 'string') {
                return originalFetch(normalizeRuntimeAssetUrl(input), init);
            }
            if (input && typeof Request !== 'undefined' && input instanceof Request) {
                const nextUrl = normalizeRuntimeAssetUrl(input.url);
                if (nextUrl !== input.url) {
                    input = new Request(nextUrl, input);
                }
            }
            return originalFetch(input, init);
        };
        patchedFetch.__runtimeAssetPatched = true;
        global.fetch = patchedFetch;
    }

    function setRootCssVars() {
        const root = global.document?.documentElement;
        if (!root || !root.style) return;
        const sprite = (p) => `url('${normalizeRuntimeAssetUrl(`assets/runtime/sprites/${p}`)}')`;
        root.style.setProperty('--asset-ui-panel', sprite('ui/ui_panel_9slice.png?v=parasite1'));
        root.style.setProperty('--asset-ui-btn', sprite('ui/ui_button_normal.png?v=parasite1'));
        root.style.setProperty('--asset-ui-btn-hover', sprite('ui/ui_button_hover.png?v=parasite1'));
        root.style.setProperty('--asset-ui-btn-pressed', sprite('ui/ui_button_pressed.png?v=parasite1'));
        root.style.setProperty('--asset-ui-slot-item', sprite('ui/ui_slot_item.png?v=parasite1'));
        root.style.setProperty('--asset-ui-slot-weapon', sprite('ui/ui_slot_weapon.png?v=parasite1'));
        root.style.setProperty('--asset-ui-slot-passive', sprite('ui/ui_slot_passive.png?v=parasite1'));
        root.style.setProperty('--asset-bg-cavern', sprite('ui/bg_parasite_cavern.png?v=parasite1'));
        root.style.setProperty('--hud-floor-texture-floor1', sprite('tiles/floors/layer1_floor_mycelium.png'));
        root.style.setProperty('--hud-floor-texture-floor2', sprite('tiles/floors/layer2_floor_greenhouse.png'));
        root.style.setProperty('--hud-floor-texture-floor3', sprite('tiles/floors/layer3_floor_nerve.png'));
        root.style.setProperty('--hud-floor-texture-floor4', sprite('tiles/floors/layer4_floor_furnace.png'));
        root.style.setProperty('--hud-floor-texture-floor5', sprite('tiles/floors/layer5_floor_courtyard.png'));
    }

    const api = {
        mode,
        runtimeBase,
        strictLocal: true,
        spriteBase: runtimeBase + 'sprites/',
        audioBase: runtimeBase + 'audio/',
        fontBase: runtimeBase.replace(/runtime\/$/, 'fonts/'),
        resolve: resolveAssetPath,
        resolveSprite: resolveSpritePath,
        resolveAudio: resolveAudioPath,
        resolveFont: resolveFontPath,
        applyCssOverrides: setRootCssVars,
        diagnostics() {
            return {
                mode,
                runtimeBase,
                strictLocal: true,
                legacyRemoteBase: LEGACY_REMOTE_RUNTIME_BASE
            };
        }
    };

    global.RuntimeAssetBase = api;
    global.resolveRuntimeAssetUrl = api.resolve;
    patchSrcProperty(global.HTMLImageElement && global.HTMLImageElement.prototype);
    patchSrcProperty(global.HTMLAudioElement && global.HTMLAudioElement.prototype);
    patchSrcProperty(global.HTMLSourceElement && global.HTMLSourceElement.prototype);
    patchSetAttribute();
    patchFetch();
    setRootCssVars();
    global.document?.documentElement?.setAttribute?.('data-runtime-asset-mode', mode);
    global.document?.documentElement?.setAttribute?.('data-runtime-asset-base', runtimeBase);
    global.document?.addEventListener?.('DOMContentLoaded', () => {
        setRootCssVars();
        global.document?.documentElement?.setAttribute?.('data-runtime-asset-mode', mode);
        global.document?.documentElement?.setAttribute?.('data-runtime-asset-base', runtimeBase);
    }, { once: true });
})(window);
