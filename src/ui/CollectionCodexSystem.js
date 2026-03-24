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
        this.overlay = null;
        this.root = null;
        this.sidebar = null;
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
            .collection-overlay { position: fixed; inset: 0; z-index: 16000; background: rgba(5,7,12,0.82); backdrop-filter: blur(8px); display: none; align-items: center; justify-content: center; }
            .collection-shell { width: min(1380px, calc(100vw - 24px)); height: min(860px, calc(100vh - 24px)); display: grid; grid-template-columns: 260px minmax(0, 1fr); border: 1px solid rgba(255,255,255,0.12); border-radius: 24px; overflow: hidden; background: linear-gradient(180deg, rgba(13,17,27,0.98), rgba(8,10,17,0.98)); box-shadow: 0 24px 80px rgba(0,0,0,0.42); color: #f3efe7; }
            .collection-sidebar { padding: 22px 16px 18px; background: linear-gradient(180deg, rgba(17,21,31,0.98), rgba(9,12,19,0.98)); border-right: 1px solid rgba(255,255,255,0.08); display: flex; flex-direction: column; gap: 12px; }
            .collection-brand { padding: 10px 10px 14px; border-bottom: 1px solid rgba(255,255,255,0.08); margin-bottom: 6px; }
            .collection-brand h2 { margin: 0; font-size: 30px; letter-spacing: 0.03em; }
            .collection-brand p { margin: 8px 0 0; color: #98a2b3; line-height: 1.5; font-size: 13px; }
            .collection-nav { display: flex; flex-direction: column; gap: 8px; overflow: auto; padding-right: 4px; }
            .collection-nav-btn { display: flex; justify-content: space-between; align-items: center; gap: 8px; width: 100%; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 12px 14px; background: rgba(255,255,255,0.03); color: #f6f3ee; cursor: pointer; font: inherit; }
            .collection-nav-btn.active { background: rgba(186, 144, 72, 0.18); border-color: rgba(231, 180, 87, 0.42); box-shadow: inset 0 0 0 1px rgba(255,213,128,0.08); }
            .collection-nav-meta { color: #9ca6b5; font-size: 12px; }
            .collection-close { margin-top: auto; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 12px 14px; background: rgba(255,255,255,0.05); color: #f6f3ee; cursor: pointer; font: inherit; }
            .collection-main { min-width: 0; display: flex; flex-direction: column; }
            .collection-header { padding: 22px 24px 18px; border-bottom: 1px solid rgba(255,255,255,0.08); display: flex; flex-wrap: wrap; gap: 14px; align-items: end; justify-content: space-between; }
            .collection-header-main h3 { margin: 0; font-size: 32px; }
            .collection-header-main p { margin: 8px 0 0; color: #98a2b3; font-size: 14px; }
            .collection-progress { display: flex; gap: 10px; flex-wrap: wrap; }
            .collection-pill { padding: 8px 12px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); font-size: 13px; color: #cfd6e1; }
            .collection-tools { padding: 14px 24px 0; display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
            .collection-search { min-width: 240px; flex: 1 1 280px; max-width: 420px; border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 11px 14px; background: rgba(255,255,255,0.04); color: #fff; font: inherit; }
            .collection-segment { display: inline-flex; gap: 8px; padding: 4px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; }
            .collection-segment button { border: none; border-radius: 10px; padding: 9px 14px; background: transparent; color: #c8d0db; cursor: pointer; font: inherit; }
            .collection-segment button.active { background: rgba(231,180,87,0.18); color: #fff3d1; }
            .collection-content { padding: 18px 24px 24px; overflow: auto; }
            .collection-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 16px; }
            .collection-card { border: 1px solid rgba(255,255,255,0.08); border-radius: 20px; background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02)); padding: 16px; min-height: 190px; display: flex; flex-direction: column; gap: 12px; }
            .collection-card.locked { background: linear-gradient(180deg, rgba(255,255,255,0.025), rgba(255,255,255,0.015)); border-color: rgba(255,255,255,0.06); color: #8892a1; }
            .collection-card-top { display: flex; gap: 12px; align-items: flex-start; }
            .collection-card-icon { width: 50px; height: 50px; border-radius: 14px; background: rgba(255,255,255,0.06); display: inline-flex; align-items: center; justify-content: center; font-size: 26px; flex: 0 0 auto; }
            .collection-card.locked .collection-card-icon { background: rgba(255,255,255,0.03); }
            .collection-card-title { margin: 0; font-size: 18px; line-height: 1.3; }
            .collection-card-subtitle { margin: 6px 0 0; font-size: 12px; color: #a1abb9; line-height: 1.5; }
            .collection-card.locked .collection-card-subtitle { color: #7f8793; }
            .collection-card-body { margin: 0; color: #ced5df; font-size: 13px; line-height: 1.7; white-space: pre-line; }
            .collection-card.locked .collection-card-body { color: #7f8793; }
            .collection-card-footer { margin-top: auto; display: flex; justify-content: space-between; align-items: center; gap: 10px; color: #98a2b3; font-size: 12px; }
            .collection-badge { display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px; border-radius: 999px; background: rgba(255,255,255,0.06); }
            .collection-badge.rarity-common { color: #d7dde7; }
            .collection-badge.rarity-rare { color: #7cb7ff; }
            .collection-badge.rarity-epic { color: #d49cff; }
            .collection-badge.rarity-legendary { color: #ffc469; }
            .collection-empty { padding: 48px 16px; text-align: center; color: #8f98a6; }
            .collection-achievement-toast { position: fixed; right: 24px; bottom: 24px; width: min(360px, calc(100vw - 32px)); z-index: 18000; border-radius: 18px; padding: 16px 18px; border: 1px solid rgba(255, 223, 145, 0.28); background: linear-gradient(180deg, rgba(42, 25, 8, 0.96), rgba(20, 12, 5, 0.96)); box-shadow: 0 16px 40px rgba(0,0,0,0.35); color: #fff4d6; opacity: 0; transform: translateY(18px); transition: opacity 0.22s ease, transform 0.22s ease; pointer-events: none; }
            .collection-achievement-toast.show { opacity: 1; transform: translateY(0); }
            .collection-achievement-toast .eyebrow { font-size: 12px; letter-spacing: 0.08em; color: #f2c66d; margin-bottom: 8px; }
            .collection-achievement-toast .title { font-size: 22px; font-weight: 700; line-height: 1.25; }
            .collection-achievement-toast .desc { margin-top: 8px; color: #ebdcc1; font-size: 13px; line-height: 1.6; }
            @media (max-width: 960px) {
                .collection-shell { grid-template-columns: 1fr; height: min(94vh, 980px); }
                .collection-sidebar { border-right: none; border-bottom: 1px solid rgba(255,255,255,0.08); max-height: 260px; }
            }
        `;
        document.head.appendChild(style);
    }

    isOpen() {
        return !!(this.overlay && this.overlay.style.display !== 'none');
    }

    ensureOverlay() {
        if (this.overlay?.isConnected) return;
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
            { key: 'characters', label: '角色档案', hint: '人物与关键关系' },
            { key: 'enemies', label: '敌人图鉴', hint: '逐层见闻与残影' },
            { key: 'items', label: '道具图鉴', hint: '固定 / 成长 / 独特道具' },
            { key: 'arsenal', label: '武器 + 被动', hint: '战斗构筑' },
            { key: 'totems', label: '图腾遗物', hint: '真结局线路' },
            { key: 'story', label: '剧情碎片', hint: '逐步补全真相' },
            { key: 'achievements', label: '成就', hint: '局外长期解锁' }
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

        if (window.trueEndingSystem?.unlocked || (window.totemSystem && window.totemSystem.getCount?.() >= window.totemSystem.getAllTotems?.().length)) {
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

    render() {
        if (!this.overlay) return;
        this.renderSidebar();
        this.renderHeader();
        this.renderTools();
        this.renderContent();
    }

    renderSidebar() {
        const categories = this.getCategories();
        this.sidebar.innerHTML = `
            <div class="collection-brand">
                <h2>图鉴收藏</h2>
                <p>所有条目默认以问号显示。随着战斗、拾取、通关与真相推进，逐步补全。</p>
            </div>
            <div class="collection-nav"></div>
            <button type="button" class="collection-close">关闭</button>
        `;
        const nav = this.sidebar.querySelector('.collection-nav');
        categories.forEach(category => {
            const progress = this.getCategoryProgress(category.key);
            const button = document.createElement('button');
            button.type = 'button';
            button.className = `collection-nav-btn ${this.activeTab === category.key ? 'active' : ''}`;
            button.innerHTML = `
                <span>
                    <div>${collectionEscapeHtml(category.label)}</div>
                    <div class="collection-nav-meta">${collectionEscapeHtml(category.hint)}</div>
                </span>
                <span class="collection-nav-meta">${progress.unlocked}/${progress.total}</span>
            `;
            button.addEventListener('click', () => {
                this.activeTab = category.key;
                this.searchTerm = '';
                this.render();
            });
            nav.appendChild(button);
        });
        this.sidebar.querySelector('.collection-close').addEventListener('click', () => this.close());
    }

    renderHeader() {
        const titles = {
            characters: ['角色档案', '关键人物、守层者与真相中的真正位置。'],
            enemies: ['敌人图鉴', '逐层遭遇过的面孔与残响。'],
            items: ['道具图鉴', '固定属性、成长与独特功能道具。'],
            arsenal: ['武器 + 被动', '构筑核心、进化路线与长期收藏。'],
            totems: ['图腾遗物', '真结局路线的关键骨片。'],
            story: ['剧情碎片', '随着推进逐渐拼回整件事的真正轮廓。'],
            achievements: ['成就', '长期局外目标与关键节点见证。']
        };
        const progress = this.getCategoryProgress(this.activeTab);
        const totalProgress = this.getCategories().reduce((acc, category) => {
            const row = this.getCategoryProgress(category.key);
            acc.unlocked += row.unlocked;
            acc.total += row.total;
            return acc;
        }, { unlocked: 0, total: 0 });
        const title = titles[this.activeTab] || ['图鉴收藏', ''];
        this.header.innerHTML = `
            <div class="collection-header-main">
                <h3>${collectionEscapeHtml(title[0])}</h3>
                <p>${collectionEscapeHtml(title[1])}</p>
            </div>
            <div class="collection-progress">
                <div class="collection-pill">当前页 ${progress.unlocked}/${progress.total}</div>
                <div class="collection-pill">总进度 ${totalProgress.unlocked}/${totalProgress.total}</div>
            </div>
        `;
    }

    renderTools() {
        const needsArsenalToggle = this.activeTab === 'arsenal';
        this.tools.innerHTML = `
            <input type="text" class="collection-search" placeholder="搜索名称 / 描述 / 稀有度" value="${collectionEscapeHtml(this.searchTerm)}">
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
                this.render();
            });
        });
    }

    filterEntries(entries, fields = []) {
        const q = (this.searchTerm || '').trim().toLowerCase();
        if (!q) return entries;
        return entries.filter(entry => fields.some(field => String(entry[field] || '').toLowerCase().includes(q)));
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

    renderContent() {
        let html = '';
        if (this.activeTab === 'characters') {
            const entries = this.filterEntries(this.getCharacterEntries(), ['name', 'title', 'summary', 'quote']).map(entry => this.renderCharacterCard(entry)).join('');
            html = entries ? `<div class="collection-grid">${entries}</div>` : `<div class="collection-empty">没有符合搜索条件的角色条目。</div>`;
        } else if (this.activeTab === 'enemies') {
            const entries = this.filterEntries(this.getEnemyEntries(), ['name', 'title', 'story', 'quote']).map(entry => this.renderEnemyCard(entry)).join('');
            html = entries ? `<div class="collection-grid">${entries}</div>` : `<div class="collection-empty">没有符合搜索条件的敌人条目。</div>`;
        } else if (this.activeTab === 'items') {
            const entries = this.filterEntries(this.getItemEntries(), ['name', 'desc', 'rarity', 'effect']).map(entry => this.renderItemCard(entry)).join('');
            html = entries ? `<div class="collection-grid">${entries}</div>` : `<div class="collection-empty">没有符合搜索条件的道具条目。</div>`;
        } else if (this.activeTab === 'arsenal') {
            if (this.arsenalMode === 'weapon') {
                const entries = this.filterEntries(this.getWeaponEntries(), ['name', 'special', 'tier', 'requires']).map(entry => this.renderWeaponCard(entry)).join('');
                html = entries ? `<div class="collection-grid">${entries}</div>` : `<div class="collection-empty">没有符合搜索条件的武器条目。</div>`;
            } else {
                const entries = this.filterEntries(this.getPassiveEntries(), ['name', 'desc', 'effect']).map(entry => this.renderPassiveCard(entry)).join('');
                html = entries ? `<div class="collection-grid">${entries}</div>` : `<div class="collection-empty">没有符合搜索条件的被动条目。</div>`;
            }
        } else if (this.activeTab === 'totems') {
            const entries = this.filterEntries(this.getTotemEntries(), ['name', 'blessing', 'stories']).map(entry => this.renderTotemCard(entry)).join('');
            html = entries ? `<div class="collection-grid">${entries}</div>` : `<div class="collection-empty">没有符合搜索条件的图腾条目。</div>`;
        } else if (this.activeTab === 'story') {
            const entries = this.filterEntries(this.getStoryEntries(), ['title', 'body']).map(entry => this.renderStoryCard(entry)).join('');
            html = entries ? `<div class="collection-grid">${entries}</div>` : `<div class="collection-empty">没有符合搜索条件的剧情条目。</div>`;
        } else if (this.activeTab === 'achievements') {
            const entries = this.filterEntries(this.getAchievementEntries(), ['name', 'desc']).map(entry => this.renderAchievementCard(entry)).join('');
            html = entries ? `<div class="collection-grid">${entries}</div>` : `<div class="collection-empty">没有符合搜索条件的成就条目。</div>`;
        }
        this.content.innerHTML = html;
    }

    renderCharacterCard(entry) {
        const unlocked = this.hasUnlocked('characters', entry.key);
        const body = unlocked
            ? `${entry.summary.join('\n\n')}`
            : `？？？\n\n${entry.unlockHint}`;
        return `
            <article class="collection-card ${unlocked ? '' : 'locked'}">
                <div class="collection-card-top">
                    <div class="collection-card-icon">${unlocked ? collectionEscapeHtml(entry.icon) : '❓'}</div>
                    <div>
                        <h4 class="collection-card-title">${unlocked ? collectionEscapeHtml(entry.name) : '？？？'}</h4>
                        <div class="collection-card-subtitle">${unlocked ? collectionEscapeHtml(entry.title) : collectionEscapeHtml(entry.unlockHint)}</div>
                    </div>
                </div>
                <p class="collection-card-body">${collectionEscapeHtml(body)}</p>
                <div class="collection-card-footer">
                    <span>${unlocked ? collectionEscapeHtml(entry.quote) : '档案未开启'}</span>
                    <span>${unlocked ? this.formatUnlockTime('characters', entry.key) : '🔒'}</span>
                </div>
            </article>
        `;
    }

    renderEnemyCard(entry) {
        const unlocked = this.hasUnlocked('enemies', entry.key);
        const body = unlocked
            ? `${(entry.story || []).join('\n\n')}`
            : `？？？\n\n${entry.unlockCondition || '尚未发现'}`;
        return `
            <article class="collection-card ${unlocked ? '' : 'locked'}">
                <div class="collection-card-top">
                    <div class="collection-card-icon">${unlocked ? '👁️' : '❓'}</div>
                    <div>
                        <h4 class="collection-card-title">${unlocked ? collectionEscapeHtml(entry.name) : '？？？'}</h4>
                        <div class="collection-card-subtitle">${unlocked ? collectionEscapeHtml(entry.title || '') : collectionEscapeHtml(entry.unlockCondition || '未遭遇')}</div>
                    </div>
                </div>
                <p class="collection-card-body">${collectionEscapeHtml(body)}</p>
                <div class="collection-card-footer">
                    <span>${unlocked ? collectionEscapeHtml(entry.quote || '') : '等待遭遇'}</span>
                    <span>${unlocked ? `第${entry.floor || '?'}层` : '🔒'}</span>
                </div>
            </article>
        `;
    }

    renderItemCard(entry) {
        const unlocked = this.hasUnlocked('items', entry.key);
        const rarityClass = `rarity-${entry.rarity || 'common'}`;
        return `
            <article class="collection-card ${unlocked ? '' : 'locked'}">
                <div class="collection-card-top">
                    <div class="collection-card-icon">${unlocked ? collectionEscapeHtml(entry.icon || '🎲') : '❓'}</div>
                    <div>
                        <h4 class="collection-card-title">${unlocked ? collectionEscapeHtml(entry.name) : '？？？'}</h4>
                        <div class="collection-card-subtitle">${unlocked ? `效果：${collectionEscapeHtml(entry.effect || '')}` : `解锁条件：拾取该道具`}</div>
                    </div>
                </div>
                <p class="collection-card-body">${unlocked ? collectionEscapeHtml(entry.desc || '') : '未拾取前不会显示效果与数值。'}</p>
                <div class="collection-card-footer">
                    <span class="collection-badge ${rarityClass}">${collectionEscapeHtml((entry.rarity || 'common').toUpperCase())}</span>
                    <span>${unlocked ? `ID ${collectionEscapeHtml(entry.id)}` : '🔒'}</span>
                </div>
            </article>
        `;
    }

    renderWeaponCard(entry) {
        const unlocked = this.hasUnlocked('weapons', entry.key);
        const extra = unlocked
            ? [entry.special, entry.origin ? `来源：${entry.origin}` : '', entry.requires ? `需求：${entry.requires}` : ''].filter(Boolean).join('\n')
            : (entry.tier === '超武' ? '让对应基础武器完成进化。' : '在局内获取该武器后解锁。');
        return `
            <article class="collection-card ${unlocked ? '' : 'locked'}">
                <div class="collection-card-top">
                    <div class="collection-card-icon">${unlocked ? collectionEscapeHtml(entry.icon || '⚔️') : '❓'}</div>
                    <div>
                        <h4 class="collection-card-title">${unlocked ? collectionEscapeHtml(entry.name) : '？？？'}</h4>
                        <div class="collection-card-subtitle">${collectionEscapeHtml(entry.tier || '武器')}</div>
                    </div>
                </div>
                <p class="collection-card-body">${collectionEscapeHtml(extra || '')}</p>
                <div class="collection-card-footer">
                    <span>${unlocked ? `伤害 ${entry.dmg || '?'}` : '未解锁'}</span>
                    <span>${unlocked ? this.formatUnlockTime('weapons', entry.key) : '🔒'}</span>
                </div>
            </article>
        `;
    }

    renderPassiveCard(entry) {
        const unlocked = this.hasUnlocked('passives', entry.key);
        return `
            <article class="collection-card ${unlocked ? '' : 'locked'}">
                <div class="collection-card-top">
                    <div class="collection-card-icon">${unlocked ? collectionEscapeHtml(entry.icon || '🧿') : '❓'}</div>
                    <div>
                        <h4 class="collection-card-title">${unlocked ? collectionEscapeHtml(entry.name) : '？？？'}</h4>
                        <div class="collection-card-subtitle">${unlocked ? `效果：${collectionEscapeHtml(entry.effect || '')}` : '在局内首次获得后解锁'}</div>
                    </div>
                </div>
                <p class="collection-card-body">${unlocked ? collectionEscapeHtml(entry.desc || '') : '未解锁前仅显示问号。'}</p>
                <div class="collection-card-footer">
                    <span>最高等级 ${collectionEscapeHtml(entry.maxLevel || '?')}</span>
                    <span>${unlocked ? this.formatUnlockTime('passives', entry.key) : '🔒'}</span>
                </div>
            </article>
        `;
    }

    renderTotemCard(entry) {
        const unlocked = this.hasUnlocked('totems', entry.key);
        const body = unlocked ? (entry.stories || []).join('\n\n') : '？？？\n\n击败守层Boss并拾取对应图腾后解锁。';
        return `
            <article class="collection-card ${unlocked ? '' : 'locked'}">
                <div class="collection-card-top">
                    <div class="collection-card-icon">${unlocked ? collectionEscapeHtml(entry.icon || '🦴') : '❓'}</div>
                    <div>
                        <h4 class="collection-card-title">${unlocked ? collectionEscapeHtml(entry.name) : '未发现的图腾'}</h4>
                        <div class="collection-card-subtitle">${unlocked ? collectionEscapeHtml(entry.blessing || '') : '真结局线路关键条目'}</div>
                    </div>
                </div>
                <p class="collection-card-body">${collectionEscapeHtml(body)}</p>
                <div class="collection-card-footer">
                    <span>${unlocked ? '已纳入收藏' : '🔒'}</span>
                    <span>${unlocked ? this.formatUnlockTime('totems', entry.key) : '未取得'}</span>
                </div>
            </article>
        `;
    }

    renderStoryCard(entry) {
        const unlocked = this.hasUnlocked('story', entry.key);
        const body = unlocked ? entry.body.join('\n\n') : `？？？\n\n${entry.unlockHint}`;
        return `
            <article class="collection-card ${unlocked ? '' : 'locked'}">
                <div class="collection-card-top">
                    <div class="collection-card-icon">${unlocked ? collectionEscapeHtml(entry.icon || '📄') : '❓'}</div>
                    <div>
                        <h4 class="collection-card-title">${unlocked ? collectionEscapeHtml(entry.title) : '未翻开的碎页'}</h4>
                        <div class="collection-card-subtitle">${unlocked ? '已记录' : collectionEscapeHtml(entry.unlockHint)}</div>
                    </div>
                </div>
                <p class="collection-card-body">${collectionEscapeHtml(body)}</p>
                <div class="collection-card-footer">
                    <span>${unlocked ? '剧情已补全一页' : '等待推进'}</span>
                    <span>${unlocked ? this.formatUnlockTime('story', entry.key) : '🔒'}</span>
                </div>
            </article>
        `;
    }

    renderAchievementCard(entry) {
        const unlocked = this.hasUnlocked('achievements', entry.key);
        return `
            <article class="collection-card ${unlocked ? '' : 'locked'}">
                <div class="collection-card-top">
                    <div class="collection-card-icon">${unlocked ? collectionEscapeHtml(entry.icon || '🏆') : '❓'}</div>
                    <div>
                        <h4 class="collection-card-title">${unlocked ? collectionEscapeHtml(entry.name) : '？？？'}</h4>
                        <div class="collection-card-subtitle">${unlocked ? '已达成' : collectionEscapeHtml(entry.hint || '尚未达成')}</div>
                    </div>
                </div>
                <p class="collection-card-body">${unlocked ? collectionEscapeHtml(entry.desc || '') : '达成前不会显示完整名称与说明。'}</p>
                <div class="collection-card-footer">
                    <span>${unlocked ? this.formatUnlockTime('achievements', entry.key) : '🔒'}</span>
                    <span>${unlocked ? '完成' : '未完成'}</span>
                </div>
            </article>
        `;
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
