<template>
  <div class="quickfix-page">
    <div class="page-header">
      <h2>🩹 一键修复工具</h2>
      <p class="subtitle">自动检测并修复常见的数据问题</p>
    </div>

    <!-- 扫描结果概览 -->
    <el-row :gutter="20" class="scan-overview">
      <el-col :span="6" v-for="stat in scanStats" :key="stat.label">
        <el-card class="stat-card" :class="stat.type">
          <div class="stat-content">
            <el-icon :size="32"><component :is="stat.icon" /></el-icon>
            <div class="stat-info">
              <div class="stat-value">{{ stat.value }}</div>
              <div class="stat-label">{{ stat.label }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 检测问题列表 -->
    <el-card class="issues-card">
      <template #header>
        <div class="card-header">
          <span>🔍 检测到的问题</span>
          <el-button type="primary" @click="runScan" :loading="scanning">
            <el-icon><Refresh /></el-icon>
            重新扫描
          </el-button>
        </div>
      </template>

      <el-empty v-if="!issues.length && !scanning" description="暂无问题，数据状态良好！" />
      
      <div v-else class="issues-list">
        <div
          v-for="issue in issues"
          :key="issue.id"
          class="issue-item"
          :class="issue.severity"
        >
          <div class="issue-icon">
            <el-icon :size="20">
              <CircleClose v-if="issue.severity === 'error'" />
              <Warning v-else-if="issue.severity === 'warning'" />
              <InfoFilled v-else />
            </el-icon>
          </div>
          <div class="issue-content">
            <div class="issue-title">{{ issue.title }}</div>
            <div class="issue-desc">{{ issue.description }}</div>
            <div class="issue-location" v-if="issue.location">
              <el-icon><Location /></el-icon>
              {{ issue.location }}
            </div>
          </div>
          <div class="issue-actions">
            <el-button 
              type="primary" 
              size="small"
              :loading="issue.fixing"
              @click="fixIssue(issue)"
            >
              修复
            </el-button>
            <el-button text size="small" @click="ignoreIssue(issue)">
              忽略
            </el-button>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 批量修复 -->
    <el-card class="batch-fix-card" v-if="issues.length > 0">
      <template #header>
        <span>⚡ 批量修复</span>
      </template>
      <div class="batch-actions">
        <el-button type="danger" @click="fixAllIssues" :loading="fixingAll">
          <el-icon><FirstAidKit /></el-icon>
          一键修复全部 ({{ issues.length }}个问题)
        </el-button>
        <el-button @click="exportReport">
          <el-icon><Download /></el-icon>
          导出报告
        </el-button>
      </div>
    </el-card>

    <!-- 修复历史 -->
    <el-card class="history-card">
      <template #header>
        <span>📜 修复历史</span>
      </template>
      <el-timeline>
        <el-timeline-item
          v-for="record in fixHistory"
          :key="record.id"
          :type="record.type"
          :icon="record.icon"
          :timestamp="record.time"
        >
          {{ record.message }}
          <el-tag v-if="record.fixedCount" size="small" type="success">
            修复 {{ record.fixedCount }} 个问题
          </el-tag>
        </el-timeline-item>
      </el-timeline>
    </el-card>

    <!-- 修复向导 -->
    <el-card class="wizard-card">
      <template #header>
        <span>📖 修复向导</span>
      </template>
      <el-collapse>
        <el-collapse-item title="Player size 缺失" name="1">
          <p>Player 对象必须包含 size 属性，否则碰撞检测无法正常工作。</p>
          <el-alert type="info" :closable="false">
            <pre><code>this.player = {
  x: 100, y: 100,
  size: 48,  // 必须添加
  // ...
}</code></pre>
          </el-alert>
        </el-collapse-item>
        <el-collapse-item title="敌人 size 未定义" name="2">
          <p>ENEMY_TYPES 中的每个敌人必须定义 size 属性，用于体型计算。</p>
          <el-alert type="info" :closable="false">
            <pre><code>enemyName: {
  size: 42,  // 体型大小(像素)
  tier: 2,   // 等级
  // ...
}</code></pre>
          </el-alert>
        </el-collapse-item>
        <el-collapse-item title="贴图元数据缺失" name="3">
          <p>新添加的贴图需要在 metadata.json 中定义 bounds 信息。</p>
        </el-collapse-item>
      </el-collapse>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDataStore } from '../stores/dataStore'
