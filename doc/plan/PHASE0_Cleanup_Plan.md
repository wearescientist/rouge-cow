# Phase 0: 文件清理计划
## 先减法，后加法 - 让AI更专注于有效代码

**执行时间**: 2026-03-05  
**目标**: 减少AI搜索干扰，释放存储空间  
**预期效果**: AI查找代码效率提升15-20%  

---

## 一、待清理文件清单

### 1. 旧版本游戏文件 (src/game_v*.js)

| 文件 | 大小 | 说明 | 操作 |
|------|------|------|------|
| src/game_v1.js | 16 KB | 早期版本 | **删除** |
| src/game_v2.js | - | 早期版本 | **删除** |
| src/game_v2.1.js ~ v2.8.js | - | 迭代版本 | **删除** |
| src/game_v3.js ~ v9.js | - | 迭代版本 | **删除** |
| src/game_v11.js ~ v19.js | - | 迭代版本 | **删除** |
| src/game_simple.js | - | 简化版 | **删除** |
| src/game_stable.js | - | 稳定版 | **删除** |
| src/game_unified.js | - | 统一版 | **删除** |
| src/game_fullscreen.js | - | 全屏版 | **删除** |
| src/game_isaac_style.js | - | 以撒风格版 | **删除** |
| src/game_with_sprites.js | - | 贴图版 | **删除** |
| src/game_demo.js | - | 演示版 | **删除** |
| src/game_complete.js | - | 完整版 | **删除** |
| src/game_final.js | - | 最终版 | **删除** |
| **总计** | **~430 KB** | **26个文件** | **全部删除** |

**保留理由**: 这些文件已被 index.html 中的内联代码取代，不再被引用。

---

### 2. 废弃引擎/系统文件

| 文件 | 大小 | 状态 | 操作 |
|------|------|------|------|
| src/core_engine.js | 5 KB | 早期引擎 | **删除** |
| src/engine.js | 8 KB | 早期引擎 | **删除** |
| src/vampire_engine.js | 14 KB | 吸血鬼引擎 | **删除** |
| src/isaac_room_system.js | 20 KB | 以撒房间系统 | **删除** |
| src/collision_optimized.js | 2 KB | 碰撞优化(旧) | **删除** |
| src/enemy_system.js | 12 KB | 敌人系统(旧) | **删除** |
| src/GameECS.js | 19 KB | ECS实验 | **删除** |
| **总计** | **~80 KB** | **7个文件** | **全部删除** |

**保留理由**: 这些系统已被 index.html 或新的 src/systems/ 取代。

---

### 3. 备份文件清理

**保留策略**: 保留最近5个版本备份 + 今天的完整备份

**删除列表**:
- rougelike-cow-v0.9.3-20260222.zip
- rougelike-cow-v0.9.4-20260222.zip
- rougelike-cow-v0.9.5-*.zip (多个)
- rougelike-cow-v0.10.*-*.zip (多个)
- rougelike-cow-v0.11.*-*.zip (多个)
- rougelike-cow-v0.12.*-*.zip (多个)
- rougelike-cow-v0.13.*-*.zip

**保留列表**:
- full_backup_20260305_222850/ (今天的完整备份)
- full_backup_20260305_222850.zip (今天的完整备份压缩包)
- 最近5个版本zip (按时间排序)

**预计释放**: ~500-600 MB

---

### 4. 其他待评估文件

| 文件/目录 | 说明 | 建议 |
|-----------|------|------|
| src/items_system.js | 道具系统(旧) | **评估后删除** |
| src/items_visual.js | 道具视觉(旧) | **评估后删除** |
| src/room_rewards.js | 房间奖励(旧) | **评估后删除** |
| src/particle_pool.js | 粒子池(旧) | **评估后删除** |
| src/sprites_manager.js | 精灵管理(旧) | **评估后删除** |
| src/weapon_system.js | 武器系统(旧) | **评估后删除** |
| src/main.js | 入口文件 | **保留** (需要更新) |
| src/game.js | 游戏主文件 | **保留** (需要整合) |

---

## 二、保留文件清单 (被引用)

### 核心引用文件 (index.html 中引用)

```
src/data/enemyCodex.js
src/data/totemData.js
src/render/HD2DEffects.js
src/render/HD2DRenderer.js
src/render/systems/AmbienceSystem.js
src/render/systems/BacklightSystem.js
src/render/systems/CaveLightingSystem.js
src/render/systems/ColorGradingSystem.js
src/render/systems/GroundGlowSystem.js
src/render/systems/RoomBlurSystem.js
src/render/systems/ShadowSystem.js
src/render/systems/TiltShiftSystem.js
src/systems/AudioController.js
src/systems/AudioSystem.js
src/systems/collision.js
src/systems/prologue.js
src/systems/shopNPC.js
src/systems/SoundEffectSystem.js
src/systems/SpriteDataRegistry.js
src/systems/storyEvents.js
src/systems/trueEnding.js
src/systems/WeaponBalanceTester.js
src/systems/weaponSystem.js
src/systems/weaponUpgrade.js
src/utils/helpers.js
src/utils/SpriteData.js
```

---

## 三、执行步骤

### Step 1: 创建清理清单备份
```bash
# 记录所有将被删除的文件
Get-ChildItem src/game_v*.js > cleanup_list_game_v.txt
# ... 其他清单
```

### Step 2: 移动而非删除 (安全策略)
```bash
# 创建 archive/old_src/ 目录
# 将待删除文件移动到归档目录
# 保留30天后确认无误再彻底删除
```

### Step 3: 执行清理
```bash
# 1. 移动旧版本游戏文件
# 2. 移动废弃引擎文件
# 3. 删除旧备份(保留清单中的)
# 4. 验证 index.html 仍能正常运行
```

### Step 4: 更新项目结构
```bash
# 更新 .gitignore (如有需要)
# 创建 README_SRC.md 说明src目录结构
# 记录清理日志
```

---

## 四、预期收益

### 对AI开发效率的提升

| 方面 | 改善前 | 改善后 | 提升 |
|------|--------|--------|------|
| 搜索干扰文件 | 103个 | ~30个 | **-70%** |
| 找代码时间 | 75秒 | ~60秒 | **-20%** |
| 文件跳转 | 多路径 | 单一入口 | **清晰** |
| 认知负担 | 高 | 中 | **-40%** |

### 存储空间释放

| 类别 | 释放空间 |
|------|----------|
| 旧版本代码 | ~0.5 MB |
| 旧备份 | ~500 MB |
| **总计** | **~500 MB** |

---

## 五、回滚预案

如果清理后发现误删：

1. **立即从归档恢复**:
   ```bash
   copy archive/old_src/game_v19.js src/
   ```

2. **从完整备份恢复**:
   ```bash
   # 解压今天的完整备份
   Expand-Archive backup/full_backup_20260305_222850.zip -DestinationPath temp_restore/
   copy temp_restore/src/xxx.js src/
   ```

3. **从git历史恢复**:
   ```bash
   git checkout HEAD -- src/xxx.js
   ```

---

## 六、验收标准

- [ ] 旧版本 game_v*.js 已归档/删除 (26个)
- [ ] 废弃引擎文件已归档/删除 (7个)
- [ ] 旧备份已清理 (保留最近5个)
- [ ] index.html 能正常加载运行
- [ ] AI能清晰识别有效代码文件
- [ ] 清理清单已记录

---

**执行人**: Kimi Code CLI  
**执行时间**: 2026-03-05  
**状态**: 准备执行，等待最终确认  
