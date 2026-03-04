/**
 * AI 学习系统 v0.16.0 - 武器升级学习版
 * 
 * 核心功能：
 * - 记录每次游戏的经验 (状态 -> 动作 -> 奖励)
 * - 学习最优策略权重
 * - 动态决策调整
 * - 探索 vs 利用平衡
 * - v0.16.0: 武器升级偏好学习
 */

const fs = require('fs');
const path = require('path');

class AILearner {
  constructor(dataDir) {
    this.dataDir = dataDir;
    this.learningFile = path.join(dataDir, 'ai_learning_data.json');
    this.experienceFile = path.join(dataDir, 'ai_experience.json');
    
    // 学习参数
    this.learningRate = 0.1;      // 学习率
    this.discountFactor = 0.9;    // 折扣因子
    this.epsilon = 0.2;           // 探索率（20%随机探索，加快收敛）
    this.epsilonDecay = 0.97;     // 探索率衰减（每局减少3%，更快收敛）
    this.minEpsilon = 0.05;       // 最小探索率
    
    // 初始化数据结构
    this.learningData = this.loadLearningData();
    this.experiences = [];        // 当前游戏的经验缓存
    
    // 策略权重（会被学习更新）
    // 增加 DOOR_SEEKING（寻门）策略，让AI主动找门
    // 增加 RETURN（返回已访问房间）策略，低权重用于特定情况
    this.strategyWeights = this.learningData.strategyWeights || {
      SURVIVAL: 0.15,      // 生存
      COMBAT: 0.15,        // 战斗
      EXPLORATION: 0.20,   // 探索
      COLLECTION: 0.10,    // 收集
      DOOR_SEEKING: 0.35,  // 寻门 - 主动走向开着的门
      RETURN: 0.05         // 返回 - 返回已访问房间（防止卡死）
    };
    
    // 兼容旧数据：补全缺失的策略权重
    if (!this.strategyWeights.DOOR_SEEKING) this.strategyWeights.DOOR_SEEKING = 0.35;
    if (!this.strategyWeights.RETURN) this.strategyWeights.RETURN = 0.05;
    // 重新归一化
    const total = Object.values(this.strategyWeights).reduce((a, b) => a + b, 0);
    if (total > 0) {
      Object.keys(this.strategyWeights).forEach(k => {
        this.strategyWeights[k] /= total;
      });
    }
    
    // 状态价值表 (State-Action Value)
    this.qTable = this.learningData.qTable || {};
    
    // 历史表现
    this.performance = this.learningData.performance || {
      gamesPlayed: 0,
      averageScore: 0,
      bestScore: 0,
      scoreHistory: [],
      strategyEffectiveness: {
        SURVIVAL: [],
        COMBAT: [],
        EXPLORATION: [],
        COLLECTION: [],
        DOOR_SEEKING: [],
        RETURN: []
      },
      // v0.16.0: 武器升级效果追踪
      weaponUpgrades: {},
      weaponWinRates: {},
      passiveWinRates: {}
    };
    
    // 兼容旧数据：补全缺失的策略
    if (!this.performance.strategyEffectiveness) {
      this.performance.strategyEffectiveness = {};
    }
    ['SURVIVAL', 'COMBAT', 'EXPLORATION', 'COLLECTION', 'DOOR_SEEKING', 'RETURN'].forEach(s => {
      if (!this.performance.strategyEffectiveness[s]) {
        this.performance.strategyEffectiveness[s] = [];
      }
    });
    
    // 当前游戏状态追踪
    this.currentGame = {
      experiences: [],
      decisions: [],
      startTime: Date.now()
    };
  }
  
  // 加载学习数据
  loadLearningData() {
    try {
      if (fs.existsSync(this.learningFile)) {
        const data = JSON.parse(fs.readFileSync(this.learningFile, 'utf8'));
        console.log(`📚 已加载学习数据: ${data.gamesPlayed || 0} 局游戏经验`);
        return data;
      }
    } catch (e) {
      console.warn('⚠️ 加载学习数据失败，使用默认参数');
    }
    return {};
  }
  
  // 保存学习数据
  saveLearningData() {
    const data = {
      lastUpdated: new Date().toISOString(),
      version: '0.16.0',
      gamesPlayed: this.performance.gamesPlayed,
      strategyWeights: this.strategyWeights,
      qTable: this.qTable,
      performance: this.performance,
      epsilon: this.epsilon
    };
    
    fs.writeFileSync(this.learningFile, JSON.stringify(data, null, 2), 'utf8');
  }
  
