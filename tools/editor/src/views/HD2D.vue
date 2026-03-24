<template>
  <div class="hd2d-page">
    <div class="page-header">
      <h2>🎨 HD-2D 渲染效果</h2>
      <div class="header-actions">
        <el-button @click="resetToDefault">
          <el-icon><RefreshLeft /></el-icon>
          重置默认
        </el-button>
        <el-button type="primary" @click="saveChanges" :loading="saving">
          <el-icon><Check /></el-icon>
          应用效果
        </el-button>
      </div>
    </div>

    <el-row :gutter="20">
      <!-- 预览区 -->
      <el-col :span="12">
        <el-card class="preview-card">
          <template #header>
            <div class="card-header">
              <span>👁️ 实时预览</span>
              <el-radio-group v-model="previewMode" size="small">
                <el-radio-button label="enemy">敌人</el-radio-button>
                <el-radio-button label="player">玩家</el-radio-button>
                <el-radio-button label="boss">Boss</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          
          <div class="preview-canvas" ref="previewCanvas">
            <div 
              class="preview-entity"
              :class="previewMode"
              :style="entityStyle"
            >
              <div class="entity-sprite">
                <el-icon :size="previewMode === 'boss' ? 80 : 48">
                  <User v-if="previewMode === 'enemy'" />
                  <UserFilled v-else-if="previewMode === 'player'" />
                  <FirstAidKit v-else />
                </el-icon>
              </div>
              <div class="backlight" :style="backlightStyle"></div>
              <div class="shadow" :style="shadowStyle"></div>
              <div class="outline" :style="outlineStyle"></div>
            </div>
            <div class="ground-line"></div>
          </div>

          <div class="layer-toggles">
            <el-checkbox v-model="showBacklight">边缘光</el-checkbox>
            <el-checkbox v-model="showShadow">阴影</el-checkbox>
            <el-checkbox v-model="showOutline">描边</el-checkbox>
            <el-checkbox v-model="showBloom">泛光</el-checkbox>
          </div>
        </el-card>

        <!-- 预设方案 -->
        <el-card class="presets-card" style="margin-top: 20px">
          <template #header>
            <span>💾 预设方案</span>
          </template>
          <div class="preset-list">
            <el-tag
              v-for="preset in presets"
              :key="preset.name"
              class="preset-tag"
              :type="currentPreset === preset.name ? 'primary' : ''"
              @click="loadPreset(preset)"
            >
              {{ preset.name }}
            </el-tag>
          </div>
        </el-card>
      </el-col>

      <!-- 参数调整 -->
      <el-col :span="12">
        <el-tabs v-model="activeTab">
          <!-- 边缘光 -->
          <el-tab-pane label="✨ 边缘光" name="backlight">
            <el-form label-width="120px">
              <el-form-item label="启用">
                <el-switch v-model="config.backlight.enabled" />
              </el-form-item>
              <el-form-item label="颜色">
                <el-color-picker v-model="config.backlight.color" show-alpha />
              </el-form-item>
              <el-form-item label="强度">
                <el-slider v-model="config.backlight.intensity" :max="100" />
                <span class="value-display">{{ config.backlight.intensity }}%</span>
              </el-form-item>
              <el-form-item label="模糊度">
                <el-slider v-model="config.backlight.blur" :max="50" />
                <span class="value-display">{{ config.backlight.blur }}px</span>
              </el-form-item>
              <el-form-item label="偏移X">
                <el-slider v-model="config.backlight.offsetX" :min="-50" :max="50" />
                <span class="value-display">{{ config.backlight.offsetX }}px</span>
              </el-form-item>
              <el-form-item label="偏移Y">
                <el-slider v-model="config.backlight.offsetY" :min="-50" :max="50" />
                <span class="value-display">{{ config.backlight.offsetY }}px</span>
              </el-form-item>
            </el-form>
          </el-tab-pane>

          <!-- 阴影 -->
          <el-tab-pane label="🌑 阴影" name="shadow">
            <el-form label-width="120px">
              <el-form-item label="启用">
                <el-switch v-model="config.shadow.enabled" />
              </el-form-item>
              <el-form-item label="颜色">
                <el-color-picker v-model="config.shadow.color" show-alpha />
              </el-form-item>
              <el-form-item label="透明度">
                <el-slider v-model="config.shadow.opacity" :max="100" />
                <span class="value-display">{{ config.shadow.opacity }}%</span>
              </el-form-item>
              <el-form-item label="模糊度">
                <el-slider v-model="config.shadow.blur" :max="50" />
                <span class="value-display">{{ config.shadow.blur }}px</span>
              </el-form-item>
              <el-form-item label="偏移X">
                <el-slider v-model="config.shadow.offsetX" :min="-50" :max="50" />
                <span class="value-display">{{ config.shadow.offsetX }}px</span>
              </el-form-item>
              <el-form-item label="偏移Y">
                <el-slider v-model="config.shadow.offsetY" :min="-50" :max="50" />
                <span class="value-display">{{ config.shadow.offsetY }}px</span>
              </el-form-item>
            </el-form>
          </el-tab-pane>

          <!-- 描边 -->
          <el-tab-pane label="🖊️ 描边" name="outline">
            <el-form label-width="120px">
              <el-form-item label="启用">
                <el-switch v-model="config.outline.enabled" />
              </el-form-item>
              <el-form-item label="宽度">
                <el-slider v-model="config.outline.width" :max="10" :step="0.5" />
                <span class="value-display">{{ config.outline.width }}px</span>
              </el-form-item>
              <el-form-item label="颜色模式">
                <el-radio-group v-model="config.outline.colorMode">
                  <el-radio-button label="tier">按等级</el-radio-button>
                  <el-radio-button label="custom">自定义</el-radio-button>
                </el-radio-group>
              </el-form-item>
              <el-form-item label="自定义颜色" v-if="config.outline.colorMode === 'custom'">
                <el-color-picker v-model="config.outline.color" />
              </el-form-item>
            </el-form>

            <!-- 等级颜色配置 -->
            <div v-if="config.outline.colorMode === 'tier'" class="tier-colors">
              <h4>等级描边颜色</h4>
              <el-row :gutter="16">
                <el-col :span="12" v-for="tier in tierColors" :key="tier.level">
                  <div class="tier-color-item">
                    <span>T{{ tier.level }} - {{ tier.name }}</span>
                    <el-color-picker v-model="tier.color" size="small" />
                  </div>
                </el-col>
              </el-row>
            </div>
          </el-tab-pane>

          <!-- 泛光 -->
          <el-tab-pane label="💡 泛光" name="bloom">
            <el-form label-width="120px">
              <el-form-item label="启用">
                <el-switch v-model="config.bloom.enabled" />
              </el-form-item>
              <el-form-item label="强度">
                <el-slider v-model="config.bloom.intensity" :max="100" />
                <span class="value-display">{{ config.bloom.intensity }}%</span>
              </el-form-item>
              <el-form-item label="半径">
                <el-slider v-model="config.bloom.radius" :max="100" />
                <span class="value-display">{{ config.bloom.radius }}px</span>
              </el-form-item>
              <el-form-item label="阈值">
                <el-slider v-model="config.bloom.threshold" :max="100" />
                <span class="value-display">{{ config.bloom.threshold }}%</span>
              </el-form-item>
            </el-form>
          </el-tab-pane>
        </el-tabs>
      </el-col>
    </el-row>

    <!-- 代码导出 -->
    <el-card class="code-export" style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>📋 导出代码</span>
          <el-button text @click="copyCode">
            <el-icon><CopyDocument /></el-icon>
            复制
          </el-button>
        </div>
      </template>
      <pre><code>{{ exportCode }}</code></pre>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { ElMessage } from 'element-plus'

