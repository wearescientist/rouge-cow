const VIEWPORT = { width: 1706, height: 960 };
const ROOM = { width: 2000, height: 2000, wall: 120, door: 180 };
const RUNTIME_CANVAS = { width: 1706, height: 960 };
const ROOM_FRAME = { x: 469, y: 96, size: 768 };
const ROOM_SCALE = { value: ROOM_FRAME.size / ROOM.width };
const RUNTIME_LAYOUT = {
    source: "fallback",
    mainLayout: { x: 0, y: 0, width: VIEWPORT.width, height: VIEWPORT.height },
    leftSidebar: { x: 0, y: 0, width: 373, height: VIEWPORT.height },
    centerGame: { x: 373, y: 0, width: 960, height: VIEWPORT.height },
    arenaCore: { x: 469, y: 96, width: 768, height: 768 },
    rightSidebar: { x: 1333, y: 0, width: 373, height: VIEWPORT.height }
};
const RUNTIME_PROBE_URL = "../index.html";
const RUNTIME_PROBE_TIMEOUT_MS = 15000;
const FLOOR_BOUNDS = {
    left: ROOM.wall,
    top: ROOM.wall,
    right: ROOM.width - ROOM.wall,
    bottom: ROOM.height - ROOM.wall,
    width: ROOM.width - ROOM.wall * 2,
    height: ROOM.height - ROOM.wall * 2
};
const DOOR_LOGIC = { halfWidth: 40, halfHeight: 30 };
const PLAYER_REFERENCE = {
    width: 40,
    height: 40,
    asset: "../assets/sprites/player/variants_40x40/player_bison_frame01_stand_crop_40.png"
};
const DEFAULT_DOOR_LIGHT = {
    color: "#ffffff",
    intensity: 8,
    opacity: 0.9,
    length: 194,
    spread: 2.2,
    softness: 11,
    lip: 2
};

const DEFAULT_GUIDES = {
    grid: true,
    playArea: true,
    doors: true,
    walls: true,
    safeFrame: true,
    doorVisuals: true,
    player: true,
    snap: true
};

const CATEGORY_LABELS = {
    all: "全部",
    shell: "外壳",
    shell_stack: "叠壳",
    floor: "地板",
    door: "门",
    wall: "墙",
    decor: "装饰",
    foreground: "前景",
    local: "本地"
};

const LAYERS = [
    { id: "floor", name: "第1层 地板", space: "room", z: 120 },
    { id: "door", name: "门层", space: "room", z: 170 },
    { id: "wall", name: "墙体层", space: "room", z: 190 },
    { id: "decor", name: "装饰层", space: "room", z: 230 },
    { id: "shell_far", name: "第2层 深壳", space: "viewport", z: 520 },
    { id: "shell_mid", name: "第3层 中壳", space: "viewport", z: 535 },
    { id: "shell_primary", name: "第4层 主壳", space: "viewport", z: 550 },
    { id: "foreground", name: "前景层", space: "viewport", z: 565 },
    { id: "shell_fragments", name: "碎层", space: "viewport", z: 580 }
];

const SHELL_LAYER_IDS = ["shell_far", "shell_mid", "shell_primary", "shell_fragments"];
const SHELL_ROLE_TO_LAYER = {
    far: "shell_far",
    mid: "shell_mid",
    primary: "shell_primary",
    fragment: "shell_fragments"
};
const SHELL_STACK_PRESET = [
    { role: "primary", layerId: "shell_primary", scale: 1, rotation: 0, parallax: 0.18, opacity: 1, brightness: 1, contrast: 1, saturation: 1, innerCut: 0, innerFeather: 0 },
    { role: "mid", layerId: "shell_mid", scale: 0.814, rotation: -176, parallax: 0.18, opacity: 1, brightness: 0.5, contrast: 1, saturation: 1, innerCut: 0, innerFeather: 0 },
    { role: "far", layerId: "shell_far", scale: 0.643, rotation: 1, parallax: 0.18, opacity: 1, brightness: 0.2, contrast: 1, saturation: 1, innerCut: 0, innerFeather: 0 }
];
const SHELL_ROLE_LABELS = {
    none: "普通对象",
    primary: "主层",
    mid: "中层",
    far: "深层",
    fragment: "碎层"
};
const COLOR_PRESETS = {
    none: { tint: "#ffffff", tintOpacity: 0, brightness: 1, contrast: 1, saturation: 1 },
    bone: { tint: "#d9d0c2", tintOpacity: 0.28, brightness: 0.98, contrast: 0.94, saturation: 0.86 },
    cold: { tint: "#9cb7d6", tintOpacity: 0.32, brightness: 0.94, contrast: 0.96, saturation: 0.88 },
    moss: { tint: "#8eaa7f", tintOpacity: 0.32, brightness: 0.96, contrast: 0.94, saturation: 0.92 },
    warm: { tint: "#b68f72", tintOpacity: 0.3, brightness: 0.96, contrast: 0.95, saturation: 0.9 },
    danger: { tint: "#b66b72", tintOpacity: 0.34, brightness: 0.92, contrast: 1.02, saturation: 0.9 }
};

const FLOOR_ASSET_BY_THEME = {
    mycelium: "floor_l1",
    greenhouse: "floor_l2",
    nerve: "floor_l3",
    furnace: "floor_l4",
    courtyard: "floor_l5",
    core: "floor_l6"
};

const SHELL_THEME_PRESETS = {
    greenhouse: {
        floorAssetId: "floor_l2",
        assetIds: {
            shell_far: "shell_f2_greenhouse_far",
            shell_mid: "shell_f2_greenhouse_mid",
            shell_primary: "shell_f2_greenhouse_primary"
        },
        layers: {
            shell_far: { tint: "#ffffff", tintOpacity: 0, brightness: 1, contrast: 1, saturation: 1, hue: 0 },
            shell_mid: { tint: "#ffffff", tintOpacity: 0, brightness: 1, contrast: 1, saturation: 1, hue: 0 },
            shell_primary: { tint: "#ffffff", tintOpacity: 0, brightness: 1, contrast: 1, saturation: 1, hue: 0 }
        }
    },
    nerve: {
        floorAssetId: "floor_l3",
        assetIds: {
            shell_far: "shell_f3_nerve_far",
            shell_mid: "shell_f3_nerve_mid",
            shell_primary: "shell_f3_nerve_primary"
        },
        layers: {
            shell_far: { tint: "#ffffff", tintOpacity: 0, brightness: 1, contrast: 1, saturation: 1, hue: 0 },
            shell_mid: { tint: "#ffffff", tintOpacity: 0, brightness: 1, contrast: 1, saturation: 1, hue: 0 },
            shell_primary: { tint: "#ffffff", tintOpacity: 0, brightness: 1, contrast: 1, saturation: 1, hue: 0 }
        }
    },
    furnace: {
        floorAssetId: "floor_l4",
        assetIds: {
            shell_far: "shell_f4_furnace_far",
            shell_mid: "shell_f4_furnace_mid",
            shell_primary: "shell_f4_furnace_primary"
        },
        layers: {
            shell_far: { tint: "#ffffff", tintOpacity: 0, brightness: 1, contrast: 1, saturation: 1, hue: 0 },
            shell_mid: { tint: "#ffffff", tintOpacity: 0, brightness: 1, contrast: 1, saturation: 1, hue: 0 },
            shell_primary: { tint: "#ffffff", tintOpacity: 0, brightness: 1, contrast: 1, saturation: 1, hue: 0 }
        }
    },
    courtyard: {
        floorAssetId: "floor_l5",
        assetIds: {
            shell_far: "shell_f5_courtyard_far",
            shell_mid: "shell_f5_courtyard_mid",
            shell_primary: "shell_f5_courtyard_primary"
        },
        layers: {
            shell_far: { tint: "#ffffff", tintOpacity: 0, brightness: 1, contrast: 1, saturation: 1, hue: 0 },
            shell_mid: { tint: "#ffffff", tintOpacity: 0, brightness: 1, contrast: 1, saturation: 1, hue: 0 },
            shell_primary: { tint: "#ffffff", tintOpacity: 0, brightness: 1, contrast: 1, saturation: 1, hue: 0 }
        }
    },
    core: {
        floorAssetId: "floor_l6",
        assetIds: {
            shell_far: "shell_f6_core_far",
            shell_mid: "shell_f6_core_mid",
            shell_primary: "shell_f6_core_primary"
        },
        layers: {
            shell_far: { tint: "#ffffff", tintOpacity: 0, brightness: 1, contrast: 1, saturation: 1, hue: 0 },
            shell_mid: { tint: "#ffffff", tintOpacity: 0, brightness: 1, contrast: 1, saturation: 1, hue: 0 },
            shell_primary: { tint: "#ffffff", tintOpacity: 0, brightness: 1, contrast: 1, saturation: 1, hue: 0 }
        }
    }
};

const BUILTIN_ASSETS = [
    { id: "shell_f1_trial_primary", name: "Back 主壳(大开口)", path: "../assets/sprites/tiles/back_organic_primary.png", category: "shell", layerId: "shell_primary", space: "viewport", width: 2219, height: 2219, defaultScaleY: 0.9 },
    { id: "shell_f1_trial_mid", name: "Back 中壳(中开口)", path: "../assets/sprites/tiles/back_organic_mid.png", category: "shell", layerId: "shell_mid", space: "viewport", width: 2219, height: 2219, defaultScaleY: 0.9 },
    { id: "shell_f1_trial_far", name: "Back 深壳(小开口)", path: "../assets/sprites/tiles/back_organic_far.png", category: "shell", layerId: "shell_far", space: "viewport", width: 2219, height: 2219, defaultScaleY: 0.9 },
    { id: "shell_f1_a_primary", name: "F1 壳 A 主壳", path: "../assets/sprites/background/F1_BG_A_fullscene_shell_16x9_organic_primary.png", category: "shell", layerId: "shell_primary", space: "viewport", width: 1920, height: 1920 },
    { id: "shell_f1_a_mid", name: "F1 壳 A 中壳", path: "../assets/sprites/background/F1_BG_A_fullscene_shell_16x9_organic_mid.png", category: "shell", layerId: "shell_mid", space: "viewport", width: 1920, height: 1920 },
    { id: "shell_f1_a_far", name: "F1 壳 A 深壳", path: "../assets/sprites/background/F1_BG_A_fullscene_shell_16x9_organic_far.png", category: "shell", layerId: "shell_far", space: "viewport", width: 1920, height: 1920 },
    { id: "shell_f1_b_primary", name: "F1 壳 B 主壳", path: "../assets/sprites/background/F1_BG_B_fullscene_shell_16x9_organic_primary.png", category: "shell", layerId: "shell_primary", space: "viewport", width: 1920, height: 1920 },
    { id: "shell_f1_b_mid", name: "F1 壳 B 中壳", path: "../assets/sprites/background/F1_BG_B_fullscene_shell_16x9_organic_mid.png", category: "shell", layerId: "shell_mid", space: "viewport", width: 1920, height: 1920 },
    { id: "shell_f1_b_far", name: "F1 壳 B 深壳", path: "../assets/sprites/background/F1_BG_B_fullscene_shell_16x9_organic_far.png", category: "shell", layerId: "shell_far", space: "viewport", width: 1920, height: 1920 },
    { id: "shell_f1_c_primary", name: "F1 壳 C 主壳", path: "../assets/sprites/background/F1_BG_C_fullscene_shell_16x9_organic_primary.png", category: "shell", layerId: "shell_primary", space: "viewport", width: 1920, height: 1920 },
    { id: "shell_f1_c_mid", name: "F1 壳 C 中壳", path: "../assets/sprites/background/F1_BG_C_fullscene_shell_16x9_organic_mid.png", category: "shell", layerId: "shell_mid", space: "viewport", width: 1920, height: 1920 },
    { id: "shell_f1_c_far", name: "F1 壳 C 深壳", path: "../assets/sprites/background/F1_BG_C_fullscene_shell_16x9_organic_far.png", category: "shell", layerId: "shell_far", space: "viewport", width: 1920, height: 1920 },
    { id: "shell_f1_d_primary", name: "F1 壳 D 主壳", path: "../assets/sprites/background/F1_BG_D_fullscene_shell_16x9_organic_primary.png", category: "shell", layerId: "shell_primary", space: "viewport", width: 1920, height: 1920 },
    { id: "shell_f1_d_mid", name: "F1 壳 D 中壳", path: "../assets/sprites/background/F1_BG_D_fullscene_shell_16x9_organic_mid.png", category: "shell", layerId: "shell_mid", space: "viewport", width: 1920, height: 1920 },
    { id: "shell_f1_d_far", name: "F1 壳 D 深壳", path: "../assets/sprites/background/F1_BG_D_fullscene_shell_16x9_organic_far.png", category: "shell", layerId: "shell_far", space: "viewport", width: 1920, height: 1920 },
    { id: "shell_f1_e_primary", name: "F1 壳 E 主壳", path: "../assets/sprites/background/F1_BG_E_fullscene_shell_16x9_organic_primary.png", category: "shell", layerId: "shell_primary", space: "viewport", width: 1920, height: 1920 },
    { id: "shell_f1_e_mid", name: "F1 壳 E 中壳", path: "../assets/sprites/background/F1_BG_E_fullscene_shell_16x9_organic_mid.png", category: "shell", layerId: "shell_mid", space: "viewport", width: 1920, height: 1920 },
    { id: "shell_f1_e_far", name: "F1 壳 E 深壳", path: "../assets/sprites/background/F1_BG_E_fullscene_shell_16x9_organic_far.png", category: "shell", layerId: "shell_far", space: "viewport", width: 1920, height: 1920 },
    { id: "shell_f2_greenhouse_primary", name: "F2 温室 主壳", path: "../assets/sprites/tiles/floor_shells/floor2_shell_greenhouse_primary.png", category: "shell", layerId: "shell_primary", space: "viewport", width: 2219, height: 2219, defaultScaleY: 0.9 },
    { id: "shell_f2_greenhouse_mid", name: "F2 温室 中壳", path: "../assets/sprites/tiles/floor_shells/floor2_shell_greenhouse_mid.png", category: "shell", layerId: "shell_mid", space: "viewport", width: 2219, height: 2219, defaultScaleY: 0.9 },
    { id: "shell_f2_greenhouse_far", name: "F2 温室 深壳", path: "../assets/sprites/tiles/floor_shells/floor2_shell_greenhouse_far.png", category: "shell", layerId: "shell_far", space: "viewport", width: 2219, height: 2219, defaultScaleY: 0.9 },
    { id: "shell_f3_nerve_primary", name: "F3 神经 主壳", path: "../assets/sprites/tiles/floor_shells/floor3_shell_nerve_primary.png", category: "shell", layerId: "shell_primary", space: "viewport", width: 2219, height: 2219, defaultScaleY: 0.9 },
    { id: "shell_f3_nerve_mid", name: "F3 神经 中壳", path: "../assets/sprites/tiles/floor_shells/floor3_shell_nerve_mid.png", category: "shell", layerId: "shell_mid", space: "viewport", width: 2219, height: 2219, defaultScaleY: 0.9 },
    { id: "shell_f3_nerve_far", name: "F3 神经 深壳", path: "../assets/sprites/tiles/floor_shells/floor3_shell_nerve_far.png", category: "shell", layerId: "shell_far", space: "viewport", width: 2219, height: 2219, defaultScaleY: 0.9 },
    { id: "shell_f4_furnace_primary", name: "F4 熔炉 主壳", path: "../assets/sprites/tiles/floor_shells/floor4_shell_furnace_primary.png", category: "shell", layerId: "shell_primary", space: "viewport", width: 2219, height: 2219, defaultScaleY: 0.9 },
    { id: "shell_f4_furnace_mid", name: "F4 熔炉 中壳", path: "../assets/sprites/tiles/floor_shells/floor4_shell_furnace_mid.png", category: "shell", layerId: "shell_mid", space: "viewport", width: 2219, height: 2219, defaultScaleY: 0.9 },
    { id: "shell_f4_furnace_far", name: "F4 熔炉 深壳", path: "../assets/sprites/tiles/floor_shells/floor4_shell_furnace_far.png", category: "shell", layerId: "shell_far", space: "viewport", width: 2219, height: 2219, defaultScaleY: 0.9 },
    { id: "shell_f5_courtyard_primary", name: "F5 庭院 主壳", path: "../assets/sprites/tiles/floor_shells/floor5_shell_courtyard_primary.png", category: "shell", layerId: "shell_primary", space: "viewport", width: 2219, height: 2219, defaultScaleY: 0.9 },
    { id: "shell_f5_courtyard_mid", name: "F5 庭院 中壳", path: "../assets/sprites/tiles/floor_shells/floor5_shell_courtyard_mid.png", category: "shell", layerId: "shell_mid", space: "viewport", width: 2219, height: 2219, defaultScaleY: 0.9 },
    { id: "shell_f5_courtyard_far", name: "F5 庭院 深壳", path: "../assets/sprites/tiles/floor_shells/floor5_shell_courtyard_far.png", category: "shell", layerId: "shell_far", space: "viewport", width: 2219, height: 2219, defaultScaleY: 0.9 },
    { id: "shell_f6_core_primary", name: "F6 核心 主壳", path: "../assets/sprites/tiles/floor_shells/floor6_shell_core_primary.png", category: "shell", layerId: "shell_primary", space: "viewport", width: 2219, height: 2219, defaultScaleY: 0.9 },
    { id: "shell_f6_core_mid", name: "F6 核心 中壳", path: "../assets/sprites/tiles/floor_shells/floor6_shell_core_mid.png", category: "shell", layerId: "shell_mid", space: "viewport", width: 2219, height: 2219, defaultScaleY: 0.9 },
    { id: "shell_f6_core_far", name: "F6 核心 深壳", path: "../assets/sprites/tiles/floor_shells/floor6_shell_core_far.png", category: "shell", layerId: "shell_far", space: "viewport", width: 2219, height: 2219, defaultScaleY: 0.9 },
    { id: "floor_l1", name: "L1 地板", path: "../assets/sprites/tiles/floors/layer1_floor_mycelium.png", category: "floor", layerId: "floor", space: "room", width: 1760, height: 1760 },
    { id: "floor_l2", name: "L2 地板", path: "../assets/sprites/tiles/floors/layer2_floor_greenhouse.png", category: "floor", layerId: "floor", space: "room", width: 1760, height: 1760 },
    { id: "floor_l3", name: "L3 地板", path: "../assets/sprites/tiles/floors/layer3_floor_nerve.png", category: "floor", layerId: "floor", space: "room", width: 1760, height: 1760 },
    { id: "floor_l4", name: "L4 地板", path: "../assets/sprites/tiles/floors/layer4_floor_furnace.png", category: "floor", layerId: "floor", space: "room", width: 1760, height: 1760 },
    { id: "floor_l5", name: "L5 地板", path: "../assets/sprites/tiles/floors/layer5_floor_courtyard.png", category: "floor", layerId: "floor", space: "room", width: 1760, height: 1760 },
    { id: "floor_l6", name: "L6 地板", path: "../assets/sprites/tiles/floors/layer6_floor_core.png", category: "floor", layerId: "floor", space: "room", width: 1760, height: 1760 },
    { id: "wall_l1_base", name: "L1 墙基底", path: "../assets/sprites/tiles/layer1/wall/layer1_wall_base.png", category: "wall", layerId: "wall", space: "room", width: 1760, height: 1760 },
    { id: "wall_l1_top", name: "L1 墙上沿", path: "../assets/sprites/tiles/layer1/wall/layer1_wall_top.png", category: "wall", layerId: "wall", space: "room", width: 1760, height: 420 },
    { id: "wall_l1_bottom", name: "L1 墙下沿", path: "../assets/sprites/tiles/layer1/wall/layer1_wall_bottom.png", category: "wall", layerId: "wall", space: "room", width: 1760, height: 420 },
    { id: "door_closed_l1", name: "L1 关门", path: "../assets/sprites/tiles/layer1/door/layer1_door_normal_closed.png", category: "door", layerId: "door", space: "room", width: 180, height: 180 },
    { id: "door_open_l1", name: "L1 开门", path: "../assets/sprites/tiles/layer1/door/layer1_door_normal_open.png", category: "door", layerId: "door", space: "room", width: 180, height: 180 },
    { id: "door_boss_l1", name: "L1 Boss 门", path: "../assets/sprites/tiles/layer1/door/layer1_door_boss_closed.png", category: "door", layerId: "door", space: "room", width: 180, height: 180 },
    { id: "door_secret_l1", name: "L1 隐藏门", path: "../assets/sprites/tiles/layer1/door/layer1_door_secret.png", category: "door", layerId: "door", space: "room", width: 180, height: 180 },
    { id: "fragment_f1_decor_a", name: "F1 前景碎片 A", path: "../assets/sprites/background/F1_DEC_A_environment_sheet.png", category: "foreground", layerId: "shell_fragments", space: "viewport", width: 900, height: 500 },
    { id: "fragment_f1_decor_b", name: "F1 前景碎片 B", path: "../assets/sprites/background/F1_DEC_B_environment_sheet.png", category: "foreground", layerId: "shell_fragments", space: "viewport", width: 900, height: 500 }
];

