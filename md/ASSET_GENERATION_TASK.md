# 肉鸽牛牛 - 游戏素材生成任务清单

## 📋 项目概述

**游戏类型**: 吸血鬼幸存者风格 Roguelike  
**美术风格**: 像素艺术 (Pixel Art)  
**视角**: 俯视角，以撒的结合风格房间透视  
**房间尺寸**: 1800x1800 像素，墙厚 60px

---

## 🎨 第一部分：墙门贴图系统

### 设计规范

#### 透视风格（关键）
- **以撒的结合风格**: 从房间中心向四周看，四面墙都显示正面
- **上墙**: 显示墙的正面（从下往上看的效果）
- **下墙**: 显示墙的正面（从上往下看的效果）
- **左右墙**: 显示侧面/正面混合视角
- **门**: 嵌在墙上的入口，与墙平齐

#### 技术规格
| 参数 | 值 |
|------|-----|
| 格式 | PNG |
| 色彩模式 | RGB |
| 透明背景 | 否（实心纹理） |
| 墙贴图尺寸 | 64x64 像素 |
| 门贴图尺寸 | 80x64（上下门）/ 64x100（左右门） |
| 风格 | 像素艺术，暗黑奇幻 |

#### 文件命名规范
```
layer{楼层}_{类型}_{方向}.png

类型: wall / door
方向: top / bottom / left / right / corner_tl / corner_tr / corner_bl / corner_br

示例:
- layer1_wall_top.png      (第一层上墙)
- layer1_door_normal.png   (第一层普通门)
- layer1_door_boss.png     (第一层BOSS门)
```

---

### L1 菌丝区 (Mycelium)

**主题描述**: 被紫色真菌和菌丝覆盖的地下洞穴，白色孢子飘散，有机与矿物混合的诡异环境

**主色调**: 
- 深紫色: `#4A2C5A`
- 白色: `#E8E8E8` 
- 暗灰: `#2D2D3A`

#### 贴图清单

| 文件名 | 尺寸 | AI生成提示词 |
|--------|------|--------------|
| `layer1_wall_top.png` | 64x64 | Top-down dungeon wall texture viewed from room center, purple mycelium covering stone ceiling surface, white spores drifting down like snow, fungal growth hanging, wet organic texture with mineral base, pixel art 64x64 tile, dark purple and white color palette, Binding of Isaac perspective, game asset, seamless texture |
| `layer1_wall_bottom.png` | 64x64 | Dungeon floor wall texture, purple mycelium roots spreading on ground, stone base with fungal overgrowth, spore clusters, organic and mineral blend, pixel art 64x64, dark fantasy, top-down view |
| `layer1_wall_left.png` | 64x64 | Vertical dungeon wall side texture, stone pillar wrapped in purple fungal tendrils, mycelium veins running vertically, organic growth patterns, dark purple and gray, pixel art 64x64 tile |
| `layer1_wall_right.png` | 64x64 | Vertical dungeon wall side texture, mirror of left wall, purple fungal coverage on stone, mycelium patterns, pixel art 64x64 |
| `layer1_wall_corner_tl.png` | 64x64 | Wall corner top-left, stone intersection with purple mushrooms growing, fungal caps at corner, organic and mineral blend, pixel art 64x64 |
| `layer1_wall_corner_tr.png` | 64x64 | Wall corner top-right, stone intersection with bioluminescent fungi, purple glowing mushrooms, pixel art 64x64 |
| `layer1_wall_corner_bl.png` | 64x64 | Wall corner bottom-left, ground corner with mycelium roots, fungal base growth, pixel art 64x64 |
| `layer1_wall_corner_br.png` | 64x64 | Wall corner bottom-right, ground corner with spore clusters, organic texture, pixel art 64x64 |
| `layer1_door_normal.png` | 80x64 | Dungeon door top view, stone archway entrance covered in glowing purple mycelium, bioluminescent spores around frame, mysterious fungal gateway, pixel art 80x64, game asset |
| `layer1_door_boss.png` | 80x64 | Epic boss door, massive stone gate with pulsating purple fungal heart at center, veins of mycelium spreading across surface, glowing spore cloud, intimidating entrance, pixel art 80x64 |
| `layer1_door_secret.png` | 80x64 | Secret hidden door, entrance camouflaged as normal mycelium wall, barely visible outline, subtle difference from wall texture, mysterious concealed passage, pixel art 80x64 |

