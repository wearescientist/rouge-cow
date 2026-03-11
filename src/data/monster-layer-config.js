/**
 * 怪物分层配置系统 v1.0
 * 
 * 架构：8全局基础模板 + 每层主题变体 + T2精英 + T3小Boss + Boss
 * T3统一使用最终Boss变体池
 */

// ==================== 全局基础模板池 (8个) ====================
// 这些是整个游戏的核心生态基础，会在所有楼层出现（带主题变体）
const CORE_BASE_TEMPLATES = [
    {
        templateId: 'bat_v2',
        baseId: 'bat',
        version: 'v2',
        displayName: '小蝙蝠',
        role: 'flying_harass',
        defaultSize: 28,
        defaultStats: { hp: 10, speed: 120, attack: 1 },
        tags: ['flying', 'fast', 'night'],
        flipNeeded: true,
        hasBounce: true,
    },
    {
        templateId: 'chick_spr',
        baseId: 'chick',
        version: 'spr',
        displayName: '变异小鸡',
        role: 'fast_weak',
        defaultSize: 32,
        defaultStats: { hp: 12, speed: 100, attack: 1 },
        tags: ['ground', 'fast', 'weak'],
        flipNeeded: false,
        hasBounce: false,
    },
    {
        templateId: 'crab_v4',
        baseId: 'crab',
        version: 'v4',
        displayName: '铁甲蟹',
        role: 'tank_melee',
        defaultSize: 36,
        defaultStats: { hp: 20, speed: 60, attack: 2 },
        tags: ['ground', 'slow', 'armor'],
        flipNeeded: false,
        hasBounce: false,
    },
    {
        templateId: 'fox_v1',
        baseId: 'fox',
        version: 'v1',
        displayName: '幼狐',
        role: 'fast_assassin',
        defaultSize: 40,
        defaultStats: { hp: 15, speed: 150, attack: 2 },
        tags: ['ground', 'fast', 'dodge'],
        flipNeeded: false,
        hasBounce: false,
    },
    {
        templateId: 'snail_v1',
        baseId: 'snail',
        version: 'v1',
        displayName: '蜗牛',
        role: 'slow_tank',
        defaultSize: 36,
        defaultStats: { hp: 25, speed: 45, attack: 2 },
        tags: ['ground', 'slow', 'shell'],
        flipNeeded: false,
        hasBounce: false,
    },
    {
        templateId: 'ghost_v3',
        baseId: 'ghost',
        version: 'v3',
        displayName: '怨灵',
        role: 'ethereal',
        defaultSize: 36,
        defaultStats: { hp: 15, speed: 80, attack: 2 },
        tags: ['flying', 'ethereal', 'poison_immune'],
        flipNeeded: true,
        hasBounce: true,
    },
    {
        templateId: 'rabbit2_v2',
        baseId: 'rabbit2',
        version: 'v2',
        displayName: '疯兔',
        role: 'jumper_fast',
        defaultSize: 32,
        defaultStats: { hp: 14, speed: 180, attack: 1 },
        tags: ['ground', 'jump', 'fast'],
        flipNeeded: false,
        hasBounce: true,
    },
    {
        templateId: 'snake_v4',
        baseId: 'snake',
        version: 'v4',
        displayName: '毒蛇',
        role: 'ranged_poison',
        defaultSize: 32,
        defaultStats: { hp: 16, speed: 90, attack: 2 },
        tags: ['ground', 'ranged', 'poison'],
        flipNeeded: true,
        hasBounce: false,
    },
];

// ==================== T3小Boss池 (最终Boss变体) ====================
// 所有楼层共享，根据难度分配
const T3_MINI_BOSS_POOL = [
    {
        templateId: 'mother_v2',
        baseId: 'mother',
        version: 'v2',
        displayName: '母虫幼体',
        theme: 'infant',
        stage: [1, 2],
        size: 56,
        stats: { hp: 300, speed: 60, attack: 5 },
        visualStyle: 'pale_pink_slime',
    },
    {
        templateId: 'mother_v6',
        baseId: 'mother',
        version: 'v6',
        displayName: '成熟母虫',
        theme: 'mature',
        stage: [3, 4],
        size: 64,
        stats: { hp: 600, speed: 70, attack: 8 },
        visualStyle: 'armor_shell',
    },
    {
        templateId: 'mother_v3',
        baseId: 'mother',
        version: 'v3',
        displayName: '变异母虫',
        theme: 'mutant',
        stage: [2, 3, 4],
        size: 60,
        stats: { hp: 450, speed: 75, attack: 7 },
        visualStyle: 'chaos_mutated',
    },
    {
        templateId: 'mother_v7',
        baseId: 'mother',
        version: 'v7',
        displayName: '深渊母虫',
        theme: 'abyss',
        stage: [5],
        size: 68,
        stats: { hp: 900, speed: 65, attack: 10 },
        visualStyle: 'tentacle_dark',
    },
    {
        templateId: 'mother_v8',
        baseId: 'mother',
        version: 'v8',
        displayName: '千根母虫',
        theme: 'roots',
        stage: [5, 6],
        size: 72,
        stats: { hp: 1200, speed: 55, attack: 12 },
        visualStyle: 'root_covered',
    },
    {
        templateId: 'mother_v10',
        baseId: 'mother',
        version: 'v10',
        displayName: '群星母体',
        theme: 'cosmic',
        stage: [6],
        size: 80,
        stats: { hp: 2000, speed: 50, attack: 15 },
        visualStyle: 'cosmic_stars',
    },
];