const STORAGE_KEY = "scene-art-workbench-v2";
const dom = {};
const imageCache = new Map();
const expandedImageCache = new Map();
const expandedImagePromises = new Map();
let pendingExpandedRender = false;

const state = {
    zoom: 1,
    tool: "select",
    sidebar: "assets",
    inspectorCard: "quick",
    canvasCard: "tools",
    shellFocus: false,
    assetCategory: "all",
    assetSearch: "",
    guides: { ...DEFAULT_GUIDES },
    selectedLayerId: "shell_primary",
    items: [],
    customAssets: [],
    selectedIds: [],
    activeId: null,
    pointer: null,
    history: [],
    future: [],
    layerState: Object.fromEntries(LAYERS.map((layer) => [layer.id, { visible: true, locked: false, opacity: 1 }])),
    doorLight: { ...DEFAULT_DOOR_LIGHT },
    layerNodes: {},
    status: "就绪。~Meow"
};

let idCounter = 1;

function $(id) {
    return document.getElementById(id);
}

function qsa(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
}

function cloneAssetForItem(item, asset) {
    return { ...asset, path: asset.path };
}

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function round(value, precision = 1) {
    const factor = 10 ** precision;
    return Math.round(value * factor) / factor;
}

function computeFallbackLayout(width, height) {
    const arenaWidth = width * 0.5625;
    const sideWidth = (width - arenaWidth) / 2;
    const arenaCoreSize = Math.min(arenaWidth * 0.8, height * 0.8);
    const arenaCoreX = sideWidth + (arenaWidth - arenaCoreSize) / 2;
    const arenaCoreY = (height - arenaCoreSize) / 2;
    return {
        source: "fallback",
        mainLayout: { x: 0, y: 0, width, height },
        leftSidebar: { x: 0, y: 0, width: sideWidth, height },
        centerGame: { x: sideWidth, y: 0, width: arenaWidth, height },
        arenaCore: { x: arenaCoreX, y: arenaCoreY, width: arenaCoreSize, height: arenaCoreSize },
        rightSidebar: { x: sideWidth + arenaWidth, y: 0, width: sideWidth, height }
    };
}

function cloneRect(rect) {
    return {
        x: round(rect.x, 2),
        y: round(rect.y, 2),
        width: round(rect.width, 2),
        height: round(rect.height, 2)
    };
}

function scaleViewportItems(previousWidth, previousHeight, nextWidth, nextHeight) {
    if (!previousWidth || !previousHeight || (previousWidth === nextWidth && previousHeight === nextHeight)) {
        return;
    }
    const scaleX = nextWidth / previousWidth;
    const scaleY = nextHeight / previousHeight;
    state.items = state.items.map((item) => {
        if (item.space !== "viewport") {
            return item;
        }
        return {
            ...item,
            x: round(item.x * scaleX, 1),
            y: round(item.y * scaleY, 1),
            width: round(item.width * scaleX, 1),
            height: round(item.height * scaleY, 1)
        };
    });
}

function applyLayoutSnapshot(snapshot) {
    const previousWidth = VIEWPORT.width;
    const previousHeight = VIEWPORT.height;
    const next = {
        source: snapshot.source || "runtime",
        mainLayout: cloneRect(snapshot.mainLayout),
        leftSidebar: cloneRect(snapshot.leftSidebar),
        centerGame: cloneRect(snapshot.centerGame),
        arenaCore: cloneRect(snapshot.arenaCore),
        rightSidebar: cloneRect(snapshot.rightSidebar)
    };

    scaleViewportItems(previousWidth, previousHeight, next.mainLayout.width, next.mainLayout.height);

    VIEWPORT.width = next.mainLayout.width;
    VIEWPORT.height = next.mainLayout.height;
    RUNTIME_CANVAS.width = next.mainLayout.width;
    RUNTIME_CANVAS.height = next.mainLayout.height;
    ROOM_FRAME.x = next.arenaCore.x;
    ROOM_FRAME.y = next.arenaCore.y;
    ROOM_FRAME.size = next.arenaCore.width;
    ROOM_SCALE.value = ROOM_FRAME.size / ROOM.width;

    Object.assign(RUNTIME_LAYOUT, next);

    if (dom.runtimeLayoutStatus) {
        const sourceLabel = next.source === "runtime" ? "游戏真实布局" : "CSS 回退布局";
        dom.runtimeLayoutStatus.textContent = `布局来源：${sourceLabel} / 主画面 ${Math.round(next.mainLayout.width)}x${Math.round(next.mainLayout.height)} / 战斗区 ${Math.round(next.arenaCore.width)}x${Math.round(next.arenaCore.height)}`;
    }
}

function readRect(doc, id, rootRect) {
    const node = doc.getElementById(id);
    if (!node) {
        throw new Error(`missing node: ${id}`);
    }
    const rect = node.getBoundingClientRect();
    return {
        x: rect.left - rootRect.left,
        y: rect.top - rootRect.top,
        width: rect.width,
        height: rect.height
    };
}

function extractRuntimeLayoutFromDocument(doc) {
    const layout = doc.getElementById("mainLayout");
    if (!layout) {
        throw new Error("missing node: mainLayout");
    }
    layout.classList.add("active");
    layout.style.display = "block";
    const loading = doc.getElementById("loading");
    if (loading) {
        loading.style.display = "none";
        loading.classList.add("hidden");
    }
    ["speedControl", "devControlPanel"].forEach((id) => {
        const node = doc.getElementById(id);
        if (node) {
            node.style.display = "none";
        }
    });

    const rootRect = layout.getBoundingClientRect();
    if (!rootRect.width || !rootRect.height) {
        throw new Error("mainLayout rect is zero");
    }

    return {
        source: "runtime",
        mainLayout: { x: 0, y: 0, width: rootRect.width, height: rootRect.height },
        leftSidebar: readRect(doc, "leftSidebar", rootRect),
        centerGame: readRect(doc, "centerGame", rootRect),
        arenaCore: readRect(doc, "arenaCore", rootRect),
        rightSidebar: readRect(doc, "rightSidebar", rootRect)
    };
}

function createId(prefix) {
    idCounter += 1;
    return `${prefix}_${Date.now().toString(36)}_${idCounter}`;
}

function createHistorySnapshot() {
    return JSON.stringify({
        zoom: state.zoom,
        tool: state.tool,
        sidebar: state.sidebar,
        assetCategory: state.assetCategory,
        assetSearch: state.assetSearch,
        guides: state.guides,
        selectedLayerId: state.selectedLayerId,
        items: state.items,
        customAssets: state.customAssets,
        selectedIds: state.selectedIds,
        activeId: state.activeId,
        layerState: state.layerState,
        doorLight: state.doorLight
    });
}

function applyHistorySnapshot(raw) {
    const parsed = JSON.parse(raw);
    state.zoom = clamp(Number(parsed.zoom) || 1, 0.35, 1.5);
    state.tool = parsed.tool || "select";
    state.sidebar = parsed.sidebar || "assets";
    state.assetCategory = parsed.assetCategory || "all";
    state.assetSearch = parsed.assetSearch || "";
    state.guides = { ...DEFAULT_GUIDES, ...(parsed.guides || {}) };
    state.selectedLayerId = normalizeLayerId(parsed.selectedLayerId || "shell_primary");
    state.items = Array.isArray(parsed.items) ? parsed.items.map(normalizeItem) : [];
    state.customAssets = Array.isArray(parsed.customAssets) ? parsed.customAssets : [];
    state.selectedIds = Array.isArray(parsed.selectedIds) ? parsed.selectedIds : [];
    state.activeId = parsed.activeId || null;
    state.layerState = { ...state.layerState, ...(parsed.layerState || {}) };
    state.doorLight = { ...DEFAULT_DOOR_LIGHT, ...(parsed.doorLight || {}) };
}

function commitHistory() {
    state.history.push(createHistorySnapshot());
    if (state.history.length > 80) {
        state.history.shift();
    }
    state.future = [];
}

function undoHistory() {
    if (!state.history.length) {
        state.status = "没有可撤销的操作。~Meow";
        renderStatus();
        return;
    }
    state.future.push(createHistorySnapshot());
    const snapshot = state.history.pop();
    applyHistorySnapshot(snapshot);
    state.status = "已撤销。~Meow";
    render();
}

function redoHistory() {
    if (!state.future.length) {
        state.status = "没有可重做的操作。~Meow";
        renderStatus();
        return;
    }
    state.history.push(createHistorySnapshot());
    const snapshot = state.future.pop();
    applyHistorySnapshot(snapshot);
    state.status = "已重做。~Meow";
    render();
}

function assetList() {
    return [...BUILTIN_ASSETS, ...state.customAssets];
}

function getAsset(assetId) {
    return assetList().find((asset) => asset.id === assetId) || null;
}

function getLayer(layerId) {
    return LAYERS.find((layer) => layer.id === layerId) || LAYERS[0];
}

function normalizeLayerId(layerId) {
    if (layerId === "shell") {
        return "shell_primary";
    }
    return layerId;
}

function getItem(itemId) {
    return state.items.find((item) => item.id === itemId) || null;
}

function activeItem() {
    return getItem(state.activeId);
}

function isRoomSpace(space) {
    return space === "room";
}

function isShellLayer(layerId) {
    return SHELL_LAYER_IDS.includes(layerId);
}

function isShellItem(item) {
    return !!item && isShellLayer(item.layerId);
}

function clampCut(value) {
    return clamp(round(value, 3), 0, 0.48);
}

function getCutInsets(item) {
    const base = clampCut(Number(item.innerCut) || 0);
    return {
        top: clampCut(base + (Number(item.cutBiasTop) || 0)),
        right: clampCut(base + (Number(item.cutBiasRight) || 0)),
        bottom: clampCut(base + (Number(item.cutBiasBottom) || 0)),
        left: clampCut(base + (Number(item.cutBiasLeft) || 0))
    };
}

function createMaskBand(direction, inset, feather) {
    if (inset <= 0.001) {
        return "linear-gradient(rgba(0,0,0,0), rgba(0,0,0,0))";
    }

    const start = Math.max(0, inset - feather);
    const end = Math.min(100, inset + feather);
    if (direction === "top") {
        return `linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,1) ${start}%, rgba(0,0,0,0) ${end}%, rgba(0,0,0,0) 100%)`;
    }
    if (direction === "bottom") {
        return `linear-gradient(to top, rgba(0,0,0,1) 0%, rgba(0,0,0,1) ${start}%, rgba(0,0,0,0) ${end}%, rgba(0,0,0,0) 100%)`;
    }
    if (direction === "left") {
        return `linear-gradient(to right, rgba(0,0,0,1) 0%, rgba(0,0,0,1) ${start}%, rgba(0,0,0,0) ${end}%, rgba(0,0,0,0) 100%)`;
    }
    return `linear-gradient(to left, rgba(0,0,0,1) 0%, rgba(0,0,0,1) ${start}%, rgba(0,0,0,0) ${end}%, rgba(0,0,0,0) 100%)`;
}

function buildInnerCutMask(item) {
    if (!isShellItem(item)) {
        return "";
    }

    const insets = getCutInsets(item);
    const feather = clamp(round((Number(item.innerFeather) || 0) * 100, 2), 0, 18);
    const top = round(insets.top * 100, 2);
    const right = round(insets.right * 100, 2);
    const bottom = round(insets.bottom * 100, 2);
    const left = round(insets.left * 100, 2);

    if (top <= 0 && right <= 0 && bottom <= 0 && left <= 0) {
        return "";
    }

    return [
        createMaskBand("top", top, feather),
        createMaskBand("right", right, feather),
        createMaskBand("bottom", bottom, feather),
        createMaskBand("left", left, feather)
    ].join(",");
}

function loadImageElement(src) {
    if (imageCache.has(src)) {
        return imageCache.get(src);
    }
    const promise = new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
    });
    imageCache.set(src, promise);
    return promise;
}

function dilateTransparentRegion(alphaMask, width, height, iterations) {
    let current = alphaMask;
    for (let step = 0; step < iterations; step += 1) {
        const next = new Uint8Array(current);
        for (let y = 0; y < height; y += 1) {
            const row = y * width;
            for (let x = 0; x < width; x += 1) {
                const index = row + x;
                if (current[index]) {
                    continue;
                }
                const left = x > 0 ? index - 1 : index;
                const right = x < width - 1 ? index + 1 : index;
                const up = y > 0 ? index - width : index;
                const down = y < height - 1 ? index + width : index;
                if (!current[left] || !current[right] || !current[up] || !current[down]) {
                    next[index] = 0;
                }
            }
        }
        current = next;
    }
    return current;
}

async function getExpandedImageSource(assetPath, expandPx) {
    const clamped = Math.max(0, Math.min(12, Math.round(expandPx || 0)));
    if (!clamped) {
        return assetPath;
    }
    const cacheKey = `${assetPath}::${clamped}`;
    if (expandedImageCache.has(cacheKey)) {
        return expandedImageCache.get(cacheKey);
    }
    if (expandedImagePromises.has(cacheKey)) {
        return expandedImagePromises.get(cacheKey);
    }

    const pending = loadImageElement(assetPath).then((img) => {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const alphaMask = new Uint8Array(canvas.width * canvas.height);
        for (let i = 0; i < alphaMask.length; i += 1) {
            alphaMask[i] = imageData.data[i * 4 + 3] > 0 ? 1 : 0;
        }
        const expanded = dilateTransparentRegion(alphaMask, canvas.width, canvas.height, clamped);
        for (let i = 0; i < expanded.length; i += 1) {
            if (!expanded[i]) {
                imageData.data[i * 4 + 3] = 0;
            }
        }
        ctx.putImageData(imageData, 0, 0);
        const dataUrl = canvas.toDataURL("image/png");
        expandedImageCache.set(cacheKey, dataUrl);
        expandedImagePromises.delete(cacheKey);
        return dataUrl;
    }).catch(() => {
        expandedImagePromises.delete(cacheKey);
        return assetPath;
    });

    expandedImagePromises.set(cacheKey, pending);
    return pending;
}

function resolveItemAssetSource(item, asset) {
    if (!isShellItem(item) || !(item.innerExpandPx > 0)) {
        return asset.path;
    }
    const cacheKey = `${asset.path}::${Math.round(item.innerExpandPx)}`;
    if (expandedImageCache.has(cacheKey)) {
        return expandedImageCache.get(cacheKey);
    }
    getExpandedImageSource(asset.path, item.innerExpandPx).then(() => {
        if (pendingExpandedRender) {
            return;
        }
        pendingExpandedRender = true;
        window.requestAnimationFrame(() => {
            pendingExpandedRender = false;
            renderItems();
        });
    });
    return asset.path;
}

function roomPx(value) {
    return value * ROOM_SCALE.value;
}

function scenePointFromClient(clientX, clientY) {
    const rect = dom.sceneRoot.getBoundingClientRect();
    return {
        x: (clientX - rect.left) / state.zoom,
        y: (clientY - rect.top) / state.zoom
    };
}

function toScreenRect(item) {
    if (isRoomSpace(item.space)) {
        return {
            x: ROOM_FRAME.x + roomPx(item.x),
            y: ROOM_FRAME.y + roomPx(item.y),
            width: roomPx(item.width),
            height: roomPx(item.height)
        };
    }

    return { x: item.x, y: item.y, width: item.width, height: item.height };
}

