/**
 * HD2DEffects 配置和工具
 */
const HD2DEffects = {
    version: '1.0.0',
    
    presets: {
        // 经典八方旅人风格
        octopath: {
            tiltShift: { focusRadius: 200, vignetteStrength: 0.4 },
            groundGlow: { coreAlpha: 0.3, radiusX: 30 },
            backlight: { alpha: 0.25, radius: 50 },
            shadow: { alpha: 0.4, radiusX: 14 },
            colorGrading: { warmth: 0.2, tintAlpha: 0.1 }
        },
        
        // 轻度效果（适合快速游戏）
        light: {
            tiltShift: { focusRadius: 250, vignetteStrength: 0.35, maxBlur: 5 },
            groundGlow: { coreAlpha: 0.25, radiusX: 28 },
            backlight: { alpha: 0.22, radius: 45 },
            shadow: { alpha: 0.35, radiusX: 12 },
            colorGrading: { warmth: 0.15, tintAlpha: 0.08 }
        },
        
        // 电影感（强效果）
        cinematic: {
            tiltShift: { focusRadius: 150, vignetteStrength: 0.5, maxBlur: 6 },
            groundGlow: { coreAlpha: 0.4, radiusX: 35 },
            backlight: { alpha: 0.35, radius: 60 },
            shadow: { alpha: 0.5, radiusX: 16, blur: 3 },
            colorGrading: { warmth: 0.25, tintAlpha: 0.15 }
        }
    }
};

if (typeof window !== 'undefined') window.HD2DEffects = HD2DEffects;
if (typeof module !== 'undefined') module.exports = HD2DEffects;
