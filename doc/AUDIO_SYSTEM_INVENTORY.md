# 🔊 音效系统清单 v4.0

**文档用途**: 记录所有音效ID及其在游戏中的调用位置，避免重复搜索  
**最后更新**: 2026-03-05

---

## 📋 音效注册表 (AudioController.js)

### 1. 武器类 (WEAPON)
| 音效ID | 文件 | 音量 | 调用位置 |
|--------|------|------|----------|
| `whip` | weapons/whip_crack_*.mp3 | 0.24 | 武器: 鞭子攻击 |
| `scythe` | weapons/Heavy_scythe_slash_*.mp3 | 0.24 | 武器: 镰刀攻击 |
| `knife` | weapons/knife_throw_v1.mp3 | 0.26 | 武器: 飞刀攻击 |
| `axe` | weapons/axe_throw_v1.mp3 | 0.24 | 武器: 斧头攻击 |
| `cross` | weapons/cross_launch_v1.mp3 | 0.24 | 武器: 十字架攻击 |
| `wand` | weapons/wand_cast_v1.mp3 | 0.26 | 武器: 魔杖攻击 |
| `fireball` | weapons/fireball_v1.mp3 | 0.22 | 武器: 火球攻击 |
| `fireball_pet` | weapons/fireball_v1.mp3 | 0.12 | 宠物: 默认攻击(低音量) |
| `shuriken` | weapons/shuriken_v2.mp3 | 0.26 | 武器: 手里剑攻击 |
| `icicle` | weapons/icicle_v2.mp3 | 0.26 | 武器: 冰锥攻击 |
| `lightning` | weapons/lighting.ogg | 0.24 | 武器: 闪电攻击 |
| `laser` | weapons/laser2.ogg | 0.24 | 武器: 激光攻击 |
| `dart` | weapons/dart_shoot_v2.mp3 | 0.26 | 武器: 飞镖攻击 |
| `poison_dart` | weapons/dart_shoot_v2.mp3 | 0.26 | 武器: 毒镖攻击 |
| `holy_water` | weapons/bottle_broken_.mp3 | 0.24 | 武器: 圣水攻击 |

### 2. 命中类 (HIT)
| 音效ID | 材质 | 音量 | 调用位置 |
|--------|------|------|----------|
| `hit_flesh` | flesh | 0.5 | 命中: 肉体敌人 |
| `hit_bone` | bone | 0.5 | 命中: 骨骼敌人 |
| `hit_shell` | shell | 0.5 | 命中: 甲壳敌人 |
| `hit_slime` | slime | 0.5 | 命中: slime敌人 |
| `hit_fur` | fur | 0.5 | 命中: 毛皮敌人 |
| `hit_bird` | bird | 0.5 | 命中: 鸟类敌人 |
| `hit_crit` | shell(重击) | 0.55 | 命中: 暴击 |
| `hurt` | flesh | 0.6 | 玩家: 受击 |
| `kill` | bone(重击) | 0.7 | 击杀: 敌人死亡 |

### 3. UI类 (UI)
| 音效ID | 文件 | 音量 | 调用位置 |
|--------|------|------|----------|
| `coin` | coin_pickup.mp3 | 0.5 | 收集: 金币 |
| `gem` | exp-gain.ogg | 0.5 | 收集: 经验宝石 |
| `chest` | chest_open_*.mp3 | 0.55 | 交互: 打开宝箱 |
| `levelup` | Character_level_up_*.mp3 | 0.6 | 系统: 升级 |
| `heal` | Magical_healing_spel_*.mp3 | 0.5 | 系统: 治疗/回血 |
| `evolve` | weapen_evolution_powe_*.mp3 | 0.55 | 系统: 武器进化 |
| `boss` | boss enter.ogg | 0.6 | 系统: Boss出现 |
| `buy` | ui/switch_001.ogg | 0.5 | 交互: 购买物品 |
| `exp` | exp-gain.ogg | 0.5 | 收集: 经验 |
| `click` | ui/click_002.ogg | 0.5 | UI: 点击 |
| `select` | ui/select_002.ogg | 0.5 | UI: 选择 |
| `switch` | ui/switch_001.ogg | 0.5 | UI: 切换 |
| `unlock` | Character_level_up_*.mp3 | 0.7 | 系统: 解锁内容 |

### 4. 脚步类 (STEP)
| 音效ID | 文件模式 | 音量 | 调用位置 |
|--------|----------|------|----------|
| `step_snow` | footstep/footstep_snow_*.ogg | 0.3 | 移动: 1层(菌丝区) |
| `step_grass` | footstep/footstep_grass_*.ogg | 0.3 | 移动: 2层(孵化温室) |
| `step_concrete` | footstep/footstep_concrete_*.ogg | 0.3 | 移动: 3-4层 |
| `step_wood` | footstep/footstep_wood_*.ogg | 0.3 | 移动: 5层(母虫庭院) |
| `step_carpet` | footstep/footstep_carpet_*.ogg | 0.3 | 移动: 6层(千根之心) |

