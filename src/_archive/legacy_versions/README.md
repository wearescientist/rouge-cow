# Legacy Versions

这些 `game_v*.js` / `game_*demo*.js` / `game_*stable*.js` 文件目前不在主运行链中。

当前主链请以 `src/config/RuntimeManifest.js` 为准：
- 入口：`index.html`
- 核心敌人：`src/systems/enemies/NewEnemy.js`
- 音频：`src/systems/AudioSystem.js` + `src/systems/AudioController.js`
- UI：`src/ui/ScreenFlowController.js` + `src/ui/SidebarHudPresenter.js`

后续整理建议：
1. 确认不再使用的历史版本文件。
2. 再统一迁移进本目录，避免搜索污染。
3. 不要在未确认引用关系前直接删除。
