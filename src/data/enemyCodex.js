/**
 * 敌人图鉴系统 - EnemyCodex (深根之疫版)
 * v0.10.0 - 模块化重构
 */

const ENEMY_CODEX_DATA = {
    // 第一层 - 跳跳（被寄生的草原袋鼠）
    rabbit: {
        name: '跳跳',
        title: '被寄生的草原袋鼠',
        realName: '跳跳 - 牛牛的童年玩伴',
        story: [
            '跳跳曾经是和牛牛比赛跑步的草原袋鼠，动作敏捷，性格活泼。',
            '但现在的跳跳双眼泛着乳白色的光泽，腹部裂开，伸出数条节肢状的附肢。',
            '在临死前，他恢复了片刻清醒："地……底下……母虫……在做梦……快……醒……"'
        ],
        unlockCondition: '击败第1层Boss',
        floor: 1,
        quote: '"他的攻击方式还是熟悉的回旋踢，但力量足以击碎岩石。"'
    },
    
    // 第二层 - 铁爪（被寄生的金雕）
    bird: {
        name: '铁爪',
        title: '被寄生的天空霸主',
        realName: '铁爪 - 曾经骄傲的猎手',
        story: [
            '铁爪是草原上最骄傲的金雕，他的视野能覆盖整片青穗大草原。',
            '现在的他翅膀上长满了菌丝羽毛，能在洞穴的垂直空间中高速俯冲。',
            '每一次俯冲都带着尖锐的啸叫，像是痛苦的哀鸣。'
        ],
        unlockCondition: '击败第2层Boss',
        floor: 2,
        quote: '"他曾是天空的主人，现在却沦为地底的囚徒。"'
    },
    
    // 第三层 - 泥背（被寄生的象龟）
    mouse: {
        name: '泥背',
        title: '移动孵化场',
        realName: '泥背 - 憨厚的老象龟',
        story: [
            '泥背是月牙湖边最年长的象龟，他缓慢而温和，从不会主动攻击任何生物。',
            '现在他的背甲变成了移动的孵化场，不断释放出自爆型的小寄生虫。',
            '那些从他背壳裂缝中爬出的虫子，是他曾经保护的生命的扭曲形态。'
        ],
        unlockCondition: '击败第3层Boss',
        floor: 3,
        quote: '"他背上的不是家园，而是坟墓。"'
    },
    
    // 第四层 - 银牙（被寄生的狼王）
    cat: {
        name: '银牙',
        title: '共生狼群核心',
        realName: '银牙 - 狼群的守护者',
        story: [
            '银牙曾是狼群的首领，他守护着草原上的平衡，只猎取所需，从不滥杀。',
            '现在的他是一群共生狼群的核心，每一只狼的脊椎都外露，连接着神经索。',
            '他们共享视野与痛觉，当一只受伤时，所有的狼都会发出悲鸣。'
        ],
        unlockCondition: '击败第4层Boss',
        floor: 4,
        quote: '"群体的力量变成了群体的诅咒。"'
    },
    
    // 第五层 - 盲眼（未完全寄生的老鼹鼠）
    turtle: {
        name: '盲眼',
        title: '最后的清醒者',
        realName: '盲眼 - 地底的见证者',
        story: [
            '盲眼是一只老迈的鼹鼠，他住在墙壁上的隔离腔室里，周围涂满了抑制菌丝生长的分泌物。',
            '他是唯一一个没有被完全寄生的存在，数十年来一直观察着母虫的动静。',
            '"你父亲……是个固执的傻瓜。他明知道下来就是送死，还是跟着歌声走了。"'
        ],
        unlockCondition: '击败第5层Boss',
        floor: 5,
        quote: '"他选择了黑暗，只为守护最后一丝光明。"'
    },
    
    // 第六层 - 深渊母体（母虫）
    mother: {
        name: '深渊母体',
        title: '母虫的显现形态',
        realName: '母虫 - 来自群星的格式塔',
        story: [
            '母虫并非单纯的怪物，而是大地本身的病变。千年前，一颗陨星坠入草原深处，带来了来自群星的种子。',
            '那东西不是生命，而是生命的模板，一种能够优化、统一、同化所有生物的格式塔意识。',
            '它无法理解为什么这些生物会为了别人而牺牲自己。这对它来说……很新奇。'
        ],
        unlockCondition: '击败深渊母体',
        floor: 6,
        quote: '"它学会了爱的概念，就像学会了一种武器。"'
    }
};

class EnemyCodex {
    constructor() {
        this.unlocked = new Set();
        this.loadProgress();
    }
    
    unlock(enemyType) {
        if (ENEMY_CODEX_DATA[enemyType] && !this.unlocked.has(enemyType)) {
            this.unlocked.add(enemyType);
            this.saveProgress();
            this.showUnlockNotification(enemyType);
            return true;
        }
        return false;
    }
    
    isUnlocked(enemyType) {
        return this.unlocked.has(enemyType);
    }
    
    getUnlockedList() {
        return Array.from(this.unlocked);
    }
    
    getData(enemyType) {
        return ENEMY_CODEX_DATA[enemyType];
    }
    
