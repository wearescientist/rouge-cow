/**
 * Room 绘制与氛围渲染逻辑
 * 从主类中拆分出来的原型扩展，保持运行行为不变。
 */
(function(global) {
    'use strict';

    const Room = global.Room;
    if (!Room) {
        console.warn('[RogueCow] Room 尚未加载，跳过扩展。');
        return;
    }

    Room.prototype.draw = function(ctx, camera, sprites) {
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

    Room.prototype.drawAmbientEffects = function(ctx, camera, sprites, viewLeft, viewTop, viewRight, viewBottom) {

        const center = camera.worldToScreen(this.centerX, this.centerY);

        const time = Date.now() / 1000;

        let grad, pulse, sparkle, hiddenPulse, x, y, pos, flicker;

        

        if (this.floor === 1) {
            this.drawLayer1FullSceneEnvelope(ctx, camera, center, time);
        }

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

    Room.prototype.drawLayer1FullSceneEnvelope = function(ctx, camera, center, time) {
        const width = camera.viewWidth;
        const height = camera.viewHeight;
        const pulse = 0.82 + Math.sin(time * 0.8) * 0.04;
        const roomSeed = ((this.gx + 11) * 31 + (this.gy + 7) * 17 + this.floor * 13) & 0xffff;

        ctx.save();

        let grad = ctx.createRadialGradient(center.x, height * 0.08, 0, center.x, height * 0.08, height * 0.28);
        grad.addColorStop(0, `rgba(236, 242, 248, ${0.11 * pulse})`);
        grad.addColorStop(0.42, `rgba(189, 197, 206, ${0.06 * pulse})`);
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height * 0.34);

        grad = ctx.createLinearGradient(0, 0, width * 0.16, 0);
        grad.addColorStop(0, 'rgba(10, 12, 14, 0.42)');
        grad.addColorStop(1, 'rgba(10, 12, 14, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, height * 0.08, width * 0.18, height * 0.82);

        grad = ctx.createLinearGradient(width, 0, width * 0.84, 0);
        grad.addColorStop(0, 'rgba(10, 12, 14, 0.42)');
        grad.addColorStop(1, 'rgba(10, 12, 14, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(width * 0.82, height * 0.08, width * 0.18, height * 0.82);

        ctx.save();
        ctx.filter = `blur(${Math.max(10, width * 0.012)}px)`;
        grad = ctx.createRadialGradient(width * 0.18, height * 0.88, 0, width * 0.18, height * 0.88, width * 0.17);
        grad.addColorStop(0, 'rgba(68, 67, 64, 0.34)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, height * 0.72, width * 0.42, height * 0.32);

        grad = ctx.createRadialGradient(width * 0.82, height * 0.88, 0, width * 0.82, height * 0.88, width * 0.17);
        grad.addColorStop(0, 'rgba(68, 67, 64, 0.34)');
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(width * 0.58, height * 0.72, width * 0.42, height * 0.32);
        ctx.restore();

        grad = ctx.createLinearGradient(0, height * 0.74, 0, height);
        grad.addColorStop(0, 'rgba(190, 183, 171, 0)');
        grad.addColorStop(0.45, 'rgba(87, 84, 79, 0.18)');
        grad.addColorStop(1, 'rgba(8, 9, 10, 0.48)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, height * 0.72, width, height * 0.28);

        for (let i = 0; i < 7; i++) {
            const angle = time * (0.08 + i * 0.02) + roomSeed * 0.001 + i * 1.7;
            const px = width * (0.18 + (((roomSeed + i * 97) % 620) / 1000));
            const py = height * (0.12 + (((roomSeed + i * 53) % 520) / 1000)) + Math.sin(angle) * 12;
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

    global.Room = Room;
})(window);
