/**
 * 主菜单图鉴收藏系统 / 成就系统
 * v0.35 - 统一角色 / 敌人 / 道具 / 武器 / 被动 / 图腾 / 剧情 / 成就
 */

const COLLECTION_CHARACTER_DATA = {
    niuniu: {
        name: '牛牛',
        title: '归乡者 / 持角之子',
        icon: '🐮',
        unlockHint: '默认解锁',
        summary: [
            '修行归来时，故乡已经沦陷。他带着一套被校歪的判断，独自走入地底。',
            '他相信自己是在清剿感染，直到越来越多熟悉的声音，在临死前像是真话。'
        ],
        quote: '“等我，阿妈。”'
    },
    blind: {
        name: '盲眼',
        title: '墙中商人 / 地底引路者',
        icon: '🕳️',
        unlockHint: '首次与盲眼交谈',
        summary: [
            '他总在每层尽头出现，卖道具，也卖方向。',
            '他说得不多，却总能把你再往下推一步。'
        ],
        quote: '“守住本心，莫受其惑。”'
    },
    tiaotiao: {
        name: '跳跳',
        title: '第一层守门者',
        icon: '🐇',
        unlockHint: '击败第1层Boss',
        summary: [
            '小时候他总和牛牛比赛谁先冲上坡顶。地底再见时，最熟悉的动作成了第一道必须挥下去的刀。',
            '不管他究竟还是旧友，还是别的什么，这一战都把“归来”彻底改成了“清剿”。'
        ],
        quote: '“熟悉的动作，有时比利爪更伤人。”'
    },
    tiezhua: {
        name: '铁爪',
        title: '第二层巡守者',
        icon: '🦅',
        unlockHint: '击败第2层Boss',
        summary: [
            '他扑得又准又狠，像是比别人更早看见了某种危险。',
            '在牛牛的视角里，这只会证明一件事：越像旧日熟人，越该立刻斩掉。'
        ],
        quote: '“看得越清楚，越只能用最狠的方式逼停你。”'
    },
    niubei: {
        name: '泥背',
        title: '第三层负重者',
        icon: '🐢',
        unlockHint: '击败第3层Boss',
        summary: [
            '背得太多的人，看起来总像长得更庞大、更迟缓，也更像某种灾变本身。',
            '第三层之后，牛牛第一次开始疑惑：为什么越往下，敌人越像是在守着什么。'
        ],
        quote: '“最慢的人，也可能是在替所有人顶住路。”'
    },
    yinya: {
        name: '银牙',
        title: '第四层守门人',
        icon: '🐺',
        unlockHint: '击败第4层Boss',
        summary: [
            '他不像单纯挡路的怪物，更像是明确知道你是谁、也知道你不该再往下走的人。',
            '正因为太像“守门人”，这一层开始出现真正刺耳的不协调感。'
        ],
        quote: '“你不是普通的归来者，而是一把被人提着往下送的刀。”'
    },
    father: {
        name: '铁角',
        title: '父亲 / 第五层断后者',
        icon: '🦬',
        unlockHint: '击败第5层Boss',
        summary: [
            '他说话的停顿、称呼与口气，都太像父亲。也正因为太像，才逼得牛牛只能把它理解成更恶毒的拟态。',
            '无论真相是哪一个版本，第五层都会成为整段归乡路最难下刀的一战。'
        ],
        quote: '“孩子……如果你能没事，那这一切都值得了。”'
    },
    mother: {
        name: '绒花',
        title: '母亲 / 第六层守望者',
        icon: '🌾',
        unlockHint: '击败第6层Boss',
        summary: [
            '她会叫你小名，会提起最普通的生活细节。于是第六层不再像单纯的决战，更像一次无法承认的重逢。',
            '当这一刀真的落下时，真正先到来的并不是胜利感，而是彻底的空。'
        ],
        quote: '“牛宝……我留给你的面包……”'
    },
    shifu: {
        name: '师傅',
        title: '盲眼真身 / 第七层真相',
        icon: '🕯️',
        unlockHint: '完成真结局',
        summary: [
            '他并不把自己当成单纯的恶人，而是把“延续传承”扭成了“让弟子成为自己”。',
            '他一路帮助牛牛，是一场极冷静的养成。'
        ],
        quote: '“为了天下，还是为了自己继续活下去？”'
    }
};

const COLLECTION_STORY_DATA = {
    prologue_homecoming: {
        title: '序章 · 归乡',
        icon: '🌫️',
        unlockHint: '默认解锁',
        body: [
            '牛牛修行归来时，地表已沦为死地。',
            '部落空无一人，只剩一个通往地底的洞穴，和母亲熟悉的哼唱。'
        ]
    },
    blind_warning: {
        title: '层间碎页 · 盲眼的提醒',
        icon: '🗝️',
        unlockHint: '首次与盲眼交谈',
        body: [
            '地底之物本就凶顽，如今又沾了秽气。',
            '手中有备，心里便稳。心若稳了，路才能走远。'
        ]
    },
    infection_deepens: {
        title: '层间碎页 · 感染更深处',
        icon: '🦠',
        unlockHint: '触发第2层盲眼对话',
        body: [
            '越往下走，外相仍似旧日，内里却早已坏透。',
            '你若心软一瞬，它们便会借这一瞬近身。'
        ]
    },
    mimic_shadow: {
        title: '层间碎页 · 旧影来敲门',
        icon: '👁️',
        unlockHint: '触发第3层盲眼对话',
        body: [
            '感染深了，便会学。学人声，学人形，学你熟悉的一切。',
            '世间最难防的，从来不是可怖之物，而是披着旧影前来的东西。'
        ]
    },
    gatekeepers: {
        title: '层间碎页 · 守门者',
        icon: '🚪',
        unlockHint: '触发第4层盲眼对话',
        body: [
            '走到这里，最忌心神摇动。',
            '你越往下，它们便越像是在拦你；而你也越难分清，谁是在杀你，谁是在拦你。'
        ]
    },
    father_words: {
        title: '终末碎页 · 父亲',
        icon: '🩸',
        unlockHint: '击败第5层Boss',
        body: [
            '在假结局里，这像是最恶毒的拟态。',
            '在真相里，这却是父亲最后一次试图把儿子拦在更深处之外。'
        ]
    },
    mother_words: {
        title: '终末碎页 · 母亲',
        icon: '🍞',
        unlockHint: '击败第6层Boss',
        body: [
            '她会叫你小名，会说最熟悉的话，所以也最像“高级伪装”。',
            '可真正残忍的地方在于：她从头到尾都是真的。'
        ]
    },
    false_ending: {
        title: '假结局 · 深根之疫',
        icon: '🌑',
        unlockHint: '抵达假结局',
        body: [
            '牛牛以为自己终于抵达了灾厄的尽头。',
            '可胜利落下来时，没有释然，只有空虚与越来越强的不协调感。'
        ]
    },
    dream_gap: {
        title: '裂隙记录 · 梦境间隙',
        icon: '✨',
        unlockHint: '开启真结局路线',
        body: [
            '当六块图腾都归位，深层会出现一条不属于假结局的路。',
            '那不是更深，而是更近：更接近真相。'
        ]
    },
    truth_corridor: {
        title: '真结局 · 真相回廊',
        icon: '🕯️',
        unlockHint: '完成真结局',
        body: [
            '灾难是真的，地下是真的，人也是真的。',
            '错的不是世界，而是牛牛一路相信的那套解释。'
        ]
    }
};

