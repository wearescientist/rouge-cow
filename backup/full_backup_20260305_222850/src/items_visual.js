/**
 * 肉鸽牛牛 - 道具视觉反馈系统
 * 道具获得效果、粒子特效、UI展示
 */

// ==================== 粒子效果 ====================
class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    // 创建获得道具时的粒子爆发
    createItemAcquireBurst(x, y, rarity) {
        const colors = {
            common: ["#ffffff", "#cccccc", "#999999"],
            rare: ["#4488ff", "#66aaff", "#88ccff"],
            epic: ["#aa44ff", "#cc66ff", "#ee88ff"],
            legendary: ["#ffcc00", "#ffdd44", "#ffee88"],
            cursed: ["#ff4444", "#ff6666", "#ff8888"]
        };

        const colorSet = colors[rarity] || colors.common;
        const count = rarity === "legendary" ? 50 : rarity === "epic" ? 30 : 20;

        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 * i) / count;
            const speed = 2 + Math.random() * 4;
            
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                decay: 0.02 + Math.random() * 0.02,
                size: 3 + Math.random() * 5,
                color: colorSet[Math.floor(Math.random() * colorSet.length)],
                type: "burst"
            });
        }
    }

    // 创建持续的道具光环效果
    createItemAura(x, y, itemId) {
        const rarityColors = {
            common: "rgba(255,255,255,0.3)",
            rare: "rgba(68,136,255,0.3)",
            epic: "rgba(170,68,255,0.3)",
            legendary: "rgba(255,204,0,0.3)",
            cursed: "rgba(255,68,68,0.3)"
        };

        // 每几帧产生一个环绕粒子
        if (Math.random() < 0.3) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 20 + Math.random() * 10;
            
            this.particles.push({
                x: x + Math.cos(angle) * radius,
                y: y + Math.sin(angle) * radius,
                vx: -Math.sin(angle) * 2,
                vy: Math.cos(angle) * 2,
                life: 1.0,
                decay: 0.01,
                size: 2 + Math.random() * 3,
                color: rarityColors[ITEMS_DATABASE[itemId]?.rarity || "common"],
                type: "aura"
            });
        }
    }

    // 更新所有粒子
    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            
            p.x += p.vx;
            p.y += p.vy;
            p.life -= p.decay;
            
            // 重力效果
            if (p.type === "burst") {
                p.vy += 0.1;
            }

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    // 绘制粒子
    draw(ctx) {
        ctx.save();
        
        for (const p of this.particles) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.restore();
    }
}

// ==================== 道具获得提示 ====================
class ItemNotification {
    constructor() {
        this.notifications = [];
    }

    // 添加获得提示
    show(item, x, y) {
        const rarityColors = {
            common: "#ffffff",
            rare: "#4488ff",
            epic: "#aa44ff",
            legendary: "#ffcc00",
            cursed: "#ff4444"
        };

        const rarityGlow = {
            common: 10,
            rare: 15,
            epic: 20,
            legendary: 30,
            cursed: 25
        };

        this.notifications.push({
            item: item,
            x: x,
            y: y,
            startY: y,
            life: 2.0,
            maxLife: 2.0,
            color: rarityColors[item.rarity],
            glow: rarityGlow[item.rarity],
            scale: 0,
            targetScale: 1
        });
    }

    // 更新
    update(dt) {
        for (let i = this.notifications.length - 1; i >= 0; i--) {
            const n = this.notifications[i];
            
            n.life -= dt;
            
            // 上升动画
            n.y = n.startY - (n.maxLife - n.life) * 30;
            
            // 缩放动画
            if (n.scale < n.targetScale) {
                n.scale += dt * 5;
                if (n.scale > n.targetScale) n.scale = n.targetScale;
            }
            
            if (n.life <= 0) {
                this.notifications.splice(i, 1);
            }
        }
    }

    // 绘制
    draw(ctx) {
        ctx.save();
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        for (const n of this.notifications) {
            const alpha = Math.min(1, n.life);
            ctx.globalAlpha = alpha;

            // 发光效果
            ctx.shadowColor = n.color;
            ctx.shadowBlur = n.glow * n.scale;

            // 图标
            ctx.font = `bold ${32 * n.scale}px Arial`;
            ctx.fillText(n.item.icon, n.x, n.y - 20);

            // 名称
            ctx.font = `bold ${16 * n.scale}px Arial`;
            ctx.fillStyle = n.color;
            ctx.fillText(n.item.name, n.x, n.y + 15);

            // 描述（小字）
            if (n.scale >= 0.8) {
                ctx.font = `${12}px Arial`;
                ctx.fillStyle = "#cccccc";
                ctx.fillText(n.item.description, n.x, n.y + 35);
            }
        }

        ctx.restore();
    }
}

// ==================== 房间奖励选择界面 ====================
class ItemSelectionUI {
    constructor(itemManager) {
        this.itemManager = itemManager;
        this.visible = false;
        this.items = [];
        this.selectedIndex = -1;
        this.animationProgress = 0;
        this.callback = null;
    }

