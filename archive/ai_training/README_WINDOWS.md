# 🐮 牛牛肉鸽 AI 训练系统 (Windows版) v2.0

AI 自动玩游戏并收集训练数据的自动化系统。

## ✨ 新特性 v2.0

- **🎯 通关模式**：AI 玩到通关或死亡（而非固定60秒）
- **⚡ 游戏加速**：支持 1-10 倍速训练
- **📊 详细统计**：记录击杀数、金币、等级、房间进度
- **🎬 自动录屏**：每10次训练自动录制视频

## 🚀 快速开始

### 第一步：安装（只需一次）
```
右键点击"一键安装.bat" → 以管理员身份运行
```
自动安装 Node.js + Playwright + Chromium

### 第二步：运行训练
```
双击"快速通关.bat"      # 2倍速通关模式（推荐）
双击"极速训练.bat"      # 10倍速极速通关
双击"限时训练.bat"      # 固定60秒模式
```

## 📁 文件说明

| 文件 | 用途 |
|------|------|
| `一键安装.bat` | 首次安装运行 |
| `快速通关.bat` | 2倍速通关模式 ⭐ |
| `极速训练.bat` | 10倍速模式 |
| `限时训练.bat` | 固定60秒模式 |
| `查看数据.bat` | 查看训练记录 |
| `play_game_windows.js` | 主程序 |

## ⚙️ 高级配置

### 命令行参数

```bash
node play_game_windows.js [参数]
```

| 参数 | 说明 | 示例 |
|------|------|------|
| `--speed=N` | 游戏速度倍率 (1-10) | `--speed=5` |
| `--mode=clear` | 通关模式（玩到结束） | `--mode=clear` |
| `--mode=time` | 限时模式（60秒） | `--mode=time` |
| `--max-time=N` | 最大运行秒数 | `--max-time=300` |
| `--video` | 强制录制视频 | `--video` |
| `--headless` | 无界面后台运行 | `--headless` |

### 示例

```bash
# 5倍速通关，最多5分钟
node play_game_windows.js --speed=5 --mode=clear --max-time=300

# 3倍速限时训练，强制录视频
node play_game_windows.js --speed=3 --mode=time --video

# 后台无界面运行
node play_game_windows.js --speed=10 --headless
```

## 📊 输出数据

### 位置
```
E:\AI\game\rougelike-cow\
├── videos/           # 每10次自动录制的视频
└── data/
    ├── train_1_xxx.json      # 训练数据（JSON）
    ├── train_1_final.png     # 结束截图
    └── train_count.txt       # 训练计数
```

### 数据结构
```json
{
  "version": "v0.9.0",
  "trainCount": "8",
  "timestamp": "2026-02-19T12:00:00.000Z",
  "config": {
    "speed": 2,
    "mode": "clear",
    "maxTime": 600000
  },
  "result": "dead",
  "summary": {
    "totalTime": 125000,
    "finalRoom": 3,
    "playerLevel": 8,
    "enemiesKilled": 156,
    "goldCollected": 450
  },
  "events": [
    {
      "time": 1000,
      "gameState": {
        "playerHp": 6,
        "playerLv": 3,
        "enemyCount": 45,
        "roomNumber": 2,
        "wave": 2,
        "isFinished": false
      }
    }
  ]
}
```

## 🎮 AI 行为

当前 AI 使用简单策略：
- **80%** 时间：随机移动 (WASD)
- **10%** 时间：冲刺 (Space)
- **10%** 时间：使用道具 (1-9)
- **每10秒**：尝试打开商店或进化武器

## 🏆 训练结果类型

| 结果 | 说明 |
|------|------|
| `cleared` | 🏆 AI 通关了！ |
| `dead` | 💀 AI 阵亡 |
| `timeout` | ⏰ 超过最大运行时间 |
| `time_limit` | ⏰ 限时模式时间到 |

## 🛠️ 故障排除

### 安装失败
- 确保以**管理员身份**运行安装脚本
- 检查网络连接（需要下载 Node.js 和 Chromium）

### 游戏无法启动
- 确保 `index.html` 在正确位置
- 尝试刷新或重新安装

### 速度不生效
- 部分游戏逻辑可能不受速度影响
- 建议尝试 2-5 倍速，过高可能导致不稳定

## 📝 更新日志

### v2.0 (2026-02-19)
- 新增通关模式（玩到死亡/通关）
- 新增游戏加速功能（1-10倍速）
- 新增详细统计（击杀数、金币、等级）
- 改进 AI 策略
- 新增多个快捷批处理脚本

### v1.0 (2026-02-19)
- 初始版本
- 基础自动运行和数据收集