const COLLECTION_ACHIEVEMENT_DATA = {
    blind_first_talk: {
        name: '墙中来客',
        icon: '🕳️',
        desc: '第一次与盲眼交谈。',
        hint: '首次与盲眼交谈'
    },
    first_item: {
        name: '初次收纳',
        icon: '🎒',
        desc: '第一次获得道具。',
        hint: '获得任意道具'
    },
    first_passive: {
        name: '体质改造',
        icon: '🧬',
        desc: '第一次获得被动。',
        hint: '获得任意被动'
    },
    first_weapon_expand: {
        name: '备战升级',
        icon: '⚔️',
        desc: '第一次获得第二把武器。',
        hint: '获得第二把武器'
    },
    floor1_boss: {
        name: '熟悉的脸',
        icon: '🩸',
        desc: '击败第一层Boss。',
        hint: '击败第1层Boss'
    },
    first_evolution: {
        name: '武装升华',
        icon: '💠',
        desc: '第一次合成超武。',
        hint: '首次让武器进化'
    },
    true_route_unlocked: {
        name: '梦境间隙',
        icon: '✨',
        desc: '满足条件，开启真结局路线。',
        hint: '集齐全部图腾'
    },
    ending_false: {
        name: '假结局 · 深根之疫',
        icon: '🌑',
        desc: '抵达假结局。你完成了清剿，也完成了误判。',
        hint: '抵达假结局'
    },
    ending_true: {
        name: '真结局 · 真相回廊',
        icon: '🕯️',
        desc: '抵达真结局，直面师傅与所有迟来的真相。',
        hint: '完成真结局'
    },
    all_totems: {
        name: '六相图腾',
        icon: '🦴',
        desc: '集齐全部祖先图腾。',
        hint: '收集所有图腾'
    },
    all_enemy_entries: {
        name: '旧日全影',
        icon: '📖',
        desc: '解锁全部敌人图鉴。',
        hint: '解锁全部敌人条目'
    },
    all_character_entries: {
        name: '众生相',
        icon: '🎭',
        desc: '解锁全部角色档案。',
        hint: '解锁全部角色档案'
    },
    all_story_entries: {
        name: '碎页重组',
        icon: '🧾',
        desc: '解锁全部剧情碎片。',
        hint: '解锁全部剧情条目'
    }
};

function collectionEscapeHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}


class CollectionCodexSystem {
    constructor() {
        this.storageKey = 'cowCollectionCodex_v1';
        this.state = this.load();
        this.activeTab = 'characters';
        this.arsenalMode = 'weapon';
        this.searchTerm = '';
        this.showUnlockedOnly = false;
        this.selectedEntryKey = null;
        this.overlay = null;
        this.root = null;
        this.sidebar = null;
        this.header = null;
        this.tools = null;
        this.content = null;
        this.searchInput = null;
        this._escHandler = (event) => {
            if (event.key === 'Escape' && this.isOpen()) this.close();
        };
        this.ensureStyles();
        this.ensureBaseUnlocks();
    }

    createDefaultState() {
        return {
            version: 1,
            unlocked: {
                characters: {},
                enemies: {},
                items: {},
                weapons: {},
                passives: {},
                totems: {},
                story: {}
            },
            achievements: {}
        };
    }