---

### L2 孵化温室 (Greenhouse)

**主题描述**: 巨大的生物孵化场，绿色的血肉组织，透明的孵化膜，内部可见胚胎，血管和脉搏

**主色调**:
- 病态绿: `#2D5A3D`
- 肉粉色: `#D4A5A5`
- 暗红: `#5A2D2D`

#### 贴图清单

| 文件名 | 尺寸 | AI生成提示词 |
|--------|------|--------------|
| `layer2_wall_top.png` | 64x64 | Top-down organic wall texture, green fleshy ceiling surface, pulsating veins visible, transparent membrane with silhouettes of embryos inside, wet biological texture, sickly green and pink colors, pixel art 64x64, biological horror, game asset |
| `layer2_wall_bottom.png` | 64x64 | Organic floor wall, green flesh ground with vein networks, biological tissue texture, organic horror aesthetic, pixel art 64x64 |
| `layer2_wall_left.png` | 64x64 | Vertical flesh pillar texture, green organic column with pulsing arteries, biological growth vertical patterns, wet organic surface, pixel art 64x64 |
| `layer2_wall_right.png` | 64x64 | Vertical flesh pillar, mirror texture, organic column with vein details, green and pink, pixel art 64x64 |
| `layer2_wall_corner_tl.png` | 64x64 | Flesh corner top-left, organic tissue intersection, vein network junction, membrane texture, pixel art 64x64 |
| `layer2_wall_corner_tr.png` | 64x64 | Flesh corner top-right, biological corner with embryonic sacs, organic horror, pixel art 64x64 |
| `layer2_wall_corner_bl.png` | 64x64 | Flesh corner bottom-left, ground organic intersection, root-like veins, pixel art 64x64 |
| `layer2_wall_corner_br.png` | 64x64 | Flesh corner bottom-right, organic ground corner, biological texture, pixel art 64x64 |
| `layer2_door_normal.png` | 80x64 | Fleshy membrane door, biological entrance with pulsating heartbeat visible at center, vein patterns framing doorway, organic gateway, living door texture, pixel art 80x64 |
| `layer2_door_boss.png` | 80x64 | Massive biological heart-door, giant beating organ as gate, embryo chambers visible inside transparent membrane, epic scale living entrance, biological horror boss door, pixel art 80x64 |
| `layer2_door_secret.png` | 80x64 | Hidden flesh door, secret entrance camouflaged as wall membrane, barely discernible seam in organic tissue, concealed biological passage, pixel art 80x64 |

---

### L3 神经索 (Nerve)

**主题描述**: 巨大的神经网络，粉色脑组织，电信号脉冲，突触连接，生物电闪烁

**主色调**:
- 粉色: `#E8A5C8`
- 紫色: `#8B4A8B`
- 电蓝: `#4A8BE8`

#### 贴图清单