import { ElMessage, ElMessageBox } from 'element-plus'

const dataStore = useDataStore()

const scanning = ref(false)
const fixingAll = ref(false)
const issues = ref([])

const scanStats = computed(() => [
  { label: '敌人总数', value: dataStore.enemyList.length, type: 'info', icon: 'User' },
  { label: '贴图数量', value: Object.keys(dataStore.spriteMetadata).length, type: 'success', icon: 'Picture' },
  { label: '数据问题', value: issues.value.length, type: issues.value.length > 0 ? 'danger' : 'success', icon: 'Warning' },
  { label: '已修复', value: fixHistory.value.filter(h => h.type === 'success').length, type: 'warning', icon: 'CircleCheck' }
])

const fixHistory = ref([
  { id: 1, message: '自动扫描完成', time: '刚刚', type: 'info', icon: 'InfoFilled' }
])

const runScan = async () => {
  scanning.value = true
  
  await new Promise(resolve => setTimeout(resolve, 800))
  
  const newIssues = []
  
  // 检查敌人数据
  dataStore.enemyList.forEach(enemy => {
    if (!enemy.size) {
      newIssues.push({
        id: `enemy-size-${enemy.key}`,
        severity: 'error',
        title: `敌人 "${enemy.name || enemy.key}" 缺少 size 属性`,
        description: 'size 属性用于计算碰撞箱和渲染尺寸',
        location: `ENEMY_TYPES.${enemy.key}`,
        fixable: true,
        fixType: 'addEnemySize',
        fixParams: { enemyKey: enemy.key }
      })
    }
    
    if (!enemy.tier) {
      newIssues.push({
        id: `enemy-tier-${enemy.key}`,
        severity: 'warning',
        title: `敌人 "${enemy.name || enemy.key}" 缺少 tier 属性`,
        description: 'tier 属性用于体型等级计算和描边颜色',
        location: `ENEMY_TYPES.${enemy.key}`,
        fixable: true,
        fixType: 'addEnemyTier',
        fixParams: { enemyKey: enemy.key }
      })
    }
    
    // 检查贴图引用
    if (enemy.sprite && !dataStore.spriteMetadata[enemy.sprite]) {
      newIssues.push({
        id: `sprite-missing-${enemy.sprite}`,
        severity: 'warning',
        title: `贴图 "${enemy.sprite}" 未找到元数据`,
        description: `敌人 "${enemy.name || enemy.key}" 引用的贴图没有 metadata 记录`,
        location: `assets/sprites/metadata.json`,
        fixable: false
      })
    }
  })
  
  // 检查 Player size
  const hasPlayerSize = dataStore.gameConfig?.player?.size
  if (!hasPlayerSize) {
    newIssues.push({
      id: 'player-size',
      severity: 'error',
      title: 'Player 对象缺少 size 属性',
      description: 'Player.size 是碰撞检测的必要属性',
      location: 'index.html - Player 初始化',
      fixable: true,
      fixType: 'addPlayerSize',
      fixParams: { size: 48 }
    })
  }
  
  issues.value = newIssues
  scanning.value = false
  
  fixHistory.value.unshift({
    id: Date.now(),
    message: '扫描完成',
    time: '刚刚',
    type: 'info',
    icon: 'InfoFilled'
  })
  
  if (newIssues.length === 0) {
    ElMessage.success('扫描完成，未发现数据问题')
  } else {
    ElMessage.warning(`扫描完成，发现 ${newIssues.length} 个问题`)
  }
}

const fixIssue = async (issue) => {
  issue.fixing = true
  
  try {
    const result = await dataStore.applyFix(issue.fixType, issue.fixParams)
    
    if (result.success) {
      ElMessage.success(`已修复: ${issue.title}`)
      
      fixHistory.value.unshift({
        id: Date.now(),
        message: `修复: ${issue.title}`,
        time: '刚刚',
        type: 'success',
        icon: 'CircleCheck',
        fixedCount: 1
      })
      
      // 从列表移除
      issues.value = issues.value.filter(i => i.id !== issue.id)
    } else {
      ElMessage.error(result.message || '修复失败')
    }
  } catch (error) {
    ElMessage.error('修复过程中出错')
  } finally {
    issue.fixing = false
  }
}

