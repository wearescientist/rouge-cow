<template>
  <div class="audio-page">
    <div class="page-header">
      <h2>🔊 音效系统</h2>
      <div class="header-actions">
        <el-button @click="stopAllSounds">
          <el-icon><VideoPause /></el-icon>
          停止全部
        </el-button>
        <el-button type="primary" @click="saveChanges" :loading="saving">
          <el-icon><Check /></el-icon>
          保存修改
        </el-button>
      </div>
    </div>

    <el-row :gutter="20">
      <!-- 音频列表 -->
      <el-col :span="10">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>音频文件</span>
              <el-radio-group v-model="filterCategory" size="small">
                <el-radio-button label="all">全部</el-radio-button>
                <el-radio-button label="bgm">BGM</el-radio-button>
                <el-radio-button label="sfx">音效</el-radio-button>
                <el-radio-button label="ui">UI</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          
          <el-input
            v-model="searchText"
            placeholder="搜索音频..."
            clearable
            style="margin-bottom: 16px"
          >
            <template #prefix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>

          <div class="audio-list">
            <div
              v-for="audio in filteredAudioFiles"
              :key="audio.id"
              class="audio-item"
              :class="{ active: selectedAudio?.id === audio.id }"
              @click="selectAudio(audio)"
            >
              <el-icon :size="20">
                <Headset v-if="audio.category === 'bgm'" />
                <Bell v-else-if="audio.category === 'sfx'" />
                <Mouse v-else />
              </el-icon>
              <div class="audio-info">
                <span class="audio-name">{{ audio.name }}</span>
                <span class="audio-meta">{{ audio.duration }}s · {{ audio.format }}</span>
              </div>
              <el-button 
                circle 
                size="small"
                :type="isPlaying(audio.id) ? 'danger' : 'primary'"
                @click.stop="togglePlay(audio)"
              >
                <el-icon>
                  <VideoPause v-if="isPlaying(audio.id)" />
                  <VideoPlay v-else />
                </el-icon>
              </el-button>
            </div>
          </div>
        </el-card>
      </el-col>

      <!-- 音频详情 -->
      <el-col :span="14" v-if="selectedAudio">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>{{ selectedAudio.name }}</span>
              <el-tag :type="getCategoryTag(selectedAudio.category)">
                {{ selectedAudio.category?.toUpperCase() }}
              </el-tag>
            </div>
          </template>

          <el-form :model="selectedAudio" label-width="100px">
            <el-form-item label="音量">
              <el-slider 
                v-model="selectedAudio.volume" 
                :max="100"
                show-stops
                :format-tooltip="v => v + '%'"
              />
              <span class="volume-value">{{ selectedAudio.volume }}%</span>
            </el-form-item>

            <el-form-item label="循环播放">
              <el-switch v-model="selectedAudio.loop" />
            </el-form-item>

            <el-form-item label="淡入时间">
              <el-input-number 
                v-model="selectedAudio.fadeIn" 
                :min="0" 
                :max="5000"
                :step="100"
              >
                <template #suffix>ms</template>
              </el-input-number>
            </el-form-item>

            <el-form-item label="淡出时间">
              <el-input-number 
                v-model="selectedAudio.fadeOut" 
                :min="0" 
                :max="5000"
                :step="100"
              >
                <template #suffix>ms</template>
              </el-input-number>
            </el-form-item>

            <el-form-item label="音调">
              <el-slider 
                v-model="selectedAudio.pitch" 
                :min="0.5"
                :max="2"
                :step="0.1"
                show-stops
              />
              <span class="pitch-value">{{ selectedAudio.pitch }}x</span>
            </el-form-item>
          </el-form>

          <!-- 波形预览区域 -->
          <div class="waveform-preview">
            <h4>波形预览</h4>
            <div class="waveform-placeholder">
              <el-icon :size="48"><DataLine /></el-icon>
              <p>音频波形可视化</p>
            </div>
          </div>

          <!-- 使用位置 -->
          <div class="usage-section" v-if="selectedAudio.usedIn?.length">
            <h4>📍 使用位置</h4>
            <el-tag 
              v-for="location in selectedAudio.usedIn" 
              :key="location"
              class="usage-tag"
            >
              {{ location }}
            </el-tag>
          </div>
        </el-card>
      </el-col>

      <el-col :span="14" v-else>
        <el-empty description="请从左侧选择一个音频文件" />
      </el-col>
    </el-row>

    <!-- 全局设置 -->
    <el-card class="global-settings" style="margin-top: 20px">
      <template #header>
        <span>⚙️ 全局音频设置</span>
      </template>
      <el-row :gutter="40">
        <el-col :span="8">
          <div class="setting-item">
            <span>主音量</span>
            <el-slider v-model="globalSettings.masterVolume" :max="100" />
            <span class="setting-value">{{ globalSettings.masterVolume }}%</span>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="setting-item">
            <span>BGM音量</span>
            <el-slider v-model="globalSettings.bgmVolume" :max="100" />
            <span class="setting-value">{{ globalSettings.bgmVolume }}%</span>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="setting-item">
            <span>SFX音量</span>
            <el-slider v-model="globalSettings.sfxVolume" :max="100" />
            <span class="setting-value">{{ globalSettings.sfxVolume }}%</span>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useDataStore } from '../stores/dataStore'
