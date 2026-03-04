# 【Agent集群任务】肉鸽牛牛完整贴图资源生成项目

## 项目概览

**项目名称**: 肉鸽牛牛 (Rouge Cow)  
**游戏类型**: 吸血鬼幸存者-like Roguelike  
**艺术风格**: 32x32像素艺术，俯视角，暗黑奇幻+黑色幽默  
**故事背景**: 《深根之疫》- 主角牛牛深入地下洞穴拯救被寄生感染的动物伙伴  
**总贴图数量**: 约110个  
**优先级**: P0(必须) > P1(重要) > P2(增强) > P3(可选)  

---

## 核心风格指南（所有Agent必须遵守）

### 调色板系统
```
主色调（大地色系）:
  #8A6A4A - 棕褐（主体色）
  #5A3A2A - 深棕（阴影/轮廓）
  #E8B860 - 琥珀（高光）
  #C4A030 - 金色（特殊标记）
  
感染/变异色调:
  #E8F0E8 - 苍白感染白
  #C0D0C0 - 菌丝灰绿
  #90B090 - 孢子绿
  #60A060 - 粘液深绿
  
层级主题色:
  Layer 1 菌丝区: 苍白+灰绿
  Layer 2 温室: 绿色+黄色
  Layer 3 神经: 紫色+蓝色
  Layer 4 熔炉: 橙色+红色
  Layer 5 庭院: 血红+金色
  Layer 6 核心: 深紫+黑金
```

### 技术规范
- **分辨率**: 32x32像素（角色/道具），64x64（地形），16x16（图标）
- **色彩深度**: 限制调色板，每图不超过16色
- **轮廓**: 2-3像素深色轮廓线
- **阴影**: 45度角投影，1-2像素
- **高光**: 顶部/左侧1-2像素亮色
- **格式**: PNG透明背景
- **命名**: 小写+下划线，如 `infected_chick_walk_01.png`

### 视觉风格关键词
`pixel art` `top-down` `32x32` `limited palette` `roguelike` `vampire survivors style` `dark fantasy` `cute but creepy` `infected animals` `bioluminescent` `mycelium` `transparent background`

---

## 任务分配清单

### 【Agent A】主角牛牛 - 优先级P0
**任务**: 主角全套动画精灵表
**数量**: 1个角色 × 8帧 = 8张图 或 1张精灵表
**交付**: `player_bison_spritesheet.png` (256x32 或 8张32x32)

**详细规格**:
```
角色: 牛牛，年轻奶牛，地脉共鸣者
特征: 
  - 健壮身体
  - 弯曲金色双角（根部有发光纹路）
  - 黑色小眼睛，坚定眼神
  - 短粗尾巴
  
动画帧需求:
  Frame 1: 站立正面
  Frame 2: 行走左步（左腿前）
  Frame 3: 站立正面（微晃）
  Frame 4: 行走右步（右腿前）
  Frame 5: 冲刺姿态（身体前倾，角发光）
  Frame 6: 受击后仰（闭眼，角暗淡）
  Frame 7: 攻击姿态（低头冲撞）
  Frame 8: 胜利/待机动画（角发光闪烁）

色彩: 
根据参考原图
```

---

### 【Agent B】武器系统（8种）- 优先级P0
**任务**: 8种基础武器图标
**数量**: 8张图
**交付**: `weapon_[name].png` (8个文件)

