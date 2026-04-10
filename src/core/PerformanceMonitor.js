(function attachPerformanceMonitor(global) {
    class PerformanceMonitor {
        constructor() {
            this.frames = [];
            this.lastTime = performance.now();
            this.fps = 60;
            this.avgFps = 60;
            this.frameTime = 16.67;
            this.updateInterval = 500;
            this.lastUpdate = 0;
            this.visible = false;
            this.overlayCanvas = null;
            this.overlayCtx = null;
            this.metrics = Object.create(null);
        }

        update() {
            const now = performance.now();
            const delta = now - this.lastTime;
            this.lastTime = now;
            this.frameTime = delta;
            this.frames.push(1000 / delta);
            if (this.frames.length > 60) {
                this.frames.shift();
            }
            if (now - this.lastUpdate > this.updateInterval) {
                this.avgFps = Math.round(this.frames.reduce((a, b) => a + b, 0) / this.frames.length);
                this.lastUpdate = now;
            }
            this.fps = Math.round(1000 / delta);
        }

        getSummary() {
            const room = window.game?.curRoom;
            const hordeEnemies = room?.hordeManager?.getActiveEnemies?.();
            const enemyCount = Array.isArray(hordeEnemies)
                ? hordeEnemies.length
                : Array.isArray(room?.enemies)
                    ? room.enemies.filter((enemy) => enemy && enemy.hp > 0).length
                    : 0;
            const particles = window.game?.particles;
            const particleCount = Array.isArray(particles?.active)
                ? particles.active.length
                : Array.isArray(particles?.particles)
                    ? particles.particles.length
                    : 0;
            return {
                fps: this.fps,
                avgFps: this.avgFps,
                frameTime: this.frameTime,
                worstFrameTime: this.frames.length > 0
                    ? Math.max(...this.frames.map((fps) => 1000 / Math.max(fps, 1)))
                    : this.frameTime,
                minFps: this.frames.length > 0
                    ? Math.round(Math.min(...this.frames))
                    : this.fps,
                bullets: window.game?.bullets?.length || 0,
                particles: particleCount,
                enemies: enemyCount
            };
        }

        setMetric(key, value) {
            if (!key) return;
            const numeric = Number(value);
            this.metrics[key] = Number.isFinite(numeric) ? numeric : value;
        }

        draw(ctx, x, y) {
            if (!this.visible) return;
            const targetCtx = this.ensureOverlayCanvas() || ctx;
            if (!targetCtx) return;
            const drawX = targetCtx === this.overlayCtx ? 0 : x;
            const drawY = targetCtx === this.overlayCtx ? 0 : y;
            if (targetCtx === this.overlayCtx) {
                targetCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
            }

            targetCtx.fillStyle = 'rgba(0,0,0,0.86)';
            targetCtx.fillRect(drawX, drawY, 226, 228);
            targetCtx.strokeStyle = '#333';
            targetCtx.lineWidth = 1;
            targetCtx.strokeRect(drawX, drawY, 226, 228);

            targetCtx.fillStyle = this.fps >= 55 ? '#4f4' : this.fps >= 30 ? '#ff0' : '#f44';
            targetCtx.font = 'bold 14px ZCOOL KuaiLe Local';
            targetCtx.textAlign = 'left';
            targetCtx.fillText(`FPS: ${this.fps} (${this.avgFps})`, drawX + 10, drawY + 20);

            targetCtx.fillStyle = '#fff';
            targetCtx.font = '12px ZCOOL KuaiLe Local';
            const summary = this.getSummary();
            targetCtx.fillText(`Frame: ${summary.frameTime.toFixed(1)}ms`, drawX + 10, drawY + 38);
            targetCtx.fillText(`Low: ${summary.minFps} / ${summary.worstFrameTime.toFixed(1)}ms`, drawX + 10, drawY + 56);
            const gridCell = Number(this.metrics['grid.cellSize'] || 0);
            targetCtx.fillText(`Obj: ${summary.bullets}B ${summary.particles}P E:${summary.enemies} G:${gridCell || '-'}`, drawX + 10, drawY + 72);
            const cacheHit = Number(this.metrics['roomCache.hit'] || 0);
            const cacheMiss = Number(this.metrics['roomCache.miss'] || 0);
            const aiUpdated = Number(this.metrics['ai.update'] || 0);
            const aiSkipped = Number(this.metrics['ai.skip'] || 0);
            const weaponUpdated = Number(this.metrics['weapon.update'] || 0);
            const weaponSkipped = Number(this.metrics['weapon.skip'] || 0);
            const particlesActive = Number(this.metrics['pool.particlesActive'] || 0);
            const particlesCap = Number(this.metrics['pool.particlesCap'] || 0);
            const damageActive = Number(this.metrics['pool.damageActive'] || 0);
            const damageCap = Number(this.metrics['pool.damageCap'] || 0);
            const bloodTotal = Number(this.metrics['blood.stains'] || 0);
            const bloodVisible = Number(this.metrics['blood.visible'] || 0);
            const particlesDrawn = Number(this.metrics['particles.drawn'] || 0);
            const particlesCulled = Number(this.metrics['particles.culled'] || 0);
            const particlesRoom = Number(this.metrics['particles.room'] || 0);
            const particlesDrop = Number(this.metrics['particles.drop'] || 0);
            const lightingDrawn = Number(this.metrics['lighting.drawn'] || 0);
            const lightingTotal = Number(this.metrics['lighting.total'] || 0);
            const lightingCap = Number(this.metrics['lighting.cap'] || 0);
            const audioCacheHit = Number(this.metrics['audio.cacheHit'] || 0);
            const audioCacheMiss = Number(this.metrics['audio.cacheMiss'] || 0);
            const audioPreloadLoaded = Number(this.metrics['audio.preloadLoaded'] || 0);
            const audioPreloadReq = Number(this.metrics['audio.preloadRequested'] || 0);
            const audioPreloadRate = Number(this.metrics['audio.preloadHitRate'] || 0);
            targetCtx.fillText(`Cache H/M: ${cacheHit}/${cacheMiss}`, drawX + 10, drawY + 88);
            targetCtx.fillText(`AI U/S: ${aiUpdated}/${aiSkipped}`, drawX + 10, drawY + 102);
            targetCtx.fillText(`Wpn U/S: ${weaponUpdated}/${weaponSkipped}`, drawX + 10, drawY + 116);
            targetCtx.fillText(`Pool P/D: ${particlesActive}/${particlesCap} ${damageActive}/${damageCap}`, drawX + 10, drawY + 130);
            targetCtx.fillText(`Blood V/T: ${bloodVisible}/${bloodTotal}`, drawX + 10, drawY + 144);
            targetCtx.fillText(`Particle D/C: ${particlesDrawn}/${particlesCulled}`, drawX + 10, drawY + 158);
            targetCtx.fillText(`Particle R/Drop: ${particlesRoom}/${particlesDrop}`, drawX + 10, drawY + 172);
            targetCtx.fillText(`Light D/T/C: ${lightingDrawn}/${lightingTotal}/${lightingCap || '-'}`, drawX + 10, drawY + 186);
            targetCtx.fillText(`Audio C H/M: ${audioCacheHit}/${audioCacheMiss}`, drawX + 10, drawY + 200);
            targetCtx.fillText(`Audio Preload: ${audioPreloadLoaded}/${audioPreloadReq} ${(audioPreloadRate * 100).toFixed(0)}%`, drawX + 10, drawY + 214);
        }

        ensureOverlayCanvas() {
            if (this.overlayCtx && this.overlayCanvas?.isConnected) {
                return this.overlayCtx;
            }
            const canvas = document.createElement('canvas');
            canvas.width = 226;
            canvas.height = 228;
            canvas.id = 'perfMonitorOverlay';
            canvas.style.cssText = [
                'position:fixed',
                'top:16px',
                'left:16px',
                'width:226px',
                'height:228px',
                'z-index:100001',
                'pointer-events:none',
                'display:none'
            ].join(';');
            document.body.appendChild(canvas);
            this.overlayCanvas = canvas;
            this.overlayCtx = canvas.getContext('2d');
            return this.overlayCtx;
        }

        toggle() {
            this.visible = !this.visible;
            if (this.visible) {
                this.ensureOverlayCanvas();
            }
            if (this.overlayCanvas) {
                this.overlayCanvas.style.display = this.visible ? 'block' : 'none';
                if (!this.visible && this.overlayCtx) {
                    this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
                }
            }
            return this.visible;
        }
    }

    global.PerformanceMonitor = PerformanceMonitor;
})(window);
