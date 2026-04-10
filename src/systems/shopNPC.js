/**
 * 商店NPC实体类 - 盲眼
 * 供 Room.js 使用，仅负责绘制和碰撞
 */
function getShopEntityBrightness() {
    const settings = window.game?.runtimeSettings || window.game?.settings || {};
    const base = Number(settings.entityBrightness ?? 0.40);
    const category = Number(settings.propBrightness ?? 1);
    const safeBase = Number.isFinite(base) ? Math.max(0, Math.min(1, base)) : 0.40;
    const safeCategory = Number.isFinite(category) ? Math.max(0, Math.min(1.5, category)) : 1;
    return Math.max(0, Math.min(1.5, safeBase * safeCategory));
}

class ShopNPC {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.name = '盲眼';
        this.radius = 50;
        this.width = 100;
        this.height = 100;
        this.isShopTableObstacle = true;
        this.tableCollision = {
            centerOffsetX: 0,
            centerOffsetY: 18,
            halfWidth: 64,
            halfHeight: 42,
            padding: 16
        };
    }

    checkCollision(player) {
        const dx = Math.abs(player.x - this.x);
        const dy = Math.abs(player.y - this.y);
        return dx < (this.width/2 + player.width/2) && dy < (this.height/2 + player.height/2);
    }

    pushPlayer(player) {
        const dx = player.x - this.x;
        const dy = player.y - this.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        if (dist === 0) return;

        const minDist = this.radius + player.width/2 + 5;

        if (dist < minDist) {
            const pushRatio = (minDist - dist) / dist;
            player.x += dx * pushRatio;
            player.y += dy * pushRatio;
        }
    }

    draw(ctx, playerNear = false) {
        const entityBrightness = getShopEntityBrightness();
        ctx.save();
        ctx.filter = `brightness(${entityBrightness})`;
        // 背景方块 - 以feet为锚点，向上绘制
        const bgHeight = 140;
        const bgWidth = 140;
        ctx.fillStyle = '#1a1a2e';
        ctx.fillRect(this.x - bgWidth/2, this.y - bgHeight, bgWidth, bgHeight);

        ctx.strokeStyle = '#4a4';
        ctx.lineWidth = 3;
        ctx.strokeRect(this.x - bgWidth/2, this.y - bgHeight, bgWidth, bgHeight);

        // 图标 - 居中绘制（fillText的y是基线，需要向上偏移字体高度的一半）
        ctx.font = '64px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle'; // 使用居中对齐
        ctx.fillText('🐹', this.x - 16, this.y - bgHeight/2);
        ctx.fillText('👁️', this.x + 16, this.y - bgHeight/2);

        // 名字
        ctx.fillStyle = '#4f4';
        ctx.font = 'bold 24px Arial';
        ctx.fillText('盲眼', this.x, this.y - 20);
        
        // 恢复textBaseline
        ctx.textBaseline = 'alphabetic';
        ctx.restore();
    }
}

// 图腾系统配置（TotemManager.js 依赖）
const TOTEMS = {
    1: { id: 1, name: '先人之力', icon: '🗿', desc: '攻击力+10%', effect: 'dmg', value: 0.1 },
    2: { id: 2, name: '地脉守护', icon: '🛡️', desc: '最大生命+1', effect: 'maxHp', value: 1 },
    3: { id: 3, name: '疾风步', icon: '👟', desc: '移动速度+10%', effect: 'speed', value: 0.1 },
    4: { id: 4, name: '智慧之眼', icon: '👁️', desc: '经验获取+20%', effect: 'exp', value: 0.2 },
    5: { id: 5, name: '贪婪之手', icon: '💰', desc: '金币获取+25%', effect: 'gold', value: 0.25 },
    6: { id: 6, name: '再生之肤', icon: '❤️', desc: '生命恢复+0.1/秒', effect: 'regen', value: 0.1 },
    7: { id: 7, name: '幸运星', icon: '🍀', desc: '暴击率+5%', effect: 'crit', value: 0.05 }
};

window.ShopNPC = ShopNPC;
