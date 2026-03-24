# 怪物资产分析报告
## 基于新分层架构的重组建议

---

## 一、现有资产盘点（69个怪物）

### 按基础ID分类

| 基础ID | 版本数 | 当前分布 | 特征评估 |
|--------|--------|----------|----------|
| **bat** | 4 (v2,v3,v8,v9) | F1-F3 | ⭐ 轮廓清晰，飞行系，适合基础 |
| **chick** | 1 (spr) | F1 | ⭐ 小巧，辨识度高，可爱 |
| **crab** | 4 (spr,v2,v4,v6,v8) | F1-F5 | ⭐ 坦克型，轮廓硬，适合基础 |
| **fox** | 6 (v1,v3,v6,v7,v8,v10) | F1-F6 | ⭐ 四足，灵活，辨识度高 |
| **ghost** | 6 (spr,v2,v3,v4,v6,v8,v10) | F1-F6 | ⭐ 漂浮，特色鲜明 |
| **mimic** | 7 (v1,v4,v5,v6,v7,v8,v10,spr) | F1-F6 | ⭐⭐ 独特，高记忆点，适合做T2+ |
| **panther** | 3 (v1,v2,v10) | F1,F5,F4 | ⭐ 速度快，轮廓好 |
| **pigeon** | 6 (v1,v2,v4,v6,v7,v8,v10) | F1-F6 | ⭐ 飞行，群体感 |
| **rabbit2** | 4 (v2,v3,v4,v8) | F1,F3 | ⭐ 跳跃感，速度快 |
| **snail** | 6 (spr,v1,v2,v4,v6,v7,v8,v10) | F1-F5 | ⭐ 慢速坦克，壳特征明显 |
| **snake** | 4 (v4,v7,v8,v10) | F1,F3-F5 | ⭐ 长条轮廓，爬行 |
| **nibei** | 3 (spr,v6,v8) | F2,F3 | ⭐⭐ 泥龟，坦克，可做T2 |
| **yinya** | 1 (v7) | F2 | ⭐⭐ 狼王银牙，精英感 |
| **bee** | 1 (v6) | F5 | ⭐ 飞行，小型 |
| **goose** | 2 (v6,v10) | F5,F6 | ⭐⭐ 守卫鹅，特色鲜明 |
| **wolf_king** | 1 (v2) | F4 | ⭐⭐⭐ Boss级 |
| **mother** | 5 (v2,v3,v6,v7,v8,v10) | F5-F6 | ⭐⭐⭐ 最终Boss系列 |

---

## 二、推荐分层

### 【8个全局基础怪模板】

选择标准：
- 轮廓最清晰
- 低清化后不糊
- 能做主题变体
- 覆盖不同职能

| 排名 | 基础ID | 推荐版本 | 职能 | 理由 |
|------|--------|----------|------|------|
| 1 | **bat** | v2 | 飞行/骚扰 | 翅膀轮廓清晰，飞行系代表 |
| 2 | **chick** | spr | 小型/快速 | 小巧可爱，辨识度高 |
| 3 | **crab** | v4 | 坦克/近战 | 硬壳轮廓，横向移动 |
| 4 | **fox** | v1 | 快速/灵活 | 四足奔跑，动态好 |
| 5 | **snail** | v1 | 慢速/坦克 | 壳螺旋特征，易变体 |
| 6 | **ghost** | v3 | 漂浮/穿墙 | 半透明，主题适配性强 |
| 7 | **rabbit2** | v2 | 跳跃/快速 | 耳朵特征，跳跃感 |
| 8 | **snake** | v4 | 爬行/远程 | 长条轮廓，毒液主题 |

**排除原因：**
- pigeon：和bat职能重复，bat更经典
- panther：和fox职能重复，fox更易识别
- mimic：太独特，适合做T2+而非基础

---

### 【T2精英候选】（每层2-4个）

从现有资产选，要求：有特色、比基础怪强、不重复职能

