import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue'),
    meta: { title: '总览 (Dashboard)' }
  },
  {
    path: '/search',
    name: 'Search',
    component: () => import('../views/Search.vue'),
    meta: { title: '全局搜索 (Global Search)' }
  },
  {
    path: '/enemies',
    name: 'Enemies',
    component: () => import('../views/Enemies.vue'),
    meta: { title: '敌人系统 (Enemies)' }
  },
  {
    path: '/weapons',
    name: 'Weapons',
    component: () => import('../views/Weapons.vue'),
    meta: { title: '武器系统 (Weapons)' }
  },
  {
    path: '/items',
    name: 'Items',
    component: () => import('../views/Items.vue'),
    meta: { title: '物品系统 (Items)' }
  },
  {
    path: '/sprites',
    name: 'Sprites',
    component: () => import('../views/Sprites.vue'),
    meta: { title: '贴图管理 (Sprites)' }
  },
  {
    path: '/audio',
    name: 'Audio',
    component: () => import('../views/Audio.vue'),
    meta: { title: '音效系统 (Audio)' }
  },
  {
    path: '/hd2d',
    name: 'HD2D',
    component: () => import('../views/HD2D.vue'),
    meta: { title: 'HD-2D渲染 (Render)' }
  },
  {
    path: '/collision',
    name: 'Collision',
    component: () => import('../views/Collision.vue'),
    meta: { title: '碰撞系统 (Collision)' }
  },
  {
    path: '/sprite-sync',
    name: 'SpriteSync',
    component: () => import('../views/SpriteSync.vue'),
    meta: { title: '贴图同步 (Sync)' }
  },
  {
    path: '/quick-fix',
    name: 'QuickFix',
    component: () => import('../views/QuickFix.vue'),
    meta: { title: '一键修复 (Quick Fix)' }
  },
  {
    path: '/dependency',
    name: 'Dependency',
    component: () => import('../views/Dependency.vue'),
    meta: { title: '依赖图 (Dependencies)' }
  },
  {
    path: '/logs',
    name: 'Logs',
    component: () => import('../views/Logs.vue'),
    meta: { title: '修改日志 (Logs)' }
  },
  {
    path: '/help',
    name: 'Help',
    component: () => import('../views/Help.vue'),
    meta: { title: '帮助文档 (Help)' }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue'),
    meta: { title: '页面未找到 (404)' }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫 - 更新页面标题
router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = `${to.meta.title} - 游戏数据总控台`
  }
  next()
})

export default router