const previewMode = ref('enemy')
const activeTab = ref('backlight')
const saving = ref(false)
const currentPreset = ref('默认')

const showBacklight = ref(true)
const showShadow = ref(true)
const showOutline = ref(true)
const showBloom = ref(true)

const config = reactive({
  backlight: {
    enabled: true,
    color: '#409EFF',
    intensity: 60,
    blur: 20,
    offsetX: 0,
    offsetY: -10
  },
  shadow: {
    enabled: true,
    color: '#000000',
    opacity: 40,
    blur: 15,
    offsetX: 5,
    offsetY: 10
  },
  outline: {
    enabled: true,
    width: 2,
    colorMode: 'tier',
    color: '#FFFFFF'
  },
  bloom: {
    enabled: true,
    intensity: 30,
    radius: 50,
    threshold: 60
  }
})

const tierColors = ref([
  { level: 1, name: '普通', color: '#909399' },
  { level: 2, name: '精英', color: '#67C23A' },
  { level: 3, name: '稀有', color: '#E6A23C' },
  { level: 4, name: 'Boss', color: '#F56C6C' }
])

const presets = [
  { 
    name: '默认', 
    config: JSON.parse(JSON.stringify(config))
  },
  { 
    name: '高对比度', 
    config: {
      ...JSON.parse(JSON.stringify(config)),
      backlight: { ...config.backlight, intensity: 80 },
      outline: { ...config.outline, width: 3 }
    }
  },
  { 
    name: '柔和', 
    config: {
      ...JSON.parse(JSON.stringify(config)),
      backlight: { ...config.backlight, intensity: 40, blur: 30 },
      shadow: { ...config.shadow, opacity: 25, blur: 25 }
    }
  },
  { 
    name: '复古', 
    config: {
      ...JSON.parse(JSON.stringify(config)),
      backlight: { enabled: false },
      bloom: { enabled: false }
    }
  }
]

const entityStyle = computed(() => ({
  filter: showBloom.value ? `brightness(${1 + config.bloom.intensity / 200})` : 'none'
}))