    // 显示选择界面
    show(items, onSelect) {
        this.items = items;
        this.visible = true;
        this.selectedIndex = -1;
        this.animationProgress = 0;
        this.callback = onSelect;
        
        // 播放打开音效
        // Audio.play("item_select_open.mp3");
    }

    // 隐藏
    hide() {
        this.visible = false;
        this.items = [];
    }

    // 更新动画
    update(dt) {
        if (!this.visible) return;

        if (this.animationProgress < 1) {
            this.animationProgress += dt * 3;
            if (this.animationProgress > 1) this.animationProgress = 1;
        }
    }

    // 处理输入
    handleInput(input) {
        if (!this.visible) return;

        const itemCount = this.items.length;

        // 鼠标/触摸选择
        if (input.mouse) {
            const centerX = input.canvasWidth / 2;
            const centerY = input.canvasHeight / 2;
            const itemWidth = 150;
            const spacing = 180;
            const totalWidth = (itemCount - 1) * spacing;
            const startX = centerX - totalWidth / 2;

            for (let i = 0; i < itemCount; i++) {
                const x = startX + i * spacing;
                const y = centerY;
                
                const dx = input.mouse.x - x;
                const dy = input.mouse.y - y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < itemWidth / 2) {
                    this.selectedIndex = i;
                    
                    if (input.mouse.clicked) {
                        this.selectItem(i);
                    }
                    break;
                }
            }
        }

        // 键盘选择
        if (input.keys) {
            if (input.keys.justPressed["ArrowLeft"]) {
                this.selectedIndex = Math.max(0, this.selectedIndex - 1);
            }
            if (input.keys.justPressed["ArrowRight"]) {
                this.selectedIndex = Math.min(itemCount - 1, this.selectedIndex + 1);
            }
            if (input.keys.justPressed["Enter"] || input.keys.justPressed[" "]) {
                if (this.selectedIndex >= 0) {
                    this.selectItem(this.selectedIndex);
                }
            }

            // 数字键快速选择
            for (let i = 0; i < itemCount; i++) {
                if (input.keys.justPressed[(i + 1).toString()]) {
                    this.selectItem(i);
                }
            }
        }
    }

    // 选择道具
    selectItem(index) {
        const item = this.items[index];
        if (!item) return;

        // 播放选择音效
        // Audio.play("item_select_confirm.mp3");

        // 应用道具
        this.itemManager.acquireItem(item.id);

        // 回调
        if (this.callback) {
            this.callback(item);
        }

        this.hide();
    }

    // 绘制
    draw(ctx, width, height) {
        if (!this.visible) return;

        const progress = this.easeOutBack(this.animationProgress);

        ctx.save();

        // 背景遮罩
        ctx.fillStyle = `rgba(0, 0, 0, ${0.8 * progress})`;
        ctx.fillRect(0, 0, width, height);

        // 标题
        ctx.textAlign = "center";
        ctx.font = "bold 32px Arial";
        ctx.fillStyle = `rgba(255, 255, 255, ${progress})`;
        ctx.fillText("选择一个道具", width / 2, height / 2 - 180);

        // 绘制道具选项
        const itemCount = this.items.length;
        const itemWidth = 140;
        const itemHeight = 200;
        const spacing = 170;
        const totalWidth = (itemCount - 1) * spacing;
        const startX = width / 2 - totalWidth / 2;
        const centerY = height / 2;

        for (let i = 0; i < itemCount; i++) {
            const item = this.items[i];
            const x = startX + i * spacing;
            const y = centerY;
            const isSelected = i === this.selectedIndex;
            
            this.drawItemCard(ctx, item, x, y, itemWidth, itemHeight, progress, isSelected, i + 1);
        }

        // 操作提示
        ctx.font = "14px Arial";
        ctx.fillStyle = `rgba(200, 200, 200, ${progress})`;
        ctx.fillText("← → 选择 | Enter/空格/点击 确认 | 数字键 1-4 快速选择", width / 2, height - 50);

        ctx.restore();
    }

    // 绘制单个道具卡片
    drawItemCard(ctx, item, x, y, w, h, progress, selected, number) {
        const rarityColors = {
            common: { main: "#888888", light: "#aaaaaa", dark: "#666666" },
            rare: { main: "#4488ff", light: "#66aaff", dark: "#2266dd" },
            epic: { main: "#aa44ff", light: "#cc66ff", dark: "#8822dd" },
            legendary: { main: "#ffcc00", light: "#ffdd44", dark: "#ddaa00" },
            cursed: { main: "#ff4444", light: "#ff6666", dark: "#dd2222" }
        };

        const color = rarityColors[item.rarity];
        const scale = selected ? 1.1 : 1.0;
        const finalW = w * progress * scale;
        const finalH = h * progress * scale;
        const finalX = x - finalW / 2;
        const finalY = y - finalH / 2;

        ctx.save();

        // 阴影
        if (selected) {
            ctx.shadowColor = color.main;
            ctx.shadowBlur = 30;
        }

        // 卡片背景
        ctx.fillStyle = "#1a1a2e";
        ctx.fillRect(finalX, finalY, finalW, finalH);

        // 边框
        ctx.strokeStyle = color.main;
        ctx.lineWidth = selected ? 4 : 2;
        ctx.strokeRect(finalX, finalY, finalW, finalH);

        // 内部装饰线
        ctx.strokeStyle = color.dark;
        ctx.lineWidth = 1;
        ctx.strokeRect(finalX + 5, finalY + 5, finalW - 10, finalH - 10);

        // 数字标记
        ctx.font = "bold 16px Arial";
        ctx.fillStyle = color.light;
        ctx.textAlign = "left";
        ctx.fillText(`[${number}]`, finalX + 10, finalY + 25);

        // 稀有度标记
        ctx.font = "12px Arial";
        ctx.textAlign = "right";
        const rarityNames = {
            common: "普通",
            rare: "稀有",
            epic: "史诗",
            legendary: "传说",
            cursed: "诅咒"
        };
        ctx.fillText(rarityNames[item.rarity], finalX + finalW - 10, finalY + 25);

        // 图标
        ctx.textAlign = "center";
        ctx.font = `bold ${48 * progress}px Arial`;
        ctx.fillText(item.icon, x, finalY + 80);

        // 名称
        ctx.font = `bold ${16 * progress}px Arial`;
        ctx.fillStyle = color.light;
        ctx.fillText(item.name, x, finalY + 120);

        // 描述（自动换行）
        ctx.font = `${12 * progress}px Arial`;
        ctx.fillStyle = "#cccccc";
        this.wrapText(ctx, item.description, x, finalY + 150, finalW - 20, 16);

        // 已拥有数量
        const owned = this.itemManager.getItemCount(item.id);
        if (owned > 0) {
            ctx.fillStyle = "#ffff00";
            ctx.font = "bold 14px Arial";
            ctx.fillText(`已拥有: ${owned}`, x, finalY + finalH - 15);
        }

        ctx.restore();
    }

    // 文字自动换行
    wrapText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text;
        let line = "";
        let testLine = "";
        let lineArray = [];

        // 简单处理：每10个字符一行（中文）
        for (let i = 0; i < words.length; i++) {
            testLine = line + words[i];
            const metrics = ctx.measureText(testLine);
            
            if (metrics.width > maxWidth && i > 0) {
                lineArray.push(line);
                line = words[i];
            } else {
                line = testLine;
            }
        }
        lineArray.push(line);

        // 绘制
        for (let i = 0; i < lineArray.length && i < 3; i++) {
            ctx.fillText(lineArray[i], x, y + i * lineHeight);
        }
    }

    // 缓动函数
    easeOutBack(t) {
        const c1 = 1.70158;
        const c3 = c1 + 1;
        return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
    }
}

