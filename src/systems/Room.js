class Room {

    getLayer1EnvelopeTextures() {
        if (this.floor !== 1) return null;

        if (!Room._layer1EnvelopeTextures) {
            const isLocal = location.hostname === 'localhost' ||
                location.hostname === '127.0.0.1' ||
                location.protocol === 'file:';
            const basePath = isLocal
                ? './assets/sprites/'
                : 'https://wearescientist.github.io/rouge-cow/assets/sprites/';
            const createImage = (src) => {
                const image = new Image();
                image.decoding = 'async';
                image.src = src;
                return image;
            };

            Room._layer1EnvelopeTextures = {
                floorBase: createImage(basePath + 'tiles/layer1/set1/layer1_set1_floor_base.png'),
                floorDetail: createImage(basePath + 'tiles/layer1/set2/layer1_set2_floor_detail.png'),
                floorCrack: createImage(basePath + 'tiles/layer1/set2/layer1_set2_floor_crack.png'),
                wallCoreBase: createImage(basePath + 'tiles/layer1/wall/layer1_wall_base.png'),
                wallCoreTop: createImage(basePath + 'tiles/layer1/wall/layer1_wall_top.png'),
                wallCoreBottom: createImage(basePath + 'tiles/layer1/wall/layer1_wall_bottom.png'),
                wallBase: createImage(basePath + 'tiles/layer1/set1/layer1_set1_wall_base.png'),
                wallTop: createImage(basePath + 'tiles/layer1/set2/layer1_set2_wall_top.png'),
                wallBottom: createImage(basePath + 'tiles/layer1/set2/layer1_set2_wall_bottom.png'),
                wallGlowing: createImage(basePath + 'tiles/layer1/set2/layer1_set2_wall_glowing.png'),
                cornerInnerTl: createImage(basePath + 'tiles/layer1/set1/layer1_set1_corner_inner_tl.png'),
                cornerInnerTr: createImage(basePath + 'tiles/layer1/set1/layer1_set1_corner_inner_tr.png'),
                cornerInnerBl: createImage(basePath + 'tiles/layer1/set1/layer1_set1_corner_inner_bl.png'),
                cornerInnerBr: createImage(basePath + 'tiles/layer1/set1/layer1_set1_corner_inner_br.png'),
                cornerTl: createImage(basePath + 'tiles/layer1/set1/layer1_set1_corner_tl.png'),
                cornerTr: createImage(basePath + 'tiles/layer1/set1/layer1_set1_corner_tr.png'),
                cornerBl: createImage(basePath + 'tiles/layer1/set1/layer1_set1_corner_bl.png'),
                cornerBr: createImage(basePath + 'tiles/layer1/set1/layer1_set1_corner_br.png'),
                doorClosed: createImage(basePath + 'tiles/layer1/door/layer1_door_normal_closed.png'),
                doorOpen: createImage(basePath + 'tiles/layer1/door/layer1_door_normal_open.png')
            };
        }

        return Room._layer1EnvelopeTextures;
    }

    isEnvelopeTextureReady(image) {
        return !!(image && image.complete && image.naturalWidth > 0);
    }

    drawTiledImageRect(ctx, image, x, y, width, height, options = {}) {
        if (!this.isEnvelopeTextureReady(image) || width <= 0 || height <= 0) return;

        const {
            alpha = 1,
            tileWidth = image.naturalWidth,
            tileHeight = image.naturalHeight,
            rotation = 0,
            mirrorX = false,
            mirrorY = false,
            compositeOperation = 'source-over'
        } = options;

        ctx.save();
        ctx.beginPath();
        ctx.rect(x, y, width, height);
        ctx.clip();
        ctx.globalAlpha = alpha;
        ctx.globalCompositeOperation = compositeOperation;

        const cols = Math.ceil(width / tileWidth) + 1;
        const rows = Math.ceil(height / tileHeight) + 1;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const destX = x + col * tileWidth;
                const destY = y + row * tileHeight;
                ctx.save();
                ctx.translate(destX + tileWidth / 2, destY + tileHeight / 2);
                if (rotation !== 0) ctx.rotate(rotation);
                ctx.scale(mirrorX ? -1 : 1, mirrorY ? -1 : 1);
                ctx.drawImage(image, -tileWidth / 2, -tileHeight / 2, tileWidth, tileHeight);
                ctx.restore();
            }
        }

        ctx.restore();
    }

    getLayer1SceneLayout(ctx, camera) {
        const wallT = SURVIVOR_CONFIG.WALL_THICKNESS;
        const roomTopLeft = camera.worldToScreen(0, 0);
        const roomBottomRight = camera.worldToScreen(this.width, this.height);
        const floorTopLeft = camera.worldToScreen(wallT, wallT);
        const floorBottomRight = camera.worldToScreen(this.width - wallT, this.height - wallT);
        const canvasW = ctx.canvas.width || 960;
        const canvasH = ctx.canvas.height || 960;

        return {
            canvasW,
            canvasH,
            center: camera.worldToScreen(this.centerX, this.centerY),
            roomRect: {
                left: roomTopLeft.x,
                top: roomTopLeft.y,
                right: roomBottomRight.x,
                bottom: roomBottomRight.y,
                width: roomBottomRight.x - roomTopLeft.x,
                height: roomBottomRight.y - roomTopLeft.y
            },
            floorRect: {
                left: floorTopLeft.x,
                top: floorTopLeft.y,
                right: floorBottomRight.x,
                bottom: floorBottomRight.y,
                width: floorBottomRight.x - floorTopLeft.x,
                height: floorBottomRight.y - floorTopLeft.y
            }
        };
    }

    drawLayer1UnifiedRoom(ctx, camera, sprites, viewLeft, viewTop, viewRight, viewBottom, time) {
        const textures = this.getLayer1EnvelopeTextures();
        const roomSeed = ((this.gx + 11) * 31 + (this.gy + 7) * 17 + this.floor * 13) & 0xffff;
        const baseFloorSprite = sprites ? sprites.get('layer1_floor_mycelium') : null;
        const scene = this.getLayer1SceneLayout(ctx, camera);
        const center = scene.center;
        const floorX = scene.floorRect.left;
        const floorY = scene.floorRect.top;
        const floorW = scene.floorRect.width;
        const floorH = scene.floorRect.height;
        const floorBottom = scene.floorRect.bottom;
        const floorRight = scene.floorRect.right;
        const thresholdSize = Math.max(72, floorW * 0.12);

        this.drawLayer1FullSceneEnvelope(ctx, scene, time);

        ctx.save();
        ctx.beginPath();
        ctx.rect(floorX, floorY, floorW, floorH);
        ctx.clip();
        ctx.fillStyle = '#54514b';
        ctx.fillRect(floorX, floorY, floorW, floorH);
        if (baseFloorSprite) {
            ctx.globalAlpha = 0.96;
            ctx.drawImage(baseFloorSprite, floorX, floorY, floorW, floorH);
        }
        if (this.isEnvelopeTextureReady(textures?.floorBase)) {
            ctx.globalAlpha = 0.16;
            ctx.drawImage(textures.floorBase, floorX, floorY, floorW, floorH);
        }
        if (this.isEnvelopeTextureReady(textures?.floorDetail)) {
            ctx.globalAlpha = 0.05;
            ctx.drawImage(textures.floorDetail, floorX, floorY, floorW, floorH);
        }
        ctx.restore();

        if (this.isEnvelopeTextureReady(textures?.floorCrack)) {
            ctx.save();
            ctx.globalAlpha = 0.08;
            for (let i = 0; i < 2; i++) {
                const px = floorX + floorW * (0.18 + (((roomSeed + i * 29) % 540) / 1000));
                const py = floorY + floorH * (0.16 + (((roomSeed + i * 47) % 620) / 1000));
                const crackW = floorW * 0.18;
                const crackH = floorH * 0.09;
                ctx.drawImage(textures.floorCrack, px, py, crackW, crackH);
            }
            ctx.restore();
        }

        const floorCenterGlow = ctx.createRadialGradient(center.x, center.y, floorW * 0.02, center.x, center.y, floorW * 0.48);
        floorCenterGlow.addColorStop(0, 'rgba(196, 192, 182, 0.12)');
        floorCenterGlow.addColorStop(0.55, 'rgba(120, 122, 118, 0.04)');
        floorCenterGlow.addColorStop(1, 'rgba(0, 0, 0, 0.24)');
        ctx.fillStyle = floorCenterGlow;
        ctx.fillRect(floorX, floorY, floorW, floorH);

        const edgeFadeTop = ctx.createLinearGradient(0, floorY - thresholdSize * 0.6, 0, floorY + thresholdSize);
        edgeFadeTop.addColorStop(0, 'rgba(0, 0, 0, 0.62)');
        edgeFadeTop.addColorStop(0.45, 'rgba(20, 22, 24, 0.18)');
        edgeFadeTop.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = edgeFadeTop;
        ctx.fillRect(floorX - 6, floorY - thresholdSize * 0.7, floorW + 12, thresholdSize * 1.7);

        const edgeFadeBottom = ctx.createLinearGradient(0, floorBottom - thresholdSize, 0, floorBottom + thresholdSize * 0.7);
        edgeFadeBottom.addColorStop(0, 'rgba(0, 0, 0, 0)');
        edgeFadeBottom.addColorStop(0.55, 'rgba(18, 20, 22, 0.24)');
        edgeFadeBottom.addColorStop(1, 'rgba(0, 0, 0, 0.68)');
        ctx.fillStyle = edgeFadeBottom;
        ctx.fillRect(floorX - 6, floorBottom - thresholdSize, floorW + 12, thresholdSize * 1.8);

        const edgeFadeLeft = ctx.createLinearGradient(floorX - thresholdSize * 0.7, 0, floorX + thresholdSize, 0);
        edgeFadeLeft.addColorStop(0, 'rgba(0, 0, 0, 0.7)');
        edgeFadeLeft.addColorStop(0.45, 'rgba(18, 20, 22, 0.2)');
        edgeFadeLeft.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = edgeFadeLeft;
        ctx.fillRect(floorX - thresholdSize * 0.8, floorY - 6, thresholdSize * 1.8, floorH + 12);

        const edgeFadeRight = ctx.createLinearGradient(floorRight - thresholdSize, 0, floorRight + thresholdSize * 0.7, 0);
        edgeFadeRight.addColorStop(0, 'rgba(0, 0, 0, 0)');
        edgeFadeRight.addColorStop(0.55, 'rgba(18, 20, 22, 0.2)');
        edgeFadeRight.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
        ctx.fillStyle = edgeFadeRight;
        ctx.fillRect(floorRight - thresholdSize, floorY - 6, thresholdSize * 1.8, floorH + 12);

        if (this.isEnvelopeTextureReady(textures?.wallGlowing)) {
            ctx.save();
            ctx.globalAlpha = 0.1;
            ctx.drawImage(textures.wallGlowing, floorX + floorW * 0.04, floorY + floorH * 0.08, floorW * 0.12, floorH * 0.16);
            ctx.drawImage(textures.wallGlowing, floorX + floorW * 0.82, floorY + floorH * 0.7, floorW * 0.1, floorH * 0.14);
            ctx.restore();
        }

        this.drawAmbientEffects(ctx, camera, sprites, viewLeft, viewTop, viewRight, viewBottom);
    }

    constructor(gx, gy, type = 'normal', floor = 1, templateKey = null) {

        this.gx = gx; this.gy = gy;

        this.id = `${floor}_${gx},${gy}`;

        this.type = type;

        this.floor = floor;

        this.doors = { up: null, down: null, left: null, right: null };

        this.enemies = [];

        this.cleared = type === 'start' || type === 'treasure' || type === 'shop' || type === 'hidden';

        this.visited = false;

        this.items = [];
        
        // v0.16.3: 经验和金币按房间存储（像血迹一样）
        this.gems = [];      // 经验宝石
        this.goldDrops = []; // 金币掉落

        this.npc = null;

        

        // 大房间尺寸

        this.width = SURVIVOR_CONFIG.ROOM_WIDTH;

        this.height = SURVIVOR_CONFIG.ROOM_HEIGHT;

        this.centerX = this.width / 2;

        this.centerY = this.height / 2;

        

        // 选择模板（8个之一）

        const keys = Object.keys(ROOM_TEMPLATES);

        this.templateKey = templateKey || keys[Math.floor(Math.random() * keys.length)];

        this.template = ROOM_TEMPLATES[this.templateKey];

        // 将相对坐标（0-1）转换为绝对坐标

        this.spawnPoints = this.template.spawnPoints.map(p => ({

            x: p.x < 1 ? p.x * this.width : p.x,

            y: p.y < 1 ? p.y * this.height : p.y

        }));

        

        // 波次管理器

        this.hordeManager = null;

        if (type === 'normal' || type === 'boss' || type === 'elite') {

            this.hordeManager = new HordeManager(this);

        }

        

        if (type === 'shop') {
            // NPC中心对准房间中心，脚底在中心上方70（-70）
            this.npc = new ShopNPC(this.centerX, this.centerY - 70);
        }

        

        this.spawnRoomItems();

    }

    

    spawnRoomItems() {
        if (this.type === 'treasure') {
            // 宝箱房：放置一个宝箱，触碰后弹出3选1选择框
            this.chest = {
                x: this.centerX,
                y: this.centerY,
                opened: false,
                items: [] // 待选择的3个物品
            };
            // v0.26: 使用层数过滤的道具列表
            const availableItems = window.game ? window.game.getAvailableItemsByFloor() : Object.values(ITEMS);
            const selected = [];
            while (selected.length < 3 && availableItems.length > 0) {
                const idx = Math.floor(Math.random() * availableItems.length);
                const item = availableItems.splice(idx, 1)[0];
                selected.push({
                    id: item.id,
                    icon: item.icon,
                    name: item.name,
                    desc: item.desc,
                    rarity: item.rarity
                });
            }
            this.chest.items = selected;

        } else if (this.type === 'hidden') {

            // hidden房已禁用 - 直接标记为已清理，不生成物品和怪物

            this.cleared = true;

        }

    }

    

    // 获取当前活跃敌人（供外部使用）

    getActiveEnemies() {

        if (this.hordeManager) {

            return this.hordeManager.getActiveEnemies();

        }

        return this.enemies.filter(e => e.hp > 0);

    }

    

    update(dt) {

        if (this.hordeManager) {

            this.hordeManager.update(dt);

            // 持续补充敌人直到达到本波目标

            if (this.hordeManager.spawnedThisWave < this.hordeManager.targetCount) {

                this.hordeManager.spawnBatch();

            }

        }

    }



    spawnEnemies() {

        if (this.type === 'start' || this.type === 'treasure' || this.type === 'shop') return;

        

        if (this.type === 'hidden') {

            const eliteTypes = ['bear', 'yinya'];

            const typeKey = randChoice(eliteTypes);

            const elite = createEnemy(this.centerX, this.centerY, typeKey);

            // v0.18.4: 应用楼层难度倍率
            const floor = window.game?.currentFloor || 1;
            elite.hp *= 2 * floor;  // 基础2倍精英 × 楼层倍率

            elite.maxHp = elite.hp;

            elite.dmg *= 1.5;

            elite.isElite = true;

            // 如果有HordeManager，添加到它的enemies数组

            if (this.hordeManager) {

                this.hordeManager.enemies.push(elite);

            } else {

                this.enemies.push(elite);

            }

            return;

        }

        

        if (this.type === 'boss') {
            // v0.12.0 - 根据当前楼层选择对应的Boss
            const floor = window.game ? window.game.currentFloor : 1;
            const bossKey = 'floor' + Math.min(Math.max(floor, 1), 6);
            const bossCfg = BOSS_TYPES[bossKey];
            
            if (!bossCfg) {
                console.error(`[Boss生成] 未找到楼层${floor}的Boss配置`);
                return;
            }
            
            // v0.20.0: 割草模式 - Boss血量 = 基础 × 10 × 楼层^1.5 (第6层=150倍基础)
            const bossHp = Math.floor(bossCfg.baseHp * 10 * Math.pow(floor, 1.5));
            // Boss伤害保持原版，不受楼层影响
            
            // 第6层Boss固定在房间中央略高位置
            const bossX = this.centerX;
            const bossY = (floor === 6) ? this.centerY - 50 : this.centerY - 100;
            
            const boss = createBoss(bossX, bossY, floor);
            boss.name = bossCfg.name;
            boss.hp = bossHp;
            boss.maxHp = bossHp;
            boss.speed = bossCfg.speed;
            // v0.20.0: Boss伤害保持原版，不受楼层影响（玩家太脆）
            boss.dmg = bossCfg.dmg;
            boss.exp = bossCfg.exp;
            boss.gold = bossCfg.gold;
            boss.color = bossCfg.color;
            boss.isBoss = true;
            boss.tier = 4;
            boss.phase = 0;
            boss.bossFloor = floor; // 记录Boss楼层用于后续逻辑
            
            // 设置贴图
            if (bossCfg.sprite) {
                boss.sprite = bossCfg.sprite;
            }
            
            // 第6层特殊处理：静止Boss
            if (floor === 6) {
                boss.isStatic = true;
                boss.speed = 0;
            }

            // Boss攻击系统初始化
            boss.skillCooldowns = {
                charge: 3,
                bullet_hell: 2,
                summon: 5,
                shockwave: 4,
                homing: 1
            };
            boss.skillTimers = {};
            boss.isCharging = false;
            boss.chargeWarning = false;
            boss.chargeDir = { x: 0, y: 0 };
            
            // v0.17.2: 移除调试日志
        // console.log(`[Boss生成] 第${floor}层Boss: ${boss.name}, HP:${bossHp}, 贴图:${boss.sprite}`);
            
            if (this.hordeManager) {
                this.hordeManager.enemies.push(boss);
            } else {
                this.enemies.push(boss);
            }
            
            return;
        }

        

        // v0.9.5 - 普通房间和精英房的敌人由HordeManager动态生成
        // 如果HordeManager不存在（异常情况），使用简单后备生成
        if (this.hordeManager) return;
        
        // 后备生成：只生成T1基础怪（避免破坏新系统平衡）
        const count = randInt(3, 5);
        
        // v0.18.4: 应用楼层难度倍率
        const floor = window.game?.currentFloor || 1;
        
        // Use new system monsters if available
        const useNewTypes = (typeof USE_NEW_ENEMY_SYSTEM !== 'undefined' && USE_NEW_ENEMY_SYSTEM && 
                            typeof getRandomNewMonsterForFloor === 'function');
        
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const r = 150 + Math.random() * 100;
            const x = 450 + Math.cos(angle) * r;
            const y = 300 + Math.sin(angle) * r;
            
            let typeKey;
            if (useNewTypes) {
                typeKey = getRandomNewMonsterForFloor(floor);
            } else {
                const t1Types = ['chick', 'snail', 'pigeon', 'duck3', 'bat'];
                typeKey = randChoice(t1Types);
            }
            
            const enemy = createEnemy(x, y, typeKey, 1);
            // 应用楼层倍率
            enemy.hp *= floor;
            enemy.maxHp = enemy.hp;
            this.enemies.push(enemy);
        }

    }



    draw(ctx, camera, sprites) {
        // 楼层到地板贴图的映射
        const FLOOR_SPRITE_MAP = [
            'layer1_floor_mycelium',    // 第1层 - 菌丝区
            'layer2_floor_greenhouse',  // 第2层 - 孵化温室
            'layer3_floor_nerve',       // 第3层 - 神经索
            'layer4_floor_furnace',     // 第4层 - 消化熔炉
            'layer5_floor_courtyard',   // 第5层 - 母虫庭院
            'layer6_floor_core'         // 第6层 - 千根之心
        ];
        
        const floorColors = { 
            start: '#1a1a2e', normal: '#16213e', boss: '#2d1b2e', 
            treasure: '#2d2d1b', shop: '#1b1b2d', hidden: '#2d1b2d'
        };
        
        // 计算视野范围（世界坐标）
        const viewLeft = camera.x - camera.viewWidth / 2;
        const viewTop = camera.y - camera.viewHeight / 2;
        const viewRight = viewLeft + camera.viewWidth;
        const viewBottom = viewTop + camera.viewHeight;

        if (this.floor === 1) {
            this.drawLayer1UnifiedRoom(ctx, camera, sprites, viewLeft, viewTop, viewRight, viewBottom, Date.now() / 1000);
            return;
        }
        
        // 地板区域：墙内 1760x1760 的区域
        const floorLeft = SURVIVOR_CONFIG.WALL_THICKNESS;           // 120
        const floorTop = SURVIVOR_CONFIG.WALL_THICKNESS;            // 120
        const floorRight = this.width - SURVIVOR_CONFIG.WALL_THICKNESS;   // 1880
        const floorBottom = this.height - SURVIVOR_CONFIG.WALL_THICKNESS; // 1880
        
        // 地板使用贴图拉伸绘制（1024x1024贴图拉伸填充到1760x1760）
        const floorSpriteName = FLOOR_SPRITE_MAP[this.floor - 1] || 'layer1_floor_mycelium';
        const floorSprite = sprites ? sprites.get(floorSpriteName) : null;
        
        // 只绘制视野和地板区域的交集
        const clipLeft = Math.max(viewLeft, floorLeft);
        const clipTop = Math.max(viewTop, floorTop);
        const clipRight = Math.min(viewRight, floorRight);
        const clipBottom = Math.min(viewBottom, floorBottom);
        
        if (clipRight > clipLeft && clipBottom > clipTop) {
            if (floorSprite) {
                ctx.save();
                const floorTopLeft = camera.worldToScreen(clipLeft, clipTop);
                const floorBottomRight = camera.worldToScreen(clipRight, clipBottom);
                const width = floorBottomRight.x - floorTopLeft.x;
                const height = floorBottomRight.y - floorTopLeft.y;
                
                // 拉伸贴图填充地板区域（1760x1760）
                ctx.drawImage(floorSprite, floorTopLeft.x, floorTopLeft.y, width, height);
                ctx.restore();
            } else {
                // 回退到纯色
                ctx.fillStyle = floorColors[this.type] || '#16213e';
                const floorTopLeft = camera.worldToScreen(clipLeft, clipTop);
                const floorBottomRight = camera.worldToScreen(clipRight, clipBottom);
                ctx.fillRect(floorTopLeft.x, floorTopLeft.y, 
                    floorBottomRight.x - floorTopLeft.x, 
                    floorBottomRight.y - floorTopLeft.y);
            }
        }

        

        // 房间环境光效

        this.drawAmbientEffects(ctx, camera, sprites, viewLeft, viewTop, viewRight, viewBottom);

        

        // 绘制网格（装饰）

        ctx.strokeStyle = 'rgba(255,255,255,0.03)';

        ctx.lineWidth = 1;

        const gridStartX = Math.floor(viewLeft / 50) * 50;

        const gridStartY = Math.floor(viewTop / 50) * 50;

        for (let wx = gridStartX; wx < viewRight; wx += 50) {

            const top = camera.worldToScreen(wx, viewTop);

            const bottom = camera.worldToScreen(wx, viewBottom);

            ctx.beginPath(); ctx.moveTo(top.x, top.y); ctx.lineTo(bottom.x, bottom.y); ctx.stroke();

        }

        for (let wy = gridStartY; wy < viewBottom; wy += 50) {

            const left = camera.worldToScreen(viewLeft, wy);

            const right = camera.worldToScreen(viewRight, wy);

            ctx.beginPath(); ctx.moveTo(left.x, left.y); ctx.lineTo(right.x, right.y); ctx.stroke();

        }

        

        // 绘制房间边界（厚墙）- 使用贴图平铺+翻转实现4面墙
        const wallThickness = SURVIVOR_CONFIG.WALL_THICKNESS;
        const wallSpriteName = 'layer' + this.floor + '_wall';
        const wallSprite = sprites ? sprites.get(wallSpriteName) : null;
        
        if (wallSprite) {
            // 辅助函数：平铺绘制墙
            // flipX: 水平翻转, flipY: 垂直翻转
            const drawHorizontalWall = (worldX, worldY, worldW, worldH, flipY = false) => {
                const tl = camera.worldToScreen(worldX, worldY);
                const br = camera.worldToScreen(worldX + worldW, worldY + worldH);
                const screenX = tl.x, screenY = tl.y;
                const screenW = br.x - tl.x, screenH = br.y - tl.y;
                
                const tileWorldSize = 120;
                const tilesX = Math.ceil(worldW / tileWorldSize);
                const tileScreenSize = screenW / tilesX;
                
                for (let tx = 0; tx < tilesX; tx++) {
                    const destX = screenX + tx * tileScreenSize;
                    const drawSize = Math.min(tileScreenSize, screenX + screenW - destX);
                    if (drawSize <= 0) continue;
                    
                    ctx.save();
                    ctx.translate(destX + drawSize/2, screenY + screenH/2);
                    if (flipY) ctx.scale(1, -1); // 垂直翻转
                    ctx.drawImage(wallSprite, 0, 0, 64, 64, -drawSize/2, -drawSize/2, drawSize, drawSize);
                    ctx.restore();
                }
            };
            
            const drawVerticalWall = (worldX, worldY, worldW, worldH, flipX = false) => {
                const tl = camera.worldToScreen(worldX, worldY);
                const br = camera.worldToScreen(worldX + worldW, worldY + worldH);
                const screenX = tl.x, screenY = tl.y;
                const screenW = br.x - tl.x, screenH = br.y - tl.y;
                
                const tileWorldSize = 120;
                const tilesY = Math.ceil(worldH / tileWorldSize);
                const tileScreenSize = screenH / tilesY;
                
                for (let ty = 0; ty < tilesY; ty++) {
                    const destY = screenY + ty * tileScreenSize;
                    const drawSize = Math.min(tileScreenSize, screenY + screenH - destY);
                    if (drawSize <= 0) continue;
                    
                    ctx.save();
                    ctx.translate(screenX + screenW/2, destY + drawSize/2);
                    ctx.rotate(Math.PI / 2); // 顺时针90度
                    if (flipX) ctx.scale(1, -1); // 水平翻转（旋转后的Y对应原X）
                    ctx.drawImage(wallSprite, 0, 0, 64, 64, -drawSize/2, -drawSize/2, drawSize, drawSize);
                    ctx.restore();
                }
            };
            
            // 四面墙 - 整面绘制（门稍后覆盖）
            
            // 上墙 - 正常
            if (viewTop < wallThickness) {
                drawHorizontalWall(viewLeft, 0, viewRight - viewLeft, wallThickness, false);
            }
            
            // 下墙 - 垂直翻转
            if (viewBottom > this.height - wallThickness) {
                drawHorizontalWall(viewLeft, this.height - wallThickness, viewRight - viewLeft, wallThickness, true);
            }
            
            // 左墙 - 水平翻转（旋转后）
            if (viewLeft < wallThickness) {
                drawVerticalWall(0, viewTop, wallThickness, viewBottom - viewTop, true);
            }
            
            // 右墙 - 正常
            if (viewRight > this.width - wallThickness) {
                drawVerticalWall(this.width - wallThickness, viewTop, wallThickness, viewBottom - viewTop, false);
            }
            
            // 绘制四个墙角贴图（覆盖在墙上层，120x120）
            const corners = [
                { name: 'tl', x: 0, y: 0 },
                { name: 'tr', x: this.width - wallThickness, y: 0 },
                { name: 'bl', x: 0, y: this.height - wallThickness },
                { name: 'br', x: this.width - wallThickness, y: this.height - wallThickness }
            ];
            
            for (const corner of corners) {
                if (corner.x < viewRight && corner.x + wallThickness > viewLeft &&
                    corner.y < viewBottom && corner.y + wallThickness > viewTop) {
                    const cornerSpriteName = 'layer' + this.floor + '_corner_' + corner.name;
                    const cornerSprite = sprites ? sprites.get(cornerSpriteName) : null;
                    
                    const tl = camera.worldToScreen(corner.x, corner.y);
                    const br = camera.worldToScreen(corner.x + wallThickness, corner.y + wallThickness);
                    
                    if (cornerSprite) {
                        ctx.drawImage(cornerSprite, tl.x, tl.y, br.x - tl.x, br.y - tl.y);
                    }
                }
            }
        } else {
            // 回退到纯色
            ctx.fillStyle = '#0f0f1a';
            if (viewLeft < wallThickness) {
                const topLeft = camera.worldToScreen(0, viewTop);
                const bottomRight = camera.worldToScreen(wallThickness, viewBottom);
                ctx.fillRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
            }
            if (viewRight > this.width - wallThickness) {
                const topLeft = camera.worldToScreen(this.width - wallThickness, viewTop);
                const bottomRight = camera.worldToScreen(this.width, viewBottom);
                ctx.fillRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
            }
            if (viewTop < wallThickness) {
                const topLeft = camera.worldToScreen(viewLeft, 0);
                const bottomRight = camera.worldToScreen(viewRight, wallThickness);
                ctx.fillRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
            }
            if (viewBottom > this.height - wallThickness) {
                const topLeft = camera.worldToScreen(viewLeft, this.height - wallThickness);
                const bottomRight = camera.worldToScreen(viewRight, this.height);
                ctx.fillRect(topLeft.x, topLeft.y, bottomRight.x - topLeft.x, bottomRight.y - topLeft.y);
            }
        }

        

        // 绘制门（门180x180，完整覆盖120厚的墙）
        const doorPositions = {};
        const wallT = SURVIVOR_CONFIG.WALL_THICKNESS;
        const doorSize = 180; // 比墙厚大，完整覆盖
        const doorOffset = (doorSize - wallT) / 2; // 30px 向外延伸
        
        for (const [dir, door] of Object.entries(this.doors)) {
            if (!door) continue;
            
            let doorX, doorY, doorW, doorH, doorRotation;
            
            switch(dir) {
                case 'up': 
                    doorX = this.centerX - doorSize/2; 
                    doorY = -doorOffset; // 向外延伸
                    doorW = doorSize; 
                    doorH = doorSize;
                    doorRotation = 0; // 正常
                    break;
                case 'down': 
                    doorX = this.centerX - doorSize/2; 
                    doorY = this.height - wallT - doorOffset; // 向外延伸
                    doorW = doorSize; 
                    doorH = doorSize;
                    doorRotation = Math.PI; // 180度
                    break;
                case 'left': 
                    doorX = -doorOffset; // 向外延伸
                    doorY = this.centerY - doorSize/2; 
                    doorW = doorSize; 
                    doorH = doorSize;
                    doorRotation = -Math.PI / 2; // 逆时针90度
                    break;
                case 'right': 
                    doorX = this.width - wallT - doorOffset; // 向外延伸
                    doorY = this.centerY - doorSize/2; 
                    doorW = doorSize; 
                    doorH = doorSize;
                    doorRotation = Math.PI / 2; // 顺时针90度
                    break;
            }

            doorPositions[dir] = { x: doorX, y: doorY, w: doorW, h: doorH, rotation: doorRotation };
        }

        // 绘制门 - 使用贴图（根据方向旋转）
        for (const [dir, door] of Object.entries(this.doors)) {
            if (!door) continue;
            const pos = doorPositions[dir];
            if (!pos) continue;
            
            if (pos.x < viewRight && pos.x + pos.w > viewLeft &&
                pos.y < viewBottom && pos.y + pos.h > viewTop) {
                
                const doorSpriteName = 'layer' + this.floor + (door.open ? '_door_open' : '_door_closed');
                const doorSprite = sprites ? sprites.get(doorSpriteName) : null;
                
                const centerX = camera.worldToScreen(pos.x + pos.w/2, pos.y + pos.h/2);
                const halfW = (camera.worldToScreen(pos.x + pos.w, pos.y).x - camera.worldToScreen(pos.x, pos.y).x) / 2;
                const halfH = (camera.worldToScreen(pos.x, pos.y + pos.h).y - camera.worldToScreen(pos.x, pos.y).y) / 2;
                
                // v0.20.0: 检查是否通往Boss房（door.target 是目标房间）
                const leadsToBoss = door.target && door.target.type === 'boss';
                
                if (doorSprite) {
                    ctx.save();
                    ctx.translate(centerX.x, centerX.y);
                    ctx.rotate(pos.rotation);
                    ctx.drawImage(doorSprite, -halfW, -halfH, halfW * 2, halfH * 2);
                    
                    // v0.20.0-fix: 通往Boss房的门 - 径向渐变光晕效果
                    if (leadsToBoss) {
                        const time = Date.now() / 1000;
                        const pulse = 0.5 + Math.sin(time * 3) * 0.5; // 柔和脉动
                        
                        // 绘制多层光晕（从中心向外扩散）
                        const centerX = 0;
                        const centerY = 0;
                        const maxRadius = Math.max(halfW, halfH) * 2.5;
                        
                        // 外层光晕 - 最淡最大
                        const outerGradient = ctx.createRadialGradient(
                            centerX, centerY, Math.max(halfW, halfH) * 0.8,
                            centerX, centerY, maxRadius
                        );
                        outerGradient.addColorStop(0, `rgba(255, 0, 0, ${0.4 + pulse * 0.2})`);
                        outerGradient.addColorStop(0.5, `rgba(255, 50, 0, ${0.2 + pulse * 0.15})`);
                        outerGradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
                        
                        ctx.fillStyle = outerGradient;
                        ctx.fillRect(-maxRadius, -maxRadius, maxRadius * 2, maxRadius * 2);
                        
                        // 中层光晕
                        const midGradient = ctx.createRadialGradient(
                            centerX, centerY, halfW * 0.5,
                            centerX, centerY, Math.max(halfW, halfH) * 1.5
                        );
                        midGradient.addColorStop(0, `rgba(255, 100, 50, ${0.5 + pulse * 0.3})`);
                        midGradient.addColorStop(1, 'rgba(255, 50, 0, 0)');
                        
                        ctx.fillStyle = midGradient;
                        ctx.fillRect(-maxRadius, -maxRadius, maxRadius * 2, maxRadius * 2);
                        
                        // 绘制警告符号 ☠️（在门上方）
                        ctx.fillStyle = `rgba(255, 255, 255, ${0.8 + pulse * 0.2})`;
                        ctx.font = `${Math.min(20, halfW * 0.8)}px Arial`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText('☠️', 0, -halfH + 20);
                    }
                    
                    ctx.restore();
                } else {
                    const screenPos = camera.worldToScreen(pos.x, pos.y);
                    const screenEnd = camera.worldToScreen(pos.x + pos.w, pos.y + pos.h);
                    const screenW = screenEnd.x - screenPos.x;
                    const screenH = screenEnd.y - screenPos.y;
                    
                    // v0.20.0-fix: 通往Boss房的门 - 径向渐变光晕
                    if (leadsToBoss) {
                        const time = Date.now() / 1000;
                        const pulse = 0.5 + Math.sin(time * 3) * 0.5;
                        const centerX = screenPos.x + screenW / 2;
                        const centerY = screenPos.y + screenH / 2;
                        const maxRadius = Math.max(screenW, screenH) * 1.5;
                        
                        // 外层径向渐变光晕
                        const gradient = ctx.createRadialGradient(
                            centerX, centerY, Math.max(screenW, screenH) * 0.3,
                            centerX, centerY, maxRadius
                        );
                        gradient.addColorStop(0, `rgba(255, 80, 50, ${0.6 + pulse * 0.2})`);
                        gradient.addColorStop(0.5, `rgba(255, 30, 0, ${0.3 + pulse * 0.15})`);
                        gradient.addColorStop(1, 'rgba(255, 0, 0, 0)');
                        
                        ctx.fillStyle = gradient;
                        ctx.fillRect(
                            centerX - maxRadius, 
                            centerY - maxRadius, 
                            maxRadius * 2, 
                            maxRadius * 2
                        );
                        
                        // 门主体（暗红色）
                        ctx.fillStyle = `rgba(120, 20, 20, ${0.9 + pulse * 0.1})`;
                        ctx.fillRect(screenPos.x, screenPos.y, screenW, screenH);
                        
                        // 骷髅符号
                        ctx.fillStyle = `rgba(255, 255, 255, ${0.8 + pulse * 0.2})`;
                        ctx.font = `${Math.min(24, screenW * 0.5)}px Arial`;
                        ctx.textAlign = 'center';
                        ctx.textBaseline = 'middle';
                        ctx.fillText('☠️', centerX, centerY);
                    } else {
                        ctx.fillStyle = '#555';
                        ctx.fillRect(screenPos.x - 2, screenPos.y - 2, screenW + 4, screenH + 4);
                        ctx.fillStyle = door.open ? '#4a4' : '#a44';
                        ctx.fillRect(screenPos.x, screenPos.y, screenW, screenH);
                    }
                }
            }
        }

        

        // 房间信息现在显示在顶部栏，不再在房间内绘制

    }

    

    drawAmbientEffects(ctx, camera, sprites, viewLeft, viewTop, viewRight, viewBottom) {

        const center = camera.worldToScreen(this.centerX, this.centerY);

        const time = Date.now() / 1000;

        let grad, pulse, sparkle, hiddenPulse, x, y, pos, flicker;

        

        // Phase 2 rollback: clear the full-scene shell until a stable material pass is ready.

        // 根据房间类型添加不同氛围效果

        switch(this.type) {

            case 'boss':

                // Boss房间 - 脉动红光

                pulse = 0.3 + Math.sin(time * 2) * 0.1;

                grad = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, 400);

                grad.addColorStop(0, `rgba(255, 0, 0, ${pulse})`);

                grad.addColorStop(0.5, `rgba(100, 0, 0, ${pulse * 0.5})`);

                grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

                ctx.fillStyle = grad;

                ctx.fillRect(0, 0, camera.viewWidth, camera.viewHeight);

                break;

                

            case 'treasure':
                // 宝箱房 - 金色微光
                sparkle = 0.15 + Math.sin(time * 3) * 0.05;
                grad = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, 300);
                grad.addColorStop(0, `rgba(255, 215, 0, ${sparkle})`);
                grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, camera.viewWidth, camera.viewHeight);
                
                // 绘制宝箱贴图在房间中央
                if (sprites && this.chest) {
                    const chestSpriteName = this.chest.opened ? 'chest_open' : 'chest_closed';
                    const chestSprite = sprites.get(chestSpriteName);
                    if (chestSprite) {
                        const pos = camera.worldToScreen(this.chest.x, this.chest.y);
                        const size = 32;
                        ctx.drawImage(chestSprite, pos.x - size, pos.y - size, size * 2, size * 2);
                        
                        // 绘制交互提示
                        if (!this.chest.opened && window.game && window.game.player) {
                            const d = Math.hypot(window.game.player.x - this.chest.x, window.game.player.y - this.chest.y);
                            if (d < 60) {
                                ctx.fillStyle = '#4f4';
                                ctx.font = '12px Arial';
                                ctx.textAlign = 'center';
                                ctx.fillText('按E打开', pos.x, pos.y - 40);
                            }
                        }
                    }
                }
                break;

                

            case 'shop':

                // 商店 - 蓝色魔法光

                grad = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, 250);

                grad.addColorStop(0, 'rgba(100, 150, 255, 0.1)');

                grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

                ctx.fillStyle = grad;

                ctx.fillRect(0, 0, camera.viewWidth, camera.viewHeight);

                break;

                

            case 'hidden':

                // 隐藏房 - 紫色诡异光芒

                hiddenPulse = 0.2 + Math.sin(time * 1.5) * 0.08;

                grad = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, 350);

                grad.addColorStop(0, `rgba(148, 0, 211, ${hiddenPulse})`);

                grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

                ctx.fillStyle = grad;

                ctx.fillRect(0, 0, camera.viewWidth, camera.viewHeight);

                break;

                

            default:

                // 普通房间 - 微弱环境光

                if (Math.random() < 0.02) {

                    // 偶尔闪烁的微光

                    x = viewLeft + Math.random() * (viewRight - viewLeft);

                    y = viewTop + Math.random() * (viewBottom - viewTop);

                    pos = camera.worldToScreen(x, y);

                    flicker = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 30);

                    flicker.addColorStop(0, 'rgba(100, 200, 255, 0.1)');

                    flicker.addColorStop(1, 'rgba(0, 0, 0, 0)');

                    ctx.fillStyle = flicker;

                    ctx.beginPath();

                    ctx.arc(pos.x, pos.y, 30, 0, Math.PI * 2);

                    ctx.fill();

                }

        }

    }

    drawLayer1FullSceneEnvelope(ctx, scene, time) {
        const width = scene.canvasW;
        const height = scene.canvasH;
        const center = scene.center;
        const roomRect = scene.roomRect;
        const floorRect = scene.floorRect;
        const shell = {
            left: Math.max(12, floorRect.left - roomRect.left),
            right: Math.max(12, roomRect.right - floorRect.right),
            top: Math.max(12, floorRect.top - roomRect.top),
            bottom: Math.max(12, roomRect.bottom - floorRect.bottom)
        };
        const lipSize = Math.max(shell.left, shell.top) * 1.7;
        const roomSeed = ((this.gx + 11) * 31 + (this.gy + 7) * 17 + this.floor * 13) & 0xffff;
        const textures = this.getLayer1EnvelopeTextures();
        const fillBandShape = (points, fillStyle, blur = 0, alpha = 1) => {
            ctx.save();
            if (blur > 0) ctx.filter = `blur(${blur}px)`;
            ctx.globalAlpha = alpha;
            ctx.fillStyle = fillStyle;
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.closePath();
            ctx.fill();
            ctx.restore();
        };
        const drawTexturedShape = (points, image, dest, options = {}) => {
            if (!this.isEnvelopeTextureReady(image)) return;

            const {
                alpha = 1,
                blur = 0,
                mirrorX = false,
                mirrorY = false
            } = options;

            ctx.save();
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
                ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.closePath();
            ctx.clip();
            if (blur > 0) ctx.filter = `blur(${blur}px)`;
            ctx.globalAlpha = alpha;
            ctx.translate(dest.x + (mirrorX ? dest.w : 0), dest.y + (mirrorY ? dest.h : 0));
            ctx.scale(mirrorX ? -1 : 1, mirrorY ? -1 : 1);
            ctx.drawImage(image, 0, 0, dest.w, dest.h);
            ctx.restore();
        };
        const drawStamp = (image, x, y, w, h, options = {}) => {
            if (!this.isEnvelopeTextureReady(image)) return;

            const {
                alpha = 1,
                blur = 0,
                mirrorX = false,
                mirrorY = false
            } = options;

            ctx.save();
            if (blur > 0) ctx.filter = `blur(${blur}px)`;
            ctx.globalAlpha = alpha;
            ctx.translate(x + (mirrorX ? w : 0), y + (mirrorY ? h : 0));
            ctx.scale(mirrorX ? -1 : 1, mirrorY ? -1 : 1);
            ctx.drawImage(image, 0, 0, w, h);
            ctx.restore();
        };

        ctx.save();
        ctx.fillStyle = '#0b0c0e';
        ctx.fillRect(0, 0, width, height);

        let grad = ctx.createRadialGradient(center.x, center.y, floorRect.width * 0.18, center.x, center.y, width * 0.58);
        grad.addColorStop(0, 'rgba(128, 136, 146, 0.12)');
        grad.addColorStop(0.48, 'rgba(54, 58, 63, 0.14)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.48)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        const topPoints = [
            { x: roomRect.left + width * 0.04, y: roomRect.top },
            { x: roomRect.left + width * 0.16, y: roomRect.top + shell.top * 0.28 },
            { x: floorRect.left + shell.left * 0.16, y: floorRect.top - shell.top * 0.48 },
            { x: center.x - floorRect.width * 0.18, y: floorRect.top - shell.top * 0.78 },
            { x: center.x, y: floorRect.top - shell.top * 0.42 },
            { x: center.x + floorRect.width * 0.18, y: floorRect.top - shell.top * 0.78 },
            { x: floorRect.right - shell.right * 0.16, y: floorRect.top - shell.top * 0.48 },
            { x: roomRect.right - width * 0.16, y: roomRect.top + shell.top * 0.28 },
            { x: roomRect.right - width * 0.04, y: roomRect.top }
        ];
        grad = ctx.createLinearGradient(0, roomRect.top, 0, floorRect.top);
        grad.addColorStop(0, 'rgba(7, 9, 12, 0.84)');
        grad.addColorStop(0.55, 'rgba(24, 26, 28, 0.48)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        fillBandShape(topPoints, grad, 8, 1);
        fillBandShape([
            { x: width * 0.16, y: height * 0.02 },
            { x: width * 0.28, y: height * 0.1 },
            { x: width * 0.42, y: height * 0.16 },
            { x: width * 0.5, y: height * 0.14 },
            { x: width * 0.58, y: height * 0.16 },
            { x: width * 0.72, y: height * 0.1 },
            { x: width * 0.84, y: height * 0.02 },
            { x: width * 0.84, y: 0 },
            { x: width * 0.16, y: 0 }
        ], 'rgba(220, 226, 232, 0.035)', 12, 1);

        drawTexturedShape(topPoints, textures?.wallCoreTop || textures?.wallTop, {
            x: floorRect.left - shell.left * 0.42,
            y: roomRect.top,
            w: floorRect.width + (shell.left + shell.right) * 0.84,
            h: Math.max(shell.top * 2.1, lipSize)
        }, { alpha: 0.32, blur: 1.6 });

        const leftPoints = [
            { x: roomRect.left, y: roomRect.top + shell.top * 0.16 },
            { x: floorRect.left - shell.left * 0.05, y: floorRect.top - shell.top * 0.08 },
            { x: floorRect.left - shell.left * 0.32, y: center.y - floorRect.height * 0.24 },
            { x: floorRect.left - shell.left * 0.14, y: center.y },
            { x: floorRect.left - shell.left * 0.28, y: center.y + floorRect.height * 0.24 },
            { x: floorRect.left - shell.left * 0.04, y: floorRect.bottom + shell.bottom * 0.08 },
            { x: roomRect.left, y: roomRect.bottom - shell.bottom * 0.14 }
        ];
        grad = ctx.createLinearGradient(roomRect.left, 0, floorRect.left, 0);
        grad.addColorStop(0, 'rgba(4, 5, 7, 0.9)');
        grad.addColorStop(0.52, 'rgba(22, 24, 27, 0.44)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        fillBandShape(leftPoints, grad, 6, 1);
        drawTexturedShape(leftPoints, textures?.wallCoreBase || textures?.wallBase, {
            x: roomRect.left - shell.left * 0.1,
            y: floorRect.top - shell.top * 0.2,
            w: Math.max(shell.left * 1.55, lipSize * 0.82),
            h: floorRect.height + shell.top * 0.4 + shell.bottom * 0.4
        }, { alpha: 0.22, blur: 0.9 });

        const rightPoints = [
            { x: roomRect.right, y: roomRect.top + shell.top * 0.16 },
            { x: floorRect.right + shell.right * 0.05, y: floorRect.top - shell.top * 0.08 },
            { x: floorRect.right + shell.right * 0.32, y: center.y - floorRect.height * 0.24 },
            { x: floorRect.right + shell.right * 0.14, y: center.y },
            { x: floorRect.right + shell.right * 0.28, y: center.y + floorRect.height * 0.24 },
            { x: floorRect.right + shell.right * 0.04, y: floorRect.bottom + shell.bottom * 0.08 },
            { x: roomRect.right, y: roomRect.bottom - shell.bottom * 0.14 }
        ];
        grad = ctx.createLinearGradient(roomRect.right, 0, floorRect.right, 0);
        grad.addColorStop(0, 'rgba(4, 5, 7, 0.9)');
        grad.addColorStop(0.52, 'rgba(22, 24, 27, 0.44)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        fillBandShape(rightPoints, grad, 6, 1);
        drawTexturedShape(rightPoints, textures?.wallCoreBase || textures?.wallBase, {
            x: floorRect.right - Math.max(shell.right * 0.55, lipSize * 0.2),
            y: floorRect.top - shell.top * 0.2,
            w: Math.max(shell.right * 1.55, lipSize * 0.82),
            h: floorRect.height + shell.top * 0.4 + shell.bottom * 0.4
        }, { alpha: 0.22, blur: 0.9, mirrorX: true });

        const bottomPoints = [
            { x: roomRect.left + width * 0.05, y: roomRect.bottom },
            { x: roomRect.left + width * 0.14, y: roomRect.bottom - shell.bottom * 0.12 },
            { x: floorRect.left + floorRect.width * 0.08, y: floorRect.bottom - shell.bottom * 0.06 },
            { x: center.x - floorRect.width * 0.18, y: floorRect.bottom - shell.bottom * 0.34 },
            { x: center.x, y: floorRect.bottom - shell.bottom * 0.14 },
            { x: center.x + floorRect.width * 0.18, y: floorRect.bottom - shell.bottom * 0.34 },
            { x: floorRect.right - floorRect.width * 0.08, y: floorRect.bottom - shell.bottom * 0.06 },
            { x: roomRect.right - width * 0.14, y: roomRect.bottom - shell.bottom * 0.12 },
            { x: roomRect.right - width * 0.05, y: roomRect.bottom }
        ];
        grad = ctx.createLinearGradient(0, floorRect.bottom - shell.bottom * 0.4, 0, roomRect.bottom);
        grad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        grad.addColorStop(0.44, 'rgba(10, 11, 13, 0.22)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0.82)');
        fillBandShape(bottomPoints, grad, 8, 1);
        drawTexturedShape(bottomPoints, textures?.wallCoreBottom || textures?.wallBottom, {
            x: floorRect.left - floorRect.width * 0.08,
            y: floorRect.bottom - shell.bottom * 0.36,
            w: floorRect.width * 1.16,
            h: Math.max(shell.bottom * 2.2, lipSize * 0.9)
        }, { alpha: 0.34, blur: 1.8 });

        drawStamp(textures?.cornerInnerTl, floorRect.left - lipSize * 0.76, floorRect.top - lipSize * 0.7, lipSize, lipSize, { alpha: 0.62, blur: 0.3 });
        drawStamp(textures?.cornerInnerTr, floorRect.right - lipSize * 0.24, floorRect.top - lipSize * 0.7, lipSize, lipSize, { alpha: 0.62, blur: 0.3 });
        drawStamp(textures?.cornerInnerBl, floorRect.left - lipSize * 0.76, floorRect.bottom - lipSize * 0.28, lipSize, lipSize, { alpha: 0.58, blur: 0.4 });
        drawStamp(textures?.cornerInnerBr, floorRect.right - lipSize * 0.24, floorRect.bottom - lipSize * 0.28, lipSize, lipSize, { alpha: 0.58, blur: 0.4 });

        if ((roomSeed & 1) === 0) {
            drawStamp(textures?.wallGlowing, roomRect.left + shell.left * 0.08, floorRect.top + floorRect.height * 0.1, shell.left * 0.9, floorRect.height * 0.24, { alpha: 0.16, blur: 1.1 });
        }
        if ((roomSeed & 2) === 0) {
            drawStamp(textures?.wallGlowing, roomRect.right - shell.right * 0.98, floorRect.top + floorRect.height * 0.62, shell.right * 0.9, floorRect.height * 0.2, { alpha: 0.16, blur: 1.1, mirrorX: true });
        }

        for (let i = 0; i < 7; i++) {
            const angle = time * (0.08 + i * 0.02) + roomSeed * 0.001 + i * 1.7;
            const px = width * (0.08 + (((roomSeed + i * 97) % 840) / 1000));
            const py = height * (0.08 + (((roomSeed + i * 53) % 760) / 1000)) + Math.sin(angle) * 12;
            const radius = 1.5 + (i % 3) * 0.7;
            const spore = ctx.createRadialGradient(px, py, 0, px, py, radius * 6);
            spore.addColorStop(0, 'rgba(231, 237, 245, 0.35)');
            spore.addColorStop(1, 'rgba(231, 237, 245, 0)');
            ctx.fillStyle = spore;
            ctx.beginPath();
            ctx.arc(px, py, radius * 6, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

}



// ============================================================================

// 吸血鬼幸存者风格刷怪系统 v2.0

// ============================================================================


// Export to global
window.Room = Room;