function screenToSpace(rect, space) {
    if (isRoomSpace(space)) {
        return {
            x: (rect.x - ROOM_FRAME.x) / ROOM_SCALE.value,
            y: (rect.y - ROOM_FRAME.y) / ROOM_SCALE.value,
            width: rect.width / ROOM_SCALE.value,
            height: rect.height / ROOM_SCALE.value
        };
    }

    return { ...rect };
}

function getPlayAreaRect() {
    return {
        x: ROOM_FRAME.x + roomPx(FLOOR_BOUNDS.left),
        y: ROOM_FRAME.y + roomPx(FLOOR_BOUNDS.top),
        width: roomPx(FLOOR_BOUNDS.width),
        height: roomPx(FLOOR_BOUNDS.height)
    };
}

function getRectIntersectionArea(a, b) {
    const overlapW = Math.max(0, Math.min(a.x + a.width, b.x + b.width) - Math.max(a.x, b.x));
    const overlapH = Math.max(0, Math.min(a.y + a.height, b.y + b.height) - Math.max(a.y, b.y));
    return overlapW * overlapH;
}

function shellIntrusionRatio(item) {
    if (!isShellItem(item)) {
        return 0;
    }

    const rect = toScreenRect(item);
    const overlap = getRectIntersectionArea(rect, getPlayAreaRect());
    if (overlap <= 0) {
        return 0;
    }

    const insets = getCutInsets(item);
    const safeWidth = rect.width * Math.max(0, 1 - insets.left - insets.right);
    const safeHeight = rect.height * Math.max(0, 1 - insets.top - insets.bottom);
    const safeArea = Math.max(1, safeWidth * safeHeight);
    return round(Math.min(1, overlap / safeArea), 3);
}

function getShellPresetByRole(role) {
    return SHELL_STACK_PRESET.find((preset) => preset.role === role) || null;
}

function describeIntrusion(ratio) {
    if (ratio <= 0.08) {
        return { level: "good", text: "安全，中间区域基本干净。~Meow" };
    }
    if (ratio <= 0.18) {
        return { level: "warn", text: "轻度侵入，建议再清一点中间。~Meow" };
    }
    return { level: "danger", text: "侵入过多，中间战斗区会被吃脏。~Meow" };
}

function shellItems() {
    return state.items.filter((item) => isShellItem(item));
}

function defaultPlacementForAsset(asset) {
    const width = round(asset.width * (asset.defaultScaleX || 1), 1);
    const height = round(asset.height * (asset.defaultScaleY || 1), 1);
    if (isRoomSpace(asset.space)) {
        return {
            x: round((ROOM.width - width) / 2, 1),
            y: round((ROOM.height - height) / 2, 1),
            width,
            height
        };
    }

    if (isShellLayer(asset.layerId)) {
        return {
            x: round((VIEWPORT.width - width) / 2, 1),
            y: round((VIEWPORT.height - height) / 2, 1),
            width,
            height
        };
    }

    return {
        x: round((VIEWPORT.width - width) / 2, 1),
        y: round((VIEWPORT.height - height) / 2, 1),
        width,
        height
    };
}

function createItemFromAsset(asset, overrides = {}) {
    const base = defaultPlacementForAsset(asset);
    return {
        id: createId("item"),
        assetId: asset.id,
        name: asset.name,
        layerId: asset.layerId,
        space: asset.space,
        x: base.x,
        y: base.y,
        width: base.width,
        height: base.height,
        rotation: 0,
        opacity: 1,
        blendMode: "normal",
        brightness: 1,
        contrast: 1,
        saturation: 1,
        hue: 0,
        tint: "#ffffff",
        tintOpacity: 0,
        parallax: asset.space === "viewport" ? 0.18 : 0,
        innerExpandPx: 0,
        innerCut: 0,
        innerFeather: 0,
        cutBiasTop: 0,
        cutBiasRight: 0,
        cutBiasBottom: 0,
        cutBiasLeft: 0,
        shellRole: SHELL_LAYER_IDS.includes(asset.layerId)
            ? (Object.entries(SHELL_ROLE_TO_LAYER).find(([, layerId]) => layerId === asset.layerId)?.[0] || "primary")
            : "none",
        ...overrides
    };
}

function normalizeItem(item) {
    const layerId = normalizeLayerId(item.layerId || "decor");
    const shellRole = item.shellRole || (isShellLayer(layerId)
        ? (Object.entries(SHELL_ROLE_TO_LAYER).find(([, mappedLayer]) => mappedLayer === layerId)?.[0] || "primary")
        : "none");
    return {
        parallax: 0,
        innerExpandPx: 0,
        innerCut: 0,
        innerFeather: 0,
        cutBiasTop: 0,
        cutBiasRight: 0,
        cutBiasBottom: 0,
        cutBiasLeft: 0,
        tint: "#ffffff",
        tintOpacity: 0,
        blendMode: "normal",
        brightness: 1,
        contrast: 1,
        saturation: 1,
        hue: 0,
        rotation: 0,
        opacity: 1,
        ...item,
        innerExpandPx: clamp(Math.round(item.innerExpandPx || 0), 0, 12),
        layerId,
        shellRole
    };
}

function saveState() {
    const payload = {
        zoom: state.zoom,
        inspectorCard: state.inspectorCard,
        canvasCard: state.canvasCard,
        shellFocus: state.shellFocus,
        guides: state.guides,
        selectedLayerId: state.selectedLayerId,
        items: state.items.map((item) => ({ ...item, innerExpandPx: clamp(Math.round(item.innerExpandPx || 0), 0, 12) })),
        customAssets: state.customAssets,
        layerState: state.layerState,
        doorLight: state.doorLight
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function loadState() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
        return;
    }

    try {
        const parsed = JSON.parse(raw);
        state.zoom = clamp(Number(parsed.zoom) || state.zoom, 0.35, 1.5);
        state.inspectorCard = parsed.inspectorCard || state.inspectorCard;
        state.canvasCard = parsed.canvasCard || state.canvasCard;
        state.shellFocus = !!parsed.shellFocus;
        state.guides = { ...DEFAULT_GUIDES, ...(parsed.guides || {}) };
        state.selectedLayerId = normalizeLayerId(parsed.selectedLayerId || state.selectedLayerId);
        state.items = Array.isArray(parsed.items) ? parsed.items.map(normalizeItem) : [];
        state.customAssets = Array.isArray(parsed.customAssets)
            ? parsed.customAssets.map((asset) => ({ ...asset, layerId: normalizeLayerId(asset.layerId || "shell_primary") }))
            : [];
        state.layerState = { ...state.layerState, ...(parsed.layerState || {}) };
        state.doorLight = { ...DEFAULT_DOOR_LIGHT, ...(parsed.doorLight || {}) };
        LAYERS.forEach((layer) => {
            state.layerState[layer.id] = { visible: true, locked: false, opacity: 1, ...(state.layerState[layer.id] || {}) };
        });
    } catch (error) {
        console.warn("scene_art_workbench loadState failed", error);
    }
}

function resetWorkbenchState() {
    try {
        localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
        console.warn("scene_art_workbench resetWorkbenchState failed", error);
    }
    state.zoom = 1;
    state.tool = "select";
    state.sidebar = "assets";
    state.inspectorCard = "quick";
    state.canvasCard = "tools";
    state.shellFocus = false;
    state.assetCategory = "all";
    state.assetSearch = "";
    state.guides = { ...DEFAULT_GUIDES };
    state.selectedLayerId = "shell_primary";
    state.items = [];
    state.customAssets = [];
    state.selectedIds = [];
    state.activeId = null;
    state.pointer = null;
    state.history = [];
    state.future = [];
    state.layerState = Object.fromEntries(LAYERS.map((layer) => [layer.id, { visible: true, locked: false, opacity: 1 }]));
    state.doorLight = { ...DEFAULT_DOOR_LIGHT };
}

function hydrateDom() {
    Object.assign(dom, {
        sceneRoot: $("sceneRoot"),
        guideGrid: $("guideGrid"),
        layoutFrame: $("layoutFrame"),
        leftHudFrame: $("leftHudFrame"),
        centerFrame: $("centerFrame"),
        rightHudFrame: $("rightHudFrame"),
        roomFrame: $("roomFrame"),
        guidePlayArea: $("guidePlayArea"),
        guideWall: $("guideWall"),
        guideSafeFrame: $("guideSafeFrame"),
        guideDoorTop: $("guideDoorTop"),
        guideDoorBottom: $("guideDoorBottom"),
        guideDoorLeft: $("guideDoorLeft"),
        guideDoorRight: $("guideDoorRight"),
        alignLineX: $("alignLineX"),
        alignLineY: $("alignLineY"),
        selectionBox: $("selectionBox"),
        sceneLayerHost: $("sceneLayerHost"),
        assetSearchInput: $("assetSearchInput"),
        clearAssetSearchBtn: $("clearAssetSearchBtn"),
        pickLocalAssetsBtn: $("pickLocalAssetsBtn"),
        localAssetInput: $("localAssetInput"),
        assetCategoryRow: $("assetCategoryRow"),
        assetGrid: $("assetGrid"),
        shellStackList: $("shellStackList"),
        layerList: $("layerList"),
        usedAssetList: $("usedAssetList"),
        selectedMeta: $("selectedMeta"),
        spaceMeta: $("spaceMeta"),
        shellMeta: $("shellMeta"),
        wizardHealth: $("wizardHealth"),
        shellRiskHint: $("shellRiskHint"),
        smartScaleRange: $("smartScaleRange"),
        smartRotateRange: $("smartRotateRange"),
        smartScaleMeta: $("smartScaleMeta"),
        smartRotateMeta: $("smartRotateMeta"),
        smartEditHint: $("smartEditHint"),
        runtimeLayoutStatus: $("runtimeLayoutStatus"),
        runtimeProbeFrame: $("runtimeProbeFrame"),
        toggleShellFocusBtn: $("toggleShellFocusBtn"),
        directTintColor: $("directTintColor"),
        directTintStrength: $("directTintStrength"),
        doorLightColor: $("doorLightColor"),
        doorLightIntensity: $("doorLightIntensity"),
        doorLightOpacity: $("doorLightOpacity"),
        doorLightLength: $("doorLightLength"),
        doorLightSpread: $("doorLightSpread"),
        doorLightSoftness: $("doorLightSoftness"),
        doorLightLip: $("doorLightLip"),
        doorLightMeta: $("doorLightMeta"),
        statusRow: $("statusRow"),
        exportOutput: $("exportOutput"),
        exportStatus: $("exportStatus")
    });

    dom.propertyInputs = {
        x: $("propX"),
        y: $("propY"),
        width: $("propWidth"),
        height: $("propHeight"),
        rotation: $("propRotation"),
        opacity: $("propOpacity"),
        brightness: $("propBrightness"),
        contrast: $("propContrast"),
        saturation: $("propSaturation"),
        hue: $("propHue"),
        tint: $("propTint"),
        tintOpacity: $("propTintOpacity"),
        blendMode: $("propBlendMode"),
        parallax: $("propParallax"),
        innerCut: $("propInnerCut"),
        innerFeather: $("propInnerFeather"),
        cutBiasTop: $("propCutBiasTop"),
        cutBiasRight: $("propCutBiasRight"),
        cutBiasBottom: $("propCutBiasBottom"),
        cutBiasLeft: $("propCutBiasLeft"),
        shellRole: $("propShellRole")
    };
}

function setupStaticFrames() {
    dom.sceneRoot.style.transformOrigin = "top left";
    dom.playerReference = document.createElement("div");
    dom.playerReference.className = "player-reference";
    dom.playerReference.innerHTML = `
        <img src="${PLAYER_REFERENCE.asset}" alt="player reference">
        <div class="badge">玩家 40px</div>
    `;
    dom.sceneRoot.appendChild(dom.playerReference);
    dom.playerReference.style.zIndex = "480";

    const centerScreen = {
        x: ROOM_FRAME.x + ROOM_FRAME.size / 2 - roomPx(PLAYER_REFERENCE.width) / 2,
        y: ROOM_FRAME.y + ROOM_FRAME.size / 2 - roomPx(PLAYER_REFERENCE.height) / 2
    };
    setFrame(dom.playerReference, centerScreen.x, centerScreen.y, roomPx(PLAYER_REFERENCE.width), roomPx(PLAYER_REFERENCE.height));

    LAYERS.forEach((layer) => {
        const node = document.createElement("div");
        node.className = "scene-layer";
        node.dataset.layerId = layer.id;
        node.style.position = "absolute";
        node.style.inset = "0";
        node.style.zIndex = String(layer.z || 100);
        dom.sceneLayerHost.appendChild(node);
        state.layerNodes[layer.id] = node;
    });

    dom.doorVisualNodes = ["top", "bottom", "left", "right"].map((dir) => {
        const node = document.createElement("div");
        node.className = `door-guide ${dir}`;
        node.style.border = "2px solid rgba(255, 204, 115, 0.9)";
        node.style.background = "rgba(255, 204, 115, 0.12)";
        node.style.opacity = "0.95";
        node.style.zIndex = "24";
        dom.sceneRoot.appendChild(node);
        return node;
    });

    dom.doorLightNodes = ["top", "bottom", "left", "right"].map((dir) => {
        const node = document.createElement("div");
        node.className = `door-light-node door-light-${dir}`;
        node.innerHTML = '<div class="door-light-beam"></div><div class="door-light-lip"></div>';
        dom.sceneRoot.appendChild(node);
        return node;
    });

    updateStaticFrames();
}

function updateStaticFrames() {
    dom.sceneRoot.style.width = `${RUNTIME_CANVAS.width}px`;
    dom.sceneRoot.style.height = `${RUNTIME_CANVAS.height}px`;
    dom.guideGrid.style.backgroundSize = `${roomPx(100)}px ${roomPx(100)}px`;

    setFrame(dom.layoutFrame, 0, 0, VIEWPORT.width, VIEWPORT.height);
    setFrame(dom.leftHudFrame, RUNTIME_LAYOUT.leftSidebar.x, RUNTIME_LAYOUT.leftSidebar.y, RUNTIME_LAYOUT.leftSidebar.width, RUNTIME_LAYOUT.leftSidebar.height);
    setFrame(dom.centerFrame, RUNTIME_LAYOUT.centerGame.x, RUNTIME_LAYOUT.centerGame.y, RUNTIME_LAYOUT.centerGame.width, RUNTIME_LAYOUT.centerGame.height);
    setFrame(dom.rightHudFrame, RUNTIME_LAYOUT.rightSidebar.x, RUNTIME_LAYOUT.rightSidebar.y, RUNTIME_LAYOUT.rightSidebar.width, RUNTIME_LAYOUT.rightSidebar.height);

    setFrame(dom.roomFrame, ROOM_FRAME.x, ROOM_FRAME.y, ROOM_FRAME.size, ROOM_FRAME.size);
    setFrame(
        dom.guidePlayArea,
        ROOM_FRAME.x + roomPx(FLOOR_BOUNDS.left),
        ROOM_FRAME.y + roomPx(FLOOR_BOUNDS.top),
        roomPx(FLOOR_BOUNDS.width),
        roomPx(FLOOR_BOUNDS.height)
    );
    setFrame(dom.guideWall, ROOM_FRAME.x, ROOM_FRAME.y, ROOM_FRAME.size, ROOM_FRAME.size);
    dom.guideWall.style.boxShadow = `inset 0 0 0 ${roomPx(ROOM.wall)}px rgba(255, 143, 143, 0.12)`;

    const logicDoorWidth = roomPx(DOOR_LOGIC.halfWidth * 2);
    const logicDoorHeight = roomPx(DOOR_LOGIC.halfHeight * 2);
    setFrame(
        dom.guideDoorTop,
        ROOM_FRAME.x + roomPx(ROOM.width / 2 - DOOR_LOGIC.halfWidth),
        ROOM_FRAME.y + roomPx(ROOM.wall - DOOR_LOGIC.halfHeight),
        logicDoorWidth,
        logicDoorHeight
    );
    setFrame(
        dom.guideDoorBottom,
        ROOM_FRAME.x + roomPx(ROOM.width / 2 - DOOR_LOGIC.halfWidth),
        ROOM_FRAME.y + roomPx(ROOM.height - ROOM.wall - DOOR_LOGIC.halfHeight),
        logicDoorWidth,
        logicDoorHeight
    );
    setFrame(
        dom.guideDoorLeft,
        ROOM_FRAME.x + roomPx(ROOM.wall - DOOR_LOGIC.halfHeight),
        ROOM_FRAME.y + roomPx(ROOM.height / 2 - DOOR_LOGIC.halfWidth),
        logicDoorHeight,
        logicDoorWidth
    );
    setFrame(
        dom.guideDoorRight,
        ROOM_FRAME.x + roomPx(ROOM.width - ROOM.wall - DOOR_LOGIC.halfHeight),
        ROOM_FRAME.y + roomPx(ROOM.height / 2 - DOOR_LOGIC.halfWidth),
        logicDoorHeight,
        logicDoorWidth
    );
    [dom.guideDoorTop, dom.guideDoorBottom, dom.guideDoorLeft, dom.guideDoorRight].forEach((node) => {
        node.style.border = "1px solid rgba(138, 215, 165, 0.9)";
        node.style.background = "rgba(138, 215, 165, 0.18)";
    });

    const visualDoorWidth = roomPx(ROOM.door);
    const visualDoorOffset = roomPx((ROOM.width - ROOM.door) / 2);
    setFrame(dom.doorVisualNodes[0], ROOM_FRAME.x + visualDoorOffset, ROOM_FRAME.y - roomPx((ROOM.door - ROOM.wall) / 2), visualDoorWidth, roomPx(ROOM.door));
    setFrame(dom.doorVisualNodes[1], ROOM_FRAME.x + visualDoorOffset, ROOM_FRAME.y + ROOM_FRAME.size - roomPx(ROOM.wall) - roomPx((ROOM.door - ROOM.wall) / 2), visualDoorWidth, roomPx(ROOM.door));
    setFrame(dom.doorVisualNodes[2], ROOM_FRAME.x - roomPx((ROOM.door - ROOM.wall) / 2), ROOM_FRAME.y + visualDoorOffset, roomPx(ROOM.door), visualDoorWidth);
    setFrame(dom.doorVisualNodes[3], ROOM_FRAME.x + ROOM_FRAME.size - roomPx(ROOM.wall) - roomPx((ROOM.door - ROOM.wall) / 2), ROOM_FRAME.y + visualDoorOffset, roomPx(ROOM.door), visualDoorWidth);

    const centerScreen = {
        x: ROOM_FRAME.x + ROOM_FRAME.size / 2 - roomPx(PLAYER_REFERENCE.width) / 2,
        y: ROOM_FRAME.y + ROOM_FRAME.size / 2 - roomPx(PLAYER_REFERENCE.height) / 2
    };
    setFrame(dom.playerReference, centerScreen.x, centerScreen.y, roomPx(PLAYER_REFERENCE.width), roomPx(PLAYER_REFERENCE.height));
}

