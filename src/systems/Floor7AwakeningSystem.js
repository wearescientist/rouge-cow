(function attachFloor7AwakeningSystem(global) {
    'use strict';

    const STATE_KEY = '__floor7AwakeningState';
    const TWO_PI = Math.PI * 2;

    function clamp01(v) {
        return Math.max(0, Math.min(1, v));
    }

    function getAwakeningEntityBrightness() {
        const settings = window.game?.runtimeSettings || window.game?.settings || {};
        const base = Number(settings.entityBrightness ?? 0.40);
        const category = Number(settings.propBrightness ?? 1);
        const safeBase = Number.isFinite(base) ? Math.max(0, Math.min(1, base)) : 0.40;
        const safeCategory = Number.isFinite(category) ? Math.max(0, Math.min(1.5, category)) : 1;
        return Math.max(0, Math.min(1.5, safeBase * safeCategory));
    }

    function distance(ax, ay, bx, by) {
        const dx = ax - bx;
        const dy = ay - by;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function getEntityCenter(entity, fallbackX = 0, fallbackY = 0) {
        return {
            x: Number.isFinite(entity?.cx) ? entity.cx : (Number.isFinite(entity?.x) ? entity.x : fallbackX),
            y: Number.isFinite(entity?.cy) ? entity.cy : (Number.isFinite(entity?.y) ? entity.y : fallbackY)
        };
    }

    function drawRoundedRectPath(ctx, x, y, w, h, r) {
        const radius = Math.max(0, Math.min(r, Math.min(w, h) * 0.5));
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.arcTo(x + w, y, x + w, y + h, radius);
        ctx.arcTo(x + w, y + h, x, y + h, radius);
        ctx.arcTo(x, y + h, x, y, radius);
        ctx.arcTo(x, y, x + w, y, radius);
        ctx.closePath();
    }

    function deepClone(value) {
        return JSON.parse(JSON.stringify(value));
    }

    function countSpokenSouls(state) {
        if (!state || !Array.isArray(state.souls)) return 0;
        return state.souls.reduce((sum, soul) => sum + (soul?.spoken ? 1 : 0), 0);
    }

    function makeEntryState() {
        return {
            entered: false,
            line1Played: false,
            line2Played: false,
            spawnX: null,
            spawnY: null,
            busy: false
        };
    }

    function makeAwakeningState() {
        const souls = (global.Floor7AwakeningData?.souls || []).map(() => ({
            lit: false,
            spoken: false,
            state: 'pending',
            lightLerp: 0
        }));
        return {
            phase: 'idle',
            currentSoulIndex: 0,
            centerVisible: false,
            centerResolved: false,
            blindShown: false,
            bossDoorOpened: false,
            brightening: false,
            brightnessLerp: 0,
            orbPulseTimer: 0,
            nextBlindEchoAtMs: 0,
            busy: false,
            souls
        };
    }

    function makeBossState() {
        return {
            entered: false,
            preBattlePlayed: false,
            combatEnabled: false,
            deathSequencePlayed: false,
            busy: false
        };
    }

    class Floor7AwakeningSystem {
        constructor(options = {}) {
            this.gameGetter = options.gameGetter || (() => global.game);
            this.subtitleGetter = options.subtitleGetter || (() => this.getGame()?.cinematicSubtitle);
            this.overheadGetter = options.overheadGetter || (() => this.getGame()?.playerOverheadDialogue);
            this.rewardTotemId = 7;
            this.bossSilhouetteCache = new Map();
            this.spiritSpriteCache = new Map();
        }

        getGame() {
            return this.gameGetter ? this.gameGetter() : global.game;
        }

        getSubtitle() {
            return this.subtitleGetter ? this.subtitleGetter() : this.getGame()?.cinematicSubtitle;
        }

        getOverhead() {
            return this.overheadGetter ? this.overheadGetter() : this.getGame()?.playerOverheadDialogue;
        }

        isFloor7Room(room) {
            return !!room && Number(room.floor) === 7 && !!room.floor7Role;
        }

        isFullBrightnessActive(room = this.getGame()?.curRoom) {
            if (!this.isFloor7Room(room)) return false;
            if (room.floor7Role === 'boss') return true;
            if (room.floor7Role !== 'awakening') return false;
            const state = this.getState(room);
            return !!state && clamp01(state.brightnessLerp || 0) >= 0.999;
        }

        isCombatSuppressed(room = this.getGame()?.curRoom) {
            if (!this.isFloor7Room(room) || room.floor7Role !== 'boss' || room.cleared) return false;
            const state = this.getState(room);
            return !!state && !state.combatEnabled;
        }

        shouldLockPlayer() {
            return !!(this.getSubtitle()?.isPlayerLocked?.() || this.getOverhead()?.isPlayerLocked?.());
        }

        createStateForRoom(room) {
            if (!this.isFloor7Room(room)) return null;
            if (room.floor7Role === 'entry') return makeEntryState();
            if (room.floor7Role === 'awakening') return makeAwakeningState();
            if (room.floor7Role === 'boss') return makeBossState();
            return null;
        }

        getState(room = this.getGame()?.curRoom) {
            if (!this.isFloor7Room(room)) return null;
            if (!room[STATE_KEY]) room[STATE_KEY] = this.createStateForRoom(room);
            return room[STATE_KEY];
        }

        getFloorBounds(room) {
            const width = room?.width || global.SURVIVOR_CONFIG?.ROOM_WIDTH || 2700;
            const height = room?.height || global.SURVIVOR_CONFIG?.ROOM_HEIGHT || 1800;
            const wall = global.SURVIVOR_CONFIG?.WALL_THICKNESS || 120;
            return {
                left: wall,
                top: wall,
                right: width - wall,
                bottom: height - wall,
                width: width - wall * 2,
                height: height - wall * 2,
                centerX: room?.centerX || width * 0.5,
                centerY: room?.centerY || height * 0.5
            };
        }

        makeDefaultAwakeningLayout(room) {
            const bounds = this.getFloorBounds(room);
            const centerX = bounds.centerX;
            const centerY = bounds.centerY + bounds.height * 0.02;
            const wingOffset = bounds.width * 0.225;
            const inwardOffset = bounds.width * 0.085;
            const candleDrop = bounds.height * 0.062;
            const soulRetreat = bounds.height * 0.036;
            const candleForward = -bounds.height * 0.012;
            const upperY = bounds.top + bounds.height * 0.24 - soulRetreat;
            const middleY = bounds.top + bounds.height * 0.495 - soulRetreat;
            const lowerY = bounds.top + bounds.height * 0.75 - soulRetreat;
            return {
                bounds,
                aisleTop: bounds.top + bounds.height * 0.14,
                aisleBottom: bounds.bottom - bounds.height * 0.06,
                aisleHalfWidth: bounds.width * 0.12,
                centerPoint: { x: centerX, y: centerY + bounds.height * 0.03 },
                blindEchoPoint: { x: centerX, y: bounds.top + bounds.height * 0.12 },
                souls: [
                    { id: 'tiaotiao', index: 0, x: centerX - wingOffset, y: upperY, candleX: centerX - wingOffset + inwardOffset, candleY: upperY + candleDrop + candleForward, facing: 1 },
                    { id: 'tiezhua', index: 1, x: centerX + wingOffset, y: upperY, candleX: centerX + wingOffset - inwardOffset, candleY: upperY + candleDrop + candleForward, facing: -1 },
                    { id: 'nibei', index: 2, x: centerX - wingOffset, y: middleY, candleX: centerX - wingOffset + inwardOffset, candleY: middleY + candleDrop + candleForward, facing: 1 },
                    { id: 'yinya', index: 3, x: centerX + wingOffset, y: middleY, candleX: centerX + wingOffset - inwardOffset, candleY: middleY + candleDrop + candleForward, facing: -1 },
                    { id: 'father', index: 4, x: centerX - wingOffset, y: lowerY, candleX: centerX - wingOffset + inwardOffset, candleY: lowerY + candleDrop + candleForward, facing: 1 },
                    { id: 'mother', index: 5, x: centerX + wingOffset, y: lowerY, candleX: centerX + wingOffset - inwardOffset, candleY: lowerY + candleDrop + candleForward, facing: 1 }
                ]
            };
        }

        ensureAwakeningLayoutNodes(room) {
            if (!room || room.floor7Role !== 'awakening') return null;

            const defaults = this.makeDefaultAwakeningLayout(room);
            room.hiddenRoomFloor = 7;

            const ensureNode = (existing, spec) => {
                const node = existing && typeof existing === 'object' ? existing : {};
                node.kind = spec.kind;
                node.layoutId = spec.layoutId;
                node.layoutLabel = spec.layoutLabel;
                node.index = spec.index;
                node.stateId = spec.stateId;
                node.facing = Number.isFinite(node.facing) ? node.facing : spec.facing;
                node.editorLayer = Number.isFinite(node.editorLayer) ? node.editorLayer : spec.editorLayer;
                node.rotation = Number.isFinite(node.rotation) ? node.rotation : (spec.rotation || 0);
                node.scale = Number.isFinite(node.scale) ? node.scale : (spec.scale || 1);
                node.scaleX = Number.isFinite(node.scaleX) ? node.scaleX : (spec.scaleX || 1);
                node.scaleY = Number.isFinite(node.scaleY) ? node.scaleY : (spec.scaleY || 1);
                node.alpha = Number.isFinite(node.alpha) ? node.alpha : (spec.alpha || 1);
                node.drawW = Number.isFinite(node.drawW) ? node.drawW : spec.drawW;
                node.drawH = Number.isFinite(node.drawH) ? node.drawH : spec.drawH;
                node.baseDrawW = Number.isFinite(node.baseDrawW) ? node.baseDrawW : spec.drawW;
                node.baseDrawH = Number.isFinite(node.baseDrawH) ? node.baseDrawH : spec.drawH;
                node.x = Number.isFinite(node.x) ? node.x : spec.x;
                node.y = Number.isFinite(node.y) ? node.y : spec.y;
                return node;
            };

            room.floor7SoulNodes = defaults.souls.map((soul, index) => ensureNode(room.floor7SoulNodes?.[index], {
                kind: 'floor7_soul',
                layoutId: `floor7_soul_${index}`,
                layoutLabel: `英魂${index + 1}`,
                stateId: soul.id,
                index,
                x: soul.x,
                y: soul.y,
                drawW: 230,
                drawH: 314,
                editorLayer: 5,
                facing: soul.facing,
                alpha: 1
            }));
            // 用户指定：第三位英魂（泥背）水平翻转，头朝外
            if (room.floor7SoulNodes[2]) {
                room.floor7SoulNodes[2].facing = -1;
            }

            room.floor7CandleNodes = defaults.souls.map((soul, index) => ensureNode(room.floor7CandleNodes?.[index], {
                kind: 'candle',
                layoutId: `floor7_candle_${index}`,
                layoutLabel: `魂烛${index + 1}`,
                index,
                x: soul.candleX,
                y: soul.candleY,
                drawW: 58,
                drawH: 58,
                editorLayer: 6,
                scale: 1
            }));
            room.floor7CandleAnchorNodes = defaults.souls.map((soul, index) => {
                const candleNode = room.floor7CandleNodes?.[index] || { x: soul.candleX, y: soul.candleY, scale: 1 };
                const anchor = this.getCandleFlameWorldPoint(candleNode);
                return ensureNode(room.floor7CandleAnchorNodes?.[index], {
                    kind: 'floor7_candle_anchor',
                    layoutId: `floor7_candle_anchor_${index}`,
                    layoutLabel: `交互锚点${index + 1}`,
                    index,
                    x: anchor.x,
                    y: anchor.y,
                    drawW: 36,
                    drawH: 36,
                    editorLayer: 8,
                    scale: 1
                });
            });

            room.floor7CenterNode = ensureNode(room.floor7CenterNode, {
                kind: 'floor7_center',
                layoutId: 'floor7_center',
                layoutLabel: '中央汇流',
                x: defaults.centerPoint.x,
                y: defaults.centerPoint.y,
                drawW: 110,
                drawH: 110,
                editorLayer: 4,
                scale: 1
            });

            room.floor7BlindNode = ensureNode(room.floor7BlindNode, {
                kind: 'floor7_blind',
                layoutId: 'floor7_blind',
                layoutLabel: '盲眼残影',
                x: defaults.blindEchoPoint.x,
                y: defaults.blindEchoPoint.y,
                drawW: 232,
                drawH: 304,
                editorLayer: 7,
                scale: 1
            });

            room.floor7FxNodes = room.floor7FxNodes || {};
            room.floor7FxNodes.stageCenter = ensureNode(room.floor7FxNodes.stageCenter, {
                kind: 'floor7_fx_stage',
                layoutId: 'floor7_fx_stage',
                layoutLabel: '舞台光效中心',
                x: defaults.centerPoint.x,
                y: defaults.centerPoint.y,
                drawW: 44,
                drawH: 44,
                editorLayer: 2,
                scale: 1
            });
            room.floor7FxNodes.coolGlowCenter = ensureNode(room.floor7FxNodes.coolGlowCenter, {
                kind: 'floor7_fx_cool_glow',
                layoutId: 'floor7_fx_cool_glow',
                layoutLabel: '冷色辉光中心',
                x: defaults.centerPoint.x,
                y: defaults.centerPoint.y,
                drawW: 44,
                drawH: 44,
                editorLayer: 2,
                scale: 1
            });
            room.floor7FxNodes.warmGlowCenter = ensureNode(room.floor7FxNodes.warmGlowCenter, {
                kind: 'floor7_fx_warm_glow',
                layoutId: 'floor7_fx_warm_glow',
                layoutLabel: '暖色辉光中心',
                x: defaults.centerPoint.x,
                y: defaults.centerPoint.y + defaults.bounds.height * 0.08,
                drawW: 44,
                drawH: 44,
                editorLayer: 2,
                scale: 1
            });
            room.floor7FxNodes.aisleTop = ensureNode(room.floor7FxNodes.aisleTop, {
                kind: 'floor7_fx_aisle_top',
                layoutId: 'floor7_fx_aisle_top',
                layoutLabel: '中轴上锚点',
                x: defaults.centerPoint.x,
                y: defaults.aisleTop,
                drawW: 34,
                drawH: 34,
                editorLayer: 2,
                scale: 1
            });
            room.floor7FxNodes.aisleBottom = ensureNode(room.floor7FxNodes.aisleBottom, {
                kind: 'floor7_fx_aisle_bottom',
                layoutId: 'floor7_fx_aisle_bottom',
                layoutLabel: '中轴下锚点',
                x: defaults.centerPoint.x,
                y: defaults.aisleBottom,
                drawW: 34,
                drawH: 34,
                editorLayer: 2,
                scale: 1
            });
            room.floor7FxNodes.blindAura = ensureNode(room.floor7FxNodes.blindAura, {
                kind: 'floor7_fx_blind_aura',
                layoutId: 'floor7_fx_blind_aura',
                layoutLabel: '盲眼暗晕中心',
                x: defaults.blindEchoPoint.x,
                y: defaults.blindEchoPoint.y + 10,
                drawW: 38,
                drawH: 38,
                editorLayer: 2,
                scale: 1
            });

            if (!room.__floor7LayoutOverridesApplied) {
                room.__floor7LayoutOverridesApplied = true;
                global.HiddenRoomSystemRuntime?.applyHiddenLayoutOverrides?.(room, 7);
            }

            return {
                defaults,
                soulNodes: room.floor7SoulNodes,
                candleNodes: room.floor7CandleNodes,
                candleAnchorNodes: room.floor7CandleAnchorNodes,
                centerNode: room.floor7CenterNode,
                blindNode: room.floor7BlindNode,
                fxNodes: room.floor7FxNodes
            };
        }

        getLayoutEditorTargets(room) {
            const refs = this.ensureAwakeningLayoutNodes(room);
            if (!refs) return [];

            const targets = [];
            refs.soulNodes.forEach((node, index) => {
                targets.push({ id: node.layoutId, label: node.layoutLabel, kind: node.kind, obj: node });
                const candleNode = refs.candleNodes[index];
                if (candleNode) {
                    targets.push({ id: candleNode.layoutId, label: candleNode.layoutLabel, kind: candleNode.kind, obj: candleNode });
                }
                const anchorNode = refs.candleAnchorNodes?.[index];
                if (anchorNode) {
                    targets.push({ id: anchorNode.layoutId, label: anchorNode.layoutLabel, kind: anchorNode.kind, obj: anchorNode });
                }
            });
            targets.push({ id: refs.centerNode.layoutId, label: refs.centerNode.layoutLabel, kind: refs.centerNode.kind, obj: refs.centerNode });
            targets.push({ id: refs.blindNode.layoutId, label: refs.blindNode.layoutLabel, kind: refs.blindNode.kind, obj: refs.blindNode });
            Object.values(refs.fxNodes || {}).forEach((node) => {
                if (!node) return;
                targets.push({ id: node.layoutId, label: node.layoutLabel, kind: node.kind, obj: node });
            });
            return targets;
        }

        getAwakeningLayout(room) {
            const refs = this.ensureAwakeningLayoutNodes(room);
            const defaults = refs?.defaults || this.makeDefaultAwakeningLayout(room);
            const soulNodes = refs?.soulNodes || [];
            const candleNodes = refs?.candleNodes || [];
            const candleAnchorNodes = refs?.candleAnchorNodes || [];
            const centerNode = refs?.centerNode || defaults.centerPoint;
            const blindNode = refs?.blindNode || defaults.blindEchoPoint;
            const fxNodes = refs?.fxNodes || {};
            return {
                bounds: defaults.bounds,
                aisleTop: defaults.aisleTop,
                aisleBottom: defaults.aisleBottom,
                aisleHalfWidth: defaults.aisleHalfWidth,
                centerPoint: { x: centerNode.x, y: centerNode.y, node: centerNode },
                blindEchoPoint: { x: blindNode.x, y: blindNode.y, node: blindNode },
                fx: {
                    stageCenter: fxNodes.stageCenter || { x: defaults.centerPoint.x, y: defaults.centerPoint.y },
                    coolGlowCenter: fxNodes.coolGlowCenter || { x: defaults.centerPoint.x, y: defaults.centerPoint.y },
                    warmGlowCenter: fxNodes.warmGlowCenter || { x: defaults.centerPoint.x, y: defaults.centerPoint.y + defaults.bounds.height * 0.08 },
                    aisleTop: fxNodes.aisleTop || { x: defaults.centerPoint.x, y: defaults.aisleTop },
                    aisleBottom: fxNodes.aisleBottom || { x: defaults.centerPoint.x, y: defaults.aisleBottom },
                    blindAura: fxNodes.blindAura || { x: defaults.blindEchoPoint.x, y: defaults.blindEchoPoint.y + 10 }
                },
                souls: defaults.souls.map((soul, index) => {
                    const soulNode = soulNodes[index] || soul;
                    const candleNode = candleNodes[index] || soul;
                    const fallbackAnchor = this.getCandleFlameWorldPoint(candleNode);
                    const candleAnchorNode = candleAnchorNodes[index] || fallbackAnchor;
                    return {
                        id: soul.id,
                        index,
                        x: soulNode.x,
                        y: soulNode.y,
                        candleX: candleNode.x,
                        candleY: candleNode.y,
                        candleAnchorX: candleAnchorNode.x,
                        candleAnchorY: candleAnchorNode.y,
                        facing: Number.isFinite(soulNode.facing) ? soulNode.facing : soul.facing,
                        soulNode,
                        candleNode,
                        candleAnchorNode
                    };
                })
            };
        }

        getSoulProgress(state) {
            const total = Math.max((global.Floor7AwakeningData?.souls || []).length, 1);
            const spoken = countSpokenSouls(state);
            const finalGlow = clamp01(state?.brightnessLerp || 0);
            const stagedLight = spoken >= total ? finalGlow : 0;
            return {
                spoken,
                total,
                ratio: clamp01(spoken / total),
                finalGlow,
                roomLight: clamp01(stagedLight)
            };
        }

        syncAwakeningPresentationLighting(room, state = this.getState(room), layout = this.getAwakeningLayout(room), time = Date.now() / 1000) {
            if (!room || room.floor7Role !== 'awakening' || !state || !layout) return;
            const totalSouls = Math.max((global.Floor7AwakeningData?.souls || []).length, 1);
            const litCount = Array.isArray(state.souls) ? state.souls.filter((s) => !!s?.lit).length : 0;
            const orbReady = litCount >= totalSouls || !!state.centerVisible || !!state.centerResolved || !!state.blindShown || !!state.bossDoorOpened;
            const pulse = clamp01((state.orbPulseTimer || 0) / 0.8);
            const orbPulseMul = 1 + pulse * 0.28;
            const lights = [];

            layout.souls.forEach((point, index) => {
                const soulState = state.souls?.[index];
                if (!soulState || soulState.state === 'pending') return;
                const preview = soulState.state === 'preview';
                const speaking = soulState.state === 'speaking';
                const done = soulState.state === 'idleDone';
                lights.push({
                    kind: 'hidden_soul_focus',
                    x: point.x,
                    y: point.y - 6,
                    radiusX: speaking ? 208 : (preview ? 196 : 184),
                    radiusY: speaking ? 176 : (preview ? 162 : 148),
                    bloomRadius: speaking ? 74 : (preview ? 66 : 58),
                    color: speaking ? { r: 255, g: 226, b: 162 } : { r: 176, g: 206, b: 242 },
                    alpha: speaking ? 0.42 : (preview ? 0.36 : (done ? 0.28 : 0.24)),
                    reveal: speaking ? 0.72 : (preview ? 0.64 : (done ? 0.54 : 0.48)),
                    clarity: speaking ? 0.34 : (preview ? 0.30 : 0.26),
                    bloomAlpha: speaking ? 0.22 : (preview ? 0.18 : 0.14),
                    colorizeAlpha: speaking ? 0.16 : (preview ? 0.13 : 0.10),
                    haloAlpha: speaking ? 0.12 : (preview ? 0.10 : 0.08),
                    preserveSharpness: 0.32,
                    preferColor: true,
                    hiddenScale: 1
                });
            });

            layout.souls.forEach((point, index) => {
                const soulState = state.souls?.[index];
                if (!soulState?.lit) return;
                const anchor = this.getCandleFlameWorldPoint(point.candleNode || { x: point.candleX, y: point.candleY, scale: 1 });
                const flicker = 1 + Math.sin(time * 8.2 + index * 0.9) * 0.08;
                lights.push({
                    kind: 'hidden_candle',
                    x: anchor.x,
                    y: anchor.y,
                    radiusX: 78 * flicker,
                    radiusY: 62 * flicker,
                    bloomRadius: 34 * flicker,
                    color: { r: 255, g: 220, b: 132 },
                    alpha: 0.26,
                    reveal: 0.46,
                    clarity: 0.24,
                    bloomAlpha: 0.11,
                    colorizeAlpha: 0.08,
                    haloAlpha: 0.06,
                    preserveSharpness: 0.24,
                    preferColor: true,
                    hiddenScale: 1
                });
            });

            const orb = layout.centerPoint?.node || layout.centerPoint;
            if (orb) {
                lights.push({
                    kind: 'hidden_orb',
                    x: orb.x,
                    y: orb.y - 4,
                    radiusX: (orbReady ? 74 : 52) * orbPulseMul,
                    radiusY: (orbReady ? 58 : 40) * orbPulseMul,
                    bloomRadius: (orbReady ? 38 : 20) * orbPulseMul,
                    color: orbReady ? { r: 138, g: 198, b: 255 } : { r: 148, g: 216, b: 255 },
                    alpha: orbReady ? 0.24 : 0.08,
                    reveal: orbReady ? 0.42 : 0.16,
                    clarity: orbReady ? 0.28 : 0.10,
                    bloomAlpha: orbReady ? 0.15 : 0.05,
                    colorizeAlpha: orbReady ? 0.10 : 0.03,
                    haloAlpha: orbReady ? 0.08 : 0.02,
                    preserveSharpness: orbReady ? 0.32 : 0.16,
                    preferColor: true,
                    hiddenScale: 1
                });
            }

            room.hiddenLightSources = lights;
            room.floor7AwakeningDarknessAlpha = clamp01((1 - clamp01(state.brightnessLerp || 0))) * 0.82;
        }

        estimateBeatDuration(text, base = 2.2, perChar = 0.12, max = 6.8) {
            const len = Array.from(String(text || '')).length;
            return Math.max(base, Math.min(max, base * 0.75 + len * perChar));
        }

        withBeatTiming(lines = [], options = {}) {
            const baseDuration = Number.isFinite(options.baseDuration) ? options.baseDuration : 2.2;
            const perChar = Number.isFinite(options.perChar) ? options.perChar : 0.12;
            const maxDuration = Number.isFinite(options.maxDuration) ? options.maxDuration : 6.8;
            return (Array.isArray(lines) ? lines : []).map((line) => ({
                ...line,
                duration: this.estimateBeatDuration(line?.text, baseDuration, perChar, maxDuration)
            }));
        }

        getBossEnemy(room = this.getGame()?.curRoom) {
            if (!room) return null;
            const enemies = room.getActiveEnemies ? room.getActiveEnemies() : room.enemies;
            return Array.isArray(enemies) ? enemies.find(enemy => enemy?.isBoss && enemy.hp > 0) || null : null;
        }

        getSoulOverheadLine(room, index) {
            const layout = this.getAwakeningLayout(room);
            const soulPoint = layout?.souls?.[index];
            const soulData = global.Floor7AwakeningData?.souls?.[index];
            if (!soulPoint || !soulData) return null;
            return {
                text: soulData.text,
                worldX: soulPoint.x,
                worldY: soulPoint.y - 136,
                color: '#f0f6ff',
                maxWidth: 300,
                duration: 2.8
            };
        }

        getCenterOverheadLines() {
            const lines = (global.Floor7AwakeningData?.awakenLines || []).map((line) => ({
                text: line.text,
                anchor: 'player',
                color: '#f7f2e6',
                maxWidth: 280,
                duration: 2.6
            }));
            return this.withBeatTiming(lines, {
                baseDuration: 2.4,
                perChar: 0.13,
                maxDuration: 6.8
            });
        }

        getBlindOverheadLines(room) {
            const layout = this.getAwakeningLayout(room);
            const blind = layout?.blindEchoPoint;
            const lines = (global.Floor7AwakeningData?.blindEchoLines || []).map((line) => ({
                text: line.text,
                worldX: blind?.x,
                worldY: (blind?.y || 0) - 160,
                color: '#b8d8ff',
                maxWidth: 260,
                duration: 2.2
            }));
            return this.withBeatTiming(lines, {
                baseDuration: 2.3,
                perChar: 0.14,
                maxDuration: 6.2
            });
        }

        syncAwakeningState(room, state = this.getState(room)) {
            if (!room || !state || room.floor7Role !== 'awakening') return;

            const dataSouls = global.Floor7AwakeningData?.souls || [];
            if (!Array.isArray(state.souls)) state.souls = [];
            while (state.souls.length < dataSouls.length) {
                state.souls.push({ lit: false, spoken: false, state: 'pending', lightLerp: 0 });
            }
            state.souls = state.souls.slice(0, dataSouls.length).map((item) => ({
                lit: !!item?.lit,
                spoken: !!item?.spoken,
                state: typeof item?.state === 'string' ? item.state : 'pending',
                lightLerp: Number.isFinite(item?.lightLerp) ? clamp01(item.lightLerp) : (item?.spoken ? clamp01(state.brightnessLerp || 0) : 0)
            }));
            state.currentSoulIndex = Math.max(0, Math.min(dataSouls.length, state.currentSoulIndex || 0));

            if (state.phase === 'idle') {
                state.phase = state.currentSoulIndex >= dataSouls.length ? 'center_wait' : 'soul_wait';
            }
            if (state.phase === 'soul_play') {
                state.phase = 'soul_wait';
            }
            if (state.phase === 'player_awaken') {
                state.phase = 'center_wait';
            }
            if (state.phase === 'blind_echo') {
                state.phase = state.bossDoorOpened ? 'done' : 'center_wait';
            }
            if (state.currentSoulIndex >= dataSouls.length) {
                state.centerVisible = true;
            }
            if (state.bossDoorOpened) {
                state.centerVisible = true;
                state.centerResolved = true;
                state.blindShown = true;
                state.phase = 'done';
                state.brightnessLerp = clamp01(state.brightnessLerp || 0);
                state.brightening = state.brightnessLerp < 0.999;
            }

            state.souls.forEach((soulState, index) => {
                if (soulState.spoken) {
                    soulState.lit = true;
                    soulState.state = 'idleDone';
                    return;
                }
                if (state.phase === 'soul_wait' && index === state.currentSoulIndex) {
                    soulState.state = 'preview';
                    return;
                }
                soulState.state = 'pending';
            });

            const door = room.doors?.up;
            if (door) {
                door.open = !!state.bossDoorOpened;
                door.locked = !state.bossDoorOpened;
            }
        }

        syncBossCombatState(room, state = this.getState(room)) {
            if (!room || !state || room.floor7Role !== 'boss') return;
            const boss = this.getBossEnemy(room);
            const locked = !state.combatEnabled && !room.cleared;
            if (boss) {
                boss.aiDisabled = locked;
                boss.invulnerable = locked;
                boss.floor7CombatLocked = locked;
                if (locked) {
                    boss.vx = 0;
                    boss.vy = 0;
                    boss.isCharging = false;
                    boss.chargeWarning = false;
                }
            }
        }

        ensureBossRewardArtifacts(room, state = this.getState(room)) {
            if (!room || !state || room.floor7Role !== 'boss' || !state.deathSequencePlayed) return;
            room.items = Array.isArray(room.items) ? room.items : [];

            const hasTotem = room.items.some(item => item?.type === 'totem' && item?.floor7BossReward);
            const hasGate = room.items.some(item => item?.type === 'ending_gate' && item?.floor7BossReward);
            if (hasTotem || hasGate) return;

            if (room.bossAftermath?.rewardsGranted && !room.bossAftermath.exitsSpawned) {
                this.spawnBossRewardTotem(room, { silent: true });
                return;
            }

            if (!room.bossAftermath && room.cleared) {
                const game = this.getGame();
                game?.spawnEndingGate?.({
                    room,
                    x: room.centerX,
                    y: room.centerY - 198,
                    name: '终局入口',
                    desc: '进入结局'
                });
                const gate = room.items[room.items.length - 1];
                if (gate) gate.floor7BossReward = true;
            }
        }

        onEnterEntryRoom(room) {
            const game = this.getGame();
            const state = this.getState(room);
            if (!state) return;
            this.clearLegacyDialogue(room);
            state.entered = true;
            if (!Number.isFinite(state.spawnX)) state.spawnX = game?.player?.x ?? room.centerX;
            if (!Number.isFinite(state.spawnY)) state.spawnY = game?.player?.y ?? room.centerY;
        }

        onEnterAwakeningRoom(room) {
            const state = this.getState(room);
            if (!state) return;
            this.clearLegacyDialogue(room);
            if (state.phase === 'idle') state.phase = 'soul_wait';
            this.syncAwakeningState(room, state);
        }

        onEnterBossRoom(room) {
            const state = this.getState(room);
            if (!state) return;
            this.clearLegacyDialogue(room);
            state.entered = true;
            if (!Number.isFinite(state.preBattleReadyAtMs) || state.preBattleReadyAtMs <= 0) {
                state.preBattleReadyAtMs = Date.now() + 1450;
            }
            const game = this.getGame();
            if (game) game.bossCombatDialogueState = null;
            this.syncBossCombatState(room, state);
        }

        captureStableCheckpoint(room = this.getGame()?.curRoom) {
            const game = this.getGame();
            if (!game || !room) return;
            game.captureCheckpoint(room, {
                playerX: game.player?.x,
                playerY: game.player?.y,
                floor: room.floor || game.currentFloor || 7
            });
            game.saveGame?.();
        }

        clearLegacyDialogue(room) {
            if (!room || room.__floor7LegacyDialogueCleared) return;
            room.__floor7LegacyDialogueCleared = true;
            const game = this.getGame();
            if (game) {
                game.pendingFloorIntroFloor = null;
                game.bossCombatDialogueState = null;
            }
            global.storyEventSystem?.destroy?.();
            this.getSubtitle()?.clear?.({ suppressComplete: true });
            this.getOverhead()?.stop?.({ suppressComplete: true });
        }

        playEntryLine(room, state, index) {
            const overhead = this.getOverhead();
            const data = global.Floor7AwakeningData?.entryLines || [];
            if (!overhead || !data[index]) return false;
            state.busy = true;
            return overhead.start([{
                text: data[index].text,
                anchor: 'player',
                color: '#f7f2e6',
                maxWidth: 240
            }], {
                lockPlayer: false,
                gap: 0.12,
                id: `floor7_entry_${index}`,
                onComplete: () => {
                    state.busy = false;
                    if (index === 0) state.line1Played = true;
                    if (index === 1) state.line2Played = true;
                    this.captureStableCheckpoint(room);
                }
            });
        }

        getInteractionContext() {
            const game = this.getGame();
            const room = game?.curRoom;
            if (!this.isFloor7Room(room)) return null;

            const subtitle = this.getSubtitle();
            const overhead = this.getOverhead();
            if (subtitle?.isBusy?.() || overhead?.isBusy?.()) {
                return { type: 'floor7_locked', label: '演出中' };
            }

            if (room.floor7Role !== 'awakening') return null;
            const state = this.getState(room);
            if (!state || state.busy) return { type: 'floor7_locked', label: '演出中' };

            const player = game?.player;
            const playerPos = getEntityCenter(player);
            const layout = this.getAwakeningLayout(room);
            const currentSoul = layout.souls[state.currentSoulIndex];
            if (state.phase === 'soul_wait' && currentSoul) {
                const candleAnchor = this.getCandleFlameWorldPoint(currentSoul.candleNode || {
                    x: currentSoul.candleX,
                    y: currentSoul.candleY
                });
                if (this.isNearByScreen(game?.camera, playerPos.x, playerPos.y, candleAnchor.x, candleAnchor.y, 84)) {
                    return { type: 'floor7_candle', label: '点亮' };
                }
            }
            if (state.phase === 'center_wait' && state.centerVisible && !state.centerResolved) {
                if (this.isNearByScreen(game?.camera, playerPos.x, playerPos.y, layout.centerPoint.x, layout.centerPoint.y, 82)) {
                    return { type: 'floor7_center', label: '汇流' };
                }
            }
            return null;
        }

        triggerCurrentCandle() {
            const game = this.getGame();
            const room = game?.curRoom;
            if (!room || room.floor7Role !== 'awakening') return false;
            const state = this.getState(room);
            const subtitle = this.getSubtitle();
            const overhead = this.getOverhead();
            if (!state || !overhead || state.busy || subtitle?.isBusy?.() || overhead.isBusy?.()) return false;
            if (state.phase !== 'soul_wait') return false;

            const layout = this.getAwakeningLayout(room);
            const idx = state.currentSoulIndex;
            const node = layout.souls[idx];
            const playerPos = getEntityCenter(game.player);
            if (!node) return false;
            const candleAnchor = this.getCandleFlameWorldPoint(node.candleNode || {
                x: node.candleX,
                y: node.candleY
            });
            if (!this.isNearByScreen(game?.camera, playerPos.x, playerPos.y, candleAnchor.x, candleAnchor.y, 84)) return false;

            const line = this.getSoulOverheadLine(room, idx);
            if (!line) return false;

            state.busy = true;
            state.phase = 'soul_play';
            state.souls[idx].lit = true;
            state.souls[idx].state = 'speaking';
            state.souls[idx].lightLerp = Number.isFinite(state.souls[idx].lightLerp) ? clamp01(state.souls[idx].lightLerp) : 0;
            state.orbPulseTimer = 0.8;

            return overhead.start([line], {
                lockPlayer: false,
                gap: 0.28,
                id: `floor7_soul_${idx}`,
                onComplete: () => {
                    state.busy = false;
                    state.souls[idx].spoken = true;
                    state.souls[idx].state = 'idleDone';
                    state.currentSoulIndex = idx + 1;
                    if (state.currentSoulIndex >= (global.Floor7AwakeningData?.souls?.length || 0)) {
                        state.phase = 'center_wait';
                        state.centerVisible = true;
                        state.brightening = true;
                        state.brightnessLerp = 0;
                        state.orbPulseTimer = 0.8;
                    } else {
                        state.phase = 'soul_wait';
                    }
                    this.syncAwakeningState(room, state);
                    this.captureStableCheckpoint(room);
                }
            });
        }

        triggerCurrentCenter() {
            const game = this.getGame();
            const room = game?.curRoom;
            if (!room || room.floor7Role !== 'awakening') return false;
            const state = this.getState(room);
            const subtitle = this.getSubtitle();
            const overhead = this.getOverhead();
            if (!state || !overhead || state.busy || subtitle?.isBusy?.() || overhead.isBusy?.()) return false;
            if (state.phase !== 'center_wait' || !state.centerVisible || state.centerResolved) return false;

            const layout = this.getAwakeningLayout(room);
            const playerPos = getEntityCenter(game.player);
            if (!this.isNearByScreen(game?.camera, playerPos.x, playerPos.y, layout.centerPoint.x, layout.centerPoint.y, 82)) return false;

            state.busy = true;
            state.phase = 'player_awaken';

            return overhead.start(this.getCenterOverheadLines(), {
                lockPlayer: false,
                gap: 0.30,
                id: 'floor7_center_awaken',
                onComplete: () => {
                    state.busy = false;
                    state.phase = 'center_wait';
                    state.centerResolved = true;
                    state.blindShown = true;
                    state.nextBlindEchoAtMs = Date.now() + 1300;
                    this.syncAwakeningState(room, state);
                    this.captureStableCheckpoint(room);
                }
            });
        }

        startBlindEcho(room, state = this.getState(room)) {
            const subtitle = this.getSubtitle();
            const overhead = this.getOverhead();
            if (!room || !state || room.floor7Role !== 'awakening' || !overhead) return false;
            if (state.busy || subtitle?.isBusy?.() || overhead.isBusy?.() || !state.centerResolved || !state.blindShown || state.bossDoorOpened) return false;

            state.busy = true;
            state.phase = 'blind_echo';
            return overhead.start(this.getBlindOverheadLines(room), {
                lockPlayer: false,
                gap: 0.34,
                id: 'floor7_blind_echo',
                onComplete: () => {
                    state.busy = false;
                    state.phase = 'done';
                    state.bossDoorOpened = true;
                    if ((state.brightnessLerp || 0) < 0.999) state.brightening = true;
                    this.syncAwakeningState(room, state);
                    this.captureStableCheckpoint(room);
                }
            });
        }

        startBossPreBattle(room, state = this.getState(room)) {
            const overhead = this.getOverhead();
            const subtitle = this.getSubtitle();
            if (!room || !state || room.floor7Role !== 'boss' || !overhead) return false;
            if (state.busy || state.preBattlePlayed || subtitle?.isBusy?.() || overhead.isBusy?.()) return false;

            const boss = this.getBossEnemy(room);
            if (!boss) return false;

            state.busy = true;
            state.entered = true;
            state.combatEnabled = false;
            this.syncBossCombatState(room, state);
            this.getGame()?.playerOverheadDialogue?.stop?.();

            const lines = this.withBeatTiming((global.Floor7AwakeningData?.bossPreBattle || []).map((line) => ({
                text: line.text,
                anchor: line.speaker === 'master' ? 'boss' : 'player',
                color: line.speaker === 'master' ? '#b8d8ff' : '#9fe6b8',
                maxWidth: line.speaker === 'master' ? 320 : 280
            })), {
                baseDuration: 2.5,
                perChar: 0.13,
                maxDuration: 7.6
            });
            return overhead.start(lines, {
                lockPlayer: true,
                gap: 0.36,
                id: 'floor7_boss_prebattle',
                onComplete: () => {
                    state.busy = false;
                    state.preBattlePlayed = true;
                    state.combatEnabled = true;
                    this.syncBossCombatState(room, state);
                    this.captureStableCheckpoint(room);
                }
            });
        }

        spawnBossRewardTotem(room, options = {}) {
            if (!room) return false;
            room.items = Array.isArray(room.items) ? room.items : [];
            if (room.items.some(item => item?.type === 'totem' && item?.floor7BossReward)) return false;

            const totem = global.TOTEMS?.[this.rewardTotemId];
            const spawnX = room.centerX;
            const spawnY = room.centerY - 132;
            room.items.push({
                x: spawnX,
                y: spawnY,
                type: 'totem',
                totemId: this.rewardTotemId,
                icon: totem?.icon || '🗿',
                name: totem?.name || `图腾 ${this.rewardTotemId}`,
                floor7BossReward: true
            });
            if (!options.silent) {
                const game = this.getGame();
                game?.particles?.sparkle?.(spawnX, spawnY - 8, '#ffe27a', 16);
                game?.damageNumbers?.spawn?.(spawnX, spawnY - 28, '图腾出现', {
                    color: '#ffe27a',
                    size: 18,
                    life: 1.8
                });
            }
            return true;
        }

        onBossDefeated(room, bossEnemy) {
            if (!room || room.floor7Role !== 'boss') return false;
            const state = this.getState(room);
            const overhead = this.getOverhead();
            const subtitle = this.getSubtitle();
            if (!state || !overhead || state.deathSequencePlayed || state.busy) return false;
            if (subtitle?.isBusy?.() || overhead.isBusy?.()) return false;

            state.busy = true;
            state.deathSequencePlayed = true;
            state.combatEnabled = true;

            const game = this.getGame();
            if (room.bossAftermath) {
                room.bossAftermath.dialogueStarted = true;
            }

            const lines = (global.Floor7AwakeningData?.bossAfter || []).map((line) => ({
                text: line.text,
                anchor: line.speaker === 'master' ? 'boss' : 'player',
                color: line.speaker === 'master' ? '#b8d8ff' : '#9fe6b8',
                maxWidth: line.speaker === 'master' ? 300 : 280
            }));
            return overhead.start(this.withBeatTiming(lines, {
                baseDuration: 2.4,
                perChar: 0.14,
                maxDuration: 7.0
            }), {
                lockPlayer: false,
                gap: 0.34,
                id: 'floor7_boss_after',
                onComplete: () => {
                    state.busy = false;
                    room._bossRewardResolved = true;
                    if (room.bossAftermath) {
                        room.bossAftermath.dialogueStarted = true;
                        room.bossAftermath.rewardsGranted = true;
                        room.bossAftermath.exitsSpawned = false;
                    }
                    if (!room._floor7ExplosiveDropsGranted) {
                        game?.spawnExplosiveDrops?.(bossEnemy || room.bossAftermath?.corpseEnemy || {
                            x: room.centerX,
                            y: room.centerY - 40,
                            cx: room.centerX,
                            cy: room.centerY - 60,
                            exp: 80,
                            gold: 40,
                            tier: 4,
                            color: '#7fd8ff',
                            isBoss: true
                        });
                        room._floor7ExplosiveDropsGranted = true;
                    }
                    this.spawnBossRewardTotem(room);
                    this.captureStableCheckpoint(room);
                }
            });
        }

        updateEntryRoom(room, dt) {
            const state = this.getState(room);
            const subtitle = this.getSubtitle();
            const overhead = this.getOverhead();
            if (!state || !room) return;
            room.hiddenLightSources = [];
            room.floor7AwakeningDarknessAlpha = null;
            this.onEnterEntryRoom(room);
            if (state.busy || subtitle?.isBusy?.() || overhead?.isBusy?.()) return;

            const game = this.getGame();
            const moved = distance(game?.player?.x || 0, game?.player?.y || 0, state.spawnX || room.centerX, state.spawnY || room.centerY);
            if (!state.line1Played && moved >= 86) {
                this.playEntryLine(room, state, 0);
                return;
            }
            if (state.line1Played && !state.line2Played && moved >= 228) {
                this.playEntryLine(room, state, 1);
            }
        }

        updateAwakeningRoom(room, dt) {
            const state = this.getState(room);
            if (!state || !room) return;
            this.onEnterAwakeningRoom(room);
            state.souls.forEach((soulState) => {
                if (!soulState) return;
                if (soulState.lit) {
                    soulState.lightLerp = clamp01((soulState.lightLerp || 0) + dt * 0.60);
                } else {
                    soulState.lightLerp = 0;
                }
            });
            state.orbPulseTimer = Math.max(0, (state.orbPulseTimer || 0) - dt);
            if (state.brightening) {
                state.brightnessLerp = clamp01((state.brightnessLerp || 0) + dt * 0.32);
                if (state.brightnessLerp >= 0.999) state.brightening = false;
            }
            this.syncAwakeningPresentationLighting(room, state, this.getAwakeningLayout(room), Date.now() / 1000);
            this.syncAwakeningState(room, state);
            if (state.centerResolved && state.blindShown && !state.bossDoorOpened && !state.busy && !this.getSubtitle()?.isBusy?.() && !this.getOverhead()?.isBusy?.() && Date.now() >= (state.nextBlindEchoAtMs || 0)) {
                this.startBlindEcho(room, state);
            }
        }

        updateBossRoom(room) {
            const state = this.getState(room);
            if (!state || !room) return;
            room.hiddenLightSources = [];
            room.floor7AwakeningDarknessAlpha = null;
            this.onEnterBossRoom(room);
            this.syncBossCombatState(room, state);
            if (room.cleared || state.deathSequencePlayed || state.preBattlePlayed || state.busy) return;
            if (this.getSubtitle()?.isBusy?.() || this.getOverhead()?.isBusy?.()) return;
            if (Date.now() < (state.preBattleReadyAtMs || 0)) return;
            this.startBossPreBattle(room, state);
        }

        update(dt) {
            const room = this.getGame()?.curRoom;
            if (!this.isFloor7Room(room)) return false;
            if (room.floor7Role === 'entry') this.updateEntryRoom(room, dt);
            if (room.floor7Role === 'awakening') this.updateAwakeningRoom(room, dt);
            if (room.floor7Role === 'boss') this.updateBossRoom(room, dt);
            return true;
        }

        drawSoftEllipse(ctx, x, y, rx, ry, color, alpha, blur = 0) {
            if (!ctx || alpha <= 0 || rx <= 0 || ry <= 0) return;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = color;
            if (blur > 0) {
                ctx.shadowColor = color;
                ctx.shadowBlur = blur;
            }
            ctx.beginPath();
            ctx.ellipse(x, y, rx, ry, 0, 0, TWO_PI);
            ctx.fill();
            ctx.restore();
        }

        drawWorldTag(ctx, x, y, text, alpha = 1) {
            if (!text || alpha <= 0) return;
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.font = '18px "ZCOOL KuaiLe Local", sans-serif';
            const metrics = ctx.measureText(text);
            const w = Math.max(58, metrics.width + 22);
            const h = 28;
            ctx.fillStyle = 'rgba(9, 12, 18, 0.72)';
            ctx.beginPath();
            ctx.roundRect(x - w * 0.5, y - h * 0.5, w, h, 12);
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 233, 188, 0.26)';
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.fillStyle = '#f7ecd2';
            ctx.fillText(text, x, y + 1);
            ctx.restore();
        }

        getCandleFlameWorldPoint(candleNode) {
            if (!candleNode) return { x: 0, y: 0 };
            const nodeScale = Number.isFinite(candleNode.scale) ? candleNode.scale : 1;
            const flameOffsetX = (Number.isFinite(candleNode.flameOffsetX) ? candleNode.flameOffsetX : 0) * nodeScale;
            const flameOffsetY = (Number.isFinite(candleNode.flameOffsetY) ? candleNode.flameOffsetY : -29) * nodeScale;
            return {
                x: candleNode.x + flameOffsetX,
                y: candleNode.y + flameOffsetY
            };
        }

        isNearByScreen(camera, ax, ay, bx, by, radiusPx) {
            if (!camera || !Number.isFinite(radiusPx) || radiusPx <= 0) return false;
            const a = camera.worldToScreen(ax, ay);
            const b = camera.worldToScreen(bx, by);
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            return Math.hypot(dx, dy) <= radiusPx;
        }

        drawAwakeningBackdrop(ctx, camera, state, layout, time) {
            return;
        }

        normalizeBossFrameEntry(entry) {
            if (!entry) return null;
            if (typeof entry === 'string') {
                return { src: entry, x: 0, y: 0, scale: 1, rot: 0, flipX: false };
            }
            return {
                src: String(entry.src || ''),
                x: Number.isFinite(entry.x) ? entry.x : 0,
                y: Number.isFinite(entry.y) ? entry.y : 0,
                scale: Number.isFinite(entry.scale) ? entry.scale : 1,
                rot: Number.isFinite(entry.rot) ? entry.rot : 0,
                flipX: !!entry.flipX
            };
        }

        getSpiritSprite(src) {
            if (!src) return null;
            const resolvedSrc = global.RuntimeAssetBase?.resolve?.(src) || src;
            let image = this.spiritSpriteCache.get(resolvedSrc);
            if (!image) {
                image = new Image();
                image.src = resolvedSrc;
                this.spiritSpriteCache.set(resolvedSrc, image);
            }
            if (!image.complete || image.naturalWidth <= 0 || image.naturalHeight <= 0) return null;
            return image;
        }

        drawSpiritFigure(ctx, camera, node, time, options = {}) {
            if (!node) return false;

            const pos = camera.worldToScreen(node.x, node.y);
            const baseW = Number.isFinite(node.drawW) ? node.drawW : (options.defaultW || 230);
            const baseH = Number.isFinite(node.drawH) ? node.drawH : (options.defaultH || 314);
            const scale = Number.isFinite(node.scale) ? node.scale : 1;
            const scaleX = (Number.isFinite(node.scaleX) ? node.scaleX : 1) * scale;
            const scaleY = (Number.isFinite(node.scaleY) ? node.scaleY : 1) * scale;
            const facingScale = options.flipX ? -1 : 1;
            const bob = Math.sin(time * (options.bobSpeed || 1.7) + (node.index || 0) * 0.8) * (options.bobAmplitude || 0);
            if (options.drawBaseShadow !== false) {
                this.drawSoftEllipse(
                    ctx,
                    pos.x,
                    pos.y + baseH * 0.26 * scale,
                    baseW * 0.18 * scale,
                    baseH * 0.06 * scale,
                    '#0b1016',
                    options.shadowAlpha || 0.28,
                    12
                );
            }

            const image = this.getSpiritSprite(options.src);
            if (!image) {
                this.drawSoftEllipse(ctx, pos.x, pos.y + bob, baseW * 0.18 * scale, baseH * 0.32 * scale, options.fallbackColor || '#10161e', options.fallbackAlpha || 0.55, 18);
                return false;
            }

            const ratio = image.naturalWidth > 0 && image.naturalHeight > 0
                ? image.naturalWidth / image.naturalHeight
                : 1;
            let drawW = baseW;
            let drawH = baseH;
            if (ratio > 0) {
                const boxRatio = baseW / Math.max(baseH, 1);
                if (ratio >= boxRatio) {
                    drawW = baseW;
                    drawH = drawW / ratio;
                } else {
                    drawH = baseH;
                    drawW = drawH * ratio;
                }
            }
            const drawX = -drawW * 0.5;
            const drawY = -drawH * 0.5;

            const entityBrightness = getAwakeningEntityBrightness();
            ctx.save();
            ctx.translate(pos.x, pos.y + bob);
            if (Number.isFinite(node.rotation) && node.rotation !== 0) ctx.rotate(node.rotation);
            ctx.scale(scaleX * facingScale, scaleY);

            if (options.solidColor) {
                ctx.globalAlpha = Number.isFinite(options.alpha) ? options.alpha : 1;
                ctx.filter = 'none';
                ctx.drawImage(image, drawX, drawY, drawW, drawH);
                ctx.globalCompositeOperation = 'source-atop';
                ctx.fillStyle = options.solidColor;
                ctx.fillRect(drawX, drawY, drawW, drawH);
                ctx.restore();
                return true;
            }

            if (options.glowAlpha > 0) {
                ctx.save();
                ctx.globalAlpha = options.glowAlpha;
                ctx.filter = `brightness(${(options.glowBrightness || 0.35) * entityBrightness}) saturate(${options.glowSaturation || 0.8})`;
                ctx.shadowColor = options.glowColor || 'rgba(148, 214, 255, 0.52)';
                ctx.shadowBlur = options.glowBlur || 18;
                ctx.drawImage(image, drawX, drawY, drawW, drawH);
                ctx.restore();
            }

            ctx.globalAlpha = options.alpha || 0.72;
            ctx.filter = `brightness(${(options.brightness || 0.32) * entityBrightness}) saturate(${options.saturation || 0.82})`;
            ctx.drawImage(image, drawX, drawY, drawW, drawH);
            ctx.restore();
            return true;
        }

        drawSoul(ctx, camera, soulPoint, state, time, roomState) {
            if (!state || state.state === 'pending') return;
            const preview = state.state === 'preview';
            const speaking = state.state === 'speaking';
            const done = state.state === 'idleDone';
            const soulData = global.Floor7AwakeningData?.souls?.[soulPoint.index] || null;
            const soulOrdinal = (Number.isFinite(soulPoint?.index) ? soulPoint.index : 0) + 1;
            const alphaMul = soulOrdinal <= 2 ? 0.35 : 0.6;
            const litBlend = state?.lit ? clamp01(state?.lightLerp || 0) : 0;
            const baseBrightness = speaking ? 0.86 : (done ? 0.62 : 0.48);
            const targetBrightness = speaking ? 1.12 : (done ? 0.94 : 0.66);
            const baseSaturation = speaking ? 0.96 : (done ? 0.82 : 0.72);
            const targetSaturation = speaking ? 1.06 : (done ? 0.92 : 0.72);
            const baseGlow = speaking ? 0.24 : (done ? 0.12 : 0.02);
            const targetGlow = speaking ? 0.40 : (done ? 0.28 : 0.20);
            this.drawSpiritFigure(ctx, camera, soulPoint.soulNode || soulPoint, time, {
                src: soulData?.sprite,
                alpha: alphaMul,
                brightness: baseBrightness + (targetBrightness - baseBrightness) * litBlend,
                saturation: baseSaturation + (targetSaturation - baseSaturation) * litBlend,
                glowAlpha: baseGlow + (targetGlow - baseGlow) * litBlend,
                glowBrightness: 0.40 + 0.80 * litBlend,
                glowSaturation: 0.52 + 0.50 * litBlend,
                glowColor: speaking ? 'rgba(255, 226, 162, 0.62)' : (done ? 'rgba(214, 236, 255, 0.42)' : 'rgba(90, 120, 140, 0.20)'),
                glowBlur: speaking ? 26 : (done ? 20 : 12),
                shadowAlpha: preview ? 0.20 : 0.26,
                drawBaseShadow: false,
                fallbackAlpha: preview ? 0.52 : 0.60,
                defaultW: 230,
                defaultH: 314,
                bobAmplitude: speaking ? 8 : (preview ? 3 : 1.5),
                bobSpeed: speaking ? 2.1 : 1.6,
                flipX: soulPoint.facing < 0
            });
        }

        drawCandle(ctx, camera, soulPoint, state, time, showPrompt) {
            const candleNode = soulPoint.candleNode || {
                x: soulPoint.candleX,
                y: soulPoint.candleY,
                index: Number.isFinite(soulPoint.index) ? soulPoint.index : 0,
                scale: 1,
                rotation: 0
            };
            const pos = camera.worldToScreen(candleNode.x, candleNode.y);
            const preview = state?.state === 'preview';
            const speaking = state?.state === 'speaking';
            const lit = !!state?.lit;
            const done = state?.state === 'idleDone';
            ctx.save();
            global.HiddenRoomSystemRuntime?.drawCandleNode?.(ctx, camera, candleNode, lit, time);

            if (showPrompt) {
                this.drawWorldTag(ctx, pos.x, pos.y - 52, '点亮', 0.96);
            }
            ctx.restore();
        }

        drawCenterPoint(ctx, camera, layout, state, time, showPrompt) {
            if (!layout?.centerPoint) return;
            const pos = camera.worldToScreen(layout.centerPoint.x, layout.centerPoint.y);
            const runtime = global.HiddenRoomSystemRuntime;
            const node = layout.centerPoint.node || layout.centerPoint;
            const scale = Number.isFinite(node.scale) ? node.scale : 1;
            const scaleX = Number.isFinite(node.scaleX) ? node.scaleX : 1;
            const scaleY = Number.isFinite(node.scaleY) ? node.scaleY : 1;
            const alpha = Number.isFinite(node.alpha) ? node.alpha : 1;
            const baseW = Math.max(36, Number.isFinite(node.drawW) ? node.drawW : 110) * scale;
            const baseH = Math.max(36, Number.isFinite(node.drawH) ? node.drawH : 110) * scale;
            if (runtime?.drawSecretSpriteCentered) {
                runtime.drawSecretSpriteCentered(ctx, camera, 'item_crystal_ball', node.x, node.y - 6, Math.max(58, baseW * 0.58) * scaleX, Math.max(58, baseH * 0.58) * scaleY, {
                    alpha: Math.min(1, alpha),
                    brightness: 0.92,
                    exactSize: true
                });
            } else {
                const pos = camera.worldToScreen(layout.centerPoint.x, layout.centerPoint.y);
                ctx.save();
                ctx.strokeStyle = 'rgba(198, 236, 255, 0.82)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, 20, 0, TWO_PI);
                ctx.stroke();
                ctx.fillStyle = 'rgba(226, 245, 255, 0.9)';
                ctx.beginPath();
                ctx.arc(pos.x, pos.y, 4, 0, TWO_PI);
                ctx.fill();
                ctx.restore();
            }
            if (showPrompt) this.drawWorldTag(ctx, pos.x, pos.y - 48, '汇流', 0.92);
        }

        drawBlindEcho(ctx, camera, layout, state, time) {
            const editorActive = !!global.HiddenRoomLayoutEditor?.isActive?.();
            if (!state?.blindShown && !editorActive) return;
            this.drawSpiritFigure(ctx, camera, layout.blindEchoPoint.node || layout.blindEchoPoint, time, {
                src: global.Floor7AwakeningData?.blindEchoSprite,
                alpha: 1,
                brightness: 1,
                saturation: 1,
                glowAlpha: 0,
                glowBrightness: 0,
                glowSaturation: 0,
                glowColor: 'rgba(0,0,0,0)',
                glowBlur: 0,
                shadowAlpha: 0.12,
                fallbackAlpha: 1,
                fallbackColor: '#000000',
                defaultW: 232,
                defaultH: 304,
                bobAmplitude: 7,
                bobSpeed: 1.4,
                flipX: false
            });
        }

        drawWorld(ctx, camera) {
            const game = this.getGame();
            const room = game?.curRoom;
            if (!ctx || !camera || !this.isFloor7Room(room)) return;
            if (room.floor7Role !== 'awakening') return;

            const state = this.getState(room);
            const layout = this.getAwakeningLayout(room);
            const time = Date.now() / 1000;
            const currentSoul = layout.souls[state?.currentSoulIndex] || null;
            const player = game?.player;
            const playerPos = getEntityCenter(player);
            const hideSouls = false;
            const playerNearCurrentCandle = currentSoul ? (() => {
                const candleAnchor = this.getCandleFlameWorldPoint(currentSoul.candleNode || {
                    x: currentSoul.candleX,
                    y: currentSoul.candleY
                });
                return this.isNearByScreen(camera, playerPos.x, playerPos.y, candleAnchor.x, candleAnchor.y, 94);
            })() : false;
            const playerNearCenter = this.isNearByScreen(camera, playerPos.x, playerPos.y, layout.centerPoint.x, layout.centerPoint.y, 92);

            const bounds = layout.bounds;
            const screenTL = camera.worldToScreen(bounds.left, bounds.top);
            const screenBR = camera.worldToScreen(bounds.right, bounds.bottom);
            const clipX = Math.min(screenTL.x, screenBR.x);
            const clipY = Math.min(screenTL.y, screenBR.y);
            const clipW = Math.abs(screenBR.x - screenTL.x);
            const clipH = Math.abs(screenBR.y - screenTL.y);

            ctx.save();
            if (clipW > 0 && clipH > 0) {
                ctx.beginPath();
                ctx.rect(clipX, clipY, clipW, clipH);
                ctx.clip();
            }

            this.drawAwakeningBackdrop(ctx, camera, state, layout, time);

            layout.souls.forEach((point, index) => {
                const soulState = state?.souls?.[index];
                const showPrompt = state?.phase === 'soul_wait' && index === state?.currentSoulIndex && playerNearCurrentCandle;
                if (!hideSouls) this.drawSoul(ctx, camera, point, soulState, time, state);
                this.drawCandle(ctx, camera, point, soulState, time, showPrompt);
            });

            this.drawCenterPoint(ctx, camera, layout, state, time, state?.phase === 'center_wait' && state.centerVisible && !state.centerResolved && playerNearCenter);
            this.drawBlindEcho(ctx, camera, layout, state, time);
            ctx.restore();
        }

        drawOverlay(ctx) {
            const game = this.getGame();
            const room = game?.curRoom;
            if (!ctx || !this.isFloor7Room(room)) return;

            if (room.floor7Role === 'awakening') {
                return;
            }
        }

        serializeRoomState(room) {
            const state = this.getState(room);
            if (!state) return null;
            if (room.floor7Role === 'entry') {
                return {
                    entered: !!state.entered,
                    line1Played: !!state.line1Played,
                    line2Played: !!state.line2Played,
                    spawnX: Number.isFinite(state.spawnX) ? state.spawnX : null,
                    spawnY: Number.isFinite(state.spawnY) ? state.spawnY : null
                };
            }
            if (room.floor7Role === 'awakening') {
                return {
                    phase: state.phase,
                    currentSoulIndex: state.currentSoulIndex,
                    centerVisible: !!state.centerVisible,
                    centerResolved: !!state.centerResolved,
                    blindShown: !!state.blindShown,
                    bossDoorOpened: !!state.bossDoorOpened,
                    brightening: !!state.brightening,
                    brightnessLerp: Number.isFinite(state.brightnessLerp) ? state.brightnessLerp : 0,
                    orbPulseTimer: Number.isFinite(state.orbPulseTimer) ? state.orbPulseTimer : 0,
                    nextBlindEchoAtMs: Number.isFinite(state.nextBlindEchoAtMs) ? state.nextBlindEchoAtMs : 0,
                    busy: !!state.busy,
                    souls: state.souls.map(soul => ({
                        lit: !!soul.lit,
                        spoken: !!soul.spoken,
                        state: soul.state,
                        lightLerp: Number.isFinite(soul.lightLerp) ? clamp01(soul.lightLerp) : 0
                    }))
                };
            }
            if (room.floor7Role === 'boss') {
                return {
                    entered: !!state.entered,
                    preBattlePlayed: !!state.preBattlePlayed,
                    combatEnabled: !!state.combatEnabled,
                    deathSequencePlayed: !!state.deathSequencePlayed
                };
            }
            return null;
        }

        restoreRoomState(room, savedState) {
            if (!this.isFloor7Room(room)) return;

            if (room.floor7Role === 'entry') {
                room[STATE_KEY] = Object.assign(makeEntryState(), deepClone(savedState || {}), { busy: false });
                return;
            }

            if (room.floor7Role === 'awakening') {
                const state = Object.assign(makeAwakeningState(), deepClone(savedState || {}));
                state.phase = typeof state.phase === 'string' ? state.phase : 'idle';
                state.currentSoulIndex = Number.isFinite(state.currentSoulIndex) ? state.currentSoulIndex : 0;
                state.centerVisible = !!state.centerVisible;
                state.centerResolved = !!state.centerResolved;
                state.blindShown = !!state.blindShown;
                state.bossDoorOpened = !!state.bossDoorOpened;
                state.brightening = !!state.brightening;
                state.brightnessLerp = Number.isFinite(state.brightnessLerp) ? clamp01(state.brightnessLerp) : 0;
                state.orbPulseTimer = Number.isFinite(state.orbPulseTimer) ? Math.max(0, state.orbPulseTimer) : 0;
                state.nextBlindEchoAtMs = Number.isFinite(state.nextBlindEchoAtMs) ? state.nextBlindEchoAtMs : 0;
                state.busy = false;
                room[STATE_KEY] = state;
                this.syncAwakeningState(room, state);
                return;
            }

            if (room.floor7Role === 'boss') {
                const state = Object.assign(makeBossState(), deepClone(savedState || {}), { busy: false });
                room[STATE_KEY] = state;
                this.syncBossCombatState(room, state);
                this.ensureBossRewardArtifacts(room, state);
            }
        }
    }

    global.Floor7AwakeningSystem = Floor7AwakeningSystem;
})(window);
