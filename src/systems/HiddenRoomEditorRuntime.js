(function attachHiddenRoomEditorRuntime(global) {
    'use strict';

    const api = {
        patchGamePrototype(Game, deps) {
            if (typeof Game === 'undefined' || !Game?.prototype) return;
            Game.prototype.toggleHiddenLayoutEditor = function patchedToggleHiddenLayoutEditor() {
                deps.installHiddenLayoutEditorInput();
                const state = deps.getHiddenLayoutEditorState();
                state.active = !state.active;
                if (state.active && this.curRoom?.type === 'hidden') {
                    this.ensureHiddenRoomSetup(this.curRoom);
                    const selected = deps.getSelectedHiddenLayoutTarget(this.curRoom);
                    state.selectedId = selected?.id || null;
                } else {
                    state.dragging = null;
                }
                this.damageNumbers?.spawn(this.player?.cx || 0, (this.player?.cy || 0) - 40, state.active ? '布局编辑 ON' : '布局编辑 OFF', { color: state.active ? '#6f6' : '#aaa', size: 14, life: 1.1 });
                this.debugPanel?.refreshHiddenRoomEditorTools?.();
                return state.active;
            };

            Game.prototype.saveHiddenRoomLayout = function patchedSaveHiddenRoomLayout() {
                const room = deps.getActiveHiddenLayoutRoom(this);
                if (!room) return false;
                deps.captureHiddenLayoutOverrides(room, room.hiddenRoomFloor || deps.getFloor(this, room));
                this.damageNumbers?.spawn(this.player?.cx || 0, (this.player?.cy || 0) - 40, '隐藏房草稿已保存', { color: '#8ff', size: 14, life: 1.2 });
                this.debugPanel?.refreshHiddenRoomEditorTools?.();
                return true;
            };

            Game.prototype.resetHiddenRoomLayout = function patchedResetHiddenRoomLayout() {
                const room = deps.getActiveHiddenLayoutRoom(this);
                if (!room) return false;
                const floor = room.hiddenRoomFloor || deps.getFloor(this, room);
                deps.clearHiddenLayoutOverridesForFloor(floor);
                room.hiddenRuntimeVersion = null;
                room.hiddenMode = null;
                this.ensureHiddenRoomSetup(room);
                this.damageNumbers?.spawn(this.player?.cx || 0, (this.player?.cy || 0) - 40, '已恢复正式布局', { color: '#ffd27f', size: 14, life: 1.2 });
                this.debugPanel?.refreshHiddenRoomEditorTools?.();
                return true;
            };

            Game.prototype.cycleHiddenLayoutTarget = function patchedCycleHiddenLayoutTarget(dir) {
                const room = deps.getActiveHiddenLayoutRoom(this);
                if (!room) return null;
                const selected = deps.moveHiddenLayoutSelection(room, dir >= 0 ? 1 : -1);
                this.debugPanel?.refreshHiddenRoomEditorTools?.();
                return selected;
            };

            Game.prototype.scaleHiddenLayoutTarget = function patchedScaleHiddenLayoutTarget(delta) {
                const room = deps.getActiveHiddenLayoutRoom(this);
                if (!room) return null;
                const selected = deps.getSelectedHiddenLayoutTarget(room);
                if (!selected) return null;
                selected.obj.scale = deps.clamp((selected.obj.scale || 1) + delta, 0.2, 4);
                this.debugPanel?.refreshHiddenRoomEditorTools?.();
                return selected.obj.scale;
            };

            Game.prototype.rotateHiddenLayoutTarget = function patchedRotateHiddenLayoutTarget(deg) {
                const room = deps.getActiveHiddenLayoutRoom(this);
                if (!room) return null;
                const selected = deps.getSelectedHiddenLayoutTarget(room);
                if (!selected) return null;
                selected.obj.rotation = (selected.obj.rotation || 0) + (deg * Math.PI / 180);
                this.debugPanel?.refreshHiddenRoomEditorTools?.();
                return selected.obj.rotation;
            };

            Game.prototype.nudgeHiddenLayoutLayer = function patchedNudgeHiddenLayoutLayer(delta) {
                const room = deps.getActiveHiddenLayoutRoom(this);
                if (!room) return null;
                const selected = deps.getSelectedHiddenLayoutTarget(room);
                if (!selected) return null;
                selected.obj.editorLayer = Math.round((selected.obj.editorLayer || 0) + delta);
                this.debugPanel?.refreshHiddenRoomEditorTools?.();
                return selected.obj.editorLayer;
            };

            Game.prototype.nudgeHiddenLayoutAlpha = function patchedNudgeHiddenLayoutAlpha(delta) {
                const room = deps.getActiveHiddenLayoutRoom(this);
                if (!room) return null;
                const selected = deps.getSelectedHiddenLayoutTarget(room);
                if (!selected) return null;
                const current = Number.isFinite(selected.obj.alpha) ? selected.obj.alpha : 1;
                selected.obj.alpha = deps.clamp(current + (delta || 0), 0.05, 1.5);
                this.debugPanel?.refreshHiddenRoomEditorTools?.();
                return selected.obj.alpha;
            };

            Game.prototype.moveHiddenLayoutTarget = function patchedMoveHiddenLayoutTarget(dx, dy) {
                const room = deps.getActiveHiddenLayoutRoom(this);
                if (!room) return null;
                const selected = deps.getSelectedHiddenLayoutTarget(room);
                if (!selected) return null;
                deps.nudgeHiddenLayoutTarget(selected, dx || 0, dy || 0);
                this.debugPanel?.refreshHiddenRoomEditorTools?.();
                return { x: selected.obj.x, y: selected.obj.y };
            };

            Game.prototype.resizeHiddenLayoutTarget = function patchedResizeHiddenLayoutTarget(dw, dh) {
                const room = deps.getActiveHiddenLayoutRoom(this);
                if (!room) return null;
                const selected = deps.getSelectedHiddenLayoutTarget(room);
                if (!selected) return null;
                if (!deps.resizeHiddenLayoutTargetObject(selected.obj, dw || 0, dh || 0)) return null;
                this.debugPanel?.refreshHiddenRoomEditorTools?.();
                return {
                    w: Number.isFinite(selected.obj.w) ? selected.obj.w : (Number.isFinite(selected.obj.drawW) ? selected.obj.drawW : null),
                    h: Number.isFinite(selected.obj.h) ? selected.obj.h : (Number.isFinite(selected.obj.drawH) ? selected.obj.drawH : null),
                    radius: Number.isFinite(selected.obj.radius) ? selected.obj.radius : null,
                    scaleX: Number.isFinite(selected.obj.scaleX) ? selected.obj.scaleX : 1,
                    scaleY: Number.isFinite(selected.obj.scaleY) ? selected.obj.scaleY : 1
                };
            };
        },

        ensureGameMethods(Game, deps) {
            if (typeof Game === 'undefined' || !Game?.prototype) return;

            if (typeof Game.prototype.importHiddenLayoutAssets !== 'function') {
                Game.prototype.importHiddenLayoutAssets = async function patchedImportHiddenLayoutAssets(options = {}) {
                    const picker = document.createElement('input');
                    picker.type = 'file';
                    picker.accept = 'image/*';
                    picker.multiple = true;
                    picker.style.position = 'fixed';
                    picker.style.left = '-9999px';
                    picker.style.top = '-9999px';
                    picker.style.opacity = '0';
                    if (options.directory) {
                        picker.setAttribute('webkitdirectory', '');
                        picker.setAttribute('directory', '');
                    }
                    document.body.appendChild(picker);
                    const loaded = await new Promise((resolve) => {
                        let resolved = false;
                        const finish = async () => {
                            if (resolved) return;
                            resolved = true;
                            const assets = await deps.importHiddenLayoutAssets(picker.files);
                            picker.remove();
                            resolve(assets);
                        };
                        picker.addEventListener('change', finish, { once: true });
                        picker.addEventListener('cancel', () => {
                            if (resolved) return;
                            resolved = true;
                            picker.remove();
                            resolve([]);
                        }, { once: true });
                        picker.value = '';
                        picker.click();
                        setTimeout(() => { if (!resolved) { try { picker.focus(); } catch (_) {} } }, 0);
                    });
                    if (!loaded.length) {
                        this.damageNumbers?.spawn(this.player?.cx || 0, (this.player?.cy || 0) - 40, options.directory ? '目录导入未选择任何图片' : '图片导入未选择任何文件', { color: '#aaa', size: 14, life: 1.2 });
                    } else {
                        this.damageNumbers?.spawn(this.player?.cx || 0, (this.player?.cy || 0) - 40, `已导入 ${loaded.length} 张素材`, { color: '#8ff', size: 14, life: 1.2 });
                    }
                    this.debugPanel?.refreshHiddenRoomEditorTools?.();
                    return loaded;
                };
            }

            if (typeof Game.prototype.placeHiddenDecorAsset !== 'function') {
                Game.prototype.placeHiddenDecorAsset = function patchedPlaceHiddenDecorAsset(assetId, count = 1) {
                    const room = deps.getActiveHiddenLayoutRoom(this);
                    if (!room) {
                        const action = { type: 'place_failed', reason: 'not_hidden_room', currentRoomType: this.curRoom?.type || null, assetId, count: Number(count) || 1, at: Date.now() };
                        deps.setHiddenLayoutLastAction(action);
                        console.warn('[HiddenRoomLayoutEditor] place failed', action);
                        this.damageNumbers?.spawn(this.player?.cx || 0, (this.player?.cy || 0) - 40, '当前不在隐藏房，无法放置素材', { color: '#f88', size: 14, life: 1.2 });
                        this.debugPanel?.refreshHiddenRoomEditorTools?.();
                        return 0;
                    }
                    const floor = room.hiddenRoomFloor || deps.getFloor(this, room);
                    const asset = deps.getHiddenLayoutAssetLibrary().find((item) => item.id === assetId);
                    if (!asset) {
                        const action = { type: 'place_failed', reason: 'asset_missing', floor, assetId, count: Number(count) || 1, at: Date.now() };
                        deps.setHiddenLayoutLastAction(action);
                        console.warn('[HiddenRoomLayoutEditor] place failed', action);
                        this.damageNumbers?.spawn(this.player?.cx || 0, (this.player?.cy || 0) - 40, '素材不存在或尚未加载完成', { color: '#f88', size: 14, life: 1.2 });
                        this.debugPanel?.refreshHiddenRoomEditorTools?.();
                        return 0;
                    }
                    const total = Math.max(1, Math.min(24, Number(count) || 1));
                    let created = 0;
                    let lastDecor = null;
                    const cameraAnchor = { x: Number.isFinite(this.camera?.x) ? this.camera.x : deps.roomCenterX(room), y: Number.isFinite(this.camera?.y) ? this.camera.y : deps.roomCenterY(room) };
                    for (let i = 0; i < total; i++) {
                        const decor = deps.createHiddenDecorInstanceFromAsset(asset, floor, room, cameraAnchor);
                        if (!decor) continue;
                        room.hiddenDecor = room.hiddenDecor || [];
                        room.hiddenDecor.push(global.clone ? global.clone(decor) : JSON.parse(JSON.stringify(decor)));
                        lastDecor = decor;
                        created += 1;
                    }
                    if (lastDecor) {
                        const state = deps.getHiddenLayoutEditorState();
                        state.selectedId = lastDecor.layoutId;
                        state.hoverId = lastDecor.layoutId;
                    }
                    const action = { type: created > 0 ? 'place_success' : 'place_failed', reason: created > 0 ? 'ok' : 'create_failed', floor, assetId: asset.id, assetName: asset.name, countRequested: total, countCreated: created, x: Math.round(cameraAnchor.x), y: Math.round(cameraAnchor.y), lastLayoutId: lastDecor?.layoutId || null, at: Date.now() };
                    deps.setHiddenLayoutLastAction(action);
                    console.info('[HiddenRoomLayoutEditor] place asset', action);
                    this.damageNumbers?.spawn(this.player?.cx || deps.roomCenterX(room), (this.player?.cy || deps.roomCenterY(room)) - 40, created > 0 ? `已放置 ${created} 个 ${asset.name}` : `放置失败: ${asset.name}`, { color: created > 0 ? '#8ff' : '#f88', size: 14, life: 1.2 });
                    this.debugPanel?.refreshHiddenRoomEditorTools?.();
                    return created;
                };
            }

            if (typeof Game.prototype.deleteSelectedHiddenDecor !== 'function') {
                Game.prototype.deleteSelectedHiddenDecor = function patchedDeleteSelectedHiddenDecor() {
                    const room = deps.getActiveHiddenLayoutRoom(this);
                    if (!room) return false;
                    const selected = deps.getHiddenLayoutEditorState().selectedId ? deps.getActiveHiddenLayoutRoom(this) && deps.getHiddenLayoutEditorState() : null;
                    const target = deps.getSelectedHiddenLayoutTarget(room);
                    if (!target || target.kind !== 'custom_decor') return false;
                    const floor = room.hiddenRoomFloor || deps.getFloor(this, room);
                    room.hiddenDecor = (room.hiddenDecor || []).filter((item) => item.layoutId !== target.id);
                    deps.removeHiddenDecorInstance(floor, target.id);
                    deps.getHiddenLayoutEditorState().selectedId = null;
                    this.debugPanel?.refreshHiddenRoomEditorTools?.();
                    return true;
                };
            }

            if (typeof Game.prototype.clearHiddenPlacedDecor !== 'function') {
                Game.prototype.clearHiddenPlacedDecor = function patchedClearHiddenPlacedDecor() {
                    const room = deps.getActiveHiddenLayoutRoom(this);
                    if (!room) return false;
                    const floor = room.hiddenRoomFloor || deps.getFloor(this, room);
                    room.hiddenDecor = (room.hiddenDecor || []).filter((item) => item.kind !== 'custom_decor');
                    deps.clearHiddenDecorInstancesForFloor(floor);
                    const floorStore = deps.getFloorLayoutOverrides(floor);
                    Object.keys(floorStore).forEach((key) => { if (/^custom_decor_/.test(key)) delete floorStore[key]; });
                    deps.saveHiddenLayoutStore();
                    deps.getHiddenLayoutEditorState().selectedId = null;
                    this.debugPanel?.refreshHiddenRoomEditorTools?.();
                    return true;
                };
            }
        }
    };

    global.HiddenRoomEditorRuntime = api;
})(window);