import { ElMessage } from 'element-plus'

const dataStore = useDataStore()

const selectedAudio = ref(null)
const filterCategory = ref('all')
const searchText = ref('')
const saving = ref(false)
const playingAudioId = ref(null)

const globalSettings = ref({
  masterVolume: 80,
  bgmVolume: 70,
  sfxVolume: 85
})

const filteredAudioFiles = computed(() => {
  let list = dataStore.audioFiles
  
  if (filterCategory.value !== 'all') {
    list = list.filter(a => a.category === filterCategory.value)
  }
  
  if (searchText.value) {
    const lower = searchText.value.toLowerCase()
    list = list.filter(a => 
      a.name?.toLowerCase().includes(lower) ||
      a.id?.toLowerCase().includes(lower)
    )
  }
  
  return list
})

const selectAudio = (audio) => {
  selectedAudio.value = audio
}

const isPlaying = (id) => {
  return playingAudioId.value === id
}

const togglePlay = (audio) => {
  if (isPlaying(audio.id)) {
    playingAudioId.value = null
    ElMessage.info('停止播放: ' + audio.name)
  } else {
    playingAudioId.value = audio.id
    ElMessage.success('开始播放: ' + audio.name)
    // 模拟播放结束
    setTimeout(() => {
      if (!audio.loop) {
        playingAudioId.value = null
      }
    }, 3000)
  }
}

const stopAllSounds = () => {
  playingAudioId.value = null
  ElMessage.info('已停止所有音频')
}

const getCategoryTag = (category) => {
  const map = {
    bgm: 'success',
    sfx: 'warning',
    ui: 'info'
  }
  return map[category] || ''
}

const saveChanges = () => {
  dataStore.exportData('audio', dataStore.audioFiles)
  ElMessage.success('已导出 audio.json')
}

onMounted(() => {
  if (dataStore.audioFiles.length === 0) {
    // 模拟加载音频数据
    dataStore.audioFiles = [
      { id: 'bgm_battle', name: '战斗BGM', category: 'bgm', volume: 70, loop: true, duration: 120, format: 'mp3' },
      { id: 'bgm_menu', name: '菜单BGM', category: 'bgm', volume: 60, loop: true, duration: 90, format: 'mp3' },
      { id: 'sfx_shoot', name: '射击音效', category: 'sfx', volume: 85, loop: false, duration: 0.5, format: 'wav' },
      { id: 'sfx_explosion', name: '爆炸音效', category: 'sfx', volume: 90, loop: false, duration: 1.2, format: 'wav' },
      { id: 'ui_click', name: '点击音效', category: 'ui', volume: 75, loop: false, duration: 0.1, format: 'ogg' },
      { id: 'ui_hover', name: '悬停音效', category: 'ui', volume: 50, loop: false, duration: 0.05, format: 'ogg' }
    ]
  }
})
</script>

<style lang="scss" scoped>
.audio-page {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  
  h2 {
    margin: 0;
  }
  
  .header-actions {
    display: flex;
    gap: 12px;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.audio-list {
  max-height: 500px;
  overflow-y: auto;
}

.audio-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: #f5f7fa;
  }
  
  &.active {
    background: #ecf5ff;
    border-left: 3px solid #409EFF;
  }
  
  .audio-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    
    .audio-name {
      font-weight: 500;
    }
    
    .audio-meta {
      font-size: 12px;
      color: #909399;
    }
  }
}

.volume-value, .pitch-value {
  margin-left: 12px;
  min-width: 50px;
  text-align: right;
}

.waveform-preview {
  margin-top: 24px;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  
  h4 {
    margin-bottom: 12px;
  }
  
  .waveform-placeholder {
    height: 100px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: #909399;
    
    p {
      margin-top: 8px;
    }
  }
}

.usage-section {
  margin-top: 20px;
  
  h4 {
    margin-bottom: 12px;
  }
  
  .usage-tag {
    margin-right: 8px;
    margin-bottom: 8px;
  }
}

.global-settings {
  .setting-item {
    display: flex;
    align-items: center;
    gap: 12px;
    
    span:first-child {
      min-width: 80px;
    }
    
    .el-slider {
      flex: 1;
    }
    
    .setting-value {
      min-width: 50px;
      text-align: right;
    }
  }
}
</style>
