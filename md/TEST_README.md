# 🧪 重开游戏攻击测试

## 问题描述
重新开始游戏后，武器无法自动攻击。

## 修复内容
在 `restartGame()` 方法中添加了关键状态重置：
```javascript
this.lastT = null;      // 重置时间戳，防止dt计算为负数
this.timeScale = 1;     // 重置游戏速度
```

## 测试方法

### 方法1：双击运行（推荐）
```
双击 auto_test.bat
或
右键 auto_test.ps1 → 使用 PowerShell 运行
```

### 方法2：浏览器手动测试
```
1. 打开 Chrome/Edge
2. 访问: file:///E:/AI/game/rougelike-cow/index.html?test=restart
3. 按 F12 打开控制台
4. 等待约30秒查看结果
```

### 方法3：VS Code Live Server
```
1. 在 VS Code 中打开项目
2. 点击 "Go Live" 启动服务器
3. 在 URL 后添加 ?test=restart
4. 观察控制台输出
```

## 测试结果判断

| 结果 | 表现 | 含义 |
|------|------|------|
| ✅ 通过 | 页面背景变绿色 | 重开游戏后可以正常攻击 |
| ❌ 失败 | 页面背景变红色 | 重开游戏后无法攻击 |

## 技术细节

**问题根本原因：**
- `loop()` 函数使用 `this.lastT` 计算时间差 `dt`
- 重新开始游戏时没有重置 `lastT`
- 导致 `dt` 为负数，武器冷却不断增加

**修复验证：**
- [x] `restartGame()` 中重置 `lastT = null`
- [x] `restartGame()` 中重置 `timeScale = 1`
- [x] 更新 UI 按钮状态
- [x] 添加自动测试代码