| 文件名 | 尺寸 | AI生成提示词 |
|--------|------|--------------|
| `layer3_wall_top.png` | 64x64 | Top-down neural wall texture, pink brain matter ceiling, gyri and sulci patterns, electrical pulses traveling through neural pathways, synaptic connections visible as glowing points, pink and purple with electric blue sparks, pixel art 64x64, sci-fi biological, game asset |
| `layer3_wall_bottom.png` | 64x64 | Neural floor texture, pink brain tissue ground, neural network patterns, electric synapse firing, pixel art 64x64 |
| `layer3_wall_left.png` | 64x64 | Vertical neural pillar, brain tissue column with synaptic connections, electrical sparks running vertically, pink neural texture, pixel art 64x64 |
| `layer3_wall_right.png` | 64x64 | Vertical neural pillar, mirror texture, brain column with electric activity, pink and purple, pixel art 64x64 |
| `layer3_wall_corner_tl.png` | 64x64 | Neural corner top-left, synapse junction, electric node, brain tissue intersection, pixel art 64x64 |
| `layer3_wall_corner_tr.png` | 64x64 | Neural corner top-right, synaptic cluster corner, electric glow, pixel art 64x64 |
| `layer3_wall_corner_bl.png` | 64x64 | Neural corner bottom-left, brain tissue ground corner, neural roots, pixel art 64x64 |
| `layer3_wall_corner_br.png` | 64x64 | Neural corner bottom-right, synaptic ground junction, pink neural texture, pixel art 64x64 |
| `layer3_door_normal.png` | 80x64 | Synaptic door, neural pathway entrance framed by brain tissue, electric sparks and arcs around doorway, synaptic transmission glow, pink neural gateway, pixel art 80x64 |
| `layer3_door_boss.png` | 80x64 | Epic neural gate, massive brain tissue archway with intense electrical storm inside, synaptic firing at maximum intensity, crackling energy boss entrance, pixel art 80x64 |
| `layer3_door_secret.png` | 80x64 | Hidden neural passage, camouflaged brain tissue door, secret synapse pathway, barely visible electrical signature, concealed entrance, pixel art 80x64 |

---

### L4 消化熔炉 (Furnace)

**主题描述**: 火山熔岩地带，焦黑岩石，裂缝中流动的岩浆，热浪扭曲，余烬飘落

**主色调**:
- 焦黑: `#1A0F0A`
- 熔岩橙: `#FF6B35`
- 暗红: `#8B1A1A`

#### 贴图清单

| 文件名 | 尺寸 | AI生成提示词 |
|--------|------|--------------|
| `layer4_wall_top.png` | 64x64 | Top-down volcanic wall texture, charred black rock ceiling surface, glowing orange lava cracks emitting heat, embers falling down, heat distortion effect, black and orange color palette, magma veins, pixel art 64x64, lava dungeon, game asset |
| `layer4_wall_bottom.png` | 64x64 | Volcanic floor texture, cooling lava ground, cracked magma surface, heat glow from below, black and orange, pixel art 64x64 |
| `layer4_wall_left.png` | 64x64 | Vertical magma pillar, volcanic rock column with lava flows, cooling stone with glowing cracks, heat shimmer, pixel art 64x64 |
| `layer4_wall_right.png` | 64x64 | Vertical magma pillar, mirror texture, volcanic column with fire cracks, orange glow, pixel art 64x64 |
| `layer4_wall_corner_tl.png` | 64x64 | Volcanic corner top-left, rock intersection with lava flow, magma vein junction, pixel art 64x64 |
| `layer4_wall_corner_tr.png` | 64x64 | Volcanic corner top-right, magma pool corner, fire and rock, pixel art 64x64 |
| `layer4_wall_corner_bl.png` | 64x64 | Volcanic corner bottom-left, cooled lava ground corner, cracked surface, pixel art 64x64 |
| `layer4_wall_corner_br.png` | 64x64 | Volcanic corner bottom-right, magma crust corner, heat distortion, pixel art 64x64 |
| `layer4_door_normal.png` | 80x64 | Lava forge gate, stone archway with molten metal door, volcanic rock frame, intense orange fire glowing from within, heat waves visible, forge entrance, pixel art 80x64 |
| `layer4_door_boss.png` | 80x64 | Epic magma gateway, massive volcanic gate with flowing lava cascade, intense heat distortion, legendary fire boss entrance, dramatic orange glow, pixel art 80x64 |
| `layer4_door_secret.png` | 80x64 | Hidden volcanic passage, cooled lava secret door, heat shimmer camouflage, concealed magma tunnel entrance, barely visible outline, pixel art 80x64 |

---

### L5 母虫庭院 (Courtyard)

**主题描述**: 虫族母巢，黑色几丁质甲壳，尖刺装饰，光泽表面，昆虫巢穴

**主色调**:
- 黑色: `#0A0A0A`
- 暗红: `#4A1515`
- 甲壳棕: `#3D2D1A`