**详细规格**:
```
1. weapon_whip.png - 荆棘血鞭
   描述: 带刺的血红色鞭子，有血迹飞溅效果
   颜色: 深红 #8A1A1A, 黑色 #2A2A3A, 血迹 #FF4A4A
   
2. weapon_wand.png - 水晶魔杖
   描述: 顶端有紫色水晶的法杖，散发微光
   颜色: 棕柄 #8A6A4A, 水晶 #9A6ABA, 光芒 #C09AE0
   
3. weapon_knife.png - 飞刀组
   描述: 3把重叠的锋利飞刀，刀柄缠红布
   颜色: 银刃 #D0D0E0, 红布 #C48A8A, 阴影 #4A4A5A
   
4. weapon_axe.png - 双刃战斧
   描述: 巨大双刃斧头，铁锈质感
   颜色: 铁灰 #7A7A8A, 木柄 #5A3A2A, 锈迹 #C47A2A
   
5. weapon_bible.png - 悬浮圣经
   描述: 古老书本悬浮，书页翻动，紫光环绕
   颜色: 书皮 #6A3A8A, 书页 #E8F0E8, 光芒 #9A6ABA
   
6. weapon_fireball.png - 燃烧火球
   描述: 火焰球体，中心白亮，外层橙红
   颜色: 中心白 #F0F0E0, 内层黄 #E0A030, 外层红 #A03020
   
7. weapon_lightning.png - 闪电符号
   描述: Z形闪电，电光闪烁效果
   颜色: 亮蓝 #4A9A9A, 白芯 #D0D0E0, 光晕 #C09AE0
   
8. weapon_holywater.png - 圣水瓶
   描述: 玻璃瓶装有发光蓝绿液体，金色瓶塞
   颜色: 液体 #5A9A9A, 瓶子透明, 瓶塞 #C4A030
```

**统一提示词前缀**:
```
Top-down pixel art weapon icon, 32x32 pixels, [weapon description], 
limited color palette, transparent background, game asset, 
vampire survivors inspired art style
```

---

### 【Agent C】道具系统（16种核心）- 优先级P0
**任务**: 16个核心道具图标
**数量**: 16张图
**交付**: `item_[id]_[name].png`

**详细规格**（按类别分组）:
```
【攻击类 - 6个】
item_01_spinach.png - 菠菜（伤害+10%）
  描述: 新鲜菠菜叶，绿色发光
  颜色: #4A6A3A, #60A060

item_02_brace.png - 护腕（投射物速度）
  描述: 皮质护腕，带金属钉
  颜色: #8A6A4A, #7A7A8A

item_03_hollowheart.png - 空心心（生命上限）
  描述: 金色心形容器，镂空设计
  颜色: #C4A030, #E8B860

item_04_candelabrador.png - 烛台（范围）
  描述: 三头烛台，火焰跳动
  颜色: #C47A2A, #E0A030

item_05_spellbinder.png - 法术书（持续时间）
  描述: 厚重魔法书，发光符文
  颜色: #6A3A8A, #9A6ABA

item_06_duplicator.png - 复制器（投射物数量）
  描述: 神秘装置，分裂符号
  颜色: #C4A030, #4A9A9A

【防御类 - 5个】
item_07_armor.png - 铁甲（减伤）
  描述: 胸甲碎片，金属质感
  颜色: #7A7A8A, #4A4A5A

item_08_wings.png - 翅膀（移速）
  描述: 小型羽翼，轻盈
  颜色: #D0D0E0, #E8F0E8

item_09_attractorb.png - 磁铁（拾取范围）
  描述: U形磁铁，散发波纹
  颜色: #C4A030, #A03020

item_10_crown.png - 王冠（金币加成）
  描述: 迷你金冠，宝石点缀
  颜色: #C4A030, #A03020

item_11_shield.png - 盾牌（格挡）
  描述: 圆盾，有划痕
  颜色: #7A7A8A, #5A3A2A

【特殊类 - 5个】
item_12_clover.png - 四叶草（幸运）
  描述: 发光四叶草
  颜色: #60A060, #C4A030

item_13_skull.png - 骷髅（诅咒/狂暴）
  描述: 红色眼窝骷髅
  颜色: #E8F0E8, #FF4A4A

item_14_ring.png - 戒指（特殊能力）
  描述: 金色指环，宝石
  颜色: #C4A030, #9A6ABA

item_15_liquid.png - 试管（随机效果）
  描述: 冒泡药水，彩色
  颜色: #60A060, #E0A030

item_16_egg.png - 蛋（宠物/孵化）
  描述: 斑点蛋，微动
  颜色: #E8F0E8, #C47A2A
```