    showUnlockNotification(enemyType) {
        const data = ENEMY_CODEX_DATA[enemyType];
        if (!data) return;
        
        const notif = document.createElement('div');
        notif.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: rgba(20, 10, 5, 0.95);
            border: 2px solid #a64;
            border-radius: 8px;
            padding: 15px 20px;
            color: #fff;
            font-family: Arial, sans-serif;
            z-index: 10000;
            max-width: 300px;
            animation: slideIn 0.5s ease;
        `;
        notif.innerHTML = `
            <div style="color: #a64; font-size: 12px; margin-bottom: 5px;">📖 图鉴已解锁</div>
            <div style="font-size: 18px; font-weight: bold; color: #fa0;">${data.name}</div>
            <div style="font-size: 12px; color: #888; margin-top: 5px;">${data.title}</div>
        `;
        
        document.body.appendChild(notif);
        
        setTimeout(() => {
            notif.style.animation = 'fadeOut 0.5s ease';
            setTimeout(() => notif.remove(), 500);
        }, 4000);
    }
    
    showCodexUI() {
        // 暂停游戏
        const wasPaused = window.game && window.game.paused;
        if (window.game) {
            window.game.paused = true;
        }
        
        const overlay = document.createElement('div');
        overlay.id = 'codexOverlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: Arial, sans-serif;
        `;
        
        const container = document.createElement('div');
        container.style.cssText = `
            width: 90%;
            max-width: 800px;
            max-height: 80%;
            background: rgba(20, 15, 10, 0.95);
            border: 2px solid #a64;
            border-radius: 12px;
            padding: 30px;
            overflow-y: auto;
        `;
        
        let html = `
            <div style="text-align: center; margin-bottom: 30px;">
                <h2 style="color: #fa0; margin: 0;">📖 被寄生的伙伴们</h2>
                <p style="color: #888; margin-top: 10px;">每一页都是一段悲剧的重逢</p>
            </div>
            <div style="display: grid; gap: 20px;">
        `;
        
        Object.entries(ENEMY_CODEX_DATA).forEach(([key, data]) => {
            const isUnlocked = this.unlocked.has(key);
            html += `
                <div style="
                    background: rgba(255,255,255,0.03);
                    border: 1px solid ${isUnlocked ? '#a64' : '#333'};
                    border-radius: 8px;
                    padding: 20px;
                    opacity: ${isUnlocked ? 1 : 0.5};
                ">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-size: 20px; color: ${isUnlocked ? '#fa0' : '#666'}; font-weight: bold;">
                                ${isUnlocked ? data.name : '???'}
                            </div>
                            <div style="font-size: 12px; color: ${isUnlocked ? '#a64' : '#555'}; margin-top: 4px;">
                                ${isUnlocked ? data.title : data.unlockCondition}
                            </div>
                        </div>
                        <div style="font-size: 12px; color: #666;">
                            ${isUnlocked ? `第${data.floor}层` : '🔒'}
                        </div>
                    </div>
                    ${isUnlocked ? `
                        <div style="margin-top: 15px; padding-top: 15px; border-top: 1px solid #333;">
                            <div style="color: #888; font-size: 13px; line-height: 1.6;">
                                ${data.story.map(s => `<p style="margin: 8px 0;">${s}</p>`).join('')}
                            </div>
                            <div style="margin-top: 12px; padding: 10px; background: rgba(170, 100, 60, 0.1); border-left: 3px solid #a64; color: #a64; font-style: italic; font-size: 12px;">
                                ${data.quote}
                            </div>
                        </div>
                    ` : ''}
                </div>
            `;
        });
        
        html += `
            </div>
            <div style="text-align: center; margin-top: 30px;">
                <button id="codexCloseBtn" style="
                    padding: 12px 40px;
                    background: #a64;
                    color: #fff;
                    border: none;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 16px;
                ">关闭</button>
            </div>
        `;
        
        container.innerHTML = html;
        overlay.appendChild(container);
        document.body.appendChild(overlay);
        
        // 关闭按钮事件
        document.getElementById('codexCloseBtn').addEventListener('click', () => {
            overlay.remove();
            // 恢复游戏状态
            if (window.game && !wasPaused) {
                window.game.paused = false;
            }
        });
        
        const closeHandler = (e) => {
            if (e.target === overlay) {
                overlay.remove();
                // 恢复游戏状态
                if (window.game && !wasPaused) {
                    window.game.paused = false;
                }
            }
        };
        overlay.addEventListener('click', closeHandler);
    }
    
    saveProgress() {
        try {
            localStorage.setItem('cowCodex', JSON.stringify(Array.from(this.unlocked)));
        } catch (e) {
            console.warn('Failed to save codex progress:', e);
        }
    }
    
    loadProgress() {
        try {
            const saved = localStorage.getItem('cowCodex');
            if (saved) {
                const data = JSON.parse(saved);
                data.forEach(key => this.unlocked.add(key));
            }
        } catch (e) {
            console.warn('Failed to load codex progress:', e);
        }
    }
    
    reset() {
        this.unlocked.clear();
        localStorage.removeItem('cowCodex');
    }
}

// 创建全局实例
window.enemyCodex = new EnemyCodex();