// ==================== 道具栏HUD ====================
class ItemHUD {
    constructor(itemManager) {
        this.itemManager = itemManager;
        this.slotSize = 40;
        this.spacing = 5;
    }

    // 绘制道具栏
    draw(ctx, x, y) {
        const items = this.itemManager.getOwnedItemsList();
        
        ctx.save();
        
        // 背景
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(x - 10, y - 10, this.slotSize * 8 + 20, this.slotSize + 20);

        // 绘制每个道具图标
        let drawX = x;
        for (const item of items.slice(0, 8)) { // 最多显示8个
            this.drawItemIcon(ctx, item, drawX, y);
            drawX += this.slotSize + this.spacing;
        }

        // 如果还有更多，显示+号
        if (items.length > 8) {
            ctx.fillStyle = "#888888";
            ctx.font = "bold 20px Arial";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText(`+${items.length - 8}`, drawX + this.slotSize / 2, y + this.slotSize / 2);
        }

        ctx.restore();
    }

    // 绘制单个道具图标
    drawItemIcon(ctx, item, x, y) {
        const rarityBorders = {
            common: "#888888",
            rare: "#4488ff",
            epic: "#aa44ff",
            legendary: "#ffcc00",
            cursed: "#ff4444"
        };

        const size = this.slotSize;

        ctx.save();

        // 边框
        ctx.strokeStyle = rarityBorders[item.rarity];
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, size, size);

        // 背景
        ctx.fillStyle = "#1a1a2e";
        ctx.fillRect(x + 2, y + 2, size - 4, size - 4);

        // 图标
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(item.icon, x + size / 2, y + size / 2);

        // 堆叠数量
        if (item.count > 1) {
            ctx.fillStyle = "#ffff00";
            ctx.font = "bold 12px Arial";
            ctx.textAlign = "right";
            ctx.fillText(item.count.toString(), x + size - 3, y + 12);
        }

        ctx.restore();
    }
}

// ==================== 导出 ====================
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ParticleSystem, ItemNotification, ItemSelectionUI, ItemHUD };
}
