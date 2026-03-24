<template>
  <div class="placeholder-page">
    <el-empty description="依赖关系图 - 开发中">
      <template #image>
        <el-icon :size="80" color="#909399"><Share /></el-icon>
      </template>
      <p>此功能正在开发中，敬请期待</p>
    </el-empty>
  </div>
</template>

<style lang="scss" scoped>
.placeholder-page {
  padding: 60px 20px;
  text-align: center;
}
</style>
