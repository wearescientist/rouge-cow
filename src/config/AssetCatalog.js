/**
 * 常用资源路径目录
 * 先覆盖高频 UI / HUD / 菜单资源，后续逐步扩展
 */
(function attachAssetCatalog(global) {
    'use strict';

    const resolveSprite = (path) => global.RuntimeAssetBase?.resolveSprite?.(path) || path;
    const AssetCatalog = Object.freeze({
        ui: Object.freeze({
            panel9Slice: resolveSprite('ui/ui_panel_9slice.png?v=parasite1'),
            buttonNormal: resolveSprite('ui/ui_button_normal.png?v=parasite1'),
            buttonHover: resolveSprite('ui/ui_button_hover.png?v=parasite1'),
            buttonPressed: resolveSprite('ui/ui_button_pressed.png?v=parasite1'),
            slotItem: resolveSprite('ui/ui_slot_item.png?v=parasite1'),
            slotWeapon: resolveSprite('ui/ui_slot_weapon.png?v=parasite1'),
            slotPassive: resolveSprite('ui/ui_slot_passive.png?v=parasite1'),
            backgroundCavern: resolveSprite('ui/bg_parasite_cavern.png?v=parasite1')
        }),
        floorTextures: Object.freeze({
            mycelium: resolveSprite('tiles/floors/layer1_floor_mycelium.png'),
            greenhouse: resolveSprite('tiles/floors/layer2_floor_greenhouse.png')
        })
    });

    global.AssetCatalog = AssetCatalog;
})(window);
