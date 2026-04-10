(function attachHiddenRoomProgress(global) {
    'use strict';

    const HiddenRoomProgress = {
        recompute(state) {
            let completed = 0;
            let witnessed = 0;
            let allSolved = true;
            for (let floor = 1; floor <= 6; floor++) {
                const item = state.floors[floor];
                if (item.completed) completed += 1;
                else allSolved = false;
                if (item.witnessed) witnessed += 1;
            }
            state.totalCompletedCount = completed;
            state.totalWitnessedCount = witnessed;
            state.allSolved = allSolved;
            state.trueEndingUnlocked = witnessed >= 6;
            return state;
        },

        ensureFloorState(state, floor, createFloorState, normalizePuzzleState) {
            if (!state.floors[floor]) state.floors[floor] = createFloorState();
            const item = state.floors[floor];
            item.witnessed = !!item.witnessed;
            item.totemCollected = !!item.totemCollected;
            item.phase = typeof item.phase === 'string' ? item.phase : (item.completed ? 'awakened' : 'idle');
            item.crystalState = typeof item.crystalState === 'string'
                ? item.crystalState
                : (item.witnessed ? 'played' : (item.completed ? 'ready' : 'dormant'));
            item.solveAnimTimer = Number.isFinite(item.solveAnimTimer) ? item.solveAnimTimer : 0;
            item.puzzleState = normalizePuzzleState(floor, item.puzzleState);
            return item;
        },

        createDefaultState(version, createFloorState) {
            return {
                version,
                runSeed: '',
                floors: {
                    1: createFloorState(),
                    2: createFloorState(),
                    3: createFloorState(),
                    4: createFloorState(),
                    5: createFloorState(),
                    6: createFloorState()
                },
                totalCompletedCount: 0,
                totalWitnessedCount: 0,
                allSolved: false,
                trueEndingUnlocked: false
            };
        },

        saveState(game, storageKey, recompute, getFloor) {
            if (!game || !game.hiddenRooms) return;
            recompute(game.hiddenRooms);
            if (game.hiddenRooms.trueEndingUnlocked && global.trueEndingSystem?.unlock) {
                global.trueEndingSystem.unlock();
            }
            const room = game?.curRoom;
            if (room?.type === 'hidden') {
                const floor = getFloor(game, room);
                room.hiddenPuzzleState = game.hiddenRooms?.floors?.[floor]?.puzzleState || room.hiddenPuzzleState;
            }
            try {
                localStorage.setItem(storageKey, JSON.stringify(game.hiddenRooms));
            } catch (err) {
                console.warn('[HiddenRoomSystem] failed to save local progress', err);
            }
        }
    };

    global.HiddenRoomProgress = HiddenRoomProgress;
})(window);
