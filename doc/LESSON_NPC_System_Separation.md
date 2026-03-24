# 经验教训：NPC系统分离

## 问题
把两个不同功能的系统混在一起了：
1. **ShopNPC** - NPC实体类（绘制、碰撞）
2. **ShopNPCSystem** - 对话系统（复杂对话框、打字机效果）

## 解决方案
正确分离为两个文件：

### shopNPC.js
- 供 Room.js 使用
- 提供 `class ShopNPC`
- 提供 `const TOTEMS`（TotemManager依赖）

### ShopNPCDialogue.js  
- 供游戏交互使用
- 提供 `class ShopNPCSystem`
- 提供复杂对话功能

## index.html 引用顺序
```html
<script src="src/systems/shopNPC.js"></script>
<script src="src/systems/ShopNPCDialogue.js"></script>
```

## 教训
1. **功能分离**：实体绘制和对话系统应该分开
2. **命名清晰**：ShopNPC vs ShopNPCSystem 容易混淆
3. **依赖管理**：TOTEMS 被多个系统依赖，要放在基础文件
