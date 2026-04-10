(function attachRuntimeAssetManifest(global) {
    'use strict';

    const RuntimeAssetManifest = Object.freeze({
        preload: Object.freeze({
            effects: Object.freeze([
                'effect_hit_pierce',
                'effect_hit_slash',
                'effect_particle_blood',
                'effect_particle_glow',
                'effect_particle_smoke',
                'effect_particle_spark',
                'status_buff',
                'status_burn',
                'status_poison',
                'status_slow',
                'status_stun'
            ]),
            ui: Object.freeze([
                'ui_bar_exp_bg','ui_bar_exp_fill','ui_bar_hp_bg','ui_bar_hp_fill','ui_button_hover','ui_button_normal','ui_button_pressed','ui_heart_empty','ui_heart_full','ui_heart_gold','ui_heart_half','ui_icon_coin','ui_icon_gem','ui_icon_level','ui_icon_time','ui_minimap_current','ui_minimap_room','ui_minimap_secret','ui_minimap_visited','ui_panel_9slice','ui_slot_item','ui_slot_passive','ui_slot_weapon','ui_slot_weapon_active'
            ]),
            misc: Object.freeze([
                'chest_closed','chest_glowing','chest_open','deco_bone','deco_crystal','deco_egg','deco_mushroom','npc_healer','npc_shopkeeper','totem_attack','totem_defense','totem_speed'
            ])
        }),
        notes: Object.freeze({
            excludedEffects: '缺失资源先不预加载，降低404噪音；后续补图后再并回。'
        })
    });

    global.RuntimeAssetManifest = RuntimeAssetManifest;
})(window);
