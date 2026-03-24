# 🤖 AI观察训练循环系统

## 概述

这是一个自动化的问题发现和修复系统，通过AI自动玩游戏来检测游戏中的Bug和性能问题，然后自动生成修复建议。

## 系统组成

### 1. 快速观察脚本 (`ai_quick_observe.js`)
- 单轮游戏观察
- 60秒实时监控
- 自动检测问题
- 生成修复建议

### 2. 完整循环脚本 (`ai_observation_loop.js`)
- 多轮训练循环
- 自动Bug检测
- 智能修复建议
- 验证修复效果
- 稳定性判断

### 3. 启动器 (`观察训练循环.bat`)
- 图形化菜单
- 一键启动
- 数据管理

## 快速开始

```bash
# 方式1: 双击运行
观察训练循环.bat

# 方式2: 命令行
node ai_quick_observe.js      # 快速观察
node ai_observation_loop.js    # 完整循环
```

## 检测的问题类型

| 问题类型 | 严重程度 | 说明 |
|---------|---------|------|
| player_stuck | medium | 玩家卡死，无进度 |
| console_errors | medium | JavaScript错误 |
| invalid_hp | critical | 生命值异常 |
| invalid_state | critical | 游戏状态异常 |
| too_many_particles | low | 粒子数量过多 |
| too_many_bullets | low | 子弹数量过多 |
| memory_leak | medium | 内存泄漏 |

## 输出文件

```
E:\AI\game\rougelike-cow\
├── bug_reports\
│   ├── observation_xxx.json     # 观察报告
│   └── bug_report_xxx.json      # Bug详情
├── data\
│   ├── ai_learning_data.json    # AI学习数据
│   └── train_xxx.json           # 训练记录
├── ai_loop_history.json         # 循环历史
└── ai_quick_observe.js          # 观察脚本
```

## 报告格式

```json
{
  "timestamp": "2026-02-19T...",
  "duration": 60000,
  "summary": {
    "critical": 0,
    "high": 1,
    "medium": 2,
    "low": 0,
    "total": 3
  },
  "issues": [
    {
      "type": "player_stuck",
      "description": "Player appears stuck",
      "severity": "medium",
      "timestamp": 15000,
      "details": {...}
    }
  ],
  "recommendations": [
    {
      "priority": "high",
      "action": "Improve AI navigation",
      "reason": "Player got stuck"
    }
  ]
}
```

## 配置选项

在 `ai_observation_loop.js` 中修改:

```javascript
const CONFIG = {
    trainRounds: 5,          // 每轮训练局数
    trainSpeed: 5,           // 游戏速度
    maxTrainTime: 120,       // 每局最大秒数
    maxLoops: 10,            // 最大循环次数
    stabilityThreshold: 3,   // 稳定判定阈值
    avgScoreThreshold: 200   // 最低分数阈值
};
```

## 工作流程

```
┌─────────────────┐
│   启动训练      │
└────────┬────────┘
         ▼
┌─────────────────┐
│   AI玩游戏      │
│   (自动操作)    │
└────────┬────────┘
         ▼
┌─────────────────┐
│   收集数据      │
│   (每秒采样)    │
└────────┬────────┘
         ▼
┌─────────────────┐
│   检测问题      │
│   (多维度检查)  │
└────────┬────────┘
         ▼
┌─────────────────┐
│   分析问题      │
│   (模式识别)    │
└────────┬────────┘
         ▼
┌─────────────────┐
│   生成建议      │
│   (修复方案)    │
└────────┬────────┘
         ▼
┌─────────────────┐
│   是否修复?     │
└────────┬────────┘
    是 /  否
    ▼      ▼
修复问题  继续观察
    │      │
    └──────┘
         ▼
┌─────────────────┐
│   是否稳定?     │
└────────┬────────┘
    是      否
    ▼       ▼
  完成   下一轮
```

## 常见问题

### Q: 浏览器无法启动
确保已安装Chrome或Chromium:
```bash
cd archive\ai_training
node auto_setup.ps1
```

### Q: 游戏加载失败
检查 `index.html` 路径是否正确

### Q: 训练时间过长
调整配置减小 `maxTrainTime` 或增加 `trainSpeed`

## 进阶使用

### 自定义检测规则

在 `GameObserver.checkForIssues()` 中添加:

```javascript
// 检查自定义问题
if (state.enemyCount > 100) {
    this.addIssue('too_many_enemies', 'Enemy count too high', 'medium');
}
```

### 集成到CI/CD

```yaml
# .github/workflows/test.yml
- name: AI Observation Test
  run: node ai_quick_observe.js
  continue-on-error: true
```

## 版本历史

### v1.0 (2026-02-19)
- 初始版本
- 快速观察模式
- 完整循环模式
- 自动Bug检测
