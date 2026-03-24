<template>
  <div class="enemies-page">
    <h1>敌人系统编辑器 (Enemy System Editor)</h1>
    
    <div class="editor-layout">
      <!-- 左侧：敌人列表 -->
      <div class="enemy-list-panel">
        <el-input
          v-model="searchQuery"
          placeholder="搜索敌人 (Search enemy)..."
          prefix-icon="Search"
          clearable
          class="search-input"
        />
        
        <div class="tier-tabs">
          <div
            v-for="tier in [1, 2, 3, 4]"
            :key="tier"
            class="tier-tab"
            :class="{ active: selectedTier === tier }"
            @click="selectedTier = tier"
          >
            <el-tag :type="getTierType(tier)" size="small">T{{ tier }}</el-tag>
            <span>{{ getTierName(tier) }}</span>
          </div>
        </div>
        
        <el-scrollbar class="enemy-list">
          <div
            v-for="enemy in filteredEnemies"
            :key="enemy.key"
            class="enemy-item"
            :class="{ active: selectedEnemy === enemy.key }"
            @click="selectEnemy(enemy.key)"
          >
            <img 
              :src="getSpritePath(enemy.sprite)" 
              class="enemy-thumb"
              @error="$event.target.src = '/placeholder.png'"
            />
            <div class="enemy-info">
              <div class="enemy-name">{{ enemy.name }}</div>
              <div class="enemy-key">{{ enemy.key }}</div>
            </div>
            <div class="enemy-size">
              <small>size: {{ enemy.size }}</small>
            </div>
          </div>
        </el-scrollbar>
      </div>
      
      <!-- 中间：可视化预览 -->
      <div class="preview-panel">
        <h3>可视化预览 (Visual Preview)</h3>
        <div class="preview-canvas" ref="previewCanvas">
          <div v-if="currentEnemy" class="preview-content">
            <img 
              :src="getSpritePath(currentEnemy.sprite)" 
              class="preview-sprite"
              :style="{ width: previewSize + 'px' }"
            />
            <div class="preview-info">
              <div>贴图原始: {{ spriteInfo.width }}x{{ spriteInfo.height }}</div>
              <div>配置size: {{ currentEnemy.size }}</div>
              <div>Tier倍率: {{ getTierMultiplier(currentEnemy.tier) }}</div>
              <div class="highlight">最终渲染: {{ Math.round(currentEnemy.size * getTierMultiplier(currentEnemy.tier)) }}px</div>
            </div>
          </div>
          <div v-else class="empty-preview">选择敌人查看预览</div>
        </div>
        
        <!-- 数据覆盖链 -->
        <el-card v-if="currentEnemy" class="data-chain">
          <template #header>数据覆盖链 (Data Override Chain)</template>
          <div class="chain-flow">
            <div class="chain-step">
              <div class="step-title">贴图文件 (Sprite)</div>
              <code>assets/sprites/{{ currentEnemy.sprite }}.png</code>
              <div class="step-value">{{ spriteInfo.width }}x{{ spriteInfo.height }}px</div>
            </div>
            <div class="chain-arrow">→</div>
            <div class="chain-step">
              <div class="step-title">元数据 (Metadata)</div>
              <code>metadata.json bounds</code>
              <div class="step-value">{{ spriteInfo.bounds?.width }}x{{ spriteInfo.bounds?.height }}</div>
            </div>
            <div class="chain-arrow">→</div>
            <div class="chain-step highlight">
              <div class="step-title">ENEMY_TYPES</div>
              <code>data/enemies/index.js</code>
              <div class="step-value">size: {{ currentEnemy.size }}</div>
            </div>
            <div class="chain-arrow">→</div>
            <div class="chain-step">
              <div class="step-title">运行时计算 (Runtime)</div>
              <code>Enemy.getTargetHeight()</code>
              <div class="step-value">{{ Math.round(currentEnemy.size * getTierMultiplier(currentEnemy.tier)) }}px</div>
            </div>
          </div>
        </el-card>
      </div>
      
      <!-- 右侧：属性编辑 -->
      <div class="properties-panel" v-if="currentEnemy">
        <h3>属性编辑 (Properties)</h3>
        <el-form label-position="top" size="small">
          <el-form-item label="名称 (Name)">
            <el-input v-model="currentEnemy.name" />
          </el-form-item>
          
          <el-form-item label="贴图 (Sprite)">
            <el-select v-model="currentEnemy.sprite" style="width: 100%">
              <el-option
                v-for="(meta, key) in dataStore.spriteMetadata"
                :key="key"
                :label="`${key} (${meta.bounds?.width}x${meta.bounds?.height})`"
                :value="key"
              />
            </el-select>
          </el-form-item>
          
          <el-form-item label="尺寸 (Size)">
            <el-slider v-model="currentEnemy.size" :min="10" :max="100" show-input />
            <div class="size-hint">
              推荐值: 微型20 小型32 中型42 大型55
            </div>
          </el-form-item>
          
          <el-form-item label="等级 (Tier)">
            <el-radio-group v-model="currentEnemy.tier">
              <el-radio-button :label="1">T1</el-radio-button>
              <el-radio-button :label="2">T2</el-radio-button>
              <el-radio-button :label="3">T3</el-radio-button>
              <el-radio-button :label="4">T4</el-radio-button>
            </el-radio-group>
          </el-form-item>
          
          <el-form-item label="生命值 (HP)">
            <el-input-number v-model="currentEnemy.hp" :min="1" />
          </el-form-item>
          
          <el-form-item label="速度 (Speed)">
            <el-input-number v-model="currentEnemy.speed" :min="10" />
          </el-form-item>
          
          <el-form-item label="伤害 (Damage)">
            <el-input-number v-model="currentEnemy.dmg" :min="1" />
          </el-form-item>
          
          <el-form-item label="动画类型 (Animation)">
            <el-select v-model="currentEnemy.anim" style="width: 100%">
              <el-option label="跳跃 (hop)" value="hop" />
              <el-option label="行走 (walk)" value="walk" />
              <el-option label="飞行 (fly)" value="fly" />
              <el-option label="滑行 (slide)" value="slide" />
              <el-option label="爬行 (crawl)" value="crawl" />
            </el-select>
          </el-form-item>
          
          <el-form-item>
            <el-button type="primary" @click="saveEnemy">保存修改 (Save)</el-button>
            <el-button @click="resetEnemy">重置 (Reset)</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { useDataStore } from '../stores/dataStore'

