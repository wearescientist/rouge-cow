(function () {
    'use strict';

    const SPRITES = {};
    const CODE_STYLES = [];
    const SCENE_LABELS = {};
    const SPRITE_MODE_LABELS = {};
    const TOOL_LABELS = {};
    const SCENE_DEFAULTS = {};
    const PRESETS = {};

    const el = {};
    const state = {
        currentKey: 'whip',
        configs: {},
        previewUrls: new Map(),
        previewMeta: new Map(),
        spriteCache: new Map(),
        spriteImage: null,
        spriteError: '',
        loadedSpriteSource: '',
        pointerDown: false,
        draggingTarget: false,
        panningView: false,
        panStart: null,
        dragStart: null,
        spacePressed: false,
        dragMode: '',
        toolMode: 'auto',
        showAdvanced: false,
        activeWeaponHandle: null,
        lastSeconds: 0,
        view: { zoom: 1, offsetX: 0, offsetY: 0 },
        startTime: performance.now()
    };

    let ctx = null;
    const spriteBoundsCache = new WeakMap();

    function clone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function degToRad(deg) {
        return deg * Math.PI / 180;
    }

    function radToDeg(rad) {
        return rad * 180 / Math.PI;
    }

    function numeric(value, fallback) {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : fallback;
    }

    function normalizePath(rawPath) {
        const value = (rawPath || '').trim();
        if (!value) return '';
        if (/^(blob:|data:|https?:|file:|\.{0,2}\/|\/)/i.test(value)) return value;
        if (/^[a-zA-Z]:[\\/]/.test(value)) return 'file:///' + value.replace(/\\/g, '/');
        return value.replace(/\\/g, '/');
    }

    function sprite(key) {
        return key ? (SPRITES[key] || '') : '';
    }

    function preset(group, label, scene, options) {
        const base = clone(SCENE_DEFAULTS[scene]);
        const builtinSpritePath = options.builtinSpritePath || sprite(options.builtinSpriteKey);
        return {
            group,
            label,
            scene,
            builtinSpritePath,
            spritePath: Object.prototype.hasOwnProperty.call(options, 'spritePath')
                ? options.spritePath
                : builtinSpritePath,
            ...base,
            ...options,
            builtinSpritePath
        };
    }

    function clonePresets() {
        return clone(PRESETS);
    }

    function currentConfig() {
        return state.configs[state.currentKey];
    }

    function setStatus(node, text, type) {
        node.textContent = text;
        node.className = 'status' + (type ? ' ' + type : '');
    }

    function updateAdvancedPanels() {
        el.advancedPanels.forEach(function (panel) {
            panel.classList.toggle('hidden', !state.showAdvanced);
        });
        el.toggleAdvancedBtn.textContent = state.showAdvanced ? '隐藏高级参数' : '显示高级参数';
        if (state.configs[state.currentKey]) updateFieldVisibility(currentConfig().scene);
    }

    function updateToolButtons() {
        el.toolButtons.forEach(function (button) {
            button.classList.toggle('is-active', button.dataset.tool === state.toolMode);
        });
    }

    function getSourceLabel(cfg) {
        if (state.previewUrls.has(state.currentKey)) {
            const meta = state.previewMeta.get(state.currentKey);
            return '当前生效来源：本地文件预览 ' + (meta ? meta.name : '未命名文件');
        }
        if (cfg.spritePath) return '当前生效来源：路径 ' + cfg.spritePath;
        return '当前生效来源：未加载';
    }

    function updateActiveSpriteInfo() {
        el.activeSpriteInfo.textContent = getSourceLabel(currentConfig());
    }

    function rotatePoint(x, y, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        return { x: x * cos - y * sin, y: x * sin + y * cos };
    }

    function inverseRotatePoint(x, y, angle) {
        return rotatePoint(x, y, -angle);
    }

    function initDomRefs() {
        el.weaponSelect = document.getElementById('weaponSelect');
        el.sceneSelect = document.getElementById('sceneSelect');
        el.renderModeSelect = document.getElementById('renderModeSelect');
        el.codeStyleSelect = document.getElementById('codeStyleSelect');
        el.spritePathInput = document.getElementById('spritePathInput');
        el.spriteFileInput = document.getElementById('spriteFileInput');
        el.useBuiltinBtn = document.getElementById('useBuiltinBtn');
        el.clearSpriteBtn = document.getElementById('clearSpriteBtn');
        el.activeSpriteInfo = document.getElementById('activeSpriteInfo');
        el.toggleAdvancedBtn = document.getElementById('toggleAdvancedBtn');
        el.imageStatus = document.getElementById('imageStatus');
        el.sizeInput = document.getElementById('sizeInput');
        el.rotationInput = document.getElementById('rotationInput');
        el.spinSpeedInput = document.getElementById('spinSpeedInput');
        el.progressInput = document.getElementById('progressInput');
        el.anchorXInput = document.getElementById('anchorXInput');
        el.anchorYInput = document.getElementById('anchorYInput');
        el.offsetXInput = document.getElementById('offsetXInput');
        el.offsetYInput = document.getElementById('offsetYInput');
        el.trimInput = document.getElementById('trimInput');
        el.flipXInput = document.getElementById('flipXInput');
        el.animateInput = document.getElementById('animateInput');
        el.referenceInput = document.getElementById('referenceInput');
        el.anchorInput = document.getElementById('anchorInput');
        el.hitboxInput = document.getElementById('hitboxInput');
        el.targetXInput = document.getElementById('targetXInput');
        el.targetYInput = document.getElementById('targetYInput');
        el.targetSizeInput = document.getElementById('targetSizeInput');
        el.sceneZoomInput = document.getElementById('sceneZoomInput');
        el.rangeInput = document.getElementById('rangeInput');
        el.aimOffsetInput = document.getElementById('aimOffsetInput');
        el.arcAngleInput = document.getElementById('arcAngleInput');
        el.handDistanceInput = document.getElementById('handDistanceInput');
        el.handLiftInput = document.getElementById('handLiftInput');
        el.reachMultiplierInput = document.getElementById('reachMultiplierInput');
        el.countInput = document.getElementById('countInput');
        el.spreadInput = document.getElementById('spreadInput');
        el.projectileCountInput = document.getElementById('projectileCountInput');
        el.projectileSpreadInput = document.getElementById('projectileSpreadInput');
        el.travelDistanceInput = document.getElementById('travelDistanceInput');
        el.curvedSelect = document.getElementById('curvedSelect');
        el.orbitRadiusInput = document.getElementById('orbitRadiusInput');
        el.orbitSpeedInput = document.getElementById('orbitSpeedInput');
        el.beamWidthInput = document.getElementById('beamWidthInput');
        el.throwArcInput = document.getElementById('throwArcInput');
        el.meleeGroup = document.getElementById('meleeGroup');
        el.projectileGroup = document.getElementById('projectileGroup');
        el.specialGroup = document.getElementById('specialGroup');
        el.resetCurrentBtn = document.getElementById('resetCurrentBtn');
        el.resetAllBtn = document.getElementById('resetAllBtn');
        el.exportOutput = document.getElementById('exportOutput');
        el.exportCurrentBtn = document.getElementById('exportCurrentBtn');
        el.exportAllBtn = document.getElementById('exportAllBtn');
        el.copyBtn = document.getElementById('copyBtn');
        el.toolModeRow = document.getElementById('toolModeRow');
        el.toolButtons = Array.from(document.querySelectorAll('[data-tool]'));
        el.advancedPanels = Array.from(document.querySelectorAll('.advanced-panel'));
        el.summary = document.getElementById('summary');
        el.targetStatus = document.getElementById('targetStatus');
        el.footerInfo = document.getElementById('footerInfo');
        el.canvas = document.getElementById('previewCanvas');
        ctx = el.canvas.getContext('2d');
    }

    function setupConstants() {
        Object.assign(SPRITES, {
            weapon_whip: '../assets/sprites/weapons/weapon_whip.png',
            weapon_scythe: '../assets/sprites/weapons/weapon_scythe.png',
            weapon_wand: '../assets/sprites/weapons/weapon_wand.png',
            weapon_knife: '../assets/sprites/weapons/weapon_knife.png',
            weapon_axe: '../assets/sprites/weapons/weapon_axe.png',
            weapon_bible: '../assets/sprites/weapons/weapon_bible.png',
            weapon_fireball: '../assets/sprites/weapons/weapon_fireball.png',
            weapon_lightning: '../assets/sprites/weapons/weapon_lightning.png',
            weapon_holywater: '../assets/sprites/weapons/weapon_holywater.png',
            bullet_arrow: '../assets/sprites/effects/bullet_arrow.png',
            bullet_fireball: '../assets/sprites/effects/bullet_fireball.png',
            bullet_ice: '../assets/sprites/effects/bullet_ice.png',
            bullet_lightning: '../assets/sprites/effects/bullet_lightning.png',
            effect_particle_glow: '../assets/sprites/effects/effect_particle_glow.png'
        });
        if (typeof window !== 'undefined' && window.WEAPON_DEBUG_SPRITES) {
            Object.assign(SPRITES, window.WEAPON_DEBUG_SPRITES);
        }

        CODE_STYLES.push(
            ['none', '无代码样式'],
            ['knife_throw', '飞刀'],
            ['axe_spin', '旋斧'],
            ['shuriken', '手里剑'],
            ['cross_bounce', '十字架'],
            ['fireball', '火球'],
            ['magic_orb', '魔杖光球'],
            ['poison_dart', '毒镖'],
            ['icicle', '冰锥'],
            ['orbit_bible', '圣经环绕'],
            ['holy_water_pool', '圣水落地池'],
            ['radiance', '辉耀领域'],
            ['laser_beam', '激光束'],
            ['instant_chain', '闪电链']
        );

        Object.assign(SCENE_LABELS, {
            melee: '近战',
            projectile: '投射',
            orbit: '环绕',
            area: '落地区域',
            aura: '光环',
            laser: '激光',
            instant: '瞬发链击'
        });

        Object.assign(SPRITE_MODE_LABELS, {
            auto: '自动',
            sprite: '仅贴图',
            code: '仅代码',
            both: '代码 + 贴图'
        });

        Object.assign(TOOL_LABELS, {
            auto: '自动',
            target: '目标',
            move: '拖武器',
            anchor: '锚点',
            rotate: '旋转',
            scale: '缩放'
        });

        Object.assign(SCENE_DEFAULTS, {
            melee: { renderMode: 'sprite', codeStyle: 'none', trimTransparent: true, flipX: false, size: 120, rotationDeg: 0, spinSpeedDeg: 0, anchorX: 0.5, anchorY: 0.5, offsetX: 0, offsetY: 0, range: 320, arcAngle: 100, aimOffsetDeg: 0, handDistance: 14, handLift: 10, reachMultiplier: 0.34, count: 1, spreadDeg: 0, travelDistance: 320, orbitRadius: 320, orbitSpeedDeg: 220, beamWidth: 14, throwArc: 60, targetX: 220, targetY: -120, targetSize: 50, previewProgress: 0.58, sceneZoom: 1, animate: true, showReference: true, showAnchor: true, showHitbox: true, curved: false },
            projectile: { renderMode: 'code', codeStyle: 'knife_throw', trimTransparent: true, flipX: false, size: 28, rotationDeg: 0, spinSpeedDeg: 0, anchorX: 0.5, anchorY: 0.5, offsetX: 0, offsetY: 0, range: 420, arcAngle: 90, aimOffsetDeg: 0, handDistance: 14, handLift: 10, reachMultiplier: 0.34, count: 1, spreadDeg: 0, travelDistance: 420, orbitRadius: 320, orbitSpeedDeg: 220, beamWidth: 14, throwArc: 60, targetX: 300, targetY: -100, targetSize: 46, previewProgress: 0.7, sceneZoom: 1, animate: true, showReference: true, showAnchor: true, showHitbox: true, curved: false },
            orbit: { renderMode: 'code', codeStyle: 'orbit_bible', trimTransparent: true, flipX: false, size: 46, rotationDeg: 0, spinSpeedDeg: 420, anchorX: 0.5, anchorY: 0.5, offsetX: 0, offsetY: 0, range: 320, arcAngle: 90, aimOffsetDeg: 0, handDistance: 14, handLift: 10, reachMultiplier: 0.34, count: 7, spreadDeg: 0, travelDistance: 320, orbitRadius: 320, orbitSpeedDeg: 258, beamWidth: 14, throwArc: 60, targetX: 240, targetY: -100, targetSize: 48, previewProgress: 0.4, sceneZoom: 1, animate: true, showReference: true, showAnchor: true, showHitbox: true, curved: false },
            area: { renderMode: 'both', codeStyle: 'holy_water_pool', trimTransparent: true, flipX: false, size: 26, rotationDeg: 0, spinSpeedDeg: 360, anchorX: 0.5, anchorY: 0.5, offsetX: 0, offsetY: 0, range: 140, arcAngle: 90, aimOffsetDeg: 0, handDistance: 14, handLift: 10, reachMultiplier: 0.34, count: 3, spreadDeg: 24, travelDistance: 240, orbitRadius: 320, orbitSpeedDeg: 220, beamWidth: 14, throwArc: 72, targetX: 190, targetY: -120, targetSize: 48, previewProgress: 0.58, sceneZoom: 1, animate: true, showReference: true, showAnchor: true, showHitbox: true, curved: false },
            aura: { renderMode: 'code', codeStyle: 'radiance', trimTransparent: true, flipX: false, size: 0, rotationDeg: 0, spinSpeedDeg: 0, anchorX: 0.5, anchorY: 0.5, offsetX: 0, offsetY: 0, range: 280, arcAngle: 90, aimOffsetDeg: 0, handDistance: 14, handLift: 10, reachMultiplier: 0.34, count: 1, spreadDeg: 0, travelDistance: 280, orbitRadius: 320, orbitSpeedDeg: 220, beamWidth: 14, throwArc: 60, targetX: 220, targetY: -80, targetSize: 48, previewProgress: 0.5, sceneZoom: 1, animate: true, showReference: true, showAnchor: false, showHitbox: true, curved: false },
            laser: { renderMode: 'code', codeStyle: 'laser_beam', trimTransparent: true, flipX: false, size: 24, rotationDeg: 0, spinSpeedDeg: 0, anchorX: 0.5, anchorY: 0.5, offsetX: 0, offsetY: 0, range: 3000, arcAngle: 90, aimOffsetDeg: 0, handDistance: 14, handLift: 10, reachMultiplier: 0.34, count: 1, spreadDeg: 0, travelDistance: 3000, orbitRadius: 320, orbitSpeedDeg: 220, beamWidth: 14, throwArc: 60, targetX: 420, targetY: -40, targetSize: 52, previewProgress: 0.4, sceneZoom: 1, animate: true, showReference: true, showAnchor: false, showHitbox: true, curved: false },
            instant: { renderMode: 'code', codeStyle: 'instant_chain', trimTransparent: true, flipX: false, size: 24, rotationDeg: 0, spinSpeedDeg: 0, anchorX: 0.5, anchorY: 0.5, offsetX: 0, offsetY: 0, range: 680, arcAngle: 90, aimOffsetDeg: 0, handDistance: 14, handLift: 10, reachMultiplier: 0.34, count: 1, spreadDeg: 0, travelDistance: 680, orbitRadius: 320, orbitSpeedDeg: 220, beamWidth: 14, throwArc: 60, targetX: 340, targetY: -140, targetSize: 48, previewProgress: 0.5, sceneZoom: 0.95, animate: true, showReference: true, showAnchor: false, showHitbox: true, curved: false }
        });

        Object.assign(PRESETS, {
            whip: preset('基础武器', '圣剑', 'melee', { builtinSpriteKey: 'weapon_whip', size: 134, anchorX: 0.18, anchorY: 0.54, range: 336, arcAngle: 128, handDistance: 12, handLift: 12, reachMultiplier: 0.34, targetX: 220, targetY: -120, targetSize: 52 }),
            blood_whip: preset('超武', '圣裁之剑', 'melee', { builtinSpriteKey: 'weapon_whip', size: 148, anchorX: 0.18, anchorY: 0.54, range: 520, arcAngle: 230, handDistance: 14, handLift: 14, reachMultiplier: 0.34, count: 4, spreadDeg: 26, targetX: 260, targetY: -130, targetSize: 56, sceneZoom: 0.95 }),
            scythe: preset('基础武器', '镰刀', 'melee', { builtinSpriteKey: 'weapon_scythe', size: 148, anchorX: 0.3, anchorY: 0.58, range: 364, arcAngle: 110, handDistance: 14, handLift: 10, reachMultiplier: 0.38, targetX: 210, targetY: -145, targetSize: 54 }),
            death_scythe: preset('超武', '死神镰刀', 'melee', { builtinSpriteKey: 'weapon_scythe', size: 162, anchorX: 0.3, anchorY: 0.58, range: 560, arcAngle: 140, handDistance: 16, handLift: 12, reachMultiplier: 0.38, count: 5, spreadDeg: 34, targetX: 280, targetY: -160, targetSize: 56, sceneZoom: 0.9 }),
            wand: preset('基础武器', '魔杖', 'projectile', { builtinSpriteKey: 'weapon_wand', codeStyle: 'magic_orb', size: 22, range: 450, travelDistance: 450, targetX: 280, targetY: -120 }),
            holy_wand: preset('超武', '圣魔杖', 'projectile', { builtinSpriteKey: 'weapon_wand', codeStyle: 'magic_orb', size: 24, range: 600, count: 4, spreadDeg: 16, travelDistance: 600, targetX: 330, targetY: -120, sceneZoom: 0.95 }),
            knife: preset('基础武器', '飞刀', 'projectile', { builtinSpriteKey: 'weapon_knife', codeStyle: 'knife_throw', size: 28, range: 420, travelDistance: 420, targetX: 300, targetY: -80 }),
            thousand_blade: preset('超武', '千刃', 'projectile', { builtinSpriteKey: 'weapon_knife', codeStyle: 'knife_throw', size: 28, range: 560, count: 4, spreadDeg: 18, travelDistance: 560, targetX: 360, targetY: -90, sceneZoom: 0.94 }),
            axe: preset('基础武器', '斧头', 'projectile', { builtinSpriteKey: 'weapon_axe', renderMode: 'both', codeStyle: 'axe_spin', size: 56, spinSpeedDeg: 1260, range: 360, travelDistance: 360, targetX: 250, targetY: -100 }),
            death_spiral: preset('超武', '死亡螺旋', 'projectile', { builtinSpriteKey: 'weapon_axe', renderMode: 'both', codeStyle: 'axe_spin', size: 64, spinSpeedDeg: 1440, range: 450, count: 6, spreadDeg: 45, travelDistance: 450, targetX: 320, targetY: -90, sceneZoom: 0.95 }),
            cross: preset('基础武器', '十字架', 'projectile', { builtinSpriteKey: 'weapon_lightning', codeStyle: 'cross_bounce', size: 34, spinSpeedDeg: 344, range: 450, travelDistance: 450, targetX: 300, targetY: -120 }),
            heaven_sword: preset('超武', '天穹十字', 'projectile', { builtinSpriteKey: 'weapon_whip', renderMode: 'both', codeStyle: 'cross_bounce', size: 50, anchorX: 0.28, anchorY: 0.55, spinSpeedDeg: 360, range: 550, count: 4, spreadDeg: 18, travelDistance: 550, targetX: 350, targetY: -130, sceneZoom: 0.95 }),
            fireball: preset('基础武器', '火球', 'projectile', { builtinSpriteKey: 'weapon_fireball', renderMode: 'both', codeStyle: 'fireball', size: 42, range: 520, travelDistance: 520, targetX: 320, targetY: -120 }),
            hellfire: preset('超武', '地狱火', 'projectile', { builtinSpriteKey: 'weapon_fireball', renderMode: 'both', codeStyle: 'fireball', size: 58, range: 620, count: 6, spreadDeg: 48, travelDistance: 620, targetX: 360, targetY: -120, sceneZoom: 0.9 }),
            shuriken: preset('基础武器', '手里剑', 'projectile', { builtinSpriteKey: 'weapon_knife', codeStyle: 'shuriken', size: 34, spinSpeedDeg: 800, range: 400, count: 3, spreadDeg: 25, travelDistance: 400, targetX: 300, targetY: -95 }),
            ninja_storm: preset('超武', '忍者风暴', 'projectile', { builtinSpriteKey: 'weapon_knife', codeStyle: 'shuriken', size: 36, spinSpeedDeg: 950, range: 550, count: 12, spreadDeg: 90, travelDistance: 550, targetX: 360, targetY: -90, sceneZoom: 0.9 }),
            icicle: preset('基础武器', '冰锥', 'projectile', { builtinSpriteKey: 'bullet_ice', codeStyle: 'icicle', size: 40, range: 520, travelDistance: 520, targetX: 320, targetY: -110 }),
            blizzard: preset('超武', '暴风雪', 'projectile', { builtinSpriteKey: 'bullet_ice', codeStyle: 'icicle', size: 44, range: 650, count: 6, spreadDeg: 36, travelDistance: 650, targetX: 380, targetY: -100, sceneZoom: 0.9 }),
            poison_dart: preset('基础武器', '毒镖', 'projectile', { builtinSpriteKey: 'bullet_lightning', codeStyle: 'poison_dart', size: 28, range: 450, travelDistance: 450, targetX: 280, targetY: -115 }),
            toxic_strike: preset('超武', '剧毒打击', 'projectile', { builtinSpriteKey: 'bullet_lightning', codeStyle: 'poison_dart', size: 30, range: 600, count: 6, spreadDeg: 42, travelDistance: 600, targetX: 350, targetY: -120, sceneZoom: 0.9 }),
            bible: preset('基础武器', '圣经', 'orbit', { builtinSpriteKey: 'weapon_bible', size: 46, orbitRadius: 320, orbitSpeedDeg: 258, count: 7 }),
            unholy_vespers: preset('超武', '邪恶晚祷', 'orbit', { builtinSpriteKey: 'weapon_bible', size: 52, orbitRadius: 620, orbitSpeedDeg: 350, count: 14, sceneZoom: 0.86 }),
            lightning: preset('基础武器', '闪电', 'instant', { builtinSpriteKey: 'weapon_lightning', range: 680, travelDistance: 680, targetX: 340, targetY: -140 }),
            storm_arc: preset('超武', '风暴弧光', 'instant', { builtinSpriteKey: 'weapon_lightning', range: 920, count: 2, spreadDeg: 18, travelDistance: 920, targetX: 380, targetY: -140, sceneZoom: 0.86 }),
            holy_water: preset('基础武器', '圣水', 'area', { builtinSpriteKey: 'weapon_holywater', size: 26, range: 134, count: 3, spreadDeg: 30, travelDistance: 240, targetX: 190, targetY: -120 }),
            la_borra: preset('超武', '拉博拉', 'area', { builtinSpriteKey: 'weapon_holywater', size: 28, range: 220, spinSpeedDeg: 420, count: 7, spreadDeg: 60, travelDistance: 320, targetX: 220, targetY: -130, targetSize: 54, sceneZoom: 0.92 }),
            radiance: preset('基础武器', '辉耀', 'aura', { spritePath: '', builtinSpritePath: '', showAnchor: false, range: 280 }),
            solar_radiance: preset('超武', '日天辉耀', 'aura', { spritePath: '', builtinSpritePath: '', showAnchor: false, range: 620, sceneZoom: 0.9, targetSize: 54 }),
            laser: preset('基础武器', '激光', 'laser', { builtinSpriteKey: 'weapon_lightning', beamWidth: 14, range: 3000, travelDistance: 3000, targetX: 420, targetY: -40 }),
            prism_beam: preset('超武', '炽天使硫磺', 'laser', { builtinSpriteKey: 'weapon_lightning', beamWidth: 28, range: 3000, travelDistance: 3000, targetX: 420, targetY: -30, curved: true })
        });
        if (typeof window !== 'undefined' && window.WEAPON_VISUAL_DEBUG_PRESETS) {
            Object.keys(PRESETS).forEach(function (key) { delete PRESETS[key]; });
            Object.assign(PRESETS, clone(window.WEAPON_VISUAL_DEBUG_PRESETS));
        }
    }
    function codeStyleLabel(value) {
        const found = CODE_STYLES.find(function (item) { return item[0] === value; });
        return found ? found[1] : '无';
    }

    function updateFieldVisibility(scene) {
        el.meleeGroup.classList.toggle('hidden', !state.showAdvanced || scene !== 'melee');
        el.projectileGroup.classList.toggle('hidden', !state.showAdvanced || ['projectile', 'area', 'instant', 'laser'].indexOf(scene) === -1);
        el.specialGroup.classList.toggle('hidden', !state.showAdvanced || ['orbit', 'area', 'laser'].indexOf(scene) === -1);
    }

    function populateOptions() {
        el.codeStyleSelect.innerHTML = CODE_STYLES.map(function (item) {
            return '<option value="' + item[0] + '">' + item[1] + '</option>';
        }).join('');

        const groups = {};
        Object.keys(state.configs).forEach(function (key) {
            const cfg = state.configs[key];
            if (!groups[cfg.group]) groups[cfg.group] = [];
            groups[cfg.group].push({ key: key, label: cfg.label });
        });

        el.weaponSelect.innerHTML = Object.keys(groups).map(function (group) {
            const options = groups[group].map(function (item) {
                return '<option value="' + item.key + '">' + item.label + '</option>';
            }).join('');
            return '<optgroup label="' + group + '">' + options + '</optgroup>';
        }).join('');
    }
    function getEffectiveSpriteSource(cfg) {
        return state.previewUrls.get(state.currentKey) || normalizePath(cfg.spritePath);
    }

    function revokePreviewUrl(key) {
        const url = state.previewUrls.get(key);
        if (url && url.startsWith('blob:')) URL.revokeObjectURL(url);
        state.previewUrls.delete(key);
        state.previewMeta.delete(key);
        if (key === state.currentKey) state.loadedSpriteSource = '';
    }

    function getSpriteBounds(image) {
        if (!image) return null;
        const cached = spriteBoundsCache.get(image);
        if (cached) return cached;

        const width = image.naturalWidth || image.width || 0;
        const height = image.naturalHeight || image.height || 0;
        if (!width || !height) return null;

        let bounds = { x: 0, y: 0, width: width, height: height };
        try {
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const localCtx = canvas.getContext('2d', { willReadFrequently: true });
            localCtx.drawImage(image, 0, 0, width, height);
            const pixels = localCtx.getImageData(0, 0, width, height).data;
            let minX = width;
            let minY = height;
            let maxX = -1;
            let maxY = -1;
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const alpha = pixels[(y * width + x) * 4 + 3];
                    if (alpha <= 8) continue;
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                }
            }
            if (maxX >= minX && maxY >= minY) {
                bounds = { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 };
            }
        } catch (error) {
            bounds = { x: 0, y: 0, width: width, height: height };
        }
        spriteBoundsCache.set(image, bounds);
        return bounds;
    }

    function buildImageText(image, bounds) {
        if (!image) return '当前武器未加载贴图，将只显示代码预览。';
        const width = image.naturalWidth || image.width;
        const height = image.naturalHeight || image.height;
        if (!bounds) return '贴图已载入：原图 ' + width + ' x ' + height;
        return '贴图已载入：原图 ' + width + ' x ' + height + '，内容区域 ' + bounds.width + ' x ' + bounds.height;
    }

    function ensureSpriteLoaded(force) {
        const cfg = currentConfig();
        const source = getEffectiveSpriteSource(cfg);
        if (!source) {
            state.spriteImage = null;
            state.spriteError = '';
            state.loadedSpriteSource = '';
            updateActiveSpriteInfo();
            setStatus(el.imageStatus, '当前武器未加载贴图，将只显示代码预览。');
            return;
        }

        if (!force && source === state.loadedSpriteSource && (state.spriteImage || state.spriteError)) return;

        state.loadedSpriteSource = source;
        state.spriteImage = null;
        state.spriteError = '';
        updateActiveSpriteInfo();
        setStatus(el.imageStatus, '贴图加载中...');

        const cached = state.spriteCache.get(source);
        if (cached) {
            if (cached.error) {
                state.spriteError = cached.error;
                updateActiveSpriteInfo();
                setStatus(el.imageStatus, cached.error, 'error');
            } else {
                state.spriteImage = cached.image;
                updateActiveSpriteInfo();
                setStatus(el.imageStatus, buildImageText(cached.image, getSpriteBounds(cached.image)), 'ok');
            }
            return;
        }

        const image = new Image();
        image.onload = function () {
            state.spriteCache.set(source, { image: image, error: '' });
            if (state.loadedSpriteSource !== source) return;
            state.spriteImage = image;
            updateActiveSpriteInfo();
            setStatus(el.imageStatus, buildImageText(image, getSpriteBounds(image)), 'ok');
        };
        image.onerror = function () {
            const error = '贴图加载失败，请检查路径或改用文件选择。';
            state.spriteCache.set(source, { image: null, error: error });
            if (state.loadedSpriteSource !== source) return;
            state.spriteError = error;
            updateActiveSpriteInfo();
            setStatus(el.imageStatus, error, 'error');
        };
        image.src = source;
    }

    function bindEvents() {
        const inputKeys = [
            'sizeInput', 'rotationInput', 'spinSpeedInput', 'progressInput', 'anchorXInput', 'anchorYInput',
            'offsetXInput', 'offsetYInput', 'targetXInput', 'targetYInput', 'targetSizeInput', 'sceneZoomInput',
            'rangeInput', 'aimOffsetInput', 'arcAngleInput', 'handDistanceInput', 'handLiftInput',
            'reachMultiplierInput', 'countInput', 'spreadInput', 'projectileCountInput', 'projectileSpreadInput',
            'travelDistanceInput', 'orbitRadiusInput', 'orbitSpeedInput', 'beamWidthInput', 'throwArcInput'
        ];

        el.weaponSelect.addEventListener('change', function (event) { setCurrentWeapon(event.target.value); });
        inputKeys.forEach(function (key) {
            el[key].addEventListener('input', readFormIntoConfig);
            el[key].addEventListener('change', readFormIntoConfig);
        });
        ['sceneSelect', 'renderModeSelect', 'codeStyleSelect', 'trimInput', 'flipXInput', 'animateInput', 'referenceInput', 'anchorInput', 'hitboxInput', 'curvedSelect'].forEach(function (key) {
            el[key].addEventListener('change', readFormIntoConfig);
        });

        el.spriteFileInput.addEventListener('change', function (event) {
            const file = event.target.files && event.target.files[0];
            if (!file) return;
            revokePreviewUrl(state.currentKey);
            state.previewUrls.set(state.currentKey, URL.createObjectURL(file));
            state.previewMeta.set(state.currentKey, { name: file.name });
            currentConfig().spritePath = '';
            el.spritePathInput.value = '';
            el.spriteFileInput.value = '';
            state.loadedSpriteSource = '';
            ensureSpriteLoaded(true);
            setStatus(el.imageStatus, '已使用本地文件预览：' + file.name, 'ok');
        });

        el.useBuiltinBtn.addEventListener('click', function () {
            const cfg = currentConfig();
            revokePreviewUrl(state.currentKey);
            cfg.spritePath = cfg.builtinSpritePath || '';
            applyConfigToForm(cfg);
            ensureSpriteLoaded(true);
        });

        el.clearSpriteBtn.addEventListener('click', function () {
            const cfg = currentConfig();
            revokePreviewUrl(state.currentKey);
            cfg.spritePath = '';
            applyConfigToForm(cfg);
            ensureSpriteLoaded(true);
        });

        el.resetCurrentBtn.addEventListener('click', function () {
            revokePreviewUrl(state.currentKey);
            state.configs[state.currentKey] = clone(PRESETS[state.currentKey]);
            applyConfigToForm(currentConfig());
            ensureSpriteLoaded(true);
        });

        el.resetAllBtn.addEventListener('click', function () {
            Array.from(state.previewUrls.keys()).forEach(function (key) { revokePreviewUrl(key); });
            state.configs = clonePresets();
            resetView();
            setCurrentWeapon(state.currentKey);
        });

        el.exportCurrentBtn.addEventListener('click', exportCurrent);
        el.exportAllBtn.addEventListener('click', exportAll);
        el.copyBtn.addEventListener('click', copyOutput);
        el.toggleAdvancedBtn.addEventListener('click', function () {
            state.showAdvanced = !state.showAdvanced;
            updateAdvancedPanels();
        });
        el.toolButtons.forEach(function (button) {
            button.addEventListener('click', function () {
                state.toolMode = button.dataset.tool || 'auto';
                updateToolButtons();
            });
        });

        el.canvas.addEventListener('pointerdown', handlePointerDown);
        el.canvas.addEventListener('pointermove', handlePointerMove);
        el.canvas.addEventListener('pointerup', handlePointerUp);
        el.canvas.addEventListener('pointerleave', handlePointerUp);
        el.canvas.addEventListener('pointercancel', handlePointerUp);
        el.canvas.addEventListener('wheel', handleWheel, { passive: false });
        el.canvas.addEventListener('dblclick', resetView);
        el.canvas.addEventListener('contextmenu', function (event) { event.preventDefault(); });

        window.addEventListener('keydown', function (event) {
            if (event.code === 'Space') state.spacePressed = true;
        });
        window.addEventListener('keyup', function (event) {
            if (event.code === 'Space') state.spacePressed = false;
        });
    }
    function setCurrentWeapon(key) {
        state.currentKey = key;
        el.weaponSelect.value = key;
        applyConfigToForm(currentConfig());
        ensureSpriteLoaded();
        updateActiveSpriteInfo();
    }

    function applyConfigToForm(cfg) {
        el.sceneSelect.value = cfg.scene;
        el.renderModeSelect.value = cfg.renderMode;
        el.codeStyleSelect.value = cfg.codeStyle;
        el.spritePathInput.value = cfg.spritePath || '';
        el.sizeInput.value = cfg.size;
        el.rotationInput.value = cfg.rotationDeg;
        el.spinSpeedInput.value = cfg.spinSpeedDeg;
        el.progressInput.value = cfg.previewProgress;
        el.anchorXInput.value = cfg.anchorX;
        el.anchorYInput.value = cfg.anchorY;
        el.offsetXInput.value = cfg.offsetX;
        el.offsetYInput.value = cfg.offsetY;
        el.trimInput.checked = !!cfg.trimTransparent;
        el.flipXInput.checked = !!cfg.flipX;
        el.animateInput.checked = !!cfg.animate;
        el.referenceInput.checked = !!cfg.showReference;
        el.anchorInput.checked = !!cfg.showAnchor;
        el.hitboxInput.checked = !!cfg.showHitbox;
        el.targetXInput.value = cfg.targetX;
        el.targetYInput.value = cfg.targetY;
        el.targetSizeInput.value = cfg.targetSize;
        el.sceneZoomInput.value = cfg.sceneZoom;
        el.rangeInput.value = cfg.range;
        el.aimOffsetInput.value = cfg.aimOffsetDeg;
        el.arcAngleInput.value = cfg.arcAngle;
        el.handDistanceInput.value = cfg.handDistance;
        el.handLiftInput.value = cfg.handLift;
        el.reachMultiplierInput.value = cfg.reachMultiplier;
        el.countInput.value = cfg.count;
        el.spreadInput.value = cfg.spreadDeg;
        el.projectileCountInput.value = cfg.count;
        el.projectileSpreadInput.value = cfg.spreadDeg;
        el.travelDistanceInput.value = cfg.travelDistance;
        el.curvedSelect.value = String(!!cfg.curved);
        el.orbitRadiusInput.value = cfg.orbitRadius;
        el.orbitSpeedInput.value = cfg.orbitSpeedDeg;
        el.beamWidthInput.value = cfg.beamWidth;
        el.throwArcInput.value = cfg.throwArc;
        updateFieldVisibility(cfg.scene);
        updateSummary();
        updateTargetStatus();
        updateActiveSpriteInfo();
    }

    function readFormIntoConfig() {
        const cfg = currentConfig();
        cfg.scene = el.sceneSelect.value;
        cfg.renderMode = el.renderModeSelect.value;
        cfg.codeStyle = el.codeStyleSelect.value;
        cfg.spritePath = el.spritePathInput.value.trim();
        cfg.size = numeric(el.sizeInput.value, cfg.size);
        cfg.rotationDeg = numeric(el.rotationInput.value, cfg.rotationDeg);
        cfg.spinSpeedDeg = numeric(el.spinSpeedInput.value, cfg.spinSpeedDeg);
        cfg.previewProgress = clamp(numeric(el.progressInput.value, cfg.previewProgress), 0, 1);
        cfg.anchorX = numeric(el.anchorXInput.value, cfg.anchorX);
        cfg.anchorY = numeric(el.anchorYInput.value, cfg.anchorY);
        cfg.offsetX = numeric(el.offsetXInput.value, cfg.offsetX);
        cfg.offsetY = numeric(el.offsetYInput.value, cfg.offsetY);
        cfg.trimTransparent = el.trimInput.checked;
        cfg.flipX = el.flipXInput.checked;
        cfg.animate = el.animateInput.checked;
        cfg.showReference = el.referenceInput.checked;
        cfg.showAnchor = el.anchorInput.checked;
        cfg.showHitbox = el.hitboxInput.checked;
        cfg.targetX = numeric(el.targetXInput.value, cfg.targetX);
        cfg.targetY = numeric(el.targetYInput.value, cfg.targetY);
        cfg.targetSize = Math.max(8, numeric(el.targetSizeInput.value, cfg.targetSize));
        cfg.sceneZoom = clamp(numeric(el.sceneZoomInput.value, cfg.sceneZoom), 0.2, 3.5);
        cfg.range = Math.max(0, numeric(el.rangeInput.value, cfg.range));
        cfg.aimOffsetDeg = numeric(el.aimOffsetInput.value, cfg.aimOffsetDeg);
        cfg.arcAngle = Math.max(0, numeric(el.arcAngleInput.value, cfg.arcAngle));
        cfg.handDistance = numeric(el.handDistanceInput.value, cfg.handDistance);
        cfg.handLift = numeric(el.handLiftInput.value, cfg.handLift);
        cfg.reachMultiplier = Math.max(0, numeric(el.reachMultiplierInput.value, cfg.reachMultiplier));
        if (cfg.scene === 'melee') {
            cfg.count = Math.max(1, Math.round(numeric(el.countInput.value, cfg.count)));
            cfg.spreadDeg = Math.max(0, numeric(el.spreadInput.value, cfg.spreadDeg));
        } else {
            cfg.count = Math.max(1, Math.round(numeric(el.projectileCountInput.value, cfg.count)));
            cfg.spreadDeg = Math.max(0, numeric(el.projectileSpreadInput.value, cfg.spreadDeg));
        }
        cfg.travelDistance = Math.max(0, numeric(el.travelDistanceInput.value, cfg.travelDistance));
        cfg.curved = el.curvedSelect.value === 'true';
        cfg.orbitRadius = Math.max(0, numeric(el.orbitRadiusInput.value, cfg.orbitRadius));
        cfg.orbitSpeedDeg = numeric(el.orbitSpeedInput.value, cfg.orbitSpeedDeg);
        cfg.beamWidth = Math.max(1, numeric(el.beamWidthInput.value, cfg.beamWidth));
        cfg.throwArc = Math.max(0, numeric(el.throwArcInput.value, cfg.throwArc));
        el.countInput.value = cfg.count;
        el.spreadInput.value = cfg.spreadDeg;
        el.projectileCountInput.value = cfg.count;
        el.projectileSpreadInput.value = cfg.spreadDeg;
        updateFieldVisibility(cfg.scene);
        updateSummary();
        updateTargetStatus();
        if (state.previewUrls.has(state.currentKey) && cfg.spritePath) revokePreviewUrl(state.currentKey);
        ensureSpriteLoaded();
    }

    function exportCurrent() {
        const payload = {};
        payload[state.currentKey] = serializeConfig(currentConfig());
        el.exportOutput.value = JSON.stringify(payload, null, 2);
    }

    function exportAll() {
        const payload = {};
        Object.keys(state.configs).forEach(function (key) {
            payload[key] = serializeConfig(state.configs[key]);
        });
        el.exportOutput.value = JSON.stringify(payload, null, 2);
    }

    function copyOutput() {
        const text = el.exportOutput.value.trim();
        if (!text) return;
        if (!navigator.clipboard || !navigator.clipboard.writeText) {
            el.copyBtn.textContent = '浏览器不支持';
            setTimeout(function () { el.copyBtn.textContent = '复制文本'; }, 1200);
            return;
        }
        navigator.clipboard.writeText(text).then(function () {
            el.copyBtn.textContent = '已复制';
            setTimeout(function () { el.copyBtn.textContent = '复制文本'; }, 1200);
        }).catch(function () {
            el.copyBtn.textContent = '复制失败';
            setTimeout(function () { el.copyBtn.textContent = '复制文本'; }, 1200);
        });
    }

    function serializeConfig(cfg) {
        return {
            label: cfg.label,
            scene: cfg.scene,
            renderMode: cfg.renderMode,
            codeStyle: cfg.codeStyle,
            spritePath: cfg.spritePath || '',
            trimTransparent: !!cfg.trimTransparent,
            flipX: !!cfg.flipX,
            size: cfg.size,
            rotationDeg: cfg.rotationDeg,
            spinSpeedDeg: cfg.spinSpeedDeg,
            spinSpeedRad: Number((cfg.spinSpeedDeg * Math.PI / 180).toFixed(4)),
            anchorX: cfg.anchorX,
            anchorY: cfg.anchorY,
            offsetX: cfg.offsetX,
            offsetY: cfg.offsetY,
            range: cfg.range,
            arcAngle: cfg.arcAngle,
            aimOffsetDeg: cfg.aimOffsetDeg,
            handDistance: cfg.handDistance,
            handLift: cfg.handLift,
            reachMultiplier: cfg.reachMultiplier,
            count: cfg.count,
            spreadDeg: cfg.spreadDeg,
            travelDistance: cfg.travelDistance,
            orbitRadius: cfg.orbitRadius,
            orbitSpeedDeg: cfg.orbitSpeedDeg,
            beamWidth: cfg.beamWidth,
            throwArc: cfg.throwArc,
            targetX: cfg.targetX,
            targetY: cfg.targetY,
            targetSize: cfg.targetSize,
            previewProgress: cfg.previewProgress,
            sceneZoom: cfg.sceneZoom,
            animate: !!cfg.animate,
            showReference: !!cfg.showReference,
            showAnchor: !!cfg.showAnchor,
            showHitbox: !!cfg.showHitbox,
            curved: !!cfg.curved
        };
    }

    function updateSummary() {
        const cfg = currentConfig();
        el.summary.innerHTML =
            '<strong>' + cfg.label + '</strong> | 预览类型：<strong>' + SCENE_LABELS[cfg.scene] +
            '</strong> | 渲染方式：<strong>' + SPRITE_MODE_LABELS[cfg.renderMode] +
            '</strong> | 代码样式：<strong>' + codeStyleLabel(cfg.codeStyle) +
            '</strong> | 范围：<strong>' + cfg.range +
            '</strong>' + (cfg.scene === 'melee' ? ' | 扇形：<strong>' + cfg.arcAngle + '°</strong>' : '');
    }

    function updateTargetStatus() {
        const cfg = currentConfig();
        const distance = Math.hypot(cfg.targetX, cfg.targetY);
        const angle = radToDeg(Math.atan2(cfg.targetY, cfg.targetX));
        setStatus(el.targetStatus, '目标偏移：(' + cfg.targetX.toFixed(0) + ', ' + cfg.targetY.toFixed(0) + ')，距离 ' + distance.toFixed(1) + '，方向 ' + angle.toFixed(1) + '°');
    }
    function chooseGridStep(scale) {
        const world = 72 / Math.max(0.001, scale);
        if (world <= 50) return 50;
        if (world <= 100) return 100;
        if (world <= 150) return 150;
        if (world <= 200) return 200;
        return 300;
    }

    function getSceneScale(cfg) {
        let extent = 320;
        const targetDistance = Math.max(40, Math.hypot(cfg.targetX, cfg.targetY));
        if (cfg.scene === 'melee') extent = Math.max(targetDistance, cfg.range * Math.max(0.28, cfg.reachMultiplier) * 1.4, 220);
        else if (cfg.scene === 'projectile') extent = Math.max(targetDistance, cfg.travelDistance, cfg.range, 260);
        else if (cfg.scene === 'orbit') extent = Math.max(cfg.orbitRadius + 80, targetDistance, 260);
        else if (cfg.scene === 'area') extent = Math.max(targetDistance + cfg.range, cfg.travelDistance + cfg.range, 260);
        else if (cfg.scene === 'aura') extent = Math.max(cfg.range * 1.25, 220);
        else if (cfg.scene === 'laser') extent = Math.max(targetDistance, Math.min(cfg.range, 900), 420);
        else if (cfg.scene === 'instant') extent = Math.max(targetDistance, Math.min(cfg.range, 760), 320);
        return Math.min(el.canvas.width, el.canvas.height) * 0.34 / extent * cfg.sceneZoom;
    }

    function getOrigin() {
        return {
            x: el.canvas.width * 0.38 + state.view.offsetX,
            y: el.canvas.height * 0.64 + state.view.offsetY
        };
    }

    function worldToScreen(point, scale, origin) {
        return {
            x: origin.x + point.x * scale * state.view.zoom,
            y: origin.y + point.y * scale * state.view.zoom
        };
    }

    function screenToWorld(point, scale, origin) {
        return {
            x: (point.x - origin.x) / (scale * state.view.zoom),
            y: (point.y - origin.y) / (scale * state.view.zoom)
        };
    }

    function spreadAngles(count, spreadDeg, baseAngle) {
        const amount = Math.max(1, Math.round(count || 1));
        if (amount === 1) return [baseAngle];
        const total = degToRad(spreadDeg || 0);
        const step = total / Math.max(1, amount - 1);
        const start = baseAngle - total * 0.5;
        return Array.from({ length: amount }, function (_, index) { return start + step * index; });
    }

    function hexToRgba(hex, alpha) {
        const clean = (hex || '#ffffff').replace('#', '');
        const full = clean.length === 3 ? clean.replace(/(.)/g, '$1$1') : clean;
        const value = parseInt(full, 16);
        const r = (value >> 16) & 255;
        const g = (value >> 8) & 255;
        const b = value & 255;
        return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
    }

    function drawBackground(scale, origin) {
        ctx.clearRect(0, 0, el.canvas.width, el.canvas.height);

        const light = ctx.createRadialGradient(el.canvas.width * 0.5, el.canvas.height * 0.35, 10, el.canvas.width * 0.5, el.canvas.height * 0.55, Math.max(el.canvas.width, el.canvas.height));
        light.addColorStop(0, 'rgba(245,210,156,0.08)');
        light.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = light;
        ctx.fillRect(0, 0, el.canvas.width, el.canvas.height);

        const gridStep = chooseGridStep(scale) * scale * state.view.zoom;
        ctx.save();
        ctx.strokeStyle = 'rgba(255,240,210,0.08)';
        ctx.lineWidth = 1;
        for (let x = origin.x % gridStep; x <= el.canvas.width; x += gridStep) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, el.canvas.height);
            ctx.stroke();
        }
        for (let y = origin.y % gridStep; y <= el.canvas.height; y += gridStep) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(el.canvas.width, y);
            ctx.stroke();
        }
        ctx.strokeStyle = 'rgba(255,240,210,0.18)';
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(0, origin.y);
        ctx.lineTo(el.canvas.width, origin.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(origin.x, 0);
        ctx.lineTo(origin.x, el.canvas.height);
        ctx.stroke();
        ctx.restore();
    }

    function drawPlayer(origin) {
        ctx.save();
        ctx.translate(origin.x, origin.y);
        ctx.fillStyle = '#f5ead6';
        ctx.beginPath();
        ctx.arc(0, -24, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillRect(-14, -14, 28, 42);
        ctx.fillStyle = '#313c46';
        ctx.fillRect(-10, 22, 7, 10);
        ctx.fillRect(3, 22, 7, 10);
        ctx.fillStyle = '#7ac9ff';
        ctx.fillRect(-4, 2, 8, 13);
        ctx.strokeStyle = '#ffe9a7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(10, 0);
        ctx.moveTo(0, -10);
        ctx.lineTo(0, 10);
        ctx.stroke();
        ctx.restore();
    }

    function drawTarget(targetScreen, size, showHitbox) {
        ctx.save();
        ctx.translate(targetScreen.x, targetScreen.y);
        if (showHitbox) {
            ctx.strokeStyle = 'rgba(245,221,153,0.62)';
            ctx.lineWidth = 1.4;
            ctx.strokeRect(-size * 0.5, -size * 0.5, size, size);
        }
        ctx.strokeStyle = '#ff6eb0';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-10, 0);
        ctx.lineTo(10, 0);
        ctx.moveTo(0, -10);
        ctx.lineTo(0, 10);
        ctx.stroke();
        ctx.fillStyle = '#7f2d75';
        ctx.fillRect(-4, -12, 8, 24);
        ctx.fillStyle = '#a36bf0';
        ctx.beginPath();
        ctx.arc(0, -14, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function drawGuideLine(from, to, color, dash, width, alpha) {
        ctx.save();
        ctx.strokeStyle = color;
        ctx.globalAlpha = alpha == null ? 1 : alpha;
        ctx.lineWidth = width || 1.6;
        ctx.setLineDash(dash || [8, 8]);
        ctx.beginPath();
        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
        ctx.stroke();
        ctx.restore();
    }

    function drawTrimmedSprite(localCtx, image, cfg) {
        if (!image) return;
        const bounds = cfg.trimTransparent ? getSpriteBounds(image) : null;
        const src = bounds || { x: 0, y: 0, width: image.naturalWidth || image.width, height: image.naturalHeight || image.height };
        const scale = Math.max(1, cfg.size) / Math.max(1, src.height);
        const width = src.width * scale;
        const height = src.height * scale;
        localCtx.save();
        if (cfg.flipX) localCtx.scale(-1, 1);
        localCtx.drawImage(image, src.x, src.y, src.width, src.height, -width * cfg.anchorX + cfg.offsetX, -height * cfg.anchorY + cfg.offsetY, width, height);
        if (cfg.showAnchor) {
            localCtx.strokeStyle = '#ff6eb0';
            localCtx.lineWidth = 1.5;
            localCtx.beginPath();
            localCtx.moveTo(-10, 0);
            localCtx.lineTo(10, 0);
            localCtx.moveTo(0, -10);
            localCtx.lineTo(0, 10);
            localCtx.stroke();
        }
        localCtx.restore();
    }

    function getRenderMetrics(cfg, useSprite) {
        if (useSprite && state.spriteImage) {
            const bounds = cfg.trimTransparent ? getSpriteBounds(state.spriteImage) : null;
            const src = bounds || {
                x: 0,
                y: 0,
                width: state.spriteImage.naturalWidth || state.spriteImage.width,
                height: state.spriteImage.naturalHeight || state.spriteImage.height
            };
            const scale = Math.max(1, cfg.size) / Math.max(1, src.height);
            return { width: src.width * scale, height: src.height * scale };
        }
        const styleScale = cfg.codeStyle === 'knife_throw' ? { w: 1.15, h: 0.28 }
            : cfg.codeStyle === 'icicle' ? { w: 1.45, h: 0.5 }
            : cfg.codeStyle === 'cross_bounce' ? { w: 0.9, h: 0.9 }
            : { w: 1, h: 1 };
        return { width: Math.max(18, cfg.size * styleScale.w), height: Math.max(18, cfg.size * styleScale.h) };
    }

    function captureActiveWeapon(screenX, screenY, baseAngle, totalAngle, cfg, useSprite) {
        const metrics = getRenderMetrics(cfg, useSprite);
        const left = -metrics.width * cfg.anchorX + cfg.offsetX;
        const top = -metrics.height * cfg.anchorY + cfg.offsetY;
        const corners = [
            rotatePoint(left, top, totalAngle),
            rotatePoint(left + metrics.width, top, totalAngle),
            rotatePoint(left + metrics.width, top + metrics.height, totalAngle),
            rotatePoint(left, top + metrics.height, totalAngle)
        ].map(function (point) {
            return { x: screenX + point.x, y: screenY + point.y };
        });
        state.activeWeaponHandle = {
            screenX: screenX,
            screenY: screenY,
            baseAngle: baseAngle,
            baseAngleWithoutRotation: baseAngle - degToRad(cfg.rotationDeg || 0),
            totalAngle: totalAngle,
            width: metrics.width,
            height: metrics.height,
            left: left,
            top: top,
            right: left + metrics.width,
            bottom: top + metrics.height,
            corners: corners
        };
    }

    function pointToWeaponLocal(point, handle) {
        return inverseRotatePoint(point.x - handle.screenX, point.y - handle.screenY, handle.totalAngle);
    }

    function isPointInActiveWeapon(point) {
        const handle = state.activeWeaponHandle;
        if (!handle) return false;
        const local = pointToWeaponLocal(point, handle);
        return local.x >= handle.left && local.x <= handle.right && local.y >= handle.top && local.y <= handle.bottom;
    }

    function drawActiveWeaponOverlay() {
        const handle = state.activeWeaponHandle;
        if (!handle) return;
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 214, 140, 0.92)';
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(handle.corners[0].x, handle.corners[0].y);
        for (let i = 1; i < handle.corners.length; i++) ctx.lineTo(handle.corners[i].x, handle.corners[i].y);
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = 'rgba(255,184,107,0.9)';
        ctx.beginPath();
        ctx.arc(handle.screenX, handle.screenY, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    function drawWeaponAt(screenX, screenY, angle, cfg, seconds, alpha, capturePrimary) {
        const mode = cfg.renderMode === 'auto'
            ? (cfg.codeStyle && cfg.codeStyle !== 'none' ? 'code' : 'sprite')
            : cfg.renderMode;
        const useCode = mode === 'code' || mode === 'both';
        const useSprite = state.spriteImage && (mode === 'sprite' || mode === 'both');
        const totalAngle = angle + ((useSprite || useCode) ? degToRad(cfg.spinSpeedDeg || 0) * seconds : 0);

        ctx.save();
        ctx.translate(screenX, screenY);
        ctx.globalAlpha = alpha == null ? 1 : alpha;
        if (useCode) {
            ctx.save();
            ctx.globalAlpha *= mode === 'both' ? 0.42 : 1;
            drawCodeStyle(cfg.codeStyle, cfg, angle, seconds);
            ctx.restore();
        }
        if (useSprite) {
            ctx.save();
            ctx.rotate(totalAngle);
            drawTrimmedSprite(ctx, state.spriteImage, cfg);
            ctx.restore();
        }
        ctx.restore();
        if (capturePrimary) captureActiveWeapon(screenX, screenY, angle, totalAngle, cfg, useSprite);
    }

    function drawScene(seconds) {
        const cfg = currentConfig();
        state.lastSeconds = seconds;
        state.activeWeaponHandle = null;
        const scale = getSceneScale(cfg);
        const origin = getOrigin();
        const target = { x: cfg.targetX, y: cfg.targetY };
        const targetScreen = worldToScreen(target, scale, origin);
        const playerScreen = worldToScreen({ x: 0, y: 0 }, scale, origin);
        const rawAim = Math.atan2(cfg.targetY, cfg.targetX);
        const finalAim = rawAim + degToRad(cfg.aimOffsetDeg || 0);

        drawBackground(scale, origin);
        drawPlayer(origin);
        drawTarget(targetScreen, cfg.targetSize, cfg.showHitbox);

        if (cfg.showReference) {
            drawGuideLine(playerScreen, targetScreen, 'rgba(255,255,255,0.28)', [8, 8], 1.4, 0.9);
            const refDistance = Math.max(40, Math.min(cfg.travelDistance || cfg.range || 240, cfg.range || cfg.travelDistance || 240));
            const refScreen = worldToScreen({ x: Math.cos(finalAim) * refDistance, y: Math.sin(finalAim) * refDistance }, scale, origin);
            drawGuideLine(playerScreen, refScreen, 'rgba(122,208,255,0.58)', [10, 6], 1.6, 1);
        }

        if (cfg.scene === 'melee') drawMeleePreview(cfg, seconds, scale, origin, finalAim);
        else if (cfg.scene === 'projectile') drawProjectilePreview(cfg, seconds, scale, origin, finalAim);
        else if (cfg.scene === 'orbit') drawOrbitPreview(cfg, seconds, scale, origin);
        else if (cfg.scene === 'area') drawAreaPreview(cfg, seconds, scale, origin, finalAim);
        else if (cfg.scene === 'aura') drawAuraPreview(cfg, seconds, scale, origin);
        else if (cfg.scene === 'laser') drawLaserPreview(cfg, seconds, scale, origin, finalAim);
        else if (cfg.scene === 'instant') drawInstantPreview(cfg, seconds, scale, origin, finalAim);
        drawActiveWeaponOverlay();

        el.footerInfo.textContent =
            '模式 ' + (TOOL_LABELS[state.toolMode] || state.toolMode) +
            ' | ' +
            '视图缩放 ' + state.view.zoom.toFixed(2) +
            ' | 视图偏移 (' + state.view.offsetX.toFixed(0) + ', ' + state.view.offsetY.toFixed(0) + ')' +
            ' | 实际角度 ' + radToDeg(finalAim).toFixed(1) + '°';
    }

    function pickPhase(seconds, cfg, mode) {
        if (!cfg.animate) return clamp(cfg.previewProgress, 0, 1);
        if (mode === 'pingpong') {
            const value = (seconds * 0.9) % 2;
            return value > 1 ? 2 - value : value;
        }
        return (seconds * 0.5) % 1;
    }

    function drawMeleePreview(cfg, seconds, scale, origin, aimAngle) {
        const centers = spreadAngles(cfg.count, cfg.spreadDeg || 0, aimAngle);
        const arc = degToRad(cfg.arcAngle || 0);
        const swingPhase = pickPhase(seconds, cfg, 'pingpong');
        const reach = Math.max(36, cfg.range * Math.max(0.1, cfg.reachMultiplier));
        const handDistance = cfg.handDistance * scale * state.view.zoom;
        const handLift = cfg.handLift * scale * state.view.zoom;
        const radiusPx = reach * scale * state.view.zoom;

        centers.forEach(function (centerAngle, index) {
            const start = centerAngle - arc * 0.5;
            const end = centerAngle + arc * 0.5;
            const swingAngle = lerp(start, end, swingPhase);
            if (cfg.showReference) {
                ctx.save();
                ctx.translate(origin.x, origin.y);
                const fill = ctx.createRadialGradient(0, 0, 0, 0, 0, radiusPx);
                fill.addColorStop(0, index === 0 ? 'rgba(255,211,107,0.22)' : 'rgba(186,150,255,0.12)');
                fill.addColorStop(1, 'rgba(255,211,107,0)');
                ctx.fillStyle = fill;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.arc(0, 0, radiusPx, start, end);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = index === 0 ? 'rgba(255,211,107,0.82)' : 'rgba(205,176,255,0.55)';
                ctx.lineWidth = index === 0 ? 2.4 : 1.4;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.arc(0, 0, radiusPx, start, end);
                ctx.closePath();
                ctx.stroke();
                ctx.restore();
            }

            const handX = origin.x + Math.cos(swingAngle) * handDistance;
            const handY = origin.y + Math.sin(swingAngle) * handDistance - handLift;
            if (cfg.showReference) {
                ctx.save();
                ctx.strokeStyle = index === 0 ? 'rgba(255,241,189,0.84)' : 'rgba(210,205,255,0.4)';
                ctx.lineWidth = index === 0 ? 3 : 2;
                ctx.beginPath();
                ctx.moveTo(origin.x, origin.y - 4);
                ctx.lineTo(handX, handY);
                ctx.stroke();
                ctx.strokeStyle = index === 0 ? 'rgba(255,225,140,0.55)' : 'rgba(180,140,255,0.26)';
                ctx.lineWidth = index === 0 ? 12 : 8;
                ctx.beginPath();
                ctx.arc(handX, handY, radiusPx, swingAngle - arc * 0.35, swingAngle + arc * 0.12);
                ctx.stroke();
                ctx.restore();
            }
            if (index === 0) drawWeaponAt(handX, handY, swingAngle + Math.PI * 0.16 + degToRad(cfg.rotationDeg || 0), cfg, seconds, 1, true);
        });
    }

    function drawProjectilePreview(cfg, seconds, scale, origin, aimAngle) {
        const angles = spreadAngles(cfg.count, cfg.spreadDeg || 0, aimAngle);
        const travel = Math.max(24, cfg.travelDistance || cfg.range || Math.hypot(cfg.targetX, cfg.targetY));
        const phase = pickPhase(seconds, cfg, cfg.codeStyle === 'axe_spin' ? 'pingpong' : 'loop');
        angles.forEach(function (angle) {
            const end = { x: Math.cos(angle) * travel, y: Math.sin(angle) * travel };
            const startScreen = worldToScreen({ x: 0, y: 0 }, scale, origin);
            const endScreen = worldToScreen(end, scale, origin);
            if (cfg.showReference) {
                drawGuideLine(startScreen, endScreen, 'rgba(122,208,255,0.55)', [10, 6], 1.6, 1);
                if (cfg.codeStyle === 'axe_spin') drawGuideLine(endScreen, startScreen, 'rgba(255,180,120,0.38)', [6, 8], 1.2, 1);
            }
            let pos = { x: lerp(0, end.x, phase), y: lerp(0, end.y, phase) };
            if (cfg.codeStyle === 'axe_spin' && phase > 0.5) pos = { x: lerp(end.x, 0, (phase - 0.5) * 2), y: lerp(end.y, 0, (phase - 0.5) * 2) };
            const screen = worldToScreen(pos, scale, origin);
            drawWeaponAt(screen.x, screen.y, angle + degToRad(cfg.rotationDeg || 0), cfg, seconds, 1, state.activeWeaponHandle == null);
        });
    }

    function drawOrbitPreview(cfg, seconds, scale, origin) {
        const radius = Math.max(20, cfg.orbitRadius || cfg.range || 240);
        const orbitPx = radius * scale * state.view.zoom;
        if (cfg.showReference) {
            ctx.save();
            ctx.translate(origin.x, origin.y);
            ctx.strokeStyle = 'rgba(255,232,164,0.42)';
            ctx.lineWidth = 1.8;
            ctx.setLineDash([12, 10]);
            ctx.beginPath();
            ctx.arc(0, 0, orbitPx, 0, Math.PI * 2);
            ctx.stroke();
            ctx.restore();
        }
        const count = Math.max(1, Math.round(cfg.count || 1));
        const phase = cfg.animate ? seconds * degToRad(cfg.orbitSpeedDeg || 0) : degToRad(cfg.previewProgress * 360);
        for (let i = 0; i < count; i++) {
            const angle = phase + (i / count) * Math.PI * 2;
            const screen = worldToScreen({ x: Math.cos(angle) * radius, y: Math.sin(angle) * radius }, scale, origin);
            drawWeaponAt(screen.x, screen.y, angle + Math.PI * 0.5 + degToRad(cfg.rotationDeg || 0), cfg, seconds, 1, i === 0);
        }
    }

    function drawAreaPreview(cfg, seconds, scale, origin, aimAngle) {
        const angles = spreadAngles(cfg.count, cfg.spreadDeg || 0, aimAngle);
        const throwDistance = Math.max(24, cfg.travelDistance || Math.hypot(cfg.targetX, cfg.targetY) || 180);
        const phase = pickPhase(seconds, cfg, 'loop');
        angles.forEach(function (angle, index) {
            const impact = { x: Math.cos(angle) * throwDistance, y: Math.sin(angle) * throwDistance };
            const start = worldToScreen({ x: 0, y: 0 }, scale, origin);
            const end = worldToScreen(impact, scale, origin);
            if (cfg.showReference) drawThrowArc(start, end, cfg.throwArc, index === 0 ? 0.9 : 0.55);
            drawAreaField(cfg, seconds, scale, origin, impact, index === 0 ? 1 : 0.72);
            const bottle = {
                x: lerp(0, impact.x, phase),
                y: lerp(0, impact.y, phase) - Math.sin(phase * Math.PI) * (cfg.throwArc || 0)
            };
            const screen = worldToScreen(bottle, scale, origin);
            drawWeaponAt(screen.x, screen.y, angle + degToRad(cfg.rotationDeg || 0), cfg, seconds, 0.92, index === 0);
        });
    }

    function drawAuraPreview(cfg, seconds, scale, origin) {
        drawAreaField(cfg, seconds, scale, origin, { x: 0, y: 0 }, 1);
    }

    function drawLaserPreview(cfg, seconds, scale, origin, aimAngle) {
        const length = Math.max(420, Math.min(cfg.range || 900, 900));
        const end = worldToScreen({ x: Math.cos(aimAngle) * length, y: Math.sin(aimAngle) * length }, scale, origin);
        if (cfg.showReference) drawGuideLine(worldToScreen({ x: 0, y: 0 }, scale, origin), end, 'rgba(122,208,255,0.42)', [10, 6], 1.2, 1);
        ctx.save();
        ctx.translate(origin.x, origin.y);
        ctx.rotate(aimAngle);
        drawLaserBeam(length * scale * state.view.zoom, cfg.beamWidth, cfg.curved, seconds);
        ctx.restore();
    }

    function drawInstantPreview(cfg, seconds, scale, origin, aimAngle) {
        const angles = spreadAngles(cfg.count, cfg.spreadDeg || 0, aimAngle);
        const distance = Math.max(120, Math.min(cfg.range || 680, Math.hypot(cfg.targetX, cfg.targetY) || 320));
        angles.forEach(function (angle, beamIndex) {
            const points = [{ x: 0, y: 0 }, { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance }];
            for (let i = 0; i < 3; i++) {
                const extra = distance + 90 + i * 70;
                const offset = (i % 2 === 0 ? -1 : 1) * (50 + i * 18);
                points.push({
                    x: Math.cos(angle) * extra + Math.sin(angle) * offset,
                    y: Math.sin(angle) * extra - Math.cos(angle) * offset + Math.sin(seconds * 2 + i + beamIndex) * 12
                });
            }
            ctx.save();
            ctx.strokeStyle = beamIndex === 0 ? 'rgba(180,245,255,0.95)' : 'rgba(150,220,255,0.55)';
            ctx.shadowBlur = beamIndex === 0 ? 14 : 8;
            ctx.shadowColor = '#8de8ff';
            ctx.lineWidth = beamIndex === 0 ? 3.2 : 2;
            ctx.beginPath();
            points.forEach(function (point, idx) {
                const screen = worldToScreen(point, scale, origin);
                if (idx === 0) ctx.moveTo(screen.x, screen.y);
                else ctx.lineTo(screen.x, screen.y);
            });
            ctx.stroke();
            ctx.restore();
        });
    }

    function drawAreaField(cfg, seconds, scale, origin, center, alpha) {
        const screen = worldToScreen(center, scale, origin);
        const radiusPx = Math.max(18, cfg.range * scale * state.view.zoom);
        ctx.save();
        ctx.translate(screen.x, screen.y);
        ctx.globalAlpha = alpha;
        if (cfg.codeStyle === 'holy_water_pool') drawHolyWaterArea(radiusPx, seconds);
        else drawRadianceArea(radiusPx, seconds);
        ctx.restore();
    }

    function drawThrowArc(start, end, arcHeight, alpha) {
        const control = { x: (start.x + end.x) * 0.5, y: Math.min(start.y, end.y) - arcHeight };
        ctx.save();
        ctx.strokeStyle = 'rgba(122,208,255,' + alpha.toFixed(2) + ')';
        ctx.lineWidth = 1.6;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(start.x, start.y);
        ctx.quadraticCurveTo(control.x, control.y, end.x, end.y);
        ctx.stroke();
        ctx.restore();
    }

    function drawCodeStyle(style, cfg, angle, seconds) {
        if (style === 'knife_throw') drawKnifeCode(cfg.size, angle);
        else if (style === 'axe_spin') drawAxeCode(cfg.size, angle, seconds, cfg.spinSpeedDeg);
        else if (style === 'shuriken') drawShurikenCode(cfg.size, seconds, cfg.spinSpeedDeg);
        else if (style === 'cross_bounce') drawCrossCode(cfg.size, seconds, cfg.spinSpeedDeg);
        else if (style === 'fireball') drawFireballCode(cfg.size, angle, seconds);
        else if (style === 'magic_orb') drawMagicOrbCode(cfg.size, angle, seconds);
        else if (style === 'poison_dart') drawPoisonDartCode(cfg.size, angle, seconds);
        else if (style === 'icicle') drawIcicleCode(cfg.size, angle, seconds);
        else if (style === 'orbit_bible') drawBibleCode(cfg.size, seconds, cfg.spinSpeedDeg);
        else drawFallbackDot(cfg.size);
    }

    function drawKnifeCode(size, angle) {
        const len = Math.max(12, size * 1.15), half = Math.max(2, size * 0.12);
        ctx.save(); ctx.rotate(angle); ctx.fillStyle = '#f4f6fb'; ctx.beginPath(); ctx.moveTo(len * 0.52, 0); ctx.lineTo(-len * 0.16, -half); ctx.lineTo(-len * 0.34, 0); ctx.lineTo(-len * 0.16, half); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(160,175,200,0.95)'; ctx.lineWidth = Math.max(1.2, size * 0.08); ctx.beginPath(); ctx.moveTo(-len * 0.18, 0); ctx.lineTo(len * 0.34, 0); ctx.stroke(); ctx.restore();
    }

    function drawAxeCode(size, angle, seconds, spinSpeedDeg) {
        const spin = degToRad(spinSpeedDeg || 0) * seconds, radius = Math.max(10, size * 0.38);
        ctx.save(); ctx.rotate(angle + spin); ctx.fillStyle = '#e8edf5';
        for (let i = 0; i < 3; i++) { ctx.save(); ctx.rotate(i * (Math.PI * 2 / 3)); ctx.beginPath(); ctx.moveTo(radius * 1.14, 0); ctx.lineTo(-radius * 0.15, -radius * 0.28); ctx.lineTo(-radius * 0.44, 0); ctx.lineTo(-radius * 0.15, radius * 0.28); ctx.closePath(); ctx.fill(); ctx.restore(); }
        ctx.fillStyle = '#9a7a4a'; ctx.beginPath(); ctx.arc(0, 0, radius * 0.2, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }

    function drawShurikenCode(size, seconds, spinSpeedDeg) {
        const radius = Math.max(10, size * 0.42);
        ctx.save(); ctx.rotate(degToRad(spinSpeedDeg || 0) * seconds); ctx.fillStyle = 'rgba(196,201,209,0.95)'; ctx.strokeStyle = 'rgba(143,149,158,0.95)'; ctx.lineWidth = Math.max(1.2, size * 0.08); ctx.beginPath();
        for (let i = 0; i < 8; i++) { const pr = i % 2 === 0 ? radius : radius * 0.42; const pa = (i / 8) * Math.PI * 2; const px = Math.cos(pa) * pr; const py = Math.sin(pa) * pr; if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py); }
        ctx.closePath(); ctx.moveTo(radius * 0.22, 0); ctx.arc(0, 0, radius * 0.22, 0, Math.PI * 2, true); ctx.fill('evenodd'); ctx.stroke(); ctx.restore();
    }

    function drawCrossCode(size, seconds, spinSpeedDeg) {
        const radius = Math.max(8, size * 0.42);
        ctx.save(); ctx.rotate(degToRad(spinSpeedDeg || 0) * seconds); ctx.strokeStyle = 'rgba(255,255,255,0.92)'; ctx.lineWidth = Math.max(1.4, size * 0.11); ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-radius, 0); ctx.lineTo(radius, 0); ctx.moveTo(0, -radius); ctx.lineTo(0, radius); ctx.stroke(); ctx.restore();
    }

    function drawFireballCode(size, angle, seconds) {
        const pulse = 0.88 + Math.sin(seconds * 12) * 0.08, width = size * pulse, height = size * pulse;
        ctx.save(); ctx.rotate(angle); const tailLength = Math.max(10, width * 1.4); const tail = ctx.createLinearGradient(-tailLength, 0, 0, 0); tail.addColorStop(0, 'rgba(255,120,40,0)'); tail.addColorStop(1, 'rgba(255,170,70,0.55)'); ctx.fillStyle = tail; ctx.beginPath(); ctx.ellipse(-tailLength * 0.42, 0, tailLength * 0.55, height * 0.24, 0, 0, Math.PI * 2); ctx.fill(); const core = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(width, height) * 0.52); core.addColorStop(0, 'rgba(255,245,220,0.95)'); core.addColorStop(0.55, 'rgba(255,160,60,0.88)'); core.addColorStop(1, 'rgba(255,80,20,0.3)'); ctx.fillStyle = core; ctx.beginPath(); ctx.arc(0, 0, Math.max(width, height) * 0.34, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }

    function drawMagicOrbCode(size, angle, seconds) {
        const radius = Math.max(7, size * 0.34);
        ctx.save(); ctx.rotate(angle); const trail = ctx.createLinearGradient(-radius * 5, 0, -radius * 0.4, 0); trail.addColorStop(0, 'rgba(130,170,255,0)'); trail.addColorStop(1, 'rgba(130,170,255,0.4)'); ctx.fillStyle = trail; ctx.beginPath(); ctx.ellipse(-radius * 2.2, 0, radius * 2.3, radius * 0.55, 0, 0, Math.PI * 2); ctx.fill(); const core = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 1.3); core.addColorStop(0, 'rgba(255,255,255,0.95)'); core.addColorStop(0.5, 'rgba(180,220,255,0.9)'); core.addColorStop(1, 'rgba(90,140,255,0.55)'); ctx.fillStyle = core; ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill(); for (let i = 0; i < 3; i++) { const a = seconds * 6 + i * Math.PI * 0.66; ctx.fillStyle = 'rgba(220,240,255,0.75)'; ctx.beginPath(); ctx.arc(Math.cos(a) * radius * 0.55, Math.sin(a) * radius * 0.55, Math.max(1, radius * 0.18), 0, Math.PI * 2); ctx.fill(); } ctx.restore();
    }

    function drawPoisonDartCode(size, angle, seconds) {
        const len = Math.max(14, size * 1.25), body = Math.max(3, size * 0.22);
        ctx.save(); ctx.rotate(angle); const tail = ctx.createLinearGradient(-len, 0, 0, 0); tail.addColorStop(0, 'rgba(70,200,90,0)'); tail.addColorStop(1, 'rgba(90,240,120,0.35)'); ctx.fillStyle = tail; ctx.beginPath(); ctx.ellipse(-len * 0.45, 0, len * 0.55, body * 0.8, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(130,255,150,0.95)'; ctx.beginPath(); ctx.moveTo(len * 0.48, 0); ctx.lineTo(-len * 0.28, -body); ctx.lineTo(-len * 0.44, 0); ctx.lineTo(-len * 0.28, body); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(190,255,190,' + (0.45 + Math.sin(seconds * 18) * 0.15).toFixed(2) + ')'; ctx.beginPath(); ctx.arc(-len * 0.18, 0, body * 0.6, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }

    function drawIcicleCode(size, angle, seconds) {
        const len = Math.max(14, size * 1.45), half = Math.max(4, size * 0.24);
        ctx.save(); ctx.rotate(angle); ctx.fillStyle = 'rgba(210,245,255,0.92)'; ctx.beginPath(); ctx.moveTo(len * 0.52, 0); ctx.lineTo(-len * 0.25, -half); ctx.lineTo(-len * 0.55, 0); ctx.lineTo(-len * 0.25, half); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.86)'; ctx.lineWidth = Math.max(1.2, size * 0.08); ctx.beginPath(); ctx.moveTo(-len * 0.4, 0); ctx.lineTo(len * 0.34, 0); ctx.stroke(); ctx.fillStyle = 'rgba(235,255,255,' + (0.35 + Math.sin(seconds * 16) * 0.18).toFixed(2) + ')'; ctx.beginPath(); ctx.arc(0, 0, half * 0.5, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }

    function drawBibleCode(size, seconds, spinSpeedDeg) {
        const spin = degToRad(spinSpeedDeg || 0) * seconds, width = Math.max(18, size * 0.84), height = Math.max(18, size);
        ctx.save(); ctx.rotate(spin); ctx.fillStyle = 'rgba(255,243,196,0.92)'; ctx.fillRect(-width * 0.5, -height * 0.5, width, height); ctx.strokeStyle = 'rgba(173,126,60,0.9)'; ctx.lineWidth = 2; ctx.strokeRect(-width * 0.5, -height * 0.5, width, height); ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.beginPath(); ctx.moveTo(-width * 0.18, 0); ctx.lineTo(width * 0.18, 0); ctx.moveTo(0, -height * 0.18); ctx.lineTo(0, height * 0.18); ctx.stroke(); ctx.restore();
    }

    function drawFallbackDot(size) {
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(0, 0, Math.max(4, size * 0.25), 0, Math.PI * 2); ctx.fill();
    }

    function drawRadianceArea(radius, seconds) {
        const core = ctx.createRadialGradient(0, 0, 0, 0, 0, radius); core.addColorStop(0, 'rgba(255,225,100,0.28)'); core.addColorStop(0.7, 'rgba(255,190,55,0.18)'); core.addColorStop(1, 'rgba(255,140,30,0)'); ctx.fillStyle = core; ctx.beginPath(); ctx.arc(0, 0, radius, 0, Math.PI * 2); ctx.fill();
        const count = radius > 100 ? 16 : 10;
        for (let i = 0; i < count; i++) { const a = (i * 47 + Math.floor(seconds * 25)) * Math.PI / 180; const d = (0.16 + (i % 7) * 0.1) * radius * 0.9; ctx.fillStyle = 'rgba(255,245,180,' + (0.42 + Math.sin(seconds * 9 + i) * 0.18).toFixed(2) + ')'; ctx.beginPath(); ctx.arc(Math.cos(a) * d, Math.sin(a) * d, 1.4 + (i % 3) * 0.6, 0, Math.PI * 2); ctx.fill(); }
    }

    function drawHolyWaterArea(radius, seconds) {
        drawBlob(radius, '#5ec7ff', 0.24, seconds * 1.7, 0.14);
        drawBlob(radius * 0.75, '#d8f6ff', 0.2, seconds * 1.2, 0.1);
        for (let i = 0; i < 8; i++) { const a = (i * 61 + Math.floor(seconds * 20)) * Math.PI / 180; const d = radius * (0.52 + (i % 5) * 0.08 + Math.sin(seconds * 1.7 + i) * 0.03); ctx.fillStyle = 'rgba(180,235,255,0.55)'; ctx.beginPath(); ctx.arc(Math.cos(a) * d, Math.sin(a) * d, 1.3 + (i % 3) * 0.6, 0, Math.PI * 2); ctx.fill(); }
    }

    function drawBlob(radius, color, alpha, phase, jagged) {
        ctx.fillStyle = hexToRgba(color, alpha); ctx.beginPath();
        for (let i = 0; i <= 28; i++) { const t = i / 28; const a = t * Math.PI * 2; const n = 1 + Math.sin(a * 3 + phase) * jagged + Math.cos(a * 5 - phase * 0.7) * jagged * 0.6; const r = radius * n; const x = Math.cos(a) * r; const y = Math.sin(a) * r; if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
        ctx.closePath(); ctx.fill();
    }

    function drawLaserBeam(length, width, curved, seconds) {
        ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.shadowBlur = 18; ctx.shadowColor = '#ff3d68'; ctx.globalCompositeOperation = 'screen';
        if (curved) {
            const points = [{ x: 0, y: 0 }, { x: length * 0.26, y: Math.sin(seconds * 2) * 6 }, { x: length * 0.52, y: Math.sin(seconds * 2 + 0.9) * 11 }, { x: length * 0.76, y: Math.sin(seconds * 2 + 1.8) * 7 }, { x: length, y: Math.sin(seconds * 2 + 2.4) * 2 }];
            drawLaserPath(points, width, '#ff2f6d');
        } else {
            const beam = ctx.createLinearGradient(0, -width, 0, width); beam.addColorStop(0, 'rgba(255,47,109,0)'); beam.addColorStop(0.25, 'rgba(255,47,109,0.45)'); beam.addColorStop(0.5, 'rgba(255,255,255,0.85)'); beam.addColorStop(0.75, 'rgba(255,47,109,0.45)'); beam.addColorStop(1, 'rgba(255,47,109,0)'); ctx.fillStyle = beam; ctx.fillRect(0, -width, length, width * 2);
        }
        ctx.restore();
    }

    function drawLaserPath(points, width, color) {
        ctx.strokeStyle = hexToRgba(color, 0.34); ctx.lineWidth = width * 1.8; ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y); for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y); ctx.stroke();
        ctx.strokeStyle = hexToRgba(color, 0.8); ctx.lineWidth = width; ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y); for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.92)'; ctx.lineWidth = Math.max(2, width * 0.34); ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y); for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y); ctx.stroke();
    }
    function getPointerPoint(event) {
        const rect = el.canvas.getBoundingClientRect();
        return {
            x: (event.clientX - rect.left) * (el.canvas.width / rect.width),
            y: (event.clientY - rect.top) * (el.canvas.height / rect.height)
        };
    }

    function resetView() {
        state.view.zoom = 1;
        state.view.offsetX = 0;
        state.view.offsetY = 0;
        el.canvas.style.cursor = 'crosshair';
    }

    function handlePointerDown(event) {
        const point = getPointerPoint(event);
        const cfg = currentConfig();
        const scale = getSceneScale(cfg);
        const origin = getOrigin();
        const targetScreen = worldToScreen({ x: cfg.targetX, y: cfg.targetY }, scale, origin);
        const dist = Math.hypot(point.x - targetScreen.x, point.y - targetScreen.y);
        const overWeapon = isPointInActiveWeapon(point);

        state.pointerDown = true;
        state.dragMode = '';
        state.dragStart = null;
        if (event.button === 1 || event.button === 2 || state.spacePressed) {
            state.panningView = true;
            state.panStart = { x: point.x, y: point.y, offsetX: state.view.offsetX, offsetY: state.view.offsetY };
            el.canvas.style.cursor = 'grabbing';
            return;
        }

        if ((state.toolMode === 'auto' || state.toolMode === 'target') && dist <= 20) {
            state.draggingTarget = true;
            state.dragMode = 'target';
            return;
        }

        if (overWeapon && state.activeWeaponHandle) {
            if (state.toolMode === 'anchor') {
                state.dragMode = 'anchor';
                applyAnchorDrag(point);
                return;
            }
            if (state.toolMode === 'rotate') {
                state.dragMode = 'rotate';
                applyRotateDrag(point);
                return;
            }
            if (state.toolMode === 'scale') {
                state.dragMode = 'scale';
                state.dragStart = {
                    point: point,
                    size: cfg.size,
                    distance: Math.max(8, Math.hypot(point.x - state.activeWeaponHandle.screenX, point.y - state.activeWeaponHandle.screenY))
                };
                return;
            }
            state.dragMode = 'move';
            state.dragStart = {
                point: point,
                offsetX: cfg.offsetX,
                offsetY: cfg.offsetY,
                angle: state.activeWeaponHandle.totalAngle
            };
            return;
        }

        if (state.toolMode === 'auto' || state.toolMode === 'target') {
            const world = screenToWorld(point, scale, origin);
            cfg.targetX = Number(world.x.toFixed(1));
            cfg.targetY = Number(world.y.toFixed(1));
            applyConfigToForm(cfg);
        }
    }

    function handlePointerMove(event) {
        const point = getPointerPoint(event);
        const cfg = currentConfig();
        const scale = getSceneScale(cfg);
        const origin = getOrigin();

        if (state.panningView && state.panStart) {
            state.view.offsetX = state.panStart.offsetX + (point.x - state.panStart.x);
            state.view.offsetY = state.panStart.offsetY + (point.y - state.panStart.y);
            return;
        }

        if (state.draggingTarget || state.dragMode === 'target') {
            const world = screenToWorld(point, scale, origin);
            cfg.targetX = Number(world.x.toFixed(1));
            cfg.targetY = Number(world.y.toFixed(1));
            applyConfigToForm(cfg);
            return;
        }

        if (state.dragMode === 'move' && state.dragStart && state.activeWeaponHandle) {
            const delta = { x: point.x - state.dragStart.point.x, y: point.y - state.dragStart.point.y };
            const localDelta = inverseRotatePoint(delta.x, delta.y, state.dragStart.angle);
            cfg.offsetX = Number((state.dragStart.offsetX + localDelta.x).toFixed(2));
            cfg.offsetY = Number((state.dragStart.offsetY + localDelta.y).toFixed(2));
            applyConfigToForm(cfg);
            return;
        }

        if (state.dragMode === 'anchor' && state.activeWeaponHandle) {
            applyAnchorDrag(point);
            return;
        }

        if (state.dragMode === 'rotate' && state.activeWeaponHandle) {
            applyRotateDrag(point);
            return;
        }

        if (state.dragMode === 'scale' && state.dragStart && state.activeWeaponHandle) {
            const distance = Math.max(8, Math.hypot(point.x - state.activeWeaponHandle.screenX, point.y - state.activeWeaponHandle.screenY));
            cfg.size = Math.max(8, Number((state.dragStart.size * distance / state.dragStart.distance).toFixed(2)));
            applyConfigToForm(cfg);
            return;
        }

        const targetScreen = worldToScreen({ x: cfg.targetX, y: cfg.targetY }, scale, origin);
        const onTarget = Math.hypot(point.x - targetScreen.x, point.y - targetScreen.y) <= 20;
        const onWeapon = isPointInActiveWeapon(point);
        if (state.toolMode === 'rotate' && onWeapon) el.canvas.style.cursor = 'alias';
        else if (state.toolMode === 'scale' && onWeapon) el.canvas.style.cursor = 'nwse-resize';
        else if ((state.toolMode === 'anchor') && onWeapon) el.canvas.style.cursor = 'cell';
        else if ((state.toolMode === 'auto' || state.toolMode === 'move') && onWeapon) el.canvas.style.cursor = 'move';
        else if ((state.toolMode === 'auto' || state.toolMode === 'target') && onTarget) el.canvas.style.cursor = 'grab';
        else el.canvas.style.cursor = 'crosshair';
    }
    function handlePointerUp() {
        state.pointerDown = false;
        state.draggingTarget = false;
        state.panningView = false;
        state.panStart = null;
        state.dragMode = '';
        state.dragStart = null;
        el.canvas.style.cursor = 'crosshair';
    }

    function handleWheel(event) {
        event.preventDefault();
        const point = getPointerPoint(event);
        const cfg = currentConfig();
        if (isPointInActiveWeapon(point) && (state.toolMode === 'scale' || state.toolMode === 'auto' || event.ctrlKey || event.metaKey)) {
            cfg.size = Math.max(8, Number((cfg.size * (event.deltaY < 0 ? 1.08 : 0.92)).toFixed(2)));
            applyConfigToForm(cfg);
            return;
        }
        if (isPointInActiveWeapon(point) && (state.toolMode === 'rotate' || event.shiftKey)) {
            cfg.rotationDeg = Number((cfg.rotationDeg + (event.deltaY < 0 ? 4 : -4)).toFixed(2));
            applyConfigToForm(cfg);
            return;
        }
        const prevZoom = state.view.zoom;
        const delta = event.deltaY < 0 ? 1.1 : 0.9;
        const nextZoom = clamp(prevZoom * delta, 0.5, 3.2);
        if (nextZoom === prevZoom) return;
        const baseX = el.canvas.width * 0.38;
        const baseY = el.canvas.height * 0.64;
        state.view.offsetX = point.x - baseX - (point.x - baseX - state.view.offsetX) * (nextZoom / prevZoom);
        state.view.offsetY = point.y - baseY - (point.y - baseY - state.view.offsetY) * (nextZoom / prevZoom);
        state.view.zoom = nextZoom;
    }

    function applyAnchorDrag(point) {
        const cfg = currentConfig();
        const handle = state.activeWeaponHandle;
        const local = pointToWeaponLocal(point, handle);
        cfg.anchorX = Number(clamp((local.x - handle.left) / Math.max(1, handle.width), 0, 1).toFixed(3));
        cfg.anchorY = Number(clamp((local.y - handle.top) / Math.max(1, handle.height), 0, 1).toFixed(3));
        applyConfigToForm(cfg);
    }

    function applyRotateDrag(point) {
        const cfg = currentConfig();
        const handle = state.activeWeaponHandle;
        const pointerAngle = Math.atan2(point.y - handle.screenY, point.x - handle.screenX);
        cfg.rotationDeg = Number(radToDeg(pointerAngle - handle.baseAngleWithoutRotation).toFixed(2));
        applyConfigToForm(cfg);
    }

    function drawFrame() {
        drawScene((performance.now() - state.startTime) / 1000);
        requestAnimationFrame(drawFrame);
    }

    function init() {
        setupConstants();
        initDomRefs();
        state.configs = clonePresets();
        populateOptions();
        updateAdvancedPanels();
        updateToolButtons();
        bindEvents();
        setCurrentWeapon(state.currentKey);
        ensureSpriteLoaded(true);
        exportCurrent();
        requestAnimationFrame(drawFrame);
    }

    init();
})();
