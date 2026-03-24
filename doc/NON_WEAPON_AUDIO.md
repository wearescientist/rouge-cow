# 非武器音效完整清单

## BGM（已禁用）
- menu, normal, elite, boss, victory → 暂时禁用，等待外部BGM文件

## UI/事件音效

| 调用 | 方法 | 音效文件 | 状态 |
|------|------|----------|------|
| play('levelup') | playLevelUp() | Character_level_up_...mp3 | ✅ |
| play('evolve') | playEvolve() | weapen_evolution_powe_...mp3 | ✅ |
| play('chest') | playChest() | chest_open_...mp3 | ✅ |
| play('buy') | playBuy() | ui/switch_001.ogg | ✅ |
| play('heal') | playHeal() | Magical_healing_spel_...mp3 | ✅ |
| play('dash') | playDash() | footstep/concrete_xxx.ogg | ✅ |
| play('gameover') | playGameOver() | boss enter.ogg | ✅ |
| play('warning') | playWarning() | hit/impactMetal_heavy_002.ogg | ✅ |
| playCoin() | playCoin() | coin_pickup.mp3 | ✅ 已修复 |
| playGem() | playGem() | exp-gain.ogg | ✅ |

## 拾取音效（已修复）

### 金币拾取
```javascript
// 修复前：play('gem') → exp-gain.ogg ❌
// 修复后：playCoin() → coin_pickup.mp3 ✅
```
位置：~line 17955, 17970

### 经验拾取
```javascript
play('gem') → playGem() → exp-gain.ogg ✅
```
位置：~line 17850

### 自动收集
```javascript
play('gem') → playGem() → exp-gain.ogg ✅
```
用于房间清理后自动吸收，位置：~line 16239

## 命中音效（根据材质）

| 材质 | 普通 | 暴击/击杀 |
|------|------|----------|
| bird | impactBell_light | impactBell_heavy |
| fur | impactSoft_medium | impactSoft_heavy |
| shell | impactBell_light | impactBell_heavy |
| slime | impactGeneric_light | impactGeneric_light |
| bone | impactWood_light | impactWood_heavy |
| flesh | impactSoft_medium | impactSoft_heavy |

## 脚步声（未实装）
- snow, grass, concrete, wood, carpet
- 每个地面5种变体

## 总结

✅ **已实装并验证：**
- 武器音效（13种）
- 命中音效（6种材质）
- UI音效（levelup, evolve, chest, buy, heal, dash, gameover, warning）
- 金币音效（coin_pickup.mp3）
- 经验音效（exp-gain.ogg）

❌ **已禁用：**
- BGM（等待外部文件）
- 波次/生成音效（已移除）
- 圣经/辉耀音效（按需求移除）