const ignoreIssue = (issue) => {
  issues.value = issues.value.filter(i => i.id !== issue.id)
  ElMessage.info('已忽略该问题')
}

const fixAllIssues = async () => {
  const fixableIssues = issues.value.filter(i => i.fixable)
  
  if (fixableIssues.length === 0) {
    ElMessage.info('没有可自动修复的问题')
    return
  }
  
  try {
    await ElMessageBox.confirm(
      `将自动修复 ${fixableIssues.length} 个问题，是否继续？`,
      '确认批量修复',
      { type: 'warning' }
    )
  } catch {
    return
  }
  
  fixingAll.value = true
  let fixedCount = 0
  
  for (const issue of fixableIssues) {
    try {
      const result = await dataStore.applyFix(issue.fixType, issue.fixParams)
      if (result.success) {
        fixedCount++
      }
    } catch (error) {
      console.error('修复失败:', issue.title, error)
    }
  }
  
  fixingAll.value = false
  
  fixHistory.value.unshift({
    id: Date.now(),
    message: '批量修复完成',
    time: '刚刚',
    type: 'success',
    icon: 'CircleCheck',
    fixedCount
  })
  
  ElMessage.success(`成功修复 ${fixedCount} 个问题`)
  await runScan()
}

const exportReport = () => {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: issues.value.length,
      errors: issues.value.filter(i => i.severity === 'error').length,
      warnings: issues.value.filter(i => i.severity === 'warning').length
    },
    issues: issues.value
  }
  
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `audit-report-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(url)
  
  ElMessage.success('报告已导出')
}

onMounted(() => {
  runScan()
})
</script>

<style lang="scss" scoped>
.quickfix-page {
  padding: 20px;
}

.page-header {
  margin-bottom: 24px;
  
  h2 {
    margin: 0 0 8px;
  }
  
  .subtitle {
    margin: 0;
    color: #909399;
  }
}

.scan-overview {
  margin-bottom: 24px;
  
  .stat-card {
    .stat-content {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    
    .stat-info {
      .stat-value {
        font-size: 24px;
        font-weight: bold;
        color: #303133;
      }
      
      .stat-label {
        font-size: 13px;
        color: #909399;
      }
    }
    
    &.error {
      background: #fef0f0;
      .stat-value { color: #F56C6C; }
    }
    
    &.warning {
      background: #fdf6ec;
      .stat-value { color: #E6A23C; }
    }
    
    &.success {
      background: #f0f9eb;
      .stat-value { color: #67C23A; }
    }
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.issues-card {
  margin-bottom: 20px;
}

.issues-list {
  .issue-item {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 16px;
    border-bottom: 1px solid #ebeef5;
    
    &:last-child {
      border-bottom: none;
    }
    
    &.error {
      background: #fef0f0;
      .issue-icon { color: #F56C6C; }
    }
    
    &.warning {
      background: #fdf6ec;
      .issue-icon { color: #E6A23C; }
    }
    
    &.info {
      background: #f4f4f5;
      .issue-icon { color: #909399; }
    }
    
    .issue-icon {
      margin-top: 2px;
    }
    
    .issue-content {
      flex: 1;
      
      .issue-title {
        font-weight: 500;
        margin-bottom: 4px;
      }
      
      .issue-desc {
        font-size: 13px;
        color: #606266;
        margin-bottom: 8px;
      }
      
      .issue-location {
        font-size: 12px;
        color: #909399;
        display: flex;
        align-items: center;
        gap: 4px;
      }
    }
    
    .issue-actions {
      display: flex;
      gap: 8px;
    }
  }
}

.batch-fix-card {
  margin-bottom: 20px;
  
  .batch-actions {
    display: flex;
    gap: 12px;
  }
}

.history-card, .wizard-card {
  margin-bottom: 20px;
}

.wizard-card {
  pre {
    margin: 12px 0 0;
    padding: 12px;
    background: #2d2d2d;
    color: #ccc;
    border-radius: 4px;
    font-size: 12px;
    overflow-x: auto;
  }
}
</style>
