const DEFAULT_NORMAL_ROOM_MODE_DISTRIBUTION = [
    { id: 'normal_default', name: '普通房模式1', weight: 80, enabled: true, kind: 'default', spawnMultiplier: 1 },
    { id: 'normal_chick', name: '小鸡房', weight: 4, enabled: true, kind: 'single_t1', enemyBaseId: 'chick', spawnMultiplier: 2 },
    { id: 'normal_bat', name: '蝙蝠房', weight: 4, enabled: true, kind: 'single_t1', enemyBaseId: 'bat', spawnMultiplier: 2 },
    { id: 'normal_rabbit', name: '兔子房', weight: 4, enabled: true, kind: 'single_t1', enemyBaseId: 'rabbit2', spawnMultiplier: 2 },
    { id: 'normal_snail', name: '蜗牛房', weight: 4, enabled: true, kind: 'single_t1', enemyBaseId: 'snail', spawnMultiplier: 2 },
    { id: 'normal_pigeon', name: '鸽群房', weight: 4, enabled: true, kind: 'single_t1', enemyBaseId: 'pigeon', spawnMultiplier: 2 }
];

﻿class MapGenerator {
    constructor(seedInput = null) {
        this.setSeed(seedInput || Date.now());
    }

    deriveSeedInput(floor = 1, explicitSeed = null) {
        if (explicitSeed != null && explicitSeed !== '') return explicitSeed;
        if (window.game && typeof window.game.getFloorMapSeed === 'function') {
            return window.game.getFloorMapSeed(floor);
        }
        const runSeed = window.game?.runSeed || 'SEEDLESS';
        return `${runSeed}-F${floor}`;
    }

    hashSeed(value) {
        const str = String(value || '0');
        let h = 2166136261 >>> 0;
        for (let i = 0; i < str.length; i++) {
            h ^= str.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        return h >>> 0;
    }

    mulberry32(a) {
        return function() {
            let t = a += 0x6D2B79F5;
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };
    }

    setSeed(seedInput) {
        this.seedInput = String(seedInput || Date.now());
        this.seedLabel = this.seedInput;
        this._rng = this.mulberry32(this.hashSeed(this.seedInput));
    }

    random() {
        return this._rng ? this._rng() : Math.random();
    }

    randInt(min, max) {
        return Math.floor(this.random() * (max - min + 1)) + min;
    }

    shuffle(items) {
        const arr = items.slice();
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(this.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }

    pick(arr) {
        if (!Array.isArray(arr) || arr.length === 0) return null;
        return arr[Math.floor(this.random() * arr.length)];
    }

    weightedPick(entries, weightFn = (entry) => entry?.weight ?? 1) {
        const pool = (entries || []).filter(Boolean);
        if (pool.length === 0) return null;
        const total = pool.reduce((sum, entry) => sum + Math.max(0, Number(weightFn(entry)) || 0), 0);
        if (total <= 0) return pool[pool.length - 1];
        let roll = this.random() * total;
        for (const entry of pool) {
            roll -= Math.max(0, Number(weightFn(entry)) || 0);
            if (roll <= 0) return entry;
        }
        return pool[pool.length - 1];
    }

    createNode(gx, gy, meta = {}) {
        return {
            id: `${gx},${gy}`,
            gx,
            gy,
            neighbors: new Set(),
            roomType: 'normal',
            onMainPath: false,
            mainIndex: -1,
            depth: 0,
            templateKey: null,
            ...meta
        };
    }

    addNode(nodes, occupied, gx, gy, meta = {}) {
        const node = this.createNode(gx, gy, meta);
        nodes.push(node);
        occupied.set(node.id, node);
        return node;
    }

    connectNodes(a, b) {
        if (!a || !b || a === b) return;
        a.neighbors.add(b.id);
        b.neighbors.add(a.id);
    }

    getDirectionDefs() {
        return [
            { dx: 0, dy: -1, name: 'up', opp: 'down' },
            { dx: 1, dy: 0, name: 'right', opp: 'left' },
            { dx: 0, dy: 1, name: 'down', opp: 'up' },
            { dx: -1, dy: 0, name: 'left', opp: 'right' }
        ];
    }

    getAvailableExpansionDirs(node, occupied) {
        return this.getDirectionDefs().filter((dir) => !occupied.has(`${node.gx + dir.dx},${node.gy + dir.dy}`));
    }

    buildTopology(floor, maxRooms) {
        const nodes = [];
        const occupied = new Map();
        const start = this.addNode(nodes, occupied, 0, 0, { onMainPath: true, mainIndex: 0 });

        const desiredMainPathLength = Math.max(5, Math.min(maxRooms - 2, 4 + floor));
        let current = start;
        let previousDir = null;

        for (let step = 1; step < desiredMainPathLength; step++) {
            let choices = this.getAvailableExpansionDirs(current, occupied);
            if (choices.length === 0) {
                const rescueCandidates = nodes
                    .filter((node) => node.onMainPath)
                    .map((node) => ({ node, dirs: this.getAvailableExpansionDirs(node, occupied) }))
                    .filter((entry) => entry.dirs.length > 0)
                    .sort((a, b) => b.node.mainIndex - a.node.mainIndex);
                if (rescueCandidates.length === 0) break;
                current = rescueCandidates[0].node;
                choices = rescueCandidates[0].dirs;
            }

            const weightedChoices = choices.map((dir) => {
                let weight = 1;
                if (previousDir && dir.name === previousDir.name) weight += 1.5;
                const nextDist = Math.abs(current.gx + dir.dx) + Math.abs(current.gy + dir.dy);
                weight += nextDist * 0.25;
                return { dir, weight };
            });
            const picked = this.weightedPick(weightedChoices, (entry) => entry.weight)?.dir || choices[0];
            const next = this.addNode(nodes, occupied, current.gx + picked.dx, current.gy + picked.dy, {
                onMainPath: true,
                mainIndex: step
            });
            this.connectNodes(current, next);
            previousDir = picked;
            current = next;
            if (nodes.length >= maxRooms) break;
        }

        let attempts = 0;
        while (nodes.length < maxRooms && attempts < maxRooms * 120) {
            attempts++;
            const host = this.weightedPick(
                nodes.filter((node) => node.neighbors.size < 3),
                (node) => {
                    const branchBias = node.onMainPath ? 1.6 : 1.1;
                    const leafBias = node.neighbors.size <= 1 ? 1.4 : 1;
                    return branchBias * leafBias * (1 + node.depth * 0.12);
                }
            );
            if (!host) break;
            const dirs = this.shuffle(this.getAvailableExpansionDirs(host, occupied));
            if (dirs.length === 0) continue;
            const picked = dirs[0];
            const child = this.addNode(nodes, occupied, host.gx + picked.dx, host.gy + picked.dy, { onMainPath: false, mainIndex: -1 });
            this.connectNodes(host, child);
            this.computeDepths(nodes, start);
        }

        this.computeDepths(nodes, start);
        return { nodes, start };
    }

    computeDepths(nodes, start) {
        const map = new Map(nodes.map((node) => [node.id, node]));
        for (const node of nodes) node.depth = Infinity;
        start.depth = 0;
        const queue = [start];
        while (queue.length) {
            const node = queue.shift();
            for (const nextId of node.neighbors) {
                const next = map.get(nextId);
                if (!next) continue;
                if (next.depth > node.depth + 1) {
                    next.depth = node.depth + 1;
                    queue.push(next);
                }
            }
        }
    }

    isLeaf(node, start) {
        return !!node && node !== start && node.neighbors.size <= 1;
    }

    assignSpecialTypes(graph, floor) {
        const { nodes, start } = graph;
        const assigned = new Set([start.id]);
        start.roomType = 'start';

        const leaves = nodes.filter((node) => this.isLeaf(node, start));
        const boss = this.weightedPick(
            leaves.length > 0 ? leaves : nodes.filter((node) => node !== start),
            (node) => (node.depth + 1) * (node.onMainPath ? 2.2 : 1.2)
        );
        if (boss) {
            boss.roomType = 'boss';
            assigned.add(boss.id);
        }

        const treasureCandidates = nodes.filter((node) => !assigned.has(node.id) && this.isLeaf(node, start));
        const treasure = this.weightedPick(
            treasureCandidates.length > 0 ? treasureCandidates : nodes.filter((node) => !assigned.has(node.id)),
            (node) => (node.onMainPath ? 0.45 : 1.8) * (node.depth + 1)
        );
        if (treasure) {
            treasure.roomType = 'treasure';
            assigned.add(treasure.id);
        }

        const bossDepth = boss?.depth || Math.max(...nodes.map((node) => node.depth));
        const shopCandidates = nodes.filter((node) => {
            if (assigned.has(node.id) || node === start || node === boss) return false;
            if (node.depth < 2 || node.depth >= bossDepth) return false;
            return true;
        });
        const shop = this.weightedPick(
            shopCandidates.length > 0 ? shopCandidates : nodes.filter((node) => !assigned.has(node.id) && node !== start && node !== boss),
            (node) => {
                const midBias = 1 - Math.abs((node.depth / Math.max(bossDepth, 1)) - 0.58);
                const branchBias = node.onMainPath ? 1.2 : 1;
                return Math.max(0.25, midBias) * branchBias;
            }
        );
        if (shop) {
            shop.roomType = 'shop';
            assigned.add(shop.id);
        }

        const eliteCandidates = nodes.filter((node) => {
            if (assigned.has(node.id) || node === start || node === boss) return false;
            return node.depth >= Math.max(2, Math.floor(bossDepth * 0.45));
        });
        const elite = this.weightedPick(
            eliteCandidates.length > 0 ? eliteCandidates : nodes.filter((node) => !assigned.has(node.id) && node !== start && node !== boss),
            (node) => (node.onMainPath ? 1 : 1.4) * (node.depth + 1)
        );
        if (elite) {
            elite.roomType = 'elite';
            assigned.add(elite.id);
        }

        const templateKeys = Object.keys(typeof ROOM_TEMPLATES !== 'undefined' ? ROOM_TEMPLATES : {});
        for (const node of nodes) {
            if (!node.roomType) node.roomType = 'normal';
            node.templateKey = templateKeys.length > 0 ? this.pick(templateKeys) : null;
        }
    }

    instantiateRooms(graph, floor) {
        const { nodes } = graph;
        const rooms = new Map();
        const nodeMap = new Map(nodes.map((node) => [node.id, node]));

        for (const node of nodes) {
            const room = new Room(node.gx, node.gy, node.roomType || 'normal', floor, node.templateKey || null);
            room.isMainPath = !!node.onMainPath;
            room.depthFromStart = Number.isFinite(node.depth) ? node.depth : 0;
            room.nodeId = node.id;
            rooms.set(room.id, room);
        }

        const dirDefs = this.getDirectionDefs();
        for (const node of nodes) {
            const room = rooms.get(`${floor}_${node.gx},${node.gy}`);
            if (!room) continue;
            for (const dir of dirDefs) {
                const nextId = `${node.gx + dir.dx},${node.gy + dir.dy}`;
                if (!node.neighbors.has(nextId)) continue;
                const target = rooms.get(`${floor}_${node.gx + dir.dx},${node.gy + dir.dy}`);
                if (!target) continue;
                room.doors[dir.name] = { open: room.cleared, target };
            }
        }

        return rooms;
    }

    buildFixedFloor7Rooms() {
        const floor = 7;
        const start = new Room(0, 0, 'start', floor, null);
        const awakening = new Room(0, -1, 'normal', floor, null);
        const boss = new Room(0, -2, 'boss', floor, null);

        start.isMainPath = true;
        start.depthFromStart = 0;
        start.nodeId = '0,0';
        start.floor7Role = 'entry';

        awakening.isMainPath = true;
        awakening.depthFromStart = 1;
        awakening.nodeId = '0,-1';
        awakening.floor7Role = 'awakening';
        awakening.cleared = true;
        awakening.hordeManager = null;
        awakening.enemies = [];
        awakening.roomMode = 'floor7_awakening';
        awakening.roomModeName = '觉醒之间';
        awakening.roomModeConfig = { id: 'floor7_awakening', name: '觉醒之间', kind: 'story' };
        awakening.storyPrompt = '继续向上';

        boss.isMainPath = true;
        boss.depthFromStart = 2;
        boss.nodeId = '0,-2';
        boss.floor7Role = 'boss';
        boss.bossDisplayName = '盲眼师傅';
        boss.bossName = '盲眼师傅';
        boss.trueEndingBossTotem = {
            x: boss.centerX,
            y: boss.centerY - 24,
            state: 'idle',
            absorbed: false,
            pulseSeed: this.random()
        };

        start.doors.up = { open: true, target: awakening };
        awakening.doors.down = { open: true, target: start };
        awakening.doors.up = { open: true, target: boss };
        boss.doors.down = { open: boss.cleared, target: awakening };

        const rooms = new Map();
        rooms.set(start.id, start);
        rooms.set(awakening.id, awakening);
        rooms.set(boss.id, boss);
        return { start, rooms, seed: this.seedLabel };
    }

    generate(floor = 1, options = {}) {
        this.setSeed(this.deriveSeedInput(floor, options.seed));
        if (Number(floor) === 7) {
            return this.buildFixedFloor7Rooms();
        }
        const maxRooms = 8 + floor;
        const graph = this.buildTopology(floor, maxRooms);
        this.assignSpecialTypes(graph, floor);
        const rooms = this.instantiateRooms(graph, floor);
        const start = rooms.get(`${floor}_0,0`);
        this.attachHiddenRoom(rooms, floor, start);
        this.assignNormalRoomModes(rooms, floor);
        this.fixDoorConnections(rooms);
        return { start, rooms, seed: this.seedLabel };
    }

    fixDoorConnections(rooms) {
        const dirs = this.getDirectionDefs();
        for (const room of rooms.values()) {
            for (const dir of dirs) {
                const nx = room.gx + dir.dx;
                const ny = room.gy + dir.dy;
                const neighbor = rooms.get(`${room.floor}_${nx},${ny}`) || rooms.get(`${nx},${ny}`);
                if (!neighbor) continue;
                if (!room.doors[dir.name]) {
                    room.doors[dir.name] = { open: room.cleared, target: neighbor };
                }
                if (!neighbor.doors[dir.opp]) {
                    neighbor.doors[dir.opp] = { open: neighbor.cleared, target: room };
                }
            }
        }
    }
    
    getNormalRoomModeConfig() {
        const normalizeBaseId = (value) => {
            const raw = String(value || '').trim().toLowerCase();
            if (!raw) return null;
            if (raw.includes('小鸡') || raw.includes('鸡')) return 'chick';
            if (raw.includes('蝙蝠') || raw.includes('bat')) return 'bat';
            if (raw.includes('兔') || raw.includes('rabbit')) return 'rabbit2';
            if (raw.includes('蜗牛') || raw.includes('snail')) return 'snail';
            if (raw.includes('鸽') || raw.includes('pigeon')) return 'pigeon';
            return null;
        };

        const normalizeMode = (item) => {
            if (!item || item.enabled === false || item.active === false) return null;
            const id = item.id || item.key || item.modeId || item.name;
            const name = item.name || item.label || item.title || id;
            const weight = Number(item.weight ?? item.probability ?? item.chance ?? item.percent ?? 0);
            if (!Number.isFinite(weight) || weight <= 0) return null;
            const baseId = normalizeBaseId(item.enemyBaseId || item.baseId || item.monsterId || item.enemy || item.name || item.id);
            if (baseId) {
                return { id: String(id), name: String(name), weight, enabled: true, kind: 'single_t1', enemyBaseId: baseId, spawnMultiplier: 2 };
            }
            return { id: String(id || 'normal_default'), name: String(name || '普通房模式1'), weight, enabled: true, kind: 'default', spawnMultiplier: 1 };
        };

        const candidates = [
            window.NORMAL_ROOM_MODE_CONFIG,
            window.RUNTIME_ROOM_MODE_CONFIG,
            window.ROOM_MODE_EDITOR_CONFIG,
            window.roomModeConfig
        ].filter(Boolean);

        if (typeof localStorage !== 'undefined') {
            const candidateKeys = [
                'normalRoomModes', 'roomModeConfig', 'runtimeRoomModes', 'room_editor_config',
                'rougecow_room_modes', 'roguecow_room_modes', 'monster_control_room_modes'
            ];
            candidateKeys.forEach((key) => {
                try {
                    const raw = localStorage.getItem(key);
                    if (raw) candidates.push(JSON.parse(raw));
                } catch (e) {}
            });
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (!key) continue;
                try {
                    const raw = localStorage.getItem(key);
                    if (!raw || raw.length > 200000) continue;
                    if (!/(普通房模式|小鸡房|蝙蝠房|兔子房|蜗牛房|鸽群房|normal_chick|normal_bat|normal_rabbit|normal_snail|normal_pigeon)/.test(raw)) continue;
                    candidates.push(JSON.parse(raw));
                } catch (e) {}
            }
        }

        for (const candidate of candidates) {
            const pool = Array.isArray(candidate)
                ? candidate
                : candidate?.normalModes || candidate?.roomModes || candidate?.normalRoomModes || candidate?.data?.normalModes || candidate?.rooms?.normalModes;
            if (!Array.isArray(pool) || pool.length === 0) continue;
            const normalized = pool.map(normalizeMode).filter(Boolean);
            if (normalized.length > 0) return normalized;
        }

        return DEFAULT_NORMAL_ROOM_MODE_DISTRIBUTION.map(mode => ({ ...mode }));
    }

    pickWeightedMode(modes) {
        const activeModes = (modes || []).filter(mode => mode && mode.enabled !== false && Number(mode.weight) > 0);
        if (activeModes.length === 0) {
            return { ...DEFAULT_NORMAL_ROOM_MODE_DISTRIBUTION[0] };
        }
        const totalWeight = activeModes.reduce((sum, mode) => sum + Number(mode.weight || 0), 0);
        let roll = this.random() * totalWeight;
        for (const mode of activeModes) {
            roll -= Number(mode.weight || 0);
            if (roll <= 0) return { ...mode };
        }
        return { ...activeModes[activeModes.length - 1] };
    }

    assignNormalRoomModes(rooms, floor) {
        const config = this.getNormalRoomModeConfig();
        for (const room of rooms.values()) {
            if (room.type !== 'normal') continue;
            const mode = this.pickWeightedMode(config);
            room.roomMode = mode.id;
            room.roomModeName = mode.name;
            room.roomModeConfig = { ...mode, floor };
        }
    }

    createSecretHintPackage(hostRoom, dir) {
        return {
            side: dir,
            type: 'worms',
            style: 'multi_stream',
            streamCount: 5 + this.randInt(0, 1),
            wormsPerStream: 5 + this.randInt(0, 2),
            streamSpread: 120 + this.random() * 36,
            pathPadding: 228 + this.random() * 36,
            speed: 0.06 + this.random() * 0.02,
            seed: Math.floor(this.random() * 100000)
        };
    }

    attachHiddenRoom(rooms, floor, start) {
        const dirs = this.getDirectionDefs();
        const roomList = Array.from(rooms.values());
        const candidates = roomList
            .filter(r => r.type === 'normal' && r !== start && !r.bossRoom)
            .sort((a, b) => (Math.abs(b.gx) + Math.abs(b.gy)) - (Math.abs(a.gx) + Math.abs(a.gy)));

        for (const hostRoom of candidates) {
            const shuffledDirs = this.shuffle(dirs);
            for (const dir of shuffledDirs) {
                const nx = hostRoom.gx + dir.dx;
                const ny = hostRoom.gy + dir.dy;
                const id = `${floor}_${nx},${ny}`;
                if (rooms.has(id)) continue;

                const hiddenRoom = new Room(nx, ny, 'hidden', floor, this.pick(Object.keys(typeof ROOM_TEMPLATES !== 'undefined' ? ROOM_TEMPLATES : {})) || null);
                hiddenRoom.isSecretRoom = true;
                hiddenRoom.hiddenEntranceFrom = hostRoom.id;
                hiddenRoom.visited = false;
                hostRoom.doors[dir.name] = { open: true, target: hiddenRoom, isSecretDoor: true };
                hiddenRoom.doors[dir.opp] = { open: true, target: hostRoom, isSecretDoor: true };
                hostRoom.secretHints = hostRoom.secretHints || [];
                hostRoom.secretHints.push(this.createSecretHintPackage(hostRoom, dir.name));
                rooms.set(hiddenRoom.id, hiddenRoom);
                return hiddenRoom;
            }
        }
        return null;
    }
}

// ============================================================================

// 主游戏类 v0.7.2

// ============================================================================

// ==================== 吸血鬼幸存者风格重构 ====================

const SURVIVOR_CONFIG = {

    // v0.34: 16:9 完整镜头 1920x1080，游戏区 960x960 居中
    VIEW_WIDTH: 1920, VIEW_HEIGHT: 1080,

    CAMERA_SMOOTH: 0.1,

    WAVE_INTERVAL: 30, WAVE_BASE_COUNT: 20, WAVE_INCREMENT: 5,

    GRID_CELL_SIZE: 150,

    // 自适应视野：如果屏幕够大就显示完整房间

    ADAPTIVE_VIEW: true,

    // 房间尺寸：扩大以容纳加厚墙
    ROOM_WIDTH: 2000,
    ROOM_HEIGHT: 2000,
    
    // 墙厚度：增加以更好显示门
    WALL_THICKNESS: 120,
    
    // 地板区域边界（排除墙的区域）
    get floorLeft() { return this.WALL_THICKNESS; },
    get floorTop() { return this.WALL_THICKNESS; },
    get floorRight() { return this.ROOM_WIDTH - this.WALL_THICKNESS; },
    get floorBottom() { return this.ROOM_HEIGHT - this.WALL_THICKNESS; },
    
    // 门区域宽度（从中心向两侧延伸的距离）
    DOOR_WIDTH_HALF: 100,
    DOOR_HEIGHT_HALF: 100,
    
    // 检查位置是否在有效区域内（地板+门）
    isInValidArea(x, y, room) {
        const centerX = this.ROOM_WIDTH / 2;
        const centerY = this.ROOM_HEIGHT / 2;
        const doorWH = this.DOOR_WIDTH_HALF;
        const doorHH = this.DOOR_HEIGHT_HALF;
        
        // 首先检查是否在地板区域内
        const inFloor = x >= this.floorLeft && x <= this.floorRight && 
                        y >= this.floorTop && y <= this.floorBottom;
        if (inFloor) return true;
        
        // 如果不在地板内，检查是否在任何开放的门区域内
        if (!room || !room.doors) return false;
        
        const doors = room.doors;
        
        // 左侧门
        if (doors.left && doors.left.open) {
            if (x < this.floorLeft && y > centerY - doorWH && y < centerY + doorWH) return true;
        }
        // 右侧门
        if (doors.right && doors.right.open) {
            if (x > this.floorRight && y > centerY - doorWH && y < centerY + doorWH) return true;
        }
        // 上侧门
        if (doors.up && doors.up.open) {
            if (y < this.floorTop && x > centerX - doorHH && x < centerX + doorHH) return true;
        }
        // 下侧门
        if (doors.down && doors.down.open) {
            if (y > this.floorBottom && x > centerX - doorHH && x < centerX + doorHH) return true;
        }
        
        return false;
    },
    
    // 将位置限制在有效区域内
    clampToValidArea(x, y, room) {
        const centerX = this.ROOM_WIDTH / 2;
        const centerY = this.ROOM_HEIGHT / 2;
        const doorWH = this.DOOR_WIDTH_HALF;
        const doorHH = this.DOOR_HEIGHT_HALF;
        
        // 如果已经在有效区域内，直接返回
        if (this.isInValidArea(x, y, room)) return { x, y };
        
        // 尝试限制到地板区域
        let clampedX = clamp(x, this.floorLeft, this.floorRight);
        let clampedY = clamp(y, this.floorTop, this.floorBottom);
        
        // 如果限制后位置仍然不在有效区域（可能在角落），检查门区域
        if (!this.isInValidArea(clampedX, clampedY, room)) {
            // 检查哪个门最近，尝试进入门区域
            if (room && room.doors) {
                const doors = room.doors;
                
                // 左侧
                if (doors.left && doors.left.open && x < this.floorLeft && Math.abs(y - centerY) < doorWH) {
                    clampedX = this.floorLeft;
                    clampedY = clamp(y, centerY - doorWH, centerY + doorWH);
                }
                // 右侧
                else if (doors.right && doors.right.open && x > this.floorRight && Math.abs(y - centerY) < doorWH) {
                    clampedX = this.floorRight;
                    clampedY = clamp(y, centerY - doorWH, centerY + doorWH);
                }
                // 上侧
                else if (doors.up && doors.up.open && y < this.floorTop && Math.abs(x - centerX) < doorHH) {
                    clampedX = clamp(x, centerX - doorHH, centerX + doorHH);
                    clampedY = this.floorTop;
                }
                // 下侧
                else if (doors.down && doors.down.open && y > this.floorBottom && Math.abs(x - centerX) < doorHH) {
                    clampedX = clamp(x, centerX - doorHH, centerX + doorHH);
                    clampedY = this.floorBottom;
                }
            }
        }
        
        return { x: clampedX, y: clampedY };
    }

};




// Export to global
window.MapGenerator = MapGenerator;
