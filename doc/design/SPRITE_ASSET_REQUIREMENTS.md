# 肉鸽牛牛 - 完整贴图资源需求清单

**版本**: v0.9.2  
**日期**: 2026-02-20  
**状态**: 待制作/收集

---

## 一、角色贴图 (Characters)

### 1.1 主角
| 文件名 | 尺寸 | 描述 | 优先级 |
|:---|:---|:---|:---:|
| `player_cow.png` | 32x32 | 牛牛主角 - 野牛形象，双角，可站立/行走动画 | P0 |

**已有**: 使用远程贴图，但可优化

---

## 二、敌人贴图 (Enemies) - 22种

### Tier 1 - 基础感染体 (5种)
| 文件名 | 尺寸 | 描述 | 已有? |
|:---|:---|:---|:---:|
| `chick.png` | 32x32 | 感染小鸡 - 苍白、菌丝、呆滞 | ✅ |
| `mouse.png` | 32x32 | 感染老鼠 - 长尾巴、红眼 | ✅ |
| `snail.png` | 32x32 | 感染蜗牛 - 壳+软体、发光触角 | ✅ |
| `pigeon.png` | 32x32 | 感染鸽子 - 翅膀展开、飞行姿态 | ✅ |
| `duck3.png` | 32x32 | 感染小鸭 - 扁喙、蹼足 | ✅ |

### Tier 2 - 快速变异体 (5种)
| 文件名 | 尺寸 | 描述 | 已有? |
|:---|:---|:---|:---:|
| `rabbit.png` | 32x32 | 感染兔子 - 长耳朵、跳跃姿态 | ✅ |
| `rabbit2.png` | 32x32 | 兔子变异型2 | ✅ |
| `bird.png` | 32x32 | 感染小鸟 - 飞行中、翅膀动态 | ✅ |
| `duck2.png` | 32x32 | 鸭子变异型2 | ✅ |
| `pig2.png` | 32x32 | 小猪变异型 | ✅ |

### Tier 3 - 智能狩猎者 (4种)
| 文件名 | 尺寸 | 描述 | 已有? |
|:---|:---|:---|:---:|
| `cat.png` | 32x32 | 感染猫咪 - 扑击姿态、利爪 | ✅ |
| `duck.png` | 32x32 | 标准鸭子 | ✅ |
| `squirrel.png` | 32x32 | 感染松鼠 - 蓬松尾巴、攀爬姿态 | ✅ |
| `goose.png` | 32x32 | 感染鹅 - 长颈、攻击性姿态 | ✅ |

### Tier 4 - 重型坦克 (4种)
| 文件名 | 尺寸 | 描述 | 已有? |
|:---|:---|:---|:---:|
| `dog.png` | 32x32 | 感染狗 - 四足奔跑姿态 | ✅ |
| `pig.png` | 32x32 | 标准猪 - 圆胖身体 | ✅ |
| `sheep.png` | 32x32 | 感染绵羊 - 厚毛、低头冲撞姿态 | ✅ |
| `snake.png` | 32x32 | 感染蛇 - 盘绕/滑行姿态 | ✅ |

### Tier 5-6 - 精英 & Boss (4种)
| 文件名 | 尺寸 | 描述 | 已有? |
|:---|:---|:---|:---:|
| `bear.png` | 32x32 | 感染熊 - 站立姿态、巨大体型 | ✅ |
| `crab.png` | 32x32 | 螃蟹Boss - 双螯、硬壳 | ✅ |
| `dog2.png` | 32x32 | 狼/狗精英 - 嚎叫姿态 | ✅ |
| `turtle.png` | 32x32 | 乌龟Boss - 背甲上有孵化场 | ✅ |

**已有贴图**: 全部22种敌人在 `https://wearescientist.github.io/rouge-cow/assets/sprites/` 有远程贴图

---

## 三、武器贴图 (Weapons) - 8种基础