function setFrame(node, x, y, width, height) {
    node.style.left = `${round(x, 2)}px`;
    node.style.top = `${round(y, 2)}px`;
    node.style.width = `${round(width, 2)}px`;
    node.style.height = `${round(height, 2)}px`;
}

function render() {
    renderWorkbenchModes();
    renderZoom();
    renderGuides();
    renderAssets();
    renderShellStack();
    renderLayers();
    renderItems();
    renderUsedAssets();
    renderInspector();
    renderDoorLightLab();
    renderWizard();
    renderStatus();
    saveState();
}

function renderWorkbenchModes() {
    document.querySelector(".page")?.classList.toggle("shell-focus", !!state.shellFocus);
    dom.toggleShellFocusBtn?.classList.toggle("primary", !!state.shellFocus);
    dom.toggleShellFocusBtn?.classList.toggle("warn", !state.shellFocus);
    if (dom.toggleShellFocusBtn) {
        dom.toggleShellFocusBtn.textContent = state.shellFocus ? "退出专注壳调色" : "专注壳调色";
    }
    qsa("[data-inspector-card-button]").forEach((button) => {
        button.classList.toggle("active", button.dataset.inspectorCardButton === state.inspectorCard);
    });
    qsa("[data-inspector-card]").forEach((card) => {
        card.classList.toggle("inspector-card-hidden", card.dataset.inspectorCard !== state.inspectorCard);
    });
    qsa("[data-canvas-card-button]").forEach((button) => {
        button.classList.toggle("active", button.dataset.canvasCardButton === state.canvasCard);
    });
    qsa("[data-canvas-card]").forEach((card) => {
        card.classList.toggle("canvas-card-hidden", card.dataset.canvasCard !== state.canvasCard);
    });
}

function renderDoorLightLab() {
    if (!dom.doorLightNodes) return;

    const settings = state.doorLight;
    if (dom.doorLightColor) dom.doorLightColor.value = settings.color;
    if (dom.doorLightIntensity) dom.doorLightIntensity.value = String(settings.intensity);
    if (dom.doorLightOpacity) dom.doorLightOpacity.value = String(settings.opacity);
    if (dom.doorLightLength) dom.doorLightLength.value = String(settings.length);
    if (dom.doorLightSpread) dom.doorLightSpread.value = String(settings.spread);
    if (dom.doorLightSoftness) dom.doorLightSoftness.value = String(settings.softness);
    if (dom.doorLightLip) dom.doorLightLip.value = String(settings.lip);

    const rgb = hexToRgb(settings.color);
    const beamLength = roomPx(settings.length);
    const verticalSource = roomPx(DOOR_LOGIC.halfHeight * 2);
    const horizontalSource = roomPx(DOOR_LOGIC.halfWidth * 2);
    const verticalFar = verticalSource * settings.spread;
    const horizontalFar = horizontalSource * settings.spread;
    const blurPx = Math.max(0, settings.softness);
    const lipThickness = Math.max(2, roomPx(8));
    const beamNear = Math.min(1, settings.opacity * 0.44 * settings.intensity);
    const beamMid = Math.min(1, settings.opacity * 0.22 * settings.intensity);
    const beamFar = Math.min(1, settings.opacity * 0.07 * settings.intensity);
    const lipA = Math.min(1, settings.opacity * settings.lip);
    const lipB = Math.min(1, settings.opacity * settings.lip * 0.55);
    const glowAlpha = Math.min(1, settings.opacity * 0.24 * settings.intensity);

    const frames = [
        {
            node: dom.doorLightNodes[0],
            axis: "vertical",
            left: ROOM_FRAME.x + roomPx(ROOM.width / 2) - verticalFar / 2,
            top: ROOM_FRAME.y + roomPx(ROOM.wall),
            width: verticalFar,
            height: beamLength,
            source: verticalSource,
            dir: "top"
        },
        {
            node: dom.doorLightNodes[1],
            axis: "vertical",
            left: ROOM_FRAME.x + roomPx(ROOM.width / 2) - verticalFar / 2,
            top: ROOM_FRAME.y + roomPx(ROOM.height - ROOM.wall) - beamLength,
            width: verticalFar,
            height: beamLength,
            source: verticalSource,
            dir: "bottom"
        },
        {
            node: dom.doorLightNodes[2],
            axis: "horizontal",
            left: ROOM_FRAME.x + roomPx(ROOM.wall),
            top: ROOM_FRAME.y + roomPx(ROOM.height / 2) - horizontalFar / 2,
            width: beamLength,
            height: horizontalFar,
            source: horizontalSource,
            dir: "left"
        },
        {
            node: dom.doorLightNodes[3],
            axis: "horizontal",
            left: ROOM_FRAME.x + roomPx(ROOM.width - ROOM.wall) - beamLength,
            top: ROOM_FRAME.y + roomPx(ROOM.height / 2) - horizontalFar / 2,
            width: beamLength,
            height: horizontalFar,
            source: horizontalSource,
            dir: "right"
        }
    ];

    frames.forEach((frame) => {
        const node = frame.node;
        const beam = node.firstElementChild;
        const lip = node.lastElementChild;
        setFrame(node, frame.left, frame.top, frame.width, frame.height);
        node.style.filter = `blur(${blurPx}px)`;

        if (frame.axis === "vertical") {
            const sourcePctA = ((frame.width - frame.source) / 2 / frame.width) * 100;
            const sourcePctB = ((frame.width + frame.source) / 2 / frame.width) * 100;
            beam.style.clipPath = frame.dir === "top"
                ? `polygon(${sourcePctA}% 0%, ${sourcePctB}% 0%, 100% 100%, 0% 100%)`
                : `polygon(0% 0%, 100% 0%, ${sourcePctB}% 100%, ${sourcePctA}% 100%)`;
            beam.style.background = frame.dir === "top"
                ? `linear-gradient(180deg, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${beamNear}), rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${beamMid}) 42%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${beamFar}) 78%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0) 100%)`
                : `linear-gradient(180deg, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0), rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${beamFar}) 22%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${beamMid}) 58%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${beamNear}) 100%)`;
            lip.style.left = `${(frame.width - frame.source) / 2}px`;
            lip.style.top = frame.dir === "top" ? `${-lipThickness * 0.2}px` : `${frame.height - lipThickness * 0.8}px`;
            lip.style.width = `${frame.source}px`;
            lip.style.height = `${lipThickness}px`;
            lip.style.background = `linear-gradient(180deg, rgba(255,255,255,${lipA}), rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${lipB}), rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0))`;
        } else {
            const sourcePctA = ((frame.height - frame.source) / 2 / frame.height) * 100;
            const sourcePctB = ((frame.height + frame.source) / 2 / frame.height) * 100;
            beam.style.clipPath = frame.dir === "left"
                ? `polygon(0% ${sourcePctA}%, 100% 0%, 100% 100%, 0% ${sourcePctB}%)`
                : `polygon(0% 0%, 100% ${sourcePctA}%, 100% ${sourcePctB}%, 0% 100%)`;
            beam.style.background = frame.dir === "left"
                ? `linear-gradient(90deg, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${beamNear}), rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${beamMid}) 42%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${beamFar}) 78%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0) 100%)`
                : `linear-gradient(90deg, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0), rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${beamFar}) 22%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${beamMid}) 58%, rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${beamNear}) 100%)`;
            lip.style.left = frame.dir === "left" ? `${-lipThickness * 0.2}px` : `${frame.width - lipThickness * 0.8}px`;
            lip.style.top = `${(frame.height - frame.source) / 2}px`;
            lip.style.width = `${lipThickness}px`;
            lip.style.height = `${frame.source}px`;
            lip.style.background = `linear-gradient(90deg, rgba(255,255,255,${lipA}), rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${lipB}), rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0))`;
        }

        beam.style.boxShadow = `0 0 ${Math.max(6, blurPx * 1.5)}px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${glowAlpha})`;
    });

    if (dom.doorLightMeta) {
        dom.doorLightMeta.textContent = `逻辑门宽驱动，长度=${settings.length}px，角度倍率=${settings.spread.toFixed(2)}，柔化=${settings.softness}px。~Meow`;
    }
}

function hexToRgb(hex) {
    const match = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(String(hex || "#ffffff"));
    if (!match) return { r: 255, g: 255, b: 255 };
    return {
        r: parseInt(match[1], 16),
        g: parseInt(match[2], 16),
        b: parseInt(match[3], 16)
    };
}

function patchDoorLight(partial) {
    const next = { ...state.doorLight, ...partial };
    next.intensity = clamp(Number(next.intensity) || DEFAULT_DOOR_LIGHT.intensity, 0, 12);
    next.opacity = clamp(Number(next.opacity) || DEFAULT_DOOR_LIGHT.opacity, 0, 1);
    next.length = clamp(Number(next.length) || DEFAULT_DOOR_LIGHT.length, 8, 260);
    next.spread = clamp(Number(next.spread) || DEFAULT_DOOR_LIGHT.spread, 1, 2.2);
    next.softness = clamp(Number(next.softness) || DEFAULT_DOOR_LIGHT.softness, 0, 60);
    next.lip = clamp(Number(next.lip) || DEFAULT_DOOR_LIGHT.lip, 0, 2);
    state.doorLight = next;
    render();
}

function copyDoorLightConfig() {
    const payload = JSON.stringify(state.doorLight, null, 2);
    if (dom.exportOutput) {
        dom.exportOutput.value = payload;
    }
    navigator.clipboard?.writeText?.(payload).catch(() => {});
    state.status = "门光参数已复制。~Meow";
    renderStatus();
}

function getPrimaryItemForLayer(layerId) {
    return state.items.find((item) => item.layerId === layerId) || null;
}

function getFocusedLayerItem() {
    return getPrimaryItemForLayer(state.selectedLayerId);
}

function describeAssetName(item) {
    if (!item) {
        return "未放素材";
    }
    const asset = getAsset(item.assetId);
    return asset?.name || item.name || "未知素材";
}

function renderShellStack() {
    if (!dom.shellStackList) {
        return;
    }

    const slots = [
        { layerId: "floor", title: "第1层 地板", helper: "最底层，铺主战斗地板。" },
        { layerId: "shell_far", title: "第2层 深壳", helper: "最底的壳层，先垫深度。" },
        { layerId: "shell_mid", title: "第3层 中壳", helper: "建议轻旋转，轻微裁掉中间。" },
        { layerId: "shell_primary", title: "第4层 主壳", helper: "最上层，负责主轮廓。" },
        { layerId: "shell_fragments", title: "碎层", helper: "可选，做边缘遮挡。" }
    ];

    dom.shellStackList.innerHTML = slots.map((slot) => {
        const item = getPrimaryItemForLayer(slot.layerId);
        const quickButtons = item ? `
            <div class="layer-actions" style="margin-top: 8px;">
                <button class="btn" data-shell-slot-scale="${slot.layerId}|down" type="button">小一点</button>
                <button class="btn" data-shell-slot-scale="${slot.layerId}|up" type="button">大一点</button>
                ${slot.layerId !== "floor" ? `<button class="btn" data-shell-slot-expand="${slot.layerId}|1" type="button">+1px口</button>` : ""}
            </div>
        ` : "";
        return `
            <article class="wizard-card shell-slot shell-slot-${slot.layerId}">
                <div class="wizard-title">${slot.title}</div>
                <div class="wizard-text">${slot.helper}</div>
                <div class="wizard-text">当前：${describeAssetName(item)} ~Meow</div>
                <div class="layer-actions" style="margin-top: 10px;">
                    <button class="btn ${state.selectedLayerId === slot.layerId ? "primary" : ""}" data-shell-slot-select="${slot.layerId}" type="button">选这层</button>
                    <button class="btn" data-shell-slot-focus="${slot.layerId}" type="button">${item ? "聚焦" : "插入默认"}</button>
                    ${item ? `<button class="btn warn" data-shell-slot-clear="${slot.layerId}" type="button">清空</button>` : ""}
                </div>
                ${quickButtons}
            </article>
        `;
    }).join("");
}

function renderZoom() {
    dom.sceneRoot.style.transform = `scale(${state.zoom})`;
    $("zoomResetBtn").textContent = `${Math.round(state.zoom * 100)}%`;
}

function renderGuides() {
    qsa("[data-guide]").forEach((button) => {
        const enabled = !!state.guides[button.dataset.guide];
        button.classList.toggle("active", enabled);
    });

    dom.guideGrid.classList.toggle("hidden", !state.guides.grid);
    dom.guidePlayArea.classList.toggle("hidden", !state.guides.playArea);
    dom.guideWall.classList.toggle("hidden", !state.guides.walls);
    dom.roomFrame.classList.toggle("hidden", !state.guides.safeFrame);
    dom.guideDoorTop.classList.toggle("hidden", !state.guides.doors);
    dom.guideDoorBottom.classList.toggle("hidden", !state.guides.doors);
    dom.guideDoorLeft.classList.toggle("hidden", !state.guides.doors);
    dom.guideDoorRight.classList.toggle("hidden", !state.guides.doors);
    (dom.doorVisualNodes || []).forEach((node) => node.classList.toggle("hidden", !state.guides.doorVisuals));
    dom.playerReference.classList.toggle("hidden", !state.guides.player);
    dom.guideSafeFrame.classList.add("hidden");
}

function renderAssets() {
    renderAssetCategories();
    const keyword = state.assetSearch.trim().toLowerCase();
    const selectedLayer = getLayer(state.selectedLayerId);
    const cards = assetList()
        .filter((asset) => state.assetCategory === "all" || asset.category === state.assetCategory)
        .filter((asset) => {
            if (!selectedLayer) {
                return true;
            }
            if (state.assetCategory !== "all") {
                return true;
            }
            if (selectedLayer.id === "floor") {
                return asset.layerId === "floor";
            }
            if (selectedLayer.id === "shell_primary" || selectedLayer.id === "shell_mid" || selectedLayer.id === "shell_far") {
                return asset.layerId === selectedLayer.id;
            }
            if (selectedLayer.id === "shell_fragments") {
                return asset.layerId === "shell_fragments" || asset.category === "foreground";
            }
            return asset.space === selectedLayer.space;
        })
        .filter((asset) => {
            if (!keyword) {
                return true;
            }
            const haystack = `${asset.name} ${asset.id} ${asset.path}`.toLowerCase();
            return haystack.includes(keyword);
        })
        .map((asset) => `
            <article class="asset-card" data-asset-id="${asset.id}" draggable="true">
                <div class="asset-thumb"><img src="${asset.path}" alt="${asset.name}" loading="lazy" onerror="this.style.display='none'; this.parentElement.innerHTML='<span class=&quot;mini&quot;>${asset.name}</span>';"></div>
                <div>
                    <div class="asset-name">${asset.name}</div>
                    <div class="mini">${CATEGORY_LABELS[asset.category] || asset.category} / ${asset.space === "room" ? "房间坐标" : "主画布坐标"}</div>
                    <div class="asset-path">${asset.path}</div>
                    <div class="layer-actions" style="margin-top: 10px;">
                        <button class="btn" data-asset-insert="${asset.id}" type="button">插入</button>
                        <button class="btn" data-asset-replace="${asset.id}" type="button">替换当前层</button>
                    </div>
                </div>
            </article>
        `)
        .join("");

    dom.assetGrid.innerHTML = cards || `<div class="mini">没有匹配资源。~Meow</div>`;
}

function renderAssetCategories() {
    const categories = ["all", ...new Set(assetList().map((asset) => asset.category))];
    dom.assetCategoryRow.innerHTML = categories.map((key) => `
        <button class="guide-chip ${state.assetCategory === key ? "active" : ""}" data-asset-category="${key}" type="button">${CATEGORY_LABELS[key] || key}</button>
    `).join("");
}

function renderLayers() {
    dom.layerList.innerHTML = LAYERS.map((layer) => {
        const cfg = state.layerState[layer.id];
        const count = state.items.filter((item) => item.layerId === layer.id).length;
        return `
            <article class="layer-item" data-layer-id="${layer.id}" style="padding: 12px;">
                <div class="layer-name">${layer.name}</div>
                <div class="mini">${layer.space === "room" ? "房间坐标" : "主画布坐标"} / ${count} 项</div>
                <div class="mini">透明度 ${Math.round((cfg.opacity ?? 1) * 100)}%</div>
                <div class="layer-actions" style="margin-top: 10px;">
                    <button class="btn ${state.selectedLayerId === layer.id ? "primary" : ""}" data-layer-select="${layer.id}" type="button">编辑</button>
                    <button class="btn" data-layer-visible="${layer.id}" type="button">${cfg.visible ? "隐藏" : "显示"}</button>
                    <button class="btn" data-layer-lock="${layer.id}" type="button">${cfg.locked ? "解锁" : "锁定"}</button>
                </div>
                <div style="margin-top: 10px;">
                    <input data-layer-opacity="${layer.id}" type="range" min="0" max="1" step="0.05" value="${cfg.opacity ?? 1}" style="width:100%;">
                </div>
            </article>
        `;
    }).join("");

    LAYERS.forEach((layer) => {
        const cfg = state.layerState[layer.id];
        const node = state.layerNodes[layer.id];
        node.style.display = cfg.visible ? "block" : "none";
        node.style.pointerEvents = cfg.locked ? "none" : "auto";
        node.style.opacity = String(cfg.opacity ?? 1);
    });
}

