# 🎵 音效系统完整文档

## 文件结构

```
assets/audio/
├── weapons/          # 武器音效 (13个)
│   ├── whip_crack_...mp3      (鞭子)
│   ├── Heavy_scythe_slash_...mp3 (镰刀)
│   ├── knife_throw_v1.mp3     (飞刀)
│   ├── axe_throw_v1.mp3       (斧头)
│   ├── cross_launch_v1.mp3    (十字架)
│   ├── wand_cast_v1.mp3       (魔杖)
│   ├── fireball_v1.mp3        (火球)
│   ├── shuriken_v2.mp3        (手里剑)
│   ├── icicle_v2.mp3          (冰锥)
│   ├── lighting.ogg           (闪电)
│   ├── laser2.ogg             (激光)
│   ├── dart_shoot_v2.mp3      (毒镖)
│   └── bottle_broken_.mp3     (圣水/瓶子破碎)
├── hit/              # 命中音效 (28个)
│   ├── impactBell_light_000.ogg       (鸟类/硬壳 - 轻击)
│   ├── impactBell_heavy_004.ogg       (鸟类/硬壳 - 重击)
│   ├── impactSoft_medium_*.ogg        (毛皮/肉体 - 轻击 x5)
│   ├── impactSoft_heavy_*.ogg         (毛皮/肉体 - 重击 x5)
│   ├── impactGeneric_light_*.ogg      (史莱姆 - 轻击 x4)
│   ├── impactWood_light_*.ogg         (骨骼 - 轻击 x5)
│   ├── impactWood_heavy_*.ogg         (骨骼 - 重击 x5)
│   └── impactMetal_heavy_002.ogg      (金属 - 重击)
├── footstep/         # 脚步声 (25个)
│   ├── footstep_snow_*.ogg      (雪地 x5)
│   ├── footstep_grass_*.ogg     (草地 x5)
│   ├── footstep_concrete_*.ogg  (水泥 x5)
│   ├── footstep_wood_*.ogg      (木头 x5)
│   └── footstep_carpet_*.ogg    (地毯 x5)
└── ui/               # UI音效 (6个)
    ├── click_002.ogg                      (点击)
    ├── select_002.ogg                     (选择)
    ├── switch_001.ogg                     (切换)
    └── [其他在根目录的UI音效]

根目录其他音效：
- Character_level_up_...mp3    (升级)
- coin_pickup.mp3              (金币)
- exp-gain.ogg                 (经验/宝石)
- chest_open_...mp3            (宝箱)
- Magical_healing_spel_...mp3  (治疗)
- weapen_evolution_powe_...mp3 (武器进化)
- boss enter.ogg               (Boss登场)
```

## 音效调用映射表

### 1. 武器音效

| 武器ID | 音效文件名 | 备注 |
|--------|-----------|------|
| whip | whip_crack_...mp3 | 鞭子 |
| scythe | Heavy_scythe_slash_...mp3 | 镰刀 |
| knife | knife_throw_v1.mp3 | 飞刀 |
| axe | axe_throw_v1.mp3 | 斧头 |
| cross | cross_launch_v1.mp3 | 十字架 |
| wand | wand_cast_v1.mp3 | 魔杖 |
| fireball | fireball_v1.mp3 | 火球 |
| shuriken | shuriken_v2.mp3 | 手里剑 |
| icicle | icicle_v2.mp3 | 冰锥 |
| poison_dart | dart_shoot_v2.mp3 | 毒镖 |
| lightning | lighting.ogg | 闪电 |
| laser_sword | laser2.ogg | 激光剑 |
| holy_water | bottle_broken_.mp3 | 圣水 |
| bible | null | 无音效 |
| unholy_vespers | null | 无音效 |
| radiance | null | 无音效 |
| solar_radiance | null | 无音效 |

### 2. 命中音效 (根据敌人类型)

| 敌人类型 | 材质 | 普通音效 | 暴击/击杀音效 |
|----------|------|----------|--------------|
| chick, pigeon, duck3, bat, bee, goose, tiezhua | bird | impactBell_light | impactBell_heavy |
| mouse, rabbit2, panther, bear, fox, tiaotiao, yinya, wolf_king | fur | impactSoft_medium | impactSoft_heavy |
| snail, crab, nibei, turtle | shell | impactBell_light | impactBell_heavy |
| snake, ghost, mother | slime | impactGeneric_light | impactGeneric_light |
| mimic | bone | impactWood_light | impactWood_heavy |
| 默认 | flesh | impactSoft_medium | impactSoft_heavy |

### 3. UI/事件音效

| 事件 | 音效文件 | 调用方法 |
|------|----------|----------|
| 点击按钮 | ui/click_002.ogg | playUI('click') |
| 选择物品 | ui/select_002.ogg | playUI('select') |
| 切换/确认 | ui/switch_001.ogg | playUI('switch') |
| 获得金币 | coin_pickup.mp3 | playCoin() |
| 获得经验 | exp-gain.ogg | playExpGain() / playGem() |
| 升级 | Character_level_up_...mp3 | playLevelUp() |
| 开启宝箱 | chest_open_...mp3 | playChest() |
| 治疗 | Magical_healing_spel_...mp3 | playHeal() |
| 武器进化 | weapen_evolution_powe_...mp3 | playEvolve() |
| 购买物品 | ui/switch_001.ogg | playBuy() |
| Boss登场 | boss enter.ogg | playBossEnter() |

### 4. BGM

| 场景 | 类型 | 说明 |
|------|------|------|
| 主菜单 | menu | 合成BGM |
| 普通房间 | normal | 合成BGM |
| 隐藏房间 | elite | 合成BGM |
| Boss房间 | boss | 合成BGM |
| 胜利 | victory | 合成BGM |

## 游戏中的音效调用位置

| 调用位置 | 代码 | 说明 |
|----------|------|------|
| 武器攻击 | playWeapon(type) | updateWeapons() ~17486 |
| 命中敌人 | playHit(material, false) | applyDamage() ~21032 |
| 击杀敌人 | playHit(material, true) | applyDamage() ~21020 |
| 玩家受伤 | playHurt() | ~17321 |
| 获得金币 | playCoin() | ~17657, 17741 |
| 获得经验 | playGem() | ~17704, 17777 |
| 升级 | playLevelUp() | ~15420, 17709 |
| Boss攻击 | playHit('shell', true) | ~7658, 7677 |
| 宠物攻击 | play(sfxType) | Pet.attack() ~4705 |

## 修复记录

### v0.20.3 修复
1. ✅ 武器音效：每个武器独立映射，不再全部变成鞭子
2. ✅ 命中音效：根据敌人类型选择不同材质音效
3. ✅ 圣水音效：使用 bottle_broken_.mp3
4. ✅ Boss攻击：使用通用重击音效 (shell)
5. ✅ 圣经/辉耀：无音效
