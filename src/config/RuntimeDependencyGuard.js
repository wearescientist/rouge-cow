(function attachRuntimeDependencyGuard(global) {
    'use strict';

    const REQUIRED_GLOBALS = [
        'ITEMS',
        'PETS',
        'ENEMY_TYPES',
        'ROOM_TEMPLATES',
        'FLOOR_THEMES',
        'MAP_EVENTS'
    ];

    const REQUIRED_SCRIPT_PATHS = [
        'data/items/index.js',
        'data/pets/index.js',
        'data/enemies/index.js',
        'data/rarity_colors.js',
        'data/room_templates.js',
        'data/floor_themes.js',
        'data/map_events.js'
    ];

    function hasGlobal(name) {
        return typeof global[name] !== 'undefined' && global[name] !== null;
    }

    function normalizeScriptPath(src) {
        return String(src || '').replace(/^[./]+/, '').replace(/\?.*$/, '');
    }

    function collectRuntimeReport() {
        const loadedScriptSet = new Set(
            Array.from(document.querySelectorAll('script[src]')).map((node) => normalizeScriptPath(node.getAttribute('src')))
        );

        const missingGlobals = REQUIRED_GLOBALS.filter((name) => !hasGlobal(name));
        const missingScripts = REQUIRED_SCRIPT_PATHS.filter((path) => !loadedScriptSet.has(path));

        return {
            ok: missingGlobals.length === 0 && missingScripts.length === 0,
            missingGlobals,
            missingScripts
        };
    }

    function validateOrThrow() {
        const report = collectRuntimeReport();
        if (report.ok) return report;

        const detail = [
            report.missingGlobals.length ? `globals=${report.missingGlobals.join(',')}` : '',
            report.missingScripts.length ? `scripts=${report.missingScripts.join(',')}` : ''
        ].filter(Boolean).join(' | ');

        throw new Error(`[RuntimeDependencyGuard] missing runtime dependencies: ${detail}`);
    }

    global.RuntimeDependencyGuard = {
        REQUIRED_GLOBALS,
        REQUIRED_SCRIPT_PATHS,
        collectRuntimeReport,
        validateOrThrow
    };
})(window);