**道具统一风格**:
- 漂浮效果（底部阴影）
- 微光/发光（神器感）
- 简洁轮廓（小尺寸可识别）

---

### 【Agent D】地形系统（6层）- 优先级P1
**任务**: 6层地图地板tileset
**数量**: 6张64x64基础图（可无缝拼接）
**交付**: `floor_layer[1-6].png`

**详细规格**:
```
layer1_floor_mycelium.png (64x64 tileable)
  主题: 菌丝蔓延区 - 苍白病态
  描述: 灰白色地面，有丝状菌丝纹理，偶尔有发光斑点
  主色: #E8F0E8, #C0D0C0, #90B090
  细节: 菌丝网络，孢子囊泡

layer2_floor_greenhouse.png (64x64 tileable)
  主题: 孵化温室 - 有机生长
  描述: 绿色肉质地面，有血管状纹理，湿润光泽
  主色: #4A6A3A, #60A060, #7A9A6A
  细节: 脉络纹理，孵化囊

layer3_floor_nerve.png (64x64 tileable)
  主题: 神经索网络 - 紫色神秘
  描述: 紫灰色地面，有神经纤维纹理，脉动光效
  主色: #6A3A8A, #9A6ABA, #C09AE0
  细节: 神经节点，电光纹路

layer4_floor_furnace.png (64x64 tileable)
  主题: 消化熔炉 - 灼热危险
  描述: 橙红色地面，有裂纹和熔岩纹理，热气扭曲
  主色: #C47A2A, #E0A030, #A03020
  细节: 熔岩裂纹，气泡

layer5_floor_courtyard.png (64x64 tileable)
  主题: 母虫庭院 - 血红恐怖
  描述: 深红色肉质地面，有巨大脉动血管
  主色: #8A1A1A, #FF4A4A, #6A3A8A
  细节: 主血管，心跳脉动

layer6_floor_core.png (64x64 tileable)
  主题: 千根之心 - 黑暗核心
  描述: 深紫黑色地面，金色纹路，神圣与恐怖并存
  主色: #1A0D1A, #0A050A, #FFD700
  细节: 金纹，微光
```

**技术要求**:
- 64x64像素，可无缝拼接（seamless tile）
- 提供2-3个变体（variations）避免重复感
- 中心区域简洁（敌人站立位置）

---

### 【Agent E】墙壁与门系统 - 优先级P1
**任务**: 墙壁组件 + 门状态
**数量**: 约15张图
**交付**: `wall_*.png`, `door_*.png`

**详细规格**:
```
【墙壁组件】
wall_vertical.png (32x64)
  描述: 垂直墙壁，与地面主题匹配，有纹理
  
wall_horizontal.png (64x32)
  描述: 水平墙壁

wall_corner_tl.png (32x32) - 左上转角
wall_corner_tr.png (32x32) - 右上转角
wall_corner_bl.png (32x32) - 左下转角
wall_corner_br.png (32x32) - 右下转角

【门组件】
door_frame.png (48x48)
  描述: 门框，与墙壁材质一致

door_closed.png (48x48)
  描述: 关闭的门，红色X标记，封锁状态
  颜色: 深红 #8A1A1A, 警示X

door_open.png (48x48)
  描述: 打开的门，通道，微光透出
  颜色: 黑色通道，边缘光

door_locked.png (48x48)
  描述: 上锁的门，锁链/符文
  颜色: 金色锁 #C4A030

door_boss.png (64x64)
  描述: Boss房门，更大更华丽
  颜色: 血红+金边

door_secret.png (48x48)
  描述: 隐藏门，与墙壁相似但有细微差别
  颜色: 与墙同色+几乎不可见
```

**风格统一**: 墙壁与地面同层主题色匹配

