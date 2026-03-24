# v0.35.9 Dev Settings & Debug Panel Cleanup

## 本次内容
- DEV 模式移入游戏设置
- F9 改回直接打开测试面板；未开启 DEV 时仅提示
- DebugPanel 重做为分组/折叠结构
- 移除无效的发光调节区块
- 调试工具仍保持按需加载，不再常驻初始化

## 主要改动文件
- index.html
- src/ui/GameSettingsStore.js
- src/ui/SettingsController.js
- src/systems/DebugPanel.js
- src/config/AppVersion.js