| 文件名 | 尺寸 | 描述 | 优先级 |
|:---|:---|:---|:---:|
| `weapon_whip.png` | 32x32 | 鞭子 - 扇形范围武器 | P1 |
| `weapon_wand.png` | 32x32 | 魔杖 - 追踪弹道 | P1 |
| `weapon_knife.png` | 32x32 | 飞刀 - 穿透 | P1 |
| `weapon_axe.png` | 32x32 | 斧头 - 回旋 | P1 |
| `weapon_bible.png` | 32x32 | 圣经 - 环绕防御 | P1 |
| `weapon_fireball.png` | 32x32 | 火球 - 爆炸 | P1 |
| `weapon_lightning.png` | 32x32 | 闪电 - 连锁 | P1 |
| `weapon_holywater.png` | 32x32 | 圣水 - 区域持续 | P1 |

**当前状态**: 游戏使用 emoji 或简单图形代替，需要正式贴图

---

## 四、道具贴图 (Items) - 至少26种

### 攻击类
| 文件名 | 描述 |
|:---|:---|
| `item_spinach.png` | 菠菜 - 伤害+10% |
| `item_brace.png` | 护腕 - 投射物速度+10% |
| `item_hollowheart.png` | 空心心 - 生命上限+20% |
| `item_candelabrador.png` | 烛台 - 范围+10% |
| `item_spellbinder.png` | 法术书 - 持续时间+10% |
| `item_duplicator.png` | 复制器 - 投射物数量+1 |

### 防御类
| 文件名 | 描述 |
|:---|:---|
| `item_armor.png` | 护甲 - 减伤 |
| `item_wings.png` | 翅膀 - 移速 |
| `item_attractorb.png` | 磁铁 - 拾取范围 |

**当前状态**: 游戏使用 emoji 表示，需要统一像素风格

---

## 五、房间与地形 (Tiles)

### 5.1 地板 (Floor)
| 文件名 | 尺寸 | 描述 | 层级对应 |
|:---|:---|:---|:---|
| `floor_mycelium.png` | 64x64 | 菌丝地板 - 苍白、丝状纹理 | Layer 1 |
| `floor_greenhouse.png` | 64x64 | 温室地板 - 绿色、有机质感 | Layer 2 |
| `floor_nerve.png` | 64x64 | 神经地板 - 紫色、脉动纹理 | Layer 3 |
| `floor_furnace.png` | 64x64 | 熔炉地板 - 橙红、灼热裂纹 | Layer 4 |
| `floor_courtyard.png` | 64x64 | 庭院地板 - 血红、生物组织 | Layer 5 |
| `floor_core.png` | 64x64 | 核心地板 - 黑暗、金色纹路 | Layer 6 |

### 5.2 墙壁 (Walls)
| 文件名 | 尺寸 | 描述 |
|:---|:---|:---|
| `wall_vertical.png` | 32x64 | 垂直墙壁 |
| `wall_horizontal.png` | 64x32 | 水平墙壁 |
| `wall_corner_tl.png` | 32x32 | 左上转角 |
| `wall_corner_tr.png` | 32x32 | 右上转角 |
| `wall_corner_bl.png` | 32x32 | 左下转角 |
| `wall_corner_br.png` | 32x32 | 右下转角 |

### 5.3 门 (Doors)
| 文件名 | 尺寸 | 描述 |
|:---|:---|:---|
| `door_closed.png` | 48x48 | 关闭的门 - 红色X标记 |
| `door_open.png` | 48x48 | 打开的门 - 通道 |
| `door_locked.png` | 48x48 | 上锁的门 - 需要钥匙 |

**当前状态**: 游戏使用纯色矩形绘制，需要正式贴图

---

## 六、UI 元素 (User Interface)

### 6.1 状态栏
| 文件名 | 尺寸 | 描述 |
|:---|:---|:---|
| `ui_heart_full.png` | 16x16 | 满血心形 |
| `ui_heart_half.png` | 16x16 | 半血心形 |
| `ui_heart_empty.png` | 16x16 | 空血心形 |
| `ui_exp_bar.png` | 128x16 | 经验条背景 |
| `ui_exp_fill.png` | 128x16 | 经验条填充 |