function renderUsedAssets() {
    const counts = new Map();
    state.items.forEach((item) => counts.set(item.assetId, (counts.get(item.assetId) || 0) + 1));
    const html = Array.from(counts.entries()).map(([assetId, count]) => {
        const asset = getAsset(assetId);
        if (!asset) {
            return "";
        }

        return `
            <article class="used-item" style="padding: 10px;">
                <div class="asset-name">${asset.name}</div>
                <div class="mini">${count} 个实例 / ${asset.layerId}</div>
                <div class="asset-path">${asset.path}</div>
                <div class="layer-actions" style="margin-top: 10px;">
                    <button class="btn" data-used-insert="${asset.id}" type="button">再次插入</button>
                    <button class="btn" data-used-filter="${asset.category}" type="button">筛到此类</button>
                </div>
            </article>
        `;
    }).join("");

    dom.usedAssetList.innerHTML = html || `<div class="mini">当前还没有已用素材。~Meow</div>`;
}

function renderItems() {
    Object.values(state.layerNodes).forEach((node) => {
        node.innerHTML = "";
    });

    state.items.forEach((item) => {
        const asset = getAsset(item.assetId);
        if (!asset) {
            return;
        }

        const rect = toScreenRect(item);
        const selected = state.selectedIds.includes(item.id);
        const resolvedSource = resolveItemAssetSource(item, asset);
        const node = document.createElement("div");
        node.className = `scene-item${selected ? " is-selected" : ""}`;
        node.dataset.itemId = item.id;
        node.style.left = `${round(rect.x, 2)}px`;
        node.style.top = `${round(rect.y, 2)}px`;
        node.style.width = `${round(rect.width, 2)}px`;
        node.style.height = `${round(rect.height, 2)}px`;
        node.style.transform = `rotate(${item.rotation}deg)`;
        node.style.transformOrigin = "center center";
        node.style.opacity = String(item.opacity);
        node.style.mixBlendMode = item.blendMode || "normal";
        node.style.zIndex = String(300 + state.items.indexOf(item));
        const maskImage = buildInnerCutMask(item);
        node.style.maskImage = maskImage || "";
        node.style.webkitMaskImage = maskImage || "";
        node.style.cursor = state.tool === "pan" ? "grab" : "move";

        const filter = [
            `brightness(${item.brightness})`,
            `contrast(${item.contrast})`,
            `saturate(${item.saturation})`,
            `hue-rotate(${item.hue}deg)`
        ].join(" ");
        const insets = getCutInsets(item);
        const showCutGuide = selected && isShellItem(item) && (insets.top > 0 || insets.right > 0 || insets.bottom > 0 || insets.left > 0);
        const shellRole = item.shellRole && item.shellRole !== "none" ? item.shellRole : "";

        node.innerHTML = `
            <img src="${resolvedSource}" alt="${asset.name}" draggable="false" style="filter:${filter};">
            <div class="tint" style="background:${item.tint}; opacity:${item.tintOpacity};"></div>
            ${showCutGuide ? `<div class="cut-guide" style="left:${round(insets.left * 100, 2)}%; top:${round(insets.top * 100, 2)}%; right:${round(insets.right * 100, 2)}%; bottom:${round(insets.bottom * 100, 2)}%;"></div>` : ""}
            ${shellRole ? `<div class="shell-role-badge">${shellRole}</div>` : ""}
            <div class="rotate-handle" data-handle="rotate"></div>
            <div class="resize-handle" data-handle="resize"></div>
        `;

        state.layerNodes[item.layerId].appendChild(node);
    });
}

function renderInspector() {
    const item = activeItem();
    if (!item) {
        dom.selectedMeta.textContent = state.selectedIds.length > 1
            ? `已选中 ${state.selectedIds.length} 个对象。~Meow`
            : "未选中对象。~Meow";
        dom.spaceMeta.textContent = "坐标空间：- ~Meow";
        dom.shellMeta.textContent = "壳层状态：- ~Meow";
        dom.shellRiskHint.textContent = "风险提示：先插入并选中壳层。~Meow";
        if (dom.smartScaleRange) {
            dom.smartScaleRange.value = "100";
            dom.smartScaleRange.disabled = true;
        }
        if (dom.smartRotateRange) {
            dom.smartRotateRange.value = "0";
            dom.smartRotateRange.disabled = true;
        }
        if (dom.smartScaleMeta) {
            dom.smartScaleMeta.textContent = "当前 100% ~Meow";
        }
        if (dom.smartRotateMeta) {
            dom.smartRotateMeta.textContent = "当前 0° ~Meow";
        }
        if (dom.smartEditHint) {
            dom.smartEditHint.textContent = "操作提示：先选中一层壳。~Meow";
        }
        Object.values(dom.propertyInputs).forEach((input) => {
            input.value = "";
            input.disabled = true;
        });
        return;
    }

    dom.selectedMeta.textContent = `${item.name} / ${item.id} / 已选 ${state.selectedIds.length || 1} 个。~Meow`;
    dom.spaceMeta.textContent = `坐标空间：${item.space === "room" ? "房间" : "主画布"} / 图层：${item.layerId} ~Meow`;
    if (isShellItem(item)) {
        const intrusion = Math.round(shellIntrusionRatio(item) * 100);
        const shellLabel = SHELL_ROLE_LABELS[item.shellRole || "none"] || (item.shellRole || "none");
        dom.shellMeta.textContent = `壳层状态：${shellLabel} / 视差 ${round(item.parallax || 0, 2)} / 核心区侵入估计 ${intrusion}% ~Meow`;
        dom.shellRiskHint.textContent = `风险提示：${describeIntrusion(shellIntrusionRatio(item)).text}`;
    } else {
        dom.shellMeta.textContent = "壳层状态：当前对象不是壳层。~Meow";
        dom.shellRiskHint.textContent = "风险提示：当前对象不是壳层，这些按钮对它帮助不大。~Meow";
    }

    const values = {
        x: round(item.x, 1),
        y: round(item.y, 1),
        width: round(item.width, 1),
        height: round(item.height, 1),
        rotation: round(item.rotation, 1),
        opacity: round(item.opacity, 2),
        brightness: round(item.brightness, 2),
        contrast: round(item.contrast, 2),
        saturation: round(item.saturation, 2),
        hue: round(item.hue, 1),
        tint: item.tint,
        tintOpacity: round(item.tintOpacity, 2),
        blendMode: item.blendMode || "normal",
        parallax: round(item.parallax || 0, 2),
        innerCut: round(item.innerCut || 0, 2),
        innerFeather: round(item.innerFeather || 0, 2),
        cutBiasTop: round(item.cutBiasTop || 0, 2),
        cutBiasRight: round(item.cutBiasRight || 0, 2),
        cutBiasBottom: round(item.cutBiasBottom || 0, 2),
        cutBiasLeft: round(item.cutBiasLeft || 0, 2),
        shellRole: item.shellRole || "none"
    };

    Object.entries(dom.propertyInputs).forEach(([key, input]) => {
        input.disabled = false;
        input.value = values[key];
    });
    if (dom.directTintColor) {
        dom.directTintColor.value = item.tint || "#ffffff";
    }
    if (dom.directTintStrength) {
        dom.directTintStrength.value = round(item.tintOpacity || 0, 2);
    }
    updateSmartControls(item);
}

function getSmartScalePercent(item) {
    if (!item) {
        return 100;
    }
    const baseWidth = item.space === "viewport"
        ? VIEWPORT.width
        : FLOOR_BOUNDS.width;
    if (!baseWidth) {
        return 100;
    }
    return clamp(round((item.width / baseWidth) * 100, 0), 20, 220);
}

function updateSmartControls(item) {
    if (!dom.smartScaleRange || !dom.smartRotateRange) {
        return;
    }
    const scalePercent = getSmartScalePercent(item);
    dom.smartScaleRange.disabled = !item;
    dom.smartRotateRange.disabled = !item;
    dom.smartScaleRange.value = String(clamp(scalePercent, 60, 140));
    dom.smartRotateRange.value = String(clamp(round(item.rotation || 0, 0), -180, 180));
    if (dom.smartScaleMeta) {
        dom.smartScaleMeta.textContent = `当前 ${scalePercent}% ~Meow`;
    }
    if (dom.smartRotateMeta) {
        dom.smartRotateMeta.textContent = `当前 ${round(item.rotation || 0, 1)}° ~Meow`;
    }
    if (dom.smartEditHint) {
        if (!isShellItem(item)) {
            dom.smartEditHint.textContent = "操作提示：当前不是壳层，也可以缩放旋转，但智能擦除主要给壳层用。~Meow";
        } else {
            dom.smartEditHint.textContent = `操作提示：先用缩放和微转，再用内边扩圈修中心。当前已扩 ${Math.round(item.innerExpandPx || 0)}px。~Meow`;
        }
    }
}

function renderWizard() {
    if (!dom.wizardHealth) {
        return;
    }

    const shells = shellItems();
    if (!shells.length) {
        dom.wizardHealth.textContent = "还没有壳层。先点“插入 F1 主壳”。~Meow";
        dom.wizardHealth.parentElement.className = "wizard-card";
        return;
    }

    const roles = new Set(shells.map((item) => item.shellRole));
    const missing = ["primary", "mid", "far"].filter((role) => !roles.has(role));
    const worst = shells.reduce((max, item) => Math.max(max, shellIntrusionRatio(item)), 0);
    const intrusionDesc = describeIntrusion(worst);
    const missingText = missing.length ? `缺少 ${missing.map((role) => SHELL_ROLE_LABELS[role]).join(" / ")}` : "三层壳已齐";
    dom.wizardHealth.textContent = `${missingText}；当前最大侵入 ${Math.round(worst * 100)}%。${intrusionDesc.text}`;
    dom.wizardHealth.parentElement.className = `wizard-card ${intrusionDesc.level}`;
}

function renderStatus() {
    const statusBits = [
        `对象 ${state.items.length}`,
        `选中 ${state.selectedIds.length}`,
        `缩放 ${Math.round(state.zoom * 100)}%`,
        `工具 ${state.tool === "pan" ? "平移" : "选择"}`,
        `图层 ${getLayer(state.selectedLayerId).name}`,
        `布局 ${RUNTIME_LAYOUT.source === "runtime" ? "真实" : "回退"}`
    ];

    dom.statusRow.innerHTML = `
        <article class="status-card" style="padding: 10px 12px;">${statusBits.join(" / ")}</article>
        <article class="status-card" style="padding: 10px 12px;">${state.status}</article>
    `;
}

function syncLayoutFramesAndRender() {
    updateStaticFrames();
    render();
}

function syncRuntimeLayoutFromProbe() {
    const frame = dom.runtimeProbeFrame;
    if (!frame) {
        return;
    }

    state.status = "正在同步游戏真实布局。~Meow";
    renderStatus();
    if (dom.runtimeLayoutStatus) {
        dom.runtimeLayoutStatus.textContent = "布局来源：正在读取游戏真实布局...";
    }

    const probeUrl = `${RUNTIME_PROBE_URL}?scene_workbench_probe=${Date.now()}`;
    frame.src = probeUrl;

    const startedAt = Date.now();
    const tick = () => {
        try {
            const doc = frame.contentDocument;
            if (doc?.readyState === "complete") {
                const snapshot = extractRuntimeLayoutFromDocument(doc);
                applyLayoutSnapshot(snapshot);
                state.status = "已同步游戏真实布局。~Meow";
                syncLayoutFramesAndRender();
                return;
            }
        } catch (error) {
            if (Date.now() - startedAt >= RUNTIME_PROBE_TIMEOUT_MS) {
                state.status = "同步真实布局失败，已保留当前回退布局。~Meow";
                if (dom.runtimeLayoutStatus) {
                    dom.runtimeLayoutStatus.textContent = `布局来源：同步失败，使用回退布局 (${error.message})`;
                }
                renderStatus();
                return;
            }
        }

        if (Date.now() - startedAt >= RUNTIME_PROBE_TIMEOUT_MS) {
            state.status = "同步真实布局超时，已保留当前回退布局。~Meow";
            if (dom.runtimeLayoutStatus) {
                dom.runtimeLayoutStatus.textContent = "布局来源：同步超时，使用回退布局";
            }
            renderStatus();
            return;
        }

        window.setTimeout(tick, 250);
    };

    window.setTimeout(tick, 250);
}

function setSelection(ids, activeId = ids[ids.length - 1] || null) {
    state.selectedIds = [...new Set(ids)].filter(Boolean);
    state.activeId = activeId && state.selectedIds.includes(activeId) ? activeId : (state.selectedIds[state.selectedIds.length - 1] || null);
    const item = activeItem();
    if (item) {
        state.selectedLayerId = item.layerId;
    }
    render();
}

function selectSingle(itemId, additive = false) {
    if (!itemId) {
        setSelection([]);
        return;
    }

    if (additive) {
        const next = state.selectedIds.includes(itemId)
            ? state.selectedIds.filter((id) => id !== itemId)
            : [...state.selectedIds, itemId];
        setSelection(next, itemId);
        return;
    }

    setSelection([itemId], itemId);
}

function updateSelectedItems(patch) {
    if (!state.selectedIds.length) {
        return;
    }

    commitHistory();
    state.items = state.items.map((item) => {
        if (!state.selectedIds.includes(item.id)) {
            return item;
        }
        return { ...item, ...patch(item) };
    });
    render();
}

function updateSelectionAwareItems(patch) {
    if (!state.selectedIds.length) {
        return;
    }
    updateSelectedItems((item) => patch(item));
}

function updateActiveItem(patch) {
    const item = activeItem();
    if (!item) {
        return;
    }
    commitHistory();
    state.items = state.items.map((entry) => {
        if (entry.id !== item.id) {
            return entry;
        }
        return { ...entry, ...patch(entry) };
    });
    render();
}

function insertAsset(assetId, placement) {
    const asset = getAsset(assetId);
    if (!asset) {
        return;
    }

    commitHistory();
    const item = createItemFromAsset(asset, placement);
    state.items.push(item);
    state.selectedLayerId = item.layerId;
    state.status = `已插入 ${asset.name}。~Meow`;
    setSelection([item.id], item.id);
}

function getDefaultAssetForLayer(layerId) {
    const mapping = {
        floor: "floor_l1",
        shell_far: "shell_f1_trial_far",
        shell_mid: "shell_f1_trial_mid",
        shell_primary: "shell_f1_trial_primary",
        shell_fragments: "fragment_f1_decor_a"
    };
    return getAsset(mapping[layerId]) || null;
}

function ensureLayerHasDefaultItem(layerId) {
    const existing = getPrimaryItemForLayer(layerId);
    if (existing) {
        setSelection([existing.id], existing.id);
        return existing;
    }

    const asset = getDefaultAssetForLayer(layerId);
    if (!asset) {
        state.status = `图层 ${getLayer(layerId).name} 没有默认素材。~Meow`;
        renderStatus();
        return null;
    }

    const placement = layerId === "floor"
        ? { x: ROOM.wall, y: ROOM.wall, width: ROOM.width - ROOM.wall * 2, height: ROOM.height - ROOM.wall * 2, layerId }
        : { layerId };
    commitHistory();
    const item = createItemFromAsset(asset, placement);
    state.items.push(item);
    setSelection([item.id], item.id);
    state.status = `已给 ${getLayer(layerId).name} 插入默认素材。~Meow`;
    return item;
}

function getShellTrioItems() {
    return ["shell_far", "shell_mid", "shell_primary"]
        .map((layerId) => getPrimaryItemForLayer(layerId))
        .filter(Boolean);
}

function selectShellTrio() {
    const trio = getShellTrioItems();
    if (trio.length < 3) {
        state.status = "当前三壳还没齐，先点“一键叠三层”。~Meow";
        renderStatus();
        return;
    }
    const ids = trio.map((item) => item.id);
    setSelection(ids, ids[ids.length - 1]);
    state.status = "已全选 深壳 / 中壳 / 主壳。~Meow";
}

function applyShellThemePreset(themeKey) {
    const preset = SHELL_THEME_PRESETS[themeKey];
    if (!preset) {
        return;
    }

    const trio = getShellTrioItems();
    if (trio.length < 3) {
        state.status = "请先生成三层壳，再套楼层主题。~Meow";
        renderStatus();
        return;
    }

    commitHistory();
    state.items = state.items.map((item) => {
        const layerPreset = preset.layers[item.layerId];
        if (!layerPreset) {
            if (item.layerId === "floor" && preset.floorAssetId) {
                const floorAsset = getAsset(preset.floorAssetId);
                if (floorAsset) {
                    return {
                        ...item,
                        assetId: floorAsset.id,
                        name: floorAsset.name
                    };
                }
            }
            return item;
        }
        const nextAssetId = preset.assetIds?.[item.layerId];
        const nextAsset = nextAssetId ? getAsset(nextAssetId) : null;
        return {
            ...item,
            assetId: nextAsset?.id || item.assetId,
            name: nextAsset?.name || item.name,
            ...layerPreset
        };
    });

    const ids = trio.map((item) => item.id);
    setSelection(ids, ids[ids.length - 1]);
    state.status = `已应用 ${themeKey} 壳色基调，并全选三壳。~Meow`;
}