// ==================== T2精英候选池 ====================
// 每层从中选2-4个作为本层特色
const T2_ELITE_CANDIDATES = [
    { baseId: 'mimic', version: 'v1', name: '宝箱怪', tags: ['disguise', 'trap'] },
    { baseId: 'mimic', version: 'v5', name: '守卫宝箱', tags: ['disguise', 'guard'] },
    { baseId: 'mimic', version: 'v7', name: '宝箱守护者', tags: ['disguise', 'elite'] },
    { baseId: 'panther', version: 'v1', name: '幼豹', tags: ['fast', 'assassin'] },
    { baseId: 'panther', version: 'v10', name: '豹王', tags: ['fast', 'king'] },
    { baseId: 'pigeon', version: 'v4', name: '毒鸽', tags: ['flying', 'swarm'] },
    { baseId: 'pigeon', version: 'v8', name: '鸽王', tags: ['flying', 'king'] },
    { baseId: 'nibei', version: 'spr', name: '小泥龟', tags: ['tank', 'slow'] },
    { baseId: 'nibei', version: 'v6', name: '泥背', tags: ['tank', 'elite'] },
    { baseId: 'yinya', version: 'v7', name: '狼王银牙', tags: ['elite', 'boss_like'] },
    { baseId: 'bee', version: 'v6', name: '毒蜂', tags: ['flying', 'poison'] },
    { baseId: 'goose', version: 'v6', name: '守卫鹅', tags: ['aggressive', 'guard'] },
    { baseId: 'goose', version: 'v10', name: '鹅王', tags: ['aggressive', 'king'] },
    { baseId: 'bat', version: 'v9', name: '蝙蝠王', tags: ['flying', 'king'] },
    { baseId: 'crab', version: 'v8', name: '蟹王', tags: ['tank', 'king'] },
    { baseId: 'fox', version: 'v7', name: '妖狐', tags: ['magic', 'illusion'] },
    { baseId: 'fox', version: 'v8', name: '九尾狐', tags: ['magic', 'elite'] },
];

// ==================== Boss配置 ====================
const FLOOR_BOSSES = {
    1: null, // 教学层无Boss
    2: { baseId: 'yinya', version: 'v7', name: '狼王银牙', size: 88, hp: 800, speed: 150 },
    3: { baseId: 'nibei', version: 'v6', name: '远古泥背', size: 80, hp: 1000, speed: 80 },
    4: { baseId: 'wolf_king', version: 'v2', name: '狼王', size: 88, hp: 1200, speed: 160 },
    5: { baseId: 'mother', version: 'v6', name: '母虫', size: 96, hp: 2000, speed: 70 },
    6: { baseId: 'mother', version: 'v10', name: '群星母体', size: 112, hp: 5000, speed: 60 },
};

// ==================== 楼层主题变体配置 ====================
const FLOOR_THEMES = {
    1: { name: '菌丝区', variant: 'fungal', color: '#4ade80', desc: '菌丝绿色调，轻微腐蚀' },
    2: { name: '孵化温室', variant: 'warm', color: '#fbbf24', desc: '温室暖色调，孵化囊泡' },
    3: { name: '神经索', variant: 'neural', color: '#60a5fa', desc: '神经紫蓝色，触须元素' },
    4: { name: '消化熔炉', variant: 'hot', color: '#f87171', desc: '熔炉橙红色，高温裂纹' },
    5: { name: '母虫庭院', variant: 'abyss', color: '#a78bfa', desc: '母虫紫黑色，生物质感' },
    6: { name: '千根之心', variant: 'cosmic', color: '#38bdf8', desc: '星空深蓝，根须星空化' },
};

