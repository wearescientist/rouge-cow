/**
 * 清理旧的训练数据（删除前188局）
 * 使用方法: node cleanup_data.js
 */

const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const LEARNING_FILE = path.join(DATA_DIR, 'ai_learning_data.json');

// 要删除的局数（1-188）
const DELETE_UP_TO_GAME = 188;

function cleanupData() {
  // 检查学习数据文件
  if (!fs.existsSync(LEARNING_FILE)) {
    console.log('⚠️  学习数据文件不存在: ai_learning_data.json');
    console.log('   可能还没有保存过学习数据（需要运行至少一局训练）');
    console.log('');
    console.log('选项:');
    console.log('   1. 运行一次训练，让系统创建学习数据文件');
    console.log('   2. 删除所有历史训练文件重新开始');
    
    // 检查是否有历史训练文件
    const files = fs.readdirSync(DATA_DIR).filter(f => f.startsWith('train_') && f.endsWith('.json'));
    if (files.length > 0) {
      console.log('');
      console.log(`📂 发现 ${files.length} 个历史训练文件:`);
      files.forEach(f => console.log(`   - ${f}`));
      console.log('');
      console.log('是否删除这些文件? (y/n)');
      
      // 自动删除（非交互模式）
      console.log('   自动删除中...');
      files.forEach(f => {
        fs.unlinkSync(path.join(DATA_DIR, f));
        console.log(`   🗑️  已删除: ${f}`);
      });
      console.log('✅ 已清理所有历史训练文件');
    }
    return;
  }

  console.log('📂 正在读取学习数据...');
  const data = JSON.parse(fs.readFileSync(LEARNING_FILE, 'utf8'));
  
  const originalGames = data.performance?.gamesPlayed || 0;
  console.log(`📊 当前数据:`);
  console.log(`   总局数: ${originalGames}`);
  console.log(`   历史记录: ${data.performance?.scoreHistory?.length || 0} 条`);
  console.log(`   Q表状态数: ${Object.keys(data.qTable || {}).length}`);
  console.log('');

  if (originalGames <= DELETE_UP_TO_GAME) {
    console.log(`⚠️  总局数(${originalGames})不足${DELETE_UP_TO_GAME}局，无需清理`);
    return;
  }

  // 备份原文件
  const backupFile = path.join(DATA_DIR, `ai_learning_data_backup_${Date.now()}.json`);
  fs.writeFileSync(backupFile, JSON.stringify(data, null, 2), 'utf8');
  console.log(`💾 已备份到: ${path.basename(backupFile)}`);

  // 清理历史记录（删除1-188局，保留189局及之后）
  if (data.performance?.scoreHistory) {
    const originalCount = data.performance.scoreHistory.length;
    data.performance.scoreHistory = data.performance.scoreHistory.filter(
      h => h.game > DELETE_UP_TO_GAME
    );
    const removedCount = originalCount - data.performance.scoreHistory.length;
    console.log(`🗑️  已删除 ${removedCount} 条历史记录 (前${DELETE_UP_TO_GAME}局)`);
    console.log(`   剩余 ${data.performance.scoreHistory.length} 条`);
  }

  // 更新总局数
  data.performance.gamesPlayed = originalGames - DELETE_UP_TO_GAME;
  console.log(`🎮 总局数: ${originalGames} → ${data.performance.gamesPlayed}`);

  // 重置策略效果统计
  if (data.performance?.strategyEffectiveness) {
    Object.keys(data.performance.strategyEffectiveness).forEach(key => {
      data.performance.strategyEffectiveness[key] = [];
    });
    console.log('🔄 已重置策略效果统计');
  }

  // 重置探索率
  data.epsilon = 0.3;
  console.log('🔍 已重置探索率为 30%');

  // 保存清理后的数据
  fs.writeFileSync(LEARNING_FILE, JSON.stringify(data, null, 2), 'utf8');
  console.log('');
  console.log('✅ 清理完成！');
  console.log(`💡 现在AI将从第 ${DELETE_UP_TO_GAME + 1} 局开始继续训练`);
  console.log('');
  console.log('保留内容:');
  console.log('   ✅ Q表（学到的状态价值）');
  console.log('   ✅ 策略权重分布');
  console.log('   ✅ 基础统计信息');
  console.log('');
  console.log('重置内容:');
  console.log('   🔄 探索率（重新开始探索）');
  console.log('   🔄 策略效果统计');
  console.log('   🗑️  历史详细记录（1-188局）');
}

cleanupData();