const dataStore = useDataStore()
const searchQuery = ref('')
const selectedTier = ref(1)
const selectedEnemy = ref(null)

const filteredEnemies = computed(() => {
  let list = dataStore.enemyList.filter(e => e.tier === selectedTier.value)
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(e => 
      e.key.toLowerCase().includes(q) || 
      e.name.toLowerCase().includes(q)
    )
  }
  return list
})

const currentEnemy = computed(() => {
  if (!selectedEnemy.value) return null
  return dataStore.enemyTypes[selectedEnemy.value]
})

const spriteInfo = computed(() => {
  if (!currentEnemy.value) return {}
  return dataStore.spriteMetadata[currentEnemy.value.sprite] || {}
})

const previewSize = computed(() => {
  if (!currentEnemy.value) return 100
  return currentEnemy.value.size * getTierMultiplier(currentEnemy.value.tier)
})

const selectEnemy = (key) => {
  selectedEnemy.value = key
}

const getSpritePath = (sprite) => {
  return `../../../assets/sprites/${sprite}.png`
}

const getTierType = (tier) => {
  const types = { 1: '', 2: 'success', 3: 'warning', 4: 'danger' }
  return types[tier]
}

const getTierName = (tier) => {
  const names = { 1: '普通', 2: '精英', 3: 'Boss', 4: '最终Boss' }
  return names[tier]
}

const getTierMultiplier = (tier) => {
  const multipliers = { 1: 1.0, 2: 1.3, 3: 1.6, 4: 2.0 }
  return multipliers[tier] || 1.0
}

