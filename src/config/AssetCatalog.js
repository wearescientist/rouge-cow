/**
 * 常用资源路径目录
 * 先覆盖高频 UI / HUD / 菜单资源，后续逐步扩展
 */
(function attachAssetCatalog(global) {
    'use strict';

    const AssetCatalog = Object.freeze({
        ui: Object.freeze({
            panel9Slice: 'assets/sprites/ui/ui_panel_9slice.png?v=parasite1',
            buttonNormal: 'assets/sprites/ui/ui_button_normal.png?v=parasite1',
            buttonHover: 'assets/sprites/ui/ui_button_hover.png?v=parasite1',
            buttonPressed: 'assets/sprites/ui/ui_button_pressed.png?v=parasite1',
            slotItem: 'assets/sprites/ui/ui_slot_item.png?v=parasite1',
            slotWeapon: 'assets/sprites/ui/ui_slot_weapon.png?v=parasite1',
            slotPassive: 'assets/sprites/ui/ui_slot_passive.png?v=parasite1',
            backgroundCavern: 'assets/sprites/ui/bg_parasite_cavern.png?v=parasite1'
        }),
        floorTextures: Object.freeze({
            mycelium: 'assets/sprites/tiles/floors/layer1_floor_mycelium.png',
            greenhouse: 'assets/sprites/tiles/floors/layer2_floor_greenhouse.png'
        })
    });

    global.AssetCatalog = AssetCatalog;
})(window);
