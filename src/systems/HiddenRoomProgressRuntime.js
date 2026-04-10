(function attachHiddenRoomProgressRuntime(global) {
    'use strict';

    const api = {
        createApi(deps) {
            const {
                STORAGE_KEY,
                HIDDEN_ROOM_VERSION,
                HIDDEN_ROOM_PROFILES,
                createFloorState,
                clone,
                hashString,
                seededRng,
                shuffleWithRng,
                seededPermutation
            } = deps;

            function recompute(state) {
                return global.HiddenRoomProgress.recompute(state);
            }

            function ensureFloorState(state, floor) {
                return global.HiddenRoomProgress.ensureFloorState(state, floor, createFloorState, normalizePuzzleState);
            }

            function saveState(game) {
                return global.HiddenRoomProgress.saveState(game, STORAGE_KEY, recompute, getFloor);
            }

            function getProfile(floor) {
                const fallback = HIDDEN_ROOM_PROFILES[floor] || HIDDEN_ROOM_PROFILES[1];
                const storyProfile = global.StoryDialogueData?.hiddenRooms?.[floor];
                if (!storyProfile) return fallback;
                return {
                    ...fallback,
                    noteSpeaker: storyProfile.noteSpeaker || fallback.noteSpeaker,
                    note: storyProfile.note || fallback.note,
                    lines: Array.isArray(storyProfile.lines) ? storyProfile.lines.slice() : undefined
                };
            }

            function getFloor(game, room) {
                return Math.max(1, Number(room?.floor || game?.currentFloor || 1));
            }

            function getFloorProgress(game, floor) {
                const state = ensureState(game);
                const progress = ensureFloorState(state, floor);
                const room = game?.curRoom;
                if (room?.type === 'hidden' && getFloor(game, room) === floor) {
                    room.hiddenPuzzleState = progress.puzzleState;
                }
                return progress;
            }

            function seedFloor3PuzzleFromRun(game, progress) {
                if (!progress || progress.completed) return;
                const runSeed = String(game?.runSeed || game?.currentMapSeed || 'seed');
                if (progress.puzzleState && progress.puzzleState._seedKey === runSeed) return;
                progress.puzzleState = normalizePuzzleState(3, Object.assign({}, progress.puzzleState || {}, {
                    sequence: seededPermutation(6, runSeed + '-hidden-floor3-seq'),
                    stage: 'preview',
                    previewRound: 0,
                    previewStep: 0,
                    previewLit: false,
                    previewTimer: 0.52,
                    activePreviewIndex: -1,
                    inputIndex: 0,
                    lastTriggeredNode: -1,
                    replayTimer: 0.0,
                    cooldown: 0,
                    hoveredIndex: -1,
                    _seedKey: runSeed
                }));
            }

            function createDefaultState() {
                return global.HiddenRoomProgress.createDefaultState(HIDDEN_ROOM_VERSION, createFloorState);
            }

            function createPuzzleState(floor) {
                switch (floor) {
                    case 1:
                        return { templateMask: deps.OVR_FLOOR1_TEMPLATES ? deps.OVR_FLOOR1_TEMPLATES[0].slice() : [false,false,false,false,false,false,false,false], candleStates: deps.OVR_FLOOR1_TEMPLATES ? deps.OVR_FLOOR1_TEMPLATES[0].slice() : [false,false,false,false,false,false,false,false], _seedKey: '' };
                    case 2:
                        return { demoSeen: false, killedIds: [], targetCount: 3, killedCount: 0, _seedKey: '' };
                    case 3:
                        return { sequence: [2, 5, 1, 4, 0, 3], stage: 'preview', previewRound: 0, previewStep: 0, previewLit: false, previewTimer: 0.45, activePreviewIndex: -1, inputIndex: 0, lastTriggeredNode: -1, replayTimer: 0, cooldown: 0, hoveredIndex: -1 };
                    case 4:
                        return { sequence: [0, 1, 2], round: 0, phase: 'pre_countdown', phaseTimer: 2.4, activeVariant: 0, litNodeIds: [], roundHits: 0, wrongAttempts: 0, _seedKey: '' };
                    case 5:
                        return { blocked: [false, false, false], sealedCount: 0 };
                    case 6:
                        return { breadTaken: false, moneyTaken: false, bookRead: false };
                    default:
                        return {};
                }
            }

            function normalizePuzzleState(floor, puzzleState) {
                const base = createPuzzleState(floor);
                const next = Object.assign({}, base, puzzleState || {});
                if (floor === 1) {
                    next.templateMask = Array.isArray(next.templateMask) ? next.templateMask.slice(0, 8).map(Boolean) : base.templateMask.slice();
                    while (next.templateMask.length < 8) next.templateMask.push(false);
                    next.candleStates = Array.isArray(next.candleStates) ? next.candleStates.slice(0, 8).map(Boolean) : base.candleStates.slice();
                    while (next.candleStates.length < 8) next.candleStates.push(false);
                    next._seedKey = typeof next._seedKey === 'string' ? next._seedKey : '';
                }
                if (floor === 2) {
                    next.demoSeen = !!next.demoSeen;
                    next.killedIds = Array.isArray(next.killedIds) ? next.killedIds.slice() : [];
                    next.targetCount = 3;
                    next.killedCount = Number.isFinite(next.killedCount) ? next.killedCount : next.killedIds.length;
                    next._seedKey = typeof next._seedKey === 'string' ? next._seedKey : '';
                }
                if (floor === 3) {
                    next.sequence = Array.isArray(next.sequence) && next.sequence.length === 6 ? next.sequence.slice() : base.sequence.slice();
                    next.stage = typeof next.stage === 'string' ? next.stage : 'preview';
                    next.previewRound = Number.isFinite(next.previewRound) ? next.previewRound : 0;
                    next.previewStep = Number.isFinite(next.previewStep) ? next.previewStep : 0;
                    next.previewLit = !!next.previewLit;
                    next.previewTimer = Number.isFinite(next.previewTimer) ? next.previewTimer : 0.45;
                    next.activePreviewIndex = Number.isFinite(next.activePreviewIndex) ? next.activePreviewIndex : -1;
                    next.inputIndex = Number.isFinite(next.inputIndex) ? next.inputIndex : 0;
                    next.lastTriggeredNode = Number.isFinite(next.lastTriggeredNode) ? next.lastTriggeredNode : -1;
                    next.replayTimer = Number.isFinite(next.replayTimer) ? next.replayTimer : 0;
                    next.cooldown = Number.isFinite(next.cooldown) ? next.cooldown : 0;
                    next.hoveredIndex = Number.isFinite(next.hoveredIndex) ? next.hoveredIndex : -1;
                }
                if (floor === 4) {
                    next.sequence = Array.isArray(next.sequence) && next.sequence.length === 3 ? next.sequence.slice(0, 3) : base.sequence.slice();
                    next.round = Number.isFinite(next.round) ? next.round : 0;
                    next.phase = typeof next.phase === 'string' ? next.phase : 'pre_countdown';
                    next.phaseTimer = Number.isFinite(next.phaseTimer) ? next.phaseTimer : 2.4;
                    next.activeVariant = Number.isFinite(next.activeVariant) ? next.activeVariant : next.sequence[0];
                    next.litNodeIds = Array.isArray(next.litNodeIds) ? next.litNodeIds.slice() : [];
                    next.roundHits = Number.isFinite(next.roundHits) ? next.roundHits : 0;
                    next.wrongAttempts = Number.isFinite(next.wrongAttempts) ? next.wrongAttempts : 0;
                    next._seedKey = typeof next._seedKey === 'string' ? next._seedKey : '';
                }
                if (floor === 5) {
                    next.blocked = Array.isArray(next.blocked) ? next.blocked.slice(0, 3).map(Boolean) : base.blocked.slice();
                    while (next.blocked.length < 3) next.blocked.push(false);
                    next.sealedCount = Number.isFinite(next.sealedCount) ? next.sealedCount : next.blocked.filter(Boolean).length;
                }
                if (floor === 6) {
                    next.breadTaken = !!next.breadTaken;
                    next.moneyTaken = !!next.moneyTaken;
                    next.bookRead = !!next.bookRead;
                }
                return next;
            }

            function seedFloor1PuzzleFromRun(game, progress) {
                if (!progress || progress.completed) return;
                const runSeed = String(game?.runSeed || game?.currentMapSeed || 'seed');
                if (progress.puzzleState && progress.puzzleState._seedKey === runSeed) return;
                const templates = deps.OVR_FLOOR1_TEMPLATES || [[false,false,false,false,false,false,false,false]];
                const template = clone(templates[hashString(runSeed + '-hidden-floor1-template') % templates.length]);
                const rng = seededRng(runSeed + '-hidden-floor1-candles');
                const flipOrder = shuffleWithRng([0,1,2,3,4,5,6,7], rng);
                const candleStates = template.slice();
                const mismatchCount = 2 + (hashString(runSeed + '-hidden-floor1-mismatch') % 2);
                for (let i = 0; i < mismatchCount; i++) candleStates[flipOrder[i]] = !candleStates[flipOrder[i]];
                progress.puzzleState = normalizePuzzleState(1, { templateMask: template, candleStates, _seedKey: runSeed });
            }

            function seedFloor4PuzzleFromRun(game, progress) {
                if (!progress || progress.completed) return;
                const runSeed = String(game?.runSeed || game?.currentMapSeed || 'seed');
                if (progress.puzzleState && progress.puzzleState._seedKey === runSeed) return;
                const sequence = seededPermutation(3, runSeed + '-hidden-floor4-seq');
                progress.puzzleState = normalizePuzzleState(4, { sequence, round: 0, phase: 'pre_countdown', phaseTimer: 2.4, activeVariant: sequence[0], litNodeIds: [], roundHits: 0, wrongAttempts: 0, _seedKey: runSeed });
            }

            function ensureState(game) {
                const currentRunSeed = String(game?.runSeed || game?.currentMapSeed || 'seed');
                if (game.hiddenRooms && game.hiddenRooms.runSeed === currentRunSeed) {
                    for (let floor = 1; floor <= 6; floor++) ensureFloorState(game.hiddenRooms, floor);
                    return recompute(game.hiddenRooms);
                }
                let loaded = null;
                try {
                    const raw = localStorage.getItem(STORAGE_KEY);
                    if (raw) loaded = JSON.parse(raw);
                } catch (err) {
                    console.warn('[HiddenRoomSystem] failed to load local progress', err);
                }
                const shouldReuse = loaded && typeof loaded === 'object' && loaded.runSeed === currentRunSeed;
                const state = shouldReuse ? loaded : createDefaultState();
                if (!state.floors) state.floors = createDefaultState().floors;
                state.version = HIDDEN_ROOM_VERSION;
                state.runSeed = currentRunSeed;
                for (let floor = 1; floor <= 6; floor++) ensureFloorState(state, floor);
                game.hiddenRooms = recompute(state);
                return game.hiddenRooms;
            }

            return {
                recompute,
                ensureFloorState,
                saveState,
                getProfile,
                getFloor,
                getFloorProgress,
                seedFloor3PuzzleFromRun,
                createDefaultState,
                createPuzzleState,
                normalizePuzzleState,
                seedFloor1PuzzleFromRun,
                seedFloor4PuzzleFromRun,
                ensureState
            };
        }
    };

    global.HiddenRoomProgressRuntime = api;
})(window);