  // 获取当前策略（带探索）
  getStrategy(explore = true) {
    // ε-贪婪策略：以 epsilon 概率随机探索
    if (explore && Math.random() < this.epsilon) {
      // 随机生成策略权重（包含所有策略）
      const randomWeights = {
        SURVIVAL: Math.random() * 0.3,
        COMBAT: Math.random() * 0.4,
        EXPLORATION: Math.random() * 0.4,
        COLLECTION: Math.random() * 0.2,
        DOOR_SEEKING: Math.random() * 0.6,  // 寻门权重更高，鼓励探索
        RETURN: Math.random() * 0.1
      };
      // 归一化
      const sum = Object.values(randomWeights).reduce((a, b) => a + b, 0);
      Object.keys(randomWeights).forEach(k => {
        randomWeights[k] = randomWeights[k] / sum;
      });
      return { ...randomWeights, isExploration: true };
    }
    
    // 使用学习到的策略
    return { ...this.strategyWeights, isExploration: false };
  }
  
  // 根据游戏状态选择最优动作
  decideAction(gameState, availableActions) {
    const stateKey = this.getStateKey(gameState);
    
    // 如果 Q 表中有这个状态，选择价值最高的动作
    if (this.qTable[stateKey]) {
      let bestAction = availableActions[0];
      let bestValue = -Infinity;
      
      availableActions.forEach(action => {
        const qValue = this.qTable[stateKey][action] || 0;
        if (qValue > bestValue) {
          bestValue = qValue;
          bestAction = action;
        }
      });
      
      // 以 epsilon 概率随机选择（探索），但优先选择高分动作
      if (Math.random() < this.epsilon) {
        // 80%随机，20%选择当前最佳（引导探索）
        if (Math.random() < 0.8) {
          return availableActions[Math.floor(Math.random() * availableActions.length)];
        }
      }
      
      return bestAction;
    }
    
    // 新状态：随机选择并初始化 Q 值
    this.qTable[stateKey] = {};
    availableActions.forEach(action => {
      this.qTable[stateKey][action] = 0;
    });
    
    return availableActions[Math.floor(Math.random() * availableActions.length)];
  }
  
  // 将游戏状态转换为状态键（离散化）
  getStateKey(state) {
    // 将连续状态离散化为有限的状态空间
    const hpLevel = state.playerHp / state.playerMaxHp > 0.5 ? 'high' : 
                    state.playerHp / state.playerMaxHp > 0.3 ? 'medium' : 'low';
    const hasEnemies = state.enemyCount > 0 ? 'has_enemies' : 'no_enemies';
    const roomStatus = state.roomNumber > (state.scoreStats?.roomsExplored || 0) ? 'uncleared' : 'cleared';
    const scoreLevel = state.score > 1000 ? 'high_score' : state.score > 500 ? 'mid_score' : 'low_score';
    
    return `${hpLevel}_${hasEnemies}_${roomStatus}_${scoreLevel}`;
  }
  
  // 记录决策和结果（用于后续学习）
  recordDecision(state, action, reward = 0, strategy = null) {
    this.currentGame.decisions.push({
      timestamp: Date.now(),
      state: { ...state },
      stateKey: this.getStateKey(state),
      action: action,
      strategy: strategy,  // 记录策略类型
      reward: reward,
      score: state.score
    });
  }
  
