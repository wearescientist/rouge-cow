(function attachWebpAssetManifest(global) {
    'use strict';

    const WEBP_ELIGIBLE = new Set([
        "assets/runtime/sprites/enemies/boss/6/boss_floor6_primary.png",
        "assets/runtime/sprites/weapons/generated/weapon_heaven_sword.png",
        "assets/runtime/sprites/enemies/boss/5/boss_floor5_primary.png",
        "assets/runtime/sprites/weapons/generated/weapon_bible.png",
        "assets/runtime/sprites/rooms/shells/floor7_shell_greenhouse_far7.png",
        "assets/runtime/sprites/rooms/backdrops/back_organic_primary.png",
        "assets/runtime/sprites/rooms/shells/floor1_shell_greenhouse_primary.png",
        "assets/runtime/sprites/rooms/shells/floor4_shell_furnace_mid.png",
        "assets/runtime/sprites/rooms/shells/floor7_shell_greenhouse_primary7.png",
        "assets/runtime/sprites/rooms/backdrops/back_organic_mid.png",
        "assets/runtime/sprites/rooms/shells/floor1_shell_greenhouse_mid.png",
        "assets/runtime/sprites/rooms/shells/floor6_shell_core_primary.png",
        "assets/runtime/sprites/rooms/shells/floor6_shell_core_mid.png",
        "assets/runtime/sprites/rooms/shells/floor4_shell_furnace_primary.png",
        "assets/runtime/sprites/weapons/generated/weapon_holy_wand.png",
        "assets/runtime/sprites/enemies/boss/4/boss_floor4_primary.png",
        "assets/runtime/sprites/rooms/shells/floor2_shell_greenhouse_primary.png",
        "assets/runtime/sprites/rooms/backdrops/back_organic_far.png",
        "assets/runtime/sprites/rooms/shells/floor1_shell_greenhouse_far.png",
        "assets/runtime/sprites/weapons/generated/weapon_shuriken.png",
        "assets/runtime/sprites/rooms/shells/floor7_shell_greenhouse_mid7.png",
        "assets/runtime/sprites/weapons/generated/weapon_wand.png",
        "assets/runtime/sprites/rooms/shells/floor3_shell_nerve_mid.png",
        "assets/runtime/sprites/rooms/shells/floor6_shell_core_far.png",
        "assets/runtime/sprites/rooms/shells/floor2_shell_greenhouse_mid.png",
        "assets/runtime/sprites/story/start3.png",
        "assets/runtime/sprites/rooms/shells/floor3_shell_nerve_primary.png",
        "assets/runtime/sprites/rooms/shells/floor4_shell_furnace_far.png",
        "assets/runtime/sprites/story/start4.png",
        "assets/runtime/sprites/rooms/shells/floor3_shell_nerve_far.png",
        "assets/runtime/sprites/story/start1.png",
        "assets/runtime/sprites/ui/ChatGPT Image.png",
        "assets/runtime/sprites/rooms/shells/floor5_shell_courtyard_far.png",
        "assets/runtime/sprites/rooms/shells/floor5_shell_courtyard_primary.png",
        "assets/runtime/sprites/rooms/shells/floor5_shell_courtyard_mid.png",
        "assets/runtime/sprites/ui/ChatGPT Image2.png",
        "assets/runtime/sprites/story/start2.png",
        "assets/runtime/sprites/rooms/shells/floor2_shell_greenhouse_far.png",
        "assets/runtime/sprites/weapons/generated/weapon_cross.png",
        "assets/runtime/sprites/weapons/generated/weapon_hellfire.png",
        "assets/runtime/sprites/tiles/floors/layer6_floor_core.png",
        "assets/runtime/sprites/weapons/generated/weapon_ninja_storm.png"
    ]);

    function normalize(input) {
        if (typeof input !== 'string' || input.length <= 0) return '';
        let value = input;
        const queryIndex = value.indexOf('?');
        if (queryIndex >= 0) value = value.slice(0, queryIndex);
        value = value.replace(/\\/g, '/').replace(/^\.\//, '').replace(/^\/+/, '');
        const assetIndex = value.indexOf('assets/runtime/');
        if (assetIndex >= 0) value = value.slice(assetIndex);
        return value;
    }

    const WebpAssetManifest = Object.freeze({
        has(pathOrUrl) {
            return WEBP_ELIGIBLE.has(normalize(pathOrUrl));
        },
        list() {
            return Array.from(WEBP_ELIGIBLE.values());
        }
    });

    global.WebpAssetManifest = WebpAssetManifest;
})(window);