---

### 【Agent F】UI系统 - 优先级P1
**任务**: 全套游戏UI元素
**数量**: 约20张图
**交付**: `ui_*.png`

**详细规格**:
```
【血条系统】
ui_heart_full.png (16x16) - 满血红心
ui_heart_half.png (16x16) - 半血心
ui_heart_empty.png (16x16) - 空心血槽
ui_heart_gold.png (16x16) - 额外生命（金色心）

【资源条】
ui_bar_hp_bg.png (128x16) - HP条背景
ui_bar_hp_fill.png (128x16) - HP条填充（红渐变）
ui_bar_exp_bg.png (128x16) - 经验条背景
ui_bar_exp_fill.png (128x16) - 经验条填充（紫渐变）

【槽位背景】
ui_slot_weapon.png (48x48) - 武器槽（大）
ui_slot_weapon_active.png (48x48) - 当前武器高亮
ui_slot_item.png (32x32) - 道具槽
ui_slot_passive.png (32x32) - 被动槽

【面板与按钮】
ui_panel_9slice.png (96x96) - 9切片面板（可缩放）
  结构: 32px边框+32px中心+32px边框
ui_button_normal.png (128x32) - 普通按钮
ui_button_hover.png (128x32) - 悬停按钮（发光）
ui_button_pressed.png (128x32) - 按下按钮

【图标】
ui_icon_coin.png (16x16) - 金币图标
ui_icon_gem.png (16x16) - 宝石/经验图标
ui_icon_level.png (16x16) - 等级图标
ui_icon_time.png (16x16) - 时间图标

【弹窗】
ui_popup_levelup.png (256x192) - 升级选择弹窗
ui_popup_shop.png (320x240) - 商店面板
ui_popup_pause.png (256x256) - 暂停菜单
ui_popup_victory.png (400x300) - 胜利画面
ui_popup_defeat.png (400x300) - 失败画面

【小地图】
ui_minimap_room.png (16x16) - 房间图标
ui_minimap_current.png (16x16) - 当前位置
ui_minimap_visited.png (16x16) - 已访问房间
ui_minimap_secret.png (16x16) - 隐藏房间
```

**UI风格统一**:
- 暗色主题（#0D0D1A背景）
- 金色边框（#C4A030）
- 像素字体适配（最小8x8可读）

---

### 【Agent G】特效与弹道 - 优先级P2
**任务**: 粒子、弹道、状态效果
**数量**: 约15张图
**交付**: `effect_*.png`, `bullet_*.png`

**详细规格**:
```
【粒子效果】（8x8小图，可平铺）
effect_particle_blood.png - 血滴（红）
effect_particle_spark.png - 火花（黄白）
effect_particle_glow.png - 微光（多色）
effect_particle_smoke.png - 烟雾（灰）

【拾取物】（16x16）
effect_gem_red.png - 红经验宝石
effect_gem_blue.png - 蓝经验宝石
effect_gem_gold.png - 金经验宝石
effect_coin.png - 金币（旋转动画4帧）

【弹道】（16x16到32x32）
bullet_arrow.png - 箭矢
bullet_fireball.png - 火球飞行
bullet_ice.png - 冰锥
bullet_lightning.png - 闪电箭

【爆炸/命中】（多帧动画或单张大图）
effect_hit_slash.png (32x32) - 斩击效果（2-3帧）
effect_hit_pierce.png (32x32) - 穿刺效果
effect_explosion_small.png (64x64) - 小爆炸（4帧）
effect_explosion_large.png (96x96) - 大爆炸（6帧）

【状态图标】（16x16）
status_slow.png - 减速（冰晶）
status_poison.png - 中毒（绿泡）
status_stun.png - 眩晕（星星）
status_burn.png - 燃烧（火焰）
status_buff.png - 增益（箭头）
```

---