// ==================== 每层怪物配置 (按新架构) ====================
const FLOOR_MONSTER_CONFIG = {
    // Floor 1: 菌丝区 - 教学层
    1: {
        // 基础怪：4个模板，轻微变体
        basics: [
            { templateIdx: 0, variant: 'fungal', size: 28, hp: 10, speed: 120, spawnWeight: 0.3 },
            { templateIdx: 1, variant: 'fungal', size: 32, hp: 12, speed: 100, spawnWeight: 0.25 },
            { templateIdx: 2, variant: 'fungal', size: 36, hp: 20, speed: 60, spawnWeight: 0.25 },
            { templateIdx: 4, variant: 'fungal', size: 36, hp: 25, speed: 45, spawnWeight: 0.2 },
        ],
        // T2：1个，教学伪装机制
        t2: [
            { baseId: 'mimic', version: 'v1', size: 44, hp: 50, speed: 70, weight: 0.3, skills: ['disguise'] },
        ],
        // T3：无（或极弱化幼体，极低概率）
        t3: null,
        // Boss：无
        boss: null,
    },
    
    // Floor 2: 孵化温室
    2: {
        basics: [
            { templateIdx: 0, variant: 'warm', size: 28, hp: 15, speed: 130, spawnWeight: 0.2 },
            { templateIdx: 3, variant: 'warm', size: 40, hp: 18, speed: 150, spawnWeight: 0.25 },
            { templateIdx: 5, variant: 'warm', size: 36, hp: 20, speed: 90, spawnWeight: 0.2 },
            { templateIdx: 6, variant: 'warm', size: 32, hp: 16, speed: 180, spawnWeight: 0.2 },
        ],
        t2: [
            { baseId: 'pigeon', version: 'v4', size: 36, hp: 25, speed: 140, weight: 0.25 },
            { baseId: 'panther', version: 'v1', size: 44, hp: 40, speed: 200, weight: 0.2 },
            { baseId: 'mimic', version: 'v5', size: 44, hp: 60, speed: 70, weight: 0.15 },
        ],
        t3: { templateId: 'mother_v2', hpScale: 1.0 }, // 幼体
        boss: FLOOR_BOSSES[2],
    },
    
    // Floor 3: 神经索
    3: {
        basics: [
            { templateIdx: 0, variant: 'neural', size: 28, hp: 20, speed: 130, spawnWeight: 0.2 },
            { templateIdx: 2, variant: 'neural', size: 36, hp: 28, speed: 65, spawnWeight: 0.25 },
            { templateIdx: 7, variant: 'neural', size: 32, hp: 22, speed: 95, spawnWeight: 0.25 },
            { templateIdx: 5, variant: 'neural', size: 36, hp: 25, speed: 85, spawnWeight: 0.2 },
        ],
        t2: [
            { baseId: 'nibei', version: 'spr', size: 40, hp: 50, speed: 50, weight: 0.25 },
            { baseId: 'fox', version: 'v7', size: 44, hp: 35, speed: 160, weight: 0.2 },
            { baseId: 'bat', version: 'v9', size: 36, hp: 30, speed: 150, weight: 0.2 },
        ],
        t3: { templateId: 'mother_v3', hpScale: 1.0 }, // 变异体
        boss: FLOOR_BOSSES[3],
    },
    
    // Floor 4: 消化熔炉
    4: {
        basics: [
            { templateIdx: 3, variant: 'hot', size: 40, hp: 25, speed: 150, spawnWeight: 0.2 },
            { templateIdx: 6, variant: 'hot', size: 32, hp: 22, speed: 180, spawnWeight: 0.2 },
            { templateIdx: 4, variant: 'hot', size: 36, hp: 35, speed: 50, spawnWeight: 0.25 },
            { templateIdx: 7, variant: 'hot', size: 32, hp: 24, speed: 95, spawnWeight: 0.25 },
        ],
        t2: [
            { baseId: 'goose', version: 'v6', size: 48, hp: 60, speed: 90, weight: 0.25 },
            { baseId: 'panther', version: 'v10', size: 48, hp: 55, speed: 220, weight: 0.2 },
            { baseId: 'crab', version: 'v8', size: 48, hp: 70, speed: 60, weight: 0.2 },
        ],
        t3: { templateId: 'mother_v6', hpScale: 0.8 }, // 成熟体（预热Boss）
        boss: FLOOR_BOSSES[4],
    },
    
    // Floor 5: 母虫庭院
    5: {
        basics: [
            { templateIdx: 0, variant: 'abyss', size: 28, hp: 25, speed: 130, spawnWeight: 0.15 },
            { templateIdx: 5, variant: 'abyss', size: 36, hp: 30, speed: 90, spawnWeight: 0.2 },
            { templateIdx: 1, variant: 'abyss', size: 32, hp: 22, speed: 100, spawnWeight: 0.2 },
            { templateIdx: 2, variant: 'abyss', size: 36, hp: 35, speed: 65, spawnWeight: 0.25 },
            { templateIdx: 4, variant: 'abyss', size: 36, hp: 40, speed: 50, spawnWeight: 0.2 },
        ],
        t2: [
            { baseId: 'bee', version: 'v6', size: 32, hp: 28, speed: 180, weight: 0.25 },
            { baseId: 'goose', version: 'v10', size: 52, hp: 80, speed: 95, weight: 0.2 },
            { baseId: 'mimic', version: 'v6', size: 48, hp: 75, speed: 75, weight: 0.2 },
        ],
        t3: { templateId: 'mother_v7', hpScale: 1.0 }, // 深渊体
        boss: FLOOR_BOSSES[5],
    },
    
    // Floor 6: 千根之心
    6: {
        basics: [
            { templateIdx: 7, variant: 'cosmic', size: 32, hp: 30, speed: 100, spawnWeight: 0.2 },
            { templateIdx: 5, variant: 'cosmic', size: 36, hp: 35, speed: 95, spawnWeight: 0.2 },
            { templateIdx: 3, variant: 'cosmic', size: 40, hp: 32, speed: 160, spawnWeight: 0.2 },
            { templateIdx: 6, variant: 'cosmic', size: 32, hp: 28, speed: 190, spawnWeight: 0.2 },
        ],
        t2: [
            { baseId: 'goose', version: 'v10', size: 52, hp: 90, speed: 100, weight: 0.25 },
            { baseId: 'mimic', version: 'v8', size: 52, hp: 85, speed: 80, weight: 0.2 },
            { baseId: 'nibei', version: 'v8', size: 56, hp: 100, speed: 60, weight: 0.2 },
        ],
        t3: { templateId: 'mother_v8', hpScale: 1.0 }, // 千根体
        boss: FLOOR_BOSSES[6],
    },
};

