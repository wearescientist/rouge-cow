# PLAN_Runtime_Consolidation_v0.33.1

## 目标
在不强行拆解 `index.html::Game` 主链的前提下，先完成一轮低风险收口，让后续真正拆分 `Room / Weapon / Enemy` 时有稳定锚点。

## 本轮范围
1. 统一版本入口：`src/config/AppVersion.js`
2. 统一运行期开关：`src/config/RuntimeFlags.js`
3. 建立资源路径目录：`src/config/AssetCatalog.js`
4. 建立现役链路清单：`src/config/RuntimeManifest.js`
5. 建立轻量级服务注册表：`src/core/GameServices.js`
6. 建立启动诊断：`src/config/RuntimeDiagnostics.js`
7. 补强存档兼容：`src/systems/save_manager.js`
8. 增加内联脚本语法检查：`scripts/verify-runtime-syntax.js`

## 原则
- 不删除旧文件
- 不切换现有主启动方式
- 不直接切换到新敌人系统
- 不硬拆 `Room / Weapon / Enemy`

## 预期收益
- 明确当前主链正在跑什么
- 降低 `window.xxx` 散乱依赖
- 让回归测试时更容易定位缺失服务
- 提前为后续模块拆分建立入口层
