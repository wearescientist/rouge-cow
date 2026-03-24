# 🔊 SoundEffectSystem API 参考

**文件位置**: `src/systems/SoundEffectSystem.js`  
**访问方式**: `game.sfx`  
**用途**: 所有音效调用的唯一入口

---

## 🚀 快速开始

```javascript
// 播放武器攻击
game.sfx.playWeaponAttack('whip');

// 播放敌人受击
game.sfx.playEnemyHit('mouse', false);  // 敌人类型, 是否暴击

// 播放金币收集
game.sfx.playCoinCollected();

// 播放BGM
game.sfx.playBGM('boss');
```

---

## 📚 完整 API 列表

### 武器音效

| 方法 | 参数 | 说明 |
|------|------|------|
| `playWeaponAttack(weaponKey)` | `string` | 播放武器攻击音效 |
| `playWeaponEvolution()` | - | 播放武器进化音效 |

**weaponKey 列表**: `whip`, `scythe`, `knife`, `axe`, `cross`, `wand`, `fireball`, `shuriken`, `icicle`, `lightning`, `laser`, `dart`, `poison_dart`, `holy_water`

---

### 命中音效

| 方法 | 参数 | 说明 |
|------|------|------|
| `playEnemyHit(enemyType, isCrit)` | `string`, `boolean` | 播放敌人受击音效 |
| `playPlayerHit()` | - | 播放玩家受击音效 |
| `playEnemyDeath(enemyType)` | `string` | 播放敌人死亡音效 |
| `playBossHitWall()` | - | 播放Boss撞墙音效 |

**enemyType 映射**:
- `bird`: chick, pigeon, duck3, bat, bird, duck2, duck, goose, bee, tiezhua
- `fur`: mouse, rabbit, rabbit2, pig2, cat, squirrel, dog, pig, sheep, panther, bear, fox, tiaotiao, yinya, dog2, wolf_king
- `shell`: snail, crab, nibei, turtle
- `slime`: snake, ghost, mother
- `bone`: mimic
- 其他: flesh

---

### 收集音效

| 方法 | 说明 |
|------|------|
| `playCoinCollected()` | 金币收集 |
| `playGemCollected()` | 经验宝石收集 |
| `playExpGained()` | 经验获取 |
| `playChestOpened()` | 宝箱开启 |

---

### 系统音效

| 方法 | 说明 |
|------|------|
| `playLevelUp()` | 升级 |
| `playHeal()` | 治疗/回血 |
| `playBossAppear()` | Boss出现 |
| `playBuyItem()` | 购买物品 |
| `playUnlock()` | 解锁内容 |
| `playRoomClear()` | 房间清理完成 |

---

### UI音效

| 方法 | 说明 |
|------|------|
| `playUIClick()` | 点击 |
| `playUISelect()` | 选择 |
| `playUISwitch()` | 切换 |

---

### 脚步音效

| 方法 | 参数 | 说明 |
|------|------|------|
| `playFootstep(floor)` | `number` 1-6 | 播放对应楼层脚步 |

**楼层映射**:
- 1: step_snow (菌丝区)
- 2: step_grass (孵化温室)
- 3-4: step_concrete (神经索/消化熔炉)
- 5: step_wood (母虫庭院)
- 6: step_carpet (千根之心)

---

### BGM控制

| 方法 | 参数 | 说明 |
|------|------|------|
| `playBGM(scene)` | `string` | 播放场景BGM |
| `stopBGM()` | - | 停止BGM |
| `playBGMForRoom(room)` | `Object` | 根据房间自动播放对应BGM |

**scene 列表**: `menu`, `normal`, `elite`, `boss`, `victory`

---

### 宠物音效

| 方法 | 参数 | 说明 |
|------|------|------|
| `playPetAttack(attackType)` | `string` | 播放宠物攻击音效 |

**attackType 映射**:
- `laser` → laser
- `orbit` → fireball_pet
- `bomb` → fireball
- `blackhole` → holy_water
- `breath` → fireball
- `chain` → lightning
- `slow` → icicle
- `heal` → heal
- 其他 → fireball_pet

---

## 🔧 修改音效

所有音效配置集中在 `SoundEffectSystem.js` 中：

```javascript
// 修改敌人材质映射
this.ENEMY_MATERIALS = {
    'new_enemy': 'flesh',  // 添加新映射
    // ...
};

// 修改楼层脚步映射
this.FLOOR_FOOTSTEPS = {
    7: 'step_new',  // 添加新楼层
    // ...
};

// 修改武器音效映射
playWeaponAttack(weaponKey) {
    const soundMap = {
        'new_weapon': 'new_sound',  // 添加新映射
        // ...
    };
    // ...
}
```

---

## ⚠️ 重要提示

1. **不要**在代码中直接调用 `audioCtrl.play('xxx')`，统一使用 `sfx` 方法
2. **不要**在代码中直接调用 `audio.playBGM('xxx')`，统一使用 `sfx.playBGM()`
3. 添加新音效时，先在 `SoundEffectSystem.js` 中添加方法，再调用
4. 修改音效映射只需修改 `SoundEffectSystem.js`，无需修改其他文件

---

## 📁 相关文件

- `src/systems/SoundEffectSystem.js` - 音效管理系统
- `src/systems/AudioController.js` - 底层音频控制
- `src/systems/AudioSystem.js` - BGM系统
- `doc/SFX_MIGRATION_GUIDE.md` - 迁移指南
