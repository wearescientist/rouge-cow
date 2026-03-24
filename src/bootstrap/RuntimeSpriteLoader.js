(function attachRuntimeSpriteLoader(global) {
    'use strict';

    const RuntimeSpriteLoader = {
        getLoadContext() {
            const isLocal = location.hostname === 'localhost' ||
                location.hostname === '127.0.0.1' ||
                location.protocol === 'file:';
            const localPath = './assets/runtime/sprites/';
            const remotePath = 'https://wearescientist.github.io/rouge-cow/assets/runtime/sprites/';
            const basePath = isLocal ? localPath : remotePath;
            const v = isLocal ? `?local=${Date.now()}` : '?v=097';
            return { isLocal, basePath, v };
        },
        pushTask(game, tasks, seen, name, src) {
            if (!name || !src || seen.has(name) || game.sprites.get(name)) return;
            seen.add(name);
            tasks.push({ name, src });
        },
        buildTasks(game, stageKey = 'runCore') {
            const { basePath, v } = this.getLoadContext();
            const tasks = [];
            const seen = new Set();
            const addTask = (name, src) => this.pushTask(game, tasks, seen, name, src);
            if (stageKey === 'runCore') {
                [
                    'player_idle_0','player_idle_1','player_blink_0','player_walk_0','player_walk_1','player_walk_2','player_walk_3','player_dash_0','player_hit_0','player_eat_0','player_eat_1','player_eat_2','player_eat_3'
                ].forEach((name) => addTask(name, `${basePath}player/variants_40x40/${name}_crop_40.png${v}`));

                const runtimeWeaponSprites = global.WEAPON_RUNTIME_SPRITES || {};
                Object.entries(runtimeWeaponSprites).forEach(([name, path]) => addTask(name, `${path}${v}`));

                for (let i = 1; i <= 16; i++) {
                    const id = String(i).padStart(2, '0');
                    addTask(`item_${id}`, `${basePath}items/item_${id}.png${v}`);
                }

                addTask('layer1_floor_mycelium', `${basePath}tiles/floors/layer1_floor_mycelium.png${v}`);
                addTask('layer1_wall', `${basePath}tiles/layer1/wall/layer1_wall_base.png${v}`);
                addTask('layer1_door_closed', `${basePath}tiles/layer1/door/layer1_door_normal_closed.png${v}`);
                addTask('layer1_door_open', `${basePath}tiles/layer1/door/layer1_door_normal_open.png${v}`);
                const cornerMap = {1:'tr',2:'br',3:'bl',4:'tl'};
                for (let i = 1; i <= 4; i++) {
                    addTask(`layer1_corner_${cornerMap[i]}`, `${basePath}tiles/walls/layer1_corner_${cornerMap[i]}.png${v}`);
                }

                const effectNames = global.RuntimeAssetManifest?.preload?.effects || [];
                effectNames.forEach((name) => addTask(name, `${basePath}effects/${name}.png${v}`));

                const uiNames = global.RuntimeAssetManifest?.preload?.ui || [];
                uiNames.forEach((name) => addTask(name, `${basePath}ui/${name}.png${v}`));

                const miscNames = global.RuntimeAssetManifest?.preload?.misc || [];
                miscNames.forEach((name) => addTask(name, `${basePath}misc/${name}.png${v}`));
            } else if (stageKey === 'deferred') {
                ['layer2_floor_greenhouse','layer3_floor_nerve','layer4_floor_furnace','layer5_floor_courtyard','layer6_floor_core','layer7_floor_final']
                    .forEach((name) => addTask(name, `${basePath}tiles/floors/${name}.png${v}`));
                for (let layer = 2; layer <= 6; layer++) {
                    addTask(`layer${layer}_wall`, `${basePath}tiles/layer${layer}/set1/layer${layer}_set1_wall_base.png${v}`);
                    addTask(`layer${layer}_door_closed`, `${basePath}tiles/layer${layer}/set1/layer${layer}_set1_door_normal_closed.png${v}`);
                    addTask(`layer${layer}_door_open`, `${basePath}tiles/layer${layer}/set1/layer${layer}_set1_door_normal_open.png${v}`);
                }
                const cornerMap = {1:'tr',2:'br',3:'bl',4:'tl'};
                for (let layer = 2; layer <= 6; layer++) {
                    for (let i = 1; i <= 4; i++) {
                        addTask(`layer${layer}_corner_${cornerMap[i]}`, `${basePath}tiles/walls/layer${layer}_corner_${cornerMap[i]}.png${v}`);
                    }
                }
            }
            return tasks;
        }
    };

    global.RuntimeSpriteLoader = RuntimeSpriteLoader;
})(window);
