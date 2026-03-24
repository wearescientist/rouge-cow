# 🎵 游戏音效需求与资源映射表

**生成时间**: 2026-03-04  
**用途**: 查漏补缺，明确每个音效对应关系

---

## 📊 总体统计

| 状态 | 数量 |
|------|------|
| ✅ 已有音效 | XX个 |
| ⚠️ 需要补充 | XX个 |
| 🎵 BGM | 5首（程序合成，无需文件） |

---

## 🎮 一、武器音效（13种）

| 武器 | 当前文件 | 状态 | 建议/问题 |
|------|----------|------|-----------|
| **鞭子** | `whip_crack_Sharp_lea_#1-1772612244854.wav` | ⚠️ | **格式错误! WAV需转OGG** |
| **镰刀** | `Heavy_scythe_slash_s_#4-1772612465296.wav` | ⚠️ | **格式错误! WAV需转OGG** |
| 飞刀 | `knife_throw_v1.mp3` | ✅ | 已配置 |
| 斧头 | `axe_throw_v1.mp3` | ✅ | 已配置 |
| 十字架 | `cross_launch_v1.mp3` | ✅ | 已配置 |
| 法杖 | `wand_cast_v1.mp3` | ✅ | 已配置 |
| 火球 | `fireball_v1.mp3` | ✅ | 已配置 |
| 手里剑 | `shuriken_v2.mp3` | ✅ | 已配置 |
| 冰锥 | `icicle_v2.mp3` | ✅ | 已配置 |
| 闪电 | `lighting.ogg` | ✅ | 已配置 |
| 激光 | `laser1.ogg`, `laser2.ogg` | ✅ | 已配置 |
| 飞镖 | `dart_shoot_v2.mp3` | ✅ | 已配置 |
| 毒药 | 无 | ❌ | **缺失! 需要添加 poison.ogg** |

### 🔧 需要格式转换（WAV → OGG）
```
weapons/whip_crack_Sharp_lea_#1-1772612244854.wav → whip.ogg
weapons/Heavy_scythe_slash_s_#4-1772612465296.wav → scythe.ogg
```

---

## 👹 二、怪物/命中音效（按材质分类）

### 当前游戏中怪物类型与材质对应：

| 怪物类型 | 材质 | 当前文件 | 建议音效 |
|----------|------|----------|----------|
| 普通怪物（史莱姆/蝙蝠等） | flesh | `hit/impactSoft_*.ogg` | ✅ 已匹配 |
| 骷髅/骷髅兵 | bone | 无 | ❌ **缺失 bone 音效** |
| 装甲怪物 | armor | `hit/impactMetal_*.ogg` | ✅ 已匹配 |
| 木乃伊/树人 | wood | `hit/impactWood_*.ogg` | ✅ 已匹配 |
| 石头怪/元素 | stone | 无 | ❌ **缺失 stone 音效** |
| 玻璃/水晶怪 | glass | `hit/impactGlass_*.ogg` | ✅ 已匹配 |
| Boss | boss | `boss enter.ogg` | ⚠️ 建议单独分类 |

### 命中音效文件清单：

| 文件名 | 用途 | 推荐怪物 |
|--------|------|----------|
| `impactBell_heavy_004.ogg` | 暴击/重击 | Boss |
| `impactBell_light_000.ogg` | 轻击 | 小怪 |
| `impactGeneric_light_*.ogg` | 通用轻击 | 通用 |
| `impactGlass_light_003.ogg` | 玻璃碎裂 | 水晶怪 |
| `impactMetal_heavy_002.ogg` | 金属重击 | 装甲怪 |
| `impactSoft_heavy_*.ogg` | 软体重击 | 史莱姆 |
| `impactSoft_medium_*.ogg` | 软体中击 | 史莱姆 |
| `impactWood_heavy_*.ogg` | 木头重击 | 树人 |
| `impactWood_light_*.ogg` | 木头轻击 | 木乃伊 |

### 缺失的音效：
- [ ] `hit/bone_crack.ogg` - 骨头断裂（骷髅类）
- [ ] `hit/stone_crack.ogg` - 石头碎裂（石头怪）

---

## 👣 三、脚步声（按地面材质）

### 当前游戏楼层/地面类型：

| 游戏场景 | 地面材质 | 当前文件 | 匹配度 |
|----------|----------|----------|--------|
| 普通房间（石砖） | concrete | `footstep_concrete_*.ogg` | ✅ 完美匹配 |
| 草地房间 | grass | `footstep_grass_*.ogg` | ✅ 完美匹配 |
| 雪地房间 | snow | `footstep_snow_*.ogg` | ✅ 完美匹配 |
| 图书馆/木屋 | wood | `footstep_wood_*.ogg` | ✅ 完美匹配 |
| 地毯房间（宝藏房） | carpet | `footstep_carpet_*.ogg` | ✅ 完美匹配 |

