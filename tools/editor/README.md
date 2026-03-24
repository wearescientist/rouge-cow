# 🎮 游戏数据总控台 (Game Data Master Editor)

一个基于 Vue 3 + Vite 的纯前端可视化游戏数据编辑器，专为 **深根之疫 (Rouge Cow)** 设计。

## ✨ 核心功能

- **🎯 敌人系统编辑** - 可视化编辑敌人属性，实时预览渲染效果
- **⚔️ 武器系统编辑** - 武器伤害、弹道、升级路径配置
- **🎨 HD-2D 效果编辑** - 边缘光、阴影、描边、泛光等视觉参数
- **🔊 音效系统编辑** - 音量、循环、分类管理
- **🔍 全局搜索** - 跨数据文件快速定位
- **🩹 一键修复** - 自动检测数据问题
- **📖 帮助文档** - 完整使用指南

## 🚀 快速开始

### 1. 安装依赖（首次运行）

```bash
cd tools/editor
npm install
```

### 2. 启动编辑器

**双击运行：**
```
打开编辑器.bat
```

或手动运行：
```bash
npm run dev
```

### 3. 访问编辑器

浏览器会自动打开： http://localhost:5173

## 📁 项目结构

```
tools/editor/
├── src/
│   ├── views/           # 页面组件
│   │   ├── Home.vue     # 总览
│   │   ├── Enemies.vue  # 敌人编辑
│   │   ├── Weapons.vue  # 武器编辑
│   │   ├── Audio.vue    # 音效编辑
│   │   ├── HD2D.vue     # 渲染效果
│   │   ├── Search.vue   # 全局搜索
│   │   ├── Help.vue     # 帮助文档
│   │   └── ...
│   ├── stores/
│   │   └── dataStore.js # 数据管理
│   ├── router/
│   │   └── index.js     # 路由配置
│   └── App.vue          # 根组件
├── package.json
├── vite.config.js
└── 打开编辑器.bat       # 一键启动脚本
```

## 💾 数据保存方式

由于浏览器安全限制，编辑器使用**导出下载**方式保存数据：

1. 在编辑器中修改数据
2. 点击"保存"按钮
3. 浏览器自动下载 `.js` 或 `.json` 文件
4. 将下载的文件复制到项目对应目录覆盖原文件

### 文件对应关系

| 编辑器导出 | 复制到 |
|-----------|--------|
| `enemies.js` | `data/enemies/index.js` |
| `metadata.json` | `assets/sprites/metadata.json` |
| `weapons.json` | 游戏配置目录 |

## 🔧 数据覆盖链

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

## 📝 技术栈

- **前端**: Vue 3 + Element Plus + Pinia
- **构建**: Vite
- **样式**: SCSS

## 🐛 常见问题

### Q: 如何保存修改？
A: 点击保存按钮后，浏览器会下载文件，将其复制到项目对应目录即可。

### Q: 可以读取游戏实际数据吗？
A: 可以，编辑器会尝试读取 `data/enemies/index.js` 和 `assets/sprites/metadata.json`，如果失败则使用模拟数据。

### Q: 如何停止服务？
A: 直接关闭终端窗口，或按 `Ctrl + C`。

---

**版本**: v1.0.0  
**项目**: 深根之疫 (Rouge Cow)
