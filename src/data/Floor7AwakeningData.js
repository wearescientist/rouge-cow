(function attachFloor7AwakeningData(global) {
    'use strict';

    const Floor7AwakeningData = Object.freeze({
        entryLines: Object.freeze([
            Object.freeze({ text: '不对' }),
            Object.freeze({ text: '一切都很不对劲' })
        ]),
        souls: Object.freeze([
            Object.freeze({
                id: 'tiaotiao',
                name: '跳跳',
                text: '……我们不是最好的朋友吗？',
                sprite: 'assets/runtime/sprites/enemies/boss/1/e4807444aa4248a4a957b3a8d1ed9afd.jpeg~tplv-a9rns2rl98-downsize_watermark_1_6_b.png'
            }),
            Object.freeze({
                id: 'tiezhua',
                name: '铁爪',
                text: '……这不是你该来的地方！',
                sprite: 'assets/runtime/sprites/enemies/boss/2/2bb3654221e04a5c854fcdacff704759.jpeg~tplv-a9rns2rl98-downsize_watermark_1_6_b.png'
            }),
            Object.freeze({
                id: 'nibei',
                name: '泥背',
                text: '……孩子，快回去！',
                sprite: 'assets/runtime/sprites/enemies/boss/3/92a63bb7885e4ad5b94adfa51dbe0552.jpeg~tplv-a9rns2rl98-downsize_watermark_1_5_b.png'
            }),
            Object.freeze({
                id: 'yinya',
                name: '银牙',
                text: '……这里禁止通行！',
                sprite: 'assets/runtime/sprites/enemies/boss/4/707218cd743c442db5ce49364478c1eb.jpeg~tplv-a9rns2rl98-downsize_watermark_1_5_b.png'
            }),
            Object.freeze({
                id: 'father',
                name: '爸爸',
                text: '……如果你能没事，那这一切都值得了……',
                sprite: 'assets/runtime/sprites/enemies/boss/5/5cd67498ea4948cd8324095792de0e10.jpeg~tplv-a9rns2rl98-downsize_watermark_1_5_b.png'
            }),
            Object.freeze({
                id: 'mother',
                name: '妈妈',
                text: '牛宝……我留给你的面包……',
                sprite: 'assets/runtime/sprites/enemies/boss/6/20cd706454284adaa9ba19d0cfcf7931.jpeg~tplv-a9rns2rl98-downsize_watermark_1_5_b.png'
            })
        ]),
        blindEchoSprite: 'assets/runtime/sprites/enemies/boss/7/canying.png',
        awakenLines: Object.freeze([
            Object.freeze({ text: '所以他们……不是敌人……' }),
            Object.freeze({ text: '妈妈说一直引导我的那个人……' })
        ]),
        blindEchoLines: Object.freeze([
            Object.freeze({ text: '往前走……' }),
            Object.freeze({ text: '不要停……' }),
            Object.freeze({ text: '前进……' })
        ]),
        bossPreBattle: Object.freeze([
            Object.freeze({ speaker: 'player', name: '玩家', text: '师傅……真的是你？' }),
            Object.freeze({ speaker: 'master', name: '师傅', text: '嗯？看来你已经从幻觉中挣脱出来了？不过不重要了。' }),
            Object.freeze({ speaker: 'player', name: '玩家', text: '幻觉？所以他们真的不是怪物？可是师傅这到底是为什么？' }),
            Object.freeze({ speaker: 'master', name: '师傅', text: '孩子，你是我最得意的弟子，这一切都是为了这个世界。' }),
            Object.freeze({ speaker: 'player', name: '玩家', text: '我不明白，师傅。' }),
            Object.freeze({ speaker: 'master', name: '师傅', text: '我太老了，可是镇压大灾变不能没有我。' }),
            Object.freeze({ speaker: 'master', name: '师傅', text: '我需要一具身体，一具年轻的融合了圣殿图腾的身体……' }),
            Object.freeze({ speaker: 'master', name: '师傅', text: '我的身体太老了，承受图腾的力量太勉强了。' }),
            Object.freeze({ speaker: 'player', name: '玩家', text: '这就是你让我杀了我父母的理由？？？？' }),
            Object.freeze({ speaker: 'master', name: '师傅', text: '孩子，为了家园，这是不得不做出的牺牲，你准备好了吗？' }),
            Object.freeze({ speaker: 'player', name: '玩家', text: '我准备你妈！' })
        ]),
        bossAfter: Object.freeze([
            Object.freeze({ speaker: 'master', name: '师傅', text: '孩子，你很棒……' }),
            Object.freeze({ speaker: 'master', name: '师傅', text: '也许……我是错的？对，一切都是我的错……' }),
            Object.freeze({ speaker: 'master', name: '师傅', text: '来……收好这个图腾……' }),
            Object.freeze({ speaker: 'master', name: '师傅', text: '这个世界……就交给你了……守护好……我们……的家园……' })
        ])
    });

    global.Floor7AwakeningData = Floor7AwakeningData;
})(window);
