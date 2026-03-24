# 新旧版本资源对比报告

**日期:** 2026-02-05  
**对比版本:** index.html (v0.22) vs index_ecs.html (v0.24 ECS)

---

## 旧版本 (v0.22) 资源清单

### 1. 玩家精灵 (8帧动画)
- `player/player_0.png` ~ `player/player_7.png`

### 2. 敌人精灵 (23种)
- chick, mouse, snail, pigeon, duck3, rabbit, rabbit2, bird, duck2, pig2, cat, duck, squirrel, goose, dog, pig, sheep, snake, bear, crab, dog2, turtle, boss6

### 3. 描边颜色变体 (12种颜色 × 23敌人)
- white, red, pink, orange, purple, gold, blue, cyan, green, lime, magenta, yellow

### 4. 武器贴图 (8种)
- weapon_whip, weapon_wand, weapon_knife, weapon_axe, weapon_bible, weapon_fireball, weapon_lightning, weapon_holywater

### 5. 道具贴图 (16个)
- item_01 ~ item_16

### 6. 地形贴图
- **地板 (6层):** layer1_floor_mycelium, layer2_floor_greenhouse, layer3_floor_nerve, layer4_floor_furnace, layer5_floor_courtyard, layer6_floor_core
- **墙壁 (6层):** layer1_wall ~ layer6_wall
- **门 (6层 × 2状态):** layer1_door_closed/open ~ layer6_door_closed/open
- **角落 (6层 × 4方向):** layer1_corner_tr/br/bl/tl ~ layer6_corner_tr/br/bl/tl

### 7. 特效贴图 (21种)
- bullet_arrow, bullet_fireball, bullet_ice, bullet_lightning
- effect_coin, effect_explosion_large/small, effect_gem_blue/gold/red
- effect_hit_pierce/slash, effect_particle_blood/glow/smoke/spark
- status_buff/burn/poison/slow/stun

### 8. UI贴图 (24种)
- ui_bar_exp_bg/fill, ui_bar_hp_bg/fill
- ui_button_hover/normal/pressed
- ui_heart_empty/full/gold/half
- ui_icon_coin/gem/level/time
- ui_minimap_current/room/secret/visited
- ui_panel_9slice, ui_slot_item/passive/weapon/weapon_active

### 9. 杂项贴图 (13种)
- chest_closed/glowing/open
- deco_bone/crystal/egg/mushroom
- npc_healer/shopkeeper
- totem_attack/defense/speed

---

## ECS版本 (v0.24) 更新内容

### 已实现的资源加载

#### ✅ 新增: AssetManager.js (资源管理器)
- 统一加载和管理所有图片资源
- 支持本地和远程路径自动切换
- 批量加载，进度回调
- 失败资源自动创建回退纹理

#### ✅ 更新: RenderSystem.js
- 新增 `loadTexturesFromAssetManager()` 方法
- 新增 `renderFloor()` 地板渲染
- 改进 `renderEntity()` 支持纹理键查找

#### ✅ 更新: GameECS.js
- 新增 `loadAssets()` 资源加载流程
- 初始化时自动加载所有资源

#### ✅ 更新: index_ecs.html
- 添加 AssetManager.js 脚本引用

#### ✅ 更新: EnemySpawnSystem.js
- 新增 `getEnemyTextureKey()` 映射表
- 敌人生成时自动设置纹理键

#### ✅ 更新: RoomSystem.js
- 墙壁创建时设置 `layerX_wall` 纹理
- 门创建时设置 `layerX_door_closed` 纹理
- 障碍物随机选择 `deco_XXX` 纹理
- 楼梯设置 `chest_closed` 纹理

#### ✅ 更新: World.js (ECS核心)
- 玩家创建时设置 `player_0` 纹理

---

## 资源映射表

| 资源类型 | 旧版本键名 | ECS版本键名 | 状态 |
|----------|-----------|-------------|------|
| 玩家 | player_0~7 | player_0~7 | ✅ 已映射 |
| 敌人 | chick, mouse... | chick, mouse... | ✅ 已映射 |
| 地板 | layerX_floor_XXX | layerX_floor_XXX | ✅ 已映射 |
| 墙壁 | layerX_wall | layerX_wall | ✅ 已映射 |
| 门 | layerX_door_closed/open | layerX_door_closed/open | ✅ 已映射 |
| 装饰 | deco_XXX | deco_XXX | ✅ 已映射 |
| 武器 | weapon_XXX | weapon_XXX | ⚠️ 待WeaponSystem更新 |
| 道具 | item_XX | item_XX | ⚠️ 待ItemSystem更新 |
| 特效 | effect_XXX | effect_XXX | ⚠️ 待ParticleSystem更新 |
| UI | ui_XXX | ui_XXX | ⚠️ 待UISystem更新 |

---

## 待完成任务

### 1. WeaponSystem 武器纹理
```javascript
// 需要在创建武器时设置 texture 键
sprite.texture = weaponType; // e.g., 'weapon_whip'
```

### 2. ItemSystem 道具纹理
```javascript
// 需要在创建道具时设置 texture 键
sprite.texture = itemId; // e.g., 'item_01'
```

### 3. ParticleSystem 特效纹理
```javascript
// 需要在创建特效时设置 texture 键
// 如: bullet_arrow, effect_explosion_large 等
```

### 4. UISystem UI元素纹理
```javascript
// 需要替换绘制代码为图片绘制
// 如: ui_bar_hp_bg, ui_heart_full 等
```

### 5. 投射物纹理
```javascript
// World.createProjectile 需要设置武器类型对应的bullet纹理
// 如: bullet_fireball, bullet_arrow 等
```

---

## 测试验证

启动游戏后验证以下元素是否正确显示：
- [ ] 玩家角色显示为贴图而非方块
- [ ] 敌人显示为对应贴图
- [ ] 地板显示为对应层数的地板贴图
- [ ] 墙壁显示为对应层数的墙壁贴图
- [ ] 门显示为门贴图
- [ ] 障碍物显示为装饰贴图
- [ ] 楼梯显示为箱子贴图

---

## 资源路径配置

```javascript
// 本地开发
basePath = './assets/sprites/'

// 线上部署  
basePath = 'https://wearescientist.github.io/rouge-cow/assets/sprites/'
```

所有资源统一从 AssetManager 加载，自动检测环境切换路径。
