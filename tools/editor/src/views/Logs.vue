<template>
  <div class="logs-page">
    <h2>📝 修改日志</h2>
    
    <el-timeline>
      <el-timeline-item
        v-for="log in logs"
        :key="log.id"
        :type="log.type"
        :icon="log.icon"
        :timestamp="log.time"
      >
        <h4>{{ log.title }}</h4>
        <p>{{ log.description }}</p>
        <el-tag v-if="log.category" size="small">{{ log.category }}</el-tag>
      </el-timeline-item>
    </el-timeline>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const logs = ref([
  {
    id: 1,
    title: '创建 Game Data Master Editor',
    description: '初始化编辑器项目，配置 Vue 3 + Vite 环境',
    time: '2026-03-07 14:00',
    type: 'primary',
    icon: 'Star',
    category: '系统'
  },
  {
    id: 2,
    title: '添加敌人系统编辑器',
    description: '完成敌人数据的可视化编辑和实时预览',
    time: '2026-03-07 14:30',
    type: 'success',
    icon: 'Check',
    category: '功能'
  },
  {
    id: 3,
    title: '添加武器系统编辑器',
    description: '支持武器属性编辑和DPS计算',
    time: '2026-03-07 15:00',
    type: 'success',
    icon: 'Check',
    category: '功能'
  },
  {
    id: 4,
    title: '添加音效系统编辑器',
    description: '支持音量、循环、淡入淡出等参数配置',
    time: '2026-03-07 15:30',
    type: 'success',
    icon: 'Check',
    category: '功能'
  },
  {
    id: 5,
    title: '添加HD-2D效果编辑器',
    description: '支持边缘光、阴影、描边、泛光效果调整',
    time: '2026-03-07 16:00',
    type: 'success',
    icon: 'Check',
    category: '功能'
  },
  {
    id: 6,
    title: '添加全局搜索功能',
    description: '支持跨数据文件快速搜索',
    time: '2026-03-07 16:30',
    type: 'success',
    icon: 'Check',
    category: '功能'
  },
  {
    id: 7,
    title: '添加帮助文档',
    description: '完善使用指南和常见问题解答',
    time: '2026-03-07 17:00',
    type: 'success',
    icon: 'Check',
    category: '文档'
  }
])
</script>

<style lang="scss" scoped>
.logs-page {
  padding: 20px;
  
  h2 {
    margin-bottom: 24px;
  }
  
  h4 {
    margin: 0 0 8px;
  }
  
  p {
    margin: 0 0 8px;
    color: #606266;
  }
}
</style>
