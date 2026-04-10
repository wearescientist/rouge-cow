(function attachHiddenRoomRenderRuntime(global) {
    'use strict';

    const api = {
        patchRoomDraw(Room, deps) {
            if (typeof Room === 'undefined' || !Room?.prototype || Room.prototype.__hiddenRoomDrawPatched) return;
            const original = Room.prototype.draw;
            if (typeof original !== 'function') return;
            Room.prototype.draw = function patchedHiddenRoomBaseDraw(ctx, camera, sprites) {
                const result = original.apply(this, arguments);
                const game = deps.global.game;
                if (!game || this.type !== 'hidden') return result;
                game.ensureHiddenRoomSetup?.(this);
                deps.drawHiddenWorldLayer(ctx, camera, this, game, this.hiddenRenderTime || 0);
                return result;
            };
            Room.prototype.__hiddenRoomDrawPatched = true;
        },

        patchGameDraw(Game, deps) {
            if (typeof Game === 'undefined' || !Game?.prototype) return;
            const originalDraw = Game.prototype.draw;
            if (typeof originalDraw !== 'function' || originalDraw.__hiddenRoomRenderWrapped) return;
            const wrapped = function patchedGameDraw() {
                const result = originalDraw.apply(this, arguments);
                const room = this.curRoom;
                if (!room || room.type !== 'hidden' || !this.ctx || !this.camera) return result;
                this.ensureHiddenRoomSetup(room);
                const floor = deps.getFloor(this, room);
                const progress = deps.getFloorProgress(this, floor);
                const time = room.hiddenRenderTime || 0;
                this.ctx.save();
                deps.drawVignette(this.ctx, room, this, time);
                if (floor === 4) deps.drawFloor4Overlay(this.ctx, room, this, time);
                deps.drawHiddenLayoutEditorOverlay(this.ctx, this.camera, room, this);
                deps.drawHiddenInteractCue(this.ctx, this.camera, this, room);
                deps.drawBanner(this.ctx, room, progress, time);
                this.ctx.restore();
                return result;
            };
            wrapped.__hiddenRoomRenderWrapped = true;
            Game.prototype.draw = wrapped;
        }
    };

    global.HiddenRoomRenderRuntime = api;
})(window);