### 5. 无声类 (MUTE)
| 音效ID | 说明 |
|--------|------|
| `warning` | 静音: 警告提示 |
| `wave` | 静音: 波次开始 |
| `elite` | 静音: 精英出现 |
| `radiance` | 静音: 辉耀持续伤害 |
| `bible` | 静音: 圣经环绕 |
| `portal` | 静音: 传送门 |
| `dash` | 静音: 冲刺 |
| `explosion` | 静音: 爆炸(使用fireball代替) |
| `victory` | 静音: 胜利 |
| `gameover` | 静音: 游戏结束 |
| `shoot` | 静音: 通用射击(各武器有自己的) |
| `metal` | 静音: 金属撞击 |
| `spawn` | 静音: 生成音效 |

---

## 📍 调用位置速查

### 武器攻击音效
```javascript
// index.html - 武器发射
this.audioCtrl.play(w.baseKey);  // w.baseKey = 'whip'|'knife'|'laser' 等

// PetSystem.js - 宠物攻击
this.game.audioCtrl.play('laser');      // 硫磺牛
this.game.audioCtrl.play('fireball_pet'); // 其他宠物默认
```

### 命中音效
```javascript
// Enemy.takeDamage() - 敌人受击
const ENEMY_MATERIALS = {
    'chick': 'bird', 'mouse': 'fur', 'snail': 'shell',
    // ... 完整映射表
};
const material = ENEMY_MATERIALS[enemyType] || 'flesh';
if (isCrit) {
    window.game.audioCtrl.playCrit();
} else {
    window.game.audioCtrl.playHit(material);  // 命中音效
}

// Player.takeDamage() - 玩家受击
window.game.audioCtrl.play('hurt');
```

### 收集音效
```javascript
// index.html - 金币收集
this.audioCtrl.play('coin');  // 第16985行, 17021行

// index.html - 经验宝石收集
this.audioCtrl.play('gem');   // 第15297行(吸收), 16901行, 16948行

// index.html - 经验获取
this.audioCtrl.play('exp');
```

### 系统音效
```javascript
// index.html - 升级
this.audioCtrl.play('levelup');

// index.html - 武器进化
this.audioCtrl.play('evolve');

// index.html - 开箱
this.audioCtrl.play('chest');

// index.html - 治疗
this.audioCtrl.play('heal');

// index.html - Boss出现
this.audioCtrl.play('boss');
```

### UI音效
```javascript
// index.html - 点击
this.audioCtrl.play('click');

// index.html - 选择
this.audioCtrl.play('select');

// index.html - 切换
this.audioCtrl.play('switch');

// index.html - 购买
this.audioCtrl.play('buy');
```

### 脚步音效
```javascript
// index.html - 玩家移动
const floorSteps = {
    1: 'step_snow', 2: 'step_grass', 3: 'step_concrete',
    4: 'step_concrete', 5: 'step_wood', 6: 'step_carpet'
};
this.audioCtrl.play(floorSteps[floor]);
```

---

## 🔧 AudioController API

### play(soundId)
```javascript
// 通用播放
this.audioCtrl.play('coin');

// 武器播放 (根据武器key)
this.audioCtrl.play(w.baseKey);
```

### playHit(material)
```javascript
// 命中音效 - 根据材质
this.audioCtrl.playHit('flesh');  // 或 'bone', 'shell', 'slime', 'fur', 'bird'
```

### playCrit()
```javascript
// 暴击音效
this.audioCtrl.playCrit();
```

### playUI(type)
```javascript
// UI音效
this.audioCtrl.playUI('click');
```

---

## ⚠️ 注意事项

1. **音效ID必须存在于 registry 中**，否则会控制台警告
2. **材质参数**: playHit() 只接受 'flesh', 'bone', 'shell', 'slime', 'fur', 'bird'
3. **默认材质**: playHit() 不传参数时默认使用 'flesh'
4. **静音类型**: type: 'mute' 的音效不会播放任何声音

---

## 📝 修改记录

| 日期 | 修改内容 |
|------|----------|
| 2026-03-05 | 建立完整音效清单文档 |
| 2026-03-05 | 修复金币音效误用为 gem |
| 2026-03-05 | 修复重复命中音效问题 |
| 2026-03-05 | 添加 fireball_pet 低音量火球 |

---

**文档维护**: 每次添加/修改音效时，同步更新此文档