| 基础ID | 推荐版本 | 来源楼层 | 特色 |
|--------|----------|----------|------|
| **mimic** | v1,v5,v7,v8 | F1,F2,F3 | 宝箱怪，伪装机制 |
| **panther** | v1,v10 | F1,F4 | 高速刺客 |
| **pigeon** | v4,v8 | F1,F2 | 群体飞行 |
| **nibei** | spr,v6,v8 | F2,F3 | 泥龟，高防 |
| **yinya** | v7 | F2 | 狼王，精英 |
| **bee** | v6 | F5 | 毒刺，小型高速 |
| **goose** | v6,v10 | F5,F6 | 守卫，凶猛 |
| **bat** | v3,v9 | F1,F2 | 大蝙蝠，吸血 |
| **crab** | v8 | F3 | 蟹王，重甲 |
| **fox** | v7,v8 | F2,F3 | 妖狐/九尾，魔法感 |

---

### 【T3小Boss池】（每层1个，用最终Boss变体）

现有mother版本：v2,v3,v6,v7,v8,v10 + 可能的变体

**建议T3模型来源：**

| 版本 | 主题适配 | 建议楼层 |
|------|----------|----------|
| **mother_v2** | 幼体，基础形态 | F1-F2 |
| **mother_v6** | 成熟体，带装甲 | F3-F4 |
| **mother_v7** | 深渊体，带触手 | F5 |
| **mother_v8** | 千根体，根须缠绕 | F6前段 |
| **mother_v10** | 群星体，最终形态 | F6 Boss |
| **mother_v3** | 变异体，混乱感 | 任意中层 |

**T3配置参数建议：**
- 体型：56-64px（比基础大，比Boss小）
- 血量：基础怪 x 8-10
- 速度：中等
- 特殊：带光边/雾效

---

### 【Boss层】

| 楼层 | 推荐Boss | 模型来源 |
|------|----------|----------|
| F1 | 无/教学关 | - |
| F2 | 狼王银牙 | yinya_v7 |
| F3 | 泥背 | nibei_v6 升级 |
| F4 | 狼王 | wolf_king_v2 |
| F5 | 母虫 | mother_v6/v7 |
| F6 | 群星母体 | mother_v10 |

---

## 三、每层配置建议

### F1 菌丝区（教学层）
```
基础怪: bat_v2, chick_spr, crab_v4, snail_v1 (4个)
T2: mimic_v1 (1个，教学伪装机制)
T3: 无 (或 mother_v2 极弱化版)
Boss: 无

主题变体: 菌丝绿色调，轻微腐蚀
```

### F2 孵化温室
```
基础怪: bat_v2, fox_v1, ghost_v3, rabbit2_v2 (4个)
T2: pigeon_v4, panther_v1, mimic_v5 (3个)
T3: mother_v2 (幼体)
Boss: yinya_v7 (狼王银牙)

主题变体: 温室暖色调，孵化囊泡
```

### F3 神经索
```
基础怪: bat_v2, crab_v4, snake_v4, ghost_v3 (4个)
T2: nibei_spr, fox_v7, bat_v9 (3个)
T3: mother_v6 (成熟体)
Boss: 泥背强化版

主题变体: 神经紫蓝色，触须元素
```

### F4 消化熔炉
```
基础怪: fox_v1, rabbit2_v2, snail_v1, snake_v4 (4个)
T2: ghost_v10, panther_v10, crab_v8 (3个)
T3: mother_v3 (变异体)
Boss: wolf_king_v2

主题变体: 熔炉橙红色，高温裂纹
```

### F5 母虫庭院
```
基础怪: bat_v2, ghost_v3, chick_spr, crab_v4 (4个)
T2: bee_v6, goose_v6, mimic_v6 (3个)
T3: mother_v7 (深渊体)
Boss: mother_v6 (母虫)

主题变体: 母虫紫黑色，生物质感
```

### F6 千根之心
```
基础怪: snake_v4, ghost_v3, fox_v1, rabbit2_v2 (4个)
T2: goose_v10, mimic_v8, nibei_v8 (3个)
T3: mother_v8 (千根体)
Boss: mother_v10 (群星母体)

主题变体: 星空深蓝，根须星空化
```

