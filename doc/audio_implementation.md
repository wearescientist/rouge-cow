# 🎵 音频系统实装说明

## 完成状态
- ✅ BGM系统：5首BGM（menu/normal/elite/boss/victory）在正确时机循环播放
- ✅ 音效系统：全部实装外部音频文件
- ✅ 合成音效：已停用但保留数据

## BGM配置（来自 sfx_config.json）

| 类型 | BPM | 风格 | 触发时机 |
|-----|-----|-----|---------|
| menu | 87 | ambient | 主菜单 |
| normal | 118 | groove | 普通房间/已清理房间 |
| elite | 126 | intense | 隐藏房间 |
| boss | 142 | epic | Boss房间 |
| victory | 134 | celebration | 游戏胜利 |

**切换逻辑：**
- 进入房间时根据房间类型自动切换
- Boss/隐藏房间开始战斗时切换对应BGM
- 游戏结束时停止BGM
- 重启游戏回到菜单时停止BGM

## 音效映射

### 武器音效（12种）
```javascript
whip: 'whip_crack_...mp3'
scythe: 'Heavy_scythe_slash_...mp3'
knife: 'knife_throw_v1.mp3'
axe: 'axe_throw_v1.mp3'
cross: 'cross_launch_v1.mp3'
wand: 'wand_cast_v1.mp3'
fireball: 'fireball_v1.mp3' (已截取到1.5秒)
shuriken: 'shuriken_v2.mp3'
icicle: 'icicle_v2.mp3'
lightning: 'lighting.ogg'
laser: 'laser2.ogg'
dart: 'dart_shoot_v2.mp3'
```

### 命中音效（6种材质）
- bird → impactBell（鸟类）
- fur → impactSoft_medium（毛皮）
- shell → impactBell（硬壳）
- slime → impactGeneric_light（史莱姆）
- bone → impactWood（骨骼）
- flesh → impactSoft（肉体）

轻击=普通攻击，重击=暴击

### UI音效
- click, select, switch, levelup, coin, chest, heal, evolve, bossEnter

### 其他音效
- dash, gem, kill, hurt, portal, spawn, wave, buy, gameover

## 楼层-脚步声映射

| 楼层 | 主题 | 脚步声类型 |
|-----|-----|-----------|
| 1 | 菌丝区 | snow |
| 2 | 孵化温室 | grass |
| 3 | 神经索 | concrete |
| 4 | 消化熔炉 | concrete |
| 5 | 母虫庭院 | wood |
| 6 | 千根之心 | carpet |

## 音频处理记录

1. **火球音效**：从16秒截取到1.5秒（保留发射部分，去除尾音）
2. **音量统一**：全部80个文件统一到-14dB

## 文件结构

```
assets/audio/
├── weapons/          # 12个武器音效
├── hit/              # 命中音效
├── footstep/         # 5种地面 × 5种变体 = 25个
├── ui/               # UI音效
└── [根目录]          # BGM和其他音效

src/systems/
├── AudioSystem.js    # BGM合成 + 音量控制
└── AudioController.js # 音效文件映射和播放
```

## 使用方法

```javascript
// BGM
this.audioCtrl.playBGM('boss');
this.audioCtrl.stopBGM();

// 武器
this.audioCtrl.playWeapon('fireball');

// 命中
this.audioCtrl.playHit('flesh', isCrit);

// 暴击
this.audioCtrl.playCrit();

// UI
this.audioCtrl.playLevelUp();
this.audioCtrl.playCoin();

// 通用接口（兼容旧代码）
this.audioCtrl.play('kill');
```

## 测试工具

打开 `src/tools/AudioTest.html` 测试所有音效。

---
实装完成时间：2026-03-04