const saveEnemy = () => {
  if (!currentEnemy.value) return
  
  // 更新 store 中的数据
  dataStore.enemyTypes[selectedEnemy.value] = { ...currentEnemy.value }
  
  // 导出为文件（下载）
  dataStore.exportData('enemies', dataStore.enemyTypes)
  
  ElMessage.success('已导出 enemies.js，请将其复制到 data/enemies/ 目录')
}

const resetEnemy = () => {
  dataStore.loadAllData()
  ElMessage.info('数据已重置')
}
</script>

<style lang="scss" scoped>
.enemies-page {
  h1 {
    color: #fff;
    margin-bottom: 24px;
  }
}

.editor-layout {
  display: grid;
  grid-template-columns: 280px 1fr 320px;
  gap: 20px;
  height: calc(100vh - 140px);
}

.enemy-list-panel {
  background: #1a1a2e;
  border: 1px solid #2a2a4e;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  
  .search-input {
    padding: 12px;
    :deep(.el-input__wrapper) {
      background: #0f0f1e;
    }
  }
  
  .tier-tabs {
    display: flex;
    gap: 8px;
    padding: 0 12px 12px;
    border-bottom: 1px solid #2a2a4e;
    
    .tier-tab {
      flex: 1;
      padding: 8px;
      text-align: center;
      cursor: pointer;
      border-radius: 4px;
      background: #0f0f1e;
      transition: all 0.2s;
      
      span {
        display: block;
        font-size: 11px;
        color: #888;
        margin-top: 4px;
      }
      
      &:hover, &.active {
        background: #16213e;
      }
    }
  }
  
  .enemy-list {
    flex: 1;
    
    .enemy-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      cursor: pointer;
      border-bottom: 1px solid #2a2a4e;
      transition: background 0.2s;
      
      &:hover, &.active {
        background: #16213e;
      }
      
      .enemy-thumb {
        width: 32px;
        height: 32px;
        object-fit: contain;
      }
      
      .enemy-info {
        flex: 1;
        
        .enemy-name {
          color: #fff;
          font-size: 13px;
        }
        
        .enemy-key {
          color: #666;
          font-size: 11px;
        }
      }
      
      .enemy-size {
        color: #888;
      }
    }
  }
}

.preview-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  
  h3 {
    color: #fff;
    margin: 0;
  }
  
  .preview-canvas {
    background: #1a1a2e;
    border: 2px dashed #3a3a5e;
    border-radius: 8px;
    min-height: 300px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .preview-content {
      text-align: center;
      padding: 40px;
      
      .preview-sprite {
        image-rendering: pixelated;
        margin-bottom: 20px;
      }
      
      .preview-info {
        color: #888;
        font-size: 13px;
        line-height: 1.8;
        
        .highlight {
          color: #409EFF;
          font-weight: bold;
          font-size: 16px;
          margin-top: 8px;
        }
      }
    }
    
    .empty-preview {
      color: #666;
    }
  }
}

.data-chain {
  background: #1a1a2e;
  border: 1px solid #2a2a4e;
  
  .chain-flow {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
    
    .chain-step {
      background: #0f0f1e;
      border: 1px solid #3a3a5e;
      border-radius: 6px;
      padding: 12px;
      min-width: 120px;
      
      &.highlight {
        border-color: #409EFF;
        background: #16213e;
      }
      
      .step-title {
        font-size: 11px;
        color: #888;
        margin-bottom: 4px;
      }
      
      code {
        display: block;
        color: #E6A23C;
        font-size: 11px;
        margin-bottom: 4px;
      }
      
      .step-value {
        color: #fff;
        font-weight: bold;
      }
    }
    
    .chain-arrow {
      color: #666;
      font-size: 20px;
    }
  }
}

.properties-panel {
  background: #1a1a2e;
  border: 1px solid #2a2a4e;
  border-radius: 8px;
  padding: 16px;
  overflow-y: auto;
  
  h3 {
    color: #fff;
    margin: 0 0 16px 0;
  }
  
  :deep(.el-form-item__label) {
    color: #aaa;
  }
  
  .size-hint {
    font-size: 11px;
    color: #666;
    margin-top: 4px;
  }
}
</style>
