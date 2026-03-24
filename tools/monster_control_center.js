(function () {
    'use strict';

    var DIST_KEY = 'rougelikeCow.roomDistribution.v2';
    var ROOM_TYPES = [
        { id: 'normal', label: '普通房', kind: 'wave' },
        { id: 'elite', label: '精英房', kind: 'wave' },
        { id: 'boss', label: 'Boss 房', kind: 'wave' },
        { id: 'chest', label: '宝箱房', kind: 'spawn_set' },
        { id: 'shop', label: '商店', kind: 'spawn_set' },
        { id: 'event', label: '事件房', kind: 'spawn_set' },
        { id: 'secret', label: '隐藏房', kind: 'spawn_set' }
    ];
    var MODE_KINDS = [
        { id: 'wave', label: '多波刷怪' },
        { id: 'spawn_set', label: '静态产物集' },
        { id: 'transform_trigger', label: '触发转化' }
    ];
    var SPAWN_TYPES = [
        { id: 'chest', label: '单宝箱' },
        { id: 'multi_chest', label: '多宝箱' },
        { id: 'fake_chest', label: '假宝箱' },
        { id: 'shop_vendor', label: '商店老板' },
        { id: 'shop_shelf', label: '商店货架' },
        { id: 'hidden_cache', label: '隐藏补给' },
        { id: 'reward_marker', label: '奖励点' },
        { id: 'ambush_marker', label: '埋伏点' }
    ];
    var TIERS = ['T1', 'T2', 'T3', 'T4'];
    var el = {};
    var state = {
        distributionConfig: {},
        distributionUi: { floorKey: '', roomTypeId: 'normal', modeId: '' }
    };

    function floorData() { return window.FLOOR_DATA && window.FLOOR_DATA.floors ? window.FLOOR_DATA.floors : {}; }
    function uid(prefix) { return prefix + '_' + Math.random().toString(36).slice(2, 9); }
    function clone(value) { return JSON.parse(JSON.stringify(value)); }
    function esc(text) { return String(text || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
    function attr(text) { return esc(text).replace(/"/g, '&quot;'); }
    function roomPreset(id) { return ROOM_TYPES.find(function (item) { return item.id === id; }) || ROOM_TYPES[0]; }
    function defaultRoomCount(id) {
        switch (id) {
            case 'normal': return 6;
            case 'elite': return 1;
            case 'boss': return 1;
            case 'chest': return 1;
            case 'shop': return 1;
            case 'event': return 0;
            case 'secret': return 1;
            default: return 0;
        }
    }
    function floorNumberFromKey(floorKey) {
        var match = String(floorKey || '').match(/(\d+)/);
        return match ? Number(match[1]) : 1;
    }
    function buildTierSet(t1, t2, t3, t4) {
        return {
            T1: alloc('count', t1 || 0),
            T2: alloc('count', t2 || 0),
            T3: alloc('count', t3 || 0),
            T4: alloc('count', t4 || 0)
        };
    }
    function sanitizeRoomCount(roomTypeId, rawCount) {
        var parsed = Number(rawCount);
        if (!Number.isFinite(parsed) || parsed < 0) return defaultRoomCount(roomTypeId);
        // 旧版本把“权重 100”错误迁成了“每层 100 个”，这里直接纠正回房型默认数量。
        if (parsed > 20) return defaultRoomCount(roomTypeId);
        return parsed;
    }
    function isLegacyPlaceholderWaveMode(item) {
        if (!item || item.kind !== 'wave' || !item.waves || item.waves.length !== 1) return false;
        var entry = item.waves[0];
        if (!entry || entry.name !== '第1波' || Number(entry.enemyCount || 0) !== 12) return false;
        return TIERS.every(function (tierKey, index) {
            var slot = entry.tiers && entry.tiers[tierKey];
            var expected = index === 0 ? 8 : index === 1 ? 2 : 0;
            return slot && slot.mode === 'count' && Number(slot.value || 0) === expected;
        });
    }
    function runtimeWave(name, enemyCount, tiers, note) {
        return {
            id: uid('wave'),
            name: name,
            enemyCount: enemyCount,
            note: note || '',
            tiers: tiers,
            fixedMonsters: []
        };
    }
    function monsterEntry(monsterKey, mode, value) {
        return {
            id: uid('pick'),
            monsterKey: monsterKey || '',
            mode: mode === 'ratio' ? 'ratio' : 'count',
            value: Number(value || 0)
        };
    }
    function monsterOptionsForFloor(floorKey) {
        var floor = floorData()[floorKey];
        if (!floor || !Array.isArray(floor.monsters)) return [];
        return floor.monsters.map(function (monster) {
            var tier = 'T' + Number(monster.tier || 1);
            return {
                key: String(monster.id || '') + '::' + String(monster.tier || 1),
                label: String(monster.name || monster.id || '未命名怪') + ' [' + tier + ']',
                id: String(monster.id || ''),
                tier: tier
            };
        });
    }
    function monsterLabel(floorKey, monsterKey) {
        var hit = monsterOptionsForFloor(floorKey).find(function (item) { return item.key === monsterKey; });
        return hit ? hit.label : '未选择怪物';
    }
    function firstMonsterKeyByKeywords(floorKey, keywords) {
        var options = monsterOptionsForFloor(floorKey).filter(function (item) { return item.tier === 'T1'; });
        var lowered = (keywords || []).map(function (item) { return String(item).toLowerCase(); });
        var hit = options.find(function (item) {
            var text = (item.id + ' ' + item.label).toLowerCase();
            return lowered.some(function (keyword) { return text.indexOf(keyword) >= 0; });
        });
        return hit ? hit.key : '';
    }
    function buildSwarmWave(baseWave, monsterKey) {
        return {
            id: uid('wave'),
            name: baseWave.name,
            enemyCount: Math.max(1, Number(baseWave.enemyCount || 0) * 2),
            note: '怪群模式：仅刷一种指定怪，数量为常规模式的 2 倍。',
            tiers: buildTierSet(0, 0, 0, 0),
            fixedMonsters: [monsterEntry(monsterKey, 'count', Math.max(1, Number(baseWave.enemyCount || 0) * 2))]
        };
    }
    function buildNormalSwarmModes(floorKey, roomLabel, baseMode) {
        var candidates = [
            { label: '小鸡房', keywords: ['chick', '小鸡'] },
            { label: '蝙蝠房', keywords: ['bat', '蝙蝠'] },
            { label: '螃蟹房', keywords: ['crab', '蟹'] },
            { label: '蜗牛房', keywords: ['snail', '蜗牛'] },
            { label: '鸽群房', keywords: ['pigeon', '鸽'] }
        ].map(function (entry) {
            return {
                label: entry.label,
                monsterKey: firstMonsterKeyByKeywords(floorKey, entry.keywords)
            };
        }).filter(function (entry) { return !!entry.monsterKey; });
        if (!candidates.length) return [];
        var probability = Math.floor(20 / candidates.length);
        var remainder = 20 - probability * candidates.length;
        return candidates.map(function (entry, index) {
            return {
                id: uid('mode'),
                name: entry.label,
                kind: 'wave',
                weight: probability + (index < remainder ? 1 : 0),
                enabled: true,
                note: '怪群模式：只刷 ' + monsterLabel(floorKey, entry.monsterKey) + '，每波数量按常规模式翻倍。',
                drops: clone(baseMode.drops),
                generation: clone(baseMode.generation),
                waves: baseMode.waves.map(function (waveEntry) { return buildSwarmWave(waveEntry, entry.monsterKey); }),
                spawnSet: [],
                trigger: null
            };
        });
    }
    function buildNormalWave(enemyCount, t2Rate, note) {
        var t2Count = Math.max(0, Math.round(enemyCount * t2Rate));
        var t1Count = Math.max(0, enemyCount - t2Count);
        return runtimeWave('', enemyCount, buildTierSet(t1Count, t2Count, 0, 0), note || '');
    }
    function buildRuntimeDefaultModes(floorKey, roomTypeId, label) {
        var primary = buildRuntimeDefaultMode(floorKey, roomTypeId, label);
        if (roomTypeId !== 'normal') return [primary];
        primary.weight = 80;
        primary.note += ' 常规模式概率 80%，其余 20% 分给单一种怪的怪群模式。';
        return [primary].concat(buildNormalSwarmModes(floorKey, label || roomPreset(roomTypeId).label, primary));
    }
    function buildRuntimeDefaultMode(floorKey, roomTypeId, label) {
        var floor = floorNumberFromKey(floorKey);
        var spawnMultiplier = Math.pow(floor, 0.8);
        var normalBase = Math.floor(10 * spawnMultiplier);
        var normalT2Rate = Math.min(0.30 + (floor - 1) * 0.05, 0.60);
        var roomLabel = label || roomPreset(roomTypeId).label;
        if (roomTypeId === 'normal') {
            var normalDrops = dropConfig();
            normalDrops.onClear.enabled = true;
            normalDrops.onClear.note = '当前运行时主要由怪物个体掉落金币和经验；这里先保留房间级清房结算入口。';
            return {
                id: uid('mode'),
                name: roomLabel + '模式1',
                kind: 'wave',
                weight: 100,
                enabled: true,
                note: '按当前运行时基线初始化：普通房实际为 3-5 波随机，且只出 T1/T2；这里先落一套 4 波基准。',
                drops: normalDrops,
                generation: generationConfig(),
                waves: [
                    Object.assign(buildNormalWave(normalBase, normalT2Rate, ''), { name: '第1波' }),
                    Object.assign(buildNormalWave(Math.floor(normalBase * 1.2), normalT2Rate, ''), { name: '第2波' }),
                    Object.assign(buildNormalWave(Math.floor(normalBase * 1.4), normalT2Rate, ''), { name: '第3波' }),
                    Object.assign(buildNormalWave(Math.floor(normalBase * 1.6), normalT2Rate, '运行时这里可能扩成第4或第5波'), { name: '第4波' })
                ],
                spawnSet: [],
                trigger: null
            };
        }
        if (roomTypeId === 'elite') {
            var eliteDrops = dropConfig();
            eliteDrops.onClear.enabled = true;
            eliteDrops.onClear.note = '当前运行时没有独立精英房清房奖励表；如需额外奖励，从这里补。';
            return {
                id: uid('mode'),
                name: roomLabel + '模式1',
                kind: 'wave',
                weight: 100,
                enabled: true,
                note: '按当前运行时初始化：精英房 3 波，前两波偏 T2，第三波混入 T3。',
                drops: eliteDrops,
                generation: generationConfig(),
                waves: [
                    runtimeWave('第1波', 16, buildTierSet(0, 16, 0, 0), ''),
                    runtimeWave('第2波', 16, buildTierSet(0, 16, 0, 0), ''),
                    runtimeWave('第3波', 16, buildTierSet(0, 15, 1, 0), '')
                ],
                spawnSet: [],
                trigger: null
            };
        }
        if (roomTypeId === 'boss') {
            var bossDrops = dropConfig();
            bossDrops.onClear.enabled = true;
            bossDrops.onClear.bossChest = true;
            bossDrops.onClear.spawnPortal = true;
            bossDrops.onClear.note = 'Boss 房默认保留清房宝箱和后续出口位。';
            return {
                id: uid('mode'),
                name: roomLabel + '模式1',
                kind: 'wave',
                weight: 100,
                enabled: true,
                note: '按当前运行时初始化：Boss 房 1 波 1 只 T4。',
                drops: bossDrops,
                generation: generationConfig(),
                waves: [runtimeWave('Boss波', 1, buildTierSet(0, 0, 0, 1), '')],
                spawnSet: [],
                trigger: null
            };
        }
        if (roomTypeId === 'chest') {
            var chestMode = mode('spawn_set', roomLabel + '模式1');
            chestMode.note = '按当前运行时初始化：宝箱房进房即有宝箱。';
            chestMode.spawnSet = [spawnItem('chest')];
            chestMode.drops.onEnter.enabled = true;
            chestMode.drops.onEnter.spawnMode = 'chest';
            chestMode.drops.onEnter.chestType = 'reward';
            return chestMode;
        }
        if (roomTypeId === 'shop') {
            var shopMode = mode('spawn_set', roomLabel + '模式1');
            shopMode.note = '按当前运行时初始化：商店进房即有老板和货架。';
            shopMode.spawnSet = [spawnItem('shop_vendor'), spawnItem('shop_shelf')];
            shopMode.spawnSet[1].count = 3;
            shopMode.drops.onEnter.enabled = true;
            shopMode.drops.onEnter.spawnMode = 'shop';
            shopMode.drops.onEnter.itemPool = 'shop_floor' + floor + '_pool';
            shopMode.drops.onEnter.itemCount = 3;
            return shopMode;
        }
        if (roomTypeId === 'secret') {
            var secretMode = mode('spawn_set', roomLabel + '模式1');
            secretMode.note = '按当前运行时初始化：隐藏房每层 1 个，进房即给隐藏奖励。';
            secretMode.spawnSet = [spawnItem('hidden_cache')];
            secretMode.drops.onEnter.enabled = true;
            secretMode.drops.onEnter.spawnMode = 'hidden';
            secretMode.drops.onEnter.chestType = 'hidden';
            secretMode.drops.onEnter.itemCount = 1;
            secretMode.drops.onEnter.itemPool = 'secret';
            return secretMode;
        }
        return mode(roomPreset(roomTypeId).kind, roomLabel + '模式1');
    }
    function modeLabel(id) { var hit = MODE_KINDS.find(function (item) { return item.id === id; }); return hit ? hit.label : id; }
    function spawnLabel(id) { var hit = SPAWN_TYPES.find(function (item) { return item.id === id; }); return hit ? hit.label : id; }
    function alloc(mode, value) { return { mode: mode || 'count', value: value || 0 }; }
    function wave(name) { return { id: uid('wave'), name: name || '新波次', enemyCount: 12, note: '', tiers: { T1: alloc('count', 8), T2: alloc('count', 2), T3: alloc('count', 0), T4: alloc('count', 0) }, fixedMonsters: [] }; }
    function spawnItem(kind) { return { id: uid('spawn'), kind: kind || 'chest', count: 1, weight: 100, note: '' }; }
    function trigger() { return { sourceKind: 'fake_chest', triggerRadius: 80, resultTier: 'T3', spawnCount: 1, followWave: false, note: '' }; }
    function dropConfig() {
        return {
            onEnter: {
                enabled: false,
                spawnMode: 'none',
                itemPool: '',
                itemCount: 0,
                gold: 0,
                exp: 0,
                chestType: 'reward',
                note: ''
            },
            onClear: {
                enabled: false,
                gold: 0,
                exp: 0,
                itemDropMode: 'none',
                itemPool: '',
                itemCount: 0,
                bossChest: false,
                bossChestType: 'boss',
                spawnPortal: false,
                note: ''
            }
        };
    }
    function generationConfig() {
        return {
            lockDoors: true,
            needClearReward: true,
            spawnLimitMin: 0,
            spawnLimitMax: 0,
            allowFirstFloor: true,
            allowRepeat: true,
            spawnPortalAfterClear: false,
            generationNote: ''
        };
    }
    function mode(kind, name) {
        var finalKind = kind || 'wave';
        return { id: uid('mode'), name: name || '新模式', kind: finalKind, weight: 100, enabled: true, note: '', drops: dropConfig(), generation: generationConfig(), waves: finalKind === 'wave' ? [wave('第1波')] : [], spawnSet: finalKind === 'spawn_set' ? [spawnItem('chest')] : [], trigger: finalKind === 'transform_trigger' ? trigger() : null };
    }
    function roomType(floorKey, id) {
        var preset = roomPreset(id);
        return { id: id, label: preset.label, enabled: true, count: defaultRoomCount(id), note: '', modes: buildRuntimeDefaultModes(floorKey, id, preset.label) };
    }
    function floorDistribution(floorKey) {
        var roomTypes = {};
        ROOM_TYPES.forEach(function (item) { roomTypes[item.id] = roomType(floorKey, item.id); });
        return { floorKey: floorKey, roomTypes: roomTypes };
    }
    function normalizeShape(raw) {
        var out = {};
        Object.keys(floorData()).forEach(function (floorKey) {
            var source = raw && raw[floorKey] ? raw[floorKey] : floorDistribution(floorKey);
            var roomTypes = {};
            ROOM_TYPES.forEach(function (preset) {
                var incoming = source.roomTypes && source.roomTypes[preset.id] ? source.roomTypes[preset.id] : roomType(floorKey, preset.id);
                roomTypes[preset.id] = {
                    id: preset.id,
                    label: incoming.label || preset.label,
                    enabled: incoming.enabled !== false,
                    count: sanitizeRoomCount(preset.id, incoming.count),
                    note: incoming.note || '',
                    modes: (incoming.modes && incoming.modes.length ? incoming.modes : buildRuntimeDefaultModes(floorKey, preset.id, incoming.label || preset.label)).map(function (item) {
                        if (isLegacyPlaceholderWaveMode(item)) {
                            var runtimeMode = buildRuntimeDefaultMode(floorKey, preset.id, item.name || incoming.label || preset.label);
                            runtimeMode.id = item.id || uid('mode');
                            runtimeMode.name = item.name || runtimeMode.name;
                            runtimeMode.weight = Number(item.weight || runtimeMode.weight);
                            runtimeMode.enabled = item.enabled !== false;
                            runtimeMode.note = runtimeMode.note;
                            item = runtimeMode;
                        }
                        var finalKind = item.kind || preset.kind;
                        var normalized = {
                            id: item.id || uid('mode'),
                            name: item.name || '未命名模式',
                            kind: finalKind,
                            weight: Number(item.weight || 100),
                            enabled: item.enabled !== false,
                            note: item.note || '',
                            drops: {
                                onEnter: {
                                    enabled: !!(item.drops && item.drops.onEnter && item.drops.onEnter.enabled),
                                    spawnMode: item.drops && item.drops.onEnter && item.drops.onEnter.spawnMode || 'none',
                                    itemPool: item.drops && item.drops.onEnter && item.drops.onEnter.itemPool || '',
                                    itemCount: Number(item.drops && item.drops.onEnter && item.drops.onEnter.itemCount || 0),
                                    gold: Number(item.drops && item.drops.onEnter && item.drops.onEnter.gold || 0),
                                    exp: Number(item.drops && item.drops.onEnter && item.drops.onEnter.exp || 0),
                                    chestType: item.drops && item.drops.onEnter && item.drops.onEnter.chestType || 'reward',
                                    note: item.drops && item.drops.onEnter && item.drops.onEnter.note || ''
                                },
                                onClear: {
                                    enabled: !!(item.drops && item.drops.onClear && item.drops.onClear.enabled),
                                    gold: Number(item.drops && item.drops.onClear && item.drops.onClear.gold || 0),
                                    exp: Number(item.drops && item.drops.onClear && item.drops.onClear.exp || 0),
                                    itemDropMode: item.drops && item.drops.onClear && item.drops.onClear.itemDropMode || 'none',
                                    itemPool: item.drops && item.drops.onClear && item.drops.onClear.itemPool || '',
                                    itemCount: Number(item.drops && item.drops.onClear && item.drops.onClear.itemCount || 0),
                                    bossChest: !!(item.drops && item.drops.onClear && item.drops.onClear.bossChest),
                                    bossChestType: item.drops && item.drops.onClear && item.drops.onClear.bossChestType || 'boss',
                                    spawnPortal: !!(item.drops && item.drops.onClear && item.drops.onClear.spawnPortal),
                                    note: item.drops && item.drops.onClear && item.drops.onClear.note || ''
                                }
                            },
                            generation: {
                                lockDoors: item.generation ? item.generation.lockDoors !== false : true,
                                needClearReward: item.generation ? item.generation.needClearReward !== false : true,
                                spawnLimitMin: Number(item.generation && item.generation.spawnLimitMin || 0),
                                spawnLimitMax: Number(item.generation && item.generation.spawnLimitMax || 0),
                                allowFirstFloor: item.generation ? item.generation.allowFirstFloor !== false : true,
                                allowRepeat: item.generation ? item.generation.allowRepeat !== false : true,
                                spawnPortalAfterClear: !!(item.generation && item.generation.spawnPortalAfterClear),
                                generationNote: item.generation && item.generation.generationNote || ''
                            },
                            waves: [],
                            spawnSet: [],
                            trigger: null
                        };
                        if (!item.drops) {
                            normalized.drops = buildRuntimeDefaultMode(floorKey, preset.id, item.name || incoming.label || preset.label).drops;
                        }
                        if (finalKind === 'wave') {
                            normalized.waves = (item.waves && item.waves.length ? item.waves : [wave('第1波')]).map(function (entry) {
                                var tiers = {};
                                TIERS.forEach(function (tierKey) {
                                    var slot = entry.tiers && entry.tiers[tierKey] ? entry.tiers[tierKey] : {};
                                    tiers[tierKey] = { mode: slot.mode === 'ratio' ? 'ratio' : 'count', value: Number(slot.value || 0) };
                                });
                                return {
                                    id: entry.id || uid('wave'),
                                    name: entry.name || '波次',
                                    enemyCount: Number(entry.enemyCount || 0),
                                    note: entry.note || '',
                                    tiers: tiers,
                                    fixedMonsters: (entry.fixedMonsters || []).map(function (pick) {
                                        return {
                                            id: pick.id || uid('pick'),
                                            monsterKey: pick.monsterKey || '',
                                            mode: pick.mode === 'ratio' ? 'ratio' : 'count',
                                            value: Number(pick.value || 0)
                                        };
                                    })
                                };
                            });
                        }
                        if (finalKind === 'spawn_set') {
                            normalized.spawnSet = (item.spawnSet && item.spawnSet.length ? item.spawnSet : [spawnItem('chest')]).map(function (entry) {
                                return { id: entry.id || uid('spawn'), kind: entry.kind || 'chest', count: Number(entry.count || 1), weight: Number(entry.weight || 100), note: entry.note || '' };
                            });
                        }
                        if (finalKind === 'transform_trigger') {
                            var rawTrigger = item.trigger || {};
                            normalized.trigger = { sourceKind: rawTrigger.sourceKind || 'fake_chest', triggerRadius: Number(rawTrigger.triggerRadius || 80), resultTier: TIERS.indexOf(rawTrigger.resultTier) >= 0 ? rawTrigger.resultTier : 'T3', spawnCount: Number(rawTrigger.spawnCount || 1), followWave: !!rawTrigger.followWave, note: rawTrigger.note || '' };
                        }
                        return normalized;
                    }).filter(function (item) { return !!item; })
                };
                if (preset.id === 'normal' && roomTypes[preset.id].modes.length === 1) {
                    var maybeDefault = roomTypes[preset.id].modes[0];
                    if (maybeDefault.note && maybeDefault.note.indexOf('普通房实际为 3-5 波随机') >= 0) {
                        roomTypes[preset.id].modes = buildRuntimeDefaultModes(floorKey, preset.id, roomTypes[preset.id].label);
                    }
                }
            });
            out[floorKey] = { floorKey: floorKey, roomTypes: roomTypes };
        });
        return out;
    }
    function currentFloor() { ensureDistributionSelection(); return state.distributionConfig[state.distributionUi.floorKey] || null; }
    function currentRoomType() { var floor = currentFloor(); return floor ? floor.roomTypes[state.distributionUi.roomTypeId] : null; }
    function currentMode() { var room = currentRoomType(); return room ? room.modes.find(function (item) { return item.id === state.distributionUi.modeId; }) || room.modes[0] || null : null; }
    function ensureDistributionSelection() {
        var keys = Object.keys(floorData());
        if (!state.distributionUi.floorKey || keys.indexOf(state.distributionUi.floorKey) < 0) state.distributionUi.floorKey = keys[0] || '';
        var room = state.distributionConfig[state.distributionUi.floorKey] && state.distributionConfig[state.distributionUi.floorKey].roomTypes[state.distributionUi.roomTypeId];
        if (!room) state.distributionUi.roomTypeId = ROOM_TYPES[0].id;
        room = state.distributionConfig[state.distributionUi.floorKey] && state.distributionConfig[state.distributionUi.floorKey].roomTypes[state.distributionUi.roomTypeId];
        if (room && (!state.distributionUi.modeId || !room.modes.some(function (item) { return item.id === state.distributionUi.modeId; }))) state.distributionUi.modeId = room.modes[0] ? room.modes[0].id : '';
    }
    function distributionWarnings(floorKey) {
        var floor = state.distributionConfig[floorKey], warnings = [];
        if (!floor) return warnings;
        Object.keys(floor.roomTypes).forEach(function (roomTypeId) {
            var room = floor.roomTypes[roomTypeId];
            if (!room.modes.length) warnings.push(room.label + ' 没有模式');
            var modeProbability = room.modes.reduce(function (sum, item) {
                return item.enabled ? sum + Number(item.weight || 0) : sum;
            }, 0);
            if (room.modes.length > 1 && modeProbability !== 100) warnings.push(room.label + ' 的模式概率总和为 ' + modeProbability + '%，建议调到 100%');
            room.modes.forEach(function (item) {
                if (!item.enabled) return;
                if (item.kind === 'wave') {
                    if (!item.waves.length) warnings.push(room.label + ' / ' + item.name + ' 没有波次');
                    item.waves.forEach(function (entry) {
                        var ratio = 0, count = 0;
                        TIERS.forEach(function (tierKey) {
                            if (entry.tiers[tierKey].mode === 'ratio') ratio += Number(entry.tiers[tierKey].value || 0);
                            else count += Number(entry.tiers[tierKey].value || 0);
                        });
                        (entry.fixedMonsters || []).forEach(function (pick) {
                            if (pick.mode === 'ratio') ratio += Number(pick.value || 0);
                            else count += Number(pick.value || 0);
                            if (!pick.monsterKey) warnings.push(room.label + ' / ' + item.name + ' / ' + entry.name + ' 有未选择的指定怪物');
                        });
                        if (ratio > 0 && ratio !== 100) warnings.push(room.label + ' / ' + item.name + ' / ' + entry.name + ' 比例和为 ' + ratio);
                        if (count <= 0 && ratio <= 0) warnings.push(room.label + ' / ' + item.name + ' / ' + entry.name + ' 未配置怪物');
                    });
                }
                if (item.kind === 'spawn_set' && !item.spawnSet.length) warnings.push(room.label + ' / ' + item.name + ' 没有产物项');
                if (item.kind === 'transform_trigger' && (!item.trigger || item.trigger.triggerRadius <= 0 || item.trigger.spawnCount <= 0)) warnings.push(room.label + ' / ' + item.name + ' 触发参数非法');
                if (item.generation.spawnLimitMax > 0 && item.generation.spawnLimitMax < item.generation.spawnLimitMin) warnings.push(room.label + ' / ' + item.name + ' 的出现次数上限小于下限');
                if (item.drops.onEnter.enabled && item.drops.onEnter.spawnMode !== 'none' && !item.drops.onEnter.itemPool && (item.drops.onEnter.spawnMode === 'items' || item.drops.onEnter.spawnMode === 'shop')) warnings.push(room.label + ' / ' + item.name + ' 的进房生成缺少物品池');
                if (item.drops.onEnter.enabled && item.drops.onEnter.spawnMode !== 'none' && item.drops.onEnter.itemCount <= 0 && (item.drops.onEnter.spawnMode === 'items' || item.drops.onEnter.spawnMode === 'shop')) warnings.push(room.label + ' / ' + item.name + ' 的进房生成数量为 0');
                if (item.drops.onClear.enabled && item.drops.onClear.itemDropMode !== 'none' && !item.drops.onClear.itemPool) warnings.push(room.label + ' / ' + item.name + ' 的清房掉落缺少物品池');
                if (item.drops.onClear.enabled && item.drops.onClear.itemDropMode !== 'none' && item.drops.onClear.itemCount <= 0) warnings.push(room.label + ' / ' + item.name + ' 的清房掉落数量为 0');
            });
        });
        return warnings;
    }
    function statsForFloor(floorKey) {
        var floor = state.distributionConfig[floorKey], modes = 0, waves = 0, enabled = 0;
        Object.keys(floor.roomTypes).forEach(function (roomTypeId) {
            var room = floor.roomTypes[roomTypeId];
            modes += room.modes.length;
            if (room.enabled) enabled += 1;
            room.modes.forEach(function (item) { waves += item.kind === 'wave' ? item.waves.length : 0; });
        });
        return { modes: modes, waves: waves, enabled: enabled, warnings: distributionWarnings(floorKey).length };
    }

    function initDom() {
        ['summaryStats', 'distributionPanel', 'openWorkbenchBtn'].forEach(function (id) {
            el[id] = document.getElementById(id);
        });
    }
    function loadDistribution() { try { state.distributionConfig = normalizeShape(JSON.parse(localStorage.getItem(DIST_KEY) || 'null')); } catch (error) { state.distributionConfig = normalizeShape(null); } }
    function saveDistribution() { localStorage.setItem(DIST_KEY, JSON.stringify(state.distributionConfig)); }
    function buildSummary() {
        var floorCount = Object.keys(floorData()).length;
        var modeCount = 0;
        var enterCount = 0;
        var clearCount = 0;
        Object.keys(state.distributionConfig).forEach(function (floorKey) {
            Object.keys(state.distributionConfig[floorKey].roomTypes).forEach(function (roomTypeId) {
                state.distributionConfig[floorKey].roomTypes[roomTypeId].modes.forEach(function (item) {
                    modeCount += 1;
                    if (item.drops.onEnter.enabled) enterCount += 1;
                    if (item.drops.onClear.enabled) clearCount += 1;
                });
            });
        });
        [{ value: floorCount, label: '楼层数' }, { value: modeCount, label: '模式总数' }, { value: enterCount, label: '进房生成模式' }, { value: clearCount, label: '清房奖励模式' }, { value: ROOM_TYPES.length, label: '预设房型' }].forEach(function (item) {
            var card = document.createElement('div'); card.className = 'meta-card'; card.innerHTML = '<strong>' + item.value + '</strong><span>' + item.label + '</span>'; el.summaryStats.appendChild(card);
        });
    }
    function renderWaveCard(entry, index) {
        var monsterOptions = monsterOptionsForFloor(state.distributionUi.floorKey);
        return '<div class="wave-card"><div class="panel-header"><div><strong>' + entry.name + '</strong><div class="mini-meta">第 ' + (index + 1) + ' 波 · 预计总量 ' + entry.enemyCount + '</div></div><button type="button" class="mini-btn" data-dist-action="remove-wave" data-wave-index="' + index + '">删除波次</button></div><div class="field-grid"><label>波次名<input type="text" data-wave-field="name" data-wave-index="' + index + '" value="' + attr(entry.name) + '"></label><label>总怪数量<input type="number" min="0" step="1" data-wave-field="enemyCount" data-wave-index="' + index + '" value="' + entry.enemyCount + '"></label><label>波次备注<input type="text" data-wave-field="note" data-wave-index="' + index + '" value="' + attr(entry.note) + '"></label></div><div class="section-divider"></div>' + TIERS.map(function (tierKey) {
            var slot = entry.tiers[tierKey];
            return '<div class="wave-tier-row"><span class="wave-tier-tag">' + tierKey + '</span><label>分配模式<select data-tier-mode="' + tierKey + '" data-wave-index="' + index + '"><option value="count"' + (slot.mode === 'count' ? ' selected' : '') + '>固定数量</option><option value="ratio"' + (slot.mode === 'ratio' ? ' selected' : '') + '>固定比例</option></select></label><label>' + (slot.mode === 'count' ? '数量' : '比例 %') + '<input type="number" min="0" step="1" data-tier-value="' + tierKey + '" data-wave-index="' + index + '" value="' + slot.value + '"></label></div>';
        }).join('') + '<div class="section-divider"></div><div class="panel-header"><div><strong>额外指定怪物</strong><div class="editor-subtitle">需要指定“小鸡房”这类固定怪时，在这里追加，支持任意多种。</div></div><button type="button" class="mini-btn" data-dist-action="add-fixed-monster" data-wave-index="' + index + '">新增指定怪物</button></div>' + ((entry.fixedMonsters || []).length ? entry.fixedMonsters.map(function (pick, monsterIndex) {
            return '<div class="field-grid four"><label>怪物<select data-fixed-monster-field="monsterKey" data-wave-index="' + index + '" data-fixed-monster-index="' + monsterIndex + '"><option value="">选择怪物</option>' + monsterOptions.map(function (opt) { return '<option value="' + opt.key + '"' + (opt.key === pick.monsterKey ? ' selected' : '') + '>' + opt.label + '</option>'; }).join('') + '</select></label><label>分配模式<select data-fixed-monster-field="mode" data-wave-index="' + index + '" data-fixed-monster-index="' + monsterIndex + '"><option value="count"' + (pick.mode === 'count' ? ' selected' : '') + '>固定数量</option><option value="ratio"' + (pick.mode === 'ratio' ? ' selected' : '') + '>固定比例</option></select></label><label>' + (pick.mode === 'count' ? '数量' : '比例 %') + '<input type="number" min="0" step="1" data-fixed-monster-field="value" data-wave-index="' + index + '" data-fixed-monster-index="' + monsterIndex + '" value="' + pick.value + '"></label><div class="editor-actions" style="align-items:end;"><button type="button" class="mini-btn" data-dist-action="remove-fixed-monster" data-wave-index="' + index + '" data-fixed-monster-index="' + monsterIndex + '">删除指定怪物</button></div></div>';
        }).join('') : '<div class="mini-meta">当前这波还没有指定怪物，默认只按 T1-T4 分配。</div>') + '</div>';
    }
    function renderModeBody(item) {
        if (item.kind === 'wave') return '<div class="section-card"><div class="panel-header"><div><strong>波次配置</strong><div class="editor-subtitle">房型初始模式会按游戏当前规则预填。只有你手动新增空白波次时，才从单波编辑起点继续往下加。</div></div><div class="editor-actions"><button type="button" class="mini-btn primary" data-dist-action="add-wave">新增波次</button><button type="button" class="mini-btn" data-dist-action="copy-prev-wave">复制上一波</button></div></div><div class="wave-list">' + item.waves.map(function (entry, index) { return renderWaveCard(entry, index); }).join('') + '</div></div>';
        if (item.kind === 'spawn_set') return '<div class="section-card"><div class="panel-header"><div><strong>产物集配置</strong><div class="editor-subtitle">适合宝箱房、事件房、奖励点和埋伏点。</div></div><button type="button" class="mini-btn primary" data-dist-action="add-spawn-item">新增产物项</button></div><div class="spawn-list">' + item.spawnSet.map(function (entry, index) { return '<div class="spawn-item"><div class="panel-header"><div><strong>' + spawnLabel(entry.kind) + '</strong><div class="mini-meta">数量 ' + entry.count + ' · 权重 ' + entry.weight + '</div></div><button type="button" class="mini-btn" data-dist-action="remove-spawn-item" data-spawn-index="' + index + '">删除项</button></div><div class="field-grid"><label>类型<select data-spawn-field="kind" data-spawn-index="' + index + '">' + SPAWN_TYPES.map(function (opt) { return '<option value="' + opt.id + '"' + (opt.id === entry.kind ? ' selected' : '') + '>' + opt.label + '</option>'; }).join('') + '</select></label><label>数量<input type="number" min="0" step="1" data-spawn-field="count" data-spawn-index="' + index + '" value="' + entry.count + '"></label><label>权重<input type="number" min="0" step="1" data-spawn-field="weight" data-spawn-index="' + index + '" value="' + entry.weight + '"></label></div><label>备注<input type="text" data-spawn-field="note" data-spawn-index="' + index + '" value="' + attr(entry.note) + '"></label></div>'; }).join('') + '</div></div>';
        return '<div class="section-card"><div class="panel-header"><div><strong>触发转化配置</strong><div class="editor-subtitle">适合假宝箱靠近后变怪，或先静态后转化的遭遇。</div></div></div><div class="field-grid"><label>来源对象<select data-trigger-field="sourceKind">' + SPAWN_TYPES.map(function (opt) { return '<option value="' + opt.id + '"' + (opt.id === item.trigger.sourceKind ? ' selected' : '') + '>' + opt.label + '</option>'; }).join('') + '</select></label><label>触发半径<input type="number" min="1" step="1" data-trigger-field="triggerRadius" value="' + item.trigger.triggerRadius + '"></label><label>转化层级<select data-trigger-field="resultTier">' + TIERS.map(function (tierKey) { return '<option value="' + tierKey + '"' + (tierKey === item.trigger.resultTier ? ' selected' : '') + '>' + tierKey + '</option>'; }).join('') + '</select></label></div><div class="field-grid two"><label>转化数量<input type="number" min="1" step="1" data-trigger-field="spawnCount" value="' + item.trigger.spawnCount + '"></label><label>接续刷怪<select data-trigger-field="followWave"><option value="false"' + (!item.trigger.followWave ? ' selected' : '') + '>不接续</option><option value="true"' + (item.trigger.followWave ? ' selected' : '') + '>接续波次</option></select></label></div><label>触发备注<textarea data-trigger-field="note">' + esc(item.trigger.note) + '</textarea></label></div>';
    }
    function renderModeMeta(item) {
        return '<div class="section-card"><div class="panel-header"><div><strong>进房生成 onEnter</strong><div class="editor-subtitle">给宝箱房、商店、隐藏房这类“进门就有内容”的房间使用。</div></div></div><div class="field-grid four"><label>启用<select data-drop-field="onEnter.enabled"><option value="false"' + (!item.drops.onEnter.enabled ? ' selected' : '') + '>关闭</option><option value="true"' + (item.drops.onEnter.enabled ? ' selected' : '') + '>开启</option></select></label><label>生成类型<select data-drop-field="onEnter.spawnMode"><option value="none"' + (item.drops.onEnter.spawnMode === 'none' ? ' selected' : '') + '>无</option><option value="chest"' + (item.drops.onEnter.spawnMode === 'chest' ? ' selected' : '') + '>宝箱</option><option value="shop"' + (item.drops.onEnter.spawnMode === 'shop' ? ' selected' : '') + '>商店</option><option value="hidden"' + (item.drops.onEnter.spawnMode === 'hidden' ? ' selected' : '') + '>隐藏奖励</option><option value="items"' + (item.drops.onEnter.spawnMode === 'items' ? ' selected' : '') + '>静态物品</option></select></label><label>物品池<input type="text" data-drop-field="onEnter.itemPool" value="' + attr(item.drops.onEnter.itemPool) + '" placeholder="例如: shop_floor1_pool"></label><label>数量<input type="number" min="0" step="1" data-drop-field="onEnter.itemCount" value="' + item.drops.onEnter.itemCount + '"></label></div><div class="field-grid four"><label>金币<input type="number" min="0" step="1" data-drop-field="onEnter.gold" value="' + item.drops.onEnter.gold + '"></label><label>经验<input type="number" min="0" step="1" data-drop-field="onEnter.exp" value="' + item.drops.onEnter.exp + '"></label><label>宝箱类型<select data-drop-field="onEnter.chestType"><option value="reward"' + (item.drops.onEnter.chestType === 'reward' ? ' selected' : '') + '>奖励宝箱</option><option value="hidden"' + (item.drops.onEnter.chestType === 'hidden' ? ' selected' : '') + '>隐藏宝箱</option><option value="boss"' + (item.drops.onEnter.chestType === 'boss' ? ' selected' : '') + '>Boss 宝箱</option></select></label><label>进房备注<input type="text" data-drop-field="onEnter.note" value="' + attr(item.drops.onEnter.note) + '"></label></div></div>' +
            '<div class="section-card"><div class="panel-header"><div><strong>清房生成 onClear</strong><div class="editor-subtitle">给普通战斗房、精英房、Boss 房这种清完再结算的房间使用。</div></div></div><div class="field-grid four"><label>启用<select data-drop-field="onClear.enabled"><option value="false"' + (!item.drops.onClear.enabled ? ' selected' : '') + '>关闭</option><option value="true"' + (item.drops.onClear.enabled ? ' selected' : '') + '>开启</option></select></label><label>金币<input type="number" min="0" step="1" data-drop-field="onClear.gold" value="' + item.drops.onClear.gold + '"></label><label>经验<input type="number" min="0" step="1" data-drop-field="onClear.exp" value="' + item.drops.onClear.exp + '"></label><label>物品掉落<select data-drop-field="onClear.itemDropMode"><option value="none"' + (item.drops.onClear.itemDropMode === 'none' ? ' selected' : '') + '>无</option><option value="chance"' + (item.drops.onClear.itemDropMode === 'chance' ? ' selected' : '') + '>概率掉落</option><option value="guaranteed"' + (item.drops.onClear.itemDropMode === 'guaranteed' ? ' selected' : '') + '>固定掉落</option></select></label></div><div class="field-grid four"><label>物品池<input type="text" data-drop-field="onClear.itemPool" value="' + attr(item.drops.onClear.itemPool) + '" placeholder="例如: elite_reward_pool"></label><label>物品数量<input type="number" min="0" step="1" data-drop-field="onClear.itemCount" value="' + item.drops.onClear.itemCount + '"></label><label>Boss 宝箱<select data-drop-field="onClear.bossChest"><option value="false"' + (!item.drops.onClear.bossChest ? ' selected' : '') + '>关闭</option><option value="true"' + (item.drops.onClear.bossChest ? ' selected' : '') + '>开启</option></select></label><label>宝箱类型<select data-drop-field="onClear.bossChestType"><option value="boss"' + (item.drops.onClear.bossChestType === 'boss' ? ' selected' : '') + '>Boss 宝箱</option><option value="elite"' + (item.drops.onClear.bossChestType === 'elite' ? ' selected' : '') + '>精英宝箱</option><option value="reward"' + (item.drops.onClear.bossChestType === 'reward' ? ' selected' : '') + '>奖励宝箱</option></select></label></div><div class="field-grid two"><label>清房后传送门<select data-drop-field="onClear.spawnPortal"><option value="false"' + (!item.drops.onClear.spawnPortal ? ' selected' : '') + '>关闭</option><option value="true"' + (item.drops.onClear.spawnPortal ? ' selected' : '') + '>开启</option></select></label><label>清房备注<input type="text" data-drop-field="onClear.note" value="' + attr(item.drops.onClear.note) + '"></label></div></div>' +
            '<div class="section-card"><div class="panel-header"><div><strong>房间生成设置</strong><div class="editor-subtitle">控制门锁、出现限制、首层限制和重复出现。</div></div></div><div class="field-grid four"><label>锁门<select data-generation-field="lockDoors"><option value="true"' + (item.generation.lockDoors ? ' selected' : '') + '>锁门</option><option value="false"' + (!item.generation.lockDoors ? ' selected' : '') + '>不锁门</option></select></label><label>需清房结算<select data-generation-field="needClearReward"><option value="true"' + (item.generation.needClearReward ? ' selected' : '') + '>需要</option><option value="false"' + (!item.generation.needClearReward ? ' selected' : '') + '>不需要</option></select></label><label>允许首层出现<select data-generation-field="allowFirstFloor"><option value="true"' + (item.generation.allowFirstFloor ? ' selected' : '') + '>允许</option><option value="false"' + (!item.generation.allowFirstFloor ? ' selected' : '') + '>禁止</option></select></label><label>允许连续出现<select data-generation-field="allowRepeat"><option value="true"' + (item.generation.allowRepeat ? ' selected' : '') + '>允许</option><option value="false"' + (!item.generation.allowRepeat ? ' selected' : '') + '>禁止</option></select></label></div><div class="field-grid three"><label>最小出现次数<input type="number" min="0" step="1" data-generation-field="spawnLimitMin" value="' + item.generation.spawnLimitMin + '"></label><label>最大出现次数<input type="number" min="0" step="1" data-generation-field="spawnLimitMax" value="' + item.generation.spawnLimitMax + '"></label><label>生成备注<input type="text" data-generation-field="generationNote" value="' + attr(item.generation.generationNote) + '"></label></div></div>';
    }
    function renderDistributionDetail(room, item) {
        if (!room || !item) return '<div class="distribution-card"><strong>暂无模式</strong><span>当前房型没有可编辑模式。</span></div>';
        return '<div class="section-card"><div class="panel-header"><div><strong>当前模式</strong><div class="editor-subtitle">房型层只管每层固定数量。模式层这里直接填概率百分比，你自己把同房型下所有模式加到 100% 就行。</div></div><div class="editor-actions"><div class="mini-meta">' + room.label + ' / ' + item.name + '</div><button type="button" class="mini-btn" data-dist-action="remove-mode"' + (room.modes.length <= 1 ? ' disabled' : '') + '>删除当前模式</button></div></div><div class="field-grid four"><label>房型标签<input type="text" data-room-field="label" value="' + attr(room.label) + '"></label><label>每层数量<input type="number" min="0" step="1" data-room-field="count" value="' + room.count + '"></label><label>模式名称<input type="text" data-mode-field="name" value="' + attr(item.name) + '"></label><label>模式概率 %<input type="number" min="0" max="100" step="1" data-mode-field="weight" value="' + item.weight + '"></label></div><div class="field-grid four"><label>房型启用<select data-room-field="enabled"><option value="true"' + (room.enabled ? ' selected' : '') + '>启用</option><option value="false"' + (!room.enabled ? ' selected' : '') + '>停用</option></select></label><label>模式启用<select data-mode-field="enabled"><option value="true"' + (item.enabled ? ' selected' : '') + '>启用</option><option value="false"' + (!item.enabled ? ' selected' : '') + '>停用</option></select></label><label>模式类型<select data-mode-field="kind">' + MODE_KINDS.map(function (opt) { return '<option value="' + opt.id + '"' + (opt.id === item.kind ? ' selected' : '') + '>' + opt.label + '</option>'; }).join('') + '</select></label><label>房间类型<select data-room-field="id">' + ROOM_TYPES.map(function (opt) { return '<option value="' + opt.id + '"' + (opt.id === room.id ? ' selected' : '') + '>' + opt.label + '</option>'; }).join('') + '</select></label></div><div class="field-grid two"><label>房型备注<textarea data-room-field="note">' + esc(room.note) + '</textarea></label><label>模式备注<textarea data-mode-field="note">' + esc(item.note) + '</textarea></label></div></div>' + renderModeMeta(item) + renderModeBody(item);
    }
    function renderDistributionPanel() {
        ensureDistributionSelection();
        var floorKey = state.distributionUi.floorKey, room = currentRoomType(), item = currentMode(), warnings = distributionWarnings(floorKey), stats = statsForFloor(floorKey);
        el.distributionPanel.innerHTML = '<div><h2>房间分布编辑器</h2><p class="lead" style="margin-top:6px; max-width:none;">房型层配置的是每层固定数量。只有同一个房型下面有多个模式时，才需要填模式概率，并把它们手动加到 100%。</p></div><div class="editor-toolbar"><label>楼层<select id="distributionFloorSelect">' + Object.keys(floorData()).map(function (key) { return '<option value="' + key + '"' + (key === floorKey ? ' selected' : '') + '>' + key + ' · ' + floorData()[key].name + '</option>'; }).join('') + '</select></label><div class="editor-actions"><button type="button" class="mini-btn" data-dist-action="copy-room-prev-floor">复制当前房型的上一层设置</button><button type="button" class="mini-btn" data-dist-action="reset-room-type">恢复当前房型默认</button><button type="button" class="mini-btn" data-dist-action="export-json">导出配置文件</button><button type="button" class="mini-btn" data-dist-action="import-json">导入配置文件</button><button type="button" class="mini-btn" data-dist-action="reset-floor">重置当前层</button></div></div><div class="editor-kpi"><div class="distribution-card"><strong>' + stats.modes + '</strong><span>当前层模式数</span></div><div class="distribution-card"><strong>' + stats.waves + '</strong><span>总波次数</span></div><div class="distribution-card"><strong>' + stats.enabled + '/' + ROOM_TYPES.length + '</strong><span>启用房型</span></div><div class="distribution-card"><strong>' + stats.warnings + '</strong><span>待校验项</span></div></div><div class="editor-layout"><div class="section-card"><div class="panel-header"><div><strong>1. 选择房间类型</strong><div class="editor-subtitle">这里配每层固定有几个这种房间，不是概率。需要参考上一层时，只复制当前房型就够了。</div></div></div><div class="room-chip-row">' + ROOM_TYPES.map(function (opt) { var target = currentFloor().roomTypes[opt.id]; return '<button type="button" data-room-type="' + opt.id + '" class="room-chip ' + (opt.id === state.distributionUi.roomTypeId ? 'active' : '') + '"><strong>' + target.label + '</strong><div class="mini-meta">' + (target.enabled ? '启用' : '停用') + ' · 每层 ' + target.count + ' 个</div><div class="mini-meta">' + target.modes.length + ' 个模式</div></button>'; }).join('') + '</div></div><div class="section-card"><div class="panel-header"><div><strong>2. 选择模式</strong><div class="editor-subtitle">每个房型可有多种遭遇模板，比如鸡海房、普通混编房、真假宝箱房。这里直接填概率百分比，你自己把同房型下所有模式加到 100%。</div></div><div class="editor-actions"><button type="button" class="mini-btn primary" data-dist-action="add-mode">新增模式</button><button type="button" class="mini-btn" data-dist-action="copy-mode">复制当前模式</button></div></div><div class="mode-card-row">' + room.modes.map(function (entry) { return '<button type="button" data-mode-id="' + entry.id + '" class="mode-card ' + (entry.id === state.distributionUi.modeId ? 'active' : '') + '"><strong>' + entry.name + '</strong><div class="mini-meta">' + modeLabel(entry.kind) + '</div><div class="mini-meta">' + (entry.enabled ? '启用' : '停用') + ' · 概率 ' + entry.weight + '%</div></button>'; }).join('') + '</div></div>' + renderDistributionDetail(room, item) + '<div class="section-card"><div class="panel-header"><div><strong>校验结果</strong><div class="editor-subtitle">比例总和、空模式、非法触发参数会在这里集中提示。</div></div></div><div class="stack">' + (warnings.length ? warnings.map(function (text) { return '<div class="distribution-card"><strong>检查</strong><span>' + text + '</span></div>'; }).join('') : '<div class="distribution-card"><strong>状态正常</strong><span>当前楼层配置没有明显结构错误。</span></div>') + '</div></div></div><div id="distributionStatus" class="status ' + (warnings.length ? 'warn' : 'ok') + '">' + (warnings.length ? '已发现 ' + warnings.length + ' 个需要复核的配置。' : '当前楼层配置已自动保存到本地。') + '</div>';
        bindDistributionEvents();
    }

    function setDistributionStatus(text, type) {
        var node = document.getElementById('distributionStatus');
        if (!node) return;
        node.textContent = text;
        node.className = 'status' + (type ? ' ' + type : '');
    }
    function refreshDistribution(message, type) { saveDistribution(); renderDistributionPanel(); if (message) setDistributionStatus(message, type || 'ok'); }
    function switchRoomType(nextId) { state.distributionUi.roomTypeId = nextId; state.distributionUi.modeId = ''; ensureDistributionSelection(); renderDistributionPanel(); }
    function switchModeKind(nextKind) {
        var room = currentRoomType(), item = currentMode(), index = room.modes.findIndex(function (entry) { return entry.id === item.id; }), next = mode(nextKind, item.name);
        next.id = item.id; next.weight = item.weight; next.enabled = item.enabled; next.note = item.note; room.modes[index] = next; refreshDistribution();
    }
    function updateRoomField(field, value) {
        var room = currentRoomType();
        if (!room) return;
        if (field === 'id' && value !== room.id) return switchRoomType(value);
        if (field === 'enabled') room.enabled = value === 'true';
        else if (field === 'count') room.count = Number(value || 0);
        else room[field] = value;
        refreshDistribution();
    }
    function updateModeField(field, value) {
        var item = currentMode();
        if (!item) return;
        if (field === 'kind' && value !== item.kind) return switchModeKind(value);
        if (field === 'enabled') item.enabled = value === 'true';
        else if (field === 'weight') item.weight = Math.max(0, Math.min(100, Number(value || 0)));
        else item[field] = value;
        refreshDistribution();
    }
    function updateDropField(field, value) {
        var item = currentMode();
        if (!item) return;
        var parts = field.split('.');
        var target = item.drops;
        if (parts.length === 2) {
            target = item.drops[parts[0]];
            field = parts[1];
        }
        if (field === 'enabled' || field === 'bossChest' || field === 'spawnPortal') target[field] = value === 'true';
        else if (field === 'gold' || field === 'exp' || field === 'itemCount') target[field] = Number(value || 0);
        else target[field] = value;
        refreshDistribution();
    }
    function updateGenerationField(field, value) {
        var item = currentMode();
        if (!item) return;
        if (field === 'lockDoors' || field === 'needClearReward' || field === 'allowFirstFloor' || field === 'allowRepeat' || field === 'spawnPortalAfterClear') item.generation[field] = value === 'true';
        else if (field === 'spawnLimitMin' || field === 'spawnLimitMax') item.generation[field] = Number(value || 0);
        else item.generation[field] = value;
        refreshDistribution();
    }
    function updateWaveField(index, field, value) { var item = currentMode(); if (!item || item.kind !== 'wave' || !item.waves[index]) return; item.waves[index][field] = field === 'enemyCount' ? Number(value || 0) : value; refreshDistribution(); }
    function updateTier(index, tierKey, field, value) { var item = currentMode(); if (!item || item.kind !== 'wave' || !item.waves[index]) return; item.waves[index].tiers[tierKey][field] = field === 'value' ? Number(value || 0) : value; refreshDistribution(); }
    function updateFixedMonster(waveIndex, monsterIndex, field, value) {
        var item = currentMode();
        if (!item || item.kind !== 'wave' || !item.waves[waveIndex] || !item.waves[waveIndex].fixedMonsters[monsterIndex]) return;
        item.waves[waveIndex].fixedMonsters[monsterIndex][field] = field === 'value' ? Number(value || 0) : value;
        refreshDistribution();
    }
    function updateSpawn(index, field, value) { var item = currentMode(); if (!item || item.kind !== 'spawn_set' || !item.spawnSet[index]) return; item.spawnSet[index][field] = (field === 'count' || field === 'weight') ? Number(value || 0) : value; refreshDistribution(); }
    function updateTrigger(field, value) { var item = currentMode(); if (!item || item.kind !== 'transform_trigger') return; item.trigger[field] = (field === 'triggerRadius' || field === 'spawnCount') ? Number(value || 0) : field === 'followWave' ? value === 'true' : value; refreshDistribution(); }
    function addMode() {
        var room = currentRoomType();
        var created = buildRuntimeDefaultMode(state.distributionUi.floorKey, room.id, room.label);
        created.name = room.label + '模式' + (room.modes.length + 1);
        room.modes.push(created);
        state.distributionUi.modeId = created.id;
        refreshDistribution();
    }
    function copyMode() { var room = currentRoomType(), item = clone(currentMode()); item.id = uid('mode'); item.name += ' 副本'; (item.waves || []).forEach(function (entry) { entry.id = uid('wave'); }); (item.spawnSet || []).forEach(function (entry) { entry.id = uid('spawn'); }); room.modes.push(item); state.distributionUi.modeId = item.id; refreshDistribution(); }
    function removeMode() {
        var room = currentRoomType();
        var item = currentMode();
        if (!room || !item || room.modes.length <= 1) return;
        var index = room.modes.findIndex(function (entry) { return entry.id === item.id; });
        if (index < 0) return;
        room.modes.splice(index, 1);
        state.distributionUi.modeId = room.modes[Math.max(0, index - 1)] ? room.modes[Math.max(0, index - 1)].id : '';
        refreshDistribution('当前模式已删除。', 'ok');
    }
    function addWave() { var item = currentMode(); if (!item || item.kind !== 'wave') return; item.waves.push(wave('第' + (item.waves.length + 1) + '波')); refreshDistribution(); }
    function copyPrevWave() { var item = currentMode(); if (!item || item.kind !== 'wave') return; var base = item.waves.length ? clone(item.waves[item.waves.length - 1]) : wave('第1波'); base.id = uid('wave'); base.name = '第' + (item.waves.length + 1) + '波'; item.waves.push(base); refreshDistribution(); }
    function removeWave(index) { var item = currentMode(); if (!item || item.kind !== 'wave' || item.waves.length <= 1) return; item.waves.splice(index, 1); refreshDistribution(); }
    function addFixedMonster(index) {
        var item = currentMode();
        if (!item || item.kind !== 'wave' || !item.waves[index]) return;
        var first = monsterOptionsForFloor(state.distributionUi.floorKey)[0];
        item.waves[index].fixedMonsters.push(monsterEntry(first ? first.key : '', 'count', 1));
        refreshDistribution();
    }
    function removeFixedMonster(waveIndex, monsterIndex) {
        var item = currentMode();
        if (!item || item.kind !== 'wave' || !item.waves[waveIndex] || !item.waves[waveIndex].fixedMonsters[monsterIndex]) return;
        item.waves[waveIndex].fixedMonsters.splice(monsterIndex, 1);
        refreshDistribution();
    }
    function addSpawnItem() { var item = currentMode(); if (!item || item.kind !== 'spawn_set') return; item.spawnSet.push(spawnItem('chest')); refreshDistribution(); }
    function removeSpawnItem(index) { var item = currentMode(); if (!item || item.kind !== 'spawn_set' || item.spawnSet.length <= 1) return; item.spawnSet.splice(index, 1); refreshDistribution(); }
    function copyRoomTypeFromPrevFloor() {
        var keys = Object.keys(floorData()), index = keys.indexOf(state.distributionUi.floorKey);
        var roomTypeId = state.distributionUi.roomTypeId;
        if (index <= 0) return setDistributionStatus('当前已经是第一层，没有可复制的上一层房型配置。', 'warn');
        state.distributionConfig[state.distributionUi.floorKey].roomTypes[roomTypeId] = clone(state.distributionConfig[keys[index - 1]].roomTypes[roomTypeId]);
        state.distributionConfig[state.distributionUi.floorKey].roomTypes[roomTypeId].id = roomTypeId;
        ensureDistributionSelection();
        refreshDistribution('已复制 ' + keys[index - 1] + ' 的“' + roomPreset(roomTypeId).label + '”设置。', 'ok');
    }
    function resetCurrentRoomType() {
        var floorKey = state.distributionUi.floorKey;
        var roomTypeId = state.distributionUi.roomTypeId;
        state.distributionConfig[floorKey].roomTypes[roomTypeId] = roomType(floorKey, roomTypeId);
        ensureDistributionSelection();
        refreshDistribution('已恢复“' + roomPreset(roomTypeId).label + '”的默认设置。', 'ok');
    }
    function exportJson() {
        var text = JSON.stringify(state.distributionConfig, null, 2);
        var blob = new Blob([text], { type: 'application/json;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var link = document.createElement('a');
        var stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
        link.href = url;
        link.download = 'room_distribution_' + stamp + '.json';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(function () { URL.revokeObjectURL(url); }, 0);
        setDistributionStatus('配置已导出为 JSON 文件。', 'ok');
    }
    function importJson() {
        var input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        input.addEventListener('change', function () {
            var file = input.files && input.files[0];
            if (!file) return;
            var reader = new FileReader();
            reader.onload = function () {
                try {
                    state.distributionConfig = normalizeShape(JSON.parse(String(reader.result || '')));
                    ensureDistributionSelection();
                    refreshDistribution('配置文件导入成功。', 'ok');
                } catch (error) {
                    setDistributionStatus('配置文件导入失败：' + error.message, 'error');
                }
            };
            reader.readAsText(file, 'utf-8');
        });
        input.click();
    }
    function resetFloor() { state.distributionConfig[state.distributionUi.floorKey] = floorDistribution(state.distributionUi.floorKey); ensureDistributionSelection(); refreshDistribution('当前楼层分布已重置。', 'ok'); }
    function bindDistributionEvents() {
        document.getElementById('distributionFloorSelect').addEventListener('change', function (event) { state.distributionUi.floorKey = event.target.value; state.distributionUi.roomTypeId = ROOM_TYPES[0].id; state.distributionUi.modeId = ''; renderDistributionPanel(); });
        Array.from(el.distributionPanel.querySelectorAll('[data-room-type]')).forEach(function (node) { node.addEventListener('click', function () { switchRoomType(node.getAttribute('data-room-type')); }); });
        Array.from(el.distributionPanel.querySelectorAll('[data-mode-id]')).forEach(function (node) { node.addEventListener('click', function () { state.distributionUi.modeId = node.getAttribute('data-mode-id'); renderDistributionPanel(); }); });
        Array.from(el.distributionPanel.querySelectorAll('[data-room-field]')).forEach(function (node) { node.addEventListener('change', function () { updateRoomField(node.getAttribute('data-room-field'), node.value); }); });
        Array.from(el.distributionPanel.querySelectorAll('[data-mode-field]')).forEach(function (node) { node.addEventListener('change', function () { updateModeField(node.getAttribute('data-mode-field'), node.value); }); });
        Array.from(el.distributionPanel.querySelectorAll('[data-drop-field]')).forEach(function (node) { node.addEventListener('change', function () { updateDropField(node.getAttribute('data-drop-field'), node.value); }); });
        Array.from(el.distributionPanel.querySelectorAll('[data-generation-field]')).forEach(function (node) { node.addEventListener('change', function () { updateGenerationField(node.getAttribute('data-generation-field'), node.value); }); });
        Array.from(el.distributionPanel.querySelectorAll('[data-wave-field]')).forEach(function (node) { node.addEventListener('change', function () { updateWaveField(Number(node.getAttribute('data-wave-index')), node.getAttribute('data-wave-field'), node.value); }); });
        Array.from(el.distributionPanel.querySelectorAll('[data-tier-mode]')).forEach(function (node) { node.addEventListener('change', function () { updateTier(Number(node.getAttribute('data-wave-index')), node.getAttribute('data-tier-mode'), 'mode', node.value); }); });
        Array.from(el.distributionPanel.querySelectorAll('[data-tier-value]')).forEach(function (node) { node.addEventListener('change', function () { updateTier(Number(node.getAttribute('data-wave-index')), node.getAttribute('data-tier-value'), 'value', node.value); }); });
        Array.from(el.distributionPanel.querySelectorAll('[data-fixed-monster-field]')).forEach(function (node) { node.addEventListener('change', function () { updateFixedMonster(Number(node.getAttribute('data-wave-index')), Number(node.getAttribute('data-fixed-monster-index')), node.getAttribute('data-fixed-monster-field'), node.value); }); });
        Array.from(el.distributionPanel.querySelectorAll('[data-spawn-field]')).forEach(function (node) { node.addEventListener('change', function () { updateSpawn(Number(node.getAttribute('data-spawn-index')), node.getAttribute('data-spawn-field'), node.value); }); });
        Array.from(el.distributionPanel.querySelectorAll('[data-trigger-field]')).forEach(function (node) { node.addEventListener('change', function () { updateTrigger(node.getAttribute('data-trigger-field'), node.value); }); });
        Array.from(el.distributionPanel.querySelectorAll('[data-dist-action]')).forEach(function (node) { node.addEventListener('click', function () {
            var action = node.getAttribute('data-dist-action');
            if (action === 'add-mode') addMode();
            if (action === 'copy-mode') copyMode();
            if (action === 'remove-mode') removeMode();
            if (action === 'add-wave') addWave();
            if (action === 'copy-prev-wave') copyPrevWave();
            if (action === 'remove-wave') removeWave(Number(node.getAttribute('data-wave-index')));
            if (action === 'add-fixed-monster') addFixedMonster(Number(node.getAttribute('data-wave-index')));
            if (action === 'remove-fixed-monster') removeFixedMonster(Number(node.getAttribute('data-wave-index')), Number(node.getAttribute('data-fixed-monster-index')));
            if (action === 'add-spawn-item') addSpawnItem();
            if (action === 'remove-spawn-item') removeSpawnItem(Number(node.getAttribute('data-spawn-index')));
            if (action === 'copy-room-prev-floor') copyRoomTypeFromPrevFloor();
            if (action === 'reset-room-type') resetCurrentRoomType();
            if (action === 'export-json') exportJson();
            if (action === 'import-json') importJson();
            if (action === 'reset-floor') resetFloor();
        }); });
    }
    function bindEvents() {
        el.openWorkbenchBtn.addEventListener('click', function () { window.location.href = './debug_workbench.html'; });
    }
    function init() {
        if (!window.FLOOR_DATA || !window.FLOOR_DATA.floors) { document.body.innerHTML = '<div style="padding:24px;color:#fff;">无法加载 floor-data.js</div>'; return; }
        initDom(); loadDistribution(); ensureDistributionSelection(); buildSummary(); renderDistributionPanel(); bindEvents();
    }
    init();
})();
