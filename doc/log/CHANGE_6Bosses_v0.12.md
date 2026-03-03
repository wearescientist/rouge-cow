# 6层Boss改造说明 v0.12.0

## 概述
将原本单一的母虫Boss改造为6层各有独立Boss，使用yellow文件夹中的贴图。

## 新Boss设定

| 楼层 | Boss名称 | 贴图 | 故事身份 | 特色 |
|------|---------|------|----------|------|
| 1 | 跳跳 | rabbit_yellow | 被寄生的草原袋鼠 | 速度型，高机动 |
| 2 | 铁爪 | bird_yellow | 被寄生的金雕 | 空中攻击，带小怪 |
| 3 | 泥背 | turtle_yellow | 背甲变成孵化场的老象龟 | 高防御，低机动 |
| 4 | 银牙 | squirrel_yellow | 狼群首领 | 突击型，召唤狼群 |
| 5 | 铁角(哥哥) | pig_yellow | 同来救父母的兄长 | 已部分寄生，全面型 |
| 6 | 深渊母体 | boss6_yellow | 母虫真身 | **静止不动**，超大体型 |

## 关键代码修改

### 1. BOSS_TYPES 配置
```javascript
// 原来: 只有mother一个配置
// 现在: floor1~floor6 六个独立配置
const BOSS_TYPES = {
    floor1: { name: '跳跳', sprite: 'rabbit_yellow', ... },
    floor2: { name: '铁爪', sprite: 'bird_yellow', ... },
    floor3: { name: '泥背', sprite: 'turtle_yellow', ... },
    floor4: { name: '银牙', sprite: 'squirrel_yellow', ... },
    floor5: { name: '铁角(哥哥)', sprite: 'pig_yellow', ... },
    floor6: { name: '深渊母体', sprite: 'boss6_yellow', 
              isStatic: true, speed: 0, ... }  // 静止特殊处理
};
```

### 2. Boss生成逻辑
- 根据`window.game.currentFloor`选择对应Boss配置
- 设置`boss.bossFloor`记录楼层
- 第6层设置`isStatic = true`

### 3. 静止Boss逻辑 (第6层)
```javascript
// updateBossAI中
if (this.isStatic || floor === 6) {
    // 只执行技能，不移动
    this.updateBossSkillLogic(...);
    return;
}
```

### 4. 特殊大小绘制 (第6层)
```javascript
// drawWithOffset中
if (this.isBoss && this.bossFloor === 6) {
    drawWidth = 150;   // 300像素宽
    drawHeight = 225;  // 450像素高
}
```

### 5. 贴图加载
- 添加`'boss6'`到`allEnemies`数组
- 自动加载`outlined_by_color/yellow/boss6.png`为`boss6_yellow`

## 技能系统

每个Boss都有独立的技能配置：
- **charge**: 冲撞攻击 (第6层禁用)
- **bullet_hell**: 弹幕齐射
- **summon**: 召唤小怪
- **shockwave**: 震荡波
- **homing**: 追踪弹

## 测试建议

1. **第1-5层**: 测试Boss移动和技能正常工作
2. **第6层**: 验证Boss固定在房间中央不移动
3. **贴图显示**: 确认300x450大小正确显示
4. **血条位置**: 确认血条在正确位置

## 备份位置
`backup/rougelike-cow-v0.12.0-6bosses-20260224.zip`
