# 经验教训：ShopNPC.js 编码损坏事件

## 时间
2026-03-07

## 问题
浏览器报错：
```
Uncaught SyntaxError: Invalid or unexpected token (at ShopNPC.js:86:22)
[警告] shopNPC.js 未加载，创建简单后备版本
```

## 根本原因
ShopNPC.js 文件编码损坏，第86行出现乱码字符 `'馃憗锔?'`，导致 JavaScript 语法错误。

## 修复过程
1. **第一次尝试**：重写文件 - 但丢失完整功能
2. **第二次尝试**：从 backup 恢复 - 但恢复的是 `ShopNPCSystem`（对话系统），不是 `ShopNPC`（NPC实体）
3. **最终方案**：简化 `ShopNPC` 类（供 Room.js 使用）+ 依赖 index.html 后备 `shopNPCSystem`（对话功能）

## 教训
1. **备份文件命名混乱**：`ShopNPC.js` 和 `shopNPC.js` 可能是不同文件
2. **功能分离**：NPC实体绘制 和 对话系统 应该是两个独立文件
3. **编码问题**：文件可能在保存/传输过程中损坏

## 当前状态
- ShopNPC.js：简化版 `ShopNPC` 类（实体绘制）
- index.html：后备 `shopNPCSystem` 对象（基础对话功能）

## 建议
未来应将两个功能分离：
- `ShopNPC.js` - NPC实体类
- `DialogueSystem.js` - 对话系统