#### 贴图清单

| 文件名 | 尺寸 | AI生成提示词 |
|--------|------|--------------|
| `layer5_wall_top.png` | 64x64 | Top-down chitinous wall texture, black insect exoskeleton ceiling surface, segmented shell patterns, sharp spikes protruding downward, glossy carapace with organic shine, black and dark red colors, bug hive aesthetic, pixel art 64x64, insectoid dungeon, game asset |
| `layer5_wall_bottom.png` | 64x64 | Chitinous floor texture, insect hive ground, exoskeleton fragments, beetle shell patterns, dark organic surface, pixel art 64x64 |
| `layer5_wall_left.png` | 64x64 | Vertical chitin pillar, insect shell column with segmented texture, spiky protrusions, glossy black surface, pixel art 64x64 |
| `layer5_wall_right.png` | 64x64 | Vertical chitin pillar, mirror texture, exoskeleton column with spike details, black and dark red, pixel art 64x64 |
| `layer5_wall_corner_tl.png` | 64x64 | Chitin corner top-left, exoskeleton intersection, spike cluster at corner, insect architecture, pixel art 64x64 |
| `layer5_wall_corner_tr.png` | 64x64 | Chitin corner top-right, shell corner with pincer-like protrusion, bug hive texture, pixel art 64x64 |
| `layer5_wall_corner_bl.png` | 64x64 | Chitin corner bottom-left, hive ground corner, exoskeleton debris, pixel art 64x64 |
| `layer5_wall_corner_br.png` | 64x64 | Chitin corner bottom-right, insect hive ground junction, dark organic texture, pixel art 64x64 |
| `layer5_door_normal.png` | 80x64 | Chitinous insect door, exoskeleton archway entrance with pincer-like door frame, segmented shell texture, biological insect architecture, hive gateway, pixel art 80x64 |
| `layer5_door_boss.png` | 80x64 | Massive chitin gate, queen insect boss door, royal exoskeleton patterns with crown-like spikes, epic scale bug entrance, intimidating hive portal, dark and glossy, pixel art 80x64 |
| `layer5_door_secret.png` | 80x64 | Hidden chitin door, camouflaged exoskeleton entrance, secret bug passage concealed in hive wall, barely visible seam in shell texture, pixel art 80x64 |

---

### L6 千根之心 (Core)

**主题描述**: 最终区域，古老神圣的金色建筑，红色能量核心，神圣几何，庄严而危险

**主色调**:
- 金色: `#FFD700`
- 深红: `#8B0000`
- 暗金: `#B8860B`

#### 贴图清单

| 文件名 | 尺寸 | AI生成提示词 |
|--------|------|--------------|
| `layer6_wall_top.png` | 64x64 | Top-down divine wall texture, golden ancient temple ceiling, ornate sacred architecture patterns, crimson energy core veins running through gold, holy geometry symbols, divine and ominous atmosphere, gold and crimson color palette, pixel art 64x64, godlike dungeon, game asset |
| `layer6_wall_bottom.png` | 64x64 | Divine floor texture, golden temple tiles with red energy lines, sacred ground patterns, ancient architecture base, pixel art 64x64 |
| `layer6_wall_left.png` | 64x64 | Vertical golden pillar, divine architecture column with crimson energy channels, ornate sacred patterns, holy gold texture, pixel art 64x64 |
| `layer6_wall_right.png` | 64x64 | Vertical golden pillar, mirror texture, divine column with energy veins, gold and crimson, pixel art 64x64 |
| `layer6_wall_corner_tl.png` | 64x64 | Divine corner top-left, golden architecture intersection, energy nexus, sacred geometry corner, pixel art 64x64 |
| `layer6_wall_corner_tr.png` | 64x64 | Divine corner top-right, ornate gold corner with crimson glow, holy symbols, pixel art 64x64 |
| `layer6_wall_corner_bl.png` | 64x64 | Divine corner bottom-left, temple ground corner, golden tile junction, pixel art 64x64 |
| `layer6_wall_corner_br.png` | 64x64 | Divine corner bottom-right, sacred ground corner, gold and red texture, pixel art 64x64 |
| `layer6_door_normal.png` | 80x64 | Ancient golden gateway, divine temple door with glowing red energy center, ornate sacred patterns framing entrance, holy yet ominous portal, gold and crimson, pixel art 80x64 |
| `layer6_door_boss.png` | 80x64 | Epic divine gate, massive golden portal with intense crimson energy core, godlike boss entrance, legendary sacred architecture, powerful and intimidating, final boss door, pixel art 80x64 |
| `layer6_door_secret.png` | 80x64 | Hidden sacred passage, camouflaged golden door, secret divine entrance concealed in temple wall, subtle energy signature difference, concealed holy passage, pixel art 80x64 |

