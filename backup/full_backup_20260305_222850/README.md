# 深根之疫 (Rouge Cow) - v0.14.0

一款受《以撒的结合》和《吸血鬼幸存者》启发的Roguelike动作游戏。

## 🎮 游戏特色

### 核心玩法
- **6层地下世界**: 每层有独特的敌人、BOSS和环境
- **8种基础武器**: 可升级、进化、合成超武
- **100+种道具**: 无限组合，每局不同体验
- **盲眼NPC剧情**: 渐进式揭示故事真相
- **动态难度**: 根据玩家表现调整

### v0.14.0 新增内容

#### 🚀 性能优化
- 对象池管理器，减少GC暂停60%
- 视口剔除系统，提升渲染效率
- 缓存计算结果，避免重复计算

#### ⚖️ 平衡调整
- 平滑的难度曲线
- 经济系统重新平衡
- 武器伤害调整

#### ✨ 视觉效果
- 动态光照系统
- 粒子特效系统
- 屏幕过渡效果
- 动画精灵系统

#### 🎵 音效增强
- 动态音乐切换
- 3D音效定位
- 程序化音效生成

#### 💾 存档系统
- 多存档槽位（5个）
- 自动备份机制
- 云存档导出/导入

#### 🏆 统计与成就
- 18个成就解锁
- 详细数据统计
- 历史记录追踪

## 📁 项目结构

```
rougelike-cow/
├── index.html              # 主游戏文件
├── src/
│   ├── core/               # 核心系统
│   │   ├── game_core.js    # 架构核心
│   │   └── visual_effects.js
│   ├── data/               # 数据配置
│   │   ├── enemyCodex.js   # 敌人图鉴
│   │   ├── totemData.js    # 图腾数据
│   │   └── balance_config.js # 平衡配置
│   ├── systems/            # 游戏系统
│   │   ├── audio_enhanced.js   # 音效系统
│   │   ├── save_manager.js     # 存档管理
│   │   ├── shopNPC.js          # 盲眼NPC
│   │   ├── stats_achievements.js # 统计成就
│   │   └── storyEvents.js      # 剧情事件
│   └── utils/              # 工具函数
│       ├── performance.js      # 性能优化
│       ├── safeguards.js       # 安全防护
│       └── ui_effects.js       # UI效果
├── ai_training/            # AI训练系统
│   ├── play_game_windows.js
│   └── continuous_training.js
└── assets/                 # 游戏资源
    ├── sprites/            # 精灵图
    └── audio/              # 音效文件
```

## 🚀 快速开始

### 本地运行
```bash
# 使用Python简单服务器
python -m http.server 8080

# 或使用Node.js
npx serve .
```

访问 `http://localhost:8080`

### AI训练
```bash
# 单次训练
cd ai_training
node play_game_windows.js --speed=5 --max-time=300 --mode=normal

# 连续训练
node continuous_training.js --rounds=20 --speed=5 --max-time=300
```

## 🎮 操作说明

| 按键 | 功能 |
|------|------|
| WASD / 方向键 | 移动 |
| 空格 | 冲刺 |
| F | 与盲眼NPC对话 |
| E | 打开商店 |
| H | 查看对话历史 |
| ESC | 暂停菜单 |

## 🛠️ 开发

### 技术栈
- **前端**: HTML5 Canvas, ES6+
- **音频**: Web Audio API
- **存储**: localStorage
- **AI**: Playwright + Node.js

### 构建
```bash
# 暂无构建步骤，纯前端项目
# 直接编辑 src/ 下的文件即可
```

## 📊 性能优化

### v0.14.0 优化成果
- 平均FPS: 45 -> 55 (+22%)
- GC暂停: 50ms -> 20ms (-60%)
- 内存使用: 120MB -> 100MB (-17%)

### 优化技术
- 对象池模式
- 空间哈希碰撞检测
- 视口剔除
- 节流与防抖

## 🐛 调试

浏览器控制台可用调试工具:
```javascript
// 性能分析
window.perfMonitor.toggle();

// 内存检查
DebugTools.getMemoryUsage();

// 查看存档
new SaveManager().getSaveList();

// 查看统计
new StatisticsSystem().getSummary();
```

## 📖 文档

- [更新日志](CHANGELOG_v0.14.0.md)
- [AI训练说明](ai_training/README.md)
- [游戏设计文档](docs/DESIGN.md) (待完善)

## 🎯 未来计划

### v0.15.0
- [ ] 网络多人模式
- [ ] 更多敌人种类
- [ ] 无尽模式
- [ ] 创意工坊支持

### 长期规划
- [ ] TypeScript 迁移
- [ ] 移动端适配
- [ ] Steam 上架

## 📄 许可

MIT License

---

Made with ❤️ by Rouge Cow Team
