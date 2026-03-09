/**
 * 牛牛肉鸽 - AI 训练系统 v3.4 (Windows版) - 武器升级学习版
 * 
 * 功能：
 * - AI 自动玩游戏，目标是获得最高分数
 * - 自动检测游戏Bug和问题
 * - 分数来源：击杀、探索、收集、通关等
 * - 支持游戏加速（1x-100x，高速模式自动优化AI决策频率）
 * - 支持无敌模式/普通模式切换
 * - 自动处理盲眼NPC对话和商店交互
 * - v0.16.0: 武器升级系统学习 - 智能选择武器升级
 * 
 * 使用：node play_game_windows.js [--speed=5] [--max-time=600] [--mode=normal]
 * 速度选项：1x, 2x, 5x, 10x, 20x, 50x, 100x
 * 模式选项：normal（普通）, god（无敌）
 * 建议：10x以下用于观察，20x-50x用于快速训练，100x可能不稳定
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const BugDetector = require('./bug_detector');
const AILearner = require('./ai_learner');

// ==================== 配置 ====================
const PROJECT_ROOT = path.resolve(__dirname, '..');
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
  mode: getArg('--mode') || 'normal', // 'normal' 或 'god'（无敌模式）
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
    
    // v0.16.0: 收集武器升级信息
    const weapons = game.player?.weapons?.map(w => ({
      key: w.baseKey,
      name: w.cfg?.name || w.baseKey,
      level: w.level,
      maxLevel: w.maxLevel,
      isSuper: w.isSuper,
      dmg: w.cfg?.dmg,
      subtype: w.cfg?.subtype
    })) || [];
    
    // 收集被动道具信息
    const passives = [];
    if (game.passives) {
      Object.entries(game.passives.levels || {}).forEach(([key, level]) => {
        if (level > 0) {
          passives.push({ key, level });
        }
      });
    }
    
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
      
      // 盲眼对话状态（v0.13.0新增）
      isBlindTalking: window.shopNPCSystem?.isTalking ?? false,
      currentFloor: game.currentFloor ?? 1,
      
      // 武器/道具 - v0.16.0 扩展
      weaponCount: weapons.length,
      weapons: weapons,
      passives: passives,
      itemCount: game.player?.items?.length ?? 0,
      
      // 升级界面状态 - v0.16.0
      levelUpOpen: game.levelUpOpen ?? false,
      levelUpOptions: game.levelUpOptions || [],
      weaponBoxOpen: game.weaponBoxOpen ?? false,
      
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

// 设置游戏模式（无敌/普通）
async function setGameMode(page, mode) {
  await page.evaluate((m) => {
    if (window.game && window.game.toggleGodMode) {
      // 如果当前模式与目标模式不一致，切换
      const currentGodMode = window.game.godMode || false;
      if (m === 'god' && !currentGodMode) {
        window.game.toggleGodMode();
        console.log('🛡️ 已开启无敌模式');
      } else if (m === 'normal' && currentGodMode) {
        window.game.toggleGodMode();
        console.log('⚔️ 已切换到普通模式');
      }
    }
  }, mode);
}

// ==================== AI 决策 ====================
// AI学习器实例（全局）
let aiLearner = null;

// AI在页面内执行的决策逻辑（带学习）
async function aiMakeDecision(page, strategyWeights) {
  return await page.evaluate((weights) => {
    const game = window.game;
    if (!game || !game.player) return { action: 'none', strategy: 'unknown' };
    
    const sm = game.scoreManager;
    const player = game.player;
    const curRoom = game.curRoom;
    
    // 使用学习到的策略权重
    const PRIORITIES = weights || {
      SURVIVAL: 0.25,
      COMBAT: 0.30,
      EXPLORATION: 0.30,
      COLLECTION: 0.15
    };
    
    // 根据当前状态决定行动
    const hpPercent = player.hp / player.maxHp;
    const hasEnemies = curRoom?.enemies?.length > 0;
    const hasUnclearedRooms = Object.values(curRoom?.doors || {}).some(d => d && !d.target?.visited);
    const hasItems = curRoom?.items?.length > 0 || game.gems?.length > 0;
    
    // 构建可用动作列表
    const availableActions = [];
    if (hpPercent < 0.4 && hasEnemies) availableActions.push('flee');
    if (hasEnemies) availableActions.push('combat');
    if (hasUnclearedRooms || curRoom?.cleared) availableActions.push('explore');
    if (hasItems) availableActions.push('collect');
    
    if (availableActions.length === 0) {
      return { action: 'explore', strategy: 'default' };
    }
    
    // 根据策略权重选择动作
    let chosenAction = availableActions[0];
    let maxPriority = -1;
    
    availableActions.forEach(action => {
      let priority = 0;
      let strategy = '';
      
      switch(action) {
        case 'flee':
          priority = hpPercent < 0.2 ? PRIORITIES.SURVIVAL * 2 : PRIORITIES.SURVIVAL;
          strategy = 'SURVIVAL';
          break;
        case 'combat':
          priority = hpPercent > 0.5 ? PRIORITIES.COMBAT * 1.5 : PRIORITIES.COMBAT;
          strategy = 'COMBAT';
          break;
        case 'explore':
          priority = curRoom?.cleared ? PRIORITIES.EXPLORATION * 1.5 : PRIORITIES.EXPLORATION;
          strategy = 'EXPLORATION';
          break;
        case 'collect':
          priority = PRIORITIES.COLLECTION;
          strategy = 'COLLECTION';
          break;
      }
      
      // 添加随机性（探索）
      priority *= (0.8 + Math.random() * 0.4);
      
      if (priority > maxPriority) {
        maxPriority = priority;
        chosenAction = action;
      }
    });
    
    return { 
      action: chosenAction, 
      strategy: chosenAction === 'flee' ? 'SURVIVAL' :
                chosenAction === 'combat' ? 'COMBAT' :
                chosenAction === 'explore' ? 'EXPLORATION' : 'COLLECTION'
    };
  }, strategyWeights);
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
  
  // 初始化 AI 学习器
  if (!aiLearner) {
    aiLearner = new AILearner(DATA_DIR);
  }
  
  // 获取当前策略（带探索）
  const currentStrategy = aiLearner.getStrategy(true);
  
  console.log(`\n🎮 ===== 牛牛肉鸽 AI 训练 #${trainCount} =====`);
  console.log(`   目标: 最大化游戏分数 (AI学习中...)`);
  console.log(`   速度: ${config.speed}x`);
  console.log(`   模式: ${config.mode === 'god' ? '🛡️ 无敌模式' : '⚔️ 普通模式'}`);
  console.log(`   最大时间: ${config.maxTime/1000}秒`);
  console.log(`   录制视频: ${isVideoRun ? '是' : '否'}`);
  if (currentStrategy.isExploration) {
    console.log(`   🎲 本局为探索模式（随机策略）`);
  } else {
    console.log(`   🎯 本局为利用模式（学习策略）`);
  }
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
  
  // 监听游戏控制台输出（显示报错信息）
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();
    
    // 过滤掉 drawUI、updateScore 等无关日志
    if (text.includes('drawUI') || text.includes('Skipping') || text.includes('updateScore') || 
        text.includes('animate') || text.includes('loop') || text.includes('render') ||
        text.includes('fps') || text.includes('delta')) {
      return;
    }
    
    // 只显示错误和关键游戏事件（行为加分/扣分）
    if (type === 'error') {
      console.log(`   🔴 [GameError] ${text}`);
    } else if (type === 'warning') {
      console.log(`   🟡 [GameWarn] ${text}`);
    } else if (text.includes('分数') || text.includes('得分') || text.includes('扣分') || 
               text.includes('击杀') || text.includes('通关') || text.includes('死亡') ||
               text.includes('升级') || text.includes('获得') || text.includes('惩罚') ||
               text.includes('奖励') || text.includes('伤害') || text.includes('治疗') ||
               text.includes('探索') || text.includes('受伤') || text.includes('消费') ||
               text.includes('停留') || text.includes('重复访问')) {
      console.log(`   📋 [Game] ${text}`);
    }
  });
  
  page.on('pageerror', error => {
    console.log(`   🔴 [PageError] ${error.message}`);
  });
  
  // 加载游戏
  const gameUrl = `http://localhost:8080/?mode=${config.mode}`;
  console.log(`🎯 加载游戏: ${gameUrl}`);
  await page.goto(gameUrl, { waitUntil: 'networkidle' });
  await sleep(3000);
  
  // 点击开始并跳过开场动画
  console.log('🖱️ 点击开始按钮并跳过开场动画...');
  await page.click('#startGameBtn');
  await sleep(500); // 等待剧情开始
  
  // 跳过开场剧情，直接显示武器选择
  await page.evaluate(() => {
    // 隐藏故事界面和剧情遮罩
    const storyEl = document.getElementById('story');
    if (storyEl) storyEl.style.display = 'none';
    const prologueEl = document.getElementById('prologueOverlay');
    if (prologueEl) prologueEl.style.display = 'none';
    // 直接显示武器选择
    if (window.game && window.game.showWeaponSelect) {
      window.game.showWeaponSelect();
    }
  });
  await sleep(500);
  
  // 设置速度
  if (config.speed > 1) {
    await setGameSpeed(page, config.speed);
  }
  
  // 设置游戏模式（无敌/普通）
  await setGameMode(page, config.mode);
  
  // 静音游戏
  await page.evaluate(() => {
    if (window.game && window.game.sounds) {
      window.game.sounds.setVolume(0, 0, 0);
      console.log('🔇 游戏已静音');
    }
  });
  
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
  let lastDecisionTime = 0;
  
  // 商店处理追踪
  let lastShopAction = 0;
  let shopToggleCount = 0;
  let shopLastState = false;
  
  // 武器选择箱追踪（v0.13.0精英房掉落）
  let lastWeaponChoiceCheck = 0;
  
  // 根据速度调整AI决策间隔（高速时减少决策频率，避免CPU过载）
  const decisionInterval = config.speed >= 50 ? 200 : config.speed >= 20 ? 100 : config.speed >= 10 ? 50 : 16;
  
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
      // 等待惩罚计算完成
      await sleep(800);
      
      // 获取最终分数（包含死亡惩罚）
      const gameResultData = await page.evaluate(() => {
        return window.game?.gameResultData || null;
      });
      
      // 优先使用 gameResultData.finalScore（包含死亡惩罚）
      let finalScore;
      if (gameResultData && gameResultData.finalScore !== undefined) {
        finalScore = gameResultData.finalScore;
      } else {
        finalScore = state.score;
      }
      
      // AI 从本局游戏中学习
      aiLearner.learnFromGame(finalScore, state.result, elapsed);
      
      console.log('\n' + '='.repeat(50));
      console.log(`🎮 训练 #${trainCount} 结束: ${state.result.toUpperCase()}`);
      if (state.result === 'dead' && gameResultData) {
        console.log(`💀 死亡惩罚: -500分`);
        console.log(`📊 基础分数: ${gameResultData.baseScore?.toLocaleString() || state.score.toLocaleString()}`);
      } else if (state.result === 'cleared' && gameResultData && gameResultData.multiplier > 1) {
        console.log(`🎉 通关加成: ×${gameResultData.multiplier}`);
      }
      console.log(`💯 最终分数: ${finalScore.toLocaleString()}`);
      console.log(`   游戏内最高: ${maxScore.toLocaleString()}`);
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
      const aiStats = aiLearner.getStats();
      fs.writeFileSync(dataFile, JSON.stringify({
        version: "v3.4-weapon-upgrade",
        trainCount: trainCount.toString(),
        timestamp: new Date(timestamp).toISOString(),
        config,
        result: state.result,
        score: finalScore,
        maxScoreDuringGame: maxScore,
        playTime: elapsed,
        stats: state.scoreStats,
        events: gameEvents,
        bugs: bugSummary,
        // v0.16.0: 武器配置数据
        finalWeapons: state.weapons,
        finalPassives: state.passives,
        aiLearning: {
          gamesPlayed: aiStats.gamesPlayed,
          averageScore: aiStats.averageScore,
          bestScore: aiStats.bestScore,
          epsilon: aiStats.epsilon,
          strategyWeights: aiStats.strategyWeights,
          weaponUpgrades: aiStats.weaponUpgrades,
          weaponWinRates: aiStats.weaponWinRates
        }
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
    
    // AI决策和执行（根据速度控制频率）
    if (state.isPlaying && Date.now() - lastDecisionTime >= decisionInterval) {
      lastDecisionTime = Date.now();
      
      // 处理盲眼对话状态（v0.13.0新增）
      if (state.isBlindTalking) {
        // 盲眼正在说话，点击跳过对话
        await page.evaluate(() => {
          if (window.shopNPCSystem && window.shopNPCSystem.isTalking) {
            window.shopNPCSystem.skipLine();
          }
        });
      } else {
        // 获取当前策略权重
        const strategy = aiLearner.getStrategy(true);
        const decision = await aiMakeDecision(page, strategy);
        
        // 记录决策用于学习
        aiLearner.recordDecision(state, decision.action, 0);
        
        await aiExecuteAction(page, decision);
        state.decision = decision;
      }
    }
    
    // 智能商店处理（每3秒一次）
    if (elapsed - lastShopAction >= 3000) {
      lastShopAction = elapsed;
      
      const shopResult = await page.evaluate(() => {
        const game = window.game;
        if (!game) return { action: 'none' };
        
        // 处理升级界面 - v0.16.0 智能武器升级选择
        if (game.levelUpOpen) {
          const options = game.levelUpOptions;
          if (options && options.length > 0) {
            // v0.16.0: 智能选择最优升级
            let bestIndex = 0;
            let bestScore = -1;
            
            options.forEach((option, index) => {
              let score = 0;
              
              if (option.type === 'weapon') {
                // 武器升级评分
                const weaponKey = option.key;
                const isNew = option.isNew;
                const level = option.level;
                const maxLevel = option.maxLevel || 8;
                
                // 优先升级已有武器到关键等级（4级和8级质变）
                if (!isNew) {
                  if (level === 4) score += 100; // 质变等级
                  if (level === 8) score += 150; // 满级质变
                  if (level < 4) score += 30;    // 早期升级
                  if (level >= 5 && level < 8) score += 50; // 中后期升级
                } else {
                  // 新武器 - 如果武器槽未满，适度鼓励
                  const currentWeapons = game.player?.weapons?.length || 0;
                  if (currentWeapons < 4) {
                    score += 40;
                  } else {
                    score += 10; // 武器槽满时，优先升级现有武器
                  }
                }
                
                // 根据武器类型调整权重
                const weaponTypePriority = {
                  'whip': 1.2,      // 近战AOE，早期好用
                  'scythe': 1.1,    // 近战高伤
                  'wand': 1.3,      // 追踪，后期强
                  'knife': 1.2,     // 高攻速
                  'axe': 1.1,       // 回旋镖
                  'cross': 1.0,     // 弹跳
                  'fireball': 1.3,  // 爆炸AOE
                  'shuriken': 1.2,  // 散射
                  'icicle': 1.1,    // 控制
                  'chakram': 1.2,   // 环绕
                  'poison_dart': 1.0, // 持续伤害
                  'bible': 1.4,     // 防御型，高优先级
                  'lightning': 1.3, // 连锁
                  'holy_water': 1.1, // 区域控制
                  'garlic': 1.2     // 近战光环
                };
                score *= (weaponTypePriority[weaponKey] || 1.0);
                
              } else if (option.type === 'passive') {
                // 被动道具评分
                const passiveKey = option.key;
                const superInfo = option.superInfo;
                
                // 如果有超武合成需求，大幅提升优先级
                if (superInfo && superInfo.canEvolve) {
                  score += 200;
                }
                
                // 基础被动优先级
                const passivePriority = {
                  'spinach': 1.3,      // 伤害
                  'armor': 1.2,        // 防御
                  'hollow_heart': 1.1, // 生命
                  'empty_tome': 1.3,   // CD减免
                  'candelabrador': 1.2, // 范围
                  'bracer': 1.1,       // 弹射速度
                  'spellbinder': 1.2,  // 持续时间
                  'duplicator': 1.4,   // 投射物数量
                  'wings': 1.1,        // 移速
                  'attractorb': 1.0,   // 拾取范围
                  'clover': 1.1,       // 幸运
                  'crown': 1.2         // 经验
                };
                score += (passivePriority[passiveKey] || 1.0) * 20;
              }
              
              // 添加随机性（探索）
              score *= (0.9 + Math.random() * 0.2);
              
              if (score > bestScore) {
                bestScore = score;
                bestIndex = index;
              }
            });
            
            game.selectLevelUpOption(bestIndex);
            const selected = options[bestIndex];
            return { 
              action: 'levelup', 
              choice: selected?.type === 'weapon' ? 
                `${selected.data?.name || selected.key} ${selected.isNew ? '(新)' : `Lv${selected.level}`}` :
                `${selected.data?.name || selected.key} (被动)`
            };
          }
        }
        
        // 处理盲眼NPC商店（v0.13.0新增）
        if (game.curRoom?.type === 'shop') {
          // 检查是否在交互范围内
          const npc = game.curRoom.npc;
          const player = game.player;
          if (npc && player) {
            const dist = Math.sqrt((npc.x - player.x) ** 2 + (npc.y - player.y) ** 2);
            
            // 在交互范围内且没有对话时，先触发F键交谈
            if (dist < 200 && !window.shopNPCSystem?.isTalking && !game.shopOpen) {
              // 模拟按F键开始对话（20%概率跳过对话直接开商店）
              if (Math.random() > 0.2) {
                // 触发F键交谈
                const event = new KeyboardEvent('keydown', { key: 'f', code: 'KeyF' });
                document.dispatchEvent(event);
                return { action: 'blind_talk', reason: 'first_interaction' };
              }
            }
          }
          
          const shopItems = game.shopItems || [];
          
          if (!game.shopOpen) {
            // 有钱且商店有物品就按E键打开商店
            if (player.gold >= 30 && shopItems.length > 0 && !window.shopNPCSystem?.isTalking) {
              // 模拟按E键打开商店
              const event = new KeyboardEvent('keydown', { key: 'e', code: 'KeyE' });
              document.dispatchEvent(event);
              return { action: 'open_shop' };
            }
          } else {
            // 商店打开状态：智能购买
            if (shopItems.length === 0 || player.gold < 30) {
              game.closeShop();
              return { action: 'close_shop', reason: 'empty_or_no_gold' };
            }
            
            // 尝试购买最便宜的
            let cheapestIndex = -1;
            let cheapestPrice = Infinity;
            for (let i = 0; i < shopItems.length; i++) {
              if (shopItems[i] && shopItems[i].price < cheapestPrice && shopItems[i].price <= player.gold) {
                cheapestPrice = shopItems[i].price;
                cheapestIndex = i;
              }
            }
            
            if (cheapestIndex >= 0) {
              game.buyItem(cheapestIndex);
              return { action: 'buy', index: cheapestIndex, price: cheapestPrice };
            } else {
              game.closeShop();
              return { action: 'close_shop', reason: 'cant_afford' };
            }
          }
        }
        return { action: 'none' };
      });
      
      // 输出商店操作
      if (shopResult.action === 'open_shop') {
        console.log(`   打开商店`);
      } else if (shopResult.action === 'buy') {
        console.log(`   购买物品 #${shopResult.index + 1} (-${shopResult.price}金币)`);
        shopToggleCount = 0;
      } else if (shopResult.action === 'close_shop') {
        console.log(`   离开商店 (${shopResult.reason === 'cant_afford' ? '买不起' : '已清空'})`);
      } else if (shopResult.action === 'blind_talk') {
        console.log(`   与盲眼NPC交谈 (F键)`);
      } else if (shopResult.action === 'levelup') {
        // v0.16.0: 显示升级选择
        console.log(`   升级选择: ${shopResult.choice}`);
      }
      
      // 检测反复开关商店
      if (shopResult.action === 'open_shop' || shopResult.action === 'close_shop') {
        if (shopLastState === (shopResult.action === 'open_shop')) {
          shopToggleCount++;
        } else {
          shopToggleCount = 0;
        }
        shopLastState = (shopResult.action === 'open_shop');
        
        if (shopToggleCount >= 3) {
          console.log(`   商店操作混乱，强制冷却`);
          lastShopAction += 5000;
          shopToggleCount = 0;
        }
      }
      
      // 处理武器选择箱（v0.13.0精英房掉落）
      if (elapsed - lastWeaponChoiceCheck >= 2000) {
        lastWeaponChoiceCheck = elapsed;
        
        const weaponChoiceResult = await page.evaluate(() => {
          const game = window.game;
          if (!game) return { action: 'none' };
          
          // 如果有武器选择界面打开，随机选择一个
          if (game.weaponChoiceOpen && game.weaponChoiceOptions?.length > 0) {
            const randomIndex = Math.floor(Math.random() * game.weaponChoiceOptions.length);
            game.selectWeaponChoice(randomIndex);
            return { action: 'select_weapon', index: randomIndex };
          }
          return { action: 'none' };
        });
        
        if (weaponChoiceResult.action === 'select_weapon') {
          console.log(`   选择武器 #${weaponChoiceResult.index + 1}`);
        }
      }
    }
    
    await sleep(16 / config.speed);
  }
  
  // 超时处理
  console.log('\n⏰ 超时结束');
  
  // AI 从超时游戏中学习
  aiLearner.learnFromGame(maxScore, 'timeout', config.maxTime);
  
  // 生成Bug报告（即使超时也生成）
  const bugSummary = bugDetector.printSummary(trainCount);
  const bugReportPath = bugDetector.saveReport(trainCount);
  console.log(`📝 Bug报告已保存: ${bugReportPath}`);
  
  await browser.close();
  return { trainCount, result: 'timeout', score: maxScore, duration: config.maxTime, bugs: bugSummary };
}

// ==================== 主程序 ====================
async function main() {
  console.log('🐮 牛牛肉鸽 AI 训练系统 v3.2 - 智能学习版');
  console.log('   AI将从每次游戏中学习，越玩越聪明！');
  console.log('   支持: Q-learning | 自适应策略 | 探索/利用平衡');
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
