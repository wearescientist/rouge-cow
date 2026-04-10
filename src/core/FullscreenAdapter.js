(function attachFullscreenAdapter(global) {
    class FullscreenAdapter {
        constructor(canvas, gameWidth = 900, gameHeight = 600) {
            this.canvas = canvas;
            this.gameWidth = gameWidth;
            this.gameHeight = gameHeight;
            this.scale = 1;
        }

        setup() {
            // 已禁用 - 3栏布局由CSS控制
        }

        resize() {
            if (window.game?.camera) {
                window.game.camera.updateViewport();
            }
        }
    }

    global.FullscreenAdapter = FullscreenAdapter;
})(window);
