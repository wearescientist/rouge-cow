# Phase 1 Patch Notes

## 本轮目标
- F9 从“只隐藏调试 UI”改成真正的 DEV 模式开关
- DebugPanel / WeaponBalanceTester 改为按需加载
- 整理当前 live 源映射
- 补一个旧文件归档脚本，避免手动乱删

## 已完成
- `index.html`
  - 移除 `DebugPanel.js` / `WeaponBalanceTester.js` 的静态常驻加载
  - 新增 F9 轻量 DEV 入口壳
  - DEV 模式切换写入 `localStorage`，切换后自动刷新
  - `Game.toggleDebugPanel()` 改为 DEV 模式下按需初始化
  - `runWeaponBalanceTest()` / `exportBalanceReport()` 改为懒加载测试器
- `src/systems/DebugPanel.js`
  - 不再自己常驻监听 F9（交给轻量壳统一处理）
  - 面板顶部新增 DEV 开关按钮
- `src/systems/WeaponBalanceTester.js`
  - 不再启动时全局 `new`
  - 改为 `window.getWeaponBalanceTester()` 懒实例化
- `src/config/AppVersion.js`
  - 升到 `v0.35.8 Stage1 Dev Toggle & Live Source Pass`
- 新增文档/脚本
  - `PHASE1_LIVE_SOURCE_MAP.md`
  - `archive_stage1_manifest.json`
  - `ARCHIVE_STAGE1_CANDIDATES.txt`
  - `archive_stage1_legacy.py`
  - `archive_stage1_legacy.bat`

## 归档脚本说明
- 默认：dry-run，仅生成报告，不移动文件
- 执行归档：
  - Windows 直接双击 `archive_stage1_legacy.bat`
  - 或命令行：`python archive_stage1_legacy.py . --apply`
- 归档路径：`src/_archive/stage1_legacy/<时间戳>/...`

## 这一轮故意没做的事
- 没做大规模文件删除，只给“可安全先归档”的清单
- 没做武器/隐藏房/敌人系统大重构
- 没做渲染缓存和 blur 限流，那是下一阶段性能项
