# 🎵 音效升级报告 v2.0

## 升级概述

将原有的 Kenney 通用命中音效 (`impactSoft`, `impactWood`, `impactBell` 等) 替换为针对6种怪物材质专门设计的高质量程序化生成音效。

---

## 📊 音效对比

| 材质 | 旧音效 | 旧问题 | 新音效设计 | 改进点 |
|-----|--------|--------|-----------|--------|
| **Flesh** | `impactSoft_medium` | 太闷，无打击感 | 重量感砰声 + 低频冲击 | ✓ 明显的命中确认感 |
| **Bone** | `impactWood_light` | 像敲木头 | 清脆碎裂 + 多段断裂 | ✓ 真实骨骼碎裂感 |
| **Shell** | `impactBell_light` | 太像铃铛 | 金属共振 + 高频清脆 | ✓ 甲壳特有的硬度感 |
| **Slime** | `impactGeneric_light` | 毫无特色 | 湿润挤压 + 气泡元素 | ✓ 黏糊糊的独特质感 |
| **Fur** | `impactSoft_medium` | 和flesh重复 | 沉闷打击 + 柔和衰减 | ✓ 毛皮特有的柔软感 |
| **Bird** | `impactBell_light` | 太尖锐 | 轻快撞击 + 高频短促 | ✓ 羽毛/肉体的轻击感 |

---

## 🔊 技术规格

### 生成参数
- **采样率**: 44.1kHz
- **位深度**: 16-bit
- **通道**: 单声道
- **格式**: WAV (无损)
- **总文件数**: 48个
- **总大小**: ~0.9MB

### 每个材质包含
- **5个轻击变体** (`hit_XXX_000~004.wav`) - 普通攻击随机播放
- **3个重击变体** (`hit_XXX_heavy_000~002.wav`) - 暴击/击杀使用

### 合成技术
- **Flesh**: 快速降频正弦波 + 低频噪声 + ADSR包络
- **Bone**: 多段噪声爆发模拟断裂 + 低频共振
- **Shell**: 金属感频率扫描 + 高频泛音 + 冲击噪声
- **Slime**: 低频振荡 + 随机气泡声 + 湿噪声
- **Fur**: 低频砰声 + 低通滤波 + 柔和衰减
- **Bird**: 高频点击 + 金属感主体 + 短促包络

---

## 🎮 游戏集成

### AudioController 更新
```javascript
// 新配置
hits: {
    bird: { prefix: 'hit_custom/hit_bird', count: 5, heavyPrefix: 'hit_custom/hit_bird_heavy', heavyCount: 3 },
    fur: { prefix: 'hit_custom/hit_fur', count: 5, heavyPrefix: 'hit_custom/hit_fur_heavy', heavyCount: 3 },
    shell: { prefix: 'hit_custom/hit_shell', count: 5, heavyPrefix: 'hit_custom/hit_shell_heavy', heavyCount: 3 },
    slime: { prefix: 'hit_custom/hit_slime', count: 5, heavyPrefix: 'hit_custom/hit_slime_heavy', heavyCount: 3 },
    bone: { prefix: 'hit_custom/hit_bone', count: 5, heavyPrefix: 'hit_custom/hit_bone_heavy', heavyCount: 3 },
    flesh: { prefix: 'hit_custom/hit_flesh', count: 5, heavyPrefix: 'hit_custom/hit_flesh_heavy', heavyCount: 3 }
}

// 音量微调（新音效已优化，不需要大幅增强）
volumeBoost: {
    bird: 1.0,   // 清脆音效本身就很明显
    shell: 1.05, // 金属声略增强
    fur: 1.1,    // 毛皮略增强
    flesh: 1.05, // 肉体音效已有重量感
    slime: 1.15, // 史莱姆略增强
    bone: 1.1    // 骨骼碎裂声
}
```

### 暴击/击杀音效映射
- **暴击**: `shell_heavy` - 金属清脆的暴击感
- **击杀**: `bone_heavy` - 骨骼碎裂的终结感

---

## 📁 文件结构

```
assets/audio/
├── hit/                    # 旧音效（保留备用）
│   ├── impactBell_*.ogg
│   ├── impactSoft_*.ogg
│   └── ...
├── hit_custom/             # 新音效
│   ├── hit_bird_*.wav      # 8个变体
│   ├── hit_bone_*.wav      # 8个变体
│   ├── hit_flesh_*.wav     # 8个变体
│   ├── hit_fur_*.wav       # 8个变体
│   ├── hit_shell_*.wav     # 8个变体
│   └── hit_slime_*.wav     # 8个变体
└── weapons/                # 武器音效（不变）
```

---

## 🎯 预览工具

打开 `audio_preview_v2.html` 在浏览器中对比新旧音效：
- 左侧按钮播放新音效
- 右侧按钮播放旧音效
- 可调节主音量

---

## ⚡ 5轮迭代总结

| 轮次 | 内容 | 状态 |
|-----|------|------|
| 第11轮 | Flesh 重量感砰声 | ✅ 完成 |
| 第12轮 | Bone 碎裂 + Shell 金属 | ✅ 完成 |
| 第13轮 | Slime 湿润 + Fur 沉闷 | ✅ 完成 |
| 第14轮 | Bird 轻快音效 | ✅ 完成 |
| 第15轮 | AudioController 集成 | ✅ 完成 |

---

## 🔄 回滚方案

如需恢复旧音效，修改 `AudioController.js`：

```javascript
// 改回旧配置
hits: {
    bird: { prefix: 'impactBell_light', count: 1, heavyPrefix: 'impactBell_heavy', heavyCount: 1 },
    fur: { prefix: 'impactSoft_medium', count: 5, heavyPrefix: 'impactSoft_heavy', heavyCount: 5 },
    shell: { prefix: 'impactBell_light', count: 1, heavyPrefix: 'impactBell_heavy', heavyCount: 1 },
    slime: { prefix: 'impactGeneric_light', count: 4, heavyPrefix: 'impactGeneric_light', heavyCount: 4 },
    bone: { prefix: 'impactWood_light', count: 5, heavyPrefix: 'impactWood_heavy', heavyCount: 5 },
    flesh: { prefix: 'impactSoft_medium', count: 5, heavyPrefix: 'impactSoft_heavy', heavyCount: 5 }
}
```

---

*生成时间: 2026-03-04*  
*生成脚本: `generate_hit_sounds.py`*
