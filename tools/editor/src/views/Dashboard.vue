<template>
  <div class="dashboard">
    <h1>数据总览 (Data Overview)</h1>
    
    <!-- 统计卡片 -->
    <div class="stats-grid">
      <el-card class="stat-card">
        <div class="stat-icon" style="background: #409EFF;">
          <el-icon size="32"><Monster /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ dataStore.enemyList.length }}</div>
          <div class="stat-label">敌人种类 (Enemy Types)</div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-icon" style="background: #67C23A;">
          <el-icon size="32"><Picture /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ Object.keys(dataStore.spriteMetadata).length }}</div>
          <div class="stat-label">贴图资源 (Sprites)</div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-icon" style="background: #E6A23C;">
          <el-icon size="32"><Box /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value">{{ Object.keys(dataStore.items).length }}</div>
          <div class="stat-label">物品道具 (Items)</div>
        </div>
      </el-card>
      
      <el-card class="stat-card">
        <div class="stat-icon" style="background: #F56C6C;">
          <el-icon size="32"><Warning /></el-icon>
        </div>
        <div class="stat-info">
          <div class="stat-value" :class="{ 'has-issues': dataStore.dataInconsistencies.length > 0 }">
            {{ dataStore.dataInconsistencies.length }}
          </div>
          <div class="stat-label">数据问题 (Issues)</div>
        </div>
      </el-card>
    </div>

    <!-- 系统健康度 -->
    <el-row :gutter="20" style="margin-bottom: 20px;">
      <el-col :span="6">
        <el-card class="health-card" :class="getHealthClass('enemy')">
          <div class="health-title">敌人系统健康度</div>
          <div class="health-score">{{ getHealthScore('enemy') }}%</div>
          <div class="health-detail">{{ getHealthDetail('enemy') }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="health-card" :class="getHealthClass('sprite')">
          <div class="health-title">贴图系统健康度</div>
          <div class="health-score">{{ getHealthScore('sprite') }}%</div>
          <div class="health-detail">{{ getHealthDetail('sprite') }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="health-card" :class="getHealthClass('collision')">
          <div class="health-title">碰撞系统健康度</div>
          <div class="health-score">{{ getHealthScore('collision') }}%</div>
          <div class="health-detail">{{ getHealthDetail('collision') }}</div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="health-card overall" :class="getOverallHealthClass()">
          <div class="health-title">整体健康度</div>
          <div class="health-score">{{ getOverallHealthScore() }}%</div>
          <div class="health-detail">{{ getOverallHealthDetail() }}</div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 问题列表 -->
    <el-card v-if="dataStore.dataInconsistencies.length > 0" class="issues-card">
      <template #header>
        <div class="card-header">
          <el-icon><WarningFilled /></el-icon>
          <span>数据一致性检查 (Data Consistency Check)</span>
        </div>
      </template>
      
      <el-table :data="dataStore.dataInconsistencies" style="width: 100%">
        <el-table-column prop="type" label="级别 (Level)" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === 'error' ? 'danger' : 'warning'" size="small">
              {{ row.type === 'error' ? '错误 (Error)' : '警告 (Warning)' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="system" label="系统 (System)" width="150" />
        <el-table-column prop="message" label="问题描述 (Description)" />
        <el-table-column prop="location" label="代码位置 (Location)" width="300">
          <template #default="{ row }">
            <code class="location-code">{{ row.location }}</code>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 系统架构图 -->
    <el-card class="architecture-card">
      <template #header>
        <div class="card-header">
          <el-icon><Share /></el-icon>
          <span>系统架构与数据流向 (System Architecture)</span>
        </div>
      </template>
      
      <div class="architecture-flow">
        <div class="flow-layer">
          <h4>资源层 (Assets Layer)</h4>
          <div class="flow-items">
            <div class="flow-item">
              <code>assets/sprites/*.png</code>
              <span>原始贴图 (Raw Sprites)</span>
            </div>
            <div class="flow-item">
              <code>assets/audio/*</code>
              <span>音效文件 (Audio Files)</span>
            </div>
          </div>
        </div>
        
        <div class="flow-arrow">↓ 解析 (Parse)</div>
        
        <div class="flow-layer">
          <h4>元数据层 (Metadata Layer)</h4>
          <div class="flow-items">
            <div class="flow-item">
              <code>metadata.json</code>
              <span>贴图元数据 (Sprite Metadata)</span>
            </div>
          </div>
        </div>
        
        <div class="flow-arrow">↓ 覆盖 (Override)</div>
        
        <div class="flow-layer">
          <h4>配置层 (Config Layer)</h4>
          <div class="flow-items">
            <div class="flow-item">
              <code>ENEMY_TYPES</code>
              <span>敌人配置 (Enemy Config)</span>
            </div>
            <div class="flow-item">
              <code>WEAPON_TYPES</code>
              <span>武器配置 (Weapon Config)</span>
            </div>
            <div class="flow-item">
              <code>ITEMS</code>
              <span>物品配置 (Item Config)</span>
            </div>
          </div>
        </div>
        
        <div class="flow-arrow">↓ 计算 (Calculate)</div>
        
        <div class="flow-layer">
          <h4>运行时层 (Runtime Layer)</h4>
          <div class="flow-items">
            <div class="flow-item">
              <code>Enemy.js</code>
              <span>敌人实例 (Enemy Instance)</span>
            </div>
            <div class="flow-item">
              <code>CollisionSystem.js</code>
              <span>碰撞检测 (Collision)</span>
            </div>
            <div class="flow-item">
              <code>BacklightSystem.js</code>
              <span>HD-2D渲染 (Rendering)</span>
            </div>
          </div>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { useDataStore } from '../stores/dataStore'

const dataStore = useDataStore()

// 健康度计算
const getHealthScore = (system) => {
  const issues = dataStore.dataInconsistencies.filter(i => 
    i.system.toLowerCase().includes(system)
  )
  const totalErrors = issues.filter(i => i.type === 'error').length
  const totalWarnings = issues.filter(i => i.type === 'warning').length
  const score = Math.max(0, 100 - totalErrors * 20 - totalWarnings * 5)
  return score
}

const getHealthClass = (system) => {
  const score = getHealthScore(system)
  if (score >= 90) return 'healthy'
  if (score >= 70) return 'warning'
  return 'danger'
}

const getHealthDetail = (system) => {
  const score = getHealthScore(system)
  if (score >= 90) return '状态良好'
  if (score >= 70) return '存在警告'
  return '需要修复'
}

const getOverallHealthScore = () => {
  const scores = [
    getHealthScore('enemy'),
    getHealthScore('sprite'),
    getHealthScore('collision')
  ]
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
}

const getOverallHealthClass = () => {
  const score = getOverallHealthScore()
  if (score >= 90) return 'healthy'
  if (score >= 70) return 'warning'
  return 'danger'
}

const getOverallHealthDetail = () => {
  const score = getOverallHealthScore()
  if (score >= 90) return '系统运行正常'
  if (score >= 70) return '建议优化'
  return '需要立即修复'
}
</script>

<style lang="scss" scoped>
.dashboard {
  h1 {
    color: #fff;
    margin-bottom: 24px;
    font-size: 28px;
  }
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: #1a1a2e;
  border: 1px solid #2a2a4e;
  
  :deep(.el-card__body) {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px;
  }
  
  .stat-icon {
    width: 64px;
    height: 64px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #fff;
  }
  
  .stat-info {
    .stat-value {
      font-size: 32px;
      font-weight: 700;
      color: #fff;
      line-height: 1;
      
      &.has-issues {
        color: #F56C6C;
      }
    }
    
    .stat-label {
      font-size: 13px;
      color: #888;
      margin-top: 4px;
    }
  }
}

.issues-card,
.architecture-card {
  background: #1a1a2e;
  border: 1px solid #2a2a4e;
  margin-top: 20px;
  
  .card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    color: #fff;
  }
}

.location-code {
  background: #0f0f1e;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 11px;
  color: #67C23A;
}

.health-card {
  text-align: center;
  background: #1a1a2e;
  border: 1px solid #2a2a4e;
  
  &.healthy {
    border-color: #67C23A;
    .health-score { color: #67C23A; }
  }
  
  &.warning {
    border-color: #E6A23C;
    .health-score { color: #E6A23C; }
  }
  
  &.danger {
    border-color: #F56C6C;
    .health-score { color: #F56C6C; }
  }
  
  &.overall {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  }
  
  .health-title {
    font-size: 13px;
    color: #888;
    margin-bottom: 12px;
  }
  
  .health-score {
    font-size: 36px;
    font-weight: 700;
    margin-bottom: 8px;
  }
  
  .health-detail {
    font-size: 12px;
    color: #666;
  }
}

.architecture-flow {
  padding: 20px;
  
  .flow-layer {
    background: #16213e;
    border: 1px solid #2a2a4e;
    border-radius: 8px;
    padding: 16px;
    
    h4 {
      color: #409EFF;
      margin-bottom: 12px;
      font-size: 14px;
    }
    
    .flow-items {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }
    
    .flow-item {
      background: #0f0f1e;
      border: 1px solid #3a3a5e;
      border-radius: 6px;
      padding: 12px 16px;
      
      code {
        display: block;
        color: #E6A23C;
        font-size: 13px;
        margin-bottom: 4px;
      }
      
      span {
        color: #888;
        font-size: 12px;
      }
    }
  }
  
  .flow-arrow {
    text-align: center;
    padding: 12px;
    color: #666;
    font-size: 13px;
  }
}
</style>
