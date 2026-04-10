(function attachStoryDialogueData(global) {
    'use strict';

    function splitIntoSentences(text) {
        const source = String(text || '').replace(/\r/g, '').trim();
        if (!source) return Object.freeze([]);

        const paragraphs = source
            .split(/\n+/)
            .map(part => part.trim())
            .filter(Boolean);

        const lines = [];
        paragraphs.forEach((paragraph) => {
            const parts = paragraph.match(/[^。！？!?；;……]+(?:……|[。！？!?；;])?|.+$/gu) || [paragraph];
            parts
                .map(part => part.trim())
                .filter(Boolean)
                .forEach(part => lines.push(part));
        });

        return Object.freeze(lines);
    }

    function splitIntoShortPhrases(text) {
        const sentenceParts = splitIntoSentences(text);
        const result = [];

        sentenceParts.forEach((sentence) => {
            const fragments = String(sentence)
                .split(/(?<=[，、：；])/u)
                .map(part => part.trim())
                .filter(Boolean);

            fragments.forEach((fragment) => {
                const normalized = fragment.replace(/[，、：；]\s*$/u, '').trim();
                if (!normalized) return;

                if (Array.from(normalized).length <= 12) {
                    result.push(normalized);
                    return;
                }

                const miniParts = normalized
                    .split(/(?<=\.\.\.|……)/u)
                    .map(part => part.trim())
                    .filter(Boolean);

                if (miniParts.length > 1) {
                    miniParts.forEach(part => result.push(part));
                } else {
                    result.push(normalized);
                }
            });
        });

        return Object.freeze(result);
    }

    function expandDialogue(rawLines) {
        const result = [];
        (rawLines || []).forEach((line) => {
            const sentences = splitIntoSentences(line?.text || '');
            sentences.forEach((sentence) => {
                result.push(Object.freeze({
                    speaker: line?.speaker || 'narration',
                    name: line?.name || '',
                    color: line?.color || '',
                    text: sentence
                }));
            });
        });
        return Object.freeze(result);
    }

    function cloneBubbles(bubbles) {
        return Object.freeze((bubbles || []).map(bubble => Object.freeze({ ...bubble })));
    }

    const prologueScenes = Object.freeze([
        Object.freeze({
            key: 'menu_hold',
            useMenuBackground: true,
            duration: 11400,
            transitionToBlack: 1600,
            bubbles: cloneBubbles([
                { delay: 1200, text: '终于到家了……', width: '420px' },
                { delay: 4300, text: '下次得跟师傅学一下御剑了', width: '560px' },
                { delay: 7800, text: '……这……发生了什么？', width: '560px' }
            ])
        }),
        Object.freeze({
            key: 'empty_home',
            image: 'assets/runtime/sprites/story/start2.png',
            duration: 11800,
            transitionToBlack: 1700,
            motionClass: 'scene-drift-in',
            bubbles: cloneBubbles([
                { delay: 1700, text: '爸！妈！', width: '300px' },
                { delay: 5200, text: '你们在哪？', width: '380px' },
                { delay: 8200, text: '其他人都去哪了？', width: '480px' }
            ])
        }),
        Object.freeze({
            key: 'note',
            image: 'assets/runtime/sprites/story/start3.png',
            duration: 12600,
            transitionToBlack: 1800,
            motionClass: 'scene-drift-soft',
            bubbles: cloneBubbles([
                { delay: 1800, text: '“别来找我们，活下去。”', width: '540px', soft: true },
                { delay: 6500, text: '我真服了，这是什么苦情台词。', width: '620px', soft: true },
                { delay: 9400, text: '听话是不可能听话的！', width: '520px', soft: true }
            ])
        }),
        Object.freeze({
            key: 'descent',
            image: 'assets/runtime/sprites/story/start4.png',
            duration: 13200,
            motionClass: 'scene-drift-up',
            bubbles: cloneBubbles([
                { delay: 2100, text: '师傅……我可以做到吗？', width: '500px' },
                { delay: 7600, text: '爸爸妈妈！', width: '420px' },
                { delay: 9400, text: '你们等着，我来了！', width: '540px' }
            ])
        })
    ]);

    const floorIntroRaw = Object.freeze({
        1: '小时候听爸妈说，百年前为了抵御大灾变，祖辈们在地下建了六道防线，就是为了挡住地底涌出来的凶物。现在看来，灾变已经彻底冲破了外围，连守在这里的村民都……',
        2: '这些东西……竟然在地下筑了巢。看来灾变不是简单的侵袭。刚刚的商人说地底的凶物最会模仿活物，越是看着眼熟的越危险，绝不能心软。',
        3: '它们竟然会模仿人的动作，甚至会学着守村人的招式挥刀。不过不管装得再像也都是灾变里的凶物，只要是拦路的，一个都不能留！',
        4: '好险，差点被迷惑心智。越是拼命拦着越说明我离灾变的源头越近！我是守村人的后代，祖辈们守了这防线百年，如今我就要亲手终结这场灾变！所有挡我路的，全该碎尸万段！',
        5: '好重的凶物气息……源头应该就在前面了……所有挡路的……全是大灾变的怪物……都该死……都该斩尽杀绝……全是假的……',
        6: '杀！全部杀光！灾变的源头！最终的母体！所有怪物！所有拦路的！我要终结这场灾变！给父亲报仇！全部驱逐出去！一个不留！',
        7: ''
    });

    const blindDialogueRaw = Object.freeze({
        1: Object.freeze([
            { speaker: 'blind', name: '盲眼', color: '#b8d8ff', text: '既到此处，先歇片刻吧。' },
            { speaker: 'blind', name: '盲眼', color: '#b8d8ff', text: '此地乃是百年前祖辈留下的第一道防线，灾变从地底裂隙来，越往下，凶险越甚。' },
            { speaker: 'player', name: '牛牛', color: '#9fe6b8', text: '这下面到底是什么情况？守在这里的人都去哪了？' },
            { speaker: 'blind', name: '盲眼', color: '#b8d8ff', text: '地底的凶物本就嗜杀，如今灾变再起，它们已经占了这地下防线，但凡被它们缠上的人，都没了活路。' },
            { speaker: 'player', name: '牛牛', color: '#9fe6b8', text: '你卖的这些东西，真能对付那些东西？' },
            { speaker: 'blind', name: '盲眼', color: '#b8d8ff', text: '这些都是祖辈传下来对付地底凶物的法器，带在身上，至少能让你看清虚实，不被它们骗了。' }
        ]),
        2: Object.freeze([
            { speaker: 'blind', name: '盲眼', color: '#b8d8ff', text: '再往下走，灾变的影响会愈发深重，切莫被眼前的表象骗了。' },
            { speaker: 'player', name: '牛牛', color: '#9fe6b8', text: '刚才那些东西，竟然能发出人的声音！' },
            { speaker: 'blind', name: '盲眼', color: '#b8d8ff', text: '这便是它们的狡诈之处，会学着活人的声音、活人的样子，勾你近身。' },
            { speaker: 'player', name: '牛牛', color: '#9fe6b8', text: '所以见到这种，必须立刻下手，不能迟疑？' },
            { speaker: 'blind', name: '盲眼', color: '#b8d8ff', text: '正是，你若心软一瞬，它们便会借你这一瞬近身。' },
            { speaker: 'blind', name: '盲眼', color: '#b8d8ff', text: '对它们手软，就是对还活着的人残忍，百年前的灾变里，太多人栽在了这一点上。' }
        ]),
        3: Object.freeze([
            { speaker: 'blind', name: '盲眼', color: '#b8d8ff', text: '你能行至此处，倒比我先前料想的更沉得住气。' },
            { speaker: 'player', name: '牛牛', color: '#9fe6b8', text: '越往下，它们越像活的，它们真的能学到这种地步？' },
            { speaker: 'blind', name: '盲眼', color: '#b8d8ff', text: '灾变越深的地方，它们便越会模仿。愈是如此，愈不可轻信。' },
            { speaker: 'player', name: '牛牛', color: '#9fe6b8', text: '不管它们学什么，只要是拦着我的，全是该杀的凶物，对不对？' },
            { speaker: 'blind', name: '盲眼', color: '#b8d8ff', text: '世间最难防的，从来不是面目狰狞的东西，而是披着你熟悉的旧影前来的凶物。' },
            { speaker: 'blind', name: '盲眼', color: '#b8d8ff', text: '你能认清这一点，便不会重蹈前人的覆辙。' }
        ]),
        4: Object.freeze([
            { speaker: 'blind', name: '盲眼', color: '#b8d8ff', text: '走到这里，最忌心神摇动。' },
            { speaker: 'player', name: '牛牛', color: '#9fe6b8', text: '我已经看透了这些怪物了。' },
            { speaker: 'blind', name: '盲眼', color: '#b8d8ff', text: '你走得愈深，便愈靠近灾变的核心，它们自然怕你断了它们的根，拼了命也要拦你，这再正常不过。' },
            { speaker: 'player', name: '牛牛', color: '#9fe6b8', text: '对，我不会再动摇了。' },
            { speaker: 'blind', name: '盲眼', color: '#b8d8ff', text: '你若在此止步，前面受的苦，祖辈们守了百年的防线，便都白废了。' }
        ]),
        5: Object.freeze([
            { speaker: 'blind', name: '盲眼', color: '#b8d8ff', text: '这一层不会轻松，先把该带的带上。' },
            { speaker: 'player', name: '牛牛', color: '#9fe6b8', text: '我……需要……变强……' },
            { speaker: 'blind', name: '盲眼', color: '#b8d8ff', text: '快来挑件法器吧，你快要到达那里了' },
            { speaker: 'player', name: '牛牛', color: '#9fe6b8', text: '全是怪物……全部杀死……' },
            { speaker: 'blind', name: '盲眼', color: '#b8d8ff', text: '你须记住，像人的东西，未必还是人。' },
            { speaker: 'blind', name: '盲眼', color: '#b8d8ff', text: '越是你亲近的模样，越要狠下心。' }
        ]),
        6: Object.freeze([
            { speaker: 'blind', name: '盲眼', color: '#b8d8ff', text: '终于走到这里了。' },
            { speaker: 'player', name: '牛牛', color: '#9fe6b8', text: '灾变的核心就在这！我要杀了它！全杀光！' },
            { speaker: 'blind', name: '盲眼', color: '#b8d8ff', text: '它会化作你这辈子最不忍下手的模样，用你最软的软肋，给你致命一击，这是它们最后的伎俩。' },
            { speaker: 'player', name: '牛牛', color: '#9fe6b8', text: '管它变什么！全是假的！全是怪物！' },
            { speaker: 'blind', name: '盲眼', color: '#b8d8ff', text: '守住你的本心，莫受半分蛊惑。' },
            { speaker: 'blind', name: '盲眼', color: '#b8d8ff', text: '你一路披荆斩棘到这里，不是为了在最后一步乱了分寸。' }
        ])
    });

    const hiddenRooms = Object.freeze({
        1: Object.freeze({ noteSpeaker: '妈妈', note: '快守不住这里了。\n我们得继续往下逃。\n可到底发生了什么……' }),
        2: Object.freeze({ noteSpeaker: '妈妈', note: '希望牛牛不要回来\n这里也已经不安全了……' }),
        3: Object.freeze({ noteSpeaker: '妈妈', note: '他为什么会知道那么多牛牛的事？\n他到底是谁……' }),
        4: Object.freeze({ noteSpeaker: '妈妈', note: '牛牛，如果你能来到这里，\n先照顾好自己。\n我们快要坚持不住了……' }),
        5: Object.freeze({ noteSpeaker: '妈妈', note: '我们还得继续往下逃。\n孩子他爸决定留在这一层。\n我支持他的决定……\n可是……\n我真的舍不得他……' }),
        6: Object.freeze({ noteSpeaker: '母亲的日记', note: '牛宝：\n\n如果你看到这里，桌上的面包就拿去吃掉。\n你小时候一饿就难受，偏偏又总忍着不说。\n钱我也给你放在旁边了，路上总会用得上，别嫌沉，能拿多少就拿多少。\n\n你父亲留在上一层了。\n他说门后那些东西总得有人拦着，不然你就真的没有路走了。\n我知道我劝不住他。\n他这个人，一直都是这样。\n\n我们一路往下逃，本来只是想让你活下去。\n可是走到这里，我才明白，有些事情早就不是我们能躲开的了。\n我看到了那张模糊的脸。\n是那个人。\n那个一直在指引你回家，指引你往这边来的人。\n\n如果你已经走到这里，就别再为我们停下来了。\n把东西带上，好好活着。\n别饿着，别冻着，也别再怪自己。\n\n爸爸妈妈永远爱你。' })
    });

    const bossAfterScripts = Object.freeze({
        1: Object.freeze([
            { speaker: 'boss', name: '熟悉的声音', color: '#b8d8ff', text: '牛……牛？' },
            { speaker: 'player', name: '牛牛', color: '#9fe6b8', text: '……' },
            { speaker: 'boss', name: '熟悉的声音', color: '#b8d8ff', text: '你为什么……' }
        ]),
        2: Object.freeze([
            { speaker: 'boss', name: '熟悉的声音', color: '#d4c2ff', text: '孩子……这不是你该来的地方' },
            { speaker: 'player', name: '牛牛', color: '#9fe6b8', text: '是盲眼指引我来的' },
            { speaker: 'boss', name: '熟悉的声音', color: '#d4c2ff', text: '盲眼……' }
        ]),
        3: Object.freeze([
            { speaker: 'boss', name: '熟悉的声音', color: '#ffd6cf', text: '孩子……你的眼神不像你了' },
            { speaker: 'player', name: '牛牛', color: '#9fe6b8', text: '我只是在做该做的事。' },
            { speaker: 'boss', name: '熟悉的声音', color: '#ffd6cf', text: '看来……我也……无能为力了……' }
        ]),
        4: Object.freeze([
            { speaker: 'boss', name: '熟悉的声音', color: '#ffe6b3', text: '我们不是……你以为的那样。' },
            { speaker: 'player', name: '牛牛', color: '#9fe6b8', text: '闭嘴，怪物是不应该说话的' },
            { speaker: 'boss', name: '熟悉的声音', color: '#ffe6b3', text: '你走到下面的时候，也许就会明白。' }
        ]),
        5: Object.freeze([
            { speaker: 'boss', name: '父亲', color: '#9fd0ff', text: '孩子……如果你能没事，那这一切都值得了……' },
            { speaker: 'player', name: '牛牛', color: '#9fe6b8', text: '你为什么能变成我爸爸的样子？' },
            { speaker: 'player', name: '牛牛', color: '#9fe6b8', text: '难道爸爸已经……' },
            { speaker: 'boss', name: '父亲', color: '#9fd0ff', text: '你母亲安全了吗……' }
        ]),
        6: Object.freeze([
            { speaker: 'boss', name: '熟悉的声音', color: '#b8d8ff', text: '牛宝……记得……把面包吃了……' },
            { speaker: 'player', name: '牛牛', color: '#9fe6b8', text: '……你说什么？' },
            { speaker: 'player', name: '牛牛', color: '#9fe6b8', text: '你是谁？' },
            { speaker: 'player', name: '牛牛', color: '#9fe6b8', text: '你怎么知道我的小名？' },
            { speaker: 'boss', name: '熟悉的声音', color: '#b8d8ff', text: '……' },
            { speaker: 'player', name: '牛牛', color: '#9fe6b8', text: '……妈妈？' },
            { speaker: 'boss', name: '熟悉的声音', color: '#b8d8ff', text: '……' }
        ])
    });

    const finalBossPreBattleRaw = Object.freeze([
        { speaker: 'player', name: '玩家', color: '#9fe6b8', text: '师傅……真的是你？' },
        { speaker: 'blind', name: '师傅', color: '#b8d8ff', text: '嗯？看来你已经从幻觉中挣脱出来了？不过不重要了。' },
        { speaker: 'player', name: '玩家', color: '#9fe6b8', text: '幻觉？所以他们真的不是怪物？可是师傅这到底是为什么？' },
        { speaker: 'blind', name: '师傅', color: '#b8d8ff', text: '孩子，你是我最得意的弟子，这一切都是为了这个世界。' },
        { speaker: 'player', name: '玩家', color: '#9fe6b8', text: '我不明白，师傅。' },
        { speaker: 'blind', name: '师傅', color: '#b8d8ff', text: '我太老了，可是镇压大灾变不能没有我。' },
        { speaker: 'blind', name: '师傅', color: '#b8d8ff', text: '我需要一具身体，一具年轻的融合了圣殿图腾的身体……' },
        { speaker: 'blind', name: '师傅', color: '#b8d8ff', text: '我的身体太老了，承受图腾的力量太勉强了。' },
        { speaker: 'player', name: '玩家', color: '#9fe6b8', text: '这就是你让我杀了我父母的理由？？？？' },
        { speaker: 'blind', name: '师傅', color: '#b8d8ff', text: '孩子，为了家园，这是不得不做出的牺牲，你准备好了吗？' },
        { speaker: 'player', name: '玩家', color: '#9fe6b8', text: '我准备你妈！' }
    ]);

    const StoryDialogueData = Object.freeze({
        splitIntoSentences,
        prologueScenes,
        floorIntroRaw,
        floorIntro: Object.freeze(Object.fromEntries(Object.entries(floorIntroRaw).map(([floor, text]) => [floor, splitIntoSentences(text)]))),
        floorIntroOverhead: Object.freeze(Object.fromEntries(Object.entries(floorIntroRaw).map(([floor, text]) => [floor, splitIntoShortPhrases(text)]))),
        blindDialoguesRaw: blindDialogueRaw,
        blindDialogues: Object.freeze(Object.fromEntries(Object.entries(blindDialogueRaw).map(([floor, lines]) => [floor, expandDialogue(lines)]))),
        hiddenRooms: Object.freeze(Object.fromEntries(Object.entries(hiddenRooms).map(([floor, data]) => [floor, Object.freeze({
            ...data,
            lines: splitIntoSentences(data.note)
        })]))),
        bossAfterScripts,
        floor7Truth: Object.freeze({
            text: floorIntroRaw[7],
            lines: splitIntoSentences(floorIntroRaw[7])
        }),
        finalBoss: Object.freeze({
            preBattleRaw: finalBossPreBattleRaw,
            preBattle: Object.freeze(finalBossPreBattleRaw.map(line => Object.freeze({ ...line })))
        }),
        getFloorIntroSequence(floor) {
            const lines = this.floorIntroOverhead?.[floor] || this.floorIntro?.[floor] || [];
            return lines.map(text => Object.freeze({
                speaker: 'player',
                name: floor === 7 ? '玩家' : '牛牛',
                color: '#9fe6b8',
                text
            }));
        }
    });

    global.StoryDialogueData = StoryDialogueData;
})(window);
