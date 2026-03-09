# AI 训练系统 v0.16.0 更新日志

## 概述
适配游戏 v0.16.0 武器升级系统重设计，添加智能武器升级选择和学习功能。

## 主要更新

### 1. 智能武器升级选择 (play_game_windows.js & continuous_training.js)

AI 现在能够智能选择武器升级：

- **评分系统**：为每个升级选项计算分数
  - Lv4 质变等级：+100 分
  - Lv8 满级质变：+150 分
  - 早期升级 (Lv1-3)：+30 分
  - 中后期升级 (Lv5-7)：+50 分
  - 超武合成需求：+200 分

- **武器类型优先级**：
  - bible (圣经): 1.4 - 防御型，高优先级
  - duplicator (复制器): 1.4 - 投射物数量
  - wand (魔杖): 1.3 - 追踪，后期强
  - fireball (火球): 1.3 - 爆炸AOE
  - lightning (闪电): 1.3 - 连锁
  - knife (飞刀): 1.2 - 高攻速
  - shuriken (手里剑): 1.2 - 散射
  - chakram (环刃): 1.2 - 环绕
  - garlic (大蒜): 1.2 - 近战光环
  - spinach (菠菜/伤害): 1.3 - 基础伤害

- **被动道具优先级**：
  - 超武合成需求：最高优先级 (+200)
  - duplicator (复制器): 1.4
  - spinach (伤害): 1.3
  - empty_tome (CD): 1.3
  - crown (经验): 1.2
  - armor (护甲): 1.2
  - candelabrador (范围): 1.2
  - spellbinder (持续时间): 1.2

### 2. 武器升级数据收集 (ai_learner.js)

新增数据追踪功能：

- **weaponUpgrades**: 记录每个升级选择的效果
  - 使用次数
  - 胜率
  - 平均分数

- **weaponWinRates**: 追踪武器配置的胜率
  - 武器类型 + 等级
  - 超武标记
  - 胜率和平均分数

- **学习报告**：显示胜率最高的武器配置 TOP5

### 3. 数据展示优化 (show_ai_progress.js)

更新进度查看脚本，显示：

- 武器胜率 TOP 10
- 升级效果追踪
- 最常用的武器升级组合
- 数据版本信息

### 4. 训练数据增强

所有训练数据文件现在包含：

```json
{
  "version": "v3.4-weapon-upgrade",
  "finalWeapons": [...],      // 最终武器配置
  "finalPassives": [...],     // 最终被动道具
  "aiLearning": {
    "weaponUpgrades": {...},  // 升级统计
    "weaponWinRates": {...}   // 武器胜率
  }
}
```

## 文件变更

| 文件 | 变更类型 | 说明 |
|------|----------|------|
| ai_learner.js | 修改 | 添加武器升级学习功能 |
| play_game_windows.js | 修改 | 智能升级选择 + 数据收集 |
| continuous_training.js | 修改 | 智能升级选择 + 数据收集 |
| show_ai_progress.js | 修改 | 显示武器统计信息 |
| START.bat | 修改 | 更新版本号 |
| README.md | 修改 | 添加武器升级学习文档 |
| CHANGELOG_v0.16.md | 新增 | 本更新日志 |

## 使用建议

1. **连续训练**：运行 20-50 局让 AI 学习武器偏好
2. **查看进度**：运行 `show_ai_progress.js` 查看武器胜率
3. **分析结果**：根据武器胜率调整游戏策略

## 后续优化方向

1. 更精细的武器组合分析
2. 针对不同敌人的武器偏好学习
3. 超武合成时机优化
4. 多武器协同效果分析