  // 从游戏结果中学习
  learnFromGame(finalScore, gameResult, gameDuration) {
    const decisions = this.currentGame.decisions;
    if (decisions.length === 0) return;
    
    console.log(`\n🧠 AI 正在从本局游戏中学习...`);
    console.log(`   本局决策数: ${decisions.length}`);
    
    // 计算每个决策的累积奖励（反向传播）
    let cumulativeReward = finalScore / 100; // 基础奖励
    
    // 通关奖励
    if (gameResult === 'cleared') {
      cumulativeReward += 50;
    }
    
    // 从后向前更新 Q 值
    for (let i = decisions.length - 1; i >= 0; i--) {
      const decision = decisions[i];
      const stateKey = decision.stateKey;
      const action = decision.action;
      
      // 计算奖励增量
      let reward = 0;
      if (i < decisions.length - 1) {
        // 分数增长奖励
        reward = decisions[i + 1].score - decision.score;
      }
      reward += cumulativeReward * 0.1; // 未来奖励的折扣
      
      // 更新 Q 值
      if (!this.qTable[stateKey]) {
        this.qTable[stateKey] = {};
      }
      const oldQ = this.qTable[stateKey][action] || 0;
      this.qTable[stateKey][action] = oldQ + this.learningRate * (reward - oldQ);
      
      cumulativeReward = reward + this.discountFactor * cumulativeReward;
    }
    
    // 分析策略效果
    this.analyzeStrategyEffectiveness(finalScore);
    
    // 更新性能统计
    this.performance.gamesPlayed++;
    this.performance.scoreHistory.push({
      game: this.performance.gamesPlayed,
      score: finalScore,
      result: gameResult,
      duration: gameDuration,
      timestamp: new Date().toISOString()
    });
    
    // 只保留最近 100 局的历史
    if (this.performance.scoreHistory.length > 100) {
      this.performance.scoreHistory = this.performance.scoreHistory.slice(-100);
    }
    
    // 计算平均分和最高分
    const scores = this.performance.scoreHistory.map(h => h.score);
    this.performance.averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    this.performance.bestScore = Math.max(...scores);
    
    // 衰减探索率
    this.epsilon = Math.max(this.minEpsilon, this.epsilon * this.epsilonDecay);
    
    // 自适应调整策略权重
    this.adaptStrategyWeights();
    
    // 保存学习数据
    this.saveLearningData();
    
    // 重置当前游戏
    this.resetCurrentGame();
    
    // 输出学习报告
    this.printLearningReport();
  }
  
  // 重置当前游戏数据
  resetCurrentGame() {
    this.currentGame = {
      experiences: [],
      decisions: [],
      startTime: Date.now()
    };
  }
  
  // 分析策略效果
  analyzeStrategyEffectiveness(finalScore) {
    const decisions = this.currentGame.decisions;
    
    // 统计每种策略的使用次数和效果
    const strategyStats = {
      SURVIVAL: { count: 0, scoreGain: 0 },
      COMBAT: { count: 0, scoreGain: 0 },
      EXPLORATION: { count: 0, scoreGain: 0 },
      COLLECTION: { count: 0, scoreGain: 0 },
      DOOR_SEEKING: { count: 0, scoreGain: 0 },
      RETURN: { count: 0, scoreGain: 0 }
    };
    
    decisions.forEach((d, i) => {
      // 优先使用决策中标记的策略类型
      let strategy = d.strategy || 'COMBAT';
      // 兼容旧数据
      if (!d.strategy) {
        const action = d.action;
        if (action === 'flee') strategy = 'SURVIVAL';
        else if (action === 'explore') strategy = 'EXPLORATION';
        else if (action === 'collect') strategy = 'COLLECTION';
        else if (action === 'seek_door') strategy = 'DOOR_SEEKING';
      }
      
      strategyStats[strategy].count++;
      if (i < decisions.length - 1) {
        const scoreChange = decisions[i + 1].score - d.score;
        strategyStats[strategy].scoreGain += scoreChange;
        
        // 特殊处理：寻门后进入新房间（+50分）给予额外奖励
        if (strategy === 'DOOR_SEEKING' && scoreChange >= 50) {
          // 寻门成功进入新房间，额外加分
          strategyStats[strategy].scoreGain += 30; // 额外奖励寻门行为
        }
      }
    });
    
    // 记录每种策略的效果
    Object.keys(strategyStats).forEach(strategy => {
      const stat = strategyStats[strategy];
      if (stat.count > 0) {
        const effectiveness = stat.scoreGain / stat.count;
        this.performance.strategyEffectiveness[strategy].push(effectiveness);
        // 只保留最近 20 条
        if (this.performance.strategyEffectiveness[strategy].length > 20) {
          this.performance.strategyEffectiveness[strategy].shift();
        }
      }
    });
  }
  