### 【Agent H】杂项与NPC - 优先级P3
**任务**: 商店、宝箱、环境装饰
**数量**: 约10张图
**交付**: `npc_*.png`, `chest_*.png`, `decor_*.png`

**详细规格**:
```
【NPC】
npc_shopkeeper.png (48x48) - 商店NPC（盲眼鼹鼠）
  描述: 戴眼罩的老鼹鼠，神秘商人
  
npc_healer.png (48x48) - 治疗NPC（发光飞蛾）

【宝箱】
chest_closed.png (32x32) - 关闭的宝箱
chest_open.png (32x32) - 打开的空宝箱
chest_glowing.png (32x32) - 有内容的宝箱（发光）

【环境装饰】（可选，增加场景丰富度）
deco_mushroom.png (16x16) - 发光蘑菇
deco_crystal.png (16x16) - 水晶
deco_bone.png (16x16) - 骨头
deco_egg.png (16x16) - 怪物蛋（可破坏）

【图腾】（已存在但可优化）
totem_attack.png (32x32) - 攻击图腾
totem_defense.png (32x32) - 防御图腾
totem_speed.png (32x32) - 速度图腾
```

---

## 输出交付规范

### 文件命名
```
[category]_[name]_[variant].png

示例:
- player_bison_spritesheet.png
- weapon_whip_thorns.png
- item_01_spinach.png
- floor_layer3_nerve.png
- ui_heart_full.png
- effect_explosion_01.png
```

### 文件夹结构
```
assets/
├── sprites/
│   ├── player/
│   │   └── player_bison.png
│   ├── enemies/
│   │   ├── tier1/ (5个)
│   │   ├── tier2/ (5个)
│   │   ├── tier3/ (4个)
│   │   ├── tier4/ (4个)
│   │   └── bosses/ (4个)
│   ├── weapons/ (8个)
│   ├── items/ (16个)
│   ├── tiles/
│   │   ├── floors/ (6个)
│   │   └── walls/ (10个)
│   ├── ui/ (20个)
│   ├── effects/ (15个)
│   └── misc/ (10个)
```

### 质量检查清单
每个交付文件必须检查:
- [ ] 尺寸正确（32x32 / 64x64 / 16x16）
- [ ] PNG透明背景
- [ ] 调色板符合风格指南
- [ ] 可识别度高（小尺寸测试）
- [ ] 命名正确
- [ ] 无压缩伪影

---

## 任务分配与协作

### Agent工作流
```
1. 接收任务 → 2. 制作初稿 → 3. 内部审查 → 4. 提交到共享文件夹
                                    ↓
5. 整合测试 ← 7. 最终打包 ← 6. 跨Agent风格统一审查
```

### 协调机制
- **每日同步**: 各Agent汇报进度和遇到的风格冲突
- **共享调色板**: 所有Agent使用本文档的HEX色值
- **样例先行**: 每个Agent先制作1个样例，确认风格后再批量生产
- **命名空间**: 各Agent在自己的工作文件夹操作，避免冲突

### 预计工时（参考）
- Agent A (主角): 2-3小时（动画复杂）
- Agent B (武器): 1.5-2小时
- Agent C (道具): 2-3小时
- Agent D (地形): 2-3小时（无缝拼接需测试）
- Agent E (墙壁): 1-2小时
- Agent F (UI): 2-3小时
- Agent G (特效): 1.5-2小时
- Agent H (杂项): 1小时

**总计**: 约16-20小时（8 Agent并行 = 2-3小时实际时间）

---

## 紧急联系与决策

如遇到以下情况，立即上报协调:
1. 风格冲突无法解决
2. 技术规范不明确
3. 资源依赖阻塞（如需要其他Agent的未完成素材作为参考）
4. 调色板颜色不足需扩展

---

## 版本历史
- v1.0 - 2026-02-20 - 初始完整版

---

**项目总负责**: 肉鸽牛牛开发团队  
**文档状态**: 可执行  
**下一步行动**: 各Agent确认任务，制作样例

~Meow
