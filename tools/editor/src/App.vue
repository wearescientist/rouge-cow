<template>
  <div class="app-container">
    <!-- 顶部导航栏 -->
    <header class="top-header">
      <div class="logo">
        <el-icon size="28"><Setting /></el-icon>
        <span>游戏数据总控台 (Game Data Master)</span>
        <small class="version">v1.0.0</small>
      </div>
      <div class="actions">
        <el-button type="primary" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新数据 (Refresh)
        </el-button>
        <el-button type="success" @click="saveAll">
          <el-icon><Check /></el-icon>
          保存全部 (Save All)
        </el-button>
      </div>
    </header>

    <div class="main-layout">
      <!-- 左侧导航 -->
      <aside class="sidebar">
        <el-menu
          :default-active="$route.path"
          router
          class="nav-menu"
          background-color="#16213e"
          text-color="#a0a0a0"
          active-text-color="#409EFF"
        >
          <el-menu-item index="/">
            <el-icon><Odometer /></el-icon>
            <span>总览 (Dashboard)</span>
          </el-menu-item>
          <el-menu-item index="/search">
            <el-icon><Search /></el-icon>
            <span>搜索 (Search)</span>
          </el-menu-item>
          
          <el-sub-menu index="/systems">
            <template #title>
              <el-icon><Cpu /></el-icon>
              <span>游戏系统 (Systems)</span>
            </template>
            <el-menu-item index="/enemies">
              <span>敌人 (Enemies)</span>
            </el-menu-item>
            <el-menu-item index="/weapons">
              <span>武器 (Weapons)</span>
            </el-menu-item>
            <el-menu-item index="/items">
              <span>物品 (Items)</span>
            </el-menu-item>
            <el-menu-item index="/sprites">
              <span>贴图 (Sprites)</span>
            </el-menu-item>
            <el-menu-item index="/audio">
              <span>音效 (Audio)</span>
            </el-menu-item>
            <el-menu-item index="/hd2d">
              <span>HD-2D渲染 (Render)</span>
            </el-menu-item>
            <el-menu-item index="/collision">
              <span>碰撞 (Collision)</span>
            </el-menu-item>
          </el-sub-menu>
          
          <el-menu-item index="/sprite-sync">
            <el-icon><Refresh /></el-icon>
            <span>贴图同步 (Sprite Sync)</span>
          </el-menu-item>
          <el-menu-item index="/quick-fix">
            <el-icon><FirstAidKit /></el-icon>
            <span>一键修复 (Quick Fix)</span>
          </el-menu-item>
          <el-menu-item index="/dependency">
            <el-icon><Share /></el-icon>
            <span>依赖图 (Dependencies)</span>
          </el-menu-item>
          <el-menu-item index="/logs">
            <el-icon><Document /></el-icon>
            <span>修改日志 (Logs)</span>
          </el-menu-item>
          <el-menu-item index="/help">
            <el-icon><QuestionFilled /></el-icon>
            <span>帮助 (Help)</span>
          </el-menu-item>
        </el-menu>

        <!-- 数据状态面板 -->
        <div class="status-panel">
          <h4>数据状态 (Status)</h4>
          <div class="status-item">
            <span class="label">敌人 (Enemies):</span>
            <el-tag size="small">{{ dataStore.enemyList.length }}</el-tag>
          </div>
          <div class="status-item">
            <span class="label">贴图 (Sprites):</span>
            <el-tag size="small">{{ Object.keys(dataStore.spriteMetadata).length }}</el-tag>
          </div>
          <div class="status-item">
            <span class="label">问题 (Issues):</span>
            <el-tag 
              size="small" 
              :type="dataStore.dataInconsistencies.length > 0 ? 'danger' : 'success'"
            >
              {{ dataStore.dataInconsistencies.length }}
            </el-tag>
          </div>
        </div>
      </aside>

      <!-- 主内容区 -->
      <main class="content-area">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </main>
    </div>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { useDataStore } from './stores/dataStore'

const dataStore = useDataStore()

onMounted(() => {
  dataStore.loadAllData()
})

const refreshData = () => {
  dataStore.loadAllData()
}

const saveAll = () => {
  // 保存所有修改
  console.log('保存所有数据')
}
</script>

<style lang="scss" scoped>
.app-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: #0f0f1e;
}

.top-header {
  height: 60px;
  background: linear-gradient(90deg, #1a1a2e 0%, #16213e 100%);
  border-bottom: 1px solid #2a2a4e;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  
  .logo {
    display: flex;
    align-items: center;
    gap: 12px;
    color: #fff;
    font-size: 18px;
    font-weight: 600;
    
    .version {
      color: #888;
      font-size: 12px;
      font-weight: normal;
    }
  }
  
  .actions {
    display: flex;
    gap: 12px;
  }
}

.main-layout {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.sidebar {
  width: 260px;
  background: #16213e;
  border-right: 1px solid #2a2a4e;
  display: flex;
  flex-direction: column;
  
  .nav-menu {
    border-right: none;
    flex: 1;
  }
  
  .status-panel {
    padding: 16px;
    border-top: 1px solid #2a2a4e;
    
    h4 {
      color: #888;
      font-size: 12px;
      margin-bottom: 12px;
      text-transform: uppercase;
    }
    
    .status-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      
      .label {
        color: #aaa;
        font-size: 13px;
      }
    }
  }
}

.content-area {
  flex: 1;
  overflow: auto;
  padding: 24px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
