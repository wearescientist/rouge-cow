# 武器系统 Bug 修复日志 v0.16.1

## 五轮逻辑自查修复总结

---

## 第一轮：变量定义和作用域问题

### Bug 1: activeEnemies 块级作用域问题 ✅
**问题**: `activeEnemies` 使用 `const` 在 `if` 块内定义，导致块外访问时出错
**修复**: 将 `activeEnemies` 的声明移到 `if` 块之外
**文件**: `index.html` 第12892行

### Bug 2: SUPER_WEAPONS 重复定义 ✅
**问题**: `SUPER_WEAPONS` 同时在 `index.html` 和 `weaponUpgrade.js` 中定义
**修复**: 从 `weaponUpgrade.js` 中移除 `SUPER_WEAPONS` 定义
**文件**: `src/systems/weaponUpgrade.js` 第199行

### Bug 3: this.timer 未定义 ✅
**问题**: `fire` 方法中设置 `this.timer`，但 Weapon 类没有定义这个属性
**修复**: 改为使用 `this.cd`
**文件**: `index.html` 第4380行

---

## 第二轮：武器升级应用逻辑

### Bug 4: 伤害重复计算 ✅
**问题**: 
- `applyUpgrade` 直接修改 `weapon.cfg.dmg`
- `getDamage` 又基于 `this.cfg.dmg` 乘以等级加成
- 导致伤害计算不准确（如 25 -> 28.75 -> 33.06，而不是 25 -> 32.5）

**修复**: 
- 添加 `baseDmg` 保存基础伤害值
- 升级时基于基础值重新计算
- 添加 `baseRange`, `baseSpeed`, `baseCd` 等保存基础值

**文件**: 
- `src/systems/weaponUpgrade.js` 第202-215行
- `index.html` 第4302行 `getDamage` 方法

### Bug 5: 属性名不匹配 ✅
**问题**: 
- 升级表中使用 `doubleStrike`, `tripleStrike`
- 发射逻辑中检查 `doubleAttack`, `tripleAttack`

**修复**: 在 `applyUpgrade` 中同时设置两种属性名
```javascript
weapon.cfg.doubleAttack = upgrade.doubleStrike;
weapon.cfg.doubleStrike = upgrade.doubleStrike;
```

**文件**: `src/systems/weaponUpgrade.js` 第246-259行

### Bug 6: 分裂效果配置结构不匹配 ✅
**问题**: 
- 升级表设置 `split: true, miniFireballs: 2`
- 发射逻辑检查 `this.cfg.split.count`

**修复**: 
- 在 `applyUpgrade` 中创建 `splitConfig` 对象
- 发射逻辑改为检查 `this.cfg.splitConfig.count`

**文件**: 
- `src/systems/weaponUpgrade.js` 第263-267行
- `index.html` 第4430行

### Bug 7: 飞刀升级 burst 未更新 ✅
**问题**: 飞刀 Lv4 双重连射应该 burst 增加到 8，但只设置了 count
**修复**: 添加 `burst: 8` 到 Lv4 升级，Lv8 添加 `burst: 15`
**文件**: `src/systems/weaponUpgrade.js` 第57, 61行

---

## 第三轮：投射物创建和更新逻辑

### Bug 8: 穿透逻辑错误 ✅
**问题**: 
```javascript
if (b.pierce-- <= 0) return false;  // 先递减再比较，逻辑混乱
```

**修复**: 重构穿透和弹跳逻辑
```javascript
let shouldDestroy = false;
if (b.bouncesLeft > 0) {
    // 弹跳逻辑...
} else {
    shouldDestroy = true;
}
if (shouldDestroy) {
    if (b.pierce > 0) {
        b.pierce--;
        b.hits.clear(); // 穿透后清除已命中记录
    } else {
        return false;
    }
}
```

**文件**: `index.html` 第15662-15693行

### Bug 9: 缺少 maxPierce 记录 ✅
**问题**: 无法追踪投射物的最大穿透次数
**修复**: 在创建投射物时添加 `maxPierce` 属性
**文件**: `index.html` 第4483, 4501, 4566, 4600行

---

## 第四轮：超武合成和进化逻辑

### Bug 10: 超武进化丢失升级历史 ✅
**问题**: `evolveToSuper` 方法覆盖 `this.cfg`，丢失升级历史
**修复**: 
- 保存升级历史并在进化后恢复
- 添加进化记录到历史
- 继承原武器的范围和速度属性

**文件**: `index.html` 第4259-4286行

---

## 第五轮：碰撞和伤害判定逻辑

### Bug 11: 伤害加成逻辑错误 ✅
**问题**: 
```javascript
if (stats.fireDmg) totalDmg += stats.fireDmg;  // 固定值加成错误
```

**修复**: 改为百分比加成
```javascript
if (stats.fireDmg) totalDmg *= (1 + stats.fireDmg);  // 百分比加成
```

**文件**: `index.html` 第15724-15726行

### Bug 12: 伤害空值保护不足 ✅
**问题**: `dmg || 1` 可能导致正常伤害被错误设为 1
**修复**: 添加更严格的检查
```javascript
let totalDmg = (typeof dmg === 'number' && dmg > 0) ? dmg : 1;
```

**文件**: `index.html` 第15724行

### Bug 13: bullet 空值访问风险 ✅
**问题**: 访问 `bullet.vx` 时没有检查 bullet 是否为 null
**修复**: 添加空值检查
```javascript
if (this.bloodStains && this.curRoom && bullet) {
    const bulletAngle = (bullet.vx !== undefined) ? Math.atan2(bullet.vy || 0, bullet.vx) : 0;
```

**文件**: `index.html` 第15749-15751行

---

## 修复统计

| 轮次 | Bug数量 | 主要问题类型 |
|------|---------|--------------|
| 第一轮 | 3 | 作用域、重复定义、未定义变量 |
| 第二轮 | 4 | 伤害计算、属性名不匹配 |
| 第三轮 | 2 | 穿透逻辑、投射物属性 |
| 第四轮 | 1 | 数据丢失 |
| 第五轮 | 3 | 伤害计算、空值保护 |
| **总计** | **13** | - |

---

## 测试建议

1. **测试武器升级**: 每种武器升到8级，验证伤害计算正确
2. **测试超武合成**: 验证进化后属性继承正确
3. **测试穿透效果**: 飞刀、魔杖等武器的穿透逻辑
4. **测试分裂效果**: 火球爆炸分裂效果
5. **测试伤害加成**: 被动道具的伤害加成是否正确应用
