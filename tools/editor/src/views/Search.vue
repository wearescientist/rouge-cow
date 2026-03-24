<template>
  <div class="search-page">
    <h2>🔍 全局搜索</h2>
    
    <div class="search-box">
      <el-input
        v-model="searchQuery"
        placeholder="搜索敌人、武器、贴图..."
        size="large"
        clearable
        @keyup.enter="performSearch"
      >
        <template #prefix>
          <el-icon><Search /></el-icon>
        </template>
        <template #append>
          <el-button type="primary" @click="performSearch">
            搜索
          </el-button>
        </template>
      </el-input>
    </div>

    <!-- 搜索结果 -->
    <div v-if="searchResults.length > 0" class="search-results">
      <el-row :gutter="16">
        <el-col 
          v-for="result in searchResults" 
          :key="`${result.type}-${result.key}`"
          :span="8"
          class="result-col"
        >
          <el-card 
            class="result-card"
            shadow="hover"
            @click="goToResult(result)"
          >
            <div class="result-header">
              <el-tag :type="getResultTypeTag(result.type)" size="small">
                {{ getResultTypeLabel(result.type) }}
              </el-tag>
              <span class="result-key">{{ result.key }}</span>
            </div>
            <h4 class="result-name">{{ result.name }}</h4>
            <div class="result-preview" v-if="result.type === 'enemy'">
              <div class="stat-row">
                <span>Size: {{ result.data.size || 'N/A' }}</span>
                <span>Tier: {{ result.data.tier || 'N/A' }}</span>
              </div>
            </div>
            <div class="result-preview" v-else-if="result.type === 'weapon'">
              <div class="stat-row">
                <span>Damage: {{ result.data.damage || 'N/A' }}</span>
                <span>Cooldown: {{ result.data.cooldown || 'N/A' }}</span>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 空状态 -->
    <el-empty 
      v-else-if="hasSearched" 
      description="未找到匹配结果"
    />

    <!-- 快捷搜索 -->
    <div v-if="!hasSearched" class="quick-searches">
      <h3>快速搜索</h3>
      <div class="quick-tags">
        <el-tag
          v-for="tag in quickTags"
          :key="tag"
          class="quick-tag"
          effect="plain"
          @click="searchQuery = tag; performSearch()"
        >
          {{ tag }}
        </el-tag>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useDataStore } from '../stores/dataStore'

const router = useRouter()
const dataStore = useDataStore()

const searchQuery = ref('')
const searchResults = ref([])
const hasSearched = ref(false)

const quickTags = ['snail', 'bear', 'player', 'boss', 'weapon', 'sword', 'gun']

const performSearch = () => {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    hasSearched.value = false
    return
  }
  
  searchResults.value = dataStore.search(searchQuery.value)
  hasSearched.value = true
}

const getResultTypeTag = (type) => {
  const map = {
    enemy: 'danger',
    weapon: 'warning',
    sprite: 'success',
    item: 'info'
  }
  return map[type] || ''
}

const getResultTypeLabel = (type) => {
  const map = {
    enemy: '敌人',
    weapon: '武器',
    sprite: '贴图',
    item: '物品'
  }
  return map[type] || type
}

const goToResult = (result) => {
  const routes = {
    enemy: '/enemies',
    weapon: '/weapons',
    sprite: '/sprites',
    item: '/items'
  }
  
  const route = routes[result.type]
  if (route) {
    router.push({
      path: route,
      query: { highlight: result.key }
    })
  }
}
</script>

<style lang="scss" scoped>
.search-page {
  padding: 20px;
  
  h2 {
    margin-bottom: 24px;
  }
}

.search-box {
  max-width: 600px;
  margin-bottom: 32px;
}

.search-results {
  .result-col {
    margin-bottom: 16px;
  }
  
  .result-card {
    cursor: pointer;
    transition: all 0.3s;
    
    &:hover {
      transform: translateY(-4px);
    }
    
    .result-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 12px;
      
      .result-key {
        font-size: 12px;
        color: #909399;
      }
    }
    
    .result-name {
      margin: 0 0 12px;
      font-size: 16px;
    }
    
    .result-preview {
      .stat-row {
        display: flex;
        gap: 16px;
        font-size: 13px;
        color: #606266;
      }
    }
  }
}

.quick-searches {
  margin-top: 40px;
  
  h3 {
    margin-bottom: 16px;
    color: #606266;
  }
  
  .quick-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    
    .quick-tag {
      cursor: pointer;
      
      &:hover {
        background: #409EFF;
        color: white;
        border-color: #409EFF;
      }
    }
  }
}
</style>
