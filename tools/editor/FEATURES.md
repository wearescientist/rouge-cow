# 🎮 Game Data Master Editor v1.0 - 功能清单

## ✅ 已完成的功能模块

### 1. 总览仪表板 (Home.vue)
- 快捷入口卡片（8个主要功能）
- 数据概览统计
- 系统状态监控
- 最近活动时间线
- 快速提示

### 2. 全局搜索 (Search.vue)
- 跨数据文件搜索
- 按类型筛选结果
- 快速跳转功能
- 常用搜索标签

### 3. 敌人系统 (Enemies.vue)
- 敌人列表浏览
- 可视化预览（Canvas）
- 属性编辑（size/tier/HP/speed等）
- 数据同步工具

### 4. 武器系统 (Weapons.vue)
- 武器列表管理
- 属性编辑（damage/cooldown/speed等）
- DPS计算显示
- 升级配置预览

### 5. 音效系统 (Audio.vue)
- 音频文件浏览器
- 分类管理（BGM/SFX/UI）
- 音量控制（0-100%）
- 循环/淡入淡出配置
- 播放预览

### 6. HD-2D效果 (HD2D.vue)
- 实时预览（敌人/玩家/Boss）
- 边缘光参数调整
- 阴影参数调整
- 描边配置（按等级/自定义）
- 泛光效果
- 预设方案管理
- 代码导出

### 7. 一键修复 (QuickFix.vue)
- 自动扫描数据问题
- Player size 检测
- 敌人 size/tier 检测
- 贴图元数据检测
- 批量修复功能
- 修复历史记录
- 修复向导文档

### 8. 帮助文档 (Help.vue)
- 系统概览
- 快速开始指南
- 体型等级说明
- 锚点规则说明
- 数据覆盖链
- 常见问题FAQ
- 快捷键列表

### 9. 修改日志 (Logs.vue)
- 版本历史时间线
- 功能更新记录

### 10. 占位页面（开发中）
- Items.vue - 物品系统
- Sprites.vue - 贴图管理
- Collision.vue - 碰撞系统
- SpriteSync.vue - 贴图同步
- Dependency.vue - 依赖图
- NotFound.vue - 404页面

## 📁 项目结构

```
tools/editor/
├── src/
│   ├── views/           # 16个视图组件
│   ├── stores/
│   │   └── dataStore.js # Pinia 数据管理
│   ├── router/
│   │   └── index.js     # 路由配置
│   ├── App.vue          # 根组件
│   └── main.js          # 入口
├── server/
│   ├── index.js         # Express 后端
│   └── package.json     # 后端依赖
├── public/              # 静态资源
├── index.html
├── package.json         # 前端依赖
├── vite.config.js       # Vite 配置
├── README.md            # 说明文档
├── FEATURES.md          # 本文件
└── start_server.bat     # 启动脚本
```

## 🚀 启动方式

```bash
# 使用脚本启动
start_server.bat

# 或手动启动
# 终端1
cd server && npm start

# 终端2
npm run dev
```

访问 http://localhost:5173

## 📝 技术栈

- **前端**: Vue 3 + Element Plus + Pinia + Vue Router
- **后端**: Node.js + Express + CORS
- **构建**: Vite
- **样式**: SCSS

## 🔄 API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/data/:type` | GET | 获取数据 |
| `/api/save/:type` | POST | 保存数据（自动备份） |
| `/api/sync/sprite-to-enemy` | POST | 同步贴图尺寸到敌人 |
| `/api/sync/enemy-to-sprite` | POST | 同步敌人尺寸到贴图 |
| `/api/fix` | POST | 应用修复 |
| `/api/file-tree` | GET | 获取文件树 |
| `/api/code-location/:system` | GET | 代码位置 |

## 🔄 数据覆盖链

```
贴图文件 (PNG)
    ↓
metadata.json (bounds/hitbox)
    ↓
ENEMY_TYPES (size/tier)
    ↓
Enemy.getTargetHeight() × tierMultiplier
    ↓
实际渲染尺寸
```

覆盖优先级: **运行时计算 > ENEMY_TYPES.size > metadata.bounds > PNG 实际尺寸**

## 💡 设计亮点

1. **锚点规则可视化** - 帮助理解 CENTER vs FEET 锚点
2. **数据覆盖链显示** - 清晰展示从贴图到渲染的数据流向
3. **实时预览** - HD-2D效果即时可视化
4. **一键修复** - 自动检测并修复常见问题
5. **代码导出** - 配置生成可直接使用的代码
6. **全局搜索** - 快速定位跨文件数据