function scrollToWorkbenchTarget(targetId) {
    const target = $(targetId);
    if (!target) {
        return;
    }
    const cardId = target.dataset.inspectorCard;
    if (cardId) {
        state.inspectorCard = cardId;
        renderWorkbenchModes();
    }
    if (target.tagName === "DETAILS") {
        target.open = true;
    }
    target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function quickCopyShellConfig() {
    exportShellConfig();
    copyExport();
}

function replaceSelectedLayerAsset(assetId) {
    const asset = getAsset(assetId);
    const layer = getLayer(state.selectedLayerId);
    if (!asset || !layer) {
        return;
    }

    if (asset.space !== layer.space) {
        state.status = `这个素材是${asset.space === "room" ? "房间" : "画布"}坐标，不能直接替换 ${layer.name}。~Meow`;
        renderStatus();
        return;
    }

    const target = activeItem() && activeItem().layerId === layer.id
        ? activeItem()
        : getPrimaryItemForLayer(layer.id);

    if (!target) {
        insertAsset(assetId, { layerId: layer.id });
        return;
    }

    commitHistory();
    state.items = state.items.map((item) => item.id === target.id ? {
        ...item,
        assetId: asset.id,
        name: asset.name,
        layerId: layer.id,
        space: asset.space
    } : item);
    state.status = `已把 ${layer.name} 换成 ${asset.name}。~Meow`;
    setSelection([target.id], target.id);
}

function duplicateCurrentShellLayer() {
    const item = activeItem();
    if (!item || !isShellItem(item)) {
        state.status = "请先选中一个壳层，再加一层。~Meow";
        renderStatus();
        return;
    }
    commitHistory();
    const clone = {
        ...item,
        id: createId("item"),
        name: `${item.name}-copy`,
        opacity: round(Math.max(0.18, item.opacity * 0.84), 2),
        brightness: round(item.brightness * 0.92, 2),
        contrast: round(item.contrast * 0.9, 2),
        innerCut: clampCut((item.innerCut || 0) + 0.06),
        innerFeather: clamp(round((item.innerFeather || 0) + 0.02, 3), 0, 0.16),
        parallax: round((item.parallax || 0.18) + 0.12, 2)
    };
    state.items.push(clone);
    state.status = "已新增一层壳，你可以继续改它的缩放和裁切。~Meow";
    setSelection([clone.id], clone.id);
}

function selectedViewportShellItem() {
    const item = activeItem();
    if (item && item.space === "viewport") {
        return item;
    }
    return state.items.find((entry) => entry.space === "viewport" && isShellItem(entry)) || null;
}

function buildShellStack() {
    const source = selectedViewportShellItem();
    if (!source) {
        const base = ensureLayerHasDefaultItem("shell_primary");
        if (!base) {
            return;
        }
        buildShellStack();
        return;
    }

    commitHistory();
    const targetIds = [];
    SHELL_STACK_PRESET.forEach((preset, index) => {
        const width = round(source.width * preset.scale, 1);
        const height = round(source.height * preset.scale, 1);
        const x = round(source.x + (source.width - width) / 2, 1);
        const y = round(source.y + (source.height - height) / 2, 1);
        const clone = {
            ...source,
            id: index === 0 ? source.id : createId("item"),
            name: `${source.name}-${preset.role}`,
            layerId: preset.layerId,
            width,
            height,
            x,
            y,
            rotation: preset.rotation,
            opacity: preset.opacity,
            brightness: preset.brightness,
            contrast: preset.contrast,
            saturation: preset.saturation,
            parallax: preset.parallax,
            innerCut: preset.innerCut,
            innerFeather: preset.innerFeather,
            cutBiasTop: 0,
            cutBiasRight: 0,
            cutBiasBottom: 0,
            cutBiasLeft: 0,
            shellRole: preset.role
        };
        if (index === 0) {
            state.items = state.items.map((item) => item.id === source.id ? clone : item);
        } else {
            state.items.push(clone);
        }
        targetIds.push(clone.id);
    });

    state.status = "已生成三层叠壳预设。~Meow";
    setSelection(targetIds, targetIds[targetIds.length - 1]);
}

function ensureBaseShell() {
    const shell = selectedViewportShellItem();
    if (shell) {
        return shell;
    }

    const asset = getAsset("shell_f1_trial_primary");
    if (!asset) {
        state.status = "没有找到 Back 主壳素材。~Meow";
        renderStatus();
        return null;
    }

    commitHistory();
    const base = createItemFromAsset(asset, { layerId: "shell_primary", shellRole: "primary" });
    state.items.push(base);
    state.status = "已插入 Back 主壳。~Meow";
    setSelection([base.id], base.id);
    return base;
}

function insertBaseShell() {
    ensureLayerHasDefaultItem("shell_primary");
}

function applyRecommendedShellValues(item) {
    const preset = getShellPresetByRole(item.shellRole);
    if (!preset) {
        return {};
    }
    return {
        layerId: preset.layerId,
        parallax: preset.parallax,
        opacity: preset.opacity,
        brightness: preset.brightness,
        contrast: preset.contrast,
        saturation: preset.saturation,
        innerCut: preset.innerCut,
        innerFeather: preset.innerFeather
    };
}

function applyRecommendedShellPreset() {
    const item = activeItem();
    if (!item || !isShellItem(item)) {
        state.status = "请先选中一个壳层，再应用推荐参数。~Meow";
        renderStatus();
        return;
    }

    updateActiveItem((entry) => applyRecommendedShellValues(entry));
    state.status = "已应用推荐壳层参数。~Meow";
    render();
}

function applyColorPreset(presetKey) {
    const preset = COLOR_PRESETS[presetKey];
    if (!preset || !state.selectedIds.length) {
        return;
    }
    updateSelectionAwareItems(() => ({
        tint: preset.tint,
        tintOpacity: preset.tintOpacity,
        brightness: preset.brightness,
        contrast: preset.contrast,
        saturation: preset.saturation,
        hue: 0
    }));
    state.status = `已应用颜色方案：${presetKey}。~Meow`;
    render();
}

function applyDirectTint() {
    if (!state.selectedIds.length || !dom.directTintColor || !dom.directTintStrength) {
        return;
    }
    const tint = dom.directTintColor.value || "#ffffff";
    const tintOpacity = clamp(Number(dom.directTintStrength.value) || 0, 0, 1);
    updateSelectionAwareItems(() => ({
        tint,
        tintOpacity,
        hue: 0
    }));
    state.status = "已应用直接选色。~Meow";
    render();
}

function autoFixShellItem(item) {
    if (!isShellItem(item)) {
        return {};
    }
    const preset = getShellPresetByRole(item.shellRole);
    const baseCut = preset?.innerCut ?? (item.shellRole === "primary" ? 0 : 0.1);
    const baseFeather = preset?.innerFeather ?? 0.03;
    if (item.shellRole === "primary") {
        return {
            innerExpandPx: Math.max(item.innerExpandPx || 0, 2),
            innerCut: 0,
            innerFeather: 0,
            cutBiasTop: 0,
            cutBiasRight: 0,
            cutBiasBottom: 0,
            cutBiasLeft: 0
        };
    }
    if (item.shellRole === "mid") {
        return {
            innerExpandPx: Math.max(item.innerExpandPx || 0, 6),
            innerCut: Math.max(baseCut, 0.12),
            innerFeather: Math.max(baseFeather, 0.03),
            cutBiasTop: 0,
            cutBiasRight: 0.01,
            cutBiasBottom: 0.04,
            cutBiasLeft: 0.01
        };
    }
    if (item.shellRole === "far") {
        return {
            innerExpandPx: Math.max(item.innerExpandPx || 0, 12),
            innerCut: Math.max(baseCut, 0.2),
            innerFeather: Math.max(baseFeather, 0.05),
            cutBiasTop: 0.02,
            cutBiasRight: 0.02,
            cutBiasBottom: 0.08,
            cutBiasLeft: 0.02
        };
    }
    return {
        innerExpandPx: Math.max(item.innerExpandPx || 0, 8),
        innerCut: Math.max(baseCut, 0.22),
        innerFeather: Math.max(baseFeather, 0.05),
        cutBiasTop: 0.02,
        cutBiasRight: 0.02,
        cutBiasBottom: 0.08,
        cutBiasLeft: 0.02
    };
}

function autoCutSelectedShell() {
    const item = activeItem();
    if (!item || !isShellItem(item)) {
        state.status = "请先选中一个壳层，再自动清中间。~Meow";
        renderStatus();
        return;
    }
    updateActiveItem((entry) => autoFixShellItem(entry));
    state.status = "当前壳层已自动清中间。~Meow";
    render();
}

function autoCutAllShells() {
    if (!shellItems().length) {
        state.status = "还没有壳层，没法自动清中间。~Meow";
        renderStatus();
        return;
    }
    commitHistory();
    state.items = state.items.map((item) => ({ ...item, ...autoFixShellItem(item) }));
    state.status = "全部壳层已自动清中间。~Meow";
    render();
}

function resizeSelectedByFactor(factor) {
    if (!activeItem()) {
        return;
    }
    updateActiveItem((item) => {
        const nextWidth = round(Math.max(24, item.width * factor), 1);
        const nextHeight = round(Math.max(24, item.height * factor), 1);
        return {
            width: nextWidth,
            height: nextHeight,
            x: round(item.x - (nextWidth - item.width) / 2, 1),
            y: round(item.y - (nextHeight - item.height) / 2, 1)
        };
    });
    state.status = factor > 1 ? "已放大当前层。~Meow" : "已缩小当前层。~Meow";
    render();
}

function stretchSelected(axis, factor) {
    const item = activeItem();
    if (!item) {
        return;
    }
    updateActiveItem((entry) => {
        const nextWidth = axis === "x" ? round(Math.max(24, entry.width * factor), 1) : entry.width;
        const nextHeight = axis === "y" ? round(Math.max(24, entry.height * factor), 1) : entry.height;
        return {
            width: nextWidth,
            height: nextHeight,
            x: round(entry.x - (nextWidth - entry.width) / 2, 1),
            y: round(entry.y - (nextHeight - entry.height) / 2, 1)
        };
    });
    state.status = axis === "y"
        ? (factor > 1 ? "已把当前层拉高一点。~Meow" : "已把当前层压矮一点。~Meow")
        : (factor > 1 ? "已把当前层拉宽一点。~Meow" : "已把当前层收窄一点。~Meow");
    render();
}

function setSelectedScalePercent(percent) {
    const item = activeItem();
    if (!item) {
        return;
    }
    const baseWidth = item.space === "viewport" ? VIEWPORT.width : FLOOR_BOUNDS.width;
    const baseHeight = item.space === "viewport" ? VIEWPORT.height : FLOOR_BOUNDS.height;
    const targetWidth = round(baseWidth * (percent / 100), 1);
    const targetHeight = round(baseHeight * (percent / 100), 1);
    updateActiveItem((entry) => ({
        width: targetWidth,
        height: targetHeight,
        x: round(entry.x + (entry.width - targetWidth) / 2, 1),
        y: round(entry.y + (entry.height - targetHeight) / 2, 1)
    }));
    state.status = `已把当前层缩放到 ${percent}%。~Meow`;
    render();
}

function setSelectedRotation(rotation) {
    const item = activeItem();
    if (!item) {
        return;
    }
    updateActiveItem(() => ({ rotation: round(rotation, 1) }));
    state.status = `已把当前层旋转到 ${round(rotation, 1)}°。~Meow`;
    render();
}

function applySmartErase(level) {
    const item = activeItem();
    if (!item || !isShellItem(item)) {
        state.status = "请先选中一个壳层，再扣中间。~Meow";
        renderStatus();
        return;
    }
    const configs = {
        light: { cut: 0.08, feather: 0.02, bottom: 0.02, expand: 2 },
        medium: { cut: 0.14, feather: 0.04, bottom: 0.05, expand: 6 },
        heavy: { cut: 0.21, feather: 0.06, bottom: 0.08, expand: 12 }
    };
    const cfg = configs[level];
    updateActiveItem((entry) => isShellItem(entry) ? {
        innerExpandPx: Math.max(entry.innerExpandPx || 0, cfg.expand),
        innerCut: Math.max(entry.innerCut || 0, cfg.cut),
        innerFeather: Math.max(entry.innerFeather || 0, cfg.feather),
        cutBiasBottom: Math.max(entry.cutBiasBottom || 0, cfg.bottom)
    } : {});
    state.status = `已执行${level === "light" ? "轻扣" : level === "medium" ? "中扣" : "重扣"}中间。~Meow`;
    render();
}

function openSpaceForBelow() {
    const item = activeItem();
    if (!item || !isShellItem(item)) {
        state.status = "请先选中一个壳层，再给下层留空间。~Meow";
        renderStatus();
        return;
    }
    updateActiveItem((entry) => isShellItem(entry) ? {
        innerExpandPx: Math.max(entry.innerExpandPx || 0, 4),
        innerCut: clampCut((entry.innerCut || 0) + 0.04),
        innerFeather: clamp(round((entry.innerFeather || 0) + 0.01, 3), 0, 0.16),
        cutBiasBottom: clamp(round((entry.cutBiasBottom || 0) + 0.03, 3), -0.24, 0.24)
    } : {});
    state.status = "已给下层留出更多叠加空间。~Meow";
    render();
}

function openTopBottomMore() {
    const item = activeItem();
    if (!item || !isShellItem(item)) {
        state.status = "请先选中一个壳层，再多扣上下。~Meow";
        renderStatus();
        return;
    }
    updateActiveItem((entry) => isShellItem(entry) ? {
        innerExpandPx: Math.max(entry.innerExpandPx || 0, 4),
        cutBiasTop: clamp(round((entry.cutBiasTop || 0) + 0.03, 3), -0.24, 0.24),
        cutBiasBottom: clamp(round((entry.cutBiasBottom || 0) + 0.05, 3), -0.24, 0.24),
        innerFeather: clamp(round((entry.innerFeather || 0) + 0.01, 3), 0, 0.16)
    } : {});
    state.status = "已把上下再扣开一点。~Meow";
    render();
}

function makeForegroundCover() {
    const item = activeItem();
    if (!item || !isShellItem(item)) {
        state.status = "请先选中一个壳层，再做前景轻覆盖。~Meow";
        renderStatus();
        return;
    }
    updateActiveItem((entry) => isShellItem(entry) ? {
        width: round(entry.width * 1.03, 1),
        height: round(entry.height * 1.03, 1),
        x: round(entry.x - entry.width * 0.015, 1),
        y: round(entry.y - entry.height * 0.01, 1),
        opacity: round(Math.min(1, Math.max(entry.opacity || 1, 0.82)), 2),
        layerId: entry.layerId === "shell_far" ? "shell_mid" : entry.layerId
    } : {});
    state.status = "已让这一层更像前景，会轻微压住玩家和地板边缘。~Meow";
    render();
}

function expandSelectedInnerHole(deltaPx) {
    const item = activeItem();
    if (!item || !isShellItem(item)) {
        state.status = "请先选中一个壳层，再扩内边。~Meow";
        renderStatus();
        return;
    }
    updateActiveItem((entry) => isShellItem(entry) ? {
        innerExpandPx: clamp(Math.round((entry.innerExpandPx || 0) + deltaPx), 0, 12)
    } : {});
    state.status = `已把内边再扩 ${deltaPx}px。~Meow`;
    render();
}

function resetSelectedInnerHole() {
    const item = activeItem();
    if (!item || !isShellItem(item)) {
        state.status = "请先选中一个壳层，再恢复原口。~Meow";
        renderStatus();
        return;
    }
    updateActiveItem((entry) => isShellItem(entry) ? ({ innerExpandPx: 0 }) : {});
    state.status = "已恢复素材原始开口。~Meow";
    render();
}

function fillSelectedViewport() {
    const item = activeItem();
    if (!item || item.space !== "viewport") {
        state.status = "当前对象不是主画布对象，不能铺满主画面。~Meow";
        renderStatus();
        return;
    }
    updateActiveItem(() => ({
        x: 0,
        y: 0,
        width: VIEWPORT.width,
        height: VIEWPORT.height
    }));
    state.status = "已铺满主画面。~Meow";
    render();
}

function runWizardBuildStack() {
    ensureBaseShell();
    buildShellStack();
}

function explodeShellFragments() {
    const source = selectedViewportShellItem();
    if (!source) {
        state.status = "请先选中一个主壳对象，再生成前景碎层。~Meow";
        renderStatus();
        return;
    }

    commitHistory();
    const fragments = [
        { x: source.x - source.width * 0.02, y: source.y + source.height * 0.62, width: source.width * 0.26, height: source.height * 0.28, rotation: -12 },
        { x: source.x + source.width * 0.76, y: source.y + source.height * 0.58, width: source.width * 0.22, height: source.height * 0.24, rotation: 11 },
        { x: source.x + source.width * 0.26, y: source.y - source.height * 0.04, width: source.width * 0.32, height: source.height * 0.18, rotation: 6 }
    ].map((rect) => ({
        ...source,
        id: createId("item"),
        name: `${source.name}-fragment`,
        layerId: "shell_fragments",
        shellRole: "fragment",
        x: round(rect.x, 1),
        y: round(rect.y, 1),
        width: round(rect.width, 1),
        height: round(rect.height, 1),
        rotation: rect.rotation,
        opacity: 0.78,
        brightness: 0.94,
        contrast: 0.88,
        saturation: 0.92,
        parallax: 0.06,
        innerCut: 0.24,
        innerFeather: 0.05,
        cutBiasTop: 0.02,
        cutBiasRight: 0.02,
        cutBiasBottom: 0.08,
        cutBiasLeft: 0.02
    }));

    state.items.push(...fragments);
    state.status = "已生成前景碎层草案。~Meow";
    setSelection(fragments.map((item) => item.id), fragments[fragments.length - 1].id);
}

function duplicateSelected(inPlace = false) {
    if (!state.selectedIds.length) {
        return;
    }

    commitHistory();
    const newIds = [];
    state.selectedIds.forEach((itemId) => {
        const item = getItem(itemId);
        if (!item) {
            return;
        }

        const offset = inPlace ? 0 : (item.space === "room" ? 40 : 30);
        const clone = {
            ...item,
            id: createId("item"),
            x: item.x + offset,
            y: item.y + offset,
            rotation: item.rotation
        };
        state.items.push(clone);
        newIds.push(clone.id);
    });

    state.status = inPlace ? "已原位复制。~Meow" : "已复制并偏移。~Meow";
    setSelection(newIds, newIds[newIds.length - 1]);
}

function duplicateSelectionForAltDrag() {
    const originalIds = [...state.selectedIds];
    const newIds = [];
    originalIds.forEach((itemId) => {
        const item = getItem(itemId);
        if (!item) {
            return;
        }
        const clone = { ...item, id: createId("item") };
        state.items.push(clone);
        newIds.push(clone.id);
    });
    state.status = "已 Alt 拖拽复制。~Meow";
    state.selectedIds = newIds;
    state.activeId = newIds[newIds.length - 1] || null;
    return newIds;
}

function removeSelected() {
    if (!state.selectedIds.length) {
        return;
    }

    commitHistory();
    const selected = new Set(state.selectedIds);
    state.items = state.items.filter((item) => !selected.has(item.id));
    state.status = "已删除选中对象。~Meow";
    setSelection([]);
}

function rotateSelected(delta) {
    updateSelectedItems((item) => ({ rotation: round(item.rotation + delta, 1) }));
    state.status = `已旋转 ${delta > 0 ? "+" : ""}${delta}°。~Meow`;
}

function nudgeSelected(dx, dy) {
    if (!state.selectedIds.length) {
        return;
    }

    updateSelectedItems((item) => {
        const step = item.space === "room" ? 5 : 3;
        return { x: round(item.x + dx * step, 1), y: round(item.y + dy * step, 1) };
    });
}

function reorderSelected(direction) {
    if (!state.selectedIds.length) {
        return;
    }

    commitHistory();
    const selected = new Set(state.selectedIds);
    const ordered = [...state.items];
    if (direction > 0) {
        for (let index = ordered.length - 2; index >= 0; index -= 1) {
            if (selected.has(ordered[index].id) && !selected.has(ordered[index + 1].id)) {
                [ordered[index], ordered[index + 1]] = [ordered[index + 1], ordered[index]];
            }
        }
    } else {
        for (let index = 1; index < ordered.length; index += 1) {
            if (selected.has(ordered[index].id) && !selected.has(ordered[index - 1].id)) {
                [ordered[index], ordered[index - 1]] = [ordered[index - 1], ordered[index]];
            }
        }
    }
    state.items = ordered;
    render();
}

function alignSelectedToRoomCenter() {
    updateSelectedItems((item) => {
        if (!isRoomSpace(item.space)) {
            return {
                x: round((VIEWPORT.width - item.width) / 2, 1),
                y: round((VIEWPORT.height - item.height) / 2, 1)
            };
        }

        return {
            x: round((ROOM.width - item.width) / 2, 1),
            y: round((ROOM.height - item.height) / 2, 1)
        };
    });
}

function alignSelectedToFloorCenter() {
    updateSelectedItems((item) => {
        if (!isRoomSpace(item.space)) {
            return {
                x: round(ROOM_FRAME.x + roomPx(ROOM.wall) + (roomPx(ROOM.width - ROOM.wall * 2) - item.width) / 2, 1),
                y: round(ROOM_FRAME.y + roomPx(ROOM.wall) + (roomPx(ROOM.height - ROOM.wall * 2) - item.height) / 2, 1)
            };
        }

        const floorSize = ROOM.width - ROOM.wall * 2;
        return {
            x: round(ROOM.wall + (floorSize - item.width) / 2, 1),
            y: round(ROOM.wall + (floorSize - item.height) / 2, 1)
        };
    });
}

function exportScene() {
    const payload = {
        viewport: VIEWPORT,
        room: ROOM,
        roomFrame: ROOM_FRAME,
        guides: state.guides,
        layerState: state.layerState,
        customAssets: state.customAssets,
        items: state.items
    };
    const text = JSON.stringify(payload, null, 2);
    dom.exportOutput.value = text;
    dom.exportStatus.textContent = "已生成 JSON。~Meow";
}

function exportShellConfig() {
    const shellItems = state.items
        .filter((item) => isShellItem(item))
        .map((item) => ({
            id: item.id,
            name: item.name,
            assetId: item.assetId,
            layerId: item.layerId,
            shellRole: item.shellRole || "none",
            x: round(item.x, 1),
            y: round(item.y, 1),
            width: round(item.width, 1),
            height: round(item.height, 1),
            rotation: round(item.rotation, 1),
            opacity: round(item.opacity, 2),
            brightness: round(item.brightness, 2),
            contrast: round(item.contrast, 2),
            saturation: round(item.saturation, 2),
            hue: round(item.hue, 1),
            blendMode: item.blendMode || "normal",
            parallax: round(item.parallax || 0, 2),
            innerCut: round(item.innerCut || 0, 2),
            innerFeather: round(item.innerFeather || 0, 2),
            cutBiasTop: round(item.cutBiasTop || 0, 2),
            cutBiasRight: round(item.cutBiasRight || 0, 2),
            cutBiasBottom: round(item.cutBiasBottom || 0, 2),
            cutBiasLeft: round(item.cutBiasLeft || 0, 2),
            source: getAsset(item.assetId)?.path || ""
        }));

    const payload = {
        version: 1,
        viewport: VIEWPORT,
        playArea: getPlayAreaRect(),
        shellLayers: shellItems
    };

    dom.exportOutput.value = JSON.stringify(payload, null, 2);
    dom.exportStatus.textContent = `已导出 ${shellItems.length} 个壳层配置。~Meow`;
}

function importScene() {
    const text = dom.exportOutput.value.trim();
    if (!text) {
        dom.exportStatus.textContent = "没有可导入内容。~Meow";
        return;
    }

    try {
        const parsed = JSON.parse(text);
        commitHistory();
        state.customAssets = Array.isArray(parsed.customAssets)
            ? parsed.customAssets.map((asset) => ({ ...asset, layerId: normalizeLayerId(asset.layerId || "shell_primary") }))
            : [];
        state.items = Array.isArray(parsed.items) ? parsed.items.map(normalizeItem) : [];
        state.guides = { ...DEFAULT_GUIDES, ...(parsed.guides || {}) };
        state.layerState = { ...state.layerState, ...(parsed.layerState || {}) };
        state.status = "已导入场景。~Meow";
        dom.exportStatus.textContent = "导入完成。~Meow";
        setSelection([]);
    } catch (error) {
        dom.exportStatus.textContent = `导入失败：${error.message} ~Meow`;
    }
}

async function copyExport() {
    if (!dom.exportOutput.value.trim()) {
        exportScene();
    }

    try {
        await navigator.clipboard.writeText(dom.exportOutput.value);
        dom.exportStatus.textContent = "已复制到剪贴板。~Meow";
    } catch (error) {
        dom.exportStatus.textContent = "复制失败，请手动复制。~Meow";
    }
}

function buildSnapLines(itemId) {
    const active = getItem(itemId);
    if (!active) {
        return null;
    }

    const horizontal = active.space === "room"
        ? [
            ROOM_FRAME.x,
            ROOM_FRAME.x + roomPx(ROOM.wall),
            ROOM_FRAME.x + roomPx(ROOM.width / 2),
            ROOM_FRAME.x + roomPx(ROOM.width - ROOM.wall),
            ROOM_FRAME.x + ROOM_FRAME.size,
            ROOM_FRAME.x + roomPx((ROOM.width - ROOM.door) / 2),
            ROOM_FRAME.x + roomPx((ROOM.width + ROOM.door) / 2)
        ]
        : [0, VIEWPORT.width / 2, VIEWPORT.width, ROOM_FRAME.x + roomPx(FLOOR_BOUNDS.left), ROOM_FRAME.x + ROOM_FRAME.size / 2, ROOM_FRAME.x + roomPx(FLOOR_BOUNDS.right)];

    const vertical = active.space === "room"
        ? [
            ROOM_FRAME.y,
            ROOM_FRAME.y + roomPx(ROOM.wall),
            ROOM_FRAME.y + roomPx(ROOM.height / 2),
            ROOM_FRAME.y + roomPx(ROOM.height - ROOM.wall),
            ROOM_FRAME.y + ROOM_FRAME.size,
            ROOM_FRAME.y + roomPx((ROOM.height - ROOM.door) / 2),
            ROOM_FRAME.y + roomPx((ROOM.height + ROOM.door) / 2)
        ]
        : [0, VIEWPORT.height / 2, VIEWPORT.height, ROOM_FRAME.y + roomPx(FLOOR_BOUNDS.top), ROOM_FRAME.y + ROOM_FRAME.size / 2, ROOM_FRAME.y + roomPx(FLOOR_BOUNDS.bottom)];

    return { horizontal, vertical };
}

function applySnap(rect, item) {
    dom.alignLineX.classList.add("hidden");
    dom.alignLineY.classList.add("hidden");

    if (!state.guides.snap) {
        return rect;
    }

    const lines = buildSnapLines(item.id);
    if (!lines) {
        return rect;
    }

    const threshold = item.space === "room" ? 16 : 12;
    const snapped = { ...rect };
    const xCandidates = [rect.x, rect.x + rect.width / 2, rect.x + rect.width];
    const yCandidates = [rect.y, rect.y + rect.height / 2, rect.y + rect.height];
    let bestX = null;
    let bestY = null;

    lines.horizontal.forEach((line) => {
        xCandidates.forEach((candidate, index) => {
            const delta = line - candidate;
            if (Math.abs(delta) <= threshold && (!bestX || Math.abs(delta) < Math.abs(bestX.delta))) {
                bestX = { delta, line, index };
            }
        });
    });

    lines.vertical.forEach((line) => {
        yCandidates.forEach((candidate, index) => {
            const delta = line - candidate;
            if (Math.abs(delta) <= threshold && (!bestY || Math.abs(delta) < Math.abs(bestY.delta))) {
                bestY = { delta, line, index };
            }
        });
    });

    if (bestX) {
        snapped.x += bestX.delta;
        dom.alignLineX.classList.remove("hidden");
        setFrame(dom.alignLineX, bestX.line, 0, 1, VIEWPORT.height);
    }

    if (bestY) {
        snapped.y += bestY.delta;
        dom.alignLineY.classList.remove("hidden");
        setFrame(dom.alignLineY, 0, bestY.line, VIEWPORT.width, 1);
    }

    return snapped;
}

function beginPointer(action) {
    state.pointer = action;
}

function clearPointer() {
    if (state.pointer?.pointerId != null && dom.sceneRoot?.releasePointerCapture) {
        try {
            dom.sceneRoot.releasePointerCapture(state.pointer.pointerId);
        } catch (error) {
            // ignore release failures
        }
    }
    state.pointer = null;
    dom.selectionBox.classList.add("hidden");
    dom.alignLineX.classList.add("hidden");
    dom.alignLineY.classList.add("hidden");
}

function handleScenePointerDown(event) {
    const focusedLayerItem = !event.ctrlKey && !event.metaKey && !event.shiftKey ? getFocusedLayerItem() : null;
    const itemNode = event.target.closest(".scene-item");
    const handle = event.target.dataset.handle;
    const point = scenePointFromClient(event.clientX, event.clientY);

    if (focusedLayerItem || itemNode) {
        event.preventDefault();
        event.stopPropagation();
        if (dom.sceneRoot?.setPointerCapture) {
            try {
                dom.sceneRoot.setPointerCapture(event.pointerId);
            } catch (error) {
                // ignore capture failures
            }
        }
        const itemId = focusedLayerItem?.id || itemNode.dataset.itemId;
        const item = focusedLayerItem || getItem(itemId);
        const layerCfg = state.layerState[item.layerId];
        if (layerCfg?.locked) {
            return;
        }

        selectSingle(itemId, false);
        const rect = toScreenRect(item);
        if (!focusedLayerItem && handle === "resize") {
            commitHistory();
            beginPointer({
                mode: "resize",
                pointerId: event.pointerId,
                itemId,
                startPoint: point,
                startRect: rect,
                shiftKey: event.shiftKey
            });
            return;
        }

        if (!focusedLayerItem && handle === "rotate") {
            const center = { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
            commitHistory();
            beginPointer({
                mode: "rotate",
                pointerId: event.pointerId,
                itemId,
                center,
                startAngle: Math.atan2(point.y - center.y, point.x - center.x),
                originRotation: item.rotation
            });
            return;
        }

        commitHistory();
        beginPointer({
            mode: "move",
            pointerId: event.pointerId,
            itemIds: [...state.selectedIds],
            startPoint: point,
            startRects: state.selectedIds.map((id) => ({ id, rect: toScreenRect(getItem(id)) })),
            altCloneReady: event.altKey
        });
        return;
    }

    if (state.tool === "pan") {
        beginPointer({
            mode: "pan",
            pointerId: event.pointerId,
            startPoint: { x: event.clientX, y: event.clientY },
            scrollLeft: dom.sceneRoot.parentElement.scrollLeft,
            scrollTop: dom.sceneRoot.parentElement.scrollTop
        });
        return;
    }

    if (!event.ctrlKey && !event.metaKey) {
        setSelection([]);
    }

    beginPointer({
        mode: "box",
        pointerId: event.pointerId,
        startPoint: point,
        currentPoint: point,
        additive: event.ctrlKey || event.metaKey
    });
    dom.selectionBox.classList.remove("hidden");
    setFrame(dom.selectionBox, point.x, point.y, 1, 1);
}

function handleScenePointerMove(event) {
    if (!state.pointer) {
        return;
    }

    event.preventDefault();

    const point = scenePointFromClient(event.clientX, event.clientY);
    if (state.pointer.mode === "pan") {
        const host = dom.sceneRoot.parentElement;
        host.scrollLeft = state.pointer.scrollLeft - (event.clientX - state.pointer.startPoint.x);
        host.scrollTop = state.pointer.scrollTop - (event.clientY - state.pointer.startPoint.y);
        return;
    }

    if (state.pointer.mode === "box") {
        state.pointer.currentPoint = point;
        const left = Math.min(state.pointer.startPoint.x, point.x);
        const top = Math.min(state.pointer.startPoint.y, point.y);
        const width = Math.abs(point.x - state.pointer.startPoint.x);
        const height = Math.abs(point.y - state.pointer.startPoint.y);
        setFrame(dom.selectionBox, left, top, width, height);
        return;
    }

    if (state.pointer.mode === "move") {
        if (state.pointer.altCloneReady) {
            duplicateSelectionForAltDrag();
            state.pointer.itemIds = [...state.selectedIds];
            state.pointer.startRects = state.pointer.itemIds.map((id) => ({ id, rect: toScreenRect(getItem(id)) }));
            state.pointer.altCloneReady = false;
        }
        const dx = point.x - state.pointer.startPoint.x;
        const dy = point.y - state.pointer.startPoint.y;
        state.items = state.items.map((item) => {
            const record = state.pointer.startRects.find((entry) => entry.id === item.id);
            if (!record) {
                return item;
            }
            const nextRect = applySnap({
                x: record.rect.x + dx,
                y: record.rect.y + dy,
                width: record.rect.width,
                height: record.rect.height
            }, item);
            return { ...item, ...screenToSpace(nextRect, item.space) };
        });
        render();
        return;
    }

    if (state.pointer.mode === "resize") {
        const item = getItem(state.pointer.itemId);
        if (!item) {
            return;
        }
        const dx = point.x - state.pointer.startPoint.x;
        const dy = point.y - state.pointer.startPoint.y;
        const aspect = state.pointer.startRect.width / Math.max(1, state.pointer.startRect.height);
        let width = Math.max(16, state.pointer.startRect.width + dx);
        let height = Math.max(16, state.pointer.startRect.height + dy);
        if (event.shiftKey || state.pointer.shiftKey) {
            height = width / aspect;
        }
        const nextRect = { ...state.pointer.startRect, width, height };
        const spaceRect = screenToSpace(nextRect, item.space);
        state.items = state.items.map((entry) => entry.id === item.id ? { ...entry, width: round(spaceRect.width, 1), height: round(spaceRect.height, 1) } : entry);
        render();
        return;
    }

    if (state.pointer.mode === "rotate") {
        const item = getItem(state.pointer.itemId);
        if (!item) {
            return;
        }
        const currentAngle = Math.atan2(point.y - state.pointer.center.y, point.x - state.pointer.center.x);
        const delta = ((currentAngle - state.pointer.startAngle) * 180) / Math.PI;
        state.items = state.items.map((entry) => entry.id === item.id ? { ...entry, rotation: round(state.pointer.originRotation + delta, 1) } : entry);
        render();
    }
}

function handleScenePointerUp() {
    if (!state.pointer) {
        return;
    }

    if (state.pointer.mode === "box") {
        const left = Math.min(state.pointer.startPoint.x, state.pointer.currentPoint.x);
        const top = Math.min(state.pointer.startPoint.y, state.pointer.currentPoint.y);
        const right = Math.max(state.pointer.startPoint.x, state.pointer.currentPoint.x);
        const bottom = Math.max(state.pointer.startPoint.y, state.pointer.currentPoint.y);
        const hits = state.items.filter((item) => {
            const rect = toScreenRect(item);
            return rect.x < right && rect.x + rect.width > left && rect.y < bottom && rect.y + rect.height > top;
        }).map((item) => item.id);
        const merged = state.pointer.additive ? [...state.selectedIds, ...hits] : hits;
        setSelection(merged, merged[merged.length - 1]);
    } else {
        saveState();
    }

    clearPointer();
}

function handlePropertyInput(event) {
    if (!state.selectedIds.length) {
        return;
    }

    const key = Object.entries(dom.propertyInputs).find(([, input]) => input === event.target)?.[0];
    if (!key) {
        return;
    }

    const raw = event.target.value;
    const numericKeys = new Set(["x", "y", "width", "height", "rotation", "opacity", "brightness", "contrast", "saturation", "hue", "tintOpacity", "parallax", "innerCut", "innerFeather", "cutBiasTop", "cutBiasRight", "cutBiasBottom", "cutBiasLeft"]);
    const value = numericKeys.has(key) ? Number(raw) : raw;
    updateSelectionAwareItems((entry) => {
        if (key === "opacity" || key === "tintOpacity") {
            return { [key]: clamp(value, 0, 1) };
        }
        if (key === "innerCut") {
            return { innerCut: clampCut(value) };
        }
        if (key === "innerFeather") {
            return { innerFeather: clamp(round(value, 3), 0, 0.16) };
        }
        if (key.startsWith("cutBias")) {
            return { [key]: clamp(round(value, 3), -0.24, 0.24) };
        }
        if (key === "parallax") {
            return { parallax: clamp(round(value, 3), 0, 1.5) };
        }
        if (key === "shellRole") {
            return {
                shellRole: value,
                layerId: SHELL_ROLE_TO_LAYER[value] || entry.layerId
            };
        }
        return { [key]: value };
    });
}

function addPlayground() {
    commitHistory();
    const floor = createItemFromAsset(getAsset("floor_l1"), { x: ROOM.wall, y: ROOM.wall, width: ROOM.width - ROOM.wall * 2, height: ROOM.height - ROOM.wall * 2 });
    const wall = createItemFromAsset(getAsset("wall_l1_base"), { x: ROOM.wall, y: ROOM.wall, width: ROOM.width - ROOM.wall * 2, height: ROOM.height - ROOM.wall * 2 });
    const shell = createItemFromAsset(getAsset("shell_f1_trial_primary"), { layerId: "shell_primary", shellRole: "primary" });
    const doorBase = getAsset("door_closed_l1");
    const topDoor = createItemFromAsset(doorBase, { x: (ROOM.width - ROOM.door) / 2, y: 0, width: ROOM.door, height: ROOM.door });
    const bottomDoor = createItemFromAsset(doorBase, { x: (ROOM.width - ROOM.door) / 2, y: ROOM.height - ROOM.door, width: ROOM.door, height: ROOM.door });
    const leftDoor = createItemFromAsset(doorBase, { x: 0, y: (ROOM.height - ROOM.door) / 2, width: ROOM.door, height: ROOM.door, rotation: -90 });
    const rightDoor = createItemFromAsset(doorBase, { x: ROOM.width - ROOM.door, y: (ROOM.height - ROOM.door) / 2, width: ROOM.door, height: ROOM.door, rotation: 90 });

    state.items = [shell, floor, wall, topDoor, bottomDoor, leftDoor, rightDoor];
    state.status = "已插入基础舞台。~Meow";
    setSelection([floor.id], floor.id);
}

function handleAssetDrop(event) {
    event.preventDefault();
    const assetId = event.dataTransfer?.getData("text/plain");
    if (!assetId) {
        return;
    }

    const asset = getAsset(assetId);
    if (!asset) {
        return;
    }

    const point = scenePointFromClient(event.clientX, event.clientY);
    const rect = {
        x: point.x - (isRoomSpace(asset.space) ? roomPx(asset.width) / 2 : asset.width / 2),
        y: point.y - (isRoomSpace(asset.space) ? roomPx(asset.height) / 2 : asset.height / 2),
        width: isRoomSpace(asset.space) ? roomPx(asset.width) : asset.width,
        height: isRoomSpace(asset.space) ? roomPx(asset.height) : asset.height
    };
    insertAsset(asset.id, screenToSpace(rect, asset.space));
}

function handleLocalAssets(event) {
    const files = Array.from(event.target.files || []);
    if (!files.length) {
        return;
    }

    Promise.all(files.map((file) => new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve({
            id: createId("local"),
            name: file.name.replace(/\.[^.]+$/, ""),
            path: reader.result,
            category: "local",
            layerId: state.selectedLayerId,
            space: getLayer(state.selectedLayerId).space,
            width: getLayer(state.selectedLayerId).space === "room" ? 220 : 260,
            height: getLayer(state.selectedLayerId).space === "room" ? 220 : 260,
            isLocal: true
        });
        reader.readAsDataURL(file);
    }))).then((assets) => {
        state.customAssets.push(...assets);
        state.status = `已导入 ${assets.length} 个本地素材。~Meow`;
        render();
    });

    event.target.value = "";
}

