<template>
  <div class="home-page">
    <div class="welcome-section">
      <h1>🎮 游戏数据总控台</h1>
      <p class="subtitle">Game Data Master Editor v1.0.0</p>
      <p class="description">
        可视化编辑 <strong>深根之疫</strong> 游戏数据，包含敌人、武器、音效、HD-2D 渲染等系统
      </p>
    </div>

    <!-- 快捷入口 -->
    <el-row :gutter="16" class="quick-access">
      <el-col :span="6" v-for="item in quickAccess" :key="item.path">
        <el-card 
          class="access-card" 
          :class="{ 'is-new': item.isNew }"
          shadow="hover"
          @click="$router.push(item.path)"
        >
          <div class="card-content">
            <el-icon :size="40" :color="item.color">
              <component :is="item.icon" />
            </el-icon>
            <h3>{{ item.name }}</h3>
            <p>{{ item.desc }}</p>
            <el-tag v-if="item.isNew" type="danger" size="small" class="new-tag">NEW</el-tag>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 数据概览 -->
    <el-row :gutter="20" class="data-overview">
      <el-col :span="16">
        <el-card class="stats-card">
          <template #header>
            <div class="card-header">
              <span>📊 数据概览</span>
              <el-button text @click="refreshData">
                <el-icon><Refresh /></el-icon>
              </el-button>
            </div>
          </template>
          <el-row :gutter="16">
            <el-col :span="8" v-for="stat in stats" :key="stat.name">
              <div class="stat-item">
                <div class="stat-icon" :style="{ background: stat.bgColor }">
                  <el-icon :size="24" color="white">
                    <component :is="stat.icon" />
                  </el-icon>
                </div>
                <div class="stat-info">
                  <div class="stat-value">{{ stat.value }}</div>
                  <div class="stat-name">{{ stat.name }}</div>
                </div>
              </div>
            </el-col>
          </el-row>
        </el-card>
      </el-col>
      
      <el-col :span="8">
        <el-card class="status-card">
          <template #header>
            <span>⚡ 系统状态</span>
          </template>
          <div class="status-list">
            <div class="status-item" v-for="status in systemStatus" :key="status.name">
              <span class="status-name">{{ status.name }}</span>
              <el-tag :type="status.type" size="small">{{ status.value }}</el-tag>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 最近活动 -->
    <el-card class="activity-card">
      <template #header>
        <div class="card-header">
          <span>📝 最近活动</span>
          <el-button type="primary" size="small" @click="$router.push('/logs')">
            查看全部
          </el-button>
        </div>
      </template>
      <el-timeline>
        <el-timeline-item
          v-for="activity in recentActivities"
          :key="activity.id"
          :type="activity.type"
          :icon="activity.icon"
          :timestamp="activity.time"
        >
          {{ activity.content }}
        </el-timeline-item>
      </el-timeline>
    </el-card>

    <!-- 快速提示 -->
    <el-card class="tips-card">
      <template #header>
        <span>💡 快速提示</span>
      </template>
      <el-row :gutter="20">
        <el-col :span="12" v-for="tip in tips" :key="tip.title">
          <div class="tip-item">
            <el-icon :size="20" :color="tip.color">
              <component :is="tip.icon" />
            </el-icon>
            <div class="tip-content">
              <h4>{{ tip.title }}</h4>
              <p>{{ tip.content }}</p>
            </div>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDataStore } from '../stores/dataStore'

const dataStore = useDataStore()

const quickAccess = [
  { name: '敌人系统', desc: '编辑敌人数值、体型、AI', icon: 'User', color: '#409EFF', path: '/enemies' },
  { name: '武器系统', desc: '配置武器伤害、弹道', icon: 'Aim', color: '#67C23A', path: '/weapons', isNew: true },
  { name: '音效系统', desc: '管理BGM、音效、音量', icon: 'Headset', color: '#E6A23C', path: '/audio', isNew: true },
  { name: 'HD-2D渲染', desc: '调整边缘光、阴影、描边', icon: 'Magic', color: '#8E44AD', path: '/hd2d', isNew: true },
  { name: '全局搜索', desc: '快速查找游戏数据', icon: 'Search', color: '#909399', path: '/search' },
  { name: '一键修复', desc: '自动检测修复问题', icon: 'FirstAidKit', color: '#F56C6C', path: '/quick-fix' },
  { name: '依赖图', desc: '可视化数据依赖', icon: 'Share', color: '#16A085', path: '/dependency' },
  { name: '帮助文档', desc: '查看使用指南', icon: 'QuestionFilled', color: '#2C3E50', path: '/help', isNew: true }
]