const backlightStyle = computed(() => ({
  background: config.backlight.color,
  opacity: showBacklight.value && config.backlight.enabled ? config.backlight.intensity / 100 : 0,
  filter: `blur(${config.backlight.blur}px)`,
  transform: `translate(${config.backlight.offsetX}px, ${config.backlight.offsetY}px)`
}))

const shadowStyle = computed(() => ({
  background: config.shadow.color,
  opacity: showShadow.value && config.shadow.enabled ? config.shadow.opacity / 100 : 0,
  filter: `blur(${config.shadow.blur}px)`,
  transform: `translate(${config.shadow.offsetX}px, ${config.shadow.offsetY}px)`
}))

const outlineStyle = computed(() => {
  const tierColor = tierColors.value.find(t => t.level === 2)?.color || '#67C23A'
  const color = config.outline.colorMode === 'tier' ? tierColor : config.outline.color
  return {
    border: showOutline.value && config.outline.enabled 
      ? `${config.outline.width}px solid ${color}` 
      : 'none',
    boxShadow: showOutline.value && config.outline.enabled 
      ? `0 0 ${config.outline.width * 2}px ${color}` 
      : 'none'
  }
})

const exportCode = computed(() => `// HD-2D 渲染配置
const HD2D_CONFIG = {
  backlight: {
    enabled: ${config.backlight.enabled},
    color: '${config.backlight.color}',
    intensity: ${config.backlight.intensity / 100},
    blur: ${config.backlight.blur},
    offset: { x: ${config.backlight.offsetX}, y: ${config.backlight.offsetY} }
  },
  shadow: {
    enabled: ${config.shadow.enabled},
    color: '${config.shadow.color}',
    opacity: ${config.shadow.opacity / 100},
    blur: ${config.shadow.blur},
    offset: { x: ${config.shadow.offsetX}, y: ${config.shadow.offsetY} }
  },
  outline: {
    enabled: ${config.outline.enabled},
    width: ${config.outline.width},
    colorMode: '${config.outline.colorMode}',
    tierColors: {
      1: '${tierColors.value[0].color}',
      2: '${tierColors.value[1].color}',
      3: '${tierColors.value[2].color}',
      4: '${tierColors.value[3].color}'
    }
  },
  bloom: {
    enabled: ${config.bloom.enabled},
    intensity: ${config.bloom.intensity / 100},
    radius: ${config.bloom.radius},
    threshold: ${config.bloom.threshold / 100}
  }
};`)

const loadPreset = (preset) => {
  currentPreset.value = preset.name
  Object.assign(config, JSON.parse(JSON.stringify(preset.config)))
  ElMessage.success(`已加载预设: ${preset.name}`)
}

const resetToDefault = () => {
  loadPreset(presets[0])
}

const saveChanges = async () => {
  saving.value = true
  try {
    const success = await dataStore.saveHD2DConfig(config)
    if (success) {
      ElMessage.success('配置已保存')
    } else {
      ElMessage.error('保存失败')
    }
  } finally {
    saving.value = false
  }
}

const copyCode = () => {
  navigator.clipboard.writeText(exportCode.value)
  ElMessage.success('代码已复制到剪贴板')
}
</script>

<style lang="scss" scoped>
.hd2d-page {
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

.preview-canvas {
  height: 300px;
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  
  .preview-entity {
    position: relative;
    width: 80px;
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    
    &.player { color: #67C23A; }
    &.boss { color: #F56C6C; transform: scale(1.5); }
    
    .entity-sprite {
      position: relative;
      z-index: 2;
    }
    
    .backlight, .shadow, .outline {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      transition: all 0.3s;
    }
    
    .backlight { z-index: 0; }
    .shadow { z-index: 0; border-radius: 40%; }
    .outline { z-index: 3; border-radius: 8px; pointer-events: none; }
  }
  
  .ground-line {
    position: absolute;
    bottom: 80px;
    left: 20%;
    right: 20%;
    height: 1px;
    background: linear-gradient(90deg, transparent, #409EFF, transparent);
    opacity: 0.5;
  }
}

.layer-toggles {
  margin-top: 16px;
  display: flex;
  justify-content: center;
  gap: 24px;
}

.presets-card {
  .preset-list {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    
    .preset-tag {
      cursor: pointer;
      
      &:hover {
        background: #409EFF;
        color: white;
      }
    }
  }
}

.value-display {
  margin-left: 12px;
  min-width: 60px;
  text-align: right;
  color: #606266;
}

.tier-colors {
  margin-top: 24px;
  padding: 16px;
  background: #f5f7fa;
  border-radius: 8px;
  
  h4 {
    margin-bottom: 16px;
  }
  
  .tier-color-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    
    span {
      font-size: 14px;
    }
  }
}

.code-export {
  pre {
    margin: 0;
    padding: 16px;
    background: #2d2d2d;
    color: #ccc;
    border-radius: 8px;
    overflow-x: auto;
    font-size: 13px;
    line-height: 1.6;
  }
}
</style>