  // 自适应调整策略权重
  adaptStrategyWeights() {
    console.log('   正在优化策略权重...');
    
    // 计算每种策略的平均效果
    const avgEffectiveness = {};
    Object.keys(this.performance.strategyEffectiveness).forEach(strategy => {
      const effects = this.performance.strategyEffectiveness[strategy];
      if (effects.length > 0) {
        avgEffectiveness[strategy] = effects.reduce((a, b) => a + b, 0) / effects.length;
      } else {
        avgEffectiveness[strategy] = 0;
      }
    });
    
    // 基于效果调整权重（效果好的策略权重增加）
    const totalEffectiveness = Object.values(avgEffectiveness).reduce((a, b) => a + Math.max(0, b), 0);
    
    if (totalEffectiveness > 0 && this.performance.gamesPlayed > 5) {
      const newWeights = {};
      Object.keys(avgEffectiveness).forEach(strategy => {
        const currentWeight = this.strategyWeights[strategy];
        const effectiveness = Math.max(0, avgEffectiveness[strategy]);
        
        // 新权重 = 旧权重 * (1 - 学习率) + 目标权重 * 学习率
        const targetWeight = effectiveness / totalEffectiveness;
        newWeights[strategy] = currentWeight * (1 - this.learningRate) + targetWeight * this.learningRate;
      });
      
      // 归一化确保总和为 1
      const sum = Object.values(newWeights).reduce((a, b) => a + b, 0);
      Object.keys(newWeights).forEach(k => {
        this.strategyWeights[k] = Math.max(0.05, newWeights[k] / sum); // 最小权重 5%
      });
    }
  }
  
  // 打印学习报告
  printLearningReport() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 AI 学习报告');
    console.log('='.repeat(50));
    console.log(`总游戏局数: ${this.performance.gamesPlayed}`);
    console.log(`历史平均分: ${Math.round(this.performance.averageScore)}`);
    console.log(`历史最高分: ${this.performance.bestScore}`);
    console.log(`当前探索率: ${(this.epsilon * 100).toFixed(1)}%`);
    console.log(`学习到的状态数: ${Object.keys(this.qTable).length}`);
    console.log('\n🎯 当前策略权重:');
    Object.entries(this.strategyWeights).forEach(([strategy, weight]) => {
      const bar = '█'.repeat(Math.round(weight * 20));
      console.log(`   ${strategy.padEnd(12)} ${(weight * 100).toFixed(1)}% ${bar}`);
    });
    
    // v0.16.0: 显示武器升级统计
    if (this.performance.weaponWinRates && Object.keys(this.performance.weaponWinRates).length > 0) {
      console.log('\n⚔️ 武器胜率TOP5:');
      const sortedWeapons = Object.entries(this.performance.weaponWinRates)
        .filter(([_, stat]) => stat.count >= 3) // 至少使用3次
        .sort((a, b) => (b[1].wins / b[1].count) - (a[1].wins / a[1].count))
        .slice(0, 5);
      
      sortedWeapons.forEach(([key, stat]) => {
        const winRate = (stat.wins / stat.count * 100).toFixed(1);
        console.log(`   ${key.padEnd(15)} 胜率:${winRate}% 场次:${stat.count}`);
      });
    }
    
    console.log('='.repeat(50));
  }
  
  // v0.16.0: 记录武器升级选择
  recordWeaponUpgrade(weaponKey, level, isNew, gameResult) {
    if (!this.performance.weaponUpgrades) {
      this.performance.weaponUpgrades = {};
    }
    
    const key = `${weaponKey}_L${level}`;
    if (!this.performance.weaponUpgrades[key]) {
      this.performance.weaponUpgrades[key] = {
        count: 0,
        wins: 0,
        totalScore: 0
      };
    }
    
    this.performance.weaponUpgrades[key].count++;
    this.performance.weaponUpgrades[key].totalScore += gameResult.score || 0;
    if (gameResult.result === 'cleared') {
      this.performance.weaponUpgrades[key].wins++;
    }
  }
  
  // v0.16.0: 更新武器胜率统计
  updateWeaponWinRates(weapons, result, score) {
    if (!this.performance.weaponWinRates) {
      this.performance.weaponWinRates = {};
    }
    
    weapons.forEach(w => {
      const key = w.isSuper ? `${w.key}_SUPER` : `${w.key}_L${w.level}`;
      if (!this.performance.weaponWinRates[key]) {
        this.performance.weaponWinRates[key] = { count: 0, wins: 0, avgScore: 0 };
      }
      
      const stat = this.performance.weaponWinRates[key];
      stat.count++;
      if (result === 'cleared') stat.wins++;
      stat.avgScore = (stat.avgScore * (stat.count - 1) + score) / stat.count;
    });
  }
  
  // 获取学习统计（用于主程序）
  getStats() {
    return {
      gamesPlayed: this.performance.gamesPlayed,
      averageScore: this.performance.averageScore,
      bestScore: this.performance.bestScore,
      epsilon: this.epsilon,
      strategyWeights: this.strategyWeights,
      // v0.16.0: 武器升级统计
      weaponUpgrades: this.performance.weaponUpgrades,
      weaponWinRates: this.performance.weaponWinRates
    };
  }
}

module.exports = AILearner;