---

## 🔊 第二部分：音效系统

### 技术规格

| 参数 | 值 |
|------|-----|
| 格式 | MP3 (首选) / WAV |
| 采样率 | 44100 Hz |
| 比特率 | 192kbps+ |
| 声道 | 立体声 (环境) / 单声道 (UI) |

---

### A. 武器音效 (Weapon SFX)

**目标**: 8种武器 × 2-3个变体 = 24个文件

| 文件名 | 时长 | 描述/参考 |
|--------|------|-----------|
| `whip_swing_01.mp3` | 0.3s | Leather whip cutting air, sharp crack, satisfying whoosh |
| `whip_swing_02.mp3` | 0.3s | Heavier whip impact feel, more bass |
| `whip_swing_03.mp3` | 0.25s | Faster lighter whip swing |
| `wand_cast_01.mp3` | 0.4s | Magic missile launch, energy projectile, mystical whoosh with sparkle tail |
| `wand_cast_02.mp3` | 0.4s | Higher pitch crystal resonance, magical chime |
| `knife_throw_01.mp3` | 0.2s | Metal spinning through air, sharp whistle, blade cutting wind |
| `knife_throw_02.mp3` | 0.2s | Stealthy dagger throw, quick slice sound |
| `axe_swing_01.mp3` | 0.4s | Heavy brutal impact, metal whoosh, weighty feel |
| `axe_swing_02.mp3` | 0.4s | Wooden handle sound with heavy grunt impact |
| `bible_orbit_01.mp3` | 0.5s | Holy book pages fluttering, sacred aura hum, heavenly choir faint |
| `bible_orbit_02.mp3` | 0.6s | Louder prayer chant echo, powerful sacred sound |
| `fireball_cast_01.mp3` | 0.5s | Flame whoosh launch, explosive ignition, fire burst |
| `fireball_cast_02.mp3` | 0.5s | Crackling flames, intense heat sound, roaring fire |
| `lightning_cast_01.mp3` | 0.4s | Electric crack, thunder boom, energy surge |
| `lightning_cast_02.mp3` | 0.4s | Chain lightning arc, multiple electric zaps |
| `garlic_aura_01.mp3` | 0.5s | Gas spray release, toxic hiss, chemical cloud |
| `garlic_aura_02.mp3` | 0.6s | Aura activation, poison mist, continuous hiss with bubble |

---

### B. 受击与死亡音效 (Combat SFX)

**目标**: 16个文件

