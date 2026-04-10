(function attachHiddenRoomConfig(global) {
    'use strict';


    const HIDDEN_ROOM_PROFILES = {
        1: {
            id: 'candle_translate',
            title: '平移复刻房',
            subtitle: '',
            color: '#ffd08a',
            noteSpeaker: '妈妈',
            note: '快守不住这里了。\n我们得继续往下逃。\n可到底发生了什么……',
            type: 'candles'
        },
        2: {
            id: 'worm_hunt',
            title: '异色蠕虫房',
            subtitle: '',
            color: '#8fffaa',
            noteSpeaker: '妈妈',
            note: '希望牛牛不要回来。\n这里太危险了……',
            type: 'worms'
        },
        3: {
            id: 'mushroom_sequence',
            title: '蘑菇顺序房',
            subtitle: '',
            color: '#b893ff',
            noteSpeaker: '妈妈',
            note: '他为什么会知道那么多牛牛的事？\n他到底是谁……',
            type: 'mushrooms'
        },
        4: {
            id: 'memory_projection',
            title: '投影记忆房',
            subtitle: '',
            color: '#8ed8ff',
            noteSpeaker: '妈妈',
            note: '牛牛，如果你能来到这里，\n先照顾好自己。\n我们快要坚持不住了……',
            type: 'memory_projection'
        },
        5: {
            id: 'seal_block',
            title: '封口守门房',
            subtitle: '',
            color: '#9ff2cf',
            noteSpeaker: '妈妈',
            note: '我们还得继续往下逃。\n孩子他爸决定留在这一层。\n我支持他的决定……\n可是……我真的舍不得他。',
            type: 'seal_block'
        },
        6: {
            id: 'legacy_table',
            title: '遗产房',
            subtitle: '',
            color: '#ffb0f5',
            noteSpeaker: '妈妈',
            note: '如果你能看到这个，\n说明他没能拦住你。\n他是一名真正的战士……\n\n我看见了那张模糊的脸。\n是那个人。\n那个一直说会指引你回家，\n又一直指引你往这里走的人……',
            type: 'legacy_table'
        }
    };


    const SECRETROOM_ASSET_BASE = 'assets/runtime/sprites/secretroom/';

    const SECRETROOM_FILES = {
        dec_barrel: 'dec_barrel.png',
        dec_candle: 'dec_candle.png',
        dec_crate: 'dec_crate.png',
        dec_mushroom: 'dec_mushroom.png',
        dec_pillar: 'dec_pillar.png',
        dec_statue: 'dec_statue.png',
        item_book: 'item_book.png',
        item_bread: 'item_bread.png',
        item_coin_bag: 'item_coin_bag.png',
        item_crystal_ball: 'item_crystal_ball.png',
        item_lantern: 'item_lantern.png',
        item_mushroom: 'item_mushroom.png',
        item_skull: 'item_skull.png',
        item_torch: 'item_torch.png',
        desk: 'desk.png',
        set1_mush_01: 'set1_mush_01.png',
        set1_mush_02: 'mushroom/set1_mush_02.png',
        set1_mush_08: 'mushroom/set1_mush_08.png',
        set1_mush_11: 'mushroom/set1_mush_11.png',
        set1_mush_13: 'mushroom/set1_mush_13.png',
        set2_mush_01: 'mushroom/set2_mush_01.png',
        set2_mush_02: 'mushroom/set2_mush_02.png',
        set2_mush_05: 'mushroom/set2_mush_05.png',
        set2_mush_12: 'mushroom/set2_mush_12.png',
        set2_mush_15: 'mushroom/set2_mush_15.png',
        set2_mush_16: 'mushroom/set2_mush_16.png',
        set5_mush_01: 'mushroom/set5_mush_01.png',
        set5_mush_02: 'set5_mush_02.png',
        set5_mush_09: 'mushroom/set5_mush_09.png',
        set5_mush_10: 'mushroom/set5_mush_10.png',
        set5_mush_11: 'mushroom/set5_mush_11.png',
        set5_mush_16: 'set5_mush_16.png',
        cluster_mush_01: 'mushroom/cluster_mush_01.png',
        cluster_mush_02: 'mushroom/cluster_mush_02.png',
        cluster_mush_03: 'mushroom/cluster_mush_03.png',
        cluster_mush_04: 'mushroom/cluster_mush_04.png',
        cluster_mush_05: 'mushroom/cluster_mush_05.png',
        cluster_mush_06: 'mushroom/cluster_mush_06.png',
        rabbit_black_1: 'rabbit_black_walk_01.png',
        rabbit_black_2: 'rabbit_black_walk_02.png',
        rabbit_black_3: 'rabbit_black_walk_03.png',
        rabbit_black_4: 'rabbit_black_walk_04.png',
        layer1_set2_floor_crack: 'layer1_set2_floor_crack.png',
        layer1_set2_floor_detail: 'layer1_set2_floor_detail.png',
        layer1_set2_wall_bottom: 'layer1_set2_wall_bottom.png',
        layer1_set2_wall_glowing: 'layer1_set2_wall_glowing.png',
        layer1_set3_floor_crack: 'layer1_set3_floor_crack.png',
        layer1_set4_floor_crack: 'layer1_set4_floor_crack.png',
        layer1_set5_floor_crack: 'layer1_set5_floor_crack.png',
        layer1_set5_wall_glowing: 'layer1_set5_wall_glowing.png',
        layer1_wall_glowing: 'layer1_wall_glowing.png'
    };


    const FLOOR4_QUESTIONS = [
        { category: 'torch', answer: 2 },
        { category: 'pillar', answer: 3 },
        { category: 'mushroom', answer: 1 }
    ];

    const FLOOR4_ANSWER_VALUES = [1, 2, 3, 4, 5, 6];

    const OVR_FLOOR1_TEMPLATES = [
        [1,0,1,0, 0,1,1,0],
        [1,1,0,1, 0,0,1,1],
        [0,1,1,0, 1,0,0,1],
        [1,0,0,1, 1,1,0,0],
        [0,1,0,1, 1,0,1,0],
        [1,1,0,0, 0,1,1,0]
    ].map(row => row.map(Boolean));


    const OVR_FLOOR4_VARIANTS = [
        { key: 'set1_mush_01', w: 86, h: 86, offsetY: -8, glow: '#86ddff', style: 'single' },
        { key: 'set5_mush_02', w: 92, h: 92, offsetY: -6, glow: '#7fd7ff', style: 'single' },
        { key: 'set5_mush_16', w: 82, h: 82, offsetY: -4, glow: '#9be7ff', style: 'single' }
    ];


    const OVR_FLOOR6_DIARY_TEXT = `牛宝：

如果你看到这里，桌上的面包就拿去吃掉。
你小时候一饿就难受，偏偏又总忍着不说。
钱我也给你放在旁边了，路上总会用得上，别嫌沉，能拿多少就拿多少。

你父亲留在上一层了。
他说门后那些东西总得有人拦着，不然你就真的没有路走了。
我知道我劝不住他。
他这个人，一直都是这样。

我们一路往下逃，本来只是想让你活下去。
可是走到这里，我才明白，有些事情早就不是我们能躲开的了。
我看到了那张模糊的脸。
是那个人。
那个一直在指引你回家，指引你往这边来的人。

如果你已经走到这里，就别再为我们停下来了。
把东西带上，好好活着。
别饿着，别冻着，也别再怪自己。

爸爸妈妈永远爱你。`;

    const OVR_FLOOR6_BREAD_TEXT = '牛宝，记得先把面包吃了。路还长，别饿着往前走。';

    const OVR_FLOOR6_MONEY_TEXT = '钱我放在桌旁了。能拿多少就拿多少，路上总会用得上。';


const SHARED_HIDDEN_LAYOUT_IDS = new Set(['orb', 'orb_pedestal']);

const HIDDEN_TOTEM_ID_BY_FLOOR = Object.freeze({
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6
});


const BUILTIN_HIDDEN_LAYOUT_ASSET_SOURCES = [
        'assets/runtime/sprites/secretroom/dec_mushroom.png',
        'assets/runtime/sprites/secretroom/dec_candle.png',
        'assets/runtime/sprites/secretroom/dec_barrel.png',
        'assets/runtime/sprites/secretroom/dec_crate.png',
        'assets/runtime/sprites/secretroom/dec_pillar.png',
        'assets/runtime/sprites/secretroom/dec_statue.png',
        'assets/runtime/sprites/secretroom/desk.png',
        'assets/runtime/sprites/secretroom/item_book.png',
        'assets/runtime/sprites/secretroom/item_bread.png',
        'assets/runtime/sprites/secretroom/item_coin_bag.png',
        'assets/runtime/sprites/secretroom/item_crystal_ball.png',
        'assets/runtime/sprites/secretroom/item_lantern.png',
        'assets/runtime/sprites/secretroom/item_skull.png',
        'assets/runtime/sprites/secretroom/item_torch.png',
        'assets/runtime/sprites/secretroom/set1_mush_01.png',
        'assets/runtime/sprites/secretroom/set1_mush_02.png',
        'assets/runtime/sprites/secretroom/set1_mush_08.png',
        'assets/runtime/sprites/secretroom/set1_mush_11.png',
        'assets/runtime/sprites/secretroom/set1_mush_13.png',
        'assets/runtime/sprites/secretroom/set2_mush_01.png',
        'assets/runtime/sprites/secretroom/set2_mush_02.png',
        'assets/runtime/sprites/secretroom/set2_mush_05.png',
        'assets/runtime/sprites/secretroom/set2_mush_12.png',
        'assets/runtime/sprites/secretroom/set2_mush_15.png',
        'assets/runtime/sprites/secretroom/set2_mush_16.png',
        'assets/runtime/sprites/secretroom/set5_mush_01.png',
        'assets/runtime/sprites/secretroom/set5_mush_02.png',
        'assets/runtime/sprites/secretroom/set5_mush_09.png',
        'assets/runtime/sprites/secretroom/set5_mush_10.png',
        'assets/runtime/sprites/secretroom/set5_mush_11.png',
        'assets/runtime/sprites/secretroom/set5_mush_16.png',
        'assets/runtime/sprites/secretroom/mushroom/cluster_mush_01.png',
        'assets/runtime/sprites/secretroom/mushroom/cluster_mush_02.png',
        'assets/runtime/sprites/secretroom/mushroom/cluster_mush_03.png',
        'assets/runtime/sprites/secretroom/mushroom/cluster_mush_04.png',
        'assets/runtime/sprites/secretroom/mushroom/cluster_mush_05.png',
        'assets/runtime/sprites/secretroom/mushroom/cluster_mush_06.png',
        'assets/runtime/sprites/secretroom/layer1_set2_floor_crack.png',
        'assets/runtime/sprites/secretroom/layer1_set3_floor_crack.png',
        'assets/runtime/sprites/secretroom/layer1_set4_floor_crack.png',
        'assets/runtime/sprites/secretroom/layer1_set5_floor_crack.png'
    ];


    const HIDDEN_WALL_CLUSTER_DIMENSIONS = {
        cluster_mush_01: { w: 64, h: 34 },
        cluster_mush_02: { w: 64, h: 43 },
        cluster_mush_03: { w: 64, h: 33 },
        cluster_mush_04: { w: 64, h: 52 },
        cluster_mush_05: { w: 64, h: 28 },
        cluster_mush_06: { w: 64, h: 38 },
        set1_mush_02: { w: 44, h: 52 },
        set1_mush_08: { w: 42, h: 48 },
        set1_mush_11: { w: 44, h: 50 },
        set1_mush_13: { w: 42, h: 48 },
        set2_mush_01: { w: 40, h: 48 },
        set2_mush_02: { w: 42, h: 50 },
        set2_mush_05: { w: 40, h: 46 },
        set2_mush_12: { w: 42, h: 52 },
        set2_mush_15: { w: 44, h: 50 },
        set2_mush_16: { w: 42, h: 48 },
        set5_mush_01: { w: 44, h: 48 },
        set5_mush_09: { w: 40, h: 46 },
        set5_mush_10: { w: 42, h: 48 },
        set5_mush_11: { w: 42, h: 50 }
    };


    const HIDDEN_MUSHROOM_BAND_STYLES = [
        ['cluster_mush_01', 'set1_mush_08', 'cluster_mush_03', 'set2_mush_05', 'cluster_mush_05'],
        ['set5_mush_01', 'cluster_mush_02', 'set2_mush_12', 'cluster_mush_04', 'set1_mush_11'],
        ['cluster_mush_06', 'set5_mush_09', 'cluster_mush_03', 'set2_mush_16', 'set1_mush_13'],
        ['set2_mush_02', 'cluster_mush_01', 'set5_mush_10', 'cluster_mush_05', 'set1_mush_02'],
        ['cluster_mush_04', 'set2_mush_15', 'cluster_mush_02', 'set5_mush_11', 'cluster_mush_06'],
        ['set1_mush_11', 'cluster_mush_03', 'set5_mush_09', 'cluster_mush_01', 'set2_mush_12'],
        ['set2_mush_01', 'cluster_mush_05', 'set1_mush_13', 'cluster_mush_04', 'set5_mush_10'],
        ['cluster_mush_02', 'set5_mush_01', 'cluster_mush_06', 'set2_mush_05', 'set1_mush_08']
    ];

    global.HiddenRoomConfig = {
        HIDDEN_ROOM_PROFILES,
        SECRETROOM_ASSET_BASE,
        SECRETROOM_FILES,
        FLOOR4_QUESTIONS,
        FLOOR4_ANSWER_VALUES,
        OVR_FLOOR1_TEMPLATES,
        OVR_FLOOR4_VARIANTS,
        OVR_FLOOR6_DIARY_TEXT,
        OVR_FLOOR6_BREAD_TEXT,
        OVR_FLOOR6_MONEY_TEXT,
        SHARED_HIDDEN_LAYOUT_IDS,
        HIDDEN_TOTEM_ID_BY_FLOOR,
        BUILTIN_HIDDEN_LAYOUT_ASSET_SOURCES,
        HIDDEN_WALL_CLUSTER_DIMENSIONS,
        HIDDEN_MUSHROOM_BAND_STYLES
    };
})(window);
