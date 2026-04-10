(function attachRuntimeSpriteLoader(global) {
    'use strict';

    const RuntimeSpriteLoader = {
        getLoadContext() {
            const assetBase = global.RuntimeAssetBase || null;
            const basePath = assetBase?.spriteBase || new URL('./assets/runtime/sprites/', global.document?.baseURI || global.location?.href || 'http://localhost/').href;
            const v = `?local=${Date.now()}`;
            return { isLocal: true, strictLocal: true, basePath, v };
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

                addTask('layer1_floor_mycelium', `${basePath}tiles/floors/layer1_floor_mycelium.png${v}`);

                const effectNames = global.RuntimeAssetManifest?.preload?.effects || [];
                effectNames.forEach((name) => addTask(name, `${basePath}effects/${name}.png${v}`));

                const uiNames = global.RuntimeAssetManifest?.preload?.ui || [];
                uiNames.forEach((name) => addTask(name, `${basePath}ui/${name}.png${v}`));

                const miscNames = global.RuntimeAssetManifest?.preload?.misc || [];
                miscNames.forEach((name) => addTask(name, `${basePath}misc/${name}.png${v}`));
            } else if (stageKey === 'deferred') {
                ['layer2_floor_greenhouse','layer3_floor_nerve','layer4_floor_furnace','layer5_floor_courtyard','layer6_floor_core','layer7_floor_final']
                    .forEach((name) => addTask(name, `${basePath}tiles/floors/${name}.png${v}`));
            }
            return tasks;
        }
    };

    global.RuntimeSpriteLoader = RuntimeSpriteLoader;
})(window);
