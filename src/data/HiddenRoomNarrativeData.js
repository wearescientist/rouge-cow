(function attachHiddenRoomNarrativeData(global) {
    'use strict';

    const HiddenRoomNarrativeData = Object.freeze({
        blindDialogues: Object.freeze({
            floor1: Object.freeze([
                { speaker: 'blind', text: '别停，继续往下。' },
                { speaker: 'niuniu', text: '下面到底有什么？' },
                { speaker: 'blind', text: '现在不是问这个的时候。' },
                { speaker: 'blind', text: '先离开这里。' },
                { speaker: 'niuniu', text: '你知道怎么走？' },
                { speaker: 'blind', text: '我知道怎么让你活下去。' }
            ]),
            floor2: Object.freeze([
                { speaker: 'blind', text: '别回头。' },
                { speaker: 'blind', text: '继续往下。' },
                { speaker: 'niuniu', text: '他们刚才……像是认得我。' },
                { speaker: 'blind', text: '你不能停在这里分神。' },
                { speaker: 'niuniu', text: '他们在叫我的名字。' },
                { speaker: 'blind', text: '那不是你现在该听的声音。' }
            ]),
            floor3: Object.freeze([
                { speaker: 'blind', text: '你已经走到这里了。' },
                { speaker: 'blind', text: '别被他们拖住。' },
                { speaker: 'niuniu', text: '他们说的话……有点奇怪。' },
                { speaker: 'blind', text: '快死的人，总会抓住你最软的地方。' },
                { speaker: 'niuniu', text: '你怎么这么确定？' },
                { speaker: 'blind', text: '因为现在只有我在帮你继续走。' }
            ]),
            floor4: Object.freeze([
                { speaker: 'blind', text: '快到了。' },
                { speaker: 'niuniu', text: '你一直都这么说。' },
                { speaker: 'blind', text: '因为你已经离答案很近了。' },
                { speaker: 'niuniu', text: '他们说，下面不是我想的那样。' },
                { speaker: 'blind', text: '那你更该自己去看。' }
            ]),
            floor5: Object.freeze([
                { speaker: 'blind', text: '你已经到这里了，不能停。' },
                { speaker: 'niuniu', text: '前面的人……' },
                { speaker: 'blind', text: '无论前面是谁，都别忘了你为什么来到这里。' },
                { speaker: 'niuniu', text: '……' },
                { speaker: 'blind', text: '继续走。' }
            ]),
            floor6: Object.freeze([
                { speaker: 'blind', text: '再往下一步，就结束了。' },
                { speaker: 'niuniu', text: '你一直都在叫我继续。' },
                { speaker: 'blind', text: '因为你不能停在这里。' },
                { speaker: 'niuniu', text: '……' },
                { speaker: 'blind', text: '相信我。' }
            ]),
            random: Object.freeze([
                ['我会带你出去。'],
                ['别怕，继续走。'],
                ['不要停在这里怀疑自己。']
            ])
        }),
        bossAfterScripts: Object.freeze({
            1: Object.freeze([
                { speaker: 'boss', name: '熟悉的声音', text: '牛……牛？', color: '#b8d8ff' },
                { speaker: 'player', name: '牛牛', text: '……', color: '#9fe6b8' },
                { speaker: 'boss', name: '熟悉的声音', text: '你为什么……', color: '#b8d8ff' }
            ]),
            2: Object.freeze([
                { speaker: 'boss', name: '熟悉的声音', text: '你怎么会在这里？', color: '#d4c2ff' },
                { speaker: 'player', name: '牛牛', text: '是盲眼指引我来的。', color: '#9fe6b8' },
                { speaker: 'boss', name: '熟悉的声音', text: '盲眼……', color: '#d4c2ff' }
            ]),
            3: Object.freeze([
                { speaker: 'boss', name: '熟悉的声音', text: '这些话……不像是你会说的。', color: '#ffd6cf' },
                { speaker: 'player', name: '牛牛', text: '我只是在做该做的事。', color: '#9fe6b8' },
                { speaker: 'boss', name: '熟悉的声音', text: '原来你……真的走到这里了。', color: '#ffd6cf' }
            ]),
            4: Object.freeze([
                { speaker: 'boss', name: '熟悉的声音', text: '我们不是……你以为的那样。', color: '#ffe6b3' },
                { speaker: 'player', name: '牛牛', text: '那我到底该怎么看你们？', color: '#9fe6b8' },
                { speaker: 'boss', name: '熟悉的声音', text: '你走到下面的时候，也许就会明白。', color: '#ffe6b3' }
            ]),
            5: Object.freeze([
                { speaker: 'boss', name: '父亲', text: '孩子……如果你能没事，那这一切都值得了。', color: '#9fd0ff' },
                { speaker: 'player', name: '牛牛', text: '为什么你也要挡我？', color: '#9fe6b8' },
                { speaker: 'boss', name: '父亲', text: '你母亲安全了吗……', color: '#9fd0ff' }
            ]),
            6: Object.freeze([
                { speaker: 'boss', name: '熟悉的声音', text: '牛宝……记得……把面包吃了……', color: '#b8d8ff' },
                { speaker: 'player', name: '牛牛', text: '……你说什么？', color: '#9fe6b8' },
                { speaker: 'player', name: '牛牛', text: '你是谁？', color: '#9fe6b8' },
                { speaker: 'player', name: '牛牛', text: '你怎么知道我的小名？', color: '#9fe6b8' },
                { speaker: 'boss', name: '熟悉的声音', text: '……', color: '#b8d8ff' },
                { speaker: 'player', name: '牛牛', text: '……妈妈？', color: '#9fe6b8' },
                { speaker: 'boss', name: '熟悉的声音', text: '……', color: '#b8d8ff' }
            ])
        }),
        hiddenRooms: Object.freeze({
            1: Object.freeze({
                id: 'candle_symmetry',
                title: '熄烛对称房',
                subtitle: '点亮唯一一根熄灭的蜡烛',
                color: '#ffd18a',
                puzzleType: 'candles',
                note: '快守不住这里了。\n我们得继续往下逃。\n可到底发生了什么……'
            }),
            2: Object.freeze({
                id: 'worm_hunt',
                title: '异色蠕虫房',
                subtitle: '踩死全部 3 条异色蠕虫',
                color: '#ff8fb2',
                puzzleType: 'worms',
                note: '希望牛牛不要回来。\n这里太危险了……'
            }),
            3: Object.freeze({
                id: 'mushroom_sequence',
                title: '蘑菇顺序房',
                subtitle: '按演示顺序踩亮全部蘑菇',
                color: '#75f2ff',
                puzzleType: 'mushroom_sequence',
                note: '他为什么会知道那么多牛牛的事？\n他到底是谁……'
            }),
            4: Object.freeze({
                id: 'count_decode',
                title: '计数解码房',
                subtitle: '数清房间物件，点亮正确数量',
                color: '#8ed8ff',
                puzzleType: 'count_decode',
                note: '牛牛，如果你能来到这里，\n先照顾好自己。\n我们快要坚持不住了……'
            }),
            5: Object.freeze({
                id: 'seal_block',
                title: '封口守门房',
                subtitle: '把箱子和木桶推到裂口上',
                color: '#9ff2cf',
                puzzleType: 'seal_block',
                note: '我们还得继续往下逃。\n孩子他爸决定留在这一层。\n我支持他的决定……\n可是……我真的舍不得他。'
            }),
            6: Object.freeze({
                id: 'convergence',
                title: '汇流见证房',
                subtitle: '站在真正的汇流点并停留片刻',
                color: '#b9f4ff',
                puzzleType: 'convergence',
                note: '如果你能看到这个，\n说明他没能拦住你。\n他是一名真正的战士……\n\n我看见了那张模糊的脸。\n是那个人。\n那个一直说会指引你回家，\n又一直指引你往这里走的人……'
            })
        }),
        trueEndingPrompt: Object.freeze({
            title: '楼梯前的犹豫',
            lines: Object.freeze([
                '你站在楼梯前，忽然想起了那些被你忽略太久的话。',
                '有人一直在引你往下。',
                '也有人一直在叫你停下。'
            ]),
            choices: Object.freeze(['踏下去', '停下来', '回头看一眼', '呼唤盲眼'])
        })
    });

    global.HiddenRoomNarrativeData = HiddenRoomNarrativeData;
})(window);