### 配置建议：
```javascript
const footstepSounds = {
    concrete: ['footstep_concrete_000.ogg', 'footstep_concrete_001.ogg', ...],
    grass: ['footstep_grass_000.ogg', ...],
    snow: ['footstep_snow_000.ogg', ...],
    wood: ['footstep_wood_000.ogg', ...],
    carpet: ['footstep_carpet_000.ogg', ...]
};
```

---

## 🎵 四、UI/事件音效

| 事件 | 当前文件 | 状态 | 备注 |
|------|----------|------|------|
| 点击/选择 | `ui/click_*.ogg`, `ui/select_002.ogg` | ✅ | 3个变体 |
| 切换 | `ui/switch_001.ogg` | ✅ | 已配置 |
| 升级 | `ui/lv up.ogg` | ✅ | 注意文件名有空格！ |
| 金币收集 | `coin_pickup.mp3` | ✅ | 已配置 |
| 经验获取 | `exp-gain.ogg` | ✅ | 已配置 |
| 打开宝箱 | 复用 `coin_pickup.mp3` | ⚠️ | 建议单独文件 |
| 购买 | 复用 `coin_pickup.mp3` | ⚠️ | 建议单独文件 |
| 进化 | 复用 `levelup` | ⚠️ | 建议单独文件 |
| 治疗 | 复用 `levelup` | ⚠️ | 建议单独文件 |
| 宝石收集 | 复用 `coin_pickup.mp3` | ⚠️ | 建议单独文件 |
| 传送门 | 无 | ❌ | **缺失 portal.ogg** |
| 警告 | 无 | ❌ | **缺失 warning.ogg** |
| 游戏结束 | 无 | ❌ | **缺失 gameover.ogg** |
| 伤害/受伤 | 无 | ❌ | **缺失 hurt.ogg** |
| 击杀 | 复用 `hit` | ⚠️ | 建议单独文件 |
| 波次开始 | 无 | ❌ | **缺失 wave.ogg** |
| 生成/召唤 | 无 | ❌ | **缺失 spawn.ogg** |

---

## 🎵 五、Boss音效

| 场景 | 当前文件 | 状态 |
|------|----------|------|
| Boss出场 | `boss enter.ogg`, `boss enter 2.ogg` | ✅ |

---

## 📋 六、缺失音效清单（待补充）

### 🔴 高优先级（必须补充）
1. `weapons/poison.ogg` - 毒液/毒药武器
2. `ui/gameover.ogg` - 游戏结束
3. `ui/hurt.ogg` - 玩家受伤
4. `ui/warning.ogg` - 警告提示
5. `ui/portal.ogg` - 传送门
6. `ui/wave_start.ogg` - 波次开始
7. `ui/spawn.ogg` - 怪物生成

### 🟡 中优先级（建议补充）
8. `hit/bone.ogg` - 骨头碎裂（骷髅类）
9. `hit/stone.ogg` - 石头碎裂（石头怪）
10. `ui/chest_open.ogg` - 打开宝箱（区分金币）
11. `ui/buy.ogg` - 购买物品
12. `ui/gem.ogg` - 宝石收集
13. `ui/evolve.ogg` - 进化音效
14. `ui/heal.ogg` - 治疗音效
15. `ui/kill.ogg` - 击杀确认

### 🟢 低优先级（可复用）
- 各种UI音效可复用现有文件

---

## 🔧 七、需要格式转换的文件

### WAV → OGG 转换清单

| 原文件 | 目标文件 | 用途 |
|--------|----------|------|
| `weapons/whip_crack_Sharp_lea_#1-1772612244854.wav` | `weapons/whip.ogg` | 鞭子武器 |
| `weapons/Heavy_scythe_slash_s_#4-1772612465296.wav` | `weapons/scythe.ogg` | 镰刀武器 |

---

## 🎵 八、BGM状态

当前5首BGM是**程序合成**的，不需要音频文件：
- ✅ menu（菜单）
- ✅ normal（普通房间）
- ✅ elite（精英房间）
- ✅ boss（Boss房间）
- ✅ victory（胜利）

如需要替换为MP3/OGG文件，需修改 AudioSystem.js。

---

## 📁 九、建议的文件结构

```
assets/audio/
├── weapons/          # 武器音效（13种）
├── hit/              # 命中音效（按材质分类）
├── footstep/         # 脚步声（按地面分类）
├── ui/               # UI音效
├── boss/             # Boss相关
└── bgm/              # 如需替换合成BGM
```

---

## ✅ 十、下一步行动

1. **格式转换**（WAV → OGG）
   - 鞭子、镰刀

2. **补充缺失音效**
   - poison, gameover, hurt, warning, portal, wave, spawn

3. **文件名规范化**
   - `lv up.ogg` 改为 `levelup.ogg`（去除空格）

4. **更新 AudioController.js**
   - 添加新的音效映射
