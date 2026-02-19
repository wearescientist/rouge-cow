/**
 * 牛牛肉鸽 - AI 训练系统 v3.1 (Windows版) - 分数驱动+Bug检测版
 * 
 * 功能：
 * - AI 自动玩游戏，目标是获得最高分数
 * - 自动检测游戏Bug和问题
 * - 分数来源：击杀、探索、收集、通关等
 * - 支持游戏加速（训练速度提升）
 * 
 * 使用：node play_game_windows.js [--speed=2] [--max-time=600]
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const BugDetector = require('./bug_detector');

// ==================== 配置 ====================
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const VIDEO_DIR = path.join(PROJECT_ROOT, 'videos');
const DATA_DIR = path.join(PROJECT_ROOT, 'data');
const BUG_REPORT_DIR = path.join(PROJECT_ROOT, 'bug_reports');

// 解析命令行参数
const args = process.argv.slice(2);
const config = {
  speed: parseFloat(getArg('--speed')) || 2,
  maxTime: (parseInt(getArg('--max-time')) || 600) * 1000,
  forceVideo: args.includes('--video'),
  headless: args.includes('--headless'),
};

function getArg(name) {
  const arg = args.find(a => a.startsWith(name + '='));
  return arg ? arg.split('=')[1] : null;
}

// 确保目录存在
[VIDEO_DIR, DATA_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ==================== 工具函数 ====================
const sleep = ms => new Promise(r => setTimeout(r, ms));

// 获取训练次数
function getTrainCount() {
  const countFile = path.join(DATA_DIR, 'train_count.txt');
  if (fs.existsSync(countFile)) {
    return parseInt(fs.readFileSync(countFile, 'utf8')) || 0;
  }
  return 0;
}

function incrementTrainCount() {
  const countFile = path.join(DATA_DIR, 'train_count.txt');
  const count = getTrainCount() + 1;
  fs.writeFileSync(countFile, count.toString(), 'utf8');
  return count;
}

// ==================== 游戏状态检测 ====================
async function getGameState(page) {
  return await page.evaluate(() => {
    const game = window.game;
    if (!game) return null;
    
    const sm = game.scoreManager;
    
    const state = {
      // 玩家状态
      playerHp: game.player?.hp ?? 0,
      playerMaxHp: game.player?.maxHp ?? 0,
      playerLv: game.player?.lv ?? 1,
      playerGold: game.player?.gold ?? 0,
      
      // 游戏进度
      roomNumber: game.roomNumber ?? 1,
      totalRooms: game.TOTAL_ROOMS ?? 8,
      currentFloor: game.currentFloor ?? 1,
      
      // 敌人信息
      enemyCount: game.curRoom?.enemies?.length ?? 0,
      enemiesKilled: sm?.stats?.enemiesKilled ?? 0,
      
      // 波次信息
      wave: game.hordeManager?.wave ?? 0,
      waveActive: game.hordeManager?.waveActive ?? false,
      
      // 游戏状态
      isGameOver: game.state === 'gameover',
      isVictory: game.state === 'victory',
      isPaused: game.paused ?? false,
      
      // 武器/道具
      weaponCount: game.player?.weapons?.length ?? 0,
      itemCount: game.player?.items?.length ?? 0,
      
      // 分数系统
      score: sm?.score ?? 0,
      scoreStats: sm?.stats ?? {},
      killStreak: sm?.killStreak ?? 0,
      isPlaying: sm?.isPlaying ?? false,
      
      timestamp: Date.now()
    };
    
    // 检测游戏是否结束
    state.isFinished = state.isGameOver || state.isVictory;
    state.result = state.isVictory ? 'cleared' : state.isGameOver ? 'dead' : 'playing';
    
    return state;
  });
}

// 设置游戏速度
async function setGameSpeed(page, speed) {
  await page.evaluate((s) => {
    if (window.game && window.game.setSpeed) {
      window.game.setSpeed(s);
    }
  }, speed);
  console.log(`⚡ 游戏速度已设置为 ${speed}x`);
}

// ==================== AI 决策 ====================
// AI在页面内执行的决策逻辑
async function aiMakeDecision(page) {
  return await page.evaluate(() => {
    const game = window.game;
    if (!game || !game.player) return { action: 'none' };
    
    const sm = game.scoreManager;
    const player = game.player;
    const curRoom = game.curRoom;
    
    // AI策略权重（分数驱动）
    const PRIORITIES = {
      SURVIVAL: 0.25,   // 25% 生存（HP低时逃跑）
      COMBAT: 0.30,     // 30% 战斗（击杀得分）
      EXPLORATION: 0.30, // 30% 探索（新房间得分）
      COLLECTION: 0.15  // 15% 收集（道具金币得分）
    };
    
    // 根据当前状态决定行动
    const hpPercent = player.hp / player.maxHp;
    const hasEnemies = curRoom?.enemies?.length > 0;
    const hasUnclearedRooms = Object.values(curRoom?.doors || {}).some(d => d && !d.target?.visited);
    
    // 生存优先：HP < 30% 时逃跑
    if (hpPercent < 0.3 && hasEnemies) {
      return { action: 'flee', reason: 'low_hp' };
    }
    
    // 探索优先：有未探索的门且当前房间已清
    if (curRoom?.cleared && hasUnclearedRooms && Math.random() < PRIORITIES.EXPLORATION) {
      return { action: 'explore', reason: 'new_room' };
    }
    
    // 战斗优先：有敌人且HP健康
    if (hasEnemies && hpPercent > 0.5 && Math.random() < PRIORITIES.COMBAT) {
      return { action: 'combat', reason: 'kill_score' };
    }
    
    // 收集优先：房间内有可拾取物
    if ((curRoom?.items?.length > 0 || game.gems?.length > 0) && Math.random() < PRIORITIES.COLLECTION) {
      return { action: 'collect', reason: 'items' };
    }
    
    // 默认战斗
    if (hasEnemies) {
      return { action: 'combat', reason: 'default' };
    }
    
    return { action: 'explore', reason: 'default' };
  });
}

// 执行AI动作
async function aiExecuteAction(page, decision) {
  await page.evaluate((decision) => {
    const game = window.game;
    if (!game || !game.player) return;
    
    // 清理之前的按键
    game.keys = {};
    
    const action = decision.action;
    const player = game.player;
    const enemies = game.curRoom?.enemies || [];
    
    if (action === 'combat' && enemies.length > 0) {
      // 寻找最近的敌人
      let nearest = null;
      let minDist = Infinity;
      enemies.forEach(e => {
        const d = Math.sqrt((e.x - player.x) ** 2 + (e.y - player.y) ** 2);
        if (d < minDist) {
          minDist = d;
          nearest = e;
        }
      });
      
      if (nearest) {
        // 向敌人移动
        const dx = nearest.x - player.x;
        const dy = nearest.y - player.y;
        if (Math.abs(dx) > Math.abs(dy)) {
          game.keys[dx > 0 ? 'd' : 'a'] = true;
          player.x += (dx > 0 ? 1 : -1) * 150 * 0.016;
        } else {
          game.keys[dy > 0 ? 's' : 'w'] = true;
          player.y += (dy > 0 ? 1 : -1) * 150 * 0.016;
        }
        player.isMoving = true;
        
        // 近距离冲刺
        if (minDist < 60 && !player.isDashing && player.dashCooldown <= 0) {
          player.isDashing = true;
          player.dashTime = 0.15;
          player.dashCooldown = 0.8;
        }
      }
    }
    else if (action === 'flee' && enemies.length > 0) {
      // 远离敌人
      let nearest = enemies[0];
      let minDist = Infinity;
      enemies.forEach(e => {
        const d = Math.sqrt((e.x - player.x) ** 2 + (e.y - player.y) ** 2);
        if (d < minDist) {
          minDist = d;
          nearest = e;
        }
      });
      
      const dx = player.x - nearest.x;
      const dy = player.y - nearest.y;
      if (Math.abs(dx) > Math.abs(dy)) {
        game.keys[dx > 0 ? 'd' : 'a'] = true;
        player.x += (dx > 0 ? 1 : -1) * 150 * 0.016;
      } else {
        game.keys[dy > 0 ? 's' : 'w'] = true;
        player.y += (dy > 0 ? 1 : -1) * 150 * 0.016;
      }
      player.isMoving = true;
    }
    else if (action === 'explore') {
      // 随机移动探索
      const moves = ['w', 'a', 's', 'd'];
      const move = moves[Math.floor(Math.random() * moves.length)];
      game.keys[move] = true;
      
      const speed = 150 * 0.016;
      if (move === 'w') player.y -= speed;
      if (move === 's') player.y += speed;
      if (move === 'a') player.x -= speed;
      if (move === 'd') player.x += speed;
      player.isMoving = true;
    }
    else if (action === 'collect') {
      // 向最近的物品移动
      const items = [...(game.curRoom?.items || []), ...(game.gems || []), ...(game.goldDrops || [])];
      if (items.length > 0) {
        let nearest = items[0];
        let minDist = Infinity;
        items.forEach(item => {
          const d = Math.sqrt((item.x - player.x) ** 2 + (item.y - player.y) ** 2);
          if (d < minDist) {
            minDist = d;
            nearest = item;
          }
        });
        
        const dx = nearest.x - player.x;
        const dy = nearest.y - player.y;
        if (Math.abs(dx) > Math.abs(dy)) {
          game.keys[dx > 0 ? 'd' : 'a'] = true;
          player.x += (dx > 0 ? 1 : -1) * 150 * 0.016;
        } else {
          game.keys[dy > 0 ? 's' : 'w'] = true;
          player.y += (dy > 0 ? 1 : -1) * 150 * 0.016;
        }
        player.isMoving = true;
      }
    }
  }, decision);
}

// ==================== 主训练函数 ====================
async function train() {
  const trainCount = incrementTrainCount();
  const isVideoRun = config.forceVideo || trainCount % 10 === 0;
  const timestamp = Date.now();
  
  console.log(`\n🎮 ===== 牛牛肉鸽 AI 训练 #${trainCount} =====`);
  console.log(`   目标: 最大化游戏分数`);
  console.log(`   速度: ${config.speed}x`);
  console.log(`   最大时间: ${config.maxTime/1000}秒`);
  console.log(`   录制视频: ${isVideoRun ? '是' : '否'}`);
  console.log('');
  
  // 启动浏览器
  let browser;
  try {
    browser = await chromium.launch({ 
      headless: config.headless,
      channel: 'chrome',
      args: ['--disable-web-security']
    });
    console.log('✅ 使用系统 Chrome');
  } catch (e) {
    browser = await chromium.launch({ headless: config.headless });
    console.log('✅ 使用 Playwright Chromium');
  }
  
  const contextOptions = {
    viewport: { width: 1000, height: 700 },
    deviceScaleFactor: 1,
  };
  
  if (isVideoRun) {
    contextOptions.recordVideo = { dir: VIDEO_DIR, size: { width: 960, height: 640 } };
    console.log('📹 视频录制已开启');
  }
  
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();
  
  // 加载游戏
  const gamePath = path.join(PROJECT_ROOT, 'index.html');
  console.log(`🎯 加载游戏: ${gamePath}`);
  await page.goto(`file:///${gamePath.replace(/\\/g, '/')}`, { waitUntil: 'networkidle' });
  await sleep(3000);
  
  // 点击开始
  console.log('🖱️ 点击开始按钮...');
  await page.click('#startGameBtn');
  await sleep(1000);
  
  // 设置速度
  if (config.speed > 1) {
    await setGameSpeed(page, config.speed);
  }
  
  console.log('🚀 AI 开始游戏！目标：获得最高分数\n');
  console.log('🐛 Bug检测系统已启动，将实时监控游戏状态\n');
  
  // 初始化Bug检测器
  const bugDetector = new BugDetector(BUG_REPORT_DIR);
  
  // 数据收集
  const gameEvents = [];
  const startTime = Date.now();
  let lastState = null;
  let maxScore = 0;
  let bugCheckCounter = 0;
  
  // 游戏主循环
  while (true) {
    const elapsed = Date.now() - startTime;
    
    // 检查超时
    if (elapsed > config.maxTime) {
      console.log('\n⏰ 达到最大运行时间');
      break;
    }
    
    // 获取游戏状态
    const state = await getGameState(page);
    if (!state) {
      await sleep(100);
      continue;
    }
    
    // Bug检测（每10帧检测一次）
    bugCheckCounter++;
    if (bugCheckCounter % 10 === 0) {
      const bugs = await bugDetector.detect(page, state, trainCount);
      if (bugs.length > 0 && bugs.some(b => b.severity === 'critical')) {
        console.log('\n⚠️ 检测到严重问题，记录并继续...');
      }
    }
    
    // 更新最高分数
    if (state.score > maxScore) maxScore = state.score;
    
    // 检测游戏结束
    if (state.isFinished) {
      // 等待最终分数结算
      await sleep(500);
      const finalState = await getGameState(page);
      const finalScore = finalState?.score || state.score;
      
      console.log('\n' + '='.repeat(50));
      console.log(`🎮 训练 #${trainCount} 结束: ${state.result.toUpperCase()}`);
      console.log(`💯 最终分数: ${finalScore.toLocaleString()}`);
      console.log(`   最高分数: ${maxScore.toLocaleString()}`);
      console.log(`   击杀数: ${state.scoreStats.enemiesKilled || 0}`);
      console.log(`   探索房间: ${state.scoreStats.roomsExplored || 0}`);
      console.log(`   游戏时长: ${(elapsed/1000).toFixed(1)}秒`);
      console.log('='.repeat(50));
      
      // 生成Bug报告
      const bugSummary = bugDetector.printSummary(trainCount);
      const bugReportPath = bugDetector.saveReport(trainCount);
      console.log(`\n📝 Bug报告已保存: ${bugReportPath}`);
      
      // 保存数据
      const dataFile = path.join(DATA_DIR, `train_${trainCount}_${timestamp}.json`);
      fs.writeFileSync(dataFile, JSON.stringify({
        version: "v3.1-score-bugfix",
        trainCount: trainCount.toString(),
        timestamp: new Date(timestamp).toISOString(),
        config,
        result: state.result,
        score: finalScore,
        maxScoreDuringGame: maxScore,
        playTime: elapsed,
        stats: state.scoreStats,
        events: gameEvents,
        bugs: bugSummary
      }, null, 2), 'utf8');
      console.log(`\n💾 数据已保存: ${dataFile}`);
      
      // 截图
      await page.screenshot({ path: path.join(DATA_DIR, `train_${trainCount}_final.png`) });
      
      await browser.close();
      return { trainCount, result: state.result, score: finalScore, duration: elapsed };
    }
    
    // 记录数据（每2秒）
    if (!lastState || elapsed - lastState.timestamp > 2000 / config.speed) {
      gameEvents.push({
        time: elapsed,
        score: state.score,
        hp: state.playerHp,
        enemies: state.enemyCount,
        kills: state.enemiesKilled,
        floor: state.currentFloor,
        decision: lastState?.decision
      });
      lastState = state;
      
      // 控制台输出进度
      const progress = `💯${state.score.toString().padStart(5)} HP:${state.playerHp}/${state.playerMaxHp} 击杀:${(state.enemiesKilled || 0).toString().padStart(3)} 房间:${(state.scoreStats.roomsExplored || 0).toString().padStart(2)} 连杀x${state.killStreak || 0}`;
      process.stdout.write(`\r${progress}`);
    }
    
    // AI决策和执行
    if (state.isPlaying) {
      const decision = await aiMakeDecision(page);
      await aiExecuteAction(page, decision);
      state.decision = decision;
    }
    
    // 每10秒尝试商店/进化
    if (Math.floor(elapsed / 10000) > Math.floor((elapsed - 100) / 10000)) {
      await page.evaluate(() => {
        const game = window.game;
        if (!game) return;
        const roll = Math.random();
        if (roll < 0.3) {
          if (game.shopOpen) game.closeShop();
          else if (game.curRoom?.type === 'shop') game.openShop();
        } else if (roll < 0.5) {
          if (game.evolutionOpen) game.closeEvolution();
          else game.openEvolution();
        }
      });
    }
    
    await sleep(16 / config.speed);
  }
  
  // 超时处理
  console.log('\n⏰ 超时结束');
  
  // 生成Bug报告（即使超时也生成）
  const bugSummary = bugDetector.printSummary(trainCount);
  const bugReportPath = bugDetector.saveReport(trainCount);
  console.log(`📝 Bug报告已保存: ${bugReportPath}`);
  
  await browser.close();
  return { trainCount, result: 'timeout', score: maxScore, duration: config.maxTime, bugs: bugSummary };
}

// ==================== 主程序 ====================
async function main() {
  console.log('🐮 牛牛肉鸽 AI 训练系统 v3.1 - 分数驱动+Bug检测版');
  console.log('   AI将同时玩游戏并检测Bug');
  console.log('');
  
  try {
    require('playwright');
  } catch (e) {
    console.error('❌ 未找到 Playwright！请先运行：npm install');
    process.exit(1);
  }
  
  const result = await train();
  
  console.log('\n✅ 训练完成！');
  console.log(`   第 ${result.trainCount} 次训练`);
  console.log(`   结果: ${result.result}`);
  console.log(`   分数: ${result.score.toLocaleString()}`);
  console.log(`   用时: ${(result.duration/1000).toFixed(1)}秒`);
}

main().catch(err => {
  console.error('❌ 错误:', err);
  process.exit(1);
});