    load() {
        try {
            const raw = localStorage.getItem(this.storageKey);
            if (!raw) return this.createDefaultState();
            const parsed = JSON.parse(raw);
            const base = this.createDefaultState();
            return {
                version: 1,
                unlocked: {
                    ...base.unlocked,
                    ...(parsed.unlocked || {})
                },
                achievements: parsed.achievements || {}
            };
        } catch (e) {
            console.warn('[CollectionCodex] load failed:', e);
            return this.createDefaultState();
        }
    }

    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.state));
        } catch (e) {
            console.warn('[CollectionCodex] save failed:', e);
        }
    }

    ensureBaseUnlocks() {
        this.unlockCharacter('niuniu', { silent: true });
        this.unlockStory('prologue_homecoming', { silent: true });
    }

    ensureStyles() {
        if (document.getElementById('collectionCodexStyles')) return;
        const style = document.createElement('style');
        style.id = 'collectionCodexStyles';
        style.textContent = `
            .collection-overlay {
                position: fixed;
                inset: 0;
                z-index: 16000;
                display: none;
                align-items: center;
                justify-content: center;
                padding: 12px;
                background:
                    radial-gradient(circle at 50% 16%, rgba(213, 166, 92, 0.12), transparent 28%),
                    linear-gradient(180deg, rgba(4, 5, 8, 0.86), rgba(2, 2, 4, 0.94));
                backdrop-filter: blur(7px);
            }
            .collection-shell {
                width: min(1480px, calc(100vw - 20px));
                height: min(900px, calc(100vh - 20px));
                display: grid;
                grid-template-columns: 280px minmax(0, 1fr);
                color: #efe6d5;
                background:
                    linear-gradient(180deg, rgba(15, 12, 9, 0.98), rgba(9, 8, 6, 0.985)),
                    linear-gradient(90deg, rgba(255,255,255,0.04), rgba(255,255,255,0.01));
                border: 1px solid rgba(197, 155, 96, 0.22);
                border-radius: 28px;
                overflow: hidden;
                box-shadow: 0 34px 120px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.03);
            }
            .collection-sidebar {
                position: relative;
                display: flex;
                flex-direction: column;
                gap: 14px;
                padding: 22px 18px 18px;
                border-right: 1px solid rgba(197, 155, 96, 0.16);
                background:
                    linear-gradient(180deg, rgba(28, 22, 16, 0.985), rgba(15, 12, 10, 0.99)),
                    repeating-linear-gradient(0deg, rgba(255,255,255,0.018), rgba(255,255,255,0.018) 1px, transparent 1px, transparent 22px);
            }
            .collection-sidebar::after {
                content: '';
                position: absolute;
                inset: 12px;
                border: 1px solid rgba(233, 205, 151, 0.06);
                border-radius: 18px;
                pointer-events: none;
            }
            .collection-brand {
                position: relative;
                padding: 12px 12px 16px;
                border-radius: 20px;
                background: linear-gradient(180deg, rgba(55, 42, 27, 0.52), rgba(26, 20, 14, 0.18));
                border: 1px solid rgba(196, 155, 95, 0.14);
            }
            .collection-kicker {
                margin: 0 0 8px;
                font-size: 11px;
                letter-spacing: 0.2em;
                text-transform: uppercase;
                color: #c89a58;
            }
            .collection-brand h2 {
                margin: 0;
                font-size: 32px;
                letter-spacing: 0.05em;
            }
            .collection-brand p {
                margin: 10px 0 0;
                color: #b7ad9c;
                line-height: 1.65;
                font-size: 13px;
            }
            .collection-brand-progress {
                margin-top: 14px;
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 8px;
            }
            .collection-mini-stat {
                padding: 10px 12px;
                border-radius: 14px;
                background: rgba(255,255,255,0.03);
                border: 1px solid rgba(255,255,255,0.06);
            }
            .collection-mini-stat .label {
                font-size: 11px;
                color: #9f9382;
                text-transform: uppercase;
                letter-spacing: 0.08em;
            }
            .collection-mini-stat .value {
                margin-top: 6px;
                font-size: 20px;
                color: #f3e4c8;
                font-weight: 700;
            }
            .collection-nav {
                display: flex;
                flex-direction: column;
                gap: 8px;
                overflow: auto;
                padding-right: 4px;
            }
            .collection-nav-btn {
                display: grid;
                grid-template-columns: auto 1fr auto;
                align-items: center;
                gap: 12px;
                width: 100%;
                padding: 12px 14px;
                border-radius: 16px;
                border: 1px solid rgba(255,255,255,0.06);
                background: linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.01));
                color: #ede2cf;
                cursor: pointer;
                font: inherit;
                text-align: left;
                transition: transform 0.14s ease, border-color 0.14s ease, background 0.14s ease;
            }
            .collection-nav-btn:hover {
                transform: translateX(2px);
                border-color: rgba(214, 171, 109, 0.26);
            }
            .collection-nav-btn.active {
                background: linear-gradient(180deg, rgba(122, 87, 37, 0.34), rgba(58, 40, 20, 0.22));
                border-color: rgba(228, 189, 124, 0.34);
                box-shadow: inset 0 0 0 1px rgba(255, 230, 177, 0.06);
            }
            .collection-nav-icon {
                width: 34px;
                height: 34px;
                border-radius: 10px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                background: rgba(255,255,255,0.05);
                font-size: 17px;
            }
            .collection-nav-btn.active .collection-nav-icon {
                background: rgba(255, 228, 172, 0.1);
            }
            .collection-nav-title {
                font-size: 14px;
                color: #f0e5d4;
            }
            .collection-nav-hint,
            .collection-nav-meta {
                font-size: 11px;
                color: #998c7a;
                margin-top: 4px;
            }
            .collection-close {
                margin-top: auto;
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 16px;
                padding: 13px 16px;
                background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02));
                color: #f0e6d7;
                cursor: pointer;
                font: inherit;
            }
            .collection-main {
                min-width: 0;
                display: flex;
                flex-direction: column;
                background:
                    linear-gradient(180deg, rgba(14, 12, 10, 0.98), rgba(7, 6, 5, 0.985)),
                    repeating-linear-gradient(0deg, rgba(255,255,255,0.012), rgba(255,255,255,0.012) 1px, transparent 1px, transparent 24px);
            }
            .collection-header {
                padding: 20px 24px 16px;
                border-bottom: 1px solid rgba(204, 167, 110, 0.12);
                display: grid;
                grid-template-columns: minmax(0, 1fr) auto;
                gap: 14px;
                align-items: end;
            }
            .collection-header-main {
                display: flex;
                gap: 16px;
                align-items: flex-start;
            }
            .collection-header-icon {
                width: 62px;
                height: 62px;
                border-radius: 18px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 30px;
                background: linear-gradient(180deg, rgba(126, 88, 37, 0.4), rgba(45, 31, 16, 0.25));
                border: 1px solid rgba(226, 190, 128, 0.16);
                box-shadow: inset 0 0 0 1px rgba(255,255,255,0.03);
            }
            .collection-header-text h3 {
                margin: 2px 0 0;
                font-size: 34px;
                line-height: 1.06;
                letter-spacing: 0.02em;
            }
            .collection-header-text .collection-header-sub {
                margin-top: 6px;
                color: #b8ab97;
                font-size: 14px;
                line-height: 1.65;
                max-width: 680px;
            }
            .collection-header-text .collection-header-kicker {
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.18em;
                color: #c89a58;
            }
            .collection-progress {
                display: grid;
                grid-template-columns: repeat(2, minmax(150px, 1fr));
                gap: 10px;
            }
            .collection-pill {
                min-width: 0;
                padding: 12px 14px;
                border-radius: 16px;
                border: 1px solid rgba(255,255,255,0.08);
                background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02));
                font-size: 12px;
                color: #b8ac9a;
            }
            .collection-pill strong {
                display: block;
                margin-top: 5px;
                font-size: 20px;
                color: #f0e5d1;
            }
            .collection-tools {
                padding: 14px 24px;
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
                align-items: center;
                border-bottom: 1px solid rgba(204, 167, 110, 0.08);
            }
            .collection-search-wrap {
                position: relative;
                min-width: 260px;
                flex: 1 1 320px;
                max-width: 460px;
            }
            .collection-search {
                width: 100%;
                border: 1px solid rgba(255,255,255,0.08);
                border-radius: 16px;
                padding: 12px 42px 12px 14px;
                background: rgba(0,0,0,0.24);
                color: #fff5e6;
                font: inherit;
            }
            .collection-search-icon {
                position: absolute;
                right: 14px;
                top: 50%;
                transform: translateY(-50%);
                color: #a79070;
                pointer-events: none;
            }
            .collection-segment,
            .collection-filter-row {
                display: inline-flex;
                gap: 8px;
                padding: 4px;
                border-radius: 16px;
                border: 1px solid rgba(255,255,255,0.08);
                background: rgba(255,255,255,0.03);
            }
            .collection-segment button,
            .collection-filter-row button {
                border: none;
                border-radius: 12px;
                padding: 9px 13px;
                background: transparent;
                color: #c8baa6;
                cursor: pointer;
                font: inherit;
            }
            .collection-segment button.active,
            .collection-filter-row button.active {
                background: rgba(201, 154, 88, 0.18);
                color: #fff0d3;
            }
            .collection-content {
                flex: 1 1 auto;
                min-height: 0;
                padding: 18px 24px 24px;
                overflow: auto;
            }
            .collection-board {
                display: grid;
                grid-template-columns: minmax(0, 1.06fr) minmax(320px, 0.72fr);
                gap: 18px;
                min-height: 100%;
            }
            .collection-section {
                border: 1px solid rgba(204, 167, 110, 0.12);
                border-radius: 24px;
                background: linear-gradient(180deg, rgba(24, 20, 16, 0.9), rgba(13, 11, 9, 0.93));
                box-shadow: inset 0 1px 0 rgba(255,255,255,0.03);
            }
            .collection-list-wrap {
                display: flex;
                flex-direction: column;
                min-width: 0;
            }
            .collection-section-head {
                padding: 16px 18px 14px;
                border-bottom: 1px solid rgba(204, 167, 110, 0.08);
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                gap: 12px;
            }
            .collection-section-head h4 {
                margin: 0;
                font-size: 18px;
            }
            .collection-section-head p {
                margin: 6px 0 0;
                color: #a59580;
                font-size: 12px;
                line-height: 1.6;
            }
            .collection-stamp {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 6px 10px;
                border: 1px solid rgba(226, 190, 128, 0.18);
                border-radius: 999px;
                color: #d9b277;
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 0.12em;
            }
            .collection-records {
                padding: 14px;
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                gap: 12px;
            }
            .collection-record {
                position: relative;
                display: flex;
                flex-direction: column;
                gap: 12px;
                min-height: 182px;
                padding: 16px 16px 14px;
                border-radius: 18px;
                border: 1px solid rgba(255,255,255,0.06);
                background:
                    linear-gradient(180deg, rgba(69, 54, 35, 0.18), rgba(31, 24, 16, 0.28)),
                    linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015));
                cursor: pointer;
                transition: transform 0.14s ease, border-color 0.14s ease, background 0.14s ease;
            }
            .collection-record::before {
                content: '';
                position: absolute;
                inset: 9px 10px auto;
                height: 1px;
                background: rgba(242, 219, 181, 0.06);
            }
            .collection-record:hover { transform: translateY(-1px); border-color: rgba(214, 171, 109, 0.22); }
            .collection-record.active {
                border-color: rgba(227, 189, 123, 0.38);
                background:
                    linear-gradient(180deg, rgba(121, 86, 38, 0.24), rgba(33, 24, 15, 0.34)),
                    linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.018));
                box-shadow: inset 0 0 0 1px rgba(255, 233, 194, 0.05);
            }
            .collection-record.locked {
                background: linear-gradient(180deg, rgba(255,255,255,0.018), rgba(255,255,255,0.01));
                color: #837666;
            }
            .collection-record-top {
                display: grid;
                grid-template-columns: auto 1fr auto;
                gap: 12px;
                align-items: start;
            }
            .collection-record-index {
                min-width: 28px;
                color: #8c7d6a;
                font-size: 11px;
                letter-spacing: 0.16em;
                text-transform: uppercase;
            }
            .collection-record-icon {
                width: 48px;
                height: 48px;
                border-radius: 14px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                background: rgba(255,255,255,0.05);
                font-size: 26px;
            }
            .collection-record.locked .collection-record-icon {
                background: rgba(255,255,255,0.025);
            }
            .collection-record-title {
                margin: 0;
                font-size: 18px;
                line-height: 1.2;
                color: #f0e3d0;
            }
            .collection-record.locked .collection-record-title { color: #a49480; }
            .collection-record-subtitle {
                margin-top: 6px;
                color: #9f907c;
                font-size: 12px;
                line-height: 1.55;
            }
            .collection-record-preview {
                margin: 0;
                color: #cfc2ad;
                font-size: 13px;
                line-height: 1.7;
                display: -webkit-box;
                -webkit-line-clamp: 4;
                -webkit-box-orient: vertical;
                overflow: hidden;
                white-space: pre-line;
            }
            .collection-record.locked .collection-record-preview { color: #897b69; }
            .collection-record-footer {
                margin-top: auto;
                display: flex;
                flex-wrap: wrap;
                justify-content: space-between;
                gap: 8px;
                font-size: 11px;
                color: #9f907c;
            }
            .collection-record-note {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                padding: 5px 10px;
                border-radius: 999px;
                background: rgba(255,255,255,0.05);
            }
            .collection-detail {
                display: flex;
                flex-direction: column;
                min-width: 0;
                overflow: hidden;
            }
            .collection-detail-body {
                flex: 1 1 auto;
                overflow: auto;
                padding: 18px;
                display: flex;
                flex-direction: column;
                gap: 14px;
            }
            .collection-detail-hero {
                padding: 18px;
                border-radius: 22px;
                background:
                    linear-gradient(180deg, rgba(79, 56, 28, 0.26), rgba(31, 23, 14, 0.24)),
                    linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.015));
                border: 1px solid rgba(226, 190, 128, 0.14);
            }
            .collection-detail-top {
                display: grid;
                grid-template-columns: auto 1fr;
                gap: 14px;
                align-items: center;
            }
            .collection-detail-icon {
                width: 72px;
                height: 72px;
                border-radius: 20px;
                display: inline-flex;
                align-items: center;
                justify-content: center;
                font-size: 36px;
                background: rgba(255,255,255,0.06);
            }
            .collection-detail-title {
                margin: 0;
                font-size: 30px;
                line-height: 1.08;
            }
            .collection-detail-subtitle {
                margin-top: 8px;
                color: #bba992;
                font-size: 14px;
                line-height: 1.65;
            }
            .collection-detail-meta {
                margin-top: 14px;
                display: flex;
                flex-wrap: wrap;
                gap: 8px;
            }
            .collection-detail-chip {
                padding: 6px 10px;
                border-radius: 999px;
                border: 1px solid rgba(255,255,255,0.08);
                background: rgba(255,255,255,0.04);
                font-size: 11px;
                color: #d3c4b2;
            }
            .collection-detail-section {
                padding: 14px 16px;
                border-radius: 18px;
                border: 1px solid rgba(255,255,255,0.06);
                background: rgba(255,255,255,0.025);
            }
            .collection-detail-section h5 {
                margin: 0 0 10px;
                font-size: 12px;
                text-transform: uppercase;
                letter-spacing: 0.14em;
                color: #c89a58;
            }
            .collection-detail-text {
                margin: 0;
                color: #e0d4c3;
                font-size: 14px;
                line-height: 1.78;
                white-space: pre-line;
            }
            .collection-detail-list {
                display: grid;
                gap: 10px;
                margin: 0;
                padding: 0;
                list-style: none;
            }
            .collection-detail-list li {
                padding: 11px 12px;
                border-radius: 14px;
                background: rgba(255,255,255,0.04);
                border: 1px solid rgba(255,255,255,0.05);
                color: #ddd0bf;
                line-height: 1.65;
            }
            .collection-rarity-common { color: #d8dedf; }
            .collection-rarity-rare { color: #84bdff; }
            .collection-rarity-epic { color: #dda9ff; }
            .collection-rarity-legendary { color: #ffcb7a; }
            .collection-empty {
                padding: 64px 22px;
                text-align: center;
                color: #9f907c;
                line-height: 1.8;
            }
            .collection-achievement-toast {
                position: fixed;
                right: 24px;
                bottom: 24px;
                width: min(360px, calc(100vw - 32px));
                z-index: 18000;
                border-radius: 18px;
                padding: 16px 18px;
                border: 1px solid rgba(255, 223, 145, 0.28);
                background: linear-gradient(180deg, rgba(42, 25, 8, 0.96), rgba(20, 12, 5, 0.96));
                box-shadow: 0 16px 40px rgba(0,0,0,0.35);
                color: #fff4d6;
                opacity: 0;
                transform: translateY(18px);
                transition: opacity 0.22s ease, transform 0.22s ease;
                pointer-events: none;
            }
            .collection-achievement-toast.show { opacity: 1; transform: translateY(0); }
            .collection-achievement-toast .eyebrow { font-size: 12px; letter-spacing: 0.08em; color: #f2c66d; margin-bottom: 8px; }
            .collection-achievement-toast .title { font-size: 22px; font-weight: 700; line-height: 1.25; }
            .collection-achievement-toast .desc { margin-top: 8px; color: #ebdcc1; font-size: 13px; line-height: 1.6; }
            @media (max-width: 1180px) {
                .collection-shell { grid-template-columns: 1fr; height: min(94vh, 980px); }
                .collection-sidebar { border-right: none; border-bottom: 1px solid rgba(197, 155, 96, 0.16); max-height: 310px; }
                .collection-board { grid-template-columns: 1fr; }
            }
            @media (max-width: 760px) {
                .collection-header { grid-template-columns: 1fr; }
                .collection-header-main { flex-direction: column; }
                .collection-progress { grid-template-columns: 1fr; }
                .collection-records { grid-template-columns: 1fr; }
            }
        `;
        document.head.appendChild(style);
    }

    isOpen() {
        return !!this.overlay && this.overlay.style.display !== 'none';
    }

    ensureOverlay() {
        if (this.overlay) return;
        this.overlay = document.createElement('div');
        this.overlay.className = 'collection-overlay';
        this.overlay.innerHTML = `
            <div class="collection-shell">
                <aside class="collection-sidebar"></aside>
                <section class="collection-main">
                    <div class="collection-header"></div>
                    <div class="collection-tools"></div>
                    <div class="collection-content"></div>
                </section>
            </div>
        `;
        this.sidebar = this.overlay.querySelector('.collection-sidebar');
        this.header = this.overlay.querySelector('.collection-header');
        this.tools = this.overlay.querySelector('.collection-tools');
        this.content = this.overlay.querySelector('.collection-content');
        this.overlay.addEventListener('click', (event) => {
            if (event.target === this.overlay) this.close();
        });
        document.body.appendChild(this.overlay);
    }

    getCategories() {
        return [
            { key: 'characters', label: '角色档案', hint: '角色', icon: '🎭', kicker: '角色' },
            { key: 'enemies', label: '敌人图鉴', hint: '敌人', icon: '👁️', kicker: '敌人' },
            { key: 'items', label: '道具图鉴', hint: '道具', icon: '🎒', kicker: '道具' },
            { key: 'arsenal', label: '武器 + 被动', hint: '武器 / 被动', icon: '⚔️', kicker: '武器' },
            { key: 'totems', label: '图腾遗物', hint: '图腾', icon: '🦴', kicker: '图腾' },
            { key: 'story', label: '剧情碎片', hint: '碎片', icon: '🧾', kicker: '碎片' },
            { key: 'achievements', label: '成就', hint: '成就', icon: '🏆', kicker: '成就' }
        ];
    }

    getCharacterEntries() {
        return Object.entries(COLLECTION_CHARACTER_DATA).map(([key, data]) => ({ key, ...data }));
    }

    getEnemyEntries() {
        const source = (typeof ENEMY_CODEX_DATA !== 'undefined' && ENEMY_CODEX_DATA) || window.ENEMY_CODEX_DATA || {};
        return Object.entries(source).map(([key, data]) => ({ key, ...data }));
    }

    getItemEntries() {
        if (typeof ITEMS === 'undefined' || !ITEMS) return [];
        return Object.values(ITEMS).sort((a, b) => Number(a.id) - Number(b.id)).map(item => ({ ...item, key: String(item.id) }));
    }

    getWeaponEntries() {
        const base = typeof WEAPONS !== 'undefined' && WEAPONS ? Object.entries(WEAPONS).map(([key, data]) => ({ key, ...data, tier: '基础武器' })) : [];
        const supers = typeof SUPER_WEAPONS !== 'undefined' && SUPER_WEAPONS ? Object.entries(SUPER_WEAPONS).map(([key, data]) => {
            const evoEntry = (typeof WEAPON_EVOLUTIONS !== 'undefined' && WEAPON_EVOLUTIONS)
                ? Object.entries(WEAPON_EVOLUTIONS).find(([, evo]) => evo.result === key)
                : null;
            return {
                key,
                ...data,
                tier: '超武',
                origin: evoEntry ? evoEntry[0] : '',
                requires: evoEntry ? evoEntry[1]?.requires : ''
            };
        }) : [];
        return [...base, ...supers];
    }

    getPassiveEntries() {
        if (typeof PASSIVES === 'undefined' || !PASSIVES) return [];
        return Object.entries(PASSIVES).map(([key, data]) => ({ key, ...data }));
    }

    getTotemEntries() {
        const source = (typeof TOTEM_DATA !== 'undefined' && TOTEM_DATA) || window.TOTEM_DATA || {};
        return Object.entries(source).map(([key, data]) => ({ key, ...data }));
    }

    getStoryEntries() {
        return Object.entries(COLLECTION_STORY_DATA).map(([key, data]) => ({ key, ...data }));
    }

    getAchievementEntries() {
        return Object.entries(COLLECTION_ACHIEVEMENT_DATA).map(([key, data]) => ({ key, ...data }));
    }

    getScopeMap(scope) {
        if (scope === 'achievements') return this.state.achievements;
        this.state.unlocked[scope] = this.state.unlocked[scope] || {};
        return this.state.unlocked[scope];
    }

    hasUnlocked(scope, key) {
        const map = this.getScopeMap(scope);
        return !!map[String(key)];
    }

    markUnlocked(scope, key, options = {}) {
        const normalizedKey = String(key);
        const map = this.getScopeMap(scope);
        if (map[normalizedKey]) return false;
        map[normalizedKey] = Date.now();
        this.save();
        if (!options.silent && scope === 'achievements') {
            this.showAchievementToast(normalizedKey);
        }
        this.checkMetaAchievements(!!options.silent);
        if (this.isOpen()) this.render();
        return true;
    }

    unlockCharacter(key, options = {}) { return this.markUnlocked('characters', key, options); }
    unlockEnemy(key, options = {}) { return this.markUnlocked('enemies', key, options); }
    unlockItem(key, options = {}) {
        const changed = this.markUnlocked('items', key, options);
        if (changed) this.unlockAchievement('first_item', { silent: !!options.silent });
        return changed;
    }
    unlockWeapon(key, options = {}) { return this.markUnlocked('weapons', key, options); }
    unlockPassive(key, options = {}) {
        const changed = this.markUnlocked('passives', key, options);
        if (changed) this.unlockAchievement('first_passive', { silent: !!options.silent });
        return changed;
    }
    unlockTotem(key, options = {}) { return this.markUnlocked('totems', key, options); }
    unlockStory(key, options = {}) { return this.markUnlocked('story', key, options); }
    unlockAchievement(key, options = {}) {
        if (!COLLECTION_ACHIEVEMENT_DATA[key]) return false;
        return this.markUnlocked('achievements', key, options);
    }

    onBlindDialogueStart(floor = 1) {
        this.unlockCharacter('blind');
        const storyMap = {
            1: 'blind_warning',
            2: 'infection_deepens',
            3: 'mimic_shadow',
            4: 'gatekeepers'
        };
        if (storyMap[floor]) this.unlockStory(storyMap[floor]);
        this.unlockAchievement('blind_first_talk');
    }

    onBossDefeated(payload = {}) {
        const floor = Number(payload.floor || 0);
        const enemyMap = { 1: 'rabbit', 2: 'bird', 3: 'mouse', 4: 'cat', 5: 'turtle', 6: 'mother' };
        const characterMap = { 1: 'tiaotiao', 2: 'tiezhua', 3: 'niubei', 4: 'yinya', 5: 'father', 6: 'mother', 7: 'shifu' };
        const storyMap = { 5: 'father_words', 6: 'mother_words' };
        if (enemyMap[floor]) this.unlockEnemy(enemyMap[floor]);
        if (characterMap[floor]) this.unlockCharacter(characterMap[floor]);
        if (storyMap[floor]) this.unlockStory(storyMap[floor]);
        if (floor === 1) this.unlockAchievement('floor1_boss');
    }

    onTrueRouteUnlocked() {
        this.unlockStory('dream_gap');
        this.unlockAchievement('true_route_unlocked');
    }

    onFalseEnding() {
        this.unlockStory('false_ending');
        this.unlockAchievement('ending_false');
    }

    onTrueEnding() {
        this.unlockCharacter('shifu');
        this.unlockStory('truth_corridor');
        this.unlockAchievement('ending_true');
    }

    onWeaponExpanded() {
        this.unlockAchievement('first_weapon_expand');
    }

    onFirstEvolution() {
        this.unlockAchievement('first_evolution');
    }

    syncFromGame(game) {
        const g = game || window.game;

        this.ensureBaseUnlocks();
        this.unlockCharacter('niuniu', { silent: true });

        if (g) {
            const ownedItems = g.items?.owned || {};
            Object.keys(ownedItems).forEach(id => this.unlockItem(String(id), { silent: true }));

            const passives = g.passives?.passives || {};
            Object.keys(passives).forEach(key => {
                if ((passives[key] || 0) > 0) this.unlockPassive(key, { silent: true });
            });

            const weapons = Array.isArray(g.weapons) ? g.weapons : [];
            weapons.forEach(weapon => {
                if (!weapon) return;
                const weaponKey = weapon.baseKey || weapon.key;
                if (weaponKey) this.unlockWeapon(weaponKey, { silent: true });
                if (weapon.isSuper && weapon.key) this.unlockWeapon(weapon.key, { silent: true });
            });
            if (weapons.length >= 2) {
                this.unlockAchievement('first_weapon_expand', { silent: true });
            }
            if (weapons.some(weapon => weapon?.isSuper || weapon?.evolution)) {
                this.unlockAchievement('first_evolution', { silent: true });
            }
        }

        const totemSource = window.totemSystem?.collected;
        if (totemSource && typeof totemSource.forEach === 'function') {
            totemSource.forEach(key => this.unlockTotem(key, { silent: true }));
        }

        const enemySource = window.enemyCodex?.unlocked;
        const unlockedEnemies = [];
        if (enemySource && typeof enemySource.forEach === 'function') {
            enemySource.forEach(key => {
                unlockedEnemies.push(key);
                this.unlockEnemy(key, { silent: true });
            });
        }

        const enemyCharacterMap = {
            rabbit: 'tiaotiao',
            bird: 'tiezhua',
            mouse: 'niubei',
            cat: 'yinya',
            turtle: 'father',
            mother: 'mother'
        };
        const enemyStoryMap = {
            turtle: 'father_words',
            mother: 'mother_words'
        };
        unlockedEnemies.forEach(key => {
            if (enemyCharacterMap[key]) this.unlockCharacter(enemyCharacterMap[key], { silent: true });
            if (enemyStoryMap[key]) this.unlockStory(enemyStoryMap[key], { silent: true });
        });
        if (unlockedEnemies.includes('rabbit')) {
            this.unlockAchievement('floor1_boss', { silent: true });
        }

        const blindTalks = Number(localStorage.getItem('cowBlindTalks') || 0);
        if (blindTalks > 0) {
            this.unlockCharacter('blind', { silent: true });
            this.unlockAchievement('blind_first_talk', { silent: true });
        }
        if (blindTalks >= 1) this.unlockStory('blind_warning', { silent: true });
        if (blindTalks >= 2) this.unlockStory('infection_deepens', { silent: true });
        if (blindTalks >= 3) this.unlockStory('mimic_shadow', { silent: true });
        if (blindTalks >= 4) this.unlockStory('gatekeepers', { silent: true });

        if (window.trueEndingSystem?.unlocked || window.game?.hiddenRooms?.trueEndingUnlocked) {
            this.unlockStory('dream_gap', { silent: true });
            this.unlockAchievement('true_route_unlocked', { silent: true });
        }

        if (window.trueEndingSystem?.played) {
            this.unlockCharacter('shifu', { silent: true });
            this.unlockStory('truth_corridor', { silent: true });
            this.unlockAchievement('ending_true', { silent: true });
        }
    }

    getCategoryProgress(tab) {
        if (tab === 'arsenal') {
            const weapons = this.getWeaponEntries();
            const passives = this.getPassiveEntries();
            const unlocked = weapons.filter(entry => this.hasUnlocked('weapons', entry.key)).length + passives.filter(entry => this.hasUnlocked('passives', entry.key)).length;
            return { unlocked, total: weapons.length + passives.length };
        }
        const map = {
            characters: ['characters', this.getCharacterEntries()],
            enemies: ['enemies', this.getEnemyEntries()],
            items: ['items', this.getItemEntries()],
            totems: ['totems', this.getTotemEntries()],
            story: ['story', this.getStoryEntries()],
            achievements: ['achievements', this.getAchievementEntries()]
        };
        const row = map[tab];
        if (!row) return { unlocked: 0, total: 0 };
        const [scope, entries] = row;
        return {
            unlocked: entries.filter(entry => this.hasUnlocked(scope, entry.key)).length,
            total: entries.length
        };
    }

    checkMetaAchievements(silent = false) {
        const totals = {
            totems: this.getTotemEntries(),
            enemies: this.getEnemyEntries(),
            characters: this.getCharacterEntries(),
            story: this.getStoryEntries()
        };
        if (totals.totems.length > 0 && totals.totems.every(entry => this.hasUnlocked('totems', entry.key))) {
            this.unlockAchievement('all_totems', { silent });
        }
        if (totals.enemies.length > 0 && totals.enemies.every(entry => this.hasUnlocked('enemies', entry.key))) {
            this.unlockAchievement('all_enemy_entries', { silent });
        }
        if (totals.characters.length > 0 && totals.characters.every(entry => this.hasUnlocked('characters', entry.key))) {
            this.unlockAchievement('all_character_entries', { silent });
        }
        if (totals.story.length > 0 && totals.story.every(entry => this.hasUnlocked('story', entry.key))) {
            this.unlockAchievement('all_story_entries', { silent });
        }
    }

    open(tab = 'characters') {
        this.syncFromGame(window.game);
        this.activeTab = tab || this.activeTab || 'characters';
        this.selectedEntryKey = null;
        this.ensureOverlay();
        this.render();
        this.overlay.style.display = 'flex';
        document.addEventListener('keydown', this._escHandler);
        window.game?.refreshPauseState?.();
    }

    close() {
        if (!this.overlay) return;
        this.overlay.style.display = 'none';
        document.removeEventListener('keydown', this._escHandler);
        window.game?.refreshPauseState?.();
    }

    getCurrentTabMeta() {
        const map = {
            characters: { icon: '🎭', kicker: '角色', title: '角色档案', desc: '已记录条目' },
            enemies: { icon: '👁️', kicker: '敌人', title: '敌人图鉴', desc: '已记录条目' },
            items: { icon: '🎒', kicker: '道具', title: '道具图鉴', desc: '已记录条目' },
            arsenal: { icon: '⚔️', kicker: '武器', title: '武器与被动', desc: '已记录条目' },
            totems: { icon: '🦴', kicker: '图腾', title: '图腾遗物', desc: '已记录条目' },
            story: { icon: '🧾', kicker: '碎片', title: '剧情碎片', desc: '已记录条目' },
            achievements: { icon: '🏆', kicker: '成就', title: '成就', desc: '已记录条目' }
        };
        return map[this.activeTab] || map.characters;
    }

    getActiveDataset() {
        if (this.activeTab === 'characters') {
            return {
                scope: 'characters',
                entries: this.getCharacterEntries(),
                searchFields: ['name', 'title', 'summary', 'quote'],
                emptyText: '没有符合条件的角色档案。',
                sectionTitle: '档案列表',
                sectionDesc: '选择一个条目查看详情。'
            };
        }
        if (this.activeTab === 'enemies') {
            return {
                scope: 'enemies',
                entries: this.getEnemyEntries(),
                searchFields: ['name', 'title', 'story', 'quote'],
                emptyText: '没有符合条件的敌人记录。',
                sectionTitle: '遭遇清单',
                sectionDesc: '选择一个条目查看详情。'
            };
        }
        if (this.activeTab === 'items') {
            return {
                scope: 'items',
                entries: this.getItemEntries(),
                searchFields: ['name', 'desc', 'rarity', 'effect'],
                emptyText: '没有符合条件的道具条目。',
                sectionTitle: '条目列表',
                sectionDesc: '选择一个条目查看详情。'
            };
        }
        if (this.activeTab === 'arsenal' && this.arsenalMode === 'weapon') {
            return {
                scope: 'weapons',
                entries: this.getWeaponEntries(),
                searchFields: ['name', 'special', 'tier', 'requires', 'origin'],
                emptyText: '没有符合条件的武器条目。',
                sectionTitle: '条目列表',
                sectionDesc: '选择一个条目查看详情。'
            };
        }
        if (this.activeTab === 'arsenal' && this.arsenalMode === 'passive') {
            return {
                scope: 'passives',
                entries: this.getPassiveEntries(),
                searchFields: ['name', 'desc', 'effect'],
                emptyText: '没有符合条件的被动条目。',
                sectionTitle: '条目列表',
                sectionDesc: '选择一个条目查看详情。'
            };
        }
        if (this.activeTab === 'totems') {
            return {
                scope: 'totems',
                entries: this.getTotemEntries(),
                searchFields: ['name', 'blessing', 'stories'],
                emptyText: '没有符合条件的图腾条目。',
                sectionTitle: '遗物架',
                sectionDesc: '选择一个条目查看详情。'
            };
        }
        if (this.activeTab === 'story') {
            return {
                scope: 'story',
                entries: this.getStoryEntries(),
                searchFields: ['title', 'body'],
                emptyText: '没有符合条件的碎页条目。',
                sectionTitle: '碎页柜',
                sectionDesc: '选择一个条目查看详情。'
            };
        }
        return {
            scope: 'achievements',
            entries: this.getAchievementEntries(),
            searchFields: ['name', 'desc', 'hint'],
            emptyText: '没有符合条件的成就条目。',
            sectionTitle: '条目列表',
            sectionDesc: '选择一个条目查看详情。'
        };
    }

    filterEntries(entries, fields = []) {
        const q = (this.searchTerm || '').trim().toLowerCase();
        let list = entries;
        if (this.showUnlockedOnly) {
            const dataset = this.getActiveDataset();
            list = list.filter(entry => this.hasUnlocked(dataset.scope, entry.key));
        }
        if (!q) return list;
        return list.filter(entry => fields.some(field => {
            const value = entry[field];
            if (Array.isArray(value)) return value.join(' ').toLowerCase().includes(q);
            return String(value || '').toLowerCase().includes(q);
        }));
    }

    formatUnlockTime(scope, key) {
        const map = this.getScopeMap(scope);
        const ts = map[String(key)];
        if (!ts) return '未解锁';
        const d = new Date(ts);
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${d.getFullYear()}-${m}-${day}`;
    }

    ensureSelectedEntry(entries) {
        if (!entries.length) {
            this.selectedEntryKey = null;
            return null;
        }
        const exists = entries.find(entry => entry.key === this.selectedEntryKey);
        if (exists) return exists;
        const preferred = entries.find(entry => this.isEntryUnlocked(entry)) || entries[0];
        this.selectedEntryKey = preferred.key;
        return preferred;
    }

    isEntryUnlocked(entry) {
        const dataset = this.getActiveDataset();
        return this.hasUnlocked(dataset.scope, entry.key);
    }

    getTotalProgress() {
        return this.getCategories().reduce((acc, category) => {
            const row = this.getCategoryProgress(category.key);
            acc.unlocked += row.unlocked;
            acc.total += row.total;
            return acc;
        }, { unlocked: 0, total: 0 });
    }

    render() {
        if (!this.overlay) return;
        this.renderSidebar();
        this.renderHeader();
        this.renderTools();
        this.renderContent();
    }

    renderSidebar() {
        const categories = this.getCategories();
        const total = this.getTotalProgress();
        this.sidebar.innerHTML = `
            <div class="collection-brand">
                <div class="collection-kicker">Codex / Archive</div>
                <h2>收藏图鉴</h2>
                <p>查看已发现的记录。</p>
                <div class="collection-brand-progress">
                    <div class="collection-mini-stat">
                        <div class="label">总归档</div>
                        <div class="value">${total.unlocked}/${total.total}</div>
                    </div>
                    <div class="collection-mini-stat">
                        <div class="label">当前分类</div>
                        <div class="value">${collectionEscapeHtml(this.getCurrentTabMeta().title)}</div>
                    </div>
                </div>
            </div>
            <div class="collection-nav"></div>
            <button type="button" class="collection-close">关闭档案室</button>
        `;
        const nav = this.sidebar.querySelector('.collection-nav');
        categories.forEach(category => {
            const progress = this.getCategoryProgress(category.key);
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `collection-nav-btn ${this.activeTab === category.key ? 'active' : ''}`;
            button.innerHTML = `
                <span class="collection-nav-icon">${collectionEscapeHtml(category.icon)}</span>
                <span>
                    <div class="collection-nav-title">${collectionEscapeHtml(category.label)}</div>
                    <div class="collection-nav-hint">${collectionEscapeHtml(category.hint)}</div>
                </span>
                <span class="collection-nav-meta">${progress.unlocked}/${progress.total}</span>
            `;
            button.addEventListener('click', () => {
                this.activeTab = category.key;
                this.searchTerm = '';
                this.showUnlockedOnly = false;
                this.selectedEntryKey = null;
                this.render();
            });
            nav.appendChild(button);
        });
        this.sidebar.querySelector('.collection-close').addEventListener('click', () => this.close());
    }

    renderHeader() {
        const meta = this.getCurrentTabMeta();
        const progress = this.getCategoryProgress(this.activeTab);
        const total = this.getTotalProgress();
        this.header.innerHTML = `
                <div class="collection-header-main">
                    <div class="collection-header-icon">${collectionEscapeHtml(meta.icon)}</div>
                    <div class="collection-header-text">
                        <div class="collection-header-kicker">${collectionEscapeHtml(meta.kicker)}</div>
                        <h3>${collectionEscapeHtml(meta.title)}</h3>
                        <div class="collection-header-sub">${progress.unlocked}/${progress.total}</div>
                    </div>
                </div>
            <div class="collection-progress">
                <div class="collection-pill">当前分类<strong>${progress.unlocked}/${progress.total}</strong></div>
                <div class="collection-pill">总档案进度<strong>${total.unlocked}/${total.total}</strong></div>
            </div>
        `;
    }

    renderTools() {
        const needsArsenalToggle = this.activeTab === 'arsenal';
        this.tools.innerHTML = `
            <div class="collection-search-wrap">
                <input type="text" class="collection-search" placeholder="搜索名称 / 描述 / 稀有度 / 提示" value="${collectionEscapeHtml(this.searchTerm)}">
                <span class="collection-search-icon">⌕</span>
            </div>
            <div class="collection-filter-row">
                <button type="button" data-filter="all" class="${this.showUnlockedOnly ? '' : 'active'}">全部条目</button>
                <button type="button" data-filter="unlocked" class="${this.showUnlockedOnly ? 'active' : ''}">仅看已解锁</button>
            </div>
            ${needsArsenalToggle ? `
                <div class="collection-segment">
                    <button type="button" data-mode="weapon" class="${this.arsenalMode === 'weapon' ? 'active' : ''}">武器</button>
                    <button type="button" data-mode="passive" class="${this.arsenalMode === 'passive' ? 'active' : ''}">被动</button>
                </div>
            ` : ''}
        `;
        this.searchInput = this.tools.querySelector('.collection-search');
        this.searchInput.addEventListener('input', (event) => {
            this.searchTerm = event.target.value || '';
            this.renderContent();
        });
        this.tools.querySelectorAll('[data-mode]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.arsenalMode = btn.dataset.mode || 'weapon';
                this.selectedEntryKey = null;
                this.render();
            });
        });
        this.tools.querySelectorAll('[data-filter]').forEach(btn => {
            btn.addEventListener('click', () => {
                this.showUnlockedOnly = btn.dataset.filter === 'unlocked';
                this.selectedEntryKey = null;
                this.render();
            });
        });
    }

    getEntryIcon(entry, unlocked) {
        if (!unlocked) return '✦';
        return entry.icon || (this.activeTab === 'enemies' ? '👁️' : this.activeTab === 'achievements' ? '🏆' : this.activeTab === 'items' ? '🎒' : this.activeTab === 'arsenal' ? '⚔️' : this.activeTab === 'story' ? '📄' : this.activeTab === 'totems' ? '🦴' : '📁');
    }

    getEntryTitle(entry, unlocked) {
        if (unlocked) return entry.name || entry.title || '未命名条目';
        if (this.activeTab === 'totems') return '未发现的图腾';
        if (this.activeTab === 'story') return '未翻开的碎页';
        return '？？？';
    }

    getEntrySubtitle(entry, unlocked) {
        if (!unlocked) {
            return entry.unlockHint || entry.unlockCondition || entry.hint || '尚未记录';
        }
        if (this.activeTab === 'characters') return entry.title || '角色档案';
        if (this.activeTab === 'enemies') return entry.title || `第${entry.floor || '?'}层遭遇`;
        if (this.activeTab === 'items') return `效果：${entry.effect || '未定义'}`;
        if (this.activeTab === 'arsenal') return entry.tier || '战斗条目';
        if (this.activeTab === 'totems') return entry.blessing || '遗物记录';
        if (this.activeTab === 'story') return '碎页记录';
        return unlocked ? '已达成' : '尚未达成';
    }

    getEntryPreview(entry, unlocked) {
        if (!unlocked) {
            if (this.activeTab === 'story') return `残页仍未翻开。\n\n${entry.unlockHint || '继续推进后获得。'}`;
            if (this.activeTab === 'totems') return '遗物架还留着空位。必须真正取得图腾，陈列才会补全。';
            return `档案尚未补全。\n\n${entry.unlockHint || entry.unlockCondition || entry.hint || '继续推进后解锁。'}`;
        }
        if (this.activeTab === 'characters') return (entry.summary || []).join('\n\n');
        if (this.activeTab === 'enemies') return (entry.story || []).join('\n\n') || entry.quote || '';
        if (this.activeTab === 'items') return entry.desc || '';
        if (this.activeTab === 'arsenal' && this.arsenalMode === 'weapon') return [entry.special, entry.requires ? `需求：${entry.requires}` : '', entry.origin ? `来源：${entry.origin}` : ''].filter(Boolean).join('\n');
        if (this.activeTab === 'arsenal' && this.arsenalMode === 'passive') return entry.desc || entry.effect || '';
        if (this.activeTab === 'totems') return (entry.stories || []).join('\n\n');
        if (this.activeTab === 'story') return (entry.body || []).join('\n\n');
        return entry.desc || '';
    }

    getEntryFooter(entry, unlocked) {
        if (!unlocked) {
            return { left: '未归档', right: '锁定' };
        }
        if (this.activeTab === 'items') return { left: (entry.rarity || 'common').toUpperCase(), right: `ID ${entry.id}` };
        if (this.activeTab === 'arsenal' && this.arsenalMode === 'weapon') return { left: `伤害 ${entry.dmg || '?'}`, right: this.formatUnlockTime('weapons', entry.key) };
        if (this.activeTab === 'arsenal' && this.arsenalMode === 'passive') return { left: `最高等级 ${entry.maxLevel || '?'}`, right: this.formatUnlockTime('passives', entry.key) };
        if (this.activeTab === 'enemies') return { left: entry.quote || '遭遇已记录', right: `第${entry.floor || '?'}层` };
        if (this.activeTab === 'characters') return { left: entry.quote || '档案完成', right: this.formatUnlockTime('characters', entry.key) };
        if (this.activeTab === 'story') return { left: '碎页已归档', right: this.formatUnlockTime('story', entry.key) };
        if (this.activeTab === 'totems') return { left: '已纳入遗物架', right: this.formatUnlockTime('totems', entry.key) };
        return { left: '已完成', right: this.formatUnlockTime('achievements', entry.key) };
    }

    renderRecordCard(entry, index, scope) {
        const unlocked = this.hasUnlocked(scope, entry.key);
        const footer = this.getEntryFooter(entry, unlocked);
        const rarityClass = scope === 'items' && unlocked ? `collection-rarity-${entry.rarity || 'common'}` : '';
        return `
            <article class="collection-record ${unlocked ? '' : 'locked'} ${this.selectedEntryKey === entry.key ? 'active' : ''}" data-entry-key="${collectionEscapeHtml(entry.key)}">
                <div class="collection-record-index">No.${String(index + 1).padStart(2, '0')}</div>
                <div class="collection-record-top">
                    <div class="collection-record-icon">${collectionEscapeHtml(this.getEntryIcon(entry, unlocked))}</div>
                    <div>
                        <h5 class="collection-record-title">${collectionEscapeHtml(this.getEntryTitle(entry, unlocked))}</h5>
                        <div class="collection-record-subtitle">${collectionEscapeHtml(this.getEntrySubtitle(entry, unlocked))}</div>
                    </div>
                    <div class="collection-record-note ${rarityClass}">${collectionEscapeHtml(unlocked ? (scope === 'items' ? (entry.rarity || 'common') : '已记录') : '未解锁')}</div>
                </div>
                <p class="collection-record-preview">${collectionEscapeHtml(this.getEntryPreview(entry, unlocked))}</p>
                <div class="collection-record-footer">
                    <span>${collectionEscapeHtml(footer.left || '')}</span>
                    <span>${collectionEscapeHtml(footer.right || '')}</span>
                </div>
            </article>
        `;
    }

    getDetailSections(entry, unlocked) {
        if (!unlocked) {
            return [
                {
                    title: '缺页说明',
                    text: entry.unlockHint || entry.unlockCondition || entry.hint || '继续推进后解锁。'
                },
                {
                    title: '当前状态',
                    list: ['此条目仍未归档。', '解锁前不会显示完整名称、内容与细节。']
                }
            ];
        }
        if (this.activeTab === 'characters') {
            return [
                { title: '角色摘要', text: (entry.summary || []).join('\n\n') },
                { title: '档案附记', list: [entry.quote || '无附记', `首次记录：${this.formatUnlockTime('characters', entry.key)}`] }
            ];
        }
        if (this.activeTab === 'enemies') {
            return [
                { title: '遭遇记录', text: (entry.story || []).join('\n\n') || '暂无补充记录。' },
                { title: '现场标签', list: [`楼层：第${entry.floor || '?'}层`, `备注：${entry.quote || '无'}`] }
            ];
        }
        if (this.activeTab === 'items') {
            return [
                { title: '条目说明', text: entry.desc || '暂无说明。' },
                { title: '属性标签', list: [`效果：${entry.effect || '无'}`, `稀有度：${entry.rarity || 'common'}`, `ID：${entry.id || '?'}`] }
            ];
        }
        if (this.activeTab === 'arsenal' && this.arsenalMode === 'weapon') {
            return [
                { title: '战斗特性', text: [entry.special, entry.requires ? `需求：${entry.requires}` : '', entry.origin ? `来源：${entry.origin}` : ''].filter(Boolean).join('\n') || '暂无补充记录。' },
                { title: '武器标签', list: [`类型：${entry.tier || '武器'}`, `伤害：${entry.dmg || '?'}`, `解锁时间：${this.formatUnlockTime('weapons', entry.key)}`] }
            ];
        }
        if (this.activeTab === 'arsenal' && this.arsenalMode === 'passive') {
            return [
                { title: '体质变化', text: entry.desc || '暂无说明。' },
                { title: '被动标签', list: [`效果：${entry.effect || '无'}`, `最高等级：${entry.maxLevel || '?'}`, `解锁时间：${this.formatUnlockTime('passives', entry.key)}`] }
            ];
        }
        if (this.activeTab === 'totems') {
            return [
                { title: '图腾记述', text: (entry.stories || []).join('\n\n') || '暂无记录。' },
                { title: '遗物标签', list: [`祝福：${entry.blessing || '无'}`, `状态：已纳入遗物架`, `记录时间：${this.formatUnlockTime('totems', entry.key)}`] }
            ];
        }
        if (this.activeTab === 'story') {
            return [
                { title: '碎页正文', text: (entry.body || []).join('\n\n') || '暂无内容。' },
                { title: '碎页标签', list: [`状态：已归档`, `记录时间：${this.formatUnlockTime('story', entry.key)}`] }
            ];
        }
        return [
            { title: '成就说明', text: entry.desc || '暂无说明。' },
            { title: '达成信息', list: [`提示：${entry.hint || '无'}`, `完成时间：${this.formatUnlockTime('achievements', entry.key)}`] }
        ];
    }

    renderDetail(entry, scope) {
        if (!entry) {
            return `<div class="collection-empty">当前分类下没有可显示的条目。</div>`;
        }
        const unlocked = this.hasUnlocked(scope, entry.key);
        const sections = this.getDetailSections(entry, unlocked);
        const leadSection = sections[0] || null;
        const restSections = sections.slice(1);
        const metaChips = [];
        if (unlocked) metaChips.push('已归档');
        else metaChips.push('未解锁');
        if (this.activeTab === 'items' && unlocked) metaChips.push(`稀有度 ${entry.rarity || 'common'}`);
        if (this.activeTab === 'arsenal' && unlocked) metaChips.push(this.arsenalMode === 'weapon' ? (entry.tier || '武器') : `最高等级 ${entry.maxLevel || '?'}`);
        if (this.activeTab === 'enemies' && unlocked) metaChips.push(`第${entry.floor || '?'}层`);
        return `
            <div class="collection-detail-body">
                <div class="collection-detail-hero">
                    <div class="collection-detail-top">
                        <div class="collection-detail-icon">${collectionEscapeHtml(this.getEntryIcon(entry, unlocked))}</div>
                        <div>
                            <h4 class="collection-detail-title">${collectionEscapeHtml(this.getEntryTitle(entry, unlocked))}</h4>
                            <div class="collection-detail-subtitle">${collectionEscapeHtml(this.getEntrySubtitle(entry, unlocked))}</div>
                        </div>
                    </div>
                    <div class="collection-detail-meta">
                        ${metaChips.map(chip => `<span class="collection-detail-chip">${collectionEscapeHtml(chip)}</span>`).join('')}
                    </div>
                </div>
                ${leadSection ? `
                    <section class="collection-detail-section">
                        <h5>${collectionEscapeHtml(leadSection.title)}</h5>
                        ${leadSection.text ? `<p class="collection-detail-text">${collectionEscapeHtml(leadSection.text)}</p>` : ''}
                        ${leadSection.list ? `<ul class="collection-detail-list">${leadSection.list.map(item => `<li>${collectionEscapeHtml(item)}</li>`).join('')}</ul>` : ''}
                    </section>
                ` : ''}
                ${restSections.length ? `
                    <details class="collection-detail-more">
                        <summary>更多信息</summary>
                        <div class="collection-detail-more-body">
                            ${restSections.map(section => `
                                <section class="collection-detail-section">
                                    <h5>${collectionEscapeHtml(section.title)}</h5>
                                    ${section.text ? `<p class="collection-detail-text">${collectionEscapeHtml(section.text)}</p>` : ''}
                                    ${section.list ? `<ul class="collection-detail-list">${section.list.map(item => `<li>${collectionEscapeHtml(item)}</li>`).join('')}</ul>` : ''}
                                </section>
                            `).join('')}
                        </div>
                    </details>
                ` : ''}
            </div>
        `;
    }

    renderContent() {
        const dataset = this.getActiveDataset();
        const entries = this.filterEntries(dataset.entries, dataset.searchFields);
        const selected = this.ensureSelectedEntry(entries);
        const unlockedCount = entries.filter(entry => this.hasUnlocked(dataset.scope, entry.key)).length;
        if (!entries.length) {
            this.content.innerHTML = `<div class="collection-section"><div class="collection-empty">${collectionEscapeHtml(dataset.emptyText)}</div></div>`;
            return;
        }
        this.content.innerHTML = `
            <div class="collection-board">
                <section class="collection-section collection-list-wrap">
                    <div class="collection-section-head">
                        <div>
                            <h4>${collectionEscapeHtml(dataset.sectionTitle)}</h4>
                            <p>${collectionEscapeHtml(dataset.sectionDesc)}</p>
                        </div>
                        <span class="collection-stamp">已归档 ${unlockedCount} / ${entries.length}</span>
                    </div>
                    <div class="collection-records">
                        ${entries.map((entry, index) => this.renderRecordCard(entry, index, dataset.scope)).join('')}
                    </div>
                </section>
                <aside class="collection-section collection-detail">
                    <div class="collection-section-head">
                        <div>
                            <h4>详情</h4>
                            <p>当前选中条目</p>
                        </div>
                        <span class="collection-stamp">当前选中</span>
                    </div>
                    ${this.renderDetail(selected, dataset.scope)}
                </aside>
            </div>
        `;
        this.content.querySelectorAll('[data-entry-key]').forEach(node => {
            node.addEventListener('click', () => {
                this.selectedEntryKey = node.getAttribute('data-entry-key');
                this.renderContent();
            });
        });
    }

    showAchievementToast(key) {
        const data = COLLECTION_ACHIEVEMENT_DATA[key];
        if (!data) return;
        const toast = document.createElement('div');
        toast.className = 'collection-achievement-toast';
        toast.innerHTML = `
            <div class="eyebrow">🏆 成就达成</div>
            <div class="title">${collectionEscapeHtml(data.icon || '🏆')} ${collectionEscapeHtml(data.name)}</div>
            <div class="desc">${collectionEscapeHtml(data.desc || '')}</div>
        `;
        document.body.appendChild(toast);
        requestAnimationFrame(() => toast.classList.add('show'));
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 240);
        }, 3400);
    }
}

window.collectionCodex = new CollectionCodexSystem();
