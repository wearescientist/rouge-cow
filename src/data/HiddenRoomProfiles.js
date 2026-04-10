(function attachHiddenRoomRuntimeData(global) {
    'use strict';

    if (global.HiddenRoomRuntimeData) return;

    global.HiddenRoomRuntimeData = Object.freeze({
        profiles: Object.freeze({
            1: Object.freeze({
                id: 'candle_translate',
                title: '平移复刻房',
                subtitle: '',
                color: '#ffd08a',
                noteSpeaker: '妈妈',
                note: `快守不住这里了。\n我们得继续往下逃。\n可到底发生了什么……`,
                type: 'candles'
            }),
            2: Object.freeze({
                id: 'worm_hunt',
                title: '异色蠕虫房',
                subtitle: '',
                color: '#8fffaa',
                noteSpeaker: '妈妈',
                note: `希望牛牛不要回来。\n这里太危险了……`,
                type: 'worms'
            }),
            3: Object.freeze({
                id: 'mushroom_sequence',
                title: '蘑菇顺序房',
                subtitle: '',
                color: '#b893ff',
                noteSpeaker: '妈妈',
                note: `他为什么会知道那么多牛牛的事？\n他到底是谁……`,
                type: 'mushrooms'
            }),
            4: Object.freeze({
                id: 'memory_projection',
                title: '投影记忆房',
                subtitle: '',
                color: '#8ed8ff',
                noteSpeaker: '妈妈',
                note: `牛牛，如果你能来到这里，\n先照顾好自己。\n我们快要坚持不住了……`,
                type: 'memory_projection'
            }),
            5: Object.freeze({
                id: 'seal_block',
                title: '封口守门房',
                subtitle: '',
                color: '#9ff2cf',
                noteSpeaker: '妈妈',
                note: `我们还得继续往下逃。\n孩子他爸决定留在这一层。\n我支持他的决定……\n可是……我真的舍不得他。`,
                type: 'seal_block'
            }),
            6: Object.freeze({
                id: 'legacy_table',
                title: '遗产房',
                subtitle: '',
                color: '#ffb0f5',
                noteSpeaker: '妈妈',
                note: `如果你能看到这个，\n说明他没能拦住你。\n他是一名真正的战士……\n\n我看见了那张模糊的脸。\n是那个人。\n那个一直说会指引你回家，\n又一直指引你往这里走的人……`,
                type: 'legacy_table'
            })
        }),
        floor4Questions: Object.freeze([
            Object.freeze({ category: 'torch', answer: 2 }),
            Object.freeze({ category: 'pillar', answer: 3 }),
            Object.freeze({ category: 'mushroom', answer: 1 })
        ]),
        floor4AnswerValues: Object.freeze([1, 2, 3, 4, 5, 6])
    });
})(window);
