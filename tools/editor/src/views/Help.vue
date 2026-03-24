<template>
  <div class="help-page">
    <el-page-header title="帮助文档" content="Game Data Master Editor 使用指南" />
    
    <el-row :gutter="20" class="help-content">
      <!-- 左侧导航 -->
      <el-col :span="6">
        <el-card class="nav-card">
          <el-menu
            :default-active="activeSection"
            @select="handleSelect"
            class="help-nav"
          >
            <el-menu-item index="overview">
              <el-icon><InfoFilled /></el-icon>
              <span>系统概览</span>
            </el-menu-item>
            <el-menu-item index="quickstart">
              <el-icon><CircleCheck /></el-icon>
              <span>快速开始</span>
            </el-menu-item>
            <el-menu-item index="enemies">
              <el-icon><User /></el-icon>
              <span>敌人系统</span>
            </el-menu-item>
            <el-menu-item index="weapons">
              <el-icon><Aim /></el-icon>
              <span>武器系统</span>
            </el-menu-item>
            <el-menu-item index="render">
              <el-icon><Picture /></el-icon>
              <span>渲染系统</span>
            </el-menu-item>
            <el-menu-item index="sync">
              <el-icon><Refresh /></el-icon>
              <span>数据同步</span>
            </el-menu-item>
            <el-menu-item index="troubleshooting">
              <el-icon><Warning /></el-icon>
              <span>常见问题</span>
            </el-menu-item>
            <el-menu-item index="shortcuts">
              <el-icon><Key /></el-icon>
              <span>快捷键</span>
            </el-menu-item>
          </el-menu>
        </el-card>
      </el-col>
      
      <!-- 右侧内容 -->
      <el-col :span="18">
        <el-card class="content-card">
          <!-- 系统概览 -->
          <div v-if="activeSection === 'overview'" class="section">
            <h2>🎮 游戏数据总控台</h2>
            <p class="intro">
              这是一个用于管理 <strong>深根之疫 (Rouge Cow)</strong> 游戏数据的可视化编辑器。
              它提供了对所有游戏系统的集中管理，包括敌人、武器、物品、贴图、音效等。
            </p>
            
            <h3>核心功能</h3>
            <el-row :gutter="16">
              <el-col :span="8" v-for="feature in features" :key="feature.name">
                <div class="feature-card">
                  <el-icon :size="32" :color="feature.color">
                    <component :is="feature.icon" />
                  </el-icon>
                  <h4>{{ feature.name }}</h4>
                  <p>{{ feature.desc }}</p>
                </div>
              </el-col>
            </el-row>
            
            <h3>数据来源</h3>
            <el-timeline>
              <el-timeline-item 
                v-for="source in dataSources" 
                :key="source.name"
                :type="source.type"
                :icon="source.icon"
              >
                <h4>{{ source.name }}</h4>
                <p>{{ source.path }}</p>
                <el-tag size="small">{{ source.format }}</el-tag>
              </el-timeline-item>
            </el-timeline>
          </div>
          
          <!-- 快速开始 -->
          <div v-if="activeSection === 'quickstart'" class="section">
            <h2>🚀 快速开始</h2>
            
            <h3>第一步：了解数据链</h3>
            <div class="chain-diagram">
              <div class="chain-item">
                <el-icon><Picture /></el-icon>
                <span>贴图文件</span>
                <small>.png</small>
              </div>
              <el-icon><ArrowRight /></el-icon>
              <div class="chain-item">
                <el-icon><Document /></el-icon>
                <span>元数据</span>
                <small>metadata.json</small>
              </div>
              <el-icon><ArrowRight /></el-icon>
              <div class="chain-item">
                <el-icon><Files /></el-icon>
                <span>类型定义</span>
                <small>ENEMY_TYPES</small>
              </div>
              <el-icon><ArrowRight /></el-icon>
              <div class="chain-item highlight">
                <el-icon><VideoPlay /></el-icon>
                <span>游戏内</span>
                <small>运行时</small>
              </div>
            </div>
            
            <h3>第二步：基本操作</h3>
            <el-steps :active="3" finish-status="success" direction="vertical">
              <el-step title="浏览数据" description="使用左侧导航或全局搜索查找需要编辑的内容" />
              <el-step title="编辑修改" description="在可视化界面中修改数值，实时预览效果" />
              <el-step title="保存同步" description="点击保存按钮，数据自动同步到游戏代码" />
            </el-steps>
            
            <h3>第三步：验证更改</h3>
            <el-alert
              type="info"
              :closable="false"
              show-icon
            >
              <p>修改保存后，刷新游戏页面即可看到最新效果。编辑器会自动创建备份，可随时回滚。</p>
            </el-alert>
          </div>
          
          <!-- 敌人系统 -->
          <div v-if="activeSection === 'enemies'" class="section">
            <h2>👾 敌人系统</h2>
            
            <h3>体型等级系统</h3>
            <el-table :data="sizeTiers" border>
              <el-table-column prop="tier" label="等级" width="80">
                <template #default="{ row }">
                  <el-tag :type="row.tagType">T{{ row.tier }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="name" label="名称" width="100" />
              <el-table-column prop="baseSize" label="基础尺寸" width="100" />
              <el-table-column prop="multiplier" label="倍率" width="80" />
              <el-table-column prop="finalSize" label="最终尺寸" width="100" />
              <el-table-column prop="desc" label="说明" />
            </el-table>
            
            <h3>锚点规则</h3>
            <el-alert type="warning" :closable="false" show-icon class="anchor-alert">
              <template #title>
                <strong>黄金规则：所有设计的锚点默认是人物 CENTER，而不是脚底</strong>
              </template>
              <ul>
                <li>渲染位置基于 center</li>
                <li>碰撞箱基于 center</li>
                <li>边缘光基于 center</li>
                <li>特效发射点基于 center</li>
              </ul>
            </el-alert>
            
            <h3>数据覆盖链</h3>
            <div class="override-chain">
              <div class="override-item">
                <span class="source">贴图 bounds</span>
                <el-icon><ArrowRight /></el-icon>
                <span class="target">metadata.json</span>
              </div>
              <div class="override-item">
                <span class="source">metadata.json</span>
                <el-icon><ArrowRight /></el-icon>
                <span class="target">ENEMY_TYPES.size</span>
              </div>
              <div class="override-item">
                <span class="source">ENEMY_TYPES.size</span>
                <el-icon><ArrowRight /></el-icon>
                <span class="target">getTargetHeight()</span>
              </div>
              <div class="override-item">
                <span class="source">getTargetHeight()</span>
                <el-icon><ArrowRight /></el-icon>
                <span class="target highlight">实际渲染尺寸</span>
              </div>
            </div>
          </div>
          
          <!-- 武器系统 -->
          <div v-if="activeSection === 'weapons'" class="section">
            <h2>⚔️ 武器系统</h2>
            
            <h3>武器属性</h3>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="伤害 (Damage)">单次攻击造成的伤害值</el-descriptions-item>
              <el-descriptions-item label="冷却 (Cooldown)">两次攻击之间的间隔(帧)</el-descriptions-item>
              <el-descriptions-item label="弹速 (Speed)">子弹飞行速度(像素/帧)</el-descriptions-item>
              <el-descriptions-item label="射程 (Range)">子弹最大飞行距离</el-descriptions-item>
              <el-descriptions-item label="穿透 (Pierce)">子弹可穿透的敌人数</el-descriptions-item>
              <el-descriptions-item label="散射 (Spread)">子弹发射角度偏差</el-descriptions-item>
            </el-descriptions>
            
            <h3>升级计算</h3>
            <el-card class="formula-card">
              <div class="formula">
                <p><strong>DPS公式：</strong> DPS = 伤害 × (60 / 冷却) × 投射物数量</p>
                <p><strong>升级成本：</strong> 成本 = 基础成本 × (1.5 ^ 当前等级)</p>
              </div>
            </el-card>
          </div>
          
          <!-- 渲染系统 -->
          <div v-if="activeSection === 'render'" class="section">
            <h2>🎨 HD-2D 渲染系统</h2>
            
            <h3>渲染管线</h3>
            <el-steps direction="vertical" :active="5">
              <el-step title="基础贴图" description="原始精灵图渲染" />
              <el-step title="边缘光 (Backlight)" description="角色背后的发光效果" />
              <el-step title="阴影 (Shadow)" description="角色下方的投影" />
              <el-step title="描边 (Outline)" description="根据等级的彩色边框" />
              <el-step title="泛光 (Bloom)" description="整体光晕效果" />
            </el-steps>
            
            <h3>各等级描边颜色</h3>
            <el-table :data="outlineColors" border>
              <el-table-column prop="tier" label="等级" width="80">
                <template #default="{ row }">
                  <el-tag :type="row.tagType">T{{ row.tier }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="color" label="颜色" width="120">
                <template #default="{ row }">
                  <div class="color-preview" :style="{ background: row.color }"></div>
                </template>
              </el-table-column>
              <el-table-column prop="hex" label="HEX值" />
              <el-table-column prop="desc" label="说明" />
            </el-table>
          </div>
          
          <!-- 数据同步 -->
          <div v-if="activeSection === 'sync'" class="section">
            <h2>🔄 数据同步</h2>
            
            <h3>同步方向</h3>
            <el-radio-group v-model="syncDirection" class="sync-options">
              <el-radio-button label="toCode">
                <el-icon><Download /></el-icon>
                编辑器 → 代码
              </el-radio-button>
              <el-radio-button label="toEditor">
                <el-icon><Upload /></el-icon>
                代码 → 编辑器
              </el-radio-button>
            </el-radio-group>
            
            <h3>自动备份</h3>
            <p>每次保存操作前，系统会自动创建备份文件，保存在 <code>backup/</code> 目录下。</p>
            <el-alert type="success" :closable="false">
              <p>备份文件命名格式：<code>文件名_YYYYMMDD_HHmmss.bak</code></p>
            </el-alert>
          </div>
          
          <!-- 常见问题 -->
          <div v-if="activeSection === 'troubleshooting'" class="section">
            <h2>🔧 常见问题</h2>
            
            <el-collapse>
              <el-collapse-item title="敌人显示异常小/大" name="1">
                <p>检查以下几点：</p>
                <ol>
                  <li>ENEMY_TYPES 中是否正确定义了 size 属性</li>
                  <li>metadata.json 中的 bounds 是否与贴图匹配</li>
                  <li>体型等级倍率是否正确应用</li>
                </ol>
              </el-collapse-item>
              <el-collapse-item title="碰撞检测不生效" name="2">
                <p>Player 对象需要包含 <code>size</code> 属性：</p>
                <pre><code>this.player = {
  x: 100, y: 100,
  size: 48,  // 必须有这个属性
  // ...
}</code></pre>
              </el-collapse-item>
              <el-collapse-item title="修改后游戏未更新" name="3">
                <p>确认：</p>
                <ol>
                  <li>点击了编辑器中的"保存"按钮</li>
                  <li>游戏页面已刷新 (Ctrl+F5)</li>
                  <li>浏览器缓存已清除</li>
                </ol>
              </el-collapse-item>
              <el-collapse-item title="如何恢复误删的数据" name="4">
                <p>使用备份恢复：</p>
                <ol>
                  <li>进入 <code>backup/</code> 目录</li>
                  <li>找到修改前的备份文件</li>
                  <li>复制内容覆盖当前文件</li>
                </ol>
              </el-collapse-item>
            </el-collapse>
          </div>
          
          <!-- 快捷键 -->
          <div v-if="activeSection === 'shortcuts'" class="section">
            <h2>⌨️ 快捷键</h2>
            
            <el-table :data="shortcuts" border>
              <el-table-column prop="key" label="快捷键" width="200">
                <template #default="{ row }">
                  <kbd v-for="k in row.keys" :key="k" class="kbd">{{ k }}</kbd>
                </template>
              </el-table-column>
              <el-table-column prop="desc" label="功能" />
              <el-table-column prop="scope" label="作用域" width="150">
                <template #default="{ row }">
                  <el-tag size="small">{{ row.scope }}</el-tag>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const activeSection = ref('overview')
const syncDirection = ref('toCode')

const handleSelect = (index) => {
  activeSection.value = index
}

const features = [
  { name: '可视化编辑', desc: '实时预览修改效果', icon: 'Edit', color: '#409EFF' },
  { name: '数据同步', desc: '一键同步到游戏代码', icon: 'Refresh', color: '#67C23A' },
  { name: '智能检测', desc: '自动发现数据不一致', icon: 'Warning', color: '#E6A23C' },
  { name: '依赖分析', desc: '可视化数据依赖图', icon: 'Share', color: '#909399' },
  { name: '一键修复', desc: '快速解决常见问题', icon: 'FirstAidKit', color: '#F56C6C' },
  { name: '版本控制', desc: '自动备份修改历史', icon: 'Collection', color: '#8E44AD' }
]

const dataSources = [
  { name: '敌人数据', path: 'data/enemies/index.js', format: 'JavaScript', type: 'primary', icon: 'User' },
  { name: '贴图元数据', path: 'assets/sprites/metadata.json', format: 'JSON', type: 'success', icon: 'Picture' },
  { name: '游戏配置', path: 'index.html (CONFIG)', format: 'JavaScript', type: 'warning', icon: 'Tools' }
]

const sizeTiers = [
  { tier: 1, name: '微型', baseSize: 20, multiplier: '1.0x', finalSize: '20px', tagType: 'info', desc: '蜗牛、小鸡' },
  { tier: 1, name: '小型', baseSize: 32, multiplier: '1.0x', finalSize: '32px', tagType: '', desc: '老鼠、蝙蝠' },
  { tier: 2, name: '中型', baseSize: 42, multiplier: '1.3x', finalSize: '~55px', tagType: 'success', desc: '豺狼、野猪' },
  { tier: 3, name: '大型', baseSize: 55, multiplier: '1.6x', finalSize: '~88px', tagType: 'warning', desc: '熊、鳄鱼' },
  { tier: 4, name: '巨型', baseSize: 72, multiplier: '2.0x', finalSize: '144px', tagType: 'danger', desc: '巨兽' }
]

const outlineColors = [
  { tier: 1, color: '#909399', hex: '#909399', tagType: 'info', desc: '普通敌人' },
  { tier: 2, color: '#67C23A', hex: '#67C23A', tagType: 'success', desc: '精英敌人' },
  { tier: 3, color: '#E6A23C', hex: '#E6A23C', tagType: 'warning', desc: '稀有敌人' },
  { tier: 4, color: '#F56C6C', hex: '#F56C6C', tagType: 'danger', desc: 'BOSS级' }
]

const shortcuts = [
  { keys: ['Ctrl', 'S'], desc: '保存当前编辑', scope: '全局' },
  { keys: ['Ctrl', 'F'], desc: '打开全局搜索', scope: '全局' },
  { keys: ['Ctrl', 'R'], desc: '刷新数据', scope: '全局' },
  { keys: ['F5'], desc: '预览渲染效果', scope: '编辑器' }
]
</script>

<style lang="scss" scoped>
.help-page {
  padding: 20px;
}

.help-content {
  margin-top: 20px;
}

.nav-card {
  position: sticky;
  top: 20px;
}

.help-nav {
  border-right: none;
}

.content-card {
  min-height: 600px;
}

.section {
  h2 {
    margin-top: 0;
    margin-bottom: 20px;
    color: #303133;
  }
  
  h3 {
    margin: 24px 0 16px;
    color: #606266;
    font-size: 18px;
  }
}

.intro {
  font-size: 16px;
  line-height: 1.8;
  color: #606266;
}

.feature-card {
  text-align: center;
  padding: 20px;
  background: #f5f7fa;
  border-radius: 8px;
  margin-bottom: 16px;
  
  h4 {
    margin: 12px 0 8px;
    font-size: 16px;
  }
  
  p {
    margin: 0;
    font-size: 13px;
    color: #909399;
  }
}

.chain-diagram {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 24px;
  background: #f5f7fa;
  border-radius: 8px;
  margin: 16px 0;
  flex-wrap: wrap;
  
  .chain-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 12px 16px;
    background: white;
    border-radius: 8px;
    min-width: 80px;
    
    &.highlight {
      background: #409EFF;
      color: white;
    }
    
    span {
      font-weight: bold;
      margin-top: 4px;
    }
    
    small {
      font-size: 11px;
      opacity: 0.7;
    }
  }
}

.anchor-alert {
  margin: 16px 0;
  
  ul {
    margin: 8px 0;
    padding-left: 20px;
  }
}

.override-chain {
  margin: 16px 0;
  
  .override-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    margin-bottom: 8px;
    background: #f5f7fa;
    border-radius: 4px;
    
    .source {
      min-width: 120px;
      font-weight: bold;
      color: #606266;
    }
    
    .target {
      flex: 1;
      color: #409EFF;
      
      &.highlight {
        color: #67C23A;
        font-weight: bold;
      }
    }
  }
}

.formula-card {
  background: #f5f7fa;
  
  .formula {
    p {
      margin: 8px 0;
      font-family: monospace;
    }
  }
}

.color-preview {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid #dcdfe6;
}

.sync-options {
  margin: 16px 0;
}

kbd {
  display: inline-block;
  padding: 4px 8px;
  margin: 0 2px;
  font-family: monospace;
  font-size: 12px;
  background: #f5f7fa;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  box-shadow: 0 2px 0 #dcdfe6;
}

code {
  background: #f5f7fa;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
  font-size: 13px;
}

pre {
  background: #2d2d2d;
  color: #ccc;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
  
  code {
    background: transparent;
    padding: 0;
    color: inherit;
  }
}
</style>
