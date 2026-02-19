const { chromium } = require('playwright');
const fs = require('fs');

const RECORD_VIDEO = process.argv[2] === '1';
const TRAIN_COUNT = process.argv[3] || '0';

async function train() {
    const browser = await chromium.launch({ headless: true });
    
    const contextOptions = RECORD_VIDEO ? {
        recordVideo: {
            dir: '/root/.openclaw/workspace/rouge-cow-videos/',
            size: { width: 1200, height: 800 }
        }
    } : {};
    
    const context = await browser.newContext(contextOptions);
    const page = await context.newPage();
    
    // 数据记录
    const gameplayData = {
        version: require('../package.json')?.version || 'v0.7.0',
        trainCount: TRAIN_COUNT,
        timestamp: new Date().toISOString(),
        events: []
    };
    
    try {
        await page.goto('file:///root/.openclaw/workspace/rougelike-cow/index.html');
        await page.waitForTimeout(5000);
        
        // 等待游戏对象初始化
        console.log('等待游戏初始化...');
        let gameReady = false;
        for (let retry = 0; retry < 15; retry++) {
            gameReady = await page.evaluate(() => {
                // 尝试从全局作用域获取game实例
                if (window.gameInstance) return true;
                if (window.game) return true;
                // 或者检查canvas是否存在且游戏已启动
                const canvas = document.getElementById('gameCanvas');
                const loading = document.getElementById('loading');
                const isLoadingHidden = loading && loading.classList.contains('hidden');
                return canvas !== null && isLoadingHidden;
            });
            if (gameReady) {
                console.log('游戏已就绪');
                break;
            }
            console.log(`等待游戏初始化... (${retry + 1}/15)`);
            await page.waitForTimeout(1000);
        }
        
        if (!gameReady) {
            console.log('警告: 游戏可能未完全初始化，但继续执行...');
        }
        
        // 跳过剧情
        console.log('尝试点击开始按钮...');
        await page.click('#startGameBtn').catch(() => {});
        await page.waitForTimeout(1000);
        
        // 再次尝试点击（可能第一次没点到）
        await page.click('#startGameBtn').catch(() => {});
        await page.waitForTimeout(500);
        
        // 尝试按空格或回车开始
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);
        
        // 开启无敌模式（确保能收集足够数据）
        console.log('开启无敌模式...');
        await page.keyboard.press('g');
        await page.waitForTimeout(200);
        
        // 游戏数据收集
        let lastState = null;
        const startTime = Date.now();
        
        // 运行30秒游戏
        console.log('开始30秒游戏数据收集...');
        for (let i = 0; i < 60; i++) {
            const gameInfo = await page.evaluate(() => {
                // 尝试多种方式获取游戏状态
                // 从页面脚本上下文中查找Game实例
                const g = window.gameInstance || window.game || window._game;
                // 或者直接从DOM元素推断状态
                const canvas = document.getElementById('gameCanvas');
                const ui = document.getElementById('gameUI');
                
                // 尝试通过canvas上下文获取信息
                let canvasInfo = null;
                if (canvas) {
                    try {
                        const ctx = canvas.getContext('2d');
                        canvasInfo = {
                            width: canvas.width,
                            height: canvas.height
                        };
                    } catch(e) {}
                }
                
                if (g) {
                    return {
                        source: 'gameObject',
                        state: g.state,
                        roomType: g.curRoom?.type,
                        enemies: g.curRoom?.enemies?.length || 0,
                        hp: g.player?.hp,
                        maxHp: g.player?.maxHp,
                        lv: g.player?.lv,
                        exp: g.player?.exp,
                        x: g.player?.x,
                        y: g.player?.y
                    };
                } else if (canvas) {
                    // 基础状态检测
                    return {
                        source: 'canvas',
                        canvasExists: true,
                        uiVisible: ui ? ui.style.display !== 'none' : false,
                        ...canvasInfo
                    };
                }
                return null;
            });
            
            if (gameInfo) {
                gameplayData.events.push({
                    time: (Date.now() - startTime) / 1000,
                    ...gameInfo
                });
                
                // 简单AI策略：随机移动
                const dirs = ['w', 'a', 's', 'd'];
                const dir = dirs[Math.floor(Math.random() * 4)];
                await page.keyboard.down(dir);
                await page.waitForTimeout(200);
                await page.keyboard.up(dir);
                
                // 偶尔攻击
                if (Math.random() < 0.3) {
                    await page.keyboard.press(' ');
                }
            }
            
            await page.waitForTimeout(300);
        }
        
        // 保存训练数据
        const dataDir = '/root/.openclaw/workspace/rougelike-cow/ai_training/data';
        if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
        
        fs.writeFileSync(
            `${dataDir}/train_${TRAIN_COUNT}_${Date.now()}.json`,
            JSON.stringify(gameplayData, null, 2)
        );
        
        console.log(`训练 #${TRAIN_COUNT} 完成，记录了 ${gameplayData.events.length} 个事件`);
        
    } catch (e) {
        console.error('训练出错:', e.message);
    }
    
    await context.close();
    await browser.close();
}

train().catch(console.error);