// ==================== 辅助函数 ====================

/**
 * 获取某层的基础怪配置
 */
function getFloorBasics(floorNum) {
    const config = FLOOR_MONSTER_CONFIG[floorNum];
    if (!config || !config.basics) return [];
    
    return config.basics.map(b => {
        const template = CORE_BASE_TEMPLATES[b.templateIdx];
        return {
            ...template,
            variant: b.variant,
            size: b.size,
            hp: b.hp,
            speed: b.speed,
            spawnWeight: b.spawnWeight,
            // 生成完整ID
            fullId: `${template.baseId}_${template.version}_${b.variant}`,
        };
    });
}

/**
 * 获取某层的T2配置
 */
function getFloorT2(floorNum) {
    const config = FLOOR_MONSTER_CONFIG[floorNum];
    if (!config || !config.t2) return [];
    return config.t2;
}

/**
 * 获取某层的T3配置
 */
function getFloorT3(floorNum) {
    const config = FLOOR_MONSTER_CONFIG[floorNum];
    if (!config || !config.t3) return null;
    
    const t3Template = T3_MINI_BOSS_POOL.find(t => t.templateId === config.t3.templateId);
    if (!t3Template) return null;
    
    return {
        ...t3Template,
        hp: Math.floor(t3Template.stats.hp * (config.t3.hpScale || 1)),
    };
}

/**
 * 获取某层的Boss配置
 */
function getFloorBoss(floorNum) {
    return FLOOR_BOSSES[floorNum];
}

/**
 * 获取某层所有怪物类型（用于生成器）
 */
function getFloorMonsterPool(floorNum) {
    const basics = getFloorBasics(floorNum);
    const t2 = getFloorT2(floorNum);
    const t3 = getFloorT3(floorNum);
    const boss = getFloorBoss(floorNum);
    
    return {
        floor: floorNum,
        theme: FLOOR_THEMES[floorNum],
        basics,
        t2,
        t3,
        boss,
        // 用于普通房间生成的基础怪ID列表
        basicIds: basics.map(b => b.fullId),
    };
}

// ==================== 导出 ====================
export {
    CORE_BASE_TEMPLATES,
    T3_MINI_BOSS_POOL,
    T2_ELITE_CANDIDATES,
    FLOOR_BOSSES,
    FLOOR_THEMES,
    FLOOR_MONSTER_CONFIG,
    getFloorBasics,
    getFloorT2,
    getFloorT3,
    getFloorBoss,
    getFloorMonsterPool,
};