### 6.2 道具与武器栏
| 文件名 | 尺寸 | 描述 |
|:---|:---|:---|
| `ui_slot_weapon.png` | 48x48 | 武器槽背景 |
| `ui_slot_item.png` | 32x32 | 道具槽背景 |
| `ui_slot_passive.png` | 32x32 | 被动道具槽 |

### 6.3 弹窗与菜单
| 文件名 | 尺寸 | 描述 |
|:---|:---|:---|
| `ui_panel.png` | 256x256 | 通用面板背景 |
| `ui_button.png` | 128x32 | 按钮背景 |
| `ui_button_hover.png` | 128x32 | 按钮悬停状态 |

**当前状态**: 游戏使用 CSS 绘制，可优化为像素风格

---

## 七、特效贴图 (Effects)

### 7.1 粒子效果
| 文件名 | 尺寸 | 描述 |
|:---|:---|:---|
| `particle_blood.png` | 8x8 | 血滴粒子 |
| `particle_spark.png` | 8x8 | 火花粒子 |
| `particle_gem.png` | 16x16 | 宝石/经验值 |
| `particle_gold.png` | 16x16 | 金币 |

### 7.2 弹道与攻击
| 文件名 | 尺寸 | 描述 |
|:---|:---|:---|
| `bullet_whip.png` | 32x32 | 鞭子攻击范围指示 |
| `bullet_knife.png` | 16x16 | 飞刀投射物 |
| `bullet_fireball.png` | 24x24 | 火球 |
| `effect_explosion.png` | 64x64 | 爆炸效果（多帧） |

### 7.3 状态效果
| 文件名 | 尺寸 | 描述 |
|:---|:---|:---|
| `status_slow.png` | 16x16 | 减速效果图标 |
| `status_poison.png` | 16x16 | 中毒效果图标 |
| `status_stun.png` | 16x16 | 眩晕效果图标 |

**当前状态**: 使用程序化绘制或简单图形

---

## 八、其他 (Misc)

### 8.1 商店与交互
| 文件名 | 尺寸 | 描述 |
|:---|:---|:---|
| `npc_shop.png` | 48x48 | 商店NPC |
| `chest_closed.png` | 32x32 | 关闭的宝箱 |
| `chest_open.png` | 32x32 | 打开的宝箱 |
| `totem_base.png` | 32x32 | 图腾底座 |

### 8.2 小地图
| 文件名 | 尺寸 | 描述 |
|:---|:---|:---|
| `minimap_room.png` | 16x16 | 房间图标 |
| `minimap_current.png` | 16x16 | 当前位置标记 |
| `minimap_door.png` | 8x8 | 门连接标记 |

---

## 总结统计

| 类别 | 数量 | 已有 | 待制作 |
|:---|:---:|:---:|:---:|
| 主角 | 1 | 1 | 0 |
| 敌人 | 22 | 22 | 0 |
| 武器 | 8 | 0 | 8 |
| 道具 | 26+ | 0 | 26+ |
| 地形 | 6+ | 0 | 6+ |
| 墙壁/门 | 10+ | 0 | 10+ |
| UI元素 | 20+ | 0 | 20+ |
| 特效 | 15+ | 0 | 15+ |
| **总计** | **~110** | **23** | **~87** |

---

## 下一步建议

由于数量庞大（约87个待制作），建议分优先级处理：

1. **P0 (必须)**: 武器8个 + 核心道具10个 = 18个
2. **P1 (重要)**: 地形6个 + 墙壁/门10个 = 16个
3. **P2 (增强)**: UI 20个 + 特效15个 = 35个
4. **P3 (可选)**: 其他道具和细节

**制作方式选择**:
- A) 我生成基础像素贴图（Canvas/SVG程序化）
- B) 推荐免费资源包（OpenGameArt等）
- C) AI生成（Midjourney等生成后处理）
- D) 组合方案：主角/敌人用AI，道具/地形用程序化

你倾向哪种方案？~Meow
