(function attachCameraShakeProfiles(global) {
    'use strict';

    const SHAKE_PROFILES = Object.freeze({
        light: Object.freeze({ amount: 3, duration: 0.14, decay: 0.9 }),
        medium: Object.freeze({ amount: 6, duration: 0.22, decay: 0.88 }),
        heavy: Object.freeze({ amount: 10, duration: 0.3, decay: 0.85 })
    });

    function getCameraShakeProfile(name) {
        if (!name) return null;
        const key = String(name).toLowerCase();
        const profile = SHAKE_PROFILES[key];
        return profile ? { ...profile } : null;
    }

    global.CAMERA_SHAKE_PROFILES = SHAKE_PROFILES;
    global.getCameraShakeProfile = getCameraShakeProfile;
})(typeof window !== 'undefined' ? window : globalThis);