| 文件名 | 时长 | 描述/参考 |
|--------|------|-----------|
| `enemy_hit_light_01.mp3` | 0.2s | Flesh impact, punch sound, organic hit |
| `enemy_hit_light_02.mp3` | 0.2s | Light slash, blade cutting, quick slice |
| `enemy_hit_light_03.mp3` | 0.15s | Small impact, squish sound, tiny creature hit |
| `enemy_hit_heavy_01.mp3` | 0.3s | Heavy impact, bone crunch, brutal hit |
| `enemy_hit_heavy_02.mp3` | 0.3s | Critical strike, explosive impact, powerful |
| `enemy_death_small_01.mp3` | 0.4s | Bug death, insect crunch, small creature death |
| `enemy_death_small_02.mp3` | 0.4s | Small enemy poof, dissolve into particles |
| `enemy_death_small_03.mp3` | 0.3s | Tiny death squeak, organic pop |
| `enemy_death_medium_01.mp3` | 0.5s | Beast death, animal cry, guttural final roar |
| `enemy_death_medium_02.mp3` | 0.5s | Monster death, roar cut short, heavy impact |
| `elite_death_01.mp3` | 0.8s | Elite death, dramatic scream, power release explosion |
| `boss_death_01.mp3` | 2.0s | Boss death, epic explosion, massive impact, screen shake sound, building crescendo |
| `player_hurt_01.mp3` | 0.3s | Player pain grunt, flesh wound, male voice |
| `player_hurt_02.mp3` | 0.3s | Sharp intake of breath, painful reaction |
| `player_hurt_03.mp3` | 0.4s | Heavy player damage, critical hit reaction, desperate |
| `player_death_01.mp3` | 1.5s | Player death, final scream, soul release, dramatic end |

---

### C. 环境音效 (Ambient SFX)

**目标**: 9个文件（6个循环环境 + 3个脚步声）

| 文件名 | 时长 | 描述/参考 |
|--------|------|-----------|
| `ambient_layer1_mycelium.mp3` | 60s loop | Spores falling, fungal whispers, organic ambience, subtle wind, mysterious cave |
| `ambient_layer2_greenhouse.mp3` | 60s loop | Heartbeat thumping, liquid bubbles, womb-like sounds, organic pulse |
| `ambient_layer3_nerve.mp3` | 60s loop | Electrical pulses, synaptic firing, brain wave hums, electric buzz |
| `ambient_layer4_furnace.mp3` | 60s loop | Lava bubbling, fire crackling, heat ambience, deep rumble |
| `ambient_layer5_courtyard.mp3` | 60s loop | Insect chittering, carapace rustling, hive mind sounds, skittering |
| `ambient_layer6_core.mp3` | 60s loop | Divine hum, energy core resonance, powerful bass, sacred ominous tone |
| `footstep_mycelium_01.mp3` | 0.2s | Single step on squishy organic surface, wet surface sound |
| `footstep_mycelium_02.mp3` | 0.2s | Step variation, sticky residue pull |
| `footstep_flesh_01.mp3` | 0.2s | Step on meat, organic texture, squelch sound |

---

### D. UI与交互音效 (UI SFX)

**目标**: 16个文件

| 文件名 | 时长 | 描述/参考 |
|--------|------|-----------|
| `ui_levelup.mp3` | 1.0s | Level up, divine chime, power surge, satisfying magical ding with flourish |
| `ui_weapon_get.mp3` | 0.5s | Equip item, metal sheathe sound, weighty feel, acquisition |
| `ui_chest_open.mp3` | 0.6s | Treasure chest wooden creak, loot reveal sparkle, rewarding |
| `ui_coin_01.mp3` | 0.2s | Gold coin pickup, metallic cling, small satisfying |
| `ui_coin_02.mp3` | 0.2s | Coin variation, higher pitch, lighter |
| `ui_coin_03.mp3` | 0.3s | Multiple coins, richer layered sound |
| `ui_gem_01.mp3` | 0.4s | Experience orb pickup, energy absorption, magical whoosh |
| `ui_gem_02.mp3` | 0.4s | Gem pickup, crystal resonance, chime |
| `ui_evolve.mp3` | 2.0s | Super weapon evolution, epic transformation, power surge, legendary fanfare |
| `ui_buy.mp3` | 0.4s | Shop transaction, coin bag jingle, merchant sound |
| `ui_hover.mp3` | 0.1s | Button hover, subtle mechanical tick |
| `ui_click.mp3` | 0.15s | Button click, crisp confirm, UI feedback |
| `ui_wave_start.mp3` | 1.5s | Wave warning, alarm bell, tension building, enemy incoming alert |
| `ui_portal.mp3` | 1.0s | Portal activation, dimensional warp, transport sound, magical vortex |
| `ui_victory.mp3` | 3.0s | Victory fanfare, triumphant horns, celebration music sting |
| `ui_defeat.mp3` | 2.0s | Game over, sad trombone, dark requiem, failure sting |

