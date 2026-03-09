/**
 * 连续 AI 学习训练系统 v3.3 (v0.13.0适配版)
 * 
 * 特点：
 * - 一局结束后自动重新开始
 * - 不关闭浏览器，持续学习
 * - 每局之间保存学习数据
 * - 支持 1x-100x 速度（高速模式自动优化AI决策频率）
 * - 支持无敌模式/普通模式切换
 * - 自动处理盲眼NPC对话和武器选择箱
 * 
 * 使用：node continuous_training.js [--rounds=10] [--speed=5] [--max-time=300] [--mode=normal]
 * 速度建议：5x-10x平衡，20x-50x快速训练，100x极限速度（可能不稳定）
 * 模式选项：normal（普通）, god（无敌）
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
  rounds: parseInt(getArg('--rounds')) || 10,
  speed: parseFloat(getArg('--speed')) || 5,
  maxTime: (parseInt(getArg('--max-time')) || 300) * 1000,
  headless: args.includes('--headless'),
  mode: getArg('--mode') || 'normal', // 'normal' 或 'god'（无敌模式）
};

function getArg(name) {
  const arg = args.find(a => a.startsWith(name + '='));
  return arg ? arg.split('=')[1] : null;
}

// 确保目录存在
[VIDEO_DIR, DATA_DIR, BUG_REPORT_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ==================== 游戏状态检测 ====================
async function getGameState(page) {
  return await page.evaluate(() => {
    const game = window.game;
    if (!game) return null;
    
    const sm = game.scoreManager;
    
      // v0.16.0: 收集武器信息
    const weapons = game.player?.weapons?.map(w => ({
      key: w.baseKey,
      name: w.cfg?.name || w.baseKey,
      level: w.level,
      maxLevel: w.maxLevel,
      isSuper: w.isSuper,
      dmg: w.cfg?.dmg,
      subtype: w.cfg?.subtype
    })) || [];
    
    const state = {
      playerHp: game.player?.hp ?? 0,
      playerMaxHp: game.player?.maxHp ?? 0,
      playerLv: game.player?.lv ?? 1,
      roomNumber: game.roomNumber ?? 1,
      totalRooms: game.TOTAL_ROOMS ?? 8,
      currentFloor: game.currentFloor ?? 1,
      enemyCount: game.curRoom?.enemies?.length ?? 0,
      enemiesKilled: sm?.stats?.enemiesKilled ?? 0,
      isGameOver: game.state === 'gameover',
      isVictory: game.state === 'victory',
      isMenu: game.state === 'menu',
      score: sm?.score ?? 0,
      scoreStats: sm?.stats ?? {},
      killStreak: sm?.killStreak ?? 0,
      isPlaying: sm?.isPlaying ?? false,
      // v0.13.0新增状态
      isBlindTalking: window.shopNPCSystem?.isTalking ?? false,
      hasWeaponChoice: game.weaponChoiceOpen ?? false,
      // v0.16.0: 武器和升级状态
      weapons: weapons,
      weaponCount: weapons.length,
      levelUpOpen: game.levelUpOpen ?? false,
      levelUpOptions: game.levelUpOptions || [],
      timestamp: Date.now()
    };
    
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

// 重新开始游戏
async function restartGame(page) {
  console.log('🔄 重新开始游戏...');
  
  // 点击重新开始按钮（先返回到主菜单）
  await page.evaluate(() => {
    if (window.game && window.game.returnToMainMenu) {
      window.game.returnToMainMenu();
    }
  });
  
  // 等待返回主菜单并重置完成
  await sleep(2000);
  
  // 检查是否回到了主菜单
  const menuState = await page.evaluate(() => window.game?.state);
  if (menuState !== 'menu') {
    console.log(`   ⏳ 等待返回主菜单 (当前: ${menuState})...`);
    await sleep(1000);
  }
  
  // 等待故事界面显示
  let storyVisible = false;
  for (let i = 0; i < 10; i++) {
    storyVisible = await page.evaluate(() => {
      const story = document.getElementById('story');
      return story && story.style.display === 'block';
    });
    if (storyVisible) break;
    await sleep(200);
  }
  
  if (!storyVisible) {
    console.log('   ⚠️ 故事界面未显示，尝试强制显示...');
    await page.evaluate(() => {
      document.getElementById('story').style.display = 'block';
    });
    await sleep(200);
  }
  
  // 点击开始按钮并跳过开场动画
  console.log('   点击 startGameBtn 并跳过开场动画...');
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
  
  // 选择武器（点击第一个武器选项）
  const weaponOption = await page.$('.weapon-option');
  if (weaponOption) {
    console.log('🗡️ 选择武器...');
    await weaponOption.click();
    await sleep(500);
  }
  
  // 等待游戏开始并稳定
  await sleep(1000)
  
  // 重新设置速度（必须在游戏开始后再设置）
  if (config.speed > 1) {
    await setGameSpeed(page, config.speed);
    await sleep(500);
  }
  
  // 保持静音
  await page.evaluate(() => {
    if (window.game && window.game.sounds) {
      window.game.sounds.setVolume(0, 0, 0);
    }
  });
  
  // 检查游戏是否真正开始
  let attempts = 0;
  while (attempts < 5) {
    const gameState = await getGameState(page);
    if (gameState) {
      console.log(`   🎮 检查游戏状态 #${attempts + 1}: isPlaying=${gameState.isPlaying}, HP=${gameState.playerHp}/${gameState.playerMaxHp}`);
      
      if (gameState.isPlaying && gameState.playerHp > 0) {
        console.log(`   ✅ 新游戏成功开始！`);
        return true;
      }
      
      if (gameState.isFinished) {
        console.log(`   ⚠️ 游戏已结束，可能重置失败`);
      }
    }
    
    attempts++;
    await sleep(1000);
  }
  
  console.log(`   ❌ 游戏启动失败，跳过本局`);
  return false;
}

// ==================== AI 决策 ====================
async function aiMakeDecision(page, strategyWeights) {
  return await page.evaluate((weights) => {
    const game = window.game;
    if (!game || !game.player) return { action: 'none', strategy: 'unknown' };
    
    const player = game.player;
    const curRoom = game.curRoom;
    
    const PRIORITIES = weights || {
      SURVIVAL: 0.15,
      COMBAT: 0.15,
      EXPLORATION: 0.20,
      COLLECTION: 0.10,
      DOOR_SEEKING: 0.35,
      RETURN: 0.05
    };
    
    const hpPercent = player.hp / player.maxHp;
    const hasEnemies = curRoom?.enemies?.length > 0;
    const hasUnclearedRooms = Object.values(curRoom?.doors || {}).some(d => d && !d.target?.visited);
    const hasItems = curRoom?.items?.length > 0 || game.gems?.length > 0;
    
    // 检测开着的门（寻门策略）- 只选择去未探索房间的门，防止刷分
    let openDoors = [];
    if (curRoom?.doors) {
      // 门的精确位置（根据游戏代码中的门碰撞箱）
      // 上门: y=0, h=60 | 下门: y=ROOM_HEIGHT-60 | 左门: x=0 | 右门: x=ROOM_WIDTH-60
      const wallT = 60;
      const doorPositions = {
        up: { x: game.ROOM_WIDTH / 2, y: wallT / 2, w: 80, h: wallT },
        down: { x: game.ROOM_WIDTH / 2, y: game.ROOM_HEIGHT - wallT / 2, w: 80, h: wallT },
        left: { x: wallT / 2, y: game.ROOM_HEIGHT / 2, w: wallT, h: 100 },
        right: { x: game.ROOM_WIDTH - wallT / 2, y: game.ROOM_HEIGHT / 2, w: wallT, h: 100 }
      };
      
      for (const [dir, door] of Object.entries(curRoom.doors)) {
        // 只选择开着的门（绿门），且目标房间未探索过的（防止来回刷分）
        if (door && door.open && doorPositions[dir] && door.target && !door.target.visited) {
          openDoors.push({ dir, ...doorPositions[dir], target: door.target });
        }
      }
      
      // 调试：仅在房间清理完且检测到绿门时输出（减少刷屏）
      if (openDoors.length > 0 && curRoom?.cleared && game.frameCount % 120 === 0) {
        console.log(`🚪 房间已清理，检测到${openDoors.length}个绿门: ${openDoors.map(d => d.dir).join(',')}`);
      }
    }
    
    const availableActions = [];
    // flee策略：血量低时优先逃跑（危险感知已处理近距离躲避）
    if (hpPercent < 0.3 && hasEnemies) availableActions.push('flee');
    if (hasEnemies) availableActions.push('combat');
    if (hasUnclearedRooms || curRoom?.cleared) availableActions.push('explore');
    if (hasItems) availableActions.push('collect');
    if (openDoors.length > 0) availableActions.push('seek_door');
    
    // 如果没有未探索的门，但有其他开着的门（已探索的），作为低优先级备选
    // 这种情况通常是死胡同需要返回
    let returnDoors = [];
    if (openDoors.length === 0 && curRoom?.doors) {
      const wallT = 60;
      const doorPositions = {
        up: { x: game.ROOM_WIDTH / 2, y: wallT / 2, w: 80, h: wallT },
        down: { x: game.ROOM_WIDTH / 2, y: game.ROOM_HEIGHT - wallT / 2, w: 80, h: wallT },
        left: { x: wallT / 2, y: game.ROOM_HEIGHT / 2, w: wallT, h: 100 },
        right: { x: game.ROOM_WIDTH - wallT / 2, y: game.ROOM_HEIGHT / 2, w: wallT, h: 100 }
      };
      
      for (const [dir, door] of Object.entries(curRoom.doors)) {
        // 选择开着的门（绿门），但目标房间已探索过（返回路径）
        if (door && door.open && door.target?.visited) {
          returnDoors.push({ dir, ...doorPositions[dir], target: door.target, isReturn: true });
        }
      }
      // 如果有返回的门，添加return动作
      if (returnDoors.length > 0) {
        availableActions.push('return');
      }
    }
    
    if (availableActions.length === 0) {
      return { action: 'explore', strategy: 'default' };
    }
    
    let chosenAction = availableActions[0];
    let maxPriority = -1;
    
    availableActions.forEach(action => {
      let priority = 0;
      
      switch(action) {
        case 'flee':
          priority = hpPercent < 0.2 ? PRIORITIES.SURVIVAL * 2 : PRIORITIES.SURVIVAL;
          break;
        case 'combat':
          priority = hpPercent > 0.5 ? PRIORITIES.COMBAT * 1.5 : PRIORITIES.COMBAT;
          break;
        case 'explore':
          priority = curRoom?.cleared ? PRIORITIES.EXPLORATION * 1.5 : PRIORITIES.EXPLORATION;
          break;
        case 'collect':
          priority = PRIORITIES.COLLECTION;
          break;
        case 'seek_door':
          // 房间清理完后优先寻门
          priority = curRoom?.cleared ? PRIORITIES.DOOR_SEEKING * 3 : PRIORITIES.DOOR_SEEKING;
          break;
        case 'return':
          // 死胡同时返回，权重较低
          priority = PRIORITIES.RETURN;
          break;
      }
      
      priority *= (0.8 + Math.random() * 0.4);
      
      if (priority > maxPriority) {
        maxPriority = priority;
        chosenAction = action;
      }
    });
    
    // 如果选择了寻门，返回最近的一扇门
    if (chosenAction === 'seek_door') {
      let targetDoors = openDoors.length > 0 ? openDoors : returnDoors;
      
      if (targetDoors.length > 0) {
        // 找到最近的门
        let nearestDoor = targetDoors[0];
        let minDist = Infinity;
        targetDoors.forEach(door => {
          const d = Math.sqrt((door.x - player.x) ** 2 + (door.y - player.y) ** 2);
          if (d < minDist) {
            minDist = d;
            nearestDoor = door;
          }
        });
        
        // 如果是返回已探索房间，降低优先级提示
        if (nearestDoor.isReturn) {
          return { 
            action: 'seek_door', 
            strategy: 'RETURN',  // 标记为返回策略，不是探索
            targetDoor: nearestDoor
          };
        }
        
        return { 
          action: 'seek_door', 
          strategy: 'DOOR_SEEKING',
          targetDoor: nearestDoor
        };
      }
    }
    
    // 处理return动作（选择最近的返回门）
    if (chosenAction === 'return' && returnDoors.length > 0) {
      let nearestDoor = returnDoors[0];
      let minDist = Infinity;
      returnDoors.forEach(door => {
        const d = Math.sqrt((door.x - player.x) ** 2 + (door.y - player.y) ** 2);
        if (d < minDist) {
          minDist = d;
          nearestDoor = door;
        }
      });
      return { 
        action: 'seek_door', 
        strategy: 'RETURN',
        targetDoor: nearestDoor
      };
    }
    
    return { 
      action: chosenAction, 
      strategy: chosenAction === 'flee' ? 'SURVIVAL' :
                chosenAction === 'combat' ? 'COMBAT' :
                chosenAction === 'explore' ? 'EXPLORATION' :
                chosenAction === 'seek_door' ? 'DOOR_SEEKING' : 'COLLECTION'
    };
  }, strategyWeights);
}

// 执行AI动作
async function aiExecuteAction(page, decision) {
  await page.evaluate((decision) => {
    // 显示AI决策指示器
    let indicator = document.getElementById('ai-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'ai-indicator';
      indicator.style.cssText = 'position:fixed; right:10px; bottom:10px; background:rgba(0,0,0,0.8); color:#0f0; padding:10px; border-radius:8px; font-size:14px; z-index:9999; border:2px solid #0f0;';
      document.body.appendChild(indicator);
    }
    
    const actionEmojis = {
      combat: '⚔️',
      flee: '🏃',
      explore: '🔍',
      collect: '💎',
      seek_door: '🚪',
      none: '⏸️'
    };
    
    // 根据策略类型显示不同颜色
    const strategyColors = {
      SURVIVAL: '#f44',
      COMBAT: '#fa0',
      EXPLORATION: '#48f',
      COLLECTION: '#0ff',
      DOOR_SEEKING: '#4f4',
      RETURN: '#888'  // 返回模式用灰色
    };
    
    const doorInfo = decision.targetDoor ? `<div style="font-size:11px; color:#4f4;">🚪 目标: ${decision.targetDoor.dir} (${Math.round(decision.targetDoor.x)},${Math.round(decision.targetDoor.y)})</div>` : '';
    
    indicator.innerHTML = `
      <div style="font-weight:bold; margin-bottom:5px;">🤖 AI 决策</div>
      <div>${actionEmojis[decision.action] || '❓'} ${decision.action}</div>
      <div style="font-size:12px; color:#aaa;">策略: ${decision.strategy}</div>
      ${doorInfo}
    `;
    
    // 3秒后淡出
    clearTimeout(window.aiIndicatorTimeout);
    window.aiIndicatorTimeout = setTimeout(() => {
      if (indicator) indicator.style.opacity = '0.5';
    }, 3000);
    const game = window.game;
    if (!game || !game.player) return;
    
    game.keys = {};
    
    const action = decision.action;
    const player = game.player;
    const enemies = game.curRoom?.enemies || [];
    
    // ========== 危险感知躲避（保持安全距离）==========
    // 敌人太近时后退，达到安全距离后继续执行原策略
    if (enemies.length > 0) {
      let nearestEnemy = null;
      let minEnemyDist = Infinity;
      enemies.forEach(e => {
        const d = Math.sqrt((e.x - player.x) ** 2 + (e.y - player.y) ** 2);
        if (d < minEnemyDist) {
          minEnemyDist = d;
          nearestEnemy = e;
        }
      });
      
      // 敌人距离<100时后退，达到150安全距离后停止
      if (nearestEnemy && minEnemyDist < 100) {
        console.log(`   🛡️ 危险感知: 敌人距离${Math.round(minEnemyDist)}，后退`);
        const dx = player.x - nearestEnemy.x;
        const dy = player.y - nearestEnemy.y;
        // 后退方向
        if (Math.abs(dx) > Math.abs(dy)) {
          game.keys[dx > 0 ? 'd' : 'a'] = true;
          player.x += (dx > 0 ? 1 : -1) * 120 * 0.016;
        } else {
          game.keys[dy > 0 ? 's' : 'w'] = true;
          player.y += (dy > 0 ? 1 : -1) * 120 * 0.016;
        }
        player.isMoving = true;
        return; // 保持安全距离，跳过其他动作
      }
      // 距离>150时，继续执行下面的正常决策（战斗/探索等）
    }
    
    if (action === 'combat' && enemies.length > 0) {
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
        
        if (minDist < 60 && !player.isDashing && player.dashCooldown <= 0) {
          player.isDashing = true;
          player.dashTime = 0.15;
          player.dashCooldown = 0.8;
        }
      }
    }
    else if (action === 'flee' && enemies.length > 0) {
      let nearest = enemies[0];
      let minDist = Infinity;
      enemies.forEach(e => {
        const d = Math.sqrt((e.x - player.x) ** 2 + (e.y - player.y) ** 2);
        if (d < minDist) {
          minDist = d;
          nearest = e;
        }
      });
      
      // 保持安全距离150，距离够远时停止逃跑
      if (minDist < 150) {
        const dx = player.x - nearest.x;
        const dy = player.y - nearest.y;
        if (Math.abs(dx) > Math.abs(dy)) {
          game.keys[dx > 0 ? 'd' : 'a'] = true;
          player.x += (dx > 0 ? 1 : -1) * 120 * 0.016;
        } else {
          game.keys[dy > 0 ? 's' : 'w'] = true;
          player.y += (dy > 0 ? 1 : -1) * 120 * 0.016;
        }
        player.isMoving = true;
      }
      // 距离>=150时，不执行逃跑动作，让AI执行其他策略（如战斗或探索）
    }
    else if (action === 'explore') {
      // 智能探索：靠近墙时往中心移动，否则随机
      const wallT = 60;
      const margin = 100; // 距离墙边界的阈值
      const centerX = game.ROOM_WIDTH / 2;
      const centerY = game.ROOM_HEIGHT / 2;
      
      // 检测是否靠近墙
      const nearLeft = player.x < wallT + margin;
      const nearRight = player.x > game.ROOM_WIDTH - wallT - margin;
      const nearTop = player.y < wallT + margin;
      const nearBottom = player.y > game.ROOM_HEIGHT - wallT - margin;
      
      if (nearLeft || nearRight || nearTop || nearBottom) {
        // 靠近墙，往房间中心移动
        const dx = centerX - player.x;
        const dy = centerY - player.y;
        if (Math.abs(dx) > Math.abs(dy)) {
          game.keys[dx > 0 ? 'd' : 'a'] = true;
          player.x += (dx > 0 ? 1 : -1) * 150 * 0.016;
        } else {
          game.keys[dy > 0 ? 's' : 'w'] = true;
          player.y += (dy > 0 ? 1 : -1) * 150 * 0.016;
        }
      } else {
        // 在房间中间，随机移动
        const moves = ['w', 'a', 's', 'd'];
        const move = moves[Math.floor(Math.random() * moves.length)];
        game.keys[move] = true;
        const speed = 150 * 0.016;
        if (move === 'w') player.y -= speed;
        if (move === 's') player.y += speed;
        if (move === 'a') player.x -= speed;
        if (move === 'd') player.x += speed;
      }
      player.isMoving = true;
    }
    else if (action === 'collect') {
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
    else if (action === 'seek_door' && decision.targetDoor) {
      // 寻门：走向目标门
      const door = decision.targetDoor;
      const dx = door.x - player.x;
      const dy = door.y - player.y;
      
      // 向门移动（速度更快）
      if (Math.abs(dx) > Math.abs(dy)) {
        game.keys[dx > 0 ? 'd' : 'a'] = true;
        player.x += (dx > 0 ? 1 : -1) * 200 * 0.016;
      } else {
        game.keys[dy > 0 ? 's' : 'w'] = true;
        player.y += (dy > 0 ? 1 : -1) * 200 * 0.016;
      }
      player.isMoving = true;
      
      // 近距离冲刺进门
      const distToDoor = Math.sqrt(dx * dx + dy * dy);
      if (distToDoor < 80 && !player.isDashing && player.dashCooldown <= 0) {
        player.isDashing = true;
        player.dashTime = 0.15;
        player.dashCooldown = 0.8;
      }
    }
  }, decision);
}

// ==================== 主训练函数 ====================
async function run() {
  console.log('🐮 牛牛肉鸽 AI 连续学习训练系统 v3.3 (v0.13.0适配版)');
  console.log('   AI 将持续学习，游戏结束后自动重新开始');
  console.log(`   训练局数: ${config.rounds} 局`);
  console.log(`   游戏速度: ${config.speed}x`);
  console.log(`   模式: ${config.mode === 'god' ? '🛡️ 无敌模式' : '⚔️ 普通模式'}`);
  console.log('');
  
  // 初始化 AI 学习器
  const aiLearner = new AILearner(DATA_DIR);
  
  // 启动浏览器
  console.log('🚀 启动浏览器...');
  const browser = await chromium.launch({ 
    headless: config.headless,
    channel: 'chrome',
    args: ['--disable-web-security']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1200, height: 800 },
    deviceScaleFactor: 1,
  });
  
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
    
    // 只显示错误和关键游戏事件
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
      // 显示行为加分/扣分的关键日志
      console.log(`   📋 [Game] ${text}`);
    }
  });
  
  // 监听页面错误
  page.on('pageerror', error => {
    console.log(`   🔴 [PageError] ${error.message}`);
  });
  
  // 加载游戏（v0.13.0支持模式参数）
  const gameUrl = `http://localhost:8080/?mode=${config.mode}`;
  console.log(`🎯 加载游戏: ${gameUrl}`);
  console.log(`   模式: ${config.mode === 'god' ? '🛡️ 无敌模式' : '⚔️ 普通模式'}`);
  await page.goto(gameUrl, { waitUntil: 'networkidle' });
  await sleep(3000);
  
  // 开始第一局并跳过开场动画
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
  
  // 选择武器（点击第一个武器选项）
  const weaponOption = await page.$('.weapon-option');
  if (weaponOption) {
    console.log('🗡️ 选择武器...');
    await weaponOption.click();
    await sleep(500);
  }
  
  await sleep(500);
  
  if (config.speed > 1) {
    await setGameSpeed(page, config.speed);
  }
  
  // 静音游戏
  await page.evaluate(() => {
    if (window.game && window.game.sounds) {
      window.game.sounds.setVolume(0, 0, 0);  // 主音量、音效、音乐全部静音
      console.log('🔇 游戏已静音');
    }
  });
  
  console.log('🎮 开始连续训练！\n');
  
  const bugDetector = new BugDetector(BUG_REPORT_DIR);
  let totalGames = 0;
  let totalScore = 0;
  let bestScore = 0;
  
  // 连续训练循环
  for (let round = 1; round <= config.rounds; round++) {
    console.log(`\n========================================`);
    console.log(`🎮 训练回合 ${round} / ${config.rounds}`);
    console.log(`📚 当前累计: ${aiLearner.performance.gamesPlayed} 局学习数据`);
    console.log(`========================================`);
    
    // 获取当前策略
    const currentStrategy = aiLearner.getStrategy(true);
    if (currentStrategy.isExploration) {
      console.log('🎲 本局为探索模式（随机策略）');
    } else {
      console.log('🎯 本局为利用模式（学习策略）');
    }
    console.log('');
    
    // 初始化当前游戏
    aiLearner.resetCurrentGame();
    
    // 检查游戏是否正常启动
    const initialState = await getGameState(page);
    if (initialState && (initialState.isFinished || initialState.playerHp <= 0)) {
      console.log(`   ⚠️ 游戏状态异常，尝试重启...`);
      const restartSuccess = await restartGame(page);
      if (!restartSuccess) {
        console.log(`   ❌ 无法启动游戏，跳过本局`);
        break;
      }
    }
    
    const gameEvents = [];
    const startTime = Date.now();
    let lastState = null;
    let maxScore = 0;
    let bugCheckCounter = 0;
    let gameEnded = false;
    let finalResult = null;
    let finalScore = 0;
    let lastDecisionTime = 0;
    
    // 寻门奖励追踪
    let lastDecision = null;
    let lastRoomCount = 0;
    let consecutiveDoorSeeking = 0;  // 连续寻门计数
    let noDoorSeekingCount = 0;      // 未选择寻门的计数（用于强制引导）
    
    // 商店处理追踪
    let lastShopAction = 0;          // 上次商店操作时间
    let shopToggleCount = 0;         // 商店开关次数（惩罚用）
    let shopLastState = false;       // 上次商店状态
    
    // 武器选择箱追踪（v0.13.0精英房掉落）
    let lastWeaponChoiceCheck = 0;
    
    // 根据速度调整AI决策间隔（毫秒）
    // 高速时减少决策频率，避免CPU过载
    const decisionInterval = config.speed >= 50 ? 200 : config.speed >= 20 ? 100 : config.speed >= 10 ? 50 : 16;
    
    // 单局游戏循环
    while (!gameEnded) {
      const elapsed = Date.now() - startTime;
      
      // 检查超时
      if (elapsed > config.maxTime) {
        console.log('\n⏰ 达到最大运行时间');
        finalResult = 'timeout';
        finalScore = maxScore;
        gameEnded = true;
        break;
      }
      
      // 获取游戏状态
      const state = await getGameState(page);
      if (!state) {
        await sleep(100);
        continue;
      }
      
      // Bug检测
      bugCheckCounter++;
      if (bugCheckCounter % 10 === 0) {
        await bugDetector.detect(page, state, round);
      }
      
      // 更新最高分数
      if (state.score > maxScore) maxScore = state.score;
      
      // 检测游戏结束或无效状态
      if (state.isFinished || state.playerHp <= 0) {
        await sleep(800); // 等待惩罚计算完成
        
        // 获取最终分数（包含死亡惩罚）
        const gameResultData = await page.evaluate(() => {
          return window.game?.gameResultData || null;
        });
        
        // 优先使用 gameResultData.finalScore（包含死亡惩罚）
        if (gameResultData && gameResultData.finalScore !== undefined) {
          finalScore = gameResultData.finalScore;
        } else {
          // 备用：使用实时分数
          finalScore = state.score;
        }
        finalResult = state.result;
        gameEnded = true;
        
        console.log('\n' + '='.repeat(40));
        console.log(`🏁 本局结束: ${finalResult.toUpperCase()}`);
        if (finalResult === 'dead' && gameResultData) {
          console.log(`💀 死亡惩罚: -500分`);
          console.log(`📊 基础分数: ${gameResultData.baseScore?.toLocaleString() || state.score.toLocaleString()}`);
          console.log(`💯 最终分数: ${finalScore.toLocaleString()}`);
        } else if (finalResult === 'cleared' && gameResultData && gameResultData.multiplier > 1) {
          console.log(`🎉 通关加成: ×${gameResultData.multiplier}`);
          console.log(`💯 最终分数: ${finalScore.toLocaleString()}`);
        } else {
          console.log(`💯 最终分数: ${finalScore.toLocaleString()}`);
        }
        console.log(`🎯 游戏内最高: ${maxScore.toLocaleString()}`);
        console.log(`⚔️ 击杀: ${state.scoreStats.enemiesKilled || 0}`);
        console.log(`🗺️ 房间: ${state.scoreStats.roomsExplored || 0}`);
        console.log(`⏱️ 时长: ${(elapsed/1000).toFixed(1)}秒`);
        console.log('='.repeat(40));
        
        // AI 学习
        try {
          aiLearner.learnFromGame(finalScore, finalResult, elapsed);
          console.log(`   📚 累计学习: ${aiLearner.performance.gamesPlayed} 局`);
        } catch (e) {
          console.error('   ❌ 学习过程出错:', e.message);
        }
        
        // 更新统计
        totalGames++;
        totalScore += finalScore;
        if (finalScore > bestScore) bestScore = finalScore;
        
        // 保存本局数据
        const timestamp = Date.now();
        const dataFile = path.join(DATA_DIR, `train_${round}_${timestamp}.json`);
        const aiStats = aiLearner.getStats();
        fs.writeFileSync(dataFile, JSON.stringify({
          version: "v3.4-continuous-weapon",
          trainCount: round.toString(),
          timestamp: new Date(timestamp).toISOString(),
          config,
          result: finalResult,
          score: finalScore,
          maxScoreDuringGame: maxScore,
          playTime: elapsed,
          stats: state.scoreStats,
          events: gameEvents,
          // v0.16.0: 武器配置数据
          finalWeapons: state.weapons,
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
        
        // 如果不是最后一局，重新开始
        if (round < config.rounds) {
          const restartSuccess = await restartGame(page);
          if (!restartSuccess) {
            console.log(`   ⚠️ 重启失败，跳过第 ${round + 1} 局`);
            // 跳过后续局数
            break;
          }
        }
        
        break;
      }
      
      // 记录数据（每2秒）
      if (!lastState || elapsed - lastState.timestamp > 2000 / config.speed) {
        gameEvents.push({
          time: elapsed,
          score: state.score,
          hp: state.playerHp,
          enemies: state.enemyCount,
          kills: state.enemiesKilled,
          floor: state.currentFloor
        });
        lastState = state;
        
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
          continue; // 跳过本帧其他决策
        }
        
        // 记录决策前的分数（用于即时学习）
        const scoreBefore = state.score;
        const playerPosBefore = { x: state.playerX, y: state.playerY };
        
        // 检测是否成功进入新房间（寻门成功）
        const currentRooms = state.scoreStats?.roomsExplored || 0;
        if (lastDecision === 'seek_door' && currentRooms > lastRoomCount) {
          // 寻门成功进入新房间，给予即时奖励
          console.log(`   🚪 寻门成功! 进入新房间 +50分`);
          consecutiveDoorSeeking = 0;  // 重置连续计数
        }
        lastRoomCount = currentRooms;
        
        const strategy = aiLearner.getStrategy(true);
        let decision = await aiMakeDecision(page, strategy);
        
        // 强制引导：房间清理完后，如果AI连续3次不寻门，强制尝试寻门
        const roomCleared = state.enemyCount === 0;
        if (roomCleared && decision.action !== 'seek_door') {
          noDoorSeekingCount++;
          if (noDoorSeekingCount >= 3) {
            // 强制改为寻门决策（静默执行，不输出日志）
            decision = await aiMakeDecision(page, { DOOR_SEEKING: 1.0 });
            noDoorSeekingCount = 0;
          }
        } else if (decision.action === 'seek_door') {
          noDoorSeekingCount = 0;
        }
        
        // 记录决策
        lastDecision = decision.action;
        
        // 执行动作
        await aiExecuteAction(page, decision);
        
        // 即时学习：等待一小段时间后检查分数变化
        await sleep(100); // 让游戏执行并产生结果
        const newState = await getGameState(page);
        if (newState && newState.isPlaying) {
          const scoreChange = newState.score - scoreBefore;
          const posChange = Math.sqrt((newState.playerX - playerPosBefore.x) ** 2 + (newState.playerY - playerPosBefore.y) ** 2);
          
          // 根据结果调整策略
          if (scoreChange < 0) {
            // 扣分！输出警告并考虑改变策略
            console.log(`   ⚠️ 动作[${decision.action}]导致扣分: ${scoreChange}分`);
            // 记录这个负面经验（给负奖励）
            aiLearner.recordDecision(state, decision.action, scoreChange, decision.strategy);
          } else if (scoreChange > 0) {
            // 加分！正面反馈
            console.log(`   ✅ 动作[${decision.action}]获得加分: +${scoreChange}分`);
            aiLearner.recordDecision(state, decision.action, scoreChange, decision.strategy);
          } else if (posChange < 5 && decision.action !== 'seek_door') {
            // 没动！可能卡住了
            console.log(`   ⚠️ 动作[${decision.action}]没有移动，可能卡住`);
          }
          
          // 如果是寻门动作但位置几乎没变，可能是门位置问题
          if (decision.action === 'seek_door' && posChange < 10) {
            consecutiveDoorSeeking++;
            if (consecutiveDoorSeeking > 5) {
              console.log(`   🚪 寻门卡住${consecutiveDoorSeeking}次，尝试随机移动`);
              // 强制随机移动一次来脱困
              await aiExecuteAction(page, { action: 'explore', strategy: 'default' });
              consecutiveDoorSeeking = 0;
            }
          } else {
            consecutiveDoorSeeking = 0;
          }
        }
      }
      
      // 智能商店处理（每3秒一次，避免频繁操作）
      if (elapsed - lastShopAction >= 3000) {
        lastShopAction = elapsed;
        
        const shopResult = await page.evaluate(() => {
          const game = window.game;
          if (!game) return { action: 'none' };
          
          // 处理升级界面（优先）
          if (game.levelUpOpen) {
            const options = game.levelUpOptions;
            if (options && options.length > 0) {
              // 简单策略：随机选择（后续可以优化为选择最好的）
              const randomIndex = Math.floor(Math.random() * options.length);
              game.selectLevelUpOption(randomIndex);
              return { action: 'levelup', index: randomIndex };
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
                return { action: 'open_shop', gold: player.gold };
              }
            } else {
              // 商店打开状态：智能购买决策
              if (shopItems.length === 0 || player.gold < 30) {
                // 没钱或没货，关闭商店
                game.closeShop();
                return { action: 'close_shop', reason: 'empty_or_no_gold' };
              }
              
              // 尝试购买最便宜的物品
              let cheapestIndex = -1;
              let cheapestPrice = Infinity;
              for (let i = 0; i < shopItems.length; i++) {
                if (shopItems[i] && shopItems[i].price < cheapestPrice && shopItems[i].price <= player.gold) {
                  cheapestPrice = shopItems[i].price;
                  cheapestIndex = i;
                }
              }
              
              if (cheapestIndex >= 0) {
                // 有钱买，购买
                game.buyItem(cheapestIndex);
                return { action: 'buy', index: cheapestIndex, price: cheapestPrice };
              } else {
                // 买不起任何物品，关闭商店离开
                game.closeShop();
                return { action: 'close_shop', reason: 'cant_afford' };
              }
            }
          }
          
          return { action: 'none' };
        });
        
        // 输出商店操作
        if (shopResult.action === 'open_shop') {
          console.log(`   🏪 打开商店 (金币:${shopResult.gold})`);
        } else if (shopResult.action === 'buy') {
          console.log(`   💰 购买物品 #${shopResult.index + 1} (-${shopResult.price}金币)`);
          shopToggleCount = 0; // 购买成功重置计数
        } else if (shopResult.action === 'close_shop') {
          console.log(`   🚪 离开商店 (${shopResult.reason === 'cant_afford' ? '买不起' : '已清空'})`);
        } else if (shopResult.action === 'blind_talk') {
          console.log(`   🗣️ 与盲眼NPC交谈 (F键)`);
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
            console.log(`   🗡️ 选择武器 #${weaponChoiceResult.index + 1}`);
          }
        }
        
        // 检测反复开关商店（惩罚机制）
        if (shopResult.action === 'open_shop' || shopResult.action === 'close_shop') {
          if (shopLastState === (shopResult.action === 'open_shop')) {
            // 状态重复（比如连续打开或连续关闭）
            shopToggleCount++;
          } else {
            shopToggleCount = 0;
          }
          shopLastState = (shopResult.action === 'open_shop');
          
          // 超过3次无效操作，记录惩罚
          if (shopToggleCount >= 3) {
            console.log(`   ⚠️ 商店操作混乱，强制冷却`);
            lastShopAction += 5000; // 增加5秒冷却
            shopToggleCount = 0;
          }
        }
      }
      
      await sleep(16 / config.speed);
    }
    
    // 每5局保存Bug报告
    if (round % 5 === 0) {
      bugDetector.saveReport(round);
    }
  }
  
  // 保存最终Bug报告
  bugDetector.saveReport(config.rounds);
  
  // 关闭浏览器
  await browser.close();
  
  // 输出最终统计
  console.log('\n========================================');
  console.log('✅ 连续训练完成！');
  console.log('========================================');
  console.log(`总训练局数: ${totalGames}`);
  console.log(`平均分数: ${Math.round(totalScore / totalGames)}`);
  console.log(`最高分数: ${bestScore}`);
  console.log(`训练数据保存位置: ${DATA_DIR}`);
  console.log('========================================\n');
  
  // 输出学习统计
  const stats = aiLearner.getStats();
  console.log('🧠 AI 学习统计');
  console.log(`总游戏数: ${stats.gamesPlayed}`);
  console.log(`历史平均分: ${Math.round(stats.averageScore)}`);
  console.log(`历史最高分: ${stats.bestScore}`);
  console.log(`当前探索率: ${(stats.epsilon * 100).toFixed(1)}%`);
  console.log('\n🎯 最终策略权重:');
  Object.entries(stats.strategyWeights).forEach(([s, w]) => {
    console.log(`  ${s.padEnd(12)} ${(w * 100).toFixed(1)}%`);
  });
}

run().catch(err => {
  console.error('❌ 错误:', err);
  process.exit(1);
});