const stats = computed(() => [
  { 
    name: '敌人种类', 
    value: dataStore.enemyList.length || '-', 
    icon: 'User', 
    bgColor: '#409EFF' 
  },
  { 
    name: '武器数量', 
    value: dataStore.weapons?.length || 0, 
    icon: 'Aim', 
    bgColor: '#67C23A' 
  },
  { 
    name: '贴图资源', 
    value: Object.keys(dataStore.spriteMetadata).length, 
    icon: 'Picture', 
    bgColor: '#E6A23C' 
  },
  { 
    name: '音效文件', 
    value: dataStore.audioFiles?.length || 0, 
    icon: 'Headset', 
    bgColor: '#8E44AD' 
  },
  { 
    name: '配置项', 
    value: '156+', 
    icon: 'Tools', 
    bgColor: '#16A085' 
  },
  { 
    name: '待处理问题', 
    value: dataStore.dataInconsistencies.length, 
    icon: 'Warning', 
    bgColor: '#F56C6C' 
  }
])

const systemStatus = computed(() => [
  { name: '后端服务', value: '运行中', type: 'success' },
  { name: '数据连接', value: '正常', type: 'success' },
  { name: '自动备份', value: '已启用', type: 'success' },
  { name: '文件监听', value: '活跃', type: 'success' }
])

const recentActivities = ref([
  { id: 1, content: '创建了 HD-2D 效果编辑器', time: '刚刚', type: 'success', icon: 'Check' },
  { id: 2, content: '添加了音频系统编辑功能', time: '5分钟前', type: 'success', icon: 'Check' },
  { id: 3, content: '完成武器系统可视化编辑', time: '10分钟前', type: 'success', icon: 'Check' },
  { id: 4, content: '更新了敌人系统预览', time: '15分钟前', type: 'primary', icon: 'Refresh' }
])

const tips = [
  { 
    title: '数据覆盖链', 
    content: '贴图 → metadata → ENEMY_TYPES → 运行时', 
    icon: 'Link', 
    color: '#409EFF' 
  },
  { 
    title: '锚点规则', 
    content: '所有设计默认以 CENTER 为锚点，非脚底', 
    icon: 'Location', 
    color: '#E6A23C' 
  },
  { 
    title: '快捷键', 
    content: 'Ctrl+S 保存, Ctrl+F 搜索, Ctrl+R 刷新', 
    icon: 'Key', 
    color: '#67C23A' 
  },
  { 
    title: '自动备份', 
    content: '每次保存自动创建备份在 backup/ 目录', 
    icon: 'Collection', 
    color: '#8E44AD' 
  }
]

const refreshData = () => {
  dataStore.loadAllData()
}

onMounted(() => {
  dataStore.loadAllData()
})
</script>

<style lang="scss" scoped>
.home-page {
  padding: 20px;
}

.welcome-section {
  text-align: center;
  margin-bottom: 30px;
  
  h1 {
    font-size: 32px;
    margin-bottom: 8px;
    color: #303133;
  }
  
  .subtitle {
    font-size: 14px;
    color: #909399;
    margin-bottom: 12px;
  }
  
  .description {
    font-size: 16px;
    color: #606266;
  }
}

.quick-access {
  margin-bottom: 24px;
}

.access-card {
  cursor: pointer;
  transition: all 0.3s;
  height: 160px;
  
  &:hover {
    transform: translateY(-4px);
  }
  
  &.is-new {
    border: 2px solid #F56C6C;
  }
  
  .card-content {
    text-align: center;
    position: relative;
    
    h3 {
      margin: 12px 0 8px;
      font-size: 16px;
    }
    
    p {
      margin: 0;
      font-size: 13px;
      color: #909399;
    }
    
    .new-tag {
      position: absolute;
      top: -8px;
      right: -8px;
    }
  }
}

.data-overview {
  margin-bottom: 24px;
}

.stats-card, .status-card {
  height: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  
  .stat-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .stat-info {
    .stat-value {
      font-size: 24px;
      font-weight: bold;
      color: #303133;
    }
    
    .stat-name {
      font-size: 13px;
      color: #909399;
    }
  }
}

.status-list {
  .status-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid #ebeef5;
    
    &:last-child {
      border-bottom: none;
    }
    
    .status-name {
      color: #606266;
    }
  }
}

.activity-card, .tips-card {
  margin-bottom: 24px;
}

.tip-item {
  display: flex;
  gap: 12px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 12px;
  
  .tip-content {
    h4 {
      margin: 0 0 4px;
      font-size: 14px;
    }
    
    p {
      margin: 0;
      font-size: 13px;
      color: #909399;
    }
  }
}
</style>