---

### E. 特殊音效 (Special SFX)

**目标**: 3个文件

| 文件名 | 时长 | 描述/参考 |
|--------|------|-----------|
| `door_open.mp3` | 0.8s | Heavy stone door grinding open, mechanism sound, dungeon creak |
| `door_close.mp3` | 0.6s | Door slam impact, echo, finality, heavy thud |
| `heal.mp3` | 0.5s | Healing spell, light sparkle, life restore, magical recovery chime |

---

## 📊 汇总统计

| 类别 | 数量 | 格式 |
|------|------|------|
| 墙门贴图 | 66张 (6层×11张) | PNG 64x64/80x64 |
| 武器音效 | 18个 | MP3 |
| 受击死亡音效 | 16个 | MP3 |
| 环境音效 | 9个 | MP3 (6个循环) |
| UI音效 | 16个 | MP3 |
| 特殊音效 | 3个 | MP3 |
| **总计** | **66贴图 + 62音效** | - |

---

## ✅ 验收标准

### 贴图验收
- [ ] 所有贴图为64x64或80x64像素
- [ ] 无透明背景，实心纹理
- [ ] 像素艺术风格统一
- [ ] 每层主题色彩一致
- [ ] 以撒风格透视正确（正面视角）

### 音效验收
- [ ] 音量平衡，无爆音
- [ ] 环境音效可无缝循环
- [ ] 所有音效风格统一（奇幻暗黑）
- [ ] 文件命名符合规范
- [ ] 音质清晰，192kbps+

---

## 📁 输出目录结构

```
assets/
├── sprites/
│   └── tiles/
│       └── walls/
│           ├── layer1/
│           │   ├── layer1_wall_top.png
│           │   ├── layer1_wall_bottom.png
│           │   ├── layer1_wall_left.png
│           │   ├── layer1_wall_right.png
│           │   ├── layer1_wall_corner_tl.png
│           │   ├── layer1_wall_corner_tr.png
│           │   ├── layer1_wall_corner_bl.png
│           │   ├── layer1_wall_corner_br.png
│           │   ├── layer1_door_normal.png
│           │   ├── layer1_door_boss.png
│           │   └── layer1_door_secret.png
│           ├── layer2/ (同上结构)
│           ├── layer3/
│           ├── layer4/
│           ├── layer5/
│           └── layer6/
└── sounds/
    ├── weapons/
    │   ├── whip_swing_01.mp3
    │   ├── whip_swing_02.mp3
    │   └── ...
    ├── combat/
    │   ├── enemy_hit_light_01.mp3
    │   └── ...
    ├── ambient/
    │   ├── ambient_layer1_mycelium.mp3
    │   └── ...
    ├── ui/
    │   ├── ui_levelup.mp3
    │   └── ...
    └── special/
        ├── door_open.mp3
        └── ...
```

---

## 🎯 Agent分配建议

| Agent | 任务 | 数量 |
|-------|------|------|
| Agent-1 | L1菌丝区贴图 (11张) | 11 |
| Agent-2 | L2孵化温室贴图 (11张) | 11 |
| Agent-3 | L3神经索贴图 (11张) | 11 |
| Agent-4 | L4消化熔炉贴图 (11张) | 11 |
| Agent-5 | L5母虫庭院贴图 (11张) | 11 |
| Agent-6 | L6千根之心贴图 (11张) | 11 |
| Agent-7 | 武器音效 | 18 |
| Agent-8 | 受击死亡音效 | 16 |
| Agent-9 | 环境音效 + 特殊音效 | 12 |
| Agent-10 | UI音效 | 16 |

---

**生成工具推荐**: 
- 贴图: Midjourney, Stable Diffusion (Pixel Art LoRA)
- 音效: ElevenLabs Sound Effects, Freesound.org, Epidemic Sound

**优先级**: P0 (最高) - 贴图和武器音效必须先生成，其他可分批
