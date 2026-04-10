(function attachBossPresentationConfig(global) {
    'use strict';

    const DEFAULT_INTRO_SPOTLIGHT = Object.freeze({
        radius: 260,
        intensity: 1.65,
        color: '#ff6b5e',
        duration: 1.4,
        pulseSpeed: 3.2
    });

    const FLOOR_INTRO_SPOTLIGHT = Object.freeze({
        2: Object.freeze({ radius: 240, intensity: 1.48, color: '#ff8468', duration: 1.2, pulseSpeed: 2.6 }),
        3: Object.freeze({ radius: 246, intensity: 1.56, color: '#ff7b78', duration: 1.25, pulseSpeed: 2.8 }),
        4: Object.freeze({ radius: 252, intensity: 1.62, color: '#ff735c', duration: 1.3, pulseSpeed: 3.0 }),
        5: Object.freeze({ radius: 262, intensity: 1.70, color: '#ff5f66', duration: 1.35, pulseSpeed: 3.2 }),
        6: Object.freeze({ radius: 276, intensity: 1.78, color: '#f79f3f', duration: 1.5, pulseSpeed: 2.2 }),
        7: Object.freeze({ radius: 296, intensity: 1.92, color: '#ff4f7b', duration: 1.65, pulseSpeed: 3.5 })
    });

    const DEFAULT_INTRO_CINEMATIC = Object.freeze({
        shake: Object.freeze({ profile: 'heavy', amount: 12, duration: 0.28 }),
        zoom: Object.freeze({ amount: 0.05, duration: 0.34 }),
        beat: Object.freeze({ bar: 0.1, durationMs: 460, slowScale: 0.78, slowMs: 180, tag: 'boss_intro' })
    });

    const FLOOR_INTRO_CINEMATIC = Object.freeze({
        2: Object.freeze({ shake: { profile: 'medium', amount: 10, duration: 0.26 }, zoom: { amount: 0.044, duration: 0.32 } }),
        3: Object.freeze({ shake: { profile: 'medium', amount: 11, duration: 0.27 }, zoom: { amount: 0.046, duration: 0.33 } }),
        4: Object.freeze({ shake: { profile: 'medium', amount: 11, duration: 0.28 }, zoom: { amount: 0.048, duration: 0.34 } }),
        5: Object.freeze({ shake: { profile: 'heavy', amount: 12, duration: 0.29 }, zoom: { amount: 0.05, duration: 0.36 } }),
        6: Object.freeze({ shake: { profile: 'heavy', amount: 13, duration: 0.31 }, zoom: { amount: 0.054, duration: 0.38 } }),
        7: Object.freeze({ shake: { profile: 'heavy', amount: 14, duration: 0.33 }, zoom: { amount: 0.058, duration: 0.4 } })
    });

    const DEFAULT_PHASE_TRANSITION = Object.freeze({
        shake: Object.freeze({ profile: 'medium', amount: 10, duration: 0.28 }),
        zoom: Object.freeze({ amount: 0.045, duration: 0.3 }),
        spotlight: Object.freeze({ radius: 196, intensity: 1.32, color: '#ff7a66', duration: 0.62, pulseSpeed: 6.0 }),
        beat: Object.freeze({ bar: 0.085, durationMs: 420, slowScale: 0.8, slowMs: 160, tag: 'boss_phase_transition' })
    });

    const PHASE_TRANSITION_BY_PHASE = Object.freeze({
        2: Object.freeze({
            shake: Object.freeze({ profile: 'medium', amount: 10, duration: 0.28 }),
            zoom: Object.freeze({ amount: 0.046, duration: 0.32 }),
            spotlight: Object.freeze({ radius: 204, intensity: 1.36, color: '#ff9f5f', duration: 0.68, pulseSpeed: 6.1 })
        }),
        3: Object.freeze({
            shake: Object.freeze({ profile: 'heavy', amount: 12, duration: 0.34 }),
            zoom: Object.freeze({ amount: 0.056, duration: 0.36 }),
            spotlight: Object.freeze({ radius: 228, intensity: 1.52, color: '#ff4f7b', duration: 0.82, pulseSpeed: 6.5 }),
            beat: Object.freeze({ bar: 0.11, durationMs: 520, slowScale: 0.75, slowMs: 220, tag: 'boss_phase_transition' })
        })
    });

    const FLOOR_PHASE_TRANSITION_OVERRIDES = Object.freeze({
        7: Object.freeze({
            2: Object.freeze({ spotlight: { radius: 232, intensity: 1.5, color: '#ff86a8', duration: 0.82 } }),
            3: Object.freeze({
                shake: { profile: 'heavy', amount: 14, duration: 0.38 },
                zoom: { amount: 0.062, duration: 0.4 },
                spotlight: { radius: 258, intensity: 1.7, color: '#ff4f9f', duration: 0.92 },
                beat: { bar: 0.12, durationMs: 580, slowScale: 0.72, slowMs: 260, tag: 'boss_phase_transition' }
            })
        })
    });

    const SLOW_MOTION_WHITELIST = Object.freeze([
        'boss_intro',
        'boss_phase_transition',
        'boss_phase_execute'
    ]);

    function getBossIntroSpotlightConfig(floorNum) {
        const floor = Math.max(1, Math.min(7, Number(floorNum) || 1));
        const floorCfg = FLOOR_INTRO_SPOTLIGHT[floor] || null;
        return floorCfg ? { ...DEFAULT_INTRO_SPOTLIGHT, ...floorCfg } : { ...DEFAULT_INTRO_SPOTLIGHT };
    }

    function deepMerge(base, override) {
        if (!override || typeof override !== 'object') return { ...base };
        const output = { ...base };
        for (const key of Object.keys(override)) {
            const baseVal = base ? base[key] : undefined;
            const nextVal = override[key];
            if (nextVal && typeof nextVal === 'object' && !Array.isArray(nextVal)) {
                output[key] = deepMerge(baseVal && typeof baseVal === 'object' ? baseVal : {}, nextVal);
            } else {
                output[key] = nextVal;
            }
        }
        return output;
    }

    function getBossIntroCinematicConfig(floorNum) {
        const floor = Math.max(1, Math.min(7, Number(floorNum) || 1));
        const floorOverride = FLOOR_INTRO_CINEMATIC[floor] || null;
        const spotlight = getBossIntroSpotlightConfig(floor);
        const cinematic = floorOverride ? deepMerge(DEFAULT_INTRO_CINEMATIC, floorOverride) : { ...DEFAULT_INTRO_CINEMATIC };
        return {
            ...cinematic,
            spotlight
        };
    }

    function getBossPhaseTransitionConfig(floorNum, toPhase) {
        const floor = Math.max(1, Math.min(7, Number(floorNum) || 1));
        const phase = Math.max(1, Math.min(3, Number(toPhase) || 1));
        const phaseTemplate = PHASE_TRANSITION_BY_PHASE[phase] || {};
        const floorPhase = FLOOR_PHASE_TRANSITION_OVERRIDES[floor]?.[phase] || null;
        const merged = deepMerge(DEFAULT_PHASE_TRANSITION, phaseTemplate);
        return floorPhase ? deepMerge(merged, floorPhase) : merged;
    }

    global.BOSS_PRESENTATION_CONFIG = Object.freeze({
        defaultIntroSpotlight: DEFAULT_INTRO_SPOTLIGHT,
        floorIntroSpotlight: FLOOR_INTRO_SPOTLIGHT,
        defaultIntroCinematic: DEFAULT_INTRO_CINEMATIC,
        floorIntroCinematic: FLOOR_INTRO_CINEMATIC,
        defaultPhaseTransition: DEFAULT_PHASE_TRANSITION,
        phaseTransitionByPhase: PHASE_TRANSITION_BY_PHASE,
        floorPhaseTransitionOverrides: FLOOR_PHASE_TRANSITION_OVERRIDES,
        slowMotionWhitelist: SLOW_MOTION_WHITELIST
    });
    global.getBossIntroSpotlightConfig = getBossIntroSpotlightConfig;
    global.getBossIntroCinematicConfig = getBossIntroCinematicConfig;
    global.getBossPhaseTransitionConfig = getBossPhaseTransitionConfig;
})(typeof window !== 'undefined' ? window : globalThis);
