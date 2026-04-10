(function attachAudioMixingConfig(global) {
    'use strict';

    const AUDIO_MIXING_CONFIG = Object.freeze({
        buses: Object.freeze({
            weapon: Object.freeze({ targetDb: -12, gain: 0.78, compression: 0.7 }),
            hit: Object.freeze({ targetDb: -8, gain: 0.9, compression: 0.8 }),
            ui: Object.freeze({ targetDb: -18, gain: 0.64, compression: 0.5 }),
            ambience: Object.freeze({ targetDb: -16, gain: 0.7, compression: 0.45 })
        }),
        profiles: Object.freeze({
            immersive: Object.freeze({ weapon: 0.88, hit: 1.0, ui: 0.7, ambience: 0.82 }),
            standard: Object.freeze({ weapon: 0.78, hit: 0.9, ui: 0.64, ambience: 0.7 }),
            quiet: Object.freeze({ weapon: 0.62, hit: 0.76, ui: 0.56, ambience: 0.52 })
        }),
        criticalOnlyBusScale: Object.freeze({
            weapon: 0.52,
            hit: 0.72,
            ui: 0.76,
            ambience: 0.48
        })
    });

    const WEAPON_SFX_CONFIG = Object.freeze({
        muteWhitelist: Object.freeze([
            'whip',
            'blood_whip',
            'heaven_sword'
        ])
    });

    const HIT_MATERIAL_CONFIG = Object.freeze({
        defaultMaterial: 'flesh',
        exactMap: Object.freeze({
            'snail': 'shell',
            'crab': 'shell',
            'turtle': 'shell',
            'skeleton': 'bone',
            'mimic': 'bone',
            'bat': 'bird',
            'bee': 'bird',
            'goose': 'bird',
            'fox': 'fur',
            'rabbit': 'fur',
            'panther': 'fur',
            'bear': 'fur',
            'ghost': 'slime',
            'snake': 'slime',
            'worm': 'slime',
            'mother': 'slime'
        }),
        regexMap: Object.freeze([
            Object.freeze({ pattern: '(snail|crab|nibei|turtle|shell)', material: 'shell' }),
            Object.freeze({ pattern: '(pigeon|bat|bee|goose|bird)', material: 'bird' }),
            Object.freeze({ pattern: '(fox|rabbit|panther|bear|fur)', material: 'fur' }),
            Object.freeze({ pattern: '(ghost|snake|mother|slime|worm)', material: 'slime' }),
            Object.freeze({ pattern: '(mimic|bone|skeleton)', material: 'bone' })
        ])
    });

    function resolveHitMaterial(key) {
        const normalized = String(key || '').toLowerCase();
        if (!normalized) return HIT_MATERIAL_CONFIG.defaultMaterial;
        if (HIT_MATERIAL_CONFIG.exactMap[normalized]) return HIT_MATERIAL_CONFIG.exactMap[normalized];
        const exactEntry = Object.entries(HIT_MATERIAL_CONFIG.exactMap).find(([token]) => normalized.includes(token));
        if (exactEntry) return exactEntry[1];
        for (const rule of HIT_MATERIAL_CONFIG.regexMap) {
            try {
                if (new RegExp(rule.pattern).test(normalized)) return rule.material;
            } catch (_) {}
        }
        return HIT_MATERIAL_CONFIG.defaultMaterial;
    }

    global.AUDIO_MIXING_CONFIG = AUDIO_MIXING_CONFIG;
    global.WEAPON_SFX_CONFIG = WEAPON_SFX_CONFIG;
    global.HIT_MATERIAL_CONFIG = HIT_MATERIAL_CONFIG;
    global.resolveHitMaterial = resolveHitMaterial;
})(typeof window !== 'undefined' ? window : globalThis);
