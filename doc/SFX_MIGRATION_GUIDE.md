# 🎵 音效系统迁移指南 v1.0

**目标**: 将所有分散的音效调用迁移到集中式 `SoundEffectSystem`  
**状态**: 系统已创建，需要逐步替换调用位置

---

## 📍 需要替换的调用位置清单

### 1. 武器攻击音效
**文件**: `index.html`  
**搜索**: `audioCtrl.play(w.baseKey)`  
**替换为**: `this.sfx.playWeaponAttack(w.baseKey)`

**位置**:
- 第 ~5800 行附近（武器发射逻辑）

---

### 2. 敌人受击音效
**文件**: `index.html` - Enemy.takeDamage()  
**搜索**: `audioCtrl.playHit(material)` 或 `audioCtrl.playCrit()`  
**替换为**: `window.game.sfx.playEnemyHit(this.type, isCrit)`

**位置**:
- 第 ~7425 行附近

**当前代码**:
```javascript
if (isCrit) {
    window.game.audioCtrl.playCrit();
} else {
    window.game.audioCtrl.playHit(material);
}
```

**替换为**:
```javascript
window.game.sfx.playEnemyHit(this.type, isCrit);
```

---

### 3. 玩家受击音效
**文件**: `index.html` - Player.takeDamage()  
**搜索**: `audioCtrl.play('hurt')`  
**替换为**: `window.game.sfx.playPlayerHit()`

**位置**:
- 第 ~11358 行附近

---

### 4. 金币收集音效
**文件**: `index.html`  
**搜索**: `audioCtrl.play('coin')`  
**替换为**: `this.sfx.playCoinCollected()`

**位置**:
- 第 ~16985 行附近（磁铁吸收）
- 第 ~17021 行附近（玩家触碰）

---

### 5. 经验宝石收集音效
**文件**: `index.html`  
**搜索**: `audioCtrl.play('gem')`  
**替换为**: `this.sfx.playGemCollected()`

**位置**:
- 第 ~15297 行附近（房间清理吸收）
- 第 ~16901, 16948 行附近（收集）

---

### 6. 升级音效
**文件**: `index.html`  
**搜索**: `audioCtrl.play('levelup')`  
**替换为**: `this.sfx.playLevelUp()`

---

### 7. 武器进化音效
**文件**: `index.html`  
**搜索**: `audioCtrl.play('evolve')`  
**替换为**: `this.sfx.playWeaponEvolution()`

---

### 8. 宝箱开启音效
**文件**: `index.html`  
**搜索**: `audioCtrl.play('chest')`  
**替换为**: `this.sfx.playChestOpened()`

---

### 9. 治疗音效
**文件**: `index.html`  
**搜索**: `audioCtrl.play('heal')`  
**替换为**: `this.sfx.playHeal()`

---

### 10. Boss出现音效
**文件**: `index.html`  
**搜索**: `audioCtrl.play('boss')`  
**替换为**: `this.sfx.playBossAppear()`

---

### 11. 购买物品音效
**文件**: `index.html`  
**搜索**: `audioCtrl.play('buy')`  
**替换为**: `this.sfx.playBuyItem()`

---

### 12. UI点击音效
**文件**: `index.html`  
**搜索**: `audioCtrl.play('click')`  
**替换为**: `this.sfx.playUIClick()`

---

### 13. 脚步音效
**文件**: `index.html`  
**搜索**: `audioCtrl.play(stepSound)`  
**替换为**: `this.sfx.playFootstep(this.currentFloor)`

**位置**:
- 第 ~16298 行附近（玩家移动）

---

### 14. BGM切换
**文件**: `index.html`  
**搜索**: `audio.playBGM(...)`  
**替换为**: `this.sfx.playBGM(...)` 或 `this.sfx.playBGMForRoom(room)`

**位置**:
- 游戏开始
- 房间切换
- Boss战

---

### 15. 宠物攻击音效
**文件**: `PetSystem.js`  
**搜索**: `this.game.audioCtrl.play(...)`  
**替换为**: `this.game.sfx.playPetAttack(attackType)`

**位置**:
- Pet.fire() 方法

---

## 🔧 快速替换命令

### 批量替换示例
```bash
# 金币音效
sed -i "s/audioCtrl\.play('coin')/sfx.playCoinCollected()/g" index.html

# 宝石音效
sed -i "s/audioCtrl\.play('gem')/sfx.playGemCollected()/g" index.html

# 升级音效
sed -i "s/audioCtrl\.play('levelup')/sfx.playLevelUp()/g" index.html
```

---

## ✅ 迁移检查清单

- [ ] 武器攻击音效迁移
- [ ] 敌人受击音效迁移
- [ ] 玩家受击音效迁移
- [ ] 收集音效迁移（金币/宝石/经验）
- [ ] 系统音效迁移（升级/进化/治疗）
- [ ] UI音效迁移
- [ ] 脚步音效迁移
- [ ] BGM切换迁移
- [ ] 宠物音效迁移
- [ ] 测试验证

---

## 📝 注意事项

1. **window.game 访问**: 在类方法中使用 `window.game.sfx`，在 Game 类内部使用 `this.sfx`
2. **PetSystem 访问**: 使用 `this.game.sfx`（因为 pet 持有 game 引用）
3. **Enemy 访问**: 使用 `window.game.sfx`（因为 enemy 不直接持有 game）
4. **BGM**: BGM 控制仍在 `this.audio` 上，但建议通过 `this.sfx.playBGM()` 统一调用

---

## 🎯 迁移完成后

所有音效调用都通过 `game.sfx` 对象，修改音效只需修改 `SoundEffectSystem.js` 中的方法实现。
