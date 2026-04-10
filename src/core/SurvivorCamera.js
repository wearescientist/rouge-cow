(function attachSurvivorCamera(global) {
    class SurvivorCamera {
        constructor() {
            this.x = SURVIVOR_CONFIG.ROOM_WIDTH / 2;
            this.y = SURVIVOR_CONFIG.ROOM_HEIGHT / 2;
            this.target = null;
            this.viewWidth = SURVIVOR_CONFIG.VIEW_WIDTH;
            this.viewHeight = SURVIVOR_CONFIG.VIEW_HEIGHT;
            this.showFullRoom = true;
            this.zoom = 1;
            this.shakeAmount = 0;
            this.enableShake = true;
            this.shakeDecay = 0.9;
            this.shakeDuration = 0;
            this.shakeTimer = 0;
            this.shakeOffsetX = 0;
            this.shakeOffsetY = 0;
            this.enableCinematicCamera = true;
            this.cinematicZoom = 1;
            this.cinematicPulse = 0;
            this.cinematicPulseTrack = null;
            Object.defineProperty(this, 'shake', {
                configurable: true,
                enumerable: true,
                get: () => this.shakeAmount,
                set: (value) => {
                    const next = Number(value);
                    this.shakeAmount = Number.isFinite(next) ? Math.max(0, next) : 0;
                    if (this.shakeAmount <= 0) {
                        this.shakeTimer = 0;
                        this.shakeDuration = 0;
                        this.shakeOffsetX = 0;
                        this.shakeOffsetY = 0;
                    } else {
                        this.shakeDuration = Math.max(this.shakeDuration, 0.12);
                    }
                }
            });
        }

        resolveShakeRequest(amountOrProfile, duration, options = null) {
            const opts = (options && typeof options === 'object') ? options : {};
            if (typeof amountOrProfile === 'string') {
                const profile = global.getCameraShakeProfile?.(amountOrProfile);
                if (profile) {
                    return {
                        amount: profile.amount,
                        duration: profile.duration,
                        decay: profile.decay
                    };
                }
            }
            const profileName = typeof opts.profile === 'string' ? opts.profile : null;
            const byOptionProfile = profileName ? global.getCameraShakeProfile?.(profileName) : null;
            return {
                amount: Number.isFinite(amountOrProfile) ? amountOrProfile : (byOptionProfile?.amount ?? 0),
                duration: Number.isFinite(duration) ? duration : (byOptionProfile?.duration ?? 0.2),
                decay: Number.isFinite(opts.decay) ? opts.decay : (byOptionProfile?.decay ?? this.shakeDecay)
            };
        }

        getShakeDampenRatio(requestAmount = 0) {
            const settings = global.game?.runtimeSettings || {};
            if (settings.enableScreenShake === false) return 0;
            if (settings.autoDampenStrongShake !== false && requestAmount >= 9) {
                return 0.68;
            }
            return 1;
        }

        addShake(amount, duration = 0.2, options = null) {
            if (!this.enableShake) return;
            const shakeRequest = this.resolveShakeRequest(amount, duration, options);
            const dampen = this.getShakeDampenRatio(shakeRequest.amount);
            const safeAmount = Math.max(0, (Number(shakeRequest.amount) || 0) * dampen);
            const safeDuration = Math.max(0.05, Number(shakeRequest.duration) || 0.2);
            const safeDecay = Math.max(0.75, Math.min(0.96, Number(shakeRequest.decay) || this.shakeDecay));
            this.shakeAmount = Math.max(this.shakeAmount, safeAmount);
            this.shakeDuration = Math.max(this.shakeDuration, safeDuration);
            this.shakeDecay = safeDecay;
            this.shakeTimer = 0;
            if (this.enableCinematicCamera) {
                this.cinematicPulse = Math.max(this.cinematicPulse, Math.min(0.045, safeAmount * 0.0035));
            }
        }

        pulseZoom(amount = 0.02, duration = 0.26) {
            if (!this.enableCinematicCamera) return;
            const safeAmount = Number.isFinite(amount) ? amount : 0.02;
            const safeDuration = Number.isFinite(duration) ? Math.max(0.08, Math.min(1.1, duration)) : 0.26;
            this.cinematicPulseTrack = {
                amount: Math.max(0, Math.min(0.09, safeAmount)),
                duration: safeDuration,
                timer: 0
            };
        }

        updateViewport() {
            const body = document.body;
            const arenaCore = document.getElementById('arenaCore');
            const rootStyle = document.documentElement?.style;
            let displaySize = 960;
            let useArenaFill = false;

            if (arenaCore) {
                const rect = arenaCore.getBoundingClientRect();
                if (body?.classList.contains('mobile-landscape-mode')) {
                    const viewportAspect = Math.max(1, (window.innerWidth || rect.width || 1) / Math.max(1, window.innerHeight || rect.height || 1));
                    const stretchX = Math.max(1, Math.min(1.38, viewportAspect / (16 / 9)));
                    rootStyle?.setProperty('--mobile-landscape-arena-scale-x', stretchX.toFixed(4));
                    useArenaFill = true;
                } else if (body?.classList.contains('mobile-portrait-stage-mode')) {
                    useArenaFill = true;
                } else {
                    displaySize = Math.min(rect.width, rect.height);
                }
            }

            const canvasW = 960;
            const canvasH = 960;
            const cssSize = Math.max(360, Math.floor(displaySize));
            const canvas = document.getElementById('gameCanvas');
            const overlayCanvas = document.getElementById('gameOverlayCanvas');
            const stageViewport = document.getElementById('stageViewport');

            if (canvas) {
                canvas.width = canvasW;
                canvas.height = canvasH;
                if (useArenaFill) {
                    canvas.style.width = '100%';
                    canvas.style.height = '100%';
                } else {
                    canvas.style.width = cssSize + 'px';
                    canvas.style.height = cssSize + 'px';
                }
            }

            if (overlayCanvas && stageViewport) {
                const stageRect = stageViewport.getBoundingClientRect();
                const overlayW = Math.max(360, Math.floor(stageRect.width || canvasW));
                const overlayH = Math.max(360, Math.floor(stageRect.height || canvasH));
                overlayCanvas.width = overlayW;
                overlayCanvas.height = overlayH;
                overlayCanvas.style.width = overlayW + 'px';
                overlayCanvas.style.height = overlayH + 'px';
            }

            SURVIVOR_CONFIG.VIEW_WIDTH = canvasW;
            SURVIVOR_CONFIG.VIEW_HEIGHT = canvasH;

            const roomW = SURVIVOR_CONFIG.ROOM_WIDTH;
            const roomH = SURVIVOR_CONFIG.ROOM_HEIGHT;

            this.showFullRoom = true;
            this.viewWidth = roomW;
            this.viewHeight = roomH;
            this.x = roomW / 2;
            this.y = roomH / 2;
            this.zoom = 1;
            this.cinematicZoom = 1;
            this.cinematicPulse = 0;
        }

        follow(target) {
            this.target = target;
        }

        update() {
            if (this.shakeAmount > 0 && this.shakeDuration > 0) {
                this.shakeTimer += 1 / 60;
                const progress = Math.min(1, this.shakeTimer / this.shakeDuration);
                const decay = (1 - progress) * (1 - progress);
                const frameShake = this.shakeAmount * decay;
                this.shakeOffsetX = (Math.random() - 0.5) * frameShake;
                this.shakeOffsetY = (Math.random() - 0.5) * frameShake;
                this.shakeAmount *= this.shakeDecay;
                if (progress >= 1 || this.shakeAmount <= 0.05) {
                    this.shakeAmount = 0;
                    this.shakeTimer = 0;
                    this.shakeDuration = 0;
                    this.shakeOffsetX = 0;
                    this.shakeOffsetY = 0;
                }
            } else {
                this.shakeAmount = 0;
                this.shakeTimer = 0;
                this.shakeDuration = 0;
                this.shakeOffsetX = 0;
                this.shakeOffsetY = 0;
            }

            if (this.enableCinematicCamera) {
                if (this.cinematicPulseTrack) {
                    const track = this.cinematicPulseTrack;
                    track.timer += 1 / 60;
                    const progress = Math.max(0, Math.min(1, track.timer / Math.max(0.001, track.duration)));
                    const pivot = 0.42;
                    let pulse = 0;
                    if (progress <= pivot) {
                        const t = progress / pivot;
                        pulse = track.amount * (1 - (1 - t) * (1 - t)); // easeOut
                    } else {
                        const t = (progress - pivot) / Math.max(0.001, 1 - pivot);
                        pulse = track.amount * (1 - t * t); // easeIn recovery
                    }
                    this.cinematicPulse = Math.max(0, pulse);
                    if (progress >= 1) {
                        this.cinematicPulseTrack = null;
                        this.cinematicPulse = 0;
                    }
                } else {
                    this.cinematicPulse *= 0.84;
                    if (this.cinematicPulse < 0.0005) this.cinematicPulse = 0;
                }
                this.cinematicZoom += ((1 + this.cinematicPulse) - this.cinematicZoom) * 0.22;
            } else {
                this.cinematicPulse = 0;
                this.cinematicPulseTrack = null;
                this.cinematicZoom += (1 - this.cinematicZoom) * 0.25;
            }

            if (this.showFullRoom) {
                const roomCenterX = SURVIVOR_CONFIG.ROOM_WIDTH / 2;
                const roomCenterY = SURVIVOR_CONFIG.ROOM_HEIGHT / 2;
                let desiredX = roomCenterX;
                let desiredY = roomCenterY;
                if (this.enableCinematicCamera && this.target) {
                    const leadX = Math.max(-85, Math.min(85, (Number(this.target.vx) || 0) * 28));
                    const leadY = Math.max(-85, Math.min(85, (Number(this.target.vy) || 0) * 28));
                    desiredX += leadX;
                    desiredY += leadY;
                }
                this.x += (desiredX - this.x) * 0.12;
                this.y += (desiredY - this.y) * 0.12;
                return;
            }

            if (!this.target) return;

            this.x += (this.target.x - this.x) * SURVIVOR_CONFIG.CAMERA_SMOOTH;
            this.y += (this.target.y - this.y) * SURVIVOR_CONFIG.CAMERA_SMOOTH;

            const minX = this.viewWidth / 2;
            const maxX = SURVIVOR_CONFIG.ROOM_WIDTH - this.viewWidth / 2;
            const minY = this.viewHeight / 2;
            const maxY = SURVIVOR_CONFIG.ROOM_HEIGHT - this.viewHeight / 2;

            this.x = Math.max(minX, Math.min(maxX, this.x));
            this.y = Math.max(minY, Math.min(maxY, this.y));
        }

        worldToScreen(wx, wy) {
            if (this.showFullRoom) {
                const canvas = document.getElementById('gameCanvas');
                const canvasW = canvas ? canvas.width : 960;
                const canvasH = canvas ? canvas.height : 960;
                const roomW = SURVIVOR_CONFIG.ROOM_WIDTH;
                const roomH = SURVIVOR_CONFIG.ROOM_HEIGHT;
                const baseScale = Math.min(canvasW / roomW, canvasH / roomH);
                const scale = baseScale * (this.enableCinematicCamera ? this.cinematicZoom : 1);
                return {
                    x: (wx - this.x + this.shakeOffsetX) * scale + canvasW / 2,
                    y: (wy - this.y + this.shakeOffsetY) * scale + canvasH / 2,
                    scale
                };
            }

            return {
                x: wx - this.x + this.viewWidth / 2 + this.shakeOffsetX,
                y: wy - this.y + this.viewHeight / 2 + this.shakeOffsetY,
                scale: 1
            };
        }

        isVisible(wx, wy, radius = 50) {
            if (this.showFullRoom) {
                return wx >= -radius && wx <= SURVIVOR_CONFIG.ROOM_WIDTH + radius
                    && wy >= -radius && wy <= SURVIVOR_CONFIG.ROOM_HEIGHT + radius;
            }
            return Math.abs(wx - this.x) < this.viewWidth / 2 + radius
                && Math.abs(wy - this.y) < this.viewHeight / 2 + radius;
        }
    }

    global.SurvivorCamera = SurvivorCamera;
})(window);