function focusSelection() {
    const item = activeItem();
    if (!item) {
        return;
    }
    const rect = toScreenRect(item);
    const host = dom.sceneRoot.parentElement;
    host.scrollLeft = Math.max(0, rect.x * state.zoom - host.clientWidth / 2 + rect.width * state.zoom / 2);
    host.scrollTop = Math.max(0, rect.y * state.zoom - host.clientHeight / 2 + rect.height * state.zoom / 2);
    state.status = "已聚焦到当前选中。~Meow";
    renderStatus();
}

function bindEvents() {
    qsa("[data-sidebar]").forEach((button) => {
        button.addEventListener("click", () => {
            state.sidebar = button.dataset.sidebar;
            qsa("[data-sidebar]").forEach((entry) => entry.classList.toggle("active", entry === button));
            qsa("[data-sidebar-panel]").forEach((panel) => panel.classList.toggle("hidden", panel.dataset.sidebarPanel !== state.sidebar));
        });
    });

    qsa("[data-tool]").forEach((button) => {
        button.addEventListener("click", () => {
            state.tool = button.dataset.tool;
            qsa("[data-tool]").forEach((entry) => entry.classList.toggle("active", entry === button));
            state.status = state.tool === "pan" ? "平移模式已启用。~Meow" : "选择模式已启用。~Meow";
            renderStatus();
        });
    });

    qsa("[data-guide]").forEach((button) => {
        button.addEventListener("click", () => {
            const key = button.dataset.guide;
            state.guides[key] = !state.guides[key];
            render();
        });
    });

    dom.assetSearchInput.addEventListener("input", (event) => {
        state.assetSearch = event.target.value;
        renderAssets();
    });
    dom.clearAssetSearchBtn.addEventListener("click", () => {
        state.assetSearch = "";
        dom.assetSearchInput.value = "";
        renderAssets();
    });
    dom.pickLocalAssetsBtn.addEventListener("click", () => dom.localAssetInput.click());
    $("duplicateShellLayerBtn").addEventListener("click", duplicateCurrentShellLayer);
    dom.localAssetInput.addEventListener("change", handleLocalAssets);

    dom.assetCategoryRow.addEventListener("click", (event) => {
        const button = event.target.closest("[data-asset-category]");
        if (!button) {
            return;
        }
        state.assetCategory = button.dataset.assetCategory;
        renderAssets();
    });

    dom.assetGrid.addEventListener("click", (event) => {
        const insertButton = event.target.closest("[data-asset-insert]");
        if (insertButton) {
            insertAsset(insertButton.dataset.assetInsert);
            return;
        }

        const replaceButton = event.target.closest("[data-asset-replace]");
        if (replaceButton) {
            replaceSelectedLayerAsset(replaceButton.dataset.assetReplace);
            return;
        }

        const card = event.target.closest("[data-asset-id]");
        if (!card) {
            return;
        }
        insertAsset(card.dataset.assetId);
    });
    dom.assetGrid.addEventListener("dragstart", (event) => {
        const card = event.target.closest("[data-asset-id]");
        if (!card) {
            return;
        }
        event.dataTransfer?.setData("text/plain", card.dataset.assetId);
    });

    dom.layerList.addEventListener("click", (event) => {
        const button = event.target.closest("button");
        if (!button) {
            return;
        }
        const { layerSelect, layerVisible, layerLock } = button.dataset;
        if (layerSelect) {
            state.selectedLayerId = layerSelect;
        }
        if (layerVisible) {
            state.layerState[layerVisible].visible = !state.layerState[layerVisible].visible;
        }
        if (layerLock) {
            state.layerState[layerLock].locked = !state.layerState[layerLock].locked;
        }
        render();
    });
    dom.layerList.addEventListener("input", (event) => {
        const slider = event.target.closest("[data-layer-opacity]");
        if (!slider) {
            return;
        }
        state.layerState[slider.dataset.layerOpacity].opacity = clamp(Number(slider.value), 0, 1);
        render();
    });
    dom.shellStackList?.addEventListener("click", (event) => {
        const selectButton = event.target.closest("[data-shell-slot-select]");
        if (selectButton) {
            state.selectedLayerId = selectButton.dataset.shellSlotSelect;
            const item = getPrimaryItemForLayer(state.selectedLayerId);
            if (item) {
                setSelection([item.id], item.id);
                return;
            }
            render();
            return;
        }

        const scaleButton = event.target.closest("[data-shell-slot-scale]");
        if (scaleButton) {
            const [layerId, dir] = scaleButton.dataset.shellSlotScale.split("|");
            const item = getPrimaryItemForLayer(layerId);
            if (item) {
                setSelection([item.id], item.id);
                resizeSelectedByFactor(dir === "up" ? 1.03 : 0.97);
            }
            return;
        }

        const expandButton = event.target.closest("[data-shell-slot-expand]");
        if (expandButton) {
            const [layerId, px] = expandButton.dataset.shellSlotExpand.split("|");
            const item = getPrimaryItemForLayer(layerId);
            if (item) {
                setSelection([item.id], item.id);
                expandSelectedInnerHole(Number(px) || 1);
            }
            return;
        }

        const focusButton = event.target.closest("[data-shell-slot-focus]");
        if (focusButton) {
            const item = ensureLayerHasDefaultItem(focusButton.dataset.shellSlotFocus);
            if (item) {
                focusSelection();
            }
            return;
        }

        const clearButton = event.target.closest("[data-shell-slot-clear]");
        if (clearButton) {
            const layerId = clearButton.dataset.shellSlotClear;
            state.items = state.items.filter((item) => item.layerId !== layerId);
            state.status = `已清空 ${getLayer(layerId).name}。~Meow`;
            setSelection([]);
        }
    });
    qsa("[data-shell-theme]").forEach((button) => {
        button.addEventListener("click", () => applyShellThemePreset(button.dataset.shellTheme));
    });
    qsa("[data-shell-select-trio]").forEach((button) => {
        button.addEventListener("click", selectShellTrio);
    });
    qsa("[data-scroll-target]").forEach((button) => {
        button.addEventListener("click", () => scrollToWorkbenchTarget(button.dataset.scrollTarget));
    });
    qsa("[data-inspector-card-button]").forEach((button) => {
        button.addEventListener("click", () => {
            state.inspectorCard = button.dataset.inspectorCardButton || "quick";
            renderWorkbenchModes();
            saveState();
        });
    });
    qsa("[data-canvas-card-button]").forEach((button) => {
        button.addEventListener("click", () => {
            state.canvasCard = button.dataset.canvasCardButton || "tools";
            renderWorkbenchModes();
            saveState();
        });
    });

    dom.usedAssetList.addEventListener("click", (event) => {
        const insertButton = event.target.closest("[data-used-insert]");
        if (insertButton) {
            insertAsset(insertButton.dataset.usedInsert);
            return;
        }

        const filterButton = event.target.closest("[data-used-filter]");
        if (filterButton) {
            state.assetCategory = filterButton.dataset.usedFilter;
            state.sidebar = "assets";
            qsa("[data-sidebar]").forEach((entry) => entry.classList.toggle("active", entry.dataset.sidebar === "assets"));
            qsa("[data-sidebar-panel]").forEach((panel) => panel.classList.toggle("hidden", panel.dataset.sidebarPanel !== "assets"));
            renderAssets();
        }
    });

    dom.sceneRoot.addEventListener("pointerdown", handleScenePointerDown);
    window.addEventListener("pointermove", handleScenePointerMove);
    window.addEventListener("pointerup", handleScenePointerUp);
    dom.sceneRoot.addEventListener("dragover", (event) => event.preventDefault());
    dom.sceneRoot.addEventListener("drop", handleAssetDrop);

    Object.values(dom.propertyInputs).forEach((input) => input.addEventListener("input", handlePropertyInput));

    $("addPlaygroundBtn").addEventListener("click", addPlayground);
    $("toggleShellFocusBtn")?.addEventListener("click", () => {
        state.shellFocus = !state.shellFocus;
        render();
    });
    $("safeBootBtn").addEventListener("click", () => {
        resetWorkbenchState();
        state.status = "已安全启动，旧缓存已清空。~Meow";
        ensureLayerHasDefaultItem("floor");
        render();
    });
    $("syncRuntimeLayoutBtn").addEventListener("click", syncRuntimeLayoutFromProbe);
    $("insertShellBaseBtn").addEventListener("click", insertBaseShell);
    $("wizardBuildStackBtn").addEventListener("click", runWizardBuildStack);
    $("wizardAutoFixBtn").addEventListener("click", autoCutAllShells);
    $("wizardExportShellBtn").addEventListener("click", exportShellConfig);
    $("quickBuildShellStackBtn")?.addEventListener("click", buildShellStack);
    $("quickExportShellBtn")?.addEventListener("click", exportShellConfig);
    $("quickCopyShellConfigBtn")?.addEventListener("click", quickCopyShellConfig);
    $("resetSceneBtn").addEventListener("click", () => {
        commitHistory();
        state.items = [];
        state.status = "场景已清空。~Meow";
        setSelection([]);
    });
    $("openWorkbenchBtn").addEventListener("click", () => {
        window.location.href = "./debug_workbench.html";
    });
    $("buildShellStackBtn").addEventListener("click", buildShellStack);
    $("explodeShellFragmentsBtn").addEventListener("click", explodeShellFragments);
    $("duplicateBtn").addEventListener("click", () => duplicateSelected(false));
    $("duplicateInPlaceBtn").addEventListener("click", () => duplicateSelected(true));
    $("undoBtn").addEventListener("click", undoHistory);
    $("redoBtn").addEventListener("click", redoHistory);
    $("rotateLeftBtn").addEventListener("click", () => rotateSelected(-15));
    $("rotateRightBtn").addEventListener("click", () => rotateSelected(15));
    $("bringForwardBtn").addEventListener("click", () => reorderSelected(1));
    $("sendBackwardBtn").addEventListener("click", () => reorderSelected(-1));
    $("deleteItemBtn").addEventListener("click", removeSelected);
    $("zoomOutBtn").addEventListener("click", () => { state.zoom = clamp(round(state.zoom - 0.1, 2), 0.35, 1.5); render(); });
    $("zoomResetBtn").addEventListener("click", () => { state.zoom = 1; render(); });
    $("zoomInBtn").addEventListener("click", () => { state.zoom = clamp(round(state.zoom + 0.1, 2), 0.35, 1.5); render(); });
    $("alignCenterRoomBtn").addEventListener("click", alignSelectedToRoomCenter);
    $("alignCenterFloorBtn").addEventListener("click", alignSelectedToFloorCenter);
    $("focusSelectionBtn").addEventListener("click", focusSelection);
    $("applyRecommendedShellBtn").addEventListener("click", applyRecommendedShellPreset);
    $("autoCutSelectedBtn").addEventListener("click", autoCutSelectedShell);
    $("autoCutAllBtn").addEventListener("click", autoCutAllShells);
    $("smartScaleDownBtn").addEventListener("click", () => resizeSelectedByFactor(0.97));
    $("smartScaleUpBtn").addEventListener("click", () => resizeSelectedByFactor(1.03));
    $("smartFillViewportBtn").addEventListener("click", fillSelectedViewport);
    $("smartStretchHeightDownBtn").addEventListener("click", () => stretchSelected("y", 0.98));
    $("smartStretchHeightUpBtn").addEventListener("click", () => stretchSelected("y", 1.02));
    $("smartStretchWidthDownBtn").addEventListener("click", () => stretchSelected("x", 0.98));
    $("smartStretchWidthUpBtn").addEventListener("click", () => stretchSelected("x", 1.02));
    $("smartRotateLeft1Btn").addEventListener("click", () => rotateSelected(-1));
    $("smartRotateRight1Btn").addEventListener("click", () => rotateSelected(1));
    $("smartRotateLeft5Btn").addEventListener("click", () => rotateSelected(-5));
    $("smartRotateRight5Btn").addEventListener("click", () => rotateSelected(5));
    $("smartRotateResetBtn").addEventListener("click", () => setSelectedRotation(0));
    $("smartEraseLightBtn").addEventListener("click", () => applySmartErase("light"));
    $("smartEraseMediumBtn").addEventListener("click", () => applySmartErase("medium"));
    $("smartEraseHeavyBtn").addEventListener("click", () => applySmartErase("heavy"));
    $("smartExpand1Btn").addEventListener("click", () => expandSelectedInnerHole(1));
    $("smartExpand2Btn").addEventListener("click", () => expandSelectedInnerHole(2));
    $("smartExpand4Btn").addEventListener("click", () => expandSelectedInnerHole(4));
    $("smartExpandResetBtn").addEventListener("click", resetSelectedInnerHole);
    $("smartOpenForBelowBtn").addEventListener("click", openSpaceForBelow);
    $("smartTopBottomOpenBtn").addEventListener("click", openTopBottomMore);
    $("smartForegroundCoverBtn").addEventListener("click", makeForegroundCover);
    dom.smartScaleRange?.addEventListener("input", (event) => {
        setSelectedScalePercent(clamp(Number(event.target.value) || 100, 60, 140));
    });
    dom.smartRotateRange?.addEventListener("input", (event) => {
        setSelectedRotation(clamp(Number(event.target.value) || 0, -180, 180));
    });
    qsa("[data-color-preset]").forEach((button) => {
        button.addEventListener("click", () => applyColorPreset(button.dataset.colorPreset));
    });
    dom.directTintColor?.addEventListener("input", applyDirectTint);
    dom.directTintStrength?.addEventListener("input", applyDirectTint);
    dom.doorLightColor?.addEventListener("input", (event) => patchDoorLight({ color: event.target.value }));
    dom.doorLightIntensity?.addEventListener("input", (event) => patchDoorLight({ intensity: event.target.value }));
    dom.doorLightOpacity?.addEventListener("input", (event) => patchDoorLight({ opacity: event.target.value }));
    dom.doorLightLength?.addEventListener("input", (event) => patchDoorLight({ length: event.target.value }));
    dom.doorLightSpread?.addEventListener("input", (event) => patchDoorLight({ spread: event.target.value }));
    dom.doorLightSoftness?.addEventListener("input", (event) => patchDoorLight({ softness: event.target.value }));
    dom.doorLightLip?.addEventListener("input", (event) => patchDoorLight({ lip: event.target.value }));
    $("copyDoorLightBtn").addEventListener("click", copyDoorLightConfig);
    $("resetDoorLightBtn").addEventListener("click", () => {
        state.doorLight = { ...DEFAULT_DOOR_LIGHT };
        render();
    });
    $("exportBtn").addEventListener("click", exportScene);
    $("exportShellBtn").addEventListener("click", exportShellConfig);
    $("copyBtn").addEventListener("click", copyExport);
    $("importBtn").addEventListener("click", importScene);

    window.addEventListener("keydown", (event) => {
        if (["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName)) {
            return;
        }

        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "d") {
            event.preventDefault();
            duplicateSelected(false);
            return;
        }
        if ((event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === "z") {
            event.preventDefault();
            undoHistory();
            return;
        }
        if (((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "y")
            || ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === "z")) {
            event.preventDefault();
            redoHistory();
            return;
        }

        if (event.key === "Delete" || event.key === "Backspace") {
            event.preventDefault();
            removeSelected();
            return;
        }

        if (event.key === "[") {
            rotateSelected(-15);
            return;
        }
        if (event.key === "]") {
            rotateSelected(15);
            return;
        }
        if (event.key === "ArrowLeft") {
            event.preventDefault();
            nudgeSelected(-1, 0);
            return;
        }
        if (event.key === "ArrowRight") {
            event.preventDefault();
            nudgeSelected(1, 0);
            return;
        }
        if (event.key === "ArrowUp") {
            event.preventDefault();
            nudgeSelected(0, -1);
            return;
        }
        if (event.key === "ArrowDown") {
            event.preventDefault();
            nudgeSelected(0, 1);
        }
    });
}

function init() {
    hydrateDom();
    applyLayoutSnapshot(computeFallbackLayout(VIEWPORT.width, VIEWPORT.height));
    loadState();
    setupStaticFrames();
    ensureLayerHasDefaultItem("floor");
    bindEvents();
    render();
}

init();
