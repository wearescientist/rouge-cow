/**
 * 常用资源路径目录
 * 先覆盖高频 UI / HUD / 菜单资源，后续逐步扩展
 */
(function attachAssetCatalog(global) {
    'use strict';

    const AssetCatalog = Object.freeze({
        ui: Object.freeze({
            panel9Slice: 'assets/runtime/sprites/ui/ui_panel_9slice.png?v=parasite1',
            buttonNormal: 'assets/runtime/sprites/ui/ui_button_normal.png?v=parasite1',
            buttonHover: 'assets/runtime/sprites/ui/ui_button_hover.png?v=parasite1',
            buttonPressed: 'assets/runtime/sprites/ui/ui_button_pressed.png?v=parasite1',
            slotItem: 'assets/runtime/sprites/ui/ui_slot_item.png?v=parasite1',
            slotWeapon: 'assets/runtime/sprites/ui/ui_slot_weapon.png?v=parasite1',
            slotPassive: 'assets/runtime/sprites/ui/ui_slot_passive.png?v=parasite1',
            backgroundCavern: 'assets/runtime/sprites/ui/bg_parasite_cavern.png?v=parasite1'
        }),
        floorTextures: Object.freeze({
            mycelium: 'assets/runtime/sprites/tiles/floors/layer1_floor_mycelium.png',
            greenhouse: 'assets/runtime/sprites/tiles/floors/layer2_floor_greenhouse.png'
        })
    });

    global.AssetCatalog = AssetCatalog;
})(window);