---

## 四、调试工具数据结构

```javascript
// 全局配置
const MONSTER_TEMPLATES = {
  // 8个基础模板
  coreBasePool: [
    { baseId: 'bat', version: 'v2', func: 'flying', size: 28 },
    { baseId: 'chick', version: 'spr', func: 'fast', size: 32 },
    { baseId: 'crab', version: 'v4', func: 'tank', size: 36 },
    { baseId: 'fox', version: 'v1', func: 'fast', size: 40 },
    { baseId: 'snail', version: 'v1', func: 'tank', size: 36 },
    { baseId: 'ghost', version: 'v3', func: 'ethereal', size: 36 },
    { baseId: 'rabbit2', version: 'v2', func: 'fast', size: 32 },
    { baseId: 'snake', version: 'v4', func: 'ranged', size: 32 },
  ],
  
  // T3模型池（最终Boss变体）
  t3Pool: [
    { baseId: 'mother', version: 'v2', theme: 'infant' },
    { baseId: 'mother', version: 'v6', theme: 'mature' },
    { baseId: 'mother', version: 'v7', theme: 'abyss' },
    { baseId: 'mother', version: 'v8', theme: 'roots' },
    { baseId: 'mother', version: 'v10', theme: 'cosmic' },
    { baseId: 'mother', version: 'v3', theme: 'mutant' },
  ]
};

// 每层配置
const FLOOR_CONFIG = {
  floor1: {
    // 基础怪：从coreBasePool选，加本层变体
    basics: [
      { templateIdx: 0, variant: 'fungal', size: 28, hp: 10, speed: 120 },
      { templateIdx: 1, variant: 'fungal', size: 32, hp: 12, speed: 100 },
      { templateIdx: 2, variant: 'fungal', size: 36, hp: 20, speed: 60 },
      { templateIdx: 5, variant: 'fungal', size: 36, hp: 15, speed: 80 },
    ],
    // T2精英
    t2: [
      { baseId: 'mimic', version: 'v1', size: 44, hp: 50, speed: 70, weight: 0.3 },
    ],
    // T3小Boss
    t3: { templateIdx: 0, size: 56, hp: 150, speed: 60 },
    // Boss
    boss: null,
  },
  
  floor2: {
    basics: [
      { templateIdx: 0, variant: 'warm', size: 28, hp: 15, speed: 130 },
      { templateIdx: 3, variant: 'warm', size: 40, hp: 18, speed: 150 },
      { templateIdx: 5, variant: 'warm', size: 36, hp: 20, speed: 90 },
      { templateIdx: 6, variant: 'warm', size: 32, hp: 16, speed: 180 },
    ],
    t2: [
      { baseId: 'pigeon', version: 'v4', size: 36, hp: 25, speed: 140, weight: 0.4 },
      { baseId: 'panther', version: 'v1', size: 44, hp: 40, speed: 200, weight: 0.3 },
      { baseId: 'mimic', version: 'v5', size: 44, hp: 60, speed: 70, weight: 0.2 },
    ],
    t3: { templateIdx: 0, size: 60, hp: 300, speed: 80 },
    boss: { baseId: 'yinya', version: 'v7', size: 88, hp: 800, speed: 150 },
  },
  
  // ... floor3-6类似
};
```

---

## 五、总结

### 关键决策

1. **8基础模板**: bat, chick, crab, fox, snail, ghost, rabbit2, snake
2. **T3统一来源**: mother系列6个版本
3. **T2从现有选**: mimic, panther, pigeon, nibei, yinya, bee, goose等
4. **每层结构**: 4基础 + 2-3 T2 + 1 T3 + 可选Boss

### 下一步行动

1. ✅ 完成本分析报告
2. 🔄 制作可视化调试工具
3. 🔄 导出配置并实装
4. 🔄 处理基础怪主题变体贴图
